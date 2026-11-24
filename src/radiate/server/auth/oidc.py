"""OpenID Connect sign-in: authorization code flow with PKCE (ADR-0006).

HTTP goes through aiohttp; ID token signatures and claims are checked with joserfc,
never by hand. Only asymmetric signature algorithms are accepted, so a token signed
with `none` or with the client secret as an HMAC key is refused.

Pending logins (state, nonce and PKCE verifier) are held in memory for ten minutes and
used once, so a callback can't be replayed.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import secrets
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode, urlsplit

import aiohttp

from radiate.config.auth import LOOPBACK_HOSTS, OidcConfig

log = logging.getLogger("radiate.auth")

ALGORITHMS = ("RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "EdDSA")
PENDING_TTL_S = 600.0
MAX_PENDING = 200
DISCOVERY_TTL_S = 3600.0
JWKS_REFRESH_MIN_S = 60.0
LEEWAY_S = 60
HTTP_TIMEOUT = aiohttp.ClientTimeout(total=15)


class OidcError(Exception):
    """Sign-in failed. The message is for the log, never for the browser. `code` is the
    security log's `error.type` (the telemetry schema's LOGIN_ERRORS), and `user` the
    username, once the provider has named one."""

    def __init__(self, message: str, code: str = "provider_error", user: str | None = None):
        super().__init__(message)
        self.code = code
        self.user = user


# joserfc's claim errors name the claim; each claim has its own code.
_CLAIM_CODES = {
    "iss": "wrong_issuer",
    "aud": "wrong_audience",
    "exp": "expired",
    "nonce": "bad_nonce",
}


def _jose_code(err: Exception) -> str:
    """The security log's error.type for a joserfc error."""
    from joserfc.errors import (
        BadSignatureError,
        DecodeError,
        ExpiredTokenError,
        InvalidKeyIdError,
        MissingClaimError,
        MissingKeyError,
        UnsupportedAlgorithmError,
    )

    if isinstance(err, ExpiredTokenError):
        return "expired"
    if isinstance(err, MissingClaimError):
        return "bad_claims"
    claim = getattr(err, "claim", None)
    if claim is not None:
        return _CLAIM_CODES.get(claim, "bad_claims")
    if isinstance(
        err,
        (
            BadSignatureError,
            DecodeError,
            UnsupportedAlgorithmError,
            MissingKeyError,
            InvalidKeyIdError,
        ),
    ):
        return "bad_signature"
    return "bad_claims"


@dataclass(slots=True)
class Pending:
    verifier: str
    nonce: str
    created: float


@dataclass(frozen=True, slots=True)
class OidcIdentity:
    username: str
    role: str
    subject: str


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def pkce_challenge(verifier: str) -> str:
    return _b64url(hashlib.sha256(verifier.encode("ascii")).digest())


def _check_endpoint(url: Any, name: str) -> str:
    if not isinstance(url, str):
        raise OidcError(f"discovery document has no {name}")
    parts = urlsplit(url)
    if parts.scheme != "https" and not (
        parts.scheme == "http" and parts.hostname in LOOPBACK_HOSTS
    ):
        raise OidcError(f"{name} must use https: {url}")
    return url


def _claim_values(value: Any) -> tuple[str, ...]:
    if isinstance(value, str):
        return (value,)
    if isinstance(value, list):
        return tuple(v for v in value if isinstance(v, str))
    return ()


