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
    assert a["radiate.auth.method"] == "password" and a["client.address"] == "127.0.0.1"
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
    if code == "unknown_user":
        # OpenTelemetry's user.hash stands for a name that matches no account.
        assert e["attributes"]["user.hash"] == client.security.user_hash(username)
        assert "user.name" not in e["attributes"]
        assert e["user"] == client.security.pseudonym(username)  # unknown:<hash>
    else:
        assert e["attributes"]["user.name"] == username
    assert e["attributes"]["radiate.auth.method"] == "password"


async def test_an_unknown_username_is_never_recorded_as_typed(rt, caplog):
    """A name that matches no account is often a password in the wrong box: the table,
    the export queue and the process log hold only its keyed hash, lockouts included."""
    caplog.set_level(logging.DEBUG)
    cfg, _ = parse_export({"otlp": {"endpoint": "http://collector.invalid"}})
    rt.otlp = OtlpExporter(cfg.otlp, rt.house_id, {})
    typed = "Hunter2-Typed-In-The-Wrong-Box"
    login = service(limiter=LoginLimiter(per_user=2, per_address=50, window_s=60))
    async with TestClient(TestServer(create_app(rt, token=TOKEN, login=login))) as c:
        for _ in range(3):  # two refusals, a lockout, then refused while locked
            await c.post("/api/v1/auth/login", json={"username": typed, "password": WRONG_PW})
        await c.post("/api/v1/auth/login", json={"username": "ALEX", "password": WRONG_PW})
    login.security._flush(0.0, force=True)  # write the folded repeat now, not in a minute
    await rt.step()
    stored = json.dumps(login.security.query(limit=500))
    queued = json.dumps(list(rt.otlp.queues["logs"]))
    logged = caplog.text
    hashed = login.security.pseudonym(typed.lower())
    assert hashed.startswith("unknown:") and len(hashed) == len("unknown:") + 16
    for where in (stored, queued, logged):
        assert hashed in where
        assert typed.lower() not in where.lower()
    assert f'"user.hash": "{login.security.user_hash(typed.lower())}"' in queued
    failed = events(login.security, telemetry.SECURITY_LOGIN_FAILED)
    # The second unknown_user refusal folds into one record, written last.
    assert [e["attributes"]["error.type"] for e in failed] == [
        "unknown_user",
        "rate_limited",
        "bad_password",
        "unknown_user",
    ]
    assert failed[3]["attributes"]["radiate.security.count"] == 1
    assert {e["user"] for i, e in enumerate(failed) if i != 2} == {hashed}
    assert failed[2]["user"] == "alex"  # an existing account is named as it is
    lockout = last(login.security, telemetry.SECURITY_LOCKOUT_STARTED)
    assert lockout["attributes"]["user.hash"] == hashed.removeprefix("unknown:")
    assert lockout["user"] == hashed


def test_the_hash_key_is_kept_per_install(tmp_path):
    from radiate.server.security import KEY_FILE, load_key

    first = SecurityLog.memory()
    first._key = load_key(tmp_path)
    again = SecurityLog(None, key=load_key(tmp_path))
    (tmp_path / "elsewhere").mkdir()
    other = SecurityLog(None, key=load_key(tmp_path / "elsewhere"))
    assert first.pseudonym("bob") == again.pseudonym("bob")  # same install, same hash
    assert first.pseudonym("bob") != first.pseudonym("rob")
    assert first.pseudonym("bob") != other.pseudonym("bob")  # another install's key
    assert (tmp_path / KEY_FILE).stat().st_mode & 0o777 == 0o600


def test_an_unreadable_key_falls_back_to_one_for_this_run(tmp_path, caplog):
    from radiate.server.security import KEY_FILE, load_key

    (tmp_path / KEY_FILE).write_text("not hex\n")
    assert len(load_key(tmp_path)) == 32
    assert "unknown usernames are hashed with a key for this run only" in caplog.text


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
    assert a["radiate.lockout.scope"] == "address" and a["client.address"] == "127.0.0.1"
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
    assert a["http.request.method"] == "GET" and a["client.address"] == "127.0.0.1"
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
        assert a["client.address"] == expected


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


HOME_PW = "kettle on the hob"


@pytest.fixture
async def house(tmp_path):
    """A server with the household setup, and a household user, sam."""
    from tests.server.test_household_setup import make

    runtime = make(tmp_path)
    await runtime.step()
    accounts = Accounts(Store(":memory:").db)
    accounts.add_user("alex", ADMIN_PW, "admin")
    accounts.add_user("sam", HOME_PW, "household")
    login = AuthService(AuthConfig(enabled=True), accounts)
    async with TestClient(TestServer(create_app(runtime, token=TOKEN, login=login))) as c:
        c.rt, c.security = runtime, login.security
        yield c


