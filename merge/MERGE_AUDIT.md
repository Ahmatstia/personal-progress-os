# MYLIFE x MYPROGRESS — PHASE 0 AUDIT

> Generated: 2026-09-04 | Phase 0 — Read-Only Audit. No modifications to either project.

---

## 1. EXECUTIVE SUMMARY

Projects audited:
- `D:\IT\web\merge\mylife` — **MyLife (Legacy)**
- `D:\IT\web\merge\MyProgres` — **MyProgress (Foundation)**

**Verdict:** MyProgress is the correct technical foundation for the future MyLife product. It is a mature, well-tested, securely designed single-user personal progress OS (PostgreSQL, HMAC session auth, deterministic NLP AI with adversarial test coverage, Docker deployment). MyLife (Legacy) is a larger schema-heavy early-implementation project with ambitious domain modeling and genuinely unique service logic (conflict detection, life health score, unified inbox, notification engine), but lacks tests, has configuration bugs, exposes a plaintext database password, and has only a keyword-matching assistant instead of a real AI system.

**Strategy:** Keep MyProgress as the technical foundation. Extract valuable MyLife domain concepts (Area, Project, Milestone, CalendarEvent, Activity, Notification, Life Health, Conflict Detection, Unified Inbox, Smart Priority) and rebuild them on top of MyProgress. Discard MyLife auth, MyLife AI assistant, and MyLife test infrastructure.

---

## 2. PROJECTS AUDITED

| Property | MyLife (Legacy) | MyProgress (Foundation) |
|---|---|---|
| Path | `D:\IT\web\merge\mylife` | `D:\IT\web\merge\MyProgres` |
| Package name | `mylife` | `personal-progress-os` |
| Version | `0.1.0` | `1.0.0` |
| README | Boilerplate create-next-app README | Full production docs |
| Blueprint | MYLIFE_SYSTEM_BLUEPRINT.md (40KB) | PHASE_UI_UX_REDESIGN_FINAL_REPORT.md, DEPLOY.md |
| Languages | TypeScript | TypeScript + Python (NLP) |
| Modified | NO | NO |

---

## 3. MYLIFE LEGACY ARCHITECTURE

### 3.1 Structure

```
mylife/
+-- app/                        # Next.js App Router
|   +-- (auth)/login/
|   +-- (dashboard)/            # 18 feature pages
|   |   activities, areas, assistant, calendar, career, conflicts,
|   |   daily-plan, dashboard, education, goals, inbox, learning,
|   |   life-health, notifications, projects, settings, tasks, weekly-review
|   +-- api/                    # 25 API route groups
+-- auth.ts                     # NextAuth v5 (full node)
+-- middleware.ts               # NextAuth edge middleware
+-- components/layout/ + ui/    # 5 UI primitives only
+-- features/                   # EMPTY (.gitkeep only)
+-- lib/
|   +-- api-helpers.ts          # withErrorHandling, ok(), created(), noContent()
|   +-- errors/index.ts         # Full AppError hierarchy
+-- server/
|   +-- repositories/           # 25 repository files
|   +-- services/               # 41 service files
+-- prisma/schema.prisma        # 1104 lines, 7 migrations, 29+ models, 27 enums
+-- tests/unit/                 # 27 unit tests (no security tests, uses dev.db)
```

### 3.2 Architecture Pattern

```
Next.js Page/API Route
  -> withErrorHandling + getAuthUserId (lib/api-helpers.ts)
  -> server/services/*.service.ts
  -> server/repositories/*.repository.ts
  -> lib/db (Prisma + better-sqlite3)
```

Clean, disciplined layered architecture — the strongest design aspect of MyLife.

### 3.3 Notable Services

| Service | Purpose | Size |
|---|---|---|
| conflict-detection.service.ts | Calendar collisions, overbooking, deadline clusters | 242 lines |
| daily-plan.service.ts | Intelligent daily planning with workload tiers | 302 lines |
| unified-inbox.service.ts | Aggregates overdue tasks, events, project deadlines | 285 lines |
| life-health.service.ts | Life Management Health Score (0-100) with 6 subscores | 163 lines |
| notification.service.ts | Proactive notification generation with deduplication | 205 lines |
| smart-priority.service.ts | Deterministic task priority scoring with explanations | 162 lines |
| progress.service.ts | Cascading: Task -> Milestone -> Project -> Objective -> Goal | 124 lines |
| life-assistant.service.ts | NL query processing (keyword-only, read-only) | 308 lines |

