"""Server runtime: owns config, engine state and a device driver; runs the loop.

The same runtime serves all three editions (ADR-0002). Drivers translate between
devices and the core's Snapshot/Actions; the runtime never talks to devices itself.
"""

from __future__ import annotations

import asyncio
import contextlib
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from typing import Protocol

from radiate import __version__
from radiate.core import Actions, EngineState, HouseConfig, Mode, Reason, Snapshot, decide
from radiate.core.persist import dump_state, load_state
from radiate.core.types import BoilerState, RoomRole


class Driver(Protocol):
    """Talks to real or simulated devices."""

    name: str

    async def snapshot(
        self, mode: Mode, overrides: dict[str, float], store_boost: bool, fire: set[str]
    ) -> Snapshot: ...

    async def apply(self, actions: Actions) -> None: ...

    def clock(self) -> float: ...

    def wall_minutes(self) -> int: ...

    def telemetry(self) -> dict: ...

    # Optional: `next_change_s(room_id) -> float | None`, seconds until the room's
    # schedule next changes its setpoint. Without it, overrides last until cleared.


OVERRIDE_UNTIL = ("next_change", "duration", "cleared")
OVERRIDE_MAX_MIN = 7 * 24 * 60


@dataclass
class Override:
    """A manual setpoint for one room and when it ends (driver clock seconds)."""

    setpoint: float
    until: str  # one of OVERRIDE_UNTIL
    expires_at: float | None  # None: until cleared


@dataclass
class DecisionRecord:
    at: float
    code: str
    message: str
    room_id: str | None


