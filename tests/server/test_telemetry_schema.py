"""The telemetry schema (radiate.export.telemetry): its rules, its versions, the doc
generated from it, and every record the OTLP encoder and the runtime emit checked
against it."""

import json
import re
from datetime import date
from pathlib import Path

import pytest

from radiate.config.export import parse_export
from radiate.core.accounting import Ledger
from radiate.core.series import BY_ID
from radiate.export import telemetry
from radiate.export.otlp import OtlpExporter, encode, logs_request, metrics_request
from radiate.export.telemetry import (
    EVENTS,
    METRICS,
    SCHEMA_VERSION,
    additive_problems,
    check_logs,
    check_metrics,
    snapshot,
)

pb_metrics = pytest.importorskip("opentelemetry.proto.collector.metrics.v1.metrics_service_pb2")
pb_logs = pytest.importorskip("opentelemetry.proto.collector.logs.v1.logs_service_pb2")
json_format = pytest.importorskip("google.protobuf.json_format")

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOTS = Path(__file__).parent / "fixtures" / "telemetry"
HOUSE = "4c0d8a52-8f53-4d1b-9c2b-8d0f3d7c1e2a"
ROOMS = {"lounge": "Lounge", "bedroom_1": "Bedroom 1"}
T0 = 1795000000.0
UCUM = {"Cel", "%", "1", "W", "s", "min", "h", "L", "kW.h", "K.h"}


def _version(path: Path) -> tuple[int, int]:
    major, minor = path.stem.removeprefix("schema-").split(".")
    return int(major), int(minor)


def _cfg(**over):
    export, problems = parse_export({"otlp": {"endpoint": "http://collector.invalid", **over}})
    assert problems == []
    return export.otlp


# --- the schema's own rules --------------------------------------------------------------


def test_every_raw_data_series_has_exactly_one_metric():
    assert set(telemetry.METRIC_BY_SERIES) == set(BY_ID)


def test_names_units_and_text_follow_the_rules():
    names = [m.name for m in METRICS]
    assert len(set(names)) == len(names)
    for m in METRICS:
        assert re.fullmatch(r"radiate(\.[a-z][a-z0-9_]*)+", m.name), m.name
        # OpenTelemetry: a metric name is never the namespace of another.
        assert not any(n.startswith(m.name + ".") for n in names), m.name
        assert m.unit in UCUM or re.fullmatch(r"\{[a-z]+\}", m.unit), m.unit
        assert (m.instrument == telemetry.SUM) == (m.temporality == telemetry.CUMULATIVE)
    events = [e.name for e in EVENTS]
    assert len(set(events)) == len(events)
    for e in EVENTS:
        assert e.severity in telemetry.SEVERITY
        keys = [a.key for a in e.attributes]
        # The event name is in the log record's event name field, never an attribute.
        assert len(set(keys)) == len(keys) and keys[0] == "event.action"
        assert "event.name" not in keys
    text = json.dumps([str(x) for x in (*METRICS, *EVENTS, *telemetry.RESOURCE)])
    assert all(chr(c) not in text for c in (0x2013, 0x2014))  # no en or em dashes


def test_no_attribute_could_carry_a_person_or_a_place():
    """Except on security audit events (ADR-0008), which say who and from where."""
    plain = [e for e in EVENTS if not e.name.startswith("radiate.security.")]
    keys = {a.key for d in (*METRICS, *plain) for a in d.attributes}
    keys |= {a.key for a in telemetry.RESOURCE}
    for key in keys:
        assert not re.search(r"person\.|\.name$|address|location|geo|client|user", key) or (
            key in ("radiate.room.name", "service.name")
        ), key


def test_only_security_events_identify_people():
    personal = {"user.name", "user.target.name", "source.address"}
    for e in EVENTS:
        keys = {a.key for a in e.attributes}
        if e.name.startswith("radiate.security."):
            assert e.name in telemetry.SECURITY_KINDS
            assert {"event.category", "event.type", "event.outcome"} <= keys
            assert "Security audit." in e.brief
        else:
            assert not keys & personal, e.name


