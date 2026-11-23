# Room usage and savings: research for Radiate

November 2026. Research only; nothing here is built. "Unverified" marks claims not checked against a primary source or not tested on a real house.

Input to [ADR-0004](../adr/0004-efficiency-by-room-use.md) and the [efficiency plan](../plans/efficiency-mvp.md), which take precedence where they differ. In particular, the design changes this note's baseline (each room's valve at its own usual temperature, not every room at the in-use temperature), adds a correction so a day can show a negative saving, defers the oil price and the room activity input, and reports litres and percentages first.

## What Radiate already has

- **Household** (`radiate.config.household`): people, routines, per-room use level (in use 19, occasional 16, unused 14, night 14 °C), room kind and people; compiles to a fixed weekly schedule per room, which the schedule mirror and Shelly fallback need. Room adjustments edit it.
- **Away**: per person, "away until" or HA presence after 60 min; recompiles the household.
- **Disturbance detection** (`core/disturbance.py`): shower (humidity), window (fast drop), fire (unexplained residual). Learning gates today; reusable as signals.
- **Accounting** (`core/accounting.py`): per day relay hours, starts, litres from the nozzle rating (relay time, an upper bound), `comfort_minutes_below`, partial flag; daily Elastic stream.
- **Suggestions** view and **simulator** with a conventional baseline runner.
- **Gaps**: no room activity input; a TRV knob turned by hand is overwritten by the reconciler within 2 min (spec 4.5); no savings figure or oil price; outdoor temperature falls back to a 5 °C default without a sensor.

## 1. Inferring how rooms are used

### Findings

