// Radiate UI: renders /api/v1/state, live over WebSocket with polling fallback, in a
// Web Awesome page (wa-page). The House view is drawn with lit-html templates, which
// update the page in place, so focus and transitions survive each tick. The other
// views are their own modules (devices.js, savings.js and so on).
//
// All server traffic goes through a transport: { house(), state(), get(path),
// post(path, body), subscribe(onState, onLink) }. The default talks HTTP and WebSocket to the Radiate
// server and reports the link as "live", "lost" or "auth" through onLink. The static
// demo (<html data-transport="demo">) swaps in demo.js, which runs the same engine in
// a Web Worker, needs no token and never loses its link. Both share this one UI.

import "./wa.js";
import "@awesome.me/webawesome/dist/components/page/page.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/radio-group/radio-group.js";
import "@awesome.me/webawesome/dist/components/radio/radio.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/tag/tag.js";
import "@awesome.me/webawesome/dist/components/toast/toast.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/switch/switch.js";
import "@awesome.me/webawesome/dist/components/details/details.js";
import "@awesome.me/webawesome/dist/components/drawer/drawer.js";
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js";
import "@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js";
import "@awesome.me/webawesome/dist/components/scroller/scroller.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "./styles/views.css";
import "./styles/house.css";
import "./styles/guide.css";
import "./styles/savings.css";
import "./styles/settings.css";
import "./styles/data.css";
import "./styles/demo.css";
import "./styles/app.css";

import { html, nothing, render as draw } from "lit";
import { normaliseTime } from "./household.js";
import { createSetup } from "./setup.js";
import { weekView } from "./week.js";
import { createDevices } from "./devices.js";
import { createSuggestions } from "./suggestions.js";
import { createSavings, houseLine } from "./savings.js";
import { createData } from "./data.js";
import { createHouse, tempColour } from "./house.js";
import { createGuide, guideNote } from "./guide.js";
import { createSettings } from "./settings.js";
import { failText, pendingValue, sendChange } from "./pending.js";
import { learnedRows, rawText, stillLearning } from "./learned.js";
import { createSecurity } from "./security.js";
import { createHomeAssistant } from "./homeassistant.js";

