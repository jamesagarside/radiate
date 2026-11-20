"""Linking people to Home Assistant `person` entities from the web UI.

The integration reports the `person` entities it can see (`POST /api/v1/ha/persons`),
the server keeps the latest list in memory and offers it in `GET /api/v1/household`,
and each person's link (`ha_person`) is in `GET /api/v1/house` for the integration.
"""

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
import yaml
from aiohttp.test_utils import TestClient, TestServer

from radiate.config import parse_site
from radiate.drivers.live import LiveDriver
from radiate.server.app import create_app
from radiate.server.bridge import DemoSession, RequestError, handle
from radiate.server.runtime import Runtime
from radiate.server.setup import HouseholdSetup

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
TZ = ZoneInfo("Europe/London")
WED_0600 = datetime(2026, 11, 18, 6, 0, tzinfo=TZ).timestamp()
H = {"Authorization": "Bearer secret"}
PERSONS = [
    {"entity_id": "person.sam", "name": "Sam"},
    {"entity_id": "person.alex", "name": "alex"},
]


async def _publish(topic, payload):
    return True


def make(link: dict[str, str] | None = None) -> Runtime:
    data = yaml.safe_load(EXAMPLE.read_text())
    for pid, entity_id in (link or {}).items():
        data["household"]["people"][pid]["ha_person"] = entity_id
    site = parse_site(data, env=ENV)
    wall = lambda: WED_0600  # noqa: E731
    drv = LiveDriver(site, _publish, clock=lambda: 1000.0, wall=wall)
    rt = Runtime(site.house, drv, household=site.household, timezone=site.timezone, wall=wall)
    rt.setup = HouseholdSetup(site)
    return rt


def test_house_lists_each_persons_link():
    rt = make({"home_worker": "person.sam"})
    assert rt.house()["people"] == [
        {"id": "early_riser", "name": "Early riser", "ha_person": None},
        {"id": "home_worker", "name": "Home worker", "ha_person": "person.sam"},
    ]
    people = rt.house()["household"]["people"]
    assert [p["ha_person"] for p in people] == [None, "person.sam"]


def test_household_offers_nothing_until_home_assistant_reports():
    rt = make()
    assert handle(rt, "GET", "household")["ha_persons"] is None


def test_reported_persons_are_kept_sorted_by_name():
    rt = make()
    assert handle(rt, "POST", "ha/persons", {"persons": PERSONS}) == {"ok": True, "count": 2}
    assert rt.ha_persons_view() == {
        "persons": [PERSONS[1], PERSONS[0]],
        "reported_at": "2026-11-18T06:00+00:00",
    }
    assert handle(rt, "GET", "household")["ha_persons"] == rt.ha_persons_view()
    # Each report replaces the last; an empty list means Home Assistant has nobody.
    handle(rt, "POST", "ha/persons", {"persons": []})
    assert rt.ha_persons_view()["persons"] == []


def test_a_missing_name_shows_the_entity_id_and_repeats_are_merged():
    rt = make()
    body = {
        "persons": [
            {"entity_id": "person.jo"},
            {"entity_id": "person.kim", "name": "  "},
            {"entity_id": "person.jo", "name": "Jo"},
        ]
    }
    assert handle(rt, "POST", "ha/persons", body)["count"] == 2
    assert rt.ha_persons == [
        {"entity_id": "person.jo", "name": "Jo"},
        {"entity_id": "person.kim", "name": "person.kim"},
    ]


@pytest.mark.parametrize(
    ("body", "message"),
    [
        ([], "expected an object"),
        ({}, "persons must be a list"),
        ({"persons": {"entity_id": "person.sam"}}, "persons must be a list"),
        ({"persons": ["person.sam"]}, "persons[0] must be an object"),
        ({"persons": [{"entity_id": "light.sam"}]}, "persons[0].entity_id must be a person"),
        ({"persons": [{"name": "Sam"}]}, "persons[0].entity_id must be a person"),
        ({"persons": [{"entity_id": "person.sam", "name": 3}]}, "persons[0].name must be"),
        ({"persons": [{"entity_id": f"person.p{i}"} for i in range(201)]}, "at most 200"),
    ],
)
def test_bad_reports_are_rejected_and_change_nothing(body, message):
    rt = make()
    with pytest.raises(RequestError) as err:
        handle(rt, "POST", "ha/persons", body)
    assert err.value.status == 400 and message in err.value.text
    assert rt.ha_persons_view() is None


def test_saving_the_household_keeps_the_report_and_takes_the_link():
    rt = make()
    handle(rt, "POST", "ha/persons", {"persons": PERSONS})
    view = handle(rt, "GET", "household")
    section = view["household"]
    section["people"]["early_riser"]["ha_person"] = "person.alex"
    saved = handle(rt, "PUT", "household", {"household": section})
    assert saved["ha_persons"]["persons"] == [PERSONS[1], PERSONS[0]]
    assert saved["household"]["people"]["early_riser"]["ha_person"] == "person.alex"
    assert rt.house()["people"][0]["ha_person"] == "person.alex"


def test_preview_puts_a_bad_link_on_its_answer():
    rt = make()
    section = handle(rt, "GET", "household")["household"]
    section["people"]["early_riser"]["ha_person"] = "sam"
    out = handle(rt, "POST", "household/preview", {"household": section})
    assert out["errors"] == [
        {
            "path": "household.people.early_riser.ha_person",
            "message": "must be a person entity ID, such as person.sam",
        }
    ]


async def test_route_needs_the_token_and_works_without_a_setup():
    rt = make()
    rt.setup = None  # the report is kept even where the wizard is not offered
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        r = await c.post("/api/v1/ha/persons", json={"persons": PERSONS})
        assert r.status == 401
        r = await c.post("/api/v1/ha/persons", json={"persons": PERSONS}, headers=H)
        assert r.status == 200 and (await r.json())["count"] == 2
        r = await c.post("/api/v1/ha/persons", json={"persons": "x"}, headers=H)
        assert r.status == 400
    assert len(rt.ha_persons) == 2


def test_demo_accepts_a_report():
    demo = DemoSession()
    out = json.loads(demo.request("POST", "ha/persons", json.dumps({"persons": PERSONS})))
    assert out == {"status": 200, "body": {"ok": True, "count": 2}}
    view = json.loads(demo.request("GET", "household"))["body"]
    assert [p["entity_id"] for p in view["ha_persons"]["persons"]] == ["person.alex", "person.sam"]
