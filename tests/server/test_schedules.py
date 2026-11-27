"""The week view: the API's week per room, and the web UI's pure helpers in web/week.js.

The helpers run under Node, in a subprocess like test_build_demo's probe, against this
API's own output. That test is skipped where Node is not installed.
"""

import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
import yaml
from aiohttp.test_utils import TestClient, TestServer

from radiate.config import parse_site
from radiate.drivers.live import LiveDriver
from radiate.server.app import create_app
from radiate.server.bridge import handle, run_sync
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.schedules import schedules_view
from radiate.sim.reference import house_config

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
TZ = ZoneInfo("Europe/London")
WED_0600 = datetime(2026, 11, 18, 6, 0, tzinfo=TZ).timestamp()
FRI_1800 = datetime(2026, 11, 20, 18, 0, tzinfo=TZ).timestamp()
H = {"Authorization": "Bearer secret"}


async def _publish(topic, payload):
    return True


def site_data(**household) -> dict:
    """The household example, with the lounge on a hand-written schedule."""
    data = yaml.safe_load(EXAMPLE.read_text())
    del data["household"]["rooms"]["lounge"]
    data["household"].update(household)
    data["schedules"] = {"lounge": "00:00/16 18:00/20"}
    next(r for r in data["rooms"] if r["id"] == "lounge")["schedule"] = "lounge"
    del data["shelly"]
    return data


def make(data: dict | None = None) -> Runtime:
    site = parse_site(data or site_data(), env=ENV)
    wall = lambda: WED_0600  # noqa: E731
    drv = LiveDriver(site, _publish, clock=lambda: 1000.0, wall=wall)
    return Runtime(site.house, drv, household=site.household, timezone=site.timezone, wall=wall)


def rooms(view: dict) -> dict[str, dict]:
    return {r["id"]: r for r in view["rooms"]}


def test_household_rooms_in_minutes_and_words():
    view = schedules_view(make())
    assert view["now"] == {"weekday": 2, "minute": 360}  # Wednesday 06:00
    assert view["levels"] == {"in_use": 19, "occasional": 16, "unused": 14, "night": 14}
    assert view["frost"] is False
    by_id = rooms(view)
    assert "stairs" not in by_id  # passive: no schedule
    bedroom = by_id["bedroom_1"]
    assert bedroom["source"] == "household" and bedroom["schedule"] is None
    assert [d["day"] for d in bedroom["days"]][:2] == ["monday", "tuesday"]
    assert bedroom["days"][0]["transitions"] == [
        {"minute": 0, "setpoint": 14},
        {"minute": 390, "setpoint": 19},
        {"minute": 510, "setpoint": 14},
        {"minute": 1320, "setpoint": 19},
        {"minute": 1350, "setpoint": 14},
    ]
    assert bedroom["days"][0]["text"] == "19° 06:30 to 08:30 and 22:00 to 22:30, otherwise 14°"
    assert bedroom["summary"] == [
        {"days": "Mon to Fri", "text": "19° 06:30 to 08:30 and 22:00 to 22:30, otherwise 14°"},
        {"days": "Sat and Sun", "text": "19° 08:30 to 09:00 and 22:00 to 22:30, otherwise 14°"},
    ]
    assert bedroom["people"] == [
        {"id": "early_riser", "name": "Early riser"},
        {"id": "home_worker", "name": "Home worker"},
    ]
    assert bedroom["notes"] == [] and bedroom["away"] is None
    assert by_id["bedroom_3"]["people"] == [{"id": "home_worker", "name": "Home worker"}]
    assert by_id["bedroom_2"]["people"] == []  # unused all week: depends on nobody


def test_hand_written_rooms_keep_their_schedule():
    lounge = rooms(schedules_view(make()))["lounge"]
    assert lounge["source"] == "hand_written" and lounge["schedule"] == "lounge"
    assert lounge["summary"] == [
        {"days": "Mon to Sun", "text": "20° 18:00 to 24:00, otherwise 16°"}
    ]
    assert lounge["people"] == [] and lounge["away"] is None


