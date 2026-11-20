// Household setup: the wizard's answers (a draft) and the household section they make.
// Pure: no DOM, no network. setup.js draws the wizard from these; tests run them under
// Node (tests/server/test_household_js.py).
//
// The draft is shaped for the questions, not for the house file:
//   people: [{ id, name, weekdays, weekend, weekendSame, getting_up_min, bedtime_min,
//              weekend_days }], each routine { up, bed, periods: [{ type, from, to }] }
//              with type "out" or "work";
//   rooms: [{ id, name, schedule, own, use, weekendUse, weekendDifferent, kind, people,
//             temperature, night_temperature, unused_temperature, preheat_min, adjust }];
//             `adjust` is the room's adjustments, kept as they are: the wizard doesn't
//             ask about them, the week view changes them, and saving here keeps them.
//   temperatures, timing, away, weekend_days: as in the house file, every value set.
// `toSection(draft)` turns it into the house file's `household` section, which the
// server checks with the same parser as the house file. Errors come back with paths
// such as `household.people.sam.weekdays.out[0]`; `fieldPaths` names each answer's
// path so the error lands next to it.

export const STEPS = ["people", "routines", "rooms", "temperatures", "result"];
export const STEP_TITLES = ["People", "Routines", "Rooms", "Temperatures", "Result"];
export const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SHORT = Object.fromEntries(DAY_NAMES.map((d) => [d.slice(0, 3), d]));

export const USE_LEVELS = [
  ["in_use", "In use"],
  ["occasional", "Occasional"],
  ["unused", "Unused"],
];

// Each room kind, in a sentence. The order is the order of the choice.
export const KINDS = [
  ["shared", "Shared", "Warm while its people are up and at home, and first thing in the morning even if they then go out."],
  ["bedroom", "Bedroom", "Warm when its people get up and in the run-up to bed."],
  ["office", "Office", "Warm while its people work from home."],
  ["while_home", "While anyone is home", "Warm whenever its people are up and at home, working or not."],
  ["all_day", "All day", "Warm from the first of its people getting up to the last going to bed, home or not."],
];

export const NEW_ROUTINE = {
  weekdays: { up: "07:00", bed: "22:30", periods: [{ type: "out", from: "08:30", to: "17:30" }] },
  weekend: { up: "08:30", bed: "23:00", periods: [] },
};

const clone = (x) => JSON.parse(JSON.stringify(x));

// --- times -----------------------------------------------------------------------------

// What someone typed as a 24-hour time, as "HH:MM", or null if it is not one.
// Accepts "7:30", "0730", "730", "7", "07.30" and "24:00" when `end` is true.
export function normaliseTime(text, { end = false } = {}) {
  const raw = String(text ?? "").trim().replace(".", ":");
  let h;
  let m;
  let match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match) [h, m] = [Number(match[1]), Number(match[2])];
  else if ((match = raw.match(/^(\d{1,2})(\d{2})$/))) [h, m] = [Number(match[1]), Number(match[2])];
  else if ((match = raw.match(/^(\d{1,2})$/))) [h, m] = [Number(match[1]), 0];
  else return null;
  if (m > 59 || h > 24 || (h === 24 && (m > 0 || !end))) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// --- people --------------------------------------------------------------------------

// A person id from a name: lower case letters, digits and _, unique in `taken`.
// Names in other scripts fall back to person_1, person_2 and so on.
export function personId(name, taken) {
  const base = String(name ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32) || "person";
  const used = new Set(taken);
  if (base !== "person" && !used.has(base)) return base;
  for (let i = 1; ; i++) {
    const id = `${base}_${i}`;
    if (!used.has(id)) return id;
  }
}

export function addPerson(draft, name = "") {
  const label = name || `Person ${draft.people.length + 1}`;
  const id = personId(label, draft.people.map((p) => p.id));
  draft.people.push({
    id,
    name: label,
    ...clone(NEW_ROUTINE),
    weekendSame: false,
    getting_up_min: null,
    bedtime_min: null,
    weekend_days: null,
  });
  return id;
}

// Remove a person and every link to them. A room left with nobody is for everyone
// again, and an office left with nobody becomes a shared room.
export function removePerson(draft, id) {
  draft.people = draft.people.filter((p) => p.id !== id);
  for (const room of draft.rooms) {
    if (!room.people) continue;
    room.people = room.people.filter((pid) => pid !== id);
    if (!room.people.length) {
      room.people = null;
      if (room.kind === "office") room.kind = "shared";
    }
  }
}

// The office a person works in, or null.
export const officeOf = (draft, pid) =>
  draft.rooms.find((r) => !r.own && r.kind === "office" && r.people?.includes(pid))?.id ?? null;

