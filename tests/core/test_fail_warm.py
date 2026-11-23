"""Fail warm in the core (spec 7): devices and sensors that could lower the heating."""

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
from radiate.core.decide import TRV_IDLE_GRACE_S, TRV_NUDGE_MAX_K
from radiate.core.types import Actions

CFG = HouseConfig(
    rooms=(
        RoomConfig("bed", "Bedroom"),
        RoomConfig("lounge", "Lounge", heat_source=HeatSource.EPISODIC),
        RoomConfig("loo", "Toilet", role=RoomRole.INTERNAL_SENSOR_ONLY),
        RoomConfig("stairs", "Stairs", role=RoomRole.PASSIVE),
    )
)
WARM = {"bed": 20.5, "lounge": 20.5, "loo": 20.0, "stairs": 20.0}


def snap(now: float, temps: dict[str, float], relay: bool, setpoint: float = 20.0) -> Snapshot:
    rooms = {
        rid: RoomInput(
            temperature=None if rid == "loo" else t,
            trv_temperature=t + 1.5 if rid == "loo" else t + 0.5,
            setpoint=setpoint,
            trv_heating=t < setpoint,
        )
        for rid, t in temps.items()
    }
    return Snapshot(now, 12 * 60, 5.0, rooms, heating_relay=relay, store_relay=False)


def run(
    st: EngineState,
    start_min: int,
    minutes: int,
    temps: dict[str, float],
    edit: Callable[[Snapshot], None] = lambda s: None,
    relay: bool = False,
) -> tuple[list[Actions], bool]:
    """Tick once a minute; `edit` changes each snapshot before `decide` sees it."""
    out = []
    for m in range(start_min, start_min + minutes):
        s = snap(m * 60.0, temps, relay)
        edit(s)
        acts = decide(CFG, s, st)
        relay = acts.heating_relay
        out.append(acts)
    return out, relay


def codes(acts: Actions, room: str | None = None) -> set[str]:
    return {a.code for a in acts.alerts if room is None or a.room_id == room}


# --- B: the TRV disagrees with Radiate --------------------------------------------------


def _bed_trv_idle(s: Snapshot) -> None:
    s.rooms["bed"].trv_heating = False


def test_trv_idle_while_calling_and_firing_is_stepped_up_and_alerted():
    st = EngineState.new(CFG)
    cold = {**WARM, "bed": 17.0}
    acts, relay = run(st, 0, 10, cold, _bed_trv_idle)
    assert acts[-1].heating_relay and st.rooms["bed"].calling
    base = acts[-1].valves["bed"].setpoint
    assert base == 20.5  # the usual call: target + 0.6, to a 0.5 K step
    assert "valve.trv_disagrees" not in codes(acts[-1])

    acts, relay = run(st, 10, int(TRV_IDLE_GRACE_S / 60) + 5, cold, _bed_trv_idle, relay)
    assert "valve.trv_disagrees" in codes(acts[-1], "bed")
    assert acts[-1].valves["bed"].setpoint > base

    # It keeps stepping, but never past target + the limit.
    acts, relay = run(st, 40, 120, cold, _bed_trv_idle, relay)
    assert acts[-1].valves["bed"].setpoint == 20.0 + TRV_NUDGE_MAX_K
    assert max(a.valves["bed"].setpoint for a in acts) <= 20.0 + TRV_NUDGE_MAX_K

    # The TRV opens: the alert clears; the raised setpoint holds for the rest of the call.
    acts, relay = run(st, 160, 2, cold, relay=relay)
    assert "valve.trv_disagrees" not in codes(acts[-1])
    assert acts[-1].valves["bed"].setpoint == 20.0 + TRV_NUDGE_MAX_K

    # The room is warm: the call ends and the setpoint goes back to normal.
    acts, relay = run(st, 162, 3, WARM, relay=relay)
    assert not st.rooms["bed"].calling
    assert acts[-1].valves["bed"].setpoint == 20.0


