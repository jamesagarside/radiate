"""Home Assistant dashboard for a house configuration.

`radiate dashboard`, and `GET /api/v1/ha/dashboard` for the web UI's Home Assistant
section, turn the house file into a Lovelace dashboard with three views:

- **Overview**: the house at a glance on one screen. The heating mode with buttons to
  change it, Eco or Comfort, the boiler, alerts and the outside temperature, the
  hot-water store with a boost button, then one tile per room with its reading, whether
  it is heating and its target to change, then who is away.
- **Rooms**: whole-house history, then the boiler (its state and history, alerts, and
  today's burner time and starts), then one section per room with its temperature trend,
  humidity, Radiate's heating control with a button back to the schedule, its opening
  limit, a stuck valve warning while there is one, and valve activity (room against
  target, heating shaded), then device batteries. The live window is `hours`, set when
  the dashboard is built.
- **Analysis**: a date picker (the `energy-date-selection` card) drives every card on the
  view, so the reader chooses the day, week, month or a custom range. It shows the
  boiler's burner hours, starts and oil over the period, then per room the lowest,
  average and highest temperature, a min/mean/max chart and peak humidity, plus a
  house-wide comparison of averages. These read Home Assistant's long-term statistics,
  so they reach back beyond the recorder's purge window.

It uses built-in cards only, so it needs nothing from HACS.

Entity IDs follow Zigbee2MQTT's Home Assistant discovery: the device's friendly name,
slugified, then the exposed property (`sensor.<name>_temperature`), and `climate.<name>`
for a TRV. Devices that are not paired yet show as unavailable until they are.

With `radiate=True` (the default) it also uses the entities and services of Radiate's own
integration (radiate-ha); `radiate_entity` derives those IDs. With
`radiate=False` it uses Zigbee2MQTT's entities only, for a house where Radiate is not
running yet, and sets temperatures on the valves directly.

Colours echo the web UI (docs/standards/design.md): deep orange for temperature, blue for
humidity. Every coloured value also has a text label.

`to_yaml` writes the result without PyYAML, so the browser demo, which has no PyYAML,
can build it too.
"""

from __future__ import annotations

import json
import re
import unicodedata
from typing import Any

from radiate.config import RoomDevices, SiteConfig
from radiate.config.household import Person
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
_HALF = {"columns": 6}
_THIRD = {"columns": 4}


def slug(name: str) -> str:
    """Home Assistant's object ID for a name, as its `slugify` makes it.

    Accents are dropped rather than the letter ("Chloë" becomes "chloe"), then every run
    of other characters becomes one underscore.
    """
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", ascii_name.lower()).strip("_")


# Radiate integration entities ---------------------------------------------------------

RADIATE_DEVICE = "Radiate"

# English entity names by (platform, translation key), as in
# radiate-ha's custom_components/radiate/strings.json. Only the entities this dashboard shows.
RADIATE_NAMES: dict[tuple[str, str], str] = {
    ("sensor", "boiler_state"): "Boiler state",
    ("sensor", "alerts"): "Alerts",
    ("sensor", "outdoor_temperature"): "Outdoor temperature",
    ("sensor", "burner_hours_today"): "Burner hours today",
    ("sensor", "relay_starts_today"): "Starts today",
    ("sensor", "oil_today"): "Oil used today",
    ("sensor", "heat_today"): "Heat delivered today",
    ("sensor", "opening_limit"): "Opening limit",
    ("switch", "fire_switch"): "Fire lit",
    ("select", "mode"): "Heating mode",
    ("select", "demand_mode"): "Demand mode",
    ("binary_sensor", "valve_untrusted"): "Stuck valve",
    ("binary_sensor", "store"): "Hot-water store",
    ("binary_sensor", "store_boost"): "Hot-water boost",
}


