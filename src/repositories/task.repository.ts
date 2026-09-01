import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function findStageForTask(userId: string, stageId: string) {
  return prisma.stage.findFirst({ where: { id: stageId, userId } });
}

export function createTask(userId: string, data: Prisma.TaskUncheckedCreateInput) {
  return prisma.task.create({ data: { ...data, userId } });
}

export function findTask(userId: string, id: string) {
  return prisma.task.findFirst({ where: { id, userId } });
}

export function findTasksForAI(userId: string) {
  return prisma.task.findMany({ where: { userId }, include: { stage: { include: { goal: true } } }, orderBy: { createdAt: "asc" } });
}

export function updateTask(userId: string, id: string, data: Prisma.TaskUpdateInput) {
  return prisma.task.updateMany({ where: { id, userId }, data }).then(() => prisma.task.findFirstOrThrow({ where: { id, userId } }));
}

export function deleteTask(userId: string, id: string) {
  return prisma.task.deleteMany({ where: { id, userId } });
}

export function findTaskDetail(userId: string, id: string) {
  return prisma.task.findFirst({
    where: { id, userId },
    include: {
      stage: { include: { goal: true } },
      sessions: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });
}
