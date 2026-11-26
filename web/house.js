// House view: the top of the House page.
//
//   - A line of readings: boiler, hot water, rooms heating, outside, the next change.
//   - An axonometric model of the house, every room coloured by its temperature,
//     floors stacked and pulled apart, with a floor picker to draw one floor larger.
//     Selecting a room opens its row in the room table (app.js), and the reverse.
//   - "Arrange rooms": a floor-plan editor. Drag a room to move it, drag its corner to
//     resize, 0.5 m snapping; arrow keys do the same. Saved with PUT layout; the
//     layout only draws the model and groups the table, control never reads it.
//   - Today: every scheduled room's day as a strip, with a now line.
//
// app.js owns the data and calls update(state, house), week(view), devices(n) and
// select(id). Everything here is drawn from those; the only request is the layout.

const SVG = "http://www.w3.org/2000/svg";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fmt = (t) => (t == null ? "–" : (Math.round(t * 10) / 10).toFixed(1));
const clock = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const OBSERVED = new Set(["passive", "unheated"]);
const SNAP = 0.5;
const PLAN_W = 14; // metres shown in the editor
const PLAN_D = 10;
const UPSTAIRS = /bed|bath|landing|en.?suite|nursery|study|loft|attic/i;

// ---------- colour ----------
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function tempRgb(t) {
  const stops = [12, 15, 17, 19, 22].map((s) => [s, hexRgb(cssVar(`--t${s}`) || "#888888")]);
  if (t == null) return hexRgb(cssVar("--t-none") || "#cccccc");
  const v = Math.max(12, Math.min(22, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (v <= b) return ca.map((x, k) => Math.round(x + (cb[k] - x) * ((v - a) / (b - a))));
  }
  return stops.at(-1)[1];
}
const rgb = (c, k = 1) => `rgb(${c.map((v) => Math.round(v * k)).join(",")})`;
// Ink or white on a temperature colour, whichever has the higher WCAG contrast.
const lin = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
const luminance = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
function inkOn(c) {
  const ink = hexRgb(cssVar("--house-ink") || "#1c2024");
  const l = luminance(c);
  const onInk = (l + 0.05) / (luminance(ink) + 0.05);
  const onWhite = 1.05 / (l + 0.05);
  return onInk >= onWhite ? rgb(ink) : "#ffffff";
}
// 16, 16.5: a temperature as people say it, without a trailing ".0".
const deg = (t) => `${Number.isInteger(t) ? t : (Math.round(t * 10) / 10).toFixed(1)}°`;

// A temperature's colour on the house scale, for the swatch in each table row.
export const tempColour = (t) => rgb(tempRgb(t));

// ---------- layout ----------
// A first guess until the owner arranges the house: bedrooms and bathrooms upstairs,
// the rest downstairs, packed three to a row at 3 by 3 m.
export function guessLayout(rooms) {
  const up = rooms.filter((r) => UPSTAIRS.test(r.name));
  const down = rooms.filter((r) => !UPSTAIRS.test(r.name));
  const floors = up.length && down.length ? ["Ground floor", "First floor"] : ["Ground floor"];
  const place = {};
  const pack = (list, floor) => list.forEach((r, i) => {
    place[r.id] = { floor, x: (i % 3) * 3, y: Math.floor(i / 3) * 3, w: 3, d: 3 };
  });
  if (floors.length === 2) { pack(down, 0); pack(up, 1); } else pack(rooms, 0);
  return { floors, rooms: place };
}

// ---------- axonometric drawing ----------
const S = 34;
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const SLAB = 0.34; // height of a room block, metres in model units
// Floors are pulled apart by enough that a floor never hides the one below it.
const liftFor = (extent) => Math.max(3.2, extent * SIN * 0.8);
const P = (x, y, z) => [(x - y) * COS * S, (x + y) * SIN * S - z * S];
const pts = (a) => a.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");

// `only`: draw that floor alone, at ground level, so it fills the space.
// `describe(r)`: a room's state in words, for its accessible name.
function isoMarkup(layout, rooms, { selected, interactive, only = null, describe = () => "" }) {
  let out = "";
  let under = ""; // floor outlines and labels, drawn first so rooms always sit on top
  const line = cssVar("--line-strong");
  let extent = 0;
  for (const [id, p] of Object.entries(layout.rooms)) if (rooms.has(id)) extent = Math.max(extent, p.x + p.w + p.y + p.d);
  const LIFT = only == null ? liftFor(extent) : 0;
  layout.floors.forEach((name, f) => {
    if (only != null && only !== f) return;
    const z = f * LIFT;
    const mine = Object.entries(layout.rooms).filter(([id, p]) => p.floor === f && rooms.has(id));
    const maxX = Math.max(3, ...mine.map(([, p]) => p.x + p.w));
    const maxY = Math.max(3, ...mine.map(([, p]) => p.y + p.d));
    under += `<polygon points="${pts([P(-0.2, -0.2, z), P(maxX + 0.2, -0.2, z), P(maxX + 0.2, maxY + 0.2, z), P(-0.2, maxY + 0.2, z)])}" fill="none" stroke="${line}" stroke-width="1.5"/>`;
    if (f > 0 && only == null) {
      for (const [x, y] of [[-0.2, -0.2], [maxX + 0.2, -0.2], [-0.2, maxY + 0.2]]) {
        const a = P(x, y, z);
        const b = P(x, y, z - LIFT + SLAB);
        under += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${line}" stroke-dasharray="2 4"/>`;
      }
    }
    const tag = P(-0.2, maxY + 0.2, z);
    under += `<text class="hm-ftag" x="${tag[0] - 8}" y="${tag[1] + 4}" text-anchor="end">${esc(name)}</text>`;
    // Back to front, so nearer rooms paint over further ones.
    mine.sort((a, b) => (a[1].x + a[1].y) - (b[1].x + b[1].y)).forEach(([id, p]) => {
      const r = rooms.get(id);
      const c = tempRgb(r.temperature);
      const g = 0.05;
      const x = p.x + g; const y = p.y + g; const w = p.w - 2 * g; const d = p.d - 2 * g;
      const top = z + SLAB;
      const T = [P(x, y, top), P(x + w, y, top), P(x + w, y + d, top), P(x, y + d, top)];
      const R = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, top), P(x + w, y, top)];
      const F = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, top), P(x, y + d, top)];
      const mid = P(x + w / 2, y + d / 2, top);
      const ink = inkOn(c);
      // A radiator bar along the front edge while the room takes heat.
      let rad = "";
      if (r.calling || r.topup || r.role === "passive") {
        const a = P(x + 0.25, y + d - 0.15, top);
        const b = P(x + Math.min(w - 0.25, 1.4), y + d - 0.15, top);
        rad = `<line class="hm-rad" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${ink}" stroke-width="3"/>`;
      }
      const state = describe(r);
      const label = `${r.name}, ${r.temperature == null ? "no reading" : `${fmt(r.temperature)} degrees`}${state ? `, ${state.toLowerCase()}` : ""}`;
      const attrs = interactive ? `tabindex="0" role="button" aria-pressed="${id === selected}"` : "";
      out += `<g class="hm-room" data-id="${esc(id)}" ${attrs} aria-label="${esc(label)}">
        <polygon points="${pts(R)}" fill="${rgb(c, 0.62)}"/><polygon points="${pts(F)}" fill="${rgb(c, 0.8)}"/>
        <polygon class="hm-top" points="${pts(T)}" fill="${rgb(c)}"/>${rad}
        <text class="hm-t" x="${mid[0]}" y="${mid[1]}" text-anchor="middle" fill="${ink}">${fmt(r.temperature)}</text>
        ${w >= 1.4 ? `<text class="hm-n" x="${mid[0]}" y="${mid[1] + 13}" text-anchor="middle" fill="${ink}">${esc(r.name)}</text>` : ""}</g>`;
    });
  });
  return under + out;
}