def radiate_entity(domain: str, key: str | None = None, room: RoomConfig | None = None) -> str:
    """Entity ID Home Assistant gives an entity of the Radiate integration.

    The integration sets `has_entity_name`, so Home Assistant builds the object ID from
    the device name followed by the entity name, through `slug`:

    - House-wide entities belong to the device named "Radiate" (`house_device` in
      `entity.py`): `sensor.radiate_boiler_state`.
    - Per-room entities belong to a device named after the room. The server reports
      `RoomConfig.name` in `/api/v1/house`, so this is the house file's room name:
      `sensor.dining_room_opening_limit`.
    - The room's climate entity has no name of its own (`_attr_name = None` in
      `climate.py`), so its ID is the room name alone: `climate.dining_room`. Pass
      `key=None` for it.
    - Entity names come from each translation key's English name in `strings.json`
      (`RADIATE_NAMES`). The integration ships English only, so IDs are English
      whatever language Home Assistant's interface uses.

    Home Assistant fixes an ID when it first registers the entity. If the room has been
    renamed since, or a Zigbee2MQTT device already held the same ID (the later one gets
    `_2`), the real ID differs from this one.
    """
    device = room.name if room else RADIATE_DEVICE
    name = f"{device} {RADIATE_NAMES[(domain, key)]}" if key else device
    return f"{domain}.{slug(name)}"


# The away binary sensor's name has the person in it ("{person} away" in strings.json).
AWAY_NAME = "{person} away"


def away_entity(person: Person) -> str:
    """Entity ID of the integration's away binary sensor for a household person.

    It belongs to the "Radiate" device and takes the name the server reports for the
    person in `/api/v1/house`, `Person.shown_name`: `binary_sensor.radiate_sam_away`.
    """
    name = AWAY_NAME.format(person=person.shown_name)
    return f"binary_sensor.{slug(f'{RADIATE_DEVICE} {name}')}"


def _perform(action: str, target: str | None = None, **data: Any) -> Card:
    action_card: Card = {"action": "perform-action", "perform_action": action}
    if target:
        action_card["target"] = {"entity_id": target}
    if data or not target:
        action_card["data"] = data
    return action_card


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
    if room.role is RoomRole.UNHEATED:
        return "mdi:home-thermometer-outline"
    return _ICONS.get(room.heat_source, "mdi:radiator")


def _note(room: RoomConfig) -> str | None:
    if room.role is RoomRole.PASSIVE:
        return "Bypass, not controlled"
    if room.role is RoomRole.UNHEATED:
        return "No radiator, temperature recorded only"
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


def _radiate_room_cards(room: RoomConfig) -> list[Card]:
    """Radiate's heating control with a way back to the schedule, its opening limit, for
    an open fire the fire switch, and a stuck valve warning that shows only while on."""
    climate = radiate_entity("climate", room=room)
    stuck = radiate_entity("binary_sensor", "valve_untrusted", room)
    cards: list[Card] = [
        {
            "type": "tile",
            "entity": climate,
            "name": "Heating",
            "state_content": ["hvac_action", "current_temperature"],
            "features_position": "bottom",
            "features": [{"type": "target-temperature"}],
            "grid_options": _FULL,
        },
        # Changing the target holds it until the next scheduled change; this ends the
        # hold now. The integration's `clear_override` is an entity action.
        _button(
            "Back to schedule",
            "mdi:calendar-sync",
            _perform("radiate.clear_override", target=climate),
            _HALF,
        ),
        {
            "type": "tile",
            "entity": radiate_entity("sensor", "opening_limit", room),
            "name": "Opening limit",
            "icon": "mdi:valve",
            "grid_options": _HALF,
        },
    ]
    if room.heat_source is HeatSource.EPISODIC:
        cards.append(
            {
                "type": "tile",
                "entity": radiate_entity("switch", "fire_switch", room),
                "name": "Fire lit",
                "icon": "mdi:fireplace",
                "tap_action": {"action": "toggle"},
                "grid_options": _HALF,
            }
        )
    # Hidden unless the valve stayed shut through burns that warmed the other rooms.
    cards.append(
        {
            "type": "tile",
            "entity": stuck,
            "name": "Valve may be stuck",
            "color": "red",
            "visibility": [{"condition": "state", "entity": stuck, "state": "on"}],
            "grid_options": _FULL,
        }
    )
    return cards


