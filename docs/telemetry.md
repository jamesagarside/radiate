# Telemetry schema

This page lists every log record and metric Radiate sends over OTLP, with their attributes, units and severities. It is the contract for anyone who builds a dashboard, an alert or a query on Radiate's OpenTelemetry export ([spec section 9.1](spec.md#91-opentelemetry-export), set up in [deployment](deployment.md#opentelemetry-export)).

The schema is defined once, in code, in `radiate.export.telemetry`. The encoder takes each metric's name, unit and instrument from it, the tests check every record the encoder emits against it, and the tables on this page are generated from it. A test fails when this page and the code disagree.

<!-- generated: version -->
Current version: **1.0**.
<!-- end generated: version -->

## Versions and how they change

Every request carries the schema version in the `radiate.schema.version` resource attribute, as `MAJOR.MINOR`.

- A **minor** version only adds: a new metric, a new event, a new optional attribute, or a new value for an attribute that lists its values. A query or dashboard built on an older minor keeps working.
- A **major** version is anything else: renaming or removing a metric, event or attribute, changing a type, unit, instrument, temporality or severity, or making an attribute required.

The tests enforce this. `tests/server/fixtures/telemetry` holds a snapshot of every published version. Each snapshot must match the version it is named after, and every later snapshot with the same major must contain everything it does, unchanged.

To change the schema:

1. Edit the tables in `src/radiate/export/telemetry.py`.
2. Bump `SCHEMA_VERSION`: the minor for an addition, the major for anything else.
3. Run `.venv/bin/python scripts/telemetry_docs.py --snapshot`. It rewrites the tables on this page and writes the new version's snapshot. It refuses to overwrite a published snapshot.
4. For a major version, say what broke under [Changes](#changes), and call it out in the pull request.

## Personal data

Radiate never sends the name of a person or a place. Rooms are sent by ID and name, people only as counts, and the house by a random ID. A settings change sends which settings changed, never their values, as a value can be a secret.

The one exception is the security audit events, `radiate.security.*` ([ADR-0008](adr/0008-security-audit-log.md)). A security record that doesn't say who and from where is no use, so these carry `user.name` (the Radiate username, or the user a single sign-on provider named) and `source.address` (the client's IP address, from `X-Forwarded-For` only through `auth.trusted_proxies`). No other event carries either. No event ever carries a password, an API token, a session ID, a CSRF token or any other secret: each record keeps only the attributes its event lists below, and the tests check every record, the stored audit log and the process log for them. The same events are kept in Radiate's own security log whether or not the export is on.

- **Refused sign-ins.** A refused password sign-in, or a lockout, names the account when the name typed matches one. When it matches none, it records `unknown:` and 16 hex digits of an HMAC-SHA256 of the name instead of the text, as a name that matches nothing is often a password typed in the wrong box. The key is made once per install and kept in the data directory as `audit.key`, readable by Radiate's user only, and never leaves the house, so the same mistyped name always gives the same value (repeats can be counted) but the value can't be turned back into the name, even for a short one, without that file. A name a single sign-on provider asserted is recorded as it is: the provider checked it, and it was never typed into Radiate.
- **Changes with values.** A change to the heating mode or the demand mode, and each setting changed in the household setup (a room adjustment from the week view, a temperature), carries `radiate.config.key` with its old and new values in `radiate.config.before` and `radiate.config.after`. None of these can hold a secret. Changes to the people in the household are recorded as `household.people`, with no values and no person's ID. Settings saved in the Settings view still carry only their paths.
- **Keeping them in the house.** `export.otlp.security: false` keeps every security event out of the export, while the rest is sent. Radiate still records them in its own security log and the process log.

## Resource

Every metric and log request carries these resource attributes.

<!-- generated: resource -->
| Attribute | Type | | Description |
|---|---|---|---|
| `service.name` (OpenTelemetry) | string | required | Always `radiate`. |
| `service.version` (OpenTelemetry) | string | required | Radiate's version. |
| `service.instance.id` (OpenTelemetry) | string | required | The random house ID, the same as `radiate.house.id`. |
| `radiate.house.id` | string | required | The random house ID (a UUID). |
| `radiate.schema.version` | string | required | This schema's version, MAJOR.MINOR. |
| `data_stream.dataset` (ECS) | string | optional | Elastic's routing: `radiate` sends metrics to `metrics-radiate.otel-default`. Left out when `export.otlp.dataset` is empty. |
<!-- end generated: resource -->

The instrumentation scope is `radiate`, with Radiate's version.

## Log records

Each log record is one event. Its kind is in the log record's event name field (OpenTelemetry's `event_name`), and nowhere else: there is no `event.name` attribute. `event.action` holds the reason code, such as `boiler.lead`, as in the Elastic export's decision stream, so you can filter one kind of decision without parsing the message. The body is the message as the web UI shows it.

