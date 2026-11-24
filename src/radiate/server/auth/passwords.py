"""Password hashing with the standard library's scrypt (ADR-0006).

Hashes are self-describing, `scrypt$<log2 N>$<r>$<p>$<salt>$<key>` with base64 salt
and key, so the cost can be raised later without breaking existing users.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets

LOG_N = 15  # N = 32768
R = 8
P = 1
KEY_BYTES = 32
SALT_BYTES = 16
MIN_LENGTH = 10
MAX_LENGTH = 1024


def _b64(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def _scrypt(password: str, salt: bytes, log_n: int, r: int, p: int, n_bytes: int) -> bytes:
    n = 1 << log_n
    # maxmem must cover 128 * N * r bytes, with headroom.
    return hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        maxmem=256 * n * r,
        dklen=n_bytes,
    )


def password_problem(password: str) -> str | None:
    """Why a new password is not acceptable, or None."""
    if len(password) < MIN_LENGTH:
        return f"must be at least {MIN_LENGTH} characters"
    if len(password) > MAX_LENGTH:
        return f"must be at most {MAX_LENGTH} characters"
    return None


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(SALT_BYTES)
    key = _scrypt(password, salt, LOG_N, R, P, KEY_BYTES)
    return f"scrypt${LOG_N}${R}${P}${_b64(salt)}${_b64(key)}"


def verify_password(password: str, stored: str) -> bool:
    """True if `password` matches `stored`. Malformed hashes never match."""
    if len(password) > MAX_LENGTH:
        return False
    try:
        scheme, log_n, r, p, salt, key = stored.split("$")
        if scheme != "scrypt":
            return False
        want = base64.b64decode(key, validate=True)
        got = _scrypt(
            password,
            base64.b64decode(salt, validate=True),
            int(log_n),
            int(r),
            int(p),
            len(want),
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(got, want)


# Checked when the username doesn't exist, so a login takes as long either way and its
# timing doesn't say which usernames exist.
DUMMY_HASH = hash_password(secrets.token_urlsafe(16))
