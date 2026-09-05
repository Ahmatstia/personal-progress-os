# MYLIFE TARGET SCHEMA & DATA MODEL SPECIFICATION
## Phase 2 — Database Architecture & Data Model Source of Truth v1.1
### Revised & Locked Specification

> **Status:** FINAL SPECIFICATION APPROVED FOR REVIEW — DESIGN ONLY (NO CODE / NO MIGRATIONS APPLIED)  
> **Technical Foundation:** MyProgress (Next.js App Router, Prisma ORM, PostgreSQL)  
> **Product Identity:** MyLife (Personal Life Operating System)  
> **Author:** Senior Software Architect & Database Architect  
> **Version:** 1.1 (Phase 2 Revision: Locked Decisions, Active Session Constraint, Parent Consistency, Reconciled Delete Semantics)  
> **Date:** September 2026  

---

## 1. EXECUTIVE SUMMARY

This specification defines the complete database schema and entity relationship model for **MyLife**, built upon the production-tested technical foundation of **MyProgress**.

In accordance with Phase 1 (`MYLIFE_MASTER_ARCHITECTURE.md`) and the Phase 2 Revision requirements, this document serves as the absolute source of truth for:
1. **Core Domain:** `User`, `UserPreference`
2. **Life Domain:** `Area`, `Goal`, `Objective`, `Project`
3. **Progress Domain:** `Stage`, `Milestone`, `Task`, `Session`, `DailyFocus`, `Review`
4. **Time Domain:** `CalendarEvent`, `Activity`
5. **Capture Domain:** `Capture`
6. **Notifications Domain:** `Notification`
7. **Insights & AI Domains:** Purely computed/derived services; zero persistent database bloat.
8. **Finance Domain:** Isolated boundary; zero foreign key coupling.

### Locked Architectural Decisions:
- **`Task.title` & `Goal.title`:** Both entities use `title` (migrated from `name`) for unified naming consistency.
- **`Goal.areaId`:** Remains optional (`String?`) at schema level to preserve low-friction goal creation while encouraging organizational categorization in UI.
- **`Task.goalId`:** Denormalized shortcut foreign key retained on `Task` for performant goal-level queries without multi-table joins.
- **Enforced Single Active Session:** Database-level partial unique index guarantees that a user can have at most one active session (`endedAt IS NULL`).
- **Strict Task Parent Consistency:** A task must have at least one structural parent (`stageId`, `milestoneId`, `projectId`, or `areaId`). Multiple parents must be semantically coherent and belong to the same user.
- **Harmonized Delete Semantics:** All delete behaviors across foreign keys have been reconciled to eliminate contradictions.
- **Typed Enums Everywhere:** 17 typed Prisma enums codified, including `Theme` (`LIGHT`, `DARK`, `SYSTEM`).

---

## 2. SCHEMA PRINCIPLES

1. **Explicit Multi-Tenant Isolation by Default:** Every domain table contains `userId String` referencing `User.id` with `onDelete: Cascade`. No entity relies purely on parent traversal to determine ownership.
2. **Referential Integrity without Destructive Cascades:**
   - Deleting a `Goal` cascades to its `Stages` and learning `Tasks`.
   - Deleting a `Goal` unlinks (`SetNull`) attached `Projects` and their deliverable `Tasks`, preventing accidental destruction of tangible deliverables.
   - Deleting a `Milestone` unlinks (`SetNull`) its tasks so they remain within the parent `Project`.
   - Deleting an `Area` is restricted (`Restrict`) if active `Goals` reference it.
3. **Zero Orphaned Execution:** Tasks represent actionable focus. A task without a structural parent is forbidden at both the database level (CHECK constraint) and service layer.
4. **Single Source of Truth:** Analytics, LifeHealth, SmartPriority, DailyPlan, and ConflictDetection are strictly computed on-the-fly; no redundant, drift-prone summary tables are persisted.
5. **Separation of Planning vs Execution vs Historical Audit:**
   - Planning: `Goal`, `Objective`, `Project`, `Stage`, `Milestone`, `CalendarEvent`
   - Execution: `Task`, `Session`, `DailyFocus`
   - Historical Audit & Reflection: `Activity`, `Review`

---

## 3. COMPLETE MODEL INVENTORY

The target schema consists of **16 database models** and **17 typed enums**.

### Target Models Summary

| # | Model | Domain | Source | Action | Primary Key | Parent Relation |
|---|---|---|---|---|---|---|
| 1 | `User` | Core | MyProgress | KEEP + EXTEND | `id` (cuid) | None (Root) |
| 2 | `UserPreference` | Core | Legacy MyLife | REBUILD | `id` (cuid) | `User` (1:1) |
| 3 | `Area` | Life | Legacy MyLife | REBUILD | `id` (cuid) | `User` (1:N) |
| 4 | `Goal` | Life | MyProgress | KEEP + EXTEND + RENAME | `id` (cuid) | `User`, `Area?` |
| 5 | `Objective` | Life | Legacy MyLife | REBUILD | `id` (cuid) | `User`, `Goal` |
| 6 | `Project` | Life | Legacy MyLife | REBUILD | `id` (cuid) | `User`, `Goal?`, `Area?` |
| 7 | `Stage` | Progress | MyProgress | KEEP + EXTEND | `id` (cuid) | `User`, `Goal` |
| 8 | `Milestone` | Progress | Legacy MyLife | REBUILD | `id` (cuid) | `User`, `Project` |
| 9 | `Task` | Progress | MyProgress | KEEP + RESTRUCTURE | `id` (cuid) | `User`, `Stage?`, `Milestone?`, `Project?`, `Area?`, `Goal?` |
| 10 | `Session` | Progress | MyProgress | KEEP + EXTEND | `id` (cuid) | `User`, `Task` |
| 11 | `DailyFocus` | Progress | MyProgress | KEEP AS-IS | `id` (cuid) | `User`, `Task` |
| 12 | `Review` | Progress | MyProgress | KEEP + EXTEND | `id` (cuid) | `User`, `Goal` |
| 13 | `CalendarEvent` | Time | Legacy MyLife | REBUILD | `id` (cuid) | `User`, `Task?`, `Project?` |
| 14 | `Activity` | Time | Legacy MyLife | REBUILD | `id` (cuid) | `User`, `Task?`, `Project?`, `Area?` |
| 15 | `Capture` | Capture | MyProgress | KEEP + EXTEND | `id` (cuid) | `User` |
| 16 | `Notification` | Notifications | Legacy MyLife | REBUILD | `id` (cuid) | `User` |

---

## 4. MODEL-BY-MODEL SPECIFICATION

---

### Model: User

#### Purpose
Root identity and authorization anchor for all personal data. All queries filter by `userId`.

#### Ownership
Root entity. Authenticated via custom JWT stored in `httpOnly` secure cookies.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key, matches auth subject |
| `email` | String | Yes | - | Unique login email address |
| `passwordHash` | String? | No | - | Bcrypt password hash |
| `name` | String? | No | - | User display name |
| `avatarUrl` | String? | No | - | Profile image URL |
| `createdAt` | DateTime | Yes | now() | Account registration timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Profile update timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `preference` | UserPreference | 1:1 | No | Cascade |
| `areas` | Area[] | 1:N | No | Cascade |
| `goals` | Goal[] | 1:N | No | Cascade |
| `objectives` | Objective[] | 1:N | No | Cascade |
| `projects` | Project[] | 1:N | No | Cascade |
| `stages` | Stage[] | 1:N | No | Cascade |
| `milestones` | Milestone[] | 1:N | No | Cascade |
| `tasks` | Task[] | 1:N | No | Cascade |
| `sessions` | Session[] | 1:N | No | Cascade |
| `dailyFocuses` | DailyFocus[] | 1:N | No | Cascade |
| `reviews` | Review[] | 1:N | No | Cascade |
| `calendarEvents`| CalendarEvent[]| 1:N | No | Cascade |
| `activities` | Activity[] | 1:N | No | Cascade |
| `captures` | Capture[] | 1:N | No | Cascade |
| `notifications` | Notification[] | 1:N | No | Cascade |

#### Indexes
- `@@unique([email])`

#### Unique Constraints
- `email` is globally unique.

---

### Model: UserPreference

#### Purpose
Stores user-level UI, scheduling, and notification configuration separate from authentication identity.