| Severity text | Severity number | Used for |
|---|---|---|
| `INFO` | 9 | What Radiate decided or what changed |
| `WARN` | 13 | Alerts, learning that was dropped, refused sign-ins and requests, lockouts and lost data |

A record's time is when it happened. A mode or settings change made through the API, and every security event, happens between ticks and is sent with the next tick, with its own time. A user change made with `radiate users` is sent by the running server's next tick.

Security events (`radiate.security.*`) follow ECS: `event.category` is `authentication`, `web`, `iam` or `configuration`, `event.type` says what within it (`start`, `end`, `info`, `access`, `change`, `creation`, `deletion`), and `event.outcome` is `success` or `failure`, so an Elastic Security rule or a SIEM reads them without mapping. Refusals of one kind from one address within a minute are folded: the first is sent at once, and one more record carries `radiate.security.count`, how many followed it. Room events carry `radiate.room.id`, and `radiate.room.name` when the room is in the house file.

<!-- generated: events -->
| Event | Severity | `event.action` | Description |
|---|---|---|---|
| `radiate.decision` | INFO | Every reason code not listed for another event: `boiler.*`, `demand.*`, `disturbance.*`, `room.*`, `safe_mode.*`, `learning.paused`, `learning.relearn`. | A decision the control loop made that a person might ask about. |
| `radiate.alert` | WARN | The alert's code, such as `valve.stuck`, `driver.mqtt` or `boiler.no_heat`. | An alert, when it first appears or its message changes. |
| `radiate.alert.cleared` | INFO | The cleared alert's code, so it pairs with its `radiate.alert`. | An alert that no longer holds. |
| `radiate.boiler.burn` | INFO | `boiler.burn`. | A burn ended: the heating relay went off. |
| `radiate.mode.changed` | INFO | `mode.changed`. | The heating mode or the demand mode was changed through the API. |
| `radiate.presence.changed` | INFO | `away.*`. | Who counts as home or away changed what the house does. People only as counts. |
| `radiate.learning.invalidated` | WARN | `learning.invalidated`, `learning.reset`. | A room's learned model was dropped, invalidated by a release, or reset. |
| `radiate.settings.changed` | INFO | `settings.saved`, `settings.reverted`, `household.setup`. | Settings were saved or reverted in the web UI, or the household setup changed. |
| `radiate.export.dropped` | WARN | `export.dropped`. | The OpenTelemetry export lost data: a full queue dropped its oldest records, or the collector rejected some. At most one record an hour for each signal and cause, with the count since the last. |
| `radiate.security.login` | INFO | `login`. | Someone signed in: with a password, OIDC or SAML. Security audit. |
| `radiate.security.login.failed` | WARN | `login`. | A sign-in was refused, with why. Security audit. |
| `radiate.security.logout` | INFO | `logout`. | Someone signed out. Security audit. |
| `radiate.security.session.ended` | INFO | `session.expired`, `session.idle`, `session.revoked`. | Sessions ended without signing out: they expired, or a password, role or account changed. Security audit. |
| `radiate.security.request.refused` | WARN | `request.refused`, `stream.refused`. | An API request or a stream connection was refused for missing or wrong credentials (401, or the stream closed with 4401). Security audit. |
| `radiate.security.access.denied` | WARN | `access.denied`. | An authenticated request was refused (403): the role may not make it, the CSRF token was wrong, or the stream's Origin was another site. Security audit. |
| `radiate.security.lockout.started` | WARN | `lockout.started`. | Too many failed password sign-ins locked a username or a client address. Security audit. |
| `radiate.security.lockout.ended` | INFO | `lockout.ended`. | A sign-in lockout ended. Security audit. |
| `radiate.security.user.changed` | INFO | `user.added`, `user.removed`, `user.password_reset`, `user.role_changed`. | A user was added, removed, given a new password or a new role, with `radiate users`. Security audit. |
| `radiate.security.config.changed` | INFO | `settings.saved`, `settings.reverted`, `household.saved`, `household.reverted`, `layout.saved`, `learning.reset`, `mode.changed`. | Someone changed how Radiate runs: settings, the household setup, the layout, learned models, or the heating or demand mode. Who and what. Old and new values only for a mode and the household, which hold no secret; one record for each household setting changed, or one naming them all past 20. Security audit. |
| `radiate.security.login.config` | INFO | `login.config`. | How Radiate lets people in, at every start. Security audit. |
<!-- end generated: events -->

### Attributes by event

<!-- generated: event-details -->
#### `radiate.decision`

A decision the control loop made that a person might ask about. Severity INFO (9). Body: The reason's message, as the web UI shows it.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.room.id` | string | optional | The room's ID from the house file. |
| `radiate.room.name` | string | optional | The room's name from the house file. |
| `radiate.room.temperature` | double, `Cel` | optional | The room's temperature when it happened. |
| `radiate.room.target` | double, `Cel` | optional | The room's target then. |
| `radiate.boiler.predicted_burn` | double, `min` | optional | The burn length the boiler guard predicted. |
| `radiate.boiler.pooled_demand` | double, `min` | optional | The demand pooled before the boiler lit. |

