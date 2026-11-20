"""`radiate.config.discover`: classify Zigbee2MQTT devices, group them into rooms and
draft a configuration that passes validation."""

import json
import zlib
from dataclasses import replace
from pathlib import Path

import pytest
import yaml

from radiate.config import MqttConfig, parse_site
from radiate.config.discover import (
    DiscoveryError,
    Kind,
    RenderOptions,
    Z2mDevice,
    area_key,
    assign_rooms,
    classify,
    discover,
    exposed_features,
    firmware_warnings,
    is_outdoor,
    parse_version,
    render_yaml,
    room_keys,
    scalar,
)
from radiate.core.types import RoomRole

FIXTURES = Path(__file__).parent / "fixtures"
EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "secret"}


def load(name: str):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def by_id(found):
    return {r.id: r for r in found.rooms}


def dev(name, kind=Kind.TRV, model="TRVZB", build="1.3.0", ieee=None, description=""):
    return Z2mDevice(
        name=name,
        ieee=ieee or f"0x{zlib.crc32(name.encode()):08x}",
        kind=kind,
        model=model,
        description=description,
        features=frozenset({"temperature", "humidity"}) if kind is Kind.SENSOR else frozenset(),
        software_build_id=build,
    )


# --- room matching rules ---------------------------------------------------------------


@pytest.mark.parametrize(
    ("name", "keys"),
    [
        ("trv_bedroom_1", ("bedroom_1",)),
        ("temp_bedroom_1", ("bedroom_1",)),
        ("Bedroom 1 TRV", ("bedroom_1",)),
        ("TRV Bedroom 1", ("bedroom_1",)),
        ("bedroom_1/trv", ("bedroom_1",)),
        ("Bedroom 1 Temperature Sensor", ("bedroom_1",)),
        ("living-room.radiator", ("living_room",)),
        ("Living Room Window", ("living_room",)),
        ("upstairs/Bedroom 1/TRV", ("bedroom_1", "upstairs_bedroom_1")),
        ("upstairs/bathroom", ("bathroom", "upstairs_bathroom")),
        ("0x00124b0029aa1111", ()),
        ("TRV 1", ()),
        ("Temp sensor", ()),
        ("trv", ()),
    ],
)
def test_room_keys(name, keys):
    assert room_keys(name) == keys


def test_room_keys_drop_the_model():
    assert room_keys("SNZB-02B Kitchen", noise=("SNZB-02B",)) == ("kitchen",)
    assert room_keys("Kitchen 02B") == ("kitchen_02b",)


def test_room_keys_make_valid_ids():
    (key,) = room_keys("A very long room name that goes on and on past forty characters")
    assert len(key) <= 40 and not key.endswith("_")


@pytest.mark.parametrize(
    ("text", "key"),
    [
        ("area: Study", "study"),
        ("Under the window. Room = Bedroom 2, by the door", "bedroom_2"),
        ("AREA:landing", "landing"),
        ("in the study", None),
        ("", None),
    ],
)
def test_area_key(text, key):
    assert area_key(text) == key


def test_description_area_beats_the_name():
    rooms, _ = assign_rooms([dev("trv_kitchen", description="area: Utility room")])
    assert [r.id for r in rooms] == ["utility_room"]


def test_trv_and_sensor_pair_up_whatever_the_naming_style():
    rooms, unplaced = assign_rooms(
        [dev("TRV Bedroom 2"), dev("bedroom_2/temperature", Kind.SENSOR, "SNZB-02B")]
    )
    assert unplaced == []
    (room,) = rooms
    assert room.id == "bedroom_2" and room.role == "normal"


def test_clashing_paths_use_the_whole_path_for_every_device_on_it():
    rooms, unplaced = assign_rooms(
        [
            dev("up/bath/trv"),
            dev("up/bath/temp", Kind.SENSOR, "SNZB-02B"),
            dev("down/bath/trv"),
            dev("down/bath/temp", Kind.SENSOR, "SNZB-02B"),
        ]
    )
    assert unplaced == []
    assert {r.id: (r.trv.name, r.sensor.name) for r in rooms} == {
        "down_bath": ("down/bath/trv", "down/bath/temp"),
        "up_bath": ("up/bath/trv", "up/bath/temp"),
    }


