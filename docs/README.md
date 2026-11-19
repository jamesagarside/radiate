# Radiate documentation

Start with the [project README](../README.md) for what Radiate is and how to try it. To contribute, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Using Radiate

- [Deployment](deployment.md): every way to run Radiate, from source, Docker, Raspberry Pi, the Home Assistant App and the HACS integration, plus Elastic export, backups and the Shelly watchdog.
- [Configuration](configuration.md): the YAML file that describes your house, and how to bring Radiate in gradually.
- [Implementation status](implementation-status.md): which parts of the specification are built.

## Design and behaviour

- [Specification](spec.md): the house model, balancing, boiler logic, failure modes, API and metrics.
- [Glossary](GLOSSARY.md): the shared domain language, with symbols, units and code identifiers.
- [Simulation findings](simulation.md): how Radiate compares with plain smart TRVs on the simulated reference house.

## Standards

- [Engineering standards](standards/engineering.md): architecture, pure core, drivers, time, safety, testing, licensing and commits.
- [Design standards](standards/design.md): web UI tokens, motion, accessibility, copy and states.

## Decisions

- [ADR-0001](adr/0001-standalone-vs-vtherm-companion.md): Radiate is a standalone house controller, not a Versatile Thermostat companion.
- [ADR-0002](adr/0002-deployment-topology.md): one engine packaged three ways, and the cloud never sits in the control loop.
- [ADR template](adr/template.md): copy it for a new decision.

## Research

- [Prior art and gap analysis](research/prior-art.md): open-source and commercial products, and what none of them do.
- [Feature coverage matrix](research/coverage-matrix.md): every feature found and Radiate's stance on each.
- [Versatile Thermostat analysis](research/vtherm.md): source-level study of the MIT-licensed integration.
- [Better Thermostat analysis](research/better-thermostat.md): behavioural study of the AGPL-licensed integration.
- [Commercial products](research/commercial.md): tado, Danfoss, Homematic IP and others, from public material.
- [Provenance](research/provenance.md): pinned source revisions, licence consequences and patents to clear.
- [Reverse-engineering and clean-room policy](research/reverse-engineering-policy.md): what research is allowed and how findings become code.
