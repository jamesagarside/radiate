# Radiate: notes for Claude

## What this is

A Home Assistant custom integration (HACS) for local, subscription-free whole-house hydronic balancing and boiler orchestration. See README.md and docs/research/.

## Owner preferences

- UK English, metric units, no em dashes.
- Concise, direct communication.
- Python is the language. Follow Home Assistant integration conventions (config flow, async, `custom_components/radiate`).

## Reference install (first real-world target)

Do not publish personal details (house name, location) in this repo.

- Oil combi boiler, on/off only (Worcester Heatslave 12/14, older non-condensing, internal hot-water store kept hot by the boiler).
- Shelly 2PM Gen4 at the boiler: channel 1 = central heating demand, channel 2 = hot-water store schedule. To be wired by an OFTEC engineer.
- 9 radiators. 8 have Sonoff TRVZB valves (Zigbee2MQTT). The stairs radiator has a manual valve left slightly open and acts as the system's open path/bypass; Radiate cannot control it.
- 8 Sonoff SNZB-02B temperature/humidity sensors: three bedrooms, bathroom, dining room, lounge, kitchen, stairs. The toilet valve runs on its internal sensor.
- Lounge has an open fire; kitchen has an Aga (range cooker). No back boilers. Learning must pause when these rooms are heated by them.
- SMLIGHT SLZB-06U PoE Zigbee coordinator. Home Assistant on dedicated hardware, not the owner's Kubernetes homelab.
- Owner wants metrics exportable to Elastic.

## Key technical facts

- TRVZB via Z2M exposes writable `valve_opening_degree` / `valve_closing_degree` (fw >= 1.1.4) and `external_temperature_input` (fw >= 1.2.1). External input reverts to internal if not refreshed for about 2 hours. Adaptive PID mode disables opening limits. Reported calibration loss when opening/closing degree is used: test on one valve first.
- Versatile Thermostat already offers TRVZB direct valve regulation, central boiler aggregation and `max_opening_degree`. Prefer building on it over duplicating it; decide this explicitly early.

## Research and reverse engineering

Use the REA skill/MCP server for analysis. Follow docs/research/reverse-engineering-policy.md strictly: open-source code and public docs freely; closed products only via public material and behaviour of devices we own; never bypass subscriptions or copy proprietary code.
