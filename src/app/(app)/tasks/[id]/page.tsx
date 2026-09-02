import Link from "next/link";
import { notFound } from "next/navigation";
import TaskActions from "@/app/components/TaskActions";
import { SessionFocusMode } from "@/app/components/core/SessionFocusMode";
import { getTaskDetail } from "@/services/task.service";
import { requirePageUser } from "@/lib/auth";
import { StatusBadge } from "@/app/components/ui/Badge";
import { Icon } from "@/app/components/ui/Icon";
import { StatRow } from "@/app/components/ui/StatRow";
import { SectionHeader } from "@/app/components/ui/SectionHeader";
import { HistoryDeleteButton } from "@/app/components/ui/HistoryDeleteButton";
import { formatHours } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  const detail = await getTaskDetail(id, user.id);
  if (!detail) notFound();

  const { task, activeSession } = detail;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link
          href={`/goals/${task.stage.goalId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-primary-700"
        >
          <Icon name="arrowLeft" size={15} /> {task.stage.goal.name}
        </Link>
        <span className="text-surface-300">/</span>
        <span className="text-sm font-medium text-surface-700">{task.stage.name}</span>
      </div>

      <section className="rounded-3xl border border-surface-200 bg-surface-0 p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">Task</p>
              <span className="h-1 w-1 rounded-full bg-surface-300" />
              <StatusBadge status={task.status} />
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 md:text-4xl">{task.name}</h1>
            {task.description && <p className="mt-3 leading-7 text-surface-600">{task.description}</p>}
          </div>
        </div>

        <TaskActions
          id={task.id}
          status={task.status}
          name={task.name}
          description={task.description}
          priority={task.priority}
          estimatedHours={task.estimatedHours}
          notes={task.notes}
        />

        <div className="mt-6 grid gap-x-8 gap-y-1 border-t border-surface-150 pt-4 sm:grid-cols-2">
          <StatRow icon="gauge" tone="warning" label="Prioritas" value={task.priority} />
          <StatRow icon="target" label="Estimasi" value={formatHours(task.estimatedHours)} />
          <StatRow icon="clock" tone="success" label="Waktu aktual" value={formatHours(task.actualHours)} hint={task.actualHours > task.estimatedHours && task.estimatedHours > 0 ? "melebihi estimasi" : undefined} />
          <StatRow icon="layers" label="Jumlah sesi" value={String(task.sessions.length)} hint={task.sessions.length === 0 ? "belum ada sesi fokus" : undefined} />
        </div>
      </section>

      <section>
        <SectionHeader
          icon="clock"
          iconTone="ai"
          eyebrow="Sesi fokus"
          title="Fokus pada task ini"
          description="Waktu yang Anda habiskan untuk satu task sekaligus."
        />
        <div className="mt-3">
          <SessionFocusMode
            key={activeSession?.id ?? "idle"}
            taskId={task.id}
            taskName={task.name}
            goalName={task.stage.goal.name}
            stageName={task.stage.name}
            activeSession={activeSession ? { id: activeSession.id, startedAt: activeSession.startedAt.toISOString() } : null}
            idleCta="Mulai sesi fokus"
          />
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Riwayat" title="Sesi terbaru" />
        {task.sessions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-surface-300 p-5 text-sm text-surface-500">
            Belum ada sesi fokus. Mulai sesi pertama untuk mencatat waktu dan pemahaman Anda.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {task.sessions.map((session: { id: string; activity: string | null; startedAt: Date; durationMinutes: number | null }) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-soft"
              >
                <div>
                  <p className="text-sm font-medium text-surface-800">{session.activity || "Sesi fokus"}</p>
                  <p className="mt-1 text-xs text-surface-500">{formatDate(session.startedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-surface-600">
                    {session.durationMinutes === null ? "Aktif" : `${session.durationMinutes}mnt`}
                  </span>
                  <HistoryDeleteButton
                    path={`/api/sessions/${session.id}`}
                    message="Hapus sesi ini dari riwayat?"
                    toastMessage="Sesi dihapus."
                    aria-label="Hapus sesi"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}