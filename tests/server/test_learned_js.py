"""The words of "What Radiate has learned" on a room card (web/learned.js) under Node,
fed the demo's own state and hand-made rooms at the edges: nothing learned, still
learning, a valve-only room, a dry-run model, a reset. Skipped where Node is not
installed."""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

from radiate.server.bridge import DemoSession

ROOT = Path(__file__).resolve().parents[2]
LEARNED_JS = ROOT / "web" / "learned.js"
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="Node is not installed")

SCRIPT = """
const m = await import(process.argv[1]);
let input = "";
for await (const chunk of process.stdin) input += chunk;
const cases = JSON.parse(input);
console.log(JSON.stringify(cases.map(([r, ctx]) => ({
  rows: Object.fromEntries(m.learnedRows(r, ctx).map((x) => [x.key, [x.label, x.text]])),
  still: m.stillLearning(r.model),
  raw: m.rawText(r.model),
}))));
"""


def run(cases: list, tmp_path: Path) -> list[dict]:
    module = tmp_path / "learned.mjs"
    shutil.copyfile(LEARNED_JS, module)
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        input=json.dumps(cases),
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


def lounge(**model) -> dict:
    m = {
        "a": 3.15,
        "b": 0.02,
        "d": 0.0,
        "confidence": 0.86,
        "loss_confidence": 0.3,
        "samples": 5040,
        "arrival_lag_min": 11.0,
        "lockshield": 45,
        "lockshield_learned": True,
        "lag_measured": 2,
        "relearns": 0,
        "heating_kph": {"alone": 2.6, "with_house": 1.56},
        "warm_up": {"from_c": 17.5, "to_c": 21.0, "in_min": 300, "min": 150},
        "learned": {"since": "2026-11-02", "updates": {"live_burner": 5040}},
    }
    m.update(model)
    return {
        "id": "lounge",
        "name": "Lounge",
        "role": "normal",
        "heat_source": None,
        "temperature": 17.5,
        "model": m,
    }


CTX = {"outdoor": 7.5, "minute_of_day": 120, "notes": [], "year": 2026}


def test_a_learned_room_in_words(tmp_path):
    [out] = run([[lounge(), CTX]], tmp_path)
    rows = out["rows"]
    assert rows["warms"] == [
        "Warms up",
        "With the boiler on and the valve open, about 1.6° an hour while most of the house "
        "is heating, or 2.6° an hour when it's the only room taking heat. Now, with 7.5° "
        "outside, it would gain about 1.4° an hour after the heat it loses.",
    ]
    assert rows["cools"][1] == (
        "With the heating off, it cools by about 0.2° an hour when it's 10° colder outside "
        "than in. Now, at 17.5° inside and 7.5° outside, that's about 0.2° an hour."
    )
    assert rows["lag"][1] == "About 11 min after the boiler fires, timed over its last 2 warm-ups."
    assert rows["sure"][1] == (
        "Radiate is sure of how fast this room warms, and still learning how fast it cools. "
        "From 5,040 readings since 2 Nov, about 84 hours of learning."
    )
    uses = rows["uses"][1]
    assert "To get from 17.5° to 21.0° by 07:00, it allows about 2 h 30 min, so it starts " in uses
    assert "warming at about 04:30." in uses
    assert "opening limit rests at 45%" in uses
    assert "steady" not in rows and "relearned" not in rows
    assert out["still"] is False
    assert out["raw"].startswith("In the model's own terms: heating gain 3.15 K/h")


