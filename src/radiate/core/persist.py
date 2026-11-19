"""Engine state to and from plain data, for persistence across restarts (spec 4.3, 7).

Pure: no I/O. Times in `EngineState` are on the caller's monotonic clock, which
restarts with the process, so they are stored as ages relative to `now` and restored
against the new clock, with the wall time spent down added on top. A restart in the
middle of a burn therefore still honours minimum burn, and a restart during REST
still honours minimum off.

Kept: learned room models, arrival lags, lockshield histograms, disturbance hold-offs,
the boiler guard and the short-cycle adaptation. Dropped: short-lived signals (reading
windows, radiator drive, demand latches, the no-heat check), which rebuild within a
few ticks. Sections added after version 1 are optional, so older saves still load.

Corrupt or out-of-range room data resets that room to priors (spec 7).
"""

from __future__ import annotations

import math
from typing import Any

from .boiler import BoilerGuard
from .decide import EngineState, RoomState
from .disturbance import DisturbanceState
from .estimator import RoomEstimator
from .types import BoilerState, HeatSource, HouseConfig

VERSION = 1
_DIST_TIMES = ("window_until", "shower_until", "fire_since", "fire_holdoff_until", "spike_until")


def _age(t: float | None, now: float) -> float | None:
    if t is None or not math.isfinite(t) or abs(t) > 1e11:
        return None
    return now - t


def _at(age: Any, now: float, elapsed: float) -> float | None:
    if not isinstance(age, (int, float)) or not math.isfinite(age):
        return None
    return now - age - elapsed


def dump_state(st: EngineState, now: float) -> dict[str, Any]:
    rooms = {}
    for rid, rs in st.rooms.items():
        e = rs.est
        d = rs.dist
        rooms[rid] = {
            "est": {
                "theta": list(e.theta),
                "p": [list(row) for row in e.p],
                "samples": e.samples,
                "rejected": e.rejected,
                "residual_var": e.residual_var,
            },
            "lag_samples": list(rs.lag_samples),
            "lockshield_hist": list(rs.lockshield_hist),
            "dist": {
                "fire": d.fire,
                "spike_kind": d.spike_kind,
                **{k: _age(getattr(d, k), now) for k in _DIST_TIMES},
            },
        }
    g = st.boiler
    sc = st.short_cycle
    return {
        "version": VERSION,
        "rooms": rooms,
        "boiler": {
            "state": g.state.value,
            "since": _age(g.since, now),
            "starts": [_age(t, now) for t in g.starts],
            "burn_started_at": _age(g.burn_started_at, now),
        },
        "health": {
            "short_cycle": {
                "starts": [_age(t, now) for t in sc.starts],
                "cut_burns": [_age(t, now) for t in sc.cut_burns],
                "extra_off_s": sc.extra_off_s,
                "until": _age(sc.until, now),
                "raised_at": _age(sc.raised_at, now),
            },
        },
    }


def _times(raw: Any, now: float, elapsed: float) -> list[float]:
    if not isinstance(raw, list):
        return []
    return [t for t in (_at(a, now, elapsed) for a in raw) if t is not None]


def _load_health(st: EngineState, raw: Any, now: float, elapsed: float) -> None:
    """Failure-detector state. Missing (older saves) or malformed data keeps defaults."""
    if not isinstance(raw, dict):
        return
    sc_raw = raw.get("short_cycle")
    if isinstance(sc_raw, dict):
        sc = st.short_cycle
        sc.starts = _times(sc_raw.get("starts"), now, elapsed)
        sc.cut_burns = _times(sc_raw.get("cut_burns"), now, elapsed)
        extra = sc_raw.get("extra_off_s")
        until = _at(sc_raw.get("until"), now, elapsed)
        if isinstance(extra, (int, float)) and math.isfinite(extra) and until is not None:
            sc.extra_off_s = max(0.0, min(30 * 60.0, float(extra)))
            sc.until = until
        sc.raised_at = _at(sc_raw.get("raised_at"), now, elapsed)


