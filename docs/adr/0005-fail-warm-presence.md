# ADR-0005: Fail warm: uncertain presence counts as home

- **Status:** Proposed
- **Date:** 2026-11-23
- **Deciders:** owner (pending)
- **Evidence:** an incident on the reference install, described below; [spec 7, fail warm](../spec.md#7-failure-modes); [plan, slice 7](../plans/efficiency-mvp.md#slice-7-fail-warm-presence)

## Context

On the reference install, the only person's phone ran out of battery in the morning. Home Assistant kept their `person` entity at `not_home`, with its last update frozen at that time. The integration re-reported `not_home` every 15 minutes, so Radiate's stale presence rule, which measures how recently the integration reported and not how recently the phone did, never fired. Everyone counted as away, and in the evening the whole house was held at the frost threshold, 7 °C, while the person was at home.

Radiate already fails safe for its own outages (governed mode, the schedule mirror, the Shelly watchdog). Presence is the first input where a fault elsewhere turns the heating down. The efficiency work (ADR-0004) adds more inputs that lower heating, so the rule has to be general.

## Options

### A. Shorten the stale limit

- **Pros:** one setting.
- **Cons:** doesn't help: the integration's reports stay fresh while the phone is dead.

### B. Fail warm: judge presence by the source's own freshness, count doubt as home, never hold frost on presence alone

- **Pros:** fixes this incident and its cousins (tracker stops updating, GPS stuck, app logged out); the cost of a wrong "home" is some oil, the cost of a wrong "away" is a cold house.
- **Cons:** a person who really is away with a phone that rarely updates gets less saving. Needs an additive field from radiate-ha to be exact.

### C. Stop using presence

- **Pros:** nothing to go wrong.
- **Cons:** loses the away saving the household asked for.

## Decision

B. Radiate fails warm: when an input that could lower the heating is missing, silent or doubtful, it takes the reading that keeps the house warmer. For presence: `not_home` counts only while its source has updated recently (source silence, 120 minutes by default); evidence that someone is in (an override, a store boost, the fire switch, a shower) overrides presence-based away; and presence alone never holds the house at frost, only at the unused temperature. Frost on everyone away stays, for people who said they are away until a time.

## Consequences

- `POST /api/v1/people/{id}/presence` accepts an optional `last_seen`; radiate-ha sends it in a later release. `GET /api/v1/people` gains `presence.last_seen`, `uncertain` and `why`. All additive.
- `radiate.config.away` gains the source silence and home evidence rules; `household.away.presence_source_silence_min` is a new setting.
- `everyone_away: frost` changes meaning: it applies only when everyone has an away until. Docs, the household setup's words and the Guide say so.
- New reasons `away.presence_uncertain` and `away.home_evidence` in the decision log and the UI.
- Every new input that can lower heating (room use, the outdoor cut-off, activity) must state its fail warm reading in spec 7 before it ships.

## Revisit if

- Households with reliable trackers find the source silence costs them noticeable saving; then make it per person.
