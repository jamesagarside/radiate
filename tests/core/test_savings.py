"""Savings core (spec 5.9): degree-hours, lift, comfort, the house signature, the gate.

Property-style tests use seeded `random.Random` loops, so every run is the same.
"""

from __future__ import annotations

import math
import random
from datetime import date

import pytest

from radiate.core import EngineState, HouseConfig, RoomConfig, RoomInput, Snapshot, decide
from radiate.core.savings import (
    BASELINE_TEXT,
    DAY_S,
    MAX_TICK_S,
    RoomDay,
    RoomSample,
    SavingsMeter,
    SavingsParams,
    Signature,
    fit_signature,
    report,
    room_weights,
    why_not_eligible,
)

A, B = 2.0, 0.1  # heating gain K/h, loss rate 1/h


def sample(t=18.0, setpoint=18.0, use="in_use", baseline=18.0, drive=0.0, a=A, b=B):
    return RoomSample(
        temperature_c=t,
        setpoint_c=setpoint,
        use=use,
        baseline_c=baseline,
        drive=drive,
        a_kph=a,
        b_per_h=b,
    )


def run(meter: SavingsMeter, hours: float, rooms, outdoor=5.0, baseline=True, step_s=60.0):
    for _ in range(round(hours * 3600 / step_s)):
        meter.update(step_s, outdoor_c=outdoor, baseline=baseline, rooms=rooms)


# --- accumulation ------------------------------------------------------------------------


def test_room_at_baseline_setpoint_saves_nothing():
    m = SavingsMeter()
    run(m, 10, {"bed": sample(t=18.0, setpoint=18.0, baseline=18.0)})
    run(m, 14, {"bed": sample(t=15.0, setpoint=15.0, baseline=None, use="setback")})
    r = m.rooms["bed"]
    assert r.dh_actual_kh == pytest.approx(r.dh_baseline_kh)
    assert r.dh_actual_kh == pytest.approx(13 * 10 + 10 * 14)


def test_room_held_2k_below_baseline_for_10h_saves_20_kh():
    m = SavingsMeter()
    run(m, 10, {"bed": sample(t=16.0, setpoint=16.0, baseline=18.0)})
    r = m.rooms["bed"]
    assert r.dh_baseline_kh - r.dh_actual_kh == pytest.approx(20.0)


def test_free_heat_above_baseline_counts_on_both_sides():
    m = SavingsMeter()
    # A fire: the room is above its baseline setpoint with the radiator off.
    run(m, 4, {"lounge": sample(t=23.0, setpoint=18.0, baseline=18.0, drive=0.0)})
    r = m.rooms["lounge"]
    assert r.dh_actual_kh == pytest.approx(r.dh_baseline_kh)
    assert m.lift_k["lounge"] == 0.0


def test_heating_while_timer_off_builds_lift_and_a_negative_saving():
    m = SavingsMeter()
    run(m, 3, {"bed": sample(t=18.0, setpoint=18.0, baseline=None, use="setback", drive=1.0)})
    r = m.rooms["bed"]
    lift = m.lift_k["bed"]
    expected = A / B * (1 - math.exp(-B * 3))  # rises towards a / b
    assert lift == pytest.approx(expected, rel=1e-6)
    assert r.dh_baseline_kh < r.dh_actual_kh


def test_setpoint_above_baseline_builds_lift_while_timer_on():
    m = SavingsMeter()
    run(m, 2, {"bed": sample(t=20.0, setpoint=20.0, baseline=18.0, drive=1.0)})
    assert m.lift_k["bed"] > 0
    # B = max(T - lift, baseline): never below the baseline setpoint while the timer is on.
    r = m.rooms["bed"]
    assert r.dh_baseline_kh >= 13.0 * 2 - 1e-9


def test_lift_decays_at_the_loss_rate():
    m = SavingsMeter()
    m.lift_k["bed"] = 4.0
    run(m, 5, {"bed": sample(t=18.0, setpoint=18.0, baseline=18.0, drive=1.0)})
    assert m.lift_k["bed"] == pytest.approx(4.0 * math.exp(-B * 5), rel=1e-6)


