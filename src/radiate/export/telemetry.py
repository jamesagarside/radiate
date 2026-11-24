"""The telemetry schema: every metric and log record Radiate sends over OTLP (spec 9.1).

Defined once, here, as data. The OTLP encoder (`radiate.export.otlp`) takes each
metric's name, instrument, unit and description from it, and builds log records with
the builders below; `check_metrics` and `check_logs` validate a request against it
(the tests run them on everything the encoder emits); and `docs/telemetry.md`'s
tables are generated from it by `scripts/telemetry_docs.py`, with a test that fails
when the doc and this module drift apart.

Pure: no I/O, no clock. Names follow OpenTelemetry semantic conventions where one
exists (`service.*`, `error.type`, `source.address`, `http.request.method`,
`url.path`), ECS where Elastic maps it (`event.action`, `event.category`,
`event.outcome`, `user.*`, `data_stream.dataset`), and `radiate.*` otherwise. Units
are UCUM, as OpenTelemetry expects. The event name goes only in the log record's
event name field (OpenTelemetry's `event_name`), never in an attribute.

Versioning (`SCHEMA_VERSION`, sent as the `radiate.schema.version` resource
attribute) is MAJOR.MINOR. Within a major, changes are additive only: a new metric,
event or optional attribute, or a new enum value, bumps the minor. Renaming or
removing anything, changing a type, unit, instrument, temporality or severity, or
making an attribute required, bumps the major. `tests/server/fixtures/telemetry`
keeps a snapshot of every published version, and the tests check that each is a
subset of every later one with the same major.

No personal data: never the name of a person or a place. Rooms are named, people
only counted, and the house is a random ID. The one exception is the security audit
events (`radiate.security.*`, ADR-0008): a security record is no use without who did
it and from where, so they carry `user.name` (a Radiate username or a single sign-on
user) and `source.address`. Nothing else does, and no event carries a secret.
"""

from __future__ import annotations

import math
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

SCHEMA_VERSION = "1.0"

# Attribute types, as OTLP AnyValue carries them.
STRING = "string"
INT = "int"
DOUBLE = "double"
BOOL = "bool"
STRINGS = "string[]"

# Metric instruments, and when a metric is sent.
GAUGE = "gauge"
SUM = "sum"
CUMULATIVE = "cumulative"
MINUTE = "minute"  # every tick, at the tick's time
DAILY = "daily"  # once a day, when the local day closes

# OpenTelemetry SeverityNumber for each severity text Radiate uses.
SEVERITY = {"INFO": 9, "WARN": 13}


@dataclass(frozen=True, slots=True)
class Attribute:
    key: str
    type: str
    brief: str
    unit: str = ""  # UCUM, for a number
    required: bool = False
    values: tuple[str, ...] = ()  # the only values allowed, for an enum
    convention: str = ""  # "OpenTelemetry" or "ECS" when the name comes from one

    def optional(self) -> Attribute:
        return Attribute(
            self.key, self.type, self.brief, self.unit, False, self.values, self.convention
        )

    def needed(self) -> Attribute:
        return Attribute(
            self.key, self.type, self.brief, self.unit, True, self.values, self.convention
        )


@dataclass(frozen=True, slots=True)
class MetricDef:
    name: str
    instrument: str  # GAUGE or SUM
    unit: str
    brief: str
    source: str  # where the value comes from: a raw data series, ledger field or summary path
    cadence: str = MINUTE
    attributes: tuple[Attribute, ...] = ()
    monotonic: bool = False  # SUM only
    temporality: str = ""  # SUM only: CUMULATIVE
    since: str = "1.0"


@dataclass(frozen=True, slots=True)
class EventDef:
    name: str  # the log record's event name
    severity: str  # a key of SEVERITY
    brief: str
    body: str  # what the body says
    attributes: tuple[Attribute, ...]
    codes: str  # which reason codes `event.action` carries
    since: str = "1.0"


# --- attributes --------------------------------------------------------------------------

SERVICE_NAME = Attribute(
    "service.name", STRING, "Always `radiate`.", required=True, convention="OpenTelemetry"
)
SERVICE_VERSION = Attribute(
    "service.version", STRING, "Radiate's version.", required=True, convention="OpenTelemetry"
)
SERVICE_INSTANCE = Attribute(
    "service.instance.id",
    STRING,
    "The random house ID, the same as `radiate.house.id`.",
    required=True,
    convention="OpenTelemetry",
)
HOUSE_ID = Attribute("radiate.house.id", STRING, "The random house ID (a UUID).", required=True)
SCHEMA = Attribute(
    "radiate.schema.version",
    STRING,
    "This schema's version, MAJOR.MINOR.",
    required=True,
)
DATASET = Attribute(
    "data_stream.dataset",
    STRING,
    "Elastic's routing: `radiate` sends metrics to `metrics-radiate.otel-default`. Left "
    "out when `export.otlp.dataset` is empty.",
    convention="ECS",
)
RESOURCE: tuple[Attribute, ...] = (
    SERVICE_NAME,
    SERVICE_VERSION,
    SERVICE_INSTANCE,
    HOUSE_ID,
    SCHEMA,
    DATASET,
)

ROOM_ID = Attribute("radiate.room.id", STRING, "The room's ID from the house file.", required=True)
ROOM_NAME = Attribute("radiate.room.name", STRING, "The room's name from the house file.")
BOILER_STATE = Attribute(
    "radiate.boiler.state",
    STRING,
    "The boiler guard's state this point is for.",
    required=True,
    values=("idle", "lead", "firing", "rest"),
)
DAY_PARTIAL = Attribute(
    "radiate.day.partial",
    BOOL,
    "Radiate did not see the whole day: totals cover what it saw.",
    required=True,
)
BURNER_BASIS = Attribute(
    "radiate.burner.basis",
    STRING,
    "What burner time is counted from: the relay, metered firing, or both in one day.",
    required=True,
    values=("relay", "firing", "mixed"),
)
SAVINGS_ELIGIBLE = Attribute(
    "radiate.savings.eligible",
    BOOL,
    "The day counts towards savings (spec 5.9).",
    required=True,
)

