"""Where a room's learned values came from, and the rules that declare some invalid
(ADR-0007). Pure: no I/O.

Each room's learned parts (the room model, arrival lags and lockshield histogram) carry
one `Provenance`: its learning updates counted by the conditions they were made under,
the local days of the first and latest update, the learner version they started under
and the Radiate version that last learned. Saved with the model (`persist`).

An `Invalidation` rule names learned values that a release now knows to be wrong, such
as models learned in a dry run that took heat for granted. `decide` checks every room
against `RULES` each tick and puts a room whose learning a rule matches back to its
priors, with the reason `learning.invalidated`. Only the rooms a rule names are reset,
never the whole house without a reason. A rule is a plain function of the provenance and
the conditions now, so a later release adds one by appending it to `RULES`, with a test.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

# Bump when what a learning update means changes, so a rule can name models learned
# before it. 1: before provenance was recorded (saves before persist version 2). 2: the
# `heat_unknown` gate and burner metering, so learning sees only heat Radiate can see.
LEARNER_VERSION = 2

# The conditions a learning update was made under.
LIVE_BURNER = "live_burner"  # Radiate ran the boiler; the burner was metered
LIVE_RELAY = "live_relay"  # Radiate ran the boiler, unmetered: heat from its own relay
DRY_BURNER = "dry_burner"  # dry run; the burner was metered
# Dry run, unmetered: heat taken from a relay Radiate does not run, so assumed. The
# `heat_unknown` gate stops these from learner version 2; kept so a rule can name them.
DRY_RELAY = "dry_relay"
UNKNOWN = "unknown"  # carried over from a save that did not record the conditions
CONDITIONS = (LIVE_BURNER, LIVE_RELAY, DRY_BURNER, DRY_RELAY, UNKNOWN)


@dataclass(frozen=True, slots=True)
class Conditions:
    """What this tick shows about how heat is seen."""

    live: bool  # Radiate runs the boiler (not a dry run)
    metered: bool  # the heating burner is metered (`Snapshot.heating_burner` is not None)

    @property
    def key(self) -> str:
        """The `CONDITIONS` key a learning update made now is counted under."""
        if self.live:
            return LIVE_BURNER if self.metered else LIVE_RELAY
        return DRY_BURNER if self.metered else DRY_RELAY


@dataclass(slots=True)
class Provenance:
    """Where a room's learned parts came from. Fresh at priors."""

    learner: int = LEARNER_VERSION  # the oldest learner version in these values
    code: str | None = None  # the Radiate version that last learned (None: unknown)
    first_day: int | None = None  # local day (`date.toordinal()`) of the first update
    last_day: int | None = None  # and of the latest one
    updates: dict[str, int] = field(default_factory=dict)  # learning updates by condition

    def note(self, key: str, day: int | None, code: str | None) -> None:
        """Count one learning update made under `key` (a `CONDITIONS` value)."""
        self.updates[key] = self.updates.get(key, 0) + 1
        if day is not None:
            if self.first_day is None:
                self.first_day = day
            self.last_day = day
        if code is not None:
            self.code = code

    def count(self, *keys: str) -> int:
        return sum(self.updates.get(k, 0) for k in keys)

    def to_dict(self) -> dict[str, Any]:
        return {
            "learner": self.learner,
            "code": self.code,
            "first_day": self.first_day,
            "last_day": self.last_day,
            "updates": {k: v for k, v in self.updates.items() if v},
        }

    @classmethod
    def from_dict(cls, raw: Any) -> Provenance | None:
        """None when `raw` is not a readable provenance."""
        if not isinstance(raw, dict):
            return None
        learner = raw.get("learner")
        if not _count(learner) or learner < 1:
            return None
        updates = raw.get("updates")
        if not isinstance(updates, dict):
            return None
        # Conditions this version does not know are kept, so a newer save's counts are
        # not lost; no rule here names them.
        counts = {str(k): v for k, v in updates.items() if _count(v) and v > 0}
        code = raw.get("code")
        return cls(
            learner=learner,
            code=code if isinstance(code, str) else None,
            first_day=raw["first_day"] if _count(raw.get("first_day")) else None,
            last_day=raw["last_day"] if _count(raw.get("last_day")) else None,
            updates=counts,
        )


def _count(v: Any) -> bool:
    return isinstance(v, int) and not isinstance(v, bool) and v >= 0


@dataclass(frozen=True, slots=True)
class Invalidation:
    """A rule that declares some learned values invalid."""

    code: str  # stable identifier, for logs and tests
    why: str  # completes "<room>: learning reset to priors, as it was ..."
    applies: Callable[[Provenance, Conditions], bool]


def _dry_run_unmetered(p: Provenance, now: Conditions) -> bool:
    """Learned in a dry run without burner metering, or before the conditions were
    recorded, now that the burner is metered.

    Until learner version 2, a dry run learned as if the relay ran the boiler, which can
    leave a confident model far off (a heating gain of 0.15 K/h against a measured 6 K/h).
    A save without provenance cannot say whether it was learned in a dry run; a new
    configuration starts in one, so it is taken as one. Only once the burner is
    metered: that is when heat can be seen whether or not Radiate runs the boiler, so the
    room can learn again straight away; without metering the model is kept, and change
    detection corrects it over a few burns.
    """
    return now.metered and p.count(DRY_RELAY, UNKNOWN) > 0


RULES: tuple[Invalidation, ...] = (
    Invalidation(
        "dry_run_unmetered",
        "learned without seeing the burner, in a dry run or by an older version",
        _dry_run_unmetered,
    ),
)


def invalid(
    p: Provenance, now: Conditions, rules: tuple[Invalidation, ...] = RULES
) -> Invalidation | None:
    """The first rule that declares these learned values invalid, if any."""
    for rule in rules:
        if rule.applies(p, now):
            return rule
    return None
