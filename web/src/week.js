// Week view: each room's week as seven 24-hour bars, from GET /api/v1/schedules.
// The pure helpers know nothing about the DOM and take minutes of the day (0 to 1440),
// so the setup wizard's Result step reuses daySegments and dayRow. Under Node,
// tests/server/test_schedules.py and test_week_edit_js.py run them.
//
// With an editor (see weekView), each household room's warm periods get draggable
// edges and an "Adjust" form. A change becomes a room adjustment in the household
// section, previewed with POST household/preview and saved with PUT household, the
// same routes as the setup wizard. The editor does the network; this file the rest.
// No imports, so the tests can load this file on its own.

export const DAY_MIN = 1440;
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LABEL_PX = 34; // room for "19.5°" at 0.72rem, with a little space after it
export const STEP_MIN = 15; // edges snap to this, and arrow keys move them by it
const SHORT = DAY_NAMES.map((d) => d.slice(0, 3).toLowerCase());
const TICKS = ["00:00", "06:00", "12:00", "18:00", "24:00"];

export const fmtC = (c) => `${Number.isInteger(c) ? c : c.toFixed(1)}°`;
export const clock = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const pct = (m) => `${(m / DAY_MIN) * 100}%`;
const and = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`);

// The coolest and warmest setpoint shown, so a block's intensity means the same
// temperature in every room. Household levels widen it, so 19° always reads as in use.
export function weekScale(rooms, levels = null) {
  const all = [];
  for (const room of rooms) for (const day of room.days) for (const t of day.transitions) all.push(t.setpoint);
  if (levels) all.push(...Object.values(levels).filter((c) => typeof c === "number"));
  return all.length ? { low: Math.min(...all), high: Math.max(...all) } : { low: 0, high: 0 };
}

// A room's lowest setpoint in the week: anything above it is a warm period.
export function roomBase(room) {
  let base = Infinity;
  for (const day of room.days) for (const t of day.transitions) base = Math.min(base, t.setpoint);
  return Number.isFinite(base) ? base : 0;
}

// A day's transitions ([{minute, setpoint}], as the TRV stores them) as segments that
// cover the whole day: [{start, end, setpoint, warm, level}]. Neighbours with the same
// setpoint merge. If the day does not start at 00:00, its last setpoint carries over
// midnight, as in the house file. `warm` is true above `base`; `level` is the
// setpoint's place in the scale, 0 to 1, for the block's intensity.
export function daySegments(transitions, scale, base = scale.low) {
  const sorted = [...transitions]
    .filter((t) => t.minute >= 0 && t.minute < DAY_MIN)
    .sort((a, b) => a.minute - b.minute);
  if (!sorted.length) return [];
  if (sorted[0].minute > 0) sorted.unshift({ minute: 0, setpoint: sorted.at(-1).setpoint });
  const out = [];
  sorted.forEach((t, i) => {
    const end = i + 1 < sorted.length ? sorted[i + 1].minute : DAY_MIN;
    if (end <= t.minute) return;
    const prev = out.at(-1);
    if (prev && prev.setpoint === t.setpoint) prev.end = end;
    else out.push({ start: t.minute, end, setpoint: t.setpoint });
  });
  const span = scale.high - scale.low;
  return out.map((s) => ({
    ...s,
    warm: s.setpoint > base,
    level: span > 0 ? Math.min(1, Math.max(0, (s.setpoint - scale.low) / span)) : 1,
  }));
}

// Where to write each warm segment's temperature, so labels `width` minutes wide never
// overlap: at the segment's start, or just after the previous label. A label that would
// start after its segment ends is left out; the day's words still give it.
export function placeLabels(segments, width) {
  const out = [];
  let free = 0;
  for (const s of segments) {
    if (!s.warm) continue;
    const at = Math.min(Math.max(s.start, free), DAY_MIN - width);
    if (at < free || at >= s.end) continue;
    out.push({ minute: at, text: fmtC(s.setpoint) });
    free = at + width;
  }
  return out;
}

// The house's weekday for a state's minute of day, given the `now` the schedules came
// with. A smaller minute than then means midnight has passed.
export const weekdayAt = (now, minute) => (minute < now.minute ? (now.weekday + 1) % 7 : now.weekday);

// Household levels for the legend, warmest first, levels at one temperature together:
// [{label: "In use", setpoint: 19}, ..., {label: "Unused and night", setpoint: 14}].
export function legend(levels) {
  if (!levels) return [];
  const names = [["in_use", "In use"], ["occasional", "Occasional"], ["unused", "Unused"], ["night", "Night"]];
  const byTemp = new Map();
  for (const [key, name] of names) {
    const c = levels[key];
    if (typeof c !== "number") continue;
    byTemp.set(c, [...(byTemp.get(c) ?? []), name]);
  }
  return [...byTemp.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([setpoint, list]) => ({ label: and(list.map((n, i) => (i ? n.toLowerCase() : n))), setpoint }));
}

// Why a room's week is not its usual one, for the line under the away note.
export const usualText = (usual) => `Usually ${usual.map((u) => `${u.days}: ${u.text}`).join("; ")}.`;

// --- adjusting a room's week: pure ------------------------------------------------

export const snap = (m, step = STEP_MIN) => Math.round(m / step) * step;
const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// Where an edge lands for a pointer or key at `minute`: snapped, then kept inside its
// bounds, so it never crosses the other edge or a neighbouring warm period.
export const placeEdge = (minute, bounds) => Math.min(bounds.max, Math.max(bounds.min, snap(minute)));

// How far a warm period's edge may move: a start between the previous period's end and
// its own end, an end between its own start and the next period's start. A period
// stays at least STEP_MIN long; "Keep cold" in the Adjust form removes one entirely.
export function edgeBounds(periods, i, edge) {
  const p = periods[i];
  if (edge === "start") return { min: i > 0 ? periods[i - 1].end : 0, max: p.end - STEP_MIN };
  return { min: p.start + STEP_MIN, max: i + 1 < periods.length ? periods[i + 1].start : DAY_MIN };
}

// The days whose bars match day `index`: a change to one applies to all of them.
export function dayGroup(room, index) {
  const key = (d) => JSON.stringify([d.transitions, d.periods ?? []]);
  const want = key(room.days[index]);
  return room.days.flatMap((d, i) => (key(d) === want ? [i] : []));
}

// Days in words, as the week's summary writes them: "Mon to Fri", "Sat and Sun",
// "Mon, Wed and Fri", "Every day".
export function daysLabel(indexes) {
  if (indexes.length === 7) return "Every day";
  const short = (i) => DAY_NAMES[i].slice(0, 3);
  const runs = [];
  for (const i of [...indexes].sort((a, b) => a - b)) {
    const run = runs.at(-1);
    if (run && i === run[1] + 1) run[1] = i;
    else runs.push([i, i]);
  }
  const parts = [];
  for (const [a, b] of runs) {
    if (b - a >= 2) parts.push(`${short(a)} to ${short(b)}`);
    else for (let i = a; i <= b; i++) parts.push(short(i));
  }
  return and(parts);
}

// Days as an adjustment's `days`: "daily", "weekdays", "weekend", "mon", or a list
// such as ["mon", "wed"]. `weekend` holds the household's weekend day names.
export function daysToken(indexes, weekend = ["saturday", "sunday"]) {
  const set = [...new Set(indexes)].sort((a, b) => a - b);
  const ends = DAY_NAMES.flatMap((d, i) => (weekend.includes(d.toLowerCase()) ? [i] : []));
  const same = (list) => list.length === set.length && list.every((x, i) => x === set[i]);
  if (set.length === 7) return "daily";
  if (same(ends)) return "weekend";
  if (same([0, 1, 2, 3, 4, 5, 6].filter((i) => !ends.includes(i)))) return "weekdays";
  return set.length === 1 ? SHORT[set[0]] : set.map((i) => SHORT[i]);
}

// What moving an edge from `was` to `now` asks for, or null: a later end or an earlier
// start keeps the room warm for longer, the other way keeps it cold.
export function dragChange(edge, was, now) {
  if (now === was) return null;
  const later = now > was;
  if (edge === "end") return later ? { keep: "warm", from: was, to: now } : { keep: "cold", from: now, to: was };
  return later ? { keep: "cold", from: was, to: now } : { keep: "warm", from: now, to: was };
}

// A room's adjustments ({days, keep, from, to}, times as "HH:MM") with `adj` added
// last. Adjustments apply in order, so it wins wherever it overlaps another. Ones for
// the same days are tidied first, so the list stays short: the same kind touching or
// overlapping it joins it, and the other kind loses the overlap. Moving an edge back
// to where it was undoes the adjustment that moved it instead of adding another.
export function addAdjustment(list, adj) {
  const key = (a) => JSON.stringify([a.days].flat());
  let from = minutes(adj.from);
  let to = minutes(adj.to);
  const kept = [];
  let undone = false;
  for (const a of list ?? []) {
    if (key(a) !== key(adj)) { kept.push(a); continue; }
    const f = minutes(a.from);
    const t = minutes(a.to);
    if (a.keep === adj.keep) {
      if (f <= to && t >= from) { from = Math.min(from, f); to = Math.max(to, t); continue; }
      kept.push(a);
    } else if (f < to && t > from) {
      if (f === from && t === to) undone = true;
      if (f < from) kept.push({ ...a, to: clock(from) });
      if (t > to) kept.push({ ...a, from: clock(to) });
    } else {
      kept.push(a);
    }
  }
  return undone ? kept : [...kept, { ...adj, from: clock(from), to: clock(to) }];
}

// The household section with one room's adjustments changed by `change`, a function
// of the room's list such as (list) => addAdjustment(list, adj).
export function withAdjustments(section, roomId, change) {
  const out = JSON.parse(JSON.stringify(section));
  const link = out?.rooms?.[roomId];
  if (!link) throw new Error(`${roomId} is not in the household`);
  const list = change(link.adjust ?? []);
  if (list.length) link.adjust = list;
  else delete link.adjust;
  return out;
}

// A handle's accessible name: "Bedroom 1, Mon to Fri, warm until 22:30".
export const edgeName = (room, label, edge, minute) =>
  `${room}, ${label}, warm ${edge === "end" ? "until" : "from"} ${clock(minute)}`;

// The change waiting to be saved: "Mon to Fri: warm until 23:00, not 22:30."
export const changeText = (label, edge, was, now) =>
  `${label}: warm ${edge === "end" ? "until" : "from"} ${clock(now)}, not ${clock(was)}.`;

export const routineText = (routine) =>
  `Without adjustments: ${routine.map((u) => `${u.days}: ${u.text}`).join("; ")}.`;

// Where saving puts a change, in words, from GET household, or "" when there is
// nothing new to say. The first change to a household from the house file copies it.
export function sourceNote(info) {
  if (!info?.saved_at) return "In the demo, changes last until you close the page.";
  if (info.source === "house_file") {
    return `Saving copies the household, with this change, to ${info.saved_at}. Radiate uses that copy from then on. The house file isn't changed.`;
  }
  return "";
}

