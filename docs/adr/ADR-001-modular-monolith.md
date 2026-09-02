# ADR-001: Modular monolith with PostgreSQL as the system of record

- **Date:** 2026-09-02
- **Status:** Accepted

## Context

Ayan Taraz requires public, authenticated-user, and administrative flows, while its critical data includes tax versions, calculation history, appointments, payments, and audit records. The locked requirements prohibit microservices, CQRS, event sourcing, and speculative infrastructure.

## Decision

Use a Next.js App Router modular monolith. Keep module boundaries in `src/modules`; use server-side use cases for application behavior and PostgreSQL as the authoritative persistent store. Redis is restricted to short-lived OTP and rate-limiting data once its real configuration is approved.

## Alternatives rejected

- **Microservices:** disproportionate operational and consistency cost.
- **Redis as a business store:** violates the system-of-record requirement.
- **Generic repository/service layers:** adds ceremony without a demonstrated responsibility.

## Consequences

Cross-domain integrity can be enforced by transactions and database constraints. Modules remain independently testable without adding network boundaries.
