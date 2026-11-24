"""Regenerate docs/telemetry.md's tables from the telemetry schema, and snapshot a version.

    python scripts/telemetry_docs.py             # rewrite the generated sections
    python scripts/telemetry_docs.py --check     # exit 1 if the doc is out of date
    python scripts/telemetry_docs.py --snapshot  # also write the current version's snapshot

The schema is `radiate.export.telemetry`. A snapshot, in tests/server/fixtures/telemetry,
records what a published version holds; the tests check that later versions with the
same major only add to it. Never edit or overwrite a published snapshot: bump
`SCHEMA_VERSION` instead.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from radiate.export import telemetry

ROOT = Path(__file__).resolve().parent.parent
DOC = ROOT / "docs" / "telemetry.md"
SNAPSHOTS = ROOT / "tests" / "server" / "fixtures" / "telemetry"


def snapshot_path(version: str) -> Path:
    return SNAPSHOTS / f"schema-{version}.json"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="fail if the doc is stale")
    parser.add_argument("--snapshot", action="store_true", help="write this version's snapshot")
    args = parser.parse_args()

    text = DOC.read_text()
    fresh = telemetry.render_doc(text)
    if args.check:
        if fresh != text:
            print("docs/telemetry.md is out of date: run scripts/telemetry_docs.py")
            return 1
        return 0
    if fresh != text:
        DOC.write_text(fresh)
        print(f"updated {DOC.relative_to(ROOT)}")
    if args.snapshot:
        path = snapshot_path(telemetry.SCHEMA_VERSION)
        data = json.dumps(telemetry.snapshot(), indent=2, sort_keys=True) + "\n"
        if path.exists() and path.read_text() != data:
            print(f"{path.relative_to(ROOT)} is published: bump SCHEMA_VERSION instead")
            return 1
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(data)
        print(f"wrote {path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
