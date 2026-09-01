import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(50).default("LEARNING"),
  description: z.string().trim().max(5000).optional().nullable(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
