import dataclasses
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import aiohttp
import pytest
import yaml
from aiohttp.test_utils import TestServer

from radiate.config import load_site, parse_site
from radiate.core import Mode
from radiate.core.types import Actions, BoilerState, ValveAction
from radiate.drivers.live import LiveDriver
from radiate.drivers.shelly import HEARTBEAT_KEY, ShellyBoiler, ShellyRpc
from radiate.server.runtime import Runtime

from .fake_shelly import FakeShelly

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "pw"}
# Wednesday 18 November 2026, 06:00 in London (GMT, so also 06:00 UTC).
WALL = datetime(2026, 11, 18, 6, 0, tzinfo=ZoneInfo("Europe/London")).timestamp()


class Clock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


class Bus:
    """Records publishes, as the MQTT transport would send them."""

    def __init__(self):
        self.sent: list[tuple[str, dict]] = []

    async def publish(self, topic, payload):
        self.sent.append((topic, payload))
        return True

    def sets(self):
        return [(t, p) for t, p in self.sent if t.endswith("/set")]


def site(**house):
    s = load_site(EXAMPLE, env=ENV)
    return dataclasses.replace(s, **house) if house else s


def feed(drv, room_temp=17.0, trv_temp=18.0, contact=True):
    for rc in drv.cfg.rooms:
        dev = drv.site.devices[rc.id]
        if dev.sensor:
            drv.handle_message(
                f"zigbee2mqtt/{dev.sensor}",
                json.dumps({"temperature": room_temp, "humidity": 55, "battery": 90}).encode(),
            )
        if dev.trv:
            drv.handle_message(
                f"zigbee2mqtt/{dev.trv}",
                json.dumps(
                    {
                        "local_temperature": trv_temp,
                        "running_state": "idle",
                        "valve_opening_degree": 100,
                        "occupied_heating_setpoint": 16,
                        "system_mode": "heat",
                    }
                ).encode(),
            )
            drv.handle_message(f"zigbee2mqtt/{dev.trv}/availability", b'{"state":"online"}')


def make(dry_run=True, boiler=None):
    clock, bus = Clock(), Bus()
    drv = LiveDriver(site(dry_run=dry_run), bus.publish, boiler, clock=clock, wall=lambda: WALL)
    return drv, clock, bus


async def test_snapshot_maps_devices_and_schedule():
    drv, clock, _ = make()
    feed(drv)
    drv.handle_message("zigbee2mqtt/trv_lounge", b'{"running_state":"heat"}')
    snap = await drv.snapshot(Mode.AUTO, {"kitchen": 22.0}, False, {"lounge"})
    assert snap.minute_of_day == 360
    bed = snap.rooms["bedroom_1"]
    assert bed.temperature == 17.0 and bed.temperature_age_s == 0.0
    assert bed.trv_temperature == 18.0 and bed.trv_available and bed.trv_heating is False
    assert bed.setpoint == 16 and bed.next_setpoint == 20 and bed.next_setpoint_in_s == 1800
    assert snap.rooms["lounge"].trv_heating is True and snap.rooms["lounge"].fire_switch
    assert snap.rooms["kitchen"].setpoint == 22.0 and snap.rooms["kitchen"].next_setpoint is None
    assert snap.rooms["bathroom"].humidity == 55 and snap.rooms["dining"].humidity is None
    assert snap.rooms["toilet"].temperature is None and snap.rooms["toilet"].trv_temperature == 18
    assert snap.rooms["stairs"].temperature == 17.0 and not snap.rooms["stairs"].trv_available
    # Sensors go stale after their maximum reporting interval.
    clock.t += 3700
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    assert snap.rooms["bedroom_1"].temperature_age_s == pytest.approx(3700)


