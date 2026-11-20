import re
from pathlib import Path

import yaml

from radiate.cli import main
from radiate.config import load_site
from radiate.export.dashboard import build_dashboard, slug

REFERENCE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "x", "RADIATE_SHELLY_PASSWORD": "x"}
ENTITY = re.compile(r"^(sensor|climate|binary_sensor)\.[a-z0-9_]+$")


def _sections():
    site = load_site(REFERENCE, env=ENV)
    view = build_dashboard(site)["views"][0]
    return site, view["sections"]


def _room(sections, name):
    for s in sections:
        if s["cards"][0].get("heading") == name:
            return s
    raise AssertionError(f"no section for {name}")


def _entities(node):
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "entity":
                yield v
            else:
                yield from _entities(v)
    elif isinstance(node, list):
        for v in node:
            yield from _entities(v)


def test_slug_matches_home_assistant_object_ids():
    assert slug("trv_kitchen") == "trv_kitchen"
    assert slug("Sensor Bedroom 1") == "sensor_bedroom_1"
    assert slug("  Lounge/TRV  ") == "lounge_trv"


def test_one_section_per_room_between_overview_and_batteries():
    site, sections = _sections()
    headings = [s["cards"][0]["heading"] for s in sections]
    assert headings[0] == "House"
    assert headings[1:-1] == [r.name for r in site.house.rooms]
    assert headings[-1] == "Batteries"


def test_normal_room_has_humidity_badges_trend_and_valve():
    _, sections = _sections()
    heading, temp, valve = _room(sections, "Bedroom 1")["cards"]
    assert [b["entity"] for b in heading["badges"]] == [
        "sensor.temp_bedroom_1_humidity",
        "sensor.temp_bedroom_1_dew_point",
    ]
    assert temp["entity"] == "sensor.temp_bedroom_1_temperature"
    assert temp["features"] == [{"type": "trend-graph", "hours_to_show": 24}]
    assert valve["entity"] == "climate.trv_bedroom_1"
    assert valve["features"] == [{"type": "target-temperature"}]


def test_heat_sources_are_named_in_words():
    _, sections = _sections()
    lounge = _room(sections, "Lounge")
    assert lounge["cards"][0]["icon"] == "mdi:fireplace"
    assert lounge["cards"][1] == {
        "type": "heading",
        "heading": "Open fire",
        "heading_style": "subtitle",
    }
    assert _room(sections, "Kitchen")["cards"][1]["heading"] == "Range cooker"


def test_internal_sensor_room_uses_the_valve_reading_and_has_no_badges():
    _, sections = _sections()
    toilet = _room(sections, "Toilet")
    assert "badges" not in toilet["cards"][0]
    tiles = [c for c in toilet["cards"] if c["type"] == "tile"]
    assert tiles[0]["entity"] == "sensor.trv_toilet_local_temperature"
    assert tiles[0]["name"] == "Temperature at the valve"
    assert tiles[1]["entity"] == "climate.trv_toilet"


def test_passive_room_has_no_valve_control():
    _, sections = _sections()
    stairs = _room(sections, "Stairs")
    assert stairs["cards"][0]["icon"] == "mdi:radiator-disabled"
    assert stairs["cards"][1]["heading"] == "Bypass, not controlled"
    assert not any(c.get("entity", "").startswith("climate.") for c in stairs["cards"])


def test_every_entity_id_is_well_formed():
    _, sections = _sections()
    ids = list(_entities(sections))
    assert ids and all(ENTITY.match(e) for e in ids), [e for e in ids if not ENTITY.match(e)]


def test_cli_writes_yaml_without_the_secrets_set(tmp_path, monkeypatch):
    for name in ENV:
        monkeypatch.delenv(name, raising=False)
    out = tmp_path / "dashboard.yaml"
    main(["dashboard", str(REFERENCE), "--title", "Radiators", "-o", str(out)])
    data = yaml.safe_load(out.read_text())
    assert data["title"] == "Radiators"
    assert data["views"][0]["path"] == "radiators"
    assert data["views"][0]["type"] == "sections"
