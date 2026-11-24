// Radiate UI: renders /api/v1/state, live over WebSocket with polling fallback.
// Elements are created once and updated in place so transitions can retarget.
//
// All server traffic goes through a transport: { house(), state(), get(path),
// post(path, body), subscribe(onState, onLink) }. The default talks HTTP and WebSocket to the Radiate
// server and reports the link as "live", "lost" or "auth" through onLink. The static
// demo (<html data-transport="demo">) swaps in demo.js, which runs the same engine in
// a Web Worker, needs no token and never loses its link. Both share this one UI.

import { normaliseTime } from "./household.js";
import { createSetup } from "./setup.js";
import { weekView } from "./week.js";
import { createDevices } from "./devices.js";
import { createSuggestions } from "./suggestions.js";
import { createSavings, houseLine } from "./savings.js";
import { createHouse } from "./house.js";
import { createGuide, guideNote } from "./guide.js";

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

const cards = new Map();
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

async function post(path, body) {
  try {
    await transport.post(path, body);
  } catch (err) {
    if (err instanceof AuthError) askForToken();
    else console.error(err);
    throw err;
  }
}

// Eco demand mode (spec 5.3): a calling room on its own waits until other rooms join
// it, so the boiler fires once for all of them.
const pooled = (r) => r.reason_code === "demand.pooled";

