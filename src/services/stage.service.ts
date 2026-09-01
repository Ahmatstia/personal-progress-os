import { deleteStage as deleteStageRecord, findGoalStages, findStage, updateStage as updateStageRecord } from "@/repositories/stage.repository";
import type { UpdateStageInput } from "@/schemas/stage.schema";

export class StageServiceError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function updateStage(id: string, input: UpdateStageInput) {
  if (!(await findStage(id))) throw new StageServiceError("Stage tidak ditemukan.");
  return updateStageRecord(id, input);
}

export async function deleteStage(id: string) {
  if (!(await findStage(id))) throw new StageServiceError("Stage tidak ditemukan.");
  return deleteStageRecord(id);
}

export async function moveStage(id: string, direction: "up" | "down") {
  const stage = await findStage(id);
  if (!stage) throw new StageServiceError("Stage tidak ditemukan.");
  const stages = await findGoalStages(stage.goalId);
  const index = stages.findIndex((item) => item.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= stages.length) return stage;
  const target = stages[targetIndex];
  await updateStageRecord(stage.id, { order: target.order });
  return updateStageRecord(target.id, { order: stage.order });
}
