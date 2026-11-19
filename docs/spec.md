# Radiate specification

Version 0.1, November 2026. Status: draft for the first implementation.

Decisions this builds on: [ADR-0001](adr/0001-standalone-vs-vtherm-companion.md) (standalone), [ADR-0002](adr/0002-deployment-topology.md) (one engine, three editions). Prior art: [coverage matrix](research/coverage-matrix.md).

Units: °C, K, minutes (min), hours (h), kW, litres. Opening is the TRVZB `valve_opening_degree` in %.

---

## 1. Goals for v1

1. Rooms that call for heat together reach setpoint at about the same time (**synchronised arrival**), instead of near rooms overshooting while far rooms lag.
2. The oil burner runs **fewer, longer burns**: hard minimum burn, minimum off and starts-per-hour limits, plus demand pooling.
3. Learning is **never corrupted** by the open fire, the range cooker, showers, open windows or hot-water store recovery.
4. **Fails safe**: if Radiate, Home Assistant, MQTT or the internet stops, every radiator keeps sensible local control and the boiler cannot be left firing or left dead.
5. Every decision is **explainable** (decision log) and **exportable** (Elastic).

Non-goals for v1: flow-temperature modulation, multi-TRV rooms, certification.

---

## 2. House model

### 2.1 Objects

| Object | Fields |
|---|---|
| **House** | outdoor temperature source, boiler, hot-water store, rooms, timezone |
| **Room** | name, area, setpoint schedule, room sensor (optional), radiators, role (`normal`, `passive`, `internal_sensor_only`), heat sources |
| **Radiator** | TRV (optional), nominal output at ΔT50 (W, optional), `controllable` flag |
| **Heat source** | `episodic` (open fire, wood burner) or `continuous` (range cooker), optional binary sensor or schedule |
| **Boiler** | relay for heating demand, `on_off` type, fuel `oil`, rated output kW, nozzle rating (litres/h, optional), guard parameters (section 5) |
| **Store** | relay for store enable, schedule, priority over heating (`true` for Heatslave) |

### 2.2 Reference house

| Room | Room sensor | Radiator | Role | Notes |
|---|---|---|---|---|
| Bedroom 1 | SNZB-02B | TRVZB | normal | |
| Bedroom 2 | SNZB-02B | TRVZB | normal | |
| Bedroom 3 | SNZB-02B | TRVZB | normal | |
| Bathroom | SNZB-02B | TRVZB | normal | humidity used for shower detection |
| Dining room | SNZB-02B | TRVZB | normal | |
| Lounge | SNZB-02B | TRVZB | normal | open fire: episodic heat source |
| Kitchen | SNZB-02B | TRVZB | normal | Aga: continuous heat source |
| Toilet | none | TRVZB | internal_sensor_only | TRV internal sensor only |
| Stairs | SNZB-02B | manual valve | passive | always-open bypass path; observed, not controlled |

Boiler: Worcester Heatslave 12/14, on/off oil, internal store with hot-water priority. Shelly 2PM Gen4: channel 1 heating demand, channel 2 store enable.

---

## 3. Signals

| Signal | Source | Rate | Use |
|---|---|---|---|
| Room temperature `T` | SNZB-02B | on change (≥0.1 K) or about every 10 min | control, learning |
| Room humidity | SNZB-02B | on change | shower detection |
| TRV internal temperature `T_trv` | TRVZB `local_temperature` | on change | radiator arrival, toilet room proxy |
| Valve opening (commanded and echoed) | TRVZB numbers | on write | actuation, plausibility |
| TRV availability, battery | Z2M | on change | failure handling |
| Outdoor temperature `T_out` | weather provider or local sensor | 10 to 30 min | loss model |
| Heating relay, store relay state | Shelly | on change | heat availability |
| Relay power (optional) | Shelly 2PM metering | 1 min | burner firing, if the wiring allows (ask the OFTEC engineer) |
| Flow pipe temperature (optional) | clamp probe on flow pipe | on change | direct supply signal; strongly recommended |

All inputs are timestamped, deduplicated and checked for staleness (section 7) before they reach the core.

---

## 4. Balancing algorithm

