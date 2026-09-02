# PERSONAL PROGRESS OS

# MASTER PROJECT BLUEPRINT

# Version 1.0

> SOURCE OF TRUTH
>
> This document defines the product vision, architecture,
> data model, business rules, UX principles, development roadmap,
> testing strategy, and future direction of Personal Progress OS.
>
> AI coding agents must inspect and follow this document before
> making significant architectural changes.

---

# 1. PROJECT IDENTITY

## Product Name

Personal Progress OS

## Short Name

PPOS

## Product Category

Personal Progress Management System

## Primary Purpose

Personal Progress OS is a web-based personal operating system
designed to help a person define, execute, track, reflect on,
and understand progress toward different goals in life.

The system is NOT limited to learning.

A user may track:

- Learning
- Programming
- Academic work
- Thesis
- Career development
- Personal projects
- Business projects
- Fitness
- Habits
- Financial goals
- Skill development
- Personal development
- Other custom goals

The system must remain generic enough that the same architecture
can support many types of progress.

---

# 2. PRODUCT PHILOSOPHY

Personal Progress OS is not simply a task management application.

A traditional task manager answers:

> "What tasks do I have?"

Personal Progress OS should answer:

> "What am I trying to achieve?"

> "Where am I in the process?"

> "What have I actually done?"

> "How much time have I spent?"

> "What did I learn?"

> "What blocked me?"

> "Am I making progress?"

> "What should I do next?"

The product should therefore combine:

- Goal management
- Task management
- Activity tracking
- Time tracking
- Reflection
- Progress analytics
- Next-action guidance

---

# 3. CORE CONCEPT

The fundamental lifecycle is:

GOAL
|
v
STAGE
|
v
TASK
|
v
SESSION
|
v
REVIEW
|
v
INSIGHT

Explanation:

GOAL
What do I want to achieve?

STAGE
What major milestones lead toward the goal?

TASK
What concrete work must be completed?

SESSION
What did I actually do?

REVIEW
What happened during a period?

INSIGHT
What does the accumulated data tell me?

---

# 4. PRODUCT PRINCIPLES

## 4.1 Goal-centric

Every meaningful activity should ultimately be connected
to a Goal.

Relationship:

Goal
-> Stage
-> Task
-> Session

Reviews are associated with Goals.

---

## 4.2 Data-driven progress

Progress must be calculated from actual data whenever possible.

Avoid manually storing arbitrary progress percentages.

Example:

10 tasks
7 completed

Progress = 70%

---

## 4.3 Actionable

The system should not only display historical information.

It should help answer:

> "What should I do next?"

The system should eventually surface a Next Action.

---

## 4.4 Reflection-aware

Completion is not enough.

A user should be able to record:

- What they did
- What they understood
- What confused them
- What blocked them
- What they will do next

---

## 4.5 Generic

The system must not assume that every Goal is about learning.

Do not create business logic such as:

if goal.type == LEARNING:
...

unless the behavior is genuinely specific to learning.

---

## 4.6 Personal

The system is intended primarily for personal use.

Data should be treated as personal data.

---

## 4.7 Data ownership

The user should eventually be able to:

- Export data
- Backup data
- Restore data
- Import data
- Delete data

The system should not unnecessarily lock the user's data
into the application.

---

## 4.8 Progressive complexity

The application should start simple.

Advanced functionality should be introduced gradually.

Do not overload the user with analytics, AI, or configuration
before the core workflow is stable.

---

# 5. TARGET USER EXPERIENCE

The desired experience:

User opens the application.

They immediately understand:

1. What goals they are working on.
2. How much progress has been made.
3. What they worked on recently.
4. What they should do next.

The application should feel like:

"my personal progress command center"

rather than:

"another project management dashboard."

---

# 6. CURRENT TECHNOLOGY STACK

The project currently uses:

- Next.js 16.3.4
- React 19.2.8
- TypeScript
- Tailwind CSS v4
- Prisma 7.10.0
- SQLite
- better-sqlite3
- Zod

Do not upgrade major versions without a clear reason.

Do not replace the stack without explicit approval.

---

# 7. APPLICATION ARCHITECTURE

The preferred architecture is:

UI
|
v
API
|
v
Zod Validation
|
v
Service
|
v
Repository
|
v
Prisma
|
v
SQLite

Responsibilities:

## UI

Responsible for:

- Rendering
- User interaction
- Form presentation
- Loading states
- Error states
- Client-side interaction

UI should not contain database access.

---

## API

Responsible for:

- HTTP requests
- Authentication in future
- Request parsing
- Response formatting
- Calling services

---

## Validation

Zod schemas validate:

- Request body
- Parameters
- Query parameters
- Form data

---

## Services

Services contain business logic.

Examples:

- Goal service
- Task service
- Session service
- Progress service
- Review service
- Analytics service

---

## Repositories

Repositories contain database access.

Examples:

- Goal repository
- Stage repository
- Task repository
- Session repository
- Review repository

---

## Prisma

Prisma is the ORM and database abstraction layer.

---

## SQLite

SQLite is the current local database.

Future migration to PostgreSQL/Supabase may be considered,
but is NOT part of the current core implementation.

---

# 8. NEXT.JS APP STRUCTURE

The active App Router should be:

src/app/

Expected primary entry:

src/app/layout.tsx

src/app/page.tsx

There must not be conflicting duplicate route trees.

If an old root-level:

app/

directory exists and is only the original create-next-app scaffold,
it should be removed after verifying that it is not needed.

---

# 9. PROJECT STRUCTURE

Target structure:

src/
|
+-- app/
| |
| +-- api/
| | |
| | +-- goals/
| | +-- stages/
| | +-- tasks/
| | +-- sessions/
| | +-- reviews/
| | +-- dashboard/
| | +-- export/
| |
| +-- components/
| | |
| | +-- ui/
| | +-- goals/
| | +-- stages/
| | +-- tasks/
| | +-- sessions/
| | +-- reviews/
| | +-- dashboard/
| |
| +-- dashboard/
| |
| +-- goals/
| | |
| | +-- [id]/
| |
| +-- sessions/
| |
| +-- reviews/
| |
| +-- settings/
| |
| +-- layout.tsx
| +-- page.tsx
|
+-- lib/
| +-- prisma.ts
| +-- utils.ts
|
+-- repositories/
| +-- goal.repository.ts
| +-- stage.repository.ts
| +-- task.repository.ts
| +-- session.repository.ts
| +-- review.repository.ts
|
+-- services/
| +-- goal.service.ts
| +-- stage.service.ts
| +-- task.service.ts
| +-- session.service.ts
| +-- progress.service.ts
| +-- review.service.ts
| +-- analytics.service.ts
|
+-- schemas/
| +-- goal.schema.ts
| +-- stage.schema.ts
| +-- task.schema.ts
| +-- session.schema.ts
| +-- review.schema.ts
|
+-- types/
|
+-- constants/
|
+-- utils/

prisma/
|
+-- schema.prisma
+-- seed.ts
+-- migrations/

tests/
|
+-- unit/
+-- integration/
