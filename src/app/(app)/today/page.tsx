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
      ? {
          id: primaryFocus.id,
          name: primaryFocus.name,
          goalName: primaryFocus.stage.goal.name,
          stageName: primaryFocus.stage.name,
        }
      : ranked
        ? {
            id: ranked.taskId,
            name: ranked.taskName,
            goalName: ranked.goalName,
            stageName: ranked.stageName,
          }
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
    <div className="lg:grid lg:grid-cols-[1fr_268px] lg:items-start lg:gap-5">
      {/* Left — main focus zone */}
      <div className="min-w-0 space-y-5">
        {/* Page header */}
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-surface-100 pb-4">
          <div>
            <p className="eyebrow text-primary-600">Hari Ini</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">
              {formatDate(today.date)}
            </h1>
          </div>
          <p className="max-w-xs text-[12.5px] leading-relaxed text-surface-500">
            Fokus pada satu hal yang paling penting hari ini.
          </p>
        </header>

        {/* Session / Next action */}
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

        {/* Completed today */}
        <section className="rounded-2xl border border-surface-150 bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-success-50 text-success-600">
                <Icon name="check" size={13} strokeWidth={2.5} />
              </span>
              <p className="text-[13px] font-semibold text-surface-800">Yang sudah beres</p>
            </div>
            {today.completedTasks.length > 0 && (
              <span className="chip bg-success-100 text-success-700">
                {today.stats.completedTasks}
              </span>
            )}
          </div>
          {today.completedTasks.length === 0 ? (
            <p className="text-[13px] text-surface-400">
              Belum ada yang selesai — momentum dimulai dari satu task.
            </p>
          ) : (
            <ul className="divide-y divide-surface-100">
              {today.completedTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="block truncate text-[13px] font-medium text-surface-800 hover:text-primary-700 transition-colors"
                    >
                      {task.name}
                    </Link>
                    <p className="mt-0.5 truncate text-[11px] text-surface-400">
                      {task.stage.goal.name}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Captures */}
        <section className="rounded-2xl border border-surface-150 bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon name="inbox" size={13} />
              </span>
              <p className="text-[13px] font-semibold text-surface-800">Catatan terbaru</p>
            </div>
            <span className="chip bg-surface-100 text-surface-500">
              {recentCaptures.length}
            </span>
          </div>
          {recentCaptures.length === 0 ? (
            <p className="text-[13px] text-surface-400">
              Belum ada catatan. Gunakan Catat cepat untuk merekam ide.
            </p>
          ) : (
            <ul className="divide-y divide-surface-100">
              {recentCaptures.map((capture) => (
                <li
                  key={capture.id}
                  className="flex items-start justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed text-surface-800">
                      {capture.content}
                    </p>
                    <p className="mt-0.5 text-[11px] text-surface-400">
                      {formatCaptureTime(capture.createdAt)}
                    </p>
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

      {/* Right — sticky context panel */}
      <aside className="mt-5 space-y-4 lg:sticky lg:top-16 lg:mt-0">
        {/* Stats card */}
        <section className="rounded-2xl border border-surface-150 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="eyebrow text-surface-400">Hari ini</p>
              <p className="mt-0.5 text-[15px] font-bold text-surface-900">Rangkuman</p>
            </div>
            <FocusOrb
              value={focusPct ?? undefined}
              size={52}
              stroke={5}
              tone={focusPct !== null && focusPct === 100 ? "success" : "primary"}
              label={
                focusPct === null
                  ? "Belum ada fokus dipilih"
                  : `Fokus selesai ${focusPct} persen`
              }
            >
              <span className="text-[13px] font-bold text-surface-900">
                {focusPct === null ? "—" : `${focusPct}%`}
              </span>
              <span className="text-[8px] uppercase tracking-wider text-surface-400">
                fokus
              </span>
            </FocusOrb>
          </div>
          <dl className="space-y-0">
            <StatRow
              icon="clock"
              label="Waktu fokus"
              value={formatDuration(today.stats.totalMinutes)}
              hint="dalam sesi selesai"
            />
            <StatRow
              icon="check"
              tone="success"
              label="Task selesai"
              value={String(today.stats.completedTasks)}
            />
            <StatRow
              icon="target"
              tone="warning"
              label="Prioritas"
              value={`${today.focusCompleted}/${today.focusTotal}`}
              hint="dari daftar fokus"
            />
          </dl>
        </section>

        <QuickCapture />
      </aside>
    </div>
  );
}