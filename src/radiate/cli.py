"""Command line: `radiate serve`, `radiate sim`, `radiate check-config` and `radiate dashboard`."""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import os
import sys


def _serve(args: argparse.Namespace) -> None:
    import logging

    from aiohttp import web

    from radiate.server.app import create_app

    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )
    if args.demo == bool(args.config):
        sys.exit("Use exactly one of --demo or --config <file>.")
    site = _load(args.config) if args.config else None
    if site is not None:
        import dataclasses

        if args.dry_run:
            site = dataclasses.replace(site, dry_run=True)
        if args.data_dir:
            site = dataclasses.replace(site, data_dir=args.data_dir)

    async def main() -> None:
        import aiohttp

        session = aiohttp.ClientSession()
        cleanup = []
        if site is None:
            from radiate.server.demo import DemoDriver
            from radiate.server.runtime import Runtime
            from radiate.sim.reference import house_config

            runtime = Runtime(house_config(), DemoDriver())
            queue = None
            interval = 60.0 / args.speed  # one simulated minute per 1/speed real minutes
            banner = f"Radiate demo ({args.speed:g}x)"
        else:
            runtime, queue, cleanup = await _start_live(site, session)
            interval = 60.0
            banner = f"Radiate {'DRY RUN' if site.dry_run else 'LIVE'}"
        if os.environ.get("RADIATE_ELASTIC_URL"):
            from radiate.export.elastic import ElasticExporter

            runtime.exporter = ElasticExporter(
                os.environ["RADIATE_ELASTIC_URL"],
                os.environ.get("RADIATE_ELASTIC_API_KEY", ""),
                runtime.house_id,
                queue=queue,
            )
            runtime.exporter.start(session)
        runtime.start(interval_s=interval)
        app = create_app(
            runtime,
            token=os.environ.get("RADIATE_TOKEN", ""),
            ingress_ip=os.environ.get("RADIATE_INGRESS_IP", ""),
        )
        runner = web.AppRunner(app)
        await runner.setup()
        await web.TCPSite(runner, args.host, args.port).start()
        print(f"{banner} on http://{args.host}:{args.port}")
        try:
            await asyncio.Event().wait()
        finally:
            await runtime.stop()
            if runtime.exporter is not None:
                await runtime.exporter.stop()
            for fn in reversed(cleanup):
                await fn()
            await runner.cleanup()
            await session.close()

    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())


async def _start_live(site, session):
    """Wire the live driver: SQLite store, MQTT, Shelly, then restore state."""
    import logging
    from pathlib import Path

    from radiate.drivers.live import LiveDriver
    from radiate.drivers.mqtt import MqttTransport
    from radiate.drivers.shelly import ShellyBoiler, ShellyRpc, watchdog_code
    from radiate.export.elastic import MAX_BUFFER
    from radiate.server.runtime import Runtime
    from radiate.server.store import SqliteQueue, Store

    log = logging.getLogger("radiate")
    for note in site.notes:
        log.info("config: %s", note)
    store = Store(Path(site.data_dir) / "radiate.db")
    boiler = None
    if site.shelly is not None:
        rpc = ShellyRpc(site.shelly.host, site.shelly.password, session)
        boiler = ShellyBoiler(site.shelly, rpc, dry_run=site.dry_run)
        try:
            status = await boiler.watchdog_status(watchdog_code())
            if not status.ok:
                log.warning(
                    "Shelly watchdog not installed or not current (%s). Install it with "
                    "'radiate shelly install-watchdog' before running live.",
                    status,
                )
        except Exception as err:
            log.warning("could not check the Shelly watchdog: %s", err)

    transport: MqttTransport | None = None

    async def publish(topic, payload):
        return await transport.publish(topic, payload) if transport else False

    driver = LiveDriver(
        site,
        publish,
        boiler,
        connected=lambda: transport is not None and transport.connected,
    )

    def on_connect() -> None:
        asyncio.get_running_loop().create_task(driver.request_state())

    transport = MqttTransport(
        site.mqtt, driver.devices.subscriptions(), driver.handle_message, on_connect
    )
    transport.start()
    # Give MQTT a moment to connect and the TRVs time to answer their state reads, so
    # the first decision is not made blind.
    for _ in range(30):
        if transport.connected:
            break
        await asyncio.sleep(1)
    await asyncio.sleep(10 if transport.connected else 0)

    runtime = Runtime(site.house, driver, store=store)
    for problem in runtime.restore():
        log.warning("restore: %s", problem)

    async def close() -> None:
        await driver.drain()
        await transport.stop()
        store.close()

    return runtime, SqliteQueue(store, MAX_BUFFER), [close]


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


