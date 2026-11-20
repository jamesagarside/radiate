import re
from pathlib import Path

import yaml

from radiate.cli import main
from radiate.config import load_site
from radiate.export.dashboard import build_dashboard, slug

REFERENCE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "x", "RADIATE_SHELLY_PASSWORD": "x"}
ENTITY = re.compile(r"^(sensor|climate|binary_sensor)\.[a-z0-9_]+$")


def _sections(view=0, **kwargs):
    site = load_site(REFERENCE, env=ENV)
    return site, build_dashboard(site, **kwargs)["views"][view]["sections"]


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


def test_normal_room_has_humidity_badges_trend_valve_and_activity():
    _, sections = _sections()
    heading, temp, valve, activity = _room(sections, "Bedroom 1")["cards"]
    assert [b["entity"] for b in heading["badges"]] == [
        "sensor.temp_bedroom_1_humidity",
        "sensor.temp_bedroom_1_dew_point",
    ]
    assert temp["entity"] == "sensor.temp_bedroom_1_temperature"
    assert temp["features"] == [{"type": "trend-graph", "hours_to_show": 24}]
    assert valve["entity"] == "climate.trv_bedroom_1"
    assert valve["features"] == [{"type": "target-temperature"}]
    assert activity["type"] == "history-graph"
    assert activity["entities"] == [{"entity": "climate.trv_bedroom_1", "name": "Bedroom 1"}]
    assert activity["title"] == "Valve activity, last 24 hours"


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
    _, analysis = _sections(view=1)
    stats = [c for c in _room(analysis, "Toilet")["cards"] if c["type"] == "statistic"]
    assert {c["entity"] for c in stats} == {"sensor.trv_toilet_local_temperature"}


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
    main(["dashboard", str(REFERENCE), "--title", "Radiators", "--hours", "48", "-o", str(out)])
    data = yaml.safe_load(out.read_text())
    assert data["title"] == "Radiators"
    assert [v["path"] for v in data["views"]] == ["radiators", "radiators-analysis"]
    assert all(v["type"] == "sections" for v in data["views"])


def test_hours_sets_every_live_window():
    _, sections = _sections(hours=72)
    windows = [c["hours_to_show"] for s in sections for c in s["cards"] if "hours_to_show" in c]
    trends = [
        f["hours_to_show"]
        for s in sections
        for c in s["cards"]
        for f in c.get("features", [])
        if f["type"] == "trend-graph"
    ]
    assert windows and set(windows) == {72}
    assert trends and set(trends) == {72}
    assert sections[0]["cards"][1]["title"] == "Temperatures, last 3 days"


def test_hours_out_of_range_is_refused():
    site = load_site(REFERENCE, env=ENV)
    for bad in (0, 14 * 24 + 1):
        try:
            build_dashboard(site, hours=bad)
        except ValueError:
            continue
        raise AssertionError(f"hours={bad} accepted")


def test_analysis_view_follows_one_date_picker():
    site, sections = _sections(view=1)
    cards = [c for s in sections for c in s["cards"]]
    assert sum(c["type"] == "energy-date-selection" for c in cards) == 1
    stats = [c for c in cards if c["type"] == "statistic"]
    graphs = [c for c in cards if c["type"] == "statistics-graph"]
    assert stats and all(c["period"] == "energy_date_selection" for c in stats)
    assert graphs and all(c["energy_date_selection"] for c in graphs)
    bedroom = _room(sections, "Bedroom 1")
    names = [c.get("name") for c in bedroom["cards"] if c["type"] == "statistic"]
    assert names == ["Lowest", "Average", "Highest", "Peak humidity", "Average humidity"]
    # One analysis section per room with a temperature reading, after the comparison.
    assert len(sections) == 1 + len(site.house.rooms)


def test_outdoor_sensor_joins_the_house_charts():
    import dataclasses

    site = dataclasses.replace(load_site(REFERENCE, env=ENV), outdoor_sensor="outdoor_temp")
    data = build_dashboard(site)
    house = data["views"][0]["sections"][0]["cards"][1]["entities"]
    compare = data["views"][1]["sections"][0]["cards"][3]["entities"]
    assert house[0] == {"entity": "sensor.outdoor_temp_temperature", "name": "Outside"}
    assert compare[0]["name"] == "Outside"
