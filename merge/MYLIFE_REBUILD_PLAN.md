# MYLIFE REBUILD PLAN
## Technical Foundation: MyProgress | Product Identity: MyLife

> Version: 0.1 — Post-Audit Draft  
> Status: PENDING ARCHITECT APPROVAL  
> Prerequisites: Read MERGE_AUDIT.md first. This plan depends on its findings.  
> Strategy: AUDIT -> UNDERSTAND -> CLASSIFY -> DESIGN -> SELECT -> REBUILD -> INTEGRATE -> VERIFY  
> **DO NOT START EXECUTION UNTIL PHASE 0 BLOCKERS ARE RESOLVED.**

---

## GOVERNING PRINCIPLES

1. **MyProgress is the foundation.** Every new feature is added ON TOP of MyProgress, not replacing it.
2. **AI is FROZEN.** The `src/ai/` directory of MyProgress must not be modified during Phase A or B. AI freeze lifts only after Phase A is verified and all existing tests pass.
3. **Tests are not optional.** Every new model, service, and API route must have tests. IDOR tests are mandatory for every new route.
4. **Security is non-negotiable.** Every API route must use `requireCurrentUser()` (MyProgress auth). No NextAuth. No exceptions.
5. **Rebuild, do not copy-paste.** Services from MyLife are reference implementations, not migration targets. Port the LOGIC, adapt to MyProgress architecture (schemas, repositories, services).
6. **Incremental over comprehensive.** Add one domain at a time. Verify before moving to the next.
7. **No scope creep.** Education, Learning, Career modules are DEFERRED. They do not exist until Phase C is formally approved.

---

## PHASE 0 — BLOCKERS (MUST RESOLVE BEFORE ANY CODE CHANGES)

### Blocker 0.1 — CRITICAL: Secret Rotation
**Issue:** `MyProgres/.env` contains a live Supabase PostgreSQL password in plaintext.
**Action:**
1. Rotate the Supabase database password immediately via Supabase dashboard.
2. Update `.env` with the new password (never commit to Git).
3. Verify the `.env` file is in `.gitignore`.
4. Check Git history for any committed secrets — purge if necessary.

### Blocker 0.2 — CRITICAL: Test Database Isolation
**Issue:** `MyLife/vitest.config.ts` uses `DATABASE_URL: "file:./prisma/dev.db"` — tests run against the development database.
**Action (applies to the new MyLife project, not MyLife legacy):**
1. Copy MyProgress's `tests/global-setup.ts` and `tests/test-db.ts` patterns.
2. Configure `vitest.config.ts` to use an isolated temp DB path.
3. Ensure `fileParallelism: false` to prevent concurrent DB writes in tests.

### Blocker 0.3 — HIGH: Architectural Decisions Required

Answer the following before Phase A begins:

| Decision | Options | Impact |
|---|---|---|
| Database engine | PostgreSQL (keep Supabase) vs SQLite (simpler, portable) | All schema work |
| Target language | Indonesian only vs Bilingual | All UI text |
| Design system | MyProgress warm-canvas (indigo) vs MyLife deep-blue corporate (Stitch) | All CSS |
| Stage vs Project | Keep Stage AND add Project, or replace Stage with Project? | Schema + hierarchy design |

---

## PHASE A — CORE EXPANSION

### Goal
Add the essential Life OS domain models and services on top of the existing MyProgress foundation without breaking any existing functionality.

### A.0 — Foundation Setup

**Before writing any new code:**

