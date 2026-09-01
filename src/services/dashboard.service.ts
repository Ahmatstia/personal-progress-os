import { prisma } from "@/lib/prisma";
import type { Prisma } from "../generated/prisma/client";
import {
  calculateGoalProgress,
  calculateSessionDurationMinutes,
  selectNextAction,
  type NextActionTaskLike,
} from "./progress.service";

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
  kind: "session" | "task";
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
};

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMinutes(minutes: number) {
  return `${minutes} min`;
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();

  const [goals, sessions] = await Promise.all([
    prisma.goal.findMany({
      where: {
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

  const recentActivity: DashboardActivity[] = [
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
  };
}
