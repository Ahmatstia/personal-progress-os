import { describe, expect, it } from "vitest";
import { baselineClassifier } from "../src/ai/classifier";
import { intents } from "../src/ai/intents";
import { activeCorpus } from "../src/ai/corpus";
import { extractEntities } from "../src/ai/entities";
import { normalizeText } from "../src/ai/normalization";
import { routeIntent } from "../src/ai/router";
import { interpretInput } from "../src/services/ai.service";

describe("AI foundation", () => {
  it("normalizes Indonesian shorthand and punctuation deterministically", () => {
    expect(normalizeText("  Apa yg harus saya kerjain hari ini??? ")).toBe("apa yang harus saya mengerjakan hari ini");
  });

  it("classifies obvious intents with confidence", () => {
    expect(baselineClassifier.classify("apa fokus saya hari ini")).toMatchObject({ intent: "TODAY", confidence: 0.77, source: "baseline" });
    expect(baselineClassifier.classify("tampilkan analytics saya").intent).toBe("ANALYTICS");
    expect(baselineClassifier.classify("bagaimana progres goal saya").intent).toBe("GOAL_STATUS");
  });

  it("rejects empty or unrelated input as UNKNOWN", () => {
    expect(baselineClassifier.classify("").intent).toBe("UNKNOWN");
    expect(baselineClassifier.classify("ceritakan resep makanan")).toMatchObject({ intent: "UNKNOWN", confidence: 0 });
  });

  it("extracts simple date, duration, priority, and status entities", () => {
    expect(extractEntities("progres Python minggu ini selama 2 jam prioritas tinggi selesai")).toEqual(expect.arrayContaining([
      { value: "python", type: "GOAL" },
      { value: "this_week", type: "DATE" },
      { value: "2 jam", type: "DURATION" },
      { value: "tinggi", type: "PRIORITY" },
      { value: "selesai", type: "STATUS" },
    ]));
  });

  it("returns validated interpretation and route descriptor", () => {
    const result = interpretInput("apa yang harus saya kerjakan hari ini?");
    expect(result).toMatchObject({ intent: "TODAY", confidenceLevel: "MEDIUM", source: "baseline" });
    expect(routeIntent(result.intent)).toEqual({ intent: "TODAY", handler: "today" });
  });

  it("keeps the corpus versioned, complete, and duplicate-free", () => {
    expect(activeCorpus.version).toBe("1.0.0");
    expect(activeCorpus.language).toBe("id");
    expect(activeCorpus.examples).toHaveLength(480);
    expect(new Set(activeCorpus.examples.map((example) => example.id)).size).toBe(480);
    for (const intent of intents) {
      expect(activeCorpus.examples.filter((example) => example.intent === intent).length).toBeGreaterThanOrEqual(20);
    }
    expect(activeCorpus.examples.every((example) => example.text.trim() && intents.includes(example.intent))).toBe(true);
  });
});
