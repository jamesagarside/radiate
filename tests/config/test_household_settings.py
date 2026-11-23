"""Household settings: timing, away, weekend days, per-person and per-room overrides."""

import pytest
from test_household import BOTH, EARLY_RISER, EXPECTED, REFERENCE, days, link, span, t

from radiate.config import ConfigError, parse_site
from radiate.config.household import (
    LIMITS,
    AwaySettings,
    DroppedPeriod,
    EveryoneAway,
    Household,
    LivePreheat,
    Person,
    RoomKind,
    RoomLink,
    Routine,
    Timing,
    UseLevel,
    compile_household,
    household_view,
)

IN_USE, UNUSED = UseLevel.IN_USE, UseLevel.UNUSED


def with_(household: Household, **over) -> Household:
    fields = {
        "people": household.people,
        "rooms": household.rooms,
        "temperatures": household.temperatures,
        "timing": household.timing,
        "away": household.away,
        "weekend_days": household.weekend_days,
    }
    return Household(**{**fields, **over})


def weekday(compiled, room_id: str, live: bool = False) -> str:
    weeks = compiled.live if live else compiled.schedules
    return weeks[room_id].days[0].trvzb()


# --- defaults --------------------------------------------------------------------------


def test_defaults_are_the_documented_values():
    t_, a = Timing(), AwaySettings()
    assert (t_.preheat_min, t_.getting_up_min, t_.bedtime_min, t_.merge_gap_min) == (
        30,
        30,
        30,
        30,
    )
    assert t_.live_preheat is LivePreheat.OPTIMUM_START
    assert (a.presence_delay_min, a.presence_stale_after_min, a.return_warmup_min) == (
        60,
        60,
        180,
    )
    assert a.everyone_away is EveryoneAway.FROST
    assert REFERENCE.weekend_days == frozenset({5, 6})


# --- double preheat: valve and live schedules ------------------------------------------


def test_live_schedule_starts_when_needed_and_the_valve_keeps_the_preheat():
    compiled = compile_household(REFERENCE)
    # The valve's week is unchanged: warm periods start 30 minutes early.
    assert {rid: days(w) for rid, w in compiled.schedules.items()} == EXPECTED
    # Live control: warm by 06:30 and 18:00, and optimum start decides when to begin.
    assert days(compiled.live["dining"]) == (
        "00:00/14 06:30/19 08:30/14 18:00/19 22:30/14",
        "00:00/14 08:30/19 10:00/14 18:00/19 22:30/14",
    )
    assert days(compiled.live["bedroom_3"])[0] == "00:00/14 08:00/19 18:00/14"
    assert days(compiled.live["toilet"])[1] == "00:00/14 08:30/15 22:30/14"
    assert days(compiled.live["lounge"]) == days(compiled.schedules["lounge"])


def test_live_preheat_fixed_follows_the_valve_schedule():
    household = with_(REFERENCE, timing=Timing(live_preheat=LivePreheat.FIXED))
    compiled = compile_household(household)
    assert compiled.live == compiled.schedules
    assert household.return_lead_min() == 30
    assert REFERENCE.return_lead_min() == 0


def test_merging_is_decided_on_the_valve_schedule():
    # Back at 11:00: 30 minutes off with the preheat, so the valve keeps the room warm
    # through, and so does live control, rather than cooling for an hour.
    r = Routine(up_min=t("07:00"), bed_min=t("22:00"), out=(span("10:00-11:00"),))
    household = Household((Person("p", r, r),), (RoomLink("hall", IN_USE, IN_USE),))
    compiled = compile_household(household)
    assert weekday(compiled, "hall") == "00:00/14 06:30/19 22:00/14"
    assert weekday(compiled, "hall", live=True) == "00:00/14 07:00/19 22:00/14"


# --- timing ----------------------------------------------------------------------------


def test_preheat_setting_house_wide_and_per_room():
    rooms = (link("dining", IN_USE), link("kitchen", IN_USE, preheat_min=60))
    household = Household((EARLY_RISER,), rooms, timing=Timing(preheat_min=45))
    compiled = compile_household(household)
    assert weekday(compiled, "dining").startswith("00:00/14 05:45/19")
    assert weekday(compiled, "kitchen").startswith("00:00/14 05:30/19")
    assert weekday(compiled, "kitchen", live=True).startswith("00:00/14 06:30/19")


