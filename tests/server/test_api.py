import pytest
from aiohttp import WSMsgType
from aiohttp.test_utils import TestClient, TestServer

from radiate.server import app as app_module
from radiate.server.app import WS_UNAUTHORISED, create_app
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


async def test_state_tells_burn_extension_from_heat_sink(client):
    state = await (await client.get("/api/v1/state", headers=H)).json()
    assert all(r["extend"] is False for r in state["rooms"] if r["role"] != "passive")
    assert "extend" not in next(r for r in state["rooms"] if r["role"] == "passive")
    rooms = client.rt.state.rooms
    rooms["dining"].topup = rooms["dining"].extend = True
    rooms["bedroom_2"].topup, rooms["bedroom_2"].extend = True, False
    by_id = {r["id"]: r for r in client.rt.describe()["rooms"]}
    assert (by_id["dining"]["topup"], by_id["dining"]["extend"]) == (True, True)
    assert (by_id["bedroom_2"]["topup"], by_id["bedroom_2"]["extend"]) == (True, False)


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


async def test_bad_bodies_are_400_not_500(client):
    r = await client.post("/api/v1/store/boost", json={"minutes": "lots"}, headers=H)
    assert r.status == 400
    r = await client.post("/api/v1/mode", data="{bad", headers=H)
    assert r.status == 400
    r = await client.post("/api/v1/rooms/nope/fire", data="{bad", headers=H)
    assert r.status == 404


async def test_non_ascii_token_is_401_not_500(client):
    r = await client.get("/api/v1/state", headers={"Authorization": "Bearer café"})
    assert r.status == 401


async def test_stream_accepts_the_bearer_header(client):
    async with client.ws_connect("/api/v1/stream", headers=H) as ws:
        state = await ws.receive_json(timeout=5)
        assert "boiler" in state


async def test_stream_accepts_the_token_as_first_message(client, caplog):
    caplog.set_level("DEBUG")
    async with client.ws_connect("/api/v1/stream") as ws:
        await ws.send_json({"token": "secret"})
        state = await ws.receive_json(timeout=5)
        assert "rooms" in state
    assert "secret" not in caplog.text


async def test_stream_closes_on_a_wrong_token(client):
    async with client.ws_connect("/api/v1/stream") as ws:
        await ws.send_json({"token": "nope"})
        msg = await ws.receive(timeout=5)
        assert msg.type == WSMsgType.CLOSE
        assert ws.close_code == WS_UNAUTHORISED


@pytest.mark.parametrize("first", ["secret", "[]", '{"token": 1}', '{"token": "café"}'])
async def test_stream_rejects_malformed_handshakes(client, first):
    async with client.ws_connect("/api/v1/stream") as ws:
        await ws.send_str(first)
        await ws.receive(timeout=5)
        assert ws.close_code == WS_UNAUTHORISED


async def test_stream_closes_when_no_token_arrives(client, monkeypatch):
    monkeypatch.setattr(app_module, "STREAM_AUTH_TIMEOUT_S", 0.05)
    async with client.ws_connect("/api/v1/stream") as ws:
        await ws.receive(timeout=5)
        assert ws.close_code == WS_UNAUTHORISED


async def test_plain_get_on_stream_needs_the_token(client):
    assert (await client.get("/api/v1/stream")).status == 401


async def test_stream_needs_no_handshake_without_a_token():
    rt = Runtime(house_config(), DemoDriver())
    await rt.step()
    async with (
        TestClient(TestServer(create_app(rt))) as c,
        c.ws_connect("/api/v1/stream") as ws,
    ):
        assert "boiler" in await ws.receive_json(timeout=5)


async def test_stream_trusts_ingress_from_supervisor_address():
    rt = Runtime(house_config(), DemoDriver())
    await rt.step()
    app = create_app(rt, token="secret", ingress_ip="127.0.0.1")
    async with (
        TestClient(TestServer(app)) as c,
        c.ws_connect("/api/v1/stream", headers={"X-Ingress-Path": "/x"}) as ws,
    ):
        assert "boiler" in await ws.receive_json(timeout=5)
