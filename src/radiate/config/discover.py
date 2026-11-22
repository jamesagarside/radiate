"""Draft a house configuration from Zigbee2MQTT's device list (spec 10, setup).

Pure: `discover(devices, groups)` takes the parsed JSON of the retained
`<base_topic>/bridge/devices` and `<base_topic>/bridge/groups` messages and returns
what it found; `render_yaml` turns that into a commented configuration file. The
broker read is `radiate.drivers.mqtt.read_retained`.

Payload shapes are from the Zigbee2MQTT documentation ("MQTT topics and messages",
"Exposes"): each device has `friendly_name`, `ieee_address`, `type` (Coordinator,
Router, EndDevice), `supported`, `disabled`, `description`, `software_build_id`,
`interview_state` and `definition` (`model`, `vendor`, `exposes`), and `definition`
is null for an unsupported device. Each group has `friendly_name` and `members`
(`ieee_address`, `endpoint`). Firmware limits are from the Zigbee2MQTT TRVZB page.

Room matching rules, in order (see `room_keys`):

1. `area: <name>` or `room: <name>` in the device description.
2. The friendly name, with device words (`trv`, `temp`, `sensor`, `window`, the model
   and so on) and IEEE addresses removed. In a `floor/room/device` path, the deepest
   segment that names a room is used; if two devices of the same kind then share a
   room, the whole path is used instead.
3. The Zigbee2MQTT group the device belongs to, named the same way. Only groups
   with at most one TRV count ("All radiators" says nothing about rooms), and only
   when exactly one such group names a room.

A room needs one TRV or one temperature sensor. Anything else is listed for the user
to place by hand.
"""

from __future__ import annotations

import json
import re
import textwrap
from collections.abc import Iterable
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .site import MqttConfig

KNOWN_TRVS = frozenset({"TRVZB"})
KNOWN_SENSORS = frozenset({"SNZB-02B"})
# Features that let Radiate drive a valve the way it drives a TRVZB (spec 4.5).
TRV_FEATURES = frozenset({"valve_opening_degree", "external_temperature_input"})
FW_OPENING_DEGREE = (1, 1, 4)
FW_EXTERNAL_INPUT = (1, 2, 1)

# Words that describe the device rather than the room it is in.
DEVICE_WORDS = frozenset(
    {
        "trv",
        "trvs",
        "valves",
        "radiators",
        "thermostats",
        "sensors",
        "trvzb",
        "valve",
        "radiator",
        "rad",
        "thermostat",
        "thermostatic",
        "heating",
        "heater",
        "temp",
        "temperature",
        "thermometer",
        "sensor",
        "climate",
        "humidity",
        "hygrometer",
        "th",
        "rh",
        "contact",
        "window",
        "door",
        "magnet",
        "sonoff",
        "snzb",
        "zigbee",
        "z2m",
        "group",
    }
)
OUTDOOR_WORDS = frozenset({"outdoor", "outdoors", "outside", "exterior", "external", "garden"})
WET_ROOM_WORDS = frozenset({"bathroom", "bath", "shower", "ensuite", "en", "wetroom", "wet"})
_IEEE = re.compile(r"^0x[0-9a-f]{4,}$")
_AREA = re.compile(r"\b(?:area|room)\s*[:=]\s*([^\n,;]+)", re.IGNORECASE)
_VERSION = re.compile(r"^\s*v?(\d+)\.(\d+)(?:\.(\d+))?")
_MAX_ID = 40

DEFAULT_SCHEDULE = {
    "weekdays": "06:30/20 08:30/16 17:00/20 22:30/16",
    "weekend": "08:00/20 22:30/16",
}


class DiscoveryError(ValueError):
    pass


class Kind(Enum):
    TRV = "TRV"
    SENSOR = "sensor"
    CONTACT = "window"
    OTHER = "other"


@dataclass(frozen=True, slots=True)
class Z2mDevice:
    """One entry of `bridge/devices`, reduced to what discovery needs."""

    name: str
    ieee: str
    kind: Kind
    model: str = ""
    vendor: str = ""
    description: str = ""
    features: frozenset[str] = frozenset()
    software_build_id: str | None = None
    supported: bool = True

    @property
    def label(self) -> str:
        made = " ".join(p for p in (self.vendor, self.model) if p)
        if not self.supported:
            made = "not supported by Zigbee2MQTT"
        return f"{self.name} ({made})" if made else self.name


