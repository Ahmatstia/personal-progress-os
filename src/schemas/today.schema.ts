import { z } from "zod";

export const focusSchema = z.object({ taskId: z.string().trim().min(1), date: z.coerce.date().optional() });
export const focusOrderSchema = z.object({ order: z.number().int().min(0).optional(), direction: z.enum(["up", "down"]).optional() });
export const captureSchema = z.object({ content: z.string().trim().min(1).max(5000) });
