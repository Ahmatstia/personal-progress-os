/* eslint-disable @typescript-eslint/no-explicit-any */
import { findAnalyticsGoals } from "../repositories/analytics.repository";
import type { AnalyticsQuery } from "../schemas/analytics.schema";
import { requireUserId } from "../lib/ownership";

type Session = { id: string; startedAt: Date; endedAt: Date | null; durationMinutes: number | null; understanding: number | null; obstacle: string | null };
type Task = { id: string; title: string; name?: string; status: string; estimatedHours: number; actualHours: number; createdAt: Date; updatedAt: Date; completedAt: Date | null; sessions: Session[] };
type Goal = { id: string; stages: { tasks: Task[] }[] };

export type AnalyticsTrend = { date: string; learningMinutes: number; learningHours: number; completedTasks: number };
export type Bottleneck = { taskId: string; taskName: string; reason: string; severity: "LOW" | "MEDIUM" | "HIGH" };
export type AnalyticsSummary = {
  totalMinutes: number; totalHours: number; completedTasks: number; activeTasks: number; completionRate: number; sessions: number;
  averageSessionMinutes: number; averageUnderstanding: number | null; activeDays: number; daysInPeriod: number;
  consistency: number; currentStreak: number; longestStreak: number;
};
export type AnalyticsData = { summary: AnalyticsSummary; trends: AnalyticsTrend[]; bottlenecks: Bottleneck[] };

