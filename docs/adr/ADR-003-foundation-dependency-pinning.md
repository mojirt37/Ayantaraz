# ADR-003: Pinned engineering-foundation dependencies

- **Date:** 2026-09-02
- **Status:** Accepted

## Context

The repository started without a package lockfile. The locked requirements prescribe pinned dependencies and require reproducible installation in CI and Docker.

## Decision

Use exact versions in `package.json` and commit the npm lockfile generated from those declarations. CI and Docker must use `npm ci`, which rejects a manifest/lockfile mismatch rather than resolving a new dependency graph.

## Alternatives rejected

- **Using `latest`:** violates the requirement for controlled versions.
- **Fabricating a lockfile:** would falsely claim reproducibility.

## Consequences

The existing dependency graph is installable from the configured registry and is committed. Adding the required PostgreSQL driver and Drizzle ORM remains blocked because the registry returned HTTP 403 for those packages; this does not permit substituting mocks for database behavior.
