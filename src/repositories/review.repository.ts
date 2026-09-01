import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function createReview(userId: string, data: Prisma.ReviewUncheckedCreateInput) {
  return prisma.review.create({ data: { ...data, userId } });
}

export function findReviewById(userId: string, id: string) {
  return prisma.review.findFirst({ where: { id, userId }, include: { goal: true } });
}

export function findReviewsByGoalId(userId: string, goalId: string) {
  return prisma.review.findMany({ where: { goalId, userId }, orderBy: { periodStart: "desc" } });
}

export function findReviewByGoalAndPeriod(userId: string, goalId: string, periodStart: Date, periodEnd: Date) {
  return prisma.review.findFirst({ where: { goalId, userId, periodStart, periodEnd } });
}

export function updateReview(userId: string, id: string, data: Prisma.ReviewUpdateInput) {
  return prisma.review.updateMany({ where: { id, userId }, data }).then(() => prisma.review.findFirstOrThrow({ where: { id, userId } }));
}

export function findGoalForReview(userId: string, goalId: string) {
  return prisma.goal.findFirst({ where: { id: goalId, userId } });
}

export function findGoalReviewContext(userId: string, goalId: string) {
  return prisma.goal.findUnique({
    where: { id: goalId, userId },
    include: { stages: { include: { tasks: true } } },
  });
}

export function findReviewMetrics(userId: string, goalId: string, periodStart: Date, periodEnd: Date) {
  return Promise.all([
    prisma.session.aggregate({
      where: { userId, task: { stage: { goalId } }, endedAt: { gte: periodStart, lte: periodEnd } },
      _sum: { durationMinutes: true },
    }),
    prisma.session.aggregate({
      where: { userId, task: { stage: { goalId } }, endedAt: { gte: periodStart, lte: periodEnd }, understanding: { not: null } },
      _avg: { understanding: true },
    }),
    prisma.task.count({ where: { userId, stage: { goalId }, status: "COMPLETED", completedAt: { gte: periodStart, lte: periodEnd } } }),
  ]);
}
