from pathlib import Path

import pytest

from radiate.config import ConfigError, load_site, parse_day, parse_site, parse_week
from radiate.config.household import (
    Household,
    Person,
    RoomKind,
    RoomLink,
    Routine,
    Temperatures,
    UseLevel,
    compile_household,
)

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}

IN_USE, OCCASIONAL, UNUSED = UseLevel.IN_USE, UseLevel.OCCASIONAL, UseLevel.UNUSED


def t(text: str) -> int:
    h, m = text.split(":")
    return int(h) * 60 + int(m)


def span(text: str) -> tuple[int, int]:
    a, b = text.split("-")
    return t(a), t(b)


# The owner's household, with roles instead of names. Weekends: both usually out.
WEEKEND = Routine(up_min=t("08:30"), bed_min=t("22:30"), out=(span("10:00-18:00"),))
EARLY_RISER = Person(
    id="early_riser",
    weekdays=Routine(up_min=t("06:30"), bed_min=t("22:30"), out=(span("07:30-18:00"),)),
    weekend=WEEKEND,
)
HOME_WORKER = Person(
    id="home_worker",
    weekdays=Routine(up_min=t("08:00"), bed_min=t("22:30"), work=(span("08:00-18:00"),)),
    weekend=WEEKEND,
)
BOTH = ("early_riser", "home_worker")


def link(room_id: str, weekdays: UseLevel, weekend: UseLevel | None = None, **kw) -> RoomLink:
    return RoomLink(room_id, weekdays, weekend or weekdays, **kw)


REFERENCE = Household(
    people=(EARLY_RISER, HOME_WORKER),
    rooms=(
        link("bedroom_1", IN_USE, kind=RoomKind.BEDROOM, people=BOTH),
        link("bedroom_2", UNUSED),
        link("bedroom_3", IN_USE, kind=RoomKind.OFFICE, people=("home_worker",)),
        link("bathroom", OCCASIONAL),
        link("dining", IN_USE),
        link("lounge", UNUSED),
        link("kitchen", IN_USE),
        link("toilet", UNUSED, OCCASIONAL, kind=RoomKind.ALL_DAY, temperature_c=15),
    ),
)

# What the rules produce, as (weekdays, weekend) in the TRVZB format.
EXPECTED = {
    # Hand-written weekend: 19° 07:30 to 09:30. Both get up at 08:30 here.
    "bedroom_1": (
        "00:00/14 06:00/19 08:30/14 21:30/19 22:30/14",
        "00:00/14 08:00/19 09:00/14 21:30/19 22:30/14",
    ),
    "bedroom_2": ("00:00/14", "00:00/14"),
    "bedroom_3": ("00:00/14 07:30/19 18:00/14", "00:00/14"),
    "bathroom": (
        "00:00/14 06:00/16 08:30/14 17:30/16 22:30/14",
        "00:00/14 08:00/16 10:00/14 17:30/16 22:30/14",
    ),
    "dining": (
        "00:00/14 06:00/19 08:30/14 17:30/19 22:30/14",
        "00:00/14 08:00/19 10:00/14 17:30/19 22:30/14",
    ),
    "lounge": ("00:00/14", "00:00/14"),
    "kitchen": (
        "00:00/14 06:00/19 08:30/14 17:30/19 22:30/14",
        "00:00/14 08:00/19 10:00/14 17:30/19 22:30/14",
    ),
    "toilet": ("00:00/14", "00:00/14 08:00/15 22:30/14"),
}


def days(week) -> tuple[str, str]:
    assert all(week.days[i] == week.days[0] for i in range(5))
    assert week.days[5] == week.days[6]
    return week.days[0].trvzb(), week.days[5].trvzb()


# --- compiling -------------------------------------------------------------------------


def test_reference_household():
    compiled = compile_household(REFERENCE)
    assert compiled.notes == ()
    assert {rid: days(w) for rid, w in compiled.schedules.items()} == EXPECTED


def test_example_file_compiles_to_the_reference_household():
    site = load_site(EXAMPLE, env=ENV)
    for rid, expected in EXPECTED.items():
        assert days(site.schedule_for(rid)) == expected, rid
    assert site.devices["dining"].schedule is None
    assert site.schedules == {}


