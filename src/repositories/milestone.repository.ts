import { prisma } from "@/lib/prisma";
import type { MilestoneStatus } from "@/generated/prisma/client";

export function createMilestone(
  userId: string,
  data: {
    projectId: string;
    title: string;
    description?: string | null;
    order?: number;
    status?: MilestoneStatus;
    dueDate?: Date | null;
  }
) {
  return prisma.milestone.create({
    data: {
      userId,
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? null,
      order: data.order ?? 0,
      status: data.status ?? "PENDING",
      dueDate: data.dueDate ?? null,
    },
    include: {
      project: { select: { id: true, title: true } },
    },
  });
}

export function findMilestone(userId: string, id: string) {
  return prisma.milestone.findFirst({
    where: { id, userId },
    include: {
      project: { select: { id: true, title: true, goalId: true } },
      tasks: {
        orderBy: [{ createdAt: "asc" }],
      },
      _count: {
        select: { tasks: true },
      },
    },
  });
}

export function findMilestonesByProject(userId: string, projectId: string) {
  return prisma.milestone.findMany({
    where: { userId, projectId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });
}

export function updateMilestone(
  userId: string,
  id: string,
  data: {
    projectId?: string;
    title?: string;
    description?: string | null;
    order?: number;
    status?: MilestoneStatus;
    dueDate?: Date | null;
    completedAt?: Date | null;
  }
) {
  return prisma.milestone.updateMany({
    where: { id, userId },
    data: {
      ...(data.projectId !== undefined && { projectId: data.projectId }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
    },
  });
}

export function deleteMilestone(userId: string, id: string) {
  return prisma.milestone.deleteMany({
    where: { id, userId },
  });
}
