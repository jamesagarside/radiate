import json
import math

from radiate.core import EngineState, decide
from radiate.core.persist import dump_state, load_state
from radiate.core.types import BoilerState
from radiate.sim.reference import house_config
from radiate.sim.runner import run


def learned():
    cfg = house_config()
    res = run("radiate", days=2, warmup_days=1, seed=3)
    return cfg, res.engine


def test_round_trip_keeps_learned_models():
    cfg, st = learned()
    now = st.last_now
    data = json.loads(json.dumps(dump_state(st, now)))  # must be plain JSON
    new_now = 50.0  # the monotonic clock restarted
    restored, problems = load_state(cfg, data, new_now, elapsed_s=30.0)
    assert problems == []
    for rid, rs in st.rooms.items():
        r2 = restored.rooms[rid]
        assert r2.est.theta == rs.est.theta and r2.est.p == rs.est.p
        assert r2.est.samples == rs.est.samples
        assert r2.lag_samples == rs.lag_samples
        assert r2.lockshield == rs.lockshield
        assert r2.dist.fire == rs.dist.fire
    # Times are shifted onto the new clock, with the downtime added.
    g, g2 = st.boiler, restored.boiler
    assert g2.state is g.state
    assert math.isclose(new_now - g2.since, now - g.since + 30.0)
    assert [new_now - t for t in g2.starts] == [now - t + 30.0 for t in g.starts]


def test_restart_mid_burn_honours_minimum_burn():
    cfg = house_config()
    st = EngineState.new(cfg)
    st.boiler.state = BoilerState.FIRING
    st.boiler.since = st.boiler.burn_started_at = 1000.0
    st.boiler.starts = [1000.0]
    data = dump_state(st, 1000.0 + 120)  # saved 2 min into the burn
    restored, _ = load_state(cfg, data, now=5.0, elapsed_s=60.0)
    assert restored.boiler.state is BoilerState.FIRING
    assert math.isclose(restored.boiler.burn_elapsed(5.0), 180.0)
    # No demand at all (every room warm), yet the relay stays on until 8 min.
    from radiate.core.types import RoomInput, Snapshot

    def snap(t):
        rooms = {
            r.id: RoomInput(temperature=25.0, trv_temperature=25.0, setpoint=18.0)
            for r in cfg.rooms
        }
        return Snapshot(t, 600, 5.0, rooms, heating_relay=True, store_relay=False)

    assert decide(cfg, snap(5.0), restored).heating_relay is True
    assert decide(cfg, snap(5.0 + 290), restored).heating_relay is True
    assert decide(cfg, snap(5.0 + 305), restored).heating_relay is False


def test_lead_restarts_from_idle():
    cfg = house_config()
    st = EngineState.new(cfg)
    st.boiler.state, st.boiler.since = BoilerState.LEAD, 10.0
    restored, _ = load_state(cfg, dump_state(st, 20.0), now=1.0)
    assert restored.boiler.state is BoilerState.IDLE


def test_corrupt_room_resets_to_priors():
    cfg, st = learned()
    data = dump_state(st, st.last_now)
    data["rooms"]["bedroom_1"]["est"]["theta"][0] = float("nan")
    data["rooms"]["bedroom_2"]["est"]["theta"][0] = 99.0  # above the 12 K/h bound
    data["rooms"]["bedroom_3"] = "junk"
    restored, problems = load_state(cfg, data, 0.0)
    fresh = EngineState.new(cfg)
    for rid in ("bedroom_1", "bedroom_2", "bedroom_3"):
        assert restored.rooms[rid].est.theta == fresh.rooms[rid].est.theta
    assert len(problems) == 3
    assert restored.rooms["dining"].est.theta == st.rooms["dining"].est.theta


def test_wrong_version_starts_fresh():
    cfg = house_config()
    st, problems = load_state(cfg, {"version": 99}, 0.0)
    assert problems and st.boiler.state is BoilerState.IDLE
    st, problems = load_state(cfg, None, 0.0)
    assert problems
