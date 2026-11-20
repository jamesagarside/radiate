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

from radiate.config.away import parse_local
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


def person(rt: Runtime, person_id: str) -> str:
    if person_id not in rt.people:
        raise RequestError(404, "unknown person")
    return person_id


def _local_time(rt: Runtime, raw: Any, key: str) -> float:
    if not isinstance(raw, str):
        raise RequestError(400, f"{key} must be an ISO 8601 date or date and time")
    try:
        return parse_local(raw, rt.timezone)
    except ValueError as err:
        raise RequestError(400, f"{key} must be an ISO 8601 date or date and time") from err


def set_away(rt: Runtime, person_id: str, body: Any) -> dict:
    """Count a person as away until a local date and time.

    `{"until": "2026-11-24T18:00"}`. Without an offset the time is local to the house;
    a date on its own means the start of that day. `{"until": null}` clears it.
    """
    pid = person(rt, person_id)
    body = require_object(body)
    if "until" not in body:
        raise RequestError(400, "until is required: a date and time, or null to clear")
    if body["until"] is None:
        rt.clear_away(pid)
    else:
        until = _local_time(rt, body["until"], "until")
        try:
            rt.set_away(pid, until)
        except ValueError as err:
            raise RequestError(400, str(err)) from err
    return {"ok": True, "person": rt.person_view(pid)}


def set_presence(rt: Runtime, person_id: str, body: Any) -> dict:
    """Presence from Home Assistant: `{"state": "home" | "not_home", "since": "..."}`.

    `since` is when the state last changed (optional). `{"state": null}` forgets the
    person's presence, for example when their `person` entity is no longer mapped.
    """
    pid = person(rt, person_id)
    body = require_object(body)
    if "state" not in body:
        raise RequestError(400, "state is required: home, not_home or null")
    state = body["state"]
    if state is not None and state not in ("home", "not_home"):
        raise RequestError(400, "state must be home, not_home or null")
    since = body.get("since")
    when = None if since is None else _local_time(rt, since, "since")
    rt.report_presence(pid, state, when)
    return {"ok": True, "person": rt.person_view(pid)}


def set_setpoint(rt: Runtime, room_id: str, body: Any) -> dict:
    """Override a room's setpoint.

    Optional `until`: `next_change` (the default, ends at the room's next scheduled
    setpoint), `duration` (with `duration_min`) or `cleared`. A `duration_min` on its
    own implies `duration`. `{"setpoint": null}` clears the override.
    """
    rc = room(rt, room_id)
    body = require_object(body)
    value = body.get("setpoint")
    if value is None:
        rt.clear_override(rc.id)
        return {"ok": True}
    if isinstance(value, bool):
        raise RequestError(400, "setpoint must be a number")
    try:
        value = float(value)
    except (TypeError, ValueError) as err:
        raise RequestError(400, "setpoint must be a number") from err
    if not SETPOINT_MIN_C <= value <= SETPOINT_MAX_C:
        raise RequestError(400, "setpoint out of range 5 to 28")
    until = body.get("until")
    minutes = body.get("duration_min")
    if until is not None and not isinstance(until, str):
        raise RequestError(400, "until must be next_change, duration or cleared")
    if minutes is not None:
        if isinstance(minutes, bool) or not isinstance(minutes, (int, float)):
            raise RequestError(400, "duration_min must be a number")
        minutes = float(minutes)
    try:
        override = rt.set_override(rc.id, value, until=until, minutes=minutes)
    except ValueError as err:
        raise RequestError(400, str(err)) from err
    view = rt.override_view(rc.id, rt.driver.clock())
    return {"ok": True, "until": override.until, "expires_in_min": view["expires_in_min"]}


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
        if parts == ["people"]:
            return rt.away_view()
    elif method == "POST":
        if parts == ["mode"]:
            return set_mode(rt, body)
        if parts == ["store", "boost"]:
            return boost_store(rt, body)
        if len(parts) == 3 and parts[0] == "people":
            if parts[2] == "away":
                return set_away(rt, parts[1], body)
            if parts[2] == "presence":
                return set_presence(rt, parts[1], body)
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
