import { prisma } from "@/lib/prisma";
import type { GoalType, GoalStatus, Priority } from "@/generated/prisma/client";

export function createGoal(
  userId: string,
  data: {
    title?: string;
    name?: string;
    type?: string | GoalType;
    description?: string | null;
    areaId?: string | null;
    priority?: Priority;
    targetDate?: Date | null;
  }
) {
  const title = data.title ?? data.name ?? "";
  const type = (data.type as GoalType) ?? "LEARNING";
  return prisma.goal.create({
    data: {
      userId,
      title,
      type,
      description: data.description ?? null,
      areaId: data.areaId ?? null,
      priority: data.priority ?? "MEDIUM",
      targetDate: data.targetDate ?? null,
    },
  });
}

export function findGoal(userId: string, id: string) {
  return prisma.goal.findFirst({ where: { id, userId } });
}

export function updateGoal(
  userId: string,
  id: string,
  data: {
    title?: string;
    name?: string;
    type?: string | GoalType;
    description?: string | null;
    status?: string | GoalStatus;
    priority?: Priority;
    targetDate?: Date | null;
    areaId?: string | null;
    completedAt?: Date | null;
  }
) {
  const title = data.title ?? data.name;
  return prisma.goal.updateMany({
    where: { id, userId },
    data: {
      ...(title !== undefined && { title }),
      ...(data.type !== undefined && { type: data.type as GoalType }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status as GoalStatus }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
      ...(data.areaId !== undefined && { areaId: data.areaId }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
    },
  });
}

export function deleteGoal(userId: string, id: string) {
  return prisma.goal.deleteMany({ where: { id, userId } });
}
