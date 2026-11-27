// Guide view: how to read and work Radiate, at #guide. The text is static in
// index.html; this module only moves to a section and runs the first-visit note.
//
// Sections are linked as #guide/<name>, for example #guide/hot-water. app.js routes
// on the part before the slash and passes the rest here. The section elements are
// `g-<name>`, never `guide/<name>`, so the browser's own jump to an element with the
// fragment's ID never fires and fights the router.

const NOTE_KEY = "radiate.guideNote";

export function createGuide({ root }) {
  // The heading of a section, or null for an unknown name.
  const heading = (name) => (name ? root.querySelector(`#g-${CSS.escape(name)} > h3`) : null);

  return {
    show() {},
    hide() {},
    // Scroll to a section and put focus on its heading. False when there is no such
    // section, so the router focuses the view's heading instead.
    reveal(name) {
      const h = heading(name);
      if (!h) return false;
      h.focus({ preventScroll: true });
      h.scrollIntoView({ block: "start" });
      return true;
    },
  };
}

// The one-time note on the House view pointing to the guide. Dismissing it, or
// opening the guide from it, is remembered in this browser. Storage can be blocked
// (private windows, strict settings), so then the note shows on each visit.
export function guideNote({ note, tab }) {
  let dismissed = false;
  try { dismissed = localStorage.getItem(NOTE_KEY) === "dismissed"; } catch { /* show it */ }
  note.hidden = dismissed;
  const dismiss = () => {
    note.hidden = true;
    try { localStorage.setItem(NOTE_KEY, "dismissed"); } catch { /* memory only */ }
  };
  note.querySelector("[data-act=open]").addEventListener("click", dismiss);
  note.querySelector("[data-act=dismiss]").addEventListener("click", () => {
    dismiss();
    // Focus would otherwise fall to the page; the Guide tab is where the note pointed.
    if (tab && !tab.hidden) tab.focus();
  });
}
