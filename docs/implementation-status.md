# Implementation status

The v1 specification ([spec.md](spec.md)) and the v1 items of the [coverage matrix](research/coverage-matrix.md) ("Radiate standalone" column), checked against the code. Update this page in the same change as the code.

Last audit: November 2026, against `main` at `c4657fe`.

**Status:** done (matches the spec), partial (works, but differs from the spec or misses part of it), missing (not in the code). Paths are relative to `src/radiate/` unless they start with a top-level folder. "Unsure" marks a row the audit could not settle from the code alone.

## Summary

| Status | Rows |
|---|---|
| Done | 82 |
| Partial | 26 |
| Missing | 37 |

Top gaps, most important first:

1. **Safe mode does not hand over to the Shelly watchdog.** The live driver keeps sending the heartbeat and holding the relay off when every TRV is unreachable, so the watchdog never takes over and the house gets no heat. A dropped MQTT connection is not detected as "TRVs unreachable" at all (section 7).
2. **No boiler lockout or out-of-oil detection** (section 7).
3. **No short-cycle detection or adaptation** (sections 5.6, 7).
4. **No oil or runtime accounting and no daily Elastic stream** (sections 5.6, 9), so no balance score either.
5. **Setpoint overrides live in memory and never expire** (section 8.1).
6. **No stuck-valve or calibration-loss detection** (section 7).
7. Learning extras still missing: house-wide `κ`, flow sensitivity `η`, valve dead zone, store recovery time, recorder bootstrap (sections 4.1 to 4.3, 5.5).

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
| 4.1 Arrival lag learned per radiator, median of 15 | partial | `core/decide.py` lag probe | Criterion is a 0.6 K TRV rise within 40 min, not `dT_trv/dt > 0.05 K/min`; availability is a step, no `τ_w` |
| 4.2 Flow sensitivity `η` | missing | `core/allocator.py` `AllocRoom.eta` | Always the 0.7 default; no emitter-limited report |
| 4.3 RLS with forgetting, priors, bounds | done | `core/estimator.py` | |
| 4.3 Diagnostic when a parameter sits on a bound for 24 h | missing | | |
| 4.3 Bootstrap from 14 days of history | missing | | |
| 4.3 Outlier rejection at 4 σ | done | `core/estimator.py` | |
| 4.3 Per-room confidence | done | `core/estimator.py` | |
| 4.4 Synchronised arrival allocation | done | `core/allocator.py` | Deadline-aware for optimum start |
| 4.4 Opening floor 20 % | done | `core/allocator.py` | |
| 4.4 Capacity limited: open everything and log | partial | `core/allocator.py` | Paces at the horizon instead; `capacity_limited` is never logged |
| 4.4 Steady-state allocation with a 30 min horizon | partial | `core/decide.py` | Lockshield cap used whenever not firing |
| 4.4 Lockshield cap `L_r` | partial | `core/decide.py` `_record_lockshield` | 90th percentile of a decaying histogram (about 23 firing hours half-life), not a 7 day window |
| 4.5 Governed mode settings | done | `drivers/z2m.py` `TrvWriter` | |
| 4.5 Schedule mirror into the TRVZB | done | `drivers/z2m.py`, `config/schedule.py` | |
| 4.5 Write discipline (3 % step, 10 min, 15 % exception) | done | `core/decide.py` `_discipline` | |
| 4.5 Close bump | done | `core/decide.py`, `drivers/z2m.py` | |
| 4.5 Reconciler, 3 attempts then a diagnostic | done | `drivers/z2m.py`, `drivers/live.py` `alerts` | |
| 4.5 Summer valve exercise | missing | | |
| 4.5 Per-valve `actuation_enabled`, global dry run | done | `config/site.py`, `drivers/live.py` | |
| 4.6 Gate: sensor fresh | partial | `core/decide.py` | A stale room sensor falls back to the TRV reading and learning carries on |
| 4.6 Gate: window | done | `core/disturbance.py` | |
| 4.6 Gate: store recovery | partial | `core/decide.py` | Time-based only; no "`T_trv` rising again" check |
| 4.6 Gate: settled after setpoint change | done | `core/decide.py` | |
| 4.6 Gate: shower | done | `core/disturbance.py` | |
| 4.6 Gate: valve trusted (no reconciler failure) | missing | | Writer failures do not reach the core |
| 4.6 Gate: not passive | done | `core/decide.py` | Passive rooms have no engine state |
| 4.6 Open fire detection, closing and 4 h hold-off | done | `core/disturbance.py` | Residual threshold 2.0 K/h with confidence ≥ 0.6, not 1.5 K/h (tuned in simulation) |
| 4.6 Range cooker: free `d`, cooking spikes excluded | done | `core/estimator.py`, `core/disturbance.py` | |
| 4.6 Range cooker "self-heated" after 14 days | missing | | |
| 4.6 Stairs bypass in the supply factor | done | `core/types.py` `bypass_equivalent` | |
| 4.6 Stairs rise as a heat-availability check | missing | | |
| 4.6 Toilet: TRV reading with bias, 1.0 K hysteresis, never sets the pace | done | `core/decide.py` | |
| 4.6 Toilet: bias refinement, confidence capped at 0.5 | missing | | |

