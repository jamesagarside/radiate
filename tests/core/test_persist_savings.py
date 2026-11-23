"""The savings meter survives a restart (spec 5.9 persistence)."""

from __future__ import annotations

import json
import math

import pytest

from radiate.core import EngineState
from radiate.core.persist import dump_state, load_state
from radiate.core.savings import SAVINGS_VERSION, RoomDay, SavingsMeter
from radiate.sim.reference import house_config


def meter() -> SavingsMeter:
    m = SavingsMeter()
    m.rooms["bedroom_1"] = RoomDay(
        dh_actual_kh=120.5,
        dh_baseline_kh=140.25,
        deficit_kh=0.4,
        warm_min=300.0,
        warm_ok_min=290.0,
        read_s=40000.0,
    )
    m.lift_k = {"bedroom_1": 1.5, "dining": 0.0}
    m.seen_s = 40000.0
    m.outdoor_s = 39000.0
    m.baseline_s = 40000.0
    m.outdoor_sum_cs = 39000.0 * 4.5
    return m


def saved(m: SavingsMeter) -> dict:
    cfg = house_config()
    st = EngineState.new(cfg)
    st.savings = m
    return json.loads(json.dumps(dump_state(st, 1000.0)))  # must be plain JSON


def test_round_trip_keeps_the_meter():
    cfg = house_config()
    data = saved(meter())
    assert data["savings"]["version"] == SAVINGS_VERSION
    st, problems = load_state(cfg, data, now=5.0, elapsed_s=0.0)
    assert problems == []
    assert st.savings == meter()


def test_save_without_savings_loads_an_empty_meter():
    cfg = house_config()
    data = saved(meter())
    del data["savings"]
    st, problems = load_state(cfg, data, now=5.0)
    assert problems == []
    assert st.savings == SavingsMeter()


def test_downtime_decays_lift_at_the_loss_rate():
    cfg = house_config()
    data = saved(meter())
    st, _ = load_state(cfg, data, now=5.0, elapsed_s=2 * 3600.0)
    b = st.rooms["bedroom_1"].est.b
    assert st.savings.lift_k["bedroom_1"] == pytest.approx(1.5 * math.exp(-b * 2))
    # The day's accumulators are kept: the downtime is unseen, so the shares fall.
    assert st.savings.rooms["bedroom_1"].dh_actual_kh == 120.5


def test_unknown_version_starts_an_empty_meter_and_says_so():
    cfg = house_config()
    data = saved(meter())
    data["savings"]["version"] = SAVINGS_VERSION + 1
    st, problems = load_state(cfg, data, now=5.0)
    assert st.savings == SavingsMeter()
    assert any("savings" in p for p in problems)


@pytest.mark.parametrize(
    "corrupt",
    [
        "nonsense",
        {"version": SAVINGS_VERSION, "rooms": {"bedroom_1": {"dh_actual_kh": "x"}}},
        {"version": SAVINGS_VERSION, "rooms": {"bedroom_1": {"dh_actual_kh": -1.0}}},
        {"version": SAVINGS_VERSION, "lift_k": {"bedroom_1": float("nan")}},
        {"version": SAVINGS_VERSION, "seen_s": -5},
    ],
)
def test_corrupt_savings_never_stop_a_load(corrupt):
    cfg = house_config()
    data = saved(meter())
    data["savings"] = corrupt
    st, _ = load_state(cfg, data, now=5.0)
    m = st.savings
    for r in m.rooms.values():
        assert r.dh_actual_kh >= 0 and math.isfinite(r.dh_actual_kh)
    assert all(math.isfinite(v) and v >= 0 for v in m.lift_k.values())
    assert m.seen_s >= 0


def test_older_room_record_without_read_time_loads():
    cfg = house_config()
    data = saved(meter())
    del data["savings"]["rooms"]["bedroom_1"]["read_s"]
    st, problems = load_state(cfg, data, now=5.0)
    assert problems == []
    assert st.savings.rooms["bedroom_1"].read_s == 0.0
    assert st.savings.rooms["bedroom_1"].dh_baseline_kh == 140.25


def test_rooms_no_longer_in_the_house_are_dropped():
    cfg = house_config()
    data = saved(meter())
    data["savings"]["rooms"]["gone"] = data["savings"]["rooms"]["bedroom_1"]
    data["savings"]["lift_k"]["gone"] = 2.0
    st, _ = load_state(cfg, data, now=5.0)
    assert "gone" not in st.savings.rooms and "gone" not in st.savings.lift_k
