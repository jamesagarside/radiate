"""HTTP and WebSocket API plus the web UI (spec 8.1)."""

from __future__ import annotations

import asyncio
import contextlib
import hmac
import json
import os
from pathlib import Path

from aiohttp import WSMsgType, web

from radiate.config.household import household_section
from radiate.export import telemetry

from . import bridge
from .auth import AUTH, IDENTITY, AuthService, Identity, add_routes
from .auth.service import SESSION_COOKIE, forwarded_client, proxy_networks, user_agent
from .data import QueryError, data_view, export_view, series_view, to_csv
from .permissions import ADMIN, HOUSEHOLD_SETTINGS, PUBLIC, allowed, needed_role
from .runtime import Runtime
from .savings import savings_view
from .schedules import schedules_view
from .security import MAX_CHANGES, Change, SecurityLog, household_changes
from .suggestions import suggestions_view

RUNTIME = web.AppKey("runtime", Runtime)
TOKEN = web.AppKey("token", str)
INGRESS_IP = web.AppKey("ingress_ip", str)
SECURITY = web.AppKey("security", SecurityLog)
PROXIES = web.AppKey("proxies", tuple)
SUPERVISOR_INGRESS_IP = "172.30.32.2"
_PKG_WEB = Path(__file__).resolve().parents[1] / "web"  # installed wheel
_REPO_WEB = Path(__file__).resolve().parents[3] / "web"  # source checkout
WEB_DIR = Path(os.environ.get("RADIATE_WEB_DIR") or (_PKG_WEB if _PKG_WEB.exists() else _REPO_WEB))


STREAM_PATH = "/api/v1/stream"
LOGIN_PATH = "/api/v1/auth/login"
SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})
SESSION_RECHECK_S = 60.0
# A browser cannot set headers on a WebSocket, so the stream also accepts the token
# as its first message: {"token": "..."}. Close code 4401 means it was refused.
STREAM_AUTH_TIMEOUT_S = 10.0
WS_UNAUTHORISED = 4401


def _token_ok(supplied: str, token: str) -> bool:
    # Compare bytes: compare_digest rejects non-ASCII str, which a client can send.
    return hmac.compare_digest(supplied.encode(), token.encode())


def identify(request: web.Request) -> Identity | None:
    """Who the request is from, or None if it isn't allowed in (ADR-0006).

    Ingress first, then an Authorization header (which decides alone when present),
    then a login session. With login off and no token, everything is open, as before.
    """
    token = request.app[TOKEN]
    auth = request.app.get(AUTH)
    if not token and auth is None:
        return Identity("open", "admin")
    # Home Assistant ingress authenticates upstream. Trust it only from the
    # Supervisor's ingress address, never from the header alone.
    ingress_ip = request.app[INGRESS_IP]
    if ingress_ip and request.remote == ingress_ip and "X-Ingress-Path" in request.headers:
        return Identity("ingress", "admin")
    header = request.headers.get("Authorization")
    if header is not None:
        if token and header.startswith("Bearer ") and _token_ok(header[7:], token):
            return Identity("token", "admin")
        return None
    if auth is not None:
        session = auth.session_for(request)
        if session is not None:
            return Identity("session", session.role, session)
    return None


# --- the security log (ADR-0008) ---------------------------------------------------------


def client_address(request: web.BaseRequest) -> str:
    """The client's address, believing X-Forwarded-For only from a trusted proxy."""
    login = request.app.get(AUTH)
    if login is not None:
        return login.client_ip(request)
    return forwarded_client(request, request.app.get(PROXIES, ()))


def _who(request: web.BaseRequest, ident: Identity | None) -> dict:
    """Who made a request, from where and how, for a security record."""
    out = {
        "client.address": client_address(request),
        "user_agent.original": user_agent(request),
        "http.request.method": request.method,
        "url.path": request.path,
    }
    if ident is not None:
        out["radiate.auth.method"] = ident.via
        if ident.session is not None:
            out["user.name"] = ident.session.username
            out["user.roles"] = [ident.session.role]
    return out


