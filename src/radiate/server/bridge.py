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
import re
from collections.abc import Coroutine
from typing import Any

from radiate.config.away import parse_local
from radiate.config.site import HA_PERSON
from radiate.core import DemandMode, Mode
from radiate.core.outdoor import OUTDOOR_MAX_C, OUTDOOR_MIN_C, plausible
from radiate.core.types import RoomConfig, RoomRole
from radiate.drivers.devices import ScanRefused

from .layout import LayoutError
from .runtime import Runtime
from .savings import savings_view
from .schedules import schedules_view
from .setup import HouseholdSetup, SetupError
from .suggestions import suggestions_view

SETPOINT_MIN_C = 5.0
SETPOINT_MAX_C = 28.0
BOOST_MAX_MIN = 180


class RequestError(Exception):
    """A request the API rejects; `status` is the HTTP status code to send.

    `body`, when set, is sent as JSON instead of `text`: the household setup's
    field-level errors.
    """

    def __init__(self, status: int, text: str, body: dict | None = None) -> None:
        super().__init__(text)
        self.status = status
        self.text = text
        self.body = body


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


SOURCE_TYPE = re.compile(r"^[a-z][a-z0-9_]{0,31}$")


def set_presence(rt: Runtime, person_id: str, body: Any) -> dict:
    """Presence from Home Assistant: `{"state": "home" | "not_home", "since": "..."}`.

    `since` is when the state last changed (optional). `{"state": null}` forgets the
    person's presence, for example when their `person` entity is no longer mapped.
    Optional, for fail warm: `evidence_at`, the newest report from the person's trackers
    themselves (any state); `source_type`, their kind (`gps`, `router`, `bluetooth`);
    `battery`, the phone's charge, 0 to 100.
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
    raw = body.get("evidence_at")
    evidence_at = None if raw is None else _local_time(rt, raw, "evidence_at")
    source_type = body.get("source_type")
    if source_type is not None and (
        not isinstance(source_type, str) or not SOURCE_TYPE.match(source_type)
    ):
        raise RequestError(400, "source_type must be a tracker type such as gps or router")
    battery = body.get("battery")
    if battery is not None:
        if isinstance(battery, bool) or not isinstance(battery, (int, float)):
            raise RequestError(400, "battery must be a number from 0 to 100")
        if not 0 <= battery <= 100:
            raise RequestError(400, "battery must be a number from 0 to 100")
        battery = float(battery)
    rt.report_presence(pid, state, when, evidence_at, source_type, battery)
    return {"ok": True, "person": rt.person_view(pid)}


def say_home(rt: Runtime, person_id: str, body: Any) -> dict:
    """ "I'm home": the person counts as home now, whatever presence said before. Ends
    their away until. Holds until their presence next changes state. Body `{}`."""
    pid = person(rt, person_id)
    require_object(body)
    rt.say_home(pid)
    return {"ok": True, "person": rt.person_view(pid)}


OUTDOOR_SOURCE_MAX = 100


def set_outdoor(rt: Runtime, body: Any) -> dict:
    """An outdoor temperature from Home Assistant.

    `{"temperature_c": 7.5, "measured_at": "2026-11-24T08:10:00+00:00", "source":
    "weather.forecast_home"}`. `measured_at` (when it was measured, optional, now
    without it) and `source` (where it came from, optional) are kept with it.
    `{"temperature_c": null}` forgets it. Used only when `house.outdoor_source` is
    `home_assistant` or `both`.
    """
    body = require_object(body)
    if "temperature_c" not in body:
        raise RequestError(400, "temperature_c is required: degrees Celsius, or null to forget")
    t = body["temperature_c"]
    if t is not None and (isinstance(t, bool) or not isinstance(t, (int, float))):
        raise RequestError(400, "temperature_c must be a number or null")
    if t is not None and not plausible(t):
        raise RequestError(
            400, f"temperature_c must be between {OUTDOOR_MIN_C:g} and {OUTDOOR_MAX_C:g} °C"
        )
    raw_at = body.get("measured_at")
    measured_at = None if raw_at is None else _local_time(rt, raw_at, "measured_at")
    source = body.get("source")
    if source is not None and (not isinstance(source, str) or len(source) > OUTDOOR_SOURCE_MAX):
        raise RequestError(400, f"source must be text of at most {OUTDOOR_SOURCE_MAX} characters")
    rt.report_outdoor(t, measured_at, source or None)
    return {"ok": True, "outdoor": rt.outdoor_view()}


HA_PERSONS_MAX = 200
HA_NAME_MAX = 100


def set_ha_persons(rt: Runtime, body: Any) -> dict:
    """The `person` entities Home Assistant can see, for the setup wizard to offer.

    `{"persons": [{"entity_id": "person.sam", "name": "Sam"}, ...]}`. Replaces the last
    report. A missing or empty name shows the entity ID instead.
    """
    raw = require_object(body).get("persons")
    if not isinstance(raw, list):
        raise RequestError(400, "persons must be a list")
    if len(raw) > HA_PERSONS_MAX:
        raise RequestError(400, f"persons must have at most {HA_PERSONS_MAX} items")
    persons: dict[str, dict] = {}
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            raise RequestError(400, f"persons[{i}] must be an object")
        entity_id = item.get("entity_id")
        if not isinstance(entity_id, str) or not HA_PERSON.match(entity_id):
            raise RequestError(400, f"persons[{i}].entity_id must be a person entity ID")
        name = item.get("name")
        if name is not None and not isinstance(name, str):
            raise RequestError(400, f"persons[{i}].name must be a string")
        name = (name or "").strip()[:HA_NAME_MAX] or entity_id
        persons[entity_id] = {"entity_id": entity_id, "name": name}
    rt.report_ha_persons(list(persons.values()))
    return {"ok": True, "count": len(persons)}


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
    if rc.role is RoomRole.UNHEATED:
        raise RequestError(400, "an unheated room has no radiator, so it has no setpoint")
    until = body.get("until")
    minutes = body.get("duration_min")
    if until is not None and not isinstance(until, str):
        raise RequestError(400, "until must be next_change, duration or cleared")
    if minutes is not None:
        if isinstance(minutes, bool) or not isinstance(minutes, (int, float)):
            raise RequestError(400, "duration_min must be a number")
        minutes = float(minutes)
    target = rt.state.rooms[rc.id].target if rc.id in rt.state.rooms else None
    try:
        override = rt.set_override(rc.id, value, until=until, minutes=minutes)
    except ValueError as err:
        raise RequestError(400, str(err)) from err
    # Someone turning a room up is in (fail warm). Holding it or turning it down is
    # what an automation does when the house is empty, so that is no evidence.
    if target is None or value > target:
        rt.note_home_evidence("override")
    view = rt.override_view(rc.id, rt.driver.clock())
    return {"ok": True, "until": override.until, "expires_in_min": view["expires_in_min"]}


def set_fire(rt: Runtime, room_id: str, body: Any) -> dict:
    rc = room(rt, room_id)
    lit = bool(require_object(body).get("lit"))
    rt.set_fire(rc.id, lit)
    if lit:
        rt.note_home_evidence("fire_switch")  # someone lit it (fail warm)
    return {"ok": True, "expires_in_min": rt.fire_expires_in_min(rc.id, rt.driver.clock())}


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
    if minutes > 0:
        rt.note_home_evidence("store_boost")  # someone wants hot water (fail warm)
    return {"ok": True}


def set_mode(rt: Runtime, body: Any) -> dict:
    try:
        rt.mode = Mode(require_object(body).get("mode"))
    except ValueError as err:
        raise RequestError(400, "mode must be auto, off or frost") from err
    return {"ok": True}


def reset_learning(rt: Runtime, body: Any) -> dict:
    """Put rooms' learned models back to their priors (spec 4.3).

    `{"rooms": ["bedroom_1", "dining"]}`, or `{}` for every room with a model. For
    models learned under conditions that did not hold, such as a dry run without
    burner metering before Radiate learned to ignore one.
    """
    rooms = require_object(body).get("rooms")
    if rooms is not None:
        if not isinstance(rooms, list) or not rooms or not all(isinstance(r, str) for r in rooms):
            raise RequestError(400, "rooms must be a non-empty list of room ids")
        unknown = [r for r in rooms if r not in rt.state.rooms]
        if unknown:
            raise RequestError(400, f"no learned model for: {', '.join(unknown)}")
    return {"reset": rt.reset_learning(rooms)}


def setup(rt: Runtime) -> HouseholdSetup:
    if not isinstance(rt.setup, HouseholdSetup):
        raise RequestError(404, "household setup is not available")
    return rt.setup


def household(rt: Runtime, method: str, body: Any = None) -> dict:
    """The household setup: GET reads it, PUT saves a draft, DELETE goes back to the
    house file's. `household/preview` (POST) compiles a draft without saving it."""
    s = setup(rt)
    try:
        if method == "GET":
            return s.view(rt)
        if method == "PREVIEW":
            return s.preview(rt, body)
        if method == "PUT":
            return s.save(rt, body)
        if method == "DELETE":
            return s.revert(rt)
    except SetupError as err:
        raise RequestError(err.status, str(err) or "invalid household", err.body) from err
    raise RequestError(405, "method not allowed")


