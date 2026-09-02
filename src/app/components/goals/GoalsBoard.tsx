"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/app/components/ui/Badge";
import type { IconName } from "@/app/components/ui/Icon";
import { Icon } from "@/app/components/ui/Icon";
import { JourneyRoute } from "@/app/components/core/JourneyRoute";
import { FocusOrb } from "@/app/components/core/FocusOrb";
import { ProgressBar } from "@/app/components/ui/Progress";

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

const typeConfig: Record<string, { icon: IconName; bg: string; text: string; border: string }> = {
  LEARNING: { icon: "sparkles", bg: "bg-ai-50", text: "text-ai-600", border: "border-ai-200" },
  PROJECT:  { icon: "layers",   bg: "bg-primary-50", text: "text-primary-600", border: "border-primary-200" },
  PERSONAL: { icon: "sun",      bg: "bg-warning-50", text: "text-warning-600", border: "border-warning-200" },
  HEALTH:   { icon: "bolt",     bg: "bg-success-50", text: "text-success-600", border: "border-success-200" },
  CAREER:   { icon: "trendingUp", bg: "bg-info-50", text: "text-info-600", border: "border-info-200" },
  OTHER:    { icon: "target",   bg: "bg-surface-100", text: "text-surface-600", border: "border-surface-200" },
};

const accentGradient: Record<string, string> = {
  LEARNING: "from-ai-500 to-primary-500",
  PROJECT:  "from-primary-500 to-primary-700",
  PERSONAL: "from-warning-400 to-warning-600",
  HEALTH:   "from-success-500 to-success-700",
  CAREER:   "from-info-400 to-info-600",
  OTHER:    "from-surface-400 to-surface-600",
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

  const stats: { label: string; value: string | number; icon: IconName; bg: string; text: string }[] = [
    { label: "Aktif", value: active.length, icon: "compass", bg: "stat-bg-primary", text: "text-primary-600" },
    { label: "Rata progres", value: `${avgProgress}%`, icon: "gauge", bg: "stat-bg-ai", text: "text-ai-600" },
    { label: "Task selesai", value: `${tasksDone}/${tasksTotal}`, icon: "check", bg: "stat-bg-success", text: "text-success-600" },
    { label: "Tuntas", value: completed.length, icon: "flag", bg: "stat-bg-warning", text: "text-warning-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`bento-tile ${stat.bg} p-4 flex items-center gap-3`}>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 ${stat.text}`}>
            <Icon name={stat.icon} size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none text-surface-900">{stat.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface-500">
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
  const cfg = typeConfig[goal.type] ?? typeConfig.OTHER;
  const grad = accentGradient[goal.type] ?? accentGradient.OTHER;

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-surface-150 bg-white shadow-soft transition-all hover:border-primary-200 hover:shadow-[var(--shadow-card-hover)] card-interactive"
    >
      {/* Left gradient accent */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b ${grad}`}
      />

      <div className="px-5 py-4 pl-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.text}`}>
              <Icon name={cfg.icon} size={14} />
            </span>
            <span className={`chip border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              {goal.type}
            </span>
            <StatusBadge status={goal.status} />
            {goal.targetDateLabel && (
              <span className="chip bg-surface-50 text-surface-500 border border-surface-150">
                <Icon name="clock" size={10} />
                {goal.targetDateLabel}
              </span>
            )}
          </div>
          <FocusOrb
            value={goal.progress}
            size={52}
            stroke={5}
            tone={done ? "success" : "primary"}
            label={`Progres ${goal.name} ${goal.progress} persen`}
          >
            <span className="text-[12px] font-bold text-surface-900">{goal.progress}%</span>
          </FocusOrb>
        </div>

        {/* Goal name */}
        <h2 className="mt-2.5 text-[16px] font-bold tracking-tight text-surface-900 transition-colors group-hover:text-primary-700">
          {goal.name}
        </h2>

        {/* Progress bar */}
        <div className="mt-3">
          <ProgressBar value={goal.progress} size="sm" tone={done ? "success" : "primary"} />
        </div>

        {/* Journey waypoints */}
        {goal.waypoints.length > 0 && (
          <div className="mt-3">
            <JourneyRoute
              waypoints={goal.waypoints}
              size={goal.waypoints.length <= 6 ? "md" : "sm"}
              label={`Peta ${goal.name}`}
            />
          </div>
        )}

        {/* Footer meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t border-surface-100">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-surface-400">
              {done ? "Status" : `Stage ${(goal.currentStageIndex + 1) || "—"}`}
            </p>
            <p className="truncate text-[12.5px] font-medium text-surface-700">
              {done ? "Selesai 🎉" : (goal.currentStageName ?? "Belum ada stage")}
            </p>
          </div>
          {goal.nextTaskName && !done && (
            <>
              <span className="hidden h-5 w-px shrink-0 bg-surface-200 sm:block" aria-hidden />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-surface-400">
                  Task berikutnya
                </p>
                <p className="truncate text-[12.5px] font-medium text-surface-700">
                  {goal.nextTaskName}
                </p>
              </div>
            </>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
            Lanjutkan <Icon name="arrowRight" size={12} />
          </span>
          <span className="shrink-0 text-[11px] text-surface-400">
            {goal.totalStages} stage · {goal.completedTasks}/{goal.totalTasks} task
          </span>
        </div>
      </div>
    </Link>
  );
}

function CompletedGrid({ goals }: { goals: GoalCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => {
        const cfg = typeConfig[goal.type] ?? typeConfig.OTHER;
        return (
          <Link
            key={goal.id}
            href={`/goals/${goal.id}`}
            className="group flex items-center gap-3 rounded-xl border border-success-200 bg-gradient-to-r from-success-50/60 to-white p-3.5 transition-all hover:border-success-300 hover:shadow-soft card-interactive"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
              <Icon name="check" size={15} strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <span className={`chip ${cfg.bg} ${cfg.text} mb-0.5`}>{goal.type}</span>
              <p className="truncate text-[13px] font-semibold text-surface-800 transition-colors group-hover:text-success-700">
                {goal.name}
              </p>
            </div>
          </Link>
        );
      })}
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
    <div className="space-y-5">
      <StatStrip active={activeGoals} completed={completedGoals} />

      {/* Tab nav */}
      <div className="flex items-center gap-1 rounded-xl border border-surface-150 bg-surface-50 p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
            tab === "active"
              ? "bg-white text-surface-900 shadow-soft border border-surface-150"
              : "text-surface-500 hover:text-surface-700"
          }`}
        >
          Aktif
          <span
            className={`chip ${
              tab === "active"
                ? "bg-primary-100 text-primary-700"
                : "bg-surface-100 text-surface-400"
            }`}
          >
            {activeGoals.length}
          </span>
        </button>
        {hasCompleted && (
          <button
            type="button"
            onClick={() => setTab("completed")}
            className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all ${
              tab === "completed"
                ? "bg-white text-surface-900 shadow-soft border border-surface-150"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            Tuntas
            <span
              className={`chip ${
                tab === "completed"
                  ? "bg-success-100 text-success-700"
                  : "bg-surface-100 text-surface-400"
              }`}
            >
              {completedGoals.length}
            </span>
          </button>
        )}
      </div>

      {tab === "active" ? (
        activeGoals.length === 0 ? (
          <p className="py-4 text-[13px] text-surface-500">
            Belum ada goal aktif. Buat satu untuk memulai.
          </p>
        ) : (
          <div className="space-y-3">
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
