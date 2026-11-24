"""The settings registry and settings saved from the web UI (radiate.config.settings).

The registry must describe every key the house file can hold, so the Settings view
shows them all: adding a key to the parser without a registry entry fails here.
"""

import copy
import re
from pathlib import Path

import pytest
import yaml

from radiate.config import ConfigError, load_site, parse_site
from radiate.config import site as site_module
from radiate.config.saved import read_settings, settings_path, write_settings
from radiate.config.settings import (
    SECTIONS,
    Section,
    Setting,
    flatten,
    lookup,
    merge_settings,
    nest,
    problem_path,
    register_section,
    setting_for,
)

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
DASHES = re.compile("[–—]")


def minimal(**over) -> dict:
    data = {
        "mqtt": {"host": "broker"},
        "schedules": {"default": "00:00/16 07:00/20 22:00/16"},
        "rooms": [
            {"id": "a", "trv": "trv_a", "sensor": "t_a"},
            {"id": "b", "trv": "trv_b", "sensor": "t_b"},
            {"id": "hall", "role": "passive", "sensor": "t_hall"},
        ],
    }
    data.update(over)
    return data


def every_section() -> dict:
    """The reference house with every optional section present, so the parser checks
    the keys of each one."""
    data = yaml.safe_load(EXAMPLE.read_text())
    for key in ("trv", "learning", "monitoring", "suggestions", "store", "boiler"):
        data.setdefault(key, {})
    return data


def house_file_keys() -> set[str]:
    """Every key the parser accepts, as dotted paths (`rooms.*.trv` for a room's), from
    the allowed sets it checks unknown keys against."""
    seen: set[str] = set()
    real = site_module._Ctx.unknown

    def record(self, data, allowed, path):
        prefix = re.sub(r"^rooms\[\d+\]\.", "rooms.*.", path)
        seen.update(f"{prefix}{k}" for k in allowed)
        return real(self, data, allowed, path)

    site_module._Ctx.unknown = record
    try:
        parse_site(every_section(), ENV)
    finally:
        site_module._Ctx.unknown = real
    return seen


def covered(path: str) -> bool:
    for sec in SECTIONS:
        if any(path == c or path.startswith(f"{c}.") for c in sec.covers if c != "rooms"):
            return True
    if path.startswith("rooms.*."):
        return setting_for(f"rooms.x.{path[8:]}") is not None or path == "rooms.*.id"
    if setting_for(path) is not None:
        return True
    # A top-level key: some setting sits under it, or a section covers it.
    return any(
        s.path.startswith(f"{path}.") for sec in SECTIONS if not sec.per_room for s in sec.settings
    ) or any(path in sec.covers for sec in SECTIONS)


def test_every_house_file_key_has_a_settings_entry():
    keys = house_file_keys()
    assert "boiler.damp_margin_k" in keys and "rooms.*.use" in keys  # the recorder works
    missing = sorted(k for k in keys if not covered(k))
    assert not missing, (
        f"house-file keys with no entry in radiate.config.settings.SECTIONS: {missing}. "
        "Add a Setting for each so the web UI's Settings view shows it."
    )


def test_every_settings_entry_is_a_house_file_key():
    keys = house_file_keys()
    for sec in SECTIONS:
        for s in sec.settings:
            path = f"rooms.*.{s.path}" if sec.per_room else s.path
            assert path in keys, f"{path} is in the registry but the house file has no such key"


def test_defaults_are_what_the_parser_uses():
    """Setting a key to its registry default changes nothing."""

    def house() -> dict:
        return minimal(shelly={"host": "192.0.2.10"})

    base = parse_site(house(), {})
    for sec in SECTIONS:
        for s in sec.settings:
            if s.default is None or not s.editable or s.secret or lookup(house(), s.path)[0]:
                continue
            if sec.per_room:
                data = house()
                data["rooms"][0][s.path] = s.default
            else:
                data, _ = merge_settings(house(), {s.path: s.default})
            assert parse_site(data, {}) == base, s.path


def test_registry_is_well_formed():
    paths = set()
    for sec in SECTIONS:
        assert sec.settings or sec.link, sec.id
        for s in sec.settings:
            full = f"rooms.*.{s.path}" if sec.per_room else s.path
            assert full not in paths, f"{full} is described twice"
            paths.add(full)
            assert s.kind in (
                "number",
                "integer",
                "bool",
                "text",
                "choice",
                "list",
                "use",
                "secret",
            )
            assert s.help.endswith("."), full
            assert s.secret == (s.kind == "secret"), full
            if s.kind in ("number", "integer"):
                assert s.lo is not None and s.hi is not None, full
            for text in (s.label, s.help, sec.title, sec.help):
                assert not DASHES.search(text), f"{full}: no en or em dashes"


def test_secrets_are_marked():
    for path in ("mqtt.password", "shelly.password"):
        assert setting_for(path)[1].secret


def test_writes_to_devices_are_marked():
    for path in ("house.dry_run", "shelly.host", "rooms.x.actuate", "rooms.x.trv"):
        assert setting_for(path)[1].hardware, path


def test_flatten_and_nest_round_trip():
    nested = {
        "boiler": {"min_burn_min": 9, "nozzle_lph": None},
        "balancing": False,
        "rooms": {"lounge": {"actuate": True, "use": {"weekdays": "in_use", "weekend": "unused"}}},
    }
    flat, problems = flatten(nested)
    assert not problems
    assert flat == {
        "boiler.min_burn_min": 9,
        "boiler.nozzle_lph": None,
        "balancing": False,
        "rooms.lounge.actuate": True,
        "rooms.lounge.use": {"weekdays": "in_use", "weekend": "unused"},
    }
    assert nest(flat) == nested


