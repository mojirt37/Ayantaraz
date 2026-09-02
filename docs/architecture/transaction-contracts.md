# Transaction and constraint contracts

These are implementation contracts, not inferred business policies. Runtime reservation and payment use cases remain blocked until B-002/B-003 are approved.

## Appointment reservation

- **Authoritative read/write:** `appointment_slots`, `appointments`.
- **Required transaction:** insert the appointment directly; do not implement a separate select-then-insert availability path.
- **Constraint:** `appointments.slot_id` is unique, so concurrent valid attempts have one successful insert and all conflicts fail with PostgreSQL unique violation `23505`.
- **Idempotency:** `(user_id, idempotency_key)` is unique. A retry must load and return the already-created appointment only after owner verification.
- **Conflict behavior:** map unique-slot conflicts to stable `CONFLICT`; never claim a booking succeeded before the transaction commits.
- **Blocked policy:** rebooking after cancellation requires the owner-approved cancellation/availability policy. The initial constraint intentionally does not assume it.

## Manual payment decision

- **Authoritative read/write:** `payments`, `appointments`, `audit_logs`.
- **Required transaction:** authorize ADMIN; lock the pending payment; validate the permitted evidence once policy B-003 exists; transition once; insert an audit record; commit together.
- **Constraints:** one pending payment exists per appointment, and status/check/trigger guards prevent silent or invalid decisions.
- **Conflict behavior:** a second decision fails as a domain conflict; it must not create a duplicate audit decision.

## Tax calculation persistence

- **Authoritative read/write:** `tax_rule_versions`, `tax_calculations`.
- **Required transaction:** select one published, effective rule version and insert the normalized input/output snapshot together.
- **Constraint relied on:** stable rule/version foreign key, published effective index, and published-version immutability trigger.
- **Blocked policy:** formula selection, effective-date overlap policy, tax rounding, units, and legal sources are B-001 and must be supplied before executable calculation behavior is added.

## OTP consumption

- **Authoritative read/write:** `otp_challenges`.
- **Required transaction:** compare only an HMACed candidate, expiry and attempts, then atomically mark `consumed_at`. A consumed or expired row must never issue a session.
- **Blocked boundary:** the actual provider and runtime rate-limit implementation require B-004/B-005.
