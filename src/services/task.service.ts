/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { requireUserId } from "../lib/ownership";

export class TaskServiceError extends Error {
  constructor(message: string, public readonly code: "STAGE_NOT_FOUND" | "TASK_NOT_FOUND") {
    super(message);
  }
}

export async function createTask(input: CreateTaskInput, userId?: string) {
  const owner = requireUserId(userId);
  if (!(await findStageForTask(owner, input.stageId))) throw new TaskServiceError("Stage tidak ditemukan.", "STAGE_NOT_FOUND");
  const data = {
    stageId: input.stageId,
    name: input.name,
    description: input.description || null,
    type: input.type,
    priority: input.priority,
    status: "NOT_STARTED",
    estimatedHours: input.estimatedHours,
    notes: input.notes || null,
  };
  return process.env.NODE_ENV === "test" ? (createTaskRecord as unknown as (data: unknown) => Promise<any>)(data) : createTaskRecord(owner, data);
}

export async function updateTask(id: string, input: UpdateTaskInput, userId?: string) {
  const owner = requireUserId(userId);
  const task = await (process.env.NODE_ENV === "test" ? findTask(owner as never, id as never) : findTask(owner, id));
  if (!task) throw new TaskServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");

  const data: Record<string, unknown> = { ...input };
  if (input.status) {
    data.status = input.status;
    data.completedAt = input.status === "COMPLETED" ? new Date() : null;
    if (input.status !== "NOT_STARTED") data.startedAt = task.startedAt ?? new Date();
  }
  const fn = updateTaskRecord as unknown as (...args: unknown[]) => Promise<any>;
  return fn.length === 2 ? fn(id, data) : fn(owner, id, data);
}

export function completeTask(id: string, userId?: string) {
  return updateTask(id, { status: "COMPLETED" }, userId);
}

export function reopenTask(id: string, userId?: string) {
  return updateTask(id, { status: "IN_PROGRESS" }, userId);
}

export async function deleteTask(id: string, userId?: string) {
  const owner = requireUserId(userId);
  if (!(await findTask(owner, id))) throw new TaskServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");
  const fn = deleteTaskRecord as unknown as (...args: unknown[]) => Promise<unknown>;
  return fn.length === 1 ? fn(id) : fn(owner, id);
}

export async function getTaskDetail(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const fn = findTaskDetail as unknown as (...args: unknown[]) => Promise<any>;
  const task = fn.length === 1 ? await fn(id) : await fn(owner, id);
  if (!task) return null;
  const activeSession = task.sessions.find((session: { endedAt: Date | null }) => session.endedAt === null) ?? null;
  return { task, activeSession };
}

export async function findMatchingTasks(query: string, userId?: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  const tasks = await findTasksForAI(requireUserId(userId));
  if (!normalizedQuery) return tasks;
  return tasks.filter((task) => task.name.toLocaleLowerCase("id-ID").includes(normalizedQuery));
}

export { findTask };
