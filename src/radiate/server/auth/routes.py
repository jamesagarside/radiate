"""Login routes: password login, sign out, who am I, OIDC and SAML (ADR-0006).

Failures tell the browser as little as possible ("not accepted", "single sign-on
failed") and log the reason for the owner, never with a secret in it.
"""

from __future__ import annotations

import asyncio
import hmac
import logging
import math

from aiohttp import web

from .accounts import normalise_username
from .oidc import PENDING_TTL_S, OidcError
from .passwords import DUMMY_HASH, MAX_LENGTH, verify_password
from .saml import SamlError
from .service import OIDC_COOKIE, AuthService, Identity

log = logging.getLogger("radiate.auth")

AUTH = web.AppKey("auth", AuthService)
# Who the request is from, set by the server's middleware. RequestKey is newer than the
# oldest aiohttp Radiate supports, so fall back to a plain key there.
IDENTITY = (
    web.RequestKey("identity", Identity) if hasattr(web, "RequestKey") else "radiate.identity"
)


def _auth(request: web.Request) -> AuthService | None:
    return request.app.get(AUTH)


def _home(auth: AuthService) -> str:
    return f"{auth.cfg.public_url}/"


def _failed(auth: AuthService, why: str) -> web.HTTPFound:
    log.warning("single sign-on failed: %s", why)
    return web.HTTPFound(f"{auth.cfg.public_url}/login?error=sso")


async def auth_config(request: web.Request) -> web.Response:
    """Public: whether login is on and how to sign in. Nothing secret."""
    auth = _auth(request)
    if auth is None:
        return web.json_response({"login": False, "methods": [], "first_user_needed": False})
    first = auth.cfg.local and auth.accounts.count_users() == 0
    return web.json_response({"login": True, "methods": auth.methods(), "first_user_needed": first})


async def login(request: web.Request) -> web.Response:
    auth = _auth(request)
    if auth is None or not auth.cfg.local:
        raise web.HTTPNotFound()
    # JSON only: a cross-site form can't send it without a preflight Radiate never allows.
    if request.content_type != "application/json":
        raise web.HTTPUnsupportedMediaType(text="expected application/json")
    try:
        body = await request.json()
    except ValueError as err:
        raise web.HTTPBadRequest(text="invalid JSON") from err
    if not isinstance(body, dict):
        raise web.HTTPBadRequest(text="expected an object")
    username, password = body.get("username"), body.get("password")
    if not isinstance(username, str) or not isinstance(password, str):
        raise web.HTTPBadRequest(text="username and password are required")
    key = username.strip().lower()[:128]
    address = auth.client_ip(request)
    wait = auth.limiter.retry_after(key, address)
    if wait > 0:
        seconds = math.ceil(wait)
        log.warning("login locked for %r from %s for %d s", key, address, seconds)
        return web.json_response(
            {"error": "locked", "retry_after_s": seconds},
            status=429,
            headers={"Retry-After": str(seconds)},
        )
    try:
        name = normalise_username(username)
    except ValueError:
        name = None
    user = auth.accounts.user(name) if name else None
    candidate = password[: MAX_LENGTH + 1]
    stored = user.password_hash if user else DUMMY_HASH
    ok = await asyncio.to_thread(verify_password, candidate, stored)
    if user is None or not ok:
        auth.limiter.failed(key, address)
        log.warning("login refused for %r from %s", key, address)
        return web.json_response({"error": "invalid"}, status=401)
    auth.limiter.succeeded(key)
    response = web.json_response({"user": user.username, "role": user.role})
    auth.start_session(request, response, user.username, user.role, "local")
    return response


async def logout(request: web.Request) -> web.Response:
    auth = _auth(request)
    response = web.json_response({"ok": True})
    if auth is not None:
        auth.end_session(request, response)
    return response


