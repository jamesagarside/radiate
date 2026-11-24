"""Roles and the permission table: admin, household and viewer (ADR-0006 amendment).

Every route needs an entry in `radiate.server.permissions.PERMISSIONS`, so a new route
can't default open. These tests also walk each role through what it may and may not do.
"""

import copy

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

from radiate.cli import main
from radiate.config.auth import (
    AuthConfig,
    RoleMap,
    normalise_role,
    parse_auth,
    role_at_least,
)
from radiate.config.site import _Ctx
from radiate.server.app import create_app
from radiate.server.auth import AccountError, Accounts, AuthService
from radiate.server.permissions import (
    ADMIN,
    HOUSEHOLD,
    PERMISSIONS,
    PUBLIC,
    VIEWER,
    route_key,
)
from radiate.server.store import Store
from tests.server.test_household_setup import make

ADMIN_PW = "correct horse battery"
HOME_PW = "kettle on the hob"
VIEW_PW = "staple paper clip"
TOKEN = {"Authorization": "Bearer secret"}


def keys(app: web.Application) -> set[tuple[str, str]]:
    return {k for k in (route_key(r) for r in app.router.routes()) if k is not None}


def test_every_route_has_a_permission(tmp_path):
    (tmp_path / "index.html").write_text("")
    app = create_app(make(tmp_path), token="secret", web_dir=tmp_path)
    missing = sorted(keys(app) - PERMISSIONS.keys())
    assert not missing, f"add these routes to radiate.server.permissions.PERMISSIONS: {missing}"
    stale = sorted(PERMISSIONS.keys() - keys(app))
    assert not stale, f"no route serves these PERMISSIONS entries any more: {stale}"
    assert set(PERMISSIONS.values()) <= {PUBLIC, VIEWER, HOUSEHOLD, ADMIN}


def test_only_reads_and_signing_in_are_open():
    for (method, path), needed in PERMISSIONS.items():
        if needed == PUBLIC and path.startswith("/api/"):
            assert (method, path) in {
                ("GET", "/api/v1/health"),
                ("GET", "/api/v1/auth/config"),
                ("POST", "/api/v1/auth/login"),
                ("GET", "/api/v1/stream"),
            }
        if method != "GET" and needed == VIEWER:
            assert path == "/api/v1/auth/logout"


def test_roles_rank_and_aliases():
    assert role_at_least("admin", "household") and role_at_least("household", "household")
    assert role_at_least("household", "viewer") and not role_at_least("viewer", "household")
    assert not role_at_least("household", "admin")
    assert not role_at_least("superuser", "viewer")  # an unknown stored role may do nothing
    assert normalise_role("readonly") == "viewer" and normalise_role(" Household ") == "household"
    assert normalise_role("owner") is None


def test_role_map_households_rank_between():
    roles = RoleMap("groups", admins=("alex",), viewers=("guests",), households=("family",))
    assert roles.role_for("alex", ("family",)) == "admin"
    assert roles.role_for("sam", ("family", "guests")) == "household"
    assert roles.role_for("kit", ("guests",)) == "viewer"
    assert roles.role_for("kit", ("other",)) is None


def test_households_list_is_enough_on_its_own():
    ctx = _Ctx()
    cfg = parse_auth(
        ctx,
        {
            "enabled": True,
            "public_url": "https://radiate.example.org",
            "oidc": {
                "issuer": "https://id.example.org",
                "client_id": "radiate",
                "roles_claim": "groups",
                "households": ["family"],
            },
        },
    )
    assert ctx.problems == []
    assert cfg.oidc.roles.households == ("family",)
    ctx = _Ctx()
    parse_auth(ctx, {"enabled": True, "saml": {"idp_metadata_file": "/x.xml", "households": 3}})
    assert any("auth.saml.households" in p for p in ctx.problems)


def test_accounts_take_readonly_for_viewer():
    accounts = Accounts(Store(":memory:").db)
    assert accounts.add_user("kit", VIEW_PW, "readonly").role == "viewer"
    accounts.add_user("sam", HOME_PW, "household")
    accounts.set_role("kit", "household")
    assert accounts.user("kit").role == "household"
    with pytest.raises(AccountError):
        accounts.set_role("kit", "owner")


