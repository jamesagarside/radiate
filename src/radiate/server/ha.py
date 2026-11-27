"""Home Assistant help for the web UI: the dashboard, and whether the integration reports.

`GET /api/v1/ha/dashboard` builds the same Lovelace dashboard as `radiate dashboard`
(`radiate.export.dashboard`) from the house the server runs, so someone running the
Home Assistant App, who has no command line, can copy it from the Settings view. The
query takes `hours` (the live window, 1 to 336), `radiate` (`false` for Zigbee2MQTT
entities only) and `title`.

With it comes when the Radiate integration last reported to this server. radiate-ha
posts Home Assistant's `person` entities (`POST /api/v1/ha/persons`) when it starts and
every 15 minutes, so a report older than about half an hour means it has stopped.

Transport-free, like `bridge`: the browser demo answers it too.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from radiate.config.away import local_iso
from radiate.export.dashboard import DEFAULT_HOURS, MAX_HOURS, dashboard_yaml

from .runtime import Runtime

TITLE_MAX = 60
# radiate-ha reports every 15 minutes: two missed reports and it counts as quiet.
INTEGRATION_QUIET_S = 35 * 60


class DashboardQueryError(ValueError):
    """A query the dashboard refuses, with the reason to show."""


def _hours(raw: Any) -> int:
    if raw in (None, ""):
        return DEFAULT_HOURS
    try:
        hours = int(str(raw))
    except ValueError:
        raise DashboardQueryError("hours must be a whole number") from None
    if not 1 <= hours <= MAX_HOURS:
        raise DashboardQueryError(f"hours must be between 1 and {MAX_HOURS}")
    return hours


def _flag(raw: Any) -> bool:
    if raw in (None, ""):
        return True
    text = str(raw).lower()
    if text in ("1", "true", "yes"):
        return True
    if text in ("0", "false", "no"):
        return False
    raise DashboardQueryError("radiate must be true or false")


def _title(raw: Any) -> str:
    title = " ".join(str(raw or "").split()) or "Heating"
    if len(title) > TITLE_MAX:
        raise DashboardQueryError(f"title must be at most {TITLE_MAX} characters")
    return title


def integration_view(rt: Runtime) -> dict:
    """When radiate-ha last reported, and whether that is recent enough to count."""
    at = getattr(rt, "ha_persons_at", None)
    if at is None:
        return {"reported_at": None, "reporting": False}
    return {
        "reported_at": local_iso(at, rt.timezone),
        "reporting": rt.wall() - at <= INTEGRATION_QUIET_S,
    }


def dashboard_view(rt: Runtime, query: Mapping[str, Any]) -> dict:
    """`GET ha/dashboard`: the dashboard as YAML, what it was built with, and the
    integration's last report. Raises DashboardQueryError for a bad query, and
    LookupError when the server has no house configuration to build it from."""
    hours = _hours(query.get("hours"))
    radiate = _flag(query.get("radiate"))
    title = _title(query.get("title"))
    site = getattr(getattr(rt, "setup", None), "site", None)
    if site is None:
        raise LookupError("no house configuration to build a dashboard from")
    people = site.household.people if site.household else ()
    return {
        "yaml": dashboard_yaml(site, title, hours, radiate),
        "title": title,
        "hours": hours,
        "radiate": radiate,
        "rooms": len(site.house.rooms),
        "people": len(people) if radiate else 0,
        "integration": integration_view(rt),
    }
