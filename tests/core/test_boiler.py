from radiate.core.boiler import BoilerGuard
from radiate.core.types import BoilerConfig, BoilerState

CFG = BoilerConfig(min_burn_s=480, min_off_s=600, max_starts_per_hour=3, valve_lead_s=90)


def run(guard: BoilerGuard, t0: float, t1: float, **kw) -> list[tuple[float, bool]]:
    out = []
    t = t0
    while t < t1:
        out.append((t, guard.step(CFG, t, **kw)))
        t += 30
    return out


def test_lead_time_before_firing():
    g = BoilerGuard()
    trace = run(g, 0, 120, want_fire=True, want_stop=False)
    assert not trace[0][1]
    assert trace[-1][1]
    assert g.state is BoilerState.FIRING


def test_minimum_burn_enforced():
    g = BoilerGuard()
    run(g, 0, 120, want_fire=True, want_stop=False)
    trace = run(g, 120, 120 + 400, want_fire=False, want_stop=True)
    assert all(relay for _, relay in trace), "stopped before minimum burn"
    run(g, 520, 700, want_fire=False, want_stop=True)
    assert g.state is BoilerState.REST


def test_minimum_off_enforced():
    g = BoilerGuard()
    run(g, 0, 120, want_fire=True, want_stop=False)
    run(g, 120, 700, want_fire=False, want_stop=True)
    trace = run(g, 700, 700 + 500, want_fire=True, want_stop=False)
    assert not any(relay for _, relay in trace)


def test_max_starts_per_hour():
    g = BoilerGuard()
    starts = 0
    t = 0.0
    relay_prev = False
    while t < 3600:
        phase = (t // 1200) % 2  # ask to fire for 20 min, stop for 20 min
        relay = g.step(CFG, t, want_fire=phase == 0, want_stop=phase == 1)
        starts += relay and not relay_prev
        relay_prev = relay
        t += 30
    assert starts <= 3


def test_hard_frost_overrides_start_limit_and_min_off():
    g = BoilerGuard(state=BoilerState.REST, since=0.0, starts=[0.0, 1.0, 2.0])
    g.step(CFG, 60, want_fire=True, want_stop=False, hard_frost=True)
    assert g.state is BoilerState.LEAD


def test_force_stop_still_honours_minimum_burn():
    g = BoilerGuard()
    run(g, 0, 120, want_fire=True, want_stop=False)
    assert g.step(CFG, 150, want_fire=False, want_stop=False, force_stop=True)
    assert not g.step(CFG, 700, want_fire=False, want_stop=False, force_stop=True)
