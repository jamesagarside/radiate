"""House suggestions (radiate.core.suggestions): advice from the learned room models,
the valve checks and the Zigbee devices, and nothing without enough data behind it.

The learned values below are taken from the simulated reference house after five days
of learning (`radiate serve --demo`), with one room made draughty, one radiator made
small and one valve made to pass water when shut.
"""

import dataclasses
import json

from radiate.core import EngineState, HeatSource, HouseConfig, RoomConfig, RoomRole
from radiate.core.estimator import NOISE_SD, PRIOR_A, PRIOR_B
from radiate.core.suggestions import (
    LEARNING,
    NOT_JUDGED,
    READY,
    DeviceLink,
    loss_confidence,
    report_view,
    suggest,
)
from radiate.core.types import SuggestionConfig

CFG = HouseConfig(
    rooms=(
        RoomConfig("bedroom_1", "Bedroom 1"),
        RoomConfig("bedroom_2", "Bedroom 2"),
        RoomConfig("bedroom_3", "Bedroom 3"),
        RoomConfig("bathroom", "Bathroom"),
        RoomConfig("dining", "Dining room"),
        RoomConfig("lounge", "Lounge", heat_source=HeatSource.EPISODIC),
        RoomConfig("kitchen", "Kitchen", heat_source=HeatSource.CONTINUOUS),
        RoomConfig("toilet", "Toilet", role=RoomRole.INTERNAL_SENSOR_ONLY),
        RoomConfig("stairs", "Stairs", role=RoomRole.PASSIVE),
        RoomConfig("utility", "Utility room", role=RoomRole.UNHEATED),
    )
)

# (heating gain a in K/h, heat loss b in 1/h, steady heat d in K/h) after five days.
HEALTHY = {
    "bedroom_1": (3.06, 0.037, -0.07),
    "bedroom_2": (2.70, 0.035, -0.02),
    "bedroom_3": (1.74, 0.031, 0.11),
    "bathroom": (3.01, 0.027, -0.10),
    "dining": (5.33, 0.032, -0.15),
    "lounge": (4.42, 0.037, -0.04),
    "kitchen": (4.23, 0.074, 1.17),  # the range cooker's heat and its loss trade off
    "toilet": (7.20, 0.044, 0.00),
}
# Arrival lags in minutes, the last few burns.
LAGS = {
    "bedroom_1": [13, 14, 12, 13, 15, 13],
    "bedroom_2": [25, 24, 26, 25, 27],
    "bedroom_3": [26, 25, 27, 26, 28, 26],
    "bathroom": [15, 16, 14, 15, 15],
    "dining": [12, 12, 11, 13, 12],
    "lounge": [15, 14, 16, 15, 15],
    "kitchen": [11, 11, 12, 10, 11],
    "toilet": [11, 10, 12, 11, 11],
}


def learned(
    cfg: HouseConfig = CFG,
    models: dict | None = None,
    hours: float = 100.0,
    confidence: float = 0.95,
    lags: dict | None = None,
) -> EngineState:
    """Engine state with every controllable room's model learned to `models`."""
    st = EngineState.new(cfg)
    for rid, (a, b, d) in (models or HEALTHY).items():
        est = st.rooms[rid].est
        est.theta = [a, b, d]
        est.samples = round(hours * 60)
        # Shrink the covariance so the gain and loss are `confidence` certain.
        est.p[0][0] = ((1 - confidence) * PRIOR_A[1] / NOISE_SD) ** 2
        est.p[1][1] = ((1 - confidence) * PRIOR_B[1] / NOISE_SD) ** 2
        st.rooms[rid].target = 20.0
    for rid, minutes in (lags or {}).items():
        st.rooms[rid].lag_samples = [m * 60.0 for m in minutes]
    return st


def kinds(report) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for s in report.suggestions:
        out.setdefault(s.kind, []).append(s.room_id)
    return out


# --- not enough data -------------------------------------------------------------------


def test_a_new_house_gets_no_room_suggestions_only_learning_progress():
    report = suggest(CFG, EngineState.new(CFG))
    assert report.suggestions == []
    learning = {r.room_id: r for r in report.learning}
    # Passive and unheated rooms have no model, so they are not listed.
    assert set(learning) == set(HEALTHY)
    assert learning["bedroom_1"].status == LEARNING
    assert learning["bedroom_1"].note == (
        "0 h of learning so far. Suggestions start after 48 h, so about 48 h to go."
    )
    assert learning["toilet"].status == NOT_JUDGED
    assert "Measured only by its valve" in learning["toilet"].note
    assert report.rooms_compared == 0


