"""The house layout: GET and PUT /api/v1/layout, validation and persistence."""

import pytest
from aiohttp.test_utils import TestClient, TestServer

from radiate.server import layout
from radiate.server.app import create_app
from radiate.server.bridge import DemoSession
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.store import Store
from radiate.sim.reference import house_config

H = {"Authorization": "Bearer secret"}
IDS = {r.id for r in house_config().rooms}


def _plan(**rooms):
    return {"floors": ["Ground floor", "First floor"], "rooms": rooms}


@pytest.fixture
async def client():
    rt = Runtime(house_config(), DemoDriver())
    async with TestClient(TestServer(create_app(rt, token="secret"))) as c:
        c.rt = rt
        yield c


async def test_no_layout_until_one_is_saved(client):
    r = await client.get("/api/v1/layout", headers=H)
    assert r.status == 200
    assert await r.json() == {"layout": None}


async def test_saved_layout_is_returned(client):
    rid = sorted(IDS)[0]
    body = _plan(**{rid: {"floor": 1, "x": 0, "y": 1.5, "w": 3, "d": 2.5}})
    r = await client.put("/api/v1/layout", json=body, headers=H)
    assert r.status == 200
    r = await client.get("/api/v1/layout", headers=H)
    assert (await r.json())["layout"] == body


async def test_layout_needs_the_token(client):
    r = await client.put("/api/v1/layout", json=_plan())
    assert r.status == 401


@pytest.mark.parametrize(
    "body, problem",
    [
        ({"floors": []}, "floors"),
        ({"floors": ["x"] * 7}, "floors"),
        ({"floors": [""]}, "floors[0]"),
        (
            {"floors": ["G"], "rooms": {"nowhere": {"floor": 0, "x": 0, "y": 0, "w": 1, "d": 1}}},
            "no such room",
        ),
        ({"floors": ["G"], "extra": 1}, "unknown field"),
    ],
)
async def test_bad_layouts_are_refused(client, body, problem):
    r = await client.put("/api/v1/layout", json=body, headers=H)
    assert r.status == 400
    assert problem in await r.text()
    assert client.rt.layout is None


def test_rooms_must_fit_their_floor_and_the_plan():
    rid = sorted(IDS)[0]
    for pos, problem in [
        ({"floor": 2, "x": 0, "y": 0, "w": 1, "d": 1}, ".floor"),
        ({"floor": 0, "x": -1, "y": 0, "w": 1, "d": 1}, ".x"),
        ({"floor": 0, "x": 0, "y": 0, "w": 0.2, "d": 1}, ".w"),
        ({"floor": 0, "x": 59, "y": 0, "w": 2, "d": 1}, ".x"),
        ({"floor": 0, "x": 0, "y": 0, "w": True, "d": 1}, ".w"),
        ({"floor": 0, "x": 0, "y": 0, "w": 1}, "expected floor"),
    ]:
        with pytest.raises(layout.LayoutError, match=problem.replace(".", r"\.")):
            layout.validate(_plan(**{rid: pos}), IDS)


def test_layout_survives_a_restart(tmp_path):
    rid = sorted(IDS)[0]
    body = _plan(**{rid: {"floor": 0, "x": 1, "y": 1, "w": 2, "d": 2}})
    rt = Runtime(house_config(), DemoDriver(), store=Store(tmp_path / "r.db"))
    rt.restore()
    rt.set_layout(body)
    again = Runtime(house_config(), DemoDriver(), store=Store(tmp_path / "r.db"))
    again.restore()
    assert again.layout == body


def test_restore_drops_rooms_the_house_no_longer_has():
    rid = sorted(IDS)[0]
    saved = _plan(
        **{
            rid: {"floor": 0, "x": 0, "y": 0, "w": 2, "d": 2},
            "gone": {"floor": 0, "x": 0, "y": 0, "w": 2, "d": 2},
        }
    )
    assert set(layout.restore(saved, IDS)["rooms"]) == {rid}
    assert layout.restore("junk", IDS) is None


def test_demo_session_serves_the_layout():
    s = DemoSession()
    rid = sorted(IDS)[0]
    import json

    put = json.loads(
        s.request(
            "PUT",
            "layout",
            json.dumps(_plan(**{rid: {"floor": 0, "x": 0, "y": 0, "w": 2, "d": 2}})),
        )
    )
    assert put["status"] == 200
    got = json.loads(s.request("GET", "layout"))
    assert got["body"]["layout"]["rooms"][rid]["w"] == 2
