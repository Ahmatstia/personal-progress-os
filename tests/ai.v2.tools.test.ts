import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  goals: [
    { id: "g1", userId: "test-user", name: "Belajar TypeScript", type: "LEARNING", description: "Goal 1" },
  ],
  stages: [
    { id: "s1", userId: "test-user", goalId: "g1", name: "Dasar", description: "Stage 1", order: 0 },
  ],
  tasks: [
    { id: "t1", userId: "test-user", stageId: "s1", name: "Type System", status: "NOT_STARTED", priority: "HIGH", estimatedHours: 2, actualHours: 0 },
  ],
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    goal: {
      create: vi.fn(async ({ data }: any) => {
        const item = { id: `g-${Date.now()}`, ...data };
        state.goals.push(item);
        return item;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return state.goals.find((g) => (!where.id || g.id === where.id) && g.userId === where.userId) ?? null;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return state.goals.filter((g) => g.userId === where.userId);
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const item = state.goals.find((g) => g.id === where.id);
        if (item) Object.assign(item, data);
        return item;
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        state.goals = state.goals.filter((g) => g.id !== where.id);
        return { count: 1 };
      }),
    },
    stage: {
      create: vi.fn(async ({ data }: any) => {
        const item = { id: `s-${Date.now()}`, ...data };
        state.stages.push(item);
        return item;
      }),
      count: vi.fn(async () => state.stages.length),
      findFirst: vi.fn(async ({ where }: any) => {
        return state.stages.find((s) => (!where.id || s.id === where.id) && s.userId === where.userId) ?? null;
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return state.stages.filter((s) => s.userId === where.userId);
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const item = state.stages.find((s) => s.id === where.id);
        if (item) Object.assign(item, data);
        return { count: 1 };
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        state.stages = state.stages.filter((s) => s.id !== where.id);
        return { count: 1 };
      }),
    },
    task: {
      create: vi.fn(async ({ data }: any) => {
        const item = { id: `t-${Date.now()}`, ...data };
        state.tasks.push(item);
        return item;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        return state.tasks.find((t) => !where?.id || t.id === where.id) ?? null;
      }),
      findFirstOrThrow: vi.fn(async ({ where }: any) => {
        return state.tasks.find((t) => !where?.id || t.id === where.id) ?? state.tasks[0] ?? { id: "t1", status: "COMPLETED", name: "Type System" };
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return state.tasks.filter((t) => !where?.userId || t.userId === where.userId);
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const item = state.tasks.find((t) => !where?.id || t.id === where.id);
        if (item) Object.assign(item, data);
        return item ?? state.tasks[0];
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        state.tasks.forEach((t) => {
          if (!where?.id || where.id?.in?.includes(t.id) || t.id === where.id) {
            Object.assign(t, data);
          }
        });
        return { count: 1 };
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        const count = state.tasks.length;
        state.tasks = state.tasks.filter((t) => t.id !== where.id);
        return { count: count - state.tasks.length };
      }),
      count: vi.fn(async ({ where }: any) => {
        if (where?.id?.in) {
          return state.tasks.filter((t) => where.id.in.includes(t.id) && t.userId === where.userId).length;
        }
        return state.tasks.filter((t) => t.userId === where.userId).length;
      }),
    },
  },
}));

import { executeTool, toolRegistry } from "../src/ai/tools/registry";

describe("AI V2 Tool System & Validation", () => {
  beforeEach(() => {
    state.goals = [{ id: "g1", userId: "test-user", name: "Belajar TypeScript", type: "LEARNING", description: "Goal 1" }];
    state.stages = [{ id: "s1", userId: "test-user", goalId: "g1", name: "Dasar", description: "Stage 1", order: 0 }];
    state.tasks = [{ id: "t1", userId: "test-user", stageId: "s1", name: "Type System", status: "NOT_STARTED", priority: "HIGH", estimatedHours: 2, actualHours: 0 }];
  });

  it("contains all registered typed tools", () => {
    expect(toolRegistry.create_goal).toBeDefined();
    expect(toolRegistry.create_stage).toBeDefined();
    expect(toolRegistry.create_task).toBeDefined();
    expect(toolRegistry.complete_task).toBeDefined();
    expect(toolRegistry.delete_task).toBeDefined();
    expect(toolRegistry.bulk_delete_tasks).toBeDefined();
    expect(toolRegistry.get_progress).toBeDefined();
  });

  it("rejects unregistered tool dispatch", async () => {
    const result = await executeTool("invalid_tool_name", {}, { userId: "test-user" });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("TOOL_NOT_FOUND");
  });

  it("validates input arguments according to Zod schema", async () => {
    const result = await executeTool("create_goal", { name: "" }, { userId: "test-user" });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("INVALID_TOOL_ARGUMENTS");
  });

  it("executes create_goal and verifies state", async () => {
    const result = await executeTool<{ name: string; type: string }, { id: string; name: string }>("create_goal", { name: "Master Next.js", type: "LEARNING" }, { userId: "test-user" });
    expect(result.success).toBe(true);
    expect((result.data as any).name).toBe("Master Next.js");
    expect(result.verified).toBe(true);
  });

  it("executes create_stage on existing goal", async () => {
    const result = await executeTool("create_stage", { goalId: "g1", name: "Generics" }, { userId: "test-user" });
    expect(result.success).toBe(true);
    expect((result.data as any).name).toBe("Generics");
  });

  it("executes complete_task and verifies status update", async () => {
    const result = await executeTool("complete_task", { id: "t1" }, { userId: "test-user" });
    expect(result.success).toBe(true);
    expect((result.data as any).status).toBe("COMPLETED");
  });
});
