"""`GET /api/v1/devices` and `POST /api/v1/devices/scan`, on the demo house and through
the browser demo's bridge."""

import json

import pytest
from aiohttp.test_utils import TestClient, TestServer

from radiate.server.app import create_app
from radiate.server.bridge import DemoSession
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.sim.reference import house_config

H = {"Authorization": "Bearer secret"}


@pytest.fixture
async def client():
    rt = Runtime(house_config(), DemoDriver())
    for _ in range(3):
        await rt.step()
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt = rt
        yield c


async def test_devices_needs_a_token(client):
    assert (await client.get("/api/v1/devices")).status == 401
    assert (await client.post("/api/v1/devices/scan")).status == 401


async def test_demo_devices_show_every_kind_of_problem(client):
    body = await (await client.get("/api/v1/devices", headers=H)).json()
    devices = {d["id"]: d for d in body["devices"]}
    kinds = {d["kind"] for d in body["devices"]}
    assert kinds == {"trv", "sensor", "router", "relay"}
    # Eight TRVs, eight room sensors (the toilet has none), two routers and the relay.
    assert sum(d["kind"] == "trv" for d in body["devices"]) == 8
    assert sum(d["kind"] == "sensor" for d in body["devices"]) == 8
    assert devices["trv_bedroom_3"]["battery_low"]
    assert devices["temp_bathroom"]["signal"] == "weak"
    assert devices["plug_garage"]["status"] == "offline"
    assert body["summary"]["attention"] == 3
    assert body["summary"]["offline"] == 1
    trv = devices["trv_lounge"]
    assert trv["valve"]["mode"] == "auto" and trv["firmware"] == "1.3.0"
    assert trv["temperature_c"] is not None and trv["route"] is None
    assert devices["temp_bathroom"]["humidity_pct"] is not None
    for d in body["devices"]:
        assert d["status"] in {"ok", "attention", "offline"}
        assert d["signal"] in {None, "weak", "fair", "strong"}
    # The same problems reach the overview as alerts.
    state = await (await client.get("/api/v1/state", headers=H)).json()
    codes = {(a["code"], a["room_id"]) for a in state["alert_details"]}
    assert ("device.low_battery", "bedroom_3") in codes
    assert ("device.weak_signal", "bathroom") in codes
    assert ("device.offline", None) in codes


async def test_scan_then_rate_limit(client):
    r = await client.post("/api/v1/devices/scan", headers=H)
    assert r.status == 200
    assert (await r.json())["scan"]["state"] == "scanning"
    busy = await client.post("/api/v1/devices/scan", json={}, headers=H)
    assert busy.status == 409
    assert (await busy.json())["message"] == "a network scan is already running"
    await client.rt.step()
    body = await (await client.get("/api/v1/devices", headers=H)).json()
    assert body["scan"]["state"] == "done"
    devices = {d["id"]: d for d in body["devices"]}
    assert devices["trv_bedroom_1"]["route"]["via"] == "plug_landing"
    assert devices["trv_lounge"]["route"]["via_kind"] == "coordinator"
    assert devices["plug_garage"]["route"] is None
    soon = await client.post("/api/v1/devices/scan", headers=H)
    assert soon.status == 429
    refused = await soon.json()
    assert 0 < refused["retry_in_s"] <= 600
    bad = await client.post("/api/v1/devices/scan", data="[]", headers=H)
    assert bad.status == 400


class Plain:
    """A driver that reports no devices."""

    name = "plain"

    def __init__(self):
        self.inner = DemoDriver()

    async def snapshot(self, *args):
        return await self.inner.snapshot(*args)

    async def apply(self, actions):
        await self.inner.apply(actions)

    def clock(self):
        return self.inner.clock()

    def wall_minutes(self):
        return self.inner.wall_minutes()

    def telemetry(self):
        return {}


async def test_driver_without_devices_answers_404():
    rt = Runtime(house_config(), Plain())
    await rt.step()
    async with TestClient(TestServer(create_app(rt))) as c:
        assert (await c.get("/api/v1/devices")).status == 404
        assert (await c.post("/api/v1/devices/scan")).status == 404


def test_browser_demo_answers_the_same():
    s = DemoSession()
    s.step(2)
    got = json.loads(s.request("GET", "devices"))
    assert got["status"] == 200 and got["body"]["summary"]["total"] == 19
    assert json.loads(s.request("POST", "devices/scan", "{}"))["status"] == 200
    assert json.loads(s.request("POST", "devices/scan", "null"))["status"] == 409
    s.step(1)
    done = json.loads(s.request("GET", "devices"))["body"]["scan"]
    assert done["state"] == "done"
    assert json.loads(s.request("POST", "devices/scan"))["status"] == 429
