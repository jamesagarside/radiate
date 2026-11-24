"""Demo driver: the simulated reference house, running faster than real time.

Each valved room follows the simulator's reference schedule until a household is set
up from the web UI; household rooms then follow their compiled weeks, as in a real
house. `demo_site` describes the simulated house as a `SiteConfig` for that setup.
"""

from __future__ import annotations

import dataclasses
import math
from datetime import date

from radiate.config.schedule import DaySchedule, WeekSchedule
from radiate.config.site import RoomDevices, SiteConfig
from radiate.core import Actions, Mode, Reason, Snapshot
from radiate.core.types import RoomRole
from radiate.drivers.devices import (
    DeviceHealth,
    HealthLimits,
    NetworkMap,
    NetworkScan,
    Route,
)
from radiate.drivers.devices import alerts as device_alerts
from radiate.drivers.devices import view as health_view
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
        self.limits = HealthLimits()
        self.scan = NetworkScan()
        self._garage_lost_at = self.house.now - 3 * 3600  # the offline router's last word

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

    def replace_settings(self, cfg, site: SiteConfig) -> None:
        """Settings changed in the Settings view that apply live: device alert limits."""
        self.limits = dataclasses.replace(
            self.limits,
            low_battery_pct=site.monitoring.low_battery_pct,
            weak_signal_lqi=site.monitoring.weak_signal_lqi,
        )

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
            h.outdoor_mean = demo_outdoor_mean(h.now / 86400)
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
        # Real dates, so closed days and savings read as calendar days.
        snap.day = DEMO_FIRST_DAY + int(self.house.now // 86400)
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

    # --- device health (spec 10) -------------------------------------------------------

    def health(self) -> list[DeviceHealth]:
        """The simulated house's devices, with made-up but plausible battery, signal
        and last-seen values: one low battery, one weak signal, one router offline."""
        h, now = self.house, self.house.now
        days = now / 86400
        out: list[DeviceHealth] = []
        routes = self.scan.map.routes if self.scan.map is not None else {}
        for i, spec in enumerate(ROOMS):
            room = h.rooms[spec.id]
            trv = room.radiator.trv
            if trv is not None:
                name = f"trv_{spec.id}"
                battery, lqi = _DEMO_SIGNAL.get(name, (80.0, 120.0))
                out.append(
                    DeviceHealth(
                        id=name,
                        kind="trv",
                        room_id=spec.id,
                        room_name=spec.name,
                        model="TRVZB",
                        vendor="SONOFF",
                        firmware="1.3.0",
                        power="battery",
                        battery_pct=max(1.0, round(battery - 0.05 * days)),
                        linkquality=_wobble(lqi, now, i),
                        available=trv.available,
                        last_seen_s=(now + 97 * i) % 300,
                        temperature_c=round(trv.internal, 1),
                        valve={
                            "opening_pct": round(trv.opening_degree),
                            "closing_pct": round(trv.closing_degree),
                            "mode": "auto",
                            "running_state": "heat" if trv.heating else "idle",
                            "setpoint_c": trv.setpoint,
                            "sensor": "remote_temperature"
                            if spec.role is RoomRole.NORMAL
                            else "local_temperature",
                        },
                        route=routes.get(name),
                    )
                )
            if spec.role is not RoomRole.INTERNAL_SENSOR_ONLY:
                name = f"temp_{spec.id}"
                battery, lqi = _DEMO_SIGNAL.get(name, (90.0, 110.0))
                value, at = self._reports[spec.id]
                out.append(
                    DeviceHealth(
                        id=name,
                        kind="sensor",
                        room_id=spec.id,
                        room_name=spec.name,
                        model="SNZB-02D",
                        vendor="SONOFF",
                        power="battery",
                        battery_pct=max(1.0, round(battery - 0.02 * days)),
                        linkquality=_wobble(lqi, now, i + 20),
                        available=True,
                        last_seen_s=now - at,
                        reading_age_s=now - at,
                        temperature_c=round(value, 1),
                        humidity_pct=round(room.humidity) if spec.humidity else None,
                        route=routes.get(name),
                    )
                )
        out.append(
            DeviceHealth(
                id="plug_landing",
                kind="router",
                model="S60ZBTPG",
                vendor="SONOFF",
                firmware="1.0.6",
                power="mains",
                linkquality=_wobble(150.0, now, 40),
                available=True,
                last_seen_s=(now + 41) % 60,
                route=routes.get("plug_landing"),
            )
        )
        out.append(
            DeviceHealth(
                id="plug_garage",
                kind="router",
                model="S60ZBTPG",
                vendor="SONOFF",
                firmware="1.0.6",
                power="mains",
                linkquality=None,
                available=False,
                last_seen_s=now - self._garage_lost_at,
            )
        )
        out.append(
            DeviceHealth(
                id="boiler_relay",
                kind="relay",
                link="wifi",
                model="Shelly",
                power="mains",
                available=True,
                last_seen_s=0.0,
                relay={"heating": h.heating_relay, "store": h.store_relay, "power_w": None},
            )
        )
        return out

    def alerts(self) -> list[Reason]:
        return device_alerts([d for d in self.health() if d.kind != "relay"], self.limits)

    def devices_view(self) -> dict:
        self._finish_scan()
        scan = self.scan.view(self.house.now)
        return health_view(self.health(), self.limits, scan, {"mqtt": True, "zigbee2mqtt": True})

    def request_network_scan(self) -> dict:
        """Pretend to map the mesh: the answer comes `DEMO_SCAN_S` simulated seconds
        later, with the same rate limit as a real scan."""
        self._finish_scan()
        self.scan.start(self.house.now)
        return self.scan.view(self.house.now)

    def _finish_scan(self) -> None:
        scan = self.scan
        if scan.state != "scanning" or scan.started_at is None:
            return
        done_at = scan.started_at + DEMO_SCAN_S
        if self.house.now >= done_at:
            scan.finish(_demo_map(done_at), done_at)

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


DEMO_SCAN_S = 45.0
# Battery % and typical LQI for the demo's devices, where they differ from the usual.
_DEMO_SIGNAL: dict[str, tuple[float, float]] = {
    "trv_bedroom_1": (64.0, 96.0),
    "trv_bedroom_2": (71.0, 88.0),
    "trv_bedroom_3": (14.0, 72.0),  # low battery
    "trv_bathroom": (58.0, 84.0),
    "trv_dining": (77.0, 168.0),
    "trv_lounge": (82.0, 182.0),
    "trv_kitchen": (69.0, 204.0),
    "trv_toilet": (55.0, 142.0),
    "temp_bedroom_1": (88.0, 104.0),
    "temp_bedroom_2": (92.0, 92.0),
    "temp_bedroom_3": (85.0, 78.0),
    "temp_bathroom": (79.0, 30.0),  # weak signal
    "temp_dining": (95.0, 158.0),
    "temp_lounge": (90.0, 176.0),
    "temp_kitchen": (97.0, 196.0),
    "temp_stairs": (83.0, 132.0),
}


def _wobble(lqi: float, now: float, seed: int) -> float:
    """LQI moves a little from message to message."""
    return float(round(lqi + 5 * math.sin(now / 1800 + seed)))


def _demo_map(now: float) -> NetworkMap:
    """Where the demo's devices route: upstairs through the landing plug."""
    upstairs = {"bedroom_1", "bedroom_2", "bedroom_3", "bathroom"}
    routes: dict[str, Route] = {"plug_landing": Route("Coordinator", "Coordinator", 148.0)}
    for i, spec in enumerate(ROOMS):
        for name in (f"trv_{spec.id}", f"temp_{spec.id}"):
            _, lqi = _DEMO_SIGNAL.get(name, (0.0, 120.0))
            via = ("plug_landing", "Router") if spec.id in upstairs else ("Coordinator",) * 2
            routes[name] = Route(via[0], via[1], _wobble(lqi, now, i))
    return NetworkMap(routes=routes)


# Simulated day 0 is Monday 2 November 2026, so closed days carry real dates.
DEMO_FIRST_DAY = date(2026, 11, 2).toordinal()
# The demo boiler's nozzle rating, so its days have litres (spec 5.6).
DEMO_NOZZLE_LPH = 1.4
# The example household (examples/household.yaml), for `demo_runtime(days=...)`.
DEMO_HOUSEHOLD: dict = {
    "temperatures": {"in_use": 19, "occasional": 16, "unused": 14, "night": 14},
    "people": {
        "early_riser": {
            "name": "Early riser",
            "weekdays": {"up": "06:30", "out": "07:30-18:00", "bed": "22:30"},
            "weekend": {"up": "08:30", "out": "10:00-18:00", "bed": "22:30"},
        },
        "home_worker": {
            "name": "Home worker",
            "weekdays": {"up": "08:00", "work": "08:00-18:00", "bed": "22:30"},
            "weekend": {"up": "08:30", "out": "10:00-18:00", "bed": "22:30"},
        },
    },
    "rooms": {
        "bedroom_1": {"use": "in_use", "kind": "bedroom", "people": ["early_riser", "home_worker"]},
        "bedroom_3": {"use": "in_use", "kind": "office", "people": ["home_worker"]},
        "dining": {"use": "in_use"},
        "kitchen": {"use": "in_use"},
        "bathroom": {"use": "occasional"},
        "bedroom_2": {"use": "unused"},
        "lounge": {"use": "unused"},
        "toilet": {
            "use": {"weekdays": "unused", "weekend": "occasional"},
            "kind": "all_day",
            "temperature": 15,
        },
    },
}


def demo_outdoor_mean(day: float) -> float:
    """The demo's daily mean outdoor temperature, °C, `day` days in: mild and cold
    spells over about a fortnight, so the weather varies as savings need (spec 5.9).
    The simulator's own runs keep a fixed mean."""
    return 4.0 + 3.5 * math.sin(2 * math.pi * day / 11.0)


def demo_runtime(start_hour: float = 5.5, seed: int = 7, days: int = 0, record: bool = False):
    """The demo's runtime: the simulated house, with a household setup kept in memory.

    With `days`, the demo starts that many simulated days in, with the example
    household set up, so closed days, savings and learning already have a history.
    With `record`, it also records a tick history in memory, as a live house does, so
    the Raw data view has something to search (`radiate serve --demo`; the browser
    demo has no SQLite).
    """
    from .bridge import run_sync
    from .runtime import Runtime
    from .settings import SettingsEditor, SettingsMemory
    from .setup import HouseholdSetup, SavedMemory

    site = demo_site()
    rt = Runtime(site.house, DemoDriver(start_hour=start_hour, seed=seed))
    rt.setup = HouseholdSetup(site, SavedMemory())
    rt.settings_editor = SettingsEditor.start(demo_house_file(), SettingsMemory())
    if record:
        _record(rt, days)
    if days > 0:
        rt.setup.save(rt, {"household": DEMO_HOUSEHOLD})
        for _ in range(int(days * 1440)):
            run_sync(rt.step())
    return rt


def _record(rt, days: int) -> None:
    """Record the demo's ticks in an in-memory state database, on simulated wall time.

    Simulated midnight on day 0 is local midnight `days` days ago, so after the warm-up
    the history ends about now, and the clock shown in the UI matches the times in it.
    """
    import time
    from datetime import datetime, timedelta

    from .data import SeriesIndex
    from .history import History, Recorder
    from .store import Store

    midnight = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    base = (midnight - timedelta(days=days)).timestamp()
    driver = rt.driver
    rt.wall = lambda: base + driver.clock()
    store = Store(":memory:")
    history = History(store, DEMO_HISTORY_DAYS)
    now = driver.clock()
    rt.recorder = Recorder(history, int(time.time() * 1000), now, rt.wall(), None, 0.0)
    rt.recorder.index = SeriesIndex(store, history)


DEMO_HISTORY_DAYS = 14.0


def demo_site() -> SiteConfig:
    """The simulated house as a `SiteConfig`, so the web UI's household setup can check
    and compile a household for it. Each valved room's schedule of its own is the
    simulator's, named after the room."""
    from radiate.sim.reference import house_config

    weeks = {s.id: _week(s) for s in ROOMS if s.trv}
    house = house_config()
    house = dataclasses.replace(
        house, boiler=dataclasses.replace(house.boiler, nozzle_lph=DEMO_NOZZLE_LPH)
    )
    return SiteConfig(
        house=house,
        devices={s.id: RoomDevices(schedule=s.id if s.trv else None) for s in ROOMS},
        schedules=weeks,
        room_schedules={rid: rid for rid in weeks},
    )


def demo_house_file() -> dict:
    """The simulated house as a house file, for the Settings view to show and check
    changes against. Device names are made up; the simulator has no devices."""
    rooms = []
    for s in ROOMS:
        item: dict = {"id": s.id, "name": s.name}
        if s.role is not RoomRole.NORMAL:
            item["role"] = s.role.value
        if s.heat_source is not None:
            item["heat_source"] = s.heat_source.value
        if s.trv:
            item["trv"] = f"trv_{s.id}"
            item["schedule"] = s.id
            item["actuate"] = True
        if s.role is not RoomRole.INTERNAL_SENSOR_ONLY:
            item["sensor"] = f"temp_{s.id}"
        if s.humidity:
            item["humidity"] = True
        rooms.append(item)
    return {
        "house": {"timezone": "Europe/London", "dry_run": True, "outdoor_sensor": "temp_outdoor"},
        "mqtt": {"host": "localhost", "port": 1883},
        "boiler": {"nozzle_lph": DEMO_NOZZLE_LPH},
        "schedules": {s.id: {"daily": _week(s).days[0].trvzb()} for s in ROOMS if s.trv},
        "rooms": rooms,
    }


def _week(spec: RoomSpec) -> WeekSchedule:
    transitions: list[tuple[int, float]] = []
    for minute in sorted({0, *(edge for period in OCCUPIED for edge in period)}):
        sp = setpoint(spec, minute)
        if minute < 1440 and (not transitions or transitions[-1][1] != sp):
            transitions.append((minute, sp))
    return WeekSchedule((DaySchedule(tuple(transitions)),) * 7)
