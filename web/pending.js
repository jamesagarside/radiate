// A control's value while a change is on its way to the server.
//
// A press shows at once and stays shown while the request is out, so a state that
// left before the change cannot undo it. Once the server has taken the change, the
// next state that agrees lets go of it; if none agrees within `holdMs`, the server's
// value shows again. A refused change goes back to the server's value with a message.
// Pure: app.js paints the control from `shown()` and `busy`.

export const HOLD_MS = 5000;

export function pendingValue({ holdMs = HOLD_MS, now = () => Date.now() } = {}) {
  let value;
  let has = false;
  let flying = 0; // the press whose request is out, or 0
  let latest = 0; // the most recent press
  let sentAt = 0;
  let error = "";

  const drop = () => {
    has = false;
    value = undefined;
  };

  return {
    // Show `value` now and return the press, to pass to done() or failed().
    press(v) {
      value = v;
      has = true;
      error = "";
      latest += 1;
      flying = latest;
      return latest;
    },
    // The server took the change.
    done(press) {
      if (press !== latest) return;
      flying = 0;
      sentAt = now();
    },
    // The server refused the change, or could not be reached. A later press wins.
    failed(press, message) {
      if (press !== latest) return;
      flying = 0;
      drop();
      error = message;
    },
    // What the control shows, given the server's value. A server value that agrees
    // with a sent change, or a change held longer than holdMs, lets go of it.
    shown(server) {
      if (has && !flying && (server === value || now() - sentAt > holdMs)) drop();
      return has ? value : server;
    },
    get busy() {
      return flying !== 0;
    },
    get error() {
      return error;
    },
    clearError() {
      error = "";
    },
  };
}

// Send a change for a control painted from `p`. The press shows at once and the
// control is busy while `send()` is out; then `refresh()` fetches the server's state,
// so the change shows now rather than at the next tick. A refusal goes back to the
// server's value with a message. `paint()` draws the control from `p`. Answers
// whether the server took the change.
export async function sendChange(p, value, { send, paint, refresh, later = setTimeout }) {
  const press = p.press(value);
  paint();
  try {
    await send();
  } catch (err) {
    p.failed(press, failText(err));
    paint();
    return false;
  }
  p.done(press);
  paint();
  // No state agreed in time (the stream is down, say): show the server's value again.
  later(paint, HOLD_MS + 50);
  await refresh();
  return true;
}

// Words for a change the server did not take. `err.message` carries the status and
// body, as app.js's transport throws them.
export function failText(err) {
  const text = String(err?.message ?? "");
  if (/HTTP 403/.test(text) && /csrf/.test(text)) return "Not saved: your sign-in has expired. Reload the page.";
  if (/HTTP 403/.test(text)) return "Not saved: ask an admin.";
  return "Not saved. Try again.";
}
