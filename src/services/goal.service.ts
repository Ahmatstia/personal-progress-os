import { createGoal as createGoalRecord } from "@/repositories/goal.repository";
import { createGoalSchema, type CreateGoalInput } from "@/schemas/goal.schema";

export function createGoal(input: CreateGoalInput) {
  return createGoalRecord(createGoalSchema.parse(input));
}
