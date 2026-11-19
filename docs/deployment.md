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

6. Watch the log with `docker logs -f radiate`. In dry run, each write Radiate would have made appears as a `dry run: would publish` line.

The container makes outbound connections to the MQTT broker and the Shelly, so the default bridge network works as long as the host can reach both.

### Environment variables

| Variable | Meaning |
|---|---|
| `RADIATE_TOKEN` | If set, every `/api/` request except `/api/v1/health` needs the header `Authorization: Bearer <token>` |
| `RADIATE_ELASTIC_URL`, `RADIATE_ELASTIC_API_KEY` | Turn on [Elastic export](#elastic-export) |
| `RADIATE_INGRESS_IP` | Set by the Home Assistant App only. Requests from this address with an `X-Ingress-Path` header skip the token check |
| `RADIATE_WEB_DIR` | Serve the web UI from another folder, for UI development |
| Any name used as `${NAME}` in the configuration file | Substituted when the file loads |

The built-in web UI does not send a token. If you set `RADIATE_TOKEN` on a standalone install, the UI loads but cannot fetch any data. Until that changes, leave the token unset on standalone installs, keep port 8099 on a trusted network, and never expose it to the internet.

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

The integration is a thin client of the server's API. It adds entities and services to Home Assistant but contains no control logic, so heating carries on if Home Assistant stops. It needs Home Assistant 2025.1 or later and [HACS](https://hacs.xyz/).

1. In HACS, open the top-right menu, select **Custom repositories**, add `https://github.com/jamesagarside/radiate` with the type **Integration**, then download **Radiate**.
2. Restart Home Assistant.
3. Add the integration:
   - With the App: accept the discovered **Radiate** under **Settings** > **Devices & services**.
   - With a standalone server: go to **Settings** > **Devices & services** > **Add integration** > **Radiate**, and enter the server URL, for example `http://192.0.2.20:8099`, plus the token if you set one.

The integration polls the server every 30 seconds. It creates:

- A climate entity for each controllable room. Setting its target temperature (5 to 28 °C in 0.5 °C steps) sets a setpoint override, which clears when the server restarts.
- Room sensors: temperature, opening limit, heating gain, loss rate, arrival lag and confidence.
- House sensors: boiler state, starts in the last hour, predicted burn and outdoor temperature.
- Binary sensors: boiler firing, and fire for each room with an episodic heat source.
- Services: `radiate.boost_store` (`minutes`, 0 to 180, default 60) and `radiate.set_mode` (`auto`, `frost` or `off`).

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
