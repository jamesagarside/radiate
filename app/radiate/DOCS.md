# Radiate app

Runs the Radiate server inside Home Assistant OS. The control loop keeps running while Home Assistant core restarts or updates.

1. Install the app and start it. Open **Radiate** in the sidebar. It starts in demo mode, driving a simulated house.
2. For room climate entities, sensors and services, install the Radiate integration from HACS (custom repository `https://github.com/jamesagarside/radiate`, type Integration). Home Assistant then finds the app and offers to add the integration.
3. Optional: set an Elastic URL and API key to export metrics.

To run your own house, turn off **Demo mode** and put a configuration file in the App's config folder. Radiate uses the Mosquitto broker that Home Assistant provides. See `docs/deployment.md` and `docs/configuration.md` in the repository.

**Pre-alpha:** the device drivers are untested on real hardware. A new configuration runs in dry run, which reads devices and writes nothing, until you change it.
