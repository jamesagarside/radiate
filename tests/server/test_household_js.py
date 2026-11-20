"""The setup wizard's pure logic in web/household.js, under Node.

The wizard keeps its answers in a draft and sends the house file's `household`
section. These tests run the helpers against the API's own `GET household` and check
the section they make with the server's parser: a household read into a draft and
written out again is the same household. Skipped where Node is not installed.
"""

import json
import shutil
import subprocess
from dataclasses import replace
from pathlib import Path

import pytest
import yaml

from radiate.config import parse_site
from radiate.config.site import parse_household
from radiate.drivers.live import LiveDriver
from radiate.server.runtime import Runtime
from radiate.server.setup import HouseholdSetup

ROOT = Path(__file__).resolve().parents[2]
HOUSEHOLD_JS = ROOT / "web" / "household.js"
EXAMPLE = ROOT / "examples" / "household.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="Node is not installed")


async def _publish(topic, payload):
    return True


def house_data(with_household: bool = True) -> dict:
    data = yaml.safe_load(EXAMPLE.read_text())
    del data["household"]["rooms"]["lounge"]
    data["schedules"] = {"lounge": "00:00/16 18:00/20"}
    next(r for r in data["rooms"] if r["id"] == "lounge")["schedule"] = "lounge"
    if not with_household:
        del data["household"]
        data["schedules"]["default"] = "00:00/15 07:00/19 22:00/15"
    return data


def setup_for(data: dict) -> tuple[HouseholdSetup, Runtime]:
    site = parse_site(data, env=ENV)
    rt = Runtime(site.house, LiveDriver(site, _publish), household=site.household)
    rt.setup = HouseholdSetup(site)
    return rt.setup, rt


def same(a, b) -> bool:
    by_id = lambda hh: sorted(hh.rooms, key=lambda r: r.room_id)  # noqa: E731
    return replace(a, rooms=tuple(by_id(a))) == replace(b, rooms=tuple(by_id(b)))


def run(script: str, view: dict, tmp_path: Path) -> dict:
    module = tmp_path / "household.mjs"
    shutil.copyfile(HOUSEHOLD_JS, module)
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", script, module.as_uri()],
        input=json.dumps(view),
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
const view = JSON.parse(readFileSync(0, "utf8"));

// Times as people type them.
assert.equal(w.normaliseTime("7:30"), "07:30");
assert.equal(w.normaliseTime("0730"), "07:30");
assert.equal(w.normaliseTime("730"), "07:30");
assert.equal(w.normaliseTime("7"), "07:00");
assert.equal(w.normaliseTime(" 07.30 "), "07:30");
assert.equal(w.normaliseTime("24:00"), null);
assert.equal(w.normaliseTime("24:00", { end: true }), "24:00");
assert.equal(w.normaliseTime("24:30", { end: true }), null);
assert.equal(w.normaliseTime("12:60"), null);
assert.equal(w.normaliseTime("7am"), null);
assert.equal(w.normaliseTime(""), null);

// Person ids from names: valid, unique, and stable for any script.
assert.equal(w.personId("Sam", []), "sam");
assert.equal(w.personId("Sam", ["sam"]), "sam_1");
assert.equal(w.personId("Zoë O'Neill", []), "zoe_o_neill");
assert.equal(w.personId("小明", []), "person_1");
assert.equal(w.personId("", ["person_1"]), "person_2");

// Error paths land on the answer they are about.
const paths = ["household.people.sam.weekdays", "household.people.sam.weekdays.up",
  "household.people.sam.weekdays.out[0]", "household.rooms.kitchen"];
assert.equal(w.errorTarget(paths, "household.people.sam.weekdays.up"), "household.people.sam.weekdays.up");
assert.equal(w.errorTarget(paths, "household.people.sam.weekdays.out[0]"), "household.people.sam.weekdays.out[0]");
assert.equal(w.errorTarget(paths, "household.people.sam.weekdays.out"), "household.people.sam.weekdays");
assert.equal(w.errorTarget(paths, "household.rooms.kitchen.people"), "household.rooms.kitchen");
assert.equal(w.errorTarget(paths, "household.rooms.kitchenette"), null);
assert.deepEqual(w.periodPaths("b", [{ type: "out" }, { type: "work" }, { type: "out" }]), ["b.out[0]", "b.work[0]", "b.out[1]"]);

