"""The security audit log (ADR-0008): every security event in radiate.db, the process
log and the OpenTelemetry export, with who and from where, and never a secret."""

import asyncio
import io
import json
import logging
import sqlite3
import time

import pytest
from aiohttp import WSMsgType
from aiohttp.test_utils import TestClient, TestServer

from radiate.cli import _record_login_config, main
from radiate.config.auth import AuthConfig
from radiate.config.export import parse_export
from radiate.export import telemetry
from radiate.export.otlp import OtlpExporter
from radiate.export.telemetry import check_logs
from radiate.server.app import WS_UNAUTHORISED, create_app
from radiate.server.auth import Accounts, AuthService
from radiate.server.auth.limiter import LoginLimiter
from radiate.server.auth.service import SESSION_COOKIE
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.security import (
    MAX_ROWS,
    ORIGIN_CLI,
    REPEAT_WINDOW_S,
    SecurityLog,
    log_line,
)
from radiate.server.store import Store
from radiate.sim.reference import house_config

TOKEN = "tok-9f8e7d6c5b4a3921"
BEARER = {"Authorization": f"Bearer {TOKEN}"}
ADMIN_PW = "correct horse battery"
VIEWER_PW = "staple paper clip"
WRONG_PW = "wrong-guess-7c1d0e"


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
    async with TestClient(TestServer(create_app(rt, token=TOKEN, login=login))) as c:
        c.login = login
        c.security = login.security
        yield c


async def sign_in(c, username="alex", password=ADMIN_PW) -> dict:
    r = await c.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert r.status == 200, await r.text()
    return await (await c.get("/api/v1/auth/me")).json()


def events(security: SecurityLog, name: str | None = None) -> list[dict]:
    """Every event in the log, oldest first."""
    out = list(reversed(security.query(limit=500)["events"]))
    return [e for e in out if name is None or e["event"] == name]


def last(security: SecurityLog, name: str) -> dict:
    found = events(security, name)
    assert found, f"no {name} in {[e['event'] for e in events(security)]}"
    return found[-1]


# --- sign-in, sign-out and sessions -----------------------------------------------------


async def test_a_password_sign_in_and_sign_out(client):
    me = await sign_in(client)
    e = last(client.security, telemetry.SECURITY_LOGIN)
    a = e["attributes"]
    assert e["outcome"] == "success" and e["severity"] == "INFO" and e["user"] == "alex"
    assert a["event.category"] == "authentication" and a["event.type"] == "start"
    assert a["user.name"] == "alex" and a["user.roles"] == ["admin"]
    assert a["radiate.auth.method"] == "password" and a["source.address"] == "127.0.0.1"
    r = await client.post("/api/v1/auth/logout", headers={"X-CSRF-Token": me["csrf"]})
    assert r.status == 200
    out = last(client.security, telemetry.SECURITY_LOGOUT)
    assert out["attributes"]["event.type"] == "end" and out["user"] == "alex"


@pytest.mark.parametrize(
    ("username", "password", "code"),
    [("alex", WRONG_PW, "bad_password"), ("nobody", WRONG_PW, "unknown_user")],
)
async def test_a_refused_sign_in_says_why(client, username, password, code):
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert r.status == 401
    e = last(client.security, telemetry.SECURITY_LOGIN_FAILED)
    assert e["outcome"] == "failure" and e["severity"] == "WARN"
    assert e["attributes"]["error.type"] == code
    assert e["attributes"]["user.name"] == username
    assert e["attributes"]["radiate.auth.method"] == "password"


async def test_a_malformed_sign_in_is_a_bad_request(client):
    await client.post("/api/v1/auth/login", data="username=alex")
    assert last(client.security, telemetry.SECURITY_LOGIN_FAILED)["attributes"]["error.type"] == (
        "bad_request"
    )


