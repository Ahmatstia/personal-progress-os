import {
  createGoal as createGoalRecord,
  deleteGoal as deleteGoalRecord,
  findGoal as findGoalRecord,
  updateGoal as updateGoalRecord,
} from "@/repositories/goal.repository";
import {
  createGoalSchema,
  updateGoalSchema,
  type CreateGoalInput,
  type UpdateGoalInput,
} from "@/schemas/goal.schema";
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

export async function updateGoal(id: string, input: UpdateGoalInput, userId?: string) {
  const owner = requireUserId(userId);
  if (!(await findGoalRecord(owner, id))) throw new GoalServiceError("Goal tidak ditemukan.");
  const validated = updateGoalSchema.parse(input);
  const targetDate = validated.targetDate
    ? new Date(validated.targetDate)
    : validated.targetDate === null
      ? null
      : undefined;

  return updateGoalRecord(owner, id, {
    ...validated,
    targetDate,
  });
}

export async function deleteGoal(id: string, userId?: string) {
  const owner = requireUserId(userId);
  if (!(await findGoalRecord(owner, id))) throw new GoalServiceError("Goal tidak ditemukan.");
  return deleteGoalRecord(owner, id);
}