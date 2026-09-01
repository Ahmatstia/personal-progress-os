"use client";

import Link from "next/link";
import type { AICommandResponse } from "@/ai/command-types";
import { intentToReadable } from "@/ai/command-types";

type AIResponseProps = {
  response: AICommandResponse;
};

function ConfidenceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    HIGH: "border-emerald-500/30 text-emerald-400",
    MEDIUM: "border-yellow-500/30 text-yellow-400",
    LOW: "border-red-500/30 text-red-400",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[level] ?? "border-slate-700 text-slate-400"}`}>
      {level}
    </span>
  );
}

function TaskDataView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="mt-2 text-sm text-slate-500">Tidak ada data.</p>;
    return (
      <div className="mt-3 space-y-2">
        {data.map((item) => {
          if (item && typeof item === "object" && "name" in item && "id" in item) {
            const task = item as { id: string; name: string; status?: string; priority?: string; stage?: { name: string; goal?: { name: string } } };
            return (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm transition hover:border-slate-600"
              >
                <div className="min-w-0">
                  <p className="truncate text-white">{task.name}</p>
                  {task.stage && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {task.stage.goal?.name}{task.stage.goal ? " · " : ""}{task.stage.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {task.priority && <span className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-400">{task.priority}</span>}
                  {task.status && <span className="text-xs text-slate-500">{task.status}</span>}
                </div>
              </Link>
            );
          }
          return null;
        })}
      </div>
    );
  }

  const obj = data as Record<string, unknown>;

  if ("summary" in obj && obj.summary && typeof obj.summary === "object") {
    const summary = obj.summary as Record<string, unknown>;
    return (
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {typeof summary.totalHours === "number" && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-500">Total jam</p>
            <p className="mt-1 text-lg font-semibold text-white">{summary.totalHours}h</p>
          </div>
        )}
        {typeof summary.completedTasks === "number" && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-500">Task selesai</p>
            <p className="mt-1 text-lg font-semibold text-white">{summary.completedTasks}</p>
          </div>
        )}
        {typeof summary.completionRate === "number" && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-500">Completion rate</p>
            <p className="mt-1 text-lg font-semibold text-white">{summary.completionRate}%</p>
          </div>
        )}
        {typeof summary.currentStreak === "number" && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-500">Streak</p>
            <p className="mt-1 text-lg font-semibold text-white">{summary.currentStreak} hari</p>
          </div>
        )}
      </div>
    );
  }

  if ("task" in obj && obj.task && typeof obj.task === "object") {
    const task = obj.task as Record<string, unknown>;
    return (
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-white">{String(task.name ?? "")}</p>
        {typeof task.status === "string" && <p className="mt-1 text-xs text-slate-500">Status: {task.status}</p>}
        {typeof task.priority === "string" && <p className="mt-1 text-xs text-slate-500">Prioritas: {task.priority}</p>}
        {typeof task.id === "string" && <Link href={`/tasks/${task.id}`} className="mt-2 inline-block text-xs text-slate-400 hover:text-white">Lihat task →</Link>}
      </div>
    );
  }

  if ("nextAction" in obj && obj.nextAction && typeof obj.nextAction === "object") {
    const action = obj.nextAction as Record<string, unknown>;
    return (
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-white">{String(action.taskName ?? "")}</p>
        {typeof action.goalName === "string" && <p className="mt-1 text-xs text-slate-500">Goal: {action.goalName}</p>}
        {typeof action.stageName === "string" && <p className="mt-1 text-xs text-slate-500">Stage: {action.stageName}</p>}
        {typeof action.goalId === "string" && <Link href={`/goals/${action.goalId}`} className="mt-2 inline-block text-xs text-slate-400 hover:text-white">Lihat goal →</Link>}
      </div>
    );
  }

  if ("taskName" in obj && typeof obj.taskName === "string") {
    return (
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-white">{obj.taskName}</p>
      </div>
    );
  }

  if ("name" in obj && typeof obj.name === "string") {
    return (
      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-white">{obj.name}</p>
        {typeof obj.status === "string" && <p className="mt-1 text-xs text-slate-500">Status: {obj.status}</p>}
        {typeof obj.id === "string" && <Link href={`/tasks/${obj.id}`} className="mt-2 inline-block text-xs text-slate-400 hover:text-white">Lihat →</Link>}
      </div>
    );
  }

  return null;
}

export default function AIResponse({ response }: AIResponseProps) {
  const { interpretation, message, data } = response;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{intentToReadable(interpretation.intent)}</span>
        <ConfidenceBadge level={interpretation.confidenceLevel} />
      </div>
      <p className="text-sm leading-relaxed text-slate-200">{message}</p>
      {data !== undefined && data !== null && <TaskDataView data={data} />}
    </div>
  );
}
