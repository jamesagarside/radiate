"""OpenTelemetry export (radiate.export.otlp): the hand-written OTLP encoding checked
against the official opentelemetry-proto classes, and the exporter against a fake
OTLP/HTTP collector run with aiohttp."""

import json

import pytest
from aiohttp import ClientSession, web
from aiohttp.test_utils import TestServer

from radiate.config.export import parse_export
from radiate.core.series import BY_ID
from radiate.export.otlp import (
    OtlpExporter,
    encode,
    logs_request,
    metrics_request,
    partial_success,
)
from radiate.server.store import MemoryQueue, SqliteQueue, Store

pb_metrics = pytest.importorskip("opentelemetry.proto.collector.metrics.v1.metrics_service_pb2")
pb_logs = pytest.importorskip("opentelemetry.proto.collector.logs.v1.logs_service_pb2")
json_format = pytest.importorskip("google.protobuf.json_format")

HOUSE = "4c0d8a52-8f53-4d1b-9c2b-8d0f3d7c1e2a"
ROOMS = {"lounge": "Lounge", "bedroom_1": "Bedroom 1"}
T0 = 1795000000.0
VALUES = {
    "room.temperature@lounge": 19.25,
    "room.calling@lounge": 1.0,
    "valve.opening@bedroom_1": 35.0,
    "outdoor.temperature": -2.5,
    "boiler.state": 2.0,  # firing
    "people.home": 2.0,
}
LOGGED = [
    ("boiler.lead", "Boiler: opening valves before the burner starts", None),
    ("room.fire", "Lounge: fire lit, radiator closed and learning paused", "lounge"),
]


def cfg(**over):
    raw = {"endpoint": "http://collector.invalid", **over}
    export, problems = parse_export({"otlp": raw})
    assert problems == []
    return export.otlp


def _metrics_json():
    return metrics_request(
        [{"t": T0, "v": VALUES}, {"t": T0 + 60, "v": {"room.temperature@lounge": 19.5}}],
        HOUSE,
        ROOMS,
        dataset="radiate",
    )


def _attrs(items) -> dict:
    return {kv.key: getattr(kv.value, kv.value.WhichOneof("value")) for kv in items}


# --- encoding ----------------------------------------------------------------------------


def test_metrics_json_is_valid_otlp_json():
    req = _metrics_json()
    text = encode(req, "http/json")[0]
    # ParseDict rejects unknown fields and wrong types, so this checks the shape.
    msg = json_format.Parse(text, pb_metrics.ExportMetricsServiceRequest())
    rm = msg.resource_metrics[0]
    res = _attrs(rm.resource.attributes)
    assert res == {
        "service.name": "radiate",
        "service.version": res["service.version"],
        "service.instance.id": HOUSE,
        "radiate.house.id": HOUSE,
        "data_stream.dataset": "radiate",
    }
    scope = rm.scope_metrics[0]
    assert scope.scope.name == "radiate"
    by_name = {m.name: m for m in scope.metrics}
    temp = by_name["radiate.room.temperature"]
    assert temp.unit == "Cel" and temp.WhichOneof("data") == "gauge"
    assert [p.as_double for p in temp.gauge.data_points] == [19.25, 19.5]
    assert temp.gauge.data_points[0].time_unix_nano == int(T0 * 1e9)
    assert temp.gauge.data_points[1].time_unix_nano == int((T0 + 60) * 1e9)
    assert _attrs(temp.gauge.data_points[0].attributes) == {
        "radiate.room.id": "lounge",
        "radiate.room.name": "Lounge",
    }
    assert by_name["radiate.valve.opening"].unit == "%"
    assert by_name["radiate.room.demand.calling"].gauge.data_points[0].as_double == 1.0
    outdoor = by_name["radiate.outdoor.temperature"].gauge.data_points[0]
    assert outdoor.as_double == -2.5 and not outdoor.attributes
    # A level is a state set: one point per state, 1 for the current one.
    status = by_name["radiate.boiler.status"].gauge.data_points
    states = {_attrs(p.attributes)["radiate.boiler.state"]: p.as_double for p in status}
    assert states == {"idle": 0.0, "lead": 0.0, "firing": 1.0, "rest": 0.0}
    assert by_name["radiate.people.home"].unit == "{person}"


def test_metrics_protobuf_matches_the_official_encoding():
    req = _metrics_json()
    body, ctype = encode(req, "http/protobuf")
    assert ctype == "application/x-protobuf"
    ours = pb_metrics.ExportMetricsServiceRequest.FromString(body)
    official = json_format.ParseDict(req, pb_metrics.ExportMetricsServiceRequest())
    assert ours == official
    # Fields in number order, as the official serialiser writes them.
    assert body == official.SerializeToString()