function badgeFor(r) {
  if (r.role === "passive") return ["Bypass, not controlled", ""];
  if (r.role === "unheated") return ["No radiator", ""];
  if (r.fire) return ["Fire lit", "fire"];
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

const LEARNING = {
  fire: "learning paused: fire",
  fire_holdoff: "learning paused: fire cooling",
  window: "learning paused: window",
  shower: "learning paused: shower",
  cooker_spike: "learning paused: cooking",
  unexplained_heat: "learning paused: extra heat (sun or guests?)",
  store_recovery: "learning paused: hot water",
  setpoint_change: "settling",
  no_data: "gathering data",
  trv_offline: "TRV offline",
};

function ensureCard(r) {
  if (cards.has(r.id)) return cards.get(r.id);
  const node = $("room-tpl").content.firstElementChild.cloneNode(true);
  node.id = `room-${r.id}`;
  node.tabIndex = -1;
  node.querySelector(".name").textContent = r.name;
  node.dataset.passive = String(r.role === "passive");
  node.dataset.unheated = String(r.role === "unheated");
  const fire = node.querySelector(".fire");
  if (r.heat_source === "episodic") {
    fire.hidden = false;
    fire.addEventListener("click", async () => {
      const lit = fire.getAttribute("aria-pressed") !== "true";
      fire.setAttribute("aria-pressed", String(lit));
      try { await post(`rooms/${r.id}/fire`, { lit }); } catch { fire.setAttribute("aria-pressed", String(!lit)); }
    });
  }
  const stepper = node.querySelector(".stepper");
  stepper.setAttribute("aria-label", `${r.name} setpoint`);
  for (const btn of stepper.querySelectorAll(".step")) {
    const step = Number(btn.dataset.step);
    btn.setAttribute("aria-label", `${step < 0 ? "Lower" : "Raise"} ${r.name} setpoint by 0.5°`);
    btn.addEventListener("click", () => nudge(r.id, step));
  }
  node.querySelector(".hold-clear").addEventListener("click", () => resumeSchedule(r.id));
  $("rooms").appendChild(node);
  cards.set(r.id, node);
  return node;
}

// Setpoint control. Presses change the shown value at once and are sent together
// once the reader pauses, so five quick taps are one request, not five. The pending
// value stays until a state shows the server holding it.
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

function nudge(id, step) {
  const r = rooms.get(id);
  if (!r) return;
  const c = control(id);
  const base = heldSetpoint(r) ?? 20;
  const next = Math.min(SETPOINT_MAX, Math.max(SETPOINT_MIN, Math.round((base + step) * 2) / 2));
  if (next === base) return;
  c.pending = next;
  c.error = "";
  c.clearing = false;
  clearTimeout(c.timer);
  clearTimeout(c.expiry);
  c.timer = setTimeout(() => sendSetpoint(id), SEND_AFTER_MS);
  renderRoom(r);
}

async function sendSetpoint(id) {
  const c = control(id);
  c.timer = null;
  const value = c.pending;
  try {
    await post(`rooms/${id}/setpoint`, { setpoint: value });
  } catch {
    if (c.pending === value) {
      c.pending = null;
      c.error = "Not saved. Try again.";
    }
    if (rooms.has(id)) renderRoom(rooms.get(id));
    return;
  }
  // Let go of the pending value if no state confirms it, for example after a restart.
  c.expiry = setTimeout(() => {
    if (c.pending === value && !c.timer) {
      c.pending = null;
      if (rooms.has(id)) renderRoom(rooms.get(id));
    }
  }, PENDING_MAX_MS);
  refresh();
}

async function resumeSchedule(id) {
  const c = control(id);
  clearTimeout(c.timer);
  c.timer = null;
  c.pending = null;
  c.error = "";
  c.clearing = true;
  if (rooms.has(id)) renderRoom(rooms.get(id));
  try {
    await post(`rooms/${id}/setpoint`, { setpoint: null });
  } catch {
    c.clearing = false;
    c.error = "Not saved. Try again.";
    if (rooms.has(id)) renderRoom(rooms.get(id));
    return;
  }
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

function renderRoom(r) {
  // `last` is set before rooms render, so the next-setpoint clock is current.
  const n = ensureCard(r);
  rooms.set(r.id, r);
  const [label, kind] = badgeFor(r);
  const badge = n.querySelector(".badge");
  badge.textContent = label;
  badge.dataset.kind = kind;
  n.querySelector(".now").textContent = fmtT(r.temperature);

  // Setpoint control and any hold on it.
  const c = control(r.id);
  if (c.pending != null && !c.timer && r.override?.setpoint === c.pending) {
    c.pending = null;
    clearTimeout(c.expiry);
  }
  if (c.clearing && !r.override) c.clearing = false;
  const canSet = controllable(r);
  const sp = n.querySelector(".sp");
  sp.hidden = !canSet;
  const target = n.querySelector(".target");
  target.textContent = r.target != null ? `→ ${r.target.toFixed(1)}°` : !canSet && r.setpoint != null ? `set ${r.setpoint.toFixed(1)}°` : "";
  if (canSet) {
    const shown = heldSetpoint(r);
    const held = c.pending == null && !c.clearing && r.override?.setpoint != null;
    sp.dataset.held = String(held || c.pending != null);
    sp.dataset.error = String(Boolean(c.error));
    sp.querySelector(".sp-val").textContent = fmtT(shown);
    const [down, up] = sp.querySelectorAll(".step");
    down.disabled = shown != null && shown <= SETPOINT_MIN;
    up.disabled = shown != null && shown >= SETPOINT_MAX;
    sp.querySelector(".sp-label").textContent = c.error || (held ? holdText(r.override) : "Setpoint");
    sp.querySelector(".hold-clear").hidden = !held;
  }

  // Stuck-valve check (spec 7): the radiator stayed cold for burns in a row.
  const flag = n.querySelector(".flag");
  flag.hidden = !r.valve?.untrusted;
  if (r.valve?.untrusted) {
    flag.textContent = r.valve.leaking ? "Valve may not be closing: radiator warmed while shut." : r.valve.misses
      ? `Valve may be stuck: radiator stayed cold for ${plural(r.valve.misses, "burn", "burns")}.`
      : "Valve may be stuck: radiator not warming.";
  }
  const opening = r.opening ?? 0;
  n.querySelector(".valve-val").textContent = r.opening == null ? "–" : `${opening}%`;
  n.querySelector(".fill").style.transform = `scaleX(${opening / 100})`;
  n.dataset.idle = String(!(r.calling || r.topup));
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
  n.querySelector(".reason").textContent = reason;
  const meta = n.querySelector(".meta");
  if (r.model) {
    const learn = r.learning ? LEARNING[r.learning] || r.learning : "learning";
    meta.textContent = "";
    for (const t of [
      `gain ${r.model.a.toFixed(1)} K/h`,
      `lag ${Math.round(r.model.arrival_lag_min)} min`,
      `confidence ${Math.round(r.model.confidence * 100)}%`,
      learn,
    ]) {
      const s = document.createElement("span");
      s.textContent = t;
      meta.appendChild(s);
    }
  } else {
    meta.textContent = r.humidity != null ? `${r.humidity}% RH` : "";
  }
  const fire = n.querySelector(".fire");
  if (!fire.hidden && document.activeElement !== fire) fire.setAttribute("aria-pressed", String(!!r.fire));
}

// Away, per person (household setup). The server says who counts as away; this only
// shows it and sets or clears "away until". Times arrive as local ISO strings with an
// offset ("2026-11-24T18:00+00:00"), so their first 16 characters are house time.
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const people = new Map(); // person id -> card
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

function ensurePerson(p) {
  if (people.has(p.id)) return people.get(p.id);
  const node = $("person-tpl").content.firstElementChild.cloneNode(true);
  node.querySelector(".name").textContent = p.name;
  const open = node.querySelector(".away-open");
  const clear = node.querySelector(".away-clear");
  const form = node.querySelector(".away-form");
  const error = node.querySelector(".away-error");
  clear.setAttribute("aria-label", `${p.name} is back now`);
  const close = () => {
    form.hidden = true;
    open.hidden = false;
    error.hidden = true;
    open.focus();
  };
  open.addEventListener("click", () => {
    const today = last?.away?.today;
    const date = form.elements.date;
    if (today) {
      date.min = today;
      if (!date.value) date.value = new Date((dayNumber(today) + 1) * 86400000).toISOString().slice(0, 10);
    }
    form.hidden = false;
    open.hidden = true;
    date.focus();
  });
  node.querySelector(".away-cancel").addEventListener("click", close);
  form.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { date, time } = form.elements;
    const until = time.value ? `${date.value}T${time.value}` : date.value;
    const save = form.querySelector('button[type="submit"]');
    save.disabled = true;
    error.hidden = true;
    try {
      await post(`people/${p.id}/away`, { until });
    } catch (err) {
      save.disabled = false;
      error.hidden = false;
      const text = String(err?.message ?? "");
      error.textContent = text.includes("in the future")
        ? "Not saved: pick a time that has not passed."
        : text.includes("within") ? "Not saved: pick a date in the next 60 days." : "Not saved. Try again.";
      return;
    }
    save.disabled = false;
    form.reset();
    close();
    refresh();
  });
  // "I'm home": ends an away until and sets aside a not home from Home Assistant until
  // their presence next changes. An older server without the route: clear the away until.
  clear.addEventListener("click", async () => {
    clear.disabled = true;
    try {
      await post(`people/${p.id}/home`, {});
    } catch {
      try { await post(`people/${p.id}/away`, { until: null }); } catch { /* the state shows what holds */ }
    }
    clear.disabled = false;
    refresh();
  });
  $("people-list").appendChild(node);
  people.set(p.id, node);
  return node;
}

