"""Quiet hours at runtime (spec 5.10): worked out in house time, overrides, a return
warm-up, the state API and the Settings view."""

import json
from datetime import UTC, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml

from radiate.config import parse_site
from radiate.config.site import read_house_file
from radiate.drivers.live import LiveDriver
from radiate.server.runtime import Runtime
from radiate.server.settings import SettingsEditor, SettingsError, SettingsMemory

EXAMPLES = Path(__file__).resolve().parents[2] / "examples"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
TZ = ZoneInfo("Europe/London")
MIN = 60.0


async def _publish(topic, payload):
    return True


class Clocks:
    def __init__(self, wall: float):
        self.mono = 1000.0
        self.wall = wall

    def advance(self, seconds: float) -> None:
        self.mono += seconds
        self.wall += seconds


def reference(quiet: str | None = "22:30-06:00") -> dict:
    data = yaml.safe_load((EXAMPLES / "reference-house.yaml").read_text())
    del data["shelly"]
    if quiet is not None:
        data["house"]["quiet_hours"] = quiet
    return data


def household(quiet: str | None = "22:30-06:00", **away) -> dict:
    data = yaml.safe_load((EXAMPLES / "household.yaml").read_text())
    del data["household"]["rooms"]["lounge"]
    data["schedules"] = {"lounge": "00:00/16 18:00/20"}
    next(r for r in data["rooms"] if r["id"] == "lounge")["schedule"] = "lounge"
    del data["shelly"]
    data["household"].setdefault("away", {}).update(away)
    if quiet is not None:
        data["house"]["quiet_hours"] = quiet
    return data


def make(data: dict, wall: float) -> tuple[Runtime, LiveDriver, Clocks]:
    site = parse_site(data, env=ENV)
    clocks = Clocks(wall)
    drv = LiveDriver(site, _publish, clock=lambda: clocks.mono, wall=lambda: clocks.wall)
    rt = Runtime(
        site.house,
        drv,
        household=site.household,
        timezone=site.timezone,
        wall=lambda: clocks.wall,
    )
    return rt, drv, clocks


def feed(drv: LiveDriver, temperature: float) -> None:
    for rc in drv.cfg.rooms:
        dev = drv.site.devices[rc.id]
        if dev.sensor:
            reading = json.dumps({"temperature": temperature}).encode()
            drv.handle_message(f"zigbee2mqtt/{dev.sensor}", reading)
        if dev.trv:
            trv = {"local_temperature": temperature + 0.5, "running_state": "idle"}
            drv.handle_message(f"zigbee2mqtt/{dev.trv}", json.dumps(trv).encode())
            drv.handle_message(f"zigbee2mqtt/{dev.trv}/availability", b'{"state":"online"}')


def local(*args) -> float:
    return datetime(*args, tzinfo=TZ).timestamp()


def utc(*args) -> float:
    return datetime(*args, tzinfo=UTC).timestamp()


async def test_off_by_default():
    rt, drv, _ = make(reference(quiet=None), local(2026, 11, 18, 2, 0))
    feed(drv, 15.0)
    await rt.step()
    assert rt.last_snapshot.quiet_until_min is None
    assert rt.describe()["quiet"] == {"window": None, "active": False, "until": None}
    assert rt.state.rooms["bedroom_1"].calling  # 15 °C against a 16 °C night setpoint


async def test_inside_the_window_rooms_rest_and_the_state_says_why():
    rt, drv, _ = make(reference(), local(2026, 11, 18, 4, 45))
    feed(drv, 15.0)
    await rt.step()
    assert rt.last_snapshot.quiet_until_min == 360
    state = rt.describe()
    assert state["quiet"] == {"window": "22:30-06:00", "active": True, "until": "06:00"}
    bed = next(r for r in state["rooms"] if r["id"] == "bedroom_1")
    assert not bed["calling"] and not bed["preheating"]
    assert bed["reason_code"] == "demand.quiet_hours"
    assert bed["reason"].startswith("Bedroom 1: quiet hours, no heating until 06:00")
    assert bed["target"] == rt.cfg.boiler.frost_c


async def test_outside_the_window():
    rt, drv, _ = make(reference(), local(2026, 11, 18, 12, 0))
    feed(drv, 15.0)
    await rt.step()
    assert rt.describe()["quiet"] == {"window": "22:30-06:00", "active": False, "until": None}


async def test_house_time_follows_daylight_saving():
    # 05:30 UTC: 05:30 in London in winter, inside quiet hours; 06:30 on the morning the
    # clocks go forward (29 March 2026), so outside them.
    for wall, active in (
        (utc(2026, 3, 28, 5, 30), True),
        (utc(2026, 3, 29, 5, 30), False),
        (utc(2026, 10, 25, 5, 30), True),  # clocks went back at 01:00 UTC: 05:30 GMT
        (utc(2026, 7, 1, 4, 30), True),  # 05:30 BST
        (utc(2026, 7, 1, 5, 0), False),  # 06:00 BST
    ):
        rt, drv, _ = make(reference(), wall)
        feed(drv, 18.0)
        await rt.step()
        assert rt.describe()["quiet"]["active"] is active, datetime.fromtimestamp(wall, TZ)


