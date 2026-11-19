"""An in-process Shelly Gen4 RPC server for tests: Switch, KVS, Script and digest auth."""

from __future__ import annotations

import hashlib

from aiohttp import web

from radiate.drivers.shelly import challenge

REALM = "shelly2pmg4-test"


def _sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


class FakeShelly:
    def __init__(self, password: str | None = None):
        self.password = password
        self.nonce = "6a1b2c3d"
        self.switches = {0: {"output": False, "apower": 0.0}, 1: {"output": False}}
        self.kvs: dict[str, object] = {}
        self.scripts: dict[int, dict] = {}
        self.calls: list[tuple[str, dict]] = []
        self.seen_nc: set[str] = set()

    def _authorised(self, request: web.Request) -> bool:
        if not self.password:
            return True
        header = request.headers.get("Authorization", "")
        if not header.startswith("Digest "):
            return False
        p = challenge(header)
        if p.get("nonce") != self.nonce or p.get("nc") in self.seen_nc:
            return False
        ha1 = _sha(f"admin:{REALM}:{self.password}")
        ha2 = _sha(f"POST:{p['uri']}")
        ok = p["response"] == _sha(f"{ha1}:{self.nonce}:{p['nc']}:{p['cnonce']}:auth:{ha2}")
        if ok:
            self.seen_nc.add(p["nc"])
        return ok

    async def rpc(self, request: web.Request) -> web.Response:
        if not self._authorised(request):
            return web.json_response(
                {"code": 401, "message": "unauthorized"},
                status=401,
                headers={
                    "WWW-Authenticate": f'Digest qop="auth", realm="{REALM}", '
                    f'nonce="{self.nonce}", algorithm=SHA-256'
                },
            )
        body = await request.json()
        method, params = body["method"], body.get("params", {})
        self.calls.append((method, params))
        try:
            result = getattr(self, method.replace(".", "_"))(params)
        except KeyError as err:
            return web.json_response(
                {"id": body["id"], "error": {"code": -105, "message": f"not found {err}"}}
            )
        return web.json_response({"id": body["id"], "src": REALM, "result": result})

    # Switch
    def Switch_GetStatus(self, p):
        return {"id": p["id"], **self.switches[p["id"]]}

    def Switch_Set(self, p):
        sw = self.switches[p["id"]]
        was = sw["output"]
        sw["output"] = p["on"]
        if "toggle_after" in p:
            sw["timer_duration"] = p["toggle_after"]
        else:
            sw.pop("timer_duration", None)
        return {"was_on": was}

    # KVS
    def KVS_Set(self, p):
        self.kvs[p["key"]] = p["value"]
        return {"etag": "x", "rev": len(self.kvs)}

    def KVS_Get(self, p):
        return {"etag": "x", "value": self.kvs[p["key"]]}

    # Script
    def Script_List(self, _):
        return {
            "scripts": [
                {"id": i, "name": s["name"], "enable": s["enable"], "running": s["running"]}
                for i, s in self.scripts.items()
            ]
        }

    def Script_Create(self, p):
        sid = max(self.scripts, default=0) + 1
        self.scripts[sid] = {"name": p["name"], "code": "", "enable": False, "running": False}
        return {"id": sid}

    def Script_PutCode(self, p):
        s = self.scripts[p["id"]]
        assert not s["running"], "PutCode on a running script"
        s["code"] = (s["code"] if p.get("append") else "") + p["code"]
        return {"len": len(s["code"])}

    def Script_GetCode(self, p):
        code = self.scripts[p["id"]]["code"].encode()
        off = p.get("offset", 0)
        n = p.get("len", len(code))
        data = code[off : off + n]
        return {"data": data.decode(), "left": len(code) - off - len(data)}

    def Script_GetStatus(self, p):
        return {"id": p["id"], "running": self.scripts[p["id"]]["running"]}

    def Script_SetConfig(self, p):
        self.scripts[p["id"]]["enable"] = p["config"]["enable"]
        return {"restart_required": False}

    def Script_Start(self, p):
        s = self.scripts[p["id"]]
        was = s["running"]
        s["running"] = True
        return {"was_running": was}

    def Script_Stop(self, p):
        s = self.scripts[p["id"]]
        was = s["running"]
        s["running"] = False
        return {"was_running": was}

    def app(self) -> web.Application:
        app = web.Application()
        app.router.add_post("/rpc", self.rpc)
        return app
