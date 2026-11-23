"""Oil and runtime accounting per day, and the daily balance score (spec 5.6, 9).

Pure: the caller passes monotonic `now`, a local day label and what happened this
tick. Burner time is the burner's firing time when the relay's power metering shows
it (basis `firing`). Without metering it falls back to relay time (basis `relay`),
which includes the boiler's own thermostat cycling inside a call, so litres and kWh
are an upper bound; a day with both is `mixed`. Relay time and relay-basis litres are
always reported too.

Only what was seen counts. A relay the driver could not read counts nothing, and in a
dry run, where Radiate does not run the boiler, relay time is not burner time and
burns get no arrival spread: only a metered burner counts.

A day is partial when Radiate did not see all of it: it started after midnight
(a first install, or a restart without saved state) or there was a long gap between
ticks. Its totals cover what was seen, and it gets no balance score: a first day
starts with untrained models, so its arrival spread says little about the house.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass, field

KWH_PER_LITRE = 10.35  # kerosene
EFFICIENCY = 0.85  # assumed, spec 5.6
MAX_TICK_S = 300.0  # longer gaps (restart, stalled loop) are not counted
PARTIAL_AFTER_S = 30 * 60  # unseen time a day may have and still count as whole
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
    burner_s: float = 0.0  # heating burner time on the day's basis: firing_s + fallback_s
    relay_s: float = 0.0  # heating relay on, as read
    firing_s: float = 0.0  # heating burner firing, metered
    fallback_s: float = 0.0  # heating relay on, unmetered, while Radiate ran the boiler
    metered_s: float = 0.0  # time with heating burner metering
    store_firing_s: float = 0.0  # store burner firing, metered
    burner_starts: int = 0  # heating burner lighting, metered
    store_starts: int = 0
    starts: list[float] = field(default_factory=list)  # relay start times (monotonic)
    burns_min: list[float] = field(default_factory=list)  # completed burns, minutes
    spreads_min: list[float] = field(default_factory=list)  # arrival spread per burn
    below_min: dict[str, float] = field(default_factory=dict)  # comfort minutes below
    unseen_s: float = 0.0  # time in this day that Radiate did not see

    @property
    def partial(self) -> bool:
        return self.unseen_s > PARTIAL_AFTER_S


@dataclass(slots=True)
class Arrival:
    """Rooms calling when a burn started, and when each stopped calling."""

    rooms: set[str]
    arrived: dict[str, float] = field(default_factory=dict)


@dataclass(slots=True)
class Ledger:
    today: DayTotals = field(default_factory=lambda: DayTotals(day=0))
    history: list[dict] = field(default_factory=list)  # closed day summaries, oldest first
    relay: bool | None = None  # observed relay last tick (None: not read)
    burner: bool | None = None  # heating burner firing last tick (None: not metered)
    store_burner: bool | None = None
    live: bool = True  # last tick, Radiate ran the boiler (not a dry run)
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
        relay_observed: bool = True,
        live: bool = True,
        heating_burner: bool | None = None,
        store_burner: bool | None = None,
    ) -> dict | None:
        """Advance one tick. Returns the summary of a day that just closed, if any.

        `relay_observed`: `relay_on` was read from the relay. `live`: Radiate runs the
        boiler (False in a dry run). `heating_burner`, `store_burner`: the burner firing
        on each channel, from power metering, or None.
        """
        gap = 0.0 if self.last_t is None else max(0.0, now - self.last_t)
        dt = min(MAX_TICK_S, gap)
        missed = gap - dt  # not counted: Radiate was not running, or the loop stalled
        self.last_t = now
        # The interval since the last tick belongs to the day it started in, and is
        # counted by what was seen at its start.
        d = self.today
        if self.relay:
            d.relay_s += dt
        if self.burner is not None:
            d.metered_s += dt
            if self.burner:
                d.firing_s += dt
                d.burner_s += dt
        elif self.relay and self.live:
            d.fallback_s += dt
            d.burner_s += dt
        if self.store_burner:
            d.store_firing_s += dt
        # Time since local midnight, when known, for the part of a gap in a new day.
        since_midnight = minute * 60.0 if minute is not None else 0.0

        closed = None
        label = self._label(day, minute)
        if not self.started:
            self.today.day, self.started = label, True
            self.today.unseen_s = since_midnight
        elif label != self.today.day:
            self.today.unseen_s += max(0.0, missed - since_midnight)
            closed = self.summary(nozzle_lph)
            self.history = [*self.history, closed][-HISTORY_DAYS:]
            self.today = DayTotals(day=label, unseen_s=min(missed, since_midnight))
        else:
            self.today.unseen_s += missed

        t = self.today
        for rid, is_below in below.items():
            if is_below:
                t.below_min[rid] = t.below_min.get(rid, 0.0) + dt / 60
        relay = relay_on if relay_observed else None
        if self.relay is not None and relay is not None and relay != self.relay:
            if relay:
                t.starts.append(now)
                self.burn_start = now
            else:
                if self.burn_start is not None:
                    t.burns_min.append((now - self.burn_start) / 60)
                self.burn_start = None
        if self.burner is False and heating_burner:
            t.burner_starts += 1
        if self.store_burner is False and store_burner:
            t.store_starts += 1
        self.relay = relay
        self.burner, self.store_burner, self.live = heating_burner, store_burner, live
        # A dry run's burns are Radiate's intentions, not the boiler's: no spread.
        self._track_arrival(now, firing and live, calling)
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
        metered = t.metered_s > 0

        def h(s: float) -> float:
            return round(s / 3600, 2)

        def litres_for(s: float) -> float | None:
            return round(s / 3600 * nozzle_lph, 2) if nozzle_lph else None

        spreads = t.spreads_min
        return {
            "day": t.day,
            # Radiate missed part of the day: totals cover what it saw, no balance score.
            "partial": t.partial,
            # What `burner_hours`, `litres` and `kwh` are counted from.
            "basis": ("mixed" if t.fallback_s > 0 else "firing") if metered else "relay",
            "burner_hours": round(hours, 2),
            "relay_hours": h(t.relay_s),
            # Relay time: an upper bound, as the boiler's own thermostat cycles inside.
            "litres_relay": litres_for(t.relay_s),
            # The burner as the relay's power metering shows it (None: not metered).
            "burner": {
                "metered": metered,
                "heating_hours": h(t.firing_s) if metered else None,
                "heating_starts": t.burner_starts if metered else None,
                "store_hours": h(t.store_firing_s) if metered else None,
                "store_starts": t.store_starts if metered else None,
                "store_litres": litres_for(t.store_firing_s) if metered else None,
            },
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
                "score": None if t.partial else balance_score(spreads),
            },
            "comfort_minutes_below": {rid: round(v, 1) for rid, v in sorted(t.below_min.items())},
        }
