import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  goals: [
    { id: "goal-py", userId: "user-1", name: "Belajar Python", type: "LEARNING", description: "Python Master" },
    { id: "goal-react", userId: "user-1", name: "Belajar React", type: "LEARNING", description: "React Master" },
  ],
  stages: [
    { id: "stage-py-1", userId: "user-1", goalId: "goal-py", name: "Dasar Python", description: "Syntax dasar", order: 0 },
  ],
  tasks: [
    { id: "task-func", userId: "user-1", stageId: "stage-py-1", name: "Belajar Function Python", status: "NOT_STARTED", priority: "HIGH", estimatedHours: 2, actualHours: 0, sessions: [] },
    { id: "task-loop", userId: "user-1", stageId: "stage-py-1", name: "Latihan Loop Python", status: "COMPLETED", priority: "MEDIUM", estimatedHours: 1, actualHours: 1, sessions: [] },
    { id: "task-class", userId: "user-1", stageId: "stage-py-1", name: "Latihan Class Python", status: "COMPLETED", priority: "MEDIUM", estimatedHours: 1, actualHours: 1, sessions: [] },
  ],
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    goal: {
      create: vi.fn(async ({ data }: any) => {
        const item = { id: `goal-${Date.now()}`, ...data };
        dbState.goals.push(item);
        return item;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return dbState.goals.find((g) => (!where.id || g.id === where.id) && g.userId === where.userId) ?? null;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return dbState.goals.filter((g) => g.userId === where.userId);
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        dbState.goals = dbState.goals.filter((g) => g.id !== where.id);
        return { count: 1 };
      }),
    },
    stage: {
      create: vi.fn(async ({ data }: any) => {
        const item = { id: `stage-${Date.now()}`, ...data };
        dbState.stages.push(item);
        return item;
      }),
      count: vi.fn(async () => dbState.stages.length),
      findFirst: vi.fn(async ({ where }: any) => {
        return dbState.stages.find((s) => (!where.id || s.id === where.id) && s.userId === where.userId) ?? null;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return dbState.stages.filter((s) => s.userId === where.userId);
      }),
    },
    task: {
      create: vi.fn(async ({ data }: any) => {
        const item = { id: `task-${Date.now()}`, ...data };
        dbState.tasks.push(item);
        return item;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return dbState.tasks.find((t) => (!where.id || t.id === where.id) && t.userId === where.userId) ?? null;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return dbState.tasks.filter((t) => {
          if (t.userId !== where.userId) return false;
          if (where.status && t.status !== where.status) return false;
          if (where.stageId && t.stageId !== where.stageId) return false;
          return true;
        }).map((t) => ({
          ...t,
          stage: {
            name: "Dasar Python",
            goal: { name: "Belajar Python" },
          },
        }));
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const item = dbState.tasks.find((t) => t.id === where.id);
        if (item) Object.assign(item, data);
        return item;
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        dbState.tasks.forEach((t) => {
          if (where.id?.in?.includes(t.id) || t.id === where.id) Object.assign(t, data);
        });
        return { count: 1 };
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        if (where.id?.in) {
          dbState.tasks = dbState.tasks.filter((t) => !where.id.in.includes(t.id));
        } else if (where.id) {
          dbState.tasks = dbState.tasks.filter((t) => t.id !== where.id);
        }
        return { count: 1 };
      }),
    },
  },
}));

vi.mock("@/services/goal.service", () => ({
  createGoal: vi.fn(async (input: any, userId: string) => {
    const item = { id: `g-${Date.now()}`, name: input.name, type: input.type ?? "LEARNING", userId };
    dbState.goals.push(item as any);
    return item;
  }),
  deleteGoal: vi.fn(async (id: string, userId: string) => {
    dbState.goals = dbState.goals.filter((g) => g.id !== id);
    return { count: 1 };
  }),
}));

vi.mock("@/services/task.service", () => ({
  createTask: vi.fn(async (input: any, userId: string) => {
    const item = { id: `t-${Date.now()}`, name: input.name, status: "NOT_STARTED", priority: input.priority, userId, stageId: input.stageId };
    dbState.tasks.push(item as any);
    return item;
  }),
  findMatchingTasks: vi.fn(async (query: string, userId: string) => {
    return dbState.tasks.filter((t) => t.userId === userId && (!query || t.name.toLowerCase().includes(query.toLowerCase())));
  }),
  findTask: vi.fn(async (userId: string, id: string) => {
    return dbState.tasks.find((t) => t.id === id && t.userId === userId) ?? null;
  }),
  getTaskDetail: vi.fn(async (id: string, userId: string) => {
    const t = dbState.tasks.find((task) => task.id === id && task.userId === userId);
    return t ? { task: { ...t, stage: { goal: { name: "Belajar Python" }, name: "Dasar" }, sessions: [] }, activeSession: null } : null;
  }),
  completeTask: vi.fn(async (id: string, userId: string) => {
    const t = dbState.tasks.find((task) => task.id === id && task.userId === userId);
    if (t) t.status = "COMPLETED";
    return t ?? { name: "Task" };
  }),
  reopenTask: vi.fn(async (id: string, userId: string) => {
    const t = dbState.tasks.find((task) => task.id === id && task.userId === userId);
    if (t) t.status = "IN_PROGRESS";
    return t ?? { name: "Task" };
  }),
  deleteTask: vi.fn(async (id: string, userId: string) => {
    dbState.tasks = dbState.tasks.filter((t) => t.id !== id || t.userId !== userId);
    return { count: 1 };
  }),
}));

