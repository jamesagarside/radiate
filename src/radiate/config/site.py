"""House configuration file (YAML): rooms, devices, schedules, boiler and drivers.

`parse_site(data)` is pure and turns a mapping into a validated `SiteConfig`, which
carries the core `HouseConfig` plus everything the drivers need (Zigbee2MQTT
friendly names, the Shelly, schedules). Every problem is collected and reported
together, with a path such as `rooms[2].trv`.

Strings of the form `${NAME}` are replaced from the environment, so secrets can stay
out of the file.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from radiate.core.types import (
    BoilerConfig,
    HeatSource,
    HouseConfig,
    RoomConfig,
    RoomRole,
    StoreConfig,
)

from .household import (
    DAMP_BELOW_C,
    LIMITS,
    WEEKEND_DAYS,
    AwaySettings,
    EveryoneAway,
    Household,
    LivePreheat,
    Person,
    RoomKind,
    RoomLink,
    Routine,
    Temperatures,
    Timing,
    UseLevel,
    compile_household,
)
from .schedule import (
    DAY_ALIASES,
    MAX_C,
    MIN_C,
    ScheduleError,
    WeekSchedule,
    hhmm,
    parse_week,
)

DEFAULT_TRV_BIAS_K = -1.5
_ID = re.compile(r"^[a-z0-9_]{1,40}$")
_ENV = re.compile(r"\$\{([A-Z0-9_]+)\}")
_WINDOW = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-4]):([0-5]\d)$")
_CLOCK = re.compile(r"^([01]\d|2[0-4]):([0-5]\d)$")


class ConfigError(ValueError):
    def __init__(self, problems: list[str]):
        self.problems = problems
        super().__init__("invalid configuration:\n  " + "\n  ".join(problems))


@dataclass(frozen=True, slots=True)
class RoomDevices:
    """Zigbee2MQTT friendly names for one room's devices."""

    trv: str | None = None
    sensor: str | None = None
    window: str | None = None  # contact sensor; `contact: false` means open
    schedule: str | None = "default"  # None: compiled from the household section


@dataclass(frozen=True, slots=True)
class MqttConfig:
    host: str = "localhost"
    port: int = 1883
    username: str | None = None
    password: str | None = None
    base_topic: str = "zigbee2mqtt"
    client_id: str = "radiate"
    tls: bool = False


@dataclass(frozen=True, slots=True)
class ShellyConfig:
    host: str
    password: str | None = None
    heating_switch: int = 0
    store_switch: int = 1
    auto_off_s: float = 120 * 60  # spec 5.7: the relay can never latch on indefinitely


@dataclass(frozen=True, slots=True)
class TrvOptions:
    schedule_mirror: bool = True  # write room schedules into the TRVZB, run it in auto
    external_keepalive_s: float = 25 * 60  # well inside the TRVZB's 2 h revert
    external_min_change_k: float = 0.2
    close_bump_delay_s: float = 5.0


@dataclass(frozen=True, slots=True)
class SiteConfig:
    house: HouseConfig
    devices: dict[str, RoomDevices]
    schedules: dict[str, WeekSchedule]
    timezone: str = "Europe/London"
    dry_run: bool = True
    outdoor_sensor: str | None = None
    mqtt: MqttConfig | None = None
    shelly: ShellyConfig | None = None
    trv: TrvOptions = field(default_factory=TrvOptions)
    data_dir: str = "./data"
    # Battery sensors report on change; between reports their last value stands for up
    # to this long (their maximum reporting interval) before it counts as stale.
    sensor_max_silence_s: float = 3600.0
    notes: tuple[str, ...] = ()  # non-fatal remarks for the operator
    household: Household | None = None
    # The household's rooms: the valve's week (fixed preheat, fitted to the TRVZB) and
    # the week live control follows (see radiate.config.household).
    household_schedules: dict[str, WeekSchedule] = field(default_factory=dict)
    household_live: dict[str, WeekSchedule] = field(default_factory=dict)

    def schedule_for(self, room_id: str) -> WeekSchedule:
        """The room's week as the valve holds it: the schedule mirror and the fallback."""
        if room_id in self.household_schedules:
            return self.household_schedules[room_id]
        return self.schedules[self.devices[room_id].schedule]

    def live_schedule_for(self, room_id: str) -> WeekSchedule:
        """The room's week as Radiate follows it while running.

        For a household room with optimum start, warm periods start when the room is
        needed and the core decides how early to heat. Hand-written schedules are the
        same in both.
        """
        if room_id in self.household_live:
            return self.household_live[room_id]
        return self.schedule_for(room_id)

    def mirror_payload(self, room_id: str) -> dict[str, str]:
        """The room's week as written to its TRVZB, in the frame the TRV compares with."""
        week = self.schedule_for(room_id)
        room = self.house.room(room_id)
        if room.role is RoomRole.INTERNAL_SENSOR_ONLY:
            # The TRV reads about room - bias; spec 4.6 and decide._trv_setpoint.
            week = week.shifted(-room.trv_bias_k)
        return week.trvzb_payload()


