"""Hand-back from the Shelly watchdog (spec 5.7): the guard adopts the observed relay."""

import math

from radiate.core import BoilerState, EngineState, HouseConfig, RoomConfig, RoomInput, Snapshot
from radiate.core import decide as _decide
from radiate.core.boiler import BoilerGuard
from radiate.core.persist import dump_state, load_state
from radiate.core.types import BoilerConfig

CFG = HouseConfig(rooms=(RoomConfig("bed", "Bedroom"), RoomConfig("dining", "Dining room")))
MIN_BURN, MIN_OFF = CFG.boiler.min_burn_s, CFG.boiler.min_off_s


def snap(t: float, relay: bool, temp: float = 22.0, trv: bool = True, **kw) -> Snapshot:
    """Rooms warm by default (no demand). `trv=False`: no TRV reachable (safe mode)."""
    rooms = {
        rid: RoomInput(
            temperature=temp,
            trv_temperature=temp + 0.5,
            setpoint=20.0,
            trv_heating=temp < 20.0,
            trv_available=trv,
        )
        for rid in ("bed", "dining")
    }
    return Snapshot(t, 12 * 60, 5.0, rooms, heating_relay=relay, store_relay=False, **kw)


def decide(st, s):
    return _decide(CFG, s, st)


def codes(acts) -> set[str]:
    return {r.code for r in acts.reasons}


# --- the guard on its own ----------------------------------------------------------------


def test_adopting_a_burn_counts_a_start_and_holds_minimum_burn():
    g = BoilerGuard()
    assert g.adopt(100.0, relay_on=True) == "burn"
    assert g.state is BoilerState.FIRING and g.burn_started_at == 100.0
    assert g.starts == [100.0] and g.external and not g.commanded
    cfg = BoilerConfig()
    assert not g.can_stop(cfg, 100.0 + MIN_BURN - 1)
    assert g.can_stop(cfg, 100.0 + MIN_BURN)


def test_known_age_backdates_the_adopted_burn():
    g = BoilerGuard()
    g.adopt(1000.0, relay_on=True, age_s=300.0)
    assert g.burn_started_at == 700.0


def test_relay_as_expected_is_left_alone():
    g = BoilerGuard()
    assert g.adopt(10.0, relay_on=False) is None and g.state is BoilerState.IDLE
    g = BoilerGuard(state=BoilerState.FIRING, since=0.0, burn_started_at=0.0)
    assert g.adopt(10.0, relay_on=True) is None and g.burn_started_at == 0.0


def test_stop_seen_mid_burn_starts_minimum_off():
    g = BoilerGuard(state=BoilerState.FIRING, since=0.0, burn_started_at=0.0)
    assert g.adopt(200.0, relay_on=False) == "stop"
    assert g.state is BoilerState.REST and g.since == 200.0


def test_after_a_gap_an_off_relay_restarts_minimum_off():
    g = BoilerGuard()
    assert g.adopt(1000.0, relay_on=False, unseen_s=60.0) is None
    assert g.adopt(1000.0, relay_on=False, unseen_s=600.0) == "unseen"
    assert g.state is BoilerState.REST and g.since == 1000.0


def test_after_a_gap_a_running_burn_restarts_minimum_burn():
    g = BoilerGuard(state=BoilerState.FIRING, since=0.0, burn_started_at=0.0)
    assert g.adopt(3000.0, relay_on=True, unseen_s=1200.0) == "burn"
    assert g.burn_started_at == 3000.0


# --- in decide ---------------------------------------------------------------------------


def test_start_mid_watchdog_burn_keeps_the_burner_on_for_minimum_burn():
    st = EngineState.new(CFG)
    acts = decide(st, snap(0.0, relay=True))
    assert acts.heating_relay and acts.boiler_state is BoilerState.FIRING
    assert "boiler.adopted" in codes(acts)
    t = 60.0
    while t < MIN_BURN:
        assert decide(st, snap(t, relay=True)).heating_relay, t
        t += 60
    assert not decide(st, snap(MIN_BURN, relay=True)).heating_relay  # no demand: stop


def test_driver_supplied_age_lets_a_long_burn_stop_at_once():
    st = EngineState.new(CFG)
    acts = decide(st, snap(0.0, relay=True, heating_relay_age_s=20 * 60))
    assert not acts.heating_relay


def test_burn_switched_off_by_someone_else_waits_minimum_off():
    st = EngineState.new(CFG)
    relay, t = False, 0.0
    while not relay:  # cold house: Radiate fires
        relay = decide(st, snap(t, relay, temp=17.0)).heating_relay
        t += 60
    acts = decide(st, snap(t, relay=False, temp=17.0))  # relay dropped out
    assert "boiler.external_stop" in codes(acts)
    stopped = t
    while not acts.heating_relay:
        t += 60
        acts = decide(st, snap(t, relay=False, temp=17.0))
    assert t - stopped >= MIN_OFF + CFG.boiler.valve_lead_s


