"""Oil and runtime accounting, and the daily balance score (spec 5.6, 9)."""

import pytest

from radiate.core.accounting import Ledger, balance_score

MIN = 60.0


def feed(ledger, minutes, day=0, start=0, relay=lambda m: False, calling=lambda m: set(), **kw):
    closed = []
    for m in range(start, start + minutes):
        out = ledger.update(
            m * MIN,
            day,
            relay_on=relay(m),
            firing=relay(m),
            calling=calling(m),
            below={},
            **kw,
        )
        if out is not None:
            closed.append(out)
    return closed


def test_burner_hours_starts_and_burn_lengths():
    ledger = Ledger()
    # Burns of 30 and 90 minutes.
    on = lambda m: 10 <= m < 40 or 100 <= m < 190  # noqa: E731
    feed(ledger, 240, relay=on)
    s = ledger.summary(nozzle_lph=None)
    assert s["starts"] == 2
    assert s["burner_hours"] == pytest.approx(2.0)
    assert s["burns"]["count"] == 2
    assert s["burns"]["mean_min"] == pytest.approx(60.0)
    assert s["burns"]["max_min"] == pytest.approx(90.0)
    assert s["burns"]["histogram"] == {
        "under_10": 0,
        "10_to_20": 0,
        "20_to_30": 0,
        "30_to_60": 1,
        "60_to_120": 1,
        "over_120": 0,
    }
    assert s["max_starts_in_hour"] == 1
    assert s["litres"] is None and s["kwh"] is None
    assert s["basis"] == "relay"


def test_litres_and_kwh_with_a_nozzle_rating():
    ledger = Ledger()
    feed(ledger, 121, relay=lambda m: m < 120)  # on for exactly 2 hours
    s = ledger.summary(nozzle_lph=2.0)
    assert s["burner_hours"] == pytest.approx(2.0)
    assert s["litres"] == pytest.approx(4.0)
    assert s["kwh"] == pytest.approx(4.0 * 10.35 * 0.85, abs=0.1)


def test_day_rolls_over_and_returns_the_closed_day():
    ledger = Ledger()
    feed(ledger, 60, day=5, relay=lambda m: 10 <= m < 30)
    closed = feed(ledger, 10, day=6, start=60)
    assert len(closed) == 1
    assert closed[0]["day"] == 5 and closed[0]["starts"] == 1
    assert ledger.summary(None)["day"] == 6 and ledger.summary(None)["starts"] == 0
    assert ledger.history[-1]["day"] == 5


def test_a_burn_across_midnight_counts_hours_on_each_day():
    ledger = Ledger()
    feed(ledger, 60, day=0, relay=lambda m: m >= 30)
    closed = feed(ledger, 60, day=1, start=60, relay=lambda m: m < 90)
    assert closed[0]["burner_hours"] == pytest.approx(0.5, abs=0.02)
    s = ledger.summary(None)
    assert s["burner_hours"] == pytest.approx(0.5, abs=0.02)
    assert s["burns"]["count"] == 1  # the burn ended on day 1


def test_long_gaps_are_not_counted_as_burning():
    ledger = Ledger()
    ledger.update(0.0, 0, relay_on=True, firing=True, calling=set(), below={})
    ledger.update(3 * 3600.0, 0, relay_on=True, firing=True, calling=set(), below={})
    assert ledger.summary(None)["burner_hours"] < 0.1


def test_comfort_minutes_below():
    ledger = Ledger()
    for m in range(30):
        ledger.update(
            m * MIN, 0, relay_on=False, firing=False, calling=set(), below={"bed": m < 20}
        )
    assert ledger.summary(None)["comfort_minutes_below"] == {"bed": pytest.approx(19.0)}


def test_arrival_spread_and_balance_score():
    ledger = Ledger()
    # Two rooms call at burn start; bed arrives after 20 min, dining after 50.
    calling = lambda m: {r for r, t in (("bed", 20), ("dining", 50)) if m < t}  # noqa: E731
    feed(ledger, 80, relay=lambda m: m < 60, calling=calling)
    s = ledger.summary(None)
    assert s["balance"]["starts_measured"] == 1
    assert s["balance"]["arrival_spread_min"] == pytest.approx(30.0)
    assert s["balance"]["score"] == pytest.approx(75.0)


def test_single_room_burns_are_not_scored():
    ledger = Ledger()
    feed(ledger, 60, relay=lambda m: m < 40, calling=lambda m: {"bed"} if m < 30 else set())
    b = ledger.summary(None)["balance"]
    assert b["starts_measured"] == 0 and b["score"] is None


