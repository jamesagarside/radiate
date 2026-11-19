"""Weekly heating schedules.

The format matches the TRVZB on-device weekly schedule (Zigbee2MQTT
`weekly_schedule_<day>`), so a room's schedule can be mirrored into its valve
unchanged: up to 6 transitions a day, each `HH:MM/temperature`, temperatures 4 to
35 °C in 0.5 K steps, the first transition at 00:00.

Pure: callers supply the local weekday (Monday = 0) and minute of day.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

DAYS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
DAY_ALIASES = {
    "mon": (0,),
    "tue": (1,),
    "wed": (2,),
    "thu": (3,),
    "fri": (4,),
    "sat": (5,),
    "sun": (6,),
    **{d: (i,) for i, d in enumerate(DAYS)},
    "weekdays": (0, 1, 2, 3, 4),
    "weekend": (5, 6),
    "daily": (0, 1, 2, 3, 4, 5, 6),
}
# Most specific wins: a single day beats a group, a group beats "daily".
_SPECIFICITY = {"daily": 0, "weekdays": 1, "weekend": 1}
MAX_TRANSITIONS = 6
MIN_C, MAX_C = 4.0, 35.0
_TRANSITION = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)/(\d+(?:\.\d+)?)$")


class ScheduleError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class DaySchedule:
    transitions: tuple[tuple[int, float], ...]  # (minute of day, setpoint), sorted, first at 0

    def at(self, minute: int) -> float:
        value = self.transitions[0][1]
        for start, sp in self.transitions:
            if start <= minute:
                value = sp
            else:
                break
        return value

    def trvzb(self) -> str:
        return " ".join(f"{m // 60:02d}:{m % 60:02d}/{_fmt(sp)}" for m, sp in self.transitions)


@dataclass(frozen=True, slots=True)
class WeekSchedule:
    days: tuple[DaySchedule, ...]  # 7 entries, Monday first

    def setpoint_at(self, weekday: int, minute: int) -> float:
        return self.days[weekday % 7].at(minute)

    def next_change(self, weekday: int, minute: int) -> tuple[float, float]:
        """Next setpoint that differs from the current one, and seconds until it applies.

        Wall-clock arithmetic: across a DST change the answer is out by an hour.
        """
        current = self.setpoint_at(weekday, minute)
        for day_offset in range(8):
            day = self.days[(weekday + day_offset) % 7]
            for start, sp in day.transitions:
                ahead = day_offset * 1440 + start - minute
                if ahead <= 0 or sp == current:
                    continue
                return sp, ahead * 60.0
        return current, 7 * 86400.0

    def shifted(self, offset_k: float) -> WeekSchedule:
        """The same week with every setpoint moved by `offset_k`, in TRVZB steps.

        For a TRV that compares its setpoint with its own reading rather than the
        room's (an internal-sensor room), the mirrored schedule must be in that frame.
        """
        if offset_k == 0:
            return self

        def move(sp: float) -> float:
            return max(MIN_C, min(MAX_C, round((sp + offset_k) * 2) / 2))

        return WeekSchedule(
            tuple(DaySchedule(tuple((m, move(sp)) for m, sp in d.transitions)) for d in self.days)
        )

    def trvzb_payload(self) -> dict[str, str]:
        """Zigbee2MQTT `/set` payload that writes the whole week to a TRVZB."""
        return {f"weekly_schedule_{name}": self.days[i].trvzb() for i, name in enumerate(DAYS)}


def _fmt(sp: float) -> str:
    # The converter accepts "20" or "20.5", not "20.0".
    return str(int(sp)) if sp == int(sp) else f"{sp:.1f}"


def parse_day(text: str) -> DaySchedule:
    """Parse `HH:MM/temp HH:MM/temp ...`.

    If the day does not start at 00:00, the last setpoint of the day is carried over
    midnight, as a person reading the schedule would expect.
    """
    if not isinstance(text, str) or not text.strip():
        raise ScheduleError("empty schedule")
    items: list[tuple[int, float]] = []
    for token in text.split():
        m = _TRANSITION.match(token)
        if not m:
            raise ScheduleError(f"{token!r} is not HH:MM/temperature")
        minute = int(m.group(1)) * 60 + int(m.group(2))
        sp = float(m.group(3))
        if not MIN_C <= sp <= MAX_C:
            raise ScheduleError(f"{token!r}: temperature must be {MIN_C:g} to {MAX_C:g} °C")
        if sp * 2 != int(sp * 2):
            raise ScheduleError(f"{token!r}: temperature must be in 0.5 °C steps")
        items.append((minute, sp))
    items.sort()
    if len({m for m, _ in items}) != len(items):
        raise ScheduleError("two transitions at the same time")
    if items[0][0] != 0:
        items.insert(0, (0, items[-1][1]))
    # Drop transitions that do not change the setpoint.
    merged = [items[0]]
    for m, sp in items[1:]:
        if sp != merged[-1][1]:
            merged.append((m, sp))
    if len(merged) > MAX_TRANSITIONS:
        raise ScheduleError(
            f"{len(merged)} transitions; the TRVZB holds at most {MAX_TRANSITIONS} a day"
        )
    return DaySchedule(tuple(merged))


def parse_week(spec: dict | str) -> WeekSchedule:
    """Parse a week from day keys (`mon`, `weekdays`, `weekend`, `daily`, ...)."""
    if isinstance(spec, str):
        spec = {"daily": spec}
    if not isinstance(spec, dict) or not spec:
        raise ScheduleError("expected a mapping of days to transitions")
    chosen: list[tuple[int, DaySchedule] | None] = [None] * 7
    for key, text in spec.items():
        days = DAY_ALIASES.get(str(key).lower())
        if days is None:
            raise ScheduleError(f"unknown day {key!r}")
        try:
            day = parse_day(text)
        except ScheduleError as err:
            raise ScheduleError(f"{key}: {err}") from None
        rank = _SPECIFICITY.get(str(key).lower(), 2)
        for d in days:
            prev = chosen[d]
            if prev is not None and prev[0] == rank:
                raise ScheduleError(f"{DAYS[d]} is set twice")
            if prev is None or rank > prev[0]:
                chosen[d] = (rank, day)
    missing = [DAYS[i] for i, c in enumerate(chosen) if c is None]
    if missing:
        raise ScheduleError(f"no schedule for {', '.join(missing)}")
    return WeekSchedule(tuple(c[1] for c in chosen if c is not None))