def test_getting_up_and_bedtime_house_wide_and_per_person():
    bedroom = (link("bed", IN_USE, kind=RoomKind.BEDROOM, people=("early_riser",)),)
    base = Household((EARLY_RISER,), bedroom)
    assert weekday(compile_household(base), "bed", live=True) == (
        "00:00/14 06:30/19 07:00/14 22:00/19 22:30/14"
    )
    house_wide = with_(base, timing=Timing(getting_up_min=45, bedtime_min=60))
    assert weekday(compile_household(house_wide), "bed", live=True) == (
        "00:00/14 06:30/19 07:15/14 21:30/19 22:30/14"
    )
    slow = Person(
        "early_riser", EARLY_RISER.weekdays, EARLY_RISER.weekend, getting_up_min=60, bedtime_min=0
    )
    per_person = with_(house_wide, people=(slow,))
    # 06:30 to 07:30, and no time before bed: the evening period goes (night is 14 too).
    assert weekday(compile_household(per_person), "bed", live=True) == (
        "00:00/14 06:30/19 07:30/14"
    )


def test_merge_gap_setting():
    r = Routine(up_min=t("07:00"), bed_min=t("22:00"), out=(span("10:00-11:30"),))
    household = Household((Person("p", r, r),), (RoomLink("hall", IN_USE, IN_USE),))
    assert weekday(compile_household(household), "hall") == (
        "00:00/14 06:30/19 10:00/14 11:00/19 22:00/14"
    )
    wide = with_(household, timing=Timing(merge_gap_min=60))
    assert weekday(compile_household(wide), "hall") == "00:00/14 06:30/19 22:00/14"
    none = with_(household, timing=Timing(merge_gap_min=0, preheat_min=0))
    assert weekday(compile_household(none), "hall") == (
        "00:00/14 07:00/19 10:00/14 11:30/19 22:00/14"
    )


# --- weekend days ----------------------------------------------------------------------


def test_weekend_days_house_wide():
    household = with_(REFERENCE, weekend_days=frozenset({4, 5}))  # Friday and Saturday
    compiled = compile_household(household)
    dining = compiled.schedules["dining"].days
    assert dining[4].trvzb() == EXPECTED["dining"][1]
    assert dining[5].trvzb() == EXPECTED["dining"][1]
    assert dining[6].trvzb() == EXPECTED["dining"][0]
    # The toilet's weekend use level follows the same days.
    toilet = compiled.schedules["toilet"].days
    assert toilet[4].trvzb() == EXPECTED["toilet"][1] and toilet[6].trvzb() == "00:00/14"


def test_weekend_days_per_person():
    shift = Person(
        "early_riser",
        EARLY_RISER.weekdays,
        EARLY_RISER.weekend,
        weekend_days=frozenset({0, 1}),  # works weekends, off on Monday and Tuesday
    )
    rooms = (link("dining", IN_USE),)
    compiled = compile_household(Household((shift,), rooms))
    week = compiled.schedules["dining"].days
    assert week[0].trvzb() == week[1].trvzb() == "00:00/14 08:00/19 10:00/14 17:30/19 22:30/14"
    assert week[5].trvzb() == week[2].trvzb() == "00:00/14 06:00/19 07:30/14 17:30/19 22:30/14"


def test_notes_name_the_days_when_weekends_differ():
    busy = Routine(
        up_min=t("06:00"), bed_min=t("22:00"), out=(span("08:00-12:00"), span("13:30-17:00"))
    )
    calm = Routine(up_min=t("08:00"), bed_min=t("22:00"))
    person = Person("p", calm, busy, weekend_days=frozenset({2}))
    household = Household((person,), (RoomLink("hall", IN_USE, IN_USE, name="Hall"),))
    compiled = compile_household(household)
    notes = compiled.notes
    assert len(notes) == 1 and notes[0].startswith("Hall, Wed: the valve's own schedule")
    # The same note, structured, for clients that place it on a room and a day.
    (dropped,) = compiled.dropped
    assert dropped == DroppedPeriod(
        room_id="hall",
        day_type="Wed",
        days=(2,),
        start_min=t("11:30"),
        end_min=t("13:30"),
        setpoint_c=19.0,
        text=notes[0],
    )


