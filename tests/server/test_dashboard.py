import dataclasses
import json
import re
from pathlib import Path

import yaml

from radiate.cli import main
from radiate.config import RoomDevices, load_site
from radiate.core.types import RoomConfig, RoomRole
from radiate.export.dashboard import RADIATE_NAMES, build_dashboard, radiate_entity, slug

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = ROOT / "examples" / "reference-house.yaml"
# A copy of radiate-ha's custom_components/radiate/strings.json. Copy it again when the
# integration renames an entity the dashboard shows.
STRINGS = ROOT / "tests" / "server" / "fixtures" / "ha" / "strings.json"
ENV = {"RADIATE_MQTT_PASSWORD": "x", "RADIATE_SHELLY_PASSWORD": "x"}
ENTITY = re.compile(r"^(sensor|climate|binary_sensor|switch|select)\.[a-z0-9_]+$")


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
    assert slug("Chloë's room") == "chloe_s_room"


def test_one_section_per_room_between_overview_and_batteries():
    site, sections = _sections()
    headings = [s["cards"][0]["heading"] for s in sections]
    assert headings[:2] == ["House", "Radiate"]
    assert headings[2:-1] == [r.name for r in site.house.rooms]
    assert headings[-1] == "Batteries"


def test_without_radiate_there_is_no_radiate_section_entity_or_action():
    site, sections = _sections(radiate=False)
    headings = [s["cards"][0]["heading"] for s in sections]
    assert headings[0] == "House"
    assert headings[1:-1] == [r.name for r in site.house.rooms]
    text = json.dumps(build_dashboard(site, radiate=False))
    assert "radiate." not in text
    assert "climate.bedroom_1" not in text
    assert "sensor.bedroom_1_opening_limit" not in text


def test_normal_room_has_humidity_badges_trend_valve_and_activity():
    # Zigbee2MQTT only: the valve's own climate entity sets the temperature.
    _, sections = _sections(radiate=False)
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


def test_radiate_room_sets_temperature_through_radiate_and_keeps_valve_activity():
    _, sections = _sections()
    heading, temp, heating, opening, activity = _room(sections, "Bedroom 1")["cards"]
    assert len(heading["badges"]) == 2
    assert temp["entity"] == "sensor.temp_bedroom_1_temperature"
    assert heating["entity"] == "climate.bedroom_1"
    assert heating["name"] == "Heating"
    assert heating["features"] == [{"type": "target-temperature"}]
    assert opening["entity"] == "sensor.bedroom_1_opening_limit"
    assert activity["type"] == "history-graph"
    assert activity["entities"] == [{"entity": "climate.trv_bedroom_1", "name": "Bedroom 1"}]
    tiles = [c["entity"] for c in _room(sections, "Bedroom 1")["cards"] if c["type"] == "tile"]
    assert "climate.trv_bedroom_1" not in tiles


def test_radiate_fire_switch_only_in_rooms_with_an_open_fire():
    _, sections = _sections()
    lounge = [c.get("entity") for c in _room(sections, "Lounge")["cards"]]
    assert "switch.lounge_fire_lit" in lounge
    fire = next(
        c for c in _room(sections, "Lounge")["cards"] if c.get("entity", "").startswith("switch.")
    )
    assert fire["tap_action"] == {"action": "toggle"}
    for name in ("Kitchen", "Bedroom 1"):
        assert not any(
            c.get("entity", "").startswith("switch.") for c in _room(sections, name)["cards"]
        )


