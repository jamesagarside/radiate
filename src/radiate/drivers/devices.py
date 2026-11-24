"""Device health: battery, signal, availability, readings and mesh routes (spec 3, 10).

Pure: no MQTT, no clock. Drivers pass in what they have heard and a monotonic `now`,
and get back the `GET /api/v1/devices` view and the device alerts. The live driver
(`radiate.drivers.live`) builds `DeviceHealth` from Zigbee2MQTT messages and the
Shelly; the demo driver builds it from the simulator.

Sources:

- Device state messages carry `battery` (%) and `linkquality` (LQI, 0 to 255), and
  `last_seen` when Zigbee2MQTT's `advanced.last_seen` is set (ISO 8601 or epoch
  milliseconds).
- The retained `bridge/devices` lists every device with `friendly_name`,
  `ieee_address`, `type` (`Coordinator`, `Router`, `EndDevice`), `power_source`,
  `software_build_id` (firmware) and `definition` (`model`, `vendor`, and `exposes`, the
  properties the converter offers). Routers are not in the house file, so they are found
  here.
- A network scan publishes `{"type": "raw", "routes": false}` to
  `bridge/request/networkmap`; Zigbee2MQTT answers on `bridge/response/networkmap`
  with `{"status": "ok", "data": {"value": {"nodes": [...], "links": [...]}}}`. Each
  link is one entry of a router's neighbour table: `source` is the neighbour, `target`
  the router that was asked, `relationship` 0 when the neighbour is its parent and 1
  when it is its child, and `lqi`. Zigbee2MQTT `lib/extension/networkMap.ts`, commit
  `3c841fd`, checked 22 November 2026. The scan asks every router in turn and slows
  the mesh while it runs (10 s to 2 min), so it runs only when a person asks.
- LQI: the Zigbee2MQTT FAQ ("How to interpret RSSI and LQI values?") says a link that
  stays at 40 or above is usually acceptable. Stacks measure LQI differently, so the
  number is shown next to the word.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from radiate.core import Reason

LOW_BATTERY_PCT = 20
WEAK_SIGNAL_LQI = 40
STRONG_SIGNAL_LQI = 100
SCAN_MIN_INTERVAL_S = 10 * 60  # between the starts of two network scans
SCAN_TIMEOUT_S = 3 * 60  # Zigbee2MQTT documents up to 2 min

COORDINATOR = "Coordinator"
# What each kind is called in alerts and the UI, after the room name.
KIND_LABEL = {
    "trv": "TRV",
    "sensor": "room sensor",
    "window": "window sensor",
    "outdoor": "outdoor sensor",
    "router": "router",
    "relay": "boiler relay",
}


@dataclass(frozen=True, slots=True)
class HealthLimits:
    """When a device needs attention. Set in the house file's `monitoring` section."""

    low_battery_pct: float = LOW_BATTERY_PCT
    weak_signal_lqi: float = WEAK_SIGNAL_LQI
    strong_signal_lqi: float = STRONG_SIGNAL_LQI
    # A temperature sensor that has sent nothing for this long is stale: the same
    # limit the core uses (`house.sensor_max_silence_min`, spec 7).
    stale_after_s: float = 3600.0


def signal(lqi: float | None, limits: HealthLimits) -> str | None:
    """`strong`, `fair` or `weak` for a Zigbee2MQTT LQI, or None without one."""
    if lqi is None:
        return None
    if lqi < limits.weak_signal_lqi:
        return "weak"
    if lqi >= limits.strong_signal_lqi:
        return "strong"
    return "fair"


def _num(v: Any) -> float | None:
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return None
    return float(v)


def _str(v: Any) -> str | None:
    return v if isinstance(v, str) and v else None


def _json(payload: bytes | str) -> Any:
    try:
        return json.loads(payload)
    except (ValueError, TypeError):
        return None


def last_seen_wall(value: Any) -> float | None:
    """Zigbee2MQTT's `last_seen` as Unix seconds: ISO 8601 or epoch milliseconds."""
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) / 1000.0
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
        except ValueError:
            return None
    return None


