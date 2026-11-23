# Control efficiency for an on/off oil combi: what saves fuel

Research note, 23 November 2026. Input to [ADR-0004](../adr/0004-efficiency-by-room-use.md) and the [efficiency plan](../plans/efficiency-mvp.md); the decisions there take precedence where they differ (for example, the first cut changes only the `eco` demand mode and defers optimum stop, the outdoor cut-off and the damp guard). Figures marked **[estimate]** are unverified and must be checked in the simulator before any default changes.

Scope: the reference install (Heatslave 12/14, about 13 kW output, 1.64 l/h nozzle, so roughly 17 kW input; internal store with hot-water priority; 8 TRVZB rooms plus an unvalved stairs bypass). Read against spec sections 4 and 5, `docs/simulation.md`, `docs/implementation-status.md` and `docs/research/` (the commercial and VTherm notes already cover Wiser, evohome, tado, Hive and VTherm's boiler rule, so they are only summarised here).

Labels: **[verified]** read in the source; **[secondary]** quoted by a secondary source, original not read; **[estimate]** my arithmetic or judgement, not from literature.

## 0. The physics that decides most of this

For a non-condensing, non-modulating oil boiler, efficiency barely depends on how the heat is asked for. The burner always fires at full rate, and return temperatures stay above the oil dew point (about 45 °C, BRE 2017 [verified]) so there is no condensing bonus to chase. Brookhaven's input/output testing of residential oil systems models annual losses as a steady-state flue loss proportional to output plus an **idle loss proportional to the hours the boiler is held hot** (0.8 % of input for the oil combi tested, 0.15 to 2.1 % across oil units; summer hot-water-only efficiency of the oil combi was 47.9 %) [verified, Butcher 2007].

So for this house, fuel is roughly: (heat lost by the rooms) / 0.75 to 0.8 + (hours the boiler and store are kept hot) × idle loss. The levers are therefore **lower average room temperatures** and **fewer hours held hot**, in that order. Burn scheduling is a third-order effect on fuel, though it matters for soot and wear.

## 1. What actually saves fuel

### 1.1 Lower setpoints

- **Evidence.** Cambridge Architectural Research for DECC modelled 19 to 18 °C across the English stock at **13 % of space heating** (triangulated by degree days at 10 % plus, higher once internal gains are netted off) [verified, Palmer, Terry and Pope 2012]. BRE for BEIS uses "around 10 %" per 1 °C [verified, BRE 2017]. EST quotes about £105 a year for 22 to 21 °C, without a percentage [secondary]. The "6 to 10 % per °C" rule is the same physics; the percentage rises in mild climates because the indoor to outdoor difference is smaller, so in a UK maritime winter 10 to 13 % per K of whole-house mean temperature is the defensible figure.
- **For Radiate.** Setpoints are household choices (in use 19, occasional 16, unused and night 14 °C). Radiate's lever is precision and transparency: tighter control lets people accept a lower setpoint (BRE 2017 makes this argument for TPI, noting mechanical thermostats swing about 3 °C and electronic ones 1 to 1.5 °C) [verified].
- **Complexity:** very low (copy and a suggestion). **Risk:** comfort; never nudge below the damp floor (section 5).

### 1.2 Night setback and recovery

- **Evidence.** DOE Building America: about 1 % per °F of setback for an 8 h night (about 1.8 % per K), more in colder weather [verified, DOE 2014]. Pilot-building tests found intermittent heating always used less than continuous, the saving falling as the building's time constant rises [secondary, Thermal Science 2024].
- **Does recovery eat the saving?** Not for this boiler. The recovery burn is a full-output burn at steady-state efficiency, which is the boiler's best operating point. A high-mass house cools slowly, so the saving per hour of setback is smaller, but it is not negative. Recovery penalties appear with condensing boilers that lose condensing at high flow temperatures, heat pumps, and right-sized systems that cannot recover (DOE 2014 lists these). The 13 kW Heatslave is very likely oversized for nine radiators, so recovery is fast [estimate].
- **For Radiate.** Setback exists (night and unused 14 °C). What remains is depth, limited by damp (section 5), and timing (1.3).

### 1.3 Optimum start, and the margin it carries

- **Evidence.** No domestic field figure found for optimum start versus a fixed preheat [gap].
- **What exists.** `_preheat_due` starts when `(next − T) / rate × 1.2 + arrival lag + valve lead ≥ time to go`, with `rate` computed as if 80 % of controllable rooms were open (`decide.py`). Both choices err early. With room loss rates around 1 to 1.5 K/h at the night setback, every 15 minutes of early arrival keeps a room about 0.3 K warmer for that period than needed [estimate].
- **Recommendation: arrival-tuned optimum start.** Record each preheat's arrival error (time at target minus period start) per room, and adapt the 1.2 margin per room towards a median arrival of 0 to 10 minutes early; use the actual set of rooms preheating in the supply factor instead of 0.8 n. Tado, Wiser and Danfoss Eco all learn start time (commercial.md).
- **Saving:** 1 to 3 % of space heating [estimate: two preheats a day per in-use room, 15 to 30 min early each]. **Complexity:** low (model and arrival data exist; balance-score code already measures arrival). **Risk:** occasional late arrival; keep a floor margin.

### 1.4 Optimum stop (early stop, coasting)

- **Evidence.** Wiser's Eco Mode is optimum stop plus weather compensation; Schneider claims about 2 % average extra saving [secondary, unverified methodology]. Not in Radiate.
- **Recommendation.** Near the end of a warm period, a room stops calling if its learned model predicts it stays within a coast allowance (0.5 K by default) of setpoint until the period ends. With `b` known per room, this is one prediction per tick. It also stops eco pooling from starting a burn in the last 30 to 60 minutes of a period for rooms about to set back.
- **Saving:** 1 to 3 % [estimate, consistent with the Wiser claim]. **Complexity:** low to medium (touches the fire rule and burn extension, which must not top up a room that is about to set back). **Risk:** slight evening cool-down; make the allowance a setting.

### 1.5 Zoning and heat flow between rooms

- **Evidence.** Measured: a matched pair of 1930s semis, zonal control (rooms heated only when occupied) used **11.8 % less gas** over 8 winter weeks, despite a 2.4 point drop in daily boiler efficiency; whole-house mean temperature fell only 0.6 K because heat flowed from heated to unheated rooms; annual estimate 10 to 14 % [verified abstract, Beizaee et al. 2015]. Simulated: 12 to 31 % (semi) and 8 to 37 % (bungalow), largest in older houses, with **internal doors closed**, and with intermittent occupancy [secondary abstract, Cockroft et al. 2017].
- **What this means here.** Radiate already zones. Partitions leak: a 10 m² partition at 5 K difference passes around 100 W [estimate, U about 2 W/m²K], so an unused room beside the lounge is partly heated through the wall. `d_r` absorbs a steady warm neighbour; adjacency is open question 5, for the owner.
- **Recommendation.** A house suggestion: "Keep the door of an unused room shut" when an unused room tracks its neighbours. **Complexity:** very low. **Saving:** part of the Cockroft door effect, not separately quantified.

### 1.6 Longer, fewer burns versus short cycling

- **Evidence.** Cyclic operation of oil burners produced 3 to 4 times the particulate emission rate of steady operation [secondary, ACEEE 1992 summarising older test work]. AFUE testing assumes an average burner on-time of 9.7 min [verified, Butcher 2007]. Resideo's oil default is 3 cycles/h with 4 min minimum on (commercial.md). In the input/output model, efficiency loss from cycling is mostly off-cycle (idle and purge) heat loss, which depends on hours held hot rather than number of starts [verified framework, Butcher 2007]. No source quantified fuel loss per start for a 1990s pressure-jet oil burner [gap].
- **What exists.** Minimum burn 8 min, minimum off 10 min, 3 starts/h, eco pooling, burn extension, heat sinks. Simulation: eco cuts relay starts 19 % (mild) but burner starts are set by the boiler thermostat inside each call (spec 5.3, open question 1).
- **Assessment.** Further consolidation buys little fuel [estimate: under 2 %] and costs some, because top-ups and heat sinks put heat into rooms that do not need it. Its real value is soot and nozzle life. Measuring burner firing (Shelly power, open question 1) is the only way to see the burner cycles that matter.
- **Recommendation.** Restrict heat sinks and burn-extension top-ups to rooms that are in use now or within the next few hours, and count the stairs bypass first; never warm an unused room as a sink if the bypass plus a soon-needed room covers `sink_min`. **Complexity:** low.

### 1.7 Boiler thermostat and TRV hysteresis

- **Flow temperature.** Radiate cannot set it. For a non-condensing boiler a lower setting gains little and return water below about 45 to 50 °C risks flue-side condensation (dew points from BRE 2017 [verified]; corrosion risk is standard practice, not sourced here). The 12/14 dial range was not found [gap]. Leave it to the engineer.
- **Hysteresis.** Radiate's 0.3 K call hysteresis on the room sensor is already well inside the 1 to 1.5 K BRE cites for electronic thermostats. No change.

### 1.8 Weather anticipation and heating cut-off

- Outdoor temperature comes from a local Zigbee sensor; there is no forecast (implementation-status). Forecast-driven optimum start and stop mostly refines 1.3 and 1.4; Wiser's 2 % claim bundles it. DECC's model gives 5.5 % for delaying the heating season from October to November [verified, Palmer et al. 2012], but that is behaviour, not control.
- **Recommendation.** An outdoor cut-off: no comfort heating when the 24 h mean outdoor temperature is above 15 °C (frost and damp rules still apply). **Saving:** 0 to 2 % [estimate; eco pooling already suppresses most mild-day calls]. **Complexity:** very low.

## 2. Demand aggregation ("leniency") elsewhere

| System | Rule for firing a shared boiler | Source |
|---|---|---|
| Better Thermostat | None of its own; docs suggest boiler on if any room is heating | better-thermostat.md |
| Versatile Thermostat | On if count of active TRVs ≥ N, or Σ (radiator power × demand %) ≥ W; activation delay; no minimum burn or off | vtherm.md |
| evohome, Wiser, Hive, tado | Any zone demand fires the relay; evohome uses TPI with oil defaults of 3 cycles/h, 4 min minimum on | commercial.md |
| NIBE, Danfoss heat pumps | **Degree minutes**: integrate flow-temperature deficit over time, start the compressor at −60 DM by default; a less negative value gives more starts and wear, a more negative one uneven temperatures | NIBE manuals [verified via search extracts] |
| Liao and Dexter (Reading) | Infer house average temperature from boiler firing and weather, PI on that; field trial over two seasons showed savings and better comfort | Energy and Buildings 37 (2005) [secondary abstract] |

Radiate's eco rule is already more selective than any consumer product found. The one idea worth borrowing is **degree minutes**: a per-room `∫ gap dt` lets a small, persistent deficit fire eventually without a hard 1.5 K limit. It overlaps the existing rule; try it in simulation only if the eco limit proves too blunt.

## 3. Room importance weighting

No product found weights rooms by importance in the boiler decision; they all fire on any zone. The usable pattern is to keep the three use levels Radiate already has and give each a fixed role in pooling, with no sliders:

| Use level now | Fires the boiler alone at | Joins a burn | Top-up or heat sink |
|---|---|---|---|
| In use | eco limit (1.5 K) | yes | yes |
| Occasional | 2.5 K below target | yes | only if needed within 2 h |
| Unused (and night) | never, except frost or damp guard | only if below its own target | never |

The level is the one the room has **at that moment** from the compiled week, so a bedroom is "in use" in the evening and "unused" by day. Householder text: "Important rooms can start the boiler on their own. Others wait for a burn that's already happening."

- **Saving:** 1 to 3 % [estimate: lower mean temperature in minor rooms, fewer solo burns; simulation showed the toilet's solo night calls were most eliminated starts]. **Complexity:** low (per-level eco limit in the fire rule, filter on top-ups and sinks). **Risk:** a minor room drifts below target longer; the damp guard bounds it.

## 4. Hot-water store

- **Facts.** Idle loss while held hot was 0.8 % of input for the tested oil combi (about 140 W on a 17 kW input, roughly 3.3 kWh or 0.3 litres a day if held hot 24 h) and up to 2.1 % for older units [verified figures, my arithmetic].
- **Recommendations.**
  1. **Fewer store hours.** The default windows are 1.5 h and 4 h a day. Ending the evening window when the last regular draw-off is done, instead of 21:00, saves its idle loss for each hour removed [estimate: about 0.1 to 0.35 kWh input per hour, so 20 to 60 litres a year for 2 to 4 hours a day less]. Learned recovery time (planned) makes "ready by" scheduling possible: start the window recovery time before the first draw, end it at the last.
  2. **Merging (planned, opt-in).** Shift the store window by up to 30 min to sit next to a heating burn. Because of priority, put the store recovery **before** the morning preheat and add the recovery time to the optimum start lead for those mornings; `_preheat_due` does not account for it today. The fuel gain is mostly one cold boiler start a day avoided [estimate: small]; the comfort gain (no 25 min stall in the middle of a preheat) is the stronger reason.
- **Complexity:** low to medium. **Risk:** running out of hot water; keep boost.

## 5. Risks of under-heating

- **Health.** WHO (2018): 18 °C minimum for occupied rooms in temperate climates, higher for vulnerable people [verified]. UKHSA: heat the rooms you use to at least 18 °C [secondary]. The 19 °C in-use default meets this.
- **Mould.** Mould germination is tied to sustained surface relative humidity of about 80 % (IEA Annex 14, BS EN ISO 13788 practice), and UK guidance designs for a surface temperature factor `fRsi ≥ 0.75` [secondary; BRE IP1/06 not read]. Taking the worst surface at `T_s = T_out + 0.75 (T_room − T_out)`:

  | Outdoor | Room 12 °C | Room 14 °C | Room 16 °C | Room 18 °C |
  |---|---|---|---|---|
  | 0 °C | 66 % | 64 % | 62 % | 60 % |
  | 5 °C | 71 % | 69 % | 67 % | 65 % |

  Room RH above which the worst corner reaches 80 % [estimate, Magnus formula]. The limit hardly moves with room temperature; what matters is the moisture in the air. Warming a cold room helps only if moisture does not rise with it; ventilation is the real fix.
- **Recommendation: damp guard.** Using each SNZB-02B's temperature and humidity and the outdoor sensor, compute worst-surface RH. If it exceeds 80 % for more than about 6 hours in a day, raise that room's floor by 1 K (to a cap) and raise a suggestion to ventilate; if it stays well below, the unused and night temperatures can be allowed to fall towards 12 to 13 °C. This replaces the fixed "below 12 °C" note with a measured limit. **Saving:** 2 to 4 % if unused and night temperatures can drop 1 to 2 K in dry rooms [estimate: 10 to 13 % per K applied to roughly a quarter to a third of room-hours, reduced by inter-room flow]. **Complexity:** medium. **Risk:** model error at real thermal bridges; keep 12 °C as an absolute floor.
- **Pipe frost.** Radiate fires below 7 °C in any room and ignores guards below 5 °C. Common UK frost thermostat settings are about 5 °C, with 4 to 5 °C for unheated spaces [secondary]. The unsensed risk is pipework in unheated spaces (loft, outbuildings, under floors); the 7 °C room threshold does not protect those. Whether the Heatslave has its own frost thermostat was not verified [gap].

## 6. Ranked changes for this house (saving per unit of complexity)

| Rank | Change | Saving | Complexity | Main risk |
|---|---|---|---|---|
| 1 | Show the cost per °C (10 to 13 %) beside the use-level temperatures, and suggest shutting unused rooms' doors | 0 to 13 % per K adopted (behavioural) | Very low | None; advice only |
| 2 | Arrival-tuned optimum start: per-room learned margin, real supply factor | 1 to 3 % [estimate] | Low | Late arrivals |
| 3 | Importance by use level in pooling; no top-ups or sinks in unused rooms; bypass first | 1 to 3 % [estimate] | Low | Minor rooms drift colder |
| 4 | Optimum stop with a 0.5 K coast allowance | 1 to 3 % [estimate; Wiser claims 2 %] | Low to medium | Evening cool-down |
| 5 | Store: end windows at the last draw-off, learned recovery, merge before preheat | 20 to 60 l/year [estimate] | Low to medium | Running out of hot water |
| 6 | Damp guard from worst-surface RH, allowing lower unused and night floors in dry rooms | 2 to 4 % [estimate] | Medium | Mould at bridges |
| 7 | Outdoor heating cut-off at a 15 °C 24 h mean | 0 to 2 % [estimate] | Very low | Cool shoulder-season evenings |
| 8 | Burner firing from Shelly power, to measure real cycles and verify all of the above | Enables evidence; under 2 % direct | Low software, needs wiring check | None |

These are not additive and most are estimates; the simulator should test 2, 3, 4 and 6 against the current eco baseline before any default changes.

## Sources

- Butcher, T. A. (2007). *Performance of Integrated Hydronic Heating Systems*. BNL for NYSERDA and NORA. https://www.greenbuildingadvisor.com/sites/default/files/brookhavenReport.pdf
- BRE for BEIS (2017). *Evidence Gathering: Compensation and TPI Heating Controls*. https://assets.publishing.service.gov.uk/media/5a81f66ced915d74e62350ca/heating-controls-compensation-tpi-bre.pdf
- Palmer, J., Terry, N., Pope, P. (2012). *How much energy could be saved by making small changes to everyday household behaviours?* CAR for DECC. https://assets.publishing.service.gov.uk/media/5a7a4493e5274a34770e5727/6923-how-much-energy-could-be-saved-by-making-small-cha.pdf
- US DOE Building America (2014). *Hydronic Systems: Designing for Setback Operation*. https://www.energy.gov/sites/prod/files/2014/07/f17/ba_case_study_hydronic_setback.pdf
- Beizaee, A. et al. (2015). Measuring the potential of zonal space heating controls to reduce energy use in UK homes. *Energy and Buildings* 92, 29 to 44. https://doi.org/10.1016/j.enbuild.2015.01.040 (summary: https://www.earth.org.uk/bibliography/beizaee2015zonal.html)
- Cockroft, J. et al. (2017). Potential energy savings achievable by zoned control of individual rooms in UK housing. *Energy and Buildings* 136, 1 to 11. https://pure.strath.ac.uk/ws/portalfiles/portal/62702071/Cockroft_etal_EB2016_Potential_energy_savings_achievable_by_zoned_control.pdf
- Thermal Science (2024) 28(2C), 1881 to 1891, intermittent heating in pilot buildings. https://doi.org/10.2298/tsci230604228p
- ACEEE 1992 Summer Study, Panel 2 Paper 7 (oil burner cyclic emissions). https://www.aceee.org/files/proceedings/1992/data/papers/SS92_Panel2_Paper07.pdf
- Liao, Z. and Dexter, A. L. (2005). Experimental study on an inferential control scheme for boilers in multi-zone heating systems. *Energy and Buildings* 37, 55 to 63. https://structurae.net/en/literature/journal-article/experimental-study-on-an-inferential-control-scheme-for-optimising-the-control-of-boilers-in-multi-zone-heating-system
- NIBE F1145 installer manual, degree minute settings. https://www.manualslib.com/manual/1146229/Nibe-F1145.html?page=49
- Drayton Wiser, Eco Mode and savings. https://schneider-electric.zendesk.com/hc/en-gb/articles/4410109524241-How-are-my-smart-mode-savings-calculated
- WHO (2018). *Housing and health guidelines*. https://www.ncbi.nlm.nih.gov/books/NBK535294/
- PHE (2014). *Minimum home temperature thresholds for health in winter*. https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/468196/Min_temp_threshold_for_homes_in_winter.pdf
- DLUHC and UKHSA (2023). *Understanding and addressing the health risks of damp and mould in the home*. https://www.gov.uk/government/publications/damp-and-mould-understanding-and-addressing-the-health-risks-for-rented-housing-providers/understanding-and-addressing-the-health-risks-of-damp-and-mould-in-the-home--2
- Schöck, surface temperature factor fRsi (0.75 UK criterion, secondary). https://www.schoeck.com/en-gb/press/the-surface-temperature-factor-frsi
- Mumovic, D. et al. (2006). Steady-state and transient mould risk assessment. *BSERT*. https://discovery.ucl.ac.uk/id/eprint/2296/1/BUILDING_SERV_ENG_RES_TECHNOL-2006-Mumovic-219-33.pdf
- Church of England, frost protection note (frost thermostat settings). https://www.churchofengland.org/sites/default/files/2022-10/frost-protection-note_v1.pdf
- Energy Saving Trust (2024). Home energy saving behaviours. https://energysavingtrust.org.uk/wp-content/uploads/2024/02/240122-Home-energy-saving-behaviors.pdf

## Not verified

Heatslave 12/14 boiler thermostat range and whether it has a frost thermostat; per-start fuel loss for a 1990s pressure-jet burner; BRE IP1/06 text (0.75 criterion taken from secondary sources); Wiser's 2 % figure; the full texts of Cockroft 2017 and Liao and Dexter 2005 (abstracts only).
