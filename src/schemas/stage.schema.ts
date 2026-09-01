import { z } from "zod";

export const updateStageSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export type UpdateStageInput = z.infer<typeof updateStageSchema>;
