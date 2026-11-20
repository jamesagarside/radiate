"""Demo driver: the simulated reference house, running faster than real time.

Each valved room follows the simulator's reference schedule until a household is set
up from the web UI; household rooms then follow their compiled weeks, as in a real
house. `demo_site` describes the simulated house as a `SiteConfig` for that setup.
"""

from __future__ import annotations

from radiate.config.schedule import DaySchedule, WeekSchedule
from radiate.config.site import RoomDevices, SiteConfig
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
        self.household_live: dict[str, WeekSchedule] = {}  # household rooms: the live weeks

    def clock(self) -> float:
        return self.house.now

    def wall_minutes(self) -> int:
        return int((self.house.now % 86400) // 60)

    def wall_weekday(self) -> int:
        return int(self.house.now // 86400) % 7  # simulated day 0 is a Monday

    def schedules(self) -> dict[str, tuple[str | None, WeekSchedule]]:
        """Each valved room's week: the simulator's, the same every day and named after
        the room, or the household's compiled week (named None) once one is set up."""
        out: dict[str, tuple[str | None, WeekSchedule]] = {
            s.id: (s.id, _week(s)) for s in ROOMS if s.trv
        }
        out.update((rid, (None, week)) for rid, week in self.household_live.items())
        return out

    def replace_household(self, site: SiteConfig) -> None:
        self.household_live = dict(site.household_live)

    def set_household_schedules(
        self, schedules: dict[str, WeekSchedule], live: dict[str, WeekSchedule] | None = None
    ) -> None:
        valved = {s.id for s in ROOMS if s.trv}
        self.household_live.update(
            (rid, week) for rid, week in (live or schedules).items() if rid in valved
        )

    def next_change_s(self, room_id: str) -> float | None:
        spec = next((s for s in ROOMS if s.id == room_id), None)
        if spec is None or not spec.trv:
            return None
        week = self.household_live.get(room_id)
        if week is not None:
            _, in_s = week.next_change(self.wall_weekday(), self.wall_minutes())
        else:
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
        weekday = self.wall_weekday()
        snap = _snapshot(self.house, self._reports, minute)
        snap.mode = mode
        snap.store_boost = store_boost
        for spec in ROOMS:
            inp = snap.rooms[spec.id]
            if spec.id in overrides:
                inp.setpoint = overrides[spec.id]
            if spec.id in fire:
                inp.fire_switch = True
            week = self.household_live.get(spec.id)
            if week is not None:
                nxt, nxt_in = week.next_change(weekday, minute)
                scheduled = week.setpoint_at(weekday, minute)
            else:
                nxt, nxt_in = next_change(spec, minute)
                scheduled = setpoint(spec, minute)
            inp.next_setpoint, inp.next_setpoint_in_s = nxt, nxt_in
            if spec.id not in overrides:
                inp.setpoint = scheduled
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


def demo_runtime(start_hour: float = 5.5, seed: int = 7):
    """The demo's runtime: the simulated house, with a household setup kept in memory."""
    from .runtime import Runtime
    from .setup import HouseholdSetup, SavedMemory

    site = demo_site()
    rt = Runtime(site.house, DemoDriver(start_hour=start_hour, seed=seed))
    rt.setup = HouseholdSetup(site, SavedMemory())
    return rt


def demo_site() -> SiteConfig:
    """The simulated house as a `SiteConfig`, so the web UI's household setup can check
    and compile a household for it. Each valved room's schedule of its own is the
    simulator's, named after the room."""
    from radiate.sim.reference import house_config

    weeks = {s.id: _week(s) for s in ROOMS if s.trv}
    return SiteConfig(
        house=house_config(),
        devices={s.id: RoomDevices(schedule=s.id if s.trv else None) for s in ROOMS},
        schedules=weeks,
        room_schedules={rid: rid for rid in weeks},
    )


def _week(spec: RoomSpec) -> WeekSchedule:
    transitions: list[tuple[int, float]] = []
    for minute in sorted({0, *(edge for period in OCCUPIED for edge in period)}):
        sp = setpoint(spec, minute)
        if minute < 1440 and (not transitions or transitions[-1][1] != sp):
            transitions.append((minute, sp))
    return WeekSchedule((DaySchedule(tuple(transitions)),) * 7)
