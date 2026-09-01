# AI Production Architecture

Phase 14 adds a local command layer around the existing Phase 8 AI foundation. Phase 16 adds the user-facing command UI. The production inference model remains the existing deterministic classifier; the TF-IDF/SVM and transformer experiments remain offline research artifacts.

## Pipeline

```text
user text
  -> normalizeText
  -> BaselineClassifier
  -> confidence gating
  -> typed entity extraction
  -> optional explicit context resolution
  -> command router
  -> existing domain service
  -> safe result and response message
```

`POST /api/ai/interpret` remains the interpretation-only endpoint. `POST /api/ai/command` is a separate action endpoint and accepts:

```json
{
  "text": "selesaikan task Belajar Python",
  "confirmed": true,
  "context": { "taskName": "Belajar Python" }
}
```

## UI Layer (Phase 16)

The command endpoint is consumed by `AICommandPanel`, a client component mounted on the home, Today, and Analytics pages. The UI never calls the AI classifier or Prisma directly; it only calls `POST /api/ai/command` with the authenticated session cookie.

```
AICommandPanel (client)
  -> POST /api/ai/command (session-scoped)
  -> response mapping (src/ai/command-types.ts)
  -> AIResponse / AIConfirmation / AIAmbiguousSelector
```

Components:

- `AIInput` — text input with submit, disabled while a request is in flight.
- `AIResponse` — read-result rendering (tasks, analytics summary, next action) with typed views, never raw JSON.
- `AIConfirmation` — write-command approval UI with explicit Confirm/Cancel buttons.
- `AIAmbiguousSelector` — task chooser surfaced when a command matches multiple tasks; the selected task id comes from the server response, never free-typed text.
- `AICommandPanel` — orchestrates state, retry, history, and example commands.

### UI states

The panel maps every command response to one of: `idle`, `loading`, `success`, `confirmation_required`, `ambiguous`, `not_found`, `low_confidence`, `unknown`, `error`. State mapping lives in pure functions in `src/ai/command-types.ts` (`resolvePanelState`, `panelStateToMessage`, `intentToReadable`) so it is unit-testable without a browser.

### Safety at the UI

- Write intents (`GOAL_CREATE`, `TASK_CREATE`, `TASK_COMPLETE`, `TASK_REOPEN`, `SESSION_START`, `SESSION_END`, `FOCUS`) are never executed from a single text submission. The server returns `CONFIRMATION_REQUIRED`, the UI shows the confirmation card, and only a second, explicitly confirmed request carries `confirmed: true`.
- Cancel always discards the pending action; it never re-sends the request.
- Ambiguous task matches are never auto-resolved; the task id used in the follow-up comes from the server-provided match list.
- LOW-confidence and UNKNOWN responses are never acted on; the UI shows the "belum cukup yakin" message plus example commands.
- HTTP error mapping: 401 (session ended / login again), 400/422 (input or command unclear), 404 (not found), 409 (confirmation or ambiguity), 500 (retry). Stack traces are never rendered.

## Production Model

The Phase 8 deterministic classifier is reused as the production adapter. Historical Phase 10-13 SVM, embedding, and transformer benchmarks are not loaded by the Next.js runtime. This keeps local inference fast and avoids model artifact coupling.

## Confidence and Safety

- HIGH: safe for reads; writes still require explicit confirmation.
- MEDIUM: safe for cautious reads; writes require explicit confirmation.
- LOW: safe fallback only; no domain action.
- UNKNOWN: safe fallback only.

The classifier confidence is a heuristic score, not calibrated probability. Destructive or important actions never run from an ambiguous task match. A write requires a unique task/entity resolution and `confirmed=true`.

## Entities and Context

Entities are typed as `GOAL`, `TASK`, `DATE`, `DURATION`, `PRIORITY`, and `STATUS` among the existing entity contract. Command payload context is validated by Zod and can provide IDs or explicit names when natural language is insufficient. Context is not inferred as memory; it is supplied explicitly by the caller.

## Supported Commands

Read-only commands use existing services for Today, next action, progress, goal status, task status/search, analytics, streak, time spent, completion, bottlenecks, review guidance, reflection guidance, focus, overdue, help, and motivation.

Confirmed writes support goal creation, task creation, task completion, task reopening, session start, session end, and adding a task to today's focus. Task creation requires an explicit `stageId`; ambiguous task matches return a selection response instead of writing.

## Domain and Database Boundaries

The AI route does not access Prisma directly. It calls service functions, which call repositories. No schema or migration was added. Existing domain validation remains the source of truth for task, session, focus, and goal writes.

## Limitations

The current classifier is phrase-based rather than the offline SVM benchmark model, so natural language coverage remains limited. The command layer does not impersonate a conversational memory system, and review/reflection without an explicit goal context returns guidance rather than fabricated data. Authentication and per-user authorization are outside the current single-user application boundary and must be added before multi-user deployment. The Phase 16 UI is scoped to single-turn commands: no streaming, no conversation memory, and no unsolicited write execution.
