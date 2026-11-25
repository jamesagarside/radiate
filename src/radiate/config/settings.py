"""Every house-file setting, described once, and the settings saved from the web UI.

The registry (`SECTIONS`) holds one `Setting` per house-file key: its type, unit,
range, help text, whether it needs a restart, whether it is a secret and whether
changing it can make Radiate write to the boiler or the valves. The web UI's Settings
view is drawn from it, and `tests/config/test_settings.py` fails when the house file
has a key the registry doesn't describe, so a new key appears in the UI by adding one
entry here.

Saved settings work like the saved household (`radiate.config.saved`): the house file
may be read-only, so the web UI saves what it changes to `<data_dir>/settings.yaml`,
and `merge_settings` lays those values over the house file before `parse_site` checks
the result with the same rules as the house file itself. A saved value of None means
"not set", so an optional key the house file sets can be cleared.

Paths are dotted, as in the house file: `boiler.min_burn_min`, `balancing`. A room's
settings are `rooms.<id>.<key>`, matched to the house file's `rooms` list by `id`.
Rooms can't be added or removed here; the house file lists them.

To add a section (for example `auth` or `export.otlp`), parse it in
`radiate.config.site` as usual, then add a `Section` to `SECTIONS` with a `Setting`
for each key. Mark secrets `secret=True`: the API never returns their values, only
whether one is set. Leave `restart=True` (the default) unless the server applies the
key while running; `radiate.server.settings.register_live` is the hook for that.

Pure: no I/O. Reading and writing the file is `radiate.config.saved`.
"""

from __future__ import annotations

import copy
import re
from dataclasses import dataclass
from typing import Any

from radiate.core.estimator import MEMORY_DAYS_MAX, MEMORY_DAYS_MIN
from radiate.core.outdoor import DEFAULT_STALE_AFTER_S
from radiate.core.types import BoilerConfig, StoreConfig, SuggestionConfig

# Kinds of value, and how the web UI edits each one.
KINDS = ("number", "integer", "bool", "text", "choice", "list", "use", "secret")
SOURCES = ("app", "house_file", "default")
_ENV = re.compile(r"\$\{([A-Z0-9_]+)\}")
_ROOM = re.compile(r"^rooms\[(\d+)\]")


@dataclass(frozen=True, slots=True)
class Setting:
    """One house-file key.

    `path` is dotted from the top of the house file, or, in a per-room section, the
    key inside a room (`trv_bias_k`). `default` is what applies when neither the house
    file nor the web UI sets it; None when the key is optional or the default depends
    on other settings (then `help` says what happens).
    """

    path: str
    label: str
    kind: str
    help: str
    unit: str | None = None
    lo: float | None = None
    hi: float | None = None
    step: float | None = None
    choices: tuple[str, ...] = ()
    # `choices` taken from the house file instead: "schedules" (the schedule names).
    choices_from: str | None = None
    default: Any = None
    restart: bool = True  # used from the next start; False: the server applies it live
    secret: bool = False  # write-only: the API says whether it is set, never its value
    hardware: bool = False  # changing it can make Radiate write to the boiler or valves
    editable: bool = True  # False: shown, but only the house file can set it
    optional: bool = False  # can be cleared (not set)


@dataclass(frozen=True, slots=True)
class Section:
    """A group of settings, as the web UI shows them.

    `id` is the house-file key the section's settings sit under (`boiler`,
    `export.otlp`), or a name when they sit in several (`learning`). A `per_room`
    section repeats its settings for every room in the house file. A section with a
    `link` and no settings is edited elsewhere in the web UI (the household setup,
    the schedules); `covers` lists the house-file keys it stands for.
    """

    id: str
    title: str
    help: str
    settings: tuple[Setting, ...] = ()
    per_room: bool = False
    link: str | None = None
    guide: str | None = None  # a Guide section, such as "modes"
    covers: tuple[str, ...] = ()


_B, _S, _Q = BoilerConfig(), StoreConfig(), SuggestionConfig()


def _hhmm(minute: int) -> str:
    return f"{minute // 60:02d}:{minute % 60:02d}"


def _num(path, label, help, unit, lo, hi, default, step=None, **kw) -> Setting:
    return Setting(path, label, "number", help, unit, lo, hi, step, default=default, **kw)


def _int(path, label, help, lo, hi, default, unit=None, **kw) -> Setting:
    return Setting(path, label, "integer", help, unit, lo, hi, 1, default=default, **kw)


def _bool(path, label, help, default, **kw) -> Setting:
    return Setting(path, label, "bool", help, default=default, **kw)


