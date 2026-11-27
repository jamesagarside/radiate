// Security log: sign-ins, refusals and changes, newest first, from GET /api/v1/audit
// (ADR-0008). It is the last section of the Settings view (#settings/security-log)
// and only admins see it: the server answers 403 to anyone else and the section stays
// hidden. Filters by outcome and by user go to the server; "Show older" pages back by
// event ID.

const $ = (id) => document.getElementById(id);
const NONE = "–";
const PAGE = 50;

// A short name for each kind of event, as the table's What column shows it.
const WHAT = {
  "radiate.security.login": "Signed in",
  "radiate.security.login.failed": "Sign-in refused",
  "radiate.security.logout": "Signed out",
  "radiate.security.session.ended": "Session ended",
  "radiate.security.request.refused": "Request refused",
  "radiate.security.access.denied": "Not allowed",
  "radiate.security.lockout.started": "Sign-in locked",
  "radiate.security.lockout.ended": "Sign-in unlocked",
  "radiate.security.user.changed": "User changed",
  "radiate.security.config.changed": "Changed",
  "radiate.security.control.used": "Control used",
  "radiate.security.login.config": "Started",
};
const HOW = { password: "password", oidc: "single sign-on", saml: "SAML", token: "API token", ingress: "Home Assistant", cli: "command line", session: "signed in", open: "open server" };

export const whatText = (e) => WHAT[e.event] ?? e.event;

// Who did it: the user, else how the request came in, else nothing known.
export function whoText(e) {
  const a = e.attributes ?? {};
  if (e.user) return e.user;
  return HOW[a["radiate.auth.method"]] ?? NONE;
}

// "24 Nov, 14:05:09" in the browser's time zone.
export function whenText(at, timeZone) {
  const opts = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
  if (timeZone) opts.timeZone = timeZone;
  return new Intl.DateTimeFormat("en-GB", opts).format(new Date(at * 1000));
}

// The line above the table: how long events are kept, and what is shown.
export function summaryText(view, filters) {
  const n = view.events.length;
  const what = filters.outcome === "failure" ? "refusals" : filters.outcome === "success" ? "allowed events" : "events";
  const who = filters.user ? ` for ${filters.user}` : "";
  const kept = `Kept for ${view.retention_days} days.`;
  if (!n) return `No ${what}${who} yet. ${kept}`;
  return `The latest ${n === 1 ? "event" : `${n} ${what}`}${who}, newest first. ${kept}`;
}

export function createSecurity({ transport, isAuthError, onAuth }) {
  let open = false;
  let offered = false;
  let events = [];
  let view = null;
  let more = false;
  const filters = { outcome: "", user: "" };

  const query = (before) => {
    const p = new URLSearchParams({ limit: String(PAGE) });
    if (filters.outcome) p.set("outcome", filters.outcome);
    if (filters.user) p.set("user", filters.user);
    if (before) p.set("before", String(before));
    return `audit?${p}`;
  };

  function row(e) {
    const tr = document.createElement("tr");
    if (e.outcome === "failure") tr.dataset.kind = "warn";
    const cell = (tag, text, cls) => {
      const c = document.createElement(tag);
      c.textContent = text;
      if (cls) c.className = cls;
      return c;
    };
    const when = cell("th", whenText(e.at));
    when.scope = "row";
    const what = cell("td", whatText(e));
    if (e.outcome === "failure") {
      const tag = document.createElement("wa-badge");
      tag.textContent = "Refused";
      tag.setAttribute("variant", "warning");
      tag.setAttribute("appearance", "filled-outlined");
      what.append(" ", tag);
    }
    tr.append(when, what, cell("td", whoText(e)), cell("td", e.source ?? NONE), cell("td", e.message, "sl-detail"));
    return tr;
  }

  function fillUsers(users) {
    const sel = $("security-user");
    const want = ["", ...users];
    const have = [...sel.options].map((o) => o.value);
    if (want.join("\n") === have.join("\n")) return;
    sel.replaceChildren(...want.map((u) => {
      const o = document.createElement("option");
      o.value = u;
      o.textContent = u || "Everyone";
      return o;
    }));
    sel.value = want.includes(filters.user) ? filters.user : "";
  }

  function render() {
    if (!view) return;
    fillUsers(view.users ?? []);
    $("security-summary").textContent = summaryText({ ...view, events }, filters);
    $("security-body").replaceChildren(...events.map(row));
    $("security-table").hidden = !events.length;
    $("security-more").hidden = !more;
  }

  async function load(append = false) {
    const before = append && events.length ? events.at(-1).id : null;
    try {
      const v = await transport.get(query(before));
      view = v;
      events = append ? [...events, ...v.events] : v.events;
      more = v.events.length === PAGE;
      $("security-error").hidden = true;
      render();
    } catch (err) {
      if (isAuthError(err)) { onAuth(); return; }
      $("security-error").hidden = false;
    }
  }

  $("security-outcome").addEventListener("change", (e) => {
    const outcome = e.target.value === "all" ? "" : e.target.value;
    if (outcome === filters.outcome) return;
    filters.outcome = outcome;
    load();
  });
  $("security-user").addEventListener("change", (e) => {
    filters.user = e.target.value;
    load();
  });
  $("security-more").addEventListener("click", () => load(true));
  $("security-refresh").addEventListener("click", () => load());

  return {
    // Whether this person may read the log: only an admin gets 200.
    async available() {
      try {
        view = await transport.get(query());
        events = view.events;
        more = events.length === PAGE;
        offered = true;
      } catch {
        offered = false;
      }
      $("s-security-log").hidden = !offered;
      if (offered) render();
      return offered;
    },
    get offered() {
      return offered;
    },
    show() {
      open = true;
      if (offered) load();
    },
    hide() {
      open = false;
    },
    get open() {
      return open;
    },
  };
}
