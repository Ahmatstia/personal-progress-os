import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import StageForm from "@/app/components/StageForm";
import NewTaskButton from "@/app/components/NewTaskButton";
import TaskList from "@/app/components/TaskList";
import StageActions from "@/app/components/StageActions";
import { calculateGoalProgress, calculateStageProgress } from "@/services/progress.service";
import { Button } from "@/app/components/ui/Button";
import { StatusBadge } from "@/app/components/ui/Badge";
import { ProgressBar } from "@/app/components/ui/Progress";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Icon } from "@/app/components/ui/Icon";

export const dynamic = "force-dynamic";

type GoalPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }).format(value);
}

export default async function GoalPage({ params }: GoalPageProps) {
  const { id } = await params;
  const user = await requireCurrentUser();

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
              <p className="text-xs text-surface-500">Target date</p>
              <p className="mt-1 text-sm font-semibold text-surface-800">{formatDate(goal.targetDate)}</p>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-surface-150 pt-6">
          <div className="mb-2.5 flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-surface-700">Overall progress</p>
              <p className="mt-0.5 text-xs text-surface-500">Across all stages and tasks</p>
            </div>
            <span className="text-3xl font-bold text-primary-700">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Stages", value: String(goal.stages.length) },
            { label: "Stages done", value: String(completedStages) },
            { label: "Tasks done", value: `${completedTasks}/${allTasks.length}` },
            { label: "Est. effort", value: `${allTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0).toFixed(1)}h` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-surface-200 bg-surface-0 p-4">
              <p className="text-xs text-surface-500">{stat.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-surface-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">Roadmap</p>
            <h2 className="mt-1 text-2xl font-semibold text-surface-900">Your journey</h2>
            <p className="mt-1.5 text-sm text-surface-500">Break the goal into stages, then tasks, then focused sessions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StageForm goalId={goal.id} nextOrder={goal.stages.length} />
            <Link href={`/goals/${goal.id}/reviews`}>
              <Button variant="secondary" icon="sparkles" size="sm">
                Review progress
              </Button>
            </Link>
            <Link href={`/dashboard?goalId=${goal.id}`}>
              <Button variant="ghost" icon="chart" size="sm">
                Analytics
              </Button>
            </Link>
          </div>
        </div>

        {goal.stages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-0 p-10 text-center shadow-soft">
            <EmptyState
              icon="layers"
              title="No stages yet"
              description="Add the first stage to start shaping this goal into a clear path."
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

              return (
                <article key={stage.id} className="relative rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft md:pl-16">
                  <div className="absolute left-3 top-6 hidden h-6 w-6 shrink-0 flex-col items-center md:flex">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        isCompleted ? "bg-success-500 text-white" : "bg-primary-600 text-white"
                      }`}
                    >
                      {isCompleted ? <Icon name="check" size={13} /> : index + 1}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Stage {index + 1}</p>
                      <h3 className="mt-1 text-lg font-semibold text-surface-900">{stage.name}</h3>
                      {stage.description && <p className="mt-2 text-sm leading-6 text-surface-500">{stage.description}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-1 md:items-end">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-surface-900">{stageProgress}%</span>
                        <span className="text-xs text-surface-500">
                          {completed}/{total} tasks
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
