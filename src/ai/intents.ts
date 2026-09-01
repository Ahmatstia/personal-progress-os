export const intents = [
  "TODAY", "NEXT_ACTION", "GOAL_STATUS", "TASK_STATUS", "TASK_SEARCH", "PROGRESS", "ANALYTICS", "STREAK", "TIME_SPENT", "COMPLETION", "BOTTLENECK", "REVIEW", "REFLECTION", "GOAL_CREATE", "TASK_CREATE", "TASK_COMPLETE", "TASK_REOPEN", "SESSION_START", "SESSION_END", "FOCUS", "OVERDUE", "MOTIVATION", "HELP", "UNKNOWN",
] as const;

export type Intent = (typeof intents)[number];
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
export type Entity = { value: string; type: "GOAL" | "TASK" | "STAGE" | "DATE" | "TIME" | "DURATION" | "PRIORITY" | "STATUS"; start?: number; end?: number };
export type IntentResult = { intent: Intent; confidence: number; normalizedText: string; entities: Entity[]; source: "rule" | "baseline" | "future-llm" };
