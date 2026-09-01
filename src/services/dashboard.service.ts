import { prisma } from "@/lib/prisma";
import type { Prisma } from "../generated/prisma/client";
import {
  calculateGoalProgress,
  calculateSessionDurationMinutes,
  selectNextAction,
  type NextActionTaskLike,
} from "./progress.service";
import { getPeriodReview, getPeriodMetrics, getWeekPeriod } from "./review.service";

type GoalWithStages = Prisma.GoalGetPayload<{
  include: {
    stages: {
      include: {
        tasks: true;
      };
    };
  };
}>;

type SessionWithTask = Prisma.SessionGetPayload<{
  include: {
    task: {
      include: {
        stage: {
          include: {
            goal: true;
          };
        };
      };
    };
  };
}>;

export type DashboardActivity = {
  id: string;
  label: string;
  detail: string;
  timestamp: Date;
  kind: "session" | "task" | "capture";
  entityId: string;
};

export type DashboardData = {
  activeGoals: GoalWithStages[];
  activeGoalCount: number;
  completedTaskCount: number;
  totalTaskCount: number;
  totalProgress: number;
  studyMinutesToday: number;
  recentSessions: SessionWithTask[];
  recentActivity: DashboardActivity[];
  nextAction: ReturnType<typeof selectNextAction>;
  reviewSummary: { goalId: string; periodStart: Date; periodEnd: Date; review: Awaited<ReturnType<typeof getPeriodReview>>; metrics: Awaited<ReturnType<typeof getPeriodMetrics>> } | null;
};

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMinutes(minutes: number) {
  return `${minutes} mnt`;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();

  const [goals, sessions, recentCaptures] = await Promise.all([
    prisma.goal.findMany({
      where: {
        userId,
        status: {
          not: "COMPLETED",
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        stages: {
          orderBy: {
            order: "asc",
          },
          include: {
            tasks: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    }),
    prisma.session.findMany({
      where: { userId },
      orderBy: {
        startedAt: "desc",
      },
      take: 10,
      include: {
        task: {
          include: {
            stage: {
              include: {
                goal: true,
              },
            },
          },
        },
      },
    }),
    prisma.capture.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const tasks: NextActionTaskLike[] = goals.flatMap((goal) =>
    goal.stages.flatMap((stage) =>
      stage.tasks.map((task) => ({
        id: task.id,
        goalId: goal.id,
        stageId: stage.id,
        name: task.name,
        status: task.status,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        goalName: goal.name,
        stageName: stage.name,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
      })),
    ),
  );

  const totalTaskCount = tasks.length;
  const completedTaskCount = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const totalProgress =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce(
            (sum, goal) => sum + calculateGoalProgress(goal.stages),
            0,
          ) / goals.length,
        );

  const studyMinutesToday = sessions.reduce((sum, session) => {
    const finishedAt = session.endedAt ?? now;

    if (!isSameLocalDay(finishedAt, now)) {
      return sum;
    }

    return (
      sum +
      (session.durationMinutes ??
        calculateSessionDurationMinutes(session.startedAt, finishedAt))
    );
  }, 0);

  const nextAction = selectNextAction(tasks);
  const period = getWeekPeriod(now);
  const reviewGoal = goals[0];
  const reviewSummary = reviewGoal
    ? { goalId: reviewGoal.id, ...period, review: await getPeriodReview(reviewGoal.id, period.periodStart, period.periodEnd, userId), metrics: await getPeriodMetrics(reviewGoal.id, period.periodStart, period.periodEnd, userId) }
    : null;

  const recentActivity: DashboardActivity[] = [
    ...recentCaptures.map((capture) => ({
      id: `capture-${capture.id}`,
      kind: "capture" as const,
      label: capture.content.slice(0, 60) + (capture.content.length > 60 ? "…" : ""),
      detail: "Catat cepat",
      timestamp: capture.createdAt,
      entityId: capture.id,
    })),
    ...sessions.map((session) => ({
      id: `session-${session.id}`,
      kind: "session" as const,
      label: session.task.name,
      detail: formatMinutes(
        session.durationMinutes ??
          calculateSessionDurationMinutes(
            session.startedAt,
            session.endedAt ?? now,
          ),
      ),
      timestamp: session.endedAt ?? session.startedAt,
      entityId: session.id,
    })),
    ...tasks
      .filter((task) => task.status === "COMPLETED" && task.startedAt)
      .slice(0, 5)
      .map((task) => ({
        id: `task-${task.id}`,
        kind: "task" as const,
        label: task.name,
        detail: `${task.goalName} - ${task.stageName}`,
        timestamp: task.startedAt ?? task.createdAt,
        entityId: task.id,
      })),
  ]
    .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())
    .slice(0, 10);

  return {
    activeGoals: goals,
    activeGoalCount: goals.length,
    completedTaskCount,
    totalTaskCount,
    totalProgress,
    studyMinutesToday,
    recentSessions: sessions,
    recentActivity,
    nextAction,
    reviewSummary,
  };
}
