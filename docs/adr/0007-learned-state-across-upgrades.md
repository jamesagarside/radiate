# ADR-0007: Learned state survives upgrades, and a release resets only what it knows is wrong

- **Status:** Proposed
- **Date:** 2026-11-24
- **Deciders:** James Garside (owner)
- **Evidence:** [spec 4.3](../spec.md#43-learning) (learning, reset), [spec 7](../spec.md#7-failure-modes) (corrupt learned state), the reference house's dry-run models after go-live (a bedroom modelled at a heating gain of 0.15 K/h against about 6 K/h measured)

## Context

Radiate learns each room's model (`a`, `b`, `d` with their covariance, residual variance and change-detection statistics), its arrival lags and its lockshield histogram, and keeps them in the SQLite state database (`kv` key `engine`, written by `persist.dump_state`). A model takes days of heating to settle. Until now any change to the saved shape meant `persist.VERSION` went up and every saved model was thrown away, and a model with one parameter out of bounds was reset whole.

Some upgrades also change what a model means. Until burner metering and the `heat_unknown` gate went in, a dry run learned as if the relay ran the boiler. On the reference house that left confident models that were far off. The only remedy was a manual `POST /api/v1/learning/reset`, and nothing in the saved state said which models were affected, because the state did not record how each model was learned.

The owner's ask: while in development a reset is acceptable, but users should not have to reset at every upgrade.

Constraints: the core stays pure (no I/O, no clock), replay must give the same actions from the same snapshots, and a Radiate that cannot read its state must still heat the house.

## Options

### A. Reset on any change (as before)

Bump the version and start from priors; leave the manual reset for bad models.

- **Pros:** no code.
- **Cons:** every upgrade costs days of learning; bad models are only found by a person.

### B. A general migration framework

Schema registry, per-field versions, a migration runner, a separate store per structure.

- **Pros:** scales to many structures.
- **Cons:** far more than the one engine blob and a handful of sections need. More code to get wrong.

### C. One version, small forward migrations, and provenance with each room's learning

Keep one format version for the engine state. Each older version has one function that turns it into the next, tested from a fixture of what that version wrote. Each room's learned parts carry a record of how they were learned, so a release can name the learning it now knows is wrong and reset only that.

- **Pros:** small; every past format is tested; resets are targeted and explained.
- **Cons:** each change to the saved shape needs a migration and a fixture; provenance only helps from the version that starts recording it.

## Decision

Option C. Learned state is carried forward across upgrades, and a release resets only learning it can name as invalid, never everything without a reason.

1. **A version on every persisted learned structure.** The engine state has `version` (now 2); the savings meter inside it already has its own. Bump the version when the saved shape changes.
2. **Forward migrations in code.** `persist.MIGRATIONS` maps each old version to a function that returns the next version's shape and a sentence saying what it means for the house. `load_state` applies them in turn. Each past version has a fixture of what that version's code wrote in `tests/core/fixtures/engine_v<N>*.json`, and a test restores it. A test fails if a version has no migration or no fixture. Migrations never change the data they are given.
3. **Plausibility per parameter.** On restore, a room model parameter that is not finite, is outside its bounds (`0.1 ≤ a ≤ 12 K/h`, `0.005 ≤ b ≤ 0.6 /h`, `−0.5 ≤ d ≤ 3 K/h`) or has a negative variance goes back to its prior mean and variance on its own; the others are kept. Only a model that cannot be read at all (wrong shape, not numbers) resets the room.
4. **Provenance with each room's learning.** Each room's learned parts carry `learned`: learning updates counted by the conditions they were made under (`live_burner`, `live_relay`, `dry_burner`, `dry_relay`, and `unknown` for updates carried over from a save that did not record them), the local days of the first and latest update, the learner version (`provenance.LEARNER_VERSION`, bumped when what a learning update means changes) and the Radiate version that last learned. The room model, arrival lags and lockshield histogram share one record, as the learning reset already treats them as one.
5. **Invalidation rules.** `provenance.RULES` lists rules of the form "learning of this kind is invalid under these conditions". `decide` checks each room every tick, so replay matches, and resets only the rooms a rule names, with the reason `learning.invalidated`. A rule can name conditions (dry run, unmetered) or a learner version ("learned before version N"). Each rule has its own test.
6. **Confidence carries over, lowered.** A migration that cannot say how a model was learned adds 30 % of the prior variance back to each parameter (`CARRY_OVER_DISCOUNT`, as a re-learn does), once: the values are kept, the data that follows moves them sooner. Sample counts carry over as they are.
7. **Never silent.** Each migration, dropped parameter and reset is logged, kept as a learning note for 14 days (`learning_notes` in `GET /api/v1/state`, shown in the web UI's Learning notice), and resets go to the decision log. `POST /api/v1/learning/reset` stays as the manual escape hatch.
8. **Downgrades.** A save from a newer version is not read. The runtime copies it, untouched, to `engine.v<N>` before this version writes its own state, starts from priors (or the tick history) and says so. An earlier copy of the same version is never replaced.

The first rule, `dry_run_unmetered`: learning from a dry run without burner metering is invalid once the burner is metered, or once Radiate takes over the boiler (dry run off), whichever comes first. Saves from before provenance (version 1) count as unknown and are taken as dry-run learning, because every configuration starts in dry run and version 1 learned from it as if it saw the heat. Either moment is when the room can learn again at once: metering shows the heat whoever runs the boiler, and once Radiate runs it its own relay does. The takeover trigger was added by the amendment below; as first written the rule waited for metering, and without it kept the model (discounted) for change detection to correct over a few burns.

## Consequences

- `persist.VERSION` is 2. Version 1 saves load, with their models discounted and their updates counted as unknown.
- On the reference house, the first tick after the upgrade that reads the Shelly's power resets every room that had learned anything (the eight valved rooms), with a note for each. The manual reset is no longer needed there.
- An install that never meters its burner keeps its dry-run models (version 1 ones trusted less) while it stays in dry run, and starts from priors when dry run is turned off (amendment below).
- `GET /api/v1/state` gains `learning_notes` and each room's `model.learned`. Both are additive.
- Changing the saved shape now means: bump the version, add the migration, add a fixture written by the old code, and say in the migration what it means. Changing what learning means: bump `LEARNER_VERSION` and, if old models are wrong, add a rule with a test.
- `bootstrap` treats an older but readable save as usable (it is migrated), and only replays history when there is no readable state.
- Spec 4.3 and 7, the glossary, the engineering standards and the implementation status describe this.

## Revisit if

- Learned state grows beyond the engine blob (for example a per-house model held outside it), which may need its own version and migrations.
- A downgrade-then-upgrade cycle happens in practice: today the copy kept aside is not read back automatically.
- ~~Users without metering need a dry-run rule that fires when Radiate takes over the boiler, not only when the burner is metered.~~ Done: see the amendment below.

## Amendment: reset dry-run learning on takeover (2026-11-25)

The owner decided that dry-run learning without metering is reset when Radiate takes over the boiler, not only once the burner is metered. This settles the open question from the first implementation (spec 12, question 15) and the "Revisit if" above.

- `dry_run_unmetered` now applies when the burner is metered **or** Radiate runs the boiler (`Conditions.live`, from `Snapshot.relay_follows_commands`, which is dry run off). What it names is unchanged: updates counted as `dry_relay` or `unknown`.
- It fires once. The reset clears the room's provenance, and from learner version 2 the `heat_unknown` gate stops any update from being counted as `dry_relay`, so the fresh model never matches again, live or after a return to dry run. No new field is saved.
- A save from before provenance counts as unknown, so an install that ran live under version 1 without metering also has its models reset on its first tick after the upgrade. That matches the metered case and is the same trade-off as before: every install so far started in dry run.
- Why: a model learned in a dry run that took heat for granted can be confident and far off. Carrying it into control would let it hold back the samples that correct it (spec 4.3, "a wrong model cannot lock itself") for a day or more while it drives allocation. From priors the room learns from its own relay at once.
