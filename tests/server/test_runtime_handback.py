"""Hand-back from the Shelly watchdog in the runtime (spec 5.7)."""

import math

from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.store import Store
from radiate.sim.reference import house_config


async def test_first_start_takes_the_relay_as_found(tmp_path):
    rt = Runtime(house_config(), DemoDriver(start_hour=5.5), store=Store(tmp_path / "r.db"))
    rt.restore()  # nothing saved yet
    assert math.isinf(rt.state.relay_unseen_s)
    rt.driver.house.heating_relay = True  # the watchdog is mid-burn
    actions = await rt.step()
    assert actions.heating_relay
    boiler = rt.describe()["boiler"]
    assert boiler["state"] == "firing" and boiler["adopted"] is True
    assert boiler["watchdog_handover"] is False
    assert any(d.code == "boiler.relay_unseen" for d in rt.decisions)
