"""Household setup: people, routines, use levels and room links, compiled to schedules.

People describe how they live (when they get up, go out, work and go to bed) and each
room gets a use level and the people who use it. `compile_household` turns that into
ordinary `WeekSchedule`s, so the runtime, the schedule mirror and the simulator see
nothing new. See docs/proposals/household-setup.md.

Every duration and temperature below is a setting with a default (`Timing`,
`AwaySettings`, `Temperatures`), house-wide and, where households differ, per person
or per room. The defaults describe one way of living; none of it is fixed.

The rules, per room and per day:

- **Bedroom:** in use for the first `getting_up_min` after each of its people gets up
  and the last `bedtime_min` before they go to bed.
- **Office:** in use through its people's working hours.
- **Shared** (the default): in use while any of its people is up, at home and not
  working, and for the first `getting_up_min` after they get up even if they then go
  out or start work straight away.
- **While home:** in use while any of its people is up and at home, working or not.
- **All day:** in use from the first of its people getting up to the last going to bed,
  whether or not anyone is at home.

Periods of use `merge_gap_min` or less apart merge, and the room gets its level's
temperature inside them. Outside them it sits at the unused temperature during the
house's day (first person up to last person in bed) and the night temperature
overnight. An unused room has no periods of use. Which days are the weekend is a
setting, house-wide and per person.

Each room gets two weeks:

- **Valve schedule** (`CompiledHousehold.schedules`): each period starts `preheat_min`
  early, because the TRV running its own copy (the schedule mirror and the Shelly
  fallback) cannot start early by itself. A day that needs more than the TRVZB's six
  transitions loses its shortest warm periods, and a note says which.
- **Live schedule** (`CompiledHousehold.live`): what Radiate follows while it runs.
  With `live_preheat: optimum_start` (the default) each period starts when the room is
  needed, and the core's optimum start decides how early to heat from the learned
  heating rate and arrival lag, so the fixed preheat is not added on top. With
  `live_preheat: fixed` it is the valve schedule. Either way it keeps every period:
  only the valve has the six-transition limit.

Pure: no I/O and no clock. Times are minutes of the day.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from enum import StrEnum

from .schedule import DAYS, MAX_C, MAX_TRANSITIONS, MIN_C, DaySchedule, WeekSchedule, hhmm

# Defaults. Each is a setting; see `Timing` and `AwaySettings`.
PREHEAT_MIN = 30  # valve schedule: periods start this early
MERGE_GAP_MIN = 30  # warm periods this close or closer become one
GETTING_UP_MIN = 30  # after getting up: bedroom and shared rooms count as in use
BEDTIME_MIN = 30  # before bed: bedroom counts as in use
# Home Assistant `not_home` must last this long before a person counts as away: longer
# than a trip to the shops or the school run, shorter than a working day or an evening
# out. See radiate.config.away.
PRESENCE_DELAY_MIN = 60
# Presence not reported again within this long counts as unknown, not away. The
# integration reports every 15 minutes, so an hour is four missed reports.
PRESENCE_STALE_AFTER_MIN = 60
# How far ahead of a known return Radiate may start warming the house. Three hours is
# the core's usual optimum start horizon (decide.PREHEAT_MAX_S).
RETURN_WARMUP_MIN = 180
WEEKEND_DAYS = frozenset({5, 6})  # Saturday and Sunday

# Not settings: guidance and a fixed rule.
DAMP_BELOW_C = 12.0  # below this, walls and window frames can get damp (a note, not a limit)
DAY_TYPES = ("weekdays", "weekend")

Interval = tuple[int, int]  # [start, end) in minutes of the day


class UseLevel(StrEnum):
    IN_USE = "in_use"
    OCCASIONAL = "occasional"
    UNUSED = "unused"


class RoomKind(StrEnum):
    SHARED = "shared"
    BEDROOM = "bedroom"
    OFFICE = "office"
    WHILE_HOME = "while_home"
    ALL_DAY = "all_day"


class LivePreheat(StrEnum):
    OPTIMUM_START = "optimum_start"  # live periods start when needed; the core starts early
    FIXED = "fixed"  # live control follows the valve schedule, preheat included


class EveryoneAway(StrEnum):
    FROST = "frost"  # hold every room at the frost threshold
    UNUSED = "unused"  # keep every room at its unused temperature


@dataclass(frozen=True, slots=True)
class Limit:
    """The allowed range of a numeric setting, for validation and for the API."""

    lo: float
    hi: float
    unit: str
    off: float | None = None  # a value outside lo..hi that turns the setting off


# Ranges. Per-person and per-room overrides use the house-wide range of the same name.
LIMITS: dict[str, Limit] = {
    "timing.preheat_min": Limit(0, 180, "min"),
    "timing.getting_up_min": Limit(0, 180, "min"),
    "timing.bedtime_min": Limit(0, 180, "min"),
    "timing.merge_gap_min": Limit(0, 120, "min"),
    "away.presence_delay_min": Limit(0, 720, "min"),
    # Longer than the integration's 15 minute heartbeat; 0 turns staleness off.
    "away.presence_stale_after_min": Limit(20, 1440, "min", off=0),
    # Six hours bounds how early an unlearned room model can start the boiler.
    "away.return_warmup_min": Limit(0, 360, "min"),
    "temperatures": Limit(MIN_C, MAX_C, "°C"),
}


@dataclass(frozen=True, slots=True)
class Timing:
    """House-wide durations that turn routines into warm periods. Minutes."""

    preheat_min: int = PREHEAT_MIN
    live_preheat: LivePreheat = LivePreheat.OPTIMUM_START
    getting_up_min: int = GETTING_UP_MIN
    bedtime_min: int = BEDTIME_MIN
    merge_gap_min: int = MERGE_GAP_MIN


@dataclass(frozen=True, slots=True)
class AwaySettings:
    """How away and presence behave. Minutes."""

    presence_delay_min: int = PRESENCE_DELAY_MIN
    presence_stale_after_min: int = PRESENCE_STALE_AFTER_MIN  # 0: never stale
    return_warmup_min: int = RETURN_WARMUP_MIN
    everyone_away: EveryoneAway = EveryoneAway.FROST


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
    getting_up_min: int | None = None  # None: the household's
    bedtime_min: int | None = None
    weekend_days: frozenset[int] | None = None  # Monday = 0. None: the household's

    def routine(self, day_type: str) -> Routine:
        return self.weekend if day_type == "weekend" else self.weekdays

    def routine_on(self, weekday: int, house_weekend: frozenset[int]) -> Routine:
        days = house_weekend if self.weekend_days is None else self.weekend_days
        return self.weekend if weekday in days else self.weekdays


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
    night_c: float | None = None  # replaces the night temperature in this room
    unused_c: float | None = None  # replaces the unused temperature in this room
    preheat_min: int | None = None  # replaces the household's preheat in this room

    def use(self, day_type: str) -> UseLevel:
        return self.use_weekend if day_type == "weekend" else self.use_weekdays


@dataclass(frozen=True, slots=True)
class Household:
    people: tuple[Person, ...]
    rooms: tuple[RoomLink, ...]
    temperatures: Temperatures = field(default_factory=Temperatures)
    timing: Timing = field(default_factory=Timing)
    away: AwaySettings = field(default_factory=AwaySettings)
    weekend_days: frozenset[int] = WEEKEND_DAYS

    @property
    def presence_delay_min(self) -> int:
        return self.away.presence_delay_min

    def return_lead_min(self) -> int:
        """How long before an away until ends the person stops counting as away.

        With optimum start the person counts as away until the time they gave, and the
        runtime lets optimum start warm their rooms for it. With a fixed preheat they
        stop counting the preheat early, so the valve schedule is warm on arrival.
        """
        if self.timing.live_preheat is LivePreheat.FIXED:
            return self.timing.preheat_min
        return 0


@dataclass(frozen=True, slots=True)
class DroppedPeriod:
    """A warm period left out of a room's valve schedule to fit the TRVZB's limit."""

    room_id: str
    day_type: str  # "weekdays", "weekend", or day names such as "Wed" or "Mon, Tue"
    days: tuple[int, ...]  # the days it applies to, Monday = 0
    start_min: int  # minutes of the day, as in the valve schedule (preheat included)
    end_min: int
    setpoint_c: float
    text: str  # the note in words, as printed by check-config and `radiate schedules`


@dataclass(frozen=True, slots=True)
class CompiledHousehold:
    schedules: dict[str, WeekSchedule]  # room id to the valve's week (fixed preheat)
    notes: tuple[str, ...] = ()  # warm periods left out of the valve's week, in words
    live: dict[str, WeekSchedule] = field(default_factory=dict)  # what Radiate follows
    dropped: tuple[DroppedPeriod, ...] = ()  # the same as `notes`, one per period


def compile_household(
    household: Household,
    away: frozenset[str] = frozenset(),
    preheat_min: int | Mapping[str, int] | None = None,
) -> CompiledHousehold:
    """The valve and live `WeekSchedule` of every linked room, and notes on anything
    left out of the valve's week.

    `away` holds the ids of people treated as away: their part of every routine is
    dropped. `preheat_min` replaces the rooms' preheat, for every room or per room id;
    by default each room uses its own `preheat_min` or the household's.
    """
    known = {p.id for p in household.people}
    unknown = sorted(away - known)
    if unknown:
        raise ValueError(f"unknown people in away: {', '.join(unknown)}")
    present = tuple(p for p in household.people if p.id not in away)
    schedules: dict[str, WeekSchedule] = {}
    live: dict[str, WeekSchedule] = {}
    dropped_periods: list[DroppedPeriod] = []
    for room in household.rooms:
        preheat = _room_preheat(household, room, preheat_min)
        cache: dict[tuple, tuple[DaySchedule, DaySchedule, list]] = {}
        groups: dict[tuple, list[int]] = {}
        valve_days: list[DaySchedule] = []
        live_days: list[DaySchedule] = []
        for weekday in range(7):
            weekend = weekday in household.weekend_days
            level = room.use_weekend if weekend else room.use_weekdays
            people = tuple(
                (
                    p.id,
                    p.routine_on(weekday, household.weekend_days),
                    _or(p.getting_up_min, household.timing.getting_up_min),
                    _or(p.bedtime_min, household.timing.bedtime_min),
                )
                for p in present
            )
            key = (level, people)
            if key not in cache:
                cache[key] = _compile_day(room, level, people, household, preheat)
            valve, live_day, dropped = cache[key]
            valve_days.append(valve)
            live_days.append(live_day)
            if dropped:
                groups.setdefault((weekend, key), []).append(weekday)
        schedules[room.room_id] = WeekSchedule(tuple(valve_days))
        live[room.room_id] = WeekSchedule(tuple(live_days))
        label = room.name or room.room_id
        for (_, key), days in groups.items():
            when = _days_label(days, household.weekend_days)
            for sp, (a, b) in cache[key][2]:
                text = (
                    f"{label}, {when}: the valve's own schedule leaves out {_deg(sp)} "
                    f"{hhmm(a)} to {hhmm(b)} to fit its limit of {MAX_TRANSITIONS} changes "
                    "a day; Radiate still heats it while running"
                )
                dropped_periods.append(
                    DroppedPeriod(room.room_id, when, tuple(days), a, b, sp, text)
                )
    return CompiledHousehold(
        schedules=schedules,
        notes=tuple(d.text for d in dropped_periods),
        live=live,
        dropped=tuple(dropped_periods),
    )


def round_half(value: float) -> float:
    """Nearest TRVZB step (0.5 °C), inside the TRVZB's range."""
    return max(MIN_C, min(MAX_C, round(value * 2) / 2))


