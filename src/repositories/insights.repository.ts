import { prisma } from "@/lib/prisma";

export async function findInsightsTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    include: {
      goal: { select: { id: true, title: true, status: true, areaId: true } },
      project: { select: { id: true, title: true, status: true, areaId: true } },
      area: { select: { id: true, name: true, color: true } },
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
    orderBy: [
      { dueDate: "asc" },
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export async function findInsightsGoals(userId: string) {
  return prisma.goal.findMany({
    where: { userId },
    include: {
      area: { select: { id: true, name: true, color: true } },
      stages: {
        include: {
          tasks: { select: { id: true, status: true } },
        },
      },
      tasks: { select: { id: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function findInsightsAreas(userId: string) {
  return prisma.area.findMany({
    where: { userId },
    include: {
      goals: { select: { id: true, status: true } },
      projects: { select: { id: true, status: true } },
      tasks: { select: { id: true, status: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function findInsightsSessions(userId: string, start?: Date, end?: Date) {
  return prisma.session.findMany({
    where: {
      userId,
      ...(start && end
        ? {
            startedAt: { gte: start, lte: end },
          }
        : {}),
    },
    include: {
      task: { select: { id: true, title: true, projectId: true, areaId: true } },
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function findInsightsActiveSession(userId: string) {
  return prisma.session.findFirst({
    where: { userId, endedAt: null },
    include: {
      task: { select: { id: true, title: true, projectId: true, areaId: true } },
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function findInsightsActivities(userId: string, start?: Date, end?: Date) {
  return prisma.activity.findMany({
    where: {
      userId,
      ...(start && end
        ? {
            startTime: { gte: start, lte: end },
          }
        : {}),
    },
    orderBy: { startTime: "desc" },
  });
}

export async function findInsightsCalendarEvents(userId: string, start?: Date, end?: Date) {
  return prisma.calendarEvent.findMany({
    where: {
      userId,
      ...(start && end
        ? {
            startTime: { lte: end },
            endTime: { gte: start },
          }
        : {}),
    },
    orderBy: { startTime: "asc" },
  });
}

export async function findInsightsDailyFocus(userId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return prisma.dailyFocus.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    orderBy: { order: "asc" },
  });
}

export async function findInsightsPendingCaptures(userId: string, limit = 50) {
  return prisma.capture.findMany({
    where: { userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function findInsightsReviews(userId: string, start?: Date, end?: Date) {
  return prisma.review.findMany({
    where: {
      userId,
      ...(start && end
        ? {
            periodStart: { gte: start, lte: end },
          }
        : {}),
    },
    include: {
      goal: { select: { id: true, title: true } },
    },
    orderBy: { periodStart: "desc" },
  });
}

export async function findInsightsUnreadNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
