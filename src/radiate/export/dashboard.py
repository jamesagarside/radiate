"""Home Assistant dashboard for a house configuration.

`radiate dashboard` turns the house file into a Lovelace dashboard: a whole-house
history first, then one section per room with its temperature, humidity and valve, then
device batteries. It uses built-in cards only (sections view, heading, tile with the
`trend-graph` and `target-temperature` features, history graph, entities), so it needs
nothing from HACS and works on any recent Home Assistant.

Entity IDs follow Zigbee2MQTT's Home Assistant discovery: the device's friendly name,
slugified, then the exposed property (`sensor.<name>_temperature`), and `climate.<name>`
for a TRV. Devices that are not paired yet show as unavailable until they are.

Colours echo the web UI (docs/standards/design.md): deep orange for temperature, blue for
humidity. Every coloured value also has a text label.
"""

from __future__ import annotations

import re
from typing import Any

from radiate.config import RoomDevices, SiteConfig
from radiate.core.types import HeatSource, RoomConfig, RoomRole

HISTORY_H = 24

_ICONS = {
    HeatSource.EPISODIC: "mdi:fireplace",
    HeatSource.CONTINUOUS: "mdi:stove",
}
_NOTES = {
    HeatSource.EPISODIC: "Open fire",
    HeatSource.CONTINUOUS: "Range cooker",
}


def slug(name: str) -> str:
    """Home Assistant's object ID for a Zigbee2MQTT friendly name."""
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def _temperature_entity(dev: RoomDevices) -> str | None:
    if dev.sensor:
        return f"sensor.{slug(dev.sensor)}_temperature"
    if dev.trv:
        return f"sensor.{slug(dev.trv)}_local_temperature"
    return None


def _icon(room: RoomConfig) -> str:
    if room.role is RoomRole.PASSIVE:
        return "mdi:radiator-disabled"
    return _ICONS.get(room.heat_source, "mdi:radiator")


def _note(room: RoomConfig) -> str | None:
    if room.role is RoomRole.PASSIVE:
        return "Bypass, not controlled"
    if room.role is RoomRole.INTERNAL_SENSOR_ONLY:
        return "No room sensor, uses the valve's own reading"
    return _NOTES.get(room.heat_source)


def room_section(room: RoomConfig, dev: RoomDevices) -> dict[str, Any]:
    """One grid section: heading with humidity badges, temperature trend, valve control."""
    badges: list[dict[str, Any]] = []
    if dev.sensor:
        s = slug(dev.sensor)
        badges.append(
            {
                "type": "entity",
                "entity": f"sensor.{s}_humidity",
                "color": "blue",
                "show_state": True,
            }
        )
        badges.append({"type": "entity", "entity": f"sensor.{s}_dew_point", "show_state": True})
    if dev.window:
        badges.append(
            {
                "type": "entity",
                "entity": f"binary_sensor.{slug(dev.window)}_contact",
                "show_state": True,
            }
        )
    heading: dict[str, Any] = {"type": "heading", "heading": room.name, "icon": _icon(room)}
    if badges:
        heading["badges"] = badges
    cards: list[dict[str, Any]] = [heading]
    note = _note(room)
    if note:
        cards.append({"type": "heading", "heading": note, "heading_style": "subtitle"})
    temp = _temperature_entity(dev)
    if temp:
        cards.append(
            {
                "type": "tile",
                "entity": temp,
                "name": "Temperature" if dev.sensor else "Temperature at the valve",
                "color": "deep-orange",
                "features_position": "bottom",
                "features": [{"type": "trend-graph", "hours_to_show": HISTORY_H}],
                "grid_options": {"columns": 12},
            }
        )
    if dev.trv and room.controllable:
        cards.append(
            {
                "type": "tile",
                "entity": f"climate.{slug(dev.trv)}",
                "name": "Valve",
                "features_position": "bottom",
                "features": [{"type": "target-temperature"}],
                "grid_options": {"columns": 12},
            }
        )
    return {"type": "grid", "cards": cards}


def _overview(site: SiteConfig) -> dict[str, Any]:
    temps, hums = [], []
    for room in site.house.rooms:
        dev = site.devices[room.id]
        temp = _temperature_entity(dev)
        if temp:
            temps.append({"entity": temp, "name": room.name})
        if dev.sensor:
            hums.append({"entity": f"sensor.{slug(dev.sensor)}_humidity", "name": room.name})
    cards: list[dict[str, Any]] = [
        {"type": "heading", "heading": "House", "icon": "mdi:home-thermometer"}
    ]
    if temps:
        cards.append(
            {
                "type": "history-graph",
                "title": "Room temperatures",
                "hours_to_show": HISTORY_H,
                "entities": temps,
                "grid_options": {"columns": 12},
            }
        )
    if hums:
        cards.append(
            {
                "type": "history-graph",
                "title": "Humidity",
                "hours_to_show": HISTORY_H,
                "entities": hums,
                "grid_options": {"columns": 12},
            }
        )
    return {"type": "grid", "column_span": 2, "cards": cards}


def _batteries(site: SiteConfig) -> dict[str, Any] | None:
    rows: list[dict[str, Any]] = []
    for room in site.house.rooms:
        dev = site.devices[room.id]
        if dev.sensor:
            rows.append(
                {"entity": f"sensor.{slug(dev.sensor)}_battery", "name": f"{room.name} sensor"}
            )
        if dev.trv:
            rows.append({"entity": f"sensor.{slug(dev.trv)}_battery", "name": f"{room.name} valve"})
    if not rows:
        return None
    return {
        "type": "grid",
        "cards": [
            {"type": "heading", "heading": "Batteries", "icon": "mdi:battery-medium"},
            {"type": "entities", "state_color": True, "entities": rows},
        ],
    }


def build_dashboard(site: SiteConfig, title: str = "Heating") -> dict[str, Any]:
    """Lovelace configuration for the house, ready for YAML mode or the raw editor."""
    sections = [_overview(site)]
    sections += [room_section(r, site.devices[r.id]) for r in site.house.rooms]
    batteries = _batteries(site)
    if batteries:
        sections.append(batteries)
    view = {
        "title": title,
        "path": slug(title) or "heating",
        "icon": "mdi:radiator",
        "type": "sections",
        "max_columns": 4,
        "sections": sections,
    }
    return {"title": title, "views": [view]}


def dashboard_yaml(site: SiteConfig, title: str = "Heating") -> str:
    import yaml

    header = (
        "# Generated by `radiate dashboard` from the house configuration.\n"
        "# Regenerate it after changing rooms or device names, rather than editing by hand.\n"
    )
    body = yaml.safe_dump(
        build_dashboard(site, title), sort_keys=False, allow_unicode=True, width=100
    )
    return header + body