@dataclass
class Runtime:
    cfg: HouseConfig
    driver: Driver
    house_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tick_s: float = 60.0
    state: EngineState = field(init=False)
    mode: Mode = Mode.AUTO
    overrides: dict[str, float] = field(default_factory=dict)  # setpoints the driver applies
    override_meta: dict[str, Override] = field(default_factory=dict)  # when each one ends
    fire: set[str] = field(default_factory=set)
    store_boost_until: float = 0.0
    last_actions: Actions | None = None
    last_snapshot: Snapshot | None = None
    decisions: deque[DecisionRecord] = field(default_factory=lambda: deque(maxlen=500))
    relay_history: deque[tuple[float, bool, bool]] = field(
        default_factory=lambda: deque(maxlen=2880)
    )
    listeners: list[asyncio.Queue] = field(default_factory=list)
    exporter: object | None = None  # radiate.export.elastic.ElasticExporter
    store: object | None = None  # radiate.server.store.Store; None keeps state in memory
    save_every_s: float = 300.0
    _saved_at: float | None = None
    _alert_keys: set[tuple[str, str | None, str]] = field(default_factory=set)
    _task: asyncio.Task | None = None

    def __post_init__(self) -> None:
        self.state = EngineState.new(self.cfg)

    # --- persistence ---------------------------------------------------------------------

    def restore(self) -> list[str]:
        """Load the house id, mode and engine state from the store, if any."""
        if self.store is None:
            return []
        saved_id = self.store.get("house_id")
        if saved_id is not None and isinstance(saved_id[0], str):
            self.house_id = saved_id[0]
        else:
            self.store.put("house_id", self.house_id)
        saved_rt = self.store.get("runtime")
        if saved_rt is not None and isinstance(saved_rt[0], dict):
            with contextlib.suppress(ValueError):
                self.mode = Mode(saved_rt[0].get("mode", "auto"))
            self._restore_overrides(saved_rt[0].get("overrides"), time.time() - saved_rt[1])
        saved = self.store.get("engine")
        if saved is None:
            return []
        data, saved_wall = saved
        elapsed = max(0.0, time.time() - saved_wall)
        self.state, problems = load_state(self.cfg, data, self.driver.clock(), elapsed)
        self._saved_at = self.driver.clock()
        return problems

    def save(self) -> None:
        if self.store is None:
            return
        now = self.driver.clock()
        self.store.put("engine", dump_state(self.state, now))
        self._save_runtime(now)
        self._saved_at = now

    def _save_runtime(self, now: float) -> None:
        if self.store is None:
            return
        overrides = {}
        for rid, sp in self.overrides.items():
            meta = self.override_meta.get(rid)
            left = None if meta is None or meta.expires_at is None else meta.expires_at - now
            # Stored as time left, like engine timers: the clock restarts with the process.
            overrides[rid] = {
                "setpoint": sp,
                "until": meta.until if meta else "cleared",
                "remaining_s": left,
            }
        self.store.put("runtime", {"mode": self.mode.value, "overrides": overrides})

    def _restore_overrides(self, data: object, elapsed_s: float) -> None:
        if not isinstance(data, dict):
            return
        now = self.driver.clock()
        rooms = {r.id for r in self.cfg.rooms}
        for rid, item in data.items():
            if rid not in rooms or not isinstance(item, dict):
                continue
            sp, until, left = item.get("setpoint"), item.get("until"), item.get("remaining_s")
            if not isinstance(sp, (int, float)) or until not in OVERRIDE_UNTIL:
                continue
            expires = None
            if isinstance(left, (int, float)):
                left -= max(0.0, elapsed_s)
                if left <= 0:
                    continue  # ended while Radiate was down
                expires = now + left
            self.overrides[rid] = float(sp)
            self.override_meta[rid] = Override(float(sp), until, expires)

    # --- setpoint overrides ----------------------------------------------------------

    def set_override(
        self, room_id: str, setpoint: float, until: str | None = None, minutes: float | None = None
    ) -> Override:
        """Hold a room at `setpoint` until its next schedule change (the default), for
        `minutes`, or until cleared. Saved straight away, so a restart keeps it."""
        now = self.driver.clock()
        if minutes is not None:
            if until not in (None, "duration"):
                raise ValueError("give either until or a duration, not both")
            until = "duration"
        until = until or "next_change"
        if until not in OVERRIDE_UNTIL:
            raise ValueError(f"until must be one of {', '.join(OVERRIDE_UNTIL)}")
        expires: float | None = None
        if until == "duration":
            if minutes is None or not 1 <= minutes <= OVERRIDE_MAX_MIN:
                raise ValueError(f"duration_min must be 1 to {OVERRIDE_MAX_MIN}")
            expires = now + minutes * 60
        elif until == "next_change":
            nxt = getattr(self.driver, "next_change_s", None)
            left = nxt(room_id) if callable(nxt) else None
            if left is None:
                until = "cleared"  # no schedule to end it
            else:
                expires = now + left
        override = Override(setpoint, until, expires)
        self.overrides[room_id] = setpoint
        self.override_meta[room_id] = override
        self._save_runtime(now)
        return override

    def clear_override(self, room_id: str) -> None:
        self.overrides.pop(room_id, None)
        self.override_meta.pop(room_id, None)
        self._save_runtime(self.driver.clock())

    def _expire_overrides(self, now: float) -> None:
        expired = [
            rid
            for rid, meta in self.override_meta.items()
            if meta.expires_at is not None and now >= meta.expires_at
        ]
        for rid in expired:
            self.overrides.pop(rid, None)
            self.override_meta.pop(rid, None)
        if expired:
            self._save_runtime(now)

    def override_view(self, room_id: str, now: float) -> dict | None:
        if room_id not in self.overrides:
            return None
        meta = self.override_meta.get(room_id)
        expires = meta.expires_at if meta else None
        return {
            "setpoint": self.overrides[room_id],
            "until": meta.until if meta else "cleared",
            "expires_in_min": None if expires is None else max(0, round((expires - now) / 60)),
        }

    async def step(self) -> Actions:
        now = self.driver.clock()
        self._expire_overrides(now)
        snap = await self.driver.snapshot(
            self.mode, self.overrides, now < self.store_boost_until, self.fire
        )
        actions = decide(self.cfg, snap, self.state)
        await self.driver.apply(actions)
        driver_alerts = getattr(self.driver, "alerts", None)
        if callable(driver_alerts):
            actions.alerts.extend(driver_alerts())
        if self.store is not None and (
            self._saved_at is None or now - self._saved_at >= self.save_every_s
        ):
            self.save()
        self.last_actions, self.last_snapshot = actions, snap
        self.relay_history.append((now, actions.heating_relay, actions.store_relay))
        logged = []
        for r in actions.reasons:
            if r.code.startswith(("boiler.", "disturbance.", "safe_mode.")):
                self._log(now, r)
                logged.append((r.code, r.message, r.room_id))
        # Alerts repeat every tick while they hold; log each one when it first appears
        # or when its message changes.
        keys = set()
        for r in actions.alerts:
            key = (r.code, r.room_id, r.message)
            keys.add(key)
            if key not in self._alert_keys:
                self._log(now, r)
                logged.append((r.code, r.message, r.room_id))
        self._alert_keys = keys
        payload = self.describe()
        if self.exporter is not None:
            self.exporter.record(payload, logged)
        for q in list(self.listeners):
            if q.full():
                with contextlib.suppress(asyncio.QueueEmpty):
                    q.get_nowait()
            q.put_nowait(payload)
        return actions

    def _log(self, now: float, r: Reason) -> None:
        self.decisions.append(DecisionRecord(now, r.code, r.message, r.room_id))

    async def run(self, interval_s: float) -> None:
        while True:
            started = time.monotonic()
            await self.step()
            await asyncio.sleep(max(0.0, interval_s - (time.monotonic() - started)))

    def start(self, interval_s: float) -> None:
        self._task = asyncio.get_running_loop().create_task(self.run(interval_s))

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
        self.save()

    # --- views ---------------------------------------------------------------------------

    def house(self) -> dict:
        return {
            "id": self.house_id,
            "version": __version__,
            "driver": self.driver.name,
            "rooms": [
                {
                    "id": r.id,
                    "name": r.name,
                    "role": r.role.value,
                    "heat_source": r.heat_source.value if r.heat_source else None,
                    "controllable": r.controllable,
                }
                for r in self.cfg.rooms
            ],
            "boiler": {
                "min_burn_s": self.cfg.boiler.min_burn_s,
                "min_off_s": self.cfg.boiler.min_off_s,
                "max_starts_per_hour": self.cfg.boiler.max_starts_per_hour,
            },
        }

    def describe(self) -> dict:
        snap, acts, st = self.last_snapshot, self.last_actions, self.state
        now = self.driver.clock()
        rooms = []
        reasons_by_room: dict[str, str] = {}
        if acts:
            for r in acts.reasons:
                if r.room_id:
                    reasons_by_room[r.room_id] = r.message
        for rc in self.cfg.rooms:
            inp = snap.rooms.get(rc.id) if snap else None
            item = {
                "id": rc.id,
                "name": rc.name,
                "role": rc.role.value,
                "heat_source": rc.heat_source.value if rc.heat_source else None,
                "temperature": inp.temperature
                if inp and rc.role is not RoomRole.INTERNAL_SENSOR_ONLY
                else None,
                "humidity": inp.humidity if inp else None,
                "setpoint": inp.setpoint if inp else None,
                "next_setpoint": inp.next_setpoint if inp else None,
                "next_in_min": round(inp.next_setpoint_in_s / 60)
                if inp and inp.next_setpoint_in_s is not None
                else None,
                "override": self.override_view(rc.id, now),
            }
            rs = st.rooms.get(rc.id)
            if rs is not None:
                v = acts.valves.get(rc.id) if acts else None
                item.update(
                    temperature=round(rs.temperature, 2) if rs.temperature is not None else None,
                    target=rs.target,
                    opening=v.opening if v else None,
                    calling=rs.calling,
                    topup=rs.topup,
                    preheating=rs.preheating,
                    fire=rs.dist.fire,
                    learning=rs.learning_gate,
                    model={
                        "a": round(rs.est.a, 3),
                        "b": round(rs.est.b, 4),
                        "d": round(rs.est.d, 3),
                        "confidence": round(rs.est.confidence, 2),
                        "samples": rs.est.samples,
                        "arrival_lag_min": round(rs.arrival_lag_s / 60, 1),
                        "lockshield": rs.lockshield,
                    },
                    reason=reasons_by_room.get(rc.id),
                )
            rooms.append(item)

        guard = st.boiler
        sc = st.short_cycle
        burns, stores = _intervals(self.relay_history, now)
        return {
            "now": now,
            "minute_of_day": self.driver.wall_minutes(),
            "mode": self.mode.value,
            "outdoor": snap.outdoor if snap else None,
            "boiler": {
                "state": guard.state.value,
                "relay": acts.heating_relay if acts else False,
                "burn_elapsed_s": guard.burn_elapsed(now)
                if guard.state is BoilerState.FIRING
                else 0,
                "state_elapsed_s": now - guard.since,
                "starts_last_hour": guard.starts_last_hour(now),
                "predicted_burn_min": round(st.allocation.t_star_h * 60) if st.allocation else 0,
                "supply": round(st.supply, 3),
                # Effective minimum off, raised while short-cycling was seen (spec 7).
                "min_off_s": sc.min_off_s(self.cfg.boiler.min_off_s),
                "short_cycle": {
                    "extra_off_min": round(sc.extra_off_s / 60),
                    "ends_in_h": round(max(0.0, sc.until - now) / 3600, 1),
                }
                if sc.extra_off_s > 0 and sc.until is not None
                else None,
            },
            "store": {
                "relay": acts.store_relay if acts else False,
                "boost": now < self.store_boost_until,
            },
            "rooms": rooms,
            "timeline": {"burns": burns, "store": stores, "window_s": 86400},
            "alerts": [a.message for a in acts.alerts] if acts else [],
            "telemetry": self.driver.telemetry(),
        }


def _intervals(history: deque[tuple[float, bool, bool]], now: float) -> tuple[list, list]:
    burns: list[list[float]] = []
    stores: list[list[float]] = []
    for idx, out in ((1, burns), (2, stores)):
        start = None
        for item in history:
            t, on = item[0], item[idx]
            if on and start is None:
                start = t
            elif not on and start is not None:
                out.append([start - now, t - now])
                start = None
        if start is not None:
            out.append([start - now, 0.0])
    return burns, stores
