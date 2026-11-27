"""A press on a control shows at once and is not undone by a state from before it
(web/pending.js), under Node. Regression for buttons that did not change once clicked:
the heating mode and the hot-water boost waited for the next tick of the stream, up
to a minute, and the fire button followed the detected fire instead of its switch.
Skipped where Node is not installed."""

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "web" / "src"
NODE = shutil.which("node")

needs_node = pytest.mark.skipif(NODE is None, reason="Node is not installed")

# A fake clock, a fake server and a control painted the way app.js paints one, driven
# through sendChange() exactly as a click does.
SCRIPT = """
const m = await import(process.argv[1]);
let clock = 0;
const timers = [];
const log = {};
const record = (name, f) => { try { log[name] = f(); } catch (e) { log[name] = "threw " + e.message; } };

// One control: what it shows, painted from a pendingValue and the server's last state.
function control(server) {
  const p = m.pendingValue({ now: () => clock });
  const c = { p, server, shown: null, busy: null, error: null, paints: 0 };
  c.paint = () => { c.paints += 1; c.shown = p.shown(c.server); c.busy = p.busy; c.error = p.error; };
  c.paint();
  return c;
}

// The mode: the server takes the change at once, the stream ticks a minute later.
{
  const c = control("auto");
  let release;
  const sent = new Promise((r) => { release = r; });
  const run = m.sendChange(c.p, "frost", {
    send: () => sent,
    paint: c.paint,
    refresh: async () => { c.server = "frost"; c.paint(); },
    later: (f, ms) => timers.push([f, ms]),
  });
  log.atPress = { shown: c.shown, busy: c.busy };
  // A stream state from before the press arrives while the request is out.
  c.server = "auto"; c.paint();
  log.staleWhileOut = c.shown;
  release();
  log.took = await run;
  log.afterRefresh = { shown: c.shown, busy: c.busy, error: c.error };
  log.timers = timers.map(([, ms]) => ms);
}

// The server refuses: back to the server's value, with words for a role refusal.
{
  const c = control(false);
  const took = await m.sendChange(c.p, true, {
    send: async () => { throw new Error('store/boost: HTTP 403 {"error": "viewer", "needs": "household"}'); },
    paint: c.paint,
    refresh: async () => { throw new Error("refresh after a refusal"); },
    later: () => {},
  });
  log.refused = { took, shown: c.shown, busy: c.busy, error: c.error };
}

// The server took it, but no state agrees (the stream is down): held, then let go.
{
  const c = control(false);
  await m.sendChange(c.p, true, { send: async () => {}, paint: c.paint, refresh: async () => {}, later: () => {} });
  log.heldNoState = c.shown;
  clock += m.HOLD_MS + 1;
  c.paint();
  log.afterHold = c.shown;
}

// Two quick presses: the first one's late failure does not undo the second.
{
  const p = m.pendingValue({ now: () => clock });
  const first = p.press("frost");
  const second = p.press("off");
  p.failed(first, "Not saved. Try again.");
  log.supersededFail = { shown: p.shown("auto"), error: p.error, busy: p.busy };
  p.done(second);
  log.secondConfirmed = p.shown("off");
  log.afterConfirmFollowsServer = p.shown("auto");
}

log.words = [
  m.failText(new Error('mode: HTTP 403 {"error": "csrf"}')),
  m.failText(new Error('mode: HTTP 403 {"error": "viewer", "needs": "household"}')),
  m.failText(new Error("mode: HTTP 500 boom")),
  m.failText(new TypeError("Failed to fetch")),
];
console.log(JSON.stringify(log));
"""


@pytest.fixture(scope="module")
def out(tmp_path_factory):
    module = tmp_path_factory.mktemp("pending") / "pending.mjs"
    shutil.copyfile(WEB / "pending.js", module)
    res = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert res.returncode == 0, res.stderr
    return json.loads(res.stdout)


@needs_node
def test_a_press_shows_at_once_and_is_busy(out):
    assert out["atPress"] == {"shown": "frost", "busy": True}


@needs_node
def test_a_state_from_before_the_press_does_not_undo_it(out):
    assert out["staleWhileOut"] == "frost"


@needs_node
def test_the_servers_state_shows_straight_after_not_at_the_next_tick(out):
    assert out["took"] is True
    assert out["afterRefresh"] == {"shown": "frost", "busy": False, "error": ""}
    # A fallback repaint once the hold runs out, for when no state comes at all.
    assert out["timers"] == [5050]


@needs_node
def test_a_refusal_goes_back_with_a_message(out):
    assert out["refused"] == {
        "took": False,
        "shown": False,
        "busy": False,
        "error": "Not saved: ask an admin.",
    }


@needs_node
def test_without_a_state_the_press_is_held_then_let_go(out):
    assert out["heldNoState"] is True
    assert out["afterHold"] is False


@needs_node
def test_the_latest_press_wins(out):
    assert out["supersededFail"] == {"shown": "off", "error": "", "busy": True}
    assert out["secondConfirmed"] == "off"
    assert out["afterConfirmFollowsServer"] == "auto"


@needs_node
def test_words_for_failures(out):
    assert out["words"] == [
        "Not saved: your sign-in has expired. Reload the page.",
        "Not saved: ask an admin.",
        "Not saved. Try again.",
        "Not saved. Try again.",
    ]
    for text in out["words"]:
        assert not re.search("[–—]", text)


def test_app_sends_every_toggle_through_send_change():
    """The header and room toggles go through sendChange, never fire and forget."""
    app = (WEB / "app.js").read_text()
    assert ".catch(() => {})" not in app
    for call in (
        'change(heating, mode, "mode"',
        'change(boost, on, "store/boost"',
        "change(p, lit, `rooms/${r.id}/fire`",
        'change(demand, value, "settings"',
    ):
        assert call in app, call
    # The fire button shows the switch a person sets, not a detected fire.
    assert "r.fire_switch ?? r.fire" in app
    # Nothing skips the pressed state of a focused button any more.
    assert "document.activeElement !== fire" not in app


def test_controls_have_somewhere_to_say_not_saved():
    # The page's fixed controls are in index.html; a room's are drawn by app.js.
    html = (WEB.parent / "index.html").read_text() + (WEB / "app.js").read_text()
    for marker in (
        'id="mode-error"',
        'id="boost-error"',
        'class="action-error fire-error"',
        "person-error",
    ):
        assert marker in html, marker