export const ADJUST_DAYS = [
  ["daily", "Every day"],
  ["weekdays", "Weekdays"],
  ["weekend", "Weekend"],
  ...DAY_NAMES.map((d, i) => [SHORT[i], d]),
];

// --- DOM ---------------------------------------------------------------------------

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

// One day: a 24-hour track with a block per warm period and a lane of labels above.
// Returns the row; `labelMin` is filled in by relabel() once the track has a width.
export function dayRow(day, index, segments, today) {
  const row = el("li", "week-day");
  row.append(el("span", "week-dname", DAY_NAMES[index].slice(0, 3)));
  const lane = el("div", "week-lane");
  const labels = el("div", "week-labels");
  labels.setAttribute("aria-hidden", "true");
  const track = el("div", "week-track");
  track.setAttribute("role", "img");
  row.day = { name: DAY_NAMES[index], text: day.text };
  for (const s of segments) {
    if (!s.warm) continue;
    const block = el("i", "week-block");
    block.style.left = pct(s.start);
    block.style.width = pct(s.end - s.start);
    block.style.setProperty("--level", s.level.toFixed(3));
    block.title = `${fmtC(s.setpoint)} ${clock(s.start)} to ${clock(s.end)}`;
    block.dataset.start = String(s.start);
    block.dataset.end = String(s.end);
    track.append(block);
  }
  // What room adjustments changed: a cool line along the bottom of the bar, like any
  // other setting a person made. The words are in the room's list of adjustments.
  for (const a of day.adjusted ?? []) {
    const mark = el("i", "week-adj");
    mark.dataset.keep = a.keep;
    mark.style.left = pct(a.start);
    mark.style.width = pct(a.end - a.start);
    track.append(mark);
  }
  lane.append(labels, track);
  row.append(lane);
  row.segments = segments;
  markToday(row, today);
  return row;
}

