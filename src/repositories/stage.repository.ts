import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export function findStage(id: string) {
  return prisma.stage.findUnique({ where: { id } });
}

export function updateStage(id: string, data: Prisma.StageUpdateInput) {
  return prisma.stage.update({ where: { id }, data });
}

export function deleteStage(id: string) {
  return prisma.stage.delete({ where: { id } });
}

export function findGoalStages(goalId: string) {
  return prisma.stage.findMany({ where: { goalId }, orderBy: { order: "asc" } });
}
