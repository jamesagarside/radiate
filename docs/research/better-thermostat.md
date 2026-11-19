# Better Thermostat (BT): source-level prior art

Source: KartoffelToby/better_thermostat, commit `aed2036` (2.0.0). AGPL-3.0: behaviour only, no code to be reused. Paths are relative to `custom_components/better_thermostat/` unless prefixed `docs/`.

## 0. Shape

- One config entry = one room `climate` entity wrapping one or more TRVs (plus optional cooler). No house-level object exists.
- Per TRV two choices: **calibration type** (output channel: target temperature, local offset, direct valve; `CalibrationOutput` in `utils/const.py`) and **calibration mode** (algorithm; `utils/const.py:214-224`). Default mode is heating power, UI name "(AI) Time Based" (`utils/const.py:230`).
- Valve-producing modes: heating power, MPC, MPC v2, PID, TPI (`utils/const.py:233-241`).

## 1. Calibration

### 1.1 Output channels

- **Offset**: new offset = (room minus TRV reading) + held offset (`calibration.py:1413`). Devices that add the offset to the setpoint (COZB0001) are sign-converted (`calibration.py:1408`).
- **Target temperature**: setpoint = target minus room + TRV reading (`calibration.py:1643`).
- **Percentage on a non-valve channel**: 0 % maps to the TRV's own reading, 100 % to its max setpoint, linear between (`calibration.py:1428-1431`, `1682-1685`). At 0 % the setpoint is pushed below the reading by a drop growing exponentially with room overshoot, at least one step (`calibration.py:133-159`).
- **Direct valve**: valve % written; setpoint parked 1 K (or one step) above the TRV reading so its own loop does not shut the valve (`calibration.py:130`, `1671-1679`), or below its reading when closed (`calibration.py:1657-1670`); offset held (`calibration.py:1424-1425`).
- **Tolerance band** `[target minus tol, target)`: output held, controllers still compute (`calibration.py:1357-1366`).
- **Post-adjustments** (non-controller modes): idle "tolerance delay" of 2 x tol (`calibration.py:1479-1481`); optional overheating protection adding 8 x (room minus target minus tol) in the closing direction while idle (`calibration.py:1491-1498`). Direction-aware rounding so heating rounds open and idle rounds closed (`calibration.py:1519-1526`, `1767-1780`).
- Mode behaviour is declared as data in `MODE_TRAITS` (`calibration.py:1257-1292`).

### 1.2 Algorithms

| Mode | Computes | Inputs | Learning / persistence |
|---|---|---|---|
| Default (offset only) | Pure gap offset, no band or post-adjustments (`calibration.py:1260-1262`) | room, TRV | none |
| Aggressive | Adds 2.5 K in the heating direction unless already past it; no tolerance delay (`calibration.py:1215-1233`) | room, TRV | none |
| No calibration | Target passed through (`calibration.py:1290`) | target | none |
| Heating power (default) | valve = 0.019 x (deficit / heating_power)^0.946, floors of 15 % above 0.3 K and proportional from 0.1 K (`utils/helpers.py:1298-1376`); legacy offset formula without valve channel (`calibration.py:1452-1456`) | room, target, learned K/min | heating power (4.6) |
| TPI | 100 x (0.6 x error + 0.01 x (target minus outdoor)), zero if overshoot > 0.3 K (`utils/calibration/tpi.py:26-36`, `176-191`). Header says it is modelled on Versatile Thermostat. Used as a **valve %**, not time-switched duty. | room, target, outdoor | stateless |
| PID | Room error on EMA; derivative on measurement; conditional anti-windup; 20 % integral relief on sign change near target; 5 min hold unless change > 33 % (`utils/calibration/pid.py:174-215`, `430-545`). Defaults Kp 60, Ki 0.01, Kd 2000 (`pid.py:117-120`). Auto-tune: overshoot cuts Kp/Ki, raises Kd; sluggish slope raises Ki; bounded steps >= 5 min apart (`pid.py:641-720`). | room, slope, max opening | gains per 0.5 °C target bucket, separate loop state (`pid.py:799-850`) |
| MPC | dT/dt = gain x u minus loss (+ solar) over 6 x 5 min; quadratic cost with 8x overshoot weight plus effort and slew terms; grid then local search (`utils/calibration/mpc.py:34-36`, `44-99`, `1029-1046`). Kalman "virtual temperature" (`mpc.py:85-94`); dead-zone learning of a minimum effective opening (`mpc.py:66-71`); TRV response profile classifier (`mpc.py:1735-1805`); random forced closures at target to sample heat loss (`mpc.py:926-965`). | room raw/EMA, TRV, slope, outdoor, `sun.sun`, weather cloud/UV (`calibration.py:217-286`) | gain, loss, ka, solar gain per bucket; new buckets seeded from siblings (`mpc.py:423-510`); anchors reset after 15 min staleness (`mpc.py:1084-1090`) |
| MPC v2 (experimental) | RC2 plant (room node + radiator node, notional 65 °C flow), Kalman observer, Smith predictor, disturbance observer, reference governor, QP (`utils/calibration/mpc_v2/__init__.py`, `mpc_v2_internals/plant.py:1-55`). Room-size presets or AUTO prior from learned heat loss (`mpc_v2/params.py`). Offline re-identification at most every 6 h after 240 samples (`calibration.py:118-119`), discarded if the flow assumption changes (`calibration.py:567-605`). | room, TRV, outdoor, heat loss | versioned snapshot (`mpc_v2/controller.py:28`) |

