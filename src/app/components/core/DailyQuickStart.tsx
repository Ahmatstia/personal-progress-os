"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/app/components/ui/Icon";
import { useToast } from "@/app/components/ui/Toast";

type Task = {
  id: string;
  name: string;
  goalName: string;
  stageName: string;
  priority: string;
  estimatedHours: number;
};

export function DailyQuickStart({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  if (tasks.length === 0 || added.size === tasks.length) return null;

  async function addToFocus(taskId: string, taskName: string) {
    if (loading) return;
    setLoading(taskId);
    try {
      const res = await fetch("/api/today/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error?.message ?? "Gagal menambahkan task.", "error");
        return;
      }
      setAdded((prev) => new Set([...prev, taskId]));
      toast(`"${taskName}" ditambahkan ke fokus hari ini.`, "success");
      router.refresh();
    } catch {
      toast("Gagal menambahkan task.", "error");
    } finally {
      setLoading(null);
    }
  }

  const priorityLabel: Record<string, string> = {
    HIGH: "Prioritas tinggi",
    MEDIUM: "Prioritas sedang",
    LOW: "Prioritas rendah",
  };

  const priorityDot: Record<string, string> = {
    HIGH: "bg-danger-500",
    MEDIUM: "bg-warning-500",
    LOW: "bg-surface-400",
  };

  const visibleTasks = tasks.filter((t) => !added.has(t.id));

  return (
    <section className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50/80 to-white p-5 shadow-soft">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-ai-600 text-white shadow-sm">
          <Icon name="sparkles" size={16} />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary-500">Quick Start</p>
          <p className="mt-0.5 text-[15px] font-bold text-surface-900">Mulai Hari Ini</p>
          <p className="text-[12px] text-surface-500">Pilih task untuk difokuskan hari ini.</p>
        </div>
      </div>

      {/* Task list */}
      <ul className="space-y-2">
        {visibleTasks.slice(0, 3).map((task) => (
          <li
            key={task.id}
            className="group flex items-center gap-3 rounded-xl border border-primary-100 bg-white px-3 py-2.5 shadow-soft hover:border-primary-200 hover:shadow-[var(--shadow-card-hover)] transition-all"
          >
            {/* Priority dot */}
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${priorityDot[task.priority] ?? "bg-surface-400"}`}
              title={priorityLabel[task.priority]}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-surface-900">{task.name}</p>
              <p className="truncate text-[11px] text-surface-400">
                {task.goalName}
                {task.stageName ? ` · ${task.stageName}` : ""}
                {task.estimatedHours > 0 ? ` · ~${task.estimatedHours}j` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => addToFocus(task.id, task.name)}
              disabled={loading === task.id}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-primary-700 disabled:opacity-60"
            >
              {loading === task.id ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Icon name="plus" size={11} />
                  Tambah
                </>
              )}
            </button>
          </li>
        ))}
      </ul>

      {tasks.length > 3 && (
        <p className="mt-3 text-center text-[11px] text-surface-400">
          +{tasks.length - 3} task lainnya tersedia di panel di bawah.
        </p>
      )}
    </section>
  );
}
