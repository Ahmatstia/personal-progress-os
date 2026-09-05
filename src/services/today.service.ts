import { selectNextAction } from "./progress.service";
import { requireUserId } from "../lib/ownership";
import { calculateSessionDurationMinutes } from "./progress.service";
import {
  createFocus,
  deleteFocus as deleteFocusRecord,
  findFocusById,
  findTaskForFocus,
  findTodayCalendarEvents,
  findTodayContext,
  findTodayFocus,
  findTodaySessions,
  findTodayTasks,
  updateFocus,
} from "../repositories/today.repository";

export function localDayBounds(date = new Date()) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
}

export class TodayServiceError extends Error {
  constructor(message: string, public readonly code: "TASK_NOT_FOUND" | "FOCUS_NOT_FOUND" | "ALREADY_FOCUSED" | "COMPLETED_TASK") { super(message); }
}

async function focusRecords(date: Date, userId?: string) { return findTodayFocus(requireUserId(userId), localDayBounds(date).start); }

export async function getToday(date = new Date(), userId?: string) {
  const owner = requireUserId(userId);
  const { start, end } = localDayBounds(date);
  const [focus, goals, dbTasks, calendarEvents, sessions] = await Promise.all([
    focusRecords(date, owner),
    findTodayContext(owner),
    findTodayTasks(owner).catch(() => []),
    findTodayCalendarEvents(owner, start, end).catch(() => []),
    findTodaySessions(owner, start, end),
  ]);

  const fallbackTasks = goals.flatMap((goal) => goal.stages.flatMap((stage) => stage.tasks));
  const tasks = dbTasks.length > 0 ? dbTasks : fallbackTasks;
  const completedTasks = tasks.filter((task) => task.completedAt && task.completedAt >= start && task.completedAt <= end);
  const focusTasks = focus.filter((item) => item.task.status !== "COMPLETED");
  const activeSession = sessions.find((session) => session.endedAt === null) ?? null;
  const finishedSessions = sessions.filter((session) => session.endedAt !== null);
  const totalMinutes = finishedSessions.reduce((sum, session) => sum + (session.durationMinutes ?? calculateSessionDurationMinutes(session.startedAt, session.endedAt ?? end)), 0);
  const unfinished = tasks.filter((task) => task.status !== "COMPLETED");
  const nextAction = activeSession
    ? {
        taskId: activeSession.taskId,
        goalId: activeSession.task.goalId ?? activeSession.task.stage?.goalId ?? "",
        stageId: activeSession.task.stageId ?? "",
        taskName: activeSession.task.title,
        goalName: activeSession.task.stage?.goal?.title ?? "",
        stageName: activeSession.task.stage?.name ?? "",
        priority: activeSession.task.priority,
        estimatedHours: activeSession.task.estimatedHours,
        estimatedMinutes: Math.round(activeSession.task.estimatedHours * 60),
        status: activeSession.task.status,
        startedAt: activeSession.task.startedAt,
        reason: "ACTIVE_SESSION",
      }
    : selectNextAction(
        unfinished.map((task) => ({
          id: task.id,
          goalId: task.goalId ?? task.stage?.goalId ?? "",
          stageId: task.stageId ?? "",
          name: task.title,
          status: task.status,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          goalName: task.stage?.goal?.title ?? "",
          stageName: task.stage?.name ?? "",
          createdAt: task.createdAt,
          startedAt: task.startedAt,
        }))
      );
  return {
    date: start,
    focusTasks,
    availableTasks: unfinished,
    currentSession: activeSession,
    completedTasks,
    overdueTasks: tasks.filter((task) => task.status !== "COMPLETED" && task.stage?.goal?.targetDate && task.stage?.goal.targetDate < start),
    stats: { totalSessions: finishedSessions.length, totalMinutes, totalHours: totalMinutes / 60, completedTasks: completedTasks.length, activeTasks: unfinished.length },
    nextAction,
    focusCompleted: focus.filter((item) => item.task.status === "COMPLETED").length,
    focusTotal: focus.length,
    momentumSessions: finishedSessions,
    calendarEvents,
  };
}

export async function getTodayFocus(date = new Date(), userId?: string) { return (await focusRecords(date, userId)).filter((item) => item.task.status !== "COMPLETED"); }
export async function getTodayStats(date = new Date(), userId?: string) { return (await getToday(date, userId)).stats; }
export async function getTodaySessions(date = new Date(), userId?: string) { return (await getToday(date, userId)).momentumSessions; }
export async function getTodayCompletedTasks(date = new Date(), userId?: string) { return (await getToday(date, userId)).completedTasks; }
export async function getTodayNextAction(date = new Date(), userId?: string) { return (await getToday(date, userId)).nextAction; }

export async function addTodayFocus(taskId: string, date = new Date(), userId?: string) {
  const owner = requireUserId(userId);
  const task = await findTaskForFocus(owner, taskId);
  if (!task) throw new TodayServiceError("Task tidak ditemukan.", "TASK_NOT_FOUND");
  if (task.status === "COMPLETED") throw new TodayServiceError("Task yang sudah selesai tidak bisa ditambahkan ke fokus aktif.", "COMPLETED_TASK");
  const existing = (await focusRecords(date, owner)).find((item) => item.taskId === taskId);
  if (existing) throw new TodayServiceError("Task sudah ada di fokus hari ini.", "ALREADY_FOCUSED");
  return createFocus(owner, localDayBounds(date).start, taskId, (await focusRecords(date, owner)).length);
}

export async function removeTodayFocus(id: string, userId?: string) { const owner = requireUserId(userId); if (!(await findFocusById(owner, id))) throw new TodayServiceError("Fokus tidak ditemukan.", "FOCUS_NOT_FOUND"); return deleteFocusRecord(owner, id); }

export async function reorderTodayFocus(id: string, direction: "up" | "down", userId?: string) {
  const owner = requireUserId(userId);
  const focus = await findFocusById(owner, id); if (!focus) throw new TodayServiceError("Fokus tidak ditemukan.", "FOCUS_NOT_FOUND");
  const items = await focusRecords(focus.date, owner); const index = items.findIndex((item) => item.id === id); const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return focus;
  await updateFocus(owner, focus.id, items[targetIndex].order); return updateFocus(owner, items[targetIndex].id, focus.order);
}

export async function getTodayFocusContext(date = new Date()) { return getToday(date); }