- **"PI heating demand"**: no such mode. Bosch BTH-RA's Z2M `pi_heating_demand` is used as a writable valve channel, re-written every 8 min because the head reverts to its own controller after 15 min silence (`model_fixes/BTH-RA.py:1-24`, `:48`).
- One `StateManager` store holds all learned state (`utils/state_manager.py`); sanitisers heal non-finite or runaway state and annunciate health (`calibration.py:477-481`).
- Standby contract: under window/OFF/HOLD controllers track but do not integrate (`calibration.py:1091-1110`, `docs/internals/calibration.md`).

## 2. Valve control (TRVZB)

- **Quirk first, adapter second**: `adapters/delegate.py:776-836`.
- **Discovery**: number entities on the same HA device, matched by translation key then by name, for `valve_opening_degree`, `valve_closing_degree`, TRV-ZBT `heating_valve_position`/`idle_valve_position`, then any valve-like number (`model_fixes/TRVZB.py:185-295`).
- **Writes**: opening = p, **closing = 100 minus p**, TRV-ZBT idle = p (`model_fixes/TRVZB.py:298-326`), so the valve holds one position whether or not the TRV's own logic heats.
- **Close bump**: every further close first opens to last + 10 %, then writes the target 5 s later, to counter reported motor calibration loss at small openings (`model_fixes/TRVZB.py:52-60`, `435-533`). Not used during maintenance.
- **Generic valve number** (Z2M/ZHA/Z-Wave): percentage scaled to the entity's min/max/step; unavailable entity raises so nothing is recorded as sent (`adapters/valve_entity.py`).
- **Limits**: per-TRV `valve_max_opening` slider, default 100 % (`number.py:674`), enforced by the safety hull (`core/safety.py:1-20`). A valve slew limiter exists but ships disabled (`core/safety.py:134`).
- **Overrides**: boost opens to max opening; OFF intent closes to 0 %; valve-only TRVs in HOLD get 25 % (`utils/controlling.py:497-555`, `utils/const.py:245`).
- **External temperature**: room temperature written to `external_temperature_input` on each accepted reading plus a **30 min keepalive** sized against the TRVZB's 2 h fallback (`climate.py:331-336`, `events/temperature.py:224-245`). The sensor selector is set to `external`/`remote_temperature` before writes unless "keep sensor selection" is on (`model_fixes/TRVZB.py:716-792`, `989`). If the room sensor is on the TRV's own device, mirroring is skipped and the selector reset (`model_fixes/TRVZB.py:920-932`).
- **Maintenance**: TRVZB exercised every 84 h (`model_fixes/TRVZB.py:41`, default 7 days `model_fixes/types.py:411`), run capped at 1 h (`core/fsm/maintenance.py:20`).
- **Write budget**: >= 30 s between routine writes per channel, 600 s for HomematicIP, deferred writes rescheduled (`utils/controlling.py:163-168`); 5 min reconciler re-sends lost writes (`utils/controlling.py:1018`).

