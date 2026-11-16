# Reverse-engineering and clean-room policy

Radiate studies existing products to make sure it covers the features people rely on. We do that lawfully, so the project stays safe to use and contribute to.

## Tooling

We use [REA (Reverse Engineer Anything)](https://github.com/morluto/rea), which its authors describe as for lawful research, education, interoperability and analysis of software you own or are authorised to examine.

## Allowed

- Reading and analysing **open-source** code (Versatile Thermostat, Better Thermostat, etc.), respecting their licences. Code copied or ported keeps its licence and attribution.
- Public documentation: help centres, datasheets, Zigbee cluster/feature catalogues, certificates, standards, patents and papers.
- Observing the **behaviour of devices we own** on our own network: Zigbee traffic, valve positions, temperatures, timings.
- Analysing apps or firmware **only where the licence or applicable law permits it for interoperability**, and only to understand interfaces and behaviour.

## Not allowed

- Bypassing, unlocking or emulating paid subscriptions, licence checks or entitlement systems.
- Using cracked tools, leaked keys or credentials that aren't ours.
- Copying proprietary source, decompiled code or assets into this repository.
- Accessing vendor cloud services in ways their terms prohibit.

## Clean-room practice

Findings from closed products are written up as **behavioural descriptions** (what it does, what inputs it appears to use, observable results) in `docs/research/`. Implementation is written from those descriptions, not from decompiled code. Where a patent may cover a mechanism, note it in the research doc before implementing.
