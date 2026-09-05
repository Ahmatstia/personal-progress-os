# MYLIFE MASTER ARCHITECTURE
## Source of Truth — Product Architecture v1.0

> **Status:** AWAITING ARCHITECT APPROVAL  
> **Phase:** 1 — Architecture Design (Analyze → Design → Document)  
> **Code changed:** 0 | **Database changed:** 0 | **AI changed:** 0  
> **Prerequisites:** MERGE_AUDIT.md + MYLIFE_REBUILD_PLAN.md reviewed.

---

## 1. EXECUTIVE SUMMARY

MyLife is a **Personal Life Operating System**. Its purpose is to help a single user navigate all domains of their personal life — goals, work, time, learning, health, and reflection — through one coherent, intelligent system.

**Technical foundation:** MyProgress (stable, tested, secure, version 1.0.0).  
**Product identity:** MyLife.  
**Legacy MyLife:** Reference only — source of domain ideas and service logic, NOT a code or schema source.

**Core insight from analysis:** The two projects have fundamentally compatible architectures but represent two different *scopes* — MyProgress is a deep, well-engineered Progress OS for goals/tasks/sessions, while MyLife Legacy is a broader, less-tested Life Management OS that extends that scope into time, health, projects, and intelligence. The rebuild strategy is: start with MyProgress depth, expand with MyLife breadth, eliminate MyLife weakness.

---

## 2. PRODUCT PHILOSOPHY

### 2.1 What MyLife Is

MyLife is a **Personal Life Operating System** — not a task manager, not a project manager, not a goal tracker. All of these exist within MyLife as **subsystems**, but none of them defines it.

The system exists to answer one question continuously:

> "Am I making real progress on what actually matters to me?"

### 2.2 The Core Loop

Every feature, service, and domain must serve this cycle:

```
CAPTURE  →  UNDERSTAND  →  PLAN  →  EXECUTE  →  TRACK  →  REVIEW  →  IMPROVE
   ↑                                                                        ↓
   └────────────────────── continuous feedback ────────────────────────────┘
```

### 2.3 What MyLife Is NOT

- NOT a project management tool for teams.
- NOT a note-taking app.
- NOT a habit tracker (Habits are deferred to Phase C+).
- NOT a calendar replacement.
- NOT a finance app (MyMoney is separate).
- NOT a social / collaboration platform.
- NOT an LLM chatbot wrapper.

### 2.4 User Mental Model

A user's internal experience should map directly to the system:

```
"Saya ingin menjadi AI Engineer"
        ↓ (Area: Career)
Area: Career
        ↓
Goal: Become an AI Engineer
        ↓
Project: Build ML Portfolio  |  Objective: Master Python by Dec 2026
        ↓
Stage: Learning Foundations → [Tasks]
        ↓
Task: Read Chapter 3 of Python Data Science Handbook
        ↓
Session: 90 minutes, understood 4/5, next: write exercises
        ↓
Review: Week 3 — 8h learning, 3 tasks done, understanding 3.8/5
        ↓
Life Health: 78/100 — momentum good, workload balance warning
```

This vertical slice must work end-to-end before building breadth.

---

## 3. ARCHITECTURAL PRINCIPLES

| # | Principle | Rationale |
|---|---|---|
| P1 | **MyProgress is the foundation** | Security, auth, AI, tests proven in production |
| P2 | **AI is frozen** | 37-intent NLP with adversarial tests; any change risks regression |
| P3 | **Domain ownership is absolute** | All records are owned by User; no client-controlled userId |
| P4 | **Read from, don't absorb legacy** | Legacy MyLife is reference; never copy-paste structure blindly |
| P5 | **Incremental over comprehensive** | One domain at a time, verified before moving to next |
| P6 | **Services own logic; repositories own data** | UI/API cannot touch Prisma directly |
| P7 | **Security is not optional** | Every new route needs IDOR test; no exceptions |
| P8 | **Typed enums over String fields** | Follow MyLife Legacy's enum pattern, not MyProgress's String weakness |
| P9 | **Insights read, domains write** | Analytics/LifeHealth/Inbox only read domain data; never write to other domains |
| P10 | **Finance is isolated** | MyMoney boundary is documented but not implemented in MyLife |

---

## 4. MYPROGRESS FOUNDATION (WHAT IS PRESERVED)

### 4.1 Preserved Unchanged

| System | Files | Why Preserved |
|---|---|---|
| Authentication | `src/lib/auth.ts` | HMAC-SHA256, fail-closed, rate-limited, timing-safe |
| Ownership | `src/lib/ownership.ts` | `requireOwnership<T>()`, `requireUserId()` — IDOR protection |
| AI pipeline | `src/ai/` (entire directory) | 37 intents, HMAC confirmation tokens, adversarial-tested |
| Test infrastructure | `tests/global-setup.ts`, isolated temp DB | DB isolation, security test patterns |
| Analytics service | `src/services/analytics.service.ts` | Streak, bottleneck, completion rate |
| Today service | `src/services/today.service.ts` | Focus, session, overdue detection |
| Core models | Goal, Stage, Task, Session, Review, DailyFocus, Capture | The execution spine of the system |
| API security pattern | `requireCurrentUser()` + `withErrorHandling()` | Per-route auth, standardized errors |

### 4.2 Preserved with Enrichment

These are kept but extended:

| System | Extension |
|---|---|
| `Review` model | Add cross-goal weekly aggregation, area breakdown |
| `Task` model | Add `dueAt`, `projectId`, `milestoneId`, `areaId`, typed enums |
| `Goal` model | Add `areaId`, `priority` enum, `progress` materialized cache, rename `name` → `title` (migration) |
| API error handling | Adopt MyLife Legacy `AppError` hierarchy + `ok()/created()/noContent()` helpers |

### 4.3 MyProgress Debt to Resolve

| Debt | Resolution |
|---|---|
| `String` fields for status/priority/type | Migrate to typed enums (Phase A schema work) |
| `userId @default("dev-user")` | Remove default; enforce session userId |
| `Goal.name` field | Rename to `Goal.title` via migration |
| Mixed API response format | Standardize with `api-helpers.ts` from MyLife Legacy |

---

## 5. MYLIFE DOMAIN MAP

### 5.1 The Complete Domain Landscape

```
MYLIFE
│
├── CORE
│   ├── User                (identity, single user, authentication)
│   └── UserPreference      (notification config, daily plan schedule, language)
│
├── LIFE                    [direction / meaning layer]
│   ├── Area                (permanent life dimensions)
│   ├── Goal                (desired outcomes)
│   ├── Objective           (measurable sub-goals, OKR-style)
│   └── Project             (temporary initiative with deliverable)
│
├── PROGRESS                [execution / action layer]
│   ├── Stage               (ordered phase inside a Goal)
│   ├── Milestone           (checkpoint inside a Project)
│   ├── Task                (atomic work unit — the central entity)
│   ├── Session             (actual work execution record)
│   ├── DailyFocus          (today's priority list)
│   └── Review              (periodic goal reflection)
│
├── TIME                    [temporal / calendar layer]
│   ├── CalendarEvent       (scheduled time slots)
│   └── Activity            (historical time log — what actually happened)
│
├── CAPTURE                 [input / processing layer]
│   └── Capture             (raw, unstructured input → processed later)
│
├── INSIGHTS                [read-only intelligence layer]
│   ├── Analytics           (trend, streak, bottleneck — computed from Sessions)
│   ├── SmartPriority       (explainable task priority scoring)
│   ├── DailyPlan           (workload tier engine — computed from Time + Progress)
│   ├── ConflictDetection   (schedule conflicts — computed from Time + Progress)
│   ├── UnifiedInbox        (attention aggregation — computed from all domains)
│   └── LifeHealth          (holistic health score — computed from all domains)
│
├── NOTIFICATIONS           [proactive alerting layer]
│   └── Notification        (generated by Insights, delivered to user)
│
├── FINANCE                 [isolated, future optional]
│   └── MyMoney integration (boundary only — see Section 13)
│
└── AI                      [frozen intelligence layer]
    └── AI Agent Foundation (FROZEN — see Section 14)
```

