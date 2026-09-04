import { z } from "zod";
import type { Tool } from "./tool.interface";
import { createGoal, deleteGoal } from "@/services/goal.service";
import { prisma } from "@/lib/prisma";
import type { GoalType, GoalStatus } from "@/generated/prisma/client";

export const createGoalTool: Tool<{ name: string; type?: "LEARNING" | "ACHIEVEMENT" | "HABIT" | "MAINTENANCE"; description?: string }, { id: string; name: string }> = {
  name: "create_goal",
  description: "Membuat goal baru untuk pengguna",
  type: "WRITE",
  schema: z.object({
    name: z.string().min(1, "Nama goal tidak boleh kosong"),
    type: z.enum(["LEARNING", "ACHIEVEMENT", "HABIT", "MAINTENANCE"]).default("LEARNING"),
    description: z.string().optional(),
  }),
  async execute(input, context) {
    try {
      const goal = await createGoal(
        { title: input.name, type: input.type ?? "LEARNING", description: input.description ?? null, priority: "MEDIUM" },
        context.userId
      );
      return {
        success: true,
        toolName: "create_goal",
        type: "WRITE",
        message: `Goal "${goal.title}" berhasil dibuat.`,
        data: { id: goal.id, name: goal.title },
        verified: true,
      };
    } catch (error) {
      return {
        success: false,
        toolName: "create_goal",
        type: "WRITE",
        message: error instanceof Error ? error.message : "Gagal membuat goal.",
        error: { code: "CREATE_GOAL_FAILED", message: String(error) },
      };
    }
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const found = await prisma.goal.findFirst({
      where: { id: result.data.id, userId: context.userId },
    });
    return !!found;
  },
};

export const getGoalTool: Tool<{ id: string }, Record<string, unknown>> = {
  name: "get_goal",
  description: "Mendapatkan detail goal beserta stage dan task",
  type: "READ",
  schema: z.object({
    id: z.string().min(1, "Goal ID diperlukan"),
  }),
  async execute(input, context) {
    const goal = await prisma.goal.findFirst({
      where: { id: input.id, userId: context.userId },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: {
            tasks: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });
    if (!goal) {
      return {
        success: false,
        toolName: "get_goal",
        type: "READ",
        message: "Goal tidak ditemukan.",
        error: { code: "GOAL_NOT_FOUND", message: "Goal tidak ditemukan." },
      };
    }
    return {
      success: true,
      toolName: "get_goal",
      type: "READ",
      message: `Goal "${goal.title}" ditemukan dengan ${goal.stages.length} stage.`,
      data: goal,
    };
  },
};

export const findGoalTool: Tool<{ query?: string }, Array<{ id: string; name: string; type: string; stageCount: number }>> = {
  name: "find_goal",
  description: "Mencari goal berdasarkan nama atau kata kunci",
  type: "READ",
  schema: z.object({
    query: z.string().optional(),
  }),
  async execute(input, context) {
    const goals = await prisma.goal.findMany({
      where: {
        userId: context.userId,
        ...(input.query
          ? {
              name: {
                contains: input.query,
              },
            }
          : {}),
      },
      include: {
        _count: { select: { stages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return {
      success: true,
      toolName: "find_goal",
      type: "READ",
      message: `Ditemukan ${goals.length} goal.`,
      data: goals.map((g) => ({
        id: g.id,
        name: g.title,
        type: g.type,
        stageCount: g._count.stages,
      })),
    };
  },
};

export const updateGoalTool: Tool<{ id: string; name?: string; description?: string; type?: string; status?: string }, { id: string; name: string }> = {
  name: "update_goal",
  description: "Memperbarui data goal",
  type: "WRITE",
  schema: z.object({
    id: z.string().min(1, "Goal ID diperlukan"),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  }),
  async execute(input, context) {
    const exists = await prisma.goal.findFirst({ where: { id: input.id, userId: context.userId } });
    if (!exists) {
      return {
        success: false,
        toolName: "update_goal",
        type: "WRITE",
        message: "Goal tidak ditemukan.",
        error: { code: "GOAL_NOT_FOUND", message: "Goal tidak ditemukan." },
      };
    }
    const updated = await prisma.goal.update({
      where: { id: input.id },
      data: {
        ...(input.name ? { title: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.type ? { type: input.type as GoalType } : {}),
        ...(input.status ? { status: input.status as GoalStatus } : {}),
      },
    });
    return {
      success: true,
      toolName: "update_goal",
      type: "WRITE",
      message: `Goal "${updated.title}" berhasil diperbarui.`,
      data: { id: updated.id, name: updated.title },
      verified: true,
    };
  },
};

export const deleteGoalTool: Tool<{ id: string }, { id: string; name: string }> = {
  name: "delete_goal",
  description: "Menghapus goal beserta seluruh stage dan task-nya (DESTRUKTIF)",
  type: "DESTRUCTIVE",
  schema: z.object({
    id: z.string().min(1, "Goal ID diperlukan"),
  }),
  async execute(input, context) {
    const exists = await prisma.goal.findFirst({ where: { id: input.id, userId: context.userId } });
    if (!exists) {
      return {
        success: false,
        toolName: "delete_goal",
        type: "DESTRUCTIVE",
        message: "Goal tidak ditemukan.",
        error: { code: "GOAL_NOT_FOUND", message: "Goal tidak ditemukan." },
      };
    }
    await deleteGoal(input.id, context.userId);
    return {
      success: true,
      toolName: "delete_goal",
      type: "DESTRUCTIVE",
      message: `Goal "${exists.title}" beserta seluruh isinya berhasil dihapus.`,
      data: { id: exists.id, name: exists.title },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const found = await prisma.goal.findFirst({
      where: { id: result.data.id, userId: context.userId },
    });
    return !found;
  },
};
