"""Fail warm presence (ADR-0005): doubtful presence counts as home, never frost on it alone."""

from radiate.config.away import (
    HOME,
    NOT_HOME,
    AwayStatus,
    Presence,
    effective_away,
    evidence_old,
    frost_allowed,
    status,
    weak_source,
)
from radiate.config.household import (
    PRESENCE_EVIDENCE_MAX_AGE_MIN,
    PRESENCE_WEAK_SOURCE_DELAY_MIN,
    AwaySettings,
)

H = 3600.0
MIN = 60.0
NOW = 1_800_000_000.0
DELAY = 60 * MIN
MAX_AGE = 240 * MIN
WEAK = 240 * MIN


def test_defaults_are_four_hours():
    assert PRESENCE_EVIDENCE_MAX_AGE_MIN == 240 and PRESENCE_WEAK_SOURCE_DELAY_MIN == 240
    a = AwaySettings()
    assert (a.presence_evidence_max_age_min, a.presence_weak_source_delay_min) == (240, 240)


def test_old_evidence_measures_the_trackers_not_the_report():
    # Reported a moment ago, but the trackers themselves last reported 13 hours back.
    p = Presence(state=NOT_HOME, since=NOW - 13 * H, reported_at=NOW, evidence_at=NOW - 13 * H)
    assert evidence_old(p, NOW, MAX_AGE)
    fresh = Presence(state=NOT_HOME, since=NOW - 13 * H, reported_at=NOW, evidence_at=NOW - MIN)
    assert not evidence_old(fresh, NOW, MAX_AGE)


def test_without_evidence_at_the_state_change_time_stands_in():
    p = Presence(state=NOT_HOME, since=NOW, reported_at=NOW + 5 * H)
    assert not evidence_old(p, NOW + MAX_AGE, MAX_AGE)
    assert evidence_old(p, NOW + MAX_AGE + 1, MAX_AGE)


def test_a_state_change_newer_than_evidence_at_counts_as_a_report():
    p = Presence(state=NOT_HOME, since=NOW, evidence_at=NOW - 9 * H)
    assert not evidence_old(p, NOW + 10 * MIN, MAX_AGE)


def test_home_and_unknown_never_have_old_evidence():
    assert not evidence_old(Presence(state=HOME, since=NOW - 9 * H), NOW, MAX_AGE)
    assert not evidence_old(Presence(), NOW, MAX_AGE)
    old = Presence(state=NOT_HOME, since=NOW - 9 * H)
    assert not evidence_old(old, NOW, None)
    assert not evidence_old(old, NOW, 0)


def test_the_incident_not_home_with_a_dead_phone_counts_as_home():
    left = NOW  # left in the morning; the phone died; HA kept not_home and its time
    p = Presence(state=NOT_HOME, since=left, evidence_at=left, source_type="gps")
    assert status(p, left + DELAY, DELAY, max_age_s=MAX_AGE) == AwayStatus(True, "presence")
    # The integration keeps reporting, so the presence is never stale...
    later = left + MAX_AGE + MIN
    p = Presence(state=NOT_HOME, since=left, evidence_at=left, reported_at=later)
    st = status(p, later, DELAY, stale_s=60 * MIN, max_age_s=MAX_AGE)
    # ...but the trackers have been quiet for over four hours: unknown, counted as home.
    assert st == AwayStatus(False, None, "evidence_old")
    assert not status(p, left + 13 * H, DELAY, stale_s=60 * MIN, max_age_s=MAX_AGE).away


def test_fresh_gps_evidence_keeps_not_home_away():
    p = Presence(state=NOT_HOME, since=NOW - 9 * H, evidence_at=NOW - 10 * MIN, source_type="gps")
    assert status(p, NOW, DELAY, max_age_s=MAX_AGE, weak_delay_s=WEAK).reason == "presence"


def test_weak_sources_wait_longer():
    assert weak_source(Presence(source_type="router"))
    assert weak_source(Presence(source_type="bluetooth_le"))
    assert weak_source(Presence(source_type="gps", battery=5))
    assert not weak_source(Presence(source_type="gps", battery=40))
    assert not weak_source(Presence())  # unknown: an older integration
    # A router tracker overnight: a phone asleep at home looks not_home, and fresh.
    p = Presence(state=NOT_HOME, since=NOW, evidence_at=NOW + 3 * H, source_type="router")
    assert not status(p, NOW + 3 * H, DELAY, max_age_s=MAX_AGE, weak_delay_s=WEAK).away
    p = Presence(state=NOT_HOME, since=NOW, evidence_at=NOW + 4 * H, source_type="router")
    assert status(p, NOW + 4 * H, DELAY, max_age_s=MAX_AGE, weak_delay_s=WEAK).away
    # The weak source delay never shortens a longer presence delay.
    assert not status(p, NOW + 4 * H, 5 * H, weak_delay_s=WEAK).away


def test_saying_home_beats_not_home_from_before_it():
    p = Presence(state=NOT_HOME, since=NOW, evidence_at=NOW + 2 * H, home_at=NOW + MIN)
    assert status(p, NOW + 2 * H, DELAY, max_age_s=MAX_AGE) == AwayStatus(False, None, "said_home")
    later = Presence(state=NOT_HOME, since=NOW, evidence_at=NOW + 2 * H, home_at=NOW - 1)
    assert status(later, NOW + 2 * H, DELAY, max_age_s=MAX_AGE).reason == "presence"


def test_home_evidence_since_the_change_sets_presence_aside():
    p = Presence(state=NOT_HOME, since=NOW, evidence_at=NOW + 2 * H, home_evidence_at=NOW + MIN)
    st = status(p, NOW + 2 * H, DELAY, max_age_s=MAX_AGE)
    assert st == AwayStatus(False, None, "home_evidence")
    # Evidence from before the person last left doesn't count.
    old = Presence(state=NOT_HOME, since=NOW, evidence_at=NOW + 2 * H, home_evidence_at=NOW - 1)
    assert status(old, NOW + 2 * H, DELAY, max_age_s=MAX_AGE).reason == "presence"


def test_away_until_is_untouched_by_the_new_rules():
    p = Presence(
        away_until=NOW + 24 * H,
        set_at=NOW - H,
        state=NOT_HOME,
        since=NOW - 9 * H,
        evidence_at=NOW - 9 * H,
        source_type="router",
        home_evidence_at=NOW,
    )
    st = status(p, NOW, DELAY, max_age_s=MAX_AGE, weak_delay_s=WEAK)
    assert st == AwayStatus(True, "away_until")


def test_effective_away_takes_the_new_limits():
    people = ("a",)
    presence = {"a": Presence(state=NOT_HOME, since=NOW - 5 * H)}
    assert effective_away(people, presence, NOW, DELAY) == {"a"}
    assert effective_away(people, presence, NOW, DELAY, max_age_s=MAX_AGE) == frozenset()


def test_frost_only_when_everyone_has_an_away_until():
    trip = Presence(away_until=NOW + 24 * H, set_at=NOW)
    out = Presence(state=NOT_HOME, since=NOW - 3 * H, evidence_at=NOW)
    assert frost_allowed(("a", "b"), {"a": trip, "b": trip}, NOW)
    assert not frost_allowed(("a", "b"), {"a": trip, "b": out}, NOW)
    assert not frost_allowed(("a",), {"a": out}, NOW)
    assert not frost_allowed(("a", "b"), {"a": trip}, NOW)
    assert not frost_allowed((), {}, NOW)
    # Within the return lead the away until no longer counts.
    assert not frost_allowed(("a",), {"a": trip}, NOW + 24 * H - 1, lead_s=30 * MIN)
