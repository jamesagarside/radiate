"""`GET /api/v1/savings` (spec 5.9, 8.1): the daily history it is worked out from, the
gate, and the same body through the browser demo's bridge."""

import json
from datetime import date

import pytest
from aiohttp.test_utils import TestClient, TestServer

from radiate.server.app import create_app
from radiate.server.bridge import DemoSession, run_sync
from radiate.server.demo import DEMO_FIRST_DAY, DEMO_HOUSEHOLD, DemoDriver, demo_runtime
from radiate.server.runtime import Runtime
from radiate.server.savings import HISTORY_KEY, KEEP_DAYS, DailyHistory, savings_view
from radiate.server.store import Store
from radiate.sim.reference import house_config

H = {"Authorization": "Bearer secret"}
FIRST = date(2026, 11, 1).toordinal()
K, C = 0.01, 0.5  # the signature the injected days follow: litres = K * DH + C


def household_runtime() -> Runtime:
    rt = demo_runtime()
    rt.setup.save(rt, {"household": DEMO_HOUSEHOLD})
    return rt


def summary(day: int, dh: float, saved_kh: float = 20.0, **extra) -> dict:
    """A closed day summary in the shape `core.accounting` and `core.savings` give it,
    with every controllable room on the same degree-hours, so any weights give `dh`."""
    rooms = {
        rid: {
            "dh_actual_kh": dh,
            "dh_baseline_kh": dh + saved_kh,
            "deficit_kh": 0.1,
            "warm_min": 600.0,
            "warm_ok_min": 588.0,
            "read_min": 1440.0,
        }
        for rid in ("bathroom", "bedroom_1", "bedroom_2", "bedroom_3", "dining", "kitchen")
        + ("lounge", "toilet")
    }
    return {
        "day": day,
        "partial": False,
        "basis": "relay",
        "litres": round(K * dh + C, 4),
        "savings": {
            "rooms": rooms,
            "outdoor_share": 1.0,
            "baseline_share": 1.0,
            "outdoor_mean_c": 5.0,
        },
        **extra,
    }


def test_no_household_is_unavailable():
    rt = Runtime(house_config(), DemoDriver())
    body = savings_view(rt)
    assert body["status"] == "unavailable" and body["why"] == "no household"
    assert body["totals"] is None and body["days"] == []


def test_three_closed_days_are_learning():
    rt = household_runtime()
    for i in range(3):
        rt.daily.add(summary(FIRST + i, 200.0 + 10 * i))
    body = savings_view(rt)
    assert body["status"] == "learning" and body["why"] == "3 of 14 days"
    assert body["progress"] == {"eligible_days": 3, "needed_days": 14}
    assert [d["eligible"] for d in body["days"]] == [True] * 3
    assert [d["litres"] for d in body["days"]] == [2.5, 2.6, 2.7]
    assert all(d["litres_saved"] is None for d in body["days"])
    assert body["litres_upper_bound"] is True


def test_twenty_eligible_days_from_a_known_signature():
    rt = household_runtime()
    for i in range(20):
        # Day 7 used more than the baseline would have: a negative saving.
        rt.daily.add(summary(FIRST + i, 200.0 + 10 * i, saved_kh=-10.0 if i == 7 else 20.0))
    body = savings_view(rt)
    assert body["status"] == "ready" and body["why"] is None
    assert body["fit"]["litres_per_100_kh"] == pytest.approx(K * 100)
    assert body["fit"]["standing_litres_per_day"] == pytest.approx(C)
    # 19 days of 20 K·h saved and one of 10 K·h more, at K litres per K·h.
    assert body["totals"]["litres_saved"] == pytest.approx(K * (19 * 20 - 10))
    assert body["totals"]["since"] == "2026-11-01" and body["totals"]["days"] == 20
    assert body["totals"]["warm_share"] == pytest.approx(0.98)
    negative = body["days"][7]
    assert negative["litres_saved"] == pytest.approx(-0.1)
    assert negative["litres_baseline"] < negative["litres"]
    saved = [r["litres_saved"] for r in body["rooms"]]
    assert saved == sorted(saved, reverse=True)
    assert sum(saved) == pytest.approx(body["totals"]["litres_saved"], abs=0.05)


