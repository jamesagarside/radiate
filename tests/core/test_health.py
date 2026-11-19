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


# --- short-cycling ----------------------------------------------------------------------


def warm(_m: int) -> dict[str, tuple[float, float]]:
    return {rid: (21.0, 21.5) for rid in ROOMS}


def step(st, m: int, temps: Temps, relay: bool):
    readings = temps(m)
    rooms = {
        rid: RoomInput(temperature=t, trv_temperature=trv, setpoint=20.0, trv_heating=t < 20.0)
        for rid, (t, trv) in readings.items()
    }
    snap = Snapshot(m * 60.0, 12 * 60, 5.0, rooms, heating_relay=relay, store_relay=False)
    return decide(CFG, snap, st)


def short_cycling(acts) -> bool:
    return any(a.code == "boiler.short_cycle" for a in acts.alerts)


def toggle_externally(st, start: int, starts: int, minutes: int = 60):
    """Something other than Radiate switches the relay on `starts` times in an hour."""
    acts = None
    period = minutes // starts
    for m in range(start, start + minutes):
        acts = step(st, m, warm, relay=(m - start) % period < 3)
    return acts


def test_more_than_four_starts_an_hour_raises_minimum_off_for_a_day():
    st = EngineState.new(CFG)
    acts = toggle_externally(st, 0, 4)
    assert not short_cycling(acts) and st.short_cycle.extra_off_s == 0
    acts = toggle_externally(st, 60, 6)
    assert short_cycling(acts)
    assert st.short_cycle.extra_off_s == 5 * 60
    msg = next(a.message for a in acts.alerts if a.code == "boiler.short_cycle")
    assert msg == "Boiler short-cycling: minimum off raised to 15 min"
    # Still short-cycling an hour later: another 5 minutes.
    acts = toggle_externally(st, 120, 6)
    assert st.short_cycle.extra_off_s == 10 * 60
    # Quiet for 24 hours: back to normal.
    for m in range(180, 180 + 24 * 60 + 5, 5):
        acts = step(st, m, warm, relay=False)
    assert st.short_cycle.extra_off_s == 0 and not short_cycling(acts)


def test_raised_minimum_off_is_capped_at_30_minutes():
    st = EngineState.new(CFG)
    for hour in range(1, 8):
        toggle_externally(st, hour * 60, 6)
    assert st.short_cycle.extra_off_s == 20 * 60  # 10 min default + 20 = 30 min


def test_guard_uses_the_raised_minimum_off():
    st = EngineState.new(CFG)
    toggle_externally(st, 0, 6)
    assert st.short_cycle.extra_off_s == 5 * 60
    # Now the house needs heat. Radiate fires, burns, rests: rest must last 15 min.
    relay = False
    m = 60
    while not relay:
        relay = step(st, m, cold, relay).heating_relay
        m += 1
    while relay:
        hot = {rid: (21.0, 22.0) for rid in ROOMS}
        relay = step(st, m, lambda _m, h=hot: h, relay).heating_relay
        m += 1
    stopped = m
    while not relay:
        relay = step(st, m, cold, relay).heating_relay
        m += 1
    # Rest of 15 min, then the 90 s valve lead.
    assert m - stopped >= 15 + 1


def test_burns_cut_short_by_something_else_for_two_hours():
    st = EngineState.new(CFG)
    relay = False
    raised_at = None
    for m in range(0, 150):
        cmd = step(st, m, cold, relay).heating_relay
        # Radiate keeps calling, but the relay only stays in for 3 minutes in every 50.
        relay = cmd and m % 50 < 3
        if raised_at is None and st.short_cycle.extra_off_s > 0:
            raised_at = m
    # The relay drops out at minutes 4, 54 and 104: an hour apart only at the third.
    assert raised_at == 104
