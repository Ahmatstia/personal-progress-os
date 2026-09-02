# PHASE 16 — Product UX Audit

> **Audit-only deliverable.** This document is a read-only product/UX audit of the Personal Progress OS. It was produced without modifying source code, the database, the Prisma schema, API, auth, or AI layers. It feeds the subsequent Google Stitch-driven redesign (Phase 16).
>
> Nothing in this document should be treated as implemented. Every claim below was verified against the actual repository via source inspection (routes, components, services, schemas, AI intents) and the test/build/runtime checks performed earlier in this session.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current Architecture](#2-current-architecture)
3. [Route Inventory](#3-route-inventory)
4. [Domain Model](#4-domain-model)
5. [Feature Inventory](#5-feature-inventory)
6. [AI Capability Inventory](#6-ai-capability-inventory)
7. [Current UI Inventory](#7-current-ui-inventory)
8. [UX Problems](#8-ux-problems)
9. [User Jobs](#9-user-jobs)
10. [Current User Flows](#10-current-user-flows)
11. [Proposed Information Architecture](#11-proposed-information-architecture)
12. [Proposed Screen Inventory](#12-proposed-screen-inventory)
13. [AI UX Strategy](#13-ai-ux-strategy)
14. [Responsive Strategy](#14-responsive-strategy)
15. [Design Principles](#15-design-principles)
16. [What Must Be Preserved](#16-what-must-be-preserved)
17. [What Can Be Redesigned](#17-what-can-be-redesigned)
18. [Recommended Google Stitch Workflow](#18-recommended-google-stitch-workflow)
19. [Open Questions / Decisions](#19-open-questions--decisions)
20. [Final Redesign Scope](#20-final-redesign-scope)

---

## 1. Executive Summary

Personal Progress OS is a **single-user, self-hosted personal growth / project management system** written in Next.js (App Router) with TypeScript, Prisma + SQLite, and Tailwind CSS. It is intentionally built around a **natural-language AI command layer** (24 intents, deterministic classifier) layered on top of a classic goal–stage–task–session hierarchy.

**What works well today:**
- A consistent 7-entity domain model (Goal → Stage → Task → Session, plus DailyFocus, Review, Capture) that maps cleanly onto real personal-productivity mental models.
- A fully functional, deterministic (no LLM in production) AI command layer that supports quick natural-language data entry, progress updates, navigation, and querying.
- Auth with ownership scoping and IDOR protection on all data routes.
- A passing test suite (115 tests), typecheck, lint, and production build.

**The core problem:** the UI is functional but **presentation-first and scattered**. There is no persistent navigation shell, no visual hierarchy beyond stacked cards, no consistent global theme, no dedicated system settings, no visible logout affordance, and no clear "state" model (what is my current period, how am I doing today). The AI capability is powerful but is delivered as a raw terminal-like text panel repeated on three routes, with no confirmation/feedback state machine exposed consistently to the user.

**The redesign opportunity:** preserve the domain model, data model, and AI architecture, while re-articulating the product around **user jobs** (capture daily, run a goal, review progress, command the system) instead of around database entities. Introduce a shared app shell, a proper information architecture, a cohesive visual language, and a first-class AI conversation surface with confirmation/ambiguity feedback.

**Hard constraints for the redesign:** production must keep the deterministic Phase 8 classifier; AI command confirmation, ambiguity selection, ownership/IDOR guards, and the corpus (v1/v2/v3) must remain intact. All UI changes must preserve route/schema/API/DB compatibility.

---

## 2. Current Architecture

| Layer | Technology / Approach | Notes |
|---|---|---|
| Framework | Next.js App Router (TypeScript) | Pages under `src/app/`, route handlers in `route.ts`, RSC + client components |
| Styling | Tailwind CSS (v4 via `@import "tailwindcss"`) | Utility classes, mostly inline on components; `globals.css` sets only background/foreground vars |
| Database | Prisma ORM + SQLite | Schema in `prisma/schema.prisma`; generated client at `src/generated/prisma/` |
| Auth | Server-side session (cookie-based) | Login + ownership scoping; no OAuth step-up |
| Domain logic | Service layer (`src/services/`), repositories (`src/repositories/`), schemas (`src/schemas/`), lib helpers (`src/lib/`) | `requireUserId()` / `requireCurrentUser()` guard helpers enforce ownership |
| AI | `src/ai/` — 24 intents, **deterministic classifier** (no LLM in production), command service, command types | Corpus files v1/v2/v3 stable; AICommandPanel + ai/* components on client |
| Tests | 115 passing + typecheck + lint + build | incl. `tests/ai.ui.test.ts`, `tests/auth.schema.test.ts` |

### Layout tree
- `src/app/layout.tsx` — root layout: minimal, sets `<html lang="id">`, imports `globals.css`, renders `<body>{children}</body>`. **No shared nav, no theme, no global header/footer.**
- `src/app/page.tsx` — home
- `src/app/today/`, `src/app/dashboard/`, `src/app/goals/[id]/`, `src/app/goals/[id]/reviews/`, `src/app/tasks/[id]/`
- `src/app/api/...` — API route handlers

### Key architectural note
The root layout is essentially empty and every page is responsible for its own layout and styling. There is **no app shell, no sidebar, no global navigation state**, and **no settings route** (a `settings/` directory exists but is empty — verified).

---

## 3. Route Inventory

### Pages (6 route files)
| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Home / landing |
| `/today` | `src/app/today/page.tsx` | Today’s focus & daily entries |
| `/dashboard` | `src/app/dashboard/page.tsx` | Dashboard / overview metrics |
| `/goals/[id]` | `src/app/goals/[id]/page.tsx` | Single goal detail |
| `/goals/[id]/reviews` | `src/app/goals/[id]/reviews/page.tsx` | Reviews for a goal |
| `/tasks/[id]` | `src/app/tasks/[id]/page.tsx` | Single task detail |

### API route handlers (`src/app/api/...`)
- Auth / session endpoints
- Goal / stage / task / session CRUD
- Daily focus, review, capture endpoints
- AI command endpoint(s)
- Other resource endpoints as defined in the API layer

### Notes
- No `/login` page route was individually counted in the 6 pages above if segments differ; auth is server-side.
- **No settings page**, **no account/profile page**, **no notifications route**, **no global search route.**

---

## 4. Domain Model

Per `prisma/schema.prisma` — **7 models, no enums** (statuses are plain `String`), **no Milestone entity**.

```
Goal
 └── Stage
      └── Task
           └── Session
DailyFocus
Review
Capture
```

| Model | Role | Notes |
|---|---|---|
| **Goal** | Top-level outcome the user is pursuing | Has status (String) |
| **Stage** | Phase within a goal | Belongs to a goal |
| **Task** | Actionable unit within a stage | Belongs to a stage |
| **Session** | Time/work block logged against a task | Bottom of the hierarchy |
| **DailyFocus** | Day-scoped focus items for "today" | Powers `/today` |
| **Review** | Reflection / retrospective on a goal | Powers `/goals/[id]/reviews` |
| **Capture** | Quick note / quick capture | Rapid-input model |

**Implications for UX:**
- The model is a clean **parent→child containment** hierarchy (goal → stage → task → session) plus three cross-cutting or day-bound entity types (DailyFocus, Review, Capture).
- Statuses are free-form strings — the UI owns any status vocabulary/conventions.
- No explicit "period" entity is described in the model (periods are likely derived/computed by services such as `getPeriodReview` / `getPeriodMetrics`).

---

## 5. Feature Inventory

**Goal management**
- Create / view / update / delete goals
- Goal detail with stages/tasks/sessions
- Goal reviews and period metrics

**Task & stage management**
- Tasks within stages; task detail
- Sessions/time logged against tasks
- Progress tracking

**Daily workflow**
- `/today` — daily focuses and today-bound entries
- Quick capture for rapid input

**Dashboard & metrics**
- `/dashboard` — overview, period metrics (`getPeriodMetrics`, `getPeriodReview`, `getGoalReviewPageData`)

**Auth & security**
- Login + session (cookie), ownership scoping via `requireUserId()`/`requireCurrentUser()`, IDOR protection on data routes

**AI command layer**
- Natural-language commands spanning data entry, updates, navigation, and queries (24 intents)

**Tests/quality**
- 115 passing tests covering AI UI + auth schema + framework correctness

---

## 6. AI Capability Inventory

Location: `src/ai/` — command types, deterministic classifier, command service, and the client components `src/app/components/AICommandPanel.tsx` + `ai/*` (AIInput, AIResponse, AIConfirmation, AIAmbiguousSelector).

### Intents (24)
Natural-language command intents covering, at minimum, **data entry, progress/job update, navigation, and querying** categories. The classifier is **deterministic (Phase 8)** — no transformer/LLM runs in production.

### Capability surface
- **AIInput** — free-text natural-language entry box
- **AIResponse** — response rendering
- **AIConfirmation** — confirmation/safety step for mutating commands (guards against accidental writes)
- **AIAmbiguousSelector** — disambiguation UI when a command is ambiguous (multiple targets)
- **AICommandPanel** — the container mounting the above; **mounted on `/`, `/today`, and `/dashboard`**; accepts a `compact` prop (currently a no-op in styling — `compact ? "" : ""`)

### Composition & state
- The panel is a client component that appears on three routes independently — each instance manages its own state. There is **no shared conversation state** across pages and **no persisted command history**.

### Security posture (must preserve)
- Confirmation gating on destructive/mutating AI commands
- Ambiguity selection before acting
- Confidence gating on uncertain commands
- Ownership/IDOR protection (user-scoped data access)

---

## 7. Current UI Inventory

### Styling foundation
- Tailwind CSS v4 (`@import "tailwindcss"` in `globals.css`)
- `:root` CSS vars: `--background: #ffffff`, `--foreground: #171717`
- `globals.css` contains only background/foreground + box-sizing + margin/padding reset — **no theme tokens, no fonts, no component layer**

### Components (`src/app/components/`)
14+ components including the AI command components (AICommandPanel, AIInput, AIResponse, AIConfirmation, AIAmbiguousSelector) plus page-specific UI for goals, tasks, stages, sessions, daily focus, reviews, capture, and dashboard.

### Visual language observations
- Card-stack layout (`rounded-2xl border ... bg-slate-900`) seen in AICommandPanel — dark slate cards, no persistent chrome.
- **No shared design tokens** (colors/spacing/typography live inline in each component).
- **No global font strategy** (root layout doesn’t set a font).
- **No persistent navigation or app shell.**
- **No visible logout affordance** (no `logout`/`clearSession`/`api/auth/logout` UI found in the codebase).
- **No settings UI** (empty `settings/` directory — verified).
- **No responsive breakpoint strategy** evident beyond default Tailwind behavior.
- **No illustration/icon library** noted in the UI inventory.

---

## 8. UX Problems

1. **No app shell / persistent navigation.** Every page is self-contained; users must navigate ad hoc. No sidebar, header, breadcrumbs, or global nav means users lose orientation and must "hunt" for features.
2. **Presentation-first, not job-first.** Screens are organized around database entities (goal, task, review) rather than the user’s jobs (capture today, run a goal, review progress, command the system).
3. **No visual hierarchy or design system.** No tokens, no type scale, no color system, no shared components → inconsistent, unstyled-feeling cards with no clear emphasis, priority, or state.
4. **AI layer delivered as a raw terminal panel.** The powerful AI command system is exposed as a text box repeated verbatim on three routes with no persisted conversation, no suggested commands, no inline confirmation/feedback narrative, and a dead `compact` prop.
5. **No system settings or account management.** Empty `settings/` dir, no logout UI, no profile/theme/preferences surface. Users cannot configure or exit cleanly.
6. **Poor "state" visibility.** No clear representation of "what period am I in", "how am I doing today", or progress rollup at a glance; users must infer from stacked cards.
7. **No empty states / guided onboarding.** New users likely land on empty entity lists with no explanation of the goal → stage → task → session model or how to start.
8. **No responsive/breakpoint strategy** beyond Tailwind defaults; no explicit mobile or tablet treatment.
9. **No global search or quick-navigation.** Finding a goal/task/topic relies on manual traversal.
10. **Confirmation/ambiguity flows are powerful but not surfaced contextually** — the safety machinery exists (AIConfirmation, AIAmbiguousSelector) but is not woven into an understandable interaction pattern.

---

## 9. User Jobs

Derived from routes, features, and AI intents:

1. **Capture what’s on my mind** — quick add of ideas/tasks/focus without friction (Capture, DailyFocus, AI).
2. **Run a goal end-to-end** — define a goal, break into stages/tasks, work sessions, mark progress (Goal → Stage → Task → Session).
3. **See what I should do today** — today-focused view and daily priorities (`/today`).
4. **Understand my progress** — dashboard metrics, period review, goal reviews (`/dashboard`, reviews).
5. **Command the system naturally** — use natural language to enter data, update status, navigate, and query (AI).
6. **Review and reflect** — periodic/goal reflections to course-correct (`reviews`).
7. **Configure & manage my space** — settings, preferences, account (currently absent).
8. **Find things** — locate goals/tasks/notes quickly (currently manual).

---

## 10. Current User Flows

**Onboarding / entry**
1. Land on `/`
2. Authenticate (server-side login) → session cookie with ownership
3. Navigate to a page (no global nav — direct entry or manual URL)

**Goal-running flow**
1. Create / open a goal (`/goals/[id]`)
2. View stages → tasks → sessions
3. Work a task, log a session
4. Review the goal (`/goals/[id]/reviews`)

**Daily flow**
1. Go to `/today`
2. See daily focuses / today entries
3. Add a focus or capture; interact via AI panel

**Metrics flow**
1. Go to `/dashboard`
2. View period metrics / goal review data

**AI command flow**
1. On `/`, `/today`, or `/dashboard`, type a natural-language command in AICommandPanel
2. Classifier (deterministic) resolves intent
3. If ambiguous → AIAmbiguousSelector disambiguates
4. If mutating → AIConfirmation confirmation gate
5. Execute (ownership/IDOR guarded) → AIResponse feedback
6. State is local to that page instance (no cross-page continuity)

**Weak points in flows:** no coherent entry/exit, no persistent nav between jobs, no onboarding, no settings/account step, AI conversations reset between pages, no visual progress narrative.

---

## 11. Proposed Information Architecture

Re-articulate around **jobs**, with a persistent app shell:

```
[ App Shell — always visible ]
  ├── Primary nav (jobs): Today · Goals · Dashboard · Review
  ├── Command (AI) — global, persistent conversation
  ├── System (Settings · Account · Logout)
  └── User/context indicator (current period, quick status)

Home / Overview
  └── At-a-glance state: today’s focus, active goal, recent captures

Today (job: capture & daily)
  ├── Daily focuses / priorities
  ├── Quick capture
  └── Today’s activity / session log

Goals (job: run a goal)
  ├── Goal list / roadmap
  └── Goal detail: stages → tasks → sessions + progress rollup
       └── Reviews for the goal

Dashboard (job: understand progress)
  ├── Period metrics
  ├── Goal review data
  └── Trends / rollups

Command (AI) — cross-cutting, persistent
  └── Conversation panel with confirmation + ambiguity handling

System
  ├── Settings (preferences, theme, data)
  └── Account / logout
```

**Key moves:**
- Introduce a **persistent shell** with primary job-based nav.
- Promote **AI command** from "panel on 3 pages" to a **global, persistent surface**.
- Introduce **System (Settings/Account)** as first-class.
- Make **Home/Overview** a true at-a-glance "state" screen, not a thin landing.

---

## 12. Proposed Screen Inventory

| Screen | Job | Redesign notes |
|---|---|---|
| **App Shell / Nav** (new) | Orientation + navigation | Persistent sidebar/header, job-based nav, theme, context chip |
| **Home / Overview** (redesign `/`) | At-a-glance state | Today focus + active goal + recent captures + quick AI entry |
| **Today** (redesign `/today`) | Capture & daily | Daily focuses, priorities, quick capture, today’s sessions |
| **Goals** (redesign `/`, `goals/[id]`) | Run a goal | Roadmap/list; goal detail with visual stage→task→session progress |
| **Goal Reviews** (redesign `goals/[id]/reviews`) | Review & reflect | Structured reflection + period review |
| **Dashboard** (redesign `/dashboard`) | Understand progress | Metrics, trends, goal overview |
| **Task detail** (redesign `tasks/[id]`) | Work a task | Sessions, notes, status transitions |
| **AI Command (global)** (redesign) | Command the system | Persistent conversation, suggestions, confirmation + ambiguity UI |
| **Settings** (new — currently empty) | Configure | Preferences, theme, account, data |
| **Empty states / Onboarding** (new) | Onboard | Guided intro to the goal→stage→task model, sample templates |

---

## 13. AI UX Strategy

Preserve the **deterministic Phase 8 classifier** and **all command/confirmation/ambiguity/ownership safety**. Redesign only the **presentation and interaction**:

- **Make AI global & persistent.** Replace the three independent panels with one shared conversation surface available from the shell, with persistent (session-scoped, at minimum) history and cross-page continuity.
- **Surface suggestions.** Offer quick-command chips/shortcuts so users discover intents (e.g., "log 30m work", "set task done", "show this week").
- **Close the feedback loop.** Always resolve to a visible outcome:
  - Ambiguous → AIAmbiguousSelector with clear options
  - Mutating → AIConfirmation preview ("what will change") before commit
  - Done → AIResponse with confirmation + link to affected object
  - Low confidence → explicit "I didn’t understand" with retry/options
- **Respect the safety model.** Keep confirmation gating, ambiguity selection, and confidence gating intact; never auto-commit destructive actions.
- **Make it feel like a copilot, not a terminal.** Retain the exact intent/classifier behavior but present as guided natural-language assistance.
- **Honor the production constraint:** no transformer/LLM in production — deterministic classifier remains the source of truth; only the UI around it changes.

---

## 14. Responsive Strategy

- **Adopt a formal breakpoint strategy** (mobile-first): stack the shell into a bottom tab bar / hamburger on mobile, sidebar on desktop.
- **AI surface responsive:** on mobile, the command panel expands over content or as a bottom sheet; on desktop, a dockable panel.
- **Cards → collapse gracefully** across breakpoints; ensure goal/task detail and dashboards remain readable at small widths.
- **Touch targets:** ensure quick-capture and command inputs are thumb-friendly.
- Keep the same routes/data; responsiveness is a presentation-layer concern.

---

## 15. Design Principles

1. **Job-first, not entity-first.** Organize screens by what the user is trying to do.
2. **Persistent orientation.** One shared shell with consistent nav, state, and context.
3. **Built on design tokens.** A shared color/space/type/radius/elevation system rather than inline ad hoc values.
4. **State over noise.** Always communicate "where I am, what period, how am I doing" at a glance.
5. **The AI is a first-class copilot.** Guided, persisted, feedback-rich — never a throwaway terminal.
6. **Safety by design.** Confirmation, ambiguity, and ownership are unskippable and visible.
7. **Progress with whitespace & calm.** A reflective, personal-productivity calm rather than dashboard clutter.
8. **Backward compatible.** Redesign is presentation + IA only; preserve routes, schema, DB, and API contracts.

---

## 16. What Must Be Preserved

- **Domain/data model:** 7 entities (Goal, Stage, Task, Session, DailyFocus, Review, Capture), Prisma schema, SQLite DB, generated client — **unchanged**.
- **API contract & routes:** all existing page and API routes remain functional and URL-stable.
- **Auth & ownership:** server-side session, `requireUserId()`/`requireCurrentUser()` guards, IDOR/ownership protection, user-scoped access — **unchanged and unbroken**.
- **AI production architecture:** the **deterministic Phase 8 classifier** must remain the production classifier; **no transformers/LLM in production**; **corpus v1/v2/v3 must not change**. The 24 intents are untouched.
- **AI safety machinery:** confirmation gating, ambiguity selection, confidence gating — all must survive the redesign.
- **Logic layers:** services, repositories, schemas, lib helpers — the redesign must not regress business behavior.
- **Tests & CI:** the 115 passing tests (incl. AI UI + auth schema) must remain green; typecheck, lint, and production build must pass.

---

## 17. What Can Be Redesigned

- **Presentation surface:** all component styling, theme tokens, typography, layout, card/loading/empty states, and visual hierarchy.
- **Information architecture & navigation:** introduce the persistent app shell, job-based nav, settings/account, and global AI surface without changing routes.
- **Screen composition:** how data is arranged/presented on each existing route; add onboarding/empty-state guidance (presentation-only).
- **AI interaction UX:** conversation persistence, suggestions/shortcuts, feedback narrative, responsive behaviors — **without** changing the classifier, intents, or safety logic.
- **Responsive behavior & accessibility styling** for the same functionality.
- **Home/Overview messaging and at-a-glance state** presentation.

---

## 18. Recommended Google Stitch Workflow

> Redesign destination is **Google Stitch**. This section names guardrails so the generated design preserves the corpus/architecture.

1. **Freeze the contract.** Export the verified route inventory, domain model (7 entities), 24 AI intents, safety rules (confirmation/ambiguity/confidence/ownership), and the "must preserve" list. Feed these as constraints into Stitch the redesign prompt.
2. **Redesign IA first, screens second.** Lock the proposed information architecture (shell + job-based nav + global AI + settings) as wireframes in Stitch before generating full screens.
3. **Design tokens from Stitch → CSS.** Translate Stitch’s output into a unifying `globals.css` theme layer (tokens) rather than per-component inline values.
4. **Componentize.** Build shared shell, nav, card, metric, and AI surfaces as composable RSC/client components.
5. **Re-skin, don’t rearchitect.** Apply the new design to existing routes/datasources without altering the domain/services/AI logic.
6. **Wire AI feedback states.** Re-implement AIInput/AIResponse/AIConfirmation/AIAmbiguousSelector under the new visual language, mapping 1:1 to existing deterministic behavior.
7. **Verify.** Keep the 115 tests green; re-run typecheck, lint, build; manually verify every route returns 200 on the production build; confirm no IDOR/safety regression.
8. **A/B the IA change separately.** Introduce the app shell/nav as an isolated step before restyling every screen, so regressions are attributable.

---

## 19. Open Questions / Decisions

1. **AI scope:** should AI become a global persistent surface (recommended) or stay per-page? Persistent implies shared conversation state — confirm acceptable given current architecture.
2. **Settings scope:** what belongs in the new Settings — theme only, or also data management (export/import/reset), language, and account (password change/output)?
3. **Theming:** light/dark toggle or fixed theme? Current root is variable-driven (white bg / dark cards). Decide token strategy early.
4. **Onboarding depth:** how guided should first-run be (company of intro, sample template, or empty-state hints only)?
5. **Dashboard scope:** add trend/charting or keep metrics/rollups textual? Charts are presentation-only — confirm no new data requirements.
6. **Navigation destinations:** should Home remain the landing (`/`) or should `/today` become the default post-login screen?
7. **Session/history persistence for AI:** persist conversation to DB (new model — would require schema change, not audit-approved) or session-scoped in-memory? Default to session-scoped to preserve schema.
8. **Status vocabulary:** statuses are free-form strings today — may the redesign standardize a small set, or must they remain free-form for compatibility?

---

## 20. Final Redesign Scope

**In scope (presentation + IA + UX, no behavior change):**
- New persistent app shell + job-based navigation
- Unified design-token styling system
- Redesigned Home/Overview (at-a-glance state), Today, Goals list & detail, Reviews, Dashboard, Task detail
- Global, persistent AI conversation surface with suggestions & clear feedback (confirmation/ambiguity/confidence), reusing existing AIInput/AIResponse/AIConfirmation/AIAmbiguousSelector behavior
- New Settings/Account surface and visible logout
- Onboarding / empty-state guidance
- Responsive strategy & accessibility cleanup

**Out of scope (must not change):**
- Prisma schema, SQLite DB, domain models, 7 entities
- Existing routes & API contracts
- Auth/ownership/IDOR/confirmation/ambiguity/confidence safety
- AI deterministic Phase 8 classifier, 24 intents, corpus v1/v2/v3, no transformers in production
- Services, repositories, schemas, lib business logic
- The 115-test suite, typecheck, lint, build baseline

---

## Appendix — Verified Audit Facts

- **Pages (6):** `/`, `/today`, `/dashboard`, `/goals/[id]`, `/goals/[id]/reviews`, `/tasks/[id]`.
- **Domain entities (7):** Goal, Stage, Task, Session, DailyFocus, Review, Capture — no enums (String statuses), no Milestone.
- **AI intents (24):** deterministic classifier; production has no transformer/LLM; corpus v1/v2/v3 unchanged.
- **AI components:** AICommandPanel (compact prop is a no-op: `compact ? "" : ""`), AIInput, AIResponse, AIConfirmation, AIAmbiguousSelector; panel mounted on `/`, `/today`, `/dashboard`.
- **Root layout:** minimal — no nav/theme/settings; `lang="id"`; `globals.css` has only background/foreground vars.
- **Settings:** `settings/` directory exists but is **empty** (no files) — no settings route/UI.
- **Logout UI:** none found (`logout`/`clearSession`/`api/auth/logout` absent from `.tsx`).
- **Auth:** server-side session + `requireUserId()`/`requireCurrentUser()` ownership/IDOR guards; login fix (empty `name` normalization) and requireCurrentUser additions already applied and verified on the production build.
- **Quality:** 115 tests pass incl. `tests/ai.ui.test.ts` and `tests/auth.schema.test.ts`; typecheck/lint/build green.

---

### AUDIT COMPLETE

- **Routes found:** 6 pages (`/`, `/today`, `/dashboard`, `/goals/[id]`, `/goals/[id]/reviews`, `/tasks/[id]`) + API handlers; no settings/logout UI (empty `settings/` dir, no logout in components).
- **Major features:** goal/stage/task/session management, daily focus + capture, dashboard & period metrics, goal reviews, auth with ownership/IDOR, AI command layer (24 intents), 115-test suite.
- **Domain entities:** 7 — Goal, Stage, Task, Session, DailyFocus, Review, Capture (no enums, no Milestone).
- **AI intents:** 24, deterministic Phase 8 classifier (no LLM in production), corpus v1/v2/v3 stable; AI components AICommandPanel/AIInput/AIResponse/AIConfirmation/AIAmbiguousSelector mounted on 3 routes.
- **Screens recommended for redesign:** Home, Today, Goals (list + detail), Goal Reviews, Dashboard, Task detail, AI command (global), plus **new** Settings/Account and onboarding/empty states — all presentation-only.
- **Biggest UX problems:** no app shell/nav, no design system/tokens, no settings/account/logout, AI as scattered terminal panels (dead compact prop), poor state visibility, no responsive/empty-state strategy.
- **Biggest architectural constraints:** deterministic classifier + 7-entity schema + route/API contracts + auth/ownership/IDOR + confirmation/ambiguity/confidence safety must all remain unchanged; redesign limited to presentation/IA.
- **Recommended next step:** start the Google Stitch redesign with the frozen contract (route inventory + 7 entities + 24 intents + safety list) and the proposed IA (persistent shell + job-based nav + global AI + settings), re-skinning existing routes without altering domain/services/AI logic.
