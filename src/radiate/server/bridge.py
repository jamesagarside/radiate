"""Transport-free request handling, shared by the HTTP API and the browser demo.

`app.py` calls these functions for its POST routes so the rules live in one place.
The static demo (`scripts/build_demo.py`) runs this module under Pyodide in a Web
Worker, where there is no aiohttp: `handle()` takes a method, a path below
`api/v1/` and a decoded JSON body, and returns a JSON-ready result or raises
`RequestError` with the HTTP status the server would have sent. Only stdlib and
radiate imports are allowed here.
"""

from __future__ import annotations

import json
from collections.abc import Coroutine
from typing import Any

from radiate.core import Mode
from radiate.core.types import RoomConfig

from .runtime import Runtime

SETPOINT_MIN_C = 5.0
SETPOINT_MAX_C = 28.0
BOOST_MAX_MIN = 180


class RequestError(Exception):
    """A request the API rejects; `status` is the HTTP status code to send."""

    def __init__(self, status: int, text: str) -> None:
        super().__init__(text)
        self.status = status
        self.text = text


def require_object(body: Any) -> dict:
    if not isinstance(body, dict):
        raise RequestError(400, "expected an object")
    return body


def room(rt: Runtime, room_id: str) -> RoomConfig:
    try:
        return rt.cfg.room(room_id)
    except KeyError as err:
        raise RequestError(404, "unknown room") from err


def set_setpoint(rt: Runtime, room_id: str, body: Any) -> dict:
    rc = room(rt, room_id)
    value = require_object(body).get("setpoint")
    if value is None:
        rt.overrides.pop(rc.id, None)
        return {"ok": True}
    if isinstance(value, bool):
        raise RequestError(400, "setpoint must be a number")
    try:
        value = float(value)
    except (TypeError, ValueError) as err:
        raise RequestError(400, "setpoint must be a number") from err
    if not SETPOINT_MIN_C <= value <= SETPOINT_MAX_C:
        raise RequestError(400, "setpoint out of range 5 to 28")
    rt.overrides[rc.id] = value
    return {"ok": True}


def set_fire(rt: Runtime, room_id: str, body: Any) -> dict:
    rc = room(rt, room_id)
    if require_object(body).get("lit"):
        rt.fire.add(rc.id)
    else:
        rt.fire.discard(rc.id)
    return {"ok": True}


def boost_store(rt: Runtime, body: Any) -> dict:
    raw = require_object(body).get("minutes", 60)
    if isinstance(raw, bool):
        raise RequestError(400, "minutes must be a number")
    try:
        minutes = int(raw)
    except (TypeError, ValueError) as err:
        raise RequestError(400, "minutes must be a number") from err
    minutes = max(0, min(BOOST_MAX_MIN, minutes))
    rt.store_boost_until = rt.driver.clock() + minutes * 60
    return {"ok": True}


def set_mode(rt: Runtime, body: Any) -> dict:
    try:
        rt.mode = Mode(require_object(body).get("mode"))
    except ValueError as err:
        raise RequestError(400, "mode must be auto, off or frost") from err
    return {"ok": True}


def handle(rt: Runtime, method: str, path: str, body: Any = None) -> dict:
    """Answer one API call. `path` is relative to `api/v1/`, for example `rooms/x/fire`."""
    method = method.upper()
    parts = [p for p in path.strip("/").split("/") if p]
    if method == "GET":
        if parts == ["house"]:
            return rt.house()
        if parts == ["state"]:
            return rt.describe()
        if parts == ["health"]:
            return {"ok": True}
    elif method == "POST":
        if parts == ["mode"]:
            return set_mode(rt, body)
        if parts == ["store", "boost"]:
            return boost_store(rt, body)
        if len(parts) == 3 and parts[0] == "rooms":
            if parts[2] == "setpoint":
                return set_setpoint(rt, parts[1], body)
            if parts[2] == "fire":
                return set_fire(rt, parts[1], body)
    else:
        raise RequestError(405, "method not allowed")
    raise RequestError(404, "not found")


def run_sync(coro: Coroutine[Any, Any, Any]) -> Any:
    """Run a coroutine that never suspends, without an event loop.

    The demo driver's snapshot and apply do no I/O, so `Runtime.step()` completes on
    its first resumption. This keeps the browser worker free of asyncio scheduling.
    """
    try:
        coro.send(None)
    except StopIteration as done:
        return done.value
    coro.close()
    raise RuntimeError("coroutine suspended; run it on an event loop instead")


class DemoSession:
    """The simulated reference house, driven step by step from the browser worker.

    Every method takes and returns JSON text so the JavaScript side never has to
    convert Python objects.
    """

    def __init__(self, start_hour: float = 5.5, seed: int = 7) -> None:
        from radiate.sim.reference import house_config

        from .demo import DemoDriver

        self.rt = Runtime(house_config(), DemoDriver(start_hour=start_hour, seed=seed))

    def step(self, count: int = 1) -> None:
        for _ in range(count):
            run_sync(self.rt.step())

    def sim_seconds(self) -> float:
        return self.rt.driver.clock()

    def request(self, method: str, path: str, body_json: str = "null") -> str:
        """Return `{"status": int, "body": ...}` as JSON, mirroring the HTTP API."""
        try:
            body = json.loads(body_json) if body_json else None
        except ValueError:
            return json.dumps({"status": 400, "body": "invalid JSON"})
        try:
            return json.dumps({"status": 200, "body": handle(self.rt, method, path, body)})
        except RequestError as err:
            return json.dumps({"status": err.status, "body": err.text})
