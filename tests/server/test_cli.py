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
