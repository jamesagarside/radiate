import dataclasses

from radiate.sim.reference import ROOMS, SETBACK, next_change, setpoint


def _scan(spec, minute):
    """The obvious minute-by-minute search that next_change must agree with."""
    now_sp = setpoint(spec, minute)
    for step in range(1, 24 * 60):
        sp = setpoint(spec, (minute + step) % (24 * 60))
        if sp != now_sp:
            return sp, step * 60.0
    return now_sp, 24 * 3600.0


def test_next_change_matches_a_full_scan_at_every_minute():
    specs = {spec.comfort: spec for spec in ROOMS}.values()
    for spec in specs:
        for minute in range(24 * 60):
            assert next_change(spec, minute) == _scan(spec, minute), (spec.id, minute)


def test_next_change_with_a_flat_schedule():
    flat = dataclasses.replace(ROOMS[0], comfort=SETBACK)
    assert next_change(flat, 600) == (SETBACK, 24 * 3600.0)
