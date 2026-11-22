// Devices view: the health of every device Radiate depends on (GET /api/v1/devices).
// Battery, signal, availability and last seen per TRV, sensor, router and the boiler
// relay, the latest readings, and the Zigbee routes from a network scan the reader
// starts (POST /api/v1/devices/scan). Cards are created once and updated in place.

const $ = (id) => document.getElementById(id);
const REFRESH_MS = 10000;
const SCANNING_MS = 2000;

// Seconds ago, in words: "just now", "4 min ago", "3 h ago", "2 days ago".
export function ago(s) {
  if (s == null) return "–";
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 172800) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

// "8 min", "1 h 5 min", for how long until a scan is allowed again.
function wait(s) {
  const m = Math.max(1, Math.ceil(s / 60));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

const SIGNAL = { strong: "Strong", fair: "Fair", weak: "Weak" };
const BARS = { weak: 1, fair: 2, strong: 3 };
const MODE = { auto: "auto", heat: "heat", off: "off" };

// What each problem means for the reader, and what to do about it.
export function problemText(d, code) {
  if (code === "device.offline") return `Not reachable. Last heard ${ago(d.last_seen_s)}.`;
  if (code === "device.low_battery") return `Battery low at ${d.battery_pct}%. Replace the batteries soon.`;
  if (code === "device.weak_signal") return `Weak signal (LQI ${d.linkquality}). A router nearer to it would help.`;
  if (code === "device.stale") return `No temperature for ${ago(d.reading_age_s).replace(" ago", "")}.`;
  return "Needs attention.";
}

function badge(d) {
  if (d.status === "offline") return ["Offline", "offline"];
  if (d.status === "attention") return ["Needs attention", "attention"];
  if (d.available == null) return ["No data yet", ""];
  return ["Online", "ok"];
}

// One line of the latest readings, in the device's own terms.
export function readingText(d) {
  const parts = [];
  const t = d.temperature_c != null ? `${d.temperature_c.toFixed(1)}°` : null;
  if (d.kind === "trv") {
    const v = d.valve ?? {};
    if (t) parts.push(`${t} at the valve`);
    if (v.opening_pct != null) parts.push(`opening limit ${Math.round(v.opening_pct)}%`);
    if (v.running_state) parts.push(v.running_state === "heat" ? "heating" : "idle");
    if (v.mode) parts.push(`${MODE[v.mode] ?? v.mode} mode`);
  } else if (d.kind === "relay") {
    const r = d.relay ?? {};
    if (r.heating != null) parts.push(`heating ${r.heating ? "on" : "off"}`);
    if (r.store != null) parts.push(`hot water ${r.store ? "on" : "off"}`);
    if (r.power_w != null) parts.push(`${Math.round(r.power_w)} W`);
  } else if (d.kind === "window") {
    if (d.contact != null) parts.push(d.contact ? "window closed" : "window open");
  } else if (d.kind !== "router") {
    if (t) parts.push(t);
    if (d.humidity_pct != null) parts.push(`${Math.round(d.humidity_pct)}% humidity`);
  }
  if (!parts.length) return d.kind === "router" ? "Relays messages for nearby devices." : "–";
  const text = parts.join(", ");
  return text[0].toUpperCase() + text.slice(1);
}

function routeText(d, scanned) {
  if (d.kind === "relay") return "Wi-Fi";
  if (d.route) {
    const via = d.route.via_kind === "coordinator" ? "the coordinator" : d.route.via;
    return `Via ${via}${d.route.lqi != null ? ` (LQI ${Math.round(d.route.lqi)})` : ""}`;
  }
  return scanned ? "Not in the last scan" : null;
}

export function createDevices({ transport, isAuthError, onAuth }) {
  const cards = new Map();
  let view = null;
  let timer = null;
  let open = false;
  let loading = false;
  let scanError = "";

  function ensureCard(d, parent) {
    let node = cards.get(d.id);
    if (!node) {
      node = $("device-tpl").content.firstElementChild.cloneNode(true);
      node.id = `device-${d.id.replace(/[^\w-]/g, "_")}`;
      node.dataset.kind = d.kind;
      cards.set(d.id, node);
    }
    if (node.parentElement !== parent) parent.appendChild(node);
    return node;
  }

  function renderCard(d, parent, scanned) {
    const node = ensureCard(d, parent);
    node.querySelector(".name").textContent = d.label;
    node.dataset.status = d.status;
    const [text, kind] = badge(d);
    const b = node.querySelector(".badge");
    b.textContent = text;
    b.dataset.kind = kind;

    const flags = node.querySelector(".device-flags");
    const lines = d.problems.map((p) => problemText(d, p.code));
    const key = JSON.stringify(lines);
    if (flags.dataset.key !== key) {
      flags.dataset.key = key;
      flags.textContent = "";
      for (const line of lines) {
        const li = document.createElement("li");
        li.className = "flag";
        li.textContent = line;
        flags.appendChild(li);
      }
    }
    flags.hidden = !lines.length;

    // Battery: mains devices say so; a battery device without a reading shows "–".
    const bat = node.querySelector(".ds-battery");
    const batVal = bat.querySelector(".ds-val");
    const meter = bat.querySelector(".meter");
    if (d.battery_pct != null) {
      batVal.textContent = `${d.battery_pct}%`;
      meter.hidden = false;
      meter.dataset.low = String(d.battery_low);
      meter.firstElementChild.style.transform = `scaleX(${Math.max(0, Math.min(100, d.battery_pct)) / 100})`;
    } else {
      batVal.textContent = d.power === "mains" ? "Mains" : "–";
      meter.hidden = true;
    }
    bat.dataset.low = String(d.battery_low);

    const sig = node.querySelector(".ds-signal");
    const sigVal = sig.querySelector(".ds-val");
    const sigSub = sig.querySelector(".ds-sub");
    const bars = sig.querySelector(".sig");
    sigSub.textContent = "";
    if (d.kind === "relay") {
      sigVal.textContent = "Wi-Fi";
      bars.hidden = true;
    } else if (d.linkquality != null && d.available !== false) {
      sigVal.textContent = SIGNAL[d.signal];
      sigSub.textContent = `LQI ${d.linkquality}`;
      bars.hidden = false;
      bars.dataset.level = d.signal;
      bars.dataset.bars = String(BARS[d.signal]);
    } else {
      sigVal.textContent = "–";
      bars.hidden = true;
    }
    sig.dataset.weak = String(d.signal === "weak" && d.available !== false);

    node.querySelector(".ds-seen .ds-val").textContent = ago(d.last_seen_s);
    node.querySelector(".device-reading").textContent = readingText(d);

    const meta = node.querySelector(".meta");
    const items = [];
    if (d.kind !== "relay") items.push(["code", d.id]);
    const model = [d.vendor, d.model].filter(Boolean).join(" ");
    if (model) items.push(["", model]);
    if (d.firmware) items.push(["", `Firmware ${d.firmware}`]);
    const route = routeText(d, scanned);
    if (route) items.push(["route", route]);
    const metaKey = JSON.stringify(items);
    if (meta.dataset.key !== metaKey) {
      meta.dataset.key = metaKey;
      meta.textContent = "";
      for (const [cls, value] of items) {
        const el = document.createElement(cls === "code" ? "code" : "span");
        if (cls === "route") el.className = "route";
        el.textContent = value;
        meta.appendChild(el);
      }
    }
  }

  function renderSummary(v) {
    const s = v.summary;
    const parts = [];
    if (s.offline) parts.push(`${s.offline} offline`);
    if (s.low_battery) parts.push(`${s.low_battery} low battery`);
    if (s.weak_signal) parts.push(`${s.weak_signal} weak signal`);
    const total = `${s.total} ${s.total === 1 ? "device" : "devices"}`;
    $("devices-summary").textContent = s.attention
      ? `${total}. ${s.attention} ${s.attention === 1 ? "needs" : "need"} attention${parts.length ? `: ${parts.join(", ")}` : ""}.`
      : `${total}, all healthy.`;
    const n = v.network ?? {};
    const net = [];
    if (n.mqtt != null) net.push(n.mqtt ? "MQTT connected" : "MQTT not connected");
    if (n.zigbee2mqtt != null) net.push(n.zigbee2mqtt ? "Zigbee2MQTT online" : "Zigbee2MQTT offline");
    $("devices-network").textContent = net.length ? `${net.join(". ")}.` : "";

    // Needs attention: one line per device, each a link to its card.
    const box = $("devices-attention");
    const list = $("devices-attention-list");
    const problems = v.devices.filter((d) => d.status !== "ok");
    box.hidden = !problems.length;
    // Rebuilt only when the devices with problems change, so a focused link stays put
    // while the numbers in the sentences update.
    const key = JSON.stringify(problems.map((d) => d.id));
    if (list.dataset.key !== key) {
      list.dataset.key = key;
      list.textContent = "";
      for (const d of problems) {
        const li = document.createElement("li");
        li.dataset.id = d.id;
        const a = document.createElement("a");
        a.href = "#devices";
        a.className = "attention-link";
        a.textContent = d.label;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const card = cards.get(d.id);
          if (!card) return;
          card.scrollIntoView({ block: "center" });
          card.focus({ preventScroll: true });
        });
        const text = document.createElement("span");
        li.append(a, text);
        list.appendChild(li);
      }
    }
    for (const d of problems) {
      const span = list.querySelector(`li[data-id="${CSS.escape(d.id)}"] span`);
      if (span) span.textContent = `: ${d.problems.map((p) => problemText(d, p.code)).join(" ")}`;
    }
  }

  // The route tree: the coordinator, the routers under it, and the devices each one
  // carries. Built from every device's route after a scan.
  function renderTree(v) {
    const tree = $("mesh-tree");
    const routed = v.devices.filter((d) => d.route);
    tree.hidden = !routed.length;
    const key = JSON.stringify(routed.map((d) => [d.id, d.route.via, d.route.lqi]));
    if (tree.dataset.key === key) return;
    tree.dataset.key = key;
    tree.textContent = "";
    const byParent = new Map();
    for (const d of routed) {
      const parent = d.route.via_kind === "coordinator" ? "Coordinator" : d.route.via;
      if (!byParent.has(parent)) byParent.set(parent, []);
      byParent.get(parent).push(d);
    }
    const label = new Map(v.devices.map((d) => [d.id, d.label]));
    const seen = new Set();
    const branch = (name, title) => {
      const li = document.createElement("li");
      const head = document.createElement("span");
      head.className = "tree-node";
      head.textContent = title;
      li.appendChild(head);
      const kids = (byParent.get(name) ?? []).slice().sort((a, b) => (a.kind === "router") - (b.kind === "router") || a.label.localeCompare(b.label));
      if (!kids.length || seen.has(name)) return li;
      seen.add(name);
      const ul = document.createElement("ul");
      for (const d of kids) {
        const q = document.createElement("span");
        q.className = "tree-lqi";
        q.textContent = d.route.lqi != null ? `LQI ${Math.round(d.route.lqi)}` : "";
        q.dataset.weak = String(d.route.lqi != null && d.route.lqi < v.limits.weak_signal_lqi);
        let sub;
        if (d.kind === "router") {
          sub = branch(d.id, d.label);
          sub.firstElementChild.after(q);
        } else {
          sub = document.createElement("li");
          const name = document.createElement("span");
          name.className = "tree-node";
          name.textContent = d.label;
          sub.append(name, q);
        }
        ul.appendChild(sub);
      }
      li.appendChild(ul);
      return li;
    };
    tree.appendChild(branch("Coordinator", "Coordinator"));
    // Routers whose own route is unknown still carry devices: list them as well.
    for (const parent of byParent.keys()) {
      if (!seen.has(parent) && parent !== "Coordinator") tree.appendChild(branch(parent, label.get(parent) ?? parent));
    }
  }

  function renderScan(v) {
    const s = v.scan;
    const btn = $("mesh-scan");
    const status = $("mesh-status");
    $("devices-mesh-section").hidden = !s.available && !v.devices.some((d) => d.kind === "router");
    btn.hidden = !s.available;
    const scanning = s.state === "scanning";
    btn.disabled = scanning || s.retry_in_s > 0;
    btn.setAttribute("aria-busy", String(scanning));
    btn.textContent = scanning ? "Scanning…" : "Scan network";
    status.dataset.error = String(s.state === "failed" || Boolean(scanError));
    let text;
    if (scanError) text = scanError;
    else if (scanning) text = "Scanning. This can take up to 2 minutes.";
    else if (s.state === "failed") text = `The scan didn't finish: ${s.error}. Radiate will let you try again in ${wait(s.retry_in_s || 60)}.`;
    else if (s.scanned_s_ago != null) text = `Scanned ${ago(s.scanned_s_ago)}.`;
    else text = "Not scanned yet.";
    if (!scanning && s.retry_in_s > 0 && s.state !== "failed" && !scanError) text += ` You can scan again in ${wait(s.retry_in_s)}.`;
    status.textContent = text;
  }

  function render(v) {
    view = v;
    renderSummary(v);
    const scanned = v.scan.scanned_s_ago != null;
    const rooms = $("devices-rooms");
    const routers = $("devices-routers");
    const boiler = $("devices-boiler");
    const live = new Set();
    for (const d of v.devices) {
      live.add(d.id);
      const parent = d.kind === "router" ? routers : d.kind === "relay" ? boiler : rooms;
      renderCard(d, parent, scanned);
    }
    for (const [id, node] of cards) {
      if (!live.has(id)) { node.remove(); cards.delete(id); }
    }
    $("devices-boiler-section").hidden = !boiler.children.length;
    renderScan(v);
    renderTree(v);
  }

  async function load() {
    if (loading) return;
    loading = true;
    try {
      render(await transport.get("devices"));
    } catch (err) {
      if (isAuthError(err)) onAuth();
      else if (!view) $("devices-summary").textContent = "Couldn't load the devices. Retrying…";
    }
    loading = false;
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    if (!open) return;
    timer = setTimeout(load, view?.scan.state === "scanning" ? SCANNING_MS : REFRESH_MS);
  }

  $("mesh-scan").addEventListener("click", async () => {
    const btn = $("mesh-scan");
    btn.disabled = true;
    scanError = "";
    try {
      const res = await transport.call("POST", "devices/scan", {});
      if (res.status !== 200) {
        const msg = typeof res.body === "object" ? res.body.message : res.body;
        scanError = `Not started: ${msg}.`;
      }
    } catch (err) {
      if (isAuthError(err)) { onAuth(); return; }
      scanError = "Not started. Check the connection and try again.";
    }
    await load();
    if (!btn.disabled) btn.focus();
  });

  return {
    // Whether this server reports devices: false for a 404, null if it couldn't say.
    async available() {
      try {
        render(await transport.get("devices"));
        return true;
      } catch (err) {
        if (isAuthError(err)) return null;
        return /HTTP 404|not found|reports no devices/.test(String(err?.message)) ? false : null;
      }
    },
    show() {
      open = true;
      load();
    },
    hide() {
      open = false;
      clearTimeout(timer);
    },
  };
}
