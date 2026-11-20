"""Room adjustments through the API: saved with the household, shown in the week view.

An adjustment is part of the household section, so it goes through the same PUT and
preview as the setup wizard. `GET schedules` says, per day, which warm periods the
week view can drag and what the room's adjustments changed.
"""

import json

from test_household_setup import FRI_1800, by_id, make

from radiate.config.saved import read_saved
from radiate.server.bridge import DemoSession, handle, run_sync
from radiate.server.schedules import schedules_view

LATE = {"days": "weekdays", "keep": "warm", "from": "22:30", "to": "23:00"}


def with_adjust(rt, room: str, *adjust: dict) -> dict:
    section = handle(rt, "GET", "household")["household"]
    section["rooms"][room]["adjust"] = list(adjust)
    return {"household": section}


def test_the_week_view_lists_warm_periods_and_no_adjustments(tmp_path):
    view = schedules_view(make(tmp_path))
    assert view["weekend_days"] == ["saturday", "sunday"]
    kitchen = by_id(view)["kitchen"]
    assert kitchen["days"][0]["periods"] == [
        {"start": 390, "end": 510},
        {"start": 1080, "end": 1350},
    ]
    assert kitchen["days"][0]["adjusted"] == []
    assert kitchen["adjust"] == [] and kitchen["routine"] is None
    lounge = by_id(view)["lounge"]  # hand-written: nothing to drag
    assert lounge["days"][0]["periods"] == [] and lounge["adjust"] == []


def test_saving_an_adjustment_keeps_a_copy_and_changes_the_week(tmp_path):
    rt = make(tmp_path)
    run_sync(rt.step())
    assert handle(rt, "GET", "household")["source"] == "house_file"
    body = with_adjust(rt, "kitchen", LATE)
    preview = handle(rt, "POST", "household/preview", body)
    assert preview["errors"] == []
    saved = handle(rt, "PUT", "household", body)
    # The house file's household is copied to the data folder with the change.
    assert saved["source"] == "saved"
    assert saved["saved_at"] == str(tmp_path / "household.yaml")
    assert read_saved(tmp_path)["rooms"]["kitchen"]["adjust"] == [LATE]
    view = schedules_view(rt)
    assert view["rooms"] == preview["rooms"]
    kitchen = by_id(view)["kitchen"]
    assert kitchen["adjust"] == [{**LATE, "text": "Kept warm 22:30 to 23:00 on weekdays."}]
    assert kitchen["days"][0]["adjusted"] == [{"start": 1350, "end": 1380, "keep": "warm"}]
    assert kitchen["days"][5]["adjusted"] == []
    assert kitchen["days"][0]["periods"][-1] == {"start": 1080, "end": 1380}
    assert kitchen["summary"][0]["text"].endswith("18:00 to 23:00, otherwise 14°")
    assert kitchen["routine"] == [
        {"days": "Mon to Fri", "text": "19° 06:30 to 08:30 and 18:00 to 22:30, otherwise 14°"},
        {"days": "Sat and Sun", "text": "19° 08:30 to 10:00 and 18:00 to 22:30, otherwise 14°"},
    ]
    # The driver follows it, and the valve's own copy keeps the fixed preheat.
    drv = rt.driver
    assert drv.site.live_schedule_for("kitchen").days[0].trvzb().endswith("18:00/19 23:00/14")
    assert drv.site.schedule_for("kitchen").days[0].trvzb().endswith("17:30/19 23:00/14")
    # Reset to routine: save the room without its adjustments.
    handle(rt, "PUT", "household", with_adjust(rt, "kitchen"))
    assert by_id(schedules_view(rt))["kitchen"]["adjust"] == []
    assert "adjust" not in read_saved(tmp_path)["rooms"]["kitchen"]


def test_adjustment_errors_carry_their_path(tmp_path):
    rt = make(tmp_path)
    bad = with_adjust(rt, "kitchen", {**LATE, "to": "22:00"})
    preview = handle(rt, "POST", "household/preview", bad)
    assert preview["errors"] == [
        {
            "path": "household.rooms.kitchen.adjust[0].to",
            "message": "must be after from, on the same day",
        }
    ]
    assert preview["rooms"] == []
    assert not (tmp_path / "household.yaml").exists()


def test_away_pauses_the_rooms_adjustments(tmp_path):
    rt = make(tmp_path)
    office = {"days": "weekdays", "keep": "warm", "from": "18:00", "to": "20:00"}
    handle(rt, "PUT", "household", with_adjust(rt, "bedroom_3", office))
    assert by_id(schedules_view(rt))["bedroom_3"]["days"][0]["adjusted"] != []
    rt.set_away("home_worker", FRI_1800)
    room = by_id(schedules_view(rt))["bedroom_3"]
    assert room["days"][0]["adjusted"] == [] and room["days"][0]["periods"] == []
    assert room["adjust"][0]["text"] == "Kept warm 18:00 to 20:00 on weekdays."
    assert room["routine"] is None  # the adjustments change nothing while away
    assert room["away"]["text"] == "Bedroom 3 stays at 14° while Home worker is away."


def test_demo_keeps_adjustments_in_memory():
    demo = DemoSession()
    demo.step(1)

    def call(method, path, body=None):
        return json.loads(demo.request(method, path, json.dumps(body)))["body"]

    raw = {
        "people": {"sam": {"weekdays": {"up": "07:00", "bed": "22:00"}}},
        "rooms": {"lounge": {"use": "in_use", "adjust": [{**LATE, "from": "22:00"}]}},
    }
    saved = call("PUT", "household", {"household": raw})
    assert saved["saved_at"] is None and saved["source"] == "saved"
    assert saved["household"]["rooms"]["lounge"]["adjust"] == [{**LATE, "from": "22:00"}]
    lounge = by_id(call("GET", "schedules"))["lounge"]
    assert lounge["days"][0]["adjusted"] == [{"start": 1320, "end": 1380, "keep": "warm"}]
