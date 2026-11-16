# Versatile Thermostat (VTherm): source-level prior-art analysis

Commit 35f46e5, integration version 10.6.6 (`manifest.json:25`), MIT. Paths are relative to `custom_components/versatile_thermostat/` unless prefixed `vtherm_api/` (the `vtherm_api` 0.9.0 wheel from PyPI, MIT, a hard requirement at `manifest.json:20-24`; it defines the plugin contracts). Docs paths are `documentation/en/`.

## 0. Headline findings for Radiate

- VTherm already does per-room TRVZB opening control and a central boiler on/off aggregator, but has **no** inter-room balancing, no boiler min burn/off time, no DHW concept and no external-heat-source input.
- `max_opening_degrees` is static per-TRV config: no entity, service or attribute setter; changing it reloads the VTherm.
- Integration seams: the `vtherm_api` plugin API (feature-manager hooks, proportional-algorithm factories, inhibition), plus attributes, events, services and the boiler threshold `number` entities.
- TRVZB external temperature is sent only on room-sensor state change, so the TRVZB 2 h revert can bite in a stable room.

## 1. Direct valve regulation (TRVZB)

**Class and config.** `ThermostatOverClimateValve` (`thermostat_climate_valve.py:32`) combines `ValveCommandMixin`, `ThermostatProp` and `ThermostatOverClimate`. For each TRV it builds an `UnderlyingValveRegulation` (`:103-123`) from:
- an opening-degree entity list (required) and a closing-degree list (optional) (`:83-84`);
- scalar `max_closing_degree` and `opening_threshold` (`:85-86`);
- `min_opening_degrees` and `max_opening_degrees` as comma strings, one value per TRV (`:89-101`).

If no max is given, it uses the opening entity's `max` attribute, else 100 (`:119`). `opening_threshold` is raised to at least the regulation dpercent (`:107`).

**Entities written.**
- `number.set_value` on the opening entity, then on the closing entity if configured (`underlyings.py:1894-1913`, helper `:296-311`). For a TRVZB these are the Z2M `valve_opening_degree` and `valve_closing_degree` numbers.
- `climate.set_temperature` to the TRV, with the VTherm target unchanged (no offset) (`thermostat_climate_valve.py:303-313`).
- `climate.set_hvac_mode`. Turn-off sends the closed pair, then sets the TRV to OFF (`underlyings.py:2024-2029`).

**Mapping** (`opening_degree_algorithm.py:14-76`). Raw demand p (0 to 100) is clamped (`:47`).
- If p >= threshold and p > 0: `deg = min_od + (max_od - min_od)/(1 - ot) * (p - ot)` (`:57-63`).
- Otherwise: `deg = 100 - max_closing` (`:64-65`).
- The result is floored at `100 - max_closing` (`:67`) and rounded (`:70`).
- It returns `(deg, 100 - deg)` (`:76`). Writing closing = 100 - opening fixes the valve position whatever the TRV's own internal heat/idle decision is (`self-regulation.md:47`).
- If min >= max, min falls back to the threshold (`:43-44`, `underlyings.py:1657-1662`).
- For valve regulation the raw % is passed through unclamped by the entity min/max (`underlyings.py:1884-1892`).

**Rate limiting** (`valve_command.py:104-180`).
- The command is an integer % (`:126`). Values below dpercent become 0, so the valve can close (`:141-142`).
- Changes smaller than dpercent are ignored, except the first command (`:145-153`).
- Changes are spaced by at least `auto_regulation_period_min` (`:159-169`), with a retry 20 s later (`thermostat_climate_valve.py:270-283`).
- dpercent and period reuse `CONF_AUTO_REGULATION_DTEMP` and `CONF_AUTO_REGULATION_PERIOD_MIN` (`:72-81`). The docs advise >= 3 % for TRVZB, otherwise it "can lose its calibration" (`over-climate.md:57`).
- Sleep mode forces 100 % open and bypasses the dpercent filter (`valve_command.py:116-117`, `over-climate.md:116`).

