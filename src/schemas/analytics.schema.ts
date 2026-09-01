import { z } from "zod";

export const analyticsQuerySchema = z.object({
  goalId: z.string().trim().min(1).optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  days: z.coerce.number().int().min(1).max(90).default(30),
}).refine((value) => !value.start || !value.end || value.end >= value.start, {
  message: "End date harus setelah start date.",
  path: ["end"],
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
