"""House suggestions on the simulated reference house: nothing about the rooms while
the house is healthy, and the right rooms once one is draughty, one radiator is small
and one valve passes water when shut. The same core, learning and checks as live."""

import asyncio

from radiate.server.demo import demo_runtime
from radiate.server.suggestions import suggestions_view


def run(days: float, faults: bool) -> dict:
    rt = demo_runtime()
    if faults:
        rooms = rt.driver.house.rooms
        rooms["bedroom_2"].ua_w_per_k *= 2.2  # loses heat twice as fast
        rooms["bedroom_3"].radiator.rated_w *= 0.35  # a third of the radiator
        rooms["dining"].radiator.leak = 0.2  # a fifth of the flow when shut

    async def go():
        for _ in range(int(days * 1440)):
            await rt.step()

    asyncio.run(go())
    return suggestions_view(rt)


def found(view: dict) -> set[tuple[str, str | None]]:
    return {(s["kind"], s["room_id"]) for s in view["suggestions"]}


def test_a_healthy_house_gets_no_room_suggestions():
    # Five days, as for the faults: with burner metering and the demo's changing
    # weather, the dining room's model is still settling on day 4 and reads as leaky.
    view = run(5, faults=False)
    assert view["summary"]["rooms_ready"] == 6  # not the toilet or the kitchen
    # Only the demo's weak bathroom sensor, which is about the mesh, not the rooms.
    assert found(view) == {("zigbee.weak_link", "bathroom")}


def test_faults_are_found_in_the_right_rooms():
    view = run(5, faults=True)
    got = found(view)
    assert ("room.heat_loss", "bedroom_2") in got
    assert ("radiator.undersized", "bedroom_3") in got
    assert ("valve.passing", "dining") in got
    # Nothing about the rooms left alone.
    healthy = {"bedroom_1", "bathroom", "lounge", "kitchen", "toilet"}
    assert not {rid for kind, rid in got if kind != "zigbee.weak_link"} & healthy
