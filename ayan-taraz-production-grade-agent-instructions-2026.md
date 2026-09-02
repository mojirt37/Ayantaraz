# آیان تراز — سند مادر اجرای Production-Grade
## نسخه قفل‌شده سناریو، معماری، قوانین مهندسی و دستورالعمل اجرایی برای Coding Agent
**تاریخ مرجع:** نیمه دوم 2026  
**وضعیت:** LOCKED / Production-Grade Specification  
**اصل محوری:** «قدرت از سادگی میاد»

---

## 0. فرمان اصلی

این سند قرارداد اجرایی پروژه «آیان تراز» است.

Coding Agent باید این سند را به‌عنوان **Source of Truth اجرایی پروژه** در نظر بگیرد. هر تغییر معماری، فناوری، Scope، امنیت، مدل داده یا رفتار کسب‌وکار باید با این سند سازگار باشد.

### قوانین غیرقابل مذاکره

1. هیچ Mock، Fake، Demo، Simulation یا Stub در مسیر Production وجود نداشته باشد.
2. هیچ `DEMO_MODE`، `MOCK_MODE`، `BYPASS_AUTH`، `FAKE_TAX`، `FAKE_BOOKING` یا میان‌بر مشابه در Production وجود نداشته باشد.
3. هیچ Business Logic در UI قرار نگیرد.
4. PostgreSQL منبع حقیقت سیستم است.
5. Redis منبع حقیقت کسب‌وکار نیست.
6. UI و Client State منبع حقیقت نیستند.
7. Invariantهای حیاتی باید در Database نیز enforce شوند.
8. Tax Rule منتشرشده Immutable است.
9. محاسبات مالیاتی باید Deterministic، Versioned و Reproducible باشند.
10. رزرو Slot باید Atomic و Database-enforced باشد.
11. Authorization همیشه Server-side است.
12. اطلاعات شخصی کاربر فقط بر اساس مالکیت Resource قابل دسترسی است.
13. هیچ قانون مالیاتی بدون Source، Version، Effective Date و Review State وارد Production نمی‌شود.
14. هیچ Dependency حیاتی با نسخه `latest` قفل نمی‌شود.
15. هیچ Feature خارج از Scope بدون Requirement واقعی اضافه نمی‌شود.
16. قبل از پایان هر فاز، Test و Evidence تولید شود.
17. اگر Requirement مبهم است، Agent حق حدس‌زدن در مسیر حیاتی را ندارد؛ باید آن را به Decision موردنیاز تبدیل کند.
18. در تعارض بین سادگی و پیچیدگی، گزینه ساده‌تر تا زمانی که Requirement خلاف آن را ثابت نکرده انتخاب شود.
19. در تعارض بین UX و امنیت/درستی داده، امنیت و درستی داده اولویت دارند؛ UX باید برای آن طراحی شود.
20. هیچ کد Critical Path با TODO یا رفتار ناقص وارد Production نمی‌شود.

---

# 1. هدف محصول

آیان تراز یک وب‌سایت حرفه‌ای، سریع، Mobile-First و تخصصی برای خدمات حسابداری/مالیاتی است که:

- محتوای عمومی معتبر ارائه می‌کند.
- مقالات، ویدئوها و مینی‌بوک دارد.
- پرسش و پاسخ مالیاتی 100% بدون AI ارائه می‌کند.
- ماشین‌حساب مالیاتی Deterministic ارائه می‌کند.
- امکان رزرو مشاوره دارد.
- احراز هویت فقط با Phone + OTP انجام می‌شود.
- کاربران بدون Login می‌توانند محتوای عمومی را ببینند.
- اقدامات شخصی مانند Tax Q&A، Calculator و Consultation نیازمند Login هستند.
- Admin کنترل محتوا، قوانین مالیاتی، Q&A، رزروها، پرداخت دستی و Audit را دارد.
- درگاه پرداخت آنلاین ندارد.

---

# 2. Scope قفل‌شده

## Public

- Home
- Articles
- Videos
- Mini Books
- About Us
- Tax Q&A Landing Page
- Tax Calculator Landing Page
- Consultation Landing Page
- Video Player
- Mini Book PDF Viewer بدون Download Button

## Authenticated User

- Tax Q&A Workspace
- Tax Calculator Workspace
- Consultation / Booking
- Appointments
- Calculation History
- Consultation History

## Admin

- Dashboard
- Users
- Consultations
- Appointments
- Manual Payments
- Tax Rules
- Knowledge / Q&A
- Articles
- Videos
- Mini Books
- Media
- Homepage
- Audit Logs

## Explicitly Out of Scope

