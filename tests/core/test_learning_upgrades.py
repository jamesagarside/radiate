"""Learned state across upgrades (ADR-0007): migrations from each past saved format,
provenance, re-weighting, the downgrade policy and the invalidation rules."""

import copy
import json
from pathlib import Path

import pytest

from radiate.core import EngineState, RoomInput, Snapshot
from radiate.core.bootstrap import needs_bootstrap
from radiate.core.decide import decide, reset_learned
from radiate.core.persist import (
    CARRY_OVER_DISCOUNT,
    MIGRATIONS,
    VERSION,
    dump_state,
    load_state,
    migrate,
    readable,
)
from radiate.core.provenance import (
    DRY_BURNER,
    DRY_RELAY,
    LEARNER_VERSION,
    LIVE_BURNER,
    LIVE_RELAY,
    RULES,
    UNKNOWN,
    Conditions,
    Invalidation,
    Provenance,
    invalid,
)
from radiate.sim.reference import house_config
from radiate.sim.runner import run

FIXTURES = Path(__file__).parent / "fixtures"
# What persist version 1 wrote: on this stack before provenance (with burner metering),
# and on main before burner metering (as the reference house ran in its dry run).
V1_FIXTURES = ("engine_v1.json", "engine_v1_before_metering.json")


def fixture(name):
    return json.loads((FIXTURES / name).read_text())


def tick(st, cfg, m, *, burner, live=True):
    """One quiet tick: rooms at 19 °C, relay off; `burner` None means not metered."""
    rooms = {
        r.id: RoomInput(temperature=19.0, trv_temperature=19.5, setpoint=18.0)
        for r in cfg.rooms
        if r.controllable
    }
    snap = Snapshot(
        now=m * 60.0,
        minute_of_day=(6 * 60 + m) % 1440,
        outdoor=5.0,
        rooms=rooms,
        heating_relay=False,
        store_relay=False,
        relay_follows_commands=live,
        heating_burner=burner,
        store_burner=None if burner is None else False,
    )
    return decide(cfg, snap, st)


# --- every past format still loads ------------------------------------------------------


def test_there_is_a_fixture_for_every_past_format():
    for version in range(1, VERSION):
        assert version in MIGRATIONS
        assert any(FIXTURES.glob(f"engine_v{version}*.json")), version


@pytest.mark.parametrize("name", V1_FIXTURES)
def test_version_1_saves_load_with_their_models(name):
    cfg = house_config()
    data = fixture(name)
    original = copy.deepcopy(data)
    st, problems = load_state(cfg, data, now=10.0, elapsed_s=60.0)
    assert data == original  # the saved data itself is never changed
    assert problems == [
        "saved state brought forward from format 1 to 2: models learned before Radiate "
        "recorded how are trusted less"
    ]
    for rid, raw in data["rooms"].items():
        est = st.rooms[rid].est
        assert est.theta == raw["est"]["theta"]  # values are kept
        assert est.samples == raw["est"]["samples"]
        for i in range(3):  # trusted less: some prior variance back, at most the prior's
            saved = raw["est"]["p"][i][i]
            p0 = est.p0_diag[i]
            assert est.p[i][i] == pytest.approx(min(max(p0, saved), saved + 0.3 * p0))
        assert st.rooms[rid].lag_samples == raw["lag_samples"]
        assert st.rooms[rid].lockshield_hist == raw["lockshield_hist"]
        learned = st.rooms[rid].learned
        assert learned.learner == 1 and learned.updates == {UNKNOWN: raw["est"]["samples"]}
    assert st.boiler.state.value == data["boiler"]["state"]


