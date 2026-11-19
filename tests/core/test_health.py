"""Failure detection in the core (spec 7): no heat, short-cycling, stuck valves."""

from collections.abc import Callable

from radiate.core import (
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
        RoomConfig("dining", "Dining room"),
        RoomConfig("kitchen", "Kitchen", heat_source=HeatSource.CONTINUOUS),
        RoomConfig("stairs", "Stairs", role=RoomRole.PASSIVE),
    )
)
ROOMS = ("bed", "dining", "kitchen", "stairs")

# Temperatures by minute: room and TRV readings for every room.
Temps = Callable[[int], dict[str, tuple[float, float]]]


def cold(_m: int) -> dict[str, tuple[float, float]]:
    """No heat reaches anything: rooms drift down slowly, TRVs stay cold."""
    return {rid: (17.0 - 0.002 * _m, 17.5) for rid in ROOMS}


def run(
    temps: Temps,
    minutes: int,
    store_on: Callable[[int], bool] = lambda m: False,
    trv_heating: bool | None = None,
):
    st = EngineState.new(CFG)
    relay = False
    history = []
    for m in range(minutes):
        readings = temps(m)
        rooms = {
            rid: RoomInput(
                temperature=readings[rid][0],
                trv_temperature=readings[rid][1],
                setpoint=20.0,
                trv_heating=readings[rid][0] < 20.0 if trv_heating is None else trv_heating,
            )
            for rid in ROOMS
        }
        snap = Snapshot(
            now=m * 60.0,
            minute_of_day=12 * 60,
            outdoor=5.0,
            rooms=rooms,
            heating_relay=relay,
            store_relay=store_on(m),
        )
        acts = decide(CFG, snap, st)
        relay = acts.heating_relay
        history.append(acts)
    return st, history


def no_heat(acts) -> bool:
    return any(a.code == "boiler.no_heat" for a in acts.alerts)


def test_no_heat_after_30_minutes_of_flow_keeps_calling_and_stops_learning():
    st, hist = run(cold, 45)
    # Relay goes on at minute 2 (after the valve lead); nothing for 30 min after that.
    assert not any(no_heat(a) for a in hist[:30])
    assert no_heat(hist[-1])
    assert hist[-1].heating_relay  # keep calling: the boiler may recover
    assert st.rooms["bed"].learning_gate == "no_heat"
    msg = next(a.message for a in hist[-1].alerts if a.code == "boiler.no_heat")
    assert msg == "No heat: check oil and boiler lockout"


def test_no_alert_while_every_valve_is_shut():
    # TRVs satisfied by their own thermostat: radiators cannot show heat either way.
    _, hist = run(cold, 60, trv_heating=False)
    assert not any(no_heat(a) for a in hist)


def test_trv_rise_means_heat_is_arriving():
    def warming(m):
        t = cold(m)
        t["dining"] = (17.0, 17.5 + max(0, m - 12) * 0.2)  # radiator warms after 10 min
        return t

    _, hist = run(warming, 60)
    assert not any(no_heat(a) for a in hist)


def test_stairs_rise_means_heat_is_arriving():
    def stairs(m):
        t = cold(m)
        t["stairs"] = (17.0 + max(0, m - 5) * 0.02, 17.5)
        return t

    _, hist = run(stairs, 60)
    assert not any(no_heat(a) for a in hist)


def test_aga_warming_the_kitchen_is_not_heat_from_the_boiler():
    def aga(m):
        t = cold(m)
        t["kitchen"] = (17.0 + m * 0.02, 17.5)  # range cooker, valve irrelevant
        return t

    _, hist = run(aga, 45)
    assert no_heat(hist[-1])


def test_heat_returning_clears_the_alert():
    def recovers(m):
        t = cold(m)
        if m >= 50:
            t["bed"] = (17.0, 17.5 + (m - 50) * 0.3)
        return t

    st, hist = run(recovers, 60)
    assert no_heat(hist[45])
    assert not no_heat(hist[-1])
    assert st.rooms["bed"].learning_gate != "no_heat"


def test_store_recovery_does_not_count_as_no_heat():
    # Hot-water priority: the radiators get nothing for the 25 min recovery.
    # The store turns on at minute 1, so radiators only get flow from minute 26.
    _, hist = run(cold, 70, store_on=lambda m: m >= 1)
    assert not any(no_heat(a) for a in hist[:55])
    assert no_heat(hist[-1])
