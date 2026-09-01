import {
  createTask as createTaskRecord,
  deleteTask as deleteTaskRecord,
  findStageForTask,
  findTask,
  findTaskDetail,
  findTasksForAI,
  updateTask as updateTaskRecord,
} from "@/repositories/task.repository";
import type { CreateTaskInput, UpdateTaskInput } from "@/schemas/task.schema";

export class TaskServiceError extends Error {
  constructor(message: string, public readonly code: "STAGE_NOT_FOUND" | "TASK_NOT_FOUND") {
    super(message);
  }
}

export async function createTask(input: CreateTaskInput, userId?: string) {
  if (!(await findStageForTask(input.stageId, userId))) throw new TaskServiceError("Stage tidak ditemukan.", "STAGE_NOT_FOUND");
  return createTaskRecord({
    stageId: input.stageId,
    name: input.name,
    description: input.description || null,
    type: input.type,
    priority: input.priority,
    status: "NOT_STARTED",
    estimatedHours: input.estimatedHours,
    notes: input.notes || null,
    ...(userId ? { userId } : {}),
  });
}

export async function updateTask(id: string, input: UpdateTaskInput, userId?: string) {
  const task = await findTask(id, userId);
  if (!task) throw new TaskServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");

  const data: Record<string, unknown> = { ...input };
  delete data.status;
  if (input.status) {
    data.status = input.status;
    data.completedAt = input.status === "COMPLETED" ? new Date() : null;
    if (input.status !== "NOT_STARTED") data.startedAt = task.startedAt ?? new Date();
  }
  return updateTaskRecord(id, data, userId);
}

export function completeTask(id: string) {
  return updateTask(id, { status: "COMPLETED" });
}

export function reopenTask(id: string) {
  return updateTask(id, { status: "IN_PROGRESS" });
}

export async function deleteTask(id: string, userId?: string) {
  if (!(await findTask(id, userId))) throw new TaskServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");
  return deleteTaskRecord(id, userId);
}

export async function getTaskDetail(id: string, userId?: string) {
  const task = await findTaskDetail(id, userId);
  if (!task) return null;
  const activeSession = task.sessions.find((session) => session.endedAt === null) ?? null;
  return { task, activeSession };
}

export async function findMatchingTasks(query: string, userId?: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  const tasks = await findTasksForAI(userId);
  if (!normalizedQuery) return tasks;
  return tasks.filter((task) => task.name.toLocaleLowerCase("id-ID").includes(normalizedQuery));
}

export { findTask };