def test_no_outdoor_reading_accumulates_nothing_and_lowers_the_share():
    m = SavingsMeter()
    run(m, 12, {"bed": sample(t=16.0, baseline=18.0)}, outdoor=None)
    run(m, 12, {"bed": sample(t=16.0, baseline=18.0)}, outdoor=5.0)
    r = m.rooms["bed"]
    assert r.dh_actual_kh == pytest.approx(11 * 12)
    rec = m.close()
    assert rec["outdoor_share"] == pytest.approx(0.5)
    assert rec["outdoor_mean_c"] == pytest.approx(5.0)


def test_no_household_accumulates_no_degree_hours():
    m = SavingsMeter()
    run(m, 24, {"bed": sample(t=16.0, baseline=None)}, baseline=False)
    rec = m.close()
    assert rec["baseline_share"] == 0.0
    assert rec["rooms"]["bed"]["dh_actual_kh"] == 0.0


def test_missing_room_reading_is_not_counted_as_cold():
    m = SavingsMeter()
    run(m, 6, {"bed": sample(t=None, baseline=18.0)})
    r = m.rooms["bed"]
    assert r.dh_actual_kh == 0.0 and r.dh_baseline_kh == 0.0 and r.deficit_kh == 0.0
    assert r.read_s == 0.0


def test_comfort_counts_only_in_use_and_occasional_minutes():
    m = SavingsMeter()
    run(m, 2, {"bed": sample(t=17.0, setpoint=18.0, use="in_use")})  # 0.5 K short
    run(m, 1, {"bed": sample(t=17.7, setpoint=18.0, use="occasional")})  # warm enough
    run(m, 5, {"bed": sample(t=10.0, setpoint=14.0, use="setback", baseline=None)})
    run(m, 5, {"bed": sample(t=10.0, setpoint=14.0, use=None)})
    r = m.rooms["bed"]
    assert r.warm_min == pytest.approx(180)
    assert r.warm_ok_min == pytest.approx(60)
    assert r.deficit_kh == pytest.approx(0.5 * 2)


def test_room_without_room_use_has_no_baseline_and_no_savings():
    """A room with no room use (no use key, not a household room) has no baseline at
    all, which is not the same as its baseline timer being off: it must not count."""
    m = SavingsMeter()
    run(m, 5, {"bed": sample(t=16.0, baseline=18.0), "loo": sample(use=None, drive=1.0)})
    assert "loo" not in m.rooms and "loo" not in m.lift_k
    assert set(m.close()["rooms"]) == {"bed"}


def test_report_weights_only_rooms_with_savings():
    """Weights for a room the days don't measure are dropped and the rest renormalised,
    so a room without a baseline doesn't make every day ineligible."""
    days = month(20)
    body = report(days, {**WEIGHTS, "loo": 0.5}, NAMES, household=True, outdoor_sensor=True)
    assert body["status"] == "ready"
    assert [r["room_id"] for r in body["rooms"]] == ["bed", "lounge"]
    assert body["days"][0]["dh_actual_kh"] == rep(days)["days"][0]["dh_actual_kh"]


def test_tick_is_capped():
    m = SavingsMeter()
    m.update(3600.0, outdoor_c=5.0, baseline=True, rooms={"bed": sample(t=15.0)})
    assert m.rooms["bed"].dh_actual_kh == pytest.approx(10 * MAX_TICK_S / 3600)


def test_close_resets_the_day_and_keeps_lift():
    m = SavingsMeter()
    run(m, 3, {"bed": sample(t=18.0, baseline=None, use="setback", drive=1.0)})
    lift = m.lift_k["bed"]
    rec = m.close()
    assert set(rec["rooms"]["bed"]) >= {
        "dh_actual_kh",
        "dh_baseline_kh",
        "deficit_kh",
        "warm_min",
        "warm_ok_min",
    }
    assert {"outdoor_share", "baseline_share", "outdoor_mean_c"} <= set(rec)
    assert m.rooms == {} and m.seen_s == 0.0 and m.outdoor_s == 0.0
    assert m.lift_k["bed"] == lift


