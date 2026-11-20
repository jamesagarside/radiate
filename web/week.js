// Week view: each room's week as seven 24-hour bars, from GET /api/v1/schedules.
// Read-only for now. The household wizard will reuse daySegments and dayRow and add
// draggable edges, so the pure helpers know nothing about the DOM and take minutes of
// the day (0 to 1440). tests/server/test_week_js.py runs the pure helpers under Node.

export const DAY_MIN = 1440;
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LABEL_PX = 34; // room for "19.5°" at 0.72rem, with a little space after it
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
    track.append(block);
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

// The section's view: update(view) with a /schedules response, tick(minute) with each
// state's minute of day to move the now marker. Cards rebuild only when their room's
// data changes, which is rare (a schedule edit, someone away), so nothing animates.
export function weekView({ list, legendEl, frostEl }) {
  const cards = new Map(); // room id -> { card, key }
  let now = null;
  let scale = { low: 0, high: 0 };
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

  return {
    update(view) {
      now = view.now;
      scale = weekScale(view.rooms, view.levels);
      frostEl.hidden = !view.frost;
      legendEl.textContent = "";
      const items = legend(view.levels);
      legendEl.hidden = !items.length;
      for (const item of items) {
        const entry = el("span", "week-key");
        const swatch = el("i", "week-swatch");
        swatch.setAttribute("aria-hidden", "true");
        swatch.dataset.base = String(item.setpoint <= scale.low);
        swatch.style.setProperty("--level", (scale.high > scale.low ? (item.setpoint - scale.low) / (scale.high - scale.low) : 1).toFixed(3));
        entry.append(swatch, `${item.label} ${fmtC(item.setpoint)}`);
        legendEl.append(entry);
      }
      const seen = new Set();
      view.rooms.forEach((room, i) => {
        seen.add(room.id);
        const key = JSON.stringify([room, scale]);
        const had = cards.get(room.id);
        if (had?.key === key) return;
        const card = roomCard(room, scale, now.weekday);
        if (had) {
          observer?.unobserve(had.card);
          had.card.replaceWith(card);
        } else {
          list.insertBefore(card, list.children[i] ?? null);
        }
        cards.set(room.id, { card, key });
        observer?.observe(card);
        relabel(card);
      });
      for (const [id, { card }] of cards) {
        if (seen.has(id)) continue;
        observer?.unobserve(card);
        card.remove();
        cards.delete(id);
      }
      place(now.minute);
    },
    tick(minute) {
      place(minute);
    },
  };
}
