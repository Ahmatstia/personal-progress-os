import {
  findInsightsTasks,
  findInsightsGoals,
  findInsightsAreas,
  findInsightsSessions,
  findInsightsCalendarEvents,
  findInsightsActiveSession,
  findInsightsDailyFocus,
} from "@/repositories/insights.repository";
import { computeComprehensiveAnalytics, getInsightDateRange } from "./analytics-insights.service";
import { rankTasks } from "./smart-priority.engine";
import { generateDailyPlan } from "./daily-plan.service";
import { detectConflicts } from "./conflict-detection.engine";
import { getUnifiedInbox } from "./unified-inbox.service";
import { calculateLifeHealth } from "./life-health.engine";
import type {
  AnalyticsSummary,
  InsightPeriod,
  PrioritizedTask,
  DailyPlanRecommendation,
  TimeConflict,
  UnifiedInboxSummary,
  InboxSource,
  LifeHealthResult,
} from "./insights-types";
import { requireUserId } from "@/lib/ownership";

// 1. Analytics
export async function getInsightsAnalytics(
  period: InsightPeriod = "this_week",
  customStart?: Date,
  customEnd?: Date,
  userId?: string
): Promise<AnalyticsSummary> {
  return computeComprehensiveAnalytics(requireUserId(userId), period, customStart, customEnd);
}

// 2. Smart Priority
export async function getPrioritizedTasks(
  options: {
    limit?: number;
    includeCompleted?: boolean;
    goalId?: string;
    projectId?: string;
    areaId?: string;
  } = {},
  userId?: string
): Promise<PrioritizedTask[]> {
  const owner = requireUserId(userId);
  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [allTasks, focusRecords] = await Promise.all([
    findInsightsTasks(owner),
    findInsightsDailyFocus(owner, now),
  ]);

  const focusTaskIds = new Set(focusRecords.map((f) => f.taskId));

  let filteredTasks = allTasks;
  if (options.goalId) {
    filteredTasks = filteredTasks.filter((t) => t.goalId === options.goalId);
  }
  if (options.projectId) {
    filteredTasks = filteredTasks.filter((t) => t.projectId === options.projectId);
  }
  if (options.areaId) {
    filteredTasks = filteredTasks.filter(
      (t) => t.areaId === options.areaId || t.goal?.areaId === options.areaId || t.project?.areaId === options.areaId
    );
  }

  return rankTasks(
    filteredTasks,
    {
      now,
      todayDateStr,
      dailyFocusTaskIds: focusTaskIds,
    },
    {
      includeCompleted: options.includeCompleted ?? false,
      limit: options.limit ?? 50,
    }
  );
}

// 3. Daily Plan
export async function getInsightsDailyPlan(date: Date = new Date(), userId?: string): Promise<DailyPlanRecommendation> {
  return generateDailyPlan(date, requireUserId(userId));
}

// 4. Conflict Detection
export async function getInsightsConflicts(
  date: Date = new Date(),
  days = 1,
  userId?: string
): Promise<TimeConflict[]> {
  const owner = requireUserId(userId);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);

  const [calendarEvents, activeSession] = await Promise.all([
    findInsightsCalendarEvents(owner, start, end),
    findInsightsActiveSession(owner),
  ]);

  return detectConflicts(calendarEvents, activeSession, date);
}

// 5. Unified Inbox
export async function getInsightsUnifiedInbox(
  source: InboxSource | "ALL" = "ALL",
  limit = 50,
  userId?: string
): Promise<UnifiedInboxSummary> {
  return getUnifiedInbox(requireUserId(userId), source, limit);
}

// 6. Life Health
export async function getInsightsLifeHealth(days = 30, userId?: string): Promise<LifeHealthResult> {
  const owner = requireUserId(userId);
  const now = new Date();
  const start = new Date(now.getTime() - days * 86400000);

  const [allTasks, allGoals, allAreas, sessions] = await Promise.all([
    findInsightsTasks(owner),
    findInsightsGoals(owner),
    findInsightsAreas(owner),
    findInsightsSessions(owner, start, now),
  ]);

  const completedTasks = allTasks.filter((t) => t.status === "COMPLETED").length;
  const overdueTasks = allTasks.filter((t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < now).length;
  const activeGoals = allGoals.filter((g) => g.status === "ACTIVE").length;
  const completedGoals = allGoals.filter((g) => g.status === "COMPLETED").length;

  const totalSessionMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);

  // Active days and streaks
  const activeDateKeys = new Set(
    sessions
      .filter((s) => s.endedAt)
      .map((s) => {
        const d = new Date(s.endedAt!);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })
  );

  let currentStreak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  while (
    activeDateKeys.has(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`
    )
  ) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Areas with activity
  const touchedAreaIds = new Set<string>();
  for (const t of allTasks) {
    if (t.areaId) touchedAreaIds.add(t.areaId);
    if (t.goal?.areaId) touchedAreaIds.add(t.goal.areaId);
    if (t.project?.areaId) touchedAreaIds.add(t.project.areaId);
  }
  for (const g of allGoals) {
    if (g.areaId) touchedAreaIds.add(g.areaId);
  }

  return calculateLifeHealth(
    {
      totalTasks: allTasks.length,
      completedTasks,
      overdueTasks,
      activeGoals,
      completedGoals,
      totalSessions: sessions.length,
      totalSessionMinutes,
      activeDays: activeDateKeys.size,
      daysInPeriod: days,
      areasCount: allAreas.length,
      areasWithActivity: touchedAreaIds.size,
      currentStreak,
    },
    now
  );
}

// 7. Compact Today Insights Summary
export async function getTodayInsightsSummary(userId?: string) {
  const owner = requireUserId(userId);
  const now = new Date();

  const [prioritized, conflicts, inbox, health] = await Promise.all([
    getPrioritizedTasks({ limit: 3, includeCompleted: false }, owner),
    getInsightsConflicts(now, 1, owner),
    getInsightsUnifiedInbox("ALL", 5, owner),
    getInsightsLifeHealth(14, owner),
  ]);

  return {
    topPriorities: prioritized,
    conflicts,
    inboxCount: inbox.counts.total,
    lifeHealthScore: health.overallScore,
    lifeHealthStatus: health.status,
  };
}

export { getInsightDateRange };
