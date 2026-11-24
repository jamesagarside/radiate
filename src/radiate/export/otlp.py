"""OpenTelemetry export over OTLP/HTTP (spec 9.1).

Sends every raw data series (`radiate.core.series`) once a minute as OTLP gauges, the
day's running totals as cumulative sums, each closed day's summary and savings as
gauges, and each event (a decision, an alert, a mode change and so on) as an OTLP log
record, to any OTLP/HTTP collector: an OpenTelemetry Collector, Elastic's managed OTLP
endpoint, or anything else that speaks the protocol. Configured in the house file
under `export.otlp` (`radiate.config.export`). Every name, unit and attribute comes
from the telemetry schema, `radiate.export.telemetry` (docs/telemetry.md).

Encoding is done here, with the standard library only. Requests are first built as the
OTLP/JSON mapping (lowerCamelCase field names, 64-bit integers as strings), then sent
either as that JSON (`http/json`) or as protobuf (`http/protobuf`, the default), which
a small table of field numbers below turns into the binary wire format. Field numbers
come from opentelemetry-proto v1 (`opentelemetry/proto/{metrics,logs,common,resource}/
v1/*.proto` and `collector/*/v1/*_service.proto`); the tests check both encodings
against the official generated classes.

Like the Elastic export, it never blocks or breaks the control loop: each tick only
appends to a bounded queue (on disk with a state database), a separate task sends
batches with exponential backoff, and when the queue is full the oldest records go,
counted in `health()["dropped"]`. Retries follow the OTLP specification: 429, 502,
503 and 504 (and network errors) are retried, honouring `Retry-After`; 400 drops the
batch; 413 halves the batch. Authentication and other errors keep the data and back
off, so a fixed key delivers the backlog.

No personal data: the resource carries a random house ID, never a name or location,
and people only as counts. The API key is never logged or returned by the API.
"""

from __future__ import annotations

import asyncio
import contextlib
import gzip
import json
import logging
import math
import os
import struct
import time
from collections.abc import Callable, Mapping
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

import aiohttp

from radiate import __version__
from radiate.config.export import OtlpConfig
from radiate.core.series import BY_ID, LEVEL, split_key
from radiate.export import telemetry
from radiate.server.store import ExportQueue, MemoryQueue

LOG = logging.getLogger(__name__)

API_KEY_ENV = "RADIATE_OTLP_API_KEY"
METRICS_MAX = 7 * 24 * 60  # 7 days of ticks
LOGS_MAX = 20_000
METRICS_BATCH = 30  # ticks a request: about 2,000 data points, well under 1 MB
LOGS_BATCH = 500
MAX_BACKOFF_S = 600.0
AGGREGATION_CUMULATIVE = 2  # AggregationTemporality.AGGREGATION_TEMPORALITY_CUMULATIVE
DROPPED_EVERY_S = 3600.0  # at most one radiate.export.dropped record an hour per cause
SCOPE = "radiate"


# --- protobuf wire format --------------------------------------------------------------

