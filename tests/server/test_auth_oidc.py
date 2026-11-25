"""OIDC sign-in against a fake provider on a local aiohttp test server (ADR-0006).

The provider issues real signed ID tokens, checks PKCE and the client secret, and can be
told to misbehave: sign with another key, name another audience, issue an expired token,
send another nonce or leave a claim out.
"""

import base64
import hashlib
import secrets
import time
from urllib.parse import parse_qs, urlsplit

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer
from joserfc import jwt
from joserfc.jwk import OctKey, RSAKey

from radiate.config.auth import AuthConfig, OidcConfig, RoleMap
from radiate.server.app import create_app
from radiate.server.auth import Accounts, create_auth
from radiate.server.auth.oidc import OidcClient, OidcError, Pending
from radiate.server.auth.service import OIDC_COOKIE, SESSION_COOKIE
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.store import Store
from radiate.sim.reference import house_config

CLIENT_ID = "radiate"
CLIENT_SECRET = "provider-issued-secret"
PUBLIC = "http://localhost:8099"


class FakeProvider:
    def __init__(self):
        self.key = RSAKey.generate_key(2048, parameters={"kid": "k1", "use": "sig"})
        self.codes: dict[str, dict] = {}
        self.issuer = ""
        self.overrides: dict = {}
        self.sign_with = None  # another key, to forge a signature
        self.alg = "RS256"
        self.userinfo: dict | None = None
        self.token_requests: list[dict] = []
        app = web.Application()
        app.router.add_get("/.well-known/openid-configuration", self.discovery)
        app.router.add_get("/jwks", self.jwks)
        app.router.add_post("/token", self.token)
        app.router.add_get("/userinfo", self.user_info)
        self.app = app

    async def discovery(self, _):
        return web.json_response(
            {
                "issuer": self.issuer,
                "authorization_endpoint": f"{self.issuer}/authorize",
                "token_endpoint": f"{self.issuer}/token",
                "jwks_uri": f"{self.issuer}/jwks",
                "userinfo_endpoint": f"{self.issuer}/userinfo",
                "token_endpoint_auth_methods_supported": ["client_secret_basic"],
                "id_token_signing_alg_values_supported": ["RS256"],
            }
        )

    async def jwks(self, _):
        return web.json_response({"keys": [self.key.as_dict(private=False)]})

    def approve(self, query: dict, user: str = "alex", groups=("heating-admins",)) -> str:
        """The person signs in at the provider: return the code it redirects back with."""
        code = secrets.token_urlsafe(16)
        self.codes[code] = {
            "nonce": query["nonce"][0],
            "challenge": query["code_challenge"][0],
            "redirect_uri": query["redirect_uri"][0],
            "user": user,
            "groups": list(groups),
        }
        return code

    async def token(self, request):
        form = dict(await request.post())
        self.token_requests.append(form)
        expected = "Basic " + base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
        if request.headers.get("Authorization") != expected:
            return web.json_response({"error": "invalid_client"}, status=401)
        grant = self.codes.pop(form.get("code", ""), None)
        if grant is None or form.get("redirect_uri") != grant["redirect_uri"]:
            return web.json_response({"error": "invalid_grant"}, status=400)
        verifier = form.get("code_verifier", "")
        challenge = (
            base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
            .rstrip(b"=")
            .decode()
        )
        if challenge != grant["challenge"]:
            return web.json_response({"error": "invalid_grant", "why": "pkce"}, status=400)
        now = int(time.time())
        claims = {
            "iss": self.issuer,
            "aud": CLIENT_ID,
            "sub": f"sub-{grant['user']}",
            "iat": now,
            "exp": now + 300,
            "nonce": grant["nonce"],
            "preferred_username": grant["user"],
            "groups": grant["groups"],
        }
        claims.update(self.overrides)
        claims = {k: v for k, v in claims.items() if v is not None}
        id_token = jwt.encode({"alg": self.alg, "kid": "k1"}, claims, self.sign_with or self.key)
        return web.json_response(
            {"id_token": id_token, "access_token": "at-" + grant["user"], "token_type": "Bearer"}
        )

    async def user_info(self, request):
        if self.userinfo is None:
            return web.json_response({}, status=404)
        return web.json_response(self.userinfo)


@pytest.fixture
async def idp():
    provider = FakeProvider()
    server = TestServer(provider.app)
    await server.start_server()
    provider.issuer = str(server.make_url("")).rstrip("/")
    yield provider
    await server.close()