def _actor(ident: Identity | None) -> str:
    if ident is not None and ident.session is not None:
        return f"{ident.session.username} ({ident.session.role})"
    return {"token": "the API token", "ingress": "Home Assistant ingress"}.get(
        ident.via if ident is not None else "", "an open server"
    )


def _security(request: web.BaseRequest) -> SecurityLog:
    return request.app[SECURITY]


def _credential_error(request: web.BaseRequest) -> str:
    """What was wrong with a request refused with 401."""
    if request.headers.get("Authorization") is not None:
        return "bad_token"
    if request.cookies.get(SESSION_COOKIE):
        return "bad_session"
    return "no_credentials"


CREDENTIAL_WORDS = {
    "bad_token": "wrong API token",
    "bad_session": "session unknown, expired or signed out",
    "no_credentials": "not signed in",
}


def _record_refused(request: web.BaseRequest, error: str, action: str = "request.refused") -> None:
    what = "Stream refused" if action == "stream.refused" else "Request refused"
    _security(request).record(
        telemetry.SECURITY_REQUEST_REFUSED,
        action,
        f"{what}: {CREDENTIAL_WORDS[error]}",
        {**_who(request, None), "error.type": error},
    )


ACCESS_WORDS = {"csrf": "missing or wrong CSRF token", "origin": "another site's page"}


def _record_denied(
    request: web.BaseRequest, ident: Identity | None, error: str, needed: str | None = None
) -> None:
    if error == "forbidden":
        why = f"needs {needed} for {request.method} {request.path}"
    else:
        why = f"{ACCESS_WORDS[error]} for {request.method} {request.path}"
    _security(request).record(
        telemetry.SECURITY_ACCESS_DENIED,
        "access.denied",
        f"Refused: {_actor(ident)} {why}",
        {**_who(request, ident), "error.type": error, "radiate.auth.needed_role": needed},
    )


def _record_change(
    request: web.BaseRequest,
    action: str,
    area: str,
    message: str,
    detail: str = "",
    paths: list[str] | None = None,
    rooms: list[str] | None = None,
    change: Change | None = None,
) -> None:
    """A change to how Radiate runs: who made it and what. Old and new values only in
    `change`, which callers give only for settings that can't hold a secret."""
    ident = request.get(IDENTITY)
    text = f"{message} by {_actor(ident)}" + (f": {detail}" if detail else "")
    _security(request).record(
        telemetry.SECURITY_CONFIG_CHANGED,
        action,
        text,
        {
            **_who(request, ident),
            "radiate.config.area": area,
            "radiate.settings.paths": sorted(paths) if paths is not None else None,
            "radiate.room.ids": rooms,
            "radiate.config.key": change.path if change is not None else None,
            "radiate.config.before": change.before if change is not None else None,
            "radiate.config.after": change.after if change is not None else None,
        },
    )


def _record_mode(
    request: web.BaseRequest, key: str, label: str, before: str, after: str, note: str = ""
) -> None:
    """The heating or demand mode changed, from the controls: who, and from what to what."""
    _record_change(
        request,
        "mode.changed",
        "mode",
        f"{label} changed from {before} to {after}",
        note,
        change=Change(key, before, after),
    )


def _household_section(rt: Runtime) -> dict:
    """The household in use, as the house file's section, to tell what a save changed."""
    setup = getattr(rt, "setup", None)
    site = getattr(setup, "site", None)
    current = getattr(site, "household", None)
    return household_section(current) if current is not None else {}


def _record_household(request: web.BaseRequest, action: str, message: str, before: dict) -> None:
    """A household save or revert: one record for each setting it changed, with old and
    new values (not for the people), or one naming them all past `MAX_CHANGES`."""
    changes = household_changes(before, _household_section(_rt(request)))
    paths = [c.path for c in changes]
    if not changes or len(changes) > MAX_CHANGES:
        n = len(changes)
        detail = "nothing changed" if not n else f"{n} settings"
        _record_change(request, action, "household", message, detail, paths=paths)
        return
    for c in changes:
        detail = c.path if c.before is None else f"{c.path} from {c.before} to {c.after}"
        _record_change(request, action, "household", message, detail, paths=[c.path], change=c)


