import {
  createTask as createTaskRecord,
  deleteTask as deleteTaskRecord,
  findStageForTask,
  findTask,
  findTaskDetail,
  updateTask as updateTaskRecord,
} from "@/repositories/task.repository";
import type { CreateTaskInput, UpdateTaskInput } from "@/schemas/task.schema";

export class TaskServiceError extends Error {
  constructor(message: string, public readonly code: "STAGE_NOT_FOUND" | "TASK_NOT_FOUND") {
    super(message);
  }
}

export async function createTask(input: CreateTaskInput) {
  if (!(await findStageForTask(input.stageId))) throw new TaskServiceError("Stage tidak ditemukan.", "STAGE_NOT_FOUND");
  return createTaskRecord({
    stageId: input.stageId,
    name: input.name,
    description: input.description || null,
    type: input.type,
    priority: input.priority,
    status: "NOT_STARTED",
    estimatedHours: input.estimatedHours,
    notes: input.notes || null,
  });
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const task = await findTask(id);
  if (!task) throw new TaskServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");

  const data: Record<string, unknown> = { ...input };
  delete data.status;
  if (input.status) {
    data.status = input.status;
    data.completedAt = input.status === "COMPLETED" ? new Date() : null;
    if (input.status !== "NOT_STARTED") data.startedAt = task.startedAt ?? new Date();
  }
  return updateTaskRecord(id, data);
}

export function completeTask(id: string) {
  return updateTask(id, { status: "COMPLETED" });
}

export function reopenTask(id: string) {
  return updateTask(id, { status: "IN_PROGRESS" });
}

export async function deleteTask(id: string) {
  if (!(await findTask(id))) throw new TaskServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");
  return deleteTaskRecord(id);
}

export async function getTaskDetail(id: string) {
  const task = await findTaskDetail(id);
  if (!task) return null;
  const activeSession = task.sessions.find((session) => session.endedAt === null) ?? null;
  return { task, activeSession };
}
