"""Login state for the web server: sessions, cookies, client addresses (ADR-0006)."""

from __future__ import annotations

import asyncio
import contextlib
import hmac
import ipaddress
import logging
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

import aiohttp
from aiohttp import web

from radiate.config.auth import AuthConfig
from radiate.export import telemetry
from radiate.server.security import SecurityLog

from .accounts import Accounts, Session
from .limiter import LoginLimiter
from .oidc import OidcClient
from .saml import INSTALL_HINT, SamlServiceProvider

log = logging.getLogger("radiate.auth")

SESSION_COOKIE = "radiate_session"
OIDC_COOKIE = "radiate_oidc"
CSRF_HEADER = "X-CSRF-Token"
OIDC_CALLBACK = "/auth/oidc/callback"


# How a session's method is named in the security log.
METHOD_NAMES = {"local": "password", "oidc": "oidc", "saml": "saml"}
REASON_WORDS = {
    "expired": "expired",
    "idle": "idle too long",
    "password_reset": "password reset",
    "role_changed": "role changed",
    "user_removed": "user removed",
}


def proxy_networks(proxies: Iterable[str]) -> tuple:
    return tuple(ipaddress.ip_network(p) for p in proxies)


def _trusted(address: str | None, proxies: tuple) -> bool:
    if not address or not proxies:
        return False
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return False
    return any(ip in net for net in proxies)


def forwarded_client(request: web.BaseRequest, proxies: tuple) -> str:
    """The client's address. X-Forwarded-For counts only from a trusted proxy, and
    then the rightmost address that isn't itself a trusted proxy."""
    remote = request.remote or ""
    if not _trusted(remote, proxies):
        return remote
    hops = [h.strip() for h in request.headers.get("X-Forwarded-For", "").split(",")]
    for hop in reversed([h for h in hops if h]):
        if not _trusted(hop, proxies):
            return hop
    return remote


class AuthSetupError(RuntimeError):
    """Login is configured but can't start: a missing secret, extra or metadata."""


@dataclass(frozen=True, slots=True)
class Identity:
    """Who a request is from. `via` is ingress, token, session or open."""

    via: str
    role: str
    session: Session | None = None


