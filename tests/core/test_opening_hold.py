"""Write discipline with the opening hold (spec 4.5): a valve steps down at most once per
hold while its room keeps wanting heat."""

from radiate.core import EngineState, HouseConfig, RoomConfig, ValveAction
from radiate.core.decide import (
    BIG_OPENING_STEP,
    OPENING_HOLD_S,
    OPENING_WRITE_INTERVAL_S,
    _discipline,
)

CFG = HouseConfig(rooms=(RoomConfig("bed", "Bedroom 1"),))
MIN = 60.0


def fresh():
    rs = EngineState.new(CFG).rooms["bed"]
    _discipline(rs, ValveAction("bed", 20.0, 100), 0.0, restart=True)
    return rs


def write(rs, opening: int, at: float, restart: bool = False) -> int:
    return _discipline(rs, ValveAction("bed", 20.0, opening), at, restart=restart).opening


def test_a_warming_room_steps_down_once_per_hold():
    # What the owner saw: 100, then 66 at 26 min, 45 at 34 min. Now 100 holds.
    rs = fresh()
    assert write(rs, 66, 26 * MIN) == 100
    assert write(rs, 45, 34 * MIN) == 100
    assert write(rs, 45, OPENING_HOLD_S) == 45
    assert write(rs, 30, OPENING_HOLD_S + 10 * MIN) == 45
    assert write(rs, 30, 2 * OPENING_HOLD_S) == 30


def test_opening_further_is_not_held():
    rs = fresh()
    assert write(rs, 50, OPENING_HOLD_S) == 50
    # A big rise goes at once; a small one waits the ordinary 10 minutes.
    assert write(rs, 50 + BIG_OPENING_STEP, OPENING_HOLD_S + MIN) == 50 + BIG_OPENING_STEP
    assert write(rs, 70, OPENING_HOLD_S + 2 * MIN) == 65
    assert write(rs, 70, OPENING_HOLD_S + MIN + OPENING_WRITE_INTERVAL_S) == 70


def test_starting_or_stopping_a_call_and_closing_are_written_at_once():
    rs = fresh()
    assert write(rs, 40, 5 * MIN, restart=True) == 40  # the call ended: lockshield cap
    rs = fresh()
    assert write(rs, 0, MIN) == 0  # a fire closes the valve at once


def test_small_changes_are_still_skipped():
    rs = fresh()
    assert write(rs, 98, 2 * OPENING_HOLD_S) == 100
