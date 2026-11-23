# Glossary

The shared language for Radiate. Use these words in code, docs, UI text, commit messages and reviews. Each entry gives the meaning, the symbol and unit where there is one, and the code identifier it maps to. Where two words compete, the entry names the one to use and lists the others under _Avoid_.

Units follow the spec: °C for temperatures, K for differences, K/h for heating and cooling rates, 1/h for loss rates, and % for valve openings. Code keeps times in seconds (`_s`), the configuration file uses minutes (`_min`), and the UI shows minutes.

Questions about terms or behaviour that are still open are listed under [Ambiguities](#ambiguities) at the end.

## House and rooms

**House**:
Everything Radiate controls at one address: rooms, the boiler and the store.
Code: `HouseConfig` (core), `SiteConfig` (configuration file, devices and drivers).

**House ID**:
A random UUID that identifies a house in exports and to the Home Assistant integration. It never contains a name or location.
Code: `Runtime.house_id`, Elastic `radiate.house.id`.

**Room**:
A space Radiate knows about. Most rooms have one radiator, at most one TRV and at most one room sensor. An unheated room has a room sensor and no radiator.
Code: `RoomConfig` (configuration), `RoomState` (learned and live state), `RoomInput` (one reading).

**Room role**:
How Radiate treats a room. One of four values:

- `normal`: TRV plus room sensor. Fully controlled and learned.
- `passive`: no controllable valve, for example an unvalved bypass radiator. Observed only.
- `internal_sensor_only`: TRV with no room sensor. Uses the TRV's internal reading plus the TRV bias, a wider hysteresis, never sets the pace, and has its learning confidence capped at 0.5. Its TRV setpoint is written in the TRV's own frame.
- `unheated`: room sensor and no radiator. Recorded and shown only (see unheated room).

Code: `RoomRole`, config key `rooms[].role`.
_Avoid_: "TRV only" for `internal_sensor_only`.

**Controllable**:
A room with a TRV that Radiate drives: role `normal` or `internal_sensor_only`. Only a controllable room has a schedule, a room model and demand. Passive and unheated rooms are not controllable.
Code: `RoomConfig.controllable`.

**Room sensor**:
The separate temperature sensor in a room (SNZB-02B in the reference house). Its reading is the room temperature `T`.
Code: `RoomInput.temperature`, config key `rooms[].sensor`.

**TRV internal temperature**:
The temperature the TRV measures at the radiator. Used for arrival lag, and as the room temperature when there is no fresh room sensor reading.
Symbol `T_trv`, °C. Code: `RoomInput.trv_temperature` (Zigbee2MQTT `local_temperature`).

**TRV bias**:
The offset added to `T_trv` to estimate room temperature. Default -1.5 K, because the TRV sits beside its radiator and reads high while the radiator is warm. Fixed: it is not refined from observations, because no single offset fits both a cold and a warm radiator (see [spec 4.6](spec.md#46-learning-gates-and-exclusions)).
Code: `RoomConfig.trv_bias_k`, config key `rooms[].trv_bias_k`.

**TRV setpoint frame**:
The temperature a TRV compares its setpoint with, and so the frame Radiate writes the setpoint in. A normal room's TRV compares with the room sensor reading Radiate sends as its external temperature, so the setpoint is the room's target. An internal-sensor room's TRV compares with its own reading, which Radiate takes as room temperature minus the TRV bias, so the setpoint is the target minus the bias. Every TRV setpoint is a 0.5 K step from 4 to 35 °C.
Code: `_trv_setpoint` and `_trv_step` in `radiate.core.decide`.

**Bypass radiator**:
A radiator with no controllable valve that is always open, such as the reference house's stairs radiator. It has the `passive` role and counts towards the open path. A rise in its room's temperature counts as heat arriving in the no-heat check. A room with no radiator at all is an unheated room, not a bypass.
_Avoid_: unvalved room, manual room.

**Unheated room**:
A room with a room sensor and no radiator, such as a landing, a boot room or the room the boiler is in. Radiate records and shows its temperature, and its humidity unless `humidity: false`, but never controls it: no TRV, no schedule, no room model, no learning and no demand. It is not part of the open path, and its warming never counts as heat arriving, because something other than the radiators, such as the boiler's casing, can warm it.
Code: `RoomRole.UNHEATED`, config `role: unheated`.
_Avoid_: passive room (a passive room has a radiator).

**Heat source**:
Heat in a room that does not come from its radiator. Two kinds:

- `episodic`: comes and goes, for example an open fire or wood burner. Detected as the fire disturbance.
- `continuous`: always present, for example a range cooker. Learned as steady heat `d`.

Code: `HeatSource`, config key `rooms[].heat_source`.

**Outdoor temperature**:
Temperature outside the house, from an optional sensor. The core assumes 5 °C when there is no reading.
Symbol `T_out`, °C. Code: `Snapshot.outdoor`, config key `house.outdoor_sensor`.

## Household

**Household**:
The people who live in the house, their routines, and how each room is used. Radiate compiles it into one weekly schedule per room, so nothing downstream of the schedule changes.
Code: `Household`, `compile_household` in `radiate.config.household`, config key `household`. The week each room follows now: API `GET /api/v1/schedules`, `schedules_view` in `radiate.server.schedules`, the web UI's Schedules section.

**Household setup**:
The web UI's wizard for the household: People, Routines, Rooms, Temperatures and the Result, the week each room will follow. It saves a saved household.
Code: `web/setup.js`, `web/household.js` (the draft and `toSection`), `HouseholdSetup` in `radiate.server.setup`, API `GET`, `PUT` and `DELETE /api/v1/household` and `POST /api/v1/household/preview`.

**Saved household**:
A household saved from the household setup, in `<data_dir>/household.yaml`. It replaces the house file's `household` section for the server, `check-config` and `radiate schedules` given the same data directory. Deleting it goes back to the house file's.
Code: `radiate.config.saved`, `apply_saved`, `parse_household` and `apply_household` in `radiate.config.site`, `SiteConfig.household_source`, `SiteConfig.file_household`, `SiteConfig.saved_problems`; reason `household.setup`.
_Avoid_: wizard file, override file.

**Person**:
Someone who lives in the house. Has an ID, a display name shown only in the UI, and a routine for weekdays and one for the weekend. Can set their own getting-up time, bedtime and weekend days.
Code: `Person` (`getting_up_min`, `bedtime_min`, `weekend_days`), config key `household.people`.

**Routine**:
When a person gets up, is out, works from home, and goes to bed, on weekdays or at the weekend.
Code: `Routine` (`up_min`, `bed_min`, `out`, `work`), config keys `household.people.<id>.weekdays` and `.weekend`.

**Use level**:
How much a room is used: in use, occasional or unused. Each level has one house-wide temperature, 19, 16 and 14 °C by default. A room's level can differ at weekends. With the warm periods, it gives the room use that `eco` will act on (planned, see room use). A room on a hand-written schedule can give its level in the house file, in the same words.
Code: `UseLevel`, `Temperatures`, `SiteConfig.schedule_use`, config keys `household.rooms.<id>.use`, `rooms[].use` and `household.temperatures`.

**Night temperature**:
The temperature every room in a household drops to overnight, from the last person going to bed until shortly before the first gets up. 14 °C by default. A room can set its own.
°C. Code: `Temperatures.night_c`, `RoomLink.night_c`, config keys `household.temperatures.night` and `household.rooms.<id>.night_temperature`.

**Room kind**:
How a household room's people use it, which decides when it is warm: `shared` (while any of its people is at home, up and not working), `bedroom` (getting up and going to bed), `office` (working hours), `while_home` (while any of its people is at home and up, working or not) or `all_day` (from the first person up to the last in bed).
Code: `RoomKind`, `RoomLink.kind`, config key `household.rooms.<id>.kind`. The room's people are `RoomLink.people`.

**Household settings**:
The durations, temperatures and choices that turn routines into schedules and decide how away behaves. Every one has a default and an allowed range, house-wide, and some can be set per person or per room. The API returns them with the defaults filled in.
Code: `Timing`, `AwaySettings`, `LIMITS`, `household_view` in `radiate.config.household`; config keys `household.timing`, `household.away`, `household.weekend_days`; API `household` in `GET /api/v1/house`.

**Weekend days**:
The days that use each person's weekend routine and each room's weekend use level. Saturday and Sunday by default. A person can have their own.
Code: `Household.weekend_days`, `Person.weekend_days`, config keys `household.weekend_days` and `household.people.<id>.weekend_days`.

**Getting-up time, bedtime**:
How long a bedroom or shared room counts as in use after someone gets up, and how long a bedroom counts as in use before they go to bed. 30 minutes each by default, house-wide or per person.
Minutes. Code: `Timing.getting_up_min`, `Timing.bedtime_min`, `Person.getting_up_min`, `Person.bedtime_min`, config keys `household.timing.getting_up_min`, `household.timing.bedtime_min`.

**Merge gap**:
Warm periods this close together, or closer, join into one, measured on the valve schedule. 30 minutes by default.
Minutes. Code: `Timing.merge_gap_min`, config key `household.timing.merge_gap_min`.

**Fixed preheat**:
How early each warm period starts in a room's valve schedule, so the room is warm in time when the valve runs the schedule without Radiate. 30 minutes by default, house-wide or per room.
Minutes. Code: `Timing.preheat_min`, `RoomLink.preheat_min`, config keys `household.timing.preheat_min` and `household.rooms.<id>.preheat_min`.
_Avoid_: preheat on its own for this; optimum start is the learned feature.

**Valve schedule, live schedule**:
The two weeks a household room compiles to. The valve schedule starts each warm period by the fixed preheat and fits the TRVZB's six changes a day; the schedule mirror and the Shelly fallback use it, as compiled for everyone at home (the fallback week). The live schedule is what Radiate follows while it runs: each warm period starts when the room is needed, and optimum start decides how early to heat. With `live_preheat: fixed` the two are the same.
Code: `CompiledHousehold.schedules` and `CompiledHousehold.live`, `SiteConfig.schedule_for`, `SiteConfig.live_schedule_for` and `SiteConfig.fallback_schedule_for` (the fallback week), `LivePreheat`, config key `household.timing.live_preheat`.

**Dropped period**:
A warm period left out of a room's valve schedule to fit the TRVZB's limit. Radiate still heats it while running.
Code: `DroppedPeriod` (`room_id`, `day_type`, `days`, `start_min`, `end_min`, `setpoint_c`, `text`), `CompiledHousehold.dropped`, `CompiledHousehold.notes`.

**Room adjustment**:
A change to one household room's week that its routines don't give: keep it warm, or keep it cold, from one time to another on some days (`weekdays`, `weekend`, `daily` or named days). Adjustments apply in order after the routine rules, so a later one wins where two overlap. Their times are the live schedule's; the valve schedule adds the fixed preheat and is then fitted to the TRVZB. They don't apply while everyone who uses the room is away. Made by dragging the edge of a warm period in the week view, or with its Adjust form, and saved with the household, so they survive recompiling. At most 10 a room.
Code: `Adjustment` (`days`, `keep`, `from_min`, `to_min`), `Keep`, `RoomLink.adjust`, `without_adjustments`, `CompiledHousehold.periods` and `CompiledHousehold.adjusted` in `radiate.config.household`; `LIMITS["rooms.adjust"]`; config key `household.rooms.<id>.adjust`; API `adjust`, `routine`, `days[].periods` and `days[].adjusted` in `GET /api/v1/schedules`; `addAdjustment` and `editRoom` in `web/week.js`.
_Avoid_: override (a temporary setpoint for a room, which ends by itself), exception, schedule edit.

**Away**:
A person treated as not at home, so their part of every routine is dropped when compiling. A person counts as away through an away until, or through presence that has said not home for the presence delay. When the set of people away changes, the runtime recompiles the household.
Code: `effective_away`, `status` in `radiate.config.away`; `compile_household(away=...)`; `Runtime.away`, `Runtime.presence`. API `GET /api/v1/people`, `away` in `state`.

**Away until**:
A person's own statement that they are away until a local date and time, set in the web UI, the API or Home Assistant. It counts at once and clears itself at that time. With optimum start it counts right up to that time; with a fixed preheat it stops counting the preheat before it. It wins over a home that presence reported before it was set; arriving home after it was set ends it.
Code: `Presence.away_until`, `Runtime.set_away`, `Runtime.clear_away`, `Household.return_lead_min`, `RETURN_LEAD_S`, API `POST /api/v1/people/{id}/away`, HA services `radiate.set_away`, `radiate.clear_away`.

**Presence**:
Whether Home Assistant reports a person as home or not home, and since when. The integration reports the state of each person's Home Assistant person when it changes and every 15 minutes; `unknown` and `unavailable` are not reported.
Code: `Presence.state`, `Presence.since`, `Presence.reported_at`, `Runtime.report_presence`, API `POST /api/v1/people/{id}/presence`, radiate-ha `custom_components/radiate/presence.py`, `PRESENCE_HEARTBEAT_MIN`.

**Home Assistant person**:
The Home Assistant `person` entity linked to a person, whose presence counts for them. It's set in the household, from the house file or the People step of the household setup, or in the integration's options, which take priority. Linking changes no schedule. The integration tells the server which `person` entities exist, so the household setup can list them.
Code: `Person.ha_person`, `HA_PERSON` in `radiate.config.site`, config key `household.people.<id>.ha_person`, `ha_person` in API `GET /api/v1/house`; `Runtime.ha_persons`, `Runtime.report_ha_persons`, API `POST /api/v1/ha/persons`, `ha_persons` in `GET /api/v1/household`; radiate-ha `mapping` and `ha_persons` in `presence.py`.
_Avoid_: HA mapping, presence entity.

**Presence delay**:
How long presence must say not home before the person counts as away, so short trips do not cool their rooms. 60 minutes by default.
Minutes. Code: `PRESENCE_DELAY_MIN`, `AwaySettings.presence_delay_min`, config key `household.away.presence_delay_min`.

**Stale presence**:
Presence that Home Assistant has not reported again within the stale limit, 60 minutes by default. It counts as unknown, not away, so a not home left behind when Home Assistant stops reporting cannot hold anyone away for ever.
Minutes. Code: `stale` in `radiate.config.away`, `AwaySettings.presence_stale_after_min`, config key `household.away.presence_stale_after_min`, `presence.stale` in the API; reason `away.presence_stale`.

**Return warm-up**:
How early Radiate can start warming rooms for someone due back from an away until. Within it the return becomes each room's next setpoint, so optimum start heats as early as the room needs. 180 minutes by default.
Minutes. Code: `next_return`, `Return` in `radiate.config.away`, `Runtime.returning`, `Runtime._apply_return`, `RoomInput.preheat_max_s`, `AwaySettings.return_warmup_min`, config key `household.away.return_warmup_min`, `away.return` in the API; reason `away.return`.

**Everyone away**:
Every person in the household counts as away. In the `auto` heating mode, the runtime then runs the core in `frost` until someone is home, or until the return warm-up before someone is due back. With `everyone_away: unused` it keeps the household's schedules instead, which hold every room at its unused temperature. The chosen heating mode is not changed, so `off` and `frost` still apply. Fail warm: the frost hold applies only when everyone has an away until, and a room override still wins over it; presence alone holds every room at its unused temperature.
Code: `Runtime.everyone_away`, `Runtime.effective_mode`, `Runtime.frost_held`, `frost_allowed` in `radiate.config.away`, `EveryoneAway`, config key `household.away.everyone_away`, `away.frost` in `state`; reasons `away.everyone`, `away.ended`.

**Fail warm**:
([ADR-0005](adr/0005-fail-warm-presence.md), [spec 7](spec.md#7-failure-modes)). The rule that no connectivity or device problem may lower the heating: an input that could lower a room's temperature counts, when it is missing, silent or doubtful, as the reading that keeps the house warmer. Uncertain presence counts as home.
_Avoid_: fail safe for this; fail safe is about Radiate's own outages (governed mode, the schedule mirror, the watchdog).

**Presence evidence**:
When a person's trackers (the `device_tracker` entities behind their Home Assistant `person`) last reported, whatever their state. A `not_home` counts as away only while its evidence is younger than the evidence limit, 240 minutes by default; after that it counts as home. Different from stale presence, which is about the integration's reports: a dead phone's `not_home` is reported every 15 minutes, but its evidence stops. Without `evidence_at` (an older integration), the time the state changed stands in.
Minutes. Code: `AwaySettings.presence_evidence_max_age_min`, `evidence_old`, `evidence_seen` and `Presence.evidence_at` in `radiate.config.away`, `evidence_at` in `POST /api/v1/people/{id}/presence`, `presence.uncertain` `evidence_old` in the API; reason `away.presence_uncertain`.
_Avoid_: source silence, last seen.

**Weak source**:
A tracker that can report `not_home` for a phone that is at home: a router or Bluetooth tracker, or a phone at 5 % battery or less. Its `not_home` counts only after the weak source delay, 240 minutes by default.
Minutes. Code: `weak_source`, `Presence.source_type`, `Presence.battery` in `radiate.config.away`, `AwaySettings.presence_weak_source_delay_min`.

**I'm home**:
A person saying they are home: Back now in the web UI, or `POST /api/v1/people/{id}/home`. It ends their away until, and a `not_home` from before it counts as home until their presence changes again.
Code: `Runtime.say_home`, `Presence.home_at`, `home_at` in the API, `presence.uncertain` `said_home`; reason `away.home`.

**Home evidence**:
A sign someone is in the house (a setpoint override, a store boost, the fire switch, a shower detected) that sets aside presence-based away until that person's presence changes again.
Code: `Runtime.note_home_evidence`, `Presence.home_evidence_at`, `presence.uncertain` `home_evidence`; reason `away.home_evidence`.

## Valve actuation

**Actuation**:
Radiate writing settings to a room's TRV. Each room is either actuated or not.
Code: `RoomConfig.actuation_enabled`, config key `rooms[].actuate`.

**Pilot valve**:
The one TRV Radiate actuates when no room sets `actuate`: the first room with a TRV, in file order. Used to watch for calibration loss before more valves are added.
Code: `radiate.config.site._rooms` (one-valve rollout).
_Avoid_: test valve, first valve.

**One-valve rollout**:
The practice of actuating the pilot valve alone, then adding valves one at a time with `actuate: true`.

**Dry run**:
Radiate reads every device and makes every decision but writes nothing: no valve settings, relay commands or heartbeat. Intended writes are logged and shown in the UI telemetry. The default for a new configuration.
Code: `SiteConfig.dry_run`, `LiveDriver.intended`, `ShellyBoiler.intended`, config key `house.dry_run`, CLI flag `serve --dry-run`.
_Avoid_: simulation mode, read-only mode.

**Demo**:
The server driving the simulated reference house instead of real devices.
Code: `DemoDriver`, CLI flag `serve --demo`.
_Avoid_: simulation (that is the `radiate sim` comparison run).

**Governed mode**:
How Radiate keeps each TRVZB: the TRV runs its own thermostat on the room temperature Radiate sends it, inside an opening limit Radiate sets, fully closed when satisfied, with adaptive PID mode off. If Radiate stops, the valve keeps working on its own.
Code: `TrvWriter`, `GOVERNED_STATIC` in `radiate.drivers.z2m`.
_Avoid_: pinned mode (holding a fixed valve position, which Radiate deliberately does not do).

**Opening limit**:
How far a TRV may open when it calls for heat, as a percentage of its stroke. Written to the TRVZB attribute `valve_opening_degree`.
Symbol `o_r`, %. Code: `ValveAction.opening`, HA sensor `opening_limit`, Elastic `valve.opening_pct`.
_Avoid_: opening (on its own), valve position, cap.

**Allocated opening**:
The opening limit the allocator computes for a room this tick, before write discipline.
Code: `Allocation.openings`.

**Opening floor**:
The lowest opening limit the allocator gives any room it allocates. Default 20 %. It protects TRVZB calibration and keeps every calling room warming.
Symbol `o_floor`, %. Code: `HouseConfig.opening_floor`.

**Closing degree**:
How far the TRVZB closes when its thermostat is satisfied. Radiate always writes 100 (fully closed).
Code: `ValveAction.closing`, TRVZB `valve_closing_degree`.

**External temperature input**:
The room sensor reading Radiate writes into a TRVZB so it regulates on room temperature, not on its own sensor. The TRVZB reverts to its internal sensor after about 2 hours without an update, so Radiate resends it at least every 25 minutes.
Code: `ValveAction.external_temperature`, `TrvOptions.external_keepalive_s`, TRVZB `external_temperature_input`.
_Avoid_: remote temperature, external sensor.

**Call bias**:
The amount, 0.6 K, Radiate adds to a TRV's setpoint while it wants that room heated and the boiler is in lead or firing, so the TRV's own thermostat keeps its valve open. In an internal-sensor room the result is rounded up, so the TRV's hysteresis band stays above the reading at which Radiate calls.
Code: `CALL_BIAS_K` in `radiate.core.decide`.

**Sink lead**:
The least a top-up room's TRV setpoint sits above the TRV's reading while the boiler is in lead or firing: 1 K, rounded up to 0.5 K. A top-up room is often already at its target, inside the TRV's own hysteresis band, where the valve would otherwise stay shut.
Code: `SINK_LEAD_K` in `radiate.core.decide`.

**Close bump**:
When an opening limit falls by 10 points or more, Radiate first writes the new value plus 10, then the new value 5 seconds later. A workaround for reported TRVZB calibration drift.
Code: `ValveAction.pre_opening`, `CLOSE_BUMP`, `TrvOptions.close_bump_delay_s`.

**Write discipline**:
The rules that hold back valve writes to protect batteries and calibration: skip changes under 3 points, at most one opening write per valve per 10 minutes unless the change is 15 points or more, and the close bump.
Code: `_discipline` in `radiate.core.decide`, `MIN_OPENING_STEP`, `OPENING_WRITE_INTERVAL_S`, `BIG_OPENING_STEP`.

**Reconciler**:
The part of the TRV writer that resends a setting when the TRV's reported value disagrees with what was sent for more than 5 minutes (2 minutes for the setpoint). After three attempts it marks the setting failed (rejected) and raises an alert. A rejected setting pauses learning for the room while it lasts and for an hour after. Not reported in dry run, where nothing is sent.
Code: `TrvWriter.plan`, `TrvWriter.failed`, `RECONCILE_GRACE_S`, `MAX_ATTEMPTS`, alert `driver.write_failed`, `RoomInput.trv_rejected`, learning gate `valve_rejected`, API `rooms[].valve.rejected`.

**Schedule mirror**:
Radiate writes each room's weekly schedule into its TRVZB and runs the valve in `auto` mode, so the valve follows the schedule if Radiate stops. For a household room it writes the valve schedule for everyone at home, which includes the fixed preheat, whoever is away (fail warm).
Code: `TrvOptions.schedule_mirror`, `WeekSchedule.trvzb_payload`, config key `trv.schedule_mirror`.

## Room model and learning

**Room model**:
The first-order model Radiate learns for each controllable room: `dT/dt = a * drive - b * (T - T_out) + d`.
Code: `RoomEstimator` in `radiate.core.estimator`.

**Heating gain**:
How fast a room warms with its valve fully open at full supply.
Symbol `a`, K/h. Code: `RoomEstimator.a`, HA sensor `heating_gain`, Elastic `model.a`.

**Loss rate**:
How fast a room cools per kelvin of difference from outdoors.
Symbol `b`, 1/h. Code: `RoomEstimator.b`, HA sensor `loss_rate`, Elastic `model.b`.

**Steady heat**:
Constant extra heat in a room that is not from its radiator, such as a range cooker or a warm neighbour. Held near 0 unless the room has a continuous heat source.
Symbol `d`, K/h. Code: `RoomEstimator.d`, Elastic `model.d`.

**Residual**:
The observed warming rate minus what the room model predicts. A sustained positive residual signals unexplained heat.
Unit K/h. Code: `RoomState.residual`, `RoomEstimator.residual`.

**Confidence**:
How far the uncertainty of a room's heating gain has shrunk from its prior, from 0 (nothing learned) to 1.
Code: `RoomEstimator.confidence`, HA sensor `confidence` (as %), Elastic `model.confidence`.

**Learning memory**:
How long a room model remembers, in days of learning: one learning update per minute tick that passes every gate. Default 730 days, 1 to 3650. Sets the forgetting factor `λ = 1 − 1/(days × 1440)`.
Code: `LearningConfig.memory_days`, `RoomEstimator.lam`, `forgetting` in `radiate.core.estimator`, config key `learning.memory_days`.
_Avoid_: forgetting factor, except for `λ` itself.

**Change detection**:
A room model checking its own residuals so a long learning memory still follows a real change, such as a radiator bled, replaced or silting up. When the residual's slope against the drive stays at 35 % of the heating gain over about 6 hours of learning, or its mean stays at half its root mean square over about a day, the model re-learns: part of the prior covariance is added back, so new data outweighs the old memory.
Code: `RoomEstimator.change_detected`, `RoomEstimator.relearn`, `RoomEstimator.relearns`, reason `learning.relearn`.
_Avoid_: reset (the model keeps what it learned and adapts from there).

**Flow fraction**:
The share of full flow a valve passes at a given opening limit.
Symbol `f(o)`, 0 to 1. Code: `flow_fraction` in `radiate.core.valve` (inverse `opening_for`).

**Dead zone**:
The opening limit below which a TRVZB passes no useful flow. Default 8 %. Above the saturation point, 70 %, more opening adds no flow.
Symbols `o_dead`, `o_sat`, %. Code: `O_DEAD`, `O_SAT`.

**Supply factor**:
The share of boiler flow each open radiator gets. It falls as more valves open.
Symbol `S`, 0 to 1. Code: `supply_factor`, `EngineState.supply`, Elastic `supply.factor`.

**Kappa**:
How strongly the supply factor falls with total opening. Fixed at 0.15; learning it is planned.
Symbol `κ`, dimensionless. Code: `HouseConfig.supply_kappa`.

**Bypass equivalent**:
The always-open path through the bypass radiator, counted in fully open radiators. Default 0.4.
Symbol `κ_bypass`. Code: `HouseConfig.bypass_equivalent`.

**Heat availability**:
Whether hot water is reaching a radiator: 0 while the boiler is off or the store has priority, and 1 once the arrival lag has passed after flow starts.
Symbol `φ`, 0 or 1. Code: computed inline in `decide` (`flowing`, `avail`); no named field.

**Drive**:
The product of supply factor, flow fraction and heat availability for one radiator, low-pass filtered with a 15-minute time constant. It is the heating input to the room model.
Unit 0 to 1. Code: `RoomState.drive`.

**Arrival lag**:
Time from heat becoming available to a clear rise in a radiator's TRV internal temperature: a 0.6 K rise within 40 minutes of flow starting. Short lag means near the boiler or high flow. The median of the last 15 measurements, and 8 minutes before the first.
Symbol `τ_r`, min. Code: `RoomState.arrival_lag_s`, `RoomState.lag_samples`, HA sensor `arrival_lag`, Elastic `model.arrival_lag_min`.
_Avoid_: delay, warm-up time.

**Flow sensitivity**:
How much a room's observed heating gain changes with the supply factor. A flow-limited room (`η >= 0.5`) is helped by balancing; an emitter-limited room (`η < 0.2`) is not, because its radiator is too small. Not learned yet: every room uses 0.7, so every room counts as flow-limited.
Symbol `η`, dimensionless. Code: `AllocRoom.eta`, `EMITTER_LIMITED_ETA`.

**Learning gate**:
A rule that stops a sample being used to update a room model. A room is learning when no gate is closed.
Code: `RoomState.learning_gate`, values `fire`, `fire_holdoff`, `window`, `shower`, `cooker_spike`, `unexplained_heat`, `no_heat`, `valve_untrusted`, `valve_leaking`, `valve_rejected`, `no_data`, `sensor_stale`, `trv_offline`, `store_recovery`, `setpoint_change`, and `starting` before the first tick. Elastic `learning.gate`.

**Sensor stale gate**:
The learning gate that pauses a `normal` room while its own sensor is stale and its temperature comes from the TRV reading plus the TRV bias, and for the 15-minute slope window after the sensor is back. The TRV reads its radiator as much as the room. Set `learning.learn_on_trv_fallback: true` to learn from the TRV reading instead.
Code: gate `sensor_stale`, `RoomState.fallback_until`, `LearningConfig.learn_on_trv_fallback`.

**Disturbance**:
A detected event that heats or cools a room for reasons other than its radiator. Each one closes a learning gate while it lasts.
Code: `DisturbanceState`, `radiate.core.disturbance`.

- **Fire**: an episodic heat source is active in the room. Radiate closes its valve, takes it out of boiler demand and stops learning. Raised by the fire switch, a rise with the radiator off for 30 minutes, or a large sustained residual. Code: `DisturbanceState.fire`, API `POST /api/v1/rooms/{id}/fire`.
- **Fire hold-off**: the 4 hours after a fire clears, while masonry still radiates heat. Learning stays paused. Code: `fire_holdoff_until`.
- **Window**: a window sensor reports open, or the room drops 0.6 K within 5 minutes. Code: `window_until`.
- **Shower**: bathroom humidity 8 points or more above its 2-hour median, with a 45-minute hold-off. Code: `shower_until`.
- **Cooker spike**: a sustained residual in a room with a continuous heat source, such as cooking on a range cooker. Code: `spike_kind = "cooker_spike"`.
- **Unexplained heat**: the same signal in a room with no heat source, for example sun or guests. Code: `spike_kind = "unexplained_heat"`.

## Allocation and balancing

**Balancing**:
Sharing boiler flow between radiators so rooms that call together get their share. When off, every heating valve opens fully (used for comparison in the simulator).
Code: `HouseConfig.balancing`, config key `balancing`.

**Synchronised arrival**:
The balancing goal: rooms that call for heat together reach their target at about the same time.

**Allocator**:
The joint, model-based solve that sets each calling room's opening limit for synchronised arrival, iterating because throttling raises the supply factor.
Code: `allocate`, `AllocRoom`, `Allocation` in `radiate.core.allocator`.

**Gap**:
How far a room is below its target.
Symbol `g_r`, K. Code: `AllocRoom.gap_k`, Elastic `demand.gap_k`.

**Target arrival**:
The time the allocator paces rooms to arrive at. The slowest flow-limited room at full opening sets it.
Symbol `T*`, h. Code: `Allocation.t_star_h`.

**Sets the pace**:
A room that may set the target arrival: a `normal` room that is not being topped up.
Code: `AllocRoom.sets_pace`.

**Capacity limited**:
The target arrival is beyond the comfort horizon, so throttling cannot help and the allocator paces at the horizon.
Code: `Allocation.capacity_limited`.

**Comfort horizon**:
The longest target arrival the allocator accepts. Default 150 minutes.
Code: `HouseConfig.comfort_horizon_s`.
_Avoid_: comfort limit (that is the boiler's pooling threshold in K).

**Optimum start**:
Heating a room early so it reaches its next scheduled setpoint on time, based on its learned heating gain and arrival lag. It looks up to three hours ahead, or as far as the return warm-up for a return.
Code: `_preheat_due`, `PREHEAT_MAX_S`, `RoomInput.preheat_max_s`, `RoomState.preheating`, UI badge "Preheating".
_Avoid_: preheat as a noun for the feature; use "preheating" for the room state.

**Deadline**:
The time until a preheating room's next scheduled setpoint applies. The allocator throttles a preheating room only as far as still gets it there in time.
Code: `RoomState.deadline_s`, `AllocRoom.deadline_h`, `DEADLINE_SAFETY`.

**Lockshield cap**:
A room's long-run opening limit: the 90th percentile of its allocated openings while the boiler fires, from a histogram that decays by half in about 23 hours of firing, and 60 % until there is enough data. Radiate writes it whenever the room is not being allocated, so balancing persists without Radiate. Named after the plumber's lockshield valve.
Symbol `L_r`, %. Code: `RoomState.lockshield`, `RoomState.lockshield_hist`, Elastic `valve.lockshield_pct`.
_Avoid_: cap (on its own), max opening.

## Demand and boiler

**Setpoint**:
The temperature a room's schedule, or an override, asks for now.
Symbol `T_set`, °C. Code: `RoomInput.setpoint`.

**Target**:
The temperature Radiate is heating a room towards this tick: the setpoint, the next setpoint while preheating, or the frost threshold in `off` and `frost` modes.
Code: `RoomState.target`, API `rooms[].target`.

**Override**:
A setpoint set through the API, the web UI's setpoint control or the Home Assistant climate entity that replaces the schedule until the next scheduled change, for a set time, or until cleared. Saved across restarts. The UI calls it a hold ("Held until 22:30") and clearing it "Resume schedule".
Code: `Runtime.overrides`, API `POST /api/v1/rooms/{id}/setpoint`, `rooms[].override` in `state`.

**Calling**:
A room Radiate wants heated: it started calling when its gap passed the hysteresis and stops when it reaches its target.
Code: `RoomState.calling`, Elastic `demand.calling`.
_Avoid_: using "calling" for the TRV's own `running_state: heat`; call that "the TRV is heating".

**Hysteresis**:
How far below target a room must fall before it starts calling. 0.3 K for normal rooms, 1.0 K for internal-sensor-only rooms.
Unit K. Code: `HouseConfig.hysteresis_k`, `HouseConfig.internal_sensor_hysteresis_k`.

**Demand**:
The set of calling rooms and how far they are below target, which together decide whether the boiler should fire.

**Demand pooling**:
The rule for when calling rooms fire the boiler, set by the demand mode. In every mode a room preheating or a room below the frost threshold fires it.
Code: `want_fire` in `decide`.

**Demand mode**:
How calling rooms fire the boiler. Set by `boiler.demand_mode` and changeable at runtime through the API. Two values:

- `eco` (default): rooms fire the boiler together. The pooled demand must reach 1.5 minimum burns, or one room must be more than the eco limit below its target. A small room on its own waits until it is colder or other rooms join it. Planned: room use will set each room's part (solo limit, pooled demand, keeping the burner on, top-ups).
- `comfort`: any calling room more than the comfort limit below its target fires the boiler, as does a predicted burn of 1.5 minimum burns.

Code: `DemandMode`, `BoilerConfig.demand_mode`, `Snapshot.demand_mode`, `Runtime.demand_mode`, API `POST /api/v1/settings`, `settings.demand_mode` in `state`.
_Avoid_: economy mode, comfort mode as names for the heating mode (`auto`, `off`, `frost`).

**Pooled demand**:
The time at full radiator output the calling rooms need between them: the sum of each calling room's gap divided by its heating gain. A room that warms quickly counts for less. Used by the `eco` demand mode.
Symbol `D`, min. Code: `_pooled_demand_s` in `decide`, `EngineState.pooled_demand_s`, API `boiler.pooled_demand_min`, reason `demand.pooled` for a room left waiting.

**Comfort limit**:
In the `comfort` demand mode, the most any calling room may sit below its target before it fires the boiler. Default 0.5 K.
Code: `BoilerConfig.comfort_limit_k`, config key `boiler.comfort_limit_k`.

**Eco limit**:
In the `eco` demand mode, the most a calling room waits below its target for other rooms before it fires the boiler on its own. Default 1.5 K, 0.5 to 3 K.
Code: `BoilerConfig.eco_limit_k`, config key `boiler.eco_limit_k`.

**Room use**:
How a controllable room is used right now, worked out by the runtime each tick and recorded in the snapshot ([ADR-0004](adr/0004-efficiency-by-room-use.md), [spec 5.8](spec.md#58-room-use-in-demand)): `in_use` (inside a warm period on a day its use level is in use, in a warm period a room adjustment added, or with an override), `occasional` (inside a warm period on an occasional day) or `setback` (any other time). From the household, or for a room on a hand-written schedule from its `use` key, where its warm periods are the spans above the day's lowest setpoint. None for a hand-written room without `use`, which keeps today's behaviour. Planned, not built: in `eco` it decides the room's part in demand.
Code: `RoomUse`, `RoomInput.use`, `room_use`, `schedule_room_use` and `schedule_periods` in `radiate.config.use`, `CompiledHousehold.warm_levels`, `Runtime._apply_use`; planned API `rooms[].use` in `state`.
_Avoid_: use level for this. The use level is the household's setting for a room and a day type; room use is what applies this minute.

**Setback**:
Planned, not built. The room use of a room outside its warm periods: unused that day, overnight, between warm periods, or with its people away. A setback room never counts towards pooled demand, never takes a burn extension, is the last choice for a heat sink, and starts a burn on its own only at its solo threshold.
Code: `RoomUse.SETBACK`, reason `demand.setback`.
_Avoid_: unused for this, which is a use level.

**Solo limit, solo threshold**:
Planned, not built. In `eco`, how far below its target a calling room waits before it starts a burn on its own: the eco limit for a room in use (or with no room use), the eco limit plus 1 K for an occasional or setback room. The solo threshold is the temperature that gives; for a room with room use it is never below the damp floor, or the room's own target if lower: `max(target − limit, min(target, damp_floor_c))`.
Code: `solo_threshold_c` and `SOLO_EXTRA_K` in `radiate.core.decide`.

**Solo latch**:
Planned, not built. Set when a calling room passes its solo threshold and so may start a burn alone; cleared when it stops calling. A setback room keeps the burner running only while its solo latch is set.
Code: `RoomState.solo`, API `rooms[].solo`, reason `demand.floor`.

**Damp floor**:
Planned as a control limit, not built. The temperature no saving rule lets a room wait below: 12 °C, the level below which walls and window frames can get damp. Today it is only a warning in the household setup. Frost protection sits below it and is unchanged.
°C. Code: `DAMP_FLOOR_C` and `BoilerConfig.damp_floor_c` in `radiate.core.types`; `DAMP_BELOW_C` in `radiate.config.household` takes its value from it.

**Predicted burn**:
How long the current calling rooms need the burner, taken from the target arrival.
Symbol `B`, min. Code: `predicted_burn_s` in `decide`, API `boiler.predicted_burn_min`.

**Top-up**:
A temporary target a little above the room's target given to a room that is not calling, so it absorbs heat during a burn: `max(target + 0.3, min(T₀ + 0.5, target + 1.0))`, where `T₀` is the temperature when the top-up started. Covers both burn extension and heat sinks.
Code: `RoomState.topup`, `_topup_target`, `TOPUP_K`, Elastic `demand.topup`.

**Burn extension**:
A top-up for a room predicted to call soon after the burner stops, so one longer burn replaces two short ones. Only burn extensions may keep the burner running.
Code: `RoomState.extend`, reason `boiler.topup`, API `rooms[].extend`, UI badge "Topping up".
_Avoid_: heat sink for this case; the UI status line says "topping up Bedroom 2 to save a second burn soon".

**Heat sink**:
A room opened as somewhere for the burner's heat to go, because too few radiators are open. Older text called it a dump room, and the reason code keeps that name.
Code: `_ensure_sink`, reason `boiler.dump_room`, API `rooms[].topup` with `extend` false, UI badge "Heat sink".
_Avoid_: dump room.

**Open-path guarantee**:
During lead and firing, the rooms calling or topped up, each counted as one fully open radiator, plus the bypass equivalent must add up to at least the sink minimum (default 1.5 fully open radiators). If not, Radiate opens heat sinks.
Code: `HouseConfig.sink_min`, `_ensure_sink`.

**Stuck valve**:
A radiator that stays cold for three burns in a row while its valve should be open and other radiators warm. Radiate alerts and stops trusting that valve until it warms again.
Code: `ValveCheck` in `radiate.core.health`, reason `valve.stuck`, API `rooms[].valve` (`untrusted`, `misses`), HA binary sensor "Stuck valve", UI line "Valve may be stuck".

**Leaking valve**:
A radiator that warms during a burn while its valve should be shut: the TRV's reading rises at least 1 K against the room sensor in 2 of the last 5 judged burns. Usually lost calibration or a worn seat. Radiate alerts, stops trusting the valve and pauses learning for the room until 5 judged burns in a row stay cool. The spec calls this "rise with valve closed".
Code: `ValveCheck.observe_shut`, `LEAK_RISE_K`, reason `valve.leaking`, learning gate `valve_leaking`, API `rooms[].valve` (`leaking`, `leak_burns`, and `untrusted`, which covers both checks), UI line "Valve may not be closing".

**Boiler guard**:
The state machine that alone decides the heating relay and enforces minimum burn, minimum off and starts per hour, whatever demand asks for.
Code: `BoilerGuard` in `radiate.core.boiler`.

**Boiler state**:
The boiler guard's state. One of four values:

- `idle`: burner off and free to start.
- `lead`: valves opening before the burner is called, for the valve lead time.
- `firing`: heating relay on; minimum burn enforced.
- `rest`: burner off; minimum off time running.

Code: `BoilerState`, HA sensor `boiler_state`, Elastic `boiler.state`.

**Valve lead time**:
How long the boiler stays in `lead` so TRVs can open before the burner fires. Default 90 s.
Code: `BoilerConfig.valve_lead_s`.

**Minimum burn**:
The shortest time the heating relay stays on once on. Default 8 minutes. Short oil burns soot and condense.
Code: `BoilerConfig.min_burn_s`, config key `boiler.min_burn_min`.

**Minimum off**:
The shortest time the heating relay stays off after a burn. Default 10 minutes, raised for a day while short-cycling is seen.
Code: `BoilerConfig.min_off_s`, config key `boiler.min_off_min`, effective value in API `boiler.min_off_s`.

**Short-cycling**:
More than four relay starts in an hour, or burns cut short by an external stop for two hours running. Either points to another controller, a manual switch or a failing relay. Radiate alerts and lengthens minimum off for 24 hours.
Code: `EngineState.short_cycle`, API `boiler.short_cycle` (`extra_off_min`, `ends_in_h`), UI tag "Short-cycling".

**Balance score**:
How evenly rooms that call together reach setpoint, scored per day from 0 to 100: 100 × (1 − median arrival spread / 120 min). The arrival spread is the time between the first and last room reaching setpoint after a start with two or more calling rooms.
A partial day has no balance score.
Code: `balance_score` in `radiate.core.accounting`, API `accounting.{today,yesterday}.balance`, UI "Balance, yesterday".

**Partial day**:
A local day Radiate did not see in full: it started after midnight (a first install, or a restart without saved state), or more than 30 minutes of the day went unseen between ticks, including time down across a restart. Its totals cover what Radiate saw, and its balance score is null. The UI shows "Not a full day of data" in place of yesterday's balance score.
Code: `DayTotals.partial`, `PARTIAL_AFTER_S` in `radiate.core.accounting`, API `accounting.{today,yesterday}.partial`, Elastic `radiate.partial_day`.

**Starts per hour**:
The most relay starts allowed in any 60 minutes. Default 3. Always relay starts, never burner starts.
Code: `BoilerConfig.max_starts_per_hour`, `BoilerGuard.starts_last_hour`.

**Relay start**:
The heating relay switching on. Radiate controls these.
_Avoid_: burner start for this.

**Burner start**:
The burner itself firing. The boiler's own thermostat can cycle the burner several times within one relay start. Radiate can't see burner starts without a burner-firing signal; the simulator counts them as "physical burner starts".

**Frost threshold**:
Any room below it makes the boiler fire regardless of pooling. Default 7 °C. Below the hard frost threshold, 5 °C, the start also ignores minimum off and starts per hour.
Code: `BoilerConfig.frost_c`, `BoilerConfig.hard_frost_c`.

**Frost override**:
The boiler start forced by a room below the frost threshold.
Code: `frost`, `hard_frost` in `decide`.

**Mode**:
The house-wide heating mode: `auto` (follow schedules), `frost` (hold every room at the frost threshold), or `off` (no heating, frost protection still active). The mode a person chose is `Runtime.mode`; while everyone is away, the core runs in the effective mode, `frost` in place of `auto`.
Code: `Mode`, `Runtime.mode`, `Runtime.effective_mode`, API `POST /api/v1/mode`, HA service `radiate.set_mode`, HA select `mode` (shows the mode the person chose).

**Store**:
The hot-water store inside the boiler, enabled by its own relay channel on a schedule.
Code: `StoreConfig`, `Snapshot.store_relay`, `Actions.store_relay`, HA binary sensor `store`.
_Avoid_: tank, cylinder, DHW.

**Store window**:
A daily period when the store relay is on. At most four a day.
Code: `StoreConfig.windows`, config key `store.windows`.

**Store boost**:
The store relay turned on outside its windows for a set time, 60 minutes by default.
Code: `Snapshot.store_boost`, `Runtime.store_boost_until`, API `POST /api/v1/store/boost`, HA service `radiate.boost_store`, HA binary sensor `store_boost`.

**Store recovery**:
The period after the store relay turns on when the boiler heats the store first and radiators get no flow (hot-water priority). Heat availability is 0 and learning is gated.
Code: `StoreConfig.recovery_s`, `StoreConfig.priority_over_heating`, gate `store_recovery`.
_Avoid_: DHW priority.

## Savings

Built ([ADR-0004](adr/0004-efficiency-by-room-use.md), [spec 5.9](spec.md#59-savings)): the core (`radiate.core.savings`), the API (`radiate.server.savings`) and the Savings view (`web/savings.js`).

**Savings**:
The oil Radiate estimates it saved against the savings baseline, from measured temperatures and measured oil, with the comfort it cost shown beside it. In litres, per day and in total, and as a percentage of the baseline's litres. A day's saving can be negative.
Code: `radiate.core.savings` (`SavingsMeter`, `report`), `radiate.server.savings` (`savings_view`), API `GET /api/v1/savings`, UI "Savings" tab (`web/savings.js`).
_Avoid_: "up to" figures, and "savings" for a simulated or projected figure.

**Savings baseline**:
What savings are measured against: a heating timer on from the first person up to the last to bed every day, with each room's valve at its usual temperature for its use level. Compiled from the household with nobody away and no room adjustments, and passed in every snapshot (built). Rooms on hand-written schedules have none. Shown on screen in one sentence.
Code: `compile_baseline` and `compile_schedule_baseline` in `radiate.config.use`, `RoomInput.baseline_c`, `Snapshot.baseline`, API `baseline` in `GET /api/v1/savings`.

**Degree-hours**:
How much warmer than outside a room was kept, summed over time: `max(0, T − T_out)` per hour, in K·h. Actual degree-hours use the room's reading; baseline degree-hours use the baseline room temperature. Heat loss, and so oil, follows degree-hours.
Symbol `DH`, K·h. Code: `RoomDay.dh_actual_kh`, `RoomDay.dh_baseline_kh`.

**Lift**:
How much warmer Radiate's own heating has made a room than the savings baseline would have, built up while the baseline would not have heated the room (timer off, or Radiate's setpoint above the baseline's) and decaying at the room's loss rate. Subtracted from the reading to get the baseline room temperature, so time Radiate spends heating outside the baseline's hours counts against the saving.
K. Code: `SavingsMeter.lift_k`.

**House signature**:
The straight line that turns weighted degree-hours into litres for this house, `litres = k · DH + c`, fitted with Theil-Sen, which resists odd days, over the last 60 eligible days. `k` is litres per degree-hour; `c` absorbs standing losses.
Code: `fit_signature`, `Signature` in `radiate.core.savings`, API `fit`.

**Room weight**:
How much a room's degree-hours count in the house's total for savings: in proportion to `b / a`, the radiator time each kelvin needs, or equal weights until every counted room's model is confident.
Code: `room_weights` in `radiate.core.savings`.

**Eligible day**:
A closed day that can carry a saving: not partial, a real outdoor reading and a baseline for at least 90 % of it, litres known, and the same litres basis as the rest of the fit. Savings appear only once there are 14, and the house signature fits within 25 % CV(RMSE).
Code: `why_not_eligible` in `radiate.core.savings`, API `days[].eligible`, `days[].why`, `progress`.

**Comfort deficit**:
For savings and the simulator: how far rooms in use (and occasional rooms) were below their setpoint less 0.5 K, summed over time, in K·h. Shown beside every saving.
K·h. Code: `RoomDay.deficit_kh`, `Result.comfort_deficit_kh` in `radiate.sim.runner`, API `comfort_deficit_kh`.
_Avoid_: comfort minutes below, which is the ledger's older count of minutes below the comfort limit.

**Warm share**:
The share of minutes rooms were in use (or occasional) that they were at or above their setpoint less 0.5 K. The headline's "rooms in use warm 98 % of the time".
Code: `RoomDay.warm_ok_min / RoomDay.warm_min`, API `warm_share`.

**Daily history**:
The closed day summaries kept for savings, oldest first, one per day, for 730 days. Savings are worked out from it at report time, so changing room weights applies to every kept day.
Code: `DailyHistory` in `radiate.server.savings`, state database key `daily_history`, `Runtime.daily`.
_Avoid_: tick history, which is the per-tick record kept for replay.

**Not counted**:
The UI's words for a closed day that isn't an eligible day. Shown as an empty slot with its reason, never as zero.
Code: API `days[].eligible` false with `days[].why`.

**Litres basis**:
What litres are worked out from: `relay` (heating relay time, an upper bound, the only basis today) or `firing` (burner firing seen in the Shelly's channel 1 power, planned). A house signature uses days of one basis only.
Code: `basis` in the daily summary and in `GET /api/v1/savings`; planned `Snapshot.heating_power_w`, `BoilerConfig.firing_power_w`.

## Safety and fallback

**Safe mode**:
What Radiate does when it cannot reach any TRV: it stops the burner after minimum burn, switches the relay off, stops sending the heartbeat so the watchdog takes over, and raises the `safe_mode.no_trvs` alert.
Code: `force_stop` in `decide`, `Actions.watchdog_handover`, alerts `safe_mode.no_trvs` and `driver.watchdog_handover`, API `boiler.watchdog_handover`.

**Hand-back**:
Radiate taking the relay back from the watchdog, after safe mode, an outage, a crash or a restart. The boiler guard adopts the relay as it finds it, so it neither cuts a burn it did not start short of minimum burn nor starts a new one inside minimum off.
Code: `BoilerGuard.adopt`, `Snapshot.heating_relay_unseen_s`, `Snapshot.heating_relay_age_s`, `EngineState.relay_unseen_s`.

**Adopted burn**:
A burn Radiate did not start (the watchdog's, or a manual switch) that the boiler guard has taken on. Its start time is unknown, so it gets a full minimum burn from when Radiate first sees it. In safe mode Radiate leaves it to the watchdog.
Code: `BoilerGuard.external`, reason `boiler.adopted`, API `boiler.adopted`.
_Avoid_: external burn in UI text.

**External stop**:
The heating relay switching off while Radiate had it on, for example by the watchdog, a manual switch or the Shelly restarting. Minimum off runs from when Radiate sees it.
Code: reason `boiler.external_stop`.

**Unseen relay**:
A relay Radiate could not read for 5 minutes or more (Shelly unreachable, Radiate down, or a first start). The watchdog might have switched it meanwhile, so the guard restarts its timers from the relay as observed.
Code: `HIDDEN_RELAY_S`, reason `boiler.relay_unseen`.

**Watchdog**:
A script that runs on the Shelly relay and takes over the boiler and store channels when Radiate's heartbeat is more than 10 minutes old.
Code: `shelly/radiate-watchdog.js`, `ShellyBoiler.install_watchdog`, CLI `radiate shelly install-watchdog`.

**Heartbeat**:
The Unix time Radiate writes to the Shelly every tick so the watchdog knows it is alive. Not sent in dry run.
Code: KVS key `radiate_hb`, `HEARTBEAT_KEY`, `ShellyBoiler.command`.

**Fallback windows**:
The heating and store windows the watchdog follows when it has taken over. Radiate derives the heating windows from the room schedules, starting each an hour early, and keeps both in the Shelly's key-value store.
Code: KVS keys `radiate_heat` and `radiate_store`, `fallback_heating_windows`, `ShellyBoiler.push_fallback`.

**Auto-off**:
The time after which the heating relay switches itself off unless Radiate asserts it again, so it can never latch on. Default 120 minutes.
Code: `ShellyConfig.auto_off_s`, Shelly `toggle_after`, config key `shelly.auto_off_min`.

## Devices and the Zigbee network

**Device health**:
What Radiate knows about one device it depends on: whether it is reachable, its battery, its signal, when it was last heard, its latest readings and its route. Shown in the Devices view; it never reaches the core.
Code: `DeviceHealth` in `radiate.drivers.devices`, `LiveDriver.health`, API `GET /api/v1/devices`, UI "Devices".

**Device status**:
One word per device: `ok`, `attention` (low battery, weak signal or a silent sensor) or `offline` (not reachable). UI badges "Online", "Needs attention", "Offline", and "No data yet" before anything is heard.
Code: `DeviceHealth.view`, API `devices[].status`.

**Low battery**:
A battery at or below `monitoring.low_battery_pct`, 20 % by default.
Code: `HealthLimits.low_battery_pct`, alert `device.low_battery`, API `devices[].battery_low`.

**Link quality (LQI)**:
Zigbee2MQTT's `linkquality`, 0 to 255, for the last message heard from a device. Shown as a signal strength: strong at 100 and above, weak below `monitoring.weak_signal_lqi` (40 by default), fair between. Stacks measure it differently, so the number is shown with the word.
Code: `signal` and `HealthLimits` in `radiate.drivers.devices`, alert `device.weak_signal`, API `devices[].linkquality` and `devices[].signal`.
_Avoid_: RSSI, which is a different measure.

**Silent sensor**:
A temperature sensor that has sent no temperature for `house.sensor_max_silence_min`, while not known to be offline. The same limit after which the core counts its reading as stale.
Code: alert `device.stale`, API `devices[].reading_age_s`, UI "No temperature for 2 h."

**Router**:
A mains-powered Zigbee device, such as a smart plug, that relays messages for battery devices near it. Not in the house file: Radiate finds routers in Zigbee2MQTT's retained `bridge/devices`.
Code: `DeviceStore.routers`, `BridgeDevice`, API `devices[].kind` `router`.

**Route**:
The node a device talks through, its parent in the mesh: a router or the coordinator. Known only after a network scan.
Code: `Route`, `NetworkMap.routes`, API `devices[].route` (`via`, `via_kind`, `lqi`).

**Network scan**:
A raw network map asked of Zigbee2MQTT (`bridge/request/networkmap`), to find each device's route. It slows the mesh for up to 2 minutes, so it runs only when a person asks, one at a time and at most every 10 minutes. Allowed in dry run: it changes no device.
Code: `NetworkScan`, `LiveDriver.request_network_scan`, API `POST /api/v1/devices/scan` and `scan` in `GET /api/v1/devices`, UI "Scan network".
_Avoid_: network map refresh, which suggests it runs by itself.

## House suggestions

**House suggestion**:
A piece of advice about the house that Radiate derives from what it has measured or learned: a room that loses heat quickly, a radiator that may be too small or is slow to warm, a valve passing heat when shut, or a weak Zigbee link. Each has a severity, the evidence in words, what to do and a confidence with what it rests on. A room without enough learning gets none.
Code: `Suggestion` and `suggest` in `radiate.core.suggestions`, `SuggestionConfig`, config section `suggestions`, API `GET /api/v1/suggestions`, UI "Suggestions".
_Avoid_: recommendation, insight.

**Severity**:
How pressing a house suggestion is: `act` (UI "Act on this"), `consider` ("Worth considering") or `info` ("For information").
Code: `Suggestion.severity`, API `suggestions[].severity`.

**Suggestion confidence**:
How much data backs a house suggestion, in words: `low`, `medium` or `high`, with a sentence saying what it rests on ("From 87 h of learning in Bedroom 2."). Not the same as a room model's numeric confidence, which feeds it.
Code: `Suggestion.confidence` and `Suggestion.basis`, API `suggestions[].confidence` and `suggestions[].basis`.

**Learning status**:
Whether a room can be judged for house suggestions yet: `ready` (at least `suggestions.min_learning_h` of learning and both its heating gain and loss rate at least `suggestions.min_confidence` certain), `learning`, or `not_judged` (measured only by its TRV, or with a continuous heat source whose steady heat the model can't tell from its loss and radiator).
Code: `RoomLearning`, API `learning[].status`, UI "Ready", "Learning", "Not judged".

**Loss confidence**:
How far the uncertainty of a room's loss rate has shrunk from its prior, from 0 to 1, as confidence does for the heating gain.
Code: `loss_confidence` in `radiate.core.suggestions`.

## House model

**House model**:
The drawing of the house at the top of the web UI's House page: each floor's rooms as blocks, floors stacked, each room coloured by its temperature. It shows the house; it never feeds the core.
Code: `createHouse` and `isoMarkup` in `web/house.js`, UI "Your house".
_Avoid_: "house model" for `HouseConfig`, the house as the configuration describes it, or for a room model. Section 2 of the spec is headed "House model" in that older sense (see Ambiguities).

**House layout**:
Where each room sits in the house model: a list of floors and, per placed room, a floor and a rectangle in metres. The owner draws it in the room editor. Control never reads it.
Code: `radiate.server.layout`, `Runtime.layout`, key `layout` in the state database, API `GET` and `PUT /api/v1/layout`, UI "Arrange rooms".
_Avoid_: floor plan for the saved data; the floor plan is the editor's view of one floor.

**Guessed layout**:
The house layout Radiate draws until one is saved: rooms whose names suggest an upper floor (bedroom, bathroom, landing and so on) on "First floor", the rest on "Ground floor".
Code: `guessLayout` in `web/house.js`, UI "Rooms are placed by a guess from their names."

**Boiler linked**:
Whether Radiate can switch the boiler: true when the configuration has a `shelly` section. Without it, the UI says the boiler switch isn't linked and never calls the boiler idle.
Code: `telemetry.boiler_linked` in `state`, set by `LiveDriver`.

## Engine and runtime

**Core**:
The pure control engine: no I/O, no clock, no Home Assistant imports, deterministic.
Code: `radiate.core`.

**Decide**:
One control step: `decide(config, snapshot, state) -> actions`.
Code: `radiate.core.decide.decide`.

**Engine state**:
Everything the core carries between ticks: room models, disturbances, the boiler guard.
Code: `EngineState`, `RoomState`; saved by `dump_state` and `load_state`.

**Tick**:
One run of the control loop, every 60 seconds in live mode.
Code: `Runtime.step`, `Runtime.run`.

**Snapshot**:
All inputs to one tick, timestamped and checked for staleness.
Code: `Snapshot`, `RoomInput`.

**Actions**:
The output of one tick: valve settings, relay states, boiler state, reasons and alerts.
Code: `Actions`, `ValveAction`.

**Reason**:
A short machine code plus a human message explaining a decision, for example `boiler.lead` or `room.fire`. Shown in the UI and exported to Elastic.
Code: `Reason` (`code`, `message`, `room_id`, `values`).

**Alert**:
A reason that needs a person's attention, for example an offline TRV or an unreachable relay.
Code: `Actions.alerts`, `LiveDriver.alerts`.

**Tick history**:
Every live tick's snapshot and compact actions (valve settings, relays, boiler state, reason and alert codes), kept in the state database for `house.history_days` days. A start entry records how the engine state was built at each start; a checkpoint copies the engine state every 6 hours.
Code: `radiate.core.history`, `radiate.server.history.History`, `Recorder`, table `history`, config key `house.history_days`.
_Avoid_: "recorder" for this, which means the Home Assistant recorder.

**Replay**:
Running recorded snapshots through `decide` again, in order, and comparing the result with the recorded actions. With saved state it reproduces the recorded actions exactly; with fresh state it starts from priors. Replay is open loop: the recorded temperatures don't respond to the replayed decisions.
Code: `Replayer`, `radiate replay`.

**Bootstrap**:
Learning room models from the tick history by replaying it from priors with a throwaway state, then keeping only the learned parts (models, arrival lags, lockshield histograms). The boiler guard and timers come from the saved state.
Code: `radiate.core.bootstrap`, `Runtime.restore`, `radiate bootstrap`.

**Decision log**:
The last 500 boiler, disturbance, safe mode and `learning.relearn` reasons, with the time they happened.
Code: `Runtime.decisions`, `DecisionRecord`, API `GET /api/v1/decisions`.

**Driver**:
The adapter between the runtime and devices, real or simulated. It builds snapshots and applies actions.
Code: `Driver` protocol in `radiate.server.runtime`; `LiveDriver`, `DemoDriver`.

**Device mapping**:
The pure part of a driver that turns device messages into readings and actions into device payloads, with no network or clock.
Code: `radiate.drivers.z2m` (`DeviceStore`, `TrvWriter`), pure helpers in `radiate.drivers.shelly`.

**Transport**:
The thin network part of a driver.
Code: `MqttTransport`, `ShellyRpc`.

**Runtime**:
The server object that owns configuration, engine state and a driver, runs ticks, and serves views to the API.
Code: `Runtime` in `radiate.server.runtime`.

**State database**:
The SQLite file that holds engine state, the house ID, the mode, overrides, away state, the house layout, the Elastic export queue and the tick history.
Code: `radiate.server.store.Store`, file `<data_dir>/radiate.db`.
_Avoid_: "store" on its own, which means the hot-water store.

**Edition**:
One way of packaging the same server: standalone, Home Assistant App, or cloud. See ADR-0002.

**App**:
The Home Assistant App edition, a Supervisor-managed container. Home Assistant renamed add-ons to Apps in 2026.2.
Code: `app/radiate/`.
_Avoid_: add-on.

**Integration**:
The thin Home Assistant client of the server API, installed through HACS. It has no control logic.
Code: `custom_components/radiate/` in the [radiate-ha](https://github.com/jamesagarside/radiate-ha) repository.

**Edge**:
The local standalone server that runs the control loop for the cloud edition. Not built yet.

## Ambiguities

What is still open. The owner's three behaviour questions (learning memory, pooled demand, learning on a stale room sensor) are decided in spec version 0.3 and described above under learning memory, change detection, demand mode and the sensor stale gate. The `LOCKSHIELD_DECAY` and `FORGETTING` comments that disagreed with their values are fixed or gone.

Names in code and UI text, for whoever next touches that code:

1. **Store means two things.** The hot-water store, and `radiate.server.store.Store` (the SQLite state database). Suggest renaming the class or module, for example `StateDb`.
2. **Heat sink and `boiler.dump_room`.** Prose and UI say heat sink; the reason code is still `boiler.dump_room`. Reason codes reach Elastic, so a rename is an API change.
3. **"Stuck valve" covers leaking valves.** The HA binary sensor (`valve_untrusted`, named "Stuck valve") and API `valve.untrusted` are on for a stuck or a leaking valve. Suggest a name such as "Valve problem".
4. **"House model" means two things.** The drawing at the top of the House page, and section 2 of the spec, "House model", which describes the house's objects (rooms, boiler, store). Suggest renaming the spec section, for example "House objects".
