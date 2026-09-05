import { z } from "zod";

export const goalTypeSchema = z.enum(["LEARNING", "ACHIEVEMENT", "HABIT", "MAINTENANCE"]);
export const goalStatusSchema = z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED", "ARCHIVED"]);
export const goalPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  type: goalTypeSchema.default("LEARNING"),
  description: z.string().trim().max(5000).optional().nullable(),
  areaId: z.string().trim().min(1).optional().nullable(),
  priority: goalPrioritySchema.default("MEDIUM"),
  targetDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()).or(z.date().optional().nullable()),
});

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  type: goalTypeSchema.optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  areaId: z.string().trim().min(1).optional().nullable(),
  status: goalStatusSchema.optional(),
  priority: goalPrioritySchema.optional(),
  targetDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()).or(z.date().optional().nullable()),
});

export type CreateGoalInput = z.input<typeof createGoalSchema>;
export type UpdateGoalInput = z.input<typeof updateGoalSchema>;
