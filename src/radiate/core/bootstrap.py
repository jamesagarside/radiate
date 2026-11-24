"""Bootstrap: warm the learner from recorded history (spec 4.3). Pure: no I/O.

The recorded ticks are replayed through `decide` from priors with a throwaway state,
carried across restarts as a restart would. Only what was learned is kept: each
room's model, arrival lags and lockshield histogram, with their provenance. Everything that depends on the
present (the boiler guard, timers, disturbances, valve verdicts, the day's
accounting) comes from the saved state, or starts fresh when there is none.

The result is engine data in the `persist` format, so the caller loads it with
`load_state` as it would any saved state, and a replay can rebuild it exactly.
"""

from __future__ import annotations

import copy
from collections.abc import Iterable
from typing import Any

from .decide import EngineState
from .history import Entry, Replayer
from .persist import VERSION, dump_state, migrate, readable
from .types import HouseConfig

LEARNED = ("est", "learned", "lag_samples", "lockshield_hist")


def needs_bootstrap(saved: Any) -> bool:
    """No saved engine state, or one this version cannot read (a newer version's). An
    older version's is migrated instead (ADR-0007)."""
    return not readable(saved)


def learn(cfg: HouseConfig, entries: Iterable[Entry]) -> tuple[EngineState | None, int]:
    """Replay `entries` from priors. Returns the final state and the ticks used."""
    replayer = Replayer(cfg, fresh=True)
    ticks = sum(1 for _ in replayer.run(entries))
    return replayer.state, ticks


def learned_parts(state: EngineState) -> dict[str, dict[str, Any]]:
    """Each room's model, provenance, arrival lags and lockshield histogram, as plain
    data."""
    rooms = dump_state(state, state.last_now or 0.0)["rooms"]
    return {rid: {k: room[k] for k in LEARNED} for rid, room in rooms.items()}


def merge(saved: Any, learned: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """`saved` engine data (or none) with each room's learned parts replaced."""
    data = migrate(saved)[0] if not needs_bootstrap(saved) else {"version": VERSION}
    data = copy.deepcopy(data)
    rooms = data.get("rooms")
    if not isinstance(rooms, dict):
        rooms = data["rooms"] = {}
    for rid, parts in learned.items():
        room = rooms.get(rid)
        rooms[rid] = {**(room if isinstance(room, dict) else {}), **copy.deepcopy(parts)}
    return data


def bootstrap(
    cfg: HouseConfig, entries: Iterable[Entry], saved: Any = None
) -> tuple[dict[str, Any] | None, int]:
    """Engine data with models learned from `entries`, or None if there were no ticks."""
    state, ticks = learn(cfg, entries)
    if state is None or ticks == 0:
        return None, 0
    return merge(saved, learned_parts(state)), ticks