def test_someone_away_changes_the_week_and_says_why():
    rt = make()
    rt.set_away("home_worker", FRI_1800)
    by_id = rooms(schedules_view(rt))
    office = by_id["bedroom_3"]
    assert office["summary"] == [{"days": "Mon to Sun", "text": "14° all day"}]
    assert office["away"] == {
        "people": [{"id": "home_worker", "name": "Home worker"}],
        "text": "Bedroom 3 stays at 14° while Home worker is away.",
        "usual": [
            {"days": "Mon to Fri", "text": "19° 08:00 to 18:00, otherwise 14°"},
            {"days": "Sat and Sun", "text": "14° all day"},
        ],
    }
    bedroom = by_id["bedroom_1"]
    assert bedroom["days"][2]["text"] == "19° 06:30 to 07:00 and 22:00 to 22:30, otherwise 14°"
    assert bedroom["away"]["text"] == (
        "Bedroom 1 is warm for less of the week while Home worker is away."
    )
    assert by_id["bedroom_2"]["away"] is None  # unused: the same either way
    assert by_id["lounge"]["away"] is None  # hand-written: away never changes it

    rt.clear_away("home_worker")
    assert rooms(schedules_view(rt))["bedroom_3"]["away"] is None


def test_everyone_away_holds_frost():
    rt = make()
    rt.set_away("early_riser", FRI_1800)
    rt.set_away("home_worker", FRI_1800)
    view = schedules_view(rt)
    assert view["frost"] is True
    kitchen = rooms(view)["kitchen"]
    assert kitchen["away"]["text"] == (
        "Kitchen stays at 14° while Early riser and Home worker are away."
    )


def test_dropped_warm_periods_are_noted_per_room():
    data = site_data()
    early = data["household"]["people"]["early_riser"]["weekdays"]
    early["out"] = ["08:00-12:00", "13:30-17:00"]  # home for lunch
    by_id = rooms(schedules_view(make(data)))
    note = (
        "Weekdays: the valve's own schedule leaves out 19° 11:30 to 13:30 to fit its limit "
        "of 6 changes a day. Radiate still heats it while running."
    )
    assert by_id["kitchen"]["notes"] == [note]
    assert by_id["dining"]["notes"] == [note]
    assert by_id["bedroom_1"]["notes"] == []


def test_without_a_household_only_hand_written_rooms():
    data = site_data()
    del data["household"]
    data["schedules"]["default"] = "00:00/16 07:00/20 22:00/16"
    for room in data["rooms"]:
        room.setdefault("schedule", "default")
    view = schedules_view(make(data))
    assert view["levels"] is None and view["frost"] is False
    assert {r["source"] for r in view["rooms"]} == {"hand_written"}
    assert len(view["rooms"]) == 8
    assert rooms(view)["kitchen"]["schedule"] == "default"


def test_the_demo_shows_the_simulator_schedule():
    rt = Runtime(house_config(), DemoDriver(start_hour=5.5))
    run_sync(rt.step())
    view = handle(rt, "GET", "schedules")
    assert view["now"] == {"weekday": 0, "minute": 331}
    assert view["levels"] is None
    lounge = rooms(view)["lounge"]
    assert lounge["source"] == "hand_written"
    assert lounge["summary"] == [
        {"days": "Mon to Sun", "text": "21° 06:30 to 08:30 and 17:00 to 22:30, otherwise 16°"}
    ]
    assert len(view["rooms"]) == 8


@pytest.fixture
async def client():
    rt = make()
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt = rt
        yield c


async def test_route_needs_the_token_and_follows_away(client):
    assert (await client.get("/api/v1/schedules")).status == 401
    view = await (await client.get("/api/v1/schedules", headers=H)).json()
    assert rooms(view)["bedroom_3"]["away"] is None
    r = await client.post(
        "/api/v1/people/home_worker/away", json={"until": "2026-11-20T18:00"}, headers=H
    )
    assert r.status == 200
    view = await (await client.get("/api/v1/schedules", headers=H)).json()
    assert rooms(view)["bedroom_3"]["away"]["people"] == [
        {"id": "home_worker", "name": "Home worker"}
    ]


# --- web/week.js, under Node ------------------------------------------------------------
# The pure helpers the week view and the wizard share, run against this API's output.

WEEK_JS = Path(__file__).resolve().parents[2] / "web" / "src" / "week.js"
NODE = shutil.which("node")