### 4.1 Room model

Each controllable room `r` is described by a normalised first-order model:

```
dT_r/dt = a_r · S · f(o_r) · φ_r(t)  −  b_r · (T_r − T_out)  +  d_r  +  e_r(t)
```

| Symbol | Meaning | Unit | Learned? |
|---|---|---|---|
| `a_r` | heating gain: warm-up rate at full flow with the valve fully open | K/h | yes |
| `S` | supply factor: share of boiler flow available, falls as more valves open | 0 to 1 | yes, house-wide |
| `f(o)` | valve characteristic: commanded opening % to effective flow fraction | 0 to 1 | defaults, refined later |
| `φ_r(t)` | heat availability at this radiator: 0 when the boiler is off or the store has priority, rising to 1 after the arrival lag | 0 to 1 | lag learned |
| `b_r` | loss rate | 1/h | yes |
| `d_r` | steady extra heat (range cooker, sun, warm neighbour) | K/h | yes, regularised to 0 unless the room has a continuous source |
| `e_r(t)` | episodic disturbance (fire, shower, cooking, window) | K/h | detected, not learned |

**Valve characteristic.** TRV inserts pass most flow in the first part of the stroke. Default `f(o) = clamp((o − o_dead) / (o_sat − o_dead), 0, 1) ^ 0.7`, with `o_dead = 8 %` and `o_sat = 70 %`. A learned dead-zone (minimum opening that produces any `T_trv` rise) replaces `o_dead` per valve after about 10 burns.

**Supply factor.** `S = 1 / (1 + κ · Σ_j f(o_j) + κ_bypass)`, with one house-wide `κ` learned from how room gains drop when many valves are open together. `κ_bypass` represents the always-open stairs radiator.

**Arrival lag.** `φ_r` is 0 until `τ_r` minutes after heat becomes available, then rises with time constant `τ_w` (default 6 min). `τ_r` is learned per radiator: the time from heating relay on (store not recovering) to `dT_trv/dt > 0.05 K/min`. Short lag means near the boiler or high flow. The median of the last 15 valid starts is used.

### 4.2 Flow sensitivity: flow-limited or emitter-limited

Throttling near rooms only helps a slow room if it is short of **flow**. If its radiator is simply too small, extra flow changes little. Radiate estimates for each room the flow sensitivity

```
η_r = Δ ln(observed gain) / Δ ln(S)
```

from burns with few versus many valves open. `η_r ≥ 0.5` means flow-limited (balancing helps); `η_r < 0.2` means emitter-limited (balancing cannot help; the report suggests a bigger radiator or a higher setpoint start time). Rooms with fewer than 10 qualifying burns are treated as flow-limited with `η = 0.7`.

### 4.3 Learning

Online recursive least squares (RLS) per room, parameters `θ_r = [a_r, b_r, d_r]`, regressors `[S·f(o)·φ, −(T − T_out), 1]`, target the smoothed `dT/dt` (local linear fit over the last 10 min of room readings).

- **Forgetting factor** λ chosen for a memory of about 3 days of heating, so seasonal drift is tracked but a single odd day is not.
- **Priors:** `a = 1.5 K/h`, `b = 0.08 /h`, `d = 0`, with prior strength equal to 6 hours of data. `d` keeps a strong prior towards 0 except in rooms with a continuous heat source.
- **Bounds:** `0.1 ≤ a ≤ 12 K/h`, `0.005 ≤ b ≤ 0.6 /h`, `−0.5 ≤ d ≤ 3 K/h`. Values that hit a bound for 24 h raise a diagnostic.
- **Bootstrap:** on first start, replay up to 14 days of history (Home Assistant recorder or the standalone database) through the same estimator, so day one is not a cold start.
- **Outlier rejection:** samples with a residual beyond 4 σ (rolling) are dropped and counted.
- **Confidence:** parameter covariance gives a per-room confidence (0 to 1), shown in the UI and exported.

A sample is used for learning only if **all** gates pass (section 4.6).

### 4.4 Allocation: synchronised arrival

Runs every control tick (1 min) while the boiler is firing or about to fire.

