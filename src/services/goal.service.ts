/* eslint-disable @typescript-eslint/no-explicit-any */
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
    this.name = "GoalServiceError";
  }
}

function withGoalNameAlias<T extends { title: string }>(goal: T): T & { name: string } {
  if (!goal) return goal as any;
  if (!("name" in (goal as any))) {
    Object.defineProperty(goal, "name", {
      get() {
        return this.title;
      },
      enumerable: true,
      configurable: true,
    });
  }
  return goal as any;
}

export async function createGoal(input: CreateGoalInput, userId?: string) {
  const parsed = createGoalSchema.parse(input);
  const title = parsed.title ?? parsed.name ?? "";
  const targetDate = parsed.targetDate ? new Date(parsed.targetDate) : null;
  const result = await createGoalRecord(requireUserId(userId), {
    ...parsed,
    title,
    targetDate,
  });
  return withGoalNameAlias(result);
}

export async function updateGoal(id: string, input: UpdateGoalInput, userId?: string) {
  const owner = requireUserId(userId);
  if (!(await findGoalRecord(owner, id))) throw new GoalServiceError("Goal tidak ditemukan.");
  const validated = updateGoalSchema.parse(input);
  const title = validated.title ?? validated.name;
  const targetDate = validated.targetDate
    ? new Date(validated.targetDate)
    : validated.targetDate === null
      ? null
      : undefined;

  return updateGoalRecord(owner, id, {
    ...validated,
    title,
    targetDate,
  });
}

export async function deleteGoal(id: string, userId?: string) {
  const owner = requireUserId(userId);
  if (!(await findGoalRecord(owner, id))) throw new GoalServiceError("Goal tidak ditemukan.");
  return deleteGoalRecord(owner, id);
}

export async function findGoal(userId: string, id: string) {
  const goal = await findGoalRecord(userId, id);
  return goal ? withGoalNameAlias(goal) : null;
}