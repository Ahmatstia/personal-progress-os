import { prisma } from "@/lib/prisma";

const sessionInclude = {
  task: {
    include: {
      stage: {
        include: { goal: true },
      },
    },
  },
} as const;

export function createSession(taskId: string, userId: string) {
  return prisma.session.create({
    data: { taskId, startedAt: new Date(), ...(userId ? { userId } : {}) },
    include: sessionInclude,
  });
}

export function findActiveSessionByTaskId(taskId: string, userId: string) {
  return prisma.session.findFirst({
    where: { taskId, endedAt: null, ...(userId ? { userId } : {}) },
    orderBy: { startedAt: "desc" },
    include: sessionInclude,
  });
}

export function findAnyActiveSession(userId: string) {
  return prisma.session.findFirst({ where: { endedAt: null, ...(userId ? { userId } : {}) }, orderBy: { startedAt: "desc" }, include: sessionInclude });
}

export function findSessionById(id: string, userId: string) {
  return prisma.session.findUnique({
    where: { id, ...(userId ? { userId } : {}) },
    include: sessionInclude,
  });
}

export function endSession(
  userId: string,
  id: string,
  data: {
    endedAt: Date;
    durationMinutes: number;
    activity?: string;
    understanding?: number;
    obstacle?: string;
    nextAction?: string;
  },
) {
  return prisma.session.update({
    where: { id, userId },
    data,
    include: sessionInclude,
  });
}

export function findSessionsByTaskId(taskId: string, userId: string) {
  return prisma.session.findMany({
    where: { taskId, ...(userId ? { userId } : {}) },
    orderBy: { startedAt: "desc" },
    include: sessionInclude,
  });
}

export function recomputeTaskActualHours(taskId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.session.aggregate({
      where: { taskId, endedAt: { not: null }, ...(userId ? { userId } : {}) },
      _sum: { durationMinutes: true },
    });
    const actualHours = (result._sum.durationMinutes ?? 0) / 60;
    await tx.task.update({ where: { id: taskId, userId }, data: { actualHours } });
    return actualHours;
  });
}

export function deleteSessionById(userId: string, id: string) {
  return prisma.session.deleteMany({ where: { id, userId } });
}

export function findTaskForSession(taskId: string, userId: string) {
  return prisma.task.findFirst({ where: { id: taskId, ...(userId ? { userId } : {}) } });
}

export function markTaskInProgress(userId: string, taskId: string, startedAt: Date) {
  return prisma.task.update({
    where: { id: taskId, userId },
    data: { status: "IN_PROGRESS", startedAt },
  });
}
