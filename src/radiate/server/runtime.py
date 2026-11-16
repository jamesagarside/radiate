"""Server runtime: owns config, engine state and a device driver; runs the loop.

The same runtime serves all three editions (ADR-0002). Drivers translate between
devices and the core's Snapshot/Actions; the runtime never talks to devices itself.
"""

from __future__ import annotations

import asyncio
import contextlib
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from typing import Protocol

from radiate import __version__
from radiate.core import Actions, EngineState, HouseConfig, Mode, Reason, Snapshot, decide
from radiate.core.types import BoilerState, RoomRole


class Driver(Protocol):
    """Talks to real or simulated devices."""

    name: str

    async def snapshot(
        self, mode: Mode, overrides: dict[str, float], store_boost: bool, fire: set[str]
    ) -> Snapshot: ...

    async def apply(self, actions: Actions) -> None: ...

    def clock(self) -> float: ...

    def wall_minutes(self) -> int: ...

    def telemetry(self) -> dict: ...


@dataclass
class DecisionRecord:
    at: float
    code: str
    message: str
    room_id: str | None


@dataclass
class Runtime:
    cfg: HouseConfig
    driver: Driver
    house_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tick_s: float = 60.0
    state: EngineState = field(init=False)
    mode: Mode = Mode.AUTO
    overrides: dict[str, float] = field(default_factory=dict)
    fire: set[str] = field(default_factory=set)
    store_boost_until: float = 0.0
    last_actions: Actions | None = None
    last_snapshot: Snapshot | None = None
    decisions: deque[DecisionRecord] = field(default_factory=lambda: deque(maxlen=500))
    relay_history: deque[tuple[float, bool, bool]] = field(
        default_factory=lambda: deque(maxlen=2880)
    )
    listeners: list[asyncio.Queue] = field(default_factory=list)
    _task: asyncio.Task | None = None

    def __post_init__(self) -> None:
        self.state = EngineState.new(self.cfg)

    async def step(self) -> Actions:
        now = self.driver.clock()
        snap = await self.driver.snapshot(
            self.mode, self.overrides, now < self.store_boost_until, self.fire
        )
        actions = decide(self.cfg, snap, self.state)
        await self.driver.apply(actions)
        self.last_actions, self.last_snapshot = actions, snap
        self.relay_history.append((now, actions.heating_relay, actions.store_relay))
        for r in [*actions.reasons, *actions.alerts]:
            if r.code.startswith(("boiler.", "disturbance.", "safe_mode.")):
                self._log(now, r)
        payload = self.describe()
        for q in list(self.listeners):
            if q.full():
                with contextlib.suppress(asyncio.QueueEmpty):
                    q.get_nowait()
            q.put_nowait(payload)
        return actions

    def _log(self, now: float, r: Reason) -> None:
        self.decisions.append(DecisionRecord(now, r.code, r.message, r.room_id))

    async def run(self, interval_s: float) -> None:
        while True:
            started = time.monotonic()
            await self.step()
            await asyncio.sleep(max(0.0, interval_s - (time.monotonic() - started)))

    def start(self, interval_s: float) -> None:
        self._task = asyncio.get_running_loop().create_task(self.run(interval_s))

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task

    # --- views ---------------------------------------------------------------------------

    def house(self) -> dict:
        return {
            "id": self.house_id,
            "version": __version__,
            "driver": self.driver.name,
            "rooms": [
                {
                    "id": r.id,
                    "name": r.name,
                    "role": r.role.value,
                    "heat_source": r.heat_source.value if r.heat_source else None,
                    "controllable": r.controllable,
                }
                for r in self.cfg.rooms
            ],
            "boiler": {
                "min_burn_s": self.cfg.boiler.min_burn_s,
                "min_off_s": self.cfg.boiler.min_off_s,
                "max_starts_per_hour": self.cfg.boiler.max_starts_per_hour,
            },
        }

    def describe(self) -> dict:
        snap, acts, st = self.last_snapshot, self.last_actions, self.state
        now = self.driver.clock()
        rooms = []
        reasons_by_room: dict[str, str] = {}
        if acts:
            for r in acts.reasons:
                if r.room_id:
                    reasons_by_room[r.room_id] = r.message
        for rc in self.cfg.rooms:
            inp = snap.rooms.get(rc.id) if snap else None
            item = {
                "id": rc.id,
                "name": rc.name,
                "role": rc.role.value,
                "heat_source": rc.heat_source.value if rc.heat_source else None,
                "temperature": inp.temperature
                if inp and rc.role is not RoomRole.INTERNAL_SENSOR_ONLY
                else None,
                "humidity": inp.humidity if inp else None,
                "setpoint": inp.setpoint if inp else None,
                "next_setpoint": inp.next_setpoint if inp else None,
                "next_in_min": round(inp.next_setpoint_in_s / 60)
                if inp and inp.next_setpoint_in_s is not None
                else None,
            }
            rs = st.rooms.get(rc.id)
            if rs is not None:
                v = acts.valves.get(rc.id) if acts else None
                item.update(
                    temperature=round(rs.temperature, 2) if rs.temperature is not None else None,
                    target=rs.target,
                    opening=v.opening if v else None,
                    calling=rs.calling,
                    topup=rs.topup,
                    preheating=rs.preheating,
                    fire=rs.dist.fire,
                    learning=rs.learning_gate,
                    model={
                        "a": round(rs.est.a, 3),
                        "b": round(rs.est.b, 4),
                        "d": round(rs.est.d, 3),
                        "confidence": round(rs.est.confidence, 2),
                        "samples": rs.est.samples,
                        "arrival_lag_min": round(rs.arrival_lag_s / 60, 1),
                        "lockshield": rs.lockshield,
                    },
                    reason=reasons_by_room.get(rc.id),
                )
            rooms.append(item)

        guard = st.boiler
        burns, stores = _intervals(self.relay_history, now)
        return {
            "now": now,
            "minute_of_day": self.driver.wall_minutes(),
            "mode": self.mode.value,
            "outdoor": snap.outdoor if snap else None,
            "boiler": {
                "state": guard.state.value,
                "relay": acts.heating_relay if acts else False,
                "burn_elapsed_s": guard.burn_elapsed(now)
                if guard.state is BoilerState.FIRING
                else 0,
                "state_elapsed_s": now - guard.since,
                "starts_last_hour": guard.starts_last_hour(now),
                "predicted_burn_min": round(st.allocation.t_star_h * 60) if st.allocation else 0,
                "supply": round(st.supply, 3),
            },
            "store": {
                "relay": acts.store_relay if acts else False,
                "boost": now < self.store_boost_until,
            },
            "rooms": rooms,
            "timeline": {"burns": burns, "store": stores, "window_s": 86400},
            "alerts": [a.message for a in acts.alerts] if acts else [],
            "telemetry": self.driver.telemetry(),
        }


def _intervals(history: deque[tuple[float, bool, bool]], now: float) -> tuple[list, list]:
    burns: list[list[float]] = []
    stores: list[list[float]] = []
    for idx, out in ((1, burns), (2, stores)):
        start = None
        for item in history:
            t, on = item[0], item[idx]
            if on and start is None:
                start = t
            elif not on and start is not None:
                out.append([start - now, t - now])
                start = None
        if start is not None:
            out.append([start - now, 0.0])
    return burns, stores
