# Commercial smart-radiator balancing: public-material survey

November 2026. Public sources only (help centres, datasheets, Zigbee specs, certificates, patents, papers, open-source converter code). No apps, firmware or clouds were touched. Not legal advice.

**Method caveat.** help.tado.com and ext.api.tado.com were unreachable from this session, so tado and some Danfoss PDF statements come from search-engine extracts, marked *(extract)*. Danfoss attribute semantics were read from the open-source Z2M converter (`zigbee-herdsman-converters/src/devices/danfoss.ts`), which mirrors the Danfoss spec. Re-verify *(extract)* and *(uncertain)* items.

Source keys are listed at the end.

---

## 1. tado X Hydronic Balancing

### Documented
- **What it is.** A software replacement for manual lockshield balancing, run by tado X Smart Radiator Thermostats. tado says the thermostats analyse their own behaviour and fold the calibration into normal valve control, re-balancing continuously, so radiators with higher heat demand get more water and near-boiler rooms stop overheating while far rooms lag. [T1 extract]
- **Prerequisites.** A boiler or heat pump of your own; an AI Assist subscription (EUR/GBP 3.99 per month or 29.99 per year); a tado X radiator thermostat on *every* radiator used for heating (radiators permanently off are exempt). Free for Heat Pump Optimiser X plus Panasonic Aquarea owners. [T1, T3 extract]
- **User experience.** App: Settings > Hydronic Balancing > toggle. Runs automatically whenever heating is on; no separate symbol on the thermostat display; can be switched off at any time. [T2 extract]
- **Pump advice.** Many systems run the circulator fast "to be safe"; after enabling, tado suggests users may be able to reduce pump speed gradually. [T1 extract]
- **No plumbing.** No draining, no valve or lockshield replacement. [T3]
- **Partial installs.** A radiator without a tado X still receives heat whenever the boiler runs (this is why full coverage is required). [T1 extract]
- **Certification.** TÜV Rheinland certificate for "HydroBalance 2.03", hardware tado X, registration 90145-0269748231_10, issued 7 August 2026 on the basis of a TÜV Rheinland test report and a report by a professor at a Berlin university of applied sciences. Scope: suitable for automated hydronic balancing of water-based heating systems within a described scope, subject to additional requirements; references the BAFA/KfW checklist criteria and GEG §60c (and, per our earlier survey, DIN EN 12831 and DIN 94679-4). Any algorithm change touching certified content requires recertification. Launch was 15 December 2025; certificate originally promised for early 2026. [T4 extract, T3, prior-art.md]
- **No user-facing max-opening setting.** Community threads show tado support declining requests for per-valve maximum opening on tado X. [T5, community, uncertain]

### Not found publicly
- Learning duration, signals used, what exactly is altered (valve stroke cap, opening rate, or setpoint filter), any balancing report/visualisation in the app. Searches returned nothing on these. *(gap)*

### Inferred (Radiate's reading, not tado's words)
- "Analyses its own behaviour" plus "calibration integrated into valve control" most plausibly means per-valve learning from room heat-up response versus valve position, with a learned cap or gain applied to valve opening. The requirement for full coverage suggests the algorithm needs every flow path controllable, i.e. it restricts fast radiators rather than boosting slow ones. Radiate's stairs radiator (uncontrolled bypass) would break this assumption in a tado-style design.

---

## 2. Danfoss Ally / Eco / Hive (Danfoss OEM)

The Hive TRV (UK7004240, model IDs TRV001/TRV003) and Popp 701721 are white-label Danfoss Ally eTRVs. [D4]

