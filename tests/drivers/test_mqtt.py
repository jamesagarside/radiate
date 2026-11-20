"""`read_retained`, against an in-memory broker (no real MQTT connection)."""

import asyncio

import pytest

from radiate.config import MqttConfig
from radiate.drivers.mqtt import read_retained

from .fake_mqtt import FakeBroker, FakeMessage

DEVICES = "zigbee2mqtt/bridge/devices"
GROUPS = "zigbee2mqtt/bridge/groups"
CFG = MqttConfig(host="broker", port=1884, username="u", password="p", client_id="radiate-x")


async def test_reads_every_retained_topic_and_never_publishes():
    broker = FakeBroker({DEVICES: b"[1]", GROUPS: "[]"})
    got = await read_retained(CFG, [DEVICES, GROUPS], 5, client_factory=broker.client)
    assert got == {DEVICES: b"[1]", GROUPS: b"[]"}
    (client,) = broker.clients
    assert client.subscribed == [DEVICES, GROUPS]
    assert client.published == [] and client.closed
    assert (client.host, client.port) == ("broker", 1884)
    assert client.kwargs["identifier"] == "radiate-x"
    assert client.kwargs["username"] == "u" and client.kwargs["password"] == "p"
    assert client.kwargs["tls_context"] is None


async def test_optional_topic_waits_only_the_settle_time():
    broker = FakeBroker({DEVICES: b"[]"})
    loop = asyncio.get_running_loop()
    start = loop.time()
    got = await read_retained(
        CFG,
        [DEVICES, GROUPS],
        30,
        required={DEVICES},
        settle_s=0.05,
        client_factory=broker.client,
    )
    assert got == {DEVICES: b"[]"}
    assert loop.time() - start < 1


async def test_times_out_with_what_arrived():
    broker = FakeBroker({})
    got = await read_retained(CFG, [DEVICES], 0.05, client_factory=broker.client)
    assert got == {}


async def test_ignores_other_topics_and_keeps_the_first_message():
    noise = [
        FakeMessage("zigbee2mqtt/trv_a", b"{}"),
        FakeMessage(DEVICES, b"[0]", retain=False),
    ]
    broker = FakeBroker({DEVICES: b"[1]"}, noise=noise)
    got = await read_retained(CFG, [DEVICES], 5, client_factory=broker.client)
    assert got == {DEVICES: b"[0]"}


async def test_connection_errors_propagate():
    broker = FakeBroker({})
    broker.refuse = OSError("connection refused")
    with pytest.raises(OSError):
        await read_retained(CFG, [DEVICES], 1, client_factory=broker.client)


async def test_tls_builds_a_context():
    broker = FakeBroker({DEVICES: b"[]"})
    cfg = MqttConfig(host="broker", tls=True)
    await read_retained(cfg, [DEVICES], 1, client_factory=broker.client)
    assert broker.clients[0].kwargs["tls_context"] is not None
