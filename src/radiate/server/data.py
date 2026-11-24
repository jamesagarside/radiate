"""Raw data: search and query every recorded series (spec 9.2, `GET /api/v1/data`).

The tick history (`radiate.server.history`) keeps one compressed row a minute. Reading
a month of it means decompressing some 43,000 rows, which takes seconds on a Raspberry
Pi, so queries read a derived index instead:

- `data_series`: one row per series key (`radiate.core.series`).
- `data_hour`: one row per series and hour, with the hour's count, mean, minimum and
  maximum, and its 60 minute slots as float32 (NaN where there is no value).

`SeriesIndex.catch_up` reads ticks in recorded order from where it last stopped
(`data_index` in the key-value table), adds each to the hour it belongs to, and writes
an hour once a tick from a later hour arrives. The hour in progress stays in memory and
queries include it. After an upgrade or a restore, the runtime calls `catch_up` in small
chunks in the background, so the control loop never waits for it; until it is done,
answers say `partial`.

A query for hourly steps or wider aggregates whole hours in SQL. A finer step reads
the hours' minute slots. Either way the work grows with the hours in range, not the
ticks. The index is a cache: drop it (or bump `INDEX_VERSION`) and it is rebuilt from
the history.

No aiohttp here: the HTTP routes and the browser demo's bridge share these functions.
"""

from __future__ import annotations

import logging
import math
import time
from array import array
from collections.abc import Iterable, Mapping
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from radiate.core.history import TICK
from radiate.core.series import BY_ID, METRICS, split_key, tick_values

LOG = logging.getLogger(__name__)

INDEX_VERSION = 1
INDEX_KEY = "data_index"
SLOTS = 60  # minutes in an hour
# Steps a query can use, in seconds. A step that does not divide an hour, or a day by
# an hour, would split buckets unevenly.
STEPS = (60, 300, 900, 1800, 3600, 3 * 3600, 6 * 3600, 86400)
AUTO_POINTS = 720  # an automatic step aims for at most this many points a series
MAX_POINTS = 5000  # per series; a finer step is raised to fit
MAX_VALUES = 250_000  # points across every series in one answer
DEFAULT_SPAN_S = 86400
QUERY_CATCH_UP = 240  # ticks a query may index first, so the hour in progress is current

SCHEMA = """
CREATE TABLE IF NOT EXISTS data_series (
    id INTEGER PRIMARY KEY,
    key TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS data_hour (
    series INTEGER NOT NULL,
    hour INTEGER NOT NULL,
    n INTEGER NOT NULL,
    mean REAL NOT NULL,
    lo REAL NOT NULL,
    hi REAL NOT NULL,
    slots BLOB NOT NULL,
    PRIMARY KEY (series, hour)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS data_hour_hour ON data_hour (hour);
"""


class QueryError(ValueError):
    """A query the API rejects with 400."""


def _empty() -> list[float]:
    return [math.nan] * SLOTS


def _pack(values: list[float]) -> bytes:
    return array("f", values).tobytes()


def _unpack(blob: bytes) -> list[float]:
    out = array("f")
    out.frombytes(blob)
    return list(out)


def _stats(values: Iterable[float]) -> tuple[int, float, float, float] | None:
    vals = [v for v in values if not math.isnan(v)]
    if not vals:
        return None
    return len(vals), sum(vals) / len(vals), min(vals), max(vals)