## 5. Boiler logic

| Item | Status | Where | Note |
|---|---|---|---|
| 5.1 Guard parameters and ranges | done | `core/types.py`, `config/site.py` | |
| 5.2 State machine IDLE, LEAD, FIRING, REST | done | `core/boiler.py` | |
| 5.2 Frost override, hard frost ignores minimum off | done | `core/boiler.py`, `core/decide.py` | |
| 5.3 Pooled demand `D` (gain-weighted) | partial | `core/decide.py` | Fire rule uses the largest gap and predicted burn; `D` is not computed |
| 5.3 Fire rules (comfort limit, 1.5 × minimum burn, optimum start) | done | `core/decide.py` | |
| 5.3 Stop rule | partial | `core/decide.py` | Demand latch (gap ≤ 0) rather than "predicted to arrive within one tick" |
| 5.3 Burn extension (top-up) | done | `core/decide.py` | |
| 5.3 Store merging (opt-in) | missing | | |
| 5.4 Open-path guarantee with dump rooms | done | `core/decide.py` `_ensure_sink` | |
| 5.5 Store schedule, up to 4 windows | done | `core/decide.py`, `config/site.py` | |
| 5.5 Store boost | done | `server/app.py` | |
| 5.5 Priority awareness: no heat during recovery, learning gated | done | `core/decide.py` | |
| 5.5 Learned recovery time | missing | `core/types.py` `recovery_s` | Fixed (25 min default) |
| 5.6 Burner hours, starts, burn-length histogram, starts per hour per day | missing | | Simulator telemetry only |
| 5.6 Litres and kWh from the nozzle rating | missing | | |
| 5.6 Firing time from relay power metering | missing | | |
| 5.6 Short-cycle alert | missing | | |
| 5.7 Shelly watchdog script | done | `shelly/radiate-watchdog.js` | |
| 5.7 Heartbeat every tick, fallback windows in KVS | done | `drivers/shelly.py` | |
| 5.7 Hard auto-off on channel 1 | done | `drivers/shelly.py` `toggle_after` | |
| 5.7 `radiate shelly install-watchdog --yes` | done | `cli.py` | |

## 6. Control loop

| Item | Status | Where | Note |
|---|---|---|---|
| Pure `decide` with reasons and alerts | done | `core/decide.py` | |
| Every 60 s | done | `server/runtime.py` | |
| Extra tick on significant input change (5 s debounce) | missing | | Fixed interval only |
| Decision log | done | `server/runtime.py` | Boiler, disturbance and safe-mode reasons; in memory, last 500 |

## 7. Failure modes

| Failure | Status | Where | Note |
|---|---|---|---|
| Room sensor stale | partial | `core/decide.py` | Falls back to the TRV reading and stops sending external temperature; learning is not switched off |
| TRV offline | partial | `core/decide.py`, `drivers/live.py` | Excluded from demand and learning, alert raised; not counted as possibly open in the supply factor |
| Coordinator or MQTT down: safe mode | done | `core/decide.py` `force_stop`, `drivers/live.py` | Broker disconnected or Zigbee2MQTT offline marks every TRV unreachable; relay off after minimum burn, then no relay commands and no heartbeat, so the watchdog takes over. On hand-back, a burn the watchdog started is not adopted by the guard (unsure how short it can be cut) |
| Radiate process dies | done | `shelly/radiate-watchdog.js`, schedule mirror | Simulated in `tests/sim` |
| Radiate restarts | done | `core/persist.py`, `server/store.py` | Timers moved on by the downtime |
| Home Assistant down | done | | Control does not depend on HA |
| Internet down, telemetry buffered 7 days | done | `server/store.py` `SqliteQueue` | |
| Boiler lockout or out of oil | missing | | |
| Valve stuck or calibration lost | missing | | |
| Short-cycling: raise minimum off for 24 h | missing | | |
| Overheating with the valve closed | partial | `core/disturbance.py` | Gates learning (`unexplained_heat`); no alert, no valve check |
| Frost | done | `core/decide.py` | |
| Clock jump or DST | done | `server/runtime.py`, `drivers/live.py` | Monotonic timers; schedules in local time (`next_change` is out by an hour across a DST change) |
| Corrupt learned state | partial | `core/persist.py` | Reset to priors and logged; no replay of recent history, no UI alert |

