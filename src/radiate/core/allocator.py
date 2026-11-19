"""Deadline-aware synchronised arrival (spec 4.4).

Each heating room needs rate `gap / tau + loss` to reach its target in `tau` hours.

- Rooms that are already late (reactive demand) pace together: the slowest
  flow-limited one at full opening sets `T*`, and the others are throttled to arrive
  at about the same time.
- Rooms preheating for a scheduled setpoint (optimum start) have a deadline. They are
  throttled only as far as still gets them there just in time, never later.

Throttling raises the supply factor for everyone, so the solve iterates.

This is a joint, model-based allocation across the house. It is deliberately not a
per-radiator rule that throttles whichever radiator heats fastest (see
docs/research/provenance.md for the patents to clear).
"""

from __future__ import annotations

from dataclasses import dataclass

from .valve import flow_fraction, opening_for, supply_factor


@dataclass(frozen=True, slots=True)
class AllocRoom:
    id: str
    gap_k: float  # setpoint minus temperature, > 0 when calling
    a: float  # heating gain, K/h at full flow and S = 1
    net_loss_kph: float  # b * (T - T_out) - d, K/h the radiator must also cover
    eta: float = 0.7  # flow sensitivity; < 0.2 means emitter-limited
    sets_pace: bool = True  # False for low-confidence rooms (e.g. internal sensor only)
    deadline_h: float | None = None  # preheat: hours until the scheduled setpoint applies


@dataclass(frozen=True, slots=True)
class Allocation:
    openings: dict[str, int]
    t_star_h: float
    supply: float
    capacity_limited: bool


EMITTER_LIMITED_ETA = 0.2
DEADLINE_SAFETY = 1.25  # aim to arrive this much earlier than the deadline


def allocate(
    rooms: list[AllocRoom],
    *,
    kappa: float,
    bypass: float,
    floor: int,
    horizon_max_h: float,
    iterations: int = 4,
) -> Allocation:
    """Openings (0..100) so calling rooms reach setpoint together."""
    if not rooms:
        return Allocation({}, 0.0, supply_factor(0.0, kappa, bypass), False)

    fractions = {r.id: 1.0 for r in rooms}
    t_star = 0.0
    supply = 1.0
    limited = False

    for _ in range(iterations):
        supply = supply_factor(sum(fractions.values()), kappa, bypass)
        # Fastest possible arrival for each room at full opening.
        best: dict[str, float] = {}
        for r in rooms:
            net = r.a * supply - r.net_loss_kph
            best[r.id] = r.gap_k / net if net > 1e-6 else float("inf")

        reactive = [r for r in rooms if r.deadline_h is None]
        pacers = [r for r in reactive if r.sets_pace and r.eta >= EMITTER_LIMITED_ETA] or reactive
        t_pace = max((best[r.id] for r in pacers), default=0.0)

        # Capacity-limited: the slowest room cannot make it within the horizon. Pace at
        # the horizon so it still gets as much flow as possible.
        limited = t_pace > horizon_max_h
        if limited:
            t_pace = horizon_max_h

        new: dict[str, float] = {}
        t_star = 0.0
        for r in rooms:
            tau = t_pace if r.deadline_h is None else r.deadline_h / DEADLINE_SAFETY
            if r.eta < EMITTER_LIMITED_ETA or tau <= 0.0 or best[r.id] >= tau:
                new[r.id] = 1.0
                t_star = max(t_star, min(best[r.id], horizon_max_h))
                continue
            needed = r.gap_k / tau + r.net_loss_kph
            new[r.id] = max(0.0, min(1.0, needed / (r.a * supply)))
            t_star = max(t_star, tau)
        fractions = new

    floor_fraction = flow_fraction(floor)
    openings = {}
    for rid, frac in fractions.items():
        frac = max(frac, floor_fraction)
        openings[rid] = max(floor, min(100, round(opening_for(frac))))
    return Allocation(openings, t_star, supply, limited)
