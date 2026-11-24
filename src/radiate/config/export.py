"""The `export` section of the house file: the OpenTelemetry (OTLP) export (spec 9.1).

Pure parsing, like the rest of `radiate.config`: `parse_export` returns the settings
and every problem with its path, and never reads a file or the environment. The
server resolves the API key at start-up with `radiate.export.otlp.resolve_api_key`
(from `api_key`, then `api_key_file`, then `RADIATE_OTLP_API_KEY`).

```yaml
export:
  otlp:
    endpoint: https://example.ingest.eu-west-1.aws.elastic.cloud:443
    api_key: ${RADIATE_OTLP_API_KEY}   # sent as "Authorization: ApiKey <key>"
    protocol: http/protobuf             # or http/json
    interval_s: 60
```

`OTLP_SETTINGS` describes every key (type, default, limits, help) for a settings form.
"""

from __future__ import annotations

import contextlib
import re
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlsplit

PROTOCOLS = ("http/protobuf", "http/json")
COMPRESSIONS = ("none", "gzip")
SIGNALS = ("metrics", "logs")
INTERVAL_S = (10.0, 3600.0)
TIMEOUT_S = (1.0, 120.0)
_HEADER = re.compile(r"^[A-Za-z0-9!#$%&'*+.^_`|~-]{1,100}$")
_DATASET = re.compile(r"^[a-z0-9_.]{1,100}$")


@dataclass(frozen=True, slots=True)
class OtlpConfig:
    """Where and how to send OpenTelemetry metrics and logs over OTLP/HTTP."""

    endpoint: str  # the base URL; /v1/metrics and /v1/logs are added to it
    enabled: bool = True
    protocol: str = "http/protobuf"
    api_key: str | None = None  # sent as `Authorization: ApiKey <key>`
    api_key_file: str | None = None
    # Extra request headers, such as {"Authorization": "Bearer ..."} for a collector
    # that takes another scheme. An Authorization header here wins over `api_key`.
    headers: dict[str, str] = field(default_factory=dict)
    interval_s: float = 60.0
    timeout_s: float = 30.0
    compression: str = "none"
    signals: tuple[str, ...] = SIGNALS
    # Elastic routes OTLP data by `data_stream.dataset`, so with "radiate" metrics land
    # in metrics-radiate.otel-default. Empty: the attribute is not sent.
    dataset: str = "radiate"

    def url(self, signal: str) -> str:
        return f"{self.endpoint.rstrip('/')}/v1/{signal}"


@dataclass(frozen=True, slots=True)
class ExportConfig:
    otlp: OtlpConfig | None = None


# For a schema-driven settings form: key, type, default, limits or choices, help.
OTLP_SETTINGS: tuple[dict[str, Any], ...] = (
    {"key": "enabled", "type": "bool", "default": True, "help": "Send data to the collector."},
    {
        "key": "endpoint",
        "type": "url",
        "default": None,
        "required": True,
        "help": "The collector's OTLP/HTTP base URL. Radiate adds /v1/metrics and /v1/logs.",
    },
    {
        "key": "protocol",
        "type": "choice",
        "default": "http/protobuf",
        "choices": list(PROTOCOLS),
        "help": "Protobuf works with every OTLP/HTTP collector; JSON is easier to read when "
        "testing.",
    },
    {
        "key": "api_key",
        "type": "secret",
        "default": None,
        "help": "Sent as 'Authorization: ApiKey <key>', as Elastic expects. Never shown again.",
    },
    {
        "key": "api_key_file",
        "type": "path",
        "default": None,
        "help": "A file holding the API key, instead of api_key.",
    },
    {
        "key": "headers",
        "type": "map",
        "default": {},
        "help": "Extra request headers, such as Authorization for another scheme.",
    },
    {
        "key": "interval_s",
        "type": "number",
        "default": 60,
        "min": INTERVAL_S[0],
        "max": INTERVAL_S[1],
        "unit": "s",
        "help": "How often to send what has been recorded.",
    },
    {
        "key": "timeout_s",
        "type": "number",
        "default": 30,
        "min": TIMEOUT_S[0],
        "max": TIMEOUT_S[1],
        "unit": "s",
        "help": "How long to wait for the collector to answer.",
    },
    {
        "key": "compression",
        "type": "choice",
        "default": "none",
        "choices": list(COMPRESSIONS),
        "help": "Compress requests with gzip.",
    },
    {
        "key": "signals",
        "type": "multi",
        "default": list(SIGNALS),
        "choices": list(SIGNALS),
        "help": "Metrics every minute; logs for each decision and alert.",
    },
    {
        "key": "dataset",
        "type": "text",
        "default": "radiate",
        "help": "Sent as data_stream.dataset, which Elastic uses to pick the data stream. "
        "Empty to leave it out.",
    },
)

_KEYS = {item["key"] for item in OTLP_SETTINGS}


def _endpoint(raw: Any, problems: list[str], path: str) -> str:
    if not isinstance(raw, str) or not raw.strip():
        problems.append(f"{path}: required, the collector's OTLP/HTTP URL")
        return ""
    url = raw.strip()
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        problems.append(f"{path}: must be an http:// or https:// URL")
    elif parts.username or parts.password:
        problems.append(f"{path}: put credentials in api_key or headers, not the URL")
    elif parts.query or parts.fragment:
        problems.append(f"{path}: must not have a query or fragment")
    elif parts.path.rstrip("/").endswith(("/v1/metrics", "/v1/logs", "/v1/traces")):
        problems.append(f"{path}: give the base URL; Radiate adds /v1/metrics and /v1/logs")
    return url