def room_section(
    room: RoomConfig, dev: RoomDevices, hours: int = DEFAULT_HOURS, radiate: bool = True
) -> Card:
    """Heading with humidity badges, temperature trend, heating control and valve activity.

    With `radiate`, Radiate's climate entity sets the room's temperature, since Radiate
    then drives the valve. Without it, the valve's own climate entity does.
    """
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
    if radiate and room.controllable:
        cards += _radiate_room_cards(room)
    if dev.trv and room.controllable:
        climate = f"climate.{slug(dev.trv)}"
        if not radiate:
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


def _tile(entity: str, name: str, grid: Card = _HALF, **extra: Any) -> Card:
    return {"type": "tile", "entity": entity, "name": name, **extra, "grid_options": grid}


def _button(name: str, icon: str, action: Card, grid: Card = _THIRD) -> Card:
    return {
        "type": "button",
        "name": name,
        "icon": icon,
        "show_state": False,
        "tap_action": action,
        "grid_options": grid,
    }


def _boiler(site: SiteConfig, hours: int) -> Card:
    """The boiler now and over the window, alerts, and today's burner use."""
    boiler = radiate_entity("sensor", "boiler_state")
    cards: list[Card] = [
        {"type": "heading", "heading": "Boiler", "icon": "mdi:water-boiler"},
        _tile(boiler, "Boiler", icon="mdi:water-boiler"),
        _tile(radiate_entity("sensor", "alerts"), "Alerts", icon="mdi:alert-circle-outline"),
        # The boiler state's timeline (idle, opening valves, firing, resting) shows when
        # the heating relay was on.
        {
            "type": "history-graph",
            "title": f"Boiler, last {_window_label(hours)}",
            "hours_to_show": hours,
            "entities": [{"entity": boiler, "name": "Boiler"}],
            "grid_options": _FULL,
        },
        _tile(radiate_entity("sensor", "burner_hours_today"), "Burner today"),
        _tile(radiate_entity("sensor", "relay_starts_today"), "Starts today"),
    ]
    # Litres and kWh exist only with a nozzle rating; without one the entities are absent.
    if site.house.boiler.nozzle_lph is not None:
        cards.append(_tile(radiate_entity("sensor", "oil_today"), "Oil today"))
        cards.append(_tile(radiate_entity("sensor", "heat_today"), "Heat today"))
    return {"type": "grid", "column_span": 2, "cards": cards}


# Overview view ------------------------------------------------------------------------


def _controls() -> Card:
    """Heating mode, Eco or Comfort, the boiler, alerts, outside, and hot water.

    The mode tile shows which mode is on. Changing it stays one tap on the buttons, which
    call `radiate.set_mode` so that Off can ask first. A `select-options` feature on the
    tile would change the mode from a list with no confirmation, so the tile has none.
    Eco and Comfort change nothing that needs a second thought, so their tile has buttons.
    """
    off = _perform("radiate.set_mode", mode="off")
    off["confirmation"] = {"text": "Turn the heating off? Frost protection stays on."}
    # The tiles take their icons from the integration (icons.json), which change with
    # the state: a snowflake in frost, a crossed-out boiler with the store off.
    cards: list[Card] = [
        {"type": "heading", "heading": "Heating", "icon": "mdi:thermostat"},
        _tile(radiate_entity("select", "mode"), "Mode", _FULL),
        _button("Auto", "mdi:calendar-clock", _perform("radiate.set_mode", mode="auto")),
        _button("Frost", "mdi:snowflake", _perform("radiate.set_mode", mode="frost")),
        _button("Off", "mdi:power", off),
        _tile(
            radiate_entity("select", "demand_mode"),
            "Eco or Comfort",
            _FULL,
            icon="mdi:leaf",
            features_position="bottom",
            features=[{"type": "select-options", "style": "buttons"}],
        ),
        _tile(radiate_entity("sensor", "boiler_state"), "Boiler", icon="mdi:water-boiler"),
        _tile(radiate_entity("sensor", "alerts"), "Alerts", icon="mdi:alert-circle-outline"),
        # What Radiate uses, whichever source the house file names.
        _tile(radiate_entity("sensor", "outdoor_temperature"), "Outside", _FULL),
        {"type": "heading", "heading": "Hot water", "heading_style": "subtitle"},
        _tile(radiate_entity("binary_sensor", "store"), "Store"),
        _tile(radiate_entity("binary_sensor", "store_boost"), "Boost"),
        _button(
            "Boost hot water for 1 hour",
            "mdi:water-boiler",
            _perform("radiate.boost_store", minutes=60),
            _FULL,
        ),
    ]
    return {"type": "grid", "column_span": 2, "cards": cards}


