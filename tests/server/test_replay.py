"""Recording live ticks, replaying them and bootstrapping from them (spec 4.3, 6)."""

import asyncio
import dataclasses
import logging
from zoneinfo import ZoneInfo

import pytest

from radiate.core.history import CHECKPOINT, START, TICK, Replayer
from radiate.server.demo import DemoDriver
from radiate.server.history import History
from radiate.server.replay import format_report, run_replay
from radiate.server.runtime import Runtime
from radiate.server.store import Store
from radiate.sim.reference import house_config

WALL0 = 1_800_000_000.0
TZ = ZoneInfo("Europe/London")


class Process:
    """One process's view of the demo house: its own monotonic clock, history on."""

    name = "demo"
    history_days = 14

    def __init__(self, demo: DemoDriver, offset: float):
        self.demo, self.offset = demo, offset

    def clock(self) -> float:
        return self.demo.clock() - self.offset

    def wall_minutes(self) -> int:
        return self.demo.wall_minutes()

    async def snapshot(self, mode, overrides, store_boost, fire):
        snap = await self.demo.snapshot(mode, overrides, store_boost, fire)
        snap.now -= self.offset
        return snap

    async def apply(self, actions) -> None:
        await self.demo.apply(actions)

    def telemetry(self) -> dict:
        return {}


async def _run(store, demo, offset, ticks, cfg=None) -> Runtime:
    rt = Runtime(
        cfg or house_config(),
        Process(demo, offset),
        store=store,
        wall=lambda: WALL0 + demo.clock(),
    )
    rt.restore()
    for _ in range(ticks):
        await rt.step()
    await rt.stop()
    return rt


@pytest.fixture(scope="module")
def recorded(tmp_path_factory):
    """Fifteen hours from 05:30 (morning heating, evening fire), ten minutes down,
    then ten more hours on a new clock."""
    path = tmp_path_factory.mktemp("history") / "radiate.db"
    store = Store(path)
    demo = DemoDriver(start_hour=5.5)

    async def main():
        await _run(store, demo, -1234.5, 900)
        demo.advance(600)  # Radiate is down; the house carries on
        return await _run(store, demo, demo.clock() - 50.25, 600)

    rt = asyncio.run(main())
    store.close()
    return path, rt


def _copy(recorded, tmp_path) -> Store:
    src = Store(recorded[0])
    dst = Store(tmp_path / "radiate.db")
    src.db.backup(dst.db)
    src.close()
    return dst


def test_records_start_ticks_and_checkpoints(recorded, tmp_path):
    h = History(_copy(recorded, tmp_path))
    kinds = [e.kind for e in h.entries()]
    assert kinds.count(START) == 2 and kinds.count(TICK) == 1500
    assert kinds.count(CHECKPOINT) == 3  # every 6 h of each process's clock
    stats = h.stats()
    per_tick = stats["bytes"] / stats["ticks"]
    assert per_tick < 700, per_tick  # about 0.75 MB a day for the reference house


def test_replay_of_a_recorded_run_has_no_differences(recorded, tmp_path):
    h = History(_copy(recorded, tmp_path))
    for fresh in (False, True):
        # The recording started from priors, so fresh state replays it exactly too.
        report = run_replay(house_config(), h, TZ, fresh=fresh)
        assert report["ticks"] == 1500 and report["restarts"] == 1
        assert report["differing_ticks"] == 0 and report["notes"] == []
        assert report["recorded"] == report["replayed"]
        assert report["recorded"]["starts"] > 3 and report["recorded"]["heating_relay_h"] > 1
    assert "No differences" in format_report(report)


