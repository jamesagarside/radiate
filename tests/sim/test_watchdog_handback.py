"""Hand-back from the Shelly watchdog in the simulated house (spec 5.7).

Radiate goes away (a crash with a restart from saved state, or a Zigbee outage that
puts it in safe mode), the watchdog runs the relay, and Radiate comes back in the
middle of a watchdog burn or just after one ended. Without adoption, each of these
cut a burn to 3 min or restarted the burner 2 to 3 min after it stopped.
"""

import pytest

from radiate.sim.reference import house_config
from radiate.sim.runner import run

D, H = 86400.0, 3600.0

CASES = {
    # Back 3 min into a late watchdog burn, with every room satisfied.
    "crash, back mid-burn": dict(
        outage=(2 * D + 22 * H, 2 * D + 22.5 * H + 3 * 60),
        watchdog_windows=((22 * 60 + 30, 23 * 60 + 30),),
    ),
    # Back 3 min after the watchdog's window ended, with the morning warm-up due.
    "crash, back mid-rest": dict(
        outage=(2 * D + 4.5 * H, 2 * D + 6 * H + 3 * 60),
        watchdog_windows=((5 * 60, 6 * 60), (16 * 60, 22 * 60 + 30)),
    ),
    "zigbee down, morning": dict(zigbee_outage=(2 * D + 5 * H, 2 * D + 7 * H)),
    "zigbee down, evening": dict(zigbee_outage=(2 * D + 16.25 * H, 2 * D + 17.6 * H)),
}


@pytest.mark.parametrize("seed", (1, 2, 3))
@pytest.mark.parametrize("case", CASES)
def test_no_guard_violations_across_a_hand_back(case, seed):
    r = run("radiate", 3, 2, seed, **CASES[case])
    assert r.min_burn_violations == 0, r.relay_burns_s
    assert r.min_off_violations == 0, r.relay_offs_s
    assert r.max_starts_in_hour <= 3


def test_watchdog_burn_is_held_for_minimum_burn_after_a_restart():
    r = run("radiate", 3, 2, 1, **CASES["crash, back mid-burn"])
    # The last burn is the watchdog's, 3 min old when Radiate came back: kept on for a
    # full minimum burn from then, because its start time is unknown.
    min_burn = house_config().boiler.min_burn_s
    assert r.relay_burns_s[-1] >= 3 * 60 + min_burn - 60
