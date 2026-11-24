"""Room use in `eco` demand (spec 5.8): solo threshold, pooled demand, solo latch,
burn extension and heat sinks. `comfort` and rooms without room use are unchanged."""

import dataclasses
import json

import pytest

from radiate.core import (
    BoilerState,
    DemandMode,
    EngineState,
    HouseConfig,
    RoomConfig,
    RoomInput,
    RoomRole,
    RoomUse,
    Snapshot,
    decide,
)
from radiate.core.decide import (
    PREHEAT_MAX_S,
    PREHEAT_USE_MAX_S,
    SOLO_EXTRA_K,
    solo_threshold_c,
)
from radiate.core.history import decode_snapshot, encode_snapshot
from radiate.core.types import Actions, BoilerConfig

IN_USE, OCCASIONAL, SETBACK = RoomUse.IN_USE, RoomUse.OCCASIONAL, RoomUse.SETBACK

CFG = HouseConfig(
    rooms=(
        RoomConfig("office", "Office"),
        RoomConfig("bed", "Bedroom"),
        RoomConfig("lounge", "Lounge"),
        RoomConfig("stairs", "Stairs", role=RoomRole.PASSIVE),
    )
)


class House:
    """Scripted snapshots through `decide`, one a minute, the relay fed back."""

    def __init__(self, cfg: HouseConfig = CFG, gains: dict[str, float] | None = None):
        self.cfg = cfg
        self.st = EngineState.new(cfg)
        # Learned gains: 15 K/h, so a room's own gap is under the 12 minute pool.
        for rid, rs in self.st.rooms.items():
            rs.est.theta[0] = (gains or {}).get(rid, 15.0)
            rs.est.theta[1] = 0.1
            rs.est.theta[2] = 0.0
        self.now = 0.0
        self.relay = False
        self.reasons: list = []
        self.log: list[Actions] = []

    def snapshot(self, rooms: dict, mode: DemandMode | None = None) -> Snapshot:
        inputs = {}
        for rid, spec in rooms.items():
            temp, setpoint, use = spec[:3]
            extra = spec[3] if len(spec) > 3 else {}
            inputs[rid] = RoomInput(
                temperature=temp,
                trv_temperature=temp + 0.5,
                setpoint=setpoint,
                trv_heating=temp < setpoint,
                use=use,
                **extra,
            )
        inputs.setdefault("stairs", RoomInput(temperature=15.0))
        snap = Snapshot(
            now=self.now,
            minute_of_day=12 * 60,
            outdoor=5.0,
            rooms=inputs,
            heating_relay=self.relay,
            store_relay=False,
        )
        snap.demand_mode = mode
        return snap

    def run(self, minutes: int, rooms: dict, mode: DemandMode | None = None) -> Actions:
        acts = None
        for _ in range(minutes):
            acts = self.tick(self.snapshot(rooms, mode))
        return acts

    def tick(self, snap: Snapshot) -> Actions:
        acts = decide(self.cfg, snap, self.st)
        self.relay = acts.heating_relay
        self.reasons += acts.reasons
        self.log.append(acts)
        self.now += 60.0
        return acts

    def codes(self, room: str) -> set[str]:
        return {r.code for r in self.reasons if r.room_id == room}


def warm(**rooms) -> dict:
    """Every room at its target, in use, except those given."""
    base = {rid: (18.0, 18.0, IN_USE) for rid in ("office", "bed", "lounge")}
    return {**base, **rooms}


# --- the solo threshold ------------------------------------------------------------------


def test_solo_threshold_without_room_use_is_the_eco_limit():
    b = BoilerConfig()
    assert solo_threshold_c(18.0, None, b) == pytest.approx(16.5)
    # No damp floor for a room without room use: as before the slice.
    assert solo_threshold_c(12.5, None, b) == pytest.approx(11.0)


def test_solo_threshold_by_room_use_with_the_default_temperatures():
    b = BoilerConfig()
    assert SOLO_EXTRA_K == 1.0
    assert solo_threshold_c(19.0, IN_USE, b) == pytest.approx(17.5)
    assert solo_threshold_c(16.0, OCCASIONAL, b) == pytest.approx(13.5)
    assert b.damp_margin_k == 0.3
    # The damp floor plus its margin, so the air stays above the floor itself.
    assert solo_threshold_c(14.0, SETBACK, b) == pytest.approx(12.3)
    assert solo_threshold_c(11.0, SETBACK, b) == pytest.approx(11.0)  # at or under the floor
    assert solo_threshold_c(12.0, SETBACK, b) == pytest.approx(12.0)  # never above the target
    assert solo_threshold_c(13.0, IN_USE, b) == pytest.approx(12.3)


