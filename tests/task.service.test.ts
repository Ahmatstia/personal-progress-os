import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  task: {
    id: "task-1",
    stageId: "stage-1",
    name: "Learn Pandas",
    status: "NOT_STARTED",
    startedAt: null as Date | null,
    completedAt: null as Date | null,
    sessions: [{ id: "session-1" }],
  },
  deleted: false,
}));

vi.mock("@/repositories/task.repository", () => ({
  findStageForTask: vi.fn(async () => ({ id: "stage-1", goalId: "goal-1", userId: "test-user" })),
  createTask: vi.fn(async (data: object) => ({ id: "task-new", ...data })),
  findTask: vi.fn(async () => state.task),
  updateTask: vi.fn(async (_id: string, data: Record<string, unknown>) => {
    Object.assign(state.task, data);
    return state.task;
  }),
  deleteTask: vi.fn(async () => { state.deleted = true; return state.task; }),
  findTaskDetail: vi.fn(async () => state.task),
}));

import {
  completeTask,
  createTask,
  deleteTask,
  getTaskDetail,
  reopenTask,
  updateTask,
} from "../src/services/task.service";
import { taskPrioritySchema, taskStatusSchema, updateTaskSchema } from "../src/schemas/task.schema";

describe("task.service", () => {
  beforeEach(() => {
    state.task.status = "NOT_STARTED";
    state.task.startedAt = null;
    state.task.completedAt = null;
    state.deleted = false;
  });

  it("creates a task with the default workflow status", async () => {
    const task = await createTask({ stageId: "stage-1", name: "New task", description: null, type: "TASK", priority: "HIGH", estimatedHours: 2, notes: null });
    expect(task).toMatchObject({ status: "TODO", priority: "HIGH" });
  });

  it("updates editable task fields", async () => {
    await updateTask("task-1", { name: "Updated", priority: "LOW", estimatedHours: 3 });
    expect(state.task).toMatchObject({ name: "Updated", priority: "LOW", estimatedHours: 3 });
  });

  it("does not default estimatedHours to 0 when omitted in updateTaskSchema", () => {
    const parsed = updateTaskSchema.safeParse({ name: "Keep Hours" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.estimatedHours).toBeUndefined();
    }
  });

  it("preserves estimatedHours during partial updates like status change", async () => {
    state.task = {
      ...state.task,
      name: "Task with hours",
      estimatedHours: 4.5,
    } as typeof state.task & { estimatedHours: number };

    await updateTask("task-1", { status: "IN_PROGRESS" });
    expect((state.task as typeof state.task & { estimatedHours: number }).estimatedHours).toBe(4.5);
  });

  it("completes a task and records completedAt", async () => {
    const task = await completeTask("task-1");
    expect(task.status).toBe("COMPLETED");
    expect(task.completedAt).toBeInstanceOf(Date);
  });

  it("reopens a completed task and clears completedAt", async () => {
    await completeTask("task-1");
    const task = await reopenTask("task-1");
    expect(task).toMatchObject({ status: "IN_PROGRESS", completedAt: null });
  });

  it("validates priority and status values", () => {
    expect(taskPrioritySchema.safeParse("INVALID").success).toBe(false);
    expect(taskStatusSchema.safeParse("DONE").success).toBe(false);
    expect(taskPrioritySchema.safeParse("URGENT").success).toBe(true);
    expect(taskPrioritySchema.safeParse("HIGH").success).toBe(true);
  });

  it("deletes a task through the repository", async () => {
    await deleteTask("task-1");
    expect(state.deleted).toBe(true);
  });

  it("keeps progress status-based and session history intact", async () => {
    const before = state.task.sessions;
    await completeTask("task-1");
    const detail = await getTaskDetail("task-1");
    expect(detail?.task.sessions).toBe(before);
    expect(detail?.task.status).toBe("COMPLETED");
  });
});
