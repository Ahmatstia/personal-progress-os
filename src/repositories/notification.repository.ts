import { prisma } from "@/lib/prisma";
import type { NotificationType, NotificationSeverity } from "@/generated/prisma/client";

export interface ListNotificationsParams {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  severity?: NotificationSeverity;
  limit?: number;
  offset?: number;
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  severity?: NotificationSeverity;
  linkUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

export async function findNotifications(params: ListNotificationsParams) {
  const { userId, isRead, type, severity, limit = 30, offset = 0 } = params;

  return prisma.notification.findMany({
    where: {
      userId,
      ...(isRead !== undefined && { isRead }),
      ...(type && { type }),
      ...(severity && { severity }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function countNotifications(userId: string, isRead?: boolean) {
  return prisma.notification.count({
    where: {
      userId,
      ...(isRead !== undefined && { isRead }),
    },
  });
}

export async function findNotificationById(id: string, userId: string) {
  return prisma.notification.findFirst({
    where: { id, userId },
  });
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "SYSTEM",
      severity: params.severity ?? "INFO",
      linkUrl: params.linkUrl ?? null,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
    },
  });
}

export async function markNotificationAsRead(id: string, userId: string) {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;

  return prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function deleteNotification(id: string, userId: string) {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;

  return prisma.notification.delete({
    where: { id },
  });
}

export async function findExistingNotification(
  userId: string,
  type: NotificationType,
  entityId: string,
  sinceDate?: Date
) {
  return prisma.notification.findFirst({
    where: {
      userId,
      type,
      entityId,
      ...(sinceDate && { createdAt: { gte: sinceDate } }),
    },
  });
}

export async function pruneReadNotifications(userId: string, olderThan: Date) {
  return prisma.notification.deleteMany({
    where: {
      userId,
      isRead: true,
      createdAt: { lt: olderThan },
    },
  });
}
