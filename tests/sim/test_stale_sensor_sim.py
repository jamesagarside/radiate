"""A room sensor going quiet on the simulated reference house (spec 7).

Replays the reference install's incident: the dining room's sensor stopped reporting
and its TRV's reading stopped changing, so the TRV fallback sat below the room's target
and the room called for heat all evening. The sensor dies at 23:30 on the warm-up day;
the measured day runs on the fallback throughout.
"""

import pytest

from radiate.core import DAMP_FLOOR_C
from radiate.sim.compare import FLOOR_SLACK_K
from radiate.sim.runner import run

DAY = 86400
DIES_AT = DAY - 30 * 60


@pytest.fixture(scope="module")
def runs():
    return {
        "normal": run(days=2, warmup_days=1),
        # The TRV keeps reporting the value it had when the sensor died.
        "stuck": run(
            days=2,
            warmup_days=1,
            dead_sensors={"dining": DIES_AT},
            stuck_trvs={"dining": DIES_AT},
        ),
        # The TRV keeps reading its own sensor beside the radiator.
        "dead": run(days=2, warmup_days=1, dead_sensors={"dining": DIES_AT}),
    }


def test_a_stuck_fallback_never_calls_or_holds_the_boiler_on(runs):
    stuck, normal = runs["stuck"], runs["normal"]
    assert stuck.calling_min.get("dining", 0) == 0
    # Before the fix the dining room called for about 9 hours and the relay stayed on
    # 1.8 hours longer than with a working sensor.
    assert stuck.relay_on_s <= normal.relay_on_s + 1800
    assert stuck.min_burn_violations == stuck.min_off_violations == 0
    assert stuck.max_starts_in_hour <= 3


def test_a_live_trv_still_holds_the_damp_floor(runs):
    dead = runs["dead"]
    assert dead.room_min_c["dining"] >= DAMP_FLOOR_C - FLOOR_SLACK_K
    assert dead.min_burn_violations == dead.min_off_violations == 0
