"""Away: which people Radiate treats as not at home right now.

Two sources say where a person is:

- **Away until**: the person says they are away until a local date and time, through
  the web UI, the API or a Home Assistant service. No Home Assistant needed.
- **Presence**: Home Assistant reports the person's `person` entity as `home` or
  `not_home`, with the time it last changed.

The rules, per person:

1. **Away until** counts at once, until the return lead before the given time, and
   clears itself at the given time. With optimum start (the default) the lead is 0 and
   the runtime warms the person's rooms for the return (see `next_return`). With a
   fixed preheat the lead is the preheat, so the valve schedule is warm on arrival.
2. **Presence** `not_home` counts once it has lasted the presence delay, 60 minutes by
   default (`household.away.presence_delay_min`), so a trip to the shops or the school
   run does not cool anyone's rooms. `home` never counts as away.
3. **Stale presence counts as unknown.** The integration reports presence again every
   15 minutes. Presence not reported within `presence_stale_after_min` (60 by default)
   is ignored, so a `not_home` left behind when Home Assistant stops reporting cannot
   hold anyone away for ever.
4. **Away until wins over `home`** reported before it was set, so a person can set it
   before they leave. Arriving home after setting it (`home` with a later change time)
   ends it early: they came back sooner than planned.

**Everyone away** is every person in the household counting as away. The runtime then
holds the house at frost protection (or the unused temperature, if the household says
so), unless the heating mode says otherwise.

Times are wall-clock seconds (`time.time()`), passed in. Away is about calendar times
people give and the change times Home Assistant reports, so it cannot use the
monotonic clock. A clock change only moves when someone counts as away; it never
touches a boiler guard. Pure: no I/O and no clock of its own.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, replace
from datetime import datetime
from zoneinfo import ZoneInfo

from .household import PREHEAT_MIN, PRESENCE_DELAY_MIN

# A sanity limit, not a preference: the furthest "away until" accepted, so a mistyped
# year cannot hold the house at frost for months.
AWAY_MAX_DAYS = 60
HOME = "home"
NOT_HOME = "not_home"
PRESENCE_STATES = (HOME, NOT_HOME)
RETURN_LEAD_S = PREHEAT_MIN * 60.0  # the lead with a fixed preheat, by default


@dataclass(frozen=True, slots=True)
class Presence:
    """What Radiate knows about where one person is. Times are wall-clock seconds."""

    away_until: float | None = None  # set by the person: away until then
    set_at: float | None = None  # when away_until was set
    state: str | None = None  # from Home Assistant: "home" or "not_home"
    since: float | None = None  # when `state` last changed
    reported_at: float | None = None  # when `state` was last reported. None: at `since`

    @property
    def empty(self) -> bool:
        return self.away_until is None and self.state is None


@dataclass(frozen=True, slots=True)
class AwayStatus:
    away: bool
    reason: str | None = None  # "away_until" or "presence" when away


def arrived_since_set(p: Presence) -> bool:
    """Home Assistant saw the person arrive home after they set away until."""
    return (
        p.away_until is not None
        and p.state == HOME
        and p.since is not None
        and p.set_at is not None
        and p.since > p.set_at
    )


def stale(p: Presence, now: float, stale_s: float | None) -> bool:
    """Presence not reported within `stale_s`. None or 0: presence never goes stale."""
    if not stale_s or p.state is None:
        return False
    seen = p.reported_at if p.reported_at is not None else p.since
    return seen is None or now - seen > stale_s


def status(
    p: Presence,
    now: float,
    delay_s: float = PRESENCE_DELAY_MIN * 60.0,
    lead_s: float = RETURN_LEAD_S,
    stale_s: float | None = None,
) -> AwayStatus:
    """Whether one person counts as away at `now`, and why."""
    if p.away_until is not None and now < p.away_until - lead_s and not arrived_since_set(p):
        return AwayStatus(True, "away_until")
    if (
        p.state == NOT_HOME
        and p.since is not None
        and now - p.since >= delay_s
        and not stale(p, now, stale_s)
    ):
        return AwayStatus(True, "presence")
    return AwayStatus(False)


def effective_away(
    people: Iterable[str],
    presence: Mapping[str, Presence],
    now: float,
    delay_s: float = PRESENCE_DELAY_MIN * 60.0,
    lead_s: float = RETURN_LEAD_S,
    stale_s: float | None = None,
) -> frozenset[str]:
    """The ids of the people in `people` who count as away at `now`."""
    return frozenset(
        pid
        for pid in people
        if pid in presence and status(presence[pid], now, delay_s, lead_s, stale_s).away
    )


@dataclass(frozen=True, slots=True)
class Return:
    """The next time someone away stops counting as away, as far as anyone has said."""

    at: float  # wall-clock seconds
    people: frozenset[str]  # who stops counting as away then


def next_return(
    people: Iterable[str],
    presence: Mapping[str, Presence],
    now: float,
    lead_s: float = RETURN_LEAD_S,
) -> Return | None:
    """The earliest return given by an away until that is counting now, if any.

    Presence alone gives no return time. A person whose presence still says not home
    at that time counts as away again then; the return is what they said, so Radiate
    warms up for it all the same.
    """
    due: dict[float, set[str]] = {}
    for pid in people:
        p = presence.get(pid)
        if p is None or p.away_until is None:
            continue
        if status(p, now, lead_s=lead_s).reason != "away_until":
            continue
        due.setdefault(p.away_until - lead_s, set()).add(pid)
    if not due:
        return None
    at = min(due)
    return Return(at=at, people=frozenset(due[at]))


def everyone_away(people: Iterable[str], away: frozenset[str]) -> bool:
    ids = set(people)
    return bool(ids) and ids <= away


def tidy(p: Presence, now: float) -> Presence:
    """Drop an away until that has ended, or that arriving home cut short."""
    if p.away_until is not None and (now >= p.away_until or arrived_since_set(p)):
        return replace(p, away_until=None, set_at=None)
    return p


def parse_local(text: str, timezone: str) -> float:
    """Wall-clock seconds for an ISO 8601 date or date and time.

    Without an offset the time is local to the house. A date on its own means the
    start of that day. Raises ValueError for anything else.
    """
    when = datetime.fromisoformat(text.strip())
    if when.tzinfo is None:
        when = when.replace(tzinfo=ZoneInfo(timezone))
    return when.timestamp()


def local_iso(wall: float, timezone: str) -> str:
    """ISO 8601 local time with its offset, to the minute: 2026-11-24T18:00+00:00."""
    return datetime.fromtimestamp(wall, ZoneInfo(timezone)).isoformat(timespec="minutes")