// Make `roomId` the person's office (null: none). Other people keep their offices.
export function setOffice(draft, pid, roomId) {
  for (const room of draft.rooms) {
    if (room.kind !== "office" || !room.people?.includes(pid) || room.id === roomId) continue;
    room.people = room.people.filter((x) => x !== pid);
    if (!room.people.length) {
      room.people = null;
      room.kind = "shared";
    }
  }
  if (roomId == null) return;
  const room = draft.rooms.find((r) => r.id === roomId);
  if (!room) return;
  room.own = false;
  const others = room.kind === "office" ? (room.people ?? []) : [];
  room.kind = "office";
  if (room.use === "unused") room.use = "in_use";
  room.people = [...new Set([...others, pid])];
}

export const worksFromHome = (person) =>
  [person.weekdays, ...(person.weekendSame ? [] : [person.weekend])].some((r) => r.periods.some((p) => p.type === "work"));

// --- from the API and back -------------------------------------------------------------

function routineFrom(raw) {
  const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const periods = [];
  for (const type of ["out", "work"]) {
    for (const w of list(raw?.[type])) {
      const [from, to] = String(w).split("-");
      periods.push({ type, from: from ?? "", to: to ?? "" });
    }
  }
  periods.sort((a, b) => a.from.localeCompare(b.from));
  return { up: raw?.up ?? "07:00", bed: raw?.bed ?? "22:30", periods };
}

const fullDays = (list) => (list ?? []).map((d) => SHORT[String(d).toLowerCase().slice(0, 3)] ?? d);

// The draft for a `GET household` response: its household, or a starting point with one
// person and every room in use, pre-filled so a household can click straight through.
export function draftFrom(view) {
  const section = view.household;
  const d = view.defaults;
  const draft = {
    people: [],
    rooms: [],
    temperatures: { ...d.temperatures, ...(section?.temperatures ?? {}) },
    timing: { ...d.timing, ...(section?.timing ?? {}) },
    away: { ...d.away, ...(section?.away ?? {}) },
    weekend_days: fullDays(section?.weekend_days ?? d.weekend_days),
  };
  if (section) {
    for (const [id, p] of Object.entries(section.people ?? {})) {
      draft.people.push({
        id,
        name: p.name ?? id.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
        weekdays: routineFrom(p.weekdays),
        weekend: routineFrom(p.weekend ?? p.weekdays),
        weekendSame: p.weekend == null,
        getting_up_min: p.getting_up_min ?? null,
        bedtime_min: p.bedtime_min ?? null,
        weekend_days: p.weekend_days ? fullDays(p.weekend_days) : null,
      });
    }
  } else {
    addPerson(draft);
  }
  for (const r of view.rooms) {
    const link = section?.rooms?.[r.id];
    const room = {
      id: r.id,
      name: r.name,
      schedule: r.schedule,
      own: false,
      use: "in_use",
      weekendUse: "in_use",
      weekendDifferent: false,
      kind: "shared",
      people: null,
      temperature: null,
      night_temperature: null,
      unused_temperature: null,
      preheat_min: null,
      adjust: [],
    };
    if (link) {
      const use = link.use;
      room.use = typeof use === "object" ? use.weekdays : use;
      room.weekendUse = typeof use === "object" ? use.weekend : use;
      room.weekendDifferent = typeof use === "object" && use.weekdays !== use.weekend;
      room.kind = link.kind ?? "shared";
      room.people = link.people ?? null;
      for (const key of ["temperature", "night_temperature", "unused_temperature", "preheat_min"]) {
        room[key] = link[key] ?? null;
      }
      room.adjust = clone(link.adjust ?? []);
    } else if (section && r.schedule) {
      room.own = true; // the house file's household leaves it on its own schedule
    } else if (!section && /bed/i.test(r.name)) {
      room.kind = "bedroom"; // a guess from the name, shown and easy to change
    }
    draft.rooms.push(room);
  }
  return draft;
}

// Times as typed, tidied where they are times ("730" to "07:30"); anything else is sent
// as it is, so the server's error names it.
const tidy = (t, end = false) => normaliseTime(t, { end }) ?? String(t ?? "");
const span = (p) => `${tidy(p.from)}-${tidy(p.to, true)}`;

function routineSection(r) {
  const out = { up: tidy(r.up) };
  for (const type of ["out", "work"]) {
    const spans = r.periods.filter((p) => p.type === type).map(span);
    if (spans.length) out[type] = spans;
  }
  out.bed = tidy(r.bed, true);
  return out;
}