const api = (p) => new URL(`api/v1/${p}`, document.baseURI).toString();
const $ = (id) => document.getElementById(id);
const fmtT = (t) => (t == null ? "–" : `${t.toFixed(1)}°`);
const mins = (s) => `${Math.max(0, Math.round(s / 60))} min`;
const clock = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
// "Lounge", "Lounge and Kitchen", "Lounge, Kitchen and Toilet".
const names = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`);
// 80 -> "1 h 20 min", 45 -> "45 min", 3000 -> "2 days".
const span = (m) => {
  if (m >= 2880) return `${Math.round(m / 1440)} days`;
  if (m < 60) return `${m} min`;
  const rest = m % 60;
  return rest ? `${Math.floor(m / 60)} h ${rest} min` : `${m / 60} h`;
};
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

const rooms = new Map(); // latest state per room, for the setpoint control
let last = null;
let lastAt = null;
let house = null;

// The server answered 401: the token is missing or wrong.
class AuthError extends Error {}

// With RADIATE_TOKEN set, the token lives in this browser's localStorage. Storage can
// be blocked (private windows, strict settings), so fall back to memory.
const TOKEN_KEY = "radiate.token";
function loadToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}
function storeToken(value) {
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* memory only */ }
}

function httpTransport() {
  let token = loadToken();
  let csrf = ""; // with a login session, sent on every change (ADR-0006)
  let ws = null;
  let timer = null;
  let retryMs = 2000;
  let onState = null;
  let onLink = null;

  const headers = (extra = {}, method = "GET") => {
    const out = token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
    if (csrf && method !== "GET" && method !== "HEAD") out["X-CSRF-Token"] = csrf;
    return out;
  };
  const send = async (path, init = {}) => {
    const res = await fetch(api(path), { ...init, headers: headers(init.headers, init.method) });
    if (res.status === 401) throw new AuthError(path);
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${await res.text()}`);
    return res;
  };

  // Browsers cannot set headers on a WebSocket, so the token goes in the first
  // message, never in the URL. The server closes with 4401 if it is wrong.
  const connect = () => {
    timer = null;
    const url = new URL(api("stream"));
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    try {
      ws = new WebSocket(url);
    } catch {
      ws = null;
      onLink("lost");
      timer = setTimeout(connect, retryMs);
      return;
    }
    const sock = ws;
    sock.onopen = () => { if (token) sock.send(JSON.stringify({ token })); };
    sock.onmessage = (ev) => {
      retryMs = 2000;
      onLink("live");
      onState(JSON.parse(ev.data));
    };
    sock.onclose = (ev) => {
      if (ws === sock) ws = null;
      if (ev.code === 4401) { onLink("auth"); return; }
      onLink("lost");
      timer = setTimeout(connect, retryMs);
      retryMs = Math.min(retryMs * 2, 15000);
    };
    sock.onerror = () => sock.close();
  };

  return {
    hasToken: () => Boolean(token),
    setCsrf(value) { csrf = value || ""; },
    setToken(value) {
      token = value;
      storeToken(value);
    },
    house: async () => (await send("house")).json(),
    state: async () => (await send("state")).json(),
    get: async (path) => (await send(path)).json(),
    text: async (path) => (await send(path)).text(),
    async post(path, body) {
      await send(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    // Any method, answering { status, body } instead of throwing on 4xx and 5xx, so
    // field errors from the household setup can be shown. 401 still asks to sign in.
    async call(method, path, body) {
      const init = { method, headers: headers(body === undefined ? {} : { "Content-Type": "application/json" }, method) };
      if (body !== undefined) init.body = JSON.stringify(body);
      const res = await fetch(api(path), init);
      if (res.status === 401) throw new AuthError(path);
      const text = await res.text();
      let parsed = text;
      try { parsed = JSON.parse(text); } catch { /* plain text */ }
      return { status: res.status, body: parsed };
    },
    // Safe to call again after signing in: it connects only if not already connected.
    subscribe(stateCb, linkCb) {
      onState = stateCb;
      onLink = linkCb;
      if (!ws && !timer) connect();
    },
  };
}

const transport = document.documentElement.dataset.transport === "demo"
  ? (await import("./demo.js")).createDemoTransport()
  : httpTransport();

// Development only (`npm run dev`): ?fixture=<name> lays a state the demo can't
// produce over the server's (src/dev-fixtures.js). import.meta.env.DEV is false in
// the build, so Vite drops this and the module.
let fixture = null;
if (import.meta.env.DEV) {
  const name = new URLSearchParams(location.search).get("fixture");
  if (name) {
    const fx = await import("./dev-fixtures.js");
    fixture = { name, ...fx };
    const state = transport.state;
    transport.state = async () => fx.applyFixture(name, await state());
    const subscribe = transport.subscribe;
    transport.subscribe = (onState, onLink) => {
      if (fx.OFFLINE.has(name)) { setTimeout(markOffline, 1500); return; }
      subscribe((s) => onState(fx.applyFixture(name, s)), onLink);
    };
  }
}

async function post(path, body) {
  try {
    await transport.post(path, body);
  } catch (err) {
    if (err instanceof AuthError) askForToken();
    else console.error(err);
    throw err;
  }
}

// Send a change for a control painted from `p` (pending.js): it shows at once, is busy
// while the request is out, then shows the server's state, or goes back with a message.
// Every state that arrives meanwhile, from the stream or a poll, is painted through
// `p`, so a state from before the press can't undo it.
const change = (p, value, path, body, paint) => sendChange(p, value, { send: () => post(path, body), paint, refresh });

// Show a control's error under it, or hide the line.
function showError(el, text) {
  el.hidden = !text;
  el.textContent = text;
}

// Roles (ADR-0006): what the signed-in person may change. Token, ingress, a server
// without login and the demo count as admin. A control the role can't use stays in
// its place, disabled, with a short tag saying why, so nothing fails with "Not saved".
// The server checks every change too (radiate.server.permissions); this only shows it.
const RANK = { viewer: 0, household: 1, admin: 2 };
let role = "admin";
const may = (needed) => (RANK[role] ?? -1) >= RANK[needed];
// Why a control is off for this role, or "" when it may be used.
const lockText = (needed) => (may(needed) ? "" : role === "household" ? "Ask an admin" : "Read only");

// Disable `controls` (Web Awesome controls, or native buttons) and show `tag` when the
// role is below `needed`. Returns whether they are locked.
function lock(controls, tag, needed) {
  const why = lockText(needed);
  for (const c of controls) {
    if (!c) continue;
    c.disabled = Boolean(why);
    if (why) c.dataset.locked = "";
    else delete c.dataset.locked;
  }
  if (tag) {
    tag.hidden = !why;
    tag.textContent = why;
  }
  return Boolean(why);
}

// The controls that are always on the House view: the modes and the hot-water boost.
function applyRole() {
  lock([$("mode"), $("demand")], $("controls-lock"), "household");
  lock([$("boost")], $("boost-lock"), "household");
}

// Eco demand mode (spec 5.3): a calling room on its own waits until other rooms join
// it, so the boiler fires once for all of them.
const pooled = (r) => r.reason_code === "demand.pooled";

function badgeFor(r) {
  if (r.role === "passive") return ["Bypass, not controlled", ""];
  if (r.role === "unheated") return ["No radiator", ""];
  // A fire Radiate spotted from the room's warming, with nobody's switch on yet.
  // Older servers send only `fire`, so it reads as lit.
  if (r.fire) return r.fire_switch === false ? ["Fire detected", "fire"] : ["Fire lit", "fire"];
  if (r.preheating) return ["Preheating", "preheat"];
  if (pooled(r)) return ["Waiting for a burn", "pooled"];
  if (r.calling) return ["Heating", "calling"];
  // Older servers send `topup` without `extend`, so cannot tell the two apart.
  if (r.topup && r.extend === true) return ["Topping up", "extend"];
  if (r.topup && r.extend === false) return ["Heat sink", "sink"];
  if (r.topup) return ["Topped up", "sink"];
  if (r.temperature != null && r.target != null && r.temperature >= r.target - 0.3) return ["Comfortable", "ok"];
  return ["Waiting", ""];
}

// Each kind of state to a Web Awesome variant: heat in the brand's orange, waiting and
// attention in warning, comfortable in success, and calm states Radiate or a person
// set (a heat sink, someone away) in Radiate's cool blue.
const KIND_VARIANT = {
  calling: "brand", fire: "brand", extend: "brand",
  preheat: "warning", pooled: "warning", back: "warning", stale: "warning",
  ok: "success",
  sink: "cool", away: "cool",
};
function badge(label, kind) {
  const v = KIND_VARIANT[kind] ?? "neutral";
  return v === "cool"
    ? html`<wa-badge class="radiate-cool" appearance="filled-outlined">${label}</wa-badge>`
    : html`<wa-badge variant=${v} appearance=${v === "neutral" ? "outlined" : "filled-outlined"}>${label}</wa-badge>`;
}

// Why learning is paused for a room (state `rooms[].learning`), as what Radiate is
// waiting for. Null: learning now.
const LEARNING = {
  fire: "Paused while the fire warms the room",
  fire_holdoff: "Paused until the room cools after the fire",
  window: "Paused while a window is open",
  shower: "Paused after a shower",
  cooker_spike: "Paused while cooking warms the room",
  unexplained_heat: "Paused: extra heat from somewhere, the sun or guests perhaps",
  store_recovery: "Paused while the boiler heats the hot water",
  heat_unknown: "Paused until the boiler's state is known",
  setpoint_change: "Waiting for the room to settle at its new temperature",
  no_data: "Waiting for enough readings",
  trv_offline: "Waiting for the TRV to come back",
};

// The Learning line of a room's details: what learning waits for, else how sure the
// room model is.
function learningFact(r) {
  if (r.learning) return LEARNING[r.learning] ?? `Paused: ${r.learning.replaceAll("_", " ")}`;
  const m = r.model;
  if (!m.samples) return "Just started, using typical values for now";
  const pct = `${Math.round(m.confidence * 100)}% sure`;
  if (stillLearning(m)) return `Still learning this room, ${pct}`;
  return m.confidence < 0.75 ? `Fairly sure of this room, ${pct}` : `Sure of this room, ${pct}`;
}

// The fire switch: the manual flag a person sets, `fire_switch`. `fire` is also true
// for a detected fire, which this switch cannot clear, so the switch shows the switch.
// Older servers send only `fire`.
const firePresses = new Map(); // room id -> pendingValue
function firePending(id) {
  if (!firePresses.has(id)) firePresses.set(id, pendingValue());
  return firePresses.get(id);
}
const fireOn = (r) => Boolean(r.fire_switch ?? r.fire);

function toggleFire(r) {
  const p = firePending(r.id);
  const lit = !p.shown(fireOn(rooms.get(r.id) ?? r));
  change(p, lit, `rooms/${r.id}/fire`, { lit }, renderRoomDetail)
    .then((took) => took && toast(lit ? `${r.name}: fire lit. Its radiator is closed.` : `${r.name}: fire out.`));
}

// Setpoint control. Changes show at once and are sent together once the reader
// pauses, so five quick presses of plus are one request, not five. The pending value
// stays until a state shows the server holding it.
const SETPOINT_MIN = 5;
const SETPOINT_MAX = 28;
const SEND_AFTER_MS = 600;
const PENDING_MAX_MS = 5000;
const setpoints = new Map(); // room id -> { pending, timer, expiry, error, clearing }

function control(id) {
  if (!setpoints.has(id)) setpoints.set(id, { pending: null, timer: null, expiry: null, error: "", clearing: false });
  return setpoints.get(id);
}

function heldSetpoint(r) {
  const c = control(r.id);
  if (c.pending != null) return c.pending;
  if (r.override?.setpoint != null && !c.clearing) return r.override.setpoint;
  return r.setpoint ?? r.target ?? null;
}

// A new setpoint from the stepper.
function setTo(id, raw) {
  const r = rooms.get(id);
  if (!r || !Number.isFinite(raw)) return;
  const c = control(id);
  const base = heldSetpoint(r) ?? 20;
  const next = Math.min(SETPOINT_MAX, Math.max(SETPOINT_MIN, Math.round(raw * 2) / 2));
  if (next === base) { renderRoomDetail(); return; }
  c.pending = next;
  c.error = "";
  c.clearing = false;
  clearTimeout(c.timer);
  clearTimeout(c.expiry);
  c.timer = setTimeout(() => sendSetpoint(id), SEND_AFTER_MS);
  renderHouse();
}

async function sendSetpoint(id) {
  const c = control(id);
  c.timer = null;
  const value = c.pending;
  try {
    await post(`rooms/${id}/setpoint`, { setpoint: value });
  } catch (err) {
    if (c.pending === value) {
      c.pending = null;
      c.error = failText(err);
    }
    renderHouse();
    return;
  }
  // Let go of the pending value if no state confirms it, for example after a restart.
  c.expiry = setTimeout(() => {
    if (c.pending === value && !c.timer) {
      c.pending = null;
      renderHouse();
    }
  }, PENDING_MAX_MS);
  const r = rooms.get(id);
  if (r && c.pending === value) toast(`${r.name} held at ${fmtT(value)}.`);
  refresh();
}

async function resumeSchedule(id) {
  const c = control(id);
  clearTimeout(c.timer);
  c.timer = null;
  c.pending = null;
  c.error = "";
  c.clearing = true;
  renderHouse();
  try {
    await post(`rooms/${id}/setpoint`, { setpoint: null });
  } catch (err) {
    c.clearing = false;
    c.error = failText(err);
    renderHouse();
    return;
  }
  const r = rooms.get(id);
  if (r) toast(`${r.name} follows its schedule again.`);
  refresh();
}

// The server streams once a tick; ask for the state now so a change shows at once.
async function refresh() {
  try { render(await transport.state()); } catch { /* the stream catches up */ }
}

function holdText(o) {
  if (o.until === "cleared") return "Held until cleared";
  if (o.expires_in_min == null) return "Held until the next change";
  if (o.until === "duration") return `Held for ${span(o.expires_in_min)}`;
  return last ? `Held until ${clock((last.minute_of_day + o.expires_in_min) % 1440)}` : "Held until the next change";
}

// Roles Radiate observes but never controls: a bypass radiator, a room with no radiator.
const OBSERVED_ONLY = new Set(["passive", "unheated"]);

function controllable(r) {
  const known = house?.rooms?.find((h) => h.id === r.id);
  return known ? known.controllable : !OBSERVED_ONLY.has(r.role);
}

// Settle a room's setpoint control against a new state: a pending value the server now
// holds, or a cleared hold, lets go.
function settle(r) {
  const c = control(r.id);
  if (c.pending != null && !c.timer && r.override?.setpoint === c.pending) {
    c.pending = null;
    clearTimeout(c.expiry);
  }
  if (c.clearing && !r.override) c.clearing = false;
}

function reasonFor(r) {
  let reason = r.reason || "";
  if (pooled(r)) reason = "Waiting to share a burn with other rooms.";
  if (!r.calling && r.topup && r.extend === true) reason = "Topped up now so it does not need a second burn soon.";
  if (!r.calling && r.topup && r.extend === false) reason = "Opened so the burner's heat has somewhere to go.";
  if (!reason && r.role === "passive") reason = "Manual valve, always open: counted as the system's open path.";
  if (!reason && r.role === "unheated") reason = "No radiator here. Temperature recorded, not controlled.";
  if (!reason && r.heat_source === "continuous") reason = "Range cooker heat is learned as a steady background.";
  if (!reason && r.next_setpoint != null && r.next_in_min != null && last) {
    const at = (last.minute_of_day + r.next_in_min) % 1440;
    reason = `Next ${r.next_setpoint.toFixed(1)}° at ${clock(at)}.`;
  }
  return reason;
}

function learningLine(r) {
  if (r.model) return learningFact(r);
  return r.humidity != null ? `${r.humidity}% RH` : "";
}

function stuckText(r) {
  if (!r.valve?.untrusted) return "";
  return r.valve.leaking ? "Valve may not be closing: radiator warmed while shut." : r.valve.misses
    ? `Valve may be stuck: radiator stayed cold for ${plural(r.valve.misses, "burn", "burns")}.`
    : "Valve may be stuck: radiator not warming.";
}

// ---------- rooms: the list, the selected room and the hero ----------

// One room is selected at a time, from the house model, the list or "Needs you". On a
// wide screen its details take the place of "The house now" beside the model; on a
// narrower one they open in a drawer (a bottom sheet on a phone).
let selected = null;
const wide = matchMedia("(min-width: 75rem)");
const narrow = matchMedia("(max-width: 40rem)");
const drawer = $("room-drawer");
let drawerFor = null;
let panelFor = null;

// Toasts confirm a change the server took. Errors stay inline under the control, where
// the reader is looking, so a toast is never the only place something is said.
const toaster = $("toast");
const TOAST = { success: { icon: "circle-check" }, neutral: { icon: "circle-info" }, warning: { icon: "triangle-exclamation" } };
function toast(message, variant = "success") {
  try { toaster.create(message, { variant, duration: 5000, icon: TOAST[variant]?.icon }); } catch { /* no toast support */ }
}

function select(id, opener = null) {
  const again = selected === id;
  selected = again ? null : id;
  houseView.select(selected);
  renderHouse();
  if (!selected) {
    if (wide.matches) panelFor?.focus?.();
    panelFor = null;
    return;
  }
  if (wide.matches) {
    panelFor = opener;
    // The details take the place of the overview; focus moves to the room's name.
    requestAnimationFrame(() => $("room-panel").querySelector("h2")?.focus({ preventScroll: true }));
    const panel = $("room-panel");
    const top = panel.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight - 120) panel.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
    return;
  }
  drawerFor = opener;
  drawer.placement = narrow.matches ? "bottom" : "end";
  drawer.open = true;
}
function closeRoom() {
  if (!selected) return;
  select(selected);
}
drawer.addEventListener("wa-after-hide", (e) => {
  if (e.target !== drawer) return;
  if (!wide.matches) {
    selected = null;
    houseView.select(null);
    renderHouse();
    drawerFor?.focus?.();
    drawerFor = null;
  }
});
wide.addEventListener("change", () => {
  if (wide.matches) drawer.open = false;
  else if (selected) { drawer.placement = narrow.matches ? "bottom" : "end"; drawer.open = true; }
  renderHouse();
});
narrow.addEventListener("change", () => renderHouse());
document.addEventListener("keydown", (e) => {
  // Escape closes the room's details beside the model (the drawer handles its own).
  if (e.key === "Escape" && selected && wide.matches && !e.defaultPrevented && $("room-panel").contains(document.activeElement)) closeRoom();
});

// Rooms that need the reader: an alert about the room (a valve offline or stuck, a
// flat battery, no reading). Alerts arrive room name first ("Lounge: TRV battery low").
function roomNeeds(s) {
  const out = new Map();
  for (const a of s.alert_details ?? []) {
    if (!a.room_id) continue;
    const r = s.rooms.find((x) => x.id === a.room_id);
    if (!r) continue;
    const text = a.message.startsWith(`${r.name}: `) ? a.message.slice(r.name.length + 2) : a.message;
    if (!out.has(r.id)) out.set(r.id, { room: r, texts: [] });
    out.get(r.id).texts.push(text);
  }
  for (const r of s.rooms) {
    if (r.temperature == null && !out.has(r.id)) out.set(r.id, { room: r, texts: ["no reading"] });
  }
  return [...out.values()];
}