async def as_user(c, username: str, password: str) -> dict:
    c.session.cookie_jar.clear()
    me = await sign_in(c, username, password)
    return {"X-CSRF-Token": me["csrf"]}


def changes(security: SecurityLog, action: str) -> list[dict]:
    return [e for e in events(security, telemetry.SECURITY_CONFIG_CHANGED) if e["action"] == action]


async def test_a_household_demand_mode_change_names_who_and_both_values(house):
    h = await as_user(house, "sam", HOME_PW)
    before = house.rt.effective_demand_mode.value
    after = "comfort" if before == "eco" else "eco"
    r = await house.post("/api/v1/settings", json={"demand_mode": after}, headers=h)
    assert r.status == 200, await r.text()
    e = changes(house.security, "mode.changed")[-1]
    a = e["attributes"]
    assert a["user.name"] == "sam" and a["user.roles"] == ["household"]
    assert a["radiate.config.area"] == "mode" and a["radiate.config.key"] == "demand_mode"
    assert a["radiate.config.before"] == before and a["radiate.config.after"] == after
    assert e["message"] == f"Demand mode changed from {before} to {after} by sam (household)"
    # Choosing what is already in use changes nothing, and records nothing.
    n = len(changes(house.security, "mode.changed"))
    await house.post("/api/v1/settings", json={"demand_mode": after}, headers=h)
    assert len(changes(house.security, "mode.changed")) == n
    # Back to the house file's.
    await house.post("/api/v1/settings", json={"demand_mode": None}, headers=h)
    back = changes(house.security, "mode.changed")[-1]
    assert back["attributes"]["radiate.config.after"] == house.rt.effective_demand_mode.value
    assert back["message"].endswith(": following the house file")


async def test_a_heating_mode_change_names_who_and_both_values(house):
    h = await as_user(house, "sam", HOME_PW)
    assert (await house.post("/api/v1/mode", json={"mode": "frost"}, headers=h)).status == 200
    a = changes(house.security, "mode.changed")[-1]["attributes"]
    assert a["radiate.config.key"] == "mode" and a["user.name"] == "sam"
    assert a["radiate.config.before"] == "auto" and a["radiate.config.after"] == "frost"


async def test_a_room_adjustment_is_logged_with_old_and_new_values(house):
    h = await as_user(house, "sam", HOME_PW)
    section = (await (await house.get("/api/v1/household")).json())["household"]
    late = {"days": ["mon", "tue"], "keep": "warm", "from": "22:30", "to": "23:00"}
    section["rooms"]["kitchen"]["adjust"] = [late]
    r = await house.put("/api/v1/household", json={"household": section}, headers=h)
    assert r.status == 200, await r.text()
    [e] = changes(house.security, "household.saved")
    a = e["attributes"]
    assert a["user.name"] == "sam" and a["radiate.config.area"] == "household"
    assert a["radiate.config.key"] == "household.rooms.kitchen.adjust"
    assert a["radiate.settings.paths"] == ["household.rooms.kitchen.adjust"]
    assert a["radiate.config.before"] == "none"
    assert json.loads(a["radiate.config.after"]) == [late]
    assert e["message"].startswith(
        "Household setup saved by sam (household): household.rooms.kitchen.adjust from none to "
    )


async def test_changes_to_the_people_name_no_one(house):
    h = await as_user(house, "alex", ADMIN_PW)
    section = (await (await house.get("/api/v1/household")).json())["household"]
    person = next(iter(section["people"]))
    section["people"][person]["name"] = "Somebody Private"
    section["temperatures"]["in_use"] = 20
    r = await house.put("/api/v1/household", json={"household": section}, headers=h)
    assert r.status == 200, await r.text()
    saved = changes(house.security, "household.saved")
    by_key = {e["attributes"]["radiate.config.key"]: e["attributes"] for e in saved}
    assert set(by_key) == {"household.people", "household.temperatures.in_use"}
    assert "radiate.config.before" not in by_key["household.people"]
    assert by_key["household.temperatures.in_use"]["radiate.config.after"] == "20"
    stored = json.dumps(house.security.query(limit=500))
    assert "Somebody Private" not in stored and f"people.{person}" not in stored


