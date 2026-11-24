"""Outdoor temperature: which reading the core gets (spec 3 and 7).

Two sources can give one: the Zigbee outdoor sensor the live driver reads
(`house.outdoor_sensor`), and a reading Home Assistant posts to `POST /api/v1/outdoor`
from a weather or temperature entity. `house.outdoor_source` chooses between them:

- `zigbee` (the default): the Zigbee sensor only, exactly as before.
- `home_assistant`: the Home Assistant reading only.
- `both`: the Zigbee sensor while it has a fresh reading, otherwise Home Assistant.

A reading outside `OUTDOOR_MIN_C` to `OUTDOOR_MAX_C`, or older than the stale limit
(`house.outdoor_stale_after_min`), counts as missing. Missing is the fail-safe: the core
then assumes `DEFAULT_OUTDOOR_C`, as it always has without a reading, and an alert
(`outdoor.stale`) says so whenever the chosen source relies on Home Assistant.

Pure: no I/O and no clock. Times are wall-clock seconds, passed in.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from enum import StrEnum

from .types import Reason

OUTDOOR_MIN_C = -40.0
OUTDOOR_MAX_C = 50.0
DEFAULT_OUTDOOR_C = 5.0  # what the core assumes without a reading
DEFAULT_STALE_AFTER_S = 3 * 3600.0
STALE_ALERT = "outdoor.stale"


class OutdoorSource(StrEnum):
    """Where the outdoor temperature comes from: `house.outdoor_source`."""

    ZIGBEE = "zigbee"
    HOME_ASSISTANT = "home_assistant"
    BOTH = "both"  # Zigbee while it has a fresh reading, otherwise Home Assistant


@dataclass(frozen=True, slots=True)
class OutdoorReading:
    """An outdoor temperature posted by Home Assistant.

    `measured_at` is when it was measured, wall-clock seconds, never later than when
    it arrived. `source` names where it came from, such as `weather.forecast_home`.
    """

    temperature_c: float
    measured_at: float
    source: str | None = None


@dataclass(frozen=True, slots=True)
class OutdoorChoice:
    """The outdoor temperature the core gets this tick, and where it came from.

    `temperature_c` None: no usable reading, so the core assumes `DEFAULT_OUTDOOR_C`.
    `source` is the local label (`zigbee`, or the driver's own for a simulation) or
    `home_assistant`, or None. `stale` is true when the chosen source relies on Home
    Assistant and has no usable reading; `alert` then says so.
    """

    temperature_c: float | None
    source: str | None
    age_s: float | None
    stale: bool = False
    alert: Reason | None = None


def plausible(temperature_c: object) -> bool:
    """A finite number of degrees Celsius that can be outdoors in a heated house's climate."""
    if isinstance(temperature_c, bool) or not isinstance(temperature_c, (int, float)):
        return False
    return math.isfinite(temperature_c) and OUTDOOR_MIN_C <= temperature_c <= OUTDOOR_MAX_C


def reading_age(reading: OutdoorReading, now: float) -> float:
    """Seconds since the reading was measured, never negative."""
    return max(0.0, now - reading.measured_at)


def _hours(seconds: float) -> str:
    hours = seconds / 3600
    if hours < 1:
        return f"{max(1, round(seconds / 60))} min"
    return f"{round(hours, 1):g} h"


def _missing(setting: OutdoorSource, ha: OutdoorReading | None, now: float) -> Reason:
    assumed = f"{DEFAULT_OUTDOOR_C:g} °C assumed"
    if setting is OutdoorSource.BOTH:
        message = (
            f"No fresh outdoor temperature from the Zigbee sensor or Home Assistant: {assumed}"
        )
    elif ha is None:
        message = f"No outdoor temperature from Home Assistant yet: {assumed}"
    elif not plausible(ha.temperature_c):
        message = f"Outdoor temperature from Home Assistant is implausible: {assumed}"
    else:
        age = _hours(reading_age(ha, now))
        message = f"Outdoor temperature from Home Assistant not updated for {age}: {assumed}"
    return Reason(STALE_ALERT, message)


def choose_outdoor(
    setting: OutdoorSource,
    local_c: float | None,
    local_age_s: float | None,
    ha: OutdoorReading | None,
    now: float,
    stale_after_s: float = DEFAULT_STALE_AFTER_S,
    local_label: str = "zigbee",
) -> OutdoorChoice:
    """The outdoor temperature for the core, from the driver's reading and Home Assistant's.

    `local_c` is the driver's reading (the Zigbee sensor, already checked for age by the
    driver), or None; `local_age_s` its age if known. With `zigbee` it passes through
    unchanged, so a house that never chose a source behaves exactly as before.
    """
    local_age = None if local_c is None else local_age_s
    if setting is OutdoorSource.ZIGBEE:
        source = local_label if local_c is not None else None
        return OutdoorChoice(local_c, source, local_age)
    if setting is OutdoorSource.BOTH and local_c is not None and plausible(local_c):
        return OutdoorChoice(float(local_c), local_label, local_age)
    if ha is not None and plausible(ha.temperature_c):
        age = reading_age(ha, now)
        if age <= stale_after_s:
            return OutdoorChoice(float(ha.temperature_c), "home_assistant", age)
    return OutdoorChoice(None, None, None, stale=True, alert=_missing(setting, ha, now))
