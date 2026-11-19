from pathlib import Path

import pytest
import yaml

from radiate.config import ConfigError, load_site, parse_day, parse_site, parse_week
from radiate.config.schedule import ScheduleError
from radiate.core.types import HeatSource, RoomRole
from radiate.sim.reference import ROOMS, setpoint

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}


def minimal(**over) -> dict:
    data = {
        "mqtt": {"host": "broker"},
        "schedules": {"default": "00:00/16 07:00/20 22:00/16"},
        "rooms": [
            {"id": "a", "trv": "trv_a", "sensor": "t_a"},
            {"id": "b", "trv": "trv_b", "sensor": "t_b"},
            {"id": "hall", "role": "passive", "sensor": "t_hall"},
        ],
    }
    data.update(over)
    return data


# --- schedules -------------------------------------------------------------------------


def test_day_carries_last_setpoint_over_midnight():
    day = parse_day("06:30/20 22:30/16")
    assert day.transitions == ((0, 16.0), (390, 20.0), (1350, 16.0))
    assert day.at(0) == 16 and day.at(390) == 20 and day.at(1349) == 20


def test_day_trvzb_format():
    assert parse_day("00:00/16 06:30/20.5").trvzb() == "00:00/16 06:30/20.5"


@pytest.mark.parametrize(
    "text",
    ["", "6:30/20", "06:30/3", "06:30/20.3", "06:30/20 06:30/18", "25:00/20"],
)
def test_day_rejects(text):
    with pytest.raises(ScheduleError):
        parse_day(text)


def test_day_max_six_transitions():
    seven = " ".join(f"{h:02d}:00/{16 + (h // 2) % 2}" for h in range(0, 14, 2))
    with pytest.raises(ScheduleError, match="at most 6"):
        parse_day(seven)


def test_week_specific_day_beats_group():
    week = parse_week(
        {"daily": "00:00/16 07:00/20", "weekend": "00:00/16 09:00/21", "sun": "00:00/18"}
    )
    assert week.setpoint_at(0, 8 * 60) == 20
    assert week.setpoint_at(5, 10 * 60) == 21
    assert week.setpoint_at(6, 10 * 60) == 18


def test_week_needs_every_day():
    with pytest.raises(ScheduleError, match="saturday, sunday"):
        parse_week({"weekdays": "00:00/16"})


def test_next_change_crosses_days():
    week = parse_week({"weekdays": "00:00/16 07:00/20 22:00/16", "weekend": "00:00/16"})
    assert week.next_change(0, 6 * 60) == (20.0, 3600.0)
    # Friday 23:00: next change is Monday 07:00.
    sp, secs = week.next_change(4, 23 * 60)
    assert sp == 20 and secs == (60 + 48 * 60 + 7 * 60) * 60


def test_trvzb_payload_has_all_days():
    payload = parse_week("00:00/16 07:00/20").trvzb_payload()
    assert set(payload) == {
        f"weekly_schedule_{d}"
        for d in ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
    }


# --- site ------------------------------------------------------------------------------


def test_example_matches_reference_house():
    site = load_site(EXAMPLE, env=ENV)
    rooms = {r.id: r for r in site.house.rooms}
    assert [r.id for r in site.house.rooms] == [s.id for s in ROOMS]
    for spec in ROOMS:
        r = rooms[spec.id]
        assert r.role is spec.role, spec.id
        assert r.heat_source == spec.heat_source, spec.id
        assert r.has_humidity == spec.humidity, spec.id
    assert rooms["lounge"].heat_source is HeatSource.EPISODIC
    assert rooms["stairs"].role is RoomRole.PASSIVE
    # Same schedules as the simulator's reference house.
    for spec in ROOMS:
        if spec.role is RoomRole.PASSIVE:
            continue
        week = site.schedule_for(spec.id)
        for minute in range(0, 1440, 15):
            assert week.setpoint_at(2, minute) == setpoint(spec, minute), (spec.id, minute)
    assert [r.id for r in site.house.rooms if r.actuation_enabled] == ["bedroom_1"]
    assert site.dry_run is True
    assert site.mqtt.password == "m" and site.shelly.password == "s"
    assert site.devices["toilet"].sensor is None


def test_pilot_valve_default_is_first_trv():
    site = parse_site(minimal())
    assert [r.id for r in site.house.rooms if r.actuation_enabled] == ["a"]
    assert any("pilot" in n for n in site.notes)


def test_explicit_actuation_wins():
    data = minimal()
    data["rooms"][1]["actuate"] = True
    site = parse_site(data)
    assert [r.id for r in site.house.rooms if r.actuation_enabled] == ["b"]


def test_problems_are_collected_with_paths():
    data = minimal(boiler={"min_burn_min": 2, "bogus": 1})
    data["rooms"].append({"id": "Bad Id"})
    data["rooms"].append({"id": "c", "trv": "trv_a"})
    data["rooms"].append({"id": "hall2", "role": "passive", "trv": "x"})
    with pytest.raises(ConfigError) as exc:
        parse_site(data)
    text = "\n".join(exc.value.problems)
    assert "boiler.min_burn_min: must be 4 to 20" in text
    assert "boiler.bogus: unknown key" in text
    assert "rooms[3].id" in text
    assert "rooms[4].trv: 'trv_a' is already used by rooms[0].trv" in text
    assert "rooms[4].sensor: required" in text
    assert "rooms[5].trv: a passive room has no controllable valve" in text


def test_missing_env_is_reported():
    data = minimal(mqtt={"host": "b", "password": "${NOPE}"})
    with pytest.raises(ConfigError, match="NOPE is not set"):
        parse_site(data, env={})


def test_mqtt_required_for_zigbee_rooms():
    data = minimal()
    del data["mqtt"]
    with pytest.raises(ConfigError, match="mqtt: required"):
        parse_site(data)


def test_store_windows_and_boiler_units():
    site = parse_site(
        minimal(store={"windows": ["17:00-21:00", "06:00-07:30"]}, boiler={"min_burn_min": 10})
    )
    assert site.house.store.windows == ((360, 450), (1020, 1260))
    assert site.house.boiler.min_burn_s == 600


def test_unknown_schedule_and_timezone():
    data = minimal(house={"timezone": "Mars/Base"})
    data["rooms"][0]["schedule"] = "nope"
    with pytest.raises(ConfigError) as exc:
        parse_site(data)
    text = "\n".join(exc.value.problems)
    assert "unknown time zone" in text and "unknown schedule 'nope'" in text


def test_yaml_round_trip(tmp_path):
    path = tmp_path / "r.yaml"
    path.write_text(yaml.safe_dump(minimal()))
    assert load_site(path).house.rooms[0].id == "a"
    path.write_text("rooms: [")
    with pytest.raises(ConfigError, match="not valid YAML"):
        load_site(path)


def test_numbers_from_environment():
    data = minimal(mqtt={"host": "b", "port": "${PORT}"})
    assert parse_site(data, env={"PORT": "1884"}).mqtt.port == 1884
    data = minimal(mqtt={"host": "b", "port": "${PORT}"})
    with pytest.raises(ConfigError, match="mqtt.port"):
        parse_site(data, env={"PORT": "abc"})


def test_shifted_schedule_stays_in_trvzb_steps():
    week = parse_week("00:00/16 06:30/18 22:30/16")
    assert week.shifted(0) is week
    up = week.shifted(1.5)
    assert up.days[0].trvzb() == "00:00/17.5 06:30/19.5 22:30/17.5"
    assert parse_week("00:00/34").shifted(3).days[0].trvzb() == "00:00/35"
