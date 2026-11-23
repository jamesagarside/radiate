"""The live house driver: Zigbee2MQTT valves and sensors, a Shelly boiler relay, and
the room schedules from the config file (ADR-0002 drivers).

Implements the runtime's `Driver` protocol. In dry run every device is read but
nothing is written: valve settings, relay commands and the heartbeat are logged and
kept in `intended` instead (spec 4.5 one-valve rollout).
"""

from __future__ import annotations

import asyncio
import dataclasses
import logging
import time
from collections import deque
from collections.abc import Awaitable, Callable
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from radiate.config import SiteConfig, WeekSchedule
from radiate.core import Actions, Mode, Reason, RoomInput, Snapshot
from radiate.core.types import RoomRole

from . import devices as health
from .devices import DeviceHealth, HealthLimits, NetworkScan, ScanRefused
from .shelly import ShellyBoiler, fallback_heating_windows
from .z2m import DeviceStore, TrvWriter, Write, is_available, reading_age, trv_get_payload

LOG = logging.getLogger(__name__)
NEVER = 1e9
OUTDOOR_MAX_AGE_S = 2 * 3600
SENSOR_MEMORY_MAX_S = 24 * 3600  # remembered sensor readings older than this are dropped
REMEMBERED = ("temperature", "humidity")

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
        self._handover = False  # safe mode: boiler left to the Shelly watchdog
        self._relay_seen_at: float | None = None  # last successful read of the relay
        self._shelly_seen_at: float | None = None  # last successful Shelly refresh
        # Device health (spec 10): thresholds from the house file, and the network scan
        # a person can ask for from the devices view.
        self.limits = HealthLimits(
            low_battery_pct=site.monitoring.low_battery_pct,
            weak_signal_lqi=site.monitoring.weak_signal_lqi,
            stale_after_s=site.sensor_max_silence_s,
        )
        self.scan = NetworkScan()
        self._pending: set[asyncio.Task] = set()
        # Days of ticks the runtime records for replay and bootstrap (spec 4.3, 6).
        self.history_days = site.history_days
        self._started_at = self.clock()
        # Room sensors: remembered across restarts, and awaited after start (spec 7).
        self._room_sensors = {d.sensor for d in site.devices.values() if d.sensor}

    # --- clock -----------------------------------------------------------------------

    def clock(self) -> float:
        return self._clock()

    def _local(self) -> datetime:
        return datetime.fromtimestamp(self._wall(), self.tz)

    def wall_minutes(self) -> int:
        t = self._local()
        return t.hour * 60 + t.minute

    def wall_weekday(self) -> int:
        return self._local().weekday()

    def schedules(self) -> dict[str, tuple[str | None, WeekSchedule]]:
        """Each controllable room's week as Radiate follows it now, with its schedule name.

        The name is None for a household room, whose week is compiled for the people
        at home (see `set_household_schedules`). Household rooms give the live week,
        with warm-by times; the valve's copy starts each period earlier.
        """
        return {
            rc.id: (self.site.devices[rc.id].schedule, self.site.live_schedule_for(rc.id))
            for rc in self.cfg.rooms
            if rc.controllable
        }

    def next_change_s(self, room_id: str) -> float | None:
        """Seconds until the room's schedule next changes its setpoint."""
        rc = next((r for r in self.cfg.rooms if r.id == room_id), None)
        if rc is None or not rc.controllable:
            return None
        t = self._local()
        week = self.site.live_schedule_for(room_id)
        _, in_s = week.next_change(t.weekday(), t.hour * 60 + t.minute)
        return in_s - t.second

    def replace_household(self, site: SiteConfig) -> None:
        """Use `site`'s household from now on: a new setup saved from the web UI.

        Rooms it covers follow its weeks; every other room goes back to the house
        file's schedule. Only the household changes: devices and settings stay as they
        are. The runtime hands over the weeks for the people away straight after.
        """
        self.site = dataclasses.replace(
            self.site,
            devices={
                rid: dataclasses.replace(dev, schedule=site.devices[rid].schedule)
                if rid in site.devices
                else dev
                for rid, dev in self.site.devices.items()
            },
            household=site.household,
            household_schedules=dict(site.household_schedules),
            household_live=dict(site.household_live),
            household_fallback=dict(site.household_fallback),
        )

    def set_household_schedules(
        self,
        schedules: dict[str, WeekSchedule],
        live: dict[str, WeekSchedule] | None = None,
    ) -> None:
        """Use these weeks for the household's rooms from now on (away changed).

        `schedules` are the valve's weeks for the people at home now. The schedule
        mirror and the Shelly fallback do not follow them: they keep the weeks for
        everyone at home (`site.fallback_schedule_for`), so they fail warm. `live` are the weeks Radiate follows:
        snapshots and overrides ending at the next change read them through
        `site.live_schedule_for`. Without `live`, Radiate follows the valve's weeks.
        """
        known = {rid: week for rid, week in schedules.items() if rid in self.site.devices}
        live_known = {
            rid: week for rid, week in (live or known).items() if rid in self.site.devices
        }
        self.site = dataclasses.replace(
            self.site,
            household_schedules={**self.site.household_schedules, **known},
            household_live={**self.site.household_live, **live_known},
        )

    # --- inbound -----------------------------------------------------------------------

    def handle_message(self, topic: str, payload: bytes) -> None:
        if topic == self.devices.response_topic("networkmap"):
            self.scan.response(payload, self.clock())
            return
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

    def sensor_memory(self) -> dict[str, dict[str, float]]:
        """Each room sensor's last readings and when they were taken (wall-clock
        seconds), for the runtime to save. Battery sensors sleep and cannot be asked
        for a reading, so after a restart this is all Radiate has until they report."""
        now, wall = self.clock(), self._wall()
        out: dict[str, dict[str, float]] = {}
        for name in sorted(self._room_sensors):
            dev = self.devices.get(name)
            if dev is None:
                continue
            temp, age = dev.number("temperature"), dev.age("temperature", now)
            if temp is None or age is None:
                continue
            entry = {"temperature": temp, "at": wall - age}
            humidity = dev.number("humidity")
            if humidity is not None and dev.age("humidity", now) is not None:
                entry["humidity"] = humidity
            out[name] = entry
        return out

    def restore_sensor_memory(self, data: object) -> None:
        """Take back saved room sensor readings with their true age (spec 7, fail warm).

        A reading older than a day, from the future, or for a sensor the house file no
        longer names is dropped. A reading that has arrived since start wins.
        """
        if not isinstance(data, dict):
            return
        now, wall = self.clock(), self._wall()
        for name, entry in data.items():
            dev = self.devices.get(name) if name in self._room_sensors else None
            if dev is None or not isinstance(entry, dict):
                continue
            at = entry.get("at")
            if isinstance(at, bool) or not isinstance(at, (int, float)):
                continue
            age = wall - at
            if not 0 <= age <= SENSOR_MEMORY_MAX_S:
                continue
            for key in REMEMBERED:
                value = entry.get(key)
                if isinstance(value, (int, float)) and not isinstance(value, bool):
                    dev.remember(key, float(value), age, now)

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
            if self.boiler.reachable:
                self._shelly_seen_at = self.clock()
        now = self.clock()
        local = self._local()
        weekday, minute = local.weekday(), local.hour * 60 + local.minute
        silence = self.site.sensor_max_silence_s
        # Without the broker or Zigbee2MQTT, device state is frozen at its last value:
        # treat every TRV as unreachable so the core enters safe mode (spec 7).
        zigbee_up = self._zigbee_up()
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
                    inp.temperature_restored = "temperature" in sensor.restored
                elif rc.role is RoomRole.NORMAL:
                    # Not heard since start: the core waits for it before the TRV.
                    inp.sensor_missing_s = now - self._started_at
                if rc.has_humidity:
                    inp.humidity = sensor.number("humidity")
            trv = self.devices.get(dev.trv)
            if trv is not None:
                age = reading_age(trv, "local_temperature", now, silence)
                inp.trv_temperature = trv.number("local_temperature")
                inp.trv_age_s = age if age is not None else NEVER
                inp.trv_available = zigbee_up and is_available(trv, now, silence)
                state = trv.values.get("running_state")
                inp.trv_heating = None if state is None else state == "heat"
                opening = trv.number("valve_opening_degree")
                inp.opening_echo = None if opening is None else round(opening)
                inp.trv_rejected = self._rejected(rc.id)
            else:
                inp.trv_available = False
            window = self.devices.get(dev.window)
            if window is not None and isinstance(window.values.get("contact"), bool):
                inp.window_open = not window.values["contact"]
            if rc.id in fire:
                inp.fire_switch = True
            if rc.controllable:
                week = self.site.live_schedule_for(rc.id)
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

        # Without a reading, the relay is taken to be as last commanded. When it is read
        # again, the core is told how long it went unseen: the watchdog may have
        # switched it meanwhile (spec 5.7 hand-back).
        heating, store = self._last_heating, self._last_store
        unseen = 0.0
        if self.boiler is not None and self.boiler.reachable and self.boiler.heating:
            heating = self.boiler.heating.output
            store = self.boiler.store.output if self.boiler.store else store
            if self._relay_seen_at is not None:
                unseen = now - self._relay_seen_at
            self._relay_seen_at = now
        return Snapshot(
            now=now,
            minute_of_day=minute,
            outdoor=outdoor,
            rooms=rooms,
            heating_relay=heating,
            store_relay=store,
            mode=mode,
            store_boost=store_boost,
            day=local.date().toordinal(),
            # In dry run the relay is not Radiate's: the guard must not adopt it.
            relay_follows_commands=not self.dry_run,
            heating_relay_unseen_s=unseen,
        )

    async def apply(self, actions: Actions) -> None:
        now = self.clock()
        weekday = self._local().weekday()
        for rid, action in actions.valves.items():
            writer = self.writers.get(rid)
            if writer is None:
                continue
            echo = self.devices.get(writer.device)
            mirror = self._mirror(rid)
            info = self.devices.bridge_devices.get(writer.device)
            exposes = info.exposes if info is not None else None
            for write in writer.plan(action, echo, now, mirror, exposes):
                self._send(write)
        self._last_heating, self._last_store = actions.heating_relay, actions.store_relay
        # Safe mode with no burn of Radiate's own: stop commanding the relay and stop
        # the heartbeat, so the Shelly watchdog runs its fallback schedule (spec 7).
        # The core decides; it keeps following the relay meanwhile, so it can hand back.
        handover = actions.watchdog_handover
        starting = handover and not self._handover
        if starting:
            LOG.warning("safe mode: boiler handed to the Shelly watchdog")
        elif self._handover and not handover:
            LOG.info("safe mode over: Radiate controls the boiler again")
        self._handover = handover
        if self.boiler is not None:
            if not handover:
                await self.boiler.command(
                    actions.heating_relay, actions.store_relay, int(self._wall())
                )
            elif starting and not actions.heating_relay:
                # Radiate's own burn has just ended: switch it off once, without a
                # heartbeat, rather than leave it on until the watchdog takes over.
                await self.boiler.command(
                    False, actions.store_relay, int(self._wall()), heartbeat=False
                )
            await self.boiler.push_fallback(self.fallback_windows(weekday), self.cfg.store.windows)

    def fallback_windows(self, weekday: int) -> list[list[int]]:
        """The Shelly watchdog's heating windows for `weekday`: from every room's week
        with everyone at home, and never empty (spec 7, fail warm)."""
        return fallback_heating_windows(
            [self.site.fallback_schedule_for(r.id) for r in self.cfg.rooms if r.controllable],
            weekday,
            frost_c=self.cfg.boiler.frost_c,
        )

    def _mirror(self, room_id: str) -> dict[str, str]:
        """The room's schedule in the frame its TRV compares setpoints with."""
        return self.site.mirror_payload(room_id)

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

    def _rejected(self, room_id: str) -> tuple[str, ...]:
        """Settings the room's TRV did not take after the reconciler's retries.

        None in dry run: nothing was sent, so an echo that disagrees proves nothing.
        """
        w = self.writers.get(room_id)
        if w is None or self.dry_run:
            return ()
        return tuple(sorted(w.failed))

    def _zigbee_up(self) -> bool:
        return self._connected() and self.devices.bridge_online is not False

    # --- reporting -------------------------------------------------------------------

    def alerts(self) -> list[Reason]:
        out: list[Reason] = []
        now = self.clock()
        if not self._connected():
            out.append(Reason("driver.mqtt", "MQTT broker not connected"))
        elif self.devices.bridge_online is False:
            out.append(Reason("driver.zigbee2mqtt", "Zigbee2MQTT offline"))
        if self._handover and self.boiler is not None:
            out.append(
                Reason(
                    "driver.watchdog_handover",
                    "Boiler on the Shelly fallback schedule: no TRVs reachable",
                )
            )
        for rc in self.cfg.rooms:
            dev = self.site.devices[rc.id]
            trv = self.devices.get(dev.trv)
            if dev.trv and not is_available(trv, now, self.site.sensor_max_silence_s):
                out.append(Reason("driver.trv_offline", f"{rc.name}: TRV not reachable", rc.id))
            rejected = self._rejected(rc.id)
            if rejected:
                keys = ", ".join(rejected)
                out.append(
                    Reason("driver.write_failed", f"{rc.name}: TRV did not accept {keys}", rc.id)
                )
        if self.boiler is not None and not self.boiler.reachable:
            out.append(Reason("driver.shelly", "Boiler relay (Shelly) not reachable"))
        # Battery, signal and silent sensors. The relay has its own alert above, and
        # while the broker or Zigbee2MQTT is down every device would be listed.
        if self._zigbee_up():
            zigbee = [d for d in self.health() if d.kind != "relay"]
            out.extend(health.alerts(zigbee, self.limits))
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
            # False until a `shelly` section is configured: the boiler is not
            # switched, so the UI says so rather than "Boiler idle".
            "boiler_linked": self.boiler is not None,
        }
        if self.boiler is not None:
            t.update(self.boiler.telemetry())
            t["shelly_intended"] = len(self.boiler.intended)
        return t

    # --- device health (spec 10) -------------------------------------------------------

    def _zigbee_health(
        self,
        name: str,
        kind: str,
        now: float,
        room_id: str | None = None,
        room: str | None = None,
    ) -> DeviceHealth:
        dev = self.devices.get(name)
        info = self.devices.bridge_devices.get(name)
        d = DeviceHealth(id=name, kind=kind, room_id=room_id, room_name=room)
        if info is not None:
            d.model, d.vendor, d.firmware = info.model, info.vendor, info.firmware
            d.power = info.power
        if kind == "router" and d.power is None:
            d.power = "mains"
        if self.scan.map is not None:
            d.route = self.scan.map.routes.get(name)
        if dev is None:
            return d
        if dev.available is not None or dev.last_message is not None:
            d.available = is_available(dev, now, self.site.sensor_max_silence_s)
        # Zigbee2MQTT's own last_seen, when it sends one, survives a Radiate restart.
        seen = health.last_seen_wall(dev.values.get("last_seen"))
        if seen is not None:
            d.last_seen_s = max(0.0, self._wall() - seen)
        elif dev.last_message is not None:
            d.last_seen_s = now - dev.last_message
        d.battery_pct = dev.number("battery")
        d.linkquality = dev.number("linkquality")
        if kind in ("sensor", "outdoor"):
            d.temperature_c = dev.number("temperature")
            d.humidity_pct = dev.number("humidity")
            d.reading_age_s = dev.age("temperature", now)
        elif kind == "trv":
            d.temperature_c = dev.number("local_temperature")
            d.valve = {
                "opening_pct": dev.number("valve_opening_degree"),
                "closing_pct": dev.number("valve_closing_degree"),
                "mode": dev.values.get("system_mode"),
                "running_state": dev.values.get("running_state"),
                "setpoint_c": dev.number("occupied_heating_setpoint"),
                "sensor": dev.values.get("temperature_sensor_select"),
            }
        elif kind == "window":
            contact = dev.values.get("contact")
            d.contact = contact if isinstance(contact, bool) else None
        return d

    def health(self) -> list[DeviceHealth]:
        """Every device Radiate depends on: each room's TRV, room sensor and window
        sensor, the outdoor sensor, Zigbee2MQTT's routers and the boiler relay."""
        now = self.clock()
        out: list[DeviceHealth] = []
        seen: set[str] = set()
        for rc in self.cfg.rooms:
            dev = self.site.devices[rc.id]
            for name, kind in ((dev.trv, "trv"), (dev.sensor, "sensor"), (dev.window, "window")):
                if name and name not in seen:
                    seen.add(name)
                    out.append(self._zigbee_health(name, kind, now, rc.id, rc.name))
        outdoor = self.site.outdoor_sensor
        if outdoor and outdoor not in seen:
            seen.add(outdoor)
            out.append(self._zigbee_health(outdoor, "outdoor", now))
        for name in self.devices.routers():
            if name not in seen:
                seen.add(name)
                out.append(self._zigbee_health(name, "router", now))
        if self.boiler is not None:
            relay = DeviceHealth(id="boiler_relay", kind="relay", link="wifi", power="mains")
            relay.model = "Shelly"
            if self._shelly_seen_at is not None:
                relay.available = self.boiler.reachable
                relay.last_seen_s = now - self._shelly_seen_at
            elif self.boiler.errors:
                relay.available = False
            heating, store = self.boiler.heating, self.boiler.store
            relay.relay = {
                "heating": heating.output if heating else None,
                "store": store.output if store else None,
                "power_w": heating.apower if heating else None,
            }
            out.append(relay)
        return out

    def devices_view(self) -> dict:
        """The `GET /api/v1/devices` body."""
        now = self.clock()
        network = {"mqtt": self._connected(), "zigbee2mqtt": self.devices.bridge_online}
        scan = self.scan.view(now, available=self.site.mqtt is not None)
        return health.view(self.health(), self.limits, scan, network)

    def request_network_scan(self) -> dict:
        """Ask Zigbee2MQTT for a raw network map. Only on a person's request.

        A read: it changes no device, so it is allowed in dry run. It does slow the
        mesh while Zigbee2MQTT asks each router, so `NetworkScan` allows one at a time
        and one start every 10 minutes. The answer arrives on
        `bridge/response/networkmap` (see `handle_message`).
        """
        if self.site.mqtt is None:
            raise ScanRefused(404, "no Zigbee2MQTT to scan")
        if not self._zigbee_up():
            raise ScanRefused(503, "Zigbee2MQTT is not reachable")
        now = self.clock()
        tx = self.scan.start(now)
        payload = {"type": "raw", "routes": False, "transaction": tx}
        task = asyncio.get_running_loop().create_task(
            self.publish(self.devices.request_topic("networkmap"), payload)
        )
        self._pending.add(task)
        task.add_done_callback(self._pending.discard)
        task.add_done_callback(self._scan_sent)
        return self.scan.view(now)

    def _scan_sent(self, task: asyncio.Task) -> None:
        failed = task.cancelled() or task.exception() is not None or not task.result()
        if failed and self.scan.state == "scanning":
            self.scan.fail("could not send the request to Zigbee2MQTT")
