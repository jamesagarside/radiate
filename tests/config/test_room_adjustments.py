"""Room adjustments: keep a room warm or cold from one time to another, on some days.

They apply after the routine rules and before the valve's week is fitted to the TRVZB,
to the live week (what the week view shows) and, with the fixed preheat, the valve week.
"""

from dataclasses import replace

import pytest
from test_household import BOTH, EXPECTED, REFERENCE, days, t
from test_household import house as house_data
from test_household import household as household_data

from radiate.config import ConfigError, parse_site
from radiate.config.household import (
    LIMITS,
    Adjustment,
    Household,
    Keep,
    LivePreheat,
    Timing,
    compile_household,
    household_section,
    household_view,
    options_view,
    without_adjustments,
)
from radiate.config.site import parse_household

WARM, COLD = Keep.WARM, Keep.COLD


def adj(days: str | tuple[str, ...], keep: Keep, span: str) -> Adjustment:
    a, b = span.split("-")
    return Adjustment(days=(days,) if isinstance(days, str) else days, keep=keep,
                      from_min=t(a), to_min=t(b))  # fmt: skip


def adjusted(household: Household = REFERENCE, **rooms: tuple[Adjustment, ...]) -> Household:
    return replace(
        household,
        rooms=tuple(replace(r, adjust=rooms.get(r.room_id, r.adjust)) for r in household.rooms),
    )


def live(compiled, room_id: str) -> tuple[str, str]:
    return days(compiled.live[room_id])


def valve(compiled, room_id: str) -> tuple[str, str]:
    return days(compiled.schedules[room_id])


# The kitchen's live week without adjustments: warm by 06:30 and 18:00.
KITCHEN_LIVE = (
    "00:00/14 06:30/19 08:30/14 18:00/19 22:30/14",
    "00:00/14 08:30/19 10:00/14 18:00/19 22:30/14",
)


# --- compiling -------------------------------------------------------------------------


def test_without_adjustments_nothing_changes():
    compiled = compile_household(REFERENCE)
    assert {rid: valve(compiled, rid) for rid in compiled.schedules} == EXPECTED
    assert live(compiled, "kitchen") == KITCHEN_LIVE
    assert compiled.periods["kitchen"][0] == ((t("06:30"), t("08:30")), (t("18:00"), t("22:30")))
    assert all(day == () for day in compiled.adjusted["kitchen"])
    assert without_adjustments(adjusted(kitchen=(adj("daily", WARM, "23:00-23:30"),))) == REFERENCE


def test_keep_warm_moves_an_end_later_in_both_weeks():
    compiled = compile_household(adjusted(kitchen=(adj("weekdays", WARM, "22:30-23:00"),)))
    assert live(compiled, "kitchen") == (
        "00:00/14 06:30/19 08:30/14 18:00/19 23:00/14",
        KITCHEN_LIVE[1],
    )
    assert valve(compiled, "kitchen") == (
        "00:00/14 06:00/19 08:30/14 17:30/19 23:00/14",
        EXPECTED["kitchen"][1],
    )
    assert compiled.adjusted["kitchen"][0] == ((t("22:30"), t("23:00"), WARM),)
    assert compiled.adjusted["kitchen"][5] == ()
    assert compiled.periods["kitchen"][0][1] == (t("18:00"), t("23:00"))
    # Other rooms are untouched.
    assert valve(compiled, "dining") == EXPECTED["dining"]


def test_keep_cold_starts_later_and_the_valve_still_preheats():
    compiled = compile_household(adjusted(kitchen=(adj("weekdays", COLD, "18:00-19:00"),)))
    assert live(compiled, "kitchen")[0] == "00:00/14 06:30/19 08:30/14 19:00/19 22:30/14"
    assert valve(compiled, "kitchen")[0] == "00:00/14 06:00/19 08:30/14 18:30/19 22:30/14"
    assert compiled.adjusted["kitchen"][0] == ((t("18:00"), t("19:00"), COLD),)


def test_a_short_cold_window_is_kept_in_the_live_week_and_preheated_over_in_the_valve():
    compiled = compile_household(adjusted(kitchen=(adj("weekdays", COLD, "20:00-20:15"),)))
    assert live(compiled, "kitchen")[0] == (
        "00:00/14 06:30/19 08:30/14 18:00/19 20:00/14 20:15/19 22:30/14"
    )
    # The valve has to start warming at 19:45 to be warm by 20:15, so it never cools.
    assert valve(compiled, "kitchen")[0] == EXPECTED["kitchen"][0]