- AI / LLM / RAG / Vector DB / Embedding
- Online Payment Gateway
- Subscription
- Wallet
- Loyalty
- Social Login
- Mobile App
- Microservices
- Kubernetes
- Service Mesh
- Kafka / RabbitMQ / BullMQ مگر Requirement واقعی ایجاد شود
- Elasticsearch / OpenSearch مگر اندازه و نیاز واقعی اثبات شود
- Generic Rule Engine
- Generic CMS / Page Builder
- Complex RBAC
- CQRS / Event Sourcing / Saga
- Multi-region
- Multi-tenant
- Permanent Worker
- Distributed Cache Architecture
- Unnecessary Monorepo / Turborepo
- Nginx به‌عنوان الزام
- Feature Creep

---

# 3. Stack قفل‌شده

- Next.js 16
- TypeScript Strict
- Tailwind CSS
- shadcn/ui
- Better Auth + SMS OTP
- PostgreSQL 18
- Drizzle ORM
- Redis فقط برای OTP و Rate Limiting و در صورت نیاز Cache کوتاه‌مدت اثبات‌شده
- Zod
- Vitest
- Playwright
- Docker
- Object Storage فقط در صورت نیاز واقعی Media/File
- Worker فقط در صورت نیاز واقعی Background Job / Retry

## اصل انتخاب فناوری

فناوری فقط زمانی اضافه می‌شود که:

1. Requirement مشخصی داشته باشد.
2. Alternative ساده‌تر جواب ندهد.
3. Cost و Failure Mode آن شناخته شده باشد.
4. Test و Operational Plan داشته باشد.
5. به Architecture Complexity غیرضروری منجر نشود.

---

# 4. معماری کلان

```text
INTERNET
   |
CDN / EDGE / TLS
   |
Next.js 16 App Router
   |
+-------------------------------+
| Public | User | Admin | Auth |
+-------------------------------+
   |
Application Layer
   |
+-----------------------------------------------+
| Identity | Tax | Knowledge | Consultation    |
| Appointment | Content | Media | Users        |
+-----------------------------------------------+
   |
PostgreSQL
   |
Redis
(OTP / Rate Limit / proven short cache only)
```

## معماری داخلی

پیش‌فرض:

```text
UI -> Use Case -> Database
```

اگر Domain Logic واقعی وجود داشت:

```text
UI -> Use Case -> Domain Logic -> Database
```

از این الگوی بیش‌ازحد پیچیده پرهیز شود:

```text
Controller -> Service -> UseCase -> DomainService
-> Repository -> DAO -> ORM -> ...
```

Abstraction باید از نیاز واقعی ناشی شود، نه از عادت.

---

# 5. ساختار پروژه

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── dashboard/
│   ├── admin/
│   └── api/
│
├── modules/
│   ├── identity/
│   ├── users/
│   ├── tax/
│   │   ├── domain/
│   │   │   ├── rules/
│   │   │   ├── calculator/
│   │   │   └── decision-tree/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── knowledge/
│   ├── consultation/
│   ├── appointment/
│   ├── content/
│   └── media/
│
├── infrastructure/
│   ├── db/
│   ├── redis/
│   ├── sms/
│   └── observability/
│
└── shared/
    ├── validation/
    ├── security/
    ├── errors/
    └── utils/
```

Domain نباید به React، Next.js، HTTP، Browser یا Redis وابسته باشد.

---

# 6. URL Architecture

```text
/
/articles
/videos
/mini-books
/about
/tax-qa
/tax-calculator
/consultation
/login

/dashboard
/dashboard/tax-qa
/dashboard/tax-calculator
/dashboard/consultations
/dashboard/appointments
/dashboard/history