async def test_lockouts_start_and_end(rt):
    login = service(limiter=LoginLimiter(per_user=2, per_address=50, window_s=0.3))
    async with TestClient(TestServer(create_app(rt, login=login))) as c:
        for _ in range(2):
            await c.post("/api/v1/auth/login", json={"username": "alex", "password": WRONG_PW})
        started = last(login.security, telemetry.SECURITY_LOCKOUT_STARTED)
        a = started["attributes"]
        assert a["radiate.lockout.scope"] == "username" and a["user.name"] == "alex"
        assert 0 < a["radiate.lockout.duration"] <= 0.3
        r = await c.post("/api/v1/auth/login", json={"username": "alex", "password": ADMIN_PW})
        assert r.status == 429
        refused = last(login.security, telemetry.SECURITY_LOGIN_FAILED)
        assert refused["attributes"]["error.type"] == "rate_limited"
        await asyncio.sleep(0.4)
        ended = last(login.security, telemetry.SECURITY_LOCKOUT_ENDED)
        assert ended["outcome"] == "success" and ended["attributes"]["user.name"] == "alex"


async def test_an_address_lockout_names_the_address(rt):
    login = service(limiter=LoginLimiter(per_user=50, per_address=2))
    async with TestClient(TestServer(create_app(rt, login=login))) as c:
        for name in ("a1", "a2"):
            await c.post("/api/v1/auth/login", json={"username": name, "password": WRONG_PW})
    a = last(login.security, telemetry.SECURITY_LOCKOUT_STARTED)["attributes"]
    assert a["radiate.lockout.scope"] == "address" and a["source.address"] == "127.0.0.1"
    assert "user.name" not in a


async def test_expired_and_idle_sessions_are_logged(client):
    accounts = client.login.accounts
    old, _ = accounts.create_session("alex", "admin", "local", 86400, now=time.time() - 2 * 86400)
    client.session.cookie_jar.update_cookies({SESSION_COOKIE: old})
    assert (await client.get("/api/v1/state")).status == 401
    ended = last(client.security, telemetry.SECURITY_SESSION_ENDED)
    assert ended["action"] == "session.expired"
    assert ended["attributes"]["event.reason"] == "expired"
    assert ended["attributes"]["user.roles"] == ["admin"]
    refused = last(client.security, telemetry.SECURITY_REQUEST_REFUSED)
    assert refused["attributes"]["error.type"] == "bad_session"
    idle, s = accounts.create_session("alex", "admin", "local", 30 * 86400)
    accounts.db.execute(
        "UPDATE sessions SET last_seen = ? WHERE id_hash = ?", (time.time() - 8 * 86400, s.id_hash)
    )
    client.session.cookie_jar.update_cookies({SESSION_COOKIE: idle})
    await client.get("/api/v1/state")
    assert last(client.security, telemetry.SECURITY_SESSION_ENDED)["action"] == "session.idle"


def test_changing_a_user_logs_the_sessions_it_ends():
    security = SecurityLog.memory()
    accounts = Accounts(Store(":memory:").db)
    AuthService(AuthConfig(enabled=True), accounts, security=security)
    accounts.add_user("alex", ADMIN_PW, "admin")
    for _ in range(2):
        accounts.create_session("alex", "admin", "local", 86400)
    accounts.set_password("alex", "another long one")
    e = last(security, telemetry.SECURITY_SESSION_ENDED)
    assert e["action"] == "session.revoked"
    assert e["attributes"]["event.reason"] == "password_reset"
    assert e["attributes"]["radiate.sessions.ended"] == 2
    accounts.set_role("alex", "viewer")  # no sessions left: nothing to log
    assert len(events(security, telemetry.SECURITY_SESSION_ENDED)) == 1


async def test_sessions_past_their_time_at_start_are_logged():
    security = SecurityLog.memory()
    accounts = Accounts(Store(":memory:").db)
    accounts.create_session("alex", "admin", "local", 86400, now=time.time() - 2 * 86400)
    AuthService(AuthConfig(enabled=True), accounts, security=security)
    assert last(security, telemetry.SECURITY_SESSION_ENDED)["action"] == "session.expired"


# --- refused requests -----------------------------------------------------------------------


