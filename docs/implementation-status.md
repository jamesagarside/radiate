# Implementation status

The v1 specification ([spec.md](spec.md)) and the v1 items of the [coverage matrix](research/coverage-matrix.md) ("Radiate standalone" column), checked against the code. Update this page in the same change as the code.

Last audit: November 2026, against `main` at `c4657fe`. On 19 November 2026 the spec was reconciled with the code at `925b7a1`: where the code had deliberately gone another way the spec now describes the code, and the rows below changed to match.

**Status:** done (matches the spec), partial (works, but differs from the spec or misses part of it), missing (not in the code). Paths are relative to `src/radiate/` unless they start with a top-level folder. "Unsure" marks a row the audit could not settle from the code alone.

## Summary

| Status | At audit | Now |
|---|---|---|
| Done | 82 | 106 |
| Partial | 26 | 24 |
| Missing | 37 | 22 |

Gaps closed since the audit: safe mode now hands the boiler to the Shelly watchdog (it kept the heartbeat going, so a Zigbee or MQTT outage left the house without heat), and the boiler guard adopts the relay when Radiate takes it back; boiler lockout and out-of-oil detection; short-cycle detection and adaptation; oil and runtime accounting with the daily Elastic stream and balance score; setpoint overrides that expire and survive restarts; stuck and leaking valve detection; Home Assistant entities and services for accounting, overrides, the fire switch, stuck valves, short-cycling and alerts. Two rows moved from done to partial when simulation showed valves Radiate counted as open staying shut; both are fixed, and relay time with no TRV open is now measured in simulation (0 %, down from 4.2 %). Days Radiate did not see in full are marked partial and get no balance score. Every live tick is now recorded for replay (`radiate replay`), the learner bootstraps from that history, and `radiate discover` drafts the configuration from Zigbee2MQTT.

Top remaining gaps, most important first:

1. **Litres are an upper bound** until the burner-firing signal exists (section 5.6, open question 1).
2. **Valve recalibration service** (section 7): blocked, the TRVZB has no calibration command in Zigbee2MQTT (see the row below).
3. Learning extras: house-wide `κ`, flow sensitivity `η`, valve dead zone, store recovery time, bootstrap from the Home Assistant recorder (sections 4.1 to 4.3, 5.5).
4. **TRV bias refinement** for internal-sensor rooms (section 4.6): tried and dropped, see the row below.
5. **Three behaviour choices for the owner**, marked open questions in the spec (section 12): the learning memory, pooled demand, and learning on a stale room sensor.

## 2. House model

| Item | Status | Where | Note |
|---|---|---|---|
| Rooms with roles `normal`, `passive`, `internal_sensor_only` | done | `core/types.py` `RoomConfig`, `config/site.py` | |
| Heat sources `episodic`, `continuous` | done | `core/types.py`, `core/disturbance.py` | |
| Heat source bound to a binary sensor or schedule | partial | `server/app.py` `/fire` | Manual fire switch via API only; no sensor or schedule binding in the config file |
| Radiator nominal output (W at ΔT50) | missing | | Not in config; not needed by the current model |
| Boiler: relay, rated output, nozzle rating, guard parameters | done | `core/types.py` `BoilerConfig`, `config/site.py` `_boiler` | `nozzle_lph` parsed but unused before accounting |
| Store: relay, schedule, priority | done | `core/types.py` `StoreConfig` | One schedule for every day |

## 3. Signals

| Item | Status | Where | Note |
|---|---|---|---|
| Room temperature and humidity | done | `drivers/live.py`, `drivers/z2m.py` | |
| TRV internal temperature, valve echo, availability | done | `drivers/live.py` | |
| TRV battery | missing | | Not read or alerted |
| Outdoor temperature | done | `drivers/live.py` | Local Z2M sensor only, no weather provider; 5 °C assumed without one |
| Heating and store relay state | done | `drivers/shelly.py` | |
| Relay power (burner firing) | partial | `drivers/shelly.py` telemetry | `apower` reported in telemetry, not fed to the core |
| Flow pipe temperature (optional) | missing | | |
| Staleness checks before the core | done | `drivers/z2m.py` `reading_age`, `core/decide.py` | |

