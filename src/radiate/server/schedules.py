"""The week each room follows now, for the web UI's week view (`GET /api/v1/schedules`).

Household rooms show the week compiled for the people at home, so someone being away
shows straight away, with the usual week and a sentence saying why it changed.
Hand-written rooms show their schedule from the house file. Words come from
`WeekSchedule.describe`, the same text `radiate schedules` prints.

The runtime does not hold schedules; the driver does. Drivers may offer:

- `schedules() -> dict[room id, (schedule name or None, WeekSchedule)]`: the week the
  driver uses now for each controllable room. The name is None for a household room.
- `wall_weekday() -> int`: the house's local weekday, Monday = 0.

Without `schedules()`, household rooms still show (compiled here) and hand-written rooms
are left out. Names of people are for the UI only: never logged or exported.

`preview_view` gives the same view for a household that is not in use yet, for the
web UI's setup: what `schedules_view` will say once it is saved.
"""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from radiate.config.away import everyone_away
from radiate.config.household import (
    CompiledHousehold,
    EveryoneAway,
    Household,
    RoomLink,
    UseLevel,
    compile_household,
    round_half,
)
from radiate.config.schedule import DAYS, MAX_TRANSITIONS, WeekSchedule
from radiate.core import Mode

from .runtime import Runtime

SOURCE_HOUSEHOLD = "household"
SOURCE_HAND_WRITTEN = "hand_written"


def schedules_view(rt: Runtime) -> dict:
    # Everyone away in auto: the core holds frost, whatever the weeks say.
    frost = rt.everyone_away and rt.effective_mode() is not rt.mode
    return _view(rt, rt.household, rt.away, _driver_weeks(rt), frost)


def preview_view(
    rt: Runtime, household: Household, own: dict[str, tuple[str, WeekSchedule]]
) -> dict:
    """The week view as it will be once `household` replaces the one in use.

    Compiled for the people away now who are in it. `own` holds the schedule each room
    has of its own in the house file, as (name, week): rooms the household leaves out
    show it.
    """
    people = {p.id for p in household.people}
    away = rt.away & people
    linked = {r.room_id for r in household.rooms}
    weeks = {rid: named for rid, named in own.items() if rid not in linked}
    frost = (
        rt.mode is Mode.AUTO
        and rt.returning is None
        and everyone_away(tuple(p.id for p in household.people), away)
        and household.away.everyone_away is EveryoneAway.FROST
    )
    return _view(rt, household, away, weeks, frost)


def _view(
    rt: Runtime,
    hh: Household | None,
    away: frozenset[str],
    driver_weeks: dict[str, tuple[str | None, WeekSchedule]],
    frost: bool,
) -> dict:
    now_compiled = compile_household(hh, away=away) if hh else None
    usual = compile_household(hh) if hh and away else now_compiled
    links = {r.room_id: r for r in hh.rooms} if hh else {}
    names = _names(hh)
    rooms = []
    for rc in rt.cfg.rooms:
        if not rc.controllable:
            continue
        link = links.get(rc.id)
        named = driver_weeks.get(rc.id)
        if link is not None and now_compiled is not None and usual is not None:
            # The live week: what Radiate follows, warm-by times without the valve's preheat.
            week = named[1] if named else now_compiled.live[rc.id]
            item = _room(rc.id, rc.name, SOURCE_HOUSEHOLD, None, week)
            item["notes"] = _notes(now_compiled, rc.id)
            people = _depends_on(hh, link)
            item["people"] = [{"id": pid, "name": names[pid]} for pid in people]
            item["away"] = _away(rc.name, week, usual.live[rc.id], people, away, hh, names)
        elif named is not None:
            item = _room(rc.id, rc.name, SOURCE_HAND_WRITTEN, named[0], named[1])
        else:
            continue
        rooms.append(item)
    return {
        "now": {"weekday": _weekday(rt), "minute": rt.driver.wall_minutes()},
        "levels": _levels(hh),
        "frost": frost,
        "rooms": rooms,
    }


