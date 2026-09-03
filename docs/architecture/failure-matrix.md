# Critical-path failure matrix

This matrix describes the current server-side contracts. It does not authorize UI success states without an authoritative adapter result.

| Condition                                       | Server state                                                  | Contract response                 | User-facing state                    | Retry                                                  |
| ----------------------------------------------- | ------------------------------------------------------------- | --------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| Redis unavailable or timeout during OTP request | No challenge is created                                       | `DEPENDENCY_FAILURE` / 503        | Verification temporarily unavailable | Retry after dependency recovery                        |
| OTP persistence or SMS delivery failure         | Challenge is invalidated where possible; no session is issued | `DEPENDENCY_FAILURE` / 503        | Verification temporarily unavailable | Request a new code after recovery                      |
| Invalid, expired, consumed, or unknown OTP      | No session is issued                                          | `UNAUTHENTICATED` / 401           | Code is invalid or expired           | Request a new code                                     |
| OTP attempt limit reached                       | Challenge cannot authenticate                                 | `RATE_LIMITED` / 429              | Too many verification attempts       | Wait for policy window/new challenge                   |
| PostgreSQL unavailable for reservation/payment  | No success response is emitted                                | `DEPENDENCY_FAILURE` / 503        | Service temporarily unavailable      | Retry with the same idempotency key once available     |
| Duplicate appointment slot                      | Database unique constraint preserves one booking              | `CONFLICT` / 409                  | Choose another time                  | Select another authoritative slot                      |
| Repeated appointment request                    | Adapter returns original reservation                          | success with original reservation | Existing confirmed server result     | Safe retry with the same idempotency key               |
| Payment already decided                         | No new transition                                             | `CONFLICT` / 409                  | Payment has already been decided     | Refresh authoritative state                            |
| No published tax rule                           | No calculation is persisted                                   | `NO_PUBLISHED_RULE`               | Rule unavailable; no result shown    | Retry after publication                                |
| Malformed tax rule metadata                     | No calculation is persisted                                   | `MALFORMED_RULE`                  | Rule unavailable; no result shown    | Administrative correction only                         |
| Out-of-range tax rule                           | No calculation is persisted                                   | `OUT_OF_EFFECTIVE_RANGE`          | Rule unavailable for selected date   | Select an applicable date or await a published version |
| Unsupported/empty tax Q&A clarification         | No answer is fabricated                                       | `NO_APPROVED_ANSWER`              | No approved answer is available      | Supply a supported clarification or use consultation   |

Session creation and invalidation require the future PostgreSQL adapter to atomically consume the OTP, create/revoke the hashed session record, and return the authoritative user/session state. Until then, protected routes remain fail-closed.
