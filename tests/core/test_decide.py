from radiate.core import (
    BoilerState,
    EngineState,
    HeatSource,
    HouseConfig,
    RoomConfig,
    RoomInput,
    RoomRole,
    Snapshot,
    decide,
)

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


def test_stale_room_sensor_falls_back_to_trv():
    st = EngineState.new(CFG)
    temps = {"bed": 18.0, "lounge": 21.0, "loo": 19.0, "stairs": 20.0}
    acts = drive(st, 2, temps, bed={"temperature_age_s": 3600})
    assert acts.valves["bed"].external_temperature is None
    assert abs(st.rooms["bed"].temperature - (18.5 - 1.5)) < 1e-6


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