def test_degree_hours_properties():
    """Random sequences: degree-hours are non-negative, add up over split intervals,
    and with no lift the baseline side is never below the actual side."""
    rng = random.Random(7)
    for _ in range(200):
        m = SavingsMeter()
        split = SavingsMeter()
        for _ in range(rng.randint(1, 60)):
            dt = rng.uniform(1, 400)
            t = rng.choice([None, rng.uniform(5, 25)])
            out = rng.choice([None, rng.uniform(-10, 20)])
            base = rng.choice([None, rng.uniform(12, 21)])
            setpoint = base if base is not None else rng.uniform(10, 16)
            rooms = {"r": sample(t=t, setpoint=setpoint, baseline=base, drive=0.0)}
            m.update(dt, outdoor_c=out, baseline=True, rooms=rooms)
            capped = min(dt, MAX_TICK_S)
            split.update(capped / 2, outdoor_c=out, baseline=True, rooms=rooms)
            split.update(capped / 2, outdoor_c=out, baseline=True, rooms=rooms)
        r, s = m.rooms["r"], split.rooms["r"]
        assert r.dh_actual_kh >= 0 and r.dh_baseline_kh >= 0
        assert r.dh_baseline_kh >= r.dh_actual_kh - 1e-9  # drive 0: no lift
        assert r.dh_actual_kh == pytest.approx(s.dh_actual_kh, abs=1e-9)
        assert r.dh_baseline_kh == pytest.approx(s.dh_baseline_kh, abs=1e-9)
        assert 0 <= r.warm_ok_min <= r.warm_min + 1e-9


def test_lift_properties():
    """Lift is never negative and never above a / b, whatever the inputs."""
    rng = random.Random(11)
    for _ in range(200):
        m = SavingsMeter()
        a, b = rng.uniform(0.1, 12), rng.uniform(0.005, 0.6)
        for _ in range(100):
            base = rng.choice([None, 18.0])
            s = sample(
                t=18.0, setpoint=rng.uniform(14, 22), baseline=base, drive=rng.random(), a=a, b=b
            )
            m.update(rng.uniform(1, 300), outdoor_c=5.0, baseline=True, rooms={"r": s})
            assert 0.0 <= m.lift_k["r"] <= a / b + 1e-9


# --- weights -------------------------------------------------------------------------------


def test_room_weights_equal_until_every_room_is_confident():
    models = {"bed": (2.0, 0.1, 0.9), "lounge": (1.0, 0.1, 0.5)}
    assert room_weights(models) == {"bed": 0.5, "lounge": 0.5}
    models["lounge"] = (1.0, 0.1, 0.7)
    w = room_weights(models)
    assert w["lounge"] == pytest.approx(2 / 3) and w["bed"] == pytest.approx(1 / 3)
    assert sum(w.values()) == pytest.approx(1.0)
    assert room_weights({}) == {}


# --- house signature -------------------------------------------------------------------------


def test_fit_recovers_signature_despite_noise_and_an_outlier():
    rng = random.Random(3)
    k, c = 0.012, 0.6
    dh = [rng.uniform(150, 450) for _ in range(30)]
    litres = [k * x + c + rng.gauss(0, 0.02) for x in dh]
    litres[7] *= 4  # a wild day: a delivery misread, a stuck relay
    sig = fit_signature(dh, litres)
    assert isinstance(sig, Signature)
    assert sig.k == pytest.approx(k, rel=0.05)
    assert sig.c == pytest.approx(c, rel=0.05)
    assert sig.days == 30
    assert sig.spread > 1.3


def test_fit_through_origin_when_intercept_negative():
    dh = [100.0, 200.0, 300.0, 400.0]
    litres = [0.5, 1.6, 2.7, 3.8]  # slope 0.011, intercept -0.6
    sig = fit_signature(dh, litres)
    assert sig.c == 0.0
    assert sig.k == pytest.approx(sum(litres) / sum(dh))


def test_fit_needs_two_days_with_different_weather():
    assert fit_signature([], []) is None
    assert fit_signature([100.0], [1.0]) is None
    assert fit_signature([100.0, 100.0], [1.0, 2.0]) is None


