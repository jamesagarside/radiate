"""Failed login limiting, in memory (ADR-0006).

Too many failures for one username, or from one client address, within the window
lock it until the oldest failure leaves the window. Uses the monotonic clock.
"""

from __future__ import annotations

import time
from collections import deque

WINDOW_S = 15 * 60
PER_USER = 5
PER_ADDRESS = 20
MAX_KEYS = 10_000  # bound memory if someone sprays usernames


class LoginLimiter:
    def __init__(
        self,
        per_user: int = PER_USER,
        per_address: int = PER_ADDRESS,
        window_s: float = WINDOW_S,
        clock=time.monotonic,
    ):
        self.per_user = per_user
        self.per_address = per_address
        self.window_s = window_s
        self.clock = clock
        self._fails: dict[str, deque[float]] = {}

    def _recent(self, key: str, now: float) -> deque[float]:
        q = self._fails.get(key)
        if q is None:
            return deque()
        while q and now - q[0] >= self.window_s:
            q.popleft()
        if not q:
            del self._fails[key]
        return q

    def _wait(self, key: str, limit: int, now: float) -> float:
        q = self._recent(key, now)
        if len(q) < limit:
            return 0.0
        return self.window_s - (now - q[-limit])

    def retry_after(self, username: str, address: str) -> float:
        """Seconds until a login for this username from this address may be tried."""
        now = self.clock()
        return max(
            self._wait(f"u:{username}", self.per_user, now),
            self._wait(f"a:{address}", self.per_address, now),
        )

    def failed(self, username: str, address: str) -> None:
        now = self.clock()
        if len(self._fails) >= MAX_KEYS:
            for key in list(self._fails):
                self._recent(key, now)
            if len(self._fails) >= MAX_KEYS:
                self._fails.pop(next(iter(self._fails)))
        for key in (f"u:{username}", f"a:{address}"):
            self._fails.setdefault(key, deque()).append(now)

    def succeeded(self, username: str) -> None:
        self._fails.pop(f"u:{username}", None)
