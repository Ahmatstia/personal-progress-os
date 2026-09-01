import { describe, expect, it } from "vitest";
import { buildInsights } from "../src/services/insight.service";

describe("insight.service", () => {
  it("returns no unsupported insight without a comparison period", () => {
    expect(buildInsights({ learningHours: 4, tasksCompleted: 2, understanding: 4 }, null)).toEqual([]);
  });

  it("builds deterministic comparisons", () => {
    expect(buildInsights({ learningHours: 6, tasksCompleted: 4, understanding: 4.5 }, { learningHours: 4, tasksCompleted: 2, understanding: 4 })).toEqual([
      "You studied 2h more than last week.",
      "You completed 2 more tasks.",
      "Your average understanding improved.",
    ]);
  });
});