@dataclass(frozen=True, slots=True)
class DraftRoom:
    id: str
    trv: Z2mDevice | None = None
    sensor: Z2mDevice | None = None
    window: Z2mDevice | None = None

    @property
    def role(self) -> str:
        if self.trv is None:
            return "passive"
        return "normal" if self.sensor is not None else "internal_sensor_only"

    @property
    def name(self) -> str:
        return self.id.replace("_", " ").capitalize()

    @property
    def wet(self) -> bool:
        """A bathroom-like room whose humidity drives shower detection."""
        return (
            self.trv is not None
            and self.sensor is not None
            and "humidity" in self.sensor.features
            and bool(set(_words(self.id)) & WET_ROOM_WORDS)
        )


@dataclass(frozen=True, slots=True)
class Unplaced:
    device: Z2mDevice
    reason: str


@dataclass(frozen=True, slots=True)
class Discovery:
    rooms: tuple[DraftRoom, ...]
    outdoor: Z2mDevice | None = None
    unplaced: tuple[Unplaced, ...] = ()
    ignored: tuple[Z2mDevice, ...] = ()
    warnings: tuple[str, ...] = ()

    @property
    def heated_rooms(self) -> tuple[DraftRoom, ...]:
        return tuple(r for r in self.rooms if r.trv is not None)

    @property
    def passive_rooms(self) -> tuple[DraftRoom, ...]:
        return tuple(r for r in self.rooms if r.trv is None)

    @property
    def pilot(self) -> str | None:
        """The room whose valve is actuated first.

        The first normal room with a TRVZB on current firmware, preferring one that is
        not a bathroom (shower spikes make a poor first test), else the first normal
        room, else the first room with a TRV.
        """
        heated = self.heated_rooms
        normal = [r for r in heated if r.role == "normal"]
        ready = [
            r
            for r in normal
            if r.trv is not None and r.trv.model in KNOWN_TRVS and not firmware_warnings(r.trv)
        ]
        dry = [r for r in ready if not r.wet]
        chosen = dry or ready or normal or list(heated)
        return chosen[0].id if chosen else None


# --- parsing ---------------------------------------------------------------------------


def parse_payload(raw: bytes | str) -> Any:
    try:
        return json.loads(raw)
    except (ValueError, TypeError) as err:
        raise DiscoveryError(f"not valid JSON: {err}") from None


def exposed_features(exposes: Any) -> frozenset[str]:
    """Every `property` (or `name`) in an exposes list, including nested features."""
    found: set[str] = set()

    def walk(items: Any) -> None:
        if not isinstance(items, list):
            return
        for item in items:
            if not isinstance(item, dict):
                continue
            key = item.get("property") or item.get("name")
            if isinstance(key, str):
                found.add(key)
            walk(item.get("features"))

    walk(exposes)
    return frozenset(found)


def classify(model: str, features: frozenset[str]) -> Kind:
    if model in KNOWN_TRVS or features & TRV_FEATURES:
        return Kind.TRV
    if "contact" in features:
        return Kind.CONTACT
    if model in KNOWN_SENSORS or "temperature" in features:
        return Kind.SENSOR
    return Kind.OTHER


def parse_devices(payload: Any) -> tuple[list[Z2mDevice], list[str]]:
    """The devices in a `bridge/devices` payload, and warnings about the list itself."""
    if not isinstance(payload, list):
        raise DiscoveryError("bridge/devices: expected a JSON array of devices")
    devices: list[Z2mDevice] = []
    warnings: list[str] = []
    for item in payload:
        if not isinstance(item, dict) or item.get("type") == "Coordinator":
            continue
        name = item.get("friendly_name")
        if not isinstance(name, str) or not name.strip():
            continue
        if item.get("disabled") is True:
            warnings.append(f"{name}: disabled in Zigbee2MQTT, so it was skipped.")
            continue
        state = item.get("interview_state")
        if state not in (None, "SUCCESSFUL") or item.get("interview_completed") is False:
            warnings.append(
                f"{name}: Zigbee2MQTT has not finished interviewing it. "
                "Run discover again once the interview completes."
            )
        definition = item.get("definition") if isinstance(item.get("definition"), dict) else {}
        model = _text(definition.get("model"))
        features = exposed_features(definition.get("exposes"))
        supported = item.get("supported", True) is not False and bool(definition)
        kind = classify(model, features) if supported else Kind.OTHER
        build = item.get("software_build_id")
        devices.append(
            Z2mDevice(
                name=name,
                ieee=_text(item.get("ieee_address")),
                kind=kind,
                model=model,
                vendor=_text(definition.get("vendor")),
                description=_text(item.get("description")),
                features=features,
                software_build_id=build if isinstance(build, str) and build.strip() else None,
                supported=supported,
            )
        )
    return devices, warnings