function renderPeople(away) {
  const list = away?.people ?? [];
  $("people").hidden = !list.length;
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
  for (const p of list) {
    const n = ensurePerson(p);
    const [text, label, kind] = personText(p, away);
    n.querySelector(".person-state").textContent = text;
    const badge = n.querySelector(".badge");
    badge.textContent = label;
    badge.dataset.kind = kind;
    // Back now: for an away until, or away from Home Assistant presence.
    n.querySelector(".away-clear").hidden = !p.until && !p.away;
    const open = n.querySelector(".away-open");
    open.textContent = p.until ? "Change" : "Set away";
    open.setAttribute("aria-label", p.until ? `Change when ${p.name} is back` : `Set ${p.name} away`);
  }
}

// Schedules: the week each room follows (week.js). Weeks change rarely, so they are
// fetched, not streamed: at start, when who is away changes, after midnight and every
// 10 minutes. Each state moves the now marker. An older server without the route
// answers 404 and the section stays hidden.
const WEEK_REFRESH_MS = 10 * 60 * 1000;
// The house model, the whole-house plate and today's plan (house.js).
const houseView = createHouse({
  modelEl: $("hm-model"),
  statusEl: $("hm-status"),
  planEl: $("hm-plan"),
  transport,
  onRoom: (id) => {
    const card = $(`room-${id}`);
    if (!card) return;
    card.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    card.focus({ preventScroll: true });
  },
  onWeek: () => {
    $("week").scrollIntoView({ block: "start" });
    $("week-h").setAttribute("tabindex", "-1");
    $("week-h").focus({ preventScroll: true });
  },
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => houseView.redraw());
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

function render(s) {
  last = s;
  const b = s.boiler;
  const firing = b.state === "firing";
  const minBurn = house?.boiler.min_burn_s ?? 480;
  // Effective minimum off: raised for a day after short-cycling. Older servers only
  // report the configured value, in /house.
  const minOff = b.min_off_s ?? house?.boiler.min_off_s ?? 600;
  $("status").textContent = statusLine(s, minBurn);
  $("outdoor").textContent = s.outdoor != null ? `Outside ${s.outdoor.toFixed(1)}°` : "";
  for (const btn of $("mode").querySelectorAll("button")) btn.setAttribute("aria-checked", String(btn.dataset.mode === s.mode));
  renderDemand(s.settings);

  const chip = $("boiler-chip");
  chip.textContent = { idle: "Idle", lead: "Opening valves", firing: "Firing", rest: "Resting" }[b.state];
  chip.dataset.state = b.state;
  const guard = $("guard");
  let frac = 0;
  if (firing) frac = Math.min(1, b.burn_elapsed_s / minBurn);
  if (b.state === "rest") frac = Math.min(1, b.state_elapsed_s / minOff);
  guard.dataset.kind = b.state;
  guard.firstElementChild.style.transform = `scaleX(${frac})`;
  $("boiler-detail").textContent = firing
    ? b.burn_elapsed_s < minBurn ? `minimum burn ${mins(minBurn - b.burn_elapsed_s)} to go` : "minimum burn met"
    : b.state === "rest" ? `${mins(Math.max(0, minOff - b.state_elapsed_s))} until it may start again` : "";
  $("boost").setAttribute("aria-pressed", String(s.store.boost));

  lane(document.querySelector(".lane.burns"), s.timeline.burns, s.timeline.window_s);
  lane(document.querySelector(".lane.store"), s.timeline.store, s.timeline.window_s);
  $("s-starts").textContent = `${b.starts_last_hour}`;
  $("s-pred").textContent = b.predicted_burn_min ? `${b.predicted_burn_min} min` : "–";
  renderAccounting(s);
  $("s-supply").textContent = b.supply != null ? b.supply.toFixed(2) : "–";
  renderShortCycle(b);

  const banner = $("banner");
  if (s.telemetry?.simulated) {
    banner.hidden = false;
    $("banner-text").textContent = `Demo: simulated reference house, ${clock(s.minute_of_day)} simulated time. Boiler water ${s.telemetry.boiler_water_c}°, store ${s.telemetry.store_c}°, stairs ${s.telemetry.stairs_c}°.`;
  }
  renderDryRun(s.telemetry);
  renderPeople(s.away);
  for (const r of s.rooms) renderRoom(r);
  renderAlerts(s.alerts);
  renderDeviceCount(s.alert_details);
  houseView.update(s, house);
  syncWeek(s);

  lastAt = new Date();
  delete document.body.dataset.link;
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
  const on = `Burner on for ${mins(b.burn_elapsed_s)}`;
  const extend = (list) => `topping up ${names(list)} to save a second burn soon`;
  switch (b.state) {
    case "idle":
      if (waiting.length) {
        const verb = waiting.length === 1 ? "is" : "are";
        return `Boiler idle. ${names(waiting)} ${verb} waiting to share a burn with other rooms.${water}`;
      }
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
const demand = { pending: null, error: "" };

function renderDemand(settings) {
  const group = $("demand");
  const note = $("demand-note");
  const known = settings && DEMAND_NOTE[settings.demand_mode];
  group.hidden = note.hidden = !known;
  if (!known) return;
  if (demand.pending === settings.demand_mode) demand.pending = null;
  const shown = demand.pending ?? settings.demand_mode;
  for (const btn of group.querySelectorAll("button")) btn.setAttribute("aria-checked", String(btn.dataset.demand === shown));
  // The segmented control names the mode, so the note only says what it does, and
  // starts "Default:" while it follows the configuration file.
  const text = DEMAND_NOTE[shown];
  note.dataset.error = String(Boolean(demand.error));
  note.textContent = demand.error || (shown === settings.demand_mode_default
    ? `Default: ${text}`
    : text[0].toUpperCase() + text.slice(1));
}

$("demand").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-demand]");
  const settings = last?.settings;
  if (!btn || !settings || btn.getAttribute("aria-checked") === "true") return;
  const value = btn.dataset.demand;
  demand.pending = value;
  demand.error = "";
  renderDemand(settings);
  try {
    await post("settings", { demand_mode: value === settings.demand_mode_default ? null : value });
  } catch {
    if (demand.pending === value) {
      demand.pending = null;
      demand.error = "Not saved. Try again.";
    }
    renderDemand(last.settings);
    return;
  }
  // Let go of the pressed value if no state confirms it.
  setTimeout(() => {
    if (demand.pending !== value) return;
    demand.pending = null;
    if (last) renderDemand(last.settings);
  }, PENDING_MAX_MS);
  refresh();
});

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
  const list = details.querySelector("ul");
  list.textContent = "";
  for (const w of [...recent].reverse()) {
    const li = document.createElement("li");
    const topic = document.createElement("code");
    topic.textContent = w.topic;
    const payload = document.createElement("code");
    payload.className = "payload";
    payload.textContent = typeof w.payload === "string" ? w.payload : JSON.stringify(w.payload);
    li.append(topic, payload);
    list.appendChild(li);
  }
}