class SeriesIndex:
    """The derived index of a tick history, in the same state database."""

    def __init__(self, store: Any, history: Any):
        self.store = store
        self.db = store.db
        self.history = history
        saved = store.get(INDEX_KEY)
        state = saved[0] if saved is not None else None
        if not isinstance(state, dict) or state.get("version") != INDEX_VERSION:
            self.db.execute("DROP TABLE IF EXISTS data_hour")
            self.db.execute("DROP TABLE IF EXISTS data_series")
            state = {"version": INDEX_VERSION, "tick_id": 0}
            store.put(INDEX_KEY, state)
        self.db.executescript(SCHEMA)
        self._done_id = int(state.get("tick_id") or 0)  # last tick of a written hour
        self._read_id = self._done_id  # last tick read into memory
        self._hour: int | None = None  # the hour in memory
        self._acc: dict[str, list[float]] = {}
        self._ids: dict[str, int] = dict(self.db.execute("SELECT key, id FROM data_series"))

    # --- building ----------------------------------------------------------------------

    def catch_up(self, budget: int = 500) -> int:
        """Index up to `budget` ticks recorded since the last call; returns how many."""
        rows = self.db.execute(
            "SELECT id, wall, data FROM history WHERE id > ? AND kind = ? ORDER BY id LIMIT ?",
            (self._read_id, TICK, budget),
        ).fetchall()
        if not rows:
            return 0
        from .history import _unpack as unpack_tick

        for row_id, wall, blob in rows:
            hour = int(wall // 3600)
            if self._hour is not None and hour != self._hour:
                self._flush()
            self._hour = hour
            slot = int(wall % 3600 // 60)
            data = unpack_tick(blob)
            for key, value in tick_values(data).items():
                self._acc.setdefault(key, _empty())[slot] = value
            self._read_id = row_id
        return len(rows)

    def behind(self) -> int:
        """Ticks recorded but not read yet."""
        row = self.db.execute(
            "SELECT COUNT(*) FROM history WHERE id > ? AND kind = ?", (self._read_id, TICK)
        ).fetchone()
        return int(row[0])

    def _series_id(self, key: str) -> int:
        sid = self._ids.get(key)
        if sid is None:
            cur = self.db.execute("INSERT INTO data_series (key) VALUES (?)", (key,))
            sid = self._ids[key] = int(cur.lastrowid)
        return sid

    def _flush(self) -> None:
        """Write the hour in memory and move the saved position past it."""
        hour, acc = self._hour, self._acc
        self._hour, self._acc = None, {}
        if hour is None:
            return
        # The tick that triggered the flush is from a later hour and not read yet,
        # so every tick up to `_read_id` belongs to this hour or an earlier one.
        done = self._read_id
        self.db.execute("BEGIN")
        try:
            for key, values in acc.items():
                sid = self._series_id(key)
                old = self.db.execute(
                    "SELECT slots FROM data_hour WHERE series = ? AND hour = ?", (sid, hour)
                ).fetchone()
                if old is not None:  # the clock went back over an hour already written
                    merged = _unpack(old[0])
                    for i, v in enumerate(values):
                        if not math.isnan(v):
                            merged[i] = v
                    values = merged
                st = _stats(values)
                if st is None:
                    continue
                self.db.execute(
                    "INSERT OR REPLACE INTO data_hour (series, hour, n, mean, lo, hi, slots) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (sid, hour, *st, _pack(values)),
                )
            self._done_id = done
            self.store.put(INDEX_KEY, {"version": INDEX_VERSION, "tick_id": done})
            days = getattr(self.history, "days", None)
            if isinstance(days, (int, float)):
                self.db.execute(
                    "DELETE FROM data_hour WHERE hour < ?", (hour - int(days * 24) - 1,)
                )
            self.db.execute("COMMIT")
        except Exception:
            self.db.execute("ROLLBACK")
            raise

    # --- reading -----------------------------------------------------------------------

    def catalogue(self) -> dict[str, tuple[float, float]]:
        """Every series with data: key -> (first, last) Unix time, to the hour."""
        out: dict[str, tuple[float, float]] = {}
        for key, lo, hi in self.db.execute(
            "SELECT s.key, MIN(h.hour), MAX(h.hour) FROM data_hour h "
            "JOIN data_series s ON s.id = h.series GROUP BY h.series"
        ):
            out[key] = (lo * 3600.0, hi * 3600.0 + 3599)
        if self._hour is not None:
            for key, values in self._acc.items():
                if _stats(values) is None:
                    continue
                first, last = out.get(key, (self._hour * 3600.0, self._hour * 3600.0))
                out[key] = (min(first, self._hour * 3600.0), self._hour * 3600.0 + 3599)
        return out

    def hours(self, keys: list[str], h0: int, h1: int) -> dict[str, dict[int, list[float]]]:
        """Minute slots for each key and hour from `h0` to `h1`, the hour in memory included."""
        out: dict[str, dict[int, list[float]]] = {k: {} for k in keys}
        ids = {self._ids[k]: k for k in keys if k in self._ids}
        if ids:
            marks = ",".join("?" * len(ids))
            for sid, hour, blob in self.db.execute(
                f"SELECT series, hour, slots FROM data_hour WHERE series IN ({marks}) "
                "AND hour BETWEEN ? AND ?",
                (*ids, h0, h1),
            ):
                out[ids[sid]][hour] = _unpack(blob)
        self._merge_memory(out, keys, h0, h1, lambda v: v)
        return out

    def hour_stats(
        self, keys: list[str], h0: int, h1: int
    ) -> dict[str, dict[int, tuple[int, float, float, float]]]:
        """(count, mean, min, max) for each key and hour from `h0` to `h1`."""
        out: dict[str, dict[int, tuple[int, float, float, float]]] = {k: {} for k in keys}
        ids = {self._ids[k]: k for k in keys if k in self._ids}
        if ids:
            marks = ",".join("?" * len(ids))
            for sid, hour, n, mean, lo, hi in self.db.execute(
                f"SELECT series, hour, n, mean, lo, hi FROM data_hour WHERE series IN ({marks}) "
                "AND hour BETWEEN ? AND ?",
                (*ids, h0, h1),
            ):
                out[ids[sid]][hour] = (n, mean, lo, hi)
        self._merge_memory(out, keys, h0, h1, _stats)
        return out

    def _merge_memory(self, out: dict, keys: list[str], h0: int, h1: int, fn) -> None:
        hour = self._hour
        if hour is None or not h0 <= hour <= h1:
            return
        for key in keys:
            values = self._acc.get(key)
            if values is None:
                continue
            item = fn(list(values))
            if item is None:
                continue
            prev = out[key].get(hour)
            if prev is not None and isinstance(prev, list):
                item = [v if not math.isnan(v) else p for v, p in zip(item, prev, strict=True)]
            out[key][hour] = item


# --- queries -------------------------------------------------------------------------


def parse_time(raw: str | None, tz: str, default: float) -> float:
    """Unix seconds, or ISO 8601; a date or time without an offset is house time."""
    if raw is None or raw == "":
        return default
    try:
        value = float(raw)
    except ValueError:
        pass
    else:
        if math.isfinite(value):
            return value
        raise QueryError("times must be finite")
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError as err:
        raise QueryError(f"{raw!r} is not Unix seconds or an ISO 8601 time") from err
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo(tz))
    return dt.timestamp()


def choose_step(span_s: float, asked: str | None, n_series: int) -> tuple[int, bool]:
    """The step to use, and whether an asked step was raised to keep the answer small."""
    if asked in (None, "", "auto"):
        for step in STEPS:
            if span_s / step <= AUTO_POINTS:
                return step, False
        return STEPS[-1], False
    try:
        want = int(asked)
    except ValueError as err:
        raise QueryError("step must be auto or a number of seconds") from err
    if want <= 0:
        raise QueryError("step must be positive")
    step = next((s for s in STEPS if s >= want), STEPS[-1])
    raised = step != want
    limit = max(1, min(MAX_POINTS, MAX_VALUES // max(1, n_series)))
    while span_s / step > limit and step < STEPS[-1]:
        step = STEPS[STEPS.index(step) + 1]
        raised = True
    return step, raised


def _utc_offset(t: float, tz: str) -> int:
    off = datetime.fromtimestamp(t, ZoneInfo(tz)).utcoffset()
    return int(off.total_seconds()) if off is not None else 0


def _bucket(t: float, step: int, offset: int) -> float:
    """The start of the step-wide bucket holding `t`. Days and 3 and 6 hours start at
    local midnight, so a daily point is one local day."""
    shift = offset if step > 3600 else 0
    return math.floor((t + shift) / step) * step - shift


def _round(v: float, metric: str) -> float:
    m = BY_ID.get(metric)
    places = 3 if m is not None and m.kind != "gauge" else 2
    return round(v, places)


def query_points(
    index: SeriesIndex, keys: list[str], start: float, end: float, step: int, tz: str
) -> dict[str, list[list[float]]]:
    """Points `[t, mean, min, max]` for each key, oldest first, buckets from `start`
    to `end`. A bucket without data is left out."""
    offsets: dict[int, int] = {}  # by hour: a range can cross a change of the clocks

    def offset(t: float) -> int:
        hour = int(t // 3600)
        if hour not in offsets:
            offsets[hour] = _utc_offset(hour * 3600.0, tz) if step > 3600 else 0
        return offsets[hour]

    h0, h1 = int(start // 3600), int(end // 3600)
    out: dict[str, list[list[float]]] = {}
    if step >= 3600:
        # Whole hours: weight each hour's mean by its count.
        stats = index.hour_stats(keys, h0, h1)
        for key in keys:
            metric, _ = split_key(key)
            acc: dict[float, list[float]] = {}
            for hour, (n, mean, lo, hi) in stats[key].items():
                b = _bucket(hour * 3600.0, step, offset(hour * 3600.0))
                if not start - step < b <= end:
                    continue
                a = acc.setdefault(b, [0.0, 0.0, math.inf, -math.inf])
                a[0] += n
                a[1] += mean * n
                a[2] = min(a[2], lo)
                a[3] = max(a[3], hi)
            out[key] = [
                [b, _round(s / n, metric), _round(lo, metric), _round(hi, metric)]
                for b, (n, s, lo, hi) in sorted(acc.items())
            ]
        return out
    hours = index.hours(keys, h0, h1)
    for key in keys:
        metric, _ = split_key(key)
        acc = {}
        for hour, values in hours[key].items():
            base = hour * 3600.0
            for i, v in enumerate(values):
                if math.isnan(v):
                    continue
                t = base + i * 60
                if not start <= t <= end:
                    continue
                b = _bucket(t, step, offset(t))
                a = acc.setdefault(b, [0.0, 0.0, math.inf, -math.inf])
                a[0] += 1
                a[1] += v
                a[2] = min(a[2], v)
                a[3] = max(a[3], v)
        out[key] = [
            [b, _round(s / n, metric), _round(lo, metric), _round(hi, metric)]
            for b, (n, s, lo, hi) in sorted(acc.items())
        ]
    return out


def _metric_view(m) -> dict:
    out = {
        "metric": m.id,
        "label": m.label,
        "unit": m.unit,
        "kind": m.kind,
        "scope": m.scope,
        "description": m.description,
    }
    if m.levels:
        out["levels"] = list(m.levels)
    return out


def _series_view(key: str, rooms: Mapping[str, str]) -> dict:
    metric, room = split_key(key)
    m = BY_ID.get(metric)
    return {
        "key": key,
        "metric": metric,
        "room": room,
        "room_name": rooms.get(room, room) if room else None,
        "label": m.label if m else metric,
        "unit": m.unit if m else "",
        "kind": m.kind if m else "gauge",
    }


def _order(key: str, rooms: list[str]) -> tuple:
    metric, room = split_key(key)
    pos = next((i for i, m in enumerate(METRICS) if m.id == metric), len(METRICS))
    rpos = rooms.index(room) if room in rooms else len(rooms)
    return (0 if room is None else 1, pos, rpos, key)


def index_of(rt: Any) -> SeriesIndex | None:
    return getattr(getattr(rt, "recorder", None), "index", None)


def unavailable() -> dict:
    return {
        "available": False,
        "why": "Radiate isn't recording a history here, so there is no raw data to search.",
    }


def series_view(rt: Any, export: dict | None = None) -> dict:
    """`GET /api/v1/data/series`: what can be queried, and the export's health."""
    index = index_of(rt)
    if index is None:
        return {**unavailable(), "export": export}
    index.catch_up(QUERY_CATCH_UP)
    order = [r.id for r in rt.cfg.rooms]
    names = {r.id: r.name for r in rt.cfg.rooms}
    cat = index.catalogue()
    series = []
    for key in sorted(cat, key=lambda k: _order(k, order)):
        item = _series_view(key, names)
        item["first"], item["last"] = cat[key]
        series.append(item)
    behind = index.behind()
    return {
        "available": True,
        "now": rt.wall(),
        "timezone": rt.timezone,
        "retention_days": getattr(index.history, "days", None),
        "first": min((v[0] for v in cat.values()), default=None),
        "last": max((v[1] for v in cat.values()), default=None),
        "metrics": [_metric_view(m) for m in METRICS],
        "rooms": [{"id": r.id, "name": r.name} for r in rt.cfg.rooms],
        "series": series,
        "steps": list(STEPS),
        "indexing": {"done": behind == 0, "behind_ticks": behind},
        "export": export,
    }


def _list(query: Mapping[str, Any], name: str) -> list[str]:
    raw = query.get(name)
    if raw is None:
        return []
    items = raw if isinstance(raw, list) else [raw]
    return [p.strip() for item in items for p in str(item).split(",") if p.strip()]


def data_view(rt: Any, query: Mapping[str, Any]) -> dict:
    """`GET /api/v1/data`: points for the series a query names.

    `metric` and `room` are comma-separated lists (empty: every one; `room` narrows
    room series only, so house series such as the boiler stay in); `from` and `to`
    are Unix seconds or ISO 8601 (default: the last 24 hours); `step` is `auto` or
    seconds, raised to the next of `STEPS`. Raises QueryError for a bad query.
    """
    index = index_of(rt)
    if index is None:
        raise QueryError(unavailable()["why"])
    t0 = time.perf_counter()
    index.catch_up(QUERY_CATCH_UP)
    metrics, rooms = _list(query, "metric"), _list(query, "room")
    for m in metrics:
        if m not in BY_ID:
            raise QueryError(f"unknown metric {m!r}")
    known_rooms = {r.id for r in rt.cfg.rooms}
    for r in rooms:
        if r not in known_rooms:
            raise QueryError(f"unknown room {r!r}")
    now = rt.wall()
    end = parse_time(query.get("to"), rt.timezone, now)
    start = parse_time(query.get("from"), rt.timezone, end - DEFAULT_SPAN_S)
    if start >= end:
        raise QueryError("from must be before to")
    cat = index.catalogue()
    keys = []
    for key, (first, last) in cat.items():
        metric, room = split_key(key)
        if metrics and metric not in metrics:
            continue
        if rooms and room is not None and room not in rooms:
            continue  # the room filter leaves house series alone
        if last < start or first > end:
            continue
        keys.append(key)
    order = [r.id for r in rt.cfg.rooms]
    keys.sort(key=lambda k: _order(k, order))
    step, raised = choose_step(end - start, query.get("step"), len(keys))
    points = query_points(index, keys, start, end, step, rt.timezone)
    names = {r.id: r.name for r in rt.cfg.rooms}
    series = []
    for key in keys:
        item = _series_view(key, names)
        item["points"] = points.get(key, [])
        series.append(item)
    behind = index.behind()
    return {
        "from": start,
        "to": end,
        "step": step,
        "step_raised": raised,
        "timezone": rt.timezone,
        "partial": behind > 0,
        "series": series,
        "took_ms": round((time.perf_counter() - t0) * 1000, 1),
    }


CSV_HEADER = ("time", "metric", "room", "unit", "value", "min", "max")


def to_csv(view: dict) -> str:
    """The points of a `data_view` answer as CSV, one row per point, times in house time
    with their offset."""
    import csv
    import io

    tz = ZoneInfo(view["timezone"])
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(CSV_HEADER)
    for s in view["series"]:
        unit = BY_ID[s["metric"]].unit if s["metric"] in BY_ID else s.get("unit", "")
        for t, v, lo, hi in s["points"]:
            stamp = datetime.fromtimestamp(t, tz).isoformat()
            w.writerow((stamp, s["metric"], s["room"] or "", unit, v, lo, hi))
    return buf.getvalue()


def export_view(rt: Any) -> dict:
    """`GET /api/v1/export`: the health of each export, None for one not running."""
    otlp = getattr(rt, "otlp", None)
    elastic = getattr(rt, "exporter", None)
    return {
        "otlp": otlp.health() if otlp is not None else None,
        "elastic": {
            "queued": len(elastic.buffer),
            "sent": elastic.sent,
            "failures": elastic.failures,
        }
        if elastic is not None
        else None,
    }
