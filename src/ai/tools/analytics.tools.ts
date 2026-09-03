import { z } from "zod";
import type { Tool } from "./tool.interface";
import { getDashboardAnalytics, getGoalAnalytics } from "@/services/analytics.service";
import { getToday } from "@/services/today.service";
import { formatDuration } from "@/lib/format";

export const getProgressTool: Tool<{ goalId?: string; days?: number }, Record<string, unknown>> = {
  name: "get_progress",
  description: "Melihat progress dan statistik penyelesaian goal atau seluruh sistem",
  type: "READ",
  schema: z.object({
    goalId: z.string().optional(),
    days: z.number().int().positive().default(30),
  }),
  async execute(input, context) {
    const days = input.days ?? 30;
    if (input.goalId) {
      const data = await getGoalAnalytics(input.goalId, undefined, undefined, context.userId);
      return {
        success: true,
        toolName: "get_progress",
        type: "READ",
        message: `Progress goal: ${data.summary.completionRate}%, ${data.summary.completedTasks} task selesai, total ${formatDuration(data.summary.totalMinutes)} fokus.`,
        data,
      };
    }
    const data = await getDashboardAnalytics({ days }, context.userId);
    return {
      success: true,
      toolName: "get_progress",
      type: "READ",
      message: `Progress keseluruhan ${days} hari: ${data.summary.completionRate}%, ${data.summary.completedTasks} task selesai, total ${formatDuration(data.summary.totalMinutes)} fokus.`,
      data,
    };
  },
};

export const getStreakTool: Tool<{ days?: number }, Record<string, unknown>> = {
  name: "get_streak",
  description: "Melihat streak konsistensi dan hari aktif belajar",
  type: "READ",
  schema: z.object({
    days: z.number().int().positive().default(30),
  }),
  async execute(input, context) {
    const days = input.days ?? 30;
    const data = await getDashboardAnalytics({ days }, context.userId);
    return {
      success: true,
      toolName: "get_streak",
      type: "READ",
      message: `Streak saat ini: ${data.summary.currentStreak} hari berturut-turut (rekor terpanjang: ${data.summary.longestStreak} hari, ${data.summary.activeDays} hari aktif dalam ${data.summary.daysInPeriod} hari).`,
      data: {
        currentStreak: data.summary.currentStreak,
        longestStreak: data.summary.longestStreak,
        activeDays: data.summary.activeDays,
        daysInPeriod: data.summary.daysInPeriod,
        consistency: data.summary.consistency,
      },
    };
  },
};

export const getTimeSpentTool: Tool<{ days?: number }, Record<string, unknown>> = {
  name: "get_time_spent",
  description: "Melihat total waktu belajar dan rata-rata durasi sesi",
  type: "READ",
  schema: z.object({
    days: z.number().int().positive().default(30),
  }),
  async execute(input, context) {
    const days = input.days ?? 30;
    const data = await getDashboardAnalytics({ days }, context.userId);
    return {
      success: true,
      toolName: "get_time_spent",
      type: "READ",
      message: `Waktu belajar dalam ${days} hari: ${formatDuration(data.summary.totalMinutes)} (rata-rata ${data.summary.averageSessionMinutes} menit per sesi).`,
      data: {
        totalMinutes: data.summary.totalMinutes,
        averageSessionMinutes: data.summary.averageSessionMinutes,
      },
    };
  },
};

export const getBottleneckTool: Tool<{ days?: number }, Record<string, unknown>> = {
  name: "get_bottleneck",
  description: "Menganalisis hambatan atau task yang memakan waktu lama / tertunda",
  type: "READ",
  schema: z.object({
    days: z.number().int().positive().default(30),
  }),
  async execute(input, context) {
    const days = input.days ?? 30;
    const data = await getDashboardAnalytics({ days }, context.userId);
    const insights = data.bottlenecks.map((b) => `Task "${b.taskName}": ${b.reason}`);
    return {
      success: true,
      toolName: "get_bottleneck",
      type: "READ",
      message: data.bottlenecks.length
        ? `Ditemukan ${data.bottlenecks.length} hambatan: ${data.bottlenecks.map((b) => b.taskName).join(", ")}.`
        : "Tidak ada hambatan signifikan saat ini. Alur kerja berjalan lancar.",
      data: { bottlenecks: data.bottlenecks, insights },
    };
  },
};

export const getNextActionTool: Tool<Record<string, never>, Record<string, unknown> | null> = {
  name: "get_next_action",
  description: "Mendapatkan rekomendasi aksi berikutnya yang paling prioritas",
  type: "READ",
  schema: z.object({}),
  async execute(_input, context) {
    const today = await getToday(new Date(), context.userId);
    if (!today.nextAction) {
      return {
        success: true,
        toolName: "get_next_action",
        type: "READ",
        message: "Belum ada next action yang ditentukan. Silakan buat task di Goals.",
        data: null,
      };
    }
    return {
      success: true,
      toolName: "get_next_action",
      type: "READ",
      message: `Aksi berikutnya: "${today.nextAction.taskName}" (${today.nextAction.goalName} · ${today.nextAction.stageName}).`,
      data: today.nextAction,
    };
  },
};
