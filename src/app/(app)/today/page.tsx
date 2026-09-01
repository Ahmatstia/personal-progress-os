import Link from "next/link";
import { FocusPanel } from "@/app/components/core/FocusPanel";
import { SessionFocusMode } from "@/app/components/core/SessionFocusMode";
import { NextActionCard } from "@/app/components/core/NextActionCard";
import QuickCapture from "@/app/components/QuickCapture";
import { getToday } from "@/services/today.service";
import { getRecentCaptures } from "@/services/capture.service";
import { requireCurrentUser } from "@/lib/auth";
import { Icon } from "@/app/components/ui/Icon";
import { PageHeader } from "@/app/components/ui/PageHeader";

export const dynamic = "force-dynamic";

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} mnt`;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} mnt`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(value);
}

function formatCaptureTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function TodayPage() {
  const user = await requireCurrentUser();
  const today = await getToday(new Date(), user.id);
  const recentCaptures = await getRecentCaptures(user.id, 8);

  const primaryFocus = today.focusTasks[0]?.task;
  const firstAvailable = today.availableTasks[0] ?? null;

  const sessionTask = today.currentSession
    ? {
        id: today.currentSession.taskId,
        name: today.currentSession.task.name,
        goalName: today.currentSession.task.stage.goal.name,
        stageName: today.currentSession.task.stage.name,
      }
    : primaryFocus
      ? { id: primaryFocus.id, name: primaryFocus.name, goalName: primaryFocus.stage.goal.name, stageName: primaryFocus.stage.name }
      : firstAvailable
        ? { id: firstAvailable.id, name: firstAvailable.name, goalName: firstAvailable.stage.goal.name, stageName: firstAvailable.stage.name }
        : null;

  const nextActionCard = firstAvailable
    ? {
        taskId: firstAvailable.id,
        goalId: firstAvailable.stage.goalId,
        goalName: firstAvailable.stage.goal.name,
        stageName: firstAvailable.stage.name,
        taskName: firstAvailable.name,
        priority: firstAvailable.priority,
        startedAt: firstAvailable.startedAt,
      }
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Hari Ini"
        title={formatDate(today.date)}
        description="Rencana yang jelas dan fokus untuk pekerjaan yang Anda pilih hari ini."
      />

      <NextActionCard nextAction={nextActionCard} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left column: focus + session */}
        <div className="space-y-6">
          <FocusPanel focus={today.focusTasks} available={today.availableTasks} />

          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai-100 text-ai-600">
                <Icon name="clock" size={16} />
              </span>
              <h2 className="text-base font-semibold text-surface-900">Sesi fokus</h2>
            </div>
            <SessionFocusMode
              taskId={sessionTask?.id ?? ""}
              taskName={sessionTask?.name ?? "task berikutnya Anda"}
              goalName={sessionTask?.goalName}
              stageName={sessionTask?.stageName}
              activeSession={
                today.currentSession
                  ? { id: today.currentSession.id, startedAt: today.currentSession.startedAt.toISOString() }
                  : null
              }
            />
          </section>
        </div>

        {/* Right column: capture + completed */}
        <div className="space-y-6">
          <QuickCapture />

          <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
            <div className="flex items-center gap-2 text-primary-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                <Icon name="inbox" size={16} />
              </span>
              <h2 className="text-base font-semibold text-surface-900">Catatan terbaru</h2>
            </div>
            {recentCaptures.length === 0 ? (
              <p className="mt-4 text-sm text-surface-500">
                Belum ada catatan. Gunakan Catat cepat untuk merekam ide sebelum hilang.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-surface-150">
                {recentCaptures.map((capture) => (
                  <li key={capture.id} className="py-2.5">
                    <p className="text-sm leading-relaxed text-surface-800">{capture.content}</p>
                    <p className="mt-0.5 text-xs text-surface-400">{formatCaptureTime(capture.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
            <div className="flex items-center gap-2 text-success-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50">
                <Icon name="check" size={16} />
              </span>
              <h2 className="text-base font-semibold text-surface-900">Selesai hari ini</h2>
            </div>
            {today.completedTasks.length === 0 ? (
              <p className="mt-4 text-sm text-surface-500">Belum ada yang selesai — momentum dimulai dari satu task yang selesai.</p>
            ) : (
              <ul className="mt-3 divide-y divide-surface-150">
                {today.completedTasks.map((task) => (
                  <li key={task.id} className="py-2.5">
                    <Link href={`/tasks/${task.id}`} className="block text-sm font-medium text-surface-800 hover:text-primary-700">
                      {task.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-surface-400">{task.stage.goal.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid grid-cols-3 gap-2">
            {[
              { label: "Belajar", value: formatMinutes(today.stats.totalMinutes) },
              { label: "Fokus selesai", value: `${today.focusCompleted}/${today.focusTotal}` },
              { label: "Task selesai", value: String(today.stats.completedTasks) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-surface-200 bg-surface-0 p-3 text-center shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-surface-400">{stat.label}</p>
                <p className="mt-1.5 text-lg font-bold text-surface-900">{stat.value}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