# --- parsing helpers -------------------------------------------------------------------


class _Ctx:
    def __init__(self) -> None:
        self.problems: list[str] = []

    def err(self, path: str, msg: str) -> None:
        self.problems.append(f"{path}: {msg}")

    def section(self, data: dict, key: str, path: str = "") -> dict:
        val = data.get(key)
        if val is None:
            return {}
        if not isinstance(val, dict):
            self.err(f"{path}{key}", "expected a mapping")
            return {}
        return val

    def get(self, data: dict, key: str, kind: type | tuple, default: Any, path: str) -> Any:
        if key not in data or data[key] is None:
            return default
        val = data[key]
        if kind is float and isinstance(val, int) and not isinstance(val, bool):
            return float(val)
        if kind is float and isinstance(val, str):
            # Numbers substituted from the environment arrive as strings.
            try:
                return float(val)
            except ValueError:
                pass
        if isinstance(val, bool) and kind in (int, float):
            self.err(f"{path}{key}", "expected a number")
            return default
        if not isinstance(val, kind):
            name = kind.__name__ if isinstance(kind, type) else "/".join(k.__name__ for k in kind)
            self.err(f"{path}{key}", f"expected {name}, got {type(val).__name__}")
            return default
        return val

    def number(
        self, data: dict, key: str, default: float, lo: float, hi: float, path: str
    ) -> float:
        val = self.get(data, key, float, default, path)
        if not lo <= val <= hi:
            self.err(f"{path}{key}", f"must be {lo:g} to {hi:g}")
            return default
        return val

    def unknown(self, data: dict, allowed: set[str], path: str) -> None:
        for key in data:
            if key not in allowed:
                self.err(f"{path}{key}", "unknown key")


def _substitute_env(value: Any, env: dict[str, str], ctx: _Ctx, path: str = "") -> Any:
    if isinstance(value, dict):
        return {k: _substitute_env(v, env, ctx, f"{path}{k}.") for k, v in value.items()}
    if isinstance(value, list):
        return [_substitute_env(v, env, ctx, f"{path}[{i}].") for i, v in enumerate(value)]
    if isinstance(value, str):

        def repl(m: re.Match) -> str:
            name = m.group(1)
            if name not in env:
                ctx.err(path.rstrip("."), f"environment variable {name} is not set")
                return ""
            return env[name]

        return _ENV.sub(repl, value)
    return value


def _store_windows(raw: Any, ctx: _Ctx, path: str) -> tuple[tuple[int, int], ...] | None:
    if raw is None:
        return None
    if not isinstance(raw, list):
        ctx.err(path, "expected a list of HH:MM-HH:MM")
        return None
    out = []
    for i, item in enumerate(raw):
        m = _WINDOW.match(str(item))
        if not m:
            ctx.err(f"{path}[{i}]", f"{item!r} is not HH:MM-HH:MM")
            continue
        a = int(m.group(1)) * 60 + int(m.group(2))
        b = int(m.group(3)) * 60 + int(m.group(4))
        if b <= a or b > 1440:
            ctx.err(f"{path}[{i}]", "end must be after start, on the same day")
            continue
        out.append((a, b))
    if len(out) > 4:
        ctx.err(path, "at most 4 windows a day (spec 5.5)")
    return tuple(sorted(out))


# --- sections --------------------------------------------------------------------------