/admin
```

## قانون

`/tax-qa` و `/tax-calculator` صفحات مستقل و Public Landing Page هستند.

Workspace واقعی و داده شخصی کاربر داخل Dashboard است.

Public Landing Page:
- قابل Crawl
- دارای Metadata
- دارای Structured Data مناسب
- دارای محتوای واقعی
- دارای Internal Linking
- بدون افشای داده شخصی

Private Workspace:
- Authenticated
- Noindex
- دارای Authorization Server-side
- دارای داده خصوصی

---

# 7. Mobile-First UI

اصل طراحی:

```text
Mobile -> Tablet -> Desktop -> Wide
```

نه Desktop کوچک‌شده.

## الزامات

- RTL
- Logo در بالا سمت راست
- Touch Target مناسب
- کمترین تایپ ممکن
- Progressive Disclosure
- فرم‌های کوتاه
- Quick Options / Chips برای Q&A
- Booking با کمترین مرحله
- Calculator با نمایش تدریجی Inputهای لازم
- Server Components به‌صورت پیش‌فرض
- Client Components فقط برای Interaction لازم
- Motion ظریف و هدفمند
- جلوگیری از CLS
- تصاویر Responsive
- AVIF/WebP در صورت مناسب بودن
- Preload فقط Asset بحرانی
- Lazy Load برای محتوای غیرضروری

## Visual Direction

- Black / Charcoal
- Warm Metallic Gold به‌عنوان Accent محدود
- Editorial / Luxury
- Typography قدرتمند
- فضای تنفسی
- بدون ظاهر Generic SaaS
- بدون افکت‌های سنگین و نمایشی

فونت اصلی باید یک Persian Font رسمی، خوانا و مناسب فضای اداری باشد. انتخاب نهایی فونت باید با License، Rendering، Performance و خوانایی واقعی روی موبایل بررسی شود.

---

# 8. SEO + GEO از روز اول

SEO یک مرحله پایانی نیست؛ Cross-Cutting Concern است.

GEO در این سند به دو معنی در نظر گرفته می‌شود:

1. Geographic / Local SEO
2. Generative Engine Optimization

## Technical SEO

- Canonical
- robots.txt
- sitemap.xml
- clean URL
- 301 redirects
- 404
- 410 در موارد لازم
- Open Graph
- metadata صحیح
- semantic HTML
- heading hierarchy
- image alt
- responsive images
- Core Web Vitals
- crawlability
- indexability
- duplicate prevention

## Structured Data

فقط بر اساس محتوای واقعی:

- Organization
- WebSite
- WebPage
- Article
- BreadcrumbList
- VideoObject
- FAQPage فقط در شرایط واقعی و مجاز
- Person در صورت وجود اطلاعات واقعی
- LocalBusiness فقط در صورت واجد شرایط بودن

Schema نباید برای Spam یا ادعای جعلی استفاده شود.

## SEO Content Architecture

```text
Topic
  |
  +-- Articles
  +-- Q&A
  +-- Tax Rules
  +-- Calculator
  +-- Consultation
```

هدف، ساخت Topic Authority واقعی است.

## ممنوع

- Keyword Stuffing
- Doorway Pages
- صفحات تکراری
- هزاران URL کم‌ارزش
- Fake Reviews
- Fake Schema
- AI Content بدون Review متخصص
- Hidden Text
- Cloaking
- خرید بک‌لینک بی‌کیفیت
- محتوای تولید انبوه بی‌ارزش

---

# 9. Tax Q&A — مهم‌ترین Domain

نام UX:

**پرسش و پاسخ مالیاتی**

نام معماری:

**Deterministic Tax Decision & Knowledge System**

100% بدون:

- AI
- LLM
- RAG
- Vector DB
- Embedding

## Pipeline

```text
User Question
 -> Unicode Normalization
 -> Persian/Arabic Digit Normalization
 -> Separator/Whitespace Normalization
 -> Topic/Intent Identification
 -> Decision Tree
 -> Conditions
 -> Knowledge Version Selection
 -> Approved Answer
```

## Progressive Clarification

به‌جای تلاش برای فهم تمام زبان طبیعی:

```text
کاربر:
«مالیات مغازه چطور محاسبه میشه؟»

سیستم:
شخص حقیقی هستید یا شرکت؟

-> نوع فعالیت
-> سال مالیاتی
-> شرایط لازم
-> Answer
```

اگر اطلاعات کافی نیست:

**سؤال بعدی لازم پرسیده شود.**

اگر مسیر معتبر وجود ندارد:

**حدس ممنوع.**

سیستم باید بگوید پاسخ قطعی تأییدشده در دانش موجود ندارد و در صورت مناسب بودن کاربر را به Consultation هدایت کند.

---

# 10. Knowledge Model

Knowledge و Tax Rule دو مفهوم جدا هستند.

## Knowledge

برای توضیح و پاسخ:

- content
- category
- source
- effective_from
- effective_to
- version
- status
- reviewed_at
- reviewed_by

Lifecycle:

```text
DRAFT
 -> REVIEW
 -> APPROVED
 -> PUBLISHED
 -> ARCHIVED
```

Published Content نباید Silent Overwrite شود.

---

# 11. Tax Rule Model

Tax Rule منطق اجرایی و حقوقی محاسبه است.

```text
Draft
 -> Review
 -> Approved
 -> Published
 -> Archived
```

Rule منتشرشده Immutable است.

تغییر:

```text
Old Published Rule
       |
       +-- remains immutable
       |
New Draft Version
       |
Review
       |
Publish
```

Historical Calculation باید همیشه به Rule Version خودش متصل بماند.

---

# 12. Tax Calculator

Login Required.

## Pipeline

```text
Select Tax Type
 -> Select Tax Year
 -> Select Taxpayer Type
 -> Required Conditions
 -> Relevant Inputs Only
 -> Normalize
 -> Validate
 -> Select Published Rule Version
 -> Deterministic Tax Engine
 -> Explain Result
 -> Save Calculation Snapshot