def test_fit_properties():
    """Exact lines are recovered exactly; scaling litres scales k and c; order of days
    does not matter; one outlier among many barely moves the slope."""
    rng = random.Random(5)
    for _ in range(100):
        k, c = rng.uniform(0.002, 0.05), rng.uniform(0, 2)
        dh = [rng.uniform(50, 600) for _ in range(rng.randint(3, 40))]
        litres = [k * x + c for x in dh]
        sig = fit_signature(dh, litres)
        assert sig.k == pytest.approx(k, rel=1e-9)
        assert sig.c == pytest.approx(c, abs=1e-9)
        assert sig.cv_rmse == pytest.approx(0.0, abs=1e-9)
        scaled = fit_signature(dh, [2.5 * y for y in litres])
        assert scaled.k == pytest.approx(2.5 * k) and scaled.c == pytest.approx(2.5 * c)
        order = list(range(len(dh)))
        rng.shuffle(order)
        shuffled = fit_signature([dh[i] for i in order], [litres[i] for i in order])
        assert shuffled == sig
        if len(dh) >= 10:
            bad = list(litres)
            bad[0] = bad[0] * 10 + 5
            assert fit_signature(dh, bad).k == pytest.approx(k, rel=0.15)


# --- eligibility and report ------------------------------------------------------------------

DAY0 = date(2026, 11, 1).toordinal()
ROOMS = ("bed", "lounge")
NAMES = {"bed": "Bedroom", "lounge": "Lounge"}
WEIGHTS = {"bed": 0.5, "lounge": 0.5}


def summary(
    i: int,
    dh_act: float,
    dh_base: float,
    *,
    litres: float | None,
    partial=False,
    basis="relay",
    outdoor_share=1.0,
    baseline_share=1.0,
    read_min=1440.0,
) -> dict:
    """A closed day summary as the ledger and the meter produce it, house totals split
    evenly over two rooms (equal weights, so weighted degree-hours equal the inputs)."""
    rooms = {
        rid: {
            "dh_actual_kh": dh_act,
            "dh_baseline_kh": dh_base,
            "deficit_kh": 0.1,
            "warm_min": 600.0,
            "warm_ok_min": 594.0,
            "read_min": read_min,
        }
        for rid in ROOMS
    }
    return {
        "day": DAY0 + i,
        "partial": partial,
        "basis": basis,
        "litres": litres,
        "savings": {
            "rooms": rooms,
            "outdoor_share": outdoor_share,
            "baseline_share": baseline_share,
            "outdoor_mean_c": 5.0,
        },
    }


def month(n: int, k=0.01, c=0.5, saving_kh=40.0, seed=1) -> list[dict]:
    rng = random.Random(seed)
    out = []
    for i in range(n):
        dh = 200 + 150 * math.sin(i / 3) + rng.uniform(-10, 10)
        out.append(summary(i, dh, dh + saving_kh, litres=k * dh + c + rng.gauss(0, 0.02)))
    return out


def rep(days, **kw):
    kw.setdefault("household", True)
    kw.setdefault("outdoor_sensor", True)
    return report(days, WEIGHTS, NAMES, **kw)


def test_why_not_eligible():
    assert why_not_eligible(summary(0, 100, 120, litres=2.0), "relay") is None
    assert why_not_eligible(summary(0, 100, 120, litres=2.0, partial=True), "relay") == (
        "partial day"
    )
    assert why_not_eligible(summary(0, 100, 120, litres=None), "relay") == "no nozzle rating"
    assert "basis" in why_not_eligible(summary(0, 100, 120, litres=2.0), "firing")
    assert why_not_eligible(
        summary(0, 100, 120, litres=2.0, outdoor_share=1 - 4 / 24), "relay"
    ) == ("outdoor sensor missing for 4 h")
    assert "baseline" in why_not_eligible(
        summary(0, 100, 120, litres=2.0, baseline_share=0.5), "relay"
    )
    assert why_not_eligible(
        summary(0, 100, 120, litres=2.0, read_min=1440 - 180), "relay", NAMES
    ) == ("no reading from Bedroom for 3 h")
    old = summary(0, 100, 120, litres=2.0)
    del old["savings"]
    assert why_not_eligible(old, "relay") == "no savings record"


def test_thirteen_days_is_still_learning():
    body = rep(month(13))
    assert body["status"] == "learning"
    assert body["why"] == "13 of 14 days"
    assert body["progress"] == {"eligible_days": 13, "needed_days": 14}
    assert body["fit"] is None and body["totals"] is None and body["rooms"] == []
    assert len(body["days"]) == 13
    assert all(d["eligible"] and d["litres_saved"] is None for d in body["days"])


