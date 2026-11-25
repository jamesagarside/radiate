"""SAML sign-in with signed fixture assertions (ADR-0006). Needs `radiate[saml]`.

Each test builds a response the way an identity provider would, signs its assertion with
a throwaway key and certificate, and posts it to the assertion consumer service.
"""

import base64
import datetime as dt
import re
from urllib.parse import parse_qs, urlsplit

import pytest

pytest.importorskip("onelogin.saml2", reason="SAML is the optional radiate[saml] extra")

from aiohttp.test_utils import TestClient, TestServer  # noqa: E402
from cryptography import x509  # noqa: E402
from cryptography.hazmat.primitives import hashes, serialization  # noqa: E402
from cryptography.hazmat.primitives.asymmetric import rsa  # noqa: E402
from cryptography.x509.oid import NameOID  # noqa: E402
from onelogin.saml2.utils import OneLogin_Saml2_Utils  # noqa: E402

from radiate.config.auth import AuthConfig, RoleMap, SamlConfig  # noqa: E402
from radiate.server.app import create_app  # noqa: E402
from radiate.server.auth import Accounts, AuthSetupError, create_auth  # noqa: E402
from radiate.server.auth.service import SESSION_COOKIE  # noqa: E402
from radiate.server.demo import DemoDriver  # noqa: E402
from radiate.server.runtime import Runtime  # noqa: E402
from radiate.server.store import Store  # noqa: E402
from radiate.sim.reference import house_config  # noqa: E402

PUBLIC = "https://heat.example.org"
ACS = f"{PUBLIC}/auth/saml/acs"
SP_ENTITY = f"{PUBLIC}/auth/saml/metadata"
IDP_ENTITY = "https://idp.example.org/saml"
RSA_SHA256 = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
SHA256 = "http://www.w3.org/2001/04/xmlenc#sha256"
RSA_SHA1 = "http://www.w3.org/2000/09/xmldsig#rsa-sha1"
SHA1 = "http://www.w3.org/2000/09/xmldsig#sha1"


def keypair(name: str) -> tuple[str, str]:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, name)])
    now = dt.datetime.now(dt.UTC)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - dt.timedelta(days=1))
        .not_valid_after(now + dt.timedelta(days=30))
        .sign(key, hashes.SHA256())
    )
    pem_key = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()
    return pem_key, cert.public_bytes(serialization.Encoding.PEM).decode()


IDP_KEY, IDP_CERT = keypair("idp.example.org")
OTHER_KEY, OTHER_CERT = keypair("attacker.example")


def cert_body(pem: str) -> str:
    return "".join(line for line in pem.splitlines() if "CERTIFICATE" not in line)


METADATA = f"""<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="{IDP_ENTITY}">
  <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data><ds:X509Certificate>{cert_body(IDP_CERT)}</ds:X509Certificate></ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        Location="https://idp.example.org/saml/sso"/>
  </md:IDPSSODescriptor>
</md:EntityDescriptor>
"""


def ts(delta_s: float = 0) -> str:
    t = dt.datetime.now(dt.UTC) + dt.timedelta(seconds=delta_s)
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def response_xml(
    request_id: str,
    user: str = "alex",
    groups=("heating-admins",),
    audience: str = SP_ENTITY,
    not_after_s: float = 300,
    assertion_id: str = "_a1",
    sign=True,
    key=IDP_KEY,
    cert=IDP_CERT,
    alg=RSA_SHA256,
    digest=SHA256,
) -> str:
    """A response as an IdP sends it, with its assertion signed unless `sign` is False."""
    attrs = "".join(f"<saml:AttributeValue>{g}</saml:AttributeValue>" for g in groups)
    assertion = f"""<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="{assertion_id}" Version="2.0" IssueInstant="{ts()}"><saml:Issuer>{IDP_ENTITY}</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">{user}</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="{ts(not_after_s)}" Recipient="{ACS}" InResponseTo="{request_id}"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="{ts(-60)}" NotOnOrAfter="{ts(not_after_s)}"><saml:AudienceRestriction><saml:Audience>{audience}</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="{ts()}" SessionIndex="_s1"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute Name="groups">{attrs}</saml:Attribute></saml:AttributeStatement></saml:Assertion>"""
    if sign:
        signed = OneLogin_Saml2_Utils.add_sign(
            assertion, key, cert, sign_algorithm=alg, digest_algorithm=digest
        )
        assertion = signed.decode() if isinstance(signed, bytes) else signed
        assertion = re.sub(r"^<\?xml[^>]*\?>\s*", "", assertion)
    return f"""<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r{assertion_id}" Version="2.0" IssueInstant="{ts()}" Destination="{ACS}" InResponseTo="{request_id}"><saml:Issuer>{IDP_ENTITY}</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>{assertion}</samlp:Response>"""


def b64(xml: str) -> str:
    return base64.b64encode(xml.encode()).decode()


@pytest.fixture
async def radiate(tmp_path):
    meta = tmp_path / "idp.xml"
    meta.write_text(METADATA)
    cfg = AuthConfig(
        enabled=True,
        local=False,
        public_url=PUBLIC,
        saml=SamlConfig(
            idp_metadata_file=str(meta),
            roles=RoleMap("groups", admins=("heating-admins",), viewers=("family",)),
        ),
    )
    rt = Runtime(house_config(), DemoDriver())
    await rt.step()
    login = await create_auth(cfg, Accounts(Store(":memory:").db))
    async with TestClient(TestServer(create_app(rt, login=login))) as c:
        c.login = login
        yield c


