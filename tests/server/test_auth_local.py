"""Local login, sessions, CSRF, roles and how the token and ingress coexist (ADR-0006)."""

import time

import pytest
from aiohttp import WSMsgType
from aiohttp.test_utils import TestClient, TestServer

from radiate.cli import main
from radiate.config.auth import AuthConfig
from radiate.server.app import RUNTIME, WS_UNAUTHORISED, create_app
from radiate.server.auth import Accounts, AuthService
from radiate.server.auth.limiter import LoginLimiter
from radiate.server.auth.passwords import hash_password, password_problem, verify_password
from radiate.server.auth.service import SESSION_COOKIE
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.store import Store
from radiate.sim.reference import house_config

TOKEN = {"Authorization": "Bearer secret"}
ADMIN_PW = "correct horse battery"
VIEWER_PW = "staple paper clip"


@pytest.fixture
async def rt():
    runtime = Runtime(house_config(), DemoDriver())
    await runtime.step()
    return runtime


def service(cfg: AuthConfig | None = None, limiter=None) -> AuthService:
    accounts = Accounts(Store(":memory:").db)
    accounts.add_user("Alex", ADMIN_PW, "admin")
    accounts.add_user("sam", VIEWER_PW, "viewer")
    return AuthService(cfg or AuthConfig(enabled=True), accounts, limiter=limiter)


@pytest.fixture
async def client(rt):
    login = service()
    async with TestClient(
        TestServer(create_app(rt, token="secret", ingress_ip="127.0.0.1", login=login))
    ) as c:
        c.login = login
        yield c


async def sign_in(c, username="alex", password=ADMIN_PW) -> dict:
    r = await c.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert r.status == 200, await r.text()
    me = await (await c.get("/api/v1/auth/me")).json()
    return me


# --- passwords -------------------------------------------------------------------------


def test_scrypt_hash_round_trip():
    stored = hash_password("a long passphrase")
    assert stored.startswith("scrypt$15$8$1$")
    assert verify_password("a long passphrase", stored)
    assert not verify_password("a long passphrasE", stored)
    assert not verify_password("x", "scrypt$15$8$1$not-base64$")
    assert not verify_password("x", "md5$abc")
    assert hash_password("same") != hash_password("same")  # salted


def test_password_rules():
    assert password_problem("short") == "must be at least 10 characters"
    assert password_problem("x" * 2000) == "must be at most 1024 characters"
    assert password_problem("long enough here") is None


# --- login is off by default -------------------------------------------------------------


async def test_without_login_the_token_alone_still_works(rt):
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        assert (await c.get("/api/v1/state")).status == 401
        assert (await c.get("/api/v1/state", headers=TOKEN)).status == 200
        cfg = await (await c.get("/api/v1/auth/config")).json()
        assert cfg == {"login": False, "methods": [], "first_user_needed": False}
        r = await c.post("/api/v1/auth/login", json={"username": "a", "password": "b"})
        assert r.status == 404


async def test_without_token_or_login_everything_stays_open(rt):
    async with TestClient(TestServer(create_app(rt))) as c:
        assert (await c.get("/api/v1/state")).status == 200
        assert (await c.post("/api/v1/mode", json={"mode": "auto"})).status == 200


async def test_login_closes_a_server_with_no_token(rt):
    async with TestClient(TestServer(create_app(rt, login=service()))) as c:
        assert (await c.get("/api/v1/state")).status == 401
        assert (await c.get("/api/v1/health")).status == 200


# --- signing in --------------------------------------------------------------------------


async def test_config_lists_methods(client):
    cfg = await (await client.get("/api/v1/auth/config")).json()
    assert cfg == {"login": True, "methods": [{"id": "local"}], "first_user_needed": False}


async def test_first_user_needed_when_there_are_none(rt):
    login = AuthService(AuthConfig(enabled=True), Accounts(Store(":memory:").db))
    async with TestClient(TestServer(create_app(rt, login=login))) as c:
        cfg = await (await c.get("/api/v1/auth/config")).json()
        assert cfg["first_user_needed"] is True
        # No way to create the first user over the network.
        r = await c.post("/api/v1/auth/login", json={"username": "admin", "password": "x" * 12})
        assert r.status == 401


