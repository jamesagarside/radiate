// Household setup wizard: five short steps that build every room's heating schedule
// from how the household lives. People, Routines (one screen per person), Rooms,
// Temperatures, then the Result as a week per room, compiled by the server.
//
// The answers live in a draft (household.js); this file only draws it and keeps it in
// step with the inputs. Each step is checked by the server before moving on
// (POST household/preview), so errors appear next to the answer they are about, with
// the same rules and limits as the house file. Leaving keeps a draft in this browser.
// Defaults are filled in, so a household can click straight through and adjust later.

import * as H from "./household.js";
import { weekView } from "./week.js";

const DRAFT_KEY = "radiate.householdDraft";
const $ = (id) => document.getElementById(id);

// The parts as Web Awesome components: a "btn" button is an outlined <wa-button>
// ("btn-primary" the brand one), a "link" button a plain small one, a "card" a
// <wa-card> and a "badge" a neutral <wa-badge>. Their classes stay, so the code that
// finds them by class still does.
function upgrade(tag, cls = "", aria = false) {
  const c = ` ${cls} `;
  if (tag === "button" && !aria && /\s(btn|link)\s/.test(c)) {
    const b = document.createElement("wa-button");
    if (c.includes(" btn-primary ")) b.setAttribute("variant", "brand");
    else if (c.includes(" link ")) { b.setAttribute("appearance", "plain"); b.setAttribute("size", "s"); }
    else b.setAttribute("appearance", "outlined");
    if (!c.includes(" link ")) b.setAttribute("size", "s");
    return b;
  }
  if (c.includes(" card ")) return document.createElement("wa-card");
  if (c.includes(" badge ")) {
    const b = document.createElement("wa-badge");
    b.setAttribute("variant", "neutral");
    b.setAttribute("appearance", "outlined");
    return b;
  }
  return document.createElement(tag);
}

// h("p", { class: "x", text: "y" }, child, ...): a small element builder.
// A button that needs its own ARIA (a label naming the room, aria-expanded) stays a
// native <button>: <wa-button> doesn't pass those to its inner button. Web Awesome's
// native styles draw it as the same outlined, brand or plain button.
const nativeLook = (cls) =>
  ` ${cls} `.includes(" btn-primary ") ? "wa-brand wa-size-s" : ` ${cls} `.includes(" link ") ? "wa-plain wa-size-s" : "wa-outlined wa-size-s";

function h(tag, attrs = {}, ...children) {
  const aria = Object.keys(attrs).some((k) => k.startsWith("aria-"));
  const n = upgrade(tag, attrs.class, aria);
  if (n.localName === "button" && /\b(btn|link)\b/.test(attrs.class ?? "")) attrs = { ...attrs, class: `${attrs.class} ${nativeLook(attrs.class)}` };
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "text") n.textContent = v;
    else if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k in n && typeof v !== "string") n[k] = v;
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) n.append(c);
  return n;
}

const idFor = (path) => `f-${path.replace(/[^a-z0-9]+/gi, "-")}`;
const sentence = (text) => {
  const t = String(text).trim();
  return t ? `${t[0].toUpperCase()}${t.slice(1)}${/[.?!]$/.test(t) ? "" : "."}` : "";
};

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
}
function saveLocal(value) {
  try {
    if (value) localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
    else localStorage.removeItem(DRAFT_KEY);
  } catch { /* storage blocked: the draft lives until the page closes */ }
}