async def test_day_to_day_controls_say_who_and_what(house):
    h = await as_user(house, "sam", HOME_PW)
    pid = house.rt.setup.site.household.people[0].id
    calls = [
        ("/api/v1/rooms/bedroom_1/setpoint", {"setpoint": 21.5, "duration_min": 60}),
        ("/api/v1/rooms/bedroom_1/setpoint", {"setpoint": None}),
        ("/api/v1/rooms/lounge/fire", {"lit": True}),
        ("/api/v1/rooms/lounge/fire", {"lit": False}),
        ("/api/v1/store/boost", {"minutes": 30}),
        (f"/api/v1/people/{pid}/away", {"until": "2026-11-25T18:00"}),
        (f"/api/v1/people/{pid}/away", {"until": None}),
        (f"/api/v1/people/{pid}/home", {}),
    ]
    for path, body in calls:
        r = await house.post(path, json=body, headers=h)
        assert r.status == 200, (path, await r.text())
    used = events(house.security, telemetry.SECURITY_CONTROL_USED)
    assert [(e["action"], e["attributes"]["radiate.control.value"]) for e in used] == [
        ("setpoint.held", "21.5"),
        ("setpoint.cleared", "cleared"),
        ("fire.lit", "lit"),
        ("fire.out", "out"),
        ("store.boosted", "30"),
        ("away.set", "2026-11-25T18:00"),
        ("away.cleared", "cleared"),
        ("home.said", "home"),
    ]
    for e in used:
        a = e["attributes"]
        assert a["user.name"] == "sam" and a["user.roles"] == ["household"]
        assert e["outcome"] == "success" and e["severity"] == "INFO"
        assert a["event.category"] == "configuration" and a["event.type"] == "change"
        assert not {k for k in a if "presence" in k or "location" in k or "geo" in k}
    assert used[0]["attributes"]["radiate.room.id"] == "bedroom_1"
    assert used[0]["attributes"]["radiate.control.kind"] == "setpoint"
    assert used[0]["message"].endswith("held at 21.5° by sam (household)")
    assert used[5]["attributes"]["radiate.person.id"] == pid


async def test_controls_are_not_logged_with_audit_controls_off(house):
    h = await as_user(house, "sam", HOME_PW)
    house.security.audit_controls = False
    r = await house.post("/api/v1/store/boost", json={"minutes": 20}, headers=h)
    assert r.status == 200
    assert not events(house.security, telemetry.SECURITY_CONTROL_USED)
    # Mode changes are configuration, and are logged either way.
    await house.post("/api/v1/mode", json={"mode": "frost"}, headers=h)
    assert changes(house.security, "mode.changed")


async def test_audit_controls_is_a_live_setting(tmp_path):
    from radiate.config.settings import setting_for
    from tests.server.test_settings_api import runtime as settings_runtime

    _, setting = setting_for("auth.audit_controls")
    assert setting.restart is False and setting.default is True and setting.kind == "bool"
    rt = settings_runtime(tmp_path)
    security = SecurityLog.memory()
    app = create_app(rt, token=TOKEN, security=security)
    assert security.audit_controls is True
    async with TestClient(TestServer(app)) as c:
        r = await c.put(
            "/api/v1/settings/config",
            json={"values": {"auth.audit_controls": False}},
            headers=BEARER,
        )
        assert r.status == 200, await r.text()
        assert security.audit_controls is False  # used at once, no restart
        r = await c.post("/api/v1/store/boost", json={"minutes": 5}, headers=BEARER)
        assert r.status == 200
        assert not events(security, telemetry.SECURITY_CONTROL_USED)
        r = await c.put(
            "/api/v1/settings/config",
            json={"values": {"auth.audit_controls": True}},
            headers=BEARER,
        )
        assert r.status == 200 and security.audit_controls is True
        await c.post("/api/v1/store/boost", json={"minutes": 5}, headers=BEARER)
    assert events(security, telemetry.SECURITY_CONTROL_USED)


def test_household_changes_are_setting_by_setting():
    from radiate.server.security import Change, household_changes

    before = {"temperatures": {"in_use": 19, "night": 14}, "rooms": {"a": {"use": "in_use"}}}
    after = {"temperatures": {"in_use": 19.5, "night": 14}, "rooms": {"a": {"use": "unused"}}}
    after["rooms"]["a"]["people"] = ["p1"]
    assert household_changes(before, after) == [
        Change("household.rooms.a.people", None, None),
        Change("household.rooms.a.use", "in_use", "unused"),
        Change("household.temperatures.in_use", "19", "19.5"),
    ]
    assert household_changes(before, before) == []


async def test_security_events_can_be_kept_out_of_the_export(rt, caplog):
    caplog.set_level(logging.INFO)
    cfg, _ = parse_export({"otlp": {"endpoint": "http://collector.invalid", "security": False}})
    rt.otlp = OtlpExporter(cfg.otlp, rt.house_id, {})
    security = SecurityLog.memory()
    async with TestClient(TestServer(create_app(rt, token=TOKEN, security=security))) as c:
        await c.get("/api/v1/state")
        r = await c.post("/api/v1/mode", json={"mode": "frost"}, headers=BEARER)
        assert r.status == 200
    await rt.step()
    queued = list(rt.otlp.queues["logs"])
    assert not [q for q in queued if q["e"].startswith("radiate.security.")]
    assert telemetry.MODE_CHANGED in {q["e"] for q in queued}  # the rest still goes
    # Recorded locally regardless: the table and the process log.
    assert events(security, telemetry.SECURITY_REQUEST_REFUSED)
    assert changes(security, "mode.changed")
    assert "event=radiate.security.request.refused" in caplog.text


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