EVENT_ACTION = Attribute(
    "event.action",
    STRING,
    "The reason code, such as `boiler.lead`, or the action for events without one.",
    required=True,
    convention="ECS",
)
ROOM_TEMPERATURE = Attribute(
    "radiate.room.temperature", DOUBLE, "The room's temperature when it happened.", "Cel"
)
ROOM_TARGET = Attribute("radiate.room.target", DOUBLE, "The room's target then.", "Cel")
PREDICTED_BURN = Attribute(
    "radiate.boiler.predicted_burn", DOUBLE, "The burn length the boiler guard predicted.", "min"
)
POOLED_DEMAND = Attribute(
    "radiate.boiler.pooled_demand", DOUBLE, "The demand pooled before the boiler lit.", "min"
)
PEOPLE_HOME = Attribute("radiate.people.home", INT, "How many people count as home.", "{person}")
PEOPLE_AWAY = Attribute("radiate.people.away", INT, "How many people count as away.", "{person}")
BURN_DURATION = Attribute(
    "radiate.burn.duration", DOUBLE, "How long the heating relay was on.", "s", required=True
)
DRY_RUN = Attribute(
    "radiate.dry_run",
    BOOL,
    "Radiate was not running the boiler: the burn is its intention, not the boiler's.",
    required=True,
)
MODE_KIND = Attribute(
    "radiate.mode.kind",
    STRING,
    "Which mode changed: the heating mode or the demand mode.",
    required=True,
    values=("heating", "demand"),
)
MODES = ("auto", "off", "frost", "eco", "comfort")
MODE_BEFORE = Attribute(
    "radiate.mode.before", STRING, "The mode before the change.", required=True, values=MODES
)
MODE_AFTER = Attribute(
    "radiate.mode.after", STRING, "The mode after the change.", required=True, values=MODES
)
SETTINGS_PATHS = Attribute(
    "radiate.settings.paths",
    STRINGS,
    "The settings that changed, as house-file paths such as `boiler.min_burn_min`. "
    "Never their values, which can be secrets.",
    required=True,
)
SETTINGS_RESTART = Attribute(
    "radiate.settings.restart_required",
    BOOL,
    "Some of the changes take effect at the next start.",
    required=True,
)
EXPORT_SIGNAL = Attribute(
    "radiate.export.signal",
    STRING,
    "Which queue lost the data.",
    required=True,
    values=("metrics", "logs"),
)
DROPPED_COUNT = Attribute(
    "radiate.export.dropped",
    INT,
    "How much was lost since the last report: queued records (a tick, a closed day or "
    "a log record) for a full queue, a 400 or a 413; data points or log records for a "
    "partial success.",
    "{record}",
    required=True,
)
ERROR_TYPE = Attribute(
    "error.type",
    STRING,
    "Why: the queue was full, the collector answered 400 or 413, or it rejected part of a batch.",
    required=True,
    values=("queue_full", "400", "413", "partial_success"),
    convention="OpenTelemetry",
)

# Security audit attributes (ADR-0008). ECS and OpenTelemetry names, so a SIEM reads
# them without mapping. Only `radiate.security.*` events carry them.
EVENT_CATEGORY = Attribute(
    "event.category",
    STRING,
    "ECS category: `authentication` for signing in and credentials, `web` for a "
    "request refused after it was authenticated, `iam` for user management, "
    "`configuration` for changes to how Radiate runs.",
    required=True,
    values=("authentication", "web", "iam", "configuration"),
    convention="ECS",
)
EVENT_TYPE = Attribute(
    "event.type",
    STRING,
    "ECS type within the category.",
    required=True,
    values=("start", "end", "info", "access", "change", "creation", "deletion"),
    convention="ECS",
)
EVENT_OUTCOME = Attribute(
    "event.outcome",
    STRING,
    "Whether what was tried succeeded.",
    required=True,
    values=("success", "failure"),
    convention="ECS",
)
USER_NAME = Attribute(
    "user.name",
    STRING,
    "Who: the Radiate username, or the user the single sign-on provider named. For a "
    "refused sign-in, the name that was tried. Left out when no one is known, and for "
    "the API token, ingress and the command line.",
    convention="ECS",
)
USER_ROLES = Attribute(
    "user.roles",
    STRINGS,
    "Their Radiate role: `admin`, `household` or `viewer`.",
    convention="ECS",
)
SOURCE_ADDRESS = Attribute(
    "source.address",
    STRING,
    "The client's IP address: the connection's, or from X-Forwarded-For only when the "
    "request came through one of `auth.trusted_proxies`. Left out for the command line.",
    convention="OpenTelemetry",
)
HTTP_METHOD = Attribute(
    "http.request.method", STRING, "The request's HTTP method.", convention="OpenTelemetry"
)
URL_PATH = Attribute(
    "url.path",
    STRING,
    "The request's path, never its query string.",
    convention="OpenTelemetry",
)
AUTH_METHOD = Attribute(
    "radiate.auth.method",
    STRING,
    "How the person signed in, or how the request was authenticated.",
    values=("password", "oidc", "saml", "session", "token", "ingress", "open", "cli"),
)
NEEDED_ROLE = Attribute(
    "radiate.auth.needed_role",
    STRING,
    "The lowest role that may make the request.",
    values=("viewer", "household", "admin"),
)
SECURITY_COUNT = Attribute(
    "radiate.security.count",
    INT,
    "How many identical events this record stands for, when repeats within a minute "
    "were folded into one. Left out for one.",
    "{event}",
)
LOGIN_ERRORS = (
    "bad_request",
    "bad_password",
    "unknown_user",
    "rate_limited",
    "bad_state",
    "provider_error",
    "bad_signature",
    "wrong_issuer",
    "wrong_audience",
    "expired",
    "bad_nonce",
    "bad_claims",
    "replayed",
    "no_user",
    "not_permitted",
)
LOGIN_ERROR = Attribute(
    "error.type",
    STRING,
    "Why the sign-in was refused.",
    required=True,
    values=LOGIN_ERRORS,
    convention="OpenTelemetry",
)
REQUEST_ERROR = Attribute(
    "error.type",
    STRING,
    "What was wrong: no credentials, a wrong API token, or a session cookie that is "
    "unknown, expired or signed out.",
    required=True,
    values=("no_credentials", "bad_token", "bad_session"),
    convention="OpenTelemetry",
)
ACCESS_ERROR = Attribute(
    "error.type",
    STRING,
    "Why: the role may not make the request, the CSRF token was missing or wrong, or "
    "the browser's Origin was another site's.",
    required=True,
    values=("forbidden", "csrf", "origin"),
    convention="OpenTelemetry",
)
SESSION_REASONS = ("expired", "idle", "password_reset", "role_changed", "user_removed")
SESSION_REASON = Attribute(
    "event.reason",
    STRING,
    "Why the session ended: it reached `auth.session_days`, it was idle for "
    "`auth.idle_days`, or the user's password, role or account changed.",
    required=True,
    values=SESSION_REASONS,
    convention="ECS",
)
SESSIONS_ENDED = Attribute(
    "radiate.sessions.ended", INT, "How many sessions ended.", "{session}", required=True
)
LOCKOUT_SCOPE = Attribute(
    "radiate.lockout.scope",
    STRING,
    "What is locked: a username, after 5 failures in 15 minutes, or a client address, after 20.",
    required=True,
    values=("username", "address"),
)
LOCKOUT_DURATION = Attribute(
    "radiate.lockout.duration", DOUBLE, "How long the lockout lasts.", "s", required=True
)
USER_TARGET_NAME = Attribute(
    "user.target.name",
    STRING,
    "The user who was added, changed or removed.",
    required=True,
    convention="ECS",
)
USER_TARGET_ROLES = Attribute(
    "user.target.roles", STRINGS, "Their role after the change.", convention="ECS"
)
CONFIG_AREA = Attribute(
    "radiate.config.area",
    STRING,
    "What changed: the settings saved from the web UI, the household setup, the "
    "layout, or learned models.",
    required=True,
    values=("settings", "household", "layout", "learning"),
)
CONFIG_PATHS = Attribute(
    "radiate.settings.paths",
    STRINGS,
    "For settings, which ones changed, as house-file paths. Never their values.",
)
ROOM_IDS = Attribute("radiate.room.ids", STRINGS, "For learning, the rooms that were reset.")
LOGIN_ON = Attribute(
    "radiate.auth.login", BOOL, "User login is on (`auth.enabled`).", required=True
)
LOGIN_METHODS = Attribute(
    "radiate.auth.methods",
    STRINGS,
    "The sign-in methods that are on: `password`, `oidc`, `saml`. Empty with login off.",
    required=True,
)
TOKEN_SET = Attribute(
    "radiate.auth.token", BOOL, "An API token (RADIATE_TOKEN) is set.", required=True
)
INGRESS_SET = Attribute(
    "radiate.auth.ingress",
    BOOL,
    "Requests through Home Assistant ingress are trusted.",
    required=True,
)
PROXY_COUNT = Attribute(
    "radiate.auth.trusted_proxies",
    INT,
    "How many addresses or networks are trusted proxies.",
    "{network}",
    required=True,
)

