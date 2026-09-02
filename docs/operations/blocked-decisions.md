# Blocked decisions and credentials

This register records only material blockers. It does not authorize placeholders, demo flows, fake data, or bypasses.

| ID    | Blocked capability               | Required owner input                                                                                                                                                       | Affected implementation and verification                                                                 |
| ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| B-001 | Tax rules, calculator, and Q&A   | Approved legal sources, tax type/year/taxpayer definitions, effective dates, exact integer/decimal units, formulas, rounding, disclaimers, reviewer and publication policy | Tax rule schema, decision tree, calculator, history, deterministic, boundary, regression, and E2E tests  |
| B-002 | Consultation and appointment     | Service catalogue, durations, timezone, availability generation, buffers, booking horizon, cancellation/reschedule/no-show policy, capacity and payment relationship       | Slot schema, constraints, reservation transaction, cancellation races, concurrency and E2E tests         |
| B-003 | Manual payments                  | Collection method, permitted fields, evidence for confirmation/rejection, retention, duplicate submission/idempotency policy, and appointment effect                       | Payment schema, secure validation, transactional transitions, audit and admin E2E tests                  |
| B-004 | Real OTP                         | Approved SMS provider, sender/template, production and test credentials, quota, TTL, resend and attempt policy                                                             | Better Auth integration, hashed OTP store, IP/phone/provider limits, replay and E2E tests                |
| B-005 | Persistent infrastructure        | PostgreSQL, Redis, object-storage decision, environment endpoints, secret delivery, deployment target, backup/restore RPO/RTO and operational owner                        | Migrations, integration/concurrency tests, media access, health checks, deployment and restore evidence  |
| B-006 | Public brand/content and SEO     | Legal/display identity, canonical domains, approved logo/font licenses, contact/location facts, owned articles/videos/books/media and publication approvals                | Public routes, media storage, metadata, sitemap, structured data, accessibility and visual review        |
| B-007 | Dependency installation evidence | Approved npm registry or package mirror permitting package resolution                                                                                                      | `package-lock.json`, `npm ci`, lint, typecheck, Vitest, Playwright, build, Docker and audit verification |

## Resolution protocol

When an item is resolved, record the approval source, date, owner, affected requirements, and test evidence in the relevant ADR/change record. Do not silently remove this entry or substitute an unapproved value.