### 5.2 Domain Dependency Graph (Read-Only — No Circular Deps)

```
CORE (User, UserPreference)
  ↓
LIFE (Area → Goal → Objective | Project)
  ↓
PROGRESS (Stage → Task → Session | Milestone | DailyFocus | Review)
  ↓
TIME (CalendarEvent | Activity)
  ↓
CAPTURE (Capture → feeds into PROGRESS/LIFE)
  ↓
INSIGHTS (reads from LIFE + PROGRESS + TIME — NEVER writes)
  ↓
NOTIFICATIONS (triggered by INSIGHTS — writes Notification only)
  ↓
AI (reads via domain services — NEVER touches database directly)
```

**Rules enforced:**
- INSIGHTS never writes to LIFE, PROGRESS, TIME, or CAPTURE.
- AI never accesses the database directly (goes through service layer only).
- FINANCE is not a dependency of any other domain.
- NOTIFICATIONS writes only to the Notification table, not to any domain entity.

---

## 6. CORE DOMAIN HIERARCHY

### 6.1 Primary Hierarchy (Vertical — from Meaning to Execution)

```
Area                            ← "What area of life does this belong to?"
  └── Goal                      ← "What do I want to achieve?"
        ├── Objective            ← "How do I measure whether I've achieved it?"
        └── Project              ← "What body of work will move me toward it?"
              ├── Milestone      ← "What are the key checkpoints?"
              └── Task           ← "What is the next concrete action?"
                    └── Session  ← "What did I actually do?"
```

### 6.2 Goal Track (Learning/Skill focused — MyProgress model)

For goals that are personal skill-building or knowledge-acquisition:

```
Goal
  └── Stage          ← "What phase of the journey am I in?"
        └── Task     ← "What is the next concrete action?"
              └── Session
```

**Decision: Stage and Project are BOTH present, serving different contexts.**  
See Section 8 for the full decision rationale.

### 6.3 Cross-Cutting Relationships

These connect horizontally across the hierarchy:

```
Task ──linked to──► CalendarEvent (time-blocking)
Task ──logged by──► Activity (actual time spent)
Task ──prioritized by──► SmartPriority (computed score)
Task ──appears in──► DailyFocus (today's queue)
Task ──appears in──► UnifiedInbox (attention queue)

Goal ──progress from──► Analytics + LifeHealth
Goal ──reflected in──► Review
Area ──summarized in──► LifeHealth (subscore per area)
```

---

## 7. ENTITY DEFINITIONS

---

### User

**Purpose:** The single authenticated owner of all data in the system.  
**Meaning:** Not a multi-user system. Every record is owned by exactly one User.  
**Parent:** None (root entity)  
**Children:** Everything  
**Lifecycle:** Created on signup → permanent (no delete flow in MVP)  
**Why it exists:** Security boundary. All queries filter by userId.  
**What it is NOT:** Not a team, org, or role. Single-user personal OS.

---

### UserPreference

**Purpose:** User-controlled configuration for system behavior.  
**Meaning:** Controls notification delivery, daily plan window, language, UI preferences.  
**Parent:** User (1:1)  
**Children:** None  
**Lifecycle:** Auto-created on signup with defaults → user-modified  
**Why it exists:** Separates configuration from identity.  
**What it is NOT:** Not part of the User model (separation of concerns).

---

### Area

**Purpose:** Permanent life dimensions that serve as classification containers.  
**Meaning:** "The major role or dimension of life this belongs to."  
**Examples:** Health, Career, Education, Finance, Family, Personal Growth, Projects, Social  
**Parent:** User  
**Children:** Goals, Projects, Tasks (directly assigned), Activities  
**Lifecycle:** User-defined. Created once, rarely deleted. `isActive` flag for archiving.  
**Why it exists:** Provides a stable organizational layer above Goal. Enables LifeHealth to show health-per-dimension. Prevents Goals from being unclassified.  
**What it is NOT:**
- NOT a Goal. A Goal is a time-bounded desired outcome. An Area is permanent.
- NOT a Tag. An Area has identity, color, and order. Tags are loose labels.
- NOT a Project. Projects are temporary. Areas are permanent dimensions.

**Design decision:** Area is a **permanent life dimension**, not a category. "Health" is an Area I always have. A goal "Run a 5K marathon" lives within it.

---

### Goal

**Purpose:** A time-bounded desired outcome in a specific Area of life.  
**Meaning:** "The result I want to achieve by a specific date."  
**Examples:** "Become proficient in Python by Dec 2026", "Launch MyLife v1 by March 2027"  
**Parent:** User, optionally Area  
**Children:** Objectives, Projects, Stages (for learning goals), Tasks (loosely linked)  
**Lifecycle:**

```
DRAFT → ACTIVE → COMPLETED
                → ON_HOLD
                → CANCELLED
                → ARCHIVED
```

**Why it exists:** The highest-level direction entity a user owns personally. Every Project and Objective must serve a Goal.  
**Progress:** Materialized cache (0-100), updated when children change.  
**What it is NOT:**
- NOT a Project. Goals answer "What do I want?" — Projects answer "What will I do to get there?"
- NOT an Objective. A Goal is the destination. An Objective is a specific measurable sub-milestone.
- NOT a Vision. "Vision" is too abstract for a first-class entity; Goals are concrete enough.
- NOT permanent. Goals have `targetDate` and lifecycle states.

---

### Objective

**Purpose:** A measurable, specific sub-outcome that contributes to a Goal.  
**Meaning:** "How do I know if I'm making real progress toward my Goal?" (OKR-style Key Result)  
**Examples:** "Complete 3 ML projects", "Read 2 textbooks on NLP", "Achieve 80% test coverage"  
**Parent:** Goal  
**Children:** Tasks (loosely linked), Projects (loosely linked)  
**Lifecycle:** `ACTIVE → COMPLETED | CANCELLED`  
**Why it exists:** Goals can be vague. Objectives make progress measurable with `targetMetric`, `targetValue`, `currentValue`. Without Objectives, progress is subjective.  
**What it is NOT:**
- NOT a Goal. An Objective is always subordinate to a Goal. It cannot exist alone.
- NOT a Project. An Objective describes WHAT to achieve. A Project describes HOW to achieve it.
- NOT a Task. Objectives are outcomes, not actions.
- NOT a Milestone. Milestones are checkpoints inside Projects. Objectives are measurements inside Goals.

---

### Project

**Purpose:** A temporary initiative with a clear deliverable and deadline.  
**Meaning:** "A bounded body of work I'm doing to advance a Goal or Objective."  
**Examples:** "Build MyLife application", "Write thesis Chapter 3", "Launch personal website"  
**Parent:** User, optionally linked to Goal or Objective or Area  
**Children:** Milestones, Tasks  
**Lifecycle:**

```
PLANNING → ACTIVE → COMPLETED
                  → ON_HOLD
                  → CANCELLED
                  → ARCHIVED
```

**Why it exists:** Some work is too large for a single Task and too specific/temporary to be a Goal. Projects represent deliverable-bound work with a deadline. They bridge Goal direction with actual execution.  
**Progress:** Materialized cache (0-100), computed from Task completion within Milestones.  
**What it is NOT:**
- NOT a Goal. A Project is how you execute toward a Goal. It is temporary.
- NOT an Area. Projects end. Areas are permanent.
- NOT a Stage. See Section 8 for Stage vs Project decision.

---

### Stage