_ROOM = (ROOM_ID, ROOM_NAME)
_ROOM_OPTIONAL = (ROOM_ID.optional(), ROOM_NAME)
_COMMON_EVENT = (EVENT_ACTION,)


# --- metrics -----------------------------------------------------------------------------


def _series(name: str, unit: str, brief: str, series: str, room: bool = True) -> MetricDef:
    return MetricDef(name, GAUGE, unit, brief, series, MINUTE, _ROOM if room else ())


def _counter(name: str, unit: str, brief: str, source: str) -> MetricDef:
    return MetricDef(name, SUM, unit, brief, source, MINUTE, (), True, CUMULATIVE)


def _daily(
    name: str, unit: str, brief: str, source: str, attrs: tuple[Attribute, ...] = ()
) -> MetricDef:
    return MetricDef(name, GAUGE, unit, brief, source, DAILY, (DAY_PARTIAL, *attrs))


METRICS: tuple[MetricDef, ...] = (
    # Every tick, from the raw data series (`radiate.core.series`).
    _series("radiate.room.temperature", "Cel", "The room sensor's reading.", "room.temperature"),
    _series(
        "radiate.room.humidity", "%", "Relative humidity from the room sensor.", "room.humidity"
    ),
    _series(
        "radiate.room.setpoint",
        "Cel",
        "The temperature the schedule, or a hold, asks for.",
        "room.setpoint",
    ),
    _series(
        "radiate.room.target",
        "Cel",
        "The temperature Radiate is heating the room to now, after preheating and room use.",
        "room.target",
    ),
    _series(
        "radiate.room.demand.calling",
        "1",
        "1 while the room wants heat from the boiler, else 0.",
        "room.calling",
    ),
    _series(
        "radiate.room.window.open",
        "1",
        "1 while the room's window sensor reads open, else 0.",
        "room.window",
    ),
    _series(
        "radiate.valve.temperature",
        "Cel",
        "The TRV's own sensor, at the radiator.",
        "valve.temperature",
    ),
    _series(
        "radiate.valve.opening.limit",
        "%",
        "The opening limit Radiate set on the valve.",
        "valve.opening",
    ),
    _series(
        "radiate.valve.opening.reported",
        "%",
        "The opening limit the valve says it holds.",
        "valve.reported",
    ),
    _series(
        "radiate.outdoor.temperature",
        "Cel",
        "The outdoor temperature Radiate uses.",
        "outdoor.temperature",
        room=False,
    ),
    _series(
        "radiate.boiler.relay.on",
        "1",
        "1 while the heating relay reads on, else 0.",
        "boiler.relay",
        room=False,
    ),
    _series(
        "radiate.boiler.demand",
        "1",
        "1 while Radiate asks for the heating relay to be on, else 0.",
        "boiler.demand",
        room=False,
    ),
    MetricDef(
        "radiate.boiler.status",
        GAUGE,
        "1",
        "The boiler guard's state as a state set: one point per state, 1 for the current "
        "one and 0 for the others.",
        "boiler.state",
        MINUTE,
        (BOILER_STATE,),
    ),
    _series(
        "radiate.boiler.burner.on",
        "1",
        "1 while the burner fires, where the boiler reports it, else 0.",
        "boiler.burner",
        room=False,
    ),
    _series(
        "radiate.boiler.power",
        "W",
        "Power through the heating relay, where the relay measures it.",
        "boiler.power",
        room=False,
    ),
    _series(
        "radiate.store.relay.on",
        "1",
        "1 while the hot-water store relay reads on, else 0.",
        "store.relay",
        room=False,
    ),
    _series(
        "radiate.people.home",
        "{person}",
        "How many of the household's people count as home.",
        "people.home",
        room=False,
    ),
    _series(
        "radiate.people.away",
        "{person}",
        "How many of the household's people count as away.",
        "people.away",
        room=False,
    ),
    # Every tick, running totals for the local day: cumulative sums that start at local
    # midnight, so each day's start time marks a reset.
    _counter(
        "radiate.boiler.relay.time",
        "s",
        "Heating relay on time today, as read from the relay.",
        "relay_s",
    ),
    _counter(
        "radiate.boiler.burner.time",
        "s",
        "Heating burner time today: metered firing where the relay measures power, "
        "else relay time while Radiate runs the boiler.",
        "burner_s",
    ),
    _counter("radiate.boiler.starts", "{start}", "Heating relay starts today.", "starts"),
    _counter(
        "radiate.boiler.oil.consumed",
        "L",
        "Oil burned today, from burner time and the nozzle rating. Sent only with a nozzle rating.",
        "litres",
    ),
    _counter(
        "radiate.store.burner.time",
        "s",
        "Burner time for the hot-water store today, metered. Sent only with metering.",
        "store_burner_s",
    ),
    # Once a day, when the local day closes (spec 5.6 and 5.9).
    _daily(
        "radiate.daily.burner.time",
        "h",
        "Heating burner hours in the day.",
        "summary.burner_hours",
        (BURNER_BASIS,),
    ),
    _daily(
        "radiate.daily.relay.time", "h", "Heating relay hours in the day.", "summary.relay_hours"
    ),
    _daily("radiate.daily.starts", "{start}", "Heating relay starts in the day.", "summary.starts"),
    _daily(
        "radiate.daily.starts_peak_hour",
        "{start}",
        "The most relay starts in any hour of the day.",
        "summary.max_starts_in_hour",
    ),
    _daily("radiate.daily.burns", "{burn}", "Burns completed in the day.", "summary.burns.count"),
    _daily(
        "radiate.daily.burn.mean_duration",
        "min",
        "The mean burn length. Not sent for a day without a burn.",
        "summary.burns.mean_min",
    ),
    _daily(
        "radiate.daily.oil.consumed",
        "L",
        "Oil burned in the day. Sent only with a nozzle rating.",
        "summary.litres",
    ),
    _daily(
        "radiate.daily.energy",
        "kW.h",
        "Heat delivered in the day, from the oil burned at 85 % efficiency.",
        "summary.kwh",
    ),
    _daily(
        "radiate.daily.balance.score",
        "{score}",
        "The balance score, 0 to 100. Not sent for a partial day or one without a measured burn.",
        "summary.balance.score",
    ),
    _daily(
        "radiate.daily.balance.arrival_spread",
        "min",
        "The median arrival spread of the day's burns.",
        "summary.balance.arrival_spread_min",
    ),
    _daily(
        "radiate.daily.room.below_comfort",
        "min",
        "Minutes the room spent below its comfort band.",
        "summary.comfort_minutes_below",
        _ROOM,
    ),
    _daily(
        "radiate.daily.savings.degree_hours.actual",
        "K.h",
        "Degree-hours the house was kept above outdoors, weighted by room.",
        "estimate.dh_actual_kh",
        (SAVINGS_ELIGIBLE,),
    ),
    _daily(
        "radiate.daily.savings.degree_hours.baseline",
        "K.h",
        "Degree-hours the baseline would have kept, weighted by room.",
        "estimate.dh_baseline_kh",
        (SAVINGS_ELIGIBLE,),
    ),
    _daily(
        "radiate.daily.oil.baseline",
        "L",
        "Oil the baseline would have burned. Sent once the savings fit is ready.",
        "estimate.litres_baseline",
        (SAVINGS_ELIGIBLE,),
    ),
    _daily(
        "radiate.daily.savings.oil",
        "L",
        "Oil saved against the baseline; negative when more was burned.",
        "estimate.litres_saved",
        (SAVINGS_ELIGIBLE,),
    ),
    _daily(
        "radiate.daily.savings.share",
        "%",
        "Oil saved as a share of the baseline.",
        "estimate.percent_saved",
        (SAVINGS_ELIGIBLE,),
    ),
    _daily(
        "radiate.daily.comfort.deficit",
        "K.h",
        "How far, and for how long, rooms in use were below target.",
        "estimate.comfort_deficit_kh",
        (SAVINGS_ELIGIBLE,),
    ),
    _daily(
        "radiate.daily.comfort.warm_share",
        "1",
        "The share of in-use time rooms were warm enough, 0 to 1.",
        "estimate.warm_share",
        (SAVINGS_ELIGIBLE,),
    ),
)

