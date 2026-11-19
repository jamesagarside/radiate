# Configuration

Radiate reads one YAML file that describes your house: rooms, the Zigbee2MQTT devices in each room, heating schedules, the boiler relay, and the hot-water store. Start from [`examples/reference-house.yaml`](../examples/reference-house.yaml) and change the device names to match yours.

To check a file without touching any device:

```bash
radiate check-config radiate.yaml
```

The command lists every room with its devices, marks the valves Radiate will actuate, and prints any notes. If the file has problems, it lists all of them with their location, for example `rooms[2].trv: required for a normal room`.

## Bring Radiate in gradually

Radiate writes to radiator valves and switches an oil boiler, so it starts cautiously.

1. Leave `house.dry_run` at its default, `true`, for the first few days. Radiate reads every device and makes every decision, but sends no valve settings, relay commands or heartbeat. It logs each write it would have made and shows the latest ones in the web UI telemetry, so you can check its decisions.
2. Start with one valve. Unless a room sets `actuate`, Radiate only actuates the first room with a TRV (the pilot valve). Calibration loss has been reported on the TRVZB when its opening degree is changed, so watch this valve for a week before adding more.
3. Before you set `dry_run: false`, install the Shelly watchdog script so the boiler falls back to a local schedule if Radiate stops:

   ```bash
   radiate shelly install-watchdog --config radiate.yaml --yes
   radiate shelly status --config radiate.yaml
   ```

4. Set `house.dry_run: false` to let Radiate control the house. To force a dry run without editing the file, start the server with `radiate serve --config radiate.yaml --dry-run`.
5. To add valves, set `actuate: true` on each room. Once any room sets `actuate`, only rooms with `actuate: true` are actuated.

## Running the server

```bash
radiate serve --config radiate.yaml
```

The server waits up to 40 seconds for MQTT and the first TRV readings, then runs the control loop every minute. The web UI and API are on port 8099. State is kept in `radiate.db` in `house.data_dir`:

- Learned room models, arrival lags, lockshield caps, and the boiler guard. A restart in the middle of a burn still honours the minimum burn time.
- The house ID used in Elastic exports, so it stays the same across restarts.
- The heating mode (`auto`, `off`, or `frost`).
- The Elastic export queue, up to 7 days, so an outage or restart loses no metrics.

Setpoint overrides from the UI or API are not saved yet; they clear on restart.

## Secrets

Any string of the form `${NAME}` is replaced with the environment variable `NAME`. If the variable isn't set, `check-config` reports it. Keep passwords out of the file this way:

```yaml
mqtt:
  password: ${RADIATE_MQTT_PASSWORD}
```

## Sections

### house

| Key | Default | Meaning |
|---|---|---|
| `timezone` | `Europe/London` | Time zone for schedules and the store windows |
| `dry_run` | `true` | Read devices, write nothing |
| `outdoor_sensor` | none | Zigbee2MQTT name of an outdoor temperature sensor. Without one, the model assumes 5 °C |
| `data_dir` | `./data` | Folder for `radiate.db` |
| `sensor_max_silence_min` | 60 | How long a battery sensor's last reading stands between reports before it counts as stale |

### mqtt

`host`, `port` (1883), `username`, `password`, `base_topic` (`zigbee2mqtt`), `client_id` (`radiate`), `tls` (`false`). Required when any room uses Zigbee2MQTT devices.

### shelly

| Key | Default | Meaning |
|---|---|---|
| `host` | required | IP address or host name of the Shelly 2PM Gen4 |
| `password` | none | Device password, if authentication is on (user `admin`) |
| `heating_switch` | 0 | Switch ID for central heating demand (channel 1) |
| `store_switch` | 1 | Switch ID for the hot-water store (channel 2) |
| `auto_off_min` | 120 | The heating relay turns itself off this long after Radiate last asserted it |

The watchdog script assumes switch 0 is heating and switch 1 is the store. Keep the defaults unless you also edit the script.

### boiler

`min_burn_min` (8), `min_off_min` (10), `max_starts_per_hour` (3), `valve_lead_s` (90), `comfort_limit_k` (0.5), `frost_c` (7), `output_kw` (13), `nozzle_lph` (none). Ranges are checked against spec section 5.1.