def test_solo_threshold_without_a_damp_margin_is_the_damp_floor():
    b = BoilerConfig(damp_margin_k=0.0)
    assert solo_threshold_c(14.0, SETBACK, b) == pytest.approx(12.0)
    assert solo_threshold_c(13.0, IN_USE, b) == pytest.approx(12.0)


# --- starting a burn alone ---------------------------------------------------------------


def test_in_use_room_alone_fires_past_the_eco_limit():
    h = House()
    acts = h.run(5, warm(office=(16.4, 18.0, IN_USE)))  # 1.6 K below
    assert acts.heating_relay
    h = House()
    acts = h.run(5, warm(office=(16.6, 18.0, IN_USE)))  # 1.4 K below
    assert not acts.heating_relay and acts.boiler_state is BoilerState.IDLE
    assert "demand.pooled" in h.codes("office")


def test_occasional_room_alone_waits_one_kelvin_longer():
    h = House()
    acts = h.run(5, warm(office=(15.4, 18.0, OCCASIONAL)))  # 2.6 K below
    assert acts.heating_relay
    h = House()
    acts = h.run(5, warm(office=(15.6, 18.0, OCCASIONAL)))  # 2.4 K below
    assert not acts.heating_relay
    assert "demand.pooled" in h.codes("office")


def test_setback_room_waits_then_fires_at_the_damp_floor_and_heats_to_its_target():
    h = House()
    acts = h.run(5, warm(lounge=(13.6, 14.0, SETBACK)))
    assert h.st.rooms["lounge"].calling and not acts.heating_relay
    assert "demand.setback" in h.codes("lounge")
    assert "demand.pooled" not in h.codes("lounge")
    waiting = next(r for r in h.reasons if r.code == "demand.setback")
    assert (
        waiting.message == "Lounge: not in use now, takes heat only when the boiler is already on"
    )

    h = House()
    acts = h.run(5, warm(lounge=(11.9, 14.0, SETBACK)))
    assert acts.heating_relay and acts.boiler_state is BoilerState.FIRING
    assert h.st.rooms["lounge"].solo
    floor = [r for r in h.reasons if r.code == "demand.floor"]
    assert len(floor) == 1
    assert floor[0].message == "Lounge: down to 11.9 °C, heating to 14.0 °C"
    assert floor[0].values == {"temperature_c": 11.9, "target_c": 14.0}
    # Warming past the floor, nobody else calling: the burn goes on to 14 °C.
    for temp in (12.4, 12.9, 13.3, 13.6, 13.9):
        acts = h.run(6, warm(lounge=(temp, 14.0, SETBACK)))
        assert acts.heating_relay, temp
    acts = h.run(1, warm(lounge=(14.0, 14.0, SETBACK)))
    assert not h.st.rooms["lounge"].calling and not h.st.rooms["lounge"].solo
    assert not acts.heating_relay


def test_setback_room_with_a_target_under_the_damp_floor_fires_as_soon_as_it_calls():
    h = House()
    acts = h.run(5, warm(lounge=(10.6, 11.0, SETBACK)))
    assert h.st.rooms["lounge"].calling
    assert acts.heating_relay


def test_frost_fires_for_a_setback_room():
    h = House()
    acts = h.run(5, warm(lounge=(6.9, 7.5, SETBACK)))
    assert acts.heating_relay


def test_preheating_setback_room_still_fires_and_keeps_the_burner():
    # Optimum start heats a room before its warm period: it is setback until then.
    soon = {"next_setpoint": 18.0, "next_setpoint_in_s": 3600.0}
    h = House(gains={"bed": 2.0})
    acts = h.run(5, warm(bed=(14.0, 14.0, SETBACK, soon)))
    assert h.st.rooms["bed"].preheating and acts.heating_relay
    acts = h.run(15, warm(bed=(14.5, 14.0, SETBACK, soon)))
    assert acts.heating_relay and acts.boiler_state is BoilerState.FIRING