// Today's row is marked for screen readers as well as in bold.
export function markToday(row, today) {
  if (today) row.setAttribute("aria-current", "date");
  else row.removeAttribute("aria-current");
  const label = `${row.day.name}${today ? ", today" : ""}: ${row.day.text}`;
  row.querySelector(".week-track").setAttribute("aria-label", label);
}

function relabel(card) {
  const track = card.querySelector(".week-track");
  const px = track?.getBoundingClientRect().width ?? 0;
  if (!px) return;
  const width = Math.ceil((LABEL_PX / px) * DAY_MIN);
  if (card.dataset.labelMin === String(width)) return;
  card.dataset.labelMin = String(width);
  for (const row of card.querySelectorAll(".week-day")) {
    const labels = row.querySelector(".week-labels");
    labels.textContent = "";
    for (const l of placeLabels(row.segments, width)) {
      const span = el("span", null, l.text);
      span.style.left = pct(l.minute);
      labels.append(span);
    }
  }
}

function roomCard(room, scale, weekday) {
  const card = el("article", "card week");
  card.dataset.away = String(Boolean(room.away));
  const head = el("header");
  head.append(el("h3", "name", room.name));
  head.append(el("span", "badge", room.source === "household" ? "Household" : "Hand-written"));
  card.append(head);
  if (room.away) {
    card.append(el("p", "week-away", room.away.text));
    card.append(el("p", "week-usual", usualText(room.away.usual)));
  }
  const base = roomBase(room);
  const days = el("ol", "week-days");
  days.setAttribute("aria-label", `${room.name}, Monday to Sunday`);
  room.days.forEach((day, i) => days.append(dayRow(day, i, daySegments(day.transitions, scale, base), i === weekday)));
  card.append(days);
  const ticks = el("div", "week-ticks");
  ticks.setAttribute("aria-hidden", "true");
  for (const t of TICKS) ticks.append(el("span", null, t));
  card.append(ticks);
  const summary = el("dl", "week-summary");
  for (const s of room.summary) {
    const item = el("div");
    item.append(el("dt", null, s.days), el("dd", null, s.text));
    summary.append(item);
  }
  card.append(summary);
  for (const note of room.notes) card.append(el("p", "flag", note));
  if (room.people.length) card.append(el("p", "week-meta", `Depends on ${and(room.people.map((p) => p.name))}.`));
  const now = el("i", "week-now");
  now.setAttribute("aria-hidden", "true");
  card.append(now);
  return card;
}

