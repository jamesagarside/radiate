"""Room use in `eco` against `eco`, `comfort` and the savings baseline as a timer
(efficiency plan, slice 6).

`radiate sim-efficiency` runs every scenario, seed and policy on the simulated
reference house and prints one table per scenario: the mean across seeds, with the
lowest and highest seed in brackets, then the acceptance checks against `eco`.

The savings estimator check (the estimate from `radiate.core.savings` against the
simulated true saving) needs slice 3; `estimator_check` is the hook for it.
"""

from __future__ import annotations

import dataclasses
import random
from collections.abc import Callable, Iterable, Sequence
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field
from typing import Any

from radiate.core import DAMP_FLOOR_C, DemandMode

from .reference import house_config
from .runner import Result, run

POLICIES = ("eco", "eco+use", "comfort", "timer")
DAY_SPREAD_K = 3.0  # each day's outdoor mean varies by up to this much either way
# Acceptance (plan slice 6, and the owner's brief): comfort in rooms in use.
DEFICIT_TOLERANCE = 0.10  # eco+use's warm-period deficit at most this much above eco's
FLOOR_SLACK_K = 0.3  # a room at its damp floor reads 12 °C; heat arrives a little later


@dataclass(frozen=True)
class Scenario:
    name: str
    text: str
    schedule: str
    outdoor_c: float
    pump_qmax: float | None = None
    vary: bool = True  # day means vary by DAY_SPREAD_K, from the seed


SCENARIOS: dict[str, Scenario] = {
    s.name: s
    for s in (
        Scenario(
            "fixed",
            "Fixed reference schedule (no room use), outdoor mean 4 °C",
            "fixed",
            4.0,
            vary=False,
        ),
        Scenario(
            "mild",
            "Reference household, outdoor day means 4 °C ± 3 K",
            "household",
            4.0,
        ),
        Scenario(
            "cold",
            "Reference household, outdoor day means −2 °C ± 3 K, small pump (0.15 kg/s)",
            "household",
            -2.0,
            pump_qmax=0.15,
        ),
        Scenario(
            "owner",
            "Owner-like hand-written schedules with use levels, outdoor day means 4 °C ± 3 K",
            "owner",
            4.0,
        ),
        Scenario(
            "owner_cold",
            "Owner-like hand-written schedules, outdoor day means −2 °C ± 3 K, small pump",
            "owner",
            -2.0,
            pump_qmax=0.15,
        ),
    )
}


def outdoor_days(scenario: Scenario, days: int, seed: int) -> list[float] | None:
    if not scenario.vary:
        return None
    rng = random.Random(f"outdoor:{seed}")
    return [scenario.outdoor_c + rng.uniform(-DAY_SPREAD_K, DAY_SPREAD_K) for _ in range(days)]


def run_policy(scenario: Scenario, policy: str, days: int, warmup: int, seed: int) -> Result:
    if policy not in POLICIES:
        raise ValueError(f"unknown policy {policy!r}")
    cfg = house_config()
    mode = DemandMode.COMFORT if policy == "comfort" else DemandMode.ECO
    cfg = dataclasses.replace(cfg, boiler=dataclasses.replace(cfg.boiler, demand_mode=mode))
    res = run(
        "timer" if policy == "timer" else "radiate",
        days,
        warmup,
        seed,
        cfg=cfg,
        outdoor_mean=scenario.outdoor_c,
        pump_qmax=scenario.pump_qmax,
        schedule=scenario.schedule,
        room_use=policy == "eco+use",
        outdoor_by_day=outdoor_days(scenario, days, seed),
    )
    res.engine = None  # not needed, and not cheap to send between processes
    res.last_actions = None
    return res


@dataclass(frozen=True)
class Metric:
    label: str
    get: Callable[[Result], float]
    digits: int = 1


METRICS = (
    Metric("Oil, burner firing (l)", lambda r: r.oil_litres),
    Metric("Oil, relay time (l)", lambda r: r.relay_litres),
    Metric("Relay starts", lambda r: r.relay_starts, 0),
    Metric("Burner starts", lambda r: r.burner_starts, 0),
    Metric("Burner hours", lambda r: r.burner_hours),
    Metric("Warm-period deficit (K·min)", lambda r: r.warm_deficit_kmin, 0),
    Metric("Comfort deficit (K·h)", lambda r: r.comfort_deficit_kh),
    Metric("Setback rooms' mean (°C)", lambda r: r.setback_mean_c or float("nan")),
    Metric("Lowest room (°C)", lambda r: r.min_room_c),
    Metric("Room-minutes below 12 °C", lambda r: r.below_floor_min, 0),
    Metric("Guard violations", lambda r: r.guard_violations, 0),
    Metric("Relay min, no TRV open", lambda r: r.no_open_valve_s / 60, 0),
)


