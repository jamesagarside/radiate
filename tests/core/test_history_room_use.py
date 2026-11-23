"""Room use and the savings baseline in the tick history (spec 5.8, 5.9)."""

import json

from radiate.core import DAMP_FLOOR_C, BoilerConfig, RoomUse
from radiate.core.history import decode_snapshot, encode_snapshot
from radiate.core.types import RoomInput, Snapshot


def snap(**rooms: RoomInput) -> Snapshot:
    return Snapshot(
        now=100.0,
        minute_of_day=420,
        outdoor=5.0,
        rooms=dict(rooms),
        heating_relay=False,
        store_relay=False,
    )


def test_room_use_and_baseline_round_trip():
    s = snap(
        dining=RoomInput(temperature=18.0, setpoint=19.0, use=RoomUse.IN_USE, baseline_c=19.0),
        lounge=RoomInput(temperature=15.0, setpoint=14.0, use=RoomUse.SETBACK),
        bathroom=RoomInput(temperature=16.0, setpoint=16.0, use=RoomUse.OCCASIONAL),
    )
    s.baseline = True
    data = json.loads(json.dumps(encode_snapshot(s)))
    back = decode_snapshot(data)
    assert back.baseline is True
    assert back.rooms["dining"].use is RoomUse.IN_USE
    assert back.rooms["dining"].baseline_c == 19.0
    assert back.rooms["lounge"].use is RoomUse.SETBACK
    assert back.rooms["lounge"].baseline_c is None
    assert back.rooms["bathroom"].use is RoomUse.OCCASIONAL
    assert back == s


def test_entries_without_room_use_decode_with_the_defaults():
    s = snap(dining=RoomInput(temperature=18.0, setpoint=19.0))
    data = encode_snapshot(s)
    # Recorded before room use existed: none of the new keys.
    assert "baseline" not in data
    assert "use" not in data["rooms"]["dining"]
    assert "baseline_c" not in data["rooms"]["dining"]
    back = decode_snapshot(data)
    assert back.baseline is False
    assert back.rooms["dining"].use is None
    assert back.rooms["dining"].baseline_c is None


def test_damp_floor_is_one_value():
    from radiate.config.household import DAMP_BELOW_C

    assert DAMP_FLOOR_C == 12.0
    assert BoilerConfig().damp_floor_c == DAMP_FLOOR_C
    assert DAMP_BELOW_C == DAMP_FLOOR_C
