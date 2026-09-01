import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function createReview(data: Prisma.ReviewUncheckedCreateInput) {
  return prisma.review.create({ data });
}

export function findReviewById(id: string) {
  return prisma.review.findUnique({ where: { id }, include: { goal: true } });
}

export function findReviewsByGoalId(goalId: string) {
  return prisma.review.findMany({ where: { goalId }, orderBy: { periodStart: "desc" } });
}

export function findReviewByGoalAndPeriod(goalId: string, periodStart: Date, periodEnd: Date) {
  return prisma.review.findFirst({ where: { goalId, periodStart, periodEnd } });
}

export function updateReview(id: string, data: Prisma.ReviewUpdateInput) {
  return prisma.review.update({ where: { id }, data });
}

export function findGoalForReview(goalId: string) {
  return prisma.goal.findUnique({ where: { id: goalId } });
}

export function findGoalReviewContext(goalId: string) {
  return prisma.goal.findUnique({
    where: { id: goalId },
    include: { stages: { include: { tasks: true } } },
  });
}

export function findReviewMetrics(goalId: string, periodStart: Date, periodEnd: Date) {
  return Promise.all([
    prisma.session.aggregate({
      where: { task: { stage: { goalId } }, endedAt: { gte: periodStart, lte: periodEnd } },
      _sum: { durationMinutes: true },
    }),
    prisma.session.aggregate({
      where: { task: { stage: { goalId } }, endedAt: { gte: periodStart, lte: periodEnd }, understanding: { not: null } },
      _avg: { understanding: true },
    }),
    prisma.task.count({ where: { stage: { goalId }, status: "COMPLETED", completedAt: { gte: periodStart, lte: periodEnd } } }),
  ]);
}