class AuthService:
    def __init__(
        self,
        cfg: AuthConfig,
        accounts: Accounts,
        oidc: OidcClient | None = None,
        saml: SamlServiceProvider | None = None,
        limiter: LoginLimiter | None = None,
        security: SecurityLog | None = None,
    ):
        self.cfg = cfg
        self.accounts = accounts
        self.oidc = oidc
        self.saml = saml
        self.limiter = limiter or LoginLimiter()
        self.security = security or SecurityLog(None)
        self._proxies = proxy_networks(cfg.trusted_proxies)
        accounts.on_session_end = self._session_ended
        accounts.prune(cfg.idle_s)

    async def close(self) -> None:
        if self.oidc is not None:
            await self.oidc.close()

    # --- the request ---------------------------------------------------------------

    def _trusted(self, address: str | None) -> bool:
        return _trusted(address, self._proxies)

    def client_ip(self, request: web.BaseRequest) -> str:
        """The client's address. X-Forwarded-For counts only from a trusted proxy, and
        then the rightmost address that isn't itself a trusted proxy."""
        return forwarded_client(request, self._proxies)

    def is_secure(self, request: web.Request) -> bool:
        if self.cfg.secure_cookie == "always":
            return True
        if self.cfg.secure_cookie == "never":
            return False
        if request.secure:
            return True
        if self._trusted(request.remote):
            proto = request.headers.get("X-Forwarded-Proto", "").split(",")[0].strip()
            return proto.lower() == "https"
        return False

    def origin_ok(self, request: web.Request) -> bool:
        """A browser's Origin, if sent, is this server's own address."""
        origin = request.headers.get("Origin")
        if origin is None:
            return True
        netloc = urlsplit(origin).netloc.lower()
        allowed = {request.host.lower()}
        if self._trusted(request.remote) and "X-Forwarded-Host" in request.headers:
            allowed.add(request.headers["X-Forwarded-Host"].split(",")[0].strip().lower())
        if self.cfg.public_url:
            allowed.add(urlsplit(self.cfg.public_url).netloc.lower())
        return netloc in allowed

    def session_for(self, request: web.Request) -> Session | None:
        session_id = request.cookies.get(SESSION_COOKIE)
        if not session_id:
            return None
        return self.accounts.session(session_id, self.cfg.idle_s)

    def still_valid(self, session: Session) -> bool:
        """For long-lived streams: the session hasn't ended or been signed out."""
        row = self.accounts.db.execute(
            "SELECT id_hash, username, role, method, csrf, created, last_seen, expires "
            "FROM sessions WHERE id_hash = ?",
            (session.id_hash,),
        ).fetchone()
        if row is None:
            return False
        return not self.accounts.expire(Session(*row), self.cfg.idle_s)

    @staticmethod
    def csrf_ok(request: web.Request, session: Session) -> bool:
        supplied = request.headers.get(CSRF_HEADER, "")
        return bool(supplied) and hmac.compare_digest(supplied.encode(), session.csrf.encode())

    # --- cookies -------------------------------------------------------------------

    def start_session(
        self,
        request: web.Request,
        response: web.StreamResponse,
        username: str,
        role: str,
        method: str,
    ) -> Session:
        session_id, session = self.accounts.create_session(
            username, role, method, self.cfg.session_s
        )
        response.set_cookie(
            SESSION_COOKIE,
            session_id,
            max_age=int(self.cfg.session_s),
            path="/",
            httponly=True,
            secure=self.is_secure(request),
            samesite="Lax",
        )
        how = METHOD_NAMES.get(method, method)
        self.security.record(
            telemetry.SECURITY_LOGIN,
            "login",
            f"Signed in: {username} ({role}, {how})",
            {
                "user.name": username,
                "user.roles": [role],
                "source.address": self.client_ip(request),
                "radiate.auth.method": how,
            },
        )
        return session

    # --- the security log ----------------------------------------------------------

    def login_failed(
        self,
        request: web.BaseRequest,
        method: str,
        code: str,
        why: str,
        username: str | None = None,
    ) -> None:
        """A refused sign-in. `why` is for people; `code` is the schema's error.type."""
        who = f" for {username}" if username else ""
        self.security.record(
            telemetry.SECURITY_LOGIN_FAILED,
            "login",
            f"Sign-in refused{who}: {why}",
            {
                "user.name": username,
                "source.address": self.client_ip(request),
                "radiate.auth.method": METHOD_NAMES.get(method, method),
                "error.type": code if code in telemetry.LOGIN_ERRORS else "bad_claims",
            },
        )

    def lockouts(self, started: list[tuple[str, str, float]]) -> None:
        """Record lockouts the limiter just started, and their end when it comes."""
        for scope, value, seconds in started:
            attrs = {"radiate.lockout.scope": scope}
            attrs["user.name" if scope == "username" else "source.address"] = value
            self.security.record(
                telemetry.SECURITY_LOCKOUT_STARTED,
                "lockout.started",
                f"Sign-in locked for {seconds:.0f} s: {scope} {value}",
                {**attrs, "radiate.lockout.duration": round(seconds, 1)},
            )
            # Without a running event loop nothing can time the end.
            with contextlib.suppress(RuntimeError):
                asyncio.get_running_loop().call_later(
                    max(0.0, seconds),
                    self.security.record,
                    telemetry.SECURITY_LOCKOUT_ENDED,
                    "lockout.ended",
                    f"Sign-in lockout ended: {scope} {value}",
                    attrs,
                )

    def _session_ended(
        self, username: str, role: str | None, method: str, reason: str, count: int
    ) -> None:
        record_session_end(self.security, username, role, method, reason, count)

    def end_session(
        self, request: web.Request, response: web.StreamResponse, session: Session | None = None
    ) -> None:
        session_id = request.cookies.get(SESSION_COOKIE)
        if session_id:
            self.accounts.end_session(session_id)
        response.del_cookie(SESSION_COOKIE, path="/")
        if session is not None:
            self.security.record(
                telemetry.SECURITY_LOGOUT,
                "logout",
                f"Signed out: {session.username}",
                {
                    "user.name": session.username,
                    "user.roles": [session.role],
                    "source.address": self.client_ip(request),
                    "radiate.auth.method": METHOD_NAMES.get(session.method, session.method),
                },
            )

    def methods(self) -> list[dict]:
        out = []
        if self.cfg.local:
            out.append({"id": "local"})
        if self.oidc is not None:
            out.append({"id": "oidc", "label": self.cfg.oidc.label, "url": "auth/oidc/start"})
        if self.saml is not None:
            out.append({"id": "saml", "label": self.cfg.saml.label, "url": "auth/saml/start"})
        return out


