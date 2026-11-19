"""Command line: `radiate serve`, `radiate sim`, `radiate check-config` and friends."""

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


def _history_store(args: argparse.Namespace):
    """The configuration and the state database's history, read from an existing file."""
    from pathlib import Path

    from radiate.server.history import History
    from radiate.server.store import Store

    site = _load(args.config)
    path = Path(args.data_dir or site.data_dir) / "radiate.db"
    if not path.exists():
        sys.exit(f"no state database at {path}: check house.data_dir or use --data-dir")
    store = Store(path)
    return site, store, History(store, site.history_days)


def _when(text: str | None, tz) -> float | None:
    from datetime import datetime

    if text is None:
        return None
    try:
        t = datetime.fromisoformat(text)
    except ValueError:
        sys.exit(f"{text!r} is not an ISO date or time, for example 2026-11-18T06:00")
    return (t if t.tzinfo else t.replace(tzinfo=tz)).timestamp()


def _replay(args: argparse.Namespace) -> None:
    import json
    from zoneinfo import ZoneInfo

    from radiate.server.replay import format_report, run_replay

    site, store, history = _history_store(args)
    tz = ZoneInfo(site.timezone)
    report = run_replay(
        site.house,
        history,
        tz,
        start=_when(args.start, tz),
        end=_when(args.end, tz),
        fresh=args.state == "fresh",
        limit=args.limit,
    )
    store.close()
    print(json.dumps(report, indent=2) if args.json else format_report(report))


def _bootstrap(args: argparse.Namespace) -> None:
    import time

    from radiate.core.bootstrap import bootstrap
    from radiate.core.persist import load_state

    site, store, history = _history_store(args)
    saved = store.get("engine")
    if saved is not None and not args.force and time.time() - saved[1] < 15 * 60:
        sys.exit(
            "Radiate saved its state in the last 15 minutes and may be running. Stop it "
            "first, as its next save would undo this, or re-run with --force."
        )
    data, saved_wall = saved if saved is not None else (None, time.time())
    merged, ticks = bootstrap(site.house, history.recent(time.time()), data)
    if merged is None:
        sys.exit("no recorded ticks to learn from")
    # Timers in the saved state are ages at the time it was saved, so keep that time.
    store.put("engine", merged, wall=saved_wall)
    store.close()
    state, _ = load_state(site.house, merged, 0.0)
    print(f"Learned from {ticks} recorded ticks; boiler guard and timers kept as saved.")
    for rid, rs in state.rooms.items():
        e = rs.est
        print(
            f"  {rid:<12} a={e.a:.2f} K/h  b={e.b:.3f} /h  d={e.d:.2f} K/h  "
            f"confidence={e.confidence:.2f}  samples={e.samples}"
        )


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
    sh = sub.add_parser("shelly", help="check the boiler relay or install its watchdog")
    sh.add_argument("action", choices=["status", "install-watchdog"])
    sh.add_argument("--config", required=True)
    sh.add_argument("--yes", action="store_true", help="confirm writing to the Shelly")
    sh.set_defaults(func=_shelly)
    r = sub.add_parser("replay", help="re-run recorded ticks and compare the actions")
    r.add_argument("--config", required=True)
    r.add_argument("--data-dir", help="override house.data_dir")
    r.add_argument("--from", dest="start", help="ISO date or time (house time zone)")
    r.add_argument("--to", dest="end", help="ISO date or time (house time zone)")
    r.add_argument(
        "--state",
        choices=["saved", "fresh"],
        default="saved",
        help="start from the state Radiate had (saved) or from priors (fresh)",
    )
    r.add_argument("--json", action="store_true", help="print the report as JSON")
    r.add_argument("--limit", type=int, default=50, help="differences to list, 0 for all")
    r.set_defaults(func=_replay)
    b = sub.add_parser("bootstrap", help="learn room models from the recorded history")
    b.add_argument("--config", required=True)
    b.add_argument("--data-dir", help="override house.data_dir")
    b.add_argument("--force", action="store_true", help="even if Radiate may be running")
    b.set_defaults(func=_bootstrap)
    return p


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
