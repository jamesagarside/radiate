"""In-memory stand-in for `aiomqtt.Client`, enough for `read_retained`.

It holds retained messages per topic and delivers the matching ones after each
subscribe, as a broker does. Publishing fails the test: discovery is read-only.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any


@dataclass
class FakeMessage:
    topic: str
    payload: bytes | str
    retain: bool = True


class FakeBroker:
    def __init__(
        self,
        retained: dict[str, bytes | str] | None = None,
        noise: list[FakeMessage] | None = None,
    ):
        self.retained = dict(retained or {})
        self.noise = list(noise or [])  # delivered before anything else
        self.clients: list[FakeClient] = []
        self.refuse: Exception | None = None

    def client(self, host: str, port: int = 1883, **kwargs: Any) -> FakeClient:
        c = FakeClient(self, host, port, kwargs)
        self.clients.append(c)
        return c


class FakeClient:
    def __init__(self, broker: FakeBroker, host: str, port: int, kwargs: dict[str, Any]):
        self.broker = broker
        self.host = host
        self.port = port
        self.kwargs = kwargs
        self.subscribed: list[str] = []
        self.published: list[tuple[str, Any]] = []
        self.closed = False
        self._queue: asyncio.Queue[FakeMessage] = asyncio.Queue()

    async def __aenter__(self) -> FakeClient:
        if self.broker.refuse is not None:
            raise self.broker.refuse
        return self

    async def __aexit__(self, *exc: Any) -> None:
        self.closed = True

    async def subscribe(self, topic: str, qos: int = 0) -> None:
        if not self.subscribed:
            for msg in self.broker.noise:
                self._queue.put_nowait(msg)
        self.subscribed.append(topic)
        if topic in self.broker.retained:
            self._queue.put_nowait(FakeMessage(topic, self.broker.retained[topic]))

    async def publish(self, topic: str, payload: Any = None, **kwargs: Any) -> None:
        self.published.append((topic, payload))
        raise AssertionError(f"read-only client published to {topic}")

    @property
    def messages(self) -> FakeClient:
        return self

    def __aiter__(self) -> FakeClient:
        return self

    async def __anext__(self) -> FakeMessage:
        return await self._queue.get()
