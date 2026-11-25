"""Configuration, input snapshot and action types for the core engine.

Times are seconds on a monotonic clock supplied by the caller. Temperatures are °C.
Openings are TRVZB `valve_opening_degree` percentages (0 to 100).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum


class RoomRole(StrEnum):
    NORMAL = "normal"
    PASSIVE = "passive"  # radiator not controllable (e.g. unvalved bypass), observed only
    INTERNAL_SENSOR_ONLY = "internal_sensor_only"  # no room sensor, use TRV internal reading
    # No radiator at all, only a room sensor: recorded, never controlled or learned, and
    # never evidence of heat reaching the radiators (a boiler casing can warm it).
    UNHEATED = "unheated"


class HeatSource(StrEnum):
    EPISODIC = "episodic"  # open fire, wood burner
    CONTINUOUS = "continuous"  # range cooker (Aga)


class Mode(StrEnum):
    AUTO = "auto"
    OFF = "off"  # heating off, frost protection still active
    FROST = "frost"  # every room held at the frost threshold


class BoilerState(StrEnum):
    IDLE = "idle"
    LEAD = "lead"  # valves opening before the burner is called
    FIRING = "firing"
    REST = "rest"  # minimum off time running


class DemandMode(StrEnum):
    """How calling rooms fire the boiler (spec 5.3)."""

    ECO = "eco"  # pooled demand: a room on its own waits for others or a wider limit
    COMFORT = "comfort"  # any calling room past the comfort limit fires the boiler


# No saving rule lets a room wait below this (spec 5.8). The household setup warns
# about unused and night temperatures below it (`config.household.DAMP_BELOW_C`).
DAMP_FLOOR_C = 12.0


class RoomUse(StrEnum):
    """How a room is used right now, from the household or a hand-written schedule's
    use level (spec 5.8)."""

    IN_USE = "in_use"
    OCCASIONAL = "occasional"
    SETBACK = "setback"  # unused today, overnight, between warm periods, away


@dataclass(frozen=True, slots=True)
class RoomConfig:
    id: str
    name: str
    role: RoomRole = RoomRole.NORMAL
    heat_source: HeatSource | None = None
    has_humidity: bool = False
    trv_bias_k: float = -1.5  # room ≈ TRV internal + bias, for internal-sensor-only rooms
    actuation_enabled: bool = True  # spec 4.5: test on one valve first
    # The room's own quiet hours (spec 5.10), local (start, end) minutes of day, which
    # apply on top of the house's. None: only the house's.
    quiet_hours: tuple[int, int] | None = None

    @property
    def controllable(self) -> bool:
        """Has a TRV Radiate drives: a schedule, a room model and demand."""
        return self.role in (RoomRole.NORMAL, RoomRole.INTERNAL_SENSOR_ONLY)


@dataclass(frozen=True, slots=True)
class BoilerConfig:
    min_burn_s: float = 8 * 60
    min_off_s: float = 10 * 60
    max_starts_per_hour: int = 3
    valve_lead_s: float = 90
    comfort_limit_k: float = 0.5
    frost_c: float = 7.0
    hard_frost_c: float = 5.0
    output_kw: float = 13.0
    nozzle_lph: float | None = None
    demand_mode: DemandMode = DemandMode.ECO  # the default; the runtime can change it
    eco_limit_k: float = 1.5  # eco: the most a calling room waits below its target
    damp_floor_c: float = DAMP_FLOOR_C  # not in the configuration file (spec 5.8)
    # Eco with room use: a room starts a burn alone this far above the damp floor, so its
    # air stays above the floor while the burn gets going (spec 5.8, open question 12).
    damp_margin_k: float = 0.3


@dataclass(frozen=True, slots=True)
class LearningConfig:
    """Room model learning (spec 4.3, 4.6)."""

    memory_days: float = 730.0  # RLS memory, in days of learning updates
    # Learn from the TRV reading while a normal room's own sensor is stale. Off: the
    # `sensor_stale` gate pauses learning until the sensor is back (spec 4.6).
    learn_on_trv_fallback: bool = False


@dataclass(frozen=True, slots=True)
class SuggestionConfig:
    """When the house suggestions speak up (`radiate.core.suggestions`).

    Every limit is a setting: what counts as enough learning, how different a room
    must be from the rest of the house, and the coldest weather the heating should
    cope with.
    """

    min_confidence: float = 0.6  # a room's model must be at least this certain
    min_learning_h: float = 48.0  # hours of learning updates before a room is judged
    min_rooms: int = 3  # rooms with enough learning before rooms are compared
    heat_loss_ratio: float = 1.6  # heat loss this many times the house's typical
    compare_delta_k: float = 15.0  # inside minus outside used to put a loss in words
    design_outdoor_c: float = -2.0  # the coldest weather the heating should keep up with
    mild_outdoor_c: float = 5.0  # short of target even above this: act on it
    slow_warm_ratio: float = 2.0  # arrival lag this many times the house's typical
    slow_warm_extra_min: float = 10.0  # and at least this many minutes longer
    min_lag_samples: int = 5  # measured arrivals before a room's lag is judged


@dataclass(frozen=True, slots=True)
class StoreConfig:
    windows: tuple[tuple[int, int], ...] = ((6 * 60, 7 * 60 + 30), (17 * 60, 21 * 60))
    recovery_s: float = 25 * 60
    priority_over_heating: bool = True


@dataclass(frozen=True, slots=True)
class HouseConfig:
    rooms: tuple[RoomConfig, ...]
    boiler: BoilerConfig = field(default_factory=BoilerConfig)
    store: StoreConfig = field(default_factory=StoreConfig)
    learning: LearningConfig = field(default_factory=LearningConfig)
    suggestions: SuggestionConfig = field(default_factory=SuggestionConfig)
    balancing: bool = True  # False: every heating valve fully open (for comparison)
    supply_kappa: float = 0.15  # supply factor sensitivity to total opening
    bypass_equivalent: float = 0.4  # always-open path, in fully-open-radiator equivalents
    sink_min: float = 1.5  # open-path guarantee, in fully-open-radiator equivalents
    opening_floor: int = 20
    comfort_horizon_s: float = 150 * 60
    hysteresis_k: float = 0.3
    internal_sensor_hysteresis_k: float = 1.0
    # Quiet hours (spec 5.10): a local (start, end) in minutes of day, which may cross
    # midnight, with no heating but to hold the damp floor. None: off. The caller works out
    # whether it applies now and says so in `Snapshot.quiet_until_min`.
    quiet_hours: tuple[int, int] | None = None
    # Preferred heat sinks (spec 5.4): room ids tried first, in order, when the burner
    # needs somewhere for its heat; `heat_sinks_quiet` while the house's quiet hours hold.
    heat_sinks: tuple[str, ...] = ()
    heat_sinks_quiet: tuple[str, ...] = ()

    def room(self, room_id: str) -> RoomConfig:
        for r in self.rooms:
            if r.id == room_id:
                return r
        raise KeyError(room_id)


@dataclass(slots=True)
class RoomInput:
    """Everything the core knows about one room at one instant."""

    temperature: float | None = None  # room sensor
    temperature_age_s: float = 0.0
    # The room sensor reading was remembered from before a restart and the sensor has
    # not reported since: used for demand, but not as a step for slopes or detectors.
    temperature_restored: bool = False
    # A room sensor is configured but has not reported since start (and nothing was
    # remembered), for this long. The core waits for it rather than fall back to the
    # TRV at once. None: no room sensor, or not known (snapshots from older versions).
    sensor_missing_s: float | None = None
    trv_temperature: float | None = None  # TRV internal sensor
    trv_age_s: float = 0.0
    trv_available: bool = True
    trv_heating: bool | None = None  # TRV running_state == heat
    opening_echo: int | None = None
    humidity: float | None = None
    setpoint: float = 18.0
    next_setpoint: float | None = None  # next scheduled setpoint, for optimum start
    next_setpoint_in_s: float | None = None
    # How far ahead optimum start may look for `next_setpoint`. None: the core's own
    # horizon (decide.PREHEAT_MAX_S). The runtime widens it for a return after an absence.
    preheat_max_s: float | None = None
    window_open: bool | None = None
    fire_switch: bool | None = None
    # TRV settings the device did not accept after the reconciler's retries (spec 4.5),
    # for example ("valve_opening_degree",). Empty when every write landed.
    trv_rejected: tuple[str, ...] = ()
    # Room use now (spec 5.8). None: no household and no use level for a hand-written
    # schedule; `eco` then behaves as before.
    use: RoomUse | None = None
    # Savings baseline (spec 5.9): the timer-and-valve setpoint now; None while the
    # baseline timer is off, or without a household.
    baseline_c: float | None = None
    # The setpoint is an override someone set (the web UI, the API, Home Assistant).
    # An override wins over quiet hours (spec 5.10).
    override: bool = False
    # Inside this room's quiet hours, the house's or its own (spec 5.10): the local
    # minute of day the last of them ends. None outside them.
    quiet_until_min: int | None = None


@dataclass(slots=True)
class Snapshot:
    now: float  # monotonic seconds
    minute_of_day: int  # local time, for schedules
    outdoor: float | None
    rooms: dict[str, RoomInput]
    heating_relay: bool
    store_relay: bool
    mode: Mode = Mode.AUTO
    store_boost: bool = False
    # Local calendar day (any integer that changes at local midnight, for example
    # `date.toordinal()`), for daily accounting. None: inferred from `minute_of_day`.
    day: int | None = None
    # Hand-back (spec 5.7). False when relay commands are not sent (dry run): the
    # observed relay is then someone else's and the boiler guard keeps its own state.
    relay_follows_commands: bool = True
    # How long the heating relay has been in its observed state, if the driver knows.
    # None: unknown, so a change Radiate did not make is taken as happening now.
    heating_relay_age_s: float | None = None
    # How long the driver went without reading the heating relay before this snapshot
    # (Shelly unreachable). After a few minutes the watchdog may have switched it.
    heating_relay_unseen_s: float = 0.0
    # The demand mode chosen at runtime (spec 5.3). None: `BoilerConfig.demand_mode`.
    # In the snapshot so the tick history records it and replay decides the same way.
    demand_mode: DemandMode | None = None
    # The house has a household, so a savings baseline exists (spec 5.9).
    baseline: bool = False
    # `heating_relay` and `store_relay` were read from the relay this tick. False: the
    # driver could not read it and stood in the last command, which in dry run was
    # never sent. Learning and accounting then ignore the relay (spec 4.6, 5.6).
    relay_observed: bool = True
    # The burner firing for each channel, from the relay's power metering (spec 3,
    # 5.6). None: not metered. With it, heat availability and accounting follow the
    # burner rather than the relay, which the boiler's own thermostat cycles inside.
    heating_burner: bool | None = None
    store_burner: bool | None = None
    # Inside quiet hours (spec 5.10): the local minute of day they end. None outside
    # them. Rooms without an override heat only to hold the damp floor meanwhile, and
    # optimum start waits for the end. The store is not affected.
    quiet_until_min: int | None = None


@dataclass(slots=True)
class ValveAction:
    room_id: str
    setpoint: float
    opening: int
    closing: int = 100
    external_temperature: float | None = None
    pre_opening: int | None = None  # close bump: write this first, then `opening` 5 s later


@dataclass(slots=True)
class Reason:
    code: str
    message: str
    room_id: str | None = None
    values: dict[str, float] = field(default_factory=dict)


@dataclass(slots=True)
class Actions:
    valves: dict[str, ValveAction]
    heating_relay: bool
    store_relay: bool
    boiler_state: BoilerState
    reasons: list[Reason] = field(default_factory=list)
    alerts: list[Reason] = field(default_factory=list)
    # No TRV reachable (spec 7). Once the relay is off, drivers stop commanding the
    # boiler and stop the heartbeat, so the Shelly watchdog's schedule takes over.
    safe_mode: bool = False
    # Safe mode with no burn of Radiate's own running: drivers send no relay commands
    # and no heartbeat, so the Shelly watchdog runs the boiler (spec 5.7, 7).
    watchdog_handover: bool = False
    # Set on the first tick of a new local day: the summary of the day that closed
    # (burner hours, starts, burns, litres, balance score; `core.accounting`).
    day_summary: dict | None = None
