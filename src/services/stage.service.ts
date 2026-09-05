import {
  createStageRecord,
  deleteStage as deleteStageRecord,
  findGoalStages,
  findStage,
  updateStage as updateStageRecord,
} from "@/repositories/stage.repository";
import { findGoal } from "@/repositories/goal.repository";
import type { UpdateStageInput } from "@/schemas/stage.schema";
import { requireUserId } from "../lib/ownership";

export class StageServiceError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function createStage(
  input: { goalId: string; name: string; description?: string | null; order?: number },
  userId?: string,
) {
  const owner = requireUserId(userId);
  const goal = await findGoal(owner, input.goalId);
  if (!goal) throw new StageServiceError("Goal tidak ditemukan.");

  return createStageRecord({
    goalId: input.goalId,
    userId: owner,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    order: Number.isInteger(input.order) ? input.order! : 0,
  });
}

export async function updateStage(id: string, input: UpdateStageInput, userId?: string) {
  const owner = requireUserId(userId); if (!(await findStage(owner, id))) throw new StageServiceError("Stage tidak ditemukan.");
  return updateStageRecord(owner, id, input);
}

export async function deleteStage(id: string, userId?: string) {
  const owner = requireUserId(userId); if (!(await findStage(owner, id))) throw new StageServiceError("Stage tidak ditemukan.");
  return deleteStageRecord(owner, id);
}

export async function moveStage(id: string, direction: "up" | "down", userId?: string) {
  const owner = requireUserId(userId); const stage = await findStage(owner, id);
  if (!stage) throw new StageServiceError("Stage tidak ditemukan.");
  const stages = await findGoalStages(owner, stage.goalId);
  const index = stages.findIndex((item) => item.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= stages.length) return stage;
  const target = stages[targetIndex];
  await updateStageRecord(owner, stage.id, { order: target.order });
  return updateStageRecord(owner, target.id, { order: stage.order });
}
