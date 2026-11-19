"""Tick history in the state database: every live tick's snapshot and actions.

The `history` table in `radiate.db` holds one row per entry (`radiate.core.history`):
a start entry when the runtime starts, one tick entry a minute, and a checkpoint every
6 hours. Each row's data is compact JSON with a schema version, compressed with zlib:
about 0.5 kB a tick, 0.75 MB a day for the 9-room reference house. Rows older than
`house.history_days` are pruned at start and then hourly.

Recording never stops the control loop: the `Recorder` logs an error, at most once
an hour, and carries on.
"""

from __future__ import annotations

import json
import logging
import time
import zlib
from collections.abc import Iterator
from typing import Any

from radiate.core.decide import EngineState
from radiate.core.history import (
    CHECKPOINT,
    START,
    TICK,
    Entry,
    checkpoint_data,
    compact_actions,
    start_data,
    tick_data,
)
from radiate.core.types import Actions, Reason, Snapshot

from .store import Store

LOG = logging.getLogger(__name__)
CHECKPOINT_EVERY_S = 6 * 3600
PRUNE_EVERY_S = 3600
ERROR_LOG_EVERY_S = 3600

SCHEMA = """
CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wall REAL NOT NULL,
    segment INTEGER NOT NULL,
    kind TEXT NOT NULL,
    data BLOB NOT NULL
);
CREATE INDEX IF NOT EXISTS history_wall ON history (wall);
"""


def _pack(data: dict[str, Any]) -> bytes:
    return zlib.compress(json.dumps(data, separators=(",", ":")).encode(), 6)


def _unpack(blob: bytes) -> dict[str, Any] | None:
    try:
        data = json.loads(zlib.decompress(blob))
    except (zlib.error, ValueError):
        return None
    return data if isinstance(data, dict) else None


class History:
    """The `history` table. `days` is the retention; 0 keeps nothing."""

    def __init__(self, store: Store, days: float = 14.0):
        self.db = store.db
        self.days = days
        self.db.executescript(SCHEMA)

    def append(self, kind: str, wall: float, segment: int, data: dict[str, Any]) -> None:
        self.db.execute(
            "INSERT INTO history (wall, segment, kind, data) VALUES (?, ?, ?, ?)",
            (wall, segment, kind, _pack(data)),
        )

    def prune(self, wall: float) -> int:
        cur = self.db.execute("DELETE FROM history WHERE wall < ?", (wall - self.days * 86400,))
        return cur.rowcount

    def entries(self, from_id: int = 0, until: float | None = None) -> Iterator[Entry]:
        """Entries in recorded order, from row `from_id`, up to Unix time `until`."""
        sql = "SELECT id, wall, segment, kind, data FROM history WHERE id >= ?"
        args: list[Any] = [from_id]
        if until is not None:
            sql += " AND wall <= ?"
            args.append(until)
        # Read in pages so a long history is never held in memory at once.
        while True:
            rows = self.db.execute(sql + " ORDER BY id LIMIT 1000", args).fetchall()
            for row_id, wall, segment, kind, blob in rows:
                data = _unpack(blob)
                yield Entry(kind, wall, segment, data if data is not None else {})
                args[0] = row_id + 1
            if len(rows) < 1000:
                return

    def recent(self, wall: float) -> Iterator[Entry]:
        """Every entry inside the retention, for a bootstrap."""
        return self.entries(self.first_id(wall - self.days * 86400))

    def first_id(self, since: float | None = None) -> int:
        """The first row at or after Unix time `since`."""
        row = self.db.execute(
            "SELECT MIN(id) FROM history WHERE wall >= ?", (since or 0.0,)
        ).fetchone()
        return row[0] or 0

    def anchor_id(self, since: float | None) -> int:
        """Where a saved-state replay of the ticks from `since` begins: the last start
        entry at or before it, else the last checkpoint, else the beginning."""
        if since is None:
            return 0
        for kind in (START, CHECKPOINT):
            row = self.db.execute(
                "SELECT MAX(id) FROM history WHERE kind = ? AND wall <= ?", (kind, since)
            ).fetchone()
            if row[0] is not None:
                return row[0]
        return 0

    def stats(self) -> dict[str, Any]:
        n, first, last, size = self.db.execute(
            "SELECT COUNT(*), MIN(wall), MAX(wall), COALESCE(SUM(LENGTH(data)), 0) FROM history"
        ).fetchone()
        ticks = self.db.execute("SELECT COUNT(*) FROM history WHERE kind = ?", (TICK,)).fetchone()
        return {"entries": n, "ticks": ticks[0], "first": first, "last": last, "bytes": size}


class Recorder:
    """Appends a live runtime's ticks to the history. Never raises."""

    def __init__(
        self,
        history: History,
        segment: int,
        now: float,
        wall: float,
        engine: Any,
        elapsed_s: float,
    ):
        """`now`, `engine` and `elapsed_s`: the arguments the runtime passed to
        `load_state` (`engine` None for a fresh state); `wall`: Unix time then."""
        self.history = history
        self.segment = segment
        self._start = start_data(now, engine, elapsed_s)
        self._start_wall = wall
        self._started = False
        self._checkpoint_at = now  # the start entry is the first anchor
        self._pruned_at: float | None = None
        self._error_at: float | None = None

    def compact(self, actions: Actions) -> dict[str, Any] | None:
        """The actions as `decide` returned them, before the driver adds its alerts."""
        try:
            return compact_actions(actions)
        except Exception as err:  # never break the control loop
            self._error(err)
            return None

    def record(
        self,
        wall: float,
        snap: Snapshot,
        actions: dict[str, Any] | None,
        driver_alerts: list[Reason],
        state: EngineState,
        now: float,
    ) -> None:
        if actions is None:
            return
        try:
            if not self._started:
                self._started = True  # once only: later ticks would not match the origin
                self.history.append(START, self._start_wall, self.segment, self._start)
            if driver_alerts:
                actions = {**actions, "driver_alerts": [[a.code, a.room_id] for a in driver_alerts]}
            self.history.append(TICK, wall, self.segment, tick_data(snap, actions))
            if now - self._checkpoint_at >= CHECKPOINT_EVERY_S:
                self._checkpoint_at = now
                self.history.append(CHECKPOINT, wall, self.segment, checkpoint_data(state, now))
            if self._pruned_at is None or wall - self._pruned_at >= PRUNE_EVERY_S:
                self._pruned_at = wall
                self.history.prune(wall)
        except Exception as err:  # never break the control loop
            self._error(err)

    def _error(self, err: Exception) -> None:
        t = time.monotonic()
        if self._error_at is None or t - self._error_at >= ERROR_LOG_EVERY_S:
            self._error_at = t
            LOG.warning("history: tick not recorded: %s", err)
