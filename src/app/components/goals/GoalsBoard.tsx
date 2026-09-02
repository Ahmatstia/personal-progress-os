"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/app/components/ui/Badge";
import type { IconName } from "@/app/components/ui/Icon";
import { Icon } from "@/app/components/ui/Icon";
import { JourneyRoute } from "@/app/components/core/JourneyRoute";
import { FocusOrb } from "@/app/components/core/FocusOrb";

export type GoalCard = {
  id: string;
  name: string;
  type: string;
  status: string;
  targetDateLabel: string | null;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  totalStages: number;
  currentStageIndex: number;
  currentStageName: string | null;
  nextTaskName: string | null;
  waypoints: {
    id: string;
    label: string;
    status: "COMPLETED" | "CURRENT" | "UPCOMING";
  }[];
};

const typeIcon: Record<string, IconName> = {
  LEARNING: "sparkles",
  PROJECT: "layers",
  PERSONAL: "sun",
  HEALTH: "bolt",
  CAREER: "trendingUp",
  OTHER: "target",
};

function StatStrip({
  active,
  completed,
}: {
  active: GoalCard[];
  completed: GoalCard[];
}) {
  const all = [...active, ...completed];
  const avgProgress = active.length
    ? Math.round(active.reduce((sum, g) => sum + g.progress, 0) / active.length)
    : 0;
  const tasksDone = all.reduce((sum, g) => sum + g.completedTasks, 0);
  const tasksTotal = all.reduce((sum, g) => sum + g.totalTasks, 0);

  const stats: { label: string; value: string | number; icon: IconName }[] = [
    { label: "Perjalanan aktif", value: active.length, icon: "compass" },
    { label: "Rata-rata progres", value: `${avgProgress}%`, icon: "gauge" },
    {
      label: "Task selesai",
      value: `${tasksDone}/${tasksTotal}`,
      icon: "check",
    },
    { label: "Tuntas", value: completed.length, icon: "flag" },
  ];

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-surface-150 overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 sm:grid-cols-4 sm:divide-y-0">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Icon name={stat.icon} size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none text-surface-900">
              {stat.value}
            </p>
            <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-wide text-surface-400">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalCardRow({ goal }: { goal: GoalCard }) {
  const done = goal.progress === 100;
  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group relative block overflow-hidden rounded-3xl border border-surface-200 bg-surface-0 p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-raised sm:p-7"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 rounded-l-3xl ${done ? "bg-success-500" : "bg-primary-500"}`}
      />

      <div className="flex items-start justify-between gap-6 pl-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Icon name={typeIcon[goal.type] ?? "target"} size={15} />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
              {goal.type}
            </p>
            <StatusBadge status={goal.status} />
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-surface-900 transition-colors group-hover:text-primary-700 sm:text-2xl">
            {goal.name}
          </h2>
          {goal.targetDateLabel && (
            <p className="mt-1 text-sm text-surface-500">
              Hingga {goal.targetDateLabel}
            </p>
          )}
        </div>

        <FocusOrb
          value={goal.progress}
          size={72}
          stroke={6}
          tone={done ? "success" : "primary"}
          label={`Progres ${goal.name} ${goal.progress} persen`}
        >
          <span className="text-lg font-bold text-surface-900">
            {goal.progress}%
          </span>
        </FocusOrb>
      </div>

      <div className="mt-6 pl-2">
        {goal.waypoints.length > 0 ? (
          <JourneyRoute
            waypoints={goal.waypoints}
            size={goal.waypoints.length <= 6 ? "md" : "sm"}
            label={`Peta perjalanan ${goal.name}`}
          />
        ) : (
          <p className="text-sm text-surface-500">
            Belum ada stage — mulailah menyusun peta perjalanan ini.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-dashed border-surface-150 pl-2 pt-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
            {done
              ? "Status"
              : goal.currentStageIndex === -1
                ? "Status"
                : `Stage ${goal.currentStageIndex + 1}`}
          </p>
          <p className="truncate text-sm font-medium text-surface-800">
            {done
              ? "Perjalanan selesai"
              : (goal.currentStageName ?? "Belum ada stage")}
          </p>
        </div>
        <span
          className="hidden h-6 w-px shrink-0 bg-surface-200 sm:block"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
            Berikutnya
          </p>
          <p className="truncate text-sm font-medium text-surface-800">
            {goal.nextTaskName ?? (done ? "—" : "uraikan dahulu")}
          </p>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
          Lanjutkan <Icon name="arrowRight" size={13} />
        </span>
        <span className="shrink-0 text-xs font-medium text-surface-500 sm:ml-2">
          {goal.totalStages} stage · {goal.completedTasks}/{goal.totalTasks}{" "}
          task
        </span>
      </div>
    </Link>
  );
}

function CompletedGrid({ goals }: { goals: GoalCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => (
        <Link
          key={goal.id}
          href={`/goals/${goal.id}`}
          className="group flex items-center gap-3 rounded-2xl border border-success-200 bg-success-50/60 p-4 transition hover:border-success-300 hover:bg-success-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
            <Icon name="check" size={16} strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-success-700">
              {goal.type}
            </p>
            <h3 className="truncate text-sm font-semibold text-surface-800 transition-colors group-hover:text-success-800">
              {goal.name}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function GoalsBoard({
  activeGoals,
  completedGoals,
}: {
  activeGoals: GoalCard[];
  completedGoals: GoalCard[];
}) {
  const [tab, setTab] = useState<"active" | "completed">("active");
  const hasCompleted = completedGoals.length > 0;

  return (
    <div className="space-y-8">
      <StatStrip active={activeGoals} completed={completedGoals} />

      <div className="flex items-center gap-2 border-b border-surface-150">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`relative px-1 pb-3 text-sm font-semibold transition-colors ${
            tab === "active"
              ? "text-surface-900"
              : "text-surface-400 hover:text-surface-600"
          }`}
        >
          Sedang berjalan
          <span className="ml-1.5 text-xs font-medium text-surface-400">
            {activeGoals.length}
          </span>
          {tab === "active" && (
            <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-primary-600" />
          )}
        </button>
        {hasCompleted && (
          <button
            type="button"
            onClick={() => setTab("completed")}
            className={`relative px-1 pb-3 text-sm font-semibold transition-colors ${
              tab === "completed"
                ? "text-surface-900"
                : "text-surface-400 hover:text-surface-600"
            }`}
          >
            Tuntas
            <span className="ml-1.5 text-xs font-medium text-surface-400">
              {completedGoals.length}
            </span>
            {tab === "completed" && (
              <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-success-600" />
            )}
          </button>
        )}
      </div>

      {tab === "active" ? (
        activeGoals.length === 0 ? (
          <p className="py-8 text-sm text-surface-500">
            Belum ada goal aktif saat ini. Buat satu untuk memulai.
          </p>
        ) : (
          <div className="space-y-5">
            {activeGoals.map((goal) => (
              <GoalCardRow key={goal.id} goal={goal} />
            ))}
          </div>
        )
      ) : (
        <CompletedGrid goals={completedGoals} />
      )}
    </div>
  );
}
