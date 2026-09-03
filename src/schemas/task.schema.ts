import { z } from "zod";

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const taskStatusSchema = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]);


export const createTaskSchema = z.object({
  stageId: z.string().trim().min(1),
  name: z.string().trim().min(1, "Nama task wajib diisi."),
  description: z.string().trim().max(5000).optional().nullable(),
  type: z.string().trim().min(1).default("TASK"),
  priority: taskPrioritySchema.default("MEDIUM"),
  estimatedHours: z.number().finite().min(0).default(0),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const updateTaskSchema = z.object({
  name: z.string().trim().min(1, "Nama task wajib diisi.").optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  type: z.string().trim().min(1).optional(),
  priority: taskPrioritySchema.optional(),
  estimatedHours: z.number().finite().min(0).optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
  status: taskStatusSchema.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