def household_view(household: Household) -> dict:
    """The household with every setting filled in, and the allowed ranges, for the API.

    Per person and per room, `inherited` lists the settings that come from the
    household rather than being set for that person or room.
    """
    t, a, temps = household.timing, household.away, household.temperatures

    def routine(r: Routine) -> dict:
        return {
            "up": hhmm(r.up_min),
            "bed": hhmm(r.bed_min),
            "out": [f"{hhmm(x)}-{hhmm(y)}" for x, y in r.out],
            "work": [f"{hhmm(x)}-{hhmm(y)}" for x, y in r.work],
        }

    people = []
    for p in household.people:
        own = {
            "getting_up_min": p.getting_up_min,
            "bedtime_min": p.bedtime_min,
            "weekend_days": p.weekend_days,
        }
        people.append(
            {
                "id": p.id,
                "name": p.name or p.id.replace("_", " ").capitalize(),
                "weekdays": routine(p.weekdays),
                "weekend": routine(p.weekend),
                "getting_up_min": _or(p.getting_up_min, t.getting_up_min),
                "bedtime_min": _or(p.bedtime_min, t.bedtime_min),
                "weekend_days": _day_names(_or(p.weekend_days, household.weekend_days)),
                "inherited": [k for k, v in own.items() if v is None],
            }
        )
    rooms = []
    for r in household.rooms:
        own = {
            "temperature": r.temperature_c,
            "night_temperature": r.night_c,
            "unused_temperature": r.unused_c,
            "preheat_min": r.preheat_min,
        }
        rooms.append(
            {
                "id": r.room_id,
                "name": r.name or r.room_id,
                "use": {"weekdays": r.use_weekdays.value, "weekend": r.use_weekend.value},
                "kind": r.kind.value,
                "people": list(r.people) if r.people is not None else None,
                # The warm temperature differs by use level, so it is filled in per day type.
                "temperature": {
                    d: round_half(_or(r.temperature_c, temps.level(r.use(d)))) for d in DAY_TYPES
                },
                "night_temperature": round_half(_or(r.night_c, temps.night_c)),
                "unused_temperature": round_half(_or(r.unused_c, temps.unused_c)),
                "preheat_min": _or(r.preheat_min, t.preheat_min),
                "inherited": [k for k, v in own.items() if v is None],
            }
        )
    limits: dict[str, dict] = {}
    for key, lim in LIMITS.items():
        item: dict = {"min": lim.lo, "max": lim.hi, "unit": lim.unit}
        if lim.off is not None:
            item["off"] = lim.off
        if key == "temperatures":
            item["step"] = 0.5
        limits[key] = item
    options = {
        "timing.live_preheat": [v.value for v in LivePreheat],
        "away.everyone_away": [v.value for v in EveryoneAway],
        "weekend_days": list(DAYS),
        "rooms.use": [v.value for v in UseLevel],
        "rooms.kind": [v.value for v in RoomKind],
    }
    return {
        "timing": {
            "preheat_min": t.preheat_min,
            "live_preheat": t.live_preheat.value,
            "getting_up_min": t.getting_up_min,
            "bedtime_min": t.bedtime_min,
            "merge_gap_min": t.merge_gap_min,
        },
        "away": {
            "presence_delay_min": a.presence_delay_min,
            "presence_stale_after_min": a.presence_stale_after_min,
            "return_warmup_min": a.return_warmup_min,
            "everyone_away": a.everyone_away.value,
        },
        "temperatures": {
            "in_use": temps.in_use_c,
            "occasional": temps.occasional_c,
            "unused": temps.unused_c,
            "night": temps.night_c,
        },
        "weekend_days": _day_names(household.weekend_days),
        "people": people,
        "rooms": rooms,
        "limits": limits,
        "options": options,
        "damp_below_c": DAMP_BELOW_C,
    }


