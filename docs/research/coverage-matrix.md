# Feature coverage matrix

November 2026. Every feature found across the products studied, and what Radiate does about it.

Sources: [vtherm.md](vtherm.md) (code, commit `35f46e5`), [better-thermostat.md](better-thermostat.md) (code, commit `aed2036`), [commercial.md](commercial.md) (public material only). Provenance in [provenance.md](provenance.md).

## Legend

Product columns: **Y** yes, **P** partial, **N** no, **?** not public, **–** not applicable.

Radiate columns show the stance under each architecture in [ADR-0001](../adr/0001-standalone-vs-vtherm-companion.md):

- **v1**: Radiate implements it in the first release.
- **later**: Radiate implements it after v1.
- **defer**: left to another integration (VTherm, Better Thermostat or HA core). In the companion column this means VTherm.
- **skip**: deliberately not done.
- **P** (companion column): only partly achievable without owning the room loop.
- **blocked**: needs an upstream change first.

★ marks features no studied product offers.

## A. Balancing

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Whole-house (inter-room) balancing | N | N | Y | Y | Y | v1 | v1 | The gap Radiate exists to fill |
| Intra-room multi-TRV load sharing | N | P | ? | Y | ? | later | later | Danfoss `load_room_mean` pattern; reference house has one TRV per room |
| Learned per-radiator opening cap | N | N | ? | ? | Y | v1 | v1 | Patent check needed: EP1936290 |
| Runtime-writable cap actuator | N | Y | – | – | – | v1 | blocked | VTherm cap is config-only; needs an upstream PR |
| Continuous re-balancing | – | – | Y | Y | Y | v1 | v1 | |
| ★ Synchronised arrival (calling rooms reach setpoint together within a burn) | N | N | ? | ? | ? | v1 | P | Needs control of the room loop, so only partial as a companion |
| Works with an uncontrolled bypass radiator | – | – | N | ? | ? | v1 | v1 | Stairs radiator modelled as a fixed open path |
| ★ Balance-quality metric and report | N | N | ? | ? | ? | v1 | v1 | Spread of time-to-setpoint, after Håkansson et al. 2025 |
| Pump speed advice | N | N | Y | N | N | later | later | Advice only; Heatslave pump is internal |
| One-off calibration burn (open all, measure arrival) | N | N | ? | ? | ? | later | later | Opt-in; DE4221725 lineage (expired); avoid EP2702331 stepwise routine |
| Flow or return temperature sensing | N | N | N | P | ? | later | later | Optional pipe-clamp sensors; Computime patent needs per-radiator delta-T, avoid |

## B. Valve actuation (TRVZB)

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Write `valve_opening_degree` | Y | Y | – | – | – | v1 | defer | |
| Pin closing = 100 minus opening | Y | Y | – | – | – | v1 | defer | Defeats the TRV's own heat/idle swing |
| Close bump (open wider, then close) | N | Y | – | – | – | v1 | defer | Counters reported calibration loss; reimplemented from behaviour |
| Minimum step (at least 3 %) | Y | P | – | – | – | v1 | defer | |
| Write budget and rate limiting | Y | Y | – | – | – | v1 | defer | |
| Reconciler for lost writes | P | Y | – | – | – | v1 | defer | |
| ★ Valve feedback plausibility (command vs temperature response) | N | N | – | P | – | v1 | P | Both projects trust the command echo |
| Valve exercise (anti-seize) | N | Y | – | Y | ? | v1 | defer | Summer schedule |
| Manual recalibration service | Y | P | – | Y | – | v1 | defer | |
| Calibration-loss detection | N | N | – | Y | ? | later | later | Danfoss reports adaptation "lost" |
| External room temperature to TRV | Y | Y | – | Y | ? | v1 | defer | |
| External temperature keepalive (under 2 h) | N | Y | – | Y | ? | v1 | P | VTherm sends on change only; Radiate can top up |
| Sensor selector management | N | Y | – | – | – | v1 | defer | |
| Seed write-only entities at start | Y | ? | – | – | – | v1 | defer | |
| Multi-ecosystem adapters (ZHA, Z-Wave, Shelly) | P | Y | – | – | – | later | defer | Z2M and ZHA TRVZB first |
| Per-model quirk catalogue | P | Y | – | – | – | later | defer | |
| Child lock | P | Y | ? | Y | ? | defer | defer | Device feature, not a balancing concern |