def test_a_config_change_shows_differences(recorded, tmp_path):
    h = History(_copy(recorded, tmp_path))
    cfg = house_config()
    slower = dataclasses.replace(cfg, boiler=dataclasses.replace(cfg.boiler, min_burn_s=15 * 60))
    report = run_replay(slower, h, TZ, limit=5)
    assert report["differing_ticks"] > 0 and len(report["differences"]) == 5
    assert report["replayed"] != report["recorded"]
    # Every replayed burn honours the new minimum burn, unless the recorded relay was
    # seen off underneath it: replay is open loop, so a burn the live run never made
    # ends in an external stop.
    on_at = None
    for tick in Replayer(slower).run(h.entries()):
        heating = tick.replayed["heating"]
        if heating and on_at is None:
            on_at = tick.wall
        elif not heating and on_at is not None:
            codes = {r[0] for r in tick.replayed.get("reasons", [])}
            assert tick.wall - on_at >= 15 * 60 or "boiler.external_stop" in codes
            on_at = None
    text = format_report(report)
    assert "ticks differ" in text and "heating relay" in text


def test_replay_a_window_warms_up_from_the_start_entry(recorded, tmp_path):
    h = History(_copy(recorded, tmp_path))
    start, end = WALL0 + 12 * 3600, WALL0 + 14 * 3600
    report = run_replay(house_config(), h, TZ, start=start, end=end)
    assert 115 <= report["ticks"] <= 121 and report["differing_ticks"] == 0
    assert report["from"].startswith("2027-01-15T") and report["began"] == START


def test_pruned_start_entry_falls_back_to_a_checkpoint(recorded, tmp_path):
    store = _copy(recorded, tmp_path)
    store.db.execute("DELETE FROM history WHERE kind = 'start'")
    report = run_replay(house_config(), History(store), TZ)
    assert report["began"] == CHECKPOINT and report["skipped"] >= 300 and report["notes"]


def test_prune_drops_entries_past_retention(recorded, tmp_path):
    h = History(_copy(recorded, tmp_path), days=0.5)
    removed = h.prune(WALL0 + 26 * 3600)
    assert removed > 0 and h.stats()["first"] >= WALL0 + 14 * 3600


async def test_demo_driver_never_records(tmp_path):
    store = Store(tmp_path / "radiate.db")
    rt = Runtime(house_config(), DemoDriver(), store=store)
    rt.restore()
    for _ in range(3):
        await rt.step()
    assert rt.recorder is None
    assert History(store).stats()["entries"] == 0


async def test_recording_errors_never_break_the_loop(tmp_path, caplog):
    store = Store(tmp_path / "radiate.db")
    demo = DemoDriver()
    rt = Runtime(house_config(), Process(demo, 0.0), store=store)
    rt.restore()

    def broken(*args):
        raise OSError("disk full")

    rt.recorder.history.append = broken
    with caplog.at_level(logging.WARNING):
        for _ in range(5):
            await rt.step()
    assert rt.last_actions is not None
    assert [r.message for r in caplog.records].count("history: tick not recorded: disk full") == 1


async def test_start_without_saved_state_bootstraps_from_history(recorded, tmp_path):
    store = _copy(recorded, tmp_path)
    live = recorded[1].state
    store.db.execute("DELETE FROM kv WHERE key = 'engine'")
    demo = DemoDriver(start_hour=20)
    rt = Runtime(
        house_config(),
        Process(demo, 3.0),
        store=store,
        wall=lambda: WALL0 + 2 * 86400 + demo.clock(),
    )
    assert rt.restore() == []
    learned = 0
    for rid, rs in live.rooms.items():
        b, e = rt.state.rooms[rid].est, rs.est
        learned += e.samples > 0
        # Fresh replay of the whole history is the live run: the models agree closely.
        assert b.samples == e.samples
        for x, y in zip(b.theta, e.theta, strict=True):
            assert abs(x - y) <= 1e-6 * max(1.0, abs(y)), rid
    assert learned >= 6
    # The guard comes from the present, not from history.
    assert rt.state.boiler.starts == [] and rt.state.boiler.burn_started_at is None
    # The bootstrapped state is recorded as this process's start, so replay is exact.
    for _ in range(30):
        await rt.step()
    report = run_replay(house_config(), History(store), TZ, start=WALL0 + 2 * 86400)
    assert report["ticks"] == 30 and report["differing_ticks"] == 0