async def test_unheated_room_records_its_sensor_and_nothing_else():
    data = yaml.safe_load(EXAMPLE.read_text())
    data["rooms"].append({"id": "utility", "name": "Utility room", "role": "unheated"})
    data["rooms"][-1]["sensor"] = "temp_utility"
    s = parse_site(data, env=ENV)
    drv = LiveDriver(s, Bus().publish, clock=Clock(), wall=lambda: WALL)
    feed(drv)
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    utility = snap.rooms["utility"]
    assert utility.temperature == 17.0 and utility.humidity == 55
    assert utility.trv_temperature is None and not utility.trv_available
    assert utility.next_setpoint is None
    assert "utility" not in drv.writers and "utility" not in drv.schedules()
    assert drv.next_change_s("utility") is None


def test_next_change_for_override_expiry():
    drv, _, _ = make()
    assert drv.next_change_s("bedroom_1") == 1800  # 06:00, next transition 06:30
    assert drv.next_change_s("stairs") is None  # passive room, no schedule
    assert drv.next_change_s("nope") is None


async def test_window_contact():
    s = site()
    devices = dict(s.devices)
    devices["bedroom_1"] = dataclasses.replace(devices["bedroom_1"], window="win_bed1")
    clock, bus = Clock(), Bus()
    drv = LiveDriver(
        dataclasses.replace(s, devices=devices), bus.publish, clock=clock, wall=lambda: WALL
    )
    drv.handle_message("zigbee2mqtt/win_bed1", b'{"contact": false}')
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    assert snap.rooms["bedroom_1"].window_open is True


def actions(opening=60, pre=None, heating=False):
    return Actions(
        valves={
            "bedroom_1": ValveAction("bedroom_1", 20.5, opening, 100, 17.0, pre),
        },
        heating_relay=heating,
        store_relay=False,
        boiler_state=BoilerState.IDLE,
    )


async def test_dry_run_publishes_nothing():
    drv, _, bus = make(dry_run=True)
    feed(drv)
    await drv.apply(actions())
    await drv.drain()
    assert bus.sets() == []
    assert drv.intended_count == 1
    _, topic, payload = drv.intended[-1]
    assert topic == "zigbee2mqtt/trv_bedroom_1/set"
    assert payload["valve_opening_degree"] == 60
    assert payload["weekly_schedule_wednesday"] == "00:00/16 06:30/20 08:30/16 17:00/20 22:30/16"


async def test_live_publishes_and_close_bump_waits():
    drv, clock, bus = make(dry_run=False)
    feed(drv)
    await drv.apply(actions(opening=80))
    await drv.drain()
    ((topic, payload),) = bus.sets()
    assert topic == "zigbee2mqtt/trv_bedroom_1/set"
    assert payload["system_mode"] == "auto" and payload["smart_temperature_control"] is False
    assert payload["temperature_sensor_select"] == "remote_temperature"
    assert payload["external_temperature_input"] == 17.0
    bus.sent.clear()
    clock.t += 900
    drv.writers["bedroom_1"].close_bump_delay_s = 0.01
    await drv.apply(actions(opening=40, pre=50))
    await drv.drain()
    first, second = (p for _, p in bus.sets())
    # The first write also carries reconciler re-sends: this fake TRV never echoes.
    assert first["valve_opening_degree"] == 50 and second == {"valve_opening_degree": 40}


async def test_back_online_resends_settings():
    drv, clock, bus = make(dry_run=False)
    feed(drv)
    await drv.apply(actions())
    await drv.drain()
    drv.handle_message("zigbee2mqtt/trv_bedroom_1/availability", b'{"state":"offline"}')
    drv.handle_message("zigbee2mqtt/trv_bedroom_1/availability", b'{"state":"online"}')
    bus.sent.clear()
    clock.t += 60
    await drv.apply(actions())
    await drv.drain()
    assert len(bus.sets()[0][1]) >= 7


async def test_alerts():
    drv, clock, _ = make(dry_run=False)
    feed(drv)
    assert drv.alerts() == []
    drv.handle_message("zigbee2mqtt/trv_dining/availability", b'{"state":"offline"}')
    drv.writers["bedroom_1"].failed.add("valve_opening_degree")
    codes = {(a.code, a.room_id) for a in drv.alerts()}
    assert codes == {("driver.trv_offline", "dining"), ("driver.write_failed", "bedroom_1")}


