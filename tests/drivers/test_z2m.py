import json

from radiate.config import parse_week
from radiate.core.types import ValveAction
from radiate.drivers.z2m import (
    DeviceStore,
    TrvWriter,
    is_available,
    parse_availability,
    parse_rejection,
    reading_age,
)

TRV_STATE = {
    "local_temperature": 19.5,
    "running_state": "heat",
    "occupied_heating_setpoint": 20.5,
    "system_mode": "auto",
    "valve_opening_degree": 60,
    "valve_closing_degree": 100,
    "temperature_sensor_select": "remote_temperature",
    "smart_temperature_control": False,
    "battery": 87,
    "linkquality": 120,
}


def action(opening=60, setpoint=20.5, ext=19.8, pre=None):
    return ValveAction("r", setpoint, opening, 100, ext, pre)


# --- reading -------------------------------------------------------------------------


def test_availability_formats():
    assert parse_availability(b'{"state":"online"}') is True
    assert parse_availability(b'{"state":"offline"}') is False
    assert parse_availability(b"online") is True
    assert parse_availability(b"garbage") is None


def test_store_routes_known_devices_only():
    store = DeviceStore("zigbee2mqtt", {"trv_a", "upstairs/temp"})
    assert store.handle("zigbee2mqtt/trv_a", json.dumps(TRV_STATE), 10.0) == "trv_a"
    assert store.handle("zigbee2mqtt/other", b"{}", 10.0) is None
    assert store.bridge_online is None
    assert store.handle("zigbee2mqtt/bridge/state", b'{"state":"online"}', 10.0) is None
    assert store.bridge_online is True
    store.handle("zigbee2mqtt/bridge/state", b"offline", 10.0)
    assert store.bridge_online is False
    assert store.handle("zigbee2mqtt/trv_a/availability", b'{"state":"offline"}', 11.0)
    # Friendly names may contain slashes.
    assert store.handle("zigbee2mqtt/upstairs/temp", b'{"temperature":18.2}', 12.0)
    assert store.get("upstairs/temp").number("temperature") == 18.2
    dev = store.get("trv_a")
    assert dev.number("local_temperature") == 19.5 and dev.available is False
    assert store.set_topic("trv_a") == "zigbee2mqtt/trv_a/set"


def test_bad_payload_is_ignored():
    store = DeviceStore("z2m", {"s"})
    store.handle("z2m/s", b"not json", 1.0)
    store.handle("z2m/s", b"[1,2]", 1.0)
    assert store.get("s").last_message is None


def test_reading_age_and_availability():
    store = DeviceStore("z", {"s"})
    store.handle("z/s", b'{"temperature": 18.0}', 0.0)
    dev = store.get("s")
    assert reading_age(dev, "temperature", 1800.0, 3600.0) == 0.0
    assert reading_age(dev, "temperature", 4000.0, 3600.0) == 4000.0
    assert reading_age(dev, "humidity", 10.0, 3600.0) is None
    assert is_available(dev, 7000.0, 3600.0) and not is_available(dev, 7300.0, 3600.0)
    store.handle("z/s/availability", b'{"state":"offline"}', 10.0)
    assert reading_age(dev, "temperature", 20.0, 3600.0) == 20.0
    assert not is_available(dev, 20.0, 3600.0)


# --- writing -------------------------------------------------------------------------


def test_first_plan_sends_governed_settings():
    w = TrvWriter("trv_a", remote_sensor=True)
    (write,) = w.plan(action(), None, 0.0)
    assert write.device == "trv_a" and write.delay_s == 0
    assert write.payload == {
        "valve_closing_degree": 100,
        "smart_temperature_control": False,
        "system_mode": "auto",
        "temperature_sensor_select": "remote_temperature",
        "occupied_heating_setpoint": 20.5,
        "valve_opening_degree": 60,
        "external_temperature_input": 19.8,
    }


def test_only_changes_are_sent():
    w = TrvWriter("t", remote_sensor=True)
    w.plan(action(), None, 0.0)
    assert w.plan(action(ext=19.9), None, 60.0) == []  # under 0.2 K
    (write,) = w.plan(action(setpoint=21.0, ext=19.9), None, 120.0)
    assert write.payload == {"occupied_heating_setpoint": 21.0}