async def me(request: web.Request) -> web.Response:
    ident: Identity = request[IDENTITY]
    out: dict = {"via": ident.via, "role": ident.role, "user": None, "method": None}
    if ident.session is not None:
        s = ident.session
        out.update(user=s.username, method=s.method, csrf=s.csrf, expires=s.expires)
    return web.json_response(out)


# --- OIDC -------------------------------------------------------------------------------


async def oidc_start(request: web.Request) -> web.Response:
    auth = _auth(request)
    if auth is None or auth.oidc is None:
        raise web.HTTPNotFound()
    try:
        state, url = await auth.oidc.start()
    except (OidcError, OSError) as err:
        raise _failed(auth, f"cannot start: {err}") from err
    response = web.HTTPFound(url)
    # Binds the callback to this browser, so a login can't be finished in another one.
    response.set_cookie(
        OIDC_COOKIE,
        state,
        max_age=int(PENDING_TTL_S),
        path="/auth/oidc/",
        httponly=True,
        secure=auth.is_secure(request),
        samesite="Lax",
    )
    raise response


async def oidc_callback(request: web.Request) -> web.Response:
    auth = _auth(request)
    if auth is None or auth.oidc is None:
        raise web.HTTPNotFound()
    state = request.query.get("state", "")
    pending = auth.oidc.take_pending(state) if state else None  # used once, even on failure
    cookie = request.cookies.get(OIDC_COOKIE, "")
    if pending is None:
        raise _failed(auth, "unknown, expired or replayed state")
    if not cookie or not hmac.compare_digest(cookie.encode(), state.encode()):
        raise _failed(auth, "state is not the one this browser started with")
    if "error" in request.query:
        raise _failed(auth, f"provider said {request.query.get('error')!r}")
    code = request.query.get("code")
    if not code:
        raise _failed(auth, "no code in the callback")
    try:
        identity = await auth.oidc.finish(code, pending)
    except (OidcError, OSError, ValueError) as err:
        raise _failed(auth, str(err)) from err
    response = web.HTTPFound(_home(auth))
    response.del_cookie(OIDC_COOKIE, path="/auth/oidc/")
    auth.start_session(request, response, identity.username, identity.role, "oidc")
    raise response


# --- SAML -------------------------------------------------------------------------------


async def saml_start(request: web.Request) -> web.Response:
    auth = _auth(request)
    if auth is None or auth.saml is None:
        raise web.HTTPNotFound()
    try:
        url = auth.saml.start()
    except Exception as err:  # python3-saml raises its own error types
        raise _failed(auth, f"cannot start SAML: {err}") from err
    raise web.HTTPFound(url)


async def saml_acs(request: web.Request) -> web.Response:
    auth = _auth(request)
    if auth is None or auth.saml is None:
        raise web.HTTPNotFound()
    form = {k: v for k, v in (await request.post()).items() if isinstance(v, str)}
    try:
        identity = auth.saml.finish(form)
    except SamlError as err:
        raise _failed(auth, str(err)) from err
    response = web.HTTPSeeOther(_home(auth))
    auth.start_session(request, response, identity.username, identity.role, "saml")
    raise response


async def saml_metadata(request: web.Request) -> web.Response:
    auth = _auth(request)
    if auth is None or auth.saml is None:
        raise web.HTTPNotFound()
    return web.Response(text=auth.saml.metadata(), content_type="application/samlmetadata+xml")


def add_routes(app: web.Application) -> None:
    app.add_routes(
        [
            web.get("/api/v1/auth/config", auth_config),
            web.post("/api/v1/auth/login", login),
            web.post("/api/v1/auth/logout", logout),
            web.get("/api/v1/auth/me", me),
            web.get("/auth/oidc/start", oidc_start),
            web.get("/auth/oidc/callback", oidc_callback),
            web.get("/auth/saml/start", saml_start),
            web.post("/auth/saml/acs", saml_acs),
            web.get("/auth/saml/metadata", saml_metadata),
        ]
    )
