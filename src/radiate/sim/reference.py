"""The owner's 9-radiator reference house, as a simulator and as a Radiate config.

Numbers are plausible for a UK house with an oil combi in the kitchen; they are not
measurements. Pipe conductances make the far bedrooms flow-starved when every valve
is open, which is the imbalance balancing has to fix. No personal details here.
"""

from __future__ import annotations

from dataclasses import dataclass

from radiate.config.household import (
    Household,
    Person,
    RoomKind,
    RoomLink,
    Routine,
    Temperatures,
    UseLevel,
)
from radiate.config.schedule import WeekSchedule, parse_week
from radiate.core.types import HeatSource, HouseConfig, RoomConfig, RoomRole

from .house import SimBoiler, SimHouse, SimRadiator, SimRoom, SimTrv

KWH = 3.6e6


@dataclass(frozen=True)
class RoomSpec:
    id: str
    name: str
    capacity_kwh_per_k: float
    ua: float  # W/K to outdoors
    rated_w: float  # radiator output at ΔT50
    pipe_k: float  # hydraulic conductance at full opening
    sensor_alpha: float
    trv: bool = True
    manual_opening: float = 100.0
    role: RoomRole = RoomRole.NORMAL
    heat_source: HeatSource | None = None
    humidity: bool = False
    comfort: float = 20.0


ROOMS: tuple[RoomSpec, ...] = (
    RoomSpec("bedroom_1", "Bedroom 1", 0.45, 30, 1200, 0.014, 0.05),
    RoomSpec("bedroom_2", "Bedroom 2", 0.40, 25, 1000, 0.011, 0.05),
    RoomSpec("bedroom_3", "Bedroom 3", 0.35, 18, 700, 0.008, 0.05),
    RoomSpec("bathroom", "Bathroom", 0.25, 15, 600, 0.012, 0.05, humidity=True, comfort=21.0),
    RoomSpec("dining", "Dining room", 0.55, 35, 1400, 0.07, 0.05),
    RoomSpec(
        "lounge",
        "Lounge",
        0.80,
        45,
        1800,
        0.06,
        0.05,
        heat_source=HeatSource.EPISODIC,
        comfort=21.0,
    ),
    RoomSpec("kitchen", "Kitchen", 0.50, 40, 900, 0.08, 0.05, heat_source=HeatSource.CONTINUOUS),
    RoomSpec(
        "toilet",
        "Toilet",
        0.12,
        10,
        400,
        0.065,
        0.06,
        role=RoomRole.INTERNAL_SENSOR_ONLY,
        comfort=18.0,
    ),
    RoomSpec(
        "stairs",
        "Stairs",
        0.60,
        30,
        1200,
        0.04,
        0.0,
        trv=False,
        manual_opening=15.0,
        role=RoomRole.PASSIVE,
    ),
)

COUPLING = (
    ("stairs", "bedroom_1", 6.0),
    ("stairs", "bedroom_2", 6.0),
    ("stairs", "bedroom_3", 6.0),
    ("stairs", "bathroom", 4.0),
    ("stairs", "lounge", 8.0),
    ("stairs", "dining", 6.0),
    ("kitchen", "dining", 15.0),
    ("kitchen", "toilet", 4.0),
    ("lounge", "dining", 6.0),
)

OCCUPIED = ((6 * 60 + 30, 8 * 60 + 30), (17 * 60, 22 * 60 + 30))
SETBACK = 16.0


def setpoint(spec: RoomSpec, minute_of_day: int) -> float:
    if any(a <= minute_of_day < b for a, b in OCCUPIED):
        return spec.comfort
    return SETBACK


def next_change(spec: RoomSpec, minute_of_day: int) -> tuple[float, float]:
    """Next scheduled setpoint and seconds until it applies.

    The schedule only changes at OCCUPIED boundaries, so checking those (nearest first)
    gives the same answer as scanning every minute of the day, at a fraction of the cost.
    """
    now_sp = setpoint(spec, minute_of_day)
    steps = sorted(
        {(edge - minute_of_day) % (24 * 60) for period in OCCUPIED for edge in period} - {0}
    )
    for step in steps:
        sp = setpoint(spec, (minute_of_day + step) % (24 * 60))
        if sp != now_sp:
            return sp, step * 60.0
    return now_sp, 24 * 3600.0


def build_house(seed: int = 1, start_temp: float = 16.0) -> SimHouse:
    import random

    rooms = {}
    for s in ROOMS:
        trv = None
        if s.trv:
            # Radiate mirrors each room's schedule into the TRV (spec 4.5, fallback).
            trv = SimTrv(
                sensor_alpha=s.sensor_alpha,
                internal=start_temp,
                schedule=lambda m, spec=s: setpoint(spec, m),
            )
        rad = SimRadiator(
            rated_w=s.rated_w,
            pipe_k=s.pipe_k,
            t_water=start_temp,
            trv=trv,
            manual_opening=s.manual_opening,
        )
        rooms[s.id] = SimRoom(
            id=s.id,
            capacity_j_per_k=s.capacity_kwh_per_k * KWH,
            ua_w_per_k=s.ua,
            radiator=rad,
            t=start_temp,
            reported_t=start_temp,
        )
    boiler = SimBoiler(water_c=70.0 * 3600, stat_on=70.0, stat_off=82.0, t=40.0)
    return SimHouse(rooms=rooms, coupling=list(COUPLING), boiler=boiler, rng=random.Random(seed))


