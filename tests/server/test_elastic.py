import json
from datetime import UTC, datetime

from radiate.export.elastic import (
    BOILER_STREAM,
    DAILY_STREAM,
    ROOM_STREAM,
    ElasticExporter,
    boiler_doc,
    bulk_body,
    index_templates,
)
from radiate.server.demo import DEMO_FIRST_DAY, DemoDriver
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


SUMMARY = {
    "day": 739938,
    "basis": "relay",
    "burner_hours": 6.5,
    "starts": 4,
    "max_starts_in_hour": 1,
    "burns": {
        "count": 4,
        "mean_min": 97.5,
        "min_min": 30.0,
        "max_min": 180.0,
        "histogram": {
            "under_10": 0,
            "10_to_20": 0,
            "20_to_30": 0,
            "30_to_60": 1,
            "60_to_120": 2,
            "over_120": 1,
        },
    },
    "litres": 13.0,
    "kwh": 114.4,
    "balance": {"starts_measured": 3, "arrival_spread_min": 30.0, "score": 75.0},
    "comfort_minutes_below": {"bedroom_1": 12.0, "dining": 3.0},
}


def test_daily_document():
    exp = ElasticExporter("http://es:9200", "key", house_id="h")
    exp.record_daily(SUMMARY, ts=TS)
    (doc,) = list(exp.buffer)
    assert doc["data_stream"]["dataset"] == "radiate.daily"
    assert doc["radiate"]["house"]["id"] == "h"
    assert doc["radiate"]["day"] == "2026-11-18"  # local calendar day it covers
    assert doc["boiler"]["burner_hours"] == 6.5 and doc["boiler"]["starts"] == 4
    assert doc["boiler"]["litres"] == 13.0 and doc["boiler"]["kwh"] == 114.4
    assert doc["boiler"]["burns"]["histogram"]["over_120"] == 1
    assert doc["balance"] == {"arrival_spread_min": 30.0, "score": 75.0, "starts_measured": 3}
    assert doc["rooms"]["comfort_minutes_below"] == 15.0
    assert doc["radiate"]["partial_day"] is False  # older summaries have no flag
    assert DAILY_STREAM in bulk_body([doc])


def test_daily_document_marks_a_partial_day():
    exp = ElasticExporter("http://es:9200", "key", house_id="h")
    partial = {**SUMMARY, "partial": True, "balance": {**SUMMARY["balance"], "score": None}}
    exp.record_daily(partial, ts=TS)
    (doc,) = list(exp.buffer)
    assert doc["radiate"]["partial_day"] is True
    assert doc["balance"]["score"] is None
    mapping = index_templates()["radiate-daily"]["template"]["mappings"]["properties"]
    assert mapping["radiate"]["properties"]["partial_day"] == {"type": "boolean"}


async def test_runtime_exports_the_closed_day_and_describes_accounting():
    class Capture:
        def __init__(self):
            self.daily = []

        def record(self, state, decisions=()):
            pass

        def record_daily(self, summary, estimate=None):
            self.daily.append(summary)

    rt = Runtime(house_config(), DemoDriver(start_hour=23.8))  # 23:48 in the demo house
    rt.exporter = Capture()
    for _ in range(5):
        await rt.step()
    assert rt.exporter.daily == []
    acc = rt.describe()["accounting"]
    first = DEMO_FIRST_DAY  # the demo's days are calendar days
    assert acc["today"]["day"] == first and acc["yesterday"] is None
    for _ in range(10):
        await rt.step()  # past midnight
    assert [s["day"] for s in rt.exporter.daily] == [first]
    acc = rt.describe()["accounting"]
    assert acc["today"]["day"] == first + 1 and acc["yesterday"]["day"] == first
    assert {"burner_hours", "starts", "litres", "balance"} <= set(acc["today"])
    # Radiate started at 23:48, so day 0 was not seen in full: no balance score.
    assert acc["yesterday"]["partial"] is True
    assert acc["yesterday"]["balance"]["score"] is None
    assert acc["today"]["partial"] is False
    assert rt.exporter.daily[0]["partial"] is True


def test_templates_are_tsds_with_dimensions():
    t = index_templates()
    room = t["radiate-room"]["template"]
    assert room["settings"]["index.mode"] == "time_series"
    props = room["mappings"]["properties"]
    assert props["radiate"]["properties"]["room"]["properties"]["id"]["time_series_dimension"]
    assert props["model"]["properties"]["a"]["time_series_metric"] == "gauge"
    daily = t["radiate-daily"]
    assert daily["index_patterns"] == ["metrics-radiate.daily-*"]
    dprops = daily["template"]["mappings"]["properties"]
    assert dprops["balance"]["properties"]["score"]["type"] == "float"
    assert dprops["radiate"]["properties"]["day"]["type"] == "date"


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


def test_daily_document_carries_relay_time_and_the_metered_burner():
    exp = ElasticExporter("http://es:9200", "key", house_id="h")
    metered = {
        **SUMMARY,
        "basis": "firing",
        "relay_hours": 9.0,
        "litres_relay": 18.0,
        "burner": {
            "metered": True,
            "heating_hours": 6.5,
            "heating_starts": 21,
            "store_hours": 0.4,
            "store_starts": 2,
            "store_litres": 0.8,
        },
    }
    exp.record_daily(metered, ts=TS)
    (doc,) = list(exp.buffer)
    b = doc["boiler"]
    assert b["hours_basis"] == "firing" and b["relay_hours"] == 9.0
    assert b["litres_relay"] == 18.0
    assert b["burner"]["heating_starts"] == 21 and b["burner"]["store_litres"] == 0.8
    mapping = index_templates()["radiate-daily"]["template"]["mappings"]["properties"]
    boiler = mapping["boiler"]["properties"]
    assert boiler["relay_hours"] == {"type": "float"}
    assert boiler["burner"]["properties"]["heating_starts"] == {"type": "short"}


def test_daily_document_from_an_older_summary_has_no_burner_section():
    exp = ElasticExporter("http://es:9200", "key", house_id="h")
    exp.record_daily(SUMMARY, ts=TS)
    (doc,) = list(exp.buffer)
    assert "burner" not in doc["boiler"] and "relay_hours" not in doc["boiler"]


def test_boiler_document_carries_the_burner():
    state = {
        "mode": "auto",
        "outdoor": 4.0,
        "boiler": {
            "state": "firing",
            "relay": True,
            "burn_elapsed_s": 600,
            "starts_last_hour": 1,
            "predicted_burn_min": 40,
            "supply": 0.5,
            "burner": False,
        },
        "store": {"relay": False, "boost": False, "burner": None},
    }
    doc = boiler_doc(state, "h", TS)
    assert doc["boiler"]["burner"] is False and doc["store"]["burner"] is None
