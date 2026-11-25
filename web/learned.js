// "What Radiate has learned" on a room card: the room model (state `rooms[].model`) in
// plain words with this room's numbers. Pure: the card asks for the words and puts them
// in place, so the words can be tested under Node.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COOL_EXAMPLE_K = 10; // "when it's 10° colder outside"
const STILL_LEARNING = 0.4; // below this, a confidence reads "still learning"
const SURE = 0.75; // from this, "sure of"
const PREHEAT_LOOKS_AHEAD_MIN = 180; // optimum start's usual horizon (core PREHEAT_MAX_S)
const DRY = ["dry_burner", "dry_relay"];

const clock = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const deg = (v) => `${v.toFixed(1)}°`;
const count = (n) => n.toLocaleString("en-GB");

// 80 -> "1 h 20 min", 45 -> "45 min", 3000 -> "2 days".
export function span(m) {
  if (m >= 2880) return `${Math.round(m / 1440)} days`;
  if (m < 60) return `${m} min`;
  const rest = m % 60;
  return rest ? `${Math.floor(m / 60)} h ${rest} min` : `${m / 60} h`;
}

// 0.04 -> "0.04", 0.3 -> "0.3", 1.87 -> "1.9": enough figures to be useful.
function rate(v) {
  return v >= 0.095 ? v.toFixed(1) : v.toFixed(2);
}

