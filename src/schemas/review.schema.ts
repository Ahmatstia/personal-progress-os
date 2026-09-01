import { z } from "zod";

const reflection = z.string().trim().max(5000).optional().nullable();

export const reviewSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  understanding: z.number().min(1).max(5).optional().nullable(),
  wentWell: reflection,
  difficulties: reflection,
  improvements: reflection,
  nextFocus: reflection,
}).refine((value) => value.periodEnd >= value.periodStart, {
  message: "Period end harus setelah period start.",
  path: ["periodEnd"],
});

export type ReviewInput = z.infer<typeof reviewSchema>;