def test_external_keepalive():
    w = TrvWriter("t", remote_sensor=True, keepalive_s=1500)
    w.plan(action(), None, 0.0)
    assert w.plan(action(), None, 1400.0) == []
    (write,) = w.plan(action(), None, 1500.0)
    assert write.payload == {"external_temperature_input": 19.8}


def test_external_clamped_and_skipped_without_sensor():
    w = TrvWriter("t", remote_sensor=True)
    (write,) = w.plan(action(ext=-3.0), None, 0.0)
    assert write.payload["external_temperature_input"] == 0.0
    w2 = TrvWriter("t", remote_sensor=False)
    (write,) = w2.plan(action(ext=None), None, 0.0)
    assert "external_temperature_input" not in write.payload
    assert write.payload["temperature_sensor_select"] == "local_temperature"


def test_stale_room_sensor_stops_external_updates():
    w = TrvWriter("t", remote_sensor=True)
    w.plan(action(), None, 0.0)
    # Core passes None when the room sensor is stale; the TRV reverts by itself.
    assert w.plan(action(ext=None), None, 3600.0) == []


def test_close_bump():
    w = TrvWriter("t", remote_sensor=True, close_bump_delay_s=5.0)
    w.plan(action(opening=80), None, 0.0)
    first, second = w.plan(action(opening=40, pre=50), None, 900.0)
    assert first.payload == {"valve_opening_degree": 50} and first.delay_s == 0
    assert second.payload == {"valve_opening_degree": 40} and second.delay_s == 5.0


def test_reconciler_resends_then_gives_up():
    store = DeviceStore("z", {"t"})
    w = TrvWriter("t", remote_sensor=True)
    w.plan(action(opening=60), None, 0.0)
    store.handle("z/t", json.dumps({**TRV_STATE, "valve_opening_degree": 30}), 10.0)
    echo = store.get("t")
    assert w.plan(action(opening=60), echo, 200.0) == []  # inside the grace period
    (write,) = w.plan(action(opening=60), echo, 301.0)
    assert write.payload == {"valve_opening_degree": 60}
    (write,) = w.plan(action(opening=60), echo, 602.0)
    assert w.plan(action(opening=60), echo, 903.0) == []
    assert "valve_opening_degree" in w.failed
    # A new target clears the failure.
    (write,) = w.plan(action(opening=70), echo, 1000.0)
    assert write.payload == {"valve_opening_degree": 70} and not w.failed


def test_setpoint_reasserted_after_trv_schedule_transition():
    store = DeviceStore("z", {"t"})
    w = TrvWriter("t", remote_sensor=True)
    w.plan(action(setpoint=21.0), None, 0.0)
    store.handle("z/t", json.dumps({**TRV_STATE, "occupied_heating_setpoint": 16}), 500.0)
    (write,) = w.plan(action(setpoint=21.0), store.get("t"), 621.0)
    assert write.payload == {"occupied_heating_setpoint": 21.0}


def test_schedule_mirror_sent_once_and_on_change():
    week = parse_week("00:00/16 07:00/20 22:00/16")
    w = TrvWriter("t", remote_sensor=True)
    (write,) = w.plan(action(), None, 0.0, week.trvzb_payload())
    assert write.payload["weekly_schedule_monday"] == "00:00/16 07:00/20 22:00/16"
    assert w.plan(action(), None, 60.0, week.trvzb_payload()) == []
    other = parse_week("00:00/16 06:00/20").trvzb_payload()
    (write,) = w.plan(action(), None, 120.0, other)
    assert set(write.payload) == set(other)


def test_no_mirror_runs_heat_mode():
    w = TrvWriter("t", remote_sensor=True, schedule_mirror=False)
    week = parse_week("00:00/16").trvzb_payload()
    (write,) = w.plan(action(), None, 0.0, week)
    assert write.payload["system_mode"] == "heat"
    assert not any(k.startswith("weekly_schedule") for k in write.payload)


def test_forget_resends_everything():
    w = TrvWriter("t", remote_sensor=True)
    w.plan(action(), None, 0.0)
    w.forget()
    (write,) = w.plan(action(), None, 10.0)
    assert len(write.payload) == 7


