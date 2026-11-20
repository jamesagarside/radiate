"""Household setup: people, routines, use levels and room links, compiled to schedules.

People describe how they live (when they get up, go out, work and go to bed) and each
room gets a use level and the people who use it. `compile_household` turns that into
one ordinary `WeekSchedule` per room, so the runtime, the schedule mirror and the
simulator see nothing new. See docs/proposals/household-setup.md.

The rules, per room and per day type (weekdays, weekend):

- **Bedroom:** in use for the first 30 minutes after each of its people gets up and
  the last 30 minutes before they go to bed.
- **Office:** in use through its people's working hours.
- **Shared** (the default): in use while any of its people is up, at home and not
  working, and for the first 30 minutes after they get up even if they then go out
  or start work straight away.
- **All day:** in use from the first of its people getting up to the last going to bed,
  whether or not anyone is at home.

Each period of use starts early by the preheat (30 minutes until Radiate learns arrival
lags), periods 30 minutes or less apart merge, and the room gets its level's
temperature inside them. Outside them it sits at the unused temperature during the
house's day (first person up to last person in bed) and the night temperature
overnight. An unused room has no periods of use. If a day needs more than the TRVZB's
six transitions, the shortest warm periods are dropped and a note says which.

Pure: no I/O and no clock. Times are minutes of the day.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from enum import StrEnum

from .schedule import MAX_C, MAX_TRANSITIONS, MIN_C, DaySchedule, WeekSchedule, hhmm

PREHEAT_MIN = 30  # fixed until learned arrival lags feed in
MERGE_GAP_MIN = 30  # warm periods this close or closer become one
GETTING_UP_MIN = 30  # after getting up: bedroom and shared rooms count as in use
GOING_TO_BED_MIN = 30  # before bed: bedroom counts as in use
DAY_TYPES = ("weekdays", "weekend")
DAMP_BELOW_C = 12.0  # below this, walls and window frames can get damp

Interval = tuple[int, int]  # [start, end) in minutes of the day


class UseLevel(StrEnum):
    IN_USE = "in_use"
    OCCASIONAL = "occasional"
    UNUSED = "unused"


class RoomKind(StrEnum):
    SHARED = "shared"
    BEDROOM = "bedroom"
    OFFICE = "office"
    ALL_DAY = "all_day"


@dataclass(frozen=True, slots=True)
class Routine:
    """One person's day: when they get up, are out, work at home and go to bed."""

    up_min: int
    bed_min: int
    out: tuple[Interval, ...] = ()
    work: tuple[Interval, ...] = ()


@dataclass(frozen=True, slots=True)
class Person:
    id: str
    weekdays: Routine
    weekend: Routine
    name: str = ""  # shown in the UI only, never exported

    def routine(self, day_type: str) -> Routine:
        return self.weekend if day_type == "weekend" else self.weekdays


@dataclass(frozen=True, slots=True)
class Temperatures:
    """House-wide temperatures for each use level, and overnight."""

    in_use_c: float = 19.0
    occasional_c: float = 16.0
    unused_c: float = 14.0
    night_c: float = 14.0

    def level(self, level: UseLevel) -> float:
        if level is UseLevel.IN_USE:
            return self.in_use_c
        if level is UseLevel.OCCASIONAL:
            return self.occasional_c
        return self.unused_c


@dataclass(frozen=True, slots=True)
class RoomLink:
    """A room's use level and who uses it, which together decide its schedule."""

    room_id: str
    use_weekdays: UseLevel
    use_weekend: UseLevel
    kind: RoomKind = RoomKind.SHARED
    people: tuple[str, ...] | None = None  # None: everyone in the household
    temperature_c: float | None = None  # replaces the level's temperature in this room
    name: str = ""

    def use(self, day_type: str) -> UseLevel:
        return self.use_weekend if day_type == "weekend" else self.use_weekdays


@dataclass(frozen=True, slots=True)
class Household:
    people: tuple[Person, ...]
    rooms: tuple[RoomLink, ...]
    temperatures: Temperatures = field(default_factory=Temperatures)


@dataclass(frozen=True, slots=True)
class CompiledHousehold:
    schedules: dict[str, WeekSchedule]  # room id to week
    notes: tuple[str, ...] = ()  # warm periods dropped to fit the TRVZB, in words