METRIC_BY_NAME: dict[str, MetricDef] = {m.name: m for m in METRICS}
# Raw data series ID to its metric, for the per-tick gauges.
METRIC_BY_SERIES: dict[str, MetricDef] = {
    m.source: m for m in METRICS if m.instrument == GAUGE and m.cadence == MINUTE
}
COUNTERS: tuple[MetricDef, ...] = tuple(m for m in METRICS if m.instrument == SUM)
DAILY_METRICS: tuple[MetricDef, ...] = tuple(m for m in METRICS if m.cadence == DAILY)


# --- events ------------------------------------------------------------------------------

DECISION = "radiate.decision"
ALERT = "radiate.alert"
ALERT_CLEARED = "radiate.alert.cleared"
BURN = "radiate.boiler.burn"
MODE_CHANGED = "radiate.mode.changed"
PRESENCE_CHANGED = "radiate.presence.changed"
LEARNING_INVALIDATED = "radiate.learning.invalidated"
SETTINGS_CHANGED = "radiate.settings.changed"
EXPORT_DROPPED = "radiate.export.dropped"
SECURITY_LOGIN = "radiate.security.login"
SECURITY_LOGIN_FAILED = "radiate.security.login.failed"
SECURITY_LOGOUT = "radiate.security.logout"
SECURITY_SESSION_ENDED = "radiate.security.session.ended"
SECURITY_REQUEST_REFUSED = "radiate.security.request.refused"
SECURITY_ACCESS_DENIED = "radiate.security.access.denied"
SECURITY_LOCKOUT_STARTED = "radiate.security.lockout.started"
SECURITY_LOCKOUT_ENDED = "radiate.security.lockout.ended"
SECURITY_USER_CHANGED = "radiate.security.user.changed"
SECURITY_CONFIG_CHANGED = "radiate.security.config.changed"
SECURITY_LOGIN_CONFIG = "radiate.security.login.config"