def test_still_learning_and_edges(tmp_path):
    fresh = lounge(
        samples=0,
        confidence=0.0,
        loss_confidence=0.0,
        lag_measured=0,
        arrival_lag_min=8.0,
        lockshield=60,
        lockshield_learned=False,
        warm_up=None,
        learned={"since": None, "updates": {}},
    )
    valve_only = lounge(confidence=0.5, loss_confidence=0.5, samples=90)
    valve_only["role"] = "internal_sensor_only"
    valve_only["temperature"] = None
    dry = lounge(learned={"since": "2025-12-01", "updates": {"dry_relay": 40, "dry_burner": 2}})
    dry["model"]["warm_up"]["min"] = 400
    reset = lounge(relearns=2, warm_up={"from_c": 17.5, "to_c": 21.0, "in_min": 60, "min": None})
    reset["heat_source"] = "continuous"
    reset["model"]["d"] = 0.48
    notes = [
        {
            "at": 1764000000,
            "code": "learning.reset",
            "message": "Lounge: reset.",
            "room_id": "lounge",
        }
    ]
    out = run(
        [
            [fresh, CTX],
            [valve_only, {**CTX, "outdoor": None}],
            [dry, CTX],
            [reset, {**CTX, "notes": notes}],
        ],
        tmp_path,
    )
    f = out[0]["rows"]
    assert out[0]["still"] is True
    assert f["sure"][1].startswith("Nothing learned yet.")
    assert (
        f["lag"][1]
        == "Not timed yet, so Radiate allows 8 min for the hot water to reach the radiator."
    )
    assert "rests at 60% until Radiate has seen enough burns" in f["uses"][1]
    assert "To get from" not in f["uses"][1]

    v = out[1]["rows"]
    assert out[1]["still"] is False
    assert "Now," not in v["warms"][1] and "Now," not in v["cools"][1]
    assert v["sure"][1].startswith("Radiate is fairly sure of how fast this room warms and cools.")
    assert "measured only by its valve" in v["sure"][1]
    assert "From 90 readings since 2 Nov." in v["sure"][1]

    d = out[2]["rows"]
    assert "since 1 Dec 2025" in d["sure"][1]
    assert d["sure"][1].endswith(
        "learned in dry run, while Radiate watched the heating without running it."
    )
    assert "needs about 6 h 40 min, longer than it looks ahead" in d["uses"][1]

    r = out[3]["rows"]
    assert r["steady"][1].startswith("The range cooker adds about 0.5° an hour")
    assert r["relearned"][1].startswith("Radiate relearned this room twice,")
    assert "can't tell yet how long this room takes to reach 21.0° by 03:00" in r["uses"][1]
    assert r["note-1764000000"][0] == "Started again"
    assert r["note-1764000000"][1].endswith("Lounge: reset.")


def test_quiet_hours_hold_the_warm_up(tmp_path):
    # 05:00 now, 21° due at 07:00 with 2 h 30 min needed, quiet hours until 06:00.
    ctx = {**CTX, "minute_of_day": 300}
    held = lounge(
        warm_up={"from_c": 17.5, "to_c": 21.0, "in_min": 120, "min": 150, "quiet_until_min": 360}
    )
    # Quiet until 05:30, start due at 05:45 anyway: quiet hours don't change it.
    clear = lounge(
        warm_up={"from_c": 17.5, "to_c": 21.0, "in_min": 120, "min": 75, "quiet_until_min": 330}
    )
    slow = lounge(
        warm_up={"from_c": 17.5, "to_c": 21.0, "in_min": 120, "min": 400, "quiet_until_min": 360}
    )
    out = run([[held, ctx], [clear, ctx], [slow, ctx]], tmp_path)
    assert (
        "To get from 17.5° to 21.0° by 07:00, it allows about 2 h 30 min, so it would start "
        "now. Quiet hours hold it until 06:00, so it starts then, and may get there after "
        "07:00." in out[0]["rows"]["uses"][1]
    )
    uses = out[1]["rows"]["uses"][1]
    assert "so it starts warming at about 05:45." in uses and "Quiet" not in uses
    assert "so it starts as soon as quiet hours end at 06:00." in out[2]["rows"]["uses"][1]


def test_words_for_every_demo_room(tmp_path):
    s = DemoSession()
    s.step(400)
    state = json.loads(s.request("GET", "state"))["body"]
    ctx = {"outdoor": state["outdoor"], "minute_of_day": state["minute_of_day"], "notes": []}
    rooms = [r for r in state["rooms"] if r.get("model")]
    assert rooms
    for out in run([[r, ctx] for r in rooms], tmp_path):
        rows = out["rows"]
        assert {"warms", "cools", "lag", "sure", "uses"} <= rows.keys()
        for _, text in rows.values():
            assert "undefined" not in text and "NaN" not in text and "null" not in text
            assert "—" not in text and "–" not in text