def oidc_config(issuer: str, **over) -> AuthConfig:
    oidc = OidcConfig(
        issuer=issuer,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        roles=RoleMap("groups", admins=("heating-admins",), viewers=("family",)),
        label="Sign in with the house account",
    )
    for k, v in over.items():
        oidc = oidc.__class__(**{**{f: getattr(oidc, f) for f in oidc.__slots__}, k: v})
    return AuthConfig(enabled=True, local=False, public_url=PUBLIC, oidc=oidc)


@pytest.fixture
async def radiate(idp):
    rt = Runtime(house_config(), DemoDriver())
    await rt.step()
    login = await create_auth(oidc_config(idp.issuer), Accounts(Store(":memory:").db))
    async with TestClient(TestServer(create_app(rt, token="secret", login=login))) as c:
        c.login = login
        yield c
    await login.close()


async def start(c) -> dict:
    r = await c.get("/auth/oidc/start", allow_redirects=False)
    assert r.status == 302
    assert OIDC_COOKIE in r.cookies
    return parse_qs(urlsplit(r.headers["Location"]).query)


async def callback(c, query: dict, code: str):
    return await c.get(
        "/auth/oidc/callback",
        params={"state": query["state"][0], "code": code},
        allow_redirects=False,
    )


def signed_in(r) -> bool:
    return r.status == 302 and r.headers["Location"] == f"{PUBLIC}/" and SESSION_COOKIE in r.cookies


def refused(r) -> bool:
    return r.status == 302 and r.headers["Location"] == f"{PUBLIC}/login?error=sso"


def why(c) -> tuple[str, str | None]:
    """The last refused sign-in in the security log: (error.type, user.name)."""
    events = c.login.security.query(outcome="failure")["events"]
    last = next(e for e in events if e["event"] == "radiate.security.login.failed")
    return last["attributes"]["error.type"], last["attributes"].get("user.name")


# --- the happy path ----------------------------------------------------------------------


async def test_config_offers_the_provider(radiate):
    cfg = await (await radiate.get("/api/v1/auth/config")).json()
    assert cfg["methods"] == [
        {"id": "oidc", "label": "Sign in with the house account", "url": "auth/oidc/start"}
    ]
    assert cfg["first_user_needed"] is False  # local login is off


async def test_authorization_request_uses_pkce_state_and_nonce(radiate, idp):
    q = await start(radiate)
    assert q["response_type"] == ["code"]
    assert q["client_id"] == [CLIENT_ID]
    assert q["redirect_uri"] == [f"{PUBLIC}/auth/oidc/callback"]
    assert q["code_challenge_method"] == ["S256"]
    assert set(q["scope"][0].split()) == {"openid", "profile", "email"}
    assert len(q["state"][0]) >= 40 and len(q["nonce"][0]) >= 40
    assert "client_secret" not in str(q)


async def test_sign_in_and_role_from_groups(radiate, idp):
    q = await start(radiate)
    r = await callback(radiate, q, idp.approve(q))
    assert signed_in(r)
    me = await (await radiate.get("/api/v1/auth/me")).json()
    assert me["user"] == "alex" and me["role"] == "admin" and me["method"] == "oidc"
    assert idp.token_requests[0]["code_verifier"]
    assert "client_secret" not in idp.token_requests[0]  # sent as Basic auth instead


async def test_viewer_group(radiate, idp):
    q = await start(radiate)
    assert signed_in(await callback(radiate, q, idp.approve(q, "sam", ("family",))))
    me = await (await radiate.get("/api/v1/auth/me")).json()
    assert me["role"] == "viewer"


async def test_user_in_no_mapped_group_is_refused(radiate, idp):
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q, "guest", ("other",))))
    assert (await radiate.get("/api/v1/state")).status == 401
    assert why(radiate) == ("not_permitted", "guest")


async def test_groups_from_userinfo_when_not_in_the_id_token(radiate, idp):
    idp.overrides = {"groups": None}
    idp.userinfo = {"sub": "sub-alex", "groups": ["heating-admins"]}
    q = await start(radiate)
    assert signed_in(await callback(radiate, q, idp.approve(q)))


async def test_userinfo_for_another_subject_is_refused(radiate, idp):
    idp.overrides = {"groups": None}
    idp.userinfo = {"sub": "someone-else", "groups": ["heating-admins"]}
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("bad_claims", None)


