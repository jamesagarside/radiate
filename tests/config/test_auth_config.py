"""The house file's `auth` section (ADR-0006)."""

import pytest

from radiate.config import ConfigError, parse_site
from radiate.config.auth import AuthConfig, RoleMap, load_auth_file

BASE = {
    "schedules": {"default": "00:00/16 07:00/20 22:00/16"},
    "rooms": [{"id": "hall", "role": "passive"}],
}

OIDC = {
    "issuer": "https://id.example.org/realms/home/",
    "client_id": "radiate",
    "client_secret": "${OIDC_SECRET}",
    "roles_claim": "groups",
    "admins": ["heating-admins"],
    "viewers": ["family"],
}


def site(auth, env=None):
    return parse_site({**BASE, "auth": auth}, env=env or {})


def problems(auth, env=None) -> list[str]:
    with pytest.raises(ConfigError) as err:
        site(auth, env)
    return err.value.problems


def test_login_is_off_without_a_section():
    assert parse_site(BASE, env={}).auth == AuthConfig()
    assert AuthConfig().enabled is False


def test_local_login():
    auth = site({"enabled": True, "session_days": 14, "idle_days": 2}).auth
    assert auth.enabled and auth.local
    assert auth.session_s == 14 * 86400 and auth.idle_s == 2 * 86400
    assert auth.oidc is None and auth.saml is None


def test_oidc_section_with_secret_from_the_environment():
    auth = site(
        {"enabled": True, "public_url": "https://heat.example.org/", "oidc": OIDC},
        env={"OIDC_SECRET": "s3cret-value"},
    ).auth
    assert auth.public_url == "https://heat.example.org"
    assert auth.oidc.issuer == "https://id.example.org/realms/home"
    assert auth.oidc.client_secret == "s3cret-value"
    assert auth.oidc.scopes == ("openid", "profile", "email")
    assert auth.oidc.roles == RoleMap("groups", ("heating-admins",), ("family",))
    # A logged configuration never shows the secret.
    assert "s3cret-value" not in repr(auth)


def test_openid_scope_is_always_asked_for():
    auth = site(
        {
            "enabled": True,
            "public_url": "https://h.example.org",
            "oidc": {**OIDC, "scopes": ["groups"]},
        },
        env={"OIDC_SECRET": "x"},
    ).auth
    assert auth.oidc.scopes == ("openid", "groups")


def test_every_problem_is_reported():
    found = problems(
        {
            "enabled": True,
            "local": False,
            "secure_cookie": "sometimes",
            "idle_days": 40,
            "trusted_proxies": ["not-an-ip"],
            "oidc": {"issuer": "http://id.example.org", "admins": []},
            "colour": "red",
        }
    )
    text = "\n".join(found)
    for path in (
        "auth.secure_cookie",
        "auth.idle_days",
        "auth.trusted_proxies[0]",
        "auth.oidc.issuer: must use https",
        "auth.oidc.client_id: required",
        "auth.oidc.admins",
        "auth.public_url: required",
        "auth.colour: unknown key",
    ):
        assert path in text, path


def test_secret_and_secret_file_are_exclusive():
    found = problems(
        {
            "enabled": True,
            "public_url": "https://h.example.org",
            "oidc": {**OIDC, "client_secret": "a", "client_secret_file": "/run/secrets/x"},
        }
    )
    assert any("client_secret_file" in p for p in found)


def test_http_is_allowed_only_for_loopback():
    auth = site(
        {
            "enabled": True,
            "public_url": "http://localhost:8099",
            "oidc": {**OIDC, "issuer": "http://127.0.0.1:9000", "client_secret": None},
        }
    ).auth
    assert auth.oidc.issuer == "http://127.0.0.1:9000"


def test_saml_needs_one_metadata_source():
    found = problems(
        {"enabled": True, "public_url": "https://h.example.org", "saml": {"admins": ["me"]}}
    )
    assert any("idp_metadata_url" in p for p in found)
    auth = site(
        {
            "enabled": True,
            "public_url": "https://h.example.org",
            "saml": {"idp_metadata_file": "/config/idp.xml", "viewers": ["family"]},
        }
    ).auth
    assert auth.saml.idp_metadata_file == "/config/idp.xml"


def test_proxies_are_normalised():
    auth = site({"enabled": True, "trusted_proxies": ["192.0.2.1", "10.0.0.0/8"]}).auth
    assert auth.trusted_proxies == ("192.0.2.1/32", "10.0.0.0/8")


def test_role_map():
    roles = RoleMap("groups", admins=("alex",), viewers=("family",))
    assert roles.role_for("alex", ()) == "admin"
    assert roles.role_for("sam", ("family", "x")) == "viewer"
    assert roles.role_for("sam", ("other",)) is None


def test_auth_file(tmp_path):
    path = tmp_path / "auth.yaml"
    path.write_text("auth:\n  enabled: true\n  idle_days: 3\n")
    assert load_auth_file(str(path), env={}).idle_days == 3
    path.write_text("auth:\n  enabled: maybe\n")
    with pytest.raises(ConfigError):
        load_auth_file(str(path), env={})