def test_second_trv_in_a_room_is_left_for_the_user():
    rooms, unplaced = assign_rooms([dev("trv_lounge"), dev("lounge_trv")])
    assert [r.trv.name for r in rooms] == ["lounge_trv"]
    (u,) = unplaced
    assert u.device.name == "trv_lounge" and "one TRV per room" in u.reason


def test_window_needs_a_room_with_a_trv_or_sensor():
    window = dev("front door", Kind.CONTACT, "SNZB-04P")
    rooms, unplaced = assign_rooms([dev("trv_hall"), window, dev("hall window", Kind.CONTACT)])
    assert rooms[0].window.name == "hall window"
    assert [u.device.name for u in unplaced] == ["front door"]


def test_groups_name_rooms_only_for_unnamed_devices_in_one_small_group():
    trv = dev("0x00124b0000aa0001", ieee="0x00124b0000aa0001")
    other = dev("trv_hall", ieee="0xbb")
    groups = {
        "0x00124b0000aa0001": ["Study radiators", "Every TRV"],
        "0xbb": ["Every TRV"],
    }
    rooms, unplaced = assign_rooms([trv, other], groups)
    assert {r.id for r in rooms} == {"study", "hall"} and unplaced == []


def test_device_in_two_room_groups_is_ambiguous():
    trv = dev("0x00124b0000aa0001", ieee="0x00124b0000aa0001")
    rooms, unplaced = assign_rooms([trv], {"0x00124b0000aa0001": ["Study", "Office"]})
    assert rooms == [] and len(unplaced) == 1


@pytest.mark.parametrize(
    ("name", "outdoor"),
    [
        ("outdoor_temperature", True),
        ("Garden temperature", True),
        ("temp_outside", True),
        ("Garden room temperature", False),
        ("temp_lounge", False),
    ],
)
def test_outdoor_sensor_names(name, outdoor):
    assert is_outdoor(dev(name, Kind.SENSOR, "SNZB-02B")) is outdoor


# --- classification and firmware -------------------------------------------------------


def test_exposed_features_include_nested_climate_features():
    exposes = [
        {
            "type": "climate",
            "features": [{"name": "local_temperature", "property": "local_temperature"}],
        },
        {"type": "numeric", "name": "battery", "property": "battery"},
        "junk",
    ]
    assert exposed_features(exposes) == {"local_temperature", "battery"}
    assert exposed_features(None) == frozenset()


@pytest.mark.parametrize(
    ("model", "features", "kind"),
    [
        ("TRVZB", set(), Kind.TRV),
        ("Other", {"valve_opening_degree"}, Kind.TRV),
        ("Other", {"external_temperature_input", "local_temperature"}, Kind.TRV),
        ("Other", {"occupied_heating_setpoint", "local_temperature"}, Kind.OTHER),
        ("SNZB-02B", set(), Kind.SENSOR),
        ("Other", {"temperature", "humidity"}, Kind.SENSOR),
        ("Other", {"contact", "temperature"}, Kind.CONTACT),
        ("Other", {"state", "power"}, Kind.OTHER),
    ],
)
def test_classify(model, features, kind):
    assert classify(model, frozenset(features)) is kind


@pytest.mark.parametrize(
    ("build", "version"),
    [
        ("1.3.0", (1, 3, 0)),
        ("v1.2", (1, 2, 0)),
        ("1.3.009", (1, 3, 9)),
        ("0x0102", None),
        (None, None),
    ],
)
def test_parse_version(build, version):
    assert parse_version(build) == version


@pytest.mark.parametrize(
    ("build", "expect"),
    [
        ("1.1.3", "older than 1.1.4"),
        ("1.1.4", "older than 1.2.1"),
        ("1.2.0", "older than 1.2.1"),
        ("1.2.1", None),
        ("1.3.0", None),
        (None, "did not report its firmware"),
        ("unknown", "did not report its firmware"),
    ],
)
def test_trvzb_firmware_warnings(build, expect):
    warnings = firmware_warnings(dev("trv_a", build=build))
    if expect is None:
        assert warnings == []
    else:
        (w,) = warnings
        assert expect in w


def test_firmware_is_only_checked_on_trvzb():
    assert firmware_warnings(dev("trv_a", model="Other", build=None)) == []


def test_payload_must_be_a_list():
    with pytest.raises(DiscoveryError):
        discover({"devices": []})
    with pytest.raises(DiscoveryError):
        discover([], {"groups": []})


# --- the reference-house-like fixture --------------------------------------------------