### store

`windows` (list of `HH:MM-HH:MM`, at most four), `recovery_min` (25), `priority_over_heating` (`true`).

### trv

| Key | Default | Meaning |
|---|---|---|
| `schedule_mirror` | `true` | Write each room's schedule into its TRVZB and run the valve in `auto` mode, so it follows the schedule if Radiate stops. With `false`, valves run in `heat` mode |
| `external_keepalive_min` | 25 | Resend the room temperature at least this often. The TRVZB reverts to its own sensor after about 2 hours without one |

### schedules

Named weekly schedules in the TRVZB format: up to six transitions a day, each `HH:MM/temperature`, temperatures from 4 to 35 °C in 0.5 °C steps. If a day doesn't start at 00:00, the last setpoint of the day carries over midnight.

Day keys are `mon` to `sun` (or full names), `weekdays`, `weekend`, and `daily`. A single day overrides a group, and a group overrides `daily`.

```yaml
schedules:
  bedrooms:
    weekdays: "06:30/20 08:30/16 17:00/20 22:30/16"
    weekend: "08:00/20 22:30/16"
```

### rooms

| Key | Meaning |
|---|---|
| `id` | Lower case letters, digits, and `_` |
| `name` | Display name |
| `role` | `normal` (TRV and room sensor), `internal_sensor_only` (TRV only), or `passive` (no controllable valve, for example an unvalved bypass radiator) |
| `trv` | Zigbee2MQTT name of the TRVZB |
| `sensor` | Zigbee2MQTT name of the room temperature sensor |
| `window` | Zigbee2MQTT name of a contact sensor. `contact: false` means open |
| `schedule` | Name of a schedule; required for every room except `passive` |
| `heat_source` | `episodic` (open fire, wood burner) or `continuous` (range cooker) |
| `humidity` | `true` to use the sensor's humidity for shower detection |
| `actuate` | `true` to let Radiate write to this room's TRV |
| `trv_bias_k` | Offset from the TRV's internal reading to room temperature, default -1.5 |

## Zigbee2MQTT notes

- TRVZB firmware 1.2.1 or later is needed for `external_temperature_input`, and 1.1.4 or later for the opening and closing degree.
- Radiate subscribes to `zigbee2mqtt/#`, reads device state and availability, and writes to `zigbee2mqtt/<name>/set`. Turn on availability in Zigbee2MQTT so offline valves are reported promptly.
- Battery sensors don't answer read requests. Until each sensor reports after a restart, Radiate uses the TRV's internal reading. To avoid that gap, set `retain: true` for the room sensors in Zigbee2MQTT.
- The TRVZB runs its weekly schedule on the clock it receives from Zigbee2MQTT, which uses the Zigbee2MQTT host's local time. Make sure that host's time zone matches `house.timezone`.
- Radiate keeps each TRVZB in governed mode: `smart_temperature_control` off, `valve_closing_degree` 100, the room temperature as the external input, and Radiate's setpoint and opening limit. If the valve reports a different value for a setting for more than 5 minutes (2 minutes for the setpoint), Radiate sends it again, up to three times, and then raises an alert. A setpoint changed on the valve itself is overwritten in the same way.

## Home Assistant App

In the App options, turn off **Demo mode** and set **Config file** (default `radiate.yaml`). Put the file in the App's config folder (`/addon_configs/<slug>_radiate/` on the host). The App passes the Mosquitto broker details from the Supervisor as `RADIATE_MQTT_HOST`, `RADIATE_MQTT_PORT`, `RADIATE_MQTT_USERNAME`, and `RADIATE_MQTT_PASSWORD`, so the `mqtt` section can use them:

```yaml
mqtt:
  host: ${RADIATE_MQTT_HOST}
  port: ${RADIATE_MQTT_PORT}
  username: ${RADIATE_MQTT_USERNAME}
  password: ${RADIATE_MQTT_PASSWORD}
```

State is kept in the App's `/data` folder, whatever `house.data_dir` says.
