"""Room use and the savings baseline from the household and hand-written schedules
(spec 5.8, 5.9)."""

from dataclasses import replace
from pathlib import Path

import pytest
import yaml
from test_household import BOTH, REFERENCE, t

from radiate.config import ConfigError, parse_site, parse_week
from radiate.config.household import (
    Adjustment,
    Household,
    Keep,
    UseLevel,
    compile_household,
)
from radiate.config.use import (
    BASELINE_TEXT,
    Baseline,
    BaselineDay,
    compile_baseline,
    room_use,
    schedule_periods,
    schedule_room_use,
)
from radiate.core import RoomUse

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}

MON, WED, SAT = 0, 2, 5
IN_USE, OCCASIONAL, UNUSED = UseLevel.IN_USE, UseLevel.OCCASIONAL, UseLevel.UNUSED


def use(household: Household, room: str, day: int, at: str, away=frozenset()) -> RoomUse | None:
    return room_use(compile_household(household, away=frozenset(away)), room, day, t(at))


# --- from the household ----------------------------------------------------------------


def test_bedroom_in_use_after_getting_up_and_setback_at_midday():
    # The early riser gets up at 06:30: the bedroom is in use for 30 minutes after.
    assert use(REFERENCE, "bedroom_1", WED, "07:00") is RoomUse.IN_USE
    assert use(REFERENCE, "bedroom_1", WED, "12:00") is RoomUse.SETBACK
    # Overnight is outside every warm period.
    assert use(REFERENCE, "bedroom_1", WED, "03:00") is RoomUse.SETBACK


def test_preheating_is_not_room_use():
    # With optimum start the live period starts when the room is needed (06:30), so
    # the valve schedule's 06:00 start is preheating, not use.
    assert use(REFERENCE, "bedroom_1", WED, "06:15") is RoomUse.SETBACK


def test_office_in_use_in_working_hours_on_weekdays_only():
    assert use(REFERENCE, "bedroom_3", WED, "10:00") is RoomUse.IN_USE
    assert use(REFERENCE, "bedroom_3", WED, "19:00") is RoomUse.SETBACK
    assert use(REFERENCE, "bedroom_3", SAT, "10:00") is RoomUse.SETBACK


def test_occasional_day_gives_occasional():
    assert use(REFERENCE, "bathroom", WED, "07:00") is RoomUse.OCCASIONAL
    assert use(REFERENCE, "bathroom", WED, "12:00") is RoomUse.SETBACK
    # The toilet is unused on weekdays and occasional at the weekend.
    assert use(REFERENCE, "toilet", WED, "12:00") is RoomUse.SETBACK
    assert use(REFERENCE, "toilet", SAT, "12:00") is RoomUse.OCCASIONAL


def test_unused_room_is_setback_all_day():
    for at in ("00:00", "07:00", "12:00", "19:00", "23:59"):
        assert use(REFERENCE, "lounge", WED, at) is RoomUse.SETBACK
        assert use(REFERENCE, "lounge", SAT, at) is RoomUse.SETBACK


def test_warm_period_added_on_an_unused_day_is_in_use():
    evening = Adjustment(days=("daily",), keep=Keep.WARM, from_min=t("19:00"), to_min=t("21:00"))
    rooms = tuple(
        replace(r, adjust=(evening,)) if r.room_id == "lounge" else r for r in REFERENCE.rooms
    )
    household = replace(REFERENCE, rooms=rooms)
    compiled = compile_household(household)
    assert compiled.warm_levels["lounge"][WED] is IN_USE
    assert use(household, "lounge", WED, "20:00") is RoomUse.IN_USE
    assert use(household, "lounge", WED, "18:00") is RoomUse.SETBACK


def test_person_away_turns_their_bedroom_setback():
    assert use(REFERENCE, "bedroom_3", WED, "10:00", away={"home_worker"}) is RoomUse.SETBACK
    everyone = set(BOTH)
    assert use(REFERENCE, "dining", WED, "19:00", away=everyone) is RoomUse.SETBACK


def test_room_not_in_the_household_has_no_room_use():
    assert use(REFERENCE, "stairs", WED, "07:00") is None


def test_warm_levels_per_day():
    compiled = compile_household(REFERENCE)
    assert compiled.warm_levels["dining"] == (IN_USE,) * 7
    assert compiled.warm_levels["bathroom"] == (OCCASIONAL,) * 7
    assert compiled.warm_levels["toilet"] == (UNUSED,) * 5 + (OCCASIONAL,) * 2


# --- savings baseline ------------------------------------------------------------------


def test_baseline_timer_runs_from_first_up_less_preheat_to_last_bed():
    base = compile_baseline(REFERENCE)
    assert isinstance(base, Baseline)
    # Weekdays: the early riser is up at 06:30, less the 30 minute preheat; last bed 22:30.
    assert base.rooms["dining"][WED] == BaselineDay(t("06:00"), t("22:30"), 19.0)
    # Weekend: both up at 08:30.
    assert base.rooms["dining"][SAT] == BaselineDay(t("08:00"), t("22:30"), 19.0)
    assert base.setpoint_at("dining", WED, t("05:59")) is None
    assert base.setpoint_at("dining", WED, t("06:00")) == 19.0
    assert base.setpoint_at("dining", WED, t("22:29")) == 19.0
    assert base.setpoint_at("dining", WED, t("22:30")) is None