### Documented: Ally manufacturer attributes on hvacThermostat (0x0201), manufacturer code Danfoss
| Attribute (Z2M name) | ID | Meaning (paraphrased) |
|---|---|---|
| `heat_available` | 0x4030 | Written by gateway: whether the heat source is on. Valve appears not to drive its motor when false (Z2M note). [D1 extract, D4] |
| `heat_required` / heat supply request | 0x4031 | Read-only, set by the TRV: this radiator wants warm water. This is the boiler-call signal a gateway aggregates. [D1 extract, D4] |
| `load_balancing_enable` | 0x4032 | Standalone, or share load with other TRVs in the same room. If enabled the gateway must keep `load_room_mean` updated. [D2 extract, D4] |
| `load_room_mean` | 0x4040 | Room mean of radiator loads, computed and written by the gateway, -8000 = undefined. [D1 extract, D4] |
| `load_estimate` | 0x404A | Each TRV's own load estimate, range about -8000 to 3600, default -8000, reportable 60 to 3600 s. [D2 extract, D4] |
| `external_measured_room_sensor` | (mfr) | Room temperature in 0.01 degC from an external sensor. [D4] |
| `radiator_covered` | (mfr) | false = Auto Offset mode (TRV uses external reading to offset its own); true = Room Sensor mode (TRV regulates on the external reading). [D4] |
| `window_open_feature` / `window_open_internal` / `window_open_external` | (mfr) | Internal open-window detection with states quarantine, closed, hold (maybe opening), open, and "open per external but closed locally"; external write forces state. [D4] |
| `adaptation_run_status` / `_settings` / `_control` | (mfr) | Valve-characteristic learning: none, in progress, found, lost; nightly auto run, or start/cancel on demand. [D4] |
| `algorithm_scale_factor` | (mfr) | Setpoint filter time-constant, 1 quick to 10 slow ("aggressiveness"). [D4] |
| `regulation_setpoint_offset` | (mfr) | -2.5 to +2.5 degC trim. [D4] |
| `occupied_heating_setpoint_scheduled` | std | Setpoint change without the aggressive actuator response used for manual changes. [D4] |
| `preheat_status` / `preheat_time`; mode `schedule_with_preheat` | (mfr) | On-device optimum start in Zigbee weekly schedule mode. [D4] |
| `pi_heating_demand` | std 0x0008 | Valve demand %, exposed for Ally. [D4] |
| `day_of_week` / `trigger_time` | (mfr) | Valve exercise (anti-seize) schedule. [D4] |

- **External sensor refresh rules.** Auto Offset mode: write at least every 3 h (else reverts to -8000, disabled) and at most every 30 min or per 0.1 degC change. Room Sensor mode: at least every 30 min (reverts after 35 min), at most every 5 min or per 0.1 degC. [D4] Compare TRVZB: about 2 h timeout (CLAUDE.md).
- **Load balancing algorithm, as published.** Each eTRV in a room reports its `load_estimate`. The gateway averages the loads of all radiators in that room and writes the mean back to each eTRV as `load_room_mean` every 15 minutes. The gateway must discard values below -500 (down to -8000, invalid) and values older than 90 minutes. Danfoss states this control must not be used in rooms with only one eTRV. Writing -8000 or disabling the flag stops it. [D1 extract, D10, S10]
- **Scope consequence.** Danfoss "load balancing" is *intra-room* load sharing between radiators in the same room (so one radiator does not do all the work), not whole-house hydronic balancing between rooms. [D1 extract]
- **Room grouping in the app.** Several TRVs assigned to one room are shown as a group tile with settings kept in sync. [D11 extract]
- **Certification.** TÜV Rheinland certifies Ally performing automatic balancing on an unbalanced radiator system as at least equivalent to VdZ procedures A and B [D6 extract]. Danfoss's German release says TÜV testing covered Eco and Link (radiators) and Icon (underfloor). [D7 extract]
- **Danfoss Eco (Bluetooth).** Marketing says Eco senses pipe water temperature and room air temperature and adjusts flow without presetting, reacting to temperature changes within about a minute to correct small imbalances early [D8 extract]. The Eco datasheet documents adaptive learning of start time during the first week (optimum start), not explicit balancing. [D9 extract]

### Inferred
- `load_estimate` is not defined numerically in what we could read. Plausibly a scaled regulator output per radiator. *(uncertain)*
- Danfoss's inter-room balancing claim (TÜV, VdZ A/B equivalence) appears to rest on each eTRV's own fast PI regulation with a pipe-temperature-aware model, i.e. "dynamic" balancing by throttling once the room is satisfied, rather than an explicit learned per-radiator cap. *(inferred)*
- `heat_available` / `heat_required` is exactly the boiler-interlock contract Radiate needs: TRVs raise demand, the controller decides boiler on/off and tells TRVs heat is (not) available.

---

## 3. Homematic IP (eQ-3)

