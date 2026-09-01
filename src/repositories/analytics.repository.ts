import { prisma } from "../lib/prisma";

const include = {
  stages: {
    include: {
      tasks: { include: { sessions: true } },
    },
  },
} as const;

export function findAnalyticsGoals(goalId?: string, userId?: string) {
  return prisma.goal.findMany({ where: { ...(goalId ? { id: goalId } : { status: { not: "COMPLETED" } }), ...(userId ? { userId } : {}) }, include });
}
