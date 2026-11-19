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

from .schedule import ScheduleError, WeekSchedule, parse_week

DEFAULT_TRV_BIAS_K = -1.5
_ID = re.compile(r"^[a-z0-9_]{1,40}$")
_ENV = re.compile(r"\$\{([A-Z0-9_]+)\}")
_WINDOW = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-4]):([0-5]\d)$")


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
    schedule: str = "default"


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

    def schedule_for(self, room_id: str) -> WeekSchedule:
        return self.schedules[self.devices[room_id].schedule]


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
    ctx.unknown(
        raw, {"host", "password", "heating_switch", "store_switch", "auto_off_min"}, p
    )
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
    ctx: _Ctx, raw: Any, schedules: dict[str, WeekSchedule], notes: list[str]
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
        sched = ctx.get(item, "schedule", str, "default", p)

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
        if role is not RoomRole.PASSIVE and sched not in schedules:
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

    schedules: dict[str, WeekSchedule] = {}
    raw_sched = ctx.section(data, "schedules")
    if not raw_sched:
        ctx.err("schedules", "at least one schedule is required")
    for name, spec in raw_sched.items():
        try:
            schedules[str(name)] = parse_week(spec)
        except ScheduleError as err:
            ctx.err(f"schedules.{name}", str(err))

    rooms, devices = _rooms(ctx, data.get("rooms"), schedules, notes)
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
