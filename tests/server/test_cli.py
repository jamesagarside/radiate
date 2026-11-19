import json
from pathlib import Path

from radiate.cli import build_parser

APP_RUN = Path(__file__).resolve().parents[2] / "app" / "radiate" / "run.py"


def test_serve_accepts_every_option_the_app_passes():
    args = build_parser().parse_args(
        ["serve", "--port", "8099", "--config", "/config/radiate.yaml", "--data-dir", "/data"]
    )
    assert args.config == "/config/radiate.yaml" and args.data_dir == "/data"
    args = build_parser().parse_args(["serve", "--demo", "--speed", "1", "--dry-run"])
    assert args.demo and args.dry_run and args.data_dir is None


def test_app_entry_point_builds_valid_arguments(tmp_path, monkeypatch):
    """Run app/radiate/run.py up to exec and parse what it would run."""
    import importlib.util

    (tmp_path / "radiate.yaml").write_text("rooms: []")
    (tmp_path / "options.json").write_text(json.dumps({"demo": False}))
    spec = importlib.util.spec_from_file_location("app_run", APP_RUN)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    monkeypatch.setattr(mod, "OPTIONS", str(tmp_path / "options.json"))
    monkeypatch.setattr(mod, "CONFIG_DIR", str(tmp_path))
    monkeypatch.delenv("SUPERVISOR_TOKEN", raising=False)
    captured = {}
    monkeypatch.setattr(
        mod.os, "execvpe", lambda prog, args, env: captured.update(args=args, env=env)
    )
    mod.main()
    assert captured["args"][0] == "radiate"
    build_parser().parse_args(captured["args"][1:])  # raises SystemExit if invalid


EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"


def _site_with_history(tmp_path, monkeypatch, ticks=90):
    """The example configuration, with a short recorded run in its data folder."""
    import asyncio

    import yaml

    from radiate.config import load_site
    from radiate.server.demo import DemoDriver
    from radiate.server.runtime import Runtime
    from radiate.server.store import Store

    monkeypatch.setenv("RADIATE_MQTT_PASSWORD", "m")
    monkeypatch.setenv("RADIATE_SHELLY_PASSWORD", "s")
    data = yaml.safe_load(EXAMPLE.read_text())
    data["house"]["data_dir"] = str(tmp_path / "data")
    path = tmp_path / "radiate.yaml"
    path.write_text(yaml.safe_dump(data))
    site = load_site(path)

    class Recording(DemoDriver):
        history_days = 14

    async def main():
        driver = Recording()
        rt = Runtime(site.house, driver, store=Store(tmp_path / "data" / "radiate.db"))
        rt.wall = lambda: 1_800_000_000.0 + driver.clock()
        rt.restore()
        for _ in range(ticks):
            await rt.step()
        await rt.stop()
        rt.store.close()

    asyncio.run(main())
    return path


def test_replay_command_reports_no_differences(tmp_path, monkeypatch, capsys):
    from radiate.cli import main

    path = _site_with_history(tmp_path, monkeypatch)
    main(["replay", "--config", str(path), "--json"])
    report = json.loads(capsys.readouterr().out)
    assert report["ticks"] == 90 and report["differing_ticks"] == 0
    main(["replay", "--config", str(path), "--from", "2027-01-15T07:00", "--state", "fresh"])
    out = capsys.readouterr().out
    assert out.startswith("Replayed ") and "fresh state" in out and "relay starts" in out


def test_bootstrap_command_refuses_while_running_unless_forced(tmp_path, monkeypatch, capsys):
    import pytest

    from radiate.cli import main

    path = _site_with_history(tmp_path, monkeypatch)
    with pytest.raises(SystemExit, match="may be running"):
        main(["bootstrap", "--config", str(path)])
    main(["bootstrap", "--config", str(path), "--force"])
    out = capsys.readouterr().out
    assert "Learned from 90 recorded ticks" in out and "bedroom_1" in out


def test_replay_needs_an_existing_database(tmp_path, monkeypatch):
    import pytest

    from radiate.cli import main

    monkeypatch.setenv("RADIATE_MQTT_PASSWORD", "m")
    monkeypatch.setenv("RADIATE_SHELLY_PASSWORD", "s")
    with pytest.raises(SystemExit, match="no state database"):
        main(["replay", "--config", str(EXAMPLE), "--data-dir", str(tmp_path / "none")])