function roomRow(r, needs) {
  const [label, kind] = badgeFor(r);
  const canSet = controllable(r);
  const sp = canSet ? heldSetpoint(r) : null;
  const observed = OBSERVED_ONLY.has(r.role);
  const on = r.id === selected;
  const held = canSet && (control(r.id).pending != null || (r.override?.setpoint != null && !control(r.id).clearing));
  const need = needs.get(r.id);
  return { r, label, kind, sp, observed, on, held, need };
}

function roomsList(list) {
  const needs = new Map(roomNeeds(last).map((n) => [n.room.id, n.texts]));
  const pick = (e, id) => select(id, e.currentTarget);
  const flag = (x) => (x.need ? html`<wa-icon class="room-flag" name="triangle-exclamation" label="Needs attention: ${x.need.join(", ")}"></wa-icon>` : nothing);
  if (narrow.matches) {
    return html`<ul class="room-list" aria-labelledby="rooms-h">${list.map((r) => {
      const x = roomRow(r, needs);
      return html`<li>
        <button type="button" class="room-item" aria-pressed=${String(x.on)} @click=${(e) => pick(e, r.id)}>
          <span class="room-item-top">
            <span class="room-name"><span class="swatch" style="--swatch:${tempColour(r.temperature)}" aria-hidden="true"></span><strong>${r.name}</strong>${flag(x)}</span>
            ${badge(x.label, x.kind)}
          </span>
          <span class="room-item-facts">
            <span><span class="fact-label">Now</span> <strong class="readout">${fmtT(r.temperature)}</strong></span>
            ${x.sp != null ? html`<span><span class="fact-label">${x.held ? "Held at" : "Set to"}</span> <strong class="readout">${fmtT(x.sp)}</strong></span>` : nothing}
            ${!x.observed && r.opening != null ? html`<span><span class="fact-label">Valve</span> <strong class="readout">${r.opening}%</strong></span>` : nothing}
          </span>
        </button>
      </li>`;
    })}</ul>`;
  }
  return html`<wa-scroller orientation="horizontal">
    <table class="rooms-table" aria-labelledby="rooms-h">
      <thead><tr><th scope="col">Room</th><th scope="col" class="num">Now</th><th scope="col" class="num">Setpoint</th><th scope="col">Opening limit</th><th scope="col">State</th></tr></thead>
      <tbody>${list.map((r) => {
        const x = roomRow(r, needs);
        return html`<tr class=${x.on ? "selected" : ""} data-idle=${String(!(r.calling || r.topup))} @click=${(e) => { if (!e.target.closest("button")) select(r.id, e.currentTarget.querySelector("button")); }}>
          <th scope="row"><button type="button" class="room-btn" aria-pressed=${String(x.on)} @click=${(e) => pick(e, r.id)}>
            <span class="swatch" style="--swatch:${tempColour(r.temperature)}" aria-hidden="true"></span><span class="room-btn-name">${r.name}</span>${flag(x)}</button></th>
          <td class="num readout">${fmtT(r.temperature)}</td>
          <td class="num readout">${x.sp == null ? html`<span class="wa-color-text-quiet">–</span>` : html`${x.held ? html`<wa-icon class="held-icon" name="hand" label="Held"></wa-icon> ` : nothing}${fmtT(x.sp)}`}</td>
          <td>${x.observed || r.opening == null ? html`<span class="wa-color-text-quiet">–</span>` : html`
            <span class="valve"><wa-progress-bar value=${r.opening} label="${r.name} opening limit"></wa-progress-bar><span class="wa-caption-s readout">${r.opening}%</span></span>`}</td>
          <td>${badge(x.label, x.kind)}</td>
        </tr>`;
      })}</tbody>
    </table>
  </wa-scroller>`;
}

