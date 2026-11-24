# Contributing to Radiate

Thank you for helping. Radiate controls real boilers and radiator valves, so read the [engineering standards](docs/standards/engineering.md) before you change the core or a driver, and use the words in the [glossary](docs/GLOSSARY.md).

By contributing, you agree that your contribution is licensed under the [Elastic License 2.0](LICENSE).

## Set up

You need Python 3.12 or later (CI uses 3.13) and [uv](https://docs.astral.sh/uv/).

```bash
git clone https://github.com/jamesagarside/radiate.git
cd radiate
uv venv && uv pip install -e ".[dev]"
```

Try the demo at http://localhost:8099:

```bash
.venv/bin/radiate serve --demo --speed 60
```

## Run the tests

The main suite covers the core, configuration, drivers, server and simulator:

```bash
.venv/bin/pytest
```

The Home Assistant integration lives in its own repository, [radiate-ha](https://github.com/jamesagarside/radiate-ha), with its own tests. `tests/server/test_ha_contract.py` checks that the server still returns every field the integration is tested with. If you drop or rename an API field, change radiate-ha first, then regenerate the fixtures in both repositories:

```bash
.venv/bin/python scripts/ha_fixtures.py tests/server/fixtures/ha
.venv/bin/python scripts/ha_fixtures.py ../radiate-ha/tests/fixtures
```

## Lint and format

CI fails on any ruff finding or unformatted file:

```bash
.venv/bin/ruff check src tests scripts
.venv/bin/ruff format --check src tests scripts
```

Run `.venv/bin/ruff format src tests scripts` to fix formatting.

## Check the simulator

If you change `src/radiate/core` or the simulator, compare the simulator's results before and after your change:

```bash
.venv/bin/radiate sim --days 5
```

For a change to `eco`, room use or the savings baseline, also run the efficiency comparison (about two minutes):

```bash
.venv/bin/radiate sim-efficiency --days 24 --warmup 3 --seeds 1,2,3 --scenarios fixed,mild,cold,owner,owner_cold
```

`tests/sim` must pass; it checks that the boiler guards are never violated and that comfort and burn length stay better than plain smart TRVs. If the headline numbers move, update [docs/simulation.md](docs/simulation.md) and explain why in the pull request.

## Work on a branch

1. Create a branch from `main`, named `feature/<topic>` (or `fix/<topic>` for a bug fix).
2. Write the test first, then the change.
3. Commit in small steps. Write commit subjects in the imperative and sentence case, saying what changed, for example "Add Shelly Gen4 boiler driver and watchdog installer". Add a body when the reason isn't obvious.
4. Don't add `Co-Authored-By` or any other attribution lines to commits.
5. Open a pull request into `main` and fill in the checklist.

Never run Radiate against a real boiler or real valves with dry run off, or install the Shelly watchdog on someone's relay, without the owner's agreement.

## Release

1. On a branch, set the new version in `pyproject.toml`, `src/radiate/__init__.py` and `app/radiate/config.yaml`.
2. Point `RADIATE_REF` at the new tag (for example `v0.2.0`) in `app/radiate/Dockerfile` and `app/radiate/build.yaml`. The App installs whatever that tag holds.
3. Add the release to `app/radiate/CHANGELOG.md`. Home Assistant shows this file when it offers the update.
4. Merge, then tag the merge commit and publish a GitHub release with the same notes:

   ```bash
   git tag -a v0.2.0 -m "Radiate 0.2.0" && git push origin v0.2.0
   gh release create v0.2.0 --title "0.2.0" --notes-file notes.md
   ```

If the release adds or changes API fields, release radiate-ha after it and say which Radiate version it needs.

## Pull request checklist

- Tests added or updated, and `pytest` passes.
- `ruff check` and `ruff format --check` pass.
- Simulator compared before and after, if you changed the core.
- Docs updated: the spec, configuration, deployment or glossary, as the change needs.
- UK English, metric units, and no em or en dashes in prose.
- No personal details: no house names, locations, real IP addresses or real device names.
- No code copied from Better Thermostat (AGPL-3.0). Anything ported from Versatile Thermostat (MIT) keeps its notice.

## Where docs live

| Doc | What it's for |
|---|---|
| [docs/README.md](docs/README.md) | Index of every doc |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Domain language and the code identifiers each term maps to |
| [docs/spec.md](docs/spec.md) | What Radiate does and why: model, allocation, boiler, failure modes, API |
| [docs/configuration.md](docs/configuration.md) | The YAML configuration file |
| [docs/deployment.md](docs/deployment.md) | Running from source, Docker, Raspberry Pi, the App and the integration |
| [docs/standards/engineering.md](docs/standards/engineering.md) | Architecture, code, safety, testing and licensing rules |
| [docs/standards/design.md](docs/standards/design.md) | Web UI design, motion, accessibility and copy |
| [docs/adr/](docs/adr/) | Architecture decision records; copy [the template](docs/adr/template.md) for a new one |
| [docs/research/](docs/research/) | Prior art, source analyses and the clean-room policy |

Write docs in UK English, in the second person, with sentence-case headings. When code and a doc disagree, fix the doc in the same pull request, or open an issue if the code is wrong.
