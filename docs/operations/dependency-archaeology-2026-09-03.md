# Dependency archaeology — 2026-09-03

## Scope and evidence

This inspection covered `package.json`, `package-lock.json`, `node_modules`, the npm cache, database migrations, application contracts, test harnesses, CI, Docker, and all repository imports on 2026-09-03.

## Findings

| Question                   | Verified result                                                                                                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required PostgreSQL driver | None is declared. The required Drizzle/PostgreSQL implementation needs an owner-approved, pinned driver; `pg` is the compatible conventional driver for Drizzle's Node PostgreSQL adapter.                                                                      |
| Required Drizzle version   | None is declared or pinned. Therefore no version can be selected without either an approved package source or a supplied approved version pin.                                                                                                                  |
| Present in `node_modules`  | `drizzle-orm`, `pg`, `postgres`, and `@neondatabase/serverless` are absent.                                                                                                                                                                                     |
| Present in lockfile        | None of those packages has a lockfile entry.                                                                                                                                                                                                                    |
| Available in npm cache     | `npm cache ls drizzle-orm`, `npm cache ls pg`, and `npm cache ls postgres` returned no matching cached package entries. Offline installation is therefore impossible.                                                                                           |
| Registry access            | The configured registry is `https://registry.npmjs.org/`. `npm view drizzle-orm version --fetch-retries=0 --fetch-timeout=10000` and the equivalent command for `pg` both returned `E403` on 2026-09-03.                                                        |
| Existing alternative       | No legitimate PostgreSQL-capable dependency is installed. The only runtime dependencies are Next.js, React, Zod, and `server-only`; none provides PostgreSQL persistence.                                                                                       |
| Architecture requirement   | Yes. The approved stack and existing migration/data-access contracts require PostgreSQL as the system of record and Drizzle as its ORM. Replacing it with a hand-written wire client, an in-memory fallback, or an unrelated persistence pattern is prohibited. |

## Decision

Do not implement an application PostgreSQL substitute. The codebase has migration-level PostgreSQL verification only; it does not yet have a package-backed Drizzle repository adapter. Installing the real path is blocked until an approved registry/mirror provides the exact pinned packages, or the owner supplies vetted tarballs and version pins.

## Independent hardening completed

The Redis OTP rate-limit adapter was verified to fail closed for Redis errors and timeouts. It now rejects malformed schemes and credential-bearing URLs rather than silently dropping credentials. This does not replace the required live Redis integration verification.