```

## Invariant اصلی

برای:

```text
same input
+
same rule version
+
same engine version
```

خروجی باید یکسان باشد.

## الزامات

- Decimal/Integer Exact Representation
- No Floating Point برای Tax Money
- Normalize Persian/Arabic Digits
- Normalize separators
- Explicit units
- Explicit currency
- Explain calculation
- Save input snapshot
- Save output
- Save rule version
- Save engine version
- Save calculation timestamp
- Save disclaimer

Tax Engine باید Pure تا حد امکان باشد.

---

# 13. Appointment / Consultation — Critical Concurrency Domain

## قانون طلایی

UI selection هرگز Reservation نیست.

Correct:

```text
Available Slot
 -> User Selects
 -> Server Atomic Reservation Attempt
 -> Transaction + DB Constraint
 -> Success OR Conflict
```

## Double Booking

هرگز:

```text
SELECT availability
IF available
INSERT booking
```

به‌تنهایی مجاز نیست.

باید Transaction + Constraint داشته باشیم.

## Concurrency Test

اگر N درخواست همزمان برای یک Slot برسد:

```text
Exactly 1 Success
N-1 Conflicts
```

## HELD State

فقط اگر UX یا Payment Flow واقعاً نیاز داشته باشد.

اگر Flow کوتاه است:

```text
AVAILABLE -> BOOKED
```

از HELD غیرضروری استفاده نکنید.

اگر HELD اضافه شد:
- expiry
- cleanup
- conflict semantics
- race handling
باید دقیقاً تعریف شود.

## Appointment State Machine

```text
REQUESTED
 -> CONFIRMED
 -> COMPLETED

REQUESTED/CONFIRMED
 -> CANCELLED
```

Transitionهای نامعتبر باید Reject شوند.

---

# 14. Payment

هیچ Online Gateway وجود ندارد.

Payment یک Domain جدا از Consultation باشد.

نمونه Status:

```text
PENDING
CONFIRMED
REJECTED
```

Admin Confirmation:
- Authorization
- Validation
- Transaction
- Audit

هیچ Fake Payment وجود ندارد.

---

# 15. Authentication

Phone + OTP Only.

بدون:
- Password
- Username
- Email Requirement
- Social Login

## OTP

- expiration
- attempt limit
- one-time use
- atomic consume
- anti-replay
- rate limiting
- account enumeration resistance
- hashed/HMACed representation
- عدم ذخیره plaintext OTP
- عدم Logging OTP

Rate Limit حداقل بر اساس:
- IP
- Phone
- Provider / Global quota

## Session

پس از OTP موفق:

- Secure
- HttpOnly
- SameSite مناسب
- Expiration
- Revocation
- Rotation در صورت نیاز

کاربر نباید هر بار OTP بزند.

---

# 16. Authorization

هر Request حساس:

```text
Authenticated?
 -> Authorized?
 -> Resource Owner?
 -> Action Allowed?
 -> Execute
```

Never trust:
- hidden fields
- client state
- route parameters
- browser controls
- UI visibility

Admin authorization همیشه Server-side.

---

# 17. Database Principles

PostgreSQL Source of Truth است.

Business Invariant:

```text
Business Invariant
 -> Domain Model
 -> State Transition
 -> Data Model
 -> DB Constraint
 -> Application Logic
 -> Test
```

نمونه Invariants:

- One confirmed booking per slot
- User reads only own calculations
- Published tax rule immutable
- Invalid appointment transitions rejected
- Duplicate sensitive side effect prevented

## Time

- canonical timezone-aware timestamps
- Jalali فقط در UI / Boundary
- Domain Storage مخلوط Gregorian/Jalali نباشد

## Money

- exact numeric/integer representation
- no float
- unit/currency semantics explicit

---

# 18. Data Model — Conceptual

```text
users
sessions
otp_challenges

consultations
appointments
payments

tax_rules
tax_rule_versions
tax_calculations

knowledge_articles
knowledge_versions

articles
videos
mini_books
media

homepage_sections
homepage_slides

audit_logs
```

Schema واقعی باید از Invariantها استخراج شود، نه صرفاً از UI.

---

# 19. Content / CMS

Content Lifecycle:

```text
DRAFT
 -> PREVIEW
 -> PUBLISHED
 -> ARCHIVED
