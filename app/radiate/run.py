"""Entry point for the Radiate Home Assistant App.

Reads App options, announces itself to the Radiate integration through Supervisor
discovery, then runs the Radiate server. Standard library only.
"""

import json
import os
import socket
import urllib.request

OPTIONS = "/data/options.json"
PORT = 8099


def announce(token: str) -> None:
    sup = os.environ.get("SUPERVISOR_TOKEN")
    if not sup:
        return
    body = json.dumps(
        {"service": "radiate", "config": {"host": socket.gethostname(), "port": PORT, "token": token}}
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
    os.execvpe("radiate", args, env)


if __name__ == "__main__":
    main()
