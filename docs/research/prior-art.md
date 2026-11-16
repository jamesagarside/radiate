# Prior art and gap analysis

Initial survey, November 2026. To be deepened with source-level analysis of the open-source projects below.

## Open-source (Home Assistant)

| Project | What it does | Relevance to Radiate |
|---|---|---|
| [Versatile Thermostat](https://github.com/jmcollin78/versatile_thermostat) (MIT) | Full per-room thermostat. TPI and PI self-regulation, Auto TPI learning, `over_climate` with direct valve regulation designed for Sonoff TRVZB, central boiler control (activation delay, power threshold, keep-alive), `max_opening_degree` per thermostat, stuck-valve detection, window/presence/motion handling. | **Closest neighbour.** Already does per-room valve regulation and boiler aggregation. Its `max_opening_degree` is a natural actuator for Radiate's balancing caps. Strong candidate to build on rather than duplicate. |
| [Better Thermostat](https://github.com/KartoffelToby/better_thermostat) | Wraps TRVs with external sensors, window logic and calibration. Recent MPC calibration, TPI, PI heating-demand valve control, valve-based calibration, TRVZB-specific support. | Alternative per-room layer. Radiate should support it as well as VTherm if feasible. |
| [rusitschka/valves](https://github.com/rusitschka/valves) | Custom component to control TRV valve positions directly (incl. Shelly TRV). | Small, useful reference for direct valve-position control. |
| [nielsfaber/zoned-heating](https://github.com/nielsfaber/zoned-heating) | Links a main thermostat to TRVs for multi-zone control. | Zone-to-boiler linkage pattern. |
| [asantaga/wiserHomeAssistantPlatform](https://github.com/asantaga/wiserHomeAssistantPlatform) | Local Drayton Wiser integration. | Reference for how a commercial UK system models boiler demand and TRVs. |
| Advanced Heating Control (blueprint) | Scheduling blueprint for TRVs. | Scheduling UX reference. |
| [VB-Builds/hydronic-deltat-diagnostics](https://github.com/VB-Builds/hydronic-deltat-diagnostics) | Delta-T diagnostics on flow/temperature logs. | Diagnostic ideas; assumes flow/return sensors we won't have. |

**Gap:** none of these performs whole-system balancing, i.e. learning relative flow per radiator and limiting fast radiators so slow ones are served when demand is simultaneous.

## Commercial

| Product | Approach (from public material) | Notes |
|---|---|---|
| **tado X Hydronic Balancing** | Software balancing using tado X radiator thermostats. Requires a tado X on every heated radiator and the paid AI Assist subscription. After enabling, the help centre suggests users may be able to lower pump speed. TÜV Rheinland certificate (HydroBalance 2.03) assesses it as at least equivalent to conventional balancing (BAFA/KfW checklist, DIN EN 12831, GEG §60c with DIN 94679-4). | Public docs do not describe the algorithm or which signals it uses. Valve behaviour is opaque. |
| **Homematic IP** (eTRV-2, eTRV-C, eTRV-C-2, eTRV-Evo) | Fraunhofer IEE confirmed the thermostats perform dynamic, adaptive balancing at the radiator by continuously measuring and regulating room temperature. No subscription. | German market. |
| **Danfoss Ally / Eco** | "Auto-balancing": room temperature is the central control variable; the system detects the mass flows at which target temperature is reached and adjusts flow, continuously. Suited to up to ~20 radiators. Ally's public Zigbee feature catalogue documents valve adaptation runs, `PIHeatingDemand` and a "load on this radiator" attribute used for load balancing. TÜV-certified. | The published Zigbee cluster documentation is a legitimate interoperability reference. |
| **blossom-ic** | Self-learning digital balancing via gateway; continuously checks whether room heat load (setpoint and outdoor temperature dependent) matches delivered heat. | Useful conceptual model: compare required vs delivered heat per room. |
| **KALO** | Smart thermostats certified to DIN 94679-4 for multi-occupancy buildings. | Commercial/landlord focus. |

## Standards and literature

- **DIN 94679-4:2023-03**, *Temperature-based alternatives to hydronic balancing*. Defines temperature-based balancing procedures and their requirements. Paywalled; the public table of contents and summaries describe one-off and continuous temperature-based procedures. Worth obtaining.
- **BAFA/BEG checklist** for equivalence with "Verfahren B": requires thermal comfort without over-supply for all rooms, plus heating-curve and controller settings.
- **Tunzi et al., *Energies* 2022**: electronic radiator thermostat with return-temperature limiting for automated balancing (needs a return-temperature sensor per radiator).
- **Patents**: Computime US10697650B2 (balance valve controller using inlet/outlet delta-T), Honeywell US8109289 (decentralised balancing of hydronic networks). Read for ideas; check claims before implementing similar mechanisms.

## Design implications

1. Our only per-radiator thermal signals are the TRV's internal temperature (near the radiator) and the room sensor. Radiator warm-up lag after boiler start is the best available proxy for relative flow.
2. Room heat-up rate per unit valve opening, normalised by setpoint-to-ambient gap, approximates delivered vs required heat (the blossom-ic / Danfoss framing).
3. Actuate via `max_opening_degree` in VTherm or `valve_opening_degree` on the TRV directly.
4. Learning must exclude periods when a room has another heat source, and the unvalved bypass radiator.
5. Sonoff TRVZB notes: external temperature input falls back to internal if not updated for ~2 hours; adaptive PID mode disables manual opening limits; one report of valve calibration loss when opening/closing degree is used.