#### Ownership
Direct `userId` ownership. 1:1 relation with `User`.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Foreign key to User |
| `theme` | Theme | Yes | SYSTEM | Enum: LIGHT, DARK, SYSTEM |
| `weekStartDay` | Int | Yes | 1 | 0 = Sunday, 1 = Monday |
| `dailyFocusLimit`| Int | Yes | 5 | Max recommended daily focus items |
| `enableNotifications` | Boolean | Yes | true | Master push/in-app notification toggle |
| `enableAiAssistance` | Boolean | Yes | true | Master toggle for AI insight generation |
| `timezone` | String | Yes | "Asia/Jakarta"| User IANA timezone identifier |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | 1:1 (Child) | Yes | Cascade on User delete |

#### Indexes
- `@@unique([userId])`

---

### Model: Area

#### Purpose
Represents permanent life spheres/dimensions (e.g., Health, Career, Wealth, Personal Growth, Family) that classify Goals, Projects, and Activities.

#### Ownership
Direct `userId` ownership.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `name` | String | Yes | - | Dimension name (e.g. "Career & Tech") |
| `description`| String? | No | - | Purpose statement for this area |
| `color` | String | Yes | "#6366f1" | Hex color for badges and chart visualization |
| `icon` | String | Yes | "compass" | Lucide icon identifier |
| `order` | Int | Yes | 0 | Display sequence in navigation/dashboard |
| `isActive` | Boolean | Yes | true | Soft-archive flag (hides inactive areas) |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Update timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `goals` | Goal[] | 1:N | No | Restrict (cannot delete area if it has active goals) |
| `projects` | Project[] | 1:N | No | SetNull |
| `tasks` | Task[] | 1:N | No | SetNull |
| `activities`| Activity[] | 1:N | No | SetNull |

#### Indexes
- `@@index([userId, order])`
- `@@index([userId, isActive])`
- `@@unique([userId, name])` (Area names must be unique per user)

---

### Model: Goal

#### Purpose
Long-term strategic aspiration or learning quest. Serves as the umbrella for Stages, Projects, Objectives, and periodic Reviews.

#### Ownership
Direct `userId` ownership. Optional parent `Area` (`areaId String?` is locked as optional).

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `areaId` | String? | No | - | Optional Area container (LOCKED as optional) |
| `title` | String | Yes | - | Goal statement (migrated from `name`) |
| `description`| String? | No | - | Motivation, why this goal matters |
| `type` | GoalType | Yes | LEARNING | Enum: LEARNING, ACHIEVEMENT, HABIT, MAINTENANCE |
| `status` | GoalStatus | Yes | ACTIVE | Enum: ACTIVE, PAUSED, COMPLETED, CANCELLED, ARCHIVED |
| `priority` | Priority | Yes | MEDIUM | Enum: LOW, MEDIUM, HIGH, URGENT |
| `targetDate` | DateTime? | No | - | Target completion deadline |
| `completedAt`| DateTime? | No | - | When goal was officially marked completed |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `area` | Area | N:1 | No | Restrict |
| `stages` | Stage[] | 1:N | No | Cascade (Learning journey stages belong strictly to Goal) |
| `projects` | Project[] | 1:N | No | SetNull (Projects survive Goal deletion as standalone projects) |
| `objectives`| Objective[] | 1:N | No | Cascade |
| `reviews` | Review[] | 1:N | No | Cascade |
| `tasks` | Task[] | 1:N | No | SetNull (Shortcut FK unlinked; Goal-track tasks cascade via Stage) |

#### Indexes
- `@@index([userId, status])`
- `@@index([userId, areaId])`
- `@@index([userId, targetDate])`

---

### Model: Objective

#### Purpose
Specific, measurable key results or milestones attached directly to a Goal (OKR pattern: Objective / Key Result).

#### Ownership
Direct `userId` ownership + mandatory `goalId`.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `goalId` | String | Yes | - | Parent Goal ID |
| `title` | String | Yes | - | Measurable target statement |
| `description`| String? | No | - | Context or measurement criteria |
| `targetValue`| Float | Yes | 100.0 | Numerical target (e.g. 10 books, 100 km) |
| `currentValue`| Float | Yes | 0.0 | Current progress value |
| `unit` | String | Yes | "%" | Unit of measure (e.g. "km", "books", "score") |
| `status` | ObjectiveStatus | Yes | ACTIVE | Enum: ACTIVE, COMPLETED, CANCELLED |
| `dueDate` | DateTime? | No | - | Deadline for this objective |
| `completedAt`| DateTime? | No | - | Completion timestamp |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `goal` | Goal | N:1 | Yes | Cascade |

#### Indexes
- `@@index([userId, goalId])`
- `@@index([userId, status])`

---

### Model: Project

#### Purpose
A concrete body of work with defined scope and deliverables. Unlike a Stage, a Project has a defined finish line and can exist under a Goal, under an Area, or independently.

#### Ownership
Direct `userId` ownership. Optional `goalId` and `areaId`.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `goalId` | String? | No | - | Optional strategic Goal parent |
| `areaId` | String? | No | - | Optional Area parent |
| `title` | String | Yes | - | Project name |
| `description`| String? | No | - | Scope description and deliverables |
| `status` | ProjectStatus | Yes | PLANNING | Enum: PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED, ARCHIVED |
| `priority` | Priority | Yes | MEDIUM | Enum: LOW, MEDIUM, HIGH, URGENT |
| `startDate` | DateTime? | No | - | Planned or actual start date |
| `targetDate` | DateTime? | No | - | Target completion deadline |
| `completedAt`| DateTime? | No | - | Actual completion timestamp |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `goal` | Goal | N:1 | No | SetNull (Project survives Goal deletion) |
| `area` | Area | N:1 | No | SetNull |
| `milestones`| Milestone[] | 1:N | No | Cascade |
| `tasks` | Task[] | 1:N | No | Cascade (Deleting project cascades its tasks) |
| `calendarEvents` | CalendarEvent[] | 1:N | No | SetNull |
| `activities`| Activity[] | 1:N | No | SetNull |

#### Indexes
- `@@index([userId, status])`
- `@@index([userId, goalId])`
- `@@index([userId, areaId])`
- `@@index([userId, targetDate])`

---

### Model: Stage

#### Purpose
Represents a sequential learning or progression phase toward a Goal (MyProgress model). Stages define a journey (e.g. "Phase 1: Foundations", "Phase 2: Advanced").

#### Ownership
Direct `userId` ownership + mandatory `goalId`.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `goalId` | String | Yes | - | Parent Goal ID |
| `name` | String | Yes | - | Stage name (e.g. "Foundations") |
| `description`| String? | No | - | Learning objectives for this phase |
| `order` | Int | Yes | 0 | Sequence index (0, 1, 2...) |
| `status` | StageStatus | Yes | PENDING | Enum: PENDING, IN_PROGRESS, COMPLETED |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `goal` | Goal | N:1 | Yes | Cascade |
| `tasks` | Task[] | 1:N | No | Cascade |

#### Indexes
- `@@index([userId, goalId, order])`
- `@@index([userId, status])`

---

### Model: Milestone

#### Purpose
A critical checkpoint or gate inside a Project (Project-track). Groups tasks and measures project delivery milestones.

#### Ownership
Direct `userId` ownership + mandatory `projectId`.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `projectId` | String | Yes | - | Parent Project ID |
| `title` | String | Yes | - | Checkpoint title (e.g. "API V1 Frozen") |
| `description`| String? | No | - | Acceptance criteria |
| `order` | Int | Yes | 0 | Sequence within project |
| `status` | MilestoneStatus | Yes | PENDING | Enum: PENDING, IN_PROGRESS, COMPLETED, CANCELLED |
| `dueDate` | DateTime? | No | - | Target date for reaching this milestone |
| `completedAt`| DateTime? | No | - | Timestamp when milestone was achieved |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `project` | Project | N:1 | Yes | Cascade |
| `tasks` | Task[] | 1:N | No | SetNull (Deleting milestone un-milestones tasks; tasks survive in project) |

#### Indexes
- `@@index([userId, projectId, order])`
- `@@index([userId, status])`
- `@@index([userId, dueDate])`

---

### Model: Task

#### Purpose
The atomic unit of actionable work. Connects direction to execution. Must have at least one structural parent (`stageId`, `milestoneId`, `projectId`, or `areaId`).