**Cadence.**
- `async_control_heating` runs every `cycle_min` (`thermostat_climate.py:659-664`) and on every room-temperature change (`base_thermostat.py:2358-2377`).
- The scheduler is a passthrough for valves (`cycle_scheduler.py:584-603`). Valve values are pushed in `_send_regulated_temperature` (`thermostat_climate_valve.py:322-323`).

**Startup.**
- Reads the entity min/max (`underlyings.py:1383-1402`) and reconciles demand with the current opening (`:1664-1727`).
- Seeds degree entities that are `unknown` (write-only) once, with the demand-0 pair (`:1808-1844`, `over-climate.md:64-66`).

**Activity.**
- `is_device_active` means the opening entity state > `100 - max_closing` (`underlyings.py:1986-1990`). It reads the number entity, i.e. the echo of the last command, not a measured motor position.
- `should_device_be_active` means the raw % exceeds the threshold (`:1992-1996`).
- `hvac_action` is derived from the valves (`:1998-2010`) because TRVZB `hvac_action` is unreliable (`self-regulation.md:50`).

**Calibration.** Service `recalibrate_valves` (`thermostat_climate_valve.py:486-634`):
- turns the VTherm OFF and the TRV to HEAT;
- writes opening = entity max and closing = entity min, then waits;
- writes opening = min and closing = max, then waits;
- restores the requested state.

The delay is 0 to 300 s (`feature-recalibrate-valves.md:74`). There is no automatic recalibration and no detection of calibration loss.

**Valve repair.** There is no periodic valve keep-alive. The opt-in RepairIncorrectState (default off, `const.py:533`) resends the opening if the entity differs from the last value sent by more than 0.5 (`underlyings.py:1592-1610`). It pauses after 5 consecutive repairs and waits 30 s after ready (`feature_repair_incorrect_state_manager.py:110-127`, `const.py:534-536`). Only the opening entity is checked; the closing entity is not.

**External temperature and offset.** Enabled with `sync_device_internal_temp` and a list of sync entities (`thermostat_climate.py:114-115`). Two modes:
- calibration offset `room - (local - current_offset)`, rounded to the entity step and clamped to its min/max (`:1351`);
- direct copy of the room temperature, e.g. into `number.*_external_temperature_input` (`:1367`).

It is triggered only by a room-sensor state change (`thermostat_climate.py:1283-1290`), not by the periodic loop or by last-seen updates. The user must set the TRVZB `sensor_select` to external themselves (`feature-sync_device_temp.md:21,57`).

**`max_opening_degree` semantics.**
- Scope: per underlying (per TRV). Raw 100 % maps to it, with linear interpolation from `min_opening` above the threshold. The docs describe it as a way to "limit the hot water flow" (`self-regulation.md:43`).
- Storage: the private attribute `_max_opening_degree` (`underlyings.py:1650`). There is no setter, no service and no number entity.
- Visibility: read-only attributes `vtherm_over_climate_valve.underlying_valves.<entity>.max_opening_degree` and the `max_opening_degrees` string (`thermostat_climate_valve.py:184-197, 220`).
- Runtime change is possible only by editing config entry data (`CONF_MAX_OPENING_DEGREES`, `const.py:149`). That fires `update_listener`, which reloads the VTherm (`__init__.py:180-201`), unless `api.skip_reload_on_config_update` is set (`:189-196`).
- Alternatives:
  - global `max_on_percent` from YAML, which caps the raw % for every VTherm (`__init__.py:55`, `base_thermostat.py:556`, `thermostat_prop.py:83-86`);
  - a plugin proportional algorithm that emits any raw % per VTherm (`thermostat_prop.py:161-174`, `vtherm_api/interfaces.py:326-340`);
  - writing the private attribute from a plugin (fragile).

## 2. Central boiler

**Rule.** The boiler is ON if either test passes (`feature_central_boiler_manager.py:234, 510-538`); a threshold of 0 disables its test.
- Count test: `nb_active >= nb_threshold`.
- Power test: `total_power >= power_threshold` (in W).

