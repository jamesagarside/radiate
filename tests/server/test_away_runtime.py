"""Away at runtime: recompiling the household, everyone away, persistence and the API."""

import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
import yaml
from aiohttp.test_utils import TestClient, TestServer

from radiate.config import parse_site
from radiate.config.household import compile_household
from radiate.core import Mode
from radiate.drivers.live import LiveDriver
from radiate.server import bridge
from radiate.server.app import create_app
from radiate.server.runtime import Runtime
from radiate.server.store import Store

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
TZ = ZoneInfo("Europe/London")
# Wednesday 18 November 2026, 06:00 in London.
WED_0600 = datetime(2026, 11, 18, 6, 0, tzinfo=TZ).timestamp()
FRI_1800 = datetime(2026, 11, 20, 18, 0, tzinfo=TZ).timestamp()
MIN = 60.0
H = {"Authorization": "Bearer secret"}

# Bedroom 1 (the pilot valve) with the home worker away on a weekday.
BEDROOM_1_EARLY_RISER_ONLY = "00:00/14 06:00/19 07:00/14 21:30/19 22:30/14"


def site_data() -> dict:
    """The household example, with the lounge on a hand-written schedule."""
    data = yaml.safe_load(EXAMPLE.read_text())
    del data["household"]["rooms"]["lounge"]
    data["schedules"] = {"lounge": "00:00/16 18:00/20"}
    lounge = next(r for r in data["rooms"] if r["id"] == "lounge")
    lounge["schedule"] = "lounge"
    del data["shelly"]
    return data


class Clocks:
    def __init__(self, wall: float = WED_0600):
        self.mono = 1000.0
        self.wall = wall

    def advance(self, seconds: float) -> None:
        self.mono += seconds
        self.wall += seconds


async def _publish(topic, payload):
    return True


def make(store: Store | None = None, clocks: Clocks | None = None, **site_over):
    data = site_data()
    data["household"].update(site_over)
    site = parse_site(data, env=ENV)
    clocks = clocks or Clocks()
    drv = LiveDriver(site, _publish, clock=lambda: clocks.mono, wall=lambda: clocks.wall)
    rt = Runtime(
        site.house,
        drv,
        store=store,
        household=site.household,
        timezone=site.timezone,
        wall=lambda: clocks.wall,
    )
    return rt, drv, clocks


def feed(drv: LiveDriver) -> None:
    """Every device reporting, so the valves are reachable and get written."""
    for rc in drv.cfg.rooms:
        dev = drv.site.devices[rc.id]
        if dev.sensor:
            reading = json.dumps({"temperature": 18.0, "humidity": 55}).encode()
            drv.handle_message(f"zigbee2mqtt/{dev.sensor}", reading)
        if dev.trv:
            trv = {"local_temperature": 18.5, "running_state": "idle", "system_mode": "auto"}
            drv.handle_message(f"zigbee2mqtt/{dev.trv}", json.dumps(trv).encode())
            drv.handle_message(f"zigbee2mqtt/{dev.trv}/availability", b'{"state":"online"}')


def wednesday(drv: LiveDriver, room_id: str) -> str:
    return drv.site.schedule_for(room_id).days[2].trvzb()


def codes(rt: Runtime) -> list[str]:
    return [d.code for d in rt.decisions if d.code.startswith("away.")]


async def test_someone_away_recompiles_and_the_mirror_follows():
    rt, drv, clocks = make()
    feed(drv)
    await rt.step()
    normal = compile_household(rt.household).schedules
    assert wednesday(drv, "bedroom_1") == normal["bedroom_1"].days[2].trvzb()
    lounge = drv.site.schedule_for("lounge")
    drv.intended.clear()

    rt.set_away("home_worker", FRI_1800)
    assert rt.away == {"home_worker"}
    assert wednesday(drv, "bedroom_1") == BEDROOM_1_EARLY_RISER_ONLY
    assert wednesday(drv, "bedroom_3") == "00:00/14"
    assert drv.site.schedule_for("lounge") == lounge  # hand-written: unchanged
    assert not rt.everyone_away and rt.effective_mode() is Mode.AUTO

    clocks.advance(MIN)
    await rt.step()
    await drv.drain()
    # Dry run: the new week is an intended write to the pilot valve, nothing is sent.
    writes = [p for _, t, p in drv.intended if t == "zigbee2mqtt/trv_bedroom_1/set"]
    assert writes and writes[-1]["weekly_schedule_wednesday"] == BEDROOM_1_EARLY_RISER_ONLY
    assert drv.published == 0
    assert codes(rt) == ["away.schedules"]

    rt.clear_away("home_worker")
    assert rt.away == frozenset()
    assert wednesday(drv, "bedroom_1") == normal["bedroom_1"].days[2].trvzb()


