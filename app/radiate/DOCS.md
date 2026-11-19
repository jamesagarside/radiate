# Radiate app

Runs the Radiate server inside Home Assistant OS. The control loop keeps running while Home Assistant core restarts or updates.

1. Install the app and start it. Open **Radiate** in the sidebar.
2. Home Assistant offers to add the **Radiate** integration (found automatically). Accept it to get room climate entities, sensors and services.
3. Optional: set an Elastic URL and API key to export metrics.

To run your own house, turn off **Demo mode** and put a configuration file in the App's config folder. Radiate uses the Mosquitto broker that Home Assistant provides. See `docs/configuration.md` in the repository.

**Pre-alpha:** the device drivers are untested on real hardware. A new configuration runs in dry run, which reads devices and writes nothing, until you change it.
