import { describe, expect, it } from "vitest";
import { buildInsights } from "../src/services/insight.service";

describe("insight.service", () => {
  it("returns no unsupported insight without a comparison period", () => {
    expect(buildInsights({ learningHours: 4, tasksCompleted: 2, understanding: 4 }, null)).toEqual([]);
  });

  it("builds deterministic comparisons", () => {
    expect(buildInsights({ learningHours: 6, tasksCompleted: 4, understanding: 4.5 }, { learningHours: 4, tasksCompleted: 2, understanding: 4 })).toEqual([
      "Belajar 2j lebih banyak dibanding minggu lalu.",
      "Menyelesaikan 2 task lebih banyak dari minggu lalu.",
      "Pemahaman rata-rata Anda meningkat.",
    ]);
  });
});
