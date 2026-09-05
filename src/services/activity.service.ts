import {
  createActivity as createActivityRecord,
  deleteActivity as deleteActivityRecord,
  findActivity as findActivityRecord,
  findActivities as findActivitiesRecord,
  updateActivity as updateActivityRecord,
} from "@/repositories/activity.repository";
import {
  createActivitySchema,
  updateActivitySchema,
  type CreateActivityInput,
  type UpdateActivityInput,
} from "@/schemas/activity.schema";
import { requireUserId } from "@/lib/ownership";
import { prisma } from "@/lib/prisma";
import type { ActivityCategory } from "@/generated/prisma/client";

export class ActivityServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "ACTIVITY_NOT_FOUND" | "INVALID_TIME_RANGE" | "TASK_NOT_FOUND" | "PROJECT_NOT_FOUND" | "AREA_NOT_FOUND" | "INVALID_INPUT" = "ACTIVITY_NOT_FOUND"
  ) {
    super(message);
    this.name = "ActivityServiceError";
  }
}

export async function createActivity(input: CreateActivityInput, userId?: string) {
  const owner = requireUserId(userId);
  const parsed = createActivitySchema.parse(input);

  const start = new Date(parsed.startTime);
  const end = new Date(parsed.endTime);
  if (end.getTime() < start.getTime()) {
    throw new ActivityServiceError("Waktu selesai tidak boleh mendahului waktu mulai.", "INVALID_TIME_RANGE");
  }

  const durationMinutes = parsed.durationMinutes ?? Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));

  // Validate task ownership if provided
  if (parsed.taskId) {
    const task = await prisma.task.findFirst({ where: { id: parsed.taskId, userId: owner } });
    if (!task) {
      throw new ActivityServiceError("Task tidak ditemukan atau bukan milik Anda.", "TASK_NOT_FOUND");
    }
  }

  // Validate project ownership if provided
  if (parsed.projectId) {
    const project = await prisma.project.findFirst({ where: { id: parsed.projectId, userId: owner } });
    if (!project) {
      throw new ActivityServiceError("Project tidak ditemukan atau bukan milik Anda.", "PROJECT_NOT_FOUND");
    }
  }

  // Validate area ownership if provided
  if (parsed.areaId) {
    const area = await prisma.area.findFirst({ where: { id: parsed.areaId, userId: owner } });
    if (!area) {
      throw new ActivityServiceError("Area tidak ditemukan atau bukan milik Anda.", "AREA_NOT_FOUND");
    }
  }

  return createActivityRecord(owner, {
    title: parsed.title,
    category: parsed.category as ActivityCategory,
    startTime: start,
    endTime: end,
    durationMinutes,
    productivityRating: parsed.productivityRating,
    energyLevel: parsed.energyLevel,
    notes: parsed.notes,
    taskId: parsed.taskId,
    projectId: parsed.projectId,
    areaId: parsed.areaId,
  });
}

export async function getActivities(
  userId?: string,
  filter?: {
    category?: ActivityCategory;
    areaId?: string;
    projectId?: string;
    taskId?: string;
    startFrom?: string | Date;
    startTo?: string | Date;
    limit?: number;
    offset?: number;
  }
) {
  const owner = requireUserId(userId);
  return findActivitiesRecord(owner, {
    category: filter?.category,
    areaId: filter?.areaId,
    projectId: filter?.projectId,
    taskId: filter?.taskId,
    startFrom: filter?.startFrom ? new Date(filter.startFrom) : undefined,
    startTo: filter?.startTo ? new Date(filter.startTo) : undefined,
    limit: filter?.limit,
    offset: filter?.offset,
  });
}

export async function getActivity(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const activity = await findActivityRecord(owner, id);
  if (!activity) {
    throw new ActivityServiceError("Aktivitas tidak ditemukan.", "ACTIVITY_NOT_FOUND");
  }
  return activity;
}

export async function updateActivity(id: string, input: UpdateActivityInput, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findActivityRecord(owner, id);
  if (!existing) {
    throw new ActivityServiceError("Aktivitas tidak ditemukan.", "ACTIVITY_NOT_FOUND");
  }

  const parsed = updateActivitySchema.parse(input);

  const start = parsed.startTime ? new Date(parsed.startTime) : existing.startTime;
  const end = parsed.endTime ? new Date(parsed.endTime) : existing.endTime;
  if (end.getTime() < start.getTime()) {
    throw new ActivityServiceError("Waktu selesai tidak boleh mendahului waktu mulai.", "INVALID_TIME_RANGE");
  }

  let durationMinutes = parsed.durationMinutes;
  if (durationMinutes === undefined && (parsed.startTime || parsed.endTime)) {
    durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
  }

  if (parsed.taskId && parsed.taskId !== existing.taskId) {
    const task = await prisma.task.findFirst({ where: { id: parsed.taskId, userId: owner } });
    if (!task) {
      throw new ActivityServiceError("Task tidak ditemukan atau bukan milik Anda.", "TASK_NOT_FOUND");
    }
  }

  if (parsed.projectId && parsed.projectId !== existing.projectId) {
    const project = await prisma.project.findFirst({ where: { id: parsed.projectId, userId: owner } });
    if (!project) {
      throw new ActivityServiceError("Project tidak ditemukan atau bukan milik Anda.", "PROJECT_NOT_FOUND");
    }
  }

  if (parsed.areaId && parsed.areaId !== existing.areaId) {
    const area = await prisma.area.findFirst({ where: { id: parsed.areaId, userId: owner } });
    if (!area) {
      throw new ActivityServiceError("Area tidak ditemukan atau bukan milik Anda.", "AREA_NOT_FOUND");
    }
  }

  await updateActivityRecord(owner, id, {
    ...(parsed.title !== undefined && { title: parsed.title }),
    ...(parsed.category !== undefined && { category: parsed.category as ActivityCategory }),
    ...(parsed.startTime !== undefined && { startTime: start }),
    ...(parsed.endTime !== undefined && { endTime: end }),
    ...(durationMinutes !== undefined && { durationMinutes }),
    ...(parsed.productivityRating !== undefined && { productivityRating: parsed.productivityRating }),
    ...(parsed.energyLevel !== undefined && { energyLevel: parsed.energyLevel }),
    ...(parsed.notes !== undefined && { notes: parsed.notes }),
    ...(parsed.taskId !== undefined && { taskId: parsed.taskId }),
    ...(parsed.projectId !== undefined && { projectId: parsed.projectId }),
    ...(parsed.areaId !== undefined && { areaId: parsed.areaId }),
  });

  return findActivityRecord(owner, id);
}

export async function deleteActivity(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findActivityRecord(owner, id);
  if (!existing) {
    throw new ActivityServiceError("Aktivitas tidak ditemukan.", "ACTIVITY_NOT_FOUND");
  }

  await deleteActivityRecord(owner, id);
  return { success: true, id };
}
