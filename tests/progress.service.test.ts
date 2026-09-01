import { describe, expect, it } from "vitest";
import {
  calculateGoalProgress,
  calculateSessionDurationMinutes,
  calculateStageProgress,
  calculateTaskProgress,
  selectNextAction,
} from "../src/services/progress.service";

describe("progress.service", () => {
  it("calculates task, stage, and goal progress", () => {
    expect(calculateTaskProgress("COMPLETED")).toBe(100);
    expect(calculateTaskProgress("NOT_STARTED")).toBe(0);

    expect(
      calculateStageProgress([
        { status: "COMPLETED" },
        { status: "COMPLETED" },
        { status: "NOT_STARTED" },
      ]),
    ).toBe(67);

    expect(
      calculateGoalProgress([
        {
          tasks: [{ status: "COMPLETED" }, { status: "NOT_STARTED" }],
        },
        {
          tasks: [{ status: "COMPLETED" }, { status: "COMPLETED" }],
        },
      ]),
    ).toBe(75);
  });

  it("calculates session duration safely", () => {
    expect(
      calculateSessionDurationMinutes(
        new Date("2026-09-01T10:00:00.000Z"),
        new Date("2026-09-01T10:45:00.000Z"),
      ),
    ).toBe(45);

    expect(
      calculateSessionDurationMinutes(
        new Date("2026-09-01T10:45:00.000Z"),
        new Date("2026-09-01T10:00:00.000Z"),
      ),
    ).toBe(0);
  });

  it("selects the best next unfinished task", () => {
    const nextAction = selectNextAction([
      {
        id: "done",
        goalId: "goal-1",
        stageId: "stage-1",
        name: "Completed task",
        status: "COMPLETED",
        priority: "HIGH",
        estimatedHours: 1,
        goalName: "Goal",
        stageName: "Stage",
        createdAt: new Date("2026-09-01T08:00:00.000Z"),
        startedAt: null,
      },
      {
        id: "queued",
        goalId: "goal-1",
        stageId: "stage-1",
        name: "Queued task",
        status: "NOT_STARTED",
        priority: "HIGH",
        estimatedHours: 2,
        goalName: "Goal",
        stageName: "Stage",
        createdAt: new Date("2026-09-01T09:00:00.000Z"),
        startedAt: null,
      },
      {
        id: "active",
        goalId: "goal-1",
        stageId: "stage-1",
        name: "Active task",
        status: "IN_PROGRESS",
        priority: "LOW",
        estimatedHours: 4,
        goalName: "Goal",
        stageName: "Stage",
        createdAt: new Date("2026-09-01T07:00:00.000Z"),
        startedAt: new Date("2026-09-01T07:15:00.000Z"),
      },
    ]);

    expect(nextAction).toMatchObject({
      taskId: "active",
      goalId: "goal-1",
      stageId: "stage-1",
      taskName: "Active task",
      goalName: "Goal",
      stageName: "Stage",
    });
  });
});
