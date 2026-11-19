# Configuration

Radiate reads one YAML file that describes your house: rooms, the Zigbee2MQTT devices in each room, heating schedules, the boiler relay, and the hot-water store. To draft the file from the devices Zigbee2MQTT already knows, see [Start from your devices](#start-from-your-devices). To write it by hand, start from [`examples/reference-house.yaml`](../examples/reference-house.yaml) and change the device names to match yours.

To check a file without touching any device:

```bash
radiate check-config radiate.yaml
```

The command lists every room with its devices, marks the valves Radiate will actuate, and prints any notes. If the file has problems, it lists all of them with their location, for example `rooms[2].trv: required for a normal room`.

## Start from your devices

`radiate discover` drafts a configuration file from Zigbee2MQTT's device list, so you don't have to type every friendly name. It connects to the MQTT broker, reads the retained `zigbee2mqtt/bridge/devices` and `zigbee2mqtt/bridge/groups` messages, and groups the devices it recognises into rooms. It only reads: it never publishes to the broker and never writes to a device. It uses its own MQTT client ID, `radiate-discover`, so it doesn't disconnect a Radiate server that's already running.

```bash
export RADIATE_MQTT_PASSWORD=change-me
radiate discover --host 192.0.2.20 --username radiate --out radiate.yaml
```

Then check the draft before you use it:

1. Read the warnings at the top of the file, for example a TRVZB on old firmware.
2. Check each room. Add `heat_source` to rooms with an open fire, a wood burner, or a range cooker.
3. Place the devices listed at the end of the file by hand, or delete the list.
4. Run `radiate check-config radiate.yaml`. It needs `RADIATE_MQTT_PASSWORD` set, because the draft refers to it as `${RADIATE_MQTT_PASSWORD}`.

### What it recognises

| Device | Recognised by | Becomes |
|---|---|---|
| TRV | Model `TRVZB`, or any device that exposes `valve_opening_degree` or `external_temperature_input` | The room's `trv`. A TRV other than the Sonoff TRVZB gets a warning: Radiate is written and tested for the TRVZB |
| Temperature sensor | Model `SNZB-02B`, or any device that exposes `temperature` | The room's `sensor`, or `house.outdoor_sensor` if its name contains outdoor, outside, garden, exterior, or external (but not "room", so a garden room stays a room) |
| Contact sensor | Exposes `contact` | The room's `window` |

A thermostat that exposes neither valve feature is left out with a warning, because Radiate can't drive it. Discover skips the coordinator and disabled devices, and lists devices that Zigbee2MQTT doesn't support among the devices Radiate doesn't use.

For each TRVZB, discover reads the firmware version from `software_build_id` and warns if it's older than 1.1.4 (no opening or closing degree), older than 1.2.1 (no `external_temperature_input`) in a room with its own sensor, or if Zigbee2MQTT doesn't report it.

### How it finds rooms

Discover tries these in order for each device:

1. `area: NAME` or `room: NAME` in the device's description in Zigbee2MQTT. `area: Bedroom 1` gives the room `bedroom_1`.
2. The friendly name, with the words that describe the device removed (such as `trv`, `valve`, `radiator`, `temp`, `temperature`, `sensor`, `window`, and the device's model) and any IEEE address. `trv_bedroom_1`, `temp_bedroom_1`, `Bedroom 1 TRV`, `TRV Bedroom 1`, and `bedroom_1/trv` all give `bedroom_1`. In a path such as `upstairs/bathroom/trv`, the deepest part that names a room is used, so the room is `bathroom`. If two devices of the same kind then share a room, discover uses the whole path for every device on that path, so `upstairs/bathroom/trv` and `downstairs/bathroom/trv` become `upstairs_bathroom` and `downstairs_bathroom`.
3. The Zigbee2MQTT group the device belongs to, named the same way. This helps when a device still has its IEEE address as its name. Discover only uses a group with at most one TRV in it, so a group such as `All radiators` doesn't count as a room.

A name that is only a number after the device words are removed, such as `TRV 1`, doesn't give a room. Radiate drives one TRV, one sensor and one window per room, so a second one in the same room is listed for you to place.

### What the draft contains

- One room for each TRV. A room with a TRV and a sensor is `normal`. A room with a TRV and no sensor is `internal_sensor_only`.
- A room for each sensor with no TRV, commented out as a `passive` candidate. Uncomment it only if the room's radiator has no controllable valve, such as a bypass radiator left open. Discover can't tell an unvalved radiator from a room with no radiator.
- `humidity: true` on bathrooms and shower rooms whose sensor reports humidity.
- One `default` schedule for every room, `dry_run: true`, and `actuate: true` on one pilot valve: the first normal room with a TRVZB on current firmware, avoiding bathrooms, whose shower spikes make a poor first test.
- The `mqtt` section from the options you gave, with the password as `${RADIATE_MQTT_PASSWORD}`. Without `--username` or a password, the credentials are commented out.
- The `shelly` section as a comment, to fill in once the relay is wired.
- Comments listing the warnings, the devices discover couldn't place, and the devices Radiate doesn't use.

### Options

| Option | Default | Meaning |
|---|---|---|
| `--host` | `localhost` | MQTT broker |
| `--port` | 1883 | Broker port |
| `--username` | none | Broker user name |
| `--password` | `RADIATE_MQTT_PASSWORD` | Broker password. Prefer the environment variable, which stays out of your shell history |
| `--tls` | off | Connect with TLS |
| `--base-topic` | `zigbee2mqtt` | Zigbee2MQTT's base topic |
| `--timeout` | 10 | Seconds to wait for the device list |
| `--from-file FILE` | | Read a saved `bridge/devices` payload instead of the broker |
| `--groups-file FILE` | | Read a saved `bridge/groups` payload, with `--from-file` |
| `--out FILE` | stdout | Write the draft to `FILE`. Discover never overwrites an existing file unless you add `--force` |

### Work from a saved device list

To run discover on a machine that can't reach the broker, save the retained messages with `mosquitto_sub`. The `-C 1` option exits after the first message, which is the retained one:

```bash
mosquitto_sub -h 192.0.2.20 -u radiate -P "$RADIATE_MQTT_PASSWORD" \
  -t zigbee2mqtt/bridge/devices -C 1 > devices.json
mosquitto_sub -h 192.0.2.20 -u radiate -P "$RADIATE_MQTT_PASSWORD" \
  -t zigbee2mqtt/bridge/groups -C 1 > groups.json
radiate discover --from-file devices.json --groups-file groups.json --out radiate.yaml
```

Unless you also pass `--host`, the draft has `host: localhost`. Change it to your broker's address.

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
- Setpoint overrides from the UI, the API or the Home Assistant climate entity. An override ends at the room's next scheduled setpoint change unless it was set for a duration or until cleared, and one that ends while Radiate is stopped is dropped on restart.
- The tick history: every tick's inputs and decisions for the last `house.history_days` days. See [Tick history and replay](#tick-history-and-replay).

For Docker, the Home Assistant App and the other ways to run the server, see [deployment](deployment.md).

## Tick history and replay

Each minute the live server records the tick's snapshot (every room's readings, setpoints and relay states) and what Radiate decided: valve settings, relays, the boiler state, and the reason and alert codes. Reason messages aren't stored. The server also records how its engine state was built each time it starts, and a copy of the engine state every 6 hours.

The history keeps `house.history_days` days, 14 by default, and Radiate deletes older entries every hour. Each tick takes about 0.7 kB, compressed, so the reference house uses about 1.2 MB a day and 17 MB for 14 days. The demo doesn't record.

`radiate replay` shows what Radiate would have done during a dry run and why, and checks a code or configuration change against real days before you use it. If Radiate starts without usable saved state, it replays the history to learn its room models again. See [replay and bootstrap](deployment.md#replay-and-bootstrap).

In dry run, Radiate only decides valve settings for the rooms it actuates, which is the pilot valve unless rooms set `actuate`. To see every room's valve settings in the history while nothing is written, set `actuate: true` on every room and keep `dry_run: true`.

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
| `history_days` | 14 | Days of tick history kept in `radiate.db`, 0 to 90. Set 0 to turn recording off |

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

`nozzle_lph` is the burner nozzle rating in litres per hour, from the boiler's service sheet. With it, the daily accounting also estimates litres and kWh. Burner time comes from the heating relay, so the litres are an upper bound.

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

### balancing

A top-level key, default `true`. Set `balancing: false` to open every heating valve fully instead of sharing flow between them. The boiler guards, optimum start and learning still run. It exists to compare against balancing, for example in the simulator.

### rooms

| Key | Meaning |
|---|---|
| `id` | Lower case letters, digits, and `_` |
| `name` | Display name |
| `role` | `normal` (TRV and room sensor), `internal_sensor_only` (TRV with no room sensor), or `passive` (no controllable valve, for example an unvalved bypass radiator) |
| `trv` | Zigbee2MQTT name of the TRVZB |
| `sensor` | Zigbee2MQTT name of the room temperature sensor |
| `window` | Zigbee2MQTT name of a contact sensor. `contact: false` means open |
| `schedule` | Name of a schedule. Defaults to `default`, so every room except a `passive` one needs a schedule of that name or its own `schedule` key |
| `heat_source` | `episodic` (open fire, wood burner) or `continuous` (range cooker) |
| `humidity` | `true` to use the sensor's humidity for shower detection |
| `actuate` | `true` to let Radiate write to this room's TRV (`RoomConfig.actuation_enabled` in code). Without any `actuate` keys, only the pilot valve is actuated |
| `trv_bias_k` | Offset from the TRV's internal reading to room temperature, default -1.5. Used in an `internal_sensor_only` room, and in a `normal` room while its sensor is stale |

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