def _refused(request: web.Request, needed: str) -> web.Response:
    """403 for a role below what the route needs. `error` names the caller's role, as
    `viewer` always has; `needs` is the role that may."""
    ident = request.get(IDENTITY)
    _record_denied(request, ident, "forbidden", needed)
    role = ident.role if ident is not None else ADMIN
    return web.json_response({"error": role, "needs": needed}, status=403)


@web.middleware
async def auth(request: web.Request, handler):
    """Who may call what: `radiate.server.permissions` holds one entry per route."""
    if request.path.startswith("/api/"):
        needed = needed_role(request)
        if needed != PUBLIC:
            ident = identify(request)
            if ident is None:
                _record_refused(request, _credential_error(request))
                raise web.HTTPUnauthorized()
            if ident.session is not None and request.method not in SAFE_METHODS:
                # A cookie is sent automatically, so a change must also prove it came
                # from Radiate's own page, which alone can read the session's CSRF token.
                if not AuthService.csrf_ok(request, ident.session):
                    _record_denied(request, ident, "csrf")
                    return web.json_response({"error": "csrf"}, status=403)
            request[IDENTITY] = ident
            if not allowed(ident.role, needed):
                return _refused(request, needed)
    return await handler(request)


def _role(request: web.Request) -> str:
    ident = request.get(IDENTITY)
    return ident.role if ident is not None else ADMIN


async def _stream_handshake(ws: web.WebSocketResponse, token: str) -> str | None:
    """Wait for the first message and check it carries the token. None if it does,
    else the security log's error.type: `bad_token`, or `no_credentials` for no token
    in time."""
    try:
        msg = await ws.receive(timeout=STREAM_AUTH_TIMEOUT_S)
    except TimeoutError:
        return "no_credentials"
    if msg.type is not WSMsgType.TEXT:
        return "no_credentials"
    try:
        body = json.loads(msg.data)
    except ValueError:
        return "no_credentials"
    supplied = body.get("token") if isinstance(body, dict) else None
    if not isinstance(supplied, str):
        return "no_credentials"
    return None if token and _token_ok(supplied, token) else "bad_token"


def _rt(request: web.Request) -> Runtime:
    return request.app[RUNTIME]


async def health(_: web.Request) -> web.Response:
    return web.json_response({"ok": True})


async def house(request: web.Request) -> web.Response:
    return web.json_response(_rt(request).house())


async def state(request: web.Request) -> web.Response:
    return web.json_response(_rt(request).describe())


async def decisions(request: web.Request) -> web.Response:
    rt = _rt(request)
    since = float(request.query.get("since", "-1e18"))
    items = [d.__dict__ for d in rt.decisions if d.at > since]
    return web.json_response({"decisions": items})


async def _json(request: web.Request) -> dict:
    try:
        body = await request.json()
    except ValueError as err:
        raise web.HTTPBadRequest(text="invalid JSON") from err
    if not isinstance(body, dict):
        raise web.HTTPBadRequest(text="expected an object")
    return body


def _http_error(err: bridge.RequestError) -> web.HTTPException:
    if err.status == 404:
        return web.HTTPNotFound(text=err.text)
    return web.HTTPBadRequest(text=err.text)


async def _post(request: web.Request, action, *args, lookup=bridge.room) -> web.Response:
    """Run a shared `bridge` action so the server and the browser demo agree."""
    rt = _rt(request)
    try:
        if args:
            lookup(rt, args[0])  # an unknown room or person is a 404 before the body is read
        result = action(rt, *args, await _json(request))
    except bridge.RequestError as err:
        raise _http_error(err) from err
    return web.json_response(result)


def _record_control(
    request: web.BaseRequest,
    action: str,
    kind: str,
    what: str,
    value: str,
    room: str | None = None,
    person: str | None = None,
) -> None:
    """A day-to-day control was used: who, and what it was set to. Only with
    `auth.audit_controls` on. Never where anyone is."""
    security = _security(request)
    if not getattr(security, "audit_controls", True):
        return
    ident = request.get(IDENTITY)
    security.record(
        telemetry.SECURITY_CONTROL_USED,
        action,
        f"{what} by {_actor(ident)}",
        {
            **_who(request, ident),
            "radiate.control.kind": kind,
            "radiate.control.value": value,
            "radiate.room.id": room,
            "radiate.person.id": person,
        },
    )


