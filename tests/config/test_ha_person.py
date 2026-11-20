"""A person's link to a Home Assistant `person` entity: `household.people.<id>.ha_person`."""

import copy
from pathlib import Path

import pytest
import yaml

from radiate.config import parse_site
from radiate.config.household import compile_household, household_section, household_view
from radiate.config.site import ConfigError, parse_household

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}


@pytest.fixture
def site():
    return parse_site(yaml.safe_load(EXAMPLE.read_text()), env=ENV)


def section(site, **links) -> dict:
    raw = copy.deepcopy(household_section(site.household))
    for pid, value in links.items():
        raw["people"][pid]["ha_person"] = value
    return raw


def problems(site, raw) -> dict[str, str]:
    with pytest.raises(ConfigError) as err:
        parse_household(raw, site)
    return dict(p.split(": ", 1) for p in err.value.problems)


def test_not_linked_by_default(site):
    assert all(p.ha_person is None for p in site.household.people)
    assert all(p["ha_person"] is None for p in household_view(site.household)["people"])
    assert all("ha_person" not in p for p in household_section(site.household)["people"].values())


def test_a_link_round_trips_and_changes_no_schedule(site):
    raw = section(site, early_riser="person.alex")
    hh = parse_household(raw, site)
    linked = {p.id: p.ha_person for p in hh.people}
    assert linked == {"early_riser": "person.alex", "home_worker": None}
    assert household_section(hh)["people"]["early_riser"]["ha_person"] == "person.alex"
    assert parse_household(household_section(hh), site) == hh
    view = {p["id"]: p["ha_person"] for p in household_view(hh)["people"]}
    assert view == linked
    # Linking is only who to listen to: the weeks are the same.
    assert compile_household(hh).schedules == compile_household(site.household).schedules


@pytest.mark.parametrize("value", ["", "  ", None])
def test_empty_means_not_linked(site, value):
    hh = parse_household(section(site, early_riser=value), site)
    assert hh.people[0].ha_person is None


def test_spaces_around_the_entity_id_are_ignored(site):
    hh = parse_household(section(site, early_riser=" person.alex "), site)
    assert hh.people[0].ha_person == "person.alex"


@pytest.mark.parametrize(
    "value",
    ["alex", "device_tracker.alex", "person.", "person.Alex", "person._alex", "person.a-b", 7],
)
def test_only_person_entity_ids(site, value):
    found = problems(site, section(site, early_riser=value))
    path = "household.people.early_riser.ha_person"
    if isinstance(value, int):
        assert found == {path: "expected str, got int"}
    else:
        assert found == {path: "must be a person entity ID, such as person.sam"}


def test_one_entity_links_one_person(site):
    raw = section(site, early_riser="person.alex", home_worker="person.alex")
    assert problems(site, raw) == {
        "household.people.home_worker.ha_person": "person.alex is already linked to Early riser"
    }
