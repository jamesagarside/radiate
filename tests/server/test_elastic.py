import json
from datetime import UTC, datetime

from radiate.export.elastic import (
    BOILER_STREAM,
    ROOM_STREAM,
    ElasticExporter,
    bulk_body,
    index_templates,
)
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.sim.reference import house_config

TS = datetime(2026, 11, 16, 7, 0, tzinfo=UTC)


async def _state() -> dict:
    rt = Runtime(house_config(), DemoDriver())
    for _ in range(3):
        await rt.step()
    return rt.describe()


async def test_documents_are_ecs_shaped_and_anonymous():
    exp = ElasticExporter("http://es:9200", "key", house_id="4f1c-uuid")
    exp.record(await _state(), [("boiler.lead", "Opening valves", None)], ts=TS)
    docs = list(exp.buffer)
    rooms = [d for d in docs if d["data_stream"]["dataset"] == "radiate.room"]
    assert len(rooms) == 9
    boiler = next(d for d in docs if d["data_stream"]["dataset"] == "radiate.boiler")
    assert boiler["boiler"]["state"] in {"idle", "lead", "firing", "rest"}
    for d in docs:
        assert d["@timestamp"] == TS.isoformat()
        assert d["radiate"]["house"]["id"] == "4f1c-uuid"
        assert "host" not in d and "geo" not in d
    stairs = next(d for d in rooms if d["radiate"]["room"]["id"] == "stairs")
    assert "valve" not in stairs  # passive bypass radiator is observed, not actuated


async def test_bulk_body_targets_data_streams():
    exp = ElasticExporter("http://es:9200", "key", house_id="h")
    exp.record(await _state(), ts=TS)
    lines = bulk_body(list(exp.buffer)).strip().split("\n")
    assert len(lines) == 2 * len(exp.buffer)
    targets = {json.loads(line)["create"]["_index"] for line in lines[::2]}
    assert targets == {ROOM_STREAM, BOILER_STREAM}


def test_templates_are_tsds_with_dimensions():
    t = index_templates()
    room = t["radiate-room"]["template"]
    assert room["settings"]["index.mode"] == "time_series"
    props = room["mappings"]["properties"]
    assert props["radiate"]["properties"]["room"]["properties"]["id"]["time_series_dimension"]
    assert props["model"]["properties"]["a"]["time_series_metric"] == "gauge"


class _Resp:
    def __init__(self, status, body):
        self.status, self._body = status, body

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def json(self, content_type=None):
        return self._body


class _Session:
    def __init__(self, status=200, body=None, fail=False):
        self.status, self.body, self.fail, self.calls = status, body or {"errors": False}, fail, 0

    def post(self, *a, **kw):
        self.calls += 1
        if self.fail:
            raise OSError("network down")
        return _Resp(self.status, self.body)


async def test_flush_keeps_buffer_on_failure_and_drains_on_success():
    exp = ElasticExporter("http://es:9200", "key", house_id="h", batch=5)
    exp.record(await _state(), ts=TS)
    n = len(exp.buffer)
    assert not await exp.flush(_Session(fail=True))
    assert len(exp.buffer) == n and exp.failures == 1
    assert await exp.flush(_Session())
    assert len(exp.buffer) == n - 5 and exp.sent == 5
