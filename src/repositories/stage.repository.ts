import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function findStage(userId: string, id: string) {
  return prisma.stage.findFirst({ where: { id, userId } });
}

export function updateStage(userId: string, id: string, data: Prisma.StageUpdateInput) {
  return prisma.stage.updateMany({ where: { id, userId }, data });
}

export function deleteStage(userId: string, id: string) {
  return prisma.stage.deleteMany({ where: { id, userId } });
}

export function findGoalStages(userId: string, goalId: string) {
  return prisma.stage.findMany({ where: { goalId, userId }, orderBy: { order: "asc" } });
}
