"""Savings against the savings baseline, with the comfort it cost (spec 5.9).

Pure: standard library only, no clock. The engine feeds `SavingsMeter.update` every
tick and `close` at local midnight, which gives the day's `savings` record for the
closed day summary. `report` turns closed day summaries into the whole
`GET /api/v1/savings` body.

Each tick, per controllable room with a reading, while the outdoor reading is real
and the house has a baseline, with `dt` in hours:

    heat   = 1 if the baseline timer is off, or the setpoint is above the baseline's
    lift  <- relaxes towards a * drive * heat / b at the loss rate b (exactly, per tick)
    B      = max(T - lift, baseline_c) while the baseline timer is on, else T - lift
    DH_act  += max(0, T - T_out) * dt
    DH_base += max(0, B - T_out) * dt

Anchoring B on the reading means free heat (a fire, the range cooker, sun) warms both
sides and cancels. Lift counts heat Radiate put in when the baseline would not have,
so a day can show a negative saving.

Missing data never reads as zero: ticks without an outdoor reading, a baseline or a
room reading add nothing, and the shares of the day they cover go into the record,
so a day with gaps, or with Radiate down, is ineligible rather than a day of no use.
Figures come out of `report` only past the gate (14 eligible days, a fit within 25 %
CV(RMSE), weather that has varied), so no caller can show an ungated number.
"""

from __future__ import annotations

import math
import statistics
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date
from typing import Any

from .types import RoomUse

MAX_TICK_S = 300.0  # as the ledger: longer gaps are not counted
WARM_TOLERANCE_K = 0.5  # a room in use is warm at or above its setpoint less this
DAY_S = 86400.0  # shares are of a whole day, so unseen time lowers them
SAVINGS_VERSION = 1  # shape of the saved meter (`persist`); bump and migrate on change
COMFORT_USES = frozenset({RoomUse.IN_USE, RoomUse.OCCASIONAL})  # comfort counts in these

BASELINE_ID = "timer_and_valves"
BASELINE_TEXT = (
    "Compared with a heating timer on from the first person up to the last to bed "
    "every day, and each room's valve set to its usual temperature."
)
BASIS_TEXT = {
    "relay": (
        "Oil is worked out from the time the boiler was called, so these litres are an upper bound."
    ),
    "firing": "Oil is worked out from the time the burner was firing.",
    "mixed": (
        "Oil is worked out from the time the burner was firing where it was metered, and "
        "from the time the boiler was called otherwise, so these litres may be high."
    ),
}

# Where the outdoor temperature behind the figures comes from (`house.outdoor_source`).
OUTDOOR_TEXT = {
    "zigbee": "Outdoor temperature from the Zigbee outdoor sensor.",
    "home_assistant": "Outdoor temperature from Home Assistant.",
    "both": (
        "Outdoor temperature from the Zigbee outdoor sensor, or from Home Assistant "
        "while the sensor is silent."
    ),
    "simulated": "Outdoor temperature from the simulation.",
}


@dataclass(frozen=True, slots=True)
class RoomSample:
    """One controllable room at one tick, as the savings meter needs it."""

    temperature_c: float | None  # the room's reading; None without one
    setpoint_c: float  # the schedule's or override's setpoint, not the preheat target
    use: RoomUse | None  # None: no room use, so the room has no baseline and no savings
    baseline_c: float | None  # baseline setpoint now; None while the baseline timer is off
    drive: float  # RoomState.drive
    a_kph: float  # heating gain
    b_per_h: float  # loss rate


@dataclass(slots=True)
class RoomDay:
    """One room's accumulators for the day so far."""

    dh_actual_kh: float = 0.0
    dh_baseline_kh: float = 0.0
    deficit_kh: float = 0.0  # comfort deficit
    warm_min: float = 0.0  # minutes in use or occasional, with a reading
    warm_ok_min: float = 0.0  # of those, minutes at or above setpoint less 0.5 K
    read_s: float = 0.0  # seconds with a reading


