// Savings view: the oil Radiate saved against one stated baseline, with the comfort
// it cost beside it (GET /api/v1/savings, spec 5.9 and 10). The server works out every
// figure and decides when there are enough days to show one; this module only words
// and draws them. Nothing here computes a saving of its own.
//
// The chart is inline SVG: one slot per day (or week), the oil used as a solid bar
// and the baseline's oil as an outline around it, on one zero-based axis, so the gap
// is the saving and a day that used more shows its bar above the outline. A day that
// doesn't count is a hatched empty slot with its reason, never a zero. Slots are
// reachable with the keyboard (one tab stop, arrow keys between slots), and the words
// for the chosen slot sit in a line under the chart, for touch as much as for mouse.

const $ = (id) => document.getElementById(id);
const OPEN_MS = 60000; // refresh while the view is open; days close once a day
const CLOSED_MS = 600000; // and now and then for the House view's line
const MINUS = "−"; // a real minus sign, not a dash
const NONE = "–"; // the one placeholder for a missing value (design standards)

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- words -----------------------------------------------------------------------------

const parse = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
// "1 November", "1 Nov", "Mon 3 Nov".
export const longDate = (iso) => { const d = parse(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
export const shortDate = (iso) => { const d = parse(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`; };
export const dayDate = (iso) => { const d = parse(iso); return `${DAYS[d.getUTCDay()]} ${shortDate(iso)}`; };

// Litres in words: one decimal under 10, whole litres above. Always the size; the
// sentence says which way.
export function litres(x) {
  const a = Math.abs(x);
  return a < 9.95 ? a.toFixed(1) : String(Math.round(a));
}
const litresUnit = (x) => `${litres(x)} ${litres(x) === "1.0" ? "litre" : "litres"}`;
// A signed figure for tables and the readout: "0.8", "−0.4".
export function signed(x, places = 1) {
  if (x == null) return NONE;
  const v = Number(x.toFixed(places));
  return v < 0 ? `${MINUS}${Math.abs(v).toFixed(places)}` : v.toFixed(places);
}
const fixed = (x, places = 1) => (x == null ? NONE : x.toFixed(places));
export const percent = (share) => (share == null ? NONE : `${Math.round(share * 100)}%`);

// Comfort beside every figure: how warm the rooms in use were.
function comfortClause(share) {
  if (share == null) return "with no room in use to keep warm";
  return `with rooms in use warm ${percent(share)} of the time`;
}

// The headline that carries the number for people who skip the chart.
export function headlineText(v) {
  if (v.status === "ready" && v.totals) {
    const t = v.totals;
    const since = longDate(t.since);
    const comfort = comfortClause(t.warm_share);
    if (Math.abs(t.litres_saved) < 0.05) return `About the same oil as the baseline since ${since}, ${comfort}.`;
    if (t.litres_saved < 0) return `About ${litresUnit(t.litres_saved)} more than the baseline since ${since}, ${comfort}.`;
    return `About ${litresUnit(t.litres_saved)} of oil saved since ${since}, ${comfort}.`;
  }
  if (v.status === "learning") return learningText(v);
  return unavailableHeadline(v);
}

export function learningText(v) {
  return `Still learning how much oil this house uses: ${v.why ?? `${v.progress.eligible_days} of ${v.progress.needed_days} days`}.`;
}

// What still learning means, and when figures start.
export function learningDetail(v) {
  const p = v.progress;
  const left = Math.max(0, p.needed_days - p.eligible_days);
  const days = left
    ? `Figures start once ${p.needed_days} full days have counted, so at least ${left} more ${left === 1 ? "day" : "days"}`
    : `${p.eligible_days} days have counted`;
  return `${days}, and once oil use follows the weather closely enough to compare with the baseline. Until then, this is the oil used each day so far.`;
}

const UNAVAILABLE = {
  "no household": [
    "Savings need a household",
    "The baseline is a plain heating timer built from your household's times, so Radiate needs to know who lives here and how each room is used before it can compare.",
  ],
  "no outdoor sensor": [
    "Savings need an outdoor sensor",
    "Cold days use more oil than mild ones, so Radiate compares like with like using the outdoor temperature. Add an outdoor sensor as house.outdoor_sensor in the house file.",
  ],
  "no nozzle rating": [
    "Savings need the nozzle rating",
    "Radiate turns burner time into litres with the boiler's nozzle rating. Add it as boiler.nozzle_lph in the house file; it's on the burner's nozzle or in the service record.",
  ],
};

export function unavailableHeadline(v) {
  return (UNAVAILABLE[v.why] ?? ["Savings aren't measured yet"])[0];
}

export function unavailableText(v) {
  return (UNAVAILABLE[v.why] ?? ["", `Radiate can't measure savings yet: ${v.why ?? "no reason given"}.`])[1];
}

// Whether litres come from relay time, and so read high.
export function basisLine(v) {
  if (v.litres_upper_bound) return "Litres are an upper bound until the burner itself is measured.";
  return v.basis_text ?? "";
}

// --- slots: days or weeks ----------------------------------------------------------------

const mondayOf = (iso) => {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

// The slots the chart and the readout show, oldest first. Figures are the server's: a
// week only adds up the days that counted in it.
export function slots(v, mode = "days") {
  const days = v.days ?? [];
  if (mode !== "weeks") {
    return days.map((d) => ({
      key: d.date,
      label: dayDate(d.date),
      tick: shortDate(d.date),
      counted: d.eligible ? 1 : 0,
      total: 1,
      eligible: d.eligible,
      why: d.why,
      litres: d.eligible ? d.litres : null,
      baseline: d.eligible ? d.litres_baseline : null,
      saved: d.eligible ? d.litres_saved : null,
      warm: d.warm_share,
      deficit: d.comfort_deficit_kh,
      outdoor: d.outdoor_mean_c,
    }));
  }
  const weeks = new Map();
  for (const d of days) {
    const key = mondayOf(d.date);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key).push(d);
  }
  return [...weeks].map(([key, list]) => {
    const counted = list.filter((d) => d.eligible);
    const sum = (k) => (counted.length && counted.every((d) => d[k] != null) ? counted.reduce((a, d) => a + d[k], 0) : null);
    const deficits = list.filter((d) => d.comfort_deficit_kh != null);
    return {
      key,
      week: true,
      label: `Week of ${shortDate(key)}`,
      tick: shortDate(key),
      counted: counted.length,
      total: list.length,
      eligible: counted.length > 0,
      why: counted.length ? null : [...new Set(list.map((d) => d.why).filter(Boolean))].join("; ") || "no day counted",
      litres: sum("litres"),
      baseline: sum("litres_baseline"),
      saved: sum("litres_saved"),
      warm: null,
      deficit: deficits.length ? deficits.reduce((a, d) => a + d.comfort_deficit_kh, 0) : null,
      outdoor: null,
    };
  });
}

// The words for one slot: what the chart shows there, with comfort beside it.
export function slotText(s) {
  if (!s.eligible) return `${s.label}: not counted, ${s.why}.`;
  const parts = [];
  if (s.week) parts.push(`${s.counted} of ${s.total} ${s.total === 1 ? "day" : "days"} counted`);
  if (s.litres != null) parts.push(`${s.litres.toFixed(1)} L used`);
  if (s.saved != null) {
    parts.push(`baseline about ${s.baseline.toFixed(1)} L`);
    if (Math.abs(s.saved) < 0.05) parts.push("about the same as the baseline");
    else if (s.saved < 0) parts.push(`about ${litres(s.saved)} L more than the baseline`);
    else parts.push(`about ${litres(s.saved)} L saved`);
  }
  const comfort = [];
  if (s.warm != null) comfort.push(`rooms in use warm ${percent(s.warm)} of the time`);
  if (s.deficit != null) comfort.push(`${s.deficit.toFixed(1)} degree-hours short`);
  if (s.outdoor != null) comfort.push(`${s.outdoor.toFixed(1)}° outside on average`);
  const lead = `${s.label}: ${parts.join(", ")}.`;
  return comfort.length ? `${lead} ${comfort.join(", ").replace(/^./, (c) => c.toUpperCase())}.` : lead;
}

// The chart's text alternative: what it is, the span, and the trend.
export function trendText(v, list, mode = "days") {
  const unit = mode === "weeks" ? "week" : "day";
  if (!list.length) return `Oil used each ${unit}: no full ${unit} yet.`;
  const span = `${list.length} ${list.length === 1 ? unit : `${unit}s`} from ${list[0].tick} to ${list.at(-1).tick}`;
  const counted = list.filter((s) => s.eligible);
  const skipped = list.length - counted.length;
  const notCounted = skipped ? ` ${skipped} not counted.` : "";
  if (v.status !== "ready") {
    return `Bar chart of oil used each ${unit}, ${span}. ${counted.length} counted so far.${notCounted}`;
  }
  const less = counted.filter((s) => s.saved != null && s.saved >= 0.05).length;
  const more = counted.filter((s) => s.saved != null && s.saved <= -0.05).length;
  return `Bar chart of oil used each ${unit} against the baseline, ${span}. Less than the baseline on ${less}, more on ${more}.${notCounted}`;
}

// The table view: the same numbers as the chart, one row per day.
export function tableRows(v) {
  return (v.days ?? []).map((d) => [
    dayDate(d.date),
    d.eligible ? "Yes" : `No, ${d.why}`,
    fixed(d.litres),
    fixed(d.litres_baseline),
    signed(d.litres_saved),
    d.outdoor_mean_c == null ? NONE : `${d.outdoor_mean_c.toFixed(1)}°`,
    percent(d.warm_share),
    fixed(d.comfort_deficit_kh),
  ]);
}
export const TABLE_HEAD = ["Day", "Counted", "Oil used (L)", "Baseline (L)", "Saved (L)", "Outdoor", "Rooms in use warm", "Short (degree-hours)"];

// The statistics row, as [label, value, detail].
export function stats(v) {
  if (v.status === "ready" && v.totals) {
    const t = v.totals;
    const pct = t.percent_saved;
    const way = pct == null ? "" : pct < 0 ? `${Math.abs(pct).toFixed(1)}% more than the baseline` : `${pct.toFixed(1)}% less than the baseline`;
    return [
      [t.litres_saved < 0 ? "Oil over the baseline" : "Oil saved", `About ${litres(t.litres_saved)} L`, way],
      ["Oil used", `${litres(t.litres_used)} L`, `Baseline about ${litres(t.litres_baseline)} L`],
      ["Rooms in use warm", percent(t.warm_share), `${t.comfort_deficit_kh.toFixed(1)} degree-hours short in all`],
      ["Days counted", String(t.days), `Since ${shortDate(t.since)}`],
    ];
  }
  const counted = (v.days ?? []).filter((d) => d.eligible && d.litres != null);
  const used = counted.reduce((a, d) => a + d.litres, 0);
  const latest = (v.days ?? []).filter((d) => !d.partial && d.warm_share != null).at(-1);
  return [
    ["Days counted", `${v.progress.eligible_days} of ${v.progress.needed_days}`, ""],
    ["Oil used on those days", counted.length ? `${litres(used)} L` : NONE, counted.length ? `${litres(used / counted.length)} L a day on average${v.litres_upper_bound ? ", an upper bound" : ""}` : ""],
    ["Rooms in use warm", latest ? percent(latest.warm_share) : NONE, latest ? `On ${shortDate(latest.date)}` : ""],
  ];
}

// The House view's one line, once there are figures.
export function houseLine(v) {
  return v.status === "ready" ? headlineText(v) : "";
}

// --- drawing ---------------------------------------------------------------------------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const r1 = (x) => Math.round(x * 10) / 10;

// A round axis step giving about four lines.
export function niceStep(max) {
  if (!(max > 0)) return 1;
  const raw = max / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw);
}

// The bar chart as SVG markup, `width` by `height` px. `ready` draws the baseline
// outlines. `active` is the index of the slot with the tab stop.
export function chartSvg(list, { width, height, ready, active = list.length - 1, labelEvery }) {
  const padL = 40, padR = 4, padT = 10, padB = 22;
  const plotW = Math.max(10, width - padL - padR);
  const plotH = Math.max(10, height - padT - padB);
  const top = Math.max(0, ...list.flatMap((s) => [s.litres ?? 0, ready ? s.baseline ?? 0 : 0]));
  const step = niceStep(top);
  const yMax = Math.max(step, Math.ceil(top / step) * step);
  const y = (val) => r1(padT + plotH - (val / yMax) * plotH);
  const sw = plotW / Math.max(1, list.length);
  const outer = Math.max(3, Math.min(sw * 0.78, 40));
  const inner = Math.max(2, outer * (ready ? 0.56 : 1));
  const every = labelEvery ?? Math.max(1, Math.ceil(list.length / Math.max(1, Math.floor(plotW / 56))));
  const out = [];
  out.push(`<svg class="sv-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="false">`);
  out.push(`<defs><pattern id="sv-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="sv-hatch-line"/></pattern></defs>`);
  for (let t = 0; t <= yMax + 1e-9; t += step) {
    const yy = y(t);
    out.push(`<line class="${t === 0 ? "sv-zero" : "sv-grid"}" x1="${padL}" x2="${width - padR}" y1="${yy}" y2="${yy}"/>`);
    const unit = t + step > yMax + 1e-9 ? " L" : "";
    out.push(`<text class="sv-ytick" x="${padL - 6}" y="${yy + 4}" text-anchor="end">${Number(t.toFixed(2))}${unit}</text>`);
  }
  list.forEach((s, i) => {
    const cx = padL + sw * (i + 0.5);
    const tab = i === active ? 0 : -1;
    out.push(`<g class="sv-slot" data-i="${i}" tabindex="${tab}" role="img" aria-label="${esc(slotText(s))}" data-counted="${s.eligible}">`);
    out.push(`<rect class="sv-hit" x="${r1(padL + sw * i)}" y="${padT}" width="${r1(sw)}" height="${plotH}"/>`);
    if (!s.eligible || s.litres == null) {
      out.push(`<rect class="sv-empty" x="${r1(cx - outer / 2)}" y="${padT}" width="${r1(outer)}" height="${plotH}"/>`);
    } else {
      out.push(`<rect class="sv-act" x="${r1(cx - inner / 2)}" y="${y(s.litres)}" width="${r1(inner)}" height="${r1(y(0) - y(s.litres))}"/>`);
      if (ready && s.baseline != null) {
        out.push(`<rect class="sv-base" x="${r1(cx - outer / 2)}" y="${y(s.baseline)}" width="${r1(outer)}" height="${r1(y(0) - y(s.baseline))}"/>`);
      }
    }
    out.push(`<rect class="sv-ring" x="${r1(cx - outer / 2 - 3)}" y="${padT - 3}" width="${r1(outer + 6)}" height="${plotH + 6}"/>`);
    out.push("</g>");
    if (i % every === 0) {
      out.push(`<text class="sv-xtick" x="${r1(cx)}" y="${height - 6}" text-anchor="middle">${esc(s.tick)}</text>`);
    }
  });
  out.push("</svg>");
  return out.join("");
}

// The running total of litres saved, as [label, total] points, from the first day
// counted. The server's total covers every counted day kept, so the line starts where
// the days listed begin within it.
export function cumulative(v) {
  if (v.status !== "ready" || !v.totals) return [];
  const counted = (v.days ?? []).filter((d) => d.eligible && d.litres_saved != null);
  let run = v.totals.litres_saved - counted.reduce((a, d) => a + d.litres_saved, 0);
  const pts = [];
  for (const d of counted) {
    run += d.litres_saved;
    pts.push([d.date, run]);
  }
  return pts;
}

export function lineSvg(pts, { width, height }) {
  const padL = 34, padR = 8, padT = 8, padB = 8;
  const vals = pts.map((p) => p[1]);
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const span = hi - lo || 1;
  const x = (i) => r1(padL + (pts.length < 2 ? 0 : (i / (pts.length - 1)) * (width - padL - padR)));
  const y = (val) => r1(padT + (1 - (val - lo) / span) * (height - padT - padB));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p[1])}`).join(" ");
  return [
    `<svg class="sv-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">`,
    `<line class="sv-zero" x1="${padL}" x2="${width - padR}" y1="${y(0)}" y2="${y(0)}"/>`,
    `<text class="sv-ytick" x="${padL - 6}" y="${y(0) + 4}" text-anchor="end">0</text>`,
    `<path class="sv-line" d="${d}"/>`,
    pts.length ? `<rect class="sv-dot" x="${x(pts.length - 1) - 3}" y="${y(vals.at(-1)) - 3}" width="6" height="6"/>` : "",
    "</svg>",
  ].join("");
}

export function cumulativeText(v, pts) {
  if (!pts.length) return "";
  const total = pts.at(-1)[1];
  const since = shortDate(v.totals.since);
  if (Math.abs(total) < 0.05) return `About the same oil as the baseline in all since ${since}.`;
  return total < 0
    ? `Running total: about ${litres(total)} L more than the baseline since ${since}.`
    : `Running total: about ${litres(total)} L saved since ${since}.`;
}

// --- the view --------------------------------------------------------------------------

export function createSavings({ transport, isAuthError, onAuth, onView }) {
  let view = null;
  let key = null; // the body last drawn, so a tick with nothing new redraws nothing
  let timer = null;
  let open = false;
  let loading = false;
  let mode = "days";
  let active = null; // the slot key with the tab stop
  let list = [];
  let drawnWidth = 0;

  const chart = () => $("savings-chart");

  function setText(id, text) {
    const el = $(id);
    if (el.textContent !== text) el.textContent = text;
    el.hidden = !text;
  }

  function renderStats(v) {
    const dl = $("savings-stats");
    dl.replaceChildren(...stats(v).map(([label, value, sub]) => {
      const div = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      const val = document.createElement("span");
      val.textContent = value;
      dd.append(val);
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

  function readout(i) {
    const s = list[i];
    $("savings-readout").textContent = s ? slotText(s) : "";
  }

  function drawChart() {
    const box = chart();
    const width = Math.floor(box.clientWidth);
    if (!width) return;
    drawnWidth = width;
    const focused = box.contains(document.activeElement) ? document.activeElement.dataset.i : null;
    let i = list.findIndex((s) => s.key === active);
    if (i < 0) i = list.length - 1;
    const phone = width < 520;
    box.innerHTML = chartSvg(list, { width, height: phone ? 180 : 220, ready: view.status === "ready", active: i });
    box.setAttribute("aria-label", trendText(view, list, mode));
    readout(i);
    if (focused != null) box.querySelector(`.sv-slot[data-i="${i}"]`)?.focus();
  }

  function move(to) {
    const slotsEl = chart().querySelectorAll(".sv-slot");
    if (!slotsEl.length) return;
    const i = Math.max(0, Math.min(slotsEl.length - 1, to));
    for (const g of slotsEl) g.setAttribute("tabindex", "-1");
    slotsEl[i].setAttribute("tabindex", "0");
    slotsEl[i].focus();
    active = list[i]?.key ?? null;
    readout(i);
  }

  function wireChart() {
    const box = chart();
    box.addEventListener("keydown", (e) => {
      const at = Number(document.activeElement?.dataset?.i);
      if (Number.isNaN(at)) return;
      const to = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: list.length - 1 }[e.key];
      if (to == null) return;
      e.preventDefault();
      move(to);
    });
    box.addEventListener("focusin", (e) => {
      const i = Number(e.target?.dataset?.i);
      if (!Number.isNaN(i)) { active = list[i]?.key ?? null; readout(i); }
    });
    box.addEventListener("click", (e) => {
      const g = e.target.closest?.(".sv-slot");
      if (g) move(Number(g.dataset.i));
    });
    box.addEventListener("pointerover", (e) => {
      const g = e.target.closest?.(".sv-slot");
      if (g && e.pointerType === "mouse") readout(Number(g.dataset.i));
    });
    box.addEventListener("pointerleave", () => {
      const i = list.findIndex((s) => s.key === active);
      readout(i < 0 ? list.length - 1 : i);
    });
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(() => {
        if (view && open && Math.floor(box.clientWidth) !== drawnWidth) drawChart();
      }).observe(box);
    }
  }

  function renderRooms(v) {
    const rows = v.rooms ?? [];
    $("savings-rooms-section").hidden = !rows.length;
    if (!rows.length) return;
    const max = Math.max(...rows.map((r) => Math.abs(r.litres_saved)), 0.01);
    const anyNegative = rows.some((r) => r.litres_saved < 0);
    const ul = $("savings-rooms");
    ul.dataset.negative = String(anyNegative);
    ul.replaceChildren(...rows.map((r) => {
      const li = document.createElement("li");
      li.className = "sv-room";
      const name = document.createElement("span");
      name.className = "sv-room-name";
      name.textContent = r.name;
      const track = document.createElement("span");
      track.className = "sv-room-track";
      track.setAttribute("aria-hidden", "true");
      const fill = document.createElement("span");
      fill.className = "sv-room-fill";
      fill.dataset.sign = r.litres_saved < 0 ? "minus" : "plus";
      fill.style.transform = `scaleX(${Math.abs(r.litres_saved) / max})`;
      track.append(fill);
      const value = document.createElement("span");
      value.className = "sv-room-value";
      value.textContent = `${signed(r.litres_saved)} L`;
      const sub = document.createElement("span");
      sub.className = "sv-room-sub";
      sub.textContent = r.warm_share == null
        ? "Not in use in this time."
        : `Warm ${percent(r.warm_share)} of the time in use, ${r.comfort_deficit_kh.toFixed(1)} degree-hours short.`;
      li.append(name, track, value, sub);
      return li;
    }));
  }

  function renderTable(v) {
    const body = $("savings-table-body");
    body.replaceChildren(...tableRows(v).map((cells) => {
      const tr = document.createElement("tr");
      cells.forEach((c, i) => {
        const td = document.createElement(i === 0 ? "th" : "td");
        if (i === 0) td.scope = "row";
        td.textContent = c;
        tr.append(td);
      });
      return tr;
    }));
    $("savings-table-empty").hidden = (v.days ?? []).length > 0;
  }

  function render(v) {
    view = v;
    onView?.(v);
    const next = JSON.stringify(v);
    if (next === key) return;
    key = next;
    const state = v.status;
    $("savings").dataset.state = state;
    setText("savings-headline", headlineText(v));
    // Unavailable: what's missing and how to add it. Nothing else applies.
    $("savings-missing").hidden = state !== "unavailable";
    setText("savings-missing-text", state === "unavailable" ? unavailableText(v) : "");
    $("savings-body").hidden = state === "unavailable";
    if (state === "unavailable") return;
    setText("savings-baseline", v.baseline?.text ?? "");
    setText("savings-basis", basisLine(v));
    const learning = state === "learning";
    $("savings-progress").hidden = !learning;
    if (learning) {
      const p = v.progress;
      $("savings-meter").style.transform = `scaleX(${Math.max(0, Math.min(1, p.eligible_days / Math.max(1, p.needed_days)))})`;
      setText("savings-learning", learningDetail(v));
    }
    renderStats(v);
    $("savings-chart-h").textContent = learning ? "Oil used each day so far" : "Oil used against the baseline";
    $("savings-legend-base").hidden = learning;
    $("savings-modes").hidden = (v.days ?? []).length < 8;
    list = slots(v, mode);
    $("savings-chart-empty").hidden = list.length > 0;
    $("savings-chart-wrap").hidden = !list.length;
    if (open) drawChart();
    else drawnWidth = 0;
    const skipped = (v.days ?? []).filter((d) => !d.eligible);
    const ul = $("savings-skipped");
    ul.replaceChildren(...skipped.map((d) => {
      const li = document.createElement("li");
      li.textContent = `${dayDate(d.date)}: ${d.why}.`;
      return li;
    }));
    $("savings-skipped-section").hidden = !skipped.length;
    const pts = cumulative(v);
    $("savings-running").hidden = pts.length < 2;
    if (pts.length >= 2) {
      const box = $("savings-line-chart");
      box.innerHTML = lineSvg(pts, { width: Math.max(200, Math.floor(box.clientWidth) || 320), height: 90 });
      setText("savings-running-text", cumulativeText(v, pts));
    }
    renderRooms(v);
    renderTable(v);
  }

  async function load() {
    if (loading) return;
    loading = true;
    try {
      render(await transport.get("savings"));
    } catch (err) {
      if (isAuthError(err)) onAuth();
      else if (!view && open) $("savings-headline").textContent = "Couldn't load the savings. Retrying…";
    }
    loading = false;
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(load, open ? OPEN_MS : CLOSED_MS);
  }

  // Days or weeks, and the table.
  for (const b of document.querySelectorAll("#savings-modes [data-mode]")) {
    b.addEventListener("click", () => {
      if (b.dataset.mode === mode) return;
      mode = b.dataset.mode;
      for (const o of document.querySelectorAll("#savings-modes [data-mode]")) o.setAttribute("aria-checked", String(o === b));
      active = null;
      if (view) { list = slots(view, mode); drawChart(); }
    });
  }
  const tableBtn = $("savings-table-toggle");
  tableBtn.addEventListener("click", () => {
    const on = tableBtn.getAttribute("aria-pressed") !== "true";
    tableBtn.setAttribute("aria-pressed", String(on));
    tableBtn.textContent = on ? "Hide table" : "Show as table";
    $("savings-table-wrap").hidden = !on;
  });
  wireChart();

  return {
    // Whether this server offers savings: false for a 404, null if it couldn't say.
    async available() {
      try {
        render(await transport.get("savings"));
        schedule();
        return true;
      } catch (err) {
        if (isAuthError(err)) return null;
        return /HTTP 404|not found/.test(String(err?.message)) ? false : null;
      }
    },
    show() {
      open = true;
      if (view) {
        key = null;
        render(view); // draw at the width the view now has
      }
      load();
    },
    hide() {
      if (!open) return;
      open = false;
      schedule();
    },
    refresh: load,
  };
}