// Words.
assert.equal(w.minutesText(30), "30 min");
assert.equal(w.minutesText(90), "1 h 30 min");
assert.equal(w.minutesText(180), "3 h");
assert.equal(w.minutesText(0, 0), "off");
assert.equal(w.daysText(["sunday", "saturday"]), "Saturday and Sunday");
assert.equal(w.daysText([]), "no days");
assert.equal(w.dampNote(11.5, 12), "Below 12° walls and window frames can get damp, especially in older houses.");
assert.equal(w.dampNote(12, 12), "");
assert.equal(w.droppedText([{ notes: [] }]), "");
assert.match(w.droppedText([{ notes: ["a"] }, { notes: ["b"] }]), /^2 warm periods are left out/);
assert.equal(w.kindText("office"), "Warm while its people work from home.");

// The draft from the API, and the section back.
const draft = w.draftFrom(view);
const out = { section: w.toSection(draft) };

// Steps for errors.
assert.deepEqual(w.stepFor(draft, "household.people"), { step: 0, person: 0 });
assert.deepEqual(w.stepFor(draft, "household.people.home_worker.weekend.bed"), { step: 1, person: 1 });
assert.deepEqual(w.stepFor(draft, "household.away.presence_delay_min"), { step: 0, person: 0 });
assert.deepEqual(w.stepFor(draft, "household.rooms.toilet.use"), { step: 2, person: 0 });
assert.deepEqual(w.stepFor(draft, "household.timing.preheat_min"), { step: 3, person: 0 });
assert.deepEqual(w.stepFor(draft, "household.weekend_days[0]"), { step: 3, person: 0 });

// Times not typed as times are caught before asking the server.
const typo = structuredClone(draft);
typo.people[0].weekdays.up = "25:00";
typo.people[0].weekdays.periods[0].to = "";
assert.deepEqual(w.timeErrors(typo).map((e) => e.path), [
  "household.people.early_riser.weekdays.up", "household.people.early_riser.weekdays.out[0]",
]);
assert.deepEqual(w.timeErrors(draft), []);

// Offices, adding and removing people.
const edit = structuredClone(draft);
assert.equal(w.officeOf(edit, "home_worker"), "bedroom_3");
assert.equal(w.worksFromHome(edit.people[1]), true);
w.setOffice(edit, "home_worker", "dining");
assert.equal(w.officeOf(edit, "home_worker"), "dining");
const b3 = edit.rooms.find((r) => r.id === "bedroom_3");
assert.equal(b3.kind, "shared");
assert.equal(b3.people, null);
const id = w.addPerson(edit, "Guest");
assert.equal(id, "guest");
w.setOffice(edit, "guest", "dining");
assert.deepEqual(edit.rooms.find((r) => r.id === "dining").people, ["home_worker", "guest"]);
w.removePerson(edit, "home_worker");
w.removePerson(edit, "guest");
const dining = edit.rooms.find((r) => r.id === "dining");
assert.equal(dining.kind, "shared");
assert.equal(dining.people, null);
assert.deepEqual(edit.rooms.find((r) => r.id === "bedroom_1").people, ["early_riser"]);
out.edited = w.toSection(edit);

// Typed times are tidied in the section.
const tidy = structuredClone(draft);
tidy.people[0].weekdays.up = "630";
tidy.people[0].weekdays.periods[0] = { type: "out", from: "7:30", to: "1800" };
out.tidied = w.toSection(tidy).people.early_riser.weekdays;
out.draft = draft;
console.log(JSON.stringify(out));
"""


def test_a_household_survives_the_round_trip_through_the_draft(tmp_path):
    setup, _ = setup_for(house_data())
    out = run(HELPERS, setup.view(), tmp_path)
    # Read into a draft and written out again: the same household. Rooms come in the
    # house file's order, which means nothing.
    assert same(parse_household(out["section"], setup.site), setup.site.household)
    draft = out["draft"]
    lounge = next(r for r in draft["rooms"] if r["id"] == "lounge")
    assert lounge["own"] is True  # left on its own schedule, as in the house file
    toilet = next(r for r in draft["rooms"] if r["id"] == "toilet")
    assert (toilet["use"], toilet["weekendUse"], toilet["weekendDifferent"]) == (
        "unused",
        "occasional",
        True,
    )
    worker = draft["people"][1]
    assert worker["weekdays"]["periods"] == [{"type": "work", "from": "08:00", "to": "18:00"}]
    assert draft["weekend_days"] == ["saturday", "sunday"]
    # The edited draft is valid too: nobody left in a room means everyone.
    edited = parse_household(out["edited"], setup.site)
    assert [p.id for p in edited.people] == ["early_riser"]
    assert out["tidied"] == {"up": "06:30", "out": ["07:30-18:00"], "bed": "22:30"}


NEW = """
const w = await import(process.argv[1]);
const view = JSON.parse(await new Promise((r) => { let s = ""; process.stdin.on("data", (d) => (s += d)); process.stdin.on("end", () => r(s)); }));
const draft = w.draftFrom(view);
console.log(JSON.stringify({ draft, section: w.toSection(draft) }));
"""


def test_a_new_household_can_be_saved_as_it_comes(tmp_path):
    """Defaults alone make a valid household: click straight through and save."""
    setup, rt = setup_for(house_data(with_household=False))
    view = setup.view()
    assert view["household"] is None
    out = run(NEW, view, tmp_path)
    draft = out["draft"]
    assert [p["name"] for p in draft["people"]] == ["Person 1"]
    kinds = {r["id"]: r["kind"] for r in draft["rooms"]}
    assert kinds["bedroom_1"] == "bedroom" and kinds["kitchen"] == "shared"
    assert all(not r["own"] for r in draft["rooms"])
    preview = setup.preview(rt, {"household": out["section"]})
    assert preview["errors"] == [] and len(preview["rooms"]) == 8
    household = parse_household(out["section"], setup.site)
    bedroom = next(r for r in household.rooms if r.room_id == "bedroom_1")
    assert bedroom.people == ("person_1",)


LINKS = """
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const w = await import(process.argv[1]);
const view = JSON.parse(readFileSync(0, "utf8"));
const persons = [
  { entity_id: "person.alex", name: "Alex" },
  { entity_id: "person.early", name: " early RISER " },
  { entity_id: "person.jo_1", name: "Jo" },
  { entity_id: "person.jo_2", name: "Jo" },
];

