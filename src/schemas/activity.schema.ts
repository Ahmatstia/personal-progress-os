import { z } from "zod";

export const activityCategoryEnum = z.enum([
  "WORK",
  "LEARNING",
  "HEALTH_FITNESS",
  "PERSONAL",
  "REST",
  "CHORE",
]);

export const createActivitySchema = z
  .object({
    title: z.string().trim().min(1, "Judul aktivitas wajib diisi").max(200, "Judul aktivitas maksimal 200 karakter"),
    category: activityCategoryEnum.default("WORK"),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
    durationMinutes: z.number().int().min(0).optional(),
    productivityRating: z.number().int().min(1).max(5).optional().nullable(),
    energyLevel: z.number().int().min(1).max(5).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
    taskId: z.string().trim().cuid().optional().nullable(),
    projectId: z.string().trim().cuid().optional().nullable(),
    areaId: z.string().trim().cuid().optional().nullable(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      return end >= start;
    },
    {
      message: "Waktu selesai (endTime) tidak boleh mendahului waktu mulai (startTime)",
      path: ["endTime"],
    }
  );

export const updateActivitySchema = z
  .object({
    title: z.string().trim().min(1, "Judul aktivitas wajib diisi").max(200).optional(),
    category: activityCategoryEnum.optional(),
    startTime: z.string().datetime({ offset: true }).optional(),
    endTime: z.string().datetime({ offset: true }).optional(),
    durationMinutes: z.number().int().min(0).optional(),
    productivityRating: z.number().int().min(1).max(5).optional().nullable(),
    energyLevel: z.number().int().min(1).max(5).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
    taskId: z.string().trim().cuid().optional().nullable(),
    projectId: z.string().trim().cuid().optional().nullable(),
    areaId: z.string().trim().cuid().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime).getTime() >= new Date(data.startTime).getTime();
      }
      return true;
    },
    {
      message: "Waktu selesai (endTime) tidak boleh mendahului waktu mulai (startTime)",
      path: ["endTime"],
    }
  );

export type CreateActivityInput = z.input<typeof createActivitySchema>;
export type UpdateActivityInput = z.input<typeof updateActivitySchema>;
