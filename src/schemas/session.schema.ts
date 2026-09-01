import { z } from "zod";

export const startSessionSchema = z.object({
  taskId: z.string().trim().min(1),
});

export const endSessionSchema = z.object({
  sessionId: z.string().trim().min(1),
  activity: z.string().trim().max(2000).optional(),
  understanding: z.number().int().min(1).max(5).optional(),
  obstacle: z.string().trim().max(2000).optional(),
  nextAction: z.string().trim().max(2000).optional(),
});

export type EndSessionInput = z.infer<typeof endSessionSchema>;