def test_reason_codes_map_to_events():
    f = telemetry.event_for_code
    assert f("boiler.lead") == "radiate.decision"
    assert f("valve.stuck", alert=True) == "radiate.alert"
    assert f("away.everyone") == "radiate.presence.changed"
    assert f("learning.invalidated") == f("learning.reset") == "radiate.learning.invalidated"
    assert f("household.setup") == "radiate.settings.changed"


# --- versions ------------------------------------------------------------------------------


def test_the_current_version_has_its_snapshot():
    path = SNAPSHOTS / f"schema-{SCHEMA_VERSION}.json"
    assert path.exists(), "run scripts/telemetry_docs.py --snapshot after bumping the version"
    assert json.loads(path.read_text()) == snapshot(), (
        "the schema changed without a new version: bump SCHEMA_VERSION (the minor for an "
        "addition, the major for anything else) and run scripts/telemetry_docs.py --snapshot"
    )


def test_versions_within_a_major_only_add():
    paths = sorted(SNAPSHOTS.glob("schema-*.json"), key=_version)
    assert paths
    for i, older in enumerate(paths):
        for newer in paths[i + 1 :]:
            if _version(older)[0] == _version(newer)[0]:
                problems = additive_problems(
                    json.loads(older.read_text()), json.loads(newer.read_text())
                )
                assert problems == [], f"{older.name} to {newer.name}: {problems}"


def test_additive_check_catches_breaking_changes():
    old = snapshot()
    new = json.loads(json.dumps(old))
    del new["metrics"]["radiate.room.temperature"]
    new["metrics"]["radiate.room.humidity"]["unit"] = "1"
    new["events"]["radiate.alert"]["severity"] = "INFO"
    new["events"]["radiate.decision"]["attributes"]["radiate.room.id"]["required"] = True
    new["events"]["radiate.decision"]["attributes"]["radiate.new"] = {
        "type": "string",
        "required": True,
    }
    problems = additive_problems(old, new)
    assert any("radiate.room.temperature removed" in p for p in problems)
    assert any("radiate.room.humidity: unit changed" in p for p in problems)
    assert any("radiate.alert: severity changed" in p for p in problems)
    assert any("became required" in p for p in problems)
    assert any("new attribute radiate.new is required" in p for p in problems)
    added = json.loads(json.dumps(old))
    added["metrics"]["radiate.new.thing"] = added["metrics"]["radiate.room.temperature"]
    assert additive_problems(old, added) == []


def test_the_doc_is_generated_from_the_schema():
    doc = ROOT / "docs" / "telemetry.md"
    text = doc.read_text()
    assert telemetry.render_doc(text) == text, "run scripts/telemetry_docs.py"
    for m in METRICS:
        assert f"`{m.name}`" in text
    for e in EVENTS:
        assert f"`{e.name}`" in text


# --- every record the encoder emits matches its definition --------------------------------


def _summary() -> dict:
    ledger = Ledger()
    day = date(2026, 11, 23).toordinal()
    now = 0.0
    for i in range(24 * 60):
        relay = 300 <= i < 340 or 700 <= i < 720
        ledger.update(
            now,
            day,
            relay_on=relay,
            firing=relay,
            calling={"lounge", "bedroom_1"} if relay else set(),
            below={"lounge": i < 30, "bedroom_1": False},
            minute=i,
            nozzle_lph=1.9,
            heating_burner=relay,
            store_burner=False,
        )
        now += 60
    summary = ledger.update(
        now, day + 1, relay_on=False, firing=False, calling=set(), below={}, nozzle_lph=1.9
    )
    assert summary is not None
    return summary


ESTIMATE = {
    "date": "2026-11-23",
    "eligible": True,
    "litres": 2.1,
    "litres_baseline": 2.6,
    "litres_saved": 0.5,
    "dh_actual_kh": 120.4,
    "dh_baseline_kh": 150.2,
    "comfort_deficit_kh": 1.25,
    "warm_share": 0.97,
    "fit_cv_rmse": 0.12,
}