def test_home_worker_away():
    normal = compile_household(REFERENCE).schedules
    away = compile_household(REFERENCE, away=frozenset({"home_worker"})).schedules
    assert days(away["bedroom_3"]) == ("00:00/14", "00:00/14")
    # The bedroom stays warm for the person at home; nobody needs it at 08:00.
    assert days(away["bedroom_1"])[0] == "00:00/14 06:00/19 07:00/14 21:30/19 22:30/14"
    assert days(away["dining"])[0] == "00:00/14 06:00/19 07:30/14 17:30/19 22:30/14"
    for rid in ("bedroom_2", "lounge", "toilet"):
        assert away[rid] == normal[rid], rid
    # Both keep the same weekend routine, so weekends follow the person at home.
    for rid in normal:
        assert days(away[rid])[1] == days(normal[rid])[1], rid


def test_everyone_away_leaves_every_room_unused():
    temps = Temperatures(unused_c=13, night_c=15)
    household = Household(REFERENCE.people, REFERENCE.rooms, temps)
    compiled = compile_household(household, away=frozenset(BOTH))
    assert {days(w) for w in compiled.schedules.values()} == {("00:00/13", "00:00/13")}


def test_unknown_person_away():
    with pytest.raises(ValueError, match="nobody"):
        compile_household(REFERENCE, away=frozenset({"nobody"}))


def test_six_transition_limit_drops_shortest_and_says_so():
    busy = Routine(
        up_min=t("06:00"), bed_min=t("22:00"), out=(span("08:00-12:00"), span("13:30-17:00"))
    )
    person = Person("p", busy, busy)
    household = Household((person,), (RoomLink("hall", IN_USE, IN_USE, name="Hall"),))
    compiled = compile_household(household)
    # 05:30 to 08:00, 11:30 to 13:30 and 16:30 to 22:00 need seven transitions.
    assert days(compiled.schedules["hall"])[0] == "00:00/14 05:30/19 08:00/14 16:30/19 22:00/14"
    assert compiled.notes == (
        "Hall, weekdays: dropped 19° 11:30 to 13:30 to fit the TRV's limit of 6 changes a day",
        "Hall, weekend: dropped 19° 11:30 to 13:30 to fit the TRV's limit of 6 changes a day",
    )


@pytest.mark.parametrize(
    ("out", "expected"),
    [
        # Back at 10:45, preheat from 10:15: 15 minutes off, so one warm period.
        ("10:00-10:45", "00:00/14 06:30/19 22:00/14"),
        # Back at 11:00, preheat from 10:30: exactly 30 minutes off still merges.
        ("10:00-11:00", "00:00/14 06:30/19 22:00/14"),
        ("10:00-11:01", "00:00/14 06:30/19 10:00/14 10:31/19 22:00/14"),
    ],
)
def test_merge_gaps_of_30_minutes_or_less(out, expected):
    r = Routine(up_min=t("07:00"), bed_min=t("22:00"), out=(span(out),))
    household = Household((Person("p", r, r),), (RoomLink("hall", IN_USE, IN_USE),))
    assert days(compile_household(household).schedules["hall"])[0] == expected


def test_preheat_is_a_parameter_per_room():
    rooms = (link("dining", IN_USE), link("kitchen", IN_USE))
    household = Household((EARLY_RISER,), rooms)
    compiled = compile_household(household, preheat_min={"kitchen": 60})
    assert days(compiled.schedules["dining"])[0].startswith("00:00/14 06:00/19")
    assert days(compiled.schedules["kitchen"])[0].startswith("00:00/14 05:30/19")
    assert days(compile_household(household, preheat_min=0).schedules["dining"])[0].startswith(
        "00:00/14 06:30/19"
    )


