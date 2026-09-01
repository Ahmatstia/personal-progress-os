import { prisma } from "@/lib/prisma";

export function findTaskDetail(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      stage: { include: { goal: true } },
      sessions: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });
}
