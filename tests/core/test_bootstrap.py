"""Bootstrap: learned parts from history, timers from the present (spec 4.3)."""

import json

from test_history import sim_entries

from radiate.core import EngineState
from radiate.core.bootstrap import bootstrap, learned_parts, merge, needs_bootstrap
from radiate.core.persist import VERSION, dump_state, load_state
from radiate.core.types import BoilerState
from radiate.sim.reference import house_config


def test_needs_bootstrap_only_without_usable_saved_state():
    assert needs_bootstrap(None)
    assert needs_bootstrap({"version": VERSION + 1})
    assert not needs_bootstrap({"version": VERSION, "rooms": {}})


def test_bootstrapped_model_matches_the_one_learned_live():
    cfg = house_config()
    # Ten hours of the morning and evening heating, with a restart in the middle.
    entries, live = sim_entries(cfg, 600, restart_at=300)
    data, ticks = bootstrap(cfg, entries)
    assert ticks == 600
    state, problems = load_state(cfg, json.loads(json.dumps(data)), 10.0)
    assert problems == []
    learned = 0
    for rid, rs in live.rooms.items():
        b, e = state.rooms[rid].est, rs.est
        assert b.samples == e.samples
        learned += e.samples > 0
        for x, y in zip(b.theta, e.theta, strict=True):
            assert abs(x - y) <= 1e-9 * max(1.0, abs(y)), rid
        assert state.rooms[rid].lag_samples == rs.lag_samples
        assert state.rooms[rid].lockshield == rs.lockshield
    assert learned >= 6
    # Nothing from history's timers: the guard is a fresh one.
    assert state.boiler.state is BoilerState.IDLE and state.boiler.starts == []


def test_merge_keeps_the_present_and_replaces_only_learned_parts():
    cfg = house_config()
    _, live = sim_entries(cfg, 120)
    present = EngineState.new(cfg)
    present.boiler.state = BoilerState.FIRING
    present.boiler.since = present.boiler.burn_started_at = 95.0
    present.rooms["lounge"].dist.fire = True
    saved = dump_state(present, 100.0)
    merged = merge(saved, learned_parts(live))
    assert merged["boiler"] == saved["boiler"] and saved["rooms"]["dining"]["est"]["samples"] == 0
    assert merged["rooms"]["lounge"]["dist"]["fire"] is True
    state, _ = load_state(cfg, merged, 100.0)
    assert state.boiler.state is BoilerState.FIRING and state.boiler.burn_elapsed(100.0) == 5.0
    assert state.rooms["dining"].est.theta == live.rooms["dining"].est.theta
    assert state.rooms["dining"].lockshield_hist == live.rooms["dining"].lockshield_hist


def test_no_ticks_no_bootstrap():
    assert bootstrap(house_config(), []) == (None, 0)
