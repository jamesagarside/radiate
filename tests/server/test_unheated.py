"""An unheated room (a sensor and no radiator) through the server: the API, the tick
history and the Elastic export show its temperature and humidity, and nothing that
would suggest Radiate controls it."""

import json
from datetime import UTC, datetime
from pathlib import Path

import pytest
import yaml
from aiohttp.test_utils import TestClient, TestServer

from radiate.config import parse_site
from radiate.core.history import TICK, decode_snapshot
from radiate.drivers.live import LiveDriver
from radiate.export.elastic import room_docs
from radiate.server.app import create_app
from radiate.server.history import History
from radiate.server.runtime import Runtime
from radiate.server.store import Store

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
H = {"Authorization": "Bearer secret"}
WALL = datetime(2026, 11, 18, 6, 0, tzinfo=UTC).timestamp()


async def _publish(topic, payload):
    return True


def _site():
    data = yaml.safe_load(EXAMPLE.read_text())
    data["rooms"].append(
        {"id": "utility", "name": "Utility room", "role": "unheated", "sensor": "temp_utility"}
    )
    del data["shelly"]
    return parse_site(data, env=ENV)


@pytest.fixture
async def client(tmp_path):
    site = _site()
    drv = LiveDriver(site, _publish, clock=lambda: 1000.0, wall=lambda: WALL)
    for rc in site.house.rooms:
        dev = site.devices[rc.id]
        if dev.sensor:
            reading = {"temperature": 24.5 if rc.id == "utility" else 18.0, "humidity": 48}
            drv.handle_message(f"zigbee2mqtt/{dev.sensor}", json.dumps(reading).encode())
        if dev.trv:
            trv = {"local_temperature": 18.5, "running_state": "idle", "system_mode": "auto"}
            drv.handle_message(f"zigbee2mqtt/{dev.trv}", json.dumps(trv).encode())
            drv.handle_message(f"zigbee2mqtt/{dev.trv}/availability", b'{"state":"online"}')
    store = Store(tmp_path / "radiate.db")
    rt = Runtime(site.house, drv, store=store, timezone=site.timezone, wall=lambda: WALL)
    rt.restore()
    for _ in range(3):
        await rt.step()
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt, c.store = rt, store
        yield c
    store.close()


async def test_house_lists_the_room_as_not_controllable(client):
    house = await (await client.get("/api/v1/house", headers=H)).json()
    utility = next(r for r in house["rooms"] if r["id"] == "utility")
    assert utility == {
        "id": "utility",
        "name": "Utility room",
        "role": "unheated",
        "heat_source": None,
        "controllable": False,
    }


async def test_state_shows_temperature_and_humidity_only(client):
    state = await (await client.get("/api/v1/state", headers=H)).json()
    utility = next(r for r in state["rooms"] if r["id"] == "utility")
    assert utility["temperature"] == 24.5 and utility["humidity"] == 48
    assert utility["setpoint"] is None and utility["next_setpoint"] is None
    assert utility["override"] is None
    for key in ("model", "opening", "calling", "target", "valve"):
        assert key not in utility


async def test_setpoint_is_refused(client):
    r = await client.post("/api/v1/rooms/utility/setpoint", json={"setpoint": 20}, headers=H)
    assert r.status == 400
    assert "no radiator" in await r.text()
    assert "utility" not in client.rt.overrides


async def test_ticks_record_its_readings(client):
    ticks = [e for e in History(client.store).entries() if e.kind == TICK]
    assert ticks
    snap = decode_snapshot(ticks[-1].data["snapshot"])
    assert snap.rooms["utility"].temperature == 24.5
    assert snap.rooms["utility"].humidity == 48


async def test_elastic_document_has_readings_and_no_control(client):
    docs = room_docs(client.rt.describe(), "h", datetime(2026, 11, 18, 6, 0, tzinfo=UTC))
    doc = next(d for d in docs if d["radiate"]["room"]["id"] == "utility")
    assert doc["radiate"]["room"]["role"] == "unheated"
    assert doc["temperature"] == {"room": 24.5, "setpoint": None, "target": None}
    assert doc["humidity"] == {"room": 48}
    assert "valve" not in doc and "model" not in doc and "demand" not in doc
