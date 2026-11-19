"""Zigbee2MQTT mapping for the Sonoff TRVZB and SNZB-02B (spec 3, 4.5).

Pure: no MQTT, no clock. The caller passes monotonic `now` and raw messages in, and
gets device readings and `/set` payloads out. The MQTT transport lives in
`radiate.drivers.mqtt`.

Attribute names and value ranges are from the Zigbee2MQTT converter
(`zigbee-herdsman-converters` `src/devices/sonoff.ts`, TRVZB definition):

- `occupied_heating_setpoint` 4 to 35 °C in 0.5 steps
- `system_mode` off, auto, heat; `running_state` idle, heat
- `valve_opening_degree`, `valve_closing_degree` 0 to 100 % (fw >= 1.1.4)
- `external_temperature_input` 0 to 99.9 °C in 0.1 steps (fw >= 1.2.1)
- `temperature_sensor_select` local_temperature, remote_temperature, remote_source_offline
- `smart_temperature_control` true/false (adaptive PID; disables opening limits)
- `weekly_schedule_<day>` "HH:mm/temp ...", used when `system_mode` is auto
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from radiate.core.types import ValveAction

GOVERNED_STATIC = {
    "valve_closing_degree": 100,
    "smart_temperature_control": False,
}
SETPOINT_MIN, SETPOINT_MAX = 4.0, 35.0
EXTERNAL_MIN, EXTERNAL_MAX = 0.0, 99.9
RECONCILE_GRACE_S = 5 * 60
SETPOINT_GRACE_S = 2 * 60  # the TRV's own schedule can move the setpoint at a transition
MAX_ATTEMPTS = 3
# Echo tolerances: values within these are treated as matching.
TOLERANCE = {
    "occupied_heating_setpoint": 0.26,
    "external_temperature_input": 0.15,
    "valve_opening_degree": 1.0,
    "valve_closing_degree": 1.0,
}


def parse_json(payload: bytes | str) -> dict[str, Any]:
    """A Zigbee2MQTT state message as a dict, or {} if it is not a JSON object."""
    try:
        data = json.loads(payload)
    except (ValueError, TypeError):
        return {}
    return data if isinstance(data, dict) else {}


def parse_availability(payload: bytes | str) -> bool | None:
    """`{"state": "online"}` (current) or bare `online` (legacy)."""
    text = payload.decode() if isinstance(payload, bytes) else payload
    text = text.strip()
    data = parse_json(text)
    state = data.get("state") if data else text.strip('"')
    if state == "online":
        return True
    if state == "offline":
        return False
    return None


def _num(v: Any) -> float | None:
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return None
    return float(v)


@dataclass(slots=True)
class Device:
    """Latest known state of one Zigbee2MQTT device."""

    values: dict[str, Any] = field(default_factory=dict)
    seen: dict[str, float] = field(default_factory=dict)  # attribute -> monotonic time
    last_message: float | None = None
    available: bool | None = None  # None: Z2M availability not reported

    def update(self, data: dict[str, Any], now: float) -> None:
        for key, value in data.items():
            self.values[key] = value
            self.seen[key] = now
        self.last_message = now

    def number(self, key: str) -> float | None:
        return _num(self.values.get(key))

    def age(self, key: str, now: float) -> float | None:
        at = self.seen.get(key)
        return None if at is None else now - at


class DeviceStore:
    """Routes Zigbee2MQTT messages for the devices Radiate knows about."""

    def __init__(self, base_topic: str, names: set[str]):
        self.base = base_topic.rstrip("/")
        self.devices: dict[str, Device] = {n: Device() for n in names}
        # Zigbee2MQTT's own state (`bridge/state`, its MQTT last will). While it is
        # offline, retained device availability can no longer be trusted.
        self.bridge_online: bool | None = None

    def subscriptions(self) -> list[str]:
        return [f"{self.base}/#"]

    def handle(self, topic: str, payload: bytes | str, now: float) -> str | None:
        """Apply one message. Returns the device name it updated, if any."""
        if not topic.startswith(self.base + "/"):
            return None
        rest = topic[len(self.base) + 1 :]
        if rest == "bridge/state":
            state = parse_availability(payload)
            if state is not None:
                self.bridge_online = state
            return None
        if rest.endswith("/availability"):
            name = rest[: -len("/availability")]
            dev = self.devices.get(name)
            if dev is None:
                return None
            state = parse_availability(payload)
            if state is not None:
                dev.available = state
            return name
        dev = self.devices.get(rest)
        if dev is None:
            return None
        data = parse_json(payload)
        if data:
            dev.update(data, now)
        return rest

    def get(self, name: str | None) -> Device | None:
        return self.devices.get(name) if name else None

    def set_topic(self, name: str) -> str:
        return f"{self.base}/{name}/set"

    def get_topic(self, name: str) -> str:
        return f"{self.base}/{name}/get"


def is_available(dev: Device | None, now: float, max_silence_s: float) -> bool:
    """Z2M availability when reported, otherwise "heard from recently"."""
    if dev is None:
        return False
    if dev.available is not None:
        return dev.available
    return dev.last_message is not None and now - dev.last_message <= 2 * max_silence_s


def reading_age(dev: Device | None, key: str, now: float, max_silence_s: float) -> float | None:
    """Age of a reading as the core should see it.

    Battery sensors report on change and otherwise stay quiet for up to their maximum
    reporting interval. While a device is available and inside that interval, its
    last value still stands, so the age is 0. Beyond it the real age is returned and
    the core's staleness rules apply.
    """
    if dev is None:
        return None
    age = dev.age(key, now)
    if age is None:
        return None
    if age <= max_silence_s and dev.available is not False:
        return 0.0
    return age


def trv_get_payload() -> dict[str, str]:
    """Read request for the TRV attributes Radiate needs at start-up."""
    return {
        k: ""
        for k in (
            "local_temperature",
            "running_state",
            "occupied_heating_setpoint",
            "system_mode",
            "valve_opening_degree",
            "valve_closing_degree",
            "temperature_sensor_select",
        )
    }


# --- writing -----------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Write:
    device: str
    payload: dict[str, Any]
    delay_s: float = 0.0


@dataclass(slots=True)
class _Sent:
    value: Any
    at: float
    attempts: int = 1


@dataclass(slots=True)
class TrvWriter:
    """Decides what to send to one TRVZB so it stays in governed mode (spec 4.5).

    Writes only what changed, keeps the external temperature fresh, performs the
    close bump, mirrors the room schedule and re-sends settings whose echo disagrees
    (at most 3 attempts, then the setting is reported as failed).
    """

    device: str
    remote_sensor: bool  # room has its own sensor; else the TRV uses its internal one
    schedule_mirror: bool = True
    keepalive_s: float = 25 * 60
    min_external_change_k: float = 0.2
    close_bump_delay_s: float = 5.0
    sent: dict[str, _Sent] = field(default_factory=dict)
    failed: set[str] = field(default_factory=set)
    schedule_sent: dict[str, str] | None = None

    def desired(self, action: ValveAction) -> dict[str, Any]:
        want: dict[str, Any] = dict(GOVERNED_STATIC)
        want["valve_closing_degree"] = int(action.closing)
        want["system_mode"] = "auto" if self.schedule_mirror else "heat"
        want["temperature_sensor_select"] = (
            "remote_temperature" if self.remote_sensor else "local_temperature"
        )
        want["occupied_heating_setpoint"] = _setpoint(action.setpoint)
        want["valve_opening_degree"] = max(0, min(100, int(action.opening)))
        return want

    def plan(
        self,
        action: ValveAction,
        echo: Device | None,
        now: float,
        schedule: dict[str, str] | None = None,
    ) -> list[Write]:
        want = self.desired(action)
        payload: dict[str, Any] = {}
        bump: int | None = None

        for key, value in want.items():
            prev = self.sent.get(key)
            if prev is None or not _same(key, prev.value, value):
                if key == "valve_opening_degree" and action.pre_opening is not None and prev:
                    bump = max(0, min(100, int(action.pre_opening)))
                payload[key] = value
                self.sent[key] = _Sent(value, now)
                self.failed.discard(key)
                continue
            if echo is None or key not in echo.values or key in self.failed:
                continue
            # Reconciler: the device reports something other than what was sent.
            if _same(key, echo.values[key], value):
                prev.attempts = 1
                continue
            grace = SETPOINT_GRACE_S if key == "occupied_heating_setpoint" else RECONCILE_GRACE_S
            if now - prev.at < grace:
                continue
            if prev.attempts >= MAX_ATTEMPTS:
                self.failed.add(key)
                continue
            payload[key] = value
            prev.at = now
            prev.attempts += 1

        ext = action.external_temperature
        if self.remote_sensor and ext is not None:
            ext = round(max(EXTERNAL_MIN, min(EXTERNAL_MAX, ext)), 1)
            prev = self.sent.get("external_temperature_input")
            if (
                prev is None
                or abs(prev.value - ext) >= self.min_external_change_k
                or now - prev.at >= self.keepalive_s
            ):
                payload["external_temperature_input"] = ext
                self.sent["external_temperature_input"] = _Sent(ext, now)

        if self.schedule_mirror and schedule is not None and schedule != self.schedule_sent:
            payload.update(schedule)
            self.schedule_sent = dict(schedule)

        writes: list[Write] = []
        if bump is not None and bump > want["valve_opening_degree"]:
            # Close bump: open a little wider first, then settle on the new opening.
            first = dict(payload)
            first["valve_opening_degree"] = bump
            writes.append(Write(self.device, first))
            writes.append(
                Write(
                    self.device,
                    {"valve_opening_degree": want["valve_opening_degree"]},
                    self.close_bump_delay_s,
                )
            )
        elif payload:
            writes.append(Write(self.device, payload))
        return writes

    def forget(self) -> None:
        """Re-send everything next time (device rejoined or came back online)."""
        self.sent.clear()
        self.failed.clear()
        self.schedule_sent = None


def _setpoint(sp: float) -> float:
    return max(SETPOINT_MIN, min(SETPOINT_MAX, round(sp * 2) / 2))


def _same(key: str, a: Any, b: Any) -> bool:
    tol = TOLERANCE.get(key)
    if tol is not None:
        na, nb = _num(a), _num(b)
        return na is not None and nb is not None and abs(na - nb) < tol
    return a == b
