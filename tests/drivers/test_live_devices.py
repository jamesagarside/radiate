"""The live driver's device health: what it reads from Zigbee2MQTT and the Shelly, the
network scan it publishes, and the alerts it raises."""

import asyncio
import json

import pytest

from radiate.core import Mode
from radiate.drivers.devices import ScanRefused
from radiate.drivers.live import LiveDriver
from radiate.drivers.shelly import ShellyBoiler, ShellyRpc

from .test_live import WALL, Bus, Clock, fake_shelly, feed, make, site  # noqa: F401

BRIDGE = json.dumps(
    [
        {"friendly_name": "Coordinator", "ieee_address": "0x00", "type": "Coordinator"},
        {
            "friendly_name": "trv_lounge",
            "ieee_address": "0x01",
            "type": "EndDevice",
            "power_source": "Battery",
            "software_build_id": "1.3.0",
            "definition": {"model": "TRVZB", "vendor": "SONOFF"},
        },
        {
            "friendly_name": "plug_hall",
            "ieee_address": "0x02",
            "type": "Router",
            "power_source": "Mains (single phase)",
            "definition": {"model": "S60ZBTPG", "vendor": "SONOFF"},
        },
        {"friendly_name": "temp_lounge", "ieee_address": "0x03", "type": "EndDevice"},
    ]
).encode()


def by_id(view):
    return {d["id"]: d for d in view["devices"]}


def test_devices_view_reads_battery_signal_and_readings():
    drv, clock, _ = make()
    feed(drv)
    drv.handle_message("zigbee2mqtt/plug_hall/availability", b'{"state":"online"}')
    drv.handle_message("zigbee2mqtt/bridge/devices", BRIDGE)
    drv.handle_message(
        "zigbee2mqtt/trv_lounge",
        b'{"battery": 15, "linkquality": 33, "valve_closing_degree": 100,'
        b' "temperature_sensor_select": "remote_temperature"}',
    )
    drv.handle_message("zigbee2mqtt/temp_lounge", b'{"linkquality": 120}')
    drv.handle_message("zigbee2mqtt/plug_hall", b'{"state": "ON", "linkquality": 180}')
    clock.t += 120
    view = drv.devices_view()
    devices = by_id(view)
    trv = devices["trv_lounge"]
    assert trv["kind"] == "trv" and trv["room_id"] == "lounge" and trv["label"] == "Lounge TRV"
    assert (trv["model"], trv["vendor"], trv["firmware"], trv["power"]) == (
        "TRVZB",
        "SONOFF",
        "1.3.0",
        "battery",
    )
    assert trv["battery_pct"] == 15 and trv["battery_low"]
    assert trv["linkquality"] == 33 and trv["signal"] == "weak"
    assert trv["available"] is True and trv["last_seen_s"] == 120
    assert trv["temperature_c"] == 18.0
    assert trv["valve"] == {
        "opening_pct": 100.0,
        "closing_pct": 100.0,
        "mode": "heat",
        "running_state": "idle",
        "setpoint_c": 16.0,
        "sensor": "remote_temperature",
    }
    assert trv["status"] == "attention"
    sensor = devices["temp_lounge"]
    assert sensor["kind"] == "sensor" and sensor["battery_pct"] == 90
    assert sensor["temperature_c"] == 17.0 and sensor["signal"] == "strong"
    assert sensor["reading_age_s"] == 120
    # The router is not in the house file: it comes from bridge/devices, and its
    # availability, retained before the list arrived, is kept.
    plug = devices["plug_hall"]
    assert plug["kind"] == "router" and plug["available"] is True and plug["power"] == "mains"
    assert plug["linkquality"] == 180
    # Without a shelly section there is no relay to show.
    assert "boiler_relay" not in devices
    # The stairs has a sensor and no TRV; the toilet a TRV and no sensor.
    assert "temp_stairs" in devices and "temp_toilet" not in devices
    assert view["network"] == {"mqtt": True, "zigbee2mqtt": None}
    assert view["scan"]["state"] == "idle" and view["scan"]["available"]
    assert view["limits"]["low_battery_pct"] == 20


def test_last_seen_from_zigbee2mqtt_and_unknown_devices():
    drv, clock, _ = make()
    drv.handle_message("zigbee2mqtt/temp_lounge", b'{"last_seen": "2026-11-18T05:55:00Z"}')
    devices = by_id(drv.devices_view())
    assert devices["temp_lounge"]["last_seen_s"] == 300  # WALL is 06:00 UTC
    # Never heard from: nothing is claimed, so nothing needs attention.
    bed = devices["temp_bedroom_1"]
    assert bed["available"] is None and bed["last_seen_s"] is None and bed["status"] == "ok"


def test_thresholds_come_from_the_house_file():
    import dataclasses

    from radiate.config.site import MonitoringOptions

    s = dataclasses.replace(
        site(), monitoring=MonitoringOptions(low_battery_pct=30, weak_signal_lqi=60)
    )
    drv = LiveDriver(s, Bus().publish, clock=Clock(), wall=lambda: WALL)
    drv.handle_message("zigbee2mqtt/temp_lounge", b'{"battery": 25, "linkquality": 50}')
    sensor = by_id(drv.devices_view())["temp_lounge"]
    assert sensor["battery_low"] and sensor["signal"] == "weak"


