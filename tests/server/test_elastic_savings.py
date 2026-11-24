"""The savings and comfort fields of the Elastic daily document (spec 9)."""

from datetime import UTC, datetime

from radiate.export.elastic import ElasticExporter, daily_doc, index_templates
from radiate.server.savings import day_estimate, savings_view
from tests.server.test_elastic import SUMMARY
from tests.server.test_savings_api import FIRST, household_runtime, summary

TS = datetime(2026, 11, 22, 7, 0, tzinfo=UTC)


def test_the_daily_document_keeps_its_old_fields_and_adds_savings():
    day = summary(FIRST, 200.0)
    estimate = {
        "dh_actual_kh": 200.0,
        "dh_baseline_kh": 220.0,
        "eligible": True,
        "litres_saved": 0.2,
        "fit_cv_rmse": 0.12,
    }
    doc = daily_doc({**SUMMARY, **day}, "h", TS, estimate=estimate)
    assert doc["boiler"]["burner_hours"] == 6.5 and doc["balance"]["score"] == 75.0
    assert doc["rooms"]["comfort_minutes_below"] == 15.0
    assert doc["savings"] == {
        "dh_actual_kh": 200.0,
        "dh_baseline_kh": 220.0,
        "outdoor_share": 1.0,
        "baseline_share": 1.0,
        "eligible": True,
        "litres": 0.2,
        "fit_cv_rmse": 0.12,
    }
    # Eight rooms, each 588 of 600 minutes in use warm and 0.1 K·h short.
    assert doc["comfort"] == {"deficit_kh": 0.8, "warm_share": 0.98}


def test_litres_are_absent_while_learning():
    estimate = {"dh_actual_kh": 200.0, "dh_baseline_kh": 220.0, "eligible": True}
    doc = daily_doc({**SUMMARY, **summary(FIRST, 200.0)}, "h", TS, estimate=estimate)
    assert doc["savings"]["eligible"] is True
    assert "litres" not in doc["savings"] and "fit_cv_rmse" not in doc["savings"]


def test_a_day_without_a_savings_record_has_no_savings_fields():
    doc = daily_doc(SUMMARY, "h", TS)
    assert "savings" not in doc and "comfort" not in doc


def test_the_estimate_is_the_closed_days_entry_in_the_report():
    rt = household_runtime()
    for i in range(20):
        rt.daily.add(summary(FIRST + i, 200.0 + 10 * i))
    last = summary(FIRST + 19, 390.0)
    est = day_estimate(savings_view(rt), last)
    assert est["date"] == "2026-11-20" and est["eligible"] is True
    assert est["litres_saved"] == 0.2 and est["fit_cv_rmse"] == 0.0
    assert day_estimate(savings_view(rt), summary(FIRST, 200.0)) is None  # not the latest


async def test_the_runtime_exports_the_estimate_with_the_closed_day():
    rt = household_runtime()
    rt.exporter = ElasticExporter("http://es:9200", "key", house_id="h")
    for _ in range(int(1.1 * 1440)):
        await rt.step()
    daily = [d for d in rt.exporter.buffer if d["data_stream"]["dataset"] == "radiate.daily"]
    assert len(daily) == 1
    doc = daily[0]
    assert doc["radiate"]["day"] == "2026-11-02"
    assert doc["savings"]["eligible"] is False  # the demo starts at 05:30: a partial day
    assert "litres" not in doc["savings"]
    assert doc["savings"]["dh_actual_kh"] > 0 and 0 <= doc["comfort"]["warm_share"] <= 1


def test_the_template_maps_the_new_fields():
    props = index_templates()["radiate-daily"]["template"]["mappings"]["properties"]
    savings = props["savings"]["properties"]
    assert savings["eligible"] == {"type": "boolean"}
    assert savings["litres"] == {"type": "float"}
    assert props["comfort"]["properties"]["warm_share"] == {"type": "float"}