## C. Room control

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Per-room closed-loop control | Y | Y | Y | Y | Y | v1 | defer | Standalone uses the house model |
| TPI | Y | P | ? | ? | ? | skip | defer | Replaced by model-based control |
| PI / PID | Y | Y | ? | Y | ? | v1 | defer | PI as safe fallback controller |
| Auto-tuning | Y | Y | ? | ? | ? | v1 | defer | Falls out of model learning |
| MPC (single room) | N | Y | ? | ? | ? | skip | defer | Superseded by house-level controller |
| ★ House-level MPC (rooms and boiler jointly) | N | N | ? | ? | ? | later | skip | v1 ships the heuristic allocator; MPC is the next step |
| Tolerance band / hysteresis | Y | Y | ? | ? | ? | v1 | defer | |
| Overshoot protection | P | Y | ? | ? | Y | v1 | defer | |
| Optimum start (preheat) | N | N | ? | Y | ? | v1 | later | From learned warm-up model |
| Optimum stop | N | N | ? | ? | ? | later | skip | Wiser offers it |
| Presets (comfort, eco, away) | Y | Y | Y | Y | Y | v1 | defer | Minimal set |
| Schedules | P | P | Y | Y | Y | defer | defer | HA schedule helpers |
| Boost | P | Y | Y | ? | Y | later | defer | |
| Summer / outdoor cut-off | P | Y | ? | ? | ? | v1 | defer | |
| Forecast-based cut-off | N | Y | ? | ? | ? | later | defer | |
| Central mode (house off, frost) | Y | N | Y | ? | ? | v1 | defer | |
| Frost protection | Y | Y | Y | Y | Y | v1 | defer | |
| Presence and motion presets | Y | N | Y | ? | ? | defer | defer | HA automations |
| Electrical power shedding | Y | N | – | – | – | skip | defer | Oil boiler, not electric heaters |
| Cooling / AC | Y | Y | – | – | – | skip | defer | |

## D. Learning and models

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Room heat-up rate learning | P | Y | ? | ? | ? | v1 | v1 | KALO "Verfahren T" uses it |
| Heat-loss (cool-down) learning | P | Y | ? | ? | ? | v1 | v1 | |
| Outdoor-normalised model | Y | Y | ? | ? | ? | v1 | v1 | |
| ★ Per-radiator flow-share estimate | N | N | ? | ? | ? | v1 | v1 | Core balancing signal |
| ★ Radiator arrival lag after burner start | N | N | ? | ? | ? | v1 | v1 | From TRV internal temperature rise |
| Inter-room heat coupling | N | N | ? | ? | ? | later | later | Stairs and open doors |
| Learned state persistence | Y | Y | Y | Y | Y | v1 | v1 | |
| Regime-change detection | Y | N | ? | ? | ? | later | later | |
| Bootstrap from recorder history | Y | Y | ? | ? | ? | v1 | v1 | Learn from past weeks on day one |
| Kalman / virtual temperature | P | Y | ? | ? | ? | later | later | |
| State sanitising | ? | Y | ? | ? | ? | v1 | v1 | |
| Dead-zone (minimum effective opening) learning | N | Y | ? | Y | ? | v1 | P | TRVZB valve curve is non-linear |
| Valve characteristic learning | N | N | ? | Y | ? | later | later | Danfoss adaptation run |

## E. Disturbances and other heat sources

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Manual learning pause | P | Y | ? | ? | ? | v1 | v1 | |
| ★ Automatic detection of external heat (fire, range cooker) | N | N | ? | ? | ? | v1 | v1 | Rise with valve closed, residual against model |
| ★ Range cooker as a continuous learned heat input | N | N | ? | ? | ? | v1 | v1 | Aga runs all day; it shifts the room baseline |
| ★ Hot-water priority pause (store recovery) | N | N | ? | ? | ? | v1 | v1 | Heatslave diverts all output to the store |
| Window sensor | Y | Y | ? | Y | ? | v1 | defer | |
| Window slope detection | Y | N | ? | Y | ? | later | defer | |
| Learning pause on open window | Y | Y | ? | ? | ? | v1 | v1 | |
| Solar gain | N | Y | ? | ? | ? | later | later | |
| Rise at 0 % opening as heat-source hint | Y | N | ? | ? | ? | v1 | v1 | VTherm "cooling failure" |
| ★ Humidity spike (shower) as a disturbance flag | N | N | ? | ? | ? | v1 | v1 | Both projects show humidity only |

