# Radiate specification

Version 0.3, 20 November 2026. Status: checked against the code at commit `925b7a1`, then updated with the owner's decisions on learning memory, pooled demand and stale room sensors (section 13); describes what is built and marks what is still planned.

Decisions this builds on: [ADR-0001](adr/0001-standalone-vs-vtherm-companion.md) (standalone), [ADR-0002](adr/0002-deployment-topology.md) (one engine, three editions). Prior art: [coverage matrix](research/coverage-matrix.md).

Units: °C, K, minutes (min), hours (h), kW, litres. An opening limit is the TRVZB `valve_opening_degree` in %.

Terms follow the [glossary](GLOSSARY.md). A room's **setpoint** is what its schedule or an override asks for now. Its **target** is what Radiate heats it towards this tick: the setpoint, the next setpoint while preheating (optimum start), or the frost threshold in `off` and `frost` modes. A room is **calling** when Radiate wants it heated; a TRV whose own thermostat has opened its valve is **heating**. Starts are **relay starts** unless the text says burner starts.

How to read this page:

- Text without a marker describes the code.
- **Not yet implemented** marks something planned and not built. Each one links to its section of [implementation status](implementation-status.md).
- **Open question** marks a behaviour choice for the owner, where the spec and the code disagree and neither is clearly right. Five are open (section 12): how unheated rooms should feed the room model, and four choices in the planned efficiency work (sections 5.8 and 5.9).
- Section 13 lists what changed in this revision.

---

## 1. Goals for v1

1. Rooms that call for heat together reach their target at about the same time (**synchronised arrival**), instead of near rooms overshooting while far rooms lag.
2. The oil burner runs **fewer, longer burns**: hard minimum burn, minimum off and relay starts per hour limits, plus demand pooling.
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
| **Room** | name, area, setpoint schedule, room sensor (optional), radiators, role (`normal`, `passive`, `internal_sensor_only`, `unheated`), heat sources |
| **Radiator** | TRV (optional), nominal output at ΔT50 (W, optional), `controllable` flag |
| **Heat source** | `episodic` (open fire, wood burner) or `continuous` (range cooker), optional binary sensor or schedule |
| **Boiler** | relay for heating demand, `on_off` type, fuel `oil`, rated output kW, nozzle rating (litres/h, optional), guard parameters (section 5) |
| **Store** | relay for store enable, schedule, priority over heating (`true` for Heatslave) |

As built, a room has one radiator, at most one TRV, at most one room sensor and at most one window sensor, and `controllable` follows from the role: `normal` and `internal_sensor_only` rooms are controllable, `passive` and `unheated` rooms are not. An `unheated` room has a room sensor and no radiator (section 4.6). **Not yet implemented** ([status](implementation-status.md#2-house-model)): room area, radiator nominal output, and binding a heat source to a binary sensor or schedule. The fire is flagged by detection or by the manual fire switch in the API.

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
| Valve opening limit (commanded and echoed) | TRVZB numbers | on write | actuation, plausibility |
| Device availability, battery, link quality (LQI) | Z2M | on change | failure handling, the devices view and its alerts (section 10) |
| Outdoor temperature `T_out` | local Zigbee sensor, or Home Assistant (a weather or temperature entity, posted by radiate-ha), chosen by `house.outdoor_source` | 10 to 30 min | loss model, savings |
| Heating relay, store relay state | Shelly | on change | heat availability |
| Relay power (optional) | Shelly 2PM metering, each channel | 1 min | burner firing: heat availability, store priority and accounting (sections 4.1, 5.5, 5.6), where the boiler's load passes through the relay |
| Flow pipe temperature (optional) | clamp probe on flow pipe | on change | direct supply signal; strongly recommended |

All inputs are timestamped, deduplicated and checked for staleness (section 7) before they reach the core. Battery and link quality do not reach the core: they feed the devices view and its alerts (section 10). A battery sensor reports on change, so while it is available its last reading counts as current for `house.sensor_max_silence_min` (60 min by default); after that its real age applies.

**Relay state and burner firing.** The snapshot says whether its relay states were read from the relay this tick (`relay_observed`). Without a reading (no `shelly` section, or the Shelly unreachable) the driver stands in Radiate's last command, which in dry run was never sent, so learning and accounting take nothing from it. The driver turns each channel's power reading into **burner firing** (`heating_burner`, `store_burner`): firing at or above `shelly.burner_threshold_w` (100 W), stopped below that less `shelly.burner_hysteresis_w` (20 W), unchanged in between. On the reference boiler the heating channel reads about 185 W while the burner fires (single readings of 230 W at each relight), 52 to 60 W with the relay on and the boiler's own thermostat holding the burner off (the pump only), and 0 W with the relay off; the store channel reads about 125 W while the store burner runs and 0 W once the store is satisfied, relay on or not. A channel is trusted only after it has read at or above the threshold since Radiate started: where the relay switches a low-current demand line, the burner's load never passes through it and a low reading proves nothing. Until then, and with `shelly.burner_metering: false`, burner firing is unknown.

**Outdoor source.** `house.outdoor_source` chooses where `T_out` comes from: `zigbee` (the default, the sensor named by `house.outdoor_sensor`, as before), `home_assistant` (the last reading radiate-ha posted to `POST /api/v1/outdoor`, section 8.1), or `both` (the Zigbee sensor while it has a reading, otherwise Home Assistant). The choice is pure, in `radiate.core.outdoor`. A Home Assistant reading counts only while it is plausible (-40 to 50 °C) and younger than `house.outdoor_stale_after_min` (180 min by default), measured from when Home Assistant last reported its entity, not from when it was posted. Without a usable reading the core assumes 5 °C, as it always has (section 7).

**Not yet implemented** ([status](implementation-status.md#3-signals)): a weather provider of Radiate's own (Home Assistant's weather entity stands in for one) and the flow pipe temperature.

---

## 4. Balancing algorithm

### 4.1 Room model

Each controllable room `r` is described by a normalised first-order model:

```
dT_r/dt = a_r · drive_r  −  b_r · (T_r − T_out)  +  d_r  +  e_r(t)
drive_r = low-pass of S · f(o_r) · φ_r(t), time constant 15 min
```

| Symbol | Meaning | Unit | Learned? |
|---|---|---|---|
| `a_r` | heating gain: warm-up rate at full flow with the valve fully open | K/h | yes |
| `S` | supply factor: share of boiler flow available, falls as more valves open | 0 to 1 | no: computed from the opening limits with a fixed `κ` |
| `f(o)` | valve characteristic: opening limit % to effective flow fraction | 0 to 1 | no: defaults |
| `φ_r(t)` | heat availability at this radiator: 0 when the boiler is off or the store has priority, 1 after the arrival lag | 0 or 1 | lag learned |
| `b_r` | loss rate | 1/h | yes |
| `d_r` | steady extra heat (range cooker, sun, warm neighbour) | K/h | yes, regularised to 0 unless the room has a continuous source |
| `e_r(t)` | episodic disturbance (fire, shower, cooking, window) | K/h | detected, not learned |

`f(o)` is only counted while the TRV reports it is heating (or, if it doesn't report, while the room is below its target), so a TRV whose own thermostat has shut adds no drive.

**Valve characteristic.** TRV inserts pass most flow in the first part of the stroke. `f(o) = clamp((o − o_dead) / (o_sat − o_dead), 0, 1) ^ 0.7`, with `o_dead = 8 %` and `o_sat = 70 %`. **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): a learned dead zone per valve (the smallest opening limit that produces any `T_trv` rise), replacing `o_dead` after about 10 burns.

**Supply factor.** `S = 1 / (1 + κ · (Σ_j f(o_j) + κ_bypass))`, summed over the rooms calling or topped up, with `κ = 0.15` and the bypass equivalent `κ_bypass = 0.4`, the always-open stairs radiator counted in fully open radiators. Both are fixed defaults (`HouseConfig.supply_kappa`, `HouseConfig.bypass_equivalent`) and are not in the configuration file. **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): learning one house-wide `κ` from how room gains drop when many valves are open together.

**Heat availability and drive.** `φ_r` is 0 until the room's arrival lag has passed since flow started (heating relay on and the store not recovering), then 1. With burner metering (section 3), flow also needs the burner to have fired in this call for heat, or within 15 min before it began (the boiler is still hot); it then lasts until the relay goes off, through the boiler thermostat's own off periods, as the water stays hot. A call whose burner never fires, for example with the boiler's own timer or thermostat holding it off, brings no heat. The product `S · f(o_r) · φ_r` is smoothed with a 15-minute time constant, which stands for the radiator warming up and cooling down. That smoothed value is the room's **drive**.

**Heat known.** The drive is only evidence when the relay (or the burner) shows when the radiators get heat. It does not when the relay was not read, or in a dry run without burner metering: Radiate is not running the boiler then, and the boiler's own timer may call heat while the relay is off, or hold it off while the relay is on. Learning then pauses (`heat_unknown`, section 4.6). Before this rule, a dry run on the reference house taught the models that the radiators barely warm the rooms: heating gains of 0.15 to 0.36 K/h at confidence over 0.9, against 5 to 7 K/h measured after go-live.

**Arrival lag.** `τ_r` is learned per radiator: when flow starts with the TRV heating, Radiate notes `T_trv` and waits for it to rise 0.6 K. The time taken is one sample; a probe with no rise within 40 min, or one where flow stops first, is dropped. The median of the last 15 samples is used, and 8 min until the first sample. Short lag means near the boiler or high flow.

### 4.2 Flow sensitivity: flow-limited or emitter-limited

Throttling near rooms only helps a slow room if it is short of **flow**. If its radiator is too small, extra flow changes little. The plan is to estimate the flow sensitivity per room

```
η_r = Δ ln(observed gain) / Δ ln(S)
```

from burns with few versus many valves open. `η_r ≥ 0.5` means flow-limited (balancing helps); `η_r < 0.2` means emitter-limited (balancing cannot help; the report suggests a bigger radiator or an earlier start).

**Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): every room uses the default `η = 0.7`, so every room is treated as flow-limited and there is no emitter-limited report.

### 4.3 Learning

Online recursive least squares (RLS) per room, parameters `θ_r = [a_r, b_r, d_r]`, regressors `[drive, −(T − T_out), 1]`, target the smoothed `dT/dt`: a least-squares slope over the last 15 min of room temperatures, needing at least 10 min and four readings.

- **Memory:** long, set by `learning.memory_days` (1 to 3650, default 730). Learning updates come one per ungated minute tick, so the forgetting factor is `λ = 1 − 1/(memory_days × 1440)`: two years of learning by default, two heating seasons, so an odd week barely moves a model. An anti-windup step stops the covariance growing beyond its prior while the input is not exciting. On 36 days of simulator inputs, the median room's heating gain stays within a range of 2 % of its value with this memory (12 % at worst, the kitchen), against 11 % (36 %) with the 33-hour memory used before. In a 5-day run from priors the long memory costs some comfort while the first days are still in the model (see [simulation](simulation.md#learning-memory-and-change-detection)).
- **Change detection:** a long memory alone would take months to follow a real change, such as a radiator bled, replaced or silting up, or a valve changed. Each model watches its innovations (the residual before the update, rejected samples included, each clipped to the outlier limit) and re-learns when they stay biased:
  - **gain:** over about 6 hours of learning (an average over 360 updates), the residual's least-squares slope against the drive is at least 35 % of the heating gain, with enough heating in that window (mean squared drive at least 0.02). Not judged while the gain sits on the bound it is being pushed past.
  - **level:** over about a day of learning (1,440 updates), the residual's mean is at least half its root mean square.

  Neither is checked in a model's first 2 days of learning from priors, except that a model whose confidence has reached 0.8 has stopped moving on its own and is judged on the gain before then, against a bias of twice the gain (the room warms at least three times as fast as the model says). A model still settling from its priors is often out by its whole gain, which is why the warm-up exists. Both gain limits are at least 0.5 K/h, so a gain near its lower bound is not judged on noise. To re-learn, the model adds 30 % of its prior covariance back, widens the outlier limit to the recent residuals, and resets the statistics; the long memory then carries on.
- **A wrong model cannot lock itself.** Confidence measures how far the data has narrowed the heating gain, not how well the model fits, so a model fitted to bad data is confident and wrong. The gate that relies on its residual in an ordinary room (`unexplained_heat`, section 4.6) then holds back the very samples that would correct it: on the reference house after go-live, it held learning for 76 to 86 of about 104 firing minutes in every ordinary room. So a sample held back only by that gate, with every other gate open, still feeds the gain statistic (not the level one, as heat with the radiator off is what the gates are for), without updating the model. Steady extra heat must not be learned as radiator output, which would drift the model towards under-heating, so these samples are not watched in a room with a range cooker (`cooker_spike`) or while the gain looks like sun: between 08:00 and 17:00 on a day the outdoor temperature has risen at least 1 K above its lowest since midnight. And a change these held-back samples show, or one judged before the warm-up, re-learns only once it **persists**: seen in heating periods (a new one after 30 minutes without a misfit while heating) at least 18 hours apart and at least 6 hours apart in the time of day, within 3 days. Sun comes at the same time each day; a wrong model shows in every burn. These misfits are not saved, so a restart only delays a re-learn. After any re-learn the hold ends, and the model is **in doubt** for its next 60 heating updates (drive at least 0.2): the residual rules (`unexplained_heat`, `cooker_spike` and the fire residual rule) stand down and no sample is rejected as an outlier, so it learns from the heat it could not explain. In a test with a bedroom model trained to `a = 0.15 K/h` against a room that warms at 6 K/h at full drive, with hourly burns, it is re-learned on the second day once the misfit has shown 18 hours apart, and later burns bring it above 2 K/h (the slope window's lag keeps the fit below the true 6). The trade-off: a wrong model now locks learning for up to about a day longer, and one heated only at the same time every day is not re-learned from held-back samples; `POST /api/v1/learning/reset` is the way out there. Each re-learn raises the reason `learning.relearn`, which goes to the decision log. In simulation, a radiator that loses half its output is re-learned within about a day; the same model without change detection is still far off days later (see [simulation](simulation.md#learning-memory-and-change-detection)). An error-variance rule was tried as well, but in simulation it did not separate a real change from an ordinary day, so it is not used. A large rise in a radiator's output can close the `unexplained_heat` gate and hide some of the evidence; in simulation a radiator whose output rose by 60 % was still re-learned within about a day.
- Change-detection statistics are saved with each room's model as counts of learning updates, so they need no clock. Saves from before change detection load with fresh statistics.
- **Priors:** `a = 1.5 ± 1.5 K/h`, `b = 0.08 ± 0.06 /h`, `d = 0 ± 0.05 K/h`. A room with a continuous heat source starts at `d = 0.3 ± 1.0 K/h`, so `d` is free to absorb the range cooker; everywhere else it stays near 0.
- **Bounds:** `0.1 ≤ a ≤ 12 K/h`, `0.005 ≤ b ≤ 0.6 /h`, `−0.5 ≤ d ≤ 3 K/h`. **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): a diagnostic when a value sits on a bound for 24 h.
- **Bootstrap:** when Radiate starts with no usable saved state, and when `radiate bootstrap` runs, the standalone database's tick history (up to `house.history_days`, 14 by default) is replayed through `decide` from priors with a throwaway state, so day one is not a cold start. Only the room models, arrival lags and lockshield histograms are kept; the boiler guard and timers come from the saved state. **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): the Home Assistant recorder as a second source.
- **Reset:** `POST /api/v1/learning/reset` (section 8.1) puts the named rooms, or every room with a model, back to their priors: the model, the arrival lags and the lockshield histogram. It writes no device and logs `learning.reset`. It is for models learned under conditions that did not hold that no invalidation rule names (below). With the server stopped, `radiate bootstrap` instead re-learns every model from the tick history from priors, and the `heat_unknown` gate keeps a recorded dry run without metering out of it. A replay across a reset differs from then on, as the reset is not a tick.
- **Upgrades** ([ADR-0007](adr/0007-learned-state-across-upgrades.md)): learned state survives an upgrade. The saved engine state has a format version (2), and each older version is brought forward by a migration tested from a fixture of what that version wrote. On restore, a model parameter that is not finite, outside its bounds or with a negative variance goes back to its prior on its own; the others are kept. Each room's learned parts (model, arrival lags, lockshield histogram) carry their **provenance**: learning updates counted by condition (`live_burner`, `live_relay`, `dry_burner`, `dry_relay`, and `unknown` for updates from a save that did not record them), the local days of the first and latest update, the learner version and the Radiate version that last learned. A model carried over from a save without provenance is trusted less: 30 % of its prior variance goes back, once. **Invalidation rules** name learning a release knows is wrong; `decide` checks every room each tick and resets only the rooms a rule names, with the reason `learning.invalidated`. The first rule: learning from a dry run without burner metering, or from a save without provenance, is invalid once the burner is metered. Every migration, dropped parameter and reset is logged and shown as a learning note for 14 days (`learning_notes`, section 8.1). A save from a newer version is not read: it is kept, untouched, under `engine.v<N>`, and Radiate starts from priors or the tick history.
- **Outlier rejection:** after the first 30 updates, a sample whose error is beyond 4 σ of the rolling residual is dropped and counted, except while the model is in doubt after a re-learn.
- **Confidence:** how far the heating gain's uncertainty has shrunk from its prior, 0 to 1, shown in the UI and exported. Capped at 0.5 for internal-sensor rooms.

A sample is used for learning only if **every** learning gate is open (section 4.6).

### 4.4 Allocation: synchronised arrival

Runs every tick (1 min) for the rooms that are calling or topped up. Its opening limits are written while the boiler is in lead or firing.

For each room with gap `g_r = target_r − T_r > 0`, the allocated opening that makes it arrive in time `T*` satisfies

```
a_r · S · f(o_r) = g_r / T*  +  b_r · (T_r − T_out)  −  d_r
```

1. For each room, compute its fastest possible arrival with its valve fully open: `T*_r = g_r / (a_r · S − b_r · (T_r − T_out) + d_r)`.
2. Target arrival `T* = max(T*_r)` over the rooms that set the pace: `normal` rooms that are not topped up and not preheating. If no room qualifies, every reactive room counts. Emitter-limited rooms would get full opening and not set the pace (see 4.2).
3. Each other room gets the opening that makes it arrive at `T*`, that is `o_r = f⁻¹(rate_needed / (a_r · S))`. A preheating room aims at its own deadline instead, divided by a 1.25 safety margin, so it is throttled only as far as still gets it there on time.
4. Recompute `S` with the new openings and repeat, 4 iterations in all (`S` rises as rooms are throttled).
5. Clamp each opening to `[o_floor, 100]`, `o_floor = 20 %` by default (protects TRVZB calibration and keeps every calling room warming).
6. If `T*` exceeds the comfort horizon (default 150 min), throttling cannot fix it. The allocator paces at the horizon instead, so the slowest room still gets as much flow as the others leave it, and marks the allocation capacity limited. **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): logging "boiler capacity limited"; `Allocation.capacity_limited` is not reported anywhere.

With `balancing: false`, every allocated room gets 100 % instead.

**Patent note:** this is a joint, model-based allocation that equalises predicted arrival times across the house, not a per-radiator rule that throttles whichever radiator heats fastest. See [provenance](research/provenance.md) for the patents to clear (EP1936290 and others). Not legal advice.

**Lockshield cap.** Each tick the boiler is firing, a room's allocated opening is added to a histogram whose weights decay by 0.9995 a sample, a half-life of about 1,400 samples, roughly 23 hours of firing. The room's lockshield cap `L_r` is the 90th percentile of that histogram, and 60 % until it holds 30 samples' weight. Whenever a room is not being allocated (the boiler is idle or resting, or the room is neither calling nor topped up), its valve gets `L_r`, so it carries a balanced opening limit into the next call and keeps it if Radiate stops. This is the software equivalent of a plumber's lockshield setting.

**Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): a steady-state allocation with a 30 min horizon when every room is within 0.3 K of its target. The lockshield cap is used instead.