```

No arbitrary HTML/React.

Content باید Structured و Typed باشد.

No Generic Page Builder.

## Homepage

- Hero
- 7-second Slider
- Services
- Featured Article
- Featured Video
- CTA
- About

Slider:

- order
- image
- title
- description
- link
- active
- timing

First slide critical asset است؛ سایر Slideها lazy load شوند.

---

# 20. Video / Mini Book

## Video

Player:
- Play/Pause
- Seek
- Volume
- Fullscreen

No Download Button.

اما:

**نبودن Download Button به معنی جلوگیری قطعی از Extraction نیست.**

DRM فقط در صورت Requirement واقعی اضافه شود.

## Mini Book

- Online Viewer
- No Download Button

DRM فقط در صورت Requirement واقعی.

---

# 21. Admin

در شروع فقط:

```text
ADMIN
```

Complex RBAC ممنوع مگر Requirement واقعی.

Admin می‌تواند:

- Homepage
- Slider
- Consultation Availability
- Manual Payment
- Tax Rules
- Knowledge
- Articles
- Videos
- Mini Books
- Media
- Publish / Archive
- Audit

تمام عملیات حساس:
```text
Authorize
 -> Validate
 -> Transaction
 -> Audit
```

---

# 22. Audit Logging

Auditability != Log Everything.

Audit برای:

- Tax Rule Publish / Update
- Knowledge Publish
- Payment Confirmation
- Appointment Modification
- Admin/Security Changes

Fields:

- actor
- action
- entity
- entity_id
- timestamp
- metadata
- before/after در موارد لازم

ممنوع:

- OTP
- Password
- Secrets
- Token
- PII غیرضروری

---

# 23. Security Standard

Baseline:

**OWASP ASVS 5.0.0**

Security باید:

```text
Requirement
 -> Implementation
 -> Test
 -> Evidence
```

را طی کند.

محورها:

- Authentication
- Authorization
- Session
- Input Validation
- Output Encoding
- Injection Prevention
- Cryptography
- Error Handling
- Logging
- Data Protection
- API Security
- File Handling
- Configuration
- Rate Limiting

---

# 24. File Security

برای Upload:

- AuthZ
- Size Limit
- Type Validation
- Content Validation
- Safe Storage
- Metadata Validation
- Untrusted Filename
- Untrusted MIME

Browser metadata هرگز Trusted نیست.

---

# 25. Observability

حداقل:

- Structured Logs
- Request ID
- Error Tracking
- Latency
- HTTP Status
- Auth/Security Events
- Critical Domain Events

No Distributed Tracing System مگر Need واقعی.

No Sensitive Logging.

---

# 26. Backup / Recovery

Backup کافی نیست.

الزام:

```text
Backup
 -> Restore
 -> Integrity Check
 -> App Start
 -> Critical Queries
 -> Evidence
```

Backup باید Offsite باشد.

Restore Test باید دوره‌ای و مستند باشد.

---

# 27. Deployment

Production باید Reproducible باشد:

```text
Build
 -> Migration
 -> Verification
 -> Deploy
 -> Health Check
 -> Ready
```

Rollback Strategy از قبل تعریف شود.

No:
- SSH Manual Fixes as normal deployment
- undocumented server state
- environment drift

---

# 28. Migration Safety

برای تغییرات حساس:

```text
Expand
 -> Migrate
 -> Verify
 -> Contract
```

Migration بزرگ و پرریسک باید Impact Analysis داشته باشد.

---

# 29. API / Server Interaction

REST به‌صورت پیش‌فرض فقط به دلیل عادت ساخته نشود.

برای Internal Operations در صورت مناسب بودن:

- Server Actions
- Server-side Use Cases

برای HTTP Boundary واقعی:

- Route Handlers

No tRPC.
No GraphQL.

---

# 30. Testing Strategy

## Unit

Tax Engine:
- deterministic
- boundary
- regression
- version
- exact money
- invalid inputs

Decision Tree:
```text
Input
 -> Expected Path
 -> Expected Answer
