"""OpenTelemetry export over OTLP/HTTP (spec 9.1).

Sends every raw data series (`radiate.core.series`) once a minute as OTLP gauge
metrics, and each decision and alert as an OTLP log record, to any OTLP/HTTP
collector: an OpenTelemetry Collector, Elastic's managed OTLP endpoint, or anything
else that speaks the protocol. Configured in the house file under `export.otlp`
(`radiate.config.export`).

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
from radiate.server.store import ExportQueue, MemoryQueue

LOG = logging.getLogger(__name__)

API_KEY_ENV = "RADIATE_OTLP_API_KEY"
METRICS_MAX = 7 * 24 * 60  # 7 days of ticks
LOGS_MAX = 20_000
METRICS_BATCH = 30  # ticks a request: about 2,000 data points, well under 1 MB
LOGS_BATCH = 500
MAX_BACKOFF_S = 600.0
SEVERITY_INFO = 9  # SeverityNumber.SEVERITY_NUMBER_INFO
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
    },
    "Gauge": {"dataPoints": (1, "NumberDataPoint")},
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
    },
    "KeyValue": {"key": (1, "string"), "value": (2, "AnyValue")},
    "AnyValue": {
        "stringValue": (1, "string"),
        "boolValue": (2, "bool"),
        "intValue": (3, "varint"),
        "doubleValue": (4, "double"),
    },
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
    return {"key": key, "value": {"stringValue": str(value)}}


def _nanos(t: float) -> str:
    return str(int(round(t * 1e9)))


def resource(house_id: str, dataset: str = "") -> dict:
    attrs = [
        _attr("service.name", "radiate"),
        _attr("service.version", __version__),
        _attr("service.instance.id", house_id),
        _attr("radiate.house.id", house_id),
    ]
    if dataset:
        attrs.append(_attr("data_stream.dataset", dataset))
    return {"attributes": attrs}


def _scope() -> dict:
    return {"name": SCOPE, "version": __version__}


def metrics_request(
    records: list[dict], house_id: str, rooms: Mapping[str, str], dataset: str = ""
) -> dict:
    """ExportMetricsServiceRequest (OTLP/JSON) for queued ticks: {"t": Unix, "v": values}.

    One gauge per metric. A room series carries `radiate.room.id` and
    `radiate.room.name`; a level, such as the boiler state, one point per level, 1 for
    the current one, with the level in an attribute (OpenTelemetry's state-set pattern).
    """
    metrics: dict[str, dict] = {}
    for rec in records:
        t = rec.get("t")
        values = rec.get("v")
        if not isinstance(t, (int, float)) or not isinstance(values, dict):
            continue
        ts = _nanos(t)
        for key, value in values.items():
            metric_id, room = split_key(key)
            m = BY_ID.get(metric_id)
            if m is None or not isinstance(value, (int, float)) or isinstance(value, bool):
                continue
            entry = metrics.get(m.otel_name)
            if entry is None:
                entry = metrics[m.otel_name] = {
                    "name": m.otel_name,
                    "description": m.description,
                    "unit": m.otel_unit,
                    "gauge": {"dataPoints": []},
                }
            points = entry["gauge"]["dataPoints"]
            attrs = []
            if room is not None:
                attrs.append(_attr("radiate.room.id", room))
                if room in rooms:
                    attrs.append(_attr("radiate.room.name", rooms[room]))
            if m.kind == LEVEL:
                current = int(value)
                for i, level in enumerate(m.levels):
                    points.append(
                        {
                            "timeUnixNano": ts,
                            "asDouble": 1.0 if i == current else 0.0,
                            "attributes": [*attrs, _attr(f"radiate.{m.id}", level)],
                        }
                    )
                continue
            point: dict[str, Any] = {"timeUnixNano": ts, "asDouble": float(value)}
            if attrs:
                point["attributes"] = attrs
            points.append(point)
    return {
        "resourceMetrics": [
            {
                "resource": resource(house_id, dataset),
                "scopeMetrics": [{"scope": _scope(), "metrics": list(metrics.values())}],
            }
        ]
    }


def logs_request(records: list[dict], house_id: str, dataset: str = "") -> dict:
    """ExportLogsServiceRequest (OTLP/JSON) for decisions and alerts: {"t", "c", "m", "r"}.

    The body is the message as the web UI shows it; `event.action` holds the reason
    code, as in the Elastic export's decision stream.
    """
    out = []
    for rec in records:
        t, code, message = rec.get("t"), rec.get("c"), rec.get("m")
        if not isinstance(t, (int, float)) or not isinstance(code, str):
            continue
        attrs = [_attr("event.action", code)]
        if rec.get("r"):
            attrs.append(_attr("radiate.room.id", str(rec["r"])))
        ts = _nanos(t)
        out.append(
            {
                "timeUnixNano": ts,
                "observedTimeUnixNano": ts,
                "severityNumber": SEVERITY_INFO,
                "severityText": "INFO",
                "body": {"stringValue": str(message or "")},
                "attributes": attrs,
            }
        )
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
                n += len(m["gauge"]["dataPoints"])
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

    # --- recording, from the control loop --------------------------------------------

    def record(self, wall: float, values: Mapping[str, float], logged: list[tuple] = ()) -> None:
        if not self.cfg.enabled:
            return
        if "metrics" in self.cfg.signals and values:
            self.queues["metrics"].extend([{"t": wall, "v": dict(values)}])
        if "logs" in self.cfg.signals and logged:
            self.queues["logs"].extend(
                [{"t": wall, "c": code, "m": msg, "r": room} for code, msg, room in logged]
            )

    # --- sending ---------------------------------------------------------------------

    def _request(self, signal: str, items: list[dict]) -> dict:
        if signal == "metrics":
            return metrics_request(items, self.house_id, self.rooms, self.cfg.dataset)
        return logs_request(items, self.house_id, self.cfg.dataset)

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