### 4.5 Actuation: governed mode

Radiate does **not** pin the valve position (closing = 100 − opening). Pinning leaves a valve stuck open if Radiate dies. Instead, v1 uses **governed mode**:

| TRVZB setting | Value | Why |
|---|---|---|
| `system_mode` | `auto` with the schedule mirror (the default), `heat` without | the TRV follows its mirrored schedule if Radiate stops |
| `occupied_heating_setpoint` | the TRV setpoint: room's target in the TRV's frame (see below), 0.5 K steps, 4 to 35 °C | TRV thermostat works on its own if Radiate stops |
| `external_temperature_input` | room sensor reading, sent when it changes by 0.2 K and at least every 25 min | room sensor drives the TRV, well inside its 2 h revert |
| `temperature_sensor_select` | `remote_temperature` in a room with a room sensor, `local_temperature` in an internal-sensor room | values: `local_temperature`, `remote_temperature`, `remote_source_offline` |
| `valve_opening_degree` | the opening limit: allocated opening `o_r` while allocated, otherwise the lockshield cap `L_r`, and 0 while a fire is flagged | how far the valve opens when the TRV is heating |
| `valve_closing_degree` | 100 | fully closed when satisfied |
| `smart_temperature_control` | `false` | the adaptive PID mode disables opening limits. Only where the TRV has it: some firmware (TRVZB 1.3.0) rejects it |

A setting the TRV doesn't take is held back: one Zigbee2MQTT rejects with `UNSUPPORTED_ATTRIBUTE` or has no converter for (read from its `bridge/logging`), and a governed setting the device's definition in `bridge/devices` doesn't expose. Each is dropped on its own, so the others still go. Without `smart_temperature_control` there is no adaptive mode to turn off, so that loses nothing and it is not sent again. Any other rejected setting (the external temperature, setpoint, valve degrees, system mode) shows in the room's `valve.rejected`, raises `driver.write_failed`, and is sent again 60 minutes after the latest rejection, since the failure may pass or the firmware may change.

The TRV does the thermostat on/off; Radiate decides how far each valve may open, when the boiler fires and what each TRV believes the room temperature is.

**TRV setpoint.** The TRV compares its setpoint with the reading it regulates on, so Radiate writes the setpoint in that frame. Every valve Radiate counts as open must really open, or the burner fires into shut valves:

| Room | Not heating | Calling, boiler in lead or firing | Topped up (burn extension or heat sink), boiler in lead or firing |
|---|---|---|---|
| Normal (room sensor sent as external temperature) | target | target + 0.6 K | the call setpoint for the top-up target, but at least room temperature + 1 K, rounded up |
| Internal sensor only (TRV compares its own reading) | target − bias | target − bias + 0.6 K, rounded up | the call setpoint for the top-up target, but at least the TRV reading + 1 K, rounded up |

With the default −1.5 K bias and an 18 °C target, the toilet's TRV gets 19.5 °C when idle and 20.5 °C when calling. The 0.6 K call bias and the 1 K sink lead put the setpoint far enough above the TRV's reading that its own hysteresis (about 0.5 K on the TRVZB, to be checked on the pilot valve) cannot hold the valve shut.

**Schedule mirror.** Radiate also writes each room's schedule into the TRVZB's on-device weekly schedule and runs the TRV in `auto` mode, re-asserting its own setpoint every tick. In an internal-sensor room the mirrored schedule is shifted into the TRV's frame. If Radiate stops, the TRV picks up its schedule at the next transition instead of holding whatever setpoint it last received. In simulation, a crash at midday during setback otherwise leaves the house at 16 °C all evening.

Attribute names are from the Zigbee2MQTT converter (`zigbee-herdsman-converters` `src/devices/sonoff.ts`, commit `f368dcd`, rechecked on master in November 2026). The weekly schedule is written as `weekly_schedule_<day>` strings of up to six `HH:mm/temperature` transitions, the first at 00:00. `external_temperature_input` accepts 0 to 99.9 °C, so colder readings are sent as 0. Whether a setpoint written in `auto` mode holds until the next schedule transition must be confirmed on the pilot valve; the reconciler re-asserts it either way.

**Write discipline** (protects batteries and calibration):

- Opening limit changes smaller than 3 points are skipped; at most one opening limit write per valve per 10 min unless the change is 15 points or more, or the new limit is 0.
- **Close bump:** when lowering an opening limit by 10 points or more, write `o_new + 10` first, then `o_new` 5 s later. This works around reported TRVZB calibration drift on repeated small closes. The behaviour is reimplemented from public reports; no third-party code is used.
- The **reconciler** re-sends any setting whose echoed value disagrees with what was sent for more than 5 min (2 min for the setpoint, which the TRV's own schedule can move at a transition). After 3 attempts the setting is marked rejected: Radiate raises the `driver.write_failed` alert and pauses learning for the room (section 4.6). Nothing is checked in dry run, where nothing is sent.
- **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): a summer valve exercise (no heating for 7 days: each valve opened fully and closed once a week at 11:00).

**Test first on one valve** (CLAUDE.md): each room has an actuation flag, set with `actuate` in the configuration file (`RoomConfig.actuation_enabled` in code). If no room sets `actuate`, only the pilot valve, the first room with a TRV in file order, is actuated, until the owner turns more on. A global **dry run** (the default for a new configuration) reads every device and logs intended writes without sending any. See [configuration](configuration.md).

### 4.6 Learning gates and exclusions

A room learns only while every gate is open. The room's `learning_gate` names the first closed gate, in this order:

| Gate | Rule | Applies to |
|---|---|---|
| `fire`, `fire_holdoff` | episodic heat, see below | rooms with an episodic heat source |
| `window` | window sensor open, or a drop of 0.6 K or more within 5 min; held for 30 min | room |
| `shower` | humidity 8 points or more above its 2 h median (at least 10 readings); 45 min hold-off | rooms with `humidity: true` |
| `cooker_spike` | residual above +1.0 K/h for 10 min in a room with a continuous heat source; held 60 min | kitchen |
| `unexplained_heat` | the same signal in a room with no heat source, such as sun or guests; held 60 min | room |
| `no_heat` | the no-heat alert is active (section 7) | house |
| `heat_unknown` | the relay was not read this tick, or a dry run without burner metering (section 4.1) | house |
| `valve_untrusted` | the stuck valve check has flagged the room (section 7) | room |
| `valve_leaking` | the leaking valve check has flagged the room (section 7) | room |
| `valve_rejected` | the TRV rejected a setting (reconciler), and for an hour after | room |
| `no_data` | no usable temperature, slope or outdoor difference | room |
| `sensor_stale` | a `normal` room's own sensor is stale and its temperature comes from the TRV, and for the 15 min slope window after the sensor is back. Off with `learning.learn_on_trv_fallback: true` | room |
| `trv_offline` | the TRV is unavailable | room |
| `store_recovery` | the store relay has been on for less than the store's recovery time | house |
| `setpoint_change` | less than 15 min since the target changed | room |

Passive and unheated rooms have no room model, so they never learn.

When a room's temperature switches source, from its sensor to the TRV fallback (section 7) or back, the window of readings behind its slope starts again, as does the window drop check. The TRV fallback reads about 1.5 K off the room sensor, so after a restart, while the sensors have not yet reported, the step back up would otherwise look like a 1.5 K rise in a minute to the fire and `unexplained_heat` rules.

A room whose sensor is stale still has a temperature: it falls back to `T_trv` plus the TRV bias (section 7). It doesn't learn from that reading by default, because the TRV sits beside its radiator and reads the radiator as much as the room, which no single bias corrects. The `sensor_stale` gate holds until the slope window contains room sensor readings only. To learn from the TRV reading anyway, set `learning.learn_on_trv_fallback: true`. Internal-sensor rooms always use the TRV and are not affected.

With burner metering, store recovery lasts exactly while the store burner fires (section 5.5). **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): without metering, ending store recovery early once `T_trv` is seen rising again somewhere, and learning the recovery time (it is fixed, 25 min by default, `store.recovery_min`).

**Open fire (lounge).** Episodic source. Fire is flagged when any of these is true:

- the manual "fire lit" switch is on (binding a fire sensor is not yet implemented, section 2.1);
- the room rises faster than 0.8 K/h while its radiator has had no heat for 30 min (drive near 0), heat is known (section 4.1) and the radiator is cold;
- the model residual has been above +1.0 K/h for 10 min, is now above +2.0 K/h, the room's confidence is at least 0.6, the model is not in doubt (section 4.3) and the radiator is cold.

The radiator counts as cold unless its TRV, which sits beside it, reads more than 1 K above the room sensor (both fresh); without both readings the other conditions decide. Radiator heat is never a fire.