function daysBetween(start: Date, end: Date) {
  return Math.max(1, Math.floor((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000) + 1);
}

function startOfDay(value: Date) { const result = new Date(value); result.setHours(0, 0, 0, 0); return result; }
function dateKey(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
function inPeriod(value: Date | null, start: Date, end: Date) { return !!value && value >= start && value <= end; }
function flattenTasks(goals: Goal[]) { return goals.flatMap((goal) => goal.stages.flatMap((stage) => stage.tasks)); }
function round(value: number, decimals = 1) { const factor = 10 ** decimals; return Math.round(value * factor) / factor; }

function calculateStreaks(activeDates: Set<string>, end: Date) {
  let current = 0;
  const cursor = startOfDay(end);
  while (activeDates.has(dateKey(cursor))) { current++; cursor.setDate(cursor.getDate() - 1); }
  let longest = 0;
  let run = 0;
  const dates = [...activeDates].sort();
  for (let index = 0; index < dates.length; index++) {
    run = index > 0 && (new Date(`${dates[index]}T00:00:00`).getTime() - new Date(`${dates[index - 1]}T00:00:00`).getTime()) === 86400000 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return { currentStreak: current, longestStreak: longest };
}

function calculateBottlenecks(tasks: Task[], now: Date): Bottleneck[] {
  return tasks.flatMap((task): Bottleneck[] => {
    if (task.status === "COMPLETED") return [];
    const finishedSessions = task.sessions.filter((session) => session.endedAt);
    const averageUnderstanding = finishedSessions.filter((session) => session.understanding !== null).reduce((sum, session) => sum + (session.understanding ?? 0), 0) / (finishedSessions.filter((session) => session.understanding !== null).length || 1);
    const daysSinceActivity = Math.floor((now.getTime() - task.updatedAt.getTime()) / 86400000);
    if (task.estimatedHours > 0 && task.actualHours / task.estimatedHours >= 2) return [{ taskId: task.id, taskName: task.title, reason: "Waktu yang dihabiskan jauh melebihi estimasi.", severity: "HIGH" as const }];
    if (finishedSessions.length >= 3) return [{ taskId: task.id, taskName: task.title, reason: "Banyak sesi namun task masih belum selesai.", severity: "MEDIUM" as const }];
    if (averageUnderstanding <= 2 && finishedSessions.some((session) => session.understanding !== null)) return [{ taskId: task.id, taskName: task.title, reason: "Pemahaman yang dilaporkan rendah.", severity: "MEDIUM" as const }];
    if (daysSinceActivity >= 14) return [{ taskId: task.id, taskName: task.title, reason: "Tidak ada aktivitas baru-baru ini.", severity: "LOW" as const }];
    return [];
  });
}

export function buildAnalytics(goals: Goal[], start: Date, end: Date): AnalyticsData {
  const tasks = flattenTasks(goals);
  const sessions = tasks.flatMap((task) => task.sessions).filter((session) => inPeriod(session.endedAt, start, end));
  const totalMinutes = sessions.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0);
  const understandings = sessions.map((session) => session.understanding).filter((value): value is number => value !== null);
  const completedTasks = tasks.filter((task) => inPeriod(task.completedAt, start, end)).length;
  const totalTasks = tasks.length;
  const activeDates = new Set(sessions.map((session) => dateKey(session.endedAt as Date)));
  const trends: AnalyticsTrend[] = [];
  const day = startOfDay(start);
  while (day <= end) {
    const key = dateKey(day);
    const daySessions = sessions.filter((session) => dateKey(session.endedAt as Date) === key);
    const dayMinutes = daySessions.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0);
    trends.push({ date: key, learningMinutes: dayMinutes, learningHours: round(dayMinutes / 60), completedTasks: tasks.filter((task) => task.completedAt && dateKey(task.completedAt) === key).length });
    day.setDate(day.getDate() + 1);
  }
  const streaks = calculateStreaks(activeDates, end);
  return {
    summary: { totalMinutes, totalHours: round(totalMinutes / 60), completedTasks, activeTasks: tasks.filter((task) => task.status !== "COMPLETED").length, completionRate: totalTasks ? round((tasks.filter((task) => task.status === "COMPLETED").length / totalTasks) * 100) : 0, sessions: sessions.length, averageSessionMinutes: sessions.length ? round(totalMinutes / sessions.length) : 0, averageUnderstanding: understandings.length ? round(understandings.reduce((sum, value) => sum + value, 0) / understandings.length) : null, activeDays: activeDates.size, daysInPeriod: daysBetween(start, end), consistency: round((activeDates.size / daysBetween(start, end)) * 100), ...streaks },
    trends,
    bottlenecks: calculateBottlenecks(tasks, new Date()),
  };
}

export async function getPeriodAnalytics(start: Date, end: Date, goalId?: string, userId?: string) { return buildAnalytics(await findAnalyticsGoals(goalId, requireUserId(userId)) as unknown as Goal[], start, end); }
export async function getDashboardAnalytics(query: AnalyticsQuery = { days: 30 }, userId?: string) {
  const end = query.end ?? new Date();
  const start = query.start ?? new Date(startOfDay(end).getTime() - ((query.days - 1) * 86400000));
  return getPeriodAnalytics(start, end, query.goalId, userId);
}
export async function getGoalAnalytics(goalId: string, start?: Date, end?: Date, userId?: string) { const finish = end ?? new Date(); return getPeriodAnalytics(start ?? new Date(startOfDay(finish).getTime() - 29 * 86400000), finish, goalId, userId); }
export async function getTaskAnalytics(taskId: string, userId?: string) { const goals = await findAnalyticsGoals(undefined, requireUserId(userId)); const task = flattenTasks(goals as any).find((item) => item.id === taskId); return task ? { sessionCount: task.sessions.filter((session) => session.endedAt).length, totalActualHours: task.actualHours, estimatedHours: task.estimatedHours, estimateAccuracy: task.estimatedHours > 0 ? round(task.actualHours / task.estimatedHours, 2) : null, averageSessionMinutes: task.sessions.length ? round(task.sessions.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0) / task.sessions.length) : 0, status: task.status, daysSinceCreated: Math.floor((Date.now() - task.createdAt.getTime()) / 86400000), daysSinceLastActivity: Math.floor((Date.now() - task.updatedAt.getTime()) / 86400000) } : null; }
export const getProgressTrend = getDashboardAnalytics;
export const getLearningTimeTrend = getDashboardAnalytics;
export const getCompletionTrend = getDashboardAnalytics;
export const getConsistencyMetrics = getDashboardAnalytics;
export const getBottlenecks = getDashboardAnalytics;