def test_a_later_adjustment_wins_where_two_overlap():
    first = (adj("weekdays", WARM, "22:30-23:30"), adj("mon", COLD, "23:00-23:30"))
    compiled = compile_household(adjusted(kitchen=first))
    assert (
        compiled.live["kitchen"].days[0].trvzb() == "00:00/14 06:30/19 08:30/14 18:00/19 23:00/14"
    )
    assert (
        compiled.live["kitchen"].days[1].trvzb() == "00:00/14 06:30/19 08:30/14 18:00/19 23:30/14"
    )
    swapped = compile_household(adjusted(kitchen=first[::-1]))
    assert swapped.live["kitchen"].days[0].trvzb().endswith("18:00/19 23:30/14")


def test_keep_warm_in_an_unused_room_uses_the_in_use_temperature_or_its_own():
    compiled = compile_household(
        adjusted(
            lounge=(adj("daily", WARM, "19:00-22:00"),),
            toilet=(adj("weekdays", WARM, "07:00-07:30"),),
        )
    )
    assert live(compiled, "lounge") == ("00:00/14 19:00/19 22:00/14",) * 2
    assert valve(compiled, "lounge") == ("00:00/14 18:30/19 22:00/14",) * 2
    # The toilet sets its own 15°; at weekends it is occasional and already warm then.
    assert live(compiled, "toilet")[0] == "00:00/14 07:00/15 07:30/14"


def test_days_follow_the_households_weekend():
    friday = compile_household(adjusted(kitchen=(adj("fri", WARM, "22:30-23:00"),)))
    week = friday.live["kitchen"].days
    assert [d.trvzb().endswith("23:00/14") for d in week] == [False] * 4 + [True, False, False]
    sat_sun_work = replace(REFERENCE, weekend_days=frozenset({4, 5}))  # Friday and Saturday
    weekend = compile_household(
        adjusted(sat_sun_work, kitchen=(adj("weekend", WARM, "23:00-23:30"),))
    )
    ends = [d.trvzb().endswith("23:30/14") for d in weekend.live["kitchen"].days]
    assert ends == [False, False, False, False, True, True, False]


def test_adjustments_pause_while_everyone_who_uses_the_room_is_away():
    office = (adj("weekdays", WARM, "18:00-20:00"),)
    kitchen = (adj("weekdays", WARM, "22:30-23:00"),)
    hh = adjusted(bedroom_3=office, kitchen=kitchen)
    one_away = compile_household(hh, away=frozenset({"home_worker"}))
    # The office's only person is away: it drops to its unused level, adjustments too.
    assert valve(one_away, "bedroom_3") == ("00:00/14", "00:00/14")
    assert all(day == () for day in one_away.adjusted["bedroom_3"])
    # The kitchen's other person is home, so its adjustment still applies.
    assert live(one_away, "kitchen")[0].endswith("18:00/19 23:00/14")
    everyone = compile_household(hh, away=frozenset(BOTH))
    assert {valve(everyone, rid) for rid in ("bedroom_3", "kitchen")} == {("00:00/14", "00:00/14")}


def test_periods_added_by_adjustments_can_be_left_out_of_the_valve_with_a_note():
    extra = (adj("weekdays", WARM, "12:00-13:00"), adj("weekdays", WARM, "14:00-15:00"))
    compiled = compile_household(adjusted(kitchen=extra))
    # The live week keeps every warm period.
    assert live(compiled, "kitchen")[0] == (
        "00:00/14 06:30/19 08:30/14 12:00/19 13:00/14 14:00/19 15:00/14 18:00/19 22:30/14"
    )
    # The valve's has room for two, so the shortest go, later first, with a note each.
    assert valve(compiled, "kitchen")[0] == EXPECTED["kitchen"][0]
    assert [(d.start_min, d.end_min) for d in compiled.dropped] == [
        (t("11:30"), t("13:00")),
        (t("13:30"), t("15:00")),
    ]
    assert compiled.notes[0].startswith("kitchen, weekdays: the valve's own schedule leaves out")


def test_with_a_fixed_preheat_the_times_are_when_heating_starts():
    fixed = replace(REFERENCE, timing=Timing(live_preheat=LivePreheat.FIXED))
    compiled = compile_household(adjusted(fixed, kitchen=(adj("weekdays", COLD, "17:30-18:00"),)))
    assert live(compiled, "kitchen")[0] == "00:00/14 06:00/19 08:30/14 18:00/19 22:30/14"
    assert valve(compiled, "kitchen") == live(compiled, "kitchen")