def test_reference_fixture_matches_the_example_configuration():
    found = discover(load("z2m_devices_reference.json"))
    example = yaml.safe_load(EXAMPLE.read_text(encoding="utf-8"))
    rooms = by_id(found)
    for room in example["rooms"]:
        draft = rooms[room["id"]]
        assert draft.role == room.get("role", "normal"), room["id"]
        assert (draft.trv.name if draft.trv else None) == room.get("trv")
        assert (draft.sensor.name if draft.sensor else None) == room.get("sensor")
    assert set(rooms) == {r["id"] for r in example["rooms"]}
    assert found.outdoor.name == "outdoor_temperature"
    assert rooms["bedroom_1"].window.name == "window_bedroom_1"
    assert [d.name for d in found.ignored] == ["plug_hall_lamp"]
    assert found.unplaced == ()
    # The toilet's TRVZB is on 1.1.5: fine for an internal-sensor room, which never
    # sends external_temperature_input.
    assert found.warnings == ()


def test_reference_draft_passes_validation_once_the_secret_is_set():
    found = discover(load("z2m_devices_reference.json"))
    text = render_yaml(found, RenderOptions(mqtt=MqttConfig(username="radiate")))
    data = yaml.safe_load(text)
    assert data["mqtt"]["password"] == "${RADIATE_MQTT_PASSWORD}"
    site = parse_site(data, ENV)
    assert site.dry_run is True and site.shelly is None
    assert site.mqtt.password == "secret" and site.mqtt.username == "radiate"
    assert site.outdoor_sensor == "outdoor_temperature"
    roles = {r.id: r.role for r in site.house.rooms}
    assert roles["toilet"] is RoomRole.INTERNAL_SENSOR_ONLY
    assert "stairs" not in roles  # passive candidates are commented out
    assert [r.id for r in site.house.rooms if r.actuation_enabled] == [found.pilot]
    assert found.pilot == "bedroom_1"  # same pilot as examples/reference-house.yaml
    assert site.house.room("bathroom").has_humidity
    assert site.devices["bedroom_1"].window == "window_bedroom_1"
    assert "# - id: stairs" in text and "#   role: passive" in text
    assert "# shelly:" in text


def test_draft_without_credentials_needs_no_environment():
    found = discover(load("z2m_devices_reference.json"))
    data = yaml.safe_load(render_yaml(found))
    assert "password" not in data["mqtt"]
    parse_site(data, {})


def test_pilot_prefers_a_dry_normal_room_with_current_firmware():
    found = discover(load("z2m_devices_reference.json"))
    assert found.pilot == "bedroom_1"  # the bathroom sorts first but has showers
    rooms = list(found.rooms)
    old = next(r for r in rooms if r.id == "bedroom_1")
    rooms[rooms.index(old)] = replace(old, trv=replace(old.trv, software_build_id="1.1.0"))
    assert replace(found, rooms=tuple(rooms)).pilot == "bedroom_2"
    # With every dry room on old firmware, a bathroom on current firmware is next.
    for i, r in enumerate(rooms):
        if r.role == "normal" and not r.wet:
            rooms[i] = replace(r, trv=replace(r.trv, software_build_id="1.1.0"))
    assert replace(found, rooms=tuple(rooms)).pilot == "bathroom"


def test_external_input_firmware_only_matters_with_a_room_sensor():
    found = discover(load("z2m_devices_reference.json"))
    trv = next(r for r in found.rooms if r.id == "toilet").trv
    assert firmware_warnings(trv) and "1.2.1" in firmware_warnings(trv)[0]
    assert firmware_warnings(trv, uses_external=False) == []


# --- the naming-variants fixture -------------------------------------------------------


@pytest.fixture
def mixed():
    return discover(load("z2m_devices_mixed.json"), load("z2m_groups_mixed.json"))


def test_mixed_fixture_rooms(mixed):
    rooms = {
        r.id: (r.role, r.trv and r.trv.name, r.sensor and r.sensor.name, r.window and r.window.name)
        for r in mixed.rooms
    }
    assert rooms == {
        "bedroom_1": ("normal", "Bedroom 1 TRV", "Bedroom 1 Temperature", None),
        "downstairs_bathroom": (
            "normal",
            "downstairs/bathroom/trv",
            "downstairs/bathroom/temp",
            None,
        ),
        "upstairs_bathroom": ("normal", "upstairs/bathroom/trv", "upstairs/bathroom/temp", None),
        "kitchen": ("normal", "TRV Kitchen", "SNZB-02B Kitchen", None),
        "living_room": ("internal_sensor_only", "living_room_trv", None, "Living Room Window"),
        "study": ("normal", "0x00124b0029aa1111", "Desk thermometer", None),
        "landing": ("internal_sensor_only", "trv_landing", None, None),
        "loft": ("internal_sensor_only", "trv_loft", None, None),
    }
    assert mixed.outdoor.name == "Garden temperature"
    assert mixed.pilot == "bedroom_1"