def test_temperatures_round_to_half_degrees_and_night_differs_from_unused():
    temps = Temperatures(in_use_c=19.3, occasional_c=16.0, unused_c=13.2, night_c=15.9)
    household = Household((EARLY_RISER,), (link("dining", IN_USE), link("lounge", UNUSED)), temps)
    compiled = compile_household(household)
    assert days(compiled.schedules["dining"])[0] == (
        "00:00/16 06:00/19.5 07:30/13 17:30/19.5 22:30/16"
    )
    # An unused room still drops to the night temperature overnight.
    assert days(compiled.schedules["lounge"])[0] == "00:00/16 06:00/13 22:30/16"


def test_all_day_and_shared_rooms_follow_only_their_people():
    rooms = (
        link("dining", IN_USE, people=("home_worker",)),
        link("toilet", IN_USE, kind=RoomKind.ALL_DAY, people=("home_worker",)),
    )
    compiled = compile_household(Household((EARLY_RISER, HOME_WORKER), rooms))
    assert days(compiled.schedules["dining"])[0] == "00:00/14 07:30/19 08:30/14 17:30/19 22:30/14"
    assert days(compiled.schedules["toilet"])[0] == "00:00/14 07:30/19 22:30/14"


# --- describing ------------------------------------------------------------------------


def test_describe_day_and_week():
    assert parse_day("00:00/14 06:00/19 08:30/14 21:30/19 22:30/14").describe() == (
        "19° 06:00 to 08:30 and 21:30 to 22:30, otherwise 14°"
    )
    assert parse_day("00:00/14").describe() == "14° all day"
    assert parse_day("00:00/14 08:00/15.5 12:00/19").describe() == (
        "15.5° 08:00 to 12:00, 19° 12:00 to 24:00, otherwise 14°"
    )
    week = parse_week({"weekdays": "00:00/14 07:30/19 18:00/14", "weekend": "00:00/14"})
    assert week.describe() == [
        ("Mon to Fri", "19° 07:30 to 18:00, otherwise 14°"),
        ("Sat and Sun", "14° all day"),
    ]
    assert parse_week({"daily": "00:00/14", "wed": "00:00/16"}).describe() == [
        ("Mon and Tue", "14° all day"),
        ("Wed", "16° all day"),
        ("Thu to Sun", "14° all day"),
    ]


# --- house file ------------------------------------------------------------------------


def house(household: dict, **room_over) -> dict:
    rooms = [
        {"id": "bedroom", "trv": "trv_a", "sensor": "t_a"},
        {"id": "office", "trv": "trv_b", "sensor": "t_b"},
        {"id": "hall", "role": "passive", "sensor": "t_hall"},
    ]
    rooms[0].update(room_over)
    return {"mqtt": {"host": "broker"}, "rooms": rooms, "household": household}


def household(**over) -> dict:
    data = {
        "people": {
            "a": {
                "weekdays": {"up": "07:00", "work": "09:00-17:00", "bed": "23:00"},
                "weekend": {"up": "09:00", "bed": "23:00"},
            }
        },
        "rooms": {
            "bedroom": {"use": "in_use", "kind": "bedroom", "people": ["a"]},
            "office": {"use": {"weekdays": "in_use", "weekend": "unused"}, "kind": "office"},
        },
    }
    data.update(over)
    return data


def problems(data: dict) -> str:
    with pytest.raises(ConfigError) as exc:
        parse_site(data)
    return "\n".join(exc.value.problems)


def test_household_needs_no_schedules_section():
    data = house(household())
    data["household"]["rooms"]["office"]["people"] = ["a"]
    site = parse_site(data)
    assert site.schedules == {}
    assert days(site.schedule_for("office")) == ("00:00/14 08:30/19 17:00/14", "00:00/14")
    assert site.household is not None and site.household.people[0].id == "a"


def test_room_outside_the_household_keeps_its_schedule():
    data = house(household())
    data["household"]["rooms"]["office"]["people"] = ["a"]
    del data["household"]["rooms"]["office"]
    text = problems(data)
    assert "rooms[1].schedule: unknown schedule 'default'" in text
    data["schedules"] = {"default": "00:00/16 07:00/20"}
    site = parse_site(data)
    assert site.schedule_for("office") == parse_week("00:00/16 07:00/20")
    assert site.devices["office"].schedule == "default"


