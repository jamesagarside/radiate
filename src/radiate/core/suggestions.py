"""House suggestions: what Radiate has learned about the house, turned into advice.

Pure: reads the engine state and the configuration, and plain device data passed in
by the caller. No I/O, no clock. Every suggestion comes from something Radiate has
measured or learned, says what that evidence is, and says how much data backs it.
A room without enough learning gets no suggestion, only a line saying how far its
learning has got.

Suggestions built here:

- `room.heat_loss`: a room whose learned heat loss `b` is well above the house's
  typical (median) `b`. `b` is per kelvin of inside minus outside, so the comparison
  is already normalised for the outdoor temperature.
- `radiator.undersized`: a room whose radiator, by its learned model, cannot hold
  the room's warmest setpoint above `design_outdoor_c` with every radiator on (the
  supply factor with every valve fully open, as on a cold day). Steady state of
  dT/dt = a * drive - b * (T - T_out) + d, so the most the room can rise above
  outdoors is (a * S + d) / b.
- `radiator.slow_to_warm`: a radiator whose arrival lag is well above the house's
  typical lag.
- `valve.passing`: a valve the leak check flagged (`ValveCheck.leaking`): its
  radiator warmed while it was shut in 2 or more of the last 5 judged burns.
- `zigbee.weak_link`: devices whose signal, or whose link to their router after a
  network scan, is below the weak signal limit, grouped by the router they use.

Rooms that can't be judged from their model are listed as `not_judged`: a room
measured only by its TRV (its confidence is capped), and a room with a continuous
heat source such as a range cooker. In simulation the cooker's steady heat `d`
trades off against the room's loss `b` and the radiator's gain `a` in the fit (a
kitchen's gain fell to a fifth of its true value while the house around it changed),
so neither its loss nor its radiator can be told from the model.

Confidence is a word, `medium` or `high` (`low` for a weak link judged on one
reading), and the `basis` sentence says what it rests on. Nothing here invents a
number: the values behind each sentence are in `values`.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass, field

from .decide import LAG_SAMPLES, EngineState, RoomState
from .estimator import NOISE_SD, PRIOR_B, RoomEstimator
from .health import LEAK_BURNS, LEAK_WINDOW
from .types import HeatSource, HouseConfig, RoomConfig, RoomRole
from .valve import supply_factor

SEVERITIES = ("act", "consider", "info")  # most pressing first

READY = "ready"
LEARNING = "learning"
NOT_JUDGED = "not_judged"


@dataclass(frozen=True, slots=True)
class DeviceLink:
    """What the weak link check needs to know about one Zigbee device."""

    id: str
    label: str  # "Bathroom room sensor", "Router plug_hall"
    lqi: float | None = None  # its latest link quality
    available: bool | None = None
    room_id: str | None = None
    room_name: str | None = None
    # Its route, after a network scan: the router or coordinator it talks through.
    via: str | None = None
    via_label: str | None = None
    via_kind: str | None = None  # coordinator or router
    route_lqi: float | None = None


@dataclass(frozen=True, slots=True)
class Suggestion:
    id: str
    kind: str
    severity: str  # act, consider or info
    title: str
    evidence: str  # what Radiate saw, in words
    action: str  # what to do about it
    confidence: str  # low, medium or high
    basis: str  # what the confidence rests on, in words
    room_id: str | None = None
    room_name: str | None = None
    values: dict[str, float] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class RoomLearning:
    """How far one room's learning has got, and whether it can be judged yet."""

    room_id: str
    room_name: str
    status: str  # ready, learning or not_judged
    hours: float  # learning updates, in hours
    confidence: float  # the lower of the heating gain's and the heat loss's
    note: str


@dataclass(slots=True)
class Report:
    suggestions: list[Suggestion]
    learning: list[RoomLearning]
    rooms_compared: int  # rooms whose heat loss can be compared
    lags_compared: int  # rooms with enough arrivals to compare


