import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const taskInclude = { stage: { include: { goal: true } }, sessions: true } as const satisfies Prisma.TaskInclude;

export function findTodayFocus(date: Date) {
  return prisma.dailyFocus.findMany({ where: { date }, orderBy: { order: "asc" }, include: { task: { include: taskInclude } } });
}

export function findFocusById(id: string) {
  return prisma.dailyFocus.findUnique({ where: { id }, include: { task: { include: taskInclude } } });
}

export function findTaskForFocus(taskId: string) {
  return prisma.task.findUnique({ where: { id: taskId }, include: taskInclude });
}

export function createFocus(date: Date, taskId: string, order: number) {
  return prisma.dailyFocus.create({ data: { date, taskId, order }, include: { task: { include: taskInclude } } });
}

export function deleteFocus(id: string) { return prisma.dailyFocus.delete({ where: { id } }); }
export function updateFocus(id: string, order: number) { return prisma.dailyFocus.update({ where: { id }, data: { order } }); }

export function findTodayContext() {
  return prisma.goal.findMany({
    where: { status: { not: "COMPLETED" } },
    include: { stages: { include: { tasks: { include: { stage: { include: { goal: true } }, sessions: true } } } } },
  });
}

export function findTodaySessions(start: Date, end: Date) {
  return prisma.session.findMany({ where: { OR: [{ endedAt: { gte: start, lte: end } }, { endedAt: null, startedAt: { lte: end } }] }, orderBy: { startedAt: "desc" }, include: { task: { include: { stage: { include: { goal: true } } } } } });
}

export function createCapture(content: string) { return prisma.capture.create({ data: { content } }); }