# --- bridge/devices --------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class BridgeDevice:
    """One entry of Zigbee2MQTT's retained `bridge/devices`."""

    name: str
    ieee: str | None = None
    type: str | None = None  # Coordinator, Router, EndDevice
    power: str | None = None  # battery or mains
    model: str | None = None
    vendor: str | None = None
    firmware: str | None = None
    # The properties its Zigbee2MQTT definition exposes (`definition.exposes`, with the
    # `features` of composite and specific types), or None when it lists none.
    exposes: frozenset[str] | None = None


def _exposes(items: Any) -> frozenset[str] | None:
    if not isinstance(items, list):
        return None
    found: set[str] = set()

    def walk(entries: list) -> None:
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            prop = _str(entry.get("property")) or _str(entry.get("name"))
            if prop is not None:
                found.add(prop)
            if isinstance(entry.get("features"), list):
                walk(entry["features"])

    walk(items)
    return frozenset(found) or None


def parse_bridge_devices(payload: bytes | str) -> dict[str, BridgeDevice] | None:
    """The device list by friendly name, or None if the payload is not a list."""
    data = _json(payload)
    if not isinstance(data, list):
        return None
    out: dict[str, BridgeDevice] = {}
    for item in data:
        if not isinstance(item, dict):
            continue
        name = _str(item.get("friendly_name"))
        if name is None:
            continue
        power = _str(item.get("power_source"))
        if power is not None:
            power = "battery" if "battery" in power.lower() else "mains"
        definition = item.get("definition") if isinstance(item.get("definition"), dict) else {}
        out[name] = BridgeDevice(
            name=name,
            ieee=_str(item.get("ieee_address")),
            type=_str(item.get("type")),
            power=power,
            model=_str(definition.get("model")) or _str(item.get("model_id")),
            vendor=_str(definition.get("vendor")) or _str(item.get("manufacturer")),
            firmware=_str(item.get("software_build_id")),
            exposes=_exposes(definition.get("exposes")),
        )
    return out


# --- network map -----------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Route:
    """The node a device talks through: its parent in the mesh."""

    via: str  # friendly name, or "Coordinator"
    via_type: str  # Coordinator or Router
    lqi: float | None = None

    def view(self) -> dict:
        kind = "coordinator" if self.via_type == COORDINATOR else "router"
        return {"via": self.via, "via_kind": kind, "lqi": self.lqi}


@dataclass(frozen=True, slots=True)
class NetworkMap:
    """Parents and children from one raw network map."""

    routes: dict[str, Route] = field(default_factory=dict)  # child name -> parent
    types: dict[str, str] = field(default_factory=dict)  # name -> node type


def parse_network_map(data: Any) -> NetworkMap:
    """Read the `value` of a raw network map: who is whose parent.

    A neighbour entry with relationship 1 (child) gives the neighbour's parent; one with
    relationship 0 (parent) gives the scanned router's. When a device is seen under
    two parents, the link with the better LQI wins.
    """
    if not isinstance(data, dict):
        return NetworkMap()
    names: dict[str, str] = {}
    types: dict[str, str] = {}
    for node in data.get("nodes") or ():
        if not isinstance(node, dict):
            continue
        ieee, name = _str(node.get("ieeeAddr")), _str(node.get("friendlyName"))
        kind = _str(node.get("type")) or "EndDevice"
        if ieee is None:
            continue
        name = COORDINATOR if kind == COORDINATOR else (name or ieee)
        names[ieee] = name
        types[name] = kind
    routes: dict[str, Route] = {}
    for link in data.get("links") or ():
        if not isinstance(link, dict):
            continue
        src = link.get("source") if isinstance(link.get("source"), dict) else {}
        dst = link.get("target") if isinstance(link.get("target"), dict) else {}
        source = names.get(_str(src.get("ieeeAddr")) or _str(link.get("sourceIeeeAddr")) or "")
        target = names.get(_str(dst.get("ieeeAddr")) or _str(link.get("targetIeeeAddr")) or "")
        rel = link.get("relationship")
        if source is None or target is None or source == target:
            continue
        if rel == 1:
            child, parent = source, target
        elif rel == 0:
            child, parent = target, source
        else:
            continue
        lqi = _num(link.get("lqi"))
        if lqi is None:
            lqi = _num(link.get("linkquality"))
        current = routes.get(child)
        if current is None or (lqi or 0) > (current.lqi or 0):
            routes[child] = Route(parent, types.get(parent, "Router"), lqi)
    return NetworkMap(routes=routes, types=types)


