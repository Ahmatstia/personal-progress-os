import { z } from "zod";
import type { Tool } from "./tool.interface";
import { endSession, getAnyActiveSession, startSession } from "@/services/session.service";
import { prisma } from "@/lib/prisma";

export const startSessionTool: Tool<{ taskId: string }, { id: string; taskName: string; startedAt: Date }> = {
  name: "start_session",
  description: "Memulai sesi fokus baru untuk task tertentu",
  type: "WRITE",
  schema: z.object({
    taskId: z.string().min(1, "Task ID diperlukan"),
  }),
  async execute(input, context) {
    const task = await prisma.task.findFirst({ where: { id: input.taskId, userId: context.userId } });
    if (!task) {
      return {
        success: false,
        toolName: "start_session",
        type: "WRITE",
        message: "Task tidak ditemukan.",
        error: { code: "TASK_NOT_FOUND", message: "Task tidak ditemukan." },
      };
    }
    try {
      const session = await startSession(input.taskId, context.userId);
      return {
        success: true,
        toolName: "start_session",
        type: "WRITE",
        message: `Sesi fokus untuk task "${task.title}" dimulai.`,
        data: { id: session.id, taskName: task.title, startedAt: session.startedAt },
        verified: true,
      };
    } catch (err) {
      return {
        success: false,
        toolName: "start_session",
        type: "WRITE",
        message: err instanceof Error ? err.message : "Gagal memulai sesi fokus.",
        error: { code: "START_SESSION_FAILED", message: String(err) },
      };
    }
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const session = await prisma.session.findFirst({ where: { id: result.data.id, userId: context.userId } });
    return !!session && !session.endedAt;
  },
};

export const endSessionTool: Tool<
  { activity?: string; understanding?: number; obstacle?: string; nextAction?: string },
  { id: string; durationMinutes: number | null }
> = {
  name: "end_session",
  description: "Mengakhiri sesi fokus aktif dengan catatan dan rating pemahaman",
  type: "WRITE",
  schema: z.object({
    activity: z.string().optional(),
    understanding: z.number().int().min(1).max(5).optional(),
    obstacle: z.string().optional(),
    nextAction: z.string().optional(),
  }),
  async execute(input, context) {
    const active = await getAnyActiveSession(context.userId);
    if (!active) {
      return {
        success: false,
        toolName: "end_session",
        type: "WRITE",
        message: "Tidak ada sesi fokus yang sedang berjalan.",
        error: { code: "NO_ACTIVE_SESSION", message: "Tidak ada sesi aktif." },
      };
    }

    const session = await endSession(
      active.id,
      {
        sessionId: active.id,
        activity: input.activity,
        understanding: input.understanding,
        obstacle: input.obstacle,
        nextAction: input.nextAction,
      },
      context.userId
    );

    return {
      success: true,
      toolName: "end_session",
      type: "WRITE",
      message: `Sesi fokus berhasil diakhiri (${session.durationMinutes ?? 0} menit).`,
      data: { id: session.id, durationMinutes: session.durationMinutes },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const session = await prisma.session.findFirst({ where: { id: result.data.id, userId: context.userId } });
    return !!session && !!session.endedAt;
  },
};

export const getActiveSessionTool: Tool<Record<string, never>, Record<string, unknown> | null> = {
  name: "get_active_session",
  description: "Mendapatkan sesi fokus yang sedang aktif bila ada",
  type: "READ",
  schema: z.object({}),
  async execute(_input, context) {
    const active = await getAnyActiveSession(context.userId);
    if (!active) {
      return {
        success: true,
        toolName: "get_active_session",
        type: "READ",
        message: "Tidak ada sesi fokus aktif.",
        data: null,
      };
    }
    return {
      success: true,
      toolName: "get_active_session",
      type: "READ",
      message: `Sesi aktif: "${active.task.title}" (mulai ${active.startedAt.toLocaleTimeString("id-ID")}).`,
      data: active,
    };
  },
};