def test_household_validation_problems():
    data = house(
        household(
            temperatures={"night": 40, "warm": 20},
            people={
                "a": {
                    "weekdays": {"up": "25:00", "bed": "23:00"},
                    "weekend": {"up": "09:00", "bed": 1350, "lunch": "x"},
                },
                "b": {
                    "weekdays": {
                        "up": "07:00",
                        "bed": "22:00",
                        "out": "06:00-08:00",
                        "work": ["09:00-12:00", "11:00-13:00"],
                    }
                },
                "c": {"weekdays": {"up": "08:00", "bed": "07:00"}},
                "Bad Id": {"weekdays": {"up": "08:00", "bed": "22:00"}},
            },
            rooms={
                "bedroom": {"use": "in_use", "kind": "bedroom"},
                "office": {"use": "sometimes", "kind": "study", "people": ["zed"]},
                "hall": {"use": "in_use"},
                "attic": {"use": "unused"},
            },
            pets={},
        ),
        schedule="mine",
    )
    text = problems(data)
    for expected in [
        "household.pets: unknown key",
        "household.temperatures.warm: unknown key",
        "household.temperatures.night: must be 4 to 35",
        "household.people.a.weekdays.up: '25:00' is not a time as HH:MM",
        'household.people.a.weekend.bed: put the time in quotes, for example "22:30"',
        "household.people.a.weekend.lunch: unknown key",
        "household.people.b.weekdays.out: 06:00-08:00 is outside 07:00 to 22:00 (up to bed)",
        "household.people.b.weekdays: out and work times overlap at 11:00-13:00",
        "household.people.c.weekdays.bed: must be after up, on the same day",
        "household.people.Bad Id: person ids are lower case letters",
        "household.rooms.bedroom.people: required for a bedroom",
        "household.rooms.office.use: must be in_use, occasional or unused",
        "household.rooms.office.kind: must be shared, bedroom, office or all_day",
        "household.rooms.hall: a passive room has no valve, so it has no schedule",
        "household.rooms.attic: unknown room 'attic'",
        "rooms[0].schedule: the household section builds this room's schedule",
    ]:
        assert expected in text, expected


def test_household_room_people_and_use_problems():
    data = house(
        household(
            rooms={
                "bedroom": {"use": {"weekdays": "in_use"}, "people": ["a", "a"]},
                "office": {"use": "in_use", "kind": "office", "people": ["zed"]},
            }
        )
    )
    text = problems(data)
    assert "household.rooms.bedroom.use.weekend: required when the use differs" in text
    assert "household.rooms.bedroom.people: a person is listed twice" in text
    assert "household.rooms.office.people: unknown person 'zed'" in text


def test_empty_household_and_no_schedules():
    text = problems(house({"people": {}, "rooms": {}}))
    assert "household.people: at least one person is required" in text
    assert "household.rooms: at least one room is required" in text
    data = house(household())
    del data["household"]
    assert "schedules: at least one schedule, or a household section" in problems(data)


def test_household_notes():
    data = house(household(temperatures={"night": 11}))
    del data["household"]["rooms"]["office"]
    data["schedules"] = {"default": "00:00/16"}
    site = parse_site(data)
    text = "\n".join(site.notes)
    assert "household.temperatures.night is 11°: below 12° walls" in text
    assert "household.people.a has work hours but no office room" in text


def test_dropped_periods_reach_the_site_notes():
    busy = {"up": "06:00", "bed": "22:00", "out": ["08:00-12:00", "13:30-17:00"]}
    data = house(
        {
            "people": {"a": {"weekdays": busy}},
            "rooms": {"bedroom": {"use": "in_use"}, "office": {"use": "unused"}},
        }
    )
    site = parse_site(data)
    assert any(n.startswith("Bedroom, weekdays: dropped 19° 11:30 to 13:30") for n in site.notes)


def test_mirror_payload_shifts_internal_sensor_rooms():
    site = load_site(EXAMPLE, env=ENV)
    assert site.mirror_payload("toilet")["weekly_schedule_saturday"] == (
        "00:00/15.5 08:00/16.5 22:30/15.5"
    )
    assert site.mirror_payload("dining") == site.schedule_for("dining").trvzb_payload()