_DECISION_VALUES = (ROOM_TEMPERATURE, ROOM_TARGET, PREDICTED_BURN, POOLED_DEMAND)

EVENTS: tuple[EventDef, ...] = (
    EventDef(
        DECISION,
        "INFO",
        "A decision the control loop made that a person might ask about.",
        "The reason's message, as the web UI shows it.",
        (*_COMMON_EVENT, *_ROOM_OPTIONAL, *_DECISION_VALUES),
        "Every reason code not listed for another event: `boiler.*`, `demand.*`, "
        "`disturbance.*`, `room.*`, `safe_mode.*`, `learning.paused`, `learning.relearn`.",
    ),
    EventDef(
        ALERT,
        "WARN",
        "An alert, when it first appears or its message changes.",
        "The alert's message.",
        (*_COMMON_EVENT, *_ROOM_OPTIONAL),
        "The alert's code, such as `valve.stuck`, `driver.mqtt` or `boiler.no_heat`.",
    ),
    EventDef(
        ALERT_CLEARED,
        "INFO",
        "An alert that no longer holds.",
        "The alert's last message, after `Cleared: `.",
        (*_COMMON_EVENT, *_ROOM_OPTIONAL),
        "The cleared alert's code, so it pairs with its `radiate.alert`.",
    ),
    EventDef(
        BURN,
        "INFO",
        "A burn ended: the heating relay went off.",
        "`Burn ended after <n> min`.",
        (*_COMMON_EVENT, BURN_DURATION, DRY_RUN),
        "`boiler.burn`.",
    ),
    EventDef(
        MODE_CHANGED,
        "INFO",
        "The heating mode or the demand mode was changed through the API.",
        "`Heating mode changed from auto to frost`.",
        (*_COMMON_EVENT, MODE_KIND, MODE_BEFORE, MODE_AFTER),
        "`mode.changed`.",
    ),
    EventDef(
        PRESENCE_CHANGED,
        "INFO",
        "Who counts as home or away changed what the house does. People only as counts.",
        "The reason's message, which never names a person.",
        (*_COMMON_EVENT, PEOPLE_HOME, PEOPLE_AWAY),
        "`away.*`.",
    ),
    EventDef(
        LEARNING_INVALIDATED,
        "WARN",
        "A room's learned model was dropped, invalidated by a release, or reset.",
        "The learning note's message.",
        (*_COMMON_EVENT, *_ROOM_OPTIONAL),
        "`learning.invalidated`, `learning.reset`.",
    ),
    EventDef(
        SETTINGS_CHANGED,
        "INFO",
        "Settings were saved or reverted in the web UI, or the household setup changed.",
        "`Settings saved: 2 changed`, or the household setup's message.",
        (*_COMMON_EVENT, SETTINGS_PATHS, SETTINGS_RESTART),
        "`settings.saved`, `settings.reverted`, `household.setup`.",
    ),
    EventDef(
        EXPORT_DROPPED,
        "WARN",
        "The OpenTelemetry export lost data: a full queue dropped its oldest records, or "
        "the collector rejected some. At most one record an hour for each signal and "
        "cause, with the count since the last.",
        "`<n> queued metric records dropped: queue full`.",
        (*_COMMON_EVENT, EXPORT_SIGNAL, DROPPED_COUNT, ERROR_TYPE),
        "`export.dropped`.",
    ),
)


# Security audit events (ADR-0008). Every one also goes to Radiate's own audit log
# and process log, whether or not the export is on (`radiate.server.security`).
_SEC = (EVENT_ACTION, EVENT_CATEGORY, EVENT_TYPE, EVENT_OUTCOME)
_WHO = (USER_NAME, USER_ROLES, SOURCE_ADDRESS, AUTH_METHOD)
_REQUEST = (HTTP_METHOD, URL_PATH, SECURITY_COUNT)

SECURITY_EVENTS: tuple[EventDef, ...] = (
    EventDef(
        SECURITY_LOGIN,
        "INFO",
        "Someone signed in: with a password, OIDC or SAML. Security audit.",
        "`Signed in: alice (admin, password)`.",
        (*_SEC, USER_NAME.needed(), USER_ROLES.needed(), SOURCE_ADDRESS, AUTH_METHOD.needed()),
        "`login`.",
    ),
    EventDef(
        SECURITY_LOGIN_FAILED,
        "WARN",
        "A sign-in was refused, with why. Security audit.",
        "`Sign-in refused for alice: wrong password`.",
        (*_SEC, USER_NAME, SOURCE_ADDRESS, AUTH_METHOD.needed(), LOGIN_ERROR, SECURITY_COUNT),
        "`login`.",
    ),
    EventDef(
        SECURITY_LOGOUT,
        "INFO",
        "Someone signed out. Security audit.",
        "`Signed out: alice`.",
        (*_SEC, USER_NAME.needed(), USER_ROLES, SOURCE_ADDRESS, AUTH_METHOD),
        "`logout`.",
    ),
    EventDef(
        SECURITY_SESSION_ENDED,
        "INFO",
        "Sessions ended without signing out: they expired, or a password, role or account "
        "changed. Security audit.",
        "`Session expired: alice`, or `2 sessions ended for alice: password reset`.",
        (*_SEC, USER_NAME.needed(), USER_ROLES, AUTH_METHOD, SESSION_REASON, SESSIONS_ENDED),
        "`session.expired`, `session.idle`, `session.revoked`.",
    ),
    EventDef(
        SECURITY_REQUEST_REFUSED,
        "WARN",
        "An API request or a stream connection was refused for missing or wrong "
        "credentials (401, or the stream closed with 4401). Security audit.",
        "`Request refused: wrong API token`.",
        (*_SEC, SOURCE_ADDRESS, REQUEST_ERROR, *_REQUEST),
        "`request.refused`, `stream.refused`.",
    ),
    EventDef(
        SECURITY_ACCESS_DENIED,
        "WARN",
        "An authenticated request was refused (403): the role may not make it, the CSRF "
        "token was wrong, or the stream's Origin was another site. Security audit.",
        "`Refused: alice (viewer) needs admin for PUT /api/v1/layout`.",
        (*_SEC, *_WHO, ACCESS_ERROR, NEEDED_ROLE, *_REQUEST),
        "`access.denied`.",
    ),
    EventDef(
        SECURITY_LOCKOUT_STARTED,
        "WARN",
        "Too many failed password sign-ins locked a username or a client address. Security audit.",
        "`Sign-in locked for 900 s: username alice`.",
        (*_SEC, USER_NAME, SOURCE_ADDRESS, LOCKOUT_SCOPE, LOCKOUT_DURATION),
        "`lockout.started`.",
    ),
    EventDef(
        SECURITY_LOCKOUT_ENDED,
        "INFO",
        "A sign-in lockout ended. Security audit.",
        "`Sign-in lockout ended: username alice`.",
        (*_SEC, USER_NAME, SOURCE_ADDRESS, LOCKOUT_SCOPE),
        "`lockout.ended`.",
    ),
    EventDef(
        SECURITY_USER_CHANGED,
        "INFO",
        "A user was added, removed, given a new password or a new role, with `radiate "
        "users`. Security audit.",
        "`User added: alice (admin)`.",
        (*_SEC, USER_TARGET_NAME, USER_TARGET_ROLES, AUTH_METHOD),
        "`user.added`, `user.removed`, `user.password_reset`, `user.role_changed`.",
    ),
    EventDef(
        SECURITY_CONFIG_CHANGED,
        "INFO",
        "Someone changed how Radiate runs: settings, the household setup, the layout, or "
        "learned models. Who and what, never a value. Security audit.",
        "`Settings saved by alice: boiler.min_burn_min`.",
        (*_SEC, *_WHO, CONFIG_AREA, CONFIG_PATHS, ROOM_IDS, HTTP_METHOD, URL_PATH),
        "`settings.saved`, `settings.reverted`, `household.saved`, `household.reverted`, "
        "`layout.saved`, `learning.reset`.",
    ),
    EventDef(
        SECURITY_LOGIN_CONFIG,
        "INFO",
        "How Radiate lets people in, at every start. Security audit.",
        "`Login on: password, oidc; API token set`.",
        (*_SEC, LOGIN_ON, LOGIN_METHODS, TOKEN_SET, INGRESS_SET, PROXY_COUNT),
        "`login.config`.",
    ),
)

