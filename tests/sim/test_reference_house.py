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


def test_daily_accounting_matches_the_relay(runs):
    for _, radiate in runs.values():
        days = radiate.day_summaries
        assert [d["day"] for d in days] == [0, 1, 2, 3]
        for d in days:
            assert 0 < d["burner_hours"] < 24
            assert d["max_starts_in_hour"] <= 3
            assert d["burns"]["count"] in (d["starts"] - 1, d["starts"], d["starts"] + 1)
            assert d["balance"]["score"] is None or 0 <= d["balance"]["score"] <= 100
        # Measured days 2 to 4 (day 4 is still open): relay hours agree with the
        # simulator's own count, which only differs by burns crossing the edges.
        today = radiate.engine.ledger.summary(None)
        assert today["day"] == 4
        measured = sum(d["burner_hours"] for d in days[2:]) + today["burner_hours"]
        relay_h = sum(radiate.relay_burns_s) / 3600
        assert abs(measured - relay_h) < 0.1 * relay_h + 1.0


def test_no_false_failure_alerts(runs):
    for _, radiate in runs.values():
        assert radiate.alert_minutes == {}, radiate.alert_minutes


def test_out_of_oil_is_detected_and_the_boiler_keeps_calling():
    out_at = 2.5 * 86400  # tank runs dry at midday on day 2
    r = run("radiate", 4, 2, 1, oil_out_at_s=out_at)
    assert "boiler.no_heat" not in {k for k, t in r.first_alert_s.items() if t < out_at}
    detected = r.first_alert_s["boiler.no_heat"]
    assert detected - out_at < 3 * 3600
    assert r.last_actions.heating_relay  # still calling in case the boiler recovers
    assert all(rs.learning_gate == "no_heat" for rs in r.engine.rooms.values())


def test_seized_valve_is_flagged():
    r = run("radiate", 5, 2, 1, seized_valves=frozenset({"bedroom_2"}))
    assert r.engine.rooms["bedroom_2"].valve.untrusted
    assert [rid for rid, rs in r.engine.rooms.items() if rs.valve.untrusted] == ["bedroom_2"]
    assert "valve.stuck" in r.alert_minutes
    assert "boiler.no_heat" not in r.first_alert_s


def test_crash_falls_back_safely(runs):
    # Radiate dies at midday on day 2 (setback). TRVs follow their mirrored on-device
    # schedules and the Shelly watchdog runs the boiler: no worse than smart TRVs.
    baseline, _ = runs[1]
    r = run("radiate", 5, 2, 1, crash_at_s=2.5 * 86400)
    assert r.comfort_deficit_kh <= 1.1 * baseline.comfort_deficit_kh
    assert r.min_burn_violations == 0