# message -> JSON field name -> (field number, type). A type is a scalar name or another
# message. Only the fields Radiate sends are listed.
_PROTO: dict[str, dict[str, tuple[int, str]]] = {
    "ExportMetricsServiceRequest": {"resourceMetrics": (1, "ResourceMetrics")},
    "ExportLogsServiceRequest": {"resourceLogs": (1, "ResourceLogs")},
    "ResourceMetrics": {
        "resource": (1, "Resource"),
        "scopeMetrics": (2, "ScopeMetrics"),
        "schemaUrl": (3, "string"),
    },
    "ResourceLogs": {
        "resource": (1, "Resource"),
        "scopeLogs": (2, "ScopeLogs"),
        "schemaUrl": (3, "string"),
    },
    "Resource": {"attributes": (1, "KeyValue")},
    "ScopeMetrics": {
        "scope": (1, "InstrumentationScope"),
        "metrics": (2, "Metric"),
        "schemaUrl": (3, "string"),
    },
    "ScopeLogs": {
        "scope": (1, "InstrumentationScope"),
        "logRecords": (2, "LogRecord"),
        "schemaUrl": (3, "string"),
    },
    "InstrumentationScope": {
        "name": (1, "string"),
        "version": (2, "string"),
        "attributes": (3, "KeyValue"),
    },
    "Metric": {
        "name": (1, "string"),
        "description": (2, "string"),
        "unit": (3, "string"),
        "gauge": (5, "Gauge"),
        "sum": (7, "Sum"),
    },
    "Gauge": {"dataPoints": (1, "NumberDataPoint")},
    "Sum": {
        "dataPoints": (1, "NumberDataPoint"),
        "aggregationTemporality": (2, "varint"),
        "isMonotonic": (3, "bool"),
    },
    "NumberDataPoint": {
        "startTimeUnixNano": (2, "fixed64"),
        "timeUnixNano": (3, "fixed64"),
        "asDouble": (4, "double"),
        "attributes": (7, "KeyValue"),
    },
    "LogRecord": {
        "timeUnixNano": (1, "fixed64"),
        "severityNumber": (2, "varint"),
        "severityText": (3, "string"),
        "body": (5, "AnyValue"),
        "attributes": (6, "KeyValue"),
        "observedTimeUnixNano": (11, "fixed64"),
        "eventName": (12, "string"),
    },
    "KeyValue": {"key": (1, "string"), "value": (2, "AnyValue")},
    "AnyValue": {
        "stringValue": (1, "string"),
        "boolValue": (2, "bool"),
        "intValue": (3, "varint"),
        "doubleValue": (4, "double"),
        "arrayValue": (5, "ArrayValue"),
    },
    "ArrayValue": {"values": (1, "AnyValue")},
}


def _varint(n: int) -> bytes:
    n &= (1 << 64) - 1  # negative int64 as two's complement, ten bytes
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def _field(num: int, kind: str, value: Any) -> bytes:
    if kind == "string":
        data = str(value).encode()
        return _varint(num << 3 | 2) + _varint(len(data)) + data
    if kind == "double":
        return _varint(num << 3 | 1) + struct.pack("<d", float(value))
    if kind == "fixed64":
        return _varint(num << 3 | 1) + struct.pack("<Q", int(value))
    if kind == "varint":
        return _varint(num << 3) + _varint(int(value))
    if kind == "bool":
        return _varint(num << 3) + _varint(1 if value else 0)
    data = encode_message(kind, value)
    return _varint(num << 3 | 2) + _varint(len(data)) + data


def encode_message(name: str, obj: Mapping[str, Any]) -> bytes:
    """Protobuf bytes for an OTLP/JSON mapping of message `name`, fields in number order."""
    spec = _PROTO[name]
    parts = []
    for key in obj:
        if key not in spec:
            raise ValueError(f"{name}.{key} is not encoded")
    for key, (num, kind) in sorted(spec.items(), key=lambda kv: kv[1][0]):
        if key not in obj:
            continue
        value = obj[key]
        for item in value if isinstance(value, list) else [value]:
            parts.append(_field(num, kind, item))
    return b"".join(parts)


def _read_varint(data: bytes, i: int) -> tuple[int, int]:
    n = shift = 0
    while True:
        b = data[i]
        i += 1
        n |= (b & 0x7F) << shift
        shift += 7
        if not b & 0x80:
            return n, i


def _fields(data: bytes) -> dict[int, Any]:
    """Top-level fields of a protobuf message (varints and length-delimited only)."""
    out: dict[int, Any] = {}
    i = 0
    while i < len(data):
        tag, i = _read_varint(data, i)
        num, wire = tag >> 3, tag & 7
        if wire == 0:
            out[num], i = _read_varint(data, i)
        elif wire == 2:
            n, i = _read_varint(data, i)
            out[num], i = data[i : i + n], i + n
        elif wire == 1:
            i += 8
        elif wire == 5:
            i += 4
        else:
            raise ValueError("unsupported wire type")
    return out