async def test_password_login_sets_a_hardened_cookie(client):
    r = await client.post("/api/v1/auth/login", json={"username": " ALEX ", "password": ADMIN_PW})
    assert r.status == 200
    assert await r.json() == {"user": "alex", "role": "admin"}
    cookie = r.headers["Set-Cookie"]
    assert cookie.startswith(f"{SESSION_COOKIE}=")
    assert "HttpOnly" in cookie and "SameSite=Lax" in cookie and "Path=/" in cookie
    assert "Secure" not in cookie  # plain HTTP in this test; see the proxy test
    me = await (await client.get("/api/v1/auth/me")).json()
    assert me["via"] == "session" and me["user"] == "alex" and me["role"] == "admin"
    assert me["method"] == "local" and len(me["csrf"]) > 30
    assert (await client.get("/api/v1/state")).status == 200


async def test_session_id_is_stored_only_as_a_hash(client):
    r = await client.post("/api/v1/auth/login", json={"username": "alex", "password": ADMIN_PW})
    session_id = r.cookies[SESSION_COOKIE].value
    rows = client.login.accounts.db.execute("SELECT id_hash FROM sessions").fetchall()
    assert rows and all(session_id not in row[0] for row in rows)


async def test_wrong_password_and_unknown_user_look_the_same(client):
    bad = await client.post("/api/v1/auth/login", json={"username": "alex", "password": "nope"})
    unknown = await client.post(
        "/api/v1/auth/login", json={"username": "nobody", "password": "nope"}
    )
    assert bad.status == unknown.status == 401
    assert await bad.json() == await unknown.json() == {"error": "invalid"}
    assert SESSION_COOKIE not in bad.cookies


async def test_login_accepts_json_only(client):
    # A cross-site form can post urlencoded or text/plain, never JSON without a preflight.
    r = await client.post(
        "/api/v1/auth/login",
        data=f'{{"username": "alex", "password": "{ADMIN_PW}"}}',
        headers={"Content-Type": "text/plain"},
    )
    assert r.status == 415
    r = await client.post("/api/v1/auth/login", data={"username": "alex", "password": ADMIN_PW})
    assert r.status == 415


async def test_logout_ends_the_session_on_the_server(client):
    me = await sign_in(client)
    r = await client.post("/api/v1/auth/logout", headers={"X-CSRF-Token": me["csrf"]})
    assert r.status == 200
    assert (await client.get("/api/v1/state")).status == 401
    assert client.login.accounts.db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0] == 0


async def test_new_session_id_at_every_login(client):
    r1 = await client.post("/api/v1/auth/login", json={"username": "alex", "password": ADMIN_PW})
    r2 = await client.post("/api/v1/auth/login", json={"username": "alex", "password": ADMIN_PW})
    assert r1.cookies[SESSION_COOKIE].value != r2.cookies[SESSION_COOKIE].value


# --- CSRF and roles ----------------------------------------------------------------------


async def test_cookie_writes_need_the_csrf_header(client):
    me = await sign_in(client)
    r = await client.post("/api/v1/mode", json={"mode": "frost"})
    assert r.status == 403 and await r.json() == {"error": "csrf"}
    r = await client.post("/api/v1/mode", json={"mode": "frost"}, headers={"X-CSRF-Token": "x"})
    assert r.status == 403
    r = await client.post(
        "/api/v1/mode", json={"mode": "frost"}, headers={"X-CSRF-Token": me["csrf"]}
    )
    assert r.status == 200
    assert client.server.app[RUNTIME].mode.value == "frost"


async def test_csrf_is_also_needed_to_sign_out(client):
    await sign_in(client)
    assert (await client.post("/api/v1/auth/logout")).status == 403
    assert (await client.get("/api/v1/state")).status == 200


async def test_viewer_reads_but_cannot_change(client):
    me = await sign_in(client, "sam", VIEWER_PW)
    assert me["role"] == "viewer"
    for path in ("/api/v1/state", "/api/v1/house", "/api/v1/settings", "/api/v1/devices"):
        assert (await client.get(path)).status in (200, 404), path
    h = {"X-CSRF-Token": me["csrf"]}
    r = await client.post("/api/v1/mode", json={"mode": "off"}, headers=h)
    assert r.status == 403 and await r.json() == {"error": "viewer"}
    r = await client.post("/api/v1/rooms/lounge/setpoint", json={"setpoint": 25}, headers=h)
    assert r.status == 403
    assert (await client.post("/api/v1/auth/logout", headers=h)).status == 200


# --- token and ingress clients are unaffected ---------------------------------------------