class OidcClient:
    def __init__(
        self,
        cfg: OidcConfig,
        redirect_uri: str,
        client_secret: str | None,
        session: aiohttp.ClientSession | None = None,
        clock=time.time,
    ):
        self.cfg = cfg
        self.redirect_uri = redirect_uri
        self._secret = client_secret
        self._session = session
        self._own_session = session is None
        self.clock = clock
        self._pending: dict[str, Pending] = {}
        self._discovery: dict | None = None
        self._discovery_at = 0.0
        self._jwks: Any = None
        self._jwks_at = 0.0

    def __repr__(self) -> str:  # never show the secret
        return f"OidcClient(issuer={self.cfg.issuer!r}, client_id={self.cfg.client_id!r})"

    async def close(self) -> None:
        if self._own_session and self._session is not None:
            await self._session.close()

    def _http(self) -> aiohttp.ClientSession:
        if self._session is None:
            self._session = aiohttp.ClientSession(timeout=HTTP_TIMEOUT)
        return self._session

    async def _get_json(self, url: str, **kw) -> dict:
        async with self._http().get(url, timeout=HTTP_TIMEOUT, **kw) as res:
            if res.status != 200:
                raise OidcError(f"GET {url}: HTTP {res.status}")
            body = await res.json(content_type=None)
        if not isinstance(body, dict):
            raise OidcError(f"GET {url}: expected a JSON object")
        return body

    async def discovery(self) -> dict:
        now = self.clock()
        if self._discovery is not None and now - self._discovery_at < DISCOVERY_TTL_S:
            return self._discovery
        doc = await self._get_json(f"{self.cfg.issuer}/.well-known/openid-configuration")
        # OIDC Discovery 4.3: the issuer in the document must be exactly the one asked.
        if doc.get("issuer") != self.cfg.issuer:
            raise OidcError(
                f"discovery issuer {doc.get('issuer')!r} is not the configured {self.cfg.issuer!r}"
            )
        for name in ("authorization_endpoint", "token_endpoint", "jwks_uri"):
            _check_endpoint(doc.get(name), name)
        if doc.get("userinfo_endpoint") is not None:
            _check_endpoint(doc["userinfo_endpoint"], "userinfo_endpoint")
        self._discovery, self._discovery_at = doc, now
        return doc

    async def _keys(self, refresh: bool = False):
        from joserfc.jwk import KeySet

        now = self.clock()
        if self._jwks is not None and not refresh:
            return self._jwks
        if refresh and now - self._jwks_at < JWKS_REFRESH_MIN_S:
            return self._jwks
        doc = await self.discovery()
        raw = await self._get_json(doc["jwks_uri"])
        try:
            self._jwks = KeySet.import_key_set(raw)
        except Exception as err:
            raise OidcError(f"cannot read the provider's keys: {err}") from err
        self._jwks_at = now
        return self._jwks

    # --- the flow ------------------------------------------------------------------

    def _prune(self, now: float) -> None:
        for state in [s for s, p in self._pending.items() if now - p.created >= PENDING_TTL_S]:
            del self._pending[state]
        while len(self._pending) >= MAX_PENDING:
            self._pending.pop(next(iter(self._pending)))

    async def start(self) -> tuple[str, str]:
        """Begin a login. Returns (state, the provider URL to send the browser to)."""
        doc = await self.discovery()
        now = self.clock()
        self._prune(now)
        state = secrets.token_urlsafe(32)
        pending = Pending(secrets.token_urlsafe(48), secrets.token_urlsafe(32), now)
        self._pending[state] = pending
        query = urlencode(
            {
                "response_type": "code",
                "client_id": self.cfg.client_id,
                "redirect_uri": self.redirect_uri,
                "scope": " ".join(self.cfg.scopes),
                "state": state,
                "nonce": pending.nonce,
                "code_challenge": pkce_challenge(pending.verifier),
                "code_challenge_method": "S256",
            }
        )
        endpoint = doc["authorization_endpoint"]
        return state, f"{endpoint}{'&' if '?' in endpoint else '?'}{query}"

    def take_pending(self, state: str) -> Pending | None:
        """The pending login for `state`, removed so it can be used only once."""
        pending = self._pending.pop(state, None)
        if pending is None or self.clock() - pending.created >= PENDING_TTL_S:
            return None
        return pending

    async def finish(self, code: str, pending: Pending) -> OidcIdentity:
        """Exchange the code, validate the ID token and map the user to a role."""
        doc = await self.discovery()
        form = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
            "code_verifier": pending.verifier,
        }
        headers = {"Accept": "application/json"}
        if self._secret:
            methods = doc.get("token_endpoint_auth_methods_supported") or ["client_secret_basic"]
            if "client_secret_basic" in methods:
                pair = f"{self.cfg.client_id}:{self._secret}".encode()
                headers["Authorization"] = "Basic " + base64.b64encode(pair).decode("ascii")
            else:
                form["client_id"] = self.cfg.client_id
                form["client_secret"] = self._secret
        else:
            form["client_id"] = self.cfg.client_id
        async with self._http().post(
            doc["token_endpoint"], data=form, headers=headers, timeout=HTTP_TIMEOUT
        ) as res:
            if res.status != 200:
                raise OidcError(f"token endpoint answered HTTP {res.status}")
            tokens = await res.json(content_type=None)
        if not isinstance(tokens, dict) or not isinstance(tokens.get("id_token"), str):
            raise OidcError("token response has no id_token")
        claims = await self.validate_id_token(tokens["id_token"], pending.nonce)
        if (
            (self.cfg.roles.claim and self.cfg.roles.claim not in claims)
            or self.cfg.username_claim not in claims
        ) and isinstance(tokens.get("access_token"), str):
            claims = {
                **(await self._userinfo(doc, tokens["access_token"], claims["sub"])),
                **claims,
            }
        return self.identity(claims)

    async def _userinfo(self, doc: dict, access_token: str, sub: str) -> dict:
        url = doc.get("userinfo_endpoint")
        if not url:
            return {}
        info = await self._get_json(url, headers={"Authorization": f"Bearer {access_token}"})
        # OIDC Core 5.3.2: the userinfo sub must match the ID token's.
        if info.get("sub") != sub:
            raise OidcError("userinfo sub does not match the ID token", "bad_claims")
        return info

    async def validate_id_token(self, id_token: str, nonce: str) -> dict:
        from joserfc import jwt
        from joserfc.errors import BadSignatureError, JoseError

        keys = await self._keys()
        try:
            try:
                token = jwt.decode(id_token, keys, algorithms=list(ALGORITHMS))
            except (BadSignatureError, ValueError) as first:
                # The provider may have rotated its keys since they were fetched.
                fresh = await self._keys(refresh=True)
                if fresh is keys:
                    raise first
                token = jwt.decode(id_token, fresh, algorithms=list(ALGORITHMS))
            claims = token.claims
            registry = jwt.JWTClaimsRegistry(
                now=lambda: int(self.clock()),
                leeway=LEEWAY_S,
                iss={"essential": True, "value": self.cfg.issuer},
                aud={"essential": True, "value": self.cfg.client_id},
                exp={"essential": True},
                iat={"essential": True},
                sub={"essential": True},
                nonce={"essential": True, "value": nonce},
            )
            registry.validate(claims)
        except JoseError as err:
            raise OidcError(f"ID token refused: {err}", _jose_code(err)) from err
        except ValueError as err:
            raise OidcError(f"ID token refused: {err}", "bad_signature") from err
        aud = claims.get("aud")
        if isinstance(aud, list) and len(aud) > 1 and claims.get("azp") != self.cfg.client_id:
            raise OidcError(
                "ID token has several audiences and azp is not this client", "wrong_audience"
            )
        return claims

    def identity(self, claims: dict) -> OidcIdentity:
        username = claims.get(self.cfg.username_claim)
        if not isinstance(username, str) or not username:
            raise OidcError(f"ID token has no {self.cfg.username_claim} claim", "no_user")
        values = _claim_values(claims.get(self.cfg.roles.claim)) if self.cfg.roles.claim else ()
        role = self.cfg.roles.role_for(username, values)
        if role is None:
            raise OidcError(
                f"{username} is in none of admins, households or viewers",
                "not_permitted",
                username,
            )
        return OidcIdentity(username=username, role=role, subject=str(claims["sub"]))
