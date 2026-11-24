"""Fail warm presence at runtime (ADR-0005, spec 7): doubtful presence counts as home."""

import json
from datetime import datetime
from zoneinfo import ZoneInfo

import pytest
from aiohttp.test_utils import TestClient, TestServer

from radiate.config import parse_site
from radiate.core import Mode
from radiate.drivers.live import LiveDriver
from radiate.server import bridge
from radiate.server.app import create_app
from radiate.server.runtime import Runtime
from radiate.server.store import Store
from tests.server.test_away_runtime import (
    ENV,
    FRI_1800,
    WED_0600,
    Clocks,
    _publish,
    codes,
    feed,
    site_data,
)

TZ = ZoneInfo("Europe/London")
MIN = 60.0
H = {"Authorization": "Bearer secret"}
WED_1017 = datetime(2026, 11, 18, 10, 17, tzinfo=TZ).timestamp()


def iso(wall: float) -> str:
    return datetime.fromtimestamp(wall, TZ).isoformat()


def make(
    solo: bool = False,
    store: Store | None = None,
    clocks: Clocks | None = None,
    temperatures: dict | None = None,
    **away,
):
    """The household example; `solo` leaves the home worker as its only person."""
    data = site_data()
    hh = data["household"]
    if temperatures:
        hh["temperatures"].update(temperatures)
    if solo:
        del hh["people"]["early_riser"]
        hh["rooms"]["bedroom_1"]["people"] = ["home_worker"]
    if away:
        hh["away"] = away
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


def person(rt: Runtime, pid: str) -> dict:
    return next(p for p in rt.away_view()["people"] if p["id"] == pid)


async def test_the_incident_a_dead_phone_does_not_hold_the_house_at_frost():
    # One person. They leave at 10:17 and their phone dies; Home Assistant keeps the
    # person not_home with its update time frozen at 10:17, and the integration
    # re-reports that every 15 minutes, so the presence never goes stale.
    rt, drv, clocks = make(solo=True, clocks=Clocks(WED_1017))
    frozen = WED_1017
    uncertain_at = None
    tick = 0
    while clocks.wall <= datetime(2026, 11, 18, 22, 22, tzinfo=TZ).timestamp():
        if tick % 15 == 0:
            rt.report_presence("home_worker", "not_home", frozen, evidence_at=frozen)
        tick += 1
        feed(drv)
        await rt.step()
        assert rt.last_snapshot.mode is Mode.AUTO  # never frost on presence alone
        if uncertain_at is None and person(rt, "home_worker")["presence"]["uncertain"]:
            uncertain_at = clocks.wall
        clocks.advance(MIN)
    # Away by presence from 11:17 (the delay) until the trackers have been quiet for
    # four hours, then counted as home.
    assert uncertain_at == WED_1017 + 241 * MIN  # 14:18
    p = person(rt, "home_worker")
    assert not p["away"] and not rt.everyone_away
    assert p["presence"]["uncertain"] == "evidence_old"
    assert p["presence"]["evidence_at"] == "2026-11-18T10:17+00:00"
    assert "10:17" in p["presence"]["why"]
    assert codes(rt).count("away.presence_uncertain") == 1
    targets = {rid: rs.target for rid, rs in rt.state.rooms.items()}
    assert rt.cfg.boiler.frost_c not in targets.values()


async def test_a_fresh_source_counts_as_away_after_the_delay():
    rt, _, clocks = make()
    for _ in range(18):  # three hours, the tracker updating every 10 minutes
        rt.report_presence("home_worker", "not_home", WED_0600, evidence_at=clocks.wall)
        await rt.step()
        clocks.advance(10 * MIN)
    assert rt.away == {"home_worker"}
    assert person(rt, "home_worker")["presence"]["uncertain"] is None


async def test_without_evidence_at_away_lasts_at_most_the_max_age():
    rt, _, clocks = make()
    rt.report_presence("home_worker", "not_home", None)
    clocks.advance(59 * MIN)
    await rt.step()
    assert rt.away == frozenset()
    clocks.advance(MIN)
    rt.report_presence("home_worker", "not_home", None)
    await rt.step()
    assert rt.away == {"home_worker"}
    clocks.advance(180 * MIN)  # since + the evidence max age
    rt.report_presence("home_worker", "not_home", None)
    await rt.step()
    assert rt.away == {"home_worker"}
    clocks.advance(1)
    rt.report_presence("home_worker", "not_home", None)
    await rt.step()
    assert rt.away == frozenset()
    p = person(rt, "home_worker")
    assert p["presence"]["uncertain"] == "evidence_old" and p["presence"]["evidence_at"] is None


