import { z } from "zod";
import type { Tool } from "./tool.interface";
import { addTodayFocus, getToday } from "@/services/today.service";
import { prisma } from "@/lib/prisma";

export const createFocusTool: Tool<{ taskId: string; date?: Date }, { id: string; taskName: string }> = {
  name: "create_focus",
  description: "Menambahkan task ke daftar fokus hari ini",
  type: "WRITE",
  schema: z.object({
    taskId: z.string().min(1, "Task ID diperlukan"),
    date: z.date().optional(),
  }),
  async execute(input, context) {
    const task = await prisma.task.findFirst({ where: { id: input.taskId, userId: context.userId } });
    if (!task) {
      return {
        success: false,
        toolName: "create_focus",
        type: "WRITE",
        message: "Task tidak ditemukan.",
        error: { code: "TASK_NOT_FOUND", message: "Task tidak ditemukan." },
      };
    }

    const focus = await addTodayFocus(input.taskId, input.date ?? new Date(), context.userId);
    return {
      success: true,
      toolName: "create_focus",
      type: "WRITE",
      message: `Task "${task.title}" ditambahkan ke fokus hari ini.`,
      data: { id: focus.id, taskName: task.title },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const focus = await prisma.dailyFocus.findFirst({ where: { id: result.data.id, userId: context.userId } });
    return !!focus;
  },
};

export const getTodayFocusTool: Tool<{ date?: Date }, Record<string, unknown>> = {
  name: "get_today_focus",
  description: "Melihat daftar fokus dan rangkuman aktivitas hari ini",
  type: "READ",
  schema: z.object({
    date: z.date().optional(),
  }),
  async execute(input, context) {
    const today = await getToday(input.date ?? new Date(), context.userId);
    return {
      success: true,
      toolName: "get_today_focus",
      type: "READ",
      message: `Hari ini: ${today.focusTasks.length} task fokus, ${today.stats.completedTasks} selesai, ${today.stats.totalMinutes} menit fokus.`,
      data: today,
    };
  },
};