**Inputs.**
- `nb_active` is the sum of `device_actives` over the participating VTherms (`sensor.py:879-962`). For valve VTherms this is the list of opening entities above `100 - max_closing` (`thermostat_climate_valve.py:380-386`). It therefore counts **TRVs, not rooms**.
- `total_power` is the sum of `device_power * on_percent` per VTherm (`feature_power_manager.py:389-403`, `sensor.py:1040-1100`), skipping sleeping VTherms. Setting `device_power` to each radiator's rated output gives a crude watt-weighted demand.
- Participation is a per-VTherm flag `used_by_controls_central_boiler` (`base_thermostat.py:552-554`).

**When it is re-evaluated.** On any underlying state change (`underlyings.py:191-197`) and on changes of the 4 sensor/number entities (`feature_central_boiler_manager.py:96-109`). It needs all 4 entities plus the binary sensor before it is ready (`:558`).

**Delays and keep-alive.**
- The activation delay applies to ON only, and the condition is re-checked when it expires (`:183-199, 255-259`).
- OFF is immediate and cancels a pending ON (`:262-288`).
- Keep-alive repeats the last service every `keep_alive_boiler_delay_sec`; the default 0 means off (`:347-371`, `const.py:539`).
- Startup guard: no decision until all VTherms have started (`:136-147, 298-303`). It waits for the command entity to be available (`:305-345`).

**What it drives.** Two service strings of the form `entity/domain.service[/attr:value]` (`commons.py:36-145`), optionally templated and rendered on every call (`commons.py:62-64`, `feature_central_boiler_manager.py:381-389`).

**What it exposes.**
- a binary sensor (`binary_sensor.py:389`);
- the count and power sensors (`sensor.py:779, 965`);
- restorable threshold numbers, writable at runtime with `number.set_value` (`number.py:168, 236`);
- event `versatile_thermostat_central_boiler_event` (`:175-181`, `vtherm_api/const.py:26`).

**Anti-short-cycle.** None. There is no minimum on, minimum off, max starts per hour, pump overrun or hysteresis on the count. "Minimum burn time" does not exist; only `minimal_activation_delay` exists, for TPI switch cycles (`cycle_scheduler.py:80-91`), and it does not apply to the boiler.

**Shelly 2PM setup.**
- activation `switch.<boiler_ch1>/switch.turn_on`, deactivation `switch.<boiler_ch1>/switch.turn_off`;
- `nb_threshold` 1 (or a power threshold);
- activation delay about the TRV travel time (60 to 120 s), so valves open before the burner fires;
- optional keep-alive (for example 300 s) paired with the Shelly's own auto-off timer, as a dead-man's switch if HA dies.

Channel 2 (DHW) is outside VTherm. While the boiler is OFF, Auto-TPI learning is skipped (`prop_handler_tpi.py:240-248`, `auto_tpi_manager.py:768-770`).

## 3. Auto-TPI and identification

**Model.** `power = Kint*(Tset-Tin) + Kext*(Tset-Tout) + offset`, clamped to 0..1 (`auto_tpi_manager.py:2030-2048`). Plain TPI uses the same formula (`prop_algo_tpi.py:124-132`). It returns 0 when there is no outdoor temperature (`auto_tpi_manager.py:2032`).

**State and persistence.** `AutoTpiState` holds Kint and Kext for heat and cool, capacity (°C/h) and counters (`:56-112`). It is stored in an HA Store `versatile_thermostat.auto_tpi.<unique_id>` v8 (`:37-38, 219-220`). Final coefficients are written to the config entry (`:351`), with persistent notifications (`:457`).

**Learning gates** (`:749-811`, evaluated at each cycle end via callbacks at `prop_handler_tpi.py:230-234`). A cycle is learnt from only if:
- learning is enabled, or continuous Kext is on;
- 0 < power < saturation;
- the cycle was not interrupted (load shedding);
- the boiler is not OFF;
- no failure is detected;
- there have been fewer than 3 failures;
- it is not the first cycle after a stop;
- |Tset - Tout| >= 1 °C.

A setpoint change during the cycle also skips learning (`:861`).

**Kint.** `ratio = min(target_diff, capacity*(1-Kext*dT)*cycle_h*eff) / real_rise * aggressiveness` (`:1027-1110`). Then `Kint_new = Kint*ratio`, capped at 1.0. It is blended in with an EMA (alpha = `a0/(1+decay*n)`, `:700-718`) or a weighted average, with a floor of 0.01 (`:42`).