# --- one room, one day -----------------------------------------------------------------

# (person id, routine today, getting up minutes, bedtime minutes)
_Today = tuple[str, Routine, int, int]


def _compile_day(
    room: RoomLink,
    level: UseLevel,
    present: tuple[_Today, ...],
    household: Household,
    preheat: int,
) -> tuple[DaySchedule, DaySchedule, list[tuple[float, Interval]]]:
    """The valve's day, the live day, and the warm periods the valve's day leaves out."""
    temps, timing = household.temperatures, household.timing
    fixed = timing.live_preheat is LivePreheat.FIXED
    night = round_half(_or(room.night_c, temps.night_c))
    unused = round_half(_or(room.unused_c, temps.unused_c))
    valve_day: Interval | None = None  # None: nobody at home, unused all day
    live_day: Interval | None = None
    if present:
        first_up = min(r.up_min for _, r, _, _ in present)
        last_bed = max(r.bed_min for _, r, _, _ in present)
        valve_day = (max(0, first_up - preheat), last_bed)
        live_day = valve_day if fixed else (first_up, last_bed)

    warm_c = round_half(_or(room.temperature_c, temps.level(level)))
    if level is UseLevel.UNUSED:
        use: list[Interval] = []
    else:
        linked = [
            (r, up, bed) for pid, r, up, bed in present if room.people is None or pid in room.people
        ]
        use = _in_use(room.kind, linked)
    groups = _merge(use, preheat, timing.merge_gap_min)
    live_warm = [(start if fixed else needed, end) for start, needed, end in groups]

    valve_warm = [(start, end) for start, _, end in groups]
    dropped: list[tuple[float, Interval]] = []
    transitions = _transitions(valve_warm, warm_c, valve_day, night, unused)
    while len(transitions) > MAX_TRANSITIONS and valve_warm:
        # Shortest first; of equal length, the later one.
        shortest = min(valve_warm, key=lambda iv: (iv[1] - iv[0], -iv[0]))
        valve_warm.remove(shortest)
        dropped.append((warm_c, shortest))
        transitions = _transitions(valve_warm, warm_c, valve_day, night, unused)
    live = _transitions(live_warm, warm_c, live_day, night, unused)
    return (
        DaySchedule(tuple(transitions)),
        DaySchedule(tuple(live)),
        sorted(dropped, key=lambda d: d[1]),
    )


