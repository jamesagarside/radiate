"""The manual fire flag expires (spec 7, fail warm): a forgotten "fire lit" must not
leave a room unheated for days."""

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
import yaml

from radiate.config import ConfigError, parse_site
from radiate.server.bridge import handle, run_sync
from radiate.server.demo import DemoDriver
from radiate.server.runtime import FIRE_FLAG_DEFAULT_S, Runtime
from radiate.sim.reference import house_config

TZ = ZoneInfo("Europe/London")
H = 3600.0
EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"


def make(hour: int, **kw) -> tuple[Runtime, DemoDriver, list[float]]:
    wall = [datetime(2026, 11, 18, hour, 0, tzinfo=TZ).timestamp()]
    drv = DemoDriver()
    rt = Runtime(house_config(), drv, wall=lambda: wall[0], timezone="Europe/London", **kw)
    return rt, drv, wall


def advance(drv: DemoDriver, wall: list[float], seconds: float) -> None:
    drv.house.now += seconds
    wall[0] += seconds


def lounge(rt: Runtime) -> dict:
    return next(r for r in rt.describe()["rooms"] if r["id"] == "lounge")


def test_fire_flag_expires_after_six_hours_by_default():
    assert FIRE_FLAG_DEFAULT_S == 6 * H
    rt, drv, wall = make(12)
    answer = handle(rt, "POST", "rooms/lounge/fire", {"lit": True})
    assert answer["ok"] and answer["expires_in_min"] == 360
    assert lounge(rt)["fire_switch"] is True
    assert lounge(rt)["fire_switch_expires_in_min"] == 360
    advance(drv, wall, 6 * H - 60)
    run_sync(rt.step())
    assert "lounge" in rt.fire
    advance(drv, wall, 120)
    run_sync(rt.step())
    assert "lounge" not in rt.fire
    assert lounge(rt)["fire_switch"] is False
    assert lounge(rt)["fire_switch_expires_in_min"] is None
    assert any(d.code == "room.fire_switch_expired" for d in rt.decisions)


def test_fire_flag_expires_at_local_midnight_at_the_latest():
    rt, drv, wall = make(21)
    answer = handle(rt, "POST", "rooms/lounge/fire", {"lit": True})
    assert answer["expires_in_min"] == 180
    advance(drv, wall, 3 * H)
    run_sync(rt.step())
    assert "lounge" not in rt.fire


def test_fire_flag_length_is_a_setting():
    rt, _, _ = make(12, fire_flag_max_s=2 * H)
    assert handle(rt, "POST", "rooms/lounge/fire", {"lit": True})["expires_in_min"] == 120
    handle(rt, "POST", "rooms/lounge/fire", {"lit": False})
    assert "lounge" not in rt.fire and "lounge" not in rt.fire_until


def _site(house: dict):
    data = yaml.safe_load(EXAMPLE.read_text())
    data["house"].update(house)
    return parse_site(data, env={"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"})


def test_fire_flag_hours_from_the_house_file():
    assert _site({}).fire_flag_s == 6 * H
    assert _site({"fire_flag_hours": 3}).fire_flag_s == 3 * H
    with pytest.raises(ConfigError, match="fire_flag_hours"):
        _site({"fire_flag_hours": 48})