// Alerts arrive as sentences, room name first ("Lounge: TRV not reachable"). When
// several rooms share a problem, list it once with the rooms, so ten offline TRVs
// read as one line. Past ALERTS_SHOWN lines, the rest sit behind a toggle.
const ALERTS_SHOWN = 4;
let alertsKey = "";
function groupAlerts(alerts) {
  const groups = new Map();
  for (const text of alerts) {
    const at = text.indexOf(": ");
    const problem = at > 0 ? text.slice(at + 2) : text;
    const g = groups.get(problem) ?? { problem, first: text, rooms: [] };
    if (at > 0) g.rooms.push(text.slice(0, at));
    groups.set(problem, g);
  }
  return [...groups.values()].map((g) => {
    if (g.rooms.length < 2) return g.first;
    const problem = g.problem[0].toUpperCase() + g.problem.slice(1);
    return `${problem} (${plural(g.rooms.length, "room", "rooms")}): ${g.rooms.join(", ")}`;
  });
}

function renderAlerts(alerts) {
  const key = JSON.stringify(alerts);
  if (key === alertsKey) return;
  alertsKey = key;
  const box = $("alerts");
  box.hidden = !alerts.length;
  const lines = groupAlerts(alerts);
  const list = $("alerts-list");
  list.textContent = "";
  lines.forEach((line, i) => {
    const li = document.createElement("li");
    li.textContent = line;
    li.dataset.extra = String(i >= ALERTS_SHOWN);
    list.appendChild(li);
  });
  const more = $("alerts-more");
  const extra = lines.length - ALERTS_SHOWN;
  more.hidden = extra <= 0;
  more.dataset.extra = String(Math.max(0, extra));
  setAlertsExpanded(more.getAttribute("aria-expanded") === "true");
}