def _text(path, label, help, default=None, **kw) -> Setting:
    return Setting(path, label, "text", help, default=default, **kw)


def _choice(path, label, help, choices, default, **kw) -> Setting:
    return Setting(path, label, "choice", help, choices=tuple(choices), default=default, **kw)


SECTIONS: list[Section] = [
    Section(
        "house",
        "House",
        "Where Radiate is, whether it writes to devices, and where the outdoor "
        "temperature comes from.",
        (
            _bool(
                "house.dry_run",
                "Dry run",
                "Read every device and decide, but write nothing to the valves or the "
                "boiler relay. Intended writes are logged.",
                True,
                hardware=True,
            ),
            _text(
                "house.timezone",
                "Time zone",
                "The house's local time zone, for schedules. An IANA name such as Europe/London.",
                "Europe/London",
            ),
            _text(
                "house.outdoor_sensor",
                "Outdoor sensor",
                "The Zigbee2MQTT name of an outdoor temperature sensor. Leave it empty "
                "without one.",
                optional=True,
            ),
            _choice(
                "house.outdoor_source",
                "Outdoor temperature from",
                "Zigbee sensor uses the sensor above, Home Assistant the reading the "
                "Radiate integration sends, and Both prefers the sensor.",
                ("zigbee", "home_assistant", "both"),
                "zigbee",
                restart=False,
            ),
            _num(
                "house.outdoor_stale_after_min",
                "Outdoor reading too old after",
                "A Home Assistant outdoor reading older than this counts as missing.",
                "min",
                30,
                1440,
                DEFAULT_STALE_AFTER_S / 60,
                restart=False,
            ),
            _num(
                "house.sensor_max_silence_min",
                "Sensor silent for",
                "A battery sensor's last reading stands for this long before it counts as stale.",
                "min",
                10,
                180,
                60,
            ),
            _num(
                "house.history_days",
                "History kept",
                "Days of recorded ticks kept for replay and for learning after a reset. "
                "0 turns recording off.",
                "days",
                0,
                90,
                14,
            ),
            _num(
                "house.fire_flag_hours",
                "Fire lit lasts",
                "How long the Fire lit switch on a room lasts. It also ends at midnight.",
                "h",
                0.5,
                24,
                6,
                step=0.5,
                restart=False,
            ),
            _text(
                "house.data_dir",
                "Data directory",
                "Where Radiate keeps its state, the saved household and these settings. "
                "Only the house file or --data-dir can set it.",
                "./data",
                editable=False,
            ),
        ),
        guide="problems",
    ),
    Section(
        "boiler",
        "Boiler",
        "How the burner is protected and how rooms share a burn. The burner guard "
        "limits keep an oil burner from short burns.",
        (
            _num(
                "boiler.min_burn_min",
                "Minimum burn",
                "Once lit, the burner runs at least this long.",
                "min",
                4,
                20,
                _B.min_burn_s / 60,
                restart=False,
            ),
            _num(
                "boiler.min_off_min",
                "Minimum off",
                "After a burn, the burner rests at least this long.",
                "min",
                5,
                30,
                _B.min_off_s / 60,
                restart=False,
            ),
            _int(
                "boiler.max_starts_per_hour",
                "Starts an hour",
                "The most times the burner may start in any hour.",
                1,
                6,
                _B.max_starts_per_hour,
                restart=False,
            ),
            _num(
                "boiler.valve_lead_s",
                "Valve lead",
                "Valves open this long before the burner fires, so the water has somewhere to go.",
                "s",
                30,
                300,
                _B.valve_lead_s,
                restart=False,
            ),
            _choice(
                "boiler.demand_mode",
                "Demand mode",
                "The mode Radiate starts in. Eco pools rooms into fewer, longer burns; "
                "Comfort holds every room at its target. The Eco and Comfort control "
                "in the header changes it for now.",
                ("eco", "comfort"),
                _B.demand_mode.value,
                restart=False,
            ),
            _num(
                "boiler.comfort_limit_k",
                "Comfort limit",
                "In comfort, a calling room fires the burner once it is this far below its target.",
                "K",
                0.2,
                1.5,
                _B.comfort_limit_k,
                step=0.1,
                restart=False,
            ),
            _num(
                "boiler.eco_limit_k",
                "Eco limit",
                "In eco, the most a calling room waits below its target for other rooms "
                "to share a burn. At least the comfort limit.",
                "K",
                0.5,
                3,
                _B.eco_limit_k,
                step=0.1,
                restart=False,
            ),
            _num(
                "boiler.damp_margin_k",
                "Damp margin",
                "In eco, a room set back starts a burn on its own this far above the "
                "12 °C damp floor.",
                "K",
                0,
                1,
                _B.damp_margin_k,
                step=0.1,
                restart=False,
            ),
            _num(
                "boiler.frost_c",
                "Frost protection",
                "Every room is kept at least this warm, whatever the mode.",
                "°C",
                5,
                10,
                _B.frost_c,
                step=0.5,
                restart=False,
            ),
            _num(
                "boiler.output_kw",
                "Boiler output",
                "The boiler's heat output, from its data plate.",
                "kW",
                3,
                70,
                _B.output_kw,
                restart=False,
            ),
            _num(
                "boiler.nozzle_lph",
                "Nozzle rating",
                "Litres of oil an hour, from the service sheet. Needed for oil "
                "accounting and savings.",
                "L/h",
                0.1,
                10,
                None,
                step=0.01,
                optional=True,
                restart=False,
            ),
        ),
        guide="modes",
    ),
    Section(
        "store",
        "Hot water",
        "When the boiler keeps the hot-water store hot.",
        (
            Setting(
                "store.windows",
                "Hot water times",
                "list",
                "When the store is kept hot each day: up to 4 windows, such as "
                "06:00-07:30, 17:00-21:00.",
                default=[f"{_hhmm(a)}-{_hhmm(b)}" for a, b in _S.windows],
                restart=False,
            ),
            _num(
                "store.recovery_min",
                "Store recovery",
                "How long the store takes to heat up once its window starts. Room "
                "learning pauses meanwhile.",
                "min",
                0,
                120,
                _S.recovery_s / 60,
                restart=False,
            ),
            _bool(
                "store.priority_over_heating",
                "Hot water first",
                "Heat the store before the radiators when both want the burner.",
                _S.priority_over_heating,
                restart=False,
            ),
        ),
        guide="hot-water",
    ),
    Section(
        "shelly",
        "Boiler relay",
        "The Shelly that switches the boiler. Without a host, Radiate doesn't switch the boiler.",
        (
            _text(
                "shelly.host",
                "Host",
                "The relay's address on your network, such as 192.0.2.10.",
                hardware=True,
            ),
            Setting(
                "shelly.password",
                "Password",
                "secret",
                "The relay's password, if it has one.",
                secret=True,
                optional=True,
            ),
            _int(
                "shelly.heating_switch",
                "Heating channel",
                "The relay channel wired to central heating demand, 0 to 3.",
                0,
                3,
                0,
                hardware=True,
            ),
            _int(
                "shelly.store_switch",
                "Hot water channel",
                "The relay channel wired to the hot-water store, 0 to 3.",
                0,
                3,
                1,
                hardware=True,
            ),
            _num(
                "shelly.auto_off_min",
                "Relay auto off",
                "The relay switches itself off after this long without a command, so "
                "it never stays on.",
                "min",
                15,
                240,
                120,
                hardware=True,
            ),
            _bool(
                "shelly.burner_metering",
                "Burner metering",
                "Tell when the burner fires from the relay's power reading.",
                True,
            ),
            _num(
                "shelly.burner_threshold_w",
                "Firing above",
                "Power at or above this means the burner is firing.",
                "W",
                10,
                3000,
                100,
            ),
            _num(
                "shelly.burner_hysteresis_w",
                "Hysteresis",
                "The burner counts as stopped below the threshold less this.",
                "W",
                0,
                1000,
                20,
            ),
        ),
        guide="devices",
    ),
    Section(
        "mqtt",
        "Zigbee2MQTT",
        "The MQTT broker Zigbee2MQTT publishes to.",
        (
            _text("mqtt.host", "Host", "The broker's address.", "localhost"),
            _int("mqtt.port", "Port", "The broker's port.", 1, 65535, 1883),
            _text("mqtt.username", "Username", "Leave empty without one.", optional=True),
            Setting(
                "mqtt.password",
                "Password",
                "secret",
                "The broker password, if it has one.",
                secret=True,
                optional=True,
            ),
            _text(
                "mqtt.base_topic",
                "Base topic",
                "Zigbee2MQTT's base topic.",
                "zigbee2mqtt",
            ),
            _text("mqtt.client_id", "Client ID", "Radiate's MQTT client ID.", "radiate"),
            _bool("mqtt.tls", "TLS", "Connect to the broker over TLS.", False),
        ),
        guide="devices",
    ),
    Section(
        "trv",
        "Valves",
        "How Radiate works with the radiator valves.",
        (
            _bool(
                "trv.schedule_mirror",
                "Schedule mirror",
                "Write each room's week into its valve, so the valve follows it if Radiate stops.",
                True,
                hardware=True,
            ),
            _num(
                "trv.external_keepalive_min",
                "Room reading resent every",
                "How often the room sensor's reading is resent to a valve. The valve "
                "goes back to its own sensor after 2 h without one.",
                "min",
                5,
                60,
                25,
            ),
        ),
        guide="rooms",
    ),
    Section(
        "learning",
        "Learning and balancing",
        "How Radiate learns each room and shares heat between them.",
        (
            _bool(
                "balancing",
                "Balancing",
                "Limit how far each valve opens so every room warms up together. Off, "
                "valves open fully when a room calls.",
                True,
                restart=False,
            ),
            _num(
                "learning.memory_days",
                "Learning memory",
                "How long the room models remember, in days of learning.",
                "days",
                MEMORY_DAYS_MIN,
                MEMORY_DAYS_MAX,
                730,
            ),
            _bool(
                "learning.learn_on_trv_fallback",
                "Learn on valve fallback",
                "Keep learning while a valve uses its own sensor because the room "
                "sensor is silent.",
                False,
                restart=False,
            ),
        ),
        guide="learning",
    ),
    Section(
        "monitoring",
        "Device alerts",
        "When the Devices view says a device needs attention.",
        (
            _num(
                "monitoring.low_battery_pct",
                "Low battery at",
                "A battery at or below this is low.",
                "%",
                5,
                50,
                20,
                restart=False,
            ),
            _num(
                "monitoring.weak_signal_lqi",
                "Weak signal below",
                "A Zigbee link quality below this is a weak signal.",
                "LQI",
                5,
                150,
                40,
                restart=False,
            ),
        ),
        guide="devices",
    ),
    Section(
        "suggestions",
        "Suggestions",
        "When the house suggestions speak up.",
        (
            _num(
                "suggestions.min_confidence",
                "Minimum confidence",
                "A room model must be at least this sure before Radiate suggests "
                "anything about the room.",
                None,
                0.3,
                0.95,
                _Q.min_confidence,
                step=0.05,
                restart=False,
            ),
            _num(
                "suggestions.min_learning_h",
                "Learning first",
                "Hours of learning a room needs before suggestions about it.",
                "h",
                6,
                2000,
                _Q.min_learning_h,
                restart=False,
            ),
            _int(
                "suggestions.min_rooms",
                "Rooms to compare",
                "Rooms are compared with each other once this many have enough learning.",
                2,
                20,
                _Q.min_rooms,
                restart=False,
            ),
            _num(
                "suggestions.heat_loss_ratio",
                "Heat loss ratio",
                "A room that loses heat this many times faster than the house's "
                "typical room is named.",
                None,
                1.1,
                5,
                _Q.heat_loss_ratio,
                step=0.1,
                restart=False,
            ),
            _num(
                "suggestions.compare_delta_k",
                "Compare at",
                "The inside to outside difference rooms are compared at.",
                "K",
                5,
                30,
                _Q.compare_delta_k,
                restart=False,
            ),
            _num(
                "suggestions.design_outdoor_c",
                "Design outdoor temperature",
                "The cold day a radiator must cope with.",
                "°C",
                -25,
                10,
                _Q.design_outdoor_c,
                restart=False,
            ),
            _num(
                "suggestions.mild_outdoor_c",
                "Mild outdoor temperature",
                "The mild day used to judge whether a radiator is oversized. Above "
                "the design temperature.",
                "°C",
                -10,
                15,
                _Q.mild_outdoor_c,
                restart=False,
            ),
            _num(
                "suggestions.slow_warm_ratio",
                "Slow warm-up ratio",
                "A room that takes this many times longer than predicted to warm up is named.",
                None,
                1.2,
                5,
                _Q.slow_warm_ratio,
                step=0.1,
                restart=False,
            ),
            _num(
                "suggestions.slow_warm_extra_min",
                "Slow warm-up margin",
                "And it must be at least this much later than predicted.",
                "min",
                0,
                60,
                _Q.slow_warm_extra_min,
                restart=False,
            ),
            _int(
                "suggestions.min_lag_samples",
                "Warm-ups to judge",
                "Warm-ups a room needs before its warm-up time is judged.",
                3,
                15,
                _Q.min_lag_samples,
                restart=False,
            ),
        ),
        guide="suggestions",
    ),
    Section(
        "rooms",
        "Rooms",
        "Each room's devices and how Radiate treats it. Rooms are added and removed "
        "in the house file.",
        (
            _text("name", "Name", "The name shown in the web UI and Home Assistant."),
            _choice(
                "role",
                "Role",
                "Normal has a valve and a room sensor. Valve's own sensor has a valve "
                "but no room sensor. Bypass is an unvalved radiator Radiate only "
                "watches. No radiator is recorded only.",
                ("normal", "internal_sensor_only", "passive", "unheated"),
                "normal",
                hardware=True,
            ),
            _choice(
                "heat_source",
                "Other heat",
                "An open fire or a range cooker in the room. Learning pauses while they heat it.",
                ("episodic", "continuous"),
                None,
                optional=True,
            ),
            _text(
                "trv",
                "Valve",
                "The radiator valve's Zigbee2MQTT name.",
                optional=True,
                hardware=True,
            ),
            _text(
                "sensor",
                "Room sensor",
                "The room sensor's Zigbee2MQTT name.",
                optional=True,
            ),
            _text(
                "window",
                "Window sensor",
                "A window contact's Zigbee2MQTT name, if the room has one.",
                optional=True,
            ),
            Setting(
                "schedule",
                "Schedule",
                "choice",
                "The house file's schedule the room follows when the household doesn't "
                "cover it. Not set, it follows the schedule named default.",
                choices_from="schedules",
                optional=True,
            ),
            _bool(
                "actuate",
                "Actuate",
                "Radiate writes to this room's valve. Without actuate on any room, "
                "only the first room with a valve is actuated.",
                None,
                hardware=True,
                optional=True,
            ),
            _bool(
                "humidity",
                "Use humidity",
                "Use the room sensor's humidity to spot showers.",
                None,
                optional=True,
            ),
            _num(
                "trv_bias_k",
                "Valve sensor bias",
                "How far the valve's own sensor reads from the room, for a room "
                "without a room sensor.",
                "K",
                -5,
                5,
                -1.5,
                step=0.1,
            ),
            Setting(
                "use",
                "Use",
                "use",
                "How the room is used on a hand-written schedule, for eco. Household "
                "rooms take it from the household.",
                choices=("in_use", "occasional", "unused"),
                optional=True,
            ),
        ),
        per_room=True,
        covers=("rooms",),
    ),
    Section(
        "export",
        "OpenTelemetry export",
        "Send readings, decisions and alerts to an OpenTelemetry collector over OTLP/HTTP, "
        "such as Elastic's managed OTLP endpoint. Used from the next start.",
        (
            Setting(
                "export.otlp.enabled",
                "Send to the collector",
                "bool",
                "Off keeps the settings below but sends nothing. Needs an endpoint.",
                optional=True,
            ),
            Setting(
                "export.otlp.endpoint",
                "Endpoint",
                "text",
                "The collector's OTLP/HTTP base URL. Radiate adds /v1/metrics and /v1/logs.",
                optional=True,
            ),
            Setting(
                "export.otlp.api_key",
                "API key",
                "secret",
                "Sent as 'Authorization: ApiKey <key>', as Elastic expects. Never shown again.",
                secret=True,
                optional=True,
            ),
            Setting(
                "export.otlp.api_key_file",
                "API key file",
                "text",
                "A file holding the API key, instead of the key itself.",
                optional=True,
            ),
            Setting(
                "export.otlp.protocol",
                "Encoding",
                "choice",
                "Protobuf, the default, works with every OTLP/HTTP collector.",
                choices=("http/protobuf", "http/json"),
                optional=True,
            ),
            Setting(
                "export.otlp.interval_s",
                "Send every",
                "number",
                "How often to send what has been recorded. 60 s by default.",
                unit="s",
                lo=10,
                hi=3600,
                step=10,
                optional=True,
            ),
            Setting(
                "export.otlp.timeout_s",
                "Timeout",
                "number",
                "How long to wait for the collector to answer. 30 s by default.",
                unit="s",
                lo=1,
                hi=120,
                step=1,
                optional=True,
            ),
            Setting(
                "export.otlp.compression",
                "Compression",
                "choice",
                "Compress requests with gzip. Off by default.",
                choices=("none", "gzip"),
                optional=True,
            ),
            Setting(
                "export.otlp.signals",
                "Send",
                "list",
                "metrics for readings, logs for decisions and alerts. Both by default.",
                optional=True,
            ),
            Setting(
                "export.otlp.dataset",
                "Dataset",
                "text",
                "Sent as data_stream.dataset, which Elastic routes by. radiate by default.",
                optional=True,
            ),
            Setting(
                "export.otlp.daily_metrics",
                "Send daily figures",
                "bool",
                "Each closed day's summary and savings, once a day. On by default.",
                optional=True,
            ),
            Setting(
                "export.otlp.daily_timestamp",
                "Time daily figures at",
                "choice",
                "end_of_day: the day's last second, so each figure lands on the day it "
                "covers. day_close: when Radiate closed the day, just after midnight. "
                "end_of_day by default.",
                choices=("end_of_day", "day_close"),
                optional=True,
            ),
            Setting(
                "export.otlp.security",
                "Send security events",
                "bool",
                "Sign-ins, refusals and changes, with usernames and client addresses. Off "
                "keeps them out of the export; the security log below keeps them either "
                "way. On by default.",
                optional=True,
            ),
        ),
        covers=("export.otlp.headers",),
    ),
    Section(
        "auth",
        "Login",
        "Who can sign in to the web UI and how. Only the session length and button labels "
        "change here: the rest stays in the house file so a mistake can't lock everyone out. "
        "Add and reset people with 'radiate users'.",
        (
            Setting(
                "auth.enabled",
                "Login on",
                "bool",
                "Off: the API token alone, as before. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.local",
                "Password login",
                "bool",
                "Sign in with a username and password. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.public_url",
                "Public address",
                "text",
                "The address people use. Required for single sign-on. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.trusted_proxies",
                "Trusted proxies",
                "list",
                "IP addresses or networks whose X-Forwarded headers Radiate believes. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.secure_cookie",
                "Secure cookie",
                "choice",
                "When the session cookie is marked Secure. Set in the house file.",
                editable=False,
                optional=True,
                choices=("auto", "always", "never"),
            ),
            Setting(
                "auth.session_days",
                "Session length",
                "number",
                "How long a sign-in lasts. 30 days by default.",
                unit="days",
                lo=1,
                hi=400,
                step=1,
                optional=True,
            ),
            Setting(
                "auth.idle_days",
                "Sign out when idle after",
                "number",
                "At most the session length. 7 days by default.",
                unit="days",
                lo=1,
                hi=400,
                step=1,
                optional=True,
            ),
            Setting(
                "auth.audit_days",
                "Keep the security log for",
                "number",
                "Sign-ins, refusals and changes in the security log older than this are "
                "deleted. Kept whether or not login is on. 90 days by default.",
                unit="days",
                lo=1,
                hi=3650,
                step=1,
                optional=True,
            ),
            Setting(
                "auth.oidc.label",
                "Single sign-on button",
                "text",
                "The words on the single sign-on button.",
                optional=True,
            ),
            Setting(
                "auth.saml.label",
                "SAML button",
                "text",
                "The words on the SAML button.",
                optional=True,
            ),
            Setting(
                "auth.oidc.issuer",
                "OIDC issuer",
                "text",
                "The identity provider's issuer URL. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.oidc.client_id",
                "OIDC client ID",
                "text",
                "Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.oidc.client_secret",
                "OIDC client secret",
                "secret",
                "Set in the house file, or from a file or environment variable.",
                secret=True,
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.oidc.client_secret_file",
                "OIDC client secret file",
                "text",
                "A file holding the client secret. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.oidc.scopes",
                "OIDC scopes",
                "list",
                "openid, profile and email by default. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.oidc.username_claim",
                "Username claim",
                "text",
                "preferred_username by default. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.oidc.roles_claim",
                "Roles claim",
                "text",
                "The claim holding groups or roles. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.oidc.admins",
                "OIDC admins",
                "list",
                "Users or groups who are admins. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.oidc.households",
                "OIDC households",
                "list",
                "Users or groups who can change setpoints, away, fire, boosts and room "
                "adjustments but not settings. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.oidc.viewers",
                "OIDC viewers (read only)",
                "list",
                "Users or groups who can only look. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.saml.idp_metadata_url",
                "SAML metadata URL",
                "text",
                "Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.saml.idp_metadata_file",
                "SAML metadata file",
                "text",
                "Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.saml.sp_entity_id",
                "SAML entity ID",
                "text",
                "Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.saml.username_attribute",
                "SAML username attribute",
                "text",
                "Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.saml.roles_attribute",
                "SAML roles attribute",
                "text",
                "Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.saml.admins",
                "SAML admins",
                "list",
                "Users or groups who are admins. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.saml.households",
                "SAML households",
                "list",
                "Users or groups who can change setpoints, away, fire, boosts and room "
                "adjustments but not settings. Set in the house file.",
                editable=False,
                optional=True,
            ),
            Setting(
                "auth.saml.viewers",
                "SAML viewers (read only)",
                "list",
                "Users or groups who can only look. Set in the house file.",
                editable=False,
                optional=True,
            ),
        ),
    ),
    Section(
        "household",
        "Household",
        "People, their routines and how each room is used. Change them in the household setup.",
        link="household",
        guide="away",
        covers=("household",),
    ),
    Section(
        "schedules",
        "Schedules",
        "The week each room follows. Household rooms are adjusted on the House view; "
        "hand-written weeks live in the house file.",
        link="schedules",
        guide="schedules",
        covers=("schedules",),
    ),
]