def _number(
    raw: dict, key: str, default: float, lo: float, hi: float, problems: list[str], p: str
) -> float:
    val = raw.get(key, default)
    if val is None:
        return default
    if isinstance(val, str):  # substituted from the environment
        with contextlib.suppress(ValueError):
            val = float(val)
    if isinstance(val, bool) or not isinstance(val, (int, float)):
        problems.append(f"{p}{key}: expected a number")
        return default
    if not lo <= val <= hi:
        problems.append(f"{p}{key}: must be {lo:g} to {hi:g}")
        return default
    return float(val)


def _bool(raw: dict, key: str, default: bool, problems: list[str], p: str) -> bool:
    val = raw.get(key, default)
    if isinstance(val, str) and val.lower() in ("true", "false"):
        return val.lower() == "true"
    if not isinstance(val, bool):
        problems.append(f"{p}{key}: expected true or false")
        return default
    return val


def _choice(raw: dict, key: str, default: str, choices, problems: list[str], p: str) -> str:
    val = raw.get(key, default)
    if val not in choices:
        hint = ""
        if key == "protocol" and val == "grpc":
            hint = " (gRPC is not supported; use OTLP/HTTP)"
        problems.append(f"{p}{key}: must be one of {', '.join(choices)}{hint}")
        return default
    return val


def _otlp(raw: Any, problems: list[str]) -> OtlpConfig | None:
    p = "export.otlp."
    if raw is None:
        return None
    if not isinstance(raw, dict):
        problems.append("export.otlp: expected a mapping")
        return None
    for key in raw:
        if key not in _KEYS:
            problems.append(f"{p}{key}: unknown key")
    enabled = _bool(raw, "enabled", True, problems, p)
    endpoint = _endpoint(raw.get("endpoint"), problems, f"{p}endpoint")
    protocol = _choice(raw, "protocol", "http/protobuf", PROTOCOLS, problems, p)
    compression = _choice(raw, "compression", "none", COMPRESSIONS, problems, p)
    api_key = raw.get("api_key")
    if api_key is not None and not isinstance(api_key, str):
        problems.append(f"{p}api_key: expected text")
        api_key = None
    if isinstance(api_key, str) and api_key.startswith("ApiKey "):
        api_key = api_key[len("ApiKey ") :].strip()  # pasted as the whole header value
    if isinstance(api_key, str) and not _printable(api_key):
        problems.append(f"{p}api_key: must be printable ASCII with no spaces")
    key_file = raw.get("api_key_file")
    if key_file is not None and (not isinstance(key_file, str) or not key_file.strip()):
        problems.append(f"{p}api_key_file: expected a path")
        key_file = None
    if api_key and key_file:
        problems.append(f"{p}api_key_file: give api_key or api_key_file, not both")
    headers: dict[str, str] = {}
    raw_headers = raw.get("headers") or {}
    if not isinstance(raw_headers, dict):
        problems.append(f"{p}headers: expected a mapping of header names to values")
    else:
        for name, value in raw_headers.items():
            if not isinstance(name, str) or not _HEADER.match(name):
                problems.append(f"{p}headers.{name}: not a valid header name")
            elif not isinstance(value, str) or any(c in value for c in "\r\n"):
                problems.append(f"{p}headers.{name}: expected text on one line")
            elif name.lower() in ("content-type", "content-encoding", "content-length"):
                problems.append(f"{p}headers.{name}: set by Radiate")
            else:
                headers[name] = value
    signals = raw.get("signals", list(SIGNALS))
    if not isinstance(signals, list) or not signals or any(s not in SIGNALS for s in signals):
        problems.append(f"{p}signals: a list of {' and '.join(SIGNALS)}")
        signals = list(SIGNALS)
    dataset = raw.get("dataset", "radiate")
    dataset = "" if dataset is None else dataset
    if not isinstance(dataset, str) or (dataset and not _DATASET.match(dataset)):
        problems.append(f"{p}dataset: lower case letters, digits, '_' and '.' only")
        dataset = "radiate"
    return OtlpConfig(
        endpoint=endpoint,
        enabled=enabled,
        protocol=protocol,
        api_key=api_key or None,
        api_key_file=key_file.strip() if isinstance(key_file, str) else None,
        headers=headers,
        interval_s=_number(raw, "interval_s", 60.0, *INTERVAL_S, problems, p),
        timeout_s=_number(raw, "timeout_s", 30.0, *TIMEOUT_S, problems, p),
        compression=compression,
        signals=tuple(s for s in SIGNALS if s in signals),
        dataset=dataset,
    )


def _printable(value: str) -> bool:
    return all(0x21 <= ord(c) <= 0x7E for c in value)


def parse_export(raw: Any) -> tuple[ExportConfig, list[str]]:
    """The `export` section and its problems, each as `export.otlp.endpoint: ...`."""
    problems: list[str] = []
    if raw is None:
        return ExportConfig(), problems
    if not isinstance(raw, dict):
        return ExportConfig(), ["export: expected a mapping"]
    for key in raw:
        if key != "otlp":
            problems.append(f"export.{key}: unknown key")
    return ExportConfig(otlp=_otlp(raw.get("otlp"), problems)), problems
