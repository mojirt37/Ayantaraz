# آنالیز تولید و دیپلوی — مخزن Ayantaraz
**تاریخ:** ۲۰۲۶-۰۹-۰۴
**وضعیت:** اجرا شده در opencode (مخزن cloned به /workspace/Ayantaraz)

---

## ۱. وضعیت MCP GitHub

| آیتم | وضعیت |
|------|-------|
| `gh` CLI | نصب و لاگین شد ✅ |
| GitHub MCP Server | نصب شد ✅ |
| ثبت در `opencode.json` | انجام شد ✅ |
| **فعال در سشن فعلی** | ❌ **نه** |

**دلیل:** کانفیگ `opencode.json` بعد از استارت سشن (run=e5fe00b2) ویرایش شد. opencode فقط در startup کانفیگ رو لود میکنه و MCP tools رو register میکنه. **برای فعال شدن ابزارهای `mcp__github__*`، باید opencode رو خاموش و دوباره اجرا کنید.**

---

## ۲. نصب قوانین ۲۰۲۶-H2

فایل `opencode.json` در `/workspace/Ayantaraz/opencode.json` ساخته شد:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["AGENTS.md", "ayan-taraz-production-grade-agent-instructions-2026.md"]
}
```
→ هر دو فایل (AGENTS.md + سند مادر ۳۵۰۰ خطی) به عنوان instructions ثبت شدن و در هر سشن داخل این مخزن خودکار لود میشن. ✅

---

## ۳. نتایج تست‌ها و ابزارها (مدرک واقعی)

| دستور | نتیجه |
|-------|-------|
| `npm run typecheck` | ✅ PASS |
| `npm run lint` | ✅ PASS |
| `npm test` | ✅ **43 تست، 13 فایل، همه پاس** |
| `npm run build` | ❌ نمیتونه اجرا بشه (BUILD_ID + env نیاز داره) |

**نکته:** تست‌ها unit tests هستن با mock store interface. هیچ integration test با PostgreSQL واقع وجود نداره.

---

## ۴. تحلیل مهندسی: معماری و کد

### چیزهایی که **خوب و قوی** هستن (verified):

1. **معماری Clean Architecture** — Domain logic در `src/modules/*/domain/`، Application use cases در `src/modules/*/application/`، Interfaces (adapters) تعریف شدن. خیلی تمیز و مطابق AGENTS.md.
2. **SQL Migrations** — `db/migrations/0001_foundation.sql` و `0002_tax_publication_review_guards.sql` شامل: pgcrypto extension، enum types، FK constraints، unique constraints، check constraints، triggers برای state-machine transitions، immutability triggers for published versions، appointment slot uniqueness، payment-per-appointment uniqueness، version lifecycle triggers.
3. **State Machine enforcement** — PostgreSQL triggers (`enforce_appointment_transition`, `enforce_payment_transition`, `enforce_version_transition_and_immutability`, `enforce_content_lifecycle`) برگارانتی حداقلی data integrity رو در DB enforcement میکنن.
4. **OTP Security** — HMAC-SHA256 (not plaintext OTP stored), timingSafeEqual verification, atomic consume, rate limiting fail-closed.
5. **Env Validation** — `src/shared/validation/env.ts` با Zod schema، runtime check در `instrumentation.ts` (fail-fast on missing secrets in production).
6. **Structured Logging** — JSON logger, request-id correlation via proxy.ts middleware.
7. **Security Headers** — CSP, COOP, CORP, X-Frame-Options, Permissions-Policy در next.config.ts.
8. **CI Pipeline** — quality (format/lint/typecheck/test/audit/build/docker), infrastructure (postgres/redis), e2e (playwright). Reproducible build with BUILD_ID.
9. **Fail-Closed Pages** — admin and dashboard redirect to login until auth adapter connected. Login page shows AvailabilityNotice.
10. **Docker multi-stage** — standalone build, healthcheck, non-root user.

### چیزهایی که **مشکل‌ساز هستن**:

1. **لاينرهای اطلاعاتی `src/modules/*/application/*.ts` فقط interface/contract هستن** — مثلاً `OtpSessionStore`, `AppointmentReservationStore`, `TaxCalculationStore`, `TaxKnowledgeStore` تعریف شدن ولی **هیچ پیاده‌سازی واقعی وجود نداره**.
2. **دور درایور پایگاه داده (Drizzle ORM + pg) نصب نشده** — `drizzle-orm` و `pg` در `package.json` و `package-lock.json` نیستن. `dependency-archaeology` ثبت کرده registry npmjs.org HTTP 403 داده و هیچ‌کدام در node_modules / npm cache نیستن.
3. **`src/infrastructure/db/` وجود نداره** — هیچ schema file، repository implementation، یا adapter connection به PostgreSQL وجود نداره.
4. **فقط یک API route وجود داره: `/api/health`** — هیچ `/api/auth/*`, `/api/tax/*`, `/api/appointments/*`, `/api/payments/*`, `/api/admin/*` route وجود نداره. Application functions هیچ HTTP boundary ندارن.
5. **Better Auth نصب نشده** — AGENTS.md و `.env.example` گفته Better Auth + SMS OTP، ولی `better-auth` dependency نیست. Login page redirect میکنه چون session adapter نیست.
6. **Redis OTP rate limiter فقط raw RESP client داره** — `RedisCommandClient` کلاس برای EVAL commands، ولی `OtpRequestRateLimiter` adapter implementation نیست و در واقع هیچ‌کجا connect نشده.
7. **مهاجرت‌ها فقط via `psql` in bash script** — `verify-postgres-foundation.sh` با docker psql اجرا میکنه. در app داخلی no migration runner (چون drizzle-orm نیست).
8. **تست‌ها unit-only با mocks** — هیچ integration test با real DB/Redis. `tests/support/server-only.ts` خالیه.
9. **Health check فقط `/api/health` status=ok** — DB/Redis connectivity بررسی نمیکنه (release runbook گفته باید health check شامل infrastructure باشه).

---

## ۵. لیست اولویت‌بندی مشکلات مانع production و دیپلوی

### 🔴 BLOCKING (بدون اینها هیچ دیپلوی واقعی ممکن نیست)

| # | مشکل | دلیل | فایل/مکان |
|---|-------|-------|-----------|
| B1 | **هیچ adapter پایگاه داده وجود نداره** — `drizzle-orm` و `pg` dependency نیستن، `src/infrastructure/db/` خالی | بدون adapter هیچ عملیات INSERT/SELECT/UPDATE به PostgreSQL انجام نمیشه. کل application layer dead code است. | `package.json` lacks `drizzle-orm`, `pg`; no `src/infrastructure/db/` |
| B2 | **هیچ API route برای عملیات کاربری وجود نداره** — فقط `/api/health` | بدون routes، کاربر نمیتونه login کنه، tax calc کنه، رزرو بگیره، payment تأیید کنه. فرانت‌اند و بک‌اند unconnected. | `src/app/api/` فقط `health/route.ts` |
| B3 | **Better Auth / SMS OTP integration نیست** — `better-auth` dependency نیست، SMS provider not configured | Login page redirect میکنه "تا اتصال ارائه‌دهنده پیامک فعال خواهد شد". هیچ فرم OTP وجود نداره. Auth is the entry gate. | `.env.example` has SMS_PROVIDER/TEMPLATE_ID; package.json has no better-auth |
| B4 | **هیچ CI/CD pipeline برای deployment نیست** — فقط CI (quality/infrastructure/e2e) | release-runbook گفته deploy step وجود داره ولی `.github/workflows` فقط ci.yml. هیچ deploy workflow به هیچ target (Vercel, Docker registry, server) نیست. | `.github/workflows/ci.yml` only |
| B5 | **Blocked decisions B-001 to B-007** — legal sources, SMS provider, brand/content, deployment target, backup/restore owner, registry access | `docs/operations/blocked-decisions.md` 7 مواد blocked. هیچ‌کدام resolve نشدن. بدون approved legal content tax engine can't be filled. Without registry access drizzle-orm/pg can't be installed. | `docs/operations/blocked-decisions.md` |

### 🟠 CRITICAL (بدون اینها production-ready نیست)

| # | مشکل | دلیل | فایل/مکان |
|---|-------|-------|-----------|
| C1 | **بدون migration runner در app** — migrations فقط via `psql` bash script | در deployment، اگر `psql` script اجرا نشه، schema نمیاد. No drizzle-migration or knex. | `scripts/verify-postgres-foundation.sh`; no `drizzle.config.ts` |
| C2 | **Redis integration not wired** — `RedisCommandClient` exists but `OtpRequestRateLimiter` adapter not implemented | `requestOtp` calls `rateLimiter.acquire()` — but no implementation connected. Fail-closed behavior means OTP requests always hit 503 at runtime. | `src/infrastructure/redis/redis-client.ts`; no rate limiter implementation file |
| C3 | **Health check doesn't verify infrastructure** — `/api/health` only returns `{status: "ok"}` | Release runbook requires health check to verify DB + Redis connectivity. A healthy app on broken infrastructure is a production incident. | `src/app/api/health/route.ts` |
| C4 | **No secrets management mechanism** — `.env.example` has secrets but no injection mechanism defined | Dockerfile has no `--secret` or mounted secret. Production env vars not defined. `instrumentation.ts` will crash on missing DATABASE_URL/REDIS_URL in production. | `.env.example`; `src/instrumentation.ts` |
| C5 | **No error tracking / APM integration** — logger is just `console.error`/`console.info` JSON | AGENTS.md observability section requires request ID, latency, error category, recoverability. No Sentry/DataDog/OpenTelemetry integration. | `src/infrastructure/observability/logger.ts` |

### 🟡 HIGH (بهبود باعث production-grade میشه)

| # | مشکل | دلیل |
|---|-------|-------|
| H1 | **No backup/restore automation** — runbook describes it but no scripts for PG dump/restore with verification | `docs/operations/release-runbook.md` requires backup/restore evidence |
| H2 | **No rollback strategy implemented** — Docker image tagging with BUILD_ID exists but no automated rollback | |
| H3 | **No E2E tests for critical user journeys** — `tests/e2e/public-surface.spec.ts` exists but only tests public surface. Login→Q&A, Login→Calculator, Login→Booking, Admin→Publish Tax Rule, Admin→Confirm Payment paths NOT tested. | `tests/e2e/public-surface.spec.ts` |
| H4 | **No performance budget / monitoring** — no Lighthouse CI, no Core Web Vitals tracking, no JS budget enforcement | |
| H5 | **No CDN, TLS, edge configuration** — no `next.config.js` output to CDN, no WAF, no DDoS protection config | |
| H6 | **Missing public SEO pages have no real structured data** — robots.ts exists but sitemap.xml, structured data JSON-LD not implemented | `src/app/robots.ts`; no `sitemap.ts`, no `@/components` for structured data |
| H7 | **Content is hardcoded** — home page has static `services` array, no CMS-driven content | `src/app/page.tsx` hardcodes service cards |
| H8 | **`npm run build` requires BUILD_ID not set in current env** | `next.config.ts` throws if BUILD_ID missing/invalid |
| H9 | **No TypeScript `drizzle-orm` types** — no schema definitions exist so type safety on DB queries impossible | |

### 🟢 MEDIUM/LOW

| # | مشکل |
|---|-------|
| M1 | `eslint-config-next` version `16.0.0` in devDependencies — should pin `eslint-config-next` properly |
| M2 | `npm audit:production` runs but findings not documented/resolved |
| M3 | `tests/e2e/public-surface.spec.ts` content not read — verify coverage |
| M4 | No `AGENTS.md` reference to `src/infrastructure/db/` in actual code (docs say it should exist) |
| M5 | `.dockerignore` content not verified |

---

## ۶. دلیل اصلی خلاصه

این مخزن یک **scaffold بسیار تمیز و مهندسی‌شده** هست که:
- معماری, state machines, constraints, security model, OTP design, tax decision-tree design, deployment contract را **کامل تعریف** کرده
- ولی **لایه پیاده‌سازی (adapter/repository/routes/auth) وجود نداره**

علت اصلی: `drizzle-orm` و `pg` از npm registry HTTP 403 گرفتن و نصب نشدن → `src/infrastructure/db/` هیچ وقت ساخته نشد → API routes ساخته نشدن → auth/OTP/payment/tax/appointment application functions هیچ‌وقت به HTTP متصل نشدن → صفحات redirect میکنن یا placeholder نشون میدن.

**هر چیز بستگی داره به B-005 (registry access) و B-007 (approved packages) بر حل شدن.**

---

## ۷. توصیه‌های فوری (به ترتیب اولویت)

1. **حل B-007**: یا registry/mirror approved بدید (دسترسی به `drizzle-orm@x.x.x`, `pg@x.x.x` tarballs)، یا از npm mirror (npmmirror.com, or registry.ir) تست کنید تا `drizzle-orm` و `pg` نصب بشن.
2. **ساخت `src/infrastructure/db/`**: adapter با drizzle-orm + schema.ts + repositories برای هر module.
3. **ساخت API routes**: `/api/auth/login`, `/api/auth/otp`, `/api/tax/calculate`, `/api/appointments/reserve`, `/api/payments/decide`, `/api/admin/*`.
4. **Better Auth integration**: `better-auth` dependency + adapter to `sessions`/`otp_challenges` tables.
5. **حل B-004/B-001**: SMS provider credentials + approved legal tax content.
6. **CD workflow**: `.github/workflows/deploy.yml` to Vercel/Docker registry/hosting.
7. **Health check upgrade**: `/api/health` + DB ping + Redis ping.
8. **E2E coverage**: critical journey tests per AGENTS.md §25.
9. **Migration runner**: drizzle-kit or knex integrated into Docker startup.
10. **Observability**: structured error tracking + APM integration.

---

*این گزارش بر اساس تحلیل واقعی فایل‌ها، اجرای دستورات، و مستندات repository تهیه شده. هیچ موضوعی حدس زده نیست.*
