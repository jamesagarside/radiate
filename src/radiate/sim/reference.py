"""The owner's 9-radiator reference house, as a simulator and as a Radiate config.

Numbers are plausible for a UK house with an oil combi in the kitchen; they are not
measurements. Pipe conductances make the far bedrooms flow-starved when every valve
is open, which is the imbalance balancing has to fix. No personal details here.
"""

from __future__ import annotations

from dataclasses import dataclass

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
