"""MQTT transport for Zigbee2MQTT, on aiomqtt.

Thin on purpose: it connects, subscribes, feeds every message to a callback and
publishes JSON. All mapping is in `radiate.drivers.z2m`. Reconnects with backoff.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
import ssl
from collections.abc import Callable
from typing import Any

from radiate.config import MqttConfig

LOG = logging.getLogger(__name__)


class MqttTransport:
    def __init__(
        self,
        cfg: MqttConfig,
        subscriptions: list[str],
        on_message: Callable[[str, bytes], None],
        on_connect: Callable[[], None] | None = None,
    ):
        self.cfg = cfg
        self.subscriptions = subscriptions
        self.on_message = on_message
        self.on_connect = on_connect
        self.connected = False
        self._client = None
        self._task: asyncio.Task | None = None

    async def publish(self, topic: str, payload: dict[str, Any]) -> bool:
        client = self._client
        if client is None or not self.connected:
            LOG.warning("MQTT not connected; dropped publish to %s", topic)
            return False
        try:
            await client.publish(topic, json.dumps(payload, separators=(",", ":")), qos=1)
        except Exception as err:  # aiomqtt.MqttError and socket errors
            LOG.warning("MQTT publish to %s failed: %s", topic, err)
            return False
        return True

    async def run(self) -> None:
        import aiomqtt

        backoff = 1.0
        tls = ssl.create_default_context() if self.cfg.tls else None
        while True:
            try:
                async with aiomqtt.Client(
                    self.cfg.host,
                    self.cfg.port,
                    username=self.cfg.username,
                    password=self.cfg.password,
                    identifier=self.cfg.client_id,
                    tls_context=tls,
                ) as client:
                    self._client = client
                    for topic in self.subscriptions:
                        await client.subscribe(topic, qos=1)
                    self.connected = True
                    backoff = 1.0
                    LOG.info("MQTT connected to %s:%s", self.cfg.host, self.cfg.port)
                    if self.on_connect:
                        self.on_connect()
                    async for msg in client.messages:
                        payload = msg.payload
                        if isinstance(payload, str):
                            payload = payload.encode()
                        elif not isinstance(payload, (bytes, bytearray)):
                            continue
                        try:
                            self.on_message(str(msg.topic), bytes(payload))
                        except Exception:
                            LOG.exception("error handling MQTT message on %s", msg.topic)
            except asyncio.CancelledError:
                raise
            except Exception as err:
                LOG.warning("MQTT connection lost (%s); retrying in %.0f s", err, backoff)
            finally:
                self.connected = False
                self._client = None
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 60.0)

    def start(self) -> None:
        self._task = asyncio.get_running_loop().create_task(self.run())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
