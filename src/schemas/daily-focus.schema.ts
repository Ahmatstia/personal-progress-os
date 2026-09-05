import { z } from "zod";

export const createDailyFocusSchema = z.object({
  taskId: z.string().trim().cuid("Format taskId tidak valid"),
  date: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  order: z.number().int().optional(),
});

export const reorderDailyFocusSchema = z.object({
  direction: z.enum(["up", "down"]).optional(),
  order: z.number().int().optional(),
});

export type CreateDailyFocusInput = z.input<typeof createDailyFocusSchema>;
export type ReorderDailyFocusInput = z.input<typeof reorderDailyFocusSchema>;
