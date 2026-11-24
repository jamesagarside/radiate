"""Raw data series: the values one recorded tick holds, by metric and room (spec 9.2).

Pure: no I/O, no clock. The Raw data view (`radiate.server.data`) and the OpenTelemetry
export (`radiate.export.otlp`) both read a tick through `tick_values`, so the same
metric means the same thing in both. Each series' OpenTelemetry name and unit are in
the telemetry schema, `radiate.export.telemetry`.

A series is one metric for one room, or for the house. Its key is the metric ID, with
`@` and the room ID for a room metric: `room.temperature@lounge`, `boiler.relay`.
Values are floats. States (relays, calling, an open window) are 1 or 0, so an average
over an hour reads as the share of the hour they were on. A level, such as the boiler
state, is the index of its name in `Metric.levels`.

A tick is the data `radiate.core.history.tick_data` records: the snapshot, and the
compact actions with the runtime's `observed` values added (`observed_values`). Older
ticks without `observed` still give every snapshot and action series.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from .types import BoilerState

ROOM = "room"
HOUSE = "house"
GAUGE = "gauge"  # a measured or set value
STATE = "state"  # on (1) or off (0)
LEVEL = "level"  # the index of one of `levels`


@dataclass(frozen=True, slots=True)
class Metric:
    id: str
    label: str  # sentence case, without the room: "Temperature"
    unit: str  # as the UI shows it: "°C", "%", "W", "" for a state or a count
    kind: str  # GAUGE, STATE or LEVEL
    scope: str  # ROOM or HOUSE
    description: str
    levels: tuple[str, ...] = ()


BOILER_LEVELS = tuple(s.value for s in BoilerState)  # idle, lead, firing, rest

METRICS: tuple[Metric, ...] = (
    Metric(
        "room.temperature",
        "Temperature",
        "°C",
        GAUGE,
        ROOM,
        "The room sensor's reading.",
    ),
    Metric(
        "room.humidity",
        "Humidity",
        "%",
        GAUGE,
        ROOM,
        "Relative humidity from the room sensor.",
    ),
    Metric(
        "room.setpoint",
        "Setpoint",
        "°C",
        GAUGE,
        ROOM,
        "The temperature the schedule, or a hold, asks for.",
    ),
    Metric(
        "room.target",
        "Target",
        "°C",
        GAUGE,
        ROOM,
        "The temperature Radiate is heating the room to now, after preheating and room use.",
    ),
    Metric(
        "room.calling",
        "Calling for heat",
        "",
        STATE,
        ROOM,
        "1 while the room wants heat from the boiler.",
    ),
    Metric(
        "room.window",
        "Window open",
        "",
        STATE,
        ROOM,
        "1 while the room's window sensor reads open.",
    ),
    Metric(
        "valve.temperature",
        "Valve temperature",
        "°C",
        GAUGE,
        ROOM,
        "The TRV's own sensor, at the radiator.",
    ),
    Metric(
        "valve.opening",
        "Opening limit",
        "%",
        GAUGE,
        ROOM,
        "The opening limit Radiate set on the valve.",
    ),
    Metric(
        "valve.reported",
        "Opening limit, reported",
        "%",
        GAUGE,
        ROOM,
        "The opening limit the valve says it holds.",
    ),
    Metric(
        "outdoor.temperature",
        "Outdoor temperature",
        "°C",
        GAUGE,
        HOUSE,
        "The outdoor sensor's reading.",
    ),
    Metric(
        "boiler.relay",
        "Heating relay",
        "",
        STATE,
        HOUSE,
        "1 while the heating relay reads on.",
    ),
    Metric(
        "boiler.demand",
        "Heating relay, asked",
        "",
        STATE,
        HOUSE,
        "1 while Radiate asks for the heating relay to be on.",
    ),
    Metric(
        "boiler.state",
        "Boiler state",
        "",
        LEVEL,
        HOUSE,
        "Idle, opening valves (lead), firing or resting, as the boiler guard has it.",
        BOILER_LEVELS,
    ),
    Metric(
        "boiler.burner",
        "Burner",
        "",
        STATE,
        HOUSE,
        "1 while the burner fires, where the boiler reports it.",
    ),
    Metric(
        "boiler.power",
        "Boiler power",
        "W",
        GAUGE,
        HOUSE,
        "Power through the heating relay, where the relay measures it.",
    ),
    Metric(
        "store.relay",
        "Hot water relay",
        "",
        STATE,
        HOUSE,
        "1 while the hot-water store relay reads on.",
    ),
    Metric(
        "people.home",
        "People home",
        "",
        GAUGE,
        HOUSE,
        "How many of the household's people count as home.",
    ),
    Metric(
        "people.away",
        "People away",
        "",
        GAUGE,
        HOUSE,
        "How many of the household's people count as away.",
    ),
)

BY_ID: dict[str, Metric] = {m.id: m for m in METRICS}


def series_key(metric: str, room: str | None = None) -> str:
    return metric if room is None else f"{metric}@{room}"


def split_key(key: str) -> tuple[str, str | None]:
    """`room.temperature@lounge` -> ("room.temperature", "lounge")."""
    metric, _, room = key.partition("@")
    return metric, room or None


def _num(value: Any) -> float | None:
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float)) and math.isfinite(value):
        return float(value)
    return None


def tick_values(data: Any) -> dict[str, float]:
    """Every series value in one recorded tick. Unreadable parts are left out."""
    out: dict[str, float] = {}
    if not isinstance(data, dict):
        return out
    snap = data.get("snapshot")
    acts = data.get("actions")
    snap = snap if isinstance(snap, dict) else {}
    acts = acts if isinstance(acts, dict) else {}
    observed = acts.get("observed")
    observed = observed if isinstance(observed, dict) else {}

    def put(key: str, value: Any) -> None:
        v = _num(value)
        if v is not None:
            out[key] = v

    rooms = snap.get("rooms")
    if isinstance(rooms, dict):
        for rid, inp in rooms.items():
            if not isinstance(inp, dict):
                continue
            put(series_key("room.temperature", rid), inp.get("temperature"))
            put(series_key("room.humidity", rid), inp.get("humidity"))
            put(series_key("valve.temperature", rid), inp.get("trv_temperature"))
            put(series_key("valve.reported", rid), inp.get("opening_echo"))
            put(series_key("room.window", rid), inp.get("window_open"))
    obs_rooms = observed.get("rooms")
    if isinstance(obs_rooms, dict):
        for rid, item in obs_rooms.items():
            if not isinstance(item, dict):
                continue
            put(series_key("room.target", rid), item.get("target"))
            put(series_key("room.calling", rid), item.get("calling"))
            inp = rooms.get(rid) if isinstance(rooms, dict) else None
            # The snapshot's setpoint defaults to 18° even in a room with no radiator,
            # so it is a series only for the rooms Radiate controls.
            if isinstance(inp, dict):
                put(series_key("room.setpoint", rid), inp.get("setpoint", 18.0))
    valves = acts.get("valves")
    if isinstance(valves, dict):
        for rid, row in valves.items():
            if isinstance(row, list) and len(row) > 1:
                put(series_key("valve.opening", rid), row[1])

    put("outdoor.temperature", snap.get("outdoor"))
    put("boiler.relay", snap.get("heating_relay"))
    put("store.relay", snap.get("store_relay"))
    put("boiler.demand", acts.get("heating"))
    state = acts.get("boiler")
    if state in BOILER_LEVELS:
        out["boiler.state"] = float(BOILER_LEVELS.index(state))
    put("boiler.burner", observed.get("burner"))
    put("boiler.power", observed.get("power_w"))
    people, away = _num(observed.get("people")), _num(observed.get("away"))
    if people is not None and people > 0 and away is not None:
        out["people.away"] = away
        out["people.home"] = people - away
    return out


def observed_values(
    targets: dict[str, tuple[float | None, bool]],
    telemetry: dict | None,
    people: int,
    away: int,
) -> dict[str, Any]:
    """The values a tick records beside the snapshot and actions, for raw data only.

    `targets`: each controllable room's target and whether it calls for heat, from the
    engine state after `decide`. `telemetry`: the driver's, for the burner (the
    simulator) and the heating relay's power (a Shelly). People are counts only, so no
    one's name or ID is recorded.
    """
    out: dict[str, Any] = {
        "rooms": {
            rid: {"target": round(t, 2) if t is not None else None, "calling": calling}
            for rid, (t, calling) in targets.items()
        }
    }
    tele = telemetry if isinstance(telemetry, dict) else {}
    burner = tele.get("burner")
    if isinstance(burner, bool):
        out["burner"] = burner
    power = _num(tele.get("heating_power_w"))
    if power is not None and not isinstance(tele.get("heating_power_w"), bool):
        out["power_w"] = round(power, 1)
    if people > 0:
        out["people"] = people
        out["away"] = away
    return out
