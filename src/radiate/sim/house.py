"""Physics of a small wet central-heating system (spec 11).

Deliberately different from Radiate's own model (different valve curve, two-node
radiators, real hydraulics, boiler thermostat, store priority) so tests are not
circular. Explicit Euler, 30 s steps, pure Python.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

CP = 4186.0  # J/(kg K)


@dataclass
class SimRadiator:
    rated_w: float  # output at ΔT50
    pipe_k: float  # hydraulic conductance at full opening (relative to pipe run)
    water_c: float = 18.0 * 3600  # J/K (≈ 15 l water plus steel)
    t_water: float = 15.0
    trv: SimTrv | None = None
    manual_opening: float = 100.0  # for radiators without a TRV
    leak: float = 0.0  # share of full flow that passes when shut (valve not closing)

    def conductance(self) -> float:
        opening = self.trv.position if self.trv else self.manual_opening
        # Thermostatic insert: no flow below ~6 % stroke, near-linear lift-to-Kv,
        # saturating around 60 %. Deliberately not the same curve Radiate assumes.
        if opening <= 6.0:
            return self.pipe_k * self.leak
        return self.pipe_k * max(self.leak, min(1.0, (opening - 6.0) / 54.0) ** 0.8)

    def emission(self, t_room: float) -> float:
        dt = self.t_water - t_room
        return self.rated_w * (dt / 50.0) ** 1.3 if dt > 0 else 0.0


@dataclass
class SimTrv:
    """Sonoff TRVZB-like head: thermostat on the external or internal sensor."""

    sensor_alpha: float  # how much radiator heat leaks into the internal sensor
    setpoint: float = 18.0
    opening_degree: float = 100.0
    closing_degree: float = 100.0
    hysteresis: float = 0.5
    external: float | None = None
    external_set_at: float = -1e12
    internal: float = 15.0
    position: float = 0.0
    heating: bool = False
    available: bool = True
    schedule: object = None  # on-device weekly schedule: callable(minute_of_day) -> setpoint
    _sched_value: float | None = None

    def sensed(self, now: float) -> float:
        if self.external is not None and now - self.external_set_at < 2 * 3600:
            return self.external
        return self.internal

    def step(self, now: float, dt: float, t_room: float, t_water: float) -> None:
        if self.schedule is not None:
            # Auto mode: a schedule transition replaces any manual setpoint.
            value = self.schedule(int((now % 86400) // 60))
            if value != self._sched_value:
                self._sched_value = value
                self.setpoint = value
        target_internal = t_room + self.sensor_alpha * max(0.0, t_water - t_room)
        self.internal += (target_internal - self.internal) * (1 - math.exp(-dt / 300.0))
        s = self.sensed(now)
        if self.heating and s >= self.setpoint:
            self.heating = False
        elif not self.heating and s <= self.setpoint - self.hysteresis:
            self.heating = True
        target_pos = self.opening_degree if self.heating else 100.0 - self.closing_degree
        self.position += (target_pos - self.position) * (1 - math.exp(-dt / 30.0))


@dataclass
class SimRoom:
    id: str
    capacity_j_per_k: float
    ua_w_per_k: float
    radiator: SimRadiator
    t: float = 15.0
    humidity: float = 55.0
    extra_w: float = 0.0  # set each step by disturbances
    reported_t: float = 15.0


@dataclass
class SimBoiler:
    output_w: float = 13000.0
    water_c: float = 40.0 * 3600
    stat_on: float = 76.0
    stat_off: float = 82.0
    t: float = 20.0
    burner: bool = False
    burner_starts: int = 0
    burner_on_s: float = 0.0
    store_t: float = 60.0
    store_c: float = 60.0 * 3600
    store_on: float = 58.0
    store_off: float = 65.0
    store_heating: bool = False
    burns: list[tuple[float, float]] = field(default_factory=list)
    _burn_start: float | None = None


@dataclass
class SimHouse:
    rooms: dict[str, SimRoom]
    coupling: list[tuple[str, str, float]]  # (room, room, W/K)
    boiler: SimBoiler
    pump_head: float = 1.0
    pump_qmax: float = 0.25  # kg/s
    heating_relay: bool = False
    store_relay: bool = False
    outdoor_mean: float = 4.0
    outdoor_swing: float = 3.0
    now: float = 0.0
    rng: random.Random = field(default_factory=lambda: random.Random(1))

    def outdoor(self) -> float:
        hours = (self.now / 3600.0) % 24
        return self.outdoor_mean + self.outdoor_swing * math.sin(2 * math.pi * (hours - 9.0) / 24.0)

    def step(self, dt: float, dhw_draw_w: float = 0.0) -> None:
        b = self.boiler
        t_out = self.outdoor()

        # Store priority: while the store is enabled and below its thermostat, the
        # diverter sends all boiler heat to the store and the radiators get no flow.
        if self.store_relay:
            if b.store_t <= b.store_on:
                b.store_heating = True
            elif b.store_t >= b.store_off:
                b.store_heating = False
        else:
            b.store_heating = False
        diverting = b.store_heating
        ch_pump = self.heating_relay and not diverting

        # Burner thermostat.
        demand = ch_pump or diverting
        if not demand:
            want_burner = False
        elif b.burner:
            want_burner = b.t < b.stat_off
        else:
            want_burner = b.t <= b.stat_on
        if want_burner and not b.burner:
            b.burner_starts += 1
            b._burn_start = self.now
        if not want_burner and b.burner and b._burn_start is not None:
            b.burns.append((b._burn_start, self.now))
            b._burn_start = None
        b.burner = want_burner
        if b.burner:
            b.burner_on_s += dt

        # Hydraulics: fixed-head pump into parallel conductances.
        flows: dict[str, float] = {}
        if ch_pump:
            ks = {rid: r.radiator.conductance() for rid, r in self.rooms.items()}
            k = sum(ks.values())
            if k > 0:
                q = (
                    k
                    * math.sqrt(self.pump_head)
                    / math.sqrt(1 + k * k * self.pump_head / self.pump_qmax**2)
                )
                flows = {rid: q * kv / k for rid, kv in ks.items()}

        # Boiler water.
        heat_in = b.output_w if b.burner else 0.0
        to_store = 0.0
        if diverting:
            to_store = max(0.0, (b.t - b.store_t) * 400.0)
        ret_heat = sum(
            f * CP * (b.t - self.rooms[rid].radiator.t_water) for rid, f in flows.items()
        )
        b.t += (heat_in - ret_heat - to_store - 30.0 * (b.t - 18.0)) * dt / b.water_c
        b.store_t += (to_store - dhw_draw_w - 8.0 * (b.store_t - 18.0)) * dt / b.store_c

        # Radiators and rooms.
        emitted: dict[str, float] = {}
        for rid, room in self.rooms.items():
            rad = room.radiator
            q = flows.get(rid, 0.0)
            e = rad.emission(room.t)
            rad.t_water += (q * CP * (b.t - rad.t_water) - e) * dt / rad.water_c
            emitted[rid] = e

        dts = {}
        for rid, room in self.rooms.items():
            p = emitted[rid] - room.ua_w_per_k * (room.t - t_out) + room.extra_w
            dts[rid] = p
        for a, c, u in self.coupling:
            flow = u * (self.rooms[a].t - self.rooms[c].t)
            dts[a] -= flow
            dts[c] += flow
        for rid, room in self.rooms.items():
            room.t += dts[rid] * dt / room.capacity_j_per_k
            if room.radiator.trv:
                room.radiator.trv.step(self.now, dt, room.t, room.radiator.t_water)
            # SNZB-02B style reporting: 0.1 K steps with a little noise.
            noisy = room.t + self.rng.gauss(0.0, 0.03)
            if abs(noisy - room.reported_t) >= 0.1:
                room.reported_t = round(noisy, 1)
        self.now += dt