1. **Create the MyLife project directory** (do NOT modify MyProgress directly):
   - Copy MyProgress to a new directory, e.g., `D:\IT\web\mylife-v2\`
   - This becomes the working base

2. **Fix test infrastructure:**
   - Implement isolated test DB (copy MyProgress `global-setup.ts` pattern)
   - Verify `npm run test` passes on the copied base before any changes

3. **Standardize API response format:**
   - Port `lib/errors/index.ts` (AppError hierarchy) from MyLife to new project
   - Port `lib/api-helpers.ts` (`withErrorHandling`, `ok()`, `created()`, `noContent()`) from MyLife
   - Update existing MyProgress API routes to use standardized format

4. **Set up project identity:**
   - Update `package.json` name to `mylife`
   - Update `README.md` with MyLife product description

### A.1 — Schema: Core Domain Expansion

**Files to create/modify:**
- `prisma/schema.prisma` — add new models to existing schema

**New models (add in this order, one migration per group):**

#### Migration A.1.1 — Area

```prisma
enum AreaColor {
  BLUE
  GREEN
  PURPLE
  ORANGE
  RED
  TEAL
  INDIGO
  AMBER
}

model Area {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  color       String   @default("#6366f1")
  icon        String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  goals    Goal[]
  tasks    Task[]

  @@index([userId])
}
```

**Also modify:** `Goal` model — add optional `areaId String?` foreign key. Add `area Area? @relation(...)`.

#### Migration A.1.2 — Project + Milestone

```prisma
enum ProjectStatus { ACTIVE PAUSED COMPLETED CANCELLED ARCHIVED }
enum MilestoneStatus { PENDING IN_PROGRESS COMPLETED CANCELLED }
enum Priority { LOW MEDIUM HIGH CRITICAL }

model Project {
  id          String        @id @default(cuid())
  userId      String
  areaId      String?
  goalId      String?
  title       String
  description String?
  status      ProjectStatus @default(ACTIVE)
  priority    Priority      @default(MEDIUM)
  deadline    DateTime?
  progress    Int           @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  area       Area?       @relation(fields: [areaId], references: [id], onDelete: SetNull)
  goal       Goal?       @relation(fields: [goalId], references: [id], onDelete: SetNull)
  milestones Milestone[]
  tasks      Task[]

  @@index([userId])
}

model Milestone {
  id          String          @id @default(cuid())
  userId      String
  projectId   String
  title       String
  description String?
  status      MilestoneStatus @default(PENDING)
  dueDate     DateTime?
  progress    Int             @default(0)
  order       Int             @default(0)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks   Task[]

  @@index([userId])
  @@index([projectId])
}
```

**Also modify:** `Task` model — add optional `projectId String?`, `milestoneId String?` foreign keys.

#### Migration A.1.3 — Objective

```prisma
enum ObjectiveStatus { ACTIVE PAUSED COMPLETED CANCELLED }

model Objective {
  id            String          @id @default(cuid())
  userId        String
  goalId        String
  title         String
  targetMetric  String?
  targetValue   Float?
  currentValue  Float?          @default(0)
  progress      Int             @default(0)
  status        ObjectiveStatus @default(ACTIVE)
  order         Int             @default(0)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal Goal @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([goalId])
}
```

#### Migration A.1.4 — CalendarEvent + Activity

```prisma
enum EventType { MEETING DEADLINE REMINDER PERSONAL WORK OTHER }
enum ActivityCategory { WORK LEARNING HEALTH PERSONAL OTHER }