For each calling room with gap `g_r = T_set,r − T_r > 0`, the opening that makes it arrive in time `T*` satisfies

```
a_r · S · f(o_r) = g_r / T*  +  b_r · (T_r − T_out)  −  d_r
```

1. For each flow-limited room, compute its fastest possible arrival with its valve fully open: `T*_r = g_r / (a_r · S − b_r · (T_r − T_out) + d_r)`.
2. Target arrival `T* = max(T*_r)` over flow-limited rooms (the slowest one sets the pace). Emitter-limited rooms get full opening and do not set the pace.
3. Each other room gets the opening that makes it arrive at `T*`, i.e. `o_r = f⁻¹(rate_needed / (a_r · S))`.
4. Recompute `S` with the new openings and repeat (3 iterations are enough; `S` rises as rooms are throttled).
5. Clamp each opening to `[o_floor, 100]`, `o_floor = 20 %` by default (protects TRVZB calibration and keeps every calling room warming).
6. If `T*` exceeds the comfort limit (default 150 min), throttling cannot fix it: open everything and log "boiler capacity limited".

**Patent note:** this is a joint, model-based allocation that equalises predicted arrival times across the house, not a per-radiator rule that throttles whichever radiator heats fastest. See [provenance](research/provenance.md) for the patents to clear (EP1936290 and others). Not legal advice.

**Steady state.** When every room is within 0.3 K of setpoint, the same allocation runs with a 30 min horizon. That gives each room a modest cap that matches its loss rate, the software equivalent of a plumber's lockshield setting.

**Lockshield cap.** Per room, the 90th percentile of allocated openings over the last 7 days is kept as `L_r`. It is written to the valve whenever Radiate enters safe mode (section 7), so balancing persists without Radiate.

### 4.5 Actuation: governed mode

Radiate does **not** pin the valve position (closing = 100 − opening). Pinning leaves a valve stuck open if Radiate dies. Instead, v1 uses **governed mode**:

| TRVZB setting | Value | Why |
|---|---|---|
| `system_mode` | `heat` | |
| `occupied_heating_setpoint` | room's current setpoint | TRV thermostat works on its own if Radiate stops |
| `external_temperature_input` | room sensor reading, refreshed at least every 30 min | room sensor drives the TRV, well inside its 2 h revert |
| `temperature_sensor_select` | `remote_temperature` | values: `local_temperature`, `remote_temperature`, `remote_source_offline` |
| `valve_opening_degree` | allocated opening `o_r` | how far it opens when it calls |
| `valve_closing_degree` | 100 | fully closed when satisfied |
| `smart_temperature_control` | `false` | the adaptive PID mode disables opening limits |

The TRV does the thermostat on/off; Radiate decides how far each valve may open, when the boiler fires and what each TRV believes the room temperature is.

**Schedule mirror.** Radiate also writes each room's schedule into the TRVZB's on-device weekly schedule and runs the TRV in `auto` mode, re-asserting its own setpoint every tick. If Radiate stops, the TRV picks up its schedule at the next transition instead of holding whatever setpoint it last received. In simulation, a crash at midday during setback otherwise leaves the house at 16 °C all evening.

Attribute names are from the Zigbee2MQTT converter (`zigbee-herdsman-converters` `src/devices/sonoff.ts`, commit `f368dcd`, rechecked on master in November 2026). The weekly schedule is written as `weekly_schedule_<day>` strings of up to six `HH:mm/temperature` transitions, the first at 00:00. `external_temperature_input` accepts 0 to 99.9 °C, so colder readings are sent as 0. Whether a setpoint written in `auto` mode holds until the next schedule transition must be confirmed on the pilot valve; the reconciler re-asserts it either way.

**Write discipline** (protects batteries and calibration):

- Opening changes smaller than 3 % are skipped; at most one opening write per valve per 10 min unless the change is 15 % or more.
- **Close bump:** when lowering an opening by 10 % or more, write `o_new + 10 %` first, then `o_new` 5 s later. This works around reported TRVZB calibration drift on repeated small closes. The behaviour is reimplemented from public reports; no third-party code is used.
- A reconciler re-sends any setting whose echoed value disagrees with the target for more than 5 min (maximum 3 attempts, then a diagnostic).
- Valve exercise: in summer (no heating for 7 days), each valve is opened fully and closed once a week at 11:00.