export function createSetup({ transport, onSaved, onOpen, onClose }) {
  const root = $("setup");
  const body = $("setup-body");
  const summary = $("setup-summary");
  const back = $("setup-back");
  const next = $("setup-next");
  const progress = $("setup-progress");
  const steps = $("setup-steps");
  const source = $("setup-source");
  const resume = $("setup-resume");

  let view = null; // GET household
  let draft = null;
  let base = ""; // the household the draft started from, to spot a change elsewhere
  let step = 0;
  let person = 0;
  let reached = 0; // the furthest step visited, for the step list
  let errors = []; // [{path, message}] from the last check of this step
  let notes = [];
  let busy = false;
  let keyboard = false; // the last step change came from the keyboard: no motion
  const open = new Set(); // Advanced disclosures left open
  const linkChosen = new Set(); // people whose Home Assistant link was picked by hand
  let week = null;

  // --- persistence -------------------------------------------------------------------

  let saveTimer = null;
  const remember = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveLocal({ v: 1, base, step, person, reached, draft }), 300);
  };
  const forget = () => {
    clearTimeout(saveTimer);
    saveLocal(null);
  };

  // --- fields ------------------------------------------------------------------------

  // A labelled answer with a one-line explanation and room for its error.
  // `input` may be wrapped, with a unit after it: the label and help go to the control.
  function field(path, label, input, help = "", extra = null) {
    const control = input.matches("input, select") ? input : input.querySelector("input, select");
    control.id ||= idFor(path);
    const helpId = help ? `${control.id}-help` : null;
    if (helpId) control.setAttribute("aria-describedby", helpId);
    return h(
      "div",
      { class: "field", "data-path": path },
      h("label", { for: control.id, text: label }),
      input,
      help ? h("p", { class: "field-help", id: helpId, text: help }) : null,
      extra,
    );
  }

  function timeInput(path, value, { end = false, onChange }) {
    const input = h("input", {
      id: idFor(path),
      type: "text",
      inputmode: "numeric",
      autocomplete: "off",
      spellcheck: "false",
      maxlength: "5",
      placeholder: end ? "22:30" : "07:30",
      class: "time",
      value,
    });
    input.addEventListener("input", () => { onChange(input.value); remember(); });
    input.addEventListener("blur", () => {
      const t = H.normaliseTime(input.value, { end });
      if (t && t !== input.value) { input.value = t; onChange(t); remember(); }
    });
    return input;
  }

  // A whole number of minutes, or a temperature. `value` null shows the default as a
  // placeholder and sends nothing, for per-person and per-room settings.
  function numberInput(path, value, { limit, step = 1, placeholder = "", onChange }) {
    const input = h("input", {
      id: idFor(path),
      type: "number",
      inputmode: step < 1 ? "decimal" : "numeric",
      min: String(limit.off === 0 ? 0 : limit.min),
      max: String(limit.max),
      step: String(step),
      placeholder: placeholder === "" ? "" : String(placeholder),
      class: "num",
      value: value == null ? "" : String(value),
    });
    input.addEventListener("input", () => {
      const raw = input.value.trim();
      onChange(raw === "" ? null : Number.isFinite(Number(raw)) ? Number(raw) : raw);
      remember();
    });
    return input;
  }

  const withUnit = (input, unit) => h("span", { class: "unit" }, input, h("span", { "aria-hidden": "true", text: unit }));

  function select(path, value, options, onChange) {
    const s = h("select", { id: idFor(path) }, options.map(([v, label]) => h("option", { value: v, text: label })));
    s.value = value;
    s.addEventListener("change", () => { onChange(s.value); remember(); });
    return s;
  }

  function checkbox(id, label, checked, onChange, help = "") {
    const input = h("input", { type: "checkbox", id, checked });
    input.addEventListener("change", () => { onChange(input.checked); remember(); });
    return h("div", { class: "check" }, input, h("label", { for: id, text: label }), help ? h("p", { class: "field-help", text: help }) : null);
  }

  // Days of the week as checkboxes, Monday first.
  function dayPicker(path, days, onChange) {
    const set = new Set(days);
    return h(
      "fieldset",
      { class: "days", "data-path": path },
      h("legend", { class: "sr-only", text: "Days" }),
      H.DAY_NAMES.map((d) => {
        const id = `${idFor(path)}-${d}`;
        const input = h("input", { type: "checkbox", id, checked: set.has(d) });
        input.addEventListener("change", () => {
          if (input.checked) set.add(d); else set.delete(d);
          onChange(H.DAY_NAMES.filter((x) => set.has(x)));
          remember();
        });
        return h("span", { class: "day" }, input, h("label", { for: id, text: d[0].toUpperCase() + d.slice(1, 3) }));
      }),
    );
  }

  function advanced(key, title, ...children) {
    const d = h("details", { class: "setup-adv", open: open.has(key) }, h("summary", { text: title }), h("div", { class: "setup-adv-body" }, ...children));
    d.addEventListener("toggle", () => { if (d.open) open.add(key); else open.delete(key); });
    return d;
  }

  const limit = (key) => view.limits[key];
  const def = (section, key) => view.defaults[section][key];
  const defText = (m, off = null) => `Default ${H.minutesText(m, off)}.`;

  // --- steps -------------------------------------------------------------------------

  function stepHeading(text, intro) {
    return [h("h3", { class: "setup-title", id: "setup-step-h", tabindex: "-1", text }), intro ? h("p", { class: "setup-intro", text: intro }) : null];
  }

  // A person's Home Assistant `person` entity: a choice of the people Home Assistant
  // reported, or, without a report, the entity ID typed in. Every link shares one
  // explanation, `helpId`, under the list.
  function haPersonField(p, path, helpId) {
    const persons = H.haPersons(view);
    let control;
    if (persons) {
      control = select(`${path}.ha_person`, p.ha_person ?? "", H.personOptions(persons, p.ha_person), (v) => {
        p.ha_person = v || null;
        linkChosen.add(p.id);
      });
    } else {
      control = h("input", {
        id: idFor(`${path}.ha_person`),
        type: "text",
        class: "entity",
        value: p.ha_person ?? "",
        placeholder: "person.sam",
        autocomplete: "off",
        autocapitalize: "none",
        spellcheck: "false",
        maxlength: "107",
      });
      control.addEventListener("input", () => { p.ha_person = control.value.trim() || null; remember(); });
    }
    control.setAttribute("aria-describedby", helpId);
    return h("div", { class: "field", "data-path": `${path}.ha_person` }, h("label", { for: control.id, text: "Home Assistant person" }), control);
  }

  function peopleStep() {
    const list = h("div", { class: "setup-people" });
    const persons = H.haPersons(view);
    const helpId = `${idFor("household.people")}-ha-help`;
    const linkHelp = () =>
      persons
        ? `${H.linkHelp(draft.away.presence_delay_min)} A link set in the integration's options takes priority.`
        : `Optional. Type the entity ID, such as person.sam. ${H.linkHelp(draft.away.presence_delay_min)}`;
    const help = h("p", { class: "field-help", id: helpId, text: linkHelp() });
    draft.people.forEach((p, i) => {
      const path = `household.people.${p.id}`;
      const name = h("input", { id: idFor(`${path}.name`), type: "text", value: p.name, autocomplete: "off", maxlength: "40", required: true });
      name.addEventListener("input", () => { p.name = name.value; remember(); });
      // A new name can match someone in Home Assistant: suggest them, unless a link is set
      // or this person's link was chosen by hand.
      name.addEventListener("change", () => {
        if (!persons || p.ha_person || linkChosen.has(p.id)) return;
        const taken = draft.people.map((x) => x.ha_person).filter(Boolean);
        const match = H.matchPerson(p.name, persons, taken);
        if (!match) return;
        p.ha_person = match;
        const choice = document.getElementById(idFor(`${path}.ha_person`));
        if (choice) choice.value = match;
        remember();
      });
      const remove = h("button", {
        type: "button",
        class: "link",
        text: "Remove",
        "aria-label": `Remove ${p.name || `person ${i + 1}`}`,
        disabled: draft.people.length < 2,
        onclick: () => {
          H.removePerson(draft, p.id);
          person = Math.min(person, draft.people.length - 1);
          rerender(`${idFor("household.people")}-add`);
          remember();
        },
      });
      list.append(h(
        "div",
        { class: "setup-person", role: "group", "aria-label": `Person ${i + 1}`, "data-path": path },
        field(`${path}.name`, `Person ${i + 1}`, name),
        haPersonField(p, path, helpId),
        remove,
      ));
    });
    const add = h("button", {
      type: "button",
      class: "btn",
      id: `${idFor("household.people")}-add`,
      text: "Add a person",
      onclick: () => {
        const id = H.addPerson(draft);
        rerender(idFor(`household.people.${id}.name`), true);
        remember();
      },
    });
    const a = draft.away;
    const off = limit("away.presence_stale_after_min").off;
    return [
      ...stepHeading("Who lives here?", "Add everyone whose comings and goings change when rooms need heat. Names stay on this server and only appear in Radiate."),
      h("div", { class: "field-group", "data-path": "household.people" }, list, help, add),
      advanced(
        "away",
        "Advanced: away and presence",
        field("household.away.presence_delay_min", "Counts as away after", withUnit(numberInput("household.away.presence_delay_min", a.presence_delay_min, { limit: limit("away.presence_delay_min"), onChange: (v) => {
          a.presence_delay_min = v;
          if (typeof v === "number") help.textContent = linkHelp();
        } }), "min"),
          `How long Home Assistant must say someone is out before Radiate counts them as away. ${defText(def("away", "presence_delay_min"))}`),
        field("household.away.presence_stale_after_min", "Presence goes stale after", withUnit(numberInput("household.away.presence_stale_after_min", a.presence_stale_after_min, { limit: limit("away.presence_stale_after_min"), onChange: (v) => (a.presence_stale_after_min = v) }), "min"),
          `If Home Assistant stops reporting someone for this long, Radiate treats them as home, not away. 0 turns this off. ${defText(def("away", "presence_stale_after_min"), off)}`),
        field("household.away.return_warmup_min", "Warm up for a return up to", withUnit(numberInput("household.away.return_warmup_min", a.return_warmup_min, { limit: limit("away.return_warmup_min"), onChange: (v) => (a.return_warmup_min = v) }), "min"),
          `How early Radiate may start warming rooms for someone due back. ${defText(def("away", "return_warmup_min"))}`),
        field("household.away.presence_evidence_max_age_min", "Trust not home for", withUnit(numberInput("household.away.presence_evidence_max_age_min", a.presence_evidence_max_age_min, { limit: limit("away.presence_evidence_max_age_min"), onChange: (v) => (a.presence_evidence_max_age_min = v) }), "min"),
          `If someone's phone or tracker hasn't reported for this long, for example because its battery died, Radiate counts them as home. ${defText(def("away", "presence_evidence_max_age_min"))}`),
        field("household.away.presence_weak_source_delay_min", "Wifi or Bluetooth trackers count as away after", withUnit(numberInput("household.away.presence_weak_source_delay_min", a.presence_weak_source_delay_min, { limit: limit("away.presence_weak_source_delay_min"), onChange: (v) => (a.presence_weak_source_delay_min = v) }), "min"),
          `A phone asleep at home can drop off wifi, so these trackers, and phones at 5% battery or less, wait longer. ${defText(def("away", "presence_weak_source_delay_min"))}`),
        field("household.away.everyone_away", "When everyone has set an away until", select("household.away.everyone_away", a.everyone_away, [["frost", "Hold every room at frost protection"], ["unused", "Keep rooms at their unused temperature"]], (v) => (a.everyone_away = v)),
          "Frost protection only applies when everyone has said when they're back. If Home Assistant alone says everyone is out, rooms stay at their unused temperature. Unused suits a house with pets or one that gets damp. Default frost protection."),
      ),
    ];
  }

  function routineFields(p, dayType, legend) {
    const r = p[dayType];
    const path = `household.people.${p.id}.${dayType}`;
    const name = p.name || "this person";
    const periods = h("div", { class: "periods" });
    const paths = H.periodPaths(path, r.periods);
    r.periods.forEach((period, i) => {
      const rowPath = paths[i];
      const type = select(`${rowPath}.type`, period.type, [["out", "Out of the house"], ["work", "Working from home"]], (v) => {
        period.type = v;
        // Out and work windows are numbered apart, so the row's path changes with it.
        rerender(idFor(`${H.periodPaths(path, r.periods)[i]}.type`));
      });
      const from = timeInput(`${rowPath}.from`, period.from, { onChange: (v) => (period.from = v) });
      const to = timeInput(`${rowPath}.to`, period.to, { end: true, onChange: (v) => (period.to = v) });
      const remove = h("button", {
        type: "button",
        class: "link",
        text: "Remove",
        "aria-label": `Remove ${period.type === "work" ? "working" : "out"} ${period.from} to ${period.to}`,
        onclick: () => {
          r.periods.splice(i, 1);
          rerender(`${idFor(path)}-add-out`);
          remember();
        },
      });
      periods.append(
        h(
          "div",
          { class: "period", role: "group", "aria-label": `${legend}, time ${i + 1}`, "data-path": rowPath },
          h("div", { class: "field" }, h("label", { for: type.id, text: "What" }), type),
          h("div", { class: "field" }, h("label", { for: from.id, text: period.type === "work" ? "Starts" : "Leaves" }), from),
          h("div", { class: "field" }, h("label", { for: to.id, text: period.type === "work" ? "Finishes" : "Back" }), to),
          remove,
        ),
      );
    });
    if (!r.periods.length) periods.append(h("p", { class: "field-help", text: `${name} is at home all day.` }));
    const addPeriod = (type, from, to) => () => {
      r.periods.push({ type, from, to });
      const at = H.periodPaths(path, r.periods).at(-1);
      rerender(idFor(`${at}.from`));
      remember();
    };
    return h(
      "fieldset",
      { class: "routine", "data-path": path },
      h("legend", { text: legend }),
      field(`${path}.up`, `When does ${name} get up?`, timeInput(`${path}.up`, r.up, { onChange: (v) => (r.up = v) })),
      h(
        "div",
        { class: "field-group" },
        h("p", { class: "field-label", text: `Is ${name} out or working from home during the day?` }),
        periods,
        h(
          "div",
          { class: "row" },
          h("button", { type: "button", class: "btn", id: `${idFor(path)}-add-out`, text: "Add time out", onclick: addPeriod("out", "08:30", "17:30") }),
          h("button", { type: "button", class: "btn", id: `${idFor(path)}-add-work`, text: "Add time working from home", onclick: addPeriod("work", "09:00", "17:00") }),
        ),
      ),
      field(`${path}.bed`, `When does ${name} go to bed?`, timeInput(`${path}.bed`, r.bed, { end: true, onChange: (v) => (r.bed = v) })),
    );
  }

  function routinesStep() {
    const p = draft.people[person];
    const name = p.name || `Person ${person + 1}`;
    const path = `household.people.${p.id}`;
    const parts = [
      ...stepHeading(`${name}'s routine`, draft.people.length > 1 ? `Person ${person + 1} of ${draft.people.length}. Usual days are enough: Radiate handles one-off changes with away and overrides.` : "Usual days are enough: Radiate handles one-off changes with away and overrides."),
      routineFields(p, "weekdays", p.weekendSame ? "Every day" : "Weekdays"),
      checkbox(`${idFor(path)}-weekend`, "Weekends are different", !p.weekendSame, (on) => {
        p.weekendSame = !on;
        if (on && JSON.stringify(p.weekend) === JSON.stringify(p.weekdays)) p.weekend = JSON.parse(JSON.stringify(H.NEW_ROUTINE.weekend));
        rerender(`${idFor(path)}-weekend`);
      }),
    ];
    if (!p.weekendSame) parts.push(routineFields(p, "weekend", "Weekends"));
    if (H.worksFromHome(p)) {
      const rooms = draft.rooms.map((r) => [r.id, r.name]);
      parts.push(field(`${path}.office`, `Where does ${name} work?`,
        select(`${path}.office`, H.officeOf(draft, p.id) ?? "", [["", "No particular room"], ...rooms], (v) => H.setOffice(draft, p.id, v || null)),
        "That room is warm while they work. Shared rooms aren't heated while someone works."));
    }
    const t = draft.timing;
    const own = p.weekend_days == null;
    parts.push(advanced(
      `person-${p.id}`,
      `Advanced: timing for ${name}`,
      field(`${path}.getting_up_min`, "Getting ready", withUnit(numberInput(`${path}.getting_up_min`, p.getting_up_min, { limit: limit("timing.getting_up_min"), placeholder: t.getting_up_min, onChange: (v) => (p.getting_up_min = v) }), "min"),
        `How long their bedroom and shared rooms stay warm after they get up. Leave empty for the house setting, ${H.minutesText(t.getting_up_min)}.`),
      field(`${path}.bedtime_min`, "Winding down", withUnit(numberInput(`${path}.bedtime_min`, p.bedtime_min, { limit: limit("timing.bedtime_min"), placeholder: t.bedtime_min, onChange: (v) => (p.bedtime_min = v) }), "min"),
        `How long their bedroom is warm before they go to bed. Leave empty for the house setting, ${H.minutesText(t.bedtime_min)}.`),
      h("div", { class: "field", "data-path": `${path}.weekend_days` },
        checkbox(`${idFor(path)}-own-weekend`, `Same weekend days as the house (${H.daysText(draft.weekend_days)})`, own, (same) => {
          p.weekend_days = same ? null : [...draft.weekend_days];
          rerender(`${idFor(path)}-own-weekend`);
        }, "Untick for someone who works weekends."),
        own ? null : dayPicker(`${path}.weekend_days`, p.weekend_days, (days) => (p.weekend_days = days))),
    ));
    return parts;
  }

  function useHelp(level) {
    const t = draft.temperatures;
    return {
      in_use: `Kept at ${t.in_use}° while it's used.`,
      occasional: `Kept at ${t.occasional}° while it's used, for a bathroom or guest room.`,
      unused: `Kept at ${t.unused}° by day and ${t.night}° at night.`,
      own: "Follows its schedule from the house file. Radiate doesn't change it.",
    }[level];
  }

  function roomsStep() {
    const list = h("div", { class: "setup-rooms" });
    const levels = H.USE_LEVELS;
    for (const room of draft.rooms) {
      const path = `household.rooms.${room.id}`;
      const options = room.schedule ? [...levels, ["own", "Its own schedule"]] : levels;
      const use = select(`${path}.use`, room.own ? "own" : room.use, options, (v) => {
        room.own = v === "own";
        if (!room.own) room.use = v;
        rerender(idFor(`${path}.use`));
      });
      const headId = `${idFor(path)}-h`;
      const card = h(
        "div",
        { class: "card setup-room", role: "group", "aria-labelledby": headId, "data-path": path },
        h("h4", { id: headId, text: room.name }),
      );
      card.append(field(`${path}.use`, "How is it used?", use, useHelp(room.own ? "own" : room.use)));
      if (!room.own) {
        card.append(checkbox(`${idFor(path)}-weekend`, "Different at weekends", room.weekendDifferent, (on) => {
          room.weekendDifferent = on;
          if (!on) room.weekendUse = room.use;
          rerender(`${idFor(path)}-weekend`);
        }));
        if (room.weekendDifferent) {
          card.append(field(`${path}.use.weekend`, "At weekends", select(`${path}.use.weekend`, room.weekendUse, levels, (v) => { room.weekendUse = v; })));
        }
        const unused = room.use === "unused" && (!room.weekendDifferent || room.weekendUse === "unused");
        if (!unused) {
          const kind = select(`${path}.kind`, room.kind, H.KINDS.map(([v, label]) => [v, label]), (v) => {
            room.kind = v;
            rerender(idFor(`${path}.kind`));
          });
          card.append(field(`${path}.kind`, "What kind of room?", kind, H.kindText(room.kind)));
          if (draft.people.length > 1) card.append(whoUses(room, path));
        }
        card.append(roomAdvanced(room, path));
      }
      list.append(card);
    }
    return [
      ...stepHeading("How is each room used?", "Radiate warms a room when its people are likely to be in it, and keeps it cooler otherwise."),
      list,
    ];
  }

  function whoUses(room, path) {
    const all = room.people == null;
    const group = h("fieldset", { class: "who", "data-path": `${path}.people` }, h("legend", { class: "field-label", text: "Who uses it?" }));
    group.append(checkbox(`${idFor(path)}-everyone`, "Everyone", all, (on) => {
      room.people = on ? null : draft.people.map((p) => p.id);
      rerender(`${idFor(path)}-everyone`);
    }));
    if (!all) {
      for (const p of draft.people) {
        group.append(checkbox(`${idFor(path)}-${p.id}`, p.name || p.id, room.people.includes(p.id), (on) => {
          const set = new Set(room.people);
          if (on) set.add(p.id); else set.delete(p.id);
          room.people = draft.people.map((x) => x.id).filter((id) => set.has(id));
        }));
      }
    }
    return group;
  }

  function roomAdvanced(room, path) {
    const t = draft.temperatures;
    const temps = limit("temperatures");
    const damp = (key, fallback) => {
      const note = h("p", { class: "field-note", "aria-live": "polite", text: H.dampNote(room[key] ?? fallback, view.damp_below_c) });
      return note;
    };
    const temp = (key, label, fallback, help) => {
      const note = key === "temperature" ? null : damp(key, fallback);
      const input = numberInput(`${path}.${key}`, room[key], {
        limit: temps,
        step: 0.5,
        placeholder: fallback,
        onChange: (v) => {
          room[key] = v;
          if (note) note.textContent = H.dampNote(v ?? fallback, view.damp_below_c);
        },
      });
      return field(`${path}.${key}`, label, withUnit(input, "°C"), help, note);
    };
    const level = room.use === "unused" ? room.weekendUse : room.use;
    return advanced(
      `room-${room.id}`,
      `Advanced: ${room.name}`,
      temp("temperature", "Its own warm temperature", t[level] ?? t.in_use, "Replaces the use level's temperature in this room only. Leave empty to use the level's."),
      temp("night_temperature", "Its own night temperature", t.night, `For a warmer nursery, say. Leave empty for the house's, ${t.night}°.`),
      temp("unused_temperature", "Its own unused temperature", t.unused, `Leave empty for the house's, ${t.unused}°.`),
      field(`${path}.preheat_min`, "Valve starts early by", withUnit(numberInput(`${path}.preheat_min`, room.preheat_min, { limit: limit("timing.preheat_min"), placeholder: draft.timing.preheat_min, onChange: (v) => (room.preheat_min = v) }), "min"),
        `For a slow room with a small radiator. Leave empty for the house setting, ${H.minutesText(draft.timing.preheat_min)}.`),
    );
  }

  function temperaturesStep() {
    const t = draft.temperatures;
    const temps = limit("temperatures");
    const level = (key, label, help) => {
      const path = `household.temperatures.${key}`;
      const damp = key === "unused" || key === "night";
      const note = damp ? h("p", { class: "field-note", "aria-live": "polite", text: H.dampNote(t[key], view.damp_below_c) }) : null;
      const input = numberInput(path, t[key], {
        limit: temps,
        step: 0.5,
        onChange: (v) => {
          t[key] = v;
          if (note) note.textContent = H.dampNote(v, view.damp_below_c);
        },
      });
      return field(path, label, withUnit(input, "°C"), `${help} Default ${def("temperatures", key)}°.`, note);
    };
    const tm = draft.timing;
    const minutesField = (key, label, help) => {
      const path = `household.timing.${key}`;
      return field(path, label, withUnit(numberInput(path, tm[key], { limit: limit(`timing.${key}`), onChange: (v) => (tm[key] = v) }), "min"), `${help} ${defText(def("timing", key))}`);
    };
    return [
      ...stepHeading("How warm should rooms be?", "One temperature for each way a room is used. Rooms change between them through the day."),
      h(
        "div",
        { class: "setup-grid" },
        level("in_use", "In use", "Rooms while they're being used."),
        level("occasional", "Occasional", "Rooms used now and then, such as a bathroom, while they're used."),
        level("unused", "Unused", "Every room by day when it isn't being used."),
        level("night", "Night", "Every room overnight, from the last person in bed to the first one up."),
      ),
      advanced(
        "timing",
        "Advanced: timing",
        h("div", { class: "field", "data-path": "household.weekend_days" },
          h("p", { class: "field-label", text: "Weekend days" }),
          dayPicker("household.weekend_days", draft.weekend_days, (days) => (draft.weekend_days = days)),
          h("p", { class: "field-help", text: "The days that use weekend routines and weekend room use. Default Saturday and Sunday." })),
        minutesField("getting_up_min", "Getting ready", "How long bedrooms and shared rooms stay warm after someone gets up."),
        minutesField("bedtime_min", "Winding down", "How long a bedroom is warm before someone goes to bed."),
        minutesField("preheat_min", "Valves start early by", "How early the valve's own copy of the schedule starts each warm period, for when it runs without Radiate."),
        field("household.timing.live_preheat", "How Radiate starts early", select("household.timing.live_preheat", tm.live_preheat, [["optimum_start", "Learn how early each room needs"], ["fixed", "A fixed time early, as the valves do"]], (v) => (tm.live_preheat = v)),
          "Learning starts each room as late as it can and still be warm in time. Default learn."),
        minutesField("merge_gap_min", "Join warm periods closer than", "Two warm periods this close together become one, so a room doesn't cool for a short gap."),
      ),
    ];
  }

  function resultStep() {
    const wrap = h("div", { class: "setup-result" });
    const legendEl = h("p", { class: "week-legend", hidden: true });
    const frostEl = h("p", { class: "away-note", hidden: true, text: "Everyone is away now, so rooms are held at frost protection. These weeks apply when someone is home or due back." });
    const list = h("div", { class: "weeks" });
    const status = h("p", { class: "setup-status", id: "setup-result-status", "aria-live": "polite", tabindex: "-1", text: "Building your week…" });
    wrap.append(status, h("div", { class: "setup-notes", id: "setup-notes" }), h("div", { class: "week-head" }, legendEl), frostEl, list);
    week = weekView({ list, legendEl, frostEl });
    return [...stepHeading("Your heating week", "Every room's week, built from your answers. Blocks are warm periods, darker when warmer."), wrap];
  }

  // --- drawing and moving between steps -----------------------------------------------

  const BUILDERS = [peopleStep, () => routinesStep(), roomsStep, temperaturesStep, resultStep];

  function drawSteps() {
    steps.textContent = "";
    H.STEP_TITLES.forEach((title, i) => {
      const current = i === step;
      const item = h("li", { "aria-current": current ? "step" : null, "data-done": String(i < step) });
      const label = `${i + 1}. ${title}`;
      if (i <= reached && !current) {
        item.append(h("button", { type: "button", class: "link", text: label, onclick: (e) => go(i, 0, e.detail === 0) }));
      } else {
        item.append(h("span", { text: label }));
      }
      steps.append(item);
    });
  }

  function drawSource() {
    source.textContent = "";
    const problems = view.saved_problems ?? [];
    if (problems.length) {
      source.hidden = false;
      source.append(h("p", { text: `Your saved setup couldn't be used, so the house file's setup applies: ${problems.map((p) => sentence(p.message)).join(" ")} Saving here replaces it.` }));
      return;
    }
    if (view.source === "saved") {
      source.hidden = false;
      const fallback = view.house_file ? "the household section of the house file" : "the schedules in the house file";
      // No file in the browser demo: the setup is kept while it runs.
      source.append(h("p", {
        text: view.saved_at
          ? `This setup is saved by Radiate in ${view.saved_at}. It replaces ${fallback}, which is left as it is.`
          : "This setup replaces the schedules the house started with, until you go back to them.",
      }));
      const confirm = h("div", { class: "row", hidden: true },
        h("p", { text: `This deletes the saved setup. Rooms go back to ${fallback}.` }),
        h("button", { type: "button", class: "btn", text: "Delete and use the house file", onclick: revert }),
        h("button", { type: "button", class: "link", text: "Keep this setup", onclick: () => { confirm.hidden = true; ask.hidden = false; ask.focus(); } }));
      const ask = h("button", { type: "button", class: "link", text: "Use the house file's setup instead", onclick: () => { confirm.hidden = false; ask.hidden = true; confirm.querySelector(".btn").focus(); } });
      source.append(ask, confirm);
      return;
    }
    if (view.source === "house_file") {
      source.hidden = false;
      source.append(h("p", { text: "These answers start from the household section of the house file. Saving keeps them in Radiate's data folder, where they replace that section. The house file isn't changed." }));
      return;
    }
    source.hidden = true;
  }

  // Draw the current step. `focusId` keeps focus on a control after a rebuild within a
  // step; without it, focus moves to the step's heading.
  function render(focusId = null) {
    root.dataset.instant = String(keyboard || focusId != null);
    const node = h("div", { class: "setup-step" }, ...BUILDERS[step]());
    body.replaceChildren(node);
    drawSteps();
    back.hidden = step === 0 && person === 0;
    next.disabled = false;
    next.textContent = step === 4 ? "Save" : step === 3 ? "See the result" : "Next";
    const title = step === 1 ? `${H.STEP_TITLES[1]}, ${draft.people[person]?.name || `person ${person + 1}`}` : H.STEP_TITLES[step];
    progress.textContent = `Step ${step + 1} of 5: ${title}`;
    showErrors(false);
    if (focusId && document.getElementById(focusId)) document.getElementById(focusId).focus();
    else $("setup-step-h")?.focus();
    if (step === 4) buildResult();
  }

  function rerender(focusId, keepErrors = true) {
    const kept = errors;
    render(focusId);
    if (keepErrors) { errors = kept; showErrors(false); }
    remember();
  }

  function go(nextStep, nextPerson = 0, byKeyboard = false) {
    keyboard = byKeyboard;
    step = nextStep;
    person = Math.min(nextPerson, draft.people.length - 1);
    reached = Math.max(reached, step);
    errors = [];
    notes = [];
    render();
    remember();
  }

  // Errors: a summary at the top of the step, read out, and each error next to its
  // answer, linked with aria-describedby.
  function showErrors(focus) {
    for (const n of body.querySelectorAll(".field-error")) n.remove();
    for (const n of body.querySelectorAll("[aria-invalid]")) {
      n.removeAttribute("aria-invalid");
      if (n.dataset.describedby) n.setAttribute("aria-describedby", n.dataset.describedby);
      else n.removeAttribute("aria-describedby");
      delete n.dataset.describedby;
    }
    summary.textContent = "";
    summary.hidden = !errors.length;
    if (!errors.length) return;
    const paths = [...body.querySelectorAll("[data-path]")].map((n) => n.dataset.path);
    summary.append(h("h3", { text: errors.length === 1 ? "Check this answer" : `Check these ${errors.length} answers` }));
    const ul = h("ul");
    errors.forEach((e, i) => {
      const target = H.errorTarget(paths, e.path);
      const holder = target ? body.querySelector(`[data-path="${CSS.escape(target)}"]`) : null;
      const text = sentence(e.message);
      const control = holder?.matches("input, select") ? holder : holder?.querySelector("input, select, button");
      if (holder) {
        const id = `setup-err-${i}`;
        const msg = h("p", { class: "field-error", id, text });
        const label = holder.querySelector(":scope > label, :scope > legend, :scope > h4, :scope > .field-label");
        if (label) label.after(msg); else holder.prepend(msg);
        if (control) {
          control.setAttribute("aria-invalid", "true");
          const was = control.getAttribute("aria-describedby") ?? "";
          control.dataset.describedby = was;
          control.setAttribute("aria-describedby", `${id} ${was}`.trim());
        }
      }
      const where = errorLabel(e.path);
      ul.append(h("li", {}, control
        ? h("a", { href: `#${control.id}`, text: `${where}${text}`, onclick: (ev) => { ev.preventDefault(); control.focus(); } })
        : goToStep(e.path, `${where}${text}`)));
    });
    summary.append(ul);
    if (focus) summary.focus();
  }

  // "Sam, weekdays: " before a message, so it makes sense out of place.
  function errorLabel(path) {
    const parts = path.split(".");
    if (parts[1] === "people" && parts[2]) {
      const p = draft.people.find((x) => x.id === parts[2]);
      const day = parts[3]?.startsWith("weekend") && parts[3] !== "weekend_days" ? ", weekends" : parts[3]?.startsWith("weekdays") ? ", weekdays" : "";
      return `${p?.name || parts[2]}${day}: `;
    }
    if (parts[1] === "rooms" && parts[2]) return `${draft.rooms.find((r) => r.id === parts[2])?.name ?? parts[2]}: `;
    return "";
  }

  function goToStep(path, text) {
    if (!path) return h("span", { text });
    const { step: s, person: p } = H.stepFor(draft, path);
    if (s === step && (s !== 1 || p === person)) return h("span", { text });
    return h("button", { type: "button", class: "link", text: `${text} Change it in ${H.STEP_TITLES[s]}.`, onclick: (e) => go(s, p, e.detail === 0) });
  }

  // Errors that belong to the screen on show.
  const here = (list) => list.filter((e) => {
    const at = H.stepFor(draft, e.path);
    return at.step === step && (step !== 1 || at.person === person);
  });

  async function check() {
    const typed = H.timeErrors(draft);
    if (here(typed).length) return { errors: here(typed), notes: [] };
    const res = await transport.call("POST", "household/preview", { household: H.toSection(draft) });
    if (res.status !== 200) throw new Error(typeof res.body === "string" ? res.body : `HTTP ${res.status}`);
    return res.body;
  }

  async function onNext(byKeyboard) {
    if (busy) return;
    if (step === 4) { await save(); return; }
    busy = true;
    next.disabled = true;
    let result;
    try {
      result = await check();
    } catch {
      busy = false;
      next.disabled = false;
      errors = [{ path: "", message: "Couldn't check your answers. Check the connection and try again." }];
      showErrors(true);
      return;
    }
    busy = false;
    next.disabled = false;
    errors = here(result.errors);
    if (errors.length) { showErrors(true); return; }
    if (step === 1 && person < draft.people.length - 1) go(1, person + 1, byKeyboard);
    else go(step + 1, 0, byKeyboard);
  }

  function onBack(byKeyboard) {
    if (step === 1 && person > 0) go(1, person - 1, byKeyboard);
    else if (step === 2) go(1, draft.people.length - 1, byKeyboard);
    else if (step > 0) go(step - 1, 0, byKeyboard);
  }

  async function buildResult() {
    const status = $("setup-result-status");
    const box = $("setup-notes");
    let result;
    try {
      result = await check();
    } catch {
      status.textContent = "Couldn't build the week. Check the connection, then go back and forward to try again.";
      next.disabled = true;
      return;
    }
    if (step !== 4) return;
    errors = result.errors;
    notes = result.notes ?? [];
    next.disabled = errors.length > 0;
    if (errors.length) {
      status.textContent = "Some answers need changing before Radiate can build the week.";
      showErrors(true);
      return;
    }
    status.textContent = "Save to start using it. Radiate then rebuilds every room's schedule from your answers.";
    box.textContent = "";
    const dropped = H.droppedText(result.rooms);
    for (const n of notes) {
      if (n.path.startsWith("household.temperatures") || n.path.includes("_temperature")) continue; // shown with the temperature
      box.append(h("p", { class: "flag", text: `${errorLabel(n.path) || ""}${n.message[0].toUpperCase()}${n.message.slice(1)}` }));
    }
    if (dropped) box.append(h("p", { class: "field-help", text: dropped }));
    week.update(result);
  }

  async function save() {
    busy = true;
    next.disabled = true;
    const status = $("setup-result-status");
    status.textContent = "Saving…";
    let res;
    try {
      res = await transport.call("PUT", "household", { household: H.toSection(draft) });
    } catch {
      res = { status: 0, body: null };
    }
    busy = false;
    next.disabled = false;
    if (res.status === 200) {
      forget();
      close(false);
      onSaved("Household setup saved. Every room's schedule is rebuilt from it.");
      return;
    }
    if (res.status === 400 && res.body?.errors) {
      errors = res.body.errors;
      status.textContent = "Not saved: some answers need changing.";
      showErrors(true);
      return;
    }
    status.textContent = res.body?.message ? `Not saved. ${res.body.message}.` : "Not saved. Check the connection and try again.";
    status.focus?.();
  }

  async function revert() {
    let res;
    try { res = await transport.call("DELETE", "household"); } catch { res = { status: 0 }; }
    if (res.status !== 200) {
      errors = [{ path: "", message: "Couldn't go back to the house file's setup. Try again." }];
      showErrors(true);
      return;
    }
    forget();
    close(false);
    onSaved("Using the house file's setup again. The saved setup is deleted.");
  }

  function close(keep = true) {
    if (keep && draft) remember();
    root.hidden = true;
    onClose();
  }

  // --- wiring ------------------------------------------------------------------------

  // Enter in a field submits through a synthetic click with no pointer (detail 0), so
  // a keyboard user moves on without motion.
  let nextByKeyboard = false;
  next.addEventListener("click", (e) => { nextByKeyboard = e.detail === 0; });
  $("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    onNext(nextByKeyboard);
  });
  back.addEventListener("click", (e) => onBack(e.detail === 0));
  $("setup-close").addEventListener("click", () => close(true));
  $("setup-restart").addEventListener("click", () => {
    forget();
    draft = H.draftFrom(view);
    linkChosen.clear();
    resume.hidden = true;
    reached = 0;
    go(0);
  });

  return {
    // Load the setup in use and show the wizard, resuming a draft left in this browser.
    async open() {
      const res = await transport.call("GET", "household");
      if (res.status !== 200) throw new Error(`household: HTTP ${res.status}`);
      view = res.body;
      base = JSON.stringify(view.household);
      const local = loadLocal();
      const usable = local?.v === 1 && local.base === base && local.draft?.people?.length;
      draft = usable ? local.draft : H.draftFrom(view);
      step = usable ? Math.min(local.step, 4) : 0;
      person = usable ? Math.min(local.person ?? 0, draft.people.length - 1) : 0;
      reached = usable ? Math.max(local.reached ?? 0, step) : 0;
      resume.hidden = !usable;
      $("setup-h").textContent = view.household ? "Change household setup" : "Set up your household";
      errors = [];
      keyboard = false;
      linkChosen.clear();
      drawSource();
      root.hidden = false;
      onOpen();
      render();
      $("setup-h").focus();
    },
    // Is the setup offered (an older server answers 404)? null: could not tell yet.
    async available() {
      try { return (await transport.call("GET", "household")).status === 200; } catch { return null; }
    },
  };
}