**PreHeat** (Scott et al., UbiComp 2011, [PDF](https://ics.uci.edu/~djpatter/classes/2012_09_INF241/papers/p281-scott.pdf), [MSR page](https://www.microsoft.com/en-us/research/?p=161547)). Each room's day is a binary vector of 15 min slots (occupied if any motion). For the partial day so far, find the K = 5 past days with the smallest Hamming distance (weekdays matched to weekdays, padded with 4 h either side of midnight), average their remaining slots to get an occupancy probability, heat if it exceeds 0.5, looking ahead up to 3 h to preheat. In two UK per-room homes, gas fell 18 % and 8 % against the household's own schedule, and "MissTime" (occupied but more than 1 K below setpoint) fell 38 % and 60 %. Failure modes the authors report: rooms used briefly and at random (bathrooms, halls) were predicted "never occupied", so they fell back to whole-house occupancy for those; 21 of 40 ground-truth corrections in the UK were people asleep outside the expected sleep period, which motion sensors miss; a motion sensor not covering a room caused 18 more. Five homes, about 61 days each.

**Smart Thermostat** (Lu et al., SenSys 2010, [PDF](https://www.cs.virginia.edu/%7Estankovic/psfiles/sensys10-final169.pdf)). Door and motion sensors feed a hidden Markov model of Away, Active and Sleep for the whole house. The 28 % saving was estimated by simulating each house, not measured. A later field study of occupancy-responsive thermostats ([Energy and Buildings 2016](https://wcec.ucdavis.edu/wp-content/uploads/2016/07/Occupancy-Sensing-Thermostats.pdf)) reports far smaller measured savings, about 0 to 10 % (from a search summary; unverified against the full text).

**Why occupancy setback underdelivers** ([UC Davis WCEC, ACEEE paper](https://wcec.ucdavis.edu/wp-content/uploads/2014/11/ACEEE_Occupancy_Sensing_Thermostat_Limitations.pdf)): vacancies are often too short for a room to cool to its setback, recovery energy offsets part of the saving, and an empty room next to occupied ones is kept warm by them. Savings appeared only when vacancy was long and shared by neighbouring rooms.

**Nest Auto-Schedule** ([Google help](https://support.google.com/googlenest/answer/9247510), [manual edits](https://support.google.com/googlenest/answer/9242867)): learns only from temperatures set by hand; similar changes on consecutive days become set points. It learns one-off changes too.

**tado geofencing** ([Home and Away](https://support.tado.com/en/articles/3477785-what-does-home-and-away-mean)): house-level Home and Away from phones, each with its own schedule, optional preheat before arrival. Users report radius problems and people without phones. Radiate's away already matches this.

**UK field evidence on zoning**: the strongest UK trial (Lomas et al. 2022, [Energy and Buildings 254](https://doi.org/10.1016/j.enbuild.2021.111572), [summary](https://www.earth.org.uk/bibliography/lomas2022zonal.html)): 68 homes, room-by-room zonal control cut mean gas use by 3.5 %; two-thirds of homes used less, one-third more; savings came mainly from cooler bedrooms in the evening. A matched-pair test house study (Beizaee et al. 2015) found 12 % over 8 weeks with synthetic occupancy (figure from a secondary source; unverified). The BEIS-funded review (Lomas et al. 2018, [Strathclyde](https://strathprints.strath.ac.uk/78355)) found moderate-quality evidence that smart thermostats do not save energy against standard thermostats and programmers, and high-quality evidence that heating controls are hard to use, especially for older people.

**Signals available to Radiate, judged:**

| Signal | What it shows | Reliability | Notes |
|---|---|---|---|
| HA `person` presence | someone home | good at house level | Built. Misses people without phones, guests. |
| Phone room presence (Bermuda, ESPresense) | which room a phone is in | fair, needs an ESP32 proxy per room | [Bermuda](https://github.com/agittins/bermuda) author describes it as reasonably good room presence with a proxy in the room; users report "Unknown" areas. Phones left charging mislead it. |
| Lights, media players, PC or desk activity in an HA area | room in active use | good where they exist | Best cheap signal for lounge and office. Needs mapping HA areas to rooms. |
| TRV knob turned by hand | someone in the room wants it warmer or cooler | strong intent, rare | Currently lost to the reconciler. |
| Bathroom humidity jump | shower | good | Built as a gate. Says nothing about when to heat beyond "mornings". |
| Bedroom overnight humidity or absolute humidity rise | slept in, door shut | plausible | Unverified. Testable now against 14 days of SNZB-02B history in HA. |
| Temperature rise not explained by heating | people, cooking, sun | weak | One person is roughly 100 W; confounded by sun and neighbouring rooms. Fine as a supporting signal, not alone. |
| CO2 | occupancy, even count | good | No sensors in the reference house. |
| Door or window contacts | door shut, window open | indirect | Window is already a gate. |

### Recommendation

Do not let inferred occupancy drive the valves directly. PreHeat's own results show prediction fails for short, random-use rooms; field results show short vacancies save little; and the TRV mirror and Shelly fallback need a fixed weekly schedule. Use observations to **check and correct the household**, through suggestions.

- **Driver/HA side**: a generic room activity input, `POST /api/v1/rooms/{id}/activity` with `{"active": true, "since": ..., "source": "light.lounge"}`. radiate-ha maps HA areas to rooms and reports any `light`, `media_player`, `binary_sensor` (motion, occupancy) or user-chosen entity in that area. Radiate stays ignorant of where the signal came from. (Needs a radiate-ha change first, per ADR-0003.)
- **Pure core**: a per-room **usage log**: 15 min slots, each `active`, `idle` or `unknown`, from the activity input, TRV hand changes, and inferred signals (shower, humidity, residual) tagged by source. Unknown matters: a room with no activity sources must never be judged unused.
- **Pure core**: a usage summary per room and day type (weekday, weekend), the share of scheduled warm time with activity seen and the share of activity outside warm time, over at least 14 days of known data. This is a PreHeat-style histogram without the live prediction.
- **Driver**: stop discarding TRV hand changes. Treat a local setpoint change that Radiate did not send as an override until the next scheduled change (as the API override does) and log it as activity. Needs a pilot-valve test of how the TRVZB reports a local change (unverified).

## 2. How a householder says how a room is used

### Findings

- **Per-room schedules**: PreHeat's authors note people won't keep per-room programs up to date; the BEIS review found controls hard to use.
- **Use levels**: simple, one temperature each; say how warm, not when.
- **Occupancy-driven with override**: works at house level; per room fails on random-use rooms and needs sensors.
- **Learning from manual changes** (Nest): invisible until it surprises someone.
- **Suggestions**: tado has [savings advice](https://help.tado.com/en/articles/6707871-what-is-savings-advice); its logic is not public.

### Recommendation

Keep the household (people, routines, room kind, use level) as the one way to say how a room is used. Make **suggestions** the way it changes over time. Each usage suggestion:

1. States what Radiate saw, in plain words, with the evidence: "Bedroom 2: no activity on any weekday for 3 weeks (lights and the door contact). It is kept at 19 °C from 18:00 to 22:30."
2. Proposes one change that maps to existing machinery: a use level change, a room kind change, or a room adjustment ("keep cold weekdays 18:00 to 22:30").
3. Shows the estimated effect from the savings model (section 3): "about 6 litres (£4) a month at this winter's weather".
4. Has Apply (writes the saved household, so it is undoable in the week view), Not now (snoozes 30 days) and Don't suggest this for this room.
5. Never goes below `damp_below_c` and is suppressed for a room whose humidity runs high, since a cold, humid room risks condensation and mould.

Suggestion kinds, in order of value: room scheduled warm but unused (biggest saving); room used outside its warm periods (comfort); someone regularly home earlier or later than their routine (from presence history, adjusts the person's routine, not each room). Thresholds as settings with defaults, in line with the owner's preference for no baked-in household assumptions. Lives in `core/suggestions.py` (pure), fed by the usage summary.

Defer a reactive "heat while in use" mode. With an oil boiler, arrival lag and a radiator's warm-up, a room reached for 20 minutes is barely warmer by the time it is left; the manual override already covers a planned use.

## 3. Measuring savings honestly

### Findings

**Vendors.**
- tado's Energy Savings Report gives "personalised, estimated energy savings ... compared to if you had a traditional thermostat and heating schedule", taking its skills into account; it lists hours in Away, sunshine hours used, open-window events, and hours below 19 °C. The formula is not published ([tado help](https://support.tado.com/en/articles/3478786-what-does-energy-savings-show-me)). Users have asked tado to make it "more honest" (community thread title; content not retrievable, unverified).
- Drayton Wiser Eco Mode counts savings only while the room is below or near its setpoint, so the boiler would otherwise have run; Away savings count when the room is below the normal setpoint. It admits Eco Mode does not know whether the boiler is on ([Wiser support](https://schneider-electric.zendesk.com/hc/en-gb/articles/4410109524241-How-are-my-smart-mode-savings-calculated)). The headline "up to 30 %" combines figures from BEAMA research ([Drayton](https://draytoncontrols.co.uk/homeowners/energy-efficiency/the-research)).
- Nest: bill-based before-and-after studies found about 10 to 12 % heating savings; earlier thermostat-data estimates against an assumed constant setpoint gave up to 20 %, and a later modelled figure against a constant 72 °F gives "up to 31 %", which Google says may not represent typical customers ([Nest white paper](https://services.google.com/fh/files/misc/nest_thermostat_energy_savings_vs_baseline.pdf), [BPA pilot](https://www.bpa.gov/-/media/Aep/energy-efficiency/emerging-technologies/ET-Documents/BPA-FPUD-Nest-Thermostat-Pilot-Savings-Assessment.pdf)).
- Hive: no public method found.

**Criticism.** The pattern is consistent: modelled savings against a generous baseline are two to three times measured ones (Nest 20 to 31 % against 10 to 12 %; Lu 28 % simulated against 0 to 10 % field). Lomas et al. 2018 call heating-control savings claims "often biased, unsubstantiated, misleading, or incorrect". The UK ASA banned ScottishPower's "save up to 20 % off your gas heating" for a remote heating control ([ASA ruling](https://www.asa.org.uk/rulings/scottishpower-energy-retail-ltd-a15-294847.html)) and warns that "save up to" claims need broad evidence ([ASA guidance](https://www.asa.org.uk/news/bill-ieve-it-or-not-making-greener-homes-savings-claims-add-up.html)).

**Measurement and verification.** IPMVP Option C compares whole-building metered use before and after, adjusted by a regression on weather (usually degree days). ASHRAE Guideline 14 baseline fit criteria commonly cited: CV(RMSE) under 25 % and NMBE within 0.5 % for hourly-ish models, savings stated within ±50 % at 68 % confidence ([LBNL guidance](https://buildings.lbl.gov/sites/default/files/LBNL%20Guidance%20on%20M%26V%202.0%20savings%20claims%202019-06-30.pdf)). Radiate cannot do Option C at install: the reference house has no pre-Radiate burner record, and oil deliveries are lumpy. [degreedays.net](https://www.degreedays.net/calculate-energy-savings) describes the regression and its pitfalls.

### Options compared

| Method | Honest? | Explainable? | Available when |
|---|---|---|---|
| Pre/post degree-day regression (Option C) | Yes, measured | Yes | Only with a heating season of pre-Radiate fuel data |
| Simulate a baseline policy through the learned room models | Depends on the model; first-order independent rooms ignore heat flowing between rooms, which is exactly what makes per-room setback underdeliver | Hard | After models are confident |
| Measured temperatures plus a fitted house heat signature (below) | Yes if the baseline is conservative | One sentence | After about 2 to 3 weeks of complete days |

### Recommendation: the "degree-hours" method

Heat loss is proportional to how much warmer the house is than outside. Radiate measures every room's temperature and the outdoor temperature, so it can measure that directly instead of modelling it.

1. **Each tick, per room** (pure core, in the ledger): add `max(0, T_r − T_out) × dt` to the room's actual degree-hours, and `max(0, B_r(t) − T_out) × dt` to its baseline degree-hours, where `B_r(t) = max(T_r, baseline setpoint)` while the baseline's timer is on and `B_r(t) = T_r` otherwise. The baseline is therefore never colder than what actually happened, so neighbouring-room warmth, fire, Aga and sun are already in both sides, and the saving can only come from hours Radiate kept a room cooler than the baseline would have.
2. **Weight rooms** into house degree-hours. Without room areas or radiator outputs, use `w_r = b_r / a_r` (the share of the room's radiator output needed per kelvin), normalised, falling back to equal weights until models are confident. Unverified: test in the simulator.
3. **Fit the house signature** daily (pure core): `litres_d = k × DH_actual_d + c`, robust linear fit over complete (non-partial) days of the last 60 days, c absorbing hot water and standing losses. Publish savings only when there are at least 14 complete days and the fit's CV(RMSE) is under 25 %; otherwise say "still learning". Show the fit quality in a details panel.
4. **Saving** for a day: `k × (DH_baseline − DH_actual)` litres; money is litres times the oil price that was set on that day (store the price with the day so a later change does not rewrite history).

**Default baseline**: "a timer and ordinary TRVs: every heated room at 19 °C (the household's in-use temperature) from the first person up to the last in bed, every day, including days everyone is away". It is what a UK household with a programmer would plausibly run, it is computed from the household's own routines, and it is stated on screen. Offer no second, more flattering baseline in the MVP.

**One sentence for the UI**: "This house uses about 0.9 litres of oil for every 100 degree-hours it is kept above outside; Radiate kept your rooms 420 degree-hours cooler this week than a timer and 19 °C TRVs would have, which is about 3.8 litres."

**Honesty rules**:
- Always show comfort next to savings (existing `comfort_minutes_below`, as minutes a room in use was more than 1 K below target, PreHeat's MissTime). A saving bought by cold rooms is not a saving.
- Show negative days as negative; never clamp at zero.
- Litres are from relay time until burner firing is measured, so `k` is inflated by the same factor on both sides; the percentage is sound but absolute litres are high. Label it, and switch to firing time when relay power is wired (spec open question 1).
- No savings for partial days, the first 14 days, or days without an outdoor reading (the 5 °C default must not feed a saving).
- Phrase as "estimated" and "about"; never "up to".
- Validate in the simulator before shipping: run the same simulated weeks under Radiate and under the baseline policy, and check the estimator against the simulated true difference. Then check against an oil tank reading over a winter (Option C style, deferred).

**Where it lives**: degree-hour accumulation and the fit in a new pure `core/savings.py`, called from the ledger; baseline setpoint timeline from `radiate.config.household` (compile with the baseline rule) passed in by the driver; oil price as a runtime setting (`/api/v1/settings`); `GET /api/v1/savings` and daily Elastic fields (`savings.litres`, `savings.dh_actual`, `savings.dh_baseline`, `savings.fit_cvrmse`); radiate-ha gets a "saved this month" sensor later. State: per day, per room actual and baseline degree-hours, litres, partial flag, price; about 2 years of days (matches learning memory), a few kilobytes.

**Per-room contribution** comes free: room r saved `k × w_r × (DH_baseline_r − DH_actual_r)`. It is an attribution, not a measurement; label it so.

## 4. Showing savings

### Findings and recommendation

- **Main chart**: one bar per day (or per week, switchable), actual litres as a solid bar, the baseline as an outlined bar behind it on the same zero-based axis. The gap is the saving. Litres by default, £ when an oil price is set. Partial and "still learning" days drawn as empty slots with a label, not zero.
- **Headline**: a sentence, not a gauge: "About 14 litres (£11) saved since 1 November, with rooms in use warm 98 % of the time." The sentence carries the number for people who skip charts.
- **Cumulative line** of litres saved since savings started, on a separate small chart (do not mix axes). Starts at the first eligible day, not at install.
- **Per room**: a horizontal bar list of each room's share of the saving this month, sorted, with negative values shown left of zero. Link each to its suggestions.
- **Avoid**: truncated axes; area under a baseline that looks like spending; "up to" or "% saved" without the baseline named; projecting annual savings from a cold week; colour as the only difference between actual and baseline; animating numbers counting up.
- **Accessibility**: follow the [WAI complex images](https://www.w3.org/WAI/tutorials/images/complex/) pattern: a short text alternative naming the chart and trend, plus a "Show as table" toggle with the same data. Graphical objects at 3:1 contrast ([WCAG 1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)); outline versus fill, not colour alone, for baseline versus actual. Bars focusable by keyboard with the same tooltip text; tooltips readable on touch. Respect `prefers-reduced-motion`. Use the plant-room look and design tokens in `docs/standards/design.md`.

## Proposed MVP

**Rooms heated only when used**
1. Room activity input (`POST /api/v1/rooms/{id}/activity`) and radiate-ha mapping HA areas to rooms (lights, media players, motion or occupancy sensors, chosen entities).
2. Pure usage log and 14-day usage summary per room and day type, with unknown kept separate from idle.
3. Two new suggestions: "scheduled warm but unused" and "used outside its warm periods", each with evidence, estimated litres and £, Apply as a use level change or room adjustment, Not now, Don't suggest; never below `damp_below_c`.
4. Keep TRV knob turns as an override and as activity (after a pilot-valve test).

**Savings graph**
5. Oil price setting.
6. Degree-hour accumulation, default baseline from the household, house signature fit with a quality gate, `GET /api/v1/savings`, Elastic fields.
7. Savings section: headline sentence, daily or weekly actual against baseline bars, comfort beside it, table view.
8. Simulator check of the estimator against simulated truth before release.

**Defer**: PreHeat-style live occupancy prediction; reactive heating on activity; Bermuda or ESPresense specific handling (it arrives through the generic activity input anyway); inferred occupancy from humidity and temperature residuals beyond logging them for evaluation; CO2; a choice of baselines; Option C pre/post checks against oil deliveries; per-room savings beyond a ranked list; firing-time accounting (blocked on relay power wiring).

**Open questions for the owner**: whether the default baseline (19 °C, first up to last in bed, every day) is fair for this household; whether savings should include away days (a timer would have heated them, so they are real savings but feel generous); how long Not now should snooze.