class ScanRefused(Exception):
    """A network scan the driver will not start now; `status` is the HTTP status."""

    def __init__(self, status: int, message: str, retry_in_s: float | None = None) -> None:
        super().__init__(message)
        self.status = status
        self.message = message
        self.retry_in_s = retry_in_s


@dataclass(slots=True)
class NetworkScan:
    """One user-requested network map at a time, at most one start every 10 min."""

    min_interval_s: float = SCAN_MIN_INTERVAL_S
    timeout_s: float = SCAN_TIMEOUT_S
    state: str = "idle"  # idle, scanning, done, failed
    started_at: float | None = None
    finished_at: float | None = None  # last scan that gave a map
    error: str | None = None
    map: NetworkMap | None = None
    transaction: str | None = None
    count: int = 0

    def retry_in_s(self, now: float) -> float:
        if self.started_at is None:
            return 0.0
        return max(0.0, self.started_at + self.min_interval_s - now)

    def start(self, now: float) -> str:
        """Start a scan and return its transaction ID, or raise `ScanRefused`."""
        self.check(now)
        if self.state == "scanning":
            raise ScanRefused(409, "a network scan is already running")
        wait = self.retry_in_s(now)
        if wait > 0:
            minutes = max(1, round(wait / 60))
            raise ScanRefused(
                429, f"the network was scanned recently; try again in {minutes} min", wait
            )
        self.count += 1
        self.state = "scanning"
        self.started_at = now
        self.error = None
        self.transaction = f"radiate-{self.count}"
        return self.transaction

    def fail(self, message: str) -> None:
        self.state = "failed"
        self.error = message

    def finish(self, network: NetworkMap, now: float) -> None:
        self.state = "done"
        self.map = network
        self.finished_at = now
        self.error = None

    def response(self, payload: bytes | str, now: float) -> bool:
        """Apply a `bridge/response/networkmap` message. True if it was ours."""
        data = _json(payload)
        if not isinstance(data, dict) or self.state != "scanning":
            return False
        tx = data.get("transaction")
        if tx is not None and tx != self.transaction:
            return False
        if data.get("status") != "ok":
            self.fail(_str(data.get("error")) or "Zigbee2MQTT could not map the network")
            return True
        body = data.get("data") if isinstance(data.get("data"), dict) else {}
        self.finish(parse_network_map(body.get("value")), now)
        return True

    def check(self, now: float) -> None:
        """Give up on a scan that has had no answer for `timeout_s`."""
        if (
            self.state == "scanning"
            and self.started_at is not None
            and now - self.started_at > self.timeout_s
        ):
            self.fail("no answer from Zigbee2MQTT")

    def view(self, now: float, available: bool = True) -> dict:
        self.check(now)
        return {
            "available": available,
            "state": self.state,
            "error": self.error,
            "scanned_s_ago": None if self.finished_at is None else round(now - self.finished_at),
            "retry_in_s": round(self.retry_in_s(now)),
            "min_interval_s": self.min_interval_s,
        }


# --- one device ------------------------------------------------------------------------