**Kext.** `Kext + Kint*gap_in/gap_out`, capped at 1.2 (`:1286-1299`). It is learnt only in the near field (gap <= 1 °C), except during active overshoot (`:1004`).

**Bootstrap.** Kint 1.0 and Kext 0.1 are used until capacity has been learnt 3 times (`:2007-2028`).

**Convergence.** 50 cycles each (plus the initial weight) (`:396-398`).

**Options.**
- Kint boost on stagnation and Kext overshoot cut: both off by default (`:111-112, 1713-1716, 1798-1801`).
- t-test regime-change detection (`:720-747`).
- continuous Kext EMA (`:2726-2800`).
- capacity calibration from recorder slope history (`:2120`, service `:2330`).

**Disturbances.**
- Overshoot with < 1 % power is treated as an anomaly (`:1257`), and natural recovery is skipped.
- There is **no** external heat source flag. An open fire with some residual valve demand looks like "Kext too high" (corrected only if the overshoot option is on) or simply corrupts the Kint ratio.

**Offline identification** (`tpi_identification.py`).
- OLS fit of `dT = g*(Text-Tint) + B*u + q` over 7 to 14 days of recorder data (`:13-14, 148-156`).
- 70/30 chronological holdout (`:185-223`); cycles with an open window are dropped (`:115-118`); block bootstrap.
- Kint is chosen for a closed-loop time constant of 6 h (`:166-174`).
- Exposed only through LLM tools (`llm/__init__.py:1146-1275`).
- For valves, u is a `valve_open_percent` command proxy, explicitly not physical flow (`feature-llm-mcp.md:763`).

## 4. Other algorithms and managers

- **TPI** (`prop_algo_tpi.py:16`): thresholds low/high on slope (`:103-121`), clamp, `max_on_percent`. Cycle on/off times with min activation and deactivation (`cycle_scheduler.py:50-91`). The switch scheduler staggers underlyings (`:1-5`).
- **PI** (`pi_algorithm.py:10`): used for the regulated setpoint of a non-valve `over_climate`. `offset = kp*e + ki*sum(e) + k_ext*(Tin-Tout)`, capped at `offset_max` (`:108-116`); anti-windup by halving on sign change (`:98-99`). Disabled in valve mode (`thermostat_climate_valve.py:424-427`).
- **Auto start/stop** (`auto_start_stop_algorithm.py:56`): accumulated error over 120 s cycles with levels (`:19-35`); `over_climate` only (`base_thermostat.py:236`).
- **Heating failure** (`feature_heating_failure_detection_manager.py:42`):
  - "heating failure": on_percent >= 0.9 for 15 min with less than 0.5 °C rise (`:224-271`, `const.py:541-544`);
  - "cooling failure": 0 % with rising temperature (`:273`), which is effectively an external-heat detector;
  - root cause: stuck valve open or closed (`:329-393`);
  - can be enabled or disabled by a template (`:130-150`); fires an event.