// Names match ignoring case and spaces, once, and never twice over.
assert.equal(w.matchPerson("Early riser", persons), "person.early");
assert.equal(w.matchPerson("Early riser", persons, ["person.early"]), null);
assert.equal(w.matchPerson("Jo", persons), null); // two people called Jo: no guess
assert.equal(w.matchPerson("", persons), null);
assert.equal(w.matchPerson("Alex", null), null);
assert.equal(w.haPersons(view), null);

// The choices: Not linked, then by name, entity IDs where a name repeats, and a link
// Home Assistant no longer lists is kept.
assert.deepEqual(w.personOptions(persons, null), [
  ["", "Not linked"], ["person.alex", "Alex"], ["person.early", " early RISER "],
  ["person.jo_1", "Jo (person.jo_1)"], ["person.jo_2", "Jo (person.jo_2)"],
]);
assert.deepEqual(w.personOptions([], "person.gone").at(-1),
  ["person.gone", "person.gone, not in Home Assistant now"]);
assert.equal(w.linkHelp(60),
  "Linked people count as away once Home Assistant has said they're out for 1 h.");
assert.equal(w.linkHelp(0),
  "Linked people count as away as soon as Home Assistant says they're out.");

const out = {};
// Without a report nothing is guessed.
out.plain = w.draftFrom(view).people.map((p) => p.ha_person);
// With one, a name that matches is linked.
const reported = { ...view, ha_persons: { persons, reported_at: "2026-11-18T06:00+00:00" } };
const draft = w.draftFrom(reported);
out.prefilled = draft.people.map((p) => p.ha_person);
out.section = w.toSection(draft);
assert.deepEqual(w.stepFor(draft, "household.people.home_worker.ha_person"), { step: 0, person: 1 });
// Once anyone is linked, "Not linked" may be a choice: no more guessing.
const linked = structuredClone(view);
linked.household.people.home_worker.ha_person = "person.alex";
out.kept = w.draftFrom({ ...linked, ha_persons: { persons } }).people.map((p) => p.ha_person);
// A typed link is trimmed; an empty one is left out.
const typed = w.draftFrom(view);
typed.people[0].ha_person = " person.sam ";
typed.people[1].ha_person = "";
out.typed = w.toSection(typed).people;
assert.equal(w.addPerson(typed, "Guest"), "guest");
assert.equal(typed.people.at(-1).ha_person, null);
console.log(JSON.stringify(out));
"""


def test_people_link_to_home_assistant_persons(tmp_path):
    setup, rt = setup_for(house_data())
    out = run(LINKS, setup.view(rt), tmp_path)
    assert out["plain"] == [None, None]
    assert out["prefilled"] == ["person.early", None]
    assert out["kept"] == [None, "person.alex"]
    hh = parse_household(out["section"], setup.site)
    assert [p.ha_person for p in hh.people] == ["person.early", None]
    assert out["typed"]["early_riser"]["ha_person"] == "person.sam"
    assert "ha_person" not in out["typed"]["home_worker"]
    typed = parse_household({**out["section"], "people": out["typed"]}, setup.site)
    assert typed.people[0].ha_person == "person.sam"
