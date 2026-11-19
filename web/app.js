// Radiate UI: renders /api/v1/state, live over WebSocket with polling fallback.
// Elements are created once and updated in place so transitions can retarget.
//
// All server traffic goes through a transport: { house(), state(), post(path, body),
// subscribe(onState) }. The default talks HTTP and WebSocket to the Radiate server.
// The static demo (<html data-transport="demo">) swaps in demo.js, which runs the
// same engine in a Web Worker. Both share this one UI.

const api = (p) => new URL(`api/v1/${p}`, document.baseURI).toString();
const $ = (id) => document.getElementById(id);
const fmtT = (t) => (t == null ? "–" : `${t.toFixed(1)}°`);
const mins = (s) => `${Math.max(0, Math.round(s / 60))} min`;
const clock = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const cards = new Map();
let last = null;
let house = null;

function httpTransport() {
  const getJson = async (path) => {
    const res = await fetch(api(path));
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return res.json();
  };
  return {
    house: () => getJson("house"),
    state: () => getJson("state"),
    async post(path, body) {
      const res = await fetch(api(path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    subscribe(onState) {
      const connect = () => {
        const url = new URL(api("stream"));
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        let ws;
        try { ws = new WebSocket(url); } catch { setInterval(poll, 5000); return; }
        ws.onmessage = (ev) => onState(JSON.parse(ev.data));
        ws.onclose = () => setTimeout(connect, 2000);
        ws.onerror = () => ws.close();
      };
      connect();
    },
  };
}

const transport = document.documentElement.dataset.transport === "demo"
  ? (await import("./demo.js")).createDemoTransport()
  : httpTransport();
const post = (path, body) => transport.post(path, body);

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
  for (const r of s.rooms) renderRoom(r);
  const alerts = $("alerts");
  alerts.hidden = !s.alerts.length;
  alerts.textContent = s.alerts.join(" ");
}

$("mode").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-mode]");
  if (!btn) return;
  try { await post("mode", { mode: btn.dataset.mode }); } catch (err) { console.error(err); }
});
$("boost").addEventListener("click", async () => {
  try { await post("store/boost", { minutes: last?.store.boost ? 0 : 60 }); } catch (err) { console.error(err); }
});

async function poll() {
  try {
    render(await transport.state());
  } catch {
    $("status").textContent = "Cannot reach Radiate. Retrying…";
  }
}

try { house = await transport.house(); } catch { /* render will retry */ }
await poll();
transport.subscribe(render);