def _boiler(ctx: _Ctx, raw: dict) -> BoilerConfig:
    p = "boiler."
    ctx.unknown(
        raw,
        {
            "min_burn_min",
            "min_off_min",
            "max_starts_per_hour",
            "valve_lead_s",
            "comfort_limit_k",
            "frost_c",
            "output_kw",
            "nozzle_lph",
        },
        p,
    )
    d = BoilerConfig()
    nozzle = raw.get("nozzle_lph")
    return BoilerConfig(
        min_burn_s=ctx.number(raw, "min_burn_min", d.min_burn_s / 60, 4, 20, p) * 60,
        min_off_s=ctx.number(raw, "min_off_min", d.min_off_s / 60, 5, 30, p) * 60,
        max_starts_per_hour=int(
            ctx.number(raw, "max_starts_per_hour", d.max_starts_per_hour, 1, 6, p)
        ),
        valve_lead_s=ctx.number(raw, "valve_lead_s", d.valve_lead_s, 30, 300, p),
        comfort_limit_k=ctx.number(raw, "comfort_limit_k", d.comfort_limit_k, 0.2, 1.5, p),
        frost_c=ctx.number(raw, "frost_c", d.frost_c, 5, 10, p),
        output_kw=ctx.number(raw, "output_kw", d.output_kw, 3, 70, p),
        nozzle_lph=ctx.number(raw, "nozzle_lph", 0.0, 0.1, 10, p) if nozzle is not None else None,
    )


def _store(ctx: _Ctx, raw: dict) -> StoreConfig:
    p = "store."
    ctx.unknown(raw, {"windows", "recovery_min", "priority_over_heating"}, p)
    d = StoreConfig()
    windows = _store_windows(raw.get("windows"), ctx, f"{p}windows")
    return StoreConfig(
        windows=d.windows if windows is None else windows,
        recovery_s=ctx.number(raw, "recovery_min", d.recovery_s / 60, 0, 120, p) * 60,
        priority_over_heating=ctx.get(
            raw, "priority_over_heating", bool, d.priority_over_heating, p
        ),
    )


def _mqtt(ctx: _Ctx, raw: dict) -> MqttConfig | None:
    if not raw:
        return None
    p = "mqtt."
    ctx.unknown(raw, {"host", "port", "username", "password", "base_topic", "client_id", "tls"}, p)
    d = MqttConfig()
    return MqttConfig(
        host=ctx.get(raw, "host", str, d.host, p),
        port=int(ctx.number(raw, "port", d.port, 1, 65535, p)),
        username=ctx.get(raw, "username", str, None, p) or None,
        password=ctx.get(raw, "password", str, None, p) or None,
        base_topic=ctx.get(raw, "base_topic", str, d.base_topic, p).rstrip("/"),
        client_id=ctx.get(raw, "client_id", str, d.client_id, p),
        tls=ctx.get(raw, "tls", bool, d.tls, p),
    )


def _shelly(ctx: _Ctx, raw: dict) -> ShellyConfig | None:
    if not raw:
        return None
    p = "shelly."
    ctx.unknown(raw, {"host", "password", "heating_switch", "store_switch", "auto_off_min"}, p)
    host = ctx.get(raw, "host", str, "", p)
    if not host:
        ctx.err(f"{p}host", "required")
    heating = int(ctx.number(raw, "heating_switch", 0, 0, 3, p))
    store = int(ctx.number(raw, "store_switch", 1, 0, 3, p))
    if heating == store:
        ctx.err(f"{p}store_switch", "must differ from heating_switch")
    return ShellyConfig(
        host=host,
        password=ctx.get(raw, "password", str, None, p) or None,
        heating_switch=heating,
        store_switch=store,
        auto_off_s=ctx.number(raw, "auto_off_min", 120, 15, 240, p) * 60,
    )


def _trv(ctx: _Ctx, raw: dict) -> TrvOptions:
    p = "trv."
    ctx.unknown(raw, {"schedule_mirror", "external_keepalive_min"}, p)
    d = TrvOptions()
    return TrvOptions(
        schedule_mirror=ctx.get(raw, "schedule_mirror", bool, d.schedule_mirror, p),
        external_keepalive_s=ctx.number(
            raw, "external_keepalive_min", d.external_keepalive_s / 60, 5, 60, p
        )
        * 60,
    )


_ROOM_KEYS = {
    "id",
    "name",
    "role",
    "heat_source",
    "trv",
    "sensor",
    "window",
    "schedule",
    "actuate",
    "humidity",
    "trv_bias_k",
}