async def set_setpoint(request: web.Request) -> web.Response:
    room_id = request.match_info["room_id"]
    response = await _post(request, bridge.set_setpoint, room_id)
    # The body was checked by the bridge; aiohttp keeps it, so it reads again here.
    value = (await _json(request)).get("setpoint")
    name = bridge.room(_rt(request), room_id).name
    if value is None:
        what, action, text = f"{name} hold cleared", "setpoint.cleared", "cleared"
    else:
        text = f"{float(value):g}"
        what, action = f"{name} held at {text}°", "setpoint.held"
    _record_control(request, action, "setpoint", what, text, room=room_id)
    return response


async def set_fire(request: web.Request) -> web.Response:
    room_id = request.match_info["room_id"]
    response = await _post(request, bridge.set_fire, room_id)
    lit = bool((await _json(request)).get("lit"))
    name = bridge.room(_rt(request), room_id).name
    what = f"Fire {'lit' if lit else 'out'} in {name}"
    action, word = ("fire.lit", "lit") if lit else ("fire.out", "out")
    _record_control(request, action, "fire", what, word, room=room_id)
    return response


async def boost_store(request: web.Request) -> web.Response:
    response = await _post(request, bridge.boost_store)
    minutes = max(0, min(bridge.BOOST_MAX_MIN, int((await _json(request)).get("minutes", 60))))
    what = f"Hot water boosted for {minutes} min" if minutes else "Hot water boost stopped"
    _record_control(request, "store.boosted", "boost", what, str(minutes))
    return response


async def set_mode(request: web.Request) -> web.Response:
    rt = _rt(request)
    before = rt.mode.value
    response = await _post(request, bridge.set_mode)
    if rt.mode.value != before:
        _record_mode(request, "mode", "Heating mode", before, rt.mode.value)
    return response


async def reset_learning(request: web.Request) -> web.Response:
    response = await _post(request, bridge.reset_learning)
    rooms = json.loads(response.body).get("reset", [])
    if rooms:
        _record_change(
            request,
            "learning.reset",
            "learning",
            f"Learning reset for {len(rooms)} {'room' if len(rooms) == 1 else 'rooms'}",
            rooms=rooms,
        )
    return response


async def people(request: web.Request) -> web.Response:
    return web.json_response(_rt(request).away_view())


async def schedules(request: web.Request) -> web.Response:
    return web.json_response(schedules_view(_rt(request)))


async def suggestions(request: web.Request) -> web.Response:
    return web.json_response(suggestions_view(_rt(request)))


async def savings(request: web.Request) -> web.Response:
    return web.json_response(savings_view(_rt(request)))


async def data(request: web.Request) -> web.Response:
    """Raw data points (`radiate.server.data`); `format=csv` for a CSV file."""
    rt = _rt(request)
    query = {k: ",".join(request.query.getall(k)) for k in request.query}
    try:
        view = data_view(rt, query)
    except QueryError as err:
        raise web.HTTPBadRequest(text=str(err)) from err
    if query.get("format") == "csv":
        return web.Response(
            text=to_csv(view),
            content_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="radiate-data.csv"'},
        )
    if query.get("format") not in (None, "", "json"):
        raise web.HTTPBadRequest(text="format must be json or csv")
    return web.json_response(view)


async def data_series(request: web.Request) -> web.Response:
    rt = _rt(request)
    return web.json_response(series_view(rt, export_view(rt)["otlp"]))


async def export(request: web.Request) -> web.Response:
    return web.json_response(export_view(_rt(request)))


async def ha_dashboard(request: web.Request) -> web.Response:
    """The Home Assistant dashboard for the house, as YAML in JSON (`radiate.server.ha`)."""
    try:
        return web.json_response(bridge.ha_dashboard(_rt(request), dict(request.query)))
    except bridge.RequestError as err:
        raise _http_error(err) from err


