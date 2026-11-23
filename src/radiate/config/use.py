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
bed every day, with each room's valve at its usual temperature. Household rooms take
it from the household (`compile_baseline`). Hand-written rooms with a use level take
the household's timer too, or without a household (or one without people) the span of
the house's warm periods that day, each at its schedule's highest setpoint that day
(`compile_schedule_baseline`). Other rooms have no baseline.

Pure: no I/O and no clock. Times are minutes of the day; weekdays start at Monday = 0.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass

# One sentence, kept with the savings core that reports it; re-exported here.
from radiate.core.savings import BASELINE_TEXT as BASELINE_TEXT
from radiate.core.types import RoomUse

from .household import (
    CompiledHousehold,
    Household,
    Interval,
    UseLevel,
    round_half,
)
from .schedule import DAY_ALIASES, DaySchedule, WeekSchedule

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
            timer = _people_timer(household, weekday, preheat)
            if timer is None:
                days.append(None)
                continue
            level = room.use_weekend if weekday in household.weekend_days else room.use_weekdays
            if level is UseLevel.UNUSED:
                setpoint = round_half(_or(room.unused_c, temps.unused_c))
            else:
                setpoint = round_half(_or(room.temperature_c, temps.level(level)))
            days.append(BaselineDay(*timer, setpoint))
        rooms[room.room_id] = tuple(days)
    return Baseline(rooms)


def _people_timer(household: Household, weekday: int, preheat_min: int) -> Interval | None:
    """The baseline timer from the household's people: first up less the fixed
    preheat (not below 0) to the last to bed. None without people."""
    routines = [p.routine_on(weekday, household.weekend_days) for p in household.people]
    if not routines:
        return None
    first_up = min(r.up_min for r in routines)
    return max(0, first_up - preheat_min), max(r.bed_min for r in routines)


def _schedule_timer(weeks: Mapping[str, WeekSchedule], weekday: int) -> Interval | None:
    """The baseline timer from hand-written schedules: the earliest warm period start
    to the latest warm period end across them that day. None with no warm period."""
    periods = [p for w in weeks.values() for p in schedule_periods(w.days[weekday % 7])]
    if not periods:
        return None
    return min(a for a, _ in periods), max(b for _, b in periods)


def compile_schedule_baseline(
    weeks: Mapping[str, WeekSchedule],
    room_ids: Iterable[str],
    household: Household | None = None,
) -> Baseline:
    """The savings baseline for hand-written rooms with a use level (`rooms[].use`).

    `weeks` holds every hand-written room's week; `room_ids` the rooms that get a
    baseline. The timer is the household's (first person up less the fixed preheat, to
    the last to bed) when there is a household with people, otherwise the span of the
    house's warm periods that day (`_schedule_timer`). Inside it each room is at its
    usual setpoint, the highest its schedule sets that day; outside it the timer is off
    and the baseline puts no heat in (None), as for household rooms.
    """
    rooms: dict[str, tuple[BaselineDay | None, ...]] = {}
    for rid in room_ids:
        week = weeks.get(rid)
        if week is None:
            continue
        days: list[BaselineDay | None] = []
        for weekday in range(7):
            timer = None
            if household is not None and household.people:
                timer = _people_timer(household, weekday, household.timing.preheat_min)
            else:
                timer = _schedule_timer(weeks, weekday)
            if timer is None or timer[0] >= timer[1]:
                days.append(None)
                continue
            usual = max(sp for _, sp in week.days[weekday].transitions)
            days.append(BaselineDay(timer[0], timer[1], usual))
        rooms[rid] = tuple(days)
    return Baseline(rooms)


def _or(value, default):
    return default if value is None else value
