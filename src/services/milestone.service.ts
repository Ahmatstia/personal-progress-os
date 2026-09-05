import {
  createMilestone as createMilestoneRecord,
  deleteMilestone as deleteMilestoneRecord,
  findMilestone as findMilestoneRecord,
  findMilestonesByProject as findMilestonesByProjectRecord,
  updateMilestone as updateMilestoneRecord,
} from "@/repositories/milestone.repository";
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  type CreateMilestoneInput,
  type UpdateMilestoneInput,
} from "@/schemas/milestone.schema";
import { requireUserId } from "@/lib/ownership";
import { prisma } from "@/lib/prisma";
import type { MilestoneStatus } from "@/generated/prisma/client";

export class MilestoneServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "MILESTONE_NOT_FOUND" | "PROJECT_NOT_FOUND" | "INVALID_INPUT" = "MILESTONE_NOT_FOUND"
  ) {
    super(message);
    this.name = "MilestoneServiceError";
  }
}

export async function createMilestone(input: CreateMilestoneInput, userId?: string) {
  const owner = requireUserId(userId);
  const parsed = createMilestoneSchema.parse(input);

  // Validate project ownership
  const project = await prisma.project.findFirst({
    where: { id: parsed.projectId, userId: owner },
  });
  if (!project) {
    throw new MilestoneServiceError("Project tidak ditemukan atau bukan milik Anda.", "PROJECT_NOT_FOUND");
  }

  return createMilestoneRecord(owner, {
    projectId: parsed.projectId,
    title: parsed.title,
    description: parsed.description,
    order: parsed.order,
    status: parsed.status as MilestoneStatus,
    dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
  });
}

export async function getMilestonesByProject(projectId: string, userId?: string) {
  const owner = requireUserId(userId);

  // Ensure project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: owner },
  });
  if (!project) {
    throw new MilestoneServiceError("Project tidak ditemukan atau bukan milik Anda.", "PROJECT_NOT_FOUND");
  }

  return findMilestonesByProjectRecord(owner, projectId);
}

export async function getMilestone(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const milestone = await findMilestoneRecord(owner, id);
  if (!milestone) {
    throw new MilestoneServiceError("Milestone tidak ditemukan.", "MILESTONE_NOT_FOUND");
  }
  return milestone;
}

export async function updateMilestone(id: string, input: UpdateMilestoneInput, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findMilestoneRecord(owner, id);
  if (!existing) {
    throw new MilestoneServiceError("Milestone tidak ditemukan.", "MILESTONE_NOT_FOUND");
  }

  const parsed = updateMilestoneSchema.parse(input);

  if (parsed.projectId && parsed.projectId !== existing.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.projectId, userId: owner },
    });
    if (!project) {
      throw new MilestoneServiceError("Target project tidak ditemukan atau bukan milik Anda.", "PROJECT_NOT_FOUND");
    }
  }

  await updateMilestoneRecord(owner, id, {
    ...(parsed.projectId !== undefined && { projectId: parsed.projectId }),
    ...(parsed.title !== undefined && { title: parsed.title }),
    ...(parsed.description !== undefined && { description: parsed.description }),
    ...(parsed.order !== undefined && { order: parsed.order }),
    ...(parsed.status !== undefined && { status: parsed.status as MilestoneStatus }),
    ...(parsed.dueDate !== undefined && { dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null }),
    ...(parsed.completedAt !== undefined && { completedAt: parsed.completedAt ? new Date(parsed.completedAt) : null }),
  });

  return findMilestoneRecord(owner, id);
}

export async function deleteMilestone(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findMilestoneRecord(owner, id);
  if (!existing) {
    throw new MilestoneServiceError("Milestone tidak ditemukan.", "MILESTONE_NOT_FOUND");
  }

  await deleteMilestoneRecord(owner, id);
  return { success: true, id };
}
