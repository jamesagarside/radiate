"""Household setup from the web UI: read the setup, preview a draft, save it, revert it.

The web UI's setup wizard sends a draft `household` section, in the same form as the
house file's (`docs/configuration.md#household`), as JSON. It is checked with the same
parser and limits as the house file (`radiate.config.site.parse_household`), and each
problem comes back with its path, such as `household.people.sam.weekdays.up`, so the
UI can show it next to the right answer.

Saving never touches the house file. The household goes to `<data_dir>/household.yaml`
(`radiate.config.saved`) and replaces the house file's `household` section, here and
in `radiate check-config` and `radiate schedules` given the same data directory.
Reverting deletes it, so the house file's setup applies again. Either way the
household is compiled again for the people away now and handed to the driver, as a
change of who is away is. Dry run is unchanged: the schedule mirror logs the new weeks.

Transport-free, like `bridge`: the browser demo keeps its saved household in memory.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

from radiate.config.household import (
    DAMP_BELOW_C,
    defaults_view,
    household_advice,
    household_section,
    limits_view,
    options_view,
)
from radiate.config.schedule import WeekSchedule
from radiate.config.site import ConfigError, SiteConfig, apply_household, parse_household

from .runtime import Runtime
from .schedules import _weekday, preview_view


class SetupError(Exception):
    """A request the setup rejects: `status` is the HTTP status, `body` the JSON."""

    def __init__(self, status: int, body: dict) -> None:
        super().__init__(body.get("message", ""))
        self.status = status
        self.body = body


class Saved(Protocol):
    """Where a household saved from the web UI lives."""

    where: str | None  # shown in the UI, such as "/data/household.yaml"

    def write(self, section: dict) -> None: ...

    def delete(self) -> None: ...


class SavedFile:
    """`<data_dir>/household.yaml`, written atomically."""

    def __init__(self, data_dir: str) -> None:
        from radiate.config.saved import saved_path

        self.data_dir = data_dir
        self.where = str(saved_path(data_dir))

    def write(self, section: dict) -> None:
        from radiate.config.saved import write_saved

        write_saved(self.data_dir, section)

    def delete(self) -> None:
        from radiate.config.saved import delete_saved

        delete_saved(self.data_dir)


class SavedMemory:
    """Kept in memory only: the browser demo and tests."""

    where = None

    def __init__(self) -> None:
        self.section: dict | None = None

    def write(self, section: dict) -> None:
        self.section = section

    def delete(self) -> None:
        self.section = None


@dataclass
class HouseholdSetup:
    """The site the setup checks drafts against, and where it saves them.

    `site` is the house as loaded, with any saved household applied; `file_household`
    on it is the house file's own, for reverting.
    """

    site: SiteConfig
    saved: Saved = field(default_factory=SavedMemory)

    # --- requests ------------------------------------------------------------------------

    def view(self, rt: Runtime | None = None) -> dict:
        """`GET household`: the setup in use and everything the wizard needs."""
        site = self.site
        return {
            # The `person` entities Home Assistant last reported, to link people to:
            # {"persons": [{"entity_id", "name"}], "reported_at"}, or None without a
            # report (no integration, or one too old to send it).
            "ha_persons": rt.ha_persons_view() if rt is not None else None,
            # Where the household in use comes from: "saved" (this setup), "house_file"
            # or None (no household yet).
            "source": site.household_source,
            "house_file": site.file_household is not None,
            "saved_at": self.saved.where,
            # A saved setup that could not be used at start-up, and why.
            "saved_problems": [_problem(p) for p in site.saved_problems],
            "household": household_section(site.household) if site.household else None,
            "defaults": defaults_view(),
            "limits": limits_view(),
            "options": options_view(),
            "damp_below_c": DAMP_BELOW_C,
            "rooms": [
                {
                    "id": rc.id,
                    "name": rc.name,
                    # The room's schedule in the house file, used when the household
                    # leaves it out. None: the household must include it.
                    "schedule": site.room_schedules.get(rc.id),
                    "heat_source": rc.heat_source.value if rc.heat_source else None,
                }
                for rc in site.house.rooms
                if rc.controllable
            ],
        }

    def preview(self, rt: Runtime, body: Any) -> dict:
        """`POST household/preview`: compile a draft without saving it.

        The same shape as `GET schedules`, plus `errors` (each with its `path`) and
        `notes` (advice that is not an error, also with a path). With errors, `rooms`
        is empty.
        """
        try:
            household = parse_household(_section(body), self.site)
        except ConfigError as err:
            return {**_empty(rt), "errors": [_problem(p) for p in err.problems], "notes": []}
        view = preview_view(rt, household, self._own())
        notes = [{"path": p, "message": m} for p, m in household_advice(household)]
        return {**view, "errors": [], "notes": notes}

    def save(self, rt: Runtime, body: Any) -> dict:
        """`PUT household`: check, save, then use the draft from now on."""
        try:
            household = parse_household(_section(body), self.site)
        except ConfigError as err:
            raise SetupError(400, {"errors": [_problem(p) for p in err.problems]}) from None
        try:
            self.saved.write(household_section(household))
        except OSError as err:
            raise SetupError(
                500, {"message": f"Can't write {self.saved.where}: {err.strerror}"}
            ) from None
        self._use(rt, apply_household(self.site, household, "saved"))
        return self.view(rt)

    def revert(self, rt: Runtime) -> dict:
        """`DELETE household`: forget the saved setup and use the house file's again."""
        try:
            self.saved.delete()
        except OSError as err:
            raise SetupError(
                500, {"message": f"Can't delete {self.saved.where}: {err.strerror}"}
            ) from None
        self._use(rt, apply_household(self.site, self.site.file_household, "house_file"))
        return self.view(rt)

    # --- helpers -------------------------------------------------------------------------

    def _use(self, rt: Runtime, site: SiteConfig) -> None:
        self.site = site
        replace = getattr(rt.driver, "replace_household", None)
        if callable(replace):
            replace(site)
        rt.set_household(site.household)

    def _own(self) -> dict[str, tuple[str, WeekSchedule]]:
        out = {}
        for rid, name in self.site.room_schedules.items():
            if name is not None and name in self.site.schedules:
                out[rid] = (name, self.site.schedules[name])
        return out


def _section(body: Any) -> Any:
    if not isinstance(body, dict) or "household" not in body:
        raise SetupError(400, {"message": "expected an object with a household section"})
    return body["household"]


def _problem(text: str) -> dict:
    """Split "household.people.sam.weekdays.up: required" into a path and a message."""
    path, sep, message = text.partition(": ")
    return {"path": path, "message": message} if sep else {"path": "", "message": text}


def _empty(rt: Runtime) -> dict:
    return {
        "now": {"weekday": _weekday(rt), "minute": rt.driver.wall_minutes()},
        "levels": None,
        "frost": False,
        "rooms": [],
    }
