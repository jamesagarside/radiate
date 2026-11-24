"""Raw data (radiate.server.data): the index of the tick history, queries, and the
`GET /api/v1/data`, `GET /api/v1/data/series` and `GET /api/v1/export` routes."""

import csv
import io
import math

import pytest
from aiohttp.test_utils import TestClient, TestServer

from radiate.core.series import split_key, tick_values
from radiate.server import data as data_module
from radiate.server.app import create_app
from radiate.server.bridge import RequestError, handle, run_sync
from radiate.server.data import (
    QueryError,
    SeriesIndex,
    choose_step,
    data_view,
    parse_time,
    series_view,
)
from radiate.server.demo import DemoDriver, demo_runtime
from radiate.server.history import _unpack
from radiate.server.runtime import Runtime
from radiate.sim.reference import house_config


@pytest.fixture(scope="module")
def recorded():
    """The demo house with 3 h 20 min of ticks recorded, from 05:30."""
    rt = demo_runtime(record=True)
    for _ in range(200):
        run_sync(rt.step())
    return rt


def _raw(rt) -> list[tuple[float, dict[str, float]]]:
    rows = rt.recorder.history.db.execute(
        "SELECT wall, data FROM history WHERE kind = 'tick' ORDER BY id"
    ).fetchall()
    return [(wall, tick_values(_unpack(blob))) for wall, blob in rows]


def test_ticks_record_observed_values(recorded):
    _, values = _raw(recorded)[-1]
    assert "room.target@lounge" in values and "room.calling@lounge" in values
    assert "room.setpoint@lounge" in values and "room.setpoint@stairs" not in values
    assert values["boiler.burner"] in (0.0, 1.0)  # the simulator reports its burner


def test_minute_points_are_the_recorded_values(recorded):
    raw = _raw(recorded)
    v = data_view(
        recorded,
        {"metric": "room.temperature", "room": "lounge", "from": str(raw[0][0]), "step": "60"},
    )
    pts = v["series"][0]["points"]
    assert v["step"] == 60 and not v["partial"]
    assert len(pts) == len(raw)
    for (wall, values), (t, mean, lo, hi) in zip(raw, pts, strict=True):
        assert t == wall // 60 * 60
        assert mean == lo == hi == pytest.approx(values["room.temperature@lounge"], abs=0.01)


