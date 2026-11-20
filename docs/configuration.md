# Configuration

Radiate reads one YAML file that describes your house: rooms, the Zigbee2MQTT devices in each room, heating schedules, the boiler relay, and the hot-water store. Start from [`examples/reference-house.yaml`](../examples/reference-house.yaml) and change the device names to match yours.

To check a file without touching any device:

```bash
radiate check-config radiate.yaml
```

The command lists every room with its devices, marks the valves Radiate will actuate, and prints any notes. If the file has problems, it lists all of them with their location, for example `rooms[2].trv: required for a normal room`.

To see each room's weekly schedule in words, including schedules built from a [household](#household) section:

```bash
radiate schedules radiate.yaml
```

Add `--trvzb` to print, as JSON, the Zigbee2MQTT `/set` payload that the schedule mirror writes to each TRV, keyed by the TRV's friendly name. An internal-sensor room's payload is in the TRV's own frame, so its temperatures are higher than the room's by the TRV bias. Neither form needs the secrets in the file to be set.

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

For Docker, the Home Assistant App and the other ways to run the server, see [deployment](deployment.md).

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
| `data_dir` | `./data` | Folder for `radiate.db`, and for `household.yaml` when you set up the household in the web UI |
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

If a [household](#household) section covers every room, you don't need a `schedules` section.

### household

Instead of writing schedules, you can describe the people in the house and how each room is used. Radiate builds an ordinary weekly schedule for every room listed under `household.rooms`, so the schedule mirror, the web UI and Home Assistant work the same way. A full example is [`examples/household.yaml`](../examples/household.yaml). Its people, times and rooms are an example: replace them with your own.

```yaml
household:
  temperatures:               # house-wide, °C; these are the defaults
    in_use: 19
    occasional: 16
    unused: 14
    night: 14
  people:
    early_riser:
      name: Early riser       # shown in the UI only
      weekdays:
        up: "06:30"
        out: "07:30-18:00"
        bed: "22:30"
      weekend:
        up: "08:30"
        out: "10:00-18:00"
        bed: "22:30"
    home_worker:
      weekdays:
        up: "08:00"
        work: "08:00-18:00"
        bed: "22:30"
  rooms:
    bedroom_1:
      use: in_use
      kind: bedroom
      people: [early_riser, home_worker]
    bedroom_3:
      use: in_use
      kind: office
      people: [home_worker]
    kitchen:
      use: in_use
    lounge:
      use: unused
    toilet:
      use: {weekdays: unused, weekend: occasional}
      kind: all_day
      temperature: 15
```

Put times in quotes. YAML reads an unquoted `22:30` as a number, and Radiate reports it.

`temperatures` sets one temperature for each use level, and the night temperature every room drops to overnight. Values are 4 to 35 °C and are rounded to 0.5 °C. Below 12 °C, `check-config` notes that walls and window frames can get damp. You can still use a lower value.

`people` maps a person ID (lower case letters, digits and `_`) to their routine and, optionally, their own timing:

| Key | Meaning |
|---|---|
| `name` | Display name, shown in the UI only |
| `weekdays` | Required. The routine for days that aren't weekend days |
| `weekend` | The routine for weekend days. Defaults to the weekday routine |
| `getting_up_min` | Replaces `timing.getting_up_min` for this person |
| `bedtime_min` | Replaces `timing.bedtime_min` for this person |
| `weekend_days` | Replaces `household.weekend_days` for this person, for example `[mon, tue]` for someone who works weekends |

Each routine has these keys:

| Key | Meaning |
|---|---|
| `up` | Required. When the person gets up, `HH:MM` |
| `bed` | Required. When they go to bed, after `up` on the same day. `24:00` is allowed |
| `out` | When they're out of the house: one `HH:MM-HH:MM` window or a list of them |
| `work` | When they work from home, in the same form. Link them to an office room |

`out` and `work` windows must fall between `up` and `bed` and must not overlap.

`rooms` maps a room ID from the `rooms` section to how it's used:

| Key | Meaning |
|---|---|
| `use` | Required. The use level: `in_use`, `occasional` or `unused`. For a different level at weekends, write `{weekdays: unused, weekend: occasional}` |
| `kind` | `shared` (the default), `bedroom`, `office`, `while_home` or `all_day`. See [How schedules are built](#how-schedules-are-built) |
| `people` | The person IDs who use the room. Required for a bedroom or an office. Defaults to everyone |
| `temperature` | Replaces the use level's temperature in this room |
| `night_temperature` | Replaces `temperatures.night` in this room, for example a warmer nursery |
| `unused_temperature` | Replaces `temperatures.unused` in this room |
| `preheat_min` | Replaces `timing.preheat_min` in this room, for example a slow room with a small radiator |

A room in `household.rooms` can't also set `schedule` in the `rooms` section. Rooms not listed keep their `schedule`. A passive room has no valve, so it can't be listed.

#### Set up in the web UI

You can set up the household in the web UI instead of writing this section. Without a household, the web UI shows **Set up your household**; with one, **Change household setup** sits beside the People heading. Five short steps ask about the people, their routines, how each room is used and the temperatures, then show the week each room will follow.

The web UI doesn't change the house file, which may be read-only or managed by the Home Assistant App. It saves the household in `household.yaml` in the data directory (`house.data_dir`, or `--data-dir`), in the same form as this section under a `household:` key, so you can paste it into a house file.

When `household.yaml` exists, it replaces the house file's `household` section. The house file's other sections still apply, and a room the saved household leaves out follows its own `schedule`. To go back to the house file's setup, choose **Use the house file's setup instead** in the wizard, or delete the file and restart Radiate.

`check-config` and `radiate schedules` read `household.yaml` from the same data directory as the server, so they agree with it. Give them `--data-dir` when the server runs with one:

```bash
radiate check-config radiate.yaml --data-dir /data
radiate schedules radiate.yaml --data-dir /data
```

`check-config` says which household applies. If the saved household no longer fits the house file, for example because a room was removed, Radiate uses the house file's setup instead, `check-config` notes why, and the wizard shows it.

#### Household settings

Every setting below is optional. The defaults describe one way of living, so change any of them to suit your household. `check-config` reports a value outside its range.

`weekend_days` lists the days that use each person's weekend routine and each room's weekend use level. It's `[sat, sun]` by default. Write days as `mon` to `sun` or in full. An empty list means every day uses the weekday routine. A person can set their own `weekend_days`; rooms always follow the house-wide list.

`timing` sets how routines turn into warm periods. Values are whole minutes.

| Key | Default | Range | Meaning |
|---|---|---|---|
| `preheat_min` | 30 | 0 to 180 | How early each warm period starts in the valve's own copy of the schedule, so the room is warm in time when the valve runs it without Radiate |
| `live_preheat` | `optimum_start` | `optimum_start` or `fixed` | How Radiate itself starts early. `optimum_start`: each warm period starts when the room is needed, and optimum start decides how early to heat from what Radiate has learned. `fixed`: Radiate follows the valve's copy, `preheat_min` early, as well as using optimum start |
| `getting_up_min` | 30 | 0 to 180 | How long a bedroom or shared room counts as in use after someone gets up |
| `bedtime_min` | 30 | 0 to 180 | How long a bedroom counts as in use before someone goes to bed |
| `merge_gap_min` | 30 | 0 to 120 | Warm periods this close together, or closer, join into one |

`away` sets how away and Home Assistant presence work. Values are whole minutes.

| Key | Default | Range | Meaning |
|---|---|---|---|
| `presence_delay_min` | 60 | 0 to 720 | How long Home Assistant must say a person is not home before they count as away |
| `presence_stale_after_min` | 60 | 20 to 1440, or 0 for off | Presence that Home Assistant hasn't reported again within this time counts as unknown, not away |
| `return_warmup_min` | 180 | 0 to 360 | How early Radiate can start warming rooms for someone who is due back. 0 means rooms start warming when they arrive |
| `everyone_away` | `frost` | `frost` or `unused` | What happens when everyone is away. `frost`: every room is held at the frost threshold. `unused`: every household room stays at its unused temperature, for example for pets or a house that gets damp |

`presence_delay_min` used to sit directly under `household`. If your file still has it there, `check-config` tells you to move it to `household.away`.

#### How schedules are built

Radiate works out when each room is in use, day by day:

- A `bedroom` is in use for `getting_up_min` after each of its people gets up, and for `bedtime_min` before they go to bed.
- An `office` is in use during its people's `work` hours.
- A `shared` room is in use while any of its people is up, at home and not working. It's also in use for `getting_up_min` after they get up, even if they then go out or start work.
- A `while_home` room is in use while any of its people is up and at home, working or not. Use it for a kitchen or dining room that should stay warm while someone works from home.
- An `all_day` room is in use from the first of its people getting up until the last goes to bed, whether or not anyone is at home.
- An `unused` room is never in use.

Then:

1. Periods of use `merge_gap_min` or less apart join into one. Radiate measures the gap after starting each period `preheat_min` early.
2. During those periods the room gets its use level's temperature, or its own `temperature`. Outside them it gets the unused temperature between the first person getting up and the last going to bed, and the night temperature overnight.
3. Each room gets two copies of its week:
   - The valve's copy starts each period `preheat_min` early. The schedule mirror writes it to the TRV, and the Shelly fallback uses it, because a valve on its own can't start early by itself. The TRVZB holds six changes a day. If a day needs more, the valve's copy leaves out the shortest warm periods until it fits, and `check-config` and `radiate schedules` say which ones.
   - Radiate's own copy starts each period when the room is needed: "warm by 06:30". Optimum start then decides how early to heat, from the room's learned heating rate and arrival lag, so the fixed preheat isn't added on top. This copy keeps every warm period. With `live_preheat: fixed`, Radiate follows the valve's copy instead.

With the example above, Radiate's copy has the kitchen at 19 °C from 06:30 to 08:30 and from 18:00 to 22:30 on weekdays. The valve's copy has it at 19 °C from 06:00 to 08:30 and from 17:30 to 22:30. Both have it at 14 °C the rest of the time. `radiate schedules` prints the valve's copy of every room.

A room with a range cooker or other steady heat source needs nothing special. Choose its use level and kind like any other room, and set `heat_source: continuous` in the `rooms` section so Radiate learns that heat as part of the room.

#### Away

When a person is away, Radiate rebuilds the household's schedules without their part of the routine. If the home worker travels, their office drops to the unused temperature and the bedroom stays warm for the early riser. Rooms with a hand-written `schedule` don't change. The schedule mirror writes the rebuilt weeks to the TRVs (in dry run, it logs them).

A person counts as away in two ways:

- Away until: someone sets it in the web UI, through the API, or with the Home Assistant service `radiate.set_away`. It counts straight away and clears itself at the given time. You don't need Home Assistant for this.
- Presence: the Home Assistant integration reports a mapped `person` entity as home or not home. Not home counts as away once it has lasted `presence_delay_min`. Home counts at once.

Away until wins over a home that Home Assistant reported before it was set, so you can set it before you leave. If Home Assistant sees the person arrive home after it was set, the away ends early.

`presence_delay_min` is 60 minutes by default. An hour is longer than a trip to the shops or the school run, and shorter than a working day or an evening out. A room cools slowly, so turning it down for a short trip saves little heat and costs an extra boiler start to warm it again. Set it to 0 to count a person as away as soon as they leave.

The integration reports each person's presence again every 15 minutes. If Home Assistant stops reporting, for example because it's down, presence older than `presence_stale_after_min` counts as unknown. An unknown person isn't away, so their rooms follow their routine. The API and the Home Assistant away entity show when presence has gone stale. Set `presence_stale_after_min` to 0 if something reports presence through the API without repeating it.

When everyone is away and the heating mode is `auto`, the house holds every room at the frost threshold, like the `frost` mode, or at its unused temperature with `everyone_away: unused`. It goes back to the schedules as soon as someone is home. The heating mode you chose doesn't change, so `off` and `frost` still apply while everyone is away. Frost protection and the boiler guards work as usual.

#### Coming back

When someone has set an away until, Radiate knows when they're due back. From `return_warmup_min` before that time, Radiate treats the return as the next change in each room's schedule. Optimum start then starts heating each room as early as it needs, so a house that cooled during a long absence starts early, and a house that is still warm after a short one starts late. While everyone is away, rooms stay at frost protection until then, unless optimum start says a room must start heating. The person counts as away until the time they gave.

Until Radiate has learned a room, optimum start can begin as early as `return_warmup_min` allows. A larger value can mean an earlier start for an unlearned room.

With `live_preheat: fixed`, the person stops counting as away `preheat_min` before the time they gave, as the valve's copy expects.

Presence on its own gives no return time. If Home Assistant still says the person is not home at the time they gave, presence keeps them away after it.

Away state is saved in the state database, so it survives a restart.

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
| `schedule` | Name of a schedule. Defaults to `default`, so every room except a `passive` one needs a schedule of that name, its own `schedule` key, or an entry in `household.rooms` |
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
