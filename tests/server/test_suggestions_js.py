"""The suggestions view's words (web/suggestions.js) under Node, fed the demo's own
`GET suggestions` and the same body as a house with enough learning. Skipped where
Node is not installed."""

import copy
import json
import shutil
import subprocess
from pathlib import Path

import pytest

from radiate.server.bridge import DemoSession

ROOT = Path(__file__).resolve().parents[2]
SUGGESTIONS_JS = ROOT / "web" / "src" / "suggestions.js"
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="Node is not installed")

SCRIPT = """
const m = await import(process.argv[1]);
let input = "";
for await (const chunk of process.stdin) input += chunk;
const views = JSON.parse(input);
console.log(JSON.stringify(views.map((v) => ({
  summary: m.summaryText(v),
  empty: m.emptyText(v),
  compare: m.compareText(v),
  confidence: v.suggestions.map(m.confidenceText),
}))));
"""


def run(views: list[dict], tmp_path: Path) -> list[dict]:
    module = tmp_path / "suggestions.mjs"
    shutil.copyfile(SUGGESTIONS_JS, module)
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        input=json.dumps(views),
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


def test_words_for_the_demo_and_a_learned_house(tmp_path):
    s = DemoSession()
    s.step(2)
    learning = json.loads(s.request("GET", "suggestions"))["body"]
    # The same house once its rooms have learned, with nothing left to suggest.
    clear = copy.deepcopy(learning)
    clear["suggestions"] = []
    clear["summary"].update(total=0, consider=0, rooms_ready=6, rooms_learning=0)
    clear["summary"]["rooms_compared"] = 6
    # Learned, with a few suggestions and one room still learning.
    some = copy.deepcopy(clear)
    some["summary"].update(total=3, act=1, consider=2, rooms_ready=5, rooms_learning=1)
    some["summary"]["rooms_compared"] = 2
    some["suggestions"] = learning["suggestions"] * 3
    out = run([learning, clear, some], tmp_path)

    assert out[0]["summary"] == "1 suggestion: 1 to consider."
    assert out[0]["empty"].startswith("Radiate is still learning how each room heats up")
    assert "once it has 48 h of learning" in out[0]["empty"]
    assert out[0]["compare"] == (
        "Rooms are compared with each other once 3 have enough learning. None yet."
    )
    assert out[0]["confidence"] == [
        "Low confidence. From the latest reading only, so it may come and go."
    ]

    assert out[1]["summary"] == "Nothing to suggest."
    assert out[1]["empty"] == (
        "Every room Radiate can judge heats up and holds its warmth as expected."
    )
    assert out[1]["compare"] == ""

    assert out[2]["summary"] == "3 suggestions: 1 to act on, 2 to consider."
    assert out[2]["compare"].endswith("2 so far.")
    clear["summary"]["rooms_learning"] = 2
    assert run([clear], tmp_path)[0]["empty"].endswith("2 rooms are still learning.")

    text = json.dumps(out, ensure_ascii=False)
    assert "—" not in text and "–" not in text and " - " not in text
