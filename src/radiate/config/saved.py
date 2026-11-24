"""The household saved from the web UI's setup, in the data directory.

The house file may be written by hand, read-only, or managed by the Home Assistant
App, so the web UI never rewrites it. It saves the household it builds as
`<data_dir>/household.yaml` instead, in the same form as the house file's `household`
section, under a top-level `household:` key so it can be pasted into a house file.
A saved household replaces the house file's section (`radiate.config.site.apply_saved`);
deleting the file goes back to the house file's setup.

Settings changed in the web UI's Settings view are saved the same way, as
`<data_dir>/settings.yaml` under a top-level `settings:` key, in the house file's shape
except that `rooms` maps each room id to its changed keys (`radiate.config.settings`).
"""

from __future__ import annotations

import contextlib
import os
import re
import tempfile
from pathlib import Path
from typing import Any

from .site import ConfigError

SAVED_FILE = "household.yaml"
_TIMES = re.compile(r"^\d\d:\d\d(-\d\d:\d\d)?$")
HEADER = (
    "# Saved by Radiate's household setup in the web UI.\n"
    "# It replaces the household section of the house file. Delete this file, or choose\n"
    '# "Use the house file\'s setup instead" in the web UI, to go back to the house file.\n'
)


def saved_path(data_dir: str | Path) -> Path:
    return Path(data_dir) / SAVED_FILE


def read_saved(data_dir: str | Path) -> dict | None:
    """The saved `household` section, or None if nothing is saved.

    Raises ConfigError if the file cannot be read or is not a household section.
    """
    import yaml

    path = saved_path(data_dir)
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None
    except OSError as err:
        raise ConfigError([f"{path}: cannot read: {err.strerror}"]) from None
    try:
        data: Any = yaml.safe_load(text)
    except yaml.YAMLError as err:
        raise ConfigError([f"{path}: not valid YAML: {err}"]) from None
    if not isinstance(data, dict) or not isinstance(data.get("household"), dict):
        raise ConfigError([f"{path}: expected a household section"])
    return data["household"]


def write_saved(data_dir: str | Path, section: dict) -> Path:
    """Write the section atomically: a reader sees the old file or the new, never half.

    Raises OSError if the data directory cannot be written.
    """
    return _write(saved_path(data_dir), HEADER, {"household": section})


def _write(path: Path, header: str, data: dict) -> Path:
    import yaml

    class Dumper(yaml.SafeDumper):
        pass

    def string(dumper: yaml.SafeDumper, value: str) -> yaml.Node:
        # Times in quotes, as the house file asks: YAML can read 22:30 as a number.
        style = '"' if _TIMES.match(value) else None
        return dumper.represent_scalar("tag:yaml.org,2002:str", value, style=style)

    Dumper.add_representer(str, string)
    path.parent.mkdir(parents=True, exist_ok=True)
    text = header + yaml.dump(
        data,
        Dumper=Dumper,
        sort_keys=False,
        allow_unicode=True,
        default_flow_style=False,
    )
    fd, tmp = tempfile.mkstemp(prefix=f".{path.stem}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        with contextlib.suppress(OSError):
            os.unlink(tmp)
        raise
    return path


def delete_saved(data_dir: str | Path) -> bool:
    """Remove the saved household. True if there was one. Raises OSError on failure."""
    try:
        saved_path(data_dir).unlink()
    except FileNotFoundError:
        return False
    return True


SETTINGS_FILE = "settings.yaml"
SETTINGS_HEADER = (
    "# Saved by Radiate's Settings view in the web UI.\n"
    "# Each value here replaces the house file's. Delete this file, or choose\n"
    '# "Use the house file" in the web UI, to go back to the house file.\n'
)


def settings_path(data_dir: str | Path) -> Path:
    return Path(data_dir) / SETTINGS_FILE


def read_settings(data_dir: str | Path) -> dict | None:
    """The saved settings, nested as in the house file, or None if nothing is saved.

    Raises ConfigError if the file cannot be read or holds no `settings` mapping.
    """
    import yaml

    path = settings_path(data_dir)
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None
    except OSError as err:
        raise ConfigError([f"{path}: cannot read: {err.strerror}"]) from None
    try:
        data: Any = yaml.safe_load(text)
    except yaml.YAMLError as err:
        raise ConfigError([f"{path}: not valid YAML: {err}"]) from None
    if not isinstance(data, dict) or not isinstance(data.get("settings"), dict):
        raise ConfigError([f"{path}: expected a settings section"])
    return data["settings"]


def write_settings(data_dir: str | Path, settings: dict) -> Path:
    """Write the saved settings atomically. Raises OSError on failure."""
    return _write(settings_path(data_dir), SETTINGS_HEADER, {"settings": settings})


def delete_settings(data_dir: str | Path) -> bool:
    """Remove the saved settings. True if there were some. Raises OSError on failure."""
    try:
        settings_path(data_dir).unlink()
    except FileNotFoundError:
        return False
    return True