def parse_groups(payload: Any) -> dict[str, list[str]]:
    """IEEE address to the names of the groups the device is a member of."""
    if payload is None:
        return {}
    if not isinstance(payload, list):
        raise DiscoveryError("bridge/groups: expected a JSON array of groups")
    out: dict[str, list[str]] = {}
    for group in payload:
        if not isinstance(group, dict) or not isinstance(group.get("friendly_name"), str):
            continue
        for member in group.get("members") or []:
            if isinstance(member, dict) and isinstance(member.get("ieee_address"), str):
                out.setdefault(member["ieee_address"], []).append(group["friendly_name"])
    return out


def _text(v: Any) -> str:
    return v.strip() if isinstance(v, str) else ""


def parse_version(build: str | None) -> tuple[int, int, int] | None:
    m = _VERSION.match(build or "")
    if not m:
        return None
    return int(m.group(1)), int(m.group(2)), int(m.group(3) or 0)


# --- room matching ---------------------------------------------------------------------


def _words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _as_id(words: Iterable[str]) -> str | None:
    words = list(words)
    if not words or all(w.isdigit() for w in words):
        return None
    rid = "_".join(words)[:_MAX_ID].rstrip("_")
    return rid or None


def room_keys(name: str, noise: Iterable[str] = ()) -> tuple[str, ...]:
    """Candidate room ids from a friendly name, the preferred one first.

    Device words, `noise` (for example the model, `snzb-02b`) and IEEE addresses are
    removed. A name with `/` is a path: the first candidate is its deepest segment that
    still has words, the second the whole path. An empty tuple means the name says
    nothing about the room.
    """
    drop = DEVICE_WORDS | {w for n in noise for w in _words(n)}
    segments = []
    for seg in name.split("/"):
        words = [w for w in _words(seg) if w not in drop and not _IEEE.match(w)]
        if words:
            segments.append(words)
    if not segments:
        return ()
    keys = [_as_id(segments[-1]), _as_id(w for seg in segments for w in seg)]
    out: list[str] = []
    for k in keys:
        if k and k not in out:
            out.append(k)
    return tuple(out)


def area_key(description: str) -> str | None:
    """Room id from `area: Bedroom 1` or `room: Bedroom 1` in a device description."""
    m = _AREA.search(description)
    return _as_id(_words(m.group(1))) if m else None


def is_outdoor(device: Z2mDevice) -> bool:
    """A temperature sensor named as outdoors. "Garden room" is a room, not outdoors."""
    words = set(_words(device.name)) | set(_words(area_key(device.description) or ""))
    return bool(words & OUTDOOR_WORDS) and "room" not in words


@dataclass(slots=True)
class _Candidate:
    device: Z2mDevice
    keys: tuple[str, ...]
    choice: int = 0

    @property
    def room(self) -> str:
        return self.keys[self.choice]


def _candidates_for(device: Z2mDevice, groups: dict[str, list[str]]) -> tuple[str, ...]:
    area = area_key(device.description)
    if area:
        return (area,)
    keys = room_keys(device.name, noise=(device.model,))
    if keys:
        return keys
    group_keys = {k for g in groups.get(device.ieee, []) for k in room_keys(g)[:1]}
    return (group_keys.pop(),) if len(group_keys) == 1 else ()


def _room_groups(devices: list[Z2mDevice], groups: dict[str, list[str]]) -> dict[str, list[str]]:
    """Group membership, keeping only groups that could be a room: at most one TRV.

    A group such as "All radiators" holds every valve and says nothing about rooms.
    """
    trvs: dict[str, int] = {}
    for d in devices:
        if d.kind is Kind.TRV:
            for g in groups.get(d.ieee, []):
                trvs[g] = trvs.get(g, 0) + 1
    return {ieee: [g for g in names if trvs.get(g, 0) <= 1] for ieee, names in groups.items()}


def _natural(text: str) -> list[Any]:
    return [int(p) if p.isdigit() else p for p in re.split(r"(\d+)", text.lower())]


