"""The security audit log (ADR-0008): every security event, in three places.

1. The `audit_log` table in `radiate.db`, kept for `auth.audit_days` (90 by default)
   and at most `MAX_ROWS` rows, whether or not the OpenTelemetry export is on. Admins
   read it with `GET /api/v1/audit` and in the web UI's Security log.
2. The process log, one line per event on the `radiate.security` logger, at INFO, or
   WARNING for a refusal: `event=... action=... outcome=... user.name=... message=...`,
   values quoted as JSON strings when they hold anything but plain characters, so a
   username can't forge a second line.
3. The OpenTelemetry export, as `radiate.security.*` log records (`sink`), when it
   runs. Events written by `radiate users` in another process are forwarded by the
   server's next tick.

What an event holds comes from the telemetry schema (`radiate.export.telemetry`):
`security_record` keeps only the event's own attributes, so no password, token,
session ID, CSRF token or secret can be recorded, and the tests grep every record for
them. Repeats of a refusal of one kind from one address within a minute are folded
into one record with `radiate.security.count`, so a flood of bad requests, or of
made-up usernames, can't flood the log.

A refused password sign-in for a name that matches no account records a keyed hash of
the name, `unknown:<16 hex>`, never the text: people often type their password in the
username box. The key (`KEY_FILE`, in the data directory) is made once per install,
so the same mistyped name gets the same hash and repeats can still be counted.

Recording never raises: a full disk or a locked database costs the audit record and
one warning, never a request or a tick.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import sqlite3
import time
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from radiate.export import telemetry

LOG = logging.getLogger("radiate.security")

REPEAT_WINDOW_S = 60.0  # fold like refusals within this into one record
MAX_FOLDS = 10_000  # bound memory if refusals come from many addresses
MAX_ROWS = 100_000  # a hard bound beside the retention days
PRUNE_EVERY_S = 3600.0
ERROR_LOG_EVERY_S = 600.0
MAX_TEXT = 256  # longest string kept from a request (a username, a path)
QUERY_LIMIT = 500
ORIGIN_SERVER = "server"
ORIGIN_CLI = "cli"
# The per-install key for usernames that match no account, in the data directory.
KEY_FILE = "audit.key"
KEY_BYTES = 32
UNKNOWN_PREFIX = "unknown:"
PSEUDONYM_HEX = 16  # 64 bits of HMAC-SHA256: plenty to tell attempts apart

SCHEMA = """
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at REAL NOT NULL,
    event TEXT NOT NULL,
    action TEXT NOT NULL,
    outcome TEXT NOT NULL,
    severity TEXT NOT NULL,
    user TEXT,
    source TEXT,
    message TEXT NOT NULL,
    attrs TEXT NOT NULL,
    origin TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_log_at ON audit_log (at);