@dataclass(slots=True)
class SavingsMeter:
    rooms: dict[str, RoomDay] = field(default_factory=dict)
    lift_k: dict[str, float] = field(default_factory=dict)  # kept across days
    seen_s: float = 0.0
    outdoor_s: float = 0.0  # seconds with a real outdoor reading
    baseline_s: float = 0.0  # seconds with a savings baseline (a household)
    outdoor_sum_cs: float = 0.0  # °C x s, for the day's mean

    def update(
        self,
        dt_s: float,
        *,
        outdoor_c: float | None,
        baseline: bool,
        rooms: Mapping[str, RoomSample],
    ) -> None:
        """Add one tick. `dt_s` is the time since the last tick, capped at MAX_TICK_S."""
        if not math.isfinite(dt_s) or dt_s <= 0:
            return
        dt = min(dt_s, MAX_TICK_S)
        dt_h = dt / 3600.0
        self.seen_s += dt
        out = outdoor_c if outdoor_c is not None and math.isfinite(outdoor_c) else None
        if out is not None:
            self.outdoor_s += dt
            self.outdoor_sum_cs += out * dt
        if baseline:
            self.baseline_s += dt
        for rid, s in rooms.items():
            if s.use is None:
                continue  # no room use, so no baseline: not part of savings
            day = self.rooms.get(rid)
            if day is None:
                day = self.rooms[rid] = RoomDay()
            lift = self._lift(rid, s, dt_h, baseline)
            t = s.temperature_c
            if t is None or not math.isfinite(t):
                continue
            day.read_s += dt
            if s.use in COMFORT_USES:
                day.warm_min += dt / 60.0
                short = s.setpoint_c - WARM_TOLERANCE_K - t
                if short > 0:
                    day.deficit_kh += short * dt_h
                else:
                    day.warm_ok_min += dt / 60.0
            if out is None or not baseline:
                continue
            b_t = t - lift
            if s.baseline_c is not None:
                b_t = max(b_t, s.baseline_c)
            day.dh_actual_kh += max(0.0, t - out) * dt_h
            day.dh_baseline_kh += max(0.0, b_t - out) * dt_h

    def _lift(self, rid: str, s: RoomSample, dt_h: float, baseline: bool) -> float:
        """Advance one room's lift and return it. Without a baseline it only decays."""
        lift = self.lift_k.get(rid, 0.0)
        heat = baseline and (s.baseline_c is None or s.setpoint_c > s.baseline_c)
        gain = max(0.0, s.a_kph) * max(0.0, s.drive) if heat else 0.0
        b = s.b_per_h
        if b > 0 and math.isfinite(b):
            # Exact for inputs constant over the tick, so stable for any tick length.
            eq = gain / b
            lift = eq + (lift - eq) * math.exp(-b * dt_h)
        else:
            lift += gain * dt_h
        lift = max(0.0, lift) if math.isfinite(lift) else 0.0
        self.lift_k[rid] = lift
        return lift

    def close(self) -> dict:
        """The day's `savings` record (spec 5.9); resets the day, keeps lift."""
        rooms = {
            rid: {
                "dh_actual_kh": round(r.dh_actual_kh, 4),
                "dh_baseline_kh": round(r.dh_baseline_kh, 4),
                "deficit_kh": round(r.deficit_kh, 4),
                "warm_min": round(r.warm_min, 2),
                "warm_ok_min": round(r.warm_ok_min, 2),
                "read_min": round(r.read_s / 60.0, 2),
            }
            for rid, r in sorted(self.rooms.items())
        }
        record = {
            "rooms": rooms,
            "outdoor_share": round(min(1.0, self.outdoor_s / DAY_S), 4),
            "baseline_share": round(min(1.0, self.baseline_s / DAY_S), 4),
            "outdoor_mean_c": (
                round(self.outdoor_sum_cs / self.outdoor_s, 2) if self.outdoor_s > 0 else None
            ),
        }
        self.rooms = {}
        self.seen_s = self.outdoor_s = self.baseline_s = self.outdoor_sum_cs = 0.0
        return record


def room_weights(
    models: Mapping[str, tuple[float, float, float]], min_confidence: float = 0.6
) -> dict[str, float]:
    """Room id to (a, b, confidence) -> weights summing to 1: b / a, or equal weights
    while any room is below min_confidence."""
    if not models:
        return {}
    ids = sorted(models)
    raw = {}
    for rid in ids:
        a, b, conf = models[rid]
        if not (conf >= min_confidence and a > 0 and b > 0):
            return {rid: 1.0 / len(ids) for rid in ids}
        raw[rid] = b / a
    total = sum(raw.values())
    return {rid: v / total for rid, v in raw.items()}