```

## Integration

- Database constraints
- Transactions
- Authorization
- OTP
- Tax persistence
- Appointment concurrency

## E2E

Critical Paths:

1. Login -> Q&A
2. Login -> Calculator
3. Login -> Booking
4. Admin -> Publish Tax Rule
5. Admin -> Confirm Payment

## Concurrency

برای Slot مشترک:
- N concurrent requests
- exactly one booking
- all others conflict
- no duplicate appointment

---

# 31. Performance

Performance Budget تعریف شود و در CI/Review قابل اندازه‌گیری باشد.

تمرکز:

- LCP
- INP
- CLS
- TTFB
- JS shipped
- Image weight

Mobile/weak network testing اجباری است.

اصل:

**Client JS یک Cost است.**

هر Client Component باید دلیل مشخص داشته باشد.

---

# 32. Advanced Proven Techniques

## 32.1 Progressive Clarification

به‌جای Natural Language Parsing پیچیده، سؤال را به Decisionهای قابل‌تست تبدیل کنید.

## 32.2 Immutable Published Versions

Published Rule/Knowledge را overwrite نکنید.

## 32.3 DB-Enforced Invariants

هر invariant حیاتی را تا جای ممکن به Constraint تبدیل کنید.

## 32.4 Idempotency

فقط جایی اضافه شود که تکرار Request بتواند Side Effect تکراری ایجاد کند.

## 32.5 State Machines

برای:
- Appointment
- Payment
- Content
- Tax Rule
- Knowledge

Transitionهای صریح بسازید.

## 32.6 Measure Before Cache

اول Measurement، سپس Cache.

## 32.7 PostgreSQL Before Search Infrastructure

برای Search معمولی ابتدا قابلیت‌های PostgreSQL را بررسی کنید. Elasticsearch/OpenSearch فقط با Need اثبات‌شده.

## 32.8 Duplication Before Abstraction

دو قطعه مشابه لزوماً دلیل ساخت Framework نیست.

## 32.9 Requirement Traceability

هر Requirement مهم:

```text
Requirement
 -> Design
 -> Implementation
 -> Test
 -> Evidence
