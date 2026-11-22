"""Device health mapping: bridge/devices, the raw network map, the scan's rate limit and
when a device needs attention. Payloads follow Zigbee2MQTT 2.x."""

import json

import pytest

from radiate.drivers.devices import (
    DeviceHealth,
    HealthLimits,
    NetworkScan,
    ScanRefused,
    alerts,
    last_seen_wall,
    parse_bridge_devices,
    parse_network_map,
    signal,
    view,
)

LIMITS = HealthLimits()

BRIDGE_DEVICES = [
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
    "not a device",
]


def _link(source, target, relationship, lqi):
    return {
        "source": {"ieeeAddr": source, "networkAddress": 1},
        "target": {"ieeeAddr": target, "networkAddress": 2},
        "relationship": relationship,
        "lqi": lqi,
        "depth": 1,
        "routes": [],
    }


NETWORK_MAP = {
    "nodes": [
        {"ieeeAddr": "0x00", "friendlyName": "Coordinator", "type": "Coordinator"},
        {"ieeeAddr": "0x01", "friendlyName": "trv_lounge", "type": "EndDevice"},
        {"ieeeAddr": "0x02", "friendlyName": "plug_hall", "type": "Router"},
        {"ieeeAddr": "0x03", "friendlyName": "temp_lounge", "type": "EndDevice"},
    ],
    "links": [
        # The coordinator's table: the plug is a child, the TRV a weak neighbour.
        _link("0x02", "0x00", 1, 160),
        _link("0x01", "0x00", 2, 20),
        # The plug's table: its parent is the coordinator, the TRV and sensor children.
        _link("0x00", "0x02", 0, 150),
        _link("0x01", "0x02", 1, 90),
        _link("0x03", "0x02", 1, 30),
        _link("0x03", "0x00", 1, 25),  # also seen under the coordinator, worse
        _link("0x99", "0x02", 1, 99),  # an address that is not a node
    ],
}


def test_signal_words():
    assert signal(None, LIMITS) is None
    assert signal(39, LIMITS) == "weak"
    assert signal(40, LIMITS) == "fair"
    assert signal(99, LIMITS) == "fair"
    assert signal(100, LIMITS) == "strong"
    assert signal(30, HealthLimits(weak_signal_lqi=25)) == "fair"


def test_last_seen_formats():
    assert last_seen_wall("2026-11-22T10:00:00Z") == 1795341600.0
    assert last_seen_wall("2026-11-22T10:00:00+00:00") == 1795341600.0
    assert last_seen_wall(1795341600000) == 1795341600.0
    assert last_seen_wall("yesterday") is None
    assert last_seen_wall(True) is None
    assert last_seen_wall(None) is None


def test_bridge_devices():
    listed = parse_bridge_devices(json.dumps(BRIDGE_DEVICES))
    assert set(listed) == {"Coordinator", "trv_lounge", "plug_hall", "temp_lounge"}
    trv = listed["trv_lounge"]
    assert (trv.type, trv.power, trv.model, trv.vendor, trv.firmware) == (
        "EndDevice",
        "battery",
        "TRVZB",
        "SONOFF",
        "1.3.0",
    )
    assert listed["plug_hall"].power == "mains"
    assert listed["temp_lounge"].model is None
    assert parse_bridge_devices(b"{}") is None
    assert parse_bridge_devices(b"not json") is None


def test_network_map_parents():
    routes = parse_network_map(NETWORK_MAP).routes
    assert routes["plug_hall"].via == "Coordinator"
    assert routes["plug_hall"].via_type == "Coordinator"
    assert routes["plug_hall"].lqi == 160
    assert routes["trv_lounge"].via == "plug_hall"
    assert routes["trv_lounge"].view() == {"via": "plug_hall", "via_kind": "router", "lqi": 90}
    # Seen under two parents: the better link wins.
    assert routes["temp_lounge"].via == "plug_hall"
    assert "Coordinator" not in routes


def test_network_map_deprecated_fields_and_rubbish():
    data = {
        "nodes": [
            {"ieeeAddr": "0x00", "type": "Coordinator"},
            {"ieeeAddr": "0x05", "friendlyName": "temp_x", "type": "EndDevice"},
        ],
        "links": [
            {
                "sourceIeeeAddr": "0x05",
                "targetIeeeAddr": "0x00",
                "relationship": 1,
                "linkquality": 70,
            },
            "rubbish",
        ],
    }
    assert parse_network_map(data).routes["temp_x"].lqi == 70
    assert parse_network_map(None).routes == {}
    assert parse_network_map({"nodes": "x", "links": None}).routes == {}