#### Ownership
Direct `userId` ownership. Foreign keys validate user ownership of parents.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `title` | String | Yes | - | Actionable task title (LOCKED: migrated from `name`) |
| `description`| String? | No | - | Task notes, checklist, details |
| `type` | TaskType | Yes | TASK | Enum: TASK, LEARNING, BUG, IMPROVEMENT |
| `priority` | Priority | Yes | MEDIUM | Enum: LOW, MEDIUM, HIGH, URGENT |
| `status` | TaskStatus | Yes | TODO | Enum: BACKLOG, TODO, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED, ARCHIVED |
| `stageId` | String? | No | - | Structural parent (Goal-track learning phase) |
| `milestoneId`| String? | No | - | Structural parent (Project milestone checkpoint) |
| `projectId` | String? | No | - | Structural parent (Direct project task) |
| `areaId` | String? | No | - | Structural parent (Direct life area task) |
| `goalId` | String? | No | - | Denormalized shortcut FK (LOCKED: fast Goal lookup) |
| `estimatedHours` | Float | Yes | 0.0 | Estimated effort in hours |
| `actualHours` | Float | Yes | 0.0 | Accumulated effort in hours |
| `dueDate` | DateTime? | No | - | Hard calendar deadline |
| `scheduledDate` | DateTime? | No | - | Planned day of execution |
| `startedAt` | DateTime? | No | - | When first moved to IN_PROGRESS |
| `completedAt`| DateTime? | No | - | When moved to COMPLETED |
| `notes` | String? | No | - | Freeform work notes |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `stage` | Stage | N:1 | No | Cascade (Stage delete cascades its learning tasks) |
| `milestone` | Milestone | N:1 | No | SetNull (Milestone delete leaves task in Project) |
| `project` | Project | N:1 | No | Cascade (Project delete cascades all its tasks) |
| `area` | Area | N:1 | No | SetNull |
| `goal` | Goal | N:1 | No | SetNull (Unlinks shortcut FK; tasks cascade via Stage or survive via Project) |
| `sessions` | Session[] | 1:N | No | Cascade |
| `dailyFocuses`| DailyFocus[]| 1:N | No | Cascade |
| `calendarEvents`| CalendarEvent[] | 1:N | No | SetNull |
| `activities` | Activity[] | 1:N | No | SetNull |

#### Indexes
- `@@index([userId, status])`
- `@@index([userId, stageId])`
- `@@index([userId, milestoneId])`
- `@@index([userId, projectId])`
- `@@index([userId, goalId])`
- `@@index([userId, areaId])`
- `@@index([userId, dueDate])`
- `@@index([userId, scheduledDate])`

---

### Model: Session

#### Purpose
Records an active, focused work block on a specific Task (Pomodoro / Focus timer). Tracks cognitive learning metrics (understanding, obstacles, next actions).

#### Ownership
Direct `userId` ownership + mandatory `taskId`.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `taskId` | String | Yes | - | Parent Task ID |
| `startedAt` | DateTime | Yes | - | Session start timestamp |
| `endedAt` | DateTime? | No | - | Completion timestamp (null if currently active) |
| `durationMinutes` | Int? | No | - | Total duration in minutes |
| `activity` | String? | No | - | Summary of what was accomplished |
| `understanding` | Int? | No | - | Self-assessed comprehension rating (1 to 5) |
| `obstacle` | String? | No | - | Blockers or friction encountered |
| `nextAction`| String? | No | - | Next immediate step for future session |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `task` | Task | N:1 | Yes | Cascade |

#### Indexes & Unique Constraints
- `@@index([userId, taskId])`
- `@@index([userId, startedAt])`
- `@@index([userId, endedAt])`

#### Database-Level Active Session Enforcement Strategy
To strictly enforce that **at most ONE active session exists per user at any time**, a PostgreSQL Partial Unique Index must be created:
```sql
CREATE UNIQUE INDEX "idx_unique_active_session_per_user" 
ON "Session" ("userId") 
WHERE "endedAt" IS NULL;
```
> **Implementation Note:** Because native Prisma schema syntax does not currently express partial `WHERE` clauses on unique constraints, this partial index must be added via custom migration SQL (`migration.sql`) during schema implementation in Phase 3. The application service layer (`session.service.ts`) must additionally perform a preliminary check `findFirst({ where: { userId, endedAt: null } })` to provide user-friendly error messages before hitting the database constraint.

---

### Model: DailyFocus

#### Purpose
Tactical daily commitment queue. Represents the explicit 3-5 tasks chosen by the user for today's execution.

#### Ownership
Direct `userId` ownership + mandatory `taskId`.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `date` | DateTime | Yes | - | Target day (normalized to YYYY-MM-DD 00:00:00 UTC) |
| `taskId` | String | Yes | - | Focused Task ID |
| `order` | Int | Yes | 0 | Priority execution sequence (0 = highest) |
| `createdAt` | DateTime | Yes | now() | Timestamp when added to daily queue |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `task` | Task | N:1 | Yes | Cascade |

#### Indexes
- `@@unique([userId, date, taskId])` (Cannot add duplicate task on the same day)
- `@@index([userId, date, order])`
- `@@index([userId, taskId])`

---

### Model: Review

#### Purpose
Weekly reflection and synthesis engine for a Goal. Closes the learning feedback loop (MyProgress REVIEW -> IMPROVE cycle).

#### Ownership
Direct `userId` ownership + mandatory `goalId`.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `goalId` | String | Yes | - | Target Goal ID |
| `periodStart`| DateTime | Yes | - | Review cycle start date |
| `periodEnd` | DateTime | Yes | - | Review cycle end date |
| `learningHours` | Float | Yes | 0.0 | Aggregated focus hours during period |
| `tasksCompleted`| Int | Yes | 0 | Total tasks completed during period |
| `understanding` | Float? | No | - | Average comprehension score (1.0 to 5.0) |
| `wentWell` | String? | No | - | Wins and positive breakthroughs |
| `difficulties` | String? | No | - | Frustrations, bottlenecks, obstacles |
| `improvements` | String? | No | - | Concrete adjustments for next cycle |
| `nextFocus` | String? | No | - | Strategic priorities for upcoming week |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `goal` | Goal | N:1 | Yes | Cascade |

#### Indexes
- `@@unique([userId, goalId, periodStart, periodEnd])` (One review per goal per week)
- `@@index([userId, goalId])`
- `@@index([userId, periodStart])`

---

### Model: CalendarEvent

#### Purpose
Represents scheduled blocks of time on a timeline (meetings, deep work blocks, deadlines).

#### Ownership
Direct `userId` ownership. Optional links to Task and Project.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `title` | String | Yes | - | Event title |
| `description`| String? | No | - | Agenda, meeting notes |
| `startTime` | DateTime | Yes | - | Event start time |
| `endTime` | DateTime | Yes | - | Event end time |
| `isAllDay` | Boolean | Yes | false | All-day event flag |
| `eventType` | EventType | Yes | PERSONAL | Enum: PERSONAL, WORK, BLOCKED, REMINDER, TASK_DEADLINE |
| `recurrence` | RecurrenceType | Yes | NONE | Enum: NONE, DAILY, WEEKLY, MONTHLY |
| `location` | String? | No | - | Physical location or meeting link |
| `taskId` | String? | No | - | Optional linked Task |
| `projectId` | String? | No | - | Optional linked Project |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `task` | Task | N:1 | No | SetNull |
| `project` | Project | N:1 | No | SetNull |

#### Indexes
- `@@index([userId, startTime, endTime])`
- `@@index([userId, eventType])`
- `@@index([userId, taskId])`

---

### Model: Activity

#### Purpose
Historical log of how time was actually spent throughout life (work, study, fitness, rest). Powers time auditing and LifeHealth score.

#### Ownership
Direct `userId` ownership. Optional links to Task, Project, Area.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `title` | String | Yes | - | Description of activity performed |
| `category` | ActivityCategory| Yes | WORK | Enum: WORK, LEARNING, HEALTH_FITNESS, PERSONAL, REST, CHORE |
| `startTime` | DateTime | Yes | - | When activity began |
| `endTime` | DateTime | Yes | - | When activity ended |
| `durationMinutes` | Int | Yes | - | Total minutes spent |
| `productivityRating`| Int? | No | - | Subjective productivity (1 to 5) |
| `energyLevel` | Int? | No | - | Energy level after activity (1 to 5) |
| `notes` | String? | No | - | Contextual notes |
| `taskId` | String? | No | - | Optional associated Task |
| `projectId` | String? | No | - | Optional associated Project |
| `areaId` | String? | No | - | Optional associated Life Area |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |
| `task` | Task | N:1 | No | SetNull |
| `project` | Project | N:1 | No | SetNull |
| `area` | Area | N:1 | No | SetNull |

