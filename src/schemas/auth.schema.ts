import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  name: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),
  accessCode: z.string().min(1),
});
