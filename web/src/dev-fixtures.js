// Development only: states the demo can't produce, laid over the server's state so the
// UI can be checked in them. Loaded by app.js under `npm run dev` with ?fixture=<name>;
// Vite leaves it out of the build (tests/server/test_build_demo.py checks).
//
//   relay-lost   the boiler relay can't be reached (driver.shelly)
//   safe-mode    no valve reachable: safe mode, the boiler handed to the watchdog
//   dry-run      dry run, with writes held back
//   quiet        quiet hours
//   frost        the heating mode on Frost
//   not-linked   no boiler relay configured
//   fire-spotted a fire detected in the lounge, its switch still off
//   alerts       several alerts about no room, beyond what the hero shows
//   viewer       signed in with the viewer role
//   offline      the stream lost and the last poll failed
//   worst        fifteen rooms, long names and missing readings

const clone = (s) => JSON.parse(JSON.stringify(s));
const alert = (s, code, message, roomId = null) => {
  s.alert_details = [...(s.alert_details ?? []), { code, message, room_id: roomId }];
  s.alerts = [...(s.alerts ?? []), message];
};

const LONG = [
  "Primary bedroom with the walk-in wardrobe",
  "Bedroom",
  "Nursery",
  "Upstairs bathroom",
  "Study",
  "Kitchen and family room",
  "Utility",
  "Snug",
  "Hall",
  "Downstairs cloakroom and boot room",
  "Garden room",
  "Guest bedroom",
  "Landing",
  "Playroom",
  "Dining room",
];

const FIXTURES = {
  "relay-lost": (s) => {
    // The live driver raises it; the demo never does, so look like a live server.
    s.telemetry = { ...s.telemetry, simulated: false };
    alert(s, "driver.shelly", "Boiler relay not reachable: check its network and password");
  },
  "safe-mode": (s) => {
    for (const r of s.rooms) if (r.role !== "passive" && r.role !== "unheated") alert(s, "driver.trv_offline", `${r.name}: TRV not reachable`, r.id);
    alert(s, "safe_mode.no_trvs", "No TRVs reachable: safe mode, boiler stops after minimum burn");
  },
  "dry-run": (s) => {
    s.telemetry = { ...s.telemetry, dry_run: true, intended_writes: 42, shelly_intended: 3,
      recent_intended: [{ topic: "zigbee2mqtt/trv_lounge/set", payload: { valve_opening_degree: 35 } }, { topic: "shelly/relay/0", payload: "on" }] };
  },
  quiet: (s) => {
    s.quiet = { active: true, until: "06:00" };
    s.boiler = { ...s.boiler, state: "idle" };
    for (const r of s.rooms) { r.calling = false; r.topup = false; }
  },
  frost: (s) => { s.mode = "frost"; },
  "fire-spotted": (s) => {
    const r = s.rooms.find((x) => x.heat_source === "episodic") ?? s.rooms[0];
    Object.assign(r, { fire: true, fire_switch: false, learning: "fire", calling: false, topup: false, opening: 0 });
  },
  alerts: (s) => {
    alert(s, "device.offline", "plug_landing: router not reachable");
    alert(s, "device.low_battery", "remote_hall: battery low");
    alert(s, "driver.mqtt", "MQTT broker not reachable");
  },
  "not-linked": (s) => { s.telemetry = { ...s.telemetry, simulated: false, boiler_linked: false }; },
  worst: (s) => {
    const base = s.rooms[0];
    const rooms = LONG.map((name, i) => {
      const from = s.rooms[i % s.rooms.length] ?? base;
      return { ...clone(from), id: `room_${i}`, name, temperature: i % 4 === 3 ? null : from.temperature, opening: i % 5 === 4 ? null : from.opening };
    });
    s.rooms = rooms;
    alert(s, "device.battery_low", `${LONG[0]}: TRV battery low`, "room_0");
    alert(s, "device.offline", `${LONG[9]}: room sensor not reachable`, "room_9");
  },
};

export const ROLE = { viewer: "viewer" };
export const OFFLINE = new Set(["offline"]);

export function applyFixture(name, state) {
  const fix = FIXTURES[name];
  if (!fix || !state) return state;
  const s = clone(state);
  fix(s);
  return s;
}