@pytest.mark.parametrize(
    ("headers", "cookie", "code"),
    [
        ({}, None, "no_credentials"),
        ({"Authorization": "Bearer wrong-token-123"}, None, "bad_token"),
        ({}, "made-up-session", "bad_session"),
    ],
)
async def test_a_401_says_what_was_wrong(client, headers, cookie, code):
    if cookie:
        client.session.cookie_jar.update_cookies({SESSION_COOKIE: cookie})
    r = await client.get("/api/v1/state", headers=headers)
    assert r.status == 401
    e = last(client.security, telemetry.SECURITY_REQUEST_REFUSED)
    a = e["attributes"]
    assert a["error.type"] == code and a["url.path"] == "/api/v1/state"
    assert a["http.request.method"] == "GET" and a["source.address"] == "127.0.0.1"
    assert e["action"] == "request.refused" and "user.name" not in a


async def test_a_role_too_low_is_logged_with_what_it_needs(client):
    me = await sign_in(client, "sam", VIEWER_PW)
    r = await client.put("/api/v1/layout", json={}, headers={"X-CSRF-Token": me["csrf"]})
    assert r.status == 403
    e = last(client.security, telemetry.SECURITY_ACCESS_DENIED)
    a = e["attributes"]
    assert a["error.type"] == "forbidden" and a["radiate.auth.needed_role"] == "admin"
    assert a["user.name"] == "sam" and a["user.roles"] == ["viewer"]
    assert a["event.category"] == "web" and a["event.type"] == "access"
    assert a["radiate.auth.method"] == "session"
    assert e["message"] == "Refused: sam (viewer) needs admin for PUT /api/v1/layout"


async def test_a_missing_csrf_token_is_logged(client):
    await sign_in(client)
    r = await client.post("/api/v1/mode", json={"mode": "frost"})
    assert r.status == 403
    a = last(client.security, telemetry.SECURITY_ACCESS_DENIED)["attributes"]
    assert a["error.type"] == "csrf" and a["user.name"] == "alex"


async def test_stream_refusals_are_logged(client):
    async with client.ws_connect("/api/v1/stream") as ws:
        await ws.send_json({"token": "not-the-token"})
        msg = await ws.receive()
        assert msg.type is WSMsgType.CLOSE and msg.data == WS_UNAUTHORISED
    e = last(client.security, telemetry.SECURITY_REQUEST_REFUSED)
    assert e["action"] == "stream.refused" and e["attributes"]["error.type"] == "bad_token"
    await sign_in(client)
    r = await client.get(
        "/api/v1/stream",
        headers={
            "Origin": "https://evil.example",
            "Upgrade": "websocket",
            "Connection": "Upgrade",
            "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
            "Sec-WebSocket-Version": "13",
        },
    )
    assert r.status == 403
    a = last(client.security, telemetry.SECURITY_ACCESS_DENIED)["attributes"]
    assert a["error.type"] == "origin" and a["user.name"] == "alex"


async def test_with_login_off_the_address_respects_trusted_proxies(rt):
    for proxies, expected in (((), "127.0.0.1"), (("127.0.0.1/32",), "198.51.100.7")):
        security = SecurityLog.memory()
        app = create_app(rt, token=TOKEN, security=security, trusted_proxies=proxies)
        async with TestClient(TestServer(app)) as c:
            await c.get("/api/v1/state", headers={"X-Forwarded-For": "198.51.100.7"})
        a = last(security, telemetry.SECURITY_REQUEST_REFUSED)["attributes"]
        assert a["source.address"] == expected


# --- changes ----------------------------------------------------------------------------------


async def test_changes_say_who_made_them(client):
    me = await sign_in(client)
    csrf = {"X-CSRF-Token": me["csrf"]}
    plan = {"floors": ["Ground floor"], "rooms": {}}
    assert (await client.put("/api/v1/layout", json=plan, headers=csrf)).status == 200
    e = last(client.security, telemetry.SECURITY_CONFIG_CHANGED)
    a = e["attributes"]
    assert e["action"] == "layout.saved" and a["radiate.config.area"] == "layout"
    assert a["user.name"] == "alex" and a["event.category"] == "configuration"
    assert e["message"] == "Layout saved by alex (admin)"
    r = await client.post("/api/v1/learning/reset", json={}, headers=BEARER)
    assert r.status == 200
    reset = last(client.security, telemetry.SECURITY_CONFIG_CHANGED)
    if (await r.json())["reset"]:
        assert reset["action"] == "learning.reset"
        assert reset["attributes"]["radiate.auth.method"] == "token"
        assert reset["attributes"]["radiate.room.ids"]
        assert "user.name" not in reset["attributes"]
        assert reset["message"].endswith("by the API token")


