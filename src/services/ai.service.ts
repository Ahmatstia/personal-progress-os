import { baselineClassifier } from "../ai/classifier";
import { extractEntities } from "../ai/entities";
import { normalizeText } from "../ai/normalization";
import type { AIInterpretation } from "../ai/types";
import { aiInterpretationSchema } from "../schemas/ai.schema";

function confidenceLevel(confidence: number) {
  return confidence >= 0.8 ? "HIGH" : confidence >= 0.55 ? "MEDIUM" : "LOW";
}

export function interpretInput(input: string): AIInterpretation {
  const normalizedText = normalizeText(input);
  const result = baselineClassifier.classify(input);
  const interpretation = {
    input,
    normalizedText,
    intent: result.intent,
    confidence: result.confidence,
    confidenceLevel: confidenceLevel(result.confidence),
    entities: extractEntities(normalizedText),
    source: result.source,
  } as const;
  return aiInterpretationSchema.parse(interpretation) as AIInterpretation;
}
