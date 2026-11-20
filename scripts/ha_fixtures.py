"""Generate the API fixtures the Home Assistant integration is tested against.

The integration lives in its own repository (radiate-ha) and tests against `house.json` and
`state.json`: the `/api/v1/house` and `/api/v1/state` responses of the demo runtime after about
two days, with a nozzle rating, an override on Bedroom 1 and the Lounge fire switch on.

    python scripts/ha_fixtures.py OUT_DIR

writes both files to OUT_DIR. Copy them into radiate-ha's `tests/fixtures` and into
`tests/server/fixtures/ha` here, where `test_ha_contract.py` checks that the server still
returns every field the integration's fixtures use.
"""

import asyncio
import json
import sys
from dataclasses import replace
from pathlib import Path

from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.sim.reference import house_config

HOUSE_ID = "9b8f2f2e-0000-4000-8000-000000000001"
STEPS = 2941  # one minute each, from 05:30 on day 0 to about 06:30 on day 2
NOZZLE_LPH = 0.6


async def generate(steps: int = STEPS) -> tuple[dict, dict]:
    """(house, state) as the API returns them."""
    cfg = house_config()
    cfg = replace(cfg, boiler=replace(cfg.boiler, nozzle_lph=NOZZLE_LPH))
    rt = Runtime(cfg, DemoDriver(), house_id=HOUSE_ID)
    rt.fire.add("lounge")
    for _ in range(steps - 1):
        await rt.step()
    rt.set_override("bedroom_1", 21.5, minutes=90)
    await rt.step()
    return rt.house(), rt.describe()


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print(__doc__)
        return 2
    out = Path(argv[0])
    out.mkdir(parents=True, exist_ok=True)
    house, state = asyncio.run(generate())
    for name, data in (("house.json", house), ("state.json", state)):
        (out / name).write_text(json.dumps(data, indent=1) + "\n")
    print(f"wrote {out / 'house.json'} and {out / 'state.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
