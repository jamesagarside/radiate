"""The `export.otlp` section of the house file (radiate.config.export)."""

import pytest

from radiate.config.export import OTLP_SETTINGS, parse_export
from radiate.config.site import ConfigError, parse_site
from radiate.export.otlp import resolve_api_key

BASE = {
    "mqtt": {"host": "broker"},
    "schedules": {"default": "00:00/16 07:00/20 22:00/16"},
    "rooms": [{"id": "lounge", "trv": "trv_lounge", "sensor": "t_lounge"}],
}


def test_defaults():
    cfg, problems = parse_export({"otlp": {"endpoint": "https://collector.example:4318"}})
    assert problems == []
    o = cfg.otlp
    assert o.enabled and o.protocol == "http/protobuf" and o.compression == "none"
    assert o.interval_s == 60 and o.signals == ("metrics", "logs") and o.dataset == "radiate"
    assert o.url("metrics") == "https://collector.example:4318/v1/metrics"
    assert o.url("logs") == "https://collector.example:4318/v1/logs"


def test_no_section_is_no_export():
    assert parse_export(None) == (parse_export({})[0], [])
    assert parse_export(None)[0].otlp is None


def test_every_option():
    cfg, problems = parse_export(
        {
            "otlp": {
                "enabled": False,
                "endpoint": "http://192.0.2.10:4318/",
                "protocol": "http/json",
                "api_key": "ApiKey abc123==",
                "headers": {"X-Scope-OrgID": "house"},
                "interval_s": "30",
                "timeout_s": 10,
                "compression": "gzip",
                "signals": ["logs"],
                "dataset": "",
            }
        }
    )
    assert problems == []
    o = cfg.otlp
    assert not o.enabled and o.protocol == "http/json" and o.compression == "gzip"
    assert o.api_key == "abc123=="  # the pasted "ApiKey " prefix is dropped
    assert o.headers == {"X-Scope-OrgID": "house"}
    assert o.interval_s == 30 and o.timeout_s == 10
    assert o.signals == ("logs",) and o.dataset == ""
    assert o.url("logs") == "http://192.0.2.10:4318/v1/logs"


@pytest.mark.parametrize(
    ("raw", "problem"),
    [
        ({}, "export.otlp.endpoint: required"),
        ({"endpoint": "ftp://x"}, "export.otlp.endpoint: must be an http"),
        ({"endpoint": "https://u:p@x"}, "not the URL"),
        ({"endpoint": "https://x/v1/metrics"}, "give the base URL"),
        ({"endpoint": "https://x", "protocol": "grpc"}, "gRPC is not supported"),
        ({"endpoint": "https://x", "interval_s": 1}, "export.otlp.interval_s: must be 10 to 3600"),
        ({"endpoint": "https://x", "api_key": "a b"}, "printable ASCII"),
        ({"endpoint": "https://x", "api_key": "a", "api_key_file": "/k"}, "not both"),
        ({"endpoint": "https://x", "headers": {"Bad Header": "v"}}, "not a valid header name"),
        ({"endpoint": "https://x", "headers": {"Content-Type": "v"}}, "set by Radiate"),
        ({"endpoint": "https://x", "signals": ["traces"]}, "export.otlp.signals"),
        ({"endpoint": "https://x", "dataset": "Bad-Name"}, "export.otlp.dataset"),
        ({"endpoint": "https://x", "colour": "red"}, "export.otlp.colour: unknown key"),
    ],
)
def test_problems(raw, problem):
    _, problems = parse_export({"otlp": raw})
    assert any(problem in p for p in problems), problems


def test_house_file_section_and_every_problem_together():
    site = parse_site(
        {**BASE, "export": {"otlp": {"endpoint": "https://x.example"}}}, env={"X": "1"}
    )
    assert site.export.otlp.endpoint == "https://x.example"
    assert parse_site(BASE, env={}).export.otlp is None
    with pytest.raises(ConfigError) as err:
        parse_site({**BASE, "boiler": {"min_burn_min": 99}, "export": {"otlp": {}}}, env={})
    assert any(p.startswith("boiler.min_burn_min") for p in err.value.problems)
    assert any(p.startswith("export.otlp.endpoint") for p in err.value.problems)


def test_api_key_from_env_substitution():
    site = parse_site(
        {**BASE, "export": {"otlp": {"endpoint": "https://x", "api_key": "${KEY}"}}},
        env={"KEY": "s3cret"},
    )
    assert site.export.otlp.api_key == "s3cret"


def test_resolve_api_key_order():
    cfg, _ = parse_export({"otlp": {"endpoint": "https://x"}})
    assert resolve_api_key(cfg.otlp, env={}) is None
    assert resolve_api_key(cfg.otlp, env={"RADIATE_OTLP_API_KEY": " k1 "}) == "k1"
    cfg, _ = parse_export({"otlp": {"endpoint": "https://x", "api_key_file": "/run/key"}})
    got = resolve_api_key(cfg.otlp, env={"RADIATE_OTLP_API_KEY": "k1"}, read=lambda p: "k2\n")
    assert got == "k2"

    def missing(path):
        raise FileNotFoundError(2, "No such file or directory")

    with pytest.raises(ValueError, match="api_key_file"):
        resolve_api_key(cfg.otlp, env={}, read=missing)
    cfg, _ = parse_export({"otlp": {"endpoint": "https://x", "api_key": "k0"}})
    assert resolve_api_key(cfg.otlp, env={"RADIATE_OTLP_API_KEY": "k1"}) == "k0"


def test_daily_figures_can_be_timed_and_turned_off():
    cfg, problems = parse_export({"otlp": {"endpoint": "https://x"}})
    assert problems == []
    assert cfg.otlp.daily_metrics is True and cfg.otlp.daily_timestamp == "end_of_day"
    cfg, problems = parse_export(
        {"otlp": {"endpoint": "https://x", "daily_metrics": False, "daily_timestamp": "day_close"}}
    )
    assert problems == []
    assert cfg.otlp.daily_metrics is False and cfg.otlp.daily_timestamp == "day_close"
    _, problems = parse_export(
        {"otlp": {"endpoint": "https://x", "daily_metrics": "yes", "daily_timestamp": "noon"}}
    )
    assert problems == [
        "export.otlp.daily_metrics: expected true or false",
        "export.otlp.daily_timestamp: must be one of end_of_day, day_close",
    ]


def test_security_events_have_their_own_export_switch():
    cfg, problems = parse_export({"otlp": {"endpoint": "https://x"}})
    assert problems == [] and cfg.otlp.security is True
    cfg, problems = parse_export({"otlp": {"endpoint": "https://x", "security": False}})
    assert problems == [] and cfg.otlp.security is False
    cfg, problems = parse_export({"otlp": {"endpoint": "https://x", "security": "false"}})
    assert problems == [] and cfg.otlp.security is False  # from the environment
    cfg, problems = parse_export({"otlp": {"endpoint": "https://x", "security": "no"}})
    assert problems == ["export.otlp.security: expected true or false"]
    assert cfg.otlp.security is True


def test_settings_schema_covers_every_key():
    keys = {item["key"] for item in OTLP_SETTINGS}
    cfg, problems = parse_export({"otlp": {"endpoint": "https://x"}})
    assert problems == []
    assert keys == {
        "enabled",
        "endpoint",
        "protocol",
        "api_key",
        "api_key_file",
        "headers",
        "interval_s",
        "timeout_s",
        "compression",
        "signals",
        "dataset",
        "daily_metrics",
        "daily_timestamp",
        "security",
    }
    for item in OTLP_SETTINGS:
        assert item["help"] and "—" not in item["help"]
