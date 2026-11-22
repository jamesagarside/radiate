"""Household setup from the web UI: save, load with precedence, revert, preview, errors.

The wizard's draft is the house file's `household` section as JSON. It is saved to
`<data_dir>/household.yaml`, which replaces the house file's section for the server,
`radiate check-config` and `radiate schedules` alike.
"""

import copy
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
import yaml
from aiohttp.test_utils import TestClient, TestServer

from radiate.cli import main
from radiate.config import load_site, parse_site
from radiate.config.household import household_section
from radiate.config.saved import read_saved, saved_path, write_saved
from radiate.config.site import apply_household, parse_household
from radiate.drivers.live import LiveDriver
from radiate.server.app import create_app
from radiate.server.bridge import DemoSession, RequestError, handle, run_sync
from radiate.server.runtime import Runtime
from radiate.server.schedules import schedules_view
from radiate.server.setup import HouseholdSetup, SavedFile

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
TZ = ZoneInfo("Europe/London")
WED_0600 = datetime(2026, 11, 18, 6, 0, tzinfo=TZ).timestamp()
FRI_1800 = datetime(2026, 11, 20, 18, 0, tzinfo=TZ).timestamp()
H = {"Authorization": "Bearer secret"}


async def _publish(topic, payload):
    return True


def house_data() -> dict:
    """The household example, with the lounge on a hand-written schedule."""
    data = yaml.safe_load(EXAMPLE.read_text())
    del data["household"]["rooms"]["lounge"]
    data["schedules"] = {"lounge": "00:00/16 18:00/20"}
    next(r for r in data["rooms"] if r["id"] == "lounge")["schedule"] = "lounge"
    del data["shelly"]
    return data


def draft() -> dict:
    """A different household: one person, every room but the lounge, lounge on its own."""
    return {
        "temperatures": {"in_use": 20, "occasional": 16, "unused": 15, "night": 15},
        "people": {
            "sam": {
                "name": "Sam",
                "weekdays": {"up": "07:00", "out": ["08:30-17:30"], "bed": "23:00"},
                "weekend": {"up": "09:00", "bed": "23:30"},
            }
        },
        "rooms": {
            "bedroom_1": {"use": "in_use", "kind": "bedroom", "people": ["sam"]},
            "bedroom_2": {"use": "unused"},
            "bedroom_3": {"use": "unused"},
            "bathroom": {"use": "occasional"},
            "dining": {"use": "in_use"},
            "kitchen": {"use": "in_use", "kind": "while_home"},
            "toilet": {"use": {"weekdays": "unused", "weekend": "occasional"}},
        },
    }


def make(tmp_path: Path, data: dict | None = None) -> Runtime:
    site = parse_site(data or house_data(), env=ENV)
    wall = lambda: WED_0600  # noqa: E731
    drv = LiveDriver(site, _publish, clock=lambda: 1000.0, wall=wall)
    rt = Runtime(site.house, drv, household=site.household, timezone=site.timezone, wall=wall)
    rt.setup = HouseholdSetup(site, SavedFile(str(tmp_path)))
    return rt


def write_house(tmp_path: Path, data: dict | None = None) -> Path:
    path = tmp_path / "house.yaml"
    data = data or house_data()
    data["mqtt"]["password"] = "m"
    path.write_text(yaml.safe_dump(data, sort_keys=False))
    return path


def by_id(view: dict) -> dict[str, dict]:
    return {r["id"]: r for r in view["rooms"]}


# --- the section and the saved file -----------------------------------------------------