#### Indexes
- `@@index([userId, startTime, endTime])`
- `@@index([userId, category])`
- `@@index([userId, areaId])`
- `@@index([userId, taskId])`

---

### Model: Capture

#### Purpose
Frictionless inbox for raw thoughts, ideas, and tasks. Temporary holding area designed for quick triage.

#### Ownership
Direct `userId` ownership.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `content` | String | Yes | - | Unstructured raw text/note |
| `status` | CaptureStatus | Yes | PENDING | Enum: PENDING, PROCESSED, ARCHIVED |
| `category` | CaptureCategory| Yes | TASK_CANDIDATE | Enum: IDEA, TASK_CANDIDATE, NOTE, REMINDER |
| `convertedTaskId` | String? | No | - | ID of task created upon conversion |
| `convertedGoalId` | String? | No | - | ID of goal created upon conversion |
| `processedAt` | DateTime? | No | - | Timestamp when triaged |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |
| `updatedAt` | DateTime | Yes | @updatedAt | Modification timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |

#### Indexes
- `@@index([userId, status])`
- `@@index([userId, createdAt])`

---

### Model: Notification

#### Purpose
Event delivery and user alert log (e.g. task deadlines, review reminders, calendar alerts).

#### Ownership
Direct `userId` ownership.

#### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | String | Yes | cuid() | Primary key |
| `userId` | String | Yes | - | Owner ID |
| `title` | String | Yes | - | Notification title |
| `message` | String | Yes | - | Detailed notification message |
| `type` | NotificationType | Yes | SYSTEM | Enum: TASK_DUE, DAILY_FOCUS_REMINDER, WEEKLY_REVIEW_REMINDER, CALENDAR_EVENT, MILESTONE_DEADLINE, SYSTEM |
| `severity` | NotificationSeverity| Yes | INFO | Enum: INFO, WARNING, URGENT |
| `isRead` | Boolean | Yes | false | Read status flag |
| `readAt` | DateTime? | No | - | Timestamp when read |
| `linkUrl` | String? | No | - | In-app navigation URL on click |
| `entityType` | String? | No | - | Associated entity name (e.g. "Task", "Goal") |
| `entityId` | String? | No | - | Associated entity ID |
| `createdAt` | DateTime | Yes | now() | Creation timestamp |

#### Relationships

| Relation | Target | Cardinality | Required | Delete Behavior |
|---|---|---|---|---|
| `user` | User | N:1 | Yes | Cascade |

#### Indexes
- `@@index([userId, isRead, createdAt])`
- `@@index([userId, createdAt])`

---

## 5. FIELD SPECIFICATION & TYPE RULES

1. **Identifiers:** All entity primary keys use `String @id @default(cuid())` to prevent enumeration attacks and support offline ID generation.
2. **Timestamps:**
   - Standard audit: `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
   - Event markers: `completedAt`, `startedAt`, `endedAt`, `processedAt`, `readAt` are nullable `DateTime?`.
3. **Strings vs Enums:**
   - Freeform textual descriptions and names use `String` or `String?`.
   - All statuses, priorities, types, themes, and categories use strictly typed Prisma enums.
4. **Numbers:**
   - Hours (`estimatedHours`, `actualHours`, `learningHours`): `Float` with `@default(0.0)`.
   - Durations (`durationMinutes`): `Int`.
   - Order/Sequence: `Int` with `@default(0)`.
   - Rating scores (`understanding`, `energyLevel`, `productivityRating`): `Int?` (1 to 5 scale).

---

## 6. ENUM SPECIFICATION

| Enum Name | Values | Domain Meaning | Used By Model(s) |
|---|---|---|---|
| `Theme` | `LIGHT`, `DARK`, `SYSTEM` | User interface visual theme | `UserPreference` |
| `Priority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` | Operational urgency / importance | `Task`, `Project`, `Goal` |
| `GoalStatus` | `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED` | Lifecycle state of a long-term goal | `Goal` |
| `GoalType` | `LEARNING`, `ACHIEVEMENT`, `HABIT`, `MAINTENANCE` | Strategic intent and classification | `Goal` |
| `ObjectiveStatus` | `ACTIVE`, `COMPLETED`, `CANCELLED` | Execution status of key results | `Objective` |
| `ProjectStatus` | `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`, `ARCHIVED` | Execution phase of bounded project | `Project` |
| `StageStatus` | `PENDING`, `IN_PROGRESS`, `COMPLETED` | Progress through linear learning journey | `Stage` |
| `MilestoneStatus` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | Checkpoint status in a project | `Milestone` |
| `TaskStatus` | `BACKLOG`, `TODO`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `CANCELLED`, `ARCHIVED` | Actionable kanban workflow state | `Task` |
| `TaskType` | `TASK`, `LEARNING`, `BUG`, `IMPROVEMENT` | Nature of actionable work | `Task` |
| `CaptureStatus` | `PENDING`, `PROCESSED`, `ARCHIVED` | Inbox triage lifecycle | `Capture` |
| `CaptureCategory` | `IDEA`, `TASK_CANDIDATE`, `NOTE`, `REMINDER` | Initial intake classification | `Capture` |
| `EventType` | `PERSONAL`, `WORK`, `BLOCKED`, `REMINDER`, `TASK_DEADLINE` | Calendar schedule categorization | `CalendarEvent` |
| `RecurrenceType` | `NONE`, `DAILY`, `WEEKLY`, `MONTHLY` | Schedule recurrence rule | `CalendarEvent` |
| `ActivityCategory` | `WORK`, `LEARNING`, `HEALTH_FITNESS`, `PERSONAL`, `REST`, `CHORE` | Life time expenditure classification | `Activity` |
| `NotificationType` | `TASK_DUE`, `DAILY_FOCUS_REMINDER`, `WEEKLY_REVIEW_REMINDER`, `CALENDAR_EVENT`, `MILESTONE_DEADLINE`, `SYSTEM` | Origin event category | `Notification` |
| `NotificationSeverity` | `INFO`, `WARNING`, `URGENT` | Visual badge and alert prominence | `Notification` |

---

## 7. TASK PARENTING & CONSISTENCY RULES

### Mandatory Structural Parent Rule
A Task must NEVER be an orphan. At least one of the following four structural parent foreign keys must be non-null:
1. `stageId`: Task belongs to a learning journey stage under a Goal.
2. `milestoneId`: Task belongs to a milestone checkpoint inside a Project.
3. `projectId`: Task belongs directly to a Project (un-milestoned project task).
4. `areaId`: Task belongs directly to a Life Area (standalone maintenance/life task).

### Database-Level Check Constraint (PostgreSQL)
```sql
ALTER TABLE "Task" ADD CONSTRAINT "chk_task_parent"
CHECK (
  "stageId" IS NOT NULL OR 
  "milestoneId" IS NOT NULL OR 
  "projectId" IS NOT NULL OR 
  "areaId" IS NOT NULL
);
```

### Multi-Parent Semantic Consistency Rules
When multiple parent foreign keys are present on a `Task`, they must satisfy strict semantic coherence:

1. **Rule 1 (Stage Implies Goal):** If `stageId` is present, `task.goalId` MUST match the parent `Stage.goalId`. The task inherits its Goal context directly from the Stage.
2. **Rule 2 (Milestone Implies Project):** If `milestoneId` is present, `task.projectId` MUST be set and MUST match `Milestone.projectId`.
3. **Rule 3 (Project Implies Goal):** If `projectId` is present and the parent `Project` is linked to a `Goal` (`project.goalId != null`), `task.goalId` MUST match `project.goalId`. If the Project is independent (`project.goalId == null`), `task.goalId` MUST be NULL.
4. **Rule 4 (Cross-Track Mutual Exclusivity):** A Task CANNOT have both a `stageId` and a `projectId` (or `milestoneId`). A task is strictly either:
   - **Goal-Track:** Journey-based learning step (`stageId` set, `projectId = null`, `milestoneId = null`).
   - **Project-Track:** Output-based deliverable (`projectId` set, `stageId = null`).
5. **Rule 5 (Strict Ownership Matching):** Every entity referenced by `stageId`, `milestoneId`, `projectId`, `areaId`, or `goalId` MUST have `userId === task.userId`. Cross-user parent linking is an immediate security violation.

### Concrete Service-Layer Validator Implementation
```typescript
interface TaskParentValidationInput {
  userId: string;
  stageId?: string | null;
  milestoneId?: string | null;
  projectId?: string | null;
  areaId?: string | null;
  goalId?: string | null;
}

