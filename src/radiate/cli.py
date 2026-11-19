"""Command line: `radiate serve`, `radiate sim` and `radiate check-config`."""

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
        session = None
        if os.environ.get("RADIATE_ELASTIC_URL"):
            import aiohttp

            from radiate.export.elastic import ElasticExporter

            session = aiohttp.ClientSession()
            runtime.exporter = ElasticExporter(
                os.environ["RADIATE_ELASTIC_URL"],
                os.environ.get("RADIATE_ELASTIC_API_KEY", ""),
                runtime.house_id,
            )
            runtime.exporter.start(session)
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


def _check_config(args: argparse.Namespace) -> None:
    site = _load(args.path)
    print(f"{args.path}: OK")
    for r in site.house.rooms:
        dev = site.devices[r.id]
        parts = [f"role={r.role.value}"]
        if dev.trv:
            parts.append(f"trv={dev.trv}")
        if dev.sensor:
            parts.append(f"sensor={dev.sensor}")
        if r.heat_source:
            parts.append(f"heat_source={r.heat_source.value}")
        if r.actuation_enabled:
            parts.append("ACTUATED")
        print(f"  {r.id:<12} {' '.join(parts)}")
    print(f"  dry_run={site.dry_run}  shelly={'yes' if site.shelly else 'no'}")
    for note in site.notes:
        print(f"  note: {note}")


def _load(path: str):
    from radiate.config import ConfigError, load_site

    try:
        return load_site(path)
    except ConfigError as err:
        sys.exit(str(err))
    except OSError as err:
        sys.exit(f"cannot read {path}: {err.strerror}")


def _shelly(args: argparse.Namespace) -> None:
    import aiohttp

    from radiate.drivers.shelly import ShellyBoiler, ShellyRpc, watchdog_code

    site = _load(args.config)
    if site.shelly is None:
        sys.exit("the configuration has no shelly section")
    if args.action == "install-watchdog" and not args.yes:
        sys.exit(
            "This writes and starts a script on the boiler relay. It switches the boiler "
            "only when Radiate's heartbeat is missing for 10 minutes. Re-run with --yes."
        )

    async def main() -> None:
        async with aiohttp.ClientSession() as session:
            rpc = ShellyRpc(site.shelly.host, site.shelly.password, session)
            boiler = ShellyBoiler(site.shelly, rpc, dry_run=True)
            code = watchdog_code()
            if args.action == "install-watchdog":
                status = await boiler.install_watchdog(code)
            else:
                await boiler.refresh()
                if not boiler.reachable:
                    sys.exit(f"Shelly {site.shelly.host} is not reachable")
                print(f"heating relay: {'on' if boiler.heating.output else 'off'}")
                print(f"store relay:   {'on' if boiler.store.output else 'off'}")
                status = await boiler.watchdog_status(code)
            print(
                f"watchdog: installed={status.installed} current={status.code_matches} "
                f"enabled={status.enabled} running={status.running}"
            )
            if not status.ok:
                sys.exit(1)

    asyncio.run(main())


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
    c = sub.add_parser("check-config", help="validate a house configuration file")
    c.add_argument("path")
    c.set_defaults(func=_check_config)
    sh = sub.add_parser("shelly", help="check the boiler relay or install its watchdog")
    sh.add_argument("action", choices=["status", "install-watchdog"])
    sh.add_argument("--config", required=True)
    sh.add_argument("--yes", action="store_true", help="confirm writing to the Shelly")
    sh.set_defaults(func=_shelly)
    args = p.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
