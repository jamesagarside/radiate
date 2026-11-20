# Simulation findings

November 2026. Simulator: `src/radiate/sim` (spec section 11). Reproduce with `radiate sim --days 5 --seed N` for seeds 1 to 3, or the tests in `tests/sim`.

Last run on 19 November 2026 at commit `925b7a1`. Every number in the two main tables, and the after columns of the valve table, came out the same as before; `tests/sim` passes.

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
| Comfort deficit (K·h below setpoint − 0.5 K, occupied) | 314.9 | 19.6 |
| Worst arrival after occupancy starts (min) | 330 (never) | 120 |
| Relay starts | 71 | 11 |
| Mean relay burn (min) | 28 | 196 |
| Minimum burn violations | 15 | 0 |
| Minimum off violations | 37 | 0 |
| Physical burner starts | 117 | 100 |
| Burner hours | 22.9 | 24.7 |
| Relay time with no TRV open | 0 % | 0 % |

Notes on reading this table:

- **Comfort is the big win, mostly from optimum start.** Smart TRVs start heating at the scheduled time and the slow rooms never catch up. Radiate starts each room early, from its learned warm-up rate.
- **Radiate burns more oil here (+8 %),** because it actually heats the house to setpoint. This is a comfort result, not a saving. Savings claims need the real house.
- **Relay starts fall by 84 % and burns are seven times longer,** and the oil-burner guards are never violated.
- **Physical burner starts fall by 14 %.** The oversized boiler's own thermostat still cycles the burner inside long heating calls. Cutting real burner cycling needs a burner-firing signal (spec open question 1) so Radiate can keep enough radiators open during a burn. This is the next optimisation target.
- The smart-TRV baseline's arrival spread is not meaningful: its rooms mostly never reach setpoint within the window, so every room scores the same.

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
- **Leaking valve:** the dining valve lets 20 % of its full flow past when shut (`run(leaking_valves=...)`). Radiate flags it within two days on seeds 1 to 3.

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