async def test_evidence_max_age_is_a_setting():
    rt, _, clocks = make(presence_evidence_max_age_min=30, presence_delay_min=0)
    rt.report_presence("home_worker", "not_home", None)
    assert rt.away == {"home_worker"}
    clocks.advance(31 * MIN)
    rt.report_presence("home_worker", "not_home", None)
    assert rt.away == frozenset()
    house = rt.house()["household"]
    assert house["away"]["presence_evidence_max_age_min"] == 30
    assert house["limits"]["away.presence_evidence_max_age_min"] == {
        "min": 30,
        "max": 1440,
        "unit": "min",
    }


def away_by_presence(rt: Runtime, clocks: Clocks) -> None:
    rt.report_presence("home_worker", "not_home", WED_0600 - 2 * 3600, evidence_at=clocks.wall)
    assert rt.away == {"home_worker"}


@pytest.mark.parametrize(
    "evidence",
    [
        lambda rt: bridge.handle(rt, "POST", "rooms/dining/setpoint", {"setpoint": 21}),
        lambda rt: bridge.handle(rt, "POST", "store/boost", {"minutes": 30}),
        lambda rt: bridge.handle(rt, "POST", "rooms/lounge/fire", {"lit": True}),
    ],
    ids=["override", "store_boost", "fire_switch"],
)
async def test_home_evidence_counts_as_home_until_presence_changes(evidence):
    rt, _, clocks = make()
    away_by_presence(rt, clocks)
    clocks.advance(MIN)
    evidence(rt)
    assert rt.away == frozenset()
    p = person(rt, "home_worker")
    assert p["presence"]["uncertain"] == "home_evidence" and p["presence"]["why"]
    await rt.step()
    assert codes(rt).count("away.home_evidence") == 1
    # The integration repeats not_home with a fresh tracker: still set aside, as the
    # presence has not changed since.
    clocks.advance(15 * MIN)
    rt.report_presence("home_worker", "not_home", WED_0600 - 2 * 3600, evidence_at=clocks.wall)
    assert rt.away == frozenset()
    # Home, then out again: the new not_home counts after the delay.
    clocks.advance(MIN)
    rt.report_presence("home_worker", "home", None, evidence_at=clocks.wall)
    clocks.advance(MIN)
    rt.report_presence("home_worker", "not_home", None, evidence_at=clocks.wall)
    left = clocks.wall
    clocks.advance(59 * MIN)
    rt.report_presence("home_worker", "not_home", left, evidence_at=clocks.wall)
    assert rt.away == frozenset()
    clocks.advance(MIN)
    rt.report_presence("home_worker", "not_home", left, evidence_at=clocks.wall)
    assert rt.away == {"home_worker"}


async def test_only_a_setpoint_raised_above_the_target_is_evidence():
    rt, _, clocks = make()
    away_by_presence(rt, clocks)
    rt.state.rooms["dining"].target = 20.0
    # An automation turning a room down, or holding it where it is, says nobody is in.
    bridge.handle(rt, "POST", "rooms/dining/setpoint", {"setpoint": 17})
    bridge.handle(rt, "POST", "rooms/dining/setpoint", {"setpoint": 20})
    assert rt.away == {"home_worker"}
    bridge.handle(rt, "POST", "rooms/dining/setpoint", {"setpoint": 20.5})
    assert rt.away == frozenset()


async def test_clearing_an_override_or_putting_out_a_fire_is_not_evidence():
    rt, _, clocks = make()
    away_by_presence(rt, clocks)
    bridge.handle(rt, "POST", "rooms/dining/setpoint", {"setpoint": None})
    bridge.handle(rt, "POST", "rooms/lounge/fire", {"lit": False})
    bridge.handle(rt, "POST", "store/boost", {"minutes": 0})
    assert rt.away == {"home_worker"}


async def test_a_shower_is_home_evidence():
    rt, drv, clocks = make()
    feed(drv)
    for _ in range(11):  # two hours of steady humidity for the shower median
        feed(drv)
        await rt.step()
        clocks.advance(MIN)
    away_by_presence(rt, clocks)
    reading = json.dumps({"temperature": 18.0, "humidity": 75}).encode()
    drv.handle_message(f"zigbee2mqtt/{drv.site.devices['bathroom'].sensor}", reading)
    actions = await rt.step()
    assert "disturbance.shower" in {r.code for r in actions.reasons}
    assert rt.away == frozenset()
    assert person(rt, "home_worker")["presence"]["uncertain"] == "home_evidence"


async def test_home_evidence_leaves_away_until_alone():
    rt, _, _ = make()
    rt.set_away("early_riser", FRI_1800)
    rt.note_home_evidence("override")
    assert rt.away == {"early_riser"}


