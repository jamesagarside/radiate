"""Outdoor temperature source (spec 3 and 7): which reading the core gets."""

from __future__ import annotations

import math

import pytest

from radiate.core.outdoor import (
    DEFAULT_STALE_AFTER_S,
    STALE_ALERT,
    OutdoorReading,
    OutdoorSource,
    choose_outdoor,
    plausible,
    reading_age,
)

NOW = 1_800_000_000.0
Z, HA, BOTH = OutdoorSource.ZIGBEE, OutdoorSource.HOME_ASSISTANT, OutdoorSource.BOTH


def ha(t=8.0, age_s=600.0, source="weather.forecast_home"):
    return OutdoorReading(t, NOW - age_s, source)


@pytest.mark.parametrize(
    ("value", "ok"),
    [
        (-40.0, True),
        (50.0, True),
        (12, True),
        (-40.1, False),
        (50.1, False),
        (math.nan, False),
        (math.inf, False),
        (True, False),
        ("8", False),
        (None, False),
    ],
)
def test_plausible(value, ok):
    assert plausible(value) is ok


def test_reading_age_is_never_negative():
    assert reading_age(OutdoorReading(5.0, NOW + 60), NOW) == 0.0
    assert reading_age(OutdoorReading(5.0, NOW - 90), NOW) == 90.0


def test_zigbee_passes_through_unchanged():
    # Today's behaviour: the driver's reading, whatever Home Assistant says.
    c = choose_outdoor(Z, 3.5, 120.0, ha(), NOW)
    assert (c.temperature_c, c.source, c.age_s, c.stale, c.alert) == (
        3.5,
        "zigbee",
        120.0,
        False,
        None,
    )
    c = choose_outdoor(Z, None, None, ha(), NOW)
    assert (c.temperature_c, c.source, c.stale, c.alert) == (None, None, False, None)


def test_home_assistant_uses_a_fresh_reading_and_ignores_zigbee():
    c = choose_outdoor(HA, 3.5, 60.0, ha(8.0, age_s=600), NOW)
    assert (c.temperature_c, c.source, c.age_s, c.stale) == (8.0, "home_assistant", 600.0, False)


def test_home_assistant_stale_reading_counts_as_missing():
    c = choose_outdoor(HA, None, None, ha(age_s=DEFAULT_STALE_AFTER_S + 1), NOW)
    assert c.temperature_c is None and c.source is None and c.stale
    assert c.alert.code == STALE_ALERT
    assert "not updated for 3 h" in c.alert.message
    assert "5 °C assumed" in c.alert.message
    # Exactly at the limit still counts.
    assert choose_outdoor(HA, None, None, ha(age_s=DEFAULT_STALE_AFTER_S), NOW).temperature_c == 8.0


def test_stale_limit_is_configurable():
    assert choose_outdoor(HA, None, None, ha(age_s=1900), NOW, stale_after_s=1800).stale
    c = choose_outdoor(HA, None, None, ha(age_s=1900), NOW, stale_after_s=3600)
    assert not c.stale


def test_home_assistant_never_reported():
    c = choose_outdoor(HA, None, None, None, NOW)
    assert c.stale and "No outdoor temperature from Home Assistant yet" in c.alert.message


def test_implausible_home_assistant_reading_counts_as_missing():
    c = choose_outdoor(HA, None, None, ha(t=60.0), NOW)
    assert c.temperature_c is None and c.stale and "implausible" in c.alert.message


def test_both_prefers_zigbee_then_falls_back_to_home_assistant():
    c = choose_outdoor(BOTH, 3.5, 60.0, ha(8.0), NOW)
    assert (c.temperature_c, c.source, c.stale) == (3.5, "zigbee", False)
    c = choose_outdoor(BOTH, None, None, ha(8.0), NOW)
    assert (c.temperature_c, c.source, c.stale, c.alert) == (8.0, "home_assistant", False, None)
    # An implausible Zigbee reading is skipped too.
    assert choose_outdoor(BOTH, 99.0, 60.0, ha(8.0), NOW).source == "home_assistant"


def test_both_with_nothing_fresh_alerts():
    c = choose_outdoor(BOTH, None, None, ha(age_s=4 * 3600), NOW)
    assert c.temperature_c is None and c.stale
    assert "Zigbee sensor or Home Assistant" in c.alert.message


def test_local_label_names_a_simulated_reading():
    c = choose_outdoor(BOTH, 2.0, 0.0, None, NOW, local_label="simulated")
    assert c.source == "simulated"


def test_short_staleness_in_minutes():
    c = choose_outdoor(HA, None, None, ha(age_s=2400), NOW, stale_after_s=1800)
    assert "not updated for 40 min" in c.alert.message
