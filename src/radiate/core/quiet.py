"""Quiet hours: a nightly window with no heating except frost protection (spec 5.10).

The window is local wall-clock minutes, `(start, end)`, and may cross midnight
("22:30-06:00" is `(1350, 360)`). Pure: the caller works out the house's local minute
of day (with daylight saving, through `zoneinfo`) and puts the result in the snapshot
as `Snapshot.quiet_until_min`, so the core never reads a clock and replay decides the
same way.
"""

from __future__ import annotations

DAY_MIN = 24 * 60


def quiet_until(window: tuple[int, int] | None, minute: int) -> int | None:
    """Inside the window at local `minute` of day: the minute of day it ends. None
    outside it, or with no window."""
    if window is None:
        return None
    start, end = window
    m = minute % DAY_MIN
    if start == end:
        return None  # the parser refuses this; an empty window, not a whole day
    inside = start <= m < end if start < end else (m >= start or m < end)
    return end % DAY_MIN if inside else None


def format_window(window: tuple[int, int] | None) -> str | None:
    """`(1350, 360)` as "22:30-06:00"; None with no window."""
    if window is None:
        return None
    return f"{clock_text(window[0])}-{clock_text(window[1])}"


def clock_text(minute: int) -> str:
    """A local minute of day as HH:MM."""
    m = minute % DAY_MIN
    return f"{m // 60:02d}:{m % 60:02d}"