def loss_confidence(est: RoomEstimator) -> float:
    """0..1, how far the heat loss's uncertainty has shrunk from the prior, as
    `RoomEstimator.confidence` does for the heating gain."""
    sd_b = math.sqrt(max(est.p[1][1], 0.0)) * NOISE_SD
    return max(0.0, min(est.max_confidence, 1.0 - sd_b / PRIOR_B[1]))


def _hours(est: RoomEstimator) -> float:
    return est.samples / 60.0  # one learning update per minute tick


def _num(v: float) -> str:
    """20 -> "20", 20.5 -> "20.5"."""
    return f"{v:.1f}".removesuffix(".0")


def _learning(cfg: HouseConfig, rc: RoomConfig, rs: RoomState) -> RoomLearning:
    s = cfg.suggestions
    hours = _hours(rs.est)
    conf = min(rs.est.confidence, loss_confidence(rs.est))
    if rc.role is RoomRole.INTERNAL_SENSOR_ONLY:
        return RoomLearning(
            rc.id,
            rc.name,
            NOT_JUDGED,
            hours,
            conf,
            "Measured only by its valve, which sits by the radiator, so Radiate doesn't "
            "judge its heat loss or radiator.",
        )
    if rc.heat_source is HeatSource.CONTINUOUS:
        return RoomLearning(
            rc.id,
            rc.name,
            NOT_JUDGED,
            hours,
            conf,
            "Its steady heat source, such as a range cooker, can't be told apart from its "
            "heat loss and radiator, so Radiate doesn't judge them.",
        )
    hours_left = max(0.0, s.min_learning_h - hours)
    if hours_left <= 0 and conf >= s.min_confidence:
        note = f"Enough to judge, from {hours:.0f} h of learning."
        return RoomLearning(rc.id, rc.name, READY, hours, conf, note)
    if hours_left > 0:
        note = (
            f"{hours:.0f} h of learning so far. Suggestions start after "
            f"{s.min_learning_h:.0f} h, so about {max(1, round(hours_left))} h to go."
        )
    else:
        note = (
            f"{hours:.0f} h of learning, but the model is {conf:.0%} certain and "
            f"suggestions need {s.min_confidence:.0%}. It needs more heating and "
            "cooling to learn from."
        )
    return RoomLearning(rc.id, rc.name, LEARNING, hours, conf, note)


def _level(conf: float, hours: float, cfg: HouseConfig) -> str:
    """`high` from halfway between the minimum confidence and certainty, with twice the
    minimum learning; `medium` below that (a room below the minimum is not judged)."""
    s = cfg.suggestions
    high = conf >= (1.0 + s.min_confidence) / 2 and hours >= 2 * s.min_learning_h
    return "high" if high else "medium"


def _median(values: list[float]) -> float:
    v = sorted(values)
    n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2


def _heat_loss(cfg: HouseConfig, ready: list[tuple[RoomConfig, RoomState]]) -> list[Suggestion]:
    s = cfg.suggestions
    rooms = ready
    if len(rooms) < s.min_rooms:
        return []
    typical = _median([rs.est.b for _, rs in rooms])
    if typical <= 0:
        return []
    out = []
    for rc, rs in rooms:
        ratio = rs.est.b / typical
        if ratio < s.heat_loss_ratio:
            continue
        rate = rs.est.b * s.compare_delta_k
        usual = typical * s.compare_delta_k
        hours = _hours(rs.est)
        conf = loss_confidence(rs.est)
        action = (
            "Look for draughts around the windows, doors and any loft hatch, and check "
            "the windows close fully. If there are none, the walls or loft may need "
            "more insulation."
        )
        if rc.heat_source is HeatSource.EPISODIC:
            action += " An open chimney also draws warm air out when the fire is not lit."
        out.append(
            Suggestion(
                id=f"room.heat_loss:{rc.id}",
                kind="room.heat_loss",
                severity="consider",
                title=f"{rc.name} loses heat quickly",
                evidence=(
                    f"With the heating off and {_num(s.compare_delta_k)}° between inside "
                    f"and outside, {rc.name} cools by about {rate:.1f}° an hour. That is "
                    f"{ratio:.1f} times the house's typical {usual:.1f}° an hour."
                ),
                action=action,
                confidence=_level(conf, hours, cfg),
                basis=f"From {hours:.0f} h of learning, compared with {len(rooms)} rooms.",
                room_id=rc.id,
                room_name=rc.name,
                values={
                    "loss_per_h": round(rs.est.b, 4),
                    "typical_loss_per_h": round(typical, 4),
                    "ratio": round(ratio, 2),
                    "cooling_kph": round(rate, 2),
                    "typical_cooling_kph": round(usual, 2),
                    "hours": round(hours, 1),
                },
            )
        )
    return out


