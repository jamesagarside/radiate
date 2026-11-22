"""House suggestions for the web UI (`GET /api/v1/suggestions`).

The advice itself comes from the pure core (`radiate.core.suggestions`). This module
gathers what the core needs from the rest of the runtime: each room's warmest
scheduled setpoint, from the week view, and the Zigbee devices with their routes,
from the devices view when the driver has one.
"""

from __future__ import annotations

from radiate.core.suggestions import DeviceLink, report_view, suggest

from .runtime import Runtime
from .schedules import schedules_view


def suggestions_view(rt: Runtime) -> dict:
    devices, weak_lqi = _links(rt.devices_view())
    report = suggest(rt.cfg, rt.state, targets=_warmest(rt), devices=devices, weak_lqi=weak_lqi)
    return report_view(rt.cfg, report)


def _warmest(rt: Runtime) -> dict[str, float]:
    """Each room's warmest setpoint in the week it follows now."""
    out: dict[str, float] = {}
    for room in schedules_view(rt)["rooms"]:
        setpoints = [t["setpoint"] for day in room["days"] for t in day["transitions"]]
        if setpoints:
            out[room["id"]] = max(setpoints)
    return out


def _links(view: dict | None) -> tuple[list[DeviceLink], float]:
    """The Zigbee devices in a `GET devices` body, and its weak signal limit."""
    if not view:
        return [], 40.0
    weak = float(view["limits"]["weak_signal_lqi"])
    out = []
    for d in view["devices"]:
        if d.get("link") != "zigbee":
            continue
        route = d.get("route") or {}
        via = route.get("via")
        out.append(
            DeviceLink(
                id=d["id"],
                label=d["label"],
                lqi=d.get("linkquality"),
                available=d.get("available"),
                room_id=d.get("room_id"),
                room_name=d.get("room_name"),
                via=via,
                via_label=via,
                via_kind=route.get("via_kind"),
                route_lqi=route.get("lqi"),
            )
        )
    return out, weak