async def test_presence_counts_after_the_delay():
    rt, drv, clocks = make()
    rt.report_presence("home_worker", "not_home", None)
    await rt.step()
    assert rt.away == frozenset()
    clocks.advance(59 * MIN)
    await rt.step()
    assert rt.away == frozenset()
    clocks.advance(MIN)
    await rt.step()
    assert rt.away == {"home_worker"}
    assert wednesday(drv, "bedroom_3") == "00:00/14"
    person = next(p for p in rt.describe()["away"]["people"] if p["id"] == "home_worker")
    assert person["away"] and person["reason"] == "presence"
    assert person["presence"] == {"state": "not_home", "since": "2026-11-18T06:00+00:00"}
    # Back home: counts at once, no delay.
    rt.report_presence("home_worker", "home", None)
    assert rt.away == frozenset()


async def test_presence_delay_comes_from_the_house_file():
    rt, _, clocks = make(presence_delay_min=0)
    rt.report_presence("home_worker", "not_home", None)
    assert rt.away == {"home_worker"}


async def test_everyone_away_holds_frost_until_a_preheat_before_the_return():
    rt, drv, clocks = make()
    rt.set_away("early_riser", FRI_1800)
    rt.set_away("home_worker", FRI_1800 + 3 * 3600)
    await rt.step()
    assert rt.everyone_away and rt.mode is Mode.AUTO
    assert rt.effective_mode() is Mode.FROST
    assert rt.last_snapshot.mode is Mode.FROST
    state = rt.describe()
    assert state["mode"] == "auto"  # the user's choice is untouched
    assert state["away"]["everyone"] and state["away"]["frost"]
    assert {d.code for d in rt.decisions} >= {"away.everyone"}
    targets = {r["id"]: r["target"] for r in state["rooms"] if "target" in r}
    assert set(targets.values()) == {rt.cfg.boiler.frost_c}

    # Friday 17:29: still away. 17:30, the preheat before the first return: auto again.
    clocks.advance(FRI_1800 - 30 * MIN - clocks.wall - MIN)
    await rt.step()
    assert rt.everyone_away
    clocks.advance(MIN)
    await rt.step()
    assert not rt.everyone_away
    assert rt.effective_mode() is Mode.AUTO and rt.last_snapshot.mode is Mode.AUTO
    assert rt.away == {"home_worker"}
    assert codes(rt)[-1] == "away.ended"
    early = next(p for p in rt.describe()["away"]["people"] if p["id"] == "early_riser")
    # Due back at 18:00: no longer counted as away, so their rooms warm up.
    assert not early["away"] and early["until"] == "2026-11-20T18:00+00:00"
    clocks.advance(30 * MIN)
    await rt.step()
    assert "early_riser" not in rt.presence  # cleared itself at 18:00


@pytest.mark.parametrize("mode", [Mode.OFF, Mode.FROST])
async def test_a_mode_the_user_set_still_wins(mode):
    rt, _, _ = make()
    rt.mode = mode
    rt.set_away("early_riser", FRI_1800)
    rt.set_away("home_worker", FRI_1800)
    await rt.step()
    assert rt.everyone_away
    assert rt.effective_mode() is mode and rt.last_snapshot.mode is mode
    assert rt.describe()["away"]["frost"] is False
    # Back to auto with everyone still away: frost protection.
    rt.mode = Mode.AUTO
    await rt.step()
    assert rt.last_snapshot.mode is Mode.FROST