export async function validateTaskParents(
  prisma: PrismaClient,
  input: TaskParentValidationInput
): Promise<{ resolvedGoalId: string | null; resolvedProjectId: string | null }> {
  const { userId, stageId, milestoneId, projectId, areaId, goalId } = input;

  // 1. Mandatory Parent Check
  if (!stageId && !milestoneId && !projectId && !areaId) {
    throw new ValidationError("A task must belong to at least one structural parent (Stage, Milestone, Project, or Area).");
  }

  // 2. Cross-Track Conflict Check
  if (stageId && (projectId || milestoneId)) {
    throw new ValidationError("A task cannot simultaneously belong to a Goal Stage and a Project/Milestone. Choose one primary track.");
  }

  let resolvedGoalId: string | null = goalId ?? null;
  let resolvedProjectId: string | null = projectId ?? null;

  // 3. Goal-Track Validation (Stage)
  if (stageId) {
    const stage = await prisma.stage.findFirst({ where: { id: stageId, userId } });
    if (!stage) throw new NotFoundError("Referenced Stage does not exist or does not belong to user.");
    if (resolvedGoalId && resolvedGoalId !== stage.goalId) {
      throw new ValidationError("Task goalId does not match the parent Stage's goalId.");
    }
    resolvedGoalId = stage.goalId; // Auto-align shortcut FK
  }

  // 4. Project-Track Validation (Milestone & Project)
  if (milestoneId) {
    const milestone = await prisma.milestone.findFirst({ where: { id: milestoneId, userId } });
    if (!milestone) throw new NotFoundError("Referenced Milestone does not exist or does not belong to user.");
    if (resolvedProjectId && resolvedProjectId !== milestone.projectId) {
      throw new ValidationError("Task projectId does not match the parent Milestone's projectId.");
    }
    resolvedProjectId = milestone.projectId;
  }

  if (resolvedProjectId) {
    const project = await prisma.project.findFirst({ where: { id: resolvedProjectId, userId } });
    if (!project) throw new NotFoundError("Referenced Project does not exist or does not belong to user.");
    if (project.goalId) {
      if (resolvedGoalId && resolvedGoalId !== project.goalId) {
        throw new ValidationError("Task goalId does not match the parent Project's goalId.");
      }
      resolvedGoalId = project.goalId; // Auto-align shortcut FK
    } else {
      resolvedGoalId = null;
    }
  }

  // 5. Area Validation
  if (areaId) {
    const area = await prisma.area.findFirst({ where: { id: areaId, userId } });
    if (!area) throw new NotFoundError("Referenced Area does not exist or does not belong to user.");
  }

  return { resolvedGoalId, resolvedProjectId };
}
```

---

## 8. RELATIONSHIP MATRIX & RECONCILED DELETE SEMANTICS

The delete behaviors across all relations have been reconciled to eliminate any ambiguity or data loss:

| Parent Model | Child Model | Cardinality | Parent FK Optional? | Delete Rule | Exact Semantic Behavior |
|---|---|---|---|---|---|
| `User` | All 15 Models | 1 : N | No | `Cascade` | Strict multi-tenancy. All user data wiped upon account deletion. |
| `Area` | `Goal` | 1 : N | Yes | `Restrict` | **Cannot delete Area while active Goals reference it.** Prevents accidental loss of strategic goal structure. User must reassign or archive goals first. |
| `Area` | `Project` | 1 : N | Yes | `SetNull` | Area unlinked from Project (`areaId = NULL`). Project survives intact. |
| `Area` | `Task` | 1 : N | Yes | `SetNull` | Area unlinked from Task (`areaId = NULL`). Task survives if other parent exists; otherwise reassigned. |
| `Area` | `Activity` | 1 : N | Yes | `SetNull` | Historical activity audit log preserved intact. |
| `Goal` | `Stage` | 1 : N | No | `Cascade` | Stages are strictly sequential parts of the Goal; deleted when Goal is deleted. |
| `Goal` | `Objective` | 1 : N | No | `Cascade` | Objectives (OKRs) belong strictly to Goal; deleted with Goal. |
| `Goal` | `Project` | 1 : N | Yes | `SetNull` | **Projects survive Goal deletion.** When a Goal is deleted/archived, its concrete deliverable Projects become standalone (`goalId = NULL`). |
| `Goal` | `Review` | 1 : N | No | `Cascade` | Goal-specific retrospectives deleted with Goal. |
| `Goal` | `Task` (Shortcut) | 1 : N | Yes | `SetNull` | **Shortcut FK `Task.goalId` is set to NULL.**<br>• Goal-track tasks cascade via `Stage` (`Stage -> Task: Cascade`).<br>• Project-track tasks survive because `Project` survived (`Project -> Task: Cascade` is not triggered). |
| `Project` | `Milestone` | 1 : N | No | `Cascade` | Checkpoints deleted when Project is deleted. |
| `Project` | `Task` | 1 : N | Yes | `Cascade` | **Tasks of a Project are deleted when the Project is deleted.** |
| `Stage` | `Task` | 1 : N | Yes | `Cascade` | **Tasks of a Stage are deleted when the Stage is deleted.** |
| `Milestone` | `Task` | 1 : N | Yes | `SetNull` | **Deleting a Milestone DOES NOT delete its tasks.** The tasks remain safely inside the parent Project with `milestoneId = NULL`. |
| `Task` | `Session` | 1 : N | No | `Cascade` | Focus sessions belong to Task execution history; deleted with Task. |
| `Task` | `DailyFocus` | 1 : N | No | `Cascade` | Daily focus queue entry removed when Task is deleted. |
| `Task` | `CalendarEvent` | 1 : N | Yes | `SetNull` | Calendar time block preserved even if linked task is deleted. |
| `Task` | `Activity` | 1 : N | Yes | `SetNull` | Historical activity time log preserved intact (`taskId = NULL`). |

---

## 9. OWNERSHIP MATRIX

| Model | Ownership Type | Foreign Key | Parent Ownership Validation Required on Create/Update? |
|---|---|---|---|
| `UserPreference` | Direct | `userId` | N/A (1:1 with authenticated User) |
| `Area` | Direct | `userId` | N/A |
| `Goal` | Direct + Relational | `userId`, `areaId?` | Yes: Verify `area.userId == userId` |
| `Objective` | Direct + Relational | `userId`, `goalId` | Yes: Verify `goal.userId == userId` |
| `Project` | Direct + Relational | `userId`, `goalId?`, `areaId?` | Yes: Verify `goal.userId == userId` & `area.userId == userId` |
| `Stage` | Direct + Relational | `userId`, `goalId` | Yes: Verify `goal.userId == userId` |
| `Milestone` | Direct + Relational | `userId`, `projectId` | Yes: Verify `project.userId == userId` |
| `Task` | Direct + Relational | `userId`, `stageId?`, `milestoneId?`, `projectId?`, `areaId?`, `goalId?` | Yes: Run `validateTaskParents` |
| `Session` | Direct + Relational | `userId`, `taskId` | Yes: Verify `task.userId == userId` |
| `DailyFocus` | Direct + Relational | `userId`, `taskId` | Yes: Verify `task.userId == userId` |
| `Review` | Direct + Relational | `userId`, `goalId` | Yes: Verify `goal.userId == userId` |
| `CalendarEvent` | Direct + Relational | `userId`, `taskId?`, `projectId?` | Yes: Verify linked task/project belongs to `userId` |
| `Activity` | Direct + Relational | `userId`, `taskId?`, `projectId?`, `areaId?` | Yes: Verify linked entities belong to `userId` |
| `Capture` | Direct | `userId` | N/A |
| `Notification` | Direct | `userId` | N/A |

---

## 10. INDEX STRATEGY

| Model | Index Definition | Supported Application Query Pattern |
|---|---|---|
| `Goal` | `@@index([userId, status])` | Fetching active goals for dashboard and navigation sidebar. |
| `Goal` | `@@index([userId, areaId])` | Filtering goals by life dimension in Area detail view. |
| `Stage` | `@@index([userId, goalId, order])` | Rendering ordered stage pipeline inside Goal detail view. |
| `Project` | `@@index([userId, status])` | Filtering active projects on Projects page. |
| `Milestone` | `@@index([userId, projectId, order])` | Rendering project roadmap and milestone checklist. |
| `Task` | `@@index([userId, status])` | Kanban board columns (`where: { userId, status }`). |
| `Task` | `@@index([userId, dueDate])` | Finding overdue tasks and upcoming deadlines. |
| `Task` | `@@index([userId, scheduledDate])` | AI SmartPriority and DailyPlan candidate task selection. |
| `Task` | `@@index([userId, stageId])` | Rendering tasks inside a specific learning stage. |
| `Task` | `@@index([userId, projectId])` | Rendering tasks inside a specific project. |
| `Task` | `@@index([userId, goalId])` | Fast retrieval of all tasks under a Goal without multi-level joins. |
| `Session` | `@@index([userId, startedAt])` | Time tracking analytics, streak calculation, weekly focus charts. |
| `Session` | `@@index([userId, endedAt])` | Active session lookup (`where: { userId, endedAt: null }`). |
| `DailyFocus` | `@@index([userId, date, order])` | Today Page: Fetching ordered daily commitment list. |
| `Review` | `@@index([userId, goalId, periodStart])`| Review timeline and progress retrospective comparison. |
| `CalendarEvent` | `@@index([userId, startTime, endTime])`| Calendar View and ConflictDetection overlap checking. |
| `Activity` | `@@index([userId, startTime, endTime])`| Daily timeline auditing and LifeHealth time allocation charts. |
| `Capture` | `@@index([userId, status])` | Unified Inbox: Fetching pending captures for triage. |
| `Notification` | `@@index([userId, isRead, createdAt])` | Notification bell: Unread count badge and notification dropdown. |

---

## 11. UNIQUE CONSTRAINTS

| Model | Constraint Definition | Scope | Rationale |
|---|---|---|---|
| `User` | `@@unique([email])` | Global | Authentication identifier; prevent duplicate accounts. |
| `UserPreference` | `@@unique([userId])` | Global / 1:1 | Exactly one preference profile per user. |
| `Area` | `@@unique([userId, name])` | Scoped to User | Prevent duplicate area names (e.g. two "Health" areas) for the same user. |
| `DailyFocus` | `@@unique([userId, date, taskId])` | Scoped to Day | Prevent adding the exact same task multiple times to the same day's focus queue. |
| `Review` | `@@unique([userId, goalId, periodStart, periodEnd])` | Scoped to Cycle | Prevent duplicate weekly reviews for the same goal in the same time period. |
| `Session` | `idx_unique_active_session_per_user` (Partial SQL) | Scoped to User | At most one active session (`endedAt IS NULL`) per user. |

---

## 12. TIME MODEL COMPARISON

| Concept | Model | Primary Purpose | Temporal Orientation | Duration Tracked? | Can Overlap? | Linked to Task? | User Cognitive State |
|---|---|---|---|---|---|---|---|
| **Scheduled Time** | `CalendarEvent` | Planning commitments and blocking time slots. | Future / Present | Yes (`startTime` to `endTime`) | Allowed (conflicts detected) | Optional | Commitment / Agenda |
| **Tactical Commitment** | `DailyFocus` | Choosing top 3-5 priority tasks for the day. | Present (Today) | No (Queue position) | N/A (Ordered queue) | Mandatory | Intention / Priority |
| **Focused Execution** | `Session` | Measuring deep work and learning comprehension. | Real-time / Immediate Past | Yes (`durationMinutes`) | Strictly NO (Max 1 active session) | Mandatory | High Focus / Cognitive Reflection |
| **Historical Audit** | `Activity` | Logging actual time spent across all life spheres. | Past | Yes (`durationMinutes`) | Allowed | Optional | Retrospective / Logging |

---

## 13. ORDERING MODEL

| Model | Order Field | Ordering Mechanism | Conflict Resolution |
|---|---|---|---|
| `Stage` | `order Int @default(0)` | Integer Sequence (0, 1, 2, 3...) | Stages are linear phases; drag-and-drop updates update `order` within `goalId`. |
| `Milestone` | `order Int @default(0)` | Integer Sequence (0, 1, 2, 3...) | Milestones represent roadmap progression within `projectId`. |
| `DailyFocus` | `order Int @default(0)` | Integer Sequence (0, 1, 2, 3...) | Prioritized queue order on Today page (Task #1, Task #2...). |
| `Area` | `order Int @default(0)` | Integer Sequence (0, 1, 2, 3...) | Navigation sidebar and dashboard card presentation order. |

---

## 14. SOFT-DELETE STRATEGY

1. **Status-Based Archiving (Preferred for Strategic Entities):**
   - Applied to: `Goal`, `Project`, `Task`, `Area`, `Capture`.
   - Native status value: `ARCHIVED`. Standard queries filtering by `ACTIVE` or `TODO` exclude archived items naturally.
2. **Hard Delete (For Ephemeral & Operational Entities):**
   - Applied to: `DailyFocus` (removing item from today), `Notification` (clearing alert), `CalendarEvent` (cancelling event).
   - Rows are deleted directly from PostgreSQL.
3. **Controlled Cascades:**
   - Deleting a `Goal` cascades `Stages`, `Objectives`, and `Reviews`. Attached `Projects` survive via `SetNull`.
   - Deleting a `Project` cascades `Milestones` and its tasks.
   - Deleting a `Milestone` sets `Task.milestoneId = NULL` (tasks survive under the Project).

---

## 15. AUDIT FIELDS

1. **Mandatory Standard Fields:**
   - Every primary entity contains:
     - `createdAt DateTime @default(now())`
     - `updatedAt DateTime @updatedAt`
2. **Specialized Temporal Fields (Nullable):**
   - `startedAt DateTime?`: Recorded when Task or Session begins execution.
   - `completedAt DateTime?`: Recorded when Goal, Project, Milestone, Objective, or Task reaches completion.
   - `readAt DateTime?`: Recorded when Notification is read.
   - `processedAt DateTime?`: Recorded when Capture is triaged.

---

## 16. ANALYTICS PERSISTENCE STRATEGY

### Architectural Decision: Purely Computed Read-Only Services
No separate persistent summary tables will be created for `Analytics`, `SmartPriority`, `DailyPlan`, `ConflictDetection`, `UnifiedInbox`, or `LifeHealth`.

**Rationale:**
1. **Single Source of Truth:** On-the-fly SQL aggregations directly from indexed tables (`Session`, `Task`, `Review`, `CalendarEvent`) prevent stale cache and desynchronization.
2. **Sub-10ms Performance:** In PostgreSQL, aggregating user-scoped records over 7 to 30 days executes in single-digit milliseconds.
3. **Algorithm Agility:** Scoring formulas can be refined in application TypeScript without requiring schema migrations.

---

## 17. CAPTURE LIFECYCLE

```
[ RAW INPUT ]
      ↓  (Quick capture via web/mobile)
   Capture (status: PENDING)
      ↓