@pytest.mark.parametrize("name", V1_FIXTURES)
def test_a_migrated_save_is_discounted_once(name):
    cfg = house_config()
    st, _ = load_state(cfg, fixture(name), now=10.0)
    saved = json.loads(json.dumps(dump_state(st, 10.0)))
    assert saved["version"] == VERSION
    assert all("discount" not in room["learned"] for room in saved["rooms"].values())
    again, problems = load_state(cfg, saved, now=20.0)
    assert problems == []
    for rid, rs in st.rooms.items():
        assert again.rooms[rid].est.p == rs.est.p
        assert again.rooms[rid].learned == rs.learned


def test_migration_carries_over_confidence_lowered_not_lost():
    cfg = house_config()
    data = fixture("engine_v1.json")
    st, _ = load_state(cfg, data, now=10.0)
    for rid, raw in data["rooms"].items():
        before = EngineState.new(cfg).rooms[rid].est
        before.p = raw["est"]["p"]
        after = st.rooms[rid].est.confidence
        assert after <= before.confidence
        if before.confidence > 0.5:
            assert after > 0  # still trusted in part, not reset


def test_migrate_reports_each_step_and_keeps_the_input():
    data = fixture("engine_v1_before_metering.json")
    original = copy.deepcopy(data)
    out, notes = migrate(data)
    assert data == original and out["version"] == VERSION and len(notes) == VERSION - 1
    assert out["rooms"]["dining"]["learned"]["discount"] == CARRY_OVER_DISCOUNT
    assert migrate(out) == (out, [])


# --- downgrade: a newer format is not read and not lost --------------------------------


def test_a_newer_format_starts_from_priors_and_says_so():
    cfg = house_config()
    newer = {**fixture("engine_v1.json"), "version": VERSION + 1}
    st, problems = load_state(cfg, newer, now=10.0)
    fresh = EngineState.new(cfg)
    assert all(st.rooms[r].est.theta == fresh.rooms[r].est.theta for r in fresh.rooms)
    assert len(problems) == 1 and "newer Radiate" in problems[0]
    assert not readable(newer) and needs_bootstrap(newer)
    assert readable(fixture("engine_v1.json")) and not needs_bootstrap(fixture("engine_v1.json"))


@pytest.mark.parametrize("version", [None, "2", True, 0, -1])
def test_an_unusable_version_starts_from_priors(version):
    st, problems = load_state(house_config(), {"version": version, "rooms": {}}, now=1.0)
    assert problems == ["saved state missing or unreadable: starting from priors"]


# --- provenance -------------------------------------------------------------------------


def test_learning_records_how_each_update_was_made():
    cfg = house_config()
    st = run("radiate", days=1, warmup_days=0, seed=3).engine
    # The simulator runs the boiler with the burner metered.
    for rs in st.rooms.values():
        assert rs.learned.learner == LEARNER_VERSION
        assert rs.learned.updates == ({LIVE_BURNER: rs.est.samples} if rs.est.samples else {})
    data = json.loads(json.dumps(dump_state(st, st.last_now)))
    restored, problems = load_state(cfg, data, now=1.0)
    assert problems == []
    assert all(restored.rooms[r].learned == st.rooms[r].learned for r in st.rooms)


def test_conditions_name_how_heat_was_seen():
    assert Conditions(live=True, metered=True).key == LIVE_BURNER
    assert Conditions(live=True, metered=False).key == LIVE_RELAY
    assert Conditions(live=False, metered=True).key == DRY_BURNER
    assert Conditions(live=False, metered=False).key == DRY_RELAY


def test_note_counts_days_and_version():
    p = Provenance()
    p.note(LIVE_BURNER, 739000, "0.1.0")
    p.note(LIVE_BURNER, None, None)
    p.note(DRY_BURNER, 739002, "0.2.0")
    assert p.updates == {LIVE_BURNER: 2, DRY_BURNER: 1}
    assert (p.first_day, p.last_day, p.code) == (739000, 739002, "0.2.0")
    assert Provenance.from_dict(p.to_dict()) == p