async def test_presence_only_stays_away_until_someone_is_home():
    rt, _, clocks = make()
    for pid in ("early_riser", "home_worker"):
        rt.report_presence(pid, "not_home", WED_0600 - 3 * 3600)
    await rt.step()
    assert rt.everyone_away
    clocks.advance(5 * 86400)
    await rt.step()
    assert rt.everyone_away
    rt.report_presence("early_riser", "home", None)
    await rt.step()
    assert not rt.everyone_away and rt.last_snapshot.mode is Mode.AUTO


async def test_arriving_home_ends_away_until_early():
    rt, _, clocks = make()
    rt.report_presence("home_worker", "home", WED_0600 - 3600)
    rt.set_away("home_worker", FRI_1800)  # set before leaving: still at home
    assert rt.away == {"home_worker"}
    clocks.advance(2 * 3600)
    rt.report_presence("home_worker", "not_home", None)
    clocks.advance(24 * 3600)
    rt.report_presence("home_worker", "home", None)  # back a day early
    assert rt.away == frozenset()
    assert rt.presence["home_worker"].away_until is None


async def test_away_survives_a_restart_and_expired_entries_clear(tmp_path):
    store = Store(tmp_path / "r.db")
    clocks = Clocks()
    rt, _, _ = make(store, clocks)
    rt.restore()
    rt.set_away("early_riser", FRI_1800)
    rt.set_away("home_worker", WED_0600 + 2 * 3600)
    rt.report_presence("home_worker", "not_home", WED_0600 - 3600)
    await rt.stop()

    clocks.advance(4 * 3600)  # down for four hours: the home worker's away until ended
    rt2, drv2, _ = make(store, clocks)
    rt2.restore()
    assert rt2.presence["early_riser"].away_until == FRI_1800
    await rt2.step()
    assert rt2.presence["home_worker"].away_until is None
    assert rt2.presence["home_worker"].state == "not_home"
    assert rt2.everyone_away and rt2.last_snapshot.mode is Mode.FROST
    assert wednesday(drv2, "bedroom_3") == "00:00/14"
    saved = store.get("away")[0]["people"]
    assert saved["home_worker"]["away_until"] is None


def test_restore_ignores_bad_and_unknown_entries(tmp_path):
    store = Store(tmp_path / "r.db")
    store.put(
        "away",
        {
            "people": {
                "nobody": {"away_until": FRI_1800, "set_at": WED_0600},
                "early_riser": {"away_until": "soon", "state": "at_work", "since": 1.0},
                "home_worker": {"away_until": FRI_1800, "set_at": WED_0600, "state": "home"},
            }
        },
    )
    rt, _, _ = make(store)
    rt.restore()
    assert set(rt.presence) == {"home_worker"}
    assert rt.presence["home_worker"].state is None


async def test_unknown_person_and_bad_times():
    rt, _, _ = make()
    with pytest.raises(KeyError):
        rt.set_away("nobody", FRI_1800)
    with pytest.raises(ValueError, match="future"):
        rt.set_away("early_riser", WED_0600 - 1)
    with pytest.raises(ValueError, match="60 days"):
        rt.set_away("early_riser", WED_0600 + 61 * 86400)
    with pytest.raises(ValueError, match="home or not_home"):
        rt.report_presence("early_riser", "work", None)


async def test_a_house_without_a_household_has_no_people():
    data = site_data()
    del data["household"]
    data["schedules"]["default"] = "00:00/16"
    for room in data["rooms"]:
        room.setdefault("schedule", "default")
    site = parse_site(data, env=ENV)
    rt = Runtime(site.house, LiveDriver(site, _publish), timezone=site.timezone)
    await rt.step()
    assert rt.describe()["away"]["people"] == [] and rt.house()["people"] == []
    assert rt.effective_mode() is Mode.AUTO


# --- API -------------------------------------------------------------------------------


@pytest.fixture
async def client():
    rt, drv, clocks = make()
    await rt.step()
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt, c.clocks = rt, clocks
        yield c


