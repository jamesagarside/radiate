# Configuration

Radiate reads one YAML file that describes your house: rooms, the Zigbee2MQTT devices in each room, heating schedules, the boiler relay, and the hot-water store. To draft the file from the devices Zigbee2MQTT already knows, see [Start from your devices](#start-from-your-devices). To write it by hand, start from [`examples/reference-house.yaml`](../examples/reference-house.yaml) and change the device names to match yours.

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
- A room for each sensor with no TRV, commented out with `role: passive`. Discover can't tell an unvalved radiator from a room with no radiator, so check each one before you uncomment it. Keep `passive` only if the room's radiator has no controllable valve, such as a bypass radiator left open. For a room with no radiator, change it to `role: unheated` (see [rooms](#rooms)).
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
- The heating mode (`auto`, `off`, or `frost`), and the demand mode if you changed it through the API.
- The Elastic export queue, up to 7 days, so an outage or restart loses no metrics.
- Setpoint overrides from the UI, the API or the Home Assistant climate entity. An override ends at the room's next scheduled setpoint change unless it was set for a duration or until cleared, and one that ends while Radiate is stopped is dropped on restart.
- The tick history: every tick's inputs and decisions for the last `house.history_days` days. See [Tick history and replay](#tick-history-and-replay).

For Docker, the Home Assistant App and the other ways to run the server, see [deployment](deployment.md).

## Tick history and replay

Each minute the live server records the tick's snapshot (every room's readings, setpoints and relay states) and what Radiate decided: valve settings, relays, the boiler state, and the reason and alert codes. Reason messages aren't stored. The server also records how its engine state was built each time it starts, and a copy of the engine state every 6 hours.

The history keeps `house.history_days` days, 14 by default, and Radiate deletes older entries every hour. Each tick takes about 0.7 kB, compressed, so the reference house uses about 1 MB a day and 15 MB for 14 days. `radiate serve --demo` records in memory, so its Raw data view has something to show; the browser demo doesn't record.

The web UI's Raw data view searches and charts the history, and downloads it as CSV or JSON. Radiate keeps an hourly index of it beside the history, about 0.4 MB a day, so a month answers quickly. Each tick also records each room's target and whether it calls for heat, the burner where the boiler reports it, the heating relay's power where the relay measures it, and how many people are home and away; never who.

`radiate replay` shows what Radiate would have done during a dry run and why, and checks a code or configuration change against real days before you use it. If Radiate starts without usable saved state, it replays the history to learn its room models again. See [replay and bootstrap](deployment.md#replay-and-bootstrap).

In dry run, Radiate only decides valve settings for the rooms it actuates, which is the pilot valve unless rooms set `actuate`. To see every room's valve settings in the history while nothing is written, set `actuate: true` on every room and keep `dry_run: true`.

## Secrets

Any string of the form `${NAME}` is replaced with the environment variable `NAME`. If the variable isn't set, `check-config` reports it. Keep passwords out of the file this way:

```yaml
mqtt:
  password: ${RADIATE_MQTT_PASSWORD}
```

## Change settings in the web UI

The web UI's Settings tab shows every key on this page except the `household` and `schedules` sections, which have the household setup and the Schedules section. It doesn't add or remove rooms; list them here.

A change made there is saved to `<data_dir>/settings.yaml`, never to this file, and replaces this file's value for that key from then on. Each key shows where its value comes from: the house file, set in the web UI, or the default. The file looks like this, with `rooms` keyed by room id:

```yaml
settings:
  boiler:
    min_burn_min: 9
  rooms:
    lounge:
      actuate: true
```

Changes are checked with the same rules as this file and refused if the house wouldn't load. Boiler, hot water, balancing, suggestions, device alert limits, the outdoor source and the fire switch's length apply straight away; everything else after a restart, and the tab says which are waiting. Turning dry run off, changing the relay's host or channels, the schedule mirror, or a room's role, valve or `actuate` asks for confirmation first. Passwords set in the web UI are saved in the file in plain text, like the state database; the API never returns them. See [deployment](deployment.md#what-radiate-stores) for backups and going back to this file.

## Sections

### house

| Key | Default | Meaning |
|---|---|---|
| `timezone` | `Europe/London` | Time zone for schedules and the store windows |
| `dry_run` | `true` | Read devices, write nothing |
| `outdoor_sensor` | none | Zigbee2MQTT name of an outdoor temperature sensor. Without one, the model assumes 5 °C |
| `outdoor_source` | `zigbee` | Where the outdoor temperature comes from. `zigbee`: the `outdoor_sensor`, as before. `home_assistant`: the reading the Radiate integration posts from the outdoor entity picked in its options (a weather entity's temperature, or a temperature sensor). `both`: the Zigbee sensor while it has a reading, otherwise Home Assistant; needs `outdoor_sensor` |
| `outdoor_stale_after_min` | 180 | A Home Assistant outdoor reading measured longer ago than this counts as missing: the model assumes 5 °C and the alert `outdoor.stale` shows. 30 to 1440 |
| `data_dir` | `./data` | Folder for `radiate.db`, and for `household.yaml` when you set up the household in the web UI |
| `sensor_max_silence_min` | 60 | How long a battery sensor's last reading stands between reports before it counts as stale. Room sensor readings are saved with the time they were taken, so after a restart a reading stands until this long after the sensor last reported, not after Radiate started |
| `history_days` | 14 | Days of tick history kept in `radiate.db`, 0 to 90. Set 0 to turn recording off |
| `fire_flag_hours` | 6 | How long the manual "fire lit" flag lasts, 0.5 to 24. It also ends at local midnight, so a flag forgotten in the evening doesn't keep the room unheated the next day |

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
| `burner_metering` | `true` | Read burner firing from each channel's power reading |
| `burner_threshold_w` | 100 | A channel reading at least this many watts means the burner is firing, 10 to 3000 |
| `burner_hysteresis_w` | 20 | The burner counts as stopped once the reading falls this far below the threshold, 0 to 1000 and less than the threshold |

The watchdog script assumes switch 0 is heating and switch 1 is the store. Keep the defaults unless you also edit the script.

**Burner metering.** Where the boiler's own load passes through the Shelly, its power reading shows whether the burner fires. On the reference boiler, the heating channel reads about 185 W while the burner fires, 52 to 60 W while the boiler's own thermostat holds the burner off with the pump running, and 0 W with the relay off; the store channel reads about 125 W while the store burner runs. Pick a threshold between the pump alone and the burner running: watch `heating_power_w` and `store_power_w` in the web UI telemetry through a burn. Radiate trusts a channel only after it has read at or above the threshold since it started, so a relay that switches only the boiler's thermostat input, which never carries the burner's load, is never taken to mean the burner is off.

With metering, Radiate counts litres from firing time rather than relay time, ends store recovery when the store burner stops, and takes heat as available only once the burner has fired. It also learns during a dry run: without metering it does not, because the boiler's own timer, not the relay, decides when the radiators get heat. Without a `shelly` section Radiate cannot read the relay at all and does not learn.

**Models learned in a dry run without metering.** Earlier versions learned from a dry run as if the relay ran the boiler, which can leave confident models that are far off (a heating gain of a fraction of a K/h). Once the burner is metered, Radiate resets those models to their priors on its own, and treats models saved by a version that did not record how they were learned the same way (ADR-0007). Each reset shows in the web UI's Learning notice. Without metering they are kept and correct themselves over a few burns. To start any models again from priors yourself, use `POST /api/v1/learning/reset` with `{}` for every room or `{"rooms": [...]}` for some. With the server stopped, `radiate bootstrap` re-learns every model from the tick history instead, leaving out the dry run. See [deployment](deployment.md#replay-and-bootstrap).

### boiler

`min_burn_min` (8), `min_off_min` (10), `max_starts_per_hour` (3), `valve_lead_s` (90), `comfort_limit_k` (0.5), `frost_c` (7), `output_kw` (13), `nozzle_lph` (none), `demand_mode` (`eco`), `eco_limit_k` (1.5), `damp_margin_k` (0.3). Ranges are checked against spec section 5.1.

`demand_mode` decides how calling rooms fire the boiler (spec section 5.3):

| Value | Behaviour |
|---|---|
| `eco` (default) | Rooms fire the boiler together. The boiler starts when the calling rooms between them need at least 1.5 minimum burns of full radiator output (each room's gap divided by its learned heating gain), or when one room is more than `eco_limit_k` below its target. A small room on its own, such as a toilet, waits until it is colder or other rooms call too. Fewer, longer burns |
| `comfort` | Any calling room more than `comfort_limit_k` below its target fires the boiler, as does a predicted burn of 1.5 minimum burns. Rooms stay closer to their targets, with more relay starts |

In both modes frost protection and optimum start still fire the boiler. `eco_limit_k` is the most a calling room waits below its target in `eco` mode: 0.5 to 3 K, and at least `comfort_limit_k`.

`damp_margin_k` applies in `eco` to rooms with a use level. A room set back waits for other rooms before it starts a burn, but never below the 12 °C damp floor. It starts a burn on its own this far above the floor (12.3 °C by default), so its air stays above 12 °C while the radiator warms. 0 to 1 K; 0 starts the burn at the floor itself, which saves a little more oil and lets the air dip a few tenths below 12 °C.

You can change the demand mode without a restart with the **Eco** and **Comfort** control in the web UI, the Demand mode select in Home Assistant, or the API (`POST /api/v1/settings` with `{"demand_mode": "comfort"}`). That choice is saved in `radiate.db` and overrides `demand_mode` in this file until you send `{"demand_mode": null}`. The web UI and Home Assistant send null when you pick the mode set in this file, so Radiate follows the file again.

`nozzle_lph` is the burner nozzle rating in litres per hour, from the boiler's service sheet. With it, the daily accounting also estimates litres and kWh. Burner time comes from the heating relay, so the litres are an upper bound.

### store

`windows` (list of `HH:MM-HH:MM`, at most four), `recovery_min` (25), `priority_over_heating` (`true`).

### trv

| Key | Default | Meaning |
|---|---|---|
| `schedule_mirror` | `true` | Write each room's schedule into its TRVZB and run the valve in `auto` mode, so it follows the schedule if Radiate stops. With `false`, valves run in `heat` mode |
| `external_keepalive_min` | 25 | Resend the room temperature at least this often. The TRVZB reverts to its own sensor after about 2 hours without one |

### monitoring

When the web UI's Devices view, and the alerts, say a device needs attention.

| Key | Default | Meaning |
|---|---|---|
| `low_battery_pct` | 20 | A battery at or below this percentage is low (`device.low_battery`), 5 to 50. |
| `weak_signal_lqi` | 40 | A link quality (LQI, 0 to 255) below this is a weak signal (`device.weak_signal`), 5 to 150. The Zigbee2MQTT FAQ calls a link that stays at 40 or above usually acceptable. Stacks measure LQI differently, so the view shows the number too. 100 and above reads as strong |

A temperature sensor that has sent nothing for `house.sensor_max_silence_min` is reported as silent (`device.stale`).

### auth

User login for the web UI ([ADR-0006](adr/0006-user-login.md)). Without this section, or with `enabled: false`, nothing changes: the server uses `RADIATE_TOKEN` and Home Assistant ingress alone. With login on, the token and ingress still work exactly as before, so the Home Assistant integration needs no change. To use login without a house file (the demo, say), put the section in its own file and pass it with `radiate serve --auth-config FILE`.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `false` | Turn login on |
| `local` | `true` | Allow username and password login. Add people with `radiate users add` |
| `session_days` | 30 | A session ends this many days after sign-in, 1 to 400 |
| `idle_days` | 7 | A session ends after this many days without use, 1 to `session_days` |
| `audit_days` | 90 | How long the [security log](deployment.md#security-log) keeps an event, 1 to 3650. It applies whether or not `enabled` is on, as refused API requests are logged too |
| `secure_cookie` | `auto` | `auto` marks the session cookie `Secure` when the request came over HTTPS (directly, or from a trusted proxy that says so). `always` or `never` override it; use `never` only on a LAN for testing |
| `public_url` | none | The address people use, such as `https://heating.example.org`. Required for single sign-on, which builds its redirect addresses from it. Must be `https` unless the host is `localhost` |
| `trusted_proxies` | none | IP addresses or networks of your reverse proxies. Only requests from these have their `X-Forwarded-For`, `X-Forwarded-Proto` and `X-Forwarded-Host` headers believed |
| `oidc` | none | OpenID Connect single sign-on, below |
| `saml` | none | SAML single sign-on, below. Needs the `radiate[saml]` extra |

`auth.oidc`:

| Key | Default | Meaning |
|---|---|---|
| `issuer` | required | The provider's issuer URL. Radiate reads `<issuer>/.well-known/openid-configuration` and checks it names the same issuer |
| `client_id` | required | The client ID you registered. Register `<public_url>/auth/oidc/callback` as its redirect URI |
| `client_secret` | none | The client secret, usually `${RADIATE_OIDC_SECRET}`. Leave out for a public client |
| `client_secret_file` | none | A file holding the secret, such as a Docker or Kubernetes secret, read when the server starts. Use this or `client_secret`, not both |
| `scopes` | `[openid, profile, email]` | Scopes to ask for. `openid` is always added. Add `groups` if your provider needs it for a groups claim |
| `username_claim` | `preferred_username` | The claim that names the person |
| `roles_claim` | none | A claim holding groups or roles, such as `groups`. Taken from the userinfo endpoint if the ID token lacks it |
| `admins` | none | Usernames or `roles_claim` values that make someone an admin |
| `households` | none | Usernames or `roles_claim` values that make someone a household member: day-to-day control, no settings |
| `viewers` | none | Usernames or `roles_claim` values that make someone a viewer (shown as Read only). Someone in none of the three lists is refused. At least one list is required |
| `label` | `Sign in with single sign-on` | The button text on the login page |

`auth.saml`:

| Key | Default | Meaning |
|---|---|---|
| `idp_metadata_url` | none | Where to fetch the identity provider's metadata when the server starts |
| `idp_metadata_file` | none | Or a file holding it. Give exactly one |
| `sp_entity_id` | `<public_url>/auth/saml/metadata` | Radiate's entity ID. Give your provider `<public_url>/auth/saml/metadata`, which serves Radiate's metadata, and the assertion consumer service `<public_url>/auth/saml/acs` |
| `username_attribute` | the NameID | An attribute to take the username from instead |
| `roles_attribute` | none | An attribute holding groups or roles |
| `admins`, `households`, `viewers`, `label` | | As for OIDC. `label` defaults to `Sign in with SAML` |

Your provider must sign assertions with SHA-256 or stronger. Radiate refuses unsigned assertions, SHA-1 signatures, and responses it didn't ask for.

```yaml
auth:
  enabled: true
  public_url: https://heating.example.org
  trusted_proxies: [192.0.2.1]
  oidc:
    issuer: https://id.example.org/application/o/radiate
    client_id: radiate
    client_secret_file: /run/secrets/radiate-oidc
    roles_claim: groups
    admins: [heating-admins]
    households: [family]
    viewers: [guests]
    label: Sign in with the house account
```

Roles, highest first:

- **admin** can do everything: Settings, the household setup, arranging rooms, resetting learning, network scans.
- **household** has day-to-day control: setpoints and holds, the heating mode, Eco or Comfort, hot-water boost, the fire switch, away and "I'm home", and room adjustments in the week view. Not Settings, the household setup (people, routines, temperatures), arranging rooms or resetting learning.
- **viewer**, shown as Read only, can see every view except Settings and change nothing but signing out.

Local users get their role from `radiate users add --role` (`readonly` is accepted for `viewer`); single sign-on users get theirs at each sign-in from `admins`, `households` and `viewers`, highest first. `radiate.server.permissions` lists the lowest role for every API route; the API token and Home Assistant ingress are admin.

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
| `ha_person` | The Home Assistant `person` entity whose presence counts for this person, for example `person.sam`. See [Away](#away) |

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
| `adjust` | Room adjustments: times to keep this room warm or cold whatever the routines say. See [Room adjustments](#room-adjustments) |

A room in `household.rooms` can't also set `schedule` in the `rooms` section. Rooms not listed keep their `schedule`. A passive room has no valve and an unheated room has no radiator, so neither can be listed.

#### Set up in the web UI

You can set up the household in the web UI instead of writing this section. Without a household, the web UI shows **Set up your household**; with one, **Change household setup** sits beside the People heading. Five short steps ask about the people, their routines, how each room is used and the temperatures, then show the week each room will follow.

The web UI doesn't change the house file, which may be read-only or managed by the Home Assistant App. It saves the household in `household.yaml` in the data directory (`house.data_dir`, or `--data-dir`), in the same form as this section under a `household:` key, so you can paste it into a house file.

When `household.yaml` exists, it replaces the house file's `household` section. The house file's other sections still apply, and a room the saved household leaves out follows its own `schedule`. To go back to the house file's setup, choose **Use the house file's setup instead** in the wizard, or delete the file and restart Radiate.

> **Warning:** the saved household replaces the house file's `household` section as a whole, including `household.away` (`everyone_away`, `presence_delay_min`, `presence_stale_after_min` and the rest), `timing` and `temperatures`. While `household.yaml` exists, editing any of those in the house file, for example through GitOps, has no effect. Change them in the web UI, or delete the saved household first. Saving the household in the web UI also never merges in later house file edits. `check-config` and the server's start-up log name every house file setting that is not in effect, and `GET /api/v1/household` returns the same as `source_warning` and `house_file_ignored`.

`check-config` and `radiate schedules` read `household.yaml` from the same data directory as the server, so they agree with it. Give them `--data-dir` when the server runs with one:

```bash
radiate check-config radiate.yaml --data-dir /data
radiate schedules radiate.yaml --data-dir /data
```

`check-config` says which household applies. If the saved household no longer fits the house file, for example because a room was removed, Radiate uses the house file's setup instead, `check-config` notes why, and the wizard shows it.

On the People step, each person has a **Home Assistant person**. With the Home Assistant integration installed, it lists the `person` entities Home Assistant has, plus **Not linked**. While nobody is linked, the wizard links each person to the Home Assistant person with the same name, ignoring case. Without the integration, or with a version that doesn't send the list, it's a text field for the entity ID, such as `person.sam`. See [Away](#away) for what linking does.

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
| `everyone_away` | `frost` | `frost` or `unused` | What happens when everyone is away with an away until. `frost`: every room is held at the frost threshold. `unused`: every household room stays at its unused temperature, for example for pets or a house that gets damp. When Home Assistant presence alone says everyone is out, rooms stay at their unused temperature whichever you choose |
| `presence_evidence_max_age_min` | 240 | 30 to 1440 | Not home counts as away only while the person's phone or tracker has reported within this time. After that, Radiate counts them as home |
| `presence_weak_source_delay_min` | 240 | 0 to 1440 | How long not home from a router or Bluetooth tracker, or from a phone at 5 % battery or less, must last before the person counts as away. The longer of this and `presence_delay_min` applies |

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

#### Room adjustments

A room adjustment keeps one room warm, or cold, from one time to another on some days, whatever the routines say. Use it for something the routines don't describe, such as "the kitchen stays warm until 23:00 on weekdays". It stays when the routines change, so you don't need to rewrite a routine for one room.

```yaml
household:
  rooms:
    kitchen:
      use: in_use
      adjust:
        - days: weekdays
          keep: warm
          from: "22:30"
          to: "23:00"
        - days: [sat, sun]
          keep: cold
          from: "08:30"
          to: "09:00"
```

With the example household, the kitchen is then warm until 23:00 on weekdays, and from 09:00, not 08:30, at weekends.

| Key | Meaning |
|---|---|
| `days` | Required. `weekdays`, `weekend`, `daily`, a day (`mon` to `sun`, or in full), or a list of them, such as `[mon, wed]`. `weekdays` and `weekend` follow `household.weekend_days` |
| `keep` | Required. `warm`: the room is warm from `from` to `to`. `cold`: it isn't warm then, so it's at the unused temperature by day and the night temperature overnight |
| `from` | Required. When it starts, `HH:MM` |
| `to` | Required. When it ends, after `from` on the same day. `24:00` is allowed |

A room can have up to 10 adjustments.

How they apply:

- After the routine rules, in the order listed. Where two overlap, the later one wins.
- The times are in Radiate's own copy of the week, the one the web UI shows: "warm by" times. The valve's copy starts each warm period `preheat_min` early, as usual. With `live_preheat: fixed` the two copies are the same, so the times are when heating starts.
- A room kept warm gets its use level's temperature, or its own `temperature`. On a day the room is `unused`, it gets the in-use temperature.
- Before the valve's copy is fitted to the TRVZB's six changes a day. A warm period an adjustment adds can still be left out of the valve's copy, and `check-config` says so. Radiate still heats it while running.
- While everyone who uses the room is away, the room drops to its unused temperature and its adjustments don't apply. While some of its people are home, they apply as usual.

In the web UI, you can make an adjustment in the Schedules section instead. Drag the start or end of a warm period, or select **Adjust** under the room. Each room lists its adjustments, with **Remove** and **Reset to routine**. The first change to a household from the house file saves a copy of it in `household.yaml` in the data directory, as the setup does. See [Set up in the web UI](#set-up-in-the-web-ui).

#### Away

When a person is away, Radiate rebuilds the household's schedules without their part of the routine. If the home worker travels, their office drops to the unused temperature and the bedroom stays warm for the early riser. Rooms with a hand-written `schedule` don't change. Radiate follows the rebuilt weeks while it runs. The schedule mirror and the Shelly fallback don't: they keep the weeks for everyone at home, so if Radiate stops, the TRVs and the boiler heat as if someone is home.

A person counts as away in two ways:

- Away until: someone sets it in the web UI, through the API, or with the Home Assistant service `radiate.set_away`. It counts straight away and clears itself at the given time. You don't need Home Assistant for this.
- Presence: the Home Assistant integration reports a linked `person` entity as home or not home. Not home counts as away once it has lasted `presence_delay_min`. Home counts at once.

You can link a person to a `person` entity in two places:

- In the household: `ha_person` in this section, or **Home Assistant person** on the People step of the [setup wizard](#set-up-in-the-web-ui).
- In the integration's options in Home Assistant.

A link in the integration's options takes priority. A person with no link in either place counts as away only through away until.

`ha_person` must be a `person` entity ID, and each entity can be linked to one person only. Linking changes no schedule; it only says whose presence to report. The integration picks up a change to the household within 15 minutes.

Away until wins over a home that Home Assistant reported before it was set, so you can set it before you leave. If Home Assistant sees the person arrive home after it was set, the away ends early.

`presence_delay_min` is 60 minutes by default. An hour is longer than a trip to the shops or the school run, and shorter than a working day or an evening out. A room cools slowly, so turning it down for a short trip saves little heat and costs an extra boiler start to warm it again. Set it to 0 to count a person as away as soon as they leave.

The integration reports each person's presence again every 15 minutes. If Home Assistant stops reporting, for example because it's down, presence older than `presence_stale_after_min` counts as unknown. An unknown person isn't away, so their rooms follow their routine. The API and the Home Assistant away entity show when presence has gone stale. Set `presence_stale_after_min` to 0 if something reports presence through the API without repeating it.

Radiate fails warm: when it isn't sure someone is out, it counts them as home. A not home counts as home instead of away when:

- The person's phone or tracker hasn't reported for `presence_evidence_max_age_min`. A phone with a flat battery stays not home in Home Assistant, and the integration keeps repeating that, so Radiate looks at when the trackers themselves last reported (`evidence_at`, sent by the integration). With an integration too old to send it, Radiate uses the time the person left instead, so presence counts as away for at most `presence_evidence_max_age_min` after they leave.
- Someone selects **Back now** for them in the web UI, or calls `POST /api/v1/people/{id}/home`. This lasts until Home Assistant sees them come or go again.
- Someone shows they're in after the person left: a held temperature, a hot-water boost, the fire switch, or a shower. This also lasts until the person's presence changes.

A not home from a router or Bluetooth tracker, or from a phone at 5 % battery or less, counts as away only after `presence_weak_source_delay_min`, because a phone asleep or dead at home looks like one that has left.

A room set back because someone is away by presence never goes below 12 °C, so the house doesn't get damp, unless its routine already has it lower. An away until is your own choice, so it uses the unused temperature as set.

When everyone is away and the heating mode is `auto`, what happens depends on why:

- Everyone has set an away until: every room is held at the frost threshold, like the `frost` mode, or at its unused temperature with `everyone_away: unused`. A room with a held temperature keeps it.
- Home Assistant presence says at least one of them is out: every household room stays at its unused temperature. Presence never holds the house at frost.

It goes back to the schedules as soon as someone is home. The heating mode you chose doesn't change, so `off` and `frost` still apply while everyone is away. Frost protection and the boiler guards work as usual.

#### Coming back

When someone has set an away until, Radiate knows when they're due back. From `return_warmup_min` before that time, Radiate treats the return as the next change in each room's schedule. Optimum start then starts heating each room as early as it needs, so a house that cooled during a long absence starts early, and a house that is still warm after a short one starts late. While everyone is away, rooms stay at frost protection until then, unless optimum start says a room must start heating. The person counts as away until the time they gave.

Until Radiate has learned a room, optimum start can begin as early as `return_warmup_min` allows. A larger value can mean an earlier start for an unlearned room.

With `live_preheat: fixed`, the person stops counting as away `preheat_min` before the time they gave, as the valve's copy expects.

Presence on its own gives no return time. If Home Assistant still says the person is not home at the time they gave, presence keeps them away after it.

Away state is saved in the state database, so it survives a restart.

### learning

How Radiate learns each room's model (spec sections 4.3 and 4.6).

| Key | Default | Meaning |
|---|---|---|
| `memory_days` | 730 | How long a room's model remembers, in days of learning, 1 to 3650. A long memory keeps one odd week from moving the model. Radiate also watches each model and re-learns it when a real change shows, such as a radiator bled or replaced, so a long memory doesn't stop it following the house |
| `learn_on_trv_fallback` | `false` | While a room's own sensor is stale, Radiate uses its TRV reading plus `trv_bias_k`. With `false` it doesn't learn from that reading, because the TRV sits beside the radiator. Set `true` to keep learning |

### suggestions

When the web UI's Suggestions view (`GET /api/v1/suggestions`) gives advice about a room or a device. Every limit is a setting; the defaults are a starting point, not facts about your house.

| Key | Default | Meaning |
|---|---|---|
| `min_confidence` | 0.6 | A room's model must be at least this certain, for its heating gain and its loss rate, before Radiate judges the room, 0.3 to 0.95 |
| `min_learning_h` | 48 | Hours of learning a room needs before Radiate judges it, 6 to 2000. One hour is 60 learning updates, so time with learning paused doesn't count |
| `min_rooms` | 3 | Rooms with enough learning (or enough measured arrivals) before rooms are compared with each other, 2 to 20 |
| `heat_loss_ratio` | 1.6 | A room whose loss rate is at least this many times the house's typical (median) loss rate is said to lose heat quickly, 1.1 to 5 |
| `compare_delta_k` | 15 | The difference between inside and outside, in °C, used to put a loss rate into words ("cools by about 1.7° an hour"), 5 to 30 |
| `design_outdoor_c` | -2 | The coldest outdoor temperature the heating should keep up with. A radiator that the model says can't hold the room's warmest setpoint down to this temperature may be too small, -25 to 10 |
| `mild_outdoor_c` | 5 | A radiator that falls short even above this outdoor temperature is marked to act on rather than to consider, -10 to 15, above `design_outdoor_c` |
| `slow_warm_ratio` | 2 | A radiator whose arrival lag is at least this many times the house's typical lag is slow to warm, 1.2 to 5 |
| `slow_warm_extra_min` | 10 | and at least this many minutes longer than the typical lag, 0 to 60 |
| `min_lag_samples` | 5 | Measured arrivals a radiator needs before its lag is judged, 3 to 15 |

Rooms measured only by their TRV (`internal_sensor_only`) and rooms with a `continuous` heat source are never judged from their model. Weak Zigbee links use `monitoring.weak_signal_lqi`.

### export

Where to send data besides the web UI. One subsection today, `otlp`: the [OpenTelemetry export](deployment.md#opentelemetry-export) over OTLP/HTTP. Leave it out to send nothing.

```yaml
export:
  otlp:
    endpoint: https://my-project.ingest.eu-west-1.aws.elastic.cloud:443
    api_key: ${RADIATE_OTLP_API_KEY}
```

| Key | Default | Meaning |
|---|---|---|
| `endpoint` | required | The collector's OTLP/HTTP base URL. Radiate adds `/v1/metrics` and `/v1/logs`. No credentials, query or signal path in it |
| `enabled` | `true` | Set `false` to keep the section and send nothing |
| `api_key` | none | Sent as `Authorization: ApiKey <key>`. A value starting `ApiKey ` has the prefix dropped |
| `api_key_file` | none | A file holding the key, instead of `api_key`. Without either, `RADIATE_OTLP_API_KEY` is used if set |
| `headers` | none | Extra request headers. An `Authorization` header here replaces the API key |
| `protocol` | `http/protobuf` | Or `http/json`. gRPC is not supported |
| `interval_s` | 60 | Seconds between sends, 10 to 3600 |
| `timeout_s` | 30 | Seconds to wait for an answer, 1 to 120 |
| `compression` | `none` | Or `gzip` |
| `signals` | `[metrics, logs]` | Readings as metrics, decisions and alerts as logs |
| `dataset` | `radiate` | Sent as `data_stream.dataset`, which Elastic routes by. Empty to leave it out |
| `daily_metrics` | `true` | Send each closed day's summary and savings (`radiate.daily.*`) once a day. Needs `metrics` in `signals`. The running totals go every minute either way |
| `daily_timestamp` | `end_of_day` | When daily figures are timed. `end_of_day`: the day's last second in the house's time zone, so a one-day date histogram puts each figure on the day it covers. `day_close`: when Radiate closed the day, a minute or so after midnight, for a backend that drops points older than when they arrive. See the [telemetry schema](telemetry.md#once-a-day) |

### balancing

A top-level key, default `true`. Set `balancing: false` to open every heating valve fully instead of sharing flow between them. The boiler guards, optimum start and learning still run. It exists to compare against balancing, for example in the simulator.

### rooms

| Key | Meaning |
|---|---|
| `id` | Lower case letters, digits, and `_` |
| `name` | Display name |
| `role` | `normal` (TRV and room sensor), `internal_sensor_only` (TRV with no room sensor), `passive` (no controllable valve, for example an unvalved bypass radiator), or `unheated` (room sensor and no radiator, see below) |
| `trv` | Zigbee2MQTT name of the TRVZB |
| `sensor` | Zigbee2MQTT name of the room temperature sensor |
| `window` | Zigbee2MQTT name of a contact sensor. `contact: false` means open |
| `schedule` | Name of a schedule. Defaults to `default`, so every room except a `passive` or `unheated` one needs a schedule of that name, its own `schedule` key, or an entry in `household.rooms`. An `unheated` room can't have one |
| `heat_source` | `episodic` (open fire, wood burner) or `continuous` (range cooker). Not allowed in an `unheated` room, which has no room model |
| `humidity` | `true` to use the sensor's humidity for shower detection. In an `unheated` room humidity is recorded by default; set `false` to leave it out |
| `actuate` | `true` to let Radiate write to this room's TRV (`RoomConfig.actuation_enabled` in code). Without any `actuate` keys, only the pilot valve is actuated |
| `trv_bias_k` | Offset from the TRV's internal reading to room temperature, default -1.5. Used in an `internal_sensor_only` room, and in a `normal` room while its sensor is stale |
| `use` | Optional. How a room on a hand-written schedule is used: `in_use`, `occasional` or `unused`, or `{weekdays: ..., weekend: ...}` when it differs at weekends. The same words as `household.rooms.<id>.use`. See [Use level of a hand-written room](#use-level-of-a-hand-written-room). Not allowed in a `passive` or `unheated` room, or in a room the household covers |

#### Use level of a hand-written room

A household gives Radiate each room's use level. A room on a hand-written schedule can give it with `use`, in the same words, so Radiate knows how it is used too ([room use, spec 5.8](spec.md#58-room-use-in-demand)):

```yaml
rooms:
  - {id: office, name: Office, trv: trv_office, sensor: temp_office, schedule: office, use: in_use}
  - {id: lounge, name: Lounge, trv: trv_lounge, sensor: temp_lounge, schedule: lounge, use: unused}
  - id: spare
    name: Spare bedroom
    trv: trv_spare
    sensor: temp_spare
    schedule: spare
    use: {weekdays: unused, weekend: occasional}
```

The room's warm periods are the parts of each day where its schedule is above that day's lowest temperature. Inside them the room is in use or occasional, by its level; outside them, and all day when its level is `unused`, it is set back. With `daily: "00:00/14 06:30/19 08:00/16 21:30/19 23:00/14"`, a bedroom is warm from 06:30 to 23:00 and set back overnight. A day at one temperature all day has no warm periods: on an `in_use` or `occasional` day the room counts as warm all day at that level, and on an `unused` day it is set back all day. `weekend` means Saturday and Sunday, as in `schedules`. A setpoint override counts as in use.

Without `use` the room has no room use, as before, and no savings baseline.

With `use`, the room also gets a savings baseline ([spec 5.9](spec.md#59-savings)): a heating timer on from the first person up, less the fixed preheat, to the last to bed when a household with people is saved (even one that covers no rooms), or otherwise from the earliest warm period start to the latest warm period end across all hand-written schedules that day. While the timer is on, the baseline holds the room at the highest temperature its schedule sets that day; while it is off, the baseline puts no heat in. So a house of hand-written rooms shows savings once every heated room has `use`.

In `eco`, room use decides how far below its target a room waits before it starts the boiler on its own, and whether it counts towards a shared burn: a set-back room only takes heat while the boiler runs for other rooms, unless it falls to 12 °C ([spec 5.8](spec.md#58-room-use-in-demand)). `comfort` ignores it.

#### Unheated rooms

A room with a temperature sensor and no radiator, such as a landing, a boot room or the room the boiler is in, has `role: unheated`. It needs a `sensor` and can't have a `trv`, a `schedule` or a `heat_source`:

```yaml
rooms:
  - {id: landing, name: Landing, role: unheated, sensor: sensor_landing}
  - {id: utility, name: Utility room, role: unheated, sensor: sensor_utility}
```

Radiate records its temperature and humidity in the tick history and the Elastic export, and shows them in the web UI, the API and the Home Assistant dashboard, labelled as having no radiator. It never controls the room, learns a model for it or counts it as calling. A warm unheated room never counts as heat arriving in the no-heat check, so a utility room warmed by the boiler's casing can't hide an empty oil tank. Use `passive` instead only for a room whose radiator is always open with no controllable valve.

How these readings could feed the room models is an open question for the owner ([spec section 12](spec.md#12-open-questions)).

## Zigbee2MQTT notes

- TRVZB firmware 1.2.1 or later is needed for `external_temperature_input`, and 1.1.4 or later for the opening and closing degree.
- Radiate subscribes to `zigbee2mqtt/#`, reads device state and availability, and writes to `zigbee2mqtt/<name>/set`. Turn on availability in Zigbee2MQTT so offline valves are reported promptly.
- The Devices view reads `battery` and `linkquality` from each device's state, and the retained `zigbee2mqtt/bridge/devices` for firmware and for the routers, which aren't in this file. Turn on `advanced.last_seen` in Zigbee2MQTT so "last seen" survives a Radiate restart; without it, Radiate counts from the last message it heard. **Scan network** publishes one `zigbee2mqtt/bridge/request/networkmap` request, also in dry run, as it changes no device. Zigbee2MQTT asks every router for its neighbours, which slows the network for up to 2 minutes, so Radiate scans only when you ask and at most every 10 minutes.
- Battery sensors don't answer read requests. Until each sensor reports after a restart, Radiate uses the TRV's internal reading. To avoid that gap, set `retain: true` for the room sensors in Zigbee2MQTT.
- The TRVZB runs its weekly schedule on the clock it receives from Zigbee2MQTT, which uses the Zigbee2MQTT host's local time. Make sure that host's time zone matches `house.timezone`.
- Radiate keeps each TRVZB in governed mode: `smart_temperature_control` off, `valve_closing_degree` 100, the room temperature as the external input, and Radiate's setpoint and opening limit. If the valve reports a different value for a setting for more than 5 minutes (2 minutes for the setpoint), Radiate sends it again, up to three times, and then raises an alert. A setpoint changed on the valve itself is overwritten in the same way. A setting the valve doesn't support, such as `smart_temperature_control` on TRVZB firmware 1.3.0, isn't sent again once Zigbee2MQTT reports it unsupported, or at all if the device's Zigbee2MQTT definition doesn't list it. Any other setting Zigbee2MQTT rejects, such as the external temperature or the opening limit, raises an alert and is tried again after 60 minutes. Radiate reads those reports from `zigbee2mqtt/bridge/logging`.

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