def partial_success(body: bytes, protocol: str) -> tuple[int, str]:
    """(rejected items, error message) from an export response; (0, "") for none."""
    if not body:
        return 0, ""
    try:
        if protocol == "http/json":
            ps = json.loads(body).get("partialSuccess") or {}
            rejected = ps.get("rejectedDataPoints") or ps.get("rejectedLogRecords") or 0
            return int(rejected), str(ps.get("errorMessage") or "")
        ps = _fields(body).get(1)
        if not isinstance(ps, bytes):
            return 0, ""
        f = _fields(ps)
        msg = f.get(2, b"")
        return int(f.get(1, 0)), msg.decode(errors="replace") if isinstance(msg, bytes) else ""
    except (ValueError, IndexError, AttributeError, TypeError):
        return 0, ""


# --- requests --------------------------------------------------------------------------


def _attr(key: str, value: Any) -> dict:
    if isinstance(value, bool):
        return {"key": key, "value": {"boolValue": value}}
    if isinstance(value, int):
        return {"key": key, "value": {"intValue": str(value)}}
    if isinstance(value, float):
        return {"key": key, "value": {"doubleValue": value}}
    if isinstance(value, (list, tuple)):
        items = [{"stringValue": str(v)} for v in value]
        return {"key": key, "value": {"arrayValue": {"values": items}}}
    return {"key": key, "value": {"stringValue": str(value)}}


def _nanos(t: float) -> str:
    return str(int(round(t * 1e9)))


def _num(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value) if math.isfinite(value) else None


def resource(house_id: str, dataset: str = "") -> dict:
    attrs = [
        _attr("service.name", "radiate"),
        _attr("service.version", __version__),
        _attr("service.instance.id", house_id),
        _attr("radiate.house.id", house_id),
        _attr("radiate.schema.version", telemetry.SCHEMA_VERSION),
    ]
    if dataset:
        attrs.append(_attr("data_stream.dataset", dataset))
    return {"attributes": attrs}


def _scope() -> dict:
    return {"name": SCOPE, "version": __version__}