def _every_metric() -> dict:
    values = {f"{m.id}@lounge" if m.scope == "room" else m.id: 1.0 for m in BY_ID.values()}
    totals = {d.source: 10.0 for d in telemetry.COUNTERS}
    start, end = T0 - 86400, T0 - 1
    records = [
        {"t": T0, "v": values, "k": totals, "k0": T0 - 3600},
        {"t": T0, "d": {"summary": _summary(), "estimate": ESTIMATE, "start": start, "end": end}},
    ]
    return metrics_request(records, HOUSE, ROOMS, dataset="radiate")


def test_every_metric_is_emitted_and_matches_the_schema():
    req = _every_metric()
    assert check_metrics(req) == []
    names = {m["name"] for m in req["resourceMetrics"][0]["scopeMetrics"][0]["metrics"]}
    assert names == {m.name for m in METRICS}
    by_name = {m["name"]: m for m in req["resourceMetrics"][0]["scopeMetrics"][0]["metrics"]}
    starts = by_name["radiate.boiler.starts"]["sum"]
    assert starts["aggregationTemporality"] == 2 and starts["isMonotonic"] is True
    assert starts["dataPoints"][0]["startTimeUnixNano"] == str(int((T0 - 3600) * 1e9))
    burner = by_name["radiate.daily.burner.time"]["gauge"]["dataPoints"][0]
    assert burner["timeUnixNano"] == str(int((T0 - 1) * 1e9))
    assert burner["asDouble"] == 1.0  # 60 minutes of metered firing
    share = by_name["radiate.daily.savings.share"]["gauge"]["dataPoints"][0]
    assert share["asDouble"] == pytest.approx(19.2)
    rooms = by_name["radiate.daily.room.below_comfort"]["gauge"]["dataPoints"]
    assert {p["attributes"][0]["value"]["stringValue"]: p["asDouble"] for p in rooms} == {
        "lounge": 29.0  # the first tick only starts the clock
    }


def test_metrics_with_sums_encode_like_the_official_classes():
    req = _every_metric()
    body, _ = encode(req, "http/protobuf")
    official = json_format.ParseDict(req, pb_metrics.ExportMetricsServiceRequest())
    assert body == official.SerializeToString()
    text, _ = encode(req, "http/json")
    assert json_format.Parse(text, pb_metrics.ExportMetricsServiceRequest()) == official


def test_a_day_without_savings_or_a_nozzle_sends_what_it_has():
    summary = {**_summary(), "litres": None, "kwh": None}
    req = metrics_request(
        [{"t": T0, "d": {"summary": summary, "estimate": None, "start": None, "end": T0}}],
        HOUSE,
        ROOMS,
    )
    assert check_metrics(req) == []
    names = {m["name"] for m in req["resourceMetrics"][0]["scopeMetrics"][0]["metrics"]}
    assert "radiate.daily.burner.time" in names
    assert not any("savings" in n or n == "radiate.daily.oil.consumed" for n in names)


def _every_event() -> list[dict]:
    t = telemetry
    return [
        t.reason_record("boiler.lead", "Boiler: opening valves", values={"predicted_burn_min": 9}),
        t.reason_record(
            "demand.pooled",
            "Lounge: waiting",
            "lounge",
            {"temperature_c": 19.0, "target_c": 20.0, "other": 3},
        ),
        t.reason_record("valve.stuck", "Lounge: valve stuck", "lounge", alert=True),
        t.alert_cleared_record("valve.stuck", "Lounge: valve stuck", "lounge"),
        t.burn_record(1380.0, dry_run=True),
        t.mode_record("heating", "auto", "frost"),
        t.reason_record("away.everyone", "Everyone is away", people=(0, 2)),
        t.reason_record("learning.reset", "Lounge: learning reset to priors", "lounge"),
        t.settings_record("settings.saved", ["boiler.min_burn_min", "house.timezone"], True),
        t.reason_record("household.setup", "Household setup changed: schedules rebuilt"),
        t.dropped_record("metrics", 12, "queue_full"),
        *_every_security_event(),
    ]