[ TRIAGE INBOX ] (Unified Inbox Review)
      ├── Convert to Task    ──> Task created; Capture.status = PROCESSED, convertedTaskId set
      ├── Convert to Goal    ──> Goal created; Capture.status = PROCESSED, convertedGoalId set
      ├── Convert to Note    ──> Stored in external notes / KB; Capture.status = ARCHIVED
      └── Dismiss / Spam     ──> Hard delete row
```

---

## 18. FINANCE / MYMONEY BOUNDARY

1. **Complete Isolation:** Core MyLife schema contains **zero foreign keys** to finance tables.
2. **Integration Boundary (Phase E):** Read-only service adapter querying aggregate views.

---

## 19. AI BOUNDARY

1. **AI Engine Status:** **FROZEN** during Phase A and Phase B.
2. **Database Impact:** **ZERO AI-specific tables.** AI operates strictly as a read-only consumer of domain services.

---

## 20. LEGACY MYLIFE MODEL MAPPING

| Legacy MyLife Model | Action | Target Equivalent | Rationale |
|---|---|---|---|
| `User` | **KEEP + EXTEND** | `User` | Preserved from MyProgress auth foundation. |
| `Area` | **REBUILD** | `Area` | Rebuilt with clean ownership, order, icon, and colors. |
| `Goal` | **REBUILD / EXTEND**| `Goal` | Preserved from MyProgress; `name -> title`, typed enums added. |
| `Objective` | **REBUILD** | `Objective` | Rebuilt cleanly attached to Goal for OKR tracking. |
| `Project` | **REBUILD** | `Project` | Rebuilt to coexist with Stage. |
| `Milestone` | **REBUILD** | `Milestone` | Rebuilt as checkpoints inside Project. |
| `Task` | **RESTRUCTURE** | `Task` | Preserved from MyProgress; `name -> title`, multi-parenting, typed enums. |
| `TaskDependency` | **DEFER** | None (Phase B+) | Complex DAG dependencies deferred to prevent friction. |
| `CalendarEvent` | **REBUILD** | `CalendarEvent` | Rebuilt cleanly for scheduled time blocks. |
| `Activity` | **REBUILD** | `Activity` | Rebuilt cleanly for historical time auditing. |
| `Session` | **KEEP** | `Session` | Preserved directly from MyProgress (learning/focus metrics). |
| `DailyFocus` | **KEEP** | `DailyFocus` | Preserved directly from MyProgress. |
| `Review` | **KEEP** | `Review` | Preserved directly from MyProgress. |
| `WeeklyReview` | **REJECT** | `Review` | Legacy WeeklyReview was bloated; per-goal Review is superior. |
| `Capture` | **KEEP + EXTEND** | `Capture` | Preserved from MyProgress; lifecycle status and category added. |
| `Notification` | **REBUILD** | `Notification` | Rebuilt cleanly for system alerts. |
| `UserPreference` | **REBUILD** | `UserPreference`| Rebuilt cleanly with `Theme` enum and system settings. |
| `Institution`, `AcademicPeriod`, `Course`, `CourseSchedule`, `Assignment`, `Exam` | **DEFER** | Phase C | Education domain deferred to Phase C. |
| `Skill`, `LearningTrack`, `LearningResource` | **DEFER** | Phase C | Dedicated Learning domain deferred to Phase C. |
| `Company`, `Position`, `CareerResponsibility`, `CareerOpportunity`, `CareerInterview` | **DEFER** | Phase C | Dedicated Career domain deferred to Phase C. |

---

## 21. MIGRATION STRATEGY (MYPROGRESS -> MYLIFE)

1. **Preserved Data:** 100% of existing `User`, `Goal`, `Stage`, `Task`, `Session`, `DailyFocus`, `Review`, and `Capture` data is preserved.
2. **Column Renames:**
   - `Goal.name` -> `Goal.title` (PostgreSQL `ALTER TABLE RENAME COLUMN`).
   - `Task.name` -> `Task.title` (PostgreSQL `ALTER TABLE RENAME COLUMN`).
3. **New Tables:** `UserPreference`, `Area`, `Objective`, `Project`, `Milestone`, `CalendarEvent`, `Activity`, `Notification`.
4. **Enum Conversion:** Safe casting of existing string fields to new PostgreSQL ENUM types.
5. **Partial Unique Index Creation:**
   ```sql
   CREATE UNIQUE INDEX "idx_unique_active_session_per_user" 
   ON "Session" ("userId") 
   WHERE "endedAt" IS NULL;
   ```
6. **Task Parent Backfill:** All existing MyProgress tasks retain their valid `stageId`. A migration script populates `Task.goalId` from `Stage.goalId`.
7. **Verification Harness:** Count validation, zero-orphan assertion, and complete execution of the 85 existing automated tests.

---

## 22. BACKWARD COMPATIBILITY EVALUATION

| Subsystem | Impact Category | Required Actions |
|---|---|---|
| **Authentication & Users** | **SAFE** | Zero changes to auth logic, password hashing, or JWT cookies. |
| **Session & Focus Engine** | **SAFE** | Schema fields remain 100% compatible; partial index enforces single active session. |
| **DailyFocus / Today Page** | **SAFE** | `DailyFocus` schema and unique constraints remain identical. |
| **Reviews Engine** | **SAFE** | `Review` schema remains identical. |
| **Goal Repository & Service** | **CONTROLLED CHANGE** | Column renamed from `name` to `title`. DTO getter alias provides transition compatibility. |
| **Task Repository & Service** | **CONTROLLED CHANGE** | Column renamed from `name` to `title`. `stageId` becomes optional. Multi-parent validation integrated. |
| **Capture Service** | **CONTROLLED CHANGE** | New status and category fields added with safe defaults. |
| **AI Context Engine** | **SAFE** | `findTasksForAI` query updated to read `title`; safety boundary untouched. |

---

## 23. RISKS & MITIGATION

1. **Risk: Multiple Nullable Foreign Keys on Task**
   - *Mitigation:* PostgreSQL CHECK constraint `chk_task_parent` + `validateTaskParents` service validation.
2. **Risk: Enum Desynchronization**
   - *Mitigation:* Generate Prisma client immediately after migration; use exported Prisma enums across all services.
3. **Risk: Concurrent Active Sessions**
   - *Mitigation:* Database-level partial unique index `idx_unique_active_session_per_user` guarantees physical isolation.

---

## 24. LOCKED ARCHITECTURAL DECISIONS

All previously open architectural questions are now **OFFICIALLY LOCKED**:
1. **`Task.title` Renaming:** LOCKED. Both `Goal` and `Task` use `title`.
2. **`Goal.areaId` Optionality:** LOCKED. Remains optional (`String?`) at schema level.
3. **`Task.goalId` Shortcut FK:** LOCKED. Retained on `Task` and auto-synchronized by service validation.
4. **`UserPreference.theme` Enum:** LOCKED. Codified as `Theme` enum (`LIGHT`, `DARK`, `SYSTEM`).
5. **Reconciled Delete Semantics:** LOCKED. `Goal -> Project (SetNull)`, `Goal -> Task (SetNull)`, `Milestone -> Task (SetNull)`, `Project -> Task (Cascade)`, `Stage -> Task (Cascade)`, `Area -> Goal (Restrict)`.

---

## 25. IMPLEMENTATION READINESS CHECKLIST

- [x] All 16 models specified with full field definitions.
- [x] All 17 typed enums defined with explicit values.
- [x] Explicit multi-tenancy (`userId`) enforced on every model.
- [x] Reconciled delete semantics eliminate all contradictions.
- [x] Database-level partial unique index designed for active session enforcement.
- [x] Task parenting integrity rules and concrete service validation designed.
- [x] Analytics and Insights kept strictly stateless/computed.
- [x] Finance and AI domains isolated with zero unwanted schema coupling.
- [x] Migration path from MyProgress preserves 100% of data.
- [x] NO application code or Prisma schema was modified during this phase.

---

## 26. PROPOSED PRISMA SCHEMA REPRESENTATION (DESIGN ARTIFACT ONLY)

```prisma
// ==============================================================================
// MYLIFE TARGET PRISMA SCHEMA (DESIGN SPECIFICATION v1.1 - REVISED & LOCKED)
// NOTE: THIS IS A DESIGN ARTIFACT. DO NOT APPLY TO PRISMA/SCHEMA.PRISMA YET.
// ==============================================================================

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ------------------------------------------------------------------------------
// ENUMS (17)
// ------------------------------------------------------------------------------