const button = (cls, text, type = "button") => {
  const b = el("button", cls, text);
  b.type = type;
  return b;
};
const sentence = (t) => {
  const s = String(t ?? "").trim();
  return s ? `${s[0].toUpperCase()}${s.slice(1)}${/[.?!]$/.test(s) ? "" : "."}` : "";
};

// Editing one household room's week: draggable edges on its warm periods, the
// change previewed and waiting for Save, its adjustments in words, and the Adjust
// form. `ctx` holds the editor, the household's weekend days, and `saved(message,
// focusKey)`. Returns { busy(), focus(key) }: while busy, the view leaves the card
// alone. Nothing here animates: an edge follows the pointer or the key exactly.
function editRoom(card, room, ctx) {
  const { editor } = ctx;
  const rows = [...card.querySelectorAll(".week-day")];
  const handles = [];
  let pending = null; // { h, now, keyboard, info }: a moved edge waiting for Save
  let drag = null; // { id, h, rect }
  let formOpen = false;
  let seq = 0; // the latest request; answers to older ones are ignored
  let timer = null;

  const box = el("div", "week-edit");
  const bar = el("div", "week-pending");
  bar.hidden = true;
  const what = el("p", "week-pending-what");
  what.setAttribute("aria-live", "polite");
  const then = el("p", "week-pending-then");
  then.setAttribute("aria-live", "polite");
  const where = el("p", "week-source");
  const problem = el("p", "week-error");
  problem.setAttribute("role", "alert");
  problem.hidden = true;
  const save = button("btn btn-primary", "Save");
  const cancel = button("btn", "Cancel");
  const barButtons = el("div", "week-buttons");
  barButtons.append(save, cancel);
  bar.append(what, then, where, problem, barButtons);
  box.append(bar);

  // --- edges ---------------------------------------------------------------------

  function place(h, minute) {
    h.value = minute;
    h.style.left = pct(minute);
    if (h.getAttribute("role") !== "slider") return;
    const { label, edge } = h.edit;
    h.setAttribute("aria-valuenow", String(minute));
    h.setAttribute("aria-valuetext", clock(minute));
    h.setAttribute("aria-label", edgeName(room.name, label, edge, minute));
  }

  room.days.forEach((day, i) => {
    const periods = day.periods ?? [];
    if (!periods.length || room.away) return;
    const group = dayGroup(room, i);
    const label = daysLabel(group);
    const track = rows[i].querySelector(".week-track");
    periods.forEach((p, index) => {
      for (const edge of ["start", "end"]) {
        const h = el("span", "week-edge");
        h.dataset.edge = edge;
        h.dataset.key = `${group[0]}:${index}:${edge}`;
        h.edit = { row: i, group, label, periods, index, edge, was: p[edge], bounds: edgeBounds(periods, index, edge) };
        if (group[0] === i) {
          // One stop per run of identical days; the other rows follow it.
          h.tabIndex = 0;
          h.setAttribute("role", "slider");
          h.setAttribute("aria-valuemin", String(h.edit.bounds.min));
          h.setAttribute("aria-valuemax", String(h.edit.bounds.max));
        } else {
          h.setAttribute("aria-hidden", "true");
        }
        place(h, p[edge]);
        wire(h);
        track.append(h);
        handles.push(h);
      }
    });
  });

  const focusable = (key) => handles.find((x) => x.dataset.key === key && x.tabIndex === 0);

  // Move an edge, on every day in its run, with the time written above it.
  function show(h, minute) {
    const { group, periods, index, edge, row } = h.edit;
    const p = periods[index];
    const [a, b] = edge === "start" ? [minute, p.end] : [p.start, minute];
    for (const other of handles) if (other.dataset.key === h.dataset.key) place(other, minute);
    for (const d of group) {
      const block = rows[d].querySelector(`.week-block[data-start="${p.start}"][data-end="${p.end}"]`);
      if (block) {
        block.style.left = pct(a);
        block.style.width = pct(b - a);
      }
      rows[d].dataset.editing = "true";
    }
    let tag = card.querySelector(".week-drag-label");
    if (!tag) {
      tag = el("span", "week-drag-label");
      tag.setAttribute("aria-hidden", "true");
    }
    const labels = rows[row].querySelector(".week-labels");
    if (tag.parentElement !== labels) labels.append(tag);
    tag.textContent = clock(minute);
    const width = Number(card.dataset.labelMin || 120) * 1.4;
    tag.style.left = pct(Math.min(DAY_MIN - width, Math.max(0, minute - width / 2)));
  }

  function reset() {
    for (const h of handles) place(h, h.edit.was);
    for (const block of card.querySelectorAll(".week-block")) {
      block.style.left = pct(Number(block.dataset.start));
      block.style.width = pct(Number(block.dataset.end) - Number(block.dataset.start));
    }
    for (const row of rows) delete row.dataset.editing;
    card.querySelector(".week-drag-label")?.remove();
  }

  function wire(h) {
    h.addEventListener("pointerdown", (e) => {
      // One pointer at a time: a second finger doesn't take over the edge.
      if (drag || formOpen || (e.pointerType === "mouse" && e.button !== 0)) return;
      if (pending && pending.h.dataset.key !== h.dataset.key) end();
      e.preventDefault();
      h.setPointerCapture?.(e.pointerId);
      drag = { id: e.pointerId, h, rect: h.parentElement.getBoundingClientRect() };
      card.dataset.dragging = "true";
    });
    h.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id || !drag.rect.width) return;
      const minute = placeEdge(((e.clientX - drag.rect.left) / drag.rect.width) * DAY_MIN, h.edit.bounds);
      if (minute !== h.value) show(h, minute);
    });
    const release = (e, keep) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      delete card.dataset.dragging;
      if (keep) propose(h, h.value, false);
      else if (pending) show(pending.h, pending.now);
      else end();
    };
    h.addEventListener("pointerup", (e) => release(e, true));
    h.addEventListener("pointercancel", (e) => release(e, false));
    h.addEventListener("keydown", (e) => {
      const steps = { ArrowLeft: -STEP_MIN, ArrowDown: -STEP_MIN, ArrowRight: STEP_MIN, ArrowUp: STEP_MIN, PageDown: -60, PageUp: 60 };
      let minute;
      if (e.key in steps) minute = placeEdge(h.value + steps[e.key], h.edit.bounds);
      else if (e.key === "Home") minute = h.edit.bounds.min;
      else if (e.key === "End") minute = h.edit.bounds.max;
      else if (e.key === "Enter") {
        e.preventDefault();
        if (pending) commit();
        return;
      } else if (e.key === "Escape") {
        if (pending) { e.preventDefault(); end(); }
        return;
      } else {
        return;
      }
      e.preventDefault();
      if (pending && pending.h.dataset.key !== h.dataset.key) end();
      show(h, minute);
      propose(h, minute, true);
    });
  }

  // --- the change waiting for Save -------------------------------------------------

  function propose(h, now, keyboard) {
    if (now === h.edit.was) { end(); return; } // back where it was: nothing to save
    const { label, edge, was } = h.edit;
    const same = pending?.h.dataset.key === h.dataset.key;
    pending = { h, now, keyboard, info: same ? pending.info : null };
    bar.hidden = false;
    what.textContent = changeText(label, edge, was, now);
    then.textContent = "Checking…";
    problem.hidden = true;
    save.disabled = true;
    clearTimeout(timer);
    // Keys come in runs: check once they stop, not for every step.
    timer = setTimeout(check, keyboard ? 400 : 0);
  }

  async function draftFor(p) {
    p.info ??= await editor.household();
    const { edge, was, group } = p.h.edit;
    const c = dragChange(edge, was, p.now);
    const adj = { days: daysToken(group, ctx.weekend), keep: c.keep, from: clock(c.from), to: clock(c.to) };
    return withAdjustments(p.info.household, room.id, (list) => addAdjustment(list, adj));
  }

  function fail(text) {
    then.textContent = "";
    problem.textContent = text;
    problem.hidden = false;
    save.disabled = true;
  }

  async function check() {
    const my = ++seq;
    const p = pending;
    if (!p) return;
    let body;
    try {
      body = await editor.preview(await draftFor(p));
    } catch {
      if (my === seq) fail("Couldn't check the change. Check the connection and try again.");
      return;
    }
    if (my !== seq || p !== pending) return;
    where.textContent = sourceNote(p.info);
    where.hidden = !where.textContent;
    if (body.errors?.length) { fail(sentence(body.errors[0].message)); return; }
    const after = body.rooms.find((r) => r.id === room.id);
    const words = after ? after.summary.map((s) => `${s.days}: ${s.text}`).join("; ") : "";
    // A warm period that no longer fits the valve's own schedule is worth knowing first.
    const added = (after?.notes ?? []).filter((n) => !room.notes.includes(n));
    then.textContent = [words && `${words}.`, ...added].filter(Boolean).join(" ");
    save.disabled = false;
  }

  async function commit() {
    const p = pending;
    if (!p) return;
    clearTimeout(timer);
    const my = ++seq;
    save.disabled = true;
    then.textContent = "Saving…";
    problem.hidden = true;
    let res = null;
    try {
      res = await editor.save(await draftFor(p));
    } catch { /* below */ }
    if (my !== seq || p !== pending) return;
    if (res?.status === 200) {
      pending = null;
      ctx.saved(`Saved. ${room.name} follows its new week.${copied(p.info)}`, p.keyboard ? p.h.dataset.key : null);
      return;
    }
    const first = res?.status === 400 ? res.body?.errors?.[0]?.message : null;
    fail(first ? `Not saved. ${sentence(first)}` : "Not saved. Check the connection and try again.");
    save.disabled = false;
  }

  // Cancel the change: every edge goes back, and focus to the edge that moved.
  function end() {
    clearTimeout(timer);
    seq++;
    const key = pending?.h.dataset.key;
    pending = null;
    reset();
    bar.hidden = true;
    return key;
  }

  save.addEventListener("click", commit);
  cancel.addEventListener("click", () => focusable(end())?.focus());
  bar.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); focusable(end())?.focus(); }
  });

  // --- adjustments in words, Remove, Reset to routine, and the Adjust form ---------

  const copied = (info) =>
    info?.source === "house_file" && info.saved_at
      ? ` The household is now kept in ${info.saved_at}; the house file isn't changed.`
      : "";

  const listError = el("p", "week-error");
  listError.setAttribute("role", "alert");
  listError.hidden = true;

  async function change(fn, message) {
    listError.hidden = true;
    let info = null;
    let res = null;
    try {
      info = await editor.household();
      res = await editor.save(withAdjustments(info.household, room.id, fn));
    } catch { /* below */ }
    if (res?.status === 200) { ctx.saved(`${message}${copied(info)}`, null); return; }
    listError.textContent = "Not saved. Check the connection and try again.";
    listError.hidden = false;
  }

  const adjust = el("div", "week-adjust");
  if (room.adjust?.length) {
    adjust.append(el("h4", null, "Adjustments"));
    const ul = el("ul");
    room.adjust.forEach((a, i) => {
      const li = el("li");
      const remove = button("link", "Remove");
      remove.setAttribute("aria-label", `Remove: ${a.text}`);
      remove.addEventListener("click", () => change((list) => list.filter((_, j) => j !== i), `Removed. ${room.name} follows its new week.`));
      li.append(el("span", null, a.text), remove);
      ul.append(li);
    });
    adjust.append(ul);
    if (room.routine) adjust.append(el("p", "week-usual", routineText(room.routine)));
  }
  const actions = el("div", "week-actions");
  const open = button("link", "Adjust");
  open.setAttribute("aria-expanded", "false");
  open.setAttribute("aria-label", `Adjust ${room.name}`);
  actions.append(open);
  if (room.adjust?.length) {
    const back = button("link", "Reset to routine");
    back.setAttribute("aria-label", `Reset ${room.name} to its routine`);
    back.addEventListener("click", () => change(() => [], `${room.name} is back to its routine.`));
    actions.append(back);
  }
  adjust.append(actions, listError);

  const form = el("form", "week-form");
  form.hidden = true;
  form.noValidate = true;
  form.id = `week-form-${room.id}`;
  open.setAttribute("aria-controls", form.id);
  const field = (name, label, control) => {
    control.name = name;
    control.id = `${form.id}-${name}`;
    const wrap = el("div", "week-field");
    const lab = el("label", null, label);
    lab.htmlFor = control.id;
    wrap.append(lab, control);
    return wrap;
  };
  const select = (options) => {
    const s = el("select");
    for (const [value, text] of options) {
      const o = el("option", null, text);
      o.value = value;
      s.append(o);
    }
    return s;
  };
  const time = (placeholder) => {
    const input = el("input", "time");
    Object.assign(input, { type: "text", inputMode: "numeric", autocomplete: "off", spellcheck: false, maxLength: 5, placeholder });
    input.addEventListener("blur", () => {
      const t = editor.time?.(input.value, { end: input.name === "to" });
      if (t) input.value = t;
    });
    return input;
  };
  const days = select(ADJUST_DAYS);
  const keep = select([["warm", "Warm"], ["cold", "Cold"]]);
  const from = time("22:30");
  const to = time("23:00");
  const fields = el("div", "week-fields");
  fields.append(field("days", "Days", days), field("keep", "Keep it", keep), field("from", "From", from), field("to", "To", to));
  const formNote = el("p", "week-source");
  formNote.hidden = true;
  const formError = el("p", "week-error");
  formError.setAttribute("role", "alert");
  formError.hidden = true;
  const formButtons = el("div", "week-buttons");
  const formSave = button("btn btn-primary", "Save", "submit");
  const formCancel = button("btn", "Cancel");
  formButtons.append(formSave, formCancel);
  form.append(fields, formNote, formError, formButtons);

  const controls = { days, keep, from, to };
  function mark(name, text) {
    for (const c of Object.values(controls)) c.removeAttribute("aria-invalid");
    formError.hidden = !text;
    formError.textContent = text ?? "";
    if (name && controls[name]) {
      controls[name].setAttribute("aria-invalid", "true");
      controls[name].setAttribute("aria-describedby", formError.id ||= `${form.id}-error`);
    }
  }

  function closeForm() {
    form.hidden = true;
    formOpen = false;
    open.setAttribute("aria-expanded", "false");
    mark(null, null);
    open.focus();
  }

  open.addEventListener("click", async () => {
    if (formOpen) { closeForm(); return; }
    if (pending) end();
    formOpen = true;
    form.hidden = false;
    open.setAttribute("aria-expanded", "true");
    days.focus();
    try {
      formNote.textContent = sourceNote(await editor.household());
    } catch {
      formNote.textContent = "";
    }
    formNote.hidden = !formNote.textContent;
  });
  formCancel.addEventListener("click", closeForm);
  form.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeForm(); }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tidy = (text, opts) => (editor.time ? editor.time(text, opts) : text.trim() || null);
    const a = tidy(from.value);
    const b = tidy(to.value, { end: true });
    if (!a) { mark("from", "Enter a time such as 22:30."); from.focus(); return; }
    if (!b) { mark("to", "Enter a time such as 23:00."); to.focus(); return; }
    mark(null, null);
    formSave.disabled = true;
    const adj = { days: days.value, keep: keep.value, from: a, to: b };
    let info = null;
    let res = null;
    let index = 0;
    try {
      info = await editor.household();
      const section = withAdjustments(info.household, room.id, (list) => {
        const next = addAdjustment(list, adj);
        index = next.length - 1;
        return next;
      });
      res = await editor.save(section);
    } catch { /* below */ }
    formSave.disabled = false;
    if (res?.status === 200) {
      formOpen = false;
      ctx.saved(`Saved. ${room.name} follows its new week.${copied(info)}`, null);
      return;
    }
    const err = res?.status === 400 ? res.body?.errors?.[0] : null;
    if (!err) { mark(null, "Not saved. Check the connection and try again."); return; }
    const at = err.path.match(new RegExp(`\\.adjust\\[${index}\\]\\.(\\w+)$`));
    mark(at?.[1] ?? null, `Not saved. ${sentence(err.message)}`);
    controls[at?.[1]]?.focus();
  });
  adjust.append(form);
  box.append(adjust);

  card.insertBefore(box, card.querySelector(".week-meta") ?? card.querySelector(".week-now"));
  return {
    busy: () => Boolean(pending || drag || formOpen),
    focus(key) {
      const target = (key && focusable(key)) || open;
      target.focus();
    },
  };
}

