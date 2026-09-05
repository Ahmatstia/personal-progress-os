import { prisma } from "@/lib/prisma";

const focusTaskInclude = {
  task: {
    include: {
      stage: { include: { goal: true } },
      project: { include: { goal: true } },
      milestone: true,
      area: true,
      goal: true,
      sessions: true,
    },
  },
} as const;

export function findDailyFocusByDate(userId: string, date: Date) {
  return prisma.dailyFocus.findMany({
    where: { userId, date },
    orderBy: { order: "asc" },
    include: focusTaskInclude,
  });
}

export function findDailyFocusById(userId: string, id: string) {
  return prisma.dailyFocus.findFirst({
    where: { id, userId },
    include: focusTaskInclude,
  });
}

export function findFocusByDateAndTask(userId: string, date: Date, taskId: string) {
  return prisma.dailyFocus.findFirst({
    where: { userId, date, taskId },
    include: focusTaskInclude,
  });
}

export function countDailyFocusByDate(userId: string, date: Date) {
  return prisma.dailyFocus.count({
    where: { userId, date },
  });
}

export function createDailyFocus(userId: string, data: { date: Date; taskId: string; order: number }) {
  return prisma.dailyFocus.create({
    data: {
      userId,
      date: data.date,
      taskId: data.taskId,
      order: data.order,
    },
    include: focusTaskInclude,
  });
}

export function updateDailyFocusOrder(userId: string, id: string, order: number) {
  return prisma.dailyFocus.updateMany({
    where: { id, userId },
    data: { order },
  });
}

export function deleteDailyFocus(userId: string, id: string) {
  return prisma.dailyFocus.deleteMany({
    where: { id, userId },
  });
}

export function findDailyFocusHistory(userId: string, limit = 30) {
  return prisma.dailyFocus.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { order: "asc" }],
    take: limit,
    include: focusTaskInclude,
  });
}