def test_radiate_house_section_shows_boiler_history_today_mode_and_boost():
    _, sections = _sections()
    cards = _room(sections, "Radiate")["cards"]
    tiles = [c["entity"] for c in cards if c["type"] == "tile"]
    assert tiles == [
        "sensor.radiate_boiler_state",
        "sensor.radiate_alerts",
        "sensor.radiate_burner_hours_today",
        "sensor.radiate_starts_today",
        "select.radiate_heating_mode",
        "binary_sensor.radiate_hot_water_store",
        "binary_sensor.radiate_hot_water_boost",
    ]
    (history,) = [c for c in cards if c["type"] == "history-graph"]
    assert history["entities"] == [{"entity": "sensor.radiate_boiler_state", "name": "Boiler"}]
    assert history["title"] == "Boiler, last 24 hours"
    actions = [c["tap_action"] for c in cards if c["type"] == "button"]
    assert [(a["perform_action"], a["data"]) for a in actions] == [
        ("radiate.set_mode", {"mode": "auto"}),
        ("radiate.set_mode", {"mode": "frost"}),
        ("radiate.set_mode", {"mode": "off"}),
        ("radiate.boost_store", {"minutes": 60}),
    ]
    assert all(a["action"] == "perform-action" for a in actions)
    # Only turning the heating off asks first.
    assert [("confirmation" in a) for a in actions] == [False, False, True, False]


def test_mode_tile_shows_the_mode_and_the_buttons_change_it():
    _, sections = _sections()
    cards = _room(sections, "Radiate")["cards"]
    names = [c.get("heading") or c.get("name") for c in cards]
    mode = names.index("Heating mode")
    assert names[mode : mode + 5] == ["Heating mode", "Mode", "Auto", "Frost", "Off"]
    tile = cards[mode + 1]
    assert tile["entity"] == "select.radiate_heating_mode"
    # No select-options feature: it would turn the heating off without asking.
    assert "features" not in tile
    assert "icon" not in tile  # the integration's icon follows the mode


def test_store_state_sits_next_to_the_boost_button():
    _, sections = _sections()
    cards = _room(sections, "Radiate")["cards"]
    names = [c.get("heading") or c.get("name") for c in cards]
    water = names.index("Hot water")
    assert names[water:] == ["Hot water", "Store", "Boost", "Boost hot water for 1 hour"]
    store, boost = cards[water + 1], cards[water + 2]
    assert store["entity"] == "binary_sensor.radiate_hot_water_store"
    assert boost["entity"] == "binary_sensor.radiate_hot_water_boost"
    assert store["grid_options"] == boost["grid_options"] == {"columns": 6}


def test_oil_and_heat_today_need_a_nozzle_rating():
    site = load_site(REFERENCE, env=ENV)
    rated = dataclasses.replace(
        site,
        house=dataclasses.replace(
            site.house, boiler=dataclasses.replace(site.house.boiler, nozzle_lph=0.35)
        ),
    )
    for s, present in ((site, False), (rated, True)):
        sections = build_dashboard(s)["views"][0]["sections"]
        tiles = [c.get("entity") for c in _room(sections, "Radiate")["cards"]]
        assert ("sensor.radiate_oil_used_today" in tiles) is present
        assert ("sensor.radiate_heat_delivered_today" in tiles) is present


def test_radiate_entity_ids_match_the_integration_naming():
    # The IDs tests/ha sees from the real integration.
    site = load_site(REFERENCE, env=ENV)
    room = {r.id: r for r in site.house.rooms}
    assert radiate_entity("sensor", "relay_starts_today") == "sensor.radiate_starts_today"
    assert radiate_entity("sensor", "oil_today") == "sensor.radiate_oil_used_today"
    assert radiate_entity("climate", room=room["bedroom_1"]) == "climate.bedroom_1"
    assert radiate_entity("climate", room=room["dining"]) == "climate.dining_room"
    assert radiate_entity("switch", "fire_switch", room["lounge"]) == "switch.lounge_fire_lit"
    assert (
        radiate_entity("sensor", "opening_limit", room["dining"])
        == "sensor.dining_room_opening_limit"
    )
    assert radiate_entity("select", "mode") == "select.radiate_heating_mode"
    assert radiate_entity("binary_sensor", "store") == "binary_sensor.radiate_hot_water_store"
    assert radiate_entity("binary_sensor", "store_boost") == "binary_sensor.radiate_hot_water_boost"


def test_radiate_names_match_the_integration_strings():
    entity = json.loads(STRINGS.read_text())["entity"]
    for (platform, key), name in RADIATE_NAMES.items():
        assert entity[platform][key]["name"] == name, (platform, key)