async def test_token_clients_unaffected_by_login(client):
    assert (await client.get("/api/v1/state", headers=TOKEN)).status == 200
    # No CSRF header: a Bearer token is not sent automatically by a browser.
    r = await client.post("/api/v1/mode", json={"mode": "auto"}, headers=TOKEN)
    assert r.status == 200
    me = await (await client.get("/api/v1/auth/me", headers=TOKEN)).json()
    assert me == {"via": "token", "role": "admin", "user": None, "method": None}


async def test_a_wrong_token_is_refused_even_with_a_session(client):
    await sign_in(client)
    r = await client.get("/api/v1/state", headers={"Authorization": "Bearer nope"})
    assert r.status == 401


async def test_ingress_unaffected_by_login(client):
    h = {"X-Ingress-Path": "/api/hassio_ingress/abc"}
    assert (await client.get("/api/v1/state", headers=h)).status == 200
    assert (await client.post("/api/v1/mode", json={"mode": "auto"}, headers=h)).status == 200


async def test_ingress_header_from_elsewhere_is_not_trusted(rt):
    async with TestClient(
        TestServer(create_app(rt, token="secret", ingress_ip="192.0.2.9", login=service()))
    ) as c:
        h = {"X-Ingress-Path": "/api/hassio_ingress/abc"}
        assert (await c.get("/api/v1/state", headers=h)).status == 401


async def test_stream_token_handshake_unaffected(client):
    async with client.ws_connect("/api/v1/stream") as ws:
        await ws.send_json({"token": "secret"})
        msg = await ws.receive(timeout=5)
        assert msg.type is WSMsgType.TEXT and "rooms" in msg.json()


async def test_stream_with_session_cookie(client):
    await sign_in(client)
    async with client.ws_connect("/api/v1/stream") as ws:
        msg = await ws.receive(timeout=5)
        assert msg.type is WSMsgType.TEXT and "rooms" in msg.json()


async def test_stream_refuses_cookie_from_another_site(client):
    await sign_in(client)
    with pytest.raises(Exception) as err:
        await client.ws_connect("/api/v1/stream", headers={"Origin": "https://evil.example"})
    assert "403" in str(err.value)


async def test_stream_without_token_or_session_is_closed(rt):
    async with (
        TestClient(TestServer(create_app(rt, login=service()))) as c,
        c.ws_connect("/api/v1/stream") as ws,
    ):
        msg = await ws.receive(timeout=5)
        assert msg.type is WSMsgType.CLOSE and msg.data == WS_UNAUTHORISED


# --- expiry ------------------------------------------------------------------------------


async def test_session_expires_after_its_lifetime(client):
    accounts = client.login.accounts
    session_id, _ = accounts.create_session(
        "alex", "admin", "local", 30 * 86400, now=time.time() - 31 * 86400
    )
    client.session.cookie_jar.update_cookies({SESSION_COOKIE: session_id})
    assert (await client.get("/api/v1/state")).status == 401
    assert accounts.db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0] == 0


async def test_session_expires_when_idle(client):
    accounts = client.login.accounts
    session_id, s = accounts.create_session("alex", "admin", "local", 30 * 86400)
    accounts.db.execute(
        "UPDATE sessions SET last_seen = ? WHERE id_hash = ?", (time.time() - 8 * 86400, s.id_hash)
    )
    client.session.cookie_jar.update_cookies({SESSION_COOKIE: session_id})
    assert (await client.get("/api/v1/state")).status == 401


def test_idle_clock_is_written_at_most_once_a_minute():
    accounts = Accounts(Store(":memory:").db)
    session_id, s = accounts.create_session("alex", "admin", "local", 86400, now=1000.0)
    assert accounts.session(session_id, 3600, now=1030.0).last_seen == 1000.0
    accounts.session(session_id, 3600, now=1070.0)
    assert accounts.session(session_id, 3600, now=1080.0).last_seen == 1070.0


def test_changing_a_user_ends_their_sessions():
    accounts = Accounts(Store(":memory:").db)
    accounts.add_user("alex", ADMIN_PW, "admin")
    for change in (
        lambda: accounts.set_password("alex", "another long one"),
        lambda: accounts.set_role("alex", "viewer"),
        lambda: accounts.remove_user("alex"),
    ):
        session_id, _ = accounts.create_session("alex", "admin", "local", 86400)
        change()
        assert accounts.session(session_id, 3600) is None


# --- failed logins -----------------------------------------------------------------------