@dataclass(frozen=True, slots=True)
class Signature:
    """The house signature: litres = k * DH + c."""

    k: float  # litres per K·h
    c: float  # litres per day
    cv_rmse: float
    days: int
    spread: float  # p90 / p10 of the fit days' weighted degree-hours


def _percentile(sorted_values: Sequence[float], q: float) -> float:
    pos = q * (len(sorted_values) - 1)
    lo = math.floor(pos)
    hi = min(lo + 1, len(sorted_values) - 1)
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (pos - lo)


def fit_signature(dh: Sequence[float], litres: Sequence[float]) -> Signature | None:
    """Theil-Sen slope, median intercept; refit through the origin if c < 0.
    None with fewer than 2 days, or without two days of different degree-hours."""
    pts = sorted(
        (float(x), float(y))
        for x, y in zip(dh, litres, strict=True)
        if math.isfinite(x) and math.isfinite(y)
    )
    n = len(pts)
    if n < 2:
        return None
    slopes = [
        (pts[j][1] - pts[i][1]) / (pts[j][0] - pts[i][0])
        for i in range(n)
        for j in range(i + 1, n)
        if pts[j][0] != pts[i][0]
    ]
    if not slopes:
        return None
    k = statistics.median(slopes)
    c = statistics.median(y - k * x for x, y in pts)
    if c < 0:
        sx = sum(x for x, _ in pts)
        if sx <= 0:
            return None
        k, c = sum(y for _, y in pts) / sx, 0.0
    rmse = math.sqrt(sum((y - (k * x + c)) ** 2 for x, y in pts) / n)
    mean_y = sum(y for _, y in pts) / n
    cv = rmse / mean_y if mean_y > 0 else math.inf
    xs = [x for x, _ in pts]
    p10, p90 = _percentile(xs, 0.1), _percentile(xs, 0.9)
    spread = p90 / p10 if p10 > 0 else math.inf
    return Signature(k=k, c=c, cv_rmse=cv, days=n, spread=spread)


@dataclass(frozen=True, slots=True)
class SavingsParams:
    min_days: int = 14  # eligible days before any figure
    window_days: int = 60  # the fit uses the last this many eligible days; `days` lists these
    max_cv_rmse: float = 0.25
    min_spread: float = 1.3  # p90 / p10 of the fit days' degree-hours
    min_share: float = 0.9  # of the day with an outdoor reading, a baseline, a room reading
    rooms_days: int = 30  # `rooms` covers this many days


def _hours_missing(share: float) -> int:
    return max(1, round((1.0 - share) * 24))


def _num(v: Any) -> float | None:
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
        return None
    return float(v)


def why_not_eligible(
    summary: Mapping[str, Any],
    basis: str,
    names: Mapping[str, str] | None = None,
    params: SavingsParams = SavingsParams(),
) -> str | None:
    """None for an eligible closed day, otherwise the reason in words."""
    if summary.get("partial", True):
        return "partial day"
    rec = summary.get("savings")
    if not isinstance(rec, Mapping) or not isinstance(rec.get("rooms"), Mapping):
        return "no savings record"
    if _num(summary.get("litres")) is None:
        return "no nozzle rating"
    day_basis = summary.get("basis", "relay")
    if day_basis == "mixed":
        return "litres part metered, part from relay time"
    if day_basis != basis:
        return "a different litres basis"
    share = _num(rec.get("baseline_share")) or 0.0
    if share < params.min_share:
        return f"no household baseline for {_hours_missing(share)} h"
    share = _num(rec.get("outdoor_share")) or 0.0
    if share < params.min_share:
        return f"no fresh outdoor temperature for {_hours_missing(share)} h"
    for rid, r in sorted(rec["rooms"].items()):
        if not isinstance(r, Mapping):
            return "no savings record"
        read = _num(r.get("read_min"))
        if read is not None and read < params.min_share * 1440:
            name = (names or {}).get(rid, rid)
            return f"no reading from {name} for {_hours_missing(read / 1440)} h"
        if _num(r.get("dh_actual_kh")) is None or _num(r.get("dh_baseline_kh")) is None:
            return "no savings record"
    return None


def _weighted(rec: Mapping[str, Any], weights: Mapping[str, float], key: str) -> float:
    rooms = rec["rooms"]
    return sum(w * (_num(rooms[rid].get(key)) or 0.0) for rid, w in weights.items() if rid in rooms)


