import dataclasses
import json
import math

from radiate.core import EngineState, decide
from radiate.core.estimator import forgetting
from radiate.core.persist import dump_state, load_state
from radiate.core.types import BoilerState, LearningConfig
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
    assert r.today.unseen_s == led.today.unseen_s


def test_a_long_restart_makes_the_day_partial():
    # Partial days (spec 5.6): the time Radiate was down counts as unseen. The last
    # tick is saved as an age, so the gap is known after the restart.
    from radiate.core.accounting import Ledger

    def tick(st, now, minute):
        st.ledger.update(
            now, 0, relay_on=False, firing=False, calling=set(), below={}, minute=minute
        )

    cfg = house_config()
    for down_s, partial in ((120.0, False), (3 * 3600.0, True)):
        st = EngineState.new(cfg)
        st.ledger = Ledger()
        for m in range(600):
            tick(st, 1000.0 + m * 60, m)
        saved = json.loads(json.dumps(dump_state(st, st.ledger.last_t)))
        restored, _ = load_state(cfg, saved, now=5.0, elapsed_s=down_s)
        tick(restored, 5.0, 600 + round(down_s / 60))
        assert restored.ledger.summary(None)["partial"] is partial


def test_stuck_valve_verdicts_survive_a_restart():
    cfg = house_config()
    st = EngineState.new(cfg)
    st.rooms["bedroom_2"].valve.misses = 3
    st.rooms["bedroom_2"].valve.untrusted = True
    st.rooms["dining"].valve.misses = 1
    data = json.loads(json.dumps(dump_state(st, 100.0)))
    restored, problems = load_state(cfg, data, now=1.0)
    assert problems == []
    assert restored.rooms["bedroom_2"].valve.untrusted
    assert restored.rooms["bedroom_2"].valve.misses == 3
    assert restored.rooms["dining"].valve.misses == 1
    assert not restored.rooms["bedroom_1"].valve.untrusted


def test_leaking_valve_verdicts_survive_a_restart():
    cfg = house_config()
    st = EngineState.new(cfg)
    st.rooms["dining"].valve.leak_history = [True, False, True]
    st.rooms["dining"].valve.leaking = True
    data = json.loads(json.dumps(dump_state(st, 100.0)))
    restored, problems = load_state(cfg, data, now=1.0)
    assert problems == []
    assert restored.rooms["dining"].valve.leaking
    assert restored.rooms["dining"].valve.leak_history == [True, False, True]
    assert not restored.rooms["lounge"].valve.leaking
    # Saves from before the leak check, or with junk in it, load with no verdicts.
    del data["rooms"]["dining"]["valve"]["leak_history"]
    data["rooms"]["lounge"]["valve"]["leak_history"] = [1, "x"]
    restored, problems = load_state(cfg, data, now=1.0)
    assert problems == [] and restored.rooms["dining"].valve.leak_history == []
    assert restored.rooms["lounge"].valve.leak_history == []


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


def test_internal_sensor_room_keeps_its_confidence_cap():
    cfg, st = learned()
    restored, _ = load_state(cfg, dump_state(st, st.last_now), 0.0)
    restored.rooms["toilet"].est.p[0][0] = 0.0
    assert restored.rooms["toilet"].est.confidence == 0.5


def test_change_detection_survives_a_restart():
    cfg, st = learned()
    est = st.rooms["dining"].est
    est.gain_eu, est.gain_uu, est.level_e, est.since_reset, est.relearns = 0.4, 0.1, -0.2, 99, 2
    data = json.loads(json.dumps(dump_state(st, st.last_now)))
    restored, problems = load_state(cfg, data, 0.0)
    assert problems == []
    r = restored.rooms["dining"].est
    for key in ("gain_eu", "gain_uu", "gain_ee", "level_e", "level_ee", "since_reset"):
        assert getattr(r, key) == getattr(est, key), key
    assert r.relearns == 2 and r.lam == est.lam


def test_models_saved_before_change_detection_still_load():
    cfg, st = learned()
    data = json.loads(json.dumps(dump_state(st, st.last_now)))
    for room in data["rooms"].values():
        del room["est"]["change"]
    data["rooms"]["lounge"]["est"]["change"] = {"gain_uu": -1, "since_reset": "x"}  # junk
    restored, problems = load_state(cfg, data, 0.0)
    assert problems == []
    for rid, rs in st.rooms.items():
        r = restored.rooms[rid].est
        assert r.theta == rs.est.theta and r.p == rs.est.p
        assert r.since_reset == 0 and r.relearns == 0 and r.gain_uu == 0.0


def test_learning_memory_comes_from_the_configuration():
    cfg, st = learned()
    short = dataclasses.replace(cfg, learning=LearningConfig(memory_days=3))
    restored, _ = load_state(short, dump_state(st, st.last_now), 0.0)
    assert all(rs.est.lam == forgetting(3) for rs in restored.rooms.values())
    assert all(rs.est.lam == forgetting(730) for rs in EngineState.new(cfg).rooms.values())


def test_burner_accounting_and_model_doubt_survive_a_restart():
    cfg = house_config()
    st = EngineState.new(cfg)
    t = st.ledger.today
    t.relay_s, t.firing_s, t.fallback_s, t.metered_s = 6000.0, 4000.0, 0.0, 7000.0
    t.store_firing_s, t.burner_starts, t.store_starts = 540.0, 7, 1
    t.burner_s = 4000.0
    st.rooms["bedroom_1"].est.relearn()
    st.rooms["bedroom_1"].est.doubt = 17
    data = json.loads(json.dumps(dump_state(st, 100.0)))
    restored, problems = load_state(cfg, data, now=1.0)
    assert problems == []
    r = restored.ledger.today
    assert (r.relay_s, r.firing_s, r.fallback_s, r.metered_s) == (6000.0, 4000.0, 0.0, 7000.0)
    assert (r.store_firing_s, r.burner_starts, r.store_starts) == (540.0, 7, 1)
    assert restored.rooms["bedroom_1"].est.doubt == 17


def test_older_saves_take_burner_time_as_relay_time():
    # Before metering, `burner_s` was relay time.
    cfg = house_config()
    st = EngineState.new(cfg)
    st.ledger.today.burner_s = 3600.0
    data = json.loads(json.dumps(dump_state(st, 100.0)))
    for key in ("relay_s", "firing_s", "fallback_s", "metered_s", "store_firing_s"):
        del data["accounting"][key]
    del data["rooms"]["bedroom_1"]["est"]["change"]["doubt"]
    restored, problems = load_state(cfg, data, now=1.0)
    assert problems == []
    r = restored.ledger.today
    assert r.burner_s == r.relay_s == r.fallback_s == 3600.0 and r.metered_s == 0.0
    assert restored.ledger.summary(None)["basis"] == "relay"
    assert restored.rooms["bedroom_1"].est.doubt == 0
