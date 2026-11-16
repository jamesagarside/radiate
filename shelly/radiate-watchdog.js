// Radiate relay watchdog for Shelly Gen3/Gen4 (docs/spec.md section 5.7).
//
// Runs on the Shelly itself. Radiate writes a heartbeat to KVS key "radiate_hb"
// (unix seconds) every 60 s. If the heartbeat is older than STALE_S, this script
// takes over: channel 0 (heating) follows a fallback schedule with its own minimum
// burn and off times, channel 1 (hot-water store) follows its schedule. When the
// heartbeat returns, the script steps back and Radiate is in charge again.
//
// Radiate also re-arms `toggle_after` on every heating command, so the relay turns
// itself off if nothing re-asserts it: it can never latch on indefinitely.
//
// Install: Shelly web UI > Scripts > Add script, paste, enable "Run on startup".

let STALE_S = 600;
let MIN_BURN_S = 480;
let MIN_OFF_S = 600;
// [startMinute, endMinute) local time. Heating starts an hour before occupancy.
let HEATING = [[330, 510], [960, 1350]];
let STORE = [[360, 450], [1020, 1260]];

let inControl = false;
let heatOn = false;
let changedAt = 0;

function inWindows(windows, minute) {
  for (let i = 0; i < windows.length; i++) {
    if (minute >= windows[i][0] && minute < windows[i][1]) return true;
  }
  return false;
}

function setSwitch(id, on) {
  Shelly.call("Switch.Set", { id: id, on: on });
}

function tick() {
  let sys = Shelly.getComponentStatus("sys");
  let now = sys.unixtime;
  if (!now || !sys.time) return; // no clock yet: do nothing rather than guess
  let parts = sys.time.split(":");
  let minute = JSON.parse(parts[0]) * 60 + JSON.parse(parts[1]);

  Shelly.call("KVS.Get", { key: "radiate_hb" }, function (res, err) {
    let hb = err === 0 && res && res.value ? JSON.parse(res.value) : 0;
    let stale = now - hb > STALE_S;

    if (!stale) {
      if (inControl) print("Radiate heartbeat back: handing over");
      inControl = false;
      return;
    }
    if (!inControl) {
      print("Radiate heartbeat stale: fallback schedule active");
      inControl = true;
      heatOn = Shelly.getComponentStatus("switch:0").output;
      changedAt = now;
    }

    let want = inWindows(HEATING, minute);
    let held = now - changedAt;
    if (want !== heatOn) {
      if ((heatOn && held >= MIN_BURN_S) || (!heatOn && held >= MIN_OFF_S)) {
        heatOn = want;
        changedAt = now;
      }
    }
    setSwitch(0, heatOn);
    setSwitch(1, inWindows(STORE, minute));
  });
}

Timer.set(60000, true, tick);
tick();
