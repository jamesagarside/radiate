"""Boiler guard for an on/off oil burner (spec 5.1, 5.2).

The guard is the only thing allowed to change the heating relay. It enforces minimum
burn, minimum off and starts per hour, whatever the demand logic asks for.

Hand-back (spec 5.7): while Radiate is not commanding the relay (safe mode, an MQTT
outage, a crash or restart), the Shelly watchdog may switch it. `adopt` brings the
guard in line with the relay as observed, so Radiate neither cuts a burn it did not
start short of minimum burn nor starts a new one inside minimum off.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .types import BoilerConfig, BoilerState

# Unseen for this long, the relay may have been switched by the Shelly watchdog, which
# takes over after 10 min without a heartbeat (spec 5.7). Half that, to be safe.
HIDDEN_RELAY_S = 5 * 60


@dataclass(slots=True)
class BoilerGuard:
    state: BoilerState = BoilerState.IDLE
    since: float = 0.0
    starts: list[float] = field(default_factory=list)
    burn_started_at: float | None = None
    external: bool = False  # this burn was started outside Radiate and adopted
    commanded: bool = True  # Radiate has commanded this burn (own, or taken over)

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
                self.external, self.commanded = False, True
        elif s is BoilerState.FIRING:
            # force_stop (safe mode) still honours minimum burn: a cut-short oil burn is
            # worse than a few extra minutes of heat.
            if (want_stop or force_stop) and self.can_stop(cfg, now):
                self._go(BoilerState.REST, now)
                self.burn_started_at = None

        return self.state is BoilerState.FIRING

    def adopt(
        self,
        now: float,
        *,
        relay_on: bool,
        age_s: float | None = None,
        unseen_s: float = 0.0,
    ) -> str | None:
        """Take on a relay state Radiate did not command. Call before `step`.

        `relay_on`: the relay as observed. `age_s`: how long it has been in that state,
        if known; otherwise the change counts as now, so a full minimum burn or minimum
        off runs from now. `unseen_s`: how long the relay went unobserved before now.

        Returns "burn" when a burn was adopted (or its timer restarted after a gap),
        "stop" when a stop was adopted, "unseen" when minimum off restarts after a gap,
        or None when the relay is as the guard expects.
        """
        at = now - max(0.0, age_s) if age_s is not None else now
        hidden = unseen_s >= HIDDEN_RELAY_S
        s = self.state
        if relay_on:
            if s is BoilerState.FIRING:
                if not hidden:
                    return None
                # The watchdog may have stopped this burn and started another unseen.
                start = max(self.burn_started_at if self.burn_started_at is not None else at, at)
                if start == self.burn_started_at:
                    return None
                self.burn_started_at = start
                return "burn"
            # Someone else's burn: count it as a start and hold it for minimum burn.
            self._go(BoilerState.FIRING, at)
            self.burn_started_at = at
            self.starts.append(at)
            self.external, self.commanded = True, False
            return "burn"
        if s is BoilerState.FIRING:
            self._go(BoilerState.REST, at)
            self.burn_started_at = None
            self.external = False
            return "stop"
        if not hidden:
            return None
        # A burn may have ended unseen just now: minimum off from the latest it could.
        since = max(self.since, at) if s is BoilerState.REST else at
        if s is BoilerState.REST and since == self.since:
            return None
        self._go(BoilerState.REST, since)
        return "unseen"

    def _go(self, state: BoilerState, now: float) -> None:
        self.state = state
        self.since = now