```

## 32.10 ADR

برای تصمیم‌های معماری:

- Context
- Decision
- Why
- Alternatives Rejected
- Consequences

ADRهای اولیه:

```text
ADR-001 Modular Monolith
ADR-002 PostgreSQL as Source of Truth
ADR-003 No AI
ADR-004 Deterministic Tax Engine
ADR-005 Versioned Tax Rules
ADR-006 Atomic Appointment Reservation
ADR-007 OTP-only Authentication
ADR-008 Mobile-first
ADR-009 No Generic Rule Engine
ADR-010 Public SEO Landing vs Private Workspace
```

---

# 33. اشتباهات رایج که مطلقاً نباید تکرار شوند

1. شروع از UI و ساختن Domain بعداً.
2. اعتماد به Client برای Authorization.
3. SELECT سپس INSERT برای Reservation بدون Constraint.
4. استفاده از Float برای پول.
5. Overwrite کردن Tax Rule منتشرشده.
6. قرار دادن Tax Logic داخل React Component.
7. ساخت Generic Rule Engine پیش از شناخت Domain.
8. استفاده از Redis به‌عنوان Source of Truth.
9. Cache کردن همه چیز بدون Measurement.
10. Microservice کردن یک محصول کوچک.
11. ایجاد Repository/Service Layerهای تشریفاتی.
12. افزودن Library فقط برای یک Helper کوچک.
13. استفاده از `latest` در Dependency/Deployment.
14. Logging بیش‌ازحد PII.
15. ذخیره OTP به‌صورت Plaintext.
16. ساخت FAQ/SEO برای موتور جستجو به‌جای کاربر.
17. تولید انبوه محتوای کم‌ارزش.
18. Schema Markup جعلی.
19. Desktop-first و سپس کوچک‌کردن برای Mobile.
20. ارسال JavaScript غیرضروری.
21. استفاده از Animation سنگین.
22. ساخت APIهای عمومی بدون Requirement.
23. قرار دادن Secret در Source.
24. Migration بدون Rollback/Impact Plan.
25. Backup بدون Restore Test.
26. E2E فقط برای Happy Path.
27. نداشتن Concurrency Test.
28. نداشتن Error/Empty/Unauthorized/Forbidden UI.
29. مخفی کردن Bug با Fallback جعلی.
30. باقی گذاشتن TODO در Critical Path.
31. افزودن Feature برای نمایش قدرت تکنولوژی.
32. طراحی دو UI جداگانه برای Mobile و Desktop.
33. تلاش برای فهم تمام Persian Natural Language در Q&A.
34. تولید پاسخ مالیاتی در صورت نبودن مسیر معتبر.
35. ادعای جلوگیری از Download صرفاً با حذف دکمه Download.

---

# 34. میان‌برهای حرفه‌ای

این‌ها Shortcut به معنی حذف مهندسی نیستند؛ مسیر رسیدن سریع‌تر به کیفیت هستند.

### Shortcut 1
قبل از ساخت UI، Invariantها را بنویس.

### Shortcut 2
هر عملیات حساس را ابتدا به State Transition تبدیل کن.

### Shortcut 3
برای Tax ابتدا چند Rule واقعی را دقیق مدل کن، سپس abstraction بساز.

### Shortcut 4
برای Booking ابتدا یک Slot را تحت Load همزمان تست کن؛ بعد UI را توسعه بده.

### Shortcut 5
Server Components را Default کن؛ Client را Exception بدان.

### Shortcut 6
به‌جای Cache گسترده، Query و Index صحیح بساز.

### Shortcut 7
به‌جای Search Engine خارجی، ابتدا PostgreSQL FTS را ارزیابی کن.

### Shortcut 8
به‌جای ساخت Framework داخلی، Code Duplication محدود را تحمل کن.

### Shortcut 9
Critical Flowها را زود E2E کن.

### Shortcut 10
هر Migration مهم را قبل از Production روی Dataset واقعی‌نما تمرین کن.

---

# 35. Error Semantics

خطاها باید Machine-readable و User-safe باشند.

دسته‌ها:

```text
VALIDATION_ERROR
UNAUTHENTICATED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
DOMAIN_ERROR
INTERNAL_ERROR
```

User نباید Stack Trace یا Internal Details ببیند.

Conflict مخصوص Booking باید UX واضح داشته باشد:

> این زمان هم‌اکنون توسط کاربر دیگری رزرو شد. لطفاً زمان دیگری انتخاب کنید.

---

# 36. UI State Contract

هر صفحه/Mutation مهم باید حالات لازم را داشته باشد:

- Loading
- Empty
- Error
- Retry
- Unauthorized
- Forbidden
- Not Found
- Validation Error
- Server Error
- Pending
- Success
- Failure
- Conflict

Happy Path تنها حالت قابل قبول نیست.

---

# 37. Agent Coding Protocol

Coding Agent قبل از هر تغییر باید:

1. Requirement را شناسایی کند.
2. Scope را بررسی کند.
3. Invariantهای مرتبط را پیدا کند.
4. Architecture Boundary را بررسی کند.
5. Existing Code را inspect کند.
6. ساده‌ترین طراحی سازگار را انتخاب کند.
7. Security Impact را بررسی کند.
8. Data Integrity Impact را بررسی کند.
9. Test Plan را مشخص کند.
10. تغییر را کوچک و متمرکز انجام دهد.
11. Test اجرا کند.
12. Build/Typecheck/Lint را اجرا کند.
13. Evidence نتیجه را ثبت کند.
14. تغییرات Scope را گزارش کند.

## Agent نباید

- بدون بررسی Repository ساختار جدید اختراع کند.
- API جدید بسازد فقط چون راحت‌تر است.
- Dependency جدید اضافه کند بدون ضرورت.
- Business Rule را حدس بزند.
- قانون مالیاتی را از حافظه تولید کند.
- Constraint دیتابیس را با UI جایگزین کند.
- Test را برای سریع‌تر تمام کردن حذف کند.
- Error را swallow کند.
- `any` را برای فرار از Type System استفاده کند.
- TODO را به‌عنوان completion قبول کند.
- Mock را وارد Production Path کند.

---

# 38. Definition of Done

هیچ Task مهمی Done نیست مگر:

```text
Requirement Clear
AND
Implementation Complete
AND
Typecheck Pass
AND
Lint Pass
AND
Relevant Tests Pass
AND
Security Considered
AND
Data Integrity Considered
AND
Observability Considered
AND
No Critical TODO
AND
No Mock/Fake Production Path
```

برای Critical Domainها علاوه بر موارد بالا:

```text
Concurrency / Boundary / Regression
```

نیز باید بررسی شده باشد.

---

# 39. ترتیب توسعه تا Production

## Phase 01 — Engineering Foundation

- Repository setup
- TypeScript strict
- lint/format
- CI
- environment strategy
- Docker
- basic observability
- coding conventions
- ADR structure

**Output:** Build/Test/CI Foundation

---

## Phase 02 — Domain Invariants + Database

- Domain entities
- State machines
- Invariants
- Schema
- Constraints
- Indexes
- Migration strategy

**Output:** Verified Database Foundation

---

## Phase 03 — Identity + Security

- Better Auth
- Phone OTP
- Redis OTP/RL
- Session
- Authorization
- Security errors
- audit foundations

**Output:** Secure Authentication/Authorization

---

## Phase 04 — Tax Domain Foundation

- Tax Types
- Tax Years
- Rule model
- Versioning
- Source
- effective dates
- lifecycle

**Output:** Versioned Tax Domain

---

## Phase 05 — Knowledge Decision Tree

- Knowledge model
- Decision nodes
- progressive clarification
- normalization
- answer versioning
- fallback/escalation

**Output:** Deterministic Q&A Engine

---

## Phase 06 — Tax Calculator

- Input schemas
- normalization
- exact money
- calculation engine
- rule selection
- explanation
- snapshots
- version tests

**Output:** Reproducible Tax Calculator

---

## Phase 07 — Q&A Product

- Public landing page
- authenticated workspace
- quick options
- decision flow
- history
- errors

**Output:** Production Q&A

---

## Phase 08 — Appointment Engine

- Slot model
- availability
- atomic booking
- constraints
- state transitions
- cancellation
- concurrency testing

**Output:** Double-booking-safe Reservation Engine

---

## Phase 09 — Consultation

- services
- duration
- availability
- booking policy
- manual payment model
- confirmation

**Output:** Consultation Product

---

## Phase 10 — Design System

- Typography
- RTL
- Logo
- spacing
- components
- responsive rules
- states
- accessibility baseline

**Output:** Unified Visual System

---

## Phase 11 — Public Website

- Home
- Articles
- Videos
- Mini Books
- About
- Q&A landing
- Calculator landing
- Consultation landing

**Output:** Public Web Experience

---

## Phase 12 — Content/Admin

- CMS workflows
- media
- homepage
- articles
- videos
- books
- knowledge
- tax rules
- audit

**Output:** Admin Control Plane

---

## Phase 13 — User Dashboard

- Q&A
- Calculator
- Appointments
- Consultation
- History

**Output:** Private User Area

---

## Phase 14 — SEO/GEO Hardening

- Metadata
- Canonicals
- Sitemap
- robots
- Structured Data
- Breadcrumbs
- internal links
- topic architecture
- freshness
- Local SEO where applicable
- Generative-search-friendly content structure

**Output:** Search-ready Site

---

## Phase 15 — Security / Concurrency / Regression

- OWASP ASVS review
- auth abuse tests
- authorization tests
- OTP replay tests
- rate-limit tests
- booking concurrency
- tax regression
- content authorization
- file security
- dependency audit

**Output:** Security Evidence

---

## Phase 16 — Production Readiness

- performance
- real mobile testing
- migration rehearsal
- backup
- restore
- health checks
- logging
- error tracking
- rollback
- production config
- secrets
- disaster scenarios

**Output:** Production Readiness Evidence

---

## Phase 17 — Production

```text
Final Verification
 -> Migration
 -> Deploy
 -> Health Check
 -> Smoke Test
 -> Monitor
 -> Evidence
