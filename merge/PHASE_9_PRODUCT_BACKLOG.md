# PHASE 9 PRODUCT BACKLOG
## Catalog of Product Usability Findings, Gaps & Enhancements

**Project:** MyLife  
**Document Status:** ACTIVE  
**Last Updated:** 2026-09-04  

---

## 1. Issue: Project-parented Task Breadcrumb Crash on Task Detail Page

### Severity
**P1 (Critical)**

### Problem
In `src/app/(app)/tasks/[id]/page.tsx`, the breadcrumb directly evaluates `task.stage?.goal.title` and `href={`/goals/${task.stage?.goalId}`}`. When a task has `projectId` (parent is Project) and `stageId: null`, evaluating `task.stage?.goal.title` triggers a runtime `TypeError` (`Cannot read properties of undefined (reading 'title')`), which crashes the entire page for the user.

### Evidence
- `src/app/(app)/tasks/[id]/page.tsx`: Line 35–43.
- Schema allows `Task` to have either `stageId` or `projectId`.

### User Impact
Users who create tasks under Projects or convert Captures into Project tasks cannot view or interact with their tasks at `/tasks/[id]`.

### Recommended Solution
Implement conditional parent resolution in the breadcrumb:
- If `task.stage`: render `← Goal: {task.stage.goal.title} / {task.stage.name}` linking to `/goals/{goalId}`.
- If `task.project`: render `← Project: {task.project.title}` linking to `/projects/{projectId}`, and optionally show `{task.milestone.title}` if attached to a milestone.

### Effort
**LOW**

### Recommendation
**FIX NOW** (Phase 9 Implementation)

---

## 2. Issue: Inability to Create or View Tasks Directly in Project Detail View

### Severity
**P1 (Critical)**

### Problem
In `src/app/(app)/projects/[id]/ProjectDetailView.tsx`, users can create and toggle Milestones, but there is no mechanism to add Tasks to the Project or its Milestones, nor does it display the list of project tasks.

### Evidence
- `ProjectDetailView.tsx`: Milestones list shows `m._count?.tasks`, but does not list the tasks nor provide an "Add Task" button.
- A user must navigate to Capture and convert a note to add a task to a project.

### User Impact
Breaks the natural `Project -> Milestone -> Task` mental model. Users feel stranded after creating a project.

### Recommended Solution
1. Add an inline task creation modal or expander allowing users to add a task to the project and select an optional milestone.
2. Render the tasks grouped by milestone or as a project task checklist.

### Effort
**MEDIUM**

### Recommendation
**FIX NOW** (Phase 9 Implementation)

---

## 3. Issue: Product Identity Inconsistency Across App Chrome

### Severity
**P2 (Major)**

### Problem
The navigation sidebar, mobile top bar, and login screen display "ProgressOS" or "Personal ProgressOS" instead of **MyLife**.

### Evidence
- `Sidebar.tsx`: Line 125 (`Progress<span className="gradient-text">OS</span>`)
- `AppShell.tsx`: Line 155 (`Progress<span className="gradient-text">OS</span>`)
- `page.tsx`: Line 63 (`Personal Progress<span className="gradient-text">OS</span>`)

### User Impact
Weakens product identity and user brand resonance.

### Recommended Solution
Update brand titles to `My<span className="gradient-text">Life</span>` with subtitle *"Personal Life Operating System"*.

### Effort
**LOW**

### Recommendation
**FIX NOW** (Phase 9 Implementation)

---

## 4. Issue: Duplicate Chart Icon in Primary Navigation

### Severity
**P2 (Major)**

### Problem
Both `/insights` ("Insights") and `/dashboard` ("Analitik") use the icon `chart`, leading to visual ambiguity.

### Evidence
- `Sidebar.tsx`: `primaryNav` defines `{ href: "/insights", icon: "chart" }` and `{ href: "/dashboard", icon: "chart" }`.

### User Impact
Users cannot intuitively distinguish between future-oriented smart insights (Life Health, conflicts, daily plan) and retrospective analytics (heatmap, 90-day focus time).

### Recommended Solution
Change `/insights` icon to `sparkles` and retain `chart` for `/dashboard`.

### Effort
**LOW**

### Recommendation
**FIX NOW** (Phase 9 Implementation)

---

## 5. Issue: Empty State Experience for First-Time Users on Home

### Severity
**P2 (Major)**

### Problem
A new user with 0 goals and 0 tasks sees multiple empty state boxes with "Pilih fokus hari ini untuk mulai" and "Belum ada task yang siap dikerjakan", without a clear primary call to action.

### Evidence
- `src/app/(app)/page.tsx`: Lines 127–134 and 273–286.

### User Impact
Decision fatigue on first login. Users do not immediately know whether to create an Area, a Goal, or a Project first.

### Recommended Solution
Provide a prominent, welcoming Getting Started card when `activeGoals.length === 0`:
*"Selamat datang di MyLife! Buat Goal pertama Anda untuk menetapkan arah, atau catat pemikiran cepat di Inbox."* with a primary button to create a Goal.

### Effort
**LOW**

### Recommendation
**FIX NOW** (Phase 9 Implementation)

---

## 6. Issue: Understated Dopamine Feedback on Task Completion

### Severity
**P3 (Minor)**

### Problem
When a task is marked completed, the status pill updates to green, but there is minimal celebratory audio/visual reinforcement.

### User Impact
Completing a task feels utilitarian rather than rewarding.

### Recommended Solution
Add subtle confetti particle effect or animated checkmark badge on task completion in `TaskItem.tsx` and `TaskStatusPicker.tsx`.

### Effort
**LOW**

### Recommendation
**FUTURE** (Enhancement Backlog)

---

## 7. Issue: Standalone Global Search / Command Palette

### Severity
**P3 (Minor)**

### Problem
⌘K currently opens the AI Assistant drawer. A traditional non-AI fuzzy command palette (jump to goal, project, task, or page) would improve desktop speed.

### User Impact
Power users cannot instantly jump between entities via keyboard.

### Recommended Solution
Implement a client-side fuzzy navigation palette for Goals, Projects, and Pages.

### Effort
**MEDIUM**

### Recommendation
**FUTURE** (Enhancement Backlog)