#### `radiate.alert`

An alert, when it first appears or its message changes. Severity WARN (13). Body: The alert's message.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.room.id` | string | optional | The room's ID from the house file. |
| `radiate.room.name` | string | optional | The room's name from the house file. |

#### `radiate.alert.cleared`

An alert that no longer holds. Severity INFO (9). Body: The alert's last message, after `Cleared: `.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.room.id` | string | optional | The room's ID from the house file. |
| `radiate.room.name` | string | optional | The room's name from the house file. |

#### `radiate.boiler.burn`

A burn ended: the heating relay went off. Severity INFO (9). Body: `Burn ended after <n> min`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.burn.duration` | double, `s` | required | How long the heating relay was on. |
| `radiate.dry_run` | bool | required | Radiate was not running the boiler: the burn is its intention, not the boiler's. |

#### `radiate.mode.changed`

The heating mode or the demand mode was changed through the API. Severity INFO (9). Body: `Heating mode changed from auto to frost`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.mode.kind` | string | required | Which mode changed: the heating mode or the demand mode. One of `heating`, `demand`. |
| `radiate.mode.before` | string | required | The mode before the change. One of `auto`, `off`, `frost`, `eco`, `comfort`. |
| `radiate.mode.after` | string | required | The mode after the change. One of `auto`, `off`, `frost`, `eco`, `comfort`. |

#### `radiate.presence.changed`

Who counts as home or away changed what the house does. People only as counts. Severity INFO (9). Body: The reason's message, which never names a person.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.people.home` | int, `{person}` | optional | How many people count as home. |
| `radiate.people.away` | int, `{person}` | optional | How many people count as away. |

#### `radiate.learning.invalidated`

A room's learned model was dropped, invalidated by a release, or reset. Severity WARN (13). Body: The learning note's message.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.room.id` | string | optional | The room's ID from the house file. |
| `radiate.room.name` | string | optional | The room's name from the house file. |

#### `radiate.settings.changed`

Settings were saved or reverted in the web UI, or the household setup changed. Severity INFO (9). Body: `Settings saved: 2 changed`, or the household setup's message.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.settings.paths` | string[] | required | The settings that changed, as house-file paths such as `boiler.min_burn_min`. Never their values, which can be secrets. |
| `radiate.settings.restart_required` | bool | required | Some of the changes take effect at the next start. |

#### `radiate.export.dropped`