async def test_everyone_away_by_presence_is_unused_never_frost():
    rt, drv, clocks = make()
    for pid in ("early_riser", "home_worker"):
        rt.report_presence(pid, "not_home", WED_0600 - 2 * 3600, evidence_at=clocks.wall)
    feed(drv)
    await rt.step()
    assert rt.everyone_away
    assert rt.effective_mode() is Mode.AUTO and rt.last_snapshot.mode is Mode.AUTO
    assert rt.away_view()["frost"] is False
    assert rt.state.rooms["dining"].target == 14.0  # the unused temperature
    assert codes(rt)[-1] == "away.everyone"
    assert "unused" in rt.decisions[-1].message


async def test_everyone_away_until_still_holds_frost():
    rt, drv, _ = make()
    rt.set_away("early_riser", FRI_1800)
    rt.set_away("home_worker", FRI_1800)
    feed(drv)
    await rt.step()
    assert rt.last_snapshot.mode is Mode.FROST and rt.away_view()["frost"]


async def test_one_away_until_and_one_by_presence_is_not_frost():
    rt, drv, clocks = make()
    rt.set_away("early_riser", FRI_1800)
    rt.report_presence("home_worker", "not_home", WED_0600 - 2 * 3600, evidence_at=clocks.wall)
    await rt.step()
    assert rt.everyone_away and rt.last_snapshot.mode is Mode.AUTO
    # The home worker sets an away until too: now frost.
    rt.set_away("home_worker", FRI_1800)
    await rt.step()
    assert rt.last_snapshot.mode is Mode.FROST


async def test_presence_round_trips_evidence_at_and_home_evidence(tmp_path):
    store = Store(tmp_path / "r.db")
    clocks = Clocks()
    rt, _, _ = make(store=store, clocks=clocks)
    rt.restore()
    rt.report_presence("home_worker", "not_home", WED_0600 - 3600, evidence_at=WED_0600 - 60)
    rt.note_home_evidence("override")
    await rt.stop()
    rt2, _, _ = make(store=store, clocks=clocks)
    rt2.restore()
    p = rt2.presence["home_worker"]
    assert p.evidence_at == WED_0600 - 60 and p.home_evidence_at == WED_0600
    # A save from before fail warm (no evidence_at or home_evidence_at) still loads.
    store.put(
        "away",
        {"people": {"home_worker": {"state": "not_home", "since": WED_0600, "reported_at": 1.0}}},
    )
    rt3, _, _ = make(store=store, clocks=clocks)
    rt3.restore()
    p = rt3.presence["home_worker"]
    assert p.state == "not_home" and p.evidence_at is None and p.home_evidence_at is None


# --- API -------------------------------------------------------------------------------


@pytest.fixture
async def client():
    rt, _, clocks = make()
    await rt.step()
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt, c.clocks = rt, clocks
        yield c


async def test_post_presence_accepts_evidence_at(client):
    url = "/api/v1/people/home_worker/presence"
    body = {"state": "not_home", "since": iso(WED_0600 - 3 * 3600), "evidence_at": iso(WED_0600)}
    r = await client.post(url, json=body, headers=H)
    assert r.status == 200
    presence = (await r.json())["person"]["presence"]
    assert presence == {
        "state": "not_home",
        "since": "2026-11-18T03:00+00:00",
        "stale": False,
        "evidence_at": "2026-11-18T06:00+00:00",
        "source_type": None,
        "battery": None,
        "uncertain": None,
        "why": None,
    }
    # A tracker five hours quiet: counted as home, and the people view says why.
    body["evidence_at"] = iso(WED_0600 - 5 * 3600)
    body["since"] = iso(WED_0600 - 6 * 3600)
    await client.post(url, json=body, headers=H)
    people = await (await client.get("/api/v1/people", headers=H)).json()
    p = next(x for x in people["people"] if x["id"] == "home_worker")
    assert not p["away"] and p["presence"]["uncertain"] == "evidence_old"
    assert p["presence"]["why"]
    # A time in the future is taken as now, as for since.
    body["evidence_at"] = iso(WED_0600 + 3600)
    person_body = (await (await client.post(url, json=body, headers=H)).json())["person"]
    assert person_body["presence"]["evidence_at"] == "2026-11-18T06:00+00:00"


async def test_post_presence_without_evidence_at_still_works(client):
    url = "/api/v1/people/home_worker/presence"
    r = await client.post(url, json={"state": "not_home"}, headers=H)
    assert r.status == 200
    assert (await r.json())["person"]["presence"]["evidence_at"] is None


async def test_post_presence_rejects_a_malformed_evidence_at(client):
    url = "/api/v1/people/home_worker/presence"
    for bad in ("yesterday", 1800000000, True):
        r = await client.post(url, json={"state": "not_home", "evidence_at": bad}, headers=H)
        assert r.status == 400, bad
        assert "evidence_at" in await r.text()
    assert "home_worker" not in client.rt.presence