**Purpose:** An ordered phase inside a learning/skill-building Goal, representing "where I am in the journey."  
**Meaning:** "The current phase or chapter of this Goal's execution."  
**Examples (Goal: Become AI Engineer):** "Phase 1: Python Foundations", "Phase 2: ML Basics", "Phase 3: Projects"  
**Parent:** Goal  
**Children:** Tasks  
**Lifecycle:** No explicit status. Active when parent Goal is active. Conceptually: `Not Started → In Progress → Done` (derived from Task completion)  
**Why it exists:** For learning and knowledge-acquisition Goals, the journey is sequential and phase-based. Stage captures this phase-based progression where Project overhead is unnecessary.  
**What it is NOT:**
- NOT a Project. Stage is sequential and phase-based within a Goal. Project is a deliverable-bounded initiative.
- NOT a Milestone. Milestone is a checkpoint inside a Project. Stage is the phase structure of a Goal.
- NOT a Status. Stage is a grouping/container, not a status field.

**See Section 8 for the full Stage vs Milestone decision.**

---

### Milestone

**Purpose:** A meaningful checkpoint inside a Project.  
**Meaning:** "A significant marker that signals meaningful progress toward Project completion."  
**Examples (Project: Build MyLife):** "Architecture complete", "Core features working", "Beta deployed"  
**Parent:** Project  
**Children:** Tasks  
**Lifecycle:** `PENDING → IN_PROGRESS → COMPLETED | CANCELLED`  
**Why it exists:** Large Projects need intermediate checkpoints to detect stagnation, track progress, and communicate status. Milestones provide measurable "done" moments within a Project.  
**Progress:** Computed from Task completion rate.  
**What it is NOT:**
- NOT a Stage. Milestone is a checkpoint, not a phase. See Section 8.
- NOT a Task. Milestone groups Tasks; it is not itself actionable.
- NOT a Goal. Milestone marks completion of part of a Project, not an overall life outcome.

---

### Task

**Purpose:** The atomic unit of actionable work in the system.  
**Meaning:** "One concrete thing I need to do." It must be doable, time-bounded, and completable.  
**Examples:** "Read Chapter 4", "Write unit tests for auth.ts", "Book dentist appointment"  
**Parent:** Mandatory — exactly ONE of: Stage (for Goal-track tasks) or Milestone (for Project-track tasks) or Project (for un-milestoned tasks). Optional links to Goal, Area, Objective.  
**Children:** Sessions (work executions), DailyFocus entries  
**Lifecycle:**

```
BACKLOG → TODO → IN_PROGRESS → COMPLETED
               → BLOCKED
               → CANCELLED
               → ARCHIVED
```

**Why it exists:** Task is the center of gravity for the entire system. Everything from Goal to Session passes through Task. It is the unit that connects direction (Goal) to execution (Session) to time (CalendarEvent, Activity).  
**What it is NOT:**
- NOT a Project. Tasks are atomic; Projects are bounded initiatives.
- NOT a Habit. A recurring task is different from a Habit (Habit is deferred to Phase C+).
- NOT an Activity. Activity is a time log of what happened. Task is a statement of what should happen.

**Design note:** Task has optional FK links to Area, Goal, Milestone, Project — but its mandatory home is either a Stage or a Milestone. A Task cannot be completely parentless; it must have at least one structural parent.

---

### Session

**Purpose:** A record of one actual focused work execution on a Task.  
**Meaning:** "I sat down and worked on this Task. Here is what happened."  
**Fields:** startedAt, endedAt, durationMinutes, activity (what was done), understanding (1-5), obstacle (text), nextAction (text)  
**Parent:** Task  
**Children:** None  
**Lifecycle:** `Started (endedAt null) → Ended (endedAt set)`. At most one active session per user at any time.  
**Why it exists:** Session is the deepest execution record in the system. It enables the analytics engine (streak, bottleneck, understanding trend) and the AI context resolver. It separates "planning" (Task) from "doing" (Session).  
**What it is NOT:**
- NOT an Activity. Activity is a broader time log (can cover a project, goal, or area). Session is specifically tied to one Task and records cognitive/learning state (understanding, obstacle, nextAction).
- NOT a Time Block. A CalendarEvent is a plan for the future. A Session is a record of the past.
- NOT a Capture. Session has structure (start/end, understanding, obstacle). Capture is raw input.

---

### Review

**Purpose:** A periodic (weekly) reflection on progress toward a specific Goal.  
**Meaning:** "What happened this week for this Goal? What went well? What must change?"  
**Parent:** Goal  
**Computed fields:** learningMinutes (from Sessions), tasksCompleted (from Tasks), understanding (avg from Sessions)  
**Lifecycle:** One review per (Goal, week). Upserted on creation.  
**Why it exists:** The MyProgress REVIEW → IMPROVE cycle is proven. Review is the mechanism for the system to close the learning loop. Without Review, users accumulate data but never synthesize it.  
**What it is NOT:**
- NOT a Life Health Score. Life Health is a cross-domain read-only score. Review is a user-authored reflection on a specific Goal.
- NOT a Journal. Review is structured (wentWell, difficulties, improvements, nextFocus). Journal (if ever added) is free-form.

---

### DailyFocus

**Purpose:** An ordered list of Tasks that the user has explicitly chosen to focus on today.  
**Meaning:** "These are the tasks I am committing to today."  
**Parent:** User + Task (by date)  
**Lifecycle:** Per-day, per-task unique. Tasks are added/removed by user. Completed tasks remain visible (for tracking daily completions).  
**Why it exists:** DailyFocus is the tactical commitment layer. It bridges the strategic task backlog and the actual execution day. Without it, users have a task list but no daily commitment.  
**What it is NOT:**
- NOT a DailyPlan. DailyPlan (Insight) is a computed recommendation. DailyFocus is the user's explicit commitment. The user can accept or reject DailyPlan suggestions.
- NOT a CalendarEvent. DailyFocus is a task queue for the day, not a scheduled time slot.

---

### CalendarEvent

**Purpose:** A scheduled time slot, blocking or marking a period in time.  
**Meaning:** "Something is happening at this time on this date."  
**Types:** PERSONAL, WORK, BLOCKED (do-not-schedule), REMINDER, TASK_DEADLINE  
**Parent:** User  
**Optional links:** Task, Project, Goal (for context)  
**Lifecycle:** Created → may recur (daily/weekly/monthly) → deleted  
**Why it exists:** Without CalendarEvent, DailyPlan cannot avoid scheduling conflicts. ConflictDetection needs to know what time slots are committed. Task deadline visibility requires calendar context.  
**What it is NOT:**
- NOT a Session. Session records past work. CalendarEvent plans future time.
- NOT a DailyFocus. DailyFocus is a task commitment queue; CalendarEvent is a temporal slot.
- NOT a Task. CalendarEvent does not have completion status (though it can link to one).

---

### Activity

**Purpose:** A historical record of what the user actually did during a time period.  
**Meaning:** "What I was actually doing from 10:00 to 12:00."  
**Parent:** User  
**Optional links:** Task, Project, Goal, Area  
**Fields:** title, category, startAt, endAt, durationMinutes, productivityRating (1-5), energyLevel (1-5), notes  
**Lifecycle:** Created by user (manual or from Session) → permanent (analytics source)  
**Why it exists:** Activity is the actual time log of the system. Session records work on a specific Task with cognitive reflection. Activity records what time was spent on, more broadly. Analytics and LifeHealth use Activities to assess consistency and time allocation.  
**What it is NOT:**
- NOT a Session. Session is tied to a specific Task and records understanding/obstacle/nextAction. Activity is broader and may not be linked to any Task.
- NOT a CalendarEvent. CalendarEvent is a plan (future). Activity is a record (past).
- NOT a DailyFocus entry. DailyFocus is a commitment list, not a time log.

---

### Capture

