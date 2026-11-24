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

Radiate never sends the name of a person or a place. Rooms are sent by ID and name, people only as counts, and the house by a random ID. A settings change sends which settings changed, never their values, as a value can be a secret. A refused API request is counted, without the client's address.

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

Each log record is one event. Its kind is in the log record's event name field (OpenTelemetry's `event_name`), and repeated in the `event.name` attribute for backends that don't read that field yet. `event.action` holds the reason code, such as `boiler.lead`, as in the Elastic export's decision stream, so you can filter one kind of decision without parsing the message. The body is the message as the web UI shows it.

| Severity text | Severity number | Used for |
|---|---|---|
| `INFO` | 9 | What Radiate decided or what changed |
| `WARN` | 13 | Alerts, learning that was dropped, refused requests and lost data |

A record's time is when it happened. A mode or settings change made through the API happens between ticks and is sent with the next tick, with its own time. Room events carry `radiate.room.id`, and `radiate.room.name` when the room is in the house file.

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
| `radiate.auth.denied` | WARN | `auth.denied`. | API requests, stream connections or sign-ins were refused. At most one record a tick, with the count. |
| `radiate.export.dropped` | WARN | `export.dropped`. | The OpenTelemetry export lost data: a full queue dropped its oldest records, or the collector rejected some. At most one record an hour for each signal and cause, with the count since the last. |
<!-- end generated: events -->

### Attributes by event

<!-- generated: event-details -->
#### `radiate.decision`

A decision the control loop made that a person might ask about. Severity INFO (9). Body: The reason's message, as the web UI shows it.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
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
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.room.id` | string | optional | The room's ID from the house file. |
| `radiate.room.name` | string | optional | The room's name from the house file. |

#### `radiate.alert.cleared`

An alert that no longer holds. Severity INFO (9). Body: The alert's last message, after `Cleared: `.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.room.id` | string | optional | The room's ID from the house file. |
| `radiate.room.name` | string | optional | The room's name from the house file. |

#### `radiate.boiler.burn`

A burn ended: the heating relay went off. Severity INFO (9). Body: `Burn ended after <n> min`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.burn.duration` | double, `s` | required | How long the heating relay was on. |
| `radiate.dry_run` | bool | required | Radiate was not running the boiler: the burn is its intention, not the boiler's. |

#### `radiate.mode.changed`

The heating mode or the demand mode was changed through the API. Severity INFO (9). Body: `Heating mode changed from auto to frost`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.mode.kind` | string | required | Which mode changed: the heating mode or the demand mode. One of `heating`, `demand`. |
| `radiate.mode.before` | string | required | The mode before the change. One of `auto`, `off`, `frost`, `eco`, `comfort`. |
| `radiate.mode.after` | string | required | The mode after the change. One of `auto`, `off`, `frost`, `eco`, `comfort`. |

#### `radiate.presence.changed`

Who counts as home or away changed what the house does. People only as counts. Severity INFO (9). Body: The reason's message, which never names a person.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.people.home` | int, `{person}` | optional | How many people count as home. |
| `radiate.people.away` | int, `{person}` | optional | How many people count as away. |

#### `radiate.learning.invalidated`

A room's learned model was dropped, invalidated by a release, or reset. Severity WARN (13). Body: The learning note's message.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.room.id` | string | optional | The room's ID from the house file. |
| `radiate.room.name` | string | optional | The room's name from the house file. |

#### `radiate.settings.changed`

Settings were saved or reverted in the web UI, or the household setup changed. Severity INFO (9). Body: `Settings saved: 2 changed`, or the household setup's message.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.settings.paths` | string[] | required | The settings that changed, as house-file paths such as `boiler.min_burn_min`. Never their values, which can be secrets. |
| `radiate.settings.restart_required` | bool | required | Some of the changes take effect at the next start. |

#### `radiate.auth.denied`

API requests, stream connections or sign-ins were refused. At most one record a tick, with the count. Severity WARN (13). Body: `<n> requests refused: not signed in or wrong credentials`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.auth.failures` | int, `{request}` | required | Requests refused since the last record: a missing or wrong token or session, or a wrong username or password. Never the client's address or the username. |

#### `radiate.export.dropped`

The OpenTelemetry export lost data: a full queue dropped its oldest records, or the collector rejected some. At most one record an hour for each signal and cause, with the count since the last. Severity WARN (13). Body: `<n> queued metric records dropped: queue full`.

| Attribute | Type | | Description |
|---|---|---|---|
| `event.name` (OpenTelemetry) | string | required | The event name, repeated from the log record's event name field for backends that do not read it. |
| `event.action` (ECS) | string | required | The reason code, such as `boiler.lead`, or the action for events without one. |
| `radiate.export.signal` | string | required | Which queue lost the data. One of `metrics`, `logs`. |
| `radiate.export.dropped` | int, `{record}` | required | How much was lost since the last report: queued records (a tick, a closed day or a log record) for a full queue, a 400 or a 413; data points or log records for a partial success. |
| `error.type` (OpenTelemetry) | string | required | Why: the queue was full, the collector answered 400 or 413, or it rejected part of a batch. One of `queue_full`, `400`, `413`, `partial_success`. |
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

When the local day closes, Radiate sends the day's summary ([spec section 5.6](spec.md)) and its savings ([spec section 5.9](spec.md#59-savings)) as gauges, one point for each. A point's time is the last second of the day it covers, in the house's time zone, and its start time is the day's first second. A day Radiate did not see in full is marked by `radiate.day.partial`. The savings metrics are sent only when Radiate can estimate them for that day; the litres saved and the share wait until the savings fit is ready.

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

The first versioned schema. Before it, the export sent no `radiate.schema.version`. These are breaking changes from what earlier builds sent:

| Before | 1.0 | Why |
|---|---|---|
| `radiate.valve.opening` | `radiate.valve.opening.limit` | `radiate.valve.opening.reported` sat under it; a metric name must not be the start of another |
| `radiate.boiler.relay` | `radiate.boiler.relay.on` | Makes room for `radiate.boiler.relay.time` |
| `radiate.boiler.burner` | `radiate.boiler.burner.on` | Makes room for `radiate.boiler.burner.time` |
| `radiate.store.relay` | `radiate.store.relay.on` | Matches the boiler's relay |
| Every log record at `INFO` | Alerts, learning invalidations, refused requests and lost data at `WARN` | Severity follows the event |
| No event name | An event name on every log record, and the `event.name` attribute | Tells the kinds of record apart |

Added in 1.0: the running totals and daily metrics, the `radiate.alert.cleared`, `radiate.boiler.burn`, `radiate.mode.changed`, `radiate.settings.changed`, `radiate.auth.denied` and `radiate.export.dropped` events, room names and reason values on log records, and `radiate.schema.version`.