---

## 4. MYPROGRESS ARCHITECTURE

### 4.1 Structure

```
MyProgres/
+-- src/
|   +-- ai/                     # Full AI command system (37 intents)
|   |   classifier.ts, command-types.ts, entities.ts, intents.ts
|   |   normalization.ts, router.ts, safety.ts
|   |   context/ (context-resolver.ts, conversation-state.ts)
|   |   corpus/ (NLP training corpus)
|   |   planner/decision-engine.ts
|   |   resolver/entity-resolver.ts
|   |   tools/ (goal, stage, task, session, focus, review, analytics)
|   +-- app/
|   |   +-- (app)/              # 5 complete pages
|   |   +-- api/                # 10 API route groups
|   |   +-- components/         # Rich component library (17+ files)
|   |       AICommandPanel.tsx (12KB), GoalActionsMenu.tsx (12KB),
|   |       TaskItem.tsx (10KB), shell/AppShell.tsx (10KB)
|   +-- lib/
|   |   auth.ts (Custom HMAC session), ownership.ts, prisma.ts
|   +-- repositories/           # 7 repositories
|   +-- schemas/                # 10 Zod schemas
|   +-- services/               # 15 services
+-- nlp/                        # Python NLP pipeline
|   evaluate.py, train_transformer.py, data/corpus_v1/v2/v3.json
+-- tests/                      # 22+ test files (security, IDOR, AI, service)
+-- Dockerfile, docker-compose.yml
+-- prisma/schema.prisma        # 160 lines (PostgreSQL)
```

### 4.2 Architecture Pattern

```
Next.js Page (Server Component, force-dynamic)
  -> src/services/*.service.ts
  -> src/repositories/*.repository.ts
  -> src/lib/prisma.ts (PostgreSQL)

API Route:
  -> requireCurrentUser(request)
  -> Zod schema safeParse
  -> service -> repository -> database
```

### 4.3 Security Infrastructure

- Custom HMAC-SHA256 session tokens (no external library)
- Token format: `userId.expires.HMAC(userId.expires, secret)`
- Fail-closed: missing AUTH_SECRET -> 401; missing AUTH_ACCESS_CODE -> 503
- `timingSafeEqual` prevents timing attacks
- Login rate limiting: 10 attempts / 15 min per IP (in-memory)
- `requireOwnership<T>()`: returns 404 for cross-user resource access
- AI write protection: HMAC confirmation tokens (intent+userId+TTL+argHash)
- `poweredByHeader: false` in next.config.ts

---

## 5. TECHNOLOGY COMPARISON

| Dimension | MyLife (Legacy) | MyProgress (Foundation) |
|---|---|---|
| Framework | Next.js 16.3.3 | Next.js 16.3.4 |
| Auth | NextAuth v5 (JWT + bcrypt) | Custom HMAC session (no library) |
| Database | SQLite (local file) | PostgreSQL (Supabase) |
| ORM | Prisma 7.10.0 (SQLite adapter) | Prisma 7.10.0 (pg adapter) |
| Validation | Zod 4.5.4 | Zod 4.5.4 |
| Testing | Vitest (27 tests, shares dev.db) | Vitest (22+ tests, isolated temp DB) |
| Styling | Tailwind v4 + Stitch design system | Tailwind v4 + custom warm-canvas tokens |
| Charts | recharts | Custom AnalyticsBars.tsx |
| Date lib | date-fns v4 | Custom inline functions |
| AI | Keyword matching (read-only) | Deterministic NLP (37 intents, HMAC writes) |
| Python | None | NLP training/evaluation pipeline |
| Docker | None | Dockerfile + docker-compose.yml |
| Error handling | Full AppError hierarchy | AuthorizationError only |
| Rate limiting | NOT FOUND | Login: 10/15min per IP |

---

## 6. DATABASE COMPARISON

### 6.1 MyProgress Database (PostgreSQL / Supabase)

> **CRITICAL:** Password in plaintext in `.env` — see Section 14 Bug P0-1.

**Models (8):** User, Goal (name/String), Stage, Task (estimatedHours/actualHours), Session (understanding/obstacle/nextAction), Review, DailyFocus, Capture

