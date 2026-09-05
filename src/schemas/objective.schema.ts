import { z } from "zod";

export const objectiveStatusEnum = z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]);

export const createObjectiveSchema = z.object({
  goalId: z.string().trim().cuid("Format goalId tidak valid"),
  title: z.string().trim().min(1, "Judul objective wajib diisi").max(150, "Judul objective maksimal 150 karakter"),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter").optional().nullable(),
  targetValue: z.number().default(100.0),
  currentValue: z.number().default(0.0),
  unit: z.string().trim().max(20, "Unit maksimal 20 karakter").default("%"),
  status: objectiveStatusEnum.default("ACTIVE"),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

export const updateObjectiveSchema = z.object({
  goalId: z.string().trim().cuid().optional(),
  title: z.string().trim().min(1, "Judul objective wajib diisi").max(150).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().trim().max(20).optional(),
  status: objectiveStatusEnum.optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  completedAt: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

export type CreateObjectiveInput = z.input<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.input<typeof updateObjectiveSchema>;