## 3. Core architecture

- `decide(snapshot, state) -> (desired, state')` is pure: no HA imports, IO or clock reads (`core/decide.py:178-314`).
- Cascade, first match wins: devices released, all TRVs released, startup or maintenance, mode OFF, window/door, no `call_for_heat`, else heat at user target (`core/decide.py:222-314`).
- `TrvDesired` carries mode, setpoint, valve %, offset, `Suppression`; `heating_blocked_by` is a public attribute contract (`core/desired.py`).
- Regions: control-mode ladder OPTIMAL, SENSOR_FALLBACK (mean of TRV internal temperatures), HOLD; degrade after 120 s, recover after 300 s (`core/fsm/control_mode.py:1-50`, `calibration.py:162-189`); window CLOSED/OPENING/OPEN/CLOSING debounce (`core/fsm/window.py`); maintenance; reachability backoff; lifecycle; mode.
- Safety hull clamps all intents, fallbacks 4.5 to 35 °C and +/-12 K (`core/safety.py:31-41`).
- `offset_limit`: flags an offset stuck at the device range limit for 1 h while the needed correction lies beyond it (`core/offset_limit.py`).
- `outdoor`: time-weighted first-order filter, 24 h time constant, 1 K summer hysteresis, rebuilt from recorder history on restart (`core/outdoor.py:24-32`, `utils/weather.py:572-600`).
- `clock`: injected `Clock` protocol, `FakeClock` for tests and replay (`core/clock.py`).
- Scheduler coalesces events to one pending cycle plus 5 min ticks (`utils/scheduler.py`); flight recorder keeps 50 replayable (snapshot, state, desired) tuples, exported in diagnostics (`core/recorder.py`, `diagnostics.py:150-152`).

## 4. Environment and learning

1. **Window/door**: binary sensors with separate open/close delays (`utils/const.py:64-72`, `events/contact.py`); unavailable counts as closed (`events/contact.py:227-241`). No temperature-drop detection found.
2. **Outdoor cut-off**: `call_for_heat` false when damped outdoor >= off temperature; weather path averages about two days of forecast (`utils/weather.py:198-250`), holds its verdict 3 h if silent (`utils/weather.py:50`).
3. **Humidity**: display plus `humidity_high` trigger only (`climate.py:2115-2133`, `device_trigger.py:74`).
4. **Presets/eco**: standard HA presets as editable setpoints (`utils/preset_manager.py:29-33`).
5. **Child lock**: per-TRV switch mirroring the device lock (`switch.py:551`).
6. **Heating power**: cycle from heating start to post-heat peak (30 min plateau timeout); rate = rise / minutes; EMA alpha 0.10 scaled by target-position (0.5 to 1.5) and outdoor (0.7 to 1.3) factors; clamped 0.005 to 0.2 K/min; also rate per K of (target minus outdoor) (`utils/thermal_learning.py:176-407`, `299-345`).
7. **Heat loss**: idle stretch from first idle reading to minimum, closed by next heating; EMA 0.10, clamped 0.001 to 0.05 K/min; voided by window, pause, cooling, 10 min after a cooler stops (`thermal_learning.py:410-530`). Seeds MPC v2's room time constant.
8. **External heat (fire, range cooker, DHW priority)**: no detection. Manual **Pause Learning** switch keeps actuating but freezes all learners and drops in-flight cycles (`switch.py:249-261`, `docs/setup/pause-learning.md`); blueprints for fireplace and DHW. MPC has an `other_heat_power` input that is always 0 (`mpc.py:118`).
9. **Availability guard**: mains-power sensor that only mutes warnings for a 10 min grace (`utils/const.py:32`).
10. **Cooler** (AC) with its own hysteresis (`utils/hvac_action.py:72-90`); **manual knob sync** (`events/trv.py`).