def _rooms(
    ctx: _Ctx,
    raw: Any,
    schedules: dict[str, WeekSchedule],
    notes: list[str],
    household_rooms: set[str],
) -> tuple[list[RoomConfig], dict[str, RoomDevices]]:
    if not isinstance(raw, list) or not raw:
        ctx.err("rooms", "expected a non-empty list")
        return [], {}
    rooms: list[RoomConfig] = []
    devices: dict[str, RoomDevices] = {}
    explicit_actuation: dict[str, bool] = {}
    seen_devices: dict[str, str] = {}
    for i, item in enumerate(raw):
        p = f"rooms[{i}]."
        if not isinstance(item, dict):
            ctx.err(f"rooms[{i}]", "expected a mapping")
            continue
        ctx.unknown(item, _ROOM_KEYS, p)
        rid = ctx.get(item, "id", str, "", p)
        if not _ID.match(rid):
            ctx.err(f"{p}id", "required: lower case letters, digits and _ (max 40)")
            continue
        if rid in devices:
            ctx.err(f"{p}id", f"duplicate room id {rid!r}")
            continue
        name = ctx.get(item, "name", str, rid.replace("_", " ").capitalize(), p)
        try:
            role = RoomRole(ctx.get(item, "role", str, "normal", p))
        except ValueError:
            ctx.err(f"{p}role", "must be normal, passive or internal_sensor_only")
            role = RoomRole.NORMAL
        heat_source = None
        if item.get("heat_source") is not None:
            try:
                heat_source = HeatSource(ctx.get(item, "heat_source", str, "", p))
            except ValueError:
                ctx.err(f"{p}heat_source", "must be episodic or continuous")
        trv = ctx.get(item, "trv", str, None, p) or None
        sensor = ctx.get(item, "sensor", str, None, p) or None
        window = ctx.get(item, "window", str, None, p) or None
        sched: str | None = ctx.get(item, "schedule", str, "default", p)
        if rid in household_rooms:
            if item.get("schedule") is not None:
                ctx.err(
                    f"{p}schedule",
                    "the household section builds this room's schedule; remove one of them",
                )
            sched = None

        if role is RoomRole.NORMAL:
            if trv is None:
                ctx.err(f"{p}trv", "required for a normal room (use role: passive if unvalved)")
            if sensor is None:
                ctx.err(f"{p}sensor", "required for a normal room (or role: internal_sensor_only)")
        elif role is RoomRole.INTERNAL_SENSOR_ONLY:
            if trv is None:
                ctx.err(f"{p}trv", "required for an internal_sensor_only room")
            if sensor is not None:
                ctx.err(f"{p}sensor", "an internal_sensor_only room has no room sensor")
        elif trv is not None:
            ctx.err(f"{p}trv", "a passive room has no controllable valve")
        if role is not RoomRole.PASSIVE and sched is not None and sched not in schedules:
            ctx.err(f"{p}schedule", f"unknown schedule {sched!r}")
        for dev_key, dev in (("trv", trv), ("sensor", sensor), ("window", window)):
            if dev is None:
                continue
            if dev in seen_devices:
                ctx.err(f"{p}{dev_key}", f"{dev!r} is already used by {seen_devices[dev]}")
            seen_devices[dev] = f"rooms[{i}].{dev_key}"

        if "actuate" in item and item["actuate"] is not None:
            explicit_actuation[rid] = ctx.get(item, "actuate", bool, False, p)
        # Humidity drives shower detection (spec 4.6); opt in per room.
        humidity = ctx.get(item, "humidity", bool, False, p)
        bias = ctx.number(item, "trv_bias_k", DEFAULT_TRV_BIAS_K, -5, 5, p)

        rooms.append(
            RoomConfig(
                id=rid,
                name=name,
                role=role,
                heat_source=heat_source,
                has_humidity=humidity,
                trv_bias_k=bias,
                actuation_enabled=False,
            )
        )
        devices[rid] = RoomDevices(trv=trv, sensor=sensor, window=window, schedule=sched)

    # One-valve rollout (spec 4.5): unless the file says otherwise, only the first valve
    # is actuated. Calibration loss has been reported on the TRVZB; test one first.
    with_trv = [r.id for r in rooms if devices[r.id].trv is not None]
    if explicit_actuation:
        enabled = {rid for rid, on in explicit_actuation.items() if on}
        for rid in enabled:
            if devices.get(rid) and devices[rid].trv is None:
                ctx.err("rooms", f"{rid}: actuate is true but the room has no trv")
    else:
        enabled = set(with_trv[:1])
        if enabled:
            notes.append(
                f"No room sets 'actuate': only {with_trv[0]} will be actuated (pilot valve)."
            )
    rooms = [
        RoomConfig(
            id=r.id,
            name=r.name,
            role=r.role,
            heat_source=r.heat_source,
            has_humidity=r.has_humidity,
            trv_bias_k=r.trv_bias_k,
            actuation_enabled=r.id in enabled,
        )
        for r in rooms
    ]
    return rooms, devices


# --- household -------------------------------------------------------------------------


