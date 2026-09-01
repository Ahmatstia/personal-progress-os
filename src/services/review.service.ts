import {
  createReview as createReviewRecord,
  findGoalForReview,
  findGoalReviewContext,
  findReviewByGoalAndPeriod,
  findReviewById,
  findReviewMetrics,
  findReviewsByGoalId,
  updateReview as updateReviewRecord,
} from "@/repositories/review.repository";
import type { ReviewInput } from "@/schemas/review.schema";

export class ReviewServiceError extends Error {
  constructor(message: string, public readonly code: "GOAL_NOT_FOUND" | "REVIEW_NOT_FOUND") { super(message); }
}

async function derivedMetrics(goalId: string, periodStart: Date, periodEnd: Date) {
  const [sessions, understanding, tasksCompleted] = await findReviewMetrics(goalId, periodStart, periodEnd);
  return {
    learningHours: (sessions._sum.durationMinutes ?? 0) / 60,
    tasksCompleted,
    understanding: understanding._avg.understanding,
  };
}

export async function createReview(goalId: string, input: ReviewInput) {
  if (!(await findGoalForReview(goalId))) throw new ReviewServiceError("Goal tidak ditemukan.", "GOAL_NOT_FOUND");
  const metrics = await derivedMetrics(goalId, input.periodStart, input.periodEnd);
  const existing = await findReviewByGoalAndPeriod(goalId, input.periodStart, input.periodEnd);
  if (existing) return updateReviewRecord(existing.id, { ...input, ...metrics });
  return createReviewRecord({ goalId, ...input, ...metrics });
}

export function getReview(id: string) { return findReviewById(id); }
export function getGoalReviews(goalId: string) { return findReviewsByGoalId(goalId); }
export async function getPeriodReview(goalId: string, periodStart: Date, periodEnd: Date) {
  return findReviewByGoalAndPeriod(goalId, periodStart, periodEnd);
}

export async function getPeriodMetrics(goalId: string, periodStart: Date, periodEnd: Date) {
  return derivedMetrics(goalId, periodStart, periodEnd);
}

export async function getGoalReviewPageData(goalId: string) {
  const [goal, reviews] = await Promise.all([findGoalReviewContext(goalId), findReviewsByGoalId(goalId)]);
  if (!goal) return null;
  const period = getWeekPeriod();
  const [review, metrics] = await Promise.all([
    findReviewByGoalAndPeriod(goalId, period.periodStart, period.periodEnd),
    derivedMetrics(goalId, period.periodStart, period.periodEnd),
  ]);
  return { goal, reviews, period, review, metrics };
}

export async function updateReview(id: string, input: ReviewInput) {
  const review = await findReviewById(id);
  if (!review) throw new ReviewServiceError("Review tidak ditemukan.", "REVIEW_NOT_FOUND");
  const metrics = await derivedMetrics(review.goalId, input.periodStart, input.periodEnd);
  return updateReviewRecord(id, { ...input, ...metrics });
}

export function getWeekPeriod(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - distanceFromMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { periodStart: start, periodEnd: end };
}
