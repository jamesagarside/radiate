"""Heat availability from the relay and the burner, and what learning and the fire
detector may take from it (spec 4.1, 4.3, 4.6, 5.5)."""

import random

from radiate.core import EngineState, HeatSource, HouseConfig, RoomConfig, RoomInput, Snapshot
from radiate.core.decide import decide

CFG = HouseConfig(
    rooms=(
        RoomConfig("bed", "Bedroom"),
        RoomConfig("lounge", "Lounge", heat_source=HeatSource.EPISODIC),
    )
)
MIN = 60.0


def snap(m: int, temps: dict[str, float], *, setpoint=20.0, trv_offset=0.5, **kw) -> Snapshot:
    rooms = {
        rid: RoomInput(
            temperature=t,
            trv_temperature=t
            + (trv_offset.get(rid, 0.5) if isinstance(trv_offset, dict) else trv_offset),
            setpoint=setpoint,
            trv_heating=True,
        )
        for rid, t in temps.items()
    }
    return Snapshot(
        now=m * MIN,
        minute_of_day=12 * 60,
        outdoor=5.0,
        rooms=rooms,
        heating_relay=kw.pop("relay", True),
        store_relay=kw.pop("store", False),
        **kw,
    )


def run(st, minutes, temps_at, start=0, **kw):
    for m in range(start, start + minutes):
        decide(CFG, snap(m, temps_at(m), **kw), st)


def steady(m):
    return {"bed": 16.0, "lounge": 16.0}


# --- learning needs heat it can see ----------------------------------------------------


def test_dry_run_without_burner_metering_does_not_learn():
    # In dry run something else runs the boiler (its own timer), so the relay alone
    # does not say when the radiators get heat.
    st = EngineState.new(CFG)
    run(st, 40, steady, relay=False, relay_follows_commands=False)
    assert st.rooms["bed"].learning_gate == "heat_unknown"
    assert st.rooms["bed"].est.samples == 0


def test_dry_run_with_burner_metering_learns():
    st = EngineState.new(CFG)
    run(st, 40, steady, relay_follows_commands=False, heating_burner=False, relay=False)
    assert st.rooms["bed"].learning_gate is None
    assert st.rooms["bed"].est.samples > 0


def test_relay_not_read_does_not_learn():
    # The driver stood in the last command: no evidence of heat either way.
    st = EngineState.new(CFG)
    run(st, 40, steady, relay=False, relay_observed=False)
    assert st.rooms["bed"].learning_gate == "heat_unknown"


def test_relay_on_with_the_burner_never_firing_gives_no_drive():
    # The boiler's own timer or thermostat keeps the burner off: no heat to learn from.
    st = EngineState.new(CFG)
    run(st, 40, steady, heating_burner=False)
    assert st.rooms["bed"].drive == 0.0
    st = EngineState.new(CFG)
    run(st, 40, steady, heating_burner=True)
    assert st.rooms["bed"].drive > 0.1


def test_boiler_thermostat_cycling_keeps_heat_available():
    # The burner fires, then the boiler's thermostat holds it off for a few minutes
    # with the pump running: the water is still hot, so the drive carries on.
    st = EngineState.new(CFG)
    run(st, 30, steady, heating_burner=True)
    before = st.rooms["bed"].drive
    run(st, 25, steady, start=30, heating_burner=False)
    assert st.rooms["bed"].drive >= before
    # The call ends: availability ends with it.
    run(st, 30, steady, start=55, relay=False, heating_burner=False)
    assert st.rooms["bed"].drive < 0.2 * before  # the radiator cools, tau 15 min


def test_a_call_soon_after_a_burn_starts_hot():
    # The burner fired 10 min before the relay came back on: the boiler is still hot,
    # so heat is available before the burner fires again.
    st = EngineState.new(CFG)
    run(st, 20, steady, heating_burner=True)
    run(st, 10, steady, start=20, relay=False, heating_burner=False)
    run(st, 30, steady, start=30, heating_burner=False)
    assert st.rooms["bed"].drive > 0.1
    # Long after the last burn, a call whose burner never fires brings no heat.
    run(st, 60, steady, start=60, relay=False, heating_burner=False)
    run(st, 30, steady, start=120, heating_burner=False)
    assert st.rooms["bed"].drive < 0.01


def warming(m):
    return {"bed": 16.0 + 2.0 * m / 60, "lounge": 16.0 + 2.0 * m / 60}


def test_old_snapshots_without_the_new_fields_decide_as_before():
    # No metering and the relay read: heat availability is the relay, as it was.
    st = EngineState.new(CFG)
    run(st, 40, warming)
    assert st.rooms["bed"].learning_gate is None and st.rooms["bed"].drive > 0.1


def test_metered_store_recovery_ends_when_the_store_burner_stops():
    st = EngineState.new(CFG)
    run(st, 15, warming, store=True, store_burner=True, heating_burner=False)
    assert st.rooms["bed"].learning_gate == "store_recovery"
    # Well inside the fixed recovery time, but the store burner has stopped.
    run(st, 5, warming, start=15, store=True, store_burner=False, heating_burner=True)
    assert st.rooms["bed"].learning_gate is None


# --- the fire detector -------------------------------------------------------------------


def rising(rate_kph, start=16.0):
    return lambda m: {"bed": 16.0, "lounge": start + rate_kph * m / 60}


