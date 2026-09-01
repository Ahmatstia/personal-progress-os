import { describe, expect, it } from "vitest";
import { buildAnalytics } from "../src/services/analytics.service";

const session = (id: string, date: string, durationMinutes: number, understanding = 4) => ({
  id,
  startedAt: new Date(`${date}T09:00:00`),
  endedAt: new Date(`${date}T10:00:00`),
  durationMinutes,
  understanding,
  obstacle: null,
});

const tasks = [
  {
    id: "completed", name: "Ship feature", status: "COMPLETED", estimatedHours: 2, actualHours: 3,
    createdAt: new Date("2026-08-01T00:00:00"), updatedAt: new Date("2026-09-03T00:00:00"), completedAt: new Date("2026-09-01T11:00:00"),
    sessions: [session("s1", "2026-09-01", 60)],
  },
  {
    id: "blocked", name: "Learn arrays", status: "IN_PROGRESS", estimatedHours: 2, actualHours: 4,
    createdAt: new Date("2026-08-01T00:00:00"), updatedAt: new Date("2026-09-03T00:00:00"), completedAt: null,
    sessions: [session("s2", "2026-09-01", 60), session("s3", "2026-09-02", 60), session("s4", "2026-09-03", 60)],
  },
];

const period = { start: new Date("2026-09-01T00:00:00"), end: new Date("2026-09-07T23:59:59") };

describe("analytics.service", () => {
  it("calculates hours, completed tasks, rate, and average session duration", () => {
    const result = buildAnalytics([{ id: "goal-1", stages: [{ tasks }] }], period.start, period.end);
    expect(result.summary).toMatchObject({ totalHours: 4, completedTasks: 1, completionRate: 50, averageSessionMinutes: 60 });
  });

  it("calculates active days, consistency, and streaks", () => {
    const result = buildAnalytics([{ id: "goal-1", stages: [{ tasks }] }], period.start, period.end);
    expect(result.summary).toMatchObject({ activeDays: 3, daysInPeriod: 7, consistency: 42.9, currentStreak: 0, longestStreak: 3 });
  });

  it("produces daily learning and completion trends", () => {
    const result = buildAnalytics([{ id: "goal-1", stages: [{ tasks }] }], period.start, period.end);
    expect(result.trends).toHaveLength(7);
    expect(result.trends[0]).toMatchObject({ date: "2026-09-01", learningHours: 2, completedTasks: 1 });
    expect(result.trends[1]).toMatchObject({ date: "2026-09-02", learningHours: 1, completedTasks: 0 });
  });

  it("detects a high time-to-estimate bottleneck", () => {
    const result = buildAnalytics([{ id: "goal-1", stages: [{ tasks }] }], period.start, period.end);
    expect(result.bottlenecks[0]).toMatchObject({ taskId: "blocked", severity: "HIGH" });
  });

  it("handles empty data without division errors or fake bottlenecks", () => {
    const result = buildAnalytics([], period.start, period.end);
    expect(result.summary).toMatchObject({ totalHours: 0, completionRate: 0, consistency: 0, averageSessionMinutes: 0, averageUnderstanding: null });
    expect(result.bottlenecks).toEqual([]);
    expect(result.trends.every((item) => item.learningHours === 0 && item.completedTasks === 0)).toBe(true);
  });
});
