"""Login state for the web server: sessions, cookies, client addresses (ADR-0006)."""

from __future__ import annotations

import hmac
import ipaddress
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

import aiohttp
from aiohttp import web

from radiate.config.auth import AuthConfig

from .accounts import Accounts, Session
from .limiter import LoginLimiter
from .oidc import OidcClient
from .saml import INSTALL_HINT, SamlServiceProvider

log = logging.getLogger("radiate.auth")

SESSION_COOKIE = "radiate_session"
OIDC_COOKIE = "radiate_oidc"
CSRF_HEADER = "X-CSRF-Token"
OIDC_CALLBACK = "/auth/oidc/callback"


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
    ):
        self.cfg = cfg
        self.accounts = accounts
        self.oidc = oidc
        self.saml = saml
        self.limiter = limiter or LoginLimiter()
        self._proxies = tuple(ipaddress.ip_network(p) for p in cfg.trusted_proxies)
        accounts.prune(cfg.idle_s)

    async def close(self) -> None:
        if self.oidc is not None:
            await self.oidc.close()

    # --- the request ---------------------------------------------------------------

    def _trusted(self, address: str | None) -> bool:
        if not address or not self._proxies:
            return False
        try:
            ip = ipaddress.ip_address(address)
        except ValueError:
            return False
        return any(ip in net for net in self._proxies)

    def client_ip(self, request: web.Request) -> str:
        """The client's address. X-Forwarded-For counts only from a trusted proxy, and
        then the rightmost address that isn't itself a trusted proxy."""
        remote = request.remote or ""
        if not self._trusted(remote):
            return remote
        hops = [h.strip() for h in request.headers.get("X-Forwarded-For", "").split(",")]
        for hop in reversed([h for h in hops if h]):
            if not self._trusted(hop):
                return hop
        return remote

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
            "SELECT expires, last_seen FROM sessions WHERE id_hash = ?", (session.id_hash,)
        ).fetchone()
        if row is None:
            return False
        now = time.time()
        return now < row[0] and now - row[1] < self.cfg.idle_s

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
        log.info("signed in: %s (%s, %s) from %s", username, role, method, self.client_ip(request))
        return session

    def end_session(self, request: web.Request, response: web.StreamResponse) -> None:
        session_id = request.cookies.get(SESSION_COOKIE)
        if session_id:
            self.accounts.end_session(session_id)
        response.del_cookie(SESSION_COOKIE, path="/")

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
    cfg: AuthConfig, accounts: Accounts, http: aiohttp.ClientSession | None = None
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
    return AuthService(cfg, accounts, oidc=oidc, saml=saml)