def test_baseline_uses_each_levels_temperature_and_a_rooms_own():
    base = compile_baseline(REFERENCE)
    assert base.setpoint_at("bathroom", WED, t("12:00")) == 16.0  # occasional
    assert base.setpoint_at("lounge", WED, t("12:00")) == 14.0  # unused
    # The toilet has its own 15° for its warm level; unused on weekdays.
    assert base.setpoint_at("toilet", WED, t("12:00")) == 14.0
    assert base.setpoint_at("toilet", SAT, t("12:00")) == 15.0
    # Not in the household.
    assert base.setpoint_at("stairs", WED, t("12:00")) is None


def test_baseline_ignores_adjustments():
    cold = Adjustment(days=("daily",), keep=Keep.COLD, from_min=t("06:00"), to_min=t("23:00"))
    rooms = tuple(replace(r, adjust=(cold,)) for r in REFERENCE.rooms)
    assert compile_baseline(replace(REFERENCE, rooms=rooms)) == compile_baseline(REFERENCE)


def test_baseline_text_is_one_sentence():
    assert BASELINE_TEXT.startswith("Compared with a heating timer")
    assert BASELINE_TEXT.count(".") == 1


# --- hand-written schedules ------------------------------------------------------------

OFFICE = parse_week({"weekdays": "00:00/15 08:00/20 17:30/15", "weekend": "00:00/15"})
BEDROOM = parse_week({"daily": "00:00/14 06:30/19 08:00/16 21:30/19 23:00/14"})


def test_schedule_periods_are_spans_above_the_days_lowest_setpoint():
    assert schedule_periods(OFFICE.days[WED]) == ((t("08:00"), t("17:30")),)
    assert schedule_periods(OFFICE.days[SAT]) == ()
    # 16° by day is above the 14° overnight, so the whole day is one period.
    assert schedule_periods(BEDROOM.days[WED]) == ((t("06:30"), t("23:00")),)
    # Carried over midnight.
    late = parse_week({"daily": "00:00/19 01:00/14 18:00/19"})
    assert schedule_periods(late.days[WED]) == ((0, t("01:00")), (t("18:00"), 1440))


def test_schedule_room_use_follows_the_level_inside_periods():
    levels = (IN_USE, IN_USE)
    assert schedule_room_use(OFFICE, levels, WED, t("10:00")) is RoomUse.IN_USE
    assert schedule_room_use(OFFICE, levels, WED, t("07:59")) is RoomUse.SETBACK
    assert schedule_room_use(OFFICE, levels, SAT, t("10:00")) is RoomUse.SETBACK
    occasional = (OCCASIONAL, OCCASIONAL)
    assert schedule_room_use(OFFICE, occasional, WED, t("10:00")) is RoomUse.OCCASIONAL


def test_schedule_room_use_unused_is_setback_all_day():
    for at in ("03:00", "10:00", "19:00"):
        assert schedule_room_use(OFFICE, (UNUSED, UNUSED), WED, t(at)) is RoomUse.SETBACK


def test_schedule_room_use_weekend_level_on_saturday_and_sunday():
    week = parse_week({"daily": "00:00/14 18:00/20"})
    levels = (UNUSED, IN_USE)
    assert schedule_room_use(week, levels, WED, t("19:00")) is RoomUse.SETBACK
    assert schedule_room_use(week, levels, SAT, t("19:00")) is RoomUse.IN_USE
    assert schedule_room_use(week, levels, 6, t("19:00")) is RoomUse.IN_USE
    assert schedule_room_use(week, levels, MON, t("19:00")) is RoomUse.SETBACK


# --- the house file's `use` key on a hand-written room ---------------------------------


def example() -> dict:
    return yaml.safe_load(EXAMPLE.read_text())


def room(data: dict, room_id: str) -> dict:
    return next(r for r in data["rooms"] if r["id"] == room_id)


def test_no_use_key_gives_no_use_levels():
    site = parse_site(example(), env=ENV)
    assert site.schedule_use == {}


def test_use_key_on_a_hand_written_room():
    data = example()
    room(data, "dining")["use"] = "in_use"
    room(data, "lounge")["use"] = "unused"
    room(data, "bathroom")["use"] = {"weekdays": "occasional", "weekend": "in_use"}
    site = parse_site(data, env=ENV)
    assert site.schedule_use == {
        "dining": (IN_USE, IN_USE),
        "lounge": (UNUSED, UNUSED),
        "bathroom": (OCCASIONAL, IN_USE),
    }


@pytest.mark.parametrize(
    ("room_id", "value", "message"),
    [
        ("dining", "sometimes", "rooms[4].use: must be in_use, occasional or unused"),
        ("dining", {"weekdays": "in_use"}, "rooms[4].use.weekend: required"),
        ("stairs", "unused", "rooms[8].use: a passive room has no valve"),
    ],
)
def test_use_key_problems(room_id, value, message):
    data = example()
    room(data, room_id)["use"] = value
    with pytest.raises(ConfigError) as err:
        parse_site(data, env=ENV)
    assert any(p.startswith(message) for p in err.value.problems), err.value.problems


def test_use_key_on_a_household_room_is_an_error():
    data = yaml.safe_load((EXAMPLE.parent / "household.yaml").read_text())
    room(data, "dining")["use"] = "in_use"
    with pytest.raises(ConfigError) as err:
        parse_site(data, env=ENV)
    assert any(
        p.startswith("rooms[4].use: the household section sets this room's use")
        for p in err.value.problems
    ), err.value.problems