def _every_security_event() -> list[dict]:
    t = telemetry
    who = {
        "user.name": "alice",
        "user.roles": ["admin"],
        "source.address": "192.0.2.10",
        "radiate.auth.method": "session",
    }
    req = {"http.request.method": "PUT", "url.path": "/api/v1/layout"}
    rec = t.security_record
    return [
        rec(
            t.SECURITY_LOGIN,
            "login",
            "Signed in: alice (admin, password)",
            {**who, "radiate.auth.method": "password"},
        ),
        rec(
            t.SECURITY_LOGIN_FAILED,
            "login",
            "Sign-in refused for bob: wrong password",
            {
                "user.name": "bob",
                "source.address": "192.0.2.10",
                "radiate.auth.method": "password",
                "error.type": "bad_password",
                "radiate.security.count": 3,
            },
        ),
        rec(t.SECURITY_LOGOUT, "logout", "Signed out: alice", who),
        rec(
            t.SECURITY_SESSION_ENDED,
            "session.revoked",
            "2 sessions ended for alice: password reset",
            {
                "user.name": "alice",
                "radiate.auth.method": "password",
                "event.reason": "password_reset",
                "radiate.sessions.ended": 2,
            },
        ),
        rec(
            t.SECURITY_REQUEST_REFUSED,
            "request.refused",
            "Request refused: wrong API token",
            {"source.address": "192.0.2.10", "error.type": "bad_token", **req},
        ),
        rec(
            t.SECURITY_ACCESS_DENIED,
            "access.denied",
            "Refused: alice (viewer) needs admin for PUT /api/v1/layout",
            {**who, **req, "error.type": "forbidden", "radiate.auth.needed_role": "admin"},
        ),
        rec(
            t.SECURITY_LOCKOUT_STARTED,
            "lockout.started",
            "Sign-in locked for 900 s: username bob",
            {
                "user.name": "bob",
                "radiate.lockout.scope": "username",
                "radiate.lockout.duration": 900.0,
            },
        ),
        rec(
            t.SECURITY_LOCKOUT_ENDED,
            "lockout.ended",
            "Sign-in lockout ended: username bob",
            {"user.name": "bob", "radiate.lockout.scope": "username"},
        ),
        rec(
            t.SECURITY_USER_CHANGED,
            "user.added",
            "User added: carol (household)",
            {
                "event.type": "creation",
                "user.target.name": "carol",
                "user.target.roles": ["household"],
                "radiate.auth.method": "cli",
            },
        ),
        rec(
            t.SECURITY_CONFIG_CHANGED,
            "settings.saved",
            "Settings saved by alice (admin)",
            {
                **who,
                **req,
                "radiate.config.area": "settings",
                "radiate.settings.paths": ["boiler.min_burn_min"],
            },
        ),
        rec(
            t.SECURITY_LOGIN_CONFIG,
            "login.config",
            "Login on: password; API token set",
            {
                "radiate.auth.login": True,
                "radiate.auth.methods": ["password"],
                "radiate.auth.token": True,
                "radiate.auth.ingress": False,
                "radiate.auth.trusted_proxies": 1,
            },
        ),
    ]


def test_a_security_record_keeps_only_its_own_attributes():
    rec = telemetry.security_record(
        telemetry.SECURITY_LOGIN_FAILED,
        "login",
        "Sign-in refused for bob: wrong password",
        {
            "user.name": "bob",
            "radiate.auth.method": "password",
            "error.type": "bad_password",
            "password": "hunter2-hunter2",
            "radiate.settings.paths": ["x"],
            "source.address": None,
        },
    )
    assert rec["a"] == {
        "event.category": "authentication",
        "event.type": "start",
        "event.outcome": "failure",
        "user.name": "bob",
        "radiate.auth.method": "password",
        "error.type": "bad_password",
    }


