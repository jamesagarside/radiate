"""Closed-loop runs: the simulated house driven by Radiate or by a conventional setup.

Baseline ("smart TRVs, no balancing"): every TRV fully open on its own schedule and
internal sensor, boiler called whenever any TRV is heating, no minimum burn or off
time. That is what per-room integrations (VTherm, Better Thermostat) give today.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from radiate.core import EngineState, HouseConfig, RoomInput, Snapshot, decide
from radiate.core.types import Actions, RoomRole

from .house import SimHouse
from .reference import OCCUPIED, ROOMS, build_house, house_config, next_change, setpoint

STEP_S = 30.0
CONTROL_S = 60.0
DAY = 86400.0
REPORT_HEARTBEAT_S = 600.0
# Shelly watchdog fallback schedule (spec 5.7): occupied windows with an hour's lead.
WATCHDOG_SCHEDULE = ((5 * 60 + 30, 8 * 60 + 30), (16 * 60, 22 * 60 + 30))


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
) -> Result:
    d = disturbances or Disturbances()
    cfg = cfg or house_config()
    house = build_house(seed)
    house.outdoor_mean = outdoor_mean
    if pump_qmax is not None:
        house.pump_qmax = pump_qmax
    st = engine or EngineState.new(cfg)
    res = Result(controller, days - warmup_days, engine=st)
    reports = {rid: (house.rooms[rid].reported_t, 0.0) for rid in house.rooms}
    dist_state: dict = {}

    relay_prev = False
    relay_changed_at = 0.0
    relay_starts_at: list[float] = []
    period_tracking: dict[str, dict[str, float]] = {}
    total = days * DAY
    measure_from = warmup_days * DAY
    t_next_control = 0.0
    starts_before = burner_s_before = 0

    while house.now < total:
        day = int(house.now // DAY)
        minute = int((house.now % DAY) // 60)
        if house.now >= measure_from and starts_before == 0 and burner_s_before == 0:
            starts_before = house.boiler.burner_starts or -1
            burner_s_before = house.boiler.burner_on_s or -1.0

        draw = _apply_disturbances(house, d, day, minute, dist_state)
        if oil_out_at_s is not None and house.now >= oil_out_at_s:
            house.boiler.output_w = 0.0  # tank empty: the burner runs but makes no heat

        for rid, room in house.rooms.items():
            val, at = reports[rid]
            if room.reported_t != val or house.now - at >= REPORT_HEARTBEAT_S:
                reports[rid] = (room.reported_t, house.now)

        if house.now >= t_next_control:
            t_next_control += CONTROL_S
            alive = crash_at_s is None or house.now < crash_at_s
            if controller == "radiate" and alive:
                snap = _snapshot(house, reports, minute, optimum_start)
                actions = decide(cfg, snap, st)
                _apply(house, actions)
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
            # A crashed Radiate does nothing: TRVs keep governed settings, relay frozen
            # until the Shelly watchdog (spec 5.7) takes over after 10 min.
            elif crash_at_s is not None and house.now >= crash_at_s + 600:
                house.heating_relay = any(a <= minute < b for a, b in WATCHDOG_SCHEDULE)

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
            _measure(house, res, minute, period_tracking, day, d)

    res.burner_starts = house.boiler.burner_starts - max(0, starts_before)
    res.burner_hours = (house.boiler.burner_on_s - max(0.0, burner_s_before)) / 3600
    res.max_starts_in_hour = max(
        (sum(1 for t in relay_starts_at if s <= t < s + 3600) for s in relay_starts_at), default=0
    )
    return res


def _snapshot(house: SimHouse, reports: dict, minute: int, optimum_start: bool = True) -> Snapshot:
    rooms = {}
    for s in ROOMS:
        room = house.rooms[s.id]
        nxt, nxt_in = next_change(s, minute)
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
            setpoint=setpoint(s, minute),
            next_setpoint=nxt if optimum_start else None,
            next_setpoint_in_s=nxt_in if optimum_start else None,
        )
    return Snapshot(
        now=house.now,
        minute_of_day=minute,
        outdoor=round(house.outdoor(), 1),
        rooms=rooms,
        heating_relay=house.heating_relay,
        store_relay=house.store_relay,
        day=int(house.now // DAY),
    )


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


MEASURED = [s for s in ROOMS if s.role is RoomRole.NORMAL and s.heat_source is None]


def _measure(
    house: SimHouse, res: Result, minute: int, tracking: dict, day: int, d: Disturbances
) -> None:
    dt_h = STEP_S / 3600
    occupied = any(a <= minute < b for a, b in OCCUPIED)
    for s in ROOMS:
        if s.role is RoomRole.PASSIVE:
            continue
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


def compare(days: int = 5, warmup_days: int = 2, seed: int = 1) -> tuple[Result, Result]:
    return (
        run("baseline", days, warmup_days, seed),
        run("radiate", days, warmup_days, seed),
    )
