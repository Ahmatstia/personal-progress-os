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

export function createSession(taskId: string) {
  return prisma.session.create({
    data: { taskId, startedAt: new Date() },
    include: sessionInclude,
  });
}

export function findActiveSessionByTaskId(taskId: string) {
  return prisma.session.findFirst({
    where: { taskId, endedAt: null },
    orderBy: { startedAt: "desc" },
    include: sessionInclude,
  });
}

export function findAnyActiveSession() {
  return prisma.session.findFirst({ where: { endedAt: null }, orderBy: { startedAt: "desc" }, include: sessionInclude });
}

export function findSessionById(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: sessionInclude,
  });
}

export function endSession(
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
    where: { id },
    data,
    include: sessionInclude,
  });
}

export function findSessionsByTaskId(taskId: string) {
  return prisma.session.findMany({
    where: { taskId },
    orderBy: { startedAt: "desc" },
    include: sessionInclude,
  });
}

export function sumCompletedSessionMinutes(taskId: string) {
  return prisma.session.aggregate({
    where: { taskId, endedAt: { not: null } },
    _sum: { durationMinutes: true },
  });
}

export function updateTaskActualHours(taskId: string, actualHours: number) {
  return prisma.task.update({
    where: { id: taskId },
    data: { actualHours },
  });
}

export function findTaskForSession(taskId: string) {
  return prisma.task.findUnique({ where: { id: taskId } });
}

export function markTaskInProgress(taskId: string, startedAt: Date) {
  return prisma.task.update({
    where: { id: taskId },
    data: { status: "IN_PROGRESS", startedAt },
  });
}
