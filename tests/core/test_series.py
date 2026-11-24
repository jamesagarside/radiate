"""Raw data series from a recorded tick (radiate.core.series)."""

from radiate.core.history import compact_actions, tick_data
from radiate.core.series import (
    BY_ID,
    METRICS,
    observed_values,
    series_key,
    split_key,
    tick_values,
)
from radiate.core.types import (
    Actions,
    BoilerState,
    RoomInput,
    Snapshot,
    ValveAction,
)


def _tick(observed=None):
    snap = Snapshot(
        now=600.0,
        minute_of_day=420,
        outdoor=4.5,
        rooms={
            "lounge": RoomInput(
                temperature=19.25,
                humidity=55.0,
                setpoint=20.0,
                trv_temperature=24.0,
                opening_echo=35,
                window_open=False,
            ),
            "stairs": RoomInput(temperature=17.0),
        },
        heating_relay=True,
        store_relay=False,
    )
    actions = Actions(
        valves={"lounge": ValveAction("lounge", 21.0, 40)},
        heating_relay=True,
        store_relay=False,
        boiler_state=BoilerState.FIRING,
    )
    compact = compact_actions(actions)
    if observed is not None:
        compact["observed"] = observed
    return tick_data(snap, compact)


def test_snapshot_and_action_values():
    v = tick_values(_tick())
    assert v["room.temperature@lounge"] == 19.25
    assert v["room.humidity@lounge"] == 55.0
    assert v["valve.temperature@lounge"] == 24.0
    assert v["valve.reported@lounge"] == 35.0
    assert v["valve.opening@lounge"] == 40.0
    assert v["room.window@lounge"] == 0.0
    assert v["room.temperature@stairs"] == 17.0
    assert v["outdoor.temperature"] == 4.5
    assert v["boiler.relay"] == 1.0
    assert v["boiler.demand"] == 1.0
    assert v["store.relay"] == 0.0
    assert v["boiler.state"] == BY_ID["boiler.state"].levels.index("firing")
    # Without observed values there is no setpoint, target, calling or people.
    assert not any(k.startswith(("room.setpoint", "room.target", "people.")) for k in v)


def test_observed_values_add_target_calling_setpoint_and_people():
    obs = observed_values(
        {"lounge": (20.5, True)}, {"burner": True, "heating_power_w": 182.4}, people=3, away=1
    )
    v = tick_values(_tick(obs))
    assert v["room.target@lounge"] == 20.5
    assert v["room.calling@lounge"] == 1.0
    assert v["room.setpoint@lounge"] == 20.0
    assert "room.setpoint@stairs" not in v  # not a room Radiate controls
    assert v["boiler.burner"] == 1.0
    assert v["boiler.power"] == 182.4
    assert v["people.home"] == 2.0
    assert v["people.away"] == 1.0


def test_people_are_counts_only():
    obs = observed_values({}, {}, people=2, away=2)
    assert obs == {"rooms": {}, "people": 2, "away": 2}
    assert observed_values({}, None, people=0, away=0) == {"rooms": {}}


def test_unreadable_ticks_give_nothing_or_what_they_can():
    assert tick_values(None) == {}
    assert tick_values({"snapshot": "x", "actions": 3}) == {}
    data = _tick()
    data["snapshot"]["rooms"]["lounge"]["temperature"] = float("nan")
    data["actions"]["boiler"] = "melting"
    v = tick_values(data)
    assert "room.temperature@lounge" not in v
    assert "boiler.state" not in v
    assert v["outdoor.temperature"] == 4.5


def test_keys_round_trip_and_every_metric_is_well_formed():
    # Each series' OpenTelemetry name is in radiate.export.telemetry, which checks that
    # every series has one (tests/server/test_telemetry_schema.py).
    assert split_key(series_key("room.temperature", "lounge")) == ("room.temperature", "lounge")
    assert split_key("boiler.relay") == ("boiler.relay", None)
    ids = [m.id for m in METRICS]
    assert len(set(ids)) == len(ids)
    for m in METRICS:
        assert m.kind in ("gauge", "state", "level")
        assert m.scope in ("room", "house")
        assert "—" not in m.description and "–" not in m.description
