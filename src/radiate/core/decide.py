"""The control step: `decide(config, snapshot, state) -> actions` (spec 6).

No I/O, no clock, no randomness: given the same config, state and snapshot sequence it
always produces the same actions, so any day can be replayed from the decision log.
The caller owns `state` and must not share it between houses.
"""

from __future__ import annotations

import dataclasses
import math
from dataclasses import dataclass, field

from . import disturbance
from .accounting import Ledger
from .allocator import Allocation, AllocRoom, allocate
from .boiler import BoilerGuard
from .disturbance import DisturbanceState
from .estimator import RoomEstimator, local_slope
from .health import MAX_TICK_S, NO_HEAT_MESSAGE, ROOM_RISE_KPH, NoHeat, ShortCycle, ValveCheck
from .types import (
    Actions,
    BoilerState,
    HeatSource,
    HouseConfig,
    Mode,
    Reason,
    RoomConfig,
    RoomInput,
    RoomRole,
    Snapshot,
    ValveAction,
)
from .valve import flow_fraction, supply_factor

ROOM_SENSOR_STALE_S = 20 * 60
TRV_STALE_S = 30 * 60
SLOPE_WINDOW_S = 15 * 60
RADIATOR_TAU_S = 15 * 60
SETPOINT_SETTLE_S = 15 * 60
DEFAULT_LAG_S = 8 * 60
LAG_RISE_K = 0.6
LAG_TIMEOUT_S = 40 * 60
CALL_BIAS_K = 0.6  # TRV setpoint lead while Radiate wants a room heated
TRV_MIN_C = 4.0  # TRVZB setpoint range, 0.5 K steps
TRV_MAX_C = 35.0
SINK_LEAD_K = 1.0  # top-up and dump rooms: TRV setpoint at least this above its reading
TOPUP_K = 0.3
DEFAULT_LOCKSHIELD = 60
MIN_OPENING_STEP = 3
OPENING_WRITE_INTERVAL_S = 10 * 60
BIG_OPENING_STEP = 15
CLOSE_BUMP = 10
PREHEAT_MAX_S = 3 * 3600
PREHEAT_MARGIN = 1.2
INTERNAL_SENSOR_MAX_CONFIDENCE = 0.5  # spec 4.6: the TRV sits beside the radiator
LOCKSHIELD_DECAY = 0.9995  # per sample, roughly a 3 day half-life at one sample a minute