async def test_brute_force_is_limited_per_user(rt):
    login = service(limiter=LoginLimiter(per_user=3, per_address=50))
    async with TestClient(TestServer(create_app(rt, login=login))) as c:
        for _ in range(3):
            r = await c.post("/api/v1/auth/login", json={"username": "alex", "password": "guess"})
            assert r.status == 401
        r = await c.post("/api/v1/auth/login", json={"username": "alex", "password": ADMIN_PW})
        assert r.status == 429
        assert int(r.headers["Retry-After"]) > 0
        assert (await r.json())["error"] == "locked"
        # Another user from the same address is not locked by it.
        r = await c.post("/api/v1/auth/login", json={"username": "sam", "password": VIEWER_PW})
        assert r.status == 200


async def test_brute_force_is_limited_per_address(rt):
    login = service(limiter=LoginLimiter(per_user=50, per_address=3))
    async with TestClient(TestServer(create_app(rt, login=login))) as c:
        for name in ("a1", "a2", "a3"):
            await c.post("/api/v1/auth/login", json={"username": name, "password": "guess"})
        r = await c.post("/api/v1/auth/login", json={"username": "alex", "password": ADMIN_PW})
        assert r.status == 429


def test_limiter_window_and_success():
    now = [0.0]
    limiter = LoginLimiter(per_user=2, per_address=10, window_s=60, clock=lambda: now[0])
    limiter.failed("alex", "192.0.2.1")
    limiter.failed("alex", "192.0.2.1")
    assert limiter.retry_after("alex", "192.0.2.1") == 60
    now[0] = 30
    assert limiter.retry_after("alex", "192.0.2.1") == 30
    now[0] = 61
    assert limiter.retry_after("alex", "192.0.2.1") == 0
    limiter.failed("alex", "192.0.2.1")
    limiter.succeeded("alex")
    limiter.failed("alex", "192.0.2.1")
    assert limiter.retry_after("alex", "192.0.2.1") == 0


# --- reverse proxies ---------------------------------------------------------------------


async def test_forwarded_headers_count_only_from_a_trusted_proxy(rt):
    for proxies, secure in (((), False), (("127.0.0.1/32",), True)):
        login = service(AuthConfig(enabled=True, trusted_proxies=proxies))
        async with TestClient(TestServer(create_app(rt, login=login))) as c:
            r = await c.post(
                "/api/v1/auth/login",
                json={"username": "alex", "password": ADMIN_PW},
                headers={"X-Forwarded-Proto": "https", "X-Forwarded-For": "198.51.100.7"},
            )
            assert ("Secure" in r.headers["Set-Cookie"]) is secure


def test_client_address_from_a_trusted_proxy():
    from aiohttp.test_utils import make_mocked_request

    login = service(AuthConfig(enabled=True, trusted_proxies=("10.0.0.0/8",)))

    def address(remote, xff):
        req = make_mocked_request("GET", "/", headers={"X-Forwarded-For": xff})
        req = req.clone(remote=remote)
        return login.client_ip(req)

    # The rightmost address the trusted proxies didn't add; a spoofed left entry is ignored.
    assert address("10.0.0.2", "203.0.113.9, 198.51.100.7, 10.0.0.5") == "198.51.100.7"
    assert address("192.0.2.4", "198.51.100.7") == "192.0.2.4"


# --- the CLI -----------------------------------------------------------------------------


def test_users_cli(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr("sys.stdin", __import__("io").StringIO(f"{ADMIN_PW}\n"))
    main(
        ["users", "add", "Alex", "--role", "admin", "--data-dir", str(tmp_path), "--password-stdin"]
    )
    assert "Added alex as admin." in capsys.readouterr().out
    main(["users", "list", "--data-dir", str(tmp_path)])
    assert "alex" in capsys.readouterr().out
    monkeypatch.setattr("sys.stdin", __import__("io").StringIO("short\n"))
    with pytest.raises(SystemExit) as err:
        main(["users", "reset-password", "alex", "--data-dir", str(tmp_path), "--password-stdin"])
    assert "at least 10" in str(err.value)
    main(["users", "set-role", "alex", "--role", "viewer", "--data-dir", str(tmp_path)])
    main(["users", "remove", "alex", "--data-dir", str(tmp_path)])
    with pytest.raises(SystemExit):
        main(["users", "remove", "alex", "--data-dir", str(tmp_path)])
    accounts = Accounts(Store(tmp_path / "radiate.db").db)
    assert accounts.users() == []
