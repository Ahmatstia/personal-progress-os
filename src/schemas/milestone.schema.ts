import { z } from "zod";

export const milestoneStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const createMilestoneSchema = z.object({
  projectId: z.string().trim().cuid("Format projectId tidak valid"),
  title: z.string().trim().min(1, "Judul milestone wajib diisi").max(150, "Judul milestone maksimal 150 karakter"),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter").optional().nullable(),
  order: z.number().int().default(0),
  status: milestoneStatusEnum.default("PENDING"),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

export const updateMilestoneSchema = z.object({
  projectId: z.string().trim().cuid().optional(),
  title: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  order: z.number().int().optional(),
  status: milestoneStatusEnum.optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  completedAt: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

export type CreateMilestoneInput = z.input<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.input<typeof updateMilestoneSchema>;
