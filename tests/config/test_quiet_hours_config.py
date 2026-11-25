"""`house.quiet_hours` in the house file and the Settings registry (spec 5.10)."""

from pathlib import Path

import pytest
import yaml

from radiate.config import parse_site
from radiate.config.settings import setting_for
from radiate.config.site import ConfigError, parse_quiet_hours

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}


@pytest.mark.parametrize(
    ("raw", "window"),
    [
        ("22:30-06:00", (1350, 360)),
        ("01:00-05:00", (60, 300)),
        ("23:00-24:00", (1380, 0)),
        ("00:00-06:30", (0, 390)),
        (" 22:30 - 06:00 ", (1350, 360)),
        (None, None),
        ("", None),
    ],
)
def test_valid_windows(raw, window):
    assert parse_quiet_hours(raw) == (window, None)


@pytest.mark.parametrize(
    ("raw", "problem"),
    [
        ("06:00-06:00", "start and end must differ"),
        ("00:00-24:00", "start and end must differ"),
        ("22:30", "is not HH:MM-HH:MM"),
        ("24:00-06:00", "is not HH:MM-HH:MM"),
        ("22:60-06:00", "is not HH:MM-HH:MM"),
        ("10pm-6am", "is not HH:MM-HH:MM"),
        (1350, "expected HH:MM-HH:MM"),
    ],
)
def test_invalid_windows(raw, problem):
    window, why = parse_quiet_hours(raw)
    assert window is None and problem in why


def site(**house):
    data = yaml.safe_load(EXAMPLE.read_text())
    data["house"].update(house)
    return parse_site(data, env=ENV)


def test_the_house_file_sets_it_and_it_is_off_by_default():
    assert site().house.quiet_hours is None
    assert site(quiet_hours="22:30-06:00").house.quiet_hours == (1350, 360)


def test_a_bad_window_is_reported_with_its_path():
    with pytest.raises(ConfigError) as err:
        site(quiet_hours="06:00-06:00")
    assert "house.quiet_hours: start and end must differ" in err.value.problems


def test_registered_for_the_settings_view_and_applied_live():
    found = setting_for("house.quiet_hours")
    assert found is not None
    section, setting = found
    assert section.id == "house"
    assert setting.kind == "text" and setting.optional and not setting.restart
    assert setting.default is None