def test_logs_json_and_protobuf():
    req = logs_request([{"t": T0, "c": c, "m": m, "r": r} for c, m, r in LOGGED], HOUSE, dataset="")
    text, ctype = encode(req, "http/json")
    assert ctype == "application/json"
    msg = json_format.Parse(text, pb_logs.ExportLogsServiceRequest())
    rl = msg.resource_logs[0]
    assert "data_stream.dataset" not in _attrs(rl.resource.attributes)
    recs = rl.scope_logs[0].log_records
    assert [r.body.string_value for r in recs] == [m for _, m, _ in LOGGED]
    assert recs[0].severity_number == 9 and recs[0].severity_text == "INFO"
    assert recs[0].time_unix_nano == int(T0 * 1e9) == recs[0].observed_time_unix_nano
    assert _attrs(recs[0].attributes) == {"event.action": "boiler.lead"}
    assert _attrs(recs[1].attributes) == {"event.action": "room.fire", "radiate.room.id": "lounge"}
    body, _ = encode(req, "http/protobuf")
    assert pb_logs.ExportLogsServiceRequest.FromString(body) == msg
    assert body == msg.SerializeToString()


def test_unknown_series_and_bad_records_are_skipped():
    req = metrics_request(
        [{"t": T0, "v": {"nonsense": 1.0, "boiler.relay": True}}, {"t": "x", "v": {}}, {}],
        HOUSE,
        ROOMS,
    )
    assert req["resourceMetrics"][0]["scopeMetrics"][0]["metrics"] == []


def test_partial_success_in_both_encodings():
    resp = pb_metrics.ExportMetricsServiceResponse()
    resp.partial_success.rejected_data_points = 3
    resp.partial_success.error_message = "bad unit"
    assert partial_success(resp.SerializeToString(), "http/protobuf") == (3, "bad unit")
    body = json.dumps({"partialSuccess": {"rejectedDataPoints": "2", "errorMessage": "x"}})
    assert partial_success(body.encode(), "http/json") == (2, "x")
    assert partial_success(b"", "http/protobuf") == (0, "")
    assert partial_success(b"{}", "http/json") == (0, "")


# --- a fake collector ------------------------------------------------------------------


class Collector:
    """An OTLP/HTTP receiver that decodes what it gets with the official classes."""

    def __init__(self):
        self.metrics = []
        self.logs = []
        self.headers = []
        self.fail: list[tuple[int, dict]] = []  # statuses to answer first, in order
        self.partial = 0

    async def handle(self, request: web.Request) -> web.Response:
        self.headers.append(dict(request.headers))
        if self.fail:
            status, headers = self.fail.pop(0)
            return web.Response(status=status, text="nope", headers=headers)
        body = await request.read()  # aiohttp undoes Content-Encoding: gzip itself
        signal = request.path.rsplit("/", 1)[-1]
        cls = (
            pb_metrics.ExportMetricsServiceRequest
            if signal == "metrics"
            else pb_logs.ExportLogsServiceRequest
        )
        if request.content_type == "application/json":
            msg = json_format.Parse(body, cls())
        else:
            assert request.content_type == "application/x-protobuf"
            msg = cls.FromString(body)
        (self.metrics if signal == "metrics" else self.logs).append(msg)
        if signal == "metrics":
            resp = pb_metrics.ExportMetricsServiceResponse()
            if self.partial:
                resp.partial_success.rejected_data_points = self.partial
        else:
            resp = pb_logs.ExportLogsServiceResponse()
        if request.content_type == "application/json":
            return web.json_response(json_format.MessageToDict(resp))
        return web.Response(body=resp.SerializeToString(), content_type="application/x-protobuf")

    def points(self) -> int:
        return sum(
            len(m.gauge.data_points)
            for req in self.metrics
            for rm in req.resource_metrics
            for sm in rm.scope_metrics
            for m in sm.metrics
        )


@pytest.fixture
async def collector():
    c = Collector()
    app = web.Application()
    app.router.add_post("/otlp/v1/metrics", c.handle)
    app.router.add_post("/otlp/v1/logs", c.handle)
    async with TestServer(app) as server, ClientSession() as session:
        c.url = str(server.make_url("/otlp"))
        c.session = session
        yield c


def _exporter(collector, **over):
    return OtlpExporter(
        cfg(endpoint=collector.url, **over), HOUSE, ROOMS, api_key="k3y-SECRET", clock=lambda: T0
    )


