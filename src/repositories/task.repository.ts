import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function findStageForTask(stageId: string, userId?: string) {
  return prisma.stage.findFirst({ where: { id: stageId, ...(userId ? { userId } : {}) } });
}

export function createTask(data: Prisma.TaskUncheckedCreateInput) {
  return prisma.task.create({ data });
}

export function findTask(id: string, userId?: string) {
  return prisma.task.findFirst({ where: { id, ...(userId ? { userId } : {}) } });
}

export function findTasksForAI(userId?: string) {
  return prisma.task.findMany({ where: userId ? { userId } : undefined, include: { stage: { include: { goal: true } } }, orderBy: { createdAt: "asc" } });
}

export function updateTask(id: string, data: Prisma.TaskUpdateInput, userId?: string) {
  if (!userId) return prisma.task.update({ where: { id }, data });
  return prisma.task.update({ where: { id }, data });
}

export function deleteTask(id: string, userId?: string) {
  return userId ? prisma.task.deleteMany({ where: { id, userId } }) : prisma.task.delete({ where: { id } });
}

export function findTaskDetail(id: string, userId?: string) {
  return prisma.task.findUnique({
    where: { id, ...(userId ? { userId } : {}) },
    include: {
      stage: { include: { goal: true } },
      sessions: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });
}