// "2026-11-24" -> "24 Nov", with the year when it isn't this one.
export function day(iso, year = new Date().getFullYear()) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${y === year ? "" : ` ${y}`}`;
}

const times = (n) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);

function sureWord(c) {
  if (c < STILL_LEARNING) return "still learning";
  return c < SURE ? "fairly sure of" : "sure of";
}

// "Radiate is sure of how fast this room warms, and still learning how fast it cools."
export function sureText(m) {
  const warm = sureWord(m.confidence);
  const cool = sureWord(m.loss_confidence ?? m.confidence);
  if (warm === cool) return `Radiate is ${warm} how fast this room warms and cools.`;
  return `Radiate is ${warm} how fast this room warms, and ${cool} how fast it cools.`;
}

// Whether to say "Still learning" above the numbers.
export const stillLearning = (m) => m.samples === 0 || m.confidence < STILL_LEARNING;

// The rows of the section, in order: { key, label, text }. `ctx`: { outdoor,
// minute_of_day, notes (this room's learning notes), year }.
export function learnedRows(r, ctx = {}) {
  const m = r.model;
  const rows = [];
  const add = (key, label, text) => rows.push({ key, label, text });
  const t = r.temperature;
  const out = ctx.outdoor;
  const warm = m.heating_kph;

  // How fast the radiator warms the room, then what that leaves after its losses now.
  if (warm) {
    let text = `With the boiler on and the valve open, about ${rate(warm.with_house)}° an hour while most of the house is heating, or ${rate(warm.alone)}° an hour when it's the only room taking heat.`;
    if (t != null && out != null) {
      const net = warm.with_house - m.b * (t - out) + m.d;
      text += net > 0.05
        ? ` Now, with ${deg(out)} outside, it would gain about ${rate(net)}° an hour after the heat it loses.`
        : ` Now, with ${deg(out)} outside, it loses heat about as fast as the radiator adds it while the house heats.`;
    }
    add("warms", "Warms up", text);
  } else {
    add("warms", "Warms up", `The radiator can warm it by up to about ${rate(m.a)}° an hour with the boiler on and the valve fully open.`);
  }

  // How fast it cools with the heating off.
  let cools = `With the heating off, it cools by about ${rate(m.b * COOL_EXAMPLE_K)}° an hour when it's 10° colder outside than in.`;
  if (t != null && out != null && t - out >= 1) {
    cools += ` Now, at ${deg(t)} inside and ${deg(out)} outside, that's about ${rate(m.b * (t - out))}° an hour.`;
  }
  add("cools", "Cools down", cools);

  // Steady heat from something other than the radiator.
  if (r.heat_source === "continuous") {
    add("steady", "Other heat", `The range cooker adds about ${rate(Math.max(0, m.d))}° an hour on its own, all day, so the radiator is needed less.`);
  } else if (m.d >= 0.15) {
    add("steady", "Other heat", `Something other than the radiator adds about ${rate(m.d)}° an hour, such as a warm room next door.`);
  }

  // How long heat takes to arrive.
  const lag = Math.round(m.arrival_lag_min);
  add("lag", "Heat arrives", m.lag_measured
    ? `About ${lag} min after the boiler fires, timed over ${m.lag_measured === 1 ? "its last warm-up" : `its last ${m.lag_measured} warm-ups`}.`
    : `Not timed yet, so Radiate allows ${lag} min for the hot water to reach the radiator.`);

  // How sure, and what it rests on.
  let sure;
  if (m.samples === 0) {
    sure = "Nothing learned yet. Radiate starts every room from typical values and learns from its first burns.";
  } else {
    sure = sureText(m);
    const since = m.learned?.since ? ` since ${day(m.learned.since, ctx.year)}` : "";
    const hours = m.samples >= 120 ? `, about ${count(Math.round(m.samples / 60))} hours of learning` : "";
    sure += ` From ${count(m.samples)} ${m.samples === 1 ? "reading" : "readings"}${since}${hours}.`;
  }
  if (r.role === "internal_sensor_only") {
    sure += " This room is measured only by its valve, beside the radiator, so Radiate never becomes fully sure of it.";
  }
  const updates = m.learned?.updates ?? {};
  const total = Object.values(updates).reduce((a, b) => a + b, 0);
  const dry = DRY.reduce((a, k) => a + (updates[k] ?? 0), 0);
  if (total && dry === total) sure += " All of it was learned in dry run, while Radiate watched the heating without running it.";
  add("sure", "How sure", sure);

  // What it uses this for.
  let uses = "Radiate uses this to start warming early enough to reach each new temperature on time, and to set how far each valve opens so rooms warming together get there at about the same time.";
  const w = m.warm_up;
  if (w && ctx.minute_of_day != null) {
    const about = w.min == null || w.min < 60 ? w.min : Math.round(w.min / 5) * 5;
    const at = clock((ctx.minute_of_day + w.in_min) % 1440);
    // Quiet hours hold this room's warm-up until they end (spec 5.10).
    const quiet = w.quiet_until_min ?? null;
    const quietIn = quiet == null ? null : (quiet - ctx.minute_of_day + 1440) % 1440;
    const asEarly = quiet == null ? "as early as it can" : `as soon as quiet hours end at ${clock(quiet)}`;
    if (w.min == null) {
      uses += ` It can't tell yet how long this room takes to reach ${deg(w.to_c)} by ${at}, so it starts ${asEarly}.`;
    } else if (w.min > PREHEAT_LOOKS_AHEAD_MIN) {
      uses += ` To get from ${deg(w.from_c)} to ${deg(w.to_c)} by ${at}, it reckons this room needs about ${span(about)}, longer than it looks ahead, so it starts ${asEarly}.`;
    } else {
      const lead = w.in_min - about; // minutes from now until it would start
      const startAt = lead <= 0 ? "now" : `at about ${clock((ctx.minute_of_day + lead) % 1440)}`;
      uses += ` To get from ${deg(w.from_c)} to ${deg(w.to_c)} by ${at}, it allows about ${span(about)}, so it `;
      if (quiet != null && lead < quietIn) {
        const late = quietIn + about > w.in_min ? `, and may get there after ${at}` : "";
        uses += `would start ${startAt}. Quiet hours hold it until ${clock(quiet)}, so it starts then${late}.`;
      } else {
        uses += `starts warming ${startAt}.`;
      }
    }
  }
  if (m.lockshield != null) {
    uses += m.lockshield_learned === false
      ? ` Between burns, the valve's opening limit rests at ${m.lockshield}% until Radiate has seen enough burns to set it.`
      : ` Between burns, the valve's opening limit rests at ${m.lockshield}%, enough for 9 in 10 of the openings this room has needed lately.`;
  }
  add("uses", "Used for", uses);

  // Changes: relearned after a change, or started again (learning notes, 14 days).
  if (m.relearns > 0) {
    add("relearned", "Relearned", `Radiate relearned this room ${times(m.relearns)}, after it started warming differently from before, as happens when a radiator is bled or replaced.`);
  }
  for (const n of ctx.notes ?? []) {
    const when = new Date(n.at * 1000);
    const on = `${when.getDate()} ${MONTHS[when.getMonth()]}`;
    const label = n.code === "learning.reset" || n.code === "learning.invalidated" ? "Started again" : "Carried over";
    add(`note-${n.at}`, label, `${on}. ${n.message}`);
  }
  return rows;
}

// The numbers as the model holds them, for anyone who wants them.
export function rawText(m) {
  return `In the model's own terms: heating gain ${m.a.toFixed(2)} K/h, loss rate ${m.b.toFixed(3)} per hour per degree, other heat ${m.d.toFixed(2)} K/h, arrival lag ${Math.round(m.arrival_lag_min)} min, confidence ${Math.round(m.confidence * 100)}%.`;
}
