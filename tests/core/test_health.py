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
from radiate.core.health import ValveCheck

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
    on_since = None
    raised_at = None
    cuts = []
    for m in range(0, 150):
        cmd = step(st, m, cold, relay).heating_relay
        if raised_at is None and st.short_cycle.extra_off_s > 0:
            raised_at = m
        # Radiate keeps calling, but the relay drops out 3 minutes into every burn.
        on_since = (on_since if on_since is not None else m) if cmd else None
        was = relay
        relay = cmd and m - on_since < 3
        if was and not relay:
            cuts.append(m + 1)  # Radiate sees the drop on its next tick
    # The guard takes each drop as a stop and rests for minimum off before firing again,
    # so the cuts are about 15 min apart. Raised at the first cut an hour after the first.
    assert all(b - a >= 10 for a, b in zip(cuts, cuts[1:], strict=False))
    assert raised_at == next(c for c in cuts if c - cuts[0] >= 60)


# --- stuck valves -----------------------------------------------------------------------

CYCLE = 90  # minutes: 60 calling for heat, then 30 satisfied (burn ends, rest)


def burns(stuck: set[str], healthy_from: int = 10**6) -> Temps:
    """Repeated burns. Rooms in `stuck` never see their TRV warm (until `healthy_from`)."""

    def temps(m: int) -> dict[str, tuple[float, float]]:
        c = m % CYCLE
        if c >= 60:
            return warm(m)
        out = {}
        for rid in ROOMS:
            rising = rid not in stuck or m >= healthy_from
            trv = 17.5 + (max(0, c - 8) * 0.1 if rising else 0.0)
            out[rid] = (17.0, trv)
        return out

    return temps


def drive_burns(temps: Temps, cycles: float, start: int = 0, st=None):
    st = st or EngineState.new(CFG)
    relay = False
    acts = None
    for m in range(start, start + int(cycles * CYCLE)):
        acts = step(st, m, temps, relay)
        relay = acts.heating_relay
    return st, acts


def stuck_alerts(acts) -> set[str]:
    return {a.room_id for a in acts.alerts if a.code == "valve.stuck"}


def test_valve_that_never_warms_over_three_burns_is_flagged():
    temps = burns({"bed"})
    st, acts = drive_burns(temps, 2)
    assert stuck_alerts(acts) == set()
    assert st.rooms["bed"].valve.misses == 2
    st, acts = drive_burns(temps, 1, start=2 * CYCLE, st=st)
    assert stuck_alerts(acts) == {"bed"}
    msg = next(a.message for a in acts.alerts if a.code == "valve.stuck")
    assert msg == "Bedroom radiator not warming: check the valve"
    assert st.rooms["bed"].valve.untrusted and not st.rooms["dining"].valve.untrusted
    # Untrusted: learning paused for that room only.
    st, acts = drive_burns(temps, 0.5, start=3 * CYCLE, st=st)
    assert st.rooms["bed"].learning_gate == "valve_untrusted"
    assert st.rooms["dining"].learning_gate != "valve_untrusted"


def test_flag_clears_when_the_radiator_warms_again():
    st, _ = drive_burns(burns({"bed"}), 3)
    assert st.rooms["bed"].valve.untrusted
    st, acts = drive_burns(burns({"bed"}, healthy_from=0), 1, start=3 * CYCLE, st=st)
    assert not st.rooms["bed"].valve.untrusted and st.rooms["bed"].valve.misses == 0
    assert stuck_alerts(acts) == set()


def leak_burns(leaking: bool) -> Temps:
    """Dining and kitchen call for an hour each cycle (two open radiators, so no heat
    sink is needed); the bedroom is warm and its valve shut.

    With `leaking`, the bedroom TRV warms during the burn although it is not heating.
    """

    def temps(m: int) -> dict[str, tuple[float, float]]:
        c = m % CYCLE
        if c >= 60:
            return warm(m)
        out = warm(m)
        out["dining"] = out["kitchen"] = (17.0, 17.5)
        rise = max(0, c - 25) * 0.05 if leaking else 0.0
        out["bed"] = (21.0, 21.5 + rise)
        return out

    return temps


def leak_alerts(acts) -> set[str]:
    return {a.room_id for a in acts.alerts if a.code == "valve.leaking"}


def test_radiator_warming_with_its_valve_shut_is_flagged_after_two_burns():
    st, acts = drive_burns(leak_burns(True), 1.05)
    assert st.rooms["bed"].valve.leak_history == [True] and leak_alerts(acts) == set()
    st, acts = drive_burns(leak_burns(True), 1, start=int(1.05 * CYCLE), st=st)
    assert leak_alerts(acts) == {"bed"}
    msg = next(a.message for a in acts.alerts if a.code == "valve.leaking")
    assert msg == "Bedroom radiator warming with its valve shut: check the valve"
    # The calling room's valve is open, so it is never judged.
    assert st.rooms["dining"].valve.leak_history == []
    assert st.rooms["bed"].learning_gate == "valve_leaking"


def test_shut_valve_that_stays_cool_is_not_flagged_and_clears_a_flag():
    st, acts = drive_burns(leak_burns(False), 3)
    assert st.rooms["bed"].valve.leak_history == [False, False, False]
    assert leak_alerts(acts) == set()
    st, _ = drive_burns(leak_burns(True), 2, start=3 * CYCLE, st=st)
    assert st.rooms["bed"].valve.leaking
    # Fixed (recalibrated): five cool burns in a row clear it, not fewer.
    st, _ = drive_burns(leak_burns(False), 4, start=5 * CYCLE, st=st)
    assert st.rooms["bed"].valve.leaking
    st, acts = drive_burns(leak_burns(False), 1, start=9 * CYCLE, st=st)
    assert not st.rooms["bed"].valve.leaking and leak_alerts(acts) == set()


def test_valve_check_window_needs_two_warm_burns_out_of_five():
    v = ValveCheck()

    def burn(rise: float, minutes: int = 40) -> bool:
        newly = False
        for i in range(minutes):
            offset = 1.0 + rise * i / (minutes - 1)
            newly |= v.observe_shut(60.0, flowing=True, shut=True, offset=offset)
        return v.observe_shut(60.0, flowing=False, shut=True, offset=None) or newly

    assert not burn(1.2)  # one warm burn
    assert not burn(0.7)  # in between: no verdict
    assert not burn(0.1) and not burn(0.1)
    assert burn(1.2) and v.leaking  # two warm burns within the last five
    assert v.leak_history == [True, False, False, True]


def test_no_stuck_valve_verdict_when_no_radiator_warms():
    # Nothing warms anywhere: that is the no-heat check's job, not a stuck valve.
    st, acts = drive_burns(burns(set(ROOMS)), 3)
    assert all(rs.valve.misses == 0 for rs in st.rooms.values())
    assert stuck_alerts(acts) == set()