def test_cli_household_and_readonly(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr("sys.stdin", __import__("io").StringIO(f"{HOME_PW}\n"))
    main(
        [
            "users",
            "add",
            "Sam",
            "--role",
            "household",
            "--data-dir",
            str(tmp_path),
            "--password-stdin",
        ]
    )
    assert "Added sam as household." in capsys.readouterr().out
    main(["users", "set-role", "sam", "--role", "readonly", "--data-dir", str(tmp_path)])
    assert "sam is now viewer." in capsys.readouterr().out


# --- each role against the server ------------------------------------------------------


@pytest.fixture
async def server(tmp_path):
    rt = make(tmp_path)
    await rt.step()
    accounts = Accounts(Store(":memory:").db)
    accounts.add_user("alex", ADMIN_PW, "admin")
    accounts.add_user("sam", HOME_PW, "household")
    accounts.add_user("kit", VIEW_PW, "viewer")
    login = AuthService(AuthConfig(enabled=True), accounts)
    app = create_app(rt, token="secret", login=login)
    async with TestClient(TestServer(app)) as c:
        c.rt = rt
        yield c


async def as_user(c: TestClient, username: str, password: str) -> dict:
    """Sign in; returns the headers a change needs (the session's CSRF token)."""
    c.session.cookie_jar.clear()
    r = await c.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert r.status == 200, await r.text()
    me = await (await c.get("/api/v1/auth/me")).json()
    return {"X-CSRF-Token": me["csrf"]}


# Requests a household may make: (method, path, body).
HOUSEHOLD_CALLS = [
    ("POST", "/api/v1/rooms/bedroom_1/setpoint", {"setpoint": 21, "duration_min": 60}),
    ("POST", "/api/v1/rooms/lounge/fire", {"lit": True}),
    ("POST", "/api/v1/store/boost", {"minutes": 30}),
    ("POST", "/api/v1/mode", {"mode": "auto"}),
    ("POST", "/api/v1/settings", {"demand_mode": "comfort"}),
    ("POST", "/api/v1/people/{person}/away", {"until": "2026-11-25T18:00"}),
    ("POST", "/api/v1/people/{person}/home", {}),
]

# Requests only an admin may make.
ADMIN_CALLS = [
    ("GET", "/api/v1/settings/config", None),
    ("PUT", "/api/v1/settings/config", {"values": {"boiler.min_burn_min": 9}}),
    ("DELETE", "/api/v1/settings/config", None),
    ("DELETE", "/api/v1/settings/config/boiler", None),
    ("POST", "/api/v1/learning/reset", {}),
    ("DELETE", "/api/v1/household", None),
    ("PUT", "/api/v1/layout", {"floors": ["Ground"], "rooms": {}}),
    ("POST", "/api/v1/devices/scan", {}),
    ("POST", "/api/v1/people/{person}/presence", {"state": "home"}),
    ("POST", "/api/v1/ha/persons", {"persons": []}),
    ("POST", "/api/v1/outdoor", {"temperature_c": 5}),
]

READS = [
    "/api/v1/house",
    "/api/v1/state",
    "/api/v1/people",
    "/api/v1/schedules",
    "/api/v1/household",
    "/api/v1/settings",
    "/api/v1/layout",
    "/api/v1/suggestions",
    "/api/v1/savings",
]


def person(c: TestClient) -> str:
    return c.rt.setup.site.household.people[0].id


async def call(c, method, path, body, headers):
    path = path.replace("{person}", person(c))
    return await c.request(method, path, json=body, headers=headers)


async def test_household_does_day_to_day_control(server):
    h = await as_user(server, "sam", HOME_PW)
    for path in READS:
        assert (await server.get(path)).status == 200, path
    for method, path, body in HOUSEHOLD_CALLS:
        r = await call(server, method, path, body, h)
        assert r.status == 200, (path, r.status, await r.text())


async def test_household_is_refused_setup_and_settings(server):
    h = await as_user(server, "sam", HOME_PW)
    for method, path, body in ADMIN_CALLS:
        r = await call(server, method, path, body, h)
        assert r.status == 403, path
        assert await r.json() == {"error": "household", "needs": "admin"}, path


async def test_household_changes_only_demand_mode_in_runtime_settings(server):
    h = await as_user(server, "sam", HOME_PW)
    r = await server.post("/api/v1/settings", json={"learning": True}, headers=h)
    assert r.status == 403 and (await r.json())["needs"] == "admin"
    # An admin is told the key is unknown, as before.
    h = await as_user(server, "alex", ADMIN_PW)
    r = await server.post("/api/v1/settings", json={"learning": True}, headers=h)
    assert r.status == 400


async def test_household_saves_room_adjustments_but_not_the_setup(server):
    h = await as_user(server, "sam", HOME_PW)
    section = (await (await server.get("/api/v1/household")).json())["household"]
    late = {"days": ["mon", "tue"], "keep": "warm", "from": "22:30", "to": "23:00"}
    adjusted = copy.deepcopy(section)
    adjusted["rooms"]["kitchen"]["adjust"] = [late]
    r = await server.post("/api/v1/household/preview", json={"household": adjusted}, headers=h)
    assert r.status == 200
    r = await server.put("/api/v1/household", json={"household": adjusted}, headers=h)
    assert r.status == 200, await r.text()
    saved = (await r.json())["household"]
    assert saved["rooms"]["kitchen"]["adjust"] == [late]
    # Anything else in the household is the admin's: a room's use, a temperature.
    for change in (
        lambda s: s["rooms"]["kitchen"].update(use="unused"),
        lambda s: s.setdefault("temperatures", {}).update(in_use=23),
    ):
        draft = copy.deepcopy(saved)
        change(draft)
        r = await server.put("/api/v1/household", json={"household": draft}, headers=h)
        assert r.status == 403 and await r.json() == {"error": "household", "needs": "admin"}
    # Taking the adjustment away again is still only an adjustment.
    del saved["rooms"]["kitchen"]["adjust"]
    r = await server.put("/api/v1/household", json={"household": saved}, headers=h)
    assert r.status == 200
    # An admin may change the rest.
    h = await as_user(server, "alex", ADMIN_PW)
    draft = copy.deepcopy(saved)
    draft["rooms"]["kitchen"]["use"] = "unused"
    r = await server.put("/api/v1/household", json={"household": draft}, headers=h)
    assert r.status == 200


async def test_viewer_changes_nothing(server):
    h = await as_user(server, "kit", VIEW_PW)
    for path in READS:
        assert (await server.get(path)).status == 200, path
    for method, path, body in HOUSEHOLD_CALLS:
        r = await call(server, method, path, body, h)
        assert r.status == 403 and await r.json() == {"error": "viewer", "needs": "household"}
    section = (await (await server.get("/api/v1/household")).json())["household"]
    r = await server.put("/api/v1/household", json={"household": section}, headers=h)
    assert r.status == 403
    for method, path, body in ADMIN_CALLS:
        r = await call(server, method, path, body, h)
        assert r.status == 403, path
    assert (await server.post("/api/v1/auth/logout", headers=h)).status == 200


async def test_admin_token_and_csrf_unchanged(server):
    # Every role still needs the CSRF header for a change.
    await as_user(server, "sam", HOME_PW)
    r = await server.post("/api/v1/store/boost", json={"minutes": 30})
    assert r.status == 403 and await r.json() == {"error": "csrf"}
    # The token is admin, with no session involved.
    server.session.cookie_jar.clear()
    r = await server.post("/api/v1/learning/reset", json={}, headers=TOKEN)
    assert r.status == 200
    # Unknown API paths still need someone signed in before they are told 404.
    assert (await server.get("/api/v1/nothing-here")).status == 401
    assert (await server.get("/api/v1/nothing-here", headers=TOKEN)).status == 404


async def test_a_route_missing_from_the_table_needs_an_admin(tmp_path):
    rt = make(tmp_path)
    accounts = Accounts(Store(":memory:").db)
    accounts.add_user("sam", HOME_PW, "household")
    app = create_app(rt, token="secret", login=AuthService(AuthConfig(enabled=True), accounts))

    async def new_route(_):
        return web.json_response({"ok": True})

    app.router.add_get("/api/v1/brand-new", new_route)
    async with TestClient(TestServer(app)) as c:
        await as_user(c, "sam", HOME_PW)
        r = await c.get("/api/v1/brand-new")
        assert r.status == 403 and await r.json() == {"error": "household", "needs": "admin"}
        c.session.cookie_jar.clear()
        assert (await c.get("/api/v1/brand-new", headers=TOKEN)).status == 200