def test_every_event_is_emitted_and_matches_the_schema():
    records = [{"t": T0, **r} for r in _every_event()]
    req = logs_request(records, HOUSE, "radiate", ROOMS)
    assert check_logs(req) == []
    recs = req["resourceLogs"][0]["scopeLogs"][0]["logRecords"]
    assert {r["eventName"] for r in recs} == {e.name for e in EVENTS}
    attrs = {kv["key"]: kv["value"] for kv in recs[1]["attributes"]}
    assert attrs["radiate.room.name"] == {"stringValue": "Lounge"}
    assert attrs["radiate.room.temperature"] == {"doubleValue": 19.0}
    assert "other" not in json.dumps(recs[1])  # only the schema's reason values
    alert = recs[2]
    assert alert["severityText"] == "WARN" and alert["severityNumber"] == 13
    body, _ = encode(req, "http/protobuf")
    official = json_format.ParseDict(req, pb_logs.ExportLogsServiceRequest())
    assert body == official.SerializeToString()
    assert official.resource_logs[0].scope_logs[0].log_records[0].event_name == "radiate.decision"


def test_the_checks_catch_departures():
    req = _every_metric()
    m = req["resourceMetrics"][0]["scopeMetrics"][0]["metrics"][0]
    m["unit"] = "K"
    m["gauge"]["dataPoints"][0]["attributes"].append(
        {"key": "radiate.oops", "value": {"stringValue": "x"}}
    )
    problems = check_metrics(req)
    assert any("unit 'K'" in p for p in problems)
    assert any("radiate.oops is not in the schema" in p for p in problems)
    logs = logs_request([{"t": T0, **telemetry.burn_record(60, False)}], HOUSE)
    rec = logs["resourceLogs"][0]["scopeLogs"][0]["logRecords"][0]
    rec["attributes"] = [a for a in rec["attributes"] if a["key"] != "radiate.burn.duration"]
    rec["severityText"] = "WARN"
    problems = check_logs(logs)
    assert any("required attribute radiate.burn.duration missing" in p for p in problems)
    assert any("severity should be INFO" in p for p in problems)


# --- daily figures ------------------------------------------------------------------------


def _day_point(cfg) -> list:
    exp = OtlpExporter(cfg, HOUSE, ROOMS)
    exp.record_day(T0 + 75, _summary(), None, T0 - 86400, T0 - 1)
    req = exp._request("metrics", exp.queues["metrics"].peek(10))
    metrics = req["resourceMetrics"][0]["scopeMetrics"][0]["metrics"]
    return [p for m in metrics for p in m["gauge"]["dataPoints"]]


def test_daily_figures_are_timed_at_the_end_of_the_day_by_default():
    points = _day_point(_cfg())
    assert points and {p["timeUnixNano"] for p in points} == {str(int((T0 - 1) * 1e9))}
    assert {p["startTimeUnixNano"] for p in points} == {str(int((T0 - 86400) * 1e9))}


def test_daily_figures_can_be_timed_when_the_day_closed():
    points = _day_point(_cfg(daily_timestamp="day_close"))
    assert points and {p["timeUnixNano"] for p in points} == {str(int((T0 + 75) * 1e9))}
    assert {p["startTimeUnixNano"] for p in points} == {str(int((T0 - 86400) * 1e9))}


def test_daily_figures_can_be_turned_off():
    exp = OtlpExporter(_cfg(daily_metrics=False), HOUSE, ROOMS)
    exp.record_day(T0, _summary(), None, T0 - 86400, T0 - 1)
    assert len(exp.queues["metrics"]) == 0
    exp.record(T0, {"outdoor.temperature": 1.0})
    assert len(exp.queues["metrics"]) == 1  # the per-tick metrics still go


# --- the exporter reports what it loses ----------------------------------------------------


