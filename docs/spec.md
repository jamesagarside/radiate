# Radiate specification

Version 0.3, 20 November 2026. Status: checked against the code at commit `925b7a1`, then updated with the owner's decisions on learning memory, pooled demand and stale room sensors (section 13); describes what is built and marks what is still planned.

Decisions this builds on: [ADR-0001](adr/0001-standalone-vs-vtherm-companion.md) (standalone), [ADR-0002](adr/0002-deployment-topology.md) (one engine, three editions). Prior art: [coverage matrix](research/coverage-matrix.md).

Units: °C, K, minutes (min), hours (h), kW, litres. An opening limit is the TRVZB `valve_opening_degree` in %.

Terms follow the [glossary](GLOSSARY.md). A room's **setpoint** is what its schedule or an override asks for now. Its **target** is what Radiate heats it towards this tick: the setpoint, the next setpoint while preheating (optimum start), or the frost threshold in `off` and `frost` modes. A room is **calling** when Radiate wants it heated; a TRV whose own thermostat has opened its valve is **heating**. Starts are **relay starts** unless the text says burner starts.

How to read this page:

- Text without a marker describes the code.
- **Not yet implemented** marks something planned and not built. Each one links to its section of [implementation status](implementation-status.md).
- **Open question** marks a behaviour choice for the owner, where the spec and the code disagree and neither is clearly right. None is open in version 0.3.
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
| **Room** | name, area, setpoint schedule, room sensor (optional), radiators, role (`normal`, `passive`, `internal_sensor_only`), heat sources |
| **Radiator** | TRV (optional), nominal output at ΔT50 (W, optional), `controllable` flag |
| **Heat source** | `episodic` (open fire, wood burner) or `continuous` (range cooker), optional binary sensor or schedule |
| **Boiler** | relay for heating demand, `on_off` type, fuel `oil`, rated output kW, nozzle rating (litres/h, optional), guard parameters (section 5) |
| **Store** | relay for store enable, schedule, priority over heating (`true` for Heatslave) |

