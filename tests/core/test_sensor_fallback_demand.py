"""Demand on the TRV fallback (spec 7): a `normal` room whose own sensor is stale or
implausible takes its temperature from its TRV, which is not trusted to call for heat.
It is held at the damp floor only, never topped up, and a heat sink only as the last
resort for the burner.

The first test replays the reference install's incident: the dining room's sensor went
quiet, its TRV fallback sat at 14.3 °C against a 16 °C target, and the room called with
its valve at 100 % all evening, holding the boiler on."""

from radiate.core import (
    DAMP_FLOOR_C,
    EngineState,
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
        RoomConfig("dining", "Dining room"),
        RoomConfig("loo", "Toilet", role=RoomRole.INTERNAL_SENSOR_ONLY),
        RoomConfig("stairs", "Stairs", role=RoomRole.PASSIVE),
    )
)
STALE_S = 5 * 3600.0  # the sensor last reported five hours ago


def room(t: float, setpoint: float, **kw) -> RoomInput:
    return RoomInput(
        temperature=t, trv_temperature=t + 1.5, setpoint=setpoint, trv_heating=t < setpoint, **kw
    )


def stale(trv_c: float, setpoint: float = 16.0, **kw) -> RoomInput:
    """A dining room whose sensor went quiet: its TRV reads `trv_c`, so the fallback is
    `trv_c` - 1.5 K."""
    return RoomInput(
        temperature=15.8,
        temperature_age_s=STALE_S,
        trv_temperature=trv_c,
        setpoint=setpoint,
        trv_heating=True,
        **kw,
    )


def warm_house(dining: RoomInput, **kw) -> dict[str, RoomInput]:
    return {
        "bed": kw.get("bed", room(20.5, 20.0)),
        "dining": dining,
        "loo": kw.get("loo", RoomInput(trv_temperature=21.0, setpoint=18.0, trv_heating=False)),
        "stairs": RoomInput(temperature=18.0),
    }


def run(rooms_at, minutes: int = 15, cfg: HouseConfig = CFG):
    """Tick once a minute with the relay as commanded. `rooms_at(minute)` gives the
    inputs. Returns the engine state and each tick's actions."""
    st = EngineState.new(cfg)
    relay = False
    out = []
    for m in range(minutes):
        snap = Snapshot(m * 60.0, 17 * 60 + m, 5.0, rooms_at(m), relay, False)
        acts = decide(cfg, snap, st)
        relay = acts.heating_relay
        out.append(acts)
    return st, out


def room_codes(out, rid: str) -> set[str]:
    """Every reason code given for `rid` over the run."""
    return {r.code for a in out for r in a.reasons if r.room_id == rid}


def room_reason(acts, rid: str):
    mine = [r for r in acts.reasons if r.room_id == rid]
    return mine[-1] if mine else None


def test_incident_stale_sensor_room_does_not_call_or_fire_the_boiler():
    # TRV 15.8 °C, so the fallback reads 14.3 °C against a 16 °C target.
    st, out = run(lambda m: warm_house(stale(15.8)))
    rs = st.rooms["dining"]
    assert abs(rs.temperature - 14.3) < 1e-6
    assert not rs.calling and not rs.topup and not rs.extend
    assert rs.target == DAMP_FLOOR_C
    assert not any(a.heating_relay for a in out)
    reason = room_reason(out[-1], "dining")
    assert reason.code == "demand.sensor_stale"
    assert reason.message == "Dining room: no reading from its room sensor, heating only below 12 °C"
    assert reason.values == {"floor_c": DAMP_FLOOR_C}


def test_a_room_calling_when_its_sensor_goes_stale_stops_calling():
    def rooms_at(m: int):
        return warm_house(stale(15.8) if m >= 5 else room(14.3, 16.0))

    st, out = run(rooms_at)
    assert any(a.heating_relay for a in out[:5])  # cold on a fresh sensor: it calls
    assert not st.rooms["dining"].calling
    assert out[-1].valves["dining"].setpoint == DAMP_FLOOR_C


def test_the_trv_fallback_still_holds_the_damp_floor():
    # The fallback reads 10.5 °C: below the damp floor, so the room calls, to 12 °C.
    st, out = run(lambda m: warm_house(stale(12.0)))
    rs = st.rooms["dining"]
    assert rs.calling and rs.target == DAMP_FLOOR_C
    assert out[-1].heating_relay
    # Once its TRV shows it at the floor, it stops.
    st2, _ = run(lambda m: warm_house(stale(12.0 if m < 10 else 13.6)), minutes=12)
    assert not st2.rooms["dining"].calling


def test_a_fresh_sensor_still_heats_to_the_setpoint():
    st, out = run(lambda m: warm_house(room(14.3, 16.0)))
    assert st.rooms["dining"].calling and st.rooms["dining"].target == 16.0
    assert out[-1].heating_relay
    assert "demand.sensor_stale" not in room_codes(out, "dining")


def test_an_override_does_not_lift_the_floor():
    st, out = run(lambda m: warm_house(stale(15.8, setpoint=21.0, override=True)))
    assert not st.rooms["dining"].calling
    assert not any(a.heating_relay for a in out)


def test_no_optimum_start_on_the_trv_fallback():
    dining = stale(15.8, setpoint=14.0, next_setpoint=18.0, next_setpoint_in_s=1800.0)
    st, _ = run(lambda m: warm_house(dining))
    assert not st.rooms["dining"].preheating
    assert not st.rooms["dining"].calling


def test_an_implausible_reading_gets_its_own_wording():
    dining = room(45.0, 16.0)
    dining.trv_temperature = 15.8
    _, out = run(lambda m: warm_house(dining), minutes=3)
    reason = room_reason(out[-1], "dining")
    assert reason.code == "demand.sensor_stale"
    assert reason.message == "Dining room: room sensor reading not trusted, heating only below 12 °C"


def test_internal_sensor_rooms_are_not_affected():
    # The toilet has no room sensor by design: its TRV is its sensor, and it heats to
    # its setpoint as before.
    loo = RoomInput(trv_temperature=14.0, setpoint=18.0, trv_heating=True)
    st, out = run(lambda m: warm_house(room(20.0, 20.0), loo=loo))
    assert st.rooms["loo"].calling and st.rooms["loo"].target == 18.0
    assert "demand.sensor_stale" not in room_codes(out, "loo")


def test_not_a_heat_sink_while_another_room_can_be():
    # The bedroom calls; the open path needs one more radiator. The toilet is warm
    # against its setpoint and can take it; the dining room on its fallback must not.
    loo = RoomInput(trv_temperature=19.0, setpoint=18.0, trv_heating=False)
    st, out = run(lambda m: warm_house(stale(15.8), bed=room(15.0, 20.0), loo=loo))
    assert any(a.heating_relay for a in out)
    assert "boiler.dump_room" in room_codes(out, "loo")
    assert not room_codes(out, "dining") & {"boiler.dump_room", "boiler.fallback_sink"}
    assert not st.rooms["dining"].topup


def test_a_heat_sink_as_the_last_resort():
    # With the toilet's TRV offline, nothing else is left: the burner must not fire
    # into shut valves, so the dining room opens, and says why.
    loo = RoomInput(trv_temperature=19.0, setpoint=18.0, trv_available=False)
    st, out = run(lambda m: warm_house(stale(15.8), bed=room(15.0, 20.0), loo=loo))
    assert any(a.heating_relay for a in out)
    assert "boiler.fallback_sink" in room_codes(out, "dining")
    assert st.rooms["dining"].topup and not st.rooms["dining"].calling
    assert not st.rooms["dining"].extend  # a heat sink never keeps the burner on