The OpenTelemetry export lost data: a full queue dropped its oldest records, or the collector rejected some. At most one record an hour for each signal and cause, with the count since the last. Severity WARN (13). Body: `<n> queued metric records dropped: queue full`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.export.signal` | string | required | Which queue lost the data. One of `metrics`, `logs`. |
| `radiate.export.dropped` | int, `{record}` | required | How much was lost since the last report: queued records (a tick, a closed day or a log record) for a full queue, a 400 or a 413; data points or log records for a partial success. |
| `error.type` (OpenTelemetry) | string | required | Why: the queue was full, the collector answered 400 or 413, or it rejected part of a batch. One of `queue_full`, `400`, `413`, `partial_success`. |

#### `radiate.security.login`

Someone signed in: with a password, OIDC or SAML. Security audit. Severity INFO (9). Body: `Signed in: alice (admin, password)`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `user.name` (ECS) | string | required | Who: the Radiate username, or the user the single sign-on provider named. For a refused password sign-in or a lockout, the account tried, or `unknown:` and a keyed hash when the name matches no account, never the text typed. Left out when no one is known, and for the API token, ingress and the command line. |
| `user.roles` (ECS) | string[] | required | Their Radiate role: `admin`, `household` or `viewer`. |
| `source.address` (OpenTelemetry) | string | optional | The client's IP address: the connection's, or from X-Forwarded-For only when the request came through one of `auth.trusted_proxies`. Left out for the command line. |
| `radiate.auth.method` | string | required | How the person signed in, or how the request was authenticated. One of `password`, `oidc`, `saml`, `session`, `token`, `ingress`, `open`, `cli`. |

#### `radiate.security.login.failed`

A sign-in was refused, with why. Security audit. Severity WARN (13). Body: `Sign-in refused for alice: wrong password`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `user.name` (ECS) | string | optional | Who: the Radiate username, or the user the single sign-on provider named. For a refused password sign-in or a lockout, the account tried, or `unknown:` and a keyed hash when the name matches no account, never the text typed. Left out when no one is known, and for the API token, ingress and the command line. |
| `source.address` (OpenTelemetry) | string | optional | The client's IP address: the connection's, or from X-Forwarded-For only when the request came through one of `auth.trusted_proxies`. Left out for the command line. |
| `radiate.auth.method` | string | required | How the person signed in, or how the request was authenticated. One of `password`, `oidc`, `saml`, `session`, `token`, `ingress`, `open`, `cli`. |
| `error.type` (OpenTelemetry) | string | required | Why the sign-in was refused. One of `bad_request`, `bad_password`, `unknown_user`, `rate_limited`, `bad_state`, `provider_error`, `bad_signature`, `wrong_issuer`, `wrong_audience`, `expired`, `bad_nonce`, `bad_claims`, `replayed`, `no_user`, `not_permitted`. |
| `radiate.security.count` | int, `{event}` | optional | How many identical events this record stands for, when repeats within a minute were folded into one. Left out for one. |

#### `radiate.security.logout`

Someone signed out. Security audit. Severity INFO (9). Body: `Signed out: alice`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `user.name` (ECS) | string | required | Who: the Radiate username, or the user the single sign-on provider named. For a refused password sign-in or a lockout, the account tried, or `unknown:` and a keyed hash when the name matches no account, never the text typed. Left out when no one is known, and for the API token, ingress and the command line. |
| `user.roles` (ECS) | string[] | optional | Their Radiate role: `admin`, `household` or `viewer`. |
| `source.address` (OpenTelemetry) | string | optional | The client's IP address: the connection's, or from X-Forwarded-For only when the request came through one of `auth.trusted_proxies`. Left out for the command line. |
| `radiate.auth.method` | string | optional | How the person signed in, or how the request was authenticated. One of `password`, `oidc`, `saml`, `session`, `token`, `ingress`, `open`, `cli`. |

#### `radiate.security.session.ended`

Sessions ended without signing out: they expired, or a password, role or account changed. Security audit. Severity INFO (9). Body: `Session expired: alice`, or `2 sessions ended for alice: password reset`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `user.name` (ECS) | string | required | Who: the Radiate username, or the user the single sign-on provider named. For a refused password sign-in or a lockout, the account tried, or `unknown:` and a keyed hash when the name matches no account, never the text typed. Left out when no one is known, and for the API token, ingress and the command line. |
| `user.roles` (ECS) | string[] | optional | Their Radiate role: `admin`, `household` or `viewer`. |
| `radiate.auth.method` | string | optional | How the person signed in, or how the request was authenticated. One of `password`, `oidc`, `saml`, `session`, `token`, `ingress`, `open`, `cli`. |
| `event.reason` (ECS) | string | required | Why the session ended: it reached `auth.session_days`, it was idle for `auth.idle_days`, or the user's password, role or account changed. One of `expired`, `idle`, `password_reset`, `role_changed`, `user_removed`. |
| `radiate.sessions.ended` | int, `{session}` | required | How many sessions ended. |

#### `radiate.security.request.refused`

An API request or a stream connection was refused for missing or wrong credentials (401, or the stream closed with 4401). Security audit. Severity WARN (13). Body: `Request refused: wrong API token`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `source.address` (OpenTelemetry) | string | optional | The client's IP address: the connection's, or from X-Forwarded-For only when the request came through one of `auth.trusted_proxies`. Left out for the command line. |
| `error.type` (OpenTelemetry) | string | required | What was wrong: no credentials, a wrong API token, or a session cookie that is unknown, expired or signed out. One of `no_credentials`, `bad_token`, `bad_session`. |
| `http.request.method` (OpenTelemetry) | string | optional | The request's HTTP method. |
| `url.path` (OpenTelemetry) | string | optional | The request's path, never its query string. |
| `radiate.security.count` | int, `{event}` | optional | How many identical events this record stands for, when repeats within a minute were folded into one. Left out for one. |

#### `radiate.security.access.denied`

An authenticated request was refused (403): the role may not make it, the CSRF token was wrong, or the stream's Origin was another site. Security audit. Severity WARN (13). Body: `Refused: alice (viewer) needs admin for PUT /api/v1/layout`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `user.name` (ECS) | string | optional | Who: the Radiate username, or the user the single sign-on provider named. For a refused password sign-in or a lockout, the account tried, or `unknown:` and a keyed hash when the name matches no account, never the text typed. Left out when no one is known, and for the API token, ingress and the command line. |
| `user.roles` (ECS) | string[] | optional | Their Radiate role: `admin`, `household` or `viewer`. |
| `source.address` (OpenTelemetry) | string | optional | The client's IP address: the connection's, or from X-Forwarded-For only when the request came through one of `auth.trusted_proxies`. Left out for the command line. |
| `radiate.auth.method` | string | optional | How the person signed in, or how the request was authenticated. One of `password`, `oidc`, `saml`, `session`, `token`, `ingress`, `open`, `cli`. |
| `error.type` (OpenTelemetry) | string | required | Why: the role may not make the request, the CSRF token was missing or wrong, or the browser's Origin was another site's. One of `forbidden`, `csrf`, `origin`. |
| `radiate.auth.needed_role` | string | optional | The lowest role that may make the request. One of `viewer`, `household`, `admin`. |
| `http.request.method` (OpenTelemetry) | string | optional | The request's HTTP method. |
| `url.path` (OpenTelemetry) | string | optional | The request's path, never its query string. |
| `radiate.security.count` | int, `{event}` | optional | How many identical events this record stands for, when repeats within a minute were folded into one. Left out for one. |

#### `radiate.security.lockout.started`

Too many failed password sign-ins locked a username or a client address. Security audit. Severity WARN (13). Body: `Sign-in locked for 900 s: username alice`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `user.name` (ECS) | string | optional | Who: the Radiate username, or the user the single sign-on provider named. For a refused password sign-in or a lockout, the account tried, or `unknown:` and a keyed hash when the name matches no account, never the text typed. Left out when no one is known, and for the API token, ingress and the command line. |
| `source.address` (OpenTelemetry) | string | optional | The client's IP address: the connection's, or from X-Forwarded-For only when the request came through one of `auth.trusted_proxies`. Left out for the command line. |
| `radiate.lockout.scope` | string | required | What is locked: a username, after 5 failures in 15 minutes, or a client address, after 20. One of `username`, `address`. |
| `radiate.lockout.duration` | double, `s` | required | How long the lockout lasts. |

#### `radiate.security.lockout.ended`

A sign-in lockout ended. Security audit. Severity INFO (9). Body: `Sign-in lockout ended: username alice`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `user.name` (ECS) | string | optional | Who: the Radiate username, or the user the single sign-on provider named. For a refused password sign-in or a lockout, the account tried, or `unknown:` and a keyed hash when the name matches no account, never the text typed. Left out when no one is known, and for the API token, ingress and the command line. |
| `source.address` (OpenTelemetry) | string | optional | The client's IP address: the connection's, or from X-Forwarded-For only when the request came through one of `auth.trusted_proxies`. Left out for the command line. |
| `radiate.lockout.scope` | string | required | What is locked: a username, after 5 failures in 15 minutes, or a client address, after 20. One of `username`, `address`. |

#### `radiate.security.user.changed`

A user was added, removed, given a new password or a new role, with `radiate users`. Security audit. Severity INFO (9). Body: `User added: alice (admin)`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `user.target.name` (ECS) | string | required | The user who was added, changed or removed. |
| `user.target.roles` (ECS) | string[] | optional | Their role after the change. |
| `radiate.auth.method` | string | optional | How the person signed in, or how the request was authenticated. One of `password`, `oidc`, `saml`, `session`, `token`, `ingress`, `open`, `cli`. |

#### `radiate.security.config.changed`

Someone changed how Radiate runs: settings, the household setup, the layout, learned models, or the heating or demand mode. Who and what. Old and new values only for a mode and the household, which hold no secret; one record for each household setting changed, or one naming them all past 20. Security audit. Severity INFO (9). Body: `Settings saved by alice (admin): boiler.min_burn_min`, or `Demand mode changed from eco to comfort by sam (household)`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `user.name` (ECS) | string | optional | Who: the Radiate username, or the user the single sign-on provider named. For a refused password sign-in or a lockout, the account tried, or `unknown:` and a keyed hash when the name matches no account, never the text typed. Left out when no one is known, and for the API token, ingress and the command line. |
| `user.roles` (ECS) | string[] | optional | Their Radiate role: `admin`, `household` or `viewer`. |
| `source.address` (OpenTelemetry) | string | optional | The client's IP address: the connection's, or from X-Forwarded-For only when the request came through one of `auth.trusted_proxies`. Left out for the command line. |
| `radiate.auth.method` | string | optional | How the person signed in, or how the request was authenticated. One of `password`, `oidc`, `saml`, `session`, `token`, `ingress`, `open`, `cli`. |
| `radiate.config.area` | string | required | What changed: the settings saved from the web UI, the household setup, the layout, learned models, or the heating or demand mode. One of `settings`, `household`, `layout`, `learning`, `mode`. |
| `radiate.settings.paths` | string[] | optional | For settings and the household, which changed, as house-file paths. Settings never carry their values, as a value can be a secret. |
| `radiate.config.key` | string | optional | For a mode or one household setting, the one that changed: `mode` (the heating mode), `demand_mode`, or a house-file path such as `household.rooms.lounge.adjust`. |
| `radiate.config.before` | string | optional | With `radiate.config.key`, its value before the change, as text (JSON for a list or mapping), cut to 256 characters. Left out for the people in the household. |
| `radiate.config.after` | string | optional | With `radiate.config.key`, its value after the change, as `radiate.config.before`. |
| `radiate.room.ids` | string[] | optional | For learning, the rooms that were reset. |
| `http.request.method` (OpenTelemetry) | string | optional | The request's HTTP method. |
| `url.path` (OpenTelemetry) | string | optional | The request's path, never its query string. |

#### `radiate.security.login.config`

How Radiate lets people in, at every start. Security audit. Severity INFO (9). Body: `Login on: password, oidc; API token set`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `event.category` (ECS) | string | required | ECS category: `authentication` for signing in and credentials, `web` for a request refused after it was authenticated, `iam` for user management, `configuration` for changes to how Radiate runs. One of `authentication`, `web`, `iam`, `configuration`. |
| `event.type` (ECS) | string | required | ECS type within the category. One of `start`, `end`, `info`, `access`, `change`, `creation`, `deletion`. |
| `event.outcome` (ECS) | string | required | Whether what was tried succeeded. One of `success`, `failure`. |
| `radiate.auth.login` | bool | required | User login is on (`auth.enabled`). |
| `radiate.auth.methods` | string[] | required | The sign-in methods that are on: `password`, `oidc`, `saml`. Empty with login off. |
| `radiate.auth.token` | bool | required | An API token (RADIATE_TOKEN) is set. |
| `radiate.auth.ingress` | bool | required | Requests through Home Assistant ingress are trusted. |
| `radiate.auth.trusted_proxies` | int, `{network}` | required | How many addresses or networks are trusted proxies. |
<!-- end generated: event-details -->

## Metrics

Metric names are in the `radiate.*` namespace, as OpenTelemetry has no semantic conventions for room heating. Units are UCUM, as OpenTelemetry expects: `Cel` for degrees Celsius, `1` for a state or ratio, `{start}` and similar for counts of things. No metric name is also the start of another metric's name, following OpenTelemetry's naming rules, so `radiate.boiler.relay.on` and `radiate.boiler.relay.time` sit side by side.

### Every tick

One data point a tick (a minute), at the tick's time, from the raw data series ([spec section 9.2](spec.md#92-raw-data)). States are 1 or 0, so their average over an hour is the share of the hour they were on.

<!-- generated: metrics-minute -->
| Metric | Instrument | Unit | Attributes | Description |
|---|---|---|---|---|
| `radiate.room.temperature` | gauge | `Cel` | `radiate.room.id`, `radiate.room.name` | The room sensor's reading. Raw data: `room.temperature`. |
| `radiate.room.humidity` | gauge | `%` | `radiate.room.id`, `radiate.room.name` | Relative humidity from the room sensor. Raw data: `room.humidity`. |
| `radiate.room.setpoint` | gauge | `Cel` | `radiate.room.id`, `radiate.room.name` | The temperature the schedule, or a hold, asks for. Raw data: `room.setpoint`. |
| `radiate.room.target` | gauge | `Cel` | `radiate.room.id`, `radiate.room.name` | The temperature Radiate is heating the room to now, after preheating and room use. Raw data: `room.target`. |
| `radiate.room.demand.calling` | gauge | `1` | `radiate.room.id`, `radiate.room.name` | 1 while the room wants heat from the boiler, else 0. Raw data: `room.calling`. |
| `radiate.room.window.open` | gauge | `1` | `radiate.room.id`, `radiate.room.name` | 1 while the room's window sensor reads open, else 0. Raw data: `room.window`. |
| `radiate.valve.temperature` | gauge | `Cel` | `radiate.room.id`, `radiate.room.name` | The TRV's own sensor, at the radiator. Raw data: `valve.temperature`. |
| `radiate.valve.opening.limit` | gauge | `%` | `radiate.room.id`, `radiate.room.name` | The opening limit Radiate set on the valve. Raw data: `valve.opening`. |
| `radiate.valve.opening.reported` | gauge | `%` | `radiate.room.id`, `radiate.room.name` | The opening limit the valve says it holds. Raw data: `valve.reported`. |
| `radiate.outdoor.temperature` | gauge | `Cel` | none | The outdoor temperature Radiate uses. Raw data: `outdoor.temperature`. |
| `radiate.boiler.relay.on` | gauge | `1` | none | 1 while the heating relay reads on, else 0. Raw data: `boiler.relay`. |
| `radiate.boiler.demand` | gauge | `1` | none | 1 while Radiate asks for the heating relay to be on, else 0. Raw data: `boiler.demand`. |
| `radiate.boiler.status` | gauge | `1` | `radiate.boiler.state` | The boiler guard's state as a state set: one point per state, 1 for the current one and 0 for the others. Raw data: `boiler.state`. |
| `radiate.boiler.burner.on` | gauge | `1` | none | 1 while the burner fires, where the boiler reports it, else 0. Raw data: `boiler.burner`. |
| `radiate.boiler.power` | gauge | `W` | none | Power through the heating relay, where the relay measures it. Raw data: `boiler.power`. |
| `radiate.store.relay.on` | gauge | `1` | none | 1 while the hot-water store relay reads on, else 0. Raw data: `store.relay`. |
| `radiate.people.home` | gauge | `{person}` | none | How many of the household's people count as home. Raw data: `people.home`. |
| `radiate.people.away` | gauge | `{person}` | none | How many of the household's people count as away. Raw data: `people.away`. |
<!-- end generated: metrics-minute -->

### Running totals for the day

Also every tick: the day's totals so far, as cumulative monotonic sums. Each point's start time is local midnight, so every day starts a new count. When Radiate restarts without its saved state the count can drop within a day; OpenTelemetry backends, Elastic included, treat a drop in a counter as a reset.

<!-- generated: metrics-counters -->
| Metric | Instrument | Unit | Attributes | Description |
|---|---|---|---|---|
| `radiate.boiler.relay.time` | sum, cumulative, monotonic | `s` | none | Heating relay on time today, as read from the relay. |
| `radiate.boiler.burner.time` | sum, cumulative, monotonic | `s` | none | Heating burner time today: metered firing where the relay measures power, else relay time while Radiate runs the boiler. |
| `radiate.boiler.starts` | sum, cumulative, monotonic | `{start}` | none | Heating relay starts today. |
| `radiate.boiler.oil.consumed` | sum, cumulative, monotonic | `L` | none | Oil burned today, from burner time and the nozzle rating. Sent only with a nozzle rating. |
| `radiate.store.burner.time` | sum, cumulative, monotonic | `s` | none | Burner time for the hot-water store today, metered. Sent only with metering. |
<!-- end generated: metrics-counters -->

### Once a day

When the local day closes, Radiate sends the day's summary ([spec section 5.6](spec.md)) and its savings ([spec section 5.9](spec.md#59-savings)) as gauges, one point for each. A point's time is the last second of the day it covers, in the house's time zone, and its start time is the day's first second. Two settings change this:

- `export.otlp.daily_timestamp: day_close` times each point when Radiate closed the day instead, a minute or so after local midnight, with the same start time. Use it for a backend that refuses or drops points whose time is older than the moment they arrive; a one-day date histogram then puts each figure on the day after the one it covers, so the default, `end_of_day`, suits Elastic.
- `export.otlp.daily_metrics: false` leaves the daily figures out altogether. The running totals still go every minute. A day Radiate did not see in full is marked by `radiate.day.partial`. The savings metrics are sent only when Radiate can estimate them for that day; the litres saved and the share wait until the savings fit is ready.

<!-- generated: metrics-daily -->
| Metric | Instrument | Unit | Attributes | Description |
|---|---|---|---|---|
| `radiate.daily.burner.time` | gauge | `h` | `radiate.day.partial`, `radiate.burner.basis` | Heating burner hours in the day. |
| `radiate.daily.relay.time` | gauge | `h` | `radiate.day.partial` | Heating relay hours in the day. |
| `radiate.daily.starts` | gauge | `{start}` | `radiate.day.partial` | Heating relay starts in the day. |
| `radiate.daily.starts_peak_hour` | gauge | `{start}` | `radiate.day.partial` | The most relay starts in any hour of the day. |
| `radiate.daily.burns` | gauge | `{burn}` | `radiate.day.partial` | Burns completed in the day. |
| `radiate.daily.burn.mean_duration` | gauge | `min` | `radiate.day.partial` | The mean burn length. Not sent for a day without a burn. |
| `radiate.daily.oil.consumed` | gauge | `L` | `radiate.day.partial` | Oil burned in the day. Sent only with a nozzle rating. |
| `radiate.daily.energy` | gauge | `kW.h` | `radiate.day.partial` | Heat delivered in the day, from the oil burned at 85 % efficiency. |
| `radiate.daily.balance.score` | gauge | `{score}` | `radiate.day.partial` | The balance score, 0 to 100. Not sent for a partial day or one without a measured burn. |
| `radiate.daily.balance.arrival_spread` | gauge | `min` | `radiate.day.partial` | The median arrival spread of the day's burns. |
| `radiate.daily.room.below_comfort` | gauge | `min` | `radiate.day.partial`, `radiate.room.id`, `radiate.room.name` | Minutes the room spent below its comfort band. |
| `radiate.daily.savings.degree_hours.actual` | gauge | `K.h` | `radiate.day.partial`, `radiate.savings.eligible` | Degree-hours the house was kept above outdoors, weighted by room. |
| `radiate.daily.savings.degree_hours.baseline` | gauge | `K.h` | `radiate.day.partial`, `radiate.savings.eligible` | Degree-hours the baseline would have kept, weighted by room. |
| `radiate.daily.oil.baseline` | gauge | `L` | `radiate.day.partial`, `radiate.savings.eligible` | Oil the baseline would have burned. Sent once the savings fit is ready. |
| `radiate.daily.savings.oil` | gauge | `L` | `radiate.day.partial`, `radiate.savings.eligible` | Oil saved against the baseline; negative when more was burned. |
| `radiate.daily.savings.share` | gauge | `%` | `radiate.day.partial`, `radiate.savings.eligible` | Oil saved as a share of the baseline. |
| `radiate.daily.comfort.deficit` | gauge | `K.h` | `radiate.day.partial`, `radiate.savings.eligible` | How far, and for how long, rooms in use were below target. |
| `radiate.daily.comfort.warm_share` | gauge | `1` | `radiate.day.partial`, `radiate.savings.eligible` | The share of in-use time rooms were warm enough, 0 to 1. |
<!-- end generated: metrics-daily -->

### Metric attributes

<!-- generated: metric-attributes -->
| Attribute | Type | Description |
|---|---|---|
| `radiate.room.id` | string | The room's ID from the house file. |
| `radiate.room.name` | string | The room's name from the house file. |
| `radiate.boiler.state` | string | The boiler guard's state this point is for. One of `idle`, `lead`, `firing`, `rest`. |
| `radiate.day.partial` | bool | Radiate did not see the whole day: totals cover what it saw. |
| `radiate.burner.basis` | string | What burner time is counted from: the relay, metered firing, or both in one day. One of `relay`, `firing`, `mixed`. |
| `radiate.savings.eligible` | bool | The day counts towards savings (spec 5.9). |
<!-- end generated: metric-attributes -->

### Temporality, and why it suits Elastic

Elastic's managed OTLP endpoint writes metrics to a time series data stream (TSDS), `metrics-radiate.otel-default` with the default dataset. Each data point's attributes, and the resource's, become the time series' dimensions. A gauge is stored as a gauge, and a cumulative monotonic sum as a counter.

- **Running totals are cumulative sums.** A cumulative point carries the whole count since its start time, so a batch lost in an outage loses no oil or burner time: the next point has it. Elastic stores them as counters, so a rate or an increase over any window works, and a reset at midnight or after a restart is handled as a counter reset. Delta sums would need every batch to arrive.
- **Daily figures are gauges.** A day's burner hours or litres saved describe a closed day, not a count that keeps growing, so a gauge with one point a day is the honest shape. A sum would suggest adding days together the way a counter's increase works.
- **The day is in the timestamp, not an attribute.** In a TSDS every attribute is a dimension, so a date attribute would start a new time series every day, each with a single point. Timing the point at the day's last second keeps one series per metric and room, and a one-day date histogram in the house's time zone puts each figure on the day it covers.
- **`radiate.day.partial`, `radiate.burner.basis` and `radiate.savings.eligible` are attributes** because they have two or three values and say how far to trust a figure. They add few series.
- **Room names are attributes.** Renaming a room in the house file starts a new series for it; its ID stays the same.

## Changes

### 1.0

Amended in place before release: 1.0 was merged but never deployed or turned on anywhere, so these changes went into 1.0 itself rather than a 2.0. From here on, a published snapshot is never overwritten, as the policy above says.

- The `event.name` attribute is gone. The event name is in the log record's event name field (OpenTelemetry's `event_name`) only, as current OpenTelemetry semantic conventions have it.
- `radiate.auth.denied`, a count of refused requests each tick, is gone. The security audit events, `radiate.security.*`, report each refusal with its reason, who and from where ([ADR-0008](adr/0008-security-audit-log.md)).
- Added: the eleven `radiate.security.*` events and their ECS and OpenTelemetry attributes, including `radiate.config.key`, `radiate.config.before` and `radiate.config.after` on `radiate.security.config.changed`, and its `mode` area.
- Added: `export.otlp.security` (default `true`), which keeps security events out of the export when `false`.

The first versioned schema. Before it, the export sent no `radiate.schema.version`. These are breaking changes from what earlier builds sent:

| Before | 1.0 | Why |
|---|---|---|
| `radiate.valve.opening` | `radiate.valve.opening.limit` | `radiate.valve.opening.reported` sat under it; a metric name must not be the start of another |
| `radiate.boiler.relay` | `radiate.boiler.relay.on` | Makes room for `radiate.boiler.relay.time` |
| `radiate.boiler.burner` | `radiate.boiler.burner.on` | Makes room for `radiate.boiler.burner.time` |
| `radiate.store.relay` | `radiate.store.relay.on` | Matches the boiler's relay |
| Every log record at `INFO` | Alerts, learning invalidations, refused requests and lost data at `WARN` | Severity follows the event |
| No event name | An event name on every log record | Tells the kinds of record apart |

Added in 1.0: the running totals and daily metrics, the `radiate.alert.cleared`, `radiate.boiler.burn`, `radiate.mode.changed`, `radiate.settings.changed` and `radiate.export.dropped` events, the security events, room names and reason values on log records, and `radiate.schema.version`.