def test_a_few_hours_of_learning_is_not_enough_however_certain():
    st = learned(hours=20)
    st.rooms["bedroom_3"].est.theta = [0.34, 0.032, 0.29]  # would be far too small
    report = suggest(CFG, st)
    assert report.suggestions == []
    note = next(r.note for r in report.learning if r.room_id == "bedroom_3")
    assert note == "20 h of learning so far. Suggestions start after 48 h, so about 28 h to go."


def test_enough_hours_but_an_uncertain_model_says_so():
    report = suggest(CFG, learned(confidence=0.4))
    assert report.suggestions == []
    note = next(r.note for r in report.learning if r.room_id == "bedroom_1")
    assert note == (
        "100 h of learning, but the model is 40% certain and suggestions need 60%. "
        "It needs more heating and cooling to learn from."
    )


def test_a_healthy_house_gets_nothing_to_act_on():
    report = suggest(CFG, learned(lags=LAGS), targets={r: 20.0 for r in HEALTHY})
    assert report.suggestions == []
    statuses = {r.room_id: r.status for r in report.learning}
    assert statuses["bedroom_1"] == READY and statuses["toilet"] == NOT_JUDGED
    assert statuses["kitchen"] == NOT_JUDGED
    kitchen = next(r.note for r in report.learning if r.room_id == "kitchen")
    assert kitchen.startswith("Its steady heat source, such as a range cooker")
    assert report.rooms_compared == 6


# --- heat loss -------------------------------------------------------------------------


def test_a_draughty_room_is_compared_with_the_house():
    models = {**HEALTHY, "bedroom_2": (1.75, 0.115, 0.57)}
    report = suggest(CFG, learned(models=models))
    loss = [s for s in report.suggestions if s.kind == "room.heat_loss"]
    assert [s.room_id for s in loss] == ["bedroom_2"]
    s = loss[0]
    assert s.severity == "consider"
    assert s.title == "Bedroom 2 loses heat quickly"
    # Typical: the median of the six comparable rooms' losses, (0.032 + 0.037) / 2.
    assert s.evidence == (
        "With the heating off and 15° between inside and outside, Bedroom 2 cools by "
        "about 1.7° an hour. That is 3.3 times the house's typical 0.5° an hour."
    )
    assert "draughts" in s.action and "chimney" not in s.action
    assert s.confidence == "high"
    assert s.basis == "From 100 h of learning, compared with 6 rooms."
    assert s.values["ratio"] == 3.33


def test_the_lounge_gets_the_chimney_hint():
    models = {**HEALTHY, "lounge": (4.42, 0.09, -0.04)}
    report = suggest(CFG, learned(models=models))
    s = next(s for s in report.suggestions if s.kind == "room.heat_loss")
    assert s.room_id == "lounge" and "An open chimney" in s.action


def test_a_continuous_heat_source_room_is_never_judged():
    # Seen in simulation: the cooker's heat took over the fit and the gain collapsed.
    models = {**HEALTHY, "kitchen": (0.27, 0.2, 1.11)}
    report = suggest(CFG, learned(models=models), targets={"kitchen": 20.0})
    assert not {k for k, rooms in kinds(report).items() if "kitchen" in rooms}


def test_too_few_rooms_ready_means_no_comparison():
    cfg = dataclasses.replace(CFG, suggestions=SuggestionConfig(min_rooms=3))
    st = learned(models={**HEALTHY, "bedroom_2": (1.75, 0.115, 0.57)})
    for rid in ("bedroom_3", "bathroom", "dining", "lounge"):
        st.rooms[rid].est.samples = 600  # 10 h: still learning
    report = suggest(cfg, st)
    assert report.rooms_compared == 2
    assert "room.heat_loss" not in kinds(report)


def test_the_ratio_is_a_setting():
    models = {**HEALTHY, "bedroom_2": (2.70, 0.06, -0.02)}  # 1.7 times the typical
    assert kinds(suggest(CFG, learned(models=models)))["room.heat_loss"] == ["bedroom_2"]
    strict = dataclasses.replace(CFG, suggestions=SuggestionConfig(heat_loss_ratio=2.0))
    assert "room.heat_loss" not in kinds(suggest(strict, learned(models=models)))


# --- radiator size ---------------------------------------------------------------------


