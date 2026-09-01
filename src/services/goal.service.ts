import { createGoal as createGoalRecord, deleteGoal as deleteGoalRecord, findGoal as findGoalRecord } from "@/repositories/goal.repository";
import { createGoalSchema, type CreateGoalInput } from "@/schemas/goal.schema";
import { requireUserId } from "../lib/ownership";

export class GoalServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "GOAL_NOT_FOUND" = "GOAL_NOT_FOUND",
  ) {
    super(message);
  }
}

export function createGoal(input: CreateGoalInput, userId?: string) {
  return createGoalRecord(requireUserId(userId), createGoalSchema.parse(input));
}

export async function deleteGoal(id: string, userId?: string) {
  const owner = requireUserId(userId);
  if (!(await findGoalRecord(owner, id))) throw new GoalServiceError("Goal tidak ditemukan.");
  return deleteGoalRecord(owner, id);
}