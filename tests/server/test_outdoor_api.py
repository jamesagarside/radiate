"""Outdoor temperature from Home Assistant (`POST /api/v1/outdoor`, spec 3, 7 and 8.1).

The live driver reads the Zigbee outdoor sensor; Home Assistant can post a reading from
a weather or temperature entity. `house.outdoor_source` chooses which the core gets.
"""

from __future__ import annotations

import dataclasses
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
from aiohttp.test_utils import TestClient, TestServer

from radiate.config import load_site
from radiate.core.outdoor import OutdoorSource
from radiate.drivers.live import LiveDriver
from radiate.server.app import create_app
from radiate.server.bridge import DemoSession, RequestError, handle
from radiate.server.runtime import Runtime
from radiate.server.savings import savings_view
from radiate.server.store import Store

EXAMPLE = Path(__file__).resolve().parents[2] / "examples" / "reference-house.yaml"
ENV = {"RADIATE_MQTT_PASSWORD": "m", "RADIATE_SHELLY_PASSWORD": "s"}
TZ = ZoneInfo("Europe/London")
WED_0600 = datetime(2026, 11, 18, 6, 0, tzinfo=TZ).timestamp()
H = {"Authorization": "Bearer secret"}


class Wall:
    def __init__(self, t: float = WED_0600) -> None:
        self.t = t

    def __call__(self) -> float:
        return self.t


async def _publish(topic, payload):
    return True


def make(
    source: OutdoorSource = OutdoorSource.ZIGBEE,
    sensor: str | None = None,
    store: Store | None = None,
    wall: Wall | None = None,
) -> Runtime:
    site = dataclasses.replace(
        load_site(EXAMPLE, env=ENV), outdoor_sensor=sensor, outdoor_source=source
    )
    wall = wall or Wall()
    drv = LiveDriver(site, _publish, clock=lambda: 1000.0 + wall.t - WED_0600, wall=wall)
    return Runtime(
        site.house,
        drv,
        store=store,
        timezone=site.timezone,
        wall=wall,
        outdoor_source=site.outdoor_source,
        outdoor_stale_after_s=site.outdoor_stale_after_s,
    )


def zigbee(rt: Runtime, t: float) -> None:
    rt.driver.handle_message(
        f"zigbee2mqtt/{rt.driver.site.outdoor_sensor}", json.dumps({"temperature": t}).encode()
    )


def codes(rt: Runtime) -> list[str]:
    return [a["code"] for a in rt.describe()["alert_details"]]


# --- the request -----------------------------------------------------------------------


def test_a_reading_is_kept_with_its_time_and_source():
    rt = make(OutdoorSource.HOME_ASSISTANT)
    body = {
        "temperature_c": 7.5,
        "measured_at": "2026-11-18T05:40:00+00:00",
        "source": "weather.forecast_home",
    }
    reply = handle(rt, "POST", "outdoor", body)
    assert reply["ok"] is True
    ha = reply["outdoor"]["home_assistant"]
    assert ha == {
        "temperature_c": 7.5,
        "measured_at": "2026-11-18T05:40+00:00",
        "age_s": 1200,
        "source": "weather.forecast_home",
    }
    assert reply["outdoor"]["setting"] == "home_assistant"
    assert reply["outdoor"]["stale_after_min"] == 180


def test_without_measured_at_it_was_measured_now_and_the_future_counts_as_now():
    rt = make(OutdoorSource.HOME_ASSISTANT)
    handle(rt, "POST", "outdoor", {"temperature_c": 4})
    assert rt.ha_outdoor.measured_at == WED_0600 and rt.ha_outdoor.source is None
    handle(rt, "POST", "outdoor", {"temperature_c": 4, "measured_at": "2026-11-18T09:00+00:00"})
    assert rt.ha_outdoor.measured_at == WED_0600


def test_null_forgets_the_reading():
    rt = make(OutdoorSource.HOME_ASSISTANT)
    handle(rt, "POST", "outdoor", {"temperature_c": 4})
    reply = handle(rt, "POST", "outdoor", {"temperature_c": None})
    assert rt.ha_outdoor is None and reply["outdoor"]["home_assistant"] is None


