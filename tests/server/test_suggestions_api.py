"""`GET /api/v1/suggestions`, on the demo house and through the browser demo's bridge."""

import json

import pytest
from aiohttp.test_utils import TestClient, TestServer

from radiate.server.app import create_app
from radiate.server.bridge import DemoSession
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.suggestions import _links, _warmest
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


async def test_suggestions_need_a_token(client):
    assert (await client.get("/api/v1/suggestions")).status == 401


async def test_a_new_demo_house_is_still_learning(client):
    body = await (await client.get("/api/v1/suggestions", headers=H)).json()
    assert set(body) == {"summary", "suggestions", "learning", "settings"}
    statuses = {r["room_id"]: r["status"] for r in body["learning"]}
    assert statuses["toilet"] == statuses["kitchen"] == "not_judged"
    others = {s for rid, s in statuses.items() if rid not in ("toilet", "kitchen")}
    assert others == {"learning"}
    assert body["summary"]["rooms_ready"] == 0
    # Only the bathroom sensor's weak signal, which needs no learning.
    assert [s["kind"] for s in body["suggestions"]] == ["zigbee.weak_link"]
    weak = body["suggestions"][0]
    assert weak["room_id"] == "bathroom" and weak["confidence"] == "low"
    assert body["settings"]["min_learning_h"] == 48


async def test_after_a_scan_the_weak_link_names_its_router(client):
    await client.post("/api/v1/devices/scan", headers=H)
    await client.rt.step()
    body = await (await client.get("/api/v1/suggestions", headers=H)).json()
    weak = body["suggestions"][0]
    assert weak["id"] == "zigbee.weak_link:plug_landing"
    assert "the router plug_landing" in weak["action"]


async def test_warmest_setpoints_come_from_the_weeks(client):
    warmest = _warmest(client.rt)
    assert warmest["bathroom"] == 21.0 and warmest["bedroom_1"] == 20.0
    links, weak = _links(client.rt.devices_view())
    assert weak == 40
    assert "boiler_relay" not in {d.id for d in links}  # Wi-Fi, not Zigbee
    assert _links(None) == ([], 40.0)


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


async def test_a_driver_without_devices_still_has_suggestions():
    rt = Runtime(house_config(), Plain())
    await rt.step()
    async with TestClient(TestServer(create_app(rt))) as c:
        body = await (await c.get("/api/v1/suggestions")).json()
        assert body["suggestions"] == []
        assert len(body["learning"]) == 8


def test_browser_demo_answers_the_same():
    s = DemoSession()
    s.step(2)
    got = json.loads(s.request("GET", "suggestions"))
    assert got["status"] == 200
    assert got["body"]["summary"]["rooms_learning"] == 6
