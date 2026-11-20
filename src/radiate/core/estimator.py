"""Per-room online learning of the room model (spec 4.3).

    dT/dt = a * drive - b * (T - T_out) + d

`drive` is the low-pass radiator drive (supply factor x flow fraction x heat
availability). Units: K/h for rates, 1/h for b. Solved with recursive least squares,
forgetting, priors and hard bounds. Pure Python, no numpy, so it runs anywhere
(Home Assistant App, Raspberry Pi, cloud edge).

The memory is long (`learning.memory_days`, two years by default), so an odd week
barely moves a model. A long memory alone would take months to follow a real change,
such as a radiator bled, replaced or silting up, so each model also watches its own
residuals (change detection). When they stay biased, it inflates its covariance and
re-learns from the data that follows, then carries on with the long memory.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

# (prior mean, prior standard deviation, lower bound, upper bound)
PRIOR_A = (1.5, 1.5, 0.1, 12.0)
PRIOR_B = (0.08, 0.06, 0.005, 0.6)
PRIOR_D = (0.0, 0.05, -0.5, 3.0)
PRIOR_D_CONTINUOUS = (0.3, 1.0, -0.5, 3.0)

NOISE_SD = 0.6  # K/h, residual scale used to normalise updates
OUTLIER_SD = 4.0  # after the first 30 updates, larger innovations are rejected

# Memory, counted in learning updates: one per minute tick that passes every gate.
UPDATES_PER_DAY = 1440
DEFAULT_MEMORY_DAYS = 730.0  # two heating seasons (spec 4.3)
MEMORY_DAYS_MIN = 1.0
MEMORY_DAYS_MAX = 3650.0

# Change detection (spec 4.3), tuned in the simulator on radiators that lose or gain
# output part-way through a run. The statistics are exponential averages over learning
# updates of the innovation (clipped to the outlier limit, rejected samples included)
# and the drive.
CHANGE_GAIN_WINDOW = 360  # updates: about 6 h of learning
CHANGE_GAIN_SHARE = 0.35  # drive-weighted residual bias, as a share of the heating gain
CHANGE_MIN_DRIVE_SQ = 0.02  # mean squared drive: enough heating in the window to judge
CHANGE_LEVEL_WINDOW = 1440  # updates: about a day of learning
CHANGE_LEVEL_SHARE = 0.5  # mean residual, as a share of its root mean square
CHANGE_WARMUP = 2 * UPDATES_PER_DAY  # updates from priors before the first check
RELEARN_INFLATION = 0.3  # covariance added on a change, as a share of the prior's


def forgetting(memory_days: float) -> float:
    """RLS forgetting factor for a memory of `memory_days` days of learning updates."""
    days = min(MEMORY_DAYS_MAX, max(MEMORY_DAYS_MIN, memory_days))
    return 1.0 - 1.0 / (days * UPDATES_PER_DAY)


@dataclass(slots=True)
class RoomEstimator:
    theta: list[float]
    p: list[list[float]]
    p0_trace: float
    bounds: tuple[tuple[float, float], ...]
    samples: int = 0
    rejected: int = 0
    residual_var: float = NOISE_SD**2
    prior_sd_a: float = PRIOR_A[1]
    max_confidence: float = 1.0  # lower for rooms measured only by the TRV (spec 4.6)
    lam: float = forgetting(DEFAULT_MEMORY_DAYS)
    p0_diag: tuple[float, ...] = ()  # prior variances, for re-learning after a change
    # Change detection: averages since the last reset of the innovation e and the drive
    # u. Gain window: e*u, u*u and e*e. Level window: e and e*e.
    gain_eu: float = 0.0
    gain_uu: float = 0.0
    gain_ee: float = 0.0
    level_e: float = 0.0
    level_ee: float = 0.0
    since_reset: int = 0  # learning updates since the statistics were last reset
    relearns: int = 0  # changes detected so far

    @classmethod
    def new(
        cls,
        continuous_source: bool = False,
        max_confidence: float = 1.0,
        memory_days: float = DEFAULT_MEMORY_DAYS,
    ) -> RoomEstimator:
        priors = (PRIOR_A, PRIOR_B, PRIOR_D_CONTINUOUS if continuous_source else PRIOR_D)
        theta = [p[0] for p in priors]
        p = [[0.0] * 3 for _ in range(3)]
        for i, pr in enumerate(priors):
            p[i][i] = (pr[1] / NOISE_SD) ** 2
        return cls(
            theta=theta,
            p=p,
            p0_trace=sum(p[i][i] for i in range(3)),
            bounds=tuple((pr[2], pr[3]) for pr in priors),
            max_confidence=max_confidence,
            lam=forgetting(memory_days),
            p0_diag=tuple(p[i][i] for i in range(3)),
        )

    @property
    def a(self) -> float:
        return self.theta[0]

    @property
    def b(self) -> float:
        return self.theta[1]

    @property
    def d(self) -> float:
        return self.theta[2]

    @property
    def confidence(self) -> float:
        """0..1, how far the heating gain's uncertainty has shrunk from the prior."""
        sd_a = math.sqrt(max(self.p[0][0], 0.0)) * NOISE_SD
        return max(0.0, min(self.max_confidence, 1.0 - sd_a / self.prior_sd_a))

    def predict(self, drive: float, delta_out: float) -> float:
        return self.theta[0] * drive - self.theta[1] * delta_out + self.theta[2]

    def residual(self, slope: float, drive: float, delta_out: float) -> float:
        return slope - self.predict(drive, delta_out)

    def update(self, slope: float, drive: float, delta_out: float) -> bool:
        """One RLS step. Returns False if the sample was rejected as an outlier."""
        x = (drive, -delta_out, 1.0)
        err = slope - sum(t * xi for t, xi in zip(self.theta, x, strict=True))
        self._watch(err, drive)
        sd = math.sqrt(self.residual_var)
        if self.samples > 30 and abs(err) > OUTLIER_SD * sd:
            self.rejected += 1
            return False

        lam = self.lam
        px = [sum(self.p[i][j] * x[j] for j in range(3)) for i in range(3)]
        denom = lam + sum(x[i] * px[i] for i in range(3))
        k = [v / denom for v in px]
        self.theta = [self.theta[i] + k[i] * err for i in range(3)]
        self.p = [[(self.p[i][j] - k[i] * px[j]) / lam for j in range(3)] for i in range(3)]
        # Anti-windup: forgetting inflates P when the input is not exciting.
        trace = sum(self.p[i][i] for i in range(3))
        if trace > self.p0_trace:
            scale = self.p0_trace / trace
            self.p = [[v * scale for v in row] for row in self.p]

        self.theta = [
            min(hi, max(lo, v)) for v, (lo, hi) in zip(self.theta, self.bounds, strict=True)
        ]
        self.residual_var = 0.995 * self.residual_var + 0.005 * err * err
        self.samples += 1
        return True

    def change_detected(self) -> str | None:
        """Which statistic shows a change, if any: `gain` or `level`.

        Gain: the residual's least-squares slope against the drive is a large share of
        the heating gain, so the radiator heats the room more or less than the model
        says. Not judged while the gain sits on the bound it is being pushed past.
        Level: the residual's mean is a large share of its root mean square, so the
        room loses or gains heat the model does not explain.
        """
        if self.samples < CHANGE_WARMUP:
            return None
        if self.since_reset >= CHANGE_GAIN_WINDOW and self.gain_uu >= CHANGE_MIN_DRIVE_SQ:
            bias = self.gain_eu / self.gain_uu
            lo, hi = self.bounds[0]
            pinned = (bias > 0 and self.a >= 0.99 * hi) or (bias < 0 and self.a <= 1.01 * lo)
            if not pinned and abs(bias) >= CHANGE_GAIN_SHARE * self.a:
                return "gain"
        if (
            self.since_reset >= CHANGE_LEVEL_WINDOW
            and self.level_ee > 0
            and abs(self.level_e) >= CHANGE_LEVEL_SHARE * math.sqrt(self.level_ee)
        ):
            return "level"
        return None

    def _watch(self, err: float, drive: float) -> None:
        """Change detection: track the innovation, and re-learn when it stays biased."""
        if self.samples > 30:
            # One glitch is not a change: count each sample at most at the outlier limit.
            limit = OUTLIER_SD * math.sqrt(self.residual_var)
            err = max(-limit, min(limit, err))
        g = 1.0 / CHANGE_GAIN_WINDOW
        lv = 1.0 / CHANGE_LEVEL_WINDOW
        self.gain_eu += g * (err * drive - self.gain_eu)
        self.gain_uu += g * (drive * drive - self.gain_uu)
        self.gain_ee += g * (err * err - self.gain_ee)
        self.level_e += lv * (err - self.level_e)
        self.level_ee += lv * (err * err - self.level_ee)
        self.since_reset += 1
        if self.change_detected() is not None:
            self.relearn()

    def relearn(self) -> None:
        """Re-learn after a change.

        Adds part of the prior covariance back, so the data that follows outweighs the
        long memory, and widens the outlier limit to the recent residuals so the new
        behaviour is not rejected as outliers. The long memory then carries on.
        """
        for i, p0 in enumerate(self.p0_diag):
            self.p[i][i] += RELEARN_INFLATION * p0
        self.residual_var = max(self.residual_var, self.gain_ee, self.level_ee)
        self.gain_eu = self.gain_uu = self.gain_ee = 0.0
        self.level_e = self.level_ee = 0.0
        self.since_reset = 0
        self.relearns += 1

    def to_dict(self) -> dict:
        return {
            "theta": self.theta,
            "p": self.p,
            "samples": self.samples,
            "rejected": self.rejected,
            "residual_var": self.residual_var,
        }


def local_slope(points: list[tuple[float, float]], min_span_s: float = 600) -> float | None:
    """Least-squares slope (K/h) of (time_s, temperature) points, or None if too short."""
    if len(points) < 4 or points[-1][0] - points[0][0] < min_span_s:
        return None
    n = len(points)
    t0 = points[0][0]
    ts = [(t - t0) / 3600.0 for t, _ in points]
    ys = [y for _, y in points]
    mt = sum(ts) / n
    my = sum(ys) / n
    sxx = sum((t - mt) ** 2 for t in ts)
    if sxx <= 0:
        return None
    return sum((t - mt) * (y - my) for t, y in zip(ts, ys, strict=True)) / sxx