def test_a_rise_with_heat_unknown_is_not_a_fire():
    # Dry run, relay off as Radiate sees it, the boiler's own timer heating the lounge.
    st = EngineState.new(CFG)
    run(st, 60, rising(2.0), relay=False, relay_follows_commands=False)
    assert not st.rooms["lounge"].dist.fire


def test_a_rise_with_the_radiator_warm_is_not_a_fire():
    # Radiate thinks the radiator is off, but the TRV beside it reads 3 K above the room.
    st = EngineState.new(CFG)
    run(st, 60, rising(2.0), relay=False, trv_offset={"lounge": 3.0})
    assert not st.rooms["lounge"].dist.fire


def test_a_rise_with_the_radiator_cold_is_still_a_fire():
    st = EngineState.new(CFG)
    run(st, 60, rising(2.0), relay=False)
    assert st.rooms["lounge"].dist.fire


def test_confident_model_residual_with_the_radiator_warm_is_not_a_fire():
    # A confident model that says the radiator barely heats: ordinary radiator heat
    # leaves a large residual, but the TRV shows the radiator is warm.
    st = EngineState.new(CFG)
    est = st.rooms["lounge"].est
    est.theta[0] = 0.15
    est.p[0][0] = 1e-4
    assert est.confidence > 0.9
    run(st, 60, rising(3.0), heating_burner=True, trv_offset={"lounge": 4.0})
    assert not st.rooms["lounge"].dist.fire


# --- the sensor coming back after a TRV fallback -------------------------------------------


def test_sensor_back_after_a_trv_fallback_is_not_a_rise():
    # After a restart the room reads its TRV (1.5 K low) until the sensor reports again.
    # The step back up is not heat: no slope across the two sources.
    st = EngineState.new(CFG)
    run(st, 30, steady, relay=False)
    for m in range(30, 43):
        s = snap(m, steady(m), relay=False, trv_offset=0.0)
        s.rooms["bed"].temperature_age_s = 3600  # stale: the TRV fallback
        decide(CFG, s, st)
    assert abs(st.rooms["bed"].temperature - 14.5) < 1e-6
    for m in range(43, 70):
        decide(CFG, snap(m, steady(m), relay=False, trv_offset=0.0), st)
        slope = st.rooms["bed"].slope
        assert slope is None or abs(slope) < 0.5
    assert st.rooms["bed"].dist.learning_blocked(70 * MIN) is None


# --- a confident but wrong model is not locked by its own gate ------------------------------


def test_confident_wrong_model_relearns_instead_of_pausing_forever():
    # Trained in a dry run that took heat for granted: a = 0.15 K/h, confident. The
    # bedroom really warms at 6 K/h at full drive, so its heating minutes look like
    # unexplained heat. Change detection sees those minutes, re-learns, and the gate
    # stands down while the model learns from them. Burns of an hour, an hour apart.
    st = EngineState.new(CFG)
    rng = random.Random(3)
    est = st.rooms["bed"].est
    for i in range(800):
        u = rng.uniform(0.2, 0.5) if i % 180 < 60 else 0.0
        est.update(0.15 * u - 0.08 * 11 + rng.gauss(0, 0.2), u, 11.0)
    assert est.confidence > 0.8 and est.a < 0.5 and est.relearns == 0
    t = 16.0
    codes = set()
    for m in range(480):
        t += (6.0 * st.rooms["bed"].drive - 0.08 * (t - 5.0)) / 60
        on = m % 120 < 60
        s = snap(m, {"bed": t, "lounge": 21.0}, setpoint=30.0, relay=on, heating_burner=on)
        codes |= {r.code for r in decide(CFG, s, st).reasons}
    assert est.relearns >= 1 and "learning.relearn" in codes
    assert est.a > 2.0  # from 0.15, against a gain the slope window sees as about 3 to 4


def test_doubt_disarms_the_residual_gates():
    st = EngineState.new(CFG)
    st.rooms["bed"].est.relearn()
    run(st, 40, lambda m: {"bed": 16.0 + 3.0 * m / 60, "lounge": 21.0}, relay=False)
    assert st.rooms["bed"].dist.learning_blocked(40 * MIN) != "unexplained_heat"


# --- resetting models learned under invalid conditions -------------------------------------


def test_reset_learned_puts_rooms_back_to_their_priors():
    from radiate.core.decide import reset_learned

    st = EngineState.new(CFG)
    run(st, 40, warming)
    bed = st.rooms["bed"]
    bed.est.theta[0] = 0.15
    bed.lag_samples = [600.0]
    bed.lockshield_hist[30] = 50.0
    lounge_est = st.rooms["lounge"].est
    assert reset_learned(CFG, st, ["bed"]) == ["bed"]
    assert bed is st.rooms["bed"]  # disturbances, demand and valve state are kept
    assert st.rooms["bed"].est.a == 1.5 and st.rooms["bed"].est.samples == 0
    assert st.rooms["bed"].lag_samples == [] and st.rooms["bed"].lockshield == 60
    assert st.rooms["lounge"].est is lounge_est
    assert reset_learned(CFG, st) == ["bed", "lounge"]


def test_reset_learned_refuses_an_unknown_room():
    import pytest

    from radiate.core.decide import reset_learned

    st = EngineState.new(CFG)
    with pytest.raises(KeyError):
        reset_learned(CFG, st, ["bed", "attic"])
    assert st.rooms["bed"].est.samples == 0
