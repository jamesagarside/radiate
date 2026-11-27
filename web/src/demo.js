// Radiate static demo: a transport that runs the real engine in a Web Worker
// (demo-worker.js, Pyodide), plus the loading panel and the speed control.
// Loaded by app.js only when <html data-transport="demo">.

const SPEEDS = [1, 60, 300];
const DEFAULT_SPEED = 60;
const $ = (id) => document.getElementById(id);
const clock = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function loadingPanel() {
  const panel = document.createElement("wa-card");
  panel.className = "demo-loading";
  panel.setAttribute("aria-labelledby", "demo-loading-h");
  panel.innerHTML = `
    <h2 slot="header" class="wa-heading-m" id="demo-loading-h">Starting the demo house</h2>
    <div class="wa-stack wa-gap-s">
      <p class="demo-stage" aria-live="polite">Downloading Python…</p>
      <wa-progress-bar class="demo-progress" indeterminate label="Starting the demo house"></wa-progress-bar>
      <p class="wa-caption-m wa-color-text-quiet">Radiate's real engine runs in your browser against a simulated nine-radiator house.
        The first visit downloads Python (about 5 MB, then cached). Nothing is sent anywhere.</p>
      <wa-callout variant="warning" class="demo-error" hidden>
        <div class="wa-stack wa-gap-xs">
          <p class="demo-error-text"></p>
          <div><wa-button size="s" appearance="outlined">Try again</wa-button></div>
        </div>
      </wa-callout>
    </div>`;
  panel.querySelector(".demo-error wa-button").addEventListener("click", () => location.reload());
  $("house").before(panel);
  return panel;
}

function showProgress(panel, msg) {
  const stage = panel.querySelector(".demo-stage");
  const bar = panel.querySelector(".demo-progress");
  if (msg.stage === "python") {
    stage.textContent = "Downloading Python…";
    return;
  }
  const pct = Math.round(msg.fraction * 100);
  bar.indeterminate = false;
  bar.value = pct;
  if (msg.stage === "radiate") {
    stage.textContent = "Loading Radiate…";
  } else {
    const at = Math.floor(msg.simSeconds / 60);
    const day = Math.floor(at / 1440) + 1;
    stage.textContent = `Warming up the house: day ${day}, ${clock(at % 1440)} simulated (${pct}%)`;
  }
}

function speedControl(worker) {
  const group = document.createElement("wa-radio-group");
  group.className = "demo-speed";
  group.setAttribute("label", "Speed");
  group.setAttribute("orientation", "horizontal");
  group.setAttribute("size", "s");
  group.innerHTML = SPEEDS.map((s) => `<wa-radio appearance="button" value="${s}" aria-label="${s} times real time">${s}×</wa-radio>`).join("");
  const select = (speed) => {
    group.value = String(speed);
    worker.postMessage({ type: "speed", speed });
  };
  group.addEventListener("change", () => select(Number(group.value)));
  select(DEFAULT_SPEED);
  return group;
}

function decorateBanner(worker) {
  const banner = $("banner");
  const row = document.createElement("div");
  row.className = "demo-banner";
  const copy = document.createElement("div");
  copy.className = "wa-stack wa-gap-3xs demo-copy";
  const note = document.createElement("p");
  note.className = "wa-caption-m";
  note.textContent = "Simulated house, real engine, running in your browser. Nothing here controls a real boiler.";
  copy.append($("banner-text"), note);
  row.append(copy, speedControl(worker));
  banner.append(row);
}

export function createDemoTransport() {
  // The worker is a plain file beside the built assets, never bundled.
  const worker = new Worker(new URL("static/demo-worker.js", document.baseURI));
  const panel = loadingPanel();
  const listeners = new Set();
  const pending = new Map();
  let latest = null;
  let nextId = 1;
  document.body.dataset.demo = "loading";
  $("status").textContent = "Starting the demo…";

  const ready = new Promise((resolve, reject) => {
    worker.onmessage = (ev) => {
      const msg = ev.data;
      if (msg.type === "progress") {
        showProgress(panel, msg);
      } else if (msg.type === "ready") {
        latest = msg.state;
        window.radiateDemoTimings = {
          ...msg.timings,
          interactive_ms: Math.round(performance.now()),
          page_transfer_bytes: performance
            .getEntriesByType("resource")
            .reduce((sum, e) => sum + (e.transferSize || 0), 0),
        };
        console.info("Radiate demo ready", window.radiateDemoTimings);
        decorateBanner(worker);
        panel.remove();
        document.body.dataset.demo = "ready";
        resolve(msg.house);
      } else if (msg.type === "state") {
        latest = msg.state;
        for (const cb of listeners) cb(latest);
      } else if (msg.type === "response") {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (!p) return;
        if (p.raw) p.resolve({ status: msg.status, body: msg.body });
        else if (msg.status === 200) p.resolve(msg.body);
        else p.reject(new Error(typeof msg.body === "string" ? msg.body : `HTTP ${msg.status}`));
      } else if (msg.type === "error") {
        const err = panel.querySelector(".demo-error");
        err.hidden = false;
        err.querySelector(".demo-error-text").textContent = `The demo could not start: ${msg.message}. Check your connection and try again.`;
        panel.querySelector(".demo-progress").hidden = true;
        $("status").textContent = "The demo could not start.";
        reject(new Error(msg.message));
      }
    };
    worker.onerror = (ev) => worker.onmessage({ data: { type: "error", message: ev.message || "worker failed" } });
  });

  // Pause the simulation while the tab is hidden; it resumes where it left off.
  document.addEventListener("visibilitychange", () => worker.postMessage({ type: "pause", paused: document.hidden }));

  // `raw`: answer { status, body } whatever the status, like the HTTP transport's call().
  const request = async (method, path, body, raw = false) => {
    await ready;
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject, raw });
      worker.postMessage({ type: "request", id, method, path, body });
    });
  };

  return {
    // Asked again each time: the household setup changes what it says.
    house: () => request("GET", "house"),
    // Asked of the engine, so a change shows straight away rather than at the next
    // simulated tick. If start-up failed the loading panel says so; leave the status
    // line alone.
    state: () => ready.then(
      () => request("GET", "state").catch(() => latest),
      () => new Promise(() => {}),
    ),
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    call: (method, path, body) => request(method, path, body, true),
    subscribe(onState) {
      listeners.add(onState);
    },
  };
}