class _Metrics:
    """The metrics of one request, each named and typed by its schema definition."""

    def __init__(self, rooms: Mapping[str, str]):
        self.rooms = rooms
        self.by_name: dict[str, dict] = {}

    def _room(self, room: str | None) -> list[dict]:
        if room is None:
            return []
        attrs = [_attr(telemetry.ROOM_ID.key, room)]
        if room in self.rooms:
            attrs.append(_attr(telemetry.ROOM_NAME.key, self.rooms[room]))
        return attrs

    def add(
        self,
        d: telemetry.MetricDef,
        ts: str,
        value: float,
        attrs: list[dict] | None = None,
        start: str | None = None,
    ) -> None:
        entry = self.by_name.get(d.name)
        if entry is None:
            data: dict[str, Any] = {"dataPoints": []}
            if d.instrument == telemetry.SUM:
                data["aggregationTemporality"] = AGGREGATION_CUMULATIVE
                data["isMonotonic"] = d.monotonic
            entry = self.by_name[d.name] = {
                "name": d.name,
                "description": d.brief,
                "unit": d.unit,
                d.instrument: data,
            }
        point: dict[str, Any] = {}
        if start is not None:
            point["startTimeUnixNano"] = start
        point["timeUnixNano"] = ts
        point["asDouble"] = float(value)
        if attrs:
            point["attributes"] = attrs
        entry[d.instrument]["dataPoints"].append(point)

    def tick(self, rec: dict) -> None:
        """One tick: the raw data series as gauges, and the day's running totals."""
        t, values = rec.get("t"), rec.get("v")
        if not isinstance(t, (int, float)) or not isinstance(values, dict):
            return
        ts = _nanos(t)
        for key, value in values.items():
            series, room = split_key(key)
            d = telemetry.METRIC_BY_SERIES.get(series)
            m = BY_ID.get(series)
            v = _num(value)
            if d is None or m is None or v is None:
                continue
            attrs = self._room(room)
            if m.kind == LEVEL:
                # A state set (OpenTelemetry's `hw.status` pattern): one point per state.
                for i, level in enumerate(m.levels):
                    state = [*attrs, _attr(telemetry.BOILER_STATE.key, level)]
                    self.add(d, ts, 1.0 if i == int(v) else 0.0, state)
                continue
            self.add(d, ts, v, attrs)
        totals, start = rec.get("k"), _num(rec.get("k0"))
        if isinstance(totals, dict) and start is not None:
            for d in telemetry.COUNTERS:
                v = _num(totals.get(d.source))
                if v is not None:
                    self.add(d, ts, v, start=_nanos(start))

    def day(self, rec: dict) -> None:
        """A closed day: its summary and savings as gauges at the day's last second."""
        day = rec.get("d")
        if not isinstance(day, dict) or not isinstance(day.get("summary"), dict):
            return
        summary = day["summary"]
        estimate = day.get("estimate") if isinstance(day.get("estimate"), dict) else None
        end, start = _num(day.get("end")), _num(day.get("start"))
        if end is None:
            return
        ts = _nanos(end)
        st = _nanos(start) if start is not None else None
        partial = _attr(telemetry.DAY_PARTIAL.key, bool(summary.get("partial", False)))
        sources = {"summary": summary, "estimate": _with_share(estimate)}
        for d in telemetry.DAILY_METRICS:
            base, _, path = d.source.partition(".")
            value: Any = sources.get(base)
            for part in path.split("."):
                value = value.get(part) if isinstance(value, dict) else None
            extra = _daily_attrs(d, summary, estimate)
            if extra is None:
                continue
            if isinstance(value, dict):  # one point per room
                for room, v in sorted(value.items()):
                    if _num(v) is not None:
                        self.add(d, ts, float(v), [*self._room(room), partial, *extra], st)
            elif _num(value) is not None:
                self.add(d, ts, float(value), [partial, *extra], st)

    def request(self, house_id: str, dataset: str) -> dict:
        order = {d.name: i for i, d in enumerate(telemetry.METRICS)}
        metrics = sorted(self.by_name.values(), key=lambda m: order[m["name"]])
        return {
            "resourceMetrics": [
                {
                    "resource": resource(house_id, dataset),
                    "scopeMetrics": [{"scope": _scope(), "metrics": metrics}],
                }
            ]
        }


def _with_share(estimate: dict | None) -> dict | None:
    """The day's savings estimate with the share of the baseline saved, in %."""
    if estimate is None:
        return None
    saved, base = _num(estimate.get("litres_saved")), _num(estimate.get("litres_baseline"))
    share = round(100.0 * saved / base, 1) if saved is not None and base else None
    return {**estimate, "percent_saved": share}


def _daily_attrs(d: telemetry.MetricDef, summary: dict, estimate: dict | None) -> list | None:
    """The attributes a daily metric needs besides the room and `radiate.day.partial`;
    None when one is unknown, so the metric is not sent."""
    out = []
    keys = {a.key for a in d.attributes}
    if telemetry.BURNER_BASIS.key in keys:
        basis = summary.get("basis", "relay")
        if basis not in telemetry.BURNER_BASIS.values:
            return None
        out.append(_attr(telemetry.BURNER_BASIS.key, basis))
    if telemetry.SAVINGS_ELIGIBLE.key in keys:
        if estimate is None:
            return None
        out.append(_attr(telemetry.SAVINGS_ELIGIBLE.key, bool(estimate.get("eligible"))))
    return out


