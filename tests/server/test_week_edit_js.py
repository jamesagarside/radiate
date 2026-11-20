"""Adjusting a room's week in the web UI: the pure helpers in web/week.js, under Node.

Dragging an edge or the Adjust form turns into a room adjustment in the household
section. These tests run the helpers against the API's own output, then send the
section they make through the server's preview and save, so the browser and the
parser agree. The setup wizard (web/household.js) must keep adjustments it doesn't ask
about. Skipped where Node is not installed.
"""

import json
import shutil
import subprocess
from pathlib import Path

import pytest
from test_household_setup import by_id, make

from radiate.config.site import parse_household
from radiate.server.bridge import handle
from radiate.server.schedules import schedules_view

ROOT = Path(__file__).resolve().parents[2]
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="Node is not installed")


def run(script: str, data: dict, tmp_path: Path, name: str = "week") -> dict:
    module = tmp_path / f"{name}.mjs"
    shutil.copyfile(ROOT / "web" / f"{name}.js", module)
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", script, module.as_uri()],
        input=json.dumps(data),
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


HELPERS = """
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const w = await import(process.argv[1]);
const { view, household } = JSON.parse(readFileSync(0, "utf8"));

// Snapping to 15 minutes, inside an edge's bounds.
assert.equal(w.STEP_MIN, 15);
assert.equal(w.snap(1357), 1350);
assert.equal(w.snap(1358), 1365);
const periods = [{ start: 390, end: 510 }, { start: 1080, end: 1350 }];
assert.deepEqual(w.edgeBounds(periods, 0, "start"), { min: 0, max: 495 });
assert.deepEqual(w.edgeBounds(periods, 0, "end"), { min: 405, max: 1080 });
assert.deepEqual(w.edgeBounds(periods, 1, "start"), { min: 510, max: 1335 });
assert.deepEqual(w.edgeBounds(periods, 1, "end"), { min: 1095, max: 1440 });
assert.equal(w.placeEdge(1500, w.edgeBounds(periods, 1, "end")), 1440);
assert.equal(w.placeEdge(1000, w.edgeBounds(periods, 1, "end")), 1095);
assert.equal(w.placeEdge(1371, w.edgeBounds(periods, 1, "end")), 1365);

// Days: the run of identical days a change applies to, in words and as `days`.
const kitchen = view.rooms.find((r) => r.id === "kitchen");
assert.deepEqual(w.dayGroup(kitchen, 2), [0, 1, 2, 3, 4]);
assert.deepEqual(w.dayGroup(kitchen, 6), [5, 6]);
assert.equal(w.daysLabel([0, 1, 2, 3, 4]), "Mon to Fri");
assert.equal(w.daysLabel([5, 6]), "Sat and Sun");
assert.equal(w.daysLabel([0, 2, 4]), "Mon, Wed and Fri");
assert.equal(w.daysLabel([0, 1, 3]), "Mon, Tue and Thu");
assert.equal(w.daysLabel([0, 1, 2, 3, 4, 5, 6]), "Every day");
assert.equal(w.daysToken([0, 1, 2, 3, 4], view.weekend_days), "weekdays");
assert.equal(w.daysToken([6, 5], view.weekend_days), "weekend");
assert.equal(w.daysToken([0, 1, 2, 3, 4, 5, 6]), "daily");
assert.equal(w.daysToken([2]), "wed");
assert.deepEqual(w.daysToken([0, 2]), ["mon", "wed"]);
// A household whose weekend is Friday and Saturday.
assert.equal(w.daysToken([4, 5], ["friday", "saturday"]), "weekend");
assert.equal(w.daysToken([0, 1, 2, 3, 6], ["friday", "saturday"]), "weekdays");

// Which way an edge moved.
assert.equal(w.dragChange("end", 1350, 1350), null);
assert.deepEqual(w.dragChange("end", 1350, 1380), { keep: "warm", from: 1350, to: 1380 });
assert.deepEqual(w.dragChange("end", 1350, 1320), { keep: "cold", from: 1320, to: 1350 });
assert.deepEqual(w.dragChange("start", 1080, 1050), { keep: "warm", from: 1050, to: 1080 });
assert.deepEqual(w.dragChange("start", 1080, 1140), { keep: "cold", from: 1080, to: 1140 });

// Adding to a room's list: the same days are tidied, others are left alone.
const late = { days: "weekdays", keep: "warm", from: "22:30", to: "23:00" };
assert.deepEqual(w.addAdjustment([], late), [late]);
// Dragged further: one adjustment, not two.
assert.deepEqual(w.addAdjustment([late], { ...late, from: "23:00", to: "23:30" }), [
  { ...late, to: "23:30" },
]);
// Dragged back to where the routine had it: the adjustment goes.
assert.deepEqual(w.addAdjustment([late], { ...late, keep: "cold" }), []);
// Dragged back part of the way: what's left of it stays.
assert.deepEqual(w.addAdjustment([{ ...late, to: "23:30" }], { ...late, keep: "cold", from: "23:00", to: "23:30" }), [
  { ...late, to: "23:00" },
  { ...late, keep: "cold", from: "23:00", to: "23:30" },
]);
// A cold window in the middle of a warm one splits it.
assert.deepEqual(w.addAdjustment([{ ...late, from: "20:00", to: "23:00" }], { ...late, keep: "cold", from: "21:00", to: "21:30" }), [
  { ...late, from: "20:00", to: "21:00" },
  { ...late, from: "21:30", to: "23:00" },
  { ...late, keep: "cold", from: "21:00", to: "21:30" },
]);
const monday = { days: "mon", keep: "cold", from: "22:00", to: "23:00" };
assert.deepEqual(w.addAdjustment([monday], late), [monday, late]);
const listDays = { days: ["mon", "wed"], keep: "warm", from: "07:00", to: "07:30" };
assert.deepEqual(w.addAdjustment([listDays], { ...listDays, from: "07:30", to: "08:00" }), [
  { ...listDays, to: "08:00" },
]);

// The section with a room's list changed; an empty list leaves the key out.
const section = w.withAdjustments(household, "kitchen", (list) => w.addAdjustment(list, late));
assert.deepEqual(section.rooms.kitchen.adjust, [late]);
assert.equal(household.rooms.kitchen.adjust, undefined); // the original is untouched
assert.equal("adjust" in w.withAdjustments(section, "kitchen", () => []).rooms.kitchen, false);
assert.throws(() => w.withAdjustments(household, "stairs", (l) => l));

// Words.
assert.equal(w.edgeName("Bedroom 1", "Mon to Fri", "end", 1350), "Bedroom 1, Mon to Fri, warm until 22:30");
assert.equal(w.edgeName("Kitchen", "Sat and Sun", "start", 1080), "Kitchen, Sat and Sun, warm from 18:00");
assert.equal(w.changeText("Mon to Fri", "end", 1350, 1380), "Mon to Fri: warm until 23:00, not 22:30.");
assert.equal(w.routineText([{ days: "Mon to Fri", text: "19° 06:30 to 08:30" }]), "Without adjustments: Mon to Fri: 19° 06:30 to 08:30.");
assert.equal(
  w.sourceNote({ source: "house_file", saved_at: "/data/household.yaml" }),
  "Saving copies the household, with this change, to /data/household.yaml. Radiate uses that copy from then on. The house file isn't changed.",
);
assert.equal(w.sourceNote({ source: "saved", saved_at: "/data/household.yaml" }), "");
assert.equal(w.sourceNote({ source: "saved", saved_at: null }), "In the demo, changes last until you close the page.");
assert.deepEqual(w.ADJUST_DAYS.map(([v]) => v), ["daily", "weekdays", "weekend", "mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

// A drag on Wednesday's evening end, from 22:30 to 23:00, as the view would make it.
const wed = kitchen.days[2];
const bounds = w.edgeBounds(wed.periods, 1, "end");
const now = w.placeEdge(1376, bounds);
const c = w.dragChange("end", wed.periods[1].end, now);
const adj = { days: w.daysToken(w.dayGroup(kitchen, 2), view.weekend_days), keep: c.keep, from: w.clock(c.from), to: w.clock(c.to) };
const dragged = w.withAdjustments(household, "kitchen", (list) => w.addAdjustment(list, adj));
console.log(JSON.stringify({ dragged }));
"""


