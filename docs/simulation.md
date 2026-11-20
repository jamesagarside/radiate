# Simulation findings

November 2026. Simulator: `src/radiate/sim` (spec section 11). Reproduce with `radiate sim --days 5 --seed N` for seeds 1 to 3 (add `--demand-mode comfort` for the comfort figures), or the tests in `tests/sim`.

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