async def _household(request: web.Request, method: str, with_body: bool) -> web.Response:
    """The household setup (`bridge.household`). Errors with field paths go as JSON."""
    rt = _rt(request)
    try:
        bridge.setup(rt)  # 404 before the body is read
        body = await _json(request) if with_body else None
        return web.json_response(bridge.household(rt, method, body))
    except bridge.RequestError as err:
        if err.body is not None:
            return web.json_response(err.body, status=err.status)
        raise _http_error(err) from err


async def household(request: web.Request) -> web.Response:
    return await _household(request, "GET", with_body=False)


async def household_preview(request: web.Request) -> web.Response:
    return await _household(request, "PREVIEW", with_body=True)


async def household_save(request: web.Request) -> web.Response:
    role = _role(request)
    if role != ADMIN:
        # The household role saves room adjustments from the week view; the people,
        # routines and the rest of the setup stay with an admin.
        try:
            setup = bridge.setup(_rt(request))
        except bridge.RequestError as err:
            raise _http_error(err) from err
        if not setup.only_adjustments(await _json(request)):
            return _refused(request, ADMIN)
    before = _household_section(_rt(request))
    response = await _household(request, "PUT", with_body=True)
    if response.status == 200:
        _record_household(request, "household.saved", "Household setup saved", before)
    return response


async def household_revert(request: web.Request) -> web.Response:
    before = _household_section(_rt(request))
    response = await _household(request, "DELETE", with_body=False)
    if response.status == 200:
        _record_household(request, "household.reverted", "Household setup reverted", before)
    return response


async def set_away(request: web.Request) -> web.Response:
    pid = request.match_info["person_id"]
    response = await _post(request, bridge.set_away, pid, lookup=bridge.person)
    until = (await _json(request)).get("until")
    if until is None:
        _record_control(
            request, "away.cleared", "away", f"{pid} away cleared", "cleared", person=pid
        )
    else:
        until = str(until)
        what = f"{pid} away until {until}"
        _record_control(request, "away.set", "away", what, until, person=pid)
    return response


async def set_presence(request: web.Request) -> web.Response:
    return await _post(
        request, bridge.set_presence, request.match_info["person_id"], lookup=bridge.person
    )


async def say_home(request: web.Request) -> web.Response:
    pid = request.match_info["person_id"]
    response = await _post(request, bridge.say_home, pid, lookup=bridge.person)
    _record_control(request, "home.said", "home", f"{pid} said to be home", "home", person=pid)
    return response


async def set_ha_persons(request: web.Request) -> web.Response:
    return await _post(request, bridge.set_ha_persons)


async def set_outdoor(request: web.Request) -> web.Response:
    return await _post(request, bridge.set_outdoor)


async def settings(request: web.Request) -> web.Response:
    return web.json_response(_rt(request).settings())


async def set_settings(request: web.Request) -> web.Response:
    role = _role(request)
    if role != ADMIN and not set(await _json(request)) <= HOUSEHOLD_SETTINGS:
        return _refused(request, ADMIN)
    rt = _rt(request)
    before = (rt.demand_mode, rt.effective_demand_mode)
    response = await _post(request, bridge.set_settings)
    if (rt.demand_mode, rt.effective_demand_mode) != before:
        note = "following the house file" if rt.demand_mode is None else ""
        after = rt.effective_demand_mode.value
        _record_mode(request, "demand_mode", "Demand mode", before[1].value, after, note)
    return response


async def _config(request: web.Request, method: str, with_body: bool) -> web.Response:
    """Every house-file setting (`bridge.config`). Errors with field paths go as JSON."""
    rt = _rt(request)
    try:
        bridge.settings_editor(rt)  # 404 before the body is read
        body = None
        if with_body or (method == "DELETE" and request.can_read_body):
            body = await _json(request)
        target = request.match_info.get("target")
        view = bridge.config(rt, method, target, body)
        if method != "GET":
            changed = [*view.get("applied", []), *view.get("restart", [])]
            if changed:
                verb = "saved" if method == "PUT" else "reverted"
                _record_change(
                    request,
                    f"settings.{verb}",
                    "settings",
                    f"Settings {verb}",
                    ", ".join(sorted(changed)),
                    paths=changed,
                )
        return web.json_response(view)
    except bridge.RequestError as err:
        if err.body is not None:
            return web.json_response(err.body, status=err.status)
        raise _http_error(err) from err


