import { z } from "zod";

export const createAreaSchema = z.object({
  name: z.string().trim().min(1, "Nama area wajib diisi").max(100, "Nama area maksimal 100 karakter"),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter").optional().nullable(),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Warna harus berupa kode hex (contoh: #6366f1)").default("#6366f1"),
  icon: z.string().trim().min(1).default("compass"),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateAreaSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  icon: z.string().trim().min(1).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type CreateAreaInput = z.input<typeof createAreaSchema>;
export type UpdateAreaInput = z.input<typeof updateAreaSchema>;
