"""Quiet hours (spec 5.10): a nightly window with no heating but frost protection."""

import dataclasses

from radiate.core import (
    BoilerState,
    EngineState,
    HouseConfig,
    Mode,
    RoomConfig,
    RoomInput,
    RoomRole,
    Snapshot,
    decide,
)
from radiate.core.quiet import clock_text, format_window, quiet_until
from radiate.core.types import StoreConfig

QUIET = (22 * 60 + 30, 6 * 60)  # 22:30-06:00
CFG = HouseConfig(
    rooms=(
        RoomConfig("bed", "Bedroom 1"),
        RoomConfig("loo", "Toilet", role=RoomRole.INTERNAL_SENSOR_ONLY),
        RoomConfig("stairs", "Stairs", role=RoomRole.PASSIVE),
    ),
    quiet_hours=QUIET,
)


def room(t: float, setpoint: float = 20.0, **kw) -> RoomInput:
    return RoomInput(
        temperature=t, trv_temperature=t + 0.5, setpoint=setpoint, trv_heating=t < setpoint, **kw
    )


def snap(now: float, minute: int, rooms: dict, cfg: HouseConfig = CFG, **kw) -> Snapshot:
    return Snapshot(
        now=now,
        minute_of_day=minute,
        outdoor=5.0,
        rooms=rooms,
        heating_relay=kw.pop("relay", False),
        store_relay=False,
        quiet_until_min=quiet_until(cfg.quiet_hours, minute),
        **kw,
    )


def run(
    start_minute: int,
    minutes: int,
    rooms,
    cfg: HouseConfig = CFG,
    st: EngineState | None = None,
    t0: float = 0.0,
):
    """Tick once a minute from `start_minute`; `rooms(minute)` gives the inputs."""
    st = st or EngineState.new(cfg)
    relay, out = False, []
    for i in range(minutes):
        minute = (start_minute + i) % 1440
        acts = decide(cfg, snap(t0 + i * 60.0, minute, rooms(minute), cfg, relay=relay), st)
        relay = acts.heating_relay
        out.append((minute, acts))
    return st, out


def cold(minute: int) -> dict:
    return {"bed": room(16.0), "loo": RoomInput(trv_temperature=17.0, setpoint=20.0)}


# --- the window --------------------------------------------------------------------------


def test_window_crossing_midnight():
    assert quiet_until(QUIET, 22 * 60 + 29) is None
    assert quiet_until(QUIET, 22 * 60 + 30) == 360  # the start is inside
    assert quiet_until(QUIET, 0) == 360
    assert quiet_until(QUIET, 5 * 60 + 59) == 360
    assert quiet_until(QUIET, 6 * 60) is None  # the end is not
    assert quiet_until(QUIET, 12 * 60) is None


def test_window_within_a_day_and_off():
    day = (60, 5 * 60)
    assert quiet_until(day, 0) is None
    assert quiet_until(day, 60) == 300
    assert quiet_until(day, 300) is None
    assert quiet_until(None, 120) is None
    assert quiet_until((300, 300), 300) is None  # empty, never a whole day
    assert quiet_until((23 * 60, 0), 23 * 60 + 30) == 0  # 23:00-24:00
    assert format_window(QUIET) == "22:30-06:00"
    assert format_window(None) is None
    assert clock_text(0) == "00:00"


# --- demand ------------------------------------------------------------------------------


def test_no_room_calls_and_the_boiler_stays_off():
    st, out = run(23 * 60, 30, cold)
    assert all(not a.heating_relay and a.boiler_state is BoilerState.IDLE for _, a in out)
    assert not st.rooms["bed"].calling and not st.rooms["loo"].calling
    reasons = [r for r in out[-1][1].reasons if r.code == "demand.quiet_hours"]
    assert {r.room_id for r in reasons} == {"bed", "loo"}
    bed = next(r for r in reasons if r.room_id == "bed")
    assert (
        bed.message == "Bedroom 1: quiet hours, no heating until 06:00 (frost protection stays on)"
    )
    assert bed.values == {"until_min": 360.0}
    # Held at frost protection: the TRV is told 7 °C, so it keeps its own valve shut.
    assert st.rooms["bed"].target == 7.0
    assert out[-1][1].valves["bed"].setpoint == 7.0


def test_the_same_house_heats_outside_quiet_hours():
    _, out = run(12 * 60, 10, cold)
    assert out[-1][1].heating_relay


def test_a_room_already_warm_says_nothing():
    def warm(minute):
        return {"bed": room(20.5), "loo": RoomInput(trv_temperature=22.0, setpoint=20.0)}

    _, out = run(23 * 60, 5, warm)
    assert not [r for r in out[-1][1].reasons if r.code == "demand.quiet_hours"]


def test_frost_protection_still_heats():
    def freezing(minute):
        return {"bed": room(6.0), "loo": RoomInput(trv_temperature=17.0, setpoint=20.0)}

    st, out = run(2 * 60, 10, freezing)
    assert st.rooms["bed"].calling
    assert out[-1][1].heating_relay and out[-1][1].boiler_state is BoilerState.FIRING
    assert not [
        r for r in out[-1][1].reasons if r.code == "demand.quiet_hours" and r.room_id == "bed"
    ]


