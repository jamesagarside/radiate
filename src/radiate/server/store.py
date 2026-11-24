"""SQLite persistence: engine state, runtime settings, the Elastic export queue, and
login users and sessions (ADR-0006, `radiate.server.auth.accounts`).

One file (`<data_dir>/radiate.db`), WAL mode, standard library only. Writes are
small and infrequent (state every few minutes, export batches every 10 s), so they
run on the event loop thread; each is a single short transaction.
"""

from __future__ import annotations

import json
import sqlite3
import time
from collections import deque
from pathlib import Path
from typing import Any, Protocol

SCHEMA = """
CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    saved_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS export_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created REAL NOT NULL,
    doc TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created REAL NOT NULL,
    updated REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
    id_hash TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    method TEXT NOT NULL,
    csrf TEXT NOT NULL,
    created REAL NOT NULL,
    last_seen REAL NOT NULL,
    expires REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (method, username);
"""


class Store:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.path, isolation_level=None)
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA synchronous=NORMAL")
        self.db.executescript(SCHEMA)

    def get(self, key: str) -> tuple[Any, float] | None:
        row = self.db.execute("SELECT value, saved_at FROM kv WHERE key = ?", (key,)).fetchone()
        if row is None:
            return None
        try:
            return json.loads(row[0]), row[1]
        except ValueError:
            return None

    def put(self, key: str, value: Any, wall: float | None = None) -> None:
        self.db.execute(
            "INSERT INTO kv (key, value, saved_at) VALUES (?, ?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value, saved_at = excluded.saved_at",
            (key, json.dumps(value, separators=(",", ":")), time.time() if wall is None else wall),
        )

    def close(self) -> None:
        self.db.close()


class ExportQueue(Protocol):
    def extend(self, docs: list[dict]) -> None: ...

    def peek(self, n: int) -> list[dict]: ...

    def drop(self, n: int) -> None: ...

    def __len__(self) -> int: ...


class MemoryQueue:
    def __init__(self, maxlen: int):
        self._q: deque[dict] = deque(maxlen=maxlen)

    def extend(self, docs: list[dict]) -> None:
        self._q.extend(docs)

    def peek(self, n: int) -> list[dict]:
        return [self._q[i] for i in range(min(n, len(self._q)))]

    def drop(self, n: int) -> None:
        for _ in range(min(n, len(self._q))):
            self._q.popleft()

    def __len__(self) -> int:
        return len(self._q)

    def __iter__(self):
        return iter(self._q)


class SqliteQueue:
    """On-disk FIFO that survives restarts and outages (spec 9: up to 7 days)."""

    def __init__(self, store: Store, max_docs: int, max_age_s: float = 7 * 86400):
        self.db = store.db
        self.max_docs = max_docs
        self.max_age_s = max_age_s
        self._len = self.db.execute("SELECT COUNT(*) FROM export_queue").fetchone()[0]

    def extend(self, docs: list[dict], now: float | None = None) -> None:
        if not docs:
            return
        now = time.time() if now is None else now
        rows = [(now, json.dumps(d, separators=(",", ":"))) for d in docs]
        self.db.execute("BEGIN")
        self.db.executemany("INSERT INTO export_queue (created, doc) VALUES (?, ?)", rows)
        self.db.execute("COMMIT")
        self._len += len(rows)
        self.prune(now)

    def prune(self, now: float | None = None) -> None:
        now = time.time() if now is None else now
        self.db.execute("DELETE FROM export_queue WHERE created < ?", (now - self.max_age_s,))
        excess = self.db.execute("SELECT COUNT(*) FROM export_queue").fetchone()[0] - self.max_docs
        if excess > 0:
            self.db.execute(
                "DELETE FROM export_queue WHERE id IN "
                "(SELECT id FROM export_queue ORDER BY id LIMIT ?)",
                (excess,),
            )
        self._len = self.db.execute("SELECT COUNT(*) FROM export_queue").fetchone()[0]

    def peek(self, n: int) -> list[dict]:
        rows = self.db.execute("SELECT doc FROM export_queue ORDER BY id LIMIT ?", (n,)).fetchall()
        return [json.loads(r[0]) for r in rows]

    def drop(self, n: int) -> None:
        self.db.execute(
            "DELETE FROM export_queue WHERE id IN (SELECT id FROM export_queue ORDER BY id LIMIT ?)",
            (n,),
        )
        self._len = max(0, self._len - n)

    def __len__(self) -> int:
        return self._len

    def __iter__(self):
        for (doc,) in self.db.execute("SELECT doc FROM export_queue ORDER BY id"):
            yield json.loads(doc)
