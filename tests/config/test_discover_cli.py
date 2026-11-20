"""`radiate discover` end to end: from a saved file and from a fake broker.

No real MQTT broker is used: `aiomqtt.Client` is replaced with an in-memory fake.
"""

from pathlib import Path

import aiomqtt
import pytest

from radiate.cli import main
from tests.drivers.fake_mqtt import FakeBroker

FIXTURES = Path(__file__).parent / "fixtures"
DEVICES = FIXTURES / "z2m_devices_reference.json"


def test_from_file_writes_a_config_that_check_config_accepts(tmp_path, monkeypatch, capsys):
    out = tmp_path / "radiate.yaml"
    main(["discover", "--from-file", str(DEVICES), "--username", "radiate", "--out", str(out)])
    err = capsys.readouterr().err
    assert "8 heated rooms" in err and f"wrote {out}" in err
    text = out.read_text(encoding="utf-8")
    assert "password: ${RADIATE_MQTT_PASSWORD}" in text

    monkeypatch.setenv("RADIATE_MQTT_PASSWORD", "secret")
    main(["check-config", str(out)])
    report = capsys.readouterr().out
    assert f"{out}: OK" in report
    assert "toilet       role=internal_sensor_only trv=trv_toilet" in report
    assert report.count("ACTUATED") == 1


def test_check_config_fails_until_the_secret_is_set(tmp_path, monkeypatch):
    out = tmp_path / "radiate.yaml"
    main(["discover", "--from-file", str(DEVICES), "--username", "radiate", "--out", str(out)])
    monkeypatch.delenv("RADIATE_MQTT_PASSWORD", raising=False)
    with pytest.raises(SystemExit, match="RADIATE_MQTT_PASSWORD is not set"):
        main(["check-config", str(out)])


def test_from_file_to_stdout_with_groups(capsys):
    main(
        [
            "discover",
            "--from-file",
            str(FIXTURES / "z2m_devices_mixed.json"),
            "--groups-file",
            str(FIXTURES / "z2m_groups_mixed.json"),
        ]
    )
    out = capsys.readouterr().out
    assert "  - id: study\n" in out
    assert "# username: radiate" in out


def test_never_overwrites_without_force(tmp_path):
    out = tmp_path / "radiate.yaml"
    out.write_text("keep me")
    with pytest.raises(SystemExit, match="already exists"):
        main(["discover", "--from-file", str(DEVICES), "--out", str(out)])
    assert out.read_text() == "keep me"
    main(["discover", "--from-file", str(DEVICES), "--out", str(out), "--force"])
    assert out.read_text().startswith("# Radiate configuration")


def test_bad_input_files(tmp_path):
    bad = tmp_path / "devices.json"
    bad.write_text("not json")
    with pytest.raises(SystemExit, match="not valid JSON"):
        main(["discover", "--from-file", str(bad)])
    with pytest.raises(SystemExit, match="cannot read"):
        main(["discover", "--from-file", str(tmp_path / "missing.json")])


def test_reads_the_broker_without_publishing(monkeypatch, capsys):
    broker = FakeBroker(
        {
            "home/z2m/bridge/devices": DEVICES.read_bytes(),
            "home/z2m/bridge/groups": b"[]",
        }
    )
    monkeypatch.setattr(aiomqtt, "Client", broker.client)
    monkeypatch.setenv("RADIATE_MQTT_PASSWORD", "from-env")
    main(
        [
            "discover",
            "--host",
            "192.0.2.5",
            "--port",
            "1884",
            "--username",
            "radiate",
            "--base-topic",
            "home/z2m/",
        ]
    )
    out = capsys.readouterr().out
    (client,) = broker.clients
    assert client.published == []
    assert client.subscribed == ["home/z2m/bridge/devices", "home/z2m/bridge/groups"]
    assert client.kwargs["identifier"] == "radiate-discover"
    assert client.kwargs["password"] == "from-env"
    assert "from-env" not in out
    assert "host: 192.0.2.5" in out and "port: 1884" in out
    assert "base_topic: home/z2m\n" in out
    assert "password: ${RADIATE_MQTT_PASSWORD}" in out


def test_broker_without_the_device_list(monkeypatch):
    broker = FakeBroker({})
    monkeypatch.setattr(aiomqtt, "Client", broker.client)
    with pytest.raises(SystemExit, match="is --base-topic right"):
        main(["discover", "--timeout", "0.05"])


def test_broker_unreachable(monkeypatch):
    broker = FakeBroker({})
    broker.refuse = aiomqtt.MqttError("connection refused")
    monkeypatch.setattr(aiomqtt, "Client", broker.client)
    with pytest.raises(SystemExit, match="cannot read from the MQTT broker"):
        main(["discover"])