# --- ID token validation -----------------------------------------------------------------


async def test_bad_signature(radiate, idp):
    idp.sign_with = RSAKey.generate_key(2048, parameters={"kid": "k1"})
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("bad_signature", None)


async def test_hmac_signed_with_the_client_secret_is_refused(radiate, idp):
    # The classic algorithm confusion: a token signed with the shared secret as HMAC key.
    idp.sign_with = OctKey.import_key(CLIENT_SECRET.encode().ljust(32, b"!"))
    idp.alg = "HS256"
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("bad_signature", None)


async def test_wrong_audience(radiate, idp):
    idp.overrides = {"aud": "some-other-client"}
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("wrong_audience", None)


async def test_several_audiences_need_azp(radiate, idp):
    idp.overrides = {"aud": [CLIENT_ID, "other"]}
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q)))
    idp.overrides = {"aud": [CLIENT_ID, "other"], "azp": CLIENT_ID}
    q = await start(radiate)
    assert signed_in(await callback(radiate, q, idp.approve(q)))


async def test_expired_token(radiate, idp):
    now = int(time.time())
    idp.overrides = {"iat": now - 3600, "exp": now - 600}
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("expired", None)


async def test_wrong_issuer(radiate, idp):
    idp.overrides = {"iss": "https://evil.example"}
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("wrong_issuer", None)


async def test_wrong_nonce(radiate, idp):
    idp.overrides = {"nonce": "not-the-one-sent"}
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("bad_nonce", None)


async def test_missing_exp(radiate, idp):
    idp.overrides = {"exp": None}
    q = await start(radiate)
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("bad_claims", None)


# --- state ---------------------------------------------------------------------------------


async def test_replayed_state_is_refused(radiate, idp):
    q = await start(radiate)
    assert signed_in(await callback(radiate, q, idp.approve(q)))
    radiate.session.cookie_jar.clear()
    radiate.session.cookie_jar.update_cookies({OIDC_COOKIE: q["state"][0]})
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("bad_state", None)


async def test_unknown_state_is_refused(radiate, idp):
    q = await start(radiate)
    q2 = {**q, "state": ["made-up"]}
    assert refused(await callback(radiate, q2, idp.approve(q)))
    assert why(radiate) == ("bad_state", None)


async def test_state_must_match_this_browser(radiate, idp):
    # A login started in the attacker's browser can't be finished in the victim's.
    q = await start(radiate)
    radiate.session.cookie_jar.clear()
    assert refused(await callback(radiate, q, idp.approve(q)))
    assert why(radiate) == ("bad_state", None)


async def test_provider_error_is_refused(radiate, idp):
    q = await start(radiate)
    r = await radiate.get(
        "/auth/oidc/callback",
        params={"state": q["state"][0], "error": "access_denied"},
        allow_redirects=False,
    )
    assert refused(r)
    assert why(radiate) == ("provider_error", None)


async def test_token_clients_unaffected_with_oidc(radiate):
    assert (await radiate.get("/api/v1/state")).status == 401
    r = await radiate.get("/api/v1/state", headers={"Authorization": "Bearer secret"})
    assert r.status == 200
    # Local login is off in this configuration.
    r = await radiate.post("/api/v1/auth/login", json={"username": "a", "password": "b"})
    assert r.status == 404


# --- discovery -------------------------------------------------------------------------


async def test_discovery_issuer_must_match(idp):
    cfg = oidc_config(idp.issuer + "/other").oidc
    client = OidcClient(cfg, f"{PUBLIC}/auth/oidc/callback", CLIENT_SECRET)
    try:
        with pytest.raises(OidcError):
            await client.discovery()
    finally:
        await client.close()


async def test_pending_logins_expire():
    now = [1000.0]
    cfg = OidcConfig(issuer="https://id.example.org", client_id="r")
    client = OidcClient(cfg, f"{PUBLIC}/cb", None, clock=lambda: now[0])
    client._pending["s"] = Pending("v", "n", 1000.0)
    now[0] = 1601.0
    assert client.take_pending("s") is None
    await client.close()


def test_secret_not_in_repr():
    cfg = OidcConfig(issuer="https://id.example.org", client_id="r", client_secret="hidden-1")
    client = OidcClient(cfg, f"{PUBLIC}/cb", "hidden-1")
    assert "hidden-1" not in repr(client) and "hidden-1" not in repr(cfg)