model CalendarEvent {
  id          String    @id @default(cuid())
  userId      String
  title       String
  description String?
  type        EventType @default(OTHER)
  startAt     DateTime
  endAt       DateTime
  isAllDay    Boolean   @default(false)
  location    String?
  taskId      String?
  projectId   String?
  goalId      String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  task    Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  goal    Goal?    @relation(fields: [goalId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([userId, startAt])
}

model Activity {
  id              String           @id @default(cuid())
  userId          String
  title           String
  category        ActivityCategory @default(OTHER)
  startAt         DateTime
  endAt           DateTime?
  durationMinutes Int?
  taskId          String?
  projectId       String?
  goalId          String?
  areaId          String?
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  task    Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  goal    Goal?    @relation(fields: [goalId], references: [id], onDelete: SetNull)
  area    Area?    @relation(fields: [areaId], references: [id], onDelete: SetNull)

  @@index([userId])
}
```

#### Migration A.1.5 — Enrich Existing Models

Modify `Goal` model:
- Add `title String?` as alias (or rename `name` to `title` with migration)
- Add `priority String @default("MEDIUM")`
- Add `progress Int @default(0)` (materialized progress cache)
- Add `areaId String?`

Modify `Task` model:
- Add `title String?` as alias (or rename `name` to `title`)
- Convert `priority` from `String` to typed enum
- Add `dueAt DateTime?`, `estimatedMinutes Int?`, `completedAt DateTime?`
- Add `areaId String?`, `projectId String?`, `milestoneId String?`

### A.2 — Services: Core Domain

**Port (adapt, not copy-paste) the following from MyLife:**

#### A.2.1 — SmartPriorityService

Source: `mylife/server/services/smart-priority.service.ts`

Adapt to MyProgress models:
- Replace `project?.title` with `project?.name` (until Task is renamed)
- Remove `recharts`/`date-fns` dependencies — use MyProgress style
- Wire into `repositories/task.repository.ts`

Tests to write:
- Priority score calculation for each priority tier
- Urgency boost for tasks due today / overdue
- Strategic value for tasks linked to active goals/projects
- Quick win detection (estimatedMinutes < 30)

#### A.2.2 — ProgressService (cascading)

Source: `mylife/server/services/progress.service.ts`

Adapt to MyProgress models (Goal->Stage->Task hierarchy):
- `recalculateMilestone(milestoneId, userId)`: Task completion rates
- `recalculateProject(projectId, userId)`: Task + Milestone rates
- `recalculateGoal(goalId, userId)`: Objective or Project averages

**Wire into:** Task status update handler, Session creation handler.

Tests to write:
- Milestone progress after task completion
- Project progress cascades from milestone
- Goal progress cascades from objectives
- Full cascade from single task status change

#### A.2.3 — Enrich WeeklyReviewService

Extend existing `ReviewService` to include:
- Weekly task completion rate
- Goal momentum (active goals with recent progress)
- Project stagnation detection
- Streak data

Tests to write:
- Review generation for week with 0 tasks
- Review generation for week with mixed task statuses
- Momentum calculation

### A.3 — API Routes: Core Domain

**Pattern for every new route (mandatory):**

```typescript
import { requireCurrentUser, authErrorResponse } from "@/lib/auth";
import { withErrorHandling, ok, created } from "@/lib/api-helpers";
import { requireOwnership } from "@/lib/ownership";
// Zod schema safeParse before any DB call
// userId from session, always passed to service
// Service throws NotFoundError/ForbiddenError -> withErrorHandling converts to 404/403
```

**Routes to add (in order):**

1. `/api/areas` — GET, POST
2. `/api/areas/[id]` — GET, PATCH, DELETE
3. `/api/projects` — GET, POST
4. `/api/projects/[id]` — GET, PATCH, DELETE
5. `/api/milestones/[id]` — GET, PATCH, DELETE
6. `/api/objectives/[id]` — GET, PATCH, DELETE
7. `/api/calendar-events` — GET, POST
8. `/api/calendar-events/[id]` — GET, PATCH, DELETE
9. `/api/activities` — GET, POST
10. `/api/activities/[id]` — PATCH, DELETE

**MANDATORY for every route:**
- IDOR test: verify that user B cannot access user A's resources
- Auth test: verify that unauthenticated requests return 401
- Validation test: verify that malformed input returns 400

### A.4 — UI: Core Domain Pages

**Order of implementation:**

1. **Areas page** (`/areas`) — List + create life areas (simple)
2. **Projects page** (`/projects`) — List + create projects with area/goal linking
3. **Project detail page** (`/projects/[id]`) — Milestones + tasks, progress bar
4. **Goal detail enhancement** — Add Objectives section to existing goal page
5. **Calendar page** (`/calendar`) — Month/week view with CalendarEvent CRUD
6. **Task enhancement** — Add `dueAt`, `project`, `area` fields to existing TaskItem

**UI principles (all new pages):**
- Use MyProgress AppShell (sidebar + AI drawer)
- Use existing MyProgress design tokens (no mixing MyLife Stitch tokens without explicit decision)
- Use existing MyProgress UI primitives (Button, Badge, Dialog, Progress, etc.)
- Add new primitives as needed, following existing patterns

### A.5 — Phase A Verification Checklist

Before moving to Phase B:

- [ ] All existing MyProgress tests still pass (`npm run test`)
- [ ] New IDOR tests pass for all new API routes
- [ ] New service unit tests pass (SmartPriority, Progress, WeeklyReview)
- [ ] Area CRUD works end-to-end (UI + API + DB)
- [ ] Project + Milestone CRUD works end-to-end
- [ ] CalendarEvent CRUD works end-to-end
- [ ] Progress cascading verified: Task completion -> Milestone -> Project -> Goal
- [ ] No console.error / unhandled promise rejections in dev server

---

## PHASE B — INTELLIGENCE LAYER

### Goal
Add the intelligent, cross-domain analytics and planning services that make MyLife a true Life OS.

### B.0 — Prerequisites

- Phase A Verification Checklist complete
- CalendarEvent model populated with test data
- Project + Milestone hierarchy working
- All Phase A tests passing

### B.1 — DailyPlanService

Source: `mylife/server/services/daily-plan.service.ts`

**Workload tiers:**
- LIGHT: < 240 min (< 4h)
- OPTIMAL: 240-420 min (4-7h)
- HEAVY: 421-540 min (7-9h)
- OVERLOADED: > 540 min (> 9h)

**Adapts to MyProgress context:**
- Uses CalendarEvent for scheduled time blocks
- Uses Task.estimatedMinutes (new field from Phase A)
- Integrates DailyFocus (existing MyProgress model)

**API:** `GET /api/daily-plan?date=YYYY-MM-DD`

**Tests:**
- `classifyWorkload()` unit tests for all four tiers
- Plan with 0 events, 0 tasks
- Plan with overloaded schedule
- Triage action: reschedule task to tomorrow

### B.2 — ConflictDetectionService

Source: `mylife/server/services/conflict-detection.service.ts`

**Conflict types to detect:**
- `CALENDAR_COLLISION`: overlapping calendar events
- `OVERBOOKING`: task estimates exceed available time
- `DEADLINE_CLUSTERING`: multiple deadlines within 24h
- `PROJECT_STAGNATION`: active project with no task completions in 7+ days
- `OVERDUE_ACCUMULATION`: multiple overdue tasks

**API:** `GET /api/conflicts`

**Tests:**
- No conflicts when schedule is clean
- Calendar collision detection
- Overbooking detection
- Stagnation detection for inactive projects

### B.3 — LifeHealthService

Source: `mylife/server/services/life-health.service.ts`

**Health score (0-100) with 6 subscores:**
1. `goalMomentum` — average goal progress
2. `projectMomentum` — projects with recent task completions
3. `executionRate` — completed / total tasks ratio
4. `workloadBalance` — daily workload tier quality
5. `consistency` — active days in last 7 days
6. `reflectionRhythm` — weekly reviews in last 30 days

**Tier classification:**
- 80-100: PRIMA
- 60-79: BAIK
- 40-59: CUKUP
- 0-39: PERLU_PERBAIKAN

**API:** `GET /api/life-health`

**Tests:**
- Score for user with 0 data (all zeros)
- Score for user with perfect data (all 100)
- Score with only 3/6 subscores active
- Tier classification boundaries

### B.4 — UnifiedInboxService

Source: `mylife/server/services/unified-inbox.service.ts`

**Inbox categories:**
- `OVERDUE`: tasks past due date
- `TODAY`: tasks due today + calendar events today
- `UPCOMING`: tasks/events due in next 3 days
- `IMPORTANT`: HIGH priority tasks without due date
- `NEEDS_ATTENTION`: projects stagnant, tasks in progress too long

**API:** `GET /api/inbox`

**Tests:**
- Empty inbox for fresh user
- Overdue tasks appear in OVERDUE category
- Today's events appear in TODAY category
- Item counts are accurate

### B.5 — NotificationService

Source: `mylife/server/services/notification.service.ts`

**Schema addition (Migration B.5.1):**

```prisma
enum NotificationType { TASK_DUE MILESTONE_DUE OVERDUE CONFLICT LIFE_HEALTH WEEKLY_REVIEW }
enum NotificationSeverity { INFO WARNING CRITICAL }

model Notification {
  id         String               @id @default(cuid())
  userId     String
  type       NotificationType
  severity   NotificationSeverity @default(INFO)
  title      String
  body       String
  isRead     Boolean              @default(false)
  isDismissed Boolean             @default(false)
  sourceId   String?
  sourceType String?
  createdAt  DateTime             @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, isDismissed])
}