As built, a room has one radiator, at most one TRV, at most one room sensor and at most one window sensor, and `controllable` follows from the role. **Not yet implemented** ([status](implementation-status.md#2-house-model)): room area, radiator nominal output, and binding a heat source to a binary sensor or schedule. The fire is flagged by detection or by the manual fire switch in the API.

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
| TRV availability, battery | Z2M | on change | failure handling |
| Outdoor temperature `T_out` | weather provider or local sensor | 10 to 30 min | loss model |
| Heating relay, store relay state | Shelly | on change | heat availability |
| Relay power (optional) | Shelly 2PM metering | 1 min | burner firing, if the wiring allows (ask the OFTEC engineer) |
| Flow pipe temperature (optional) | clamp probe on flow pipe | on change | direct supply signal; strongly recommended |

All inputs are timestamped, deduplicated and checked for staleness (section 7) before they reach the core. A battery sensor reports on change, so while it is available its last reading counts as current for `house.sensor_max_silence_min` (60 min by default); after that its real age applies.

**Not yet implemented** ([status](implementation-status.md#3-signals)): a weather provider (the outdoor temperature comes from a local Zigbee2MQTT sensor, and the core assumes 5 °C without one), TRV battery, relay power fed to the core (the Shelly's `apower` appears in telemetry only), and the flow pipe temperature.

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

**Heat availability and drive.** `φ_r` is 0 until the room's arrival lag has passed since flow started (heating relay on and the store not recovering), then 1. The product `S · f(o_r) · φ_r` is smoothed with a 15-minute time constant, which stands for the radiator warming up and cooling down. That smoothed value is the room's **drive**.

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

  Neither is checked in a model's first 2 days of learning from priors. To re-learn, the model adds 30 % of its prior covariance back, widens the outlier limit to the recent residuals, and resets the statistics; the long memory then carries on. Each re-learn raises the reason `learning.relearn`, which goes to the decision log. In simulation, a radiator that loses half its output is re-learned within about a day; the same model without change detection is still far off days later (see [simulation](simulation.md#learning-memory-and-change-detection)). An error-variance rule was tried as well, but in simulation it did not separate a real change from an ordinary day, so it is not used. A large rise in a radiator's output can close the `unexplained_heat` gate and hide some of the evidence; in simulation a radiator whose output rose by 60 % was still re-learned within about a day.
- Change-detection statistics are saved with each room's model as counts of learning updates, so they need no clock. Saves from before change detection load with fresh statistics.
- **Priors:** `a = 1.5 ± 1.5 K/h`, `b = 0.08 ± 0.06 /h`, `d = 0 ± 0.05 K/h`. A room with a continuous heat source starts at `d = 0.3 ± 1.0 K/h`, so `d` is free to absorb the range cooker; everywhere else it stays near 0.
- **Bounds:** `0.1 ≤ a ≤ 12 K/h`, `0.005 ≤ b ≤ 0.6 /h`, `−0.5 ≤ d ≤ 3 K/h`. **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): a diagnostic when a value sits on a bound for 24 h.
- **Bootstrap:** when Radiate starts with no usable saved state, and when `radiate bootstrap` runs, the standalone database's tick history (up to `house.history_days`, 14 by default) is replayed through `decide` from priors with a throwaway state, so day one is not a cold start. Only the room models, arrival lags and lockshield histograms are kept; the boiler guard and timers come from the saved state. **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): the Home Assistant recorder as a second source.
- **Outlier rejection:** after the first 30 updates, a sample whose error is beyond 4 σ of the rolling residual is dropped and counted.
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
| `smart_temperature_control` | `false` | the adaptive PID mode disables opening limits |

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
| `valve_untrusted` | the stuck valve check has flagged the room (section 7) | room |
| `valve_leaking` | the leaking valve check has flagged the room (section 7) | room |
| `valve_rejected` | the TRV rejected a setting (reconciler), and for an hour after | room |
| `no_data` | no usable temperature, slope or outdoor difference | room |
| `sensor_stale` | a `normal` room's own sensor is stale and its temperature comes from the TRV, and for the 15 min slope window after the sensor is back. Off with `learning.learn_on_trv_fallback: true` | room |
| `trv_offline` | the TRV is unavailable | room |
| `store_recovery` | the store relay has been on for less than the store's recovery time | house |
| `setpoint_change` | less than 15 min since the target changed | room |

Passive rooms have no room model, so they never learn.

A room whose sensor is stale still has a temperature: it falls back to `T_trv` plus the TRV bias (section 7). It doesn't learn from that reading by default, because the TRV sits beside its radiator and reads the radiator as much as the room, which no single bias corrects. The `sensor_stale` gate holds until the slope window contains room sensor readings only. To learn from the TRV reading anyway, set `learning.learn_on_trv_fallback: true`. Internal-sensor rooms always use the TRV and are not affected.

**Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): ending store recovery early once `T_trv` is seen rising again somewhere, and learning the recovery time (it is fixed, 25 min by default, `store.recovery_min`).

**Open fire (lounge).** Episodic source. Fire is flagged when any of these is true:

- the manual "fire lit" switch is on (binding a fire sensor is not yet implemented, section 2.1);
- the room rises faster than 0.8 K/h while its radiator has had no heat for 30 min (drive near 0);
- the model residual has been above +1.0 K/h for 10 min, is now above +2.0 K/h, and the room's confidence is at least 0.6.

The thresholds came from simulation: the planned +1.5 K/h residual rule flagged morning warm-up as a fire before the model had learned, so the residual rule now needs a confident model and the rise rule needs the radiator off for 30 min (see [simulation](simulation.md#bugs-the-simulator-caught)).

While flagged: no learning for the lounge; the lounge is removed from boiler demand; its valve is closed (opening limit 0, setpoint unchanged). The flag clears after 30 min with no evidence and the switch off. Then a hold-off of 4 h (masonry keeps radiating) runs before learning resumes.

**Range cooker (kitchen).** Continuous source. The kitchen keeps learning, and `d_r` is free to be large (it absorbs the Aga's steady output). Cooking spikes close the `cooker_spike` gate. **Not yet implemented** ([status](implementation-status.md#4-balancing-algorithm)): if the kitchen has not called for heat for 14 days, the UI marks it "self-heated" and its lockshield cap drops to `o_floor`.

**Stairs radiator (unvalved bypass).** Not controllable, never actuated, never learned as a room. It is modelled as the always-open path `κ_bypass` in the supply factor, and it counts towards the open-path guarantee (section 5.4). Its room sensor is shown in the UI and used as a weak heat-availability check: in the no-heat check (section 7), a 0.3 K rise on the stairs while the heating relay is on shows heat is reaching the radiators.

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
- **Frost override:** any room below the frost threshold makes the fire rule hold, within the usual guards. Below the hard frost threshold, 5 °C, the start ignores minimum off and the starts-per-hour limit.

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

**Not yet implemented** ([status](implementation-status.md#5-boiler-logic)): **store merging** (opt-in), shifting the store window by up to ±30 min to start just before or after a heating burn, so the burner runs once for both.

### 5.4 Open-path guarantee

During LEAD and FIRING, while a room is calling or extended or the burn is inside minimum burn, the open path must be enough for the burner: each room calling or topped up counts as one fully open radiator (the allocator's floor keeps each near full flow fraction), plus the bypass equivalent `κ_bypass`, and the total must reach `sink_min`, 1.5 fully open radiators by default (`HouseConfig.sink_min`, not in the configuration file). If not, the coldest rooms relative to their target that are not calling (excluding rooms flagged for fire, with no reading or with the TRV offline) are opened as **heat sinks**, one at a time until the total is reached, with the top-up target from 5.3. A heat sink is often already above that target, so its TRV setpoint is at least its reading + 1 K, rounded up to 0.5 K (section 4.5); otherwise the TRV's own hysteresis keeps the valve shut and only the bypass takes the heat. The stairs bypass always counts.

### 5.5 Hot-water store (channel 2)

- **Schedule:** up to 4 windows per day, the same every day; default 06:00 to 07:30 and 17:00 to 21:00.
- **Boost:** 60 min by default, 0 to 180, from the UI, API or HA service.
- **Priority awareness:** the Heatslave gives the store priority, so radiators get no flow while it recovers. For the store's recovery time after channel 2 turns on (25 min by default, `store.recovery_min`), heat availability `φ = 0`, so the drive falls away and the arrival lag clock does not start. The burn timer keeps counting (the burner is firing), and learning is gated (`store_recovery`). **Not yet implemented** ([status](implementation-status.md#5-boiler-logic)): learning the recovery time from `T_trv` stalls during store recovery.

### 5.6 Oil and runtime accounting

- Burner hours, relay starts, burn-length histogram and the most relay starts in any hour are kept per day.
- With a nozzle rating (litres/h, from the service sheet), litres used and kWh delivered (litres × 10.35 kWh × assumed efficiency 0.85) are estimated. Relay time is used, which includes the boiler thermostat's own off periods inside a call, so litres are an upper bound (about 60 % high in simulation). **Not yet implemented** ([status](implementation-status.md#5-boiler-logic)): replacing relay time with actual firing time when relay power metering shows the burner firing.
- Days follow local midnight. The day so far and the previous day are in `GET /api/v1/state` under `accounting`; each closed day goes to the daily Elastic stream.
- A day is **partial** when Radiate did not see all of it: it started after midnight, or more than 30 min of the day went unseen between ticks (including time down across a restart). A partial day's totals cover what Radiate saw, it carries `partial: true` (Elastic `radiate.partial_day`), and its balance score is null: a first day starts with untrained models, so its arrival spread says little about the house.
- Short-cycle alert: more than 4 relay starts in an hour, or burns under the minimum because of an external stop (the relay dropped while Radiate still called) for 2 hours running, meaning such burns at least an hour apart within the last two hours. Radiate's own guard allows at most 3 relay starts an hour, so this catches another controller, a manual switch or a relay dropping out.

### 5.7 Fail-safe relay watchdog (Shelly script)

A small Shelly Gen4 script runs on the relay itself:

- Radiate sends a heartbeat every tick (60 s).
- No heartbeat for 10 min: the script takes over. Channel 1 follows a local fallback schedule (the windows Radiate last pushed; 05:30 to 08:30 and 16:00 to 22:30 until it has pushed any) with its own minimum burn (8 min) and off (10 min) times; channel 2 follows the store schedule last pushed by Radiate.
- Heartbeat returns: control goes back to Radiate. The boiler guard first adopts the relay as Radiate finds it (**hand-back**). A burn Radiate did not start gets a full minimum burn from when Radiate first sees it, because the Shelly does not report when the relay changed. A relay seen switching off, or not seen for 5 min or more (Radiate down, Shelly unreachable, a first start), restarts minimum off from then. While in safe mode Radiate follows the watchdog's burns without stopping them, so it knows their start when it takes over.
- A hard auto-off of 120 min on channel 1 means the relay can never latch on indefinitely.

The script is published in the repository and installed by the user, or with `radiate shelly install-watchdog --config radiate.yaml --yes` over the Shelly local API. Radiate keeps the fallback windows in KVS keys `radiate_heat` (derived from the room schedules, started an hour early) and `radiate_store`.

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

`record` keeps the last 500 boiler, disturbance, safe mode and `learning.relearn` reasons in memory as the decision log. It also keeps each tick's snapshot and a compact form of its actions (valve settings, relays, boiler state, reason and alert codes) in the state database for `house.history_days` days, 14 by default, with a start entry that describes how the engine state was built at each start. Recording errors are logged and never stop the loop. `radiate replay` runs the recorded snapshots through `decide` again and reports where the actions differ; with the same code and configuration there are none.

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
| TRV offline | Z2M availability, or nothing heard for twice `house.sensor_max_silence_min` when availability is not reported | Excluded from demand, allocation and learning (`trv_offline`); alert `driver.trv_offline`. **Not yet implemented** ([status](implementation-status.md#7-failure-modes)): treating it as possibly open at its last opening limit in the supply factor |
| Coordinator or MQTT down | broker disconnected or Zigbee2MQTT offline, which marks every TRV unreachable; or no TRV reachable for any other reason | Enter **safe mode** (alert `safe_mode.no_trvs`): no new start except below the hard frost threshold; a burn Radiate started runs to minimum burn and the relay is switched off; then Radiate sends no relay commands and no heartbeat, so the Shelly watchdog's schedule takes over. TRVs keep their last setpoint and opening limit, which is the lockshield cap unless they were allocated. Radiate keeps reading the relay and follows the watchdog's burns, then hands back as in section 5.7 |
| Radiate process dies | (no detection needed) | TRVs keep governed settings and their mirrored schedules and run their own thermostats; Shelly watchdog takes over after 10 min |
| Radiate restarts | saved state in SQLite | Learned models, lockshield caps, valve verdicts, the short-cycle adaptation, the day's accounting, overrides and the boiler guard are restored, with timers moved on by the downtime, so minimum burn and minimum off still hold. After 5 min or more down, or with no saved state, the watchdog might have switched the relay, so the guard restarts its timers from the relay as found (section 5.7). TRV settings are re-sent |
| Home Assistant restarts or is down | | No effect on control (MQTT drivers); the HA integration shows unavailable |
| Internet down | | No effect on control; Elastic export buffered on disk (up to 7 days) |
| Boiler lockout or out of oil | heating relay on for 30 min with at least one valve open (store recovery and time with every valve shut do not count), and no sign of heat: no TRV reading rising 0.6 K above its room, no ordinary calling room warming by 0.3 K/h, no 0.3 K stairs rise | Alert "No heat: check oil and boiler lockout" (`boiler.no_heat`); keep calling (the boiler may recover) but stop learning (`no_heat`). Clears when heat is seen again |
| Valve stuck | 40 min of flow per burn with the room calling, its opening limit at least the floor and the TRV reporting heat, while another radiator warmed, and its own TRV reading did not rise 0.6 K against the room; 3 burns in a row | Alert `valve.stuck`; room flagged untrusted (learning paused, `valve_untrusted`); not counted as an open valve. Clears when its radiator warms again |
| Valve leaking (rise with valve closed) | during flow, with the room not calling, its TRV not heating and its valve shut since before the flow began (radiator off 20 min), the TRV reading rises at least 1 K against the room sensor, in 2 of the last 5 judged burns. Rooms without a room sensor, and rooms flagged for fire, window, shower or a cooker spike, are not judged | Alert `valve.leaking`; room flagged untrusted (learning paused, `valve_leaking`). Clears after 5 judged burns in a row that stay cool. No recalibration offer: the TRVZB has no calibration command in Zigbee2MQTT ([status](implementation-status.md#7-failure-modes)) |
| Short-cycling | > 4 relay starts per hour, or external stops (section 5.6) | Raise minimum off by 5 min (up to 30) for 24 h, at most once an hour; alert `boiler.short_cycle`. Kept across restarts |
| Overheating | a sustained positive residual (section 4.6) | Learning gated (`unexplained_heat`, or `fire` or `cooker_spike` where the room has that heat source). **Not yet implemented** ([status](implementation-status.md#7-failure-modes)): the planned rule for a room above setpoint + 2 K with its valve closed, and closing a valve to blame with an alert |
| Frost | any room < 7 °C | Frost override (section 5.2) |
| Clock jump or DST | monotonic clock in the server | Timers use monotonic time; schedules use local time |
| Corrupt learned state | non-finite or out-of-bounds parameters | A whole saved state that can't be read is relearned from the tick history (section 4.3); a single corrupt room is reset to priors and logged. **Not yet implemented** ([status](implementation-status.md#7-failure-modes)): replaying history for that one room, and an alert in the UI |

Radiate does not write anything special to the valves in safe mode: it cannot reach them. The lockshield cap is written whenever a room is not being allocated (section 4.4), so every radiator already carries a balanced opening limit, its schedule setpoint and closing degree 100, and stays balanced and thermostatic without Radiate.

---

## 8. Interfaces

### 8.1 Server API (v1)

Request and response bodies are JSON. A body that is not a JSON object returns 400, as does an invalid setpoint, mode, setting or time; an unknown room or person returns 404.

| Method and path | Body | Purpose |
|---|---|---|
| `GET /api/v1/health` | | `{"ok": true}`; never needs a token |
| `GET /api/v1/house` | | House ID, version, driver name, rooms (id, name, role, heat source, controllable), boiler guard settings, `people` (`id`, `name`) and `household`: every household setting with its default filled in (`timing`, `away`, `temperatures`, `weekend_days`, and per person and per room their routines, settings and the settings they `inherited`), the allowed ranges in `limits`, the choices in `options`, and `damp_below_c`. `household` is `null` without a household |
| `GET /api/v1/state` | | Live snapshot: mode, outdoor temperature, boiler (with short-cycle state, `adopted` for a burn Radiate did not start, and `watchdog_handover` while the watchdog has the relay), store, per-room temperatures, opening limits, demand flags (`calling`, `topup`, and `extend` for a burn extension rather than a heat sink), learning gate, learned model, latest reason (`reason`, with its code in `reason_code`, such as `demand.pooled`), override, detected fire, manual fire flag (`fire_switch`), valve checks (`valve`: `untrusted` for a stuck or leaking valve, `misses`, `leaking`, `leak_burns`, and `rejected` for settings the TRV would not take), daily accounting, 24 h relay timeline, alerts (`alerts` as messages, `alert_details` with `code`, `message` and `room_id`), driver telemetry, `boiler.pooled_demand_min` (section 5.3) and `settings` (the same object as `GET /api/v1/settings`) |
| `GET /api/v1/decisions?since=T` | | Decision log entries (`at`, `code`, `message`, `room_id`) after `T`, in the server's monotonic seconds |
| `POST /api/v1/rooms/{id}/setpoint` | `{"setpoint": 21.0}` | Override the schedule, 5 to 28 °C, until the room's next scheduled change. Optional `"duration_min": 90` holds it for that long instead (up to 7 days); `"until": "cleared"` holds it until `{"setpoint": null}` clears it. Saved across restarts; the response and each room's `override` in `state` give `until` and `expires_in_min` |
| `POST /api/v1/rooms/{id}/fire` | `{"lit": true}` | Manual fire flag. Not saved across restarts |
| `POST /api/v1/store/boost` | `{"minutes": 60}` | Boost the store for 0 to 180 minutes; 0 cancels |
| `POST /api/v1/mode` | `{"mode": "auto"}` | `auto`, `off` or `frost` |
| `GET /api/v1/people` | | The household's people and their away state: `everyone`, `frost` (everyone away is holding the house at frost protection), `presence_delay_min`, `return` (`at`, the next known return while rooms can warm up for it, or `null`), `today` (local date) and `people`, each with `id`, `name`, `away`, `reason` (`away_until` or `presence`), `until` and `presence` (`state`, `since`, and `stale` when it hasn't been reported within the stale limit). The same object is `away` in `state`; `house` lists `people` with `id` and `name` |
| `POST /api/v1/people/{id}/away` | `{"until": "2026-11-24T18:00"}` | Away until a local date and time, or a date for the start of that day. An offset is allowed. Must be in the future and within 60 days. `{"until": null}` clears it. Saved across restarts |
| `POST /api/v1/people/{id}/presence` | `{"state": "not_home", "since": "2026-11-24T08:10:00+00:00"}` | Presence from Home Assistant: `home`, `not_home`, or `null` to forget it. `since` is when the state changed (optional, never later than now). Every report, a repeat included, refreshes the presence; presence not reported within `household.away.presence_stale_after_min` counts as unknown |
| `GET /api/v1/schedules` | | The week each controllable room follows now, for the web UI's week view. `now` (`weekday`, Monday = 0, and `minute`, house time), `levels` (the household's `in_use`, `occasional`, `unused` and `night` temperatures, or `null` without a household), `frost` (everyone away is holding frost) and `rooms`, each with `id`, `name`, `source` (`household` or `hand_written`), `schedule` (the house file's schedule name, or `null`), `days` (seven, Monday first, each with `day`, `transitions` as `minute` and `setpoint`, and `text` in words), `summary` (runs of identical days as `days` and `text`, as `radiate schedules` prints them), `notes` (warm periods dropped to fit the TRV, in words), `people` the room depends on (`id`, `name`) and `away` (`null`, or `people`, `text` and the `usual` summary when someone being away changed the week). Household rooms reflect who is away now |
| `GET /api/v1/household` | | The household setup for the web UI's wizard: `source` (`saved`, `house_file` or `null`), `house_file` (whether the house file has a household section), `saved_at` (where a save goes, or `null` in the demo), `saved_problems` (why a saved household was not used, as `path` and `message`), `household` (the household in use as the house file's `household` section, or `null`), `defaults` (`timing`, `away`, `temperatures`, `weekend_days`), `limits`, `options`, `damp_below_c` and `rooms` (each controllable room's `id`, `name`, `schedule`, its own schedule in the house file or `null`, and `heat_source`). `404` when the server offers no setup |
| `POST /api/v1/household/preview` | `{"household": {...}}` | Check and compile a draft `household` section without saving it. Answers in the shape of `GET /api/v1/schedules`, as it will be once saved, plus `errors` and `notes` (each `path` and `message`, such as `household.people.sam.weekdays.up`). With errors, `rooms` is empty |
| `PUT /api/v1/household` | `{"household": {...}}` | Save the draft to `<data_dir>/household.yaml`, where it replaces the house file's section, then recompile and hand the new weeks to the driver. `400` with `errors` if it isn't valid; `500` with `message` if the file can't be written. Answers as `GET` |
| `DELETE /api/v1/household` | | Delete the saved household and use the house file's again. Answers as `GET` |
| `GET /api/v1/settings` | | Settings: `demand_mode` in effect (`eco` or `comfort`), `demand_mode_default` (from `boiler.demand_mode`), `demand_modes` (`["eco", "comfort"]`), `comfort_limit_k`, `eco_limit_k`, `learning_memory_days` and `learn_on_trv_fallback`. Only `demand_mode` can be changed at runtime |
| `POST /api/v1/settings` | `{"demand_mode": "comfort"}` | Change runtime settings; only the keys given change. `demand_mode` is `eco`, `comfort`, or `null` to follow `boiler.demand_mode` again. Saved across restarts and used from the next tick. Returns `{"ok": true, "settings": {...}}`. An unknown key or value returns 400 |
| `GET /api/v1/stream` | | WebSocket: the state on connect and after every tick |

Authentication: when `RADIATE_TOKEN` is set, every `/api/` path except `health` needs `Authorization: Bearer <token>`. Browsers cannot set headers on a WebSocket, so `stream` also accepts the token as its first message, `{"token": "<token>"}`; it waits up to 10 s and closes with code 4401 if the token is missing or wrong. In the HA App, requests from the Supervisor's ingress address (`RADIATE_INGRESS_IP`) that carry an `X-Ingress-Path` header are trusted without a token. The web UI at `/` and `/static/` is not protected.

### 8.2 Home Assistant integration

Thin client (ADR-0002): it reads `house` and `state` and posts to the routes in 8.1. An entity whose key an older server does not report is not created, and becomes unavailable if the key disappears.

- Per controllable room: a `climate` entity with current and target temperature and heating action. Setting its target creates an override that ends at the room's next scheduled change. Attributes give the opening limit, learning state, latest reason and the override's `override_setpoint`, `override_until` and `override_expires_in_min`. Sensors for temperature, opening limit, heating gain, loss rate, arrival lag, model confidence and learning state, and a valve problem binary sensor (problem class, from `valve.untrusted`, so on for a stuck or a leaking valve; it is named "Stuck valve" in Home Assistant).
- Per room with an episodic heat source: a "Fire lit" switch that posts `rooms/{id}/fire` and shows `fire_switch`, and a "Fire detected" binary sensor for fire as Radiate sees it, from detection or the switch.
- Rooms Radiate cannot control get a temperature sensor only.
- House: a heating mode select that posts `mode`, binary sensors for the hot-water store (`store.relay`) and a store boost (`store.boost`), a demand mode select (`select.radiate_demand_mode`, unique ID `<house id>_house_demand_mode`, options `eco` and `comfort`) that shows `settings.demand_mode` and posts `settings`; choosing `settings.demand_mode_default` posts `null`, so the server follows its configuration file again. A diagnostic pooled demand sensor in minutes (`sensor.radiate_pooled_demand`, unique ID `<house id>_house_pooled_demand`) from `boiler.pooled_demand_min`. Boiler state, boiler firing, relay starts in the last hour, predicted burn, outdoor temperature, short-cycle extra off time (with when it ends and the effective minimum off), and an alerts count with each alert's code, message and room as attributes. From `accounting`: burner hours and relay starts today, litres and kWh today when a nozzle rating is set (all reset at local midnight), and yesterday's balance score.
- Per household person: an "away" binary sensor, on while Radiate counts them away, with `reason`, `away_until`, `presence`, `presence_since` and `presence_stale` as attributes. An options step maps each person to a Home Assistant `person` entity; the integration posts its state to `people/{id}/presence` when it changes, and every 15 minutes as a heartbeat (`home` is home, any other state is not home, `unknown` and `unavailable` are not sent).
- Services: `radiate.boost_store`, `radiate.set_mode`, `radiate.set_override` (a climate entity, `temperature`, optional `until` and `duration_min`, as in 8.1), `radiate.clear_override`, `radiate.set_away` (`person`, `until`) and `radiate.clear_away` (`person`). **Not yet implemented** ([status](implementation-status.md#8-interfaces)): `radiate.recalibrate_valve`, blocked because the TRVZB has no calibration command in Zigbee2MQTT.

---

## 9. Elastic metrics export

Optional, off by default. Documents follow ECS and are sent with the Bulk API (API key auth) to data streams.

| Data stream | Interval | Key fields |
|---|---|---|
| `metrics-radiate.room-default` | 1 min | `radiate.room.{id,name,role,heat_source}`, `temperature.{room,setpoint,target}`, `humidity.room`, `valve.{opening_pct,lockshield_pct}`, `demand.{calling,preheating,topup,gap_k}`, `model.{a,b,d,confidence,arrival_lag_min,samples}`, `learning.{active,gate}`, `disturbance.fire` |
| `metrics-radiate.boiler-default` | 1 min | `radiate.mode`, `boiler.{state,relay,starts_1h,predicted_burn_min}`, `boiler.burn.elapsed_s`, `store.{relay,boost}`, `supply.factor`, `outdoor.temperature` |
| `logs-radiate.decision-default` | per decision | `event.action` (the reason code), `message`, `radiate.room.id` |
| `metrics-radiate.daily-default` | daily | `radiate.day`, `radiate.partial_day`, `balance.{arrival_spread_min,score,starts_measured}`, `boiler.{starts,max_starts_1h,burner_hours,hours_basis,litres,kwh}`, `boiler.burns.{count,mean_min,min_min,max_min,histogram.*}`, `rooms.comfort_minutes_below` |

Common fields: `@timestamp`, `data_stream.*`, `service.{name,version}`, `radiate.house.id` (random UUID). No personal data, no location.

- **Time series data streams**: room and boiler streams are TSDS with dimensions `radiate.house.id` and `radiate.room.id`. The index templates are built by `radiate.export.elastic.index_templates()`; [deployment](deployment.md#elastic-export) shows how to install them.
- **Buffering**: an on-disk queue (SQLite) holds up to 7 days when Elastic is unreachable; retries with backoff; batch size 500 or 10 s.

**Not yet implemented** ([status](implementation-status.md#9-elastic-export)): `temperature.trv`, `model.eta`, `disturbance.{shower,window,cooker_spike}`, `boiler.firing`, `store.recovering`, `host.name` (edge id, not the house name), a Kibana dashboard (balance, burns, rooms), an install command for the templates, and an OTLP path to an EDOT collector.

**Balance score (daily):** for each heating start with two or more calling rooms, the spread between the first and last room reaching its target. Score = 100 × (1 − median spread / 120 min), clamped 0 to 100. The rooms are the `normal` rooms calling when the burn starts; a room still calling when the burn ends counts as arriving then; a burn where no room arrives is not scored; a partial day (section 5.6) has no score. **Not yet implemented** ([status](implementation-status.md#9-elastic-export)): weather normalisation following Håkansson et al. 2025.

---

## 10. User interface

One web UI, served by the server and embedded through HA ingress. It is a dashboard people open many times a day, so it is crisp and fast rather than decorative (emil-design-eng):

- **House view**: one card per room with temperature against target, opening limit bar, learning state ("Learning paused: fire lit"). Boiler strip with a burn timeline for the last 24 h and minimum burn/off countdowns.
- **Motion**: only where it explains state. Opening limit bars and the burn timeline transition `transform`/`opacity` in 200 ms with a strong ease-out; no animation on keyboard actions; hover effects gated by `(hover: hover) and (pointer: fine)`; `prefers-reduced-motion` keeps fades and drops movement.
- **Explainability**: every room shows its latest reason, such as "Lounge: fire lit, radiator closed and learning paused". A room waiting in `eco` (`demand.pooled`) reads "Waiting to share a burn with other rooms".
- **Demand mode**: an Eco and Comfort control beside the heating mode, with one line saying what the mode in effect does. It starts "Default:" while the server follows `boiler.demand_mode`, and picking that mode sends `null`. Hidden when the server sends no `settings`.
- **Setup**: the first step is `radiate discover` on the command line. It reads Zigbee2MQTT's retained `bridge/devices` and `bridge/groups` (read-only), matches TRVs, temperature sensors and contact sensors into rooms by description area, friendly name or group, and writes a commented YAML draft in dry run with one pilot valve. Rooms with a TRV and no sensor become `internal_sensor_only`; sensors with no TRV are commented `passive` candidates, because an unvalved radiator can't be detected. Rules are in [configuration](configuration.md#start-from-your-devices).

**Not yet implemented** ([status](implementation-status.md#10-user-interface)): an arrival estimate on each room card, allocation reasons such as "Opening 35 % so it arrives with Bedroom 3 at 07:10" (the allocator gives no per-room reason yet), and a setup wizard in the UI that discovers rooms from Zigbee2MQTT or HA areas and marks bypass radiators, heat sources and the boiler relay.

---

## 11. Simulator

A thermal simulator of the reference house (`src/radiate/sim`) drives the same `decide` core:

- Hydraulics: fixed-head pump, per-radiator conductance by pipe run, TRV valve characteristic, always-open stairs path.
- Boiler: on/off burner, internal boiler thermostat, store with hot-water priority and draw-offs.
- Rooms: thermal mass, loss to outdoors, coupling to neighbours, radiator emission `∝ ΔT^1.3`, TRV sensor self-heating.
- Disturbances: open fire evenings, Aga continuous heat, showers, open windows.
- Scenarios compare "no Radiate" (TRVs fully open, boiler on any call) with Radiate on arrival spread, comfort minutes below setpoint, relay and burner starts and burn lengths. Tests assert the guards are never violated.

---

## 12. Open questions

Hardware and legal:

1. Can the Shelly 2PM channel 1 power reading show burner firing with the planned wiring? Ask the OFTEC engineer to wire so it can, or add a separate meter on the boiler supply. Simulation shows this matters: Radiate cuts relay starts by 84 %, but burner starts are set by the boiler's own thermostat cycling inside long calls (see [simulation](simulation.md)). Reducing those needs the firing signal.
2. Will the owner fit a flow pipe clamp sensor? It replaces the inferred heat availability with a measured one.
3. Heatslave 12/14 nozzle rating and the boiler thermostat setting, for oil accounting and the simulator.
4. Freedom-to-operate check on EP1936290 and EP2420748 before marketing balancing in Germany or the EU.

The three behaviour questions raised in version 0.2 (learning memory, pooled demand, learning on a stale room sensor) are decided; see section 13.

---

## 13. Changes in this revision

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