@dataclass
class ScenarioResult:
    scenario: Scenario
    seeds: tuple[int, ...]
    runs: dict[str, list[Result]] = field(default_factory=dict)  # by policy, seed order

    def mean(self, policy: str, get: Callable[[Result], float]) -> float:
        values = [get(r) for r in self.runs[policy]]
        return sum(values) / len(values)

    def lowest(self, policy: str) -> tuple[float, float, str]:
        return min(r.min_room for r in self.runs[policy])


def _fmt(value: float, digits: int) -> str:
    if value != value:  # NaN
        return "n/a"
    return f"{value:.{digits}f}"


def _cell(values: Sequence[float], digits: int) -> str:
    mean = sum(values) / len(values)
    if len(values) == 1 or max(values) == min(values):
        return _fmt(mean, digits)
    return f"{_fmt(mean, digits)} ({_fmt(min(values), digits)} to {_fmt(max(values), digits)})"


def table(result: ScenarioResult, policies: Sequence[str] = POLICIES) -> str:
    """One Markdown table: metrics down, policies across."""
    head = "| Metric | " + " | ".join(policies) + " |"
    rule = "|---" * (len(policies) + 1) + "|"
    rows = [head, rule]
    for m in METRICS:
        cells = [_cell([m.get(r) for r in result.runs[p]], m.digits) for p in policies]
        rows.append(f"| {m.label} | " + " | ".join(cells) + " |")
    return "\n".join(rows)


@dataclass(frozen=True)
class Check:
    name: str
    passed: bool
    detail: str


def checks(result: ScenarioResult) -> list[Check]:
    """The acceptance checks for eco+use against eco (plan slice 6)."""
    if "eco" not in result.runs or "eco+use" not in result.runs:
        return []
    out: list[Check] = []
    eco_oil = result.mean("eco", lambda r: r.oil_litres)
    use_oil = result.mean("eco+use", lambda r: r.oil_litres)
    change = (use_oil - eco_oil) / eco_oil * 100 if eco_oil else 0.0
    fixed = result.scenario.schedule == "fixed"
    if fixed:
        same = all(
            _key(a) == _key(b)
            for a, b in zip(result.runs["eco"], result.runs["eco+use"], strict=True)
        )
        out.append(Check("eco and eco+use identical (no room use)", same, ""))
    else:
        out.append(
            Check(
                "eco+use burns less oil than eco",
                use_oil < eco_oil,
                f"{use_oil:.1f} against {eco_oil:.1f} l ({change:+.1f} %)",
            )
        )
    eco_def = result.mean("eco", lambda r: r.warm_deficit_kmin)
    use_def = result.mean("eco+use", lambda r: r.warm_deficit_kmin)
    rise = (use_def - eco_def) / eco_def * 100 if eco_def else 0.0
    out.append(
        Check(
            "warm-period deficit at most 10 % above eco",
            use_def <= eco_def * (1 + DEFICIT_TOLERANCE),
            f"{use_def:.0f} against {eco_def:.0f} K·min ({rise:+.1f} %)",
        )
    )
    t, sp, rid = result.lowest("eco+use")
    floor = min(sp, DAMP_FLOOR_C)
    within = "within" if t >= floor - FLOOR_SLACK_K else "more than"
    out.append(
        Check(
            f"no room below the damp floor ({DAMP_FLOOR_C:.0f} °C, true room temperature)",
            t >= floor,
            f"lowest {t:.2f} °C ({rid}, setpoint {sp:.1f} °C), {within} {FLOOR_SLACK_K} K "
            f"of the floor; "
            f"{result.mean('eco+use', lambda r: r.below_floor_min):.0f} room-minutes below "
            f"{DAMP_FLOOR_C:.0f} °C a run",
        )
    )
    eco_starts = result.mean("eco", lambda r: r.relay_starts)
    use_starts = result.mean("eco+use", lambda r: r.relay_starts)
    out.append(
        Check(
            "relay starts do not rise",
            use_starts <= eco_starts,
            f"{use_starts:.1f} against {eco_starts:.1f}",
        )
    )
    return out