async def test_settings_changes_name_paths_never_values(tmp_path):
    from tests.server.test_settings_api import runtime as settings_runtime

    rt = settings_runtime(tmp_path)
    security = SecurityLog.memory()
    app = create_app(rt, token=TOKEN, security=security)
    async with TestClient(TestServer(app)) as c:
        r = await c.put(
            "/api/v1/settings/config",
            json={"values": {"mqtt.password": "new-mqtt-secret-55", "boiler.frost_c": 6}},
            headers=BEARER,
        )
        assert r.status == 200, await r.text()
    e = last(security, telemetry.SECURITY_CONFIG_CHANGED)
    assert e["action"] == "settings.saved"
    assert e["attributes"]["radiate.settings.paths"] == ["boiler.frost_c", "mqtt.password"]
    assert "new-mqtt-secret-55" not in json.dumps(security.query())


# --- the API and who may read it -----------------------------------------------------------


async def test_only_an_admin_reads_the_log(client):
    me = await sign_in(client, "sam", VIEWER_PW)
    assert (await client.get("/api/v1/audit")).status == 403
    await client.post("/api/v1/auth/logout", headers={"X-CSRF-Token": me["csrf"]})
    assert (await client.get("/api/v1/audit")).status == 401
    await sign_in(client)
    r = await client.get("/api/v1/audit")
    assert r.status == 200
    body = await r.json()
    assert body["retention_days"] == 90
    assert {"alex", "sam"} <= set(body["users"])
    assert all(e["id"] > f["id"] for e, f in zip(body["events"], body["events"][1:], strict=False))


async def test_the_api_filters_by_outcome_and_user_and_pages(client):
    for _ in range(3):
        await client.post("/api/v1/auth/login", json={"username": "sam", "password": WRONG_PW})
    await sign_in(client)
    failures = await (await client.get("/api/v1/audit?outcome=failure&user=sam")).json()
    assert failures["events"] and {e["outcome"] for e in failures["events"]} == {"failure"}
    assert {e["user"] for e in failures["events"]} == {"sam"}
    page = await (await client.get("/api/v1/audit?limit=1")).json()
    assert len(page["events"]) == 1
    older = await (
        await client.get(f"/api/v1/audit?limit=1&before={page['events'][0]['id']}")
    ).json()
    assert older["events"][0]["id"] < page["events"][0]["id"]
    assert (await client.get("/api/v1/audit?outcome=maybe")).status == 400
    assert (await client.get("/api/v1/audit?limit=x")).status == 400


# --- never a secret ---------------------------------------------------------------------------


async def test_no_secret_reaches_any_record(rt, caplog):
    caplog.set_level(logging.DEBUG)
    cfg, _ = parse_export({"otlp": {"endpoint": "http://collector.invalid"}})
    rt.otlp = OtlpExporter(cfg.otlp, rt.house_id, {})
    login = service()
    async with TestClient(TestServer(create_app(rt, token=TOKEN, login=login))) as c:
        await c.post("/api/v1/auth/login", json={"username": "alex", "password": WRONG_PW})
        await c.post("/api/v1/auth/login", json={"username": "alex", "password": ADMIN_PW})
        session_id = c.session.cookie_jar.filter_cookies(c.make_url("/"))[SESSION_COOKIE].value
        me = await (await c.get("/api/v1/auth/me")).json()
        await c.post("/api/v1/mode", json={"mode": "frost"}, headers={"X-CSRF-Token": "bad-csrf"})
        await c.post("/api/v1/mode", json={"mode": "auto"}, headers={"X-CSRF-Token": me["csrf"]})
        await c.post("/api/v1/auth/logout", headers={"X-CSRF-Token": me["csrf"]})
        c.session.cookie_jar.clear()
        await c.get("/api/v1/state", headers={"Authorization": "Bearer guessed-token-0001"})
        await c.get("/api/v1/state", headers=BEARER)
        await c.put(
            "/api/v1/layout", json={"floors": ["Ground floor"], "rooms": {}}, headers=BEARER
        )
    await rt.step()
    stored = json.dumps(login.security.query(limit=500))
    queued = json.dumps(list(rt.otlp.queues["logs"]))
    logged = caplog.text
    assert "radiate.security.login" in stored and "radiate.security.login" in queued
    assert "event=radiate.security.login" in logged
    secrets = (ADMIN_PW, WRONG_PW, TOKEN, "guessed-token-0001", session_id, me["csrf"])
    for where in (stored, queued, logged):
        for secret in secrets:
            assert secret not in where