def _clock(ctx: _Ctx, raw: Any, path: str, end: bool = False) -> int | None:
    if raw is None:
        ctx.err(path, "required")
        return None
    if isinstance(raw, int) and not isinstance(raw, bool):
        # YAML reads an unquoted 22:30 as a number.
        ctx.err(path, 'put the time in quotes, for example "22:30"')
        return None
    m = _CLOCK.match(str(raw))
    minute = int(m.group(1)) * 60 + int(m.group(2)) if m else -1
    if not 0 <= minute <= (1440 if end else 1439):
        ctx.err(path, f"{raw!r} is not a time as HH:MM")
        return None
    return minute


def _windows(ctx: _Ctx, raw: Any, path: str) -> tuple[tuple[int, int], ...]:
    if raw is None:
        return ()
    items = raw if isinstance(raw, list) else [raw]
    out = []
    for i, item in enumerate(items):
        at = f"{path}[{i}]" if isinstance(raw, list) else path
        m = _WINDOW.match(str(item))
        if not m:
            ctx.err(at, f"{item!r} is not HH:MM-HH:MM")
            continue
        a = int(m.group(1)) * 60 + int(m.group(2))
        b = int(m.group(3)) * 60 + int(m.group(4))
        if b <= a or b > 1440:
            ctx.err(at, "end must be after start, on the same day")
            continue
        out.append((a, b))
    return tuple(sorted(out))


def _routine(ctx: _Ctx, raw: Any, path: str) -> Routine | None:
    if not isinstance(raw, dict):
        ctx.err(path, "expected a mapping with up, bed and optionally out and work")
        return None
    ctx.unknown(raw, {"up", "bed", "out", "work"}, f"{path}.")
    up = _clock(ctx, raw.get("up"), f"{path}.up")
    bed = _clock(ctx, raw.get("bed"), f"{path}.bed", end=True)
    out = _windows(ctx, raw.get("out"), f"{path}.out")
    work = _windows(ctx, raw.get("work"), f"{path}.work")
    if up is None or bed is None:
        return None
    if bed <= up:
        ctx.err(f"{path}.bed", "must be after up, on the same day")
        return None
    ok = True
    for key, spans in (("out", out), ("work", work)):
        for a, b in spans:
            if a < up or b > bed:
                ctx.err(
                    f"{path}.{key}",
                    f"{hhmm(a)}-{hhmm(b)} is outside {hhmm(up)} to {hhmm(bed)} (up to bed)",
                )
                ok = False
    spans = sorted(out + work)
    for (_, end), (a, b) in zip(spans, spans[1:], strict=False):
        if a < end:
            ctx.err(path, f"out and work times overlap at {hhmm(a)}-{hhmm(b)}")
            ok = False
    return Routine(up_min=up, bed_min=bed, out=out, work=work) if ok else None


def _use(ctx: _Ctx, raw: Any, path: str) -> tuple[UseLevel, UseLevel] | None:
    def level(value: Any, at: str) -> UseLevel | None:
        try:
            return UseLevel(value)
        except ValueError:
            ctx.err(at, "must be in_use, occasional or unused")
            return None

    if raw is None:
        ctx.err(path, "required: in_use, occasional or unused")
        return None
    if isinstance(raw, dict):
        ctx.unknown(raw, {"weekdays", "weekend"}, f"{path}.")
        days: list[UseLevel | None] = []
        for key in ("weekdays", "weekend"):
            if key in raw:
                days.append(level(raw[key], f"{path}.{key}"))
            else:
                ctx.err(f"{path}.{key}", "required when the use differs at weekends")
                days.append(None)
        weekdays, weekend = days
        if weekdays is None or weekend is None:
            return None
        return weekdays, weekend
    one = level(raw, path)
    return None if one is None else (one, one)


def _people(ctx: _Ctx, raw: dict, p: str) -> list[Person]:
    people: list[Person] = []
    if not raw:
        ctx.err(f"{p}people", "at least one person is required")
    for pid, item in raw.items():
        at = f"{p}people.{pid}"
        if not _ID.match(str(pid)):
            ctx.err(at, "person ids are lower case letters, digits and _ (max 40)")
            continue
        if not isinstance(item, dict):
            ctx.err(at, "expected a mapping with weekdays and optionally weekend")
            continue
        ctx.unknown(
            item,
            {"name", "weekdays", "weekend", "getting_up_min", "bedtime_min", "weekend_days"},
            f"{at}.",
        )
        name = ctx.get(item, "name", str, "", f"{at}.")
        weekdays = _routine(ctx, item.get("weekdays"), f"{at}.weekdays")
        weekend = weekdays
        if item.get("weekend") is not None:
            weekend = _routine(ctx, item["weekend"], f"{at}.weekend")
        getting_up = _minutes(ctx, item, "getting_up_min", "timing.getting_up_min", f"{at}.")
        bedtime = _minutes(ctx, item, "bedtime_min", "timing.bedtime_min", f"{at}.")
        weekend_days = _weekend_days(ctx, item.get("weekend_days"), f"{at}.weekend_days")
        if weekdays is not None and weekend is not None:
            people.append(
                Person(
                    id=str(pid),
                    weekdays=weekdays,
                    weekend=weekend,
                    name=name,
                    getting_up_min=getting_up,
                    bedtime_min=bedtime,
                    weekend_days=weekend_days,
                )
            )
    return people