def _room_tile(room: RoomConfig, dev: RoomDevices, radiate: bool) -> Card | None:
    """One room at a glance: its reading, whether it is heating, and its target to change.

    A room Radiate controls shows its climate entity (Radiate's, or the valve's without
    Radiate); one it doesn't shows its temperature only. None without a reading.
    """
    if room.controllable and (radiate or dev.trv):
        entity = radiate_entity("climate", room=room) if radiate else f"climate.{slug(dev.trv)}"
        return {
            "type": "tile",
            "entity": entity,
            "name": room.name,
            "icon": _icon(room),
            "state_content": ["hvac_action", "current_temperature"],
            "features_position": "bottom",
            "features": [{"type": "target-temperature"}],
            "grid_options": _HALF,
        }
    temp = _temperature_entity(dev)
    if temp is None:
        return None
    return {
        "type": "tile",
        "entity": temp,
        "name": room.name,
        "icon": _icon(room),
        "color": "deep-orange",
        "grid_options": _HALF,
    }


def _rooms_at_a_glance(site: SiteConfig, radiate: bool) -> Card:
    tiles = [t for r in site.house.rooms if (t := _room_tile(r, site.devices[r.id], radiate))]
    heading: Card = {"type": "heading", "heading": "Rooms", "icon": "mdi:home-thermometer"}
    if not radiate and site.outdoor_sensor:
        heading["badges"] = [
            {"type": "entity", "entity": _outdoor_entity(site), "show_state": True}
        ]
    return {"type": "grid", "column_span": 2, "cards": [heading, *tiles]}


def _people(site: SiteConfig) -> Card | None:
    """Who Radiate counts as away, from the household's people. None without any."""
    people = site.household.people if site.household else ()
    if not people:
        return None
    cards: list[Card] = [{"type": "heading", "heading": "People", "icon": "mdi:account-group"}]
    cards += [_tile(away_entity(p), p.shown_name, icon="mdi:account") for p in people]
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


def _boiler_use(site: SiteConfig) -> Card:
    """Burner hours, starts and oil over the picked period, and burner hours by day.

    The daily totals reset at midnight (`total_increasing`), so their `change` over a
    period is the period's total.
    """
    hours = radiate_entity("sensor", "burner_hours_today")
    cards: list[Card] = [
        {"type": "heading", "heading": "Boiler", "icon": "mdi:water-boiler"},
        _picked("change", hours, "Burner hours", "mdi:fire"),
        _picked("change", radiate_entity("sensor", "relay_starts_today"), "Starts", "mdi:counter"),
    ]
    if site.house.boiler.nozzle_lph is not None:
        cards.append(_picked("change", radiate_entity("sensor", "oil_today"), "Oil", "mdi:barrel"))
    cards.append(
        {
            "type": "statistics-graph",
            "title": "Burner hours by day",
            "entities": [{"entity": hours, "name": "Burner hours"}],
            "stat_types": ["change"],
            "chart_type": "bar",
            "period": "day",
            "energy_date_selection": True,
            "hide_legend": True,
            "grid_options": _FULL,
        }
    )
    return {"type": "grid", "column_span": 2, "cards": cards}


# Dashboard ----------------------------------------------------------------------------


