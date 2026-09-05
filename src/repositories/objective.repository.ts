import { prisma } from "@/lib/prisma";
import type { ObjectiveStatus } from "@/generated/prisma/client";

export function createObjective(
  userId: string,
  data: {
    goalId: string;
    title: string;
    description?: string | null;
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    status?: ObjectiveStatus;
    dueDate?: Date | null;
  }
) {
  return prisma.objective.create({
    data: {
      userId,
      goalId: data.goalId,
      title: data.title,
      description: data.description ?? null,
      targetValue: data.targetValue ?? 100.0,
      currentValue: data.currentValue ?? 0.0,
      unit: data.unit ?? "%",
      status: data.status ?? "ACTIVE",
      dueDate: data.dueDate ?? null,
    },
    include: {
      goal: { select: { id: true, title: true } },
    },
  });
}

export function findObjective(userId: string, id: string) {
  return prisma.objective.findFirst({
    where: { id, userId },
    include: {
      goal: { select: { id: true, title: true } },
    },
  });
}

export function findObjectivesByGoal(userId: string, goalId: string) {
  return prisma.objective.findMany({
    where: { userId, goalId },
    orderBy: [{ createdAt: "asc" }],
  });
}

export function updateObjective(
  userId: string,
  id: string,
  data: {
    goalId?: string;
    title?: string;
    description?: string | null;
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    status?: ObjectiveStatus;
    dueDate?: Date | null;
    completedAt?: Date | null;
  }
) {
  return prisma.objective.updateMany({
    where: { id, userId },
    data: {
      ...(data.goalId !== undefined && { goalId: data.goalId }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
      ...(data.currentValue !== undefined && { currentValue: data.currentValue }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
    },
  });
}

export function deleteObjective(userId: string, id: string) {
  return prisma.objective.deleteMany({
    where: { id, userId },
  });
}