"""

_PLAIN = re.compile(r"^[A-Za-z0-9_.:/@+,=\-\[\]]+$")
_CONTROL = re.compile(r"[\x00-\x1f\x7f]")
# The attributes that can come from a request, and so are cleaned and cut short.
_FREE_TEXT = {
    "user.name",
    "user.target.name",
    "url.path",
    "source.address",
    "radiate.config.key",
    "radiate.config.before",
    "radiate.config.after",
}
MAX_CHANGES = 20  # household settings recorded one by one; past this, one record names all


@dataclass(frozen=True, slots=True)
class Change:
    """One setting that changed, for a `config.changed` record. `before` and `after`
    are None where values are not recorded (the people in the household)."""

    path: str
    before: str | None
    after: str | None


def value_text(value: Any) -> str:
    """A setting's value as the security log records it: plain text for a string or a
    number, JSON for anything else, `none` for no value."""
    if value is None:
        return "none"
    if isinstance(value, str):
        return value
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float):
        return f"{value:g}"
    if isinstance(value, int):
        return str(value)
    return json.dumps(value, separators=(",", ":"), sort_keys=True, default=str)


def _flat(section: Mapping[str, Any], prefix: str) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in section.items():
        path = f"{prefix}.{key}"
        if isinstance(value, Mapping) and value:
            out.update(_flat(value, path))
        else:
            out[path] = value
    return out


def household_changes(before: Mapping[str, Any], after: Mapping[str, Any]) -> list[Change]:
    """What a household save changed, setting by setting, as house-file paths
    (`household.rooms.lounge.adjust`), from two `household_section`s.

    Who lives in the house is personal data, so a change under `people`, or to the
    people a room is for, is recorded by its path without values, and a person's ID
    never appears: every change to the people is the one path `household.people`.
    """
    old, new = _flat(before, "household"), _flat(after, "household")
    out: list[Change] = []
    people_changed = False
    for path in sorted(old.keys() | new.keys()):
        a, b = old.get(path), new.get(path)
        if a == b:
            continue
        if path.startswith("household.people"):
            people_changed = True
        elif path.endswith(".people"):
            out.append(Change(path, None, None))
        else:
            out.append(Change(path, value_text(a), value_text(b)))
    if people_changed:
        out.append(Change("household.people", None, None))
    return sorted(out, key=lambda c: c.path)


def load_key(data_dir: str | Path | None) -> bytes:
    """The per-install key for pseudonyms, from `<data_dir>/audit.key`, made on first
    use and readable by Radiate's user only. Without a data directory (the demo), or if
    the file can't be read or written, a key for this process only, with a warning:
    the same name then hashes differently after a restart."""
    if data_dir is None:
        return secrets.token_bytes(KEY_BYTES)
    path = Path(data_dir) / KEY_FILE
    try:
        try:
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:
            key = bytes.fromhex(path.read_text(encoding="ascii").strip())
            if len(key) < KEY_BYTES:
                raise ValueError("too short") from None
            return key
        key = secrets.token_bytes(KEY_BYTES)
        with os.fdopen(fd, "w", encoding="ascii") as f:
            f.write(key.hex() + "\n")
        return key
    except (OSError, ValueError) as err:
        LOG.warning(
            "security log: can't use %s (%s); unknown usernames are hashed with a key for "
            "this run only",
            path,
            type(err).__name__,
        )
        return secrets.token_bytes(KEY_BYTES)


def clean(value: str, limit: int = MAX_TEXT) -> str:
    """Text from a request, safe to store and log: no control characters, cut short."""
    return _CONTROL.sub("?", value)[:limit]


def _value(v: Any) -> str:
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (list, tuple)):
        v = ",".join(str(x) for x in v)
    text = str(v)
    return text if text and _PLAIN.match(text) else json.dumps(text, ensure_ascii=True)


def log_line(record: Mapping[str, Any]) -> str:
    """One parseable line for the process log: key=value pairs, message last."""
    attrs = record.get("a") or {}
    parts = [f"event={record['e']}", f"action={_value(record['c'])}"]
    parts.append(f"outcome={_value(attrs.get(telemetry.EVENT_OUTCOME.key, ''))}")
    for key, value in attrs.items():
        if key != telemetry.EVENT_OUTCOME.key:
            parts.append(f"{key}={_value(value)}")
    parts.append(f"message={json.dumps(str(record.get('m', '')), ensure_ascii=True)}")
    return " ".join(parts)


@dataclass(slots=True)
class _Fold:
    started: float  # monotonic
    count: int = 0  # folded since the record that started the window
    record: dict | None = None  # the latest folded record
    at: float = 0.0  # its wall time


class SecurityLog:
    """Records security events. One per process, shared by the server and login."""

    def __init__(
        self,
        db: sqlite3.Connection | None,
        retention_days: float = 90.0,
        origin: str = ORIGIN_SERVER,
        clock: Callable[[], float] = time.time,
        monotonic: Callable[[], float] = time.monotonic,
        key: bytes | None = None,
    ):
        self.db = db
        # For `pseudonym`: `load_key(data_dir)`, or a key for this process only.
        self._key = key or secrets.token_bytes(KEY_BYTES)
        self.retention_s = retention_days * 86400
        self.origin = origin
        self.clock = clock
        self.monotonic = monotonic
        # Where OpenTelemetry records go: `Runtime.telemetry_event`, set by the server.
        self.sink: Callable[[dict], None] | None = None
        self._folds: dict[tuple, _Fold] = {}
        self._pruned_at: float | None = None
        self._error_at: float | None = None
        self._cursor = 0  # the last row from another process already forwarded
        if db is not None:
            try:
                db.executescript(SCHEMA)
                self._cursor = db.execute("SELECT COALESCE(MAX(id), 0) FROM audit_log").fetchone()[
                    0
                ]
                self.prune()
            except sqlite3.Error as err:
                self._failed(err)
                self.db = None

    @classmethod
    def memory(cls, retention_days: float = 90.0) -> SecurityLog:
        """A log kept in memory, for the demo without a data directory and for tests."""
        return cls(sqlite3.connect(":memory:", isolation_level=None), retention_days)

    def pseudonym(self, name: str) -> str:
        """What a sign-in records for a username that matches no account: `unknown:`
        and 16 hex digits of HMAC-SHA256 under the install's key. The same name always
        gives the same value on this install, and without the key it can't be reversed,
        even for a short name."""
        digest = hmac.new(self._key, name.encode("utf-8", "replace"), hashlib.sha256)
        return UNKNOWN_PREFIX + digest.hexdigest()[:PSEUDONYM_HEX]

    # --- recording ---------------------------------------------------------------------

    def record(
        self, name: str, action: str, message: str, attrs: Mapping[str, Any] | None = None
    ) -> None:
        """Record one event, a `radiate.security.*` name from the telemetry schema, with
        its attributes by their schema names (`user.name`). Never raises."""
        try:
            self._record(name, action, message, dict(attrs or {}))
        except Exception as err:
            self._failed(err)

    def _record(self, name: str, action: str, message: str, attrs: dict) -> None:
        for key in _FREE_TEXT & set(attrs):
            if isinstance(attrs[key], str):
                attrs[key] = clean(attrs[key])
        rec = telemetry.security_record(name, action, clean(message, 500), attrs)
        now = self.monotonic()
        self._flush(now)
        defn = telemetry.EVENT_BY_NAME[name]
        if any(a.key == telemetry.SECURITY_COUNT.key for a in defn.attributes):
            a = rec["a"]
            # Not by username or path: an attacker can vary those at no cost.
            key = (name, action, a.get("error.type"), a.get("source.address"))
            fold = self._folds.get(key)
            if fold is not None and now - fold.started < REPEAT_WINDOW_S:
                fold.count += 1
                fold.record, fold.at = rec, self.clock()
                return
            if len(self._folds) >= MAX_FOLDS:
                self._flush(now, force=True)
            self._folds[key] = _Fold(now)
        self._write(rec, self.clock())

    def tick(self) -> None:
        """From the server's tick: write folded repeats whose minute is over, forward
        events `radiate users` wrote, and prune. Never raises."""
        try:
            self._flush(self.monotonic())
            self._forward_others()
            if self._pruned_at is None or self.monotonic() - self._pruned_at >= PRUNE_EVERY_S:
                self.prune()
        except Exception as err:
            self._failed(err)

    def _flush(self, now: float, force: bool = False) -> None:
        """Write a record for each fold whose minute is over (every fold with `force`):
        the last refusal it held, with how many it stands for."""
        for key, fold in list(self._folds.items()):
            if not force and now - fold.started < REPEAT_WINDOW_S:
                continue
            del self._folds[key]
            if fold.count and fold.record is not None:
                rec = fold.record
                rec["a"][telemetry.SECURITY_COUNT.key] = fold.count
                noun = "refusal" if fold.count == 1 else "refusals"
                rec["m"] = f"{rec['m']}. {fold.count} like {noun} from this address in a minute"
                self._write(rec, fold.at)

    def _write(self, rec: dict, at: float) -> None:
        a = rec["a"]
        severity = telemetry.EVENT_BY_NAME[rec["e"]].severity
        user = a.get("user.name") or a.get("user.target.name")
        if self.db is not None:
            try:
                self.db.execute(
                    "INSERT INTO audit_log (at, event, action, outcome, severity, user, "
                    "source, message, attrs, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        at,
                        rec["e"],
                        rec["c"],
                        a.get(telemetry.EVENT_OUTCOME.key, ""),
                        severity,
                        user,
                        a.get("source.address"),
                        rec["m"],
                        json.dumps(a, separators=(",", ":")),
                        self.origin,
                    ),
                )
            except sqlite3.Error as err:
                self._failed(err)
        try:
            LOG.log(logging.WARNING if severity == "WARN" else logging.INFO, log_line(rec))
        except Exception as err:
            self._failed(err)
        if self.sink is not None:
            try:
                self.sink({"t": at, **rec})
            except Exception as err:
                self._failed(err)

    def _forward_others(self) -> None:
        """Send events another process (`radiate users`) wrote since the last tick."""
        if self.db is None or self.sink is None:
            return
        rows = self.db.execute(
            "SELECT id, at, event, action, message, attrs FROM audit_log "
            "WHERE id > ? AND origin != ? ORDER BY id LIMIT 500",
            (self._cursor, self.origin),
        ).fetchall()
        for row_id, at, event, action, message, attrs in rows:
            self._cursor = max(self._cursor, row_id)
            if event in telemetry.EVENT_BY_NAME:
                rec = telemetry.security_record(event, action, message, json.loads(attrs))
                self.sink({"t": at, **rec})
        if not rows:
            mine = self.db.execute("SELECT COALESCE(MAX(id), 0) FROM audit_log").fetchone()[0]
            self._cursor = max(self._cursor, mine)

    def prune(self) -> None:
        if self.db is None:
            return
        self._pruned_at = self.monotonic()
        self.db.execute("DELETE FROM audit_log WHERE at < ?", (self.clock() - self.retention_s,))
        self.db.execute(
            "DELETE FROM audit_log WHERE id <= "
            "(SELECT id FROM audit_log ORDER BY id DESC LIMIT 1 OFFSET ?)",
            (MAX_ROWS,),
        )

    def _failed(self, err: Exception) -> None:
        now = self.monotonic()
        if self._error_at is None or now - self._error_at >= ERROR_LOG_EVERY_S:
            self._error_at = now
            LOG.warning("security log: an event was not recorded: %s", type(err).__name__)

    # --- reading -----------------------------------------------------------------------

    def query(
        self,
        outcome: str | None = None,
        user: str | None = None,
        limit: int = 100,
        before: int | None = None,
    ) -> dict:
        """The newest events first, for the API: {"events", "users", "retention_days"}.
        `before` is an event ID, for the next page."""
        out: dict[str, Any] = {
            "events": [],
            "users": [],
            "retention_days": round(self.retention_s / 86400, 1),
        }
        if self.db is None:
            return out
        where, args = [], []
        if outcome:
            where.append("outcome = ?")
            args.append(outcome)
        if user:
            where.append("user = ?")
            args.append(user)
        if before is not None:
            where.append("id < ?")
            args.append(before)
        sql = "SELECT id, at, event, action, outcome, severity, user, source, message, attrs "
        sql += "FROM audit_log"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY id DESC LIMIT ?"
        args.append(max(1, min(int(limit), QUERY_LIMIT)))
        for row in self.db.execute(sql, args).fetchall():
            row_id, at, event, action, oc, severity, who, source, message, attrs = row
            out["events"].append(
                {
                    "id": row_id,
                    "at": at,
                    "event": event,
                    "action": action,
                    "outcome": oc,
                    "severity": severity,
                    "user": who,
                    "source": source,
                    "message": message,
                    "attributes": json.loads(attrs),
                }
            )
        out["users"] = [
            r[0]
            for r in self.db.execute(
                "SELECT DISTINCT user FROM audit_log WHERE user IS NOT NULL ORDER BY user LIMIT 200"
            )
        ]
        return out