# ECS categorisation of each security event: (event.category, event.type, outcome).
# A builder may give another event.type within the category (user.changed does).
SECURITY_KINDS: dict[str, tuple[str, str, str]] = {
    SECURITY_LOGIN: ("authentication", "start", "success"),
    SECURITY_LOGIN_FAILED: ("authentication", "start", "failure"),
    SECURITY_LOGOUT: ("authentication", "end", "success"),
    SECURITY_SESSION_ENDED: ("authentication", "end", "success"),
    SECURITY_REQUEST_REFUSED: ("authentication", "start", "failure"),
    SECURITY_ACCESS_DENIED: ("web", "access", "failure"),
    SECURITY_LOCKOUT_STARTED: ("authentication", "info", "failure"),
    SECURITY_LOCKOUT_ENDED: ("authentication", "info", "success"),
    SECURITY_USER_CHANGED: ("iam", "change", "success"),
    SECURITY_CONFIG_CHANGED: ("configuration", "change", "success"),
    SECURITY_LOGIN_CONFIG: ("configuration", "info", "success"),
}

EVENTS = (*EVENTS, *SECURITY_EVENTS)

EVENT_BY_NAME: dict[str, EventDef] = {e.name: e for e in EVENTS}

# Reason values (`Reason.values`) that decision records carry, by attribute.
REASON_VALUES: dict[str, str] = {
    "temperature_c": ROOM_TEMPERATURE.key,
    "target_c": ROOM_TARGET.key,
    "predicted_burn_min": PREDICTED_BURN.key,
    "pooled_demand_min": POOLED_DEMAND.key,
}


def event_for_code(code: str, alert: bool = False) -> str:
    """The event a reason with `code` is sent as."""
    if alert:
        return ALERT
    if code.startswith("away."):
        return PRESENCE_CHANGED
    if code in ("learning.invalidated", "learning.reset"):
        return LEARNING_INVALIDATED
    if code == "household.setup":
        return SETTINGS_CHANGED
    return DECISION


# --- log record builders -----------------------------------------------------------------
#
# Each returns a queued record: {"e": event name, "c": event.action, "m": body,
# "r": room ID or None, "a": other attributes}. The runtime adds "t", the Unix time.


def _finite(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(float(value))
    )


def reason_record(
    code: str,
    message: str,
    room_id: str | None = None,
    values: Mapping[str, Any] | None = None,
    *,
    alert: bool = False,
    people: tuple[int, int] | None = None,
) -> dict:
    """A decision, alert, presence, learning or household record from a reason.

    `people`: (home, away) counts, for a presence record.
    """
    name = event_for_code(code, alert)
    attrs: dict[str, Any] = {}
    if name == DECISION:
        for key, attr in REASON_VALUES.items():
            v = (values or {}).get(key)
            if _finite(v):
                attrs[attr] = round(float(v), 3)
    elif name == PRESENCE_CHANGED and people is not None:
        attrs[PEOPLE_HOME.key], attrs[PEOPLE_AWAY.key] = int(people[0]), int(people[1])
    elif name == SETTINGS_CHANGED:
        attrs[SETTINGS_PATHS.key] = ["household"]
        attrs[SETTINGS_RESTART.key] = False
    if name in (PRESENCE_CHANGED, SETTINGS_CHANGED):
        room_id = None  # house-wide
    return {"e": name, "c": code, "m": message, "r": room_id, "a": attrs}


def alert_cleared_record(code: str, message: str, room_id: str | None = None) -> dict:
    return {"e": ALERT_CLEARED, "c": code, "m": f"Cleared: {message}", "r": room_id, "a": {}}


def burn_record(duration_s: float, dry_run: bool) -> dict:
    return {
        "e": BURN,
        "c": "boiler.burn",
        "m": f"Burn ended after {duration_s / 60:.0f} min",
        "r": None,
        "a": {BURN_DURATION.key: round(float(duration_s), 1), DRY_RUN.key: bool(dry_run)},
    }


def mode_record(kind: str, before: str, after: str) -> dict:
    label = "Heating mode" if kind == "heating" else "Demand mode"
    return {
        "e": MODE_CHANGED,
        "c": "mode.changed",
        "m": f"{label} changed from {before} to {after}",
        "r": None,
        "a": {MODE_KIND.key: kind, MODE_BEFORE.key: before, MODE_AFTER.key: after},
    }


