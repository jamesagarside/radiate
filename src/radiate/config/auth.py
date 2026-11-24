"""The `auth` section: user login, single sign-on and sessions (ADR-0006).

Pure parsing, like the rest of the house file. `parse_auth` validates the section and
returns an `AuthConfig`; problems go to the shared context with their path, such as
`auth.oidc.issuer`. Secrets read from a file (`client_secret_file`) are read by the
server when it starts, not here. No secret appears in a `repr`, so a logged
configuration never carries one.
"""

from __future__ import annotations

import ipaddress
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlsplit

ROLES = ("admin", "viewer")
SECURE_COOKIE = ("auto", "always", "never")
DEFAULT_SCOPES = ("openid", "profile", "email")
LOOPBACK_HOSTS = ("localhost", "127.0.0.1", "::1")


@dataclass(frozen=True, slots=True)
class RoleMap:
    """Who gets which role after single sign-on.

    A value matches the username or any value of the roles claim or attribute. Admins
    are checked first. Someone who matches neither list is refused.
    """

    claim: str | None = None
    admins: tuple[str, ...] = ()
    viewers: tuple[str, ...] = ()

    def role_for(self, username: str, values: tuple[str, ...]) -> str | None:
        have = {username, *values}
        if have & set(self.admins):
            return "admin"
        if have & set(self.viewers):
            return "viewer"
        return None


@dataclass(frozen=True, slots=True)
class OidcConfig:
    issuer: str
    client_id: str
    client_secret: str | None = field(default=None, repr=False)
    client_secret_file: str | None = None
    scopes: tuple[str, ...] = DEFAULT_SCOPES
    username_claim: str = "preferred_username"
    roles: RoleMap = field(default_factory=RoleMap)
    label: str = "Sign in with single sign-on"


@dataclass(frozen=True, slots=True)
class SamlConfig:
    idp_metadata_url: str | None = None
    idp_metadata_file: str | None = None
    sp_entity_id: str | None = None  # default: the SP metadata URL
    username_attribute: str | None = None  # default: the NameID
    roles: RoleMap = field(default_factory=RoleMap)
    label: str = "Sign in with SAML"


@dataclass(frozen=True, slots=True)
class AuthConfig:
    enabled: bool = False
    local: bool = True
    session_days: float = 30.0
    idle_days: float = 7.0
    secure_cookie: str = "auto"
    public_url: str | None = None
    trusted_proxies: tuple[str, ...] = ()
    oidc: OidcConfig | None = None
    saml: SamlConfig | None = None

    @property
    def session_s(self) -> float:
        return self.session_days * 86400

    @property
    def idle_s(self) -> float:
        return self.idle_days * 86400


def _url(ctx: Any, value: str, path: str, *, allow_path: bool = True) -> bool:
    """An absolute https URL, or http on a loopback host (for tests and local setups)."""
    parts = urlsplit(value)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        ctx.err(path, "must be an absolute http or https URL")
        return False
    if parts.scheme == "http" and parts.hostname not in LOOPBACK_HOSTS:
        ctx.err(path, "must use https (http is only allowed for localhost)")
        return False
    if parts.query or parts.fragment or (not allow_path and parts.path not in ("", "/")):
        ctx.err(path, "must not have a query or fragment")
        return False
    return True


def _strings(ctx: Any, raw: dict, key: str, path: str) -> tuple[str, ...]:
    val = raw.get(key)
    if val is None:
        return ()
    if isinstance(val, str):
        val = [val]
    if not isinstance(val, list) or not all(isinstance(v, str) and v for v in val):
        ctx.err(f"{path}{key}", "expected a list of strings")
        return ()
    return tuple(val)


def _roles(ctx: Any, raw: dict, path: str, claim_key: str) -> RoleMap:
    admins = _strings(ctx, raw, "admins", path)
    viewers = _strings(ctx, raw, "viewers", path)
    if not admins and not viewers:
        ctx.err(f"{path}admins", "list at least one user or group in admins or viewers")
    return RoleMap(
        claim=ctx.get(raw, claim_key, str, None, path) or None,
        admins=admins,
        viewers=viewers,
    )


def _oidc(ctx: Any, raw: dict) -> OidcConfig | None:
    p = "auth.oidc."
    ctx.unknown(
        raw,
        {
            "issuer",
            "client_id",
            "client_secret",
            "client_secret_file",
            "scopes",
            "username_claim",
            "roles_claim",
            "admins",
            "viewers",
            "label",
        },
        p,
    )
    issuer = ctx.get(raw, "issuer", str, "", p)
    if not issuer:
        ctx.err(f"{p}issuer", "required")
    else:
        _url(ctx, issuer, f"{p}issuer")
    client_id = ctx.get(raw, "client_id", str, "", p)
    if not client_id:
        ctx.err(f"{p}client_id", "required")
    secret = ctx.get(raw, "client_secret", str, None, p) or None
    secret_file = ctx.get(raw, "client_secret_file", str, None, p) or None
    if secret and secret_file:
        ctx.err(f"{p}client_secret_file", "use client_secret or client_secret_file, not both")
    scopes = _strings(ctx, raw, "scopes", p) or DEFAULT_SCOPES
    if "openid" not in scopes:
        scopes = ("openid", *scopes)
    return OidcConfig(
        issuer=issuer.rstrip("/"),
        client_id=client_id,
        client_secret=secret,
        client_secret_file=secret_file,
        scopes=scopes,
        username_claim=ctx.get(raw, "username_claim", str, "preferred_username", p),
        roles=_roles(ctx, raw, p, "roles_claim"),
        label=ctx.get(raw, "label", str, OidcConfig.label, p) or OidcConfig.label,
    )


