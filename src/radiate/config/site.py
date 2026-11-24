"""House configuration file (YAML): rooms, devices, schedules, boiler and drivers.

`parse_site(data)` is pure and turns a mapping into a validated `SiteConfig`, which
carries the core `HouseConfig` plus everything the drivers need (Zigbee2MQTT
friendly names, the Shelly, schedules). Every problem is collected and reported
together, with a path such as `rooms[2].trv`.

Strings of the form `${NAME}` are replaced from the environment, so secrets can stay
out of the file.

The household can also come from the web UI's setup, saved in the data directory
(`radiate.config.saved`). `load_site` applies it: a saved household replaces the house
file's `household` section. `parse_household` and `apply_household` are the same steps
for the server, so the web UI validates against the same rules and limits.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any

from radiate.core.estimator import MEMORY_DAYS_MAX, MEMORY_DAYS_MIN
from radiate.core.outdoor import DEFAULT_STALE_AFTER_S, OutdoorSource
from radiate.core.types import (
    BoilerConfig,
    DemandMode,
    HeatSource,
    HouseConfig,
    LearningConfig,
    RoomConfig,
    RoomRole,
    StoreConfig,
    SuggestionConfig,
)

from .household import (
    ADJUST_GROUPS,
    LIMITS,
    WEEKEND_DAYS,
    Adjustment,
    AwaySettings,
    EveryoneAway,
    Household,
    Keep,
    LivePreheat,
    Person,
    RoomKind,
    RoomLink,
    Routine,
    Temperatures,
    Timing,
    UseLevel,
    compile_household,
    household_advice,
    household_section,
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
# A Home Assistant `person` entity ID: `person.` and an object ID of lower case letters,
# digits and `_` that doesn't start or end with `_`, as Home Assistant requires.
HA_PERSON = re.compile(r"^person\.(?!_)[a-z0-9_]{1,100}(?<!_)$")
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
    # Burner firing from each channel's power reading (spec 3, 5.6): at or above the
    # threshold the burner fires; it stops below threshold - hysteresis. Trusted on a
    # channel only once it has read at or above the threshold since Radiate started.
    burner_metering: bool = True
    burner_threshold_w: float = 100.0
    burner_hysteresis_w: float = 20.0


@dataclass(frozen=True, slots=True)
class TrvOptions:
    schedule_mirror: bool = True  # write room schedules into the TRVZB, run it in auto
    external_keepalive_s: float = 25 * 60  # well inside the TRVZB's 2 h revert
    external_min_change_k: float = 0.2
    close_bump_delay_s: float = 5.0


@dataclass(frozen=True, slots=True)
class MonitoringOptions:
    """When the devices view and the alerts say a device needs attention."""

    low_battery_pct: float = 20.0  # battery at or below this is low
    weak_signal_lqi: float = 40.0  # Zigbee2MQTT LQI below this is a weak signal


@dataclass(frozen=True, slots=True)
class SiteConfig:
    house: HouseConfig
    devices: dict[str, RoomDevices]
    schedules: dict[str, WeekSchedule]
    timezone: str = "Europe/London"
    dry_run: bool = True
    outdoor_sensor: str | None = None
    # Where the outdoor temperature comes from (radiate.core.outdoor): the Zigbee sensor
    # (the default), Home Assistant (`POST /api/v1/outdoor`), or both, Zigbee first.
    outdoor_source: OutdoorSource = OutdoorSource.ZIGBEE
    # A Home Assistant outdoor reading older than this counts as missing.
    outdoor_stale_after_s: float = DEFAULT_STALE_AFTER_S
    mqtt: MqttConfig | None = None
    shelly: ShellyConfig | None = None
    trv: TrvOptions = field(default_factory=TrvOptions)
    monitoring: MonitoringOptions = field(default_factory=MonitoringOptions)
    data_dir: str = "./data"
    # Battery sensors report on change; between reports their last value stands for up
    # to this long (their maximum reporting interval) before it counts as stale.
    sensor_max_silence_s: float = 3600.0
    # Days of recorded ticks (snapshots and actions) kept in radiate.db for replay and
    # bootstrap (spec 4.3, 6). 0 turns recording off.
    history_days: float = 14.0
    # How long the manual fire flag lasts; it also ends at local midnight (spec 7).
    fire_flag_s: float = 6 * 3600.0
    notes: tuple[str, ...] = ()  # non-fatal remarks for the operator
    household: Household | None = None
    # The household's rooms: the valve's week (fixed preheat, fitted to the TRVZB) and
    # the week live control follows (see radiate.config.household).
    household_schedules: dict[str, WeekSchedule] = field(default_factory=dict)
    household_live: dict[str, WeekSchedule] = field(default_factory=dict)
    # The household's valve weeks for everyone at home. The fallbacks (the TRV schedule
    # mirror and the Shelly watchdog's windows) use these and never the weeks compiled
    # for people away: they heat the house when Radiate cannot, so they fail warm.
    household_fallback: dict[str, WeekSchedule] = field(default_factory=dict)
    # Per household room, Monday first: the use level of its warm periods in those weeks
    # (`CompiledHousehold.warm_levels`), or unused on a day without any, so the watchdog
    # knows whether a flat day is warm.
    household_fallback_levels: dict[str, tuple[UseLevel, ...]] = field(default_factory=dict)
    # The schedule each controllable room follows when no household covers it: its own
    # `schedule`, or `default` when that exists. None: the house file gives it none.
    room_schedules: dict[str, str | None] = field(default_factory=dict)
    # The use level of each room on a hand-written schedule that gives one (`rooms[].use`),
    # as (weekdays, weekend), for room use (radiate.config.use). A household room's
    # use level comes from the household instead, which wins if it covers the room.
    schedule_use: dict[str, tuple[UseLevel, UseLevel]] = field(default_factory=dict)
    # Where the household comes from: "house_file", "saved" (the web UI's setup, from
    # the data directory) or None (no household).
    household_source: str | None = None
    file_household: Household | None = None  # the house file's own household section
    household_notes: tuple[str, ...] = ()  # the part of `notes` about the household
    # Why a household saved from the web UI was not used, if it was not.
    saved_problems: tuple[str, ...] = ()
    # Settings saved from the web UI's Settings view (radiate.config.settings) that are
    # in effect, as dotted paths, and why saved settings were not used, if they were not.
    saved_settings: tuple[str, ...] = ()
    settings_problems: tuple[str, ...] = ()

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

    def fallback_schedule_for(self, room_id: str) -> WeekSchedule:
        """The room's week for the fallbacks: as the valve holds it with everyone home.

        The TRV schedule mirror and the Shelly watchdog's windows run the house when
        Radiate is not running, so they never inherit an away (spec 7, fail warm).
        """
        if room_id in self.household_fallback:
            return self.household_fallback[room_id]
        return self.schedule_for(room_id)

    def fallback_level(self, room_id: str, weekday: int) -> UseLevel | None:
        """The room's use level on `weekday` in its fallback week: from the household
        for everyone at home, else its hand-written `use`, else None."""
        day = weekday % 7
        if room_id in self.household_fallback_levels:
            return self.household_fallback_levels[room_id][day]
        levels = self.schedule_use.get(room_id)
        if levels is None:
            return None
        return levels[1] if day in DAY_ALIASES["weekend"] else levels[0]

    def mirror_payload(self, room_id: str) -> dict[str, str]:
        """The room's week as written to its TRVZB, in the frame the TRV compares with.

        Built from the week for everyone at home (`fallback_schedule_for`).
        """
        week = self.fallback_schedule_for(room_id)
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
            "demand_mode",
            "eco_limit_k",
            "damp_margin_k",
        },
        p,
    )
    d = BoilerConfig()
    nozzle = raw.get("nozzle_lph")
    try:
        demand_mode = DemandMode(ctx.get(raw, "demand_mode", str, d.demand_mode.value, p))
    except ValueError:
        ctx.err(f"{p}demand_mode", "must be eco or comfort")
        demand_mode = d.demand_mode
    comfort_limit = ctx.number(raw, "comfort_limit_k", d.comfort_limit_k, 0.2, 1.5, p)
    eco_limit = ctx.number(raw, "eco_limit_k", d.eco_limit_k, 0.5, 3.0, p)
    if eco_limit < comfort_limit:
        ctx.err(f"{p}eco_limit_k", "must be at least comfort_limit_k")
    return BoilerConfig(
        min_burn_s=ctx.number(raw, "min_burn_min", d.min_burn_s / 60, 4, 20, p) * 60,
        min_off_s=ctx.number(raw, "min_off_min", d.min_off_s / 60, 5, 30, p) * 60,
        max_starts_per_hour=int(
            ctx.number(raw, "max_starts_per_hour", d.max_starts_per_hour, 1, 6, p)
        ),
        valve_lead_s=ctx.number(raw, "valve_lead_s", d.valve_lead_s, 30, 300, p),
        comfort_limit_k=comfort_limit,
        frost_c=ctx.number(raw, "frost_c", d.frost_c, 5, 10, p),
        output_kw=ctx.number(raw, "output_kw", d.output_kw, 3, 70, p),
        nozzle_lph=ctx.number(raw, "nozzle_lph", 0.0, 0.1, 10, p) if nozzle is not None else None,
        demand_mode=demand_mode,
        eco_limit_k=eco_limit,
        damp_margin_k=ctx.number(raw, "damp_margin_k", d.damp_margin_k, 0, 1, p),
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
        raw,
        {
            "host",
            "password",
            "heating_switch",
            "store_switch",
            "auto_off_min",
            "burner_metering",
            "burner_threshold_w",
            "burner_hysteresis_w",
        },
        p,
    )
    host = ctx.get(raw, "host", str, "", p)
    if not host:
        ctx.err(f"{p}host", "required")
    heating = int(ctx.number(raw, "heating_switch", 0, 0, 3, p))
    store = int(ctx.number(raw, "store_switch", 1, 0, 3, p))
    if heating == store:
        ctx.err(f"{p}store_switch", "must differ from heating_switch")
    threshold = ctx.number(raw, "burner_threshold_w", 100, 10, 3000, p)
    hysteresis = ctx.number(raw, "burner_hysteresis_w", 20, 0, 1000, p)
    if hysteresis >= threshold:
        ctx.err(f"{p}burner_hysteresis_w", "must be less than burner_threshold_w")
    return ShellyConfig(
        host=host,
        password=ctx.get(raw, "password", str, None, p) or None,
        heating_switch=heating,
        store_switch=store,
        auto_off_s=ctx.number(raw, "auto_off_min", 120, 15, 240, p) * 60,
        burner_metering=ctx.get(raw, "burner_metering", bool, True, p),
        burner_threshold_w=threshold,
        burner_hysteresis_w=hysteresis,
    )


def _learning(ctx: _Ctx, raw: dict) -> LearningConfig:
    p = "learning."
    ctx.unknown(raw, {"memory_days", "learn_on_trv_fallback"}, p)
    d = LearningConfig()
    return LearningConfig(
        memory_days=ctx.number(
            raw, "memory_days", d.memory_days, MEMORY_DAYS_MIN, MEMORY_DAYS_MAX, p
        ),
        learn_on_trv_fallback=ctx.get(
            raw, "learn_on_trv_fallback", bool, d.learn_on_trv_fallback, p
        ),
    )


def _suggestions(ctx: _Ctx, raw: dict) -> SuggestionConfig:
    p = "suggestions."
    d = SuggestionConfig()
    ranges = {
        "min_confidence": (0.3, 0.95),
        "min_learning_h": (6, 2000),
        "min_rooms": (2, 20),
        "heat_loss_ratio": (1.1, 5),
        "compare_delta_k": (5, 30),
        "design_outdoor_c": (-25, 10),
        "mild_outdoor_c": (-10, 15),
        "slow_warm_ratio": (1.2, 5),
        "slow_warm_extra_min": (0, 60),
        "min_lag_samples": (3, 15),
    }
    ctx.unknown(raw, set(ranges), p)
    values = {k: ctx.number(raw, k, getattr(d, k), lo, hi, p) for k, (lo, hi) in ranges.items()}
    for k in ("min_rooms", "min_lag_samples"):
        if values[k] != int(values[k]):
            ctx.err(f"{p}{k}", "must be a whole number")
        values[k] = int(values[k])
    if values["mild_outdoor_c"] <= values["design_outdoor_c"]:
        ctx.err(f"{p}mild_outdoor_c", "must be above design_outdoor_c")
    return SuggestionConfig(**values)


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


def _monitoring(ctx: _Ctx, raw: dict) -> MonitoringOptions:
    p = "monitoring."
    ctx.unknown(raw, {"low_battery_pct", "weak_signal_lqi"}, p)
    d = MonitoringOptions()
    return MonitoringOptions(
        low_battery_pct=ctx.number(raw, "low_battery_pct", d.low_battery_pct, 5, 50, p),
        weak_signal_lqi=ctx.number(raw, "weak_signal_lqi", d.weak_signal_lqi, 5, 150, p),
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
    "use",
}


def _rooms(
    ctx: _Ctx,
    raw: Any,
    schedules: dict[str, WeekSchedule],
    notes: list[str],
    household_rooms: set[str],
    use_levels: dict[str, tuple[UseLevel, UseLevel]],
) -> tuple[list[RoomConfig], dict[str, RoomDevices], dict[str, str | None]]:
    if not isinstance(raw, list) or not raw:
        ctx.err("rooms", "expected a non-empty list")
        return [], {}, {}
    rooms: list[RoomConfig] = []
    devices: dict[str, RoomDevices] = {}
    own: dict[str, str | None] = {}
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
            ctx.err(f"{p}role", "must be normal, passive, internal_sensor_only or unheated")
            role = RoomRole.NORMAL
        heat_source = None
        if item.get("heat_source") is not None:
            try:
                heat_source = HeatSource(ctx.get(item, "heat_source", str, "", p))
            except ValueError:
                ctx.err(f"{p}heat_source", "must be episodic or continuous")
            if role is RoomRole.UNHEATED:
                ctx.err(
                    f"{p}heat_source",
                    "an unheated room has no room model, so it has no heat source",
                )
        trv = ctx.get(item, "trv", str, None, p) or None
        sensor = ctx.get(item, "sensor", str, None, p) or None
        window = ctx.get(item, "window", str, None, p) or None
        sched: str | None = ctx.get(item, "schedule", str, "default", p)
        if role is RoomRole.UNHEATED:
            if item.get("schedule") is not None:
                ctx.err(f"{p}schedule", "an unheated room has no radiator, so it has no schedule")
            sched = None
        elif role is not RoomRole.PASSIVE:
            own[rid] = sched if sched in schedules else None
        if rid in household_rooms and role is not RoomRole.UNHEATED:
            if item.get("schedule") is not None:
                ctx.err(
                    f"{p}schedule",
                    "the household section builds this room's schedule; remove one of them",
                )
            sched = None
        if item.get("use") is not None:
            if role is RoomRole.PASSIVE:
                ctx.err(f"{p}use", "a passive room has no valve, so it has no use level")
            elif role is RoomRole.UNHEATED:
                ctx.err(f"{p}use", "an unheated room has no radiator, so it has no use level")
            elif rid in household_rooms:
                ctx.err(
                    f"{p}use",
                    "the household section sets this room's use level; remove one of them",
                )
            else:
                levels = _use(ctx, item["use"], f"{p}use")
                if levels is not None:
                    use_levels[rid] = levels

        if role is RoomRole.NORMAL:
            if trv is None:
                ctx.err(
                    f"{p}trv",
                    "required for a normal room (use role: passive if unvalved, "
                    "or role: unheated if it has no radiator)",
                )
            if sensor is None:
                ctx.err(f"{p}sensor", "required for a normal room (or role: internal_sensor_only)")
        elif role is RoomRole.INTERNAL_SENSOR_ONLY:
            if trv is None:
                ctx.err(f"{p}trv", "required for an internal_sensor_only room")
            if sensor is not None:
                ctx.err(f"{p}sensor", "an internal_sensor_only room has no room sensor")
        elif role is RoomRole.UNHEATED:
            if trv is not None:
                ctx.err(f"{p}trv", "an unheated room has no radiator, so it has no TRV")
            if sensor is None:
                ctx.err(f"{p}sensor", "required for an unheated room")
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
        # Humidity drives shower detection (spec 4.6); opt in per room. An unheated room
        # has no shower detection, so its humidity is recorded unless turned off.
        humidity = ctx.get(item, "humidity", bool, role is RoomRole.UNHEATED, p)
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
    return rooms, devices, own


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
    linked: dict[str, str] = {}  # Home Assistant person entity: who it is linked to
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
            {
                "name",
                "weekdays",
                "weekend",
                "getting_up_min",
                "bedtime_min",
                "weekend_days",
                "ha_person",
            },
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
        ha_person = _ha_person(ctx, item, f"{at}.", linked)
        if ha_person is not None:
            linked[ha_person] = name or str(pid)
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
                    ha_person=ha_person,
                )
            )
    return people


def _ha_person(ctx: _Ctx, item: dict, path: str, linked: dict[str, str]) -> str | None:
    """An optional Home Assistant `person` entity ID, linked to one person at most.

    Empty or null means not linked.
    """
    raw = ctx.get(item, "ha_person", str, "", path).strip()
    if not raw:
        return None
    if not HA_PERSON.match(raw):
        ctx.err(f"{path}ha_person", "must be a person entity ID, such as person.sam")
        return None
    if raw in linked:
        ctx.err(f"{path}ha_person", f"{linked[raw]} is already linked to {raw}")
        return None
    return raw


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
    if room.role is RoomRole.UNHEATED:
        ctx.err(at, "an unheated room has no radiator, so it has no schedule")
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
            "adjust",
        },
        f"{at}.",
    )
    use = _use(ctx, item.get("use"), f"{at}.use")
    adjust = _adjustments(ctx, item.get("adjust"), f"{at}.adjust")
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
        adjust=adjust,
    )


_DAY_TOKENS = {d[:3] for d in DAY_ALIASES if len(DAY_ALIASES[d]) == 1}


def _adjust_days(ctx: _Ctx, raw: Any, path: str) -> tuple[str, ...] | None:
    """`weekdays`, `weekend`, `daily`, a day (`mon`, `monday`) or a list of them."""
    hint = "use weekdays, weekend, daily or a day, mon to sun"
    if raw is None:
        ctx.err(path, f"required: {hint}")
        return None
    items = raw if isinstance(raw, list) else [raw]
    if not items:
        ctx.err(path, f"expected at least one day: {hint}")
        return None
    out: list[str] = []
    for i, name in enumerate(items):
        at = f"{path}[{i}]" if isinstance(raw, list) else path
        token = str(name).lower()
        if token in ADJUST_GROUPS:
            out.append(token)
        elif token in DAY_ALIASES and token[:3] in _DAY_TOKENS:
            out.append(token[:3])
        else:
            ctx.err(at, f"{name!r} is not a day: {hint}")
            return None
    if len(set(out)) != len(out):
        ctx.err(path, "a day is listed twice")
        return None
    return tuple(out)


def _adjustments(ctx: _Ctx, raw: Any, path: str) -> tuple[Adjustment, ...]:
    """A room's adjustments: keep it warm or cold from one time to another on some days."""
    if raw is None:
        return ()
    if not isinstance(raw, list):
        ctx.err(path, "expected a list of adjustments, each with days, keep, from and to")
        return ()
    lim = LIMITS["rooms.adjust"]
    if len(raw) > lim.hi:
        ctx.err(path, f"at most {lim.hi:g} adjustments a room")
        return ()
    out: list[Adjustment] = []
    for i, item in enumerate(raw):
        at = f"{path}[{i}]"
        if not isinstance(item, dict):
            ctx.err(at, "expected a mapping with days, keep, from and to")
            continue
        ctx.unknown(item, {"days", "keep", "from", "to"}, f"{at}.")
        days = _adjust_days(ctx, item.get("days"), f"{at}.days")
        keep: Keep | None = None
        if item.get("keep") is None:
            ctx.err(f"{at}.keep", "required: warm or cold")
        else:
            try:
                keep = Keep(item["keep"])
            except ValueError:
                ctx.err(f"{at}.keep", "must be warm or cold")
        start = _clock(ctx, item.get("from"), f"{at}.from")
        end = _clock(ctx, item.get("to"), f"{at}.to", end=True)
        if start is not None and end is not None and end <= start:
            ctx.err(f"{at}.to", "must be after from, on the same day")
            continue
        if days is None or keep is None or start is None or end is None:
            continue
        out.append(Adjustment(days=days, keep=keep, from_min=start, to_min=end))
    return tuple(out)


