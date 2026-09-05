# PHASE 6 PRE-IMPLEMENTATION AUDIT
## Insights & Life Intelligence Layer
### Project: MyLife — Personal Life Operating System (Foundation: MyProgress)
**Date:** September 4, 2026  
**Status:** **IMPLEMENTATION READY**

---

## 1. Executive Summary
Phase 6 builds the **Insights & Life Intelligence Layer** of MyLife.
This layer acts as a computed, read-only intelligence system that aggregates and synthesizes information from all previous domains (Areas, Goals, Objectives, Projects, Milestones, Stages, Tasks, Sessions, DailyFocus, Reviews, Captures, CalendarEvents, and Activities).

### Critical Ground Rules
1. **AI is Strictly FROZEN**: Zero modifications to AI Agent Foundation, LLM prompts, planners, or agents. All intelligence is 100% deterministic, explainable, testable, and reproducible.
2. **Insights are NOT the Source of Truth**: Insights compute read-only views over existing authoritative models. No persistent summary or analytics cache tables are needed.
3. **Database Migrations**: ZERO migrations required. The existing Target Schema (v1.1) contains all required entities (`Task`, `Goal`, `Area`, `Project`, `Milestone`, `Stage`, `Session`, `DailyFocus`, `Review`, `Capture`, `CalendarEvent`, `Activity`, `Notification`).

---

## 2. Current Architecture & Foundation Audit
- **Architecture Stack**: Next.js 16 (App Router) + Turbopack + TypeScript + TailwindCSS + Prisma + PostgreSQL (Supabase).
- **Layering Pattern**:
  `UI -> API Route Handler -> Zod Validation -> Service Layer -> Repository Layer -> Prisma Client -> PostgreSQL`
- **Ownership Verification**: All operations authenticate via signed session token (`ppos_session`) using `requireCurrentUser(request)`. All queries enforce user-scoping (`where: { userId }`).
- **Baseline Test Suite Status**: 23/23 test files passing, 240/240 tests passing, 0 TypeScript errors, 0 ESLint errors/warnings, production build PASS.

---

## 3. Existing Models & Reusable Capabilities

| Domain Model | Key Fields Used by Insights | Existing Repository / Service |
| :--- | :--- | :--- |
| **Task** | `status`, `priority`, `dueDate`, `scheduledDate`, `estimatedHours`, `actualHours`, `startedAt`, `completedAt` | `task.repository.ts`, `task.service.ts` |
| **Goal** | `id`, `title`, `status`, `targetDate`, `areaId`, `stages`, `projects`, `objectives` | `goal.repository.ts`, `goal.service.ts` |
| **Area** | `id`, `name`, `color`, `goals`, `projects` | `area.repository.ts`, `area.service.ts` |
| **Project** | `id`, `title`, `status`, `goalId`, `areaId`, `milestones`, `tasks` | `project.repository.ts`, `project.service.ts` |
| **Milestone** | `id`, `title`, `status`, `dueDate`, `projectId`, `tasks` | `milestone.repository.ts`, `milestone.service.ts` |
| **Session** | `startedAt`, `endedAt`, `durationMinutes`, `taskId`, `understanding`, `obstacle` | `session.repository.ts`, `session.service.ts` |
| **DailyFocus**| `date`, `taskId`, `order` | `daily-focus.repository.ts`, `daily-focus.service.ts` |
| **Review** | `periodStart`, `periodEnd`, `learningHours`, `tasksCompleted`, `understanding` | `review.repository.ts`, `review.service.ts` |
| **Capture** | `content`, `category`, `status` (`PENDING`, `PROCESSED`, `ARCHIVED`) | `capture.repository.ts`, `capture.service.ts` |
| **CalendarEvent** | `title`, `startTime`, `endTime`, `eventType`, `taskId`, `projectId` | `calendar-event.repository.ts`, `calendar-event.service.ts` |
| **Activity** | `title`, `category`, `startTime`, `endTime`, `durationMinutes`, `taskId` | `activity.repository.ts`, `activity.service.ts` |
| **Notification** | `title`, `message`, `type`, `severity`, `isRead`, `createdAt` | Prisma client (`prisma.notification`) |

---

## 4. Gap & Risk Analysis