def register_section(section: Section, before: str | None = None) -> None:
    """Add a section to the registry, before the section `before` or at the end of the
    editable ones (ahead of the linked household and schedules). Replaces a section
    with the same id."""
    SECTIONS[:] = [s for s in SECTIONS if s.id != section.id]
    at = next((i for i, s in enumerate(SECTIONS) if s.id == before), None)
    if at is None:
        at = next((i for i, s in enumerate(SECTIONS) if s.link), len(SECTIONS))
    SECTIONS.insert(at, section)


def section_of(path: str) -> Section | None:
    """The section a full path (`rooms.lounge.trv`, `boiler.frost_c`) belongs to."""
    found = setting_for(path)
    return found[0] if found else None


def setting_for(path: str) -> tuple[Section, Setting] | None:
    """The section and setting for a full path, or None for an unknown one."""
    parts = path.split(".")
    for sec in SECTIONS:
        if sec.per_room:
            if len(parts) == 3 and parts[0] == "rooms":
                for s in sec.settings:
                    if s.path == parts[2]:
                        return sec, s
            continue
        for s in sec.settings:
            if s.path == path:
                return sec, s
    return None


def settings_paths(room_ids: list[str]) -> list[str]:
    """Every full path, with each per-room setting repeated for `room_ids`."""
    out: list[str] = []
    for sec in SECTIONS:
        if sec.per_room:
            out.extend(f"rooms.{rid}.{s.path}" for rid in room_ids for s in sec.settings)
        else:
            out.extend(s.path for s in sec.settings)
    return out


