import Link from "next/link";
import { FocusPanel } from "@/app/components/core/FocusPanel";
import { SessionFocusMode } from "@/app/components/core/SessionFocusMode";
import { NextActionSpotlight } from "@/app/components/core/NextActionSpotlight";
import { FocusOrb } from "@/app/components/core/FocusOrb";
import QuickCapture from "@/app/components/QuickCapture";
import { getToday } from "@/services/today.service";
import { getRecentCaptures } from "@/services/capture.service";
import { requirePageUser } from "@/lib/auth";
import { Icon } from "@/app/components/ui/Icon";
import { StatRow } from "@/app/components/ui/StatRow";
import { HistoryDeleteButton } from "@/app/components/ui/HistoryDeleteButton";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

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
  const user = await requirePageUser();
  const today = await getToday(new Date(), user.id);
  const recentCaptures = await getRecentCaptures(user.id, 6);

  const primaryFocus = today.focusTasks[0]?.task;
  const ranked = today.nextAction;

  const sessionTask = today.currentSession
    ? {
        id: today.currentSession.taskId,
        name: today.currentSession.task.name,
        goalName: today.currentSession.task.stage.goal.name,
        stageName: today.currentSession.task.stage.name,
      }
    : primaryFocus
      ? { id: primaryFocus.id, name: primaryFocus.name, goalName: primaryFocus.stage.goal.name, stageName: primaryFocus.stage.name }
      : ranked
        ? { id: ranked.taskId, name: ranked.taskName, goalName: ranked.goalName, stageName: ranked.stageName }
        : null;

  const nextActionCard = ranked
    ? {
        taskId: ranked.taskId,
        goalId: ranked.goalId,
        goalName: ranked.goalName,
        stageName: ranked.stageName,
        taskName: ranked.taskName,
        priority: ranked.priority,
        estimatedMinutes: ranked.estimatedMinutes,
        startedAt: ranked.startedAt,
      }
    : null;

  const focusPct =
    today.focusTotal === 0
      ? null
      : Math.round((today.focusCompleted / today.focusTotal) * 100);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      {/* Zone fokus — apa yang dilakukan sekarang */}
      <div className="min-w-0 space-y-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-surface-150 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Hari Ini</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              {formatDate(today.date)}
            </h1>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-surface-500">
            Fokus pada satu hal yang paling penting hari ini — sisanya menyusul.
          </p>
        </header>

        {today.currentSession ? (
          <SessionFocusMode
            key={today.currentSession.id}
            taskId={sessionTask?.id ?? ""}
            taskName={sessionTask?.name ?? "task berikutnya Anda"}
            goalName={sessionTask?.goalName}
            stageName={sessionTask?.stageName}
            activeSession={{
              id: today.currentSession.id,
              startedAt: today.currentSession.startedAt.toISOString(),
            }}
          />
        ) : (
          <NextActionSpotlight nextAction={nextActionCard} />
        )}

        <FocusPanel focus={today.focusTasks} available={today.availableTasks} />

        <section className="border-t border-surface-150 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-surface-400">Selesai hari ini</p>
              <h2 className="mt-1 text-lg font-semibold text-surface-900">Yang sudah beres</h2>
            </div>
            {today.completedTasks.length > 0 && (
              <span className="rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700">
                {today.stats.completedTasks}
              </span>
            )}
          </div>
          {today.completedTasks.length === 0 ? (
            <p className="mt-4 text-sm text-surface-500">
              Belum ada yang selesai — momentum dimulai dari satu task yang selesai.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-surface-150">
              {today.completedTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
                    <Icon name="check" size={13} strokeWidth={3} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="block truncate text-sm font-medium text-surface-800 hover:text-primary-700"
                    >
                      {task.name}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-surface-500">{task.stage.goal.name}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-surface-150 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-surface-400">Jejak</p>
              <h2 className="mt-1 text-lg font-semibold text-surface-900">Catatan terbaru</h2>
            </div>
            <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600">
              {recentCaptures.length}
            </span>
          </div>
          {recentCaptures.length === 0 ? (
            <p className="mt-4 text-sm text-surface-500">
              Belum ada catatan. Gunakan Catat cepat untuk merekam ide sebelum hilang.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-surface-150">
              {recentCaptures.map((capture) => (
                <li key={capture.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-surface-800">{capture.content}</p>
                    <p className="mt-0.5 text-xs text-surface-400">{formatCaptureTime(capture.createdAt)}</p>
                  </div>
                  <HistoryDeleteButton
                    path={`/api/captures/${capture.id}`}
                    message="Hapus catatan ini?"
                    toastMessage="Catatan dihapus."
                    aria-label="Hapus catatan"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Zone konteks — progres hari ini */}
      <aside className="mt-10 space-y-8 lg:sticky lg:top-20 lg:mt-0">
        <section className="rounded-3xl border border-surface-200 bg-surface-0 p-5 shadow-soft sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-surface-400">Hari ini</p>
              <h2 className="mt-1 text-lg font-bold text-surface-900">Rangkuman</h2>
            </div>
            <FocusOrb
              value={focusPct ?? undefined}
              size={64}
              stroke={6}
              tone={focusPct !== null && focusPct === 100 ? "success" : "primary"}
              label={focusPct === null ? "Belum ada fokus dipilih" : `Fokus selesai ${focusPct} persen`}
            >
              <span className="text-base font-bold text-surface-900">{focusPct === null ? "—" : `${focusPct}%`}</span>
              <span className="mt-0.5 text-[9px] uppercase tracking-wider text-surface-400">fokus</span>
            </FocusOrb>
          </div>
          <dl className="mt-5 space-y-3">
            <StatRow icon="clock" label="Waktu fokus" value={formatDuration(today.stats.totalMinutes)} hint="dalam sesi selesai" />
            <StatRow icon="check" tone="success" label="Task selesai" value={String(today.stats.completedTasks)} hint="dari semua task" />
            <StatRow icon="target" tone="warning" label="Prioritas selesai" value={`${today.focusCompleted}/${today.focusTotal}`} hint="dari daftar fokus" />
          </dl>
        </section>

        <QuickCapture />
      </aside>
    </div>
  );
}