// The section's view: update(view) with a /schedules response, tick(minute) with each
// state's minute of day to move the now marker. Cards rebuild only when their room's
// data changes, which is rare (a schedule edit, someone away), so nothing animates.
//
// setEditor(editor) makes household rooms adjustable. The editor talks to the server:
//   household() -> GET household's body; preview(section) -> POST household/preview's
//   body; save(section) -> PUT household as { status, body }; saved(message) after a
//   save, to say so and fetch the weeks again; time(text, { end }) tidies a typed time
//   to "HH:MM" or null (household.js normaliseTime).
// A card being edited is left alone by update() until the change is saved or cancelled.
export function weekView({ list, legendEl, frostEl, hintEl = null }) {
  const cards = new Map(); // room id -> { card, key, edit }
  let now = null;
  let scale = { low: 0, high: 0 };
  let editor = null;
  let weekend = ["saturday", "sunday"];
  let restore = null; // { room, key }: where focus goes once a saved room is redrawn
  const observer = typeof ResizeObserver === "function"
    ? new ResizeObserver((entries) => { for (const e of entries) relabel(e.target); })
    : null;

  function place(minute) {
    if (!now) return;
    const weekday = weekdayAt(now, minute);
    for (const { card } of cards.values()) {
      const marker = card.querySelector(".week-now");
      const rows = card.querySelectorAll(".week-day");
      rows.forEach((row, i) => {
        if (row.hasAttribute("aria-current") !== (i === weekday)) markToday(row, i === weekday);
      });
      const track = rows[weekday]?.querySelector(".week-track");
      if (!track) continue;
      if (marker.parentElement !== track) track.append(marker);
      marker.style.left = pct(minute);
    }
  }

  function legendItems(view) {
    legendEl.textContent = "";
    const items = legend(view.levels);
    for (const item of items) {
      const entry = el("span", "week-key");
      const swatch = el("i", "week-swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.dataset.base = String(item.setpoint <= scale.low);
      swatch.style.setProperty("--level", (scale.high > scale.low ? (item.setpoint - scale.low) / (scale.high - scale.low) : 1).toFixed(3));
      entry.append(swatch, `${item.label} ${fmtC(item.setpoint)}`);
      legendEl.append(entry);
    }
    const adjusted = view.rooms.some((r) => r.days.some((d) => d.adjusted?.length));
    if (adjusted) {
      const entry = el("span", "week-key");
      const swatch = el("i", "week-adj-swatch");
      swatch.setAttribute("aria-hidden", "true");
      entry.append(swatch, "Adjusted");
      legendEl.append(entry);
    }
    legendEl.hidden = !items.length && !adjusted;
  }

  return {
    update(view) {
      now = view.now;
      weekend = view.weekend_days ?? weekend;
      scale = weekScale(view.rooms, view.levels);
      frostEl.hidden = !view.frost;
      legendItems(view);
      const seen = new Set();
      let editable = false;
      view.rooms.forEach((room, i) => {
        seen.add(room.id);
        const canEdit = Boolean(editor) && room.source === "household";
        editable ||= canEdit && !room.away && room.days.some((d) => d.periods?.length);
        const key = JSON.stringify([room, scale, canEdit]);
        const had = cards.get(room.id);
        // A room just saved is redrawn even if nothing changed, to close its form.
        if ((had?.key === key && restore?.room !== room.id) || had?.edit?.busy()) return;
        const card = roomCard(room, scale, now.weekday);
        if (had) {
          observer?.unobserve(had.card);
          had.card.replaceWith(card);
        } else {
          list.insertBefore(card, list.children[i] ?? null);
        }
        const entry = { card, key, edit: null };
        if (canEdit) {
          entry.edit = editRoom(card, room, {
            editor,
            weekend,
            saved(message, focusKey) {
              restore = { room: room.id, key: focusKey };
              editor.saved(message);
            },
          });
        }
        cards.set(room.id, entry);
        observer?.observe(card);
        relabel(card);
        if (restore?.room === room.id) {
          entry.edit?.focus(restore.key);
          restore = null;
        }
      });
      for (const [id, { card }] of cards) {
        if (seen.has(id)) continue;
        observer?.unobserve(card);
        card.remove();
        cards.delete(id);
      }
      if (hintEl) hintEl.hidden = !editable;
      place(now.minute);
    },
    tick(minute) {
      place(minute);
    },
    // Household rooms become adjustable; null makes them read-only again.
    setEditor(next) {
      editor = next;
    },
  };
}
