"""Quiet hours on the simulated reference house (spec 5.10): a cold spell, three days."""

import dataclasses

import pytest

from radiate.core import DAMP_FLOOR_C
from radiate.core.quiet import quiet_until
from radiate.sim.compare import FLOOR_SLACK_K
from radiate.sim.reference import house_config
from radiate.sim.runner import run

QUIET = (22 * 60 + 30, 6 * 60)


def night_starts(result) -> list[int]:
    minutes = [int(t % 86400 // 60) for t in result.relay_starts_at]
    return [m for m in minutes if quiet_until(QUIET, m) is not None]


@pytest.fixture(scope="module")
def runs():
    out = {}
    for name, window in (("normal", None), ("quiet", QUIET)):
        cfg = dataclasses.replace(house_config(), quiet_hours=window)
        out[name] = run(days=3, warmup_days=1, cfg=cfg, outdoor_mean=0.0)
    return out


def test_fewer_burns_start_in_quiet_hours(runs):
    # On a cold night the house heats to its 16 °C night setpoints; with quiet hours
    # only to hold the damp floor.
    assert night_starts(runs["normal"])
    assert len(night_starts(runs["quiet"])) < len(night_starts(runs["normal"]))


def test_guards_hold_and_rooms_stay_at_the_damp_floor(runs):
    r = runs["quiet"]
    assert r.guard_violations == 0
    assert r.max_starts_in_hour <= 3
    assert r.min_room[0] >= DAMP_FLOOR_C - FLOOR_SLACK_K
