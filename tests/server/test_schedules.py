"""The week view's API: each room's week as used now, in minutes and in words."""

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
import yaml
from aiohttp.test_utils import TestClient, TestServer

from radiate.config import parse_site
from radiate.drivers.live import LiveDriver
from radiate.server.app import create_app
from radiate.server.bridge import handle, run_sync
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.schedules import schedules_view
from radiate.sim.reference import house_config

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
TZ = ZoneInfo("Europe/London")
WED_0600 = datetime(2026, 11, 18, 6, 0, tzinfo=TZ).timestamp()
FRI_1800 = datetime(2026, 11, 20, 18, 0, tzinfo=TZ).timestamp()
H = {"Authorization": "Bearer secret"}


async def _publish(topic, payload):
    return True


def site_data(**household) -> dict:
    """The household example, with the lounge on a hand-written schedule."""
    data = yaml.safe_load(EXAMPLE.read_text())
    del data["household"]["rooms"]["lounge"]
    data["household"].update(household)
    data["schedules"] = {"lounge": "00:00/16 18:00/20"}
    next(r for r in data["rooms"] if r["id"] == "lounge")["schedule"] = "lounge"
    del data["shelly"]
    return data


def make(data: dict | None = None) -> Runtime:
    site = parse_site(data or site_data(), env=ENV)
    wall = lambda: WED_0600  # noqa: E731
    drv = LiveDriver(site, _publish, clock=lambda: 1000.0, wall=wall)
    return Runtime(site.house, drv, household=site.household, timezone=site.timezone, wall=wall)


def rooms(view: dict) -> dict[str, dict]:
    return {r["id"]: r for r in view["rooms"]}


def test_household_rooms_in_minutes_and_words():
    view = schedules_view(make())
    assert view["now"] == {"weekday": 2, "minute": 360}  # Wednesday 06:00
    assert view["levels"] == {"in_use": 19, "occasional": 16, "unused": 14, "night": 14}
    assert view["frost"] is False
    by_id = rooms(view)
    assert "stairs" not in by_id  # passive: no schedule
    bedroom = by_id["bedroom_1"]
    assert bedroom["source"] == "household" and bedroom["schedule"] is None
    assert [d["day"] for d in bedroom["days"]][:2] == ["monday", "tuesday"]
    assert bedroom["days"][0]["transitions"] == [
        {"minute": 0, "setpoint": 14},
        {"minute": 360, "setpoint": 19},
        {"minute": 510, "setpoint": 14},
        {"minute": 1290, "setpoint": 19},
        {"minute": 1350, "setpoint": 14},
    ]
    assert bedroom["days"][0]["text"] == "19° 06:00 to 08:30 and 21:30 to 22:30, otherwise 14°"
    assert bedroom["summary"] == [
        {"days": "Mon to Fri", "text": "19° 06:00 to 08:30 and 21:30 to 22:30, otherwise 14°"},
        {"days": "Sat and Sun", "text": "19° 08:00 to 09:00 and 21:30 to 22:30, otherwise 14°"},
    ]
    assert bedroom["people"] == [
        {"id": "early_riser", "name": "Early riser"},
        {"id": "home_worker", "name": "Home worker"},
    ]
    assert bedroom["notes"] == [] and bedroom["away"] is None
    assert by_id["bedroom_3"]["people"] == [{"id": "home_worker", "name": "Home worker"}]
    assert by_id["bedroom_2"]["people"] == []  # unused all week: depends on nobody


def test_hand_written_rooms_keep_their_schedule():
    lounge = rooms(schedules_view(make()))["lounge"]
    assert lounge["source"] == "hand_written" and lounge["schedule"] == "lounge"
    assert lounge["summary"] == [
        {"days": "Mon to Sun", "text": "20° 18:00 to 24:00, otherwise 16°"}
    ]
    assert lounge["people"] == [] and lounge["away"] is None


