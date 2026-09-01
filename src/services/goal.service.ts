import { createGoal as createGoalRecord } from "@/repositories/goal.repository";
import { createGoalSchema, type CreateGoalInput } from "@/schemas/goal.schema";

export function createGoal(input: CreateGoalInput, userId?: string) {
  return createGoalRecord(createGoalSchema.parse(input), userId);
}
