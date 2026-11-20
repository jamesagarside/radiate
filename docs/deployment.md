# Deployment

This page covers every way to run Radiate today. Radiate is pre-alpha: the device drivers are untested on real hardware, so run any real house in dry run first and follow the one-valve rollout in [configuration](configuration.md#bring-radiate-in-gradually).

| Way to run | For | Status |
|---|---|---|
| [From source](#from-source-with-uv) | Development, trying the demo | Used day to day by contributors |
| [Standalone Docker](#standalone-docker) | Any Linux host without Home Assistant | Image builds locally; not published to a registry |
| [Raspberry Pi](#raspberry-pi) | A small dedicated box | Not tested on a Pi yet |
| [Home Assistant App](#home-assistant-app) | Home Assistant OS and Supervised installs | Demo mode tested; real devices untested |
| [HACS integration](#hacs-integration) | Entities and services in Home Assistant, for any of the above | Tested with the Home Assistant test harness |
| [Online demo](#online-demo) | A first look, nothing to install | Published to GitHub Pages from `main` |

Whichever way you run it, the server listens on port 8099 and serves the web UI and the API there.

## What a real install needs

The demo needs nothing else. To run a real house you also need:

- An MQTT broker, such as Mosquitto, and Zigbee2MQTT publishing to it, with availability turned on.
- Sonoff TRVZB valves on firmware 1.2.1 or later, and room temperature sensors, paired in Zigbee2MQTT.
- Optionally, a Shelly 2PM Gen4 at the boiler: switch 0 for central heating demand, switch 1 for the hot-water store. Have a qualified engineer (OFTEC, for oil) do the boiler wiring.
- A configuration file describing your house. Start from [`examples/reference-house.yaml`](../examples/reference-house.yaml) and see [configuration](configuration.md).

## From source with uv

You need Python 3.12 or later (CI uses 3.13) and [uv](https://docs.astral.sh/uv/).

```bash
git clone https://github.com/jamesagarside/radiate.git
cd radiate
uv venv && uv pip install -e ".[server]"
```

Use `".[dev]"` instead if you also want the tests and ruff. See [CONTRIBUTING.md](../CONTRIBUTING.md).

Run the demo, a simulated house at 60 times real time:

```bash
.venv/bin/radiate serve --demo --speed 60
```

Run your own house. Check the file first; the server starts in dry run unless the file sets `house.dry_run: false`:

```bash
.venv/bin/radiate check-config radiate.yaml
.venv/bin/radiate serve --config radiate.yaml
```

`radiate serve` options:

| Option | Default | Meaning |
|---|---|---|
| `--demo` | | Drive the simulated reference house. Use exactly one of `--demo` and `--config` |
| `--config FILE` | | Drive real devices described in `FILE` |
| `--dry-run` | off | Force dry run whatever the file says |
| `--speed N` | 60 | Demo only: simulated minutes per real minute |
| `--host HOST` | `0.0.0.0` | Address to listen on |
| `--port PORT` | 8099 | Port to listen on |

Radiate keeps its state in `radiate.db` inside `house.data_dir`, which defaults to `./data` relative to the directory you start it from. See [Data, backups and upgrades](#data-backups-and-upgrades).

To compare Radiate with plain smart TRVs in the simulator, run `.venv/bin/radiate sim --days 5`.

## Standalone Docker

There is no published image yet, so build it from the repository root:

```bash
docker build -t radiate .
```

The image runs the demo at real-time speed by default:

```bash
docker run --rm -p 8099:8099 radiate
```

To see the demo faster, override the command:

```bash
docker run --rm -p 8099:8099 radiate radiate serve --demo --speed 60
```

### Run your own house in Docker

1. Put your configuration file in a folder on the host, for example `/srv/radiate/radiate.yaml`.
2. In the file, set `house.data_dir: /data` so state goes to a volume, and set `mqtt.host` to an address the container can reach. `localhost` inside the container is the container itself.
3. Put secrets in an env file, for example `/srv/radiate/radiate.env`, and refer to them from the configuration file as `${NAME}`:

   ```bash
   RADIATE_MQTT_PASSWORD=change-me
   RADIATE_SHELLY_PASSWORD=change-me
   ```

4. Check the configuration inside the container:

   ```bash
   docker run --rm \
     -v /srv/radiate/radiate.yaml:/config/radiate.yaml:ro \
     --env-file /srv/radiate/radiate.env \
     radiate radiate check-config /config/radiate.yaml
   ```

5. Start the server:

   ```bash
   docker run -d --name radiate --restart unless-stopped \
     -p 8099:8099 \
     -v /srv/radiate/radiate.yaml:/config/radiate.yaml:ro \
     -v radiate-data:/data \
     --env-file /srv/radiate/radiate.env \
     radiate radiate serve --config /config/radiate.yaml
   ```

   To force dry run whatever the file says, add `--dry-run` to the end of the command.

6. Watch the log with `docker logs -f radiate`. In dry run, each write Radiate would have made appears as a `dry run: would publish` line. The web UI shows a **Dry run** notice with the number of held-back writes and the latest five.

The container makes outbound connections to the MQTT broker and the Shelly, so the default bridge network works as long as the host can reach both.

### Environment variables

| Variable | Meaning |
|---|---|
| `RADIATE_TOKEN` | If set, every `/api/` request except `/api/v1/health` needs the header `Authorization: Bearer <token>`. The WebSocket at `/api/v1/stream` also accepts it as the first message, `{"token": "<token>"}` |
| `RADIATE_ELASTIC_URL`, `RADIATE_ELASTIC_API_KEY` | Turn on [Elastic export](#elastic-export) |
| `RADIATE_INGRESS_IP` | Set by the Home Assistant App only. Requests from this address with an `X-Ingress-Path` header skip the token check |
| `RADIATE_WEB_DIR` | Serve the web UI from another folder, for UI development |
| Any name used as `${NAME}` in the configuration file | Substituted when the file loads |

We recommend setting `RADIATE_TOKEN` on a standalone install. The built-in web UI then shows a sign-in card the first time you open it. Enter the token, and the browser keeps it in its local storage, so you sign in once per browser. The UI sends it as a Bearer header, and as the first message on the live WebSocket, because browsers cannot set headers there. The token never goes in a URL, so it stays out of access and proxy logs. To sign out, clear the site data for Radiate in your browser.

The token stops casual access, but the server speaks plain HTTP. Keep port 8099 on a trusted network and never expose it to the internet. Through Home Assistant ingress the sidebar panel needs no token, and the UI never asks for one.

To check the server is up, request `http://HOST:8099/api/v1/health`, which returns `{"ok": true}` without a token.

## Raspberry Pi

Radiate has not been tested on a Raspberry Pi yet. The expected route is Docker on 64-bit Raspberry Pi OS:

1. Install 64-bit Raspberry Pi OS (Bookworm or later) on a Pi 4 or Pi 5.
2. Install Docker Engine following Docker's instructions for Debian.
3. Clone the repository on the Pi and follow [Standalone Docker](#standalone-docker). The `python:3.13-slim` base image is multi-architecture, so the same `docker build` produces an arm64 image.

What to expect, based on the code rather than on testing:

- The core is pure Python with no numpy, and the server's dependencies (aiohttp, aiomqtt, PyYAML) publish arm64 wheels, so the build needs no compiler.
- Radiate saves its state every 5 minutes. With Elastic export on, it also writes the export queue to SQLite every minute. If you are worried about SD card wear, put the data volume on an SSD.
- 32-bit Raspberry Pi OS has not been tried.

You can also run from source on the Pi with uv, as in [From source](#from-source-with-uv). If you try either route, open an issue saying what worked and what didn't.

## Home Assistant App

The App runs the Radiate server in a container managed by the Home Assistant Supervisor, so the control loop keeps running while Home Assistant itself restarts or updates. It needs Home Assistant OS or a Supervised install on `amd64` or `aarch64`.

### Install the App

1. In Home Assistant, go to **Settings** > **Apps**, open the app store, and select **Repositories** from the top-right menu.
2. Add `https://github.com/jamesagarside/radiate`. The repository's `repository.yaml` and `app/radiate/` folder define the App.
3. Install **Radiate**. The Supervisor builds the image on your machine from `app/radiate/Dockerfile`, which installs Radiate from the `main` branch on GitHub. This takes a few minutes.
4. Start the App and open **Radiate** in the sidebar. It starts in demo mode.

### Options

| Option | Default | Meaning |
|---|---|---|
| **Demo mode** (`demo`) | on | Run the simulated reference house |
| **Config file** (`config_file`) | `radiate.yaml` | House configuration in the App's config folder, used when demo mode is off |
| **API token** (`token`) | empty | Required by clients outside Home Assistant. The sidebar panel and the discovered integration don't need you to enter it |
| **Elastic URL** (`elastic_url`) | empty | Turns on [Elastic export](#elastic-export) |
| **Elastic API key** (`elastic_api_key`) | empty | API key for the export |

### Run your own house in the App

1. Install the Mosquitto broker App and point Zigbee2MQTT at it.
2. Put your configuration file in the App's config folder, `/addon_configs/<slug>_radiate/` on the host, for example with the Samba share or the File editor. Use the broker details the App passes in:

   ```yaml
   mqtt:
     host: ${RADIATE_MQTT_HOST}
     port: ${RADIATE_MQTT_PORT}
     username: ${RADIATE_MQTT_USERNAME}
     password: ${RADIATE_MQTT_PASSWORD}
   ```

3. Turn off **Demo mode**, set **Config file** if your file has another name, and restart the App.
4. Read the App's **Log** tab. It shows configuration notes and, in dry run, each write Radiate would have made.

The App keeps state in its `/data` folder, which Home Assistant includes in its backups.

### Ingress

The sidebar panel reaches Radiate through Home Assistant ingress, which signs the user in. The server trusts requests from the Supervisor's ingress address (`172.30.32.2`, set as `RADIATE_INGRESS_IP` in the App image) only when they carry the ingress header, so the token is not needed in the panel. The App does not publish port 8099 on the host.

### Discovery

Each time it starts, the App announces itself to the Supervisor with its host name, port and token. If the [HACS integration](#hacs-integration) is installed, Home Assistant offers to add Radiate with those details.

## HACS integration

The integration is a thin client of the server's API. It adds entities and services to Home Assistant but contains no control logic, so heating carries on if Home Assistant stops. It needs Home Assistant 2025.2 or later and [HACS](https://hacs.xyz/).

1. In HACS, open the top-right menu, select **Custom repositories**, add `https://github.com/jamesagarside/radiate` with the type **Integration**, then download **Radiate**.
2. Restart Home Assistant.
3. Add the integration:
   - With the App: accept the discovered **Radiate** under **Settings** > **Devices & services**.
   - With a standalone server: go to **Settings** > **Devices & services** > **Add integration** > **Radiate**, and enter the server URL, for example `http://192.0.2.20:8099`, plus the token if you set one.

The integration polls the server every 30 seconds and creates the entities below. If an older server does not report a value, the integration leaves that entity out.

For each room Radiate controls:

- A climate entity. Setting its target temperature (5 to 28 °C in 0.5 °C steps) creates a setpoint override that ends at the room's next scheduled change and survives a server restart. Its attributes show the opening limit, learning state, latest reason, and the override's setpoint (`override_setpoint`), how it ends (`override_until`) and minutes left (`override_expires_in_min`).
- Sensors: temperature, opening limit, heating gain, loss rate, arrival lag, model confidence and learning state.
- A Stuck valve binary sensor (problem class). It turns on when the room stays cold through burns that warm other rooms, which usually means the valve needs checking.

For each room with an open fire or stove (an episodic heat source):

- A Fire lit switch. Turn it on when you light the fire so Radiate pauses the room's learning. The server forgets it when it restarts.
- A Fire detected binary sensor, on while Radiate treats the fire as lit, either because of the switch or because the room is warming faster than the radiator explains.

Rooms Radiate cannot control, such as a bypass radiator, get a temperature sensor only.

For the house:

- Boiler state, boiler firing, starts in the last hour, predicted burn and outdoor temperature.
- Heating mode (`select.radiate_heating_mode`): **Auto**, **Frost** or **Off**. Choosing an option sets the mode, as `radiate.set_mode` does.
- Hot-water store (`binary_sensor.radiate_hot_water_store`): on while the store relay is on, in a store window or during a boost. The relay enables the store; the boiler's own thermostat decides when it heats.
- Hot-water boost (`binary_sensor.radiate_hot_water_boost`): on while a boost from `radiate.boost_store` runs.
- Short-cycle extra off time, in minutes. Radiate adds this to the minimum off time for 24 hours after it sees short-cycling. Attributes give the hours left and the effective minimum off.
- Burner hours today and starts today, plus oil used today (litres) and heat delivered today (kWh) when the configuration has a nozzle rating. They reset at local midnight. Until a burner-firing signal exists they count relay time, so litres and kWh are an upper bound.
- Balance score for yesterday, 0 to 100. It is higher when rooms reached their setpoints closer together.
- Alerts: the number of current alerts, with each one's code, message and room in the `alerts` attribute.

For each person in the house file's [household](configuration.md#household):

- An away binary sensor, for example `binary_sensor.radiate_early_riser_away`. It's on while Radiate counts the person as away. Its attributes give the reason (`away_until` or `presence`), when they're due back (`away_until`), and the presence Radiate last heard (`presence`, `presence_since`).

To let Home Assistant presence drive away, map each Radiate person to a `person` entity: go to **Settings** > **Devices & services** > **Radiate** > **Configure**. The integration then reports each mapped person's state to the server when it changes. `home` counts as home and any other state, such as `not_home` or a zone name, counts as not home. `unknown` and `unavailable` aren't reported, so they never make anyone away. The server decides when not home counts as away, after the [presence delay](configuration.md#away). If you remove a mapping, the integration tells the server to forget that person's presence.

Services:

- `radiate.boost_store`: `minutes`, 0 to 180, default 60.
- `radiate.set_mode`: `auto`, `frost` or `off`.
- `radiate.set_override`: target one or more Radiate climate entities with a `temperature`. By default the override ends at the room's next scheduled change. Set `duration_min` (1 to 10080) to hold it for that long, or `until: cleared` to hold it until you clear it.
- `radiate.clear_override`: returns the targeted rooms to their schedules.
- `radiate.set_away`: `person` (a Radiate person ID, or their mapped `person` entity) and `until` (a date and time). The person counts as away until 30 minutes before then. A time without a time zone is in Home Assistant's time zone.
- `radiate.clear_away`: `person`. Counts them as home again.

## Home Assistant dashboard

`radiate dashboard` builds a Home Assistant dashboard from your house file. It shows every room's sensors and valve from Zigbee2MQTT, plus the entities and services of the [HACS integration](#hacs-integration).

```bash
radiate dashboard radiate.yaml -o heating-dashboard.yaml
```

If Radiate isn't running yet and you only have Zigbee2MQTT, add `--no-radiate`. The dashboard then leaves out everything from the integration, and you set room temperatures on the valves directly.

The dashboard has two views.

**Rooms** shows the house as it is now:

- A **House** section with recent room temperatures and humidity, and the outside temperature when `house.outdoor_sensor` is set.
- A **Radiate** section:
  - The boiler state now and a timeline of it over the live window, so you can see when the boiler fired.
  - The number of alerts.
  - Burner hours and starts today. With a nozzle rating (`boiler.nozzle_lph`), oil used and heat delivered today too.
  - The current heating mode, with **Auto**, **Frost** and **Off** buttons to change it in one tap. **Off** asks you to confirm.
  - Whether the hot-water store and a boost are on, above **Boost hot water for 1 hour**, which runs the store for 60 minutes outside its windows.
- One section per room: humidity and dew point beside the room name, the temperature with a trend line, Radiate's heating control with its target temperature, the opening limit Radiate set for the valve, and the valve's activity (its reading against its target, with the time it was calling for heat shaded). Change a room's temperature on the heating control: it sets an override that ends at the room's next scheduled change. A room with an open fire has a **Fire lit** switch. A room with an open fire or range cooker says so under its name. An internal-sensor room shows the valve's own reading. A bypass radiator has no heating control.
- A **Batteries** section listing every sensor and valve.

The live window is 24 hours. Set it with `--hours`, from 1 to 336 (14 days), for example `--hours 72`. History older than Home Assistant's recorder keeps (`purge_keep_days`) doesn't show.

**Analysis** looks back over a period you choose. The date picker at the top (day, week, month or a custom range, with arrows to step back) drives every card on the view:

- **Rooms compared**: each room's average temperature and peak humidity on one chart.
- Per room: the lowest, average and highest temperature, a chart of all three, and the peak and average humidity.

These cards read Home Assistant's long-term statistics, which it keeps after the recorder purges detailed history, so they work for periods longer than 14 days. A sensor has statistics from about an hour after it first reports.

With `--no-radiate`, there's no **Radiate** section, and each room shows the valve's own climate entity in place of Radiate's heating control and opening limit.

It uses built-in cards only, so it needs no HACS cards. Entity IDs follow Zigbee2MQTT's discovery naming (`sensor.<device>_temperature`, `climate.<device>`). A device that isn't paired yet shows as unavailable until it joins. Unset `${NAME}` variables in the house file are fine here, because the dashboard doesn't use secrets.

The integration's entity IDs come from the device name and the entity name. House entities start with `radiate_`, for example `sensor.radiate_boiler_state`. Room entities start with the room name from the house file, for example `climate.dining_room` and `sensor.dining_room_opening_limit`. Home Assistant fixes an ID when the entity first appears, so two cases break the match:

- You renamed a room after adding the integration. Rename the entity IDs to match in Home Assistant, or generate the dashboard with the old name.
- A Zigbee2MQTT device has the same name as a room, so both want the same ID and one gets `_2` added. Give the device its own name, such as `trv_lounge`.

To add it to Home Assistant:

1. Go to **Settings** > **Dashboards** > **Add dashboard** > **New dashboard from scratch**, and name it, for example "Heating".
2. Open it, select the pencil icon, then the three-dot menu > **Raw configuration editor**.
3. Replace the contents with the generated YAML and save.

Generate it again after you add rooms or rename devices, rather than editing it by hand.

## Elastic export

Radiate can send metrics and decisions to Elasticsearch. It is off unless `RADIATE_ELASTIC_URL` is set (in the App, the **Elastic URL** option).

| Variable | Meaning |
|---|---|
| `RADIATE_ELASTIC_URL` | Elasticsearch endpoint, for example `https://my-deployment.es.europe-west2.gcp.elastic-cloud.com` |
| `RADIATE_ELASTIC_API_KEY` | API key, sent as `Authorization: ApiKey <key>` |

The API key needs the `create_doc` and `auto_configure` index privileges on `metrics-radiate.*` and `logs-radiate.*`.

Each tick, Radiate queues one document per room (`metrics-radiate.room-default`), one for the boiler (`metrics-radiate.boiler-default`), and any boiler, disturbance or safe mode decisions (`logs-radiate.decision-default`). It ships them with the Bulk API in batches of up to 500 every 10 seconds, backing off to 10 minutes while Elasticsearch is unreachable. With `--config`, the queue lives in the state database and keeps up to 7 days through outages and restarts. In demo mode it is held in memory.

The room and boiler streams are designed as time series data streams. Install the index templates once, before the first export, with a key that can manage index templates:

```bash
.venv/bin/python -c "import json; from radiate.export.elastic import index_templates; print(json.dumps(index_templates()))" > radiate-templates.json
for name in radiate-room radiate-boiler radiate-decision; do
  jq ".\"$name\"" radiate-templates.json | curl -sS -X PUT "$RADIATE_ELASTIC_URL/_index_template/$name" \
    -H "Authorization: ApiKey $ADMIN_API_KEY" -H "Content-Type: application/json" -d @-
done
```

`ADMIN_API_KEY` is a key with the `manage_index_templates` cluster privilege.

## Data, backups and upgrades

### What Radiate stores

`<data_dir>/radiate.db` is a SQLite database in WAL mode, so you also see `radiate.db-wal` and `radiate.db-shm` next to it. It holds:

- Learned room models, arrival lags, lockshield caps, disturbance hold-offs and the boiler guard. A restart in the middle of a burn still honours minimum burn.
- The house ID used by Elastic and the Home Assistant integration.
- The heating mode.
- The Elastic export queue.

Radiate saves engine state every 5 minutes and when it stops cleanly. Setpoint overrides are not saved.

If the database is lost or unreadable, Radiate starts from its priors and learns again. It also gets a new house ID, so Elastic sees a new house.

### Backups

- Back up your configuration file and the data folder.
- For a consistent copy while the server runs, use `sqlite3 radiate.db ".backup radiate-backup.db"`. Otherwise stop the server and copy all three files.
- Home Assistant backups include the App's `/data` and config folders.

### Upgrades

- From source: `git pull`, then run the `uv pip install` command again.
- Docker: `git pull`, `docker build -t radiate .`, then remove and recreate the container with the same volume.
- Home Assistant App: the App version does not change with each commit yet, so Home Assistant won't offer updates. Select **Rebuild** on the App page to build it again from `main`.
- HACS integration: update it in HACS and restart Home Assistant.

Saved state carries a format version. If a new release cannot read it, Radiate logs the problem and starts from priors rather than refusing to start.

## Shelly watchdog

The watchdog is a script that runs on the Shelly relay. If Radiate's heartbeat is more than 10 minutes old, it takes over: heating follows fallback windows that Radiate derives from your room schedules, the store follows its windows, and the script keeps its own minimum burn (8 minutes) and minimum off (10 minutes). The heating relay also switches itself off 120 minutes after it was last asserted, so it can never latch on. Install the watchdog before you set `dry_run: false`.

The script assumes switch 0 is heating and switch 1 is the store. It works on Shelly Gen3 and Gen4 devices.

### Install with the CLI

From any machine with Radiate installed that can reach the Shelly:

```bash
radiate shelly install-watchdog --config radiate.yaml --yes
radiate shelly status --config radiate.yaml
```

`install-watchdog` writes, enables and starts the script even in dry run, because you asked for it with `--yes`. `status` prints both relay states and whether the script is installed, current, enabled and running; it exits non-zero if anything is missing. In Docker, run the same commands with `docker run --rm` as in step 4 of [Run your own house in Docker](#run-your-own-house-in-docker).

When the live server starts, it checks the watchdog and logs a warning if it is missing or out of date. After upgrading Radiate, run `status` again and reinstall if `current=False`.

### Install by hand

If you can't run the CLI, for example with the Home Assistant App:

1. Open the Shelly's web UI and go to **Scripts**.
2. Add a script named `radiate-watchdog` and paste the contents of [`shelly/radiate-watchdog.js`](../shelly/radiate-watchdog.js).
3. Turn on **Run on startup** and start the script.

Use the name `radiate-watchdog` so `radiate shelly status` and the server's start-up check can find it.

## Online demo

The online demo runs Radiate's simulated house entirely in your browser: [jamesagarside.github.io/radiate](https://jamesagarside.github.io/radiate/). It uses the real engine and simulator, compiled to WebAssembly with [Pyodide](https://pyodide.org/), so no server is involved and nothing you do leaves your browser. It never controls a real boiler.

On the first visit your browser downloads about 5 MB of Python from jsDelivr, then simulates 36 hours of the house so the models have learned something and the burn timeline has history. After that, the house runs at 60 times real time. You can change the speed (1x, 60x or 300x), switch the heating mode, boost hot water and light the lounge fire. The simulation pauses while the tab is hidden.

### How it is built and published

`scripts/build_demo.py` (standard library only) writes a static site to `dist/demo/`: the same web UI as the server, a Web Worker that loads Pyodide, and a zip of the Python modules the worker imports. The page sets `data-transport="demo"`, so the UI talks to the worker instead of the HTTP API. Request validation lives in `src/radiate/server/bridge.py`, which the server also uses, so the demo and the server accept the same requests.

The `Pages` workflow (`.github/workflows/pages.yml`) builds and deploys the site on every push to `main`, or when you run it by hand from the **Actions** tab. The repository's **Settings** > **Pages** > **Source** must be set to **GitHub Actions**.

To try a build locally, serve it over HTTP (a Web Worker can't load from `file://`):

```bash
python scripts/build_demo.py
python -m http.server -d dist
```

Then open `http://localhost:8000/demo/`. The browser console shows load timings in `window.radiateDemoTimings`.

To update Python, change `PYODIDE_VERSION` in `web/demo-worker.js` to an exact Pyodide release that is at least two weeks old. A test checks the version format.