@dataclass(slots=True)
class DeviceHealth:
    """What Radiate knows about one device it depends on."""

    id: str  # Zigbee2MQTT friendly name, or "boiler_relay" for the Shelly
    kind: str  # trv, sensor, window, outdoor, router, relay
    room_id: str | None = None
    room_name: str | None = None
    link: str = "zigbee"  # zigbee or wifi
    model: str | None = None
    vendor: str | None = None
    firmware: str | None = None
    power: str | None = None  # battery or mains
    battery_pct: float | None = None
    linkquality: float | None = None
    available: bool | None = None  # None: not known
    last_seen_s: float | None = None  # seconds since anything was heard
    reading_age_s: float | None = None  # temperature sensors: age of the temperature
    temperature_c: float | None = None
    humidity_pct: float | None = None
    valve: dict | None = None  # TRVs: opening, closing, mode, running state, setpoint
    relay: dict | None = None  # boiler relay: heating, store, power
    contact: bool | None = None  # window sensors: True when closed
    route: Route | None = None

    def problems(self, limits: HealthLimits) -> list[tuple[str, str]]:
        """(code, words) for each thing that needs attention, worst first."""
        out: list[tuple[str, str]] = []
        if self.available is False:
            out.append(("device.offline", "not reachable"))
        if self.battery_pct is not None and self.battery_pct <= limits.low_battery_pct:
            out.append(("device.low_battery", "battery low"))
        if self.available is not False:
            if signal(self.linkquality, limits) == "weak":
                out.append(("device.weak_signal", "signal weak"))
            if self.reading_age_s is not None and self.reading_age_s > limits.stale_after_s:
                out.append(("device.stale", "no reading for a while"))
        return out

    def label(self) -> str:
        """ "Lounge TRV", "Outdoor sensor", "Router plug_hall", "Boiler relay"."""
        kind = KIND_LABEL.get(self.kind, self.kind)
        if self.room_name:
            # "Dining room sensor", not "Dining room room sensor".
            if kind.startswith("room ") and self.room_name.lower().endswith(" room"):
                kind = kind.removeprefix("room ")
            return f"{self.room_name} {kind}"
        if self.kind == "router":
            return f"Router {self.id}"
        return kind[0].upper() + kind[1:]

    def view(self, limits: HealthLimits) -> dict:
        problems = self.problems(limits)
        status = "ok"
        if self.available is False:
            status = "offline"
        elif problems:
            status = "attention"
        return {
            "id": self.id,
            "kind": self.kind,
            "label": self.label(),
            "room_id": self.room_id,
            "room_name": self.room_name,
            "link": self.link,
            "model": self.model,
            "vendor": self.vendor,
            "firmware": self.firmware,
            "power": self.power,
            "battery_pct": None if self.battery_pct is None else round(self.battery_pct),
            "battery_low": any(code == "device.low_battery" for code, _ in problems),
            "linkquality": None if self.linkquality is None else round(self.linkquality),
            "signal": signal(self.linkquality, limits),
            "available": self.available,
            "last_seen_s": None if self.last_seen_s is None else round(self.last_seen_s),
            "reading_age_s": None if self.reading_age_s is None else round(self.reading_age_s),
            "temperature_c": self.temperature_c,
            "humidity_pct": self.humidity_pct,
            "valve": self.valve,
            "relay": self.relay,
            "contact": self.contact,
            "route": self.route.view() if self.route else None,
            "status": status,
            "problems": [{"code": code, "message": words} for code, words in problems],
        }


def alerts(devices: list[DeviceHealth], limits: HealthLimits) -> list[Reason]:
    """Alerts for the overview, room name first so the UI can group them.

    A TRV that is not reachable already has `driver.trv_offline`, so it is not repeated.
    """
    out: list[Reason] = []
    for d in devices:
        kind = KIND_LABEL.get(d.kind, d.kind)
        for code, words in d.problems(limits):
            if code == "device.offline" and d.kind == "trv":
                continue
            if d.room_name:
                text = f"{d.room_name}: {kind} {words}"
            elif d.kind == "router":
                text = f"{d.id}: router {words}"
            else:
                text = f"{kind[0].upper()}{kind[1:]} {words}"
            out.append(Reason(code, text, d.room_id))
    return out


def view(
    devices: list[DeviceHealth],
    limits: HealthLimits,
    scan: dict,
    network: dict,
) -> dict:
    """The `GET /api/v1/devices` body."""
    items = [d.view(limits) for d in devices]
    return {
        "limits": {
            "low_battery_pct": limits.low_battery_pct,
            "weak_signal_lqi": limits.weak_signal_lqi,
            "strong_signal_lqi": limits.strong_signal_lqi,
            "stale_after_s": limits.stale_after_s,
        },
        "summary": {
            "total": len(items),
            "attention": sum(1 for i in items if i["status"] != "ok"),
            "offline": sum(1 for i in items if i["status"] == "offline"),
            "low_battery": sum(1 for i in items if i["battery_low"]),
            "weak_signal": sum(
                1 for i in items if i["signal"] == "weak" and i["available"] is not False
            ),
        },
        "network": network,
        "scan": scan,
        "devices": items,
    }
