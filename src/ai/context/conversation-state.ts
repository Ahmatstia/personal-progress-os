import type { Entity, Intent } from "../intents";

export type ConversationTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  intent?: Intent;
  entities?: Entity[];
  timestamp: Date;
  metadata?: Record<string, unknown>;
};

export type ConversationContext = {
  userId: string;
  currentGoal?: { id: string; name: string };
  currentStage?: { id: string; name: string; goalId: string };
  currentTask?: { id: string; name: string; stageId: string; goalId: string };
  lastReferencedEntity?: { id: string; name: string; type: "GOAL" | "STAGE" | "TASK" };
  lastIntent?: Intent;
  lastAction?: string;
  pendingConfirmation?: {
    intent: Intent;
    token: string;
    arguments: Record<string, unknown>;
    expiresAt: string;
  };
  pendingAmbiguity?: {
    intent: Intent;
    candidates: Array<{ id: string; name: string; type: string; parentName?: string }>;
  };
  turns: ConversationTurn[];
};

// In-memory conversation state cache with 30-minute TTL
const userContextStore = new Map<string, { context: ConversationContext; updatedAt: number }>();
const CONTEXT_TTL_MS = 30 * 60 * 1000;

export function getConversationContext(userId: string): ConversationContext {
  const existing = userContextStore.get(userId);
  if (existing && Date.now() - existing.updatedAt < CONTEXT_TTL_MS) {
    return existing.context;
  }
  const fresh: ConversationContext = {
    userId,
    turns: [],
  };
  userContextStore.set(userId, { context: fresh, updatedAt: Date.now() });
  return fresh;
}

export function updateConversationContext(
  userId: string,
  updater: (ctx: ConversationContext) => Partial<ConversationContext>
): ConversationContext {
  const current = getConversationContext(userId);
  const updates = updater(current);
  const merged: ConversationContext = {
    ...current,
    ...updates,
    turns: updates.turns ?? current.turns,
  };
  userContextStore.set(userId, { context: merged, updatedAt: Date.now() });
  return merged;
}

export function addConversationTurn(
  userId: string,
  turn: Omit<ConversationTurn, "id" | "timestamp">
): ConversationContext {
  const ctx = getConversationContext(userId);
  const newTurn: ConversationTurn = {
    id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date(),
    ...turn,
  };
  const turns = [...ctx.turns.slice(-10), newTurn]; // Keep last 10 turns
  return updateConversationContext(userId, () => ({ turns }));
}

export function clearConversationContext(userId: string): void {
  userContextStore.delete(userId);
}
