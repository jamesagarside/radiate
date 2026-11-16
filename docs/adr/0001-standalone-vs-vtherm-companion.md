# ADR-0001: Standalone house controller, not a Versatile Thermostat companion

- **Status:** Accepted (2026-11-16, owner)
- **Date:** 2026-11-16
- **Deciders:** project owner
- **Evidence:** [coverage matrix](../research/coverage-matrix.md), [VTherm analysis](../research/vtherm.md), [Better Thermostat analysis](../research/better-thermostat.md), [commercial survey](../research/commercial.md)

## Context

CLAUDE.md asks us to prefer building on Versatile Thermostat (VTherm) and to decide this early. The plan was for Radiate to learn per-radiator caps and push them into VTherm's `max_opening_degree`.

Source analysis of VTherm at commit `35f46e5` found:

1. **No runtime cap.** `max_opening_degrees` is read once from the config entry (`thermostat_valve.py:186`). There is no entity, service or attribute setter. Changing it means rewriting the config entry, which reloads that thermostat and resets its runtime state.
2. **No boiler protection.** The central boiler has an activation delay and keep-alive, but no minimum burn, minimum off or starts-per-hour limit, and OFF is immediate. On a non-condensing oil burner that risks sooting and condensation in the flue.
3. **No hot water, no external heat.** No DHW channel, no store-priority awareness, no learning pause for an open fire or range cooker.
4. **TRVZB gaps.** External temperature is sent only on change, so the TRVZB's 2 hour revert to its internal sensor is not handled; valve activity is the command echo, not feedback.
5. **A real plugin API exists** (`vtherm_api` 0.9.0): notify-only hooks, replaceable proportional algorithms, and "inhibition" to take over a thermostat's devices.

Better Thermostat (AGPL-3.0) has a runtime-writable per-TRV `valve_max_opening` number entity but no boiler control at all. No commercial product exposes a cap to third parties.

There is also a control-theory problem. VTherm's Auto-TPI continuously learns each room's gain (Kint). If Radiate moves the valve cap, Auto-TPI sees the plant gain change and re-learns, which changes the demand Radiate is learning from. Two adaptive loops on the same actuator, each treating the other as a disturbance, converge slowly at best and oscillate at worst.

## Options

### A. Companion to VTherm

Radiate learns caps and boiler policy; VTherm stays the room controller and valve driver.

- **Pros:** reuses a mature, popular room controller; smaller Radiate codebase; VTherm users adopt Radiate without migrating; per-room features (presence, window actions, presets, LLM tools) come free.
- **Cons:** cap actuation needs either a config rewrite plus reload each time a cap changes, or an upstream PR adding a runtime setter (not in our control or timeline); nested adaptive loops as above; Radiate must still disable VTherm's boiler and build its own, so the oil-safety work is the same; two integrations to configure per room; release coupling to VTherm's fast-moving code (version 10.6.6, frequent changes); synchronised arrival, demand pooling and house-level control are only partly possible because Radiate does not own the room loop. Coverage matrix: 47 features in full for v1, 8 partial, 1 blocked.

### B. Standalone house controller (recommended)

Radiate owns the house model, room control, valve driving, boiler and hot water as one system.

- **Pros:** one coherent model: rooms, radiators, boiler and store optimised together, which is what makes synchronised arrival and demand pooling possible; no nested adaptation; owns TRVZB quirks (keepalive, close bump, calibration care); single config flow with rooms discovered from HA areas; no upstream dependency; full freedom to design for an on/off oil combi. Coverage matrix: 82 features in v1, including all 17 that no studied product offers.
- **Cons:** larger scope; Radiate must reach parity on basic room control quickly or users lose comfort; overlaps VTherm and Better Thermostat for people who use them today; more hardware quirks to own over time.

### C. Hybrid: standalone core with pluggable room backends from day one

Same as B, but v1 also ships VTherm and Better Thermostat adapters.

- **Pros:** widest audience at launch.
- **Cons:** triples the test matrix before the core algorithm is proven; the VTherm adapter is still blocked on a runtime cap.

## Decision

**Option B: standalone.** Radiate owns the house model, room control, valve driving, boiler and hot water as one system.

No VTherm or Better Thermostat adapters are planned. People without Home Assistant use the standalone service or the cloud version instead (see [ADR-0002](0002-deployment-topology.md)), so a "bring your own room controller" mode adds test burden without widening the audience much. Room actuation still sits behind a `RoomActuator` interface, so this can be revisited cheaply.

## Consequences

- CLAUDE.md's "prefer building on VTherm" is superseded. VTherm is prior art, not a dependency.
- The spec must cover a room controller (model-based with PI fallback), not just balancing.
- MIT-licensed VTherm code may be consulted and, if ported, keeps its notice. Better Thermostat is AGPL: behaviour only.
- The owner's reference house uses Radiate alone. Do not run VTherm or BT on the same TRVs at the same time: two writers to one valve fight.
- **Patent caution:** a learned cap on faster-heating radiators resembles EP1936290 (status unverified). Radiate's allocator is designed around joint arrival-time equalisation from a house model, not a "throttle the fast heater" rule, and expired DE4221725 is the public prior art. A freedom-to-operate check is still advised before promoting this in DE/EU. Not legal advice.

## Revisit if

- VTherm adds a runtime cap and a learning-freeze hook, and users ask for it.
- Radiate's room control proves materially worse than VTherm in the simulator or in the reference house after one heating season.
