import { z } from "zod";
import type { Tool } from "./tool.interface";
import { createReview, getGoalReviewPageData, getWeekPeriod } from "@/services/review.service";
import { prisma } from "@/lib/prisma";

export const getReviewTool: Tool<{ goalId: string }, Record<string, unknown>> = {
  name: "get_review",
  description: "Mendapatkan data review mingguan untuk goal tertentu",
  type: "READ",
  schema: z.object({
    goalId: z.string().min(1, "Goal ID diperlukan"),
  }),
  async execute(input, context) {
    const data = await getGoalReviewPageData(input.goalId, context.userId);
    if (!data) {
      return {
        success: false,
        toolName: "get_review",
        type: "READ",
        message: "Goal untuk review tidak ditemukan.",
        error: { code: "GOAL_NOT_FOUND", message: "Goal tidak ditemukan." },
      };
    }
    return {
      success: true,
      toolName: "get_review",
      type: "READ",
      message: `Review untuk goal "${data.goal.title}": ${data.review ? "Sudah direview minggu ini" : "Belum direview"}.`,
      data,
    };
  },
};

export const createReviewTool: Tool<
  {
    goalId: string;
    wentWell?: string;
    difficulties?: string;
    improvements?: string;
    nextFocus?: string;
    understanding?: number;
  },
  { id: string; goalName: string }
> = {
  name: "create_review",
  description: "Menyimpan refleksi dan ulasan mingguan untuk goal",
  type: "WRITE",
  schema: z.object({
    goalId: z.string().min(1, "Goal ID diperlukan"),
    wentWell: z.string().optional(),
    difficulties: z.string().optional(),
    improvements: z.string().optional(),
    nextFocus: z.string().optional(),
    understanding: z.number().min(1).max(5).optional(),
  }),
  async execute(input, context) {
    const goal = await prisma.goal.findFirst({ where: { id: input.goalId, userId: context.userId } });
    if (!goal) {
      return {
        success: false,
        toolName: "create_review",
        type: "WRITE",
        message: "Goal tidak ditemukan.",
        error: { code: "GOAL_NOT_FOUND", message: "Goal tidak ditemukan." },
      };
    }

    const period = getWeekPeriod();
    const review = await createReview(
      input.goalId,
      {
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        wentWell: input.wentWell ?? null,
        difficulties: input.difficulties ?? null,
        improvements: input.improvements ?? null,
        nextFocus: input.nextFocus ?? null,
        understanding: input.understanding ?? null,
      },
      context.userId
    );

    return {
      success: true,
      toolName: "create_review",
      type: "WRITE",
      message: `Review untuk goal "${goal.title}" berhasil disimpan.`,
      data: { id: review.id, goalName: goal.title },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const found = await prisma.review.findFirst({ where: { id: result.data.id, userId: context.userId } });
    return !!found;
  },
};
