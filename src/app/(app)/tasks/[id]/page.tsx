import Link from "next/link";
import { notFound } from "next/navigation";
import TaskActions from "@/app/components/TaskActions";
import { SessionFocusMode } from "@/app/components/core/SessionFocusMode";
import { getTaskDetail } from "@/services/task.service";
import { requireCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/app/components/ui/Badge";
import { Icon } from "@/app/components/ui/Icon";
import { HistoryDeleteButton } from "@/app/components/ui/HistoryDeleteButton";
import { formatHours } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
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
          <Icon name="arrowLeft" size={15} /> Kembali ke {task.stage.goal.name}
        </Link>
      </div>

      <section className="rounded-3xl border border-surface-200 bg-surface-0 p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">{task.stage.name}</p>
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

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Prioritas", value: task.priority },
            { label: "Estimasi", value: formatHours(task.estimatedHours) },
            { label: "Aktual", value: formatHours(task.actualHours) },
            { label: "Sesi", value: String(task.sessions.length) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
              <p className="text-xs text-surface-500">{stat.label}</p>
              <p className="mt-1.5 text-xl font-bold text-surface-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai-100 text-ai-600">
            <Icon name="clock" size={16} />
          </span>
          <h2 className="text-base font-semibold text-surface-900">Sesi fokus</h2>
        </div>
        <SessionFocusMode
          key={activeSession?.id ?? "idle"}
          taskId={task.id}
          taskName={task.name}
          goalName={task.stage.goal.name}
          stageName={task.stage.name}
          activeSession={activeSession ? { id: activeSession.id, startedAt: activeSession.startedAt.toISOString() } : null}
          idleCta="Mulai sesi fokus"
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-surface-900">Sesi terbaru</h2>
        {task.sessions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-surface-300 p-5 text-sm text-surface-500">
            Belum ada sesi fokus.
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
