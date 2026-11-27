"""GET /api/v1/ha/dashboard: the Home Assistant dashboard from the running house, and
the words the Settings view shows with it (web/src/homeassistant.js, under Node)."""

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml
from aiohttp.test_utils import TestClient, TestServer

from radiate.export.dashboard import build_dashboard
from radiate.server import bridge
from radiate.server.app import create_app
from radiate.server.demo import DemoDriver, demo_runtime
from radiate.server.ha import INTEGRATION_QUIET_S
from radiate.server.runtime import Runtime
from radiate.sim.reference import house_config

ROOT = Path(__file__).resolve().parents[2]
HA_JS = ROOT / "web" / "src" / "homeassistant.js"
NODE = shutil.which("node")
H = {"Authorization": "Bearer secret"}
PERSONS = {"persons": [{"entity_id": "person.sam", "name": "Sam"}]}


@pytest.fixture
async def client():
    rt = demo_runtime()
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt = rt
        yield c


async def test_dashboard_is_the_house_files_as_yaml(client):
    r = await client.get("/api/v1/ha/dashboard", headers=H)
    assert r.status == 200
    view = await r.json()
    site = client.rt.setup.site
    assert yaml.safe_load(view["yaml"]) == build_dashboard(site)
    assert view["title"] == "Heating" and view["hours"] == 24 and view["radiate"] is True
    assert view["rooms"] == len(site.house.rooms)
    assert view["integration"] == {"reported_at": None, "reporting": False}


async def test_query_sets_window_title_and_integration(client):
    q = {"hours": "72", "radiate": "false", "title": "  Radiators  "}
    view = await (await client.get("/api/v1/ha/dashboard", headers=H, params=q)).json()
    data = yaml.safe_load(view["yaml"])
    assert data["title"] == "Radiators" and view["hours"] == 72
    assert "radiate." not in view["yaml"]
    assert view["people"] == 0


@pytest.mark.parametrize(
    "query",
    [
        {"hours": "0"},
        {"hours": "337"},
        {"hours": "a day"},
        {"radiate": "maybe"},
        {"title": "x" * 61},
    ],
)
async def test_bad_queries_are_400(client, query):
    r = await client.get("/api/v1/ha/dashboard", headers=H, params=query)
    assert r.status == 400


async def test_needs_a_token(client):
    assert (await client.get("/api/v1/ha/dashboard")).status == 401


async def test_without_a_house_configuration_it_is_404():
    rt = Runtime(house_config(), DemoDriver())
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        assert (await c.get("/api/v1/ha/dashboard", headers=H)).status == 404


async def test_integration_counts_as_reporting_until_two_reports_are_missed(client):
    rt = client.rt
    now = [1_795_000_000.0]
    rt.wall = lambda: now[0]
    assert (await client.post("/api/v1/ha/persons", headers=H, json=PERSONS)).status == 200
    view = await (await client.get("/api/v1/ha/dashboard", headers=H)).json()
    assert view["integration"]["reporting"] is True
    assert view["integration"]["reported_at"]
    now[0] += INTEGRATION_QUIET_S + 1
    view = await (await client.get("/api/v1/ha/dashboard", headers=H)).json()
    assert view["integration"]["reporting"] is False


def test_the_browser_demo_answers_the_same():
    rt = demo_runtime()
    view = bridge.handle(rt, "GET", "ha/dashboard?hours=48")
    assert view["hours"] == 48
    assert yaml.safe_load(view["yaml"]) == build_dashboard(rt.setup.site, hours=48)
    with pytest.raises(bridge.RequestError) as err:
        bridge.handle(rt, "GET", "ha/dashboard?hours=0")
    assert err.value.status == 400


# The Settings view's words ------------------------------------------------------------

SCRIPT = """
const m = await import(process.argv[1]);
let input = "";
for await (const chunk of process.stdin) input += chunk;
const views = JSON.parse(input);
console.log(JSON.stringify({
  integration: views.map((v) => m.integrationText(v.integration, "UTC")),
  summary: views.map(m.summaryText),
}));
"""
DASHES = re.compile("[–—]")


@pytest.mark.skipif(NODE is None, reason="Node is not installed")
def test_settings_words(tmp_path):
    module = tmp_path / "homeassistant.mjs"
    shutil.copyfile(HA_JS, module)
    base = {"yaml": "a: 1\nb: 2\n", "rooms": 9, "people": 0, "radiate": True}
    views = [
        {**base, "integration": {"reported_at": None, "reporting": False}},
        {
            **base,
            "people": 1,
            "integration": {"reported_at": "2026-11-27T14:05:00+00:00", "reporting": True},
        },
        {
            **base,
            "rooms": 1,
            "integration": {"reported_at": "2026-11-27T09:00:00+00:00", "reporting": False},
        },
        {**base, "radiate": False, "integration": None},
    ]
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        input=json.dumps(views),
        capture_output=True,
        text=True,
        check=True,
    )
    words = json.loads(out.stdout)
    (never, never_v), (ok, ok_v), (quiet, quiet_v), _ = words["integration"]
    assert never.startswith("The Radiate integration hasn't reported") and never_v == "warning"
    assert ok == "The Radiate integration is connected. It last reported at 27 Nov, 14:05."
    assert ok_v == "success"
    assert "may have stopped" in quiet and quiet_v == "warning"
    assert words["summary"][0].startswith("Three views (Overview, Rooms and Analysis) for 9 rooms,")
    assert "9 rooms, 1 person," in words["summary"][1]
    assert "for 1 room," in words["summary"][2]
    assert "Zigbee2MQTT's entities only" in words["summary"][3]
    assert not DASHES.search(json.dumps(words))
