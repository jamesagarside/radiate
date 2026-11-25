"""Closed-loop runs: the simulated house driven by Radiate or by a conventional setup.

Baseline ("smart TRVs, no balancing"): every TRV fully open on its own schedule and
internal sensor, boiler called whenever any TRV is heating, no minimum burn or off
time. That is what per-room integrations (VTherm, Better Thermostat) give today.

Radiate runs are wired like the live driver: Radiate commands the relay and writes a
heartbeat each tick, except while it hands the boiler to the Shelly watchdog in safe
mode. The watchdog (`Watchdog`, after `shelly/radiate-watchdog.js`) takes over when
the heartbeat is 10 min old.

Timer ("the savings baseline as a house", spec 5.9): the heating relay on for the whole
timer window, as a plain programmer does, and each TRV on its own sensor at the
baseline setpoint (the frost threshold while the timer is off), every valve fully open.

Schedules: `fixed` is the original reference schedule (`reference.setpoint`), with no
room use. `household` follows `compile_household(reference_household())` and
`owner` the hand-written weeks with use levels in `reference.OWNER_SCHEDULES`; both
give room use, filled into the snapshot when `room_use` is set (spec 5.8).
"""

from __future__ import annotations

import json
import math
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field

from radiate.config.household import compile_household
from radiate.config.schedule import WeekSchedule
from radiate.config.use import (
    compile_baseline,
    compile_schedule_baseline,
    room_use,
    schedule_room_use,
)
from radiate.core import (
    DAMP_FLOOR_C,
    EngineState,
    HouseConfig,
    RoomInput,
    RoomUse,
    Snapshot,
    decide,
)
from radiate.core.persist import dump_state, load_state
from radiate.core.quiet import quiet_until
from radiate.core.types import Actions, RoomRole

from .house import SimHouse
from .reference import (
    OCCUPIED,
    OWNER_USE,
    ROOMS,
    build_house,
    house_config,
    next_change,
    owner_weeks,
    reference_household,
    setpoint,
)

STEP_S = 30.0
CONTROL_S = 60.0
DAY = 86400.0
REPORT_HEARTBEAT_S = 600.0
# Shelly watchdog fallback schedule (spec 5.7): occupied windows with an hour's lead.
WATCHDOG_SCHEDULE = ((5 * 60 + 30, 8 * 60 + 30), (16 * 60, 22 * 60 + 30))
WATCHDOG_STORE = ((6 * 60, 7 * 60 + 30), (17 * 60, 21 * 60))
NOZZLE_LPH = 1.64  # litres an hour while the burner fires (efficiency plan, slice 6)
# The fixed schedule's timer: from the first warm period less 30 minutes to the last end.
FIXED_TIMER = (6 * 60, 22 * 60 + 30)
SCHEDULES = ("fixed", "household", "owner")


@dataclass(frozen=True)
class SchedulePlan:
    """Setpoints, room use and the savings baseline for a schedule with room use.

    `live`: what Radiate follows. `valve`: what each TRV's own schedule holds. `use_at`
    and `baseline_at` take (room id, weekday, minute of day); weekday 0 is the run's
    first day, a Monday. `household`: the plan has a savings baseline (spec 5.9), so
    the snapshot carries it as the runtime's would.
    """

    live: dict[str, WeekSchedule]
    valve: dict[str, WeekSchedule]
    use_at: Callable[[str, int, int], RoomUse | None]
    baseline_at: Callable[[str, int, int], float | None]
    household: bool


def household_plan() -> SchedulePlan:
    """The reference household (`reference_household`), compiled with nobody away."""
    hh = reference_household()
    compiled = compile_household(hh)
    baseline = compile_baseline(hh)
    return SchedulePlan(
        live=dict(compiled.live),
        valve=dict(compiled.schedules),
        use_at=lambda rid, wd, m: room_use(compiled, rid, wd, m),
        baseline_at=baseline.setpoint_at,
        household=True,
    )


