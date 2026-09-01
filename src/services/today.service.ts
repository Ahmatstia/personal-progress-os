import { selectNextAction } from "./progress.service";
import { calculateSessionDurationMinutes } from "./progress.service";
import { createFocus, deleteFocus as deleteFocusRecord, findFocusById, findTaskForFocus, findTodayContext, findTodayFocus, findTodaySessions, updateFocus } from "../repositories/today.repository";

export function localDayBounds(date = new Date()) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
}

export class TodayServiceError extends Error {
  constructor(message: string, public readonly code: "TASK_NOT_FOUND" | "FOCUS_NOT_FOUND" | "ALREADY_FOCUSED" | "COMPLETED_TASK") { super(message); }
}

async function focusRecords(date: Date) { return findTodayFocus(localDayBounds(date).start); }

export async function getToday(date = new Date()) {
  const { start, end } = localDayBounds(date);
  const [focus, goals, sessions] = await Promise.all([focusRecords(date), findTodayContext(), findTodaySessions(start, end)]);
  const tasks = goals.flatMap((goal) => goal.stages.flatMap((stage) => stage.tasks));
  const completedTasks = tasks.filter((task) => task.completedAt && task.completedAt >= start && task.completedAt <= end);
  const focusTasks = focus.filter((item) => item.task.status !== "COMPLETED");
  const activeSession = sessions.find((session) => session.endedAt === null) ?? null;
  const finishedSessions = sessions.filter((session) => session.endedAt !== null);
  const totalMinutes = finishedSessions.reduce((sum, session) => sum + (session.durationMinutes ?? calculateSessionDurationMinutes(session.startedAt, session.endedAt ?? end)), 0);
  const unfinished = tasks.filter((task) => task.status !== "COMPLETED");
  const nextAction = activeSession ? { taskId: activeSession.taskId, taskName: activeSession.task.name, reason: "ACTIVE_SESSION" } : selectNextAction(unfinished.map((task) => ({ id: task.id, goalId: task.stage.goalId, stageId: task.stageId, name: task.name, status: task.status, priority: task.priority, estimatedHours: task.estimatedHours, goalName: task.stage.goal.name, stageName: task.stage.name, createdAt: task.createdAt, startedAt: task.startedAt })));
  return { date: start, focusTasks, availableTasks: unfinished, currentSession: activeSession, completedTasks, overdueTasks: tasks.filter((task) => task.status !== "COMPLETED" && task.stage.goal.targetDate && task.stage.goal.targetDate < start), stats: { totalSessions: finishedSessions.length, totalMinutes, totalHours: totalMinutes / 60, completedTasks: completedTasks.length, activeTasks: unfinished.length }, nextAction, focusCompleted: focus.filter((item) => item.task.status === "COMPLETED").length, focusTotal: focus.length, momentumSessions: finishedSessions };
}

export async function getTodayFocus(date = new Date()) { return (await focusRecords(date)).filter((item) => item.task.status !== "COMPLETED"); }
export async function getTodayStats(date = new Date()) { return (await getToday(date)).stats; }
export async function getTodaySessions(date = new Date()) { return (await getToday(date)).momentumSessions; }
export async function getTodayCompletedTasks(date = new Date()) { return (await getToday(date)).completedTasks; }
export async function getTodayNextAction(date = new Date()) { return (await getToday(date)).nextAction; }

export async function addTodayFocus(taskId: string, date = new Date()) {
  const task = await findTaskForFocus(taskId);
  if (!task) throw new TodayServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");
  if (task.status === "COMPLETED") throw new TodayServiceError("Task yang sudah selesai tidak bisa ditambahkan ke fokus aktif.", "COMPLETED_TASK");
  const existing = (await focusRecords(date)).find((item) => item.taskId === taskId);
  if (existing) throw new TodayServiceError("Task sudah ada di fokus hari ini.", "ALREADY_FOCUSED");
  return createFocus(localDayBounds(date).start, taskId, (await focusRecords(date)).length);
}

export async function removeTodayFocus(id: string) { if (!(await findFocusById(id))) throw new TodayServiceError("Fokus tidak ditemukan.", "FOCUS_NOT_FOUND"); return deleteFocusRecord(id); }

export async function reorderTodayFocus(id: string, direction: "up" | "down") {
  const focus = await findFocusById(id); if (!focus) throw new TodayServiceError("Fokus tidak ditemukan.", "FOCUS_NOT_FOUND");
  const items = await focusRecords(focus.date); const index = items.findIndex((item) => item.id === id); const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return focus;
  await updateFocus(focus.id, items[targetIndex].order); return updateFocus(items[targetIndex].id, focus.order);
}

export async function getTodayFocusContext(date = new Date()) { return getToday(date); }
