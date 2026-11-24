import json

import pytest

from radiate.core import Reason
from radiate.server import bridge
from radiate.server.bridge import DemoSession, RequestError, handle, run_sync
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.sim.reference import house_config


@pytest.fixture
def rt():
    runtime = Runtime(house_config(), DemoDriver())
    run_sync(runtime.step())
    return runtime


def _status(rt, method, path, body=None):
    try:
        handle(rt, method, path, body)
    except RequestError as err:
        return err.status
    return 200


def test_get_routes(rt):
    assert len(handle(rt, "GET", "house")["rooms"]) == 9
    assert handle(rt, "GET", "/state/")["boiler"]["state"] in {"idle", "lead", "firing", "rest"}
    assert handle(rt, "get", "health") == {"ok": True}


def test_unknown_routes_and_methods(rt):
    assert _status(rt, "GET", "nope") == 404
    assert _status(rt, "POST", "state", {}) == 404
    assert _status(rt, "POST", "rooms/lounge/colour", {}) == 404
    assert _status(rt, "DELETE", "mode") == 405


def test_setpoint_rules_match_the_server(rt):
    handle(rt, "POST", "rooms/bedroom_1/setpoint", {"setpoint": "21.5"})
    assert rt.overrides["bedroom_1"] == 21.5
    assert _status(rt, "POST", "rooms/bedroom_1/setpoint", {"setpoint": 40}) == 400
    assert _status(rt, "POST", "rooms/bedroom_1/setpoint", {"setpoint": 4.9}) == 400
    assert _status(rt, "POST", "rooms/bedroom_1/setpoint", {"setpoint": "warm"}) == 400
    assert _status(rt, "POST", "rooms/bedroom_1/setpoint", {"setpoint": True}) == 400
    assert _status(rt, "POST", "rooms/nope/setpoint", {"setpoint": 20}) == 404
    handle(rt, "POST", "rooms/bedroom_1/setpoint", {"setpoint": None})
    assert "bedroom_1" not in rt.overrides


def test_body_must_be_an_object(rt):
    for path in ("mode", "store/boost", "rooms/lounge/fire", "rooms/lounge/setpoint"):
        assert _status(rt, "POST", path, [1, 2]) == 400
        assert _status(rt, "POST", path, None) == 400


def test_fire_mode_and_boost(rt):
    handle(rt, "POST", "rooms/lounge/fire", {"lit": True})
    assert rt.fire == {"lounge"}
    handle(rt, "POST", "rooms/lounge/fire", {"lit": False})
    assert rt.fire == set()
    handle(rt, "POST", "mode", {"mode": "frost"})
    assert rt.mode.value == "frost"
    assert _status(rt, "POST", "mode", {"mode": "sauna"}) == 400
    handle(rt, "POST", "store/boost", {"minutes": 999})
    assert rt.store_boost_until == rt.driver.clock() + bridge.BOOST_MAX_MIN * 60
    handle(rt, "POST", "store/boost", {"minutes": -5})
    assert rt.store_boost_until == rt.driver.clock()
    assert _status(rt, "POST", "store/boost", {"minutes": "lots"}) == 400


def test_settings_demand_mode(rt):
    settings = handle(rt, "GET", "settings")
    assert settings["demand_mode"] == "eco" and settings["demand_mode_default"] == "eco"
    assert settings["demand_modes"] == ["eco", "comfort"]
    assert handle(rt, "GET", "state")["settings"] == settings
    done = handle(rt, "POST", "settings", {"demand_mode": "comfort"})
    assert done["ok"] and done["settings"]["demand_mode"] == "comfort"
    run_sync(rt.step())
    assert rt.last_snapshot.demand_mode.value == "comfort"  # decided, and recorded, so
    assert handle(rt, "POST", "settings", {})["settings"]["demand_mode"] == "comfort"
    handle(rt, "POST", "settings", {"demand_mode": None})  # back to the configuration
    assert rt.demand_mode is None and handle(rt, "GET", "settings")["demand_mode"] == "eco"
    for body in ({"demand_mode": "turbo"}, {"demand_mode": 1}, {"memory_days": 3}, [1]):
        assert _status(rt, "POST", "settings", body) == 400


def test_run_sync_refuses_a_coroutine_that_suspends():
    import asyncio

    with pytest.raises(RuntimeError):
        run_sync(asyncio.sleep(0.01))


def test_demo_session_speaks_json():
    s = DemoSession()
    start = s.sim_seconds()
    s.step(3)
    assert s.sim_seconds() == start + 180
    ok = json.loads(s.request("POST", "rooms/lounge/fire", json.dumps({"lit": True})))
    assert ok["status"] == 200 and ok["body"]["ok"] is True
    assert 0 < ok["body"]["expires_in_min"] <= 360  # the fire flag expires (spec 7)
    s.step()
    state = json.loads(s.request("GET", "state"))["body"]
    lounge = next(r for r in state["rooms"] if r["id"] == "lounge")
    assert lounge["fire"]
    assert json.loads(s.request("POST", "mode", "{bad"))["status"] == 400
    bad = json.loads(s.request("POST", "mode", json.dumps({"mode": "sauna"})))
    assert bad == {"status": 400, "body": "mode must be auto, off or frost"}
    done = json.loads(s.request("POST", "settings", json.dumps({"demand_mode": "comfort"})))
    assert done["status"] == 200 and done["body"]["settings"]["demand_mode"] == "comfort"


def test_rooms_carry_their_reason_code(rt):
    message = "Toilet: calling, waiting for more rooms to share a burn (eco)"
    rt.last_actions.reasons.append(Reason("demand.pooled", message, "toilet"))
    rooms = {r["id"]: r for r in handle(rt, "GET", "state")["rooms"]}
    assert rooms["toilet"]["reason"] == message
    assert rooms["toilet"]["reason_code"] == "demand.pooled"
    for room in rooms.values():
        if "reason" in room:
            assert (room["reason"] is None) == (room["reason_code"] is None)