async def test_security_events_reach_the_export_and_match_the_schema(rt):
    cfg, _ = parse_export({"otlp": {"endpoint": "http://collector.invalid"}})
    rt.otlp = OtlpExporter(cfg.otlp, rt.house_id, {})
    async with TestClient(TestServer(create_app(rt, token=TOKEN))) as c:
        await c.get("/api/v1/state")
    await rt.step()
    logs = rt.otlp._request("logs", rt.otlp.queues["logs"].peek(1000))
    assert check_logs(logs) == []
    names = [r["eventName"] for r in logs["resourceLogs"][0]["scopeLogs"][0]["logRecords"]]
    assert "radiate.security.request.refused" in names


# --- folding, bounds, failures ----------------------------------------------------------------


def test_repeats_from_one_address_fold_into_one_record():
    now = [0.0]
    security = SecurityLog(
        sqlite3.connect(":memory:", isolation_level=None), monotonic=lambda: now[0]
    )
    sent = []
    security.sink = sent.append
    attrs = {"source.address": "192.0.2.9", "error.type": "bad_token", "url.path": "/api/v1/x"}
    for i in range(5):
        security.record(
            telemetry.SECURITY_REQUEST_REFUSED,
            "request.refused",
            "Request refused: wrong API token",
            {**attrs, "url.path": f"/api/v1/{i}"},
        )
    assert len(events(security)) == 1 and len(sent) == 1
    now[0] = REPEAT_WINDOW_S + 1
    security.tick()
    folded = events(security)[-1]
    assert folded["attributes"]["radiate.security.count"] == 4
    assert folded["attributes"]["url.path"] == "/api/v1/4"
    assert "4 like refusals" in folded["message"]
    assert len(sent) == 2
    # Sign-ins are never folded.
    for _ in range(3):
        security.record(
            telemetry.SECURITY_LOGIN,
            "login",
            "Signed in",
            {"user.name": "a", "user.roles": ["admin"]},
        )
    assert len(events(security, telemetry.SECURITY_LOGIN)) == 3


def test_old_events_are_pruned():
    now = [1_000_000.0]
    security = SecurityLog(
        sqlite3.connect(":memory:", isolation_level=None), retention_days=1, clock=lambda: now[0]
    )
    security.record(telemetry.SECURITY_LOGOUT, "logout", "Signed out: a", {"user.name": "a"})
    now[0] += 2 * 86400
    security.record(telemetry.SECURITY_LOGOUT, "logout", "Signed out: b", {"user.name": "b"})
    security.prune()
    assert [e["user"] for e in events(security)] == ["b"]
    assert MAX_ROWS >= 10_000


async def test_a_broken_log_never_breaks_a_request(rt, caplog):
    security = SecurityLog.memory()
    security.db.close()
    security.sink = lambda rec: 1 / 0
    async with TestClient(TestServer(create_app(rt, token=TOKEN, security=security))) as c:
        assert (await c.get("/api/v1/state")).status == 401
        assert (await c.get("/api/v1/state", headers=BEARER)).status == 200
        assert (await c.get("/api/v1/audit", headers=BEARER)).status in (200, 500)
    security.tick()
    assert "an event was not recorded" in caplog.text


