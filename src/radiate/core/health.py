"""Failure detectors (spec 7). Pure: the caller passes monotonic `now` and readings.

- No heat: the heating relay has been on (outside store recovery) with at least one
  radiator valve open for 30 min, and nothing shows heat arriving: no TRV warming,
  no ordinary calling room warming and no rise on a passive (bypass) radiator's room.
  Out of oil or burner lockout. Time with every valve shut does not count: then the
  radiators cannot show heat whatever the boiler does.
- Short-cycling (spec 5.6): more than 4 relay starts in an hour, or burns cut short
  of the minimum by something other than Radiate, still happening an hour after the
  first one (cut burns at least an hour apart within the last two hours).
  Radiate's own guard allows at most `max_starts_per_hour`, so this catches another
  controller, a manual switch or a relay dropping out. Minimum off is raised by
  5 min (to at most 30 min) for 24 h, at most once an hour.
- Stuck valve: a room called for heat with its valve open and the TRV heating for
  40 min of flow, other radiators warmed, but its own TRV did not, in 3 burns in a
  row. The room is flagged untrusted (learning paused) until its radiator warms.
"""

from __future__ import annotations

from dataclasses import dataclass, field

NO_HEAT_AFTER_S = 30 * 60
# Rise of the TRV's internal reading above the room temperature (or of the reading
# itself without a room sensor) that means its radiator is warming. Relative to the
# room, so a radiator slowly warming in a cooling room still counts.
TRV_RISE_K = 0.6
PASSIVE_RISE_K = 0.3  # room rise on the always-open bypass radiator
ROOM_RISE_KPH = 0.3  # a calling room warming at least this fast is getting heat
MAX_TICK_S = 300.0  # longer gaps (restart, stalled loop) are not counted
NO_HEAT_MESSAGE = "No heat: check oil and boiler lockout"

SHORT_CYCLE_STARTS = 4  # more than this many relay starts in an hour
SHORT_CYCLE_STEP_S = 5 * 60
SHORT_CYCLE_MIN_OFF_CAP_S = 30 * 60
SHORT_CYCLE_HOLD_S = 24 * 3600
HOUR = 3600.0

STUCK_AFTER_S = 40 * 60  # flow with the valve open and calling, per burn
STUCK_BURNS = 3


def _rise(points: list[tuple[float, float]]) -> float:
    """Latest reading minus the lowest one in the window."""
    if not points:
        return 0.0
    return points[-1][1] - min(v for _, v in points)


@dataclass(slots=True)
class NoHeat:
    open_flow_s: float = 0.0  # flowing with a valve open, since heat was last seen
    last_t: float | None = None
    active: bool = False
    trv: dict[str, list[tuple[float, float]]] = field(default_factory=dict)
    passive: dict[str, list[tuple[float, float]]] = field(default_factory=dict)

    def update(
        self,
        now: float,
        *,
        relay_on: bool,
        flowing: bool,
        any_open: bool,
        trv_readings: dict[str, float],
        passive_readings: dict[str, float],
        rooms_warming: bool,
    ) -> bool:
        """Advance one tick. Returns True when the no-heat condition is newly raised."""
        dt = 0.0 if self.last_t is None else min(MAX_TICK_S, max(0.0, now - self.last_t))
        self.last_t = now
        if not relay_on:
            # Boiler not asked for heat: nothing to judge. Clear any alert.
            self._reset()
            self.active = False
            return False
        if not flowing:
            # Store recovery: the radiators get no flow by design. Pause.
            self._reset()
            return False
        window = NO_HEAT_AFTER_S + 10 * 60
        for store, readings in ((self.trv, trv_readings), (self.passive, passive_readings)):
            for key, value in readings.items():
                pts = store.setdefault(key, [])
                pts.append((now, value))
                store[key] = [p for p in pts if now - p[0] <= window]
        heat = (
            rooms_warming
            or any(_rise(p) >= TRV_RISE_K for p in self.trv.values())
            or any(_rise(p) >= PASSIVE_RISE_K for p in self.passive.values())
        )
        if heat:
            self.open_flow_s = 0.0
            self.active = False
            return False
        if any_open:
            self.open_flow_s += dt
        if not self.active and self.open_flow_s >= NO_HEAT_AFTER_S:
            self.active = True
            return True
        return False

    def _reset(self) -> None:
        self.open_flow_s = 0.0
        self.trv.clear()
        self.passive.clear()


