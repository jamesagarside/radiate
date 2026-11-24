// Login page (ADR-0006). Asks the server how people sign in, then offers a password
// form, single sign-on buttons, or, before anyone has an account, the command that adds
// the first one. Every URL is relative, so it works behind a proxy path too.

const $ = (id) => document.getElementById(id);
const api = (p) => new URL(`api/v1/${p}`, document.baseURI).toString();
const home = () => new URL("./", document.baseURI).toString();

function showError(text) {
  const el = $("login-error");
  el.textContent = text;
  el.hidden = !text;
}

const minutes = (s) => {
  const m = Math.max(1, Math.ceil(s / 60));
  return `${m} min`;
};

async function init() {
  let cfg;
  try {
    const res = await fetch(api("auth/config"));
    cfg = await res.json();
  } catch {
    showError("Cannot reach Radiate. Reload the page to try again.");
    return;
  }
  if (!cfg.login) { window.location.replace(home()); return; }
  // Already signed in: straight to the house.
  try {
    const me = await fetch(api("auth/me"));
    if (me.ok) { window.location.replace(home()); return; }
  } catch { /* stay here */ }

  if (new URLSearchParams(window.location.search).get("error") === "sso") {
    showError("Single sign-on didn't work. Try again, or ask whoever runs Radiate to check its log.");
  }

  const local = cfg.methods.some((m) => m.id === "local");
  const sso = cfg.methods.filter((m) => m.id !== "local");
  if (cfg.first_user_needed) {
    $("login-first").hidden = false;
    $("login-foot").hidden = true;
  } else if (local) {
    $("login-form").hidden = false;
    $("login-user").focus();
  } else {
    $("login-foot").hidden = true;
  }
  if (sso.length) {
    const box = $("login-sso");
    for (const m of sso) {
      const a = document.createElement("a");
      a.className = local && !cfg.first_user_needed ? "btn" : "btn btn-primary";
      a.href = new URL(m.url, document.baseURI).toString();
      a.textContent = m.label;
      box.append(a);
    }
    box.hidden = false;
    $("login-or").hidden = !(local && !cfg.first_user_needed);
  }
  if (!local && !sso.length) showError("No way to sign in is turned on. Check the auth section of the house file.");
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = $("login-user");
  const pass = $("login-pass");
  const button = $("login-form").querySelector("button");
  user.removeAttribute("aria-invalid");
  pass.removeAttribute("aria-invalid");
  if (!user.value.trim() || !pass.value) {
    const missing = !user.value.trim() ? user : pass;
    missing.setAttribute("aria-invalid", "true");
    showError(missing === user ? "Enter your username." : "Enter your password.");
    missing.focus();
    return;
  }
  showError("");
  button.disabled = true;
  let res;
  try {
    res = await fetch(api("auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.value.trim(), password: pass.value }),
    });
  } catch {
    button.disabled = false;
    showError("Cannot reach Radiate. Check the connection and try again.");
    return;
  }
  if (res.ok) { window.location.replace(home()); return; }
  button.disabled = false;
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    showError(`Too many attempts for this account. Try again in ${minutes(body.retry_after_s || 900)}.`);
  } else if (res.status === 401) {
    showError("That username and password weren't accepted. Check them and try again.");
    pass.setAttribute("aria-invalid", "true");
    pass.select();
  } else {
    showError("Radiate couldn't sign you in just now. Try again in a moment.");
  }
});

init();
