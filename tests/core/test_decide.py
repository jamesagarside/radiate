import dataclasses

from radiate.core import (
    BoilerState,
    DemandMode,
    EngineState,
    HeatSource,
    HouseConfig,
    RoomConfig,
    RoomInput,
    RoomRole,
    Snapshot,
    decide,
)
from radiate.core.types import LearningConfig

CFG = HouseConfig(
    rooms=(
        RoomConfig("bed", "Bedroom"),
        RoomConfig("lounge", "Lounge", heat_source=HeatSource.EPISODIC),
        RoomConfig("loo", "Toilet", role=RoomRole.INTERNAL_SENSOR_ONLY),
        RoomConfig("stairs", "Stairs", role=RoomRole.PASSIVE),
    )
)


def snap(now: float, temps: dict[str, float], setpoint: float = 20.0, **kw) -> Snapshot:
    rooms = {
        rid: RoomInput(
            temperature=None if rid == "loo" else t,
            trv_temperature=t + 1.5 if rid == "loo" else t + 0.5,
            setpoint=setpoint,
            trv_heating=t < setpoint,
            **kw.pop(rid, {}),
        )
        for rid, t in temps.items()
    }
    return Snapshot(
        now=now,
        minute_of_day=12 * 60,
        outdoor=5.0,
        rooms=rooms,
        heating_relay=kw.get("relay", False),
        store_relay=False,
    )


def drive(st: EngineState, minutes: int, temps: dict[str, float], **kw):
    acts = None
    relay = False
    for m in range(minutes):
        acts = decide(CFG, snap(m * 60.0, temps, relay=relay, **kw), st)
        relay = acts.heating_relay
    return acts


def test_cold_house_fires_after_lead_and_never_writes_passive_room():
    st = EngineState.new(CFG)
    acts = drive(st, 5, {"bed": 17.0, "lounge": 17.0, "loo": 15.0, "stairs": 17.0})
    assert acts.heating_relay
    assert acts.boiler_state is BoilerState.FIRING
    assert "stairs" not in acts.valves
    assert "stairs" not in st.rooms


def test_unheated_room_is_observed_only():
    # A boot room with no radiator, near freezing: Radiate cannot heat it, so it neither
    # calls nor trips frost protection, and it gets no valve, model or learning.
    cfg = dataclasses.replace(
        CFG, rooms=(*CFG.rooms, RoomConfig("boot", "Boot room", role=RoomRole.UNHEATED))
    )
    st = EngineState.new(cfg)
    relay = False
    temps = {"bed": 20.5, "lounge": 21.0, "loo": 19.0, "stairs": 20.0, "boot": 3.0}
    for m in range(10):
        acts = decide(cfg, snap(m * 60.0, temps, relay=relay), st)
        relay = acts.heating_relay
    assert not acts.heating_relay
    assert "boot" not in acts.valves
    assert "boot" not in st.rooms
    assert not any(r.room_id == "boot" for r in acts.reasons + acts.alerts)


def test_warm_house_does_not_fire():
    st = EngineState.new(CFG)
    acts = drive(st, 10, {"bed": 20.5, "lounge": 21.0, "loo": 19.0, "stairs": 20.0})
    assert not acts.heating_relay


def test_fire_switch_closes_lounge_and_removes_its_demand():
    st = EngineState.new(CFG)
    temps = {"bed": 20.5, "lounge": 17.0, "loo": 19.0, "stairs": 20.0}
    acts = drive(st, 10, temps, lounge={"fire_switch": True})
    assert st.rooms["lounge"].dist.fire
    assert acts.valves["lounge"].opening == 0
    assert not acts.heating_relay  # only the lounge was cold, and it has a fire
    assert st.rooms["lounge"].learning_gate == "fire"


def test_internal_sensor_room_uses_trv_reading_with_bias():
    st = EngineState.new(CFG)
    drive(st, 2, {"bed": 20.5, "lounge": 21.0, "loo": 15.0, "stairs": 20.0})
    # TRV reads 16.5 in the snapshot helper, bias -1.5
    assert abs(st.rooms["loo"].temperature - 15.0) < 1e-6
    assert (
        drive(st, 1, {"bed": 20.5, "lounge": 21.0, "loo": 15.0, "stairs": 20.0})
        .valves["loo"]
        .external_temperature
        is None
    )


