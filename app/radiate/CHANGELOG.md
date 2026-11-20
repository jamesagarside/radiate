# Changelog

## 0.1.0

The first release. Radiate is pre-alpha: everything below is tested against a simulated house, and the device drivers haven't run on real hardware yet. A new configuration starts in dry run, which reads devices and writes nothing.

### Control

- Balances radiators by limiting how far each smart valve opens, so rooms near the boiler don't take all the hot water.
- Learns how each room heats and cools, and how long hot water takes to reach each radiator.
- Calls the boiler only when rooms need heat, with a minimum burn and rest time to stop short cycling.
- Keeps the hot-water store to its own schedule.
- Two demand modes: Eco (the default) and Comfort, which you can change while Radiate runs.
- Pauses learning in a room while an open fire or range cooker heats it.
- Safe mode: if sensors or the broker go quiet, Radiate hands the boiler to the Shelly watchdog.

### Setup

- A setup wizard in the web UI for your household: who lives there, which rooms they use, and when. Radiate builds the heating schedules from your answers.
- Link each person to a Home Assistant `person` entity, so Radiate knows when they're away.
- Drag the edge of a warm period in the week view to adjust one room without changing the routine.
- `radiate discover` drafts your configuration from the devices Zigbee2MQTT knows.

### Watching and checking

- A web UI with each room's temperature, target and valve, and why Radiate made each decision.
- Every tick is recorded. `radiate replay` shows what Radiate would have done during a dry run, and `radiate bootstrap` relearns room models from that history.
- Oil and runtime estimates, stuck and leaking valve alerts, and boiler lockout detection.
- Optional metrics export to Elastic.

### Home Assistant

- Runs as a Home Assistant App, with the web UI in the sidebar.
- Install the [radiate-ha](https://github.com/jamesagarside/radiate-ha) integration from HACS for climate entities, sensors and services. It needs radiate-ha 0.2.0 or later for the household and away features.
