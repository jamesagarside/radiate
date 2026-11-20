# Glossary

The shared language for Radiate. Use these words in code, docs, UI text, commit messages and reviews. Each entry gives the meaning, the symbol and unit where there is one, and the code identifier it maps to. Where two words compete, the entry names the one to use and lists the others under _Avoid_.

Units follow the spec: °C for temperatures, K for differences, K/h for heating and cooling rates, 1/h for loss rates, and % for valve openings. Code keeps times in seconds (`_s`), the configuration file uses minutes (`_min`), and the UI shows minutes.

Terms that docs or code use inconsistently are listed under [Ambiguities](#ambiguities) at the end.

## House and rooms

**House**:
Everything Radiate controls at one address: rooms, the boiler and the store.
Code: `HouseConfig` (core), `SiteConfig` (configuration file, devices and drivers).

**House ID**:
A random UUID that identifies a house in exports and to the Home Assistant integration. It never contains a name or location.
Code: `Runtime.house_id`, Elastic `radiate.house.id`.

**Room**:
A heated space with one radiator, at most one TRV and at most one room sensor.
Code: `RoomConfig` (configuration), `RoomState` (learned and live state), `RoomInput` (one reading).

**Room role**:
How Radiate treats a room. One of three values:

- `normal`: TRV plus room sensor. Fully controlled and learned.
- `passive`: no controllable valve, for example an unvalved bypass radiator. Observed only.
- `internal_sensor_only`: TRV with no room sensor. Uses the TRV's internal reading plus the TRV bias, a wider hysteresis, never sets the pace, and has its learning confidence capped at 0.5. Its TRV setpoint is written in the TRV's own frame.

Code: `RoomRole`, config key `rooms[].role`.
_Avoid_: "TRV only" for `internal_sensor_only`.

**Controllable**:
A room whose role is not `passive`.
Code: `RoomConfig.controllable`.

**Room sensor**:
The separate temperature sensor in a room (SNZB-02B in the reference house). Its reading is the room temperature `T`.
Code: `RoomInput.temperature`, config key `rooms[].sensor`.

**TRV internal temperature**:
The temperature the TRV measures at the radiator. Used for arrival lag, and as the room temperature when there is no fresh room sensor reading.
Symbol `T_trv`, °C. Code: `RoomInput.trv_temperature` (Zigbee2MQTT `local_temperature`).

**TRV bias**:
The offset added to `T_trv` to estimate room temperature. Default -1.5 K, because the TRV sits beside its radiator and reads high while the radiator is warm. Fixed: it is not refined from observations (see [ambiguity 21](#ambiguities)).
Code: `RoomConfig.trv_bias_k`, config key `rooms[].trv_bias_k`.

**TRV setpoint frame**:
The temperature a TRV compares its setpoint with, and so the frame Radiate writes the setpoint in. A normal room's TRV compares with the room sensor reading Radiate sends as its external temperature, so the setpoint is the room's target. An internal-sensor room's TRV compares with its own reading, which Radiate takes as room temperature minus the TRV bias, so the setpoint is the target minus the bias. Every TRV setpoint is a 0.5 K step from 4 to 35 °C.
Code: `_trv_setpoint` and `_trv_step` in `radiate.core.decide`.

**Bypass radiator**:
A radiator with no controllable valve that is always open, such as the reference house's stairs radiator. It has the `passive` role and counts towards the open path.
_Avoid_: unvalved room, manual room.

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
Code: `Household`, `compile_household` in `radiate.config.household`, config key `household`.

**Person**:
Someone who lives in the house. Has an ID, a display name shown only in the UI, and a routine for weekdays and one for the weekend. Can set their own getting-up time, bedtime and weekend days.
Code: `Person` (`getting_up_min`, `bedtime_min`, `weekend_days`), config key `household.people`.

**Routine**:
When a person gets up, is out, works from home, and goes to bed, on weekdays or at the weekend.
Code: `Routine` (`up_min`, `bed_min`, `out`, `work`), config keys `household.people.<id>.weekdays` and `.weekend`.

**Use level**:
How much a room is used: in use, occasional or unused. Each level has one house-wide temperature, 19, 16 and 14 °C by default. A room's level can differ at weekends.
Code: `UseLevel`, `Temperatures`, config keys `household.rooms.<id>.use` and `household.temperatures`.

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
The two weeks a household room compiles to. The valve schedule starts each warm period by the fixed preheat and fits the TRVZB's six changes a day; the schedule mirror and the Shelly fallback use it. The live schedule is what Radiate follows while it runs: each warm period starts when the room is needed, and optimum start decides how early to heat. With `live_preheat: fixed` the two are the same.
Code: `CompiledHousehold.schedules` and `CompiledHousehold.live`, `SiteConfig.schedule_for` and `SiteConfig.live_schedule_for`, `LivePreheat`, config key `household.timing.live_preheat`.

**Dropped period**:
A warm period left out of a room's valve schedule to fit the TRVZB's limit. Radiate still heats it while running.
Code: `DroppedPeriod` (`room_id`, `day_type`, `days`, `start_min`, `end_min`, `setpoint_c`, `text`), `CompiledHousehold.dropped`, `CompiledHousehold.notes`.

**Away**:
A person treated as not at home, so their part of every routine is dropped when compiling. A person counts as away through an away until, or through presence that has said not home for the presence delay. When the set of people away changes, the runtime recompiles the household.
Code: `effective_away`, `status` in `radiate.config.away`; `compile_household(away=...)`; `Runtime.away`, `Runtime.presence`. API `GET /api/v1/people`, `away` in `state`.

**Away until**:
A person's own statement that they are away until a local date and time, set in the web UI, the API or Home Assistant. It counts at once and clears itself at that time. With optimum start it counts right up to that time; with a fixed preheat it stops counting the preheat before it. It wins over a home that presence reported before it was set; arriving home after it was set ends it.
Code: `Presence.away_until`, `Runtime.set_away`, `Runtime.clear_away`, `Household.return_lead_min`, `RETURN_LEAD_S`, API `POST /api/v1/people/{id}/away`, HA services `radiate.set_away`, `radiate.clear_away`.

**Presence**:
Whether Home Assistant reports a person as home or not home, and since when. The integration maps a Radiate person to a `person` entity and reports it when it changes and every 15 minutes; `unknown` and `unavailable` are not reported.
Code: `Presence.state`, `Presence.since`, `Presence.reported_at`, `Runtime.report_presence`, API `POST /api/v1/people/{id}/presence`, `custom_components/radiate/presence.py`, `PRESENCE_HEARTBEAT_MIN`.

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
Every person in the household counts as away. In the `auto` heating mode, the runtime then runs the core in `frost` until someone is home, or until the return warm-up before someone is due back. With `everyone_away: unused` it keeps the household's schedules instead, which hold every room at its unused temperature. The chosen heating mode is not changed, so `off` and `frost` still apply.
Code: `Runtime.everyone_away`, `Runtime.effective_mode`, `EveryoneAway`, config key `household.away.everyone_away`, `away.frost` in `state`; reasons `away.everyone`, `away.ended`.

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
The part of the TRV writer that resends a setting when the TRV's reported value disagrees with what was sent for more than 5 minutes (2 minutes for the setpoint). After three attempts it marks the setting failed and raises an alert.
Code: `TrvWriter.plan`, `TrvWriter.failed`, `RECONCILE_GRACE_S`, `MAX_ATTEMPTS`, alert `driver.write_failed`.

**Schedule mirror**:
Radiate writes each room's weekly schedule into its TRVZB and runs the valve in `auto` mode, so the valve follows the schedule if Radiate stops. For a household room it writes the valve schedule, which includes the fixed preheat.
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
How strongly the supply factor falls with total opening.
Symbol `κ`, dimensionless. Code: `HouseConfig.supply_kappa`.

**Bypass equivalent**:
The always-open path through the bypass radiator, counted in fully open radiators.
Symbol `κ_bypass`. Code: `HouseConfig.bypass_equivalent`.

**Heat availability**:
Whether hot water is reaching a radiator: 0 while the boiler is off or the store has priority, and only after the arrival lag once flow starts.
Symbol `φ`, 0 to 1. Code: computed inline in `decide` (`flowing`, `avail`); no named field.

**Drive**:
The low-pass filtered product of supply factor, flow fraction and heat availability for one radiator. It is the heating input to the room model.
Unit 0 to 1. Code: `RoomState.drive`.

**Arrival lag**:
Time from heat becoming available to a clear rise in a radiator's TRV internal temperature. Short lag means near the boiler or high flow. The median of the last 15 measurements.
Symbol `τ_r`, min. Code: `RoomState.arrival_lag_s`, `RoomState.lag_samples`, HA sensor `arrival_lag`, Elastic `model.arrival_lag_min`.
_Avoid_: delay, warm-up time.

**Flow sensitivity**:
How much a room's observed heating gain changes with the supply factor. A flow-limited room (`η >= 0.5`) is helped by balancing; an emitter-limited room (`η < 0.2`) is not, because its radiator is too small.
Symbol `η`, dimensionless. Code: `AllocRoom.eta`, `EMITTER_LIMITED_ETA`.

**Learning gate**:
A rule that stops a sample being used to update a room model. A room is learning when no gate is closed.
Code: `RoomState.learning_gate`, values `fire`, `fire_holdoff`, `window`, `shower`, `cooker_spike`, `unexplained_heat`, `store_recovery`, `setpoint_change`, `no_data`, `trv_offline`. Elastic `learning.gate`.

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
A room's long-run opening limit: the 90th percentile of its allocated openings while the boiler fires. Radiate writes it whenever the room is not being allocated, so balancing persists without Radiate. Named after the plumber's lockshield valve.
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
Rooms do not fire the boiler one by one. The boiler fires only when a room is more than the comfort limit below target, the predicted burn is at least 1.5 times minimum burn, a room is preheating, or a room is below the frost threshold.
Code: `want_fire` in `decide`.

**Comfort limit**:
The most any calling room may sit below its target while demand is pooled. Default 0.5 K.
Code: `BoilerConfig.comfort_limit_k`, config key `boiler.comfort_limit_k`.

**Predicted burn**:
How long the current calling rooms need the burner, taken from the target arrival.
Symbol `B`, min. Code: `predicted_burn_s` in `decide`, API `boiler.predicted_burn_min`.

**Top-up**:
A temporary target a little above setpoint given to a room that is not calling, so it absorbs heat during a burn. Covers both burn extension and heat sinks.
Code: `RoomState.topup`, `_topup_target`, `TOPUP_K`, Elastic `demand.topup`.

**Burn extension**:
A top-up for a room predicted to call soon after the burner stops, so one longer burn replaces two short ones. Only burn extensions may keep the burner running.
Code: `RoomState.extend`, reason `boiler.topup`, API `rooms[].extend`, UI badge "Topping up".
_Avoid_: heat sink for this case; the UI status line says "topping up Bedroom 2 to save a second burn soon".

**Heat sink**:
A room opened as somewhere for the burner's heat to go, because too few radiators are open. Also called a dump room in the spec.
Code: `_ensure_sink`, reason `boiler.dump_room`, API `rooms[].topup` with `extend` false, UI badge "Heat sink".
_Avoid_: dump room in UI text.

**Open-path guarantee**:
Before and during a burn, open radiators plus the bypass equivalent must add up to at least the sink minimum (default 1.5 fully open radiators). If not, Radiate opens heat sinks.
Code: `HouseConfig.sink_min`, `_ensure_sink`.

**Stuck valve**:
A radiator that stays cold for several burns in a row while its valve should be open and other radiators warm. Radiate alerts and stops trusting that valve until it warms again.
Code: `ValveCheck` in `radiate.core.health`, reason `valve.stuck`, API `rooms[].valve` (`untrusted`, `misses`), UI line "Valve may be stuck".

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
The most relay starts allowed in any 60 minutes. Default 3.
Code: `BoilerConfig.max_starts_per_hour`, `BoilerGuard.starts_last_hour`.

**Relay start**:
The heating relay switching on. Radiate controls these.
_Avoid_: burner start, which is the burner firing; the boiler's own thermostat can cycle the burner several times within one relay start.

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

## Safety and fallback

**Safe mode**:
What Radiate does when it cannot reach any TRV: it stops the burner after minimum burn and raises the `safe_mode.no_trvs` alert. The spec describes a wider safe mode; see the ambiguities.
Code: `force_stop` in `decide`, alert `safe_mode.no_trvs`.

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

**Decision log**:
The last 500 boiler, disturbance and safe mode reasons, with the time they happened.
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
The SQLite file that holds engine state, the house ID, the mode, overrides, away state and the Elastic export queue.
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
Code: `custom_components/radiate/`.

**Edge**:
The local standalone server that runs the control loop for the cloud edition. Not built yet.

## Ambiguities

For the lead. Each item names the conflict and a suggested resolution.

1. **Opening, opening limit, cap.** The spec says "opening" and "cap", the UI and HA say "opening limit", Elastic says `valve.opening_pct`, ADR-0001 says "cap". The TRV decides the actual valve position; Radiate only sets a limit. Suggest "opening limit" everywhere for `valve_opening_degree`, "allocated opening" for the allocator's output, and "lockshield cap" only for `L_r`.
2. **Comfort limit means two things.** Spec 4.4 step 6 uses "comfort limit" for 150 minutes of arrival time; spec 5.1 uses it for 0.5 K of pooling. The code separates them (`comfort_horizon_s`, `comfort_limit_k`). Suggest "comfort horizon" for the time and "comfort limit" for the temperature, and update spec 4.4.
3. **Store means two things.** The hot-water store, and `radiate.server.store.Store` (the SQLite state database). Suggest renaming the class or module, for example `StateDb`, when that code is next touched.
4. **Safe mode.** Spec section 7 says safe mode starts when the coordinator or MQTT is down, stops the heartbeat so the watchdog takes over, and writes lockshield caps. The code enters it only when no TRV is reachable, keeps sending the heartbeat, and only forces the burner off after minimum burn. Lockshield caps are written whenever a room is not allocated, not as a safe mode step.
5. **Supply factor formula and kappa.** Spec 4.1: `S = 1 / (1 + κ·Σf + κ_bypass)`, with `κ` learned. Code: `S = 1 / (1 + κ·(Σf + bypass_equivalent))`, with `κ` a fixed 0.15 and the bypass in radiator equivalents. Suggest the spec follow the code and say `κ` is not learned yet.
6. **Flow sensitivity is not learned.** Spec 4.2 estimates `η` per room; the code always uses the default 0.7, so no room is treated as emitter-limited.
7. **Heat availability.** Spec 4.1 has `φ` rising with a 6-minute time constant after the lag. The code treats it as on or off after the arrival lag and smooths the whole drive with a 15-minute time constant.
8. **Arrival lag measurement.** Spec 4.1: time to `dT_trv/dt > 0.05 K/min`. Code: time to a 0.6 K rise in `T_trv` within 40 minutes, with an 8-minute default before any sample.
9. **Lockshield cap computation.** Spec 4.4: 90th percentile of allocated openings over the last 7 days. Code: 90th percentile of a decaying histogram fed only while firing, 60 % until enough data. The code comment says the decay is "roughly a 3 day half-life", but 0.9995 per minute-sample halves in about 1,400 samples, roughly 23 hours of firing.
10. **Fire detection thresholds.** Spec 4.6: residual above +1.5 K/h for 10 minutes, or a 0.8 K/h rise with the valve closed. Code: residual above 2.0 K/h with confidence at least 0.6, or a 0.8 K/h rise after the radiator has been off for 30 minutes. `docs/simulation.md` explains the change; spec 4.6 has not caught up.
11. **Top-up covers two things.** `RoomState.topup` is set for both burn extensions and heat sinks, and `extend` tells them apart. The API reports both flags, and the UI labels a burn extension "Topping up" and a heat sink "Heat sink". Spec 5.3 and 5.4 give both a target of setpoint + 0.3 K; the code uses `max(target + 0.3, min(temperature + 0.5, target + 1.0))`.
12. **Pooled demand `D`.** Spec 5.3 defines a gain-weighted pooled demand. The code never computes it; it fires on the largest gap, predicted burn, preheating or frost.
13. **Target, setpoint and TRV setpoint.** The spec uses `T_set` for everything. The code has the schedule or override setpoint, the effective target, and the TRV setpoint (the target in the TRV setpoint frame, plus the call bias or the sink lead, as a 0.5 °C step). Spec 4.5 now describes the TRV setpoint.
14. **Calling.** Used both for a TRV whose thermostat is open and for a room in Radiate's demand latch. Suggest "calling" for Radiate's latch only.
15. **Relay start and burner start.** `docs/simulation.md` separates them; the spec's "starts per hour" and the UI's "Starts, last hour" mean relay starts. Suggest always qualifying.
16. **Dump room and heat sink.** The spec says dump room, the code reason is `boiler.dump_room`, and the UI says "Heat sink". Suggest "heat sink" in prose and UI.
17. **Valve trusted and valve exercise.** Spec 4.6 has a "valve trusted" learning gate and spec 4.5 a weekly valve exercise. Neither exists in code. `unexplained_heat` exists in code but not in the spec.
18. **`actuation_enabled` and `actuate`.** The spec names the flag `actuation_enabled`; the configuration key is `actuate`. Both are fine but should be introduced together.
19. **Internal sensor only and "TRV only".** `docs/configuration.md` describes the role as "TRV only"; the value is `internal_sensor_only`.
20. **Preheat and optimum start.** The spec says "optimum start"; the code and UI say "preheating". Suggest "optimum start" for the feature and "preheating" for the room state.
21. **TRV bias refinement.** Spec 4.6 says the internal-sensor bias is refined once the TRV has been closed for 2 hours and its radiator is cold. The code keeps the configured bias. With a cold radiator the TRV reads the room, so the observed offset is about 0 K, while a warm radiator lifts the reading by 2 to 3 K in simulation. One bias cannot match both, and the variants tried in simulation made comfort worse (see [simulation](simulation.md#internal-sensor-rooms-and-the-trv-bias)).