def test_setting_the_trv_rejected_pauses_learning_for_an_hour():
    st = EngineState.new(CFG)
    temps = {"bed": 20.5, "lounge": 21.0, "loo": 19.0, "stairs": 20.0}
    rejected = {"trv_rejected": ("valve_opening_degree",)}
    acts = None
    for m in range(5):
        acts = decide(CFG, snap(m * 60.0, temps, bed=dict(rejected)), st)
    assert st.rooms["bed"].learning_gate == "valve_rejected"
    assert st.rooms["bed"].rejected == ("valve_opening_degree",)
    assert st.rooms["lounge"].learning_gate != "valve_rejected"
    # The setting lands at minute 5: still paused for an hour after the last rejection.
    for m in range(5, 64):
        acts = decide(CFG, snap(m * 60.0, temps), st)
    assert st.rooms["bed"].rejected == ()
    assert 63 * 60 < st.rooms["bed"].rejected_until == 4 * 60 + 3600
    for m in range(64, 66):
        acts = decide(CFG, snap(m * 60.0, temps), st)
    assert st.rooms["bed"].learning_gate != "valve_rejected"
    assert acts is not None


def test_stale_room_sensor_falls_back_to_trv():
    st = EngineState.new(CFG)
    temps = {"bed": 18.0, "lounge": 21.0, "loo": 19.0, "stairs": 20.0}
    acts = drive(st, 2, temps, bed={"temperature_age_s": 3600})
    assert acts.valves["bed"].external_temperature is None
    assert abs(st.rooms["bed"].temperature - (18.5 - 1.5)) < 1e-6


def test_stale_room_sensor_pauses_learning():
    # Spec 4.6: the TRV reads its radiator as much as the room, so a room does not
    # learn from it while its own sensor is stale, and for one slope window after.
    st = EngineState.new(CFG)
    for m in range(30):
        decide(CFG, _quiet(m, bed_age_s=3600), st)
    assert st.rooms["bed"].learning_gate == "sensor_stale"
    assert st.rooms["bed"].est.samples == 0
    assert st.rooms["lounge"].learning_gate is None and st.rooms["lounge"].est.samples > 0
    for m in range(30, 44):  # the sensor is back; the slope window still holds TRV values
        decide(CFG, _quiet(m), st)
    assert st.rooms["bed"].learning_gate == "sensor_stale"
    for m in range(44, 46):
        decide(CFG, _quiet(m), st)
    assert st.rooms["bed"].learning_gate is None and st.rooms["bed"].est.samples > 0


def test_learning_on_the_trv_fallback_is_an_option():
    cfg = dataclasses.replace(CFG, learning=LearningConfig(learn_on_trv_fallback=True))
    st = EngineState.new(cfg)
    for m in range(30):
        decide(cfg, _quiet(m, bed_age_s=3600), st)
    assert st.rooms["bed"].learning_gate is None and st.rooms["bed"].est.samples > 0


def _quiet(minute: int, bed_age_s: float = 0.0) -> Snapshot:
    """A steady house at its setpoint that the prior model explains: every gate but
    the sensor's stays open. The bedroom's TRV reads its room + 1.5 K."""
    rooms = {
        rid: RoomInput(
            temperature=None if rid == "loo" else 16.0,
            temperature_age_s=bed_age_s if rid == "bed" else 0.0,
            trv_temperature=17.5,
            setpoint=16.0,
            trv_heating=False,
        )
        for rid in ("bed", "lounge", "loo", "stairs")
    }
    return Snapshot(minute * 60.0, 12 * 60, 5.0, rooms, heating_relay=False, store_relay=False)


def test_safe_mode_when_no_trvs():
    st = EngineState.new(CFG)
    temps = {"bed": 15.0, "lounge": 15.0, "loo": 15.0, "stairs": 15.0}
    off = {"trv_available": False}
    acts = drive(st, 10, temps, bed=dict(off), lounge=dict(off), loo=dict(off), stairs=dict(off))
    assert not acts.heating_relay
    assert acts.safe_mode
    assert any(a.code == "safe_mode.no_trvs" for a in acts.alerts)


def test_not_safe_mode_with_trvs():
    st = EngineState.new(CFG)
    acts = drive(st, 3, {"bed": 17.0, "lounge": 17.0, "loo": 15.0, "stairs": 17.0})
    assert not acts.safe_mode


def test_valve_settings_are_governed_mode():
    st = EngineState.new(CFG)
    acts = drive(st, 5, {"bed": 17.0, "lounge": 17.0, "loo": 15.0, "stairs": 17.0})
    v = acts.valves["bed"]
    assert v.closing == 100  # fully closed when satisfied: safe if Radiate stops
    assert v.setpoint > 20.0  # call bias while Radiate wants heat
    assert v.external_temperature == 17.0