## 5. Boiler and central demand

- **BT does not drive a boiler or aggregate demand.** The docs recommend a user automation: boiler on if any room has `hvac_action == heating` and `heating_blocked_by` is none (`docs/deep-explanations/central-heating-thermostat.md`).
- `hvac_action` is a binary room hysteresis on `[target minus tol, target)`, explicitly not derived from valves (`utils/hvac_action.py:41-58`, `96-150`). No weighted or modulating demand, no minimum-open-valve check, no anti-cycling, no flow temperature. `call_for_heat` is only the summer flag. `ATTR_VALVE_POSITION` is defined but unused (`utils/const.py:125`).

## 6. Adapters and model fixes

Adapters: generic (offset only, `adapters/generic.py:50`); mqtt/Z2M (offset + valve numbers, forces the `manual` preset, 3 s settle after mode writes, `adapters/mqtt.py:49-153`); zha and zwave_js (valve only if a writable number exists, `zha.py:46`, `zwave_js.py:47`); shelly (BLU TRV valve-only, `shelly.py:54`); deconz and tado (service offsets, no valve).

| Model | Quirk |
|---|---|
| TRVZB | opening/closing pair, close bump, ext temperature and selector, 84 h maintenance |
| TRV-ZBT | heating + idle positions; reuses TRVZB ext temperature |
| SRTS-A01 (Aqara E1) | ext temperature; selector tied to control-mode ladder since device never self-reverts |
| 014G2461 (Danfoss Ally, Popp, Hive) | external sensor with 30 min / 0.1 K policy against 3 h / 35 min device timeouts |
| SBTR-001AEU (Shelly BLU) | ext temperature keepalive; valve-only |
| BTH-RA | `pi_heating_demand` valve keepalive |
| BTH-RM, BTH-RM230Z | target range handling |
| SPZB0001 | TRV mode "1" for valve control else "2"; offset clamp +/-5 |
| ZWA021 (Spirit Z, Aeotec) | hidden manufacturer mode for valve control |
| COZB0001 / Heater (TermoWeb) | offset on setpoint / inverted offset |
| 18437 (Aqara W600) / 20480 (IKEA LILJEBAGGE) | Matter: real offset range +/-5 / offsets ignored |
| SHTRV-01 | lowest setpoint one step above min to avoid reading as OFF |
| TS0601, TS0601_thermostat, SEA801/802, TV02, BHT-002, ME167 | setpoint nudges (+1.5 K), offset rounding, manual preset, garbage filtering |

## 7. Observability and automation surface

- Sensors (`sensor.py:818-1059`): room EMA (and 1 h), slope, heating power, heat loss, MPC virtual temperature/gain/loss/ka, MPC v2 virtual temperature/coupling/disturbance/time constant, PID output/error.
- Switches: release devices, release TRV, pause learning, PID auto-tune, window detection, child lock. Numbers: preset temperatures, PID gains, valve max opening, off temperature, tolerance.
- Attributes: `heating_blocked_by`, `active_overrides`, `learning_paused`, `call_for_heat`, learning stats, controller debug (`utils/const.py:110-155`).
- Services: `run_valve_maintenance`, `reset_heating_power`, `reset_pid_learnings` (`services.yaml`).
- Device triggers: heating active/stopped, humidity high, window opened/closed, battery low, device error, target reached, plus 3 legacy (`device_trigger.py:68-84`); conditions hvac mode/action; actions set mode/temperature.
- Diagnostics: TRV state/config, sensors, flight recorder, summer facts (`diagnostics.py:97-158`). No metrics export.

## 8. Whole-house balancing

