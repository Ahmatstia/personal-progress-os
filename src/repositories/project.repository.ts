import { prisma } from "@/lib/prisma";
import type { ProjectStatus, Priority } from "@/generated/prisma/client";

export function createProject(
  userId: string,
  data: {
    title: string;
    description?: string | null;
    goalId?: string | null;
    areaId?: string | null;
    status?: ProjectStatus;
    priority?: Priority;
    startDate?: Date | null;
    targetDate?: Date | null;
  }
) {
  return prisma.project.create({
    data: {
      userId,
      title: data.title,
      description: data.description ?? null,
      goalId: data.goalId ?? null,
      areaId: data.areaId ?? null,
      status: data.status ?? "PLANNING",
      priority: data.priority ?? "MEDIUM",
      startDate: data.startDate ?? null,
      targetDate: data.targetDate ?? null,
    },
    include: {
      goal: { select: { id: true, title: true } },
      area: { select: { id: true, name: true, color: true } },
    },
  });
}

export function findProject(userId: string, id: string) {
  return prisma.project.findFirst({
    where: { id, userId },
    include: {
      goal: { select: { id: true, title: true } },
      area: { select: { id: true, name: true, color: true } },
      milestones: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      tasks: {
        orderBy: [{ createdAt: "desc" }],
        include: {
          milestone: { select: { id: true, title: true } },
        },
      },
      _count: {
        select: {
          tasks: true,
          milestones: true,
        },
      },
    },
  });
}

export function findProjects(
  userId: string,
  filter?: {
    status?: ProjectStatus;
    goalId?: string;
    areaId?: string;
  }
) {
  return prisma.project.findMany({
    where: {
      userId,
      ...(filter?.status && { status: filter.status }),
      ...(filter?.goalId && { goalId: filter.goalId }),
      ...(filter?.areaId && { areaId: filter.areaId }),
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      goal: { select: { id: true, title: true } },
      area: { select: { id: true, name: true, color: true } },
      _count: {
        select: {
          tasks: true,
          milestones: true,
        },
      },
    },
  });
}

export function updateProject(
  userId: string,
  id: string,
  data: {
    title?: string;
    description?: string | null;
    goalId?: string | null;
    areaId?: string | null;
    status?: ProjectStatus;
    priority?: Priority;
    startDate?: Date | null;
    targetDate?: Date | null;
    completedAt?: Date | null;
  }
) {
  return prisma.project.updateMany({
    where: { id, userId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.goalId !== undefined && { goalId: data.goalId }),
      ...(data.areaId !== undefined && { areaId: data.areaId }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
    },
  });
}

export function deleteProject(userId: string, id: string) {
  return prisma.project.deleteMany({
    where: { id, userId },
  });
}