## F. Boiler and hot water

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Demand aggregation to boiler call | Y | N | Y | Y | Y | v1 | v1 | Companion disables VTherm's boiler |
| Weighted demand (by learned output) | P | N | ? | ? | ? | v1 | v1 | |
| Minimum burn time | N | N | ? | ? | ? | v1 | v1 | Resideo oil default 4 min; Radiate default 8 min |
| Minimum off time | N | N | ? | ? | ? | v1 | v1 | |
| Maximum starts per hour | N | N | ? | ? | ? | v1 | v1 | Resideo oil: 3 per hour |
| ★ Demand pooling (batch room calls into longer burns) | N | N | ? | ? | ? | v1 | P | |
| Activation delay (let valves open first) | Y | N | ? | ? | ? | v1 | v1 | |
| ★ Open-path guarantee before firing | N | N | ? | ? | ? | v1 | v1 | Stairs bypass plus minimum total opening |
| Heat-available signal to rooms | N | N | ? | Y | ? | v1 | v1 | Danfoss `heat_available` pattern |
| Dead-man fallback (relay auto-off) | P | N | ? | ? | ? | v1 | v1 | Shelly auto-off timer plus heartbeat |
| Hot-water store schedule (channel 2) | N | N | ? | ? | ? | v1 | v1 | |
| Hot-water boost | N | N | ? | ? | ? | v1 | v1 | |
| ★ Oil usage and burner-hours estimate | N | N | – | – | – | v1 | v1 | Burner hours times nozzle rating |
| Short-cycle detection and alert | N | N | ? | ? | ? | v1 | v1 | |
| Pump overrun | N | N | ? | ? | ? | skip | skip | Internal to the Heatslave |
| Flow temperature / OpenTherm | P | N | ? | ? | ? | skip | skip | README non-goal |
| Weather compensation | N | N | ? | ? | ? | skip | skip | On/off boiler; weather feeds optimum start instead |

## G. Safety and failure

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Sensor timeout fallback | Y | Y | ? | Y | ? | v1 | defer | |
| Fail-soft ladder | N | Y | ? | ? | ? | v1 | P | |
| Command safety clamp | ? | Y | ? | ? | ? | v1 | v1 | |
| Stuck-valve detection | Y | N | ? | ? | ? | v1 | defer | |
| Heating failure (no rise) | Y | N | ? | ? | ? | v1 | defer | Also catches out-of-oil or burner lockout |
| HA down: TRVs revert to safe local control | – | – | – | – | – | v1 | P | Keep TRV setpoints sane at all times |
| HA down: boiler fails safe | N | N | ? | ? | ? | v1 | v1 | |
| Battery and availability alerts | P | Y | Y | Y | Y | v1 | defer | HA repairs |

## H. Observability

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Entities for learned parameters | Y | Y | ? | ? | ? | v1 | v1 | |
| Diagnostics download | Y | Y | – | – | – | v1 | v1 | |
| Decision log / flight recorder | N | Y | ? | ? | ? | v1 | v1 | |
| Events | Y | Y | – | – | – | v1 | v1 | |
| Pure, replayable decision core | N | Y | – | – | – | v1 | v1 | |
| ★ Elastic metrics export | N | N | N | N | N | v1 | v1 | ECS-shaped documents |
| ★ Thermal simulator for testing | N | N | – | – | – | v1 | v1 | |
| ★ House balancing dashboard card | N | N | ? | ? | ? | v1 | v1 | |
| LLM / MCP tools | Y | N | – | – | – | later | defer | |

## I. Setup and UX

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Config flow | Y | Y | – | – | – | v1 | v1 | |
| Options / reconfigure flow | Y | Y | – | – | – | v1 | v1 | |
| ★ Discovery of TRVs and sensors by HA area | N | N | Y | Y | Y | v1 | P | One house entry, rooms from areas |
| Shared house-level parameters | Y | N | Y | Y | Y | v1 | v1 | |
| Services | Y | Y | – | – | – | v1 | v1 | |
| Blueprints | N | Y | – | – | – | later | later | |

## J. Commercial terms

| Feature | VTherm | BT | tado X | Danfoss | HmIP | Radiate standalone | Radiate companion | Notes |
|---|---|---|---|---|---|---|---|---|
| Subscription required | N | N | Y | N | N | skip | skip | Never |
| Cloud required | N | N | Y | P | P | skip | skip | Local only |
| Every radiator must be smart | – | – | Y | ? | ? | skip | skip | Unvalved bypass supported |
| Third-party certification | N | N | Y | Y | Y | skip | skip | README non-goal |

## Summary

| Stance | Standalone | Companion |
|---|---|---|
| v1 | 82 | 47 |
| v1, partial only | 0 | 8 |
| later | 19 | 12 |
| defer | 3 | 38 |
| skip | 11 | 9 |
| blocked | 0 | 1 |
| **Total** | **115** | **115** |

17 features (★) are offered by none of the products studied. As a companion, Radiate can deliver 12 of them in full; synchronised arrival, demand pooling, valve feedback plausibility and area discovery shrink to partial, and house-level MPC is skipped.