def _in_use(kind: RoomKind, routines: list[tuple[Routine, int, int]]) -> list[Interval]:
    use: list[Interval] = []
    if kind is RoomKind.ALL_DAY:
        if routines:
            use.append(
                (min(r.up_min for r, _, _ in routines), max(r.bed_min for r, _, _ in routines))
            )
        return use
    for r, getting_up, bedtime in routines:
        if kind is RoomKind.BEDROOM:
            use.append((r.up_min, min(r.bed_min, r.up_min + getting_up)))
            use.append((max(r.up_min, r.bed_min - bedtime), r.bed_min))
        elif kind is RoomKind.OFFICE:
            use.extend(r.work)
        elif kind is RoomKind.WHILE_HOME:
            use.extend(_subtract((r.up_min, r.bed_min), r.out))
        else:
            use.append((r.up_min, min(r.bed_min, r.up_min + getting_up)))
            use.extend(_subtract((r.up_min, r.bed_min), [*r.out, *r.work]))
    return [iv for iv in use if iv[1] > iv[0]]


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


def _merge(use: list[Interval], preheat: int, gap: int) -> list[tuple[int, int, int]]:
    """Warm periods as (start with the preheat, start when needed, end).

    Periods merge on their preheated starts, so the valve and live schedules have the
    same periods and differ only in when each one starts.
    """
    merged: list[tuple[int, int, int]] = []
    for start, needed, end in sorted((max(0, a - preheat), a, b) for a, b in use):
        if merged and start - merged[-1][2] <= gap:
            s, n, e = merged[-1]
            merged[-1] = (s, min(n, needed), max(e, end))
        else:
            merged.append((start, needed, end))
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


def _room_preheat(
    household: Household, room: RoomLink, override: int | Mapping[str, int] | None
) -> int:
    default = _or(room.preheat_min, household.timing.preheat_min)
    if override is None:
        return default
    if isinstance(override, Mapping):
        return override.get(room.room_id, default)
    return override


def _days_label(days: list[int], weekend: frozenset[int]) -> str:
    chosen = set(days)
    if chosen == set(range(7)) - weekend:
        return "weekdays"
    if chosen == weekend:
        return "weekend"
    return ", ".join(DAYS[d][:3].capitalize() for d in sorted(chosen))


def _day_names(days: frozenset[int]) -> list[str]:
    return [DAYS[d] for d in sorted(days)]


def _or(value, default):
    return default if value is None else value


def _deg(sp: float) -> str:
    return f"{int(sp)}°" if sp == int(sp) else f"{sp:.1f}°"
