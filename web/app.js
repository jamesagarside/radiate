// Radiate UI: renders /api/v1/state, live over WebSocket with polling fallback.
// Elements are created once and updated in place so transitions can retarget.
//
// All server traffic goes through a transport: { house(), state(), post(path, body),
// subscribe(onState, onLink) }. The default talks HTTP and WebSocket to the Radiate
// server and reports the link as "live", "lost" or "auth" through onLink. The static
// demo (<html data-transport="demo">) swaps in demo.js, which runs the same engine in
// a Web Worker, needs no token and never loses its link. Both share this one UI.

const api = (p) => new URL(`api/v1/${p}`, document.baseURI).toString();
const $ = (id) => document.getElementById(id);
const fmtT = (t) => (t == null ? "–" : `${t.toFixed(1)}°`);
const mins = (s) => `${Math.max(0, Math.round(s / 60))} min`;
const clock = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const cards = new Map();
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
  let ws = null;
  let timer = null;
  let retryMs = 2000;
  let onState = null;
  let onLink = null;

  const headers = (extra = {}) => (token ? { ...extra, Authorization: `Bearer ${token}` } : extra);
  const send = async (path, init = {}) => {
    const res = await fetch(api(path), { ...init, headers: headers(init.headers) });
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
    setToken(value) {
      token = value;
      storeToken(value);
    },
    house: async () => (await send("house")).json(),
    state: async () => (await send("state")).json(),
    async post(path, body) {
      await send(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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

function badgeFor(r) {
  if (r.role === "passive") return ["Bypass, not controlled", ""];
  if (r.fire) return ["Fire lit", "fire"];
  if (r.preheating) return ["Preheating", "preheat"];
  if (r.calling) return ["Heating", "calling"];
  if (r.topup) return ["Heat sink", "sink"];
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
  node.querySelector(".name").textContent = r.name;
  node.dataset.passive = String(r.role === "passive");
  const fire = node.querySelector(".fire");
  if (r.heat_source === "episodic") {
    fire.hidden = false;
    fire.addEventListener("click", async () => {
      const lit = fire.getAttribute("aria-pressed") !== "true";
      fire.setAttribute("aria-pressed", String(lit));
      try { await post(`rooms/${r.id}/fire`, { lit }); } catch { fire.setAttribute("aria-pressed", String(!lit)); }
    });
  }
  $("rooms").appendChild(node);
  cards.set(r.id, node);
  return node;
}

function renderRoom(r) {
  // `last` is set before rooms render, so the next-setpoint clock is current.
  const n = ensureCard(r);
  const [label, kind] = badgeFor(r);
  const badge = n.querySelector(".badge");
  badge.textContent = label;
  badge.dataset.kind = kind;
  n.querySelector(".now").textContent = fmtT(r.temperature);
  n.querySelector(".target").textContent = r.target != null ? `→ ${r.target.toFixed(1)}°` : r.setpoint != null ? `set ${r.setpoint.toFixed(1)}°` : "";
  const opening = r.opening ?? 0;
  n.querySelector(".valve-val").textContent = r.opening == null ? "–" : `${opening}%`;
  n.querySelector(".fill").style.transform = `scaleX(${opening / 100})`;
  n.dataset.idle = String(!(r.calling || r.topup));
  let reason = r.reason || "";
  if (!reason && r.role === "passive") reason = "Manual valve, always open: counted as the system's open path.";
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
  const status = {
    idle: "Boiler idle. Rooms are within comfort.",
    lead: "Opening valves before calling the burner.",
    firing: `Burner on for ${mins(b.burn_elapsed_s)}.`,
    rest: `Burner resting: minimum off time, ${mins(b.state_elapsed_s)} so far.`,
  }[b.state];
  const calling = s.rooms.filter((r) => r.calling).map((r) => r.name);
  $("status").textContent = calling.length ? `${status} Heating ${calling.join(", ")}.` : status;
  $("outdoor").textContent = s.outdoor != null ? `Outside ${s.outdoor.toFixed(1)}°` : "";
  for (const btn of $("mode").querySelectorAll("button")) btn.setAttribute("aria-checked", String(btn.dataset.mode === s.mode));

  const chip = $("boiler-chip");
  chip.textContent = { idle: "Idle", lead: "Opening valves", firing: "Firing", rest: "Resting" }[b.state];
  chip.dataset.state = b.state;
  const minBurn = house?.boiler.min_burn_s ?? 480;
  const minOff = house?.boiler.min_off_s ?? 600;
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
  $("s-hours").textContent = s.telemetry?.burner_hours != null ? s.telemetry.burner_hours.toFixed(1) : "–";
  $("s-supply").textContent = b.supply.toFixed(2);

  const banner = $("banner");
  if (s.telemetry?.simulated) {
    banner.hidden = false;
    $("banner-text").textContent = `Demo: simulated reference house, ${clock(s.minute_of_day)} simulated time. Boiler water ${s.telemetry.boiler_water_c}°, store ${s.telemetry.store_c}°, stairs ${s.telemetry.stairs_c}°.`;
  }
  renderDryRun(s.telemetry);
  for (const r of s.rooms) renderRoom(r);
  renderAlerts(s.alerts);

  lastAt = new Date();
  delete document.body.dataset.link;
  if (!house) loadHouse();
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
  try { house = await transport.house(); } catch { /* retried on the next render */ }
  houseLoading = false;
}

async function start() {
  try {
    house = await transport.house();
  } catch (err) {
    if (err instanceof AuthError) { askForToken(); return; }
  }
  await poll();
  if (document.body.dataset.auth !== "needed") transport.subscribe(render, onLink);
}

// Sign-in: only reachable when the server has RADIATE_TOKEN set and the request did
// not come through Home Assistant ingress. The demo never gets here.
function askForToken() {
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