def build_dashboard(
    site: SiteConfig, title: str = "Heating", hours: int = DEFAULT_HOURS, radiate: bool = True
) -> dict[str, Any]:
    """Lovelace configuration for the house, ready for YAML mode or the raw editor.

    `radiate=False` leaves out everything from Radiate's integration, for a house that
    runs Zigbee2MQTT without Radiate.
    """
    if not 1 <= hours <= MAX_HOURS:
        raise ValueError(f"hours must be between 1 and {MAX_HOURS}, got {hours}")
    rooms = site.house.rooms
    overview: list[Card] = []
    if radiate:
        overview.append(_controls())
    overview.append(_rooms_at_a_glance(site, radiate))
    if radiate and (people := _people(site)):
        overview.append(people)
    live = [_house(site, hours)]
    if radiate:
        live.append(_boiler(site, hours))
    live += [room_section(r, site.devices[r.id], hours, radiate) for r in rooms]
    if batteries := _batteries(site):
        live.append(batteries)
    analysis = [_comparison(site)]
    if radiate:
        analysis.append(_boiler_use(site))
    analysis += [s for r in rooms if (s := analysis_section(r, site.devices[r.id]))]
    base = slug(title) or "heating"

    def view(name: str, path: str, icon: str, sections: list[Card]) -> Card:
        return {
            "title": name,
            "path": path,
            "icon": icon,
            "type": "sections",
            "max_columns": 4,
            "sections": sections,
        }

    return {
        "title": title,
        "views": [
            view("Overview", base, "mdi:home-thermometer", overview),
            view("Rooms", f"{base}-rooms", "mdi:radiator", live),
            view("Analysis", f"{base}-analysis", "mdi:chart-box-outline", analysis),
        ],
    }


# YAML ---------------------------------------------------------------------------------

YAML_HEADER = (
    "# Generated by Radiate from the house configuration.\n"
    "# Generate it again after changing rooms or device names, rather than editing by hand.\n"
)

# A string that can go unquoted: starts with a letter, and has no `: `, ` #` or trailing
# colon that YAML would read as structure. Anything else is written as a JSON string,
# which is also a valid YAML double-quoted scalar.
_PLAIN = re.compile(r"[A-Za-z][A-Za-z0-9 _./:,()'+-]*")
_RESERVED = {"y", "n", "yes", "no", "on", "off", "true", "false", "null"}


def _scalar(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return repr(value)
    if isinstance(value, float):
        text = repr(value)
        # YAML 1.1, which PyYAML and Home Assistant read, wants a dot before an exponent.
        mantissa, e, exponent = text.partition("e")
        return f"{mantissa}.0e{exponent}" if e and "." not in mantissa else text
    text = str(value)
    if (
        _PLAIN.fullmatch(text)
        and text.lower() not in _RESERVED
        and ": " not in text
        and " #" not in text
        and not text.endswith((":", " "))
    ):
        return text
    quoted = json.dumps(text, ensure_ascii=False)
    # JSON leaves line and paragraph separators and other unprintable characters as they
    # are; YAML reads some as line breaks, so escape every one.
    return "".join(c if c.isprintable() else _escape(c) for c in quoted)


def _escape(char: str) -> str:
    code = ord(char)
    return f"\\u{code:04x}" if code <= 0xFFFF else f"\\U{code:08x}"


def _inline(value: Any) -> str:
    if isinstance(value, dict) and not value:
        return "{}"
    if isinstance(value, list) and not value:
        return "[]"
    return _scalar(value)


def _nested(value: Any) -> bool:
    return isinstance(value, dict | list) and bool(value)


def _block(node: Any, indent: int, lines: list[str]) -> None:
    pad = " " * indent
    if isinstance(node, dict):
        for key, value in node.items():
            if _nested(value):
                lines.append(f"{pad}{_scalar(str(key))}:")
                _block(value, indent + 2, lines)
            else:
                lines.append(f"{pad}{_scalar(str(key))}: {_inline(value)}")
        return
    for item in node:
        if _nested(item):
            inner: list[str] = []
            _block(item, indent + 2, inner)
            lines.append(f"{pad}- {inner[0][indent + 2 :]}")
            lines.extend(inner[1:])
        else:
            lines.append(f"{pad}- {_inline(item)}")


def to_yaml(data: dict[str, Any]) -> str:
    """Block-style YAML for the dashboard's dicts, lists, strings, numbers and booleans.

    Written here rather than with PyYAML so the browser demo, which has no PyYAML, can
    offer the dashboard too. `yaml.safe_load` reads it back unchanged.
    """
    lines: list[str] = []
    _block(data, 0, lines)
    return "\n".join(lines) + "\n"


def dashboard_yaml(
    site: SiteConfig, title: str = "Heating", hours: int = DEFAULT_HOURS, radiate: bool = True
) -> str:
    return YAML_HEADER + to_yaml(build_dashboard(site, title, hours, radiate))
