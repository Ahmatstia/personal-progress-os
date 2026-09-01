import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  task: { id: "task-1", status: "NOT_STARTED", startedAt: null as Date | null },
  active: null as { id: string; taskId: string; startedAt: Date; endedAt: Date | null } | null,
  history: [] as unknown[],
  actualHours: 0,
}));

vi.mock("@/repositories/session.repository", () => ({
  createSession: vi.fn(async (taskId: string) => {
    state.active = { id: "session-1", taskId, startedAt: new Date(), endedAt: null };
    state.history.unshift(state.active);
    return state.active;
  }),
  findActiveSessionByTaskId: vi.fn(async () => state.active),
  findSessionById: vi.fn(async () => state.active),
  findSessionsByTaskId: vi.fn(async () => state.history),
  endSession: vi.fn(async (_id: string, data: { endedAt: Date; durationMinutes: number }) => {
    if (!state.active) return null;
    state.active = { ...state.active, ...data };
    state.history[0] = state.active;
    return state.active;
  }),
  sumCompletedSessionMinutes: vi.fn(async () => ({ _sum: { durationMinutes: 90 } })),
  updateTaskActualHours: vi.fn(async (_taskId: string, hours: number) => {
    state.actualHours = hours;
  }),
  findTaskForSession: vi.fn(async () => state.task),
  markTaskInProgress: vi.fn(async (_taskId: string, startedAt: Date) => {
    state.task.status = "IN_PROGRESS";
    state.task.startedAt = startedAt;
  }),
}));

import {
  calculateDuration,
  endSession,
  getActiveSession,
  getSessionHistory,
  startSession,
  updateTaskActualHours,
} from "../src/services/session.service";
import { endSessionSchema } from "../src/schemas/session.schema";

describe("session.service", () => {
  beforeEach(() => {
    state.task.status = "NOT_STARTED";
    state.task.startedAt = null;
    state.active = null;
    state.history.length = 0;
    state.actualHours = 0;
  });

  it("starts a session and moves a new task to in progress", async () => {
    const session = await startSession("task-1");
    expect(session.id).toBe("session-1");
    expect(state.task.status).toBe("IN_PROGRESS");
  });

  it("rejects a duplicate active session", async () => {
    await startSession("task-1");
    await expect(startSession("task-1")).rejects.toMatchObject({
      code: "ACTIVE_SESSION_EXISTS",
    });
  });

  it("returns active sessions and retained history", async () => {
    await startSession("task-1");
    expect(await getActiveSession("task-1")).not.toBeNull();
    expect(await getSessionHistory("task-1")).toHaveLength(1);
  });

  it("calculates duration from timestamps", () => {
    expect(calculateDuration(new Date("2026-09-01T10:00:00Z"), new Date("2026-09-01T10:45:00Z"))).toBe(45);
    expect(calculateDuration(new Date("2026-09-01T11:00:00Z"), new Date("2026-09-01T10:00:00Z"))).toBe(0);
  });

  it("ends a session using server duration and updates actual hours", async () => {
    await startSession("task-1");
    const completed = await endSession("session-1", { sessionId: "session-1", understanding: 4 });
    expect(completed.endedAt).toBeInstanceOf(Date);
    expect(completed.durationMinutes).toBeGreaterThanOrEqual(0);
    expect(await updateTaskActualHours("task-1")).toBe(1.5);
    expect(state.actualHours).toBe(1.5);
  });

  it("rejects invalid understanding", () => {
    expect(endSessionSchema.safeParse({ sessionId: "session-1", understanding: 6 }).success).toBe(false);
    expect(endSessionSchema.safeParse({ sessionId: "session-1", understanding: 2 }).success).toBe(true);
  });

  it("rejects ending a completed session twice", async () => {
    await startSession("task-1");
    await endSession("session-1", { sessionId: "session-1" });
    await expect(endSession("session-1", { sessionId: "session-1" })).rejects.toMatchObject({
      code: "SESSION_ALREADY_ENDED",
    });
  });
});
