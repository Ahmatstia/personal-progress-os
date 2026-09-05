import { prisma } from "@/lib/prisma";
import type { CaptureCategory, CaptureStatus, Prisma } from "@/generated/prisma/client";

export function createCapture(
  userId: string,
  data: {
    content: string;
    category?: CaptureCategory;
  }
) {
  return prisma.capture.create({
    data: {
      userId,
      content: data.content,
      category: data.category ?? "TASK_CANDIDATE",
    },
  });
}

export function findCapture(userId: string, id: string) {
  return prisma.capture.findFirst({
    where: { id, userId },
  });
}

export function findCaptures(
  userId: string,
  filter?: {
    status?: CaptureStatus;
    category?: CaptureCategory;
    limit?: number;
  }
) {
  return prisma.capture.findMany({
    where: {
      userId,
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.category ? { category: filter.category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filter?.limit ?? 50,
  });
}

export function updateCapture(
  userId: string,
  id: string,
  data: Prisma.CaptureUpdateInput
) {
  return prisma.capture.updateMany({
    where: { id, userId },
    data,
  }).then(() => prisma.capture.findFirstOrThrow({ where: { id, userId } }));
}

export function deleteCapture(userId: string, id: string) {
  return prisma.capture.deleteMany({
    where: { id, userId },
  });
}