- **Safety** (`feature_safety_manager.py:30`): no room or outdoor reading for `safety_delay_min` while heating (`:108-131`), then on_percent is forced to the default 0.1 (`const.py:529-530`, `thermostat_prop.py:105-109`). The outdoor check can be disabled in YAML (`:75`).
- **Window** (`feature_window_manager.py:41`): sensor or slope-based auto detection (`open_window_algorithm.py:1-8`); actions off, fan, frost or eco (`const.py:499-504`); bypass service.
- **Power** (`feature_power_manager.py:30`, central `feature_central_power_manager.py:38`): shedding sorted by temperature gap (`:292-318`).
- **Humidity** (`feature_humidity_manager.py:24`): display only (`thermostat_climate.py:1557-1558`), no control.
- **Presence/motion** (`feature_presence_manager.py:36`, `feature_motion_manager.py:40`): preset switching. **Lock** (`feature_lock_manager.py:22`, users/automations, optional code `:36-48`). **Timed preset** (`feature_timed_preset_manager.py:27`, manual-override duration `:50-62`).
- **Central config**: shared parameter sets via `use_*_central_config` (`vtherm_central_api.py:57`). Central mode select: Auto, Stopped, Heat only, Cool only, Frost (`const.py:556-561`, `select.py:112-134`).
- **Inhibition** (`inhibition_manager.py:81`): a plugin gates all commands to the underlyings (the VTherm goes OFF) and later reconciles (`base_thermostat.py:1309-1334`, `vtherm_api/vtherm_api.py:147-192`).
- **recorder_export.py**: paginated read of one VTherm's climate history (at most 14 days; only `current_temperature`, `temperature`, `hvac_action`, `preset_mode` and similar), served to LLM tools (`recorder_export.py:9-17, 44-93`). It is **not** a metrics exporter and is useless for Elastic. Note that `specific_states` and `configuration` are unrecorded attributes (`base_thermostat.py:97`), as is the whole `vtherm_over_climate_valve` block (`thermostat_climate_valve.py:35-43`). Elastic export should therefore use the `valve_open_percent`, `on_percent`, slope and EMA sensors (`sensor.py:274, 409, 617, 727`) through HA's own Elastic path.
- **llm/**: Home Assistant LLM API tools, exposed through HA's MCP server (`llm/__init__.py:1-21, 1456-1490`): list, status, diagnose, history, logs, plugins, set temp/preset/mode, TPI check/analyse/set.

## 5. Public API for a companion integration

**Read.**
- Climate attributes `valve_open_percent`, `on_percent`, `power_percent`, plus the per-valve block with `percent_open`, `last_sent_opening_value` and min/max (`thermostat_climate_valve.py:184-229`).
- `specific_states` with `is_device_active`, `device_actives`, `temperature_slope`, `hvac_off_reason` and `is_sleeping` (`base_thermostat.py:2245-2280`).
- Sensors (above) and boiler entities (section 2).

**Events.** safety, power, temperature, hvac_mode, central_boiler, preset, window_auto, auto_start_stop, timed_preset, heating_failure (`vtherm_api/const.py:19-31`). The payload carries `entity_id`, `name` and the full `state_attributes` (`const.py:652-658`).

**Services** (`services.yaml`): reload, set_presence, set_safety, set_window_bypass, set_auto_regulation_mode, set_auto_fan_mode, set_hvac_mode_sleep, lock/unlock, set_tpi_parameters (persisted to the config entry, `prop_handler_tpi.py:366-379, 440`), set_auto_tpi_mode, auto_tpi_calibrate_capacity, set_timed_preset, cancel_timed_preset, recalibrate_valves, download_logs. There is **no service for valve caps.**

**Plugin API.**
- `VThermAPI.register_feature_manager` and `register_prop_algorithm` (`vtherm_api/vtherm_api.py:94-136`), loaded per VTherm (`base_thermostat.py:276-314`).
- Hooks:
  - `async_after_valve_command(ValveCommand)`: raw %, degrees and cause (`underlyings.py:1921-1951`, `vtherm_api/underlying_hooks.py:94-128`);
  - `async_before_underlying_hvac_mode`;
  - `async_on_underlying_power`.
- Hooks are notify-only and capped at 10 s (`vtherm_api/const.py:15`, `base_thermostat.py:332-367`).
- The setpoint modifier is not used in valve mode, because `_send_regulated_temperature` is overridden (`thermostat_climate_valve.py:285-323`).

**Learning pause.**
- Call `set_auto_tpi_mode(false)`, then `(true, reinitialise=false)` to resume with the learned data kept (`prop_handler_tpi.py:516-556`, `auto_tpi_manager.py:3103-3114, 3185-3192`).
- Continuous Kext keeps learning while paused (`:749-754`).
- Alternative: inhibit the VTherm, or rely on the boiler-off and failure gates.

## 6. Whole-house balancing

**It does not exist.** There is no inter-room flow sharing, no return-temperature or delta-T logic, no hydraulic model, and no coordination of valve openings across rooms. The only cross-VTherm logic is:
- boiler demand aggregation (count or watts);
- electrical load shedding ordered by temperature gap (`feature_central_power_manager.py:292-318`);
- the central mode.

"Balancing" appears only as a caveat in the LLM identification text (`llm/__init__.py:1078`). Per-valve `max_opening_degrees` is a static, manual flow limiter.

## 7. Weaknesses for an on/off oil boiler and balancing

1. No minimum burn or minimum off time, and OFF is immediate: short-cycling risk on a non-condensing oil burner.
2. The count counts TRVs and each room's demand is independent. A single cold room at a few % opening fires the whole boiler; there is no "useful load" floor beyond the per-room `opening_threshold`.
3. No flow-path safety. With every valve closed the boiler can still be ON during the activation-delay window or keep-alive (the bypass radiator mitigates this here). There is no check that at least N % of opening is available before firing.
4. `max_opening_degrees` is static (reload to change). There is no runtime per-room cap API.
5. TRVZB external temperature is sent on change only; the 2 h timeout is not handled.
6. Valve "active" uses the commanded number value, not feedback, so stuck-valve diagnosis relies on temperature.
7. Auto-TPI assumes the room's own radiator is the only heat source; no fire or Aga pause, and learning is per room with no inter-room coupling.
8. TPI cycle `cycle_min` is the valve update cadence too. A boiler that only fires above a demand threshold breaks TPI's proportional assumption (learning is paused, but control is not compensated).
9. No DHW priority or interlock, and no outdoor-reset or flow temperature (not relevant for this boiler).

## 8. Feature table

| Feature | VTherm support | Where (file) | Notes |
|---|---|---|---|
| Direct TRV valve regulation | yes | thermostat_climate_valve.py | over_climate + opening numbers |
| Opening degree write | yes | underlyings.py | number.set_value |
| Closing degree write | yes | underlyings.py | optional, 100 - opening |
| Fixed position via closing = 100 - opening | yes | opening_degree_algorithm.py | defeats TRV's own logic |
| Per-TRV min opening | yes | thermostat_climate_valve.py | comma list |
| Per-TRV max opening | yes | thermostat_climate_valve.py | comma list, static |
| Max opening runtime setter | no | n/a | no entity/service; config edit reloads |
| Global raw % cap | partial | thermostat_prop.py | YAML max_on_percent, all VTherms |
| Max closing degree | yes | opening_degree_algorithm.py | floor opening |
| Opening threshold | yes | opening_degree_algorithm.py | below means closed |
| Linear interpolation min..max | yes | opening_degree_algorithm.py | above threshold |
| dpercent filter | yes | valve_command.py | reuses dtemp field |
| Minimum regulation period | yes | valve_command.py | retry after 20 s |
| TRV setpoint forwarding | yes | thermostat_climate_valve.py | target, no offset |
| Sleep (valve 100 %, VTherm off) | yes | valve_command.py | service set_hvac_mode_sleep |
| Seed unknown write-only numbers | yes | underlyings.py | once, demand 0 |
| Startup reconciliation | yes | underlyings.py | check_initial_state |
| Valve feedback position | no | underlyings.py | uses command echo |
| Valve hvac_action override | yes | underlyings.py | TRVZB quirk |
| Manual recalibration service | yes | thermostat_climate_valve.py | full open/close sweep |
| Auto recalibration | no | n/a | |
| Calibration-loss detection | no | n/a | doc warning only |
| Valve keep-alive | no | n/a | |
| Incorrect state repair | partial | feature_repair_incorrect_state_manager.py | opening only, opt-in |
| External temp to TRV | yes | thermostat_climate.py | direct copy |
| Offset calibration sync | yes | thermostat_climate.py | room - local + offset |
| Periodic external temp refresh | no | thermostat_climate.py | on change only |
| over_valve (bare number) | yes | thermostat_valve.py | alternative type |
| Central boiler aggregation | yes | feature_central_boiler_manager.py | |
| Boiler count threshold | yes | feature_central_boiler_manager.py | counts TRVs |
| Boiler power threshold | yes | feature_central_boiler_manager.py | device_power * on% |
| Thresholds as number entities | yes | number.py | runtime writable |
| Boiler activation delay | yes | feature_central_boiler_manager.py | ON only |
| Boiler deactivation delay | no | feature_central_boiler_manager.py | immediate |
| Boiler min on / min off time | no | n/a | |
| Max starts per hour | no | n/a | |
| Pump overrun | no | n/a | |
| Boiler keep-alive | yes | feature_central_boiler_manager.py | default off |
| Templated boiler command | yes | commons.py | rendered per call |
| Boiler event | yes | feature_central_boiler_manager.py | central_boiler_event |
| Per-VTherm boiler opt-in | yes | base_thermostat.py | flag |
| DHW channel control | no | n/a | |
| Flow temperature control | partial | commons.py | via template only |
| TPI | yes | prop_algo_tpi.py | Kint, Kext |
| TPI slope thresholds | yes | prop_algo_tpi.py | low/high |
| Min activation/deactivation | yes | cycle_scheduler.py | switch cycles |
| Auto-TPI learning | yes | auto_tpi_manager.py | Kint, Kext, capacity |
| Auto-TPI persistence | yes | auto_tpi_manager.py | HA Store + config entry |
| Auto-TPI bootstrap | yes | auto_tpi_manager.py | aggressive coefs |
| Regime-change detection | yes | auto_tpi_manager.py | t-test |
| Continuous Kext | yes | auto_tpi_manager.py | runs when paused |
| Kint stagnation boost | partial | auto_tpi_manager.py | opt-in |
| Kext overshoot correction | partial | auto_tpi_manager.py | opt-in |
| Learning pause on boiler off | yes | auto_tpi_manager.py | gate |
| Learning pause on shedding | yes | auto_tpi_manager.py | gate |
| Learning pause on failure | yes | auto_tpi_manager.py | gate |
| Learning pause external heat | no | n/a | |
| Learning pause by service | partial | prop_handler_tpi.py | set_auto_tpi_mode |
| Outdoor temp in control | yes | prop_algo_tpi.py | Kext term |
| Capacity calibration service | yes | auto_tpi_manager.py | recorder slopes |
| Offline OLS identification | yes | tpi_identification.py | 7 to 14 days |
| Kalman latent fit | partial | tpi_identification.py | experimental |
| PI setpoint regulation | yes | pi_algorithm.py | not in valve mode |
| Plugin proportional algorithm | yes | thermostat_prop.py | SmartPI etc. |
| Plugin feature manager | yes | base_thermostat.py | factory per VTherm |
| After-valve-command hook | yes | underlyings.py | notify only |
| Before-hvac-mode hook | yes | base_thermostat.py | notify only |
| Underlying power hook | yes | cycle_scheduler.py | notify only |
| Setpoint modifier | partial | vtherm_api/setpoint_modifier.py | not valve mode |
| Inhibition (take over) | yes | inhibition_manager.py | command gate |
| Auto start/stop | yes | auto_start_stop_algorithm.py | over_climate |
| Heating failure detection | yes | feature_heating_failure_detection_manager.py | 90 %, 15 min |
| Cooling failure (temp rise at 0 %) | yes | feature_heating_failure_detection_manager.py | heat-source hint |
| Stuck valve root cause | yes | feature_heating_failure_detection_manager.py | open/closed |
| Safety on sensor timeout | yes | feature_safety_manager.py | default 10 % |
| Window sensor and slope auto-detect | yes | feature_window_manager.py | |
| Window actions | yes | const.py | off/fan/frost/eco |
| Presence / motion | yes | feature_presence_manager.py | presets |
| Power shedding | yes | feature_central_power_manager.py | sorted by gap |
| Humidity | partial | feature_humidity_manager.py | display only |
| Lock | yes | feature_lock_manager.py | code optional |
| Timed preset | yes | feature_timed_preset_manager.py | |
| Central config | yes | vtherm_central_api.py | shared params |
| Central mode | yes | select.py | 5 modes |
| Energy sensor | yes | sensor.py | needs device_power |
| Valve % sensor | yes | sensor.py | recorded |
| Events bus | yes | vtherm_api/const.py | 10 types |
| Recorder export | partial | recorder_export.py | LLM only |
| Metrics to Elastic | no | n/a | use HA path |
| LLM/MCP tools | yes | llm/__init__.py | Assist API |
| Whole-house balancing | no | n/a | |
| Inter-room flow sharing | no | n/a | |
| Delta-T or return temp | no | n/a | |
| Minimum open path guarantee | no | n/a | |