async def test_rejected_settings_reach_the_core_except_in_dry_run():
    drv, _, _ = make(dry_run=False)
    feed(drv)
    drv.writers["bedroom_1"].failed.update({"valve_opening_degree", "occupied_heating_setpoint"})
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    assert snap.rooms["bedroom_1"].trv_rejected == (
        "occupied_heating_setpoint",
        "valve_opening_degree",
    )
    assert snap.rooms["dining"].trv_rejected == ()
    # In dry run nothing is sent, so an echo that disagrees is not a rejection.
    dry, _, _ = make(dry_run=True)
    feed(dry)
    dry.writers["bedroom_1"].failed.add("valve_opening_degree")
    snap = await dry.snapshot(Mode.AUTO, {}, False, set())
    assert snap.rooms["bedroom_1"].trv_rejected == ()
    assert not any(a.code == "driver.write_failed" for a in dry.alerts())


@pytest.fixture
async def fake_shelly():
    fake = FakeShelly(password="pw")
    server = TestServer(fake.app())
    await server.start_server()
    async with aiohttp.ClientSession() as session:
        fake.host = f"{server.host}:{server.port}"
        fake.session = session
        yield fake
    await server.close()


@pytest.mark.parametrize("dry_run", [True, False])
async def test_runtime_end_to_end(fake_shelly, dry_run):
    s = site(dry_run=dry_run)
    s = dataclasses.replace(s, shelly=dataclasses.replace(s.shelly, host=fake_shelly.host))
    rpc = ShellyRpc(fake_shelly.host, "pw", fake_shelly.session)
    boiler = ShellyBoiler(s.shelly, rpc, dry_run=dry_run)
    clock, bus = Clock(), Bus()
    drv = LiveDriver(s, bus.publish, boiler, clock=clock, wall=lambda: WALL)
    feed(drv, room_temp=15.0, trv_temp=15.5)  # cold house before the 06:30 setpoint
    rt = Runtime(s.house, drv)
    for _ in range(5):
        await rt.step()
        clock.t += 60
    await drv.drain()
    state = rt.describe()
    assert state["telemetry"]["dry_run"] is dry_run
    assert state["telemetry"]["shelly_reachable"] is True
    if dry_run:
        assert bus.sets() == [] and fake_shelly.kvs == {}
        assert all(m == "Switch.GetStatus" for m, _ in fake_shelly.calls)
        assert drv.intended and {t for _, t, _ in drv.intended} == {"zigbee2mqtt/trv_bedroom_1/set"}
    else:
        # Only the pilot valve is written; the boiler relay gets heartbeat and commands.
        assert {t for t, _ in bus.sets()} == {"zigbee2mqtt/trv_bedroom_1/set"}
        assert fake_shelly.kvs[HEARTBEAT_KEY] == int(WALL)
        assert "radiate_heat" in fake_shelly.kvs and "radiate_store" in fake_shelly.kvs
        assert any(m == "Switch.Set" and p["id"] == 0 for m, p in fake_shelly.calls)


async def test_trvs_unavailable_when_mqtt_or_zigbee2mqtt_is_down():
    connected = [True]
    clock, bus = Clock(), Bus()
    drv = LiveDriver(
        site(), bus.publish, clock=clock, wall=lambda: WALL, connected=lambda: connected[0]
    )
    feed(drv)
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    assert snap.rooms["bedroom_1"].trv_available
    # The broker connection drops: the last availability messages can no longer be trusted.
    connected[0] = False
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    assert not any(r.trv_available for r in snap.rooms.values())
    # Zigbee2MQTT itself goes offline (its last will), broker still up.
    connected[0] = True
    drv.handle_message("zigbee2mqtt/bridge/state", b'{"state":"offline"}')
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    assert not any(r.trv_available for r in snap.rooms.values())
    assert any(a.code == "driver.zigbee2mqtt" for a in drv.alerts())
    drv.handle_message("zigbee2mqtt/bridge/state", b'{"state":"online"}')
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    assert snap.rooms["bedroom_1"].trv_available


