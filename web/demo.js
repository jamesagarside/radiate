// Radiate static demo: a transport that runs the real engine in a Web Worker
// (demo-worker.js, Pyodide), plus the loading panel and the speed control.
// Loaded by app.js only when <html data-transport="demo">.

const SPEEDS = [1, 60, 300];
const DEFAULT_SPEED = 60;
const $ = (id) => document.getElementById(id);
const clock = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function loadingPanel() {
  const panel = document.createElement("section");
  panel.className = "card demo-loading";
  panel.setAttribute("aria-labelledby", "demo-loading-h");
  panel.innerHTML = `
    <h2 id="demo-loading-h">Starting the demo house</h2>
    <p class="demo-stage" aria-live="polite">Downloading Python…</p>
    <div class="demo-progress" role="progressbar" aria-labelledby="demo-loading-h" aria-valuemin="0" aria-valuemax="100" data-indeterminate="true">
      <div class="demo-progress-fill"></div>
    </div>
    <p class="muted demo-note">Radiate's real engine runs in your browser against a simulated nine-radiator house.
      The first visit downloads Python (about 5 MB, then cached). Nothing is sent anywhere.</p>
    <div class="demo-error" hidden>
      <p class="demo-error-text"></p>
      <button class="btn" type="button">Try again</button>
    </div>`;
  panel.querySelector(".demo-error .btn").addEventListener("click", () => location.reload());
  document.querySelector("main").before(panel);
  return panel;
}

function showProgress(panel, msg) {
  const stage = panel.querySelector(".demo-stage");
  const bar = panel.querySelector(".demo-progress");
  if (msg.stage === "python") {
    stage.textContent = "Downloading Python…";
    return;
  }
  bar.dataset.indeterminate = "false";
  const pct = Math.round(msg.fraction * 100);
  bar.setAttribute("aria-valuenow", String(pct));
  bar.firstElementChild.style.transform = `scaleX(${msg.fraction})`;
  if (msg.stage === "radiate") {
    stage.textContent = "Loading Radiate…";
  } else {
    const at = Math.floor(msg.simSeconds / 60);
    const day = Math.floor(at / 1440) + 1;
    stage.textContent = `Warming up the house: day ${day}, ${clock(at % 1440)} simulated (${pct}%)`;
  }
}

function speedControl(worker) {
  const wrap = document.createElement("div");
  wrap.className = "demo-speed";
  wrap.innerHTML = `<span class="demo-speed-label" id="demo-speed-label">Speed</span>
    <div class="seg seg-sm" role="radiogroup" aria-labelledby="demo-speed-label">
      ${SPEEDS.map((s) => `<button type="button" role="radio" data-speed="${s}" aria-label="${s} times real time">${s}×</button>`).join("")}
    </div>`;
  const group = wrap.querySelector(".seg");
  const select = (speed) => {
    for (const b of group.querySelectorAll("button")) b.setAttribute("aria-checked", String(Number(b.dataset.speed) === speed));
    worker.postMessage({ type: "speed", speed });
  };
  group.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-speed]");
    if (btn) select(Number(btn.dataset.speed));
  });
  select(DEFAULT_SPEED);
  return wrap;
}

function decorateBanner(worker) {
  const banner = $("banner");
  const copy = document.createElement("div");
  copy.className = "demo-copy";
  const note = document.createElement("p");
  note.className = "demo-sub";
  note.textContent = "Simulated house, real engine, running in your browser. Nothing here controls a real boiler.";
  copy.append($("banner-text"), note);
  banner.classList.add("demo-banner");
  banner.append(copy, speedControl(worker));
}

export function createDemoTransport() {
  const worker = new Worker(new URL("demo-worker.js", import.meta.url));
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
        if (msg.status === 200) p.resolve(msg.body);
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

  const request = async (method, path, body) => {
    await ready;
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ type: "request", id, method, path, body });
    });
  };

  return {
    house: () => ready,
    // If start-up failed the loading panel says so; leave the status line alone.
    state: () => ready.then(() => latest, () => new Promise(() => {})),
    post: (path, body) => request("POST", path, body),
    subscribe(onState) {
      listeners.add(onState);
    },
  };
}