enum Theme {
  LIGHT
  DARK
  SYSTEM
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum GoalStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
  ARCHIVED
}

enum GoalType {
  LEARNING
  ACHIEVEMENT
  HABIT
  MAINTENANCE
}

enum ObjectiveStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
  ARCHIVED
}

enum StageStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum MilestoneStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  BLOCKED
  COMPLETED
  CANCELLED
  ARCHIVED
}

enum TaskType {
  TASK
  LEARNING
  BUG
  IMPROVEMENT
}

enum CaptureStatus {
  PENDING
  PROCESSED
  ARCHIVED
}

enum CaptureCategory {
  IDEA
  TASK_CANDIDATE
  NOTE
  REMINDER
}

enum EventType {
  PERSONAL
  WORK
  BLOCKED
  REMINDER
  TASK_DEADLINE
}

enum RecurrenceType {
  NONE
  DAILY
  WEEKLY
  MONTHLY
}

enum ActivityCategory {
  WORK
  LEARNING
  HEALTH_FITNESS
  PERSONAL
  REST
  CHORE
}

enum NotificationType {
  TASK_DUE
  DAILY_FOCUS_REMINDER
  WEEKLY_REVIEW_REMINDER
  CALENDAR_EVENT
  MILESTONE_DEADLINE
  SYSTEM
}

enum NotificationSeverity {
  INFO
  WARNING
  URGENT
}

