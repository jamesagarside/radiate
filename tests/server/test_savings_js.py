"""The Savings view's words and chart (web/savings.js) under Node, fed bodies the
server itself gives for a house still learning, one with figures, one that used more
than the baseline, and one without a household. Skipped where Node is not installed."""

import copy
import json
import shutil
import subprocess
from pathlib import Path

import pytest

from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.savings import savings_view
from radiate.sim.reference import house_config
from tests.server.test_savings_api import FIRST, household_runtime, summary

ROOT = Path(__file__).resolve().parents[2]
SAVINGS_JS = ROOT / "web" / "savings.js"
NODE = shutil.which("node")

pytestmark = pytest.mark.skipif(NODE is None, reason="Node is not installed")

SCRIPT = """
const m = await import(process.argv[1]);
let input = "";
for await (const chunk of process.stdin) input += chunk;
const views = JSON.parse(input);
console.log(JSON.stringify(views.map((v) => {
  const days = m.slots(v, "days");
  const weeks = m.slots(v, "weeks");
  const svg = days.length ? m.chartSvg(days, { width: 600, height: 220, ready: v.status === "ready" }) : "";
  return {
    headline: m.headlineText(v),
    basis: m.basisLine(v),
    missing: v.status === "unavailable" ? m.unavailableText(v) : "",
    detail: v.status === "learning" ? m.learningDetail(v) : "",
    house: m.houseLine(v),
    stats: m.stats(v),
    days: days.map(m.slotText),
    weeks: weeks.map(m.slotText),
    trend: m.trendText(v, days, "days"),
    rows: m.tableRows(v),
    svg,
    slots: (svg.match(/class="sv-slot"/g) || []).length,
    focusable: (svg.match(/tabindex="0"/g) || []).length,
    empty: (svg.match(/class="sv-empty"/g) || []).length,
    outlines: (svg.match(/class="sv-base"/g) || []).length,
    running: m.cumulativeText(v, m.cumulative(v)),
  };
})));
"""


