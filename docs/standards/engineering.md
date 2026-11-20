# Engineering standards

These are the rules for changing Radiate's code. They come from [ADR-0001](../adr/0001-standalone-vs-vtherm-companion.md), [ADR-0002](../adr/0002-deployment-topology.md), the [specification](../spec.md) and the code as it stands. Radiate switches a real oil boiler and real radiator valves, so every change must keep to the [safety rules](#safety-rules).

Use the terms in the [glossary](../GLOSSARY.md). For setup, tests and the pull request checklist, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Architecture

Radiate is one engine packaged three ways (ADR-0002). The control loop always runs locally, and the cloud never sits in it.

| Path | What it holds | Rule |
|---|---|---|
| `src/radiate/core` | House model, learning, allocation, boiler guard, disturbances, persistence | Pure. See [Pure core](#pure-core) |
| `src/radiate/config` | YAML configuration and schedules | Pure parsing; every problem collected and reported together |
| `src/radiate/drivers` | Zigbee2MQTT, MQTT, Shelly, the live driver | Pure mapping plus thin transport |
| `src/radiate/server` | Runtime, HTTP and WebSocket API, demo driver, SQLite state database | The one runtime for every edition |
| `src/radiate/export` | Elastic export | Never blocks the control loop |
| `src/radiate/sim` | Thermal simulator of the reference house | Drives the same `decide` as live |
| `app/radiate` | Home Assistant App packaging | `run.py` uses the standard library only |
| `web` | Web UI | See [design standards](design.md) |
| `shelly` | Relay watchdog script | Runs on the Shelly itself |

Radiate is a standalone house controller (ADR-0001). It owns room control, valve driving, the boiler and the store. Versatile Thermostat and Better Thermostat are prior art, not dependencies, and Radiate has no adapters for them.

Every control and balancing feature belongs in every edition. The cloud edition adds hosting conveniences, never control features.

## Pure core

`radiate.core` has no I/O, no clock, no randomness and no Home Assistant imports. It uses the Python standard library only, with no numpy, so it runs on a Raspberry Pi, in the App and on the cloud edge.

- The control step is `decide(config, snapshot, state) -> actions`. Given the same configuration, state and snapshots, it returns the same actions, so any day can be replayed.
- Time comes in through the snapshot: `Snapshot.now` (monotonic seconds) and `Snapshot.minute_of_day` (local time).
- Configuration types are frozen dataclasses with `slots=True`. State types are mutable dataclasses with `slots=True`, owned by the caller.
- Every decision that a person might ask about carries a `Reason`. Codes are dotted, area first: `boiler.lead`, `disturbance.fire`, `learning.paused`. Messages start with the room name and read as UI text. Reason codes reach the decision log and Elastic's `event.action`, so treat a rename as an API change.
- Persistence is pure as well. `dump_state` and `load_state` turn engine state into plain data. Bump `persist.VERSION` when the saved shape changes. Invalid saved data resets that room to its priors and reports a problem; it never stops the server.

## Drivers

A driver translates between devices and the core's `Snapshot` and `Actions`. Each one is split in two:

- **Mapping**: pure functions and classes that take raw payloads and a monotonic `now`, and return readings or payloads to send. `radiate.drivers.z2m` (`DeviceStore`, `TrvWriter`) and the helpers at the top of `radiate.drivers.shelly` are the pattern. Test these directly, without a network.
- **Transport**: a thin class that connects, subscribes or calls, retries with backoff and hands messages to the mapping. `MqttTransport` and `ShellyRpc` are the pattern. Keep logic out of them.

The runtime talks to devices only through the `Driver` protocol in `radiate.server.runtime` (`snapshot`, `apply`, `clock`, `wall_minutes`, `telemetry`, and optionally `alerts`).

When you add device support:

- Take attribute names and value ranges from the public converter or API documentation, and cite the source and commit in the module docstring, as `z2m.py` does.
- Never trust that a write landed. Compare what the device reports with what was sent, and let the reconciler resend and alert.
- Respect dry run at the point of writing, and record the intended write instead. Reads are always allowed. The one exception is `radiate shelly install-watchdog`, which writes because the user asked with `--yes`.

## Home Assistant integration

The integration lives in [radiate-ha](https://github.com/jamesagarside/radiate-ha), under Apache-2.0 (see [ADR-0003](../adr/0003-separate-home-assistant-integration.md)). It follows Home Assistant conventions and its own repository's notes.

If a feature needs logic, put it in the server or the core and expose it through the API, then call it from the integration. Keep the server routes in `radiate.server.app`, spec section 8.1 and radiate-ha's `api.py` in step.

`tests/server/test_ha_contract.py` checks that `/api/v1/house` and `/api/v1/state` still return every field in `tests/server/fixtures/ha`, the responses radiate-ha is tested with. Adding a field is fine. To drop or rename one, change radiate-ha first, then regenerate the fixtures in both repositories with `scripts/ha_fixtures.py`.

## Time

- **Timers and ages use the monotonic clock.** Use `Driver.clock()` in the server and `Snapshot.now` in the core. Never measure a duration with wall time: clock changes and daylight saving would break the boiler guards.
- **Schedules use local wall time.** Convert with `ZoneInfo(house.timezone)` in the driver and pass the core a minute of day and weekday.
- **Persist ages, not timestamps.** The monotonic clock restarts with the process. `persist.py` stores `now - t`, and on load subtracts the downtime measured with `time.time()`. A restart in the middle of a burn still honours minimum burn.

## Units and naming

- Metric units. Put the unit in the identifier: `_s` for seconds, `_min` for minutes, `_h` for hours, `_c` for an absolute temperature in °C, `_k` for a temperature difference, `_kph` for K/h, `_kw` for kilowatts.
- Code works in seconds. The configuration file uses minutes where people set them (`min_burn_min`) and the parser converts.
- Openings are integer percentages, 0 to 100, matching the TRVZB.
- Name things with the glossary terms. Docs use the spec's symbols (`a`, `b`, `d`, `S`, `T*`, `L_r`).
- Python follows ruff: line length 100, target Python 3.12, rules `E`, `F`, `I`, `B`, `UP` and `SIM`. Start modules with `from __future__ import annotations` and type every public function.

## Safety rules

Radiate controls an on/off oil burner. A short burn soots and condenses; a burner firing into closed valves overheats; a house with no heat in winter can freeze pipes.

- **Only the boiler guard switches the heating relay.** `BoilerGuard` enforces minimum burn, minimum off and starts per hour. Demand logic asks; the guard decides. Even a forced stop (safe mode) honours minimum burn.
- **Keep the guard defaults and ranges.** Minimum burn 8 minutes (4 to 20), minimum off 10 minutes (5 to 30), at most 3 starts an hour (1 to 6). Changing them needs a spec change with a reason.
- **Fail safe.** Every way Radiate can stop must leave the house heated: governed mode instead of pinned valve positions, the schedule mirror, the Shelly watchdog and the relay auto-off. A change that weakens any of these needs an ADR.
- **Write discipline applies to every valve write.** New valve settings go through `_discipline` in the core and `TrvWriter` in the driver.
- **Dry run is the default.** A new configuration starts in dry run. Any new write path must honour it.
- **Keep the one-valve rollout.** Without `actuate` keys, only the pilot valve is actuated.
- **Ask before touching a real boiler.** Contributors and agents do not run `radiate serve --config` with dry run off, run `radiate shelly install-watchdog --yes`, or change relay wiring against real hardware without the owner's explicit agreement. Wiring at the boiler is for a qualified OFTEC engineer.
- **The simulator guards stay green.** `tests/sim/test_reference_house.py::test_guards_never_violated` must pass on every change.

## Testing

- Write the test first. For core behaviour, start with a failing test in `tests/core`, then make it pass.
- Mirror the source layout: `tests/core`, `tests/config`, `tests/drivers`, `tests/server` and `tests/sim`.
- Use fakes for devices. Feed raw Zigbee2MQTT payloads to the mapping, and use `tests/drivers/fake_shelly.py` for the relay. Tests never open a real network connection.
- Use the simulator as a regression check. `tests/sim` asserts the guards, comfort, burn length and fire learning on the reference house. When you change the core, run it and compare `radiate sim --days 5` before and after. If the headline numbers move, update [docs/simulation.md](../simulation.md).
- Run the Home Assistant tests in their own environment. They need `pytest-homeassistant-custom-component`, which pins its own Home Assistant version. See [CONTRIBUTING.md](../../CONTRIBUTING.md).
- Async tests use `pytest-asyncio` in auto mode; write `async def test_...` with no decorator.

## Licensing and clean-room rules

Radiate is licensed under the [Elastic License 2.0](../../LICENSE). Every contribution is made under it.

- Better Thermostat is AGPL-3.0, which is incompatible with ELv2. Never copy its code or closely paraphrase its structure. Work from the behavioural descriptions in [docs/research/better-thermostat.md](../research/better-thermostat.md).
- Versatile Thermostat is MIT-licensed. Prefer reimplementation. If you port any code, keep its copyright notice and list it in a `NOTICE` file.
- Closed products are studied only through public material and the behaviour of devices we own. Follow the [reverse-engineering and clean-room policy](../research/reverse-engineering-policy.md).
- Patents: the allocator equalises predicted arrival times across the house from a model. Keep it a joint solve. A per-radiator rule that throttles whichever radiator heats fastest is closer to the patented mechanisms. Before implementing a mechanism that resembles a listed patent, note it in [docs/research/provenance.md](../research/provenance.md).
- No personal details: no house name, location, real IP address or real device name in code, tests, fixtures, docs or commit messages. Use documentation addresses such as `192.0.2.10` and generic device names. Exports carry only the random house ID.

## Branches and commits

- Work on a feature branch (`feature/<topic>`) and open a pull request into `main`. Never commit to `main`.
- Write commit subjects in the imperative and sentence case, saying what changed: "Add Shelly Gen4 boiler driver and watchdog installer". Add a body when the reason is not obvious.
- Do not add `Co-Authored-By` or any other attribution lines.
- Keep commits small and focused. Run `ruff format` before committing.

## Writing

UK English, metric units, and no em or en dashes as punctuation, in code comments, docs, UI text and commit messages alike. Docs follow the Google developer documentation style. UI copy follows the [design standards](design.md#copy).
