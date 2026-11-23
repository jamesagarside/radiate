# Plan: efficiency by room use, and honest savings (first cut)

November 2026. Status: planned, nothing built. Design: [ADR-0004](../adr/0004-efficiency-by-room-use.md) (proposed). Behaviour: [spec 5.8](../spec.md#58-room-use-in-demand) and [5.9](../spec.md#59-savings), with the API in [8.1](../spec.md#81-server-api-v1). Status rows: [implementation status](../implementation-status.md#planned-efficiency-by-room-use). Terms: [glossary](../GLOSSARY.md) (room use, setback, solo limit, damp floor, savings and the entries under Savings).

The first cut is seven vertical slices, small enough to build and check overnight. Slice 7, fail warm presence ([ADR-0005](../adr/0005-fail-warm-presence.md)), fixes a live fault, depends on nothing else here, and goes first. Slice 1 lands the shared interfaces and changes no behaviour. Slices 2 to 5 then run in parallel, each owning its files. Slice 6 builds its scenario in parallel and runs the comparison once slices 2 and 3 are merged.

Every slice follows the [engineering standards](../standards/engineering.md): test first, pure core, glossary terms, no personal details, `ruff format`, `uv run pytest -q` green, a feature branch, no attribution lines in commits. Each slice updates its rows in [implementation status](../implementation-status.md#planned-efficiency-by-room-use) and moves its spec text from **Not yet implemented** to built in the same change.

## Order and file ownership

| Slice | Risk | Owns | Shares (one hunk each) | Needs merged first |
|---|---|---|---|---|
| 7. Fail warm presence | **HIGH** (in the warm direction) | `config/away.py`, `docs/configuration.md` (away settings) | `config/household.py` (`AwaySettings`, `LIMITS`), `server/runtime.py` (`report_presence`, `_update_away`, `_frost_hold`, home evidence), `server/bridge.py` (`set_presence`), the everyone away words in `web/setup.js`, `web/household.js` and `web/guide.js` | nothing |
| 1. Room use and baseline in the snapshot | LOW | `core/types.py`, `core/__init__.py`, `config/use.py` (new), `config/household.py` | `server/runtime.py` (`_apply_use` and its call in `step`) | nothing |
| 2. Room use in `eco` | **HIGH** | `core/decide.py` except the two hunks slice 3 owns | `server/runtime.py` (`describe`: `use`, `solo`) | 1 |
| 3. Savings core | LOW | `core/savings.py` (new), `core/persist.py` | `core/decide.py` (`EngineState.savings` field, the accounting block in step 7) | 1 |
| 4. Savings API, history and export | LOW | `server/savings.py` (new), `server/bridge.py`, `server/app.py`, `export/elastic.py` | `server/runtime.py` (`daily` history: create, restore, append in `step`) | 1; builds against slice 3's signatures, merges after it |
| 5. Savings view | LOW | `web/savings.js` (new), `web/savings.css` (new), `web/index.html`, `web/app.js`, `web/guide.js`, `scripts/build_demo.py`, `docs/standards/design.md` | | none to build (uses the spec's JSON shape); merges after 4 |
| 6. Simulator comparison and estimator check | LOW (measures HIGH) | `sim/reference.py`, `sim/runner.py`, `sim/compare.py` (new), `cli.py`, `docs/simulation.md` | | 1 to build; 2 and 3 to run |

Paths are under `src/radiate/` unless they start with a top-level folder. Merge order: 7, 1, 3, 2, 4, 5, 6. Where two slices share a file, each keeps to its named hunk; the later one rebases.

HIGH means the slice changes when the boiler fires or how valves move on the real house. It doesn't go live on the real house without the owner's go-ahead (CLAUDE.md): first a few days in dry run on the real house, reading the decision log for `demand.setback` and `demand.floor`, and the simulator results from slice 6.

---

## Slice 7: fail warm presence

**Goal.** No connectivity or device problem turns the heating down through presence (spec 7, fail warm; ADR-0005). Uncertain presence counts as home; presence alone never holds frost.

**Risk: HIGH**, in the warm direction: it changes when the house is set back, so it changes when the boiler fires. Each change only ever makes the house warmer than today.

**Files.** `src/radiate/config/away.py`; in `src/radiate/config/household.py` only `AwaySettings` and `LIMITS` (new `presence_source_silence_min`) and the household view; in `src/radiate/server/runtime.py` only `report_presence`, `_update_away`, `_frost_hold`, `person_view` and a new `note_home_evidence`; in `src/radiate/server/bridge.py` only `set_presence`; the words for everyone away in `web/setup.js`, `web/household.js` and `web/guide.js`; `docs/configuration.md` (the new setting and the changed meaning of `everyone_away: frost`). Tests: `tests/config/test_away_fail_warm.py`, `tests/server/test_presence_fail_warm.py` (new).

**Depends on.** Nothing in this plan.

**Interfaces:**

```python
# radiate/config/household.py
PRESENCE_SOURCE_SILENCE_MIN = 120

@dataclass(frozen=True, slots=True)
class AwaySettings:
    ...  # existing fields unchanged
    presence_source_silence_min: int = PRESENCE_SOURCE_SILENCE_MIN  # 30 to 1440

# radiate/config/away.py
@dataclass(frozen=True, slots=True)
class Presence:
    ...  # existing fields unchanged
    last_seen: float | None = None  # when the source (tracker) last updated, any state
    home_evidence_at: float | None = None  # latest sign someone is in, from the runtime

@dataclass(frozen=True, slots=True)
class AwayStatus:
    away: bool
    reason: str | None = None  # "away_until" or "presence" when away
    uncertain: str | None = None  # why presence was set aside: "source_silent", "home_evidence"

def source_silent(p: Presence, now: float, silence_s: float) -> bool:
    """`not_home` without a recent update from its source: `last_seen` older than
    silence_s, or, without `last_seen`, `since` older than silence_s."""

def status(p: Presence, now: float, delay_s: float = ..., lead_s: float = ...,
           stale_s: float | None = None, silence_s: float | None = None) -> AwayStatus:
    """As today, except presence counts as away only if not stale, not source silent,
    and no home evidence since `since`. Away until is unchanged."""

def frost_allowed(people: Iterable[str], presence: Mapping[str, Presence], now: float) -> bool:
    """True only when every person is away by an away until."""
```

```python
# radiate/server/runtime.py
def note_home_evidence(self, what: str) -> None:
    """Someone is in (override, store boost, fire switch, shower): set aside every
    presence-based away until that person's presence changes again."""
```

Home evidence comes from `set_setpoint`, `boost_store` and `set_fire` in the bridge, and from a `disturbance.shower` reason in `Runtime.step`. `_frost_hold` also needs `frost_allowed`; otherwise everyone away sets every room to its unused temperature (`EveryoneAway.UNUSED` behaviour).

**Tests first.**

- The incident: one person, `not_home` reported every 15 minutes with `since` and `last_seen` frozen at 10:17; at 12:18 and after, the person counts as home with `uncertain = "source_silent"`, `away.presence_uncertain` is raised once, and the house is not at frost at 22:22.
- `not_home` with `last_seen` refreshed every 10 minutes counts as away after the presence delay, as today.
- A report without `last_seen` counts as away from the presence delay until `since` + source silence, then as home.
- A setpoint override, a store boost, a fire switch or a shower while someone is away by presence: they count as home until a new presence change; a later `not_home` with a fresh source counts again after the delay.
- Everyone away by presence: every room at its unused temperature, never frost. Everyone away with an away until each, `everyone_away: frost`: frost, as today.
- Away until is untouched by every new rule.
- `POST presence` accepts `last_seen` (an ISO time, not in the future), rejects a malformed one with 400, and accepts reports without it; `GET people` returns `last_seen`, `uncertain` and `why`.
- The saved presence round-trips `last_seen` and `home_evidence_at`; older saves load.

**Acceptance.** `uv run pytest -q` passes, `tests/server/test_away_runtime.py` updated only where the frost rule changed on purpose; `test_ha_contract.py` passes without new fixtures; `docs/configuration.md`, the Guide and spec 8.1 describe the new behaviour. A follow-up issue in radiate-ha to send `last_seen` from the tracker's `last_updated`. Owner's go-ahead before it runs live, as for any behaviour change, though it can only make the house warmer.


---

## Slice 1: room use and baseline in the snapshot

**Goal.** Each tick, the core receives each controllable room's room use and savings baseline setpoint in the snapshot. Nothing in the core reads them yet, so behaviour, the simulator and replay are unchanged.

**Files.** `src/radiate/core/types.py`, `src/radiate/core/__init__.py` (export `RoomUse`, `DAMP_FLOOR_C`), `src/radiate/config/use.py` (new), `src/radiate/config/household.py`, and in `src/radiate/server/runtime.py` a new `_apply_use` called from `step` right after `_apply_return`. Tests: `tests/config/test_room_use.py`, `tests/server/test_room_use_runtime.py`, `tests/core/test_history_room_use.py` (all new).

**Interfaces it creates** (later slices depend on these exactly):

```python
# radiate/core/types.py
DAMP_FLOOR_C = 12.0  # no saving rule lets a room wait below this (spec 5.8)

class RoomUse(StrEnum):
    """How a room is used right now, from the household (spec 5.8)."""
    IN_USE = "in_use"
    OCCASIONAL = "occasional"
    SETBACK = "setback"  # unused today, overnight, between warm periods, away

@dataclass(frozen=True, slots=True)
class BoilerConfig:
    ...  # existing fields unchanged
    damp_floor_c: float = DAMP_FLOOR_C  # not in the configuration file

@dataclass(slots=True)
class RoomInput:
    ...  # existing fields unchanged
    # None: no household or a hand-written schedule; eco then behaves as before.
    use: RoomUse | None = None
    # Savings baseline (spec 5.9): the timer-and-valve setpoint now; None while the
    # baseline timer is off.
    baseline_c: float | None = None

@dataclass(slots=True)
class Snapshot:
    ...  # existing fields unchanged
    baseline: bool = False  # the house has a household, so a savings baseline exists
```

```python
# radiate/config/household.py
DAMP_BELOW_C = DAMP_FLOOR_C  # imported from radiate.core.types; one value

@dataclass(frozen=True, slots=True)
class CompiledHousehold:
    ...  # existing fields unchanged
    # Per room, Monday first: the use level its warm periods are kept at that day.
    # IN_USE or OCCASIONAL; IN_USE for warm periods a room adjustment added on an
    # unused day (the level `_compile_day` already calls `warm_level`).
    warm_levels: dict[str, tuple[UseLevel, ...]] = field(default_factory=dict)
```

```python
# radiate/config/use.py (new, pure)
BASELINE_TEXT = (
    "Compared with a heating timer on from the first person up to the last to bed "
    "every day, and each room's valve set to its usual temperature."
)

def room_use(compiled: CompiledHousehold, room_id: str, weekday: int, minute: int) -> RoomUse | None:
    """IN_USE or OCCASIONAL inside one of the room's live warm periods (by its warm
    level that day), SETBACK outside them; None for a room not in the household."""

@dataclass(frozen=True, slots=True)
class BaselineDay:
    start_min: int  # timer on: first person up less the fixed preheat (not below 0)
    end_min: int  # timer off: last person to bed
    setpoint_c: float  # the room's temperature for its use level that day

@dataclass(frozen=True, slots=True)
class Baseline:
    rooms: dict[str, tuple[BaselineDay | None, ...]]  # per room, Monday first

    def setpoint_at(self, room_id: str, weekday: int, minute: int) -> float | None:
        """The baseline valve setpoint now, or None while the timer is off or the room
        is not in the household."""

def compile_baseline(household: Household) -> Baseline:
    """Nobody away, no room adjustments. Per room per day: the level's temperature
    (the room's own `temperature` if set; its unused temperature on an unused day)."""
```

```python
# radiate/server/runtime.py
def _apply_use(self, snap: Snapshot) -> None:
    """Room use and the savings baseline for every household room, in house time.
    A room with a setpoint override is IN_USE. Without a household: nothing is set
    and `snap.baseline` stays False."""
```

The runtime caches `compile_baseline` per household (cleared in `set_household`) and uses the compiled household it already caches per away set (`_compile`).

**Tests first.**

- `test_room_use.py`: a bedroom-kind room is `in_use` 30 minutes after getting up and `setback` at midday; an office is `in_use` in working hours on weekdays and `setback` at the weekend; an occasional day gives `occasional`; an unused room is `setback` all day; a warm period added by a room adjustment on an unused day is `in_use`; a person away turns their bedroom `setback`; a room not in the household gives `None`. `compile_baseline`: the timer runs from first up less preheat to last bed; each level's temperature and a room's own temperature are used; away and adjustments are ignored; `setpoint_at` is `None` outside the timer.
- `test_room_use_runtime.py`: after `step`, each household room's snapshot input has `use` and `baseline_c`, and `snap.baseline` is true; an override makes the room `in_use`; a runtime without a household leaves `use` and `baseline_c` `None` and `baseline` false.
- `test_history_room_use.py`: `encode_snapshot` and `decode_snapshot` round-trip `use`, `baseline_c` and `baseline`; an entry without them decodes with the defaults.

**Acceptance.**

- `uv run pytest -q` passes, including `tests/server/test_ha_contract.py` and `tests/core/test_replay.py`.
- `uv run radiate sim --days 5 --seed N` for N = 1, 2, 3 prints exactly what it printed before the slice.
- `uv run radiate replay` on a recorded history (the test fixtures) reports no differences.

---

## Slice 2: room use in `eco`

**Goal.** In `eco`, room use sets each room's solo limit, its part in pooled demand, whether it keeps the burner running, whether it can take a burn extension and its place in the heat sink order, never below the damp floor (spec 5.8). A room with no room use, and `comfort`, behave exactly as today.

**Risk: HIGH.** Changes when the boiler fires and which valves open.

**Files.** `src/radiate/core/decide.py` (everything except the `EngineState.savings` field and the step 7 accounting block, which slice 3 owns); the `describe` hunk of `src/radiate/server/runtime.py` (each room's `use` and `solo`). Tests: `tests/core/test_room_use_demand.py` (new).

**Depends on.** `RoomUse`, `RoomInput.use`, `BoilerConfig.damp_floor_c` from slice 1.

**Interfaces it creates:**

```python
# radiate/core/decide.py
SOLO_EXTRA_K = 1.0  # occasional and setback rooms wait this much longer than the eco limit

def solo_threshold_c(target: float, use: RoomUse | None, bcfg: BoilerConfig) -> float:
    """Eco: below this a calling room starts a burn on its own (spec 5.8).
    No room use: target - eco limit, as before. Otherwise
    max(target - limit, min(target, damp_floor_c)), where the limit is the eco limit,
    plus SOLO_EXTRA_K for OCCASIONAL and SETBACK."""

@dataclass(slots=True)
class RoomState:
    ...  # existing fields unchanged
    use: RoomUse | None = None  # this tick's room use, from the snapshot
    solo: bool = False  # solo latch: passed its solo threshold; cleared when it stops calling
```

Rules to change, all in `eco` only:

- Fire: `demand = pooled >= threshold or any(rs.solo for calling rooms)`, where a calling room sets `rs.solo` when its temperature is below `solo_threshold_c(rs.target, rs.use, bcfg)`. `max_gap > eco_limit_k` goes, because `solo_threshold_c` with `use=None` is that rule.
- `_pooled_demand_s`: skip rooms whose `rs.use is RoomUse.SETBACK`.
- Stop (`keeping`): a calling room keeps the burner if `rs.use is not RoomUse.SETBACK or rs.solo`; extended rooms as today.
- Burn extension (`_topup_candidates` for the extension loop): skip `SETBACK` rooms.
- Heat sinks (`_ensure_sink`): order by rank (`IN_USE` and `None` 0, `OCCASIONAL` 1, `SETBACK` 2), then coldest relative to target. With no room use anywhere this is today's order.
- Reasons: `demand.setback` for a calling setback room while the boiler is idle and not firing ("Lounge: not in use now, takes heat only when the boiler is already on"); `demand.floor` when a setback room's solo latch is set ("Lounge: down to 12.0 °C, heating to 14.0 °C", values `temperature_c`, `target_c`).
- Unchanged: preheat, frost and hard frost, the boiler guard, the open-path total, the allocator, `comfort`.

`describe()` adds `use` (the enum value or `null`) and `solo` to each controllable room; both additive.

**Tests first** (`test_room_use_demand.py`, scripted snapshots through `decide`):

- An `in_use` room alone 1.6 K below an 18 °C target fires (as today); 1.4 K below waits with `demand.pooled`.
- An `occasional` room alone fires at 2.6 K below and waits at 2.4 K below.
- A `setback` room alone at 13.6 °C (target 14) waits with `demand.setback`; at 11.9 °C it fires, raises `demand.floor`, and the burn continues until it reaches 14 °C even with no other room calling.
- A setback room with target 11 °C fires as soon as it calls (at or under the damp floor).
- Pooled demand with one in-use room and one setback room calling equals the in-use room's share alone.
- Stop: the in-use room that started a burn reaches target while a setback room still calls without its latch: the burner stops after minimum burn.
- Burn extension tops up an in-use room predicted to call soon, never a setback room.
- Heat sinks: with an in-use and a setback candidate, the in-use room is opened first; with only setback candidates, a setback room is opened (the open-path guarantee holds).
- Frost: a setback room at 6.9 °C fires the boiler.
- `comfort`: the same snapshots with and without room use give identical actions.
- No room use: identical actions to the same sequence before the slice (the existing `tests/core/test_decide.py` passes untouched).
- Replay: a sequence with room use, encoded and decoded through the tick history, gives identical actions.

**Acceptance.**

- `uv run pytest -q` passes with `tests/core/test_decide.py` and `tests/sim` untouched.
- `uv run radiate sim --days 5 --seed N`, N = 1, 2, 3, prints exactly what it did before (the fixed-schedule scenario has no room use).
- After slice 6 lands: its room use guard, comfort and oil checks pass (see slice 6).
- Owner's go-ahead before it runs with dry run off on the real house.

---

## Slice 3: savings core

**Goal.** Pure degree-hour, lift and comfort accounting per room per day, the house signature fit, eligibility and the full `GET /api/v1/savings` body (spec 5.9). Never changes control.

**Files.** `src/radiate/core/savings.py` (new), `src/radiate/core/persist.py` (optional `savings` section, `SavingsMeter` dumped and loaded), and in `src/radiate/core/decide.py` only: the `EngineState.savings` field and the hook in the accounting block of step 7. Tests: `tests/core/test_savings.py`, `tests/core/test_persist_savings.py` (new).

**Depends on.** `RoomUse`, `RoomInput.baseline_c`, `RoomInput.setpoint`, `Snapshot.baseline` from slice 1; `RoomState.drive` and `RoomState.est` (existing).

**Interfaces it creates:**

```python
# radiate/core/savings.py (pure, standard library only)
MAX_TICK_S = 300.0
WARM_TOLERANCE_K = 0.5

@dataclass(frozen=True, slots=True)
class RoomSample:
    temperature_c: float | None
    setpoint_c: float  # the schedule's or override's setpoint (RoomInput.setpoint), not the preheat target
    use: RoomUse | None
    baseline_c: float | None  # None: the baseline timer is off
    drive: float  # RoomState.drive
    a_kph: float  # heating gain
    b_per_h: float  # loss rate

@dataclass(slots=True)
class RoomDay:
    dh_actual_kh: float = 0.0
    dh_baseline_kh: float = 0.0
    deficit_kh: float = 0.0
    warm_min: float = 0.0
    warm_ok_min: float = 0.0

@dataclass(slots=True)
class SavingsMeter:
    rooms: dict[str, RoomDay] = field(default_factory=dict)
    lift_k: dict[str, float] = field(default_factory=dict)  # kept across days
    seen_s: float = 0.0
    outdoor_s: float = 0.0
    baseline_s: float = 0.0
    outdoor_sum_cs: float = 0.0  # °C x s, for the day's mean

    def update(self, dt_s: float, *, outdoor_c: float | None, baseline: bool,
               rooms: Mapping[str, RoomSample]) -> None: ...
    def close(self) -> dict:
        """The day's `savings` record (spec 5.9); resets the day, keeps lift."""

def room_weights(models: Mapping[str, tuple[float, float, float]],
                 min_confidence: float = 0.6) -> dict[str, float]:
    """Room id to (a, b, confidence) -> weights summing to 1: b / a, or equal weights
    while any room is below min_confidence."""

@dataclass(frozen=True, slots=True)
class Signature:
    k: float  # litres per K·h
    c: float  # litres per day
    cv_rmse: float
    days: int
    spread: float  # p90 / p10 of the fit days' weighted degree-hours

def fit_signature(dh: Sequence[float], litres: Sequence[float]) -> Signature | None:
    """Theil-Sen slope, median intercept; refit through the origin if c < 0.
    None with fewer than 2 days."""

@dataclass(frozen=True, slots=True)
class SavingsParams:
    min_days: int = 14
    window_days: int = 60
    max_cv_rmse: float = 0.25
    min_spread: float = 1.3
    min_share: float = 0.9
    rooms_days: int = 30

def why_not_eligible(summary: Mapping[str, Any], basis: str) -> str | None:
    """None for an eligible closed day, otherwise the reason in words."""

def report(days: Sequence[Mapping[str, Any]], weights: Mapping[str, float],
           names: Mapping[str, str], *, household: bool, outdoor_sensor: bool,
           params: SavingsParams = SavingsParams()) -> dict:
    """The whole GET /api/v1/savings body (spec 8.1) from closed day summaries,
    oldest first. Dates from each summary's `day` ordinal (date.fromordinal)."""
```

```python
# radiate/core/decide.py (slice 3's two hunks only)
@dataclass(slots=True)
class EngineState:
    ...  # existing fields unchanged
    savings: SavingsMeter = field(default_factory=SavingsMeter)

# step 7, after st.ledger.update(...):
st.savings.update(min(dt, savings.MAX_TICK_S), outdoor_c=snap.outdoor,
                  baseline=snap.baseline, rooms=_savings_samples(cfg, snap, st))
if day_summary is not None:
    day_summary["savings"] = st.savings.close()
```

`_savings_samples` builds a `RoomSample` per controllable room from `snap.rooms` and `st.rooms`. As in the ledger, the interval since the last tick belongs to the day it started in, so `update` runs before `close`.

**Tests first.**

- A room held at the baseline setpoint with the timer on and no heating outside it: equal degree-hours, zero saving.
- A room held 2 K below the baseline setpoint for 10 h: `dh_baseline_kh - dh_actual_kh` = 20.
- Free heat: a room above its baseline setpoint with drive 0 (a fire): equal degree-hours.
- Timer off with drive 1 for 3 h: lift rises towards `a / b`, baseline degree-hours fall below actual: a negative difference.
- No outdoor reading: nothing accumulates and `outdoor_share` falls.
- Comfort: only `in_use` and `occasional` minutes count; deficit and warm share as spec 5.9.
- `close` resets the day and keeps lift.
- `fit_signature` recovers `k` and `c` within 5 % from 30 noisy synthetic days with one wild outlier; `c < 0` refits through the origin.
- `report`: 13 eligible days give `learning` with "13 of 14 days"; a poor fit, a narrow weather spread, no household, no outdoor sensor and no nozzle each give their reason; a negative day stays negative; room shares sum to the total saving; `percent_saved` matches.
- `room_weights`: equal until every room is confident, then `b / a` normalised.
- Persist: `dump_state` and `load_state` round-trip the meter; a save without `savings` loads with an empty meter.
- Control untouched: the same snapshot sequence with `baseline` true and false gives identical valve, relay and boiler actions.

**Acceptance.** `uv run pytest -q` passes; `uv run radiate sim --days 5 --seed N`, N = 1, 2, 3, prints exactly what it did before; every closed day summary from a simulator run has a `savings` record.

---

## Slice 4: savings API, history and export

**Goal.** Keep closed days for two years, serve `GET /api/v1/savings`, and export the daily savings and comfort fields to Elastic.

**Files.** `src/radiate/server/savings.py` (new), `src/radiate/server/bridge.py` (route), `src/radiate/server/app.py` (route), `src/radiate/export/elastic.py` (`daily_doc`), and in `src/radiate/server/runtime.py` only the `daily` history (created in `__post_init__`, restored in `restore`, appended in `step` where `actions.day_summary` is handled). Docs: spec 8.1 and 9 move from **Not yet implemented** to built; `docs/deployment.md` if the backup notes list state database keys. Tests: `tests/server/test_savings_api.py`, `tests/server/test_elastic_savings.py` (new).

**Depends on.** `report`, `room_weights`, `SavingsParams` from slice 3 (build against the signatures with hand-written day summaries; merge after slice 3); `BASELINE_TEXT` from slice 1.

**Interfaces it creates:**

```python
# radiate/server/savings.py
HISTORY_KEY = "daily_history"
KEEP_DAYS = 730

class DailyHistory:
    """Closed day summaries, oldest first, in the state database (memory only without one)."""
    def __init__(self, store: Store | None) -> None: ...
    def add(self, summary: dict) -> None:
        """Append, replacing a summary for the same `day`; keep the last KEEP_DAYS; save."""
    def days(self) -> list[dict]: ...

def savings_view(rt: Runtime) -> dict:
    """GET /api/v1/savings: report() over rt.daily.days(), weights from the room models."""
```

Daily Elastic fields as spec 9: `savings.dh_actual_kh`, `savings.dh_baseline_kh`, `savings.outdoor_share`, `savings.baseline_share`, `savings.eligible`, `comfort.deficit_kh`, `comfort.warm_share`, and `savings.litres` and `savings.fit_cv_rmse` as estimated when the day closed (absent while learning).

**Tests first.**

- No household: `status` `unavailable`, `why` "no household".
- Three closed days: `learning`, "3 of 14 days", `days` listed with `eligible`.
- 20 injected eligible days from a known signature: `ready`, `totals.litres_saved` matches the hand calculation, `rooms` sorted, a negative day kept.
- History survives a runtime restart through the state database, replaces a repeated day, and keeps at most 730.
- The Elastic daily document carries the new fields and still the old ones.
- `test_ha_contract.py` passes without regenerating fixtures (all additions).

**Acceptance.** `uv run pytest -q` passes; `curl -s localhost:8099/api/v1/savings` on `uv run radiate serve --demo` answers `learning` with the day count.

---

## Slice 5: savings view

**Goal.** A Savings view that shows the headline sentence, daily or weekly actual against baseline bars, comfort beside every figure, a cumulative line, rooms' shares, and a table view; plus the room status lines and the Eco line from spec 10.

**Files.** `web/savings.js`, `web/savings.css` (new), `web/index.html` (tab, section, script and stylesheet), `web/app.js` (tab routing, the House view headline line, room lines for `demand.setback` and `demand.floor`, the Eco line), `web/guide.js` (a "Savings" section saying what the baseline is and why litres are an upper bound), `scripts/build_demo.py` (add the two files), `docs/standards/design.md` (the chart as a component). Tests: `tests/server/test_savings_js.py` (new, under Node like `test_suggestions_js.py`), and `tests/server/test_build_demo.py` passes with the new files.

**Depends on.** The `GET /api/v1/savings` shape in spec 8.1 only. Build against fixture bodies (learning, ready, a negative day, days not eligible); merge after slice 4.

**Rules from the spec and the design standards.** Plant room look and tokens; zero-based axis; outline for the baseline and fill for actual, never colour alone; empty slots with the reason for days that aren't eligible; "about" and "estimated", never "up to"; no counting-up numbers; `prefers-reduced-motion`; keyboard-reachable bars with the tooltip's words; "Show as table"; a text alternative naming the trend; phone width at 360 px with no horizontal scroll.

**Tests first** (`test_savings_js.py`): the headline for a ready body ("About 14 litres of oil saved since 1 November, with rooms in use warm 98 % of the time."), the learning line ("8 of 14 days"), a negative total ("About 2 litres more than the baseline since ..."), the relay basis line, a day not eligible rendered as an empty slot with its reason, and the table rows matching `days`.

**Acceptance.** `uv run pytest -q` passes; checked by eye in the demo at 1280, 390 and 360 px, light and dark, by keyboard; screenshots attached to the pull request.

---

## Slice 6: simulator comparison and estimator check

**Goal.** Measure, on the simulated reference house, what room use in `eco` does to oil, relay starts, burner hours and comfort, against `eco` today, and check the savings estimate against the simulated truth. This is the evidence the owner sees before slice 2 goes live and before the Savings view's figures are trusted.

**Files.** `src/radiate/sim/reference.py`, `src/radiate/sim/runner.py`, `src/radiate/sim/compare.py` (new), `src/radiate/cli.py` (a `sim-efficiency` command), `docs/simulation.md` (a new section with the results). Tests: `tests/sim/test_room_use_sim.py` (new).

**Depends on.** Slice 1 to build (`compile_household`, `room_use`, `compile_baseline`, `RoomInput.use`, `baseline_c`); slices 2 and 3 merged to run the comparison and the estimator check.

**What to add:**

- `reference_household() -> Household` in `sim/reference.py`: generic people and routines (no personal details) that give the reference rooms the mix in [spec 5.8's example](../spec.md#58-room-use-in-demand): one bedroom used getting up and at bedtime, an office used on weekday working hours, the dining room and kitchen used while people are home, the bathroom occasional, the lounge, spare bedroom and toilet unused; 18 °C in use, 16 °C occasional, 14 °C unused and overnight.
- `run(..., schedule: str = "fixed", room_use: bool = False, outdoor_by_day: Sequence[float] | None = None)` in `sim/runner.py`. `schedule="household"` takes setpoints, next changes and TRV mirror schedules from `compile_household(reference_household())` (`live` for Radiate, `schedules` for the TRVs), and fills `RoomInput.baseline_c` and `Snapshot.baseline` from `compile_baseline`. `room_use=True` also fills `RoomInput.use` from `room_use`. `outdoor_by_day` sets each day's mean, so the house signature has weather to fit. The defaults reproduce today's runs exactly.
- A `"timer"` controller: the savings baseline as a house. Each TRV on its own sensor at `compile_baseline`'s setpoint (frost threshold while the timer is off), every valve fully open, and the heating relay on for the whole timer window, as a plain programmer does.
- `Result` gains `oil_litres` (burner firing hours × 1.64 l/h, the truth), `relay_litres` (relay hours × 1.64 l/h, what Radiate counts), `warm_deficit_kmin` (K·min below setpoint in each room's warm periods, rooms in use and occasional), `setback_mean_c` and `min_room_c` (lowest room temperature after warm-up, with its setpoint).
- `sim/compare.py`: runs every scenario, seed and policy and prints one table per scenario (mean, and min to max across seeds), plus the estimator check.

**The exact command:**

```
uv run radiate sim-efficiency --days 24 --warmup 3 --seeds 1,2,3 --scenarios fixed,mild,cold
```

- Scenarios: `fixed`, today's fixed-schedule reference run (outdoor mean 4 °C, no household, so no room use: a regression check that `eco` and `eco+use` match exactly); `mild`, the household schedule at an outdoor mean of 4 °C with day means varying ±3 K; `cold`, the household schedule at −2 °C with `pump_qmax=0.15`, optimum start on.
- Policies: `eco` (room use off), `eco+use` (room use on), `comfort`, `timer` (the savings baseline).
- Columns: oil litres (firing), relay litres, relay starts, burner starts, burner hours, warm-period comfort deficit (K·min), comfort deficit (K·h, the existing measure), setback rooms' mean temperature, lowest room temperature, guard violations, relay minutes with no TRV open.
- Estimator check, per scenario and seed: the true saving is `timer` relay litres minus `eco+use` relay litres over the measured days; the estimate is `report()` over the `eco+use` run's closed days with `SavingsParams(min_days=14)`, once with `b / a` weights and once with equal weights.

**Tests first** (`tests/sim/test_room_use_sim.py`, 7 days, seeds 1 to 3, kept under a minute):

- Guards never violated with room use, and relay time with no TRV open under 1 %.
- No room falls below `min(setpoint, 12 °C) − 0.3 K` after warm-up, and none below the frost threshold.
- `eco+use` uses no more relay litres than `eco`, mean of seeds.
- `eco+use` warm-period comfort deficit at most 10 % above `eco`'s plus 30 K·min, mean of seeds.
- `fixed` scenario: `eco` and `eco+use` results are identical.
- Estimator (a 24-day run, marked slow if needed): mean over seeds, the estimate within 30 % of the true saving or within 0.3 litres a day, with the same sign.

**Acceptance.** The tests pass; `docs/simulation.md` gains a section with the command, the date, the commit and the tables; the result is reported to the owner. If `eco+use` saves under 1 % of oil, or costs more comfort than the tolerance, slice 2 does not go live and the solo extra (1 K) and setback rules are revisited with the owner. If the estimator check fails, the Savings view shows "still learning" until the method is fixed, and the weights choice follows whichever of `b / a` and equal passes.

---

## Not in this cut

Each is specified as **Not yet implemented** in spec 5.8 or 5.9 and listed in implementation status: optimum stop; arrival-tuned optimum start; the outdoor cut-off; the damp guard from humidity; the room activity input, usage log and usage suggestions (needs radiate-ha first); store hours and store merging; litres from burner firing (needs the wiring answer, spec open question 1); oil price and money; the Home Assistant sensors (radiate-ha).

The order after this cut, if the owner agrees: usage suggestions with the activity input (the owner's "understand how a room is used"), then optimum stop and arrival-tuned optimum start, each measured with `sim-efficiency` against this cut first.
