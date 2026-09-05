# PHASE 2 — SCHEMA & DATA MODEL DESIGN REPORT
## Phase 2 Revision: Final Schema Correction Summary

> **Status:** COMPLETE — REVISED SPECIFICATION READY FOR FINAL REVIEW  
> **Phase:** Phase 2 Revision — Final Schema Correction  
> **Rule Compliance:** DESIGN ONLY. Zero production code, zero schema files, zero migrations executed.  
> **Author:** Senior Software Architect & Database Architect  
> **Date:** September 2026  

---

## 1. REVISION OVERVIEW

In this revision, all designated architectural decisions were permanently locked, edge cases in relationship semantics and constraints were resolved, and the proposed Prisma representation was checked for strict internal consistency.

---

## 2. APPLIED DESIGN CORRECTIONS

### 1. Locked Decisions
- **`Task.title` Renaming:** Formally locked. Both `Goal` and `Task` use `title` across all schema models, DTOs, and services.
- **`Goal.areaId` Optionality:** Formally locked. `Goal.areaId` remains `String?` at the database level to ensure seamless, low-friction goal creation.
- **`Task.goalId` Shortcut FK:** Formally locked. Retained as a denormalized shortcut foreign key on `Task` for performant goal-level queries, with automatic service-layer alignment.

### 2. Active Session Uniqueness Enforcement
- **Requirement:** At most ONE active session (`endedAt IS NULL`) per user at any time.
- **Database Enforcement:** Defined PostgreSQL Partial Unique Index:
  ```sql
  CREATE UNIQUE INDEX "idx_unique_active_session_per_user" 
  ON "Session" ("userId") 
  WHERE "endedAt" IS NULL;
  ```
- **Prisma Syntax Limitation Documented:** Prisma schema does not support `WHERE` partial clauses on `@unique`. Documented that this index must be implemented via raw migration SQL (`migration.sql`) in Phase 3.
- **Service Layer Pre-Check:** `session.service.ts` checks `findFirst({ where: { userId, endedAt: null } })` to provide user-friendly validation before hitting the database constraint.

### 3. Task Parent Consistency Rules & Concrete Validation
- **Mandatory Parent:** At least one structural parent (`stageId`, `milestoneId`, `projectId`, or `areaId`) is mandatory (enforced via PostgreSQL `chk_task_parent` CHECK constraint).
- **Semantic Coherence Rules:**
  - `stageId` implies Goal-track; auto-populates `task.goalId = stage.goalId`.
  - `milestoneId` implies Project-track; requires `task.projectId = milestone.projectId`.
  - `projectId` with goal implies `task.goalId = project.goalId`; standalone project implies `task.goalId = null`.
  - Cross-track conflict: `stageId` and `projectId`/`milestoneId` are strictly mutually exclusive.
  - Ownership isolation: All parent IDs must match `task.userId`.
- **Service Validator:** Concrete `validateTaskParents` validator function specification provided in `MYLIFE_TARGET_SCHEMA.md` Section 7.

### 4. Harmonized Delete Semantics
All contradictions between written delete strategies and Prisma foreign key clauses were resolved:
- `Area -> Goal`: `onDelete: Restrict`. Prevents deleting an Area while active Goals are assigned to it.
- `Goal -> Project`: `onDelete: SetNull`. Concrete deliverable projects survive when a strategic goal is deleted or archived.
- `Goal -> Task`: `onDelete: SetNull` on `Task.goalId`. Goal-track tasks cascade via `Stage` (`Stage -> Task: Cascade`), while Project-track tasks safely survive because their Project survived.
- `Project -> Task`: `onDelete: Cascade`. Deleting a project deletes all its tasks.
- `Milestone -> Task`: `onDelete: SetNull`. Deleting a milestone un-milestones its tasks (`milestoneId = NULL`), leaving them safely inside the parent Project.

### 5. Typed `Theme` Enum on `UserPreference`
- Evaluated and approved: `theme String` replaced with typed enum `Theme`:
  ```prisma
  enum Theme {
    LIGHT
    DARK
    SYSTEM
  }
  ```
- `UserPreference.theme` now uses `Theme @default(SYSTEM)`. Total enums increased to 17.

### 6. Internal Consistency Verification of Prisma Representation
- All 16 models and 17 enums verified for syntax, relation field pairs, foreign key types, and matching `onDelete` clauses.
- Commented note included in `Session` model referencing the partial unique index migration SQL.

---

## 3. CONFIRMATION OF NON-MODIFICATION

I formally confirm that during this revision:
- **NO Prisma schema files were modified.** (`MyProgres/prisma/schema.prisma` is untouched).
- **NO database migrations were created or run.**
- **NO application code in `MyProgres` or `mylife` was altered.**
- **NO dependencies were installed.**
- **NO tests were broken.**

This phase concluded in **DESIGN ONLY** mode.

---

## 4. EXACT FILES UPDATED

1. `D:\IT\web\merge\MYLIFE_TARGET_SCHEMA.md` (Updated to v1.1: all locked decisions, active session partial index, parent consistency validator, reconciled delete semantics, `Theme` enum, and internally verified Prisma schema representation).
2. `D:\IT\web\merge\PHASE_2_SCHEMA_DESIGN_REPORT.md` (Updated revision report).
