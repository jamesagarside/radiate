"""SAML 2.0 service provider, on python3-saml (ADR-0006). Needs `radiate[saml]`.

Validation is python3-saml's strict mode with signed assertions required and SHA-1
refused. On top of that, Radiate only accepts a response to a request it sent
(`InResponseTo`, used once) and never accepts the same assertion ID twice, so an
unsolicited or replayed response is refused.

python3-saml is synchronous; its checks are fast and local, so they run in place.
Fetching IdP metadata from a URL goes through aiohttp.
"""

from __future__ import annotations

import logging
import secrets
import time
from dataclasses import dataclass
from urllib.parse import urlsplit

from radiate.config.auth import SamlConfig

log = logging.getLogger("radiate.auth")

PENDING_TTL_S = 600.0
MAX_PENDING = 200
REPLAY_KEEP_S = 24 * 3600.0
ACS_PATH = "/auth/saml/acs"
METADATA_PATH = "/auth/saml/metadata"
RSA_SHA256 = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
SHA256 = "http://www.w3.org/2001/04/xmlenc#sha256"
INSTALL_HINT = (
    "SAML needs the optional extra: pip install 'radiate[saml]' (it needs the libxml2 and "
    "xmlsec libraries; see docs/deployment.md)"
)


class SamlError(Exception):
    """Sign-in failed. The message is for the log, never for the browser. `code` is the
    security log's `error.type` (the telemetry schema's LOGIN_ERRORS), and `user` the
    username, once the assertion has named one."""

    def __init__(self, message: str, code: str = "bad_claims", user: str | None = None):
        super().__init__(message)
        self.code = code
        self.user = user


# python3-saml reports why a response failed in words; these pick the code.
_REASON_CODES = (
    ("signature", "bad_signature"),
    ("not signed", "bad_signature"),
    ("audience", "wrong_audience"),
    ("issuer", "wrong_issuer"),
    ("expired", "expired"),
    ("notonorafter", "expired"),
    ("no longer valid", "expired"),
    ("inresponseto", "bad_state"),
)


def response_code(reason: str) -> str:
    """The security log's error.type for python3-saml's reason a response failed."""
    text = reason.lower()
    for words, code in _REASON_CODES:
        if words in text:
            return code
    return "bad_claims"


@dataclass(frozen=True, slots=True)
class SamlIdentity:
    username: str
    role: str


def available() -> bool:
    try:
        import onelogin.saml2.auth  # noqa: F401
    except ImportError:
        return False
    return True


def parse_idp_metadata(xml: str) -> dict:
    """The `idp` settings from IdP metadata XML."""
    from onelogin.saml2.constants import OneLogin_Saml2_Constants
    from onelogin.saml2.idp_metadata_parser import OneLogin_Saml2_IdPMetadataParser

    try:
        parsed = OneLogin_Saml2_IdPMetadataParser.parse(
            xml, required_sso_binding=OneLogin_Saml2_Constants.BINDING_HTTP_REDIRECT
        )
    except Exception as err:
        raise SamlError(f"cannot read the IdP metadata: {err}") from err
    idp = parsed.get("idp")
    if not idp or not (idp.get("x509cert") or idp.get("x509certMulti")):
        raise SamlError("the IdP metadata has no signing certificate")
    if not idp.get("singleSignOnService", {}).get("url"):
        raise SamlError("the IdP metadata has no HTTP-Redirect single sign-on service")
    return idp