def _key(r: Result) -> tuple:
    return (
        r.burner_starts,
        round(r.burner_hours, 9),
        r.relay_starts,
        round(r.relay_on_s, 3),
        round(r.warm_deficit_kmin, 6),
        r.min_room,
    )


def estimator_check(result: ScenarioResult, days: int) -> str:
    """Hook for the savings estimator check (plan slice 6), which needs slice 3.

    The true saving is the timer's relay litres less eco+use's over the measured days.
    The estimate, once `radiate.core.savings` exists, is `report()` over the eco+use
    runs' closed days with `SavingsParams(min_days=14)`, with `b / a` and with equal
    weights; it should come within 30 % or 0.3 litres a day of the truth, same sign.
    """
    if "timer" not in result.runs or "eco+use" not in result.runs:
        return "Estimator check: needs the timer and eco+use policies."
    truth = result.mean("timer", lambda r: r.relay_litres) - result.mean(
        "eco+use", lambda r: r.relay_litres
    )
    try:
        from radiate.core import savings  # noqa: F401  (efficiency slice 3)
    except ImportError:
        return (
            f"Estimator check: not run, `radiate.core.savings` (efficiency slice 3) is not "
            f"merged. True saving, timer less eco+use relay litres: {truth:.1f} l over "
            f"{days} days ({truth / days:.2f} l a day)."
        )
    # SLICE 3 HOOK: compare report() over the eco+use runs' day summaries with `truth`.
    return (
        f"Estimator check: `radiate.core.savings` is present but the comparison is not "
        f"wired up yet. True saving: {truth:.1f} l over {days} days."
    )


def _job(args: tuple[str, str, int, int, int]) -> tuple[str, str, int, Result]:
    name, policy, days, warmup, seed = args
    return name, policy, seed, run_policy(SCENARIOS[name], policy, days, warmup, seed)


def compare(
    scenarios: Iterable[str],
    seeds: Sequence[int],
    days: int = 24,
    warmup: int = 3,
    policies: Sequence[str] = POLICIES,
    workers: int | None = None,
) -> list[ScenarioResult]:
    names = list(scenarios)
    for name in names:
        if name not in SCENARIOS:
            raise ValueError(f"unknown scenario {name!r}; expected {', '.join(SCENARIOS)}")
    jobs = [(n, p, days, warmup, s) for n in names for p in policies for s in seeds]
    if workers == 1:
        done = [_job(j) for j in jobs]
    else:
        with ProcessPoolExecutor(max_workers=workers) as pool:
            done = list(pool.map(_job, jobs))
    results = {n: ScenarioResult(SCENARIOS[n], tuple(seeds)) for n in names}
    for name, policy, _, res in done:  # jobs keep their order, so seeds stay in order
        results[name].runs.setdefault(policy, []).append(res)
    return [results[n] for n in names]


def report(results: Sequence[ScenarioResult], days: int, warmup: int) -> str:
    lines: list[str] = []
    for r in results:
        seeds = ", ".join(str(s) for s in r.seeds)
        lines.append(f"### {r.scenario.name}: {r.scenario.text}")
        lines.append("")
        lines.append(
            f"{days} days, the first {warmup} for learning, {days - warmup} measured. "
            f"Mean of seeds {seeds}; lowest and highest seed in brackets."
        )
        lines.append("")
        lines.append(table(r, [p for p in POLICIES if p in r.runs]))
        lines.append("")
        for c in checks(r):
            mark = "pass" if c.passed else "FAIL"
            lines.append(f"- {mark}: {c.name}" + (f": {c.detail}" if c.detail else ""))
        lines.append(f"- {estimator_check(r, days - warmup)}")
        lines.append("")
    return "\n".join(lines)


def main(args: Any) -> None:
    seeds = tuple(int(s) for s in str(args.seeds).split(",") if s.strip())
    names = [s.strip() for s in str(args.scenarios).split(",") if s.strip()]
    results = compare(names, seeds, args.days, args.warmup, workers=args.workers)
    print(report(results, args.days, args.warmup))
