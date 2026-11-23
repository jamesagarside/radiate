"""The runtime fills room use and the savings baseline into each snapshot (spec 5.8, 5.9)."""

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

from radiate.config import parse_site
from radiate.core import RoomUse
from radiate.drivers.live import LiveDriver
from radiate.server.runtime import Runtime

EXAMPLES = Path(__file__).resolve().parents[2] / "examples"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
TZ = ZoneInfo("Europe/London")
# Wednesday 18 November 2026 in London.
WED_0700 = datetime(2026, 11, 18, 7, 0, tzinfo=TZ).timestamp()
WED_1900 = datetime(2026, 11, 18, 19, 0, tzinfo=TZ).timestamp()


async def _publish(topic, payload):
    return True


def household_data(lounge_use: str | None = None) -> dict:
    """The household example, with the lounge on a hand-written schedule."""
    data = yaml.safe_load((EXAMPLES / "household.yaml").read_text())
    del data["household"]["rooms"]["lounge"]
    data["schedules"] = {"lounge": "00:00/16 18:00/20"}
    lounge = next(r for r in data["rooms"] if r["id"] == "lounge")
    lounge["schedule"] = "lounge"
    if lounge_use is not None:
        lounge["use"] = lounge_use
    del data["shelly"]
    return data


def make(data: dict, wall: float, household: bool = True) -> Runtime:
    site = parse_site(data, env=ENV)
    drv = LiveDriver(site, _publish, clock=lambda: 1000.0, wall=lambda: wall)
    return Runtime(
        site.house,
        drv,
        household=site.household if household else None,
        timezone=site.timezone,
        wall=lambda: wall,
        schedule_use=site.schedule_use,
    )


async def test_household_rooms_get_room_use_and_a_baseline():
    rt = make(household_data(), WED_0700)
    await rt.step()
    snap = rt.last_snapshot
    assert snap.baseline is True
    rooms = snap.rooms
    assert rooms["bedroom_1"].use is RoomUse.IN_USE  # 30 minutes after getting up
    assert rooms["bedroom_3"].use is RoomUse.SETBACK  # the office, before work
    assert rooms["bathroom"].use is RoomUse.OCCASIONAL
    assert rooms["bedroom_2"].use is RoomUse.SETBACK  # unused
    assert rooms["dining"].baseline_c == 19.0
    assert rooms["bathroom"].baseline_c == 16.0
    assert rooms["bedroom_2"].baseline_c == 14.0
    # Hand-written without a use level, and passive: none.
    assert rooms["lounge"].use is None and rooms["lounge"].baseline_c is None
    assert rooms["stairs"].use is None and rooms["stairs"].baseline_c is None


async def test_an_override_makes_the_room_in_use():
    rt = make(household_data(), WED_0700)
    rt.set_override("bedroom_2", 20.0, until="cleared")
    await rt.step()
    assert rt.last_snapshot.rooms["bedroom_2"].use is RoomUse.IN_USE


async def test_hand_written_room_with_a_use_level():
    rt = make(household_data(lounge_use="in_use"), WED_0700)
    await rt.step()
    assert rt.last_snapshot.rooms["lounge"].use is RoomUse.SETBACK  # 16° is its lowest
    assert rt.last_snapshot.rooms["lounge"].baseline_c is None

    rt = make(household_data(lounge_use="in_use"), WED_1900)
    await rt.step()
    assert rt.last_snapshot.rooms["lounge"].use is RoomUse.IN_USE

    rt = make(household_data(lounge_use="unused"), WED_1900)
    await rt.step()
    assert rt.last_snapshot.rooms["lounge"].use is RoomUse.SETBACK


async def test_hand_written_override_is_in_use():
    rt = make(household_data(lounge_use="unused"), WED_0700)
    rt.set_override("lounge", 21.0, until="cleared")
    await rt.step()
    assert rt.last_snapshot.rooms["lounge"].use is RoomUse.IN_USE


async def test_no_household_leaves_room_use_and_baseline_unset():
    data = yaml.safe_load((EXAMPLES / "reference-house.yaml").read_text())
    del data["shelly"]
    rt = make(data, WED_1900, household=False)
    await rt.step()
    snap = rt.last_snapshot
    assert snap.baseline is False
    assert all(inp.use is None and inp.baseline_c is None for inp in snap.rooms.values())


async def test_hand_written_rooms_without_a_household():
    data = yaml.safe_load((EXAMPLES / "reference-house.yaml").read_text())
    del data["shelly"]
    next(r for r in data["rooms"] if r["id"] == "dining")["use"] = "in_use"
    rt = make(data, WED_1900, household=False)
    await rt.step()
    snap = rt.last_snapshot
    assert snap.baseline is False  # no household, so no savings baseline
    assert snap.rooms["dining"].use is RoomUse.IN_USE
    assert snap.rooms["dining"].baseline_c is None
    assert snap.rooms["lounge"].use is None