async def test_people_routes_need_the_token(client):
    assert (await client.get("/api/v1/people")).status == 401
    r = await client.post("/api/v1/people/early_riser/away", json={"until": "2026-11-20"})
    assert r.status == 401
    r = await client.post("/api/v1/people/early_riser/presence", json={"state": "home"})
    assert r.status == 401


async def test_people_house_and_state(client):
    house = await (await client.get("/api/v1/house", headers=H)).json()
    assert house["people"] == [
        {"id": "early_riser", "name": "Early riser"},
        {"id": "home_worker", "name": "Home worker"},
    ]
    people = await (await client.get("/api/v1/people", headers=H)).json()
    assert people["everyone"] is False and people["presence_delay_min"] == 60
    assert people["today"] == "2026-11-18"
    assert people["people"][0] == {
        "id": "early_riser",
        "name": "Early riser",
        "away": False,
        "reason": None,
        "until": None,
        "presence": None,
    }
    state = await (await client.get("/api/v1/state", headers=H)).json()
    assert state["away"] == people


async def test_set_and_clear_away(client):
    url = "/api/v1/people/home_worker/away"
    r = await client.post(url, json={"until": "2026-11-20T18:00"}, headers=H)
    assert r.status == 200
    body = await r.json()
    assert body["person"]["away"] and body["person"]["until"] == "2026-11-20T18:00+00:00"
    assert client.rt.away == {"home_worker"}
    # A date on its own is the start of that day.
    body = await (await client.post(url, json={"until": "2026-11-21"}, headers=H)).json()
    assert body["person"]["until"] == "2026-11-21T00:00+00:00"
    body = await (await client.post(url, json={"until": None}, headers=H)).json()
    assert body["person"]["away"] is False and body["person"]["until"] is None
    assert client.rt.away == frozenset()


async def test_away_validation(client):
    url = "/api/v1/people/home_worker/away"
    for bad, text in (
        ({}, "until is required"),
        ({"until": "Tuesday"}, "ISO 8601"),
        ({"until": 1800000000}, "ISO 8601"),
        ({"until": "2026-11-17T12:00"}, "in the future"),
        ({"until": "2027-11-20"}, "within 60 days"),
    ):
        r = await client.post(url, json=bad, headers=H)
        assert r.status == 400, bad
        assert text in await r.text()
    r = await client.post("/api/v1/people/nobody/away", json={"until": "2026-11-20"}, headers=H)
    assert r.status == 404
    assert client.rt.presence == {}


async def test_report_presence(client):
    url = "/api/v1/people/early_riser/presence"
    body = {"state": "not_home", "since": "2026-11-18T04:30:00+00:00"}
    r = await client.post(url, json=body, headers=H)
    assert r.status == 200
    person = (await r.json())["person"]
    assert person["away"] and person["reason"] == "presence"
    assert person["presence"] == {"state": "not_home", "since": "2026-11-18T04:30+00:00"}
    # A time in the future is taken as now.
    body = {"state": "home", "since": "2026-11-19T00:00"}
    person = (await (await client.post(url, json=body, headers=H)).json())["person"]
    assert person["presence"]["since"] == "2026-11-18T06:00+00:00"
    for bad in ({}, {"state": "away"}, {"state": "home", "since": "later"}):
        assert (await client.post(url, json=bad, headers=H)).status == 400, bad
    await client.post(url, json={"state": None}, headers=H)
    assert "early_riser" not in client.rt.presence


async def test_bridge_handles_people_routes_for_the_demo_transport():
    rt, _, _ = make()
    assert bridge.handle(rt, "GET", "people")["people"][1]["id"] == "home_worker"
    out = bridge.handle(rt, "POST", "people/home_worker/away", {"until": "2026-11-19T09:00"})
    assert out["person"]["away"]
    out = bridge.handle(rt, "POST", "people/home_worker/presence", {"state": "home"})
    assert out["person"]["presence"]["state"] == "home"
    with pytest.raises(bridge.RequestError) as err:
        bridge.handle(rt, "POST", "people/nobody/away", {"until": None})
    assert err.value.status == 404
    json.dumps(rt.describe())  # the whole state stays JSON-ready
