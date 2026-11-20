# ADR-0002: One engine, three ways to run it

- **Status:** Accepted (2026-11-16, owner direction; details proposed by Claude)
- **Date:** 2026-11-16

## Context

The owner wants Radiate available as:

1. a **standalone service with its own UI** (Raspberry Pi, Docker, any small Linux box), for people without Home Assistant;
2. a **Home Assistant App** (Supervisor-managed container, renamed from "add-on" in HA 2026.2);
3. a **cloud version**.

Heating is safety-relevant. An oil burner that short-cycles soots up; a boiler left firing with every valve shut overheats; a house with no heat in January can freeze pipes. Whatever runs the control loop must keep working through Home Assistant restarts, internet outages and cloud incidents.

Two physical facts constrain the cloud version:

- Zigbee radios (TRVZB, SNZB-02B) only talk to a coordinator on the local network. Something local must bridge them (Zigbee2MQTT, ZHA, or similar).
- The Shelly relay that fires the boiler is on the local network.

## Decision

### One engine, one runtime

- **`radiate` core** (pure Python, no I/O, no Home Assistant imports): house model, learning, allocation, boiler guard, disturbance detection. Deterministic and replayable: `decide(snapshot, state) -> (actions, state)`.
- **`radiate` server** (asyncio): runs the core every minute, talks to devices through drivers, serves the web UI and a REST/WebSocket API, persists state in SQLite, exports metrics to Elastic.
- **Drivers:** Zigbee2MQTT over MQTT and Shelly Gen4 (local RPC/MQTT) first, so the control loop does not depend on Home Assistant at all. A Home Assistant driver (WebSocket API) follows for people whose devices live in ZHA or other integrations.

The same server is packaged three ways:

| Edition | Package | Who it's for | UI |
|---|---|---|---|
| Standalone | Docker image and Raspberry Pi image | No Home Assistant | Built-in web UI |
| Home Assistant App | Same image plus App manifest, ingress, MQTT service discovery | Home Assistant OS users | Same web UI in the HA sidebar; entities via the integration below |
| Cloud | Hosted service plus a local **edge** (the standalone server in edge mode) | Remote access, history, multi-home | Hosted web UI |

**Home Assistant integration** (`custom_components/radiate`, HACS; moved to its own Apache-2.0 repository by [ADR-0003](0003-separate-home-assistant-integration.md)): a thin client of the server's API. Config flow finds the server (Supervisor discovery for the App, zeroconf or a URL otherwise) and exposes rooms, valves, boiler and learned parameters as entities, plus services. It contains no control logic. Home Assistant Container and Core users (no Apps) run the standalone image next to HA and install the integration.

### The cloud never sits in the control loop

- The control loop always runs locally: in the App, the standalone box, or the cloud edge.
- The cloud provides account, remote UI, long-term history and analytics (Elastic), notifications, backups of learned state, and heavier offline model fitting that is pushed back as *suggested* parameters the edge validates before use.
- Edge to cloud is an **outbound-only** TLS WebSocket. No inbound ports, no port forwarding.
- If the internet drops, heating carries on unchanged and telemetry is buffered on disk.

**Consequence for "cloud only" users:** they still need a small local box (a Pi or similar) running the edge and Zigbee2MQTT. The cloud replaces the UI and adds remote features; it cannot replace the local radio link. A pre-built "Radiate edge" Pi image (Radiate, Mosquitto and Zigbee2MQTT preconfigured) keeps this to one SD card.

### Feature parity and positioning

- Every control and balancing feature is in all three editions. The cloud adds hosting conveniences, never control features. This keeps the "no subscription needed to heat your house" promise that sets Radiate apart from tado X.
- Licence: ELv2 lets the licensor run the hosted service and stops third parties offering Radiate as a managed service.

## Options considered

| Option | Why not |
|---|---|
| Engine embedded in the HA integration (original plan) | Ties the control loop to HA core restarts and updates; needs a second runtime for the standalone and cloud editions; two code paths to test |
| Cloud runs the control loop, local box is a dumb relay | Internet outage means no heating control; latency and security risk on the Zigbee bridge; unacceptable for a boiler |
| MQTT discovery instead of an HA integration | Works without HACS, but no config flow, services, diagnostics or repairs. Could be added later for HA Container users who refuse HACS |

## Consequences

- Repository becomes a monorepo: `src/radiate` (core, server, drivers, simulator, exporter), `custom_components/radiate` (HA client), `app/` (HA App packaging), `web/` (UI), `docs/`. The HA client later moved to its own repository ([ADR-0003](0003-separate-home-assistant-integration.md)).
- The HA integration and the server share an API contract (versioned, documented in the spec).
- Boiler safety does not rely on Radiate staying up: a Shelly watchdog script reverts to a local schedule if Radiate's heartbeat stops (see spec).
- The cloud service itself is out of scope until the local editions are proven on the reference house. Its API boundary is designed now so the edge protocol does not have to change later.
