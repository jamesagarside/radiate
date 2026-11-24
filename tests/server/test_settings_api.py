"""The Settings view's API: GET, PUT and DELETE /api/v1/settings/config.

Changes are saved over the house file in `<data_dir>/settings.yaml`, never in the
house file, checked by the house file's parser, applied live where the registry says
so, and confirmed first when they can make Radiate write to the boiler or valves.
"""

import json
from pathlib import Path

import pytest
import yaml
from aiohttp.test_utils import TestClient, TestServer

from radiate.config import load_site
from radiate.config.saved import read_settings, settings_path
from radiate.config.site import read_house_file
from radiate.drivers.live import LiveDriver
from radiate.server.app import create_app
from radiate.server.bridge import DemoSession, RequestError, handle
from radiate.server.runtime import Runtime
from radiate.server.settings import (
    LIVE_HOOKS,
    SettingsEditor,
    SettingsFile,
    register_live,
)
from radiate.server.setup import HouseholdSetup, SavedFile

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
HOUSEHOLD = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "mqtt-secret-value", "RADIATE_SHELLY_PASSWORD": "s"}
H = {"Authorization": "Bearer secret"}


async def _publish(topic, payload):
    return True


def write_house(tmp_path: Path, example: Path = EXAMPLE) -> Path:
    data = yaml.safe_load(example.read_text())
    data["house"]["data_dir"] = str(tmp_path / "data")
    path = tmp_path / "house.yaml"
    path.write_text(yaml.safe_dump(data))
    return path


def runtime(tmp_path: Path, example: Path = EXAMPLE, locked=None) -> Runtime:
    path = write_house(tmp_path, example)
    site = load_site(path, env=ENV)
    drv = LiveDriver(site, _publish, clock=lambda: 1000.0, wall=lambda: 1.8e9)
    rt = Runtime(
        site.house,
        drv,
        household=site.household,
        timezone=site.timezone,
        fire_flag_max_s=site.fire_flag_s,
        outdoor_source=site.outdoor_source,
        outdoor_stale_after_s=site.outdoor_stale_after_s,
    )
    rt.setup = HouseholdSetup(site, SavedFile(site.data_dir))
    rt.settings_editor = SettingsEditor.start(
        read_house_file(path),
        SettingsFile(site.data_dir),
        read_settings(site.data_dir),
        env=ENV,
        locked=locked,
        problems=site.settings_problems,
    )
    return rt


def field(view: dict, path: str) -> dict:
    for sec in view["sections"]:
        for f in sec.get("fields", []):
            if f["path"] == path:
                return f
        for room in sec.get("rooms", []):
            for f in room["fields"]:
                if f["path"] == path:
                    return f
    raise KeyError(path)


def put(rt, values, confirm=None):
    body = {"values": values}
    if confirm is not None:
        body["confirm"] = confirm
    return handle(rt, "PUT", "settings/config", body)


# --- reading -------------------------------------------------------------------------


def test_view_says_where_each_value_comes_from(tmp_path):
    rt = runtime(tmp_path)
    v = handle(rt, "GET", "settings/config")
    assert v["saved"] == [] and v["pending_restart"] == []
    assert v["saved_at"] == str(tmp_path / "data" / "settings.yaml")
    f = field(v, "boiler.min_burn_min")
    assert f["source"] == "house_file" and f["value"] == 8 and f["house_file_value"] == 8
    assert f["unit"] == "min" and f["min"] == 4 and f["max"] == 20 and not f["restart"]
    f = field(v, "boiler.frost_c")
    assert f["source"] == "default" and f["value"] == 7
    f = field(v, "rooms.lounge.heat_source")
    assert f["source"] == "house_file" and f["value"] == "episodic"
    f = field(v, "rooms.toilet.trv_bias_k")
    assert f["source"] == "default" and f["value"] == -1.5
    rooms = next(s for s in v["sections"] if s["id"] == "rooms")["rooms"]
    assert [r["id"] for r in rooms][:2] == ["bedroom_1", "bedroom_2"]
    assert rooms[0]["name"] == "Bedroom 1"
    linked = {s["id"]: s["link"] for s in v["sections"] if s["link"]}
    assert linked == {"household": "household", "schedules": "schedules"}
    names = sorted(yaml.safe_load(EXAMPLE.read_text())["schedules"])
    assert sorted(field(v, "rooms.lounge.schedule")["choices"]) == names


