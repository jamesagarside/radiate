// Settings view: every house-file setting, at #settings (GET /api/v1/settings/config).
//
// The server describes each setting (type, unit, range, help, restart, secret,
// hardware) and says where its value comes from: the house file, set here, or the
// default. Changes are saved per section with PUT, over the house file and never in
// it; "Use the house file" sends DELETE for one setting, a section or a room. A change
// that can make Radiate write to the boiler or valves asks first, in place, and only
// then sends confirm: true. Secrets are write-only: the server never sends their value.
//
// The view is drawn from the server's answer, so a new setting appears here by adding
// it to the registry in radiate.config.settings.

const $ = (id) => document.getElementById(id);
const STATUS_MS = 15000;

// Words for the values the house file uses. Anything not listed shows as it is.
const WORDS = {
  zigbee: "Zigbee sensor",
  home_assistant: "Home Assistant",
  both: "Both, sensor first",
  eco: "Eco",
  comfort: "Comfort",
  normal: "Normal",
  internal_sensor_only: "Valve's own sensor",
  passive: "Bypass",
  unheated: "No radiator",
  episodic: "Open fire",
  continuous: "Range cooker",
  in_use: "In use",
  occasional: "Occasional",
  unused: "Unused",
};
const SOURCE = { app: "Set here", house_file: "House file", default: "Default" };

export const word = (v) => WORDS[v] ?? String(v);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const names = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`);
const domId = (path) => `st-${path.replace(/[^a-z0-9_]/gi, "-")}`;

// A number with its unit: "8 min", "7°", "20%", "0.35 L/h".
export function withUnit(n, unit) {
  const s = Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
  if (!unit) return s;
  if (unit === "°C") return `${s}°`;
  if (unit === "%") return `${s}%`;
  return `${s} ${unit}`;
}

// A value as words, for "House file: 8 min." and the like. Missing shows "–".
export function valueText(f, value) {
  if (value == null || value === "") return "–";
  switch (f.kind) {
    case "number":
    case "integer":
      return withUnit(Number(value), f.unit);
    case "bool":
      return value ? "On" : "Off";
    case "list":
      return Array.isArray(value) && value.length ? value.join(", ") : "–";
    case "use":
      if (typeof value === "string") return word(value);
      return `Weekdays ${word(value.weekdays).toLowerCase()}, weekend ${word(value.weekend).toLowerCase()}`;
    case "choice":
      return word(value);
    default:
      return String(value);
  }
}

// The muted line under a setting's label: its help, its range and default, and
// whether it waits for a restart.
export function helpText(f) {
  const parts = [f.help];
  if ((f.kind === "number" || f.kind === "integer") && f.min != null && f.max != null) {
    parts.push(`${withUnit(f.min, null)} to ${withUnit(f.max, f.unit)}.`);
  }
  if (!f.secret && f.default != null && f.default !== "") parts.push(`Default ${valueText(f, f.default)}.`);
  if (f.restart) parts.push("Used after a restart.");
  return parts.join(" ");
}

// Where the value comes from, in words: "Set here", "House file", "Default".
export function sourceText(f) {
  if (f.secret) {
    if (!f.is_set) return "Not set";
    if (f.source === "house_file" && f.env.length) return `Set from ${f.env.join(", ")}`;
    return f.source === "app" ? "Set here" : "Set in the house file";
  }
  if (f.source === "house_file" && f.env.length) return `House file, from ${f.env.join(", ")}`;
  return SOURCE[f.source] ?? f.source;
}

// What going back to the house file means for a setting set here.
export function revertText(f) {
  if (f.secret) return f.house_file_set ? "Use the house file's" : "Clear it";
  if (f.house_file_set) return `Use the house file's, ${valueText(f, f.house_file_value)}`;
  return f.default != null ? `Use the default, ${valueText(f, f.default)}` : "Use the default";
}

// The band at the top when saved changes wait for a restart.
export function restartText(view, label) {
  const n = view.pending_restart.length;
  if (!n) return "";
  const which = view.pending_restart.map(label);
  return `Restart Radiate to use ${plural(n, "changed setting", "changed settings")}: ${names(which)}.`;
}

// After a save: what was used straight away and what waits.
export function savedText(applied, restart) {
  if (applied.length && restart.length) return "Saved. Some changes are in use now; restart Radiate for the rest.";
  if (restart.length) return "Saved. Restart Radiate to use it.";
  if (applied.length) return "Saved. In use now.";
  return "Saved.";
}