**Hierarchy:** Goal -> Stage -> Task -> Session (clean linear)

**Weakness:** All status/type/priority fields are `String` — no database-level type safety.

### 6.2 MyLife Database (SQLite / better-sqlite3)

**Models (29+) by phase:**

| Phase | Models |
|---|---|
| 0 (Auth) | User |
| 1 (Core) | Area, Goal, Objective, Project, Milestone, Task, TaskDependency |
| 2 (Time) | CalendarEvent, Activity |
| 3 (Education) | Institution, AcademicPeriod, Course, CourseSchedule, Assignment, Exam |
| 4 (Learning/Career) | Skill, LearningTrack, LearningResource, Company, Position, CareerResponsibility, CareerOpportunity, CareerInterview |
| 5 (Review) | WeeklyReview |
| 7 (Notify) | Notification, UserPreference |

**27 typed enums** for all status/priority/type fields.

**Hierarchy:** Area -> Goal -> [Objective | Project -> Milestone -> Task] with CalendarEvent, Activity, WeeklyReview cross-cutting.

### 6.3 Comparison Summary

| Dimension | MyProgress | MyLife |
|---|---|---|
| Engine | PostgreSQL (Supabase) | SQLite (local file) |
| Schema lines | 160 | 1104 |
| Models | 8 | 29+ |
| Enums | 0 (all String) | 27 typed enums |
| DB type safety | LOW | HIGH |
| Migrations | 3 | 7 |
| Hierarchy depth | 4 levels | 6 levels |

### 6.4 Unified DB Requirements

**KEEP from MyProgress:** User, Goal, Stage, Task, Session, Review, DailyFocus, Capture

**REBUILD from MyLife (Phase A):**
- Area (life domain classification)
- Project + Milestone (structured execution)
- Objective (OKR-style goal measurement)
- CalendarEvent + Activity (time management)
- Notification + UserPreference (proactive OS)

**DEFER (persona-specific):**
- Education: Institution, AcademicPeriod, Course, CourseSchedule, Assignment, Exam
- Learning: Skill, LearningTrack, LearningResource
- Career: Company, Position, CareerResponsibility, CareerOpportunity, CareerInterview

**Key insight:** Future schema must use typed enums throughout (MyLife pattern), replacing MyProgress String fields.

---

## 7. DOMAIN MODEL COMPARISON

### 7.1 MyProgress Domain

```
Goal (Learning-focused, all String fields)
  -> Stage (ordered phase)
     -> Task (work item with time tracking)
        -> Session (focus: understanding/obstacle/nextAction)

Cross-cutting: DailyFocus, Review, Capture, AI (37-intent system)
Product cycle: ORIENT -> DECIDE -> DO -> REVIEW -> IMPROVE
```

### 7.2 MyLife Domain

```
Area (life domain: Career, Personal, Learning, etc.)
  -> Goal (typed enums, progress cache, priority)
     -> Objective (OKR: targetMetric, targetValue, currentValue)
     -> Project (deadline, progress)
        -> Milestone (ordered checkpoints)
        -> Task (6 FK: area+goal+milestone+project+objective+stage, N:M deps)

CalendarEvent <-> Task/Project/Goal (time blocking)
Activity <-> Task/Project/Goal/Area (actual time log)
WeeklyReview (per user per week)
Notification + UserPreference (proactive OS)
Modules: Education, Learning, Career
```

### 7.3 Domain Classification

| Domain | Recommendation | Reason |
|---|---|---|
| Area | ADAPT | High value; add life area classification |
| Goal (richer) | ADAPT | Richer enums; rename name->title |
| Objective (OKR) | REBUILD | No equivalent in MyProgress |
| Project + Milestone | REBUILD | Complementary to Stage, not conflicting |
| Task (complex) | ADAPT | Merge with MyProgress Task; keep Session |
| TaskDependency | DEFER | Complex; defer until core stable |
| CalendarEvent | REBUILD | No equivalent in MyProgress |
| Activity | REBUILD | Complements Session |
| WeeklyReview | ADAPT | Extend existing Review model |
| Capture | KEEP | Already in MyProgress |
| DailyFocus | KEEP | Already in MyProgress |
| Notification + Prefs | REBUILD | No equivalent; high value |
| Education module | DEFER | Persona-specific |
| Learning module | DEFER | Persona-specific |
| Career module | DEFER | Persona-specific |
| Life Health Score | REBUILD | Unique; no equivalent |
| Conflict Detection | REBUILD | Unique; rebuild after CalendarEvent |
| Unified Inbox | REBUILD | Aggregation; rebuild after core stable |
| Smart Priority | REBUILD | Deterministic; easily portable |
| MyLife AI assistant | DISCARD | Keyword-only; inferior |
| MyProgress AI | KEEP (FROZEN) | Superior; do not touch during migration |