### Documented
- Fraunhofer IEE studies (commissioned, reported by eQ-3) confirm that eTRV-2, eTRV-C, eTRV-C-2 and eTRV-Evo perform dynamic, adaptive balancing at each radiator. [H1, H2]
- Over-supplied radiators are throttled automatically after a short automatic learning phase, and room overshoot above setpoint is avoided. [H3, H4]
- Runs automatically through the heating season without configuration. BAFA reportedly accepted these thermostats as eligible under BEG; installer still signs the VdZ form. [H8]
- Thermostats and floor-heating controllers continuously adapt heating water flow to conditions such as current temperature and user behaviour. [H5]
- **Boiler side.** HmIP-MIOB Multi IO Box is the central unit for switching circulation pumps, boilers and DHW circulation pumps (two volt-free outputs) and pairs with wall thermostats; HmIP-FALMOT-C12 floor controller recalculates optimum flow per circuit and can run standalone. [H6, H7] Pump/boiler pre-run or overrun timings not found publicly. *(gap)*

### Inferred
- "Short learning phase then throttling" suggests learning a per-valve stroke limit from overshoot behaviour, the classic DE4221725 / EP1936290 pattern (see section 5). *(inferred)* No signals, durations or report UI are published.

---

## 4. Other systems (brief)

- **Drayton Wiser (UK).** Comfort Mode = optimum start learned from warm-up rate; Eco Mode = optimum stop plus weather compensation, learning cool-down rate. Wiser TRVs recommended on every radiator. No balancing feature found. Boiler switched by hub relay when any room demands heat. [O1, O2 extract]
- **Honeywell evohome / CM92x (UK).** TPI with installer-selectable cycle rate and minimum on time. Resideo CM92x installer guide: gas boiler under 30 kW 6 cycles/h, min on 1 min; **oil boiler 3 cycles/h, min on 4 min**; thermal actuators 12 cycles/h. Min on time defaults to 10% of cycle time, adjustable 2 to 5 min. [O3] Evohome users report at very low load the cycle rate is sacrificed to keep minimum on time [O4, forum]. OpenTherm supported on evohome (well known; not re-verified here).
- **Netatmo.** Auto-Adapt (optimum start) learns heat-up time, recalibrates every two weeks, caps preheat at about 3 h; valves can call the boiler via the thermostat; Legrand advises disabling Auto-Adapt in some multi-valve setups. [O5]
- **Hive.** TRVs are Danfoss Ally hardware. "Heat on Demand" lets TRVs call the boiler; users report a 22 degC cap on TRV-driven calls and that all radiators heat when one room calls. [D4, O6 forum, uncertain]
- **Worcester Bosch / Bosch EasyControl (owner has a Worcester).** Zoning-capable smart control with Smart TRVs (own sensors), presence detection, "intelligent heating"; works natively with Worcester boilers, others via an adapter. Advises against a Smart TRV in the thermostat's room (risk of permanent demand). No balancing claim found. Not obviously usable with a 2000s Heatslave beyond on/off. [O7]
- **blossom-ic (Weinmann-Schanz).** Avalon TRVs plus GT-100 gateway claim digital hydronic balancing "at least equivalent to procedure A and B", BAFA-eligible, no heat-load calculation, no draining. Mechanism not published. [O8]
- **KALO (German metering/service).** Smart thermostats continuously measure heat-up speed at each radiator and adjust valve openings; positioned as "Verfahren T" (thermal method) in DIN 94679-4, a continuous rather than one-off balance. [O9, O10]

---

## 5. Patents (high level; not legal advice; status mostly unverified)

