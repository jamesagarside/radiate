// Suggestions view: what Radiate has learned about the house, turned into advice
// (GET /api/v1/suggestions). Each suggestion says what Radiate saw, what to do and how
// much data it rests on; rooms without enough learning say how far they have got.
// Cards are created once and updated in place.

const $ = (id) => document.getElementById(id);
const OPEN_MS = 30000; // refresh while the view is open
const CLOSED_MS = 300000; // and now and then for the tab's count

export const SEVERITY = {
  act: ["Act on this", "act"],
  consider: ["Worth considering", "consider"],
  info: ["For information", "info"],
};
const STATUS = { ready: ["Ready", "ok"], learning: ["Learning", ""], not_judged: ["Not judged", ""] };
const CONFIDENCE = { low: "Low confidence", medium: "Medium confidence", high: "High confidence" };

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// One line at the top of the view: how many, how pressing, or why there are none.
export function summaryText(v) {
  const s = v.summary;
  if (s.total) {
    const parts = [];
    if (s.act) parts.push(`${s.act} to act on`);
    if (s.consider) parts.push(`${s.consider} to consider`);
    if (s.info) parts.push(`${s.info} for information`);
    return `${plural(s.total, "suggestion", "suggestions")}: ${parts.join(", ")}.`;
  }
  if (s.rooms_learning && !s.rooms_ready) return "Nothing to suggest yet. Radiate is still learning.";
  return "Nothing to suggest.";
}

// The empty state's words, when there are no suggestions.
export function emptyText(v) {
  const s = v.summary;
  const h = Math.round(v.settings.min_learning_h);
  if (s.rooms_learning && !s.rooms_ready) {
    return `Radiate is still learning how each room heats up and cools down. Suggestions about a room start once it has ${h} h of learning; you can see how far each room has got below.`;
  }
  if (s.rooms_learning) {
    return `The rooms Radiate can judge so far heat up and hold their warmth as expected. ${plural(s.rooms_learning, "room is", "rooms are")} still learning.`;
  }
  if (!s.rooms_ready) return "None of the rooms here can be judged from Radiate's model, so there is nothing to suggest about them.";
  return "Every room Radiate can judge heats up and holds its warmth as expected.";
}

// What the confidence rests on: "Medium confidence. From 87 h of learning in Bedroom 2."
export function confidenceText(x) {
  return `${CONFIDENCE[x.confidence] ?? "Confidence unknown"}. ${x.basis}`;
}

// Whether rooms can be compared yet: "Rooms are compared once 3 have enough learning. 1 so far."
export function compareText(v) {
  const s = v.summary;
  if (s.rooms_compared >= s.min_rooms) return "";
  return `Rooms are compared with each other once ${s.min_rooms} have enough learning. ${s.rooms_compared ? `${s.rooms_compared} so far.` : "None yet."}`;
}

export function createSuggestions({ transport, isAuthError, onAuth, onCount }) {
  const cards = new Map();
  const rows = new Map();
  let view = null;
  let timer = null;
  let open = false;
  let loading = false;

  function renderCard(x) {
    let node = cards.get(x.id);
    if (!node) {
      node = $("suggestion-tpl").content.firstElementChild.cloneNode(true);
      cards.set(x.id, node);
    }
    const [label, kind] = SEVERITY[x.severity] ?? ["", ""];
    node.dataset.severity = x.severity;
    node.querySelector(".name").textContent = x.title;
    const b = node.querySelector(".badge");
    b.textContent = label;
    b.dataset.kind = kind;
    node.querySelector(".sg-evidence").textContent = x.evidence;
    node.querySelector(".sg-action").textContent = x.action;
    node.querySelector(".sg-basis").textContent = confidenceText(x);
    return node;
  }

  function renderRow(r, minHours) {
    let node = rows.get(r.room_id);
    if (!node) {
      node = $("learning-tpl").content.firstElementChild.cloneNode(true);
      rows.set(r.room_id, node);
    }
    node.querySelector(".lr-name").textContent = r.room_name;
    const [label, kind] = STATUS[r.status] ?? [r.status, ""];
    const b = node.querySelector(".badge");
    b.textContent = label;
    b.dataset.kind = kind;
    node.querySelector(".lr-note").textContent = r.note;
    // Progress towards the learning needed: only while a room is still learning.
    const meter = node.querySelector(".meter");
    meter.hidden = r.status !== "learning";
    const share = Math.max(0, Math.min(1, r.hours / Math.max(1, minHours)));
    meter.firstElementChild.style.transform = `scaleX(${share})`;
    return node;
  }

  function sync(parent, nodes) {
    // Put the nodes in order without moving ones already in place, so focus and
    // transitions are kept.
    let at = parent.firstElementChild;
    for (const node of nodes) {
      if (node === at) at = at.nextElementSibling;
      else parent.insertBefore(node, at);
    }
    while (at) {
      const next = at.nextElementSibling;
      at.remove();
      at = next;
    }
  }

  function render(v) {
    view = v;
    onCount?.(v.summary.act);
    $("suggestions-summary").textContent = summaryText(v);
    const list = $("suggestions-list");
    const live = new Set(v.suggestions.map((x) => x.id));
    for (const id of cards.keys()) if (!live.has(id)) cards.delete(id);
    sync(list, v.suggestions.map(renderCard));
    // No suggestions, or no room learned yet: say why, so an empty or device-only list
    // reads as deliberate rather than broken.
    const empty = $("suggestions-empty");
    const learningOnly = v.summary.rooms_learning > 0 && !v.summary.rooms_ready;
    empty.hidden = v.suggestions.length > 0 && !learningOnly;
    empty.dataset.state = learningOnly ? "learning" : "clear";
    $("suggestions-empty-h").textContent = learningOnly ? "Still learning" : "Nothing to suggest";
    $("suggestions-empty-text").textContent = emptyText(v);

    const learning = $("learning-list");
    const rooms = new Set(v.learning.map((r) => r.room_id));
    for (const id of rows.keys()) if (!rooms.has(id)) rows.delete(id);
    sync(learning, v.learning.map((r) => renderRow(r, v.settings.min_learning_h)));
    $("learning-section").hidden = !v.learning.length;
    const compare = $("learning-compare");
    compare.textContent = compareText(v);
    compare.hidden = !compare.textContent;
  }

  async function load() {
    if (loading) return;
    loading = true;
    try {
      render(await transport.get("suggestions"));
    } catch (err) {
      if (isAuthError(err)) onAuth();
      else if (!view && open) $("suggestions-summary").textContent = "Couldn't load the suggestions. Retrying…";
    }
    loading = false;
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(load, open ? OPEN_MS : CLOSED_MS);
  }

  return {
    // Whether this server offers suggestions: false for a 404, null if it couldn't say.
    async available() {
      try {
        render(await transport.get("suggestions"));
        schedule();
        return true;
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
      schedule();
    },
  };
}
