# Engineering foundation traceability

| Requirement                                                         | Design / implementation                                 | Evidence                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| TypeScript strict, formatting, linting, unit/E2E command boundaries | `tsconfig.json`, ESLint/Prettier, package scripts, CI   | `npm run format:check`; dependency-backed checks listed in B-007           |
| Secure headers and no framework disclosure                          | `next.config.ts`                                        | Source review; runtime build blocked by B-007                              |
| Request-level observability                                         | `src/proxy.ts`, `logger.ts`, health route               | Source review; endpoint runtime test blocked by B-007                      |
| Config/secrets separated from public configuration                  | `.env.example`, server-only Zod environment parser      | Unit test present; execution blocked by B-007                              |
| Explicit state transitions                                          | Pure appointment/payment/content/version state machines | Unit test present; execution blocked by B-007                              |
| DB-enforced lifecycle and ownership/integrity constraints           | `db/migrations/0001_foundation.sql`                     | SQL source review; PostgreSQL integration execution blocked by B-005/B-007 |
| OTP confidentiality and replay-safe consumption boundary            | HMAC OTP domain functions and atomic store contract     | Unit test present; provider/store execution blocked by B-004/B-005/B-007   |
| Persian/Arabic tax-input normalization and exact integers           | `tax/domain/normalization/persian.ts`                   | Unit test present; tax-rule execution blocked by B-001/B-007               |
| Server-side authorization and safe media validation                 | Ownership/admin checks and byte-signature validator     | Unit test present; runtime integrations blocked by B-005/B-006/B-007       |
| No guessed tax/booking/payment business policy                      | B-001 through B-006 blocker register                    | Owner decision required                                                    |
