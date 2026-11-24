"""HTTP and WebSocket API plus the web UI (spec 8.1)."""

from __future__ import annotations

import asyncio
import contextlib
import hmac
import json
import os
from pathlib import Path

from aiohttp import WSMsgType, web

from . import bridge
from .auth import AUTH, IDENTITY, AuthService, Identity, add_routes
from .data import QueryError, data_view, export_view, series_view, to_csv
from .permissions import ADMIN, HOUSEHOLD_SETTINGS, PUBLIC, allowed, needed_role
from .runtime import Runtime
from .savings import savings_view
from .schedules import schedules_view
from .suggestions import suggestions_view

RUNTIME = web.AppKey("runtime", Runtime)
TOKEN = web.AppKey("token", str)
INGRESS_IP = web.AppKey("ingress_ip", str)
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


def _refused(role: str, needed: str) -> web.Response:
    """403 for a role below what the route needs. `error` names the caller's role, as
    `viewer` always has; `needs` is the role that may."""
    return web.json_response({"error": role, "needs": needed}, status=403)


@web.middleware
async def auth(request: web.Request, handler):
    """Who may call what: `radiate.server.permissions` holds one entry per route."""
    if request.path.startswith("/api/"):
        needed = needed_role(request)
        if needed != PUBLIC:
            ident = identify(request)
            if ident is None:
                _count_denied(request)
                raise web.HTTPUnauthorized()
            if ident.session is not None and request.method not in SAFE_METHODS:
                # A cookie is sent automatically, so a change must also prove it came
                # from Radiate's own page, which alone can read the session's CSRF token.
                if not AuthService.csrf_ok(request, ident.session):
                    return web.json_response({"error": "csrf"}, status=403)
            if not allowed(ident.role, needed):
                return _refused(ident.role, needed)
            request[IDENTITY] = ident
    response = await handler(request)
    if request.path == LOGIN_PATH and response.status == 401:
        _count_denied(request)  # a wrong username or password
    return response


def _count_denied(request: web.Request) -> None:
    """Count a refused request for the OpenTelemetry export's radiate.auth.denied: a
    count only, never who sent it."""
    rt = request.app.get(RUNTIME)
    if isinstance(getattr(rt, "auth_denied", None), int):
        rt.auth_denied += 1


def _role(request: web.Request) -> str:
    ident = request.get(IDENTITY)
    return ident.role if ident is not None else ADMIN


async def _stream_handshake(ws: web.WebSocketResponse, token: str) -> bool:
    """Wait for the first message and check it carries the token."""
    try:
        msg = await ws.receive(timeout=STREAM_AUTH_TIMEOUT_S)
    except TimeoutError:
        return False
    if msg.type is not WSMsgType.TEXT:
        return False
    try:
        body = json.loads(msg.data)
    except ValueError:
        return False
    supplied = body.get("token") if isinstance(body, dict) else None
    return isinstance(supplied, str) and _token_ok(supplied, token)


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


async def set_setpoint(request: web.Request) -> web.Response:
    return await _post(request, bridge.set_setpoint, request.match_info["room_id"])


async def set_fire(request: web.Request) -> web.Response:
    return await _post(request, bridge.set_fire, request.match_info["room_id"])


async def boost_store(request: web.Request) -> web.Response:
    return await _post(request, bridge.boost_store)


async def set_mode(request: web.Request) -> web.Response:
    return await _post(request, bridge.set_mode)


async def reset_learning(request: web.Request) -> web.Response:
    return await _post(request, bridge.reset_learning)


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
            return _refused(role, ADMIN)
    return await _household(request, "PUT", with_body=True)


async def household_revert(request: web.Request) -> web.Response:
    return await _household(request, "DELETE", with_body=False)


async def set_away(request: web.Request) -> web.Response:
    return await _post(
        request, bridge.set_away, request.match_info["person_id"], lookup=bridge.person
    )


async def set_presence(request: web.Request) -> web.Response:
    return await _post(
        request, bridge.set_presence, request.match_info["person_id"], lookup=bridge.person
    )


async def say_home(request: web.Request) -> web.Response:
    return await _post(
        request, bridge.say_home, request.match_info["person_id"], lookup=bridge.person
    )


async def set_ha_persons(request: web.Request) -> web.Response:
    return await _post(request, bridge.set_ha_persons)


async def set_outdoor(request: web.Request) -> web.Response:
    return await _post(request, bridge.set_outdoor)


async def settings(request: web.Request) -> web.Response:
    return web.json_response(_rt(request).settings())


async def set_settings(request: web.Request) -> web.Response:
    role = _role(request)
    if role != ADMIN and not set(await _json(request)) <= HOUSEHOLD_SETTINGS:
        return _refused(role, ADMIN)
    return await _post(request, bridge.set_settings)


async def _config(request: web.Request, method: str, with_body: bool) -> web.Response:
    """Every house-file setting (`bridge.config`). Errors with field paths go as JSON."""
    rt = _rt(request)
    try:
        bridge.settings_editor(rt)  # 404 before the body is read
        body = None
        if with_body or (method == "DELETE" and request.can_read_body):
            body = await _json(request)
        target = request.match_info.get("target")
        return web.json_response(bridge.config(rt, method, target, body))
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
    return await _post(request, bridge.set_layout)


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
        raise web.HTTPForbidden()
    pending_auth = ident is None
    if pending_auth and not ws.can_prepare(request).ok:
        _count_denied(request)
        raise web.HTTPUnauthorized()
    await ws.prepare(request)
    token = request.app[TOKEN]
    if pending_auth and (not token or not await _stream_handshake(ws, token)):
        _count_denied(request)
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
) -> web.Application:
    """The web app. `login` turns on user login (ADR-0006); without it, the token and
    ingress checks are all there is, as before."""
    app = web.Application(middlewares=[auth])
    app[RUNTIME] = runtime
    app[TOKEN] = token
    app[INGRESS_IP] = ingress_ip
    if login is not None:
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