def test_a_log_line_is_one_parseable_line():
    rec = telemetry.security_record(
        telemetry.SECURITY_LOGIN_FAILED,
        "login",
        'Sign-in refused for x\nevent=forged: "no"',
        {
            "user.name": 'x\nevent=forged "quote"',
            "source.address": "192.0.2.1",
            "radiate.auth.method": "password",
            "error.type": "unknown_user",
        },
    )
    line = log_line(rec)
    assert "\n" not in line
    assert line.startswith(
        "event=radiate.security.login.failed action=login outcome=failure event.category="
    )
    assert 'user.name="x\\nevent=forged \\"quote\\""' in line
    assert "source.address=192.0.2.1" in line and line.endswith('"')


def test_request_text_is_cleaned_before_it_is_stored():
    security = SecurityLog.memory()
    security.record(
        telemetry.SECURITY_LOGIN_FAILED,
        "login",
        "Sign-in refused",
        {
            "user.name": "a\x00b\x1b" + "c" * 500,
            "radiate.auth.method": "password",
            "error.type": "unknown_user",
        },
    )
    name = events(security)[0]["user"]
    assert name.startswith("a?b?") and len(name) == 256


# --- the command line and the start -------------------------------------------------------


def test_users_cli_logs_every_change_and_the_server_forwards_it(tmp_path, monkeypatch):
    server = SecurityLog(Store(tmp_path / "radiate.db").db)
    sent = []
    server.sink = sent.append
    monkeypatch.setattr("sys.stdin", io.StringIO(f"{ADMIN_PW}\n"))
    main(
        ["users", "add", "Alex", "--role", "admin", "--data-dir", str(tmp_path), "--password-stdin"]
    )
    main(["users", "set-role", "alex", "--role", "household", "--data-dir", str(tmp_path)])
    monkeypatch.setattr("sys.stdin", io.StringIO("another long password\n"))
    main(["users", "reset-password", "alex", "--data-dir", str(tmp_path), "--password-stdin"])
    main(["users", "remove", "alex", "--data-dir", str(tmp_path)])
    log = SecurityLog(Store(tmp_path / "radiate.db").db)
    changes = events(log, telemetry.SECURITY_USER_CHANGED)
    assert [e["action"] for e in changes] == [
        "user.added",
        "user.role_changed",
        "user.password_reset",
        "user.removed",
    ]
    assert [e["attributes"]["event.type"] for e in changes] == [
        "creation",
        "change",
        "change",
        "deletion",
    ]
    assert changes[0]["attributes"]["user.target.roles"] == ["admin"]
    assert changes[1]["attributes"]["user.target.roles"] == ["household"]
    assert {e["attributes"]["radiate.auth.method"] for e in changes} == {"cli"}
    row = log.db.execute("SELECT DISTINCT origin FROM audit_log").fetchall()
    assert row == [(ORIGIN_CLI,)]
    assert ADMIN_PW not in json.dumps(log.query())
    server.tick()
    assert [r["c"] for r in sent] == [e["action"] for e in changes]
    server.tick()
    assert len(sent) == 4  # forwarded once


@pytest.mark.parametrize(
    ("login", "token", "methods", "text"),
    [
        (False, "", [], "Login off; no API token: the API is open to anyone who can reach it"),
        (False, TOKEN, [], "Login off; API token set"),
        (True, TOKEN, ["password"], "Login on: password; API token set"),
    ],
)
def test_login_config_is_logged_at_start(login, token, methods, text):
    security = SecurityLog.memory()
    cfg = AuthConfig(enabled=login, trusted_proxies=("10.0.0.0/8",))
    svc = service(cfg) if login else None
    _record_login_config(security, cfg, svc, token, "")
    e = last(security, telemetry.SECURITY_LOGIN_CONFIG)
    a = e["attributes"]
    assert e["message"] == text
    assert a["radiate.auth.login"] is login and a["radiate.auth.methods"] == methods
    assert a["radiate.auth.token"] is bool(token) and a["radiate.auth.trusted_proxies"] == 1