def settings_record(action: str, paths: Iterable[str], restart_required: bool) -> dict:
    """`action`: `settings.saved` or `settings.reverted`."""
    paths = sorted(paths)
    verb = "reverted" if action == "settings.reverted" else "saved"
    return {
        "e": SETTINGS_CHANGED,
        "c": action,
        "m": f"Settings {verb}: {len(paths)} changed",
        "r": None,
        "a": {SETTINGS_PATHS.key: paths, SETTINGS_RESTART.key: bool(restart_required)},
    }


def dropped_record(signal: str, count: int, why: str) -> dict:
    what = "queued metric record" if signal == "metrics" else "log record"
    what += "" if count == 1 else "s"
    cause = {
        "queue_full": "queue full",
        "partial_success": "rejected by the collector",
    }.get(why, f"collector answered {why}")
    return {
        "e": EXPORT_DROPPED,
        "c": "export.dropped",
        "m": f"{count} {what} dropped: {cause}",
        "r": None,
        "a": {EXPORT_SIGNAL.key: signal, DROPPED_COUNT.key: int(count), ERROR_TYPE.key: why},
    }


def security_record(name: str, action: str, message: str, attrs: Mapping[str, Any]) -> dict:
    """A security audit record (`radiate.security.*`, ADR-0008).

    `event.category`, `event.type` and `event.outcome` come from `SECURITY_KINDS`
    (`attrs` may give another `event.type`). Only the event's own attributes are kept,
    and None values are left out, so nothing outside the schema, a secret included,
    can ride along.
    """
    d = EVENT_BY_NAME[name]
    category, kind, outcome = SECURITY_KINDS[name]
    allowed = {a.key for a in d.attributes}
    out: dict[str, Any] = {
        EVENT_CATEGORY.key: category,
        EVENT_TYPE.key: kind,
        EVENT_OUTCOME.key: outcome,
    }
    for key, value in attrs.items():
        if key in allowed and key != EVENT_ACTION.key and value is not None:
            out[key] = list(value) if isinstance(value, (list, tuple)) else value
    return {"e": name, "c": action, "m": message, "r": None, "a": out}


# --- validation --------------------------------------------------------------------------

_JSON_TYPE = {
    STRING: "stringValue",
    INT: "intValue",
    DOUBLE: "doubleValue",
    BOOL: "boolValue",
    STRINGS: "arrayValue",
}


def _check_attrs(
    where: str, items: list[dict], allowed: Iterable[Attribute], problems: list[str]
) -> None:
    spec = {a.key: a for a in allowed}
    seen: set[str] = set()
    for kv in items:
        key = kv.get("key")
        a = spec.get(key)
        if a is None:
            problems.append(f"{where}: attribute {key} is not in the schema")
            continue
        if key in seen:
            problems.append(f"{where}: attribute {key} repeated")
        seen.add(key)
        value = kv.get("value") or {}
        field = _JSON_TYPE[a.type]
        if set(value) != {field}:
            problems.append(f"{where}: {key} should be {a.type}, got {sorted(value)}")
            continue
        if a.type == STRINGS:
            vals = value[field].get("values", [])
            if not all(set(v) == {"stringValue"} for v in vals):
                problems.append(f"{where}: {key} should hold strings only")
        if a.values and value[field] not in a.values:
            problems.append(f"{where}: {key} {value[field]!r} is not one of {a.values}")
    for a in spec.values():
        if a.required and a.key not in seen:
            problems.append(f"{where}: required attribute {a.key} missing")


def _check_resource(where: str, res: dict, problems: list[str]) -> None:
    _check_attrs(f"{where} resource", res.get("attributes", []), RESOURCE, problems)
    for kv in res.get("attributes", []):
        if kv.get("key") == SCHEMA.key and kv["value"].get("stringValue") != SCHEMA_VERSION:
            problems.append(f"{where}: radiate.schema.version is not {SCHEMA_VERSION}")


def check_metrics(request: Mapping[str, Any]) -> list[str]:
    """Every way an ExportMetricsServiceRequest (OTLP/JSON) departs from the schema."""
    problems: list[str] = []
    for rm in request.get("resourceMetrics", []):
        _check_resource("metrics", rm.get("resource", {}), problems)
        for sm in rm.get("scopeMetrics", []):
            for m in sm.get("metrics", []):
                name = m.get("name")
                d = METRIC_BY_NAME.get(name)
                if d is None:
                    problems.append(f"metric {name} is not in the schema")
                    continue
                if m.get("unit") != d.unit:
                    problems.append(f"{name}: unit {m.get('unit')!r}, schema {d.unit!r}")
                if m.get("description") != d.brief:
                    problems.append(f"{name}: description differs from the schema")
                if d.instrument not in m or len(set(m) & {GAUGE, SUM}) != 1:
                    problems.append(f"{name}: should be a {d.instrument}")
                    continue
                data = m[d.instrument]
                if d.instrument == SUM:
                    if data.get("aggregationTemporality") != 2 or data.get("isMonotonic") is not (
                        d.monotonic
                    ):
                        problems.append(f"{name}: should be a cumulative monotonic sum")
                for p in data.get("dataPoints", []):
                    if not _finite(p.get("asDouble")):
                        problems.append(f"{name}: a point without a finite asDouble")
                    if d.instrument == SUM and "startTimeUnixNano" not in p:
                        problems.append(f"{name}: a sum point without a start time")
                    _check_attrs(name, p.get("attributes", []), d.attributes, problems)
    return problems


def check_logs(request: Mapping[str, Any]) -> list[str]:
    """Every way an ExportLogsServiceRequest (OTLP/JSON) departs from the schema."""
    problems: list[str] = []
    for rl in request.get("resourceLogs", []):
        _check_resource("logs", rl.get("resource", {}), problems)
        for sl in rl.get("scopeLogs", []):
            for rec in sl.get("logRecords", []):
                name = rec.get("eventName")
                d = EVENT_BY_NAME.get(name)
                if d is None:
                    problems.append(f"event {name} is not in the schema")
                    continue
                if rec.get("severityText") != d.severity or rec.get(
                    "severityNumber"
                ) != SEVERITY.get(d.severity):
                    problems.append(f"{name}: severity should be {d.severity}")
                body = (rec.get("body") or {}).get("stringValue")
                if not isinstance(body, str) or not body:
                    problems.append(f"{name}: the body should be text")
                _check_attrs(name, rec.get("attributes", []), d.attributes, problems)
    return problems