async def config(request: web.Request) -> web.Response:
    return await _config(request, "GET", with_body=False)


async def config_save(request: web.Request) -> web.Response:
    return await _config(request, "PUT", with_body=True)


async def config_revert(request: web.Request) -> web.Response:
    return await _config(request, "DELETE", with_body=False)


async def get_layout(request: web.Request) -> web.Response:
    return web.json_response({"layout": _rt(request).layout})


async def put_layout(request: web.Request) -> web.Response:
    response = await _post(request, bridge.set_layout)
    _record_change(request, "layout.saved", "layout", "Layout saved")
    return response


async def audit(request: web.Request) -> web.Response:
    """The security log, newest first (ADR-0008). Admin only. `outcome` (success or
    failure) and `user` filter; `before`, an event ID, pages; `limit` up to 500."""
    q = request.query
    outcome = q.get("outcome") or None
    if outcome not in (None, "success", "failure"):
        raise web.HTTPBadRequest(text="outcome must be success or failure")
    try:
        limit = int(q.get("limit", "100"))
        before = int(q["before"]) if q.get("before") else None
    except ValueError as err:
        raise web.HTTPBadRequest(text="limit and before must be whole numbers") from err
    return web.json_response(
        _security(request).query(outcome, q.get("user") or None, limit, before)
    )


async def devices(request: web.Request) -> web.Response:
    try:
        return web.json_response(bridge.devices(_rt(request)))
    except bridge.RequestError as err:
        raise _http_error(err) from err


async def scan_network(request: web.Request) -> web.Response:
    """Start a network scan. Refusals (409, 429, 503) answer JSON with `message`."""
    rt = _rt(request)
    body = await _json(request) if request.can_read_body else None
    try:
        return web.json_response(bridge.scan_network(rt, body))
    except bridge.RequestError as err:
        if err.body is not None:
            return web.json_response(err.body, status=err.status)
        raise _http_error(err) from err


async def stream(request: web.Request) -> web.WebSocketResponse:
    rt = _rt(request)
    ws = web.WebSocketResponse(heartbeat=30)
    ident = identify(request)
    login = request.app.get(AUTH)
    if ident is not None and ident.session is not None and not login.origin_ok(request):
        # Browsers send cookies on cross-site WebSocket handshakes: refuse other sites.
        _record_denied(request, ident, "origin")
        raise web.HTTPForbidden()
    pending_auth = ident is None
    if pending_auth and not ws.can_prepare(request).ok:
        _record_refused(request, _credential_error(request), "stream.refused")
        raise web.HTTPUnauthorized()
    await ws.prepare(request)
    token = request.app[TOKEN]
    if pending_auth:
        # With no token set there is nothing to wait for: only a session lets it in.
        error = await _stream_handshake(ws, token) if token else _credential_error(request)
        if error is not None:
            if error == "no_credentials":
                error = _credential_error(request)
            _record_refused(request, error, "stream.refused")
            await ws.close(code=WS_UNAUTHORISED, message=b"unauthorised")
            return ws
    session = ident.session if ident is not None else None
    checked = asyncio.get_running_loop().time()
    q: asyncio.Queue = asyncio.Queue(maxsize=4)
    rt.listeners.append(q)
    await ws.send_json(rt.describe())

    async def reader():
        async for msg in ws:
            if msg.type in (WSMsgType.ERROR, WSMsgType.CLOSE):
                break

    task = asyncio.create_task(reader())
    try:
        while not ws.closed:
            get = asyncio.create_task(q.get())
            done, _ = await asyncio.wait({get, task}, return_when=asyncio.FIRST_COMPLETED)
            if task in done:
                get.cancel()
                break
            now = asyncio.get_running_loop().time()
            if session is not None and now - checked >= SESSION_RECHECK_S:
                checked = now
                if not login.still_valid(session):
                    await ws.close(code=WS_UNAUTHORISED, message=b"session ended")
                    break
            await ws.send_json(get.result())
    finally:
        rt.listeners.remove(q)
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task
    return ws


