"""Local users and server-side sessions in `radiate.db` (ADR-0006).

Only the SHA-256 of a session ID is stored, so a copy of the database holds no live
session. Sessions use wall-clock time because they must outlast a restart.
"""

from __future__ import annotations

import hashlib
import re
import secrets
import sqlite3
import time
from collections.abc import Callable
from dataclasses import dataclass

from radiate.config.auth import ROLES, normalise_role

from .passwords import hash_password

USERNAME = re.compile(r"^[A-Za-z0-9._@-]{1,64}$")
LAST_SEEN_EVERY_S = 60.0  # write the idle clock at most this often


class AccountError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class User:
    username: str
    role: str
    password_hash: str


@dataclass(frozen=True, slots=True)
class Session:
    id_hash: str
    username: str
    role: str
    method: str  # local, oidc or saml
    csrf: str
    created: float
    last_seen: float
    expires: float


def _hash_id(session_id: str) -> str:
    return hashlib.sha256(session_id.encode("utf-8")).hexdigest()


def normalise_username(name: str) -> str:
    name = name.strip()
    if not USERNAME.match(name):
        raise AccountError(
            "usernames are 1 to 64 letters, digits and the characters . _ @ -, with no spaces"
        )
    return name.lower()


def check_role(role: str) -> str:
    """The stored name of a role, taking `readonly` for `viewer`."""
    stored = normalise_role(role) if isinstance(role, str) else None
    if stored is None:
        raise AccountError(f"role must be {', '.join(ROLES[:-1])} or {ROLES[-1]} (or readonly)")
    return stored


# Told when sessions end other than by signing out, for the security log (ADR-0008):
# (username, role or None, method, reason, how many). Reasons are the telemetry
# schema's `event.reason` values: expired, idle, password_reset, role_changed,
# user_removed.
SessionEnded = Callable[[str, str | None, str, str, int], None]


class Accounts:
    """Users and sessions on the state database's connection."""

    def __init__(self, db: sqlite3.Connection, on_session_end: SessionEnded | None = None):
        self.db = db
        self.on_session_end = on_session_end

    def _ended(self, username: str, role: str | None, method: str, reason: str, n: int) -> None:
        if n and self.on_session_end is not None:
            self.on_session_end(username, role, method, reason, n)

    # --- users ---------------------------------------------------------------------

    def user(self, username: str) -> User | None:
        row = self.db.execute(
            "SELECT username, role, password_hash FROM users WHERE username = ?",
            (username.strip().lower(),),
        ).fetchone()
        return User(*row) if row else None

    def users(self) -> list[User]:
        rows = self.db.execute(
            "SELECT username, role, password_hash FROM users ORDER BY username"
        ).fetchall()
        return [User(*r) for r in rows]

    def count_users(self) -> int:
        return self.db.execute("SELECT COUNT(*) FROM users").fetchone()[0]

    def add_user(self, username: str, password: str, role: str, now: float | None = None) -> User:
        name = normalise_username(username)
        role = check_role(role)
        if self.user(name):
            raise AccountError(f"user {name} already exists")
        now = time.time() if now is None else now
        pw = hash_password(password)
        self.db.execute(
            "INSERT INTO users (username, password_hash, role, created, updated) "
            "VALUES (?, ?, ?, ?, ?)",
            (name, pw, role, now, now),
        )
        return User(name, role, pw)

    def set_password(self, username: str, password: str) -> None:
        name = self._existing(username)
        self.db.execute(
            "UPDATE users SET password_hash = ?, updated = ? WHERE username = ?",
            (hash_password(password), time.time(), name),
        )
        self.end_user_sessions("local", name, "password_reset")

    def set_role(self, username: str, role: str) -> None:
        name = self._existing(username)
        role = check_role(role)
        self.db.execute(
            "UPDATE users SET role = ?, updated = ? WHERE username = ?", (role, time.time(), name)
        )
        self.end_user_sessions("local", name, "role_changed")

    def remove_user(self, username: str) -> None:
        name = self._existing(username)
        self.db.execute("DELETE FROM users WHERE username = ?", (name,))
        self.end_user_sessions("local", name, "user_removed")

    def _existing(self, username: str) -> str:
        user = self.user(username)
        if user is None:
            raise AccountError(f"no user {username.strip().lower()}")
        return user.username

    # --- sessions ------------------------------------------------------------------

    def create_session(
        self,
        username: str,
        role: str,
        method: str,
        lifetime_s: float,
        now: float | None = None,
    ) -> tuple[str, Session]:
        """A new session. Returns the ID for the cookie, which is never stored."""
        now = time.time() if now is None else now
        session_id = secrets.token_urlsafe(32)
        session = Session(
            id_hash=_hash_id(session_id),
            username=username,
            role=check_role(role),
            method=method,
            csrf=secrets.token_urlsafe(32),
            created=now,
            last_seen=now,
            expires=now + lifetime_s,
        )
        self.db.execute(
            "INSERT INTO sessions (id_hash, username, role, method, csrf, created, last_seen, "
            "expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                session.id_hash,
                session.username,
                session.role,
                session.method,
                session.csrf,
                session.created,
                session.last_seen,
                session.expires,
            ),
        )
        return session_id, session

    def session(self, session_id: str, idle_s: float, now: float | None = None) -> Session | None:
        """The live session for a cookie value, or None. Ends a session past its time."""
        if not session_id or len(session_id) > 128:
            return None
        now = time.time() if now is None else now
        id_hash = _hash_id(session_id)
        row = self.db.execute(
            "SELECT id_hash, username, role, method, csrf, created, last_seen, expires "
            "FROM sessions WHERE id_hash = ?",
            (id_hash,),
        ).fetchone()
        if row is None:
            return None
        s = Session(*row)
        if self.expire(s, idle_s, now):
            return None
        if now - s.last_seen >= LAST_SEEN_EVERY_S:
            self.db.execute("UPDATE sessions SET last_seen = ? WHERE id_hash = ?", (now, id_hash))
        return s

    def expire(self, s: Session, idle_s: float, now: float | None = None) -> bool:
        """End `s` if it is past its time, and say so. True if it has ended."""
        now = time.time() if now is None else now
        if now < s.expires and now - s.last_seen < idle_s:
            return False
        cur = self.db.execute("DELETE FROM sessions WHERE id_hash = ?", (s.id_hash,))
        reason = "expired" if now >= s.expires else "idle"
        self._ended(s.username, s.role, s.method, reason, cur.rowcount)
        return True

    def end_session(self, session_id: str) -> None:
        self.db.execute("DELETE FROM sessions WHERE id_hash = ?", (_hash_id(session_id),))

    def end_user_sessions(self, method: str, username: str, reason: str | None = None) -> int:
        """End every session of one user. `reason`, for the security log, is why."""
        cur = self.db.execute(
            "DELETE FROM sessions WHERE method = ? AND username = ?", (method, username)
        )
        if reason is not None:
            self._ended(username, None, method, reason, cur.rowcount)
        return cur.rowcount

    def prune(self, idle_s: float, now: float | None = None) -> None:
        now = time.time() if now is None else now
        rows = self.db.execute(
            "SELECT id_hash, username, role, method, csrf, created, last_seen, expires "
            "FROM sessions WHERE expires <= ? OR last_seen <= ?",
            (now, now - idle_s),
        ).fetchall()
        for row in rows:
            self.expire(Session(*row), idle_s, now)
