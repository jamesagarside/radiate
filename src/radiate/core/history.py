"""Tick history and replay (spec 4.3, 6). Pure: no I/O, no clock.

The live runtime records every tick: its snapshot and a compact form of its actions
(valve settings, relays, boiler state, reason and alert codes). Replaying feeds the
recorded snapshots back through `decide` in order, so the same code and configuration
give the same actions, and a change to either shows where Radiate would have acted
differently.

Replay is open loop. The recorded temperatures and relay states are what happened
under the recorded actions; a replay with another configuration shows what Radiate
would have decided, not how the house would have responded.

A history is a sequence of entries, each with a kind:

- `start`: a process started. It carries what the live engine state was built from
  (the saved engine data, the clock reading and the downtime passed to `load_state`),
  so a replay rebuilds that state exactly.
- `tick`: one control step.
- `checkpoint`: the engine state as `dump_state` saves it, every few hours. A replay
  begins from one only when the start entry has been pruned. It is approximate:
  saved state leaves out short-lived signals, which rebuild within a few ticks.

Each process has its own monotonic clock, so snapshots from different processes
(segments) are not on one time line. Within a segment the recorded times are used as
they are. Across a restart, the replay either takes the state the live runtime
loaded (saved state) or carries its own state over as a restart would: saved with
`dump_state` at the last tick and loaded at the new clock, moved on by the wall-clock
gap.
"""

from __future__ import annotations

import dataclasses
import typing
from collections.abc import Iterable, Iterator
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .decide import EngineState, decide
from .persist import dump_state, load_state
from .types import Actions, HouseConfig, Mode, Reason, RoomInput, RoomRole, Snapshot

SCHEMA_VERSION = 1
START = "start"
TICK = "tick"
CHECKPOINT = "checkpoint"
# Order of a valve's settings in the compact actions.
VALVE_FIELDS = ("setpoint", "opening", "closing", "external_temperature", "pre_opening")
MAX_TICK_GAP_S = 5 * 60  # longer gaps between ticks are not counted in the summary


@dataclass(frozen=True, slots=True)
class Entry:
    kind: str  # START, TICK or CHECKPOINT
    wall: float  # Unix time when it was recorded
    segment: int  # one value per process start
    data: dict[str, Any]


# --- encoding ------------------------------------------------------------------------


def _plain(value: Any) -> Any:
    return value.value if isinstance(value, Enum) else value


def _encode(obj: Any, skip: tuple[str, ...] = ()) -> dict[str, Any]:
    """Fields by name; optional fields left out when they hold their default."""
    out: dict[str, Any] = {}
    for f in dataclasses.fields(obj):
        if f.name in skip:
            continue
        value = getattr(obj, f.name)
        if f.default is not dataclasses.MISSING and value == f.default:
            continue
        out[f.name] = _plain(value)
    return out


_HINTS: dict[type, dict[str, Any]] = {}


def _enum_type(cls: type, name: str) -> type[Enum] | None:
    hints = _HINTS.get(cls)
    if hints is None:
        hints = _HINTS[cls] = typing.get_type_hints(cls)
    hint = hints.get(name)
    for t in (hint, *typing.get_args(hint)):
        if isinstance(t, type) and issubclass(t, Enum):
            return t
    return None


def _decode(cls: type, data: dict[str, Any], **extra: Any) -> Any:
    """Build `cls` from `_encode` output. Unknown keys (a newer schema) are ignored."""
    names = {f.name for f in dataclasses.fields(cls)}
    kwargs = dict(extra)
    for key, value in data.items():
        if key not in names or key in kwargs:
            continue
        enum = _enum_type(cls, key)
        kwargs[key] = enum(value) if enum is not None and value is not None else value
    return cls(**kwargs)


def encode_snapshot(snap: Snapshot) -> dict[str, Any]:
    out = _encode(snap, skip=("rooms",))
    out["rooms"] = {rid: _encode(inp) for rid, inp in snap.rooms.items()}
    return out