| Patent | Owner | Gist | Relevance / risk for Radiate |
|---|---|---|---|
| DE4221725A1 (1992) | not checked | Open all thermostatic valves, wait for stabilisation, close valves in overheated rooms, store resulting openings as per-valve maximum; later cold starts open only to that maximum. [P3] | Priority 1992, so expired. Useful public-domain prior art for a learned per-valve cap. |
| EP1936290B1, DK1936288T3 (about 2006) | Techem, likely (FPO listing of DE102006060324) | Detect hydraulic state from each room's heating dynamics; react by limiting valve opening on radiators with faster heating dynamics. [P6] | **Closest to Radiate's likely core idea.** 20-year term from a 2007 filing would run to about 2027 if maintained. Check legal status and claims before shipping heat-up-rate-based capping in DE/EP states. |
| EP2420748A2/A3 (ista, priority Aug 2010) | ista International | Calculation unit compares data with stored value and returns a new max permissible opening to each electronic thermostatic valve when over-supply is detected; heat-up still finishes in about 35 min. [P4] | Grant status unknown (A3 search report 2016). Would run to 2031 if granted. Check claims. |
| EP2702331A2 / WO2012146323 (priority Apr 2011) | not identified | Close valves, then open in steps, comparing thermostat temperature change against a threshold; stop opening when further opening no longer raises temperature; use that as max opening in heating mode. [P5] | Status and owner unknown. Design around: avoid a stepwise "open until no further temperature gain" commissioning routine unless cleared. |
| DE102012002941A1 | not checked | Dynamic balancing by limiting valve stroke according to current heat demand. [P7] | Status unknown; check. |
| US10697650B2 (Computime, 2016/2017) | Computime | Valve controller reads radiator inlet/outlet temperature difference, computes valve pin travel to hold a stable differential, periodically updated, using a time period based on measured emitter flow characteristic. [P1] EP family member exists (PL3276267T3 suggests EP3276267). [P11] | Active in US. Radiate has no per-radiator return sensor, so naturally outside it. Avoid adding inlet/outlet delta-T driven pin control without review. |
| US8109289B2 (Honeywell) | Honeywell | Temporary balancing units with pressure sensors attached to balancing valves, flows set to targets, units removed. [P2] | Expired (fee-related). Irrelevant mechanism. |
| EP3339752B1 | Danfoss | Several electronic radiator controllers in one room communicate to avoid uneven heat between radiators. [P8] | Listed as revoked. Intra-room sharing (like Ally load balancing) appears free to use, *uncertain*. |
| US10578318 | not identified | One thermostat sends a calculated pin position to several TRV controllers in a room, normalising each to its valve characteristic. [P9] | Check if Radiate drives multiple valves per room from one controller (not the case for the reference install). |
| EP3242088B2, EP4180899 | tado | Multi-zone heating control (2016); radiator thermostat hardware (2021). [P10] | Claims not reviewed; no tado balancing patent found. |

**Design-around guidance (inferred):** keep Radiate's caps derived from long-run operational statistics (relative heat-up rate and duty cycle across normal operation) rather than a dedicated full-open/close commissioning test; make it a soft, continuously re-learned limit; document the DE4221725 public-domain lineage; obtain a proper freedom-to-operate check on EP1936290 and EP2420748 before marketing in Germany.

---

## 6. Standards, papers, UK context, oil boilers

- **VdZ procedures.** Procedure A was an approximation (floor-area factors, up to 500 m²); procedure B uses room-by-room heat load per DIN EN 12831 and a calculation. Since January 2023 German subsidy applications accept only B, confirmed on the VdZ form. [S3, S4]
- **DIN 94679-4.** Defines a thermal "Verfahren T" as an alternative to B, e.g. with smart thermostats that track heat-up speed and adjust openings continuously; legally robust only with devices certified to it. KALO calls the norm a draft, so final status is *uncertain*. [O9, O10]
- **Tunzi, Østergaard, Svendsen, Energies 15(1):367, 2022.** Prototype electronic TRVs with an extra return-temperature sensor per radiator; algorithm controls valve opening to limit return temperature and so achieve automated balancing (district-heating context). [S1] Needs pipe sensors Radiate does not have, but supports "cap fast radiators" logic.
- **Håkansson et al., Energy & Buildings 2025 (Chalmers/FCC).** Model of pipe hydraulics plus zone thermal dynamics, identified from operational sensor data, to compute valve reconfigurations; Swedish case study reduced zone temperature variance; weather-independent before/after comparison. [S2] Good template for Radiate's balance-quality metric.
- **UK Part L 2021 (England, from 15 June 2022).** On boiler replacement each room should have thermostatic room control; smart/networked TRVs qualify (ADL Vol 1 §5.20, exemptions §5.21). [S5]
- **Boiler interlock.** Boiler and pump must switch off when there is no space heating or hot water demand; TRVs alone do not provide interlock. Applies to oil as well as gas replacements. [S5]
- **Boiler Plus (2018, England).** Time and temperature controls on all new boilers; extra efficiency measure for replacement gas combis. Mainly gas, limited relevance to oil. [S6]
- **Worcester Heatslave (oil combi, internal store).** DHW has priority: during draw-off and store recovery the full boiler output goes to the store and radiator circulation pauses, then resumes [S7]. The programmer's hot-water channel times the store [S8]. Store temperature set by the boiler's hot-water control knob [S7]. No anti-cycling or minimum run figure found in the extracts. *(gap: read the official manual)*
- **Oil short-cycling.** No OFTEC figure found publicly. Resideo's 3 cycles/h and 4 min minimum on time for oil [O3] is the best documented default. Practitioner opinion: under 2 to 3 min burns are poor; 5 to 10 min minimum preferred; short burns keep flues below dew point and promote sooting. [S9 forum]