**Purpose:** A temporary holding area for raw, unprocessed input.  
**Meaning:** "I have a thought, idea, task, or note. I don't have time to process it now."  
**Parent:** User  
**Lifecycle:** Created → Processed (converted to Task/Goal/Note) → Deleted. Captures should NOT accumulate indefinitely.  
**Why it exists:** The brain dump / inbox zero concept. Users need a friction-free way to capture information without breaking their current flow. Capture is the entry point before classification.  
**What it is NOT:**
- NOT a Task. Capture is unstructured and unprocessed. A Task has a parent, priority, and actionable structure.
- NOT a Note or Journal. Capture is temporary. Notes are persistent knowledge. Capture should be processed and either promoted to a Task/Goal or discarded.
- NOT a Notification. Capture is user-initiated input. Notification is system-generated output.

---

## 8. GOAL / PROJECT / STAGE / MILESTONE DECISION

### 8.1 The Problem

Both projects model the "structure inside a Goal" differently:

| Model | Structure |
|---|---|
| MyProgress | Goal → Stage → Task → Session |
| MyLife Legacy | Goal → [Project → Milestone | Objective] → Task |

The question: can these coexist? Or must one be chosen?

### 8.2 Analysis: What is Stage for? What is Project for?

**Stage** (from MyProgress analysis):
- Models the "journey phase" of a learning or skill-building goal.
- Ordered, sequential. Phase 1, Phase 2, Phase 3.
- No deadline. No deliverable. Just "where I am."
- Examples: "Python Basics", "Intermediate ML", "Deep Learning".
- **Use case:** Self-directed learning, knowledge acquisition, long-form personal development.

**Project** (from MyLife Legacy analysis):
- Models a temporary initiative with a concrete deliverable.
- Has a deadline, a status lifecycle (PLANNING → ACTIVE → COMPLETED), and progress.
- Examples: "Build MyLife v1", "Write Thesis", "Build Portfolio Site".
- **Use case:** Engineering work, creative projects, complex deliverables.

**Milestone** (from MyLife Legacy analysis):
- A checkpoint inside a Project.
- Groups Tasks into meaningful phases of Project execution.
- Examples within "Build MyLife": "Architecture done", "Core features done", "Beta deployed".
- **Use case:** Breaking a large Project into measurable intermediate achievements.

**Conclusion:** Stage and Project are NOT the same thing. They serve different user mental models and different types of Goals.

### 8.3 Decision: OPTION B (Modified) — Both Stage and Project Coexist

**Chosen architecture:**

```
Goal
  ├── Stage (for learning / skill-building goals)
  │     └── Task → Session
  │
  └── Project (for deliverable-based execution)
        └── Milestone
              └── Task → Session
```

**The key design rule:**
- A Task can have a `stageId` (Goal-track) OR a `milestoneId` (Project-track) — but NOT both.
- A Task can additionally carry optional `goalId`, `projectId`, `areaId`, `objectiveId` for cross-domain context.
- A Task must have at least one primary structural parent (Stage or Milestone or Project for un-milestoned project tasks).

**Why not merge them?**

| Reason | Explanation |
|---|---|
| Different semantics | Stage = journey phase. Milestone = project checkpoint. These are meaningfully different. |
| Different lifecycle | Stage has no status. Milestone has PENDING/IN_PROGRESS/COMPLETED. |
| Different user mental model | "What phase am I in my ML journey?" ≠ "What checkpoint did I hit in my project?" |
| AI compatibility | Existing AI understands STAGE intents. Milestone is addable without rewriting. |
| Existing tests | 6 STAGE_* intents in the AI; rebuilding as Milestone would break corpus. |

**Why not Stage only?**

Stage cannot represent a Project. A thesis, a software product, or a portfolio site is not a "phase of learning" — it is a bounded initiative with a deadline and deliverable.

**Why not Project/Milestone only?**

For personal skill-building goals (e.g., "Learn Python in 3 months"), forcing the user to create a "Project" and "Milestones" for each phase is excessive overhead. Stage is naturally lighter and more appropriate.

### 8.4 Stage vs Milestone — Definitive Comparison

| Dimension | Stage | Milestone |
|---|---|---|
| Parent | Goal | Project |
| Has deadline | NO | YES (optional dueDate) |
| Has status | NO (derived from tasks) | YES (PENDING/IN_PROGRESS/COMPLETED) |
| Has progress | Derived from tasks | Materialized cache (0-100) |
| User mental model | "Phase of my journey" | "Checkpoint in my project" |
| Purpose | Organize learning/skill tasks | Mark significant Project progress |
| AI intents | STAGE_CREATE, STAGE_UPDATE, STAGE_DELETE, STAGE_REORDER, STAGE_STATUS | Future: MILESTONE_* |

---

## 9. TASK / SESSION MODEL

### 9.1 Task is the Center of Gravity

Task is the only entity connected to all other domains:

```
Area (classification) ──────────────────────► Task ◄──────────── Goal (direction)
                                               │  │
                     Project (initiative) ─────┘  └──── Stage (learning phase)
                     Milestone (checkpoint) ───┘         └──── Objective (measurement)
                               │
                     ┌─────────┼──────────┐
                     ▼         ▼          ▼
                  Session  DailyFocus  CalendarEvent  Activity
                  (did)    (commit)    (scheduled)   (logged)
```

### 9.2 Task Hierarchy Options for a User

A user can place a task in one of three tracks:

| Track | Task Structure | When to Use |
|---|---|---|
| Learning | `Goal → Stage → Task → Session` | Self-directed learning, skill development |
| Project | `Goal → Project → Milestone → Task → Session` | Deliverable-based work, engineering, creative |
| Ad-hoc | `Area → Task` (no stage/milestone) | Daily chores, personal errands, miscellaneous |

### 9.3 Session Model (Preserved from MyProgress)

```
Session {
  taskId         // mandatory link to Task
  startedAt      // when work began
  endedAt        // when work ended (null if active)
  durationMinutes // computed or manual
  activity       // free text: "what I did"
  understanding  // 1-5: how well I understood (learning-focused)
  obstacle       // free text: what blocked me
  nextAction     // free text: what to do next
}
```

**Invariant:** Only one active Session per user at any time (enforced in service layer).

**Understanding/Obstacle/NextAction are deliberately preserved** — they are the unique learning-reflection capability that makes MyProgress a learning OS, not just a task tracker.

### 9.4 Session vs Activity

| Dimension | Session | Activity |
|---|---|---|
| Linked to | Specific Task (mandatory) | Task, Project, Goal, Area (optional) |
| Has understanding/obstacle | YES | NO |
| Purpose | Work execution + learning reflection | Time logging + general productivity tracking |
| Who creates it | User starts/ends via AI or UI | User logs it after the fact |
| Used by | Analytics (streak, bottleneck, understanding trend) | LifeHealth (consistency, time-by-area) |

---

## 10. TIME ARCHITECTURE

### 10.1 Four Time Concepts

The system has four distinct time-related concepts. They must NOT be conflated.

| Concept | Entity | Time orientation | Precision |
|---|---|---|---|
| Planned time | CalendarEvent | Future | Exact slot (startAt, endAt) |
| Committed time | DailyFocus | Today | Task-level (no time slot) |
| Actual work time | Session | Past | Exact (startedAt, endedAt, durationMinutes) |
| Logged time | Activity | Past | Approximate (user-reported or computed) |

### 10.2 Definitions

**CalendarEvent** = "This time slot is spoken for."
- Blocks time on the calendar.
- Types: PERSONAL, WORK, BLOCKED (do-not-book), REMINDER, TASK_DEADLINE.
- Recurrence: NONE, DAILY, WEEKLY, MONTHLY.
- Optionally linked to Task, Project, Goal for context.
- Used by: DailyPlan (avoid booking on blocked time), ConflictDetection (collision detection).

**DailyFocus** = "These tasks are my commitment for today."
- Not time-specific. No start/end time.
- The user's explicit daily task commitment queue.
- Ordered by the user.
- Distinct from DailyPlan (which is a recommendation, not a commitment).

