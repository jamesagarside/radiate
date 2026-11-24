"""Room use in `eco` on the simulated reference house (efficiency plan, slice 6).

Seven days, seeds 1 to 3. The full comparison is `radiate sim-efficiency` (see
docs/simulation.md). The savings estimator check is deferred
(`radiate.sim.compare.estimator_check`).
"""

import pytest

from radiate.config.household import UseLevel
from radiate.core import DAMP_FLOOR_C, RoomUse
from radiate.sim.compare import (
    DEFICIT_TOLERANCE,
    FLOOR_SLACK_K,
    SCENARIOS,
    compare,
    report,
)
from radiate.sim.reference import OWNER_USE, owner_weeks
from radiate.sim.runner import household_plan, owner_plan, run

SEEDS = (1, 2, 3)
DAYS, WARMUP = 7, 2
FROST_C = 7.0


@pytest.fixture(scope="module")
def results():
    out = compare(["fixed", "mild"], SEEDS, DAYS, WARMUP, policies=("eco", "eco+use"), workers=1)
    return {r.scenario.name: r for r in out}


def mean(values) -> float:
    values = list(values)
    return sum(values) / len(values)


def test_guards_hold_with_room_use(results):
    for r in results["mild"].runs["eco+use"]:
        assert r.guard_violations == 0
        assert r.max_starts_in_hour <= 3
        assert r.relay_on_s > 0
        assert r.no_open_valve_s <= 0.01 * r.relay_on_s


def test_no_room_far_below_the_damp_floor_or_near_frost(results):
    for r in results["mild"].runs["eco+use"]:
        t, sp, _ = r.min_room
        assert t >= min(sp, DAMP_FLOOR_C) - FLOOR_SLACK_K
        assert t > FROST_C


def test_room_use_burns_no_more_oil_than_eco(results):
    mild = results["mild"].runs
    assert mean(r.relay_litres for r in mild["eco+use"]) <= mean(
        r.relay_litres for r in mild["eco"]
    )
    assert mean(r.oil_litres for r in mild["eco+use"]) <= mean(r.oil_litres for r in mild["eco"])


def test_comfort_in_warm_periods_holds(results):
    mild = results["mild"].runs
    eco = mean(r.warm_deficit_kmin for r in mild["eco"])
    use = mean(r.warm_deficit_kmin for r in mild["eco+use"])
    assert use <= eco * (1 + DEFICIT_TOLERANCE) + 30


def test_fixed_schedule_has_no_room_use_so_eco_is_unchanged(results):
    fixed = results["fixed"].runs
    for a, b in zip(fixed["eco"], fixed["eco+use"], strict=True):
        assert a.relay_starts == b.relay_starts
        assert a.burner_starts == b.burner_starts
        assert a.burner_hours == b.burner_hours
        assert a.warm_deficit_kmin == b.warm_deficit_kmin
        assert a.min_room == b.min_room


def test_report_has_a_table_and_the_checks(results):
    text = report(list(results.values()), DAYS, WARMUP)
    assert "| Metric | eco | eco+use |" in text
    assert "eco and eco+use identical (no room use)" in text
    assert "Estimator check" in text


def test_household_plan_room_use_and_baseline():
    plan = household_plan()
    # Monday: the office is in use in working hours, the lounge is unused all day.
    assert plan.use_at("bedroom_3", 0, 10 * 60) is RoomUse.IN_USE
    assert plan.use_at("bedroom_3", 5, 10 * 60) is RoomUse.SETBACK  # Saturday
    assert plan.use_at("lounge", 0, 19 * 60) is RoomUse.SETBACK
    assert plan.household
    assert plan.baseline_at("lounge", 0, 3 * 60) is None  # timer off overnight
    assert plan.baseline_at("dining", 0, 19 * 60) == 18.0


def test_owner_plan_follows_the_use_levels():
    plan = owner_plan()
    weeks = owner_weeks()
    assert set(weeks) == set(OWNER_USE)
    assert plan.use_at("bedroom_1", 0, 7 * 60) is RoomUse.IN_USE
    assert plan.use_at("bedroom_1", 0, 12 * 60) is RoomUse.SETBACK
    assert plan.use_at("bedroom_3", 2, 10 * 60) is RoomUse.IN_USE
    assert plan.use_at("bedroom_3", 6, 10 * 60) is RoomUse.SETBACK  # unused at weekends
    assert plan.use_at("lounge", 0, 19 * 60) is RoomUse.SETBACK  # flat day, unused
    assert OWNER_USE["lounge"] == (UseLevel.UNUSED, UseLevel.UNUSED)
    # Radiate's baseline for hand-written rooms: the timer from the earliest warm period
    # in the house (06:00) to the latest end (22:30), each room at its usual setpoint.
    assert plan.household
    assert plan.baseline_at("bedroom_1", 0, 5 * 60 + 59) is None
    assert plan.baseline_at("bedroom_1", 0, 6 * 60) == 18.0
    assert plan.baseline_at("lounge", 0, 12 * 60) == 14.0
    assert plan.baseline_at("lounge", 0, 22 * 60 + 30) is None


def test_timer_runs_the_relay_for_the_window_only():
    r = run("timer", 2, 1, 1, schedule="household", outdoor_by_day=[4.0, 4.0])
    window_h = 22.5 - 6.0  # first up 06:30 less 30 minutes to last in bed 22:30
    assert r.relay_on_s / 3600 == pytest.approx(window_h, abs=0.1)
    assert r.relay_starts == 1
    assert r.guard_violations == 0


def test_scenarios_are_known():
    assert {"fixed", "mild", "cold", "owner", "owner_cold"} <= set(SCENARIOS)
    with pytest.raises(ValueError):
        compare(["nowhere"], SEEDS, DAYS, WARMUP, workers=1)
