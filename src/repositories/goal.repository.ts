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

export function findGoal(userId: string, id: string, includeRelations: boolean = false) {
  return prisma.goal.findFirst({
    where: { id, userId },
    ...(includeRelations && {
      include: {
        area: { select: { id: true, name: true, color: true } },
        objectives: { orderBy: [{ createdAt: "asc" }] },
        projects: { select: { id: true, title: true, status: true, priority: true } },
        stages: {
          orderBy: [{ order: "asc" }],
          include: { tasks: { select: { id: true, title: true, status: true, priority: true } } },
        },
      },
    }),
  });
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

export function findGoals(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    include: {
      stages: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function findGoalsWithStages(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      area: { select: { id: true, name: true, color: true } },
      stages: {
        orderBy: { order: "asc" },
        include: {
          tasks: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
}

export function findGoalDetail(userId: string, id: string) {
  return prisma.goal.findFirst({
    where: { id, userId },
    include: {
      area: { select: { id: true, name: true, color: true } },
      objectives: {
        orderBy: { createdAt: "asc" },
      },
      stages: {
        orderBy: { order: "asc" },
        include: { tasks: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
}

export function countGoals(userId: string) {
  return prisma.goal.count({ where: { userId } });
}