@dataclass(slots=True)
class ShortCycle:
    starts: list[float] = field(default_factory=list)  # observed relay starts
    cut_burns: list[float] = field(default_factory=list)  # ends of burns cut short
    relay: bool | None = None  # observed relay last tick
    burn_start: float | None = None
    commanded: bool = False  # what Radiate asked for last tick
    extra_off_s: float = 0.0
    until: float | None = None  # when the raised minimum off ends
    raised_at: float | None = None

    def min_off_s(self, base_s: float) -> float:
        if self.extra_off_s <= 0:
            return base_s
        return min(max(base_s, SHORT_CYCLE_MIN_OFF_CAP_S), base_s + self.extra_off_s)

    def update(self, now: float, *, relay_on: bool, min_burn_s: float, base_off_s: float) -> bool:
        """Advance one tick with the observed relay. Returns True when minimum off is raised."""
        if self.until is not None and now >= self.until:
            self.extra_off_s, self.until = 0.0, None
        if self.relay is not None and relay_on != self.relay:
            if relay_on:
                self.starts.append(now)
                self.burn_start = now
            else:
                cut = self.burn_start is not None and now - self.burn_start < min_burn_s
                if cut and self.commanded:
                    self.cut_burns.append(now)  # Radiate still wanted heat
                self.burn_start = None
        self.relay = relay_on
        self.starts = [t for t in self.starts if now - t < HOUR]
        self.cut_burns = [t for t in self.cut_burns if now - t < 2 * HOUR]

        too_many = len(self.starts) > SHORT_CYCLE_STARTS
        # Still happening after an hour: cut burns at least an hour apart in the last two.
        cut_for_two_hours = bool(self.cut_burns) and (
            self.cut_burns[-1] - self.cut_burns[0] >= HOUR
        )
        if not (too_many or cut_for_two_hours):
            return False
        if self.raised_at is not None and now - self.raised_at < HOUR:
            return False
        room = max(0.0, SHORT_CYCLE_MIN_OFF_CAP_S - base_off_s)
        self.extra_off_s = min(room, self.extra_off_s + SHORT_CYCLE_STEP_S)
        self.until = now + SHORT_CYCLE_HOLD_S
        self.raised_at = now
        # Judge the next hour on fresh evidence.
        self.starts.clear()
        self.cut_burns.clear()
        return True

    def message(self, base_off_s: float) -> str:
        minutes = round(self.min_off_s(base_off_s) / 60)
        return f"Boiler short-cycling: minimum off raised to {minutes} min"


@dataclass(slots=True)
class ValveCheck:
    """Per room: does its radiator warm when its valve should be open? One verdict a burn."""

    misses: int = 0  # burns in a row with no warming
    untrusted: bool = False
    eligible_s: float = 0.0  # this burn: flowing, calling, valve open, TRV heating
    low: float | None = None  # this burn: lowest TRV reading relative to the room
    rose: bool = False  # this burn: the radiator warmed
    judged: bool = False  # this burn's verdict is in

    def observe(self, dt: float, *, flowing: bool, eligible: bool, offset: float | None) -> None:
        if not flowing:
            self.eligible_s, self.low, self.rose, self.judged = 0.0, None, False, False
            return
        if offset is not None:
            self.low = offset if self.low is None else min(self.low, offset)
            if not self.rose and offset - self.low >= TRV_RISE_K:
                self.rose = True
                self.misses, self.untrusted, self.judged = 0, False, True
        if eligible:
            self.eligible_s += dt

    def judge(self, house_heat: bool) -> bool:
        """Count a miss once this burn has been long enough. True when newly untrusted.

        Only when another radiator warmed this burn: otherwise no heat is arriving at
        all, which is the no-heat check's job.
        """
        if self.judged or self.rose or self.eligible_s < STUCK_AFTER_S or not house_heat:
            return False
        self.judged = True
        self.misses += 1
        if self.misses >= STUCK_BURNS and not self.untrusted:
            self.untrusted = True
            return True
        return False