def test_ineligible_days_are_listed_not_zero_and_not_counted():
    days = month(20)
    days[3]["partial"] = True
    days[5]["savings"]["outdoor_share"] = 0.5
    del days[6:9]  # Radiate down for three whole days: no summaries at all
    body = rep(days)
    by_date = {d["date"]: d for d in body["days"]}
    assert by_date[date.fromordinal(DAY0 + 3).isoformat()]["why"] == "partial day"
    assert by_date[date.fromordinal(DAY0 + 5).isoformat()]["eligible"] is False
    assert date.fromordinal(DAY0 + 7).isoformat() not in by_date
    assert body["progress"]["eligible_days"] == 15
    assert body["status"] == "ready"
    assert body["totals"]["days"] == 15
    for d in body["days"]:
        if not d["eligible"]:
            assert d["litres_saved"] is None and d["litres_baseline"] is None


def test_unavailable_reasons():
    assert rep(month(20), household=False)["why"] == "no household"
    assert rep(month(20), household=False)["status"] == "unavailable"
    assert rep(month(20), outdoor_sensor=False)["why"] == "no outdoor sensor"
    no_nozzle = month(20)
    for d in no_nozzle:
        d["litres"] = None
    body = rep(no_nozzle)
    assert body["status"] == "unavailable" and body["why"] == "no nozzle rating"


def test_poor_fit_is_still_learning():
    rng = random.Random(9)
    days = [summary(i, rng.uniform(100, 400), 400, litres=rng.uniform(0.5, 8)) for i in range(20)]
    body = rep(days)
    assert body["status"] == "learning"
    assert "fit" in body["why"]
    assert body["totals"] is None


def test_narrow_weather_is_still_learning():
    days = [summary(i, 300 + (i % 3), 320, litres=3.5 + 0.01 * (i % 3)) for i in range(20)]
    body = rep(days)
    assert body["status"] == "learning"
    assert body["why"] == "the weather hasn't varied enough yet"


def test_ready_report_matches_hand_calculation():
    days = month(30, k=0.01, c=0.5, saving_kh=40.0)
    body = rep(days)
    assert body["status"] == "ready" and body["why"] is None
    assert body["basis"] == "relay" and body["litres_upper_bound"] is True
    assert "upper bound" in body["basis_text"]
    assert body["baseline"] == {"id": "timer_and_valves", "text": BASELINE_TEXT}
    fit = body["fit"]
    k = fit["litres_per_100_kh"] / 100
    assert k == pytest.approx(0.01, rel=0.05)
    assert fit["weights"] == "equal"
    t = body["totals"]
    assert t["days"] == 30 and t["since"] == "2026-11-01"
    assert t["litres_saved"] == pytest.approx(30 * 40 * k, rel=0.01)
    assert t["litres_baseline"] == pytest.approx(t["litres_used"] + t["litres_saved"], abs=0.02)
    assert t["percent_saved"] == pytest.approx(
        100 * t["litres_saved"] / t["litres_baseline"], abs=0.1
    )
    assert t["warm_share"] == pytest.approx(0.99)
    assert t["comfort_deficit_kh"] == pytest.approx(30 * 0.2)


def test_negative_day_stays_negative():
    days = month(20)
    days[-1]["savings"]["rooms"]["bed"]["dh_baseline_kh"] = 0.0
    days[-1]["savings"]["rooms"]["lounge"]["dh_baseline_kh"] = 0.0
    body = rep(days)
    assert body["status"] == "ready"
    assert body["days"][-1]["litres_saved"] < 0
    assert body["days"][-1]["litres_baseline"] < body["days"][-1]["litres"]


def test_room_shares_sum_to_the_total_saving():
    days = month(30)
    for d in days:
        d["savings"]["rooms"]["lounge"]["dh_baseline_kh"] += 30.0
    body = rep(days)
    rooms = body["rooms"]
    assert [r["room_id"] for r in rooms] == ["lounge", "bed"]  # sorted by litres saved
    assert sum(r["share"] for r in rooms) == pytest.approx(1.0, abs=0.01)
    total = body["totals"]["litres_saved"]
    assert sum(r["litres_saved"] for r in rooms) == pytest.approx(total, abs=0.02)
    assert rooms[0]["name"] == "Lounge"


