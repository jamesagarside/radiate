"""The static demo build: expected files, relative URLs, and a self-sufficient zip."""

import importlib.util
import re
import subprocess
import sys
import zipfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location("build_demo", ROOT / "scripts" / "build_demo.py")
build_demo = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(build_demo)


@pytest.fixture(scope="module")
def site(tmp_path_factory):
    return build_demo.build(tmp_path_factory.mktemp("site") / "demo")


WEB = ROOT / "src" / "radiate" / "web"  # the built UI, committed


def test_expected_files(site):
    files = {p.relative_to(site).as_posix() for p in site.rglob("*") if p.is_file()}
    built = {
        f"static/{p.relative_to(WEB).as_posix()}"
        for p in WEB.rglob("*")
        if p.is_file() and p.name not in ("index.html", "login.html")
    }
    assert files == {".nojekyll", "index.html", "static/radiate.zip", *built}
    for name in (
        "static/assets/index.js",
        "static/assets/demo.js",
        "static/demo-worker.js",
        "static/icons/house.svg",
        "static/assets/quicksand-latin-400-normal.woff2",
    ):
        assert name in files, name
    assert "static/login.html" not in files  # the demo has no login


def test_index_uses_the_demo_transport_and_relative_urls(site):
    html = (site / "index.html").read_text()
    assert '<html data-transport="demo" lang="en-GB"' in html
    assert "<title>Radiate demo</title>" in html
    urls = re.findall(r'(?:src|href)="([^"]+)"', html)
    assert "static/assets/index.js" in urls
    for url in urls:
        assert not url.startswith(("/", "http:", "https:")), url
        if url.startswith("static/"):
            assert (site / url).is_file(), url


def test_static_assets_have_no_root_relative_urls(site):
    scripts = [*(site / "static" / "assets").glob("*.js"), site / "static" / "demo-worker.js"]
    assert len(scripts) > 2
    for path in scripts:
        text = path.read_text()
        assert not re.search(r"""["'`]/(?:static|api)/""", text), path.name


def test_the_ui_loads_nothing_from_the_internet():
    """Radiate runs on a LAN: fonts and icons are served with it, never from a CDN.
    Only the demo worker loads Pyodide from jsDelivr."""
    for page in ("index.html", "login.html"):
        html = (WEB / page).read_text()
        for url in re.findall(r'(?:src|href)="([^"]+)"', html):
            assert not url.startswith(("/", "http:", "https:", "//")), (page, url)
    for css in (WEB / "assets").glob("*.css"):
        text = css.read_text()
        assert "@import" not in text, css.name  # the theme's font CDN import is gone
        for url in re.findall(r"url\(([^)]*)\)", text):
            url = url.strip("'\"")
            assert url.startswith(("data:", "./", "#")), (css.name, url[:60])
    # The icon library points at the icons served with the UI.
    scripts = "".join(p.read_text() for p in (WEB / "assets").glob("*.js"))
    assert "static/icons/" in scripts


def test_the_committed_build_matches_the_sources():
    """Every icon the sources name was built, so a missing rebuild shows up here too.
    CI rebuilds web/ and fails on any difference (.github/workflows/ci.yml)."""
    sources = [
        ROOT / "web" / "index.html",
        ROOT / "web" / "login.html",
        *(ROOT / "web" / "src").rglob("*.js"),
    ]
    names = set()
    pattern = r'<wa-icon\b[^>]*?\sname="([a-z0-9-]+)"|\bicon: "([a-z0-9-]+)"|\btile\("([a-z0-9-]+)"'
    for path in sources:
        for m in re.finditer(pattern, path.read_text()):
            names.add(next(g for g in m.groups() if g))
    built = {p.stem for p in (WEB / "icons").glob("*.svg")}
    assert names == built


def test_pyodide_is_pinned_to_an_exact_version():
    worker = (ROOT / "web" / "public" / "demo-worker.js").read_text()
    assert re.search(r'PYODIDE_VERSION = "\d+\.\d+\.\d+"', worker)
    assert "cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/" in worker


def test_zip_contains_every_module_the_worker_imports(site):
    entries = build_demo.worker_entry_modules()
    assert "radiate.server.bridge" in entries
    zip_path = site / "static" / "radiate.zip"
    with zipfile.ZipFile(zip_path) as zf:
        names = set(zf.namelist())
    for module in build_demo.module_closure(entries):
        path = module.replace(".", "/")
        assert f"{path}.py" in names or f"{path}/__init__.py" in names, module
    assert "radiate/server/app.py" not in names  # aiohttp lives there

    # Import from the zip alone, in a clean interpreter, as the worker does.
    probe = f"""
import sys
sys.path[:] = [p for p in sys.path if "site-packages" not in p and not p.endswith("src")]
sys.path.insert(0, {str(zip_path)!r})
import json
for name in {entries!r}:
    __import__(name)
from radiate.server.bridge import DemoSession
s = DemoSession()
s.step(5)
state = json.loads(s.request("GET", "state"))
assert state["status"] == 200 and len(state["body"]["rooms"]) == 9, state
# The household setup works without PyYAML: the demo keeps its save in memory.
raw = dict(people=dict(sam=dict(weekdays=dict(up="07:00", bed="23:00"))),
           rooms=dict(lounge=dict(use="in_use")))
saved = json.loads(s.request("PUT", "household", json.dumps(dict(household=raw))))
assert saved["status"] == 200 and saved["body"]["source"] == "saved", saved
savings = json.loads(s.request("GET", "savings"))
assert savings["status"] == 200 and savings["body"]["status"] == "learning", savings
assert "yaml" not in sys.modules
leaked = [m for m, mod in sys.modules.items()
          if m.startswith("radiate") and {str(zip_path)!r} not in (getattr(mod, "__file__", "") or "")]
assert not leaked, leaked
assert "aiohttp" not in sys.modules
print("ok")
"""
    out = subprocess.run(
        [sys.executable, "-I", "-c", probe], capture_output=True, text=True, cwd=site
    )
    assert out.returncode == 0, out.stderr
    assert out.stdout.strip() == "ok"


def test_zip_is_reproducible(tmp_path):
    a, b = tmp_path / "a.zip", tmp_path / "b.zip"
    modules = build_demo.module_closure(build_demo.worker_entry_modules())
    build_demo.write_zip(modules, a)
    build_demo.write_zip(modules, b)
    assert a.read_bytes() == b.read_bytes()