@pytest.mark.parametrize(
    ("body", "message"),
    [
        ({}, "temperature_c is required"),
        ({"temperature_c": "7"}, "must be a number or null"),
        ({"temperature_c": True}, "must be a number or null"),
        ({"temperature_c": 60}, "between -40 and 50 °C"),
        ({"temperature_c": -41}, "between -40 and 50 °C"),
        ({"temperature_c": 5, "measured_at": "yesterday"}, "measured_at must be an ISO 8601"),
        ({"temperature_c": 5, "source": 3}, "source must be text"),
        ({"temperature_c": 5, "source": "x" * 101}, "source must be text"),
    ],
)
def test_bad_requests(body, message):
    rt = make(OutdoorSource.HOME_ASSISTANT)
    with pytest.raises(RequestError) as err:
        handle(rt, "POST", "outdoor", body)
    assert err.value.status == 400 and message in err.value.text
    assert rt.ha_outdoor is None


# --- what the core gets ----------------------------------------------------------------


async def test_zigbee_default_ignores_home_assistant():
    rt = make(OutdoorSource.ZIGBEE, sensor="garden")
    zigbee(rt, 3.0)
    handle(rt, "POST", "outdoor", {"temperature_c": 9.0})
    await rt.step()
    assert rt.last_snapshot.outdoor == 3.0
    view = rt.describe()["outdoor_reading"]
    assert (view["setting"], view["source"], view["stale"]) == ("zigbee", "zigbee", False)
    assert view["age_s"] == 0
    assert "outdoor.stale" not in codes(rt)


async def test_zigbee_default_without_a_sensor_is_unchanged():
    rt = make(OutdoorSource.ZIGBEE)
    await rt.step()
    assert rt.last_snapshot.outdoor is None
    assert rt.describe()["outdoor_reading"]["source"] is None
    assert "outdoor.stale" not in codes(rt)


async def test_home_assistant_reading_reaches_the_core():
    wall = Wall()
    rt = make(OutdoorSource.HOME_ASSISTANT, wall=wall)
    handle(rt, "POST", "outdoor", {"temperature_c": 6.5, "source": "weather.forecast_home"})
    wall.t += 600
    await rt.step()
    assert rt.last_snapshot.outdoor == 6.5
    state = rt.describe()
    assert state["outdoor"] == 6.5
    assert state["outdoor_reading"]["source"] == "home_assistant"
    assert state["outdoor_reading"]["age_s"] == 600
    assert "outdoor.stale" not in codes(rt)


async def test_a_stale_reading_counts_as_missing_and_alerts():
    wall = Wall()
    rt = make(OutdoorSource.HOME_ASSISTANT, wall=wall)
    handle(rt, "POST", "outdoor", {"temperature_c": 6.5})
    wall.t += 3 * 3600 + 60
    await rt.step()
    assert rt.last_snapshot.outdoor is None  # the core assumes 5 °C
    view = rt.describe()["outdoor_reading"]
    assert view["stale"] is True and view["source"] is None
    assert "outdoor.stale" in codes(rt)
    assert any(d.code == "outdoor.stale" for d in rt.decisions)
    # A fresh report clears it.
    handle(rt, "POST", "outdoor", {"temperature_c": 6.0})
    await rt.step()
    assert rt.last_snapshot.outdoor == 6.0 and "outdoor.stale" not in codes(rt)


async def test_never_reported_alerts():
    rt = make(OutdoorSource.HOME_ASSISTANT)
    await rt.step()
    assert rt.last_snapshot.outdoor is None
    assert "outdoor.stale" in codes(rt)