def _undersized(
    cfg: HouseConfig,
    ready: list[tuple[RoomConfig, RoomState]],
    targets: dict[str, float],
    leaky: set[str],
) -> list[Suggestion]:
    """`leaky`: rooms that lose heat quickly, where that may be the cause."""
    s = cfg.suggestions
    valves = sum(1 for r in cfg.rooms if r.controllable)
    # Every valve fully open, as on a cold day: the least flow each radiator gets.
    supply = supply_factor(float(valves), cfg.supply_kappa, cfg.bypass_equivalent)
    out = []
    for rc, rs in ready:
        est = rs.est
        a_hi = est.bounds[0][1]
        if est.a >= 0.99 * a_hi or est.b <= 0:
            continue  # gain on its bound: the model can't say how much more it gives
        rise = (est.a * supply + est.d) / est.b
        target = targets.get(rc.id, rs.target)
        limit = target - rise
        if limit <= s.design_outdoor_c:
            continue
        hours = _hours(est)
        conf = min(est.confidence, loss_confidence(est))
        action = (
            "Bleed the radiator and check its lockshield valve (the cap at the other "
            "end) is fully open. If the room still falls short, a larger radiator "
            "would help."
        )
        if rc.id in leaky:
            action = (
                f"{rc.name} also loses heat quickly, so stopping draughts or adding "
                f"insulation may be enough. {action}"
            )
        out.append(
            Suggestion(
                id=f"radiator.undersized:{rc.id}",
                kind="radiator.undersized",
                severity="act" if limit >= s.mild_outdoor_c else "consider",
                title=f"{rc.name}'s radiator may be too small",
                evidence=(
                    f"Radiate's model of {rc.name} says that with every radiator on, it "
                    f"can keep the room about {rise:.0f}° above the outside temperature. "
                    f"So it would fall short of {_num(target)}° whenever it is colder "
                    f"than about {limit:.0f}° outside."
                ),
                action=action,
                confidence=_level(conf, hours, cfg),
                basis=f"From {hours:.0f} h of learning in {rc.name}.",
                room_id=rc.id,
                room_name=rc.name,
                values={
                    "rise_k": round(rise, 1),
                    "target_c": target,
                    "short_below_c": round(limit, 1),
                    "design_outdoor_c": s.design_outdoor_c,
                    "hours": round(hours, 1),
                },
            )
        )
    return out