def test_secrets_are_never_returned(tmp_path):
    rt = runtime(tmp_path)
    v = handle(rt, "GET", "settings/config")
    f = field(v, "mqtt.password")
    assert f["is_set"] is True and f["env"] == ["RADIATE_MQTT_PASSWORD"]
    assert "value" not in f and "house_file_value" not in f and "default" not in f
    put(rt, {"mqtt.password": "typed-in-secret"})
    text = json.dumps(handle(rt, "GET", "settings/config"))
    assert "typed-in-secret" not in text and "mqtt-secret-value" not in text
    assert "RADIATE_MQTT_PASSWORD" not in text  # the app's value replaced the file's
    assert field(handle(rt, "GET", "settings/config"), "mqtt.password")["source"] == "app"
    # Saved to the data directory, where the server needs it.
    assert read_settings(tmp_path / "data") == {"mqtt": {"password": "typed-in-secret"}}


def test_dry_run_locked_by_the_command_line(tmp_path):
    rt = runtime(tmp_path, locked={"house.dry_run": "Set by --dry-run on the command line."})
    f = field(handle(rt, "GET", "settings/config"), "house.dry_run")
    assert f["locked"] == "Set by --dry-run on the command line."
    with pytest.raises(RequestError) as err:
        put(rt, {"house.dry_run": False}, confirm=True)
    assert err.value.status == 400
    assert err.value.body["errors"][0]["message"] == "Set by --dry-run on the command line."


# --- saving --------------------------------------------------------------------------


def test_live_settings_apply_at_once_and_the_house_file_is_untouched(tmp_path):
    rt = runtime(tmp_path)
    house = (tmp_path / "house.yaml").read_text()
    v = put(
        rt,
        {
            "boiler.min_burn_min": 12,
            "boiler.demand_mode": "comfort",
            "store.windows": ["05:30-06:30"],
            "balancing": False,
            "house.fire_flag_hours": 3,
            "monitoring.low_battery_pct": 30,
            "learning.learn_on_trv_fallback": True,
            "suggestions.min_rooms": 4,
        },
    )
    assert sorted(v["applied"]) == sorted(
        [
            "boiler.min_burn_min",
            "boiler.demand_mode",
            "store.windows",
            "balancing",
            "house.fire_flag_hours",
            "monitoring.low_battery_pct",
            "learning.learn_on_trv_fallback",
            "suggestions.min_rooms",
        ]
    )
    assert v["restart"] == [] and v["pending_restart"] == []
    assert rt.cfg.boiler.min_burn_s == 720
    assert rt.cfg.boiler.demand_mode.value == "comfort"
    assert rt.cfg.store.windows == ((330, 390),)
    assert rt.cfg.balancing is False
    assert rt.cfg.learning.learn_on_trv_fallback is True
    assert rt.cfg.suggestions.min_rooms == 4
    assert rt.fire_flag_max_s == 3 * 3600
    assert rt.driver.limits.low_battery_pct == 30
    assert rt.driver.cfg.store.windows == ((330, 390),)  # the Shelly fallback's windows
    assert rt.settings()["demand_mode"] == "comfort"
    assert field(v, "boiler.min_burn_min")["source"] == "app"
    assert (tmp_path / "house.yaml").read_text() == house
    # The next start loads the same.
    site = load_site(tmp_path / "house.yaml", env=ENV)
    assert site.house.boiler.min_burn_s == 720 and site.house.store.windows == ((330, 390),)


def test_restart_settings_wait_for_a_restart(tmp_path):
    rt = runtime(tmp_path)
    rooms = rt.cfg.rooms
    v = put(rt, {"rooms.lounge.name": "Front room", "mqtt.port": 1884})
    assert v["applied"] == [] and sorted(v["restart"]) == ["mqtt.port", "rooms.lounge.name"]
    assert sorted(v["pending_restart"]) == ["mqtt.port", "rooms.lounge.name"]
    assert field(v, "mqtt.port")["pending_restart"] is True
    assert rt.cfg.rooms == rooms  # not applied while running
    # Putting it back clears the pending restart.
    v = handle(rt, "DELETE", "settings/config/mqtt.port")
    assert v["pending_restart"] == ["rooms.lounge.name"]
    assert load_site(tmp_path / "house.yaml", env=ENV).house.room("lounge").name == "Front room"