def test_a_small_radiator_says_when_the_room_would_fall_short():
    models = {**HEALTHY, "bedroom_3": (0.34, 0.032, 0.29)}
    report = suggest(CFG, learned(models=models), targets={"bedroom_3": 20.0})
    s = next(s for s in report.suggestions if s.kind == "radiator.undersized")
    assert s.room_id == "bedroom_3"
    # Eight valves fully open: supply 1 / (1 + 0.15 * (8 + 0.4)) = 0.44; the room can
    # rise (0.34 * 0.44 + 0.29) / 0.032 = 13.8 K above outdoors, short below 6.2°.
    assert s.values["rise_k"] == 13.8 and s.values["short_below_c"] == 6.2
    assert s.severity == "act"  # short even on a mild day (above 5°)
    assert s.title == "Bedroom 3's radiator may be too small"
    assert s.evidence == (
        "Radiate's model of Bedroom 3 says that with every radiator on, it can keep the "
        "room about 14° above the outside temperature. So it would fall short of 20° "
        "whenever it is colder than about 6° outside."
    )
    assert s.action.startswith("Bleed the radiator")


def test_a_radiator_short_only_in_cold_weather_is_one_to_consider():
    models = {**HEALTHY, "bedroom_3": (0.6, 0.032, 0.1)}  # rises 11.4 K above outdoors
    report = suggest(CFG, learned(models=models), targets={"bedroom_3": 18.0})
    s = next(s for s in report.suggestions if s.kind == "radiator.undersized")
    assert s.values["short_below_c"] == 6.6 and s.severity == "act"
    report = suggest(CFG, learned(models=models), targets={"bedroom_3": 15.0})
    s = next(s for s in report.suggestions if s.kind == "radiator.undersized")
    assert s.values["short_below_c"] == 3.6 and s.severity == "consider"


def test_the_warmest_setpoint_decides_and_the_design_temperature_is_a_setting():
    models = {**HEALTHY, "bedroom_3": (0.9, 0.032, 0.0)}  # rises 12.4 K
    st = learned(models=models)
    assert "radiator.undersized" not in kinds(suggest(CFG, st, targets={"bedroom_3": 10.0}))
    assert "radiator.undersized" in kinds(suggest(CFG, st, targets={"bedroom_3": 21.0}))
    mild = dataclasses.replace(
        CFG, suggestions=SuggestionConfig(design_outdoor_c=9.0, mild_outdoor_c=12.0)
    )
    assert "radiator.undersized" not in kinds(suggest(mild, st, targets={"bedroom_3": 21.0}))


def test_a_draughty_room_that_falls_short_points_at_the_draught_first():
    models = {**HEALTHY, "bedroom_2": (1.75, 0.115, 0.57)}
    report = suggest(CFG, learned(models=models), targets={"bedroom_2": 20.0})
    s = next(s for s in report.suggestions if s.kind == "radiator.undersized")
    assert s.room_id == "bedroom_2"
    assert s.action.startswith("Bedroom 2 also loses heat quickly")


def test_a_gain_on_its_bound_is_not_judged():
    models = {**HEALTHY, "bedroom_3": (PRIOR_A[3], 2.0, 0.0)}
    assert "radiator.undersized" not in kinds(suggest(CFG, learned(models=models)))


# --- slow to warm ----------------------------------------------------------------------


def test_a_slow_radiator_needs_enough_arrivals():
    lags = {**LAGS, "bedroom_3": [48, 50, 47, 52, 49, 50, 51]}
    report = suggest(CFG, learned(lags=lags))
    s = next(s for s in report.suggestions if s.kind == "radiator.slow_to_warm")
    assert s.room_id == "bedroom_3" and s.severity == "info"
    assert s.evidence == (
        "After the boiler starts, Bedroom 3's radiator usually takes about 50 min to "
        "warm, against 14 min for the house."
    )
    assert s.confidence == "medium" and s.basis == "From the last 7 times its radiator warmed."
    few = {**LAGS, "bedroom_3": [48, 50, 47]}
    assert "radiator.slow_to_warm" not in kinds(suggest(CFG, learned(lags=few)))


def test_a_few_minutes_more_is_not_slow():
    lags = {rid: [4, 4, 4, 4, 4] for rid in LAGS} | {"bedroom_3": [9, 9, 9, 9, 9]}
    assert "radiator.slow_to_warm" not in kinds(suggest(CFG, learned(lags=lags)))


# --- valve passing heat ----------------------------------------------------------------


def test_a_valve_flagged_as_leaking_becomes_a_suggestion():
    st = learned()
    v = st.rooms["dining"].valve
    v.leak_history, v.leaking = [False, True, False, True, True], True
    st.rooms["bedroom_1"].valve.leak_history = [True, False, False]  # once: not flagged
    report = suggest(CFG, st)
    assert kinds(report) == {"valve.passing": ["dining"]}
    s = report.suggestions[0]
    assert s.severity == "act" and s.confidence == "high"
    assert s.evidence == (
        "Dining room's radiator warmed while its valve was shut in 3 of the last 5 "
        "burns Radiate could judge."
    )
    assert s.action.startswith("Recalibrate the valve")