SETTINGS = ("demand_mode",)


def set_settings(rt: Runtime, body: Any) -> dict:
    """Change runtime settings. Only the keys given change.

    `demand_mode`: `eco`, `comfort`, or null to follow `boiler.demand_mode` in the
    configuration file. Saved straight away; used from the next tick.
    """
    body = require_object(body)
    unknown = sorted(k for k in body if k not in SETTINGS)
    if unknown:
        raise RequestError(400, f"unknown setting: {', '.join(unknown)}")
    if "demand_mode" in body:
        value = body["demand_mode"]
        if value is None:
            mode = None
        else:
            try:
                mode = DemandMode(value) if isinstance(value, str) else None
            except ValueError:
                mode = None
            if mode is None:
                raise RequestError(400, "demand_mode must be eco, comfort or null")
        rt.set_demand_mode(mode)
    return {"ok": True, "settings": rt.settings()}


def devices(rt: Runtime) -> dict:
    """Battery, signal, availability and readings of every device (spec 8.1)."""
    view = rt.devices_view()
    if view is None:
        raise RequestError(404, "this driver reports no devices")
    return view


def scan_network(rt: Runtime, body: Any = None) -> dict:
    """Start a network scan. 409 while one runs, 429 within 10 minutes of the last."""
    if body is not None:
        require_object(body)
    try:
        scan = rt.scan_network()
    except ScanRefused as err:
        raise RequestError(
            err.status, err.message, {"message": err.message, "retry_in_s": err.retry_in_s}
        ) from err
    if scan is None:
        raise RequestError(404, "this driver has no network to scan")
    return {"ok": True, "scan": scan}