def test_mixed_fixture_unplaced_and_ignored(mixed):
    unplaced = {u.device.name: u.reason for u in mixed.unplaced}
    assert set(unplaced) == {"Temp sensor", "bedroom_1_trv", "front door", "outside temp"}
    assert "already has TRV Bedroom 1 TRV" in unplaced["bedroom_1_trv"]
    assert "Garden temperature was used" in unplaced["outside temp"]
    assert [d.name for d in mixed.ignored] == ["garage_trv", "Hall thermostat"]
    assert "not supported by Zigbee2MQTT" in mixed.ignored[0].label


def test_mixed_fixture_warnings(mixed):
    text = "\n".join(mixed.warnings)
    assert "old_sensor: disabled" in text
    assert "trv_loft: Zigbee2MQTT has not finished interviewing" in text
    assert "TRV Kitchen: TRVZB firmware 1.0.9 is older than 1.1.4" in text
    assert "living_room_trv: Zigbee2MQTT did not report its firmware" in text
    assert "trv_landing (Example TS0601_trv_example): exposes valve_opening_degree" in text
    assert "Hall thermostat (Example THERM-01): a thermostat without" in text


def test_mixed_draft_passes_validation(mixed):
    text = render_yaml(mixed, RenderOptions(mqtt=MqttConfig(host="192.0.2.20", tls=True)))
    site = parse_site(yaml.safe_load(text), ENV)
    assert site.devices["upstairs_bathroom"].trv == "upstairs/bathroom/trv"
    assert site.mqtt.tls and site.mqtt.host == "192.0.2.20"
    assert "one TRV per room" in text


# --- rendering -------------------------------------------------------------------------


@pytest.mark.parametrize(
    "name",
    [
        "trv_a",
        "Bedroom 1 TRV",
        "on",
        "Yes",
        "null",
        "123",
        "1.5",
        "a: b",
        "x #y",
        "'quoted'",
        '"double"',
        "Ünïcödé Küche",
        "- dash",
        "trailing ",
        "@at",
        "0x00124b0029aa1111",
    ],
)
def test_device_names_survive_yaml(name):
    found = discover(
        [
            {
                "friendly_name": name,
                "ieee_address": "0x01",
                "type": "EndDevice",
                "description": "area: Odd room",
                "definition": {"model": "TRVZB", "vendor": "SONOFF", "exposes": []},
                "software_build_id": "1.3.0",
            }
        ]
    )
    site = parse_site(yaml.safe_load(render_yaml(found)), ENV)
    assert site.devices["odd_room"].trv == name


def test_scalar_quotes_only_when_needed():
    assert scalar("trv_bedroom_1") == "trv_bedroom_1"
    assert scalar("off") == '"off"'
    assert scalar("upstairs/trv") == "upstairs/trv"
    assert scalar("/trv") == '"/trv"'
    assert scalar("192.0.2.5") == "192.0.2.5"
    assert scalar("1.5") == '"1.5"'


def test_comment_text_cannot_break_out_of_a_comment():
    found = discover(
        [
            {
                "friendly_name": "plug\nrooms: []",
                "ieee_address": "0x01",
                "type": "Router",
                "definition": {"model": "P\n1", "vendor": "V", "exposes": []},
            },
            {
                "friendly_name": "trv_a",
                "ieee_address": "0x02",
                "type": "EndDevice",
                "definition": {"model": "TRVZB", "vendor": "SONOFF", "exposes": []},
                "software_build_id": "1.3.0",
            },
        ]
    )
    data = yaml.safe_load(render_yaml(found))
    assert [r["id"] for r in data["rooms"]] == ["a"]


def test_no_trvs_gives_an_empty_room_list_and_a_warning():
    found = discover([])
    assert "No TRVs found" in found.warnings[-1]
    assert yaml.safe_load(render_yaml(found))["rooms"] == []
