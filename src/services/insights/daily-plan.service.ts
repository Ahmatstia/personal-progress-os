import {
  findInsightsTasks,
  findInsightsDailyFocus,
  findInsightsCalendarEvents,
  findInsightsActiveSession,
} from "@/repositories/insights.repository";
import { rankTasks } from "./smart-priority.engine";
import { detectConflicts } from "./conflict-detection.engine";
import type { DailyPlanRecommendation } from "./insights-types";
import { requireUserId } from "@/lib/ownership";

export async function generateDailyPlan(date: Date = new Date(), userId?: string): Promise<DailyPlanRecommendation> {
  const owner = requireUserId(userId);
  const now = new Date(date);

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [allTasks, focusRecords, calendarEvents, activeSession] = await Promise.all([
    findInsightsTasks(owner),
    findInsightsDailyFocus(owner, now),
    findInsightsCalendarEvents(owner, startOfDay, endOfDay),
    findInsightsActiveSession(owner),
  ]);

  const focusTaskIds = new Set(focusRecords.map((f) => f.taskId));
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Rank all tasks using SmartPriority
  const prioritized = rankTasks(
    allTasks,
    {
      now,
      todayDateStr,
      dailyFocusTaskIds: focusTaskIds,
    },
    { includeCompleted: false, limit: 100 }
  );

  // 1. Focus Tasks (ordered according to DailyFocus order if available, else by score)
  const focusTasks = focusRecords
    .map((record) => prioritized.find((pt) => pt.task.id === record.taskId))
    .filter((pt): pt is NonNullable<typeof pt> => pt !== undefined);

  // If there are daily focus items that weren't in prioritized list (e.g. completed)
  const missingFocus = prioritized.filter((pt) => focusTaskIds.has(pt.task.id) && !focusTasks.some((f) => f.task.id === pt.task.id));
  focusTasks.push(...missingFocus);

  // 2. Recommended Tasks: top ranked tasks that are NOT in daily focus and NOT completed
  const recommendedTasks = prioritized
    .filter((pt) => !focusTaskIds.has(pt.task.id) && pt.task.status !== "COMPLETED")
    .slice(0, 5);

  // 3. Overdue Tasks: tasks that are overdue
  const overdueTasks = prioritized.filter((pt) => pt.isOverdue && pt.task.status !== "COMPLETED");

  // 4. Conflicts Detection for Today
  const conflicts = detectConflicts(calendarEvents, activeSession, now);

  // 5. Workload Metrics
  const estimatedFocusMinutes = focusTasks.reduce((acc, pt) => acc + Math.round((pt.task.estimatedHours || 0.5) * 60), 0);

  return {
    date: now,
    activeSession,
    focusTasks,
    recommendedTasks,
    scheduledEvents: calendarEvents,
    overdueTasks,
    conflicts,
    metrics: {
      totalFocusTasks: focusTasks.length,
      totalScheduledEvents: calendarEvents.length,
      estimatedFocusMinutes,
      conflictsCount: conflicts.length,
    },
  };
}