def test_unreadable_provenance_counts_as_unknown():
    cfg = house_config()
    st = run("radiate", days=1, warmup_days=0, seed=3).engine
    data = json.loads(json.dumps(dump_state(st, st.last_now)))
    data["rooms"]["lounge"]["learned"] = {"learner": "x"}
    data["rooms"]["dining"]["learned"]["updates"]["from_a_newer_version"] = 4
    restored, problems = load_state(cfg, data, now=1.0)
    lounge = restored.rooms["lounge"]
    assert lounge.learned.updates == {UNKNOWN: lounge.est.samples}
    assert problems == ["Lounge: saved learning record unreadable, counted as unknown"]
    assert restored.rooms["dining"].learned.updates["from_a_newer_version"] == 4


def test_manual_reset_clears_provenance():
    cfg = house_config()
    st, _ = load_state(cfg, fixture("engine_v1.json"), now=10.0)
    reset_learned(cfg, st, ["dining"])
    assert st.rooms["dining"].learned == Provenance()


# --- invalidation rules: one test per rule ---------------------------------------------


def test_rule_dry_run_unmetered():
    (rule,) = [r for r in RULES if r.code == "dry_run_unmetered"]
    metered = Conditions(live=True, metered=True)
    unmetered = Conditions(live=True, metered=False)
    assert rule.applies(Provenance(updates={DRY_RELAY: 3}), metered)
    assert rule.applies(Provenance(learner=1, updates={UNKNOWN: 3}), metered)
    assert rule.applies(Provenance(updates={DRY_RELAY: 1, LIVE_BURNER: 900}), metered)
    assert rule.applies(Provenance(updates={DRY_RELAY: 3}), Conditions(live=False, metered=True))
    # Or once Radiate takes over the boiler, metered or not (owner, 2026-11-25).
    assert rule.applies(Provenance(updates={DRY_RELAY: 3}), unmetered)
    assert rule.applies(Provenance(learner=1, updates={UNKNOWN: 3}), unmetered)
    # Not in a dry run without metering: there is nothing better to learn from yet.
    dry = Conditions(live=False, metered=False)
    assert not rule.applies(Provenance(updates={DRY_RELAY: 3}), dry)
    assert not rule.applies(Provenance(learner=1, updates={UNKNOWN: 3}), dry)
    # Heat that was seen is fine, in a dry run or not.
    for key in (DRY_BURNER, LIVE_BURNER, LIVE_RELAY):
        assert not rule.applies(Provenance(updates={key: 500}), metered)
    assert not rule.applies(Provenance(), metered)  # nothing learned


def test_every_rule_has_a_test():
    tested = {"dry_run_unmetered"}
    assert {r.code for r in RULES} == tested


def test_a_rule_by_learner_version():
    # How a later release names models learned before a change to learning.
    rule = Invalidation("before_v3", "learned before version 3", lambda p, _: p.learner < 3)
    now = Conditions(live=True, metered=True)
    assert invalid(Provenance(learner=2, updates={LIVE_BURNER: 1}), now, (rule,)) is rule
    assert invalid(Provenance(learner=3, updates={LIVE_BURNER: 1}), now, (rule,)) is None