def test_decide_is_deterministic():
    temps = {"bed": 17.0, "lounge": 18.0, "loo": 15.0, "stairs": 17.0}
    a = drive(EngineState.new(CFG), 30, dict(temps))
    b = drive(EngineState.new(CFG), 30, dict(temps))
    assert a == b


def test_warm_up_before_learned_lag_is_not_a_fire():
    # Boiler flowing, lounge TRV calling and rising fast within the first minutes:
    # that is the radiator, not a fire.
    st = EngineState.new(CFG)
    relay = False
    for m in range(40):
        t = 16.0 + max(0, m - 3) * 0.03  # 1.8 K/h once heat arrives
        temps = {"bed": 20.5, "lounge": t, "loo": 19.0, "stairs": 20.0}
        s = snap(m * 60.0, temps, relay=relay)
        acts = decide(CFG, s, st)
        relay = acts.heating_relay
    assert not st.rooms["lounge"].dist.fire


def test_internal_sensor_room_setpoint_is_in_the_trv_frame():
    # The toilet TRV compares its setpoint with its own reading (room - bias), so a
    # call must send target - bias plus the call lead, or the valve stays shut.
    st = EngineState.new(CFG)
    temps = {"bed": 17.0, "lounge": 17.0, "loo": 15.0, "stairs": 17.0}
    acts = drive(st, 5, temps)
    assert acts.boiler_state is BoilerState.FIRING and st.rooms["loo"].calling
    v = acts.valves["loo"]
    assert v.setpoint == 22.5  # 20 + 1.5 + 0.6, rounded up to the TRV's 0.5 K step
    trv_reading = 15.0 + 1.5
    assert trv_reading <= v.setpoint - 0.5  # below the TRV's hysteresis band: it opens


def test_internal_sensor_room_setpoint_when_not_calling():
    st = EngineState.new(CFG)
    acts = drive(st, 3, {"bed": 20.5, "lounge": 21.0, "loo": 20.5, "stairs": 20.0})
    assert not st.rooms["loo"].calling
    assert acts.valves["loo"].setpoint == 21.5  # 20 - (-1.5)


def test_trv_setpoint_is_clamped_to_the_trv_range():
    st = EngineState.new(CFG)
    temps = {"bed": 35.0, "lounge": 35.0, "loo": 35.0, "stairs": 35.0}
    acts = drive(st, 3, temps, setpoint=34.5)
    assert acts.valves["loo"].setpoint == 35.0  # 34.5 + 1.5, clamped


def test_dump_room_setpoint_clears_the_trv_hysteresis():
    # The bedroom calls alone, which is not enough sink, so the lounge (warm, but the
    # coldest non-calling room) is opened as a dump room. Its TRV must be sent at
    # least room temperature + 1 K, rounded up, or its own hysteresis keeps it shut.
    st = EngineState.new(CFG)
    temps = {"bed": 17.0, "lounge": 20.8, "loo": 20.9, "stairs": 17.0}
    acts = drive(st, 5, temps)
    assert acts.boiler_state is BoilerState.FIRING
    assert st.rooms["lounge"].topup and not st.rooms["lounge"].calling
    v = acts.valves["lounge"]
    assert v.setpoint == 22.0  # 20.8 + 1, rounded up to 0.5 K
    assert v.external_temperature <= v.setpoint - 1.0


def test_internal_sensor_dump_room_floor_uses_the_trv_reading():
    # As a dump room, the toilet's floor is its own TRV reading + 1 K.
    cfg = HouseConfig(rooms=(RoomConfig("bed", "Bedroom"), CFG.room("loo")))
    st = EngineState.new(cfg)
    relay = False
    for m in range(5):
        rooms = {
            "bed": RoomInput(temperature=17.0, trv_temperature=17.5, setpoint=20.0),
            "loo": RoomInput(trv_temperature=22.8, setpoint=20.0),  # judged 21.3
        }
        acts = decide(cfg, Snapshot(m * 60.0, 720, 5.0, rooms, relay, False), st)
        relay = acts.heating_relay
    assert st.rooms["loo"].topup
    assert acts.valves["loo"].setpoint == 24.0  # 22.8 + 1, rounded up


