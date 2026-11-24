# ADR-0008: A security audit log that names who and from where

- **Status:** Proposed
- **Date:** 2026-11-24
- **Deciders:** owner ("ensure we have full security logging"); details proposed by Claude
- **Evidence:** [ADR-0006](0006-user-login.md), [spec 8.1](../spec.md#81-server-api-v1) and [9.1](../spec.md#91-opentelemetry-export), the [telemetry schema](../telemetry.md), ECS's `event.category`, `event.type` and `event.outcome` and `user.*` fields, OpenTelemetry's `source.address`, `http.request.method`, `url.path` and `error.type`, OWASP's logging cheat sheet

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

- **Events.** Eleven `radiate.security.*` events in `radiate.export.telemetry`: sign-in, refused sign-in (with a reason code for password, OIDC and SAML alike), sign-out, sessions that expired or were ended by a password, role or account change, 401s, 403s (role, CSRF, origin), lockouts starting and ending, user changes from `radiate users`, changes to settings, the household, the layout and learning, and the login set-up at each start. The full list and their attributes are in the [telemetry schema](../telemetry.md).
- **Who and from where: a deliberate exception.** Security events, and only they, carry `user.name` (the Radiate username, or the user the single sign-on provider named) and `source.address`. The address takes `X-Forwarded-For` only from `auth.trusted_proxies`, with or without login, so it can't be forged from outside. A refused sign-in records the name that was tried, cut to 256 characters and stripped of control characters: someone who types their password in the username box puts it in the log, as every system that logs failed usernames does. Tests check that no other event can carry these attributes.
- **No secrets.** `telemetry.security_record` keeps only the attributes the event's schema lists, so a secret can't ride along by accident. Settings changes name paths, never values. Tests run sign-ins, refusals, CSRF failures, sign-out and token use, then search the table, the export queue and the process log for every password, token, session ID and CSRF token used.
- **The table.** `audit_log` in `radiate.db`: kept `auth.audit_days` (90 by default, 1 to 3650), and at most 100,000 events, pruned at start and hourly. Kept whether or not login or the export is on; the demo without a data directory keeps it in memory. `radiate users` writes to the same table, marked as from the command line, and the running server forwards those events to the export at its next tick.
- **Floods.** Refusals of one kind from one address within a minute are folded: the first is written at once, then one more event with `radiate.security.count`. Not by username or path, which an attacker can vary freely. At most 2,000 records are queued for the export between ticks.
- **Never in the way.** Recording catches every error and logs one warning at most every ten minutes. A request or a tick never waits on or fails because of it.
- **Reading it.** `GET /api/v1/audit`, admin only, filters by outcome and user and pages by event ID. The web UI shows it to admins as the Security log at the foot of the Raw data view.

## Consequences

- New `src/radiate/server/security.py`; `radiate.export.telemetry` gains the security events; the login code, the server's middleware, the stream and `radiate users` record events. `radiate.auth.denied` and `Runtime.auth_denied` are gone, as the security events cover them with more.
- `radiate.db` gains the `audit_log` table, so a backup of the data directory now holds usernames and addresses for up to `auth.audit_days`.
- With the export on, usernames and client addresses leave the house. The telemetry schema's personal data section says so.
- The spec (8.1, 9.1), configuration, deployment, glossary and implementation status describe it.

## Revisit if

- An owner wants security events kept out of the export while the rest is sent: a switch such as `export.otlp.security: false` would do it.
- Someone needs the attempted username left out of refused sign-ins, or hashed.
- The cloud edition (ADR-0002) needs a central audit trail across houses.
