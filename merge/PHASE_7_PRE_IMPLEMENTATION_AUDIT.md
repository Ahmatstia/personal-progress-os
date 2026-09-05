# MYLIFE — PHASE 7 PRE-IMPLEMENTATION AUDIT
# Proactive Life OS — Notifications, Reminders, Automation & Data Sovereignty
# Product Identity: MyLife | Technical Foundation: MyProgress

**Audit Date**: September 4, 2026  
**Auditor**: Senior Full-Stack Architect + Security Engineer  
**Status**: **AUDIT COMPLETE — IMPLEMENTATION READY**  
**AI Foundation**: **STRICTLY FROZEN**

---

## 1. Executive Summary & Objective

Phase 7 transitions MyLife from a system that passively displays data into a **proactive Personal Life Operating System**. The system will anticipate user needs by delivering deterministic reminders, detecting impending deadlines, providing a centralized Notification Center, proactive alerts on the Today screen, and establishing **Data Sovereignty** through full user data export capabilities.

Per the master prompt instructions, this pre-implementation audit examines the active repository (`d:\IT\web\merge\MyProgres`), existing schema models, database indexes, timezone semantics, and idempotency guarantees **before any implementation code is written**.

---

## 2. Codebase & Database Audit Findings

### 2.1 Notification Model in Database
The PostgreSQL database (Supabase) already contains the `Notification` table from the Phase 3 target schema migration:
```prisma
model Notification {
  id         String               @id @default(cuid())
  userId     String
  title      String
  message    String
  type       NotificationType     @default(SYSTEM)
  severity   NotificationSeverity @default(INFO)
  isRead     Boolean              @default(false)
  readAt     DateTime?
  linkUrl    String?
  entityType String?
  entityId   String?
  createdAt  DateTime             @default(now())

  user       User                 @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, createdAt])
  @@index([userId, createdAt])
}
```

#### Enums in Prisma:
- **`NotificationType`**: `TASK_DUE`, `DAILY_FOCUS_REMINDER`, `WEEKLY_REVIEW_REMINDER`, `CALENDAR_EVENT`, `MILESTONE_DEADLINE`, `SYSTEM`.
- **`NotificationSeverity`**: `INFO`, `WARNING`, `URGENT`.

**Audit Finding**: The existing `Notification` model is 100% complete and contains all required structural attributes (`entityType`, `entityId`, `severity`, `isRead`, `readAt`, `linkUrl`). **No database migration is required for the Notification table.**

### 2.2 User Preferences (`UserPreference`)
```prisma
model UserPreference {
  id                  String   @id @default(cuid())
  userId              String   @unique
  theme               Theme    @default(SYSTEM)
  weekStartDay        Int      @default(1)
  dailyFocusLimit     Int      @default(5)
  enableNotifications Boolean  @default(true)
  enableAiAssistance  Boolean  @default(true)
  timezone            String   @default("Asia/Jakarta")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```
- `enableNotifications` provides the master kill-switch for all proactive notifications.
- `timezone` provides the canonical user timezone for date calculations.

