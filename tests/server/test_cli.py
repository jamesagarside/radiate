import json
from pathlib import Path

import pytest
import yaml

from radiate.cli import build_parser, main

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


HOUSEHOLD = Path(__file__).resolve().parents[2] / "examples" / "household.yaml"


def test_schedules_prints_each_room_without_secrets(capsys, monkeypatch):
    monkeypatch.delenv("RADIATE_MQTT_PASSWORD", raising=False)
    monkeypatch.delenv("RADIATE_SHELLY_PASSWORD", raising=False)
    main(["schedules", str(HOUSEHOLD)])
    out = capsys.readouterr().out
    assert "Bedroom 1: from the household\n" in out
    assert "  Mon to Fri   19° 06:00 to 08:30 and 21:30 to 22:30, otherwise 14°\n" in out
    assert "Toilet: from the household\n  Mon to Fri   14° all day\n" in out
    assert "  Sat and Sun  15° 08:00 to 22:30, otherwise 14°\n" in out
    assert "Stairs" not in out  # passive: no schedule
    assert "Notes:" not in out


def test_schedules_names_hand_written_schedules(capsys):
    main(["schedules", str(HOUSEHOLD.with_name("reference-house.yaml"))])
    out = capsys.readouterr().out
    assert "Lounge: schedule comfort_21\n" in out
    assert "  Mon to Sun  21° 06:30 to 08:30 and 17:00 to 22:30, otherwise 16°\n" in out


def test_schedules_trvzb_payload(capsys):
    main(["schedules", str(HOUSEHOLD), "--trvzb"])
    payload = json.loads(capsys.readouterr().out)
    assert len(payload) == 8 and "trv_bedroom_3" in payload
    assert payload["trv_bedroom_3"]["weekly_schedule_monday"] == "00:00/14 07:30/19 18:00/14"
    assert payload["trv_bedroom_3"]["weekly_schedule_sunday"] == "00:00/14"
    # Internal-sensor room: written in the TRV's own frame, as the schedule mirror does.
    assert payload["trv_toilet"]["weekly_schedule_saturday"] == "00:00/15.5 08:00/16.5 22:30/15.5"


def test_schedules_and_check_config_report_dropped_periods(tmp_path, capsys):
    busy = {"up": "06:00", "bed": "22:00", "out": ["08:00-12:00", "13:30-17:00"]}
    data = {
        "mqtt": {"host": "broker"},
        "rooms": [{"id": "hall", "name": "Hall", "trv": "trv_hall", "sensor": "t_hall"}],
        "household": {"people": {"a": {"weekdays": busy}}, "rooms": {"hall": {"use": "in_use"}}},
    }
    path = tmp_path / "house.yaml"
    path.write_text(yaml.safe_dump(data))
    note = "Hall, weekdays: dropped 19° 11:30 to 13:30 to fit the TRV's limit of 6 changes a day"
    main(["schedules", str(path)])
    assert f"Notes:\n  {note}\n" in capsys.readouterr().out
    main(["check-config", str(path)])
    assert f"  note: {note}\n" in capsys.readouterr().out


def test_schedules_reports_problems(tmp_path):
    path = tmp_path / "house.yaml"
    path.write_text(
        "mqtt: {host: b}\n"
        "rooms: [{id: a, trv: t, sensor: s}]\n"
        "household:\n"
        "  people: {p: {weekdays: {up: '25:00', bed: '22:00'}}}\n"
        "  rooms: {a: {use: in_use}}\n"
    )
    with pytest.raises(SystemExit, match="'25:00' is not a time"):
        main(["schedules", str(path)])
