# Radiate: notes for Claude

## What this is

A local-first, subscription-free whole-house hydronic balancing and boiler controller. One engine, three editions: standalone service with web UI, Home Assistant App (plus a thin HACS integration), and a planned cloud version whose control loop still runs on a local edge. See README.md, docs/adr/ and docs/spec.md.

## Owner preferences

- UK English, metric units, no em dashes.
- Concise, direct communication.
- Python is the language. Core engine in `src/radiate/core` is pure (no I/O, no HA imports). Follow Home Assistant conventions in `custom_components/radiate` (config flow, async), which is a thin API client with no control logic.
- Licence is Elastic License 2.0. Never copy AGPL code (Better Thermostat) into the repo.
- UI work follows Emil Kowalski's design-engineering principles (emil-design-eng skill).
- Commits go on a feature branch, with no `Co-Authored-By` or other attribution lines.
- Ask the owner before anything that writes to a real boiler or valve: dry run off, `shelly install-watchdog --yes`, relay wiring.

## Docs to read first

- `docs/GLOSSARY.md`: before naming code or writing docs. Use its terms; it maps each to its code identifier.
- `docs/standards/engineering.md`: before changing `src/`, `custom_components/` or `app/`. Pure core, drivers, time handling, safety rules, testing.
- `docs/standards/design.md`: before changing `web/` or any UI text. Tokens, motion, accessibility, copy.
- `docs/implementation-status.md`: before saying a feature exists, and in the same change as any code that builds one. `docs/spec.md` marks unbuilt parts **Not yet implemented** and owner decisions **Open question**: leave an open question for the owner to settle.
- `docs/deployment.md`: when changing the CLI, Dockerfiles, `app/`, env vars or the watchdog. Keep it accurate.
- `CONTRIBUTING.md`: test, lint and simulator commands, including the separate `.venv-ha` for `tests/ha`.
- `docs/README.md`: index of everything else.

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
- Decided in ADR-0001: Radiate is standalone, not a Versatile Thermostat companion (VTherm's `max_opening_degree` is config-only and its boiler logic has no min burn/off time). VTherm and Better Thermostat are prior art only.
- Decided in ADR-0002: the cloud never sits in the control loop.

## Research and reverse engineering

Use the REA skill/MCP server for analysis. Follow docs/research/reverse-engineering-policy.md strictly: open-source code and public docs freely; closed products only via public material and behaviour of devices we own; never bypass subscriptions or copy proprietary code.
