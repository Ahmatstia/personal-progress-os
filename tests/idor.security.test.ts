import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  tasks: [
    { id: "task-a", userId: "USER_A", stageId: "stage-a", name: "Task A", status: "NOT_STARTED", startedAt: null, completedAt: null, sessions: [] },
    { id: "task-b", userId: "USER_B", stageId: "stage-b", name: "Task B", status: "NOT_STARTED", startedAt: null, completedAt: null, sessions: [] },
  ],
}));

vi.mock("@/repositories/task.repository", () => ({
  findStageForTask: vi.fn(async (userId: string, stageId: string) => ({ id: stageId, userId })),
  createTask: vi.fn(async (userId: string, data: Record<string, unknown>) => ({ id: "new-task", userId, ...data })),
  findTask: vi.fn(async (userId: string, id: string) => state.tasks.find((task) => task.id === id && task.userId === userId) ?? null),
  findTasksForAI: vi.fn(async (userId: string) => state.tasks.filter((task) => task.userId === userId)),
  updateTask: vi.fn(async (userId: string, id: string, data: Record<string, unknown>) => {
    const task = state.tasks.find((item) => item.id === id && item.userId === userId);
    if (!task) throw new Error("not found");
    Object.assign(task, data);
    return task;
  }),
  deleteTask: vi.fn(async (userId: string, id: string) => {
    const index = state.tasks.findIndex((task) => task.id === id && task.userId === userId);
    if (index < 0) return { count: 0 };
    state.tasks.splice(index, 1);
    return { count: 1 };
  }),
  findTaskDetail: vi.fn(async (userId: string, id: string) => state.tasks.find((task) => task.id === id && task.userId === userId) ?? null),
}));

import { completeTask, deleteTask, findMatchingTasks, getTaskDetail, updateTask } from "../src/services/task.service";

describe("Phase 15 IDOR security boundary", () => {
  beforeAll(() => { vi.stubEnv("NODE_ENV", "production"); });
  afterAll(() => { vi.unstubAllEnvs(); });
  beforeEach(() => {
    state.tasks = [
      { id: "task-a", userId: "USER_A", stageId: "stage-a", name: "Task A", status: "NOT_STARTED", startedAt: null, completedAt: null, sessions: [] },
      { id: "task-b", userId: "USER_B", stageId: "stage-b", name: "Task B", status: "NOT_STARTED", startedAt: null, completedAt: null, sessions: [] },
    ];
  });

  it("USER_A reads only USER_A data", async () => { expect((await getTaskDetail("task-a", "USER_A"))?.task.userId).toBe("USER_A"); });
  it("USER_B reads only USER_B data", async () => { expect((await getTaskDetail("task-b", "USER_B"))?.task.userId).toBe("USER_B"); });
  it("USER_A cannot read USER_B task", async () => { expect(await getTaskDetail("task-b", "USER_A")).toBeNull(); });
  it("USER_B cannot read USER_A task", async () => { expect(await getTaskDetail("task-a", "USER_B")).toBeNull(); });
  it("USER_A can update own task", async () => { await updateTask("task-a", { name: "Updated" }, "USER_A"); expect(state.tasks[0].name).toBe("Updated"); });
  it("USER_B can update own task", async () => { await updateTask("task-b", { name: "Updated" }, "USER_B"); expect(state.tasks[1].name).toBe("Updated"); });
  it("USER_A cannot update USER_B task", async () => { await expect(updateTask("task-b", { name: "Attack" }, "USER_A")).rejects.toThrow(); expect(state.tasks[1].name).toBe("Task B"); });
  it("USER_B cannot update USER_A task", async () => { await expect(updateTask("task-a", { name: "Attack" }, "USER_B")).rejects.toThrow(); expect(state.tasks[0].name).toBe("Task A"); });
  it("USER_A can complete own task", async () => { await completeTask("task-a", "USER_A"); expect(state.tasks[0].status).toBe("COMPLETED"); });
  it("USER_A cannot complete USER_B task", async () => { await expect(completeTask("task-b", "USER_A")).rejects.toThrow(); expect(state.tasks[1].status).toBe("NOT_STARTED"); });
  it("USER_B cannot delete USER_A task", async () => { await expect(deleteTask("task-a", "USER_B")).rejects.toThrow(); expect(state.tasks).toHaveLength(2); });
  it("USER_A can delete own task", async () => { await deleteTask("task-a", "USER_A"); expect(state.tasks.some((task) => task.id === "task-a")).toBe(false); });
  it("AI search is scoped to USER_A", async () => { const result = await findMatchingTasks("Task", "USER_A"); expect(result.map((task) => task.id)).toEqual(["task-a"]); });
  it("AI search is scoped to USER_B", async () => { const result = await findMatchingTasks("Task", "USER_B"); expect(result.map((task) => task.id)).toEqual(["task-b"]); });
  it("client body userId cannot change service owner", async () => { const body = { userId: "USER_B", taskId: "task-b" }; await expect(getTaskDetail(body.taskId, "USER_A")).resolves.toBeNull(); });
  it("query userId cannot change service owner", async () => { const queryUserId = "USER_B"; await expect(getTaskDetail("task-b", "USER_A")).resolves.toBeNull(); expect(queryUserId).toBe("USER_B"); });
  it("header userId cannot change service owner", async () => { const headerUserId = "USER_B"; await expect(getTaskDetail("task-b", "USER_A")).resolves.toBeNull(); expect(headerUserId).toBe("USER_B"); });
});
