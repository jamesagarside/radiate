"""Quiet hours on the simulated reference house (spec 5.10): a cold spell, three days."""

import dataclasses

import pytest

from radiate.core.quiet import quiet_until
from radiate.sim.reference import house_config
from radiate.sim.runner import run

QUIET = (22 * 60 + 30, 6 * 60)
FROST_C = 7.0


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


def test_the_boiler_never_starts_in_quiet_hours(runs):
    assert night_starts(runs["normal"])  # on a cold night the house would heat
    assert night_starts(runs["quiet"]) == []


def test_guards_hold_and_rooms_stay_above_frost(runs):
    r = runs["quiet"]
    assert r.guard_violations == 0
    assert r.max_starts_in_hour <= 3
    assert r.min_room[0] > FROST_C
