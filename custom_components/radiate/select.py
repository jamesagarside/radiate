"""The house-wide heating mode."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import RadiateConfigEntry
from .api import RadiateError
from .entity import RadiateEntity

MODES = ["auto", "frost", "off"]


async def async_setup_entry(
    hass: HomeAssistant,
    entry: RadiateConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    coordinator = entry.runtime_data.coordinator
    if "mode" in coordinator.data:
        async_add_entities([HeatingMode(coordinator)])


class HeatingMode(RadiateEntity, SelectEntity):
    """Shows `mode` from the server and posts `mode`, as the `radiate.set_mode` service does."""

    _attr_translation_key = "mode"
    _attr_options = MODES

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "mode")

    @property
    def available(self) -> bool:
        return super().available and "mode" in self.coordinator.data

    @property
    def current_option(self) -> str | None:
        mode = self.coordinator.data["mode"]
        return mode if mode in MODES else None

    async def async_select_option(self, option: str) -> None:
        try:
            await self.coordinator.client.set_mode(option)
        except RadiateError as err:
            raise HomeAssistantError(f"Radiate: {err}") from err
        await self.coordinator.async_request_refresh()
