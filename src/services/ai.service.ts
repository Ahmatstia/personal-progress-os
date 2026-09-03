import { baselineClassifier } from "../ai/classifier";
import { enhancedClassifier } from "../ai/understanding/enhanced-classifier";
import { extractEntities } from "../ai/entities";
import { extractEntitiesV2 } from "../ai/understanding/entity-extractor";
import { normalizeText } from "../ai/normalization";
import type { AIInterpretation } from "../ai/types";
import { aiInterpretationSchema } from "../schemas/ai.schema";

function confidenceLevel(confidence: number) {
  return confidence >= 0.8 ? "HIGH" : confidence >= 0.55 ? "MEDIUM" : "LOW";
}

export function interpretInput(input: string): AIInterpretation {
  const normalizedText = normalizeText(input);

  // Check multi-step connectors first
  if (
    normalizedText.includes(" lalu ") ||
    normalizedText.includes(" kemudian ") ||
    normalizedText.includes(" setelah itu ") ||
    normalizedText.includes(" dan setelahnya ")
  ) {
    const v2Entities = extractEntitiesV2(input);
    const interpretation = {
      input,
      normalizedText,
      intent: "MULTI_STEP" as const,
      confidence: 0.95,
      confidenceLevel: "HIGH" as const,
      entities: v2Entities,
      source: "baseline" as const,
    };
    return aiInterpretationSchema.parse(interpretation) as AIInterpretation;
  }

  // 1. Run baseline classifier first to maintain 100% V1 test compatibility
  const baselineResult = baselineClassifier.classify(input);

  let finalIntent = baselineResult.intent;
  let finalConfidence = baselineResult.confidence;
  let source: "baseline" | "rule" | "future-llm" = baselineResult.source;

  // 2. If baseline returned UNKNOWN or low confidence, evaluate enhanced classifier
  if (finalIntent === "UNKNOWN" || finalConfidence < 0.55) {
    const enhancedResult = enhancedClassifier.classify(input);
    if (enhancedResult.intent !== "UNKNOWN" && enhancedResult.confidence >= 0.55) {
      finalIntent = enhancedResult.intent;
      finalConfidence = enhancedResult.confidence;
      source = "baseline";
    }
  }

  // Extract combined entities
  const baseEntities = extractEntities(normalizedText);
  const v2Entities = extractEntitiesV2(input);
  const entitiesMap = new Map<string, (typeof v2Entities)[number]>();
  for (const e of [...baseEntities, ...v2Entities]) {
    entitiesMap.set(`${e.type}:${e.value.toLowerCase()}`, e);
  }

  const interpretation = {
    input,
    normalizedText,
    intent: finalIntent,
    confidence: finalConfidence,
    confidenceLevel: confidenceLevel(finalConfidence),
    entities: Array.from(entitiesMap.values()),
    source,
  } as const;

  return aiInterpretationSchema.parse(interpretation) as AIInterpretation;
}