def metrics_request(
    records: list[dict], house_id: str, rooms: Mapping[str, str], dataset: str = ""
) -> dict:
    """ExportMetricsServiceRequest (OTLP/JSON) for queued metric records.

    A tick is {"t": Unix, "v": series values, "k": the day's running totals, "k0": when
    they started, local midnight}; a closed day is {"t", "d": {"summary", "estimate",
    "start", "end"}}. Names, units, instruments and attributes come from the telemetry
    schema (`radiate.export.telemetry`). Room metrics carry `radiate.room.id` and
    `radiate.room.name`.
    """
    out = _Metrics(rooms)
    for rec in records:
        if not isinstance(rec, dict):
            continue
        if "d" in rec:
            out.day(rec)
        else:
            out.tick(rec)
    return out.request(house_id, dataset)


def _log_record(rec: dict, rooms: Mapping[str, str]) -> dict | None:
    t, code, message = rec.get("t"), rec.get("c"), rec.get("m")
    if not isinstance(t, (int, float)) or not isinstance(code, str):
        return None
    name = rec.get("e")
    if name in telemetry.EVENT_BY_NAME:
        extra = rec.get("a") if isinstance(rec.get("a"), dict) else {}
    else:
        # Queued before the schema, or by a newer version: sent by its code.
        built = telemetry.reason_record(code, str(message or ""), rec.get("r"))
        name, extra = built["e"], built["a"]
    d = telemetry.EVENT_BY_NAME[name]
    allowed = {a.key for a in d.attributes}
    attrs = [_attr(telemetry.EVENT_ACTION.key, code)]
    room = rec.get("r")
    if room and telemetry.ROOM_ID.key in allowed:
        attrs.append(_attr(telemetry.ROOM_ID.key, str(room)))
        if room in rooms:
            attrs.append(_attr(telemetry.ROOM_NAME.key, rooms[room]))
    for key, value in extra.items():
        if key in allowed and value is not None:
            attrs.append(_attr(key, value))
    ts = _nanos(t)
    return {
        "timeUnixNano": ts,
        "observedTimeUnixNano": ts,
        "severityNumber": telemetry.SEVERITY[d.severity],
        "severityText": d.severity,
        "body": {"stringValue": str(message or "")},
        "attributes": attrs,
        "eventName": name,
    }


def logs_request(
    records: list[dict],
    house_id: str,
    dataset: str = "",
    rooms: Mapping[str, str] | None = None,
) -> dict:
    """ExportLogsServiceRequest (OTLP/JSON) for queued events: {"t", "e", "c", "m", "r",
    "a"}, from `radiate.export.telemetry`'s builders plus the time.

    The event name goes in the log record's event name field (OpenTelemetry's
    `event_name`) only. `event.action` holds the reason code, as in the Elastic
    export's decision stream; the body is the message as the web UI shows it.
    """
    built = (_log_record(rec, rooms or {}) for rec in records if isinstance(rec, dict))
    out = [r for r in built if r is not None]
    return {
        "resourceLogs": [
            {
                "resource": resource(house_id, dataset),
                "scopeLogs": [{"scope": _scope(), "logRecords": out}],
            }
        ]
    }


def encode(request: dict, protocol: str) -> tuple[bytes, str]:
    """The request body and its content type."""
    if protocol == "http/json":
        return json.dumps(request, separators=(",", ":")).encode(), "application/json"
    name = (
        "ExportMetricsServiceRequest"
        if "resourceMetrics" in request
        else ("ExportLogsServiceRequest")
    )
    return encode_message(name, request), "application/x-protobuf"


def count_points(request: dict) -> int:
    n = 0
    for rm in request.get("resourceMetrics", []):
        for sm in rm["scopeMetrics"]:
            for m in sm["metrics"]:
                n += len((m.get("gauge") or m.get("sum") or {}).get("dataPoints", []))
    for rl in request.get("resourceLogs", []):
        for sl in rl["scopeLogs"]:
            n += len(sl["logRecords"])
    return n


# --- configuration ---------------------------------------------------------------------


