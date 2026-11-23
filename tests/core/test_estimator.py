import copy
import math
import random

import pytest

from radiate.core import estimator
from radiate.core.estimator import DEFAULT_MEMORY_DAYS, RoomEstimator, forgetting, local_slope


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


# --- memory and change detection (spec 4.3) ---------------------------------------------


def test_default_memory_is_two_years_of_learning():
    est = RoomEstimator.new()
    assert est.lam == forgetting(DEFAULT_MEMORY_DAYS) == 1.0 - 1.0 / (730 * 1440)
    assert RoomEstimator.new(memory_days=1).lam == 1.0 - 1.0 / 1440
    assert forgetting(0.1) == forgetting(1) and forgetting(1e6) == forgetting(3650)


def _feed(est, rng, a, samples, glitch=None):
    """Synthetic room: heating about a third of the time, b = 0.05, d = 0.1."""
    for i in range(samples):
        drive = rng.uniform(0.2, 0.6) if i % 180 < 60 else 0.0
        dout = 12 + 4 * math.sin(i / 230)
        slope = a * drive - 0.05 * dout + 0.1 + rng.gauss(0, 0.3)
        if glitch is not None and i in glitch:
            slope = 40.0
        est.update(slope, drive, dout)


def test_long_memory_relearns_a_radiator_that_lost_output(monkeypatch):
    # Thirty days of learning at a = 3 K/h, then the radiator loses 40 % of its output.
    days = estimator.UPDATES_PER_DAY
    est = RoomEstimator.new()
    rng = random.Random(4)
    _feed(est, rng, 3.0, 30 * days)
    assert abs(est.a - 3.0) < 0.2 and est.relearns == 0  # steady data: no false change
    stiff = copy.deepcopy(est)
    _feed(est, rng, 1.8, days)
    assert est.relearns >= 1 and abs(est.a - 1.8) < 0.3  # re-learned within a day
    # Without change detection, the long memory is still far off a day later.
    monkeypatch.setattr(estimator, "CHANGE_WARMUP", 10**12)
    monkeypatch.setattr(estimator, "CHANGE_CONFIDENT", 1.01)
    _feed(stiff, random.Random(4), 1.8, days)
    assert stiff.a > 2.6


def test_a_glitch_is_not_a_change():
    est = RoomEstimator.new()
    rng = random.Random(5)
    _feed(est, rng, 3.0, 5 * estimator.UPDATES_PER_DAY)
    _feed(est, rng, 3.0, 600, glitch=set(range(60, 66)))  # six wild samples while heating
    assert est.relearns == 0


def test_no_change_check_while_warming_up_from_priors(monkeypatch):
    # An uncertain model is not judged before the warm-up: it still moves on its own.
    monkeypatch.setattr(estimator, "CHANGE_CONFIDENT", 1.01)
    est = RoomEstimator.new()
    _feed(est, random.Random(6), 3.0, estimator.CHANGE_WARMUP - 1)
    assert est.relearns == 0 and est.change_detected() is None


def test_relearn_inflates_covariance_and_resets_the_statistics():
    est = RoomEstimator.new()
    _feed(est, random.Random(7), 3.0, 3 * estimator.UPDATES_PER_DAY)
    before = [est.p[i][i] for i in range(3)]
    est.relearn()
    for i in range(3):
        assert est.p[i][i] == pytest.approx(
            before[i] + estimator.RELEARN_INFLATION * est.p0_diag[i]
        )
    assert est.since_reset == 0 and est.gain_uu == 0.0 and est.relearns == 1


# --- a confident model that is wrong (spec 4.3 consistency) ----------------------------


def _wrongly_confident(rng):
    """A model trained while 'heat available' did not mean heat: the radiator drive was
    high but the room barely warmed (a dry run with the boiler on its own timer)."""
    est = RoomEstimator.new()
    _feed(est, rng, 0.15, 800)
    assert est.a < 0.5 and est.confidence > 0.8
    assert est.samples < estimator.CHANGE_WARMUP and est.relearns == 0
    return est


def test_watching_a_gated_sample_does_not_move_the_model():
    est = _wrongly_confident(random.Random(8))
    theta, p = list(est.theta), [list(row) for row in est.p]
    est.watch(5.0, 0.4, 10.0)
    assert est.theta == theta and est.p == p and est.samples == 800


def test_a_confident_wrong_model_is_relearned_from_the_samples_its_gate_holds_back():
    # The room really warms at 6 K/h at full drive. The residual is far above +1 K/h, so
    # `unexplained_heat` holds every heating sample back: they are only watched.
    rng = random.Random(9)
    est = _wrongly_confident(rng)
    for _ in range(90):
        drive = rng.uniform(0.3, 0.5)
        est.watch(6.0 * drive - 0.05 * 12 + 0.1, drive, 12.0)
        if est.relearns:
            break
    assert est.relearns == 1
    assert est.confidence < 0.6  # no longer trusted to call heat "unexplained"
    assert est.doubt == estimator.RELEARN_DOUBT_UPDATES


def test_doubt_counts_down_on_heating_updates_only():
    est = RoomEstimator.new()
    est.relearn()
    est.update(0.0, 0.0, 10.0)  # not heating: does not count
    assert est.doubt == estimator.RELEARN_DOUBT_UPDATES
    est.update(1.0, 0.4, 10.0)
    assert est.doubt == estimator.RELEARN_DOUBT_UPDATES - 1


def test_a_steady_confident_model_is_not_relearned_before_the_warm_up():
    est = RoomEstimator.new()
    _feed(est, random.Random(10), 3.0, estimator.CHANGE_WARMUP - 1)
    assert est.confidence > estimator.CHANGE_CONFIDENT
    assert est.relearns == 0
