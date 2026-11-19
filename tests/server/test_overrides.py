"""Setpoint overrides: expiry at the next schedule change, durations, persistence."""

import pytest
from aiohttp.test_utils import TestClient, TestServer

from radiate.server import runtime as runtime_mod
from radiate.server.app import create_app
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.store import Store
from radiate.sim.reference import house_config

H = {"Authorization": "Bearer secret"}


@pytest.fixture
async def client():
    # The demo house starts at 05:30; bedrooms go from 16 to 20 °C at 06:30.
    rt = Runtime(house_config(), DemoDriver(start_hour=5.5))
    await rt.step()
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt = rt
        yield c


def room(state: dict, rid: str) -> dict:
    return next(r for r in state["rooms"] if r["id"] == rid)


async def post(client, rid, body):
    return await client.post(f"/api/v1/rooms/{rid}/setpoint", json=body, headers=H)


async def test_override_expires_at_next_schedule_change(client):
    r = await post(client, "bedroom_1", {"setpoint": 18.5})
    assert r.status == 200
    body = await r.json()
    assert body["ok"] and body["until"] == "next_change"
    assert 58 <= body["expires_in_min"] <= 60
    await client.rt.step()
    bed = room(client.rt.describe(), "bedroom_1")
    assert bed["setpoint"] == 18.5
    assert bed["override"]["until"] == "next_change"
    assert bed["override"]["setpoint"] == 18.5
    for _ in range(62):
        await client.rt.step()
    bed = room(client.rt.describe(), "bedroom_1")
    assert bed["override"] is None
    assert bed["setpoint"] == 20.0  # the schedule's 06:30 setpoint
    assert "bedroom_1" not in client.rt.overrides


async def test_override_for_a_duration(client):
    body = await (await post(client, "bedroom_2", {"setpoint": 22, "duration_min": 5})).json()
    assert body["until"] == "duration" and body["expires_in_min"] == 5
    for _ in range(3):
        await client.rt.step()
    assert room(client.rt.describe(), "bedroom_2")["override"]["expires_in_min"] in (2, 3)
    for _ in range(3):
        await client.rt.step()
    assert room(client.rt.describe(), "bedroom_2")["override"] is None


async def test_override_until_cleared(client):
    body = await (await post(client, "dining", {"setpoint": 19, "until": "cleared"})).json()
    assert body["until"] == "cleared" and body["expires_in_min"] is None
    for _ in range(90):
        await client.rt.step()
    assert room(client.rt.describe(), "dining")["override"]["setpoint"] == 19
    await post(client, "dining", {"setpoint": None})
    assert room(client.rt.describe(), "dining")["override"] is None


async def test_override_validation(client):
    for bad in (
        {"setpoint": 20, "until": "tomorrow"},
        {"setpoint": 20, "duration_min": 0},
        {"setpoint": 20, "duration_min": "soon"},
        {"setpoint": 20, "until": "duration"},
        {"setpoint": 20, "until": "cleared", "duration_min": 30},
    ):
        assert (await post(client, "bedroom_1", bad)).status == 400, bad
    assert "bedroom_1" not in client.rt.overrides


async def test_rooms_without_overrides_report_none(client):
    for r in client.rt.describe()["rooms"]:
        assert r["override"] is None


async def test_overrides_survive_a_restart(tmp_path, monkeypatch):
    wall = [1_000_000.0]
    monkeypatch.setattr(runtime_mod.time, "time", lambda: wall[0])
    store = Store(tmp_path / "r.db")
    rt = Runtime(house_config(), DemoDriver(start_hour=5.5), store=store)
    rt.restore()
    await rt.step()
    rt.set_override("bedroom_1", 18.5)  # until 06:30, about an hour
    rt.set_override("dining", 19.0, until="cleared")
    rt.set_override("bathroom", 23.0, minutes=10)
    await rt.stop()

    wall[0] += 20 * 60  # down for 20 minutes
    rt2 = Runtime(house_config(), DemoDriver(start_hour=5.5), store=store)
    rt2.restore()
    assert rt2.overrides == {"bedroom_1": 18.5, "dining": 19.0}
    assert rt2.override_meta["dining"].expires_at is None
    remaining = rt2.override_meta["bedroom_1"].expires_at - rt2.driver.clock()
    assert 38 * 60 <= remaining <= 40 * 60