---

## 8. AUTHENTICATION & SECURITY

### 8.1 MyProgress Security

**Auth:** Custom HMAC-SHA256 (no library). Token: `userId.expires.HMAC(userId.expires, secret)`

**Verified security tests:**
- `security.test.ts`: Token integrity (altered userId, tampered sig, expired, ghost user)
- `idor.security.test.ts`: Cross-user read/write/delete prevention (unit)
- `idor.http.integration.test.ts`: HTTP-level IDOR at actual API routes
- AI: cannot execute write without server-issued confirmation token

### 8.2 MyLife Security

**Auth:** NextAuth v5 JWT + bcrypt. Standard middleware protects `/dashboard/:path*` only.

**Gaps:** No rate limiting, no IDOR test coverage, tests share dev.db, no security test files.

### 8.3 Security Comparison

| Property | MyProgress | MyLife |
|---|---|---|
| Auth type | Custom HMAC | NextAuth v5 JWT |
| Rate limiting | YES (10/15min per IP) | NOT FOUND |
| IDOR protection | YES (tested unit + HTTP) | Implemented, NOT tested |
| Fail-closed | YES (enforced) | Partial (NextAuth defaults) |
| Token tampering test | YES | NOT FOUND |
| AI write protection | YES (HMAC tokens) | N/A |
| Test DB isolation | YES (temp DB) | NO (uses dev.db) |

> **P0:** `MyProgres/.env` contains Supabase connection URL with plaintext password. Rotate immediately.

**Recommendation:** MyProgress auth must be the foundation. Battle-tested, fail-closed, rate-limited, HMAC AI tokens.

---

## 9. API COMPARISON

### 9.1 MyProgress (10 route groups)

| Route | Auth |
|---|---|
| `/api/auth` | Public |
| `/api/today`, `/api/analytics`, `/api/reviews` | Session |
| `/api/goals`, `/api/goals/[id]`, `/api/stages/[id]`, `/api/tasks/[id]`, `/api/sessions/[id]`, `/api/captures/[id]` | Session + ownership |
| `/api/ai/command` | Session + HMAC confirmation |

**Format:** Inconsistent (raw Prisma vs `{success, data}`)
**Strengths:** Consistent auth, IDOR tested, AI HMAC guard
**Weaknesses:** Mixed response format

### 9.2 MyLife (25 route groups)