def test_section_round_trips_through_the_parser():
    site = parse_site(house_data(), env=ENV)
    section = household_section(site.household)
    assert parse_household(section, site) == site.household
    # Defaults are left out, temperatures are always written, times are strings.
    assert "timing" not in section and "away" not in section
    assert section["temperatures"] == {"in_use": 19, "occasional": 16, "unused": 14, "night": 14}
    assert section["people"]["home_worker"]["weekdays"]["work"] == ["08:00-18:00"]
    assert section["rooms"]["toilet"] == {
        "use": {"weekdays": "unused", "weekend": "occasional"},
        "kind": "all_day",
        "temperature": 15,
    }
    # A changed setting is written, and the YAML keeps times quoted.
    raw = copy.deepcopy(section)
    raw["timing"] = {"preheat_min": 45, "live_preheat": "fixed"}
    raw["weekend_days"] = ["fri", "sat"]
    hh = parse_household(raw, site)
    again = household_section(hh)
    assert again["timing"] == {"preheat_min": 45, "live_preheat": "fixed"}
    assert again["weekend_days"] == ["fri", "sat"]
    assert parse_household(again, site) == hh


def test_saved_file_is_a_household_section(tmp_path):
    write_saved(tmp_path, draft())
    text = saved_path(tmp_path).read_text()
    assert text.startswith("# Saved by Radiate's household setup")
    assert 'up: "07:00"' in text and '- "08:30-17:30"' in text  # times in quotes
    assert read_saved(tmp_path) == draft()
    assert not list(tmp_path.glob(".household.*"))  # the temporary file is gone
    assert read_saved(tmp_path / "nothing") is None


# --- loading, with precedence -----------------------------------------------------------


def test_saved_household_replaces_the_house_files(tmp_path):
    path = write_house(tmp_path)
    data_dir = tmp_path / "data"
    assert load_site(path, data_dir=data_dir).household_source == "house_file"
    write_saved(data_dir, draft())
    site = load_site(path, data_dir=data_dir)
    assert site.household_source == "saved"
    assert [p.id for p in site.household.people] == ["sam"]
    assert [p.id for p in site.file_household.people] == ["early_riser", "home_worker"]
    assert site.devices["lounge"].schedule == "lounge"  # left out: its own schedule
    assert site.devices["kitchen"].schedule is None
    assert site.schedule_for("kitchen").days[0].describe().startswith("20°")
    # house.data_dir in the file is used when no data directory is given.
    data = house_data()
    data["house"]["data_dir"] = str(data_dir)
    assert load_site(write_house(tmp_path, data)).household_source == "saved"


def test_a_room_the_saved_household_takes_over_loses_its_schedule(tmp_path):
    path = write_house(tmp_path)
    raw = draft()
    raw["rooms"]["lounge"] = {"use": "in_use"}
    write_saved(tmp_path, raw)
    site = load_site(path, data_dir=tmp_path)
    assert site.devices["lounge"].schedule is None
    assert "lounge" in site.household_schedules


def test_a_saved_household_that_no_longer_fits_is_not_used(tmp_path):
    path = write_house(tmp_path)
    raw = draft()
    raw["rooms"]["conservatory"] = {"use": "in_use"}
    write_saved(tmp_path, raw)
    site = load_site(path, data_dir=tmp_path)
    assert site.household_source == "house_file"
    assert site.saved_problems == (
        "household.rooms.conservatory: unknown room 'conservatory'; use an id from rooms",
    )
    assert any("was not used, so the house file's setup applies" in n for n in site.notes)
    saved_path(tmp_path).write_text("household: [")
    broken = load_site(path, data_dir=tmp_path)
    assert broken.household_source == "house_file"
    assert broken.saved_problems[0].startswith(f"{saved_path(tmp_path)}: not valid YAML")


def test_cli_agrees_with_the_server_given_the_data_dir(tmp_path, capsys):
    path = write_house(tmp_path)
    write_saved(tmp_path / "data", draft())
    main(["check-config", str(path), "--data-dir", str(tmp_path / "data")])
    out = capsys.readouterr().out
    assert "household: saved from the web UI in" in out
    main(["schedules", str(path), "--data-dir", str(tmp_path / "data")])
    out = capsys.readouterr().out
    assert out.startswith("Household: saved from the web UI in")
    assert "Kitchen: from the household\n" in out and "Lounge: schedule lounge\n" in out
    assert "20°" in out
    main(["check-config", str(path), "--data-dir", str(tmp_path / "elsewhere")])
    assert "household: from the house file" in capsys.readouterr().out