def owner_plan() -> SchedulePlan:
    """The owner-like house: hand-written weeks with use levels (`rooms[].use`).

    Its savings baseline is Radiate's for hand-written rooms (`compile_schedule_baseline`,
    no household): the timer from the earliest warm period start in the house to the
    latest end, each room at the highest setpoint its schedule sets that day.
    """
    weeks = owner_weeks()
    baseline = compile_schedule_baseline(weeks, weeks)
    return SchedulePlan(
        live=weeks,
        valve=weeks,
        use_at=lambda rid, wd, m: schedule_room_use(weeks[rid], OWNER_USE[rid], wd, m),
        baseline_at=baseline.setpoint_at,
        household=True,
    )


def schedule_plan(schedule: str) -> SchedulePlan | None:
    if schedule == "fixed":
        return None
    if schedule == "household":
        return household_plan()
    if schedule == "owner":
        return owner_plan()
    raise ValueError(f"unknown schedule {schedule!r}; expected one of {', '.join(SCHEDULES)}")


def _warm_use(plan: SchedulePlan | None, rid: str, weekday: int, minute: int) -> RoomUse:
    """Room use for measuring comfort: the fixed schedule's occupied periods count as
    in use, everything else as setback."""
    if plan is None:
        return RoomUse.IN_USE if any(a <= minute < b for a, b in OCCUPIED) else RoomUse.SETBACK
    return plan.use_at(rid, weekday, minute) or RoomUse.SETBACK


def _setpoint(plan: SchedulePlan | None, spec, weekday: int, minute: int) -> float:
    if plan is None:
        return setpoint(spec, minute)
    return plan.live[spec.id].setpoint_at(weekday, minute)


def _timer_setpoint(plan: SchedulePlan | None, spec, weekday: int, minute: int) -> float | None:
    if plan is None:
        return spec.comfort if FIXED_TIMER[0] <= minute < FIXED_TIMER[1] else None
    return plan.baseline_at(spec.id, weekday, minute)


@dataclass
class Watchdog:
    """The Shelly script: with no heartbeat for 10 min it runs the relay on a fallback
    schedule with its own minimum burn and off times (spec 5.7)."""

    windows: tuple[tuple[int, int], ...] = WATCHDOG_SCHEDULE
    stale_s: float = 600.0
    min_burn_s: float = 480.0
    min_off_s: float = 600.0
    heartbeat: float = 0.0
    in_control: bool = False
    heat_on: bool = False
    changed_at: float = 0.0

    def tick(self, house: SimHouse, minute: int) -> None:
        now = house.now
        if now - self.heartbeat <= self.stale_s:
            self.in_control = False
            return
        if not self.in_control:
            self.in_control = True
            self.heat_on = house.heating_relay
            self.changed_at = now
        want = any(a <= minute < b for a, b in self.windows)
        held = now - self.changed_at
        if want != self.heat_on and (
            (self.heat_on and held >= self.min_burn_s)
            or (not self.heat_on and held >= self.min_off_s)
        ):
            self.heat_on, self.changed_at = want, now
        house.heating_relay = self.heat_on
        house.store_relay = any(a <= minute < b for a, b in WATCHDOG_STORE)


@dataclass
class Disturbances:
    aga_w: float = 600.0
    fire_days: frozenset[int] = frozenset({0, 2, 3, 5})
    fire_window: tuple[int, int] = (18 * 60 + 30, 22 * 60)
    fire_w: float = 1500.0
    showers: tuple[int, ...] = (7 * 60, 7 * 60 + 25)
    cooking: tuple[int, int] = (17 * 60 + 30, 18 * 60 + 15)


