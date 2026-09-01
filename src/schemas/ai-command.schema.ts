import { z } from "zod";

export const aiCommandContextSchema = z.object({
  goalId: z.string().trim().min(1).optional(),
  taskId: z.string().trim().min(1).optional(),
  stageId: z.string().trim().min(1).optional(),
  goalName: z.string().trim().min(1).max(200).optional(),
  taskName: z.string().trim().min(1).max(200).optional(),
});

export const aiCommandSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  confirmed: z.boolean().default(false),
  context: aiCommandContextSchema.optional(),
});

export type AICommandInput = z.input<typeof aiCommandSchema>;