def decode_snapshot(data: dict[str, Any]) -> Snapshot:
    """Raises KeyError, TypeError or ValueError on a malformed entry."""
    rooms = {str(rid): _decode(RoomInput, raw) for rid, raw in data["rooms"].items()}
    return _decode(Snapshot, data, rooms=rooms)


def _reason(r: Reason) -> list[str]:
    return [r.code] if r.room_id is None else [r.code, r.room_id]


def compact_actions(actions: Actions) -> dict[str, Any]:
    """What a tick decided, without messages and values: enough to compare and summarise."""
    valves = {}
    for rid, v in actions.valves.items():
        row = [getattr(v, name) for name in VALVE_FIELDS]
        while row and row[-1] is None:
            row.pop()
        valves[rid] = row
    out: dict[str, Any] = {
        "heating": actions.heating_relay,
        "store": actions.store_relay,
        "boiler": actions.boiler_state.value,
        "valves": valves,
    }
    if actions.reasons:
        out["reasons"] = [_reason(r) for r in actions.reasons]
    if actions.alerts:
        out["alerts"] = [_reason(r) for r in actions.alerts]
    if actions.safe_mode:
        out["safe_mode"] = True
    return out


def tick_data(snap: Snapshot, actions: dict[str, Any]) -> dict[str, Any]:
    return {"v": SCHEMA_VERSION, "snapshot": encode_snapshot(snap), "actions": actions}


def start_data(now: float, engine: Any, elapsed_s: float) -> dict[str, Any]:
    """How the live state was built: `load_state(cfg, engine, now, elapsed_s)`, or
    `EngineState.new(cfg)` when `engine` is None."""
    return {"v": SCHEMA_VERSION, "now": now, "engine": engine, "elapsed_s": elapsed_s}


def checkpoint_data(state: EngineState, now: float) -> dict[str, Any]:
    return {"v": SCHEMA_VERSION, "now": now, "engine": dump_state(state, now)}


def start_state(cfg: HouseConfig, data: dict[str, Any]) -> EngineState:
    engine = data.get("engine")
    if engine is None:
        return EngineState.new(cfg)
    state, _ = load_state(cfg, engine, float(data["now"]), float(data.get("elapsed_s", 0.0)))
    return state


# --- comparison ----------------------------------------------------------------------


def _codes(items: Any) -> list[str]:
    return sorted(":".join(str(x) for x in item) for item in items or [])


def _onoff(value: Any) -> Any:
    return ("on" if value else "off") if isinstance(value, bool) else value


def diff_actions(recorded: dict[str, Any], replayed: dict[str, Any]) -> list[dict[str, Any]]:
    """Where two compact actions differ: `{"what", "recorded", "replayed"}` items.

    Reasons and alerts are compared as sets of `code` or `code:room` strings; the
    driver's alerts are not part of `decide` and are left out.
    """
    out: list[dict[str, Any]] = []

    def add(what: str, a: Any, b: Any) -> None:
        if a != b:
            out.append({"what": what, "recorded": a, "replayed": b})

    add("heating relay", _onoff(recorded.get("heating")), _onoff(replayed.get("heating")))
    add("store relay", _onoff(recorded.get("store")), _onoff(replayed.get("store")))
    add("boiler", recorded.get("boiler"), replayed.get("boiler"))
    add("safe mode", bool(recorded.get("safe_mode")), bool(replayed.get("safe_mode")))
    rv, pv = recorded.get("valves") or {}, replayed.get("valves") or {}
    for rid in sorted(set(rv) | set(pv)):
        a, b = rv.get(rid), pv.get(rid)
        if a is None or b is None:
            add(f"{rid} valve", "written" if a else None, "written" if b else None)
            continue
        for i, name in enumerate(VALVE_FIELDS):
            add(
                f"{rid} {name.replace('_', ' ')}",
                a[i] if i < len(a) else None,
                b[i] if i < len(b) else None,
            )
    for key in ("reasons", "alerts"):
        a, b = _codes(recorded.get(key)), _codes(replayed.get(key))
        if a != b:
            gone = [c for c in a if c not in b]
            new = [c for c in b if c not in a]
            out.append({"what": key, "recorded": gone, "replayed": new})
    return out


