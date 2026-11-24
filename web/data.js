// Raw data view (#data): every series Radiate records, to search, chart, read as a
// table and download (GET /api/v1/data/series and GET /api/v1/data, spec 9.2), with
// the health of the OpenTelemetry export beside it (spec 9.1). The server picks the
// step and does every sum; this module only words and draws what it is given.
//
// The chart is inline SVG. With several series (a reading in every room), one is in
// ink and the others are thin muted lines for context; the legend picks which is in
// ink, so colour is never what tells them apart. Over a step wider than a minute the
// ink series also shows its range in each step as a band. The chart is one tab stop:
// the arrow keys, Home and End move a cursor between points, and the words for the
// point under it sit in a line under the chart, for touch as much as for a mouse.

const $ = (id) => document.getElementById(id);
const NONE = "–"; // the one placeholder for a missing value (design standards)
const MINUS = "−"; // a real minus sign, not a dash
const OPEN_MS = 60000;
export const TABLE_ROWS = 500;
export const RANGES = { "6h": 6 * 3600, "24h": 86400, "7d": 7 * 86400, "30d": 30 * 86400 };
const RANGE_WORDS = { "6h": "the last 6 hours", "24h": "the last 24 hours", "7d": "the last 7 days", "30d": "the last 30 days" };

// --- words --------------------------------------------------------------------------------

const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const signedNum = (v, places) => {
  const s = Math.abs(v).toFixed(places);
  return v < 0 && Number(s) !== 0 ? `${MINUS}${s}` : s;
};
export const plural = (n, one, many) => `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;

// "Lounge temperature", "Bedroom 1 opening limit", "Outdoor temperature".
export function seriesName(s) {
  return s.room ? `${s.room_name ?? s.room} ${lowerFirst(s.label)}` : s.label;
}

// A step in words: 300 -> "5 min", 3600 -> "1 h", 86400 -> "1 day".
export function stepWords(step) {
  if (step >= 86400) return step === 86400 ? "1 day" : `${step / 86400} days`;
  if (step >= 3600) return `${step / 3600} h`;
  return `${step / 60} min`;
}

// A value as the UI shows it. States read On or Off at one minute, and the share of
// the step they were on when wider; a level reads its name.
export function fmtValue(v, metric, step = 60) {
  if (v == null || Number.isNaN(v)) return NONE;
  const kind = metric?.kind ?? "gauge";
  if (kind === "state") {
    if (step <= 60 || v === 0 || v === 1) return v >= 0.5 ? "On" : "Off";
    return `on ${Math.round(v * 100)}% of the time`;
  }
  if (kind === "level") {
    const levels = metric.levels ?? [];
    return levels[Math.round(v)] ?? String(v);
  }
  switch (metric?.unit) {
    case "°C": return `${signedNum(v, 1)}°`;
    case "%": return `${signedNum(v, 0)}%`;
    case "W": return `${signedNum(v, 0)} W`;
    default: return Number.isInteger(v) ? signedNum(v, 0) : signedNum(v, 1);
  }
}

// --- time, in the house's time zone --------------------------------------------------------

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatters = new Map();

// Calendar parts of Unix time `t` in `tz`.
export function parts(t, tz) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    formatters.set(tz, f);
  }
  const p = Object.fromEntries(f.formatToParts(new Date(t * 1000)).map((x) => [x.type, x.value]));
  const y = Number(p.year), m = Number(p.month), d = Number(p.day);
  return { y, m, d, H: p.hour, M: p.minute, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}
export const clockAt = (t, tz) => { const p = parts(t, tz); return `${p.H}:${p.M}`; };
export const dayAt = (t, tz) => { const p = parts(t, tz); return `${DAYS[p.wd]} ${p.d} ${MONTHS[p.m - 1]}`; };
export const whenAt = (t, tz) => `${dayAt(t, tz)} ${clockAt(t, tz)}`;
// The value for a datetime-local input: house time, to the minute.
export function inputValue(t, tz) {
  const p = parts(t, tz);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}T${p.H}:${p.M}`;
}

// "just now", "4 min ago", "3 h ago", "2 days ago".
export function ago(seconds) {
  if (seconds < 90) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 172800) return `${Math.round(seconds / 3600)} h ago`;
  return `${Math.round(seconds / 86400)} days ago`;
}
// "in 40 s", "in 4 min".
function within(seconds) {
  if (seconds < 60) return `in ${Math.max(1, Math.round(seconds))} s`;
  if (seconds < 5400) return `in ${Math.round(seconds / 60)} min`;
  return `in ${Math.round(seconds / 3600)} h`;
}