def assign_rooms(
    devices: list[Z2mDevice], groups: dict[str, list[str]] | None = None
) -> tuple[list[DraftRoom], list[Unplaced]]:
    """Group TRVs, temperature sensors and contact sensors into rooms."""
    groups = _room_groups(devices, groups or {})
    unplaced: list[Unplaced] = []
    cands: list[_Candidate] = []
    for dev in sorted(devices, key=lambda d: _natural(d.name)):
        keys = _candidates_for(dev, groups)
        if keys:
            cands.append(_Candidate(dev, keys))
        else:
            unplaced.append(Unplaced(dev, "its name does not say which room it is in"))

    # Two devices of one kind in one room: use the whole path for both, and for every
    # device on that path, so `up/bath/trv` stays with `up/bath/temp`. Any clash left
    # after that keeps the first device. Radiate drives one TRV, one sensor and one
    # window per room.
    kinds = (Kind.TRV, Kind.SENSOR, Kind.CONTACT)
    for kind in kinds:
        for c in _clashing([c for c in cands if c.device.kind is kind]):
            if len(c.keys) > 1:
                c.choice = 1
    widened = {c.room for c in cands if c.choice == 1}
    for c in cands:
        if len(c.keys) > 1 and c.keys[1] in widened:
            c.choice = 1
    for kind in kinds:
        mine = [c for c in cands if c.device.kind is kind]
        seen: dict[str, _Candidate] = {}
        for c in mine:
            if c.room in seen:
                unplaced.append(
                    Unplaced(
                        c.device,
                        f"room {c.room} already has {kind.value} {seen[c.room].device.name}, "
                        f"and Radiate uses one {kind.value} per room",
                    )
                )
                cands.remove(c)
            else:
                seen[c.room] = c

    rooms: dict[str, dict[Kind, Z2mDevice]] = {}
    for c in cands:
        if c.device.kind is not Kind.CONTACT:
            rooms.setdefault(c.room, {})[c.device.kind] = c.device
    for c in cands:
        if c.device.kind is Kind.CONTACT:
            if c.room in rooms:
                rooms[c.room][Kind.CONTACT] = c.device
            else:
                unplaced.append(Unplaced(c.device, f"no TRV or sensor found for room {c.room}"))

    drafts = [
        DraftRoom(
            id=rid,
            trv=found.get(Kind.TRV),
            sensor=found.get(Kind.SENSOR),
            window=found.get(Kind.CONTACT),
        )
        for rid, found in rooms.items()
    ]
    drafts.sort(key=lambda r: _natural(r.id))
    return drafts, unplaced


def _clashing(cands: list[_Candidate]) -> list[_Candidate]:
    by_room: dict[str, list[_Candidate]] = {}
    for c in cands:
        by_room.setdefault(c.room, []).append(c)
    return [c for group in by_room.values() if len(group) > 1 for c in group]


def firmware_warnings(device: Z2mDevice, uses_external: bool = True) -> list[str]:
    """Warnings for a TRVZB's firmware. `uses_external`: the room sends the TRV its
    room temperature (a normal room); internal-sensor rooms do not need 1.2.1."""
    if device.model not in KNOWN_TRVS:
        return []
    version = parse_version(device.software_build_id)
    if version is None:
        return [
            f"{device.name}: Zigbee2MQTT did not report its firmware version. "
            + (
                "Check it is 1.2.1 or later before running live."
                if uses_external
                else "Check it is 1.1.4 or later before running live."
            )
        ]
    shown = device.software_build_id
    if version < FW_OPENING_DEGREE:
        return [
            f"{device.name}: TRVZB firmware {shown} is older than 1.1.4, so it has no "
            "valve opening or closing degree and Radiate cannot regulate it. "
            "Update it in Zigbee2MQTT (OTA) first."
        ]
    if version < FW_EXTERNAL_INPUT and uses_external:
        return [
            f"{device.name}: TRVZB firmware {shown} is older than 1.2.1, so it ignores "
            "external_temperature_input and regulates on its own sensor. "
            "Update it in Zigbee2MQTT (OTA) first."
        ]
    return []


