"""Command line: `radiate serve`, `sim`, `sim-efficiency`, `check-config`, `discover`,
`schedules`, `dashboard`, `replay`, `bootstrap`, `shelly` and `users`."""

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
    # The data directory decides which household saved from the web UI applies.
    site = _load(args.config, args.data_dir) if args.config else None
    if site is not None and args.dry_run:
        import dataclasses

        site = dataclasses.replace(site, dry_run=True)
    auth_cfg = _auth_config(args, site)

    async def main() -> None:
        import aiohttp

        session = aiohttp.ClientSession()
        cleanup = []
        if site is None:
            from radiate.server.demo import demo_runtime

            if args.demo_days:
                print(f"Running the demo house for {args.demo_days} simulated days…")
            runtime = demo_runtime(days=max(0, args.demo_days), record=True)
            queue = None
            interval = 60.0 / args.speed  # one simulated minute per 1/speed real minutes
            banner = f"Radiate demo ({args.speed:g}x)"
        else:
            runtime, queue, cleanup = await _start_live(site, session)
            runtime.settings_editor = _settings_editor(args, site)
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
        _start_otlp(runtime, site, session)
        store = _state_store(runtime, args)
        security = _start_security(runtime, store, auth_cfg)
        login = await _start_login(auth_cfg, store, security, session)
        if login is not None:
            cleanup.append(login.close)
        token = os.environ.get("RADIATE_TOKEN", "")
        ingress_ip = os.environ.get("RADIATE_INGRESS_IP", "")
        _record_login_config(security, auth_cfg, login, token, ingress_ip)
        runtime.start(interval_s=interval)
        app = create_app(
            runtime,
            token=token,
            ingress_ip=ingress_ip,
            login=login,
            security=security,
            trusted_proxies=auth_cfg.trusted_proxies,
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
            if runtime.otlp is not None:
                await runtime.otlp.stop()
            for fn in reversed(cleanup):
                await fn()
            await runner.cleanup()
            await session.close()

    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(main())


def _auth_config(args: argparse.Namespace, site):
    """The `auth` section: from --auth-config if given, else the house file's."""
    from radiate.config import ConfigError
    from radiate.config.auth import AuthConfig, load_auth_file

    if args.auth_config:
        try:
            return load_auth_file(args.auth_config)
        except ConfigError as err:
            sys.exit(f"{args.auth_config}: {err}")
        except OSError as err:
            sys.exit(f"cannot read {args.auth_config}: {err.strerror}")
    return site.auth if site is not None else AuthConfig()


def _state_store(runtime, args):
    """The state database: the runtime's, else one in --data-dir, else one in memory
    (the demo). Login and the security log keep their tables in it."""
    from pathlib import Path

    from radiate.server.store import Store

    if runtime.store is not None:
        return runtime.store
    return Store(Path(args.data_dir) / "radiate.db" if args.data_dir else ":memory:")


def _start_security(runtime, store, auth_cfg):
    """The security audit log (ADR-0008), whether or not login is on."""
    from radiate.server.security import SecurityLog

    security = SecurityLog(store.db, auth_cfg.audit_days)
    runtime.security = security
    return security


def _record_login_config(security, auth_cfg, login, token: str, ingress_ip: str) -> None:
    """Say at every start how Radiate lets people in, in the security log."""
    from radiate.export import telemetry

    names = {"local": "password", "oidc": "oidc", "saml": "saml"}
    methods = [names[m["id"]] for m in login.methods()] if login is not None else []
    text = f"Login on: {', '.join(methods) or 'no method'}" if login is not None else "Login off"
    text += "; API token set" if token else "; no API token"
    if not token and login is None:
        text += ": the API is open to anyone who can reach it"
    security.record(
        telemetry.SECURITY_LOGIN_CONFIG,
        "login.config",
        text,
        {
            "radiate.auth.login": login is not None,
            "radiate.auth.methods": methods,
            "radiate.auth.token": bool(token),
            "radiate.auth.ingress": bool(ingress_ip),
            "radiate.auth.trusted_proxies": len(auth_cfg.trusted_proxies),
        },
    )


async def _start_login(auth_cfg, store, security, session):
    """Login (ADR-0006), if the configuration turns it on. Users and sessions live in
    the state database; the demo keeps them in memory unless --data-dir is given."""
    import logging

    from radiate.server.auth import Accounts, AuthSetupError, create_auth

    if not auth_cfg.enabled:
        return None
    try:
        login = await create_auth(auth_cfg, Accounts(store.db), session, security)
    except AuthSetupError as err:
        sys.exit(f"cannot start login: {err}")
    methods = ", ".join(m["id"] for m in login.methods())
    logging.getLogger("radiate").info("login on: %s", methods)
    if auth_cfg.local and login.accounts.count_users() == 0:
        logging.getLogger("radiate").warning(
            "login is on but there are no users yet. Add one with "
            "'radiate users add NAME --role admin' and the same --config or --data-dir."
        )
    return login


def _settings_editor(args: argparse.Namespace, site):
    """The web UI's Settings view: the house file as read, and the settings saved over
    it in the data directory."""
    from radiate.config import ConfigError
    from radiate.config.saved import read_settings
    from radiate.config.site import read_house_file
    from radiate.server.settings import SettingsEditor, SettingsFile

    try:
        saved = read_settings(site.data_dir)
    except ConfigError:
        saved = None  # site.settings_problems says why
    locked = {"house.dry_run": "Set by --dry-run on the command line."} if args.dry_run else {}
    return SettingsEditor.start(
        read_house_file(args.config),
        SettingsFile(site.data_dir),
        saved,
        locked=locked,
        problems=site.settings_problems,
    )


def _otlp_config(site):
    """The OpenTelemetry export's settings: the house file's `export.otlp`, else
    RADIATE_OTLP_ENDPOINT (and RADIATE_OTLP_PROTOCOL), as the App and the demo set them."""
    from radiate.config.export import parse_export

    if site is not None and site.export.otlp is not None:
        return site.export.otlp
    endpoint = os.environ.get("RADIATE_OTLP_ENDPOINT", "").strip()
    if not endpoint:
        return None
    raw = {"endpoint": endpoint}
    if os.environ.get("RADIATE_OTLP_PROTOCOL"):
        raw["protocol"] = os.environ["RADIATE_OTLP_PROTOCOL"].strip()
    export, problems = parse_export({"otlp": raw})
    if problems:
        sys.exit("RADIATE_OTLP_*: " + "; ".join(p.removeprefix("export.otlp.") for p in problems))
    return export.otlp


def _start_otlp(runtime, site, session) -> None:
    """Start the OpenTelemetry export (spec 9.1) when it is configured and enabled."""
    import logging

    from radiate.export.otlp import (
        LOGS_MAX,
        METRICS_MAX,
        OtlpExporter,
        resolve_api_key,
        safe_endpoint,
    )
    from radiate.server.store import SqliteQueue

    cfg = _otlp_config(site)
    if cfg is None:
        return
    log = logging.getLogger("radiate")
    if not cfg.enabled:
        log.info("OpenTelemetry export: configured but turned off (export.otlp.enabled)")
        return
    try:
        api_key = resolve_api_key(cfg)
    except ValueError as err:
        sys.exit(f"OpenTelemetry export: {err}")
    queues = (None, None)
    if runtime.store is not None:  # survive restarts and outages, like the Elastic queue
        queues = (
            SqliteQueue(runtime.store, METRICS_MAX, table="otlp_metrics_queue"),
            SqliteQueue(runtime.store, LOGS_MAX, table="otlp_logs_queue"),
        )
    runtime.otlp = OtlpExporter(
        cfg,
        runtime.house_id,
        {r.id: r.name for r in runtime.cfg.rooms},
        api_key,
        *queues,
    )
    runtime.otlp.start(session)
    log.info(
        "OpenTelemetry export: %s to %s every %g s%s",
        cfg.protocol,
        safe_endpoint(cfg.endpoint),
        cfg.interval_s,
        "" if api_key or cfg.headers else ", without an API key",
    )


async def _start_live(site, session):
    """Wire the live driver: SQLite store, MQTT, Shelly, then restore state."""
    import logging
    from pathlib import Path

    from radiate.drivers.live import LiveDriver
    from radiate.drivers.mqtt import MqttTransport
    from radiate.drivers.shelly import ShellyBoiler, ShellyRpc, watchdog_code
    from radiate.export.elastic import MAX_BUFFER
    from radiate.server.runtime import Runtime
    from radiate.server.setup import HouseholdSetup, SavedFile
    from radiate.server.store import SqliteQueue, Store

    log = logging.getLogger("radiate")
    if site.saved_settings:
        log.info(
            "settings: saved from the web UI, in %s: %s",
            Path(site.data_dir),
            ", ".join(site.saved_settings),
        )
    if site.household_source == "saved":
        log.info("household: saved from the web UI, in %s", Path(site.data_dir))
    for warning in _household_warnings(site):
        log.warning("household: %s", warning)
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

    runtime = Runtime(
        site.house,
        driver,
        store=store,
        household=site.household,
        timezone=site.timezone,
        schedule_use=site.schedule_use,
        fire_flag_max_s=site.fire_flag_s,
        outdoor_source=site.outdoor_source,
        outdoor_stale_after_s=site.outdoor_stale_after_s,
    )
    runtime.setup = HouseholdSetup(site, SavedFile(site.data_dir))
    for problem in runtime.restore():
        log.warning("restore: %s", problem)

    async def close() -> None:
        await driver.drain()
        await transport.stop()
        store.close()

    return runtime, SqliteQueue(store, MAX_BUFFER), [close]


def _sim(args: argparse.Namespace) -> None:
    import dataclasses

    from radiate.core import DemandMode
    from radiate.sim.reference import house_config
    from radiate.sim.runner import compare

    cfg = house_config()
    boiler = dataclasses.replace(cfg.boiler, demand_mode=DemandMode(args.demand_mode))
    baseline, radiate = compare(
        days=args.days,
        warmup_days=args.warmup,
        seed=args.seed,
        cfg=dataclasses.replace(cfg, boiler=boiler),
    )
    b, r = baseline.summary(), radiate.summary()
    width = max(len(k) for k in b)
    print(f"{'':{width}}  {'smart TRVs':>11}  {'Radiate':>8}")
    for k in b:
        print(f"{k:{width}}  {b[k]:>11}  {r[k]:>8}")


def _sim_efficiency(args: argparse.Namespace) -> None:
    from radiate.sim.compare import main

    main(args)


def _household_line(site) -> str | None:
    from radiate.config.saved import saved_path

    if site.household_source == "saved":
        return (
            f"household: saved from the web UI in {saved_path(site.data_dir)}, "
            "in place of the house file's"
        )
    if site.household_source == "house_file":
        return "household: from the house file"
    return None


def _household_warnings(site) -> list[str]:
    """The config-source trap: a saved household hides the house file's section."""
    from radiate.config.site import SAVED_SOURCE_WARNING, shadowed_household_keys

    if site.household_source != "saved" or site.file_household is None:
        return []
    out = [SAVED_SOURCE_WARNING[0].lower() + SAVED_SOURCE_WARNING[1:]]
    hidden = shadowed_household_keys(site)
    if hidden:
        out.append("house file household settings not in effect: " + ", ".join(hidden))
    return out


def _check_config(args: argparse.Namespace) -> None:
    site = _load(args.path, args.data_dir)
    print(f"{args.path}: OK")
    if site.saved_settings:
        from radiate.config.saved import settings_path

        print(f"  settings saved from the web UI in {settings_path(site.data_dir)}:")
        print(f"    {', '.join(site.saved_settings)}")
    line = _household_line(site)
    if line:
        print(f"  {line}")
    for warning in _household_warnings(site):
        print(f"  warning: {warning}")
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
        site = load_site(args.path, env=_AnyEnv(os.environ), data_dir=args.data_dir)
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
    line = _household_line(site)
    if line and site.household_source == "saved":
        print(line[0].upper() + line[1:] + ".")
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


def _load(path: str, data_dir: str | None = None):
    from radiate.config import ConfigError, load_site

    try:
        return load_site(path, data_dir=data_dir)
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


DATA_DIR_HELP = (
    "override house.data_dir: a household saved from the web UI there replaces the house "
    "file's, as it does for serve"
)


def _discover(args: argparse.Namespace) -> None:
    from pathlib import Path

    from radiate.config import MqttConfig
    from radiate.config.discover import (
        DiscoveryError,
        RenderOptions,
        discover,
        parse_payload,
        render_yaml,
    )

    if args.out and Path(args.out).exists() and not args.force:
        sys.exit(f"{args.out} already exists; use --force to overwrite it")
    base = args.base_topic.rstrip("/")
    password = args.password or os.environ.get("RADIATE_MQTT_PASSWORD") or None
    mqtt = MqttConfig(
        host=args.host,
        port=args.port,
        username=args.username or None,
        password=password,
        base_topic=base,
        client_id="radiate-discover",  # never the server's ID, which would cut it off
        tls=args.tls,
    )
    try:
        if args.from_file:
            devices_raw = Path(args.from_file).read_bytes()
            groups_raw = Path(args.groups_file).read_bytes() if args.groups_file else None
            source = Path(args.from_file).name
        else:
            from radiate.drivers.mqtt import read_retained

            devices_topic, groups_topic = f"{base}/bridge/devices", f"{base}/bridge/groups"
            try:
                got = asyncio.run(
                    read_retained(
                        mqtt,
                        [devices_topic, groups_topic],
                        args.timeout,
                        required={devices_topic},
                    )
                )
            except Exception as err:  # aiomqtt.MqttError and socket errors
                sys.exit(f"cannot read from the MQTT broker at {args.host}:{args.port}: {err}")
            if devices_topic not in got:
                sys.exit(
                    f"no retained message on {devices_topic} within {args.timeout:g} s. "
                    "Is Zigbee2MQTT running, and is --base-topic right?"
                )
            devices_raw, groups_raw = got[devices_topic], got.get(groups_topic)
            source = f"the MQTT broker at {args.host}:{args.port}"
        found = discover(
            parse_payload(devices_raw), parse_payload(groups_raw) if groups_raw else None
        )
    except DiscoveryError as err:
        sys.exit(f"cannot read the Zigbee2MQTT device list: {err}")
    except OSError as err:
        sys.exit(f"cannot read {err.filename}: {err.strerror}")
    text = render_yaml(
        found, RenderOptions(mqtt=mqtt, source=source, with_password=password is not None)
    )
    if args.out:
        try:
            with open(args.out, "w" if args.force else "x", encoding="utf-8") as fh:
                fh.write(text)
        except FileExistsError:
            sys.exit(f"{args.out} already exists; use --force to overwrite it")
    else:
        sys.stdout.write(text)
    heated = len(found.heated_rooms)
    print(
        f"discover: {heated} heated room{'s' if heated != 1 else ''}, "
        f"{len(found.passive_rooms)} sensor-only room(s), {len(found.unplaced)} unplaced "
        f"device(s), {len(found.warnings)} warning(s)"
        + (f"; wrote {args.out}" if args.out else ""),
        file=sys.stderr,
    )


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


def _users(args: argparse.Namespace) -> None:
    import getpass
    from functools import partial
    from pathlib import Path

    from radiate.config.auth import normalise_role
    from radiate.export import telemetry
    from radiate.server.auth import AccountError, Accounts
    from radiate.server.auth.passwords import password_problem
    from radiate.server.auth.service import record_session_end
    from radiate.server.security import ORIGIN_CLI, SecurityLog
    from radiate.server.store import Store

    if not args.config and not args.data_dir:
        sys.exit(
            "Use --config <house file> or --data-dir <folder>, where Radiate keeps radiate.db."
        )
    site = _load(args.config) if args.config else None
    data_dir = args.data_dir or site.data_dir
    store = Store(Path(data_dir) / "radiate.db")
    # Every change goes to the security log (ADR-0008); a running server forwards it
    # to the OpenTelemetry export at its next tick.
    audit_days = site.auth.audit_days if site is not None else 90.0
    security = SecurityLog(store.db, audit_days, origin=ORIGIN_CLI)
    accounts = Accounts(store.db, partial(record_session_end, security))

    def changed(action: str, kind: str, message: str, name: str, role: str | None) -> None:
        security.record(
            telemetry.SECURITY_USER_CHANGED,
            action,
            message,
            {
                "event.type": kind,
                "user.target.name": name,
                "user.target.roles": [role] if role else None,
                "radiate.auth.method": "cli",
            },
        )

    def new_password() -> str:
        if args.password_stdin:
            password = sys.stdin.readline().rstrip("\n")
        else:
            password = getpass.getpass("New password: ")
            if getpass.getpass("Same again: ") != password:
                sys.exit("The passwords don't match.")
        problem = password_problem(password)
        if problem:
            sys.exit(f"Password {problem}.")
        return password

    try:
        if args.action == "list":
            users = accounts.users()
            if not users:
                print("No users yet. Add one with: radiate users add NAME --role admin")
            for user in users:
                print(f"{user.username:<24} {user.role}")
            return
        if not args.name:
            sys.exit(f"radiate users {args.action} needs a username")
        if args.action == "add":
            user = accounts.add_user(args.name, new_password(), args.role or "viewer")
            changed(
                "user.added",
                "creation",
                f"User added: {user.username} ({user.role})",
                user.username,
                user.role,
            )
            print(f"Added {user.username} as {user.role}.")
        elif args.action == "reset-password":
            name = args.name.strip().lower()
            accounts.set_password(args.name, new_password())
            changed("user.password_reset", "change", f"Password reset: {name}", name, None)
            print(f"Password changed for {name}. Their sessions have ended.")
        elif args.action == "set-role":
            if not args.role:
                sys.exit("set-role needs --role admin, household or viewer")
            name = args.name.strip().lower()
            accounts.set_role(args.name, args.role)
            role = normalise_role(args.role)
            changed(
                "user.role_changed", "change", f"Role changed: {name} is now {role}", name, role
            )
            print(f"{name} is now {role}. Their sessions have ended.")
        elif args.action == "remove":
            name = args.name.strip().lower()
            accounts.remove_user(args.name)
            changed("user.removed", "deletion", f"User removed: {name}", name, None)
            print(f"Removed {name}. Their sessions have ended.")
    except AccountError as err:
        sys.exit(str(err))
    finally:
        store.close()


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
    s.add_argument(
        "--demo-days",
        type=int,
        default=0,
        help="start the demo this many simulated days in, with the example household",
    )
    s.add_argument(
        "--auth-config",
        help="YAML file with an auth section for user login, in place of the house file's",
    )
    s.set_defaults(func=_serve)
    m = sub.add_parser("sim", help="compare Radiate with smart TRVs in the simulator")
    m.add_argument("--days", type=int, default=5)
    m.add_argument("--warmup", type=int, default=2)
    m.add_argument("--seed", type=int, default=1)
    m.add_argument(
        "--demand-mode",
        choices=("eco", "comfort"),
        default="eco",
        help="how calling rooms fire the boiler (default eco)",
    )
    m.set_defaults(func=_sim)
    e = sub.add_parser(
        "sim-efficiency",
        help="compare eco with and without room use, comfort and a plain timer in the simulator",
    )
    e.add_argument("--days", type=int, default=24)
    e.add_argument("--warmup", type=int, default=3)
    e.add_argument("--seeds", default="1,2,3", help="comma-separated seeds (default 1,2,3)")
    e.add_argument(
        "--scenarios",
        default="fixed,mild,cold",
        help="comma-separated: fixed, mild, cold, owner, owner_cold (default fixed,mild,cold)",
    )
    e.add_argument("--workers", type=int, default=None, help="parallel runs (default: CPUs)")
    e.set_defaults(func=_sim_efficiency)
    c = sub.add_parser("check-config", help="validate a house configuration file")
    c.add_argument("path")
    c.add_argument("--data-dir", help=DATA_DIR_HELP)
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
    w.add_argument("--data-dir", help=DATA_DIR_HELP)
    w.set_defaults(func=_schedules)
    sh = sub.add_parser("shelly", help="check the boiler relay or install its watchdog")
    sh.add_argument("action", choices=["status", "install-watchdog"])
    sh.add_argument("--config", required=True)
    sh.add_argument("--yes", action="store_true", help="confirm writing to the Shelly")
    sh.set_defaults(func=_shelly)
    d = sub.add_parser(
        "discover", help="draft a configuration from Zigbee2MQTT's device list (read-only)"
    )
    d.add_argument("--host", default="localhost", help="MQTT broker")
    d.add_argument("--port", type=int, default=1883)
    d.add_argument("--username")
    d.add_argument("--password", help="default: $RADIATE_MQTT_PASSWORD")
    d.add_argument("--tls", action="store_true")
    d.add_argument("--base-topic", default="zigbee2mqtt")
    d.add_argument("--timeout", type=float, default=10.0, help="seconds to wait for the list")
    d.add_argument("--from-file", help="saved bridge/devices payload instead of the broker")
    d.add_argument("--groups-file", help="saved bridge/groups payload, with --from-file")
    d.add_argument("--out", help="write the configuration here instead of stdout")
    d.add_argument("--force", action="store_true", help="overwrite --out if it exists")
    d.set_defaults(func=_discover)
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
    u = sub.add_parser("users", help="manage the people who can sign in to the web UI")
    u.add_argument("action", choices=["list", "add", "reset-password", "set-role", "remove"])
    u.add_argument("name", nargs="?", help="username")
    u.add_argument(
        "--role",
        choices=["admin", "household", "viewer", "readonly"],
        help="admin, household or viewer (readonly is the same as viewer); default viewer for add",
    )
    u.add_argument("--config", help="house configuration file (for house.data_dir)")
    u.add_argument("--data-dir", help="folder holding radiate.db, in place of --config")
    u.add_argument(
        "--password-stdin", action="store_true", help="read the password from standard input"
    )
    u.set_defaults(func=_users)
    return p


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