## 4. Balancing algorithm

| Item | Status | Where | Note |
|---|---|---|---|
| 4.1 Room model `a`, `b`, `d` | done | `core/estimator.py` | |
| 4.1 Valve characteristic `f(o)` with default dead zone and saturation | done | `core/valve.py` | |
| 4.1 Learned per-valve dead zone | missing | | Defaults only |
| 4.1 Supply factor with bypass | done | `core/valve.py` `supply_factor` | |
| 4.1 House-wide `κ` learned | missing | `core/types.py` `supply_kappa` | Fixed at 0.15 |
| 4.1 Arrival lag learned per radiator, median of 15 | done | `core/decide.py` lag probe | A 0.6 K TRV rise within 40 min; heat availability is a step and the drive is smoothed over 15 min. The spec now describes this |
| 4.2 Flow sensitivity `η` | missing | `core/allocator.py` `AllocRoom.eta` | Always the 0.7 default; no emitter-limited report |
| 4.3 RLS with forgetting, priors, bounds | done | `core/estimator.py` | Open question: the forgetting factor gives a memory of about 33 hours of learning, not the 3 days planned (spec 4.3) |
| 4.3 Diagnostic when a parameter sits on a bound for 24 h | missing | | |
| 4.3 Bootstrap from 14 days of history | partial | `core/bootstrap.py`, `server/runtime.py` `restore`, `cli.py` `bootstrap` | From the standalone database's tick history, on start without usable saved state or with `radiate bootstrap`; keeps models, lags and lockshield histograms only. Not from the Home Assistant recorder |
| 4.3 Outlier rejection at 4 σ | done | `core/estimator.py` | |
| 4.3 Per-room confidence | done | `core/estimator.py` | |
| 4.4 Synchronised arrival allocation | done | `core/allocator.py` | Deadline-aware for optimum start |
| 4.4 Opening floor 20 % | done | `core/allocator.py` | |
| 4.4 Capacity limited: pace at the horizon and log | partial | `core/allocator.py` | Paces at the horizon, as the spec now says; `capacity_limited` is never logged or reported |
| 4.4 Steady-state allocation with a 30 min horizon | missing | `core/decide.py` | The lockshield cap is written instead whenever a room is not allocated |
| 4.4 Lockshield cap `L_r` | done | `core/decide.py` `_record_lockshield` | 90th percentile of a decaying histogram (about 23 firing hours half-life), written whenever a room is not allocated. The spec now describes this instead of a 7 day window written in safe mode |
| 4.5 Governed mode settings | done | `drivers/z2m.py` `TrvWriter` | |
| 4.5 TRV setpoint in the TRV's frame, call bias, sink lead | done | `core/decide.py` `_trv_setpoint` | Rounded to 0.5 K, clamped 4 to 35 °C. Internal-sensor rooms also get their mirrored schedule in this frame (`drivers/live.py` `_mirror`). The TRVZB's own hysteresis (assumed 0.5 K) needs checking on the pilot valve |
| 4.5 Schedule mirror into the TRVZB | done | `drivers/z2m.py`, `config/schedule.py` | |
| 4.5 Write discipline (3 % step, 10 min, 15 % exception) | done | `core/decide.py` `_discipline` | |
| 4.5 Close bump | done | `core/decide.py`, `drivers/z2m.py` | |
| 4.5 Reconciler, 3 attempts then a diagnostic | done | `drivers/z2m.py`, `drivers/live.py` `alerts` | |
| 4.5 Summer valve exercise | missing | | |
| 4.5 Per-valve `actuation_enabled`, global dry run | done | `config/site.py`, `drivers/live.py` | |
| 4.6 Gate: sensor fresh | partial | `core/decide.py` | A stale room sensor falls back to the TRV reading and learning carries on. Open question: should it (spec 4.6) |
| 4.6 Gate: window | done | `core/disturbance.py` | |
| 4.6 Gate: store recovery | partial | `core/decide.py` | Time-based only; no "`T_trv` rising again" check |
| 4.6 Gate: settled after setpoint change | done | `core/decide.py` | |
| 4.6 Gate: shower | done | `core/disturbance.py` | |
| 4.6 Gate: valve rejected (reconciler failure), stuck or leaking | done | `core/decide.py`, `drivers/live.py` | Settings the TRV rejected reach the core as `RoomInput.trv_rejected` and pause learning while they last and for an hour after (`valve_rejected`), listed per room as `valve.rejected` in `describe()`. Not reported in dry run, where nothing is sent. A stuck (`valve_untrusted`) or leaking (`valve_leaking`) valve also pauses learning |
| 4.6 Gate: not passive | done | `core/decide.py` | Passive rooms have no engine state |
| 4.6 Open fire detection, closing and 4 h hold-off | done | `core/disturbance.py` | Residual threshold 2.0 K/h with confidence ≥ 0.6, and the rise rule needs the radiator off 30 min (tuned in simulation, now in the spec) |
| 4.6 Range cooker: free `d`, cooking spikes excluded | done | `core/estimator.py`, `core/disturbance.py` | |
| 4.6 Range cooker "self-heated" after 14 days | missing | | |
| 4.6 Stairs bypass in the supply factor | done | `core/types.py` `bypass_equivalent` | |
| 4.6 Stairs rise as a heat-availability check | done | `core/health.py` `NoHeat` | A 0.3 K rise on a passive room counts as heat in the no-heat check |
| 4.6 Toilet: TRV reading with bias, 1.0 K hysteresis, never sets the pace | done | `core/decide.py` | The TRV setpoint goes out as `target - bias` (plus the call bias, rounded up), so the TRV opens when the core calls |
| 4.6 Toilet: bias refinement, confidence capped at 0.5 | partial | `core/decide.py` `new_estimator` | Confidence cap done. Bias refinement deliberately not done: with a cold radiator the observed offset is about 0 K, but the bias also has to cover the warm radiator, and every variant tried in simulation left the toilet short of heat and raised the house comfort deficit ([simulation](simulation.md#internal-sensor-rooms-and-the-trv-bias)) |

## 5. Boiler logic

| Item | Status | Where | Note |
|---|---|---|---|
| 5.1 Guard parameters and ranges | done | `core/types.py`, `config/site.py` | |
| 5.2 State machine IDLE, LEAD, FIRING, REST | done | `core/boiler.py` | |
| 5.2 Frost override, hard frost ignores minimum off | done | `core/boiler.py`, `core/decide.py` | |
| 5.3 Pooled demand `D` (gain-weighted) | partial | `core/decide.py` | Fire rule uses the largest gap and predicted burn; `D` is not computed. Open question: should a small room alone fire the boiler less readily (spec 5.3) |
| 5.3 Fire rules (comfort limit, 1.5 × minimum burn, optimum start) | done | `core/decide.py` | |
| 5.3 Stop rule | done | `core/decide.py` | Demand latch: stop when no room is calling or extended. The spec now describes this instead of "predicted to arrive within one tick" |
| 5.3 Burn extension (top-up) | done | `core/decide.py` | |
| 5.3 Store merging (opt-in) | missing | | |
| 5.4 Open-path guarantee with heat sinks | done | `core/decide.py` `_ensure_sink`, `_trv_setpoint` | Each room calling or topped up counts as one open radiator. A heat sink or top-up room's TRV setpoint is at least its reading + 1 K, rounded up, so its own hysteresis cannot keep it shut. Relay time with no TRV open: 0 % in simulation (was 3 to 6 %), asserted in `tests/sim`. A top-up-only room does not count as open for the no-heat check |
| 5.5 Store schedule, up to 4 windows | done | `core/decide.py`, `config/site.py` | |
| 5.5 Store boost | done | `server/app.py` | |
| 5.5 Priority awareness: no heat during recovery, learning gated | done | `core/decide.py` | |
| 5.5 Learned recovery time | missing | `core/types.py` `recovery_s` | Fixed (25 min default) |
| 5.6 Burner hours, starts, burn-length histogram, starts per hour per day | done | `core/accounting.py` `Ledger`, `core/persist.py` | Per local day, from the observed relay; today and yesterday under `accounting` in `describe()`. A day Radiate did not see in full (started after midnight, or more than 30 min unseen, including downtime) is `partial` and has no balance score |
| 5.6 Litres and kWh from the nozzle rating | done | `core/accounting.py` | Relay time, so an upper bound (about 60 % high in simulation) until a firing signal exists |
| 5.6 Firing time from relay power metering | missing | | |
| 5.6 Short-cycle alert | done | `core/health.py` `ShortCycle` | Counts observed relay starts; physical burner starts inside a long call need a firing signal (open question 1) |
| 5.7 Shelly watchdog script | done | `shelly/radiate-watchdog.js` | |
| 5.7 Heartbeat every tick, fallback windows in KVS | done | `drivers/shelly.py` | |
| 5.7 Hand-back: the guard adopts the relay as found | done | `core/boiler.py` `adopt`, `core/decide.py`, `core/persist.py`, `drivers/live.py` | A burn Radiate did not start gets a full minimum burn from when it is seen; a stop seen, or a relay unseen for 5 min (downtime, Shelly unreachable, first start), restarts minimum off. In safe mode Radiate follows the watchdog's burns and leaves them alone. The Shelly does not report when the relay changed (`timer_started_at` is the last `toggle_after` re-arm), so `Snapshot.heating_relay_age_s` is not filled yet. Simulated crash and Zigbee outages with Radiate back mid-burn and mid-rest: no guard violations over 3 seeds (`tests/sim/test_watchdog_handback.py`) |
| 5.7 Hard auto-off on channel 1 | done | `drivers/shelly.py` `toggle_after` | |
| 5.7 `radiate shelly install-watchdog --yes` | done | `cli.py` | |

## 6. Control loop

| Item | Status | Where | Note |
|---|---|---|---|
| Pure `decide` with reasons and alerts | done | `core/decide.py` | |
| Every 60 s | done | `server/runtime.py` | |
| Extra tick on significant input change (5 s debounce) | missing | | Fixed interval only |
| Decision log | done | `server/runtime.py` | Boiler, disturbance and safe-mode reasons; in memory, last 500 |
| Record every tick's snapshot and actions; replay | done | `core/history.py`, `server/history.py`, `server/replay.py`, `cli.py` `replay` | `history` table in `radiate.db`, `house.history_days` (14) retention, about 1.2 MB a day. Replay with the same code and configuration gives no differences. Live driver only |

## 7. Failure modes

| Failure | Status | Where | Note |
|---|---|---|---|
| Room sensor stale | partial | `core/decide.py` | Falls back to the TRV reading and stops sending external temperature; learning is not switched off (open question, spec 4.6) |
| TRV offline | partial | `core/decide.py`, `drivers/live.py` | Excluded from demand and learning, alert raised; not counted as possibly open in the supply factor |
| Coordinator or MQTT down: safe mode | done | `core/decide.py` `force_stop`, `drivers/live.py` | Broker disconnected or Zigbee2MQTT offline marks every TRV unreachable; relay off after minimum burn (the off command is now sent; before, the relay stayed on until the watchdog took over), then no relay commands and no heartbeat, so the watchdog takes over. Radiate follows the watchdog's burns meanwhile and adopts the relay on hand-back |
| Radiate process dies | done | `shelly/radiate-watchdog.js`, schedule mirror | Simulated in `tests/sim` |
| Radiate restarts | done | `core/persist.py`, `server/store.py` | Timers moved on by the downtime; after 5 min or more down, or with no saved state, restarted from the relay as found (hand-back) |
| Home Assistant down | done | | Control does not depend on HA |
| Internet down, telemetry buffered 7 days | done | `server/store.py` `SqliteQueue` | |
| Boiler lockout or out of oil | done | `core/health.py` `NoHeat`, `core/decide.py` | Simulated empty tank caught within 3 h; no false alarms over 3 seeds and the cold scenario. Thresholds are simulator-tuned: check on the real house |
| Valve stuck or calibration lost | partial | `core/health.py` `ValveCheck`, `core/decide.py` | "No warming in 3 burns" done and saved across restarts; simulated seized valve flagged within a day, no false flags over 3 seeds and the cold scenario. "Rise with valve closed" done (`valve.leaking`, 1 K TRV rise against the room in 2 of 5 burns, saved across restarts): a 20 % leak on the dining radiator is flagged within two days on seeds 1 to 3, with no false flags over 3 seeds and the cold scenario. Leaks on the far bedrooms and the bathroom pass too little water to show. The 1 K threshold is simulator-tuned and the simulator has no heat conducted up the valve body: check on the real house. Recalibration offer missing |
| Short-cycling: raise minimum off for 24 h | done | `core/health.py`, `core/decide.py`, `core/persist.py` | Effective minimum off and the adaptation in `describe()` (`boiler.min_off_s`, `boiler.short_cycle`) |
| Overheating with the valve closed | partial | `core/disturbance.py` | Gates learning (`unexplained_heat`); no alert, no valve check |
| Frost | done | `core/decide.py` | |
| Clock jump or DST | done | `server/runtime.py`, `drivers/live.py` | Monotonic timers; schedules in local time (`next_change` is out by an hour across a DST change) |
| Corrupt learned state | partial | `core/persist.py`, `core/bootstrap.py` | A saved state that can't be read is relearned from the tick history; a single corrupt room is reset to priors and logged, without a replay or a UI alert |

## 8. Interfaces

| Item | Status | Where | Note |
|---|---|---|---|
| `GET /api/v1/house`, `/state`, `/decisions?since=` | done | `server/app.py` | |
| `POST /rooms/{id}/setpoint` | done | `server/app.py`, `server/runtime.py` `set_override` | Ends at the next schedule change by default, or after `duration_min`, or `until: cleared`; saved in SQLite; `override` in `describe()` |
| `POST /rooms/{id}/fire`, `/store/boost`, `/mode` | done | `server/app.py` | Manual fire flag is not persisted; `fire_switch` in `describe()` |
| `WS /api/v1/stream` | done | `server/app.py` | |
| Local token auth, ingress auth | done | `server/app.py` | |
| HA: climate per room | done | `custom_components/radiate/climate.py` | Setting the target creates an override; override setpoint, `until` and minutes left as attributes |
| HA: room sensors (opening, gain, loss, lag, confidence) | done | `custom_components/radiate/sensor.py` | |
| HA: learning state sensor | done | `custom_components/radiate/sensor.py` | Plain text, not an enum, because the set of gates can grow |
| HA: "fire lit" switch | done | `custom_components/radiate/switch.py` | Posts `rooms/{id}/fire`, shows `fire_switch`; the "Fire detected" binary sensor stays |
| HA: boiler state, starts | done | `custom_components/radiate/sensor.py` | Starts today and in the last hour; relay starts, not physical burner starts |
| HA: burner hours, litres today, balance score | done | `custom_components/radiate/sensor.py` | Burner hours, starts, litres and kWh today (`total_increasing`, reset at local midnight; litres and kWh only with a nozzle rating) and yesterday's balance score |
| HA: stuck valve, short-cycling, alerts | done | `custom_components/radiate/binary_sensor.py`, `sensor.py` | Problem binary sensor per room from `valve.untrusted`; short-cycle extra off time; alert count with codes and messages from `alert_details`. No repairs issues |
| HA services `boost_store`, `set_mode` | done | `custom_components/radiate/__init__.py` | |
| HA services `set_override`, `clear_override` | done | `custom_components/radiate/climate.py` | Entity services on Radiate climate entities; `until` and `duration_min` as in `POST /rooms/{id}/setpoint` |
| HA service `recalibrate_valve` | missing | | Blocked: no TRVZB calibration command to send (see "Manual recalibration service") |

## 9. Elastic export

| Item | Status | Where | Note |
|---|---|---|---|
| Room stream | partial | `export/elastic.py` `room_docs` | No `temperature.trv`, `model.eta`, or shower, window and cooker flags |
| Boiler stream | partial | `export/elastic.py` `boiler_doc` | No `boiler.firing` or `store.recovering` |
| Decision stream | done | `export/elastic.py` | |
| Daily stream with balance score | done | `export/elastic.py` `daily_doc`, `server/runtime.py` | Sent when the core closes a day; index template `radiate-daily`; `radiate.partial_day` marks a day not seen in full; balance score not weather-normalised |
| Common fields | partial | `export/elastic.py` | No `host.name` (edge id) |
| TSDS index templates | done | `export/elastic.py` `index_templates` | Built in code; no install command |
| On-disk buffer, 7 days, batch 500 or 10 s | done | `server/store.py`, `export/elastic.py` | |
| Kibana dashboard | missing | | |
| OTLP path | missing | | Spec marks it as planned |

## 10. User interface

Another change is refactoring `web/`; these rows were not audited in depth.

| Item | Status | Where | Note |
|---|---|---|---|
| House view: room cards, valve bar, reasons, learning state | done | `web/` | |
| Boiler strip with 24 h burn timeline and countdowns | done | `web/app.js` | Countdown uses the effective minimum off; short-cycling note under the guard bar |
| Why the burner is on | done | `web/app.js` `statusLine` | Names burn extensions ("Topping up") and heat sinks separately, from `rooms[].extend` |
| Setpoint control and hold | done | `web/app.js`, `server/bridge.py` | Stepper per room, 0.5 °C steps, 5 to 28 °C; shows the hold and resumes the schedule. Server and demo |
| Daily accounting and stuck valves in the UI | done | `web/app.js` | Burner hours and starts today, yesterday's balance score ("Not a full day of data" for a partial day), a line on a room whose valve may be stuck |
| Setup wizard | partial | `config/discover.py`, `drivers/mqtt.py` `read_retained`, `cli.py` | `radiate discover` drafts the YAML from Zigbee2MQTT device names, descriptions and groups, with TRVZB firmware warnings. No UI wizard yet; heat sources, bypass radiators and the boiler relay are still marked by hand. Untested against a real broker |

## 11. Simulator

| Item | Status | Where | Note |
|---|---|---|---|
| Hydraulics, boiler thermostat, store priority, disturbances | done | `sim/house.py`, `sim/runner.py` | |
| Baseline against Radiate, guard checks | done | `sim/runner.py`, `tests/sim` | |
| Crash and fire scenarios | done | `tests/sim/test_reference_house.py` | |

## Coverage matrix v1 items not covered above

| Feature | Status | Where | Note |
|---|---|---|---|
| Pin closing = 100 minus opening | done (deliberately not) | `drivers/z2m.py` | Spec 4.5 chose governed mode instead; closing degree is 100 |
| Valve feedback plausibility | partial | `core/health.py` `ValveCheck` | Command against TRV temperature response, both ways: cold when open (stuck), warming when shut (leaking) |
| Manual recalibration service | missing | | Blocked. The Zigbee2MQTT TRVZB definition (`zigbee-herdsman-converters` `src/devices/sonoff.ts`, commit `9836843`, checked 19 November 2026) has no calibration command. It exposes only `idle_steps` and `closing_steps`, both read-only diagnostics. The newer TRV-ZBT has a writable `valve_travel_calibration`; the TRVZB does not. Revisit if a firmware or converter update adds one |
| External temperature keepalive under 2 h | done | `drivers/z2m.py` | 25 min default |
| Seed write-only entities at start | done | `drivers/z2m.py` | Writers start empty, so the first tick sends everything |
| PI fallback controller | missing | | Rooms use the TRV's own thermostat in governed mode; unsure whether a PI is still wanted |
| Auto-tuning (from model learning) | done | `core/estimator.py` | |
| Tolerance band, overshoot protection | done | `core/decide.py` | Hysteresis latch, TRV closes at setpoint |
| Optimum start | done | `core/decide.py` `_preheat_due` | |
| Presets (comfort, eco, away) | partial | `server/app.py` `/mode` | `auto`, `off`, `frost` only |
| Summer or outdoor cut-off | missing | | |
| Central mode (house off, frost) | done | `core/decide.py` | |
| Learned state persistence | done | `core/persist.py` | |
| State sanitising | done | `core/persist.py` | |
| Manual learning pause | partial | | Only through the fire switch |
| Rise at 0 % opening as heat-source hint | done | `core/disturbance.py` | |
| Weighted demand | partial | | See 5.3 |
| Activation delay (valve lead) | done | `core/boiler.py` | |
| Heat-available signal to rooms | done | `core/decide.py` | Inferred from relay and store state |
| Fail-soft ladder | partial | | See section 7 |
| Command safety clamp | done | `drivers/z2m.py` | |
| Battery and availability alerts | partial | `drivers/live.py` | Availability only |
| Diagnostics download, events | missing | | HA integration |
| Discovery of TRVs and sensors by HA area | partial | `config/discover.py` | `radiate discover` reads `area: NAME` from the Zigbee2MQTT device description, not from Home Assistant's area registry |
| Options or reconfigure flow | missing | | |
| House balancing dashboard card | done | `web/` | Web UI, not a Lovelace card |

## Next steps

Larger items left for later, each with a short design note.

- **Check the TRV setpoint frame on the pilot valve.** Confirm the TRVZB opens when its reading is 0.5 K below the setpoint, and that a heat sink sent its reading + 1 K opens. If the toilet runs warm, set its `trv_bias_k` closer to 0, for example -1.0 K.
- **Check the leak threshold on the pilot valve.** With the valve shut and the boiler firing for an hour, note how far the TRV's reading rises against the room sensor. The leak check flags 1 K; if heat conducted up the valve body alone comes close, raise `LEAK_RISE_K`.
- **Recalibration.** The TRVZB has no calibration command in Zigbee2MQTT, so there is nothing for a `recalibrate_valve` call to send. Until there is, the stuck and leaking valve alerts are the prompt to recalibrate the valve by hand as its manual describes. If a converter update adds a command, add `POST /api/v1/rooms/{id}/recalibrate` in `server/bridge.py` and `server/app.py`, turned into that write by the live driver and logged in dry run.

- **Learn `κ` (supply sensitivity).** Fit one house-wide `κ` by regressing each room's observed warm-up rate against `Σ f(o_j)` at the time, using only burns that pass every learning gate. Low value in this house (see [simulation](simulation.md)); collect real data first.
- **Learn `η` per room.** Needs burns with few and with many valves open for the same room. Store per-room pairs of (supply factor, fitted gain) per burn and fit the log-log slope after 10 qualifying burns. Feeds the allocator's emitter-limited rule and the "bigger radiator" advice.
- **Learn the valve dead zone.** Per valve, the smallest commanded opening that produced a `T_trv` rise within the arrival lag plus 20 min. Needs deliberate low openings, so tie it to the summer valve exercise or a one-off calibration burn.
- **Learn the store recovery time.** Median time from store relay on to `T_trv` rising again on any open radiator, over the last 15 recoveries. Replaces the fixed `recovery_s` in the store-recovery gate.
- **Recorder bootstrap.** The standalone database's tick history is replayed already. Left: the Home Assistant recorder as a second source, for installs that start with no tick history, and relearning a single room whose saved model is corrupt.
- **Setup wizard.** `radiate discover` drafts the YAML file from the command line. Still to do: a UI wizard on top of it (wait for the web refactor) and Home Assistant areas through the integration.
- **Cloud edge.** Out of scope until the local editions are proven (ADR-0002).
- **Burner firing from relay power.** Add `burner_firing` to the snapshot from the Shelly `apower` once the OFTEC engineer confirms the wiring (spec open question 1), and use firing time for accounting.