def house_config(actuate_all: bool = True) -> HouseConfig:
    return HouseConfig(
        rooms=tuple(
            RoomConfig(
                id=s.id,
                name=s.name,
                role=s.role,
                heat_source=s.heat_source,
                has_humidity=s.humidity,
                actuation_enabled=actuate_all or s.id == "bedroom_1",
            )
            for s in ROOMS
        )
    )


# --- schedules with room use (efficiency plan, slice 6) ----------------------------------


def _hhmm(text: str) -> int:
    h, m = text.split(":")
    return int(h) * 60 + int(m)


def _span(text: str) -> tuple[int, int]:
    a, b = text.split("-")
    return _hhmm(a), _hhmm(b)


def reference_household() -> Household:
    """Generic people and routines that give the reference rooms the mix of spec 5.8's
    example: a bedroom used getting up and at bedtime, an office (Bedroom 3) used in
    weekday working hours, the dining room and kitchen used while people are home, the
    bathroom occasional, and the lounge, Bedroom 2 and the toilet unused. 18 °C in use,
    16 °C occasional, 14 °C unused and overnight. No personal details."""
    weekend = Routine(_hhmm("08:30"), _hhmm("22:30"), out=(_span("10:00-18:00"),))
    early = Person(
        "early_riser",
        weekdays=Routine(_hhmm("06:30"), _hhmm("22:30"), out=(_span("07:30-18:00"),)),
        weekend=weekend,
    )
    worker = Person(
        "home_worker",
        weekdays=Routine(_hhmm("08:00"), _hhmm("22:30"), work=(_span("08:00-18:00"),)),
        weekend=weekend,
    )
    both = ("early_riser", "home_worker")

    def link(room_id: str, level: UseLevel, **kw) -> RoomLink:
        return RoomLink(room_id, level, level, **kw)

    return Household(
        people=(early, worker),
        rooms=(
            link("bedroom_1", UseLevel.IN_USE, kind=RoomKind.BEDROOM, people=both),
            link("bedroom_2", UseLevel.UNUSED),
            link("bedroom_3", UseLevel.IN_USE, kind=RoomKind.OFFICE, people=("home_worker",)),
            link("bathroom", UseLevel.OCCASIONAL),
            link("dining", UseLevel.IN_USE),
            link("lounge", UseLevel.UNUSED),
            link("kitchen", UseLevel.IN_USE),
            link("toilet", UseLevel.UNUSED),
        ),
        temperatures=Temperatures(in_use_c=18.0, occasional_c=16.0, unused_c=14.0, night_c=14.0),
    )


# Hand-written schedules with `rooms[].use`, as close to the owner's real house as the
# simulator allows: the office (Bedroom 3) in use on weekday working hours, Bedroom 1
# getting up and at bedtime, the dining room and kitchen mornings and evenings, the
# lounge, Bedroom 2 and the toilet unused, 14 °C overnight everywhere. The bathroom's
# use is not known; it is occasional here. The stairs has no TRV.
OWNER_SCHEDULES: dict[str, dict[str, str]] = {
    "bedroom_1": {"daily": "00:00/14 06:00/18 08:30/14 21:30/18 22:30/14"},
    "bedroom_2": {"daily": "00:00/14"},
    "bedroom_3": {"weekdays": "00:00/14 08:00/18 17:30/14", "weekend": "00:00/14"},
    "bathroom": {"daily": "00:00/14 06:00/16 08:30/14 21:00/16 22:30/14"},
    "dining": {"daily": "00:00/14 06:30/18 09:00/14 17:00/18 22:00/14"},
    "lounge": {"daily": "00:00/14"},
    "kitchen": {"daily": "00:00/14 06:30/18 09:00/14 17:00/18 22:00/14"},
    "toilet": {"daily": "00:00/14"},
}
OWNER_USE: dict[str, tuple[UseLevel, UseLevel]] = {
    "bedroom_1": (UseLevel.IN_USE, UseLevel.IN_USE),
    "bedroom_2": (UseLevel.UNUSED, UseLevel.UNUSED),
    "bedroom_3": (UseLevel.IN_USE, UseLevel.UNUSED),
    "bathroom": (UseLevel.OCCASIONAL, UseLevel.OCCASIONAL),
    "dining": (UseLevel.IN_USE, UseLevel.IN_USE),
    "lounge": (UseLevel.UNUSED, UseLevel.UNUSED),
    "kitchen": (UseLevel.IN_USE, UseLevel.IN_USE),
    "toilet": (UseLevel.UNUSED, UseLevel.UNUSED),
}


def owner_weeks() -> dict[str, WeekSchedule]:
    """The owner-like house's hand-written weeks, by room id."""
    return {rid: parse_week(spec) for rid, spec in OWNER_SCHEDULES.items()}