def test_fit_uses_one_basis_only():
    days = month(20)
    for d in days[-5:]:
        d["basis"] = "firing"
    body = rep(days)
    assert body["basis"] == "firing"
    assert body["status"] == "learning" and body["why"] == "5 of 14 days"


def test_a_mixed_basis_day_counts_for_neither_basis():
    # Burner metering (spec 5.6): a day with both metered firing and unmetered relay
    # time has basis "mixed". It fits neither basis, so it isn't eligible, and it
    # doesn't make the firing days before it ineligible either.
    days = month(20)
    for d in days[-6:]:
        d["basis"] = "firing"
    days[-1]["basis"] = "mixed"
    body = rep(days)
    assert body["basis"] == "firing" and body["litres_upper_bound"] is False
    assert body["why"] == "5 of 14 days"
    assert body["days"][-1]["why"] == "litres part metered, part from relay time"
    assert all(d["eligible"] for d in body["days"][-6:-1])
    # Only mixed days so far (metering that keeps dropping out): none is eligible, and
    # the litres shown are flagged as possibly high.
    for d in days:
        d["basis"] = "mixed"
    body = rep(days)
    assert body["basis"] == "mixed" and body["litres_upper_bound"] is True
    assert "may be high" in body["basis_text"]
    assert body["progress"]["eligible_days"] == 0


def test_report_is_deterministic():
    days = month(30)
    assert rep(days) == rep([dict(d) for d in days])


# --- golden: a synthetic month through the meter ------------------------------------------------


def synthetic_month() -> list[dict]:
    """30 days of minute ticks: two rooms, outdoor following a weather pattern, the
    bedroom cooler than the baseline during the day and pre-heated before the timer,
    the lounge at the baseline with a fire some evenings. Litres from a known signature
    of the actual degree-hours, so the fit has a true answer."""
    m = SavingsMeter()
    days = []
    for d in range(30):
        mean = 6.0 + 5.0 * math.sin(d / 4.0)
        for minute in range(0, 1440, 5):
            out = mean + 3.0 * math.sin((minute / 1440 - 0.3) * 2 * math.pi)
            timer = 7 * 60 <= minute < 22 * 60
            pre = 6 * 60 <= minute < 7 * 60
            bed = sample(
                t=(16.3 if minute < 8 * 60 else 17.0) if timer else (17.5 if pre else 14.0),
                setpoint=17.0 if timer else (17.0 if pre else 14.0),
                use="in_use" if timer else "setback",
                baseline=19.0 if timer else None,
                drive=1.0 if pre else (0.3 if timer else 0.0),
                a=2.0,
                b=0.1,
            )
            fire = d % 5 == 0 and 18 * 60 <= minute < 21 * 60
            lounge = sample(
                t=23.0 if fire else (19.0 if timer else 15.0),
                setpoint=19.0 if timer else 14.0,
                use="occasional" if timer else "setback",
                baseline=19.0 if timer else None,
                drive=0.0 if fire else (0.4 if timer else 0.0),
                a=1.5,
                b=0.12,
            )
            m.update(300.0, outdoor_c=out, baseline=True, rooms={"bed": bed, "lounge": lounge})
        rec = m.close()
        dh = sum(r["dh_actual_kh"] for r in rec["rooms"].values()) / 2
        days.append(
            {
                "day": DAY0 + d,
                "partial": False,
                "basis": "relay",
                "litres": round(0.012 * dh + 0.4, 3),
                "savings": rec,
            }
        )
    return days


# Checked by hand: the bedroom is 2 K under the baseline's 19 °C for 14 h and 2.7 K for
# 1 h, about 30.7 K·h a day, less about 3.4 K·h of lift from the hour of preheat and its
# decay overnight; at weight 0.5 and 0.012 litres per K·h that is about 0.16 litres a
# day. The lounge sits at the baseline (fires cancel). Comfort: 0.2 K short for 1 h a day.
GOLDEN = {
    "status": "ready",
    "litres_per_100_kh": 1.2,
    "standing_litres_per_day": 0.4,
    "litres_used": 102.21,
    "litres_saved": 4.85,
    "percent_saved": 4.5,
    "warm_share": 0.967,
    "comfort_deficit_kh": 6.0,
    "rooms": [("bed", 4.85), ("lounge", 0.0)],
}


