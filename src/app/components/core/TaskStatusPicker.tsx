"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/Toast";
import { Icon } from "@/app/components/ui/Icon";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

const stages: {
  key: Status;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  activeClass: string;
  dotClass: string;
  description: string;
}[] = [
  {
    key: "NOT_STARTED",
    label: "Belum dimulai",
    shortLabel: "Belum",
    icon: <Icon name="circle" size={14} />,
    activeClass:
      "bg-surface-100 border-surface-300 text-surface-800 shadow-soft",
    dotClass: "bg-surface-400",
    description: "Task belum dikerjakan",
  },
  {
    key: "IN_PROGRESS",
    label: "Sedang dikerjakan",
    shortLabel: "Sedang",
    icon: <Icon name="play" size={14} />,
    activeClass:
      "bg-gradient-to-r from-primary-50 to-primary-100 border-primary-300 text-primary-800 shadow-[var(--shadow-glow-primary)]",
    dotClass: "bg-primary-500 animate-pulse",
    description: "Task sedang berjalan",
  },
  {
    key: "COMPLETED",
    label: "Selesai",
    shortLabel: "Selesai",
    icon: <Icon name="check" size={14} strokeWidth={2.5} />,
    activeClass:
      "bg-gradient-to-r from-success-50 to-success-100 border-success-300 text-success-800 shadow-[0_0_0_3px_rgba(47,162,99,0.12)]",
    dotClass: "bg-success-500",
    description: "Task selesai dikerjakan",
  },
];

export function TaskStatusPicker({
  taskId,
  status,
}: {
  taskId: string;
  status: Status;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [current, setCurrent] = useState<Status>(status);
  const [loading, setLoading] = useState<Status | null>(null);

  async function select(next: Status) {
    if (next === current || loading) return;
    setLoading(next);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          ...(next === "COMPLETED" ? {} : {}),
        }),
      });
      if (!res.ok) throw new Error();
      setCurrent(next);
      const labels: Record<Status, string> = {
        NOT_STARTED: "Task dikembalikan ke awal.",
        IN_PROGRESS: "Task dimulai. Semangat! 💪",
        COMPLETED: "Task selesai! Bagus sekali! 🎉",
      };
      toast(labels[next], next === "COMPLETED" ? "success" : "info");
      router.refresh();
    } catch {
      toast("Gagal memperbarui status.", "error");
    } finally {
      setLoading(null);
    }
  }

  const currentStage = stages.find((s) => s.key === current) ?? stages[0];

  return (
    <div className="space-y-2">
      {/* Active status indicator */}
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${currentStage.dotClass}`} />
        <span className="text-[12px] font-semibold text-surface-500">
          Status saat ini:{" "}
          <span className="text-surface-800">{currentStage.label}</span>
        </span>
      </div>

      {/* Segmented picker */}
      <div
        role="group"
        aria-label="Pilih status task"
        className="flex gap-1.5 rounded-2xl border border-surface-150 bg-surface-50 p-1.5"
      >
        {stages.map((stage, idx) => {
          const isActive = stage.key === current;
          const isLoading = loading === stage.key;
          // Connector line
          const showConnector = idx < stages.length - 1;
          const leftDone =
            stages.findIndex((s) => s.key === current) > idx;

          return (
            <div key={stage.key} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => select(stage.key)}
                disabled={!!loading}
                aria-pressed={isActive}
                aria-label={stage.label}
                title={stage.description}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
                  isActive
                    ? `${stage.activeClass} status-ripple`
                    : "border-transparent text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                }`}
              >
                {isLoading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  stage.icon
                )}
                <span className="hidden sm:inline">{stage.shortLabel}</span>
                <span className="sm:hidden">{stage.icon}</span>
              </button>

              {showConnector && (
                <div
                  aria-hidden="true"
                  className={`mx-1 h-px flex-shrink-0 w-4 transition-colors duration-300 ${
                    leftDone ? "bg-success-300" : "bg-surface-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress steps label row */}
      <div className="flex items-center justify-between px-2">
        {stages.map((stage) => (
          <span
            key={stage.key}
            className={`text-[10px] font-medium transition-colors ${
              stage.key === current
                ? "text-surface-700"
                : "text-surface-400"
            }`}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  );
}