def room_ids(raw: Any) -> list[str]:
    """The room ids in a house file's `rooms` list, in order."""
    rooms = raw.get("rooms") if isinstance(raw, dict) else None
    if not isinstance(rooms, list):
        return []
    return [str(r["id"]) for r in rooms if isinstance(r, dict) and r.get("id") is not None]


# --- reading values --------------------------------------------------------------------


def lookup(raw: Any, path: str) -> tuple[bool, Any]:
    """(present, value) for a full path in a house file. A key set to null counts as
    not present, as the parser treats it."""
    parts = path.split(".")
    node = raw
    if parts[0] == "rooms" and len(parts) == 3:
        rooms = raw.get("rooms") if isinstance(raw, dict) else None
        item = next(
            (r for r in rooms or [] if isinstance(r, dict) and str(r.get("id")) == parts[1]),
            None,
        )
        if item is None or item.get(parts[2]) is None:
            return False, None
        return True, item[parts[2]]
    for part in parts:
        if not isinstance(node, dict) or node.get(part) is None:
            return False, None
        node = node[part]
    return True, node


def flatten(nested: Any) -> tuple[dict[str, Any], list[str]]:
    """Saved settings as {path: value}, and a problem for each key the registry
    doesn't know. `rooms` is a mapping of room id to that room's settings."""
    flat: dict[str, Any] = {}
    problems: list[str] = []
    if nested is None:
        return flat, problems
    if not isinstance(nested, dict):
        return flat, ["settings: expected a mapping"]

    def walk(node: dict, prefix: str) -> None:
        for key, value in node.items():
            path = f"{prefix}{key}"
            found = setting_for(path)
            if found is not None:
                if found[1].editable:
                    flat[path] = value
                else:
                    problems.append(f"{path}: only the house file can set this")
            elif path == "rooms" and isinstance(value, dict):
                for rid, item in value.items():
                    if not isinstance(item, dict):
                        problems.append(f"rooms.{rid}: expected a mapping")
                        continue
                    walk(item, f"rooms.{rid}.")
            elif isinstance(value, dict) and _is_prefix(path):
                walk(value, f"{path}.")
            else:
                problems.append(f"{path}: unknown setting")

    walk(nested, "")
    return flat, problems