def test_writes_to_devices_need_confirming(tmp_path):
    rt = runtime(tmp_path)
    with pytest.raises(RequestError) as err:
        put(rt, {"house.dry_run": False, "boiler.frost_c": 8})
    assert err.value.status == 409
    assert err.value.body["confirm"] == ["house.dry_run"]
    assert read_settings(tmp_path / "data") is None  # nothing saved
    v = put(rt, {"house.dry_run": False}, confirm=True)
    assert v["pending_restart"] == ["house.dry_run"]
    # Reverting it changes it again, so that needs confirming too.
    with pytest.raises(RequestError) as err:
        handle(rt, "DELETE", "settings/config/house.dry_run")
    assert err.value.status == 409
    v = handle(rt, "DELETE", "settings/config/house.dry_run", {"confirm": True})
    assert v["saved"] == [] and v["pending_restart"] == []
    # Setting a value to what it already is writes nothing new, so it needs no confirm.
    put(rt, {"house.dry_run": True})


def test_invalid_values_are_refused_with_their_paths(tmp_path):
    rt = runtime(tmp_path)
    with pytest.raises(RequestError) as err:
        put(rt, {"boiler.min_burn_min": 40, "boiler.eco_limit_k": 0.3})
    assert err.value.status == 400
    paths = {e["path"] for e in err.value.body["errors"]}
    assert {"boiler.min_burn_min", "boiler.eco_limit_k"} <= paths
    with pytest.raises(RequestError) as err:
        put(rt, {"boiler.min_burn_min": "nine", "nope": 1, "house.data_dir": "/tmp"})
    errors = {e["path"]: e["message"] for e in err.value.body["errors"]}
    assert errors == {
        "boiler.min_burn_min": "must be a number",
        "nope": "unknown setting",
        "house.data_dir": "only the house file can set this",
    }
    with pytest.raises(RequestError) as err:
        put(rt, {"rooms.lounge.trv": None}, confirm=True)
    assert err.value.body["errors"][0]["path"] == "rooms.lounge.trv"
    with pytest.raises(RequestError) as err:
        put(rt, {"rooms.attic.name": "Attic"})
    assert err.value.body["errors"][0]["message"] == "no room with this id in the house file"
    assert read_settings(tmp_path / "data") is None


def test_clearing_an_optional_setting(tmp_path):
    rt = runtime(tmp_path)
    put(rt, {"boiler.nozzle_lph": 0.35})
    assert rt.cfg.boiler.nozzle_lph == 0.35
    v = put(rt, {"boiler.nozzle_lph": None})
    assert rt.cfg.boiler.nozzle_lph is None
    assert field(v, "boiler.nozzle_lph")["source"] == "app"
    assert read_settings(tmp_path / "data") == {"boiler": {"nozzle_lph": None}}


# --- reverting -----------------------------------------------------------------------


def test_revert_one_a_section_a_room_and_all(tmp_path):
    rt = runtime(tmp_path)
    put(
        rt,
        {
            "boiler.frost_c": 8,
            "boiler.min_off_min": 12,
            "store.recovery_min": 30,
            "rooms.lounge.name": "Front room",
            "rooms.lounge.trv_bias_k": -1,
            "rooms.kitchen.name": "Galley",
        },
    )
    v = handle(rt, "DELETE", "settings/config/boiler.frost_c")
    assert "boiler.frost_c" not in v["saved"] and rt.cfg.boiler.frost_c == 7
    v = handle(rt, "DELETE", "settings/config/boiler")
    assert not [p for p in v["saved"] if p.startswith("boiler.")]
    assert rt.cfg.boiler.min_off_s == 600
    v = handle(rt, "DELETE", "settings/config/rooms.lounge")
    assert v["saved"] == ["rooms.kitchen.name", "store.recovery_min"]
    v = handle(rt, "DELETE", "settings/config")
    assert v["saved"] == []
    assert not settings_path(tmp_path / "data").exists()
    with pytest.raises(RequestError) as err:
        handle(rt, "DELETE", "settings/config/nothing")
    assert err.value.status == 404
    with pytest.raises(RequestError) as err:
        handle(rt, "DELETE", "settings/config/rooms.attic")
    assert err.value.status == 404


def test_revert_that_leaves_an_invalid_house_is_refused(tmp_path):
    rt = runtime(tmp_path)
    put(rt, {"shelly.heating_switch": 1, "shelly.store_switch": 0}, confirm=True)
    with pytest.raises(RequestError) as err:
        handle(rt, "DELETE", "settings/config/shelly.store_switch", {"confirm": True})
    assert err.value.status == 400
    assert err.value.body["errors"][0]["path"] == "shelly.store_switch"
    handle(rt, "DELETE", "settings/config/shelly", {"confirm": True})


