import type { Intent } from "./intents";

export type RouteDescriptor = { intent: Intent; handler: "today" | "progress" | "analytics" | "review" | "task" | "session" | "goal" | "focus" | "help" | "unknown" };
const handlers: Record<Intent, RouteDescriptor["handler"]> = { TODAY: "today", NEXT_ACTION: "task", GOAL_STATUS: "progress", TASK_STATUS: "task", TASK_SEARCH: "task", PROGRESS: "progress", ANALYTICS: "analytics", STREAK: "analytics", TIME_SPENT: "analytics", COMPLETION: "progress", BOTTLENECK: "analytics", REVIEW: "review", REFLECTION: "review", GOAL_CREATE: "goal", TASK_CREATE: "task", TASK_COMPLETE: "task", TASK_REOPEN: "task", SESSION_START: "session", SESSION_END: "session", FOCUS: "focus", OVERDUE: "task", MOTIVATION: "help", HELP: "help", UNKNOWN: "unknown" };
export function routeIntent(intent: Intent): RouteDescriptor { return { intent, handler: handlers[intent] }; }
