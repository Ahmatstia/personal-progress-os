import { getToday } from "./today.service";

export async function getDailySummary(date = new Date()) {
  const today = await getToday(date);
  return { totalMinutes: today.stats.totalMinutes, sessions: today.stats.totalSessions, completedTasks: today.stats.completedTasks, focusCompleted: today.focusCompleted, focusTotal: today.focusTotal, nextAction: today.nextAction };
}