def test_internal_sensor_room_confidence_is_capped():
    # Spec 4.6: the toilet learns from a TRV beside its radiator, so its model is
    # never trusted as much as a room with its own sensor.
    st = EngineState.new(CFG)
    for rs in st.rooms.values():
        rs.est.p[0][0] = 0.0
    assert st.rooms["loo"].est.confidence == 0.5
    assert st.rooms["bed"].est.confidence == 1.0


def test_optimum_start_horizon_can_be_set_per_room():
    # A cold room with its next setpoint four hours away: beyond the core's own
    # three-hour horizon, so no preheat unless the input widens it.
    def preheating(**inp) -> bool:
        st = EngineState.new(CFG)
        rooms = {"bed": RoomInput(temperature=8.0, trv_temperature=8.5, setpoint=8.0, **inp)}
        decide(CFG, Snapshot(0.0, 720, 5.0, rooms, False, False), st)
        return st.rooms["bed"].preheating

    later = {"next_setpoint": 20.0, "next_setpoint_in_s": 4 * 3600.0}
    assert not preheating(**later)
    assert preheating(**later, preheat_max_s=6 * 3600.0)
    soon = {"next_setpoint": 20.0, "next_setpoint_in_s": 1800.0}
    assert preheating(**soon)
    assert not preheating(**soon, preheat_max_s=0.0)


# --- demand modes (spec 5.3) ------------------------------------------------------------


def _learned(cfg: HouseConfig = CFG) -> EngineState:
    """Learned gains like the simulated house: the small toilet warms fastest."""
    st = EngineState.new(cfg)
    st.rooms["bed"].est.theta[0] = 3.0
    st.rooms["lounge"].est.theta[0] = 4.0
    st.rooms["loo"].est.theta[0] = 11.0
    return st


def _demand(cfg: HouseConfig, st: EngineState, temps: dict[str, float], minutes: int = 5, **kw):
    relay, acts = False, None
    for m in range(minutes):
        s = snap(m * 60.0, temps, relay=relay, **kw)
        s.demand_mode = kw.get("mode")
        acts = decide(cfg, s, st)
        relay = acts.heating_relay
    return acts


def _with_mode(mode: DemandMode) -> HouseConfig:
    return dataclasses.replace(CFG, boiler=dataclasses.replace(CFG.boiler, demand_mode=mode))


WARM = {"bed": 20.0, "lounge": 20.0, "loo": 20.0, "stairs": 20.0}


def test_eco_is_the_default_demand_mode():
    assert CFG.boiler.demand_mode is DemandMode.ECO and CFG.boiler.eco_limit_k == 1.5


def test_comfort_fires_for_one_cold_toilet():
    cfg = _with_mode(DemandMode.COMFORT)
    acts = _demand(cfg, _learned(cfg), {**WARM, "loo": 18.8})  # 1.2 K below
    assert acts.heating_relay


def test_eco_toilet_alone_waits_until_the_eco_limit():
    st = _learned()
    acts = _demand(CFG, st, {**WARM, "loo": 18.8})
    assert st.rooms["loo"].calling and not acts.heating_relay
    assert acts.boiler_state is BoilerState.IDLE
    # 1.2 K over an 11 K/h gain: about 6.5 minutes of radiator output, under 12.
    assert 6 * 60 < st.pooled_demand_s < 7 * 60
    waiting = [r for r in acts.reasons if r.code == "demand.pooled"]
    assert [r.room_id for r in waiting] == ["loo"]
    acts = _demand(CFG, st, {**WARM, "loo": 18.4})  # 1.6 K below: past the eco limit
    assert acts.heating_relay


def test_eco_fires_when_rooms_pool_their_demand():
    st = _learned()
    # The toilet (6.5 min) and the bedroom 0.5 K below (10 min) together pass 12 min.
    acts = _demand(CFG, st, {**WARM, "loo": 18.8, "bed": 19.5})
    assert acts.heating_relay
    assert not any(r.code == "demand.pooled" for r in acts.reasons)


def test_eco_still_fires_for_frost():
    st = _learned()
    acts = _demand(CFG, st, {**WARM, "bed": 6.5}, setpoint=7.0)
    assert acts.heating_relay


def test_runtime_demand_mode_overrides_the_configuration():
    acts = _demand(CFG, _learned(), {**WARM, "loo": 18.8}, mode=DemandMode.COMFORT)
    assert acts.heating_relay
    eco = _with_mode(DemandMode.COMFORT)
    acts = _demand(eco, _learned(eco), {**WARM, "loo": 18.8}, mode=DemandMode.ECO)
    assert not acts.heating_relay
