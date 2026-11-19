"""Oil and runtime accounting per day, and the daily balance score (spec 5.6, 9).

Pure: the caller passes monotonic `now`, a local day label and what happened this
tick. Burner time is relay time: the relay is what Radiate sees today. A relay call
includes the boiler's own thermostat cycling, so litres and kWh are an upper bound
until a burner-firing signal is available (spec open question 1).
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass, field

KWH_PER_LITRE = 10.35  # kerosene
EFFICIENCY = 0.85  # assumed, spec 5.6
MAX_TICK_S = 300.0  # longer gaps (restart, stalled loop) are not counted
HISTORY_DAYS = 7
BALANCE_FULL_SPREAD_MIN = 120.0
# Burn-length histogram, minutes: under 10, 10 to 20, ..., 120 and over.
BURN_EDGES_MIN = (10, 20, 30, 60, 120)
BURN_BUCKETS = ("under_10", "10_to_20", "20_to_30", "30_to_60", "60_to_120", "over_120")


def balance_score(spreads_min: list[float]) -> float | None:
    """100 x (1 - median spread / 120 min), clamped 0 to 100 (spec 9)."""
    if not spreads_min:
        return None
    med = statistics.median(spreads_min)
    return round(max(0.0, min(100.0, 100.0 * (1.0 - med / BALANCE_FULL_SPREAD_MIN))), 1)


@dataclass(slots=True)
class DayTotals:
    day: int
    burner_s: float = 0.0
    starts: list[float] = field(default_factory=list)  # relay start times (monotonic)
    burns_min: list[float] = field(default_factory=list)  # completed burns, minutes
    spreads_min: list[float] = field(default_factory=list)  # arrival spread per burn
    below_min: dict[str, float] = field(default_factory=dict)  # comfort minutes below


@dataclass(slots=True)
class Arrival:
    """Rooms calling when a burn started, and when each stopped calling."""

    rooms: set[str]
    arrived: dict[str, float] = field(default_factory=dict)


@dataclass(slots=True)
class Ledger:
    today: DayTotals = field(default_factory=lambda: DayTotals(day=0))
    history: list[dict] = field(default_factory=list)  # closed day summaries, oldest first
    relay: bool | None = None  # observed relay last tick
    burn_start: float | None = None
    firing: bool = False  # guard FIRING last tick
    arrival: Arrival | None = None
    last_t: float | None = None
    minute: int | None = None
    started: bool = False  # `today.day` has been set from a real label

    def update(
        self,
        now: float,
        day: int | None,
        *,
        relay_on: bool,
        firing: bool,
        calling: set[str],
        below: dict[str, bool],
        minute: int | None = None,
        nozzle_lph: float | None = None,
    ) -> dict | None:
        """Advance one tick. Returns the summary of a day that just closed, if any."""
        dt = 0.0 if self.last_t is None else min(MAX_TICK_S, max(0.0, now - self.last_t))
        self.last_t = now
        # The interval since the last tick belongs to the day it started in.
        if self.relay:
            self.today.burner_s += dt

        closed = None
        label = self._label(day, minute)
        if not self.started:
            self.today.day, self.started = label, True
        elif label != self.today.day:
            closed = self.summary(nozzle_lph)
            self.history = [*self.history, closed][-HISTORY_DAYS:]
            self.today = DayTotals(day=label)

        t = self.today
        for rid, is_below in below.items():
            if is_below:
                t.below_min[rid] = t.below_min.get(rid, 0.0) + dt / 60
        if self.relay is not None and relay_on != self.relay:
            if relay_on:
                t.starts.append(now)
                self.burn_start = now
            else:
                if self.burn_start is not None:
                    t.burns_min.append((now - self.burn_start) / 60)
                self.burn_start = None
        self.relay = relay_on
        self._track_arrival(now, firing, calling)
        return closed

    def _label(self, day: int | None, minute: int | None) -> int:
        if day is not None:
            self.minute = minute
            return day
        label = self.today.day
        if minute is not None and self.minute is not None and minute < self.minute - 720:
            label += 1  # local midnight passed
        if minute is not None:
            self.minute = minute
        return label

    def _track_arrival(self, now: float, firing: bool, calling: set[str]) -> None:
        if firing and not self.firing:
            self.arrival = Arrival(rooms=set(calling)) if len(calling) >= 2 else None
        a = self.arrival
        if a is not None:
            for rid in a.rooms - calling - a.arrived.keys():
                a.arrived[rid] = now
            if not firing or len(a.arrived) == len(a.rooms):
                # Rooms still calling when the burn ends count as arriving then. With
                # no room arriving at all there is no spread to measure.
                if a.arrived:
                    times = [a.arrived.get(rid, now) for rid in a.rooms]
                    self.today.spreads_min.append((max(times) - min(times)) / 60)
                self.arrival = None
        self.firing = firing

    def summary(self, nozzle_lph: float | None) -> dict:
        t = self.today
        hours = t.burner_s / 3600
        burns = t.burns_min
        histogram = dict.fromkeys(BURN_BUCKETS, 0)
        for b in burns:
            idx = sum(1 for edge in BURN_EDGES_MIN if b >= edge)
            histogram[BURN_BUCKETS[idx]] += 1
        litres = hours * nozzle_lph if nozzle_lph else None
        spreads = t.spreads_min
        return {
            "day": t.day,
            "basis": "relay",
            "burner_hours": round(hours, 2),
            "starts": len(t.starts),
            "max_starts_in_hour": max(
                (sum(1 for s in t.starts if a <= s < a + 3600) for a in t.starts), default=0
            ),
            "burns": {
                "count": len(burns),
                "mean_min": round(sum(burns) / len(burns), 1) if burns else None,
                "min_min": round(min(burns), 1) if burns else None,
                "max_min": round(max(burns), 1) if burns else None,
                "histogram": histogram,
            },
            "litres": round(litres, 2) if litres is not None else None,
            "kwh": round(litres * KWH_PER_LITRE * EFFICIENCY, 1) if litres is not None else None,
            "balance": {
                "starts_measured": len(spreads),
                "arrival_spread_min": round(statistics.median(spreads), 1) if spreads else None,
                "score": balance_score(spreads),
            },
            "comfort_minutes_below": {rid: round(v, 1) for rid, v in sorted(t.below_min.items())},
        }