async def test_both_prefers_zigbee_and_falls_back_to_home_assistant():
    rt = make(OutdoorSource.BOTH, sensor="garden")
    handle(rt, "POST", "outdoor", {"temperature_c": 9.0})
    zigbee(rt, 3.0)
    await rt.step()
    assert rt.last_snapshot.outdoor == 3.0
    assert rt.describe()["outdoor_reading"]["source"] == "zigbee"

    fresh = make(OutdoorSource.BOTH, sensor="garden")  # the Zigbee sensor never reported
    handle(fresh, "POST", "outdoor", {"temperature_c": 9.0})
    await fresh.step()
    assert fresh.last_snapshot.outdoor == 9.0
    assert fresh.describe()["outdoor_reading"]["source"] == "home_assistant"
    assert "outdoor.stale" not in codes(fresh)


async def test_the_reading_survives_a_restart_with_its_age(tmp_path):
    wall = Wall()
    rt = make(OutdoorSource.HOME_ASSISTANT, store=Store(tmp_path / "radiate.db"), wall=wall)
    rt.restore()
    handle(rt, "POST", "outdoor", {"temperature_c": 6.5, "source": "sensor.garden"})
    wall.t += 900
    again = make(OutdoorSource.HOME_ASSISTANT, store=Store(tmp_path / "radiate.db"), wall=wall)
    again.restore()
    assert again.ha_outdoor == rt.ha_outdoor
    await again.step()
    assert again.last_snapshot.outdoor == 6.5
    assert again.describe()["outdoor_reading"]["age_s"] == 900


def test_savings_count_home_assistant_as_an_outdoor_source():
    assert savings_view(make(OutdoorSource.ZIGBEE))["why"] == "no household"  # first gate
    rt = make(OutdoorSource.ZIGBEE)
    rt.schedule_use = {"lounge": ("in_use", "in_use")}
    body = savings_view(rt)
    assert body["why"] == "no outdoor sensor"
    assert body["outdoor"] == {"source": None, "text": None}
    rt = make(OutdoorSource.HOME_ASSISTANT)
    rt.schedule_use = {"lounge": ("in_use", "in_use")}
    body = savings_view(rt)
    assert body["why"] != "no outdoor sensor"
    assert body["outdoor"] == {
        "source": "home_assistant",
        "text": "Outdoor temperature from Home Assistant.",
    }
    rt = make(OutdoorSource.ZIGBEE, sensor="garden")
    rt.schedule_use = {"lounge": ("in_use", "in_use")}
    assert savings_view(rt)["outdoor"]["source"] == "zigbee"


async def test_the_savings_meter_counts_home_assistant_readings():
    wall = Wall()
    rt = make(OutdoorSource.HOME_ASSISTANT, wall=wall)
    handle(rt, "POST", "outdoor", {"temperature_c": 6.5})
    await rt.step()
    wall.t += 60
    await rt.step()
    meter = rt.state.savings
    assert meter.outdoor_s == meter.seen_s > 0  # every tick had a real outdoor reading
    assert meter.outdoor_sum_cs == 6.5 * meter.outdoor_s


# --- over HTTP and in the browser demo ---------------------------------------------------


async def test_http_route_needs_a_token_and_answers():
    rt = make(OutdoorSource.HOME_ASSISTANT)
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        assert (await c.post("/api/v1/outdoor", json={"temperature_c": 5})).status == 401
        resp = await c.post("/api/v1/outdoor", json={"temperature_c": 5.5}, headers=H)
        assert resp.status == 200
        assert (await resp.json())["outdoor"]["home_assistant"]["temperature_c"] == 5.5
        resp = await c.post("/api/v1/outdoor", json={"temperature_c": 99}, headers=H)
        assert resp.status == 400
        state = await (await c.get("/api/v1/state", headers=H)).json()
        assert state["outdoor_reading"]["setting"] == "home_assistant"


def test_the_browser_demo_accepts_a_reading():
    s = DemoSession()
    s.step(1)
    reply = json.loads(s.request("POST", "outdoor", json.dumps({"temperature_c": 4.0})))
    assert reply["status"] == 200
    # The demo's source is its simulation; the reading is kept but not used.
    assert reply["body"]["outdoor"]["setting"] == "zigbee"
    assert reply["body"]["outdoor"]["source"] == "simulated"