```

Rollback must be executable.

---

# 40. Production Readiness Gate

Before Production:

```text
[ ] Requirements complete
[ ] Scope frozen
[ ] Domain invariants defined
[ ] DB constraints verified
[ ] Authorization verified
[ ] OTP security verified
[ ] Tax Engine tested
[ ] Tax versioning tested
[ ] Q&A decision tree tested
[ ] Appointment concurrency tested
[ ] Payment audit tested
[ ] E2E critical flows passed
[ ] Migration verified
[ ] Backup verified
[ ] Restore verified
[ ] Logging verified
[ ] Error tracking verified
[ ] Health checks verified
[ ] Dependency audit passed
[ ] Performance budget reviewed
[ ] Mobile testing passed
[ ] SEO technical checks passed
[ ] Structured data validated
[ ] No mock/demo path
[ ] No fake business logic
[ ] No critical TODO
[ ] Rollback plan verified
[ ] Production configuration reviewed
```

---

# 41. Expected Final Output

محصول نهایی باید:

### از نظر Product

- شیک
- سبک
- سریع
- حرفه‌ای
- Mobile-First
- کاملاً Responsive
- RTL
- قابل اعتماد
- ساده و کم‌اصطکاک

### از نظر Tax

- Deterministic
- Versioned
- Reproducible
- Explainable
- Auditable
- بدون AI
- بدون Guess

### از نظر Booking

- Atomic
- Concurrency-safe
- بدون Double Booking
- دارای State Machine

### از نظر Security

- OWASP ASVS-oriented
- Secure OTP
- Secure Session
- Server-side Authorization
- Rate Limited
- Auditable

### از نظر SEO/GEO

- Crawlable
- Indexable
- Structured
- Topic-oriented
- Source-aware
- Freshness-aware
- Fast
- Mobile-first
- بدون SEO Spam

### از نظر Operations

- Reproducible Deployment
- Tested Migrations
- Backup + Restore Evidence
- Structured Observability
- Rollback Strategy

---

# 42. Final Architectural Rule

اگر یک تصمیم جدید پیشنهاد شد، Agent باید این ترتیب را طی کند:

```text
Does a real requirement exist?
        |
       YES
        |
Can current architecture solve it simply?
        |
   +----+----+
  YES       NO
   |         |
Use current  Evaluate smallest
architecture viable extension
             |
       Record ADR if architectural
       consequence exists
```

**پیچیدگی، نشانه Production-Grade بودن نیست.**

Production-Grade یعنی:

> Correctness + Security + Integrity + Testability + Observability + Recoverability + Maintainability + Verifiability

و اصل نهایی پروژه:

# «قدرت از سادگی میاد.»

این سند باید مبنای تمام تصمیم‌های مهندسی آیان تراز باشد.