def test_week_edit_helpers_and_a_drag_the_server_accepts(tmp_path):
    rt = make(tmp_path)
    data = {
        "view": schedules_view(rt),
        "household": handle(rt, "GET", "household")["household"],
    }
    out = run(HELPERS, data, tmp_path)
    dragged = out["dragged"]
    assert dragged["rooms"]["kitchen"]["adjust"] == [
        {"days": "weekdays", "keep": "warm", "from": "22:30", "to": "23:00"}
    ]
    preview = handle(rt, "POST", "household/preview", {"household": dragged})
    assert preview["errors"] == []
    kitchen = by_id(preview)["kitchen"]
    assert kitchen["summary"][0]["text"] == "19° 06:30 to 08:30 and 18:00 to 23:00, otherwise 14°"
    handle(rt, "PUT", "household", {"household": dragged})
    assert by_id(schedules_view(rt))["kitchen"]["days"][4]["adjusted"] == [
        {"start": 1350, "end": 1380, "keep": "warm"}
    ]


ROUND_TRIP = """
const w = await import(process.argv[1]);
const view = JSON.parse(await new Promise((r) => { let s = ""; process.stdin.on("data", (d) => (s += d)); process.stdin.on("end", () => r(s)); }));
const draft = w.draftFrom(view);
draft.people[0].weekdays.bed = "23:00"; // a change in the wizard
console.log(JSON.stringify({ draft, section: w.toSection(draft) }));
"""


def test_the_setup_wizard_keeps_adjustments(tmp_path):
    rt = make(tmp_path)
    section = handle(rt, "GET", "household")["household"]
    late = {"days": ["mon", "tue"], "keep": "warm", "from": "22:30", "to": "23:00"}
    section["rooms"]["kitchen"]["adjust"] = [late]
    handle(rt, "PUT", "household", {"household": section})
    out = run(ROUND_TRIP, handle(rt, "GET", "household"), tmp_path, name="household")
    kitchen = next(r for r in out["draft"]["rooms"] if r["id"] == "kitchen")
    assert kitchen["adjust"] == [late]
    assert out["section"]["rooms"]["kitchen"]["adjust"] == [late]
    assert "adjust" not in out["section"]["rooms"]["dining"]
    household = parse_household(out["section"], rt.setup.site)
    assert next(r for r in household.rooms if r.room_id == "kitchen").adjust[0].days == (
        "mon",
        "tue",
    )