async def test_post_presence_takes_source_type_and_battery(client):
    url = "/api/v1/people/home_worker/presence"
    body = {"state": "not_home", "evidence_at": iso(WED_0600), "source_type": "router"}
    body["battery"] = 80
    person_body = (await (await client.post(url, json=body, headers=H)).json())["person"]
    assert person_body["presence"]["source_type"] == "router"
    assert person_body["presence"]["battery"] == 80
    for bad in ({"source_type": "Router!"}, {"source_type": 3}, {"battery": 101}, {"battery": "x"}):
        r = await client.post(url, json={"state": "not_home", **bad}, headers=H)
        assert r.status == 400, bad


async def test_a_router_tracker_waits_the_weak_source_delay():
    rt, _, clocks = make()
    left = clocks.wall
    rt.report_presence("home_worker", "not_home", left, evidence_at=left, source_type="router")
    clocks.advance(3 * 3600)
    rt.report_presence("home_worker", "not_home", left, evidence_at=clocks.wall)
    assert rt.away == frozenset()  # the source type is kept from the first report
    clocks.advance(3600)
    rt.report_presence("home_worker", "not_home", left, evidence_at=clocks.wall)
    assert rt.away == {"home_worker"}


async def test_im_home_holds_until_presence_changes(client):
    rt, clocks = client.rt, client.clocks
    rt.report_presence("home_worker", "not_home", WED_0600 - 2 * 3600, evidence_at=clocks.wall)
    rt.set_away("early_riser", FRI_1800)
    assert rt.away == {"home_worker", "early_riser"}
    for pid in ("home_worker", "early_riser"):
        r = await client.post(f"/api/v1/people/{pid}/home", json={}, headers=H)
        assert r.status == 200
        p = (await r.json())["person"]
        assert not p["away"] and p["home_at"] == "2026-11-18T06:00+00:00"
    assert rt.away == frozenset() and rt.presence["early_riser"].away_until is None
    worker = person(rt, "home_worker")
    assert worker["presence"]["uncertain"] == "said_home" and worker["presence"]["why"]
    assert "away.home" in codes(rt)
    # The heartbeat repeats the same not_home with fresh evidence: still home.
    clocks.advance(15 * MIN)
    rt.report_presence("home_worker", "not_home", WED_0600 - 2 * 3600, evidence_at=clocks.wall)
    assert rt.away == frozenset()
    # Back, then out again: presence counts after the delay as usual.
    rt.report_presence("home_worker", "home", None, evidence_at=clocks.wall)
    clocks.advance(MIN)
    rt.report_presence("home_worker", "not_home", None, evidence_at=clocks.wall)
    clocks.advance(60 * MIN)
    rt.report_presence("home_worker", "not_home", None, evidence_at=clocks.wall)
    assert rt.away == {"home_worker"}
    r = await client.post("/api/v1/people/nobody/home", json={}, headers=H)
    assert r.status == 404


async def test_im_home_survives_a_restart(tmp_path):
    store = Store(tmp_path / "r.db")
    clocks = Clocks()
    rt, _, _ = make(store=store, clocks=clocks)
    rt.restore()
    rt.say_home("early_riser")
    rt2, _, _ = make(store=store, clocks=clocks)
    rt2.restore()
    assert rt2.presence["early_riser"].home_at == WED_0600


async def test_an_override_wins_over_the_frost_hold():
    rt, drv, _ = make()
    rt.set_away("early_riser", FRI_1800)
    rt.set_away("home_worker", FRI_1800)
    feed(drv)
    await rt.step()
    assert rt.last_snapshot.mode is Mode.FROST
    rt.set_override("lounge", 20.0, until="cleared")
    await rt.step()
    # Everyone is still away until Friday, but the lounge has its override.
    assert rt.frost_held() and rt.away_view()["frost"]
    assert rt.last_snapshot.mode is Mode.AUTO
    assert rt.state.rooms["lounge"].target == 20.0
    assert rt.state.rooms["dining"].target == rt.cfg.boiler.frost_c


async def test_away_from_presence_stops_at_the_damp_floor():
    temps = {"unused": 10}
    rt, drv, clocks = make(solo=True, temperatures=temps, everyone_away="unused")
    rt.report_presence("home_worker", "not_home", WED_0600 - 2 * 3600, evidence_at=clocks.wall)
    feed(drv)
    await rt.step()
    assert rt.away == {"home_worker"}
    # 06:00: the routine has the dining room at the night temperature, 14. Away from
    # presence would drop it to the unused 10; the damp floor keeps it at 12.
    assert rt.last_snapshot.rooms["dining"].setpoint == 12.0
    # An away until is the person's choice: the unused temperature as set.
    rt.set_away("home_worker", FRI_1800)
    await rt.step()
    assert rt.last_snapshot.rooms["dining"].setpoint == 10.0