async def start(c) -> tuple[str, str]:
    """Begin a login. Returns (RelayState, the AuthnRequest ID)."""
    r = await c.get("/auth/saml/start", allow_redirects=False)
    assert r.status == 302
    q = parse_qs(urlsplit(r.headers["Location"]).query)
    request = OneLogin_Saml2_Utils.decode_base64_and_inflate(q["SAMLRequest"][0]).decode()
    request_id = re.search(r'ID="([^"]+)"', request).group(1)
    assert f'AssertionConsumerServiceURL="{ACS}"' in request
    return q["RelayState"][0], request_id


async def post(c, relay: str, xml: str):
    return await c.post(
        "/auth/saml/acs",
        data={"SAMLResponse": b64(xml), "RelayState": relay},
        allow_redirects=False,
    )


def signed_in(r) -> bool:
    return r.status == 303 and r.headers["Location"] == f"{PUBLIC}/" and SESSION_COOKIE in r.cookies


def refused(r) -> bool:
    return r.status == 302 and r.headers["Location"] == f"{PUBLIC}/login?error=sso"


def why(c) -> tuple[str, str | None]:
    """The last refused sign-in in the security log: (error.type, user.name)."""
    events = c.login.security.query(outcome="failure")["events"]
    last = next(e for e in events if e["event"] == "radiate.security.login.failed")
    return last["attributes"]["error.type"], last["attributes"].get("user.name")


async def test_metadata(radiate):
    r = await radiate.get("/auth/saml/metadata")
    body = await r.text()
    assert r.status == 200 and f'entityID="{SP_ENTITY}"' in body and ACS in body
    assert 'WantAssertionsSigned="true"' in body


async def test_signed_assertion_signs_in(radiate):
    relay, rid = await start(radiate)
    r = await post(radiate, relay, response_xml(rid))
    assert signed_in(r)
    me = await (await radiate.get("/api/v1/auth/me")).json()
    assert me["user"] == "alex" and me["role"] == "admin" and me["method"] == "saml"


async def test_viewer_and_unmapped(radiate):
    relay, rid = await start(radiate)
    assert signed_in(await post(radiate, relay, response_xml(rid, "sam", ("family",))))
    relay, rid = await start(radiate)
    xml = response_xml(rid, "guest", ("other",), assertion_id="_a2")
    assert refused(await post(radiate, relay, xml))
    assert why(radiate) == ("not_permitted", "guest")


async def test_unsigned_assertion_is_refused(radiate):
    relay, rid = await start(radiate)
    assert refused(await post(radiate, relay, response_xml(rid, sign=False)))
    assert why(radiate) == ("bad_signature", None)


async def test_tampered_assertion_is_refused(radiate):
    relay, rid = await start(radiate)
    xml = response_xml(rid, "sam", ("family",))
    xml = xml.replace(">sam<", ">alex<").replace(">family<", ">heating-admins<")
    assert refused(await post(radiate, relay, xml))
    assert why(radiate) == ("bad_signature", None)


async def test_signed_by_another_key_is_refused(radiate):
    relay, rid = await start(radiate)
    xml = response_xml(rid, key=OTHER_KEY, cert=OTHER_CERT)
    assert refused(await post(radiate, relay, xml))
    assert why(radiate) == ("bad_signature", None)


async def test_sha1_signature_is_refused(radiate):
    relay, rid = await start(radiate)
    xml = response_xml(rid, alg=RSA_SHA1, digest=SHA1)
    assert refused(await post(radiate, relay, xml))
    assert why(radiate) == ("bad_signature", None)


async def test_wrong_audience_is_refused(radiate):
    relay, rid = await start(radiate)
    xml = response_xml(rid, audience="https://other.example/sp")
    assert refused(await post(radiate, relay, xml))
    assert why(radiate) == ("wrong_audience", None)


async def test_expired_assertion_is_refused(radiate):
    relay, rid = await start(radiate)
    xml = response_xml(rid, not_after_s=-600)
    assert refused(await post(radiate, relay, xml))
    assert why(radiate) == ("expired", None)


async def test_replayed_response_is_refused(radiate):
    relay, rid = await start(radiate)
    xml = response_xml(rid)
    assert signed_in(await post(radiate, relay, xml))
    assert refused(await post(radiate, relay, xml))
    # Nor with a fresh RelayState: the request ID and the assertion ID were both used.
    relay2, _ = await start(radiate)
    assert refused(await post(radiate, relay2, xml))
    assert why(radiate) == ("bad_state", None)


async def test_unsolicited_response_is_refused(radiate):
    xml = response_xml("_never_sent")
    assert refused(await post(radiate, "made-up", xml))
    assert why(radiate) == ("bad_state", None)


async def test_response_to_another_request_is_refused(radiate):
    relay, _ = await start(radiate)
    xml = response_xml("_some_other_request")
    assert refused(await post(radiate, relay, xml))
    assert why(radiate) == ("bad_state", None)


async def test_bad_metadata_fails_at_start(tmp_path):
    meta = tmp_path / "idp.xml"
    meta.write_text(METADATA.replace(cert_body(IDP_CERT), ""))
    cfg = AuthConfig(
        enabled=True,
        public_url=PUBLIC,
        saml=SamlConfig(idp_metadata_file=str(meta), roles=RoleMap(admins=("alex",))),
    )
    with pytest.raises(AuthSetupError):
        await create_auth(cfg, Accounts(Store(":memory:").db))