def test_a_refusal_is_warn_and_success_is_info():
    """OpenTelemetry severity follows the outcome: WARN (13) for a failure, INFO (9)
    for a success."""
    for e in telemetry.SECURITY_EVENTS:
        outcome = telemetry.SECURITY_KINDS[e.name][2]
        assert e.severity == ("WARN" if outcome == "failure" else "INFO"), e.name


async def test_exported_security_records_follow_opentelemetry(rt):
    """The OTLP log records: the event name in EventName, never an attribute;
    severity number and text; client.address, user_agent.original, user.name,
    http.request.method and url.path from the semantic conventions; the resource's
    service.name, service.version and service.instance.id."""
    cfg, _ = parse_export({"otlp": {"endpoint": "http://collector.invalid"}})
    rt.otlp = OtlpExporter(cfg.otlp, rt.house_id, {})
    login = service()
    ua = {"User-Agent": "TestBrowser/1.0"}
    async with TestClient(TestServer(create_app(rt, token=TOKEN, login=login))) as c:
        await c.post("/api/v1/auth/login", json={"username": "nobody", "password": WRONG_PW})
        await sign_in(c)
        await c.get("/api/v1/state", headers={"Authorization": "Bearer wrong", **ua})
    await rt.step()
    request = rt.otlp._request("logs", rt.otlp.queues["logs"].peek(1000))
    assert check_logs(request) == []
    resource = {a["key"]: a["value"] for a in request["resourceLogs"][0]["resource"]["attributes"]}
    assert resource["service.name"] == {"stringValue": "radiate"}
    assert "service.version" in resource
    assert resource["service.instance.id"] == {"stringValue": rt.house_id}
    records = request["resourceLogs"][0]["scopeLogs"][0]["logRecords"]
    security = [r for r in records if r["eventName"].startswith("radiate.security.")]
    assert security
    for r in security:
        keys = {a["key"] for a in r["attributes"]}
        assert "event.name" not in keys and "source.address" not in keys
        assert (r["severityNumber"], r["severityText"]) in ((9, "INFO"), (13, "WARN"))
    by_name = {r["eventName"]: {a["key"]: a["value"] for a in r["attributes"]} for r in security}
    failed = by_name[telemetry.SECURITY_LOGIN_FAILED]
    assert "user.hash" in failed and "user.name" not in failed
    assert failed["client.address"] == {"stringValue": "127.0.0.1"}
    assert by_name[telemetry.SECURITY_LOGIN]["user.name"] == {"stringValue": "alex"}
    refused = by_name[telemetry.SECURITY_REQUEST_REFUSED]
    assert refused["user_agent.original"] == {"stringValue": "TestBrowser/1.0"}
    assert refused["http.request.method"] == {"stringValue": "GET"}
    assert refused["url.path"] == {"stringValue": "/api/v1/state"}
    assert refused["error.type"] == {"stringValue": "bad_token"}


# --- folding, bounds, failures ----------------------------------------------------------------


def test_repeats_from_one_address_fold_into_one_record():
    now = [0.0]
    security = SecurityLog(
        sqlite3.connect(":memory:", isolation_level=None), monotonic=lambda: now[0]
    )
    sent = []
    security.sink = sent.append
    attrs = {"client.address": "192.0.2.9", "error.type": "bad_token", "url.path": "/api/v1/x"}
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
            "client.address": "192.0.2.1",
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
    assert "client.address=192.0.2.1" in line and line.endswith('"')


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


# --- the web UI -----------------------------------------------------------------------------


def _view(html: str, cls: str) -> str:
    """The markup of one view in index.html, from its opening tag to the next view's."""
    start = html.index(f'<section class="{cls}"')
    end = html.index('\n  <section class="', start + 1)
    return html[start:end]


def test_the_security_log_is_under_settings_not_raw_data():
    from pathlib import Path

    web = Path(__file__).resolve().parents[2] / "web"
    html = (web / "index.html").read_text()
    settings, data = _view(html, "settings-view"), _view(html, "data-view")
    assert 'id="s-security-log"' in settings and 'id="security-body"' in settings
    assert "security" not in data.lower()  # Raw data shows sensor data only
    app = (web / "app.js").read_text()
    assert "rawDataView" not in app and 'id: "security-log"' in app


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