@pytest.mark.parametrize("name", V1_FIXTURES)
def test_dry_run_models_are_reset_once_the_burner_is_metered(name):
    # The reference house: models learned in a dry run that took heat for granted
    # (version 1 saves cannot say), restored on a house with burner metering.
    cfg = house_config()
    data = fixture(name)
    data["rooms"]["bedroom_1"]["est"]["theta"][0] = 0.15  # as the live house had
    st, _ = load_state(cfg, data, now=10.0)
    kept = {rid: list(rs.est.theta) for rid, rs in st.rooms.items()}
    # Still in a dry run, metering not read yet: nothing reset.
    acts = tick(st, cfg, 1, burner=None, live=False)
    assert not [r for r in acts.reasons if r.code == "learning.invalidated"]
    assert all(st.rooms[rid].est.theta == theta for rid, theta in kept.items())

    acts = tick(st, cfg, 2, burner=False, live=False)
    reset = {r.room_id: r.message for r in acts.reasons if r.code == "learning.invalidated"}
    learned = {rid for rid, raw in data["rooms"].items() if raw["est"]["samples"] > 0}
    assert set(reset) == learned
    assert reset["bedroom_1"] == (
        "Bedroom 1: learning reset to priors, as it was learned without seeing the burner, "
        "in a dry run or by an older version"
    )
    fresh = EngineState.new(cfg)
    for rid in learned:
        rs = st.rooms[rid]
        assert rs.est.theta == fresh.rooms[rid].est.theta and rs.est.samples == 0
        assert rs.lag_samples == [] and rs.lockshield_hist == [0.0] * 101
        assert rs.learned == Provenance()
    # Once: the fresh models carry no invalid learning, nor does taking over later.
    acts = tick(st, cfg, 3, burner=False, live=False)
    assert not [r for r in acts.reasons if r.code == "learning.invalidated"]
    acts = tick(st, cfg, 4, burner=False)
    assert not [r for r in acts.reasons if r.code == "learning.invalidated"]


@pytest.mark.parametrize("name", V1_FIXTURES)
def test_dry_run_models_are_reset_when_radiate_takes_over_unmetered(name):
    # An install without burner metering (owner, 2026-11-25): the dry run's models are
    # reset when dry run is turned off, not kept until the burner is metered.
    cfg = house_config()
    data = fixture(name)
    st, _ = load_state(cfg, data, now=10.0)
    kept = {rid: list(rs.est.theta) for rid, rs in st.rooms.items()}
    for m in range(1, 4):  # still a dry run without metering: nothing reset
        acts = tick(st, cfg, m, burner=None, live=False)
        assert not [r for r in acts.reasons if r.code == "learning.invalidated"]
    assert all(st.rooms[rid].est.theta == theta for rid, theta in kept.items())

    acts = tick(st, cfg, 4, burner=None)  # dry run off: Radiate runs the boiler
    reset = {r.room_id for r in acts.reasons if r.code == "learning.invalidated"}
    learned = {rid for rid, raw in data["rooms"].items() if raw["est"]["samples"] > 0}
    assert learned and reset == learned
    fresh = EngineState.new(cfg)
    for rid in learned:
        assert st.rooms[rid].est.theta == fresh.rooms[rid].est.theta
        assert st.rooms[rid].learned == Provenance()
    # Once: not again live, nor after a return to dry run and back.
    for m, live in ((5, True), (6, False), (7, True)):
        acts = tick(st, cfg, m, burner=None, live=live)
        assert not [r for r in acts.reasons if r.code == "learning.invalidated"]


def test_takeover_rule_does_not_fire_again_after_live_learning():
    # A house run live without metering learns under `live_relay` only, so the rule has
    # nothing to name, live or back in a dry run.
    cfg = house_config()
    st = run("radiate", days=1, warmup_days=0, seed=3, metering=False).engine
    counted = set().union(*(rs.learned.updates for rs in st.rooms.values()))
    assert counted == {LIVE_RELAY}
    for m, live in ((10_000, True), (10_001, False), (10_002, True)):
        acts = tick(st, cfg, m, burner=None, live=live)
        assert not [r for r in acts.reasons if r.code == "learning.invalidated"]


def test_dry_run_rule_only_resets_rooms_it_names():
    cfg = house_config()
    st = run("radiate", days=1, warmup_days=0, seed=3).engine
    st.rooms["kitchen"].learned.updates[DRY_RELAY] = 10
    kept = {rid: list(rs.est.theta) for rid, rs in st.rooms.items()}
    acts = tick(st, cfg, 10_000, burner=False)
    assert [r.room_id for r in acts.reasons if r.code == "learning.invalidated"] == ["kitchen"]
    assert st.rooms["kitchen"].est.samples == 0
    assert all(st.rooms[rid].est.theta == kept[rid] for rid in kept if rid != "kitchen")
