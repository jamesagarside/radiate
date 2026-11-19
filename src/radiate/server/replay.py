"""`radiate replay`: the I/O around the pure replay.

`run_replay` reads the history from the state database, replays it with
`radiate.core.history.Replayer` and returns a report as plain data; `format_report`
turns that into text.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from radiate.core.history import Replayer, Tally
from radiate.core.types import HouseConfig

from .history import History


def _iso(wall: float | None, tz: ZoneInfo) -> str | None:
    if wall is None:
        return None
    return datetime.fromtimestamp(wall, tz).isoformat(timespec="seconds")


def run_replay(
    cfg: HouseConfig,
    history: History,
    tz: ZoneInfo,
    *,
    start: float | None = None,
    end: float | None = None,
    fresh: bool = False,
    limit: int = 50,
) -> dict[str, Any]:
    """Replay the recorded ticks between `start` and `end` (Unix times, inclusive).

    Saved state begins at the last start entry before `start` (or a checkpoint), so
    earlier ticks warm the state up; fresh state begins from priors at `start`.
    `limit` caps the differences listed (0: all); the count covers every tick.
    """
    from_id = history.first_id(start) if fresh else history.anchor_id(start)
    replayer = Replayer(cfg, fresh=fresh, start=start, end=end)
    recorded, replayed = Tally(), Tally()
    listed: list[dict[str, Any]] = []
    differing = 0
    first = last = None
    for tick in replayer.run(history.entries(from_id, until=end)):
        recorded.add(cfg, tick.segment, tick.snapshot, tick.recorded)
        replayed.add(cfg, tick.segment, tick.snapshot, tick.replayed)
        first = tick.wall if first is None else first
        last = tick.wall
        if tick.differences:
            differing += 1
            if limit <= 0 or len(listed) < limit:
                listed.append({"time": _iso(tick.wall, tz), "changes": tick.differences})
    return {
        "state": "fresh" if fresh else "saved",
        "from": _iso(first, tz),
        "to": _iso(last, tz),
        "ticks": replayer.ticks,
        "restarts": replayer.restarts,
        "began": replayer.began,
        "skipped": replayer.skipped,
        "unreadable": replayer.unreadable,
        "notes": replayer.notes,
        "differing_ticks": differing,
        "differences": listed,
        "recorded": recorded.as_dict(),
        "replayed": replayed.as_dict(),
    }


def _change(c: dict[str, Any]) -> str:
    what, a, b = c["what"], c["recorded"], c["replayed"]
    if what in ("reasons", "alerts"):
        parts = [f"-{x}" for x in a] + [f"+{x}" for x in b]
        return f"{what} {' '.join(parts)}"
    return f"{what} {a} -> {b}"


def _cell(value: Any) -> str:
    return "-" if value is None else f"{value:g}" if isinstance(value, float) else str(value)


def format_report(report: dict[str, Any]) -> str:
    lines = []
    if not report["ticks"]:
        lines.append("No recorded ticks to replay in that range.")
    else:
        restarts = report["restarts"]
        lines.append(
            f"Replayed {report['ticks']} ticks from {report['from']} to {report['to']} "
            f"({report['state']} state, {restarts} restart{'' if restarts == 1 else 's'})."
        )
    if report["skipped"]:
        lines.append(f"Skipped {report['skipped']} ticks recorded before any saved state.")
    if report["unreadable"]:
        lines.append(f"Could not read {report['unreadable']} entries.")
    lines.extend(f"Note: {n}." for n in report["notes"])
    if report["ticks"]:
        n = report["differing_ticks"]
        if n == 0:
            lines.append("No differences: the replayed actions match the recorded ones.")
        else:
            shown = report["differences"]
            lines.append(f"{n} of {report['ticks']} ticks differ (recorded -> replayed).")
            if len(shown) < n:
                lines.append(f"First {len(shown)}:")
            for d in shown:
                lines.append(f"  {d['time']}  " + "; ".join(_change(c) for c in d["changes"]))

    rec, rep = report["recorded"], report["replayed"]
    rows = [
        ("relay starts", "starts"),
        ("burns", "burns"),
        ("mean burn (min)", "mean_burn_min"),
        ("shortest burn (min)", "shortest_burn_min"),
        ("heating relay (h)", "heating_relay_h"),
        ("store relay (h)", "store_relay_h"),
    ]
    table = [(label, _cell(rec[key]), _cell(rep[key])) for label, key in rows]
    for code in sorted(set(rec["alerts"]) | set(rep["alerts"])):
        a, b = rec["alerts"].get(code), rep["alerts"].get(code)
        table.append(
            (
                f"{code} (onsets)",
                _cell(a["onsets"] if a else 0),
                _cell(b["onsets"] if b else 0),
            )
        )
    width = max(len(r[0]) for r in table)
    lines.append("")
    lines.append(f"{'':{width}}  {'recorded':>9}  {'replayed':>9}")
    lines.extend(f"{label:{width}}  {a:>9}  {b:>9}" for label, a, b in table)
    below = rec["below_setpoint_h"]
    worst = sorted(below.items(), key=lambda kv: -kv[1])[:3]
    detail = ", ".join(f"{rid} {h:g} h" for rid, h in worst)
    lines.append("")
    lines.append(
        f"Below setpoint by more than the comfort limit (recorded temperatures): "
        f"{rec['below_setpoint_room_h']:g} room-hours" + (f" ({detail})" if detail else "")
    )
    return "\n".join(lines)