def test_describe():
    assert adj("weekdays", WARM, "22:30-23:00").describe() == "Kept warm 22:30 to 23:00 on weekdays"
    assert adj("weekend", COLD, "13:00-17:00").describe() == "Kept cold 13:00 to 17:00 at weekends"
    assert adj("daily", WARM, "21:00-24:00").describe() == "Kept warm 21:00 to 24:00 every day"
    assert adj(("mon", "wed"), WARM, "07:00-08:00").describe() == (
        "Kept warm 07:00 to 08:00 on Mondays and Wednesdays"
    )


# --- the house file --------------------------------------------------------------------


def with_adjust(adjust) -> dict:
    data = house_data(household_data())
    data["household"]["rooms"]["office"]["people"] = ["a"]
    data["household"]["rooms"]["bedroom"]["adjust"] = adjust
    return data


def problems(data: dict) -> list[str]:
    with pytest.raises(ConfigError) as exc:
        parse_site(data)
    return exc.value.problems


def test_adjustments_in_the_house_file_survive_the_round_trip():
    raw = [
        {"days": "weekdays", "keep": "warm", "from": "22:30", "to": "23:00"},
        {"days": ["Saturday", "sun"], "keep": "cold", "from": "09:00", "to": "09:30"},
        {"days": "daily", "keep": "warm", "from": "23:00", "to": "24:00"},
    ]
    site = parse_site(with_adjust(raw))
    bedroom = next(r for r in site.household.rooms if r.room_id == "bedroom")
    assert bedroom.adjust == (
        adj("weekdays", WARM, "22:30-23:00"),
        adj(("sat", "sun"), COLD, "09:00-09:30"),
        adj("daily", WARM, "23:00-24:00"),
    )
    section = household_section(site.household)
    assert section["rooms"]["bedroom"]["adjust"] == [
        {"days": "weekdays", "keep": "warm", "from": "22:30", "to": "23:00"},
        {"days": ["sat", "sun"], "keep": "cold", "from": "09:00", "to": "09:30"},
        {"days": "daily", "keep": "warm", "from": "23:00", "to": "24:00"},
    ]
    assert "adjust" not in section["rooms"]["office"]
    assert parse_household(section, site) == site.household
    view = household_view(site.household)
    assert view["rooms"][0]["adjust"][0] == raw[0]
    assert view["limits"]["rooms.adjust"] == {"min": 0, "max": 10, "unit": "adjustments"}
    assert options_view()["rooms.adjust.keep"] == ["warm", "cold"]
    # The weeks the site uses carry them.
    assert (
        site.live_schedule_for("bedroom").days[0].trvzb() == "00:00/14 07:00/19 07:30/14 22:30/19"
    )


def test_adjustment_problems_have_paths():
    raw = [
        {"days": "weekdayz", "keep": "hot", "from": "25:00", "to": 2300},
        {"days": "mon", "keep": "warm", "from": "22:00", "to": "21:00"},
        {"keep": "cold", "from": "09:00", "to": "10:00", "why": "x"},
        {"days": ["mon", "monday"], "keep": "warm", "from": "09:00", "to": "10:00"},
        {"days": ["mon", "fortnight"], "keep": "warm", "from": "09:00"},
        "warm all day",
    ]
    found = problems(with_adjust(raw))
    p = "household.rooms.bedroom.adjust"
    for expected in [
        f"{p}[0].days: 'weekdayz' is not a day: use weekdays, weekend, daily or a day, mon to sun",
        f"{p}[0].keep: must be warm or cold",
        f"{p}[0].from: '25:00' is not a time as HH:MM",
        f'{p}[0].to: put the time in quotes, for example "22:30"',
        f"{p}[1].to: must be after from, on the same day",
        f"{p}[2].days: required: use weekdays, weekend, daily or a day, mon to sun",
        f"{p}[2].why: unknown key",
        f"{p}[3].days: a day is listed twice",
        f"{p}[4].days[1]: 'fortnight' is not a day: use weekdays, weekend, daily or a day, mon to sun",
        f"{p}[4].to: required",
        f"{p}[5]: expected a mapping with days, keep, from and to",
    ]:
        assert expected in found, expected
    assert problems(with_adjust("warm")) == [
        f"{p}: expected a list of adjustments, each with days, keep, from and to"
    ]
    too_many = [{"days": "mon", "keep": "warm", "from": "09:00", "to": "10:00"}] * 11
    assert problems(with_adjust(too_many)) == [f"{p}: at most 10 adjustments a room"]
    assert LIMITS["rooms.adjust"].hi == 10
