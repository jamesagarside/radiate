# ADR-0004: Efficiency by room use, and honest savings

- **Status:** Proposed
- **Date:** 2026-11-23
- **Deciders:** owner (pending), from the design in this change
- **Evidence:** [control efficiency research](../research/control-efficiency.md), [room usage and savings research](../research/usage-and-savings.md), [spec 5.3, 5.8 and 5.9](../spec.md#58-room-use-in-demand), [simulation](../simulation.md#eco-and-comfort-demand-modes), [efficiency plan](../plans/efficiency-mvp.md)

## Context

The owner wants Radiate to be a power-saving system, not a power-using one. Three requirements:

1. Don't fire the whole system because one room is half a degree or a degree below its target. Weight decisions towards how rooms are used, and be lenient before calling the boiler.
2. Don't heat unused rooms, and understand how each room is used so it is heated only when it's needed.
3. Show the household, in a graph, the energy saved because Radiate is efficient, without making the controls any harder.

What exists already:

- The household (`radiate.config.household`) gives each room a use level (in use, occasional, unused) per day type, a room kind and people, and compiles them into warm periods and a weekly schedule. The core only sees the resulting setpoint, so it cannot tell a bedroom at its night temperature from a lounge nobody uses.
- The `eco` demand mode (spec 5.3) pools demand: a room on its own waits until it is 1.5 K below its target or until other rooms need 12 minutes of radiator output between them. Burn extension and heat sinks then put heat into any room, used or not, chosen by how far below target it is.
- The ledger (`radiate.core.accounting`) counts relay hours, relay starts and litres from relay time, which over-counts burner firing because the boiler's own thermostat cycles the burner inside a call.

For a non-condensing on/off oil boiler, fuel follows how warm the rooms are kept and for how long; the way burns are scheduled matters far less ([research, section 0](../research/control-efficiency.md#0-the-physics-that-decides-most-of-this)). So the savings worth having come from keeping unused rooms and unused hours cooler, not from finer boiler timing.

Savings figures in this market are often modelled against a generous baseline and run two to three times higher than measured ones ([research, section 3](../research/usage-and-savings.md#3-measuring-savings-honestly)). A claim the household can't trust is worse than none.

## Options

### A. Leave control alone; add a savings report only

- **Pros:** no risk to the boiler or valves.
- **Cons:** doesn't meet requirements 1 and 2. Unused rooms still fire the boiler on their own and still take top-ups and heat sinks.

### B. A new house-wide "saving" setting with several levels, plus per-room importance sliders

- **Pros:** flexible.
- **Cons:** more knobs for the household, more combinations to test, and no product evidence that sliders help. The household already says how a room is used; asking again in another form is duplication.

### C. Make `eco` use the household's room use, with fixed roles per use, and no new setting

Each tick the runtime tells the core how each room is used right now (in use, occasional, or setback), derived from the household's warm periods and use levels. In `eco`, that decides whether a room can start a burn on its own, how far below its target it waits first, whether it counts towards pooled demand, whether it keeps the burner running, and whether it can take a top-up. Safety floors stay above every rule. `comfort` keeps today's rule as the fallback.

- **Pros:** the household's only choices stay the ones it has (use level per room, and Eco or Comfort). Rooms with no household behave exactly as today, so recorded history replays unchanged. Small, testable change in one function of the core.
- **Cons:** a room the household marks unused gets cooler between burns than its unused temperature, down to the damp floor. That is the point, but it is a behaviour change the owner must accept (spec 12, open question 6).

### D. Occupancy-driven heating from sensors

- **Pros:** follows real use.
- **Cons:** the evidence says per-room occupancy prediction fails on short, random-use rooms and short vacancies save little; the reference house has no room activity sensors yet; and the TRV schedule mirror and the Shelly fallback need a fixed weekly schedule. Better used to correct the household through suggestions, later.

For savings:

### E. Degree-hours against a stated baseline, fitted to measured oil

Each tick, add each room's inside minus outside temperature to its actual degree-hours, and the same for a baseline room temperature to its baseline degree-hours. Fit the house's litres per day against its weighted actual degree-hours over complete days. A day's saving is the fit's slope times the difference.

- **Pros:** measured temperatures, not a simulation; free heat (fire, Aga, sun, neighbours) cancels because the baseline is anchored on the real reading; explainable in one sentence; works from day 15.
- **Cons:** needs an outdoor sensor and a nozzle rating; litres stay an upper bound until burner firing is measured.

### F. Pre and post comparison against oil deliveries

- **Pros:** the measurement-and-verification standard.
- **Cons:** needs a season of fuel records from before Radiate, which this house doesn't have; deliveries are lumpy.

### G. Simulate a baseline policy through the learned room models

- **Pros:** can model any baseline.
- **Cons:** first-order independent rooms ignore heat flowing between rooms, which is exactly what makes per-room setback save less than it seems. Hard to explain.

## Decision

C for control and E for savings, with F kept as a later cross-check.

Control (spec 5.8):

- **Room use** is one of `in_use`, `occasional` or `setback`, worked out by the runtime from the household each tick. `setback` covers an unused room and any room outside its warm periods (overnight, out at work, away). A setpoint override makes the room `in_use`. No household: no room use, and `eco` behaves as today.
- In `eco`, an `in_use` room starts a burn on its own at the eco limit (1.5 K), as today. An `occasional` or `setback` room waits 1 K longer (2.5 K). No rule lets a room wait below the **damp floor** (12 °C) or below its own setpoint when that is lower; frost protection is unchanged.
- A `setback` room doesn't count towards pooled demand and doesn't keep the burner running unless it started the burn itself. It still takes heat from a burn that is running for other rooms, up to its own setpoint.
- Burn extension tops up only rooms that are `in_use` or `occasional` now. Heat sinks prefer, in order, `in_use`, `occasional`, then `setback` rooms; boiler safety still wins, so a setback room is opened when nothing else meets the open path.
- `comfort` is unchanged.

Savings (spec 5.9):

- Baseline: **a heating timer on from the first person up to the last to bed, every day, with each room's valve set to that room's usual temperature for the day**. The household, compiled with everyone at home and no room adjustments, gives both. Shown on screen in one sentence.
- Degree-hours per room, with the baseline room temperature `max(T − lift, baseline setpoint)` while the baseline timer is on and `T − lift` while it is off. `lift` is how much warmer Radiate's own heating has made the room than it would otherwise be, from the learned model, so a day where Radiate heats more than the baseline shows a negative saving.
- Rooms weighted by `b / a`, the radiator time each kelvin needs (the same unit as pooled demand); a Theil-Sen fit of litres against weighted degree-hours over the last 60 complete days; figures only after 14 eligible days and a fit within 25 % CV(RMSE). Comfort shown beside every figure.

Reasons: it meets the owner's three requirements with no new knob, it keeps safety rules above every saving rule, it leaves today's behaviour for houses without a household (and for replays of recorded history), and its savings claim can be stated, checked in the simulator and checked later against oil deliveries.

## Consequences

- Core: `RoomUse`, `RoomInput.use`, `RoomInput.baseline_c`, `Snapshot.baseline`, `BoilerConfig.damp_floor_c` and `DAMP_FLOOR_C` in `radiate.core.types`; the eco rule, the stop rule, burn extension and heat sinks in `radiate.core.decide`; a new pure `radiate.core.savings`; an optional `savings` section in saved engine state.
- Config: the compiled household records each room's warm level per day; a new pure module works out room use and the baseline setpoint.
- Server: the runtime fills room use and the baseline each tick, keeps closed days for two years, and serves `GET /api/v1/savings`. All API changes are additive, so radiate-ha needs no change first (ADR-0003). A Home Assistant "oil saved" sensor is a later radiate-ha change.
- Web: a Savings view with a headline sentence, a daily bar chart against the baseline, comfort beside it and a table view.
- Simulator: a household scenario of the reference house, the timer-and-valves baseline as a controller, and a comparison of today's eco with the new rules.
- `docs/spec.md` 5.3, 5.8, 5.9, 8.1, 8.2, 9, 10, 11 and 12; the glossary; implementation status.
- Harder: `eco` now depends on the household being right. A wrong use level costs comfort in that room until the household is fixed, which is why room usage suggestions are the next step.
- The damp floor becomes a control limit, not only a note in the household setup.

## Revisit if

- The simulator comparison shows the new rules cost more comfort in rooms in use than `eco` does today, or save less than 1 % of oil.
- Burner firing becomes measurable (spec 12, open question 1): litres then come from firing time, and the burn rules may be worth tuning against real burner starts.
- Room activity sensors arrive and usage suggestions show the household's use levels are often wrong.
