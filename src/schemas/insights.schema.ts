import { z } from "zod";

export const insightPeriodSchema = z.enum(["today", "this_week", "this_month", "custom"]).default("this_week");

export const analyticsQuerySchema = z.object({
  period: insightPeriodSchema.optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  goalId: z.string().trim().min(1).optional(),
  areaId: z.string().trim().min(1).optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

export const priorityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeCompleted: z.coerce.boolean().default(false),
  goalId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),
  areaId: z.string().trim().min(1).optional(),
});

export type PriorityQueryInput = z.infer<typeof priorityQuerySchema>;

export const dailyPlanQuerySchema = z.object({
  date: z.coerce.date().optional(),
});

export type DailyPlanQueryInput = z.infer<typeof dailyPlanQuerySchema>;

export const conflictQuerySchema = z.object({
  date: z.coerce.date().optional(),
  days: z.coerce.number().int().min(1).max(30).default(1),
});

export type ConflictQueryInput = z.infer<typeof conflictQuerySchema>;

export const unifiedInboxQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  source: z.enum(["ALL", "CAPTURE", "TASK", "REVIEW", "CONFLICT", "NOTIFICATION"]).default("ALL"),
});

export type UnifiedInboxQueryInput = z.infer<typeof unifiedInboxQuerySchema>;

export const lifeHealthQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(90).default(30),
});

export type LifeHealthQueryInput = z.infer<typeof lifeHealthQuerySchema>;
