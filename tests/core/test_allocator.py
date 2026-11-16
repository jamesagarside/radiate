from radiate.core.allocator import AllocRoom, allocate
from radiate.core.valve import flow_fraction, opening_for

KW = dict(kappa=0.15, bypass=0.4, floor=20, horizon_max_h=2.5)


def test_valve_inverse_round_trips():
    for o in (10, 20, 35, 50, 69):
        assert abs(opening_for(flow_fraction(o)) - o) < 0.5
    assert flow_fraction(5) == 0.0
    assert flow_fraction(100) == 1.0


def test_no_rooms_is_empty():
    assert allocate([], **KW).openings == {}


def test_fast_room_is_throttled_to_pace_of_slow_room():
    rooms = [
        AllocRoom("near", gap_k=2.0, a=8.0, net_loss_kph=0.3),
        AllocRoom("far", gap_k=2.0, a=2.0, net_loss_kph=0.3),
    ]
    alloc = allocate(rooms, **KW)
    assert alloc.openings["far"] == 100
    assert alloc.openings["near"] < 60
    assert not alloc.capacity_limited


def test_opening_floor_is_respected():
    rooms = [
        AllocRoom("near", gap_k=0.2, a=12.0, net_loss_kph=0.0),
        AllocRoom("far", gap_k=3.0, a=2.0, net_loss_kph=0.3),
    ]
    assert allocate(rooms, **KW).openings["near"] >= 20


def test_capacity_limited_paces_at_horizon_not_full_open():
    rooms = [
        AllocRoom("near", gap_k=1.0, a=8.0, net_loss_kph=0.2),
        AllocRoom("hopeless", gap_k=5.0, a=1.0, net_loss_kph=0.3),
    ]
    alloc = allocate(rooms, **KW)
    assert alloc.capacity_limited
    assert alloc.openings["hopeless"] == 100
    assert alloc.openings["near"] < 100


def test_emitter_limited_room_does_not_set_pace():
    rooms = [
        AllocRoom("near", gap_k=1.0, a=8.0, net_loss_kph=0.2),
        AllocRoom("small_radiator", gap_k=3.0, a=1.0, net_loss_kph=0.3, eta=0.1),
    ]
    alloc = allocate(rooms, **KW)
    assert alloc.openings["near"] == 100  # nothing to gain by throttling
    assert alloc.openings["small_radiator"] == 100


def test_preheat_room_is_never_paced_past_its_deadline():
    # Reactive slow room would set a pace of hours; the preheating room has 30 min.
    rooms = [
        AllocRoom("late", gap_k=3.0, a=1.5, net_loss_kph=0.3),
        AllocRoom("preheat", gap_k=1.0, a=6.0, net_loss_kph=0.2, deadline_h=0.5),
    ]
    alloc = allocate(rooms, **KW)
    # preheat throttled at most to arrive by its own deadline, i.e. no slower than the pace
    assert (
        alloc.openings["preheat"]
        >= allocate(
            [AllocRoom("preheat", gap_k=1.0, a=6.0, net_loss_kph=0.2, deadline_h=0.5)], **KW
        ).openings["preheat"]
        - 1
    )


def test_preheat_room_with_slack_is_throttled():
    rooms = [AllocRoom("early", gap_k=1.0, a=8.0, net_loss_kph=0.2, deadline_h=2.0)]
    assert allocate(rooms, **KW).openings["early"] < 60
