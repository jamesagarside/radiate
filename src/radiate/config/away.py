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

Fail warm (ADR-0005, spec 7): doubtful presence counts as home. Rules 5 to 8 never
touch away until.

5. **Old evidence.** `not_home` counts only while the person's trackers have reported
   within `presence_evidence_max_age_min`, 240 by default. The integration's 15 minute
   heartbeat repeats the state, so a dead phone stays `not_home` with fresh reports for
   ever: what counts is `evidence_at`, the newest report from the trackers themselves.
   Without it (an older radiate-ha), `since` stands in, so `not_home` counts for at
   most that long after it began.
6. **Weak source.** A router or Bluetooth tracker says `not_home` when a phone at home
   sleeps or dies, and so may a phone at 5 % battery or less. Such `not_home` waits for
   `presence_weak_source_delay_min` (240) instead of the presence delay.
7. **I'm home.** A person who says they are home (`home_at`) counts as home until their
   presence changes again. A heartbeat repeating the same state does not undo it.
8. **Home evidence.** A sign someone is in (an override, a store boost, the fire switch,
   a shower) after the person's presence last changed sets their presence-based away
   aside until it changes again.

**Everyone away** is every person in the household counting as away. The runtime then
holds the house at frost protection only when everyone has an away until
(`frost_allowed`) and the household asks for frost. Otherwise every household room
sits at its unused temperature, never below the damp floor while the setback is
inferred from presence: presence alone never holds frost.

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
    # From the integration, each optional: the newest report from the person's trackers
    # themselves (any state), the tracker type ("gps", "router", "bluetooth") and the
    # phone's battery in per cent.
    evidence_at: float | None = None
    source_type: str | None = None
    battery: float | None = None
    home_evidence_at: float | None = None  # latest sign someone is in, from the runtime
    home_at: float | None = None  # when the person said they are home

    @property
    def empty(self) -> bool:
        return self.away_until is None and self.state is None and self.home_at is None


@dataclass(frozen=True, slots=True)
class AwayStatus:
    away: bool
    reason: str | None = None  # "away_until" or "presence" when away
    # Why presence that would count as away was set aside: "evidence_old",
    # "said_home" or "home_evidence". None otherwise.
    uncertain: str | None = None


EVIDENCE_OLD = "evidence_old"
SAID_HOME = "said_home"
HOME_EVIDENCE = "home_evidence"
GPS = "gps"
LOW_BATTERY_PCT = 5.0  # at or below this a phone may die before it reports leaving


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


def evidence_seen(p: Presence) -> float | None:
    """When the trackers last reported, as far as Radiate knows: `evidence_at`, or the
    state change time if that is later (a change is a report) or `evidence_at` is
    unknown."""
    times = [t for t in (p.evidence_at, p.since) if t is not None]
    return max(times) if times else None


def evidence_old(p: Presence, now: float, max_age_s: float | None) -> bool:
    """`not_home` without a recent report from its trackers: `evidence_at` older than
    `max_age_s`, or, without `evidence_at`, `since` older than it. None or 0: off."""
    if not max_age_s or p.state != NOT_HOME:
        return False
    seen = evidence_seen(p)
    return seen is None or now - seen > max_age_s


def weak_source(p: Presence) -> bool:
    """A tracker that can say `not_home` for a phone at home: not GPS, or a phone at
    5 % battery or less. Unknown counts as neither (an older integration)."""
    not_gps = p.source_type is not None and p.source_type != GPS
    flat = p.battery is not None and p.battery <= LOW_BATTERY_PCT
    return not_gps or flat


def _after_change(at: float | None, p: Presence) -> bool:
    return at is not None and p.since is not None and at >= p.since


def home_evidence(p: Presence) -> bool:
    """Someone was seen to be in after this person's presence last changed."""
    return _after_change(p.home_evidence_at, p)


def status(
    p: Presence,
    now: float,
    delay_s: float = PRESENCE_DELAY_MIN * 60.0,
    lead_s: float = RETURN_LEAD_S,
    stale_s: float | None = None,
    max_age_s: float | None = None,
    weak_delay_s: float | None = None,
) -> AwayStatus:
    """Whether one person counts as away at `now`, and why.

    Presence counts as away only once it has lasted the delay (the weak source delay
    for a weak source, if longer), while it is not stale, its evidence is not old, the
    person has not said they are home and nobody has been seen in since it changed.
    Away until is unchanged by all of these.
    """
    if weak_delay_s is not None and weak_source(p):
        delay_s = max(delay_s, weak_delay_s)
    if p.away_until is not None and now < p.away_until - lead_s and not arrived_since_set(p):
        return AwayStatus(True, "away_until")
    if (
        p.state == NOT_HOME
        and p.since is not None
        and now - p.since >= delay_s
        and not stale(p, now, stale_s)
    ):
        if _after_change(p.home_at, p):
            return AwayStatus(False, uncertain=SAID_HOME)
        if home_evidence(p):
            return AwayStatus(False, uncertain=HOME_EVIDENCE)
        if evidence_old(p, now, max_age_s):
            return AwayStatus(False, uncertain=EVIDENCE_OLD)
        return AwayStatus(True, "presence")
    return AwayStatus(False)


def effective_away(
    people: Iterable[str],
    presence: Mapping[str, Presence],
    now: float,
    delay_s: float = PRESENCE_DELAY_MIN * 60.0,
    lead_s: float = RETURN_LEAD_S,
    stale_s: float | None = None,
    max_age_s: float | None = None,
    weak_delay_s: float | None = None,
) -> frozenset[str]:
    """The ids of the people in `people` who count as away at `now`."""
    return frozenset(
        pid
        for pid in people
        if pid in presence
        and status(presence[pid], now, delay_s, lead_s, stale_s, max_age_s, weak_delay_s).away
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


def frost_allowed(
    people: Iterable[str],
    presence: Mapping[str, Presence],
    now: float,
    lead_s: float = RETURN_LEAD_S,
) -> bool:
    """True only when every person is away by an away until: what they said, not what
    a tracker reports. Presence alone never holds the house at frost."""
    ids = list(people)
    return bool(ids) and all(
        pid in presence and status(presence[pid], now, lead_s=lead_s).reason == "away_until"
        for pid in ids
    )


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