def test_optimum_start_looks_further_ahead_for_a_room_with_room_use():
    # A room down at its damp floor needs longer than 3 hours to reach 18 °C: in eco,
    # a room with room use may start up to PREHEAT_USE_MAX_S ahead.
    assert PREHEAT_MAX_S == 3 * 3600 and PREHEAT_USE_MAX_S == 3.25 * 3600
    later = {"next_setpoint": 18.0, "next_setpoint_in_s": 3.1 * 3600}

    def preheating(use: RoomUse | None, mode: DemandMode | None = None) -> bool:
        h = House(gains={"bed": 1.0})
        h.run(1, warm(bed=(12.1, 14.0, use, later)), mode)
        return h.st.rooms["bed"].preheating

    assert preheating(SETBACK)
    assert not preheating(None)  # as before: 3 hours
    assert not preheating(SETBACK, DemandMode.COMFORT)  # comfort ignores room use
    beyond = {"next_setpoint": 18.0, "next_setpoint_in_s": 3.3 * 3600}
    h = House(gains={"bed": 1.0})
    h.run(1, warm(bed=(12.1, 14.0, SETBACK, beyond)))
    assert not h.st.rooms["bed"].preheating


# --- pooled demand -----------------------------------------------------------------------


def test_setback_room_does_not_count_in_pooled_demand():
    alone = House(gains={"office": 3.0})
    alone.run(1, warm(office=(17.6, 18.0, IN_USE)))
    both = House(gains={"office": 3.0, "lounge": 3.0})
    both.run(1, warm(office=(17.6, 18.0, IN_USE), lounge=(13.0, 14.0, SETBACK)))
    assert both.st.rooms["lounge"].calling
    assert both.st.pooled_demand_s == pytest.approx(alone.st.pooled_demand_s)
    assert alone.st.pooled_demand_s == pytest.approx(0.4 / 3.0 * 3600)


def test_pooled_demand_of_rooms_in_use_still_fires_together():
    # 0.6 K over 3 K/h each: 12 minutes each, 24 between them.
    h = House(gains={"office": 3.0, "bed": 3.0})
    acts = h.run(5, warm(office=(17.4, 18.0, IN_USE), bed=(17.4, 18.0, OCCASIONAL)))
    assert acts.heating_relay


# --- stopping ----------------------------------------------------------------------------


def _burn_then_satisfy(use: RoomUse | None) -> House:
    h = House()
    h.run(5, warm(office=(16.4, 18.0, IN_USE), lounge=(13.6, 14.0, use)))
    assert h.relay
    # The office reaches its target; the lounge still calls (no solo latch).
    h.run(12, warm(office=(18.0, 18.0, IN_USE), lounge=(13.6, 14.0, use)))
    return h


def test_setback_room_does_not_keep_a_burn_it_did_not_start():
    h = _burn_then_satisfy(SETBACK)
    assert h.st.rooms["lounge"].calling and not h.st.rooms["lounge"].solo
    assert not h.relay
    assert h.st.boiler.state is BoilerState.REST


def test_without_room_use_a_calling_room_keeps_the_burn_as_before():
    h = _burn_then_satisfy(None)
    assert h.relay


def test_setback_room_takes_heat_while_the_burn_runs_for_others():
    h = House()
    acts = h.run(5, warm(office=(16.4, 18.0, IN_USE), lounge=(13.6, 14.0, SETBACK)))
    assert acts.boiler_state is BoilerState.FIRING
    assert acts.valves["lounge"].setpoint > 14.0  # its TRV is asked to open
    assert "demand.setback" not in {r.code for r in acts.reasons}


# --- burn extension and heat sinks -------------------------------------------------------


def test_burn_extension_tops_up_rooms_in_use_never_setback_rooms():
    # One open radiator is sink enough here, so no room is opened as a heat sink first.
    h = House(dataclasses.replace(CFG, sink_min=1.4))
    rooms = warm(
        office=(16.4, 18.0, IN_USE), bed=(17.9, 18.0, IN_USE), lounge=(13.9, 14.0, SETBACK)
    )
    h.run(5, rooms)
    assert h.relay
    rooms["office"] = (18.0, 18.0, IN_USE)
    h.run(2, rooms)
    assert h.st.rooms["bed"].topup and h.st.rooms["bed"].extend
    assert not h.st.rooms["lounge"].extend
    topped = {r.room_id for r in h.reasons if r.code == "boiler.topup"}
    assert "bed" in topped and "lounge" not in topped


