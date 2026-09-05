import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/ownership";
import { createNotification } from "@/repositories/notification.repository";

/**
 * Lightweight deterministic automation layer for MyLife.
 * NO arbitrary scripting, NO eval(), NO dynamic code execution.
 * Purely typed Rule -> Condition -> Action routines.
 */

/**
 * Rule: When a task is marked COMPLETED, check if it was part of today's DailyFocus.
 * If all DailyFocus tasks for today are now completed, trigger a celebration notification.
 */
export async function onTaskStatusChanged(
  taskId: string,
  newStatus: string,
  userId?: string
) {
  const owner = requireUserId(userId);

  if (newStatus === "COMPLETED") {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayFocuses = await prisma.dailyFocus.findMany({
      where: {
        userId: owner,
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        task: true,
      },
    });

    if (todayFocuses.length > 0) {
      const isTargetInFocus = todayFocuses.some((f) => f.taskId === taskId);
      const allDone = todayFocuses.every((f) => f.taskId === taskId || f.task.status === "COMPLETED");

      if (isTargetInFocus && allDone) {
        await createNotification({
          userId: owner,
          title: "Semua Fokus Harian Tercapai! 🎉",
          message: `Selamat! Seluruh ${todayFocuses.length} task fokus hari ini telah berhasil Anda selesaikan.`,
          type: "SYSTEM",
          severity: "INFO",
          linkUrl: "/focus",
        });

        return { triggered: true, action: "ALL_DAILY_FOCUS_COMPLETED" };
      }
    }
  }

  return { triggered: false };
}