**Test first on one valve** (CLAUDE.md): v1 ships with a per-valve `actuation_enabled` flag, default off for all but one TRV until the owner turns them on. A global **dry run** (the default for a new configuration) reads every device and logs intended writes without sending any. See [configuration](configuration.md).

### 4.6 Learning gates and exclusions

| Gate | Rule | Applies to |
|---|---|---|
| Sensor fresh | room reading ≤ 20 min old, TRV ≤ 30 min old | room |
| No window | window sensor closed, and no drop ≥ 0.6 K in 5 min | room |
| No store recovery | store relay off, or more than the learned recovery time since it switched on and `T_trv` rising again somewhere | house |
| Settled after setpoint change | 15 min since setpoint change | room |
| No episodic heat | see below | room |
| No shower | bathroom humidity not ≥ 8 points above its 2 h median; 45 min hold-off afterwards | bathroom |
| Valve trusted | no reconciler failure in the last hour | room |
| Not passive | room is not `passive` | stairs |

**Open fire (lounge).** Episodic source. Fire is flagged when any of these is true:

- the bound fire sensor or the manual "fire lit" switch is on;
- room rise exceeds 0.8 K/h with the valve closed (`o = 0` or TRV satisfied) and no sun;
- the model residual is above +1.5 K/h for 10 min.

While flagged: no learning for the lounge; the lounge is removed from boiler demand; its valve is closed (opening 0, setpoint unchanged). After the flag clears, a hold-off of 4 h (masonry keeps radiating) before learning resumes.