def set_layout(rt: Runtime, body: Any) -> dict:
    """Replace where rooms sit in the web UI's house model (radiate.server.layout)."""
    try:
        return rt.set_layout(body)
    except LayoutError as err:
        raise RequestError(400, str(err)) from err


def handle(rt: Runtime, method: str, path: str, body: Any = None) -> dict:
    """Answer one API call. `path` is relative to `api/v1/`, for example `rooms/x/fire`."""
    method = method.upper()
    parts = [p for p in path.strip("/").split("/") if p]
    if parts == ["household"] and method in ("GET", "PUT", "DELETE"):
        return household(rt, method, body)
    if parts == ["household", "preview"] and method == "POST":
        return household(rt, "PREVIEW", body)
    if parts == ["layout"] and method == "PUT":
        return set_layout(rt, body)
    if method == "GET":
        if parts == ["house"]:
            return rt.house()
        if parts == ["state"]:
            return rt.describe()
        if parts == ["health"]:
            return {"ok": True}
        if parts == ["people"]:
            return rt.away_view()
        if parts == ["schedules"]:
            return schedules_view(rt)
        if parts == ["settings"]:
            return rt.settings()
        if parts == ["layout"]:
            return {"layout": rt.layout}
        if parts == ["devices"]:
            return devices(rt)
        if parts == ["suggestions"]:
            return suggestions_view(rt)
        if parts == ["savings"]:
            return savings_view(rt)
    elif method == "POST":
        if parts == ["devices", "scan"]:
            return scan_network(rt, body)
        if parts == ["mode"]:
            return set_mode(rt, body)
        if parts == ["learning", "reset"]:
            return reset_learning(rt, body)
        if parts == ["settings"]:
            return set_settings(rt, body)
        if parts == ["store", "boost"]:
            return boost_store(rt, body)
        if parts == ["ha", "persons"]:
            return set_ha_persons(rt, body)
        if parts == ["outdoor"]:
            return set_outdoor(rt, body)
        if len(parts) == 3 and parts[0] == "people":
            if parts[2] == "away":
                return set_away(rt, parts[1], body)
            if parts[2] == "presence":
                return set_presence(rt, parts[1], body)
            if parts[2] == "home":
                return say_home(rt, parts[1], body)
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
        from .demo import demo_runtime

        self.rt = demo_runtime(start_hour=start_hour, seed=seed)

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
            body = err.body if err.body is not None else err.text
            return json.dumps({"status": err.status, "body": body})
