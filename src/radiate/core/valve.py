"""Valve characteristic: commanded opening % to effective flow fraction (spec 4.1)."""

from __future__ import annotations

O_DEAD = 8.0
O_SAT = 70.0
GAMMA = 0.7


def flow_fraction(opening: float, o_dead: float = O_DEAD, o_sat: float = O_SAT) -> float:
    """Effective flow fraction 0..1 for a TRV opening percentage."""
    if opening <= o_dead:
        return 0.0
    x = min(1.0, (opening - o_dead) / (o_sat - o_dead))
    return x**GAMMA


def opening_for(fraction: float, o_dead: float = O_DEAD, o_sat: float = O_SAT) -> float:
    """Inverse of `flow_fraction`: the opening % that gives a flow fraction."""
    if fraction <= 0.0:
        return 0.0
    if fraction >= 1.0:
        return 100.0
    return o_dead + (o_sat - o_dead) * fraction ** (1.0 / GAMMA)


def supply_factor(total_fraction: float, kappa: float, bypass: float) -> float:
    """Share of boiler flow each open radiator gets; falls as more valves open."""
    return 1.0 / (1.0 + kappa * (total_fraction + bypass))
