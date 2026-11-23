"""The runtime fills room use and the savings baseline into each snapshot (spec 5.8, 5.9)."""

import dataclasses
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
    # The household's baseline timer is on from 06:00 (first up less preheat): the
    # room's baseline is its usual (highest) setpoint.
    assert rt.last_snapshot.rooms["lounge"].baseline_c == 20.0

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
    # A baseline from the hand-written schedules: timer from the earliest warm start
    # to the latest warm end in the house that day, the room at its usual setpoint.
    assert snap.baseline is True
    assert snap.rooms["dining"].use is RoomUse.IN_USE
    week = rt.driver.schedules()["dining"][1]
    assert snap.rooms["dining"].baseline_c == max(sp for _, sp in week.days[2].transitions)
    # No use key: no room use and no baseline.
    assert snap.rooms["lounge"].use is None and snap.rooms["lounge"].baseline_c is None


async def test_hand_written_rooms_outside_the_baseline_timer():
    data = yaml.safe_load((EXAMPLES / "reference-house.yaml").read_text())
    del data["shelly"]
    next(r for r in data["rooms"] if r["id"] == "dining")["use"] = "in_use"
    rt = make(data, datetime(2026, 11, 18, 3, 0, tzinfo=TZ).timestamp(), household=False)
    await rt.step()
    snap = rt.last_snapshot
    assert snap.baseline is True  # the house has a baseline; its timer is off now
    assert snap.rooms["dining"].baseline_c is None


def people_only(use: bool, wall: float) -> Runtime:
    """The shape of a live house: every room hand-written (with a use level when `use`),
    and a saved household with people, for their times, but no household rooms."""
    people = parse_site(household_data(), env=ENV).household
    data = yaml.safe_load((EXAMPLES / "reference-house.yaml").read_text())
    del data["shelly"]
    if use:
        for r in data["rooms"]:
            if "schedule" in r:
                r["use"] = "in_use"
    site = parse_site(data, env=ENV)
    drv = LiveDriver(site, _publish, clock=lambda: 1000.0, wall=lambda: wall)
    return Runtime(
        site.house,
        drv,
        household=dataclasses.replace(people, rooms=()),
        timezone=site.timezone,
        wall=lambda: wall,
        schedule_use=site.schedule_use,
    )


async def test_household_with_people_but_no_rooms_gives_hand_written_rooms_a_baseline():
    rt = people_only(True, WED_0700)
    await rt.step()
    snap = rt.last_snapshot
    assert snap.baseline is True
    # Timer on from the first person up (06:30) less the 30 minute preheat, the room at
    # its schedule's highest setpoint that day.
    week = rt.driver.schedules()["dining"][1]
    assert snap.rooms["dining"].baseline_c == max(sp for _, sp in week.days[2].transitions)
    assert snap.rooms["dining"].use is not None


async def test_household_without_any_baseline_room_sets_no_baseline():
    rt = people_only(False, WED_1900)
    await rt.step()
    snap = rt.last_snapshot
    assert snap.baseline is False
    assert all(inp.baseline_c is None for inp in snap.rooms.values())