@dataclass
class Result:
    controller: str
    days: int
    arrival_spread_min: list[float] = field(default_factory=list)
    arrival_max_min: list[float] = field(default_factory=list)
    comfort_deficit_kh: float = 0.0
    overheat_kh: float = 0.0
    room_deficit_kh: dict[str, float] = field(default_factory=dict)
    room_overheat_kh: dict[str, float] = field(default_factory=dict)
    burner_starts: int = 0
    burner_hours: float = 0.0
    relay_starts: int = 0
    relay_burns_s: list[float] = field(default_factory=list)
    relay_offs_s: list[float] = field(default_factory=list)
    min_burn_violations: int = 0
    min_off_violations: int = 0
    max_starts_in_hour: int = 0
    engine: EngineState | None = None
    fire_flagged_minutes: int = 0
    last_actions: Actions | None = None
    alert_minutes: dict[str, int] = field(default_factory=dict)  # measured period, by code
    first_alert_s: dict[str, float] = field(default_factory=dict)  # whole run, by code
    day_summaries: list[dict] = field(default_factory=list)  # closed days from the core
    # Relay on but no TRV-fitted radiator passing water: only the bypass takes the heat.
    relay_on_s: float = 0.0
    no_open_valve_s: float = 0.0
    # Efficiency measures (plan slice 6), over the measured days, TRV rooms only.
    # K·min below setpoint while a room is in use or occasional (its warm periods).
    warm_deficit_kmin: float = 0.0
    setback_sum_c: float = 0.0  # °C x samples, rooms while setback
    setback_samples: int = 0
    # Lowest true room temperature, with that room's setpoint and id.
    min_room: tuple[float, float, str] = (math.inf, 0.0, "")
    # Room-minutes with the true temperature below the damp floor (12 °C).
    below_floor_min: float = 0.0
    # Simulated times of the measured relay starts, in seconds.
    relay_starts_at: list[float] = field(default_factory=list)

    @property
    def oil_litres(self) -> float:
        """Oil the burner burned: firing hours x nozzle rating. The simulated truth."""
        return self.burner_hours * NOZZLE_LPH

    @property
    def relay_litres(self) -> float:
        """Oil as Radiate counts it today: relay hours x nozzle rating (spec 5.6)."""
        return self.relay_on_s / 3600 * NOZZLE_LPH

    @property
    def setback_mean_c(self) -> float | None:
        return self.setback_sum_c / self.setback_samples if self.setback_samples else None

    @property
    def min_room_c(self) -> float:
        return self.min_room[0]

    @property
    def guard_violations(self) -> int:
        return self.min_burn_violations + self.min_off_violations

    @property
    def median_spread(self) -> float:
        s = sorted(self.arrival_spread_min)
        return s[len(s) // 2] if s else 0.0

    def summary(self) -> dict[str, float]:
        burns = self.relay_burns_s
        return {
            "median arrival spread (min)": round(self.median_spread, 1),
            "worst arrival (min)": round(max(self.arrival_max_min, default=0.0), 1),
            "comfort deficit (K·h)": round(self.comfort_deficit_kh, 1),
            "overheat (K·h)": round(self.overheat_kh, 1),
            "burner starts": self.burner_starts,
            "burner hours": round(self.burner_hours, 1),
            "relay starts": self.relay_starts,
            "mean relay burn (min)": round(sum(burns) / len(burns) / 60, 1) if burns else 0.0,
            "min burn violations": self.min_burn_violations,
            "min off violations": self.min_off_violations,
            "relay min, no TRV open": round(self.no_open_valve_s / 60),
            "no TRV open (% of relay)": round(100 * self.no_open_valve_s / self.relay_on_s, 1)
            if self.relay_on_s
            else 0.0,
        }


def _apply_disturbances(
    house: SimHouse, d: Disturbances, day: int, minute: int, state: dict
) -> float:
    """Sets room extra heat for this step; returns hot-water draw in W."""
    for room in house.rooms.values():
        room.extra_w = 0.0
    house.rooms["kitchen"].extra_w += d.aga_w
    if d.cooking[0] <= minute < d.cooking[1]:
        house.rooms["kitchen"].extra_w += 800.0

    lounge = house.rooms["lounge"]
    fire_on = day in d.fire_days and d.fire_window[0] <= minute < d.fire_window[1]
    if fire_on:
        lounge.extra_w += d.fire_w
        state["fire_out_at"] = house.now
    elif "fire_out_at" in state:
        lounge.extra_w += 800.0 * math.exp(-(house.now - state["fire_out_at"]) / 5400.0)

    draw = 0.0
    bath = house.rooms["bathroom"]
    showering = any(s <= minute < s + 8 for s in d.showers)
    if showering:
        bath.extra_w += 500.0
        bath.humidity = min(95.0, bath.humidity + 3.0)
        draw = 9000.0
    else:
        bath.humidity += (55.0 - bath.humidity) * (1 - math.exp(-STEP_S / 1200.0))
    return draw


def run(
    controller: str = "radiate",
    days: int = 4,
    warmup_days: int = 2,
    seed: int = 1,
    disturbances: Disturbances | None = None,
    cfg: HouseConfig | None = None,
    engine: EngineState | None = None,
    crash_at_s: float | None = None,
    outdoor_mean: float = 4.0,
    pump_qmax: float | None = None,
    optimum_start: bool = True,
    oil_out_at_s: float | None = None,
    seized_valves: frozenset[str] = frozenset(),
    outage: tuple[float, float] | None = None,
    zigbee_outage: tuple[float, float] | None = None,
    watchdog_windows: tuple[tuple[int, int], ...] = WATCHDOG_SCHEDULE,
    leaking_valves: dict[str, float] | None = None,
    radiator_output: dict[str, tuple[float, float]] | None = None,
    schedule: str = "fixed",
    room_use: bool = False,
    outdoor_by_day: Sequence[float] | None = None,
    metering: bool = True,
) -> Result:
    """One closed-loop run.

    `crash_at_s`: Radiate stops for good. `outage`: Radiate is down from the first time
    to the second, then restarts from its saved state (as `radiate serve` would).
    `zigbee_outage`: no TRV reachable for that span, so Radiate enters safe mode.
    `seized_valves`: no flow at any opening. `leaking_valves`: room id to the share of
    full flow that still passes when the valve is shut (lost calibration).
    `radiator_output`: room id to (time in s, share of the radiator's rated output from
    then on), for a radiator that changes part-way, such as one that silts up (share
    below 1) or is bled or replaced (above 1).

    `controller`: "radiate", "baseline" (smart TRVs) or "timer" (the savings baseline).
    `schedule`: "fixed", "household" or "owner" (see the module notes). `room_use`: fill
    `RoomInput.use` from the schedule, so `eco` acts on it. `outdoor_by_day`: each
    day's outdoor mean in place of `outdoor_mean`. `metering`: Radiate sees the burner
    firing, as from the reference install's Shelly power reading; False for a relay
    without it. The defaults give the original runs, with metering.
    """
    d = disturbances or Disturbances()
    cfg = cfg or house_config()
    plan = schedule_plan(schedule)
    house = build_house(seed)
    house.outdoor_mean = outdoor_mean
    if plan is not None:
        for s in ROOMS:
            trv = house.rooms[s.id].radiator.trv
            if trv is not None:
                # Radiate mirrors each room's valve week into its TRV (spec 4.5).
                week = plan.valve[s.id]
                trv.schedule = lambda m, week=week: week.setpoint_at(int(house.now // DAY) % 7, m)
    if controller == "timer":
        for s in ROOMS:
            trv = house.rooms[s.id].radiator.trv
            if trv is not None:
                trv.schedule = None  # the timer sets each valve itself
    for rid in seized_valves:
        house.rooms[rid].radiator.pipe_k = 0.0  # pin seized shut: the head moves, no flow
    for rid, share in (leaking_valves or {}).items():
        house.rooms[rid].radiator.leak = share
    if pump_qmax is not None:
        house.pump_qmax = pump_qmax
    output_changes = sorted(
        (at, rid, share) for rid, (at, share) in (radiator_output or {}).items()
    )
    st = engine or EngineState.new(cfg)
    res = Result(controller, days - warmup_days, engine=st)
    watchdog = Watchdog(windows=watchdog_windows)
    saved: tuple[dict, float] | None = None  # engine state saved when Radiate went down
    handover = False
    reports = {rid: (house.rooms[rid].reported_t, 0.0) for rid in house.rooms}
    dist_state: dict = {}

    relay_prev = False
    relay_changed_at = 0.0
    relay_starts_at = res.relay_starts_at
    period_tracking: dict[str, dict[str, float]] = {}
    total = days * DAY
    measure_from = warmup_days * DAY
    t_next_control = 0.0
    starts_before = burner_s_before = 0

    while house.now < total:
        day = int(house.now // DAY)
        minute = int((house.now % DAY) // 60)
        weekday = day % 7
        if outdoor_by_day:
            house.outdoor_mean = outdoor_by_day[min(day, len(outdoor_by_day) - 1)]
        if house.now >= measure_from and starts_before == 0 and burner_s_before == 0:
            starts_before = house.boiler.burner_starts or -1
            burner_s_before = house.boiler.burner_on_s or -1.0

        draw = _apply_disturbances(house, d, day, minute, dist_state)
        while output_changes and house.now >= output_changes[0][0]:
            _, rid, share = output_changes.pop(0)
            house.rooms[rid].radiator.rated_w *= share
        if oil_out_at_s is not None and house.now >= oil_out_at_s:
            house.boiler.output_w = 0.0  # tank empty: the burner runs but makes no heat

        for rid, room in house.rooms.items():
            val, at = reports[rid]
            if room.reported_t != val or house.now - at >= REPORT_HEARTBEAT_S:
                reports[rid] = (room.reported_t, house.now)

        if house.now >= t_next_control:
            t_next_control += CONTROL_S
            alive = crash_at_s is None or house.now < crash_at_s
            if outage is not None and outage[0] <= house.now < outage[1]:
                alive = False
                if saved is None:
                    saved = (json.loads(json.dumps(dump_state(st, house.now))), house.now)
            elif saved is not None:
                # Back from the outage: restore, with the time spent down.
                st, _ = load_state(cfg, saved[0], house.now, house.now - saved[1])
                res.engine, saved = st, None
            zigbee_down = (
                zigbee_outage is not None and zigbee_outage[0] <= house.now < zigbee_outage[1]
            )
            if controller == "radiate" and alive:
                snap = _snapshot(house, reports, minute, optimum_start, plan, room_use, metering)
                snap.quiet_until_min = quiet_until(cfg.quiet_hours, minute)
                if zigbee_down:
                    for inp in snap.rooms.values():
                        inp.trv_available = False
                actions = decide(cfg, snap, st)
                if zigbee_down:
                    actions.valves = {}  # unreachable: the TRVs keep their last settings
                if not actions.watchdog_handover:
                    _apply(house, actions)
                    watchdog.heartbeat = house.now
                elif not handover and not actions.heating_relay:
                    house.heating_relay = False  # the driver's last command before handing over
                handover = actions.watchdog_handover
                res.last_actions = actions
                if st.rooms["lounge"].dist.fire and house.now >= measure_from:
                    res.fire_flagged_minutes += 1
                if actions.day_summary is not None:
                    res.day_summaries.append(actions.day_summary)
                for code in {a.code for a in actions.alerts}:
                    res.first_alert_s.setdefault(code, house.now)
                    if house.now >= measure_from:
                        res.alert_minutes[code] = res.alert_minutes.get(code, 0) + 1
            elif controller == "baseline":
                _baseline(house, minute)
            elif controller == "timer":
                _timer(house, plan, weekday, minute, cfg.boiler.frost_c)
            # A crashed or handed-over Radiate leaves the relay alone: TRVs keep their
            # governed settings and the Shelly watchdog takes over after 10 min.
            if controller == "radiate":
                watchdog.tick(house, minute)

        house.step(STEP_S, draw)

        # Relay bookkeeping.
        if house.heating_relay != relay_prev:
            if house.now >= measure_from:
                if house.heating_relay:
                    res.relay_starts += 1
                    relay_starts_at.append(house.now)
                    off = house.now - relay_changed_at
                    res.relay_offs_s.append(off)
                    if off < cfg.boiler.min_off_s - CONTROL_S and relay_changed_at > 0:
                        res.min_off_violations += 1
                else:
                    burn = house.now - relay_changed_at
                    res.relay_burns_s.append(burn)
                    if burn < cfg.boiler.min_burn_s - CONTROL_S:
                        res.min_burn_violations += 1
            relay_prev = house.heating_relay
            relay_changed_at = house.now

        if house.now >= measure_from:
            if plan is None:
                _measure(house, res, minute, period_tracking, day, d)
            _measure_use(house, res, plan, weekday, minute, comfort=plan is not None)
            if house.heating_relay:
                res.relay_on_s += STEP_S
                if not any(
                    r.radiator.conductance() > 0
                    for r in house.rooms.values()
                    if r.radiator.trv is not None
                ):
                    res.no_open_valve_s += STEP_S

    res.burner_starts = house.boiler.burner_starts - max(0, starts_before)
    res.burner_hours = (house.boiler.burner_on_s - max(0.0, burner_s_before)) / 3600
    res.max_starts_in_hour = max(
        (sum(1 for t in relay_starts_at if s <= t < s + 3600) for s in relay_starts_at), default=0
    )
    return res


def _snapshot(
    house: SimHouse,
    reports: dict,
    minute: int,
    optimum_start: bool = True,
    plan: SchedulePlan | None = None,
    room_use: bool = False,
    metering: bool = True,
) -> Snapshot:
    rooms = {}
    weekday = int(house.now // DAY) % 7
    for s in ROOMS:
        room = house.rooms[s.id]
        if plan is None:
            nxt, nxt_in = next_change(s, minute)
            sp = setpoint(s, minute)
        elif s.id in plan.live:
            nxt, nxt_in = plan.live[s.id].next_change(weekday, minute)
            sp = plan.live[s.id].setpoint_at(weekday, minute)
        else:  # the stairs: passive, no schedule
            nxt, nxt_in, sp = setpoint(s, minute), 86400.0, setpoint(s, minute)
        trv = room.radiator.trv
        val, at = reports[s.id]
        rooms[s.id] = RoomInput(
            temperature=None if s.role is RoomRole.INTERNAL_SENSOR_ONLY else val,
            temperature_age_s=house.now - at,
            trv_temperature=round(trv.internal, 1) if trv else None,
            trv_age_s=0.0,
            trv_available=trv.available if trv else False,
            trv_heating=trv.heating if trv else None,
            opening_echo=round(trv.opening_degree) if trv else None,
            humidity=round(room.humidity) if s.humidity else None,
            setpoint=sp,
            next_setpoint=nxt if optimum_start else None,
            next_setpoint_in_s=nxt_in if optimum_start else None,
        )
        if plan is not None and s.id in plan.live:
            if room_use:
                rooms[s.id].use = plan.use_at(s.id, weekday, minute)
            if plan.household:
                rooms[s.id].baseline_c = plan.baseline_at(s.id, weekday, minute)
    b = house.boiler
    snap = Snapshot(
        now=house.now,
        minute_of_day=minute,
        outdoor=round(house.outdoor(), 1),
        rooms=rooms,
        heating_relay=house.heating_relay,
        store_relay=house.store_relay,
        day=int(house.now // DAY),
        # The Shelly's power metering (spec 5.6): the burner firing on each channel.
        # The store has priority, so a burn while the store heats is the store's.
        heating_burner=b.burner and house.heating_relay and not b.store_heating
        if metering
        else None,
        store_burner=b.burner and b.store_heating if metering else None,
    )
    if plan is not None:
        snap.baseline = plan.household
    return snap


def _apply(house: SimHouse, actions: Actions) -> None:
    for rid, v in actions.valves.items():
        trv = house.rooms[rid].radiator.trv
        if trv is None:
            continue
        trv.setpoint = v.setpoint
        trv.opening_degree = v.opening
        trv.closing_degree = v.closing
        if v.external_temperature is not None:
            trv.external = v.external_temperature
            trv.external_set_at = house.now
    house.heating_relay = actions.heating_relay
    house.store_relay = actions.store_relay


def _baseline(house: SimHouse, minute: int) -> None:
    for s in ROOMS:
        trv = house.rooms[s.id].radiator.trv
        if trv:
            trv.setpoint = setpoint(s, minute)
            trv.opening_degree = 100
            trv.closing_degree = 100
            trv.external = None
    house.heating_relay = any(
        r.radiator.trv.heating for r in house.rooms.values() if r.radiator.trv is not None
    )
    house.store_relay = (360 <= minute < 450) or (1020 <= minute < 1260)


def _timer(
    house: SimHouse, plan: SchedulePlan | None, weekday: int, minute: int, frost_c: float
) -> None:
    """The savings baseline as a house: relay on for the timer window, each TRV on its
    own sensor at the baseline setpoint (frost while the timer is off), fully open."""
    on = False
    for s in ROOMS:
        trv = house.rooms[s.id].radiator.trv
        if trv is None:
            continue
        sp = _timer_setpoint(plan, s, weekday, minute)
        on = on or sp is not None
        trv.setpoint = sp if sp is not None else frost_c
        trv.opening_degree = 100
        trv.closing_degree = 100
        trv.external = None
    house.heating_relay = on
    house.store_relay = (360 <= minute < 450) or (1020 <= minute < 1260)


def _measure_use(
    house: SimHouse,
    res: Result,
    plan: SchedulePlan | None,
    weekday: int,
    minute: int,
    comfort: bool,
) -> None:
    """Efficiency measures for TRV rooms (plan slice 6). `comfort`: also the comfort
    deficit (K·h below setpoint - 0.5 K) over warm periods, for schedules other than
    the fixed one, whose `_measure` uses the fixed occupied periods."""
    dt_h = STEP_S / 3600
    for s in ROOMS:
        if house.rooms[s.id].radiator.trv is None:
            continue
        t = house.rooms[s.id].t
        sp = _setpoint(plan, s, weekday, minute)
        use = _warm_use(plan, s.id, weekday, minute)
        if t < res.min_room[0]:
            res.min_room = (t, sp, s.id)
        if t < DAMP_FLOOR_C:
            res.below_floor_min += STEP_S / 60
        if use is RoomUse.SETBACK:
            res.setback_sum_c += t
            res.setback_samples += 1
            continue
        if t < sp:
            res.warm_deficit_kmin += (sp - t) * STEP_S / 60
        if comfort and t < sp - 0.5 and s.heat_source is None:
            res.comfort_deficit_kh += (sp - 0.5 - t) * dt_h
            res.room_deficit_kh[s.id] = res.room_deficit_kh.get(s.id, 0.0) + (sp - 0.5 - t) * dt_h


MEASURED = [s for s in ROOMS if s.role is RoomRole.NORMAL and s.heat_source is None]


def _measure(
    house: SimHouse, res: Result, minute: int, tracking: dict, day: int, d: Disturbances
) -> None:
    dt_h = STEP_S / 3600
    occupied = any(a <= minute < b for a, b in OCCUPIED)
    for s in ROOMS:
        if s.role in (RoomRole.PASSIVE, RoomRole.UNHEATED):
            continue  # no schedule of its own, so no comfort to measure
        t = house.rooms[s.id].t
        sp = setpoint(s, minute)
        fire_evening = s.id == "lounge" and day in d.fire_days and minute >= d.fire_window[0] - 60
        if occupied and t < sp - 0.5 and s.heat_source is None:
            res.comfort_deficit_kh += (sp - 0.5 - t) * dt_h
            res.room_deficit_kh[s.id] = res.room_deficit_kh.get(s.id, 0.0) + (sp - 0.5 - t) * dt_h
        if occupied and t > sp + 1.5 and s.heat_source is None and not fire_evening:
            res.overheat_kh += (t - sp - 1.5) * dt_h
            res.room_overheat_kh[s.id] = res.room_overheat_kh.get(s.id, 0.0) + (t - sp - 1.5) * dt_h

    # Arrival spread for each occupied-period start.
    for start, end in OCCUPIED:
        key = f"{day}:{start}"
        if minute == start and key not in tracking:
            tracking[key] = {
                s.id: -1.0 for s in MEASURED if house.rooms[s.id].t < setpoint(s, start) - 0.3
            }
        if key in tracking and start <= minute < end:
            for rid, arrived in tracking[key].items():
                if rid == "_done":
                    continue
                spec = next(x for x in ROOMS if x.id == rid)
                if arrived < 0 and house.rooms[rid].t >= setpoint(spec, minute) - 0.2:
                    tracking[key][rid] = float(minute - start)
        if key in tracking and minute == end - 1 and tracking[key].get("_done") is None:
            arr = [
                v if v >= 0 else float(end - start)
                for k, v in tracking[key].items()
                if k != "_done"
            ]
            if len(arr) >= 2:
                res.arrival_spread_min.append(max(arr) - min(arr))
                res.arrival_max_min.append(max(arr))
            tracking[key]["_done"] = 1.0


def compare(
    days: int = 5, warmup_days: int = 2, seed: int = 1, cfg: HouseConfig | None = None
) -> tuple[Result, Result]:
    return (
        run("baseline", days, warmup_days, seed),
        run("radiate", days, warmup_days, seed, cfg=cfg),
    )
