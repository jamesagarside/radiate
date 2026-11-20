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
from .runtime import Runtime
from .schedules import schedules_view

RUNTIME = web.AppKey("runtime", Runtime)
TOKEN = web.AppKey("token", str)
INGRESS_IP = web.AppKey("ingress_ip", str)
SUPERVISOR_INGRESS_IP = "172.30.32.2"
_PKG_WEB = Path(__file__).resolve().parents[1] / "web"  # installed wheel
_REPO_WEB = Path(__file__).resolve().parents[3] / "web"  # source checkout
WEB_DIR = Path(os.environ.get("RADIATE_WEB_DIR") or (_PKG_WEB if _PKG_WEB.exists() else _REPO_WEB))


STREAM_PATH = "/api/v1/stream"
# A browser cannot set headers on a WebSocket, so the stream also accepts the token
# as its first message: {"token": "..."}. Close code 4401 means it was refused.
STREAM_AUTH_TIMEOUT_S = 10.0
WS_UNAUTHORISED = 4401


def _token_ok(supplied: str, token: str) -> bool:
    # Compare bytes: compare_digest rejects non-ASCII str, which a client can send.
    return hmac.compare_digest(supplied.encode(), token.encode())


def _authorised(request: web.Request) -> bool:
    token = request.app[TOKEN]
    if not token:
        return True
    # Home Assistant ingress authenticates upstream. Trust it only from the
    # Supervisor's ingress address, never from the header alone.
    ingress_ip = request.app[INGRESS_IP]
    if ingress_ip and request.remote == ingress_ip and "X-Ingress-Path" in request.headers:
        return True
    auth_header = request.headers.get("Authorization", "")
    return auth_header.startswith("Bearer ") and _token_ok(auth_header[7:], token)


@web.middleware
async def auth(request: web.Request, handler):
    path = request.path
    # The stream checks its own token so a browser can send it after the upgrade.
    if path.startswith("/api/") and path not in ("/api/v1/health", STREAM_PATH):
        if not _authorised(request):
            raise web.HTTPUnauthorized()
    return await handler(request)


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


async def people(request: web.Request) -> web.Response:
    return web.json_response(_rt(request).away_view())


async def schedules(request: web.Request) -> web.Response:
    return web.json_response(schedules_view(_rt(request)))


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


async def settings(request: web.Request) -> web.Response:
    return web.json_response(_rt(request).settings())


async def set_settings(request: web.Request) -> web.Response:
    return await _post(request, bridge.set_settings)


async def stream(request: web.Request) -> web.WebSocketResponse:
    rt = _rt(request)
    ws = web.WebSocketResponse(heartbeat=30)
    pending_auth = not _authorised(request)
    if pending_auth and not ws.can_prepare(request).ok:
        raise web.HTTPUnauthorized()
    await ws.prepare(request)
    if pending_auth and not await _stream_handshake(ws, request.app[TOKEN]):
        await ws.close(code=WS_UNAUTHORISED, message=b"unauthorised")
        return ws
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
            await ws.send_json(get.result())
    finally:
        rt.listeners.remove(q)
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task
    return ws


async def index(_: web.Request) -> web.FileResponse:
    return web.FileResponse(WEB_DIR / "index.html")


def create_app(
    runtime: Runtime, token: str = "", web_dir: Path | None = None, ingress_ip: str = ""
) -> web.Application:
    app = web.Application(middlewares=[auth])
    app[RUNTIME] = runtime
    app[TOKEN] = token
    app[INGRESS_IP] = ingress_ip
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
            web.get("/api/v1/people", people),
            web.get("/api/v1/schedules", schedules),
            web.get("/api/v1/household", household),
            web.post("/api/v1/household/preview", household_preview),
            web.put("/api/v1/household", household_save),
            web.delete("/api/v1/household", household_revert),
            web.post("/api/v1/people/{person_id}/away", set_away),
            web.post("/api/v1/people/{person_id}/presence", set_presence),
            web.get("/api/v1/settings", settings),
            web.post("/api/v1/settings", set_settings),
            web.get(STREAM_PATH, stream),
        ]
    )
    root = web_dir or WEB_DIR
    if root.exists():
        app.router.add_get("/", index)
        app.router.add_static("/static/", root, show_index=False)
    return app
