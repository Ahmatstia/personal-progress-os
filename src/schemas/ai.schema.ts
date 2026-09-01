import { z } from "zod";
import { intents } from "../ai/intents";

export const aiInputSchema = z.object({ text: z.string().trim().min(1).max(2000) });
export const aiInterpretationSchema = z.object({
  input: z.string(),
  normalizedText: z.string(),
  intent: z.enum(intents),
  confidence: z.number().min(0).max(1),
  confidenceLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
  entities: z.array(z.object({ value: z.string(), type: z.string(), start: z.number().optional(), end: z.number().optional() })),
  source: z.enum(["rule", "baseline", "future-llm"]),
});
