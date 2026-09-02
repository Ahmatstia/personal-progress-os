import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth";
import StageForm from "@/app/components/StageForm";
import GoalActions from "@/app/components/GoalActions";
import NewTaskButton from "@/app/components/NewTaskButton";
import TaskList from "@/app/components/TaskList";
import StageActions from "@/app/components/StageActions";
import { calculateGoalProgress, calculateStageProgress } from "@/services/progress.service";
import { Button } from "@/app/components/ui/Button";
import { StatusBadge } from "@/app/components/ui/Badge";
import { ProgressBar } from "@/app/components/ui/Progress";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { StatRow } from "@/app/components/ui/StatRow";
import { formatHours } from "@/lib/format";
import { Icon } from "@/app/components/ui/Icon";
import { JourneyRoute, CurrentWaypointTag } from "@/app/components/core/JourneyRoute";

export const dynamic = "force-dynamic";

type GoalPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(value);
}

export default async function GoalPage({ params }: GoalPageProps) {
  const { id } = await params;
  const user = await requirePageUser();

  const goal = await prisma.goal.findUnique({
    where: { id, userId: user.id },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: { tasks: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!goal) notFound();

  const allTasks = goal.stages.flatMap((stage) => stage.tasks);
  const progress = calculateGoalProgress(goal.stages);
  const completedTasks = allTasks.filter((task) => task.status === "COMPLETED").length;
  const completedStages = goal.stages.filter((stage) => stage.tasks.length > 0 && calculateStageProgress(stage.tasks) === 100).length;

  const currentStageIndex = goal.stages.findIndex((stage) =>
    stage.tasks.some((task) => task.status !== "COMPLETED"),
  );
  const waypoints = goal.stages.map((stage, index) => ({
    id: stage.id,
    label: stage.name,
    status:
      currentStageIndex === -1 ||
      index < currentStageIndex
        ? ("COMPLETED" as const)
        : index === currentStageIndex
          ? ("CURRENT" as const)
          : ("UPCOMING" as const),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link
          href="/goals"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-primary-700"
        >
          <Icon name="arrowLeft" size={15} /> Goals
        </Link>
      </div>

      {/* Header card */}
      <section className="overflow-hidden rounded-3xl border border-surface-200 bg-gradient-to-br from-surface-0 to-primary-50/40 p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">{goal.type}</p>
              <span className="h-1 w-1 rounded-full bg-surface-300" />
              <StatusBadge status={goal.status} />
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 md:text-4xl">{goal.name}</h1>
            {goal.description && <p className="mt-4 leading-7 text-surface-600">{goal.description}</p>}
          </div>
          {goal.targetDate && (
            <div className="shrink-0 rounded-xl border border-surface-200 bg-surface-0 px-4 py-3">
              <p className="text-xs text-surface-500">Target tanggal</p>
              <p className="mt-1 text-sm font-semibold text-surface-800">{formatDate(goal.targetDate)}</p>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-surface-150 pt-6">
          <div className="mb-2.5 flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-surface-700">Progres keseluruhan</p>
              <p className="mt-0.5 text-xs text-surface-500">Di seluruh stage dan task</p>
            </div>
            <span className="text-3xl font-bold text-primary-700">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>

        <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
          <StatRow icon="layers" label="Jumlah stage" value={String(goal.stages.length)} />
          <StatRow icon="check" tone="success" label="Stage selesai" value={String(completedStages)} />
          <StatRow icon="target" tone="warning" label="Task selesai" value={`${completedTasks}/${allTasks.length}`} />
          <StatRow icon="clock" label="Estimasi usaha" value={formatHours(allTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0))} />
        </dl>
      </section>

      {/* Roadmap */}
      <section>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">Peta jalan</p>
            <h2 className="mt-1 text-2xl font-semibold text-surface-900">Perjalanan Anda</h2>
            <p className="mt-1.5 text-sm text-surface-500">Pecah goal menjadi stage, lalu task, lalu sesi fokus.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StageForm goalId={goal.id} nextOrder={goal.stages.length} />
            <Link href={`/goals/${goal.id}/reviews`}>
              <Button variant="secondary" icon="sparkles" size="sm">
                Review progres
              </Button>
            </Link>
            <Link href={`/dashboard?goalId=${goal.id}`}>
              <Button variant="ghost" icon="chart" size="sm">
                Analytics
              </Button>
            </Link>
            <GoalActions goalId={goal.id} goalName={goal.name} />
          </div>
        </div>

        {goal.stages.length > 0 && (
          <div className="mb-6 rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
            <p className="eyebrow mb-3 text-surface-400">Posisi Anda</p>
            <JourneyRoute waypoints={waypoints} size="md" />
          </div>
        )}

        {goal.stages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-0 p-10 text-center shadow-soft">
            <EmptyState
              icon="layers"
              title="Belum ada stage"
              description="Tambahkan stage pertama untuk mulai membentuk goal ini menjadi jalur yang jelas."
              action={<StageForm goalId={goal.id} nextOrder={0} />}
            />
          </div>
        ) : (
          <div className="relative space-y-5">
            <span className="pointer-events-none absolute left-6 top-3 bottom-3 hidden w-px bg-surface-200 md:block" aria-hidden="true" />
            {goal.stages.map((stage, index) => {
              const stageProgress = calculateStageProgress(stage.tasks);
              const completed = stage.tasks.filter((task) => task.status === "COMPLETED").length;
              const total = stage.tasks.length;
              const isCompleted = total > 0 && completed === total;
              const isCurrent = index === currentStageIndex;

              return (
                <article
                  key={stage.id}
                  className={`relative rounded-2xl border bg-surface-0 p-5 shadow-soft md:pl-16 ${
                    isCurrent
                      ? "border-primary-300 ring-1 ring-primary-100"
                      : isCompleted
                        ? "border-success-200"
                        : "border-surface-200"
                  }`}
                >
                  <div className="absolute left-3 top-6 hidden h-6 w-6 shrink-0 flex-col items-center md:flex">
                    <span
                      className={`relative flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        isCompleted ? "bg-success-500 text-white" : isCurrent ? "bg-primary-600 text-white" : "bg-surface-200 text-surface-600"
                      }`}
                    >
                      {isCompleted ? <Icon name="check" size={13} /> : index + 1}
                      {isCurrent && <span aria-hidden="true" className="halo" />}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Stage {index + 1}</p>
                        {isCurrent && <CurrentWaypointTag />}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-surface-900">{stage.name}</h3>
                      {stage.description && <p className="mt-2 text-sm leading-6 text-surface-500">{stage.description}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-1 md:items-end">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-surface-900">{stageProgress}%</span>
                        <span className="text-xs text-surface-500">
                          {completed}/{total} task
                        </span>
                      </div>
                      <div className="w-full md:w-40">
                        <ProgressBar value={stageProgress} size="sm" tone={isCompleted ? "success" : "primary"} />
                      </div>
                      <StageActions
                        id={stage.id}
                        name={stage.name}
                        description={stage.description}
                        canMoveUp={index > 0}
                        canMoveDown={index < goal.stages.length - 1}
                      />
                    </div>
                  </div>

                  <TaskList tasks={stage.tasks} />
                  <NewTaskButton stageId={stage.id} />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}