def test_every_radiate_house_entity_on_the_dashboard_is_named():
    # House entities come from RADIATE_NAMES, so the check above covers their names.
    site = load_site(REFERENCE, env=ENV)
    named = {radiate_entity(platform, key) for platform, key in RADIATE_NAMES}
    shown = {e for e in _entities(build_dashboard(site)) if e.split(".")[1].startswith("radiate_")}
    assert shown and shown <= named
    assert {
        "select.radiate_heating_mode",
        "binary_sensor.radiate_hot_water_store",
        "binary_sensor.radiate_hot_water_boost",
    } <= shown


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
    assert tiles[1]["entity"] == "climate.toilet"
    _, z2m = _sections(radiate=False)
    assert [c for c in _room(z2m, "Toilet")["cards"] if c["type"] == "tile"][1][
        "entity"
    ] == "climate.trv_toilet"
    _, analysis = _sections(view=1)
    stats = [c for c in _room(analysis, "Toilet")["cards"] if c["type"] == "statistic"]
    assert {c["entity"] for c in stats} == {"sensor.trv_toilet_local_temperature"}


def test_passive_room_has_no_valve_control():
    _, sections = _sections()
    stairs = _room(sections, "Stairs")
    assert stairs["cards"][0]["icon"] == "mdi:radiator-disabled"
    assert stairs["cards"][1]["heading"] == "Bypass, not controlled"
    assert not any(c.get("entity", "").startswith("climate.") for c in stairs["cards"])
    assert not any("stairs_opening_limit" in c.get("entity", "") for c in stairs["cards"])


def test_unheated_room_shows_its_sensor_and_says_it_has_no_radiator():
    site = load_site(REFERENCE, env=ENV)
    utility = RoomConfig("utility", "Utility room", role=RoomRole.UNHEATED, has_humidity=True)
    site = dataclasses.replace(
        site,
        house=dataclasses.replace(site.house, rooms=(*site.house.rooms, utility)),
        devices={**site.devices, "utility": RoomDevices(sensor="temp_utility", schedule=None)},
    )
    views = build_dashboard(site)["views"]
    room = _room(views[0]["sections"], "Utility room")
    assert room["cards"][0]["icon"] == "mdi:home-thermometer-outline"
    assert room["cards"][1]["heading"] == "No radiator, temperature recorded only"
    ids = list(_entities(room))
    assert "sensor.temp_utility_temperature" in ids and "sensor.temp_utility_humidity" in ids
    assert not any(e.startswith("climate.") or "opening_limit" in e for e in ids)
    house = views[0]["sections"][0]
    assert "sensor.temp_utility_temperature" in list(_entities(house))
    analysis = list(_entities(_room(views[1]["sections"], "Utility room")))
    assert "sensor.temp_utility_temperature" in analysis


def test_every_entity_id_is_well_formed():
    site = load_site(REFERENCE, env=ENV)
    for radiate in (True, False):
        ids = list(_entities(build_dashboard(site, radiate=radiate)))
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
    assert "Radiate" in [s["cards"][0]["heading"] for s in data["views"][0]["sections"]]


def test_cli_no_radiate_leaves_out_radiate(tmp_path):
    out = tmp_path / "dashboard.yaml"
    main(["dashboard", str(REFERENCE), "--no-radiate", "-o", str(out)])
    text = out.read_text()
    assert "radiate." not in text
    assert "climate.trv_bedroom_1" in text


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
    site = dataclasses.replace(load_site(REFERENCE, env=ENV), outdoor_sensor="outdoor_temp")
    data = build_dashboard(site)
    house = data["views"][0]["sections"][0]["cards"][1]["entities"]
    compare = data["views"][1]["sections"][0]["cards"][3]["entities"]
    assert house[0] == {"entity": "sensor.outdoor_temp_temperature", "name": "Outside"}
    assert compare[0]["name"] == "Outside"


def test_yaml_has_no_anchors(tmp_path):
    from radiate.export.dashboard import dashboard_yaml

    text = dashboard_yaml(load_site(REFERENCE, env=ENV))
    assert "&id" not in text and "*id" not in text
