import Link from "next/link";
import { notFound } from "next/navigation";
import SessionTimer from "@/app/components/SessionTimer";
import TaskActions from "@/app/components/TaskActions";
import { getTaskDetail } from "@/services/task.service";
import { requireCurrentUser } from "@/lib/auth";

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
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href={`/goals/${task.stage.goalId}`} className="text-sm text-slate-500 hover:text-white">Back to {task.stage.goal.name}</Link>
        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{task.stage.name}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">{task.name}</h1>
            {task.description && <p className="mt-3 max-w-2xl text-slate-400">{task.description}</p>}
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{task.status}</span>
        </div>
        <TaskActions id={task.id} status={task.status} name={task.name} description={task.description} priority={task.priority} estimatedHours={task.estimatedHours} notes={task.notes} />

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[['Priority', task.priority], ['Estimated', `${task.estimatedHours}h`], ['Actual', `${task.actualHours.toFixed(1)}h`], ['Sessions', String(task.sessions.length)]].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-white">{value}</p></div>
          ))}
        </div>

        <div className="mt-6"><SessionTimer taskId={task.id} taskName={task.name} activeSession={activeSession ? { id: activeSession.id, startedAt: activeSession.startedAt.toISOString() } : null} /></div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-white">Recent sessions</h2>
          <div className="mt-3 space-y-2">
            {task.sessions.length === 0 && <p className="rounded-xl border border-dashed border-slate-800 p-5 text-sm text-slate-500">No sessions yet.</p>}
            {task.sessions.map((session: { id: string; activity: string | null; startedAt: Date; durationMinutes: number | null }) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"><div><p className="text-sm text-slate-300">{session.activity || "Session"}</p><p className="mt-1 text-xs text-slate-500">{formatDate(session.startedAt)}</p></div><span className="font-mono text-sm text-slate-400">{session.durationMinutes ?? "Active"}{session.durationMinutes === null ? "" : "m"}</span></div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