# --- replay --------------------------------------------------------------------------


@dataclass(slots=True)
class ReplayTick:
    wall: float
    segment: int
    snapshot: Snapshot
    recorded: dict[str, Any]
    replayed: dict[str, Any]
    differences: list[dict[str, Any]]


@dataclass
class Replayer:
    """Runs recorded entries through `decide`.

    `fresh=False` (saved state): start from the state the live runtime started from,
    and take it again at every restart, so the same code reproduces the recorded
    actions exactly. Ticks before the first start or checkpoint entry are skipped.
    `fresh=True`: start from priors at the first tick at or after `start`, and carry
    the replayed state across restarts.

    Ticks before `start` (Unix time) warm the state up and are not yielded; the run
    stops after `end`.
    """

    cfg: HouseConfig
    fresh: bool = False
    start: float | None = None
    end: float | None = None
    state: EngineState | None = None
    began: str | None = None  # "start", "checkpoint" or "priors"
    ticks: int = 0  # ticks yielded
    restarts: int = 0
    skipped: int = 0  # ticks with no state to replay them from (saved state only)
    unreadable: int = 0  # entries that could not be decoded
    notes: list[str] = field(default_factory=list)
    last_now: float | None = None
    _last_wall: float | None = None
    _segment: int | None = None

    def run(self, entries: Iterable[Entry]) -> Iterator[ReplayTick]:
        for e in entries:
            if self.end is not None and e.wall > self.end:
                break
            if not isinstance(e.data, dict) or e.data.get("v") != SCHEMA_VERSION:
                self.unreadable += 1
                continue
            if e.kind == START:
                self._on_start(e)
            elif e.kind == CHECKPOINT:
                self._on_checkpoint(e)
            elif e.kind == TICK:
                tick = self._on_tick(e)
                if tick is not None and (self.start is None or e.wall >= self.start):
                    self.ticks += 1
                    yield tick

    def _on_start(self, e: Entry) -> None:
        if self._segment is not None and e.segment != self._segment:
            self.restarts += 1
        try:
            if self.fresh:
                if self.state is not None:
                    self._carry(float(e.data["now"]), e.wall)
            else:
                self.state = start_state(self.cfg, e.data)
                self.began = self.began or START
        except (KeyError, TypeError, ValueError):
            self.unreadable += 1
            return
        self._segment = e.segment

    def _on_checkpoint(self, e: Entry) -> None:
        if self.fresh or self.state is not None:
            return
        try:
            self.state, _ = load_state(self.cfg, e.data["engine"], float(e.data["now"]))
        except (KeyError, TypeError, ValueError):
            self.unreadable += 1
            return
        self.began = CHECKPOINT
        self._segment = e.segment
        self.notes.append(
            "began from a checkpoint: short-lived signals rebuild over the first ticks, "
            "so early differences may come from that"
        )

    def _on_tick(self, e: Entry) -> ReplayTick | None:
        try:
            snap = decode_snapshot(e.data["snapshot"])
            recorded = e.data["actions"]
            if not isinstance(recorded, dict):
                raise TypeError("actions")
        except (KeyError, TypeError, ValueError, AttributeError):
            self.unreadable += 1
            return None
        if self._segment is not None and e.segment != self._segment:
            # A restart whose start entry is missing (pruned or not written).
            self.restarts += 1
            if self.state is not None:
                self._carry(snap.now, e.wall)
                self.notes.append(
                    "a restart had no start entry: state carried over as a save and load"
                )
        self._segment = e.segment
        if self.state is None:
            if not self.fresh:
                self.skipped += 1
                return None
            if self.start is not None and e.wall < self.start:
                return None
            self.state = EngineState.new(self.cfg)
            self.began = "priors"
        actions = decide(self.cfg, snap, self.state)
        self.last_now, self._last_wall = snap.now, e.wall
        replayed = compact_actions(actions)
        return ReplayTick(
            e.wall, e.segment, snap, recorded, replayed, diff_actions(recorded, replayed)
        )

    def _carry(self, now: float, wall: float) -> None:
        """Move the state to a new process clock, as a save and restart would."""
        if self.state is None or self.last_now is None or self._last_wall is None:
            return
        data = dump_state(self.state, self.last_now)
        self.state, _ = load_state(self.cfg, data, now, max(0.0, wall - self._last_wall))
        self.last_now = None


