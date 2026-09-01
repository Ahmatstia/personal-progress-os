import { createGoal as createGoalRecord } from "@/repositories/goal.repository";
import { createGoalSchema, type CreateGoalInput } from "@/schemas/goal.schema";
import { requireUserId } from "../lib/ownership";

export function createGoal(input: CreateGoalInput, userId?: string) {
  return createGoalRecord(requireUserId(userId), createGoalSchema.parse(input));
}