# --- the setup: view, preview, save, revert ---------------------------------------------


def test_view_lists_what_the_wizard_needs(tmp_path):
    rt = make(tmp_path)
    view = rt.setup.view()
    assert view["source"] == "house_file" and view["house_file"] is True
    assert view["saved_at"] == str(tmp_path / "household.yaml")
    assert view["household"]["people"]["early_riser"]["name"] == "Early riser"
    assert view["defaults"]["timing"]["preheat_min"] == 30
    assert view["defaults"]["weekend_days"] == ["saturday", "sunday"]
    assert view["limits"]["timing.preheat_min"] == {"min": 0, "max": 180, "unit": "min"}
    assert "while_home" in view["options"]["rooms.kind"]
    rooms = {r["id"]: r for r in view["rooms"]}
    assert "stairs" not in rooms  # passive: not controllable
    assert rooms["lounge"] == {
        "id": "lounge",
        "name": "Lounge",
        "schedule": "lounge",
        "heat_source": "episodic",
    }
    assert rooms["kitchen"]["schedule"] is None  # the household must cover it


def test_validation_errors_carry_the_path_of_the_answer(tmp_path):
    rt = make(tmp_path)
    raw = draft()
    raw["people"]["sam"]["weekdays"]["bed"] = "06:00"
    raw["people"]["sam"]["weekend"]["out"] = ["10:00-25:00"]
    raw["rooms"]["bedroom_1"]["people"] = ["alex"]
    raw["timing"] = {"preheat_min": 500}
    del raw["rooms"]["kitchen"]
    out = rt.setup.preview(rt, {"household": raw})
    assert out["rooms"] == []
    assert {e["path"]: e["message"] for e in out["errors"]} == {
        "household.timing.preheat_min": "must be whole minutes, 0 to 180",
        "household.people.sam.weekdays.bed": "must be after up, on the same day",
        "household.people.sam.weekend.out[0]": "'10:00-25:00' is not HH:MM-HH:MM",
        "household.rooms.bedroom_1.people": "unknown person 'alex'",
        "household.rooms.kitchen": "required: the house file gives this room no schedule of its own",
    }
    with pytest.raises(RequestError) as err:
        handle(rt, "PUT", "household", {"household": raw})
    assert err.value.status == 400 and len(err.value.body["errors"]) == 5
    assert not saved_path(tmp_path).exists()


def test_preview_equals_what_saving_produces(tmp_path):
    rt = make(tmp_path)
    run_sync(rt.step())
    before = schedules_view(rt)
    preview = handle(rt, "POST", "household/preview", {"household": draft()})
    assert preview["errors"] == [] and preview["notes"] == []
    assert schedules_view(rt) == before  # nothing changed yet
    assert not saved_path(tmp_path).exists()
    saved = handle(rt, "PUT", "household", {"household": draft()})
    assert saved["source"] == "saved"
    after = schedules_view(rt)
    assert after["rooms"] == preview["rooms"] and after["levels"] == preview["levels"]
    kitchen = by_id(after)["kitchen"]
    assert kitchen["people"] == [{"id": "sam", "name": "Sam"}]
    assert by_id(after)["lounge"]["source"] == "hand_written"
    assert read_saved(tmp_path) == household_section(rt.household)


def test_preview_notes_advice_with_paths(tmp_path):
    rt = make(tmp_path)
    raw = draft()
    raw["temperatures"]["night"] = 10
    raw["people"]["sam"]["weekdays"] = {"up": "07:00", "work": ["09:00-17:00"], "bed": "23:00"}
    notes = rt.setup.preview(rt, {"household": raw})["notes"]
    assert [n["path"] for n in notes] == ["household.temperatures.night", "household.people.sam"]
    assert notes[0]["message"].startswith("is 10°: below 12° walls and window frames")
    assert notes[1]["message"].startswith("has work hours but no office room")


