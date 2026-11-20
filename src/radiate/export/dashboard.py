"""Home Assistant dashboard for a house configuration.

`radiate dashboard` turns the house file into a Lovelace dashboard with two views:

- **Rooms**: whole-house history, then one section per room with its temperature trend,
  humidity, valve control and valve activity (room against target, heating shaded),
  then device batteries. The live window is `hours`, set when the dashboard is built.
- **Analysis**: a date picker (the `energy-date-selection` card) drives every card on the
  view, so the reader chooses the day, week, month or a custom range. Per room it shows
  the lowest, average and highest temperature, a min/mean/max chart and peak humidity,
  plus a house-wide comparison of averages. These read Home Assistant's long-term
  statistics, so they reach back beyond the recorder's purge window.

It uses built-in cards only, so it needs nothing from HACS.

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

DEFAULT_HOURS = 24
MAX_HOURS = 14 * 24  # the recorder keeps 14 days in the reference install

Card = dict[str, Any]

_ICONS = {
    HeatSource.EPISODIC: "mdi:fireplace",
    HeatSource.CONTINUOUS: "mdi:stove",
}
_NOTES = {
    HeatSource.EPISODIC: "Open fire",
    HeatSource.CONTINUOUS: "Range cooker",
}
_FULL = {"columns": 12}
_THIRD = {"columns": 4}


def slug(name: str) -> str:
    """Home Assistant's object ID for a Zigbee2MQTT friendly name."""
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def _window_label(hours: int) -> str:
    if hours % 24 == 0:
        days = hours // 24
        return "24 hours" if days == 1 else f"{days} days"
    return f"{hours} hours"


def _temperature_entity(dev: RoomDevices) -> str | None:
    if dev.sensor:
        return f"sensor.{slug(dev.sensor)}_temperature"
    if dev.trv:
        return f"sensor.{slug(dev.trv)}_local_temperature"
    return None


def _humidity_entity(dev: RoomDevices) -> str | None:
    return f"sensor.{slug(dev.sensor)}_humidity" if dev.sensor else None


def _outdoor_entity(site: SiteConfig) -> str | None:
    return f"sensor.{slug(site.outdoor_sensor)}_temperature" if site.outdoor_sensor else None


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


def _heading(room: RoomConfig, badges: list[Card] | None = None) -> list[Card]:
    heading: Card = {"type": "heading", "heading": room.name, "icon": _icon(room)}
    if badges:
        heading["badges"] = badges
    cards = [heading]
    note = _note(room)
    if note:
        cards.append({"type": "heading", "heading": note, "heading_style": "subtitle"})
    return cards


# Rooms view ---------------------------------------------------------------------------


def room_section(room: RoomConfig, dev: RoomDevices, hours: int = DEFAULT_HOURS) -> Card:
    """Heading with humidity badges, temperature trend, valve control and valve activity."""
    badges: list[Card] = []
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
    cards = _heading(room, badges)
    temp = _temperature_entity(dev)
    if temp:
        cards.append(
            {
                "type": "tile",
                "entity": temp,
                "name": "Temperature" if dev.sensor else "Temperature at the valve",
                "color": "deep-orange",
                "features_position": "bottom",
                "features": [{"type": "trend-graph", "hours_to_show": hours}],
                "grid_options": _FULL,
            }
        )
    if dev.trv and room.controllable:
        climate = f"climate.{slug(dev.trv)}"
        cards.append(
            {
                "type": "tile",
                "entity": climate,
                "name": "Valve",
                "features_position": "bottom",
                "features": [{"type": "target-temperature"}],
                "grid_options": _FULL,
            }
        )
        # A climate history graph draws the valve's reading against its target and shades
        # the time it was calling for heat: the quickest way to see when a room heated.
        cards.append(
            {
                "type": "history-graph",
                "title": f"Valve activity, last {_window_label(hours)}",
                "hours_to_show": hours,
                "entities": [{"entity": climate, "name": room.name}],
                "grid_options": _FULL,
            }
        )
    return {"type": "grid", "cards": cards}


def _house(site: SiteConfig, hours: int) -> Card:
    temps, hums = [], []
    outdoor = _outdoor_entity(site)
    if outdoor:
        temps.append({"entity": outdoor, "name": "Outside"})
    for room in site.house.rooms:
        dev = site.devices[room.id]
        if temp := _temperature_entity(dev):
            temps.append({"entity": temp, "name": room.name})
        if hum := _humidity_entity(dev):
            hums.append({"entity": hum, "name": room.name})
    label = _window_label(hours)
    cards: list[Card] = [{"type": "heading", "heading": "House", "icon": "mdi:home-thermometer"}]
    if temps:
        cards.append(
            {
                "type": "history-graph",
                "title": f"Temperatures, last {label}",
                "hours_to_show": hours,
                "entities": temps,
                "grid_options": _FULL,
            }
        )
    if hums:
        cards.append(
            {
                "type": "history-graph",
                "title": f"Humidity, last {label}",
                "hours_to_show": hours,
                "entities": hums,
                "grid_options": _FULL,
            }
        )
    return {"type": "grid", "column_span": 2, "cards": cards}