def _slow_to_warm(
    cfg: HouseConfig, rooms: list[tuple[RoomConfig, RoomState]]
) -> tuple[list[Suggestion], int]:
    s = cfg.suggestions
    measured = [(rc, rs) for rc, rs in rooms if len(rs.lag_samples) >= s.min_lag_samples]
    if len(measured) < s.min_rooms:
        return [], len(measured)
    typical = _median([rs.arrival_lag_s for _, rs in measured])
    out = []
    for rc, rs in measured:
        lag = rs.arrival_lag_s
        if lag < s.slow_warm_ratio * typical or lag - typical < s.slow_warm_extra_min * 60:
            continue
        n = len(rs.lag_samples)
        out.append(
            Suggestion(
                id=f"radiator.slow_to_warm:{rc.id}",
                kind="radiator.slow_to_warm",
                severity="info",
                title=f"{rc.name}'s radiator is slow to warm",
                evidence=(
                    f"After the boiler starts, {rc.name}'s radiator usually takes about "
                    f"{lag / 60:.0f} min to warm, against {typical / 60:.0f} min for the "
                    "house."
                ),
                action=(
                    "Bleed it, as trapped air slows a radiator down, and check its "
                    "lockshield valve is open. A radiator far along the pipes is slower "
                    "anyway, and Radiate already starts it earlier to allow for that."
                ),
                confidence="high" if n >= LAG_SAMPLES else "medium",
                basis=f"From the last {n} times its radiator warmed.",
                room_id=rc.id,
                room_name=rc.name,
                values={
                    "lag_min": round(lag / 60, 1),
                    "typical_lag_min": round(typical / 60, 1),
                    "samples": n,
                },
            )
        )
    return out, len(measured)


def _passing(rooms: list[tuple[RoomConfig, RoomState]]) -> list[Suggestion]:
    out = []
    for rc, rs in rooms:
        v = rs.valve
        if not v.leaking:
            continue
        judged = len(v.leak_history)
        out.append(
            Suggestion(
                id=f"valve.passing:{rc.id}",
                kind="valve.passing",
                severity="act",
                title=f"{rc.name}'s valve may let heat through when shut",
                evidence=(
                    f"{rc.name}'s radiator warmed while its valve was shut in "
                    f"{v.leak_burns} of the last {judged} burns Radiate could judge."
                ),
                action=(
                    "Recalibrate the valve as its manual describes. If it keeps happening, "
                    "the valve pin may be sticking or the valve worn, which a heating "
                    "engineer can free or replace."
                ),
                confidence="high" if v.leak_burns > LEAK_BURNS else "medium",
                basis=f"From {judged} burns, of the last {LEAK_WINDOW} kept.",
                room_id=rc.id,
                room_name=rc.name,
                values={"leak_burns": v.leak_burns, "judged_burns": judged},
            )
        )
    return out


def _and(items: list[str]) -> str:
    return items[0] if len(items) == 1 else f"{', '.join(items[:-1])} and {items[-1]}"


def _device_name(d: DeviceLink) -> str:
    """ "Bathroom room sensor (LQI 28)", with the weaker of its own and its route's."""
    known = [v for v in (d.lqi, d.route_lqi) if v is not None]
    return f"{d.label} (LQI {min(known):.0f})" if known else d.label