// The setpoint: minus and plus, each labelled with the room, and the value between
// them. The value moves a few pixels the way it changed, so a press feels like it
// turned a dial; never for a keyboard press or under reduced motion.
function nudge(e, r, step) {
  const before = heldSetpoint(r);
  setTo(r.id, (before ?? 20) + step);
  const fromPointer = e.detail > 0;
  if (!fromPointer || reducedMotion.matches) return;
  const value = e.currentTarget.parentElement.querySelector(".step-value");
  value?.animate(
    [{ transform: `translateY(${step > 0 ? 6 : -6}px)`, opacity: 0.4 }, { transform: "translateY(0)", opacity: 1 }],
    { duration: 180, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
  );
}

function stepper(r, shown, locked) {
  return html`<div class="stepper" role="group" aria-label="${r.name} setpoint">
    <wa-button appearance="outlined" class="step" ?disabled=${locked || (shown != null && shown <= SETPOINT_MIN)} @click=${(e) => nudge(e, r, -0.5)}>
      <wa-icon name="minus" label="Lower ${r.name} setpoint by 0.5°"></wa-icon></wa-button>
    <output class="step-value readout" aria-live="polite" aria-atomic="true">${fmtT(shown)}</output>
    <wa-button appearance="outlined" class="step" ?disabled=${locked || (shown != null && shown >= SETPOINT_MAX)} @click=${(e) => nudge(e, r, 0.5)}>
      <wa-icon name="plus" label="Raise ${r.name} setpoint by 0.5°"></wa-icon></wa-button>
  </div>`;
}

// The selected room: what it is doing, its setpoint, the fire switch and what Radiate
// has learned. Drawn beside the model on a wide screen, in the drawer otherwise.
function roomDetail(r, { inDrawer }) {
  const [label, kind] = badgeFor(r);
  const canSet = controllable(r);
  const c = control(r.id);
  const why = lockText("household");
  const locked = Boolean(why);
  const shown = canSet ? heldSetpoint(r) : null;
  const held = canSet && c.pending == null && !c.clearing && r.override?.setpoint != null;
  const changing = canSet && c.pending != null;
  const observed = OBSERVED_ONLY.has(r.role);
  const idle = !(r.calling || r.topup);
  const hasFire = r.heat_source === "episodic";
  const fire = firePending(r.id);
  const notes = (last?.learning_notes ?? []).filter((x) => x.room_id === r.id);
  const rows = r.model ? learnedRows(r, { outdoor: last?.outdoor, minute_of_day: last?.minute_of_day, notes }) : [];
  const learning = r.model ? stillLearning(r.model) : false;
  const stuck = stuckText(r);
  const reason = reasonFor(r);
  const needs = roomNeeds(last).find((n) => n.room.id === r.id)?.texts.filter((t) => t !== "no reading") ?? [];
  const facts = [];
  if (r.humidity != null) facts.push(["Humidity", `${Math.round(r.humidity)}%`]);
  if (!canSet && r.setpoint != null && !observed) facts.push(["Setpoint", fmtT(r.setpoint)]);
  const learn = learningLine(r);
  if (r.model) facts.push(["Learning", learningFact(r)]);
  const hint = c.error ? "" : held ? holdText(r.override) : changing ? "Sending…" : "From the schedule";
  // On a phone the details are a bottom sheet, and the room's quick control comes
  // first, under its name; beside the model it follows what the room is doing.
  const setpoint = canSet ? html`
    <div class="setpoint" data-held=${String(held || changing)}>
      <div class="setpoint-row">
        <div class="wa-stack wa-gap-3xs">
          <span class="setpoint-label">Setpoint</span>
          <span class="setpoint-hint" aria-live="polite">${c.error ? html`<span class="error-line" role="alert">${c.error}</span>` : hint}</span>
        </div>
        ${stepper(r, shown, locked)}
      </div>
      <div class="wa-cluster wa-gap-xs">
        ${held && !locked ? html`<wa-button size="s" appearance="outlined" @click=${() => resumeSchedule(r.id)}><wa-icon slot="start" name="rotate-left"></wa-icon>Resume schedule</wa-button>` : nothing}
        ${why ? html`<wa-tag size="s" class="lock-tag">${why}</wa-tag>` : nothing}
      </div>
    </div>` : nothing;
  return html`
    <div class="room-detail" data-room=${r.id}>
      <div class="room-detail-head">
        <div class="wa-stack wa-gap-2xs">
          ${inDrawer ? nothing : html`<h2 class="wa-heading-l" id="room-panel-h" tabindex="-1">${r.name}</h2>`}
          <div class="wa-cluster wa-gap-xs">
            ${badge(label, kind)}
            ${held ? html`<wa-tag size="s" class="radiate-cool">Held</wa-tag>` : nothing}
          </div>
        </div>
        ${inDrawer ? nothing : html`<wa-button appearance="plain" size="s" class="panel-close" @click=${closeRoom}><wa-icon name="xmark" label="Close ${r.name}"></wa-icon></wa-button>`}
      </div>

      ${inDrawer ? setpoint : nothing}
      ${reason ? html`<p class="reason">${reason}</p>` : nothing}

      <div class="readouts">
        <div class="readout-block"><span class="readout-label">Now</span><span class="readout readout-xl">${fmtT(r.temperature)}</span></div>
        ${r.target != null && !observed ? html`<div class="readout-block"><span class="readout-label">Target</span><span class="readout readout-l">${fmtT(r.target)}</span></div>` : nothing}
        ${!observed && r.opening != null ? html`<div class="readout-block"><span class="readout-label">Opening limit</span><span class="readout readout-l">${r.opening}%</span></div>` : nothing}
      </div>
      ${!observed && r.opening != null ? html`<wa-progress-bar class="opening" data-idle=${String(idle)} value=${r.opening} label="${r.name} opening limit, ${r.opening}%"></wa-progress-bar>` : nothing}

      ${needs.length ? html`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${needs.map((t) => t[0].toUpperCase() + t.slice(1)).join(". ")}.</wa-callout>` : nothing}
      ${stuck ? html`<wa-callout variant="warning" size="s"><wa-icon slot="icon" name="triangle-exclamation"></wa-icon>${stuck}</wa-callout>` : nothing}

      ${inDrawer ? nothing : setpoint}

      ${hasFire ? html`
        <div class="wa-stack wa-gap-2xs">
          <wa-switch .checked=${Boolean(fire.shown(fireOn(r)))} ?disabled=${locked} aria-busy=${String(fire.busy)}
            hint="Radiate closes this radiator and pauses learning while the fire warms the room."
            @change=${() => toggleFire(r)}>Fire lit</wa-switch>
          ${r.fire && r.fire_switch === false && !fire.busy ? html`<p class="fire-spotted"><wa-icon name="eye"></wa-icon>Radiate spotted the fire. Switch on to confirm.</p>` : nothing}
          <p class="action-error fire-error" role="alert" ?hidden=${!fire.error}>${fire.error}</p>
        </div>` : nothing}

      ${facts.length ? html`<dl class="facts">${facts.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>` : nothing}
      ${!r.model && learn ? html`<p class="wa-caption-m wa-color-text-quiet">${learn}</p>` : nothing}

      ${r.model ? html`
        <wa-details class="learned">
          <span slot="summary" class="wa-cluster wa-gap-xs">What Radiate has learned${learning ? html`<wa-tag size="s" class="radiate-cool">Still learning</wa-tag>` : nothing}</span>
          <div class="wa-stack wa-gap-s">
            ${learning ? html`<p class="learned-status">${r.model.samples === 0
              ? "Still learning. Nothing learned yet, so Radiate uses typical values for now."
              : "Still learning. These numbers will change as Radiate sees this room warm up and cool down more often."}</p>` : nothing}
            <dl class="learned-rows">${rows.map((row) => html`<div><dt>${row.label}</dt><dd>${row.text}</dd></div>`)}</dl>
            <p class="wa-caption-s wa-color-text-quiet">${rawText(r.model)}</p>
            <p class="wa-caption-m"><a href="#guide/room-model">What the room model is</a></p>
          </div>
        </wa-details>` : nothing}
    </div>`;
}

let roomsDrawn = false;
function renderRooms() {
  if (!last) return;
  if (!roomsDrawn) { $("rooms").textContent = ""; roomsDrawn = true; }
  draw(roomsList(last.rooms), $("rooms"));
}

function renderRoomDetail() {
  const r = selected ? rooms.get(selected) : null;
  const panel = $("room-panel");
  const overview = $("hm-status");
  const inPanel = Boolean(r && wide.matches);
  if (panel.hidden === inPanel) {
    // Swap the overview and the room's details in place: the new one fades and rises
    // a few pixels, so the eye follows the selection from the model to its details.
    panel.hidden = !inPanel;
    overview.hidden = inPanel;
    const shown = inPanel ? panel : overview;
    if (!reducedMotion.matches) {
      shown.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    }
  }
  draw(inPanel ? roomDetail(r, { inDrawer: false }) : nothing, panel);
  if (wide.matches) { draw(nothing, drawer); return; }
  drawer.label = r?.name ?? "Room";
  draw(r ? roomDetail(r, { inDrawer: true }) : nothing, drawer);
}

// The hero answers, in order: is the house all right, what is the boiler doing and
// why, and which room needs the reader.
const HERO = {
  ok: { icon: "circle-check", tone: "success" },
  heat: { icon: "fire-flame-curved", tone: "brand" },
  attention: { icon: "triangle-exclamation", tone: "warning" },
  frost: { icon: "snowflake", tone: "cool" },
  off: { icon: "power-off", tone: "neutral" },
  quiet: { icon: "moon", tone: "cool" },
  stale: { icon: "plug-circle-xmark", tone: "warning" },
  wait: { icon: "hourglass-half", tone: "neutral" },
};

function heroState(s) {
  const active = s.rooms.filter((r) => !OBSERVED_ONLY.has(r.role));
  const calling = active.filter((r) => r.calling).length;
  const tel = s.telemetry ?? {};
  if (relayLost(s)) return ["attention", "The boiler relay can't be reached"];
  if ((s.alert_details ?? []).some((a) => a.code?.startsWith("safe_mode"))) return ["attention", "Safe mode: the boiler is stopping"];
  if (s.mode === "off") return ["off", "Heating is off"];
  if (s.mode === "frost") return ["frost", "Frost protection only"];
  if (!tel.simulated && tel.boiler_linked === false) return calling ? ["wait", `${plural(calling, "room wants", "rooms want")} heat`] : ["ok", "Rooms are comfortable"];
  if (s.boiler.state === "firing") return ["heat", calling ? `Heating ${plural(calling, "room", "rooms")}` : "Burner on"];
  if (s.boiler.state === "lead") return ["heat", "Opening valves"];
  if (s.quiet?.active) return ["quiet", `Quiet hours until ${s.quiet.until}`];
  if (s.boiler.state === "rest") return ["ok", "Burner resting"];
  // Idle: a room waits only when Eco pools it with others; a room that has just
  // started calling is picked up on the next tick, as the status line says.
  const waiting = active.filter(pooled).length;
  if (waiting) return ["wait", `${plural(waiting, "room is", "rooms are")} waiting for a burn`];
  return ["ok", "Rooms are comfortable"];
}

function nextChange(s) {
  let best = null;
  for (const r of s.rooms) {
    if (OBSERVED_ONLY.has(r.role) || r.next_in_min == null || r.next_setpoint == null) continue;
    if (!best || r.next_in_min < best.next_in_min) best = r;
  }
  return best ? clock((s.minute_of_day + best.next_in_min) % 1440) : null;
}

function renderHero(s, status) {
  const [key, title] = document.body.dataset.link === "stale" ? ["stale", "Showing old data"] : heroState(s);
  const h = HERO[key];
  const hero = $("hero");
  if (hero.dataset.tone !== h.tone) {
    const had = hero.dataset.tone;
    hero.dataset.tone = h.tone;
    if (had && !reducedMotion.matches) {
      hero.querySelector(".hero-icon").animate(
        [{ transform: "scale(0.85)", opacity: 0.4 }, { transform: "scale(1)", opacity: 1 }],
        { duration: 240, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
      );
    }
  }
  $("hero-icon").name = h.icon;
  $("hero-title").textContent = title;
  $("hero-why").textContent = status;
  const facts = [];
  if (s.outdoor != null) facts.push(["temperature-half", `Outside ${s.outdoor.toFixed(1)}°`]);
  facts.push(["faucet-drip", s.store?.boost ? "Hot water boosted" : s.store?.relay ? "Hot water on" : "Hot water off"]);
  const next = nextChange(s);
  if (next) facts.push(["clock", `Next change ${next}`]);
  draw(html`${facts.map(([icon, text]) => html`<li><wa-icon name=${icon}></wa-icon>${text}</li>`)}`, $("hero-facts"));
  // One chip per room that needs the reader; a problem shared by three rooms or more
  // (every valve offline, say) is one chip that leads to Devices.
  const needs = roomNeeds(s);
  const shared = new Map();
  for (const n of needs) for (const t of n.texts) shared.set(t, (shared.get(t) ?? 0) + 1);
  const big = new Set([...shared].filter(([, c]) => c >= 3).map(([t]) => t));
  const chips = [];
  for (const t of big) chips.push(html`<li><a class="need-chip" href="#devices"><strong>${t[0].toUpperCase() + t.slice(1)}</strong><span>${plural(shared.get(t), "room", "rooms")}</span></a></li>`);
  for (const n of needs) {
    const texts = n.texts.filter((t) => !big.has(t));
    if (!texts.length) continue;
    chips.push(html`<li><button type="button" class="need-chip" @click=${(e) => select(n.room.id, e.currentTarget)}>
      <strong>${n.room.name}</strong><span>${texts.join(", ")}</span></button></li>`);
  }
  // Alerts about no room (a plug, the boiler relay) follow, at most HOUSE_CHIPS of
  // them; the rest are one chip to Devices. Older servers send only the sentences, so
  // every alert is one of these.
  const house = houseAlerts(s);
  const toDevices = devicesOffered === true;
  for (const a of house.slice(0, HOUSE_CHIPS)) {
    const at = a.message.indexOf(": ");
    const [what, text] = at > 0 ? [a.message.slice(0, at), a.message.slice(at + 2)] : [a.message, ""];
    const href = toDevices && (!a.code || DEVICE_ALERTS.test(a.code)) ? "#devices" : "#guide/alerts";
    chips.push(html`<li><a class="need-chip" href=${href}><strong>${what}</strong>${text ? html`<span>${text}</span>` : nothing}</a></li>`);
  }
  const rest = house.length - HOUSE_CHIPS;
  if (rest > 0) chips.push(html`<li><a class="need-chip need-more" href=${toDevices ? "#devices" : "#guide/alerts"}><strong>${rest} more ${rest === 1 ? "alert" : "alerts"}</strong></a></li>`);
  $("hero-needs").hidden = !chips.length;
  draw(html`${chips}`, $("hero-needs-list"));
  renderHeroSummary(s);
}

// Alerts that name no room this state knows, as { code, message }.
function houseAlerts(s) {
  if (!s.alert_details) return (s.alerts ?? []).map((message) => ({ code: null, message }));
  return s.alert_details.filter((a) => !a.room_id || !s.rooms.some((r) => r.id === a.room_id));
}
const HOUSE_CHIPS = 2;

// On a phone the hero's controls fold into one line saying how they are set; a press
// opens them.
const MODE_WORDS = { auto: "Auto", frost: "Frost", off: "Off" };
function renderHeroSummary(s) {
  const mode = heating.shown(s.mode);
  const parts = [MODE_WORDS[mode] ?? mode];
  const dm = s.settings?.demand_mode;
  if (DEMAND_NOTE[dm]) parts.push(demand.shown(dm) === "comfort" ? "Comfort" : "Eco");
  parts.push(boost.shown(s.store?.boost) ? "hot water boosted" : s.store?.relay ? "hot water on" : "hot water off");
  $("hero-summary-text").textContent = parts.join(", ");
}
function setHeroControls(open) {
  const btn = $("hero-summary");
  btn.setAttribute("aria-expanded", String(open));
  $("hero-summary-act").textContent = open ? "Done" : "Change";
  $("hero").dataset.controls = open ? "open" : "closed";
}
$("hero-summary").addEventListener("click", () => setHeroControls($("hero-summary").getAttribute("aria-expanded") !== "true"));
setHeroControls(false);
// Icon names drawn from data above, listed so the build ships them.
const HERO_FACT_ICONS = [{ icon: "temperature-half" }, { icon: "faucet-drip" }, { icon: "clock" }];
void HERO_FACT_ICONS;

function renderHouse() {
  renderRooms();
  renderRoomDetail();
}

// ---------- people ----------

// Away, per person (household setup). The server says who counts as away; this only
// shows it and sets or clears "away until". Times arrive as local ISO strings with an
// offset ("2026-11-24T18:00+00:00"), so their first 16 characters are house time.
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNumber = (date) => Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 86400000;

// "today", "tomorrow", "Tuesday" within the week, else "Tue 2 Dec".
function dayName(date, today) {
  const ahead = today ? dayNumber(date) - dayNumber(today) : null;
  const weekday = new Date(dayNumber(date) * 86400000).getUTCDay();
  if (ahead === 0) return "today";
  if (ahead === 1) return "tomorrow";
  if (ahead === -1) return "yesterday";
  if (ahead !== null && ahead > 1 && ahead < 7) return WEEKDAYS[weekday];
  return `${WEEKDAYS[weekday].slice(0, 3)} ${+date.slice(8, 10)} ${MONTHS[+date.slice(5, 7) - 1]}`;
}

// "Tuesday 18:00", "Tuesday" when back at the start of the day, "18:00" today.
function when(iso, today) {
  const time = iso.slice(11, 16);
  const day = dayName(iso.slice(0, 10), today);
  if (time === "00:00") return day;
  return day === "today" ? time : `${day} ${time}`;
}

// Out since 09:10 today, or since another day.
function since(iso, today) {
  return iso.slice(0, 10) === today ? iso.slice(11, 16) : when(iso, today);
}

// "at 18:00" today, "tomorrow at 18:00", "on Tue 2 Dec at 18:00", "on Tuesday".
function at(iso, today) {
  const time = iso.slice(11, 16);
  const day = dayName(iso.slice(0, 10), today);
  const on = day === "tomorrow" || day === "yesterday" ? day : `on ${day}`;
  if (day === "today") return `at ${time}`;
  return time === "00:00" ? on : `${on} at ${time}`;
}

function personText(p, away) {
  const today = away.today;
  if (p.away && p.reason === "away_until") return [`Away until ${when(p.until, today)}.`, "Away", "away"];
  if (p.away) return [`Away since ${since(p.presence.since, today)}, from Home Assistant.`, "Away", "away"];
  if (p.until) {
    const back = when(p.until, today);
    return [`Due back ${/^\d/.test(back) ? "at " : ""}${back}. Warming up their rooms.`, "Due back", "back"];
  }
  // Fail warm: a not home Radiate doesn't trust, with the server's reason in words.
  if (p.presence?.uncertain && p.presence.why) {
    const label = p.presence.uncertain === "evidence_old" ? "No update" : "Home";
    return [p.presence.why, label, p.presence.uncertain === "evidence_old" ? "stale" : ""];
  }
  // Not reported within the stale limit: unknown, which Radiate treats as home.
  if (p.presence?.stale) {
    const limit = house?.household?.away?.presence_stale_after_min;
    const gap = limit ? ` for over ${span(limit)}` : " lately";
    return [`Home Assistant hasn't reported${gap}, so Radiate treats them as home.`, "No update", "stale"];
  }
  if (p.presence?.state === "not_home") {
    const delay = away.presence_delay_min;
    const after = delay != null ? ` Counts as away after ${span(delay)}.` : "";
    return [`Out since ${since(p.presence.since, today)}.${after}`, "Out", ""];
  }
  return ["Home.", "Home", ""];
}

// Per person: whether the away form is open, and the state of Back now and Save.
const personUi = new Map();
function ui(id) {
  if (!personUi.has(id)) personUi.set(id, { form: false, clearing: false, clearError: "", saving: false, saveError: "" });
  return personUi.get(id);
}
const personCard = (id) => $("people-list").querySelector(`[data-person="${CSS.escape(id)}"]`);

function openAway(p) {
  ui(p.id).form = true;
  ui(p.id).saveError = "";
  renderPeople(last?.away);
  const card = personCard(p.id);
  const date = card?.querySelector("wa-input[name=date]");
  const today = last?.away?.today;
  if (date && today) {
    date.min = today;
    if (!date.value) date.value = new Date((dayNumber(today) + 1) * 86400000).toISOString().slice(0, 10);
  }
  requestAnimationFrame(() => date?.focus());
}

function closeAway(p) {
  ui(p.id).form = false;
  ui(p.id).saveError = "";
  renderPeople(last?.away);
  requestAnimationFrame(() => personCard(p.id)?.querySelector(".away-open")?.focus());
}

async function saveAway(e, p) {
  e.preventDefault();
  const form = e.currentTarget;
  const date = form.querySelector("wa-input[name=date]").value;
  const time = form.querySelector("wa-input[name=time]").value;
  if (!date) return;
  const until = time ? `${date}T${time}` : date;
  const u = ui(p.id);
  u.saving = true;
  u.saveError = "";
  renderPeople(last?.away);
  try {
    await post(`people/${p.id}/away`, { until });
  } catch (err) {
    u.saving = false;
    const text = String(err?.message ?? "");
    u.saveError = text.includes("in the future")
      ? "Not saved: pick a time that has not passed."
      : text.includes("within") ? "Not saved: pick a date in the next 60 days." : failText(err);
    renderPeople(last?.away);
    return;
  }
  u.saving = false;
  for (const el of form.querySelectorAll("wa-input")) el.value = "";
  toast(`${p.name} is away until ${when(until.length > 10 ? until : `${until}T00:00`, last?.away?.today)}.`);
  closeAway(p);
  refresh();
}

// "I'm home": ends an away until and sets aside a not home from Home Assistant until
// their presence next changes. An older server without the route: clear the away until.
async function backNow(p) {
  const u = ui(p.id);
  u.clearing = true;
  u.clearError = "";
  renderPeople(last?.away);
  try {
    await post(`people/${p.id}/home`, {});
  } catch (err) {
    // 404 is an older server without the route; anything else is a refusal to show.
    try {
      if (!/HTTP 404/.test(String(err?.message))) throw err;
      await post(`people/${p.id}/away`, { until: null });
    } catch (err2) {
      u.clearError = failText(err2);
    }
  }
  if (!u.clearError) toast(`${p.name} is home.`);
  u.clearing = false;
  renderPeople(last?.away);
  await refresh();
}

function personTemplate(p, away) {
  const u = ui(p.id);
  const why = lockText("household");
  if (why) u.form = false;
  const [text, label, kind] = personText(p, away);
  return html`
    <wa-card class="person" data-person=${p.id}>
      <div slot="header" class="wa-split wa-gap-xs">
        <h3 class="wa-heading-s">${p.name}</h3>
        ${badge(label, kind)}
      </div>
      <div class="wa-stack wa-gap-s">
        <p class="person-state">${text}</p>
        ${u.form ? html`
          <form class="away-form wa-stack wa-gap-s" @submit=${(e) => saveAway(e, p)} @keydown=${(e) => { if (e.key === "Escape") closeAway(p); }}>
            <div class="wa-cluster wa-gap-s">
              <wa-input type="date" name="date" label="Away until" required></wa-input>
              <wa-input type="time" name="time" label="Back at" hint="Optional"></wa-input>
            </div>
            <p class="wa-caption-m wa-color-text-quiet">Without a time, they count as back from the start of that day.</p>
            <div class="wa-cluster wa-gap-xs">
              <wa-button type="submit" variant="brand" size="s" ?loading=${u.saving} ?disabled=${u.saving}>Save</wa-button>
              <wa-button size="s" appearance="outlined" @click=${() => closeAway(p)}>Cancel</wa-button>
            </div>
            <p class="error-line away-error" role="alert" ?hidden=${!u.saveError}>${u.saveError}</p>
          </form>` : html`
          <div class="wa-cluster wa-gap-xs wa-align-items-center">
            <wa-button size="s" appearance="outlined" class="away-open" ?disabled=${Boolean(why)}
              aria-label=${p.until ? `Change when ${p.name} is back` : `Set ${p.name} away`}
              @click=${() => openAway(p)}>${p.until ? "Change" : "Set away"}</wa-button>
            ${!why && (p.until || p.away) ? html`<wa-button size="s" appearance="plain" aria-label="${p.name} is back now"
              ?loading=${u.clearing} ?disabled=${u.clearing} @click=${() => backNow(p)}>Back now</wa-button>` : nothing}
            ${why ? html`<wa-tag size="s" class="lock-tag">${why}</wa-tag>` : nothing}
          </div>`}
        <p class="error-line person-error" role="alert" ?hidden=${!u.clearError}>${u.clearError}</p>
      </div>
    </wa-card>`;
}

function renderPeople(away) {
  const list = away?.people ?? [];
  $("people-empty").hidden = list.length > 0;
  $("away-note").hidden = !away?.frost;
  // A known return within the return warm-up: rooms may already be warming for it.
  const ret = away?.return;
  const returnNote = $("return-note");
  returnNote.hidden = !ret;
  if (ret) {
    const due = list.filter((p) => p.until && p.until.slice(0, 16) === ret.at.slice(0, 16));
    const who = due.length ? due : list.filter((p) => p.until);
    const whose = who.length ? `${names(who.map((p) => p.name))}'s return` : "a return";
    returnNote.textContent = `Warming up for ${whose} ${at(ret.at, away.today)}.`;
  }
  draw(html`${list.map((p) => personTemplate(p, away))}`, $("people-list"));
  if (document.body.dataset.view === "schedules") schedulesView.show();
}
const peopleView = { show() {}, hide() {} };

// ---------- schedules ----------

// Schedules: the week each room follows (week.js). Weeks change rarely, so they are
// fetched, not streamed: at start, when who is away changes, after midnight and every
// 10 minutes. Each state moves the now marker. An older server without the route
// answers 404 and the section stays hidden.
const WEEK_REFRESH_MS = 10 * 60 * 1000;
// The house model, the house now and today's plan (house.js).
const houseView = createHouse({
  modelEl: $("hm-model"),
  statusEl: $("hm-status"),
  planEl: $("hm-plan"),
  transport,
  arrangeLock: () => lockText("admin"),
  onSelect: (id, opener) => select(id, opener),
  onWeek: () => { location.hash = "#schedules"; },
});
new MutationObserver(() => houseView.redraw()).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
if (document.fonts?.ready) document.fonts.ready.then(() => houseView.redraw());

const week = weekView({ list: $("week-list"), legendEl: $("week-legend"), frostEl: $("week-frost"), hintEl: $("week-hint") });
const weekSync = { key: null, minute: null, at: 0, loading: false, again: false, gone: false, shown: false };
let weekEditing = false;

// Room adjustments (week.js): dragging an edge or the Adjust form changes the
// household section, through the setup's routes. Offered when the server offers the
// setup; an AuthError asks to sign in, like everything else.
async function householdCall(method, path, body) {
  try {
    return await transport.call(method, path, body);
  } catch (err) {
    if (err instanceof AuthError) askForToken();
    throw err;
  }
}
const weekEditor = {
  async household() {
    const res = await householdCall("GET", "household");
    if (res.status !== 200) throw new Error(`household: HTTP ${res.status}`);
    return res.body;
  },
  async preview(section) {
    const res = await householdCall("POST", "household/preview", { household: section });
    if (res.status !== 200) throw new Error(`household/preview: HTTP ${res.status}`);
    return res.body;
  },
  save: (section) => householdCall("PUT", "household", { household: section }),
  async saved(message) {
    const note = $("week-saved");
    // Always in the page and empty when quiet, so screen readers hear each message.
    note.textContent = message;
    clearTimeout(note.timer);
    note.timer = setTimeout(() => { note.textContent = ""; }, 15000);
    weekSync.key = null;
    await loadWeek();
    try { house = await transport.house(); } catch { /* the next render retries */ }
    renderSetupEntry();
  },
  time: normaliseTime,
};

async function loadWeek() {
  if (weekSync.gone || !transport.get) return;
  // Asked while a fetch is under way (a save, say): fetch again once it is back, as
  // the one under way may be from before the change.
  if (weekSync.loading) { weekSync.again = true; return; }
  weekSync.loading = true;
  weekSync.again = false;
  weekSync.at = Date.now();
  try {
    const view = await transport.get("schedules");
    $("week").hidden = !view.rooms.length;
    week.update(view);
    houseView.week(view);
    weekSync.shown = true;
    if (last) week.tick(last.minute_of_day);
  } catch (err) {
    if (/HTTP 404|not found/.test(String(err?.message))) weekSync.gone = true;
    else if (err instanceof AuthError) askForToken();
    else weekSync.at = Date.now() - WEEK_REFRESH_MS + 30000; // try again in 30 s
  }
  weekSync.loading = false;
  if (weekSync.again) await loadWeek();
}

function syncWeek(s) {
  const key = JSON.stringify([s.away?.everyone, (s.away?.people ?? []).map((p) => [p.id, p.away])]);
  const midnight = weekSync.minute != null && s.minute_of_day < weekSync.minute;
  weekSync.minute = s.minute_of_day;
  if (key !== weekSync.key || midnight || Date.now() - weekSync.at > WEEK_REFRESH_MS) {
    weekSync.key = key;
    loadWeek();
  } else if (weekSync.shown) {
    week.tick(s.minute_of_day);
  }
}

function lane(el, intervals, window) {
  el.textContent = "";
  for (const [a, b] of intervals) {
    const left = Math.max(0, (a + window) / window) * 100;
    const right = Math.max(0, (b + window) / window) * 100;
    if (right <= 0) continue;
    const i = document.createElement("i");
    i.style.left = `${left}%`;
    i.style.width = `${Math.max(0.3, right - left)}%`;
    el.appendChild(i);
  }
}

// The live driver raises `driver.shelly` when it can't reach the boiler relay. Radiate
// then can neither see nor switch the boiler, so nothing it shows about the burner holds.
function relayLost(s) {
  return !s.telemetry?.simulated && (s.alert_details ?? []).some((a) => a.code === "driver.shelly");
}

const CHIP = {
  idle: ["Idle", "neutral"],
  lead: ["Opening valves", "warning"],
  firing: ["Firing", "brand"],
  rest: ["Resting", "cool"],
};

function render(s) {
  last = s;
  if (document.body.dataset.link === "stale") toast("Connected to Radiate again.");
  delete document.body.dataset.link;
  const b = s.boiler;
  const firing = b.state === "firing";
  const minBurn = house?.boiler.min_burn_s ?? 480;
  // Effective minimum off: raised for a day after short-cycling. Older servers only
  // report the configured value, in /house.
  const minOff = b.min_off_s ?? house?.boiler.min_off_s ?? 600;
  const status = statusLine(s, minBurn);
  $("status").textContent = status;
  $("outdoor").textContent = s.outdoor != null ? `Outside ${s.outdoor.toFixed(1)}°` : "";
  renderMode(s.mode);
  renderDemand(s.settings);

  const chip = $("boiler-chip");
  const lost = relayLost(s);
  const [chipText, chipKind] = lost ? ["Not reachable", "warning"] : CHIP[b.state] ?? ["–", "neutral"];
  chip.textContent = chipText;
  chip.dataset.state = lost ? "lost" : b.state;
  chip.classList.toggle("radiate-cool", chipKind === "cool");
  if (chipKind === "cool") chip.removeAttribute("variant");
  else chip.variant = chipKind;
  let frac = 0;
  if (firing) frac = Math.min(1, b.burn_elapsed_s / minBurn);
  if (b.state === "rest") frac = Math.min(1, b.state_elapsed_s / minOff);
  const guard = $("guard");
  guard.value = Math.round(frac * 100);
  guard.dataset.kind = b.state;
  guard.label = firing ? "Minimum burn" : b.state === "rest" ? "Minimum off" : "Minimum burn or rest";
  $("guard-row").hidden = !(firing || b.state === "rest");
  $("boiler-detail").textContent = firing
    ? b.burn_elapsed_s < minBurn ? `Minimum burn: ${mins(minBurn - b.burn_elapsed_s)} to go` : "Minimum burn met"
    : b.state === "rest" ? `${mins(Math.max(0, minOff - b.state_elapsed_s))} until it may start again` : "";
  renderBoost(s.store.boost);

  lane(document.querySelector(".lane.burns"), s.timeline.burns, s.timeline.window_s);
  lane(document.querySelector(".lane.store"), s.timeline.store, s.timeline.window_s);
  $("s-starts").textContent = `${b.starts_last_hour}`;
  $("s-pred").textContent = b.predicted_burn_min ? `${b.predicted_burn_min} min` : "–";
  renderAccounting(s);
  if (lost) $("s-today-sub").textContent = "Not counted while the relay can't be reached";
  $("s-supply").textContent = b.supply != null ? b.supply.toFixed(2) : "–";
  renderShortCycle(b);

  const banner = $("banner");
  if (s.telemetry?.simulated) {
    banner.hidden = false;
    draw(html`Demo: simulated reference house, ${clock(s.minute_of_day)} simulated time.<span class="note-long"> Boiler water ${s.telemetry.boiler_water_c}°, store ${s.telemetry.store_c}°, stairs ${s.telemetry.stairs_c}°.</span>`, $("banner-text"));
  }
  renderDryRun(s.telemetry);
  renderLearningNotes(s.learning_notes);
  renderPeople(s.away);
  rooms.clear();
  for (const r of s.rooms) {
    rooms.set(r.id, r);
    settle(r);
  }
  if (selected && !rooms.has(selected)) selected = null;
  renderHouse();
  renderHero(s, status);
  renderDeviceCount(s.alert_details);
  houseView.update(s, house);
  syncWeek(s);

  lastAt = new Date();
  if (!house) loadHouse();
}

// Why the burner is doing what it is doing, point first. When no room is calling,
// say what the heat is for, so a long burn with every room comfortable makes sense.
function statusLine(s, minBurn) {
  const b = s.boiler;
  const active = s.rooms.filter((r) => !OBSERVED_ONLY.has(r.role));
  const calling = active.filter((r) => r.calling).map((r) => r.name);
  const extending = active.filter((r) => !r.calling && r.topup && r.extend === true).map((r) => r.name);
  const sinks = active.filter((r) => !r.calling && r.topup && r.extend !== true).map((r) => r.name);
  const waiting = active.filter(pooled).map((r) => r.name);
  const water = s.store?.relay ? " Hot water on." : "";
  // Without a boiler relay configured Radiate cannot know or switch the boiler, so
  // never claim it is idle. Older servers don't send `boiler_linked`.
  if (s.telemetry && !s.telemetry.simulated && s.telemetry.boiler_linked === false) {
    if (!calling.length) return "No room needs heat. The boiler switch isn't linked yet.";
    return `${names(calling)} ${calling.length === 1 ? "wants" : "want"} heat. The boiler switch isn't linked yet, so the boiler follows its own timer.`;
  }
  // The watchdog script on the Shelly takes over once Radiate's heartbeat stops, so the
  // boiler may be running on its fallback windows even though Radiate shows no burns.
  if (relayLost(s)) {
    return "Radiate can't reach the boiler relay, so it can't see or switch the boiler. If its watchdog is installed, the Shelly runs the heating on its own schedule until Radiate reconnects.";
  }
  const on = `Burner on for ${mins(b.burn_elapsed_s)}`;
  const extend = (list) => `topping up ${names(list)} to save a second burn soon`;
  switch (b.state) {
    case "idle":
      if (waiting.length) {
        const verb = waiting.length === 1 ? "is" : "are";
        return `Boiler idle. ${names(waiting)} ${verb} waiting to share a burn with other rooms.${water}`;
      }
      // Quiet hours (spec 5.10). Older servers don't send `quiet`.
      if (s.quiet?.active) return `Quiet hours until ${s.quiet.until}. Heating only to keep rooms above 12°.${water}`;
      return water ? `Heating idle.${water}` : "Boiler idle. Rooms are within comfort.";
    case "lead":
      return `Opening valves before calling the burner.${calling.length ? ` Heating ${names(calling)}.` : ""}${water}`;
    case "rest":
      return `Burner resting: minimum off time, ${mins(b.state_elapsed_s)} so far.${water}`;
    case "firing":
      if (calling.length) {
        const also = extending.length ? ` Also ${extend(extending)}.` : "";
        return `${on}. Heating ${names(calling)}.${also}${water}`;
      }
      if (extending.length) return `${on}, ${extend(extending)}.${water}`;
      if (b.burn_elapsed_s < minBurn) {
        const into = sinks.length ? `, with the heat going to ${names(sinks)}` : "";
        return `${on} to finish its minimum burn${into}.${water}`;
      }
      return `${on}. Stopping now that rooms are warm.${water}`;
    default:
      return "";
  }
}

// Accounting per local day (spec 5.6). Absent on older servers, and today's values
// are partial, so every field may be missing or null.
function renderAccounting(s) {
  const today = s.accounting?.today;
  const yesterday = s.accounting?.yesterday;
  const label = $("s-today-label");
  if (today) {
    label.textContent = "Burner today";
    $("s-today").textContent = today.burner_hours != null ? `${today.burner_hours.toFixed(1)} h` : "–";
    const parts = [];
    if (today.starts != null) parts.push(plural(today.starts, "start", "starts"));
    if (today.litres != null) parts.push(`${today.litres.toFixed(1)} L`);
    if (today.kwh != null) parts.push(`${Math.round(today.kwh)} kWh`);
    $("s-today-sub").textContent = parts.join(", ");
  } else {
    label.textContent = "Burner hours";
    const total = s.telemetry?.burner_hours;
    $("s-today").textContent = total != null ? total.toFixed(1) : "–";
    $("s-today-sub").textContent = "";
  }
  const balance = yesterday?.balance;
  $("s-balance").textContent = balance?.score != null ? `${Math.round(balance.score)}/100` : "–";
  let note = "No full day yet";
  if (yesterday) note = balance?.score != null ? "" : "No burns with two or more rooms";
  if (balance?.arrival_spread_min != null) note = `Last room ${Math.round(balance.arrival_spread_min)} min after the first`;
  // Radiate started after midnight or was down for a while: no score for that day.
  if (yesterday?.partial) note = "Not a full day of data";
  $("s-balance-sub").textContent = note;
}

function renderShortCycle(b) {
  const sc = b.short_cycle;
  const box = $("short-cycle");
  box.hidden = !sc;
  if (!sc) return;
  const off = b.min_off_s != null ? `${Math.round(b.min_off_s / 60)} min` : null;
  const raised = off ? `Minimum off raised to ${off}` : `Minimum off raised by ${sc.extra_off_min} min`;
  const ends = sc.ends_in_h != null ? ` for the next ${span(Math.max(1, Math.round(sc.ends_in_h * 60)))}` : "";
  $("short-cycle-text").textContent = `${raised}${ends}, so the burner starts less often.`;
}

// Demand mode (spec 5.3): eco pools rooms into fewer, longer burns; comfort holds every
// room at its target. Servers without `settings` cannot change it, so the control hides.
// A press shows at once and is held until a state confirms it. Choosing the configured
// default sends null, so the server follows its configuration file again.
const DEMAND_NOTE = {
  eco: "fewer, longer burns. Rooms might warm a bit later.",
  comfort: "every room held at its target, with more burns.",
};
const demand = pendingValue();

function renderDemand(settings) {
  const group = $("demand");
  const note = $("demand-note");
  const known = settings && DEMAND_NOTE[settings.demand_mode];
  group.hidden = !known;
  if (last) renderHeroSummary(last);
  if (!known) return;
  const shown = demand.shown(settings.demand_mode);
  if (group.value !== shown) group.value = shown;
  group.setAttribute("aria-busy", String(demand.busy));
  // The control names the mode, so the note only says what it does, and starts
  // "Default:" while it follows the configuration file.
  const text = DEMAND_NOTE[shown];
  note.dataset.error = String(Boolean(demand.error));
  note.textContent = demand.error || (shown === settings.demand_mode_default
    ? `Default: ${text}`
    : text[0].toUpperCase() + text.slice(1));
}

$("demand").addEventListener("change", (e) => {
  const settings = last?.settings;
  const value = e.target.value;
  if (!settings || value === demand.shown(settings.demand_mode)) return;
  change(demand, value, "settings", { demand_mode: value === settings.demand_mode_default ? null : value }, () => {
    if (last?.settings) renderDemand(last.settings);
  }).then((took) => took && toast(value === "eco" ? "Eco: fewer, longer burns." : "Comfort: every room held at its target."));
});

// Learning notes (ADR-0007): learned state Radiate dropped, carried over or reset in the
// last 14 days, newest first.
let learningKey = "";
function renderLearningNotes(notes = []) {
  const key = JSON.stringify(notes);
  if (key === learningKey) return;
  learningKey = key;
  const box = $("learning-notes");
  box.hidden = !notes.length;
  if (box.hidden) return;
  const resets = new Set(notes.filter((n) => n.room_id).map((n) => n.room_id)).size;
  $("learning-notes-lead").textContent = resets
    ? `${plural(resets, "room's learning was", "rooms' learning was")} reset recently. Those rooms learn again from their next burns.`
    : "Radiate changed what it had learned when it last started.";
  draw(html`${[...notes].reverse().map((n) => html`<li><span class="payload">${new Date(n.at * 1000).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  })}</span> <span>${n.message}</span></li>`)}`, box.querySelector("ul"));
}

// Dry run: the live driver reads devices but holds back every write.
let intendedKey = "";
function renderDryRun(t) {
  const box = $("dryrun");
  box.hidden = !t?.dry_run;
  if (box.hidden) return;
  const valves = t.intended_writes ?? 0;
  const boiler = t.shelly_intended;
  const held = boiler != null
    ? `${plural(valves, "valve write", "valve writes")} and ${plural(boiler, "boiler command", "boiler commands")}`
    : plural(valves, "valve write", "valve writes");
  $("dryrun-count").textContent = valves || boiler ? `Held back so far: ${held}.` : "Nothing held back yet.";

  const recent = t.recent_intended ?? [];
  const key = JSON.stringify(recent);
  if (key === intendedKey) return;
  intendedKey = key;
  const details = $("dryrun-recent");
  details.hidden = !recent.length;
  draw(html`${[...recent].reverse().map((w) => html`<li><code>${w.topic}</code> <code class="payload">${typeof w.payload === "string" ? w.payload : JSON.stringify(w.payload)}</code></li>`)}`, details.querySelector("ul"));
}

// The heating mode and the hot-water boost. A press shows at once (pending.js), and
// the server's state follows straight after, not at the next tick.
const heating = pendingValue();
function renderMode(mode) {
  const group = $("mode");
  const shown = heating.shown(mode);
  if (group.value !== shown) group.value = shown;
  group.setAttribute("aria-busy", String(heating.busy));
  showError($("mode-error"), heating.error);
  if (last) renderHeroSummary(last);
}
$("mode").addEventListener("change", (e) => {
  const mode = e.target.value;
  if (!last || mode === heating.shown(last.mode)) return;
  change(heating, mode, "mode", { mode }, () => last && renderMode(last.mode))
    .then((took) => took && toast({ auto: "Heating: Auto. Rooms follow their schedules.", frost: "Heating: Frost protection only.", off: "Heating off. Rooms are still kept above frost." }[mode]));
});

const boost = pendingValue();
function renderBoost(on) {
  const sw = $("boost");
  const shown = Boolean(boost.shown(on));
  if (sw.checked !== shown) sw.checked = shown;
  sw.setAttribute("aria-busy", String(boost.busy));
  showError($("boost-error"), boost.error);
  if (last) renderHeroSummary(last);
}
$("boost").addEventListener("change", () => {
  if (!last) return;
  const on = !boost.shown(last.store.boost);
  change(boost, on, "store/boost", { minutes: on ? 60 : 0 }, () => last && renderBoost(last.store.boost))
    .then((took) => took && toast(on ? "Hot water on for 60 minutes." : "Hot water boost stopped."));
});

// Connection state. While the live stream is down, poll once per reconnect attempt;
// if that fails too, dim the page and say how old the data is. The next state that
// arrives, from either path, clears it.
function markOffline() {
  if (!last) {
    $("status").textContent = "Cannot reach Radiate. Retrying…";
    $("hero-title").textContent = "Cannot reach Radiate";
    $("hero-why").textContent = "Retrying…";
    $("hero").dataset.tone = "warning";
    $("hero-icon").name = HERO.stale.icon;
    return;
  }
  document.body.dataset.link = "stale";
  const at = `${String(lastAt.getHours()).padStart(2, "0")}:${String(lastAt.getMinutes()).padStart(2, "0")}`;
  $("status").textContent = `Cannot reach Radiate. Retrying… Showing data from ${at}.`;
  renderHero(last, $("status").textContent);
}

async function poll() {
  try {
    render(await transport.state());
    return true;
  } catch (err) {
    if (err instanceof AuthError) askForToken();
    else markOffline();
    return false;
  }
}

function onLink(link) {
  if (link === "lost") poll();
  else if (link === "auth") askForToken();
}

let houseLoading = false;
async function loadHouse() {
  if (houseLoading) return;
  houseLoading = true;
  try {
    house = await transport.house();
    renderSetupEntry();
  } catch { /* retried on the next render */ }
  houseLoading = false;
}

// Household setup (setup.js). Without a household, a call to action above the rooms;
// with one, "Change household setup" beside the People heading. A server without the
// setup routes answers 404 and neither shows.
let setupOffered = null; // a promise of whether the server offers the setup
let setupOpener = null;
const setup = createSetup({
  transport,
  onOpen() {
    for (const el of document.querySelectorAll("main > .view, main > section[aria-labelledby]")) if (el.id !== "setup") el.hidden = true;
    document.body.dataset.setup = "open";
    window.scrollTo(0, 0);
  },
  onClose() {
    delete document.body.dataset.setup;
    route(false);
    if (setupOpener && !setupOpener.closest("[hidden]")) setupOpener.focus();
    setupOpener = null;
  },
  async onSaved(message) {
    delete document.body.dataset.setup;
    route(false);
    const note = $("setup-saved");
    note.textContent = message;
    note.hidden = false;
    note.focus();
    clearTimeout(note.timer);
    note.timer = setTimeout(() => { note.hidden = true; }, 15000);
    weekSync.key = null; // fetch the new weeks now
    try { house = await transport.house(); } catch { /* the next render retries */ }
    renderSetupEntry();
    refresh();
    savings.refresh();
  },
});

async function renderSetupEntry() {
  setupOffered ??= setup.available();
  const offered = await setupOffered;
  if (offered === null) setupOffered = null; // ask again next time, after signing in say
  const has = Boolean(house?.household);
  $("setup-cta").hidden = !offered || has;
  $("setup-change-row").hidden = !offered || !has;
  // The setup (people, routines, temperatures) is an admin's; room adjustments in the
  // week view are the household role's too.
  lock([$("setup-start")], $("setup-start-lock"), "admin");
  lock([$("setup-change")], $("setup-change-lock"), "admin");
  const weekLock = $("week-lock");
  weekLock.hidden = !offered || may("household");
  weekLock.textContent = lockText("household");
  if (offered && !weekEditing && may("household")) {
    weekEditing = true;
    week.setEditor(weekEditor);
    weekSync.key = null; // draw the weeks again, now with edges to drag
    loadWeek();
  }
}

async function openSetup(e) {
  setupOpener = e.currentTarget;
  try {
    await setup.open();
  } catch (err) {
    if (err instanceof AuthError) { askForToken(); return; }
    const note = $("setup-saved");
    note.textContent = "Couldn't open the household setup. Try again in a moment.";
    note.hidden = false;
  }
}
$("setup-start").addEventListener("click", openSetup);
$("setup-change").addEventListener("click", openSetup);

// Devices view (devices.js): the health of every device, at #devices. Its link shows
// once the server says it reports devices; a server without the route answers 404.
const devices = createDevices({
  transport,
  scanLock: () => lockText("admin"),
  isAuthError: (err) => err instanceof AuthError,
  onAuth: () => askForToken(),
});
let devicesOffered = null;
const DEVICE_ALERTS = /^(device\.|driver\.trv_offline$|driver\.shelly$)/;

function renderDeviceCount(details) {
  const n = (details ?? []).filter((a) => DEVICE_ALERTS.test(a.code)).length;
  houseView.devices(n);
  const count = $("devices-count");
  count.hidden = !n;
  count.textContent = String(n);
  const tab = document.querySelector('.view-tab[data-view="devices"]');
  if (n) tab.setAttribute("aria-label", `Devices, ${n} ${n === 1 ? "needs" : "need"} attention`);
  else tab.removeAttribute("aria-label");
}

// Suggestions view (suggestions.js): advice from what Radiate has learned, at
// #suggestions. Its link shows once the server answers `GET suggestions`, with a count
// of the suggestions to act on.
const suggestions = createSuggestions({
  transport,
  isAuthError: (err) => err instanceof AuthError,
  onAuth: () => askForToken(),
  onCount: renderSuggestionCount,
});
let suggestionsOffered = null;

function renderSuggestionCount(n) {
  const count = $("suggestions-count");
  count.hidden = !n;
  count.textContent = String(n);
  const tab = document.querySelector('.view-tab[data-view="suggestions"]');
  if (n) tab.setAttribute("aria-label", `Suggestions, ${n} to act on`);
  else tab.removeAttribute("aria-label");
}

// Savings view (savings.js): the oil saved against the baseline, with comfort beside
// it, at #savings. Its link shows once the server answers `GET savings`. Once there
// are figures, the headline also sits on the House view as one line linking to it.
let savingsWhy = null;
const savings = createSavings({
  transport,
  isAuthError: (err) => err instanceof AuthError,
  onAuth: () => askForToken(),
  onView: (v) => {
    const line = houseLine(v);
    $("savings-line").hidden = !line;
    if ($("savings-line-link").textContent !== line) $("savings-line-link").textContent = line;
    savingsWhy = v.status === "unavailable" ? v.why : null;
    renderSavingsSetup();
  },
});
let savingsOffered = null;

// Without a household, the Savings view offers the setup, where the server has one.
async function renderSavingsSetup() {
  const offered = savingsWhy === "no household" && setupOffered ? await setupOffered : false;
  $("savings-setup-row").hidden = !offered;
  lock([$("savings-setup")], $("savings-setup-lock"), "admin");
}
// The setup replaces the House view, so go there first; Back then returns to it.
$("savings-setup").addEventListener("click", (e) => {
  history.replaceState(null, "", "#");
  route(false);
  openSetup(e);
});

// Raw data view (data.js): every recorded series, to search, chart and download, with
// the OpenTelemetry export's health, at #data. Its link shows once the server answers
// `GET data/series` with a history to search.
const rawData = createData({
  transport,
  isAuthError: (err) => err instanceof AuthError,
  onAuth: () => askForToken(),
});
let dataOffered = null;

// Security log (security.js): the last section of the Settings view, for admins only.
// The server answers GET audit only for an admin, so the section stays hidden for
// others. Raw data shows sensor data only.
const security = createSecurity({
  transport,
  isAuthError: (err) => err instanceof AuthError,
  onAuth: () => askForToken(),
});

// Home Assistant (homeassistant.js): the dashboard to copy into Home Assistant, a
// section of the Settings view before the security log. Every role may read it.
const homeAssistant = createHomeAssistant({
  transport,
  isAuthError: (err) => err instanceof AuthError,
  onAuth: () => askForToken(),
});

// Guide view (guide.js): how to read and work Radiate, at #guide, with each section
// at #guide/<name>. Static text, so it is always offered.
const guide = createGuide({ root: $("guide") });
guideNote({ note: $("guide-note"), tab: document.querySelector('.view-tab[data-view="guide"]') });

// Settings view (settings.js): every house-file setting, at #settings, with each
// section at #settings/<id>. Its link shows once the server answers
// `GET settings/config`. The household and the schedules are edited where they
// already are, so their sections open the setup or show the Schedules section.
const settings = createSettings({
  transport,
  isAuthError: (err) => err instanceof AuthError,
  onAuth: () => askForToken(),
  onOpenSetup: (e) => {
    history.replaceState(null, "", "#");
    route(false);
    openSetup(e);
  },
  onShowSchedules: () => { location.hash = "#schedules"; },
  moreSections: () => [
    ...(homeAssistant.offered ? [{ id: "home-assistant", title: "Home Assistant" }] : []),
    ...(security.offered ? [{ id: "security-log", title: "Security log" }] : []),
  ],
});
const settingsView = {
  show() { settings.show(); homeAssistant.show(); security.show(); },
  hide() { settings.hide(); homeAssistant.hide(); security.hide(); },
};
let settingsOffered = null;

// Each view besides the house: its element, whether the server offers it, and its module.
const schedulesView = {
  show() {
    const empty = $("week").hidden && $("setup-cta").hidden;
    $("schedules-empty").hidden = !empty;
  },
  hide() {},
};
const VIEWS = {
  schedules: { offered: () => true, module: schedulesView },
  people: { offered: () => true, module: peopleView },
  devices: { offered: () => devicesOffered === true, module: devices },
  suggestions: { offered: () => suggestionsOffered === true, module: suggestions },
  savings: { offered: () => savingsOffered === true, module: savings },
  settings: { offered: () => settingsOffered === true, module: settingsView },
  data: { offered: () => dataOffered === true, module: rawData },
  guide: { offered: () => true, module: guide },
};

// The view is the part of the hash before any slash; the rest names a part of the
// view (only the guide's and settings' sections use it). An unknown view is the house.
function route(fromUser) {
  if (document.body.dataset.setup === "open") return;
  const [name, part] = location.hash.slice(1).split("/");
  const current = VIEWS[name]?.offered() ? name : "house";
  for (const tab of document.querySelectorAll(".view-tab")) {
    if (tab.dataset.view === current) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }
  $("house").hidden = current !== "house";
  for (const [id, v] of Object.entries(VIEWS)) {
    $(id).hidden = id !== current;
    if (id === current) v.module.show();
    else v.module.hide();
  }
  document.body.dataset.view = current;
  document.querySelector("wa-page").dataset.view = current;
  // A link to a guide or settings section, also when the page opens on one.
  if (current === "guide" && guide.reveal(part)) return;
  if (current === "settings" && settings.reveal(part)) return;
  // Opening on #devices or #guide, the browser has jumped to the view's element,
  // which leaves its heading under the sticky header. Start at the top instead.
  if (!fromUser && current !== "house") window.scrollTo(0, 0);
  if (fromUser) {
    window.scrollTo(0, 0);
    // Keyboard and screen reader users land on the new view's heading.
    $(`${current}-h`)?.focus();
  }
}
window.addEventListener("hashchange", () => route(true));
// A link to the hash already showing fires no hashchange, so a second press on a guide
// section link would do nothing. Route it again.
document.addEventListener("click", (e) => {
  const a = e.target.closest?.('a[href^="#"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.hash === location.hash && (a.hash.startsWith("#guide") || a.hash.startsWith("#settings/"))) {
    e.preventDefault();
    route(true);
  }
});

// A view's link shows once the server offers it. House and Guide always show.
function renderTabs() {
  for (const [id, v] of Object.entries(VIEWS)) {
    document.querySelector(`.view-tab[data-view="${id}"]`).hidden = !v.offered();
  }
}

async function offerViews() {
  const [d, s, v, c, r] = await Promise.all([
    devicesOffered === true ? true : devices.available(),
    suggestionsOffered === true ? true : suggestions.available(),
    savingsOffered === true ? true : savings.available(),
    settingsOffered === true ? true : settings.available(),
    dataOffered === true ? true : rawData.available(),
    security.available(),
    homeAssistant.offered ? true : homeAssistant.available(),
  ]);
  devicesOffered = d;
  suggestionsOffered = s;
  savingsOffered = v;
  settingsOffered = c;
  dataOffered = r;
  renderTabs();
  renderDeviceCount(last?.alert_details);
  route(false);
}

// Login (ADR-0006): when the server has it on, someone without a session goes to the
// login page, and someone signed in gets the account menu. Token and ingress users don't.
let loginOn = false;
const loginUrl = () => new URL("login", document.baseURI).toString();

async function checkLogin() {
  if (document.documentElement.dataset.transport === "demo") return true;
  try {
    const res = await fetch(api("auth/config"));
    loginOn = res.ok && (await res.json()).login === true;
  } catch { loginOn = false; }
  if (!loginOn) return true;
  let me;
  try {
    me = await transport.get("auth/me");
  } catch (err) {
    if (err instanceof AuthError) { window.location.assign(loginUrl()); return false; }
    return true;
  }
  if (me.via === "session") showAccount(me);
  return true;
}

const ROLE_TEXT = {
  admin: "Admin: you can change anything here.",
  household: "Household: you can change temperatures, away, fires, boosts and room adjustments. Settings and the household setup need an admin.",
  viewer: "Read only: you can see the house but not change it.",
};

function showAccount(me) {
  transport.setCsrf(me.csrf);
  const how = me.method === "local" ? "a password" : "single sign-on";
  $("account-name").textContent = me.user;
  $("account-who").textContent = `Signed in as ${me.user} with ${how}.`;
  $("account-role").textContent = ROLE_TEXT[me.role] ?? ROLE_TEXT.viewer;
  role = me.role in RANK ? me.role : "viewer";
  document.body.dataset.role = role;
  applyRole();
  houseView.redraw();
  renderHouse();
  if (last) renderPeople(last.away);
  $("account").hidden = false;
}

$("account").addEventListener("wa-select", async (e) => {
  if (e.detail?.item?.value !== "sign-out") return;
  $("account-error").hidden = true;
  try {
    await transport.post("auth/logout", {});
  } catch (err) {
    if (!(err instanceof AuthError)) {
      $("account-error").hidden = false;
      return;
    }
  }
  window.location.assign(loginUrl());
});

async function start() {
  offerViews();
  if (!(await checkLogin())) return;
  if (fixture?.ROLE[fixture.name]) showAccount({ user: "sam", role: fixture.ROLE[fixture.name], method: "local", csrf: "" });
  try {
    house = await transport.house();
    renderSetupEntry();
  } catch (err) {
    if (err instanceof AuthError) { askForToken(); return; }
  }
  await poll();
  if (document.body.dataset.auth !== "needed") transport.subscribe(render, onLink);
}

// Sign-in: only reachable when the server has RADIATE_TOKEN set and the request did
// not come through Home Assistant ingress. The demo never gets here.
function askForToken() {
  if (loginOn) { window.location.assign(loginUrl()); return; }
  if (document.body.dataset.auth === "needed") return;
  const rejected = transport.hasToken();
  transport.setToken("");
  document.body.dataset.auth = "needed";
  $("signin").hidden = false;
  $("status").textContent = "Sign in to see the house.";
  const error = $("signin-error");
  error.hidden = !rejected;
  error.textContent = rejected ? "The saved token was not accepted. Enter it again." : "";
  requestAnimationFrame(() => $("signin-token").focus());
}

$("signin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("signin-token");
  const button = $("signin-form").querySelector("wa-button[type=submit]");
  const error = $("signin-error");
  const value = String(input.value ?? "").trim();
  error.hidden = true;
  if (!value) return;
  button.disabled = true;
  // A header can carry only printable ASCII, so anything else cannot be the token.
  const sendable = /^[\x21-\x7e]+$/.test(value);
  if (sendable) transport.setToken(value);
  try {
    if (!sendable) throw new AuthError("token");
    house = await transport.house();
  } catch (err) {
    button.disabled = false;
    error.hidden = false;
    if (err instanceof AuthError) {
      transport.setToken("");
      error.textContent = "That token was not accepted. Check it and try again.";
    } else {
      error.textContent = "Cannot reach Radiate. Try again in a moment.";
    }
    input.select();
    return;
  }
  button.disabled = false;
  input.value = "";
  $("signin").hidden = true;
  delete document.body.dataset.auth;
  $("status").textContent = "Connecting…";
  await start();
});

await start();
