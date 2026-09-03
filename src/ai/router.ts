import type { Intent } from "./intents";

export type RouteDescriptor = {
  intent: Intent;
  handler:
    | "today"
    | "progress"
    | "analytics"
    | "review"
    | "task"
    | "session"
    | "goal"
    | "stage"
    | "focus"
    | "planner"
    | "help"
    | "unknown";
};

const handlers: Record<Intent, RouteDescriptor["handler"]> = {
  // V1
  TODAY: "today",
  NEXT_ACTION: "task",
  GOAL_STATUS: "progress",
  TASK_STATUS: "task",
  TASK_SEARCH: "task",
  PROGRESS: "progress",
  ANALYTICS: "analytics",
  STREAK: "analytics",
  TIME_SPENT: "analytics",
  COMPLETION: "progress",
  BOTTLENECK: "analytics",
  REVIEW: "review",
  REFLECTION: "review",
  GOAL_CREATE: "goal",
  TASK_CREATE: "task",
  TASK_COMPLETE: "task",
  TASK_REOPEN: "task",
  SESSION_START: "session",
  SESSION_END: "session",
  FOCUS: "focus",
  OVERDUE: "task",
  MOTIVATION: "help",
  HELP: "help",
  UNKNOWN: "unknown",

  // V2
  GOAL_DELETE: "goal",
  GOAL_UPDATE: "goal",
  GOAL_GET: "goal",
  STAGE_CREATE: "stage",
  STAGE_UPDATE: "stage",
  STAGE_DELETE: "stage",
  STAGE_REORDER: "stage",
  STAGE_STATUS: "stage",
  TASK_DELETE: "task",
  TASK_UPDATE: "task",
  TASK_BULK_DELETE: "task",
  TASK_BULK_COMPLETE: "task",
  TASK_REORDER: "task",
  MULTI_STEP: "planner",
};

export function routeIntent(intent: Intent): RouteDescriptor {
  return { intent, handler: handlers[intent] ?? "unknown" };
}
