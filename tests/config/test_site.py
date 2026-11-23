from pathlib import Path

import pytest
import yaml

from radiate.config import ConfigError, load_site, parse_day, parse_site, parse_week
from radiate.config.schedule import ScheduleError
from radiate.core.types import DemandMode, HeatSource, RoomRole
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


def test_history_days_default_range_and_off():
    assert parse_site(minimal()).history_days == 14
    assert parse_site(minimal(house={"history_days": 0})).history_days == 0
    assert parse_site(minimal(house={"history_days": 3.5})).history_days == 3.5
    with pytest.raises(ConfigError, match="house.history_days: must be 0 to 90"):
        parse_site(minimal(house={"history_days": 120}))


def test_monitoring_defaults_and_ranges():
    m = parse_site(minimal()).monitoring
    assert (m.low_battery_pct, m.weak_signal_lqi) == (20, 40)
    m = parse_site(minimal(monitoring={"low_battery_pct": 30, "weak_signal_lqi": 60})).monitoring
    assert (m.low_battery_pct, m.weak_signal_lqi) == (30, 60)
    with pytest.raises(ConfigError) as exc:
        parse_site(minimal(monitoring={"low_battery_pct": 80, "weak_signal_lqi": 0, "x": 1}))
    assert exc.value.problems == [
        "monitoring.x: unknown key",
        "monitoring.low_battery_pct: must be 5 to 50",
        "monitoring.weak_signal_lqi: must be 5 to 150",
    ]


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


def test_demand_mode():
    boiler = parse_site(minimal()).house.boiler
    assert boiler.demand_mode is DemandMode.ECO and boiler.eco_limit_k == 1.5
    boiler = parse_site(minimal(boiler={"demand_mode": "comfort", "eco_limit_k": 2})).house.boiler
    assert boiler.demand_mode is DemandMode.COMFORT and boiler.eco_limit_k == 2.0
    with pytest.raises(ConfigError) as err:
        parse_site(minimal(boiler={"demand_mode": "turbo", "eco_limit_k": 4}))
    assert "boiler.demand_mode: must be eco or comfort" in err.value.problems
    assert "boiler.eco_limit_k: must be 0.5 to 3" in err.value.problems
    with pytest.raises(ConfigError, match="eco_limit_k: must be at least comfort_limit_k"):
        parse_site(minimal(boiler={"comfort_limit_k": 1.2, "eco_limit_k": 1.0}))


def test_damp_margin():
    assert parse_site(minimal()).house.boiler.damp_margin_k == 0.3
    boiler = parse_site(minimal(boiler={"damp_margin_k": 0})).house.boiler
    assert boiler.damp_margin_k == 0.0
    with pytest.raises(ConfigError, match="boiler.damp_margin_k: must be 0 to 1"):
        parse_site(minimal(boiler={"damp_margin_k": 1.5}))


def test_learning_memory():
    assert parse_site(minimal()).house.learning.memory_days == 730
    assert parse_site(minimal()).house.learning.learn_on_trv_fallback is False
    site = parse_site(minimal(learning={"memory_days": 90, "learn_on_trv_fallback": True}))
    assert site.house.learning.memory_days == 90
    assert site.house.learning.learn_on_trv_fallback is True
    with pytest.raises(ConfigError) as err:
        parse_site(minimal(learning={"memory_days": 0.5, "forget": True}))
    assert "learning.memory_days: must be 1 to 3650" in err.value.problems
    assert "learning.forget: unknown key" in err.value.problems


def test_suggestion_settings():
    d = parse_site(minimal()).house.suggestions
    assert (d.min_confidence, d.min_learning_h, d.min_rooms) == (0.6, 48.0, 3)
    assert (d.heat_loss_ratio, d.design_outdoor_c, d.mild_outdoor_c) == (1.6, -2.0, 5.0)
    site = parse_site(
        minimal(suggestions={"min_learning_h": 72, "min_rooms": 4, "design_outdoor_c": -5})
    )
    s = site.house.suggestions
    assert (s.min_learning_h, s.min_rooms, s.design_outdoor_c) == (72, 4, -5)
    assert isinstance(s.min_rooms, int)
    with pytest.raises(ConfigError) as err:
        parse_site(
            minimal(
                suggestions={
                    "heat_loss_ratio": 9,
                    "min_rooms": 2.5,
                    "mild_outdoor_c": -3,
                    "guess": True,
                }
            )
        )
    problems = err.value.problems
    assert "suggestions.heat_loss_ratio: must be 1.1 to 5" in problems
    assert "suggestions.min_rooms: must be a whole number" in problems
    assert "suggestions.mild_outdoor_c: must be above design_outdoor_c" in problems
    assert "suggestions.guess: unknown key" in problems