def test_lost_data_is_reported_at_most_hourly():
    from radiate.server.store import MemoryQueue

    exp = OtlpExporter(_cfg(), HOUSE, ROOMS, metrics_queue=MemoryQueue(2))
    for i in range(5):
        exp.record(T0 + i * 60, {"outdoor.temperature": 1.0})
    logs = list(exp.queues["logs"])
    assert len(logs) == 1 and logs[0]["e"] == "radiate.export.dropped"
    assert logs[0]["a"]["radiate.export.dropped"] == 1
    exp.record(T0 + 120 + 3600, {"outdoor.temperature": 1.0})
    logs = list(exp.queues["logs"])
    assert len(logs) == 2 and logs[1]["a"]["radiate.export.dropped"] == 3
    assert check_logs(logs_request(logs, HOUSE)) == []


# --- the runtime ---------------------------------------------------------------------------


def _runtime():
    from radiate.server.demo import DemoDriver
    from radiate.server.runtime import Runtime
    from radiate.sim.reference import house_config

    rt = Runtime(house_config(), DemoDriver())
    rooms = {r.id: r.name for r in rt.cfg.rooms}
    rt.otlp = OtlpExporter(_cfg(), rt.house_id, rooms)
    return rt


def _requests(rt) -> tuple[dict, dict]:
    exp = rt.otlp
    return (
        exp._request("metrics", exp.queues["metrics"].peek(10_000)),
        exp._request("logs", exp.queues["logs"].peek(10_000)),
    )


async def test_the_runtime_emits_only_what_the_schema_allows():
    from radiate.core import Mode
    from radiate.core.types import DemandMode

    rt = _runtime()
    for _ in range(3):
        await rt.step()
    rt.set_mode(Mode.FROST)
    rt.set_mode(Mode.FROST)  # no change, no record
    rt.set_demand_mode(
        DemandMode.COMFORT if rt.effective_demand_mode is DemandMode.ECO else DemandMode.ECO
    )
    await rt.step()
    summary = rt.state.ledger.summary(1.9)
    rt._export_otlp_day(T0, summary, None)
    metrics, logs = _requests(rt)
    assert check_metrics(metrics) == []
    assert check_logs(logs) == []
    names = {m["name"] for m in metrics["resourceMetrics"][0]["scopeMetrics"][0]["metrics"]}
    assert {"radiate.room.temperature", "radiate.boiler.starts"} <= names
    assert "radiate.daily.burner.time" in names
    events = [r["eventName"] for r in logs["resourceLogs"][0]["scopeLogs"][0]["logRecords"]]
    assert events.count("radiate.mode.changed") == 2


async def test_a_burn_and_a_cleared_alert_are_events():
    from radiate.core.types import Reason

    rt = _runtime()
    await rt.step()
    ledger = rt.state.ledger
    events = rt._otlp_records(
        [],
        [("valve.stuck", "lounge", "Lounge: valve stuck")],
        burn_start=ledger.last_t - 600 if ledger.relay is False else None,
        now=ledger.last_t,
    )
    names = [e["e"] for e in events]
    assert "radiate.alert.cleared" in names
    if ledger.relay is False:
        burn = next(e for e in events if e["e"] == "radiate.boiler.burn")
        assert burn["a"]["radiate.burn.duration"] == 600.0
    presence = rt._otlp_records(
        [(Reason("away.home", "Someone said they are home"), False)], [], None, 0
    )
    assert presence[0]["a"] == {"radiate.people.home": 0, "radiate.people.away": 0}


async def test_settings_and_refused_requests_reach_the_export():
    from aiohttp.test_utils import TestClient, TestServer

    from radiate.server.app import create_app

    rt = _runtime()
    app = create_app(rt, token="s3cret")
    async with TestClient(TestServer(app)) as client:
        resp = await client.get("/api/v1/state")
        assert resp.status == 401
    refused = [e for e in rt._otlp_events if e["e"] == "radiate.security.request.refused"]
    assert len(refused) == 1 and refused[0]["a"]["error.type"] == "no_credentials"