def test_trv_idle_without_heat_flowing_is_not_a_disagreement():
    # While the store recovers, no heat reaches the radiators: idle proves nothing.
    st = EngineState.new(CFG)
    cold = {**WARM, "bed": 17.0}

    def store_recovering(s: Snapshot) -> None:
        _bed_trv_idle(s)
        s.store_relay = True

    acts, _ = run(st, 0, 24, cold, store_recovering)
    assert acts[-1].heating_relay
    assert "valve.trv_disagrees" not in codes(acts[-1])
    assert acts[-1].valves["bed"].setpoint == 20.5


# --- B: an offline TRV with a fresh room sensor still counts --------------------------


def _bed_trv_offline(s: Snapshot) -> None:
    s.rooms["bed"].trv_available = False


def test_offline_trv_room_with_a_fresh_sensor_still_calls():
    st = EngineState.new(CFG)
    cold = {**WARM, "bed": 16.0}
    acts, _ = run(st, 0, 10, cold, _bed_trv_offline)
    assert st.rooms["bed"].calling
    assert acts[-1].heating_relay  # the only cold room fires the boiler
    assert "bed" not in acts[-1].valves  # nothing can be written to it
    assert any(r.code == "room.trv_offline" and r.room_id == "bed" for r in acts[-1].reasons)


def test_offline_trv_room_with_a_stale_sensor_is_left_out():
    st = EngineState.new(CFG)
    cold = {**WARM, "bed": 16.0}

    def stale(s: Snapshot) -> None:
        _bed_trv_offline(s)
        s.rooms["bed"].temperature_age_s = 3600

    acts, _ = run(st, 0, 10, cold, stale)
    assert not st.rooms["bed"].calling
    assert not acts[-1].heating_relay


def test_offline_trv_room_that_does_not_warm_stops_counting():
    # Its valve may be shut where the batteries died: after an hour of heat with no
    # rise, it stops keeping the burner on, with an alert, until the TRV is back.
    st = EngineState.new(CFG)
    cold = {**WARM, "bed": 16.0}
    acts, relay = run(st, 0, 90, cold, _bed_trv_offline)
    assert not st.rooms["bed"].calling
    assert "valve.offline_no_warming" in codes(acts[-1], "bed")
    acts, relay = run(st, 90, 30, cold, _bed_trv_offline, relay)
    assert not acts[-1].heating_relay
    # Back online: it calls again in the usual way.
    acts, relay = run(st, 120, 5, cold, relay=relay)
    assert st.rooms["bed"].calling
    assert "valve.offline_no_warming" not in codes(acts[-1])


# --- C: restart readings ----------------------------------------------------------------


def test_a_remembered_reading_is_used_but_not_learned_from():
    st = EngineState.new(CFG)

    def restored(s: Snapshot) -> None:
        s.rooms["bed"].temperature_restored = True
        s.rooms["lounge"].temperature_restored = True

    run(st, 0, 5, {**WARM, "bed": 19.0, "lounge": 19.0}, restored)
    bed = st.rooms["bed"]
    assert bed.temperature == 19.0 and bed.calling
    assert bed.readings == [] and bed.slope is None
    assert bed.learning_gate == "no_data"
    # The sensors report again, well off the remembered values: that is no step seen
    # in the room, so no window, no fire and nothing learned from it.
    acts, _ = run(st, 5, 20, {**WARM, "bed": 18.0, "lounge": 21.0})
    assert not st.rooms["lounge"].dist.fire
    assert not any(r.code.startswith("disturbance.") for a in acts for r in a.reasons)


def test_a_sensor_silent_since_start_waits_before_the_trv_fallback():
    st = EngineState.new(CFG)

    def missing(since_min: float) -> Callable[[Snapshot], None]:
        def edit(s: Snapshot) -> None:
            s.rooms["bed"].temperature = None
            s.rooms["bed"].sensor_missing_s = since_min * 60 + s.now

        return edit

    run(st, 0, 5, {**WARM, "bed": 18.0}, missing(0))
    bed = st.rooms["bed"]
    assert bed.temperature is None and bed.learning_gate == "no_data"
    assert bed.fallback_until < 0  # no TRV fallback yet
    # Past the stale limit with still nothing: the TRV reading, as for a stale sensor.
    run(st, 5, 2, {**WARM, "bed": 18.0}, missing(20))
    assert st.rooms["bed"].temperature == 18.5 - 1.5
