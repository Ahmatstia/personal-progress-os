import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function findStageForTask(stageId: string) {
  return prisma.stage.findUnique({ where: { id: stageId } });
}

export function createTask(data: Prisma.TaskUncheckedCreateInput) {
  return prisma.task.create({ data });
}

export function findTask(id: string) {
  return prisma.task.findUnique({ where: { id } });
}

export function updateTask(id: string, data: Prisma.TaskUpdateInput) {
  return prisma.task.update({ where: { id }, data });
}

export function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}

export function findTaskDetail(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      stage: { include: { goal: true } },
      sessions: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });
}