def test_a_day_that_does_not_count_says_why():
    rt = household_runtime()
    rt.daily.add(summary(FIRST, 200.0, partial=True))
    gap = summary(FIRST + 1, 210.0)
    gap["savings"]["outdoor_share"] = 0.8
    rt.daily.add(gap)
    days = savings_view(rt)["days"]
    assert [d["why"] for d in days] == ["partial day", "outdoor sensor missing for 5 h"]


def test_history_replaces_a_repeated_day_and_keeps_two_years():
    h = DailyHistory(None)
    h.add(summary(FIRST, 200.0))
    h.add(summary(FIRST, 300.0))
    assert len(h) == 1 and h.days()[0]["litres"] == pytest.approx(3.5)
    for i in range(KEEP_DAYS + 5):
        h.add(summary(FIRST + 1 + i, 200.0))
    days = h.days()
    assert len(days) == KEEP_DAYS == 730
    assert days[0]["day"] == FIRST + 6 and days[-1]["day"] == FIRST + KEEP_DAYS + 5
    h.add({"no": "day"})  # ignored, not an error
    assert len(h) == KEEP_DAYS


def test_history_survives_a_restart(tmp_path):
    store = Store(tmp_path / "radiate.db")
    rt = Runtime(house_config(), DemoDriver(), store=store)
    rt.restore()
    for i in range(3):
        rt.daily.add(summary(FIRST + i, 200.0))
    again = Runtime(house_config(), DemoDriver(), store=Store(tmp_path / "radiate.db"))
    again.restore()
    assert [d["day"] for d in again.daily.days()] == [FIRST, FIRST + 1, FIRST + 2]
    saved, _ = Store(tmp_path / "radiate.db").get(HISTORY_KEY)
    assert saved["version"] == 1 and len(saved["days"]) == 3


def test_a_history_in_an_unknown_shape_starts_again(tmp_path, caplog):
    store = Store(tmp_path / "radiate.db")
    store.put(HISTORY_KEY, {"version": 99, "days": [summary(FIRST, 200.0)]})
    assert DailyHistory(store).days() == []
    assert "unknown shape" in caplog.text


async def test_closed_days_are_kept_as_the_runtime_runs():
    rt = household_runtime()
    for _ in range(int(2.2 * 1440)):
        await rt.step()
    days = rt.daily.days()
    # The demo starts at 05:30 on its first day, so that day is partial.
    assert [d["day"] for d in days] == [DEMO_FIRST_DAY, DEMO_FIRST_DAY + 1]
    assert days[0]["partial"] and not days[1]["partial"]
    body = savings_view(rt)
    assert body["status"] == "learning" and body["why"] == "1 of 14 days"
    assert body["days"][0] == {**body["days"][0], "date": "2026-11-02", "why": "partial day"}
    assert body["days"][1]["eligible"] and body["days"][1]["litres"] > 0


def test_the_demo_option_starts_with_enough_days_for_figures():
    rt = demo_runtime(days=20)
    body = savings_view(rt)
    assert body["status"] == "ready", body["why"]
    assert body["totals"]["days"] >= 14
    assert body["fit"]["cv_rmse"] <= 0.25
    assert body["totals"]["warm_share"] is not None


@pytest.fixture
async def client():
    rt = household_runtime()
    for i in range(3):
        rt.daily.add(summary(FIRST + i, 200.0))
    run_sync(rt.step())
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt = rt
        yield c


async def test_savings_need_a_token(client):
    assert (await client.get("/api/v1/savings")).status == 401


async def test_the_api_answers_with_the_report(client):
    body = await (await client.get("/api/v1/savings", headers=H)).json()
    assert body == savings_view(client.rt)
    assert set(body) == {
        "status",
        "why",
        "progress",
        "baseline",
        "basis",
        "basis_text",
        "litres_upper_bound",
        "fit",
        "totals",
        "days",
        "rooms",
    }


def test_the_browser_demo_answers_through_the_bridge():
    s = DemoSession()
    s.step(2)
    reply = json.loads(s.request("GET", "savings"))
    assert reply["status"] == 200
    assert reply["body"]["status"] == "unavailable"
    assert reply["body"]["why"] == "no household"
    s.request("PUT", "household", json.dumps({"household": DEMO_HOUSEHOLD}))
    reply = json.loads(s.request("GET", "savings"))
    assert reply["body"]["status"] == "learning" and reply["body"]["why"] == "0 of 14 days"