# --- snapshot and docs -------------------------------------------------------------------


def _attr_dict(a: Attribute) -> dict:
    out: dict[str, Any] = {"type": a.type, "required": a.required}
    if a.unit:
        out["unit"] = a.unit
    if a.values:
        out["values"] = list(a.values)
    return out


def snapshot() -> dict:
    """The schema as plain data: what the version snapshots in the tests hold."""
    return {
        "version": SCHEMA_VERSION,
        "resource": {a.key: _attr_dict(a) for a in RESOURCE},
        "metrics": {
            m.name: {
                "instrument": m.instrument,
                "unit": m.unit,
                "cadence": m.cadence,
                "monotonic": m.monotonic,
                "temporality": m.temporality,
                "attributes": {a.key: _attr_dict(a) for a in m.attributes},
            }
            for m in METRICS
        },
        "events": {
            e.name: {
                "severity": e.severity,
                "attributes": {a.key: _attr_dict(a) for a in e.attributes},
            }
            for e in EVENTS
        },
    }


def additive_problems(old: Mapping[str, Any], new: Mapping[str, Any]) -> list[str]:
    """How `new` breaks `old`: anything removed or changed, or an attribute made required.

    Within a major version this must be empty."""
    problems: list[str] = []

    def attrs(where: str, a: Mapping[str, Any], b: Mapping[str, Any]) -> None:
        for key, spec in a.items():
            if key not in b:
                problems.append(f"{where}: attribute {key} removed")
                continue
            other = b[key]
            for field in ("type", "unit"):
                if spec.get(field) != other.get(field):
                    problems.append(f"{where}: attribute {key} {field} changed")
            if not spec["required"] and other["required"]:
                problems.append(f"{where}: attribute {key} became required")
            if spec.get("values") and not set(spec["values"]) <= set(other.get("values", [])):
                problems.append(f"{where}: attribute {key} lost a value")
        for key, spec in b.items():
            if key not in a and spec["required"]:
                problems.append(f"{where}: new attribute {key} is required")

    attrs("resource", old["resource"], new["resource"])
    for kind in ("metrics", "events"):
        for name, spec in old[kind].items():
            if name not in new[kind]:
                problems.append(f"{kind[:-1]} {name} removed")
                continue
            other = new[kind][name]
            for field, value in spec.items():
                if field != "attributes" and other.get(field) != value:
                    problems.append(f"{name}: {field} changed")
            attrs(name, spec["attributes"], other["attributes"])
    return problems


def _cell(text: str) -> str:
    return text.replace("|", "\\|").replace("\n", " ")


def _attr_rows(attrs: Iterable[Attribute]) -> list[str]:
    rows = []
    for a in attrs:
        kind = a.type + (f", `{a.unit}`" if a.unit else "")
        need = "required" if a.required else "optional"
        values = f" One of {', '.join(f'`{v}`' for v in a.values)}." if a.values else ""
        conv = f" ({a.convention})" if a.convention else ""
        rows.append(f"| `{a.key}`{conv} | {kind} | {need} | {_cell(a.brief)}{values} |")
    return rows


_ATTR_HEAD = ["| Attribute | Type | | Description |", "|---|---|---|---|"]


def markdown() -> dict[str, str]:
    """The generated sections of docs/telemetry.md, by marker name."""
    out: dict[str, str] = {}
    out["version"] = f"Current version: **{SCHEMA_VERSION}**."
    out["resource"] = "\n".join([*_ATTR_HEAD, *_attr_rows(RESOURCE)])

    def metric_table(ms: Iterable[MetricDef]) -> str:
        rows = [
            "| Metric | Instrument | Unit | Attributes | Description |",
            "|---|---|---|---|---|",
        ]
        for m in ms:
            inst = "sum, cumulative, monotonic" if m.instrument == SUM else "gauge"
            keys = ", ".join(f"`{a.key}`" for a in m.attributes) or "none"
            src = (
                f" Raw data: `{m.source}`." if m.cadence == MINUTE and m.instrument == GAUGE else ""
            )
            rows.append(f"| `{m.name}` | {inst} | `{m.unit}` | {keys} | {_cell(m.brief)}{src} |")
        return "\n".join(rows)

    per_tick = [m for m in METRICS if m.cadence == MINUTE and m.instrument == GAUGE]
    out["metrics-minute"] = metric_table(per_tick)
    out["metrics-counters"] = metric_table(COUNTERS)
    out["metrics-daily"] = metric_table(DAILY_METRICS)
    attrs: dict[str, Attribute] = {}
    for m in METRICS:
        for a in m.attributes:
            attrs.setdefault(a.key, a)
    out["metric-attributes"] = "\n".join(
        [
            "| Attribute | Type | Description |",
            "|---|---|---|",
            *(
                f"| `{a.key}` | {a.type} | {_cell(a.brief)}"
                + (f" One of {', '.join(f'`{v}`' for v in a.values)}." if a.values else "")
                + " |"
                for a in attrs.values()
            ),
        ]
    )
    summary = ["| Event | Severity | `event.action` | Description |", "|---|---|---|---|"]
    for e in EVENTS:
        summary.append(f"| `{e.name}` | {e.severity} | {_cell(e.codes)} | {_cell(e.brief)} |")
    out["events"] = "\n".join(summary)
    details = []
    for e in EVENTS:
        details += [
            f"#### `{e.name}`",
            "",
            f"{e.brief} Severity {e.severity} ({SEVERITY[e.severity]}). Body: {e.body}",
            "",
            *_ATTR_HEAD,
            *_attr_rows(e.attributes),
            "",
        ]
    out["event-details"] = "\n".join(details).rstrip()
    return out


def render_doc(text: str) -> str:
    """`text` (docs/telemetry.md) with every generated section filled in afresh."""
    for name, body in markdown().items():
        start, end = f"<!-- generated: {name} -->", f"<!-- end generated: {name} -->"
        i, j = text.find(start), text.find(end)
        if i < 0 or j < i:
            raise ValueError(f"docs/telemetry.md has no {start} section")
        text = text[: i + len(start)] + "\n" + body + "\n" + text[j:]
    return text
