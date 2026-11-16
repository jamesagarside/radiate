"""Closed-loop tests on the simulated reference house (spec 11)."""

import dataclasses

import pytest

from radiate.sim.reference import house_config
from radiate.sim.runner import Disturbances, run

SEEDS = (1, 2, 3)


@pytest.fixture(scope="module")
def runs():
    return {seed: (run("baseline", 5, 2, seed), run("radiate", 5, 2, seed)) for seed in SEEDS}


def test_guards_never_violated(runs):
    for _, radiate in runs.values():
        assert radiate.min_burn_violations == 0
        assert radiate.min_off_violations == 0
        assert radiate.max_starts_in_hour <= 3


def test_baseline_short_cycles_without_guards(runs):
    # The comparison is only meaningful if the baseline really does short-cycle.
    assert sum(b.min_burn_violations for b, _ in runs.values()) > 0


def test_fewer_longer_burns(runs):
    for baseline, radiate in runs.values():
        assert radiate.relay_starts < baseline.relay_starts / 2
        assert sum(radiate.relay_burns_s) / len(radiate.relay_burns_s) >= 3 * (
            sum(baseline.relay_burns_s) / len(baseline.relay_burns_s)
        )


def test_comfort_better_than_smart_trvs(runs):
    for baseline, radiate in runs.values():
        assert radiate.comfort_deficit_kh < 0.5 * baseline.comfort_deficit_kh
        assert radiate.overheat_kh <= baseline.overheat_kh + 1.0


def test_fire_does_not_corrupt_lounge_learning():
    no_fire = run("radiate", 5, 0, 1, disturbances=Disturbances(fire_days=frozenset()))
    fire = run("radiate", 5, 0, 1, disturbances=Disturbances(fire_days=frozenset({0, 1, 2, 3, 4})))
    a0, b0 = no_fire.engine.rooms["lounge"].est.a, no_fire.engine.rooms["lounge"].est.b
    a1, b1 = fire.engine.rooms["lounge"].est.a, fire.engine.rooms["lounge"].est.b
    assert abs(a1 - a0) / a0 < 0.35
    assert abs(b1 - b0) < 0.03
    assert fire.fire_flagged_minutes > 0


def test_no_fire_means_few_false_fire_flags():
    r = run("radiate", 5, 2, 1, disturbances=Disturbances(fire_days=frozenset()))
    assert r.fire_flagged_minutes < 120  # under 2 h over 3 measured days


def test_balancing_cuts_arrival_spread_when_everyone_calls_at_once():
    cfg = house_config()
    off = dataclasses.replace(cfg, balancing=False)
    spread_on = spread_off = 0.0
    for seed in SEEDS:
        kw = dict(seed=seed, outdoor_mean=-2.0, pump_qmax=0.15, optimum_start=False)
        spread_on += run("radiate", 5, 2, cfg=cfg, **kw).median_spread
        spread_off += run("radiate", 5, 2, cfg=off, **kw).median_spread
    assert spread_on < 0.9 * spread_off


def test_crash_falls_back_safely(runs):
    # Radiate dies at midday on day 2 (setback). TRVs follow their mirrored on-device
    # schedules and the Shelly watchdog runs the boiler: no worse than smart TRVs.
    baseline, _ = runs[1]
    r = run("radiate", 5, 2, 1, crash_at_s=2.5 * 86400)
    assert r.comfort_deficit_kh <= 1.1 * baseline.comfort_deficit_kh
    assert r.min_burn_violations == 0
