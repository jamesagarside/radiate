# Simulation findings

November 2026. Simulator: `src/radiate/sim` (spec section 11). Reproduce with `radiate sim --days 5 --seed N` for seeds 1 to 3 (add `--demand-mode comfort` for the comfort figures), or the tests in `tests/sim`. [Room use in eco](#room-use-in-eco) has its own command, `radiate sim-efficiency`.

The first table, [eco and comfort demand modes](#eco-and-comfort-demand-modes) and [learning memory and change detection](#learning-memory-and-change-detection) were run on 20 November 2026, with the two-year learning memory and the `eco` demand mode as defaults. The balancing and valve tables were run on 19 November 2026 at commit `925b7a1`, before those changes, and have not been rerun. `tests/sim` passes.

The simulator is a plausible model of the reference house, not a measurement of it. Treat these results as a check on the algorithm's direction, and expect the real house to differ. The first real-world check is the reference install.

## Setup

- 9 rooms from `src/radiate/sim/reference.py`; far bedrooms flow-starved when every valve is open.
- Schedule: 20 to 21 °C from 06:30 to 08:30 and from 17:00 to 22:30, 16 °C setback otherwise. Outdoor 1 to 7 °C.
- Open fire in the lounge four evenings out of seven, Aga always on, two showers each morning, cooking at 17:30.
- 13 kW on/off boiler with its own 70 to 82 °C thermostat, store with hot-water priority.
- **Baseline: smart TRVs with no balancing.** Every TRV fully open on its own schedule and internal sensor; boiler fires whenever any TRV calls; no minimum burn or off time. This is roughly what per-room integrations such as Versatile Thermostat or Better Thermostat provide.
- 5 simulated days, the first 2 for learning, 3 measured. Mean of seeds 1 to 3.

## Radiate against smart TRVs

| Metric | Smart TRVs | Radiate |
|---|---|---|
| Comfort deficit (K·h below setpoint − 0.5 K, occupied) | 314.9 | 20.9 |
| Worst arrival after occupancy starts (min) | 330 (never) | 120 |
| Relay starts | 71 | 10 |
| Mean relay burn (min) | 28 | 223 |
| Minimum burn violations | 15 | 0 |
| Minimum off violations | 37 | 0 |
| Physical burner starts | 117 | 98 |
| Burner hours | 22.9 | 24.7 |
| Relay time with no TRV open | 0 % | 0 % |

Notes on reading this table:

- **Comfort is the big win, mostly from optimum start.** Smart TRVs start heating at the scheduled time and the slow rooms never catch up. Radiate starts each room early, from its learned warm-up rate.
- **Radiate burns more oil here (+8 %),** because it actually heats the house to setpoint. This is a comfort result, not a saving. Savings claims need the real house.
- **Relay starts fall by 86 % and burns are eight times longer,** and the oil-burner guards are never violated.
- **Physical burner starts fall by 16 %.** The oversized boiler's own thermostat still cycles the burner inside long heating calls. Cutting real burner cycling needs a burner-firing signal (spec open question 1) so Radiate can keep enough radiators open during a burn. This is the next optimisation target.
- The smart-TRV baseline's arrival spread is not meaningful: its rooms mostly never reach setpoint within the window, so every room scores the same.

## Eco and comfort demand modes

Spec 5.3. `comfort` fires the boiler as soon as any calling room is 0.5 K below its target. `eco`, the default, waits until the calling rooms between them need 12 minutes of full radiator output, or one room is 1.5 K below its target. Mean of seeds 1 to 3. "Before" is the code before this revision: the comfort rule with the 33-hour learning memory. The other two columns use the two-year memory.

Mild days (the setup above):

| Metric | Before | Comfort | Eco |
|---|---|---|---|
| Comfort deficit, house (K·h) | 19.6 | 22.0 | 20.9 |
| Comfort deficit, toilet (K·h) | 0.04 | 0.07 | 0.06 |
| Relay starts | 11.3 | 12.3 | 10.0 |
| Mean relay burn (min) | 196 | 179 | 223 |
| Physical burner starts | 100 | 97 | 98 |
| Burner hours | 24.7 | 24.8 | 24.7 |
| Median arrival spread (min) | 38 | 22 | 25 |
| Guard violations | 0 | 0 | 0 |
| Relay time with no TRV open | 0 % | 0 % | 0 % |

Cold days with a small pump and no optimum start (outdoor −5 to 1 °C, `pump_qmax=0.15`), where everyone calls at once:

| Metric | Before | Comfort | Eco |
|---|---|---|---|
| Comfort deficit, house (K·h) | 285.1 | 284.1 | 297.3 |
| Comfort deficit, toilet (K·h) | 6.0 | 6.2 | 7.1 |
| Relay starts | 19.3 | 18.3 | 17.0 |
| Mean relay burn (min) | 159 | 171 | 180 |
| Physical burner starts | 150 | 151 | 147 |
| Burner hours | 32.3 | 32.3 | 32.1 |
| Median arrival spread (min) | 97 | 82 | 73 |
| Guard violations | 0 | 0 | 0 |
| Relay time with no TRV open | 0 % | 0 % | 0 % |

What eco does:

- **Fewer relay starts and longer burns.** Against comfort, relay starts fall by 19 % on mild days and 7 % on cold days, and mean burns are 25 % and 5 % longer. The starts that go are mostly the toilet firing the boiler on its own at night; in eco it waits and joins the next optimum start, or fires alone at 1.5 K below.
- **Burner starts and oil barely change.** The boiler's own thermostat sets most physical burner starts inside long calls (spec open question 1), and the house needs the same heat.
- **What it costs.** On mild days, nothing measurable: the house deficit is 1.1 K·h lower than comfort, well within the spread between seeds (19.9 to 25.7 K·h for comfort). On cold days with an undersized pump, the house deficit rises by 13 K·h (5 %) and the toilet's by 0.9 K·h, because rooms that would have fired the boiler alone now wait for others.

An eco variant that also kept the predicted-burn rule (fire when the slowest calling room would need 12 minutes) cut no relay starts on mild days, so eco drops it. Eco limits of 1 K and 2 K gave 10.7 and 11.0 relay starts and house deficits of 21.0 and 24.2 K·h, so the default stays 1.5 K.

## Room use in eco

Spec 5.8, [efficiency plan slice 6](plans/efficiency-mvp.md#slice-6-simulator-comparison-and-estimator-check). Run on 24 November 2026 at commit `d8c1f43`:

```
uv run radiate sim-efficiency --days 24 --warmup 3 --seeds 1,2,3 --scenarios fixed,mild,cold,owner,owner_cold
```

The plan's command is the same with `--scenarios fixed,mild,cold`. 24 days, the first 3 for learning, 21 measured, mean of seeds 1 to 3. The full tables, with the lowest and highest seed for every figure, are printed by the command; the main figures are below.

**Scenarios.**

- `fixed`: the original reference schedule (20 to 21 °C mornings and evenings, 16 °C otherwise), outdoor mean 4 °C. No room use, so `eco` and `eco+use` must match exactly; they do.
- `mild`: the reference household (`sim.reference.reference_household`): a bedroom used getting up and at bedtime, an office used in weekday working hours, the dining room and kitchen used while people are home, the bathroom occasional, Bedroom 2, the lounge and the toilet unused; 18 °C in use, 16 °C occasional, 14 °C unused and overnight. Each day's outdoor mean is 4 °C ± 3 K, drawn from the seed.
- `cold`: the same at −2 °C ± 3 K with the small pump (`pump_qmax=0.15`), optimum start on.
- `owner` and `owner_cold`: hand-written schedules with `rooms[].use`, as close to the owner's house as the simulator allows (`sim.reference.OWNER_SCHEDULES`): the office (Bedroom 3) in use 08:00 to 17:30 on weekdays and unused at weekends; Bedroom 1 in use 06:00 to 08:30 and 21:30 to 22:30 at 18 °C; dining room and kitchen in use 06:30 to 09:00 and 17:00 to 22:00 at 18 °C; lounge, Bedroom 2 and toilet unused at 14 °C; 14 °C overnight everywhere. The bathroom's use isn't known, so it is occasional at 16 °C mornings and evenings. The stairs has no TRV. Their savings baseline is Radiate's for hand-written rooms (spec 5.9). The simulated rooms keep their own sizes, radiators, the lounge fire and the range cooker.

**Policies.** `eco` is today's default with room use off. `eco+use` is the same with room use in the snapshot. `comfort` is the comfort demand mode. `timer` is the savings baseline as a house: the relay on for the whole timer window (for the household, first person up less 30 minutes to last in bed, 06:00 to 22:30 on weekdays; for the owner-like house, the earliest warm period to the latest, 06:00 to 22:30) and each TRV on its own sensor at the room's usual temperature, frost outside the window.

**Measures.** Oil from burner firing is burner hours × 1.64 l/h, the simulated truth; oil from relay time is what Radiate counts today (spec 5.6). The warm-period deficit is K·min below the setpoint while a room is in use or occasional, with no tolerance. The comfort deficit is the older measure, K·h below setpoint − 0.5 K in the same periods, rooms without a heat source. Lowest room and minutes below 12 °C use the true air temperature of the TRV rooms; Radiate acts on the sensor reading.

| Scenario | Policy | Oil, firing (l) | Oil, relay (l) | Relay starts | Burner starts | Warm-period deficit (K·min) | Comfort deficit (K·h) | Lowest room (°C) | Room-minutes below 12 °C |
|---|---|---|---|---|---|---|---|---|---|
| fixed | eco | 290.6 | 422.7 | 77 | 673 | 22111 | 159.2 | 15.2 | 0 |
| fixed | eco+use | 290.6 | 422.7 | 77 | 673 | 22111 | 159.2 | 15.2 | 0 |
| mild | eco | 252.2 | 426.6 | 124 | 806 | 2289 | 8.0 | 13.0 | 0 |
| mild | eco+use | 247.9 (−1.7 %) | 417.8 | 115 | 795 | 2463 (+7.6 %) | 8.0 | 11.8 | 926 |
| mild | comfort | 253.0 | 427.7 | 134 | 807 | 2261 | 8.7 | 13.3 | 0 |
| mild | timer | 235.0 | 548.6 | 21 | 891 | 54264 | 658.6 | 8.4 | 27471 |
| cold | eco | 352.7 | 638.8 | 130 | 1224 | 10000 | 92.5 | 13.1 | 0 |
| cold | eco+use | 343.2 (−2.7 %) | 581.7 | 107 | 1082 | 10535 (+5.4 %) | 91.8 | 11.7 | 1745 |
| cold | comfort | 353.9 | 641.2 | 141 | 1236 | 9739 | 90.3 | 13.3 | 0 |
| cold | timer | 302.3 | 548.6 | 21 | 924 | 105026 | 1387.5 | 5.4 | 68263 |
| owner | eco | 254.5 | 434.3 | 121 | 828 | 2416 | 8.5 | 13.0 | 0 |
| owner | eco+use | 246.6 (−3.1 %) | 406.0 | 113 | 772 | 2503 (+3.6 %) | 6.8 | 11.7 | 882 |
| owner | comfort | 255.1 | 431.2 | 129 | 828 | 2169 | 7.3 | 13.4 | 0 |
| owner | timer | 235.8 | 568.3 | 21 | 903 | 66045 | 851.4 | 8.6 | 26022 |
| owner_cold | eco | 353.5 | 637.9 | 137 | 1245 | 12404 | 114.9 | 13.0 | 0 |
| owner_cold | eco+use | 343.4 (−2.8 %) | 579.2 | 107 | 1085 | 13440 (+8.3 %) | 120.9 | 11.7 | 1626 |
| owner_cold | comfort | 354.4 | 642.4 | 147 | 1259 | 12236 | 112.9 | 13.3 | 0 |
| owner_cold | timer | 304.1 | 568.3 | 21 | 935 | 124687 | 1690.2 | 6.1 | 65935 |

Guard violations were 0 in every run, and relay time with no TRV open was 0 for every Radiate policy.

**Against the acceptance checks** (eco+use against eco):

- **Oil: passes.** 1.7 % less burner oil on mild days and 2.7 % on cold days with the household; 3.1 % and 2.8 % with the owner-like schedules. That is 0.2 to 0.5 litres a day here. Relay litres fall by 2 to 9 %. Inside the research estimate of 1 to 3 % (spec 5.8), and above the plan's 1 % bar.
- **Comfort in rooms in use: passes, narrowly.** The warm-period deficit rises 3.6 to 8.3 %, under the 10 % tolerance. On the older measure (below setpoint − 0.5 K) it is level or better except `owner_cold` (+5 %). Seed spread is wide: on mild days eco's own deficit runs from 1860 to 2692 K·min across seeds.
- **Relay starts: pass.** They fall 6 to 22 %; burner starts fall 1 to 13 %.
- **Damp floor: fails on the true air temperature.** No room's reading waits below 12 °C, but the air goes below it while the burn a setback room starts at its floor gets going: the lowest was 11.63 °C (Bedroom 2, `owner_cold`), and 42 to 83 room-minutes a day are below 12 °C, at most 0.37 K below. Radiate starts the burn when the reading passes 12 °C; the valve lead, the radiator's arrival lag and any minimum off time follow. On mild days it stays within the plan's 0.3 K slack; on cold days it does not.

**What was tuned: the optimum start horizon for rooms with room use.** With the plan's rules alone, the warm-period deficit rose 18 to 34 % against eco. Most of it came at the start of warm periods (the office at 08:00, Bedroom 1 at 22:00): a room set back to near 12 °C needs more than optimum start's 3-hour horizon to reach 18 °C, so it arrived late. Rooms with room use in `eco` now look ahead up to 3.25 hours (`PREHEAT_USE_MAX_S`); rooms without room use and `comfort` keep 3 hours. Mean of seeds, eco+use against eco:

| Horizon | mild: oil, deficit, relay starts | cold | owner | owner_cold |
|---|---|---|---|---|
| 3 h (plan) | −1.5 %, +33.7 %, 110 | −3.0 %, +22.1 %, 102 | −3.1 %, +21.0 %, 105 | −2.9 %, +18.1 %, 99 |
| 3.25 h (chosen) | −1.7 %, +7.6 %, 115 | −2.7 %, +5.4 %, 107 | −3.1 %, +3.6 %, 113 | −2.8 %, +8.3 %, 107 |
| 3.5 h | −1.4 %, −4.7 %, 117 | −2.6 %, +0.2 %, 94 | −2.8 %, −6.2 %, 126 | −2.6 %, −6.9 %, 110 |
| 4 h | −1.2 %, −12.7 %, 121 | −1.9 %, −26.2 %, 109 | −2.5 %, −14.3 %, 141 | −2.0 %, −31.9 %, 110 |

Eco's relay starts for comparison: 124, 130, 121 and 137. Beyond 3.25 hours the owner-like house starts more burns than eco: preheats for rooms with different warm periods start at different times instead of together. The result is sensitive to this one number, which is a sign that the real fix is arrival-tuned optimum start (spec 5.8, not yet implemented).

Tried and not taken:

- A preheat margin of 1.5 or 1.8 in place of 1.2 changed nothing: the 3-hour cap, not the margin, made rooms late.
- Counting setback rooms in pooled demand raised relay starts from 48 to 135 in a 12-day run, since they could start burns they couldn't keep.
- Leaving setback rooms out of burns for other rooms (no "taking heat") made comfort slightly worse, as the rooms sat colder.
- **A damp floor margin** (a setback room starts a burn 0.3 K above the floor) keeps the air at or above 11.94 °C, but the mild-day oil saving falls from 1.7 % to 0.5 % and owner-like relay starts rise above eco's. 0.5 K keeps it above 12.1 °C and leaves almost no mild-day saving. Starting the floor burn early by the room's predicted fall over the valve lead and arrival lag didn't keep it above 12 °C either. Left at the spec's rule; the owner decides whether the margin is worth its cost.

**The timer baseline.** It uses less burner oil than Radiate here, because its TRVs read their own sensor beside the radiator and shut early: its rooms in use sit far below setpoint (54 000 to 66 000 K·min against about 2 400 on mild days). It is the savings baseline's definition, not a comfort-equivalent house, so it says nothing about whether Radiate saves oil against a well-set timer. Its relay time is longer, so relay litres, which is what Radiate's savings figures will use, are 31 % (household) and 40 % (owner-like) higher than eco+use on mild days. The estimator check against it is not run yet: slice 3 merged while this was built, and `sim.compare.estimator_check` is the hook, printing the true relay-litre difference for now. With a cold house the true difference is negative.

**Before it goes live.** Slice 2 changes when the boiler fires. It needs the owner's go-ahead, then a few days in dry run on the real house reading `demand.setback` and `demand.floor` in the decision log.

## Learning memory and change detection

Spec 4.3. The default memory is 730 days of learning, with change detection to follow real changes.

**A long memory holds the models steadier.** Replaying 36 days of simulator inputs through each room model, with nothing changing in the house, the median room's heating gain stayed within a range of 2 % of its value with the two-year memory (12 % at worst, the kitchen), against 11 % (36 % at worst) with the old 33-hour memory. Change detection never fired in those runs, nor in the 5-day runs on seeds 1 to 3. In the cold scenario it fired once, for the lounge on one seed, which only means that model adapted faster for a day.

**What it costs in a short run.** Starting from priors, a long memory keeps the first days in the model, and the 5-day comfort deficit rises from 19.6 to 22.0 K·h in comfort mode (seeds 1 to 3 range 16 to 26 K·h either way). Over 10 days, measuring the last 3, it was 20.6 against 22.4 K·h. Memories of 7 and 30 days gave 20.8 and 22.4 K·h. The real house runs for months, so its first days weigh less there.

**Change detection follows a real change.** A radiator's output changes on day 4 of 10 (`run(radiator_output={room: (time_s, share)})`); "settled" is when the heating gain stays within 15 % of what a run with the change from the start learns. Seeds 1 and 2:

| Change | With change detection | Without |
|---|---|---|
| Bedroom 1 radiator at half output | re-learned at day 4.3 to 4.4, settled by day 5.0 to 5.1 | never settled by day 10 |
| Dining radiator at half output | seed 1: re-learned at day 4.2, settled by day 4.6. Seed 2: not detected, 23 % off at day 10 | never settled |
| Bedroom 3 radiator at 60 % output | re-learned at day 4.9, settled by day 5.1 to 5.8 | never settled |
| Bedroom 1 radiator at 160 % output (bled) | re-learned at day 4.7, settled by day 4.7 to 5.0 | settled by day 8.6 to 9.1 |

Without detection, these models had only 4 days of history; after months of history they would move even more slowly. In a synthetic test (`tests/core/test_estimator.py`), a model with 30 days of learning notices a 40 % drop in heating gain after 8 hours of learning and is within 15 % of the new value an hour later. The same model without detection is still more than 40 % off a day later.

## What flow balancing adds on its own

Radiate with balancing on against the same Radiate with every heating valve fully open (`HouseConfig.balancing = False`):

| Scenario | Arrival spread (min) | Comfort deficit (K·h) | Bedroom 3 deficit (K·h) |
|---|---|---|---|
| Mild, normal pump, optimum start | 47 → 38 | 19 → 20 | 7 → 6 |
| Cold, small pump, everyone calls at once | 127 → 97 | 288 → 285 | 66 → 65 |

**Finding:** balancing makes rooms arrive together but barely speeds up the slowest room in this house. With a TRV on every radiator, near rooms satisfy quickly and close, handing their flow to the far rooms anyway, so the house partly balances itself over time. Throttling mainly delays the fast rooms. By hand, throttling the four near radiators raises flow to the far bedroom by about 40 %, but in practice the rooms overlap for too short a time to matter.

Consequences:

1. The headline value for this house is optimum start, oil-safe boiler pooling and disturbance-aware learning. Flow balancing is a secondary feature, which also lowers the patent exposure noted in `docs/research/provenance.md`.
2. Balancing should matter more on cold days with an undersized system, with lower flow temperatures, and in houses without a TRV on every radiator. Collect real data before investing more in it.
3. The allocator is deadline-aware (spec 4.4): preheating rooms are throttled only as far as still gets them there on time.

## Valves that stay shut

`radiate sim` reports relay time with no TRV open, when only the stairs bypass takes the burner's heat, and `tests/sim` checks it stays under 1 %. Simulation showed two causes, both fixed in November 2026:

- **The toilet's TRV setpoint was in the wrong frame.** Radiate judged the toilet as its TRV reading − 1.5 K and called, but sent the TRV the target + 0.6 K, which it compared with its own raw reading, so it stayed shut. About a third of burns started for the toilet alone. The setpoint now goes out as target − bias (spec 4.5).
- **Heat sinks and top-ups sat inside the TRV's hysteresis.** A heat sink is often already above its top-up target, so its TRV saw no reason to open. The setpoint is now at least the reading + 1 K, rounded up.

Before and after, mean of seeds 1 to 3:

| Metric | Mild, before | Mild, after | Cold, small pump, before | Cold, small pump, after |
|---|---|---|---|---|
| Relay time with no TRV open | 4.2 % (105 min) | 0 % | 0.4 % (13 min) | 0 % |
| Comfort deficit (K·h) | 18.8 | 19.6 | 292.9 | 285.1 |
| Toilet comfort deficit (K·h) | 2.3 | 0.0 | 19.4 | 6.0 |
| Overheat (K·h above setpoint + 1.5 K, occupied) | 0.0 | 0.0 | 0.0 | 0.0 |
| Relay starts | 14.0 | 11.3 | 13.3 | 19.3 |
| Mean relay burn (min) | 178 | 196 | 258 | 159 |
| Physical burner starts | 114 | 100 | 165 | 150 |
| Burner hours | 25.9 | 24.7 | 32.6 | 32.3 |

The mild comfort deficit rises by 0.8 K·h (4 %), mostly in the bedrooms. The likely cause is that the toilet's false calls used to keep the burner on longer, and some of that heat reached the bedrooms. The guards hold in every run.

With the fix, the no-heat check stopped counting a top-up room (a heat sink or burn extension) as an open valve. It is opened briefly, often at the 20 % floor, and may warm too little to show heat. Without that change, a run with a seized valve raised a false no-heat alert at night.

### Internal-sensor rooms and the TRV bias

The toilet now gets warmer than before, because its TRV really opens. Mean toilet temperature against its setpoint:

| Period | Before | After |
|---|---|---|
| Occupied (18 °C) | −0.2 K | +0.5 K |
| Setback (16 °C) | +0.6 K | +1.2 K |

Some of the setback figure is the warm kitchen next door: the toilet sat above setback before Radiate ever opened its valve. It never goes more than 1.5 K above its setpoint while occupied.

Spec 4.6 planned to refine the −1.5 K bias once the radiator has been off for 2 hours, so the room does not overheat by the bias. With a cold radiator the TRV reads the room, so the observed offset is about 0 K; a warm radiator lifts the reading by 2 to 3 K in simulation. One bias cannot match both. Variants tried:

| Bias in use | Toilet, occupied | Toilet deficit (K·h) | House comfort deficit (K·h) |
|---|---|---|---|
| −1.5 K, fixed (kept) | +0.5 K | 0.0 | 19.6 |
| 0 K (refined to the cold offset) | −0.8 K | 7.9 | 29.3 |
| −1.5 K, released as soon as the radiator closes | +0.2 K | 1.6 | 23.7 |
| −1.5 K, fading over 30 min after the radiator closes | 0.0 K | 2.8 | 23.0 |
| −1.5 K, fading over 60 min | −0.1 K | 2.7 | 28.5 |

Every variant left the toilet short of heat and raised the house comfort deficit, so the bias stays fixed. Learning it properly needs a reference reading, such as a temporary room sensor in the toilet.

## Failure tests

- **Crash:** Radiate stops at midday during setback. TRVs pick up their mirrored on-device schedules and the Shelly watchdog runs the boiler. Comfort degrades to about the smart-TRV level (within 10 %), with no guard violations.
- **Fire:** five fire evenings in a row leave the lounge's learned heating gain within 35 % and loss rate within 0.03 /h of a no-fire run. With no fires, fewer than 2 hours are falsely flagged over 3 days.
- **Watchdog hand-back:** the simulated watchdog follows the Shelly script (takes over 10 minutes after the last heartbeat, with its own minimum burn and off). Radiate comes back from a crash 3 minutes into a watchdog burn, or 3 minutes after one ended, or from a Zigbee outage in safe mode, morning and evening. No guard violations over seeds 1 to 3. Without adoption, the same runs cut a burn to 3 minutes or restarted the burner 2 to 3 minutes after it stopped.
- **Leaking valve:** the dining valve lets 20 % of its full flow past when shut (`run(leaking_valves=...)`). Radiate flags it within three days on seeds 1 to 3: after 0.9, 2.9 and 1.9 days. With the 33-hour learning memory it took 0.7 to 0.9 days. The check counts 2 of the last 5 burns in which the dining valve stays shut while others heat, and which burns those are depends on the whole closed loop, including when optimum start begins each room.

### Tuning the leak check

The simulated TRV reads the room plus 5 % of the radiator water's lead over it, so a warm radiator lifts it by about 2.5 K. The largest rise of a shut valve's TRV against the room in any one burn:

| Case | Largest rise in a burn |
|---|---|
| Healthy valves, seeds 1 to 3 and the cold scenario | 0.3 K |
| Dining valve passing 5 % | 0.9 K |
| Dining valve passing 10 % | 1.2 K |
| Dining valve passing 20 % | 1.8 K |
| Bedroom 2 valve passing 20 % | 0.3 K |

The check flags 1 K. A leak does not show in every burn: in the morning many valves share the flow and the leak passes less, so the check counts 2 burns out of the last 5 rather than 2 in a row, and clears only after 5 cool burns. The far bedrooms are on long pipe runs, so their leaks pass too little water to detect. A strong leak also raises `unexplained_heat`; the check still runs then, because it compares the TRV with the room and sun or guests warm both. The real TRVZB also picks up heat conducted up the valve body, which the simulator does not model: check the threshold on the pilot valve.

## Bugs the simulator caught

- Heat-sink rooms kept the burner on forever after demand ended.
- A preheating room was paced to a slow reactive room and would have been late.
- A crash during setback left every room at 16 °C all evening: fixed by mirroring schedules into the TRVs.
- Morning warm-up looked like an open fire: fire detection now needs the radiator off for 30 minutes or a confident model.