def discover(devices_payload: Any, groups_payload: Any = None) -> Discovery:
    """Find TRVs, sensors and windows in Zigbee2MQTT's lists and group them into rooms."""
    devices, warnings = parse_devices(devices_payload)
    groups = parse_groups(groups_payload)

    relevant = [d for d in devices if d.kind is not Kind.OTHER]
    ignored = tuple(
        sorted((d for d in devices if d.kind is Kind.OTHER), key=lambda d: _natural(d.name))
    )

    outdoor_candidates = sorted(
        (d for d in relevant if d.kind is Kind.SENSOR and is_outdoor(d)),
        key=lambda d: _natural(d.name),
    )
    outdoor = outdoor_candidates[0] if outdoor_candidates else None
    relevant = [d for d in relevant if d not in outdoor_candidates]

    rooms, unplaced = assign_rooms(relevant, groups)
    unplaced += [
        Unplaced(d, f"another outdoor sensor; {outdoor_candidates[0].name} was used")
        for d in outdoor_candidates[1:]
    ]

    for d in sorted((d for d in devices if d.kind is Kind.TRV), key=lambda d: _natural(d.name)):
        if d.model not in KNOWN_TRVS:
            warnings.append(
                f"{d.label}: exposes {', '.join(sorted(d.features & TRV_FEATURES))} but is "
                "not a Sonoff TRVZB. Radiate is written and tested for the TRVZB; check its "
                "attributes match before you let Radiate actuate it."
            )
        internal = any(r.trv is d and r.role == "internal_sensor_only" for r in rooms)
        warnings.extend(firmware_warnings(d, uses_external=not internal))
    for d in ignored:
        if "occupied_heating_setpoint" in d.features:
            warnings.append(
                f"{d.label}: a thermostat without valve_opening_degree or "
                "external_temperature_input. Radiate cannot drive it, so it was left out."
            )
    if not any(r.trv for r in rooms):
        warnings.append("No TRVs found, so there is no room for Radiate to heat.")

    unplaced.sort(key=lambda u: _natural(u.device.name))
    return Discovery(
        rooms=tuple(rooms),
        outdoor=outdoor,
        unplaced=tuple(unplaced),
        ignored=ignored,
        warnings=tuple(warnings),
    )


# --- rendering -------------------------------------------------------------------------

_PLAIN = re.compile(r"^(?:[A-Za-z][A-Za-z0-9 _./-]*|\d+\.\d+\.\d+\.\d+)$")  # or an IPv4 address
_YAML_WORDS = frozenset({"y", "n", "yes", "no", "on", "off", "true", "false", "null"})


def scalar(text: str) -> str:
    """A YAML scalar for `text`: plain when that is unambiguous, else double-quoted."""
    if _PLAIN.match(text) and text.lower() not in _YAML_WORDS and not text.endswith(" "):
        return text
    return json.dumps(text, ensure_ascii=False)


def _comment_text(text: str) -> str:
    return re.sub(r"[\x00-\x1f\x7f]", " ", text)


def _comment(text: str, indent: str = "", width: int = 88) -> list[str]:
    lines = textwrap.wrap(
        _comment_text(text), width=width - len(indent) - 2, break_on_hyphens=False
    )
    return [f"{indent}# {line}" for line in lines] or [f"{indent}#"]


def _bullet(text: str, indent: str = "") -> list[str]:
    lines = textwrap.wrap(
        _comment_text(text),
        width=86 - len(indent),
        initial_indent=" - ",
        subsequent_indent="   ",
        break_on_hyphens=False,
    )
    return [f"{indent}#{line}" for line in lines]


@dataclass(frozen=True, slots=True)
class RenderOptions:
    mqtt: MqttConfig = field(default_factory=MqttConfig)
    source: str = "Zigbee2MQTT"
    password_env: str = "RADIATE_MQTT_PASSWORD"
    with_password: bool = False


def _room_lines(room: DraftRoom, pilot: str | None, prefix: str = "  ") -> list[str]:
    out = [f"{prefix}- id: {scalar(room.id)}", f"{prefix}  name: {scalar(room.name)}"]
    if room.role == "internal_sensor_only":
        out.append(f"{prefix}  role: internal_sensor_only   # no room sensor: uses the TRV's own")
    elif room.role == "passive":
        out.append(f"{prefix}  role: passive")
    if room.trv is not None:
        out.append(f"{prefix}  trv: {scalar(room.trv.name)}")
    if room.sensor is not None:
        out.append(f"{prefix}  sensor: {scalar(room.sensor.name)}")
    if room.window is not None:
        out.append(f"{prefix}  window: {scalar(room.window.name)}")
    if room.wet:
        out.append(f"{prefix}  humidity: true            # shower detection")
    if room.trv is not None:
        out.append(f"{prefix}  schedule: default")
    if room.id == pilot:
        out.append(f"{prefix}  actuate: true             # pilot valve: test one TRV first")
    return out