def test_hourly_points_aggregate_the_minutes(recorded):
    raw = _raw(recorded)
    v = data_view(recorded, {"metric": "boiler.relay", "from": str(raw[0][0]), "step": "3600"})
    pts = {p[0]: p for p in v["series"][0]["points"]}
    hours: dict[float, list[float]] = {}
    for wall, values in raw:
        hours.setdefault(wall // 3600 * 3600, []).append(values["boiler.relay"])
    assert set(pts) == set(hours)  # the hour in progress, still in memory, is included
    for h, vals in hours.items():
        t, mean, lo, hi = pts[h]
        assert mean == pytest.approx(sum(vals) / len(vals), abs=0.001)  # share of the hour on
        assert (lo, hi) == (min(vals), max(vals))


def test_series_view_lists_what_was_recorded(recorded):
    view = series_view(recorded)
    assert view["available"] and view["indexing"]["done"]
    keys = [s["key"] for s in view["series"]]
    assert keys[0] == "outdoor.temperature"  # house series first, in catalogue order
    assert "room.temperature@lounge" in keys and "valve.opening@lounge" in keys
    lounge = next(s for s in view["series"] if s["key"] == "room.temperature@lounge")
    assert lounge["room_name"] == "Lounge" and lounge["unit"] == "°C"
    assert lounge["first"] <= lounge["last"]
    state = next(m for m in view["metrics"] if m["metric"] == "boiler.state")
    assert state["levels"] == ["idle", "lead", "firing", "rest"]
    assert view["export"] is None


def test_room_filter_keeps_house_series(recorded):
    v = data_view(recorded, {"metric": "room.temperature,boiler.state", "room": "lounge"})
    assert [s["key"] for s in v["series"]] == ["boiler.state", "room.temperature@lounge"]


def test_restart_continues_from_the_saved_position(recorded):
    index = recorded.recorder.index
    again = SeriesIndex(index.store, index.history)
    # Only the hour in progress is read again: earlier hours are written.
    reread = again.catch_up(10_000)
    assert 0 < reread <= 60 < len(_raw(recorded))
    a = data_view(recorded, {"metric": "room.temperature", "step": "60", "from": "0"})
    recorded.recorder.index = again
    try:
        b = data_view(recorded, {"metric": "room.temperature", "step": "60", "from": "0"})
    finally:
        recorded.recorder.index = index
    strip = lambda v: [(s["key"], s["points"]) for s in v["series"]]  # noqa: E731
    assert strip(a) == strip(b)


def test_a_new_index_version_rebuilds(monkeypatch):
    rt = demo_runtime(record=True)
    for _ in range(90):
        run_sync(rt.step())
    index = rt.recorder.index
    while index.catch_up(500):
        pass
    before = set(index.catalogue())
    monkeypatch.setattr(data_module, "INDEX_VERSION", 99)
    fresh = SeriesIndex(index.store, index.history)
    assert fresh.catalogue() == {} and fresh.behind() == 90
    while fresh.catch_up(50):
        pass
    assert set(fresh.catalogue()) == before


def test_partial_while_indexing(monkeypatch):
    rt = demo_runtime(record=True)
    for _ in range(30):
        run_sync(rt.step())
    monkeypatch.setattr(data_module, "QUERY_CATCH_UP", 10)
    v = data_view(rt, {})  # reads 10 of the 30 ticks
    assert v["partial"]
    assert series_view(rt)["indexing"] == {"done": False, "behind_ticks": 10}


def test_old_hours_are_pruned():
    rt = demo_runtime(record=True)
    rt.recorder.history.days = 1 / 24  # keep an hour
    for _ in range(4 * 60 + 1):
        run_sync(rt.step())
    index = rt.recorder.index
    while index.catch_up(500):
        pass
    hours = {h for (h,) in index.db.execute("SELECT DISTINCT hour FROM data_hour")}
    assert len(hours) <= 2


def test_steps():
    assert choose_step(86400, None, 1) == (300, False)
    assert choose_step(30 * 86400, "auto", 1) == (3600, False)
    assert choose_step(86400, "120", 1) == (300, True)  # not one of STEPS
    assert choose_step(30 * 86400, "60", 1) == (900, True)  # at most 5,000 points
    assert choose_step(86400, "60", 100) == (60, False)
    assert choose_step(86400, "60", 200) == (300, True)  # at most 250,000 values
    with pytest.raises(QueryError):
        choose_step(1, "soon", 1)
    with pytest.raises(QueryError):
        choose_step(1, "-5", 1)


def test_times():
    assert parse_time("1795000000", "Europe/London", 0) == 1795000000
    assert parse_time(None, "Europe/London", 7) == 7
    # Without an offset a time is house time: GMT in November, BST in July.
    assert parse_time("2026-11-24T00:00", "Europe/London", 0) == 1795478400
    assert parse_time("2026-07-01T01:00", "Europe/London", 0) == 1782864000
    assert parse_time("2026-07-01T00:00Z", "Europe/London", 0) == 1782864000
    for bad in ("yesterday", "nan", "inf"):
        with pytest.raises(QueryError):
            parse_time(bad, "Europe/London", 0)


def test_day_buckets_start_at_local_midnight(recorded):
    v = data_view(recorded, {"metric": "outdoor.temperature", "step": "86400", "from": "0"})
    (t, *_), *_ = v["series"][0]["points"]
    from datetime import datetime
    from zoneinfo import ZoneInfo

    local = datetime.fromtimestamp(t, ZoneInfo(recorded.timezone))
    assert (local.hour, local.minute) == (0, 0)


@pytest.mark.parametrize(
    ("query", "message"),
    [
        ({"metric": "room.colour"}, "unknown metric"),
        ({"room": "attic"}, "unknown room"),
        ({"from": "200", "to": "100"}, "from must be before to"),
        ({"step": "often"}, "step must be"),
    ],
)
def test_bad_queries(recorded, query, message):
    with pytest.raises(QueryError, match=message):
        data_view(recorded, query)


# --- routes ----------------------------------------------------------------------------


@pytest.fixture
async def client(recorded):
    async with TestClient(TestServer(create_app(recorded, token="secret"))) as c:
        yield c


H = {"Authorization": "Bearer secret"}


async def test_routes_need_the_token(client):
    for path in ("/api/v1/data", "/api/v1/data/series", "/api/v1/export"):
        assert (await client.get(path)).status == 401


async def test_data_route_json_and_csv(client, recorded):
    r = await client.get(
        "/api/v1/data",
        params={"metric": "room.temperature,boiler.state", "room": "lounge", "step": "900"},
        headers=H,
    )
    assert r.status == 200
    body = await r.json()
    assert [s["key"] for s in body["series"]] == ["boiler.state", "room.temperature@lounge"]
    r = await client.get(
        "/api/v1/data", params={"metric": "room.temperature", "format": "csv"}, headers=H
    )
    assert r.status == 200 and r.content_type == "text/csv"
    assert "attachment" in r.headers["Content-Disposition"]
    rows = list(csv.reader(io.StringIO(await r.text())))
    assert rows[0] == ["time", "metric", "room", "unit", "value", "min", "max"]
    assert {row[1] for row in rows[1:]} == {"room.temperature"}
    assert all(row[3] == "°C" for row in rows[1:])
    assert all(row[0].endswith("+00:00") for row in rows[1:])  # house time, GMT in November
    assert not any(math.isnan(float(row[4])) for row in rows[1:])
    # Repeated parameters work as well as commas.
    r = await client.get(
        "/api/v1/data?metric=room.temperature&metric=valve.opening&room=lounge", headers=H
    )
    keys = {s["key"] for s in (await r.json())["series"]}
    assert keys == {"room.temperature@lounge", "valve.opening@lounge"}


async def test_data_route_errors(client):
    r = await client.get("/api/v1/data", params={"metric": "nope"}, headers=H)
    assert r.status == 400 and "unknown metric" in await r.text()
    r = await client.get("/api/v1/data", params={"format": "xml"}, headers=H)
    assert r.status == 400


async def test_series_and_export_routes(client):
    body = await (await client.get("/api/v1/data/series", headers=H)).json()
    assert body["available"] and body["series"]
    assert await (await client.get("/api/v1/export", headers=H)).json() == {
        "otlp": None,
        "elastic": None,
    }


async def test_no_history_means_no_raw_data():
    rt = Runtime(house_config(), DemoDriver())
    await rt.step()
    async with TestClient(TestServer(create_app(rt))) as c:
        body = await (await c.get("/api/v1/data/series")).json()
        assert body["available"] is False and "history" in body["why"]
        assert (await c.get("/api/v1/data")).status == 400


def test_bridge_answers_with_a_query_string(recorded):
    out = handle(recorded, "GET", "data?metric=room.temperature&room=lounge&step=3600")
    assert [s["key"] for s in out["series"]] == ["room.temperature@lounge"]
    assert handle(recorded, "GET", "data/series")["available"]
    assert handle(recorded, "GET", "export") == {"otlp": None, "elastic": None}
    with pytest.raises(RequestError) as err:
        handle(recorded, "GET", "data?metric=nope")
    assert err.value.status == 400


def test_series_keys_parse(recorded):
    for s in series_view(recorded)["series"]:
        assert split_key(s["key"]) == (s["metric"], s["room"])