def _room(room_id: str, name: str, source: str, schedule: str | None, week: WeekSchedule) -> dict:
    return {
        "id": room_id,
        "name": name,
        "source": source,
        "schedule": schedule,  # the house file's schedule name, for hand-written rooms
        "days": [
            {
                "day": DAYS[i],
                "transitions": [{"minute": m, "setpoint": sp} for m, sp in day.transitions],
                "text": day.describe(),
            }
            for i, day in enumerate(week.days)
        ],
        "summary": [{"days": label, "text": text} for label, text in week.describe()],
        "notes": [],
        "people": [],
        "away": None,
    }


def _driver_weeks(rt: Runtime) -> dict[str, tuple[str | None, WeekSchedule]]:
    get = getattr(rt.driver, "schedules", None)
    return dict(get()) if callable(get) else {}


def _weekday(rt: Runtime) -> int:
    get = getattr(rt.driver, "wall_weekday", None)
    if callable(get):
        return int(get())
    return datetime.fromtimestamp(rt._wall(), ZoneInfo(rt.timezone)).weekday()


def _names(hh: Household | None) -> dict[str, str]:
    if hh is None:
        return {}
    return {p.id: p.name or p.id.replace("_", " ").capitalize() for p in hh.people}


def _levels(hh: Household | None) -> dict | None:
    if hh is None:
        return None
    t = hh.temperatures
    return {
        "in_use": round_half(t.in_use_c),
        "occasional": round_half(t.occasional_c),
        "unused": round_half(t.unused_c),
        "night": round_half(t.night_c),
    }


def _depends_on(hh: Household, link: RoomLink) -> list[str]:
    """The people whose routines decide when the room is warm, in household order."""
    if link.use_weekdays is UseLevel.UNUSED and link.use_weekend is UseLevel.UNUSED:
        return []
    return [p.id for p in hh.people if link.people is None or p.id in link.people]


def _notes(compiled: CompiledHousehold, room_id: str) -> list[str]:
    """Warm periods this room's valve schedule leaves out to fit the TRV, in words.

    Radiate still heats them while it runs; only the valve's fallback copy lacks them.
    """
    out = []
    for d in compiled.dropped:
        if d.room_id != room_id:
            continue
        when = d.day_type[:1].upper() + d.day_type[1:]
        out.append(
            f"{when}: the valve's own schedule leaves out {_deg(d.setpoint_c)} "
            f"{_hhmm(d.start_min)} to {_hhmm(d.end_min)} to fit its limit of "
            f"{MAX_TRANSITIONS} changes a day. Radiate still heats it while running."
        )
    return out


def _hhmm(minute: int) -> str:
    return f"{minute // 60:02d}:{minute % 60:02d}"


def _away(
    room: str,
    week: WeekSchedule,
    usual: WeekSchedule,
    people: list[str],
    away: frozenset[str],
    hh: Household,
    names: dict[str, str],
) -> dict | None:
    """Why the room's week differs from usual, or None when it does not."""
    if not away or week == usual:
        return None
    # Its own people, or, when only the house's day changed, everyone away.
    who = [pid for pid in people if pid in away] or [p.id for p in hh.people if p.id in away]
    listed = _and([names[pid] for pid in who])
    verb = "is" if len(who) == 1 else "are"
    setpoints = {sp for day in week.days for _, sp in day.transitions}
    if len(setpoints) == 1:
        text = f"{room} stays at {_deg(setpoints.pop())} while {listed} {verb} away."
    elif _heat(week) < _heat(usual):
        text = f"{room} is warm for less of the week while {listed} {verb} away."
    else:
        text = f"{room} follows a different week while {listed} {verb} away."
    return {
        "people": [{"id": pid, "name": names[pid]} for pid in who],
        "text": text,
        "usual": [{"days": label, "text": t} for label, t in usual.describe()],
    }


def _heat(week: WeekSchedule) -> float:
    """Degree-minutes over the week: a rough measure of how warm it is kept."""
    total = 0.0
    for day in week.days:
        ends = [m for m, _ in day.transitions[1:]] + [1440]
        total += sum(sp * (end - m) for (m, sp), end in zip(day.transitions, ends, strict=True))
    return total


def _and(items: list[str]) -> str:
    return items[0] if len(items) < 2 else f"{', '.join(items[:-1])} and {items[-1]}"


def _deg(sp: float) -> str:
    return f"{sp:g}°"