**Does not exist.** No cross-room object, model or supply coordination. "Virtual hydraulic balancing" (`docs/deep-explanations/hydraulic-balance.md`) amounts to: each room throttling its own valve near target; a static manual per-TRV max opening; and, inside one room with several TRVs on MPC/MPC v2, an optional split giving colder radiators +8 % per K relative to the warmest (`calibration.py:391-421`, `mpc.py:532-582`). The docs concede mechanical presetting still governs when every room demands 100 %.

## 9. BT versus Versatile Thermostat (VTherm side inferred from its public docs, not read here)

- **BT stronger**: richer room control (MPC with dead-zone/profile learning, MPC v2 with Kalman and re-identification, auto-tuned PID, learned heating power and heat loss); pure replayable core, fail-soft ladder, safety hull, write budget, reconciler; deeper TRVZB handling (keepalive, selector, closing complement, close bump, maintenance); broad quirk catalogue.
- **BT weaker**: no central boiler entity or relay; no load shedding, presence/motion, slope-based window detection, central config or auto-start/stop; TPI not time-switched so no on/off heater support; no flow-temperature awareness (deliberate, `docs/Configuration/algorithms.md:171-182`).
- **For Radiate**: useful prior art on TRVZB mechanics, keepalive timing, learning-pause semantics, estimators and FSM structure. It leaves house balancing and boiler orchestration entirely unsolved.

## 10. Feature table

