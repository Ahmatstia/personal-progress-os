import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ focus: [] as unknown[], goals: [] as unknown[], sessions: [] as unknown[] }));
vi.mock("../src/repositories/today.repository", () => ({
  findTodayFocus: vi.fn(async () => state.focus),
  findTodayContext: vi.fn(async () => state.goals),
  findTodaySessions: vi.fn(async () => state.sessions),
  findTaskForFocus: vi.fn(),
  findFocusById: vi.fn(),
  createFocus: vi.fn(),
  deleteFocus: vi.fn(),
  updateFocus: vi.fn(),
}));

import { getToday, localDayBounds } from "../src/services/today.service";

const task = (id: string, status: string, completedAt: Date | null = null) => ({ id, stageId: "stage-1", name: id, status, priority: "MEDIUM", estimatedHours: 1, startedAt: null, createdAt: new Date("2026-09-01T00:00:00"), completedAt, stage: { goalId: "goal-1", name: "Stage", goal: { name: "Goal", targetDate: null } }, sessions: [] });

describe("today.service", () => {
  beforeEach(() => { state.focus = []; state.goals = []; state.sessions = []; });

  it("uses local start and end boundaries", () => {
    const bounds = localDayBounds(new Date("2026-09-07T12:34:00"));
    expect(bounds.start.getHours()).toBe(0);
    expect(bounds.end.getHours()).toBe(23);
  });

  it("counts completed tasks and excludes completed focus from active focus", async () => {
    const completed = task("done", "COMPLETED", new Date("2026-09-07T10:00:00"));
    const active = task("active", "IN_PROGRESS");
    state.goals = [{ id: "goal-1", stages: [{ tasks: [completed, active] }] }];
    state.focus = [{ id: "focus-1", taskId: "done", order: 0, task: completed }, { id: "focus-2", taskId: "active", order: 1, task: active }];
    const result = await getToday(new Date("2026-09-07T12:00:00"));
    expect(result.completedTasks).toHaveLength(1);
    expect(result.focusTasks).toHaveLength(1);
    expect(result.focusCompleted).toBe(1);
  });

  it("returns empty safe stats without fake activity", async () => {
    const result = await getToday(new Date("2026-09-07T12:00:00"));
    expect(result.stats).toMatchObject({ totalSessions: 0, totalMinutes: 0, completedTasks: 0 });
    expect(result.nextAction).toBeNull();
  });
});