@pytest.mark.parametrize(
    ("protocol", "compression"),
    [("http/protobuf", "none"), ("http/json", "none"), ("http/protobuf", "gzip")],
)
async def test_sends_metrics_and_logs(collector, protocol, compression):
    exp = _exporter(collector, protocol=protocol, compression=compression)
    exp.record(T0, VALUES, LOGGED)
    exp.record(T0 + 60, {"outdoor.temperature": -2.0}, [])
    assert await exp.flush(collector.session)
    assert len(collector.metrics) == 1 and len(collector.logs) == 1
    assert collector.points() == 6 + 3 + 1  # the boiler state is 4 points
    recs = collector.logs[0].resource_logs[0].scope_logs[0].log_records
    assert [r.body.string_value for r in recs] == [m for _, m, _ in LOGGED]
    h = collector.headers[0]
    assert h.get("Content-Encoding") == ("gzip" if compression == "gzip" else None)
    assert h["Authorization"] == "ApiKey k3y-SECRET"
    assert h["User-Agent"].startswith("radiate/")
    health = exp.health()
    assert health["status"] == "ok" and health["last_success"] == T0
    assert health["queued"] == {"metrics": 0, "logs": 0}
    assert health["sent"] == {"metrics": 10, "logs": 2}
    assert "k3y" not in json.dumps(health)


async def test_headers_option_replaces_the_api_key(collector):
    exp = OtlpExporter(
        cfg(endpoint=collector.url, headers={"Authorization": "Bearer t0k"}), HOUSE, ROOMS, "k"
    )
    exp.record(T0, VALUES)
    assert await exp.flush(collector.session)
    assert collector.headers[0]["Authorization"] == "Bearer t0k"


async def test_signals_and_disabled(collector):
    exp = _exporter(collector, signals=["metrics"])
    exp.record(T0, VALUES, LOGGED)
    assert len(exp.queues["logs"]) == 0
    off = _exporter(collector, enabled=False)
    off.record(T0, VALUES, LOGGED)
    assert off.health()["status"] == "off"
    assert len(off.queues["metrics"]) == 0


@pytest.mark.parametrize("status", [429, 502, 503, 504, 500, 401, 403, 404])
async def test_retryable_and_auth_errors_keep_the_data(collector, status):
    exp = _exporter(collector)
    collector.fail = [(status, {"Retry-After": "7"})]
    exp.record(T0, VALUES)
    assert not await exp.flush(collector.session)
    health = exp.health()
    assert health["status"] == "failing" and health["failures"] == 1
    assert health["last_error"].startswith(f"HTTP {status}")
    assert health["queued"]["metrics"] == 1
    if status in (401, 403):
        assert "check the API key" in health["last_error"]
    if status == 429:
        assert exp._retry_after == 7.0
    assert await exp.flush(collector.session)  # the collector is back
    assert exp.health()["status"] == "ok" and exp.health()["last_error"] is None
    assert collector.points() == 9


async def test_bad_request_drops_the_batch(collector):
    exp = _exporter(collector)
    collector.fail = [(400, {})]
    exp.record(T0, VALUES)
    assert await exp.flush(collector.session)  # moved on
    health = exp.health()
    assert health["queued"]["metrics"] == 0 and health["rejected"] == 9
    assert "batch dropped" in health["last_error"]


async def test_too_large_halves_the_batch(collector):
    exp = _exporter(collector)
    collector.fail = [(413, {})]
    for i in range(10):
        exp.record(T0 + i * 60, {"outdoor.temperature": 1.0})
    assert not await exp.flush(collector.session)
    assert exp.batch["metrics"] == 5
    assert await exp.flush(collector.session)
    assert collector.points() == 5 and exp.health()["queued"]["metrics"] == 5


async def test_partial_success_counts_rejections(collector):
    exp = _exporter(collector)
    collector.partial = 2
    exp.record(T0, VALUES)
    assert await exp.flush(collector.session)
    assert exp.health()["rejected"] == 2 and exp.health()["sent"]["metrics"] == 7


async def test_unreachable_collector():
    exp = OtlpExporter(cfg(endpoint="http://127.0.0.1:9", timeout_s=2), HOUSE, ROOMS, "k")
    exp.record(T0, VALUES)
    async with ClientSession() as session:
        assert not await exp.flush(session)
    assert exp.health()["last_error"].startswith("cannot reach the collector")
    assert exp.health()["queued"]["metrics"] == 1


async def test_error_text_never_shows_the_key(collector):
    exp = _exporter(collector)

    async def echo(request):
        return web.Response(status=401, text=f"bad key {request.headers['Authorization']}")

    exp.record(T0, VALUES)
    # Point the exporter at a route that echoes the header back.
    app = web.Application()
    app.router.add_post("/v1/metrics", echo)
    async with TestServer(app) as server:
        exp.cfg = cfg(endpoint=str(server.make_url("/")).rstrip("/"))
        assert not await exp.flush(collector.session)
    assert "k3y-SECRET" not in exp.health()["last_error"]
    assert "[redacted]" in exp.health()["last_error"]


