"""Build the static, serverless demo site into dist/demo/ (stdlib only).

The site is the normal web UI plus a Web Worker that runs the real Radiate engine
and simulator under Pyodide. It needs no server: any static host works, including
GitHub Pages under a sub-path, because every URL in it is relative.

    python scripts/build_demo.py [--out dist/demo]

It packages the built web UI in src/radiate/web, which is committed, so it needs no
Node. After changing web/, rebuild that first (cd web && npm run build).

Output:
    index.html            the web UI, switched to the in-browser transport
    static/assets/        the built scripts, styles and fonts, including demo.js
    static/icons/         the Font Awesome Free icons the UI uses
    static/demo-worker.js the worker that runs the engine
    static/radiate.zip    the Python modules the worker imports, and their imports
    .nojekyll             stop GitHub Pages running Jekyll over the site
"""

from __future__ import annotations

import argparse
import ast
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
# The built web UI (Vite builds web/ into it) and the worker's source.
WEB = SRC / "radiate" / "web"
WORKER = ROOT / "web" / "public" / "demo-worker.js"
DEFAULT_OUT = ROOT / "dist" / "demo"
# Pages the server serves itself; the demo has no login.
SERVER_PAGES = ("index.html", "login.html")
HTML_OPEN = '<html lang="en-GB" class="wa-theme-awesome wa-palette-bright wa-brand-orange">'
ZIP_NAME = "radiate.zip"
# A fixed timestamp keeps the zip byte-for-byte reproducible.
ZIP_DATE = (2026, 1, 1, 0, 0, 0)


def worker_entry_modules(worker: Path = WORKER) -> list[str]:
    """The Python modules demo-worker.js imports with pyodide.pyimport()."""
    found = re.findall(r"""pyimport\(\s*["']([\w.]+)["']\s*\)""", worker.read_text())
    if not found:
        raise SystemExit(f"{worker}: no pyimport() calls found")
    return sorted(set(found))


def _module_path(name: str) -> Path | None:
    base = SRC.joinpath(*name.split("."))
    if (base / "__init__.py").is_file():
        return base / "__init__.py"
    if base.with_suffix(".py").is_file():
        return base.with_suffix(".py")
    return None


def _imports(name: str, path: Path) -> set[str]:
    """Every radiate module `path` imports, anywhere in the file (including lazily)."""
    package = name if path.name == "__init__.py" else name.rpartition(".")[0]
    out: set[str] = set()
    for node in ast.walk(ast.parse(path.read_text(), str(path))):
        if isinstance(node, ast.Import):
            out.update(a.name for a in node.names)
        elif isinstance(node, ast.ImportFrom):
            if node.level:
                parts = package.split(".")
                base = ".".join(parts[: len(parts) - node.level + 1])
                mod = f"{base}.{node.module}" if node.module else base
            else:
                mod = node.module or ""
            out.add(mod)
            # `from pkg import sub` may name a submodule rather than an attribute.
            out.update(f"{mod}.{a.name}" for a in node.names)
    return {m for m in out if m == "radiate" or m.startswith("radiate.")}


def module_closure(entries: list[str]) -> dict[str, Path]:
    """Map each radiate module needed by `entries` (with parent packages) to its file."""
    found: dict[str, Path] = {}
    todo = list(entries)
    while todo:
        name = todo.pop()
        if name in found:
            continue
        path = _module_path(name)
        if path is None:
            continue  # an attribute imported with `from x import y`, not a module
        found[name] = path
        parts = name.split(".")
        todo.extend(".".join(parts[:i]) for i in range(1, len(parts)))
        todo.extend(_imports(name, path))
    missing = [e for e in entries if e not in found]
    if missing:
        raise SystemExit(f"entry modules not found under {SRC}: {missing}")
    return found


def write_zip(modules: dict[str, Path], dest: Path) -> None:
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in sorted(modules.values()):
            info = zipfile.ZipInfo(path.relative_to(SRC).as_posix(), ZIP_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            zf.writestr(info, path.read_bytes())


def demo_index(html: str) -> str:
    """The server's index.html, switched to the in-browser transport."""
    swaps = [
        (HTML_OPEN, HTML_OPEN.replace("<html ", '<html data-transport="demo" ')),
        (
            "<title>Radiate</title>",
            "<title>Radiate demo</title>\n"
            '  <meta name="description" content="Try Radiate, local whole-house heating '
            'balancing and boiler control, running against a simulated house in your browser.">',
        ),
    ]
    for old, new in swaps:
        if html.count(old) != 1:
            raise SystemExit(f"{WEB / 'index.html'}: expected exactly one {old!r}")
        html = html.replace(old, new)
    return html


def build(out: Path = DEFAULT_OUT, web: Path = WEB) -> Path:
    if not (web / "index.html").is_file():
        raise SystemExit(f"{web}: no built web UI. Run `npm ci && npm run build` in web/.")
    if out.exists():
        shutil.rmtree(out)
    static = out / "static"
    static.mkdir(parents=True)
    # Everything the page loads sits under static/, as the server serves it.
    for path in sorted(web.rglob("*")):
        rel = path.relative_to(web)
        if path.is_dir() or rel.as_posix() in SERVER_PAGES or "__pycache__" in rel.parts:
            continue
        (static / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, static / rel)
    (out / "index.html").write_text(demo_index((web / "index.html").read_text()))
    write_zip(module_closure(worker_entry_modules()), static / ZIP_NAME)
    (out / ".nojekyll").write_text("")
    return out


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="output directory")
    args = parser.parse_args(argv)
    out = build(args.out.resolve())
    total = sum(p.stat().st_size for p in out.rglob("*") if p.is_file())
    print(f"Built {out} ({total / 1024:.0f} KiB, plus Pyodide from the CDN)")


if __name__ == "__main__":
    sys.exit(main())