def _minutes(ctx: _Ctx, raw: dict, key: str, limit: str, path: str) -> int | None:
    """An optional whole number of minutes in the range `LIMITS[limit]`, or None."""
    if raw.get(key) is None:
        return None
    lim = LIMITS[limit]
    val = ctx.get(raw, key, float, None, path)
    if val is None:
        return None
    if lim.off is not None and val == lim.off:
        return int(val)
    if not lim.lo <= val <= lim.hi or val != int(val):
        off = f", or {lim.off:g} to turn it off" if lim.off is not None else ""
        ctx.err(f"{path}{key}", f"must be whole minutes, {lim.lo:g} to {lim.hi:g}{off}")
        return None
    return int(val)


def _weekend_days(ctx: _Ctx, raw: Any, path: str) -> frozenset[int] | None:
    """Days of the week as names (`sat`, `saturday`), or None if not given."""
    if raw is None:
        return None
    if not isinstance(raw, list):
        ctx.err(path, "expected a list of days, for example [sat, sun]")
        return None
    days: list[int] = []
    for i, name in enumerate(raw):
        found = DAY_ALIASES.get(str(name).lower())
        if found is None or len(found) != 1:
            ctx.err(f"{path}[{i}]", f"{name!r} is not a day: use mon to sun")
            return None
        days.append(found[0])
    if len(set(days)) != len(days):
        ctx.err(path, "a day is listed twice")
        return None
    return frozenset(days)


def _choice(ctx: _Ctx, raw: dict, key: str, kind: type, default: Any, path: str) -> Any:
    value = ctx.get(raw, key, str, default.value, path)
    try:
        return kind(value)
    except ValueError:
        ctx.err(f"{path}{key}", "must be " + " or ".join(v.value for v in kind))
        return default


def _room_link(
    ctx: _Ctx, rid: str, item: Any, room: RoomConfig | None, person_ids: set[str], p: str
) -> RoomLink | None:
    at = f"{p}rooms.{rid}"
    if room is None:
        ctx.err(at, f"unknown room {rid!r}; use an id from rooms")
        return None
    if room.role is RoomRole.PASSIVE:
        ctx.err(at, "a passive room has no valve, so it has no schedule")
        return None
    if not isinstance(item, dict):
        ctx.err(at, "expected a mapping with use and optionally kind, people and temperature")
        return None
    ctx.unknown(
        item,
        {
            "use",
            "kind",
            "people",
            "temperature",
            "night_temperature",
            "unused_temperature",
            "preheat_min",
        },
        f"{at}.",
    )
    use = _use(ctx, item.get("use"), f"{at}.use")
    try:
        kind = RoomKind(ctx.get(item, "kind", str, "shared", f"{at}."))
    except ValueError:
        ctx.err(f"{at}.kind", "must be " + ", ".join(k.value for k in RoomKind))
        return None
    linked: tuple[str, ...] | None = None
    names = item.get("people")
    if names is not None:
        if not isinstance(names, list) or not names:
            ctx.err(f"{at}.people", "expected a list of person ids")
            return None
        for name in names:
            if str(name) not in person_ids:
                ctx.err(f"{at}.people", f"unknown person {name!r}")
        if len(set(names)) != len(names):
            ctx.err(f"{at}.people", "a person is listed twice")
        linked = tuple(str(n) for n in names)
    elif kind in (RoomKind.BEDROOM, RoomKind.OFFICE):
        ctx.err(f"{at}.people", f"required for a {kind.value}: who sleeps or works here")
    temps = {
        key: ctx.number(item, key, 0.0, MIN_C, MAX_C, f"{at}.")
        if item.get(key) is not None
        else None
        for key in ("temperature", "night_temperature", "unused_temperature")
    }
    preheat = _minutes(ctx, item, "preheat_min", "timing.preheat_min", f"{at}.")
    if use is None:
        return None
    return RoomLink(
        room_id=room.id,
        use_weekdays=use[0],
        use_weekend=use[1],
        kind=kind,
        people=linked,
        temperature_c=temps["temperature"],
        name=room.name,
        night_c=temps["night_temperature"],
        unused_c=temps["unused_temperature"],
        preheat_min=preheat,
    )