### Gaps Identified:
1. **Analytics Scope**: The existing `analytics.service.ts` only aggregates tasks under Goal stages. Tasks originating from Projects, Milestones, or Areas are omitted from legacy analytics.
   *Resolution*: Retain legacy `buildAnalytics` for backward compatibility, while building a unified `comprehensive-analytics.service.ts` that includes multi-track tasks, goals, areas, activities, and sessions.
2. **Priority Engine Absence**: Task ordering in `/tasks` and `/today` is currently manual or by status/date. No deterministic scoring engine exists to rank tasks based on overdue state, due dates, priority weight, focus membership, and goal links.
   *Resolution*: Build pure-function `smart-priority.engine.ts` with clear mathematical weights and transparent explainable reason strings.
3. **Daily Plan Absence**: Currently `/today` displays focus tasks and general tasks without intelligent recommendation synthesis.
   *Resolution*: Build `daily-plan.service.ts` composing active session, focus items, top recommended items, scheduled time blocks, and detected conflicts.
4. **Time Conflict Detection Absence**: No conflict detection between `CalendarEvent` intervals or between active sessions and scheduled events.
   *Resolution*: Build `conflict-detection.engine.ts` with strict interval comparison (`startA < endB && endA > startB`).
5. **Unified Inbox Absence**: Captures, overdue tasks, and pending reviews are fragmented across separate screens.
   *Resolution*: Build `unified-inbox.service.ts` aggregating pending captures, overdue tasks, missing reviews, and conflicts into an action-oriented queue.
6. **Life Health Calculation Absence**: No holistic operational metric of user progress, balance, and execution health.
   *Resolution*: Build `life-health.engine.ts` scoring goal progress, task completion, overdue burden, consistency, and area balance (0-100 score with explainable warnings and strengths).

### Risks & Mitigations:
- **Risk: N+1 Database Queries**: Calculating multiple intelligence metrics could trigger excessive database calls.
  *Mitigation*: Implement `insights.repository.ts` which uses parallel batched queries with targeted `select` / `include` to fetch user context in a single aggregation pass.
- **Risk: Timezone Offsets**: Day/week/month boundaries could shift if `new Date()` is instantiated naively.
  *Mitigation*: Implement standardized timezone-safe window helpers (`getInsightDateRange(period, customStart, customEnd)`).
- **Risk: Regressing Phase 0-5 Tests**: Modifying existing functions could break prior tests.
  *Mitigation*: Keep all existing service functions intact and append new insights modules in dedicated files under `src/services/insights/` and `src/repositories/insights.repository.ts`.

---

## 5. Architecture & Implementation Plan

### Module Structure:
```
src/
  schemas/
    insights.schema.ts
  repositories/
    insights.repository.ts
  services/
    insights/
      insights-types.ts
      analytics-insights.service.ts
      smart-priority.engine.ts
      conflict-detection.engine.ts
      daily-plan.service.ts
      unified-inbox.service.ts
      life-health.engine.ts
      insights.service.ts
  app/
    api/
      insights/
        analytics/route.ts
        priority/route.ts
        daily-plan/route.ts
        conflicts/route.ts
        inbox/route.ts
        life-health/route.ts
    (app)/
      insights/
        page.tsx
        InsightsDashboard.tsx
```

### Module Specifications:

#### 1. Module A — Comprehensive Analytics (`analytics-insights.service.ts`)
- Computes `AnalyticsSummary` for period (`today`, `this_week`, `this_month`, `custom`):
  - Goals: total, active, completed, completion rate.
  - Tasks: total, pending, in progress, completed, overdue, multi-track distribution.
  - Sessions: count, total minutes/hours, average session duration, average understanding.
  - Activities: count, total duration, category distribution (`WORK`, `LEARNING`, `HEALTH`, etc.).
  - Trends: daily time & task completion progression.
  - Area Progress: goal and task distribution per Area.

#### 2. Module B — Smart Priority Engine (`smart-priority.engine.ts`)
- Pure function: `calculateTaskPriority(task, context) -> { score, reasons }`.
- Scoring rules:
  - Overdue: `+50` + `min(overdueDays * 5, 25)` -> Reason: `"Terlambat X hari"`
  - Due today: `+40` -> Reason: `"Jatuh tempo hari ini"`
  - Due soon (1-3 days): `+25` -> Reason: `"Jatuh tempo segera (X hari lagi)"`
  - In DailyFocus today: `+30` -> Reason: `"Masuk Daily Focus hari ini"`
  - Status IN_PROGRESS: `+20` -> Reason: `"Sedang dalam proses pengerjaan"`
  - Priority weight: `URGENT` (+30), `HIGH` (+20), `MEDIUM` (+10), `LOW` (+0)
  - Goal / Project connection: `+10` -> Reason: `"Mendukung Goal/Project aktif"`
  - Completed / Cancelled: Excluded from active ranking.

