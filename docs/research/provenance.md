# Research provenance

Every prior-art finding in `docs/research/` is pinned to an exact source revision so it can be re-checked later.

## Open-source code (REA historical-reference imports)

Imported with REA 6.9.0 (`rea import-reference-source --detail summary`, tests and docs excluded). REA records these trees as *historical reference* only. Analysis was by reading source; the REA skill itself advises against REA for ordinary source-repository analysis, so it was used for provenance and inventory, not decompilation.

| Project | Licence | Commit | REA manifest | Tree SHA-256 | Entries |
|---|---|---|---|---|---|
| [Versatile Thermostat](https://github.com/jmcollin78/versatile_thermostat) | MIT | `35f46e525d250345c293e2ed30f0cc2b2356d6b7` | `hsm_44d0ee4a…41e8bf` | `27ecbb58…cc630bc2` | 149 |
| [Better Thermostat](https://github.com/KartoffelToby/better_thermostat) | AGPL-3.0 | `aed2036b3c6d90b4e1e6ea774f0f47852a05d25d` | `hsm_36b0b6eb…6da86f` | `12332ca6…a84e7c` | 312 |

Licence consequences for Radiate (ELv2):

- **Versatile Thermostat (MIT):** code may be ported with its copyright notice kept. Prefer reimplementation; if anything is ported, list it in a `NOTICE` file.
- **Better Thermostat (AGPL-3.0):** incompatible with ELv2. Behavioural descriptions only. No code, no close paraphrase of code structure.

## Public commercial material

See the source keys in [commercial.md](commercial.md). Some tado and Danfoss statements were taken from search extracts because the vendor sites refused automated fetches; they are marked *(extract)* and must be re-read before being relied on.

## Patents to clear

Not legal advice. Before Radiate ships heat-up-rate-based capping as a headline feature, get a freedom-to-operate opinion on:

- **EP1936290B1** (about 2006/2007, likely Techem): limit valve opening on radiators with faster heating dynamics. Legal status unverified; would lapse around 2027 if maintained.
- **EP2420748** (priority 2010): reduce opening on over-supply detected against a stored reference. Grant status unverified.
- **EP2702331** (priority 2011): stepwise opening until temperature stops rising, used as max opening. Status unverified.

Public-domain prior art: **DE4221725A1** (1992), learned per-valve maximum opening after a stabilisation run. Expired.