model UserPreference {
  id                  String   @id @default(cuid())
  userId              String   @unique
  enableNotifications Boolean  @default(true)
  dailyPlanHour       Int      @default(8)
  weeklyReviewDay     Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**API:**
- `GET /api/notifications` — list with filters
- `PATCH /api/notifications` — mark read/dismiss

**Proactive notification generation:** Called from `/api/daily-plan` and `/api/life-health` endpoints.

**Tests:**
- Notification generation: overdue task creates OVERDUE notification
- Deduplication: same notification not created twice in 24h
- Mark as read
- User preference disables notification generation

### B.6 — Phase B Verification Checklist

Before moving to Phase C:

- [ ] All Phase A tests still pass
- [ ] All Phase B service unit tests pass
- [ ] `GET /api/daily-plan` returns correct workload tier
- [ ] `GET /api/conflicts` returns correct conflict list
- [ ] `GET /api/life-health` returns correct health score
- [ ] `GET /api/inbox` returns correct aggregated items
- [ ] Notification deduplication verified
- [ ] Life Health page UI shows health score + subscores
- [ ] Daily Plan page UI shows workload + today's agenda
- [ ] Unified Inbox page UI shows categorized items

---

## PHASE C — DOMAIN MODULES (DEFERRED)

### Status: NOT STARTED. Requires explicit architectural approval.

### Modules in scope for Phase C:

**C.1 — Education Module**
- Models: Institution, AcademicPeriod, Course, CourseSchedule, Assignment, Exam
- Source: MyLife schema + `academic-planning.service.ts`, `education-validation.test.ts`
- Prerequisites: CalendarEvent model (for class scheduling), Phase A complete

**C.2 — Learning Module**
- Models: Skill, LearningTrack, LearningResource
- Source: MyLife schema + `learning-validation.test.ts`, `learning-career-integration.test.ts`
- Prerequisites: Goal + Area models (skills link to goals and areas), Phase A complete

**C.3 — Career Module**
- Models: Company, Position, CareerResponsibility, CareerOpportunity, CareerInterview
- Source: MyLife schema + `career-validation.test.ts`
- Prerequisites: CalendarEvent (for interview scheduling), Phase A complete

**Trigger for Phase C:** User explicitly requests these modules after Phase B is verified and stable.

---

## PHASE D — AI EXTENSION

### Status: FROZEN until Phase A complete and verified.

### Prerequisite
All Phase A tests must pass, including all IDOR and security tests for new models.

### What "AI Extension" means

The existing MyProgress AI system handles:
- Goal CRUD (V1+V2 intents)
- Stage CRUD (V2 intents)
- Task CRUD + bulk operations (V1+V2 intents)
- Session management
- Focus mode
- Analytics, review, reflection

After Phase A, the AI needs to be extended to understand:
- Areas (area creation, listing, task-area assignment)
- Projects + Milestones (project creation, status updates)
- Calendar events (event creation, conflict queries)
- Daily plan queries (workload status, schedule overview)
- Life health queries (health score, improvement tips)

### How to Extend AI (without breaking existing system)

**Step D.1 — Add new intents to `intents.ts`:**
```typescript
// Phase A extensions
AREA_CREATE = "AREA_CREATE",
AREA_LIST = "AREA_LIST",
PROJECT_CREATE = "PROJECT_CREATE",
PROJECT_STATUS = "PROJECT_STATUS",
CALENDAR_VIEW = "CALENDAR_VIEW",
CALENDAR_ADD = "CALENDAR_ADD",
DAILY_PLAN = "DAILY_PLAN",
LIFE_HEALTH = "LIFE_HEALTH",
```

**Step D.2 — Expand corpus** (`nlp/data/corpus_v4.json`) with examples for new intents.

**Step D.3 — Retrain classifier** (`npm run nlp:train`) and verify accuracy doesn't regress.

**Step D.4 — Add new tool files** (`src/ai/tools/area.tools.ts`, `project.tools.ts`, etc.) following exact same pattern as existing tools.

**Step D.5 — Update router** (`src/ai/router.ts`) with new intent -> handler mappings.

**Step D.6 — Write adversarial tests** for new intents:
- Confirm tokens work for new write operations
- IDOR tests for new AI tools
- Entity resolver tests for new entity types (Area, Project names)

**Step D.7 — Verify all existing AI tests still pass** before shipping.

---

## STYLE GUIDE

### TypeScript

- Always use `string` (lowercase) for TypeScript types
- Zod schemas must match Prisma models exactly
- All API route handlers must be `async` and use `try/catch` via `withErrorHandling`
- Never use `any` — use `unknown` and narrow
- Import order: node builtins, next, prisma, lib, services, repos, schemas, components

### Services

- Services call repositories, not Prisma directly
- Services take `userId` as first parameter for all user-scoped operations
- Services throw typed errors (`NotFoundError`, `ValidationError`) — never raw strings
- Services do NOT access `req`/`res` — they are pure functions

### Repositories

- Repositories call Prisma only
- Repositories always filter by `userId` in WHERE clauses
- Repositories return raw Prisma types (or select projections)
- Repository methods: `findMany(userId, filters)`, `findById(id, userId)`, `create(userId, data)`, `update(id, userId, data)`, `delete(id, userId)`

### API Routes

- All routes import `requireCurrentUser`, `authErrorResponse` from `@/lib/auth`
- All routes use `withErrorHandling` wrapper
- All routes validate input with Zod `safeParse` (never `parse`)
- All routes respond with `ok()`, `created()`, `noContent()` from `api-helpers`
- Route file pattern:

```typescript
export async function GET(request: Request) {
  let user;
  try { user = await requireCurrentUser(request); }
  catch (error) { return authErrorResponse(error); }
  
  return withErrorHandling(async () => {
    const data = await myService.getData(user.id);
    return ok({ data });
  });
}
```

### Tests

- Every new route must have:
  - Test for unauthenticated access (401)
  - Test for cross-user access (404 via IDOR protection)
  - Test for valid operation (2xx)
  - Test for invalid input (400)
- Test files go in `tests/` matching the file they test: `tests/area.service.test.ts`
- Tests use the isolated test DB (inherited from Phase A.0 setup)
- Tests do NOT mock the database — they use the real test DB

---

## FILE STRUCTURE (TARGET STATE)

After Phase A + B complete, the project structure should look like:

```
mylife-v2/
+-- src/
|   +-- ai/                     # UNCHANGED from MyProgress (FROZEN)
|   +-- app/
|   |   +-- (app)/
|   |   |   +-- page.tsx         # Dashboard (enhanced)
|   |   |   +-- areas/           # NEW: Area management
|   |   |   +-- projects/        # NEW: Project + Milestone management
|   |   |   +-- calendar/        # NEW: Calendar view
|   |   |   +-- daily-plan/      # NEW: Daily plan + workload
|   |   |   +-- inbox/           # NEW: Unified inbox
|   |   |   +-- life-health/     # NEW: Health score dashboard
|   |   |   +-- goals/           # ENHANCED: + Objectives
|   |   |   +-- tasks/           # ENHANCED: + project/area filtering
|   |   |   +-- review/          # ENHANCED: richer weekly review
|   |   |   +-- today/           # UNCHANGED
|   |   |   +-- settings/        # UNCHANGED
|   |   +-- api/
|   |       +-- (existing MyProgress routes — UNCHANGED)
|   |       +-- areas/           # NEW
|   |       +-- projects/        # NEW
|   |       +-- milestones/      # NEW
|   |       +-- objectives/      # NEW
|   |       +-- calendar-events/ # NEW
|   |       +-- activities/      # NEW
|   |       +-- daily-plan/      # NEW
|   |       +-- conflicts/       # NEW
|   |       +-- life-health/     # NEW
|   |       +-- inbox/           # NEW
|   |       +-- notifications/   # NEW
|   +-- lib/
|   |   +-- auth.ts              # UNCHANGED from MyProgress
|   |   +-- ownership.ts         # UNCHANGED
|   |   +-- api-helpers.ts       # NEW (ported from MyLife)
|   |   +-- errors/index.ts      # NEW (ported from MyLife)
|   |   +-- prisma.ts            # UNCHANGED
|   +-- repositories/
|   |   +-- (existing — UNCHANGED)
|   |   +-- area.repository.ts   # NEW
|   |   +-- project.repository.ts # NEW
|   |   +-- milestone.repository.ts # NEW
|   |   +-- objective.repository.ts # NEW
|   |   +-- calendar.repository.ts  # NEW
|   |   +-- activity.repository.ts  # NEW
|   |   +-- notification.repository.ts # NEW (Phase B)
|   +-- services/
|   |   +-- (existing — UNCHANGED)
|   |   +-- area.service.ts      # NEW
|   |   +-- project.service.ts   # NEW
|   |   +-- milestone.service.ts # NEW
|   |   +-- progress.service.ts  # NEW (ported from MyLife)
|   |   +-- smart-priority.service.ts # NEW (ported from MyLife)
|   |   +-- daily-plan.service.ts # NEW Phase B
|   |   +-- conflict-detection.service.ts # NEW Phase B
|   |   +-- life-health.service.ts # NEW Phase B
|   |   +-- unified-inbox.service.ts # NEW Phase B
|   |   +-- notification.service.ts # NEW Phase B
+-- tests/
|   +-- (existing — UNCHANGED + extended)
|   +-- area.service.test.ts     # NEW
|   +-- project.service.test.ts  # NEW
|   +-- milestone.service.test.ts # NEW
|   +-- progress.service.test.ts # NEW
|   +-- idor.area.test.ts        # NEW (security)
|   +-- idor.project.test.ts     # NEW (security)
|   +-- idor.calendar.test.ts    # NEW (security)
|   +-- daily-plan.test.ts       # NEW Phase B
|   +-- conflict-detection.test.ts # NEW Phase B
|   +-- life-health.test.ts      # NEW Phase B
|   +-- unified-inbox.test.ts    # NEW Phase B
|   +-- notification.test.ts     # NEW Phase B
+-- prisma/
|   +-- schema.prisma            # EXTENDED (5 new migration groups)
+-- nlp/                         # UNCHANGED (FROZEN)
```

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| AI system regression | LOW | CRITICAL | Keep AI FROZEN; run all AI tests before any PR merge |
| Secret exposure (P0-1) | HIGH (already happened) | CRITICAL | Rotate immediately; add pre-commit hook |
| Data loss during migration | MEDIUM | HIGH | Always backup PostgreSQL before migrations |
| Schema field naming conflict | HIGH | MEDIUM | Use `title` for new models; decide Goal.name -> Goal.title migration plan explicitly |
| Scope creep into Phase C | MEDIUM | MEDIUM | Track Phase C requests in a backlog; do not start without approval |
| Test DB contamination | MEDIUM | MEDIUM | Implement isolation in Phase A.0 before any other changes |
| Performance regression | LOW | MEDIUM | Add `@@index` on all userId fields; monitor query plans |
| Breaking existing MyProgress users | LOW | HIGH | Run full test suite after every migration |

---

## DECISION LOG

| Date | Decision | Rationale | Decided By |
|---|---|---|---|
| TBD | Technical foundation: MyProgress | See MERGE_AUDIT.md Section 17 | Architect |
| TBD | Database engine: [PENDING] | — | Architect |
| TBD | Auth strategy: [PENDING] | — | Architect |
| TBD | Language: [PENDING] | — | Architect |
| TBD | Design system: [PENDING] | — | Architect |
| TBD | Stage vs Project: [PENDING] | — | Architect |

---

## QUICK REFERENCE COMMAND MATRIX

| Command | Purpose | When |
|---|---|---|
| `npm run test` | Run all Vitest tests | Before every commit |
| `npm run typecheck` | Run TypeScript type checking | Before every commit |
| `npm run lint` | Run ESLint | Before every PR |
| `npx prisma migrate dev` | Create new migration | After schema change |
| `npx prisma migrate deploy` | Apply migrations | In CI/production |
| `npx prisma generate` | Regenerate Prisma client | After schema change |
| `npm run db:studio` | Open Prisma Studio | Debugging data |
| `npm run nlp:test` | Run Python NLP tests | Before any AI changes |
| `npm run dev` | Start dev server | Local development |

---

## APPENDIX: SERVICES TO PORT FROM MYLIFE

Reference implementations — adapt logic, do not copy-paste verbatim.

| Service | Source Path | Port to | Phase |
|---|---|---|---|
| SmartPriorityService | `mylife/server/services/smart-priority.service.ts` | `src/services/smart-priority.service.ts` | A |
| ProgressService (cascading) | `mylife/server/services/progress.service.ts` | `src/services/progress.service.ts` | A |
| DailyPlanService | `mylife/server/services/daily-plan.service.ts` | `src/services/daily-plan.service.ts` | B |
| ConflictDetectionService | `mylife/server/services/conflict-detection.service.ts` | `src/services/conflict-detection.service.ts` | B |
| LifeHealthService | `mylife/server/services/life-health.service.ts` | `src/services/life-health.service.ts` | B |
| UnifiedInboxService | `mylife/server/services/unified-inbox.service.ts` | `src/services/unified-inbox.service.ts` | B |
| NotificationService | `mylife/server/services/notification.service.ts` | `src/services/notification.service.ts` | B |

**API helpers to port:**
- `mylife/lib/api-helpers.ts` -> `src/lib/api-helpers.ts`
- `mylife/lib/errors/index.ts` -> `src/lib/errors/index.ts`

**Test patterns to port:**
- MyLife conflict-detection.test.ts -> Tests for Phase B ConflictDetection
- MyLife daily-plan-capacity.test.ts -> Tests for Phase B DailyPlan
- MyLife smart-priority.test.ts -> Tests for Phase A SmartPriority
- MyLife life-health.test.ts -> Tests for Phase B LifeHealth
- MyLife notification.test.ts -> Tests for Phase B Notification

**DO NOT PORT:**
- `mylife/auth.ts` — use MyProgress auth
- `mylife/server/services/life-assistant.service.ts` — use MyProgress AI
- `mylife/vitest.config.ts` — use MyProgress test infrastructure
- `mylife/middleware.ts` — use MyProgress per-route auth pattern