// ------------------------------------------------------------------------------
// CORE DOMAIN
// ------------------------------------------------------------------------------

model User {
  id             String          @id @default(cuid())
  email          String          @unique
  passwordHash   String?
  name           String?
  avatarUrl      String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  preference     UserPreference?
  areas          Area[]
  goals          Goal[]
  objectives     Objective[]
  projects       Project[]
  stages         Stage[]
  milestones     Milestone[]
  tasks          Task[]
  sessions       Session[]
  dailyFocuses   DailyFocus[]
  reviews        Review[]
  calendarEvents CalendarEvent[]
  activities     Activity[]
  captures       Capture[]
  notifications  Notification[]
}

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

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ------------------------------------------------------------------------------
// LIFE DOMAIN
// ------------------------------------------------------------------------------

model Area {
  id          String     @id @default(cuid())
  userId      String
  name        String
  description String?
  color       String     @default("#6366f1")
  icon        String     @default("compass")
  order       Int        @default(0)
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  goals       Goal[]
  projects    Project[]
  tasks       Task[]
  activities  Activity[]

  @@unique([userId, name])
  @@index([userId, order])
  @@index([userId, isActive])
}

model Goal {
  id          String      @id @default(cuid())
  userId      String
  areaId      String?
  title       String
  description String?
  type        GoalType    @default(LEARNING)
  status      GoalStatus  @default(ACTIVE)
  priority    Priority    @default(MEDIUM)
  targetDate  DateTime?
  completedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  area        Area?       @relation(fields: [areaId], references: [id], onDelete: Restrict)
  stages      Stage[]
  projects    Project[]
  objectives  Objective[]
  reviews     Review[]
  tasks       Task[]

  @@index([userId, status])
  @@index([userId, areaId])
  @@index([userId, targetDate])
}

model Objective {
  id           String          @id @default(cuid())
  userId       String
  goalId       String
  title        String
  description  String?
  targetValue  Float           @default(100.0)
  currentValue Float           @default(0.0)
  unit         String          @default("%")
  status       ObjectiveStatus @default(ACTIVE)
  dueDate      DateTime?
  completedAt  DateTime?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal         Goal            @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@index([userId, goalId])
  @@index([userId, status])
}

model Project {
  id             String          @id @default(cuid())
  userId         String
  goalId         String?
  areaId         String?
  title          String
  description    String?
  status         ProjectStatus   @default(PLANNING)
  priority       Priority        @default(MEDIUM)
  startDate      DateTime?
  targetDate     DateTime?
  completedAt    DateTime?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal           Goal?           @relation(fields: [goalId], references: [id], onDelete: SetNull)
  area           Area?           @relation(fields: [areaId], references: [id], onDelete: SetNull)
  milestones     Milestone[]
  tasks          Task[]
  calendarEvents CalendarEvent[]
  activities     Activity[]

  @@index([userId, status])
  @@index([userId, goalId])
  @@index([userId, areaId])
  @@index([userId, targetDate])
}

// ------------------------------------------------------------------------------
// PROGRESS DOMAIN
// ------------------------------------------------------------------------------

model Stage {
  id          String      @id @default(cuid())
  userId      String
  goalId      String
  name        String
  description String?
  order       Int         @default(0)
  status      StageStatus @default(PENDING)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal        Goal        @relation(fields: [goalId], references: [id], onDelete: Cascade)
  tasks       Task[]

  @@index([userId, goalId, order])
  @@index([userId, status])
}

model Milestone {
  id          String          @id @default(cuid())
  userId      String
  projectId   String
  title       String
  description String?
  order       Int             @default(0)
  status      MilestoneStatus @default(PENDING)
  dueDate     DateTime?
  completedAt DateTime?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  project     Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks       Task[]

  @@index([userId, projectId, order])
  @@index([userId, status])
  @@index([userId, dueDate])
}

model Task {
  id             String          @id @default(cuid())
  userId         String
  title          String
  description    String?
  type           TaskType        @default(TASK)
  priority       Priority        @default(MEDIUM)
  status         TaskStatus      @default(TODO)

  // Structural Parent Relations (At least one must be non-null)
  stageId        String?
  milestoneId    String?
  projectId      String?
  areaId         String?

  // Shortcut lookup for fast Goal-level queries
  goalId         String?

  estimatedHours Float           @default(0.0)
  actualHours    Float           @default(0.0)
  dueDate        DateTime?
  scheduledDate  DateTime?
  startedAt      DateTime?
  completedAt    DateTime?
  notes          String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  stage          Stage?          @relation(fields: [stageId], references: [id], onDelete: Cascade)
  milestone      Milestone?      @relation(fields: [milestoneId], references: [id], onDelete: SetNull)
  project        Project?        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  area           Area?           @relation(fields: [areaId], references: [id], onDelete: SetNull)
  goal           Goal?           @relation(fields: [goalId], references: [id], onDelete: SetNull)

  sessions       Session[]
  dailyFocuses   DailyFocus[]
  calendarEvents CalendarEvent[]
  activities     Activity[]

  @@index([userId, status])
  @@index([userId, stageId])
  @@index([userId, milestoneId])
  @@index([userId, projectId])
  @@index([userId, goalId])
  @@index([userId, areaId])
  @@index([userId, dueDate])
  @@index([userId, scheduledDate])
}

model Session {
  id              String    @id @default(cuid())
  userId          String
  taskId          String
  startedAt       DateTime
  endedAt         DateTime?
  durationMinutes Int?
  activity        String?
  understanding   Int?
  obstacle        String?
  nextAction      String?
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  task            Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)

  // NOTE: Enforced at database level via PostgreSQL Partial Unique Index:
  // CREATE UNIQUE INDEX "idx_unique_active_session_per_user" ON "Session" ("userId") WHERE "endedAt" IS NULL;
  @@index([userId, taskId])
  @@index([userId, startedAt])
  @@index([userId, endedAt])
}

model DailyFocus {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime
  taskId    String
  order     Int      @default(0)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([userId, date, taskId])
  @@index([userId, date, order])
  @@index([userId, taskId])
}

model Review {
  id             String   @id @default(cuid())
  userId         String
  goalId         String
  periodStart    DateTime
  periodEnd      DateTime
  learningHours  Float    @default(0.0)
  tasksCompleted Int      @default(0)
  understanding  Float?
  wentWell       String?
  difficulties   String?
  improvements   String?
  nextFocus      String?
  createdAt      DateTime @default(now())

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal           Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@unique([userId, goalId, periodStart, periodEnd])
  @@index([userId, goalId])
  @@index([userId, periodStart])
}

// ------------------------------------------------------------------------------
// TIME DOMAIN
// ------------------------------------------------------------------------------

model CalendarEvent {
  id          String         @id @default(cuid())
  userId      String
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  isAllDay    Boolean        @default(false)
  eventType   EventType      @default(PERSONAL)
  recurrence  RecurrenceType @default(NONE)
  location    String?
  taskId      String?
  projectId   String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  task        Task?          @relation(fields: [taskId], references: [id], onDelete: SetNull)
  project     Project?       @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([userId, startTime, endTime])
  @@index([userId, eventType])
  @@index([userId, taskId])
}

model Activity {
  id                 String           @id @default(cuid())
  userId             String
  title              String
  category           ActivityCategory @default(WORK)
  startTime          DateTime
  endTime            DateTime
  durationMinutes    Int
  productivityRating Int?
  energyLevel        Int?
  notes              String?
  taskId             String?
  projectId          String?
  areaId             String?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  user               User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  task               Task?            @relation(fields: [taskId], references: [id], onDelete: SetNull)
  project            Project?         @relation(fields: [projectId], references: [id], onDelete: SetNull)
  area               Area?            @relation(fields: [areaId], references: [id], onDelete: SetNull)

  @@index([userId, startTime, endTime])
  @@index([userId, category])
  @@index([userId, areaId])
  @@index([userId, taskId])
}

// ------------------------------------------------------------------------------
// CAPTURE DOMAIN
// ------------------------------------------------------------------------------

model Capture {
  id              String          @id @default(cuid())
  userId          String
  content         String
  status          CaptureStatus   @default(PENDING)
  category        CaptureCategory @default(TASK_CANDIDATE)
  convertedTaskId String?
  convertedGoalId String?
  processedAt     DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([userId, createdAt])
}

// ------------------------------------------------------------------------------
// NOTIFICATIONS DOMAIN
// ------------------------------------------------------------------------------

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