def _weak_links(devices: list[DeviceLink], weak_lqi: float) -> list[Suggestion]:
    def weak(v: float | None) -> bool:
        return v is not None and v < weak_lqi

    groups: dict[str | None, list[DeviceLink]] = {}
    for d in devices:
        if d.available is False or not (weak(d.lqi) or weak(d.route_lqi)):
            continue
        groups.setdefault(d.via, []).append(d)
    out = []
    for via, items in groups.items():
        items.sort(key=lambda d: d.label)
        one = len(items) == 1
        names = _and([_device_name(d) for d in items])
        rooms = {d.room_id for d in items}
        title = (
            f"Weak Zigbee signal at {items[0].label}"
            if one
            else f"Weak Zigbee signal at {len(items)} devices"
        )
        if via is None:
            evidence = (
                f"{names} {'has' if one else 'have'} a weak signal, below LQI {weak_lqi:.0f}."
            )
            action = (
                "A mains-powered Zigbee router, such as a smart plug, nearer to "
                f"{'it' if one else 'them'} would help. Scan the network on the Devices "
                f"tab to see which router {'it talks' if one else 'they talk'} through."
            )
            basis = "From the latest reading only, so it may come and go."
            confidence = "low"
        else:
            parent = (
                "the coordinator"
                if items[0].via_kind == "coordinator"
                else f"the router {items[0].via_label or via}"
            )
            evidence = (
                f"{names} {'has' if one else 'have'} a weak signal, below LQI "
                f"{weak_lqi:.0f}. {'It talks' if one else 'They talk'} through {parent}."
            )
            action = (
                "A mains-powered Zigbee router, such as a smart plug, placed between "
                f"{'it' if one else 'them'} and {parent} would give "
                f"{'it' if one else 'them'} a stronger path."
            )
            both = all(weak(d.lqi) and weak(d.route_lqi) for d in items)
            basis = "From the latest reading and the last network scan."
            confidence = "medium" if both else "low"
        out.append(
            Suggestion(
                id=f"zigbee.weak_link:{via or 'unscanned'}",
                kind="zigbee.weak_link",
                severity="consider",
                title=title,
                evidence=evidence,
                action=action,
                confidence=confidence,
                basis=basis,
                room_id=items[0].room_id if len(rooms) == 1 else None,
                room_name=items[0].room_name if len(rooms) == 1 else None,
                values={"devices": len(items), "weak_lqi": weak_lqi},
            )
        )
    return out


def suggest(
    cfg: HouseConfig,
    st: EngineState,
    *,
    targets: dict[str, float] | None = None,
    devices: list[DeviceLink] | None = None,
    weak_lqi: float = 40.0,
) -> Report:
    """Every suggestion the learned models, valve checks and devices support.

    `targets`: each room's warmest setpoint (its schedule's), for the radiator size
    check; a room without one uses its current target. `devices`: the Zigbee devices
    and their routes; None or empty skips the weak link check.
    """
    rooms = [(rc, st.rooms[rc.id]) for rc in cfg.rooms if rc.id in st.rooms]
    learning = [_learning(cfg, rc, rs) for rc, rs in rooms]
    status = {item.room_id: item.status for item in learning}
    ready = [(rc, rs) for rc, rs in rooms if status[rc.id] == READY]
    slow, lags = _slow_to_warm(cfg, rooms)
    loss = _heat_loss(cfg, ready)
    leaky = {x.room_id for x in loss if x.room_id}
    found = [
        *_passing(rooms),
        *_undersized(cfg, ready, targets or {}, leaky),
        *loss,
        *slow,
        *_weak_links(devices or [], weak_lqi),
    ]
    found.sort(key=lambda x: SEVERITIES.index(x.severity))
    return Report(found, learning, len(ready), lags)


def report_view(cfg: HouseConfig, report: Report) -> dict:
    """The `GET /api/v1/suggestions` body."""
    items = [
        {
            "id": x.id,
            "kind": x.kind,
            "severity": x.severity,
            "room_id": x.room_id,
            "room_name": x.room_name,
            "title": x.title,
            "evidence": x.evidence,
            "action": x.action,
            "confidence": x.confidence,
            "basis": x.basis,
            "values": x.values,
        }
        for x in report.suggestions
    ]
    learning = [
        {
            "room_id": r.room_id,
            "room_name": r.room_name,
            "status": r.status,
            "hours": round(r.hours, 1),
            "confidence": round(r.confidence, 2),
            "note": r.note,
        }
        for r in report.learning
    ]
    return {
        "summary": {
            "total": len(items),
            **{sev: sum(1 for x in items if x["severity"] == sev) for sev in SEVERITIES},
            "rooms_ready": sum(1 for r in learning if r["status"] == READY),
            "rooms_learning": sum(1 for r in learning if r["status"] == LEARNING),
            "rooms_compared": report.rooms_compared,
            "lags_compared": report.lags_compared,
            "min_rooms": cfg.suggestions.min_rooms,
        },
        "suggestions": items,
        "learning": learning,
        "settings": asdict(cfg.suggestions),
    }
