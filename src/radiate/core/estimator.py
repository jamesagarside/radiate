"""Per-room online learning of the room model (spec 4.3).

    dT/dt = a * drive - b * (T - T_out) + d

`drive` is the low-pass radiator drive (supply factor x flow fraction x heat
availability). Units: K/h for rates, 1/h for b. Solved with recursive least squares,
forgetting, priors and hard bounds. Pure Python, no numpy, so it runs anywhere
(Home Assistant App, Raspberry Pi, cloud edge).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

# (prior mean, prior standard deviation, lower bound, upper bound)
PRIOR_A = (1.5, 1.5, 0.1, 12.0)
PRIOR_B = (0.08, 0.06, 0.005, 0.6)
PRIOR_D = (0.0, 0.05, -0.5, 3.0)
PRIOR_D_CONTINUOUS = (0.3, 1.0, -0.5, 3.0)

# Memory of roughly 3 days of 1-minute heating samples.
FORGETTING = 1.0 - 1.0 / 2000.0
NOISE_SD = 0.6  # K/h, residual scale used to normalise updates


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
    _hist: list[float] = field(default_factory=list)

    @classmethod
    def new(cls, continuous_source: bool = False, max_confidence: float = 1.0) -> RoomEstimator:
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
        sd = math.sqrt(self.residual_var)
        if self.samples > 30 and abs(err) > 4.0 * sd:
            self.rejected += 1
            return False

        lam = FORGETTING
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