def _is_prefix(path: str) -> bool:
    head = f"{path}."
    return any(
        s.path.startswith(head) for sec in SECTIONS if not sec.per_room for s in sec.settings
    )


def nest(flat: dict[str, Any]) -> dict:
    """{path: value} as the nested mapping saved in `settings.yaml`, in registry order."""
    out: dict = {}
    order = {p: i for i, p in enumerate(_order_paths(flat))}
    for path in sorted(flat, key=lambda p: order[p]):
        parts = path.split(".")
        node = out
        for part in parts[:-1]:
            node = node.setdefault(part, {})
        node[parts[-1]] = flat[path]
    return out


def _order_paths(flat: dict[str, Any]) -> list[str]:
    rids: list[str] = []
    for path in flat:
        parts = path.split(".")
        if parts[0] == "rooms" and len(parts) == 3 and parts[1] not in rids:
            rids.append(parts[1])
    known = settings_paths(rids)
    return known + [p for p in flat if p not in known]


def merge_settings(file_raw: Any, flat: dict[str, Any]) -> tuple[dict, list[str]]:
    """The house file with saved settings laid over it, and a problem for each saved
    setting that has nowhere to go (a room no longer in the house file).

    A value of None removes the key, so the house file's value no longer applies.
    """
    raw = copy.deepcopy(file_raw) if isinstance(file_raw, dict) else {}
    problems: list[str] = []
    for path, value in flat.items():
        parts = path.split(".")
        if parts[0] == "rooms" and len(parts) == 3:
            rooms = raw.get("rooms")
            item = next(
                (r for r in rooms or [] if isinstance(r, dict) and str(r.get("id")) == parts[1]),
                None,
            )
            if item is None:
                problems.append(f"rooms.{parts[1]}: no room with this id in the house file")
                continue
            _put(item, parts[2], value)
            continue
        node = raw
        for part in parts[:-1]:
            if not isinstance(node.get(part), dict):
                if value is None:
                    node = None
                    break
                node[part] = {}
            node = node[part]
        if node is not None:
            _put(node, parts[-1], value)
    return raw, problems


