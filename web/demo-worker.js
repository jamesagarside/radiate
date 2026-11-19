// Radiate demo worker: the real engine and simulator, running under Pyodide.
// Only used by the static demo site (scripts/build_demo.py). It loads Python,
// unpacks radiate.zip, warms the simulated house up so the models have learned
// something, then steps it on a timer and answers the UI's API calls through
// radiate.server.bridge, which applies the same rules as the HTTP server.

const PYODIDE_VERSION = "0.29.5";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const ZIP_URL = new URL("radiate.zip", self.location.href).toString();
const SITE_DIR = "/home/pyodide/radiate-demo";

// Warm-up: aim for 36 simulated hours (a full 24 h burn timeline plus a morning
// and evening of learning) but stay inside a time budget on slower machines.
const WARM_TARGET_MIN = 36 * 60;
const WARM_FLOOR_MIN = 12 * 60;
const WARM_BUDGET_MS = 12000;
const WARM_CHUNK_MIN = 30;
const MAX_CATCH_UP_MIN = 30;

let session = null;
let speed = 60;
let paused = false;
let owed = 0;
let lastTick = 0;

const post = (msg) => self.postMessage(msg);
const progress = (stage, fraction, extra = {}) => post({ type: "progress", stage, fraction, ...extra });
const call = (method, path, body) => JSON.parse(session.request(method, path, body === undefined ? "null" : JSON.stringify(body)));
const pushState = () => post({ type: "state", state: call("GET", "state").body });

async function boot() {
  const t0 = performance.now();
  progress("python", 0);
  const zip = fetch(ZIP_URL).then((r) => {
    if (!r.ok) throw new Error(`radiate.zip: HTTP ${r.status}`);
    return r.arrayBuffer();
  });
  importScripts(`${PYODIDE_URL}pyodide.js`);
  const pyodide = await self.loadPyodide({ indexURL: PYODIDE_URL });
  const tPython = performance.now();
  progress("radiate", 0.35);
  pyodide.unpackArchive(await zip, "zip", { extractDir: SITE_DIR });
  pyodide.runPython(`import sys; sys.path.insert(0, ${JSON.stringify(SITE_DIR)})`);
  const bridge = pyodide.pyimport("radiate.server.bridge");
  session = bridge.DemoSession();
  const tRadiate = performance.now();

  // Warm up in chunks so progress can be reported while Python runs.
  let target = WARM_TARGET_MIN;
  let done = 0;
  const wStart = performance.now();
  while (done < target) {
    const n = Math.min(WARM_CHUNK_MIN, target - done);
    session.step(n);
    done += n;
    const spent = performance.now() - wStart;
    if (done >= 120 && target === WARM_TARGET_MIN) {
      const perMin = spent / done;
      const affordable = Math.floor(WARM_BUDGET_MS / perMin / WARM_CHUNK_MIN) * WARM_CHUNK_MIN;
      target = Math.max(WARM_FLOOR_MIN, Math.min(WARM_TARGET_MIN, affordable));
    }
    progress("warmup", 0.4 + 0.6 * (done / target), { simSeconds: session.sim_seconds() });
  }
  const tWarm = performance.now();

  post({
    type: "ready",
    house: call("GET", "house").body,
    state: call("GET", "state").body,
    timings: {
      python_ms: Math.round(tPython - t0),
      radiate_ms: Math.round(tRadiate - tPython),
      warmup_ms: Math.round(tWarm - tRadiate),
      warmup_sim_minutes: done,
      pyodide: PYODIDE_VERSION,
      // Bytes over the wire for the worker's fetches (0 when served from cache).
      worker_transfer_bytes: performance
        .getEntriesByType("resource")
        .reduce((sum, e) => sum + (e.transferSize || 0), 0),
    },
  });
  lastTick = performance.now();
  setInterval(tick, 200);
}

// Step the house so simulated time runs at `speed` times real time.
function tick() {
  const now = performance.now();
  if (paused) {
    lastTick = now;
    return;
  }
  owed = Math.min(MAX_CATCH_UP_MIN, owed + ((now - lastTick) * speed) / 60000);
  lastTick = now;
  const n = Math.floor(owed);
  if (n < 1) return;
  owed -= n;
  session.step(n);
  pushState();
}

self.onmessage = (ev) => {
  const msg = ev.data;
  if (msg.type === "speed") {
    speed = msg.speed;
    owed = 0;
  } else if (msg.type === "pause") {
    paused = msg.paused;
  } else if (msg.type === "request") {
    let res;
    try {
      res = call(msg.method, msg.path, msg.body);
    } catch (err) {
      res = { status: 500, body: String(err) };
    }
    post({ type: "response", id: msg.id, ...res });
    if (res.status === 200 && msg.method === "POST") pushState();
  }
};

boot().catch((err) => post({ type: "error", message: String(err && err.message ? err.message : err) }));