// The house file's `household` section for the draft. A room's `people` of null means
// everyone; a bedroom or office must name them, so there it lists everyone.
export function toSection(draft) {
  const everyone = draft.people.map((p) => p.id);
  const people = {};
  for (const p of draft.people) {
    const item = { name: p.name, weekdays: routineSection(p.weekdays) };
    if (!p.weekendSame) item.weekend = routineSection(p.weekend);
    if (p.getting_up_min != null) item.getting_up_min = p.getting_up_min;
    if (p.bedtime_min != null) item.bedtime_min = p.bedtime_min;
    if (p.weekend_days != null) item.weekend_days = [...p.weekend_days];
    people[p.id] = item;
  }
  const rooms = {};
  for (const r of draft.rooms) {
    if (r.own) continue;
    const item = {
      use: r.weekendDifferent && r.weekendUse !== r.use ? { weekdays: r.use, weekend: r.weekendUse } : r.use,
    };
    if (r.kind !== "shared") item.kind = r.kind;
    if (r.people != null) item.people = [...r.people];
    else if (r.kind === "bedroom" || r.kind === "office") item.people = [...everyone];
    for (const key of ["temperature", "night_temperature", "unused_temperature", "preheat_min"]) {
      if (r[key] != null) item[key] = r[key];
    }
    if (r.adjust?.length) item.adjust = clone(r.adjust);
    rooms[r.id] = item;
  }
  return {
    weekend_days: [...draft.weekend_days],
    timing: { ...draft.timing },
    away: { ...draft.away },
    temperatures: { ...draft.temperatures },
    people,
    rooms,
  };
}

// --- errors ---------------------------------------------------------------------------

// Paths of a routine's period rows, in the order shown: out and work windows are
// numbered separately, as in the section.
export function periodPaths(base, periods) {
  const seen = { out: 0, work: 0 };
  return periods.map((p) => `${base}.${p.type}[${seen[p.type]++}]`);
}

// The answer an error belongs to: the longest of `paths` that the error's path starts
// with, at a boundary. `household.people.sam.weekdays.out` lands on
// `household.people.sam.weekdays`, not on `...out[0]`.
export function errorTarget(paths, errorPath) {
  let best = null;
  for (const p of paths) {
    if (errorPath !== p && !errorPath.startsWith(`${p}.`) && !errorPath.startsWith(`${p}[`)) continue;
    if (!best || p.length > best.length) best = p;
  }
  return best;
}

// The step (and, for routines, the person) where an error's answer is asked.
export function stepFor(draft, path) {
  const parts = path.split(".");
  if (parts[0] !== "household") return { step: 4, person: 0 };
  const section = (parts[1] ?? "").replace(/\[.*$/, ""); // weekend_days[0]
  if (section === "people") {
    const person = Math.max(0, draft.people.findIndex((p) => p.id === parts[2]));
    if (parts.length <= 3 || parts[3] === "name") return { step: 0, person };
    return { step: 1, person };
  }
  if (section === "away") return { step: 0, person: 0 };
  if (section === "rooms") return { step: 2, person: 0 };
  if (section === "temperatures" || section === "timing" || section === "weekend_days") return { step: 3, person: 0 };
  return { step: 4, person: 0 };
}

// Times typed in a routine that are not times, before asking the server, as errors in
// the server's form so they show the same way.
export function timeErrors(draft) {
  const out = [];
  for (const p of draft.people) {
    for (const dayType of p.weekendSame ? ["weekdays"] : ["weekdays", "weekend"]) {
      const r = p[dayType];
      const base = `household.people.${p.id}.${dayType}`;
      if (!normaliseTime(r.up)) out.push({ path: `${base}.up`, message: "Enter a time such as 07:30" });
      if (!normaliseTime(r.bed, { end: true })) out.push({ path: `${base}.bed`, message: "Enter a time such as 22:30" });
      periodPaths(base, r.periods).forEach((path, i) => {
        const { from, to } = r.periods[i];
        if (!normaliseTime(from) || !normaliseTime(to, { end: true })) {
          out.push({ path, message: "Enter both times, such as 08:30 and 17:30" });
        }
      });
    }
  }
  return out;
}

// --- words ----------------------------------------------------------------------------

export const kindText = (kind) => KINDS.find((k) => k[0] === kind)?.[2] ?? "";

// "Sam", "Sam and Alex", "Sam, Alex and Jo".
export const and = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`);

// The damp note under an unused or night temperature, or "".
export const dampNote = (c, below) =>
  typeof c === "number" && c < below ? `Below ${below}° walls and window frames can get damp, especially in older houses.` : "";

// "30 min", "1 h", "1 h 30 min", "off" for a value that turns a setting off.
export function minutesText(m, off = null) {
  if (off != null && m === off) return "off";
  if (m < 60) return `${m} min`;
  const rest = m % 60;
  return rest ? `${Math.floor(m / 60)} h ${rest} min` : `${m / 60} h`;
}

// Days as words: "Saturday and Sunday", "no days".
export const daysText = (days) =>
  days.length ? and(DAY_NAMES.filter((d) => days.includes(d)).map((d) => d[0].toUpperCase() + d.slice(1))) : "no days";

// How many warm periods the valves' own schedules leave out, in a sentence, or "".
export function droppedText(rooms) {
  const n = rooms.reduce((sum, r) => sum + (r.notes?.length ?? 0), 0);
  if (!n) return "";
  const what = n === 1 ? "1 warm period is" : `${n} warm periods are`;
  return `${what} left out of the valves' own schedules to fit their limit of 6 changes a day. Radiate still heats them while it runs; only the valve's fallback copy lacks them.`;
}