## 8. Interfaces

| Item | Status | Where | Note |
|---|---|---|---|
| `GET /api/v1/house`, `/state`, `/decisions?since=` | done | `server/app.py` | |
| `POST /rooms/{id}/setpoint` | partial | `server/app.py` | Override held in memory until cleared; lost on restart; no expiry |
| `POST /rooms/{id}/fire`, `/store/boost`, `/mode` | done | `server/app.py` | Manual fire flag is not persisted |
| `WS /api/v1/stream` | done | `server/app.py` | |
| Local token auth, ingress auth | done | `server/app.py` | |
| HA: climate per room | done | `custom_components/radiate/climate.py` | |
| HA: room sensors (opening, gain, loss, lag, confidence) | done | `custom_components/radiate/sensor.py` | |
| HA: learning state sensor | missing | | |
| HA: "fire lit" switch | partial | `custom_components/radiate/binary_sensor.py` | Read-only binary sensor |
| HA: boiler state, starts | partial | `custom_components/radiate/sensor.py` | Starts in the last hour, not today |
| HA: burner hours, litres today, balance score | missing | | |
| HA services `boost_store`, `set_mode` | done | `custom_components/radiate/__init__.py` | |
| HA service `recalibrate_valve` | missing | | |

## 9. Elastic export

| Item | Status | Where | Note |
|---|---|---|---|
| Room stream | partial | `export/elastic.py` `room_docs` | No `temperature.trv`, `model.eta`, or shower, window and cooker flags |
| Boiler stream | partial | `export/elastic.py` `boiler_doc` | No `boiler.firing` or `store.recovering` |
| Decision stream | done | `export/elastic.py` | |
| Daily stream with balance score | missing | | |
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
| Boiler strip with 24 h burn timeline and countdowns | done | `web/app.js` | |
| Setup wizard | missing | | |

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
| Valve feedback plausibility | missing | | Same work as stuck-valve detection |
| Manual recalibration service | missing | | |
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
| Discovery of TRVs and sensors by HA area | missing | | Rooms come from the YAML file |
| Options or reconfigure flow | missing | | |
| House balancing dashboard card | done | `web/` | Web UI, not a Lovelace card |

## Next steps

Larger items left for later, each with a short design note.

- **Learn `κ` (supply sensitivity).** Fit one house-wide `κ` by regressing each room's observed warm-up rate against `Σ f(o_j)` at the time, using only burns that pass every learning gate. Low value in this house (see [simulation](simulation.md)); collect real data first.
- **Learn `η` per room.** Needs burns with few and with many valves open for the same room. Store per-room pairs of (supply factor, fitted gain) per burn and fit the log-log slope after 10 qualifying burns. Feeds the allocator's emitter-limited rule and the "bigger radiator" advice.
- **Learn the valve dead zone.** Per valve, the smallest commanded opening that produced a `T_trv` rise within the arrival lag plus 20 min. Needs deliberate low openings, so tie it to the summer valve exercise or a one-off calibration burn.
- **Learn the store recovery time.** Median time from store relay on to `T_trv` rising again on any open radiator, over the last 15 recoveries. Replaces the fixed `recovery_s` in the store-recovery gate.
- **Recorder bootstrap.** Replay up to 14 days of history (HA recorder through the integration, or the standalone database once it keeps raw readings) through `decide` with actuation ignored. Needs a history source first: the server does not store raw readings yet.
- **Setup wizard.** Discover rooms from Zigbee2MQTT device names (or HA areas through the integration) and write the YAML file. UI work; wait for the web refactor.
- **Cloud edge.** Out of scope until the local editions are proven (ADR-0002).
- **Burner firing from relay power.** Add `burner_firing` to the snapshot from the Shelly `apower` once the OFTEC engineer confirms the wiring (spec open question 1), and use firing time for accounting.
