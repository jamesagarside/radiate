"""The Security log's words (web/security.js) under Node, fed events from the server's
own security log. Skipped where Node is not installed."""

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

from radiate.export import telemetry
from radiate.server.security import SecurityLog

ROOT = Path(__file__).resolve().parents[2]
SECURITY_JS = ROOT / "web" / "src" / "security.js"
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="Node is not installed")

SCRIPT = """
const m = await import(process.argv[1]);
let input = "";
for await (const chunk of process.stdin) input += chunk;
const view = JSON.parse(input);
console.log(JSON.stringify({
  what: view.events.map(m.whatText),
  who: view.events.map(m.whoText),
  when: m.whenText(1795000000, "UTC"),
  summary: [
    m.summaryText(view, { outcome: "", user: "" }),
    m.summaryText(view, { outcome: "failure", user: "alex" }),
    m.summaryText({ ...view, events: [] }, { outcome: "failure", user: "" }),
  ],
}));
"""

DASHES = re.compile("[–—]")


def run(view: dict, tmp_path: Path) -> dict:
    module = tmp_path / "security.mjs"
    shutil.copyfile(SECURITY_JS, module)
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        input=json.dumps(view),
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(out.stdout)


def test_every_event_has_words(tmp_path):
    log = SecurityLog.memory()
    for e in telemetry.SECURITY_EVENTS:
        log.record(e.name, "x", "message", {"radiate.auth.method": "token"})
    log.record(
        telemetry.SECURITY_LOGIN,
        "login",
        "Signed in",
        {"user.name": "alex", "user.roles": ["admin"]},
    )
    view = log.query(limit=500)
    out = run(view, tmp_path)
    assert all(w and not w.startswith("radiate.") for w in out["what"])
    assert out["what"][0] == "Signed in" and out["who"][0] == "alex"
    assert "API token" in out["who"]
    assert out["when"] == "18 Nov, 11:06:40"
    assert out["summary"][0].startswith(f"The latest {len(view['events'])} events, newest first.")
    assert "Kept for 90 days." in out["summary"][0]
    assert out["summary"][1].startswith("The latest") and "refusals for alex" in out["summary"][1]
    assert out["summary"][2] == "No refusals yet. Kept for 90 days."
    assert not DASHES.search(json.dumps(out))
