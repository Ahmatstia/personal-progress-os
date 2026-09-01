import { beforeEach, describe, expect, it, vi } from "vitest";

type TestReview = { id: string; [key: string]: unknown };

const state = vi.hoisted(() => ({
  review: null as TestReview | null,
  reviews: [] as TestReview[],
}));

vi.mock("@/repositories/review.repository", () => ({
  findGoalForReview: vi.fn(async () => ({ id: "goal-1" })),
  findGoalReviewContext: vi.fn(async () => ({ id: "goal-1", stages: [] })),
  findReviewMetrics: vi.fn(async () => [
    { _sum: { durationMinutes: 150 } },
    { _avg: { understanding: 4.2 } },
    3,
  ]),
  findReviewByGoalAndPeriod: vi.fn(async () => state.review),
  createReview: vi.fn(async (data: object) => { state.review = { ...data, id: "review-1" }; state.reviews.unshift(state.review); return state.review; }),
  findReviewById: vi.fn(async () => state.review),
  findReviewsByGoalId: vi.fn(async () => state.reviews),
  updateReview: vi.fn(async (_id: string, data: object) => { if (!state.review) throw new Error("missing"); state.review = { ...state.review, ...data }; return state.review; }),
}));

import { createReview, getGoalReviews, getGoalReviewPageData, getPeriodReview, getWeekPeriod, updateReview } from "../src/services/review.service";
import { reviewSchema } from "../src/schemas/review.schema";

const periodStart = new Date("2026-08-31T00:00:00.000Z");
const periodEnd = new Date("2026-09-06T23:59:59.999Z");
const input = { periodStart, periodEnd, understanding: 4, wentWell: "Focus", difficulties: "None", improvements: "More practice", nextFocus: "Pandas" };

describe("review.service", () => {
  beforeEach(() => { state.review = null; state.reviews.length = 0; });

  it("creates reviews with server-derived metrics", async () => {
    const review = await createReview("goal-1", input);
    expect(review).toMatchObject({ learningHours: 2.5, tasksCompleted: 3, understanding: 4.2 });
  });

  it("rejects an invalid period and invalid understanding", () => {
    expect(reviewSchema.safeParse({ ...input, periodEnd: new Date("2026-08-30") }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...input, understanding: 6 }).success).toBe(false);
  });

  it("updates reflection while recalculating metrics", async () => {
    await createReview("goal-1", input);
    const review = await updateReview("review-1", { ...input, nextFocus: "Arrays" });
    expect(review).toMatchObject({ nextFocus: "Arrays", learningHours: 2.5, tasksCompleted: 3 });
  });

  it("returns goal reviews and period review", async () => {
    await createReview("goal-1", input);
    expect(await getGoalReviews("goal-1")).toHaveLength(1);
    expect(await getPeriodReview("goal-1", periodStart, periodEnd)).not.toBeNull();
  });

  it("uses Monday through Sunday for the current week", () => {
    const period = getWeekPeriod(new Date("2026-09-01T12:00:00.000Z"));
    expect(period.periodStart.getDay()).toBe(1);
    expect(period.periodEnd.getDay()).toBe(0);
  });

  it("returns the review page metrics and history", async () => {
    await createReview("goal-1", input);
    const data = await getGoalReviewPageData("goal-1");
    expect(data?.metrics).toMatchObject({ learningHours: 2.5, tasksCompleted: 3 });
    expect(data?.reviews).toHaveLength(1);
  });
});
