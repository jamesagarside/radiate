# Implementation status

The v1 specification ([spec.md](spec.md)) and the v1 items of the [coverage matrix](research/coverage-matrix.md) ("Radiate standalone" column), checked against the code. Update this page in the same change as the code.

Last audit: November 2026, against `main` at `c4657fe`. On 19 November 2026 the spec was reconciled with the code at `925b7a1`: where the code had deliberately gone another way the spec now describes the code, and the rows below changed to match.

**Status:** done (matches the spec), partial (works, but differs from the spec or misses part of it), missing (not in the code), planned (designed and in an implementation plan, not in the code). Paths are relative to `src/radiate/` unless they start with a top-level folder. "Unsure" marks a row the audit could not settle from the code alone.

## Summary

| Status | At audit | Now |
|---|---|---|
| Done | 82 | 162 |
| Partial | 26 | 20 |
| Missing | 37 | 20 |

Gaps closed since the audit: safe mode now hands the boiler to the Shelly watchdog (it kept the heartbeat going, so a Zigbee or MQTT outage left the house without heat), and the boiler guard adopts the relay when Radiate takes it back; boiler lockout and out-of-oil detection; short-cycle detection and adaptation; oil and runtime accounting with the daily Elastic stream and balance score; setpoint overrides that expire and survive restarts; stuck and leaking valve detection; Home Assistant entities and services for accounting, overrides, the fire switch, stuck valves, short-cycling and alerts. Two rows moved from done to partial when simulation showed valves Radiate counted as open staying shut; both are fixed, and relay time with no TRV open is now measured in simulation (0 %, down from 4.2 %). Days Radiate did not see in full are marked partial and get no balance score. Every live tick is now recorded for replay (`radiate replay`), the learner bootstraps from that history, and `radiate discover` drafts the configuration from Zigbee2MQTT. On 20 November 2026 the owner's three behaviour choices went in (spec 0.3): a configurable learning memory, two years by default, with change detection; `eco` and `comfort` demand modes, `eco` by default and changeable at runtime through `/api/v1/settings`; and no learning from the TRV reading while a room's own sensor is stale. The same day the demand mode got an Eco and Comfort control in the web UI and a select in Home Assistant, and each room in `state` gained `reason_code`. The Home Assistant integration then moved to its own Apache-2.0 repository, radiate-ha, so it can pass HACS validation. On 22 November 2026 the web UI gained a Devices view with battery, signal, availability and last seen for every device, a user-started Zigbee network scan, and low battery, weak signal, offline and silent sensor alerts. The same day it gained house suggestions: advice derived from the learned room models, the leak check and the devices, with how far each room's learning has got. On 23 November 2026 the web UI got a new look and a house model at the top of the House page, with a room editor whose layout is saved through `/api/v1/layout`, and the status line stopped calling the boiler idle when no boiler relay is configured. The same day it gained a Guide tab explaining how to read and work the system, with help lines on the main plates linking into it. After a dead phone held a one-person household at frost, presence now fails warm (ADR-0005): it counts as away only while the trackers themselves report, a person can say they are home, signs of someone in set presence aside, and presence alone never holds frost. Also on 23 November, after the reference house went live, burner firing from the Shelly's power reading went in: heat availability, store recovery and litres now follow the burner where a channel shows it. Learning stopped taking heat for granted (no learning without a relay reading, or in a dry run without metering), a confident but wrong model can no longer lock itself behind `unexplained_heat`, the fire rules need the radiator cold, and `POST /api/v1/learning/reset` puts models learned under invalid conditions back to their priors. On 24 November 2026 learned state started surviving upgrades (ADR-0007): migrations from each older saved format, a parameter that is not plausible goes back to its prior on its own, provenance with each room's learning, invalidation rules (the first resets dry-run learning once the burner is metered) and learning notes in the web UI.

Top remaining gaps, most important first:

1. **Litres are an upper bound** where the relay's power reading does not show the burner (section 5.6, open question 1).
2. **Valve recalibration service** (section 7): blocked, the TRVZB has no calibration command in Zigbee2MQTT (see the row below).
3. Learning extras: house-wide `κ`, flow sensitivity `η`, valve dead zone, store recovery time, bootstrap from the Home Assistant recorder (sections 4.1 to 4.3, 5.5).
4. **TRV bias refinement** for internal-sensor rooms (section 4.6): tried and dropped, see the row below.

## 2. House model

