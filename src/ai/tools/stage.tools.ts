import { z } from "zod";
import type { Tool } from "./tool.interface";
import { deleteStage, moveStage, updateStage } from "@/services/stage.service";
import { prisma } from "@/lib/prisma";

export const createStageTool: Tool<{ goalId: string; name: string; description?: string; order?: number }, { id: string; name: string; goalId: string }> = {
  name: "create_stage",
  description: "Membuat stage baru di dalam sebuah goal",
  type: "WRITE",
  schema: z.object({
    goalId: z.string().min(1, "Goal ID diperlukan"),
    name: z.string().min(1, "Nama stage tidak boleh kosong"),
    description: z.string().optional(),
    order: z.number().int().optional(),
  }),
  async execute(input, context) {
    const goal = await prisma.goal.findFirst({ where: { id: input.goalId, userId: context.userId } });
    if (!goal) {
      return {
        success: false,
        toolName: "create_stage",
        type: "WRITE",
        message: "Goal target tidak ditemukan.",
        error: { code: "GOAL_NOT_FOUND", message: "Goal target tidak ditemukan." },
      };
    }

    const currentCount = await prisma.stage.count({ where: { goalId: input.goalId, userId: context.userId } });
    const stage = await prisma.stage.create({
      data: {
        userId: context.userId,
        goalId: input.goalId,
        name: input.name,
        description: input.description ?? null,
        order: input.order ?? currentCount,
      },
    });

    return {
      success: true,
      toolName: "create_stage",
      type: "WRITE",
      message: `Stage "${stage.name}" berhasil dibuat pada goal "${goal.name}".`,
      data: { id: stage.id, name: stage.name, goalId: stage.goalId },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const found = await prisma.stage.findFirst({
      where: { id: result.data.id, userId: context.userId },
    });
    return !!found;
  },
};

export const getStageTool: Tool<{ id: string }, Record<string, unknown>> = {
  name: "get_stage",
  description: "Mendapatkan detail stage beserta seluruh task di dalamnya",
  type: "READ",
  schema: z.object({
    id: z.string().min(1, "Stage ID diperlukan"),
  }),
  async execute(input, context) {
    const stage = await prisma.stage.findFirst({
      where: { id: input.id, userId: context.userId },
      include: {
        goal: true,
        tasks: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!stage) {
      return {
        success: false,
        toolName: "get_stage",
        type: "READ",
        message: "Stage tidak ditemukan.",
        error: { code: "STAGE_NOT_FOUND", message: "Stage tidak ditemukan." },
      };
    }
    return {
      success: true,
      toolName: "get_stage",
      type: "READ",
      message: `Stage "${stage.name}" ditemukan dengan ${stage.tasks.length} task.`,
      data: stage,
    };
  },
};

export const findStageTool: Tool<{ goalId?: string; query?: string }, Array<{ id: string; name: string; goalName: string; taskCount: number }>> = {
  name: "find_stage",
  description: "Mencari stage berdasarkan nama atau goal",
  type: "READ",
  schema: z.object({
    goalId: z.string().optional(),
    query: z.string().optional(),
  }),
  async execute(input, context) {
    const stages = await prisma.stage.findMany({
      where: {
        userId: context.userId,
        ...(input.goalId ? { goalId: input.goalId } : {}),
        ...(input.query ? { name: { contains: input.query } } : {}),
      },
      include: {
        goal: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { order: "asc" },
    });
    return {
      success: true,
      toolName: "find_stage",
      type: "READ",
      message: `Ditemukan ${stages.length} stage.`,
      data: stages.map((s) => ({
        id: s.id,
        name: s.name,
        goalName: s.goal.name,
        taskCount: s._count.tasks,
      })),
    };
  },
};

export const updateStageTool: Tool<{ id: string; name?: string; description?: string }, { id: string; name: string }> = {
  name: "update_stage",
  description: "Memperbarui nama atau deskripsi stage",
  type: "WRITE",
  schema: z.object({
    id: z.string().min(1, "Stage ID diperlukan"),
    name: z.string().optional(),
    description: z.string().optional(),
  }),
  async execute(input, context) {
    const exists = await prisma.stage.findFirst({ where: { id: input.id, userId: context.userId } });
    if (!exists) {
      return {
        success: false,
        toolName: "update_stage",
        type: "WRITE",
        message: "Stage tidak ditemukan.",
        error: { code: "STAGE_NOT_FOUND", message: "Stage tidak ditemukan." },
      };
    }
    await updateStage(input.id, { name: input.name, description: input.description }, context.userId);
    return {
      success: true,
      toolName: "update_stage",
      type: "WRITE",
      message: `Stage "${input.name ?? exists.name}" berhasil diperbarui.`,
      data: { id: exists.id, name: input.name ?? exists.name },
      verified: true,
    };
  },
};

export const deleteStageTool: Tool<{ id: string }, { id: string; name: string }> = {
  name: "delete_stage",
  description: "Menghapus stage beserta task di dalamnya (DESTRUKTIF)",
  type: "DESTRUCTIVE",
  schema: z.object({
    id: z.string().min(1, "Stage ID diperlukan"),
  }),
  async execute(input, context) {
    const exists = await prisma.stage.findFirst({ where: { id: input.id, userId: context.userId } });
    if (!exists) {
      return {
        success: false,
        toolName: "delete_stage",
        type: "DESTRUCTIVE",
        message: "Stage tidak ditemukan.",
        error: { code: "STAGE_NOT_FOUND", message: "Stage tidak ditemukan." },
      };
    }
    await deleteStage(input.id, context.userId);
    return {
      success: true,
      toolName: "delete_stage",
      type: "DESTRUCTIVE",
      message: `Stage "${exists.name}" berhasil dihapus.`,
      data: { id: exists.id, name: exists.name },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const found = await prisma.stage.findFirst({
      where: { id: result.data.id, userId: context.userId },
    });
    return !found;
  },
};

export const reorderStageTool: Tool<{ id: string; direction: "up" | "down" }, { id: string; name: string }> = {
  name: "reorder_stage",
  description: "Mengubah urutan stage ke atas atau ke bawah",
  type: "WRITE",
  schema: z.object({
    id: z.string().min(1, "Stage ID diperlukan"),
    direction: z.enum(["up", "down"]),
  }),
  async execute(input, context) {
    const stage = await prisma.stage.findFirst({ where: { id: input.id, userId: context.userId } });
    if (!stage) {
      return {
        success: false,
        toolName: "reorder_stage",
        type: "WRITE",
        message: "Stage tidak ditemukan.",
        error: { code: "STAGE_NOT_FOUND", message: "Stage tidak ditemukan." },
      };
    }
    await moveStage(input.id, input.direction, context.userId);
    return {
      success: true,
      toolName: "reorder_stage",
      type: "WRITE",
      message: `Urutan stage "${stage.name}" berhasil diubah ke ${input.direction === "up" ? "atas" : "bawah"}.`,
      data: { id: stage.id, name: stage.name },
      verified: true,
    };
  },
};
