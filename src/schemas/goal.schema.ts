import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(50).default("LEARNING"),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const updateGoalSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  type: z.string().trim().min(1).max(50).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
  targetDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