def test_full_queue_drops_the_oldest_and_counts_them():
    exp = OtlpExporter(cfg(), HOUSE, ROOMS, metrics_queue=MemoryQueue(3), logs_queue=MemoryQueue(2))
    for i in range(5):
        exp.record(T0 + i, {"outdoor.temperature": float(i)}, LOGGED)
    assert [r["t"] for r in exp.queues["metrics"]] == [T0 + 2, T0 + 3, T0 + 4]
    assert exp.health()["dropped"] == 2 + 8


def test_on_disk_queues_survive_a_restart(tmp_path):
    store = Store(tmp_path / "radiate.db")
    q = SqliteQueue(store, 3, table="otlp_metrics_queue")
    other = SqliteQueue(store, 10)  # the Elastic queue is a table of its own
    for i in range(5):
        q.extend([{"t": T0 + i, "v": {"outdoor.temperature": 1.0}}])
    other.extend([{"a": 1}])
    assert q.dropped == 2
    store.close()
    store = Store(tmp_path / "radiate.db")
    again = SqliteQueue(store, 3, table="otlp_metrics_queue")
    assert len(again) == 3 and [r["t"] for r in again.peek(5)] == [T0 + 2, T0 + 3, T0 + 4]
    assert len(SqliteQueue(store, 10)) == 1
    with pytest.raises(ValueError):
        SqliteQueue(store, 1, table="x; DROP TABLE kv")


def test_every_metric_encodes():
    values = {}
    for m in BY_ID.values():
        values[f"{m.id}@lounge" if m.scope == "room" else m.id] = 1.0
    req = metrics_request([{"t": T0, "v": values}], HOUSE, ROOMS)
    body, _ = encode(req, "http/protobuf")
    msg = pb_metrics.ExportMetricsServiceRequest.FromString(body)
    names = {m.name for m in msg.resource_metrics[0].scope_metrics[0].metrics}
    assert names == {m.otel_name for m in BY_ID.values()}


async def test_backoff_doubles_honours_retry_after_and_drains_a_backlog(collector, monkeypatch):
    import asyncio

    exp = _exporter(collector, interval_s=10)
    delays = []

    async def fake_sleep(s):
        delays.append(s)
        if len(delays) >= 6:
            raise asyncio.CancelledError

    monkeypatch.setattr("radiate.export.otlp.asyncio.sleep", fake_sleep)
    collector.fail = [(503, {}), (503, {}), (429, {"Retry-After": "300"})]
    for i in range(65):  # more than two batches of 30
        exp.record(T0 + i * 60, {"outdoor.temperature": 1.0})
    with pytest.raises(asyncio.CancelledError):
        await exp.run(collector.session)
    # Fail, fail, fail with Retry-After, then a quick send while a full batch waits,
    # then the interval.
    assert delays == [20, 40, 300, 1.0, 10, 10]
    assert exp.health()["queued"]["metrics"] == 0


# --- the runtime and the command line ----------------------------------------------------


async def test_runtime_queues_every_tick_and_a_broken_export_never_stops_it():
    from radiate.server.demo import DemoDriver
    from radiate.server.runtime import Runtime
    from radiate.sim.reference import house_config

    rt = Runtime(house_config(), DemoDriver())
    rt.otlp = OtlpExporter(cfg(), rt.house_id, {r.id: r.name for r in rt.cfg.rooms})
    for _ in range(3):
        await rt.step()
    queued = rt.otlp.queues["metrics"].peek(10)
    assert len(queued) == 3
    assert {"room.temperature@lounge", "room.target@lounge", "boiler.state"} <= set(queued[0]["v"])
    assert rt.recorder is None  # the export works without a tick history

    class Broken:
        def record(self, *args):
            raise RuntimeError("disk full")

    rt.otlp = Broken()
    await rt.step()  # logged, not raised


def test_endpoint_from_the_environment(monkeypatch):
    from radiate.cli import _otlp_config

    monkeypatch.delenv("RADIATE_OTLP_ENDPOINT", raising=False)
    assert _otlp_config(None) is None
    monkeypatch.setenv("RADIATE_OTLP_ENDPOINT", "https://otlp.example:443")
    monkeypatch.setenv("RADIATE_OTLP_PROTOCOL", "http/json")
    got = _otlp_config(None)
    assert got.endpoint == "https://otlp.example:443" and got.protocol == "http/json"
    monkeypatch.setenv("RADIATE_OTLP_PROTOCOL", "grpc")
    with pytest.raises(SystemExit, match="gRPC"):
        _otlp_config(None)