def render_yaml(found: Discovery, options: RenderOptions | None = None) -> str:
    """A commented configuration file for what `discover` found."""
    opts = options or RenderOptions()
    mqtt = opts.mqtt
    pilot = found.pilot
    out: list[str] = [
        f"# Radiate configuration drafted by `radiate discover` from {_comment_text(opts.source)}.",
        "# Check every room, set the secrets, then validate it:",
        "#   radiate check-config radiate.yaml",
    ]
    if found.warnings:
        out += ["#", "# Warnings:"]
        for w in found.warnings:
            out += _bullet(w)
    out += [
        "",
        "house:",
        "  timezone: Europe/London",
        "  # Dry run reads every device but writes nothing: no valve settings, no relay",
        "  # switching. Leave it on until you have watched Radiate's decisions for a few",
        "  # days.",
        "  dry_run: true",
    ]
    if found.outdoor is not None:
        out.append(f"  outdoor_sensor: {scalar(found.outdoor.name)}")
    else:
        out.append(
            "  # outdoor_sensor: outdoor_temperature   # optional; without one 5 °C is assumed"
        )
    out += [
        "  data_dir: ./data                        # SQLite state and the export queue",
        "",
        "# The MQTT broker Zigbee2MQTT publishes to. ${NAME} is read from the environment,",
        "# so the password stays out of this file.",
        "mqtt:",
        f"  host: {scalar(mqtt.host)}",
        f"  port: {mqtt.port}",
    ]
    secret = f"${{{opts.password_env}}}"
    if mqtt.username:
        out += [f"  username: {scalar(mqtt.username)}", f"  password: {secret}"]
    elif opts.with_password:
        out.append(f"  password: {secret}")
    else:
        out += ["  # username: radiate", f"  # password: {secret}"]
    out.append(f"  base_topic: {scalar(mqtt.base_topic)}")
    if mqtt.tls:
        out.append("  tls: true")
    out += [
        "",
        "# The boiler relay. Uncomment once a Shelly 2PM Gen4 has been wired at the boiler",
        "# by a qualified engineer, and install its watchdog before setting dry_run: false",
        "# (see docs/deployment.md). Without this section Radiate does not switch the boiler.",
        "# shelly:",
        "#   host: 192.0.2.10",
        "#   password: ${RADIATE_SHELLY_PASSWORD}",
        "#   heating_switch: 0           # central heating demand",
        "#   store_switch: 1             # hot-water store",
        "",
        "# Boiler guards (spec 5.1). Keep these unless the boiler's manual says otherwise.",
        "boiler:",
        "  min_burn_min: 8",
        "  min_off_min: 10",
        "  max_starts_per_hour: 3",
        "  # output_kw: 13",
        "",
        "trv:",
        "  schedule_mirror: true       # each TRV keeps the schedule if Radiate stops",
        "",
        "# One schedule for every room to start with. Add more and set `schedule` per room.",
        "schedules:",
        "  default:",
    ]
    out += [f'    {day}: "{spec}"' for day, spec in DEFAULT_SCHEDULE.items()]
    out += [
        "",
        "# Rooms found from device names. Check each one. Add `heat_source: episodic` (open",
        "# fire, wood burner) or `heat_source: continuous` (range cooker) to rooms with",
        "# another heat source, so learning pauses while it is lit.",
    ]
    heated = found.heated_rooms
    if heated:
        out.append("rooms:")
        for room in heated:
            out += _room_lines(room, pilot)
    else:
        out.append("rooms: []   # no TRVs found; add rooms by hand")
    if found.passive_rooms:
        out += [
            "",
            *_comment(
                "Sensors with no TRV. Discover cannot tell an unvalved radiator from a "
                "room with no radiator, so check each one before you uncomment it. Keep "
                "role: passive only if the room's radiator has no controllable valve, "
                "such as a bypass radiator left open. For a room with no radiator, such as "
                "a landing or the room the boiler is in, use role: unheated: Radiate "
                "records its temperature but never counts it as heat arriving.",
                "  ",
            ),
        ]
        for room in found.passive_rooms:
            out += ["  # " + line[2:] for line in _room_lines(room, None)]
    if found.unplaced:
        out += ["", "# Devices discover could not place. Add them to a room by hand:"]
        for u in found.unplaced:
            out += _bullet(f"{u.device.label}, {u.device.kind.value}: {u.reason}")
    if found.ignored:
        out += ["", "# Other devices, not used by Radiate:"]
        for d in found.ignored:
            out += _bullet(d.label)
    return "\n".join(out) + "\n"
