import { z } from "zod";
import type { Tool } from "./tool.interface";
import { completeTask, createTask, deleteTask, reopenTask, updateTask } from "@/services/task.service";
import { prisma } from "@/lib/prisma";

export const createTaskTool: Tool<
  { stageId: string; name: string; description?: string; priority?: "LOW" | "MEDIUM" | "HIGH"; estimatedHours?: number; notes?: string },
  { id: string; name: string; stageName: string; goalName: string }
> = {
  name: "create_task",
  description: "Membuat task baru di dalam sebuah stage",
  type: "WRITE",
  schema: z.object({
    stageId: z.string().min(1, "Stage ID diperlukan"),
    name: z.string().min(1, "Nama task tidak boleh kosong"),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    estimatedHours: z.number().nonnegative().default(0),
    notes: z.string().optional(),
  }),
  async execute(input, context) {
    const stage = await prisma.stage.findFirst({
      where: { id: input.stageId, userId: context.userId },
      include: { goal: true },
    });
    if (!stage) {
      return {
        success: false,
        toolName: "create_task",
        type: "WRITE",
        message: "Stage target tidak ditemukan.",
        error: { code: "STAGE_NOT_FOUND", message: "Stage target tidak ditemukan." },
      };
    }

    const task = await createTask(
      {
        stageId: input.stageId,
        name: input.name,
        description: input.description ?? null,
        type: "TASK",
        priority: input.priority ?? "MEDIUM",
        estimatedHours: input.estimatedHours ?? 0,
        notes: input.notes ?? null,
      },
      context.userId
    );

    return {
      success: true,
      toolName: "create_task",
      type: "WRITE",
      message: `Task "${task.name}" berhasil dibuat pada stage "${stage.name}" (${stage.goal.name}).`,
      data: {
        id: task.id,
        name: task.name,
        stageName: stage.name,
        goalName: stage.goal.name,
      },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const found = await prisma.task.findFirst({
      where: { id: result.data.id, userId: context.userId },
    });
    return !!found;
  },
};

export const getTaskTool: Tool<{ id: string }, Record<string, unknown>> = {
  name: "get_task",
  description: "Mendapatkan detail task lengkap beserta relasi goal, stage, dan sesi",
  type: "READ",
  schema: z.object({
    id: z.string().min(1, "Task ID diperlukan"),
  }),
  async execute(input, context) {
    const task = await prisma.task.findFirst({
      where: { id: input.id, userId: context.userId },
      include: {
        stage: { include: { goal: true } },
        sessions: { orderBy: { startedAt: "desc" }, take: 10 },
      },
    });
    if (!task) {
      return {
        success: false,
        toolName: "get_task",
        type: "READ",
        message: "Task tidak ditemukan.",
        error: { code: "TASK_NOT_FOUND", message: "Task tidak ditemukan." },
      };
    }
    return {
      success: true,
      toolName: "get_task",
      type: "READ",
      message: `Task "${task.name}" (${task.status}) pada ${task.stage.goal.name} / ${task.stage.name}.`,
      data: task,
    };
  },
};

export const searchTasksTool: Tool<
  { query?: string; goalId?: string; stageId?: string; status?: string; priority?: string },
  Array<{ id: string; name: string; status: string; priority: string; stageName: string; goalName: string }>
> = {
  name: "search_tasks",
  description: "Mencari task berdasarkan nama, goal, stage, status, atau prioritas",
  type: "READ",
  schema: z.object({
    query: z.string().optional(),
    goalId: z.string().optional(),
    stageId: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
  }),
  async execute(input, context) {
    const tasks = await prisma.task.findMany({
      where: {
        userId: context.userId,
        ...(input.stageId ? { stageId: input.stageId } : {}),
        ...(input.goalId ? { stage: { goalId: input.goalId } } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.query ? { name: { contains: input.query } } : {}),
      },
      include: {
        stage: { include: { goal: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      toolName: "search_tasks",
      type: "READ",
      message: `Ditemukan ${tasks.length} task.`,
      data: tasks.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        priority: t.priority,
        stageName: t.stage.name,
        goalName: t.stage.goal.name,
      })),
    };
  },
};

export const updateTaskTool: Tool<
  { id: string; name?: string; description?: string | null; priority?: "LOW" | "MEDIUM" | "HIGH"; estimatedHours?: number; notes?: string | null; status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" },
  { id: string; name: string; status: string }
> = {
  name: "update_task",
  description: "Memperbarui data atau atribut task",
  type: "WRITE",
  schema: z.object({
    id: z.string().min(1, "Task ID diperlukan"),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    estimatedHours: z.number().nonnegative().optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
  }),
  async execute(input, context) {
    const exists = await prisma.task.findFirst({ where: { id: input.id, userId: context.userId } });
    if (!exists) {
      return {
        success: false,
        toolName: "update_task",
        type: "WRITE",
        message: "Task tidak ditemukan.",
        error: { code: "TASK_NOT_FOUND", message: "Task tidak ditemukan." },
      };
    }
    const updated = await updateTask(
      input.id,
      {
        name: input.name,
        description: input.description,
        priority: input.priority,
        estimatedHours: input.estimatedHours,
        notes: input.notes,
        status: input.status,
      },
      context.userId
    );
    return {
      success: true,
      toolName: "update_task",
      type: "WRITE",
      message: `Task "${updated.name}" berhasil diperbarui.`,
      data: { id: updated.id, name: updated.name, status: updated.status },
      verified: true,
    };
  },
};

export const completeTaskTool: Tool<{ id: string }, { id: string; name: string; status: string }> = {
  name: "complete_task",
  description: "Menandai task sebagai selesai (COMPLETED)",
  type: "WRITE",
  schema: z.object({
    id: z.string().min(1, "Task ID diperlukan"),
  }),
  async execute(input, context) {
    const exists = await prisma.task.findFirst({ where: { id: input.id, userId: context.userId } });
    if (!exists) {
      return {
        success: false,
        toolName: "complete_task",
        type: "WRITE",
        message: "Task tidak ditemukan.",
        error: { code: "TASK_NOT_FOUND", message: "Task tidak ditemukan." },
      };
    }
    const completed = await completeTask(input.id, context.userId);
    return {
      success: true,
      toolName: "complete_task",
      type: "WRITE",
      message: `Task "${completed.name}" berhasil diselesaikan.`,
      data: { id: completed.id, name: completed.name, status: completed.status },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const task = await prisma.task.findFirst({ where: { id: result.data.id, userId: context.userId } });
    return task?.status === "COMPLETED";
  },
};

export const reopenTaskTool: Tool<{ id: string }, { id: string; name: string; status: string }> = {
  name: "reopen_task",
  description: "Membuka kembali task yang sudah selesai menjadi sedang dikerjakan (IN_PROGRESS)",
  type: "WRITE",
  schema: z.object({
    id: z.string().min(1, "Task ID diperlukan"),
  }),
  async execute(input, context) {
    const exists = await prisma.task.findFirst({ where: { id: input.id, userId: context.userId } });
    if (!exists) {
      return {
        success: false,
        toolName: "reopen_task",
        type: "WRITE",
        message: "Task tidak ditemukan.",
        error: { code: "TASK_NOT_FOUND", message: "Task tidak ditemukan." },
      };
    }
    const reopened = await reopenTask(input.id, context.userId);
    return {
      success: true,
      toolName: "reopen_task",
      type: "WRITE",
      message: `Task "${reopened.name}" berhasil dibuka kembali.`,
      data: { id: reopened.id, name: reopened.name, status: reopened.status },
      verified: true,
    };
  },
};

export const deleteTaskTool: Tool<{ id: string }, { id: string; name: string }> = {
  name: "delete_task",
  description: "Menghapus task dari sistem (DESTRUKTIF)",
  type: "DESTRUCTIVE",
  schema: z.object({
    id: z.string().min(1, "Task ID diperlukan"),
  }),
  async execute(input, context) {
    const exists = await prisma.task.findFirst({ where: { id: input.id, userId: context.userId } });
    if (!exists) {
      return {
        success: false,
        toolName: "delete_task",
        type: "DESTRUCTIVE",
        message: "Task tidak ditemukan.",
        error: { code: "TASK_NOT_FOUND", message: "Task tidak ditemukan." },
      };
    }
    await deleteTask(input.id, context.userId);
    return {
      success: true,
      toolName: "delete_task",
      type: "DESTRUCTIVE",
      message: `Task "${exists.name}" berhasil dihapus.`,
      data: { id: exists.id, name: exists.name },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.id) return false;
    const found = await prisma.task.findFirst({ where: { id: result.data.id, userId: context.userId } });
    return !found;
  },
};

export const bulkDeleteTasksTool: Tool<
  { goalId?: string; stageId?: string; status?: string; taskIds?: string[] },
  { deletedCount: number; tasks: Array<{ id: string; name: string }> }
> = {
  name: "bulk_delete_tasks",
  description: "Menghapus beberapa task sekaligus berdasarkan filter atau daftar ID (DESTRUKTIF)",
  type: "DESTRUCTIVE",
  schema: z.object({
    goalId: z.string().optional(),
    stageId: z.string().optional(),
    status: z.string().optional(),
    taskIds: z.array(z.string()).optional(),
  }),
  async execute(input, context) {
    const targets = await prisma.task.findMany({
      where: {
        userId: context.userId,
        ...(input.taskIds ? { id: { in: input.taskIds } } : {}),
        ...(input.stageId ? { stageId: input.stageId } : {}),
        ...(input.goalId ? { stage: { goalId: input.goalId } } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
      select: { id: true, name: true },
    });

    if (targets.length === 0) {
      return {
        success: false,
        toolName: "bulk_delete_tasks",
        type: "DESTRUCTIVE",
        message: "Tidak ada task yang cocok dengan kriteria untuk dihapus.",
        error: { code: "NO_MATCHING_TASKS", message: "Tidak ada task yang cocok." },
      };
    }

    const ids = targets.map((t) => t.id);
    await prisma.task.deleteMany({
      where: {
        id: { in: ids },
        userId: context.userId,
      },
    });

    return {
      success: true,
      toolName: "bulk_delete_tasks",
      type: "DESTRUCTIVE",
      message: `${targets.length} task berhasil dihapus.`,
      data: {
        deletedCount: targets.length,
        tasks: targets,
      },
      verified: true,
    };
  },
  async verify(result, context) {
    if (!result.success || !result.data?.tasks?.length) return false;
    const remaining = await prisma.task.count({
      where: {
        id: { in: result.data.tasks.map((t) => t.id) },
        userId: context.userId,
      },
    });
    return remaining === 0;
  },
};

export const bulkCompleteTasksTool: Tool<
  { goalId?: string; stageId?: string; taskIds?: string[] },
  { completedCount: number; tasks: Array<{ id: string; name: string }> }
> = {
  name: "bulk_complete_tasks",
  description: "Menyelesaikan beberapa task sekaligus",
  type: "WRITE",
  schema: z.object({
    goalId: z.string().optional(),
    stageId: z.string().optional(),
    taskIds: z.array(z.string()).optional(),
  }),
  async execute(input, context) {
    const targets = await prisma.task.findMany({
      where: {
        userId: context.userId,
        status: { not: "COMPLETED" },
        ...(input.taskIds ? { id: { in: input.taskIds } } : {}),
        ...(input.stageId ? { stageId: input.stageId } : {}),
        ...(input.goalId ? { stage: { goalId: input.goalId } } : {}),
      },
      select: { id: true, name: true },
    });

    if (targets.length === 0) {
      return {
        success: false,
        toolName: "bulk_complete_tasks",
        type: "WRITE",
        message: "Tidak ada task aktif yang cocok untuk diselesaikan.",
        error: { code: "NO_MATCHING_TASKS", message: "Tidak ada task yang cocok." },
      };
    }

    const ids = targets.map((t) => t.id);
    await prisma.task.updateMany({
      where: { id: { in: ids }, userId: context.userId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return {
      success: true,
      toolName: "bulk_complete_tasks",
      type: "WRITE",
      message: `${targets.length} task berhasil ditandai selesai.`,
      data: {
        completedCount: targets.length,
        tasks: targets,
      },
      verified: true,
    };
  },
};
