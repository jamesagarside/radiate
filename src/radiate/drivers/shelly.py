"""Shelly Gen4 (2PM) boiler relay driver over local RPC (spec 5.5, 5.7).

- Channel `heating_switch` calls the boiler for central heating. Every command that
  turns it on also re-arms `toggle_after`, so the relay switches itself off if
  Radiate stops re-asserting it.
- Channel `store_switch` enables the hot-water store.
- Every minute Radiate writes its heartbeat to KVS key `radiate_hb` (unix seconds).
  The watchdog script (`shelly/radiate-watchdog.js`) takes over when it goes stale,
  using the fallback windows Radiate keeps in `radiate_heat` and `radiate_store`.

HTTP digest authentication (SHA-256) when the device has a password; user `admin`.
API reference: shelly-api-docs.shelly.cloud, gen2 Switch, KVS, Script, Authentication.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
import secrets
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from radiate.config import ShellyConfig, WeekSchedule

LOG = logging.getLogger(__name__)

HEARTBEAT_KEY = "radiate_hb"
HEAT_KEY = "radiate_heat"
STORE_KEY = "radiate_store"
KVS_MAX_VALUE = 253
SCRIPT_NAME = "radiate-watchdog"
SCRIPT_CHUNK = 1024
_PKG_SCRIPT = Path(__file__).resolve().parents[1] / "shelly" / "radiate-watchdog.js"  # wheel
_REPO_SCRIPT = Path(__file__).resolve().parents[3] / "shelly" / "radiate-watchdog.js"
WATCHDOG_PATH = _PKG_SCRIPT if _PKG_SCRIPT.exists() else _REPO_SCRIPT
FALLBACK_LEAD_MIN = 60
MAX_WINDOWS = 4


class ShellyError(RuntimeError):
    pass


# --- pure helpers ----------------------------------------------------------------------


def _parse_pairs(text: str) -> dict[str, str]:
    out = {}
    for m in re.finditer(r'(\w+)=(?:"([^"]*)"|([^",\s]*))', text):
        out[m.group(1).lower()] = m.group(2) if m.group(2) is not None else m.group(3)
    return out


def challenge(header: str) -> dict[str, str]:
    if not header.lower().startswith("digest "):
        raise ShellyError(f"unsupported authentication challenge: {header[:40]!r}")
    return _parse_pairs(header[7:])


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def digest_header(
    password: str,
    chal: dict[str, str],
    nc: int,
    cnonce: str,
    method: str = "POST",
    uri: str = "/rpc",
    username: str = "admin",
) -> str:
    """RFC 7616 `Authorization: Digest` value with SHA-256 and qop=auth."""
    algorithm = chal.get("algorithm", "SHA-256")
    if algorithm.upper() != "SHA-256":
        raise ShellyError(f"unsupported digest algorithm {algorithm}")
    realm, nonce = chal["realm"], chal["nonce"]
    ha1 = _sha256(f"{username}:{realm}:{password}")
    ha2 = _sha256(f"{method}:{uri}")
    ncs = f"{nc:08x}"
    response = _sha256(f"{ha1}:{nonce}:{ncs}:{cnonce}:auth:{ha2}")
    return (
        f'Digest username="{username}", realm="{realm}", nonce="{nonce}", uri="{uri}", '
        f'algorithm=SHA-256, qop=auth, nc={ncs}, cnonce="{cnonce}", response="{response}"'
    )


def chunks(code: str, size: int = SCRIPT_CHUNK) -> list[str]:
    return [code[i : i + size] for i in range(0, len(code), size)] or [""]


def fallback_heating_windows(
    schedules: list[WeekSchedule], weekday: int, lead_min: int = FALLBACK_LEAD_MIN
) -> list[list[int]]:
    """Daily windows for the watchdog's heating channel, from the room schedules.

    A window is any time some room wants more than its lowest setpoint of the day,
    started `lead_min` early because the fallback cannot do optimum start. Merged and
    capped at 4 windows so it fits a KVS value.
    """
    spans: list[list[int]] = []
    for week in schedules:
        day = week.days[weekday % 7]
        low = min(sp for _, sp in day.transitions)
        bounds = [*day.transitions, (1440, low)]
        for (start, sp), (end, _) in zip(bounds, bounds[1:], strict=False):
            if sp > low:
                spans.append([max(0, start - lead_min), end])
    spans.sort()
    merged: list[list[int]] = []
    for s in spans:
        if merged and s[0] <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], s[1])
        else:
            merged.append(list(s))
    while len(merged) > MAX_WINDOWS:
        # Join the two windows with the shortest gap between them.
        gaps = [merged[i + 1][0] - merged[i][1] for i in range(len(merged) - 1)]
        i = gaps.index(min(gaps))
        merged[i : i + 2] = [[merged[i][0], merged[i + 1][1]]]
    return merged


def kvs_windows(windows: list[list[int]] | tuple) -> str:
    value = json.dumps([list(w) for w in windows], separators=(",", ":"))
    if len(value) > KVS_MAX_VALUE:
        raise ShellyError("schedule too long for a KVS value")
    return value


@dataclass(frozen=True, slots=True)
class SwitchStatus:
    output: bool
    apower: float | None = None
    timer_duration: float | None = None


@dataclass(frozen=True, slots=True)
class WatchdogStatus:
    installed: bool
    code_matches: bool = False
    enabled: bool = False
    running: bool = False
    script_id: int | None = None

    @property
    def ok(self) -> bool:
        return self.installed and self.code_matches and self.enabled and self.running


# --- RPC client --------------------------------------------------------------------------


class ShellyRpc:
    """JSON-RPC over HTTP POST /rpc, with digest auth when a password is set."""

    def __init__(self, host: str, password: str | None, session, timeout_s: float = 5.0):
        self.url = f"http://{host}/rpc"
        self.password = password
        self.session = session
        self.timeout_s = timeout_s
        self._chal: dict[str, str] | None = None
        self._nc = 0
        self._id = 0

    def _auth(self) -> dict[str, str]:
        if self._chal is None or not self.password:
            return {}
        self._nc += 1
        cnonce = secrets.token_hex(8)
        return {"Authorization": digest_header(self.password, self._chal, self._nc, cnonce)}

    async def call(self, method: str, params: dict[str, Any] | None = None) -> Any:
        self._id += 1
        body = {"id": self._id, "method": method}
        if params:
            body["params"] = params
        for attempt in range(2):
            async with self.session.post(
                self.url, json=body, headers=self._auth(), timeout=self.timeout_s
            ) as resp:
                if resp.status == 401:
                    if not self.password:
                        raise ShellyError("Shelly requires a password (shelly.password)")
                    if attempt:
                        raise ShellyError("Shelly rejected the password")
                    self._chal = challenge(resp.headers.get("WWW-Authenticate", ""))
                    self._nc = 0
                    continue
                data = await resp.json(content_type=None)
                if resp.status >= 300 and not isinstance(data, dict):
                    raise ShellyError(f"{method}: HTTP {resp.status}")
                break
        if "error" in data:
            err = data["error"]
            raise ShellyError(f"{method}: {err.get('message', err)}")
        return data.get("result")


# --- boiler relay ------------------------------------------------------------------------


class ShellyBoiler:
    """The two boiler channels, heartbeat and watchdog on one Shelly."""

    def __init__(self, cfg: ShellyConfig, rpc: ShellyRpc, dry_run: bool = True):
        self.cfg = cfg
        self.rpc = rpc
        self.dry_run = dry_run
        self.heating: SwitchStatus | None = None
        self.store: SwitchStatus | None = None
        self.reachable = False
        self.errors = 0
        self._kvs_sent: dict[str, str] = {}
        self.intended: list[tuple[str, dict]] = []  # dry run: what would have been sent

    async def _write(self, method: str, params: dict[str, Any]) -> Any:
        if self.dry_run:
            self.intended.append((method, params))
            del self.intended[:-50]
            LOG.info("dry run: would call Shelly %s %s", method, params)
            return None
        return await self.rpc.call(method, params)

    async def refresh(self) -> None:
        try:
            h = await self.rpc.call("Switch.GetStatus", {"id": self.cfg.heating_switch})
            s = await self.rpc.call("Switch.GetStatus", {"id": self.cfg.store_switch})
        except Exception as err:
            self.reachable = False
            self.errors += 1
            LOG.warning("Shelly %s unreachable: %r", self.cfg.host, err)
            return
        self.heating = _switch(h)
        self.store = _switch(s)
        self.reachable = True

    async def command(self, heating: bool, store: bool, unix_now: int) -> None:
        """Assert both channels and the heartbeat. Called once per control tick."""
        try:
            params: dict[str, Any] = {"id": self.cfg.heating_switch, "on": heating}
            if heating:
                params["toggle_after"] = int(self.cfg.auto_off_s)
            await self._write("Switch.Set", params)
            if self.store is None or self.store.output != store:
                await self._write("Switch.Set", {"id": self.cfg.store_switch, "on": store})
            await self._write("KVS.Set", {"key": HEARTBEAT_KEY, "value": int(unix_now)})
        except Exception as err:
            self.errors += 1
            LOG.warning("Shelly command failed: %s", err)

    async def push_fallback(self, heat: list[list[int]], store: list[list[int]] | tuple) -> None:
        """Keep the watchdog's fallback windows current (written only when changed)."""
        for key, windows in ((HEAT_KEY, heat), (STORE_KEY, store)):
            value = kvs_windows(windows)
            if self._kvs_sent.get(key) == value:
                continue
            try:
                await self._write("KVS.Set", {"key": key, "value": value})
                self._kvs_sent[key] = value
            except Exception as err:
                self.errors += 1
                LOG.warning("Shelly KVS.Set %s failed: %s", key, err)

    # --- watchdog script ------------------------------------------------------------

    async def watchdog_status(self, code: str) -> WatchdogStatus:
        listing = await self.rpc.call("Script.List")
        script = next((s for s in listing.get("scripts", []) if s["name"] == SCRIPT_NAME), None)
        if script is None:
            return WatchdogStatus(installed=False)
        sid = script["id"]
        installed = await self._read_code(sid)
        status = await self.rpc.call("Script.GetStatus", {"id": sid})
        return WatchdogStatus(
            installed=True,
            code_matches=installed == code,
            enabled=bool(script.get("enable")),
            running=bool(status.get("running")),
            script_id=sid,
        )

    async def _read_code(self, sid: int) -> str:
        out, offset = [], 0
        while True:
            part = await self.rpc.call(
                "Script.GetCode", {"id": sid, "offset": offset, "len": SCRIPT_CHUNK}
            )
            data = part.get("data", "")
            out.append(data)
            offset += len(data.encode())
            if not part.get("left") or not data:
                return "".join(out)

    async def install_watchdog(self, code: str) -> WatchdogStatus:
        """Create or update the watchdog script, enable it on boot and start it.

        Always writes, even in dry run: the caller asks for this explicitly.
        """
        current = await self.watchdog_status(code)
        sid = current.script_id
        if sid is None:
            sid = (await self.rpc.call("Script.Create", {"name": SCRIPT_NAME}))["id"]
        if not current.code_matches:
            if current.running:
                await self.rpc.call("Script.Stop", {"id": sid})
            for i, part in enumerate(chunks(code)):
                await self.rpc.call("Script.PutCode", {"id": sid, "code": part, "append": i > 0})
        if not current.enabled:
            await self.rpc.call("Script.SetConfig", {"id": sid, "config": {"enable": True}})
        status = await self.rpc.call("Script.GetStatus", {"id": sid})
        if not status.get("running"):
            await self.rpc.call("Script.Start", {"id": sid})
        return await self.watchdog_status(code)

    def telemetry(self) -> dict:
        return {
            "shelly_reachable": self.reachable,
            "heating_output": self.heating.output if self.heating else None,
            "heating_power_w": self.heating.apower if self.heating else None,
            "store_output": self.store.output if self.store else None,
            "shelly_errors": self.errors,
        }


def _switch(data: dict) -> SwitchStatus:
    ap = data.get("apower")
    td = data.get("timer_duration")
    return SwitchStatus(
        output=bool(data.get("output")),
        apower=float(ap) if isinstance(ap, (int, float)) else None,
        timer_duration=float(td) if isinstance(td, (int, float)) else None,
    )


def watchdog_code() -> str:
    return WATCHDOG_PATH.read_text(encoding="utf-8")