def test_saved_settings_that_no_longer_load_are_reported(tmp_path):
    path = write_house(tmp_path)
    (tmp_path / "data").mkdir()
    settings_path(tmp_path / "data").write_text("settings:\n  boiler:\n    frost_c: 50\n")
    site = load_site(path, env=ENV)
    editor = SettingsEditor.start(
        read_house_file(path),
        SettingsFile(site.data_dir),
        read_settings(site.data_dir),
        env=ENV,
        problems=site.settings_problems,
    )
    v = editor.view()
    assert v["problems"] == [{"path": "boiler.frost_c", "message": "must be 5 to 10"}]
    assert field(v, "boiler.frost_c")["value"] == 50  # what is saved, shown to fix it


def test_a_room_the_saved_household_uses_must_keep_its_valve(tmp_path):
    rt = runtime(tmp_path)
    section = {
        "people": {"sam": {"weekdays": {"up": "07:00", "bed": "23:00"}}},
        "rooms": {"lounge": {"use": "in_use"}},
    }
    handle(rt, "PUT", "household", {"household": section})
    with pytest.raises(RequestError) as err:
        put(rt, {"rooms.lounge.role": "passive", "rooms.lounge.trv": None}, confirm=True)
    assert err.value.status == 400
    errors = err.value.body["errors"]
    assert errors[0]["path"] == "household.rooms.lounge"
    assert errors[0]["message"].endswith("(the household saved in the household setup)")
    # The house file's own household is checked by the parser.
    (tmp_path / "hh").mkdir()
    rt = runtime(tmp_path / "hh", HOUSEHOLD)
    with pytest.raises(RequestError) as err:
        put(rt, {"rooms.lounge.role": "passive", "rooms.lounge.trv": None}, confirm=True)
    assert err.value.body["errors"][0]["path"] == "household.rooms.lounge"


def test_register_live_hooks_run_after_a_change(tmp_path):
    rt = runtime(tmp_path)
    seen = []
    register_live(lambda rt, site: seen.append(site.house.boiler.frost_c))
    try:
        put(rt, {"boiler.frost_c": 9})
        put(rt, {"rooms.lounge.name": "Front room"})  # restart only: no hook
    finally:
        LIVE_HOOKS.clear()
    assert seen == [9]


# --- HTTP and the demo ---------------------------------------------------------------


async def test_http_routes(tmp_path):
    rt = runtime(tmp_path)
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        assert (await c.get("/api/v1/settings/config")).status == 401
        r = await c.get("/api/v1/settings/config", headers=H)
        assert r.status == 200 and (await r.json())["sections"]
        r = await c.put(
            "/api/v1/settings/config", headers=H, json={"values": {"boiler.frost_c": 8}}
        )
        assert r.status == 200 and (await r.json())["applied"] == ["boiler.frost_c"]
        r = await c.put(
            "/api/v1/settings/config", headers=H, json={"values": {"house.dry_run": False}}
        )
        assert r.status == 409 and (await r.json())["confirm"] == ["house.dry_run"]
        r = await c.put(
            "/api/v1/settings/config", headers=H, json={"values": {"boiler.frost_c": 80}}
        )
        assert r.status == 400 and (await r.json())["errors"][0]["path"] == "boiler.frost_c"
        r = await c.delete("/api/v1/settings/config/boiler.frost_c", headers=H)
        assert r.status == 200 and (await r.json())["saved"] == []
        r = await c.delete("/api/v1/settings/config", headers=H, json={"confirm": True})
        assert r.status == 200
        # The runtime settings route the Home Assistant integration uses is unchanged.
        r = await c.post("/api/v1/settings", headers=H, json={"demand_mode": "comfort"})
        assert r.status == 200 and (await r.json())["settings"]["demand_mode"] == "comfort"


async def test_http_without_an_editor_is_404(tmp_path):
    rt = runtime(tmp_path)
    rt.settings_editor = None
    async with TestClient(TestServer(create_app(rt))) as c:
        assert (await c.get("/api/v1/settings/config")).status == 404


def test_demo_settings_live_in_memory():
    s = DemoSession()
    r = json.loads(s.request("GET", "settings/config"))
    assert r["status"] == 200 and r["body"]["saved_at"] is None
    r = json.loads(
        s.request("PUT", "settings/config", json.dumps({"values": {"boiler.min_burn_min": 12}}))
    )
    assert r["status"] == 200 and s.rt.cfg.boiler.min_burn_s == 720
    r = json.loads(
        s.request("PUT", "settings/config", json.dumps({"values": {"house.dry_run": False}}))
    )
    assert r["status"] == 409
    r = json.loads(s.request("DELETE", "settings/config"))
    assert r["status"] == 200 and s.rt.cfg.boiler.min_burn_s == 480