### 2.3 Other Source Domains
- **Tasks (`Task`)**: Contain `dueDate`, `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `status` (`BACKLOG`, `TODO`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `CANCELLED`).
- **Calendar Events (`CalendarEvent`)**: Contain `startTime`, `endTime`, `isAllDay`, `eventType`, `recurrence`.
- **Sessions (`Session`)**: Single active session enforced by partial unique index `idx_unique_active_session_per_user`.
- **Daily Focus (`DailyFocus`)**: Contains `date`, `completed`, `taskId`.
- **Reviews (`Review`)**: Contains `periodStart`, `periodEnd`.
- **Activities (`Activity`)**: Historical logs created upon session completion.

---

## 3. Explicit Audit Questions & Architectural Decisions

### 1. Apa yang sudah tersedia?
- Prisma model `Notification` and enums `NotificationType`, `NotificationSeverity` in PostgreSQL.
- Database indexes `@@index([userId, isRead, createdAt])` and `@@index([userId, createdAt])`.
- `UserPreference` with `enableNotifications` and `timezone`.
- Active database records across 16 models.
- Baseline of 24 test suites with 255/255 passing tests.

### 2. Apa yang harus ditambah?
- Notification Repository: `src/repositories/notification.repository.ts`.
- Notification Service: `src/services/notification.service.ts`.
- Notification Zod Schemas: `src/schemas/notification.schema.ts`.
- Notification API Routes:
  - `GET /api/notifications` (list with filtering & pagination)
  - `GET /api/notifications/unread-count` (fast unread count)
  - `PATCH /api/notifications/[id]/read` (mark single notification as read)
  - `PATCH /api/notifications/read-all` (mark all user notifications as read)
  - `DELETE /api/notifications/[id]` (delete user notification)
- Reminder & Automation Engines:
  - `src/services/reminder.service.ts`: Deterministic reminder engine.
  - `src/services/automation.service.ts`: Lightweight rule-condition-action engine.
- API Route for Reminder Trigger:
  - `POST /api/notifications/reminders/trigger`: Authenticated, user-scoped cycle execution.
- Notification Center UI:
  - `src/app/(app)/notifications/page.tsx` & `NotificationCenter.tsx`.
- Shell & Navigation Updates:
  - Bell icon with unread count badge in `Sidebar.tsx`.
- Today Screen Integration:
  - Proactive "Needs Attention" compact section in `src/app/(app)/today/page.tsx`.
- Settings & Data Sovereignty:
  - Export Service: `src/services/data-export.service.ts`.
  - Export Route: `GET /api/settings/export` (downloads sanitized JSON).
  - Data Export UI button in `src/app/(app)/settings/page.tsx`.
- Integration & IDOR Tests:
  - `tests/phase7.proactive.test.ts`.

### 3. Apa yang bisa direuse?
- Existing `Notification` table without schema modifications.
- Existing `UserPreference` table and repository.
- Existing domain repositories (`task.repository`, `calendar-event.repository`, `daily-focus.repository`, `review.repository`, `session.repository`).
- Existing authentication and ownership verification (`requireCurrentUser`, `requirePageUser`, `requireUserId`).
- Existing UI design system and components (`PageHeader`, `StatRow`, `Icon`, `Toast`).

### 4. Apa yang tidak boleh disentuh?
- **AI Agent Foundation**: `src/ai/**` and `tests/ai.*` remain **STRICTLY FROZEN**. No LLM, no AI priority, no prompt dependencies.
- Phase 3 schema constraints: `chk_task_parent` and `idx_unique_active_session_per_user`.
- Core domain relationships and ownership rules.

### 5. Apakah migration diperlukan?
- **DECISION: TIDAK ADA MIGRATION (0 MIGRATIONS).**
- **Justification**:
  1. The `Notification` table already exists in PostgreSQL with all necessary columns (`id`, `userId`, `title`, `message`, `type`, `severity`, `isRead`, `readAt`, `linkUrl`, `entityType`, `entityId`, `createdAt`).
  2. `UserPreference` already has `enableNotifications` as the master switch and `timezone` for timezone semantics.
  3. Quiet hours and granular notification toggles can be handled cleanly with structured defaults and in-memory/service configuration without risking database schema drift or migration failures on Supabase.

### 6. Apakah scheduler sudah tersedia?
- There is no Redis, Celery, or background worker daemon running in this modular monolith environment.
- Following Section 26 of the master prompt, we implement a self-contained, callable service: `runReminderCycle(userId, options)`.
- It can be triggered deterministically during relevant user interactions (e.g., loading the Today page or Notifications center) and via an authenticated API endpoint (`POST /api/notifications/reminders/trigger`).
- This design allows easy attachment of external cron services (e.g., Vercel Cron, Supabase pg_cron, or GitHub Actions) in the future without architectural refactoring.

### 7. Bagaimana reminder diproses?
- Reminders are processed by pure deterministic rules:
  1. **User Check**: Check if `userPreference.enableNotifications` is `true`. If `false`, abort immediately.
  2. **Quiet Hours Check**: Evaluate if current local time is within quiet hours (e.g. 22:00 - 07:00). Non-critical (`INFO`) notifications are suppressed from immediate alerting.
  3. **Task Reminders**:
     - Tasks due today -> Create `TASK_DUE` notification (`severity: INFO`, or `WARNING` if task priority is `HIGH`/`URGENT`).
     - Overdue open tasks -> Create `TASK_DUE` notification (`severity: WARNING`, or `URGENT` if `URGENT`).
  4. **Calendar Reminders**:
     - Events starting within 15 minutes -> Create `CALENDAR_EVENT` notification (`severity: INFO`).
  5. **Daily Focus Reminders**:
     - If user has incomplete daily focus items in the afternoon/evening -> Create `DAILY_FOCUS_REMINDER` notification (`severity: INFO`).
  6. **Weekly Review Reminders**:
     - If user has not completed weekly review by Friday/weekend -> Create `WEEKLY_REVIEW_REMINDER` notification (`severity: INFO`).

### 8. Bagaimana duplicate notification dicegah (Idempotency)?
- Before inserting any notification, the reminder engine checks for existing notifications matching the logical entity and timeframe:
  - **Task Due / Overdue**: Query `findFirst({ where: { userId, type: "TASK_DUE", entityId: task.id, createdAt: { gte: startOfDay, lte: endOfDay } } })`. Only one task notification is generated per task per day.
  - **Calendar Event**: Query `findFirst({ where: { userId, type: "CALENDAR_EVENT", entityId: event.id } })`. Only one reminder is generated per calendar event instance.
  - **Daily Focus**: Query `findFirst({ where: { userId, type: "DAILY_FOCUS_REMINDER", entityId: dateStr } })`. Only one focus reminder per date.
  - **Weekly Review**: Query `findFirst({ where: { userId, type: "WEEKLY_REVIEW_REMINDER", entityId: weekIdentifier } })`. Only one review reminder per week.
- This guarantees **100% idempotency**. Executing `runReminderCycle()` repeatedly will produce zero duplicate notifications.

### 9. Bagaimana timezone user ditentukan?
- Extracted from `UserPreference.timezone` (defaults to `"Asia/Jakarta"`).
- All date boundaries (`startOfDay`, `endOfDay`, `isQuietHours`) are evaluated with timezone awareness using JavaScript `Intl.DateTimeFormat` and UTC conversions.

### 10. Bagaimana data retention dilakukan?
- Read notifications older than a retention threshold (e.g., 30 days) can be pruned via `pruneOldNotifications(userId, daysToKeep = 30)`.
- Unread notifications are retained indefinitely until acknowledged or deleted by the user.

### 11. Bagaimana user mematikan proactive behavior?
- Setting `enableNotifications: false` in `UserPreference` instantly halts `runReminderCycle()` for that user, ensuring zero proactive notifications are generated.

---

## 4. Implementation Plan & File Inventory

### Files to Create:
1. `src/schemas/notification.schema.ts` — Zod schemas for notification queries and actions.
2. `src/repositories/notification.repository.ts` — User-scoped database CRUD operations for notifications.
3. `src/services/notification.service.ts` — Notification business logic (list, count, read, read-all, delete, prune).
4. `src/services/reminder.service.ts` — Deterministic, idempotent reminder cycle engine.
5. `src/services/automation.service.ts` — Lightweight deterministic event hooks (e.g. on session end, on task completion).
6. `src/services/data-export.service.ts` — Complete user data sovereignty export service.
7. `src/app/api/notifications/route.ts` — GET notifications list.
8. `src/app/api/notifications/unread-count/route.ts` — GET unread count.
9. `src/app/api/notifications/[id]/read/route.ts` — PATCH mark single notification as read.
10. `src/app/api/notifications/read-all/route.ts` — PATCH mark all as read.
11. `src/app/api/notifications/[id]/route.ts` — DELETE single notification.
12. `src/app/api/notifications/reminders/trigger/route.ts` — POST trigger reminder cycle.
13. `src/app/api/settings/export/route.ts` — GET download sanitized user data export JSON.
14. `src/app/(app)/notifications/page.tsx` — Notification Center page.
15. `src/app/(app)/notifications/NotificationCenter.tsx` — Interactive Client Component for Notification Center.
16. `src/app/components/core/NeedsAttentionCard.tsx` — Compact proactive widget for Today screen.
17. `tests/phase7.proactive.test.ts` — Vitest integration & security test suite for Phase 7.
18. `PHASE_7_IMPLEMENTATION_REPORT.md` — Final phase report upon completion.

### Files to Modify:
1. `src/app/components/ui/Icon.tsx` — Add `bell` icon SVG.
2. `src/app/components/shell/Sidebar.tsx` — Add Bell icon with unread badge count linking to `/notifications`.
3. `src/app/(app)/today/page.tsx` — Integrate `NeedsAttentionCard` proactive widget.
4. `src/app/(app)/settings/page.tsx` — Add Data Sovereignty Export section with download action.

---

## 5. Security & Isolation Strategy

1. **Authentication**: All notification and export endpoints call `requireCurrentUser(request)`.
2. **Fail-Closed IDOR Prevention**: Every repository query filters explicitly by `userId`. An attempt by User B to read, mark as read, or delete User A's notification returns `404 / NOT_FOUND`.
3. **Data Export Sanitization**: The export service strips `passwordHash`, session secrets, tokens, and any external relations, ensuring 100% data sovereignty without exposing infrastructure credentials.

---

## 6. Verification & Quality Gates

The implementation will be verified against the strict quality gates:
1. `npm test` — All 24 existing test suites + Phase 7 integration test suite must PASS.
2. `npm run typecheck` — 0 TypeScript errors.
3. `npm run lint` — 0 ESLint errors/warnings.
4. `npm run build` — Successful Next.js production build.
5. `npx prisma validate` & `npx prisma migrate status` — Valid and clean.
6. AI code remains **FROZEN**.

---

**AUDIT STATUS: PASSED & IMPLEMENTATION READY**