**Implications for Radiate (inferred):** default oil boiler guard of min on 5 to 10 min, min off about 10 min, at most 3 starts/h, configurable; treat store recovery as a period where radiator learning must pause (no flow to radiators); require a guaranteed open path (stairs radiator) whenever the boiler fires.

---

## 7. Feature comparison

"doc" = documented, "inf" = inferred, "n/f" = not found publicly.

| Feature | tado X | Danfoss Ally/Eco | Homematic IP | Others | Source |
|---|---|---|---|---|---|
| Whole-house balancing claim | Yes (doc) | Yes, TÜV vs VdZ A/B (doc) | Yes, Fraunhofer IEE (doc) | blossom-ic, KALO yes; Wiser, Netatmo, Hive, EasyControl n/f | T1, D6, H1, O8, O9 |
| Intra-room multi-TRV load sharing | n/f | Yes, gateway `load_room_mean` (doc) | n/f | n/f | D1, D4 |
| Third-party certificate | TÜV Rheinland HydroBalance 2.03 (doc) | TÜV Rheinland (doc) | Fraunhofer IEE study (doc) | blossom-ic claims BAFA (doc, vendor) | T4, D6, H2, O8 |
| Certified algorithm version pinned | Yes, recert on change (doc) | n/f | n/f | n/f | T4 |
| Standards referenced | BAFA/KfW checklist, GEG §60c, DIN 94679-4 (doc) | VdZ A/B (doc) | VdZ form (doc) | KALO: DIN 94679-4 Verfahren T | T4, D6, H8, O9 |
| Paid subscription | AI Assist required (doc) | No (n/f of fee) | No (n/f of fee) | KALO service model | T1, T3 |
| Every radiator must have smart TRV | Yes (doc) | Implied for certified use (inf) | Implied (inf) | Wiser recommends (doc) | T1, O2 |
| Works with uncontrolled bypass radiator | Unsupported by requirement (inf) | n/f | n/f | n/f | T1 |
| User toggle | Yes, Settings (doc) | n/f | No config needed (doc) | n/f | T2, H8 |
| Learning duration | n/f | n/f | "short learning phase" (doc) | Netatmo Auto-Adapt recal 14 days (doc) | H3, O5 |
| Continuous re-balancing | Yes (doc) | Implied (inf) | Yes, whole season (doc) | KALO continuous (doc) | T1, H8, O9 |
| Signals used | n/f | Valve state, room temp, pipe temp (Eco, doc) | Room temp (doc, third party) | KALO heat-up speed (doc) | D8, H3, O9 |
| Heat-up rate learning | inf | n/f | inf | KALO yes (doc); patents EP1936290 | O9, P6 |
| Per-radiator max opening cap | n/f; no user cap (community) | n/f | Throttles over-supplied radiators (doc) | Patents DE4221725, EP2420748 | T5, H3, P3, P4 |
| User-settable max opening | No (community) | n/f | n/f | TRVZB yes (CLAUDE.md) | T5 |
| Flow limit (mechanical) | No | Dynamic Valve (separate product) | No | n/f | D8 |
| Pump speed advice | Reduce gradually (doc) | n/f | n/f | n/f | T1 |
| No drain/valve swap needed | Yes (doc) | Yes (doc) | Yes (doc) | blossom-ic yes | T3, D7, O8 |
| Overshoot avoidance claim | n/f | n/f | Yes (doc) | n/f | H3 |
| Valve characteristic learning | Calibration at fit (review) | Adaptation run, nightly (doc) | n/f | n/f | T6, D4 |
| Valve exercise | n/f | Day/time configurable (doc) | n/f | n/f | D4 |
| External room sensor input | n/f | Yes, 0.01 degC, timeouts 3 h / 35 min (doc) | n/f | TRVZB 2 h | D4 |
| Covered-radiator mode | n/f | `radiator_covered` (doc) | n/f | n/f | D4 |
| Control aggressiveness param | n/f | `algorithm_scale_factor` 1 to 10 (doc) | n/f | n/f | D4 |
| Setpoint offset trim | n/f | ±2.5 degC (doc) | n/f | n/f | D4 |
| Valve demand % reported | n/f | `pi_heating_demand` (doc) | n/f | TRVZB opening degree | D4 |
| TRV heat request flag | n/f | `heat_required` (doc) | n/f | Hive Heat on Demand | D4, O6 |
| Heat available flag to TRV | n/f | `heat_available` (doc) | n/f | n/f | D4 |
| Window open detection | n/f | Internal 5-state plus external (doc) | n/f | n/f | D4 |
| Boiler interlock | Via tado bridge/thermostat (inf) | Gateway aggregates heat request (inf) | MIOB switches boiler/pump (doc) | Wiser hub relay; Part L requires | H6, O2, S5 |
| Optimum start | n/f in scope | Eco week-1 learning; Ally preheat (doc) | n/f | Wiser Comfort, Netatmo Auto-Adapt (doc) | D9, D4, O1, O5 |
| Optimum stop | n/f | n/f | n/f | Wiser Eco Mode (doc) | O1 |
| Outdoor/weather compensation | n/f | n/f | n/f | Wiser Eco Mode (doc) | O1 |
| TPI cycle rate | n/f | n/f | n/f | CM92x 3/6/9/12 cph (doc) | O3 |
| Oil boiler cycle default | n/f | n/f | n/f | 3 cph, min on 4 min (doc) | O3 |
| Minimum on time | n/f | n/f | n/f | 1 to 5 min, 10% of cycle (doc) | O3 |
| Pump/boiler overrun | n/f | n/f | n/f found | n/f | H6 |
| DHW store priority handling | n/f | n/f | n/f | Heatslave pauses CH during recovery (doc) | S7 |
| Report/visualisation of balance | n/f | n/f | n/f | Chalmers variance metric (paper) | S2 |
| Return-temperature sensing | No | Eco senses pipe temp (doc) | n/f | Tunzi prototype (paper); Computime patent | D8, S1, P1 |
| Room grouping of valves | n/f | App group tile (doc) | n/f | n/f | D11 |
| Underfloor support | n/f | Icon (TÜV) (doc) | FALMOT-C12 (doc) | n/f | D7, H7 |
| Subsidy eligibility (DE) | Claimed with TÜV (doc) | Claimed (doc) | BAFA eligible reported (doc) | blossom-ic, KALO claim | T3, D7, H8, O8 |
| Intra-room "only one TRV" rule | n/a | Must not use load balancing with 1 eTRV (doc) | n/a | n/a | D1 |
| Stale-data rule | n/f | Discard loads <-500 or >90 min old (doc) | n/f | n/f | D1 |
| Update interval of room mean | n/a | 15 min (doc) | n/a | n/a | D1 |