def test_dropped_periods_are_structured_per_day_type():
    busy = Routine(
        up_min=t("06:00"), bed_min=t("22:00"), out=(span("08:00-12:00"), span("13:30-17:00"))
    )
    household = Household((Person("p", busy, busy),), (RoomLink("hall", IN_USE, IN_USE),))
    compiled = compile_household(household)
    assert [(d.room_id, d.day_type, d.days) for d in compiled.dropped] == [
        ("hall", "weekdays", (0, 1, 2, 3, 4)),
        ("hall", "weekend", (5, 6)),
    ]
    assert compiled.notes == tuple(d.text for d in compiled.dropped)


# --- room kinds and per-room temperatures ----------------------------------------------


def test_while_home_room_stays_warm_through_working_hours():
    rooms = (link("kitchen", IN_USE, kind=RoomKind.WHILE_HOME, people=("home_worker",)),)
    compiled = compile_household(Household(REFERENCE.people, rooms))
    # Shared would be 08:00 to 08:30 and 18:00 on; while home covers the working day.
    assert days(compiled.live["kitchen"])[0] == "00:00/14 08:00/19 22:30/14"
    assert days(compiled.live["kitchen"])[1] == ("00:00/14 08:30/19 10:00/14 18:00/19 22:30/14")


def test_night_and_unused_temperature_per_room():
    rooms = (
        link("nursery", IN_USE, kind=RoomKind.BEDROOM, people=("early_riser",), night_c=16.0),
        link("lounge", UNUSED, unused_c=12.0),
    )
    compiled = compile_household(Household((EARLY_RISER,), rooms))
    assert weekday(compiled, "nursery", live=True) == (
        "00:00/16 06:30/19 07:00/14 22:00/19 22:30/16"
    )
    assert weekday(compiled, "lounge", live=True) == "00:00/14 06:30/12 22:30/14"


# --- house file ------------------------------------------------------------------------


def house(household: dict) -> dict:
    rooms = [
        {"id": "bedroom", "trv": "trv_a", "sensor": "t_a"},
        {"id": "office", "trv": "trv_b", "sensor": "t_b"},
    ]
    return {"mqtt": {"host": "broker"}, "rooms": rooms, "household": household}


def base(**over) -> dict:
    data = {
        "people": {"a": {"weekdays": {"up": "07:00", "work": "09:00-17:00", "bed": "23:00"}}},
        "rooms": {
            "bedroom": {"use": "in_use", "kind": "bedroom", "people": ["a"]},
            "office": {"use": "in_use", "kind": "office", "people": ["a"]},
        },
    }
    data.update(over)
    return data


def problems(data: dict) -> list[str]:
    with pytest.raises(ConfigError) as exc:
        parse_site(data)
    return exc.value.problems


def test_no_settings_gives_the_defaults():
    hh = parse_site(house(base())).household
    assert hh.timing == Timing() and hh.away == AwaySettings()
    assert hh.weekend_days == frozenset({5, 6})
    assert hh.people[0].getting_up_min is None and hh.rooms[0].preheat_min is None


def test_every_setting_from_the_house_file():
    data = base(
        timing={
            "preheat_min": 45,
            "live_preheat": "fixed",
            "getting_up_min": 20,
            "bedtime_min": 40,
            "merge_gap_min": 15,
        },
        away={
            "presence_delay_min": 30,
            "presence_stale_after_min": 0,
            "return_warmup_min": 240,
            "everyone_away": "unused",
        },
        weekend_days=["fri", "Saturday"],
    )
    data["people"]["a"].update(getting_up_min=60, bedtime_min=10, weekend_days=["mon"])
    data["rooms"]["bedroom"].update(night_temperature=16, unused_temperature=13.5, preheat_min=90)
    site = parse_site(house(data))
    hh = site.household
    assert hh.timing == Timing(45, LivePreheat.FIXED, 20, 40, 15)
    assert hh.away == AwaySettings(30, 0, 240, EveryoneAway.UNUSED)
    assert hh.weekend_days == frozenset({4, 5})
    person = hh.people[0]
    assert (person.getting_up_min, person.bedtime_min, person.weekend_days) == (
        60,
        10,
        frozenset({0}),
    )
    room = hh.rooms[0]
    assert (room.night_c, room.unused_c, room.preheat_min) == (16.0, 13.5, 90)
    # Up 07:00 with an hour to get ready, 10 minutes before bed, 90 minutes of preheat.
    assert site.live_schedule_for("bedroom") == site.schedule_for("bedroom")
    assert site.schedule_for("bedroom").days[2].trvzb() == (
        "00:00/16 05:30/19 08:00/13.5 21:20/19 23:00/16"
    )


