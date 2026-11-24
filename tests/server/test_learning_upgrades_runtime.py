"""Learned state across upgrades in the runtime (ADR-0007): migrated saves, learning
notes, invalidated models and saves from a newer version."""

import json
from pathlib import Path

from radiate.core.persist import VERSION
from radiate.server.demo import DemoDriver
from radiate.server.runtime import LEARNING_NOTES_KEY, LEARNING_NOTES_S, Runtime
from radiate.server.store import Store
from radiate.sim.reference import house_config

FIXTURES = Path(__file__).parent.parent / "core" / "fixtures"
WALL0 = 1_800_000_000.0


def runtime(path, wall=WALL0) -> Runtime:
    return Runtime(house_config(), DemoDriver(), store=Store(path), wall=lambda: wall)


def put_engine(path, data, wall=WALL0 - 600) -> None:
    store = Store(path)
    store.put("engine", data, wall=wall)
    store.close()


def v1() -> dict:
    return json.loads((FIXTURES / "engine_v1.json").read_text())


async def test_a_version_1_save_is_migrated_and_noted(tmp_path):
    db = tmp_path / "r.db"
    put_engine(db, v1())
    rt = runtime(db)
    problems = rt.restore()
    assert len(problems) == 1 and "format 1 to 2" in problems[0]
    (note,) = rt.learning_notes
    assert note["code"] == "learning.restore" and note["message"].startswith("Saved state")
    assert note["at"] == WALL0
    state = rt.describe()
    assert state["learning_notes"] == rt.learning_notes
    dining = next(r for r in state["rooms"] if r["id"] == "dining")
    assert dining["model"]["learned"]["learner"] == 1
    assert dining["model"]["learned"]["updates"] == {"unknown": dining["model"]["samples"]}
    rt.save()
    assert rt.store.get("engine")[0]["version"] == VERSION
    # The note survives a restart, and is not repeated: the save is now current.
    again = runtime(db)
    assert again.restore() == []
    assert again.learning_notes == rt.learning_notes


async def test_dry_run_models_reset_on_the_first_metered_tick(tmp_path):
    # The demo house meters its burner, like the reference house.
    db = tmp_path / "r.db"
    put_engine(db, v1())
    rt = runtime(db)
    rt.restore()
    await rt.step()
    reset = [n for n in rt.learning_notes if n["code"] == "learning.invalidated"]
    learned = {rid for rid, raw in v1()["rooms"].items() if raw["est"]["samples"] > 0}
    assert {n["room_id"] for n in reset} == learned
    assert {d.room_id for d in rt.decisions if d.code == "learning.invalidated"} == learned
    assert all(rt.state.rooms[rid].est.samples <= 1 for rid in learned)
    # Kept in the state database at once, not only at the next save.
    saved = rt.store.get(LEARNING_NOTES_KEY)[0]
    assert [n["code"] for n in saved].count("learning.invalidated") == len(learned)
    await rt.step()
    assert len([n for n in rt.learning_notes if n["code"] == "learning.invalidated"]) == len(
        learned
    )


async def test_a_manual_reset_is_noted(tmp_path):
    rt = runtime(tmp_path / "r.db")
    rt.restore()
    rt.reset_learning(["dining"])
    assert [(n["code"], n["room_id"]) for n in rt.learning_notes] == [("learning.reset", "dining")]
    assert rt.describe()["learning_notes"][0]["message"] == "Dining room: learning reset to priors"


def test_old_notes_are_dropped(tmp_path):
    db = tmp_path / "r.db"
    store = Store(db)
    store.put(
        LEARNING_NOTES_KEY,
        [
            {"at": WALL0 - LEARNING_NOTES_S - 1, "code": "learning.reset", "message": "old"},
            {"at": WALL0 - 60, "code": "learning.reset", "message": "new", "room_id": "dining"},
            {"at": "x", "message": "junk"},
        ],
    )
    store.close()
    rt = runtime(db)
    rt.restore()
    assert [n["message"] for n in rt.learning_notes] == ["new"]


async def test_a_newer_save_is_kept_aside_untouched(tmp_path):
    db = tmp_path / "r.db"
    newer = {**v1(), "version": VERSION + 1, "something_new": [1, 2, 3]}
    put_engine(db, newer, wall=WALL0 - 60)
    rt = runtime(db)
    problems = rt.restore()
    assert "newer Radiate" in problems[0]
    key = f"engine.v{VERSION + 1}"
    assert rt.store.get(key) == (newer, WALL0 - 60)
    await rt.step()
    rt.save()
    assert rt.store.get("engine")[0]["version"] == VERSION
    assert rt.store.get(key) == (newer, WALL0 - 60)
    # A later restore of this version's own save leaves the copy alone.
    again = runtime(db)
    again.restore()
    assert again.store.get(key) == (newer, WALL0 - 60)
