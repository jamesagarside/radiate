# Radiate app

Runs the Radiate server inside Home Assistant OS. The control loop keeps running while Home Assistant core restarts or updates.

1. Install the app and start it. Open **Radiate** in the sidebar.
2. Home Assistant offers to add the **Radiate** integration (found automatically). Accept it to get room climate entities, sensors and services.
3. Optional: set an Elastic URL and API key to export metrics.

**Pre-alpha:** only demo mode (a simulated house) is available. Zigbee2MQTT and Shelly drivers are next; see `docs/spec.md`.
