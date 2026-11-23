"""Room use and the savings baseline (spec 5.8, 5.9).

Room use is how a controllable room is used right now: `in_use`, `occasional` or
`setback`. The runtime works it out each tick and passes it to the core in the
snapshot (`RoomInput.use`), so the tick history records it and replay decides the
same way.

- **Household rooms** (`room_use`): inside one of the room's live warm periods the
  room is at that day's warm level (in use or occasional); outside them it is setback.
  Warm periods come from the compiled household for the people at home, so a person
  away turns their rooms setback.
- **Hand-written rooms** with a use level in the house file (`rooms[].use`,
  `schedule_room_use`): the warm periods are the spans of the day where the schedule's
  setpoint is above that day's lowest setpoint. The weekend level applies on Saturday
  and Sunday, the days a hand-written schedule's `weekend` key means.
- Any other room has no room use (None), which keeps today's behaviour.

The savings baseline is a heating timer on from the first person up to the last to
bed every day, with each room's valve at its usual temperature (`compile_baseline`).

Pure: no I/O and no clock. Times are minutes of the day; weekdays start at Monday = 0.
"""

from __future__ import annotations

from dataclasses import dataclass

from radiate.core.types import RoomUse

from .household import (
    CompiledHousehold,
    Household,
    Interval,
    UseLevel,
    round_half,
)
from .schedule import DAY_ALIASES, DaySchedule, WeekSchedule

BASELINE_TEXT = (
    "Compared with a heating timer on from the first person up to the last to bed "
    "every day, and each room's valve set to its usual temperature."
)

# The days a hand-written schedule's `weekend` key covers: Saturday and Sunday.
SCHEDULE_WEEKEND = frozenset(DAY_ALIASES["weekend"])

_WARM_USE = {UseLevel.IN_USE: RoomUse.IN_USE, UseLevel.OCCASIONAL: RoomUse.OCCASIONAL}


def _inside(periods: tuple[Interval, ...], minute: int) -> bool:
    return any(a <= minute < b for a, b in periods)


def room_use(
    compiled: CompiledHousehold, room_id: str, weekday: int, minute: int
) -> RoomUse | None:
    """IN_USE or OCCASIONAL inside one of the room's live warm periods (by its warm
    level that day), SETBACK outside them; None for a room not in the household."""
    periods = compiled.periods.get(room_id)
    levels = compiled.warm_levels.get(room_id)
    if periods is None or levels is None:
        return None
    day = weekday % 7
    if not _inside(periods[day], minute):
        return RoomUse.SETBACK
    return _WARM_USE.get(levels[day], RoomUse.SETBACK)


def schedule_periods(day: DaySchedule) -> tuple[Interval, ...]:
    """A hand-written day's warm periods: where its setpoint is above the day's lowest.

    A day with one setpoint throughout has none.
    """
    lowest = min(sp for _, sp in day.transitions)
    ends = [m for m, _ in day.transitions[1:]] + [1440]
    out: list[Interval] = []
    for (start, sp), end in zip(day.transitions, ends, strict=True):
        if sp <= lowest:
            continue
        if out and out[-1][1] == start:
            out[-1] = (out[-1][0], end)
        else:
            out.append((start, end))
    return tuple(out)


def schedule_room_use(
    week: WeekSchedule, levels: tuple[UseLevel, UseLevel], weekday: int, minute: int
) -> RoomUse:
    """Room use for a hand-written room with a use level, as (weekdays, weekend).

    Its level inside the day's warm periods (`schedule_periods`), SETBACK outside them
    and all day when the level is unused.
    """
    day = weekday % 7
    level = levels[1] if day in SCHEDULE_WEEKEND else levels[0]
    if level is UseLevel.UNUSED or not _inside(schedule_periods(week.days[day]), minute):
        return RoomUse.SETBACK
    return _WARM_USE[level]


@dataclass(frozen=True, slots=True)
class BaselineDay:
    start_min: int  # timer on: first person up less the fixed preheat (not below 0)
    end_min: int  # timer off: last person to bed
    setpoint_c: float  # the room's temperature for its use level that day


@dataclass(frozen=True, slots=True)
class Baseline:
    rooms: dict[str, tuple[BaselineDay | None, ...]]  # per room, Monday first

    def setpoint_at(self, room_id: str, weekday: int, minute: int) -> float | None:
        """The baseline valve setpoint now, or None while the timer is off or the room
        is not in the household."""
        days = self.rooms.get(room_id)
        if days is None:
            return None
        day = days[weekday % 7]
        if day is None or not day.start_min <= minute < day.end_min:
            return None
        return day.setpoint_c


def compile_baseline(household: Household) -> Baseline:
    """Nobody away, no room adjustments. Per room per day: the level's temperature
    (the room's own `temperature` if set; its unused temperature on an unused day)."""
    temps = household.temperatures
    rooms: dict[str, tuple[BaselineDay | None, ...]] = {}
    for room in household.rooms:
        preheat = _or(room.preheat_min, household.timing.preheat_min)
        days: list[BaselineDay | None] = []
        for weekday in range(7):
            routines = [p.routine_on(weekday, household.weekend_days) for p in household.people]
            if not routines:
                days.append(None)
                continue
            first_up = min(r.up_min for r in routines)
            last_bed = max(r.bed_min for r in routines)
            level = room.use_weekend if weekday in household.weekend_days else room.use_weekdays
            if level is UseLevel.UNUSED:
                setpoint = round_half(_or(room.unused_c, temps.unused_c))
            else:
                setpoint = round_half(_or(room.temperature_c, temps.level(level)))
            days.append(BaselineDay(max(0, first_up - preheat), last_bed, setpoint))
        rooms[room.room_id] = tuple(days)
    return Baseline(rooms)


def _or(value, default):
    return default if value is None else value