def test_relay_unseen_for_a_while_waits_minimum_off_before_firing():
    st = EngineState.new(CFG)
    acts = decide(st, snap(0.0, relay=False, temp=17.0, heating_relay_unseen_s=15 * 60))
    assert "boiler.relay_unseen" in codes(acts)
    t = 0.0
    while not acts.heating_relay:
        t += 60
        acts = decide(st, snap(t, relay=False, temp=17.0))
    assert t >= MIN_OFF + CFG.boiler.valve_lead_s


def test_dry_run_ignores_the_observed_relay():
    st = EngineState.new(CFG)
    acts = decide(st, snap(0.0, relay=True, relay_follows_commands=False))
    assert not acts.heating_relay and st.boiler.state is BoilerState.IDLE


def test_safe_mode_hands_over_and_follows_the_watchdog():
    st = EngineState.new(CFG)
    relay, t = False, 0.0
    while not relay:
        relay = decide(st, snap(t, relay, temp=17.0)).heating_relay
        t += 60
    # Zigbee goes down two minutes into the burn: minimum burn first, then hand over.
    t += 120
    acts = decide(st, snap(t, relay=True, temp=17.0, trv=False))
    assert acts.safe_mode and acts.heating_relay and not acts.watchdog_handover
    while acts.heating_relay:
        t += 60
        acts = decide(st, snap(t, relay=True, temp=17.0, trv=False))
    assert acts.watchdog_handover  # Radiate stops commanding; relay off is sent once
    # Off for 10 min, then the watchdog starts a burn. Radiate follows, and does not
    # try to stop it after minimum burn: it is not Radiate's to stop.
    for _ in range(10):
        t += 60
        acts = decide(st, snap(t, relay=False, temp=17.0, trv=False))
    watchdog_on = t + 60
    for _ in range(15):
        t += 60
        acts = decide(st, snap(t, relay=True, temp=17.0, trv=False))
        assert acts.watchdog_handover and acts.heating_relay
    assert st.boiler.burn_started_at == watchdog_on and st.boiler.external
    # Zigbee back, rooms now warm: Radiate takes the relay and may stop at once,
    # because it saw the whole burn.
    t += 60
    acts = decide(st, snap(t, relay=True))
    assert not acts.watchdog_handover and not acts.safe_mode and not acts.heating_relay


def test_safe_mode_ending_early_in_a_watchdog_burn_finishes_minimum_burn():
    st = EngineState.new(CFG)
    t = 0.0
    for _ in range(3):
        acts = decide(st, snap(t, relay=False, trv=False))
        t += 60
    assert acts.watchdog_handover
    started = t
    decide(st, snap(t, relay=True, trv=False))  # the watchdog fires
    t += 120
    acts = decide(st, snap(t, relay=True))  # Zigbee back, nothing calling
    assert acts.heating_relay and not acts.watchdog_handover
    while acts.heating_relay:
        t += 60
        acts = decide(st, snap(t, relay=True))
    assert t - started >= MIN_BURN


def test_restart_after_long_downtime_restarts_guard_timers():
    st = EngineState.new(CFG)
    st.boiler.state = BoilerState.REST
    st.boiler.since = 1000.0
    data = dump_state(st, 1000.0 + 5 * 60)
    # Down for 20 min: the watchdog may have burned and stopped a minute ago.
    restored, _ = load_state(CFG, data, now=10.0, elapsed_s=20 * 60)
    assert restored.relay_unseen_s == 20 * 60
    acts = decide(restored, snap(10.0, relay=False, temp=17.0))
    assert "boiler.relay_unseen" in codes(acts)
    assert restored.boiler.state is BoilerState.REST and restored.boiler.since == 10.0


def test_quick_restart_keeps_the_saved_timers():
    st = EngineState.new(CFG)
    st.boiler.state = BoilerState.FIRING
    st.boiler.since = st.boiler.burn_started_at = 1000.0
    data = dump_state(st, 1000.0 + 120)
    restored, _ = load_state(CFG, data, now=5.0, elapsed_s=30.0)
    assert restored.relay_unseen_s == 0.0
    decide(restored, snap(5.0, relay=True, temp=17.0))
    assert math.isclose(restored.boiler.burn_elapsed(5.0), 150.0)


def test_restart_into_a_watchdog_burn_holds_minimum_burn_from_now():
    st = EngineState.new(CFG)
    st.boiler.state = BoilerState.FIRING
    st.boiler.since = st.boiler.burn_started_at = 0.0
    data = dump_state(st, 600.0)
    # Down an hour: Radiate's own burn is long over; this burn is the watchdog's.
    restored, _ = load_state(CFG, data, now=0.0, elapsed_s=3600.0)
    acts = decide(restored, snap(0.0, relay=True))
    assert acts.heating_relay and restored.boiler.burn_started_at == 0.0
    assert decide(restored, snap(MIN_BURN - 60, relay=True)).heating_relay