@dataclass(slots=True)
class RoomState:
    est: RoomEstimator
    dist: DisturbanceState = field(default_factory=DisturbanceState)
    readings: list[tuple[float, float]] = field(default_factory=list)
    temperature: float | None = None
    drive: float = 0.0
    calling: bool = False
    topup: bool = False  # temporary target above setpoint (burn extension or heat sink)
    extend: bool = False  # topup that may keep the burner running (burn extension)
    lag_samples: list[float] = field(default_factory=list)
    lag_probe: tuple[float, float] | None = None
    lockshield_hist: list[float] = field(default_factory=lambda: [0.0] * 101)
    last_setpoint: float | None = None
    setpoint_changed_at: float = -1e12
    written: ValveAction | None = None
    opening_written_at: float = -1e12
    learning_gate: str | None = "starting"
    topup_base: float | None = None  # temperature when the topup started
    target: float = 18.0  # effective target this tick (schedule, mode, optimum start)
    preheating: bool = False
    deadline_s: float | None = None
    closed_since: float | None = None  # radiator receiving no heat since
    slope: float | None = None
    residual: float | None = None
    valve: ValveCheck = field(default_factory=ValveCheck)  # stuck-valve check

    @property
    def arrival_lag_s(self) -> float:
        if not self.lag_samples:
            return DEFAULT_LAG_S
        s = sorted(self.lag_samples)
        return s[len(s) // 2]

    @property
    def lockshield(self) -> int:
        total = sum(self.lockshield_hist)
        if total < 30:
            return DEFAULT_LOCKSHIELD
        acc = 0.0
        for opening, weight in enumerate(self.lockshield_hist):
            acc += weight
            if acc >= 0.9 * total:
                return opening
        return 100


@dataclass(slots=True)
class EngineState:
    rooms: dict[str, RoomState]
    boiler: BoilerGuard = field(default_factory=BoilerGuard)
    last_now: float | None = None
    flow_since: float | None = None
    store_on_since: float | None = None
    supply: float = 1.0
    allocation: Allocation | None = None
    topup_burn: float | None = None  # burn start time for which top-up was used
    no_heat: NoHeat = field(default_factory=NoHeat)  # out of oil or burner lockout
    short_cycle: ShortCycle = field(default_factory=ShortCycle)
    ledger: Ledger = field(default_factory=Ledger)  # oil, runtime and balance per day

    @classmethod
    def new(cls, cfg: HouseConfig) -> EngineState:
        return cls(
            rooms={r.id: RoomState(est=new_estimator(r)) for r in cfg.rooms if r.controllable}
        )


def new_estimator(rc: RoomConfig) -> RoomEstimator:
    """A room model at its priors, with the room's confidence cap."""
    return RoomEstimator.new(
        rc.heat_source is HeatSource.CONTINUOUS,
        INTERNAL_SENSOR_MAX_CONFIDENCE if rc.role is RoomRole.INTERNAL_SENSOR_ONLY else 1.0,
    )


def _effective_temperature(cfg: RoomConfig, inp: RoomInput) -> float | None:
    trv_ok = inp.trv_temperature is not None and inp.trv_age_s <= TRV_STALE_S
    if cfg.role is RoomRole.INTERNAL_SENSOR_ONLY:
        return inp.trv_temperature + cfg.trv_bias_k if trv_ok else None
    if inp.temperature is not None and inp.temperature_age_s <= ROOM_SENSOR_STALE_S:
        return inp.temperature
    return inp.trv_temperature + cfg.trv_bias_k if trv_ok else None


def _target(cfg: HouseConfig, snap: Snapshot, inp: RoomInput) -> float:
    if snap.mode is Mode.AUTO:
        return inp.setpoint
    return cfg.boiler.frost_c


def decide(cfg: HouseConfig, snap: Snapshot, st: EngineState) -> Actions:
    now = snap.now
    dt = 60.0 if st.last_now is None else max(1.0, now - st.last_now)
    st.last_now = now
    reasons: list[Reason] = []
    alerts: list[Reason] = []
    bcfg = cfg.boiler

    # Hot-water store and heat availability at the radiators.
    if snap.store_relay:
        if st.store_on_since is None:
            st.store_on_since = now
    else:
        st.store_on_since = None
    recovering = (
        cfg.store.priority_over_heating
        and st.store_on_since is not None
        and now - st.store_on_since < cfg.store.recovery_s
    )
    flowing = snap.heating_relay and not recovering
    flow_started = flowing and st.flow_since is None
    if flowing:
        if st.flow_since is None:
            st.flow_since = now
    else:
        st.flow_since = None

    out = snap.outdoor
    if out is None:
        out = 5.0  # conservative default when no outdoor reading
    any_trv = False
    frost = hard_frost = False
    trv_now: dict[str, float] = {}  # fresh TRV readings, for the no-heat check
    passive_now: dict[str, float] = {}
    rooms_warming = False
    any_open = False  # some TRV is open and asking for heat
    below: dict[str, bool] = {}  # rooms short of their setpoint by the comfort limit

    # --- 1-4: per-room sensing, disturbances, learning, demand -------------------------
    for rc in cfg.rooms:
        if not rc.controllable:
            inp = snap.rooms.get(rc.id)
            if (
                inp is not None
                and inp.temperature is not None
                and inp.temperature_age_s <= ROOM_SENSOR_STALE_S
            ):
                passive_now[rc.id] = inp.temperature
            continue
        rs = st.rooms[rc.id]
        inp = snap.rooms.get(rc.id, RoomInput())
        any_trv = any_trv or inp.trv_available
        temp = _effective_temperature(rc, inp)
        rs.temperature = temp
        target = _target(cfg, snap, inp)
        rs.preheating = False
        rs.deadline_s = None
        if snap.mode is Mode.AUTO and temp is not None and not rs.dist.fire:
            start = _preheat_due(cfg, rs, inp, temp, out)
            if start:
                target = inp.next_setpoint
                rs.preheating = True
                rs.deadline_s = inp.next_setpoint_in_s
        rs.target = target

        if rs.last_setpoint is None or abs(target - rs.last_setpoint) > 0.05:
            rs.setpoint_changed_at = now
            rs.last_setpoint = target

        if temp is not None:
            rs.readings.append((now, temp))
            rs.readings = [p for p in rs.readings if now - p[0] <= SLOPE_WINDOW_S]
            if temp < bcfg.frost_c:
                frost = True
            if temp < bcfg.hard_frost_c:
                hard_frost = True
        rs.slope = local_slope(rs.readings) if temp is not None else None
        if inp.trv_available and inp.trv_temperature is not None and inp.trv_age_s <= TRV_STALE_S:
            # Radiator warmth seen by the TRV: its reading above the room's, if known.
            room_t = inp.temperature if rc.role is RoomRole.NORMAL else None
            fresh = room_t is not None and inp.temperature_age_s <= ROOM_SENSOR_STALE_S
            trv_now[rc.id] = inp.trv_temperature - (room_t if fresh else 0.0)
        if (
            (rs.calling or rs.topup)
            and rc.heat_source is None
            and rs.dist.learning_blocked(now) is None
            and rs.slope is not None
            and rs.slope >= ROOM_RISE_KPH
        ):
            rooms_warming = True

        # Radiator drive: low-pass of supply x flow fraction x availability.
        opening = rs.written.opening if rs.written else (inp.opening_echo or 0)
        heating = inp.trv_heating
        if heating is None:
            heating = temp is not None and temp < target
        avail = flowing and st.flow_since is not None and now - st.flow_since >= rs.arrival_lag_s
        u = flow_fraction(opening) if heating and avail else 0.0
        # "Could this radiator be getting heat?" ignores the learned arrival lag: a
        # radiator can warm the room before Radiate's lag estimate says it should.
        # A valve known to be stuck shut does not count, and nor does a top-up or dump
        # room: it is opened briefly, often at the floor, and may warm too little to
        # show heat even when the boiler is fine.
        if (
            inp.trv_available
            and heating
            and opening > 0
            and not rs.valve.untrusted
            and not (rs.topup and not rs.calling)
        ):
            any_open = True
        if flowing and heating and opening > 0:
            rs.closed_since = None
        elif rs.closed_since is None:
            rs.closed_since = now
        drive_target = st.supply * u
        rs.drive += (drive_target - rs.drive) * (1.0 - math.exp(-dt / RADIATOR_TAU_S))
        # Stuck valve (spec 7): calling, valve open, TRV heating, flow, but no warming.
        rs.valve.observe(
            min(dt, MAX_TICK_S),
            flowing=flowing,
            eligible=rs.calling
            and inp.trv_available
            and inp.trv_heating is True
            and opening >= cfg.opening_floor
            and not rs.dist.fire,
            offset=trv_now.get(rc.id),
        )

        delta_out = (temp - out) if (temp is not None and out is not None) else None
        rs.residual = (
            rs.est.residual(rs.slope, rs.drive, delta_out)
            if rs.slope is not None and delta_out is not None
            else None
        )
        raised = disturbance.update(
            rs.dist,
            rc,
            now,
            temperature=temp,
            humidity=inp.humidity,
            window_open=inp.window_open,
            fire_switch=inp.fire_switch,
            slope_kph=rs.slope,
            residual_kph=rs.residual,
            drive=rs.drive,
            closed_for_s=now - rs.closed_since if rs.closed_since is not None else 0.0,
            confidence=rs.est.confidence,
        )
        for flag in raised:
            reasons.append(
                Reason(
                    f"disturbance.{flag}", f"{rc.name}: {flag.replace('_', ' ')} detected", rc.id
                )
            )

        # Arrival lag: time from flow start to a clear TRV internal rise.
        if flow_started and heating and inp.trv_temperature is not None:
            rs.lag_probe = (now, inp.trv_temperature)
        if rs.lag_probe is not None:
            t0, base = rs.lag_probe
            if not flowing or now - t0 > LAG_TIMEOUT_S:
                rs.lag_probe = None
            elif inp.trv_temperature is not None and inp.trv_temperature >= base + LAG_RISE_K:
                rs.lag_samples = (rs.lag_samples + [now - t0])[-15:]
                rs.lag_probe = None

        # Learning gates (spec 4.6).
        gate = rs.dist.learning_blocked(now)
        if gate is None:
            if st.no_heat.active:
                gate = "no_heat"  # the model would learn that radiators do nothing
            elif rs.valve.untrusted:
                gate = "valve_untrusted"
            elif temp is None or rs.slope is None or delta_out is None:
                gate = "no_data"
            elif not inp.trv_available:
                gate = "trv_offline"
            elif recovering:
                gate = "store_recovery"
            elif now - rs.setpoint_changed_at < SETPOINT_SETTLE_S:
                gate = "setpoint_change"
        rs.learning_gate = gate
        if gate is None:
            rs.est.update(rs.slope, rs.drive, delta_out)

        # Demand latch.
        hyst = (
            cfg.internal_sensor_hysteresis_k
            if rc.role is RoomRole.INTERNAL_SENSOR_ONLY
            else cfg.hysteresis_k
        )
        if temp is not None and not rs.dist.fire:
            below[rc.id] = temp < _target(cfg, snap, inp) - bcfg.comfort_limit_k
        excluded = temp is None or not inp.trv_available or rs.dist.fire
        if excluded:
            rs.calling = False
            rs.topup = rs.extend = False
        else:
            gap = target - temp
            if not rs.calling and gap > hyst:
                rs.calling = True
            elif rs.calling and gap <= 0.0:
                rs.calling = False
            if rs.topup and temp >= _topup_target(target, rs.topup_base or temp):
                rs.topup = rs.extend = False

    # Out of oil or burner lockout (spec 7): alert, keep calling, stop learning.
    st.no_heat.update(
        now,
        relay_on=snap.heating_relay,
        flowing=flowing,
        any_open=any_open,
        trv_readings=trv_now,
        passive_readings=passive_now,
        rooms_warming=rooms_warming,
    )
    if st.no_heat.active:
        alerts.append(Reason("boiler.no_heat", NO_HEAT_MESSAGE))
    # Judge valves only when heat is reaching other radiators.
    house_heat = not st.no_heat.active and any(rs.valve.rose for rs in st.rooms.values())
    for rc in cfg.rooms:
        rs = st.rooms.get(rc.id)
        if rs is None:
            continue
        rs.valve.judge(house_heat)
        if rs.valve.untrusted:
            alerts.append(
                Reason("valve.stuck", f"{rc.name} radiator not warming: check the valve", rc.id)
            )

    # --- 5: boiler demand, pooling, open path ------------------------------------------
    guard = st.boiler
    heating_allowed = snap.mode is not Mode.OFF or frost
    if guard.state in (BoilerState.IDLE, BoilerState.REST):
        for rs in st.rooms.values():
            rs.topup = rs.extend = False

    calling = [rc for rc in cfg.rooms if rc.controllable and st.rooms[rc.id].calling]
    alloc = _allocate(cfg, snap, st, calling)
    max_gap = max(
        (st.rooms[rc.id].target - st.rooms[rc.id].temperature for rc in calling), default=0.0
    )
    preheat = any(st.rooms[rc.id].preheating for rc in calling)
    predicted_burn_s = alloc.t_star_h * 3600 if calling else 0.0

    want_fire = (
        heating_allowed
        and bool(calling)
        and (
            max_gap > bcfg.comfort_limit_k
            or predicted_burn_s >= 1.5 * bcfg.min_burn_s
            or frost
            or preheat
        )
    )
    if hard_frost:
        want_fire = True

    # Burn extension and minimum-burn tail: keep useful sinks open rather than stopping.
    if guard.state is BoilerState.FIRING and not calling and heating_allowed:
        if st.topup_burn != guard.burn_started_at:
            st.topup_burn = guard.burn_started_at
            horizon_h = (bcfg.min_off_s + 15 * 60) / 3600
            for rc in _topup_candidates(cfg, snap, st):
                rs = st.rooms[rc.id]
                drop = max(0.0, (rs.est.b * (rs.temperature - out) - rs.est.d) * horizon_h)
                if rs.temperature - drop < rs.target - cfg.hysteresis_k:
                    rs.topup = rs.extend = True
                    rs.topup_base = rs.temperature
                    reasons.append(
                        Reason(
                            "boiler.topup",
                            f"{rc.name}: topped up to avoid a second burn soon",
                            rc.id,
                        )
                    )
    if guard.state in (BoilerState.LEAD, BoilerState.FIRING) and heating_allowed:
        # Heat sinks while there is real demand, and during the minimum-burn tail.
        if (
            calling
            or any(st.rooms[r].extend for r in st.rooms)
            or guard.burn_elapsed(now) < bcfg.min_burn_s
        ):
            _ensure_sink(cfg, snap, st, reasons)

    active = [
        rc
        for rc in cfg.rooms
        if rc.controllable and (st.rooms[rc.id].calling or st.rooms[rc.id].topup)
    ]
    if active != calling:
        alloc = _allocate(cfg, snap, st, active)
    st.allocation = alloc
    st.supply = (
        alloc.supply if active else supply_factor(0.0, cfg.supply_kappa, cfg.bypass_equivalent)
    )

    # Heat-sink rooms never keep the burner on; only real calls and burn extensions do.
    keeping = [rc for rc in active if st.rooms[rc.id].calling or st.rooms[rc.id].extend]
    want_stop = not keeping or not heating_allowed
    force_stop = not any_trv
    if force_stop:
        alerts.append(
            Reason(
                "safe_mode.no_trvs", "No TRVs reachable: safe mode, boiler stops after minimum burn"
            )
        )
        want_fire = want_fire and hard_frost
    # Short-cycling from outside Radiate (spec 5.6, 7): a longer minimum off for 24 h.
    sc = st.short_cycle
    sc.update(
        now, relay_on=snap.heating_relay, min_burn_s=bcfg.min_burn_s, base_off_s=bcfg.min_off_s
    )
    guard_cfg = bcfg
    if sc.extra_off_s > 0:
        guard_cfg = dataclasses.replace(bcfg, min_off_s=sc.min_off_s(bcfg.min_off_s))
        alerts.append(Reason("boiler.short_cycle", sc.message(bcfg.min_off_s)))
    prev_state = guard.state
    relay = guard.step(
        guard_cfg,
        now,
        want_fire=want_fire,
        want_stop=want_stop,
        hard_frost=hard_frost,
        force_stop=force_stop,
    )
    sc.commanded = relay

    # Oil and runtime accounting, arrival spread for the balance score (spec 5.6, 9).
    day_summary = st.ledger.update(
        now,
        snap.day,
        relay_on=snap.heating_relay,
        firing=guard.state is BoilerState.FIRING,
        calling={rc.id for rc in calling if rc.role is RoomRole.NORMAL},
        below=below,
        minute=snap.minute_of_day,
        nozzle_lph=bcfg.nozzle_lph,
    )
    if guard.state is not prev_state:
        reasons.append(
            _boiler_reason(prev_state, guard.state, len(calling), predicted_burn_s, max_gap)
        )

    # --- 6: openings ---------------------------------------------------------------------
    firing = guard.state in (BoilerState.LEAD, BoilerState.FIRING)
    valves: dict[str, ValveAction] = {}
    for rc in cfg.rooms:
        if not rc.controllable:
            continue
        rs = st.rooms[rc.id]
        inp = snap.rooms.get(rc.id, RoomInput())
        target = rs.target
        want_heat = rs.calling or rs.topup
        if rs.dist.fire:
            opening = 0
            reasons.append(
                Reason(
                    "room.fire", f"{rc.name}: fire lit, radiator closed and learning paused", rc.id
                )
            )
        elif firing and want_heat and rc.id in alloc.openings:
            opening = alloc.openings[rc.id] if cfg.balancing else 100
            if guard.state is BoilerState.FIRING:
                _record_lockshield(rs, opening)
        else:
            opening = rs.lockshield

        ext = (
            inp.temperature
            if rc.role is RoomRole.NORMAL
            and inp.temperature is not None
            and inp.temperature_age_s <= ROOM_SENSOR_STALE_S
            else None
        )
        heat = want_heat and firing and not rs.dist.fire
        # What the TRV compares its setpoint with: its own sensor in an internal-sensor
        # room, otherwise the room sensor sent to it (or Radiate's best estimate).
        reading = inp.trv_temperature if rc.role is RoomRole.INTERNAL_SENSOR_ONLY else ext
        if reading is None:
            reading = rs.temperature
        trv_setpoint = _trv_setpoint(rc, rs, target, heat, reading)
        action = ValveAction(rc.id, trv_setpoint, opening, 100, ext)
        if rc.actuation_enabled and inp.trv_available:
            valves[rc.id] = _discipline(rs, action, now)
        if rs.learning_gate in (
            "fire",
            "fire_holdoff",
            "window",
            "shower",
            "cooker_spike",
            "store_recovery",
        ):
            reasons.append(
                Reason(
                    "learning.paused",
                    f"{rc.name}: learning paused ({rs.learning_gate.replace('_', ' ')})",
                    rc.id,
                )
            )

    # --- 7: hot-water store --------------------------------------------------------------
    store = snap.store_boost or any(a <= snap.minute_of_day < b for a, b in cfg.store.windows)

    return Actions(
        valves=valves,
        heating_relay=relay,
        store_relay=store,
        boiler_state=guard.state,
        reasons=reasons,
        alerts=alerts,
        safe_mode=force_stop,
        day_summary=day_summary,
    )


def _preheat_due(cfg: HouseConfig, rs: RoomState, inp: RoomInput, temp: float, out: float) -> bool:
    """Optimum start: is it time to heat towards the next scheduled setpoint?"""
    nxt, in_s = inp.next_setpoint, inp.next_setpoint_in_s
    horizon = PREHEAT_MAX_S if inp.preheat_max_s is None else inp.preheat_max_s
    if nxt is None or in_s is None or in_s > horizon or nxt <= temp + cfg.hysteresis_k:
        return False
    # Assume most of the house heats at once (mornings), so the supply factor is low.
    n = sum(1 for r in cfg.rooms if r.controllable)
    supply = supply_factor(0.8 * n, cfg.supply_kappa, cfg.bypass_equivalent)
    rate = rs.est.a * supply - rs.est.b * (temp - out) + rs.est.d
    if rate <= 0.05:
        return True
    need_s = (
        (nxt - temp) / rate * 3600 * PREHEAT_MARGIN + rs.arrival_lag_s + cfg.boiler.valve_lead_s
    )
    return need_s >= in_s


def _trv_step(value: float, up: bool = False) -> float:
    """A setpoint the TRVZB accepts: a 0.5 K step within its 4 to 35 °C range."""
    steps = math.ceil(value * 2 - 1e-9) if up else round(value * 2)
    return max(TRV_MIN_C, min(TRV_MAX_C, steps / 2))


def _trv_setpoint(
    rc: RoomConfig, rs: RoomState, target: float, heat: bool, reading: float | None
) -> float:
    """The setpoint to send, in the frame of the reading the TRV compares it with.

    A normal room's TRV compares its setpoint with the room sensor (sent as its
    external temperature), so the room's target goes out as it is. An internal-sensor
    room's TRV compares it with its own reading, which Radiate takes as room - bias,
    so the target goes out as target - bias. `heat`: Radiate wants the valve open now.
    `reading`: the temperature the TRV is comparing with, if known.
    """
    internal = rc.role is RoomRole.INTERNAL_SENSOR_ONLY
    frame = -rc.trv_bias_k if internal else 0.0
    if not heat:
        return _trv_step(target + frame)
    base = _topup_target(target, rs.topup_base) if rs.topup else target
    # A learned bias is not a whole number of 0.5 K steps: round up so the TRV's
    # hysteresis band stays above the reading at which Radiate calls.
    setpoint = _trv_step(base + frame + CALL_BIAS_K, up=internal)
    if rs.topup and reading is not None:
        # A top-up or dump room is often already at or above its target, inside the
        # TRV's own hysteresis band, where the TRV would stay shut. Clear the band.
        setpoint = max(setpoint, _trv_step(reading + SINK_LEAD_K, up=True))
    return setpoint


def _topup_target(target: float, temp: float | None) -> float:
    t = temp if temp is not None else target
    return max(target + TOPUP_K, min(t + 0.5, target + 1.0))


def _topup_candidates(cfg: HouseConfig, snap: Snapshot, st: EngineState) -> list[RoomConfig]:
    out = []
    for rc in cfg.rooms:
        if not rc.controllable:
            continue
        rs = st.rooms[rc.id]
        inp = snap.rooms.get(rc.id, RoomInput())
        if (
            rs.calling
            or rs.topup
            or rs.dist.fire
            or rs.temperature is None
            or not inp.trv_available
        ):
            continue
        out.append(rc)
    # Coldest relative to setpoint first.
    out.sort(key=lambda rc: st.rooms[rc.id].temperature - st.rooms[rc.id].target)
    return out


def _ensure_sink(cfg: HouseConfig, snap: Snapshot, st: EngineState, reasons: list[Reason]) -> None:
    """Open-path guarantee (spec 5.4): enough open radiators for the burner's heat."""

    def sink() -> float:
        total = cfg.bypass_equivalent
        for rc in cfg.rooms:
            if rc.controllable and (st.rooms[rc.id].calling or st.rooms[rc.id].topup):
                total += 1.0  # allocation floors keep each open room near full flow fraction
        return total

    if sink() >= cfg.sink_min:
        return
    for rc in _topup_candidates(cfg, snap, st):
        rs = st.rooms[rc.id]
        rs.topup = True
        rs.topup_base = rs.temperature
        reasons.append(
            Reason("boiler.dump_room", f"{rc.name}: opened as a heat sink for the burner", rc.id)
        )
        if sink() >= cfg.sink_min:
            break


def _allocate(
    cfg: HouseConfig, snap: Snapshot, st: EngineState, rooms: list[RoomConfig]
) -> Allocation:
    items = []
    out = snap.outdoor
    for rc in rooms:
        rs = st.rooms[rc.id]
        target = rs.target
        if rs.topup:
            target = _topup_target(target, rs.topup_base)
        temp = rs.temperature if rs.temperature is not None else target
        net_loss = rs.est.b * (temp - (out if out is not None else temp)) - rs.est.d
        items.append(
            AllocRoom(
                id=rc.id,
                gap_k=max(0.05, target - temp),
                a=rs.est.a,
                net_loss_kph=net_loss,
                sets_pace=rc.role is RoomRole.NORMAL and not rs.topup,
                deadline_h=rs.deadline_s / 3600 if rs.deadline_s is not None else None,
            )
        )
    return allocate(
        items,
        kappa=cfg.supply_kappa,
        bypass=cfg.bypass_equivalent,
        floor=cfg.opening_floor,
        horizon_max_h=cfg.comfort_horizon_s / 3600,
    )


def _record_lockshield(rs: RoomState, opening: int) -> None:
    hist = rs.lockshield_hist
    for i in range(101):
        hist[i] *= LOCKSHIELD_DECAY
    hist[max(0, min(100, opening))] += 1.0


def _discipline(rs: RoomState, action: ValveAction, now: float) -> ValveAction:
    """Write discipline (spec 4.5): small or frequent opening changes are held back."""
    prev = rs.written
    if prev is not None:
        change = abs(action.opening - prev.opening)
        recent = now - rs.opening_written_at < OPENING_WRITE_INTERVAL_S
        if change < MIN_OPENING_STEP or (
            recent and change < BIG_OPENING_STEP and action.opening != 0
        ):
            action.opening = prev.opening
        elif action.opening != prev.opening:
            if action.opening <= prev.opening - CLOSE_BUMP and action.opening > 0:
                action.pre_opening = min(100, action.opening + CLOSE_BUMP)
            rs.opening_written_at = now
    else:
        rs.opening_written_at = now
    rs.written = ValveAction(
        action.room_id, action.setpoint, action.opening, action.closing, action.external_temperature
    )
    return action


def _boiler_reason(
    prev: BoilerState, new: BoilerState, n: int, burn_s: float, gap: float
) -> Reason:
    if new is BoilerState.LEAD:
        return Reason(
            "boiler.lead",
            f"{n} room(s) calling, predicted burn {burn_s / 60:.0f} min: opening valves",
            values={"rooms": n, "predicted_burn_min": burn_s / 60, "max_gap_k": gap},
        )
    if new is BoilerState.FIRING:
        return Reason("boiler.firing", "Burner called")
    if new is BoilerState.REST:
        return Reason("boiler.rest", "Rooms satisfied: burner off, minimum off time running")
    return Reason("boiler.idle", "Boiler idle")