| Item | Status | Where | Note |
|---|---|---|---|
| Rooms with roles `normal`, `passive`, `internal_sensor_only`, `unheated` | done | `core/types.py` `RoomConfig`, `config/site.py` | |
| Unheated rooms: sensor and no radiator, recorded and shown only | done | `core/types.py` `RoomRole.UNHEATED`, `config/site.py`, `core/decide.py`, `server/runtime.py`, `server/bridge.py`, `export/dashboard.py`, `web/app.js` | Needs a `sensor`; no `trv`, `schedule` or `heat_source`; humidity recorded by default. Not controllable, so no engine state, demand, frost trip or learning, and never counted as heat arriving in the no-heat check. In `house` and `state` (`setpoint` is null, and the API refuses one), the tick history, the Elastic room stream, the web UI ("No radiator") and the Home Assistant dashboard. `radiate discover` still proposes sensor-only rooms as commented-out `passive`, with a note to use `unheated` for a room with no radiator. Not in the simulator's reference house. Web card not visually checked in a browser |
| Unheated-room temperatures in the room model | missing | | Open question 5 in spec section 12: for the owner to settle. Needs room adjacency in the configuration |
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
| TRV battery | done | `drivers/live.py`, `drivers/devices.py` | Battery, link quality and last seen for every TRV and sensor, shown in `GET /devices` and the Devices view. At or below `monitoring.low_battery_pct` (20 %) it alerts `device.low_battery`. Not fed to the core, which needs only availability |
| Outdoor temperature | done | `drivers/live.py`, `core/outdoor.py`, `server/runtime.py` | Local Z2M sensor, or Home Assistant through `POST /api/v1/outdoor` (a weather or temperature entity, picked in radiate-ha's options), chosen by `house.outdoor_source` (`zigbee` by default, `home_assistant` or `both`). Readings outside -40 to 50 °C or older than `house.outdoor_stale_after_min` count as missing; 5 °C assumed without one, with alert `outdoor.stale` when Home Assistant is the source. No weather provider of Radiate's own. Untested against a real Home Assistant |
| Heating and store relay state | done | `drivers/shelly.py` | |
| Relay power (burner firing) | done | `drivers/shelly.py` `BurnerMeter`, `drivers/live.py`, `core/types.py` `Snapshot.heating_burner`, `store_burner`, `relay_observed` | Threshold with hysteresis per channel, trusted once a channel has read at or above it; `shelly.burner_metering`, `burner_threshold_w`, `burner_hysteresis_w`. Tested in `tests/drivers/test_shelly.py`, `test_live.py` |
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
| 4.2 Flow sensitivity `η` | missing | `core/allocator.py` `AllocRoom.eta` | Always the 0.7 default; no emitter-limited report. House suggestions have a separate "radiator may be too small" check from the learned capacity |
| 4.3 RLS with forgetting, priors, bounds | done | `core/estimator.py`, `config/site.py` `_learning` | Memory from `learning.memory_days`, default 730 days of learning (was a fixed 33 hours) |
| 4.3 Change detection and re-learning | done | `core/estimator.py` `change_detected`, `relearn`; `core/persist.py` | Drive-weighted and level residual bias; adds 30 % of the prior covariance back. Statistics saved with the model; reason `learning.relearn`. Watches samples held back by `unexplained_heat`, not `cooker_spike` and not while sun-shaped (08:00 to 17:00 with the outdoor 1 K above its low since midnight); judges a confident model (0.8) before the warm-up against twice its gain; a change from held-back samples or before the warm-up re-learns only once it persists (heating periods 18 h and 6 h of the day apart, `RoomEstimator.misfits`, not saved); 60 heating updates of doubt after a re-learn. Tested in `tests/core/test_estimator.py`, `test_heat_availability.py` and `tests/sim` (`radiator_output`) |
| 4.3 Learning reset | done | `core/decide.py` `reset_learned`, `server/runtime.py` `reset_learning`, `POST /api/v1/learning/reset` | Model, arrival lags and lockshield histogram back to priors; logs `learning.reset`. Tested in `tests/core/test_heat_availability.py`, `tests/server/test_api.py` |
| 4.3 Learned state across upgrades | done | `core/persist.py` `MIGRATIONS`, `migrate`, `server/runtime.py` `_keep_newer` | ADR-0007. Engine state format 2; version 1 saves are brought forward, their models discounted once (`CARRY_OVER_DISCOUNT`). A newer save is kept untouched under `engine.v<N>`. Tested from fixtures of what each past version wrote, `tests/core/fixtures`, in `tests/core/test_learning_upgrades.py` and `tests/server/test_learning_upgrades_runtime.py` |
| 4.3 Provenance and invalidation rules | done | `core/provenance.py`, `core/decide.py` | Updates counted by condition, learner version, days and Radiate version per room. Rule `dry_run_unmetered` resets learning from an unmetered dry run, or a save without provenance, once the burner is metered; reason `learning.invalidated` |
| 4.3 Learning notes | done | `server/runtime.py` `learning_notes`, `web/app.js` `renderLearningNotes` | Migrations, dropped parameters and resets for 14 days, in `state` and the web UI's Learning notice; kept in the state database |
| 4.6 Gate: heat unknown | done | `core/decide.py` | No learning without a relay reading, or in a dry run without burner metering. Tested in `tests/core/test_heat_availability.py` |
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
| 4.6 Gate: sensor fresh | done | `core/decide.py` | `sensor_stale` while a normal room uses its TRV fallback and for the 15 min slope window after; `learning.learn_on_trv_fallback: true` keeps learning |
| 4.6 Gate: window | done | `core/disturbance.py` | |
| 4.6 Gate: store recovery | partial | `core/decide.py` | Follows the store burner with metering; otherwise time-based, with no "`T_trv` rising again" check |
| 4.6 Gate: settled after setpoint change | done | `core/decide.py` | |
| 4.6 Gate: shower | done | `core/disturbance.py` | |
| 4.6 Gate: valve rejected (reconciler failure), stuck or leaking | done | `core/decide.py`, `drivers/live.py` | Settings the TRV rejected reach the core as `RoomInput.trv_rejected` and pause learning while they last and for an hour after (`valve_rejected`), listed per room as `valve.rejected` in `describe()`. Not reported in dry run, where nothing is sent. A stuck (`valve_untrusted`) or leaking (`valve_leaking`) valve also pauses learning |
| 4.6 Gate: not passive | done | `core/decide.py` | Passive and unheated rooms have no engine state |
| 4.6 Open fire detection, closing and 4 h hold-off | done | `core/disturbance.py` | Residual threshold 2.0 K/h with confidence ≥ 0.6, and the rise rule needs the radiator off 30 min (tuned in simulation, now in the spec). Both need the radiator cold (TRV no more than 1 K above the room); the rise rule needs heat known; the residual rule stands down while the model is in doubt. Whether the TRVZB's `local_temperature` is its own sensor with an external sensor selected is still to be confirmed on the pilot valve |
| 4.6 Reading window restarts when the temperature source switches | done | `core/decide.py` `RoomState.source` | Sensor to TRV fallback and back, so a restart's 1.5 K step is not a rise or a window |
| 4.6 Range cooker: free `d`, cooking spikes excluded | done | `core/estimator.py`, `core/disturbance.py` | |
| 4.6 Range cooker "self-heated" after 14 days | missing | | |
| 4.6 Stairs bypass in the supply factor | done | `core/types.py` `bypass_equivalent` | |
| 4.6 Stairs rise as a heat-availability check | done | `core/health.py` `NoHeat` | A 0.3 K rise on a passive room counts as heat in the no-heat check; an unheated room's never does |
| 4.6 Toilet: TRV reading with bias, 1.0 K hysteresis, never sets the pace | done | `core/decide.py` | The TRV setpoint goes out as `target - bias` (plus the call bias, rounded up), so the TRV opens when the core calls |
| 4.6 Toilet: bias refinement, confidence capped at 0.5 | partial | `core/decide.py` `new_estimator` | Confidence cap done. Bias refinement deliberately not done: with a cold radiator the observed offset is about 0 K, but the bias also has to cover the warm radiator, and every variant tried in simulation left the toilet short of heat and raised the house comfort deficit ([simulation](simulation.md#internal-sensor-rooms-and-the-trv-bias)) |

## 5. Boiler logic

| Item | Status | Where | Note |
|---|---|---|---|
| 5.1 Guard parameters and ranges | done | `core/types.py`, `config/site.py` | |
| 5.2 State machine IDLE, LEAD, FIRING, REST | done | `core/boiler.py` | |
| 5.2 Frost override, hard frost ignores minimum off | done | `core/boiler.py`, `core/decide.py` | |
| 5.3 Pooled demand `D` (gain-weighted) | done | `core/decide.py` `_pooled_demand_s` | `eco` demand mode, the default: `Σ gap / a` must reach 1.5 minimum burns, or one room the eco limit. Weighted by `1/a`, not `a` as planned (spec 5.3 explains why). `comfort` keeps the earlier rule. Mode from `boiler.demand_mode` or the runtime setting, recorded in each tick's snapshot |
| 5.3 Fire rules (comfort limit, 1.5 × minimum burn, optimum start) | done | `core/decide.py` | |
| 5.3 Stop rule | done | `core/decide.py` | Demand latch: stop when no room is calling or extended. The spec now describes this instead of "predicted to arrive within one tick" |
| 5.3 Burn extension (top-up) | done | `core/decide.py` | |
| 5.3 Store merging (opt-in) | missing | | |
| 5.4 Open-path guarantee with heat sinks | done | `core/decide.py` `_ensure_sink`, `_trv_setpoint` | Each room calling or topped up counts as one open radiator. A heat sink or top-up room's TRV setpoint is at least its reading + 1 K, rounded up, so its own hysteresis cannot keep it shut. Relay time with no TRV open: 0 % in simulation (was 3 to 6 %), asserted in `tests/sim`. A top-up-only room does not count as open for the no-heat check |
| 5.5 Store schedule, up to 4 windows | done | `core/decide.py`, `config/site.py` | |
| 5.5 Store boost | done | `server/app.py` | |
| 5.5 Priority awareness: no heat during recovery, learning gated | done | `core/decide.py` | With metering, recovery is exactly while the store burner fires |
| 5.5 Learned recovery time | missing | `core/types.py` `recovery_s` | Fixed (25 min default) |
| 5.6 Burner hours, starts, burn-length histogram, starts per hour per day | done | `core/accounting.py` `Ledger`, `core/persist.py` | Per local day, from the observed relay; today and yesterday under `accounting` in `describe()`. A day Radiate did not see in full (started after midnight, or more than 30 min unseen, including downtime) is `partial` and has no balance score |
| 5.6 Litres and kWh from the nozzle rating | done | `core/accounting.py` | From burner hours: firing time where metered (basis `firing`), relay time otherwise (`relay`, an upper bound), `mixed` for a day with both; `relay_hours` and `litres_relay` always |
| 5.6 Firing time from relay power metering | done | `core/accounting.py` `Ledger` | Heating and store firing hours, burner lightings and store litres; a dry run's relay time is not burner time and its burns get no arrival spread; a relay not read counts nothing |
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
| Decision log | done | `server/runtime.py` | Boiler, disturbance, safe-mode, `learning.relearn`, `learning.invalidated` and `learning.reset` reasons; in memory, last 500 |
| Record every tick's snapshot and actions; replay | done | `core/history.py`, `server/history.py`, `server/replay.py`, `cli.py` `replay` | `history` table in `radiate.db`, `house.history_days` (14) retention, about 1.2 MB a day. Replay with the same code and configuration gives no differences. Live driver only |

## 7. Failure modes

| Failure | Status | Where | Note |
|---|---|---|---|
| Room sensor stale | done | `core/decide.py` | Falls back to the TRV reading and stops sending external temperature; learning pauses (`sensor_stale`) unless `learning.learn_on_trv_fallback` is `true` |
| TRV offline | partial | `core/decide.py`, `drivers/live.py` | Alert raised, learning paused; with a fresh room sensor it still counts for demand (fail warm), and stops counting if heat doesn't warm it; not counted as possibly open in the supply factor |
| Fail warm: warn when a saved household hides the house file's | done | `config/site.py` `shadowed_household_keys`, `server/setup.py`, `cli.py` | Precedence unchanged; `check-config`, the start-up log and `GET /api/v1/household` name the hidden settings |
| Fail warm: room sensor plausibility | done | `core/decide.py` `_implausible_sensors` | Out of range or frozen while its TRV and other rooms move: treated as missing. Hard frost from a room sensor needs a second source. No check of a sensor that reads plausibly but wrong (on a shelf by the radiator) |
| Fail warm: manual fire flag expires | done | `server/runtime.py` `set_fire`, `config/site.py` | 6 hours by default, local midnight at the latest. Auto-clearing when the room cools is not built |
| Fail warm: room sensor readings remembered across a restart | done | `drivers/live.py` `sensor_memory`, `drivers/z2m.py` `Device.remember`, `server/runtime.py`, `core/decide.py` | True age carried forward; no step into slopes or detectors; no TRV fallback before the stale limit. Z2M's own `last_seen` is not used |
| Fail warm: the TRV disagrees (idle while its room calls and heat flows) | done | `core/decide.py` `_watch_trv` | Setpoint stepped up to at most target + 3 K, alert `valve.trv_disagrees`. Thresholds are a first guess: check on the real house |
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
| Fail warm: fallbacks built for everyone at home | done | `config/site.py` `fallback_schedule_for`, `drivers/shelly.py` `fallback_heating_windows`, `drivers/live.py` | The schedule mirror and the watchdog's windows ignore away; the windows are never empty. A flat day heats all day only at an in use or occasional level (`SiteConfig.fallback_level`), or with no level above the unused temperature and damp floor. The watchdog still does nothing without a clock (spec open question 11) |
| Corrupt learned state | partial | `core/persist.py`, `core/bootstrap.py` | A saved state that can't be read is relearned from the tick history; a parameter that is not plausible goes back to its prior alone, and a model that can't be read resets its room, each logged and shown as a learning note; no replay for one room |

## 8. Interfaces

Rows starting "HA:" are in the [radiate-ha](https://github.com/jamesagarside/radiate-ha) repository since 20 November 2026 ([ADR-0003](adr/0003-separate-home-assistant-integration.md)). `tests/server/test_ha_contract.py` checks that the server still returns every field radiate-ha is tested with.

| Item | Status | Where | Note |
|---|---|---|---|
| `GET /api/v1/house`, `/state`, `/decisions?since=` | done | `server/app.py` | |
| `POST /rooms/{id}/setpoint` | done | `server/app.py`, `server/runtime.py` `set_override` | Ends at the next schedule change by default, or after `duration_min`, or `until: cleared`; saved in SQLite; `override` in `describe()` |
| `POST /rooms/{id}/fire`, `/store/boost`, `/mode` | done | `server/app.py` | Manual fire flag is not persisted and expires after `house.fire_flag_hours` (6) or at local midnight; `fire_switch` and `fire_switch_expires_in_min` in `describe()` |
| `POST /learning/reset` | done | `server/app.py`, `server/bridge.py` | |
| `GET /people`, `POST /people/{id}/away`, `/people/{id}/presence` | done | `server/app.py`, `server/bridge.py`, `server/runtime.py` | Away until and Home Assistant presence per person; saved in SQLite; `away` in `describe()`, `people` in `house()` |
| `POST /outdoor` | done | `server/bridge.py` `set_outdoor`, `server/app.py`, `server/runtime.py` `report_outdoor` | Outdoor temperature from Home Assistant, kept in the state database with when it was measured; `outdoor_reading` in `describe()` gives the source in use and its age. Also through the browser demo's bridge, where the simulation stays the source |
| `POST /ha/persons` | done | `server/bridge.py`, `server/app.py`, `server/runtime.py` | The `person` entities Home Assistant has, kept in memory with when they were reported; offered as `ha_persons` in `GET /household` |
| `GET /schedules` | done | `server/schedules.py`, `server/bridge.py`, `drivers/live.py`, `server/demo.py` | Each room's week as used now, in minutes and in words, with away and dropped-period notes. Household rooms add their warm periods (the edges the week view drags), what room adjustments changed, the adjustments in words and the week without them. Drivers report their weeks through an optional `schedules()` |
| `GET /devices`, `POST /devices/scan` | done | `drivers/devices.py`, `drivers/live.py`, `server/bridge.py`, `server/app.py`, `server/demo.py` | Device health and a user-started network scan (one at a time, at most every 10 minutes; 409 and 429 otherwise). The live driver reads Zigbee2MQTT state, `bridge/devices` for routers and firmware, and publishes only `bridge/request/networkmap`, also in dry run. Untested against a real broker |
| `GET`, `PUT`, `DELETE /household`, `POST /household/preview` | done | `server/setup.py`, `server/bridge.py`, `server/app.py`, `config/saved.py`, `config/site.py` | The household setup: read it, preview a draft as the week view, save it to `<data_dir>/household.yaml` (replaces the house file's section) or go back to the house file. The demo keeps it in memory |
| `GET`, `PUT /layout` | done | `server/layout.py`, `server/runtime.py` `set_layout`, `server/bridge.py`, `server/app.py` | Where each room sits, for the web UI's house model only; control never reads it. Saved in the state database (key `layout`) straight away. Validated: 1 to 6 floors, names of 1 to 40 characters, rooms by ID with a floor index and `x`, `y`, `w`, `d` in metres, sides at least 0.5 m, within a 60 m square plan; 400 with the first problem otherwise. Rooms the house file no longer has are dropped on restore. Server and demo |
| `GET` and `POST /api/v1/settings` (demand mode) | done | `server/bridge.py` `set_settings`, `server/app.py`, `server/runtime.py` | Saved in the state database; `settings` and `boiler.pooled_demand_min` in `describe()` |
| `GET`, `PUT`, `DELETE /api/v1/settings/config` | done | `config/settings.py` (registry), `config/saved.py`, `config/site.py` `apply_saved_settings`, `server/settings.py`, `server/bridge.py`, `server/app.py` | Every house-file setting with its source; changes saved to `<data_dir>/settings.yaml` and checked by the house file's parser; live where the registry says `restart=False` (boiler, hot water, balancing, learning on valve fallback, suggestions, device alert limits, outdoor source and staleness, fire flag length), the rest after a restart; hardware changes need `confirm`; secrets write-only. `tests/config/test_settings.py` fails when the parser accepts a key the registry lacks. In-memory in the demo |
| Reason code per room | done | `server/runtime.py` `describe` | `rooms[].reason_code` next to `rooms[].reason`, for example `demand.pooled` |
| `GET /suggestions` | done | `core/suggestions.py`, `server/suggestions.py`, `server/bridge.py`, `server/app.py` | Read-only, every driver. Thresholds in the `suggestions` section. Room checks need `min_learning_h` (48 h) of learning and both `a` and `b` at least `min_confidence` (0.6) certain; comparisons need `min_rooms` (3). In simulation: no room suggestions on the reference house over 8 days and 4 seeds; a room with 2.2 times the heat loss, a radiator at a third of its output and a valve passing a fifth of its flow are each found in their own room within 4 days (`tests/sim/test_house_suggestions.py`). Untested on a real house |
| `GET /api/v1/data`, `/data/series`, `/export` | done | `core/series.py`, `server/data.py`, `server/history.py`, `server/app.py`, `server/bridge.py` | Raw data (spec 9.2): every recorded series by metric and room, from an hourly index of the tick history (`data_series`, `data_hour` in `radiate.db`) built in the background and kept up to date; JSON or `format=csv`. 30 days for 9 rooms (43,200 ticks, 65 series) indexes in 3 s and answers in 15 to 130 ms on a 2024 Mac; not measured on a Raspberry Pi. `radiate serve --demo` records in memory; the browser demo has no history, so it answers `available: false`. `/export` gives the health of each export |
| `WS /api/v1/stream` | done | `server/app.py` | |
| Local token auth, ingress auth | done | `server/app.py` | Unchanged by login: checked first, as admin |
| User login: local users, sessions, CSRF, roles | done | `config/auth.py`, `server/auth/` (`accounts.py`, `passwords.py`, `limiter.py`, `service.py`, `routes.py`), `server/app.py` `identify`, `cli.py` `users` | ADR-0006 (proposed). Off unless `auth.enabled`. scrypt hashes, server-side sessions in `radiate.db` (hashed IDs, 30 days absolute, 7 days idle), `X-CSRF-Token` on cookie writes, admin, household and viewer roles from one permission table (`server/permissions.py`, every route listed, a missing one is admin and fails a test), household saves of room adjustments only (`HouseholdSetup.only_adjustments`), controls a role can't use disabled with a reason in the web UI, failed-login limiting (5 per user, 20 per address in 15 min), `trusted_proxies`. `radiate users list/add/reset-password/set-role/remove`, `--role household` and `--role readonly`. `radiate serve --auth-config` for the demo |
| User login: OIDC | done | `server/auth/oidc.py` | Code flow with PKCE, state and nonce, discovery, JWKS signatures through joserfc (asymmetric algorithms only), `iss`, `aud`, `azp`, `exp`, `iat`, `nonce`; roles from a claim or userinfo. Tested against a fake provider, not yet against a real one |
| User login: SAML | done | `server/auth/saml.py` | Optional extra `radiate[saml]` (python3-saml), not in the standard image or the App. Signed assertions required, SHA-1 refused, `InResponseTo` and assertion IDs used once. Tested with signed fixture assertions, not yet against a real IdP |
| HA: climate per room | done | `radiate-ha: custom_components/radiate/climate.py` | Setting the target creates an override; override setpoint, `until` and minutes left as attributes |
| HA: room sensors (opening, gain, loss, lag, confidence) | done | `radiate-ha: custom_components/radiate/sensor.py` | |
| HA: learning state sensor | done | `radiate-ha: custom_components/radiate/sensor.py` | Plain text, not an enum, because the set of gates can grow |
| HA: "fire lit" switch | done | `radiate-ha: custom_components/radiate/switch.py` | Posts `rooms/{id}/fire`, shows `fire_switch`; the "Fire detected" binary sensor stays |
| HA: boiler state, starts | done | `radiate-ha: custom_components/radiate/sensor.py` | Starts today and in the last hour; relay starts, not physical burner starts |
| HA: burner hours, litres today, balance score | done | `radiate-ha: custom_components/radiate/sensor.py` | Burner hours, starts, litres and kWh today (`total_increasing`, reset at local midnight; litres and kWh only with a nozzle rating) and yesterday's balance score |
| HA: stuck valve, short-cycling, alerts | done | `radiate-ha: custom_components/radiate/binary_sensor.py`, `sensor.py` | Problem binary sensor per room from `valve.untrusted`; short-cycle extra off time; alert count with codes and messages from `alert_details`. No repairs issues |
| HA: demand mode select, pooled demand | done | `radiate-ha: custom_components/radiate/select.py`, `sensor.py` | `select.radiate_demand_mode` (eco or comfort) posts `settings`, sending null for the configured default; `sensor.radiate_pooled_demand` is diagnostic. Neither is created for a server without the keys |
| HA: heating mode select, hot-water store and boost | done | `radiate-ha: custom_components/radiate/select.py`, `binary_sensor.py` | Select posts `mode`; binary sensors from `store.relay` and `store.boost`, no device class. The server reports no boost end time |
| HA: presence, away sensors, `set_away`, `clear_away` | done | `radiate-ha: custom_components/radiate/presence.py`, `options_flow.py` | Options step maps Radiate people to `person` entities and wins; otherwise `ha_person` from `house` (linked in the household setup). State changes posted to `people/{id}/presence`, and every state again every 15 minutes as a heartbeat; an away binary sensor per person, with `person_entity` and `presence_stale`. Every `person` entity posted to `ha/persons` at setup and with the heartbeat, which also reloads the entry when the server's people or links change |
| HA: outdoor temperature from an entity | done | `radiate-ha: custom_components/radiate/outdoor.py`, `options_flow.py` | Options pick a `weather` entity or a temperature `sensor` (none by default); posted to `outdoor` on change and with the 15 minute heartbeat, with `measured_at` from `last_reported`. °F converted to °C |
| HA services `boost_store`, `set_mode` | done | `radiate-ha: custom_components/radiate/__init__.py` | |
| HA services `set_override`, `clear_override` | done | `radiate-ha: custom_components/radiate/climate.py` | Entity services on Radiate climate entities; `until` and `duration_min` as in `POST /rooms/{id}/setpoint` |
| HA service `recalibrate_valve` | missing | | Blocked: no TRVZB calibration command to send (see "Manual recalibration service") |

## 9. Elastic export

| Item | Status | Where | Note |
|---|---|---|---|
| Room stream | partial | `export/elastic.py` `room_docs` | No `temperature.trv`, `model.eta`, or shower, window and cooker flags |
| Boiler stream | partial | `export/elastic.py` `boiler_doc` | `boiler.burner` and `store.burner` from metering; no `store.recovering` |
| Decision stream | done | `export/elastic.py` | |
| Daily stream with balance score | done | `export/elastic.py` `daily_doc`, `server/runtime.py` | Sent when the core closes a day; index template `radiate-daily`; `radiate.partial_day` marks a day not seen in full; balance score not weather-normalised |
| Common fields | partial | `export/elastic.py` | No `host.name` (edge id) |
| TSDS index templates | done | `export/elastic.py` `index_templates` | Built in code; no install command |
| On-disk buffer, 7 days, batch 500 or 10 s | done | `server/store.py`, `export/elastic.py` | |
| Kibana dashboard | missing | | |
| OTLP path | done | `export/otlp.py`, `config/export.py`, `cli.py`, `server/runtime.py`, `server/store.py` | Spec 9.1. OTLP/HTTP, protobuf (default) or JSON, encoded with the standard library and checked against `opentelemetry-proto` in the tests. Every raw data series as a gauge a minute, decisions and alerts as log records. `export.otlp` in the house file, or `RADIATE_OTLP_ENDPOINT` and `RADIATE_OTLP_API_KEY` (the App's options). On-disk queues (7 days of ticks, 20,000 log records), backoff to 10 minutes, `Retry-After` honoured, oldest dropped and counted. Tested against a fake collector only; never sent to a real Elastic endpoint. No gRPC, no traces, no metric exemplars |

## 10. User interface

Another change is refactoring `web/`; these rows were not audited in depth.

| Item | Status | Where | Note |
|---|---|---|---|
| House view: room cards, valve bar, reasons, learning state | done | `web/` | |
| Boiler strip with 24 h burn timeline and countdowns | done | `web/app.js` | Countdown uses the effective minimum off; short-cycling note under the guard bar |
| Why the burner is on | done | `web/app.js` `statusLine` | Names burn extensions ("Topping up") and heat sinks separately, from `rooms[].extend` |
| Status line without a boiler relay | done | `web/app.js` `statusLine`, `drivers/live.py` | With `telemetry.boiler_linked` false (no `shelly` section), says the boiler switch isn't linked instead of "Boiler idle", and which rooms want heat. Older servers don't send the field and keep the old wording |
| House model | done | `web/house.js`, `web/house.css`, `web/app.js`, `web/index.html` | Top of the House page: an axonometric model of the house with each room coloured by its temperature and a radiator bar while it takes heat; selecting a room shows its line and a "Room controls" link to its card. Beside it, "The house now" (rooms calling, every room on a 12° to 22° scale, boiler, dry run or mode, devices, learning, coming up); below, today's plan. Until a layout is saved, rooms are placed by a guess from their names |
| Room layout editor | done | `web/house.js`, `server/layout.py` | "Arrange rooms": floors (up to 6, named, removable when empty), drag to move and resize with 0.5 m snapping, arrow keys and Shift+arrows, a tray of rooms not placed yet, "Start again", and a live preview. Saved with `PUT /layout` |
| Setpoint control and hold | done | `web/app.js`, `server/bridge.py` | Stepper per room, 0.5 °C steps, 5 to 28 °C; shows the hold and resumes the schedule. Server and demo |
| Demand mode control | done | `web/app.js` `renderDemand`, `web/index.html` | Eco and Comfort beside the heating mode, a one-line note on what the mode does ("Default:" while it follows the configuration file), and a "Waiting for a burn" badge and status line for a room waiting in eco (`demand.pooled`). Hidden for servers without `settings`. Server and demo |
| Daily accounting and stuck valves in the UI | done | `web/app.js` | Burner hours and starts today, yesterday's balance score ("Not a full day of data" for a partial day), a line on a room whose valve may be stuck |
| Household compiler | done | `config/household.py`, `config/site.py`, `drivers/live.py`, `radiate schedules` | People, routines, use levels and room links in the `household` section compile to two weeks per room: the valve schedule (fixed preheat, fitted to the TRVZB) for the mirror and the Shelly fallback, and the live schedule (periods start when needed, optimum start leads) that Radiate follows. Dropped periods come back as `DroppedPeriod` records too. Room adjustments apply after the routine rules and before the TRVZB fit. `radiate schedules` prints the valve schedule only. See [household setup](proposals/household-setup.md) |
| Household settings | done | `config/household.py`, `config/site.py`, `server/runtime.py` | `household.timing`, `household.away`, `household.weekend_days`, per-person and per-room overrides, and the `while_home` room kind. Every setting optional with the previous behaviour as its default, except that live control now uses optimum start instead of the fixed preheat. `GET /api/v1/house` returns them with defaults and ranges as `household` |
| Week view | done | `web/week.js`, `web/app.js`, `server/schedules.py` | Schedules section in the web UI: seven 24-hour bars per room from `GET /schedules`, showing the live week (when each room should be warm; the valve's own copy starts earlier), temperatures written above warm periods, a now marker, each day in words, rooms changed by someone being away and dropped warm periods called out. Household rooms can be adjusted there (see room adjustments). Pure helpers tested under Node and the DOM in jsdom outside the repo; not visually checked in a browser yet |
| Setup wizard | done | `web/setup.js`, `web/household.js`, `server/setup.py`, `config/saved.py` | Five steps: People (each with an optional Home Assistant person, chosen from the list the integration reports or typed as an entity ID), Routines (one screen per person), Rooms, Temperatures, Result as each room's week. Prefilled defaults, an Advanced disclosure per step, errors from the server's parser next to their answer, a draft kept in the browser. Saves `<data_dir>/household.yaml`, which replaces the house file's section; `check-config` and `radiate schedules` take `--data-dir` to agree. Pure logic tested under Node and the DOM in jsdom outside the repo; not visually checked in a browser. Saving keeps room adjustments, which the wizard doesn't ask about |
| Room adjustments | done | `config/household.py`, `config/site.py`, `server/schedules.py`, `web/week.js`, `web/app.js` | `household.rooms.<id>.adjust`: keep a room warm or cold from one time to another on some days, applied in order after the routine rules, to the live times, before the valve schedule is fitted to the TRVZB, and paused while everyone who uses the room is away. In the Schedules section, drag a warm period's edge (pointer or arrow keys, 15 minute steps), see it previewed, then save it; or use the Adjust form. Each room lists its adjustments with Remove and Reset to routine. Saved through `PUT /household`, so the first one copies a household from the house file to `<data_dir>/household.yaml`. Pure helpers tested under Node and the DOM in jsdom outside the repo; not visually checked in a browser or on a touch screen |
| Away | done | `config/away.py`, `server/runtime.py`, `server/bridge.py`, `drivers/live.py`, `web/app.js`, `radiate-ha: custom_components/radiate/presence.py` | Away until (set in the web UI, the API or `radiate.set_away`) and Home Assistant presence after `household.away.presence_delay_min` (60 min). Presence not reported for `presence_stale_after_min` (60 min) counts as unknown. Saved in SQLite. A change recompiles the household and the live driver, mirror and Shelly fallback use the new weeks. Everyone away holds frost in `auto` (or the unused temperature); within `return_warmup_min` (180 min) of a known return, the return becomes each room's next setpoint and optimum start warms the house in time; `off` and `frost` still win. The People section says when presence has gone stale and when rooms are warming up for a return. Not visually checked in a browser yet |
| Fail warm presence ([ADR-0005](adr/0005-fail-warm-presence.md), spec 7) | done | `config/away.py`, `config/household.py`, `server/runtime.py`, `server/bridge.py`, `server/app.py`, `server/schedules.py`, `web/app.js`, `web/setup.js`, `web/index.html` | `not_home` counts as away only while the trackers' `evidence_at` is within `presence_evidence_max_age_min` (240), or `since` without it; router and Bluetooth trackers and phones at 5 % battery or less wait `presence_weak_source_delay_min` (240); "I'm home" (`POST people/{id}/home`, Back now) and home evidence (an override above the room's current target, store boost, fire switch, shower) set presence-based away aside until presence changes. Frost only when everyone has an away until, with room overrides still applied; away by presence floored at 12 °C. radiate-ha sends `evidence_at`, `source_type` and `battery` from a companion change. Not built: `evidence_age_s` on setbacks in `state`, a setup warning for router-only people. Web wording not checked in a browser |
| Home Assistant dashboard | done | `export/dashboard.py`, `radiate dashboard` | Built-in Lovelace cards from the house file. Rooms view: trends over `--hours`, humidity, valve control and activity, batteries. Analysis view: a date picker over long-term statistics, per-room min, mean and max. Reads Zigbee2MQTT entities, and by default the integration's too: boiler state and its timeline, alerts, today's burner hours and starts, the heating mode with buttons to change it, the hot-water store and boost with a boost button, each room's climate entity, opening limit and fire switch. `--no-radiate` leaves the integration out |
| Settings view | done | `web/settings.js`, `web/settings.css`, `web/app.js`, `web/index.html` | Settings tab (`#settings`, sections at `#settings/<id>`), drawn from `GET settings/config`: each setting with help, range, default and source; per-section and per-room save; in-place confirm for hardware changes; go back to the house file per setting, section, room or all; restart band; household and schedules sections open the setup and the Schedules section. Adding or removing rooms, and hand-written schedules, stay in the house file |
| Devices view | done | `web/devices.js`, `web/app.js`, `web/index.html` | House and Devices tabs (`#devices`) with a count of device alerts. Per device: status, problems in words, battery, signal word and LQI, last seen, latest readings, valve opening limit, state and mode, model, firmware and route. A Needs attention list linking to each card, and the Zigbee network with a Scan network button and the route tree. The overview's alerts link to it. Checked in a browser at 1280 and 360 px, light and dark, with the keyboard, on the demo only |
| House suggestions | partial | `core/suggestions.py`, `web/suggestions.js`, `web/app.js`, `web/index.html` | Suggestions tab (`#suggestions`) with a count of suggestions to act on. Built: room loses heat quickly (loss rate against the house's median), radiator may be too small (model capacity with every valve open against the warmest scheduled setpoint and `design_outdoor_c`), radiator slow to warm (arrival lag), valve passing heat when shut (the leak check), weak Zigbee links (latest LQI and, after a scan, the route). A Learning list says how far each room has got. Not built: an unheated room running colder or warmer than its neighbours (needs room adjacency, open question 5 in spec section 12) and the flow-sensitivity report (`η`, section 4.2). Internal-sensor and continuous-heat-source rooms are not judged. Words tested under Node; the view rendered in jsdom against the demo, but not checked in a real browser |
| Login page and account menu | done | `web/login.html`, `web/login.js`, `web/app.css`, `web/app.js`, `web/index.html` | Shown only with login on. Password form, single sign-on buttons, the first-user command when there are no users, errors for refused, locked and failed sign-on. The account menu in the header shows who is signed in and the role, with Sign out. Checked at 360 and 1280 px in light and dark mode against the demo. Viewers aren't shown disabled controls; a change they try reads "Not saved" |
| Guide and help lines | done | `web/guide.js`, `web/guide.css`, `web/index.html`, `web/app.js`, `web/house.js` | A Guide tab (`#guide`, sections at `#guide/<name>`) explaining in plain words what the house model, colours, badges and bars mean, how to hold a temperature and for how long, where schedules come from and which can be changed in the app, hot water and boost, heating and demand modes, away, open fires and range cookers, learning and why it pauses, devices, suggestions, alerts, what happens when Radiate or the network stops, and Home Assistant. Each claim checked against the code. One-line help with a link into it on the house model, the house now, today's plan, rooms, schedules, devices, suggestions and alerts, and a dismissible first-visit note on the House view. Checked in a browser on the demo at 1280, 390 and 360 px in dark mode; light mode not checked by eye |
| Raw data view | done | `web/data.js`, `web/data.css`, `web/index.html`, `web/app.js` | A Raw data tab (`#data`), shown when the server answers `GET /data/series` with a history. Search by room or reading, a reading and room, 6 h, 24 h, 7 days, 30 days or exact times, and a step. Inline SVG chart with one series in ink and the rest muted, the range in each step as a band, keyboard and pointer readout; a table of the newest 500 points; CSV and JSON downloads; the OpenTelemetry export's health. Words tested under Node; checked in a browser on `radiate serve --demo` at 1280 and 390 px, light and dark |
| Configuration from devices | partial | `config/discover.py`, `drivers/mqtt.py` `read_retained`, `cli.py` | `radiate discover` drafts the YAML from Zigbee2MQTT device names, descriptions and groups, with TRVZB firmware warnings. The web UI's setup wizard covers the household, not devices; heat sources, bypass radiators and the boiler relay are still marked by hand. Untested against a real broker |

## 11. Simulator

| Item | Status | Where | Note |
|---|---|---|---|
| Hydraulics, boiler thermostat, store priority, disturbances | done | `sim/house.py`, `sim/runner.py` | |
| Baseline against Radiate, guard checks | done | `sim/runner.py`, `tests/sim` | |
| Crash and fire scenarios | done | `tests/sim/test_reference_house.py` | |

## Planned: efficiency by room use

Designed in [ADR-0004](adr/0004-efficiency-by-room-use.md) and [ADR-0005](adr/0005-fail-warm-presence.md) (both proposed), specified in [spec 7](spec.md#7-failure-modes) (fail warm) and [spec 5.8 and 5.9](spec.md#58-room-use-in-demand), and broken into slices in the [efficiency plan](plans/efficiency-mvp.md). Slices 1 to 6 are built, apart from the savings estimator check; the rest is not. Slice 7, fail warm presence, is built: see the Away rows above. **Planned** rows are not counted in the summary until they are built; each moves to done or partial in the same change as its code.

| Item | Status | Where (planned) | Slice | Note |
|---|---|---|---|---|
| Room use from the household (`in_use`, `occasional`, `setback`) in the snapshot | done | `core/types.py`, `config/household.py`, `config/use.py`, `server/runtime.py` `_apply_use` | 1 | `eco` acts on it (slice 2). None without a household or a use level, so old snapshots replay unchanged |
| Room use for hand-written rooms from `rooms[].use` | done | `config/site.py`, `config/use.py` `schedule_room_use`, `server/runtime.py` | 1 | Not in the original plan. Warm periods are the spans above the day's lowest setpoint; a day at one setpoint is warm all day on an in use or occasional day; a savings baseline from `compile_schedule_baseline` (slice 3) |
| Savings baseline setpoint in the snapshot | done | `config/use.py`, `server/runtime.py` | 1 | Timer from first up less the fixed preheat to last in bed, each room at its usual temperature. Hand-written rooms with `use` get one too (`compile_schedule_baseline`): the household's timer, or without people the span of the house's warm periods, at the schedule's highest setpoint that day. `Snapshot.baseline` is true when any room has one |
| Damp floor as a control limit (12 °C) | done | `core/types.py`, `config/household.py`, `core/decide.py` `solo_threshold_c`, `server/runtime.py` | 1, 2, 7 | No room with room use waits below `min(target, 12 °C)` in `eco`. Fail warm (slice 7) also floors rooms set back by presence-based away at `DAMP_FLOOR_C` in the runtime |
| `eco` solo limits by room use, floored at the damp floor plus `boiler.damp_margin_k` (0.3 K) | done | `core/decide.py` `solo_threshold_c`, `config/site.py` | 2 | The margin is applied pending open question 12. HIGH risk: changes when the boiler fires. Not live on the real house until the owner agrees |
| Setback rooms left out of pooled demand; solo latch in the stop rule | done | `core/decide.py` `_update_solo`, `_keeps_burn`, `_pooled_demand_s` | 2 | HIGH risk. A preheating setback room also keeps the burn (not in the plan; needed for optimum start) |
| Burn extension only for rooms in use or occasional; heat sinks by room use | done | `core/decide.py` `_topup_candidates`, `_ensure_sink` | 2 | HIGH risk: changes which valves open |
| Optimum start looks 3.25 h ahead for rooms with room use in `eco` | done | `core/decide.py` `PREHEAT_USE_MAX_S` | 2 | Not in the plan: tuned in the simulator so rooms in use don't arrive late after waiting near the damp floor ([simulation](simulation.md#room-use-in-eco)) |
| Reasons `demand.setback`, `demand.floor`; `rooms[].use` and `rooms[].solo` in `state` | done | `core/decide.py`, `server/runtime.py` | 2 | Additive API. `demand.floor` is raised once, when the latch is set. The web UI does not show them yet (slice 5) |
| Degree-hours, lift and comfort per room per day | done | `core/savings.py` `SavingsMeter`, `core/decide.py`, `core/persist.py` | 3 | Pure. Every closed day summary carries a `savings` record, with each room's minutes with a reading (`read_min`) beyond the spec's fields. Lift relaxes exactly at the loss rate each tick, so any tick length is stable, and decays over downtime on restore. Saved state gains an optional, versioned `savings` section (its own `version`, with a migration table). A room without room use has no baseline and is left out, and `report` weighs only the rooms the latest closed day measured. Never feeds control: `radiate sim` output is unchanged |
| House signature fit, eligible days, savings report | done | `core/savings.py` `fit_signature`, `why_not_eligible`, `report`, `room_weights` | 3 | Theil-Sen; 14 days, CV(RMSE) 25 % and weather spread (p90 / p10 at least 1.3) gate inside `report`, so no caller gets an ungated figure. A day is also ineligible with any room's reading missing for over 10 % of it. Served by `GET /api/v1/savings` (slice 4) |
| Closed days kept for 730 days; `GET /api/v1/savings` | done | `server/savings.py`, `server/runtime.py`, `server/bridge.py`, `server/app.py` | 4 | `DailyHistory` in the state database under `daily_history`, saved as `{version, days}` when a day closes; a repeated day replaces the earlier one, and a history of another version is set aside with a warning. The route answers `report` unchanged, so the API never computes a figure of its own. `status` is `unavailable` with "no household" when there is neither a household nor a hand-written room with a use level, "no outdoor sensor" when a live house file names none and the source is `zigbee`, and "no outdoor readings yet" when Home Assistant is the source and no fresh reading has counted today or on a kept day (the demo and simulator always have one). A day with fresh outdoor readings for under 90 % of it is not counted: "no fresh outdoor temperature for N h". Also through the browser demo's bridge |
| Elastic daily `savings.*` and `comfort.*` fields | done | `export/elastic.py`, `server/savings.py` `day_estimate` | 4 | `outdoor_share`, `baseline_share` and `comfort.{deficit_kh,warm_share}` from the day's record; the room-weighted `dh_actual_kh`, `dh_baseline_kh` and `eligible`, and once the gate is open `savings.litres` and `savings.fit_cv_rmse`, from the report when the day closed. Mapped in the daily index template |
| Savings view, headline, table view | done | `web/savings.js`, `web/savings.css`, `web/index.html`, `web/app.js`, `web/guide.js` (Guide text in `index.html`) | 5 | A Savings tab (`#savings`) with the headline, the baseline sentence, the upper-bound line, statistics, a Days and Weeks bar chart in inline SVG (fill for oil used, outline for the baseline, hatched empty slots for days not counted), the running total, rooms' estimated shares and a table view; a still learning state with progress and the oil used each day so far; an unavailable state saying what is missing. The House view shows the headline as one line once there are figures. Guide section `#guide/savings`. In the demo and the static demo build. Checked by eye at 1280 and 390 px in dark mode; light mode follows the same tokens. Not built: the room status lines for `demand.setback` and `demand.floor` and the new Eco line, which wait for slice 2 |
| Simulator: household scenario, baseline controller, comparison | done | `sim/reference.py`, `sim/runner.py`, `sim/compare.py`, `cli.py` `sim-efficiency`, `docs/simulation.md` | 6 | Adds an `owner` scenario on hand-written schedules with `rooms[].use` |
| Simulator: savings estimator check | planned | `sim/compare.py` `estimator_check` | 6 | Slice 3 merged while this was built; the hook prints the true relay-litre difference and is not wired to `report` yet |
| Home Assistant: room `use` attribute, "Oil saved, last 30 days" and savings status sensors | planned | radiate-ha | later | Reads additive fields only |
| Litres from burner firing (Shelly `apower`) | done | `core/accounting.py`, `drivers/shelly.py`, `core/savings.py` | later | Basis `firing`. The savings fit uses one basis, the latest day's; a `mixed` day is never eligible and its litres are flagged as possibly high |
| Optimum stop, arrival-tuned optimum start, outdoor cut-off, damp guard | missing | | later | Each to be simulated against slice 2 first (spec 5.8) |
| Room activity input, usage log, usage suggestions | missing | | later | Needs radiate-ha first |
| Oil price and money in the UI | missing | | later | Spec open question 9 |

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
| Presets (comfort, eco, away) | partial | `server/app.py` `/mode` | `auto`, `off`, `frost` only. Away is per person (household setup), not a mode |
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
| Battery and availability alerts | done | `drivers/live.py`, `drivers/devices.py`, `server/demo.py` | `driver.trv_offline` for TRVs, and `device.offline`, `device.low_battery`, `device.weak_signal` (LQI below `monitoring.weak_signal_lqi`, 40) and `device.stale` (no temperature for `house.sensor_max_silence_min`) for sensors and routers. Not raised while the broker or Zigbee2MQTT is down, which has its own alert |
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
- **Rooms for the setup wizard.** The web wizard sets up the household over the house file's rooms, and `radiate discover` drafts the rooms from the command line. Left: discovery in the web UI, and Home Assistant areas through the integration.
- **Cloud edge.** Out of scope until the local editions are proven (ADR-0002).
- **Burner firing from relay power.** Add `burner_firing` to the snapshot from the Shelly `apower` once the OFTEC engineer confirms the wiring (spec open question 1), and use firing time for accounting.