# --- unheated rooms --------------------------------------------------------------------


def _problems(data: dict) -> list[str]:
    with pytest.raises(ConfigError) as exc:
        parse_site(data)
    return exc.value.problems


def test_unheated_room_needs_only_a_sensor():
    data = minimal()
    data["rooms"].append({"id": "landing", "name": "Landing", "role": "unheated", "sensor": "t_l"})
    site = parse_site(data)
    room = site.house.room("landing")
    assert room.role is RoomRole.UNHEATED
    assert not room.controllable and not room.actuation_enabled
    assert room.has_humidity  # recorded by default: nothing else uses it
    assert site.devices["landing"].sensor == "t_l"
    assert site.devices["landing"].schedule is None
    assert "landing" not in site.room_schedules  # never needs a schedule


def test_unheated_room_does_not_need_the_default_schedule():
    data = minimal(schedules={"other": "00:00/16"})
    data["rooms"] = [
        {"id": "a", "trv": "trv_a", "sensor": "t_a", "schedule": "other"},
        {"id": "loft", "role": "unheated", "sensor": "t_l"},
    ]
    assert parse_site(data).house.room("loft").role is RoomRole.UNHEATED


def test_unheated_room_humidity_can_be_turned_off():
    data = minimal()
    data["rooms"].append({"id": "loft", "role": "unheated", "sensor": "t_l", "humidity": False})
    assert parse_site(data).house.room("loft").has_humidity is False


def test_unheated_room_problems():
    data = minimal()
    data["rooms"] += [
        {"id": "u1", "role": "unheated"},
        {"id": "u2", "role": "unheated", "sensor": "t_u2", "trv": "trv_u2"},
        {"id": "u3", "role": "unheated", "sensor": "t_u3", "schedule": "default"},
        {"id": "u4", "role": "unheated", "sensor": "t_u4", "heat_source": "continuous"},
        {"id": "u5", "role": "unheated", "sensor": "t_u5", "actuate": True},
        {"id": "u6", "role": "heated", "trv": "trv_u6", "sensor": "t_u6"},
    ]
    problems = _problems(data)
    for expected in (
        "rooms[3].sensor: required for an unheated room",
        "rooms[4].trv: an unheated room has no radiator, so it has no TRV",
        "rooms[5].schedule: an unheated room has no radiator, so it has no schedule",
        "rooms[6].heat_source: an unheated room has no room model, so it has no heat source",
        "rooms: u5: actuate is true but the room has no trv",
        "rooms[8].role: must be normal, passive, internal_sensor_only or unheated",
    ):
        assert expected in problems, expected


def test_shelly_burner_metering_defaults_and_settings():
    site = parse_site(minimal(shelly={"host": "192.0.2.10"}))
    s = site.shelly
    assert (s.burner_metering, s.burner_threshold_w, s.burner_hysteresis_w) == (True, 100, 20)
    site = parse_site(
        minimal(
            shelly={
                "host": "192.0.2.10",
                "burner_metering": False,
                "burner_threshold_w": 80,
                "burner_hysteresis_w": 10,
            }
        )
    )
    s = site.shelly
    assert (s.burner_metering, s.burner_threshold_w, s.burner_hysteresis_w) == (False, 80, 10)


def test_shelly_burner_hysteresis_below_the_threshold():
    shelly = {"host": "192.0.2.10", "burner_threshold_w": 50, "burner_hysteresis_w": 60}
    with pytest.raises(ConfigError, match="burner_hysteresis_w: must be less than"):
        parse_site(minimal(shelly=shelly))