**Session** = "I started working on this Task at HH:MM and ended at HH:MM."
- Tied specifically to one Task.
- Records cognitive/learning state (understanding, obstacle, nextAction).
- Primary source for streak, bottleneck, and consistency analytics.

**Activity** = "From 10:00 to 12:00, I was working on [Task/Project/Goal/Area]."
- Broader than Session. May not be linked to a specific Task.
- Captures general time allocation by category.
- Primary source for LifeHealth consistency subscore and time-by-area analytics.

### 10.3 How They Interact

```
User decides today's focus:          DailyFocus (COMMIT)
User schedules a meeting:            CalendarEvent (PLAN)
DailyPlan checks available slots:    CalendarEvent + DailyFocus + Task estimates
User starts working on a task:       Session.startedAt (DO)
User finishes working:               Session.endedAt (DONE)
User logs broader time block:        Activity (LOG)
```

### 10.4 What is NOT in the Time Architecture (MVP)

- **TimeBlock**: Not a separate entity. CalendarEvent with type BLOCKED covers this.
- **Habit**: Recurring tasks are NOT the same as Habits. Habits are deferred to Phase C+.
- **Scheduler/Worker**: Background job scheduling is infrastructure (future). MVP uses request-time computation.

---

## 11. CAPTURE ARCHITECTURE

### 11.1 One-Way Flow

```
User mind → Capture (raw, unstructured)
                  ↓
            [User processes it]
                  ↓
        ┌─────────┼──────────┐
        ▼         ▼          ▼
      Task      Goal      (discard)
```

Capture is a **temporary inbox**, not a permanent store.

### 11.2 What Capture IS and IS NOT

