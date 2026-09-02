# ADR-003: Pinned engineering-foundation dependencies

- **Date:** 2026-09-02
- **Status:** Proposed

## Context

The repository started without a package manifest or lockfile. The locked requirements prescribe the production stack and prohibit unpinned critical dependencies. The environment denied registry access while resolving packages, so a verified lockfile cannot yet be generated.

## Decision

The foundation declares exact package versions in `package.json`. A generated `package-lock.json` is mandatory before CI or Docker can be considered verified; its absence is recorded as a blocked operational item.

## Alternatives rejected

- **Using `latest`:** violates the requirement for controlled versions.
- **Fabricating a lockfile:** would falsely claim reproducibility.

## Consequences

Local and CI installation/build verification remains blocked until approved registry access or an approved package mirror is available.
