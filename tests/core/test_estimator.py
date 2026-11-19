import random

from radiate.core.estimator import RoomEstimator, local_slope


def test_recovers_known_parameters():
    rng = random.Random(0)
    est = RoomEstimator.new()
    a, b, d = 3.0, 0.05, 0.1
    for _ in range(3000):
        drive = rng.choice([0.0, 0.0, rng.uniform(0.1, 0.6)])
        dout = rng.uniform(8, 18)
        slope = a * drive - b * dout + d + rng.gauss(0, 0.3)
        est.update(slope, drive, dout)
    assert abs(est.a - a) < 0.4
    assert abs(est.b - b) < 0.02
    assert est.confidence > 0.8


def test_bounds_hold_under_garbage():
    est = RoomEstimator.new()
    for i in range(500):
        est.update(50.0 if i % 2 else -50.0, 0.5, 10.0)
    lo_a, hi_a = est.bounds[0]
    assert lo_a <= est.a <= hi_a


def test_outliers_rejected_after_warmup():
    rng = random.Random(1)
    est = RoomEstimator.new()
    for _ in range(200):
        est.update(1.0 * 0.3 - 0.05 * 10 + rng.gauss(0, 0.2), 0.3, 10)
    before = est.rejected
    est.update(40.0, 0.3, 10)
    assert est.rejected == before + 1


def test_local_slope():
    pts = [(t * 60.0, 18.0 + 0.5 * t / 60.0) for t in range(16)]  # 0.5 K/h
    assert abs(local_slope(pts) - 0.5) < 1e-6
    assert local_slope(pts[:3]) is None


def test_confidence_cap():
    est = RoomEstimator.new(max_confidence=0.5)
    est.p[0][0] = 0.0  # as certain as it can be
    assert est.confidence == 0.5
