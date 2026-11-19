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


def test_raised_minimum_off_survives_a_restart():
    cfg = house_config()
    st = EngineState.new(cfg)
    sc = st.short_cycle
    sc.extra_off_s, sc.until, sc.raised_at = 600.0, 5000.0 + 20 * 3600, 5000.0
    sc.starts, sc.cut_burns = [4000.0, 4500.0], [4200.0]
    data = json.loads(json.dumps(dump_state(st, 5000.0)))
    restored, problems = load_state(cfg, data, now=10.0, elapsed_s=3600.0)
    assert problems == []
    r = restored.short_cycle
    assert r.extra_off_s == 600.0
    assert math.isclose(r.until - 10.0, 19 * 3600)  # an hour of the 20 left went by
    assert [10.0 - t for t in r.starts] == [4600.0, 4100.0]
    assert r.relay is None  # the first relay reading after a restart is not a start


def test_accounting_survives_a_restart():
    cfg, st = learned()  # two simulated days: day 0 closed, day 1 running
    now = st.last_now
    led = st.ledger
    assert led.history and led.history[-1]["day"] == 0
    data = json.loads(json.dumps(dump_state(st, now)))
    restored, problems = load_state(cfg, data, now=7.0, elapsed_s=120.0)
    assert problems == []
    r = restored.ledger
    assert r.history == led.history
    assert r.today.day == led.today.day
    assert r.today.burner_s == led.today.burner_s
    assert r.today.burns_min == led.today.burns_min
    assert r.today.spreads_min == led.today.spreads_min
    assert r.today.below_min == led.today.below_min
    assert [7.0 - t for t in r.today.starts] == [now - t + 120.0 for t in led.today.starts]
    assert r.relay is None and r.arrival is None


def test_state_saved_before_health_data_still_loads():
    cfg, st = learned()
    data = dump_state(st, st.last_now)
    del data["health"]
    del data["accounting"]
    restored, problems = load_state(cfg, data, 0.0)
    assert problems == []
    assert restored.short_cycle.extra_off_s == 0.0
    assert restored.ledger.history == [] and restored.ledger.today.starts == []


def test_wrong_version_starts_fresh():
    cfg = house_config()
    st, problems = load_state(cfg, {"version": 99}, 0.0)
    assert problems and st.boiler.state is BoilerState.IDLE
    st, problems = load_state(cfg, None, 0.0)
    assert problems