function setAlertsExpanded(open) {
  const more = $("alerts-more");
  more.setAttribute("aria-expanded", String(open));
  more.textContent = open ? "Show fewer" : `Show ${more.dataset.extra} more`;
  $("alerts-list").dataset.expanded = String(open);
}

$("alerts-more").addEventListener("click", () => {
  setAlertsExpanded($("alerts-more").getAttribute("aria-expanded") !== "true");
});

$("mode").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-mode]");
  if (btn) post("mode", { mode: btn.dataset.mode }).catch(() => {});
});
$("boost").addEventListener("click", () => {
  post("store/boost", { minutes: last?.store.boost ? 0 : 60 }).catch(() => {});
});

// Connection state. While the live stream is down, poll once per reconnect attempt;
// if that fails too, dim the page and say how old the data is. The next state that
// arrives, from either path, clears it.
function markOffline() {
  if (!last) {
    $("status").textContent = "Cannot reach Radiate. Retrying…";
    return;
  }
  document.body.dataset.link = "stale";
  const at = `${String(lastAt.getHours()).padStart(2, "0")}:${String(lastAt.getMinutes()).padStart(2, "0")}`;
  $("status").textContent = `Cannot reach Radiate. Retrying… Showing data from ${at}.`;
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
    document.querySelector("main").hidden = true;
    document.body.dataset.setup = "open";
    window.scrollTo(0, 0);
  },
  onClose() {
    delete document.body.dataset.setup;
    document.querySelector("main").hidden = false;
    if (setupOpener && !setupOpener.closest("[hidden]")) setupOpener.focus();
    setupOpener = null;
  },
  async onSaved(message) {
    delete document.body.dataset.setup;
    document.querySelector("main").hidden = false;
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
  $("setup-change").hidden = !offered || !has;
  if (offered && !weekEditing) {
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

// Devices view (devices.js): the health of every device, at #devices. The House and
// Devices tabs show once the server says it reports devices; a server without the
// route answers 404 and the page stays as it was.
const devices = createDevices({
  transport,
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
  $("alerts-devices").hidden = !n || devicesOffered !== true;
}

// Suggestions view (suggestions.js): advice from what Radiate has learned, at
// #suggestions. Its tab shows once the server answers `GET suggestions`, with a count
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
// it, at #savings. Its tab shows once the server answers `GET savings`. Once there are
// figures, the headline also sits on the House view as one line linking to the view.
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
  $("savings-setup").hidden = !offered;
}
// The setup replaces the House view, so go there first; Back then returns to it.
$("savings-setup").addEventListener("click", (e) => {
  history.replaceState(null, "", "#");
  route(false);
  openSetup(e);
});

// Guide view (guide.js): how to read and work Radiate, at #guide, with each section
// at #guide/<name>. Static text, so it is always offered.
const guide = createGuide({ root: $("guide") });
guideNote({ note: $("guide-note"), tab: document.querySelector('.view-tab[data-view="guide"]') });

// Each view besides the house: its element, whether the server offers it, and its module.
const VIEWS = {
  devices: { offered: () => devicesOffered === true, module: devices },
  suggestions: { offered: () => suggestionsOffered === true, module: suggestions },
  savings: { offered: () => savingsOffered === true, module: savings },
  guide: { offered: () => true, module: guide },
};

// The view is the part of the hash before any slash; the rest names a part of the
// view (only the guide's sections use it). An unknown view is the house.
function route(fromUser) {
  if (document.body.dataset.setup === "open") return;
  const [name, part] = location.hash.slice(1).split("/");
  const current = VIEWS[name]?.offered() ? name : "house";
  for (const tab of document.querySelectorAll(".view-tab")) {
    if (tab.dataset.view === current) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }
  document.querySelector("main").hidden = current !== "house";
  for (const [id, v] of Object.entries(VIEWS)) {
    $(id).hidden = id !== current;
    if (id === current) v.module.show();
    else v.module.hide();
  }
  document.body.dataset.view = current;
  // A link to a guide section, also when the page opens on one.
  if (current === "guide" && guide.reveal(part)) return;
  // Opening on #devices or #guide, the browser has jumped to the view's element,
  // which leaves its heading under the sticky header. Start at the top instead.
  if (!fromUser && current !== "house") window.scrollTo(0, 0);
  if (fromUser) {
    window.scrollTo(0, 0);
    // Keyboard and screen reader users land on the new view's heading.
    if (current !== "house") $(`${current}-h`).focus();
  }
}
window.addEventListener("hashchange", () => route(true));
// A link to the hash already showing fires no hashchange, so a second press on a guide
// section link would do nothing. Route it again.
document.addEventListener("click", (e) => {
  const a = e.target.closest?.('a[href^="#"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.hash === location.hash && a.hash.startsWith("#guide")) {
    e.preventDefault();
    route(true);
  }
});

// The tabs show once the server offers at least one view besides the house.
function renderTabs() {
  const offered = Object.entries(VIEWS).filter(([, v]) => v.offered());
  for (const [id, v] of Object.entries(VIEWS)) {
    document.querySelector(`.view-tab[data-view="${id}"]`).hidden = !v.offered();
  }
  $("views").hidden = !offered.length;
}

async function offerViews() {
  const [d, s, v] = await Promise.all([
    devicesOffered === true ? true : devices.available(),
    suggestionsOffered === true ? true : suggestions.available(),
    savingsOffered === true ? true : savings.available(),
  ]);
  devicesOffered = d;
  suggestionsOffered = s;
  savingsOffered = v;
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

function showAccount(me) {
  transport.setCsrf(me.csrf);
  const how = me.method === "local" ? "a password" : "single sign-on";
  $("account-name").textContent = me.user;
  $("account-who").textContent = `Signed in as ${me.user} with ${how}.`;
  $("account-role").textContent = me.role === "admin"
    ? "Admin: you can change anything here."
    : "View only: you can see the house but not change it.";
  document.body.dataset.role = me.role;
  $("account").hidden = false;
}

function closeAccountMenu(focusButton) {
  if ($("account-menu").hidden) return;
  $("account-menu").hidden = true;
  $("account-btn").setAttribute("aria-expanded", "false");
  if (focusButton) $("account-btn").focus();
}

$("account-btn").addEventListener("click", () => {
  const open = $("account-menu").hidden;
  $("account-menu").hidden = !open;
  $("account-btn").setAttribute("aria-expanded", String(open));
  if (open) $("account-out").focus();
});
$("account").addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAccountMenu(true);
});
document.addEventListener("pointerdown", (e) => {
  if (!$("account").contains(e.target)) closeAccountMenu(false);
});
$("account-out").addEventListener("click", async () => {
  const button = $("account-out");
  button.disabled = true;
  $("account-error").hidden = true;
  try {
    await transport.post("auth/logout", {});
  } catch (err) {
    if (!(err instanceof AuthError)) {
      button.disabled = false;
      $("account-error").hidden = false;
      return;
    }
  }
  window.location.assign(loginUrl());
});

async function start() {
  offerViews();
  if (!(await checkLogin())) return;
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
  $("signin-token").focus();
}

$("signin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("signin-token");
  const button = $("signin-form").querySelector("button");
  const error = $("signin-error");
  const value = input.value.trim();
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