def test_settings_validation():
    data = base(
        timing={"preheat_min": 200, "live_preheat": "early", "getting_up_min": 7.5, "naps": 1},
        away={
            "presence_delay_min": -1,
            "presence_stale_after_min": 10,
            "return_warmup_min": 400,
            "everyone_away": "off",
        },
        weekend_days=["sat", "funday"],
    )
    data["people"]["a"].update(getting_up_min=181, weekend_days="sun")
    data["rooms"]["bedroom"].update(night_temperature=2, preheat_min=True)
    data["rooms"]["office"].update(kind="garage")
    text = "\n".join(problems(house(data)))
    for expected in [
        "household.timing.preheat_min: must be whole minutes, 0 to 180",
        "household.timing.live_preheat: must be optimum_start or fixed",
        "household.timing.getting_up_min: must be whole minutes, 0 to 180",
        "household.timing.naps: unknown key",
        "household.away.presence_delay_min: must be whole minutes, 0 to 720",
        "household.away.presence_stale_after_min: must be whole minutes, 20 to 1440, "
        "or 0 to turn it off",
        "household.away.return_warmup_min: must be whole minutes, 0 to 360",
        "household.away.everyone_away: must be frost or unused",
        "household.weekend_days[1]: 'funday' is not a day: use mon to sun",
        "household.people.a.getting_up_min: must be whole minutes, 0 to 180",
        "household.people.a.weekend_days: expected a list of days",
        "household.rooms.bedroom.night_temperature: must be 4 to 35",
        "household.rooms.bedroom.preheat_min: expected a number",
        "household.rooms.office.kind: must be shared, bedroom, office, while_home, all_day",
    ]:
        assert expected in text, expected


def test_weekend_days_can_be_empty_but_not_repeated():
    site = parse_site(house(base(weekend_days=[])))
    assert site.household.weekend_days == frozenset()
    assert site.schedule_for("office").days[6] == site.schedule_for("office").days[0]
    assert "household.weekend_days: a day is listed twice" in problems(
        house(base(weekend_days=["sat", "saturday"]))
    )


def test_damp_note_for_per_room_temperatures():
    data = base()
    data["rooms"]["bedroom"]["unused_temperature"] = 10
    notes = "\n".join(parse_site(house(data)).notes)
    assert "household.rooms.bedroom.unused_temperature is 10°: below 12°" in notes


# --- API view --------------------------------------------------------------------------


def test_household_view_fills_in_defaults_and_ranges():
    view = household_view(REFERENCE)
    assert view["timing"] == {
        "preheat_min": 30,
        "live_preheat": "optimum_start",
        "getting_up_min": 30,
        "bedtime_min": 30,
        "merge_gap_min": 30,
    }
    assert view["away"] == {
        "presence_delay_min": 60,
        "presence_stale_after_min": 60,
        "return_warmup_min": 180,
        "everyone_away": "frost",
        "presence_evidence_max_age_min": 240,
        "presence_weak_source_delay_min": 240,
    }
    assert view["weekend_days"] == ["saturday", "sunday"]
    worker = view["people"][1]
    assert worker["id"] == "home_worker" and worker["getting_up_min"] == 30
    assert worker["weekdays"] == {"up": "08:00", "bed": "22:30", "out": [], "work": ["08:00-18:00"]}
    assert worker["inherited"] == ["getting_up_min", "bedtime_min", "weekend_days"]
    toilet = next(r for r in view["rooms"] if r["id"] == "toilet")
    assert toilet["temperature"] == {"weekdays": 15.0, "weekend": 15.0}
    assert toilet["use"] == {"weekdays": "unused", "weekend": "occasional"}
    assert toilet["night_temperature"] == 14.0 and toilet["preheat_min"] == 30
    assert toilet["inherited"] == ["night_temperature", "unused_temperature", "preheat_min"]
    assert view["limits"]["timing.preheat_min"] == {"min": 0, "max": 180, "unit": "min"}
    assert view["limits"]["away.presence_stale_after_min"]["off"] == 0
    assert view["limits"]["temperatures"]["step"] == 0.5
    assert set(view["limits"]) == set(LIMITS)
    assert "while_home" in view["options"]["rooms.kind"]
    assert view["options"]["timing.live_preheat"] == ["optimum_start", "fixed"]


def test_everyone_away_compiles_unused_everywhere_with_both_people_named():
    compiled = compile_household(REFERENCE, away=frozenset(BOTH))
    assert {days(w) for w in compiled.live.values()} == {("00:00/14", "00:00/14")}
