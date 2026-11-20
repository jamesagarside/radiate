# ADR-0003: Home Assistant integration in its own repository under Apache-2.0

- **Status:** Accepted (2026-11-20, owner)
- **Date:** 2026-11-20
- **Deciders:** owner
- **Evidence:** HACS validation in this repository failed its licence check: GitHub reported the licence as "Other" (SPDX `NOASSERTION`). GitHub only recognises licences listed on choosealicense.com, and the Elastic License 2.0 isn't one of them.

## Context

[ADR-0002](0002-deployment-topology.md) put the Home Assistant integration (`custom_components/radiate`) in this monorepo and licensed everything under ELv2. ELv2 lets the owner run a hosted edition while stopping others selling Radiate as a managed service.

HACS reads the licence GitHub detects. With ELv2, the HACS licence check can never pass, whatever the licence file says, and the HACS default store can't list the integration. Rewording the licence to get it detected would weaken it.

The integration is a thin client of the server's API with no control logic, so a permissive licence on it gives away nothing ELv2 protects.

## Options

### A. Keep the monorepo and ignore the licence check

- **Pros:** one repository, one pull request per API change.
- **Cons:** the integration can only ever be a HACS custom repository. CI stays red or carries an ignore.

### B. Relicense everything under a licence GitHub recognises

- **Pros:** passes HACS; one repository.
- **Cons:** none of the recognised licences stops others offering Radiate as a hosted service, so the cloud edition's protection in ADR-0002 is lost.

### C. Move the integration to its own repository under Apache-2.0

- **Pros:** passes every HACS check, so the integration can go into the default store. The engine keeps ELv2. Home Assistant release churn stays out of this repository's CI.
- **Cons:** a second repository to keep in step with the API.

## Decision

C. The integration moved, with its history, to [radiate-ha](https://github.com/jamesagarside/radiate-ha), licensed Apache-2.0. The engine, server, web UI and Home Assistant App stay here under ELv2.

## Consequences

- This repository no longer runs the Home Assistant tests, hassfest or HACS validation.
- The API contract is guarded from this side by `tests/server/test_ha_contract.py`. It fails if `/api/v1/house` or `/api/v1/state` stops returning a field in `tests/server/fixtures/ha`, the responses radiate-ha is tested with. `scripts/ha_fixtures.py` generates those fixtures for both repositories.
- To drop or rename an API field, change radiate-ha first, then regenerate the fixtures in both repositories.
- Users who added this repository as a HACS custom repository switch to radiate-ha. The integration's domain is unchanged, so entities and settings carry over.
- No server or engine code may be copied into radiate-ha, so its licence stays clean.

## Revisit if

- HACS or GitHub start recognising the Elastic License 2.0, and keeping two repositories in step costs more than it's worth.
- The integration needs logic that only the server should hold. That logic belongs in the server, not in a relicensed copy.
