// House model view: the top of the House page.
//
//   - An axonometric model of the house, every room coloured by its temperature,
//     floors stacked and pulled apart. Selecting a room shows its line underneath.
//   - "Arrange rooms": a floor-plan editor. Drag a room to move it, drag its corner to
//     resize, 0.5 m snapping; arrow keys do the same. Saved with PUT layout; the
//     layout only draws the model, control never reads it.
//   - The house status plate: rooms calling, every room on one temperature scale,
//     the boiler, dry run, devices, learning, and what changes next.
//   - Today's plan: every scheduled room's day as a strip, with a now line.
//
// app.js owns the data and calls update(state, house), week(view) and devices(n).
// Everything here is drawn from those; the only request is the layout.

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
  if (t == null) return hexRgb(cssVar("--surface-2") || "#cccccc");
  const v = Math.max(12, Math.min(22, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (v <= b) return ca.map((x, k) => Math.round(x + (cb[k] - x) * ((v - a) / (b - a))));
  }
  return stops.at(-1)[1];
}
const rgb = (c, k = 1) => `rgb(${c.map((v) => Math.round(v * k)).join(",")})`;
const inkOn = (c) => ((0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.55 ? "#141c18" : "#ffffff");

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

function isoMarkup(layout, rooms, { selected, interactive }) {
  let out = "";
  let under = ""; // floor outlines and labels, drawn first so rooms always sit on top
  const line = cssVar("--line");
  let extent = 0;
  for (const [id, p] of Object.entries(layout.rooms)) if (rooms.has(id)) extent = Math.max(extent, p.x + p.w + p.y + p.d);
  const LIFT = liftFor(extent);
  layout.floors.forEach((name, f) => {
    const z = f * LIFT;
    const mine = Object.entries(layout.rooms).filter(([id, p]) => p.floor === f && rooms.has(id));
    const maxX = Math.max(3, ...mine.map(([, p]) => p.x + p.w));
    const maxY = Math.max(3, ...mine.map(([, p]) => p.y + p.d));
    under += `<polygon points="${pts([P(-0.2, -0.2, z), P(maxX + 0.2, -0.2, z), P(maxX + 0.2, maxY + 0.2, z), P(-0.2, maxY + 0.2, z)])}" fill="none" stroke="${line}" stroke-width="1.5"/>`;
    if (f > 0) {
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
      const label = `${r.name}, ${r.temperature == null ? "no reading" : `${fmt(r.temperature)} degrees`}${r.calling ? ", heating" : ""}`;
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
export function createHouse({ modelEl, statusEl, planEl, transport, onRoom, onWeek }) {
  let state = null;
  let houseInfo = null;
  let rooms = new Map();
  let layout = null; // saved, or guessed until saved
  let saved = false;
  let layoutGone = false; // older server without the layout route
  let editing = false;
  let edFloor = 0;
  let selected = null;
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
    drawModel();
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

  // ---------- model plate ----------
  function drawModel() {
    if (!layout || !rooms.size) return;
    if (editing) { drawEditor(); return; }
    if (!modelEl.querySelector(".hm-iso")) {
      modelEl.innerHTML = `
        <div class="hm-head">
          <h2 id="hm-model-h">Your house</h2>
          <div class="hm-head-right">
            <span class="hm-scale" aria-hidden="true"><span class="hm-lab">12°</span><span class="hm-ramp"></span><span class="hm-lab">22°</span></span>
            <button type="button" class="btn" data-act="arrange">Arrange rooms</button>
          </div>
        </div>
        <p class="hm-hint hm-guess" hidden>Rooms are placed by a guess from their names. Arrange them to match your house.</p>
        <svg class="hm-iso" role="group" aria-labelledby="hm-model-h"></svg>
        <div class="hm-pick" aria-live="polite"></div>`;
      modelEl.querySelector("[data-act=arrange]").addEventListener("click", () => { editing = true; edFloor = layout.floors.length > 1 ? 0 : 0; drawModel(); drawStatus(); });
      const svg = modelEl.querySelector(".hm-iso");
      svg.addEventListener("click", (e) => { const g = e.target.closest(".hm-room"); if (g) pick(g.dataset.id); });
      svg.addEventListener("keydown", (e) => {
        const g = e.target.closest(".hm-room");
        if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(g.dataset.id); }
      });
    }
    modelEl.querySelector(".hm-ramp").style.background = `linear-gradient(90deg, ${[12, 15, 17, 19, 22].map((t) => rgb(tempRgb(t))).join(", ")})`;
    modelEl.querySelector(".hm-guess").hidden = saved;
    const svg = modelEl.querySelector(".hm-iso");
    const focused = svg.contains(document.activeElement) ? document.activeElement.closest(".hm-room")?.dataset.id : null;
    svg.innerHTML = isoMarkup(layout, rooms, { selected, interactive: true });
    if (focused) svg.querySelector(`.hm-room[data-id="${CSS.escape(focused)}"]`)?.focus();
    fitView(svg);
    drawPick();
  }

  function pick(id) {
    selected = selected === id ? null : id;
    for (const g of modelEl.querySelectorAll(".hm-room")) g.setAttribute("aria-pressed", String(g.dataset.id === selected));
    drawPick();
  }

  function drawPick() {
    const el = modelEl.querySelector(".hm-pick");
    if (!el) return;
    // A redraw would drop focus from "Room controls"; the line catches up on the next tick.
    if (el.contains(document.activeElement) && el.dataset.id === String(selected)) return;
    el.dataset.id = String(selected);
    const r = selected && rooms.get(selected);
    if (!r) {
      el.innerHTML = `<span class="hm-muted">Select a room for its details.</span>`;
      return;
    }
    let what;
    if (r.role === "unheated") what = "No radiator. Temperature recorded, not controlled.";
    else if (r.role === "passive") what = "Manual valve, always open.";
    else if (r.calling && r.target != null) what = `Heating to ${fmt(r.target)}°${r.temperature != null ? `, ${fmt(Math.max(0, r.target - r.temperature))}° to go` : ""}.`;
    else if (r.target != null) what = `Holding ${fmt(r.target)}°.`;
    else what = "";
    const bits = [];
    if (r.humidity != null) bits.push(`Humidity ${Math.round(r.humidity)}%`);
    if (r.opening != null && !OBSERVED.has(r.role)) bits.push(`Valve open ${r.opening}%`);
    if (r.next_setpoint != null && r.next_in_min != null && state) bits.push(`${fmt(r.next_setpoint)}° at ${clock((state.minute_of_day + r.next_in_min) % 1440)}`);
    el.innerHTML = `<b>${esc(r.name)}</b><span class="hm-readout">${fmt(r.temperature)}°</span><span>${esc(what)}</span>${bits.map((b) => `<span class="hm-muted">${esc(b)}</span>`).join("")}<button type="button" class="link hm-open">Room controls</button>`;
    el.querySelector(".hm-open").addEventListener("click", () => onRoom?.(r.id));
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
        <h2 id="hm-model-h" tabindex="-1">Arrange rooms</h2>
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
      drawStatus();
      modelEl.querySelector("[data-act=arrange]")?.focus();
    });
    el.querySelector("[data-act=reset]").addEventListener("click", () => {
      layout = guessLayout([...rooms.values()]);
      edFloor = 0;
      queueSave();
      drawEditor();
      drawStatus();
    });
    for (const b of el.querySelectorAll("[data-floor]")) b.addEventListener("click", () => { edFloor = Number(b.dataset.floor); drawEditor(); });
    el.querySelector("[data-act=add-floor]")?.addEventListener("click", () => {
      layout.floors.push(layout.floors.length === 1 ? "First floor" : layout.floors.length === 2 ? "Second floor" : `Floor ${layout.floors.length + 1}`);
      edFloor = layout.floors.length - 1;
      queueSave();
      drawEditor();
      drawStatus();
    });
    el.querySelector("[data-act=remove-floor]")?.addEventListener("click", () => {
      layout.floors.splice(edFloor, 1);
      for (const p of Object.values(layout.rooms)) if (p.floor > edFloor) p.floor -= 1;
      edFloor = Math.max(0, edFloor - 1);
      queueSave();
      drawEditor();
      drawStatus();
    });
    el.querySelector("[data-act=rename]").addEventListener("change", (e) => {
      const v = e.target.value.trim();
      if (v) { layout.floors[edFloor] = v; queueSave(); drawEditor(); drawStatus(); }
    });
    for (const b of el.querySelectorAll("[data-add]")) b.addEventListener("click", () => {
      const id = b.dataset.add;
      layout.rooms[id] = { floor: edFloor, ...freeSpot(edFloor) };
      selected = id;
      queueSave();
      drawEditor();
      drawStatus();
      modelEl.querySelector(`.hm-r2[data-id="${CSS.escape(id)}"]`)?.focus();
    });
    el.querySelector("[data-act=unplace]")?.addEventListener("click", () => {
      delete layout.rooms[selected];
      queueSave();
      drawEditor();
      drawStatus();
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

  // ---------- status plate ----------
  function drawPreview() {
    const svg = statusEl.querySelector(".hm-preview");
    if (!svg) return;
    svg.innerHTML = isoMarkup(layout, rooms, { selected, interactive: false });
    fitView(svg);
  }

  function drawStatus() {
    if (!state) return;
    if (editing) {
      statusEl.innerHTML = `<h2>Live model</h2>
        <svg class="hm-iso hm-preview" role="img" aria-label="Preview of the house model"></svg>
        <p class="hm-hint">${plural(layout.floors.length, "floor", "floors")}, ${placed().length} of ${plural(rooms.size, "room", "rooms")} placed. Radiate uses the layout only to draw your house. It never changes how rooms are heated.</p>`;
      drawPreview();
      return;
    }
    const all = [...rooms.values()];
    const controlled = all.filter((r) => !OBSERVED.has(r.role));
    const calling = controlled.filter((r) => r.calling);
    const read = all.filter((r) => r.temperature != null);
    const tel = state.telemetry ?? {};
    const linked = tel.simulated || tel.boiler_linked !== false;
    const b = state.boiler;

    // The headline: how many rooms want heat, and what the boiler is doing about it.
    let line;
    if (state.mode === "off") line = "Heating is off.";
    else if (state.mode === "frost") line = "Frost protection only.";
    else if (!calling.length) line = "No room needs heat right now.";
    else if (!linked) line = `${calling.length === 1 ? "room wants" : "rooms want"} heat. The boiler switch isn't linked yet, so the boiler is run by its own timer.`;
    else if (b.state === "firing") line = `${calling.length === 1 ? "room is" : "rooms are"} heating. Burner on.`;
    else line = `${calling.length === 1 ? "room wants" : "rooms want"} heat.`;

    // Every room on one scale, with the target most heated rooms are aiming for.
    const targets = controlled.map((r) => r.target).filter((t) => t != null);
    const common = targets.length ? mode(targets) : null;
    const X = (t) => ((Math.max(12, Math.min(22, t)) - 12) / 10) * 100;
    const sorted = [...read].sort((a, c) => a.temperature - c.temperature);
    const ticks = read.map((r) => `<rect x="${X(r.temperature)}%" y="14" width="4" height="26" fill="${rgb(tempRgb(r.temperature))}" transform="translate(-2,0)"><title>${esc(r.name)} ${fmt(r.temperature)}°</title></rect>`).join("");
    const axis = [12, 14, 16, 18, 20, 22].map((t) => `<text class="hm-axis" x="${X(t)}%" y="58" text-anchor="middle">${t}</text>`).join("");
    const target = common != null ? `<rect x="${X(common)}%" y="6" width="2" height="40" class="hm-target" transform="translate(-1,0)"/>` : "";
    const spreadLabel = sorted.length
      ? `Coldest ${sorted[0].name} ${fmt(sorted[0].temperature)}°, warmest ${sorted.at(-1).name} ${fmt(sorted.at(-1).temperature)}°.${common != null ? ` Most heated rooms aim for ${fmt(common)}°.` : ""}`
      : "No readings yet.";

    // Four cells.
    const boilerCell = !linked
      ? cell("Boiler", "Not linked", "Radiate can't switch it until the relay is set up.", false, "text")
      : cell("Boiler", { idle: "Idle", lead: "Opening valves", firing: "Firing", rest: "Resting" }[b.state] ?? "–", b.state === "firing" ? `${Math.round(b.burn_elapsed_s / 60)} min so far` : `${plural(b.starts_last_hour, "start", "starts")} in the last hour`, false, "text");
    const control = tel.dry_run
      ? cell("Dry run", String(tel.intended_writes ?? 0), "valve and boiler changes held back", false)
      : cell("Mode", { auto: "Auto", frost: "Frost", off: "Off" }[state.mode] ?? state.mode, state.settings?.demand_mode ? `${cap(state.settings.demand_mode)} demand` : "", false, "text");
    const devices = cell("Devices", String(deviceCount), deviceCount ? (deviceCount === 1 ? "needs attention" : "need attention") : "all reporting well", deviceCount > 0);
    const models = controlled.map((r) => r.model?.confidence).filter((c) => c != null);
    const conf = models.length ? Math.round((models.reduce((a, c) => a + c, 0) / models.length) * 100) : null;
    const learning = cell("Learning", conf == null ? "–" : `${conf}%`, conf == null ? "waiting for the first burns" : conf < 50 ? "how sure Radiate is of each room, on average" : "average confidence in each room", false);

    statusEl.innerHTML = `
      <h2>The house now</h2>
      <div class="hm-hero">
        <div class="hm-big">${calling.length}<small>/${controlled.length}</small></div>
        <p>${esc(line)}</p>
      </div>
      <div class="hm-spread">
        <span class="hm-muted">Where every room sits</span>
        <svg role="img" aria-label="${esc(spreadLabel)}"><line x1="0" y1="27" x2="100%" y2="27" class="hm-axisline"/>${target}${ticks}${axis}</svg>
        <span class="hm-muted">${esc(spreadLabel)}</span>
      </div>
      <div class="hm-cells">${boilerCell}${control}${devices}${learning}</div>
      ${comingUp()}`;
  }

  function cell(label, value, note, attention, kind = "readout") {
    const v = kind === "readout" ? `<span class="hm-readout">${esc(value)}</span>` : `<b>${esc(value)}</b>`;
    return `<div class="hm-cell${attention ? " need" : ""}"><span class="hm-muted">${esc(label)}</span>${v}<p>${esc(note)}</p></div>`;
  }

  // The next three moments a room's setpoint changes, rooms at the same time together.
  function comingUp() {
    const at = new Map();
    for (const r of rooms.values()) {
      if (OBSERVED.has(r.role) || r.next_setpoint == null || r.next_in_min == null) continue;
      const key = r.next_in_min;
      if (!at.has(key)) at.set(key, []);
      at.get(key).push(r);
    }
    const next = [...at.entries()].sort((a, c) => a[0] - c[0]).slice(0, 3);
    if (!next.length) return "";
    const rows = next.map(([inMin, list]) => {
      const byTemp = new Map();
      for (const r of list) {
        if (!byTemp.has(r.next_setpoint)) byTemp.set(r.next_setpoint, []);
        byTemp.get(r.next_setpoint).push(r.name);
      }
      const words = [...byTemp.entries()].map(([t, names]) => {
        const who = names.length < 2 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
        const was = list.find((r) => r.next_setpoint === t)?.target;
        const verb = was != null && t < was ? "cools to" : names.length > 1 ? "warm to" : "warms to";
        return `${who} ${names.length > 1 && verb === "cools to" ? "cool to" : verb} ${fmt(t)}°`;
      }).join(". ");
      return `<div><time>${clock((state.minute_of_day + inMin) % 1440)}</time><span>${esc(words)}.</span></div>`;
    }).join("");
    return `<div class="hm-next"><span class="hm-muted">Coming up</span>${rows}</div>`;
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
    planEl.innerHTML = `<div class="hm-head"><h2>Today's plan</h2><button type="button" class="link" data-act="week">Week schedules</button></div>
      <div class="hm-tl">${rows}<span></span><div class="hm-hrs" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div></div>`;
    planEl.querySelector("[data-act=week]").addEventListener("click", () => onWeek?.());
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
    drawStatus();
    drawPlan();
  }

  return {
    update,
    week(view) { weekView = view; drawPlan(); },
    devices(n) { deviceCount = n; drawStatus(); },
    redraw() { if (!editing && modelEl.querySelector(".hm-iso")) drawModel(); drawStatus(); drawPlan(); },
    get editing() { return editing; },
  };
}

function mode(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