def test_saving_hands_the_new_weeks_to_the_live_driver(tmp_path):
    rt = make(tmp_path)
    drv = rt.driver
    run_sync(rt.step())
    rt.set_away("home_worker", FRI_1800)
    old_kitchen = drv.site.schedule_for("kitchen")
    handle(rt, "PUT", "household", {"household": draft()})
    assert rt.household.people[0].id == "sam"
    assert "home_worker" not in rt.presence  # no longer in the household
    assert rt.away == frozenset()
    assert drv.site.schedule_for("kitchen") != old_kitchen
    assert drv.site.schedule_for("kitchen") == rt.setup.site.household_schedules["kitchen"]
    assert drv.site.live_schedule_for("kitchen") == rt.setup.site.household_live["kitchen"]
    assert drv.site.devices["lounge"].schedule == "lounge"
    # The schedule mirror writes the new week (logged only, in dry run).
    payload = drv.site.mirror_payload("kitchen")
    assert payload["weekly_schedule_monday"].startswith("00:00/15")
    assert any(d.code == "household.setup" for d in rt.decisions)
    assert drv.dry_run


def test_away_still_works_after_saving(tmp_path):
    rt = make(tmp_path)
    handle(rt, "PUT", "household", {"household": draft()})
    rt.set_away("sam", FRI_1800)
    assert rt.away == frozenset({"sam"})
    assert by_id(schedules_view(rt))["kitchen"]["away"]["text"].endswith("while Sam is away.")


def test_revert_goes_back_to_the_house_file(tmp_path):
    rt = make(tmp_path)
    handle(rt, "PUT", "household", {"household": draft()})
    assert saved_path(tmp_path).exists()
    view = handle(rt, "DELETE", "household")
    assert view["source"] == "house_file"
    assert not saved_path(tmp_path).exists()
    assert [p.id for p in rt.household.people] == ["early_riser", "home_worker"]
    site = parse_site(house_data(), env=ENV)
    assert rt.driver.site.schedule_for("kitchen") == site.schedule_for("kitchen")


def test_revert_with_no_household_in_the_house_file(tmp_path):
    data = house_data()
    del data["household"]
    data["schedules"]["default"] = "00:00/15 07:00/19 22:00/15"
    rt = make(tmp_path, data)
    assert rt.setup.view()["household"] is None
    assert rt.setup.view()["source"] is None
    handle(rt, "PUT", "household", {"household": draft()})
    assert rt.driver.site.devices["kitchen"].schedule is None
    view = handle(rt, "DELETE", "household")
    assert view["source"] is None and rt.household is None
    assert rt.driver.site.devices["kitchen"].schedule == "default"
    assert rt.driver.site.household_schedules == {}
    assert all(r["source"] == "hand_written" for r in schedules_view(rt)["rooms"])


def test_a_save_that_cannot_be_written_changes_nothing(tmp_path):
    blocked = tmp_path / "file"
    blocked.write_text("")
    rt = make(blocked)  # the data dir is a file: writing fails
    with pytest.raises(RequestError) as err:
        handle(rt, "PUT", "household", {"household": draft()})
    assert err.value.status == 500 and "Can't write" in err.value.body["message"]
    assert rt.household.people[0].id == "early_riser"


def test_apply_household_is_pure(tmp_path):
    site = parse_site(house_data(), env=ENV)
    hh = parse_household(draft(), site)
    applied = apply_household(site, hh, "saved")
    assert site.household.people[0].id == "early_riser"
    assert applied.household is hh and applied.file_household is site.file_household
    back = apply_household(applied, site.file_household, "house_file")
    assert back.devices == site.devices and back.notes == site.notes


# --- HTTP and the browser demo ----------------------------------------------------------


@pytest.fixture
async def client(tmp_path):
    rt = make(tmp_path)
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt = rt
        yield c


async def test_routes_need_the_token(client):
    assert (await client.get("/api/v1/household")).status == 401
    assert (await client.put("/api/v1/household", json={"household": draft()})).status == 401
    assert (await client.delete("/api/v1/household")).status == 401
    r = await client.post("/api/v1/household/preview", json={"household": draft()})
    assert r.status == 401