def _household(ctx: _Ctx, raw: dict, rooms: list[RoomConfig]) -> Household:
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
    keys = (
        "presence_delay_min",
        "presence_stale_after_min",
        "return_warmup_min",
        "presence_evidence_max_age_min",
        "presence_weak_source_delay_min",
    )
    ctx.unknown(raw, {*keys, "everyone_away"}, p)
    values = {k: _or(_minutes(ctx, raw, k, f"away.{k}", p), getattr(d, k)) for k in keys}
    everyone = _choice(ctx, raw, "everyone_away", EveryoneAway, d.everyone_away, p)
    return AwaySettings(everyone_away=everyone, **values)


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
            "learning",
            "monitoring",
            "suggestions",
        },
        "",
    )
    notes: list[str] = []

    house = ctx.section(data, "house")
    ctx.unknown(
        house,
        {
            "timezone",
            "dry_run",
            "outdoor_sensor",
            "outdoor_source",
            "outdoor_stale_after_min",
            "data_dir",
            "sensor_max_silence_min",
            "history_days",
            "fire_flag_hours",
        },
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

    schedule_use: dict[str, tuple[UseLevel, UseLevel]] = {}
    rooms, devices, own = _rooms(
        ctx, data.get("rooms"), schedules, notes, household_rooms, schedule_use
    )
    household = _household(ctx, raw_household, rooms) if raw_household else None
    balancing = ctx.get(data, "balancing", bool, True, "")
    cfg = HouseConfig(
        rooms=tuple(rooms),
        boiler=_boiler(ctx, ctx.section(data, "boiler")),
        store=_store(ctx, ctx.section(data, "store")),
        learning=_learning(ctx, ctx.section(data, "learning")),
        suggestions=_suggestions(ctx, ctx.section(data, "suggestions")),
        balancing=balancing,
    )
    mqtt = _mqtt(ctx, ctx.section(data, "mqtt"))
    shelly = _shelly(ctx, ctx.section(data, "shelly"))
    trv = _trv(ctx, ctx.section(data, "trv"))
    monitoring = _monitoring(ctx, ctx.section(data, "monitoring"))
    outdoor = ctx.get(house, "outdoor_sensor", str, None, "house.") or None
    outdoor_source, outdoor_stale_min = _outdoor_source(ctx, house, outdoor, notes)
    if any(d.trv or d.sensor or d.window for d in devices.values()) or outdoor:
        if mqtt is None:
            ctx.err("mqtt", "required: rooms use Zigbee2MQTT devices")
    if shelly is None:
        notes.append("No shelly section: the boiler relay is not driven.")
    if not dry_run:
        notes.append("dry_run is false: Radiate will write to valves and the boiler relay.")

    data_dir = ctx.get(house, "data_dir", str, "./data", "house.")
    silence_min = ctx.number(house, "sensor_max_silence_min", 60, 10, 180, "house.")
    history_days = ctx.number(house, "history_days", 14, 0, 90, "house.")
    fire_flag_hours = ctx.number(house, "fire_flag_hours", 6, 0.5, 24, "house.")

    if ctx.problems:
        raise ConfigError(ctx.problems)
    site = SiteConfig(
        house=cfg,
        devices=devices,
        schedules=schedules,
        timezone=tz,
        dry_run=dry_run,
        outdoor_sensor=outdoor,
        outdoor_source=outdoor_source,
        outdoor_stale_after_s=outdoor_stale_min * 60,
        mqtt=mqtt,
        shelly=shelly,
        trv=trv,
        monitoring=monitoring,
        data_dir=data_dir,
        sensor_max_silence_s=silence_min * 60,
        fire_flag_s=fire_flag_hours * 3600,
        history_days=history_days,
        notes=tuple(notes),
        room_schedules=own,
        schedule_use=schedule_use,
        file_household=household,
    )
    return apply_household(site, household, "house_file")


OUTDOOR_STALE_MIN = (30, 1440)


def _outdoor_source(
    ctx: _Ctx, house: dict, sensor: str | None, notes: list[str]
) -> tuple[OutdoorSource, float]:
    """`house.outdoor_source` and `house.outdoor_stale_after_min`."""
    raw = ctx.get(house, "outdoor_source", str, OutdoorSource.ZIGBEE.value, "house.")
    try:
        source = OutdoorSource(raw)
    except ValueError:
        ctx.err("house.outdoor_source", "must be zigbee, home_assistant or both")
        source = OutdoorSource.ZIGBEE
    lo, hi = OUTDOOR_STALE_MIN
    stale_min = ctx.number(
        house, "outdoor_stale_after_min", DEFAULT_STALE_AFTER_S / 60, lo, hi, "house."
    )
    if source is OutdoorSource.BOTH and not sensor:
        ctx.err(
            "house.outdoor_source",
            "both needs house.outdoor_sensor; use home_assistant without a Zigbee sensor",
        )
    if source is OutdoorSource.HOME_ASSISTANT and sensor:
        notes.append(
            "house.outdoor_sensor is not used: house.outdoor_source is home_assistant. "
            "Use both to prefer the Zigbee sensor."
        )
    return source, stale_min


def parse_household(raw: Any, site: SiteConfig) -> Household:
    """Validate a `household` section against the site's rooms, as the house file is.

    The section replaces the house file's own, so every controllable room must be
    listed or have a schedule of its own in the house file. Raises ConfigError listing
    every problem, each with its path (`household.people.sam.weekdays.up: ...`).
    """
    ctx = _Ctx()
    if not isinstance(raw, dict):
        raise ConfigError(["household: expected a mapping"])
    household = _household(ctx, raw, list(site.house.rooms))
    raw_rooms = raw.get("rooms")
    listed = {str(k) for k in raw_rooms} if isinstance(raw_rooms, dict) else set()
    for rc in site.house.rooms:
        if rc.controllable and rc.id not in listed and site.room_schedules.get(rc.id) is None:
            ctx.err(
                f"household.rooms.{rc.id}",
                "required: the house file gives this room no schedule of its own",
            )
    if ctx.problems:
        raise ConfigError(ctx.problems)
    return household


def apply_household(site: SiteConfig, household: Household | None, source: str) -> SiteConfig:
    """The site with `household` in place of its current one. Pure.

    Household rooms get compiled weeks; every other room goes back to the schedule the
    house file gives it. `household` must be valid for the site (see `parse_household`).
    """
    linked = {r.room_id for r in household.rooms} if household else set()
    devices = {
        rid: replace(dev, schedule=None if rid in linked else site.room_schedules[rid])
        if rid in site.room_schedules
        else dev
        for rid, dev in site.devices.items()
    }
    base = tuple(n for n in site.notes if n not in site.household_notes)
    notes: list[str] = []
    schedules: dict[str, WeekSchedule] = {}
    live: dict[str, WeekSchedule] = {}
    levels: dict[str, tuple[UseLevel, ...]] = {}
    if household is not None:
        notes.extend(f"{path} {text}" for path, text in household_advice(household))
        compiled = compile_household(household)
        schedules, live = compiled.schedules, compiled.live
        levels = {
            rid: tuple(
                level if compiled.periods[rid][day] else UseLevel.UNUSED
                for day, level in enumerate(days)
            )
            for rid, days in compiled.warm_levels.items()
        }
        notes.extend(compiled.notes)
    return replace(
        site,
        devices=devices,
        household=household,
        household_schedules=schedules,
        household_live=live,
        household_fallback=dict(schedules),
        household_fallback_levels=dict(levels),
        household_source=source if household is not None else None,
        household_notes=tuple(notes),
        notes=base + tuple(notes),
        saved_problems=(),
    )


SAVED_SOURCE_WARNING = (
    "The household saved from the web UI replaces the house file's household section "
    "as a whole, away settings included. Changes to that section in the house file have "
    "no effect until the saved setup is deleted (DELETE /api/v1/household, or remove "
    "household.yaml from the data directory)."
)


def shadowed_household_keys(site: SiteConfig) -> list[str]:
    """Settings in the house file's `household` section that the household saved from
    the web UI hides, because it differs there: dotted keys such as
    `away.everyone_away`, or a whole part such as `people`. Empty unless the saved
    household is in use and the house file has a section of its own.
    """
    if site.household_source != "saved" or site.file_household is None or not site.household:
        return []
    mine, saved = household_section(site.file_household), household_section(site.household)
    out: list[str] = []
    for key in sorted(set(mine) | set(saved)):
        a, b = mine.get(key), saved.get(key)
        if a == b:
            continue
        if key in ("timing", "away", "temperatures"):
            a, b = a or {}, b or {}
            out.extend(f"{key}.{k}" for k in sorted(set(a) | set(b)) if a.get(k) != b.get(k))
        else:
            out.append(key)
    return out


def apply_saved(site: SiteConfig) -> SiteConfig:
    """The site with the household saved from the web UI, if `site.data_dir` holds one.

    A saved household that is not valid for the house file (a room was removed since,
    say) is not used: the house file's setup applies, and `saved_problems` and a note
    say why, so Radiate still starts and the web UI can offer to fix it.
    """
    from .saved import read_saved, saved_path

    try:
        raw = read_saved(site.data_dir)
        if raw is None:
            return site
        household = parse_household(raw, site)
    except ConfigError as err:
        note = (
            f"{saved_path(site.data_dir)}: the household saved from the web UI was not used, "
            f"so the house file's setup applies: {'; '.join(err.problems)}"
        )
        return replace(site, saved_problems=tuple(err.problems), notes=(*site.notes, note))
    return apply_household(site, household, "saved")


def read_house_file(path: str | Path) -> Any:
    """The house file as parsed YAML, before any checks. Raises OSError or ConfigError."""
    import yaml

    text = Path(path).read_text(encoding="utf-8")
    try:
        return yaml.safe_load(text)
    except yaml.YAMLError as err:
        raise ConfigError([f"{path}: not valid YAML: {err}"]) from None


def parse_with_settings(
    data: Any, flat: dict[str, Any], env: dict[str, str] | None = None
) -> tuple[SiteConfig, dict]:
    """The site from the house file `data` with saved settings `flat` laid over it
    (`radiate.config.settings`), and the merged house file. Raises ConfigError listing
    every problem, settings with nowhere to go included."""
    from .settings import merge_settings

    merged, problems = merge_settings(data, flat)
    if problems:
        raise ConfigError(problems)
    site = parse_site(merged, env)
    return replace(site, saved_settings=tuple(flat)), merged


def apply_saved_settings(
    data: Any, site: SiteConfig, env: dict[str, str] | None = None
) -> SiteConfig:
    """The site with the settings saved from the web UI, if `site.data_dir` holds any.

    Saved settings that would make the configuration invalid are not used: the house
    file's settings apply, and `settings_problems` and a note say why, so Radiate still
    starts and the web UI can offer to fix them. `site` is the house file's own.
    """
    from .saved import read_settings, settings_path
    from .settings import flatten

    try:
        nested = read_settings(site.data_dir)
        if nested is None:
            return site
        flat, problems = flatten(nested)
        if problems:
            raise ConfigError(problems)
        saved, _ = parse_with_settings(data, flat, env)
    except ConfigError as err:
        note = (
            f"{settings_path(site.data_dir)}: the settings saved from the web UI were not "
            f"used, so the house file's apply: {'; '.join(err.problems)}"
        )
        return replace(site, settings_problems=tuple(err.problems), notes=(*site.notes, note))
    return replace(saved, data_dir=site.data_dir)


def load_site(
    path: str | Path, env: dict[str, str] | None = None, data_dir: str | Path | None = None
) -> SiteConfig:
    """Read and validate a YAML config file, then apply the settings and the household
    saved in the data directory, if any. `data_dir` replaces `house.data_dir`, as
    `--data-dir` does."""
    data = read_house_file(path)
    site = parse_site(data, env)
    if data_dir is not None:
        site = replace(site, data_dir=str(data_dir))
    return apply_saved(apply_saved_settings(data, site, env))