vi.mock("@/services/session.service", () => ({
  startSession: vi.fn(async (taskId: string, userId: string) => ({ id: "sess-1", taskId, startedAt: new Date() })),
  endSession: vi.fn(async (sessionId: string, data: any, userId: string) => ({ id: sessionId, durationMinutes: 25 })),
  getAnyActiveSession: vi.fn(async () => null),
}));

vi.mock("@/services/today.service", () => ({
  getToday: vi.fn(async () => ({
    focusTasks: [],
    overdueTasks: [],
    nextAction: { taskId: "t1", taskName: "Belajar Function Python", goalName: "Belajar Python", stageName: "Dasar" },
    stats: { totalMinutes: 60, completedTasks: 2 },
  })),
  addTodayFocus: vi.fn(async (taskId: string) => ({ id: `f-${Date.now()}`, taskId })),
}));

vi.mock("@/services/analytics.service", () => ({
  getDashboardAnalytics: vi.fn(async () => ({
    summary: { completionRate: 75, totalMinutes: 120, completedTasks: 3, currentStreak: 5, daysInPeriod: 30 },
    bottlenecks: [],
  })),
  getGoalAnalytics: vi.fn(async () => ({
    goal: { name: "Belajar Python" },
    summary: { completionRate: 60, totalMinutes: 90, completedTasks: 2 },
  })),
}));

vi.mock("@/services/review.service", () => ({
  getGoalReviewPageData: vi.fn(async () => ({ goal: { name: "Belajar Python" }, review: null })),
}));

import { executeAICommand } from "../src/services/ai-command.service";
import { clearConversationContext } from "../src/ai/context/conversation-state";

describe("AI Agent V2 Foundation Master Test Suite", () => {
  beforeEach(() => {
    clearConversationContext("user-1");
  });

  it("understands varied natural language requests for GOAL_CREATE", async () => {
    const res1 = await executeAICommand({ text: "tolong buatkan goal belajar python" }, "user-1");
    expect(res1.interpretation.intent).toBe("GOAL_CREATE");
    expect(res1.requiresConfirmation).toBe(true);

    const res2 = await executeAICommand({ text: "saya mau bikin goal baru untuk belajar python" }, "user-1");
    expect(res2.interpretation.intent).toBe("GOAL_CREATE");
  });

  it("understands natural language variations for TASK_DELETE with confirmation gating", async () => {
    const res = await executeAICommand({ text: "hapus task belajar function" }, "user-1");
    expect(res.interpretation.intent).toBe("TASK_DELETE");
    expect(res.requiresConfirmation).toBe(true);
    expect(res.confirmationToken).toBeDefined();
  });

  it("resolves tasks fuzzily when user does not specify exact full title", async () => {
    const issued = await executeAICommand({ text: "selesaikan task function python" }, "user-1");
    expect(issued.requiresConfirmation).toBe(true);

    const confirmed = await executeAICommand({
      text: "selesaikan task function python",
      confirmed: true,
      confirmationToken: issued.confirmationToken,
      context: { taskName: "function python" },
    }, "user-1");

    expect(confirmed.success).toBe(true);
    expect(confirmed.code).toBe("UPDATED");
  });

  it("handles multi-step commands and builds sequential execution plan", async () => {
    const res = await executeAICommand({
      text: "buat goal belajar python lalu buat stage dasar dan buatkan 3 task pertama",
    }, "user-1");

    expect(res.interpretation.intent).toBe("MULTI_STEP");
    expect(res.requiresConfirmation).toBe(true);
  });

  it("executes bulk delete operation on completed tasks with confirmation", async () => {
    const issued = await executeAICommand({
      text: "hapus semua task yang selesai di goal python",
    }, "user-1");

    expect(issued.interpretation.intent).toBe("TASK_BULK_DELETE");
    expect(issued.requiresConfirmation).toBe(true);

    const confirmed = await executeAICommand({
      text: "hapus semua task yang selesai di goal python",
      confirmed: true,
      confirmationToken: issued.confirmationToken,
    }, "user-1");

    expect(confirmed.success).toBe(true);
    expect(confirmed.code).toBe("DELETED");
  });
});
