import { prisma } from "@/lib/prisma";
import type { ActivityCategory } from "@/generated/prisma/client";

export function createActivity(
  userId: string,
  data: {
    title: string;
    category?: ActivityCategory;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    productivityRating?: number | null;
    energyLevel?: number | null;
    notes?: string | null;
    taskId?: string | null;
    projectId?: string | null;
    areaId?: string | null;
  }
) {
  return prisma.activity.create({
    data: {
      userId,
      title: data.title,
      category: data.category ?? "WORK",
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      productivityRating: data.productivityRating ?? null,
      energyLevel: data.energyLevel ?? null,
      notes: data.notes ?? null,
      taskId: data.taskId ?? null,
      projectId: data.projectId ?? null,
      areaId: data.areaId ?? null,
    },
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, title: true } },
      area: { select: { id: true, name: true, color: true } },
    },
  });
}

export function findActivity(userId: string, id: string) {
  return prisma.activity.findFirst({
    where: { id, userId },
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, title: true } },
      area: { select: { id: true, name: true, color: true } },
    },
  });
}

export function findActivities(
  userId: string,
  filter?: {
    category?: ActivityCategory;
    areaId?: string;
    projectId?: string;
    taskId?: string;
    startFrom?: Date;
    startTo?: Date;
    limit?: number;
    offset?: number;
  }
) {
  return prisma.activity.findMany({
    where: {
      userId,
      ...(filter?.category && { category: filter.category }),
      ...(filter?.areaId && { areaId: filter.areaId }),
      ...(filter?.projectId && { projectId: filter.projectId }),
      ...(filter?.taskId && { taskId: filter.taskId }),
      ...(filter?.startFrom && { startTime: { gte: filter.startFrom } }),
      ...(filter?.startTo && { startTime: { lte: filter.startTo } }),
    },
    orderBy: [{ startTime: "desc" }],
    take: filter?.limit ?? 50,
    skip: filter?.offset ?? 0,
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, title: true } },
      area: { select: { id: true, name: true, color: true } },
    },
  });
}

export function updateActivity(
  userId: string,
  id: string,
  data: {
    title?: string;
    category?: ActivityCategory;
    startTime?: Date;
    endTime?: Date;
    durationMinutes?: number;
    productivityRating?: number | null;
    energyLevel?: number | null;
    notes?: string | null;
    taskId?: string | null;
    projectId?: string | null;
    areaId?: string | null;
  }
) {
  return prisma.activity.updateMany({
    where: { id, userId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.startTime !== undefined && { startTime: data.startTime }),
      ...(data.endTime !== undefined && { endTime: data.endTime }),
      ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
      ...(data.productivityRating !== undefined && { productivityRating: data.productivityRating }),
      ...(data.energyLevel !== undefined && { energyLevel: data.energyLevel }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.taskId !== undefined && { taskId: data.taskId }),
      ...(data.projectId !== undefined && { projectId: data.projectId }),
      ...(data.areaId !== undefined && { areaId: data.areaId }),
    },
  });
}

export function deleteActivity(userId: string, id: string) {
  return prisma.activity.deleteMany({
    where: { id, userId },
  });
}