def run(views: list[dict], tmp_path: Path) -> list[dict]:
    module = tmp_path / "savings.mjs"
    shutil.copyfile(SAVINGS_JS, module)
    out = subprocess.run(
        [NODE, "--input-type=module", "-e", SCRIPT, module.as_uri()],
        input=json.dumps(views),
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


def learning_body() -> dict:
    rt = household_runtime()
    rt.daily.add(summary(FIRST, 200.0, partial=True))
    for i in range(1, 8):
        rt.daily.add(summary(FIRST + i, 200.0 + 10 * i))
    return savings_view(rt)


def ready_body(saved_kh: float = 20.0) -> dict:
    rt = household_runtime()
    for i in range(20):
        if i == 4:
            gap = summary(FIRST + i, 240.0)
            gap["savings"]["outdoor_share"] = 0.8
            rt.daily.add(gap)
            continue
        rt.daily.add(summary(FIRST + i, 200.0 + 10 * i, saved_kh=-10.0 if i == 7 else saved_kh))
    return savings_view(rt)


@pytest.fixture(scope="module")
def bodies():
    return {
        "learning": learning_body(),
        "ready": ready_body(),
        "negative": ready_body(saved_kh=-5.0),
        "unavailable": savings_view(Runtime(house_config(), DemoDriver())),
    }


def test_the_headline_for_a_house_with_figures(bodies, tmp_path):
    (out,) = run([bodies["ready"]], tmp_path)
    total = bodies["ready"]["totals"]["litres_saved"]
    assert total == pytest.approx(0.01 * (18 * 20 - 10))
    assert out["headline"] == (
        "About 3.5 litres of oil saved since 1 November, with rooms in use warm 98% of the time."
    )
    assert out["house"] == out["headline"]
    assert out["basis"] == (
        "Litres are an upper bound until the burner itself is measured. "
        "Outdoor temperature from the simulation."
    )
    assert [s[0] for s in out["stats"]] == [
        "Oil saved",
        "Oil used",
        "Rooms in use warm",
        "Days counted",
    ]
    assert out["running"] == "Running total: about 3.5 L saved since 1 Nov."


def test_a_negative_total_says_more_than_the_baseline(bodies, tmp_path):
    (out,) = run([bodies["negative"]], tmp_path)
    assert out["headline"].startswith("About 1.0 litre more than the baseline since 1 November,")
    assert out["stats"][0][0] == "Oil over the baseline"
    assert "more than the baseline" in out["stats"][0][2]


def test_still_learning_shows_progress_and_the_oil_so_far(bodies, tmp_path):
    (out,) = run([bodies["learning"]], tmp_path)
    assert out["headline"] == "Still learning how much oil this house uses: 7 of 14 days."
    assert out["detail"].startswith("Figures start once 14 full days have counted")
    assert out["house"] == ""
    assert out["stats"][0] == ["Days counted", "7 of 14", ""]
    assert out["days"][0] == "Sun 1 Nov: not counted, partial day."
    assert out["days"][1].startswith("Mon 2 Nov: 2.6 L used.")
    assert "Rooms in use warm 98% of the time" in out["days"][1]
    # No baseline outlines until there are figures; the partial day is an empty slot.
    assert out["outlines"] == 0 and out["empty"] == 1
    assert out["trend"].startswith("Bar chart of oil used each day, 8 days from 1 Nov to 8 Nov.")


def test_a_day_not_counted_is_an_empty_slot_with_its_reason(bodies, tmp_path):
    (out,) = run([bodies["ready"]], tmp_path)
    assert out["days"][4] == "Thu 5 Nov: not counted, outdoor sensor missing for 5 h."
    assert out["slots"] == 20 and out["empty"] == 1 and out["outlines"] == 19
    assert out["focusable"] == 1  # one tab stop; arrow keys move between slots
    assert "about 0.2 L saved" in out["days"][3]
    assert "about 0.1 L more than the baseline" in out["days"][7]
    assert out["trend"].endswith("Less than the baseline on 18, more on 1. 1 not counted.")
    assert out["weeks"][0].startswith("Week of 26 Oct: 1 of 1 day counted")
    assert out["weeks"][1].startswith("Week of 2 Nov: 6 of 7 days counted")


def test_the_table_has_the_same_numbers_as_the_days(bodies, tmp_path):
    (out,) = run([bodies["ready"]], tmp_path)
    days = bodies["ready"]["days"]
    assert len(out["rows"]) == len(days)
    first = out["rows"][0]
    assert first[0] == "Sun 1 Nov" and first[1] == "Yes"
    assert first[2] == f"{days[0]['litres']:.1f}" and first[4] == "0.2"
    assert out["rows"][4][1] == "No, outdoor sensor missing for 5 h"
    assert out["rows"][4][3] == "–"  # the one placeholder for a missing value
    assert out["rows"][7][4] == "−0.1"  # a real minus sign


def test_without_a_household_it_says_what_is_needed(bodies, tmp_path):
    (out,) = run([bodies["unavailable"]], tmp_path)
    assert out["headline"] == "Savings need a household"
    assert "who lives here" in out["missing"]
    assert out["house"] == "" and out["svg"] == ""
    other = copy.deepcopy(bodies["unavailable"])
    other["why"] = "no nozzle rating"
    (out,) = run([other], tmp_path)
    assert "boiler.nozzle_lph" in out["missing"]


def test_no_dashes_in_the_words(bodies, tmp_path):
    out = run(list(bodies.values()), tmp_path)
    words = [o[k] for o in out for k in ("headline", "basis", "missing", "detail", "trend")]
    words += [s for o in out for s in o["days"] + o["weeks"]]
    text = json.dumps(words, ensure_ascii=False)
    assert "—" not in text and "–" not in text and " - " not in text