async def test_an_override_wins_over_quiet_hours():
    rt, drv, _ = make(reference(), local(2026, 11, 18, 3, 0))
    feed(drv, 15.0)
    rt.set_override("bedroom_1", 20.0, until="cleared")
    await rt.step()
    snap = rt.last_snapshot
    assert snap.rooms["bedroom_1"].override and not snap.rooms["dining"].override
    assert rt.state.rooms["bedroom_1"].calling and rt.state.rooms["bedroom_1"].target == 20.0
    assert not rt.state.rooms["dining"].calling


async def test_a_return_warm_up_waits_for_the_end_of_quiet_hours():
    # Everyone away, due back Friday 07:00, a six-hour return warm-up and a cold house.
    fri_0700 = local(2026, 11, 20, 7, 0)

    async def first_preheat(quiet: str | None) -> float | None:
        rt, drv, clocks = make(household(quiet, return_warmup_min=360), local(2026, 11, 19, 23, 0))
        rt.set_away("early_riser", fri_0700)
        rt.set_away("home_worker", fri_0700)
        while clocks.wall < fri_0700:
            feed(drv, 9.0)
            await rt.step()
            if rt.state.rooms["dining"].preheating:
                return (fri_0700 - clocks.wall) / MIN
            clocks.advance(MIN)
        return None

    assert await first_preheat(None) == 360  # a cold house warms as early as allowed
    assert await first_preheat("22:30-06:00") == 60  # from 06:00, not in the night


async def test_quiet_hours_change_live_from_the_settings_view(tmp_path):
    data = reference(quiet=None)
    data["house"]["data_dir"] = str(tmp_path / "data")
    path = tmp_path / "house.yaml"
    path.write_text(yaml.safe_dump(data))
    rt, drv, _ = make(data, local(2026, 11, 18, 23, 0))
    rt.settings_editor = SettingsEditor.start(
        read_house_file(path), env=ENV, store=SettingsMemory()
    )
    view = rt.settings_editor.save(rt, {"values": {"house.quiet_hours": "23:00-05:30"}})
    assert "house.quiet_hours" in view["applied"]
    assert rt.cfg.quiet_hours == (23 * 60, 5 * 60 + 30)
    feed(drv, 15.0)
    await rt.step()
    assert rt.describe()["quiet"] == {"window": "23:00-05:30", "active": True, "until": "05:30"}

    for bad in ("23:00", "06:00-06:00", "25:00-06:00", "late"):
        try:
            rt.settings_editor.save(rt, {"values": {"house.quiet_hours": bad}})
        except SettingsError as err:
            assert err.status == 400
        else:
            raise AssertionError(bad)

    rt.settings_editor.save(rt, {"values": {"house.quiet_hours": ""}})  # cleared: off
    assert rt.cfg.quiet_hours is None


async def test_a_room_window_on_top_of_the_house_one():
    data = reference()
    next(r for r in data["rooms"] if r["id"] == "bedroom_1")["quiet_hours"] = "23:00-08:00"
    rt, drv, _ = make(data, local(2026, 11, 18, 7, 0))
    feed(drv, 15.0)
    await rt.step()
    state = rt.describe()
    assert state["quiet"]["active"] is False  # the house window ended at 06:00
    rooms = {r["id"]: r for r in state["rooms"]}
    bed = rooms["bedroom_1"]
    assert bed["quiet"] == {"window": "23:00-08:00", "active": True, "until": "08:00"}
    assert bed["reason_code"] == "demand.quiet_hours"
    assert rooms["dining"]["quiet"] == {"window": None, "active": False, "until": None}
    assert rt.state.rooms["dining"].calling


async def test_a_room_window_changes_live_from_the_settings_view(tmp_path):
    data = reference(quiet=None)
    data["house"]["data_dir"] = str(tmp_path / "data")
    path = tmp_path / "house.yaml"
    path.write_text(yaml.safe_dump(data))
    rt, drv, _ = make(data, local(2026, 11, 18, 7, 0))
    rt.settings_editor = SettingsEditor.start(
        read_house_file(path), env=ENV, store=SettingsMemory()
    )
    path_key = "rooms.bedroom_1.quiet_hours"
    view = rt.settings_editor.save(rt, {"values": {path_key: "23:00-08:00"}})
    assert view["applied"] == [path_key]
    assert rt.cfg.room("bedroom_1").quiet_hours == (1380, 480)
    feed(drv, 15.0)
    await rt.step()
    assert rt.state.rooms["bedroom_1"].quiet and not rt.state.rooms["bedroom_1"].calling