def test_room_still_calling_when_the_burn_ends_arrives_then():
    ledger = Ledger()
    calling = lambda m: {"bed", "dining"} if m < 10 else {"dining"}  # noqa: E731
    feed(ledger, 60, relay=lambda m: m < 40, calling=calling)
    assert ledger.summary(None)["balance"]["arrival_spread_min"] == pytest.approx(30.0)


def test_burn_where_no_room_arrives_is_not_scored():
    ledger = Ledger()
    feed(ledger, 60, relay=lambda m: m < 40, calling=lambda m: {"bed", "dining"})
    assert ledger.summary(None)["balance"]["starts_measured"] == 0


def test_balance_score_formula():
    assert balance_score([]) is None
    assert balance_score([0.0]) == 100.0
    assert balance_score([60.0, 30.0, 90.0]) == 50.0
    assert balance_score([200.0]) == 0.0


def test_day_from_minute_of_day_when_no_label():
    ledger = Ledger()
    ledger.update(0.0, None, relay_on=False, firing=False, calling=set(), below={}, minute=1430)
    closed = ledger.update(
        60 * MIN, None, relay_on=False, firing=False, calling=set(), below={}, minute=10
    )
    assert closed is not None and ledger.summary(None)["day"] == closed["day"] + 1


def ticks(ledger, minutes, day, *, start, offset=0.0, relay=lambda m: False, calling=None):
    """One tick a minute from minute `start`, with the local minute of day."""
    out = None
    for m in range(start, start + minutes):
        closed = ledger.update(
            offset + m * MIN,
            day,
            relay_on=relay(m),
            firing=relay(m),
            calling=(calling or (lambda m: set()))(m),
            below={},
            minute=m % 1440,
        )
        out = closed or out
    return out


def burn_at_13(m):
    return 780 <= m < 840


def two_rooms_at_13(m):
    # Two rooms call at the start of the 13:00 burn; the second arrives 20 min later.
    return {r for r, t in (("bed", 800), ("dining", 820)) if 780 <= m < t}


def test_a_whole_day_is_scored():
    ledger = Ledger()
    ticks(ledger, 1440, 0, start=0, relay=burn_at_13, calling=two_rooms_at_13)
    closed = ticks(ledger, 1, 1, start=1440)
    assert closed["partial"] is False
    assert closed["balance"]["score"] == pytest.approx(100 * (1 - 20 / 120), abs=0.1)
    assert ledger.summary(None)["partial"] is False  # day 1 started at midnight


def test_a_day_started_after_midnight_is_partial_and_not_scored():
    # Radiate's first day began at 12:00 with untrained models: a balance score would
    # describe the cold start, not the house.
    ledger = Ledger()
    ticks(ledger, 720, 0, start=720, relay=burn_at_13, calling=two_rooms_at_13)
    closed = ticks(ledger, 1, 1, start=1440)
    assert closed["partial"] is True
    assert closed["balance"]["starts_measured"] == 1
    assert closed["balance"]["score"] is None
    assert closed["burner_hours"] == pytest.approx(1.0)  # what was seen still counts


def test_a_start_a_few_minutes_after_midnight_still_counts_as_whole():
    ledger = Ledger()
    ticks(ledger, 1430, 0, start=10)
    assert ticks(ledger, 1, 1, start=1440)["partial"] is False


def test_a_long_gap_makes_the_day_partial():
    ledger = Ledger()
    ticks(ledger, 600, 0, start=0)  # 00:00 to 10:00
    ticks(ledger, 720, 0, start=720, offset=0.0)  # nothing seen from 10:00 to 12:00
    assert ledger.summary(None)["partial"] is True


def test_a_short_gap_does_not():
    ledger = Ledger()
    ticks(ledger, 600, 0, start=0)
    ticks(ledger, 830, 0, start=610)  # 10 min unseen
    assert ledger.summary(None)["partial"] is False


def test_a_gap_across_midnight_marks_both_days():
    ledger = Ledger()
    ticks(ledger, 1380, 0, start=0)  # to 23:00
    closed = ticks(ledger, 60, 1, start=1440 + 120)  # nothing seen until 02:00
    assert closed["day"] == 0 and closed["partial"] is True
    assert ledger.summary(None)["partial"] is True


def test_minute_unknown_assumes_the_whole_day_was_seen():
    ledger = Ledger()
    feed(ledger, 60, day=0, start=720)
    assert ledger.summary(None)["partial"] is False
