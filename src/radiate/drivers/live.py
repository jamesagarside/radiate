"""The live house driver: Zigbee2MQTT valves and sensors, a Shelly boiler relay, and
the room schedules from the config file (ADR-0002 drivers).

Implements the runtime's `Driver` protocol. In dry run every device is read but
nothing is written: valve settings, relay commands and the heartbeat are logged and
kept in `intended` instead (spec 4.5 one-valve rollout).
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections import deque
from collections.abc import Awaitable, Callable
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from radiate.config import SiteConfig
from radiate.core import Actions, Mode, Reason, RoomInput, Snapshot
from radiate.core.types import RoomRole

from .shelly import ShellyBoiler, fallback_heating_windows
from .z2m import DeviceStore, TrvWriter, Write, is_available, reading_age, trv_get_payload

LOG = logging.getLogger(__name__)
NEVER = 1e9
OUTDOOR_MAX_AGE_S = 2 * 3600

Publish = Callable[[str, dict[str, Any]], Awaitable[bool]]


class LiveDriver:
    name = "live"

    def __init__(
        self,
        site: SiteConfig,
        publish: Publish,
        boiler: ShellyBoiler | None = None,
        clock: Callable[[], float] = time.monotonic,
        wall: Callable[[], float] = time.time,
        connected: Callable[[], bool] = lambda: True,
    ):
        self.site = site
        self.cfg = site.house
        self.publish = publish
        self.boiler = boiler
        self._clock = clock
        self._wall = wall
        self._connected = connected
        self.tz = ZoneInfo(site.timezone)
        self.dry_run = site.dry_run
        names = {n for d in site.devices.values() for n in (d.trv, d.sensor, d.window) if n}
        if site.outdoor_sensor:
            names.add(site.outdoor_sensor)
        base = site.mqtt.base_topic if site.mqtt else "zigbee2mqtt"
        self.devices = DeviceStore(base, names)
        self.writers: dict[str, TrvWriter] = {}
        for rc in self.cfg.rooms:
            dev = site.devices[rc.id]
            if dev.trv:
                self.writers[rc.id] = TrvWriter(
                    dev.trv,
                    remote_sensor=rc.role is RoomRole.NORMAL and dev.sensor is not None,
                    schedule_mirror=site.trv.schedule_mirror,
                    keepalive_s=site.trv.external_keepalive_s,
                    min_external_change_k=site.trv.external_min_change_k,
                    close_bump_delay_s=site.trv.close_bump_delay_s,
                )
        self.intended: deque[tuple[float, str, dict]] = deque(maxlen=50)
        self.intended_count = 0
        self.published = 0
        self._last_heating = False
        self._last_store = False
        self._pending: set[asyncio.Task] = set()

    # --- clock -----------------------------------------------------------------------

    def clock(self) -> float:
        return self._clock()

    def _local(self) -> datetime:
        return datetime.fromtimestamp(self._wall(), self.tz)

    def wall_minutes(self) -> int:
        t = self._local()
        return t.hour * 60 + t.minute

    # --- inbound -----------------------------------------------------------------------

    def handle_message(self, topic: str, payload: bytes) -> None:
        name = self.devices.handle(topic, payload, self.clock())
        if name is None or not topic.endswith("/availability"):
            return
        dev = self.devices.get(name)
        if dev is not None and dev.available:
            # Back online (or rejoined): re-send its governed settings.
            for rid, w in self.writers.items():
                if w.device == name:
                    w.forget()
                    LOG.info("%s back online: settings will be re-sent", rid)

    async def request_state(self) -> None:
        """Ask every TRV for its current state (a read, so also done in dry run)."""
        for w in self.writers.values():
            await self.publish(self.devices.get_topic(w.device), trv_get_payload())

    # --- Driver protocol -------------------------------------------------------------

    async def snapshot(
        self, mode: Mode, overrides: dict[str, float], store_boost: bool, fire: set[str]
    ) -> Snapshot:
        if self.boiler is not None:
            await self.boiler.refresh()
        now = self.clock()
        local = self._local()
        weekday, minute = local.weekday(), local.hour * 60 + local.minute
        silence = self.site.sensor_max_silence_s
        rooms: dict[str, RoomInput] = {}
        for rc in self.cfg.rooms:
            dev = self.site.devices[rc.id]
            inp = RoomInput()
            sensor = self.devices.get(dev.sensor)
            if sensor is not None:
                age = reading_age(sensor, "temperature", now, silence)
                if age is not None and sensor.number("temperature") is not None:
                    inp.temperature = sensor.number("temperature")
                    inp.temperature_age_s = age
                if rc.has_humidity:
                    inp.humidity = sensor.number("humidity")
            trv = self.devices.get(dev.trv)
            if trv is not None:
                age = reading_age(trv, "local_temperature", now, silence)
                inp.trv_temperature = trv.number("local_temperature")
                inp.trv_age_s = age if age is not None else NEVER
                inp.trv_available = is_available(trv, now, silence)
                state = trv.values.get("running_state")
                inp.trv_heating = None if state is None else state == "heat"
                opening = trv.number("valve_opening_degree")
                inp.opening_echo = None if opening is None else round(opening)
            else:
                inp.trv_available = False
            window = self.devices.get(dev.window)
            if window is not None and isinstance(window.values.get("contact"), bool):
                inp.window_open = not window.values["contact"]
            if rc.id in fire:
                inp.fire_switch = True
            if rc.controllable:
                week = self.site.schedule_for(rc.id)
                if rc.id in overrides:
                    inp.setpoint = overrides[rc.id]
                else:
                    inp.setpoint = week.setpoint_at(weekday, minute)
                    inp.next_setpoint, inp.next_setpoint_in_s = week.next_change(weekday, minute)
            rooms[rc.id] = inp

        outdoor = None
        out_dev = self.devices.get(self.site.outdoor_sensor)
        if out_dev is not None:
            age = out_dev.age("temperature", now)
            if age is not None and age <= OUTDOOR_MAX_AGE_S:
                outdoor = out_dev.number("temperature")

        heating, store = self._last_heating, self._last_store
        if self.boiler is not None and self.boiler.reachable and self.boiler.heating:
            heating = self.boiler.heating.output
            store = self.boiler.store.output if self.boiler.store else store
        return Snapshot(
            now=now,
            minute_of_day=minute,
            outdoor=outdoor,
            rooms=rooms,
            heating_relay=heating,
            store_relay=store,
            mode=mode,
            store_boost=store_boost,
        )

    async def apply(self, actions: Actions) -> None:
        now = self.clock()
        weekday = self._local().weekday()
        for rid, action in actions.valves.items():
            writer = self.writers.get(rid)
            if writer is None:
                continue
            echo = self.devices.get(writer.device)
            mirror = self.site.schedule_for(rid).trvzb_payload()
            for write in writer.plan(action, echo, now, mirror):
                self._send(write)
        self._last_heating, self._last_store = actions.heating_relay, actions.store_relay
        if self.boiler is not None:
            await self.boiler.command(actions.heating_relay, actions.store_relay, int(self._wall()))
            heat = fallback_heating_windows(
                [self.site.schedule_for(r.id) for r in self.cfg.rooms if r.controllable],
                weekday,
            )
            await self.boiler.push_fallback(heat, self.cfg.store.windows)

    def _send(self, write: Write) -> None:
        if write.delay_s > 0:
            task = asyncio.get_running_loop().create_task(self._send_later(write))
            self._pending.add(task)
            task.add_done_callback(self._pending.discard)
            return
        topic = self.devices.set_topic(write.device)
        if self.dry_run:
            self.intended.append((self.clock(), topic, write.payload))
            self.intended_count += 1
            LOG.info("dry run: would publish %s %s", topic, write.payload)
            return
        task = asyncio.get_running_loop().create_task(self.publish(topic, write.payload))
        self._pending.add(task)
        task.add_done_callback(self._pending.discard)
        self.published += 1

    async def _send_later(self, write: Write) -> None:
        await asyncio.sleep(write.delay_s)
        self._send(Write(write.device, write.payload))

    async def drain(self) -> None:
        """Wait for scheduled writes (close bumps) to go out. For tests and shutdown."""
        while self._pending:
            await asyncio.gather(*list(self._pending), return_exceptions=True)

    # --- reporting -------------------------------------------------------------------

    def alerts(self) -> list[Reason]:
        out: list[Reason] = []
        now = self.clock()
        if not self._connected():
            out.append(Reason("driver.mqtt", "MQTT broker not connected"))
        for rc in self.cfg.rooms:
            dev = self.site.devices[rc.id]
            trv = self.devices.get(dev.trv)
            if dev.trv and not is_available(trv, now, self.site.sensor_max_silence_s):
                out.append(Reason("driver.trv_offline", f"{rc.name}: TRV not reachable", rc.id))
            w = self.writers.get(rc.id)
            if w is not None and w.failed:
                keys = ", ".join(sorted(w.failed))
                out.append(
                    Reason("driver.write_failed", f"{rc.name}: TRV did not accept {keys}", rc.id)
                )
        if self.boiler is not None and not self.boiler.reachable:
            out.append(Reason("driver.shelly", "Boiler relay (Shelly) not reachable"))
        return out

    def telemetry(self) -> dict:
        t: dict[str, Any] = {
            "simulated": False,
            "dry_run": self.dry_run,
            "mqtt_connected": self._connected(),
            "valve_writes": self.published,
            "intended_writes": self.intended_count,
            "recent_intended": [
                {"topic": topic, "payload": payload}
                for _, topic, payload in list(self.intended)[-5:]
            ],
        }
        if self.boiler is not None:
            t.update(self.boiler.telemetry())
            t["shelly_intended"] = len(self.boiler.intended)
        return t