def _put(node: dict, key: str, value: Any) -> None:
    if value is None:
        node.pop(key, None)
    else:
        node[key] = copy.deepcopy(value)


def problem_path(text: str, raw: Any) -> tuple[str, str]:
    """Split a parser problem into a settings path and a message.

    "rooms[2].trv: required" becomes ("rooms.lounge.trv", "required") when the third
    room is the lounge; "rooms: lounge: actuate is true but the room has no trv"
    becomes ("rooms.lounge.actuate", ...).
    """
    path, sep, message = text.partition(": ")
    if not sep:
        return "", text
    ids = room_ids(raw)
    m = _ROOM.match(path)
    if m and int(m.group(1)) < len(ids):
        path = f"rooms.{ids[int(m.group(1))]}" + path[m.end() :]
    elif path == "rooms":
        rid, sep2, rest = message.partition(": ")
        if sep2 and rid in ids and rest.startswith("actuate"):
            return f"rooms.{rid}.actuate", rest
    return path, message


# --- the view ------------------------------------------------------------------------


def env_names(value: Any) -> list[str]:
    """The environment variables a house-file value takes, such as `${MQTT_PASSWORD}`."""
    return _ENV.findall(value) if isinstance(value, str) else []


def field_view(
    sec: Section,
    s: Setting,
    path: str,
    file_raw: Any,
    flat: dict[str, Any],
    running: dict[str, Any],
    effective: Any,
) -> dict:
    """One setting as the API shows it. A secret's value never leaves the server."""
    in_file, file_value = lookup(file_raw, path)
    in_app = path in flat
    if in_app:
        source = "app"
        value = flat[path]
    elif in_file:
        source = "house_file"
        value = file_value
    else:
        source = "default"
        value = s.default
    choices = list(s.choices)
    if s.choices_from == "schedules":
        sched = file_raw.get("schedules") if isinstance(file_raw, dict) else None
        choices = [str(k) for k in sched] if isinstance(sched, dict) else []
    out: dict[str, Any] = {
        "path": path,
        "key": s.path,
        "label": s.label,
        "kind": s.kind,
        "help": s.help,
        "unit": s.unit,
        "min": s.lo,
        "max": s.hi,
        "step": s.step,
        "choices": choices,
        "optional": s.optional,
        "restart": s.restart,
        "secret": s.secret,
        "hardware": s.hardware,
        "editable": s.editable,
        "source": source,
        # What is running now differs from what is saved: true until a restart.
        "pending_restart": s.restart and running.get(path) != effective,
    }
    if s.secret:
        out["is_set"] = value is not None and value != ""
        out["house_file_set"] = in_file
        out["env"] = env_names(file_value) if source == "house_file" else []
        return out
    out["value"] = value
    out["default"] = s.default
    out["house_file_value"] = file_value if in_file else None
    out["house_file_set"] = in_file
    out["env"] = env_names(value)
    return out
