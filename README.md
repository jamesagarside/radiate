# Radiate

**Source-available, local-first hydronic balancing and boiler orchestration. Runs standalone, as a Home Assistant App, or with the Radiate cloud.**

Plumbers balance a heating system by hand, turning the lockshield valve on each radiator to throttle the ones nearest the boiler so the far ones get their share of hot water. Radiate does that job in software, continuously, using smart radiator valves you already own.

> **Status:** pre-alpha. The control core, simulator, web UI, Home Assistant integration and App are in place and tested against a simulated house. Real device drivers (Zigbee2MQTT, Shelly) are next. Do not connect it to a real boiler yet.

## Try it

![Radiate web UI running the simulated house: lounge fire detected and its radiator closed, boiler on one long burn](docs/images/ui-demo.png)

```bash
uv venv && uv pip install -e ".[dev]"
.venv/bin/radiate serve --demo --speed 60
```

Open http://localhost:8099 to watch a simulated 9-radiator house, 60 times faster than real time. Compare Radiate with plain smart TRVs:

```bash
.venv/bin/radiate sim --days 5
```

Tests: `.venv/bin/pytest` (core, simulator, server). Home Assistant integration tests need the HA harness: `uv pip install pytest-homeassistant-custom-component` in a separate venv, then `pytest tests/ha`.

## Why

Commercial systems now offer automatic ("digital") hydronic balancing, but it is locked behind proprietary hardware and, in some cases, a monthly subscription. The open-source Home Assistant ecosystem already does excellent per-room control (see [prior art](docs/research/prior-art.md)), but nothing yet coordinates radiators **across the whole house** so that flow is shared out fairly when every room calls for heat.

Radiate aims to close that gap without a subscription and without the internet.

## Goals

- **Whole-house balancing.** Learn how quickly each radiator heats up after the boiler fires and cap the maximum opening of over-supplied radiators so under-supplied ones get flow.
- **Local first.** The control loop always runs in your home: on a Raspberry Pi, as a Home Assistant App, or on the cloud edition's local edge. No subscription needed to heat your house; the cloud adds remote access and history, never control features.
- **Whole-house, not per room.** One model of every room, radiator, the boiler and the hot-water store, optimised together, so rooms warm up together and the burner runs fewer, longer burns.
- **Other heat sources.** Pause learning for rooms heated by an open fire, range cooker, wood burner or sun, so they aren't mistaken for over-supplied radiators.
- **Boiler-aware.** Aggregate room demand into a single boiler call with minimum burn and minimum off times to prevent short-cycling (important for oil and older non-modulating boilers), and schedule a hot-water store separately.
- **Observable.** Expose learned parameters and decisions as Home Assistant entities, with optional export to external stores for analysis.
- **Safe failure.** If Home Assistant or Radiate stops, valves and boiler fall back to sensible local behaviour.

## Editions

| Edition | For | UI |
|---|---|---|
| Standalone (Docker, Raspberry Pi) | No Home Assistant | Built-in web UI |
| Home Assistant App | Home Assistant OS | Same UI in the sidebar, plus entities via the HACS integration |
| Cloud | Remote access, history, several homes | Hosted UI; a small local edge still runs the control loop |

See [ADR-0002](docs/adr/0002-deployment-topology.md).

## Non-goals

- Modulating boiler flow temperature (OpenTherm etc.), at least initially.
- Certification under DIN 94679-4 or similar. Radiate is a community tool, not a certified balancing procedure.

## Reference hardware

The first target setup:

- Sonoff TRVZB radiator valves via Zigbee2MQTT (writable `valve_opening_degree`, external temperature input)
- Sonoff SNZB-02B room temperature and humidity sensors
- SMLIGHT SLZB-06U Ethernet Zigbee coordinator
- Shelly 2PM Gen4 two-channel relay switching an on/off oil combi boiler (heating demand plus hot-water store schedule)

Other TRVs that expose a writable valve position should follow.

## Documentation

- [Prior art and gap analysis](docs/research/prior-art.md)
- [Specification](docs/spec.md)
- [Simulation findings](docs/simulation.md)
- [Feature coverage matrix](docs/research/coverage-matrix.md)
- [ADR-0001: standalone, not a VTherm companion](docs/adr/0001-standalone-vs-vtherm-companion.md)
- [ADR-0002: one engine, three editions](docs/adr/0002-deployment-topology.md)
- Source analyses: [Versatile Thermostat](docs/research/vtherm.md), [Better Thermostat](docs/research/better-thermostat.md), [commercial products](docs/research/commercial.md), [provenance](docs/research/provenance.md)
- [Reverse-engineering and clean-room policy](docs/research/reverse-engineering-policy.md)

## Licence

[Elastic License 2.0](LICENSE) (ELv2). Free to use, modify and self-host. You may not offer Radiate as a hosted or managed service, or remove licensing notices. ELv2 is source-available rather than OSI-approved open source.