def create_app(
    runtime: Runtime,
    token: str = "",
    web_dir: Path | None = None,
    ingress_ip: str = "",
    login: AuthService | None = None,
    security: SecurityLog | None = None,
    trusted_proxies: tuple[str, ...] = (),
) -> web.Application:
    """The web app. `login` turns on user login (ADR-0006); without it, the token and
    ingress checks are all there is, as before. `security` is the security log
    (ADR-0008), the runtime's if it has one, else one in memory; `trusted_proxies`
    (`auth.trusted_proxies`) say whose X-Forwarded-For the log believes with login off."""
    app = web.Application(middlewares=[auth])
    app[RUNTIME] = runtime
    app[TOKEN] = token
    app[INGRESS_IP] = ingress_ip
    security = security or getattr(runtime, "security", None) or SecurityLog.memory()
    if getattr(runtime, "security", None) is None and hasattr(runtime, "security"):
        runtime.security = security
    if security.sink is None and callable(getattr(runtime, "telemetry_event", None)):
        security.sink = runtime.telemetry_event
    app[SECURITY] = security
    app[PROXIES] = proxy_networks(trusted_proxies)
    if login is not None:
        login.security = security
        app[AUTH] = login
    add_routes(app)
    app.add_routes(
        [
            web.get("/api/v1/health", health),
            web.get("/api/v1/house", house),
            web.get("/api/v1/state", state),
            web.get("/api/v1/decisions", decisions),
            web.post("/api/v1/rooms/{room_id}/setpoint", set_setpoint),
            web.post("/api/v1/rooms/{room_id}/fire", set_fire),
            web.post("/api/v1/store/boost", boost_store),
            web.post("/api/v1/mode", set_mode),
            web.post("/api/v1/learning/reset", reset_learning),
            web.get("/api/v1/people", people),
            web.get("/api/v1/schedules", schedules),
            web.get("/api/v1/suggestions", suggestions),
            web.get("/api/v1/savings", savings),
            web.get("/api/v1/data", data),
            web.get("/api/v1/data/series", data_series),
            web.get("/api/v1/export", export),
            web.get("/api/v1/ha/dashboard", ha_dashboard),
            web.get("/api/v1/household", household),
            web.post("/api/v1/household/preview", household_preview),
            web.put("/api/v1/household", household_save),
            web.delete("/api/v1/household", household_revert),
            web.post("/api/v1/people/{person_id}/away", set_away),
            web.post("/api/v1/people/{person_id}/presence", set_presence),
            web.post("/api/v1/people/{person_id}/home", say_home),
            web.post("/api/v1/ha/persons", set_ha_persons),
            web.post("/api/v1/outdoor", set_outdoor),
            web.get("/api/v1/settings", settings),
            web.post("/api/v1/settings", set_settings),
            web.get("/api/v1/settings/config", config),
            web.put("/api/v1/settings/config", config_save),
            web.delete("/api/v1/settings/config", config_revert),
            web.delete("/api/v1/settings/config/{target}", config_revert),
            web.get("/api/v1/layout", get_layout),
            web.put("/api/v1/layout", put_layout),
            web.get("/api/v1/devices", devices),
            web.post("/api/v1/devices/scan", scan_network),
            web.get("/api/v1/audit", audit),
            web.get(STREAM_PATH, stream),
        ]
    )
    root = web_dir or WEB_DIR
    if root.exists():

        async def index(_: web.Request) -> web.FileResponse:
            return web.FileResponse(root / "index.html")

        async def login_page(_: web.Request) -> web.FileResponse:
            return web.FileResponse(root / "login.html")

        app.router.add_get("/", index)
        app.router.add_get("/login", login_page)
        app.router.add_static("/static/", root, show_index=False)
    return app