SCRIPT = """
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const w = await import(process.argv[1]);
const view = JSON.parse(readFileSync(0, "utf8"));
const t = (pairs) => pairs.map(([minute, setpoint]) => ({ minute, setpoint }));

// Segments cover the day, merge equal neighbours and carry the last setpoint over
// midnight when the day does not start at 00:00.
const scale = { low: 14, high: 19 };
assert.deepEqual(w.daySegments(t([[0, 14], [360, 19], [510, 14], [1290, 19], [1350, 14]]), scale), [
  { start: 0, end: 360, setpoint: 14, warm: false, level: 0 },
  { start: 360, end: 510, setpoint: 19, warm: true, level: 1 },
  { start: 510, end: 1290, setpoint: 14, warm: false, level: 0 },
  { start: 1290, end: 1350, setpoint: 19, warm: true, level: 1 },
  { start: 1350, end: 1440, setpoint: 14, warm: false, level: 0 },
]);
assert.deepEqual(
  w.daySegments(t([[420, 19], [1320, 16]]), scale).map((s) => [s.start, s.end, s.setpoint]),
  [[0, 420, 16], [420, 1320, 19], [1320, 1440, 16]],
);
assert.deepEqual(w.daySegments(t([[0, 16], [600, 16]]), scale), [
  { start: 0, end: 1440, setpoint: 16, warm: true, level: 0.4 },
]);
assert.deepEqual(w.daySegments([], scale), []);
// Warm is relative to the room's own base; intensity to the house-wide scale.
assert.deepEqual(w.daySegments(t([[0, 16], [1080, 20]]), { low: 14, high: 20 }, 16).map((s) => s.warm), [false, true]);
// A flat scale draws every warm block at full strength.
assert.equal(w.daySegments(t([[0, 16], [60, 20]]), { low: 20, high: 20 }, 16)[1].level, 1);

// Labels never overlap.
const segs = w.daySegments(t([[0, 14], [360, 19], [420, 14], [450, 16], [480, 14], [1380, 19]]), scale);
// 130 minutes wide: the 16° label would start after its block ends, so it is left out,
// and the late 19° label moves left so it stays inside the bar.
assert.deepEqual(w.placeLabels(segs, 130), [
  { minute: 360, text: "19°" },
  { minute: 1310, text: "19°" },
]);
assert.deepEqual(w.placeLabels(segs, 20), [
  { minute: 360, text: "19°" },
  { minute: 450, text: "16°" },
  { minute: 1380, text: "19°" },
]);
// Near midnight a label moves left to stay inside the bar.
assert.deepEqual(w.placeLabels(w.daySegments(t([[0, 14], [1400, 19]]), scale), 60), [
  { minute: 1380, text: "19°" },
]);
assert.equal(w.fmtC(19), "19°");
assert.equal(w.fmtC(15.5), "15.5°");
assert.equal(w.clock(1290), "21:30");

// After midnight the weekday moves on until the schedules are fetched again.
assert.equal(w.weekdayAt({ weekday: 2, minute: 1430 }, 1435), 2);
assert.equal(w.weekdayAt({ weekday: 6, minute: 1430 }, 5), 0);

// The API's own output: scale, base, legend and the away line.
assert.deepEqual(w.weekScale(view.rooms, view.levels), { low: 14, high: 20 });
assert.deepEqual(w.weekScale([], null), { low: 0, high: 0 });
const byId = Object.fromEntries(view.rooms.map((r) => [r.id, r]));
assert.equal(w.roomBase(byId.lounge), 16);
assert.equal(w.roomBase(byId.bedroom_3), 14);
assert.deepEqual(w.legend(view.levels), [
  { label: "In use", setpoint: 19 },
  { label: "Occasional", setpoint: 16 },
  { label: "Unused and night", setpoint: 14 },
]);
assert.deepEqual(w.legend(null), []);
const office = byId.bedroom_3;
assert.equal(office.days.every((d) => w.daySegments(d.transitions, w.weekScale(view.rooms, view.levels), 14).every((s) => !s.warm)), true);
assert.equal(
  w.usualText(office.away.usual),
  "Usually Mon to Fri: 19° 08:00 to 18:00, otherwise 14°; Sat and Sun: 14° all day.",
);
console.log("ok");
"""


@pytest.mark.skipif(NODE is None, reason="Node is not installed")
def test_week_helpers_under_node(tmp_path):
    rt = make()
    rt.set_away("home_worker", FRI_1800)
    view = schedules_view(rt)
    # Without a package.json, Node loads .js as CommonJS; .mjs is always a module.
    module = tmp_path / "week.mjs"
    shutil.copyfile(WEEK_JS, module)
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        input=json.dumps(view),
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert out.returncode == 0, out.stderr
    assert out.stdout.strip() == "ok"