---

## Sources

- T1 https://help.tado.com/en/articles/13214763-what-is-hydronic-balancing
- T2 https://help.tado.com/en/articles/13214763-how-do-i-activate-hydronic-balancing-for-my-heating-system
- T3 https://www.tado.com/en/press/news-alert-tado-hydronic-balancing-is-now-available
- T4 https://ext.api.tado.com/apps/documents/hydronic-balancing/tuev-certificate-en.pdf
- T5 https://community.tado.com/en-gb/discussion/7040/maximum-opening-percent-and-time-on-radiator-thermostate/p5
- T6 https://smarthomeissues.co.uk/tado-smart-radiator-thermostat-x-review/
- D1 https://assets.danfoss.com/documents/latest/284715/AM375549618098en-000103.pdf (Ally eTRV 1.20 Zigbee cluster spec)
- D2 https://s3.gy.digital/thermovent/uploads/product_file/data/831/Danfoss_Ally_0142420_Zigbee_Specifications_EN.pdf (1.12 spec mirror)
- D4 https://github.com/Koenkk/zigbee-herdsman-converters/blob/master/src/devices/danfoss.ts
- D6 https://assets.danfoss.com/approvals/468851/ID432850500833-0401.pdf
- D7 https://www.danfoss.com/de-at/about-danfoss/news/dhs/tuev-hydronic-balancing/
- D8 https://www.danfoss.com/en/about-danfoss/news/dhs/top-performing-digital-radiator-thermostats-take-energy-efficiency-to-the-next-level/
- D9 https://assets.danfoss.com/documents/196521/AI231586403273en-020401.pdf
- D10 https://community.home-assistant.io/t/zigbee2mqtt-danfoss-ally-trv-room-load-balancing/468526
- D11 https://www.manualslib.com/manual/3101865/Danfoss-Ally.html?page=9
- S10 https://github.com/lursyy/danfoss-ally-coordinator
- H1 https://homematic-ip.com/de/news/automatisierung-des-hydraulischen-abgleichs
- H2 https://www.eq-3.de/presse/detail/handwerk-homematic-ip-automatisiert-den-hydraulischen-abgleich.html
- H3 https://www.elektro.net/122189/hydraulischer-abgleich-automatisiert/
- H4 https://homematic-ip.com/de/blog/hydraulischen-abgleich-automatisieren
- H5 https://homematic-ip.com/de/blog/smart-home-foerderung-mit-homematic-ip
- H6 https://media.elv.com/file/142988_um.pdf
- H7 https://www.eq-3.de/downloads/download/broschueren/homematic_ip/HmIP-FALMOT-C12_153621A0_Produktdatenblatt-2-seitig_web.pdf
- H8 https://www.technikhaus.de/index.php?cPath=170_175
- O1 https://wiser.draytoncontrols.co.uk/smart-modes
- O2 https://draytoncontrols.co.uk/sites/default/files/2024-07/DL%20Installer%20Handbook%202024%20Issue%205%20Final%20%28compressed%20for%20web%29.pdf
- O3 https://homecomfort-techlit.resideo.com/emeadocuments/pim%20-%20renamed/cm920enig42011076-003uk07.pdf
- O4 https://www.ukplumbersforums.co.uk/threads/evohome-continually-bringing-boiler-on-for-one-minute-then-off-for-10-minutes.123375/post-1130373
- O5 https://qna.legrand.com/hc/en-001/articles/33748688160785-Auto-Adapt-is-not-working-properly-What-should-I-do
- O6 https://singletrackworld.com/forum/topic/smart-trvs-hive-and-heating-on-demand
- O7 https://www.worcester-bosch.co.uk/products/boiler-controls/bosch-easycontrol
- O8 https://www.weinmann-schanz.de/de/en/Heating/Control-Technology-thermostats/Smarthome-systems/Blossom-ic-the-clever-heating-system/Central-control-unit-Home-Gateway-GT-100-sid1107516.html
- O9 https://www.kalo.de/so-gelingt-der-hydraulische-abgleich-mit-smarten-thermostaten/
- O10 https://vdiv.de/aktuelles/praxistipps-details/hydraulischer-abgleich-mit-smarten-thermostaten
- P1 https://patents.google.com/patent/US10697650
- P2 https://patents.google.com/patent/US8109289
- P3 https://patents.google.com/patent/DE4221725A1/en
- P4 https://data.epo.org/gpi/EP2420748A3
- P5 https://data.epo.org/gpi/EP2702331A2
- P6 https://patents.google.com/patent/EP1936290B1/en
- P7 https://patents.google.com/patent/DE102012002941A1/en
- P8 https://patents.google.com/patent/EP3339752B1
- P9 https://uspto.report/patent/grant/10,578,318
- P10 https://patentimages.storage.googleapis.com/11/8c/b7/63a0e6b085f44c/EP3242088B2.pdf
- P11 https://patents.google.com/patent/PL3276267T3/pl
- S1 https://backend.orbit.dtu.dk/ws/files/267392540/energies_15_00367.pdf
- S2 https://research.chalmers.se/publication/548747
- S3 https://files.vdzev.de/pdfs/hydraulischer-abgleich-heizungsanlagen/Hydraulischer_Abgleich_Heizungsanlagen.pdf
- S4 https://www.co2online.de/energie-sparen/heizenergie-sparen/hydraulischer-abgleich/wie-funktioniert-der-hydraulische-abgleich/
- S5 https://www.beama.org.uk/static/78353d2c-0ecf-410d-a154d2126fcba47f/eee87b55-16b3-4cc4-9d8a9b1c6954e2a9/Part-L-2022-Heating-Controls-Guidance.pdf
- S6 https://viessmann.co.uk/en/heating-advice/boilers/How-to-comply-with-Boiler-Plus.html
- S7 https://www.worcester-bosch.co.uk/professional/support/literature/worcester-heatslave-installation-instructions
- S8 https://installer.worcester-bosch.co.uk/professional/support/troubleshooting/faqs/controls-faqs/why-is-the-controller-on-a-combi-boiler-twin-channel
- S9 https://forum.heatinghelp.com/discussion/198245/is-there-an-ideal-cycling-time-for-oil-boiler-run-time-cycle-what-is-short-cycle