function fitView(svg) {
  requestAnimationFrame(() => {
    try {
      const bb = svg.getBBox();
      if (bb.width) svg.setAttribute("viewBox", `${bb.x - 10} ${bb.y - 10} ${bb.width + 20} ${bb.height + 20}`);
    } catch { /* not rendered yet */ }
  });
}

// ---------- the view ----------
// `arrangeLock()` says why the signed-in person can't arrange rooms ("Ask an admin",
// "Read only"), or "" when they can: the layout is an admin's (ADR-0006).
// `roomsEl` is the room table's section, which the live preview replaces while the
// editor is open. `onRoom(id)` is called when a room is picked in the model (null when
// it is picked again); `describe(r)` gives a room's state in words.
export function createHouse({
  modelEl, readingsEl, previewEl, roomsEl, planEl, transport, onRoom, onWeek, onLayout,
  describe = () => "", arrangeLock = () => "",
}) {
  let state = null;
  let houseInfo = null;
  let rooms = new Map();
  let layout = null; // saved, or guessed until saved
  let saved = false;
  let layoutGone = false; // older server without the layout route
  let editing = false;
  let edFloor = 0;
  let selected = null;
  let only = null; // the floor drawn on its own, or null for every floor
  let weekView = null;
  let deviceCount = 0;
  let drag = null;
  let saveTimer = null;
  let saveNote = "";

  async function loadLayout() {
    try {
      const res = await transport.call("GET", "layout");
      if (res.status === 200 && res.body?.layout) { layout = res.body.layout; saved = true; }
      else if (res.status === 404) layoutGone = true;
    } catch { /* keep the guess */ }
    if (only != null && only >= layout.floors.length) only = null;
    drawModel();
    onLayout?.();
  }

  function queueSave() {
    clearTimeout(saveTimer);
    saveNote = "Saving…";
    renderSaveNote();
    saveTimer = setTimeout(async () => {
      if (layoutGone) { saveNote = "This server can't keep a layout. Update Radiate to save it."; renderSaveNote(); return; }
      try {
        const res = await transport.call("PUT", "layout", layout);
        saved = res.status === 200;
        saveNote = saved ? "Saved." : `Not saved: ${typeof res.body === "string" ? res.body : "the server refused it"}.`;
      } catch {
        saveNote = "Not saved. Check the connection and move a room to try again.";
      }
      renderSaveNote();
    }, 500);
  }
  function renderSaveNote() {
    const el = modelEl.querySelector(".hm-save");
    if (el) el.textContent = saveNote;
  }

  // Rooms the house file has but the layout doesn't, and the reverse, are handled here
  // so a new room never vanishes: it waits in the tray.
  const placed = () => Object.keys(layout.rooms).filter((id) => rooms.has(id));
  const unplaced = () => [...rooms.keys()].filter((id) => !layout.rooms[id]);

  // ---------- the house ----------
  // Floors for the picker and the table, top floor first, as a house is read.
  function floorOrder() {
    return layout.floors.map((name, f) => ({ name, f })).reverse();
  }

  function drawFloors() {
    const group = modelEl.querySelector(".hm-floors-pick");
    const many = layout.floors.length > 1;
    group.hidden = !many;
    if (!many) { only = null; return; }
    const key = JSON.stringify([layout.floors, only]);
    if (group.dataset.key === key) return;
    group.dataset.key = key;
    const hadFocus = group.contains(document.activeElement);
    const all = layout.floors.length === 2 ? "Both floors" : "All floors";
    const options = [{ f: null, name: all }, ...floorOrder()];
    group.innerHTML = options.map((o) => {
      const on = o.f === only;
      return `<button type="button" role="radio" data-f="${o.f ?? ""}" aria-checked="${on}" tabindex="${on ? 0 : -1}">${esc(o.name)}</button>`;
    }).join("");
    if (hadFocus) group.querySelector('[aria-checked="true"]')?.focus();
  }

  function chooseFloor(button) {
    only = button.dataset.f === "" ? null : Number(button.dataset.f);
    drawModel();
  }

  function drawModel() {
    if (!layout || !rooms.size) return;
    if (editing) { drawEditor(); return; }
    if (!modelEl.querySelector(".hm-iso")) {
      modelEl.innerHTML = `
        <div class="hm-head">
          <h2 class="section-h" id="hm-model-h">House</h2>
          <div class="seg hm-floors-pick" role="radiogroup" aria-label="Floors shown" hidden></div>
        </div>
        <svg class="hm-iso" role="group" aria-labelledby="hm-model-h"></svg>
        <p class="hm-key"><span class="hm-scale" aria-hidden="true"><span>12°</span><span class="hm-ramp"></span><span>22°</span></span><span>Bar on a room: radiator on.</span> <a class="help-link" href="#guide/model">Reading the house</a></p>
        <p class="hm-guess" hidden>Rooms are placed by a guess from their names. Arrange them to match your house.</p>
        <div class="hm-arrange lock-row">
          <button type="button" class="btn" data-act="arrange" aria-describedby="hm-arrange-lock">Arrange rooms</button>
          <span class="lock-tag" id="hm-arrange-lock" hidden></span>
        </div>`;
      modelEl.querySelector("[data-act=arrange]").addEventListener("click", () => { editing = true; edFloor = 0; drawModel(); drawPreview(); });
      const svg = modelEl.querySelector(".hm-iso");
      svg.addEventListener("click", (e) => { const g = e.target.closest(".hm-room"); if (g) pick(g.dataset.id); });
      svg.addEventListener("keydown", (e) => {
        const g = e.target.closest(".hm-room");
        if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(g.dataset.id); }
      });
      // A radio group: one tab stop, arrow keys move and choose.
      const floors = modelEl.querySelector(".hm-floors-pick");
      floors.addEventListener("click", (e) => { const b = e.target.closest("[role=radio]"); if (b) chooseFloor(b); });
      floors.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        const list = [...floors.querySelectorAll("[role=radio]")];
        const i = list.indexOf(document.activeElement);
        if (!d || i < 0) return;
        e.preventDefault();
        chooseFloor(list[(i + d + list.length) % list.length]);
        floors.querySelector('[aria-checked="true"]')?.focus();
      });
    }
    drawFloors();
    modelEl.querySelector(".hm-ramp").style.background = `linear-gradient(90deg, ${[12, 15, 17, 19, 22].map((t) => rgb(tempRgb(t))).join(", ")})`;
    modelEl.querySelector(".hm-guess").hidden = saved;
    const why = arrangeLock();
    const arrange = modelEl.querySelector("[data-act=arrange]");
    arrange.disabled = Boolean(why);
    if (why) arrange.dataset.locked = "";
    else delete arrange.dataset.locked;
    const arrangeTag = modelEl.querySelector("#hm-arrange-lock");
    arrangeTag.hidden = !why;
    arrangeTag.textContent = why;
    const svg = modelEl.querySelector(".hm-iso");
    const focused = svg.contains(document.activeElement) ? document.activeElement.closest(".hm-room")?.dataset.id : null;
    svg.innerHTML = isoMarkup(layout, rooms, { selected, interactive: true, only, describe });
    if (focused) svg.querySelector(`.hm-room[data-id="${CSS.escape(focused)}"]`)?.focus();
    fitView(svg);
  }

  function markSelected() {
    for (const g of modelEl.querySelectorAll(".hm-room")) g.setAttribute("aria-pressed", String(g.dataset.id === selected));
  }

  function pick(id) {
    selected = selected === id ? null : id;
    // A room on a floor not drawn: show every floor, so the picked room is in view.
    if (selected && only != null && layout.rooms[selected]?.floor !== only) { only = null; drawModel(); }
    markSelected();
    onRoom?.(selected);
  }

  // Groups for the room table: each floor, top first, then rooms not on the plan.
  function groups() {
    if (!layout) return [];
    const out = floorOrder().map(({ name, f }) => ({
      name, ids: [...rooms.keys()].filter((id) => layout.rooms[id]?.floor === f),
    }));
    const loose = unplaced();
    if (loose.length) out.push({ name: "Not on the plan", ids: loose });
    return out.filter((g) => g.ids.length);
  }

  // ---------- editor ----------
  const U = 40; // px per metre in the editor's own units
  function drawEditor() {
    const mine = placed().filter((id) => layout.rooms[id].floor === edFloor);
    let grid = "";
    for (let i = 0; i <= PLAN_W / SNAP; i++) grid += `<line x1="${i * U * SNAP}" y1="0" x2="${i * U * SNAP}" y2="${PLAN_D * U}" class="${i % 2 ? "hm-g2" : "hm-g1"}"/>`;
    for (let j = 0; j <= PLAN_D / SNAP; j++) grid += `<line x1="0" y1="${j * U * SNAP}" x2="${PLAN_W * U}" y2="${j * U * SNAP}" class="${j % 2 ? "hm-g2" : "hm-g1"}"/>`;
    const blocks = mine.map((id) => {
      const p = layout.rooms[id];
      const r = rooms.get(id);
      const c = tempRgb(r.temperature);
      const ink = inkOn(c);
      return `<g class="hm-r2${id === selected ? " sel" : ""}" data-id="${esc(id)}" transform="translate(${p.x * U},${p.y * U})" tabindex="0" role="button"
          aria-label="${esc(r.name)}, ${p.w} by ${p.d} metres. Arrow keys move it, Shift and arrow keys resize it.">
        <rect class="hm-body" width="${p.w * U}" height="${p.d * U}" fill="${rgb(c)}"/>
        <text class="hm-r2n" x="7" y="16" fill="${ink}">${esc(r.name)}</text>
        <text class="hm-r2s" x="7" y="${p.d * U - 7}" fill="${ink}">${p.w} × ${p.d} m</text>
        <rect class="hm-handle" x="${p.w * U - 14}" y="${p.d * U - 14}" width="14" height="14"/></g>`;
    }).join("");
    const waiting = unplaced();
    const sel = selected && layout.rooms[selected]?.floor === edFloor ? rooms.get(selected) : null;
    modelEl.innerHTML = `
      <div class="hm-head">
        <h2 class="section-h" id="hm-model-h" tabindex="-1">Arrange rooms</h2>
        <div class="hm-head-right"><button type="button" class="btn" data-act="reset">Start again</button><button type="button" class="btn btn-primary" data-act="done">Done</button></div>
      </div>
      <div class="hm-floors" role="group" aria-label="Floor">
        ${layout.floors.map((n, i) => `<button type="button" data-floor="${i}" aria-pressed="${i === edFloor}">${esc(n)}</button>`).join("")}
        ${layout.floors.length < 6 ? `<button type="button" data-act="add-floor" aria-pressed="false">Add floor</button>` : ""}
      </div>
      <div class="hm-floor-name">
        <label>Floor name <input type="text" maxlength="40" value="${esc(layout.floors[edFloor])}" data-act="rename"></label>
        ${layout.floors.length > 1 && !mine.length ? `<button type="button" class="link" data-act="remove-floor">Remove this floor</button>` : ""}
      </div>
      <svg class="hm-plan2d" viewBox="0 0 ${PLAN_W * U} ${PLAN_D * U}" aria-label="Plan of ${esc(layout.floors[edFloor])}">${grid}${blocks}</svg>
      <div class="hm-tray">
        <span class="hm-muted">${waiting.length ? "Not placed yet:" : "Every room is placed."}</span>
        ${waiting.map((id) => `<button type="button" class="hm-chip" data-add="${esc(id)}">Place ${esc(rooms.get(id).name)}</button>`).join("")}
        ${sel ? `<button type="button" class="hm-chip" data-act="unplace">Take ${esc(sel.name)} off the plan</button>` : ""}
      </div>
      <p class="hm-hint">Drag a room to move it and its corner to resize it, or select it and use the arrow keys (Shift to resize). Rooms snap to half a metre. Rough sizes are enough.</p>
      <p class="hm-save hm-muted" role="status">${esc(saveNote)}</p>`;
    wireEditor();
  }

  function wireEditor() {
    const el = modelEl;
    el.querySelector("[data-act=done]").addEventListener("click", () => {
      editing = false;
      modelEl.innerHTML = "";
      drawModel();
      drawPreview(); onLayout?.();
      modelEl.querySelector("[data-act=arrange]")?.focus();
    });
    el.querySelector("[data-act=reset]").addEventListener("click", () => {
      layout = guessLayout([...rooms.values()]);
      edFloor = 0;
      queueSave();
      drawEditor();
      drawPreview(); onLayout?.();
    });
    for (const b of el.querySelectorAll("[data-floor]")) b.addEventListener("click", () => { edFloor = Number(b.dataset.floor); drawEditor(); });
    el.querySelector("[data-act=add-floor]")?.addEventListener("click", () => {
      layout.floors.push(layout.floors.length === 1 ? "First floor" : layout.floors.length === 2 ? "Second floor" : `Floor ${layout.floors.length + 1}`);
      edFloor = layout.floors.length - 1;
      queueSave();
      drawEditor();
      drawPreview(); onLayout?.();
    });
    el.querySelector("[data-act=remove-floor]")?.addEventListener("click", () => {
      layout.floors.splice(edFloor, 1);
      for (const p of Object.values(layout.rooms)) if (p.floor > edFloor) p.floor -= 1;
      edFloor = Math.max(0, edFloor - 1);
      queueSave();
      drawEditor();
      drawPreview(); onLayout?.();
    });
    el.querySelector("[data-act=rename]").addEventListener("change", (e) => {
      const v = e.target.value.trim();
      if (v) { layout.floors[edFloor] = v; queueSave(); drawEditor(); drawPreview(); onLayout?.(); }
    });
    for (const b of el.querySelectorAll("[data-add]")) b.addEventListener("click", () => {
      const id = b.dataset.add;
      layout.rooms[id] = { floor: edFloor, ...freeSpot(edFloor) };
      selected = id;
      queueSave();
      drawEditor();
      drawPreview(); onLayout?.();
      modelEl.querySelector(`.hm-r2[data-id="${CSS.escape(id)}"]`)?.focus();
    });
    el.querySelector("[data-act=unplace]")?.addEventListener("click", () => {
      delete layout.rooms[selected];
      queueSave();
      drawEditor();
      drawPreview(); onLayout?.();
    });

    const svg = el.querySelector(".hm-plan2d");
    const at = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };
    const snap = (v) => Math.round(v / SNAP) * SNAP;
    svg.addEventListener("pointerdown", (e) => {
      const g = e.target.closest(".hm-r2");
      if (!g || drag) return;
      const id = g.dataset.id;
      const p = layout.rooms[id];
      const m = at(e);
      selected = id;
      drag = { id, pointer: e.pointerId, resize: e.target.classList.contains("hm-handle"), ox: m.x / U - p.x, oy: m.y / U - p.y, moved: false };
      svg.setPointerCapture(e.pointerId);
      for (const x of svg.querySelectorAll(".hm-r2")) x.classList.toggle("sel", x.dataset.id === id);
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.pointer) return;
      const p = layout.rooms[drag.id];
      const m = at(e);
      if (drag.resize) {
        p.w = Math.min(PLAN_W - p.x, Math.max(1, snap(m.x / U - p.x)));
        p.d = Math.min(PLAN_D - p.y, Math.max(1, snap(m.y / U - p.y)));
      } else {
        p.x = Math.max(0, Math.min(PLAN_W - p.w, snap(m.x / U - drag.ox)));
        p.y = Math.max(0, Math.min(PLAN_D - p.d, snap(m.y / U - drag.oy)));
      }
      drag.moved = true;
      moveBlock(svg, drag.id);
      drawPreview();
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.pointer) return;
      const { id, moved } = drag;
      drag = null;
      if (moved) queueSave();
      drawEditor();
      modelEl.querySelector(`.hm-r2[data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("keydown", (e) => {
      const g = e.target.closest(".hm-r2");
      if (!g) return;
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selected = g.dataset.id;
        drawEditor();
        modelEl.querySelector(`.hm-r2[data-id="${CSS.escape(selected)}"]`)?.focus();
        return;
      }
      if (!step) return;
      e.preventDefault();
      const p = layout.rooms[g.dataset.id];
      if (e.shiftKey) {
        p.w = Math.min(PLAN_W - p.x, Math.max(1, p.w + step[0] * SNAP));
        p.d = Math.min(PLAN_D - p.y, Math.max(1, p.d + step[1] * SNAP));
      } else {
        p.x = Math.max(0, Math.min(PLAN_W - p.w, p.x + step[0] * SNAP));
        p.y = Math.max(0, Math.min(PLAN_D - p.d, p.y + step[1] * SNAP));
      }
      selected = g.dataset.id;
      moveBlock(svg, g.dataset.id);
      g.setAttribute("aria-label", `${rooms.get(g.dataset.id).name}, ${p.w} by ${p.d} metres, at ${p.x}, ${p.y}.`);
      drawPreview();
      queueSave();
    });
  }

  function moveBlock(svg, id) {
    const p = layout.rooms[id];
    const g = svg.querySelector(`.hm-r2[data-id="${CSS.escape(id)}"]`);
    if (!g) return;
    g.setAttribute("transform", `translate(${p.x * U},${p.y * U})`);
    const body = g.querySelector(".hm-body");
    body.setAttribute("width", p.w * U);
    body.setAttribute("height", p.d * U);
    const h = g.querySelector(".hm-handle");
    h.setAttribute("x", p.w * U - 14);
    h.setAttribute("y", p.d * U - 14);
    const size = g.querySelector(".hm-r2s");
    size.setAttribute("y", p.d * U - 7);
    size.textContent = `${p.w} × ${p.d} m`;
  }

  // The first 2 by 2 m spot on the floor that no room covers.
  function freeSpot(floor) {
    const taken = placed().map((id) => layout.rooms[id]).filter((p) => p.floor === floor);
    for (let y = 0; y <= PLAN_D - 2; y += SNAP) {
      for (let x = 0; x <= PLAN_W - 2; x += SNAP) {
        if (!taken.some((p) => x < p.x + p.w && x + 2 > p.x && y < p.y + p.d && y + 2 > p.y)) return { x, y, w: 2, d: 2 };
      }
    }
    return { x: 0, y: 0, w: 2, d: 2 };
  }

  // ---------- live preview while arranging ----------
  // While the editor is open the room table steps aside for the model as it will look.
  function drawPreview() {
    previewEl.hidden = !editing;
    roomsEl.hidden = editing;
    if (!editing) return;
    if (!previewEl.querySelector(".hm-preview")) {
      previewEl.innerHTML = `<h2 class="section-h">How it will look</h2>
        <svg class="hm-iso hm-preview" role="img" aria-label="Preview of the house"></svg>
        <p class="hm-note"></p>`;
    }
    previewEl.querySelector(".hm-note").textContent = `${plural(layout.floors.length, "floor", "floors")}, ${placed().length} of ${plural(rooms.size, "room", "rooms")} placed. The layout only draws the house and groups the rooms. It never changes how they are heated.`;
    const svg = previewEl.querySelector(".hm-preview");
    svg.innerHTML = isoMarkup(layout, rooms, { selected, interactive: false });
    fitView(svg);
  }

  // ---------- readings ----------
  // One line of facts, label and value, in place of a row of tiles.
  let readingsKey = "";
  function drawReadings() {
    if (!state) return;
    const all = [...rooms.values()];
    const controlled = all.filter((r) => !OBSERVED.has(r.role));
    const calling = controlled.filter((r) => r.calling);
    const tel = state.telemetry ?? {};
    const linked = tel.simulated || tel.boiler_linked !== false;
    const b = state.boiler;
    const items = [];
    if (!linked) items.push(["Boiler", "Not linked", ""]);
    else if (b.state === "firing") items.push(["Boiler", `On, ${Math.round(b.burn_elapsed_s / 60)} min`, "heat"]);
    else items.push(["Boiler", { idle: "Off", lead: "Opening valves", rest: "Resting" }[b.state] ?? "–", ""]);
    if (state.store) items.push(["Hot water", state.store.relay ? (state.store.boost ? "On, boosted" : "On") : "Off", ""]);
    if (state.mode === "off") items.push(["Heating", "Off", ""]);
    else if (state.mode === "frost") items.push(["Heating", "Frost only", ""]);
    else items.push(["Rooms heating", `${calling.length} of ${controlled.length}`, ""]);
    if (state.quiet?.active) items.push(["Quiet hours", `until ${state.quiet.until}`, ""]);
    if (state.outdoor != null) items.push(["Outside", `${fmt(state.outdoor)}°`, ""]);
    const next = nextChange();
    if (next) items.push(["Next change", next, ""]);
    if (deviceCount) items.push(["Devices", `${deviceCount} ${deviceCount === 1 ? "needs" : "need"} attention`, "attn", "#devices"]);
    // Rewritten only when the words change, so focus on the Devices link survives a tick.
    const html = items.map(([k, v, cls, href]) => `<div${cls ? ` class="${cls}"` : ""}><dt>${esc(k)}</dt><dd>${href ? `<a href="${href}">${esc(v)}</a>` : esc(v)}</dd></div>`).join("");
    if (readingsKey === html) return;
    readingsKey = html;
    readingsEl.innerHTML = html;
  }

  // The next time a room's temperature changes: "08:30, Bedroom 1 and Bedroom 2 to 16°".
  function nextChange() {
    let soonest = null;
    for (const r of rooms.values()) {
      if (OBSERVED.has(r.role) || r.next_setpoint == null || r.next_in_min == null) continue;
      if (soonest == null || r.next_in_min < soonest) soonest = r.next_in_min;
    }
    if (soonest == null) return "";
    const byTemp = new Map();
    for (const r of rooms.values()) {
      if (OBSERVED.has(r.role) || r.next_in_min !== soonest) continue;
      if (!byTemp.has(r.next_setpoint)) byTemp.set(r.next_setpoint, []);
      byTemp.get(r.next_setpoint).push(r.name);
    }
    const words = [...byTemp.entries()].map(([t, names]) => {
      const who = names.length < 2 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
      return `${who} to ${deg(t)}`;
    }).join(", ");
    return `${clock((state.minute_of_day + soonest) % 1440)}, ${words}`;
  }

  // ---------- today's plan ----------
  function drawPlan() {
    if (!weekView?.rooms?.length || !state) { planEl.hidden = true; return; }
    planEl.hidden = false;
    const day = weekView.now?.weekday ?? 0;
    const now = state.minute_of_day ?? weekView.now?.minute ?? 0;
    const rows = weekView.rooms.map((room) => {
      const tr = [...(room.days[day]?.transitions ?? [])].sort((a, c) => a.minute - c.minute);
      if (!tr.length) return "";
      if (tr[0].minute > 0) tr.unshift({ minute: 0, setpoint: tr.at(-1).setpoint });
      const segs = tr.map((t, i) => {
        const end = i + 1 < tr.length ? tr[i + 1].minute : 1440;
        if (end <= t.minute) return "";
        return `<span style="width:${((end - t.minute) / 1440) * 100}%;background:${rgb(tempRgb(t.setpoint))}" title="${fmt(t.setpoint)}° from ${clock(t.minute)}"></span>`;
      }).join("");
      const text = room.days[day]?.text ?? "";
      return `<span class="hm-pname">${esc(room.name)}</span><div class="hm-strip" role="img" aria-label="${esc(`${room.name} today: ${text}`)}">${segs}<i class="hm-now" style="left:${(now / 1440) * 100}%"></i></div>`;
    }).join("");
    // The heading, its links and the help line are made once, so focus on them survives
    // a redraw; only the strips change.
    if (!planEl.querySelector(".hm-tl")) {
      planEl.innerHTML = `<div class="hm-head"><h2 class="section-h">Today</h2><button type="button" class="link" data-act="week">Week schedules</button></div>
        <p class="hm-hint">Each room's day, coloured by the temperature it aims for. The upright line is now. <a class="help-link" href="#guide/schedules">Changing the weekly times</a></p>
        <div class="hm-tl"></div>`;
      planEl.querySelector("[data-act=week]").addEventListener("click", () => onWeek?.());
    }
    planEl.querySelector(".hm-tl").innerHTML = `${rows}<span></span><div class="hm-hrs" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>`;
  }

  // ---------- inputs from app.js ----------
  function update(s, house) {
    state = s;
    houseInfo = house ?? houseInfo;
    const next = new Map();
    for (const r of s.rooms) next.set(r.id, r);
    const firstTime = !rooms.size;
    rooms = next;
    if (!layout) layout = guessLayout(s.rooms);
    if (firstTime) loadLayout();
    if (!editing) drawModel();
    else drawPreview();
    drawReadings();
    drawPlan();
  }

  return {
    update,
    week(view) { weekView = view; drawPlan(); },
    devices(n) { deviceCount = n; drawReadings(); },
    redraw() { if (!editing && modelEl.querySelector(".hm-iso")) drawModel(); else if (editing) drawPreview(); drawPlan(); },
    // Select a room from the table, without calling onRoom back.
    select(id) {
      selected = id;
      if (selected && only != null && layout?.rooms[selected] && layout.rooms[selected].floor !== only) { only = null; drawModel(); }
      markSelected();
    },
    groups,
    get editing() { return editing; },
  };
}
