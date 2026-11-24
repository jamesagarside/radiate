"""The Settings view's words (web/settings.js) under Node, fed the demo's own
`GET settings/config`. Skipped where Node is not installed."""

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

from radiate.server.bridge import DemoSession

ROOT = Path(__file__).resolve().parents[2]
SETTINGS_JS = ROOT / "web" / "settings.js"
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="Node is not installed")

SCRIPT = """
const m = await import(process.argv[1]);
let input = "";
for await (const chunk of process.stdin) input += chunk;
const view = JSON.parse(input);
const fields = view.sections.flatMap((s) => [...(s.fields ?? []), ...(s.rooms ?? []).flatMap((r) => r.fields)]);
const by = Object.fromEntries(fields.map((f) => [f.path, f]));
console.log(JSON.stringify({
  help: Object.fromEntries(fields.map((f) => [f.path, m.helpText(f)])),
  source: Object.fromEntries(fields.map((f) => [f.path, m.sourceText(f)])),
  revert: Object.fromEntries(fields.map((f) => [f.path, m.revertText(f)])),
  restart: m.restartText(view, (p) => by[p].label),
  values: {
    windows: m.valueText(by["store.windows"], by["store.windows"].value),
    frost: m.valueText(by["boiler.frost_c"], 7),
    pct: m.valueText(by["monitoring.low_battery_pct"], 20),
    use: m.valueText(by["rooms.lounge.use"], {weekdays: "in_use", weekend: "unused"}),
    role: m.valueText(by["rooms.toilet.role"], "internal_sensor_only"),
    none: m.valueText(by["boiler.nozzle_lph"], null),
  },
  parsed: {
    num: m.parseInput(by["boiler.frost_c"], " 7,5 "),
    empty: m.parseInput(by["boiler.nozzle_lph"], ""),
    list: m.parseInput(by["store.windows"], "06:00-07:00, 17:00-18:00"),
    secret: m.parseInput(by["mqtt.password"], ""),
  },
  saved: [m.savedText(["a"], []), m.savedText([], ["b"]), m.savedText(["a"], ["b"])],
}));
"""

DASHES = re.compile("[–—]")


def run(view: dict, tmp_path: Path) -> dict:
    module = tmp_path / "settings.mjs"
    shutil.copyfile(SETTINGS_JS, module)
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        input=json.dumps(view),
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


def test_words_for_the_demo(tmp_path):
    s = DemoSession()
    s.request(
        "PUT",
        "settings/config",
        json.dumps({"values": {"boiler.frost_c": 8, "rooms.lounge.name": "Front room"}}),
    )
    view = json.loads(s.request("GET", "settings/config"))["body"]
    out = run(view, tmp_path)
    assert out["help"]["boiler.min_burn_min"] == (
        "Once lit, the burner runs at least this long. 4 to 20 min. Default 8 min."
    )
    assert out["help"]["house.dry_run"].endswith("Default On. Used after a restart.")
    assert out["source"]["boiler.frost_c"] == "Set here"
    assert out["source"]["boiler.nozzle_lph"] == "House file"
    assert out["source"]["boiler.min_off_min"] == "Default"
    assert out["source"]["mqtt.password"] == "Not set"
    assert out["revert"]["boiler.frost_c"] == "Use the default, 7°"
    assert out["revert"]["rooms.lounge.name"] == "Use the house file's, Lounge"
    assert out["restart"] == "Restart Radiate to use 1 changed setting: Name."
    assert out["values"] == {
        "windows": "06:00-07:30, 17:00-21:00",
        "frost": "7°",
        "pct": "20%",
        "use": "Weekdays in use, weekend unused",
        "role": "Valve's own sensor",
        "none": "–",
    }
    assert out["parsed"] == {
        "num": 7.5,
        "empty": None,
        "list": ["06:00-07:00", "17:00-18:00"],
    }  # a secret left empty is undefined: unchanged, so it drops out of JSON
    assert out["saved"] == [
        "Saved. In use now.",
        "Saved. Restart Radiate to use it.",
        "Saved. Some changes are in use now; restart Radiate for the rest.",
    ]
    for text in [*out["help"].values(), *out["source"].values(), *out["revert"].values()]:
        assert not DASHES.search(text)
