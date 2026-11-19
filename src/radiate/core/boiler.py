"""Boiler guard for an on/off oil burner (spec 5.1, 5.2).

The guard is the only thing allowed to change the heating relay. It enforces minimum
burn, minimum off and starts per hour, whatever the demand logic asks for.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .types import BoilerConfig, BoilerState


@dataclass(slots=True)
class BoilerGuard:
    state: BoilerState = BoilerState.IDLE
    since: float = 0.0
    starts: list[float] = field(default_factory=list)
    burn_started_at: float | None = None

    def starts_last_hour(self, now: float) -> int:
        return sum(1 for t in self.starts if now - t < 3600)

    def burn_elapsed(self, now: float) -> float:
        return now - self.burn_started_at if self.burn_started_at is not None else 0.0

    def can_start(self, cfg: BoilerConfig, now: float, *, hard_frost: bool = False) -> bool:
        if self.state is not BoilerState.IDLE:
            return False
        if hard_frost:
            return True
        return self.starts_last_hour(now) < cfg.max_starts_per_hour

    def can_stop(self, cfg: BoilerConfig, now: float) -> bool:
        return self.state is BoilerState.FIRING and self.burn_elapsed(now) >= cfg.min_burn_s

    def step(
        self,
        cfg: BoilerConfig,
        now: float,
        *,
        want_fire: bool,
        want_stop: bool,
        hard_frost: bool = False,
        force_stop: bool = False,
    ) -> bool:
        """Advance the state machine. Returns the heating relay state."""
        self.starts = [t for t in self.starts if now - t < 3600]
        s = self.state

        if s is BoilerState.REST and (now - self.since >= cfg.min_off_s or hard_frost):
            self._go(BoilerState.IDLE, now)
            s = self.state

        if s is BoilerState.IDLE and want_fire and self.can_start(cfg, now, hard_frost=hard_frost):
            self._go(BoilerState.LEAD, now)
        elif s is BoilerState.LEAD:
            if not want_fire:
                self._go(BoilerState.IDLE, now)
            elif now - self.since >= cfg.valve_lead_s:
                self._go(BoilerState.FIRING, now)
                self.burn_started_at = now
                self.starts.append(now)
        elif s is BoilerState.FIRING:
            # force_stop (safe mode) still honours minimum burn: a cut-short oil burn is
            # worse than a few extra minutes of heat.
            if (want_stop or force_stop) and self.can_stop(cfg, now):
                self._go(BoilerState.REST, now)
                self.burn_started_at = None

        return self.state is BoilerState.FIRING

    def _go(self, state: BoilerState, now: float) -> None:
        self.state = state
        self.since = now