def _valid_estimator(data: Any, est: RoomEstimator) -> bool:
    try:
        theta = [float(v) for v in data["theta"]]
        p = [[float(v) for v in row] for row in data["p"]]
        var = float(data["residual_var"])
    except (KeyError, TypeError, ValueError):
        return False
    if len(theta) != 3 or len(p) != 3 or any(len(row) != 3 for row in p):
        return False
    flat = [*theta, *(v for row in p for v in row), var]
    if not all(math.isfinite(v) for v in flat) or var <= 0:
        return False
    if any(not lo <= v <= hi for v, (lo, hi) in zip(theta, est.bounds, strict=True)):
        return False
    return all(p[i][i] >= 0 for i in range(3))


def load_state(
    cfg: HouseConfig, data: Any, now: float, elapsed_s: float = 0.0
) -> tuple[EngineState, list[str]]:
    """Rebuild engine state. Returns the state and a list of problems found."""
    st = EngineState.new(cfg)
    problems: list[str] = []
    if not isinstance(data, dict) or data.get("version") != VERSION:
        return st, ["saved state missing or from another version: starting from priors"]
    elapsed = max(0.0, float(elapsed_s))
    rooms = data.get("rooms") if isinstance(data.get("rooms"), dict) else {}
    for rc in cfg.rooms:
        if rc.id not in st.rooms or rc.id not in rooms:
            continue
        raw = rooms[rc.id]
        rs: RoomState = st.rooms[rc.id]
        est = RoomEstimator.new(rc.heat_source is HeatSource.CONTINUOUS)
        if not isinstance(raw, dict) or not _valid_estimator(raw.get("est"), est):
            problems.append(f"{rc.id}: saved model invalid, reset to priors")
            continue
        e = raw["est"]
        est.theta = [float(v) for v in e["theta"]]
        est.p = [[float(v) for v in row] for row in e["p"]]
        est.samples = int(e.get("samples", 0))
        est.rejected = int(e.get("rejected", 0))
        est.residual_var = float(e["residual_var"])
        rs.est = est
        lags = raw.get("lag_samples", [])
        if isinstance(lags, list):
            rs.lag_samples = [float(v) for v in lags if isinstance(v, (int, float)) and v > 0][-15:]
        hist = raw.get("lockshield_hist")
        if (
            isinstance(hist, list)
            and len(hist) == 101
            and all(isinstance(v, (int, float)) and v >= 0 and math.isfinite(v) for v in hist)
        ):
            rs.lockshield_hist = [float(v) for v in hist]
        dist = raw.get("dist")
        if isinstance(dist, dict):
            d = DisturbanceState()
            d.fire = bool(dist.get("fire", False))
            if isinstance(dist.get("spike_kind"), str):
                d.spike_kind = dist["spike_kind"]
            for k in _DIST_TIMES:
                t = _at(dist.get(k), now, elapsed)
                if t is not None:
                    setattr(d, k, t)
            rs.dist = d

    g = data.get("boiler")
    if isinstance(g, dict):
        try:
            state = BoilerState(g.get("state"))
        except ValueError:
            state = BoilerState.IDLE
            problems.append("boiler: unknown saved state, starting idle")
        guard = BoilerGuard(state=state)
        since = _at(g.get("since"), now, elapsed)
        guard.since = since if since is not None else now
        guard.starts = [
            t for t in (_at(a, now, elapsed) for a in g.get("starts", []) or []) if t is not None
        ]
        guard.burn_started_at = _at(g.get("burn_started_at"), now, elapsed)
        if guard.state is BoilerState.FIRING and guard.burn_started_at is None:
            guard.burn_started_at = guard.since
        if guard.state is BoilerState.LEAD:
            # Valves were opening when Radiate stopped; start the lead again.
            guard.state, guard.since = BoilerState.IDLE, now
        st.boiler = guard
    _load_health(st, data.get("health"), now, elapsed)
    return st, problems