// --- the catalogue and search ---------------------------------------------------------------

// The head of the view in words.
export function summaryText(cat) {
  if (!cat?.available) return cat?.why ?? "No raw data here.";
  const n = cat.series?.length ?? 0;
  if (!n) return "Nothing recorded yet. The first readings appear within a minute.";
  const kept = cat.retention_days ? ` Kept for ${plural(Math.round(cat.retention_days), "day", "days")}.` : "";
  return `${plural(n, "series", "series")} from ${whenAt(cat.first, cat.timezone)} to now.${kept}`;
}

// Series matching every word of `query`, by name, room or metric ID; at most `limit`.
export function search(cat, query, limit = 8) {
  const words = String(query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length || !cat?.series) return [];
  const out = [];
  for (const s of cat.series) {
    const hay = `${seriesName(s)} ${s.metric} ${s.room ?? ""} ${s.room ? "" : "house"}`.toLowerCase();
    if (words.every((w) => hay.includes(w))) out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

// What the chart heading says: the series, or the reading across rooms.
export function titleText(view, metric, roomName) {
  const list = view?.series ?? [];
  if (list.length === 1) return seriesName(list[0]);
  if (metric?.scope === "room" && !roomName) return `${metric.label}, every room`;
  return metric?.label ?? "Raw data";
}

// The line under the controls: what the answer covers.
export function metaText(view, rangeKey) {
  if (!view) return "";
  const n = view.series.length;
  const pts = view.series.reduce((sum, s) => sum + s.points.length, 0);
  const span = rangeKey && RANGE_WORDS[rangeKey]
    ? RANGE_WORDS[rangeKey]
    : `${whenAt(view.from, view.timezone)} to ${whenAt(view.to, view.timezone)}`;
  const raised = view.step_raised ? " (a finer step would be too many points)" : "";
  return `Every ${stepWords(view.step)}${raised}, ${span}. ${plural(n, "series", "series")}, ${plural(pts, "point", "points")}.`;
}

// Latest, lowest, highest and average of one series over the answer.
export function stats(series, metric, step) {
  const pts = series?.points ?? [];
  if (!pts.length) return [];
  let lo = Infinity, hi = -Infinity, sum = 0;
  for (const [, v, l, h] of pts) {
    lo = Math.min(lo, l);
    hi = Math.max(hi, h);
    sum += v;
  }
  const last = pts.at(-1);
  const mean = sum / pts.length;
  if (metric?.kind === "state") {
    return [
      ["Latest", fmtValue(last[1], metric, step)],
      ["On", `${Math.round(mean * 100)}%`, "of the time shown"],
    ];
  }
  if (metric?.kind === "level") {
    return [["Latest", fmtValue(last[1], metric, step)]];
  }
  return [
    ["Latest", fmtValue(last[1], metric)],
    ["Lowest", fmtValue(lo, metric)],
    ["Highest", fmtValue(hi, metric)],
    ["Average", fmtValue(mean, metric)],
  ];
}

// The words for one point: "Tue 24 Nov 14:05: Lounge 19.3°, between 19.1° and 19.4°."
export function pointText(series, metric, step, i, tz) {
  const p = series?.points?.[i];
  if (!p) return "";
  const [t, v, lo, hi] = p;
  const who = series.room ? series.room_name ?? series.room : series.label;
  let text = `${whenAt(t, tz)}: ${who} ${fmtValue(v, metric, step)}`;
  if (step > 60 && metric?.kind === "gauge" && lo !== hi) {
    text += `, between ${fmtValue(lo, metric)} and ${fmtValue(hi, metric)} in these ${stepWords(step)}`;
  }
  if (step > 60 && metric?.kind === "level" && lo !== hi) {
    text = `${whenAt(t, tz)}: ${who} ${fmtValue(lo, metric)} to ${fmtValue(hi, metric)} in these ${stepWords(step)}`;
  }
  return `${text}.`;
}

// Table rows, newest first: [time, series, value, lowest, highest].
export function tableRows(view, metrics, limit = TABLE_ROWS) {
  const rows = [];
  for (const s of view?.series ?? []) {
    const m = metrics[s.metric];
    for (const [t, v, lo, hi] of s.points) rows.push([t, seriesName(s), v, lo, hi, m]);
  }
  rows.sort((a, b) => b[0] - a[0] || a[1].localeCompare(b[1]));
  const step = view?.step ?? 60;
  return {
    total: rows.length,
    rows: rows.slice(0, limit).map(([t, name, v, lo, hi, m]) => [
      whenAt(t, view.timezone),
      name,
      fmtValue(v, m, step),
      step > 60 && m?.kind !== "state" ? fmtValue(lo, m, 60) : NONE,
      step > 60 && m?.kind !== "state" ? fmtValue(hi, m, 60) : NONE,
    ]),
  };
}

// --- the export ------------------------------------------------------------------------------

// The OpenTelemetry export in words: a badge, one line point first, then details.
export function exportView(h, nowS, tz) {
  if (!h) {
    return {
      kind: "none",
      badge: "Not set up",
      line: "Radiate can send these readings, and every decision, to an OpenTelemetry collector such as Elastic's managed OTLP endpoint. Add export.otlp to the house file to turn it on.",
      details: [],
    };
  }
  const queued = h.queued ?? {};
  const details = [["Sends to", `${h.endpoint}, ${h.protocol === "http/json" ? "JSON" : "protobuf"} over HTTP`]];
  const minutes = queued.metrics ?? 0;
  const logs = queued.logs ?? 0;
  details.push(["Waiting to send", minutes || logs
    ? `${plural(minutes, "minute", "minutes")} of readings, ${plural(logs, "log record", "log records")}`
    : "Nothing"]);
  details.push(["Sent", `${plural(h.sent?.metrics ?? 0, "data point", "data points")}, ${plural(h.sent?.logs ?? 0, "log record", "log records")}`]);
  if (h.dropped) details.push(["Dropped", `${plural(h.dropped, "item", "items")}: the queue was full, so the oldest went first`, "warn"]);
  if (h.rejected) details.push(["Rejected by the collector", plural(h.rejected, "item", "items"), "warn"]);
  if (h.status === "off") return { kind: "off", badge: "Off", line: "Turned off in the house file (export.otlp.enabled).", details };
  if (h.status === "failing") {
    const next = h.next_attempt ? ` Trying again ${within(Math.max(0, h.next_attempt - nowS))}, and keeping the data until then.` : " Retrying, and keeping the data until then.";
    const since = h.last_success ? ` Last sent at ${clockAt(h.last_success, tz)}, ${ago(nowS - h.last_success)}.` : "";
    return { kind: "attention", badge: "Failing", line: `Can't send: ${h.last_error ?? "no answer"}.${next}${since}`, details };
  }
  if (h.status === "waiting") {
    const next = h.next_attempt ? ` The next send is due ${within(Math.max(0, h.next_attempt - nowS))}.` : " The first send is due within a minute.";
    return { kind: "waiting", badge: "Waiting", line: `Nothing sent yet.${next}`, details };
  }
  return { kind: "ok", badge: "Sending", line: `Last sent at ${clockAt(h.last_success, tz)}, ${ago(nowS - h.last_success)}.`, details };
}

// --- the chart -------------------------------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// A round tick step giving at most about `n` ticks over `span`.
function tickStep(span, n = 4) {
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * mag >= raw) return f * mag;
  return 10 * mag;
}

// The y axis: domain and ticks with their labels.
export function yAxis(view, metric) {
  const step = view.step;
  if (metric?.kind === "state") {
    const ticks = step > 60 ? [[0, "0%"], [0.5, "50%"], [1, "100%"]] : [[0, "Off"], [1, "On"]];
    return { lo: 0, hi: 1, ticks };
  }
  if (metric?.kind === "level") {
    const levels = metric.levels ?? [];
    return { lo: 0, hi: Math.max(1, levels.length - 1), ticks: levels.map((name, i) => [i, name]) };
  }
  let lo = Infinity, hi = -Infinity;
  for (const s of view.series) for (const [, , l, h] of s.points) { lo = Math.min(lo, l); hi = Math.max(hi, h); }
  if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
  const st = tickStep(hi - lo);
  lo = Math.floor(lo / st) * st;
  hi = Math.ceil(hi / st) * st;
  const ticks = [];
  for (let v = lo; v <= hi + st / 2; v += st) {
    const r = Math.round(v * 1000) / 1000;
    const places = st < 1 ? (st < 0.1 ? 2 : 1) : 0;
    const unit = metric?.unit === "°C" ? "°" : metric?.unit === "%" ? "%" : "";
    ticks.push([r, `${signedNum(r, places)}${unit}`]);
  }
  return { lo, hi, ticks };
}

// X ticks: hours within a day or two, days within a month, and so on.
export function xTicks(from, to, tz, width) {
  const span = to - from;
  const room = Math.max(2, Math.floor(width / 80));
  const choices = [3600, 3 * 3600, 6 * 3600, 12 * 3600, 86400, 2 * 86400, 5 * 86400, 7 * 86400];
  const every = choices.find((c) => span / c <= room) ?? 14 * 86400;
  const out = [];
  // Align to local hours (and local midnight for days) using the zone's offset at `from`.
  const p = parts(from, tz);
  const offset = (Date.UTC(p.y, p.m - 1, p.d, Number(p.H), Number(p.M)) / 1000) - Math.floor(from / 60) * 60;
  let t = Math.ceil((from + offset) / every) * every - offset;
  for (; t <= to; t += every) out.push([t, every >= 86400 ? dayAt(t, tz) : clockAt(t, tz)]);
  return out;
}

const pad = { left: 46, right: 14, top: 12, bottom: 26 };

// Geometry the chart and its cursor share.
export function frame(view, metric, width, height) {
  const left = metric?.kind === "level" ? 58 : pad.left;
  const w = Math.max(10, width - left - pad.right);
  const h = Math.max(10, height - pad.top - pad.bottom);
  const y = yAxis(view, metric);
  const span = Math.max(1, view.to - view.from);
  return {
    left, w, h, y,
    x: (t) => left + ((t - view.from) / span) * w,
    yv: (v) => pad.top + h - ((v - y.lo) / Math.max(1e-9, y.hi - y.lo)) * h,
  };
}

// The path of one series, broken where points are missing.
function seriesPath(s, f, step, stepped) {
  let d = "";
  let prev = null;
  const gap = step * 2.5;
  for (const [t, v] of s.points) {
    const X = f.x(t).toFixed(1);
    const Y = f.yv(v).toFixed(1);
    if (prev === null || t - prev[0] > gap) d += `M${X} ${Y}`;
    else if (stepped) d += `H${X}V${Y}`;
    else d += `L${X} ${Y}`;
    prev = [t, v];
  }
  return d;
}

// The range of the ink series in each step: a band from lowest to highest.
function bandPath(s, f, step) {
  const segs = [];
  let cur = [];
  for (const p of s.points) {
    if (cur.length && p[0] - cur.at(-1)[0] > step * 2.5) { segs.push(cur); cur = []; }
    cur.push(p);
  }
  if (cur.length) segs.push(cur);
  return segs.filter((seg) => seg.length > 1).map((seg) => {
    const up = seg.map(([t, , , hi]) => `${f.x(t).toFixed(1)} ${f.yv(hi).toFixed(1)}`);
    const down = seg.slice().reverse().map(([t, , lo]) => `${f.x(t).toFixed(1)} ${f.yv(lo).toFixed(1)}`);
    return `M${up.join("L")}L${down.join("L")}Z`;
  }).join("");
}

export function chartSvg(view, metric, { width, height, focus }) {
  const f = frame(view, metric, width, height);
  const tz = view.timezone;
  const stepped = metric?.kind !== "gauge";
  const out = [`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">`];
  for (const [v, label] of f.y.ticks) {
    const Y = f.yv(v).toFixed(1);
    out.push(`<line class="rd-grid" x1="${f.left}" x2="${f.left + f.w}" y1="${Y}" y2="${Y}"/>`);
    out.push(`<text class="rd-ytick" x="${f.left - 6}" y="${Y}" dy="0.32em" text-anchor="end">${esc(label)}</text>`);
  }
  const bottom = pad.top + f.h;
  out.push(`<line class="rd-axis" x1="${f.left}" x2="${f.left + f.w}" y1="${bottom}" y2="${bottom}"/>`);
  for (const [t, label] of xTicks(view.from, view.to, tz, f.w)) {
    const X = f.x(t).toFixed(1);
    out.push(`<line class="rd-xmark" x1="${X}" x2="${X}" y1="${bottom}" y2="${bottom + 4}"/>`);
    out.push(`<text class="rd-xtick" x="${X}" y="${bottom + 17}" text-anchor="middle">${esc(label)}</text>`);
  }
  const ink = view.series.find((s) => s.key === focus) ?? view.series[0];
  if (ink && view.step > 60 && metric?.kind === "gauge") {
    const band = bandPath(ink, f, view.step);
    if (band) out.push(`<path class="rd-band" d="${band}"/>`);
  }
  for (const s of view.series) {
    if (s === ink) continue;
    out.push(`<path class="rd-line rd-other" d="${seriesPath(s, f, view.step, stepped)}"/>`);
  }
  if (ink) out.push(`<path class="rd-line rd-ink" d="${seriesPath(ink, f, view.step, stepped)}"/>`);
  out.push(`<line class="rd-cursor" x1="0" x2="0" y1="${pad.top}" y2="${bottom}" visibility="hidden"/>`);
  out.push(`<circle class="rd-dot" r="3.5" cx="0" cy="0" visibility="hidden"/>`);
  out.push(`<rect class="rd-hit" x="${f.left}" y="${pad.top}" width="${f.w}" height="${f.h}"/>`);
  out.push("</svg>");
  return out.join("");
}

// The chart's text alternative.
export function chartLabel(view, metric, focus) {
  const ink = view.series.find((s) => s.key === focus) ?? view.series[0];
  if (!ink) return "Chart with no data.";
  const pts = ink.points;
  const others = view.series.length > 1 ? ` ${plural(view.series.length - 1, "other series", "other series")} shown thinner for comparison.` : "";
  if (!pts.length) return `Line chart of ${seriesName(ink)} with no data.${others}`;
  const st = stats(ink, metric, view.step);
  const words = st.map(([label, value]) => `${label.toLowerCase()} ${value}`).join(", ");
  return `Line chart of ${seriesName(ink)}, ${dayAt(view.from, view.timezone)} to ${dayAt(view.to, view.timezone)}, every ${stepWords(view.step)}: ${words}.${others} Use the arrow keys to read each point.`;
}

// --- the view ---------------------------------------------------------------------------------

export function createData({ transport, isAuthError, onAuth }) {
  let cat = null; // GET data/series
  let view = null; // GET data
  let metrics = {}; // metric ID -> metric
  let open = false;
  let timer = null;
  let loading = false;
  let drawnWidth = 0;
  let cursor = null; // index into the ink series' points
  let focus = null; // the key of the series in ink
  let seq = 0; // so an older answer never replaces a newer one
  const q = { metric: "room.temperature", room: "", range: "24h", from: "", to: "", step: "auto" };

  const chart = () => $("data-chart");
  const metric = () => metrics[q.metric];

  function setText(id, text) {
    const el = $(id);
    if (el.textContent !== text) el.textContent = text;
  }

  function note(text, kind = "") {
    const el = $("data-note");
    el.hidden = !text;
    el.dataset.kind = kind;
    setText("data-note", text);
  }

  // --- controls ---

  function fillMetrics() {
    const have = new Set((cat?.series ?? []).map((s) => s.metric));
    const sel = $("data-metric");
    const groups = [["room", "Rooms"], ["house", "House"]].map(([scope, label]) => {
      const g = document.createElement("optgroup");
      g.label = label;
      for (const m of cat.metrics.filter((x) => x.scope === scope && have.has(x.metric))) {
        const o = document.createElement("option");
        o.value = m.metric;
        o.textContent = m.label;
        g.append(o);
      }
      return g;
    }).filter((g) => g.children.length);
    sel.replaceChildren(...groups);
    if (!have.has(q.metric)) q.metric = sel.querySelector("option")?.value ?? "";
    sel.value = q.metric;
  }

  function fillRooms() {
    const m = metric();
    const sel = $("data-room");
    const houseWide = m?.scope !== "room";
    const rooms = houseWide ? [] : (cat?.rooms ?? []).filter((r) => cat.series.some((s) => s.metric === q.metric && s.room === r.id));
    const all = document.createElement("option");
    all.value = "";
    all.textContent = houseWide ? "Whole house" : "Every room";
    sel.replaceChildren(all, ...rooms.map((r) => {
      const o = document.createElement("option");
      o.value = r.id;
      o.textContent = r.name;
      return o;
    }));
    if (houseWide || !rooms.some((r) => r.id === q.room)) q.room = "";
    sel.value = q.room;
    sel.disabled = houseWide;
  }

  function showRange() {
    for (const b of document.querySelectorAll("#data-range [data-range]")) b.setAttribute("aria-checked", String(b.dataset.range === q.range));
  }

  function fillTimes() {
    if (!cat?.now || q.range === "custom") return;
    const span = RANGES[q.range];
    $("data-from").value = inputValue(cat.now - span, cat.timezone);
    $("data-to").value = inputValue(cat.now, cat.timezone);
  }

  function params() {
    const p = new URLSearchParams();
    if (q.metric) p.set("metric", q.metric);
    if (q.room) p.set("room", q.room);
    if (q.range === "custom") {
      if (q.from) p.set("from", q.from);
      if (q.to) p.set("to", q.to);
    } else {
      p.set("from", String(Math.floor(cat.now - RANGES[q.range])));
      p.set("to", String(Math.ceil(cat.now)));
    }
    p.set("step", q.step);
    return p;
  }

  // --- results ---

  function renderStats() {
    const ink = view.series.find((s) => s.key === focus);
    const dl = $("data-stats");
    const rows = ink ? stats(ink, metric(), view.step) : [];
    dl.hidden = !rows.length;
    // With several series the figures are the ink one's, so say whose.
    const many = view.series.length > 1 && ink;
    $("data-stats-for").hidden = !many;
    setText("data-stats-for", many ? `Figures for ${seriesName(ink)}, the line in ink.` : "");
    dl.replaceChildren(...rows.map(([label, value, sub]) => {
      const div = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      const v = document.createElement("span");
      v.textContent = value;
      dd.append(v);
      if (sub) {
        const s = document.createElement("span");
        s.className = "sub";
        s.textContent = sub;
        dd.append(s);
      }
      div.append(dt, dd);
      return div;
    }));
  }

  function renderLegend() {
    const ul = $("data-legend");
    ul.hidden = view.series.length < 2;
    ul.replaceChildren(...view.series.map((s) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "rd-key";
      b.dataset.key = s.key;
      b.setAttribute("aria-pressed", String(s.key === focus));
      const sw = document.createElement("span");
      sw.className = "rd-swatch";
      sw.setAttribute("aria-hidden", "true");
      b.append(sw, document.createTextNode(s.room ? s.room_name ?? s.room : s.label));
      li.append(b);
      return li;
    }));
  }

  function renderTable() {
    const { total, rows } = tableRows(view, metrics);
    $("data-table-body").replaceChildren(...rows.map((cells) => {
      const tr = document.createElement("tr");
      cells.forEach((c, i) => {
        const td = document.createElement(i === 0 ? "th" : "td");
        if (i === 0) td.scope = "row";
        td.textContent = c;
        tr.append(td);
      });
      return tr;
    }));
    const wide = view.step > 60;
    for (const el of document.querySelectorAll(".rd-table .rd-range-col")) el.hidden = !wide;
    for (const tr of $("data-table-body").children) {
      tr.children[3].hidden = !wide;
      tr.children[4].hidden = !wide;
    }
    setText("data-table-note", total > rows.length
      ? `The newest ${plural(rows.length, "row", "rows")} of ${total.toLocaleString("en-GB")}. Download the CSV for all of them.`
      : `${plural(total, "row", "rows")}, newest first.`);
  }

  function readout(i) {
    const ink = view?.series.find((s) => s.key === focus);
    const pts = ink?.points ?? [];
    if (!pts.length) { setText("data-readout", ""); return; }
    const at = i == null ? pts.length - 1 : Math.max(0, Math.min(pts.length - 1, i));
    setText("data-readout", pointText(ink, metric(), view.step, at, view.timezone));
    const svg = chart().querySelector("svg");
    if (!svg) return;
    const f = frame(view, metric(), drawnWidth, Number(svg.getAttribute("height")));
    const [t, v] = pts[at];
    const line = svg.querySelector(".rd-cursor");
    const dot = svg.querySelector(".rd-dot");
    const show = i == null ? "hidden" : "visible";
    line.setAttribute("x1", f.x(t));
    line.setAttribute("x2", f.x(t));
    dot.setAttribute("cx", f.x(t));
    dot.setAttribute("cy", f.yv(v));
    line.setAttribute("visibility", show);
    dot.setAttribute("visibility", show);
  }

  function drawChart() {
    const box = chart();
    const width = Math.floor(box.clientWidth);
    if (!width || !view) return;
    drawnWidth = width;
    const height = width < 520 ? 200 : 260;
    box.innerHTML = chartSvg(view, metric(), { width, height, focus });
    box.setAttribute("aria-label", chartLabel(view, metric(), focus));
    readout(cursor);
  }

  function render() {
    const m = metric();
    const has = view.series.some((s) => s.points.length);
    if (!view.series.some((s) => s.key === focus)) {
      focus = (view.series.find((s) => s.points.length) ?? view.series[0])?.key ?? null;
      cursor = null;
    }
    setText("data-chart-h", titleText(view, m, q.room ? $("data-room").selectedOptions[0]?.textContent : ""));
    setText("data-meta", metaText(view, q.range === "custom" ? null : q.range));
    $("data-empty").hidden = has;
    $("data-chart-wrap").hidden = !has;
    $("data-downloads").hidden = !has;
    $("data-table-toggle").hidden = !has;
    if (view.partial) {
      note("Still indexing older readings, so part of this time may be missing for a few minutes.", "cool");
    } else {
      note("");
    }
    if (!has) {
      $("data-stats").hidden = true;
      $("data-legend").hidden = true;
      return;
    }
    renderStats();
    renderLegend();
    renderTable();
    if (open) drawChart();
    else drawnWidth = 0;
  }

  function renderExport() {
    const ex = exportView(cat?.export ?? null, Date.now() / 1000, cat?.timezone ?? "UTC");
    const badge = $("data-export-badge");
    badge.dataset.kind = ex.kind;
    setText("data-export-badge", ex.badge);
    setText("data-export-line", ex.line);
    $("data-export").dataset.kind = ex.kind;
    const dl = $("data-export-list");
    dl.hidden = !ex.details.length;
    dl.replaceChildren(...ex.details.map(([label, value, kind]) => {
      const div = document.createElement("div");
      if (kind) div.dataset.kind = kind;
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      div.append(dt, dd);
      return div;
    }));
  }

  function renderCatalogue() {
    setText("data-summary", summaryText(cat));
    renderExport();
    const ok = Boolean(cat?.available);
    $("data-body").hidden = !ok;
    if (!ok) return;
    metrics = Object.fromEntries(cat.metrics.map((m) => [m.metric, m]));
    fillMetrics();
    fillRooms();
    showRange();
    fillTimes();
    renderResults();
  }

  async function query() {
    if (!cat?.available || !q.metric) return;
    const mine = ++seq;
    try {
      const v = await transport.get(`data?${params()}`);
      if (mine !== seq) return;
      view = v;
      render();
    } catch (err) {
      if (mine !== seq) return;
      if (isAuthError(err)) { onAuth(); return; }
      note(/HTTP 400/.test(String(err?.message)) ? `Not shown: ${String(err.message).replace(/^.*HTTP 400 /, "")}` : "Couldn't load the readings. Retrying…", "warn");
    }
  }

  async function load() {
    if (loading) return;
    loading = true;
    try {
      cat = await transport.get("data/series");
      renderCatalogue();
      if (open) await query();
    } catch (err) {
      if (isAuthError(err)) onAuth();
      else if (open) note("Couldn't load the readings. Retrying…", "warn");
    }
    loading = false;
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    if (open) timer = setTimeout(load, OPEN_MS);
  }

  function rerun() {
    cursor = null;
    if (q.range !== "custom") load(); // refresh "now" first
    else query();
  }

  // --- search ---

  function renderResults() {
    const list = search(cat, $("data-search").value);
    const ul = $("data-results");
    const typed = $("data-search").value.trim() !== "";
    ul.hidden = !typed;
    if (!typed) return;
    if (!list.length) {
      const li = document.createElement("li");
      li.className = "rd-none";
      li.textContent = "No series match. Try a room name, or a word such as temperature, valve or burner.";
      ul.replaceChildren(li);
      return;
    }
    ul.replaceChildren(...list.map((s) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "rd-result";
      b.dataset.metric = s.metric;
      b.dataset.room = s.room ?? "";
      b.textContent = seriesName(s);
      li.append(b);
      return li;
    }));
  }

  function wire() {
    $("data-search").addEventListener("input", renderResults);
    $("data-search").addEventListener("keydown", (e) => {
      if (e.key === "Escape") { $("data-search").value = ""; renderResults(); }
      if (e.key === "Enter") {
        e.preventDefault();
        $("data-results").querySelector(".rd-result")?.click();
      }
    });
    $("data-results").addEventListener("click", (e) => {
      const b = e.target.closest?.(".rd-result");
      if (!b) return;
      q.metric = b.dataset.metric;
      fillRooms();
      q.room = b.dataset.room;
      $("data-metric").value = q.metric;
      fillRooms();
      focus = null;
      $("data-search").value = "";
      renderResults();
      $("data-search").focus();
      rerun();
    });
    $("data-metric").addEventListener("change", (e) => {
      q.metric = e.target.value;
      fillRooms();
      focus = null;
      rerun();
    });
    $("data-room").addEventListener("change", (e) => {
      q.room = e.target.value;
      focus = null;
      rerun();
    });
    $("data-step").addEventListener("change", (e) => { q.step = e.target.value; rerun(); });
    for (const b of document.querySelectorAll("#data-range [data-range]")) {
      b.addEventListener("click", () => {
        if (q.range === b.dataset.range) return;
        q.range = b.dataset.range;
        showRange();
        fillTimes();
        rerun();
      });
    }
    for (const id of ["data-from", "data-to"]) {
      $(id).addEventListener("change", () => {
        q.range = "custom";
        q.from = $("data-from").value;
        q.to = $("data-to").value;
        showRange();
        rerun();
      });
    }
    $("data-legend").addEventListener("click", (e) => {
      const b = e.target.closest?.(".rd-key");
      if (!b || b.dataset.key === focus) return;
      focus = b.dataset.key;
      cursor = null;
      for (const k of $("data-legend").querySelectorAll(".rd-key")) k.setAttribute("aria-pressed", String(k === b));
      renderStats();
      drawChart();
    });
    const box = chart();
    box.addEventListener("keydown", (e) => {
      const ink = view?.series.find((s) => s.key === focus);
      const n = ink?.points.length ?? 0;
      if (!n) return;
      const at = cursor ?? n - 1;
      const to = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: n - 1, PageUp: at - 10, PageDown: at + 10 }[e.key];
      if (to == null) return;
      e.preventDefault();
      cursor = Math.max(0, Math.min(n - 1, to));
      readout(cursor);
    });
    box.addEventListener("pointermove", (e) => {
      const ink = view?.series.find((s) => s.key === focus);
      const svg = box.querySelector("svg");
      if (!ink?.points.length || !svg) return;
      const f = frame(view, metric(), drawnWidth, Number(svg.getAttribute("height")));
      const x = e.clientX - svg.getBoundingClientRect().left;
      const t = view.from + ((x - f.left) / f.w) * (view.to - view.from);
      let best = 0;
      for (let i = 1; i < ink.points.length; i++) {
        if (Math.abs(ink.points[i][0] - t) < Math.abs(ink.points[best][0] - t)) best = i;
      }
      cursor = best;
      readout(cursor);
    });
    box.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      cursor = null;
      readout(null);
    });
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(() => {
        if (view && open && Math.floor(box.clientWidth) !== drawnWidth) drawChart();
      }).observe(box);
    }
    const tableBtn = $("data-table-toggle");
    tableBtn.addEventListener("click", () => {
      const on = tableBtn.getAttribute("aria-pressed") !== "true";
      tableBtn.setAttribute("aria-pressed", String(on));
      tableBtn.textContent = on ? "Hide table" : "Show as table";
      $("data-table-wrap").hidden = !on;
    });
    $("data-csv").addEventListener("click", () => download("csv"));
    $("data-json").addEventListener("click", () => download("json"));
  }

  function filename(ext) {
    const day = view ? inputValue(view.to, view.timezone).slice(0, 10) : "data";
    return `radiate-${q.metric}${q.room ? `-${q.room}` : ""}-${day}.${ext}`;
  }

  async function download(kind) {
    const status = $("data-dl-status");
    status.textContent = "";
    try {
      let blob;
      if (kind === "json") {
        blob = new Blob([JSON.stringify(view, null, 2)], { type: "application/json" });
      } else {
        const p = params();
        p.set("format", "csv");
        blob = new Blob([await transport.text(`data?${p}`)], { type: "text/csv" });
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename(kind);
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      status.textContent = `Downloaded ${a.download}.`;
    } catch (err) {
      if (isAuthError(err)) { onAuth(); return; }
      status.textContent = "Not downloaded. Check the connection and try again.";
    }
  }

  wire();

  return {
    // Whether this server records raw data: false for a 404 or no history, null if it couldn't say.
    async available() {
      try {
        cat = await transport.get("data/series");
        renderCatalogue();
        return Boolean(cat.available);
      } catch (err) {
        if (isAuthError(err)) return null;
        return /HTTP 404|not found/.test(String(err?.message)) ? false : null;
      }
    },
    show() {
      open = true;
      load();
    },
    hide() {
      if (!open) return;
      open = false;
      clearTimeout(timer);
    },
  };
}