def _saml(ctx: Any, raw: dict) -> SamlConfig | None:
    p = "auth.saml."
    ctx.unknown(
        raw,
        {
            "idp_metadata_url",
            "idp_metadata_file",
            "sp_entity_id",
            "username_attribute",
            "roles_attribute",
            "admins",
            "viewers",
            "label",
        },
        p,
    )
    url = ctx.get(raw, "idp_metadata_url", str, None, p) or None
    path = ctx.get(raw, "idp_metadata_file", str, None, p) or None
    if bool(url) == bool(path):
        ctx.err(f"{p}idp_metadata_url", "give exactly one of idp_metadata_url or idp_metadata_file")
    elif url:
        _url(ctx, url, f"{p}idp_metadata_url")
    return SamlConfig(
        idp_metadata_url=url,
        idp_metadata_file=path,
        sp_entity_id=ctx.get(raw, "sp_entity_id", str, None, p) or None,
        username_attribute=ctx.get(raw, "username_attribute", str, None, p) or None,
        roles=_roles(ctx, raw, p, "roles_attribute"),
        label=ctx.get(raw, "label", str, SamlConfig.label, p) or SamlConfig.label,
    )


def _proxies(ctx: Any, raw: dict, path: str) -> tuple[str, ...]:
    out = []
    for i, item in enumerate(_strings(ctx, raw, "trusted_proxies", path)):
        try:
            out.append(str(ipaddress.ip_network(item, strict=False)))
        except ValueError:
            ctx.err(f"{path}trusted_proxies[{i}]", f"{item!r} is not an IP address or network")
    return tuple(out)


def parse_auth(ctx: Any, raw: dict) -> AuthConfig:
    """Validate an `auth` section. `ctx` is the house file's problem collector."""
    if not raw:
        return AuthConfig()
    p = "auth."
    ctx.unknown(
        raw,
        {
            "enabled",
            "local",
            "session_days",
            "idle_days",
            "secure_cookie",
            "public_url",
            "trusted_proxies",
            "oidc",
            "saml",
        },
        p,
    )
    enabled = ctx.get(raw, "enabled", bool, False, p)
    local = ctx.get(raw, "local", bool, True, p)
    session_days = ctx.number(raw, "session_days", 30, 1, 400, p)
    idle_days = ctx.number(raw, "idle_days", 7, 1, 400, p)
    if idle_days > session_days:
        ctx.err(f"{p}idle_days", "must not be more than session_days")
    secure = ctx.get(raw, "secure_cookie", str, "auto", p)
    if secure not in SECURE_COOKIE:
        ctx.err(f"{p}secure_cookie", "must be auto, always or never")
        secure = "auto"
    public_url = ctx.get(raw, "public_url", str, None, p) or None
    if public_url:
        _url(ctx, public_url, f"{p}public_url")
        public_url = public_url.rstrip("/")
    oidc_raw = ctx.section(raw, "oidc", p)
    saml_raw = ctx.section(raw, "saml", p)
    oidc = _oidc(ctx, oidc_raw) if oidc_raw else None
    saml = _saml(ctx, saml_raw) if saml_raw else None
    if (oidc or saml) and not public_url:
        ctx.err(f"{p}public_url", "required for single sign-on: the address people use")
    if enabled and not (local or oidc or saml):
        ctx.err(f"{p}local", "login is enabled but every sign-in method is off")
    return AuthConfig(
        enabled=enabled,
        local=local,
        session_days=session_days,
        idle_days=idle_days,
        secure_cookie=secure,
        public_url=public_url,
        trusted_proxies=_proxies(ctx, raw, p),
        oidc=oidc,
        saml=saml,
    )


def load_auth_file(path: str, env: dict[str, str] | None = None) -> AuthConfig:
    """Read a YAML file holding only an `auth` section (`radiate serve --auth-config`)."""
    import os

    import yaml

    from .site import ConfigError, _Ctx, _substitute_env

    with open(path, encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    ctx = _Ctx()
    if not isinstance(data, dict):
        raise ConfigError(["top level: expected a mapping with an auth section"])
    data = _substitute_env(data, dict(os.environ) if env is None else env, ctx)
    ctx.unknown(data, {"auth"}, "")
    auth = parse_auth(ctx, ctx.section(data, "auth"))
    if ctx.problems:
        raise ConfigError(ctx.problems)
    return auth