def _comfort(recs: Sequence[Mapping[str, Any]], rid: str | None = None) -> tuple[float, float]:
    """Comfort deficit (K·h) and warm share over these records, all rooms or one."""
    deficit = warm = ok = 0.0
    for rec in recs:
        for r_id, r in rec["rooms"].items():
            if rid is not None and r_id != rid:
                continue
            deficit += _num(r.get("deficit_kh")) or 0.0
            warm += _num(r.get("warm_min")) or 0.0
            ok += _num(r.get("warm_ok_min")) or 0.0
    return deficit, (ok / warm if warm > 0 else None)


def _r(v: float | None, places: int) -> float | None:
    return None if v is None else round(v, places)


def _date(day: Any) -> str | None:
    try:
        return date.fromordinal(int(day)).isoformat()
    except (TypeError, ValueError, OverflowError):
        return None


def report(
    days: Sequence[Mapping[str, Any]],
    weights: Mapping[str, float],
    names: Mapping[str, str],
    *,
    household: bool,
    outdoor_sensor: bool,
    outdoor_source: str | None = None,
    outdoor_missing: str = "no outdoor sensor",
    params: SavingsParams = SavingsParams(),
) -> dict:
    """The whole GET /api/v1/savings body (spec 8.1) from closed day summaries,
    oldest first. Dates from each summary's `day` ordinal (date.fromordinal).

    `outdoor_source` names where the outdoor temperature comes from (`zigbee`,
    `home_assistant`, `both` or `simulated`), for `outdoor` in the body.
    `outdoor_missing` is the reason given without one (`outdoor_sensor` false)."""
    by_day: dict[int, Mapping[str, Any]] = {}
    for d in days:
        if isinstance(d, Mapping) and isinstance(d.get("day"), int):
            by_day[d["day"]] = d  # a repeated day: the later summary wins
    kept = [by_day[k] for k in sorted(by_day)]
    # The fit uses one litres basis: the latest day's, passing over "mixed" days (part
    # metered, part relay time, spec 5.6, 5.9), which are never eligible.
    bases = [str(d.get("basis", "relay")) for d in kept]
    basis = next((b for b in reversed(bases) if b != "mixed"), bases[-1] if bases else "relay")
    weights = dict(weights)
    latest = kept[-1].get("savings") if kept else None
    if isinstance(latest, Mapping) and isinstance(latest.get("rooms"), Mapping):
        # Only rooms the meter measures now: a room with no baseline has no record.
        measured = {rid: w for rid, w in weights.items() if rid in latest["rooms"]}
        total = sum(measured.values())
        if total > 0:
            weights = {rid: w / total for rid, w in measured.items()}

    def why(d: Mapping[str, Any]) -> str | None:
        reason = why_not_eligible(d, basis, names, params)
        if reason is None:
            for rid in sorted(weights):
                if rid not in d["savings"]["rooms"]:
                    return f"no record for {names.get(rid, rid)}"
        return reason

    whys = [why(d) for d in kept]
    eligible = [d for d, w in zip(kept, whys, strict=True) if w is None]

    status, reason, sig = "ready", None, None
    if not household:
        status, reason = "unavailable", "no household"
    elif not outdoor_sensor:
        status, reason = "unavailable", outdoor_missing
    elif kept and _num(kept[-1].get("litres")) is None:
        status, reason = "unavailable", "no nozzle rating"
    elif len(eligible) < params.min_days:
        status, reason = "learning", f"{len(eligible)} of {params.min_days} days"
    else:
        fit_days = eligible[-params.window_days :]
        sig = fit_signature(
            [_weighted(d["savings"], weights, "dh_actual_kh") for d in fit_days],
            [float(d["litres"]) for d in fit_days],
        )
        if sig is None:
            reason = "the weather hasn't varied enough yet"
        elif sig.k <= 0:
            reason = "the fit doesn't follow the weather yet"
        elif sig.cv_rmse > params.max_cv_rmse:
            reason = (
                f"the fit isn't close enough yet ({round(sig.cv_rmse * 100)} % CV(RMSE), "
                f"at most {round(params.max_cv_rmse * 100)} %)"
            )
        elif sig.spread < params.min_spread:
            reason = "the weather hasn't varied enough yet"
        if reason is not None:
            status, sig = "learning", None
    ready = sig is not None
    k = sig.k if sig is not None else 0.0

    def saved(d: Mapping[str, Any]) -> float:
        rec = d["savings"]
        return k * (
            _weighted(rec, weights, "dh_baseline_kh") - _weighted(rec, weights, "dh_actual_kh")
        )

    last = max(by_day) if by_day else 0
    listed = []
    for d, w in zip(kept, whys, strict=True):
        if d["day"] <= last - params.window_days:
            continue
        rec = d.get("savings") if isinstance(d.get("savings"), Mapping) else None
        # A record the day has but that is malformed reads as none.
        has_rooms = (
            rec is not None
            and isinstance(rec.get("rooms"), Mapping)
            and all(isinstance(r, Mapping) for r in rec["rooms"].values())
        )
        litres = _num(d.get("litres"))
        s = saved(d) if ready and w is None else None
        deficit, warm_share = _comfort([rec]) if has_rooms else (None, None)
        listed.append(
            {
                "date": _date(d["day"]),
                "eligible": w is None,
                "why": w,
                "partial": bool(d.get("partial", False)),
                "litres": _r(litres, 2),
                "litres_baseline": _r(litres + s, 2)
                if s is not None and litres is not None
                else None,
                "litres_saved": _r(s, 2),
                "dh_actual_kh": (
                    _r(_weighted(rec, weights, "dh_actual_kh"), 1) if has_rooms else None
                ),
                "dh_baseline_kh": (
                    _r(_weighted(rec, weights, "dh_baseline_kh"), 1) if has_rooms else None
                ),
                "outdoor_mean_c": _r(_num(rec.get("outdoor_mean_c")), 1) if rec else None,
                "comfort_deficit_kh": _r(deficit, 2),
                "warm_share": _r(warm_share, 3),
            }
        )

    fit = totals = None
    rooms: list[dict] = []
    if ready and sig is not None:
        equal = len(set(weights.values())) <= 1
        fit = {
            "litres_per_100_kh": round(k * 100, 3),
            "standing_litres_per_day": round(sig.c, 2),
            "cv_rmse": round(sig.cv_rmse, 3),
            "days": sig.days,
            "weights": "equal" if equal else "radiator_time",
        }
        used = sum(float(d["litres"]) for d in eligible)
        saved_total = sum(saved(d) for d in eligible)
        base_total = used + saved_total
        deficit, warm_share = _comfort([d["savings"] for d in eligible])
        totals = {
            "since": _date(eligible[0]["day"]),
            "days": len(eligible),
            "litres_used": round(used, 2),
            "litres_baseline": round(base_total, 2),
            "litres_saved": round(saved_total, 2),
            "percent_saved": round(100 * saved_total / base_total, 1) if base_total > 0 else None,
            "comfort_deficit_kh": round(deficit, 2),
            "warm_share": _r(warm_share, 3),
        }
        recent = [d["savings"] for d in eligible if d["day"] > last - params.rooms_days]
        recent_total = sum(
            k * (_weighted(r, weights, "dh_baseline_kh") - _weighted(r, weights, "dh_actual_kh"))
            for r in recent
        )
        for rid, w_r in weights.items():
            room_saved = sum(
                k
                * w_r
                * (
                    (_num(r["rooms"][rid].get("dh_baseline_kh")) or 0.0)
                    - (_num(r["rooms"][rid].get("dh_actual_kh")) or 0.0)
                )
                for r in recent
                if rid in r["rooms"]
            )
            r_deficit, r_warm = _comfort(recent, rid)
            rooms.append(
                {
                    "room_id": rid,
                    "name": names.get(rid, rid),
                    "litres_saved": round(room_saved, 2),
                    "share": round(room_saved / recent_total, 3) if recent_total else None,
                    "comfort_deficit_kh": round(r_deficit, 2),
                    "warm_share": _r(r_warm, 3),
                }
            )
        rooms.sort(key=lambda r: (-r["litres_saved"], r["room_id"]))

    return {
        "status": status,
        "why": reason,
        "progress": {"eligible_days": len(eligible), "needed_days": params.min_days},
        "baseline": {"id": BASELINE_ID, "text": BASELINE_TEXT},
        "basis": basis,
        "basis_text": BASIS_TEXT.get(basis),
        "litres_upper_bound": basis != "firing",
        "outdoor": {"source": outdoor_source, "text": OUTDOOR_TEXT.get(outdoor_source or "")},
        "fit": fit,
        "totals": totals,
        "days": listed,
        "rooms": rooms,
    }
