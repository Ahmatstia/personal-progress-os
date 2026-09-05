import { z } from "zod";

export const projectStatusEnum = z.enum([
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]);

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, "Judul proyek wajib diisi").max(150, "Judul proyek maksimal 150 karakter"),
  description: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter").optional().nullable(),
  goalId: z.string().trim().cuid("Format goalId tidak valid").optional().nullable(),
  areaId: z.string().trim().cuid("Format areaId tidak valid").optional().nullable(),
  status: projectStatusEnum.default("PLANNING"),
  priority: priorityEnum.default("MEDIUM"),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  targetDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

export const updateProjectSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  goalId: z.string().trim().cuid().optional().nullable(),
  areaId: z.string().trim().cuid().optional().nullable(),
  status: projectStatusEnum.optional(),
  priority: priorityEnum.optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  targetDate: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
  completedAt: z.string().datetime({ offset: true }).or(z.string().date()).optional().nullable(),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