The thresholds came from simulation: the planned +1.5 K/h residual rule flagged morning warm-up as a fire before the model had learned, so the residual rule now needs a confident model and the rise rule needs the radiator off for 30 min (see [simulation](simulation.md#bugs-the-simulator-caught)). The reference house showed the rest. In its dry run the lounge was flagged at about 18:00 with no fire lit, and so held in `fire_holdoff` until about 22:25: its model was at its priors (confidence 0), so the residual rule could not have fired, and the rise rule judged the radiator off from a relay and valve openings that did not describe the boiler, which ran on its own timer. A confident model as wrong as the bedrooms' would have made every warm-up a fire through the residual rule. Both rules now need the radiator cold, and the rise rule needs heat known. If the TRVZB's `local_temperature` turns out to report the external temperature it is sent rather than its own sensor, the radiator check never fires and only the heat-known condition applies; this is still to be confirmed on the pilot valve.

While flagged: no learning for the lounge; the lounge is removed from boiler demand; its valve is closed (opening limit 0, setpoint unchanged). The flag clears after 30 min with no evidence and the switch off. Then a hold-off of 4 h (masonry keeps radiating) runs before learning resumes.

**Range cooker (kitchen).** Continuous source. The kitchen keeps learning, and `d_r` is free to be large (it absorbs the Aga's steady output). Cooking spikes close the `cooker_spike` gate. **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): if the kitchen has not called for heat for 14 days, the UI marks it "self-heated" and its lockshield cap drops to `o_floor`.

**Stairs radiator (unvalved bypass).** Not controllable, never actuated, never learned as a room. It is modelled as the always-open path `κ_bypass` in the supply factor, and it counts towards the open-path guarantee (section 5.4). Its room sensor is shown in the UI and used as a weak heat-availability check: in the no-heat check (section 7), a 0.3 K rise on the stairs while the heating relay is on shows heat is reaching the radiators.

**Unheated rooms (no radiator).** A room with a room sensor and no radiator, such as a landing, a boot room or the room the boiler is in. Its temperature, and its humidity unless turned off, are read, recorded in the tick history, exported and shown, labelled as having no radiator. It has no TRV, no schedule, no room model and no demand, so it never learns, never calls and never trips frost protection. It does not count towards the open path (it has no radiator), and unlike the stairs its warming is never taken as heat arriving in the no-heat check: a room warmed by the boiler's casing or a range cooker would otherwise hide an empty oil tank. The API refuses a setpoint for it. How its readings could feed the model is **Open question** 5 (section 12).

**Toilet (internal sensor only).** Uses `T_trv` as the room temperature with a −1.5 K default bias (the TRV sits by the radiator). Its TRV setpoint is written in the TRV's own frame, target − bias (section 4.5), so the TRV opens when Radiate calls. The schedule mirrored into its TRV is shifted into the same frame, so the fallback schedule holds the room near its target if Radiate stops. It takes part in demand with a wider 1.0 K hysteresis, does not set the pace in allocation, and its learning confidence is capped at 0.5.

The bias is not refined. A refinement was planned for when the TRV has been closed for 2 h and the radiator is cold, but then the TRV reads the room (an offset near 0 K), while a warm radiator lifts the reading by 2 to 3 K in simulation. One bias cannot match both. Moving it towards 0 K, or fading it as the radiator cools, left the toilet short of heat and raised the house comfort deficit in simulation, so the bias stays at the configured value. See [simulation](simulation.md#internal-sensor-rooms-and-the-trv-bias).

---

## 5. Boiler logic (on/off oil combi)

### 5.1 Guard parameters

| Parameter | Default | Range | Basis |
|---|---|---|---|
| Minimum burn | 8 min | 4 to 20 | Oil guidance: burns under 3 min soot and condense; Resideo oil default is 4 min |
| Minimum off | 10 min | 5 to 30 | Lets the heat exchanger recover; limits starts |
| Maximum relay starts per hour | 3 | 1 to 6 | Resideo oil default 3 per hour |
| Valve lead time | 90 s | 30 to 300 | TRVZB motor travel before the burner fires |
| Comfort limit (`comfort` demand mode) | 0.5 K | 0.2 to 1.5 | Most any calling room waits below its target |
| Eco limit (`eco` demand mode) | 1.5 K | 0.5 to 3, at least the comfort limit | Most a calling room waits below its target for other rooms to join it |
| Frost threshold | 7 °C | 5 to 10 | Any room below fires regardless of pooling |
| Hard frost threshold | 5 °C | fixed | Below it a start also ignores minimum off and starts per hour |

### 5.2 State machine

```
            fire rule holds (5.3)
  IDLE ─────────────────────────────▶ LEAD (valves open, 90 s)
   ▲                                     │
   │ min off elapsed                     ▼
  REST ◀──── stop rule ──────── FIRING (min burn enforced)
```

- **IDLE → LEAD:** the fire rule (5.3) holds and the guard allows a start (fewer relay starts in the last 60 min than the limit). During LEAD the allocator's opening limits are written.
- **LEAD → IDLE:** the fire rule stops holding before the lead time is up.
- **LEAD → FIRING:** after the valve lead time, heating relay on. Burn timer starts.
- **FIRING → REST:** stop rule (5.3) and minimum burn elapsed. Relay off.
- **REST → IDLE:** minimum off elapsed.
- **Frost override:** any room below the frost threshold makes the fire rule hold, within the usual guards. Below the hard frost threshold, 5 °C, the start ignores minimum off and the starts-per-hour limit. When the reading comes from a room sensor, hard frost needs a second source to agree: the room's TRV below 7 °C (5 °C plus 2 K, as it sits by the radiator) or another room below the frost threshold (section 7).

The boiler guard also adopts relay states it did not command (hand-back, section 5.7).

### 5.3 Demand pooling

The **demand mode** decides how calling rooms fire the boiler. It is set by `boiler.demand_mode` in the configuration file (`eco` by default) and can be changed at runtime through `POST /api/v1/settings` (section 8.1) without a restart. The runtime choice is saved in the state database, and each tick's snapshot records the mode it was decided in, so replay decides the same way. Each tick:

- **Predicted burn** `B` = the allocation's `T*` for the current calling set.
- **Pooled demand** `D = Σ_r (target_r − T_r) / a_r` over calling rooms: the time at full radiator output the calling rooms need between them, in minutes. A room that warms quickly needs little of the burner per kelvin, so it counts for less. With the learned gains of the simulated house, the toilet 1.2 K below its target counts 6.5 min and a bedroom 0.5 K below counts 10 min.
- **Fire** when heating is allowed (mode not `off`, or a room below the frost threshold), at least one room is calling, and either a calling room is preheating (optimum start), a room is below the frost threshold, or the demand mode's rule holds:
  - `eco` (default): `D ≥ 1.5 × minimum burn` (12 min by default), or a calling room is more than the eco limit (1.5 K) below its target. A room on its own waits until it is colder or other rooms join it. While the valves are opening (lead), `D ≥ 0.75 × 1.5 × minimum burn` keeps the start going, so a 0.1 K reading doesn't call it off.
  - `comfort`: a calling room is more than the comfort limit (0.5 K) below its target, or `B ≥ 1.5 × minimum burn`. Any room fires the boiler as soon as it is noticeably cold.

  Below the hard frost threshold the boiler fires regardless.
- **Waiting:** while a calling room waits in `eco` mode with the boiler idle, it carries the reason `demand.pooled` ("Toilet: calling, waiting for more rooms to share a burn (eco)"). `boiler.lead` reports `pooled_demand_min` with its other values.
- **Stop** when no room is calling or extended. A room stops calling when it reaches its target. Heat sinks never keep the burner on. Minimum burn still holds.
- **Burn extension:** once per burn, when the boiler is firing and no room calls any more, each room that is not calling, not flagged for fire, has a reading and has its TRV online is checked: if it is predicted to fall below its target minus the hysteresis within the next minimum off + 15 min, it is topped up. Its top-up target is `max(target + 0.3, min(T₀ + 0.5, target + 1.0))`, where `T₀` is its temperature when the top-up started. This turns two short burns into one longer one.

The plan weighted the pooled demand the other way, `D = Σ_r a_r · f(o_r) · max(0, target − T_r)`, so one cold toilet would not count like a cold lounge. The heating gain `a` is a warm-up rate per unit of the room's own thermal mass, though, so a small room with a modest radiator has the largest gain: the simulated toilet learns about 12 K/h against 2 to 5 K/h elsewhere. Multiplying by `a` made the toilet count most. Dividing by it gives the intended effect. Without room areas or radiator outputs (section 2.1), Radiate can't weigh rooms by the heat they need, only by time.

In simulation, `eco` cuts relay starts by 19 % on mild days and 7 % on cold days against `comfort`, with longer burns. The boiler's own thermostat still sets most physical burner starts, so those barely change. On mild days the comfort deficit is the same within the spread between seeds; on cold days with an undersized pump it rises 5 %. See [simulation](simulation.md#eco-and-comfort-demand-modes).

In `eco`, each room's use right now (in use, occasional or setback, from the household or a hand-written room's use level) decides whether it can start a burn on its own and how far below its target it waits first, whether it counts in pooled demand, whether it keeps the burner running and whether it can take a top-up, never below a 12 °C damp floor. The rules above are those for a room without room use. See 5.8.

**Not yet implemented** ([status](implementation-status.md#5-boiler-logic)): **store merging** (opt-in), shifting the store window by up to ±30 min to start just before or after a heating burn, so the burner runs once for both.

### 5.4 Open-path guarantee

During LEAD and FIRING, while a room is calling or extended or the burn is inside minimum burn, the open path must be enough for the burner: each room calling or topped up counts as one fully open radiator (the allocator's floor keeps each near full flow fraction), plus the bypass equivalent `κ_bypass`, and the total must reach `sink_min`, 1.5 fully open radiators by default (`HouseConfig.sink_min`, not in the configuration file). If not, the coldest rooms relative to their target that are not calling (excluding rooms flagged for fire, with no reading or with the TRV offline) are opened as **heat sinks**, one at a time until the total is reached, with the top-up target from 5.3. A heat sink is often already above that target, so its TRV setpoint is at least its reading + 1 K, rounded up to 0.5 K (section 4.5); otherwise the TRV's own hysteresis keeps the valve shut and only the bypass takes the heat. The stairs bypass always counts.

### 5.5 Hot-water store (channel 2)

- **Schedule:** up to 4 windows per day, the same every day; default 06:00 to 07:30 and 17:00 to 21:00.
- **Boost:** 60 min by default, 0 to 180, from the UI, API or HA service.
- **Priority awareness:** the Heatslave gives the store priority, so radiators get no flow while it recovers. For the store's recovery time after channel 2 turns on (25 min by default, `store.recovery_min`), heat availability `φ = 0`, so the drive falls away and the arrival lag clock does not start. With burner metering (section 3), recovery is instead exactly while the store burner fires: it ends as soon as the store is satisfied, and a reheat later in a store window (after a shower, say) counts too. The burn timer keeps counting (the burner is firing), and learning is gated (`store_recovery`). **Not yet implemented** ([status](implementation-status.md#5-boiler-logic)): learning the recovery time from `T_trv` stalls during store recovery.

### 5.6 Oil and runtime accounting

- Burner hours, relay starts, burn-length histogram and the most relay starts in any hour are kept per day.
- **Burner hours** come from the burner's firing time when the relay's power metering shows it (section 3, basis `firing`). Without metering they fall back to heating relay time (basis `relay`), which includes the boiler thermostat's own off periods inside a call, so they are an upper bound; on the reference house the relay was on 104 min for 73 min of firing, 43 % high. A day with both is `mixed`. Relay hours (`relay_hours`) and relay-basis litres (`litres_relay`) are always reported alongside, and `burner` gives the metered heating and store firing hours, burner lightings (`heating_starts`, `store_starts`; the boiler's own thermostat cycling inside a call, which the boiler guard does not see) and the store's litres. The relay starts, burns and histogram stay relay-based: they are what the boiler guard governs.
- With a nozzle rating (litres/h, from the service sheet), litres used and kWh delivered (litres × 10.35 kWh × assumed efficiency 0.85) are estimated from the burner hours.
- Only what was seen counts. A relay the driver could not read counts nothing, and in a dry run, where Radiate does not run the boiler, relay time is not burner time and burns get no arrival spread: only metered firing counts. Before this, the reference house's go-live day counted a 538 min dry-run burn, from relay states Radiate did not control.
- Days follow local midnight. The day so far and the previous day are in `GET /api/v1/state` under `accounting`; each closed day goes to the daily Elastic stream.
- A day is **partial** when Radiate did not see all of it: it started after midnight, or more than 30 min of the day went unseen between ticks (including time down across a restart). A partial day's totals cover what Radiate saw, it carries `partial: true` (Elastic `radiate.partial_day`), and its balance score is null: a first day starts with untrained models, so its arrival spread says little about the house.
- Short-cycle alert: more than 4 relay starts in an hour, or burns under the minimum because of an external stop (the relay dropped while Radiate still called) for 2 hours running, meaning such burns at least an hour apart within the last two hours. Radiate's own guard allows at most 3 relay starts an hour, so this catches another controller, a manual switch or a relay dropping out.

### 5.7 Fail-safe relay watchdog (Shelly script)

A small Shelly Gen4 script runs on the relay itself:

- Radiate sends a heartbeat every tick (60 s).
- No heartbeat for 10 min: the script takes over. Channel 1 follows a local fallback schedule (the windows Radiate last pushed; 05:30 to 08:30 and 16:00 to 22:30 until it has pushed any) with its own minimum burn (8 min) and off (10 min) times; channel 2 follows the store schedule last pushed by Radiate.
- Heartbeat returns: control goes back to Radiate. The boiler guard first adopts the relay as Radiate finds it (**hand-back**). A burn Radiate did not start gets a full minimum burn from when Radiate first sees it, because the Shelly does not report when the relay changed. A relay seen switching off, or not seen for 5 min or more (Radiate down, Shelly unreachable, a first start), restarts minimum off from then. While in safe mode Radiate follows the watchdog's burns without stopping them, so it knows their start when it takes over.
- A hard auto-off of 120 min on channel 1 means the relay can never latch on indefinitely.

The script is published in the repository and installed by the user, or with `radiate shelly install-watchdog --config radiate.yaml --yes` over the Shelly local API. Radiate keeps the fallback windows in KVS keys `radiate_heat` (derived from the room schedules, started an hour early) and `radiate_store`. The heating windows come from each room's week for everyone at home, never from the weeks compiled for people away, and are never empty: with no window at all Radiate writes the script's own defaults (section 7, fail warm). A room held at one setpoint all day heats all day only when it is warm that day: its use level that day is in use or occasional (from the household, or the room's `use` key). A room with no use level counts only above the household's unused temperature (14 °C by default) and the damp floor, so a house with unused rooms held at 14 °C does not keep the relay on all day.

### 5.8 Room use in demand

Built ([status](implementation-status.md#planned-efficiency-by-room-use)); not live on the reference install until the owner agrees, since it changes when the boiler fires. Decided in [ADR-0004](adr/0004-efficiency-by-room-use.md) (proposed); built by the [efficiency plan](plans/efficiency-mvp.md). Changes the `eco` demand mode only; `comfort` keeps the rule in 5.3.

The household already says how each room is used. In `eco`, that decides each room's part in demand, so a room nobody is using does not start the boiler for half a degree, and the heat from a burn goes to rooms people are in.

**Room use.** Each tick the runtime works out how each controllable room is used right now, from the compiled household, and passes it in the snapshot (`RoomInput.use`), so the tick history records it and replay decides the same way:

| Room use | When |
|---|---|
| `in_use` | inside a warm period on a day the room's use level is in use, inside a warm period a room adjustment added, or while the room has a setpoint override |
| `occasional` | inside a warm period on a day the room's use level is occasional |
| `setback` | any other time: a room that is unused that day, overnight, between warm periods, and while its people are away |
| none | the room has a hand-written schedule without a use level (so every room, without a household or use levels) |

Warm periods are the live schedule's (`CompiledHousehold.periods`, at the level in `CompiledHousehold.warm_levels`), so heating ahead of a period by optimum start is preheating, not room use. A room with no room use behaves exactly as in 5.3. Snapshots recorded before room use existed have none, so they replay unchanged.

**Hand-written rooms.** A room on a hand-written schedule can give its use level in the house file with the household's words: `use: in_use`, `occasional` or `unused`, or `{weekdays: ..., weekend: ...}` (`rooms[].use`, `SiteConfig.schedule_use`). Its warm periods are the spans of its schedule's day where the setpoint is above that day's lowest setpoint, and room use then follows the table above: its level inside a warm period, `setback` outside them and all day on an unused day, `in_use` with an override. The weekend level applies on Saturday and Sunday, the days the schedule's own `weekend` key covers. A day with one setpoint throughout has no warm periods; on a day whose level is in use or occasional it counts as warm all day at that level (the room is held at that temperature because it is used), and on an unused day it is `setback` all day. Without the key, the room has no room use, as before. With the key it also gets a savings baseline from its schedule (5.9); without it, none. A room the household covers can't have the key.

**Roles in `eco`:**

| Room use | Starts a burn on its own (solo limit) | Counts in pooled demand | Keeps the burner running | Burn extension | Heat sink |
|---|---|---|---|---|---|
| `in_use` | more than the eco limit (1.5 K) below its target | yes | yes | yes | first choice |
| `occasional` | more than the eco limit + 1 K (2.5 K) below its target | yes | yes | yes | second choice |
| `setback` | more than the eco limit + 1 K below its target | no | only a burn it started | no | last resort |
| none | more than the eco limit below its target (5.3) | yes | yes | yes | coldest first (5.4) |

- **Damp floor.** No solo limit lets a room with room use wait below `min(target, damp_floor_c + damp_margin_k)`. For such a room the **solo threshold**, the temperature below which a calling room starts a burn on its own, is `max(target − limit, min(target, damp_floor_c + damp_margin_k))`. The damp floor is 12 °C (`DAMP_FLOOR_C`, `BoilerConfig.damp_floor_c`, not in the configuration file), the value the household setup already warns about. The **damp margin** (`boiler.damp_margin_k`, 0.3 K by default, 0 to 1) starts the burn a little above the floor, so the air stays above it while the valves open and the radiator warms (open question 12). With the default temperatures, a 19 °C room in use starts a burn below 17.5 °C, a 16 °C occasional room below 13.5 °C, and a 14 °C setback room below 12.3 °C. A room whose own target is 12.3 °C or lower starts a burn as soon as it calls.
- **Pooled demand** (5.3) sums `gap / a` over calling rooms that are not `setback`. A setback room's need never helps start a burn.
- **Taking heat.** A setback room that calls while a burn runs for other rooms is allocated and heated up to its own target, as today. It does not keep the burner on: the stop rule (5.3) counts a calling room only if it is not `setback`, if it started the burn itself, or if it is preheating. That **solo latch** (`RoomState.solo`, API `rooms[].solo`) is set when the room passes its solo threshold and cleared when it stops calling, so a setback room that fell to the damp floor is heated back to its setback temperature in one burn, not to a fraction above 12 °C. A room without room use has no latch: it counts as solo only while below its threshold, as in 5.3.
- **Burn extension** (5.3) tops up only rooms that are `in_use` or `occasional` now.
- **Heat sinks** (5.4) are chosen `in_use` first, then `occasional`, then `setback`, coldest relative to target within each. Boiler safety still wins: when nothing else meets the open path, a setback room is opened.
- **Optimum start** (section 6) looks up to 3.25 hours ahead for a room with room use (`PREHEAT_USE_MAX_S`), against 3 hours otherwise: a room set back to near its damp floor needs longer to reach a warm period's temperature. A calling room that is preheating still fires the boiler and keeps it running (it is about to be in use). Tuned in the simulator: with 3 hours rooms in use arrived late (warm-period deficit up 18 to 34 % against `eco`), with 3.5 hours or more the owner-like house started more burns than `eco`.
- **Unchanged:** frost and hard frost overrides; the boiler guard; the open-path guarantee; the allocator.
- **Reasons.** A calling room left waiting keeps `demand.pooled`. A setback room calling with the boiler idle gets `demand.setback`: "Lounge: not in use now, takes heat only when the boiler is already on". A burn a setback room starts at its floor reads `demand.floor`, once, when the latch is set: "Lounge: down to 11.9 °C, heating to 14.0 °C" (values `temperature_c`, `target_c`). `GET /api/v1/state` gives each controllable room's `use` (or null) and `solo`.

**Example.** A household with an office used on weekdays, a bedroom used when getting up and going to bed, a dining room and kitchen used while people are home, and a lounge, spare bedroom and toilet marked unused, with 18 °C for rooms in use and 14 °C for unused rooms and overnight. On a weekday the bedroom is `in_use` for 30 minutes after getting up; optimum start heats it before then. During working hours the office is `in_use` and the bedroom `setback`: the bedroom at 13.7 °C doesn't start a burn, but takes heat while the office's burn runs. The lounge is `setback` all week: it starts a burn of its own only if it falls to 12 °C, and is never topped up. At the weekend the office is `setback` too.

**What it saves and costs in simulation** ([simulation](simulation.md#room-use-in-eco), `radiate sim-efficiency`, 21 measured days, seeds 1 to 3): against `eco` without room use, with the 0.3 K damp margin: 0.7 to 2.1 % less burner oil (0.1 to 0.35 litres a day), 5 to 22 % fewer relay starts, and a warm-period comfort deficit from 3.5 % lower to 7.3 % higher, inside the 10 % tolerance. Unused rooms sit between 12 °C and their unused temperature instead of held at it. The research estimated 1 to 3 % of space heating ([control efficiency, section 3](research/control-efficiency.md#3-room-importance-weighting)). With the burn at the floor itself, the air in a setback room dipped up to 0.4 K below 12 °C, for 40 to 80 room-minutes a day, while the burn got going. The 0.3 K damp margin now applied keeps the owner-like house at or above 11.97 °C and costs part of the saving (open question 12). The real house decides; it needs the owner's go-ahead and a few days in dry run first.

**Not yet implemented** and outside the first cut ([status](implementation-status.md#planned-efficiency-by-room-use)). Each is to be tried in the simulator against these rules first:

- **Optimum stop:** near the end of a warm period, a room stops calling if its model predicts it stays within 0.5 K of its setpoint until the period ends; pooling and burn extension ignore rooms about to set back.
- **Arrival-tuned optimum start:** learn each room's preheat margin from its arrival error, in place of the fixed 1.2 margin and the 80 % supply factor in `_preheat_due`.
- **Outdoor cut-off:** no comfort heating while the 24 h mean outdoor temperature is above 15 °C; frost and the damp floor still apply.
- **Damp guard:** from each room sensor's humidity and the outdoor temperature, estimate the coldest surface's humidity; raise a damp room's floor and suggest ventilating, and let dry rooms' unused and night temperatures go lower.
- **Room activity and usage:** `POST /api/v1/rooms/{id}/activity` with `{"active": true, "since": "...", "source": "light.lounge"}` from radiate-ha (Home Assistant areas mapped to rooms), feeding a pure per-room usage log (15 minute slots: active, idle or unknown) and two usage suggestions, "kept warm but not used" and "used outside its warm periods", each applied as a use level change or a room adjustment. Activity never drives the valves directly. Needs radiate-ha first (ADR-0003).
- **Store hours:** ending the store windows at the last regular draw-off, and store merging (5.3).

### 5.9 Savings

Built: the accounting, the house signature, the gate and the report in `radiate.core.savings`, with every closed day summary carrying its `savings` record; the baseline in the snapshot (plan slice 1, with hand-written rooms added by slice 3); closed days kept and `GET /api/v1/savings` (slice 4, `radiate.server.savings`); and the Savings view (slice 5). See [status](implementation-status.md#planned-efficiency-by-room-use). Decided in [ADR-0004](adr/0004-efficiency-by-room-use.md) (proposed). The method follows the [usage and savings research](research/usage-and-savings.md#3-measuring-savings-honestly), with a different baseline and a correction that lets a day's saving be negative.

Radiate estimates the oil it saved against one stated baseline, from measured room and outdoor temperatures and the oil it measured, and shows the comfort it cost beside it. The estimate is pure, in `radiate.core.savings`.

**Baseline.** In the UI's words: "Compared with a heating timer on from the first person up to the last to bed every day, and each room's valve set to its usual temperature." Per controllable room and day, from the household compiled with nobody away and without room adjustments:

- Timer on from the first person's getting up, less the fixed preheat, to the last person's bedtime: the valve schedule's day.
- Valve set to the room's temperature for that day's use level (its own `temperature` if it has one, its unused temperature on an unused day).
- Timer off at any other time, so the baseline puts no heat in.

The runtime passes it in the snapshot (built; `compile_baseline` in `radiate.config.use`): `RoomInput.baseline_c` is the baseline setpoint now, or `None` while the baseline timer is off, and `Snapshot.baseline` is true when any room has a baseline.

**Hand-written rooms.** A room on a hand-written schedule with a use level (`rooms[].use`) gets a baseline too (`compile_schedule_baseline`):

- Timer on from the household's first person up, less the fixed preheat, to the last to bed, the same timer as household rooms, when there is a household with people (it need not cover any room).
- Otherwise, timer on from the earliest warm period start to the latest warm period end across the house's hand-written schedules that day (warm periods as in 5.8). No warm period that day: the timer stays off.
- Valve set to the room's usual temperature: the highest setpoint its schedule sets that day.
- Timer off at any other time, as for household rooms.

A room with neither a household entry nor a use level has no room use and no baseline, and takes no part in savings: the meter skips it, and `report` weighs only the rooms the latest closed day measured. Without any room with a baseline there are no savings.

**Each tick**, per controllable room with a reading, while the outdoor reading is real (not the 5 °C default), with `dt` in hours, capped at 300 s, and the interval since the last tick belonging to the day it started in (as in the ledger):

```
heat_r     = 1 if the baseline timer is off, or the room's setpoint is above baseline_c; else 0
lift_r    ← max(0, lift_r + (a_r · drive_r · heat_r − b_r · lift_r) · dt)
B_r        = max(T_r − lift_r, baseline_c)   while the baseline timer is on
B_r        = T_r − lift_r                    while it is off
DH_act_r  += max(0, T_r − T_out) · dt
DH_base_r += max(0, B_r − T_out) · dt
```

- **Anchored on the reading.** `B_r` starts from the room's real temperature, so a fire, the range cooker, the sun and warm neighbours warm both sides and cancel.
- **Lift** is how much warmer Radiate's own heating has made the room than the baseline would have, during time the baseline would not have heated it: before the timer starts (optimum start), overnight, and in a warm period a room adjustment added. It decays at the room's loss rate. Without it, a night where Radiate holds a room warm would cost nothing; with it, a day can show a negative saving.
- **Comfort**, per room while its room use is `in_use` or `occasional`: the **comfort deficit**, `max(0, setpoint − 0.5 − T) · dt` in K·h (the simulator's measure), and the **warm share**, the share of those minutes at or above `setpoint − 0.5 K`.

The day's record goes into the closed day's summary as `savings`: per room `dh_actual_kh`, `dh_baseline_kh`, `deficit_kh`, `warm_min`, `warm_ok_min` and `read_min` (minutes with a reading), plus `outdoor_share` (share of the day with a real outdoor reading), `baseline_share` (share with a baseline) and `outdoor_mean_c`.

**Eligible day:** not partial (5.6), `outdoor_share`, `baseline_share` and each room's share of the day with a reading at least 0.9, litres known (a nozzle rating), and the same litres basis as the other days in the fit.

**Room weights.** Each room's degree-hours count in proportion to `b_r / a_r`, the radiator time each kelvin of inside minus outside needs, the same unit as pooled demand (5.3); equal weights until every counted room's confidence is at least 0.6. Weights come from the current models and are applied to every day at report time, so days stay comparable as the models learn. Whether `b / a` beats equal weights is checked in the simulator before release.

**House signature.** Over the last 60 eligible days, a straight-line fit that resists odd days (Theil-Sen slope, median intercept) of litres per day against weighted actual degree-hours: `litres = k · DH_act + c`. `c` absorbs standing losses. If the fit gives `c < 0`, it is refitted through the origin (`c = 0`, `k = Σ litres / Σ DH_act`).

**Gate.** Figures appear only with at least 14 eligible days, `k > 0`, a fit CV(RMSE) of 25 % or less, and weather that has varied enough to tell `k` from `c`: the 90th percentile of the fit days' weighted degree-hours at least 1.3 times the 10th. Until then the API and the UI say "still learning" and why, such as "8 of 14 days", "the weather hasn't varied enough yet" or "no outdoor sensor".

**Saving** for an eligible day: `k · (DH_base − DH_act)`, weighted, in litres, kept negative when it is negative. Baseline litres are the day's litres plus its saving. The percentage is total saving over total baseline litres. A room's share, `k · w_r · (DH_base_r − DH_act_r)`, is an attribution, and is labelled as one.

**Litres basis.** A day's litres are burner hours × nozzle rating (5.6). With burner metering they come from firing time (`basis: "firing"`); without it from relay time (`basis: "relay"`), which counts the boiler thermostat's own off periods inside a call, so they read high. `k` is inflated by the same factor on both sides, so the percentage holds and relay-basis litres are an upper bound; the UI says so. A fit uses days of one basis only, the latest day's (a `mixed` day, part metered, is left out and never sets the basis), so switching basis restarts the 14 day gate. Metering works only if the channel carries the boiler's own load; if it only switches the boiler's thermostat input, `apower` stays near zero, the channel is never trusted (section 3), and a separate meter on the boiler's supply is needed (open question 1). The driver derives firing from the power reading with `shelly.burner_threshold_w`, so the threshold is not in the tick history and a replay cannot try another.

**Persistence.** The day so far (per room accumulators and lift) is saved with the engine state as an optional `savings` section with its own `version`, so older saves still load and a later shape can be migrated. Lift decays over the downtime at each room's loss rate. Each closed day's summary, with its `savings` record, is kept in the state database (key `daily_history`, saved as `{"version": 1, "days": [...]}`) for 730 days, the learning memory's default. A repeated day replaces the earlier one. A history of another version is set aside and savings learn again; control never reads it.

**Honesty rules.** Always show comfort beside savings. Never clamp a day at zero. No figures for partial days, before 14 eligible days, for days without an outdoor reading, or without a nozzle rating. Say "about" and "estimated", never "up to". Never project a year from a short run. One baseline only.

**Checked in the simulator before release** ([plan, slice 6](plans/efficiency-mvp.md#slice-6-simulator-comparison-and-estimator-check)): the estimate against the simulated true difference between the same weeks run under Radiate and under the baseline as a controller. In the simulator the baseline is a programmer that calls the boiler for the whole timer window, as a plain timer does, with each TRV on its own sensor; the boiler's standing losses while the valves are shut are not in degree-hours, so the estimate should come out at or below the true saving. Later, against oil deliveries over a winter.

**Not yet implemented** beyond the first cut: an oil price (`oil_price_per_litre` in settings, stored with each day so a later change doesn't rewrite history) and money in the UI; a Kibana dashboard panel.

---

## 6. Control loop

```
every 60 s:
  snapshot = collect(inputs)              # timestamped, stale-checked
  actions = decide(config, snapshot, state)  # pure core, updates state
  apply(actions)                          # drivers, reconciler, dry run
  record(snapshot, actions, reasons)      # decision log, tick history, metrics
```

**Not yet implemented** ([status](implementation-status.md#6-control-loop)): an extra tick on a significant input change, debounced 5 s.

`decide` is pure: no clock, no I/O, deterministic. It returns actions (valve settings, relay states, alerts) and a list of **reasons** (code, message, room, values) used by the UI and exported to Elastic.

`record` keeps the last 500 boiler, disturbance, safe mode, `learning.relearn`, `learning.invalidated` and `learning.reset` reasons in memory as the decision log. It also keeps each tick's snapshot and a compact form of its actions (valve settings, relays, boiler state, reason and alert codes) in the state database for `house.history_days` days, 14 by default, with a start entry that describes how the engine state was built at each start. Recording errors are logged and never stop the loop. `radiate replay` runs the recorded snapshots through `decide` again and reports where the actions differ; with the same code and configuration there are none.

Order inside `decide`:

1. Store recovery and heat availability.
2. Per room: effective temperature, target and optimum start, drive, stuck and leaking valve observations, residual and disturbance flags, arrival lag probe, learning gates and the learning update, and the demand latch.
3. No-heat check and valve verdicts (section 7).
4. Hand-back: adopt the relay as observed (section 5.7).
5. Boiler demand: fire rule, burn extension and heat sinks (sections 5.3, 5.4), then allocation for the rooms calling or topped up.
6. Safe mode, short-cycle adaptation and the boiler guard step.
7. Accounting for the day.
8. Per room: opening limit (allocation, lockshield cap or fire), TRV setpoint, then write discipline for actuated rooms.
9. Hot-water store schedule and boost.

---

## 7. Failure modes

| Failure | Detection | Behaviour |
|---|---|---|
| Room sensor stale | no reading for `house.sensor_max_silence_min` (60 min) while the sensor is available, or for 20 min once Zigbee2MQTT reports it unavailable | Use `T_trv` plus the configured TRV bias, and stop sending external temperature, so the TRV reverts to its own sensor after about 2 h. Learning pauses (`sensor_stale`, section 4.6) unless `learning.learn_on_trv_fallback` is `true` |
| TRV offline | Z2M availability, or nothing heard for twice `house.sensor_max_silence_min` when availability is not reported | Alert `driver.trv_offline`; learning pauses (`trv_offline`); no valve writes. With a fresh room sensor the room still counts for demand (fail warm, below); without one it is excluded from demand. **Not yet implemented** ([status](implementation-status.md#7-failure-modes)): treating it as possibly open at its last opening limit in the supply factor |
| Coordinator or MQTT down | broker disconnected or Zigbee2MQTT offline, which marks every TRV unreachable; or no TRV reachable for any other reason | Enter **safe mode** (alert `safe_mode.no_trvs`): no new start except below the hard frost threshold; a burn Radiate started runs to minimum burn and the relay is switched off; then Radiate sends no relay commands and no heartbeat, so the Shelly watchdog's schedule takes over. TRVs keep their last setpoint and opening limit, which is the lockshield cap unless they were allocated. Radiate keeps reading the relay and follows the watchdog's burns, then hands back as in section 5.7 |
| Radiate process dies | (no detection needed) | TRVs keep governed settings and their mirrored schedules and run their own thermostats; Shelly watchdog takes over after 10 min |
| Radiate restarts | saved state in SQLite | Learned models, lockshield caps, valve verdicts, the short-cycle adaptation, the day's accounting, overrides, each room sensor's last reading (fail warm, below) and the boiler guard are restored, with timers moved on by the downtime, so minimum burn and minimum off still hold. After 5 min or more down, or with no saved state, the watchdog might have switched the relay, so the guard restarts its timers from the relay as found (section 5.7). TRV settings are re-sent |
| Home Assistant restarts or is down | | No effect on control (MQTT drivers); the HA integration shows unavailable. With `house.outdoor_source` set to `home_assistant` or `both`, see the next row |
| Outdoor reading from Home Assistant stale or missing | no plausible reading measured within `house.outdoor_stale_after_min` (180 min), or none since it was set up; with `both`, the Zigbee sensor has no reading either | Counts as missing: the core assumes 5 °C, as without any outdoor sensor, and those minutes don't count towards a savings day's `outdoor_share`. Alert `outdoor.stale`, and `outdoor_reading.stale` in `state`. Clears with the next fresh reading |
| Internet down | | No effect on control; Elastic export buffered on disk (up to 7 days) |
| Boiler lockout or out of oil | heating relay on for 30 min with at least one valve open (store recovery and time with every valve shut do not count), and no sign of heat: no TRV reading rising 0.6 K above its room, no ordinary calling room warming by 0.3 K/h, no 0.3 K stairs rise (a passive room; an unheated room's warming never counts) | Alert "No heat: check oil and boiler lockout" (`boiler.no_heat`); keep calling (the boiler may recover) but stop learning (`no_heat`). Clears when heat is seen again |
| Valve stuck | 40 min of flow per burn with the room calling, its opening limit at least the floor and the TRV reporting heat, while another radiator warmed, and its own TRV reading did not rise 0.6 K against the room; 3 burns in a row | Alert `valve.stuck`; room flagged untrusted (learning paused, `valve_untrusted`); not counted as an open valve. Clears when its radiator warms again |
| Valve leaking (rise with valve closed) | during flow, with the room not calling, its TRV not heating and its valve shut since before the flow began (radiator off 20 min), the TRV reading rises at least 1 K against the room sensor, in 2 of the last 5 judged burns. Rooms without a room sensor, and rooms flagged for fire, window, shower or a cooker spike, are not judged | Alert `valve.leaking`; room flagged untrusted (learning paused, `valve_leaking`). Clears after 5 judged burns in a row that stay cool. No recalibration offer: the TRVZB has no calibration command in Zigbee2MQTT ([status](implementation-status.md#7-failure-modes)) |
| Short-cycling | > 4 relay starts per hour, or external stops (section 5.6) | Raise minimum off by 5 min (up to 30) for 24 h, at most once an hour; alert `boiler.short_cycle`. Kept across restarts |
| Overheating | a sustained positive residual (section 4.6) | Learning gated (`unexplained_heat`, or `fire` or `cooker_spike` where the room has that heat source). **Not yet implemented** ([status](implementation-status.md#7-failure-modes)): the planned rule for a room above setpoint + 2 K with its valve closed, and closing a valve to blame with an alert |
| Frost | any room < 7 °C | Frost override (section 5.2) |
| Clock jump or DST | monotonic clock in the server | Timers use monotonic time; schedules use local time |
| Corrupt learned state | non-finite or out-of-bounds parameters | A whole saved state that can't be read, or one from a newer version, is relearned from the tick history (section 4.3); a newer one is kept aside untouched. A parameter that is not plausible goes back to its prior on its own; a model that can't be read resets its room to priors. Each is logged and shown as a learning note (ADR-0007). **Not yet implemented** ([status](implementation-status.md#7-failure-modes)): replaying history for that one room |

**Fail warm** ([ADR-0005](adr/0005-fail-warm-presence.md)). No connectivity or device problem may lower the heating. Any input that can lower a room's temperature (presence, away, room use, an outdoor reading, a sensor) must, when it is missing, silent or doubtful, count as the reading that keeps the house warmer: uncertain presence counts as home. The rule came from an incident: a phone ran out of battery and stayed `not_home` in Home Assistant with its last update frozen; the integration kept re-reporting `not_home` every 15 minutes, so stale presence (which measures how recently the integration reported, not how recently the phone did) never tripped, and with one person in the household everyone away held the whole house at 7 °C. The rules, per person:

| Case | Before | Now |
|---|---|---|
| `not_home`, the person's trackers reported within the evidence limit, 240 minutes by default | away after the presence delay | away after the presence delay: positive evidence of absence |
| `not_home`, trackers quiet for longer than the evidence limit | away | **unknown**, counts as home, reason `away.presence_uncertain`; the person's `why` reads "No report from their phone or tracker since 10:17, so counted as home." |
| `not_home` from an integration that doesn't send `evidence_at` | away | away for at most the evidence limit after `since`; after that unknown, counts as home |
| `not_home` from a router or Bluetooth tracker, or a phone at 5 % battery or less | away after the presence delay | away after the weak source delay, 240 minutes by default (or the presence delay, if longer): a phone asleep or dead at home looks like one that has left |
| Presence not reported for the stale limit (Home Assistant or the integration down) | unknown | unknown (unchanged) |
| The person says they are home ("I'm home", `POST /api/v1/people/{id}/home`, Back now in the web UI) | only cleared an away until | ends the away until, and a `not_home` that began before it counts as home until their presence changes again; a heartbeat repeating the same state doesn't undo it. Reason `away.home` |
| Evidence someone is in: a setpoint override that raises a room above its current target (clearing an override, or holding or lowering a room, is not evidence, since an automation does that in an empty house), a store boost, the fire switch, a shower detected, after the person's presence last changed | ignored | every person away by presence counts as home until their presence changes again, reason `away.home_evidence` |
| Everyone away by presence only | frost (7 °C) with `everyone_away: frost` | every household room at its unused temperature, never frost |
| Everyone away with an away until each (said by the people) | frost with `everyone_away: frost` | frost with `everyone_away: frost` (unchanged) |
| A room override while everyone away holds frost | ignored: every room at frost | the override applies; every other room stays at frost |
| A room set back because someone is away by presence | the unused temperature, however low | never below the damp floor, 12 °C, unless the room would be lower anyway. An away until is the person's own choice and isn't floored |

- The presence report takes three optional fields: `evidence_at`, the newest `last_reported` (or `last_updated`) across the `device_tracker` entities behind the `person`, whatever their state; `source_type`, their kind (`gps`, `router`, `bluetooth`, `bluetooth_le`), and `battery`, the phone's charge in per cent. `evidence_at` and `since` later than now are taken as now. `evidence_at` and `source_type` are kept from the last report that gave them; `battery` is taken from each report, so a report without it clears it. A report with no state forgets the presence and any "I'm home", so a person no longer mapped is dropped. The server accepts reports without them and treats them as above (ADR-0003). `GET /api/v1/people` gains each person's `presence.evidence_at`, `presence.source_type`, `presence.battery`, `presence.uncertain` (`evidence_old`, `said_home` or `home_evidence`) and `presence.why`, and `home_at`.
- `household.away.presence_evidence_max_age_min`: 240 by default, 30 to 1440. `household.away.presence_weak_source_delay_min`: 240 by default, 0 to 1440. Too short a limit, or too long a delay, only costs saving, never warmth.
- `everyone_away: frost` applies only when every person has an away until. Presence alone, however long, sets the house back to the unused temperature. A frost hold stays the household's explicit choice.
- Frost protection is unchanged and applies in every case.
- Not yet implemented: an `evidence_age_s` on each setback in `state`, and a setup warning for a person linked only to router trackers.
- Other inputs that can lower heating on failure (an audit is listing them) get a row here, each with its fail warm reading, before they change behaviour.

Radiate does not write anything special to the valves in safe mode: it cannot reach them. The lockshield cap is written whenever a room is not being allocated (section 4.4), so every radiator already carries a balanced opening limit, its schedule setpoint and closing degree 100, and stays balanced and thermostatic without Radiate.

**Fail warm: fallbacks, devices and sensors.** Built. Each row is an input or fallback that could lower the heating, with its fail warm reading.

| Case | Behaviour |
|---|---|
| TRV offline, room sensor fresh | The room still counts for demand and allocation, so a lived-in room doesn't go cold (reason `room.trv_offline`). Radiate can't write to it: the TRV keeps its last setpoint and opening limit (usually the lockshield cap), and its external temperature for about 2 h, then its own sensor. It counts for no heat sink in the open-path guarantee, since its valve may be shut. If its room has not warmed 0.3 K after 60 minutes of heat flowing while it calls (heat the relay or burner shows, section 4.6 `heat_unknown`; in a dry run without metering none counts), its valve is probably shut, so it stops counting until the TRV is back, with alert `valve.offline_no_warming` |
| Room sensor implausible | A normal room's sensor reading below 0 °C or above 40 °C, or unchanged for 12 hours (2 hours below the frost threshold) while the room's TRV reading moved by 2 K or more and at least half of the other rooms' sensors changed, is treated as missing: the room uses its TRV reading plus the TRV bias, no external temperature is sent, and alert `sensor.implausible`. A room that is just steady, by its TRV too, is not flagged |
| Room sensor alone below hard frost | Hard frost (a start that ignores minimum off and starts per hour, section 5.2) needs a second source when the reading comes from a room sensor: the room's own TRV below 7 °C, or another room below the frost threshold. Without one, the room still gets frost protection within the usual guards, with alert `sensor.frost_unconfirmed`. A sensor stuck low can no longer run the burner with no minimum off |
| House file household settings hidden by a saved one | Not a device fault, but it fails the same way: a fix made in the house file (for example `everyone_away: unused`) does nothing while the web UI's saved `household.yaml` replaces the whole `household` section. Precedence is unchanged. `check-config` and the start-up log warn and name each hidden setting, and `GET /api/v1/household` gives `source_warning` and `house_file_ignored` |
| Manual fire flag forgotten | The flag a person sets (`POST /api/v1/rooms/{id}/fire`, the Home Assistant switch) expires after `house.fire_flag_hours`, 6 by default (0.5 to 24), and at local midnight at the latest, with reason `room.fire_switch_expired` in the decision log. Before, it lasted until cleared or a restart, holding the room's valve shut and out of demand. Detection from the room's own rise is separate and clears itself |
| Restart before a room sensor reports | Battery sensors sleep and can't be asked for a reading. Radiate saves each room sensor's last temperature and humidity with the time it was taken (store key `sensors`, with the engine state) and restores them at start, so a reading's age carries on from the sensor's own last report and the usual silence and stale limits apply. Readings older than a day are dropped. A remembered reading counts for demand, but it is not a step seen in the room: slopes, the window and fire detectors and learning start from the sensor's next report (`RoomInput.temperature_restored`). A normal room whose sensor has no remembered reading does not fall back to the TRV reading until the sensor is past its 20 minute stale limit (`RoomInput.sensor_missing_s`); until then it has no reading and doesn't call. Before, the TRV reading plus the TRV bias was used at once, about 1.5 K out on the reference install, and the room jumped when the sensor reported |
| The TRV disagrees | A calling room whose TRV reports `idle` for 20 minutes while the burner fires, heat flows and its valve is open for it, with the heat known (section 4.6: not in a dry run without metering, where the relay is Radiate's own unsent command). The usual cause is the TRV comparing with its own sensor (firmware without `external_temperature_input`, or an external input that lapsed). Radiate steps the TRV setpoint up 0.5 K every 10 minutes, to at most target + 3 K, and keeps it there until the room stops calling; alert `valve.trv_disagrees` while the TRV stays idle |
| Fallbacks while someone is away | The TRV schedule mirror and the Shelly watchdog's heating windows are built from each room's week for everyone at home (`SiteConfig.fallback_schedule_for`), never from the weeks compiled for people away, so they heat as if someone is home if Radiate stops. Radiate itself still follows the away weeks while it runs, and re-asserts its own setpoint after the TRV's schedule moves it at a transition. The heating windows are never empty: a room held all day at one setpoint heats all day only when its use level that day is in use or occasional (or, with no use level, above the unused temperature and the damp floor), and with no window from any room Radiate writes the watchdog's own defaults, 05:30 to 08:30 and 16:00 to 22:30 |

---

## 8. Interfaces

### 8.1 Server API (v1)

Request and response bodies are JSON. A body that is not a JSON object returns 400, as does an invalid setpoint, mode, setting or time; an unknown room or person returns 404.

| Method and path | Body | Purpose |
|---|---|---|
| `GET /api/v1/health` | | `{"ok": true}`; never needs a token |
| `GET /api/v1/house` | | House ID, version, driver name, rooms (id, name, role, heat source, controllable), boiler guard settings, `people` (`id`, `name`, and `ha_person`, the `person` entity the household links them to, or `null`) and `household`: every household setting with its default filled in (`timing`, `away`, `temperatures`, `weekend_days`, and per person and per room their routines, settings, `ha_person` for people, room adjustments (`adjust`) for rooms, and the settings they `inherited`), the allowed ranges in `limits`, the choices in `options`, and `damp_below_c`. `household` is `null` without a household |
| `GET /api/v1/state` | | Live snapshot: mode, outdoor temperature, boiler (with short-cycle state, `adopted` for a burn Radiate did not start, and `watchdog_handover` while the watchdog has the relay), store, per-room temperatures, opening limits, demand flags (`calling`, `topup`, and `extend` for a burn extension rather than a heat sink), learning gate, learned model, latest reason (`reason`, with its code in `reason_code`, such as `demand.pooled`), override, detected fire, manual fire flag (`fire_switch`, and `fire_switch_expires_in_min`), valve checks (`valve`: `untrusted` for a stuck or leaking valve, `misses`, `leaking`, `leak_burns`, and `rejected` for settings the TRV would not take), daily accounting (with `basis`, `relay_hours`, `litres_relay` and the metered `burner` section, section 5.6), `boiler.burner` and `store.burner` (the burner firing, or `null` when not metered), `boiler.relay_read` (false when the relay could not be read this tick), 24 h relay timeline, alerts (`alerts` as messages, `alert_details` with `code`, `message` and `room_id`), driver telemetry (including `boiler_linked`, false from the live driver when no `shelly` section is configured, so Radiate cannot switch the boiler; older servers don't send it), `boiler.pooled_demand_min` (section 5.3), `settings` (the same object as `GET /api/v1/settings`), `learning_notes` (learned state dropped, brought forward or reset in the last 14 days, oldest first, each with `at` in Unix seconds, `code` (`learning.restore`, `learning.invalidated` or `learning.reset`), `message` and `room_id`), each room's `model.learned` (its provenance, section 4.3: `learner`, `code`, `since` and `latest` as dates or `null`, and `updates` by condition) and `outdoor_reading`: where `outdoor` came from (`setting`, the `house.outdoor_source`; `source`, `zigbee`, `home_assistant`, `simulated` or `null` when 5 °C is assumed; `age_s`; `stale`; `stale_after_min`; and `home_assistant`, the last reading posted, with `temperature_c`, `measured_at`, `age_s` and `source`, or `null`) |
| `GET /api/v1/decisions?since=T` | | Decision log entries (`at`, `code`, `message`, `room_id`) after `T`, in the server's monotonic seconds |
| `POST /api/v1/rooms/{id}/setpoint` | `{"setpoint": 21.0}` | Override the schedule, 5 to 28 °C, until the room's next scheduled change. Optional `"duration_min": 90` holds it for that long instead (up to 7 days); `"until": "cleared"` holds it until `{"setpoint": null}` clears it. Saved across restarts; the response and each room's `override` in `state` give `until` and `expires_in_min` |
| `POST /api/v1/rooms/{id}/fire` | `{"lit": true}` | Manual fire flag. It expires after `house.fire_flag_hours` (6 by default) and at local midnight at the latest; the response and each room's `fire_switch_expires_in_min` in `state` say when (`null` when not set). Not saved across restarts |
| `POST /api/v1/store/boost` | `{"minutes": 60}` | Boost the store for 0 to 180 minutes; 0 cancels |
| `POST /api/v1/mode` | `{"mode": "auto"}` | `auto`, `off` or `frost` |
| `POST /api/v1/learning/reset` | `{"rooms": ["bedroom_1"]}` | Put the named rooms' room models, arrival lags and lockshield histograms back to their priors, or every room with a model with `{}` (section 4.3). Writes no device; logs `learning.reset`. Answers `{"reset": [...]}`; an unknown room, or one without a model, is 400 and nothing is reset |
| `GET /api/v1/people` | | The household's people and their away state: `everyone`, `frost` (everyone away is holding the house at frost protection), `presence_delay_min`, `return` (`at`, the next known return while rooms can warm up for it, or `null`), `today` (local date) and `people`, each with `id`, `name`, `away`, `reason` (`away_until` or `presence`), `until`, `home_at` (when they last said they are home, or `null`) and `presence` (`state`, `since`, `stale` when it hasn't been reported within the stale limit, and for fail warm (section 7) `evidence_at`, `source_type`, `battery`, `uncertain` and `why`). The same object is `away` in `state`; `house` lists `people` with `id`, `name` and `ha_person` |
| `POST /api/v1/people/{id}/away` | `{"until": "2026-11-24T18:00"}` | Away until a local date and time, or a date for the start of that day. An offset is allowed. Must be in the future and within 60 days. `{"until": null}` clears it. Saved across restarts |
| `POST /api/v1/people/{id}/presence` | `{"state": "not_home", "since": "2026-11-24T08:10:00+00:00", "evidence_at": "2026-11-24T08:12:00+00:00", "source_type": "gps", "battery": 64}` | Presence from Home Assistant: `home`, `not_home`, or `null` to forget it. `since` is when the state changed (optional, never later than now). Every report, a repeat included, refreshes the presence; presence not reported within `household.away.presence_stale_after_min` counts as unknown. Optional, for fail warm (section 7): `evidence_at` (an ISO time, the trackers' newest report, never later than now), `source_type` (lower case letters, digits and `_`, up to 32) and `battery` (0 to 100); a malformed one returns 400 |
| `POST /api/v1/people/{id}/home` | `{}` | "I'm home": ends the person's away until, and a `not_home` that began before now counts as home until their presence changes again. Saved across restarts. Returns `{"ok": true, "person": {...}}` |
| `POST /api/v1/ha/persons` | `{"persons": [{"entity_id": "person.sam", "name": "Sam"}]}` | The `person` entities Home Assistant has, so the household setup can offer them. Replaces the last report; kept in memory only. At most 200; each `entity_id` must be a `person` entity ID, and a missing or empty `name` shows the entity ID. Returns `{"ok": true, "count": 1}` |
| `POST /api/v1/outdoor` | `{"temperature_c": 7.5, "measured_at": "2026-11-24T08:10:00+00:00", "source": "weather.forecast_home"}` | An outdoor temperature from Home Assistant, -40 to 50 °C. `measured_at` (when it was measured; optional, now without it; a time in the future counts as now) and `source` (where it came from, up to 100 characters; optional) are kept with it. `{"temperature_c": null}` forgets it. Used only when `house.outdoor_source` is `home_assistant` or `both` (section 3). Saved in the state database, so a restart keeps it and its age. Returns `{"ok": true, "outdoor": {...}}`, the same object as `outdoor_reading` in `state` |
| `GET /api/v1/schedules` | | The week each controllable room follows now, for the web UI's week view. `now` (`weekday`, Monday = 0, and `minute`, house time), `levels` (the household's `in_use`, `occasional`, `unused` and `night` temperatures, or `null` without a household), `frost` (everyone away is holding frost), `weekend_days` (the household's, as day names, which room adjustments mean by `weekend`, or `null` without a household) and `rooms`, each with `id`, `name`, `source` (`household` or `hand_written`), `schedule` (the house file's schedule name, or `null`), `days` (seven, Monday first, each with `day`, `transitions` as `minute` and `setpoint`, `text` in words, `periods`, the warm periods the week view can drag, as `start` and `end` minutes, and `adjusted`, what the room's adjustments changed that day, as `start`, `end` and `keep`), `summary` (runs of identical days as `days` and `text`, as `radiate schedules` prints them), `notes` (warm periods dropped to fit the TRV, in words), `people` the room depends on (`id`, `name`), `away` (`null`, or `people`, `text` and the `usual` summary when someone being away changed the week), `adjust` (the room's adjustments as in the house file, `days`, `keep`, `from` and `to`, plus `text` in words) and `routine` (the summary without adjustments when they change the week, or `null`). Household rooms reflect who is away now; hand-written rooms have empty `periods`, `adjusted` and `adjust` |
| `GET /api/v1/household` | | The household setup for the web UI's wizard: `source` (`saved`, `house_file` or `null`), `source_warning` (with `source` `saved`, a sentence saying the saved setup replaces the house file's whole section, away settings included; otherwise `null`), `house_file_ignored` (the house file's household settings the saved setup hides, as dotted keys such as `away.everyone_away`, or a whole part such as `people`), `house_file` (whether the house file has a household section), `saved_at` (where a save goes, or `null` in the demo), `saved_problems` (why a saved household was not used, as `path` and `message`), `household` (the household in use as the house file's `household` section, or `null`), `defaults` (`timing`, `away`, `temperatures`, `weekend_days`), `limits`, `options`, `damp_below_c`, `rooms` (each controllable room's `id`, `name`, `schedule`, its own schedule in the house file or `null`, and `heat_source`) and `ha_persons` (the last `POST /api/v1/ha/persons` as `persons`, sorted by name, and `reported_at`, house time, or `null` without one). `404` when the server offers no setup |
| `POST /api/v1/household/preview` | `{"household": {...}}` | Check and compile a draft `household` section without saving it. Answers in the shape of `GET /api/v1/schedules`, as it will be once saved, plus `errors` and `notes` (each `path` and `message`, such as `household.people.sam.weekdays.up`). With errors, `rooms` is empty |
| `PUT /api/v1/household` | `{"household": {...}}` | Save the draft to `<data_dir>/household.yaml`, where it replaces the house file's section, then recompile and hand the new weeks to the driver. The week view saves room adjustments (`household.rooms.<id>.adjust`) the same way, so the first one made to a household from the house file saves a copy of it. `400` with `errors` if it isn't valid; `500` with `message` if the file can't be written. Answers as `GET` |
| `DELETE /api/v1/household` | | Delete the saved household and use the house file's again. Answers as `GET` |
| `GET /api/v1/settings` | | Settings: `demand_mode` in effect (`eco` or `comfort`), `demand_mode_default` (from `boiler.demand_mode`), `demand_modes` (`["eco", "comfort"]`), `comfort_limit_k`, `eco_limit_k`, `learning_memory_days` and `learn_on_trv_fallback`. Only `demand_mode` can be changed at runtime |
| `POST /api/v1/settings` | `{"demand_mode": "comfort"}` | Change runtime settings; only the keys given change. `demand_mode` is `eco`, `comfort`, or `null` to follow `boiler.demand_mode` again. Saved across restarts and used from the next tick. Returns `{"ok": true, "settings": {...}}`. An unknown key or value returns 400 |
| `GET /api/v1/settings/config` | | Every house-file setting, from the registry in `radiate.config.settings`: `sections[]`, each with `id`, `title`, `help`, `guide`, `link` (`household` or `schedules` for a section edited elsewhere) and `fields[]` (or, for `rooms`, `rooms[]` with `id`, `name` and `fields[]`). A field has `path` (`boiler.min_burn_min`, `rooms.<id>.trv`), `label`, `kind` (`number`, `integer`, `bool`, `text`, `choice`, `list`, `use`, `secret`), `unit`, `min`, `max`, `step`, `choices`, `help`, `optional`, `restart`, `secret`, `hardware`, `editable`, `source` (`app`, `house_file` or `default`), `pending_restart`, `value`, `default`, `house_file_value`, `house_file_set`, `env` and, when the command line fixes it, `locked`. A secret has `is_set` instead of any value. Also `saved` (paths set here), `saved_at` (the file, or null in the demo), `pending_restart` and `problems` (saved settings not used at start-up). 404 where the server has no Settings view |
| `PUT /api/v1/settings/config` | `{"values": {"boiler.min_burn_min": 9}, "confirm": true}` | Save settings to `<data_dir>/settings.yaml`, over the house file. Checked by the house file's parser with the saved settings laid over it, and against a household saved in the setup; 400 with `errors[]` (`path`, `message`) otherwise. `null` means not set: the default applies. A change to a `hardware` setting is refused with 409 and `confirm` (the paths) unless `confirm` is `true`. Settings with `restart` false are used at once; the rest after a restart. Answers as `GET`, plus `applied` and `restart` (the paths changed each way) |
| `DELETE /api/v1/settings/config[/<target>]` | optional `{"confirm": true}` | Go back to the house file's value for one setting (`boiler.frost_c`), a section (`boiler`), a room (`rooms.lounge`) or, without a target, every setting. Checked and confirmed as `PUT`; 404 for an unknown target |
| `GET /api/v1/layout` | | Where each room sits in the web UI's house model: `{"layout": null}` until one is saved, otherwise `{"layout": {"floors": [...], "rooms": {...}}}`. Only the UI reads it; control never does. Rooms the house file no longer has are dropped when the server starts |
| `PUT /api/v1/layout` | `{"floors": ["Ground floor", "First floor"], "rooms": {"lounge": {"floor": 0, "x": 0, "y": 0, "w": 4.5, "d": 4}}}` | Replace the layout. `floors` is 1 to 6 names of 1 to 40 characters. `rooms` maps a room ID to its `floor` (an index into `floors`) and `x`, `y`, `w` and `d` in metres on that floor's plan, each side at least 0.5 m, inside a 60 m square. A room left out is not placed yet. Saved in the state database (`radiate.db`, key `layout`) straight away. Returns `{"layout": {...}}`, the cleaned copy. An invalid body returns 400 with a message naming the first problem, such as `rooms.lounge.w: must be between 0.5 and 60 m` |
| `GET /api/v1/devices` | | The health of every device Radiate depends on: each room's TRV, room sensor and window sensor, the outdoor sensor, Zigbee2MQTT's routers (from its retained `bridge/devices`) and the boiler relay. `limits` (`low_battery_pct`, `weak_signal_lqi`, `strong_signal_lqi`, `stale_after_s`), `summary` (`total`, `attention`, `offline`, `low_battery`, `weak_signal`), `network` (`mqtt`, `zigbee2mqtt`: connected or online, or `null` when not known), `scan` (`available`, `state` of `idle`, `scanning`, `done` or `failed`, `error`, `scanned_s_ago`, `retry_in_s`, `min_interval_s`) and `devices`, each with `id` (the Zigbee2MQTT friendly name, or `boiler_relay`), `kind` (`trv`, `sensor`, `window`, `outdoor`, `router` or `relay`), `label`, `room_id`, `room_name`, `link` (`zigbee` or `wifi`), `model`, `vendor`, `firmware`, `power` (`battery` or `mains`), `battery_pct`, `battery_low`, `linkquality` (0 to 255), `signal` (`strong` at 100 and above, `fair`, `weak` below `weak_signal_lqi`), `available`, `last_seen_s`, `reading_age_s`, `temperature_c`, `humidity_pct`, `valve` (TRVs: `opening_pct`, `closing_pct`, `mode`, `running_state`, `setpoint_c`, `sensor`), `relay` (`heating`, `store`, `power_w`), `contact`, `route` (after a scan: `via`, `via_kind` of `coordinator` or `router`, and `lqi`, or `null`), `status` (`ok`, `attention` or `offline`) and `problems` (`code` and `message`). Unknown values are `null`. `404` when the driver reports no devices |
| `POST /api/v1/devices/scan` | | Ask Zigbee2MQTT for a raw network map (`bridge/request/networkmap`), to show which router each device talks through. Only on a person's request, never on a timer: the scan slows the mesh for 10 s to 2 min. Allowed in dry run, as it changes no device. Returns `{"ok": true, "scan": {...}}` and the answer appears in `GET devices`; a scan with no answer in 3 min fails. `409` while one runs, `429` within 10 min of the last start, `503` while Zigbee2MQTT is not reachable, each with `message` and `retry_in_s`; `404` without Zigbee2MQTT |
| `GET /api/v1/suggestions` | | House suggestions from the learned room models, the valve checks and the devices. `summary` (`total`, `act`, `consider`, `info`, `rooms_ready`, `rooms_learning`, `rooms_compared`, `lags_compared`, `min_rooms`), `suggestions`, most pressing first, each with `id` (kind and room or router, stable while it applies), `kind` (`room.heat_loss`, `radiator.undersized`, `radiator.slow_to_warm`, `valve.passing` or `zigbee.weak_link`), `severity` (`act`, `consider` or `info`), `room_id`, `room_name`, `title`, `evidence`, `action`, `confidence` (`low`, `medium` or `high`), `basis` and `values` (the numbers behind the words), then `learning`, one per controllable room, with `room_id`, `room_name`, `status` (`ready`, `learning` or `not_judged`), `hours`, `confidence` and `note`, and `settings` (the `suggestions` section in effect). Read-only; works with every driver |
| `GET /api/v1/savings` | | The oil saved against the baseline, and the comfort beside it (section 5.9). See the shape below. Read-only; `status` is `unavailable` without a household (or a hand-written room with a use level) |
| `GET /api/v1/data/series` | | Raw data (section 9.2): whether there is a history (`available`, and `why` when not), `now`, `timezone`, `retention_days`, `first` and `last`, the `metrics` catalogue (`metric`, `label`, `unit`, `kind` of `gauge`, `state` or `level`, `scope` of `room` or `house`, `description`, and `levels` for a level), `rooms`, every `series` with data (`key`, `metric`, `room`, `room_name`, `label`, `unit`, `kind`, `first`, `last`), the allowed `steps`, `indexing` (`done`, `behind_ticks`) and `export` (the OpenTelemetry export's health, or null) |
| `GET /api/v1/data` | | Points for the series a query names: `metric` and `room` (comma-separated or repeated; `room` narrows room series only), `from` and `to` (Unix seconds or ISO 8601, house time without an offset; default the last 24 hours), `step` (`auto` or seconds, raised to the next allowed step and to at most 5,000 points a series and 250,000 in all), `format` (`json` or `csv`). JSON: `from`, `to`, `step`, `step_raised`, `timezone`, `partial` (the index is still catching up), `took_ms` and `series`, each with `points` as `[t, mean, min, max]`. CSV: `time,metric,room,unit,value,min,max`, times in house time with their offset. 400 for an unknown metric or room, a bad time or step, or no history |
| `GET /api/v1/export` | | The health of each export: `otlp` (`enabled`, `status` of `ok`, `waiting`, `failing` or `off`, `endpoint` without credentials, `protocol`, `signals`, `interval_s`, `last_success`, `last_attempt`, `last_error`, `last_error_at`, `next_attempt`, `failures`, `queued`, `dropped`, `rejected`, `sent`; times are Unix seconds) and `elastic` (`queued`, `sent`, `failures`), each null when not running. Never includes a key or a header |
| `GET /api/v1/stream` | | WebSocket: the state on connect and after every tick |
| `GET /api/v1/audit` | | Admin only. The security log ([ADR-0008](adr/0008-security-audit-log.md)), newest first: `events[]`, each with `id`, `at` (Unix seconds), `event` (a `radiate.security.*` name from the [telemetry schema](telemetry.md)), `action`, `outcome` (`success` or `failure`), `severity` (`INFO` or `WARN`), `user` (or `null`), `source` (the client address, or `null`), `message` and `attributes` (the event's schema attributes, never a secret); `users` (every user in the log, for a filter) and `retention_days`. Query: `outcome` (`success` or `failure`), `user`, `limit` (1 to 500, default 100) and `before` (an event ID, for the next page); anything else is 400 |
| `GET /api/v1/auth/config` | | Never needs a token. `{"login": false, "methods": [], "first_user_needed": false}` without login; with it, `login: true`, `methods` (`{"id": "local"}`, and `{"id": "oidc" or "saml", "label", "url"}` for single sign-on) and `first_user_needed` (local login is on and there are no users) |
| `POST /api/v1/auth/login` | `{"username": "alex", "password": "..."}` | Never needs a token. `Content-Type: application/json` only (415 otherwise). 200 `{"user", "role"}` with the session cookie; 401 `{"error": "invalid"}` for a wrong username or password alike; 429 `{"error": "locked", "retry_after_s"}` with `Retry-After`; 404 when local login is off |
| `POST /api/v1/auth/logout` | | Ends the session on the server and clears the cookie |
| `GET /api/v1/auth/me` | | Who the request is from: `via` (`session`, `token`, `ingress` or `open`), `role` (`admin`, `household` or `viewer`), and for a session `user`, `method` (`local`, `oidc` or `saml`), `csrf` and `expires` (Unix seconds) |
| `GET /auth/oidc/start`, `GET /auth/oidc/callback` | | Browser redirects for OIDC sign-in. Not under `/api/` |
| `GET /auth/saml/start`, `POST /auth/saml/acs`, `GET /auth/saml/metadata` | | Browser redirects, the assertion consumer service and the service provider metadata for SAML sign-in. Not under `/api/` |
| `GET /login` | | The login page |

Authentication: when `RADIATE_TOKEN` is set, every `/api/` path except `health` needs `Authorization: Bearer <token>`. Browsers cannot set headers on a WebSocket, so `stream` also accepts the token as its first message, `{"token": "<token>"}`; it waits up to 10 s and closes with code 4401 if the token is missing or wrong. In the HA App, requests from the Supervisor's ingress address (`RADIATE_INGRESS_IP`) that carry an `X-Ingress-Path` header are trusted without a token. The web UI at `/` and `/static/` is not protected.

User login ([ADR-0006](adr/0006-user-login.md)) is off unless the house file's `auth` section sets `enabled: true`. With it on, a request is allowed in this order: from the ingress address with `X-Ingress-Path`, as admin; with an `Authorization` header, which decides alone (a valid Bearer token is admin; anything else is 401, even with a session cookie); with a live session cookie (`radiate_session`), with the session's role. Otherwise 401, and with login on that holds even when `RADIATE_TOKEN` is empty. A cookie-authenticated request that isn't GET, HEAD or OPTIONS needs `X-CSRF-Token` equal to the session's `csrf` (403 `{"error": "csrf"}`), and a role below the route's lowest gets 403 `{"error": "<their role>", "needs": "<lowest role>"}`, so a viewer still gets `"error": "viewer"`. The lowest role for every route is in `radiate.server.permissions`: reads, the stream and signing out for every role; setpoints, fire, hot-water boost, the heating mode, `demand_mode` through `POST settings`, away, "I'm home", `household/preview` and a `PUT household` that changes only room adjustments for household; everything else (`settings/config`, including reading it, learning reset, `DELETE household`, layout, network scan, and the Home Assistant reports `presence`, `ha/persons` and `outdoor`) for admin. The stream accepts a session cookie at the upgrade when the `Origin`, if sent, is this server's own address (403 otherwise), and closes with 4401 within a minute of the session ending. Token and ingress clients see no difference.

Security log ([ADR-0008](adr/0008-security-audit-log.md)): every sign-in and sign-out, refused sign-in (with a reason code such as `bad_password`, `unknown_user`, `rate_limited`, `bad_state`, `bad_signature`, `wrong_audience`, `expired` or `not_permitted`), session that expired or was ended by a password, role or account change, 401 (`no_credentials`, `bad_token`, `bad_session`) and 403 (`forbidden` with the role and the role needed, `csrf`, `origin`), lockout starting and ending, user change made with `radiate users`, change to settings, the household, the layout or learning (who and which paths; settings never with a value), change of the heating mode or the demand mode, and each household setting changed, with old and new values (the people by path only), with `auth.audit_controls` on (the default, live) each day-to-day control used (setpoint hold, Fire lit, hot-water boost, Away, Home: who and what, never where anyone is), and the login set-up at every start, is written to an `audit_log` table in `radiate.db` (kept `auth.audit_days`, 90 by default, and at most 100,000 events), to the process log as one `key=value` line on the `radiate.security` logger, and to the OpenTelemetry export (9.1). This holds whether or not login or the export is on. Each event names who (`user.name`) and from where (`client.address`, taking `X-Forwarded-For` only from `auth.trusted_proxies`), the one place Radiate records a person. A refused password sign-in for a name that matches no account records a keyed HMAC-SHA256 of the name in `user.hash` (shown as `unknown:<hash>`), never the text; the key is per install, in `<data_dir>/audit.key`. `export.otlp.security: false` keeps the events out of the export only. Like refusals from one address within a minute are folded into one event with a count. Recording never fails a request or a tick.

**Additions for room use and savings** (sections 5.8 and 5.9). All additive, so radiate-ha needs no change first (ADR-0003):

- **Not yet implemented** (slice 2): `GET /api/v1/state`: each controllable room gains `use` (`in_use`, `occasional`, `setback` or `null`) and, while it is set, `solo` (the room started the current burn on its own). Each room's `reason_code` can be `demand.setback` or `demand.floor`.
- `GET /api/v1/savings` (built), in this shape (numbers rounded for display; `null` where not known):

```json
{
  "status": "ready",
  "why": null,
  "progress": {"eligible_days": 21, "needed_days": 14},
  "baseline": {
    "id": "timer_and_valves",
    "text": "Compared with a heating timer on from the first person up to the last to bed every day, and each room's valve set to its usual temperature."
  },
  "basis": "relay",
  "basis_text": "Oil is worked out from the time the boiler was called, so these litres are an upper bound.",
  "outdoor": {"source": "home_assistant", "text": "Outdoor temperature from Home Assistant."},
  "fit": {"litres_per_100_kh": 0.9, "standing_litres_per_day": 0.4, "cv_rmse": 0.18, "days": 21, "weights": "radiator_time"},
  "totals": {
    "since": "2026-11-01",
    "days": 21,
    "litres_used": 80.1,
    "litres_baseline": 94.3,
    "litres_saved": 14.2,
    "percent_saved": 15.1,
    "comfort_deficit_kh": 2.1,
    "warm_share": 0.98
  },
  "days": [
    {
      "date": "2026-11-20",
      "eligible": true,
      "why": null,
      "partial": false,
      "litres": 4.1,
      "litres_baseline": 4.9,
      "litres_saved": 0.8,
      "dh_actual_kh": 2150.0,
      "dh_baseline_kh": 2560.0,
      "outdoor_mean_c": 5.1,
      "comfort_deficit_kh": 0.1,
      "warm_share": 0.99
    }
  ],
  "rooms": [
    {"room_id": "lounge", "name": "Lounge", "litres_saved": 6.0, "share": 0.42, "comfort_deficit_kh": 0.0, "warm_share": null}
  ]
}
```

`status` is `ready`, `learning` (with `why`, such as "8 of 14 days", and `progress`) or `unavailable` (with `why`: "no household", "no outdoor sensor", "no outdoor readings yet" or "no nozzle rating"). "No household" means nothing to build a baseline from: neither a household nor a hand-written room with a use level. "No outdoor sensor" means the house file names no Zigbee sensor and `house.outdoor_source` is `zigbee`; the demo and the simulator always have an outdoor temperature. "No outdoor readings yet" means the outdoor temperature comes from Home Assistant (`home_assistant`, or `both` without a Zigbee sensor) and no fresh reading has counted: none today, and no kept day with fresh readings for at least 90 % of it. A reading older than `house.outdoor_stale_after_min` counts as missing. `outdoor` names the source behind the figures (`zigbee`, `home_assistant`, `both` or `simulated`, or `null` without one) with a sentence for the UI. While `learning`, `fit`, `totals` and every day's `litres_saved` and `litres_baseline` are `null`, but `days` still lists each day with `eligible` and `why` ("partial day", "no fresh outdoor temperature for 4 h"). `days` covers the last 60 days, oldest first. `totals` covers every eligible day kept; `rooms` covers the last 30 days, sorted by `litres_saved`, and their figures are an attribution. `percent_saved` and `litres_saved` can be negative.

### 8.2 Home Assistant integration

Thin client (ADR-0002): it reads `house` and `state` and posts to the routes in 8.1. It reads `house` again with the presence heartbeat and reloads when the people or their links have changed. An entity whose key an older server does not report is not created, and becomes unavailable if the key disappears.

- Per controllable room: a `climate` entity with current and target temperature and heating action. Setting its target creates an override that ends at the room's next scheduled change. Attributes give the opening limit, learning state, latest reason and the override's `override_setpoint`, `override_until` and `override_expires_in_min`. Sensors for temperature, opening limit, heating gain, loss rate, arrival lag, model confidence and learning state, and a valve problem binary sensor (problem class, from `valve.untrusted`, so on for a stuck or a leaking valve; it is named "Stuck valve" in Home Assistant).
- Per room with an episodic heat source: a "Fire lit" switch that posts `rooms/{id}/fire` and shows `fire_switch`, and a "Fire detected" binary sensor for fire as Radiate sees it, from detection or the switch.
- Rooms Radiate cannot control get a temperature sensor only.
- House: a heating mode select that posts `mode`, binary sensors for the hot-water store (`store.relay`) and a store boost (`store.boost`), a demand mode select (`select.radiate_demand_mode`, unique ID `<house id>_house_demand_mode`, options `eco` and `comfort`) that shows `settings.demand_mode` and posts `settings`; choosing `settings.demand_mode_default` posts `null`, so the server follows its configuration file again. A diagnostic pooled demand sensor in minutes (`sensor.radiate_pooled_demand`, unique ID `<house id>_house_pooled_demand`) from `boiler.pooled_demand_min`. Boiler state, boiler firing, relay starts in the last hour, predicted burn, outdoor temperature, short-cycle extra off time (with when it ends and the effective minimum off), and an alerts count with each alert's code, message and room as attributes. From `accounting`: burner hours and relay starts today, litres and kWh today when a nozzle rating is set (all reset at local midnight), and yesterday's balance score.
- Per household person: an "away" binary sensor, on while Radiate counts them away, with `person_entity` (the linked `person` entity), `reason`, `away_until`, `presence`, `presence_since` and `presence_stale` as attributes. Each person is linked to a Home Assistant `person` entity by the integration's options or, for a person the options leave empty, by `ha_person` in `house`. The integration posts the linked entity's state to `people/{id}/presence` when it changes, and every 15 minutes as a heartbeat (`home` is home, any other state is not home, `unknown` and `unavailable` are not sent). For fail warm (section 7) each report also carries `evidence_at`, the newest `last_reported` across the `device_tracker` entities in the person's `device_trackers` attribute, their `source_type` and the phone's `battery` where a tracker has `battery_level`; a server that doesn't know these fields ignores them. It posts every `person` entity to `ha/persons` at setup and with each heartbeat, and ignores an error from a server without that route.
- Outdoor temperature: an optional outdoor entity in the integration's options, a `weather` entity (its `temperature` attribute) or a `sensor` with device class temperature (its state), converted to °C. The integration posts it to `outdoor` when it changes and with the 15 minute heartbeat, with `measured_at` from the entity's `last_reported` (or `last_updated`) and `source` the entity ID. `unknown`, `unavailable` and non-numeric values are not sent. Clearing the option posts `{"temperature_c": null}` once. The server uses it only when `house.outdoor_source` is `home_assistant` or `both`.
- Services: `radiate.boost_store`, `radiate.set_mode`, `radiate.set_override` (a climate entity, `temperature`, optional `until` and `duration_min`, as in 8.1), `radiate.clear_override`, `radiate.set_away` (`person`, `until`) and `radiate.clear_away` (`person`), where `person` is a Radiate person ID or their linked `person` entity. **Not yet implemented** ([status](implementation-status.md#8-interfaces)): `radiate.recalibrate_valve`, blocked because the TRVZB has no calibration command in Zigbee2MQTT.
- **Not yet implemented** (sections 5.8 and 5.9), radiate-ha only, reading fields the server adds: a `use` attribute on each room's climate entity, from `rooms[].use`; and two house sensors from `GET /api/v1/savings`, read once an hour and ignored when the server returns 404: "Oil saved, last 30 days" in litres (the sum of `days[].litres_saved` over eligible days in the last 30, unavailable unless `status` is `ready`), with `percent_saved`, `baseline.text`, `basis` and `warm_share` as attributes, and a diagnostic "Savings status" (`ready`, `learning` or `unavailable`, with `why`).

---

## 9. Elastic metrics export

Optional, off by default. Documents follow ECS and are sent with the Bulk API (API key auth) to data streams.

| Data stream | Interval | Key fields |
|---|---|---|
| `metrics-radiate.room-default` | 1 min | `radiate.room.{id,name,role,heat_source}`, `temperature.{room,setpoint,target}`, `humidity.room`, `valve.{opening_pct,lockshield_pct}`, `demand.{calling,preheating,topup,gap_k}`, `model.{a,b,d,confidence,arrival_lag_min,samples}`, `learning.{active,gate}`, `disturbance.fire` |
| `metrics-radiate.boiler-default` | 1 min | `radiate.mode`, `boiler.{state,relay,burner,starts_1h,predicted_burn_min}`, `boiler.burn.elapsed_s`, `store.{relay,boost,burner}`, `supply.factor`, `outdoor.temperature` |
| `logs-radiate.decision-default` | per decision | `event.action` (the reason code), `message`, `radiate.room.id` |
| `metrics-radiate.daily-default` | daily | `radiate.day`, `radiate.partial_day`, `balance.{arrival_spread_min,score,starts_measured}`, `boiler.{starts,max_starts_1h,burner_hours,hours_basis,litres,kwh,relay_hours,litres_relay}`, `boiler.burner.{metered,heating_hours,heating_starts,store_hours,store_starts,store_litres}`, `boiler.burns.{count,mean_min,min_min,max_min,histogram.*}`, `rooms.comfort_minutes_below` |

Common fields: `@timestamp`, `data_stream.*`, `service.{name,version}`, `radiate.house.id` (random UUID). No personal data, no location.

- **Time series data streams**: room and boiler streams are TSDS with dimensions `radiate.house.id` and `radiate.room.id`. The index templates are built by `radiate.export.elastic.index_templates()`; [deployment](deployment.md#elastic-export) shows how to install them.
- **Buffering**: an on-disk queue (SQLite) holds up to 7 days when Elastic is unreachable; retries with backoff; batch size 500 or 10 s.

Built (section 5.9): in the daily stream `savings.{outdoor_share,baseline_share}` and `comfort.{deficit_kh,warm_share}` from the day's record, the room-weighted `savings.{dh_actual_kh,dh_baseline_kh,eligible}` as `GET /api/v1/savings` gives them when the day closes, and `savings.{litres,fit_cv_rmse}` once the gate is open (the fit moves later, so the API's figure for an old day can differ). **Not yet implemented** (section 5.8): `demand.use` and `demand.solo` in the room stream.

**Not yet implemented** ([status](implementation-status.md#9-elastic-export)): `temperature.trv`, `model.eta`, `disturbance.{shower,window,cooker_spike}`, `boiler.firing`, `store.recovering`, `host.name` (edge id, not the house name), a Kibana dashboard (balance, burns, rooms) and an install command for the templates. The OTLP path is section 9.1.

### 9.1 OpenTelemetry export

Optional, off by default. Sends the raw data series (section 9.2) as OTLP metrics and the decision log as OTLP logs to any OTLP/HTTP receiver, including Elastic's managed OTLP endpoint. The cloud never sits in the control loop (ADR-0002): the export only reads what each tick recorded.

- **Transport**: OTLP/HTTP, `POST <endpoint>/v1/metrics` and `<endpoint>/v1/logs`, protobuf (`application/x-protobuf`, the default) or JSON (`application/json`), optionally gzip. Encoded by Radiate with the standard library; the tests check both encodings against the official `opentelemetry-proto` classes. Auth: `Authorization: ApiKey <key>`, or any headers.
- **Schema**: every metric and log record is defined in `radiate.export.telemetry` and listed in the [telemetry schema](telemetry.md), which is generated from it. Requests carry its version in `radiate.schema.version` (MAJOR.MINOR; additive only within a major, enforced by tests).
- **Resource**: `service.name` `radiate`, `service.version`, `service.instance.id` and `radiate.house.id` (the random house ID), `radiate.schema.version`, and `data_stream.dataset` (default `radiate`) for Elastic's routing. No names of people, no location.
- **Metrics**: every raw data series as a gauge, one data point a minute at the tick's time, in the `radiate.*` namespace (OpenTelemetry has no semantic conventions for room heating); room metrics carry `radiate.room.id` and `radiate.room.name`. The day's running totals (relay and burner time, starts, oil, store burner time) as cumulative monotonic sums starting at local midnight. When a local day closes, its summary (section 5.6) and savings (section 5.9) as gauges with `radiate.day.partial`, timed at the day's last second, or, with `export.otlp.daily_timestamp: day_close`, when Radiate closed the day; `export.otlp.daily_metrics: false` leaves them out.
- **Logs**: one record per event, with the event name in the log record's event name field (OpenTelemetry's `event_name`) only: `radiate.decision`, `radiate.alert` and `radiate.alert.cleared`, `radiate.boiler.burn`, `radiate.mode.changed`, `radiate.presence.changed` (people as counts), `radiate.learning.invalidated`, `radiate.settings.changed` (paths, never values), `radiate.export.dropped`, and the security audit events `radiate.security.*` (8.1, [ADR-0008](adr/0008-security-audit-log.md)), which carry OpenTelemetry's `user.name` (or `user.hash`), `client.address`, `user_agent.original`, `http.request.method`, `url.path` and `error.type` where they apply, and ECS's `event.category`, `event.type` and `event.outcome`, for which OpenTelemetry has no convention: the one exception to "no personal data". `export.otlp.security: false` leaves the security events out. `event.action` is the reason code; severity is INFO (9) or WARN (13) by event; the body is the message.
- **Buffering**: on-disk queues (7 days of ticks, 20,000 log records), batches of 30 ticks or 500 records, backoff from the interval to 10 minutes, `Retry-After` honoured. Retryable: network errors, 429, 502, 503, 504; kept and retried: 401, 403, 404 and other errors; dropped: 400; halved batch: 413. A full queue drops the oldest and counts them. Health in `GET /api/v1/export`.

**Not yet implemented**: gRPC, traces, and histograms (burn lengths are sent only as the daily mean).

### 9.2 Raw data

Every tick records its snapshot and actions (section 6). Raw data reads them as series: one metric for one room or for the house (`radiate.core.series`), which `GET /api/v1/data` serves and the OpenTelemetry export sends.

- Room metrics: `room.temperature` (the room sensor), `room.humidity`, `room.setpoint` (schedule or hold), `room.target` (what Radiate heats to now), `room.calling`, `room.window`, `valve.temperature` (the TRV's sensor), `valve.opening` (the opening limit set), `valve.reported` (as the TRV reports it). House metrics: `outdoor.temperature`, `boiler.relay` (as read), `boiler.demand` (as asked), `boiler.state` (a level: idle, lead, firing, rest), `boiler.burner` (where the boiler reports it), `boiler.power` (where the relay measures it), `store.relay`, `people.home`, `people.away`.
- States are 1 or 0, so their mean over a step is the share of the step they were on. Target, calling, burner, power and the people counts are recorded with each tick under `observed`; ticks recorded before this have the rest.
- People are counts only: the history never records who is home.
- Queries read a derived index, `data_hour` in the state database: one row per series and hour with its count, mean, minimum, maximum and the 60 minute values. It is built from the tick history in the background, a few hundred ticks at a time, kept up to date as ticks arrive, and pruned with the history. A step of an hour or more is answered from the hourly figures in SQL; days, 3 hours and 6 hours start at local midnight.

**Balance score (daily):** for each heating start with two or more calling rooms, the spread between the first and last room reaching its target. Score = 100 × (1 − median spread / 120 min), clamped 0 to 100. The rooms are the `normal` rooms calling when the burn starts; a room still calling when the burn ends counts as arriving then; a burn where no room arrives is not scored; a partial day (section 5.6) has no score. **Not yet implemented** ([status](implementation-status.md#9-elastic-export)): weather normalisation following Håkansson et al. 2025.

---

## 10. User interface

One web UI, served by the server and embedded through HA ingress. It is a dashboard people open many times a day, so it is crisp and fast rather than decorative ([design standards](standards/design.md)):

- **House model**: at the top of the House view, an axonometric model of the house, floors stacked, each room coloured by its temperature with its reading, and a radiator bar while it takes heat. Selecting a room shows its line and a link to its card. Beside it, the house now (rooms calling, every room on one temperature scale, the boiler, dry run, devices and learning, and the next setpoint changes); below, today's plan for each scheduled room. "Arrange rooms" opens a floor-plan editor whose layout is saved through `PUT /api/v1/layout` (section 8.1). Until then, rooms are placed by a guess from their names. The layout only draws the model.
- **House view**: one card per room with temperature against target, opening limit bar, learning state ("Learning paused: fire lit"). Boiler strip with a burn timeline for the last 24 h and minimum burn/off countdowns.
- **Motion**: only where it explains state. Opening limit bars and the burn timeline transition `transform`/`opacity` in 200 ms with a strong ease-out; no animation on keyboard actions; hover effects gated by `(hover: hover) and (pointer: fine)`; `prefers-reduced-motion` keeps fades and drops movement.
- **Observed rooms**: a passive room's card reads "Bypass, not controlled"; an unheated room's reads "No radiator" with "No radiator here. Temperature recorded, not controlled." Neither has a setpoint or an opening limit bar.
- **Devices view**: a second view (`#devices`, "House" and "Devices" tabs) with the health of every device from `GET /api/v1/devices`: status, battery, signal in words with its LQI, last seen, the latest readings (room and TRV temperature, humidity, a TRV's opening limit, state and mode), model, firmware, and which router it talks through after a network scan. Problems come first, in words, each linking to its device. A "Scan network" button starts a network scan (section 8.1), at most every 10 minutes. The same problems are alerts (`device.low_battery` at or below `monitoring.low_battery_pct`, 20 % by default; `device.weak_signal` below `monitoring.weak_signal_lqi`, LQI 40 by default; `device.offline`; `device.stale` for a temperature sensor silent for `house.sensor_max_silence_min`), so they show in the overview's Needs attention panel, with a link to the view and a count on its tab.
- **Suggestions view**: a third view (`#suggestions`) with advice from `GET /api/v1/suggestions`: what Radiate saw, what to do, and how sure it is and why. A room loses heat quickly (its loss rate `b` at least `suggestions.heat_loss_ratio` times the house's median, which is already per kelvin of inside minus outside); a radiator may be too small (with every valve fully open, the most the model lets the room rise above outdoors, `(a·S + d) / b`, can't hold its warmest scheduled setpoint down to `suggestions.design_outdoor_c`); a radiator is slow to warm (arrival lag well above the house's median); a valve passes heat when shut (the leak check, section 7); a weak Zigbee link, grouped by the router it uses after a network scan. A room is judged only after `suggestions.min_learning_h` of learning with both `a` and `b` at least `suggestions.min_confidence` certain, and rooms are compared only once `suggestions.min_rooms` can be; until then the view shows each room's progress. Rooms measured only by their TRV and rooms with a continuous heat source are not judged. The tab counts the suggestions to act on.
- **Explainability**: every room shows its latest reason, such as "Lounge: fire lit, radiator closed and learning paused". A room waiting in `eco` (`demand.pooled`) reads "Waiting to share a burn with other rooms".
- **Demand mode**: an Eco and Comfort control beside the heating mode, with one line saying what the mode in effect does. It starts "Default:" while the server follows `boiler.demand_mode`, and picking that mode sends `null`. Hidden when the server sends no `settings`.
- **Setup**: the first step is `radiate discover` on the command line. It reads Zigbee2MQTT's retained `bridge/devices` and `bridge/groups` (read-only), matches TRVs, temperature sensors and contact sensors into rooms by description area, friendly name or group, and writes a commented YAML draft in dry run with one pilot valve. Rooms with a TRV and no sensor become `internal_sensor_only`; sensors with no TRV are commented out as `passive`, with a note to change a room with no radiator to `unheated`, because an unvalved radiator can't be told from no radiator. Rules are in [configuration](configuration.md#start-from-your-devices).

Built ([status](implementation-status.md#planned-efficiency-by-room-use), section 5.9):

- **Savings view**: a view (`#savings`, tab "Savings", between Suggestions and Guide) from `GET /api/v1/savings`. At the top, a headline sentence that carries the number for people who skip the chart: "About 14 litres of oil saved since 1 November, with rooms in use warm 98% of the time." Under it, the baseline sentence and, while litres come from relay time, "Litres are an upper bound until the burner itself is measured." Then one bar per day, or per week with a Days and Weeks switch: the day's litres as a solid bar and the baseline's litres as a wider outlined bar drawn around it, on one zero-based axis, so the gap is the saving. Days that aren't eligible are empty slots with their reason, never zero. A negative day shows its solid bar taller than the outline. Below, a small separate line of litres saved since the first eligible day, and the rooms' shares as a sorted horizontal bar list, negatives left of zero, labelled "Estimated share". Comfort sits beside every figure: the headline's warm share, and each day's comfort deficit in its tooltip and table row. While learning: "Still learning how much oil this house uses: 8 of 14 days." with a progress bar, when figures start, the oil used on the days counted so far (flagged as an upper bound while litres come from relay time) and each day's litres as solid bars, with the days not counted listed with their reason. Without a household, a nozzle rating or an outdoor sensor, the view says what is missing and how to add it, and offers the household setup where the server has one.
- Accessible: a text alternative naming the chart and its trend, a "Show as table" toggle with the same numbers, outline versus fill (not colour alone) for baseline versus actual, bars reachable by keyboard with the tooltip's words (one tab stop, arrow keys between bars; the words for the chosen bar sit in a line under the chart, so they read the same on touch), and no counting-up numbers. Plant room look and tokens ([design standards](standards/design.md)).
- **House view**: the headline sentence, one line, linking to the Savings view, once `status` is `ready`.

**Not yet implemented** (section 5.8, with slice 2):

- **Rooms**: a setback room's status line reads "Not in use now: heated only while the boiler is on for other rooms"; a room that started a burn at its floor reads "Down to 12 °C: heating back to 14 °C".
- **Demand mode**: the Eco line becomes "Eco: rooms share burns, and rooms not in use wait for a burn that's already running."

**Not yet implemented** ([status](implementation-status.md#10-user-interface)): an arrival estimate on each room card, allocation reasons such as "Opening 35 % so it arrives with Bedroom 3 at 07:10" (the allocator gives no per-room reason yet), and a setup wizard in the UI that discovers rooms from Zigbee2MQTT or HA areas and marks bypass radiators, heat sources and the boiler relay.

---

## 11. Simulator

A thermal simulator of the reference house (`src/radiate/sim`) drives the same `decide` core:

- Hydraulics: fixed-head pump, per-radiator conductance by pipe run, TRV valve characteristic, always-open stairs path.
- Boiler: on/off burner, internal boiler thermostat, store with hot-water priority and draw-offs.
- Rooms: thermal mass, loss to outdoors, coupling to neighbours, radiator emission `∝ ΔT^1.3`, TRV sensor self-heating.
- Disturbances: open fire evenings, Aga continuous heat, showers, open windows.
- Scenarios compare "no Radiate" (TRVs fully open, boiler on any call) with Radiate on arrival spread, comfort minutes below setpoint, relay and burner starts and burn lengths. Tests assert the guards are never violated.

**Room use comparison** (`radiate sim-efficiency`, [plan, slice 6](plans/efficiency-mvp.md#slice-6-simulator-comparison-and-estimator-check), results in [simulation](simulation.md#room-use-in-eco)): a household scenario of the reference house (people, routines and use levels compiled by `compile_household`, so rooms get room use), an owner-like scenario on hand-written schedules with `rooms[].use`, and the savings baseline as a timer controller (the relay on for the whole timer window, each valve on its own sensor at its room's usual temperature). It compares oil from burner firing and from relay time, relay and burner starts, burner hours, the warm-period comfort deficit and the lowest room temperatures for `eco`, `eco` with room use, `comfort` and the timer. **Not yet implemented:** the savings estimate checked against the simulated difference, which needs the savings core (5.9); `sim.compare.estimator_check` is the hook.

---

## 12. Open questions

Hardware and legal:

1. Can the Shelly 2PM channel 1 power reading show burner firing with the planned wiring? Ask the OFTEC engineer to wire so it can, or add a separate meter on the boiler supply. Simulation shows this matters: Radiate cuts relay starts by 84 %, but burner starts are set by the boiler's own thermostat cycling inside long calls (see [simulation](simulation.md)). Reducing those needs the firing signal. Evidence so far: on the reference install both channels separate the burner from the pump and the relay (section 3), and Radiate now uses the reading wherever a channel shows it. Using burner starts to change control (rather than only to count them) is still for the owner to decide.
2. Will the owner fit a flow pipe clamp sensor? It replaces the inferred heat availability with a measured one.
3. Heatslave 12/14 nozzle rating and the boiler thermostat setting, for oil accounting and the simulator.
4. Freedom-to-operate check on EP1936290 and EP2420748 before marketing balancing in Germany or the EU.
Behaviour:

5. **Open question: unheated rooms in the model.** Unheated rooms are recorded and shown, but nothing in the model uses them. The room model (section 4.1) has no neighbours: each room loses heat to `T_out`, and a warm or cold neighbour shows up only as steady heat `d_r`. Should unheated-room temperatures feed the model, and how? For example: as the boundary temperature for heat lost to an adjacent unheated space (a landing or a utility room), instead of folding that loss into `b_r` against the outdoor temperature and into `d_r`; as a second regressor for the rooms next to them; or not at all, kept for reports and Elastic only. Any of these needs room adjacency in the configuration, which does not exist yet. **Not yet implemented** ([status](implementation-status.md#2-house-model)). For the owner to settle.

Efficiency by room use and savings ([ADR-0004](adr/0004-efficiency-by-room-use.md), sections 5.8 and 5.9). Each has the design's recommended default, which the plan builds unless the owner decides otherwise:

6. **Open question: setback rooms between burns.** Should a setback room (unused, overnight, between warm periods) be allowed to fall to the damp floor, 12 °C, before it starts a burn on its own, taking heat only from burns that run for other rooms until then? Or should it start a burn at the eco limit below its setback temperature (12.5 °C for 14 °C), as a room in use does? **Recommended:** fall to the damp floor. It is where most of the saving is, the household's setback temperature is still reached whenever the boiler runs, and the damp floor keeps it above the level the household setup already warns about. With the owner's 14 °C night temperature, bedrooms may sit between 12 and 14 °C overnight, and optimum start begins their morning warm-up earlier.
7. **Open question: the savings baseline.** Is "a heating timer on from the first person up to the last to bed every day, with each room's valve at its usual temperature" fair? The research proposed every room at the in-use temperature, which flatters Radiate because it credits it for rooms the household would have turned down anyway. Should days when everyone is away count? A timer would have heated them, so the saving is real, but it can feel generous. **Recommended:** this baseline, away days included, with "every day" in the sentence the UI shows.
8. **Open question: `comfort` with room use.** Should `comfort` also stop topping up and pooling on rooms that are not in use, or stay exactly as today? **Recommended:** exactly as today, so the owner has a known fallback if the new `eco` misbehaves on the real house.
9. **Open question: money.** Show pounds as well as litres? It needs an oil price setting, stored per day. **Recommended:** litres and percentages in the first cut, money next.

Hardware, raised by the efficiency work:

10. Which radiators in the reference house have no valve? Section 2.2 lists the stairs radiator as the only bypass and a TRVZB in the bathroom; the owner has since described the bathroom radiator as an always-open bypass with no valve. If both are unvalved, the bathroom becomes `passive` and the bypass equivalent (`HouseConfig.bypass_equivalent`, 0.4) should rise, which also means fewer heat sinks (5.4).

Fail warm, raised by the fail warm audit:

11. **Open question: the watchdog without a clock.** The Shelly watchdog script does nothing while the Shelly has no wall-clock time (`sys.unixtime` missing, for example after a power cut with the internet still down), because its heartbeat check and its windows both need the time. If Radiate is down too, nothing heats. **Recommended:** with no clock, measure heartbeat silence against `sys.uptime` and run a conservative duty cycle (for example 20 minutes on every 90, keeping minimum burn and minimum off) until the time is known. This changes what the script does to the real boiler, so it needs the owner's agreement and a test on the bench Shelly first. **Not yet implemented**: the script is unchanged.

Efficiency by room use, raised by the simulator comparison (section 11):

12. **Open question: the damp floor on the air or the reading.** In `eco` a setback room starts a burn when its sensor reads below 12 °C. In simulation the air then dips up to 0.4 K below 12 °C, for 40 to 80 room-minutes a day, while the valves open and the radiator warms. Starting the burn 0.3 K above the floor keeps the air at about 12 °C but gives up part of the saving and adds burns ([simulation](simulation.md#room-use-in-eco)). **Applied for now:** `boiler.damp_margin_k` 0.3 K. Measured on the owner-like schedules (seeds 1 to 3, 21 days), against eco without room use: mild, 1.7 % less oil with the margin against 3.1 % at the floor, 0 room-minutes below 12 °C against 882, relay starts 125 against 113 (eco 121); cold, 2.0 % less oil against 2.8 %, 14 room-minutes below 12 °C against 1626, lowest 11.97 °C against 11.7 °C, relay starts 110 against 107. Setting it to 0 starts the burn at the reading of 12 °C, as first built. For the owner to settle.

User login ([ADR-0006](adr/0006-user-login.md)):

13. **Decided: a household role.** Yes (owner, November 2026). Login has three roles: admin, household and viewer (shown as Read only). Household can change setpoints, holds, the heating and demand modes, hot-water boost, the fire switch, away and room adjustments, but not Settings, the household setup, the layout or learning. See the amendment to [ADR-0006](adr/0006-user-login.md).
14. **Open question: login in the Home Assistant App.** The App is reached only through ingress, which Home Assistant signs in, so login stays off there. Should the App offer the `auth` options for people who publish its port? **Recommended:** no, until the App publishes a port.

The three behaviour questions raised in version 0.2 (learning memory, pooled demand, learning on a stale room sensor) are decided; see section 13.

---

## 13. Changes in this revision

Built in November 2026: learned state across upgrades (4.3, 7, [ADR-0007](adr/0007-learned-state-across-upgrades.md)). The engine state format is version 2, with migrations from each older version, plausibility per parameter, provenance with each room's learning, invalidation rules (the first resets dry-run learning once the burner is metered), learning notes in `state` and the web UI, and saves from a newer version kept aside.

Built in November 2026, from the fail warm audit (7, fail warm: fallbacks, devices and sensors): the schedule mirror and the Shelly fallback windows use the weeks for everyone at home and the windows are never empty (5.7); an offline TRV room with a fresh sensor still counts for demand, and a TRV that stays idle while its room calls is stepped up with an alert (7); the manual fire flag expires after 6 hours or at local midnight (7, 8.1); an implausible room sensor reading is treated as missing, and hard frost from a room sensor needs a second source (5.2, 7); `GET /api/v1/household` and `check-config` warn when a saved household hides house file settings (7, 8.1); room sensor readings are remembered across a restart with their true age, and a room doesn't fall back to its TRV before its sensor's stale limit (7); open question 11 on the watchdog without a clock (12).

Built in November 2026: fail warm presence (7, [ADR-0005](adr/0005-fail-warm-presence.md)), after a dead phone left a one-person household held at frost, with the presence report's `evidence_at`, `source_type` and `battery`, `POST /api/v1/people/{id}/home` and the new `people` fields (8.1).

Built in November 2026: room use in `eco` with solo thresholds, the solo latch, the damp floor, use-aware burn extension and heat sinks and a longer optimum start horizon for rooms with room use (5.3, 5.8), and the room use comparison in the simulator (11), with open question 12 (12). A room set back by presence-based away (7) keeps its room use, so in `eco` it waits for its solo threshold, never below the damp floor. Not live on the reference install until the owner agrees.

Built in November 2026: burner metering from the Shelly's power reading (3, 5.6), heat availability and store recovery from the burner (4.1, 5.5), the `heat_unknown` learning gate (4.6), change detection that a wrong model can't lock out and the learning reset (4.3, 8.1). With fail warm, the two TRV rules of section 7 (the TRV disagrees, and an offline TRV room that doesn't warm) count only heat the relay or burner shows; the savings fit passes over `mixed` days (5.9).

Planned in November 2026 ([ADR-0004](adr/0004-efficiency-by-room-use.md), proposed): room use in the `eco` demand mode, with solo limits, the damp floor and use-aware burn extension and heat sinks (5.3, 5.8); savings against a timer-and-valves baseline from degree-hours and a fitted house signature, with comfort beside it (5.9); `GET /api/v1/savings` and additive `state` fields (8.1); Home Assistant sensors (8.2); Elastic fields (9); the Savings view (10); the simulator comparison (11); open questions 6 to 9 and hardware question 10 (12). The implementation plan is [efficiency-mvp](plans/efficiency-mvp.md). Since built: room use and the baseline in the snapshot, the savings core, `GET /api/v1/savings` with the closed days kept, the Elastic fields and the Savings view (slices 1, 3, 4 and 5), and room use in `eco` with the simulator comparison (slices 2 and 6).

Added in November 2026: the outdoor temperature from Home Assistant, chosen by `house.outdoor_source` (3, 7), with `POST /api/v1/outdoor`, `outdoor_reading` in `state` and `outdoor` in the savings body (8.1), and the outdoor entity option in radiate-ha (8.2).

Added since version 0.3 was settled: the `unheated` room role for a room with a sensor and no radiator (2.1, 4.6, 7, 10), and open question 5 on how unheated rooms should feed the model (section 12). Device health: battery and link quality are read (3), `GET /api/v1/devices` and `POST /api/v1/devices/scan` (8.1), and the devices view with its alerts (10). House suggestions: `GET /api/v1/suggestions` (8.1) and the suggestions view (10), with a capacity-based "radiator may be too small" check; the flow-sensitivity report of section 4.2 is still not implemented. The house model: `GET` and `PUT /api/v1/layout` and `boiler_linked` in the driver telemetry (8.1), and the house model with its room editor (10).

Version 0.3 settles the three behaviour questions from version 0.2 with the owner's decisions:

- **Learning memory** (4.3): configurable, `learning.memory_days`, default 730 days, with change detection that re-learns a room whose residuals stay biased.
- **Pooled demand** (5.3): two demand modes. `eco`, the default, pools demand as `Σ gap / a`, so a room on its own waits until it is 1.5 K below its target or other rooms join it. `comfort` keeps the earlier rule. The mode can be changed at runtime through `POST /api/v1/settings` (8.1).
- **Stale room sensor** (4.6, 7): learning pauses on the TRV fallback (`sensor_stale`), unless `learning.learn_on_trv_fallback` is `true`.

Version 0.2 brought the spec in line with the code. Where the code had deliberately gone another way, the spec now describes the code:

- Supply factor: the bypass sits inside the `κ` term, with `κ` fixed at 0.15 (4.1).
- Heat availability is on or off after the arrival lag, and the whole drive is smoothed over 15 min, instead of `φ` rising with a 6 min time constant (4.1).
- Arrival lag: a 0.6 K `T_trv` rise within 40 min, 8 min before the first sample, instead of `dT_trv/dt > 0.05 K/min` (4.1).
- Learning: the slope window, priors as standard deviations and the forgetting factor's real value (4.3).
- Allocation: 4 iterations, preheating deadlines, and pacing at the comfort horizon when capacity limited instead of opening everything (4.4).
- Lockshield cap: a decaying histogram with about a 23-hour half-life, written whenever a room is not allocated, not a 7-day window written in safe mode (4.4, 7).
- Governed mode: `system_mode` is `auto` with the schedule mirror, internal-sensor rooms use `local_temperature`, and external temperature is resent at least every 25 min (4.5).
- Learning gates: the gates as the code names them, including `unexplained_heat`, `no_heat` and the three valve gates that replace "valve trusted" (4.6).
- Fire detection thresholds, tuned in simulation (4.6).
- Fire, stop and burn extension rules, and the top-up target formula (5.3).
- Open-path guarantee: each room calling or topped up counts as one open radiator against a 1.5 radiator minimum (5.4).
- Safe mode starts when no TRV is reachable and hands the relay to the watchdog once Radiate's own burn is over (7).
- Elastic fields as exported (9).

Planned parts not yet built are kept and marked. Terms now follow the glossary: "opening limit" for `valve_opening_degree`, "comfort horizon" for the 150 min limit on target arrival, "target" for what Radiate heats a room towards, "heat sink" for a room opened only so the burner's heat has somewhere to go, and "relay starts" for the starts the guard counts.