def _batteries(site: SiteConfig) -> Card | None:
    rows: list[Card] = []
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


# Analysis view ------------------------------------------------------------------------


def _picked(stat_type: str, entity: str, name: str, icon: str) -> Card:
    """A statistic card that follows the view's date picker."""
    return {
        "type": "statistic",
        "entity": entity,
        "stat_type": stat_type,
        "period": "energy_date_selection",
        "name": name,
        "icon": icon,
        "grid_options": _THIRD,
    }


def analysis_section(room: RoomConfig, dev: RoomDevices) -> Card | None:
    """Lowest, average and highest temperature, their chart and peak humidity."""
    temp = _temperature_entity(dev)
    if not temp:
        return None
    cards = _heading(room)
    cards += [
        _picked("min", temp, "Lowest", "mdi:thermometer-chevron-down"),
        _picked("mean", temp, "Average", "mdi:thermometer"),
        _picked("max", temp, "Highest", "mdi:thermometer-chevron-up"),
        {
            "type": "statistics-graph",
            "title": "Temperature range",
            "entities": [{"entity": temp, "name": room.name}],
            "stat_types": ["min", "mean", "max"],
            "chart_type": "line",
            "energy_date_selection": True,
            "hide_legend": True,
            "grid_options": _FULL,
        },
    ]
    if hum := _humidity_entity(dev):
        cards.append(_picked("max", hum, "Peak humidity", "mdi:water-percent"))
        cards.append(_picked("mean", hum, "Average humidity", "mdi:water-percent"))
    return {"type": "grid", "cards": cards}


def _comparison(site: SiteConfig) -> Card:
    temps, hums = [], []
    outdoor = _outdoor_entity(site)
    if outdoor:
        temps.append({"entity": outdoor, "name": "Outside"})
    for room in site.house.rooms:
        dev = site.devices[room.id]
        if temp := _temperature_entity(dev):
            temps.append({"entity": temp, "name": room.name})
        if hum := _humidity_entity(dev):
            hums.append({"entity": hum, "name": room.name})
    cards: list[Card] = [
        {"type": "heading", "heading": "Period", "icon": "mdi:calendar-range"},
        # Every statistics card on this view follows this picker.
        {"type": "energy-date-selection", "grid_options": _FULL},
        {"type": "heading", "heading": "Rooms compared", "heading_style": "subtitle"},
    ]
    if temps:
        cards.append(
            {
                "type": "statistics-graph",
                "title": "Average temperature",
                "entities": temps,
                "stat_types": ["mean"],
                "chart_type": "line",
                "energy_date_selection": True,
                "grid_options": _FULL,
            }
        )
    if hums:
        cards.append(
            {
                "type": "statistics-graph",
                "title": "Peak humidity",
                "entities": hums,
                "stat_types": ["max"],
                "chart_type": "line",
                "energy_date_selection": True,
                "grid_options": _FULL,
            }
        )
    return {"type": "grid", "column_span": 2, "cards": cards}


# Dashboard ----------------------------------------------------------------------------


def build_dashboard(
    site: SiteConfig, title: str = "Heating", hours: int = DEFAULT_HOURS
) -> dict[str, Any]:
    """Lovelace configuration for the house, ready for YAML mode or the raw editor."""
    if not 1 <= hours <= MAX_HOURS:
        raise ValueError(f"hours must be between 1 and {MAX_HOURS}, got {hours}")
    rooms = site.house.rooms
    live = [_house(site, hours)]
    live += [room_section(r, site.devices[r.id], hours) for r in rooms]
    if batteries := _batteries(site):
        live.append(batteries)
    analysis = [_comparison(site)]
    analysis += [s for r in rooms if (s := analysis_section(r, site.devices[r.id]))]
    base = slug(title) or "heating"
    return {
        "title": title,
        "views": [
            {
                "title": "Rooms",
                "path": base,
                "icon": "mdi:radiator",
                "type": "sections",
                "max_columns": 4,
                "sections": live,
            },
            {
                "title": "Analysis",
                "path": f"{base}-analysis",
                "icon": "mdi:chart-box-outline",
                "type": "sections",
                "max_columns": 4,
                "sections": analysis,
            },
        ],
    }


def dashboard_yaml(site: SiteConfig, title: str = "Heating", hours: int = DEFAULT_HOURS) -> str:
    import yaml

    header = (
        "# Generated by `radiate dashboard` from the house configuration.\n"
        "# Regenerate it after changing rooms or device names, rather than editing by hand.\n"
    )
    body = yaml.safe_dump(
        build_dashboard(site, title, hours), sort_keys=False, allow_unicode=True, width=100
    )
    return header + body
