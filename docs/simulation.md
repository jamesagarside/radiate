# Simulation findings

November 2026. Simulator: `src/radiate/sim` (spec section 11). Reproduce with `radiate sim` or the tests in `tests/sim`.

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
| Comfort deficit (K·h below setpoint − 0.5 K, occupied) | 314.9 | 17.9 |
| Worst arrival after occupancy starts (min) | 330 (never) | 120 |
| Relay starts | 71 | 14 |
| Mean relay burn (min) | 28 | 174 |
| Minimum burn violations | 15 | 0 |
| Minimum off violations | 37 | 0 |
| Physical burner starts | 117 | 114 |
| Burner hours | 22.9 | 25.8 |

Notes on reading this table:

- **Comfort is the big win, mostly from optimum start.** Smart TRVs start heating at the scheduled time and the slow rooms never catch up. Radiate starts each room early, from its learned warm-up rate.
- **Radiate burns more oil here (+13 %),** because it actually heats the house to setpoint. This is a comfort result, not a saving. Savings claims need the real house.
- **Relay starts fall by 80 % and burns are six times longer,** and the oil-burner guards are never violated.
- **Physical burner starts are about the same.** The oversized boiler's own thermostat still cycles the burner inside long heating calls. Cutting real burner cycling needs a burner-firing signal (spec open question 1) so Radiate can keep enough radiators open during a burn. This is the next optimisation target.
- The smart-TRV baseline's arrival spread is not meaningful: its rooms mostly never reach setpoint within the window, so every room scores the same.

## What flow balancing adds on its own

Radiate with balancing on against the same Radiate with every heating valve fully open (`HouseConfig.balancing = False`):

| Scenario | Arrival spread (min) | Comfort deficit (K·h) | Bedroom 3 deficit (K·h) |
|---|---|---|---|
| Mild, normal pump, optimum start | 65 → 35 | 16 → 18 | 5 → 5 |
| Cold, small pump, everyone calls at once | 135 → 110 | 301 → 291 | 67 → 66 |

**Finding:** balancing makes rooms arrive together but barely speeds up the slowest room in this house. With a TRV on every radiator, near rooms satisfy quickly and close, handing their flow to the far rooms anyway, so the house partly balances itself over time. Throttling mainly delays the fast rooms. By hand, throttling the four near radiators raises flow to the far bedroom by about 40 %, but in practice the rooms overlap for too short a time to matter.

Consequences:

1. The headline value for this house is optimum start, oil-safe boiler pooling and disturbance-aware learning. Flow balancing is a secondary feature, which also lowers the patent exposure noted in `docs/research/provenance.md`.
2. Balancing should matter more on cold days with an undersized system, with lower flow temperatures, and in houses without a TRV on every radiator. Collect real data before investing more in it.
3. The allocator is deadline-aware (spec 4.4): preheating rooms are throttled only as far as still gets them there on time.

## Failure tests

- **Crash:** Radiate stops at midday during setback. TRVs pick up their mirrored on-device schedules and the Shelly watchdog runs the boiler. Comfort degrades to about the smart-TRV level (within 10 %), with no guard violations.
- **Fire:** five fire evenings in a row leave the lounge's learned heating gain within 35 % and loss rate within 0.03 /h of a no-fire run. With no fires, fewer than 2 hours are falsely flagged over 3 days.

## Bugs the simulator caught

- Heat-sink rooms kept the burner on forever after demand ended.
- A preheating room was paced to a slow reactive room and would have been late.
- A crash during setback left every room at 16 °C all evening: fixed by mirroring schedules into the TRVs.
- Morning warm-up looked like an open fire: fire detection now needs the radiator off for 30 minutes or a confident model.
