import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(100).optional(),
  accessCode: z.string().min(1),
});
