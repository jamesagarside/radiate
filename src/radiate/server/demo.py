"""Demo driver: the simulated reference house, running faster than real time."""

from __future__ import annotations

from radiate.config.schedule import DaySchedule, WeekSchedule
from radiate.core import Actions, Mode, Snapshot
from radiate.sim.house import SimHouse
from radiate.sim.reference import OCCUPIED, ROOMS, RoomSpec, build_house, next_change, setpoint
from radiate.sim.runner import STEP_S, Disturbances, _apply, _apply_disturbances, _snapshot


class DemoDriver:
    name = "demo"

    def __init__(self, start_hour: float = 5.5, seed: int = 7) -> None:
        self.house: SimHouse = build_house(seed, start_temp=16.5)
        self.house.now = start_hour * 3600
        self.dist = Disturbances(fire_days=frozenset(range(365)))
        self._dist_state: dict = {}
        self._reports = {rid: (r.reported_t, self.house.now) for rid, r in self.house.rooms.items()}

    def clock(self) -> float:
        return self.house.now

    def wall_minutes(self) -> int:
        return int((self.house.now % 86400) // 60)

    def wall_weekday(self) -> int:
        return int(self.house.now // 86400) % 7  # simulated day 0 is a Monday

    def schedules(self) -> dict[str, tuple[str | None, WeekSchedule]]:
        """The simulator's schedule for each valved room, the same every day."""
        return {s.id: ("reference", _week(s)) for s in ROOMS if s.trv}

    def next_change_s(self, room_id: str) -> float | None:
        spec = next((s for s in ROOMS if s.id == room_id), None)
        if spec is None or not spec.trv:
            return None
        _, in_s = next_change(spec, self.wall_minutes())
        return in_s - self.house.now % 60

    def advance(self, seconds: float) -> None:
        h = self.house
        end = h.now + seconds
        while h.now < end:
            day = int(h.now // 86400)
            minute = int((h.now % 86400) // 60)
            draw = _apply_disturbances(h, self.dist, day, minute, self._dist_state)
            h.step(STEP_S, draw)
            for rid, room in h.rooms.items():
                val, at = self._reports[rid]
                if room.reported_t != val or h.now - at >= 600:
                    self._reports[rid] = (room.reported_t, h.now)

    async def snapshot(
        self, mode: Mode, overrides: dict[str, float], store_boost: bool, fire: set[str]
    ) -> Snapshot:
        self.advance(60.0)
        minute = self.wall_minutes()
        snap = _snapshot(self.house, self._reports, minute)
        snap.mode = mode
        snap.store_boost = store_boost
        for spec in ROOMS:
            inp = snap.rooms[spec.id]
            if spec.id in overrides:
                inp.setpoint = overrides[spec.id]
            if spec.id in fire:
                inp.fire_switch = True
            nxt, nxt_in = next_change(spec, minute)
            inp.next_setpoint, inp.next_setpoint_in_s = nxt, nxt_in
            if spec.id not in overrides:
                inp.setpoint = setpoint(spec, minute)
        return snap

    async def apply(self, actions: Actions) -> None:
        _apply(self.house, actions)

    def telemetry(self) -> dict:
        b = self.house.boiler
        return {
            "burner": b.burner,
            "burner_starts": b.burner_starts,
            "burner_hours": round(b.burner_on_s / 3600, 2),
            "boiler_water_c": round(b.t, 1),
            "store_c": round(b.store_t, 1),
            "stairs_c": round(self.house.rooms["stairs"].t, 1),
            "simulated": True,
        }


def _week(spec: RoomSpec) -> WeekSchedule:
    transitions: list[tuple[int, float]] = []
    for minute in sorted({0, *(edge for period in OCCUPIED for edge in period)}):
        sp = setpoint(spec, minute)
        if minute < 1440 and (not transitions or transitions[-1][1] != sp):
            transitions.append((minute, sp))
    return WeekSchedule((DaySchedule(tuple(transitions)),) * 7)