# --- Zigbee ----------------------------------------------------------------------------


def test_weak_links_before_a_scan_are_one_low_confidence_suggestion():
    devices = [
        DeviceLink("temp_bathroom", "Bathroom room sensor", 28, True, "bathroom", "Bathroom"),
        DeviceLink("trv_bedroom_3", "Bedroom 3 TRV", 35, True, "bedroom_3", "Bedroom 3"),
        DeviceLink("trv_lounge", "Lounge TRV", 182, True, "lounge", "Lounge"),
        DeviceLink("plug_garage", "Router plug_garage", 12, False),  # offline: an alert
    ]
    report = suggest(CFG, EngineState.new(CFG), devices=devices, weak_lqi=40)
    assert kinds(report) == {"zigbee.weak_link": [None]}
    s = report.suggestions[0]
    assert s.title == "Weak Zigbee signal at 2 devices"
    assert s.evidence == (
        "Bathroom room sensor (LQI 28) and Bedroom 3 TRV (LQI 35) have a weak signal, below LQI 40."
    )
    assert "Scan the network on the Devices tab to see which router they talk through." in (
        s.action
    )
    assert s.confidence == "low" and s.id == "zigbee.weak_link:unscanned"


def test_weak_links_after_a_scan_are_grouped_by_router():
    devices = [
        DeviceLink(
            "temp_bathroom",
            "Bathroom room sensor",
            28,
            True,
            "bathroom",
            "Bathroom",
            via="plug_landing",
            via_label="plug_landing",
            via_kind="router",
            route_lqi=31,
        ),
        DeviceLink(
            "trv_kitchen",
            "Kitchen TRV",
            90,
            True,
            "kitchen",
            "Kitchen",
            via="Coordinator",
            via_label="Coordinator",
            via_kind="coordinator",
            route_lqi=33,
        ),
    ]
    report = suggest(CFG, EngineState.new(CFG), devices=devices, weak_lqi=40)
    by_id = {s.id: s for s in report.suggestions}
    landing = by_id["zigbee.weak_link:plug_landing"]
    assert landing.room_id == "bathroom" and landing.room_name == "Bathroom"
    assert landing.evidence == (
        "Bathroom room sensor (LQI 28) has a weak signal, below LQI 40. It talks through "
        "the router plug_landing."
    )
    assert landing.action == (
        "A mains-powered Zigbee router, such as a smart plug, placed between it and the "
        "router plug_landing would give it a stronger path."
    )
    assert landing.confidence == "medium"  # its own reading and the scan agree
    coordinator = by_id["zigbee.weak_link:Coordinator"]
    assert "(LQI 33)" in coordinator.evidence and "the coordinator" in coordinator.evidence
    assert coordinator.confidence == "low"  # only the scan saw it weak


# --- the API body ----------------------------------------------------------------------


def test_view_orders_by_severity_and_reads_as_plain_text():
    models = {**HEALTHY, "bedroom_2": (1.75, 0.115, 0.57), "bedroom_3": (0.34, 0.032, 0.29)}
    st = learned(models=models, lags=LAGS)
    st.rooms["dining"].valve.leak_history = [True, True]
    st.rooms["dining"].valve.leaking = True
    devices = [DeviceLink("temp_bathroom", "Bathroom room sensor", 28, True, "bathroom")]
    view = report_view(CFG, suggest(CFG, st, targets={}, devices=devices, weak_lqi=40))
    sev = [s["severity"] for s in view["suggestions"]]
    assert sev == sorted(sev, key=("act", "consider", "info").index)
    assert view["summary"]["total"] == len(view["suggestions"]) == 5
    assert view["summary"]["act"] == 3  # the leak and two short radiators
    assert view["summary"]["rooms_ready"] == 6 and view["summary"]["min_rooms"] == 3
    assert view["settings"]["design_outdoor_c"] == -2.0
    item = view["suggestions"][0]
    assert set(item) == {
        "id",
        "kind",
        "severity",
        "room_id",
        "room_name",
        "title",
        "evidence",
        "action",
        "confidence",
        "basis",
        "values",
    }
    text = json.dumps(view, ensure_ascii=False)
    assert "—" not in text and "–" not in text and " - " not in text


def test_loss_confidence_follows_the_loss_covariance():
    st = learned(confidence=0.7)
    assert round(loss_confidence(st.rooms["bedroom_1"].est), 2) == 0.7
    assert loss_confidence(EngineState.new(CFG).rooms["bedroom_1"].est) == 0.0