def compile_household(
    household: Household,
    away: frozenset[str] = frozenset(),
    preheat_min: int | Mapping[str, int] = PREHEAT_MIN,
) -> CompiledHousehold:
    """One `WeekSchedule` per linked room, and notes on anything dropped to fit.

    `away` holds the ids of people treated as away: their part of every routine is
    dropped. `preheat_min` is minutes, for every room or per room id.
    """
    known = {p.id for p in household.people}
    unknown = sorted(away - known)
    if unknown:
        raise ValueError(f"unknown people in away: {', '.join(unknown)}")
    present = tuple(p for p in household.people if p.id not in away)
    temps = household.temperatures
    schedules: dict[str, WeekSchedule] = {}
    notes: list[str] = []
    for room in household.rooms:
        preheat = (
            preheat_min.get(room.room_id, PREHEAT_MIN)
            if isinstance(preheat_min, Mapping)
            else preheat_min
        )
        days: dict[str, DaySchedule] = {}
        for day_type in DAY_TYPES:
            day, dropped = _compile_day(room, day_type, present, temps, preheat)
            days[day_type] = day
            label = room.name or room.room_id
            for sp, (a, b) in dropped:
                notes.append(
                    f"{label}, {day_type}: dropped {_deg(sp)} {hhmm(a)} to {hhmm(b)} "
                    f"to fit the TRV's limit of {MAX_TRANSITIONS} changes a day"
                )
        schedules[room.room_id] = WeekSchedule(
            tuple(days["weekend" if i >= 5 else "weekdays"] for i in range(7))
        )
    return CompiledHousehold(schedules=schedules, notes=tuple(notes))


def round_half(value: float) -> float:
    """Nearest TRVZB step (0.5 °C), inside the TRVZB's range."""
    return max(MIN_C, min(MAX_C, round(value * 2) / 2))


# --- one room, one day type ------------------------------------------------------------


def _compile_day(
    room: RoomLink,
    day_type: str,
    present: tuple[Person, ...],
    temps: Temperatures,
    preheat: int,
) -> tuple[DaySchedule, list[tuple[float, Interval]]]:
    routines = [p.routine(day_type) for p in present]
    night = round_half(temps.night_c)
    unused = round_half(temps.unused_c)
    if routines:
        house_day: Interval | None = (
            max(0, min(r.up_min for r in routines) - preheat),
            max(r.bed_min for r in routines),
        )
    else:
        house_day = None  # nobody at home: unused all day

    level = room.use(day_type)
    warm_c = round_half(
        room.temperature_c if room.temperature_c is not None else temps.level(level)
    )
    if level is UseLevel.UNUSED:
        use: list[Interval] = []
    else:
        linked = [
            p.routine(day_type) for p in present if room.people is None or p.id in room.people
        ]
        use = _in_use(room.kind, linked)
    warm = _merge([(max(0, a - preheat), b) for a, b in use if b > a])

    dropped: list[tuple[float, Interval]] = []
    transitions = _transitions(warm, warm_c, house_day, night, unused)
    while len(transitions) > MAX_TRANSITIONS and warm:
        # Shortest first; of equal length, the later one.
        shortest = min(warm, key=lambda iv: (iv[1] - iv[0], -iv[0]))
        warm.remove(shortest)
        dropped.append((warm_c, shortest))
        transitions = _transitions(warm, warm_c, house_day, night, unused)
    return DaySchedule(tuple(transitions)), sorted(dropped, key=lambda d: d[1])


def _in_use(kind: RoomKind, routines: list[Routine]) -> list[Interval]:
    use: list[Interval] = []
    if kind is RoomKind.ALL_DAY:
        if routines:
            use.append((min(r.up_min for r in routines), max(r.bed_min for r in routines)))
        return use
    for r in routines:
        if kind is RoomKind.BEDROOM:
            use.append((r.up_min, min(r.bed_min, r.up_min + GETTING_UP_MIN)))
            use.append((max(r.up_min, r.bed_min - GOING_TO_BED_MIN), r.bed_min))
        elif kind is RoomKind.OFFICE:
            use.extend(r.work)
        else:
            use.append((r.up_min, min(r.bed_min, r.up_min + GETTING_UP_MIN)))
            use.extend(_subtract((r.up_min, r.bed_min), [*r.out, *r.work]))
    return use


def _subtract(span: Interval, holes: Iterable[Interval]) -> list[Interval]:
    out: list[Interval] = []
    start, end = span
    for a, b in sorted(holes):
        if a > start:
            out.append((start, min(a, end)))
        start = max(start, b)
        if start >= end:
            break
    if start < end:
        out.append((start, end))
    return [iv for iv in out if iv[1] > iv[0]]


def _merge(intervals: list[Interval]) -> list[Interval]:
    merged: list[Interval] = []
    for a, b in sorted(intervals):
        if merged and a - merged[-1][1] <= MERGE_GAP_MIN:
            merged[-1] = (merged[-1][0], max(merged[-1][1], b))
        else:
            merged.append((a, b))
    return merged


def _transitions(
    warm: list[Interval],
    warm_c: float,
    house_day: Interval | None,
    night: float,
    unused: float,
) -> list[tuple[int, float]]:
    def at(minute: int) -> float:
        if any(a <= minute < b for a, b in warm):
            return warm_c
        if house_day is None or house_day[0] <= minute < house_day[1]:
            return unused
        return night

    points = {0}
    for a, b in [*warm, *([house_day] if house_day else [])]:
        points.update((a, b))
    out: list[tuple[int, float]] = []
    for m in sorted(p for p in points if 0 <= p < 1440):
        sp = at(m)
        if not out or out[-1][1] != sp:
            out.append((m, sp))
    return out


def _deg(sp: float) -> str:
    return f"{int(sp)}°" if sp == int(sp) else f"{sp:.1f}°"
