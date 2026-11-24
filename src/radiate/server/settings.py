"""Settings from the web UI: read every house-file setting, change some, revert them.

Every setting the house file can hold is described once in `radiate.config.settings`.
The Settings view shows each one with its value and where that value comes from: the
house file, the web UI (saved settings) or the default. Changes are saved to
`<data_dir>/settings.yaml` (`radiate.config.saved`), never to the house file, which may
be read-only. They are checked by the house file's own parser before they are saved:
the saved settings are laid over the house file and the result must load.

Settings marked `restart=False` in the registry are used straight away
(`apply_live`); the rest wait for the next start, and the view says which are waiting.
A change that can make Radiate write to the boiler or valves (`hardware=True`, such as
dry run, the relay's host or a room's actuate) is refused with 409 unless the request
says `"confirm": true`, so the web UI asks first.

Secrets are write-only: the view says whether one is set, never its value.

Transport-free, like `bridge`: the browser demo keeps its saved settings in memory.
"""

from __future__ import annotations

import dataclasses
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, Protocol

from radiate.config.household import household_section
from radiate.config.settings import (
    SECTIONS,
    Section,
    field_view,
    flatten,
    lookup,
    merge_settings,
    nest,
    problem_path,
    room_ids,
    setting_for,
)
from radiate.config.site import ConfigError, SiteConfig, parse_household, parse_with_settings

from .runtime import Runtime


class SettingsError(Exception):
    """A request the settings refuse: `status` is the HTTP status, `body` the JSON."""

    def __init__(self, status: int, body: dict) -> None:
        super().__init__(body.get("message", ""))
        self.status = status
        self.body = body


class SettingsStore(Protocol):
    """Where the settings saved from the web UI live."""

    where: str | None  # shown in the UI, such as "/data/settings.yaml"

    def write(self, settings: dict) -> None: ...

    def delete(self) -> None: ...


class SettingsFile:
    """`<data_dir>/settings.yaml`, written atomically."""

    def __init__(self, data_dir: str) -> None:
        from radiate.config.saved import settings_path

        self.data_dir = data_dir
        self.where = str(settings_path(data_dir))

    def write(self, settings: dict) -> None:
        from radiate.config.saved import write_settings

        write_settings(self.data_dir, settings)

    def delete(self) -> None:
        from radiate.config.saved import delete_settings

        delete_settings(self.data_dir)


class SettingsMemory:
    """Kept in memory only: the browser demo and tests."""

    where = None

    def __init__(self) -> None:
        self.settings: dict | None = None

    def write(self, settings: dict) -> None:
        self.settings = settings

    def delete(self) -> None:
        self.settings = None


LiveHook = Callable[[Runtime, SiteConfig], None]
LIVE_HOOKS: list[LiveHook] = []


def register_live(hook: LiveHook) -> LiveHook:
    """Run `hook(runtime, site)` after every saved change, to use a section's
    `restart=False` settings straight away. `site` is the whole configuration with the
    change. Usable as a decorator."""
    LIVE_HOOKS.append(hook)
    return hook


def apply_live(rt: Runtime, site: SiteConfig) -> None:
    """Use the settings the registry marks `restart=False` from now on.

    Only these parts of the running configuration change; rooms, devices, the relay
    and MQTT stay as they started until a restart.
    """
    cfg, new = rt.cfg, site.house
    rt.cfg = dataclasses.replace(
        cfg,
        boiler=new.boiler,
        store=new.store,
        suggestions=new.suggestions,
        balancing=new.balancing,
        learning=dataclasses.replace(
            cfg.learning, learn_on_trv_fallback=new.learning.learn_on_trv_fallback
        ),
    )
    rt.fire_flag_max_s = site.fire_flag_s
    rt.outdoor_source = site.outdoor_source
    rt.outdoor_stale_after_s = site.outdoor_stale_after_s
    hook = getattr(rt.driver, "replace_settings", None)
    if callable(hook):
        hook(rt.cfg, site)
    for live in LIVE_HOOKS:
        live(rt, site)