// The value a control holds, as the API takes it. Undefined: a secret left as it was.
export function parseInput(f, raw) {
  switch (f.kind) {
    case "number":
    case "integer": {
      const t = String(raw).trim();
      if (!t) return null;
      const n = Number(t.replace(",", "."));
      return Number.isFinite(n) ? n : t;
    }
    case "list": {
      const items = String(raw).split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
      return items.length ? items : null;
    }
    case "secret":
      return raw === "" ? undefined : raw;
    case "text":
    case "choice":
      return String(raw).trim() === "" ? null : String(raw).trim();
    default:
      return raw;
  }
}

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// The value shown for a setting before any change: what is saved or in the house file.
function current(f) {
  if (f.secret) return undefined;
  return f.source === "default" ? null : f.value;
}

function el(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k in node && typeof v !== "string") node[k] = v;
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids) if (kid) node.append(kid);
  return node;
}

// A segmented control of radio buttons, as for the heating mode.
function segmented(label, options, value, onChange) {
  const group = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
  let chosen = value;
  const buttons = options.map(([v, text]) => {
    const b = el("button", { type: "button", role: "radio", text });
    b.dataset.value = JSON.stringify(v);
    b.addEventListener("click", () => {
      chosen = v;
      paint();
      onChange();
    });
    b.addEventListener("keydown", (e) => {
      const i = buttons.indexOf(b);
      const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const next = buttons[(i + step + buttons.length) % buttons.length];
      next.click();
      next.focus();
    });
    group.append(b);
    return b;
  });
  const paint = () => {
    for (const b of buttons) {
      const on = b.dataset.value === JSON.stringify(chosen);
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    }
    if (!buttons.some((b) => b.tabIndex === 0)) buttons[0].tabIndex = 0;
  };
  paint();
  return { node: group, get: () => chosen, focus: () => (buttons.find((b) => b.tabIndex === 0) ?? buttons[0]).focus() };
}

function select(id, options, value, onChange, describedBy) {
  const s = el("select", { id, "aria-describedby": describedBy });
  for (const [v, text] of options) s.append(el("option", { value: v, text }));
  if (value != null && !options.some(([v]) => v === value)) s.append(el("option", { value, text: word(value) }));
  s.value = value ?? "";
  s.addEventListener("change", onChange);
  return s;
}

// The input for one setting, and how to read it back.
function control(f, id, describedBy, onChange) {
  const value = current(f);
  if (f.kind === "bool") {
    const opts = [[true, "On"], [false, "Off"]];
    if (f.optional) opts.unshift([null, "Not set"]);
    const seg = segmented(f.label, opts, f.optional ? value : value ?? f.default, onChange);
    seg.node.setAttribute("aria-describedby", describedBy);
    seg.node.id = id;
    return { node: seg.node, get: () => seg.get(), focus: seg.focus };
  }
  if (f.kind === "choice") {
    const opts = f.choices.map((c) => [c, word(c)]);
    if (f.optional || value == null) opts.unshift(["", f.optional ? "Not set" : `Default, ${valueText(f, f.default)}`]);
    const s = select(id, opts, value, onChange, describedBy);
    return { node: s, get: () => parseInput(f, s.value), focus: () => s.focus() };
  }
  if (f.kind === "use") {
    const opts = [["", "Not set"], ...f.choices.map((c) => [c, word(c)])];
    const days = typeof value === "string" ? [value, value] : value ? [value.weekdays, value.weekend] : ["", ""];
    const wrap = el("div", { class: "st-use", role: "group", id, "aria-describedby": describedBy });
    const parts = ["Weekdays", "Weekend"].map((label, i) => {
      const sid = `${id}-${i}`;
      const s = select(sid, opts, days[i] || "", onChange);
      wrap.append(el("span", { class: "st-use-part" }, el("label", { for: sid, text: label }), s));
      return s;
    });
    const get = () => {
      const [a, b] = parts.map((s) => s.value);
      if (!a && !b) return null;
      return a === b ? a : { weekdays: a || null, weekend: b || null };
    };
    return { node: wrap, get, focus: () => parts[0].focus() };
  }
  const input = el("input", { id, "aria-describedby": describedBy, autocomplete: "off", spellcheck: "false" });
  if (f.kind === "number" || f.kind === "integer") {
    input.type = "text";
    input.inputMode = f.kind === "integer" || (f.min ?? 0) >= 0 ? (f.kind === "integer" ? "numeric" : "decimal") : "text";
    input.className = "num";
    input.value = value == null ? "" : String(value);
    if (value == null && f.default != null) input.placeholder = String(f.default);
  } else if (f.kind === "secret") {
    input.type = "password";
    input.autocomplete = "new-password";
    input.placeholder = f.is_set ? "Set. Type to replace it" : "Not set";
  } else if (f.kind === "list") {
    input.type = "text";
    input.value = Array.isArray(value) ? value.join(", ") : "";
    if (!input.value && Array.isArray(f.default)) input.placeholder = f.default.join(", ");
  } else {
    input.type = "text";
    input.value = value == null ? "" : String(value);
    if (!input.value && f.default != null) input.placeholder = String(f.default);
  }
  input.addEventListener("input", onChange);
  const node = f.unit && (f.kind === "number" || f.kind === "integer") ? el("span", { class: "unit" }, input, el("span", { text: f.unit })) : input;
  return { node, get: () => parseInput(f, input.value), focus: () => input.focus(), input };
}