def test_a_setpoint_below_frost_protection_is_not_raised():
    def low(minute):
        return {"bed": room(10.0, setpoint=5.0), "loo": RoomInput(trv_temperature=17.0, setpoint=5)}

    st, _ = run(23 * 60, 2, low)
    assert st.rooms["bed"].target == 5.0


def test_an_override_wins():
    def held(minute):
        return {
            "bed": room(16.0, override=True),
            "loo": RoomInput(trv_temperature=17.0, setpoint=20.0),
        }

    st, out = run(1 * 60, 10, held)
    assert st.rooms["bed"].calling and st.rooms["bed"].target == 20.0
    assert not st.rooms["loo"].calling  # no override: still quiet
    assert out[-1][1].heating_relay


def test_off_and_frost_modes_are_unchanged():
    for mode in (Mode.OFF, Mode.FROST):
        st = EngineState.new(CFG)
        decide(CFG, snap(0.0, 60, cold(60), mode=mode), st)
        assert st.rooms["bed"].target == 7.0


def test_a_burn_running_when_quiet_hours_start_finishes_its_minimum_burn():
    st, out = run(22 * 60 + 25, 20, cold)
    acts = dict(out)
    fired_at = next(m for m, a in out if a.boiler_state is BoilerState.FIRING)
    assert fired_at < 22 * 60 + 30
    # The rooms stop calling at 22:30, but the burner keeps its 8 minute minimum burn,
    # with a heat sink open for it.
    for m in range(22 * 60 + 30, fired_at + 8):
        assert acts[m].heating_relay, m
    assert any(r.code == "boiler.dump_room" for r in acts[22 * 60 + 30].reasons)
    assert not st.rooms["bed"].calling
    assert not acts[fired_at + 9].heating_relay
    assert not any(a.heating_relay for m, a in out if m > fired_at + 9)


def test_the_store_is_not_affected():
    cfg = dataclasses.replace(CFG, store=StoreConfig(windows=((5 * 60, 6 * 60 + 30),)))
    _, out = run(5 * 60, 5, cold, cfg)
    assert all(a.store_relay for _, a in out)
    st = EngineState.new(cfg)
    acts = decide(cfg, snap(0.0, 2 * 60, cold(0), cfg, store_boost=True), st)
    assert acts.store_relay


# --- optimum start -----------------------------------------------------------------------


def morning(minute: int) -> dict:
    """Bedroom 1 at 15 °C overnight, 20 °C from 06:30; optimum start wants about 1.75 h."""
    left = (6 * 60 + 30 - minute) % 1440 * 60.0
    nxt = {"next_setpoint": 20.0, "next_setpoint_in_s": left} if left else {}
    sp = 20.0 if 6 * 60 + 30 <= minute < 22 * 60 else 15.0
    return {
        "bed": room(15.0, setpoint=sp, **nxt),
        "loo": RoomInput(trv_temperature=21.0, setpoint=20.0),
    }


def first_preheat(cfg: HouseConfig) -> int | None:
    st = EngineState.new(cfg)
    for i, minute in enumerate(range(3 * 60, 6 * 60 + 30)):
        decide(cfg, snap(i * 60.0, minute, morning(minute), cfg), st)
        if st.rooms["bed"].preheating:
            return minute
    return None


def test_optimum_start_waits_for_the_end_of_quiet_hours():
    without = first_preheat(dataclasses.replace(CFG, quiet_hours=None))
    assert without is not None and without < 6 * 60  # it would start in the night
    assert first_preheat(CFG) == 6 * 60  # at the end, not before


def test_a_warm_up_for_the_end_itself_starts_at_the_end():
    # Window ends at 06:30, the setpoint changes at 06:30: no heating before then.
    cfg = dataclasses.replace(CFG, quiet_hours=(22 * 60 + 30, 6 * 60 + 30))
    assert first_preheat(cfg) is None
    st = EngineState.new(cfg)
    decide(cfg, snap(0.0, 6 * 60 + 30, morning(6 * 60 + 30), cfg), st)
    assert st.rooms["bed"].calling


def test_preheat_held_back_gives_the_quiet_reason():
    st = EngineState.new(CFG)
    acts = decide(CFG, snap(0.0, 5 * 60, morning(5 * 60)), st)
    assert not st.rooms["bed"].preheating
    assert any(r.code == "demand.quiet_hours" and r.room_id == "bed" for r in acts.reasons)


def test_valves_stay_put_through_the_night():
    st, out = run(23 * 60, 7 * 60 - 60, morning)  # 23:00 to 05:00
    writes = {(a.valves["bed"].opening, a.valves["bed"].setpoint) for _, a in out[1:]}
    assert len(writes) == 1
    assert all(a.valves["bed"].pre_opening is None for _, a in out[1:])
