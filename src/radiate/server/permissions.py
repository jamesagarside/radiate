"""Who may call each route: one table, read by the server's middleware (ADR-0006).

Every route the app serves has an entry here, keyed by method and the route's
pattern as aiohttp registers it (`/api/v1/rooms/{room_id}/setpoint`). The value is
the lowest role that may call it: `viewer` (shown as "Read only" in the web UI) <
`household` < `admin`, or `public` for a route that answers without signing in.
`tests/server/test_permissions.py` fails for a route with no entry, so a new route
can't default open; and if one slipped through, the middleware treats it as admin.

The Bearer token, Home Assistant ingress and an install with login and the token both
off are admin, so the table only ever narrows what a signed-in person may do.
"""

from __future__ import annotations

from aiohttp import web

from radiate.config.auth import role_at_least

PUBLIC = "public"
VIEWER = "viewer"
HOUSEHOLD = "household"
ADMIN = "admin"

# The runtime settings (`POST /api/v1/settings`) the household role may change. Any
# other key a future change adds needs an admin until it is listed here.
HOUSEHOLD_SETTINGS = frozenset({"demand_mode"})

PERMISSIONS: dict[tuple[str, str], str] = {
    # Open to anyone: the health check, how to sign in, and signing in.
    ("GET", "/api/v1/health"): PUBLIC,
    ("GET", "/api/v1/auth/config"): PUBLIC,
    ("POST", "/api/v1/auth/login"): PUBLIC,
    # The stream checks its own: a session at the upgrade, or the token as its first
    # message. Every role may watch it.
    ("GET", "/api/v1/stream"): PUBLIC,
    # Who am I, and signing out: anyone signed in.
    ("GET", "/api/v1/auth/me"): VIEWER,
    ("POST", "/api/v1/auth/logout"): VIEWER,
    # Reading: every role sees every view.
    ("GET", "/api/v1/house"): VIEWER,
    ("GET", "/api/v1/state"): VIEWER,
    ("GET", "/api/v1/decisions"): VIEWER,
    ("GET", "/api/v1/people"): VIEWER,
    ("GET", "/api/v1/schedules"): VIEWER,
    ("GET", "/api/v1/suggestions"): VIEWER,
    ("GET", "/api/v1/savings"): VIEWER,
    ("GET", "/api/v1/data"): VIEWER,
    ("GET", "/api/v1/data/series"): VIEWER,
    ("GET", "/api/v1/export"): VIEWER,
    ("GET", "/api/v1/household"): VIEWER,
    ("GET", "/api/v1/settings"): VIEWER,
    ("GET", "/api/v1/layout"): VIEWER,
    ("GET", "/api/v1/devices"): VIEWER,
    ("GET", "/api/v1/ha/dashboard"): VIEWER,  # device names, as GET devices shows
    # Every house-file setting, with device addresses, broker and provider details:
    # only the people who may change them read them.
    ("GET", "/api/v1/settings/config"): ADMIN,
    # Day-to-day control: the household role.
    ("POST", "/api/v1/rooms/{room_id}/setpoint"): HOUSEHOLD,
    ("POST", "/api/v1/rooms/{room_id}/fire"): HOUSEHOLD,
    ("POST", "/api/v1/store/boost"): HOUSEHOLD,
    ("POST", "/api/v1/people/{person_id}/away"): HOUSEHOLD,
    ("POST", "/api/v1/people/{person_id}/home"): HOUSEHOLD,
    ("POST", "/api/v1/mode"): HOUSEHOLD,  # auto, frost or off: what a thermostat offers
    ("POST", "/api/v1/settings"): HOUSEHOLD,  # demand mode only: HOUSEHOLD_SETTINGS
    ("POST", "/api/v1/household/preview"): HOUSEHOLD,  # saves nothing
    ("PUT", "/api/v1/household"): HOUSEHOLD,  # room adjustments only; the rest is admin
    # Setup, the whole house and machine reports: admin.
    ("POST", "/api/v1/learning/reset"): ADMIN,
    ("DELETE", "/api/v1/household"): ADMIN,
    ("POST", "/api/v1/people/{person_id}/presence"): ADMIN,  # from Home Assistant
    ("POST", "/api/v1/ha/persons"): ADMIN,  # from Home Assistant
    ("POST", "/api/v1/outdoor"): ADMIN,  # from Home Assistant
    ("PUT", "/api/v1/settings/config"): ADMIN,
    ("DELETE", "/api/v1/settings/config"): ADMIN,
    ("DELETE", "/api/v1/settings/config/{target}"): ADMIN,
    ("PUT", "/api/v1/layout"): ADMIN,
    ("POST", "/api/v1/devices/scan"): ADMIN,
    # The security log (ADR-0008): who signed in, from where, and what was refused.
    ("GET", "/api/v1/audit"): ADMIN,
    # Outside /api/: the pages, their files and the single sign-on flows. Public, as
    # the page itself asks the API who is signed in.
    ("GET", "/"): PUBLIC,
    ("GET", "/login"): PUBLIC,
    ("GET", "/static"): PUBLIC,
    ("GET", "/auth/oidc/start"): PUBLIC,
    ("GET", "/auth/oidc/callback"): PUBLIC,
    ("GET", "/auth/saml/start"): PUBLIC,
    ("POST", "/auth/saml/acs"): PUBLIC,
    ("GET", "/auth/saml/metadata"): PUBLIC,
}


def route_key(route: web.AbstractRoute) -> tuple[str, str] | None:
    """The table key for a registered route, or None for aiohttp's own system routes.

    HEAD is answered as GET (aiohttp adds a HEAD route beside every GET).
    """
    resource = route.resource
    if resource is None:
        return None
    method = "GET" if route.method == "HEAD" else route.method
    return method, resource.canonical


def needed_role(request: web.Request) -> str:
    """The lowest role that may make this request.

    A path or method no route matches needs a signed-in person (any role) before it is
    told 404 or 405, as before. A matched route missing from the table needs an admin.
    """
    match = request.match_info
    if match.http_exception is not None:
        return VIEWER
    key = route_key(match.route)
    if key is None:
        return VIEWER
    return PERMISSIONS.get(key, ADMIN)


def allowed(role: str, needed: str) -> bool:
    return needed == PUBLIC or role_at_least(role, needed)
