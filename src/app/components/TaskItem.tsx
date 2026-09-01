"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TaskItemProps = {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  status: string;
};

export default function TaskItem({
  id,
  name,
  description,
  priority,
  status,
}: TaskItemProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const completed = status === "COMPLETED";

  async function toggleTask() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: completed ? "NOT_STARTED" : "COMPLETED",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memperbarui task.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "Gagal memperbarui task.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition ${
        completed
          ? "border-emerald-500/10 bg-emerald-500/[0.03]"
          : "border-slate-800/70 bg-slate-950"
      }`}
    >
      <button
        type="button"
        onClick={toggleTask}
        disabled={isLoading}
        aria-label={
          completed ? `Mark ${name} as incomplete` : `Mark ${name} as completed`
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        {/* CHECKBOX */}
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
            completed
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700 bg-transparent"
          }`}
        >
          {completed && <span className="text-xs font-bold">✓</span>}
        </span>

        {/* TASK INFO */}
        <span className="min-w-0">
          <span
            className={`block truncate text-sm transition ${
              completed ? "text-slate-600 line-through" : "text-slate-300"
            }`}
          >
            {name}
          </span>

          {description && (
            <span
              className={`mt-1 block truncate text-xs ${
                completed ? "text-slate-700" : "text-slate-600"
              }`}
            >
              {description}
            </span>
          )}
        </span>
      </button>

      {/* PRIORITY */}
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
          priority === "HIGH"
            ? "bg-red-500/10 text-red-400"
            : priority === "LOW"
              ? "bg-slate-800 text-slate-500"
              : "bg-yellow-500/10 text-yellow-400"
        }`}
      >
        {priority}
      </span>
    </div>
  );
}
