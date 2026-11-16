"""Disturbance detection and learning gates (spec 4.6).

Detectors only flag; `decide` turns flags into learning gates and actuation.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .types import HeatSource, RoomConfig

WINDOW_DROP_K = 0.6
WINDOW_DROP_WINDOW_S = 5 * 60
WINDOW_HOLD_S = 30 * 60
SHOWER_RISE = 8.0
SHOWER_HOLD_S = 45 * 60
FIRE_RISE_KPH = 0.8
FIRE_RESIDUAL_KPH = 2.0
FIRE_VALVE_CLOSED_S = 30 * 60  # radiator must have been off this long
FIRE_MIN_CONFIDENCE = 0.6
FIRE_HOLDOFF_S = 4 * 3600
FIRE_CLEAR_S = 30 * 60
SPIKE_RESIDUAL_KPH = 1.0
SPIKE_HOLD_S = 60 * 60
RESIDUAL_RUN_S = 10 * 60
IDLE_DRIVE = 0.05


@dataclass(slots=True)
class DisturbanceState:
    window_until: float = 0.0
    shower_until: float = 0.0
    fire: bool = False
    fire_since: float = 0.0
    fire_quiet_since: float | None = None
    fire_holdoff_until: float = 0.0
    spike_until: float = 0.0
    residual_high_since: float | None = None
    humidity: list[tuple[float, float]] = field(default_factory=list)
    temps: list[tuple[float, float]] = field(default_factory=list)

    def learning_blocked(self, now: float) -> str | None:
        if self.fire:
            return "fire"
        if now < self.fire_holdoff_until:
            return "fire_holdoff"
        if now < self.window_until:
            return "window"
        if now < self.shower_until:
            return "shower"
        if now < self.spike_until:
            return "cooker_spike"
        return None


def update(
    st: DisturbanceState,
    cfg: RoomConfig,
    now: float,
    *,
    temperature: float | None,
    humidity: float | None,
    window_open: bool | None,
    fire_switch: bool | None,
    slope_kph: float | None,
    residual_kph: float | None,
    drive: float,
    closed_for_s: float = 0.0,
    confidence: float = 0.0,
) -> list[str]:
    """Advance detectors. Returns the names of flags that were newly raised."""
    raised: list[str] = []

    # Window: explicit sensor, or a sharp drop.
    if temperature is not None:
        st.temps.append((now, temperature))
        st.temps = [p for p in st.temps if now - p[0] <= WINDOW_DROP_WINDOW_S]
        if st.temps and max(t for _, t in st.temps) - temperature >= WINDOW_DROP_K:
            if now >= st.window_until:
                raised.append("window")
            st.window_until = now + WINDOW_HOLD_S
    if window_open:
        if now >= st.window_until:
            raised.append("window")
        st.window_until = now + WINDOW_HOLD_S

    # Shower: humidity jump against the 2 h median.
    if cfg.has_humidity and humidity is not None:
        st.humidity.append((now, humidity))
        st.humidity = [p for p in st.humidity if now - p[0] <= 2 * 3600]
        hs = sorted(h for _, h in st.humidity)
        median = hs[len(hs) // 2]
        if len(hs) >= 10 and humidity >= median + SHOWER_RISE:
            if now >= st.shower_until:
                raised.append("shower")
            st.shower_until = now + SHOWER_HOLD_S

    # Sustained positive residual (unexplained heat).
    if residual_kph is not None and residual_kph > SPIKE_RESIDUAL_KPH:
        if st.residual_high_since is None:
            st.residual_high_since = now
    else:
        st.residual_high_since = None
    sustained = (
        st.residual_high_since is not None and now - st.residual_high_since >= RESIDUAL_RUN_S
    )

    if cfg.heat_source is HeatSource.EPISODIC:
        evidence = bool(fire_switch)
        # Rising although the radiator has been off long enough to be cold.
        if (
            slope_kph is not None
            and slope_kph > FIRE_RISE_KPH
            and drive < IDLE_DRIVE
            and closed_for_s >= FIRE_VALVE_CLOSED_S
        ):
            evidence = True
        # Rising much faster than a well-learned model explains.
        if (
            sustained
            and confidence >= FIRE_MIN_CONFIDENCE
            and residual_kph is not None
            and residual_kph > FIRE_RESIDUAL_KPH
        ):
            evidence = True
        if evidence:
            if not st.fire:
                st.fire = True
                st.fire_since = now
                raised.append("fire")
            st.fire_quiet_since = None
        elif st.fire:
            # Clear once there has been no evidence for a while (and no manual switch).
            if st.fire_quiet_since is None:
                st.fire_quiet_since = now
            elif now - st.fire_quiet_since >= FIRE_CLEAR_S and not fire_switch:
                st.fire = False
                st.fire_holdoff_until = now + FIRE_HOLDOFF_S
    elif cfg.heat_source is HeatSource.CONTINUOUS:
        if sustained:
            if now >= st.spike_until:
                raised.append("cooker_spike")
            st.spike_until = now + SPIKE_HOLD_S
    elif sustained:
        # Sun, guests, cooking in an ordinary room: just do not learn from it.
        if now >= st.spike_until:
            raised.append("unexplained_heat")
        st.spike_until = now + SPIKE_HOLD_S

    return raised
