"""Failure detectors (spec 7). Pure: the caller passes monotonic `now` and readings.

- No heat: the heating relay has been on (outside store recovery) with at least one
  radiator valve open for 30 min, and nothing shows heat arriving: no TRV warming,
  no ordinary calling room warming and no rise on a passive (bypass) radiator's room.
  Out of oil or burner lockout. Time with every valve shut does not count: then the
  radiators cannot show heat whatever the boiler does.
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
