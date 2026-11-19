from radiate.core.types import BoilerState
from radiate.export.elastic import ElasticExporter
from radiate.server.demo import DemoDriver
from radiate.server.runtime import Runtime
from radiate.server.store import SqliteQueue, Store
from radiate.sim.reference import house_config


def test_kv_round_trip(tmp_path):
    s = Store(tmp_path / "x" / "radiate.db")
    assert s.get("a") is None
    s.put("a", {"b": [1, 2]}, wall=123.0)
    s.put("a", {"b": [3]}, wall=124.0)
    s.close()
    s = Store(tmp_path / "x" / "radiate.db")
    assert s.get("a") == ({"b": [3]}, 124.0)


def test_queue_survives_restart_and_is_fifo(tmp_path):
    path = tmp_path / "radiate.db"
    q = SqliteQueue(Store(path), max_docs=100)
    q.extend([{"n": i} for i in range(5)], now=1000.0)
    assert len(q) == 5 and q.peek(2) == [{"n": 0}, {"n": 1}]
    q.drop(2)
    q2 = SqliteQueue(Store(path), max_docs=100)
    assert len(q2) == 3 and [d["n"] for d in q2] == [2, 3, 4]


def test_queue_prunes_by_count_and_age(tmp_path):
    q = SqliteQueue(Store(tmp_path / "r.db"), max_docs=4, max_age_s=3600)
    q.extend([{"n": i} for i in range(3)], now=0.0)
    q.extend([{"n": i} for i in range(3, 6)], now=10.0)
    assert [d["n"] for d in q] == [2, 3, 4, 5]
    q.extend([{"n": 6}], now=4000.0)  # the first batches are now over an hour old
    assert [d["n"] for d in q] == [6]


class _Resp:
    def __init__(self, status, body):
        self.status, self._body = status, body

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def json(self, content_type=None):
        return self._body


class _Session:
    def __init__(self, fail=False):
        self.fail = fail

    def post(self, url, data, headers, timeout):
        if self.fail:
            raise OSError("down")
        return _Resp(200, {"errors": False, "items": []})


async def test_exporter_on_disk_queue(tmp_path):
    rt = Runtime(house_config(), DemoDriver())
    await rt.step()
    store = Store(tmp_path / "r.db")
    exp = ElasticExporter("http://es", "k", rt.house_id, batch=4, queue=SqliteQueue(store, 1000))
    exp.record(rt.describe())
    n = len(exp.buffer)
    assert n == 10  # 9 rooms and the boiler
    assert not await exp.flush(_Session(fail=True))
    # Outage plus restart: nothing lost.
    exp2 = ElasticExporter("http://es", "k", rt.house_id, batch=4, queue=SqliteQueue(store, 1000))
    assert len(exp2.buffer) == n
    assert await exp2.flush(_Session())
    assert len(exp2.buffer) == n - 4


async def test_runtime_restores_house_id_mode_and_models(tmp_path):
    store = Store(tmp_path / "r.db")
    driver = DemoDriver()
    rt = Runtime(house_config(), driver, store=store)
    assert rt.restore() == []
    first_id = rt.house_id
    for _ in range(30):
        await rt.step()
    rt.mode = rt.mode.__class__("frost")
    a_before = rt.state.rooms["dining"].est.theta
    await rt.stop()  # saves

    rt2 = Runtime(house_config(), DemoDriver(), store=store)
    assert rt2.restore() == []
    assert rt2.house_id == first_id
    assert rt2.mode.value == "frost"
    assert rt2.state.rooms["dining"].est.theta == a_before
    assert rt2.state.boiler.state in set(BoilerState)