def test_heat_sinks_prefer_rooms_in_use():
    # The lounge is colder relative to its target, but set back: the bedroom goes first.
    h = House()
    acts = h.run(
        5,
        warm(office=(16.4, 18.0, IN_USE), bed=(18.5, 18.0, IN_USE), lounge=(14.0, 14.0, SETBACK)),
    )
    assert acts.boiler_state is BoilerState.FIRING
    assert h.st.rooms["bed"].topup and not h.st.rooms["lounge"].topup
    # Without room use it is coldest relative to target first, as before.
    h = House()
    h.run(
        5,
        warm(office=(16.4, 18.0, None), bed=(18.5, 18.0, None), lounge=(14.0, 14.0, None)),
    )
    assert h.st.rooms["lounge"].topup and not h.st.rooms["bed"].topup


def test_a_setback_room_is_still_a_heat_sink_of_last_resort():
    cfg = HouseConfig(rooms=(CFG.room("office"), CFG.room("lounge"), CFG.room("stairs")))
    h = House(cfg)
    acts = h.run(5, {"office": (16.4, 18.0, IN_USE), "lounge": (14.5, 14.0, SETBACK)})
    assert acts.boiler_state is BoilerState.FIRING
    assert h.st.rooms["lounge"].topup
    assert "boiler.dump_room" in h.codes("lounge")


# --- comfort, no room use and replay -----------------------------------------------------


def _script() -> list[dict]:
    """A day's worth of situations, minute by minute."""
    steps = []
    steps += [warm(office=(16.4, 18.0, IN_USE), lounge=(13.6, 14.0, SETBACK))] * 6
    steps += [warm(office=(17.2, 18.0, IN_USE), lounge=(13.8, 14.0, SETBACK))] * 10
    steps += [warm(office=(18.0, 18.0, IN_USE), lounge=(13.6, 14.0, SETBACK))] * 20
    steps += [warm(bed=(15.6, 18.0, OCCASIONAL), lounge=(11.9, 14.0, SETBACK))] * 10
    steps += [warm(bed=(17.0, 18.0, OCCASIONAL), lounge=(13.0, 14.0, SETBACK))] * 20
    steps += [warm(lounge=(14.2, 14.0, SETBACK))] * 20
    return steps


def _strip_use(rooms: dict) -> dict:
    return {rid: (t, sp, None) for rid, (t, sp, _) in rooms.items()}


def _view(acts: Actions) -> tuple:
    return (
        acts.heating_relay,
        acts.boiler_state,
        {rid: (v.setpoint, v.opening) for rid, v in acts.valves.items()},
        [(r.code, r.room_id) for r in acts.reasons],
    )


def test_comfort_ignores_room_use():
    a, b = House(), House()
    for rooms in _script():
        acts_a = a.tick(a.snapshot(rooms, DemandMode.COMFORT))
        acts_b = b.tick(b.snapshot(_strip_use(rooms), DemandMode.COMFORT))
        assert _view(acts_a) == _view(acts_b)


def test_eco_with_room_use_changes_the_script():
    # The script above is not a trivial one: in eco, room use changes what happens.
    a, b = House(), House()
    for rooms in _script():
        a.tick(a.snapshot(rooms))
        b.tick(b.snapshot(_strip_use(rooms)))
    assert [_view(x) for x in a.log] != [_view(x) for x in b.log]


def test_replay_through_the_tick_history_decides_the_same():
    live, replay = House(), House()
    for rooms in _script():
        snap = live.snapshot(rooms)
        back = decode_snapshot(json.loads(json.dumps(encode_snapshot(snap))))
        assert back == snap
        assert _view(live.tick(snap)) == _view(replay.tick(back))


def test_room_state_carries_this_ticks_use():
    h = House()
    h.run(1, warm(lounge=(13.6, 14.0, SETBACK)))
    assert h.st.rooms["lounge"].use is SETBACK
    assert h.st.rooms["office"].use is IN_USE
    h.run(1, warm(lounge=(13.6, 14.0, None)))
    assert h.st.rooms["lounge"].use is None


def test_a_room_with_no_room_use_has_no_latch():
    # 1.6 K below fires; warmed to 1.4 K below while still idle, it waits again (5.3).
    cfg = dataclasses.replace(
        CFG, boiler=dataclasses.replace(CFG.boiler, min_off_s=3600.0, min_burn_s=60.0)
    )
    h = House(cfg)
    h.st.boiler.state = BoilerState.REST
    h.st.boiler.since = 0.0
    h.run(2, warm(office=(16.4, 18.0, None)))
    assert h.st.rooms["office"].solo
    h.run(1, warm(office=(16.6, 18.0, None)))
    assert not h.st.rooms["office"].solo
