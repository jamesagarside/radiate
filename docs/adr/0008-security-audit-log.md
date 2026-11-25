# ADR-0008: A security audit log that names who and from where

- **Status:** Proposed
- **Date:** 2026-11-24
- **Deciders:** owner ("ensure we have full security logging"; on 2026-11-25, the export switch, hashing unknown usernames, the Security log under Settings and values for household changes; then approval "providing it's OTel", and day-to-day controls behind `auth.audit_controls`); other details proposed by Claude
- **Evidence:** [ADR-0006](0006-user-login.md), [spec 8.1](../spec.md#81-server-api-v1) and [9.1](../spec.md#91-opentelemetry-export), the [telemetry schema](../telemetry.md), ECS's `event.category`, `event.type` and `event.outcome` and `user.*` fields, OpenTelemetry's `client.address`, `http.request.method`, `url.path` and `error.type`, OWASP's logging cheat sheet

## Context

Login (ADR-0006) made Radiate a system people sign in to, from the internet if they put a proxy in front of it. Until now the only trace of a refused request was `radiate.auth.denied`, a count per tick with no address and no reason, sent only when the OpenTelemetry export was on. A few `log.warning` lines covered refused sign-ins. That answers "is something wrong?" but not "who tried what, from where, and did it work?", which is what an owner needs after a lost phone, a leaked token or a password-guessing run.

Constraints:

- Radiate's rule so far is no personal data in exports: rooms by name, people only as counts, the house by a random ID. A security record without a user and an address is of little use.
- No secret may be recorded: passwords, the API token, session IDs, CSRF tokens, OIDC client secrets, the OTLP API key.
- The export is optional and often off. A security record must not depend on it.
- Logging must never break a request or the control loop, and a flood of bad requests must not fill a Raspberry Pi's disk.
- `radiate users` runs in another process, usually while the server runs.

## Options

### A. Process log lines only

- **Pros:** nothing to store; a log shipper picks them up.
- **Cons:** the Home Assistant App and most installs keep no logs for long; nothing to show in the web UI; free text is hard to query.

### B. OpenTelemetry events only

- **Pros:** one place, already built, queryable in Elastic.
- **Cons:** nothing at all with the export off, which is the default.

### C. One event, written to three places

Each security event is defined once in the telemetry schema, with ECS and OpenTelemetry names, and written to a bounded table in `radiate.db`, to the process log as one parseable line, and to the export when it runs.

- **Pros:** works with nothing else running; the same fields everywhere; the schema's tests keep it honest; admins can read it in the web UI.
- **Cons:** another table to bound and prune; personal data now leaves the house when the export is on.

## Decision

C. `radiate.server.security.SecurityLog` records every security event in three places: the `audit_log` table, the `radiate.security` logger (INFO, or WARNING for a refusal), and the export's log queue.

- **Events.** Twelve `radiate.security.*` events in `radiate.export.telemetry`: sign-in, refused sign-in (with a reason code for password, OIDC and SAML alike), sign-out, sessions that expired or were ended by a password, role or account change, 401s, 403s (role, CSRF, origin), lockouts starting and ending, user changes from `radiate users`, changes to settings, the household, the layout, learning and the modes, day-to-day controls, and the login set-up at each start. The full list and their attributes are in the [telemetry schema](../telemetry.md).
- **OpenTelemetry first.** The owner approved the export "providing it's OTel". Each event follows the OpenTelemetry Logs data model: its name in the LogRecord's `EventName`, severity 9 (`INFO`) for a success and 13 (`WARN`) for a failure. Attributes use the semantic conventions where one exists: `client.address` (not `source.address`: the conventions give `client.address` to the client behind any proxies, as seen by the server), `user.name`, `user.roles`, `user.hash`, `user_agent.original`, `http.request.method`, `url.path`, `error.type`, and `service.*` on the resource. Radiate's own attributes are under `radiate.`. Kept from ECS, as OpenTelemetry has no convention for them and Elastic Security reads them: `event.action`, `event.category`, `event.type`, `event.outcome`, `event.reason`, `user.target.name` and `user.target.roles`. `docs/telemetry.md` lists these deviations.
- **Who and from where: a deliberate exception.** Security events, and only they, carry `user.name` (the Radiate username, or the user the single sign-on provider named), `user.hash`, `client.address` and `user_agent.original`. The address takes `X-Forwarded-For` only from `auth.trusted_proxies`, with or without login, so it can't be forged from outside. Tests check that no other event can carry these attributes.
- **Usernames that match no account are hashed.** A refused password sign-in, a refusal while locked out, and a username lockout name the account when the name typed matches one. When it matches none, they record no `user.name` but OpenTelemetry's `user.hash`, the first 16 hex digits of HMAC-SHA256 of the name (trimmed and lower-cased, as the lockout counts it), never the text; the table, the API and the web UI show it as `unknown:<hash>`, because a name that matches nothing is often a password typed in the username box. The key is 32 random bytes made on first start in `<data_dir>/audit.key`, mode 0600 (`radiate.server.security.load_key`). Keyed, so a short name can't be found by hashing guesses without the file; per install, so the same mistyped name gives the same value and repeats from one person can still be told apart and counted. Without a data directory (the demo), or if the file can't be read or written, a key for that run only is used, with a warning. A name a single sign-on provider asserted is kept as it is: the provider checked it and it was never typed into Radiate. A test types a password-like name, then searches the table, the export queue and the process log for it.
- **No secrets.** `telemetry.security_record` keeps only the attributes the event's schema lists, so a secret can't ride along by accident. Settings saved in the Settings view name paths, never values, as a value can be a secret.
- **Changes from the controls name both values.** A change of the heating mode (`POST /api/v1/mode`) or the demand mode, Eco or Comfort (`POST /api/v1/settings`), is a `config.changed` record with `radiate.config.area: mode`, `radiate.config.key` (`mode` or `demand_mode`) and the old and new values in `radiate.config.before` and `radiate.config.after`, for every role, the household role's included. A household save or revert records each setting it changed by its house-file path, with old and new values, so a room adjustment saved from the week view says what it was and what it became; past 20 changes, one record names every path without values. None of these can hold a secret. Changes to the people are recorded as the one path `household.people`, with no values and no person's ID, as who lives in the house is personal data.
- **Day-to-day controls, by choice.** With `auth.audit_controls` on (the default; a live setting in the Settings view), a setpoint hold or its end, Fire lit or out, a hot-water boost, and Away or Home are `radiate.security.control.used` records: who, `radiate.control.kind`, `radiate.control.value` (the setpoint, `lit` or `out`, the boost's minutes, the away-until time, `home`), and the room or the household member's ID. Never where anyone is: presence from Home Assistant (`POST /api/v1/people/{id}/presence`) is not a control and is not recorded. Off, these stay in the decision log only. Mode and household changes are configuration and are recorded either way.
- **Tests** run sign-ins, refusals, CSRF failures, sign-out and token use, then search the table, the export queue and the process log for every password, token, session ID and CSRF token used.
- **The export has its own switch.** `export.otlp.security` (default `true`): `false` keeps every security event out of the OpenTelemetry export while the rest is sent, for an owner who doesn't want usernames and addresses to leave the house. It changes only the export.
- **The table.** `audit_log` in `radiate.db`: kept `auth.audit_days` (90 by default, 1 to 3650), and at most 100,000 events, pruned at start and hourly. Kept whether or not login or the export is on, and whatever `export.otlp.security` says; the demo without a data directory keeps it in memory. `radiate users` writes to the same table, marked as from the command line, and the running server forwards those events to the export at its next tick.
- **Floods.** Refusals of one kind from one address within a minute are folded: the first is written at once, then one more event with `radiate.security.count`. Not by username or path, which an attacker can vary freely. At most 2,000 records are queued for the export between ticks.
- **Never in the way.** Recording catches every error and logs one warning at most every ten minutes. A request or a tick never waits on or fails because of it.
- **Reading it.** `GET /api/v1/audit`, admin only, filters by outcome and user and pages by event ID. The web UI shows it to admins as the Security log, the last section of the Settings view (`#settings/security-log`). The Raw data view shows sensor data only.

## Consequences

- New `src/radiate/server/security.py`; `radiate.export.telemetry` gains the security events; the login code, the server's middleware, the stream and `radiate users` record events. `radiate.auth.denied` and `Runtime.auth_denied` are gone, as the security events cover them with more.
- `radiate.db` gains the `audit_log` table, so a backup of the data directory now holds usernames and addresses for up to `auth.audit_days`. The data directory also gains `audit.key`; a backup that holds it can test guesses against the hashed names, so keep backups as private as the database. Deleting it starts a new key: names hashed before no longer match new ones.
- With the export on, usernames and client addresses leave the house unless `export.otlp.security` is `false`. The telemetry schema's personal data section says so.
- The spec (8.1, 9.1), configuration, deployment, glossary and implementation status describe it.

## Revisit if

- Someone needs the names of existing accounts left out of refused sign-ins as well.
- The OpenTelemetry `user.*` attributes leave development stability under other names, or OpenTelemetry adds conventions for event outcome or category.
- The cloud edition (ADR-0002) needs a central audit trail across houses.
