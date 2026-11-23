"""Elastic metrics export (spec 9).

Builds ECS-shaped documents for four data streams and ships them with the Bulk API.
Room and boiler streams are time series data streams (TSDS) keyed on the house and
room ids. No personal data: the house id is a random UUID, never a name or location.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
from datetime import UTC, date, datetime
from typing import Any

from radiate import __version__
from radiate.core.accounting import BURN_BUCKETS
from radiate.server.store import ExportQueue, MemoryQueue

LOG = logging.getLogger(__name__)

ROOM_STREAM = "metrics-radiate.room-default"
BOILER_STREAM = "metrics-radiate.boiler-default"
DECISION_STREAM = "logs-radiate.decision-default"
DAILY_STREAM = "metrics-radiate.daily-default"
MAX_BUFFER = 7 * 24 * 60 * 12  # about 7 days of minute samples for a 10-room house


def _base(stream: str, house_id: str, ts: datetime) -> dict[str, Any]:
    kind, dataset, namespace = stream.split("-", 2)
    return {
        "@timestamp": ts.isoformat(),
        "data_stream": {"type": kind, "dataset": dataset, "namespace": namespace},
        "service": {"name": "radiate", "version": __version__},
        "radiate": {"house": {"id": house_id}},
    }


def room_docs(state: dict, house_id: str, ts: datetime) -> list[dict]:
    """One document per room from `Runtime.describe()`."""
    docs = []
    for r in state["rooms"]:
        doc = _base(ROOM_STREAM, house_id, ts)
        doc["radiate"]["room"] = {
            "id": r["id"],
            "name": r["name"],
            "role": r["role"],
            "heat_source": r.get("heat_source"),
        }
        doc["temperature"] = {
            "room": r.get("temperature"),
            "setpoint": r.get("setpoint"),
            "target": r.get("target"),
        }
        if r.get("humidity") is not None:
            doc["humidity"] = {"room": r["humidity"]}
        if "model" in r:
            m = r["model"]
            temp, target = r.get("temperature"), r.get("target")
            doc["valve"] = {"opening_pct": r.get("opening"), "lockshield_pct": m["lockshield"]}
            doc["demand"] = {
                "calling": r.get("calling", False),
                "preheating": r.get("preheating", False),
                "topup": r.get("topup", False),
                "gap_k": round(target - temp, 2)
                if temp is not None and target is not None
                else None,
            }
            doc["model"] = {
                "a": m["a"],
                "b": m["b"],
                "d": m["d"],
                "confidence": m["confidence"],
                "arrival_lag_min": m["arrival_lag_min"],
                "samples": m["samples"],
            }
            gate = r.get("learning")
            doc["learning"] = {"active": gate is None, "gate": gate}
            doc["disturbance"] = {"fire": r.get("fire", False)}
        docs.append(doc)
    return docs


def boiler_doc(state: dict, house_id: str, ts: datetime) -> dict:
    b = state["boiler"]
    doc = _base(BOILER_STREAM, house_id, ts)
    doc["boiler"] = {
        "state": b["state"],
        "relay": b["relay"],
        "burn": {"elapsed_s": b["burn_elapsed_s"]},
        "starts_1h": b["starts_last_hour"],
        "predicted_burn_min": b["predicted_burn_min"],
    }
    doc["store"] = {"relay": state["store"]["relay"], "boost": state["store"]["boost"]}
    # The burner firing, from the relay's power metering (None: not metered).
    doc["boiler"]["burner"] = b.get("burner")
    doc["store"]["burner"] = state["store"].get("burner")
    doc["supply"] = {"factor": b["supply"]}
    doc["outdoor"] = {"temperature": state.get("outdoor")}
    doc["radiate"]["mode"] = state["mode"]
    return doc


def _calendar_day(label: object) -> str | None:
    """ISO date for a day label that is a real `date.toordinal()`, else None (simulator)."""
    if not isinstance(label, int) or label < 1:
        return None
    day = date.fromordinal(label)
    return day.isoformat() if day.year >= 2000 else None


def daily_doc(summary: dict, house_id: str, ts: datetime, estimate: dict | None = None) -> dict:
    """One document per closed day from `core.accounting` (spec 9).

    With a `savings` record in the summary (spec 5.9), the document also carries the
    day's degree-hours, shares and comfort; `estimate` (`server.savings.day_estimate`)
    adds the room-weighted figures and, once the gate is open, the litres saved and the
    fit's CV(RMSE) as estimated when the day closed. The fit moves later, so the API's
    figure for an old day can differ.
    """
    doc = _base(DAILY_STREAM, house_id, ts)
    day = _calendar_day(summary.get("day"))
    if day is not None:
        doc["radiate"]["day"] = day
    # Radiate did not see the whole day (it started after midnight, or was down for a
    # while): totals cover what it saw and the balance score is null.
    doc["radiate"]["partial_day"] = bool(summary.get("partial", False))
    doc["boiler"] = {
        "starts": summary["starts"],
        "max_starts_1h": summary["max_starts_in_hour"],
        "burner_hours": summary["burner_hours"],
        "hours_basis": summary.get("basis", "relay"),
        "litres": summary["litres"],
        "kwh": summary["kwh"],
        "burns": summary["burns"],
    }
    # Added with burner metering (spec 5.6); older summaries have neither.
    if "relay_hours" in summary:
        doc["boiler"]["relay_hours"] = summary["relay_hours"]
        doc["boiler"]["litres_relay"] = summary.get("litres_relay")
    if isinstance(summary.get("burner"), dict):
        doc["boiler"]["burner"] = dict(summary["burner"])
    doc["balance"] = dict(summary["balance"])
    doc["rooms"] = {
        "comfort_minutes_below": round(sum(summary["comfort_minutes_below"].values()), 1)
    }
    savings, comfort = _savings_fields(summary.get("savings"), estimate)
    if savings:
        doc["savings"] = savings
    if comfort:
        doc["comfort"] = comfort
    return doc


def _savings_fields(record: object, estimate: dict | None) -> tuple[dict, dict]:
    """`savings.*` and `comfort.*` for the daily document; empty without a record."""
    if not isinstance(record, dict) or not isinstance(record.get("rooms"), dict):
        return {}, {}
    rooms = [r for r in record["rooms"].values() if isinstance(r, dict)]

    def total(key: str) -> float:
        return round(sum(float(r.get(key) or 0.0) for r in rooms), 2)

    savings: dict = {
        "outdoor_share": record.get("outdoor_share"),
        "baseline_share": record.get("baseline_share"),
    }
    warm = total("warm_min")
    comfort: dict = {
        "deficit_kh": total("deficit_kh"),
        "warm_share": round(total("warm_ok_min") / warm, 3) if warm > 0 else None,
    }
    if estimate is None:
        return savings, comfort  # degree-hours only as the API weights them
    savings.update(
        dh_actual_kh=estimate.get("dh_actual_kh"),
        dh_baseline_kh=estimate.get("dh_baseline_kh"),
        eligible=bool(estimate.get("eligible")),
    )
    if estimate.get("litres_saved") is not None:
        savings["litres"] = estimate["litres_saved"]
        savings["fit_cv_rmse"] = estimate.get("fit_cv_rmse")
    return savings, comfort


def decision_doc(code: str, message: str, room_id: str | None, house_id: str, ts: datetime) -> dict:
    doc = _base(DECISION_STREAM, house_id, ts)
    doc["event"] = {"action": code, "kind": "event", "category": ["configuration"]}
    doc["message"] = message
    if room_id:
        doc["radiate"]["room"] = {"id": room_id}
    return doc


def bulk_body(docs: list[dict]) -> str:
    lines = []
    for d in docs:
        stream = "-".join(
            (d["data_stream"]["type"], d["data_stream"]["dataset"], d["data_stream"]["namespace"])
        )
        lines.append(json.dumps({"create": {"_index": stream}}))
        lines.append(json.dumps(d, separators=(",", ":")))
    return "\n".join(lines) + "\n"


def index_templates() -> dict[str, dict]:
    """Composable index templates. Install once with PUT _index_template/<name>."""
    dims = {
        "radiate.house.id": {"type": "keyword", "time_series_dimension": True},
    }
    common = {
        "@timestamp": {"type": "date"},
        "data_stream": {
            "properties": {
                "type": {"type": "constant_keyword"},
                "dataset": {"type": "constant_keyword"},
                "namespace": {"type": "constant_keyword"},
            }
        },
        "service": {"properties": {"name": {"type": "keyword"}, "version": {"type": "keyword"}}},
    }

    def gauge(t: str = "float") -> dict:
        return {"type": t, "time_series_metric": "gauge"}

    def props(flat: dict[str, dict]) -> dict:
        out: dict = {}
        for path, mapping in flat.items():
            node = out
            parts = path.split(".")
            for p in parts[:-1]:
                node = node.setdefault(p, {"properties": {}})["properties"]
            node[parts[-1]] = mapping
        return out

    room_fields = {
        **dims,
        "radiate.room.id": {"type": "keyword", "time_series_dimension": True},
        "radiate.room.name": {"type": "keyword"},
        "radiate.room.role": {"type": "keyword"},
        "radiate.room.heat_source": {"type": "keyword"},
        "temperature.room": gauge(),
        "temperature.setpoint": gauge(),
        "temperature.target": gauge(),
        "humidity.room": gauge(),
        "valve.opening_pct": gauge("short"),
        "valve.lockshield_pct": gauge("short"),
        "demand.calling": {"type": "boolean"},
        "demand.preheating": {"type": "boolean"},
        "demand.topup": {"type": "boolean"},
        "demand.gap_k": gauge(),
        "model.a": gauge(),
        "model.b": gauge(),
        "model.d": gauge(),
        "model.confidence": gauge(),
        "model.arrival_lag_min": gauge(),
        "model.samples": {"type": "long", "time_series_metric": "counter"},
        "learning.active": {"type": "boolean"},
        "learning.gate": {"type": "keyword"},
        "disturbance.fire": {"type": "boolean"},
    }
    boiler_fields = {
        **dims,
        "radiate.mode": {"type": "keyword"},
        "boiler.state": {"type": "keyword"},
        "boiler.relay": {"type": "boolean"},
        "boiler.burner": {"type": "boolean"},
        "store.burner": {"type": "boolean"},
        "boiler.burn.elapsed_s": gauge(),
        "boiler.starts_1h": gauge("short"),
        "boiler.predicted_burn_min": gauge(),
        "store.relay": {"type": "boolean"},
        "store.boost": {"type": "boolean"},
        "supply.factor": gauge(),
        "outdoor.temperature": gauge(),
    }

    def tsds(pattern: str, fields: dict, routing: list[str]) -> dict:
        return {
            "index_patterns": [pattern],
            "data_stream": {},
            "priority": 200,
            "template": {
                "settings": {"index.mode": "time_series", "index.routing_path": routing},
                "mappings": {"properties": {**common, **props(fields)}},
            },
        }

    return {
        "radiate-room": tsds(
            "metrics-radiate.room-*", room_fields, ["radiate.house.id", "radiate.room.id"]
        ),
        "radiate-boiler": tsds("metrics-radiate.boiler-*", boiler_fields, ["radiate.house.id"]),
        "radiate-daily": {
            "index_patterns": ["metrics-radiate.daily-*"],
            "data_stream": {},
            "priority": 200,
            "template": {
                "mappings": {
                    "properties": {
                        **common,
                        **props(
                            {
                                "radiate.house.id": {"type": "keyword"},
                                "radiate.day": {"type": "date", "format": "yyyy-MM-dd"},
                                "radiate.partial_day": {"type": "boolean"},
                                "boiler.starts": {"type": "short"},
                                "boiler.max_starts_1h": {"type": "short"},
                                "boiler.burner_hours": {"type": "float"},
                                "boiler.hours_basis": {"type": "keyword"},
                                "boiler.litres": {"type": "float"},
                                "boiler.kwh": {"type": "float"},
                                "boiler.relay_hours": {"type": "float"},
                                "boiler.litres_relay": {"type": "float"},
                                "boiler.burner.metered": {"type": "boolean"},
                                "boiler.burner.heating_hours": {"type": "float"},
                                "boiler.burner.heating_starts": {"type": "short"},
                                "boiler.burner.store_hours": {"type": "float"},
                                "boiler.burner.store_starts": {"type": "short"},
                                "boiler.burner.store_litres": {"type": "float"},
                                "boiler.burns.count": {"type": "short"},
                                "boiler.burns.mean_min": {"type": "float"},
                                "boiler.burns.min_min": {"type": "float"},
                                "boiler.burns.max_min": {"type": "float"},
                                **{
                                    f"boiler.burns.histogram.{b}": {"type": "short"}
                                    for b in BURN_BUCKETS
                                },
                                "balance.starts_measured": {"type": "short"},
                                "balance.arrival_spread_min": {"type": "float"},
                                "balance.score": {"type": "float"},
                                "rooms.comfort_minutes_below": {"type": "float"},
                                "savings.dh_actual_kh": {"type": "float"},
                                "savings.dh_baseline_kh": {"type": "float"},
                                "savings.outdoor_share": {"type": "float"},
                                "savings.baseline_share": {"type": "float"},
                                "savings.eligible": {"type": "boolean"},
                                "savings.litres": {"type": "float"},
                                "savings.fit_cv_rmse": {"type": "float"},
                                "comfort.deficit_kh": {"type": "float"},
                                "comfort.warm_share": {"type": "float"},
                            }
                        ),
                    }
                }
            },
        },
        "radiate-decision": {
            "index_patterns": ["logs-radiate.decision-*"],
            "data_stream": {},
            "priority": 200,
            "template": {
                "mappings": {
                    "properties": {
                        **common,
                        **props(
                            {
                                "radiate.house.id": {"type": "keyword"},
                                "radiate.room.id": {"type": "keyword"},
                                "event.action": {"type": "keyword"},
                                "event.kind": {"type": "keyword"},
                                "event.category": {"type": "keyword"},
                                "message": {"type": "match_only_text"},
                            }
                        ),
                    }
                }
            },
        },
    }


class ElasticExporter:
    """Buffers documents and ships them in batches. Never blocks the control loop."""

    def __init__(
        self,
        url: str,
        api_key: str,
        house_id: str,
        batch: int = 500,
        interval_s: float = 10.0,
        queue: ExportQueue | None = None,
    ):
        self.url = url.rstrip("/")
        self.api_key = api_key
        self.house_id = house_id
        self.batch = batch
        self.interval_s = interval_s
        # In memory by default; the server passes an on-disk SqliteQueue (spec 9).
        self.buffer: ExportQueue = queue if queue is not None else MemoryQueue(MAX_BUFFER)
        self.sent = 0
        self.failures = 0
        self._task: asyncio.Task | None = None

    def record(
        self,
        state: dict,
        decisions: list[tuple[str, str, str | None]] = (),
        ts: datetime | None = None,
    ) -> None:
        ts = ts or datetime.now(UTC)
        docs = room_docs(state, self.house_id, ts)
        docs.append(boiler_doc(state, self.house_id, ts))
        for code, message, room in decisions:
            docs.append(decision_doc(code, message, room, self.house_id, ts))
        self.buffer.extend(docs)

    def record_daily(
        self, summary: dict, ts: datetime | None = None, estimate: dict | None = None
    ) -> None:
        """Queue the summary of a day that just closed (`metrics-radiate.daily-default`),
        with its savings estimate when there is one."""
        self.buffer.extend(
            [daily_doc(summary, self.house_id, ts or datetime.now(UTC), estimate=estimate)]
        )

    async def flush(self, session) -> bool:
        if not self.buffer:
            return True
        docs = self.buffer.peek(self.batch)
        try:
            async with session.post(
                f"{self.url}/_bulk",
                data=bulk_body(docs),
                headers={
                    "Authorization": f"ApiKey {self.api_key}",
                    "Content-Type": "application/x-ndjson",
                },
                timeout=30,
            ) as resp:
                body = await resp.json(content_type=None)
                if resp.status >= 300:
                    raise RuntimeError(f"bulk returned {resp.status}")
        except Exception as err:  # network, auth, cluster: keep the buffer, retry later
            self.failures += 1
            LOG.warning("Elastic export failed (%s); %d documents buffered", err, len(self.buffer))
            return False
        # Drop what was accepted. Mapping rejections are logged and dropped, not retried forever.
        if body.get("errors"):
            bad = [
                i for i in body.get("items", []) if i.get("create", {}).get("status", 200) >= 300
            ]
            LOG.warning("Elastic rejected %d of %d documents", len(bad), len(docs))
        self.buffer.drop(len(docs))
        self.sent += len(docs)
        return True

    async def run(self, session) -> None:
        backoff = self.interval_s
        while True:
            ok = await self.flush(session)
            backoff = self.interval_s if ok else min(backoff * 2, 600)
            await asyncio.sleep(backoff)

    def start(self, session) -> None:
        self._task = asyncio.get_running_loop().create_task(self.run(session))

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
