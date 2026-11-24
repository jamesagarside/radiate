"""Server runtime: owns config, engine state and a device driver; runs the loop.

The same runtime serves all three editions (ADR-0002). Drivers translate between
devices and the core's Snapshot/Actions; the runtime never talks to devices itself.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import time
import uuid
from collections import deque
from collections.abc import Callable
from dataclasses import dataclass, field, replace
from datetime import datetime
from typing import Protocol
from zoneinfo import ZoneInfo

from radiate import __version__
from radiate.config.away import (
    AWAY_MAX_DAYS,
    PRESENCE_STATES,
    Presence,
    Return,
    effective_away,
    everyone_away,
    local_iso,
    next_return,
    stale,
    status,
    tidy,
)
from radiate.config.household import (
    CompiledHousehold,
    EveryoneAway,
    Household,
    UseLevel,
    compile_household,
    household_view,
)
from radiate.config.use import (
    Baseline,
    compile_baseline,
    compile_schedule_baseline,
    room_use,
    schedule_room_use,
)
from radiate.core import Actions, EngineState, HouseConfig, Mode, Reason, Snapshot, decide
from radiate.core.bootstrap import bootstrap, needs_bootstrap
from radiate.core.history import compact_actions, tick_data
from radiate.core.persist import dump_state, first_start_state, load_state
from radiate.core.series import observed_values, tick_values
from radiate.core.types import BoilerState, DemandMode, RoomRole, RoomUse
from radiate.server import layout
from radiate.server.savings import DailyHistory, day_estimate, savings_view

LOG = logging.getLogger(__name__)
INDEX_CHUNK = 200  # ticks the raw data index reads at a time while it catches up
EXPORT_ERROR_LOG_S = 3600.0


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

    # Optional: `next_change_s(room_id) -> float | None`, seconds until the room's
    # schedule next changes its setpoint. Without it, overrides last until cleared.
    # Optional: `set_household_schedules(schedules, live=...)`, the household's rooms
    # compiled again for the people at home: the valve's weeks and the weeks live
    # control follows. The driver uses them from then on.
    # Optional: `replace_household(site)`, a new household from the web UI's setup
    # (radiate.server.setup): which rooms it covers, and the house file's schedule for
    # every other room. `set_household_schedules` follows straight after.
    # Optional: `devices_view()`, the `GET /api/v1/devices` body (radiate.drivers.devices),
    # and `request_network_scan()`, which starts a network scan and returns its state or
    # raises `ScanRefused`.
    # Optional: `history_days`, days of ticks to record in the state database. Only the
    # live driver sets it, so the demo never records.


OVERRIDE_UNTIL = ("next_change", "duration", "cleared")
OVERRIDE_MAX_MIN = 7 * 24 * 60


@dataclass
class Override:
    """A manual setpoint for one room and when it ends (driver clock seconds)."""

    setpoint: float
    until: str  # one of OVERRIDE_UNTIL
    expires_at: float | None  # None: until cleared


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
    daily: DailyHistory = field(init=False)
    mode: Mode = Mode.AUTO
    # Demand mode chosen through the API (spec 5.3); None follows `boiler.demand_mode`.
    demand_mode: DemandMode | None = None
    overrides: dict[str, float] = field(default_factory=dict)  # setpoints the driver applies
    override_meta: dict[str, Override] = field(default_factory=dict)  # when each one ends
    fire: set[str] = field(default_factory=set)
    store_boost_until: float = 0.0
    last_actions: Actions | None = None
    last_snapshot: Snapshot | None = None
    decisions: deque[DecisionRecord] = field(default_factory=lambda: deque(maxlen=500))
    relay_history: deque[tuple[float, bool, bool]] = field(
        default_factory=lambda: deque(maxlen=2880)
    )
    listeners: list[asyncio.Queue] = field(default_factory=list)
    exporter: object | None = None  # radiate.export.elastic.ElasticExporter
    otlp: object | None = None  # radiate.export.otlp.OtlpExporter
    store: object | None = None  # radiate.server.store.Store; None keeps state in memory
    save_every_s: float = 300.0
    wall: Callable[[], float] = field(default=lambda: time.time())  # Unix time
    recorder: object | None = None  # radiate.server.history.Recorder; set by restore()
    # Household and away (radiate.config.away). Away times are wall-clock seconds.
    household: Household | None = None
    timezone: str = "Europe/London"
    presence: dict[str, Presence] = field(default_factory=dict)
    away: frozenset[str] = frozenset()  # people who count as away, as last compiled
    everyone_away: bool = False
    # The next known return while it is within the household's return warm-up.
    returning: Return | None = None
    # The `person` entities Home Assistant last reported, [{"entity_id", "name"}], and
    # when (wall-clock seconds). Memory only: the integration reports them again at
    # start-up and every 15 minutes. None: never reported.
    ha_persons: list[dict] | None = None
    ha_persons_at: float | None = None
    setup: object | None = None  # radiate.server.setup.HouseholdSetup; None: not offered
    layout: dict | None = None  # where rooms sit, for the web UI's model (server.layout)
    # The use level of each room on a hand-written schedule that gives one, as
    # (weekdays, weekend): `SiteConfig.schedule_use`. Household rooms ignore it.
    schedule_use: dict[str, tuple[UseLevel, UseLevel]] = field(default_factory=dict)
    _compiled: dict[frozenset[str], CompiledHousehold] = field(default_factory=dict)
    _stale: frozenset[str] = frozenset()  # people whose presence has gone stale
    _rebuild: bool = False  # the household changed: push its weeks even if away did not
    _baseline: Baseline | None = None  # the household's savings baseline, compiled once
    _return_logged: float | None = None
    _saved_at: float | None = None
    _away_log: list[Reason] = field(default_factory=list)  # for the exporter, next tick
    _alert_keys: set[tuple[str, str | None, str]] = field(default_factory=set)
    _task: asyncio.Task | None = None
    _index_task: asyncio.Task | None = None
    _otlp_error_at: float | None = None

    def __post_init__(self) -> None:
        self.state = EngineState.new(self.cfg)
        # Closed day summaries for savings (spec 5.9), kept in the state database.
        self.daily = DailyHistory(self.store)

    # --- persistence ---------------------------------------------------------------------

    def restore(self) -> list[str]:
        """Load the house id, mode, settings and engine state from the store, if any.

        With a history (the driver's `history_days`), this also starts recording, and
        when there is no usable saved engine state it warms the learner by replaying
        the recorded history (spec 4.3).
        """
        if self.store is None:
            return []
        saved_id = self.store.get("house_id")
        if saved_id is not None and isinstance(saved_id[0], str):
            self.house_id = saved_id[0]
        else:
            self.store.put("house_id", self.house_id)
        saved_rt = self.store.get("runtime")
        wall = self.wall()
        if saved_rt is not None and isinstance(saved_rt[0], dict):
            with contextlib.suppress(ValueError):
                self.mode = Mode(saved_rt[0].get("mode", "auto"))
            saved_demand = saved_rt[0].get("demand_mode")
            if saved_demand is not None:
                with contextlib.suppress(ValueError):
                    self.demand_mode = DemandMode(saved_demand)
            self._restore_overrides(saved_rt[0].get("overrides"), wall - saved_rt[1])
        saved_away = self.store.get("away")
        if saved_away is not None:
            self._restore_away(saved_away[0])
        saved_layout = self.store.get("layout")
        if saved_layout is not None:
            self.layout = layout.restore(saved_layout[0], {r.id for r in self.cfg.rooms})
        self.daily = DailyHistory(self.store)
        now = self.driver.clock()
        data, elapsed = None, 0.0
        saved = self.store.get("engine")
        if saved is not None:
            data, saved_wall = saved
            elapsed = max(0.0, wall - saved_wall)
        history = self._open_history()
        if history is not None and needs_bootstrap(data):
            data = self._bootstrap(history, data, wall)
        problems: list[str] = []
        if data is not None:
            self.state, problems = load_state(self.cfg, data, now, elapsed)
            self._saved_at = now
        else:
            self.state = first_start_state(self.cfg)
        if history is not None:
            from radiate.server.history import Recorder

            # The start entry records exactly how this state was built, for replay.
            self.recorder = Recorder(history, int(wall * 1000), now, wall, data, elapsed)
            self.recorder.index = self._open_index(history)
        return problems

    def _open_history(self):
        days = getattr(self.driver, "history_days", None)
        if self.store is None or not isinstance(days, (int, float)) or days <= 0:
            return None
        from radiate.server.history import History

        try:
            return History(self.store, float(days))
        except Exception as err:  # history is a convenience: never stop the server
            LOG.warning("history: cannot open: %s", err)
            return None

    def _open_index(self, history):
        """The raw data index of the history (radiate.server.data), or None."""
        from radiate.server.data import SeriesIndex

        try:
            return SeriesIndex(self.store, history)
        except Exception as err:  # raw data is a convenience: never stop the server
            LOG.warning("raw data: cannot open the index: %s", err)
            return None

    def _bootstrap(self, history, data: object, wall: float) -> object:
        try:
            merged, ticks = bootstrap(self.cfg, history.recent(wall), data)
        except Exception as err:
            LOG.warning("bootstrap: skipped: %s", err)
            return data
        if merged is None:
            return data
        LOG.info("bootstrap: learned room models from %d recorded ticks", ticks)
        return merged

    def save(self) -> None:
        if self.store is None:
            return
        now = self.driver.clock()
        self.store.put("engine", dump_state(self.state, now))
        self._save_runtime(now)
        self._saved_at = now

    def _save_runtime(self, now: float) -> None:
        if self.store is None:
            return
        overrides = {}
        for rid, sp in self.overrides.items():
            meta = self.override_meta.get(rid)
            left = None if meta is None or meta.expires_at is None else meta.expires_at - now
            # Stored as time left, like engine timers: the clock restarts with the process.
            overrides[rid] = {
                "setpoint": sp,
                "until": meta.until if meta else "cleared",
                "remaining_s": left,
            }
        self.store.put(
            "runtime",
            {
                "mode": self.mode.value,
                "overrides": overrides,
                "demand_mode": self.demand_mode.value if self.demand_mode else None,
            },
        )

    # --- layout --------------------------------------------------------------------------

    def set_layout(self, body: object) -> dict:
        """Replace the house layout (radiate.server.layout); saved straight away.

        Raises layout.LayoutError when the body is not a valid layout.
        """
        self.layout = layout.validate(body, {r.id for r in self.cfg.rooms})
        if self.store is not None:
            self.store.put("layout", self.layout)
        return {"layout": self.layout}

    # --- settings ------------------------------------------------------------------------

    @property
    def effective_demand_mode(self) -> DemandMode:
        return self.demand_mode or self.cfg.boiler.demand_mode

    def set_demand_mode(self, mode: DemandMode | None) -> None:
        """Choose the demand mode (spec 5.3), or None to follow the configuration file.
        Saved straight away and used from the next tick."""
        self.demand_mode = mode
        self._save_runtime(self.driver.clock())

    def settings(self) -> dict:
        """Settings a person can see, and `demand_mode` they can change at runtime."""
        b, learning = self.cfg.boiler, self.cfg.learning
        return {
            "demand_mode": self.effective_demand_mode.value,
            "demand_mode_default": b.demand_mode.value,
            "demand_modes": [m.value for m in DemandMode],
            "comfort_limit_k": b.comfort_limit_k,
            "eco_limit_k": b.eco_limit_k,
            "learning_memory_days": learning.memory_days,
            "learn_on_trv_fallback": learning.learn_on_trv_fallback,
        }

    # --- devices ---------------------------------------------------------------------

    def devices_view(self) -> dict | None:
        """The health of every device the driver depends on, or None if it cannot say."""
        view = getattr(self.driver, "devices_view", None)
        return view() if callable(view) else None

    def scan_network(self) -> dict | None:
        """Start a network scan; None if the driver has no mesh to scan.

        Raises `radiate.drivers.devices.ScanRefused` while one runs or too soon after
        the last one.
        """
        scan = getattr(self.driver, "request_network_scan", None)
        return scan() if callable(scan) else None

    def _restore_overrides(self, data: object, elapsed_s: float) -> None:
        if not isinstance(data, dict):
            return
        now = self.driver.clock()
        rooms = {r.id for r in self.cfg.rooms}
        for rid, item in data.items():
            if rid not in rooms or not isinstance(item, dict):
                continue
            sp, until, left = item.get("setpoint"), item.get("until"), item.get("remaining_s")
            if not isinstance(sp, (int, float)) or until not in OVERRIDE_UNTIL:
                continue
            expires = None
            if isinstance(left, (int, float)):
                left -= max(0.0, elapsed_s)
                if left <= 0:
                    continue  # ended while Radiate was down
                expires = now + left
            self.overrides[rid] = float(sp)
            self.override_meta[rid] = Override(float(sp), until, expires)

    # --- setpoint overrides ----------------------------------------------------------

    def set_override(
        self, room_id: str, setpoint: float, until: str | None = None, minutes: float | None = None
    ) -> Override:
        """Hold a room at `setpoint` until its next schedule change (the default), for
        `minutes`, or until cleared. Saved straight away, so a restart keeps it."""
        now = self.driver.clock()
        if minutes is not None:
            if until not in (None, "duration"):
                raise ValueError("give either until or a duration, not both")
            until = "duration"
        until = until or "next_change"
        if until not in OVERRIDE_UNTIL:
            raise ValueError(f"until must be one of {', '.join(OVERRIDE_UNTIL)}")
        expires: float | None = None
        if until == "duration":
            if minutes is None or not 1 <= minutes <= OVERRIDE_MAX_MIN:
                raise ValueError(f"duration_min must be 1 to {OVERRIDE_MAX_MIN}")
            expires = now + minutes * 60
        elif until == "next_change":
            nxt = getattr(self.driver, "next_change_s", None)
            left = nxt(room_id) if callable(nxt) else None
            if left is None:
                until = "cleared"  # no schedule to end it
            else:
                expires = now + left
        override = Override(setpoint, until, expires)
        self.overrides[room_id] = setpoint
        self.override_meta[room_id] = override
        self._save_runtime(now)
        return override

    def clear_override(self, room_id: str) -> None:
        self.overrides.pop(room_id, None)
        self.override_meta.pop(room_id, None)
        self._save_runtime(self.driver.clock())

    def _expire_overrides(self, now: float) -> None:
        expired = [
            rid
            for rid, meta in self.override_meta.items()
            if meta.expires_at is not None and now >= meta.expires_at
        ]
        for rid in expired:
            self.overrides.pop(rid, None)
            self.override_meta.pop(rid, None)
        if expired:
            self._save_runtime(now)

    def override_view(self, room_id: str, now: float) -> dict | None:
        if room_id not in self.overrides:
            return None
        meta = self.override_meta.get(room_id)
        expires = meta.expires_at if meta else None
        return {
            "setpoint": self.overrides[room_id],
            "until": meta.until if meta else "cleared",
            "expires_in_min": None if expires is None else max(0, round((expires - now) / 60)),
        }

    # --- away ----------------------------------------------------------------------------

    def _wall(self) -> float:
        return self.wall()

    @property
    def people(self) -> tuple[str, ...]:
        return tuple(p.id for p in self.household.people) if self.household else ()

    def _frost_hold(self) -> bool:
        """Everyone away holds the house at frost: the household says so, mode is auto."""
        return (
            self.mode is Mode.AUTO
            and self.everyone_away
            and self.household is not None
            and self.household.away.everyone_away is EveryoneAway.FROST
        )

    def effective_mode(self) -> Mode:
        """The mode the core runs in: frost while everyone is away, if the mode is auto.

        The user's chosen mode is never changed, so `off` and `frost` still win, and
        auto comes back by itself when someone is home. Within the return warm-up
        before someone is due back the core runs in auto, with every room still held
        at frost until the return, so optimum start can warm the house for it.
        """
        if self._frost_hold() and self.returning is None:
            return Mode.FROST
        return self.mode

    # Settings, in the units the away functions take.

    def _delay_s(self) -> float:
        return self.household.away.presence_delay_min * 60.0 if self.household else 0.0

    def _lead_s(self) -> float:
        return self.household.return_lead_min() * 60.0 if self.household else 0.0

    def _stale_s(self) -> float | None:
        if self.household is None:
            return None
        return self.household.away.presence_stale_after_min * 60.0 or None

    def _compile(self, away: frozenset[str]) -> CompiledHousehold:
        if away not in self._compiled:
            self._compiled[away] = compile_household(self.household, away=away)
        return self._compiled[away]

    def _person(self, person_id: str) -> Presence:
        if person_id not in self.people:
            raise KeyError(person_id)
        return self.presence.get(person_id, Presence())

    def _put_presence(self, person_id: str, p: Presence) -> None:
        if p.empty:
            self.presence.pop(person_id, None)
        else:
            self.presence[person_id] = p
        self._save_away()
        self._update_away()

    def set_away(self, person_id: str, until: float) -> None:
        """Count a person as away until `until` (wall-clock seconds). Saved at once."""
        p = self._person(person_id)
        now = self._wall()
        if until <= now:
            raise ValueError("until must be in the future")
        if until > now + AWAY_MAX_DAYS * 86400:
            raise ValueError(f"until must be within {AWAY_MAX_DAYS} days")
        self._put_presence(person_id, replace(p, away_until=until, set_at=now))

    def clear_away(self, person_id: str) -> None:
        p = self._person(person_id)
        self._put_presence(person_id, replace(p, away_until=None, set_at=None))

    def report_presence(self, person_id: str, state: str | None, since: float | None) -> None:
        """Home Assistant presence: `home`, `not_home`, or None to forget it.

        `since` is when the state last changed, never later than now. Without it, a
        repeat of the current state keeps its time and a new state starts now.
        """
        p = self._person(person_id)
        if state is None:
            self._put_presence(person_id, replace(p, state=None, since=None))
            return
        if state not in PRESENCE_STATES:
            raise ValueError("state must be home or not_home")
        now = self._wall()
        if since is None:
            since = p.since if state == p.state and p.since is not None else now
        # Every report, a repeat included, refreshes the presence (the heartbeat).
        fresh = replace(p, state=state, since=min(since, now), reported_at=now)
        self._put_presence(person_id, fresh)

    def report_ha_persons(self, persons: list[dict]) -> None:
        """The `person` entities Home Assistant has, for the setup wizard to offer.

        Each is `{"entity_id": "person.sam", "name": "Sam"}`. Only kept to show; linking
        a person is the household's `ha_person`, and presence still comes per person.
        """
        self.ha_persons = sorted(persons, key=lambda p: (p["name"].casefold(), p["entity_id"]))
        self.ha_persons_at = self._wall()

    def ha_persons_view(self) -> dict | None:
        """The last report of Home Assistant's `person` entities, or None without one."""
        if self.ha_persons is None or self.ha_persons_at is None:
            return None
        return {
            "persons": [dict(p) for p in self.ha_persons],
            "reported_at": local_iso(self.ha_persons_at, self.timezone),
        }

    def set_household(self, household: Household | None) -> None:
        """Use a new household from now on, as saved from the web UI's setup.

        Compiles it for the people away now and hands the weeks to the driver, exactly
        as a change of who is away does. Away and presence of people no longer in the
        household are forgotten; everyone else keeps theirs.
        """
        self.household = household
        self._compiled.clear()
        self._baseline = None
        keep = set(self.people)
        self.presence = {pid: p for pid, p in self.presence.items() if pid in keep}
        self._stale = frozenset(pid for pid in self._stale if pid in keep)
        self._save_away()
        if household is None:
            self.away, self.everyone_away, self.returning = frozenset(), False, None
        message = (
            f"Household setup changed: schedules rebuilt for {len(household.rooms)} rooms"
            if household
            else "Household setup removed: rooms follow their schedules from the house file"
        )
        reason = Reason("household.setup", message)
        self._log(self.driver.clock(), reason)
        self._away_log.append(reason)
        self._rebuild = True
        self._update_away()

    def _update_away(self) -> None:
        """Tidy away state, then recompile the household if who is away changed."""
        if self.household is None:
            return
        now = self._wall()
        tidied = {pid: tidy(p, now) for pid, p in self.presence.items()}
        if tidied != self.presence:
            self.presence = {pid: p for pid, p in tidied.items() if not p.empty}
            self._save_away()
        delay_s, lead_s, stale_s = self._delay_s(), self._lead_s(), self._stale_s()
        away = effective_away(self.people, self.presence, now, delay_s, lead_s, stale_s)
        reasons: list[Reason] = []
        gone_stale = frozenset(
            pid for pid, p in self.presence.items() if p.state and stale(p, now, stale_s)
        )
        if gone_stale - self._stale:
            minutes = self.household.away.presence_stale_after_min
            # Counts only: names are shown in the UI, never logged or exported.
            message = (
                f"Presence for {len(gone_stale - self._stale)} of {len(self.people)} people "
                f"not reported for {minutes} min: treated as unknown, not away"
            )
            reasons.append(Reason("away.presence_stale", message))
        self._stale = gone_stale
        if away != self.away or self._rebuild:
            changed = away != self.away
            self.away = away
            self._rebuild = False
            compiled = self._compile(away)
            setter = getattr(self.driver, "set_household_schedules", None)
            if callable(setter):
                setter(compiled.schedules, live=compiled.live)
            if changed:
                # Counts only: names are shown in the UI, never logged or exported.
                reasons.append(
                    Reason(
                        "away.schedules",
                        f"Schedules rebuilt: {len(away)} of {len(self.people)} people away",
                    )
                )
        everyone = everyone_away(self.people, away)
        if everyone != self.everyone_away:
            self.everyone_away = everyone
            if not everyone:
                message = "Someone is home or due back: rooms follow their schedules"
                reasons.append(Reason("away.ended", message))
            elif self.mode is Mode.AUTO:
                message = (
                    "Everyone is away: rooms held at frost protection until someone is "
                    "home or due back"
                )
                reasons.append(Reason("away.everyone", message))
            else:
                message = f"Everyone is away; the heating mode stays {self.mode.value}"
                reasons.append(Reason("away.everyone", message))
        ret = next_return(self.people, self.presence, now, lead_s) if away else None
        warmup_s = self.household.away.return_warmup_min * 60.0
        self.returning = ret if ret is not None and ret.at - now <= warmup_s else None
        if self.returning is not None and self._return_logged != self.returning.at:
            self._return_logged = self.returning.at
            due = local_iso(self.returning.at, self.timezone)[11:16]
            message = f"Someone is due back at {due}: rooms may start warming up for it"
            if self._frost_hold():
                message = f"Everyone is away and someone is due back at {due}: rooms held at "
                message += "frost protection until then, warming up in time for it"
            reasons.append(Reason("away.return", message))
        clock = self.driver.clock()
        for r in reasons:
            self._log(clock, r)
        self._away_log.extend(reasons)

    def _save_away(self) -> None:
        if self.store is None:
            return
        people = {
            pid: {
                "away_until": p.away_until,
                "set_at": p.set_at,
                "state": p.state,
                "since": p.since,
                "reported_at": p.reported_at,
            }
            for pid, p in self.presence.items()
        }
        self.store.put("away", {"people": people})

    def _restore_away(self, data: object) -> None:
        people = data.get("people") if isinstance(data, dict) else None
        if not isinstance(people, dict):
            return

        def num(value: object) -> float | None:
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                return None
            return float(value)

        for pid, item in people.items():
            if pid not in self.people or not isinstance(item, dict):
                continue
            until, set_at = num(item.get("away_until")), num(item.get("set_at"))
            state, since = item.get("state"), num(item.get("since"))
            manual = until is not None and set_at is not None
            seen = state in PRESENCE_STATES and since is not None
            p = Presence(
                away_until=until if manual else None,
                set_at=set_at if manual else None,
                state=state if seen else None,
                since=since if seen else None,
                reported_at=num(item.get("reported_at")) if seen else None,
            )
            if not p.empty:
                self.presence[pid] = p

    def person_view(self, person_id: str, now: float | None = None) -> dict:
        now = self._wall() if now is None else now
        p = self.presence.get(person_id, Presence())
        st = status(p, now, self._delay_s(), self._lead_s(), self._stale_s())
        person = next((x for x in self.household.people if x.id == person_id), None)
        name = person.name if person and person.name else person_id.replace("_", " ").capitalize()
        return {
            "id": person_id,
            "name": name,
            "away": st.away,  # counts as away now
            "reason": st.reason,  # "away_until" or "presence" when away
            "until": None if p.away_until is None else local_iso(p.away_until, self.timezone),
            "presence": None
            if p.state is None or p.since is None
            else {
                "state": p.state,
                "since": local_iso(p.since, self.timezone),
                # Not reported for the stale limit: treated as unknown, not away.
                "stale": stale(p, now, self._stale_s()),
            },
        }

    def away_view(self) -> dict:
        """People and their away state. Names are for the UI: never logged or exported."""
        if self.household is None:
            # Nobody to show, so no time zone lookups (the browser demo has no household).
            return {
                "everyone": False,
                "frost": False,
                "presence_delay_min": None,
                "return": None,
                "today": None,
                "people": [],
            }
        now = self._wall()
        ret = self.returning
        return {
            "everyone": self.everyone_away,
            # Everyone away is holding the house at frost protection right now.
            "frost": self.effective_mode() is not self.mode,
            "presence_delay_min": self.household.away.presence_delay_min,
            # The next known return, while rooms may warm up for it.
            "return": None if ret is None else {"at": local_iso(ret.at, self.timezone)},
            "today": local_iso(now, self.timezone)[:10],
            "people": [self.person_view(pid, now) for pid in self.people],
        }

    def _apply_return(self, snap: Snapshot) -> None:
        """Make a return within the warm-up a scheduled change, for optimum start.

        At the return, each household room's setpoint becomes what its live schedule
        says with the returning people at home. The core sees that as the room's next
        setpoint and starts heating as early as its learned heating rate and arrival lag
        need, up to the return warm-up. While everyone away holds frost, every room is
        held at the frost threshold until then, so nothing heats early unless optimum
        start says it must. The boiler guards and frost protection apply as always.
        """
        ret = self.returning
        if ret is None or self.household is None or snap.mode is not Mode.AUTO:
            return
        in_s = ret.at - self._wall()
        if in_s <= 0:
            return
        live = self._compile(self.away - ret.people).live
        local = datetime.fromtimestamp(ret.at, ZoneInfo(self.timezone))
        weekday, minute = local.weekday(), local.hour * 60 + local.minute
        hold = self._frost_hold()
        horizon_s = self.household.away.return_warmup_min * 60.0
        for rc in self.cfg.rooms:
            inp = snap.rooms.get(rc.id)
            if not rc.controllable or inp is None:
                continue
            week = live.get(rc.id)
            if week is not None:
                due = week.setpoint_at(weekday, minute)
            elif inp.next_setpoint_in_s is not None and inp.next_setpoint_in_s <= in_s:
                due = inp.next_setpoint  # a hand-written schedule: what it says then
            else:
                due = inp.setpoint
            if hold:
                inp.setpoint = self.cfg.boiler.frost_c
            elif week is None or rc.id in self.overrides:
                continue
            elif inp.next_setpoint_in_s is not None and inp.next_setpoint_in_s <= in_s:
                continue  # the schedule changes first: optimum start works towards that
            if due is None or due == inp.setpoint:
                continue
            inp.next_setpoint, inp.next_setpoint_in_s = due, in_s
            inp.preheat_max_s = horizon_s

    def _apply_use(self, snap: Snapshot) -> None:
        """Room use and the savings baseline for every household room, in house time.

        A hand-written room with a use level (`schedule_use`) gets room use from the
        week the driver follows for it, and a baseline from `compile_schedule_baseline`
        (the household's timer, or without one the span of the house's warm periods).
        A room with a setpoint override is IN_USE. `snap.baseline` is True when any room
        has a savings baseline (spec 5.8, 5.9).
        """
        compiled = self._compile(self.away) if self.household is not None else None
        if self.household is not None and self._baseline is None:
            self._baseline = compile_baseline(self.household)
        baseline = self._baseline if self.household is not None else None
        snap.baseline = baseline is not None and bool(baseline.rooms)
        if compiled is None and not self.schedule_use:
            return
        weekday, minute = self._weekday(), snap.minute_of_day
        weeks: dict = {}
        hand: Baseline | None = None
        if self.schedule_use:
            get = getattr(self.driver, "schedules", None)
            named_weeks = dict(get()) if callable(get) else {}
            # Hand-written weeks have a schedule name; household rooms' have None.
            weeks = {rid: w for rid, (name, w) in named_weeks.items() if name is not None}
            hand = compile_schedule_baseline(weeks, self.schedule_use, self.household)
            snap.baseline = snap.baseline or bool(hand.rooms)
        for rc in self.cfg.rooms:
            inp = snap.rooms.get(rc.id)
            if not rc.controllable or inp is None:
                continue
            use: RoomUse | None = None
            if compiled is not None and rc.id in compiled.periods:
                use = room_use(compiled, rc.id, weekday, minute)
                if baseline is not None:
                    inp.baseline_c = baseline.setpoint_at(rc.id, weekday, minute)
            elif rc.id in self.schedule_use:
                week = weeks.get(rc.id)
                if week is not None:
                    use = schedule_room_use(week, self.schedule_use[rc.id], weekday, minute)
                if hand is not None:
                    inp.baseline_c = hand.setpoint_at(rc.id, weekday, minute)
            if use is not None and rc.id in self.overrides:
                use = RoomUse.IN_USE
            inp.use = use

    def _weekday(self) -> int:
        """The house's local weekday, Monday = 0, as the driver reads its schedules."""
        get = getattr(self.driver, "wall_weekday", None)
        if callable(get):
            return int(get())
        return datetime.fromtimestamp(self._wall(), ZoneInfo(self.timezone)).weekday()

    async def step(self) -> Actions:
        now = self.driver.clock()
        self._expire_overrides(now)
        self._update_away()
        snap = await self.driver.snapshot(
            self.effective_mode(), self.overrides, now < self.store_boost_until, self.fire
        )
        self._apply_return(snap)
        self._apply_use(snap)
        # Always explicit, so the tick history records the mode each tick was decided in.
        snap.demand_mode = self.effective_demand_mode
        actions = decide(self.cfg, snap, self.state)
        recorder = self.recorder
        compact = recorder.compact(actions) if recorder is not None else None
        if compact is None and self.otlp is not None:
            compact = self._compact(actions)
        await self.driver.apply(actions)
        driver_alerts = getattr(self.driver, "alerts", None)
        extra = driver_alerts() if callable(driver_alerts) else []
        actions.alerts.extend(extra)
        wall = self.wall()
        observed = self._observed() if compact is not None else None
        if recorder is not None:
            recorder.record(wall, snap, compact, extra, self.state, snap.now, observed)
        if self.store is not None and (
            self._saved_at is None or now - self._saved_at >= self.save_every_s
        ):
            self.save()
        self.last_actions, self.last_snapshot = actions, snap
        self.relay_history.append((now, actions.heating_relay, actions.store_relay))
        estimate = None
        if actions.day_summary is not None:
            self.daily.add(actions.day_summary)
            if self.exporter is not None:
                estimate = self._day_estimate(actions.day_summary)
        logged = [(r.code, r.message, r.room_id) for r in self._away_log]
        self._away_log.clear()
        for r in actions.reasons:
            if r.code.startswith(("boiler.", "disturbance.", "safe_mode.", "learning.relearn")):
                self._log(now, r)
                logged.append((r.code, r.message, r.room_id))
        # Alerts repeat every tick while they hold; log each one when it first appears
        # or when its message changes.
        keys = set()
        for r in actions.alerts:
            key = (r.code, r.room_id, r.message)
            keys.add(key)
            if key not in self._alert_keys:
                self._log(now, r)
                logged.append((r.code, r.message, r.room_id))
        self._alert_keys = keys
        if self.otlp is not None:
            self._export_otlp(wall, snap, compact, observed, logged)
        if self.exporter is None and not self.listeners:
            return actions  # nobody to tell; the browser demo warms up much faster
        payload = self.describe()
        if self.exporter is not None:
            self.exporter.record(payload, logged)
            if actions.day_summary is not None:
                self.exporter.record_daily(actions.day_summary, estimate=estimate)
        for q in list(self.listeners):
            if q.full():
                with contextlib.suppress(asyncio.QueueEmpty):
                    q.get_nowait()
            q.put_nowait(payload)
        return actions

    def _compact(self, actions: Actions) -> dict | None:
        try:
            return compact_actions(actions)
        except Exception as err:  # the export is a convenience: never stop the tick
            self._otlp_error(err)
            return None

    def _observed(self) -> dict | None:
        """Values recorded for raw data and the OpenTelemetry export beside the snapshot
        and actions: targets, calling, the burner and the people counts."""
        try:
            targets = {
                rc.id: (rs.target, rs.calling)
                for rc in self.cfg.rooms
                if (rs := self.state.rooms.get(rc.id)) is not None
            }
            return observed_values(
                targets, self.driver.telemetry(), len(self.people), len(self.away)
            )
        except Exception as err:
            LOG.debug("observed values skipped: %s", err)
            return None

    def _export_otlp(
        self,
        wall: float,
        snap: Snapshot,
        compact: dict | None,
        observed: dict | None,
        logged: list[tuple[str, str, str | None]],
    ) -> None:
        """Queue this tick for the OpenTelemetry export. Never stops the tick."""
        try:
            values: dict[str, float] = {}
            if compact is not None:
                acts = {**compact, "observed": observed} if observed else compact
                values = tick_values(tick_data(snap, acts))
            self.otlp.record(wall, values, logged)
        except Exception as err:
            self._otlp_error(err)

    def _otlp_error(self, err: Exception) -> None:
        t = time.monotonic()
        if self._otlp_error_at is None or t - self._otlp_error_at >= EXPORT_ERROR_LOG_S:
            self._otlp_error_at = t
            LOG.warning("OpenTelemetry export: tick not queued: %s", err)

    def _day_estimate(self, summary: dict) -> dict | None:
        """The savings figures for the day that just closed, for the exporter. Never
        stops the tick: the export is a convenience."""
        try:
            return day_estimate(savings_view(self), summary)
        except Exception as err:
            LOG.warning("savings: no estimate for the closed day: %s", err)
            return None

    def _log(self, now: float, r: Reason) -> None:
        self.decisions.append(DecisionRecord(now, r.code, r.message, r.room_id))

    async def run(self, interval_s: float) -> None:
        while True:
            started = time.monotonic()
            await self.step()
            await asyncio.sleep(max(0.0, interval_s - (time.monotonic() - started)))

    async def index_raw_data(self) -> None:
        """Keep the raw data index up to date, in small chunks so the loop never waits."""
        while True:
            index = getattr(self.recorder, "index", None)
            if index is None:
                return
            try:
                n = index.catch_up(INDEX_CHUNK)
            except Exception as err:  # raw data is a convenience: never stop the server
                LOG.warning("raw data: indexing failed: %s", err)
                await asyncio.sleep(600)
                continue
            await asyncio.sleep(0.05 if n >= INDEX_CHUNK else 30.0)

    def start(self, interval_s: float) -> None:
        loop = asyncio.get_running_loop()
        self._task = loop.create_task(self.run(interval_s))
        if getattr(self.recorder, "index", None) is not None:
            self._index_task = loop.create_task(self.index_raw_data())

    async def stop(self) -> None:
        for task in (self._task, self._index_task):
            if task:
                task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await task
        self.save()

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
            # The household's people, for clients that show them or map them to
            # Home Assistant `person` entities. Empty without a household. `ha_person`
            # is the `person` entity the household links them to, or None.
            "people": [
                {
                    "id": p.id,
                    "name": p.name or p.id.replace("_", " ").capitalize(),
                    "ha_person": p.ha_person,
                }
                for p in (self.household.people if self.household else ())
            ],
            # Every household setting with its default filled in, and the allowed
            # ranges, for a setup wizard. None without a household.
            "household": household_view(self.household) if self.household else None,
        }

    def describe(self) -> dict:
        snap, acts, st = self.last_snapshot, self.last_actions, self.state
        now = self.driver.clock()
        rooms = []
        reasons_by_room: dict[str, Reason] = {}
        if acts:
            for r in acts.reasons:
                if r.room_id:
                    reasons_by_room[r.room_id] = r
        for rc in self.cfg.rooms:
            inp = snap.rooms.get(rc.id) if snap else None
            # An unheated room has no radiator and no schedule: temperature only.
            scheduled = inp if rc.role is not RoomRole.UNHEATED else None
            item = {
                "id": rc.id,
                "name": rc.name,
                "role": rc.role.value,
                "heat_source": rc.heat_source.value if rc.heat_source else None,
                "temperature": inp.temperature
                if inp and rc.role is not RoomRole.INTERNAL_SENSOR_ONLY
                else None,
                "humidity": inp.humidity if inp else None,
                "setpoint": scheduled.setpoint if scheduled else None,
                "next_setpoint": scheduled.next_setpoint if scheduled else None,
                "next_in_min": round(scheduled.next_setpoint_in_s / 60)
                if scheduled and scheduled.next_setpoint_in_s is not None
                else None,
                "override": self.override_view(rc.id, now),
                # The manual fire flag set through the API, as opposed to `fire` (detected).
                "fire_switch": rc.id in self.fire,
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
                    # Burn extension: a top-up that may keep the burner on. A top-up
                    # without it is a heat sink, opened only so the heat has somewhere to go.
                    extend=rs.extend,
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
                    reason=reason.message if (reason := reasons_by_room.get(rc.id)) else None,
                    # The code of that reason, such as `demand.pooled` (spec 5.3).
                    reason_code=reason.code if reason else None,
                    # Valve checks (spec 7). `untrusted`: stuck or leaking. `misses`:
                    # burns in a row with no warming when open. `leak_burns`: of the
                    # last 5 judged burns, those in which it warmed while shut.
                    # `rejected`: TRV settings the device would not take (reconciler).
                    valve={
                        "untrusted": rs.valve.untrusted or rs.valve.leaking,
                        "misses": rs.valve.misses,
                        "leaking": rs.valve.leaking,
                        "leak_burns": rs.valve.leak_burns,
                        "rejected": list(rs.rejected),
                    },
                )
            rooms.append(item)

        guard = st.boiler
        sc = st.short_cycle
        burns, stores = _intervals(self.relay_history, now)
        return {
            "now": now,
            "minute_of_day": self.driver.wall_minutes(),
            "mode": self.mode.value,  # the user's choice; `away.frost` says if it is held
            "away": self.away_view(),
            "outdoor": snap.outdoor if snap else None,
            "boiler": {
                "state": guard.state.value,
                "relay": acts.heating_relay if acts else False,
                "burn_elapsed_s": guard.burn_elapsed(now)
                if guard.state is BoilerState.FIRING
                else 0,
                "state_elapsed_s": now - guard.since,
                "starts_last_hour": guard.starts_last_hour(now),
                # Hand-back (spec 5.7): this burn was started outside Radiate (the Shelly
                # watchdog, a manual switch) and adopted, so it gets a full minimum burn.
                "adopted": guard.state is BoilerState.FIRING and guard.external,
                # Safe mode: the relay is left to the Shelly watchdog.
                "watchdog_handover": acts.watchdog_handover if acts else False,
                "predicted_burn_min": round(st.allocation.t_star_h * 60) if st.allocation else 0,
                # Minutes of full radiator output the calling rooms need (spec 5.3).
                "pooled_demand_min": round(st.pooled_demand_s / 60, 1),
                "supply": round(st.supply, 3),
                # Effective minimum off, raised while short-cycling was seen (spec 7).
                "min_off_s": sc.min_off_s(self.cfg.boiler.min_off_s),
                "short_cycle": {
                    "extra_off_min": round(sc.extra_off_s / 60),
                    "ends_in_h": round(max(0.0, sc.until - now) / 3600, 1),
                }
                if sc.extra_off_s > 0 and sc.until is not None
                else None,
            },
            "store": {
                "relay": acts.store_relay if acts else False,
                "boost": now < self.store_boost_until,
            },
            "rooms": rooms,
            # Burner hours, starts, burns, litres and the balance score per local day.
            "accounting": {
                "today": st.ledger.summary(self.cfg.boiler.nozzle_lph),
                "yesterday": st.ledger.history[-1] if st.ledger.history else None,
            },
            "timeline": {"burns": burns, "store": stores, "window_s": 86400},
            "alerts": [a.message for a in acts.alerts] if acts else [],
            # The same alerts with their codes, for clients that act on them.
            "alert_details": [
                {"code": a.code, "message": a.message, "room_id": a.room_id} for a in acts.alerts
            ]
            if acts
            else [],
            "telemetry": self.driver.telemetry(),
            "settings": self.settings(),
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
