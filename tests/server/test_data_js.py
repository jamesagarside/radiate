"""The Raw data view's words and chart (web/data.js) under Node, fed what the server
itself answers for the demo house. Skipped where Node is not installed."""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

from radiate.server.bridge import run_sync
from radiate.server.data import data_view, series_view
from radiate.server.demo import demo_runtime

ROOT = Path(__file__).resolve().parents[2]
DATA_JS = ROOT / "web" / "src" / "data.js"
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="Node is not installed")

SCRIPT = """
const m = await import(process.argv[1]);
let input = "";
for await (const chunk of process.stdin) input += chunk;
const { cat, views, health } = JSON.parse(input);
const metrics = Object.fromEntries(cat.metrics.map((x) => [x.metric, x]));
const now = 1795000000;
console.log(JSON.stringify({
  summary: m.summaryText(cat),
  unavailable: m.summaryText({ available: false, why: "No history." }),
  search: m.search(cat, "lounge temp").map(m.seriesName),
  searchHouse: m.search(cat, "burner").map(m.seriesName),
  searchNone: m.search(cat, "attic"),
  views: views.map((v) => {
    const metric = metrics[v.series[0].metric];
    const svg = m.chartSvg(v, metric, { width: 600, height: 260, focus: v.series[0].key });
    return {
      title: m.titleText(v, metric, ""),
      meta: m.metaText(v, "24h"),
      stats: m.stats(v.series[0], metric, v.step),
      point: m.pointText(v.series[0], metric, v.step, 0, v.timezone),
      table: m.tableRows(v, metrics, 5),
      label: m.chartLabel(v, metric, v.series[0].key),
      ink: (svg.match(/rd-ink/g) || []).length,
      others: (svg.match(/rd-other/g) || []).length,
      bands: (svg.match(/rd-band/g) || []).length,
      yticks: m.yAxis(v, metric).ticks.map((t) => t[1]),
    };
  }),
  values: [
    m.fmtValue(-2.04, { unit: "°C", kind: "gauge" }),
    m.fmtValue(35, { unit: "%", kind: "gauge" }),
    m.fmtValue(182.4, { unit: "W", kind: "gauge" }),
    m.fmtValue(1, { kind: "state" }, 60),
    m.fmtValue(0.25, { kind: "state" }, 900),
    m.fmtValue(2, { kind: "level", levels: ["idle", "lead", "firing", "rest"] }),
    m.fmtValue(null, { unit: "°C" }),
  ],
  steps: [60, 300, 3600, 86400].map(m.stepWords),
  ago: [30, 600, 7200, 300000].map(m.ago),
  export: health.map((h) => m.exportView(h, now, "Europe/London")),
}));
"""


@pytest.fixture(scope="module")
def out(tmp_path_factory):
    rt = demo_runtime(record=True)
    for _ in range(180):
        run_sync(rt.step())
    cat = series_view(rt)
    day = str(rt.wall() - 86400)
    views = [
        data_view(rt, {"metric": "room.temperature", "from": day}),
        data_view(rt, {"metric": "boiler.relay", "from": day, "step": "900"}),
        data_view(rt, {"metric": "boiler.state", "from": day, "step": "60"}),
    ]
    base = {
        "enabled": True,
        "endpoint": "https://otlp.example:443",
        "protocol": "http/protobuf",
        "signals": ["metrics", "logs"],
        "interval_s": 60,
        "last_success": None,
        "last_attempt": None,
        "last_error": None,
        "last_error_at": None,
        "next_attempt": None,
        "failures": 0,
        "queued": {"metrics": 0, "logs": 0},
        "dropped": 0,
        "rejected": 0,
        "sent": {"metrics": 0, "logs": 0},
    }
    health = [
        None,
        {
            **base,
            "status": "ok",
            "last_success": 1795000000 - 120,
            "sent": {"metrics": 64, "logs": 1},
        },
        {
            **base,
            "status": "failing",
            "failures": 3,
            "last_error": "HTTP 401: ApiKey prefix not found (check the API key)",
            "next_attempt": 1795000000 + 240,
            "queued": {"metrics": 12, "logs": 2},
            "dropped": 40,
        },
        {**base, "status": "waiting"},
        {**base, "status": "off", "enabled": False},
    ]
    tmp = tmp_path_factory.mktemp("js")
    module = tmp / "data.mjs"
    shutil.copyfile(DATA_JS, module)
    res = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        input=json.dumps({"cat": cat, "views": views, "health": health}),
        capture_output=True,
        text=True,
        check=True,
        timeout=60,
    )
    return json.loads(res.stdout)


def test_summary_and_search(out):
    assert out["summary"].endswith("to now. Kept for 14 days.")
    assert out["summary"].startswith(("65 series", "6", "5"))
    assert out["unavailable"] == "No history."
    assert out["search"] == ["Lounge temperature", "Lounge valve temperature"]
    assert out["searchHouse"] == ["Burner"]
    assert out["searchNone"] == []


def test_temperature_across_rooms(out):
    v = out["views"][0]
    assert v["title"] == "Temperature, every room"
    assert v["meta"].startswith("Every 5 min, the last 24 hours. 8 series,")
    assert [s[0] for s in v["stats"]] == ["Latest", "Lowest", "Highest", "Average"]
    assert all(s[1].endswith("°") for s in v["stats"])
    assert v["ink"] == 1 and v["others"] == 7 and v["bands"] == 1
    assert all(t.endswith("°") for t in v["yticks"])
    assert v["point"].startswith(("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))
    assert "between" in v["point"] or v["point"].count("°") == 1
    assert v["table"]["total"] > 5 and len(v["table"]["rows"]) == 5
    assert "Use the arrow keys" in v["label"]


def test_states_and_levels(out):
    relay, state = out["views"][1], out["views"][2]
    assert relay["title"] == "Heating relay"
    assert relay["yticks"] == ["0%", "50%", "100%"]
    assert relay["stats"][1][0] == "On" and relay["stats"][1][2] == "of the time shown"
    assert relay["bands"] == 0
    assert state["yticks"] == ["idle", "lead", "firing", "rest"]
    assert state["table"]["rows"][0][2] in ("idle", "lead", "firing", "rest")
    assert state["table"]["rows"][0][3] == "–"  # no range at one minute


def test_values_and_words(out):
    assert out["values"] == ["−2.0°", "35%", "182 W", "On", "on 25% of the time", "firing", "–"]
    assert out["steps"] == ["1 min", "5 min", "1 h", "1 day"]
    assert out["ago"] == ["just now", "10 min ago", "2 h ago", "3 days ago"]


def test_export_words(out):
    none, ok, failing, waiting, off = out["export"]
    assert none["badge"] == "Not set up" and "export.otlp" in none["line"]
    assert ok["badge"] == "Sending" and ok["line"].endswith("2 min ago.")
    assert ("Sent", "64 data points, 1 log record") in [tuple(d) for d in ok["details"]]
    assert failing["kind"] == "attention"
    assert failing["line"].startswith("Can't send: HTTP 401")
    assert "Trying again in 4 min" in failing["line"]
    assert ["Dropped", "40 items: the queue was full, so the oldest went first", "warn"] in failing[
        "details"
    ]
    assert waiting["badge"] == "Waiting" and off["badge"] == "Off"
    for e in out["export"]:
        assert "—" not in e["line"] and "–" not in e["line"]