def _read_secret_file(path: str) -> str:
    try:
        return Path(path).read_text(encoding="utf-8").strip()
    except OSError as err:
        raise AuthSetupError(
            f"auth.oidc.client_secret_file: cannot read {path}: {err.strerror}"
        ) from err


async def _saml_metadata(cfg, http: aiohttp.ClientSession | None) -> str:
    if cfg.idp_metadata_file:
        try:
            return Path(cfg.idp_metadata_file).read_text(encoding="utf-8")
        except OSError as err:
            raise AuthSetupError(
                f"auth.saml.idp_metadata_file: cannot read {cfg.idp_metadata_file}: {err.strerror}"
            ) from err
    own = http is None
    http = http or aiohttp.ClientSession()
    try:
        async with http.get(cfg.idp_metadata_url, timeout=aiohttp.ClientTimeout(total=15)) as res:
            if res.status != 200:
                raise AuthSetupError(
                    f"auth.saml.idp_metadata_url: HTTP {res.status} from {cfg.idp_metadata_url}"
                )
            return await res.text()
    except aiohttp.ClientError as err:
        raise AuthSetupError(f"auth.saml.idp_metadata_url: {err}") from err
    finally:
        if own:
            await http.close()


async def create_auth(
    cfg: AuthConfig,
    accounts: Accounts,
    http: aiohttp.ClientSession | None = None,
    security: SecurityLog | None = None,
) -> AuthService:
    """Everything login needs, or AuthSetupError saying what is missing."""
    oidc = None
    if cfg.oidc is not None:
        try:
            import joserfc  # noqa: F401
        except ImportError as err:
            raise AuthSetupError(
                "auth.oidc: needs the joserfc package, part of radiate[server]"
            ) from err
        secret = cfg.oidc.client_secret
        if cfg.oidc.client_secret_file:
            secret = _read_secret_file(cfg.oidc.client_secret_file)
        oidc = OidcClient(cfg.oidc, f"{cfg.public_url}{OIDC_CALLBACK}", secret or None, http)
    saml = None
    if cfg.saml is not None:
        from . import saml as saml_module

        if not saml_module.available():
            raise AuthSetupError(f"auth.saml: {INSTALL_HINT}")
        try:
            idp = saml_module.parse_idp_metadata(await _saml_metadata(cfg.saml, http))
        except saml_module.SamlError as err:
            raise AuthSetupError(f"auth.saml: {err}") from err
        saml = SamlServiceProvider(cfg.saml, cfg.public_url, idp)
    return AuthService(cfg, accounts, oidc=oidc, saml=saml, security=security)


def record_session_end(
    security: SecurityLog, username: str, role: str | None, method: str, reason: str, count: int
) -> None:
    """Sessions that ended without signing out (`Accounts.on_session_end`), for the
    security log. The command line uses it too, when `radiate users` ends sessions."""
    if reason in ("expired", "idle"):
        message = f"Session {REASON_WORDS[reason]}: {username}"
        action = "session.expired" if reason == "expired" else "session.idle"
    else:
        noun = "session" if count == 1 else "sessions"
        message = f"{count} {noun} ended for {username}: {REASON_WORDS.get(reason, reason)}"
        action = "session.revoked"
    security.record(
        telemetry.SECURITY_SESSION_ENDED,
        action,
        message,
        {
            "user.name": username,
            "user.roles": [role] if role else None,
            "radiate.auth.method": METHOD_NAMES.get(method, method),
            "event.reason": reason,
            "radiate.sessions.ended": count,
        },
    )