@dataclass
class SettingsEditor:
    """The house file, the settings saved over it, and what is running now.

    `file_raw` is the house file as read; `saved` the settings saved from the web UI,
    as {path: value}. `running` holds each setting's value as Radiate started with it,
    so the view can say which saved changes wait for a restart. `locked` names
    settings the command line fixes, with why (`--dry-run`).
    """

    file_raw: dict
    store: SettingsStore = field(default_factory=SettingsMemory)
    saved: dict[str, Any] = field(default_factory=dict)
    env: dict[str, str] | None = None
    locked: dict[str, str] = field(default_factory=dict)
    # Why the saved settings were not used at start-up, if they were not.
    problems: list[str] = field(default_factory=list)
    running: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def start(
        cls,
        file_raw: Any,
        store: SettingsStore,
        saved: Any = None,
        env: dict[str, str] | None = None,
        locked: dict[str, str] | None = None,
        problems: tuple[str, ...] | list[str] = (),
    ) -> SettingsEditor:
        """`saved` is the nested saved settings (`read_settings`); with `problems` they
        were not used at start-up, so the house file's values are the ones running."""
        flat, more = flatten(saved)
        raw = file_raw if isinstance(file_raw, dict) else {}
        editor = cls(
            raw,
            store,
            flat,
            env,
            dict(locked or {}),
            [*problems, *[p for p in more if p not in problems]],
        )
        running_raw = raw if editor.problems else editor._merged(flat)
        editor.running = editor._values(running_raw)
        return editor

    # --- requests ------------------------------------------------------------------------

    def view(self) -> dict:
        """`GET settings/config`: every setting, its value and where it comes from."""
        merged = self._merged(self.saved)
        values = self._values(merged)
        sections = []
        for sec in SECTIONS:
            out: dict[str, Any] = {
                "id": sec.id,
                "title": sec.title,
                "help": sec.help,
                "guide": sec.guide,
                "link": sec.link,
                "per_room": sec.per_room,
            }
            if sec.per_room:
                out["rooms"] = [
                    {
                        "id": rid,
                        "name": self._room_name(merged, rid),
                        "fields": [
                            self._field(sec, s, f"rooms.{rid}.{s.path}", values)
                            for s in sec.settings
                        ],
                    }
                    for rid in room_ids(self.file_raw)
                ]
            else:
                out["fields"] = [self._field(sec, s, s.path, values) for s in sec.settings]
            sections.append(out)
        pending = [p for p, v in values.items() if _restart(p) and self.running.get(p) != v]
        return {
            "saved_at": self.store.where,
            "saved": sorted(self.saved),
            "problems": [_problem(p, self.file_raw) for p in self.problems],
            "pending_restart": pending,
            "sections": sections,
        }

    def save(self, rt: Runtime, body: Any) -> dict:
        """`PUT settings/config`: `{"values": {path: value}, "confirm": bool}`.

        Checks the values with the house file's parser, saves them and applies those
        that can be applied live. A value of null means not set: the default applies.
        """
        if not isinstance(body, dict) or not isinstance(body.get("values"), dict):
            raise SettingsError(400, {"message": "expected an object with values"})
        values = body["values"]
        if not values:
            raise SettingsError(400, {"message": "values is empty"})
        errors = []
        clean: dict[str, Any] = {}
        ids = set(room_ids(self.file_raw))
        for path, value in values.items():
            problem = self._check(str(path), value, ids)
            if problem:
                errors.append({"path": str(path), "message": problem})
            else:
                clean[str(path)] = _normalise(str(path), value)
        if errors:
            raise SettingsError(400, {"message": "Some settings were not saved.", "errors": errors})
        return self._commit(rt, {**self.saved, **clean}, body)

    def revert(self, rt: Runtime, target: str | None, body: Any = None) -> dict:
        """`DELETE settings/config[/<target>]`: go back to the house file's value.

        `target` is a setting's path, a section id, `rooms.<id>` for one room, or None
        for every saved setting.
        """
        if target is None:
            drop = set(self.saved)
        elif setting_for(target) is not None:
            drop = {target}
        elif target.startswith("rooms.") and target.count(".") == 1:
            drop = {p for p in self.saved if p.startswith(f"{target}.")}
            if target[6:] not in room_ids(self.file_raw):
                raise SettingsError(404, {"message": f"unknown room {target[6:]!r}"})
        elif any(sec.id == target for sec in SECTIONS):
            drop = {p for p in self.saved if _section_id(p) == target}
        else:
            raise SettingsError(404, {"message": f"unknown setting {target!r}"})
        if target is not None and target in self.locked:
            raise SettingsError(400, {"message": self.locked[target]})
        flat = {p: v for p, v in self.saved.items() if p not in drop}
        return self._commit(rt, flat, body if isinstance(body, dict) else {})

    # --- helpers -------------------------------------------------------------------------

    def _commit(self, rt: Runtime, flat: dict[str, Any], body: dict) -> dict:
        before = self._values(self._merged(self.saved))
        after = self._values(self._merged(flat))
        changed = [p for p in after if before.get(p) != after.get(p)]
        hardware = [p for p in changed if _hardware(p)]
        if hardware and body.get("confirm") is not True:
            raise SettingsError(
                409,
                {
                    "message": "These changes can make Radiate write to the boiler or "
                    "valves. Send confirm: true to save them.",
                    "confirm": hardware,
                },
            )
        try:
            site, merged = parse_with_settings(self.file_raw, flat, self.env)
            self._check_household(rt, site)
        except ConfigError as err:
            raise SettingsError(
                400,
                {
                    "message": "Not saved: the house would not load with these settings.",
                    "errors": [_problem(p, self._merged(flat)) for p in err.problems],
                },
            ) from None
        try:
            if flat:
                self.store.write(nest(flat))
            else:
                self.store.delete()
        except OSError as err:
            raise SettingsError(
                500, {"message": f"Can't write {self.store.where}: {err.strerror}"}
            ) from None
        self.saved = flat
        self.problems = []
        live = [p for p in changed if not _restart(p)]
        if live:
            apply_live(rt, site)
        for p in live:
            self.running[p] = after.get(p)
        view = self.view()
        view["applied"] = live
        view["restart"] = [p for p in changed if _restart(p)]
        return view

    def _check_household(self, rt: Runtime, site: SiteConfig) -> None:
        """A household saved from the web UI must still fit the house: a room it uses
        can't stop having a valve, say. The house file's own is checked by the parser."""
        setup = getattr(rt, "setup", None)
        current = getattr(setup, "site", None)
        if current is None or current.household_source != "saved" or not current.household:
            return
        try:
            parse_household(household_section(current.household), site)
        except ConfigError as err:
            raise ConfigError(
                [f"{p} (the household saved in the household setup)" for p in err.problems]
            ) from None

    def _check(self, path: str, value: Any, ids: set[str]) -> str | None:
        found = setting_for(path)
        if found is None:
            return "unknown setting"
        _, s = found
        if not s.editable:
            return "only the house file can set this"
        if path in self.locked:
            return self.locked[path]
        if path.startswith("rooms.") and path.split(".")[1] not in ids:
            return "no room with this id in the house file"
        if value is None:
            return None
        if s.kind == "bool" and not isinstance(value, bool):
            return "must be true or false"
        if s.kind in ("number", "integer") and (
            isinstance(value, bool) or not isinstance(value, (int, float))
        ):
            return "must be a number"
        if s.kind == "integer" and value != int(value):
            return "must be a whole number"
        if s.kind in ("text", "secret", "choice") and not isinstance(value, str):
            return "must be text"
        if s.kind == "choice" and value and s.choices and value not in s.choices:
            return "must be " + ", ".join(s.choices)
        if s.kind == "list" and (
            not isinstance(value, list) or not all(isinstance(v, str) for v in value)
        ):
            return "must be a list of text"
        if s.kind == "use" and not isinstance(value, (str, dict)):
            return "must be in_use, occasional or unused, or weekdays and weekend"
        return None

    def _merged(self, flat: dict[str, Any]) -> dict:
        merged, _ = merge_settings(self.file_raw, flat)
        return merged

    def _values(self, raw: dict) -> dict[str, Any]:
        """Each setting's effective house-file value in `raw`: the default when unset."""
        from radiate.config.settings import settings_paths

        out = {}
        for path in settings_paths(room_ids(self.file_raw)):
            present, value = lookup(raw, path)
            out[path] = value if present else setting_for(path)[1].default
        return out

    def _field(self, sec: Section, s: Any, path: str, values: dict[str, Any]) -> dict:
        out = field_view(sec, s, path, self.file_raw, self.saved, self.running, values[path])
        if path in self.locked:
            out["locked"] = self.locked[path]
        return out

    @staticmethod
    def _room_name(merged: dict, rid: str) -> str:
        present, name = lookup(merged, f"rooms.{rid}.name")
        return str(name) if present else rid.replace("_", " ").capitalize()


def _restart(path: str) -> bool:
    found = setting_for(path)
    return found is None or found[1].restart


def _hardware(path: str) -> bool:
    found = setting_for(path)
    return found is not None and found[1].hardware


def _section_id(path: str) -> str | None:
    found = setting_for(path)
    return found[0].id if found else None


def _normalise(path: str, value: Any) -> Any:
    """Empty text means not set, as in the house file."""
    if isinstance(value, str) and not value.strip():
        return None
    if isinstance(value, str):
        return value.strip()
    return value


def _problem(text: str, raw: Any) -> dict:
    path, message = problem_path(text, raw)
    return {"path": path, "message": message}
