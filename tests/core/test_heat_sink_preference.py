"""Preferred heat sinks (spec 5.4): rooms the house wants opened first for a burn's heat,
one list for the house's quiet hours and one for other times."""

import dataclasses

from radiate.core import EngineState, HouseConfig, RoomConfig, RoomInput, RoomRole, Snapshot
from radiate.core import decide as run_decide
from radiate.core.quiet import apply_quiet

CFG = HouseConfig(
    rooms=(
        RoomConfig("bedroom_1", "Bedroom 1", quiet_hours=(23 * 60, 8 * 60)),
        RoomConfig("bedroom_3", "Bedroom 3"),
        RoomConfig("dining", "Dining room"),
        RoomConfig("lounge", "Lounge"),
        RoomConfig("kitchen", "Kitchen"),
        RoomConfig("stairs", "Stairs", role=RoomRole.PASSIVE),
    ),
    quiet_hours=(22 * 60 + 30, 6 * 60),
    heat_sinks=("bedroom_3",),
    heat_sinks_quiet=("dining",),
)


def room(t: float, setpoint: float) -> RoomInput:
    return RoomInput(
        temperature=t, trv_temperature=t + 0.5, setpoint=setpoint, trv_heating=t < setpoint
    )


def rooms(caller: str, coolest: str = "lounge") -> dict:
    """One room calls; the others are warm. `coolest` is the coldest of them against its
    target, so without a preference it would be the first heat sink."""
    out = {rid: room(20.9, 20.0) for rid in ("bedroom_1", "bedroom_3", "dining", "lounge")}
    out["kitchen"] = room(20.9, 20.0)
    out[coolest] = room(20.1, 20.0)
    out["stairs"] = RoomInput(temperature=18.0)
    out[caller] = room(15.0, 20.0)
    return out


def sinks(
    cfg: HouseConfig, minute: int, caller: str, override: bool = False, coolest: str = "lounge"
) -> list[str]:
    """Rooms opened as heat sinks, in the order they were chosen, once the burner fires."""
    st = EngineState.new(cfg)
    relay = False
    for i in range(10):
        inputs = rooms(caller, coolest)
        inputs[caller].override = override  # so it calls inside quiet hours too
        snap = Snapshot(i * 60.0, minute, 5.0, inputs, relay, False)
        apply_quiet(cfg, snap)
        acts = run_decide(cfg, snap, st)
        relay = acts.heating_relay
        chosen = [
            r.room_id for r in acts.reasons if r.code in ("boiler.dump_room", "boiler.quiet_sink")
        ]
        if chosen:
            return chosen
    return []


def test_outside_quiet_hours_the_office_goes_first():
    assert sinks(CFG, 12 * 60, "kitchen") == ["bedroom_3"]
    # Without a preference: the coldest against its target.
    plain = dataclasses.replace(CFG, heat_sinks=())
    assert sinks(plain, 12 * 60, "kitchen") == ["lounge"]


def test_in_quiet_hours_the_dining_room_goes_first_and_bedroom_1_last():
    # 02:00: every room is quiet, so the quiet list orders them, and a room with quiet
    # hours of its own comes after every other room.
    assert sinks(CFG, 2 * 60, "kitchen", override=True) == ["dining"]
    # Bedroom 1 is the coolest, but it has its own quiet hours: the lounge goes first.
    no_list = dataclasses.replace(CFG, heat_sinks_quiet=())
    assert sinks(no_list, 2 * 60, "kitchen", override=True, coolest="bedroom_1") != ["bedroom_1"]


def test_a_preferred_room_in_its_own_quiet_hours_still_waits():
    # 07:00: the house window has ended, Bedroom 1's has not. Prefer it all the same:
    # rooms outside quiet hours are still opened first.
    cfg = dataclasses.replace(CFG, heat_sinks=("bedroom_1", "bedroom_3"))
    assert sinks(cfg, 7 * 60, "kitchen") == ["bedroom_3"]


def test_the_preference_does_not_weaken_the_open_path():
    # A preferred room that is calling already counts as open; the next room is chosen.
    cfg = dataclasses.replace(CFG, heat_sinks=("kitchen", "bedroom_3"))
    assert sinks(cfg, 12 * 60, "kitchen") == ["bedroom_3"]