def resolve_api_key(
    cfg: OtlpConfig,
    env: Mapping[str, str] | None = None,
    read: Callable[[str], str] | None = None,
) -> str | None:
    """The API key: `api_key`, else the file `api_key_file`, else RADIATE_OTLP_API_KEY.

    Raises ValueError when the file can't be read, without its contents.
    """
    if cfg.api_key:
        return cfg.api_key
    if cfg.api_key_file:
        try:
            raw = (read or (lambda p: Path(p).read_text()))(cfg.api_key_file)
        except OSError as err:
            raise ValueError(f"cannot read export.otlp.api_key_file: {err.strerror}") from err
        key = raw.strip()
        if key.startswith("ApiKey "):
            key = key[len("ApiKey ") :].strip()
        return key or None
    value = (os.environ if env is None else env).get(API_KEY_ENV, "").strip()
    return value or None


def headers(cfg: OtlpConfig, api_key: str | None) -> dict[str, str]:
    out = {"User-Agent": f"radiate/{__version__}"}
    if api_key and not any(k.lower() == "authorization" for k in cfg.headers):
        out["Authorization"] = f"ApiKey {api_key}"
    out.update(cfg.headers)
    return out


def safe_endpoint(url: str) -> str:
    """The endpoint without anything secret, to show and log."""
    p = urlsplit(url)
    host = p.hostname or ""
    port = f":{p.port}" if p.port else ""
    return f"{p.scheme}://{host}{port}{p.path}"


# --- exporter --------------------------------------------------------------------------


