"""Quiet hours: a nightly window with no heating except frost protection (spec 5.10).

The window is local wall-clock minutes, `(start, end)`, and may cross midnight
("22:30-06:00" is `(1350, 360)`). Pure: the caller works out the house's local minute
of day (with daylight saving, through `zoneinfo`) and puts the result in the snapshot
as `Snapshot.quiet_until_min` (the house) and `RoomInput.quiet_until_min` (each room,
with its own window too), so the core never reads a clock and replay decides the same
way.
"""

from __future__ import annotations

from .types import HouseConfig, Snapshot

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


def quiet_until_any(windows: tuple[tuple[int, int] | None, ...], minute: int) -> int | None:
    """Inside any of `windows` at `minute`: the minute of day the last of them ends, so
    that two windows that meet or overlap count as one. None outside all of them."""
    ends = [e for w in windows if (e := quiet_until(w, minute)) is not None]
    if not ends:
        return None
    for step in range(1, DAY_MIN + 1):
        m = (minute + step) % DAY_MIN
        if all(quiet_until(w, m) is None for w in windows):
            return m
    return ends[0]  # together they cover the whole day: quiet all day


def apply_quiet(cfg: HouseConfig, snap: Snapshot) -> None:
    """Fill quiet hours into a snapshot from `snap.minute_of_day`, the house's local
    minute: `Snapshot.quiet_until_min` for the house window, and each controllable
    room's `RoomInput.quiet_until_min` for the house window and its own together."""
    minute = snap.minute_of_day
    snap.quiet_until_min = quiet_until(cfg.quiet_hours, minute)
    for rc in cfg.rooms:
        inp = snap.rooms.get(rc.id)
        if rc.controllable and inp is not None:
            inp.quiet_until_min = quiet_until_any((cfg.quiet_hours, rc.quiet_hours), minute)


def format_window(window: tuple[int, int] | None) -> str | None:
    """`(1350, 360)` as "22:30-06:00"; None with no window."""
    if window is None:
        return None
    return f"{clock_text(window[0])}-{clock_text(window[1])}"


def clock_text(minute: int) -> str:
    """A local minute of day as HH:MM."""
    m = minute % DAY_MIN
    return f"{m // 60:02d}:{m % 60:02d}"