def _household(ctx: _Ctx, raw: dict, rooms: list[RoomConfig], notes: list[str]) -> Household | None:
    p = "household."
    if "presence_delay_min" in raw:
        ctx.err(f"{p}presence_delay_min", "moved: set it as household.away.presence_delay_min")
    ctx.unknown(
        raw,
        {"temperatures", "people", "rooms", "timing", "away", "weekend_days", "presence_delay_min"},
        p,
    )
    timing = _timing(ctx, ctx.section(raw, "timing", p))
    away = _away_settings(ctx, ctx.section(raw, "away", p))
    weekend_days = _weekend_days(ctx, raw.get("weekend_days"), f"{p}weekend_days")

    tp = f"{p}temperatures."
    t_raw = ctx.section(raw, "temperatures", p)
    ctx.unknown(t_raw, {"in_use", "occasional", "unused", "night"}, tp)
    d = Temperatures()
    temps = Temperatures(
        in_use_c=ctx.number(t_raw, "in_use", d.in_use_c, MIN_C, MAX_C, tp),
        occasional_c=ctx.number(t_raw, "occasional", d.occasional_c, MIN_C, MAX_C, tp),
        unused_c=ctx.number(t_raw, "unused", d.unused_c, MIN_C, MAX_C, tp),
        night_c=ctx.number(t_raw, "night", d.night_c, MIN_C, MAX_C, tp),
    )
    for key, value in (("unused", temps.unused_c), ("night", temps.night_c)):
        _damp_note(notes, f"{tp}{key}", value)

    p_raw = ctx.section(raw, "people", p)
    people = _people(ctx, p_raw, p)
    person_ids = {str(pid) for pid in p_raw}

    by_id = {r.id: r for r in rooms}
    r_raw = ctx.section(raw, "rooms", p)
    if not r_raw:
        ctx.err(f"{p}rooms", "at least one room is required")
    links = []
    for rid, item in r_raw.items():
        link = _room_link(ctx, str(rid), item, by_id.get(str(rid)), person_ids, p)
        if link is not None:
            links.append(link)
            for key, value in (("unused", link.unused_c), ("night", link.night_c)):
                if value is not None:
                    _damp_note(notes, f"{p}rooms.{rid}.{key}_temperature", value)

    offices = {pid for link in links if link.kind is RoomKind.OFFICE for pid in link.people or ()}
    for person in people:
        if (person.weekdays.work or person.weekend.work) and person.id not in offices:
            notes.append(
                f"{p}people.{person.id} has work hours but no office room: "
                "shared rooms are not heated while they work."
            )
    return Household(
        people=tuple(people),
        rooms=tuple(links),
        temperatures=temps,
        timing=timing,
        away=away,
        weekend_days=WEEKEND_DAYS if weekend_days is None else weekend_days,
    )


def _timing(ctx: _Ctx, raw: dict) -> Timing:
    p = "household.timing."
    d = Timing()
    keys = ("preheat_min", "getting_up_min", "bedtime_min", "merge_gap_min")
    ctx.unknown(raw, {*keys, "live_preheat"}, p)
    values = {k: _or(_minutes(ctx, raw, k, f"timing.{k}", p), getattr(d, k)) for k in keys}
    live = _choice(ctx, raw, "live_preheat", LivePreheat, d.live_preheat, p)
    return Timing(live_preheat=live, **values)


def _away_settings(ctx: _Ctx, raw: dict) -> AwaySettings:
    p = "household.away."
    d = AwaySettings()
    keys = ("presence_delay_min", "presence_stale_after_min", "return_warmup_min")
    ctx.unknown(raw, {*keys, "everyone_away"}, p)
    values = {k: _or(_minutes(ctx, raw, k, f"away.{k}", p), getattr(d, k)) for k in keys}
    everyone = _choice(ctx, raw, "everyone_away", EveryoneAway, d.everyone_away, p)
    return AwaySettings(everyone_away=everyone, **values)


