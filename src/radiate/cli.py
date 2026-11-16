"""Command line: `radiate serve` and `radiate sim`."""

from __future__ import annotations

import argparse
import asyncio
import os
import sys


def _serve(args: argparse.Namespace) -> None:
    from aiohttp import web

    from radiate.server.app import create_app
    from radiate.server.runtime import Runtime
    from radiate.sim.reference import house_config

    if not args.demo:
        sys.exit(
            "Only --demo is available in this pre-alpha. Device drivers (Zigbee2MQTT, Shelly) "
            "are specified in docs/spec.md and land next."
        )
    from radiate.server.demo import DemoDriver

    async def main() -> None:
        runtime = Runtime(house_config(), DemoDriver())
        # One simulated minute per real `1/speed` minutes.
        runtime.start(interval_s=60.0 / args.speed)
        app = create_app(
            runtime,
            token=os.environ.get("RADIATE_TOKEN", ""),
            ingress_ip=os.environ.get("RADIATE_INGRESS_IP", ""),
        )
        runner = web.AppRunner(app)
        await runner.setup()
        await web.TCPSite(runner, args.host, args.port).start()
        print(f"Radiate demo on http://{args.host}:{args.port} ({args.speed:g}x)")
        await asyncio.Event().wait()

    asyncio.run(main())


def _sim(args: argparse.Namespace) -> None:
    from radiate.sim.runner import compare

    baseline, radiate = compare(days=args.days, warmup_days=args.warmup, seed=args.seed)
    b, r = baseline.summary(), radiate.summary()
    width = max(len(k) for k in b)
    print(f"{'':{width}}  {'smart TRVs':>11}  {'Radiate':>8}")
    for k in b:
        print(f"{k:{width}}  {b[k]:>11}  {r[k]:>8}")


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="radiate")
    sub = p.add_subparsers(required=True)
    s = sub.add_parser("serve", help="run the server and web UI")
    s.add_argument("--demo", action="store_true", help="drive the simulated reference house")
    s.add_argument("--host", default="0.0.0.0")
    s.add_argument("--port", type=int, default=8099)
    s.add_argument("--speed", type=float, default=60.0, help="demo speed-up factor")
    s.set_defaults(func=_serve)
    m = sub.add_parser("sim", help="compare Radiate with smart TRVs in the simulator")
    m.add_argument("--days", type=int, default=5)
    m.add_argument("--warmup", type=int, default=2)
    m.add_argument("--seed", type=int, default=1)
    m.set_defaults(func=_sim)
    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
