"""A room's own quiet hours (spec 5.10): no heat, no heat sink, and a valve that stays still."""

import dataclasses

from radiate.core import (
    EngineState,
    HouseConfig,
    RoomConfig,
    RoomInput,
    RoomRole,
    Snapshot,
    decide,
)
from radiate.core.quiet import apply_quiet, quiet_until_any

BED_QUIET = (23 * 60, 8 * 60)  # 23:00-08:00
CFG = HouseConfig(
    rooms=(
        RoomConfig("bed", "Bedroom 1", quiet_hours=BED_QUIET),
        RoomConfig("dining", "Dining room"),
        RoomConfig("lounge", "Lounge"),
        RoomConfig("stairs", "Stairs", role=RoomRole.PASSIVE),
    )
)


def room(t: float, setpoint: float, **kw) -> RoomInput:
    return RoomInput(
        temperature=t, trv_temperature=t + 0.5, setpoint=setpoint, trv_heating=t < setpoint, **kw
    )


def bed(minute: int, t: float = 16.0, **kw) -> RoomInput:
    """16 °C overnight, 18 °C from 08:00 to 22:00."""
    day = 8 * 60 <= minute < 22 * 60
    left = (8 * 60 - minute) % 1440 * 60.0
    nxt = {} if day else {"next_setpoint": 18.0, "next_setpoint_in_s": left}
    return room(t, 18.0 if day else 16.0, **nxt, **kw)


def house(minute: int, **bed_kw) -> dict:
    """The dining room calls all night; the lounge is warm and can take heat."""
    return {
        "bed": bed(minute, **bed_kw),
        "dining": room(15.0, 20.0),
        "lounge": room(20.5, 20.0),
        "stairs": RoomInput(temperature=18.0),
    }


def run(start: int, minutes: int, rooms, cfg: HouseConfig = CFG):
    st = EngineState.new(cfg)
    relay, out = False, []
    for i in range(minutes):
        minute = (start + i) % 1440
        snap = Snapshot(i * 60.0, minute, 5.0, rooms(minute), relay, False)
        apply_quiet(cfg, snap)
        acts = decide(cfg, snap, st)
        relay = acts.heating_relay
        out.append((minute, acts, st.rooms["bed"].topup, st.rooms["bed"].calling))
    return st, out


def test_windows_together():
    house_q, room_q = (22 * 60 + 30, 6 * 60), BED_QUIET
    assert quiet_until_any((house_q, room_q), 5 * 60) == 8 * 60  # overlapping: one window
    assert quiet_until_any((house_q, room_q), 22 * 60 + 45) == 8 * 60
    assert quiet_until_any((None, room_q), 12 * 60) is None
    assert quiet_until_any(((60, 120), (180, 240)), 90) == 120
    assert quiet_until_any(((0, 720), (720, 0)), 100) == 720  # all day: stays quiet


def test_apply_quiet_fills_the_house_and_each_room():
    cfg = dataclasses.replace(CFG, quiet_hours=(22 * 60 + 30, 6 * 60))
    snap = Snapshot(0.0, 6 * 60 + 30, 5.0, house(6 * 60 + 30), False, False)
    apply_quiet(cfg, snap)
    assert snap.quiet_until_min is None  # the house window ended at 06:00
    assert snap.rooms["bed"].quiet_until_min == 8 * 60
    assert snap.rooms["dining"].quiet_until_min is None
    assert snap.rooms["stairs"].quiet_until_min is None  # passive: not controlled


def test_the_quiet_room_waits_while_the_rest_of_the_house_heats():
    st, out = run(6 * 60, 60, house)
    assert out[-1][1].heating_relay  # the dining room heats
    assert not any(calling for *_, calling in out)
    assert not st.rooms["bed"].preheating
    reason = next(r for r in out[-1][1].reasons if r.room_id == "bed")
    assert reason.code == "demand.quiet_hours"
    assert "until 08:00" in reason.message


def test_optimum_start_never_starts_before_the_room_window_ends():
    st, out = run(4 * 60, 4 * 60 + 5, house)  # 04:00 to 08:04
    assert all(not calling for m, *_, calling in out if m < 8 * 60)
    assert dict((m, c) for m, *_, c in out)[8 * 60]  # 16 °C against 18 °C: calls at 08:00
    without = dataclasses.replace(CFG, rooms=(RoomConfig("bed", "Bedroom 1"), *CFG.rooms[1:]))
    st2 = EngineState.new(without)
    for i, m in enumerate(range(4 * 60, 8 * 60)):
        snap = Snapshot(i * 60.0, m, 5.0, house(m), False, False)
        decide(without, snap, st2)
        if st2.rooms["bed"].preheating:
            break
    assert st2.rooms["bed"].preheating  # without the window it would warm up early


def test_never_a_heat_sink_while_another_room_can_be():
    # Bedroom 1 is the coldest against its target, so it would be the first heat sink.
    st, out = run(2 * 60, 20, lambda m: house(m, t=12.0))
    acts = out[-1][1]
    assert acts.heating_relay
    assert st.rooms["lounge"].topup
    assert not any(topup for *_, topup, _ in out)
    assert not any(r.room_id == "bed" and r.code.startswith("boiler.") for r in acts.reasons)


def test_the_last_heat_sink_left_opens_even_in_quiet_hours():
    # Only Bedroom 1 can take the dining room's heat: the burner must not fire into
    # shut valves, so the open-path guarantee wins.
    cfg = dataclasses.replace(CFG, rooms=tuple(r for r in CFG.rooms if r.id != "lounge"))

    def rooms(m):
        r = house(m)
        del r["lounge"]
        return r

    st, out = run(2 * 60, 20, rooms, cfg)
    assert out[-1][1].heating_relay and st.rooms["bed"].topup
    assert any(
        r.code == "boiler.quiet_sink" and r.room_id == "bed" for _, a, *_ in out for r in a.reasons
    )


def test_the_valve_is_written_once_at_the_start_and_once_at_the_end():
    _, out = run(22 * 60, 10 * 60 + 30, house)  # 22:00 to 08:30, burns all night
    settings = {m: (a.valves["bed"].opening, a.valves["bed"].setpoint) for m, a, *_ in out}
    night = {settings[m] for m in list(range(23 * 60, 1440)) + list(range(0, 8 * 60))}
    assert len(night) == 1
    assert night.pop()[1] == 7.0  # held at frost protection
    assert settings[22 * 60 + 59] != settings[23 * 60]  # written as the window starts
    assert settings[8 * 60] != settings[7 * 60 + 59]  # and as it ends


def test_frost_protection_and_an_override_still_heat():
    st, _ = run(3 * 60, 10, lambda m: house(m, t=6.0))
    assert st.rooms["bed"].calling

    def held(m):
        r = house(m)
        r["bed"] = room(16.0, 20.0, override=True)  # someone set 20 °C at 03:00
        return r

    st, _ = run(3 * 60, 10, held)
    assert st.rooms["bed"].calling and st.rooms["bed"].target == 20.0
    assert not st.rooms["bed"].quiet