def test_scan_rate_limit_and_one_at_a_time():
    scan = NetworkScan()
    assert scan.view(0)["state"] == "idle"
    tx = scan.start(100.0)
    assert tx == "radiate-1"
    with pytest.raises(ScanRefused) as running:
        scan.start(110.0)
    assert running.value.status == 409
    ok = {"status": "ok", "data": {"type": "raw", "value": NETWORK_MAP}, "transaction": tx}
    assert scan.response(json.dumps(ok), 130.0)
    v = scan.view(160.0)
    assert v["state"] == "done"
    assert v["scanned_s_ago"] == 30
    assert v["retry_in_s"] == 540
    with pytest.raises(ScanRefused) as soon:
        scan.start(200.0)
    assert soon.value.status == 429
    assert soon.value.retry_in_s == 500
    assert "8 min" in soon.value.message
    assert scan.start(700.0) == "radiate-2"


def test_scan_ignores_other_answers_and_reports_errors():
    scan = NetworkScan()
    # Nothing asked: an answer someone else asked for is not ours.
    assert not scan.response(json.dumps({"status": "ok", "data": {"value": {}}}), 0)
    tx = scan.start(0.0)
    assert not scan.response(json.dumps({"status": "ok", "transaction": "other"}), 1.0)
    assert scan.state == "scanning"
    assert scan.response(json.dumps({"status": "error", "error": "busy", "transaction": tx}), 2.0)
    assert scan.view(3.0)["state"] == "failed"
    assert scan.view(3.0)["error"] == "busy"
    assert scan.map is None


def test_scan_times_out():
    scan = NetworkScan()
    scan.start(0.0)
    assert scan.view(100.0)["state"] == "scanning"
    v = scan.view(181.0)
    assert v["state"] == "failed"
    assert v["error"] == "no answer from Zigbee2MQTT"


def test_problems_and_status():
    ok = DeviceHealth("t", "trv", battery_pct=80, linkquality=120, available=True)
    assert ok.problems(LIMITS) == []
    assert ok.view(LIMITS)["status"] == "ok"
    low = DeviceHealth("t", "trv", battery_pct=20, linkquality=39, available=True)
    assert [c for c, _ in low.problems(LIMITS)] == ["device.low_battery", "device.weak_signal"]
    assert low.view(LIMITS)["status"] == "attention"
    assert low.view(LIMITS)["battery_low"]
    # Offline: the stale signal and reading say nothing new, the battery still does.
    off = DeviceHealth("s", "sensor", battery_pct=10, linkquality=5, available=False)
    off.reading_age_s = 99999
    assert [c for c, _ in off.problems(LIMITS)] == ["device.offline", "device.low_battery"]
    assert off.view(LIMITS)["status"] == "offline"
    stale = DeviceHealth("s", "sensor", available=True, reading_age_s=3601)
    assert [c for c, _ in stale.problems(LIMITS)] == ["device.stale"]
    unknown = DeviceHealth("s", "sensor")
    assert unknown.problems(LIMITS) == []
    assert unknown.view(LIMITS)["signal"] is None


def test_alerts_room_first_and_no_repeat_of_trv_offline():
    devices = [
        DeviceHealth("trv_l", "trv", "lounge", "Lounge", battery_pct=5, available=False),
        DeviceHealth("temp_l", "sensor", "lounge", "Lounge", linkquality=12, available=True),
        DeviceHealth("plug_hall", "router", available=False),
        DeviceHealth("out", "outdoor", battery_pct=3, available=True),
    ]
    got = [(a.code, a.message, a.room_id) for a in alerts(devices, LIMITS)]
    assert got == [
        ("device.low_battery", "Lounge: TRV battery low", "lounge"),
        ("device.weak_signal", "Lounge: room sensor signal weak", "lounge"),
        ("device.offline", "plug_hall: router not reachable", None),
        ("device.low_battery", "Outdoor sensor battery low", None),
    ]


def test_view_summary_and_labels():
    devices = [
        DeviceHealth("trv_l", "trv", "lounge", "Lounge", battery_pct=5, available=True),
        DeviceHealth("plug_hall", "router", linkquality=10, available=True),
        DeviceHealth("plug_x", "router", available=False),
        DeviceHealth("boiler_relay", "relay", link="wifi", available=True),
    ]
    body = view(devices, LIMITS, {"state": "idle"}, {"mqtt": True})
    assert body["summary"] == {
        "total": 4,
        "attention": 3,
        "offline": 1,
        "low_battery": 1,
        "weak_signal": 1,
    }
    assert [d["label"] for d in body["devices"]] == [
        "Lounge TRV",
        "Router plug_hall",
        "Router plug_x",
        "Boiler relay",
    ]
    assert body["limits"]["low_battery_pct"] == 20
