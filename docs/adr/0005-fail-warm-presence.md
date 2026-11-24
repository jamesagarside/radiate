# ADR-0005: Fail warm: uncertain presence counts as home

- **Status:** Proposed (built, pending the owner's review)
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

B. Radiate fails warm: when an input that could lower the heating is missing, silent or doubtful, it takes the reading that keeps the house warmer. For presence: `not_home` counts only while the person's trackers have reported recently (`evidence_at`, 240 minutes by default); router and Bluetooth trackers and phones at 5 % battery or less wait 240 minutes before counting; a person saying they are home, or evidence that someone is in (an override, a store boost, the fire switch, a shower), overrides presence-based away until presence changes; presence alone never holds the house at frost, only at the unused temperature and never below the 12 °C damp floor. Frost on everyone away stays, for people who said they are away until a time, and room overrides still apply during it.

## Consequences

- `POST /api/v1/people/{id}/presence` accepts optional `evidence_at`, `source_type` and `battery`; radiate-ha sends them from a companion change. `GET /api/v1/people` gains `presence.evidence_at`, `source_type`, `battery`, `uncertain` and `why`, and `home_at`. `POST /api/v1/people/{id}/home` is new. All additive.
- `radiate.config.away` gains the evidence, weak source, I'm home and home evidence rules; `household.away.presence_evidence_max_age_min` and `presence_weak_source_delay_min` are new settings.
- `everyone_away: frost` changes meaning: it applies only when everyone has an away until. Docs, the household setup's words and the Guide say so.
- New reasons `away.presence_uncertain`, `away.home` and `away.home_evidence` in the decision log and the UI.
- Every new input that can lower heating (room use, the outdoor cut-off, activity) must state its fail warm reading in spec 7 before it ships.

## Revisit if

- Households with reliable trackers find the source silence costs them noticeable saving; then make it per person.