| IS | IS NOT |
|---|---|
| Temporary holding area | Permanent note or knowledge base |
| Friction-free input (just text) | Structured task (no parent required) |
| User-initiated | System-generated (that's Notification) |
| Should be processed and cleared | Should not accumulate indefinitely |

### 11.3 Inbox Disambiguation

"Inbox" in MyLife means two different things. This must be explicit:

| Concept | What it is |
|---|---|
| `Capture` (entity) | User's personal dump of raw thoughts |
| `UnifiedInbox` (insight service) | System-generated attention queue: overdue tasks, today's events, stagnant projects, approaching deadlines |

These are completely different. Capture is input. UnifiedInbox is a read-only intelligence aggregation.

### 11.4 Notes / Knowledge Base

**Decision: DEFERRED.**

A persistent notes/knowledge system (Journal, Learning Notes, Decision Log) is valuable but out of scope for Phase A-B. The blueprint mentions it; we acknowledge it but do not implement it. Capture covers the immediate need.

---

## 12. INSIGHTS ARCHITECTURE

### 12.1 Core Principle

Insights are **pure read services**. They:
- Read from domain entities (Life, Progress, Time).
- Compute derived values.
- NEVER write to domain tables.
- Can write to their own tables (e.g., Notification).

### 12.2 Insight Services

| Service | Reads from | Computes | Writes to |
|---|---|---|---|
| Analytics | Session, Task, Goal | Streak, bottleneck, completion rate, trend | Nothing |
| SmartPriority | Task, Project, Goal, Area | Priority score with explanation | Nothing |
| DailyPlan | Task, CalendarEvent, DailyFocus | Workload tier (LIGHT/OPTIMAL/HEAVY/OVERLOADED) | Nothing |
| ConflictDetection | Task, CalendarEvent, Project, DailyPlan | Conflict list with severity | Nothing |
| UnifiedInbox | Task, CalendarEvent, Project, Goal | Attention queue by category | Nothing |
| LifeHealth | Goal, Project, Task, Activity, Review | Health score (0-100) with 6 subscores | Nothing |

### 12.3 LifeHealth Subscores

```
LifeHealth (0-100)
  ├── goalMomentum         (avg progress across active Goals)
  ├── projectMomentum      (active Projects with recent task completions)
  ├── executionRate        (completed / total task ratio)
  ├── workloadBalance      (DailyPlan workload tier quality)
  ├── consistency          (active days in last 7, from Activity/Session)
  └── reflectionRhythm     (Reviews completed in last 30 days)
```

**Tiers:** 80-100 = PRIMA | 60-79 = BAIK | 40-59 = CUKUP | 0-39 = PERLU_PERBAIKAN

### 12.4 Review vs LifeHealth vs Analytics

| Dimension | Review | LifeHealth | Analytics |
|---|---|---|---|
| Scope | One Goal, one week | All domains, all time | Sessions/Tasks, date range |
| Who creates it | User (authored reflection) | System (computed score) | System (computed metrics) |
| Purpose | Qualitative learning reflection | Holistic life OS health | Quantitative trend analysis |
| Primary data | Sessions + Tasks for one Goal | Goal + Project + Activity + Review | Sessions + Tasks |
| Writes to DB | YES (Review table) | NO | NO |

---

## 13. FINANCE / MYMONEY BOUNDARY

### 13.1 Decision: Finance is Optional and Isolated

MyMoney is an existing separate application (React Native + Expo + AsyncStorage). MyLife does NOT depend on MyMoney. Finance data is not a core dependency of any MyLife domain.

### 13.2 Future Integration Boundary (Documentation Only)

When Finance integration is implemented:
- MyMoney exposes a **read API** (not a database connection).
- MyLife uses a **Finance Adapter** to consume that API.
- MyLife can display finance summaries in the LifeHealth dashboard.
- MyLife does NOT store financial transactions. MyMoney is the source of truth.

```
MyLife (Finance Adapter)
      ↓  [future HTTP API call]
MyMoney API
      ↓
MyMoney Database (AsyncStorage / future backend)
```

**What is NOT implemented in Phase A-B:**
- No Finance entity in MyLife schema.
- No MyMoney API integration.
- No financial data in LifeHealth calculation.

**ADR reference:** ADR-007

---

## 14. AI BOUNDARY

### 14.1 The Existing AI System (FROZEN)

The MyProgress AI system is one of the most mature parts of the foundation. It must not be modified during Phase A or B.

```
AI Pipeline (FROZEN):
User input
  → normalization.ts        (Indonesian text normalization)
  → classifier.ts           (rule-based → baseline → v2-classifier)
  → router.ts               (intent → handler mapping)
  → context-resolver.ts     (load user context from DB via service)
  → entity-resolver.ts      (fuzzy name matching)
  → safety.ts               (confidence check + HMAC confirmation)
  → decision-engine.ts      (multi-step plan orchestration)
  → tools/*.ts              (domain execution via service layer)
```

**Current intents (37 total):**
V1: TODAY, NEXT_ACTION, GOAL_STATUS/GET/CREATE, TASK_STATUS/SEARCH/CREATE/COMPLETE/REOPEN/DELETE/UPDATE/BULK_*, SESSION_START/END, FOCUS, PROGRESS, ANALYTICS, STREAK, TIME_SPENT, COMPLETION, BOTTLENECK, REVIEW, REFLECTION, OVERDUE, MOTIVATION, HELP, UNKNOWN  
V2 additions: GOAL_DELETE/UPDATE, STAGE_CREATE/UPDATE/DELETE/REORDER/STATUS, TASK_DELETE/UPDATE/BULK_DELETE/BULK_COMPLETE/TASK_REORDER, MULTI_STEP

### 14.2 AI Architectural Rules (Enforced)

1. **AI is NOT a source of truth.** It reads from domain services and may execute writes through service layer only.
2. **AI never accesses the database directly.** It goes through domain service → repository → database.
3. **AI write operations require HMAC confirmation tokens.** Intent + userId + TTL + argHash. This is non-negotiable.
4. **AI is NOT a business logic layer.** Business rules (e.g., cascade progress, IDOR enforcement) live in services. AI tools call services.
5. **LOW confidence = no action.** Safe fallback always.

### 14.3 Future AI Extension (Phase D — After Phase A Complete)

When Phase A domains are stable, AI will be extended with new intents for:
- Area management (AREA_CREATE, AREA_LIST)
- Project management (PROJECT_CREATE, PROJECT_STATUS)
- Calendar queries (CALENDAR_VIEW, CALENDAR_ADD)
- Insight queries (DAILY_PLAN, LIFE_HEALTH, CONFLICT_LIST)

**Extension protocol:**
1. Add intents to `intents.ts`
2. Add corpus examples to `corpus_v4.json`
3. Retrain classifier
4. Add tool files (e.g., `area.tools.ts`)
5. Update router
6. Write adversarial tests
7. Verify all existing tests pass

**DO NOT start Phase D until Phase A verification checklist is 100% complete.**

---

## 15. SECURITY & OWNERSHIP ARCHITECTURE

### 15.1 Authentication (Preserved from MyProgress — Non-negotiable)

```
Custom HMAC-SHA256 session tokens
  Token format: userId.expires.HMAC(userId.expires, AUTH_SECRET)
  TTL: 30 days
  httpOnly cookie
  timingSafeEqual comparison
  Fail-closed: missing AUTH_SECRET → all sessions invalid (401)
  Fail-closed: missing AUTH_ACCESS_CODE → login disabled (503)
  Login rate limiting: 10 attempts / 15 min per IP (in-memory)
```

### 15.2 Ownership Enforcement

Every database query that accesses user data must:
1. Call `requireCurrentUser(request)` in API route to extract `userId`.
2. Pass `userId` to service function.
3. Service passes `userId` to repository function.
4. Repository includes `userId` in every `WHERE` clause.
5. `requireOwnership<T>(resource, userId)` returns 404 for cross-user access.

**The IDOR protection chain is mandatory and must be tested for every new model.**

### 15.3 Security Rules for New Domains

For every new entity added in Phase A-B:
- `userId` is a mandatory field (no default, no null).
- Repository methods always filter by `userId`.
- IDOR test must be written (cross-user access should return 404).
- Auth test must be written (unauthenticated access should return 401).

### 15.4 AI Write Security

AI write operations (create, update, delete via AI commands) require a server-issued HMAC confirmation token. The token is:
- Bound to: intent + userId + TTL + argHash
- Generated server-side only
- Verified server-side before execution
- Non-reusable for different arguments (argHash binding)

This applies to ALL AI write operations, including new intents added in Phase D.

---

## 16. DOMAIN DEPENDENCY RULES

### 16.1 Dependency Graph

```
Layer 0 — CORE
  User, UserPreference
        ↓
Layer 1 — LIFE
  Area, Goal, Objective, Project
        ↓
Layer 2 — PROGRESS
  Stage, Milestone, Task, Session, DailyFocus, Review
        ↓
Layer 3 — TIME
  CalendarEvent, Activity
        ↓
Layer 4 — CAPTURE
  Capture (created by user, read by UI)
        ↓
Layer 5 — INSIGHTS (read-only, no writes to layers 0-4)
  Analytics, SmartPriority, DailyPlan, ConflictDetection, UnifiedInbox, LifeHealth
        ↓
Layer 6 — NOTIFICATIONS (writes to Notification table only)
  Notification
        ↓
Layer 7 — AI (reads via services — never writes directly)
  AI Agent Foundation
```

### 16.2 Forbidden Dependencies

| Forbidden Direction | Why |
|---|---|
| INSIGHTS → writes to LIFE/PROGRESS/TIME | Insights are read-only |
| AI → direct DB access | AI must go through service layer |
| FINANCE → any MyLife domain | Finance is isolated |
| UI → Prisma directly | UI must go through API → service → repository |
| Repository → Service (reverse) | Service calls repository, not vice versa |
| Domain A service → Domain B repository | Cross-domain must go through services, not repos |

### 16.3 Service Dependency Rules

```
API Route
  → Service A (one or more)
    → Repository A
    → [may call Service B for reads]
      → Repository B
    → [may trigger Notification service]
  → Returns response
```

**Cross-domain service calls are allowed for reads.** Example: `ProgressService` may call `TaskRepository` to compute Goal progress.

**Cross-domain service calls for writes must be deliberate and documented.** Example: completing a Task triggers `ProgressService.recalculate()` which updates Project and Goal progress.

---

## 17. USER MENTAL MODEL

### 17.1 How a User Experiences MyLife

The UI must express these natural user stories:

| User says... | System maps to... |
|---|---|
| "I want to become an AI Engineer" | Create Goal in Area: Career |
| "I'll work through these phases" | Create Stages under Goal |
| "Next, read Chapter 4 of this book" | Create Task under Stage |
| "I'm starting to work now" | Start Session on Task |
| "I finished, it was confusing" | End Session, understanding: 2, obstacle: "math notation" |
| "I need to launch a portfolio site" | Create Project under Goal |
| "The site needs these phases" | Create Milestones under Project |
| "Let's build the home page today" | Create Task under Milestone, add to DailyFocus |
| "I have a meeting at 3pm" | Create CalendarEvent |
| "Show me today's plan" | DailyPlan insight |
| "Am I making progress overall?" | LifeHealth score |
| "What needs attention?" | UnifiedInbox |
| "I want to reflect on this week" | Write Review for Goal |
| "Quick! I have an idea" | Create Capture |

### 17.2 Conceptual Simplicity Test

The architecture passes the "explain to a non-technical user" test:

> "MyLife has **Areas** — the big parts of your life like Career, Health, Education.
> Inside each Area, you have **Goals** — things you want to achieve.
> For each Goal, you can have **Stages** (phases of a learning journey) or **Projects** (concrete deliverables).
> Every Stage or Project has **Tasks** — things you actually do.
> When you work on a Task, you record a **Session** — what you did, how well you understood it, what's blocking you.
> The system then tells you your **Life Health** — how well all areas of your life are progressing."

---

## 18. FUTURE EXPANSION

### 18.1 Phase C — Domain Modules

When Phase A-B is stable and verified:

| Module | Models | Dependencies |
|---|---|---|
| Education | Institution, AcademicPeriod, Course, CourseSchedule, Assignment, Exam | CalendarEvent (class schedule), Task (assignment tasks) |
| Learning | Skill, LearningTrack, LearningResource | Goal, Area |
| Career | Company, Position, CareerResponsibility, CareerOpportunity, CareerInterview | CalendarEvent (interviews), Area |
| Habit | Habit, HabitCompletion | Calendar, DailyFocus |
| Journal | JournalEntry | Goal, Project, Activity |

### 18.2 Phase D — AI Extension

Extend frozen AI with new intents for Area, Project, Calendar, Insight queries.

### 18.3 Phase E — Infrastructure

| Infrastructure | When needed |
|---|---|
| Redis + Background Worker | When notification delivery (email/WhatsApp) is required |
| Email provider | When notification channels expand |
| WhatsApp Business API | When WhatsApp notification is implemented |
| Full-text search | When knowledge base / notes are added |
| Multi-user | When a second user needs to use the system |

### 18.4 Finance Integration

See Section 13. Future when MyMoney provides an API.

---

## 19. DEFERRED FEATURES

| Feature | Phase | Reason |
|---|---|---|
| Education module | Phase C | Persona-specific; not universal |
| Learning module | Phase C | Depends on Phase A Area+Goal |
| Career module | Phase C | Persona-specific; not universal |
| Habit system | Phase C+ | Significantly different from Task/Session |
| Journal / Knowledge Base | Phase C+ | Valuable but not core execution loop |
| Finance / MyMoney integration | Phase E | Separate product; integration is non-trivial |
| Task dependency (N:M) | Phase B+ | Complex query implications; defer until after core stable |
| Subtasks (parentTaskId) | Phase B | Avoid premature complexity |
| Recurrence (Task/CalendarEvent) | Phase B | Complexity; not blocking core |
| Tags | Phase B | Nice-to-have; not blocking |
| Task Templates | Phase C | Useful but not core |
| AI Extension | Phase D | After Phase A verified |
| Multi-user | Future | Outside Phase A-B scope |
| WhatsApp / Email / Push notifications | Phase E | Infrastructure cost |
| Analytics export | Phase C | Not blocking |
| Automation engine | Phase C+ | Complex; blueprint mentions but not MVP |
| Sharing / Collaboration | Out of scope | Single-user OS |

---

## 20. REJECTED CONCEPTS

| Concept | Decision | Reason |
|---|---|---|
| MyLife auth (NextAuth v5) | REJECTED | No rate limiting, no IDOR tests, no adversarial test coverage; MyProgress HMAC auth is superior |
| MyLife AI assistant (keyword-based) | REJECTED | `includes()` keyword matching; no confidence, no safety, no entity resolution; MyProgress AI is architecturally superior by an order of magnitude |
| MyLife test infrastructure (shared dev.db) | REJECTED | Tests corrupt development database; MyProgress's isolated temp DB approach is correct |
| MyLife middleware (dashboard-only protection) | REJECTED | Too narrow; MyProgress per-route auth pattern is safer |
| MyLife features/ directory (empty) | REJECTED | Pattern was never populated; do not inherit an empty architectural layer |
| Copying MyLife code verbatim | REJECTED | Logic is reference material; must be adapted to MyProgress architecture, security model, and typed schema |
| Single unified hierarchy (choosing Stage OR Project) | REJECTED | Both serve distinct use cases; forced unification loses semantic clarity |
| LLM integration in MVP | REJECTED | Current deterministic AI is sufficient; LLM introduces latency, cost, and safety risk without proportional value |
| Making Insight services write to domain tables | REJECTED | Violates read-only principle; creates circular data dependencies |
| Vision as a first-class entity | REJECTED | Too abstract; Goals are concrete enough for MVP |
| Removing understanding/obstacle/nextAction from Session | REJECTED | These are the differentiating value of the session model; they enable the learning OS insight layer |

---

## 21. ARCHITECTURE DECISION RECORDS

---

### ADR-001 — MyLife Uses MyProgress as Technical Foundation

**Status:** Accepted

**Context:**  
Two projects exist. One is stable, tested, and production-ready (MyProgress v1.0.0). The other has ambitious domain modeling but lacks tests, security coverage, and has configuration bugs (MyLife v0.1.0).

**Decision:**  
MyProgress is the technical foundation. MyLife is the product identity built on top of it.

**Reason:**  
MyProgress has: adversarially tested HMAC auth, IDOR-tested API routes, isolated test DB, 37-intent NLP AI with HMAC write protection, Docker deployment, production documentation. MyLife lacks all of these.

**Consequences:**  
All new features are added to MyProgress's codebase, patterns, and security model. Legacy MyLife code is reference only.

---

### ADR-002 — Legacy MyLife Is Reference Only

**Status:** Accepted

**Context:**  
Legacy MyLife has valuable service logic (ConflictDetection, DailyPlan, LifeHealth, UnifiedInbox, SmartPriority) but uses a different database, different auth, and has different (weaker) security.

**Decision:**  
Legacy MyLife code is never copy-pasted. Its logic is read, understood, and re-implemented in the MyProgress architecture.

**Reason:**  
Inheriting auth, test infrastructure, or middleware from MyLife would introduce security regressions. The valuable logic can be adapted without carrying the weaknesses.

**Consequences:**  
All service ports are reimplementations, not imports. This takes more time but produces more correct, tested code.

---

### ADR-003 — AI Is Frozen During Phase A and B

**Status:** Accepted

**Context:**  
The MyProgress AI system has 37 intents, 8 test files (including adversarial safety tests), an NLP corpus, and a Python evaluation pipeline. It is a significant engineering asset.

**Decision:**  
`src/ai/` is frozen. No modifications during Phase A or B. AI extension happens in Phase D only after Phase A verification checklist is complete.

**Reason:**  
Any change to the AI system risks breaking the classifier, corpus compatibility, or safety guarantees. The value of AI extension does not justify the risk during foundational schema work.

**Consequences:**  
AI will not understand new domains (Area, Project, Calendar) until Phase D. Users can still use all 37 existing intents. New domains must be managed via UI.

---

### ADR-004 — Goal / Stage / Project Relationship

**Status:** Accepted

**Context:**  
MyProgress uses Goal → Stage → Task. MyLife Legacy uses Goal → [Project → Milestone]. Both are valid for different use cases.

**Decision:**  
Both coexist. Goal can have Stages (for learning goals) OR Projects (for deliverable goals) — not both on the same Goal. Task is linked to exactly one: a Stage or a Milestone.

**Reason:**  
Stage = phase of a learning journey (ordered, no deadline). Project = temporary initiative with a deliverable (deadline, status). These serve fundamentally different user mental models and cannot be merged without semantic loss.

**Consequences:**  
Slightly more complex Task model (optional stageId OR milestoneId). Managed by service layer validation: a Task must have exactly one primary structural parent.

---

### ADR-005 — Stage vs Milestone: Both Exist, Different Purposes

**Status:** Accepted

**Context:**  
Stage and Milestone both organize Tasks within a higher-level entity. They appear similar. The question was whether they could be unified.

**Decision:**  
Stage and Milestone are distinct entities with distinct purposes. They are NOT merged.

**Reason:**

| | Stage | Milestone |
|---|---|---|
| Parent | Goal | Project |
| Has deadline | No | Yes |
| Has status | Derived | Explicit (PENDING/IN_PROGRESS/COMPLETED) |
| User mental model | Journey phase | Project checkpoint |
| AI support | Yes (6 existing intents) | Future (Phase D) |

Unifying them would require one of: (a) adding deadline to Stage (wrong), (b) removing status from Milestone (wrong), or (c) creating a confusing hybrid (worst). Both entities are semantically necessary.

**Consequences:**  
Two separate entities. Moderate schema complexity. Clear user-facing distinction. AI STAGE intents preserved without modification.

---

### ADR-006 — Session vs Activity vs Time Block

**Status:** Accepted

**Context:**  
Four time-related concepts exist: Session, Activity, CalendarEvent, DailyFocus. The question was whether they overlap and whether any can be merged.

**Decision:**  
All four are distinct. No merging. See Section 10 for full definition.

**Reason:**
- Session: Task-specific work record with cognitive state (understanding/obstacle/nextAction). Required for analytics.
- Activity: Broader time log (may not be Task-linked), captures time allocation by category.
- CalendarEvent: Future time planning, with recurrence.
- DailyFocus: Today's task commitment queue (not a time slot).

Merging Session into Activity would lose the understanding/obstacle/nextAction fields, which are core to the learning OS value proposition.

**Consequences:**  
Four entities with different schemas and different query patterns. Clear semantic boundaries reduce confusion but require documentation (this document).

---

### ADR-007 — MyMoney Finance Integration Is Optional and Future

**Status:** Accepted

**Context:**  
MyMoney is a separate React Native application. The blueprint mentions finance as a future integration.

**Decision:**  
Finance is not implemented in Phase A-B. A read-only integration adapter is the future strategy when MyMoney has an API.

**Reason:**  
Adding finance data to MyLife schema would create a dependency on an external system that has no API. The value does not justify the complexity at this stage.

**Consequences:**  
No Finance entity in Phase A-B schema. LifeHealth does not include a Finance subscore. This is explicitly documented as a future feature.

---

### ADR-008 — Education, Learning, Career Modules Are Deferred

**Status:** Accepted

**Context:**  
MyLife Legacy has fully modeled Education (Institution → AcademicPeriod → Course → Assignment → Exam), Learning (Skill → Track → Resource), and Career (Company → Position → Opportunity → Interview) modules.

**Decision:**  
All three modules are deferred to Phase C. They are explicitly excluded from Phase A and B.

**Reason:**  
These are persona-specific features. The core Life OS value (Goal → Project → Task → Session → Review → LifeHealth) must be proven stable before adding specialized modules. Including them in Phase A adds 15+ models without proportional user value for the core use case.

**Consequences:**  
Cleaner Phase A schema. Faster core implementation. Users cannot track courses or job applications in Phase A-B. These are acknowledged deferred capabilities.

---

### ADR-009 — Task Must Have a Primary Structural Parent

**Status:** Accepted

**Context:**  
MyLife Legacy allows tasks to be linked to any combination of Area, Goal, Milestone, Project, Objective (all optional). This creates "floating" tasks with no structural context.

**Decision:**  
Every Task must have exactly one primary structural parent: a Stage (Goal-track) OR a Milestone or Project (Project-track) OR optionally just an Area (ad-hoc track). A Task cannot exist without ANY parent.

**Reason:**  
Parentless tasks cannot be organized, cannot contribute to progress cascades, and cannot be navigated in the UI. The three-track model (Learning track / Project track / Ad-hoc) gives structure while remaining flexible.

**Consequences:**  
Service layer must validate Task creation: at least one of `stageId`, `milestoneId`, `projectId`, or `areaId` must be provided.

---

### ADR-010 — Typed Enums Replace String Fields

**Status:** Accepted

**Context:**  
MyProgress uses String for all status/type/priority fields. MyLife Legacy uses 27 typed enums. String fields allow silent corruption ("ACTVE" instead of "ACTIVE").

**Decision:**  
All new models use typed enums. Existing MyProgress models (Goal, Task, Stage) are migrated to enums in Phase A.0 schema cleanup.

**Reason:**  
Type safety at the database level prevents data corruption. Enums are self-documenting. The migration cost is worth the correctness guarantee.

**Consequences:**  
Requires a migration for existing models. All application code must use enum values (not raw strings). TypeScript types must match enum values.

---

## 22. FINAL DOMAIN DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MYLIFE SYSTEM                                  │
│                                                                             │
│  CORE                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  User ──────────────────────────── UserPreference                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  LIFE                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Area ──────────────────────────────────────────────────────────┐    │  │
│  │    │                                                             │    │  │
│  │    └──► Goal ──────────────────────────── progress (cached)     │    │  │
│  │           │                                                      │    │  │
│  │           ├──► Objective (OKR, measurable)                       │    │  │
│  │           │                                                      │    │  │
│  │           └──► Project ──────────────────────── progress (cached)│    │  │
│  └───────────────────┼────────────────────────────────────────┬─────┘  │
│                       │                                        │         │
│  PROGRESS             ▼                                        ▼         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Stage (Goal-track) ◄───┐      Milestone (Project-track) ◄──┐       │  │
│  │                         │                                    │       │  │
│  │  Task ──────────────────┴────────────────────────────────────┘       │  │
│  │   │   (mandatory: stageId OR milestoneId OR projectId OR areaId)     │  │
│  │   │                                                                   │  │
│  │   ├──► Session (startedAt, endedAt, understanding, obstacle)         │  │
│  │   ├──► DailyFocus (today's commitment queue)                         │  │
│  │   └──► Review (per-Goal, per-week, user-authored)                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  TIME                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  CalendarEvent (planned slots, recurrence, types)                    │  │
│  │  Activity (actual time log, category, productivity/energy rating)    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  CAPTURE                           ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Capture (raw input → processed → Task or Goal or discarded)         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  INSIGHTS (read-only from all above)                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Analytics  │  SmartPriority  │  DailyPlan  │  ConflictDetection    │  │
│  │  UnifiedInbox  │  LifeHealth (goal/project/execution/workload/       │  │
│  │                               consistency/reflectionRhythm)          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  NOTIFICATIONS                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Notification (triggered by Insights, delivered to user)             │  │
│  │  UserPreference.enableNotifications controls delivery                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  AI (reads via domain services)    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  AI Agent Foundation (FROZEN)                                        │  │
│  │  → normalization → classification → routing → context → safety      │  │
│  │  → entity resolution → confirmation token → tool execution          │  │
│  │  → service layer (NEVER direct DB access)                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  FINANCE (isolated, future)                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  MyMoney (external system, future read API integration)              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ARCHITECTURE CONSISTENCY CHECKLIST

- [x] Tidak ada konsep duplikat tanpa alasan
- [x] Goal memiliki definisi jelas (desired outcome, time-bounded)
- [x] Objective memiliki definisi jelas (measurable OKR sub-goal)
- [x] Stage memiliki definisi jelas (ordered phase of learning journey)
- [x] Project memiliki definisi jelas (temporary initiative with deliverable)
- [x] Milestone memiliki definisi jelas (checkpoint inside Project)
- [x] Task memiliki definisi jelas (atomic unit of work)
- [x] Session memiliki definisi jelas (actual work execution record)
- [x] Time system tidak tumpang tindih (CalendarEvent / DailyFocus / Session / Activity are distinct)
- [x] Capture system jelas (temporary input, not permanent notes)
- [x] Insights hanya membaca domain (never writes to domain tables)
- [x] Finance terisolasi (not a dependency of any domain)
- [x] AI tetap frozen (Phase A-B; extension only in Phase D)
- [x] Security ownership tetap kompatibel (all entities have userId, requireOwnership enforced)
- [x] Tidak ada circular dependency (domain graph is strictly layered)
- [x] MyProgress tetap technical foundation
- [x] MyLife menjadi product identity
- [x] Legacy MyLife tidak menjadi source of truth
- [x] Tidak ada schema/code yang diubah dalam Phase 1

---

## PHASE 1 STATUS

```
Architecture:        COMPLETE — AWAITING ARCHITECT APPROVAL

Files created:       D:\IT\web\merge\MYLIFE_MASTER_ARCHITECTURE.md

Major decisions:
  1. MyProgress is the unambiguous technical foundation
  2. Stage and Project BOTH exist (Option B modified)
  3. Stage = learning journey phase (Goal-track)
  4. Milestone = project checkpoint (Project-track)
  5. Session ≠ Activity (distinct time concepts, both preserved)
  6. CalendarEvent ≠ DailyFocus ≠ Session ≠ Activity (four distinct time concepts)
  7. Capture = temporary input only (not persistent notes)
  8. Insights are read-only services (never write to domain tables)
  9. AI is frozen (Phase A-B); extension is Phase D
  10. Finance is isolated (future read-only integration)
  11. Typed enums replace String fields in all models
  12. Task must have at least one structural parent

Major unresolved decisions (require architect approval before Phase A):
  1. Database engine: Keep PostgreSQL (Supabase) or migrate to SQLite?
  2. Language: Indonesian only or bilingual?
  3. Design system: warm-canvas indigo/violet or deep-blue corporate?
  4. Goal.name → Goal.title migration: do now or defer?

Rejected concepts:
  - MyLife auth (NextAuth v5)
  - MyLife AI assistant (keyword-only)
  - MyLife test infrastructure (shared dev.db)
  - LLM integration in MVP
  - Merging Stage and Milestone into one entity
  - Merging Session and Activity into one entity
  - Finance as a MyLife core dependency
  - Floating/parentless Tasks

Deferred concepts:
  - Education, Learning, Career modules (Phase C)
  - Habit system (Phase C+)
  - Journal / Knowledge Base (Phase C+)
  - Task dependency N:M (Phase B+)
  - Subtasks (Phase B)
  - Recurrence (Phase B)
  - AI extension (Phase D)
  - Finance integration (Phase E)
  - WhatsApp / Email notifications (Phase E)
  - Multi-user (Future)

Risk:
  MEDIUM — Schema decisions (typed enums, Goal.name rename) require
  migration planning. Decision on database engine must be made before
  Phase A begins.

Code changed:        0
Database changed:    0
AI changed:          0
Testing:             NOT REQUIRED (no code changes)
```