def test_golden_synthetic_month():
    days = synthetic_month()
    body = report(days, WEIGHTS, NAMES, household=True, outdoor_sensor=True)
    got = {
        "status": body["status"],
        "litres_per_100_kh": body["fit"]["litres_per_100_kh"],
        "standing_litres_per_day": body["fit"]["standing_litres_per_day"],
        "litres_used": body["totals"]["litres_used"],
        "litres_saved": body["totals"]["litres_saved"],
        "percent_saved": body["totals"]["percent_saved"],
        "warm_share": body["totals"]["warm_share"],
        "comfort_deficit_kh": body["totals"]["comfort_deficit_kh"],
        "rooms": [(r["room_id"], r["litres_saved"]) for r in body["rooms"]],
    }
    assert got == GOLDEN
    # The signature the litres were made from is recovered.
    assert body["fit"]["litres_per_100_kh"] == pytest.approx(1.2, rel=0.01)
    assert body["fit"]["standing_litres_per_day"] == pytest.approx(0.4, abs=0.01)


# --- in the engine ---------------------------------------------------------------------------


CFG = HouseConfig(rooms=(RoomConfig("bed", "Bedroom"), RoomConfig("lounge", "Lounge")))


def _ticks(baseline: bool, minutes: int = 3 * 1440):
    st = EngineState.new(CFG)
    relay = False
    out = []
    for i in range(minutes):
        minute = i % 1440
        temps = {"bed": 16.0 + (i % 90) / 60, "lounge": 18.0 + (i % 70) / 50}
        rooms = {
            rid: RoomInput(
                temperature=t,
                trv_temperature=t + 0.5,
                setpoint=19.0 if 7 * 60 <= minute < 22 * 60 else 14.0,
                trv_heating=t < 19.0,
                use="in_use" if baseline else None,
                baseline_c=18.0 if baseline and 7 * 60 <= minute < 22 * 60 else None,
            )
            for rid, t in temps.items()
        }
        snap = Snapshot(
            now=i * 60.0,
            minute_of_day=minute,
            outdoor=5.0,
            rooms=rooms,
            heating_relay=relay,
            store_relay=False,
            day=DAY0 + i // 1440,
            baseline=baseline,
        )
        acts = decide(CFG, snap, st)
        relay = acts.heating_relay
        out.append(acts)
    return out, st


def test_control_is_untouched_by_the_baseline():
    with_b, st = _ticks(True)
    without, _ = _ticks(False)
    for a, b in zip(with_b, without, strict=True):
        assert a.valves == b.valves
        assert a.heating_relay == b.heating_relay
        assert a.boiler_state == b.boiler_state
        assert a.store_relay == b.store_relay
    closed = [a.day_summary for a in with_b if a.day_summary is not None]
    assert len(closed) == 2
    rec = closed[-1]["savings"]
    assert rec["baseline_share"] == pytest.approx(1.0)
    assert rec["outdoor_share"] == pytest.approx(1.0)
    assert rec["rooms"]["bed"]["dh_actual_kh"] > 0
    assert rec["rooms"]["bed"]["warm_min"] == pytest.approx(1440)
    assert st.savings.lift_k.keys() == {"bed", "lounge"}


def test_every_closed_day_in_the_simulator_has_a_savings_record():
    from radiate.sim.runner import run as sim_run

    res = sim_run("radiate", days=2, warmup_days=0, seed=1)
    assert res.day_summaries
    assert all("savings" in s for s in res.day_summaries)


def test_report_names_the_outdoor_source():
    body = report([], WEIGHTS, NAMES, household=True, outdoor_sensor=True, outdoor_source="both")
    assert body["outdoor"]["source"] == "both"
    assert "Home Assistant" in body["outdoor"]["text"]
    body = report([], WEIGHTS, NAMES, household=True, outdoor_sensor=False)
    assert body["outdoor"] == {"source": None, "text": None}


def test_record_day_constant():
    assert DAY_S == 86400.0
    assert RoomDay().read_s == 0.0
    assert SavingsParams().min_days == 14