class _AnyEnv(dict):
    """Environment for `radiate dashboard`: every variable counts as set.

    The dashboard needs no secrets or hosts, so an unset `${NAME}` is filled with "0"
    (valid wherever the file expects a number) instead of failing the file.
    """

    def __contains__(self, key: object) -> bool:
        return True

    def __missing__(self, key: str) -> str:
        return "0"


def _dashboard(args: argparse.Namespace) -> None:
    from radiate.config import ConfigError, load_site
    from radiate.export.dashboard import dashboard_yaml

    try:
        site = load_site(args.path, env=_AnyEnv(os.environ))
    except ConfigError as err:
        sys.exit(str(err))
    except OSError as err:
        sys.exit(f"cannot read {args.path}: {err.strerror}")
    try:
        text = dashboard_yaml(site, args.title, args.hours, radiate=args.radiate)
    except ValueError as err:
        sys.exit(str(err))
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"wrote {args.output}: {len(site.house.rooms)} rooms", file=sys.stderr)
    else:
        sys.stdout.write(text)


def _schedules(args: argparse.Namespace) -> None:
    import json

    from radiate.config import ConfigError, load_site
    from radiate.config.household import compile_household

    try:
        # Schedules need no secrets or hosts, like the dashboard.
        site = load_site(args.path, env=_AnyEnv(os.environ))
    except ConfigError as err:
        sys.exit(str(err))
    except OSError as err:
        sys.exit(f"cannot read {args.path}: {err.strerror}")
    rooms = [r for r in site.house.rooms if r.controllable]
    if args.trvzb:
        # What the schedule mirror writes, in each TRV's own frame.
        payload = {
            site.devices[r.id].trv: site.mirror_payload(r.id)
            for r in rooms
            if site.devices[r.id].trv
        }
        print(json.dumps(payload, indent=2))
        return
    for r in rooms:
        source = site.devices[r.id].schedule
        print(f"{r.name}: " + ("from the household" if source is None else f"schedule {source}"))
        described = site.schedule_for(r.id).describe()
        width = max(len(label) for label, _ in described)
        for label, text in described:
            print(f"  {label:<{width}}  {text}")
    notes = compile_household(site.household).notes if site.household else ()
    if notes:
        print("Notes:")
        for note in notes:
            print(f"  {note}")


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


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="radiate")
    sub = p.add_subparsers(required=True)
    s = sub.add_parser("serve", help="run the server and web UI")
    s.add_argument("--demo", action="store_true", help="drive the simulated reference house")
    s.add_argument("--config", help="house configuration file (real devices)")
    s.add_argument("--dry-run", action="store_true", help="force dry run whatever the file says")
    s.add_argument("--data-dir", help="override house.data_dir")
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
    d = sub.add_parser("dashboard", help="print a Home Assistant dashboard for the house")
    d.add_argument("path", help="house configuration file")
    d.add_argument("--title", default="Heating", help="dashboard title")
    d.add_argument(
        "--hours",
        type=int,
        default=24,
        help="window for the live trends and history on the Rooms view (1 to 336)",
    )
    d.add_argument("-o", "--output", help="write the YAML to this file instead of stdout")
    d.add_argument(
        "--no-radiate",
        dest="radiate",
        action="store_false",
        help="leave out Radiate's own entities, for a house running Zigbee2MQTT only",
    )
    d.set_defaults(func=_dashboard)
    w = sub.add_parser("schedules", help="print each room's weekly schedule")
    w.add_argument("path", help="house configuration file")
    w.add_argument(
        "--trvzb",
        action="store_true",
        help="print the Zigbee2MQTT /set payload for each TRV as JSON",
    )
    w.set_defaults(func=_schedules)
    sh = sub.add_parser("shelly", help="check the boiler relay or install its watchdog")
    sh.add_argument("action", choices=["status", "install-watchdog"])
    sh.add_argument("--config", required=True)
    sh.add_argument("--yes", action="store_true", help="confirm writing to the Shelly")
    sh.set_defaults(func=_shelly)
    return p


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
