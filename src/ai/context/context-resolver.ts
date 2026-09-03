import type { ConversationContext } from "./conversation-state";
import { normalizeText } from "../normalization";

export type ResolvedContextReferences = {
  referencedTaskId?: string;
  referencedTaskName?: string;
  referencedStageId?: string;
  referencedStageName?: string;
  referencedGoalId?: string;
  referencedGoalName?: string;
  isRelativeReference: boolean;
  temporalExpression?: {
    type: "TODAY" | "TOMORROW" | "YESTERDAY" | "THIS_WEEK" | "NEXT_WEEK" | "CUSTOM_DATE";
    date?: Date;
    label: string;
  };
};

const RELATIVE_PRONOUNS = [
  "yang tadi",
  "yang ini",
  "yang itu",
  "task tadi",
  "task itu",
  "task ini",
  "goal tadi",
  "goal itu",
  "goal ini",
  "stage tadi",
  "stage itu",
  "stage ini",
  "tersebut",
  "tadi",
  "barusan",
];

export function parseTemporalExpression(text: string): ResolvedContextReferences["temporalExpression"] | undefined {
  const norm = normalizeText(text);
  const now = new Date();

  if (norm.includes("hari ini") || norm.includes("today") || norm.includes("sekarang")) {
    return { type: "TODAY", date: now, label: "hari ini" };
  }
  if (norm.includes("besok") || norm.includes("tomorrow")) {
    const tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);
    return { type: "TOMORROW", date: tmrw, label: "besok" };
  }
  if (norm.includes("kemarin") || norm.includes("yesterday")) {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    return { type: "YESTERDAY", date: yest, label: "kemarin" };
  }
  if (norm.includes("minggu ini") || norm.includes("this week")) {
    return { type: "THIS_WEEK", date: now, label: "minggu ini" };
  }
  if (norm.includes("minggu depan") || norm.includes("next week")) {
    const nextW = new Date(now);
    nextW.setDate(nextW.getDate() + 7);
    return { type: "NEXT_WEEK", date: nextW, label: "minggu depan" };
  }

  // Check for day offsets like "2 hari lagi", "3 hari lagi"
  const offsetMatch = norm.match(/(\d+)\s+hari\s+lagi/);
  if (offsetMatch) {
    const days = parseInt(offsetMatch[1], 10);
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return { type: "CUSTOM_DATE", date: d, label: `${days} hari lagi` };
  }

  return undefined;
}

export function resolveContextReferences(
  rawText: string,
  context: ConversationContext,
  requestContext?: { taskId?: string; taskName?: string; goalId?: string; goalName?: string; stageId?: string }
): ResolvedContextReferences {
  const norm = normalizeText(rawText);
  const isRelative = RELATIVE_PRONOUNS.some((p) => norm.includes(p));

  let taskId = requestContext?.taskId;
  let taskName = requestContext?.taskName;
  let stageId = requestContext?.stageId;
  let stageName = undefined;
  let goalId = requestContext?.goalId;
  let goalName = requestContext?.goalName;

  // If client provided explicit ID or relative pronoun matches
  if (!taskId && (isRelative || !taskName)) {
    if (context.currentTask) {
      taskId = context.currentTask.id;
      taskName = context.currentTask.name;
    } else if (context.lastReferencedEntity?.type === "TASK") {
      taskId = context.lastReferencedEntity.id;
      taskName = context.lastReferencedEntity.name;
    }
  }

  if (!stageId) {
    if (context.currentStage) {
      stageId = context.currentStage.id;
      stageName = context.currentStage.name;
    } else if (context.lastReferencedEntity?.type === "STAGE") {
      stageId = context.lastReferencedEntity.id;
      stageName = context.lastReferencedEntity.name;
    }
  }

  if (!goalId) {
    if (context.currentGoal) {
      goalId = context.currentGoal.id;
      goalName = context.currentGoal.name;
    } else if (context.lastReferencedEntity?.type === "GOAL") {
      goalId = context.lastReferencedEntity.id;
      goalName = context.lastReferencedEntity.name;
    }
  }

  const temporal = parseTemporalExpression(rawText);

  return {
    referencedTaskId: taskId,
    referencedTaskName: taskName,
    referencedStageId: stageId,
    referencedStageName: stageName,
    referencedGoalId: goalId,
    referencedGoalName: goalName,
    isRelativeReference: isRelative,
    temporalExpression: temporal,
  };
}
