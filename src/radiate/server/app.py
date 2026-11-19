"""HTTP and WebSocket API plus the web UI (spec 8.1)."""

from __future__ import annotations

import asyncio
import contextlib
import hmac
import os
from pathlib import Path

from aiohttp import WSMsgType, web

from . import bridge
from .runtime import Runtime

RUNTIME = web.AppKey("runtime", Runtime)
TOKEN = web.AppKey("token", str)
INGRESS_IP = web.AppKey("ingress_ip", str)
SUPERVISOR_INGRESS_IP = "172.30.32.2"
_PKG_WEB = Path(__file__).resolve().parents[1] / "web"  # installed wheel
_REPO_WEB = Path(__file__).resolve().parents[3] / "web"  # source checkout
WEB_DIR = Path(os.environ.get("RADIATE_WEB_DIR") or (_PKG_WEB if _PKG_WEB.exists() else _REPO_WEB))


@web.middleware
async def auth(request: web.Request, handler):
    token = request.app[TOKEN]
    path = request.path
    if token and path.startswith("/api/") and path != "/api/v1/health":
        # Home Assistant ingress authenticates upstream. Trust it only from the
        # Supervisor's ingress address, never from the header alone.
        ingress_ip = request.app[INGRESS_IP]
        ingress = (
            bool(ingress_ip)
            and request.remote == ingress_ip
            and "X-Ingress-Path" in request.headers
        )
        supplied = request.headers.get("Authorization", "").removeprefix("Bearer ")
        if not ingress and not hmac.compare_digest(supplied, token):
            raise web.HTTPUnauthorized()
    return await handler(request)


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


async def _post(request: web.Request, action, *args) -> web.Response:
    """Run a shared `bridge` action so the server and the browser demo agree."""
    rt = _rt(request)
    try:
        if args:
            bridge.room(rt, args[0])  # unknown room is a 404 before the body is read
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


async def stream(request: web.Request) -> web.WebSocketResponse:
    rt = _rt(request)
    ws = web.WebSocketResponse(heartbeat=30)
    await ws.prepare(request)
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
            web.get("/api/v1/stream", stream),
        ]
    )
    root = web_dir or WEB_DIR
    if root.exists():
        app.router.add_get("/", index)
        app.router.add_static("/static/", root, show_index=False)
    return app