def test_someone_away_changes_the_week_and_says_why():
    rt = make()
    rt.set_away("home_worker", FRI_1800)
    by_id = rooms(schedules_view(rt))
    office = by_id["bedroom_3"]
    assert office["summary"] == [{"days": "Mon to Sun", "text": "14° all day"}]
    assert office["away"] == {
        "people": [{"id": "home_worker", "name": "Home worker"}],
        "text": "Bedroom 3 stays at 14° while Home worker is away.",
        "usual": [
            {"days": "Mon to Fri", "text": "19° 07:30 to 18:00, otherwise 14°"},
            {"days": "Sat and Sun", "text": "14° all day"},
        ],
    }
    bedroom = by_id["bedroom_1"]
    assert bedroom["days"][2]["text"] == "19° 06:00 to 07:00 and 21:30 to 22:30, otherwise 14°"
    assert bedroom["away"]["text"] == (
        "Bedroom 1 is warm for less of the week while Home worker is away."
    )
    assert by_id["bedroom_2"]["away"] is None  # unused: the same either way
    assert by_id["lounge"]["away"] is None  # hand-written: away never changes it

    rt.clear_away("home_worker")
    assert rooms(schedules_view(rt))["bedroom_3"]["away"] is None


def test_everyone_away_holds_frost():
    rt = make()
    rt.set_away("early_riser", FRI_1800)
    rt.set_away("home_worker", FRI_1800)
    view = schedules_view(rt)
    assert view["frost"] is True
    kitchen = rooms(view)["kitchen"]
    assert kitchen["away"]["text"] == (
        "Kitchen stays at 14° while Early riser and Home worker are away."
    )


def test_dropped_warm_periods_are_noted_per_room():
    data = site_data()
    early = data["household"]["people"]["early_riser"]["weekdays"]
    early["out"] = ["08:00-12:00", "13:30-17:00"]  # home for lunch
    by_id = rooms(schedules_view(make(data)))
    note = "Weekdays: dropped 19° 11:30 to 13:30 to fit the TRV's limit of 6 changes a day."
    assert by_id["kitchen"]["notes"] == [note]
    assert by_id["dining"]["notes"] == [note]
    assert by_id["bedroom_1"]["notes"] == []


def test_without_a_household_only_hand_written_rooms():
    data = site_data()
    del data["household"]
    data["schedules"]["default"] = "00:00/16 07:00/20 22:00/16"
    for room in data["rooms"]:
        room.setdefault("schedule", "default")
    view = schedules_view(make(data))
    assert view["levels"] is None and view["frost"] is False
    assert {r["source"] for r in view["rooms"]} == {"hand_written"}
    assert len(view["rooms"]) == 8
    assert rooms(view)["kitchen"]["schedule"] == "default"


def test_the_demo_shows_the_simulator_schedule():
    rt = Runtime(house_config(), DemoDriver(start_hour=5.5))
    run_sync(rt.step())
    view = handle(rt, "GET", "schedules")
    assert view["now"] == {"weekday": 0, "minute": 331}
    assert view["levels"] is None
    lounge = rooms(view)["lounge"]
    assert lounge["source"] == "hand_written"
    assert lounge["summary"] == [
        {"days": "Mon to Sun", "text": "21° 06:30 to 08:30 and 17:00 to 22:30, otherwise 16°"}
    ]
    assert len(view["rooms"]) == 8


@pytest.fixture
async def client():
    rt = make()
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt = rt
        yield c


async def test_route_needs_the_token_and_follows_away(client):
    assert (await client.get("/api/v1/schedules")).status == 401
    view = await (await client.get("/api/v1/schedules", headers=H)).json()
    assert rooms(view)["bedroom_3"]["away"] is None
    r = await client.post(
        "/api/v1/people/home_worker/away", json={"until": "2026-11-20T18:00"}, headers=H
    )
    assert r.status == 200
    view = await (await client.get("/api/v1/schedules", headers=H)).json()
    assert rooms(view)["bedroom_3"]["away"]["people"] == [
        {"id": "home_worker", "name": "Home worker"}
    ]