# --- settings a TRV does not support ---------------------------------------------------

# Zigbee2MQTT 2.x logs a failed write on `bridge/logging` (`lib/extension/publish.ts`).
UNSUPPORTED_LOG = {
    "level": "error",
    "message": (
        "z2m: Publish 'set' 'smart_temperature_control' to 'trv_a' failed: 'Error: ZCL "
        'command 0x847127fffe1a2b3c/1 hvacThermostat.write({"6000":{"value":0,'
        "\"type\":16}}, {}) failed (Status 'UNSUPPORTED_ATTRIBUTE')'"
    ),
}


def test_parse_rejection_reads_unsupported_and_unknown_keys():
    assert parse_rejection(UNSUPPORTED_LOG) == ("trv_a", "smart_temperature_control")
    no_converter = {
        "level": "error",
        "message": "No converter available for 'smart_temperature_control' on 'trv a/b': (false)",
    }
    assert parse_rejection(no_converter) == ("trv a/b", "smart_temperature_control")
    timeout = {
        "level": "error",
        "message": "Publish 'set' 'system_mode' to 'trv_a' failed: 'Error: Timeout'",
    }
    assert parse_rejection(timeout) is None  # may work next time: the reconciler retries
    assert parse_rejection({"level": "info", "message": "MQTT publish"}) is None
    assert parse_rejection("not an object") is None


def test_store_records_a_rejected_setting_on_the_device():
    store = DeviceStore("zigbee2mqtt", {"trv_a"})
    store.handle("zigbee2mqtt/bridge/logging", json.dumps(UNSUPPORTED_LOG), 1.0)
    assert store.get("trv_a").unsupported == {"smart_temperature_control"}
    store.handle("zigbee2mqtt/bridge/logging", b"garbage", 2.0)
    assert store.get("trv_a").unsupported == {"smart_temperature_control"}


def test_an_unsupported_setting_is_not_sent_again_and_blocks_nothing():
    store = DeviceStore("zigbee2mqtt", {"trv_a"})
    w = TrvWriter("trv_a", remote_sensor=True)
    w.plan(action(), store.get("trv_a"), 0.0)
    store.handle("zigbee2mqtt/bridge/logging", json.dumps(UNSUPPORTED_LOG), 1.0)
    echo = store.get("trv_a")
    assert w.plan(action(opening=40), echo, 60.0)[0].payload == {"valve_opening_degree": 40}
    # The TRV rejoins: everything else is sent again, that setting is not.
    w.forget()
    (write,) = w.plan(action(), echo, 120.0)
    assert "smart_temperature_control" not in write.payload
    assert write.payload["valve_closing_degree"] == 100
    assert write.payload["occupied_heating_setpoint"] == 20.5
    # Turning off adaptive PID on a TRV that has none loses nothing: not a failure.
    assert w.failed == set()


def test_a_governed_setting_the_device_does_not_expose_is_skipped():
    w = TrvWriter("trv_a", remote_sensor=True)
    exposes = frozenset(TRV_STATE) - {"smart_temperature_control"}
    (write,) = w.plan(action(), None, 0.0, exposes=exposes)
    assert "smart_temperature_control" not in write.payload
    assert write.payload["valve_closing_degree"] == 100
    # Unknown exposes (no bridge/devices yet): sent as before.
    w2 = TrvWriter("trv_a", remote_sensor=True)
    assert "smart_temperature_control" in w2.plan(action(), None, 0.0, exposes=None)[0].payload


def test_an_essential_setting_the_trv_rejects_is_reported():
    store = DeviceStore("zigbee2mqtt", {"trv_a"})
    w = TrvWriter("trv_a", remote_sensor=True)
    w.plan(action(), store.get("trv_a"), 0.0)
    log = dict(UNSUPPORTED_LOG)
    log["message"] = log["message"].replace("smart_temperature_control", "valve_opening_degree")
    store.handle("zigbee2mqtt/bridge/logging", json.dumps(log), 1.0)
    writes = w.plan(action(opening=30, setpoint=21.0), store.get("trv_a"), 60.0)
    assert writes[0].payload == {"occupied_heating_setpoint": 21.0}
    assert w.failed == {"valve_opening_degree"}  # shown as rejected, and alerted
