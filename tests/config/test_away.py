"""Who counts as away: away until, Home Assistant presence and the presence delay."""

from datetime import datetime
from zoneinfo import ZoneInfo

import pytest

from radiate.config import ConfigError, parse_site
from radiate.config.away import (
    HOME,
    NOT_HOME,
    RETURN_LEAD_S,
    AwayStatus,
    Presence,
    Return,
    effective_away,
    everyone_away,
    local_iso,
    next_return,
    parse_local,
    stale,
    status,
    tidy,
)
from radiate.config.household import PRESENCE_DELAY_MIN

H = 3600.0
NOW = 1_800_000_000.0  # any wall-clock second
DELAY = PRESENCE_DELAY_MIN * 60.0


def test_default_delay_is_an_hour_and_return_lead_is_the_preheat():
    assert PRESENCE_DELAY_MIN == 60
    assert RETURN_LEAD_S == 30 * 60


def test_nothing_known_is_home():
    assert status(Presence(), NOW) == AwayStatus(False)


def test_away_until_counts_at_once_and_ends_a_preheat_early():
    p = Presence(away_until=NOW + 5 * H, set_at=NOW)
    assert status(p, NOW) == AwayStatus(True, "away_until")
    assert status(p, NOW + 5 * H - RETURN_LEAD_S - 1).away
    # From 30 minutes before the return, the person's rooms warm up for them.
    assert not status(p, NOW + 5 * H - RETURN_LEAD_S).away


def test_presence_counts_after_the_delay():
    p = Presence(state=NOT_HOME, since=NOW)
    assert not status(p, NOW + DELAY - 1).away
    assert status(p, NOW + DELAY) == AwayStatus(True, "presence")
    assert not status(p, NOW + 10, delay_s=20).away
    assert status(p, NOW, delay_s=0).away
    assert not status(Presence(state=HOME, since=NOW - 9 * H), NOW).away


def test_away_until_wins_over_home_reported_before_it_was_set():
    # Set before leaving: Home Assistant still says home.
    p = Presence(away_until=NOW + 24 * H, set_at=NOW, state=HOME, since=NOW - 2 * H)
    assert status(p, NOW + H) == AwayStatus(True, "away_until")


def test_arriving_home_after_setting_away_ends_it():
    p = Presence(away_until=NOW + 24 * H, set_at=NOW, state=NOT_HOME, since=NOW + H)
    assert status(p, NOW + 3 * H).reason == "away_until"
    back = Presence(away_until=NOW + 24 * H, set_at=NOW, state=HOME, since=NOW + 6 * H)
    assert not status(back, NOW + 6 * H).away
    assert tidy(back, NOW + 6 * H) == Presence(state=HOME, since=NOW + 6 * H)


def test_presence_takes_over_when_away_until_ends():
    # Still travelling after the date they gave: presence keeps them away.
    p = Presence(away_until=NOW + 2 * H, set_at=NOW, state=NOT_HOME, since=NOW - H)
    assert status(p, NOW + 2 * H - RETURN_LEAD_S).reason == "presence"


def test_stale_presence_counts_as_unknown():
    p = Presence(state=NOT_HOME, since=NOW - 5 * H, reported_at=NOW)
    limit = 60 * 60.0
    assert status(p, NOW + limit, stale_s=limit).away
    assert not stale(p, NOW + limit, limit)
    assert stale(p, NOW + limit + 1, limit)
    assert status(p, NOW + limit + 1, stale_s=limit) == AwayStatus(False)
    # Off (None or 0), or never reported: the change time stands in for the report.
    assert status(p, NOW + 9 * H, stale_s=0).away
    assert status(p, NOW + 9 * H).away
    assert stale(Presence(state=NOT_HOME, since=NOW), NOW + limit + 1, limit)
    # An away until is the person's own word: presence going stale does not touch it.
    both = Presence(away_until=NOW + 9 * H, set_at=NOW, state=NOT_HOME, since=NOW)
    assert status(both, NOW + 2 * H, stale_s=limit).reason == "away_until"


def test_next_return_is_the_earliest_away_until():
    presence = {
        "a": Presence(away_until=NOW + 9 * H, set_at=NOW),
        "b": Presence(away_until=NOW + 4 * H, set_at=NOW),
        "c": Presence(away_until=NOW + 4 * H, set_at=NOW),
        "d": Presence(state=NOT_HOME, since=NOW - 9 * H),  # presence gives no return time
    }
    assert next_return(("a", "b", "c", "d"), presence, NOW, lead_s=0) == Return(
        NOW + 4 * H, frozenset({"b", "c"})
    )
    # With a lead, the return is when they stop counting as away.
    assert next_return(("a",), presence, NOW, lead_s=1800).at == NOW + 9 * H - 1800
    assert next_return(("d",), presence, NOW) is None
    # Once it has started counting down to the return, it is no longer away until.
    assert next_return(("b",), presence, NOW + 4 * H, lead_s=0) is None


def test_tidy_clears_ended_away_until():
    p = Presence(away_until=NOW + H, set_at=NOW)
    assert tidy(p, NOW + H - 1) is p
    assert tidy(p, NOW + H).empty


def test_effective_away_and_everyone():
    people = ("a", "b")
    presence = {
        "a": Presence(away_until=NOW + 9 * H, set_at=NOW),
        "b": Presence(state=NOT_HOME, since=NOW - 30 * 60),
        "x": Presence(away_until=NOW + 9 * H, set_at=NOW),  # not in the household
    }
    away = effective_away(people, presence, NOW)
    assert away == {"a"}
    assert not everyone_away(people, away)
    later = effective_away(people, presence, NOW + 30 * 60)
    assert later == {"a", "b"}
    assert everyone_away(people, later)
    assert not everyone_away((), frozenset())


def test_parse_local_and_back():
    tz = "Europe/London"
    winter = parse_local("2026-11-24T18:00", tz)
    assert winter == datetime(2026, 11, 24, 18, tzinfo=ZoneInfo(tz)).timestamp()
    assert local_iso(winter, tz) == "2026-11-24T18:00+00:00"
    assert parse_local("2026-11-24", tz) == parse_local("2026-11-24T00:00", tz)
    assert parse_local("2026-07-01T09:30+01:00", "UTC") == parse_local("2026-07-01T08:30", "UTC")
    assert local_iso(parse_local("2026-07-01T09:30", tz), tz) == "2026-07-01T09:30+01:00"
    with pytest.raises(ValueError):
        parse_local("Tuesday", tz)


def _house(**over) -> dict:
    household = {
        "people": {"a": {"weekdays": {"up": "07:00", "bed": "23:00"}}},
        "rooms": {"bedroom": {"use": "in_use", "kind": "bedroom", "people": ["a"]}},
        **over,
    }
    rooms = [{"id": "bedroom", "trv": "trv_a", "sensor": "t_a"}]
    return {"mqtt": {"host": "broker"}, "rooms": rooms, "household": household}


def test_presence_delay_setting():
    assert parse_site(_house()).household.away.presence_delay_min == 60
    site = parse_site(_house(away={"presence_delay_min": 15}))
    assert site.household.away.presence_delay_min == 15
    with pytest.raises(ConfigError) as exc:
        parse_site(_house(away={"presence_delay_min": 1000}))
    assert (
        "household.away.presence_delay_min: must be whole minutes, 0 to 720" in exc.value.problems
    )


def test_presence_delay_moved_into_away():
    with pytest.raises(ConfigError) as exc:
        parse_site(_house(presence_delay_min=15))
    assert exc.value.problems == [
        "household.presence_delay_min: moved: set it as household.away.presence_delay_min"
    ]
