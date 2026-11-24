"""Savings for the web UI and the API (`GET /api/v1/savings`, spec 5.9 and 8.1).

The figures, the gate and every word of the body come from the pure core
(`radiate.core.savings.report`). This module keeps the closed day summaries they are
worked out from, in the state database under `daily_history`, and gathers what
`report` needs from the runtime: the room weights from the learned models, the room
names, whether there is a household and an outdoor temperature source, and which one.
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from datetime import date
from typing import TYPE_CHECKING, Any

from radiate.config.site import SiteConfig
from radiate.core.outdoor import OutdoorSource
from radiate.core.savings import SavingsParams, report, room_weights

if TYPE_CHECKING:
    from .runtime import Runtime

LOG = logging.getLogger(__name__)

HISTORY_KEY = "daily_history"
HISTORY_VERSION = 1  # shape of the saved history; bump and migrate on change
KEEP_DAYS = 730  # two years, the learning memory's default


class DailyHistory:
    """Closed day summaries, oldest first, in the state database (memory only without one).

    Saved as `{"version": 1, "days": [...]}`. A saved history of another version, or
    one that isn't a history at all, is set aside with a warning and the history starts
    empty: savings then learn again, and control is never affected.
    """

    def __init__(self, store: Any | None = None) -> None:
        self.store = store
        self._days: list[dict] = []
        if store is None:
            return
        saved = store.get(HISTORY_KEY)
        if saved is None:
            return
        data = saved[0]
        if not isinstance(data, Mapping) or data.get("version") != HISTORY_VERSION:
            LOG.warning("savings: daily history in an unknown shape, starting again")
            return
        days = data.get("days")
        if isinstance(days, list):
            self._days = _clean(days)

    def add(self, summary: Mapping[str, Any]) -> None:
        """Append, replacing a summary for the same `day`; keep the last KEEP_DAYS; save."""
        if not isinstance(summary, Mapping) or not _is_day(summary.get("day")):
            return
        self._days = _clean([*self._days, dict(summary)])
        if self.store is not None:
            self.store.put(HISTORY_KEY, {"version": HISTORY_VERSION, "days": self._days})

    def days(self) -> list[dict]:
        return list(self._days)

    def __len__(self) -> int:
        return len(self._days)


def _is_day(day: object) -> bool:
    return isinstance(day, int) and not isinstance(day, bool)


def _clean(days: list) -> list[dict]:
    """One summary per day (the later wins), oldest first, at most KEEP_DAYS."""
    by_day: dict[int, dict] = {}
    for d in days:
        if isinstance(d, Mapping) and _is_day(d.get("day")):
            by_day[d["day"]] = dict(d)
    return [by_day[k] for k in sorted(by_day)][-KEEP_DAYS:]


def savings_view(rt: Runtime) -> dict:
    """`GET /api/v1/savings`: `report` over the kept days, weights from the room models."""
    rooms = [rc for rc in rt.cfg.rooms if rc.controllable]
    models = {}
    for rc in rooms:
        rs = rt.state.rooms.get(rc.id)
        if rs is not None:
            models[rc.id] = (rs.est.a, rs.est.b, rs.est.confidence)
    return report(
        rt.daily.days(),
        room_weights(models),
        {rc.id: rc.name for rc in rooms},
        household=has_baseline_source(rt),
        outdoor_sensor=has_outdoor_sensor(rt),
        outdoor_source=outdoor_source(rt),
        outdoor_missing=NO_SENSOR if needs_sensor(rt) else NO_READINGS,
    )


def has_baseline_source(rt: Runtime) -> bool:
    """Whether there is anything to build a savings baseline from: a household, or
    hand-written rooms with a use level (spec 5.9). Without either: "no household"."""
    return rt.household is not None or bool(rt.schedule_use)


NO_SENSOR = "no outdoor sensor"
NO_READINGS = "no outdoor readings yet"


def _zigbee_sensor(rt: Runtime) -> bool:
    """The house file names a Zigbee outdoor sensor (always true off the live driver:
    the simulator and the demo have an outdoor temperature)."""
    site = getattr(rt.driver, "site", None)
    return bool(site.outdoor_sensor) if isinstance(site, SiteConfig) else True


def needs_sensor(rt: Runtime) -> bool:
    """Whether the outdoor temperature can only come from a Zigbee sensor."""
    return rt.outdoor_source is OutdoorSource.ZIGBEE


def has_outdoor_sensor(rt: Runtime) -> bool:
    """Whether the house has an outdoor temperature to judge days by. A Zigbee sensor
    counts once the house file names one. Home Assistant counts only once it has given
    fresh readings: today, or on a kept day for most of it (the savings meter's outdoor
    share), so a source set up but silent or stale is not taken for one. Each day is
    still judged on its own share."""
    if rt.driver.name != "live" or (
        rt.outdoor_source is not OutdoorSource.HOME_ASSISTANT and _zigbee_sensor(rt)
    ):
        return True
    if needs_sensor(rt):
        return False
    if rt.state.savings.outdoor_s > 0:
        return True
    least = SavingsParams().min_share
    for day in rt.daily.days():
        rec = day.get("savings")
        share = rec.get("outdoor_share") if isinstance(rec, Mapping) else None
        if isinstance(share, (int, float)) and share >= least:
            return True
    return False


def outdoor_source(rt: Runtime) -> str | None:
    """The outdoor source the report names: `zigbee`, `home_assistant`, `both`, or
    `simulated` for the demo and the simulator. None without one."""
    if not has_outdoor_sensor(rt):
        return None
    if rt.driver.name != "live":
        return "simulated"
    return rt.outdoor_source.value


def day_estimate(view: Mapping[str, Any], summary: Mapping[str, Any]) -> dict | None:
    """The savings figures for a day that just closed, as `report` gives them, for the
    Elastic daily document: that day's entry and the fit's CV(RMSE). None when the day
    isn't the latest in the report."""
    days = view.get("days") or []
    if not days:
        return None
    entry = days[-1]
    try:
        closed = date.fromordinal(int(summary.get("day"))).isoformat()
    except (TypeError, ValueError, OverflowError):
        return None
    if entry.get("date") != closed:
        return None
    fit = view.get("fit") or {}
    return {**entry, "fit_cv_rmse": fit.get("cv_rmse"), "status": view.get("status")}