class SamlServiceProvider:
    def __init__(self, cfg: SamlConfig, public_url: str, idp: dict, clock=time.time):
        self.cfg = cfg
        self.public_url = public_url
        self.clock = clock
        self.acs_url = f"{public_url}{ACS_PATH}"
        self.entity_id = cfg.sp_entity_id or f"{public_url}{METADATA_PATH}"
        self._pending: dict[str, tuple[str, float]] = {}  # relay state -> (request ID, at)
        self._seen: dict[str, float] = {}  # assertion ID -> keep until
        self.settings = {
            "strict": True,
            "debug": False,
            "sp": {
                "entityId": self.entity_id,
                "assertionConsumerService": {
                    "url": self.acs_url,
                    "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
                },
                "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
                "x509cert": "",
                "privateKey": "",
            },
            "idp": idp,
            "security": {
                "authnRequestsSigned": False,
                "logoutRequestSigned": False,
                "wantAssertionsSigned": True,
                "wantMessagesSigned": False,
                "wantNameId": True,
                "wantAssertionsEncrypted": False,
                "wantAttributeStatement": False,
                "requestedAuthnContext": False,
                "rejectDeprecatedAlgorithm": True,
                "rejectUnsolicitedResponsesWithInResponseTo": True,
                "signatureAlgorithm": RSA_SHA256,
                "digestAlgorithm": SHA256,
            },
        }

    def _request(self, path: str, post: dict | None = None, get: dict | None = None) -> dict:
        """python3-saml's view of a request, built from the public URL so its
        Destination and Recipient checks compare against the address people use."""
        parts = urlsplit(self.public_url)
        return {
            "https": "on" if parts.scheme == "https" else "off",
            "http_host": parts.netloc,
            "script_name": f"{parts.path.rstrip('/')}{path}",
            "get_data": get or {},
            "post_data": post or {},
        }

    def _auth(self, path: str, post: dict | None = None):
        from onelogin.saml2.auth import OneLogin_Saml2_Auth

        return OneLogin_Saml2_Auth(self._request(path, post), old_settings=self.settings)

    def metadata(self) -> str:
        from onelogin.saml2.settings import OneLogin_Saml2_Settings

        settings = OneLogin_Saml2_Settings(self.settings, sp_validation_only=True)
        xml = settings.get_sp_metadata()
        return xml.decode() if isinstance(xml, bytes) else xml

    def _prune(self, now: float) -> None:
        for k in [k for k, (_, at) in self._pending.items() if now - at >= PENDING_TTL_S]:
            del self._pending[k]
        while len(self._pending) >= MAX_PENDING:
            self._pending.pop(next(iter(self._pending)))
        for k in [k for k, until in self._seen.items() if now >= until]:
            del self._seen[k]

    def start(self) -> str:
        """Begin a login. Returns the IdP URL to send the browser to."""
        now = self.clock()
        self._prune(now)
        relay = secrets.token_urlsafe(32)
        auth = self._auth("/auth/saml/start")
        url = auth.login(return_to=relay)
        self._pending[relay] = (auth.get_last_request_id(), now)
        return url

    def finish(self, form: dict[str, str]) -> SamlIdentity:
        """Validate a POST to the ACS and map the user to a role."""
        now = self.clock()
        relay = form.get("RelayState", "")
        entry = self._pending.pop(relay, None)
        if entry is None or now - entry[1] >= PENDING_TTL_S:
            raise SamlError(
                "no sign-in was started for this response (unsolicited or replayed)", "bad_state"
            )
        request_id = entry[0]
        auth = self._auth(ACS_PATH, post=form)
        try:
            auth.process_response(request_id=request_id)
        except Exception as err:
            raise SamlError(f"response refused: {err}", response_code(str(err))) from err
        errors = auth.get_errors()
        if errors or not auth.is_authenticated():
            reason = f"{errors} {auth.get_last_error_reason()}"
            raise SamlError(f"response refused: {reason}", response_code(reason))
        assertion_id = auth.get_last_assertion_id()
        if not assertion_id or assertion_id in self._seen:
            raise SamlError("assertion already used", "replayed")
        not_after = auth.get_last_assertion_not_on_or_after()
        self._seen[assertion_id] = max(float(not_after or 0), now) + REPLAY_KEEP_S
        attributes = auth.get_attributes()
        if self.cfg.username_attribute:
            values = attributes.get(self.cfg.username_attribute) or []
            username = values[0] if values else None
        else:
            username = auth.get_nameid()
        if not isinstance(username, str) or not username:
            raise SamlError("the assertion names no user", "no_user")
        roles: tuple[str, ...] = ()
        if self.cfg.roles.claim:
            roles = tuple(
                v for v in attributes.get(self.cfg.roles.claim) or [] if isinstance(v, str)
            )
        role = self.cfg.roles.role_for(username, roles)
        if role is None:
            raise SamlError(
                f"{username} is in none of admins, households or viewers", "not_permitted", username
            )
        return SamlIdentity(username=username, role=role)