async def test_alerts_for_battery_signal_and_silent_sensors():
    drv, clock, _ = make()
    feed(drv)
    assert drv.alerts() == []
    drv.handle_message("zigbee2mqtt/trv_bedroom_3", b'{"battery": 9}')
    drv.handle_message("zigbee2mqtt/temp_bathroom", b'{"linkquality": 12}')
    got = {(a.code, a.message) for a in drv.alerts()}
    assert got == {
        ("device.low_battery", "Bedroom 3: TRV battery low"),
        ("device.weak_signal", "Bathroom: room sensor signal weak"),
    }
    # With the broker down the devices say nothing new; the broker alert says it all.
    down = LiveDriver(
        site(), Bus().publish, clock=clock, wall=lambda: WALL, connected=lambda: False
    )
    feed(down)
    down.handle_message("zigbee2mqtt/trv_bedroom_3", b'{"battery": 9}')
    assert any(a.code == "driver.mqtt" for a in down.alerts())
    assert not any(a.code.startswith("device.") for a in down.alerts())


async def test_network_scan_reads_only_and_works_in_dry_run():
    drv, clock, bus = make(dry_run=True)
    drv.handle_message("zigbee2mqtt/bridge/devices", BRIDGE)
    scan = drv.request_network_scan()
    await drv.drain()
    assert scan["state"] == "scanning"
    assert bus.sent == [
        (
            "zigbee2mqtt/bridge/request/networkmap",
            {"type": "raw", "routes": False, "transaction": "radiate-1"},
        )
    ]
    assert bus.sets() == [] and drv.intended_count == 0
    # One at a time.
    with pytest.raises(ScanRefused) as running:
        drv.request_network_scan()
    assert running.value.status == 409
    answer = {
        "status": "ok",
        "transaction": "radiate-1",
        "data": {
            "type": "raw",
            "routes": False,
            "value": {
                "nodes": [
                    {"ieeeAddr": "0x00", "friendlyName": "Coordinator", "type": "Coordinator"},
                    {"ieeeAddr": "0x01", "friendlyName": "trv_lounge", "type": "EndDevice"},
                    {"ieeeAddr": "0x02", "friendlyName": "plug_hall", "type": "Router"},
                ],
                "links": [
                    {
                        "source": {"ieeeAddr": "0x01"},
                        "target": {"ieeeAddr": "0x02"},
                        "relationship": 1,
                        "lqi": 88,
                    },
                    {
                        "source": {"ieeeAddr": "0x02"},
                        "target": {"ieeeAddr": "0x00"},
                        "relationship": 1,
                        "lqi": 170,
                    },
                ],
            },
        },
    }
    clock.t += 40
    drv.handle_message("zigbee2mqtt/bridge/response/networkmap", json.dumps(answer).encode())
    view = drv.devices_view()
    assert view["scan"]["state"] == "done" and view["scan"]["scanned_s_ago"] == 0
    devices = by_id(view)
    assert devices["trv_lounge"]["route"] == {"via": "plug_hall", "via_kind": "router", "lqi": 88}
    assert devices["plug_hall"]["route"]["via_kind"] == "coordinator"
    assert devices["temp_lounge"]["route"] is None
    # Rate limited: the mesh is not disturbed again for 10 minutes.
    with pytest.raises(ScanRefused) as soon:
        drv.request_network_scan()
    assert soon.value.status == 429
    clock.t += 600
    drv.request_network_scan()
    await drv.drain()
    assert len(bus.sent) == 2 and bus.sets() == []


async def test_network_scan_refused_without_zigbee2mqtt():
    clock = Clock()
    drv = LiveDriver(site(), Bus().publish, clock=clock, wall=lambda: WALL)
    drv.handle_message("zigbee2mqtt/bridge/state", b'{"state":"offline"}')
    with pytest.raises(ScanRefused) as err:
        drv.request_network_scan()
    assert err.value.status == 503
    assert drv.scan.state == "idle"


async def test_network_scan_fails_when_the_request_cannot_be_sent():
    async def refuse(topic, payload):
        return False

    drv = LiveDriver(site(), refuse, clock=Clock(), wall=lambda: WALL)
    drv.request_network_scan()
    await drv.drain()
    await asyncio.sleep(0)
    view = drv.devices_view()["scan"]
    assert view["state"] == "failed"
    assert view["error"] == "could not send the request to Zigbee2MQTT"


async def test_boiler_relay_health(fake_shelly):  # noqa: F811 (the fixture, imported)
    rpc = ShellyRpc(fake_shelly.host, "pw", fake_shelly.session)
    boiler = ShellyBoiler(site().shelly, rpc, dry_run=True)
    drv, clock, _ = make(boiler=boiler)
    feed(drv)
    relay = by_id(drv.devices_view())["boiler_relay"]
    assert relay["available"] is None and relay["link"] == "wifi"
    await drv.snapshot(Mode.AUTO, {}, False, set())
    clock.t += 30
    relay = by_id(drv.devices_view())["boiler_relay"]
    assert relay["available"] is True and relay["last_seen_s"] == 30
    assert relay["relay"]["heating"] is False
    assert relay["label"] == "Boiler relay" and relay["status"] == "ok"
    # The relay's own alert (driver.shelly) covers it going away: no device alert too.
    assert not any(a.code.startswith("device.") for a in drv.alerts())