# --- summary -------------------------------------------------------------------------


@dataclass
class Tally:
    """Burns, starts, relay hours and alerts from a run of compact actions, plus the
    time rooms spent below their setpoint in the recorded snapshots."""

    hours: float = 0.0
    starts: int = 0
    burns_min: list[float] = field(default_factory=list)
    heating_h: float = 0.0
    store_h: float = 0.0
    below_h: dict[str, float] = field(default_factory=dict)
    alerts: dict[str, dict[str, float]] = field(default_factory=dict)
    _prev: tuple[int, float, bool, frozenset[str]] | None = None
    _burn_from: float | None = None

    def add(self, cfg: HouseConfig, segment: int, snap: Snapshot, actions: dict[str, Any]) -> None:
        now = snap.now
        heating = bool(actions.get("heating"))
        codes = frozenset(str(a[0]) for a in actions.get("alerts") or [])
        prev = self._prev
        same = prev is not None and prev[0] == segment and 0 <= now - prev[1] <= MAX_TICK_GAP_S
        dt = now - prev[1] if same else 60.0
        if not same:
            self._burn_from = now if heating else None
        self.hours += dt / 3600
        if heating:
            self.heating_h += dt / 3600
        if actions.get("store"):
            self.store_h += dt / 3600
        was_heating = same and prev[2]
        if heating and not was_heating and same:
            self.starts += 1
            self._burn_from = now
        elif not heating and was_heating and self._burn_from is not None:
            self.burns_min.append((now - self._burn_from) / 60)
            self._burn_from = None
        for code in codes:
            item = self.alerts.setdefault(code, {"onsets": 0, "minutes": 0.0})
            item["minutes"] += dt / 60
            if not same or code not in prev[3]:
                item["onsets"] += 1
        if snap.mode is Mode.AUTO:
            limit = cfg.boiler.comfort_limit_k
            for rc in cfg.rooms:
                inp = snap.rooms.get(rc.id)
                if rc.role is not RoomRole.NORMAL or inp is None or inp.temperature is None:
                    continue
                if inp.temperature < inp.setpoint - limit:
                    self.below_h[rc.id] = self.below_h.get(rc.id, 0.0) + dt / 3600
        self._prev = (segment, now, heating, codes)

    def as_dict(self) -> dict[str, Any]:
        burns = self.burns_min
        return {
            "hours": round(self.hours, 2),
            "starts": self.starts,
            "burns": len(burns),
            "mean_burn_min": round(sum(burns) / len(burns), 1) if burns else None,
            "shortest_burn_min": round(min(burns), 1) if burns else None,
            "heating_relay_h": round(self.heating_h, 2),
            "store_relay_h": round(self.store_h, 2),
            "below_setpoint_room_h": round(sum(self.below_h.values()), 2),
            "below_setpoint_h": {k: round(v, 2) for k, v in sorted(self.below_h.items())},
            "alerts": {
                k: {"onsets": int(v["onsets"]), "minutes": round(v["minutes"])}
                for k, v in sorted(self.alerts.items())
            },
        }
