import { describe, expect, it } from "vitest";
import {
  computeSimilarity,
  levenshteinDistance,
} from "../src/ai/resolver/entity-resolver";

describe("AI V2 Entity Resolver Similarity & Distance", () => {
  it("calculates accurate Levenshtein distances", () => {
    expect(levenshteinDistance("python", "python")).toBe(0);
    expect(levenshteinDistance("python", "pythn")).toBe(1);
    expect(levenshteinDistance("react", "vue")).toBe(5);
  });

  it("scores exact matches with 1.0", () => {
    expect(computeSimilarity("Belajar Python", "belajar python")).toBe(1.0);
    expect(computeSimilarity("function python", "Function Python")).toBe(1.0);
  });

  it("scores substring matches with high confidence (>0.85)", () => {
    const score = computeSimilarity("function python", "Belajar Function Python Dasar");
    expect(score).toBeGreaterThanOrEqual(0.85);
  });

  it("handles minor typos and informal Indonesian spelling gracefully", () => {
    const typoScore = computeSimilarity("beljr pyton", "Belajar Python");
    expect(typoScore).toBeGreaterThan(0.5);
  });

  it("rejects completely unrelated entities (<0.3)", () => {
    const score = computeSimilarity("Membuat UI Header", "Database Migration SQLite");
    expect(score).toBeLessThan(0.3);
  });
});
