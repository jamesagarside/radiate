# ADR-0006: User login with local passwords, OIDC and SAML

- **Status:** Proposed
- **Date:** 2026-11-24
- **Deciders:** owner (to accept); details proposed by Claude
- **Evidence:** `src/radiate/server/app.py` (token and ingress checks), [spec 8.1](../spec.md#81-server-api-v1), [ADR-0002](0002-deployment-topology.md), [ADR-0003](0003-separate-home-assistant-integration.md), OpenID Connect Core 1.0, RFC 7636 (PKCE), RFC 9700 (OAuth 2.0 security best current practice), SAML 2.0 Web Browser SSO profile, OWASP session management and CSRF cheat sheets

## Context

Today the server has one secret, `RADIATE_TOKEN`. Every `/api/` path except `health` needs it as a Bearer header, the WebSocket stream takes it as its first message, and requests from the Home Assistant Supervisor's ingress address are trusted. The web UI asks for the token once and keeps it in `localStorage`.

That works for one person on a trusted network. It doesn't work for a household:

- Everyone shares one secret, which can't be revoked for one person without changing it for the Home Assistant integration too.
- A token in `localStorage` can be read by any script that runs on the page.
- There is no way to give someone a view of the house without also letting them change it.
- People who already run an identity provider (Authentik, Keycloak, Authelia, Microsoft Entra ID, Google) want to sign in with it.

Constraints:

- The Home Assistant integration (radiate-ha) and other machine clients use the Bearer token and must keep working unchanged. `tests/server/test_ha_contract.py` guards the response shapes; this decision must not change how they authenticate either.
- The Home Assistant App is reached through ingress, which Home Assistant already signs in. It must not ask for a second login.
- Existing installs must behave exactly as before until the owner turns login on.
- Radiate runs on a Raspberry Pi and in the App, so native dependencies cost real effort on two architectures.
- The server speaks plain HTTP. People who expose it put a reverse proxy in front for TLS.

## Options

### A. Keep the shared token only

- **Pros:** nothing to build or secure.
- **Cons:** none of the needs above are met.

### B. Delegate login to a reverse proxy (forward auth)

Trust a header such as `Remote-User` set by Authelia or oauth2-proxy.

- **Pros:** no identity code in Radiate.
- **Cons:** needs a proxy, and a header is trivially spoofed by anyone who can reach port 8099 directly. Leaves standalone installs without a login.

### C. Built-in login: local users, OIDC and SAML, with server-side sessions

- **Pros:** works standalone and behind a proxy; per-person accounts and roles; secrets stay out of the browser's script-readable storage.
- **Cons:** security-sensitive code to maintain; two new dependencies for OIDC and an optional native stack for SAML.

## Decision

C. Radiate gets built-in login, off by default, with three identity sources and server-side sessions. The Bearer token and Home Assistant ingress keep working exactly as they do now.

### Identity sources

- **Local users.** Username and password, stored in `radiate.db`. Managed with the CLI (`radiate users add`, `reset-password`, `set-role`, `remove`, `list`). Passwords are hashed with the standard library's `hashlib.scrypt` (N = 2^15, r = 8, p = 1, 16-byte random salt, 32-byte key, about 32 MB and 100 ms per check on a laptop), in a self-describing string so the cost can be raised later. Argon2id would be slightly stronger against GPUs, but it needs a native package; scrypt is memory-hard, meets OWASP's guidance at these parameters, and needs nothing extra. Hashing runs in a worker thread so the control loop never waits for it. Passwords must be 10 to 1024 characters.
- **OIDC.** Authorization code flow with PKCE (S256), `state` and `nonce`, the provider's discovery document, and ID token validation with [joserfc](https://jose.authlib.org/): signature against the provider's JWKS (asymmetric algorithms only, never `none` or HMAC), `iss` equal to the configured issuer, `aud` containing the client ID (and `azp` when there are several audiences), `exp`, `iat` and the `nonce`, with 60 s leeway. The HTTP side (discovery, the token exchange, userinfo) uses aiohttp, which Radiate already has. joserfc is maintained by the author of Authlib, does only JOSE, and pulls in only `cryptography`, which has wheels for every platform Radiate runs on. Authlib would bring a larger OAuth framework with no aiohttp client to use it with; hand-rolled JWT checks are how login bypasses happen.
- **SAML 2.0.** A service provider built on [python3-saml](https://github.com/SAML-Toolkits/python3-saml), with `strict` mode, signed assertions required, deprecated algorithms (SHA-1) rejected, `InResponseTo` checked against a request Radiate sent, and each assertion ID accepted once. python3-saml has a smaller surface than pysaml2, validates in-process through the `xmlsec` binding instead of shelling out to the `xmlsec1` program, and needs no XML schema stack. Both need libxml2 and xmlsec, and the `lxml` and `xmlsec` wheels must be built against the same libxml2. That is too heavy and too fragile for the default image and the App, so SAML is an optional extra, `radiate[saml]`. The standard image and the App leave it out; a house file with a `saml` section on an install without the extra fails to start with a message saying how to add it.

### Roles

(Superseded by the amendment below, which adds a household role.) Two roles. **Admin** can do everything the API allows. **Viewer** can read every view and the live stream, and is refused any change (403), except signing out. A household where a guest or a child should see why a room is cold without changing it needs exactly this, and nothing needs more yet. Local users get a role from the CLI. SSO users get one at each login from the provider's claims: the configured `admins` and `viewers` lists match the username or any value of the roles claim (for example a `groups` claim). Someone who matches neither is refused, so an identity provider shared with other services can't hand out access by accident.

### Sessions

- A session is a random 256-bit ID in a cookie, `radiate_session`: `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` whenever the request reached Radiate over HTTPS (directly or through a trusted proxy). `secure_cookie: always` forces it on; `never` exists only for testing on a LAN.
- The server keeps sessions in a `sessions` table in `radiate.db`, storing only the SHA-256 of the ID, so a copy of the database holds no live session.
- Sessions end after `session_days` (default 30) whatever happens, or after `idle_days` (default 7) without use. These use wall-clock time, as a session must survive restarts. Last use is written at most once a minute.
- Signing out deletes the session on the server and clears the cookie. Resetting a password, changing a role or removing a user deletes that user's sessions. A WebSocket stream whose session has ended closes with 4401 within a minute.
- A new session ID is issued at every login, so a fixed ID can't be planted.

### CSRF

A session cookie is sent automatically, so every cookie-authenticated request that changes something (any method other than GET, HEAD and OPTIONS) must carry an `X-CSRF-Token` header equal to the session's own random token, which the UI reads from `GET /api/v1/auth/me`. A cross-site page can't read that token. The password login itself only accepts `Content-Type: application/json`, which a cross-site form can't send without a CORS preflight Radiate never answers. The WebSocket stream, when it authenticates by cookie, also requires a same-origin `Origin` header, since browsers send cookies on cross-site WebSocket handshakes. SameSite=Lax is a second layer, not the defence.

### How the token and ingress coexist with sessions

The middleware checks, in order:

1. Requests from the Supervisor's ingress address with `X-Ingress-Path`: allowed, as admin. Unchanged.
2. An `Authorization` header: if present it decides alone. A valid Bearer token is allowed, as admin, with no CSRF check (no cookie is involved). A wrong one is 401, even if a session cookie is also sent. Unchanged for every existing client.
3. A valid session cookie: allowed with the session's role, with the CSRF check above.
4. Otherwise 401, except when login is off and no token is set, which stays open as it is today.

The stream's first-message token is unchanged. Login is off unless `auth.enabled` is true, so an install that doesn't add an `auth` section sees no difference at all.

### First run and lockout recovery

With login on and no users, Radiate does not offer to create the first account in the browser: whoever reached the page first would own the house. The login page says no one can sign in yet and shows the command to run where Radiate runs, `radiate users add NAME --role admin`. Anyone who can run that command can already read `radiate.db`, so it opens nothing new. The Bearer token keeps working throughout, so the Home Assistant integration is never locked out.

A forgotten password is reset the same way, `radiate users reset-password NAME`. An SSO provider that is down is bypassed by a local admin; the CLI can add one at any time.

### Failed logins

Failed password logins are limited in memory: 5 failures for one username, or 20 from one client address, within 15 minutes, lock that username or address until the oldest failure is 15 minutes old. Radiate then answers 429 with `Retry-After` and checks no password. A login for a user who doesn't exist still runs scrypt against a dummy hash, so the timing doesn't reveal which usernames exist. Someone guessing can lock a username for 15 minutes; the CLI, SSO and the token still work, which we judge acceptable for a home.

### Behind a reverse proxy

Radiate ignores `X-Forwarded-For`, `X-Forwarded-Proto` and `X-Forwarded-Host` unless the request comes from an address in `auth.trusted_proxies`. From a trusted proxy, the client address is the rightmost untrusted entry in `X-Forwarded-For` (used for rate limiting), and `X-Forwarded-Proto: https` marks the request secure (used for the cookie). The ingress check always uses the real socket address. OIDC and SAML need `auth.public_url`, the address people use, so redirect URIs never come from request headers.

### Configuration

An `auth` section in the house file, validated with the rest of it. `radiate serve --auth-config FILE` reads the same section from its own file, so the demo and the App can use it without a house file. Secrets (`client_secret`) come from `${ENV}` substitution or a `client_secret_file`. They are never logged, never in a `repr`, and never returned by the API. A future Settings view will edit the same fields.

## Consequences

- New code in `src/radiate/config/auth.py` (parsing) and `src/radiate/server/auth/` (passwords, sessions, rate limiting, OIDC, SAML, routes). `app.py`'s middleware gains the session step; the token and ingress steps are unchanged.
- `radiate.db` gains `users` and `sessions` tables. Backups of the data directory now include password hashes.
- New dependencies: `joserfc` (and with it `cryptography`) in the `server` extra; `python3-saml` (with `lxml` and `xmlsec`) only in the `saml` extra.
- New routes: `/login`, `/auth/oidc/*`, `/auth/saml/*` and `/api/v1/auth/*`, listed in spec 8.1.
- The web UI keeps the token sign-in card for servers without login, and gains a login page and a user menu.
- The spec, configuration, deployment and design docs, and the implementation status, describe all of this.
- Login still needs TLS from a reverse proxy to be safe over the internet. Radiate doesn't terminate TLS itself.

## Amendment: a household role (November 2026)

The owner decided there should be three roles: admin, household, and read only. This answers spec open question 13 and the first "Revisit if" below.

### Roles

- **admin**: everything, as before.
- **household**: day-to-day control. Setpoint overrides and holds, the heating mode (Auto, Frost, Off), the demand mode (Eco, Comfort), hot-water boost, the fire switch, away and "I'm home", and room adjustments made in the week view. Not Settings, the household setup (people, routines, temperatures, away settings), the layout, learning reset, network scans or user management.
- **viewer**, labelled "Read only" in the web UI: reads every view except Settings and changes nothing but signing out. The stored name stays `viewer` so existing users and sessions keep working; `radiate users --role readonly` is accepted for it.

The API token and ingress stay admin. Single sign-on gains a `households` list beside `admins` and `viewers`, matched against the username and the same roles claim or attribute; the highest role matched wins, and someone in no list is still refused.

### One table for every route

`radiate.server.permissions.PERMISSIONS` maps each route (method and pattern) to its lowest role: `public`, `viewer`, `household` or `admin`. The middleware reads it for every `/api/` request, after the CSRF check. A test fails when a registered route has no entry, or an entry has no route, and a route missing from the table at run time needs an admin, so a new route can't default open. A refused request gets 403 `{"error": "<their role>", "needs": "<lowest role>"}`; a viewer still sees `"error": "viewer"`, as before.

Decisions made along the way:

- **The heating mode is household.** Auto, Frost and Off are what any thermostat on the wall offers, and away already covers holidays. Turning the heating off is reversible at once by anyone in the household.
- **The layout is admin.** It only draws the house model, but it is a one-off picture of the house that everyone sees, not a day-to-day control, and a misplaced room misleads every reader. Arrange rooms shows "Ask an admin" to a household member.
- **Room adjustments are household, the rest of the setup is admin.** The week view saves adjustments with the same `PUT /api/v1/household` as the setup wizard. For a household member the server parses the draft and the household in use, drops every room's adjustments from both, and saves only if what is left is the same (`HouseholdSetup.only_adjustments`); otherwise 403. `POST household/preview` saves nothing and is household. `DELETE household` is admin.
- **`POST /api/v1/settings` is household for `demand_mode` only.** Any key added later needs an admin until it is listed in `HOUSEHOLD_SETTINGS`.
- **Reading `settings/config` is admin.** It carries device addresses, broker and provider details and who is an admin. Household and read-only users don't see the Settings tab.
- **Home Assistant's reports are admin.** `people/{id}/presence`, `ha/persons` and `outdoor` come from radiate-ha over the token, never from a person.
- **Acknowledging alerts** has no route yet. When one is added it should be household.

### Web UI

The role from `GET /api/v1/auth/me` decides what is shown. A control the role can't use stays in place, disabled, with a short tag: "Read only" for a viewer, "Ask an admin" for a household member. Nothing is left to fail with "Not saved". The server enforces the same table, so the UI is never the only check.

## Amendment: the security log (November 2026)

Every sign-in, refusal, sign-out, session end, lockout and `radiate users` change is now recorded with who and from where, in `radiate.db`, the process log and the OpenTelemetry export. See [ADR-0008](0008-security-audit-log.md). The behaviour above is unchanged.

## Revisit if

- People need a finer split than three roles, such as a guest who may set their own room only.
- A Settings view stores the `auth` section somewhere other than the house file.
- Radiate starts terminating TLS itself, or the cloud edition (ADR-0002) brings its own accounts.
- SAML's native stack becomes easy to ship in the default image, or no one uses it.
