import {
  findNotifications,
  countNotifications,
  findNotificationById,
  createNotification as createNotificationRecord,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationRecord,
  pruneReadNotifications,
} from "@/repositories/notification.repository";
import {
  listNotificationsQuerySchema,
  createNotificationSchema,
  type ListNotificationsQuery,
  type CreateNotificationInput,
} from "@/schemas/notification.schema";
import { requireUserId } from "@/lib/ownership";
import type { NotificationType, NotificationSeverity } from "@/generated/prisma/client";

export class NotificationServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "INVALID_INPUT" | "UNAUTHORIZED" = "NOT_FOUND"
  ) {
    super(message);
    this.name = "NotificationServiceError";
  }
}

export async function listNotifications(query: Partial<ListNotificationsQuery>, userId?: string) {
  const owner = requireUserId(userId);
  const parsed = listNotificationsQuerySchema.parse(query);

  const [items, totalCount, unreadCount] = await Promise.all([
    findNotifications({
      userId: owner,
      isRead: parsed.isRead,
      type: parsed.type as NotificationType | undefined,
      severity: parsed.severity as NotificationSeverity | undefined,
      limit: parsed.limit,
      offset: parsed.offset,
    }),
    countNotifications(owner),
    countNotifications(owner, false),
  ]);

  return {
    items,
    pagination: {
      total: totalCount,
      unread: unreadCount,
      limit: parsed.limit,
      offset: parsed.offset,
    },
  };
}

export async function getUnreadNotificationCount(userId?: string): Promise<number> {
  const owner = requireUserId(userId);
  return countNotifications(owner, false);
}

export async function getNotificationById(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const notification = await findNotificationById(id, owner);
  if (!notification) {
    throw new NotificationServiceError("Notifikasi tidak ditemukan.", "NOT_FOUND");
  }
  return notification;
}

export async function createNotification(input: CreateNotificationInput, userId?: string) {
  const owner = requireUserId(userId);
  const parsed = createNotificationSchema.parse(input);

  return createNotificationRecord({
    userId: owner,
    title: parsed.title,
    message: parsed.message,
    type: parsed.type as NotificationType,
    severity: parsed.severity as NotificationSeverity,
    linkUrl: parsed.linkUrl,
    entityType: parsed.entityType,
    entityId: parsed.entityId,
  });
}

export async function markAsRead(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const updated = await markNotificationAsRead(id, owner);
  if (!updated) {
    throw new NotificationServiceError("Notifikasi tidak ditemukan.", "NOT_FOUND");
  }
  return updated;
}

export async function markAllAsRead(userId?: string) {
  const owner = requireUserId(userId);
  const result = await markAllNotificationsAsRead(owner);
  return { updatedCount: result.count };
}

export async function deleteNotification(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const deleted = await deleteNotificationRecord(id, owner);
  if (!deleted) {
    throw new NotificationServiceError("Notifikasi tidak ditemukan.", "NOT_FOUND");
  }
  return { success: true, id };
}

export async function pruneOldNotifications(userId?: string, daysToKeep = 30) {
  const owner = requireUserId(userId);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const result = await pruneReadNotifications(owner, cutoff);
  return { deletedCount: result.count };
}