| Feature | BT | Where | Notes |
|---|---|---|---|
| Room entity with multiple TRVs | yes | `climate.py` | per config entry |
| External room sensor | yes | `events/temperature.py` | 5 min EMA (`:54`) |
| Room EMA sensor | yes | `sensor.py:818` | plus 1 h |
| Temperature slope | yes | `sensor.py:886` | K/min |
| Offset channel | yes | `calibration.py:1323` | |
| Target temperature channel | yes | `calibration.py:1564` | |
| Direct valve channel | yes | `utils/controlling.py:497` | five modes |
| % to setpoint mapping | yes | `calibration.py:1682` | linear |
| Closing setpoint drop | yes | `calibration.py:133` | exponential |
| Open-valve setpoint lead | yes | `calibration.py:130` | 1 K |
| Tolerance band hold | yes | `calibration.py:1357` | below target |
| Overheating protection | yes | `calibration.py:1491` | idle only |
| Direction-aware rounding | yes | `calibration.py:1519` | |
| Offset-only mode | yes | `calibration.py:1260` | |
| Aggressive mode | yes | `calibration.py:1215` | |
| Heating power valve mode | yes | `utils/helpers.py:1298` | power law |
| TPI | partial | `utils/calibration/tpi.py` | % only |
| PID | yes | `utils/calibration/pid.py` | bucketed |
| PID auto-tune | yes | `pid.py:641` | heuristic |
| PID manual gains | yes | `number.py:561` | |
| MPC | yes | `utils/calibration/mpc.py` | 30 min horizon |
| MPC virtual temperature | yes | `mpc.py:85` | Kalman |
| MPC dead-zone learning | yes | `mpc.py:66` | |
| MPC TRV profile | yes | `mpc.py:1735` | |
| MPC forced loss sampling | yes | `mpc.py:926` | |
| Solar gain | yes | `calibration.py:217` | weather entity |
| MPC v2 QP + Kalman | partial | `utils/calibration/mpc_v2/` | experimental |
| Disturbance observer | yes | `mpc_v2_internals/dob.py` | |
| Offline re-identification | yes | `calibration.py:118` | 6 h |
| Flow temperature input | no | `docs/Configuration/algorithms.md:171` | fixed 65 °C |
| State sanitising | yes | `calibration.py:477` | |
| Learned state persistence | yes | `utils/state_manager.py` | |
| Heating power learning | yes | `utils/thermal_learning.py:176` | |
| Outdoor-normalised power | yes | `thermal_learning.py:327` | |
| Heat loss learning | yes | `thermal_learning.py:410` | |
| Pause learning | yes | `switch.py:249` | keeps actuating |
| External heat detection | no | n/a | manual pause |
| DHW priority awareness | no | `docs/setup/pause-learning.md` | automation |
| Window sensor | yes | `events/window.py` | debounced |
| Separate door sensor | yes | `events/door.py` | |
| Slope window detection | no | n/a | |
| Dead contact = closed | yes | `events/contact.py:227` | |
| Outdoor cut-off | yes | `core/outdoor.py` | 24 h damping |
| Forecast cut-off | yes | `utils/weather.py:198` | ~2 days |
| Summer hysteresis | yes | `core/outdoor.py:32` | 1 K |
| Humidity in control | no | `climate.py:2115` | display only |
| Presets incl. eco | yes | `utils/preset_manager.py` | setpoints |
| Boost to max opening | yes | `utils/controlling.py:545` | |
| Child lock | yes | `switch.py:551` | |
| Manual knob sync | yes | `events/trv.py` | |
| Release devices | yes | `switch.py:133` | room and TRV |
| Fail-soft ladder | yes | `core/fsm/control_mode.py` | |
| Safety hull | yes | `core/safety.py` | |
| Valve slew limit | partial | `core/safety.py:134` | disabled |
| Offset-at-limit detection | yes | `core/offset_limit.py` | 1 h |
| Pure decision core | yes | `core/decide.py` | |
| Injected clock | yes | `core/clock.py` | |
| Flight recorder | yes | `core/recorder.py` | 50 cycles |
| Write budget | yes | `utils/controlling.py:163` | 30 s |
| Reconciler | yes | `utils/controlling.py:1018` | 5 min |
| TRVZB opening degree | yes | `model_fixes/TRVZB.py:298` | |
| TRVZB closing complement | yes | `model_fixes/TRVZB.py:316` | 100 minus p |
| TRVZB close bump | yes | `model_fixes/TRVZB.py:435` | +10 %, 5 s |
| TRVZB external temperature | yes | `model_fixes/TRVZB.py:866` | |
| External temperature keepalive | yes | `climate.py:336` | 30 min |
| Sensor selector management | yes | `model_fixes/TRVZB.py:716` | Z2M, ZHA |
| Valve maintenance | yes | `utils/valve_maintenance.py` | 84 h TRVZB |
| Per-TRV max opening | yes | `number.py:674` | manual |
| Computed max opening | no | n/a | |
| In-room multi-TRV split | partial | `calibration.py:391` | MPC only |
| Cross-room balancing | no | n/a | |
| Radiator sizing model | no | n/a | |
| Boiler relay control | no | `docs/deep-explanations/central-heating-thermostat.md` | recipe |
| Aggregated demand entity | no | n/a | |
| Binary room demand | yes | `utils/hvac_action.py:96` | hysteresis |
| `heating_blocked_by` | yes | `core/desired.py` | contract |
| Valve-weighted demand | no | n/a | |
| Boiler anti-cycling | no | n/a | |
| Cooler control | yes | `events/cooler.py` | |
| Availability guard | partial | `utils/const.py:74` | warnings only |
| Z2M adapter | yes | `adapters/mqtt.py` | manual preset |
| ZHA adapter | yes | `adapters/zha.py` | |
| Z-Wave JS adapter | yes | `adapters/zwave_js.py` | |
| Shelly BLU valve-only | yes | `adapters/shelly.py` | |
| deCONZ, Tado | yes | `adapters/` | offset only |
| Matter quirks | yes | `model_fixes/18437.py` | and 20480 |
| Bosch demand keepalive | yes | `model_fixes/BTH-RA.py:48` | 8 min |
| Danfoss sensor policy | yes | `model_fixes/014G2461.py` | |
| Diagnostic sensors | yes | `sensor.py` | |
| Services | yes | `services.yaml` | 3 |
| Device triggers | yes | `device_trigger.py:68` | 8 + 3 legacy |
| Conditions and actions | yes | `device_condition.py` | 2 each |
| Diagnostics download | yes | `diagnostics.py` | |
| Blueprints | yes | `docs/setup/automation-blueprints.md` | 9 |
| Metrics export | no | n/a | recorder only |
