"""Away: which people Radiate treats as not at home right now.

Two sources say where a person is:

- **Away until**: the person says they are away until a local date and time, through
  the web UI, the API or a Home Assistant service. No Home Assistant needed.
- **Presence**: Home Assistant reports the person's `person` entity as `home` or
  `not_home`, with the time it last changed.

The rules, per person:

1. **Away until** counts at once, and stops counting the household preheat (30 min)
   before the given time, so the person's rooms are warm when they arrive. It clears
   itself at the given time.
2. **Presence** `not_home` counts once it has lasted the presence delay, 60 minutes by
   default (`household.presence_delay_min`), so a trip to the shops or the school run
   does not cool anyone's rooms. `home` never counts as away.
3. **Away until wins over `home`** reported before it was set, so a person can set it
   before they leave. Arriving home after setting it (`home` with a later change time)
   ends it early: they came back sooner than planned.

**Everyone away** is every person in the household counting as away. The runtime then
holds the house at frost protection, unless the heating mode says otherwise.

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

AWAY_MAX_DAYS = 60  # furthest "away until" accepted, so a mistyped year cannot hold frost
HOME = "home"
NOT_HOME = "not_home"
PRESENCE_STATES = (HOME, NOT_HOME)
RETURN_LEAD_S = PREHEAT_MIN * 60.0


@dataclass(frozen=True, slots=True)
class Presence:
    """What Radiate knows about where one person is. Times are wall-clock seconds."""

    away_until: float | None = None  # set by the person: away until then
    set_at: float | None = None  # when away_until was set
    state: str | None = None  # from Home Assistant: "home" or "not_home"
    since: float | None = None  # when `state` last changed

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


def status(
    p: Presence,
    now: float,
    delay_s: float = PRESENCE_DELAY_MIN * 60.0,
    lead_s: float = RETURN_LEAD_S,
) -> AwayStatus:
    """Whether one person counts as away at `now`, and why."""
    if p.away_until is not None and now < p.away_until - lead_s and not arrived_since_set(p):
        return AwayStatus(True, "away_until")
    if p.state == NOT_HOME and p.since is not None and now - p.since >= delay_s:
        return AwayStatus(True, "presence")
    return AwayStatus(False)


def effective_away(
    people: Iterable[str],
    presence: Mapping[str, Presence],
    now: float,
    delay_s: float = PRESENCE_DELAY_MIN * 60.0,
    lead_s: float = RETURN_LEAD_S,
) -> frozenset[str]:
    """The ids of the people in `people` who count as away at `now`."""
    return frozenset(
        pid
        for pid in people
        if pid in presence and status(presence[pid], now, delay_s, lead_s).away
    )


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
