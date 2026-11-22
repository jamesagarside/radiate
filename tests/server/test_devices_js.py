"""The devices view's words (web/devices.js) under Node, fed the demo's own
`GET devices`. Skipped where Node is not installed."""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

from radiate.server.bridge import DemoSession

ROOT = Path(__file__).resolve().parents[2]
DEVICES_JS = ROOT / "web" / "devices.js"
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="Node is not installed")

SCRIPT = """
const { ago, readingText, problemText } = await import(process.argv[1]);
let input = "";
for await (const chunk of process.stdin) input += chunk;
const view = JSON.parse(input);
const out = {
  ago: [null, 0, 59, 60, 3599, 3600, 7200, 172799, 172800].map(ago),
  devices: Object.fromEntries(view.devices.map((d) => [d.id, {
    reading: readingText(d),
    problems: d.problems.map((p) => problemText(d, p.code)),
  }])),
};
console.log(JSON.stringify(out));
"""


def run(view: dict, tmp_path: Path) -> dict:
    module = tmp_path / "devices.mjs"
    shutil.copyfile(DEVICES_JS, module)
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        input=json.dumps(view),
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


def test_words_for_the_demo_devices(tmp_path):
    s = DemoSession()
    s.step(2)
    view = json.loads(s.request("GET", "devices"))["body"]
    out = run(view, tmp_path)
    assert out["ago"] == [
        "–",
        "just now",
        "just now",
        "1 min ago",
        "59 min ago",
        "1 h ago",
        "2 h ago",
        "47 h ago",
        "2 days ago",
    ]
    devices = out["devices"]
    assert devices["trv_bedroom_3"]["problems"] == [
        "Battery low at 14%. Replace the batteries soon."
    ]
    weak = devices["temp_bathroom"]["problems"][0]
    assert weak.startswith("Weak signal (LQI ") and weak.endswith(
        "A router nearer to it would help."
    )
    assert devices["plug_garage"]["problems"] == ["Not reachable. Last heard 3 h ago."]
    trv = devices["trv_lounge"]["reading"]
    assert "° at the valve, opening limit " in trv and trv.endswith("auto mode")
    assert devices["temp_bathroom"]["reading"].endswith("% humidity")
    assert devices["plug_landing"]["reading"] == "Relays messages for nearby devices."
    assert devices["boiler_relay"]["reading"].startswith("Heating ")
    # No dashes as punctuation in anything the view says.
    text = json.dumps(devices)
    assert "—" not in text and " - " not in text