class OtlpExporter:
    """Queues ticks and decisions, and sends them in batches. Never blocks the loop."""

    def __init__(
        self,
        cfg: OtlpConfig,
        house_id: str,
        rooms: Mapping[str, str],
        api_key: str | None = None,
        metrics_queue: ExportQueue | None = None,
        logs_queue: ExportQueue | None = None,
        clock: Callable[[], float] = time.time,
    ):
        self.cfg = cfg
        self.house_id = house_id
        self.rooms = dict(rooms)
        self._secret = api_key or ""
        self._headers = headers(cfg, api_key)
        self.queues: dict[str, ExportQueue] = {
            "metrics": metrics_queue if metrics_queue is not None else MemoryQueue(METRICS_MAX),
            "logs": logs_queue if logs_queue is not None else MemoryQueue(LOGS_MAX),
        }
        self.batch = {"metrics": METRICS_BATCH, "logs": LOGS_BATCH}
        self.clock = clock
        self.sent = {"metrics": 0, "logs": 0}  # data points and log records accepted
        self.rejected = 0  # dropped by the collector (400, partial success)
        self.failures = 0  # attempts in a row that failed
        self.last_success: float | None = None
        self.last_attempt: float | None = None
        self.last_error: str | None = None
        self.last_error_at: float | None = None
        self.next_attempt: float | None = None
        self._retry_after: float | None = None
        self._task: asyncio.Task | None = None
        self._logged_error: str | None = None
        # Data lost and not yet reported as radiate.export.dropped, by (signal, cause).
        self._lost: dict[tuple[str, str], int] = {}
        self._lost_reported: dict[tuple[str, str], float] = {}
        self._queue_dropped = {s: self._dropped(s) for s in self.queues}

    # --- recording, from the control loop --------------------------------------------

    def record(
        self,
        wall: float,
        values: Mapping[str, float],
        events: list = (),
        totals: Mapping[str, float] | None = None,
        totals_start: float | None = None,
    ) -> None:
        """Queue one tick: its series `values`, the day's running `totals` (ledger
        fields, counted since `totals_start`) and `events`, each a record from
        `radiate.export.telemetry`'s builders or a (code, message, room) tuple."""
        if not self.cfg.enabled:
            return
        if "metrics" in self.cfg.signals and (values or totals):
            rec: dict[str, Any] = {"t": wall, "v": dict(values)}
            if totals and totals_start is not None:
                rec["k"], rec["k0"] = dict(totals), totals_start
            self.queues["metrics"].extend([rec])
        if "logs" in self.cfg.signals and events:
            out = []
            for ev in events:
                if isinstance(ev, dict):
                    out.append({"t": wall, **ev} if "t" not in ev else dict(ev))
                else:
                    code, msg, room = ev
                    out.append({"t": wall, **telemetry.reason_record(code, msg, room)})
            self.queues["logs"].extend(out)
        self._report_lost(wall)

    def record_day(
        self,
        wall: float,
        summary: Mapping[str, Any],
        estimate: Mapping[str, Any] | None,
        start: float | None,
        end: float,
    ) -> None:
        """Queue a closed day's summary and savings `estimate`, to be sent as gauges
        with `start`, the day's first second, as their start time. They are timed at
        `end`, the day's last second, or with `export.otlp.daily_timestamp: day_close`
        at `wall`, when Radiate closed the day. Nothing with `daily_metrics: false`."""
        if not self.cfg.enabled or "metrics" not in self.cfg.signals:
            return
        if not self.cfg.daily_metrics:
            return
        if self.cfg.daily_timestamp == "day_close":
            end = wall
        day = {"summary": dict(summary), "estimate": dict(estimate) if estimate else None}
        day.update(start=start, end=end)
        self.queues["metrics"].extend([{"t": wall, "d": day}])
        self._report_lost(wall)

    def _dropped(self, signal: str) -> int:
        return int(getattr(self.queues[signal], "dropped", 0))

    def _lose(self, signal: str, why: str, count: int) -> None:
        if count > 0:
            key = (signal, why)
            self._lost[key] = self._lost.get(key, 0) + count

    def _report_lost(self, wall: float) -> None:
        """Queue a radiate.export.dropped record for data lost since the last one, at
        most one an hour for each signal and cause."""
        for signal in self.queues:
            n = self._dropped(signal)
            self._lose(signal, "queue_full", n - self._queue_dropped[signal])
            self._queue_dropped[signal] = n
        if "logs" not in self.cfg.signals:
            self._lost.clear()
            return
        for (signal, why), count in list(self._lost.items()):
            last = self._lost_reported.get((signal, why))
            if count <= 0 or (last is not None and wall - last < DROPPED_EVERY_S):
                continue
            record = telemetry.dropped_record(signal, count, why)
            self.queues["logs"].extend([{"t": wall, **record}])
            self._lost[(signal, why)] = 0
            self._lost_reported[(signal, why)] = wall

    # --- sending ---------------------------------------------------------------------

    def _request(self, signal: str, items: list[dict]) -> dict:
        if signal == "metrics":
            return metrics_request(items, self.house_id, self.rooms, self.cfg.dataset)
        return logs_request(items, self.house_id, self.cfg.dataset, self.rooms)

    def _redact(self, text: str) -> str:
        return text.replace(self._secret, "[redacted]") if self._secret else text

    def _fail(self, message: str) -> None:
        self.failures += 1
        self.last_error = self._redact(message)
        self.last_error_at = self.clock()
        if self.last_error != self._logged_error:  # once per distinct error
            self._logged_error = self.last_error
            LOG.warning(
                "OpenTelemetry export to %s failed: %s; %s queued",
                safe_endpoint(self.cfg.endpoint),
                self.last_error,
                ", ".join(f"{len(q)} {s}" for s, q in self.queues.items()),
            )

    async def _send_one(self, session, signal: str) -> bool | None:
        """Send one batch of `signal`. True: sent or dropped for good; False: failed and
        kept; None: nothing to send."""
        queue = self.queues[signal]
        if not len(queue):
            return None
        items = queue.peek(self.batch[signal])
        request = self._request(signal, items)
        body, ctype = encode(request, self.cfg.protocol)
        hdrs = {**self._headers, "Content-Type": ctype}
        if self.cfg.compression == "gzip":
            body = gzip.compress(body)
            hdrs["Content-Encoding"] = "gzip"
        self.last_attempt = self.clock()
        try:
            async with session.post(
                self.cfg.url(signal),
                data=body,
                headers=hdrs,
                timeout=aiohttp.ClientTimeout(total=self.cfg.timeout_s),
            ) as resp:
                status = resp.status
                reply = await resp.read()
                retry_after = resp.headers.get("Retry-After")
        except (aiohttp.ClientError, TimeoutError, OSError) as err:
            self._fail(f"cannot reach the collector ({type(err).__name__})")
            return False
        if 200 <= status < 300:
            queue.drop(len(items))
            rejected, why = partial_success(reply, self.cfg.protocol)
            self.sent[signal] += count_points(request) - rejected
            if rejected:
                self.rejected += rejected
                self._lose(signal, "partial_success", rejected)
                LOG.warning(
                    "OpenTelemetry export: the collector rejected %d %s: %s",
                    rejected,
                    "data points" if signal == "metrics" else "log records",
                    self._redact(why)[:200],
                )
            self.batch[signal] = METRICS_BATCH if signal == "metrics" else LOGS_BATCH
            self.failures = 0
            self.last_success = self.clock()
            self.last_error = None
            self._logged_error = None
            return True
        detail = self._redact(reply[:200].decode(errors="replace").strip())
        message = f"HTTP {status}" + (f": {detail}" if detail else "")
        if status == 413 and len(items) > 1:
            self.batch[signal] = max(1, len(items) // 2)
            self._fail(f"{message} (sending smaller batches)")
            return False
        if status in (400, 413):
            # The collector will never take this batch: drop it rather than block the rest.
            queue.drop(len(items))
            self.rejected += count_points(request)
            self._lose(signal, str(status), len(items))
            self._fail(f"{message} (batch dropped)")
            return True
        if status in (429, 502, 503, 504) and retry_after:
            with contextlib.suppress(ValueError):
                self._retry_after = min(MAX_BACKOFF_S, max(0.0, float(retry_after)))
        if status in (401, 403):
            message += " (check the API key)"
        elif status == 404:
            message += " (check the endpoint)"
        self._fail(message)
        return False

    async def flush(self, session) -> bool:
        """Send one batch of each signal. False if any failed."""
        ok = True
        for signal in ("metrics", "logs"):
            result = await self._send_one(session, signal)
            if result is False:
                ok = False
                break  # the collector is failing: don't hammer it with the next signal
        return ok

    def _backlog(self) -> bool:
        return any(len(q) >= self.batch[s] for s, q in self.queues.items())

    async def run(self, session) -> None:
        delay = self.cfg.interval_s
        while True:
            ok = await self.flush(session)
            if ok:
                delay = 1.0 if self._backlog() else self.cfg.interval_s
            else:
                delay = min(max(delay, self.cfg.interval_s) * 2, MAX_BACKOFF_S)
                if self._retry_after is not None:
                    delay = max(delay, self._retry_after)
                    self._retry_after = None
            self.next_attempt = self.clock() + delay
            await asyncio.sleep(delay)

    def start(self, session) -> None:
        if self.cfg.enabled:
            self._task = asyncio.get_running_loop().create_task(self.run(session))

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task

    # --- health ----------------------------------------------------------------------

    def health(self) -> dict:
        """For the API and the Raw data view. Never includes a key or a header."""
        if not self.cfg.enabled:
            status = "off"
        elif self.failures:
            status = "failing"
        elif self.last_success is None:
            status = "waiting"
        else:
            status = "ok"
        return {
            "enabled": self.cfg.enabled,
            "status": status,
            "endpoint": safe_endpoint(self.cfg.endpoint),
            "protocol": self.cfg.protocol,
            "signals": list(self.cfg.signals),
            "interval_s": self.cfg.interval_s,
            "last_success": self.last_success,
            "last_attempt": self.last_attempt,
            "last_error": self.last_error,
            "last_error_at": self.last_error_at,
            "next_attempt": self.next_attempt,
            "failures": self.failures,
            "queued": {s: len(q) for s, q in self.queues.items()},
            "dropped": sum(int(getattr(q, "dropped", 0)) for q in self.queues.values()),
            "rejected": self.rejected,
            "sent": dict(self.sent),
        }
