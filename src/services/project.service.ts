import {
  createProject as createProjectRecord,
  deleteProject as deleteProjectRecord,
  findProject as findProjectRecord,
  findProjects as findProjectsRecord,
  updateProject as updateProjectRecord,
} from "@/repositories/project.repository";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/schemas/project.schema";
import { requireUserId } from "@/lib/ownership";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus, Priority } from "@/generated/prisma/client";

export class ProjectServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "PROJECT_NOT_FOUND" | "GOAL_NOT_FOUND" | "AREA_NOT_FOUND" | "INVALID_INPUT" = "PROJECT_NOT_FOUND"
  ) {
    super(message);
    this.name = "ProjectServiceError";
  }
}

export async function createProject(input: CreateProjectInput, userId?: string) {
  const owner = requireUserId(userId);
  const parsed = createProjectSchema.parse(input);

  // Validate goal ownership if goalId provided
  if (parsed.goalId) {
    const goal = await prisma.goal.findFirst({ where: { id: parsed.goalId, userId: owner } });
    if (!goal) {
      throw new ProjectServiceError("Goal tidak ditemukan atau bukan milik Anda.", "GOAL_NOT_FOUND");
    }
  }

  // Validate area ownership if areaId provided
  if (parsed.areaId) {
    const area = await prisma.area.findFirst({ where: { id: parsed.areaId, userId: owner } });
    if (!area) {
      throw new ProjectServiceError("Area tidak ditemukan atau bukan milik Anda.", "AREA_NOT_FOUND");
    }
  }

  return createProjectRecord(owner, {
    title: parsed.title,
    description: parsed.description,
    goalId: parsed.goalId,
    areaId: parsed.areaId,
    status: parsed.status as ProjectStatus,
    priority: parsed.priority as Priority,
    startDate: parsed.startDate ? new Date(parsed.startDate) : null,
    targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null,
  });
}

export async function getProjects(
  userId?: string,
  filter?: {
    status?: ProjectStatus;
    goalId?: string;
    areaId?: string;
  }
) {
  const owner = requireUserId(userId);
  return findProjectsRecord(owner, filter);
}

export async function getProject(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const project = await findProjectRecord(owner, id);
  if (!project) {
    throw new ProjectServiceError("Project tidak ditemukan.", "PROJECT_NOT_FOUND");
  }
  return project;
}

export async function updateProject(id: string, input: UpdateProjectInput, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findProjectRecord(owner, id);
  if (!existing) {
    throw new ProjectServiceError("Project tidak ditemukan.", "PROJECT_NOT_FOUND");
  }

  const parsed = updateProjectSchema.parse(input);

  if (parsed.goalId && parsed.goalId !== existing.goalId) {
    const goal = await prisma.goal.findFirst({ where: { id: parsed.goalId, userId: owner } });
    if (!goal) {
      throw new ProjectServiceError("Goal tidak ditemukan atau bukan milik Anda.", "GOAL_NOT_FOUND");
    }
  }

  if (parsed.areaId && parsed.areaId !== existing.areaId) {
    const area = await prisma.area.findFirst({ where: { id: parsed.areaId, userId: owner } });
    if (!area) {
      throw new ProjectServiceError("Area tidak ditemukan atau bukan milik Anda.", "AREA_NOT_FOUND");
    }
  }

  await updateProjectRecord(owner, id, {
    ...(parsed.title !== undefined && { title: parsed.title }),
    ...(parsed.description !== undefined && { description: parsed.description }),
    ...(parsed.goalId !== undefined && { goalId: parsed.goalId }),
    ...(parsed.areaId !== undefined && { areaId: parsed.areaId }),
    ...(parsed.status !== undefined && { status: parsed.status as ProjectStatus }),
    ...(parsed.priority !== undefined && { priority: parsed.priority as Priority }),
    ...(parsed.startDate !== undefined && { startDate: parsed.startDate ? new Date(parsed.startDate) : null }),
    ...(parsed.targetDate !== undefined && { targetDate: parsed.targetDate ? new Date(parsed.targetDate) : null }),
    ...(parsed.completedAt !== undefined && { completedAt: parsed.completedAt ? new Date(parsed.completedAt) : null }),
  });

  return findProjectRecord(owner, id);
}

export async function archiveProject(id: string, userId?: string) {
  return updateProject(id, { status: "ARCHIVED" }, userId);
}

export async function deleteProject(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findProjectRecord(owner, id);
  if (!existing) {
    throw new ProjectServiceError("Project tidak ditemukan.", "PROJECT_NOT_FOUND");
  }

  await deleteProjectRecord(owner, id);
  return { success: true, id };
}