async def test_routes(client):
    view = await (await client.get("/api/v1/household", headers=H)).json()
    assert view["source"] == "house_file"
    r = await client.post("/api/v1/household/preview", json={"household": draft()}, headers=H)
    preview = await r.json()
    assert r.status == 200 and preview["errors"] == []
    bad = draft()
    bad["people"]["sam"]["weekdays"]["up"] = "7am"
    r = await client.put("/api/v1/household", json={"household": bad}, headers=H)
    assert r.status == 400
    assert (await r.json())["errors"][0]["path"] == "household.people.sam.weekdays.up"
    r = await client.put("/api/v1/household", json={"nope": 1}, headers=H)
    assert r.status == 400
    r = await client.put("/api/v1/household", json={"household": draft()}, headers=H)
    assert r.status == 200 and (await r.json())["source"] == "saved"
    weeks = await (await client.get("/api/v1/schedules", headers=H)).json()
    assert weeks["rooms"] == preview["rooms"]
    r = await client.delete("/api/v1/household", headers=H)
    assert r.status == 200 and (await r.json())["source"] == "house_file"


async def test_routes_without_a_setup_are_404(tmp_path):
    rt = make(tmp_path)
    rt.setup = None
    async with TestClient(TestServer(create_app(rt))) as c:
        assert (await c.get("/api/v1/household")).status == 404


def test_unheated_room_is_left_out_of_the_wizard(tmp_path):
    data = house_data()
    data["rooms"].append({"id": "landing", "role": "unheated", "sensor": "temp_landing"})
    rt = make(tmp_path, data)
    assert "landing" not in {r["id"] for r in rt.setup.view()["rooms"]}
    # A draft without it is complete; a draft that lists it is refused, with its path.
    assert rt.setup.preview(rt, {"household": draft()})["errors"] == []
    bad = draft()
    bad["rooms"]["landing"] = {"use": "in_use"}
    errors = rt.setup.preview(rt, {"household": bad})["errors"]
    assert {
        "path": "household.rooms.landing",
        "message": "an unheated room has no radiator, so it has no schedule",
    } in errors


def test_demo_bridge_saves_in_memory():
    demo = DemoSession()
    demo.step(2)

    def call(method, path, body=None):
        return json.loads(demo.request(method, path, json.dumps(body)))

    view = call("GET", "household")
    assert view["status"] == 200 and view["body"]["source"] is None
    assert view["body"]["saved_at"] is None
    rooms = [r["id"] for r in view["body"]["rooms"]]
    assert "stairs" not in rooms and len(rooms) == 8
    raw = {
        "people": {"sam": {"weekdays": {"up": "07:00", "bed": "23:00"}}},
        "rooms": {"lounge": {"use": "in_use"}, "bedroom_1": {"use": "nope"}},
    }
    out = call("PUT", "household", {"household": raw})
    assert out["status"] == 400
    assert out["body"]["errors"][0]["path"] == "household.rooms.bedroom_1.use"
    raw["rooms"]["bedroom_1"]["use"] = "unused"
    preview = call("POST", "household/preview", {"household": raw})["body"]
    assert call("PUT", "household", {"household": raw})["body"]["source"] == "saved"
    weeks = call("GET", "schedules")["body"]
    assert weeks["rooms"] == preview["rooms"]
    lounge = by_id(weeks)["lounge"]
    assert lounge["source"] == "household"
    assert by_id(weeks)["kitchen"]["source"] == "hand_written"
    # The simulated house follows the household's week from now on.
    demo.step(1)
    state = call("GET", "state")["body"]
    minute = state["minute_of_day"]
    sp = next(r["setpoint"] for r in state["rooms"] if r["id"] == "lounge")
    weekday = demo.rt.driver.wall_weekday()
    expected = next(
        t["setpoint"]
        for t in reversed(lounge["days"][weekday]["transitions"])
        if t["minute"] <= minute
    )
    assert sp == expected
    assert call("DELETE", "household")["body"]["source"] is None
    assert by_id(call("GET", "schedules")["body"])["lounge"]["source"] == "hand_written"