def _damp_note(notes: list[str], path: str, value: float) -> None:
    if value < DAMP_BELOW_C:
        notes.append(
            f"{path} is {value:g}°: below {DAMP_BELOW_C:g}° walls and window frames "
            "can get damp, especially in older houses."
        )


def _or(value: Any, default: Any) -> Any:
    return default if value is None else value


def parse_site(data: Any, env: dict[str, str] | None = None) -> SiteConfig:
    """Validate a parsed YAML document. Raises ConfigError listing every problem."""
    ctx = _Ctx()
    if not isinstance(data, dict):
        raise ConfigError(["top level: expected a mapping"])
    data = _substitute_env(data, dict(os.environ) if env is None else env, ctx)
    ctx.unknown(
        data,
        {
            "house",
            "boiler",
            "store",
            "mqtt",
            "shelly",
            "trv",
            "schedules",
            "rooms",
            "balancing",
            "household",
        },
        "",
    )
    notes: list[str] = []

    house = ctx.section(data, "house")
    ctx.unknown(
        house,
        {"timezone", "dry_run", "outdoor_sensor", "data_dir", "sensor_max_silence_min"},
        "house.",
    )
    tz = ctx.get(house, "timezone", str, "Europe/London", "house.")
    try:
        from zoneinfo import ZoneInfo

        ZoneInfo(tz)
    except Exception:
        ctx.err("house.timezone", f"unknown time zone {tz!r}")
    dry_run = ctx.get(house, "dry_run", bool, True, "house.")

    raw_household = ctx.section(data, "household")
    raw_links = raw_household.get("rooms")
    household_rooms = {str(k) for k in raw_links} if isinstance(raw_links, dict) else set()

    schedules: dict[str, WeekSchedule] = {}
    raw_sched = ctx.section(data, "schedules")
    if not raw_sched and not raw_household:
        ctx.err("schedules", "at least one schedule, or a household section, is required")
    for name, spec in raw_sched.items():
        try:
            schedules[str(name)] = parse_week(spec)
        except ScheduleError as err:
            ctx.err(f"schedules.{name}", str(err))

    rooms, devices = _rooms(ctx, data.get("rooms"), schedules, notes, household_rooms)
    household = _household(ctx, raw_household, rooms, notes) if raw_household else None
    balancing = ctx.get(data, "balancing", bool, True, "")
    cfg = HouseConfig(
        rooms=tuple(rooms),
        boiler=_boiler(ctx, ctx.section(data, "boiler")),
        store=_store(ctx, ctx.section(data, "store")),
        balancing=balancing,
    )
    mqtt = _mqtt(ctx, ctx.section(data, "mqtt"))
    shelly = _shelly(ctx, ctx.section(data, "shelly"))
    trv = _trv(ctx, ctx.section(data, "trv"))
    outdoor = ctx.get(house, "outdoor_sensor", str, None, "house.") or None
    if any(d.trv or d.sensor or d.window for d in devices.values()) or outdoor:
        if mqtt is None:
            ctx.err("mqtt", "required: rooms use Zigbee2MQTT devices")
    if shelly is None:
        notes.append("No shelly section: the boiler relay is not driven.")
    if not dry_run:
        notes.append("dry_run is false: Radiate will write to valves and the boiler relay.")

    data_dir = ctx.get(house, "data_dir", str, "./data", "house.")
    silence_min = ctx.number(house, "sensor_max_silence_min", 60, 10, 180, "house.")

    if ctx.problems:
        raise ConfigError(ctx.problems)
    household_schedules: dict[str, WeekSchedule] = {}
    household_live: dict[str, WeekSchedule] = {}
    if household is not None:
        compiled = compile_household(household)
        household_schedules = compiled.schedules
        household_live = compiled.live
        notes.extend(compiled.notes)
    return SiteConfig(
        house=cfg,
        devices=devices,
        schedules=schedules,
        timezone=tz,
        dry_run=dry_run,
        outdoor_sensor=outdoor,
        mqtt=mqtt,
        shelly=shelly,
        trv=trv,
        data_dir=data_dir,
        sensor_max_silence_s=silence_min * 60,
        notes=tuple(notes),
        household=household,
        household_schedules=household_schedules,
        household_live=household_live,
    )


def load_site(path: str | Path, env: dict[str, str] | None = None) -> SiteConfig:
    """Read and validate a YAML config file."""
    import yaml

    text = Path(path).read_text(encoding="utf-8")
    try:
        data = yaml.safe_load(text)
    except yaml.YAMLError as err:
        raise ConfigError([f"{path}: not valid YAML: {err}"]) from None
    return parse_site(data, env)
