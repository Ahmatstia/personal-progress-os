import Link from "next/link";
import { notFound } from "next/navigation";
import TaskActions from "@/app/components/TaskActions";
import { SessionFocusMode } from "@/app/components/core/SessionFocusMode";
import { getTaskDetail } from "@/services/task.service";
import { requirePageUser } from "@/lib/auth";
import { StatusBadge } from "@/app/components/ui/Badge";
import { Icon } from "@/app/components/ui/Icon";
import { StatRow } from "@/app/components/ui/StatRow";
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
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      {/* Ruang aksi — task itu sendiri sebagai fokus */}
      <div className="min-w-0 space-y-10">
        <header className="border-b border-surface-150 pb-8">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/goals/${task.stage.goalId}`}
              className="inline-flex items-center gap-1.5 font-medium text-surface-500 transition hover:text-primary-700"
            >
              <Icon name="arrowLeft" size={15} /> {task.stage.goal.name}
            </Link>
            <span className="text-surface-300">/</span>
            <span className="font-medium text-surface-700">{task.stage.name}</span>
          </div>

          <div className="mt-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">Task</p>
              <span className="h-1 w-1 rounded-full bg-surface-300" />
              <StatusBadge status={task.status} />
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">{task.name}</h1>
            {task.description && <p className="mt-4 text-base leading-7 text-surface-600">{task.description}</p>}
          </div>

          <div className="mt-5">
            <TaskActions
              id={task.id}
              status={task.status}
              name={task.name}
              description={task.description}
              priority={task.priority}
              estimatedHours={task.estimatedHours}
              notes={task.notes}
            />
          </div>

          <dl className="mt-8 grid gap-x-8 gap-y-2 border-t border-surface-150 pt-6 sm:grid-cols-2">
            <StatRow icon="gauge" tone="warning" label="Prioritas" value={task.priority} />
            <StatRow icon="target" label="Estimasi" value={formatHours(task.estimatedHours)} />
            <StatRow
              icon="clock"
              tone="success"
              label="Waktu aktual"
              value={formatHours(task.actualHours)}
              hint={task.actualHours > task.estimatedHours && task.estimatedHours > 0 ? "melebihi estimasi" : undefined}
            />
            <StatRow
              icon="layers"
              label="Jumlah sesi"
              value={String(task.sessions.length)}
              hint={task.sessions.length === 0 ? "belum ada sesi fokus" : undefined}
            />
          </dl>
        </header>

        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-surface-400">Riwayat</p>
              <h2 className="mt-1 text-lg font-semibold text-surface-900">Sesi terbaru</h2>
            </div>
            <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600">
              {task.sessions.length}
            </span>
          </div>
          {task.sessions.length === 0 ? (
            <p className="mt-4 text-sm text-surface-500">
              Belum ada sesi fokus. Mulai sesi pertama dari panel di samping untuk mencatat waktu dan pemahaman Anda.
            </p>
          ) : (
            <ol className="mt-3 divide-y divide-surface-150">
              {task.sessions.map((session: { id: string; activity: string | null; startedAt: Date; durationMinutes: number | null }) => (
                <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-800">{session.activity || "Sesi fokus"}</p>
                    <p className="mt-0.5 text-xs text-surface-500">{formatDate(session.startedAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-surface-600">
                      {session.durationMinutes === null ? "Aktif" : `${session.durationMinutes} mnt`}
                    </span>
                    <HistoryDeleteButton
                      path={`/api/sessions/${session.id}`}
                      message="Hapus sesi ini dari riwayat?"
                      toastMessage="Sesi dihapus."
                      aria-label="Hapus sesi"
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Stasiun fokus */}
      <aside className="mt-10 space-y-6 lg:sticky lg:top-20 lg:mt-0">
        <div>
          <p className="eyebrow text-ai-600">Fokus</p>
          <h2 className="mt-1 text-lg font-semibold text-surface-900">Stasiun sesi</h2>
          <p className="mt-1 text-sm text-surface-500">Satu task, satu sesi, tanpa gangguan.</p>
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
      </aside>
    </div>
  );
}