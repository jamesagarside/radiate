"""Tick history: encoding, comparison, replay and the summary (spec 4.3, 6)."""

import json

import pytest

from radiate.core import EngineState, decide
from radiate.core.history import (
    CHECKPOINT,
    START,
    TICK,
    Entry,
    Replayer,
    Tally,
    checkpoint_data,
    compact_actions,
    decode_snapshot,
    diff_actions,
    encode_snapshot,
    start_data,
    tick_data,
)
from radiate.core.persist import dump_state, load_state
from radiate.core.types import Actions, BoilerState, Mode, Reason, RoomInput, Snapshot, ValveAction
from radiate.sim.reference import build_house, house_config
from radiate.sim.runner import STEP_S, Disturbances, _apply, _apply_disturbances, _snapshot

WALL0 = 1_800_000_000.0


def sim_entries(
    cfg, minutes, *, offset=0.0, wall0=WALL0, segment=1, checkpoint_at=None, restart_at=None
):
    """A recorded run of the simulated house: a start entry from priors, then ticks.
    `offset` shifts the monotonic clock, as a separate process would. `restart_at`:
    after that many ticks the controller restarts, as the runtime does: state saved,
    a new clock, state loaded, a new start entry."""
    house = build_house(7, start_temp=16.5)
    house.now = 5.5 * 3600
    dist, dstate = Disturbances(fire_days=frozenset(range(365))), {}
    reports = {rid: (r.reported_t, house.now) for rid, r in house.rooms.items()}
    st = EngineState.new(cfg)
    entries = [Entry(START, wall0, segment, start_data(house.now + offset, None, 0.0))]
    for i in range(minutes):
        for _ in range(int(60 / STEP_S)):
            minute = int((house.now % 86400) // 60)
            house.step(STEP_S, _apply_disturbances(house, dist, 0, minute, dstate))
            for rid, room in house.rooms.items():
                if room.reported_t != reports[rid][0] or house.now - reports[rid][1] >= 600:
                    reports[rid] = (room.reported_t, house.now)
        if restart_at is not None and i == restart_at:
            last, offset, segment = house.now + offset, offset - 7777.25, segment + 1
            saved = json.loads(json.dumps(dump_state(st, last)))
            st, _ = load_state(cfg, saved, house.now + offset)
            entries.append(
                Entry(START, wall0 + i * 60, segment, start_data(house.now + offset, saved, 0.0))
            )
        snap = _snapshot(house, reports, int((house.now % 86400) // 60))
        snap.now += offset
        actions = decide(cfg, snap, st)
        _apply(house, actions)
        wall = wall0 + (i + 1) * 60
        # Through JSON, as the database stores it.
        data = json.loads(json.dumps(tick_data(snap, compact_actions(actions))))
        entries.append(Entry(TICK, wall, segment, data))
        if checkpoint_at is not None and i + 1 == checkpoint_at:
            ckpt = json.loads(json.dumps(checkpoint_data(st, snap.now)))
            entries.append(Entry(CHECKPOINT, wall, segment, ckpt))
    return entries, st


@pytest.fixture(scope="module")
def run():
    cfg = house_config()
    entries, st = sim_entries(cfg, 240, offset=1234.567, checkpoint_at=120)
    return cfg, entries, st


def test_snapshot_round_trip_through_json():
    snap = Snapshot(
        now=12345.678901234,
        minute_of_day=431,
        outdoor=None,
        rooms={
            "a": RoomInput(temperature=19.25, temperature_age_s=359.99823, humidity=55),
            "b": RoomInput(trv_available=False, window_open=True, next_setpoint=20.5),
        },
        heating_relay=True,
        store_relay=False,
        mode=Mode.FROST,
        store_boost=True,
        day=740000,
    )
    data = json.loads(json.dumps(encode_snapshot(snap)))
    assert "trv_available" not in data["rooms"]["a"]  # defaults are left out
    assert decode_snapshot(data) == snap
    assert decode_snapshot(data).mode is Mode.FROST


def test_decode_ignores_unknown_keys_and_rejects_missing_ones():
    data = encode_snapshot(Snapshot(1.0, 0, 5.0, {"a": RoomInput()}, False, False))
    data["burner_firing"] = True  # from a newer schema
    data["rooms"]["a"]["new_field"] = 1
    assert decode_snapshot(data).rooms["a"] == RoomInput()
    del data["now"]
    with pytest.raises(TypeError):
        decode_snapshot(data)


def test_compact_actions_and_differences():
    a = Actions(
        valves={"a": ValveAction("a", 20.5, 40, 100, 19.2)},
        heating_relay=True,
        store_relay=False,
        boiler_state=BoilerState.FIRING,
        reasons=[Reason("boiler.firing", "Burner called")],
        alerts=[Reason("valve.stuck", "A: not warming", "a")],
    )
    c = compact_actions(a)
    assert c == {
        "heating": True,
        "store": False,
        "boiler": "firing",
        "valves": {"a": [20.5, 40, 100, 19.2]},
        "reasons": [["boiler.firing"]],
        "alerts": [["valve.stuck", "a"]],
    }
    assert diff_actions(c, json.loads(json.dumps(c))) == []
    b = {**c, "heating": False, "valves": {"a": [20.5, 55, 100, 19.2]}, "alerts": []}
    assert diff_actions(c, b) == [
        {"what": "heating relay", "recorded": "on", "replayed": "off"},
        {"what": "a opening", "recorded": 40, "replayed": 55},
        {"what": "alerts", "recorded": ["valve.stuck:a"], "replayed": []},
    ]


def test_replay_reproduces_the_recorded_actions(run):
    cfg, entries, live = run
    r = Replayer(cfg)
    ticks = list(r.run(entries))
    assert len(ticks) == 240 and r.began == START
    assert [t for t in ticks if t.differences] == []
    # The replayed state is the live state, to the last bit.
    for rid, rs in live.rooms.items():
        assert r.state.rooms[rid].est.theta == rs.est.theta


def test_replay_is_deterministic_and_shows_a_config_change(run):
    cfg, entries, _ = run
    import dataclasses

    unbalanced = dataclasses.replace(cfg, balancing=False)
    first = [t.differences for t in Replayer(unbalanced).run(entries)]
    again = [t.differences for t in Replayer(unbalanced).run(entries)]
    assert first == again
    changed = [d for diffs in first for d in diffs]
    assert any(d["what"].endswith("opening") and d["replayed"] == 100 for d in changed)


def test_window_warms_up_from_the_start_entry(run):
    cfg, entries, _ = run
    start, end = WALL0 + 100 * 60, WALL0 + 150 * 60
    r = Replayer(cfg, start=start, end=end)
    ticks = list(r.run(entries))
    assert len(ticks) == 51 and all(start <= t.wall <= end for t in ticks)
    assert not any(t.differences for t in ticks)
    fresh = Replayer(cfg, fresh=True, start=start, end=end)
    assert len(list(fresh.run(entries))) == 51 and fresh.began == "priors"


def test_without_a_start_entry_saved_state_begins_at_a_checkpoint(run):
    cfg, entries, _ = run
    r = Replayer(cfg)
    ticks = list(r.run(entries[1:]))
    assert r.skipped == 120 and r.began == CHECKPOINT and r.notes
    assert len(ticks) == 120


def test_unreadable_entries_are_counted_and_skipped(run):
    cfg, entries, _ = run
    bad = [*entries[:5], Entry(TICK, WALL0, 1, {"v": 99}), Entry(TICK, WALL0, 1, {"v": 1})]
    r = Replayer(cfg)
    assert len(list(r.run(bad))) == 4 and r.unreadable == 2


def test_restart_carries_fresh_state_and_takes_saved_state():
    cfg = house_config()
    one, live = sim_entries(cfg, 30)
    two, _ = sim_entries(cfg, 30, offset=-5000.0, wall0=WALL0 + 3600, segment=2)
    saved = Replayer(cfg)
    assert not any(t.differences for t in saved.run(one + two))
    assert saved.restarts == 1
    fresh = Replayer(cfg, fresh=True)
    list(fresh.run(one + two))
    assert fresh.restarts == 1 and fresh.state.last_now == two[-1].data["snapshot"]["now"]
    # Without the second start entry, saved state is carried over too, with a note.
    gap = Replayer(cfg)
    list(gap.run(one + two[1:]))
    assert gap.restarts == 1 and gap.notes


def test_tally_counts_burns_relay_hours_alerts_and_comfort():
    cfg = house_config()
    t = Tally()
    for i in range(30):
        heating = 5 <= i < 15
        snap = Snapshot(
            float(i * 60),
            i,
            5.0,
            {"dining": RoomInput(temperature=18.0, setpoint=20.0)},
            heating,
            False,
        )
        alerts = [["boiler.no_heat"]] if 10 <= i < 13 else []
        t.add(cfg, 1, snap, {"heating": heating, "store": i < 6, "alerts": alerts})
    s = t.as_dict()
    assert s["starts"] == 1 and s["burns"] == 1 and s["mean_burn_min"] == 10
    assert s["heating_relay_h"] == round(10 / 60, 2)
    assert s["alerts"] == {"boiler.no_heat": {"onsets": 1, "minutes": 3}}
    assert s["below_setpoint_h"] == {"dining": 0.5}