def test_flatten_reports_unknown_and_house_file_only_keys():
    _, problems = flatten({"boiler": {"bogus": 1}, "house": {"data_dir": "/x"}, "nope": 1})
    assert "boiler.bogus: unknown setting" in problems
    assert "house.data_dir: only the house file can set this" in problems
    assert "nope: unknown setting" in problems


def test_merge_lays_settings_over_the_house_file_without_changing_it():
    data = minimal(boiler={"nozzle_lph": 0.3, "min_burn_min": 8})
    before = copy.deepcopy(data)
    merged, problems = merge_settings(
        data,
        {
            "boiler.min_burn_min": 10,
            "boiler.nozzle_lph": None,
            "shelly.host": "192.0.2.10",
            "rooms.b.actuate": True,
            "rooms.gone.actuate": True,
        },
    )
    assert data == before
    assert merged["boiler"] == {"min_burn_min": 10}
    assert merged["shelly"] == {"host": "192.0.2.10"}
    assert merged["rooms"][1]["actuate"] is True
    assert problems == ["rooms.gone: no room with this id in the house file"]
    site = parse_site(merged, {})
    assert site.house.boiler.min_burn_s == 600
    assert site.house.boiler.nozzle_lph is None
    assert [r.id for r in site.house.rooms if r.actuation_enabled] == ["b"]


def test_lookup():
    data = minimal(boiler={"min_burn_min": 9, "nozzle_lph": None})
    assert lookup(data, "boiler.min_burn_min") == (True, 9)
    assert lookup(data, "boiler.nozzle_lph") == (False, None)
    assert lookup(data, "rooms.b.trv") == (True, "trv_b")
    assert lookup(data, "rooms.b.window") == (False, None)
    assert lookup(data, "shelly.host") == (False, None)


def test_problem_paths_name_rooms_by_id():
    data = minimal()
    assert problem_path("rooms[1].trv: required", data) == ("rooms.b.trv", "required")
    assert problem_path("rooms: b: actuate is true but the room has no trv", data) == (
        "rooms.b.actuate",
        "actuate is true but the room has no trv",
    )
    assert problem_path("boiler.frost_c: must be 5 to 10", data) == (
        "boiler.frost_c",
        "must be 5 to 10",
    )


def test_register_section_adds_before_the_linked_sections():
    extra = Section(
        "export.otlp",
        "OpenTelemetry",
        "Send metrics to an OpenTelemetry collector.",
        (
            Setting("export.otlp.endpoint", "Endpoint", "text", "The collector's URL."),
            Setting("export.otlp.token", "Token", "secret", "The token.", secret=True),
        ),
    )
    saved = list(SECTIONS)
    try:
        register_section(extra)
        ids = [s.id for s in SECTIONS]
        assert ids.index("export.otlp") < ids.index("household")
        assert setting_for("export.otlp.token")[1].secret
        flat, problems = flatten({"export": {"otlp": {"endpoint": "http://192.0.2.5:4318"}}})
        assert flat == {"export.otlp.endpoint": "http://192.0.2.5:4318"} and not problems
        assert nest(flat) == {"export": {"otlp": {"endpoint": "http://192.0.2.5:4318"}}}
    finally:
        SECTIONS[:] = saved


# --- load_site ---------------------------------------------------------------------


def write_house(tmp_path: Path, data: dict) -> Path:
    path = tmp_path / "house.yaml"
    data = copy.deepcopy(data)
    data.setdefault("house", {})["data_dir"] = str(tmp_path / "data")
    path.write_text(yaml.safe_dump(data))
    return path


def test_load_site_applies_saved_settings(tmp_path):
    path = write_house(tmp_path, minimal())
    write_settings(tmp_path / "data", {"boiler": {"frost_c": 8}, "rooms": {"b": {"actuate": True}}})
    site = load_site(path, env={})
    assert site.house.boiler.frost_c == 8
    assert [r.id for r in site.house.rooms if r.actuation_enabled] == ["b"]
    assert site.saved_settings == ("boiler.frost_c", "rooms.b.actuate")
    assert not site.settings_problems


def test_load_site_ignores_saved_settings_that_do_not_load(tmp_path):
    path = write_house(tmp_path, minimal())
    write_settings(tmp_path / "data", {"boiler": {"frost_c": 50}})
    site = load_site(path, env={})
    assert site.house.boiler.frost_c == 7
    assert site.settings_problems == ("boiler.frost_c: must be 5 to 10",)
    assert any("settings saved from the web UI were not used" in n for n in site.notes)


def test_load_site_ignores_unknown_saved_settings(tmp_path):
    path = write_house(tmp_path, minimal())
    write_settings(tmp_path / "data", {"boiler": {"frost_c": 8, "bogus": 1}})
    site = load_site(path, env={})
    assert site.house.boiler.frost_c == 7
    assert site.settings_problems == ("boiler.bogus: unknown setting",)


def test_saved_settings_file(tmp_path):
    assert read_settings(tmp_path) is None
    write_settings(tmp_path, {"store": {"windows": ["06:00-07:00"]}})
    text = settings_path(tmp_path).read_text()
    assert text.startswith("# Saved by Radiate's Settings view")
    assert '"06:00-07:00"' in text
    assert read_settings(tmp_path) == {"store": {"windows": ["06:00-07:00"]}}
    settings_path(tmp_path).write_text("household: {}\n")
    with pytest.raises(ConfigError):
        read_settings(tmp_path)