export function createSettings({ transport, isAuthError, onAuth, onOpenSetup, onShowSchedules }) {
  let view = null;
  let open = false;
  let loading = false;
  const notes = new Map(); // group key -> { text, kind, until }
  const openRooms = new Set(); // rooms whose settings are shown, kept across redraws
  let pendingFocus = null;
  let allConfirm = false;
  const labels = new Map(); // path -> "Lounge: Name"

  const call = async (method, path, body) => {
    try {
      return await transport.call(method, path, body);
    } catch (err) {
      if (isAuthError(err)) onAuth();
      throw err;
    }
  };

  async function load() {
    if (loading) return;
    loading = true;
    try {
      const res = await call("GET", "settings/config");
      if (res.status === 200) {
        view = res.body;
        render();
      }
    } catch {
      $("settings-summary").textContent = "Couldn't load the settings. Try again in a moment.";
    } finally {
      loading = false;
    }
  }

  function label(path) {
    return labels.get(path) ?? path;
  }

  // --- drawing ----------------------------------------------------------------------

  function render() {
    labels.clear();
    for (const sec of view.sections) {
      for (const f of sec.fields ?? []) labels.set(f.path, f.label);
      for (const r of sec.rooms ?? []) for (const f of r.fields) labels.set(f.path, `${r.name} ${f.label.toLowerCase()}`);
    }
    const saved = view.saved.length;
    $("settings-summary").textContent = saved
      ? `${plural(saved, "setting is", "settings are")} set here, over the house file.`
      : "Every setting comes from the house file or its default.";
    $("settings-where").textContent = view.saved_at
      ? `Changes are saved to ${view.saved_at}. The house file isn't changed.`
      : "In the demo, changes are not saved to a file and end when the demo does.";

    const restart = $("settings-restart");
    restart.hidden = !view.pending_restart.length;
    $("settings-restart-text").textContent = restartText(view, label);

    const problems = $("settings-problems");
    problems.hidden = !view.problems.length;
    $("settings-problems-text").textContent = view.problems.length
      ? `The settings saved here weren't used at the last start, so the house file's apply. ${view.problems.map((p) => `${p.path ? `${label(p.path)}: ` : ""}${p.message}`).join(" ")} Change or reset them below.`
      : "";

    renderAll(saved);

    const toc = $("settings-toc");
    toc.replaceChildren(...view.sections.map((sec) => el("li", {}, el("a", { href: `#settings/${sec.id}`, text: sec.title }))));
    const list = $("settings-sections");
    list.replaceChildren(...view.sections.map(section));
    if (pendingFocus) {
      const node = document.getElementById(pendingFocus);
      pendingFocus = null;
      node?.focus();
    }
  }

  // "Use the house file for every setting", with an inline confirmation.
  function renderAll(saved) {
    const box = $("settings-all");
    box.hidden = !saved;
    box.replaceChildren();
    if (!saved) return;
    if (!allConfirm) {
      const b = el("button", { type: "button", class: "btn", id: "settings-all-btn", text: "Use the house file for every setting" });
      b.addEventListener("click", () => {
        allConfirm = true;
        pendingFocus = "settings-all-go";
        render();
      });
      box.append(b);
      return;
    }
    const go = el("button", { type: "button", class: "btn btn-primary", id: "settings-all-go", text: "Use the house file" });
    const keep = el("button", { type: "button", class: "link", text: "Keep them" });
    go.addEventListener("click", () => revert(null, "all", go));
    keep.addEventListener("click", () => {
      allConfirm = false;
      pendingFocus = "settings-all-btn";
      render();
    });
    box.append(
      el("p", { text: `The ${plural(saved, "setting", "settings")} set here go back to the house file's values.` }),
      el("div", { class: "st-actions" }, go, keep),
    );
  }

  function section(sec) {
    const node = el("section", { class: "st-sec", id: `s-${sec.id}`, "aria-labelledby": `s-${sec.id}-h` });
    const h = el("h3", { class: "section-h", id: `s-${sec.id}-h`, tabindex: "-1", text: sec.title });
    node.append(h);
    const help = el("p", { class: "help-line st-help", text: `${sec.help} ` });
    if (sec.guide) help.append(el("a", { class: "help-link", href: `#guide/${sec.guide}`, text: `About ${sec.title.toLowerCase()}` }));
    node.append(help);
    if (sec.link) {
      node.append(linked(sec));
    } else if (sec.per_room) {
      for (const room of sec.rooms) node.append(group(`rooms.${room.id}`, room.name, room.fields, true));
    } else {
      node.append(group(sec.id, sec.title, sec.fields, false));
    }
    return node;
  }

  function linked(sec) {
    const plate = el("div", { class: "card st-plate st-linked" });
    if (sec.link === "household") {
      const b = el("button", { type: "button", class: "btn btn-primary", text: "Open the household setup" });
      b.addEventListener("click", (e) => onOpenSetup(e));
      plate.append(b);
    } else if (sec.link === "schedules") {
      const b = el("button", { type: "button", class: "btn", text: "Show the schedules" });
      b.addEventListener("click", () => onShowSchedules());
      plate.append(b);
    }
    return plate;
  }

  // One form: a section's settings, or one room's. Saved with its own button.
  function group(key, title, fields, room) {
    const id = domId(key);
    const setHere = fields.filter((f) => f.source === "app").length;
    const wrap = room
      ? el("details", { class: "card st-plate st-room", id })
      : el("div", { class: "card st-plate", id });
    if (room) {
      const summary = el("summary", {}, el("span", { class: "st-room-name", text: title }));
      if (setHere) summary.append(el("span", { class: "badge", "data-kind": "set", text: `${setHere} set here` }));
      if (fields.some((f) => f.pending_restart)) summary.append(el("span", { class: "badge", "data-kind": "restart", text: "Restart to use" }));
      wrap.append(summary);
      wrap.open = openRooms.has(key) || notes.has(key);
      wrap.addEventListener("toggle", () => {
        if (wrap.open) openRooms.add(key);
        else openRooms.delete(key);
      });
    }
    const form = el("form", { class: "st-form", novalidate: true, "aria-label": room ? title : `${title} settings` });
    const controls = new Map();
    const footer = el("div", { class: "st-foot" });
    const save = el("button", { type: "submit", class: "btn btn-primary", id: `${id}-save`, text: "Save changes", hidden: true });
    const cancel = el("button", { type: "button", class: "link", text: "Cancel changes", hidden: true });
    const status = el("p", { class: "st-status", id: `${id}-status`, role: "status", tabindex: "-1" });
    const confirmBox = el("div", { class: "st-confirm", hidden: true });

    const dirty = () => fields.filter((f) => {
      const c = controls.get(f.path);
      if (!c) return false;
      const v = c.get();
      return f.secret ? v !== undefined : !same(v, current(f));
    });
    const changed = () => {
      const n = dirty().length;
      save.hidden = !n;
      save.disabled = false;
      cancel.hidden = !n;
      save.textContent = n > 1 ? `Save ${n} changes` : "Save changes";
      confirmBox.hidden = true;
    };

    for (const f of fields) form.append(row(f, controls, changed));

    cancel.addEventListener("click", () => {
      notes.delete(key);
      pendingFocus = `${id}-status`;
      render();
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const list = dirty();
      if (!list.length) return;
      const values = Object.fromEntries(list.map((f) => [f.path, controls.get(f.path).get()]));
      const hardware = list.filter((f) => f.hardware && !f.secret);
      // Name each change with its new value: "Dry run, Off".
      const what = hardware.map((f) => `${label(f.path)}, ${valueText(f, values[f.path])}`);
      if (hardware.length) askConfirm(confirmBox, what, () => send(key, values, true, save, form), save, true);
      else send(key, values, false, save, form);
    });

    const revertAll = el("button", { type: "button", class: "link", text: room ? `Use the house file for ${title}` : "Use the house file for this section", hidden: !setHere });
    revertAll.addEventListener("click", () => revert(key, key, revertAll, confirmBox));

    const note = notes.get(key);
    if (note && note.until > Date.now()) {
      status.textContent = note.text;
      status.dataset.kind = note.kind ?? "";
    }
    footer.append(el("div", { class: "st-actions" }, save, cancel, revertAll), confirmBox, status);
    form.append(footer);
    wrap.append(form);
    return wrap;
  }

  function row(f, controls, changed) {
    const id = domId(f.path);
    const node = el("div", { class: "st-field", "data-source": f.source });
    const head = el("div", { class: "st-head" });
    const lab = f.kind === "bool" || f.kind === "use"
      ? el("span", { class: "st-label", id: `${id}-label`, text: f.label })
      : el("label", { class: "st-label", for: id, text: f.label });
    head.append(lab, el("span", { class: "st-src", "data-source": f.source, text: sourceText(f) }));
    if (f.pending_restart) head.append(el("span", { class: "tag", text: "Restart to use" }));
    node.append(head);
    const helpId = `${id}-help`;
    const errId = `${id}-err`;
    node.append(el("p", { class: "field-help", id: helpId, text: helpText(f) }));
    const body = el("div", { class: "st-control" });
    if (f.locked) {
      body.append(el("p", { class: "st-fixed", text: `${valueText(f, f.value)}. ${f.locked}` }));
    } else if (!f.editable) {
      body.append(el("p", { class: "st-fixed" }, el("code", { text: valueText(f, f.value) }), document.createTextNode(" Only the house file sets this.")));
    } else {
      const c = control(f, id, `${helpId} ${errId}`, changed);
      if (f.kind === "bool" || f.kind === "use") c.node.setAttribute("aria-labelledby", `${id}-label`);
      controls.set(f.path, c);
      body.append(c.node);
    }
    node.append(body);
    if (f.source === "app" && !f.locked) {
      const was = f.secret ? null : f.house_file_set ? `House file: ${valueText(f, f.house_file_value)}.` : null;
      const back = el("button", { type: "button", class: "link", id: `${id}-revert`, text: revertText(f) });
      back.addEventListener("click", () => revert(f.path, groupKey(f.path), back));
      node.append(el("p", { class: "st-file" }, was ? document.createTextNode(`${was} `) : null, back));
    }
    node.append(el("p", { class: "field-error", id: errId, hidden: true }));
    return node;
  }

  const groupKey = (path) => {
    const p = path.split(".");
    if (p[0] === "rooms" && p.length === 3) return `rooms.${p[1]}`;
    const sec = view.sections.find((s) => (s.fields ?? []).some((f) => f.path === path));
    return sec ? sec.id : path;
  };

  // The in-place question before a change that can write to the boiler or valves.
  function askConfirm(box, items, onYes, returnTo, labelled = false) {
    const paths = labelled ? items : items.map(label);
    box.replaceChildren();
    box.hidden = false;
    const go = el("button", { type: "button", class: "btn btn-primary", text: "Save and allow it" });
    const no = el("button", { type: "button", class: "link", text: "Cancel" });
    go.addEventListener("click", () => { box.hidden = true; onYes(); });
    no.addEventListener("click", () => { box.hidden = true; returnTo?.focus(); });
    box.append(
      el("p", { class: "st-confirm-text", text: `This lets Radiate write to the boiler or the valves: ${names(paths)}. Check the wiring and the valves before you go on.` }),
      el("div", { class: "st-actions" }, go, no),
    );
    go.focus();
  }

  function showErrors(form, key, errors, message) {
    for (const p of form.querySelectorAll(".field-error")) { p.hidden = true; p.textContent = ""; }
    for (const i of form.querySelectorAll("[aria-invalid]")) i.removeAttribute("aria-invalid");
    const here = [];
    const elsewhere = [];
    for (const e of errors ?? []) {
      const p = form.querySelector(`#${CSS.escape(domId(e.path))}-err`);
      if (p) {
        p.textContent = e.message;
        p.hidden = false;
        form.querySelector(`#${CSS.escape(domId(e.path))}`)?.setAttribute("aria-invalid", "true");
        here.push(e);
      } else {
        elsewhere.push(e);
      }
    }
    const status = form.querySelector(".st-status");
    const more = elsewhere.map((e) => `${e.path ? `${label(e.path)}: ` : ""}${e.message}`).join(" ");
    status.textContent = `${message ?? "Not saved."}${more ? ` ${more}` : ""}`;
    status.dataset.kind = "error";
    const first = here[0] ? form.querySelector(`#${CSS.escape(domId(here[0].path))}`) : null;
    if (first && first.tagName !== "DIV") first.focus();
    else status.focus();
  }

  async function send(key, values, confirm, button, form) {
    button.disabled = true;
    try {
      const res = await call("PUT", "settings/config", confirm ? { values, confirm: true } : { values });
      if (res.status === 409) {
        const box = form.querySelector(".st-confirm");
        askConfirm(box, res.body.confirm ?? [], () => send(key, values, true, button, form), button);
        button.disabled = false;
        return;
      }
      if (res.status !== 200) {
        const body = typeof res.body === "object" && res.body ? res.body : { message: String(res.body) };
        showErrors(form, key, body.errors, body.message);
        button.disabled = false;
        return;
      }
      done(key, res.body, savedText(res.body.applied ?? [], res.body.restart ?? []));
    } catch {
      const status = form.querySelector(".st-status");
      status.textContent = "Not saved. Check the connection and try again.";
      status.dataset.kind = "error";
      button.disabled = false;
    }
  }

  async function revert(target, key, button, box) {
    const path = target == null ? "settings/config" : `settings/config/${encodeURIComponent(target)}`;
    const go = async (confirm) => {
      button.disabled = true;
      try {
        const res = await call("DELETE", path, confirm ? { confirm: true } : undefined);
        if (res.status === 409) {
          const where = box ?? button.closest("form")?.querySelector(".st-confirm") ?? $("settings-all");
          button.disabled = false;
          askConfirm(where, res.body.confirm ?? [], () => go(true), button);
          return;
        }
        if (res.status !== 200) {
          const body = typeof res.body === "object" && res.body ? res.body : { message: String(res.body) };
          const form = button.closest("form");
          button.disabled = false;
          if (form) {
            showErrors(form, key, body.errors, body.message ?? "Not changed.");
          } else {
            const more = (body.errors ?? []).map((e) => `${label(e.path)}: ${e.message}`).join(" ");
            $("settings-all").append(el("p", { class: "st-status", "data-kind": "error", role: "alert", text: `${body.message ?? "Not changed."} ${more}` }));
          }
          return;
        }
        allConfirm = false;
        done(key, res.body, "Back to the house file.");
      } catch {
        button.disabled = false;
      }
    };
    go(false);
  }

  function done(key, body, text) {
    view = body;
    notes.set(key, { text, until: Date.now() + STATUS_MS });
    setTimeout(() => {
      const n = notes.get(key);
      if (n && n.until <= Date.now()) {
        notes.delete(key);
        const s = document.getElementById(`${domId(key)}-status`);
        if (s) s.textContent = "";
      }
    }, STATUS_MS + 50);
    pendingFocus = key === "all" ? "settings-h" : `${domId(key)}-status`;
    render();
  }

  return {
    async available() {
      try {
        const res = await call("GET", "settings/config");
        if (res.status !== 200) return false;
        view = res.body;
        return true;
      } catch {
        return false;
      }
    },
    show() {
      open = true;
      if (view) render();
      load();
    },
    hide() {
      open = false;
    },
    // A link to #settings/<section>: scroll to it and focus its heading.
    reveal(name) {
      const h = name ? document.getElementById(`s-${name}-h`) : null;
      if (!h) return false;
      h.focus({ preventScroll: true });
      h.scrollIntoView({ block: "start" });
      return true;
    },
    get open() {
      return open;
    },
  };
}
