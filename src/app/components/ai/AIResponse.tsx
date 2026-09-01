"use client";

import Link from "next/link";
import type { AICommandResponse } from "@/ai/command-types";
import { intentToReadable } from "@/ai/command-types";
import { Badge, type Tone } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { StartSessionButton } from "../core/StartSessionButton";
import { formatDuration, formatHours } from "@/lib/format";

function ConfidenceBadge({ level }: { level: string }) {
  const tone: Tone =
    level === "HIGH" ? "success" : level === "MEDIUM" ? "warning" : "danger";
  return <Badge tone={tone}>{level === "HIGH" ? "Keyakinan tinggi" : level === "MEDIUM" ? "Keyakinan sedang" : "Keyakinan rendah"}</Badge>;
}

function TaskDataView({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    if (data.length === 0)
      return <p className="mt-2 text-sm text-surface-500">Tidak ada data ditemukan.</p>;
    return (
      <div className="mt-3 space-y-2">
        {data.map((item, i) => {
          if (item && typeof item === "object" && "name" in item && "id" in item) {
            const task = item as { id: string; name: string; status?: string; priority?: string; stage?: { name: string; goal?: { name: string } } };
            return (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="group flex items-center justify-between rounded-xl border border-surface-200 bg-surface-0 px-4 py-3 text-sm shadow-soft transition hover:border-primary-300 hover:shadow"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-surface-800">{task.name}</p>
                  {task.stage && (
                    <p className="mt-0.5 truncate text-xs text-surface-500">
                      {task.stage.goal?.name}
                      {task.stage.goal ? " · " : ""}
                      {task.stage.name}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-3">
                  {task.priority && (
                    <span className="rounded-md border border-surface-200 px-1.5 py-0.5 text-xs text-surface-500">
                      {task.priority}
                    </span>
                  )}
                  <Icon name="arrowRight" size={15} className="text-surface-300 group-hover:text-primary-500" />
                </div>
              </Link>
            );
          }
          if (item && typeof item === "object" && "name" in item && "id" in item) {
            const g = item as { id: string; name: string; status?: string };
            return (
              <Link
                key={i}
                href={`/goals/${g.id}`}
                className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-0 px-4 py-3 text-sm shadow-soft hover:border-primary-300"
              >
                <span className="font-medium text-surface-800">{g.name}</span>
                {g.status && <Badge tone="neutral">{g.status}</Badge>}
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
        {typeof summary.totalMinutes === "number" ? <SummaryChip label="Total jam" value={formatDuration(summary.totalMinutes)} /> : typeof summary.totalHours === "number" ? <SummaryChip label="Total jam" value={formatHours(summary.totalHours)} /> : null}
        {typeof summary.completedTasks === "number" && <SummaryChip label="Task selesai" value={`${summary.completedTasks}`} />}
        {typeof summary.completionRate === "number" && <SummaryChip label="Penyelesaian" value={`${summary.completionRate}%`} />}
        {typeof summary.currentStreak === "number" && <SummaryChip label="Rekor" value={`${summary.currentStreak}d`} />}
      </div>
    );
  }

  if ("task" in obj && obj.task && typeof obj.task === "object") {
    const task = obj.task as Record<string, unknown>;
    return (
      <div className="mt-3 rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-soft">
        <p className="font-semibold text-surface-800">{String(task.name ?? "")}</p>
        {typeof task.status === "string" && <p className="mt-1 text-xs text-surface-500">Status: {task.status}</p>}
        {typeof task.id === "string" && (
          <div className="mt-3 flex gap-2">
            <Link href={`/tasks/${task.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary-600 px-3 text-xs font-semibold text-white hover:bg-primary-700">
              Buka task <Icon name="arrowRight" size={13} />
            </Link>
            {typeof task.id === "string" && (
              <StartSessionButton taskId={task.id} taskName={String(task.name ?? "")} size="sm" variant="success" icon="play">
                Mulai
              </StartSessionButton>
            )}
          </div>
        )}
      </div>
    );
  }

  if ("nextAction" in obj && obj.nextAction && typeof obj.nextAction === "object") {
    const action = obj.nextAction as Record<string, unknown>;
    return (
      <div className="mt-3 rounded-xl border border-primary-100 bg-primary-50/50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">Aksi berikutnya</p>
        <p className="mt-1 font-semibold text-surface-800">{String(action.taskName ?? "")}</p>
        <div className="mt-2 text-xs text-surface-500">
          {typeof action.goalName === "string" && <p>Goal: {action.goalName}</p>}
          {typeof action.stageName === "string" && <p>Stage: {action.stageName}</p>}
        </div>
        {typeof action.taskId === "string" && (
          <div className="mt-3 flex gap-2">
            {typeof action.taskId === "string" && (
              <StartSessionButton taskId={action.taskId} taskName={String(action.taskName ?? "")} size="sm" icon="play">
                Mulai
              </StartSessionButton>
            )}
            {typeof action.goalId === "string" && (
              <Link href={`/goals/${action.goalId}`} className="inline-flex h-9 items-center gap-1 rounded-lg border border-surface-200 bg-surface-0 px-3 text-xs font-semibold text-surface-700 hover:bg-surface-100">
                Lihat goal
              </Link>
            )}
          </div>
        )}
      </div>
    );
  }

  if (("name" in obj || "taskName" in obj) && typeof (obj.name ?? obj.taskName) === "string") {
    const name = String(obj.name ?? obj.taskName);
    const id = typeof obj.id === "string" ? obj.id : null;
    return (
      <div className="mt-3 rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-soft">
        <p className="font-semibold text-surface-800">{name}</p>
        {typeof obj.status === "string" && <p className="mt-1 text-xs text-surface-500">Status: {obj.status}</p>}
        {id && typeof obj.goalId === "string" && (
          <Link href={`/goals/${obj.goalId}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700">
            Lihat <Icon name="arrowRight" size={12} />
          </Link>
        )}
      </div>
    );
  }

  return null;
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 p-3">
      <p className="text-[11px] text-surface-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-surface-800">{value}</p>
    </div>
  );
}

export default function AIResponse({ response }: { response: AICommandResponse }) {
  const { interpretation, message, data } = response;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ai" icon="sparkles">
          {intentToReadable(interpretation.intent)}
        </Badge>
        <ConfidenceBadge level={interpretation.confidenceLevel} />
      </div>
      <p className="text-sm leading-relaxed text-surface-700">{message}</p>
      {data !== undefined && data !== null && <TaskDataView data={data} />}
    </div>
  );
}