async def test_safe_mode_hands_the_boiler_to_the_watchdog(fake_shelly):
    s = site(dry_run=False)
    s = dataclasses.replace(s, shelly=dataclasses.replace(s.shelly, host=fake_shelly.host))
    rpc = ShellyRpc(fake_shelly.host, "pw", fake_shelly.session)
    boiler = ShellyBoiler(s.shelly, rpc, dry_run=False)
    clock, bus = Clock(), Bus()
    drv = LiveDriver(s, bus.publish, boiler, clock=clock, wall=lambda: WALL)

    def safe(heating, handover):
        a = actions(heating=heating)
        a.valves = {}
        a.safe_mode = True
        a.watchdog_handover = handover
        return a

    # Still inside minimum burn: Radiate keeps the relay on and the heartbeat going.
    await drv.apply(safe(True, False))
    assert fake_shelly.kvs[HEARTBEAT_KEY] == int(WALL)
    assert fake_shelly.switches[0]["output"] is True
    fake_shelly.calls.clear()
    fake_shelly.kvs.pop(HEARTBEAT_KEY)
    # Burn over: the relay is switched off once, with no heartbeat, so the watchdog
    # takes over after its timeout.
    await drv.apply(safe(False, True))
    assert HEARTBEAT_KEY not in fake_shelly.kvs
    assert fake_shelly.switches[0]["output"] is False
    assert any(a.code == "driver.watchdog_handover" for a in drv.alerts())
    # From then on, nothing: not even when the core follows the watchdog's burn.
    fake_shelly.calls.clear()
    await drv.apply(safe(False, True))
    await drv.apply(safe(True, True))
    assert not any(m == "Switch.Set" or p.get("key") == HEARTBEAT_KEY for m, p in fake_shelly.calls)
    # Back to normal: Radiate commands the relay again.
    await drv.apply(actions())
    assert fake_shelly.kvs[HEARTBEAT_KEY] == int(WALL)
    assert not any(a.code == "driver.watchdog_handover" for a in drv.alerts())


async def test_relay_unseen_time_and_dry_run_reach_the_core(fake_shelly):
    s = site(dry_run=False)
    s = dataclasses.replace(s, shelly=dataclasses.replace(s.shelly, host=fake_shelly.host))
    rpc = ShellyRpc(fake_shelly.host, "pw", fake_shelly.session)
    clock, bus = Clock(), Bus()
    drv = LiveDriver(s, bus.publish, ShellyBoiler(s.shelly, rpc), clock=clock, wall=lambda: WALL)
    feed(drv)
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    assert snap.relay_follows_commands and snap.heating_relay_unseen_s == 0.0

    # The Shelly drops off the network for 12 minutes; the watchdog switches it on.
    async def unreachable(*_args, **_kw):
        raise OSError("host unreachable")

    rpc.call = unreachable
    for _ in range(12):
        clock.t += 60
        snap = await drv.snapshot(Mode.AUTO, {}, False, set())
        assert snap.heating_relay is False and snap.heating_relay_unseen_s == 0.0
    del rpc.call
    fake_shelly.switches[0]["output"] = True
    clock.t += 60
    snap = await drv.snapshot(Mode.AUTO, {}, False, set())
    assert snap.heating_relay is True and snap.heating_relay_unseen_s == 13 * 60
    # In dry run the observed relay is not Radiate's to adopt.
    drv_dry, _, _ = make(dry_run=True)
    assert (await drv_dry.snapshot(Mode.AUTO, {}, False, set())).relay_follows_commands is False


async def test_internal_sensor_room_mirrors_schedule_in_trv_frame():
    drv, _, _ = make()
    feed(drv)
    toilet = drv._mirror("toilet")
    bedroom = drv._mirror("bedroom_1")
    # Toilet target 18 at 06:30 with the default -1.5 K bias: the TRV reads 1.5 K high.
    assert (
        toilet["weekly_schedule_monday"] == "00:00/17.5 06:30/19.5 08:30/17.5 17:00/19.5 22:30/17.5"
    )
    assert bedroom["weekly_schedule_monday"] == "00:00/16 06:30/20 08:30/16 17:00/20 22:30/16"
