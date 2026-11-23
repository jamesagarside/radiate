"""The house layout: where each room sits, drawn by the owner in the web UI.

The layout only draws the house model. Control never reads it. It is a list of
floors and, per room, a floor and a rectangle in metres on that floor's plan:

    {"floors": ["Ground floor", "First floor"],
     "rooms": {"lounge": {"floor": 0, "x": 0, "y": 0, "w": 4.5, "d": 4}}}

A room left out of `rooms` is not placed yet. Sizes are rough by design: the model
compares rooms and shows where heat goes, so nobody needs a tape measure.
"""

from __future__ import annotations

import math
from typing import Any

MAX_FLOORS = 6
MAX_NAME = 40
MAX_EXTENT_M = 60.0  # the plan is 60 m square; anything past that is a typo
MIN_SIDE_M = 0.5


class LayoutError(ValueError):
    pass


def _metres(value: Any, where: str, low: float, high: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise LayoutError(f"{where}: expected a number of metres")
    if not low <= value <= high:
        raise LayoutError(f"{where}: must be between {low:g} and {high:g} m")
    return round(float(value), 2)


def validate(body: Any, room_ids: set[str]) -> dict:
    """A clean copy of the layout, or LayoutError naming the first problem."""
    if not isinstance(body, dict):
        raise LayoutError("expected an object")
    unknown = sorted(set(body) - {"floors", "rooms"})
    if unknown:
        raise LayoutError(f"unknown field: {', '.join(unknown)}")
    floors = body.get("floors")
    if not isinstance(floors, list) or not 1 <= len(floors) <= MAX_FLOORS:
        raise LayoutError(f"floors: expected 1 to {MAX_FLOORS} floor names")
    names = []
    for i, name in enumerate(floors):
        if not isinstance(name, str) or not name.strip() or len(name.strip()) > MAX_NAME:
            raise LayoutError(f"floors[{i}]: expected a name of 1 to {MAX_NAME} characters")
        names.append(name.strip())
    rooms = body.get("rooms", {})
    if not isinstance(rooms, dict):
        raise LayoutError("rooms: expected an object of room id to position")
    placed: dict[str, dict] = {}
    for rid, pos in rooms.items():
        where = f"rooms.{rid}"
        if rid not in room_ids:
            raise LayoutError(f"{where}: no such room")
        if not isinstance(pos, dict) or set(pos) != {"floor", "x", "y", "w", "d"}:
            raise LayoutError(f"{where}: expected floor, x, y, w and d")
        floor = pos["floor"]
        if isinstance(floor, bool) or not isinstance(floor, int) or not 0 <= floor < len(names):
            raise LayoutError(f"{where}.floor: expected a floor number from 0 to {len(names) - 1}")
        w = _metres(pos["w"], f"{where}.w", MIN_SIDE_M, MAX_EXTENT_M)
        d = _metres(pos["d"], f"{where}.d", MIN_SIDE_M, MAX_EXTENT_M)
        x = _metres(pos["x"], f"{where}.x", 0, MAX_EXTENT_M - w)
        y = _metres(pos["y"], f"{where}.y", 0, MAX_EXTENT_M - d)
        placed[rid] = {"floor": floor, "x": x, "y": y, "w": w, "d": d}
    return {"floors": names, "rooms": placed}


def restore(saved: Any, room_ids: set[str]) -> dict | None:
    """A saved layout, without rooms the house file no longer has. None if unusable."""
    if not isinstance(saved, dict):
        return None
    rooms = saved.get("rooms")
    if isinstance(rooms, dict):
        saved = {**saved, "rooms": {k: v for k, v in rooms.items() if k in room_ids}}
    try:
        return validate(saved, room_ids)
    except LayoutError:
        return None