**Range cooker (kitchen).** Continuous source. The kitchen keeps learning, but `d_r` is free to be large (it absorbs the Aga's steady output). Cooking spikes (residual above +1.0 K/h for 10 min) are treated as episodic and excluded. If the kitchen has not called for heat for 14 days, the UI marks it "self-heated" and its cap drops to `o_floor`.

**Stairs radiator (unvalved bypass).** Not controllable, never actuated, never learned as a room. It is modelled as the always-open path `κ_bypass` in the supply factor, and it counts towards the open-path guarantee (section 5.4). Its room sensor is shown in the UI and used as a weak heat-availability check: a rise on the stairs after the heating relay goes on confirms flow is reaching the radiators.

**Toilet (internal sensor only).** Uses `T_trv` as the room temperature with a −1.5 K default bias (the TRV sits by the radiator; the bias is refined when the TRV has been closed for 2 h and the radiator is cold). It takes part in demand with a wider 1.0 K hysteresis, does not set the pace in allocation, and its learning confidence is capped at 0.5.

---

## 5. Boiler logic (on/off oil combi)

### 5.1 Guard parameters

| Parameter | Default | Range | Basis |
|---|---|---|---|
| Minimum burn | 8 min | 4 to 20 | Oil guidance: burns under 3 min soot and condense; Resideo oil default is 4 min |
| Minimum off | 10 min | 5 to 30 | Lets the heat exchanger recover; limits starts |
| Maximum starts per hour | 3 | 1 to 6 | Resideo oil default 3 per hour |
| Valve lead time | 90 s | 30 to 300 | TRVZB motor travel before the burner fires |
| Comfort limit (pooling) | 0.5 K | 0.2 to 1.5 | Most any room may wait below setpoint |
| Frost threshold | 7 °C | 5 to 10 | Any room below fires regardless of pooling |

### 5.2 State machine

```
            demand ≥ fire threshold
  IDLE ─────────────────────────────▶ LEAD (valves open, 90 s)
   ▲                                     │
   │ min off elapsed                     ▼
  REST ◀──── stop condition ──── FIRING (min burn enforced)
```

- **IDLE → LEAD:** fire condition (5.3) holds and the guards allow a start (minimum off elapsed, starts in the last 60 min below the limit). During LEAD the allocator writes openings.
- **LEAD → FIRING:** heating relay on. Burn timer starts.
- **FIRING → REST:** stop condition (5.3) and minimum burn elapsed. Relay off.
- **REST → IDLE:** minimum off elapsed.
- **Frost override:** any room below the frost threshold forces a start once minimum off has elapsed; below 5 °C it ignores minimum off.

### 5.3 Demand pooling

Rooms do not fire the boiler individually. Each tick:

- **Pooled demand** `D = Σ_r a_r · f(o_r) · max(0, T_set − T_r)` over calling rooms (gain-weighted, so one cold toilet does not count like a cold lounge).
- **Predicted burn** `B` = the allocation's `T*` for the current calling set.
- **Fire** when any room is more than the comfort limit below setpoint, or `B ≥ 1.5 × minimum burn`, or a room's optimum-start time has arrived.
- **Stop** when every calling room is predicted to reach setpoint within one tick, and minimum burn has elapsed.
- **Burn extension:** before stopping, any room predicted to call within the next minimum off + 15 min is topped up (target setpoint + 0.3 K). This turns two short burns into one longer one.
- **Store merging (opt-in):** the store window may be shifted by up to ±30 min to start just before or after a heating burn, so the burner runs once for both.

### 5.4 Open-path guarantee

Before LEAD → FIRING, the predicted heat sink must be enough for the burner: `Σ_r f(o_r) + κ_bypass ≥ sink_min` (default equivalent to two fully open average radiators). If not, the coldest non-calling rooms (relative to setpoint, excluding fire-flagged rooms) are opened as **dump rooms** with a temporary target of setpoint + 0.3 K. The stairs bypass always counts.

### 5.5 Hot-water store (channel 2)

- **Schedule:** up to 4 windows per day; default 06:00 to 07:30 and 17:00 to 21:00.
- **Boost:** 60 min on demand, from the UI, API or HA service.
- **Priority awareness:** the Heatslave gives the store priority, so radiators get no flow while it recovers. When channel 2 turns on, heat availability `φ = 0` for the learned recovery time (default 25 min, learned from `T_trv` stalls during store recovery). Allocation pauses, the burn timer keeps counting (the burner is firing), and learning is gated.

### 5.6 Oil and runtime accounting

- Burner hours, starts, burn-length histogram and starts per hour are kept per day.
- With a nozzle rating (litres/h, from the service sheet), litres used and kWh delivered (litres × 10.35 kWh × assumed efficiency 0.85) are estimated. If relay power metering shows burner firing, actual firing time replaces relay time.
- Short-cycle alert: more than 4 starts in an hour, or burns under the minimum because of an external stop, for 2 hours running.

### 5.7 Fail-safe relay watchdog (Shelly script)

A small Shelly Gen4 script runs on the relay itself:

- Radiate sends a heartbeat every 60 s.
- No heartbeat for 10 min: the script takes over. Channel 1 follows a local fallback schedule (default 06:30 to 08:00 and 17:00 to 21:30) with its own minimum burn and off times; channel 2 follows the store schedule last pushed by Radiate.
- Heartbeat returns: control goes back to Radiate.
- A hard auto-off of 120 min on channel 1 means the relay can never latch on indefinitely.

The script is published in the repository and installed by the user, or with `radiate shelly install-watchdog --yes` over the Shelly local API. Radiate keeps the fallback windows in KVS keys `radiate_heat` (derived from the room schedules, started an hour early) and `radiate_store`.

---

## 6. Control loop

```
every 60 s and on significant input change (debounced 5 s):
  snapshot = collect(inputs)              # timestamped, stale-checked
  actions, state = decide(snapshot, state) # pure core
  apply(actions)                          # drivers, write discipline
  record(snapshot, actions, reasons)      # decision log, metrics
```

`decide` is pure: no clock, no I/O, deterministic. It returns actions (valve settings, relay states, alerts) and a list of **reasons** (`reason_code`, room, values) used by the UI and exported to Elastic.

Order inside `decide`:

1. Validate inputs and update health (section 7).
2. Update disturbance flags (fire, cooker spike, shower, window, store recovery).
3. Learning update (gated).
4. Room demand and comfort state.
5. Boiler state machine and pooling.
6. Allocation (if LEAD or FIRING) or steady-state caps.
7. Hot-water store schedule.
8. Write discipline filters.

---

## 7. Failure modes

| Failure | Detection | Behaviour |
|---|---|---|
| Room sensor stale (> 20 min) | timestamp | Use `T_trv` minus learned bias; learning off for that room; after 2 h, stop sending external temperature so the TRV reverts to its own sensor |
| TRV offline (> 30 min) | Z2M availability | Treated as possibly open at its last opening; excluded from allocation and learning; alert |
| Coordinator or MQTT down | all TRVs or the broker unavailable | Enter **safe mode**: heating relay off after the current minimum burn; heartbeat stops so the Shelly schedule takes over; TRVs keep their last setpoint and cap |
| Radiate process dies | (no detection needed) | TRVs keep governed settings and run their own thermostats; Shelly watchdog takes over after 10 min |
| Radiate restarts | saved state in SQLite | Learned models, lockshield caps and the boiler guard are restored, with timers moved on by the downtime, so minimum burn and minimum off still hold. TRV settings are re-sent |
| Home Assistant restarts or is down | | No effect on control (MQTT drivers); the HA integration shows unavailable |
| Internet down | | No effect on control; cloud telemetry buffered on disk (up to 7 days) |
| Boiler lockout or out of oil | heating relay on for 30 min with at least one valve open (store recovery and time with every valve shut do not count), and no sign of heat: no TRV reading rising 0.6 K above its room, no ordinary calling room warming by 0.3 K/h, no 0.3 K stairs rise | Alert "No heat: check oil and boiler lockout"; keep calling (the boiler may recover) but stop learning. Clears when heat is seen again |
| Valve stuck or calibration lost | commanded open, room calling, boiler firing, no `T_trv` rise for 3 burns; or rise with valve closed | Alert; offer recalibration; room flagged untrusted |
| Short-cycling | > 4 starts per hour | Raise minimum off by 5 min (up to 30) for 24 h; alert |
| Overheating | room > setpoint + 2 K with valve closed | Flag episodic heat (section 4.6); if a valve, not external heat, is to blame, close it and alert |
| Frost | any room < 7 °C | Frost override (section 5.2) |
| Clock jump or DST | monotonic clock in the server | Timers use monotonic time; schedules use local time |
| Corrupt learned state | non-finite or out-of-bounds parameters | Reset that room to priors and replay recent history; alert |

**Safe mode** writes each valve's lockshield cap `L_r`, its schedule setpoint and closing degree 100, so every radiator is balanced and thermostatic without Radiate.

---

## 8. Interfaces

### 8.1 Server API (v1)

- `GET /api/v1/house`: rooms, radiators, boiler, store, learned parameters, health.
- `GET /api/v1/state`: live snapshot (temperatures, openings, demand, boiler state, reasons).
- `POST /api/v1/rooms/{id}/setpoint`, `POST /api/v1/rooms/{id}/fire` (manual fire flag), `POST /api/v1/store/boost`, `POST /api/v1/mode` (`auto`, `off`, `frost`).
- Setpoint overrides: `{"setpoint": 21}` holds the room at 21 °C until its next scheduled setpoint change. Optional `"duration_min": 90` holds it for that long instead (up to 7 days), and `"until": "cleared"` holds it until `{"setpoint": null}` clears it. Overrides are saved and survive a restart; `GET /api/v1/state` shows each room's `override` with `until` and `expires_in_min`.
- `GET /api/v1/decisions?since=`: decision log.
- `WS /api/v1/stream`: state and decision events.
- Authentication: local token; ingress auth in the HA App.

### 8.2 Home Assistant integration

Thin client (ADR-0002). Per room: `climate` entity (setpoint, mode, current temperature), sensors for opening, heating gain, loss rate, arrival lag, confidence, learning state; switch for "fire lit". House: boiler state, starts today, burner hours, litres today, balance score. Services: `radiate.boost_store`, `radiate.set_mode`, `radiate.recalibrate_valve`.

---

## 9. Elastic metrics export

Optional, off by default. Documents follow ECS and are sent with the Bulk API (API key auth) to data streams; an OTLP path to an EDOT collector is planned.

| Data stream | Interval | Key fields |
|---|---|---|
| `metrics-radiate.room-default` | 1 min | `radiate.room.{id,name}`, `temperature.{room,trv,setpoint}`, `valve.opening_pct`, `demand.gap_k`, `model.{a,b,d,eta,arrival_lag_min,confidence}`, `learning.{active,gate}`, `disturbance.{fire,shower,window,cooker_spike}` |
| `metrics-radiate.boiler-default` | 1 min | `boiler.{state,relay,firing}`, `boiler.burn.{elapsed_s}`, `boiler.starts_1h`, `store.{relay,recovering}`, `supply.factor`, `outdoor.temperature` |
| `logs-radiate.decision-default` | per decision | `event.action`, `event.reason`, `radiate.room.id`, `message` |
| `metrics-radiate.daily-default` | daily | `balance.arrival_spread_min`, `balance.score`, `boiler.{starts,burner_hours,litres,kwh}`, `rooms.{comfort_minutes_below}` |

Common fields: `@timestamp`, `data_stream.*`, `host.name` (edge id, not the house name), `service.{name,version}`, `radiate.house.id` (random UUID). No personal data, no location.

- **Time series data streams**: room and boiler streams are TSDS with dimensions `radiate.house.id` and `radiate.room.id`.
- **Buffering**: an on-disk queue (SQLite) holds up to 7 days when Elastic is unreachable; retries with backoff; batch size 500 or 10 s.
- **Assets**: index templates and a Kibana dashboard (balance, burns, rooms) ship in `export/elastic/`.

**Balance score (daily):** for each heating start with two or more calling rooms, the spread between the first and last room reaching setpoint. Score = 100 × (1 − median spread / 120 min), clamped 0 to 100. Weather-normalised following Håkansson et al. 2025.

---

## 10. User interface

One web UI, served by the server and embedded through HA ingress. It is a dashboard people open many times a day, so it is crisp and fast rather than decorative (emil-design-eng):

- **House view**: one card per room with temperature against setpoint, valve opening bar, arrival estimate, learning state ("Learning paused: fire lit"). Boiler strip with a burn timeline for the last 24 h and minimum burn/off countdowns.
- **Motion**: only where it explains state. Valve bars and the burn timeline transition `transform`/`opacity` in 200 ms with a strong ease-out; no animation on keyboard actions; hover effects gated by `(hover: hover) and (pointer: fine)`; `prefers-reduced-motion` keeps fades and drops movement.
- **Explainability**: every room shows its latest reason ("Opening 35 % so it arrives with Bedroom 3 at 07:10").
- **Setup**: discover rooms from Zigbee2MQTT device names or HA areas; wizard marks bypass radiators, heat sources and the boiler relay.

---

## 11. Simulator

A thermal simulator of the reference house (`src/radiate/sim`) drives the same `decide` core:

- Hydraulics: fixed-head pump, per-radiator conductance by pipe run, TRV valve characteristic, always-open stairs path.
- Boiler: on/off burner, internal boiler thermostat, store with hot-water priority and draw-offs.
- Rooms: thermal mass, loss to outdoors, coupling to neighbours, radiator emission `∝ ΔT^1.3`, TRV sensor self-heating.
- Disturbances: open fire evenings, Aga continuous heat, showers, open windows.
- Scenarios compare "no Radiate" (TRVs fully open, boiler on any call) with Radiate on arrival spread, comfort minutes below setpoint, starts per hour and burn lengths. Tests assert the guards are never violated.

---

## 12. Open questions

1. Can the Shelly 2PM channel 1 power reading show burner firing with the planned wiring? Ask the OFTEC engineer to wire so it can, or add a separate meter on the boiler supply. Simulation shows this matters: Radiate cuts relay starts by 80 %, but physical burner starts are set by the boiler's own thermostat cycling inside long calls (see `docs/simulation.md`). Reducing those needs the firing signal.
2. Will the owner fit a flow pipe clamp sensor? It replaces the inferred heat availability with a measured one.
3. Heatslave 12/14 nozzle rating and the boiler thermostat setting, for oil accounting and the simulator.
4. Freedom-to-operate check on EP1936290 and EP2420748 before marketing balancing in Germany or the EU.
