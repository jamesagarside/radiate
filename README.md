# Radiate

**Open-source, local-first hydronic balancing and boiler orchestration for Home Assistant.**

Plumbers balance a heating system by hand, turning the lockshield valve on each radiator to throttle the ones nearest the boiler so the far ones get their share of hot water. Radiate does that job in software, continuously, using smart radiator valves you already own.

> **Status:** pre-alpha. Design and research stage. Nothing to install yet.

## Why

Commercial systems now offer automatic ("digital") hydronic balancing, but it is locked behind proprietary hardware and, in some cases, a monthly subscription. The open-source Home Assistant ecosystem already does excellent per-room control (see [prior art](docs/research/prior-art.md)), but nothing yet coordinates radiators **across the whole house** so that flow is shared out fairly when every room calls for heat.

Radiate aims to close that gap without a subscription and without the internet.

## Goals

- **Whole-house balancing.** Learn how quickly each radiator heats up after the boiler fires and cap the maximum opening of over-supplied radiators so under-supplied ones get flow.
- **Local only.** Runs entirely inside Home Assistant. No cloud, no account.
- **Works alongside existing integrations.** Designed to complement per-room controllers such as Versatile Thermostat and Better Thermostat rather than replace them.
- **Other heat sources.** Pause learning for rooms heated by an open fire, range cooker, wood burner or sun, so they aren't mistaken for over-supplied radiators.
- **Boiler-aware.** Aggregate room demand into a single boiler call with minimum burn and minimum off times to prevent short-cycling (important for oil and older non-modulating boilers), and schedule a hot-water store separately.
- **Observable.** Expose learned parameters and decisions as Home Assistant entities, with optional export to external stores for analysis.
- **Safe failure.** If Home Assistant or Radiate stops, valves and boiler fall back to sensible local behaviour.

## Non-goals

- Replacing a per-room PID/TPI controller.
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
- [Reverse-engineering and clean-room policy](docs/research/reverse-engineering-policy.md)

## Licence

[Apache License 2.0](LICENSE)
