"""Entry point for the Radiate Home Assistant App.

Reads App options, announces itself to the Radiate integration through Supervisor
discovery, then runs the Radiate server. Standard library only.
"""

import json
import os
import socket
import urllib.request

OPTIONS = "/data/options.json"
CONFIG_DIR = "/config"  # the App's own config folder (addon_config map)
DATA_DIR = "/data"  # persistent: engine state and the export queue
PORT = 8099


def announce(token: str) -> None:
    sup = os.environ.get("SUPERVISOR_TOKEN")
    if not sup:
        return
    body = json.dumps(
        {
            "service": "radiate",
            "config": {"host": socket.gethostname(), "port": PORT, "token": token},
        }
    ).encode()
    req = urllib.request.Request(
        "http://supervisor/discovery",
        data=body,
        headers={"Authorization": f"Bearer {sup}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except OSError as err:
        print(f"Radiate: discovery announcement failed: {err}")


def supervisor_mqtt() -> dict:
    """MQTT broker details from the Supervisor (Mosquitto App), if available."""
    sup = os.environ.get("SUPERVISOR_TOKEN")
    if not sup:
        return {}
    req = urllib.request.Request(
        "http://supervisor/services/mqtt", headers={"Authorization": f"Bearer {sup}"}
    )
    try:
        data = json.load(urllib.request.urlopen(req, timeout=10)).get("data", {})
    except (OSError, ValueError) as err:
        print(f"Radiate: no MQTT service from the Supervisor: {err}")
        return {}
    return {
        "RADIATE_MQTT_HOST": str(data.get("host", "")),
        "RADIATE_MQTT_PORT": str(data.get("port", 1883)),
        "RADIATE_MQTT_USERNAME": str(data.get("username", "")),
        "RADIATE_MQTT_PASSWORD": str(data.get("password", "")),
    }


def main() -> None:
    opts = json.load(open(OPTIONS)) if os.path.exists(OPTIONS) else {}
    token = opts.get("token") or ""
    env = dict(os.environ, RADIATE_TOKEN=token)
    if opts.get("elastic_url"):
        env["RADIATE_ELASTIC_URL"] = opts["elastic_url"]
        env["RADIATE_ELASTIC_API_KEY"] = opts.get("elastic_api_key") or ""
    announce(token)
    args = ["radiate", "serve", "--port", str(PORT)]
    if opts.get("demo", True):
        args += ["--demo", "--speed", "1"]
    else:
        path = os.path.join(CONFIG_DIR, opts.get("config_file") or "radiate.yaml")
        if not os.path.exists(path):
            raise SystemExit(f"Radiate: {path} not found. Create it or turn demo back on.")
        env.update(supervisor_mqtt())
        args += ["--config", path, "--data-dir", DATA_DIR]
    os.execvpe("radiate", args, env)


if __name__ == "__main__":
    main()
