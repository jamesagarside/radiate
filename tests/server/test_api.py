import pytest
from aiohttp.test_utils import TestClient, TestServer

from radiate.server.app import create_app
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.sim.reference import house_config


@pytest.fixture
async def client():
    rt = Runtime(house_config(), DemoDriver())
    for _ in range(5):
        await rt.step()
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt = rt
        yield c


H = {"Authorization": "Bearer secret"}


async def test_health_needs_no_token(client):
    r = await client.get("/api/v1/health")
    assert r.status == 200


async def test_token_required(client):
    assert (await client.get("/api/v1/state")).status == 401
    assert (
        await client.get("/api/v1/state", headers={"Authorization": "Bearer nope"})
    ).status == 401


async def test_house_and_state(client):
    house = await (await client.get("/api/v1/house", headers=H)).json()
    assert len(house["rooms"]) == 9
    assert {r["id"] for r in house["rooms"] if not r["controllable"]} == {"stairs"}
    state = await (await client.get("/api/v1/state", headers=H)).json()
    assert state["boiler"]["state"] in {"idle", "lead", "firing", "rest"}
    lounge = next(r for r in state["rooms"] if r["id"] == "lounge")
    assert "model" in lounge and "opening" in lounge
    assert lounge["valve"] == {"untrusted": False, "misses": 0}


async def test_setpoint_override_and_validation(client):
    r = await client.post("/api/v1/rooms/bedroom_1/setpoint", json={"setpoint": 21.5}, headers=H)
    assert r.status == 200
    assert client.rt.overrides["bedroom_1"] == 21.5
    assert (
        await client.post("/api/v1/rooms/bedroom_1/setpoint", json={"setpoint": 40}, headers=H)
    ).status == 400
    assert (
        await client.post("/api/v1/rooms/nope/setpoint", json={"setpoint": 20}, headers=H)
    ).status == 404
    await client.post("/api/v1/rooms/bedroom_1/setpoint", json={"setpoint": None}, headers=H)
    assert "bedroom_1" not in client.rt.overrides


async def test_fire_switch_reaches_the_core(client):
    await client.post("/api/v1/rooms/lounge/fire", json={"lit": True}, headers=H)
    await client.rt.step()
    assert client.rt.state.rooms["lounge"].dist.fire


async def test_mode_and_boost(client):
    assert (await client.post("/api/v1/mode", json={"mode": "frost"}, headers=H)).status == 200
    assert client.rt.mode.value == "frost"
    assert (await client.post("/api/v1/mode", json={"mode": "sauna"}, headers=H)).status == 400
    await client.post("/api/v1/store/boost", json={"minutes": 30}, headers=H)
    state = await (await client.get("/api/v1/state", headers=H)).json()
    assert state["store"]["boost"]


async def test_state_reports_minimum_off_and_short_cycling(client):
    boiler = (await (await client.get("/api/v1/state", headers=H)).json())["boiler"]
    assert boiler["min_off_s"] == 600 and boiler["short_cycle"] is None
    sc = client.rt.state.short_cycle
    sc.extra_off_s, sc.until = 300.0, client.rt.driver.clock() + 23.5 * 3600
    boiler = client.rt.describe()["boiler"]
    assert boiler["min_off_s"] == 900
    assert boiler["short_cycle"] == {"extra_off_min": 5, "ends_in_h": 23.5}


async def test_alerts_are_logged_once_when_they_appear():
    driver = DemoDriver()
    for room in driver.house.rooms.values():
        if room.radiator.trv is not None:
            room.radiator.trv.available = False  # every TRV unreachable: safe mode
    rt = Runtime(house_config(), driver)
    for _ in range(5):
        await rt.step()
    assert any(a.code == "safe_mode.no_trvs" for a in rt.last_actions.alerts)
    assert [d.code for d in rt.decisions].count("safe_mode.no_trvs") == 1


async def test_ingress_header_alone_does_not_bypass_token(client):
    r = await client.get("/api/v1/state", headers={"X-Ingress-Path": "/api/hassio_ingress/abc"})
    assert r.status == 401


async def test_ingress_trusted_only_from_supervisor_address():
    rt = Runtime(house_config(), DemoDriver())
    await rt.step()
    app = create_app(rt, token="secret", ingress_ip="127.0.0.1")
    async with TestClient(TestServer(app)) as c:
        r = await c.get("/api/v1/state", headers={"X-Ingress-Path": "/api/hassio_ingress/abc"})
        assert r.status == 200