Key groups: goals, tasks, areas, projects, milestones, objectives, calendar-events, activities, daily-plan, weekly-review, inbox, conflicts, life-health, recommendations, notifications, priorities, assistant, export, import, education/*, learning/*, career/*

**Format:** Standardized via `withErrorHandling() + ok() / created() / noContent()`
**Error handling:** Full AppError hierarchy (ValidationError, NotFoundError, ForbiddenError, UnauthorizedError, ConflictError, InternalError)
**Weaknesses:** No rate limiting, no IDOR tests, keyword-only AI

**Recommendation:** Adopt **MyLife API response pattern** (withErrorHandling + ok/created + AppError hierarchy) on top of **MyProgress authentication**.

---

## 10. FRONTEND & UX COMPARISON

### 10.1 MyProgress UI

**Design:** Tailwind v4 warm-canvas (HSL off-white), indigo/violet primary (CSS 435 lines, 13KB)
**Components:** AICommandPanel (12KB), GoalActionsMenu (12KB), TaskItem (10KB), AppShell (10KB), 12 UI primitives
**Pages:** 5 complete pages (dashboard, goals, review, today, settings)
**Features:** Focus mode, AI drawer keyboard shortcut, smart insights, next action spotlight, toast system
**Language:** Indonesian (Bahasa)

### 10.2 MyLife UI

**Design:** Stitch Material-style, deep blue primary #00236f, Inter + Plus Jakarta Sans (CSS 882 lines, 23KB)
**Components:** Only 5 UI primitives for 18 pages — very thin
**Pages:** 18 pages (many partial stubs)
**Language:** Mixed English/Indonesian

### 10.3 UX Comparison

| Dimension | MyProgress | MyLife |
|---|---|---|
| Design maturity | HIGH (UX redesign phase done) | MEDIUM (good tokens, thin components) |
| Component richness | HIGH (AI panel, menus, task items) | LOW (5 primitives) |
| Page completeness | MEDIUM (5 complete pages) | LOW-MEDIUM (18 pages, many stubs) |
| AI integration in UI | YES (rich: history, confirm, ambiguity) | NO |
| Focus mode | YES | NO |

**Recommendation:** MyProgress UI is the visual foundation. Consider adopting MyLife deep-blue corporate palette as the MyLife product identity upgrade.

---

## 11. AI COMPARISON

### 11.1 MyProgress AI (SUPERIOR — KEEP FROZEN)

**Type:** Deterministic command-based NLP (NOT LLM agent)

**Pipeline:**
```
User input
  -> normalization.ts (Indonesian text)
  -> classifier.ts (rule-based -> baseline -> v2-classifier)
  -> router.ts (intent -> handler)
  -> context-resolver.ts (load user context)
  -> entity-resolver.ts (fuzzy name matching)
  -> safety.ts (confidence check + HMAC confirmation)
  -> decision-engine.ts (multi-step plan)
  -> tools/*.ts (domain execution)
```

**37 intents:** V1 (25): TODAY, NEXT_ACTION, GOAL_STATUS/GET/CREATE, TASK_STATUS/SEARCH/CREATE/COMPLETE/REOPEN/DELETE/UPDATE/BULK_*, SESSION_START/END, FOCUS, PROGRESS, ANALYTICS, STREAK, TIME_SPENT, COMPLETION, BOTTLENECK, REVIEW, REFLECTION, OVERDUE, MOTIVATION, HELP, UNKNOWN | V2 additions (12): GOAL_DELETE/UPDATE, STAGE_*, TASK reorder ops, MULTI_STEP

**Safety:**
- Read: confidence >= MEDIUM required
- Write: HMAC confirmation token (intent+userId+TTL+argHash)
- Ambiguous: candidate selector UI
- LOW confidence: safe fallback (no action)

**Tests:** 8 test files including adversarial safety tests

### 11.2 MyLife AI (INFERIOR — DISCARD)

Simple `query.toLowerCase().includes("keyword")` checks. Read-only advisory. No confidence, no safety, no entity resolution.

### 11.3 AI Comparison

| Dimension | MyProgress | MyLife |
|---|---|---|
| Architecture | Deterministic NLP pipeline | Keyword matching |
| Write capability | YES (HMAC) | NO |
| Confidence scoring | YES | NO |
| Safety layer | YES (multi-level) | NO |
| Entity resolution | YES (fuzzy) | NO |
| Multi-step planning | YES | NO |
| Test coverage | YES (8 files, adversarial) | NO |
| Python NLP pipeline | YES | NO |
| LLM ready | YES (`source: "future-llm"`) | NO |

---

## 12. TESTING COMPARISON

### 12.1 MyProgress Tests (HIGH MATURITY)

**Infrastructure:** Isolated temp DB (OS tmpdir), `fileParallelism: false`, `globalSetup`

| Category | Files |
|---|---|
| AI agent | ai.command, ai.v2.agent, ai.v2.tools |
| AI safety adversarial | ai.v2.safety-adversarial |
| Security / IDOR | security, idor.security, idor.http.integration |
| Service unit | session, task, review, today, progress, analytics, insight, momentum |
| Auth | auth.schema |
| AI entity resolver | ai.v2.entity-resolver |

### 12.2 MyLife Tests (MEDIUM MATURITY)

**Infrastructure:** `DATABASE_URL: "file:./prisma/dev.db"` — SHARES dev database. No global setup.

| Category | Files |
|---|---|
| Validation | validation, education, career, learning, weekly-review |
| Service unit | progress, conflict-detection, daily-plan-capacity, smart-priority, notification |
| Auth | auth |
| Other | activity, calendar, academic-planning, export, import, unified-* |

**Missing:** IDOR tests, AI adversarial tests, HTTP integration tests, security tests

### 12.3 Comparison

| Dimension | MyProgress | MyLife |
|---|---|---|
| Security tests | YES | NO |
| DB isolation | YES (temp DB) | NO (uses dev.db) |
| AI adversarial | YES | NO |
| HTTP integration | YES | NO |
| Maturity | HIGH | MEDIUM |

---

## 13. FEATURE INVENTORY

| Feature | Project | Status | Value | Recommendation |
|---|---|---|---|---|
| Goal/Stage/Task/Session management | MyProgress | Complete | HIGH | KEEP |
| Daily focus list | MyProgress | Complete | HIGH | KEEP |
| Weekly review/reflection | MyProgress | Complete | HIGH | KEEP |
| Capture (quick notes) | MyProgress | Complete | MEDIUM | KEEP |
| Analytics (streak, bottleneck) | MyProgress | Complete | HIGH | KEEP |
| AI command system (NLP, 37 intents) | MyProgress | Complete | HIGH | KEEP (FROZEN) |
| HMAC authentication | MyProgress | Complete | CRITICAL | KEEP |
| Docker deployment | MyProgress | Complete | MEDIUM | KEEP |
| Area (life domain) | MyLife | Schema done | HIGH | REBUILD |
| Project + Milestone | MyLife | Schema done | HIGH | REBUILD |
| Objective (OKR) | MyLife | Schema done | MEDIUM | REBUILD |
| CalendarEvent | MyLife | Schema + service | HIGH | REBUILD |
| Activity log | MyLife | Schema + service | MEDIUM | REBUILD |
| Daily plan engine (workload tiers) | MyLife | Service done | HIGH | REBUILD |
| Conflict detection | MyLife | Service done | HIGH | REBUILD |
| Unified inbox | MyLife | Service done | HIGH | REBUILD |
| Life health score | MyLife | Service done | HIGH | REBUILD |
| Smart priority scoring | MyLife | Service done | HIGH | REBUILD |
| Weekly review (enriched) | MyLife | Service done | HIGH | ADAPT |
| Notification engine | MyLife | Service done | HIGH | REBUILD |
| User preferences | MyLife | Schema + service | MEDIUM | REBUILD |
| Goal management (richer schema) | MyLife | Partial | HIGH | ADAPT |
| Export service | MyLife | Service done | MEDIUM | REBUILD |
| Life assistant (keyword) | MyLife | Prototype | LOW | DISCARD |
| Education module | MyLife | Schema done | MEDIUM | DEFER |
| Learning module | MyLife | Schema done | MEDIUM | DEFER |
| Career module | MyLife | Schema done | MEDIUM | DEFER |

---

## 14. BUGS & TECHNICAL DEBT

### P0 — Critical

| ID | Project | Issue |
|---|---|---|
| P0-1 | MyProgress | `.env` contains Supabase PostgreSQL URL with plaintext password `%40PersonalP122333`. Critical secret exposure if `.env` is in Git. **Rotate immediately.** |
| P0-2 | MyLife | `vitest.config.ts` uses `DATABASE_URL: "file:./prisma/dev.db"` — tests share the development database. Data corruption risk on every test run. |

### P1 — High

| ID | Project | Issue |
|---|---|---|
| P1-1 | MyLife | `middleware.ts` only protects `/dashboard/:path*`. API routes depend on per-route auth call — any missed call = unprotected endpoint. |
| P1-2 | MyLife | No rate limiting on login or any API endpoint. Brute force / scraping undefended. |
| P1-3 | MyLife | `features/` directory completely empty (`.gitkeep` only). Architectural inconsistency — all code in `server/` instead. |
| P1-4 | MyLife | `life-assistant.service.ts` uses `includes()` keyword matching. No confidence, no safety, no entity resolution. |
| P1-5 | MyProgress | Schema uses `String` for all status/type/priority fields. No database-level type safety. Typo "ACTVE" accepted silently. |
| P1-6 | MyProgress | Schema provider is `"postgresql"` but `directUrl` not specified in schema. Migrations through pgbouncer may fail silently. |

### P2 — Medium

| ID | Project | Issue |
|---|---|---|
| P2-1 | MyLife | `prisma/seed.ts` has hardcoded `admin@mylife.local` / `mylife123` — weak default credentials. |
| P2-2 | MyLife | `README.md` is boilerplate create-next-app README — completely uninformative. |
| P2-3 | MyLife | `next.config.ts` is empty. Missing `serverExternalPackages: ["better-sqlite3"]`. SQLite driver may not load. |
| P2-4 | MyLife | Only 5 UI components for 18 pages. Likely massive inline UI duplication across pages. |
| P2-5 | MyLife | `progress.service.ts:26-31` bug: when milestone hits 100%, sets status to `"IN_PROGRESS"` instead of `"COMPLETED"`. Logic is inverted. |
| P2-6 | MyProgress | `security.test.ts` uses `beforeAll`/`afterAll`. If test crashes mid-run, cleanup may not happen, leaving test data. |
| P2-7 | MyLife | Inconsistent validation: some services use `parse()` (throws), others use `safeParse()`. |
| P2-8 | MyProgress | `userId: String @default("dev-user")` in schema — legacy dev artifact still present. |

### P3 — Low

| ID | Project | Issue |
|---|---|---|
| P3-1 | MyProgress | `(app)/page.tsx` is 416 lines — too large for a single server component. |
| P3-2 | MyLife | Mixed Indonesian/English across pages. No consistent language decision. |
| P3-3 | MyProgress | `prisma/seed.ts` creates Goal without `userId` (uses `@default`). Not portable for multi-user. |
| P3-4 | MyLife | `date-fns` v4 is used heavily in services but absent from MyProgress — extra dependency surface to reconcile. |

---

## 15. CONFLICTS

| Conflict | Impact |
|---|---|
| Database engine: PostgreSQL vs SQLite | Cannot share data. Different adapters, schemas, URL formats. |
| Authentication: HMAC cookie vs NextAuth JWT | Incompatible session formats, different middleware, different identity model. |
| User model: no password vs bcrypt hashed | Different User schema — cannot merge without migration. |
| Goal model: `name/String` vs `title/enum GoalStatus` | Field name + type conflict. Data migration required. |
| Task hierarchy: Stage-based vs 6-FK multi-parent | Fundamentally different hierarchy design. |
| Review scope: per-goal vs per-user-per-week | Different granularity. Merge strategy needed. |
| Progress: runtime-computed vs materialized field | Different calculation strategies. |
| API response format: mixed vs standardized | Cannot be unified without code changes. |
| Next.js version: 16.3.3 vs 16.3.4 | Minor; should be unified. |

---

## 16. MIGRATION RISKS

| Risk | Severity | Description |
|---|---|---|
| Secret rotation | CRITICAL | MyProgress `.env` has live Supabase password. Rotate before any sharing. |
| Data migration | HIGH | Real user data in PostgreSQL. Must be migrated without loss. |
| Auth migration | HIGH | Switching auth systems invalidates all existing sessions. |
| Schema field renaming | HIGH | `Goal.name` -> `Goal.title` requires data migration + code changes. |
| AI freeze | MEDIUM | Any AI pipeline changes risk breaking 8 test files. |
| Test DB contamination | MEDIUM | MyLife tests corrupt dev.db. Fix before running. |
| Duplicate model names | MEDIUM | Both projects have Goal, Task, Review, Session — import collision risk. |
| DB engine change | MEDIUM | Changing PostgreSQL <-> SQLite requires full export, translate, import. |
| Enum introduction | LOW | Adding typed enums to MyProgress requires migration + application changes. |

---

## 17. RECOMMENDED FOUNDATION

**MyProgress is the unambiguous technical foundation.**

Evidence:
1. Complete adversarial security test coverage (IDOR, token tampering, AI write protection)
2. Battle-tested HMAC auth with fail-closed behavior and rate limiting
3. Working AI system: 37 intents, entity resolution, multi-step planning, HMAC confirmations
4. Production deployment: Dockerfile, DEPLOY.md, docker-compose.yml
5. Active Python NLP pipeline
6. Version 1.0.0 (production-ready) vs 0.1.0 (pre-release)
7. Tests run in isolated temp DB
8. Deliberate UX redesign phase completed (documented)

**What MyProgress lacks** (MyLife value to extract):
- Area / life domain classification
- Calendar + time blocking
- Multi-level hierarchy (Project, Milestone, Objective)
- Notification engine + User Preferences
- Life health scoring + conflict detection
- Unified inbox aggregation
- Education / Career / Learning modules
- Export / Import

---

## 18. WHAT MUST NOT BE MIGRATED

| Item | Reason |
|---|---|
| MyLife authentication | No rate limiting, no adversarial tests, no IDOR tests |
| MyLife AI assistant (life-assistant.service.ts) | Keyword-only; MyProgress AI is architecturally superior |
| MyLife vitest.config.ts | Uses dev.db — unsafe for tests |
| MyLife middleware.ts | Only protects /dashboard — too narrow |
| MyLife features/ directory | Empty — do not inherit the pattern |
| MyProgress .env plaintext password | Rotate and never inherit |
| MyProgress userId @default("dev-user") | Legacy artifact; must be cleaned |

---

## 19. REBUILD PRIORITY

**Phase A — Core Expansion (highest priority):**
1. Area (life domain classification)
2. Project + Milestone (structured execution)
3. Objective (OKR-style measurement)
4. CalendarEvent (time blocking)
5. Activity (actual time logging)
6. Smart Priority scoring (port smart-priority.service.ts)
7. Progress cascading (port progress.service.ts)
8. Weekly Review enrichment (extend existing Review model)

**Phase B — Intelligence Layer:**
9. Daily Plan engine (workload tiers: LIGHT/OPTIMAL/HEAVY/OVERLOADED)
10. Conflict Detection (port conflict-detection.service.ts)
11. Life Health Score (port life-health.service.ts)
12. Unified Inbox (port unified-inbox.service.ts)
13. Notification engine + User Preferences
14. Daily Recommendation

**Phase C — Domain Modules (deferred, persona-specific):**
15. Education (Institution -> Course -> Assignment/Exam)
16. Learning (Skill -> Track -> Resource)
17. Career (Company -> Position -> Opportunity)
18. Export / Import

**AI: FROZEN THROUGHOUT PHASES A AND B. Extend only after Phase A is complete and all tests pass.**

---

## 20. OPEN QUESTIONS

1. **Database engine:** Keep PostgreSQL (Supabase, scalable) or switch to SQLite (portable, simpler)? Trade-off: cloud complexity vs local simplicity.
2. **Auth strategy:** Keep HMAC auth long-term, or plan NextAuth v5 migration for future OAuth?
3. **Language:** MyProgress is Indonesian. MyLife is mixed. What is the target product language?
4. **Design system:** MyProgress warm-canvas (indigo/violet) or MyLife deep-blue corporate (Stitch) as the MyLife visual identity?
5. **Hierarchy:** Keep Stage (MyProgress) AND add Project/Milestone (MyLife), or choose one? This needs an explicit design decision.
6. **Multi-user:** When does multi-user need to be formally designed?
7. **Finance (MyMoney):** MVP requirement or truly future/optional?
8. **AI expansion:** When to extend frozen AI to new domains (Areas, Projects, Calendar)?

---

## 21. FINAL VERDICT

```
TECHNICAL FOUNDATION:   MyProgress (unambiguous)
PRODUCT IDENTITY:       MyLife
STRATEGY:               Rebuild MyLife capabilities on MyProgress foundation

IMMEDIATE ACTIONS (before any code changes):
  1. Rotate Supabase password exposed in MyProgres/.env  [CRITICAL]
  2. Fix MyLife vitest.config.ts to use isolated test DB  [CRITICAL]
  3. Make explicit decisions on Section 20 open questions  [HIGH]

TOP SERVICES TO PORT FROM MYLIFE (in priority order):
  1. conflict-detection.service.ts — workload intelligence
  2. daily-plan.service.ts — workload tier engine
  3. life-health.service.ts — lifecycle health scoring
  4. unified-inbox.service.ts — multi-source aggregation
  5. notification.service.ts — proactive OS with deduplication
  6. smart-priority.service.ts — explainable priority scoring
  7. progress.service.ts — cascading materialized progress

TOP SYSTEMS TO PRESERVE FROM MYPROGRESS:
  1. src/ai/ — FROZEN, do not modify
  2. src/lib/auth.ts — KEEP exactly as-is
  3. tests/ — KEEP and extend
  4. Analytics service — KEEP
  5. Dashboard / Today / Focus services — KEEP

BIGGEST RISKS:
  1. P0: Secret exposure in MyProgress .env — rotate NOW
  2. P0: Test DB contamination in MyLife — fix before running tests
  3. HIGH: Schema field name conflicts (Goal.name vs Goal.title)
  4. MEDIUM: Scope creep — rebuild MyLife's 29 models INCREMENTALLY
```
