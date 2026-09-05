import {
  createObjective as createObjectiveRecord,
  deleteObjective as deleteObjectiveRecord,
  findObjective as findObjectiveRecord,
  findObjectivesByGoal as findObjectivesByGoalRecord,
  updateObjective as updateObjectiveRecord,
} from "@/repositories/objective.repository";
import {
  createObjectiveSchema,
  updateObjectiveSchema,
  type CreateObjectiveInput,
  type UpdateObjectiveInput,
} from "@/schemas/objective.schema";
import { requireUserId } from "@/lib/ownership";
import { prisma } from "@/lib/prisma";
import type { ObjectiveStatus } from "@/generated/prisma/client";

export class ObjectiveServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "OBJECTIVE_NOT_FOUND" | "GOAL_NOT_FOUND" | "INVALID_INPUT" = "OBJECTIVE_NOT_FOUND"
  ) {
    super(message);
    this.name = "ObjectiveServiceError";
  }
}

export async function createObjective(input: CreateObjectiveInput, userId?: string) {
  const owner = requireUserId(userId);
  const parsed = createObjectiveSchema.parse(input);

  // Validate goal ownership
  const goal = await prisma.goal.findFirst({
    where: { id: parsed.goalId, userId: owner },
  });
  if (!goal) {
    throw new ObjectiveServiceError("Goal tidak ditemukan atau bukan milik Anda.", "GOAL_NOT_FOUND");
  }

  return createObjectiveRecord(owner, {
    goalId: parsed.goalId,
    title: parsed.title,
    description: parsed.description,
    targetValue: parsed.targetValue,
    currentValue: parsed.currentValue,
    unit: parsed.unit,
    status: parsed.status as ObjectiveStatus,
    dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
  });
}

export async function getObjectivesByGoal(goalId: string, userId?: string) {
  const owner = requireUserId(userId);

  // Ensure goal belongs to user
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: owner },
  });
  if (!goal) {
    throw new ObjectiveServiceError("Goal tidak ditemukan atau bukan milik Anda.", "GOAL_NOT_FOUND");
  }

  return findObjectivesByGoalRecord(owner, goalId);
}

export async function getObjective(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const objective = await findObjectiveRecord(owner, id);
  if (!objective) {
    throw new ObjectiveServiceError("Objective tidak ditemukan.", "OBJECTIVE_NOT_FOUND");
  }
  return objective;
}

export async function updateObjective(id: string, input: UpdateObjectiveInput, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findObjectiveRecord(owner, id);
  if (!existing) {
    throw new ObjectiveServiceError("Objective tidak ditemukan.", "OBJECTIVE_NOT_FOUND");
  }

  const parsed = updateObjectiveSchema.parse(input);

  if (parsed.goalId && parsed.goalId !== existing.goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: parsed.goalId, userId: owner },
    });
    if (!goal) {
      throw new ObjectiveServiceError("Target goal tidak ditemukan atau bukan milik Anda.", "GOAL_NOT_FOUND");
    }
  }

  let status = parsed.status as ObjectiveStatus | undefined;
  let completedAt = parsed.completedAt !== undefined
    ? (parsed.completedAt ? new Date(parsed.completedAt) : null)
    : undefined;

  // Auto-complete if currentValue reaches targetValue and status not explicitly set
  const nextCurrent = parsed.currentValue ?? existing.currentValue;
  const nextTarget = parsed.targetValue ?? existing.targetValue;
  if (!parsed.status && nextCurrent >= nextTarget && existing.status !== "COMPLETED") {
    status = "COMPLETED";
    completedAt = new Date();
  }

  await updateObjectiveRecord(owner, id, {
    ...(parsed.goalId !== undefined && { goalId: parsed.goalId }),
    ...(parsed.title !== undefined && { title: parsed.title }),
    ...(parsed.description !== undefined && { description: parsed.description }),
    ...(parsed.targetValue !== undefined && { targetValue: parsed.targetValue }),
    ...(parsed.currentValue !== undefined && { currentValue: parsed.currentValue }),
    ...(parsed.unit !== undefined && { unit: parsed.unit }),
    ...(status !== undefined && { status }),
    ...(parsed.dueDate !== undefined && { dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null }),
    ...(completedAt !== undefined && { completedAt }),
  });

  return findObjectiveRecord(owner, id);
}

export async function deleteObjective(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findObjectiveRecord(owner, id);
  if (!existing) {
    throw new ObjectiveServiceError("Objective tidak ditemukan.", "OBJECTIVE_NOT_FOUND");
  }

  await deleteObjectiveRecord(owner, id);
  return { success: true, id };
}