#### 3. Module C — Daily Plan (`daily-plan.service.ts`)
- Deterministic read-only recommendation:
  - Active Session (if any)
  - Focus Tasks (from `DailyFocus`)
  - Recommended Next Actions (top uncompleted tasks from Smart Priority not in focus)
  - Scheduled Agenda (from `CalendarEvent` for today)
  - Overdue alerts
  - Time conflicts detected for today
  - Workload estimate (sum of estimated hours)

#### 4. Module D — Conflict Detection Engine (`conflict-detection.engine.ts`)
- Pure interval comparison:
  - Overlap condition: `Math.max(startA, startB) < Math.min(endA, endB)`.
  - Touching boundary (`endA === startB`) is explicitly NOT a conflict.
  - Detects:
    1. `EVENT_OVERLAP`: Two or more calendar events overlapping in time.
    2. `SESSION_EVENT_COLLISION`: Current active session colliding with a scheduled calendar event.
    3. `DOUBLE_BOOKING`: Identical start and end times.
- Returns `TimeConflict[]` with involved entity metadata, severity, and human-readable explanation.

#### 5. Module E — Unified Inbox (`unified-inbox.service.ts`)
- Aggregates actionable items:
  1. `CAPTURE`: Pending items (`status === "PENDING"`) -> `/capture`
  2. `TASK`: Overdue tasks (`dueDate < now && status !== "COMPLETED"`) -> `/today`
  3. `REVIEW`: Missing weekly review when week has passed mid-point -> `/reviews`
  4. `CONFLICT`: Active calendar/session conflicts -> `/calendar`
  5. `NOTIFICATION`: Unread notifications -> notification link
- Sorts by priority/severity (`URGENT` -> `HIGH` -> `MEDIUM` -> `LOW`) and timestamp.

#### 6. Module F — Life Health Engine (`life-health.engine.ts`)
- Deterministic 0-100 composite index:
  - Task Completion (max 25 pts)
  - Overdue Burden Penalty (max 20 pts deducted if high overdue)
  - Execution Consistency / Streaks (max 20 pts)
  - Focus Session Activity (max 15 pts)
  - Goal Progress (max 10 pts)
  - Area Balance (max 10 pts)
- Status: `EXCELLENT` (>=85), `GOOD` (>=70), `ATTENTION` (>=50), `CRITICAL` (<50).
- Transparent `strengths` and `warnings` generated from threshold evaluations.

---

## 6. Timezone Strategy
- Local day boundaries: `start` at 00:00:00.000, `end` at 23:59:59.999.
- Week bounds: Monday 00:00:00 to Sunday 23:59:59.999 (matches existing `getWeekPeriod`).
- Month bounds: 1st of month 00:00:00 to last day 23:59:59.999.
- Unit tests will test boundary edge cases (midnight, end-of-day, week transitions).

---

## 7. Security & IDOR Strategy
- Every API endpoint requires authentication via `requireCurrentUser(request)`.
- Client-supplied `userId` is strictly ignored.
- All database queries filter strictly by authenticated `userId`.
- Cross-user tests in `tests/phase6.integration.test.ts` will verify that User A's insights, priority list, daily plan, conflicts, and inbox contain ZERO data from User B.

---

## 8. Test Strategy
Create `tests/phase6.integration.test.ts` verifying:
1. Analytics calculation on empty, partial, and full multi-track data.
2. Smart Priority scoring, deterministic sorting, and reason generation.
3. Daily Plan composition with focus, recommendations, calendar events, and active session.
4. Conflict detection for event overlaps, boundary touches (no conflict), and active session collision.
5. Unified Inbox aggregation across captures, overdue tasks, missing reviews, and conflicts.
6. Life Health calculation: empty user baseline, healthy user, overdue-heavy penalty, explainability.
7. Strict cross-user isolation and security enforcement.
8. Regression: Ensure all 23 prior test suites (240 tests) remain 100% PASS.

---

## 9. Conclusion
The audit confirms that the database and existing domain foundations are 100% ready for Phase 6. No schema migration is needed. AI remains strictly frozen. Proceed immediately with implementation.
