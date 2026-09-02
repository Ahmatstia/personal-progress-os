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
import { formatHours } from "@/lib/format";
import { Icon } from "@/app/components/ui/Icon";
import { JourneyRoute, CurrentWaypointTag } from "@/app/components/core/JourneyRoute";
import { FocusOrb } from "@/app/components/core/FocusOrb";

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
  const totalEstimatedHours = allTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);

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
    <div className="space-y-12">
      {/* Header — pita terbuka, sebab struktur utama halaman adalah jalur di bawahnya */}
      <header className="relative overflow-hidden border-b border-surface-150 pb-10 pt-2 md:pb-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-primary-100/40 blur-3xl"
        />
        <div className="relative">
          <Link
            href="/goals"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-primary-700"
          >
            <Icon name="arrowLeft" size={15} /> Goals
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">{goal.type}</p>
                <span className="h-1 w-1 rounded-full bg-surface-300" />
                <StatusBadge status={goal.status} />
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 md:text-5xl">{goal.name}</h1>
              {goal.description && <p className="mt-4 max-w-2xl text-base leading-7 text-surface-600">{goal.description}</p>}

              <div className="mt-7 max-w-xl">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-medium text-surface-700">Progres keseluruhan</p>
                  <span className="text-lg font-bold text-primary-700">{progress}%</span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={progress} />
                </div>
                <p className="mt-2.5 text-xs text-surface-500">
                  {completedTasks}/{allTasks.length} task selesai · {completedStages}/{goal.stages.length} stage selesai ·
                  ± {formatHours(totalEstimatedHours)} estimasi
                  {goal.targetDate ? ` · hingga ${formatDate(goal.targetDate)}` : ""}
                </p>
              </div>
            </div>

            <div className="hidden lg:flex lg:justify-center">
              <FocusOrb
                value={progress}
                size={140}
                stroke={9}
                tone="primary"
                label={`Progres goal ${goal.name} ${progress} persen`}
              >
                <span className="text-3xl font-bold text-surface-900">{progress}%</span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-surface-400">selesai</span>
              </FocusOrb>
            </div>
          </div>
        </div>
      </header>

      {/* Peta jalan — backbone halaman, berdiri sendiri di luar card */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-surface-400">Peta jalan</p>
            <h2 className="mt-1 text-2xl font-bold text-surface-900">Perjalanan Anda</h2>
            <p className="mt-1.5 text-sm text-surface-500">Satu perjalanan dibagi menjadi stage — dan setiap stage menjadi task.</p>
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

        {goal.stages.length > 0 ? (
          <>
            <div className="mt-8">
              <JourneyRoute waypoints={waypoints} size="md" label="Peta jalan goal" />
            </div>
            <p className="mt-3 text-xs text-surface-500">
              {currentStageIndex === -1
                ? "Semua stage selesai — perjalanan telah sampai di tujuan."
                : `Anda berada di stage ${currentStageIndex + 1} dari ${goal.stages.length}. Stage selesai tampak tenang, stage saat ini bersinar, sisanya menunggu.`}
            </p>
          </>
        ) : (
          <div className="mt-8 border-t border-dashed border-surface-200 pt-10">
            <EmptyState
              icon="layers"
              title="Belum ada stage"
              description="Tambahkan stage pertama untuk mulai membentuk goal ini menjadi jalur yang jelas."
              action={<StageForm goalId={goal.id} nextOrder={0} />}
            />
          </div>
        )}
      </section>

      {/* Timeline stage */}
      {goal.stages.length > 0 && (
        <section className="border-t border-surface-150">
          <ol className="divide-y divide-surface-150">
            {goal.stages.map((stage, index) => {
              const stageProgress = calculateStageProgress(stage.tasks);
              const completed = stage.tasks.filter((task) => task.status === "COMPLETED").length;
              const total = stage.tasks.length;
              const isCompleted = total > 0 && completed === total;
              const isCurrent = index === currentStageIndex;

              return (
                <li
                  key={stage.id}
                  className={`relative py-8 sm:py-10 ${isCurrent ? "bg-primary-50/30" : ""}`}
                >
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-10">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            isCompleted
                              ? "bg-success-500 text-white"
                              : isCurrent
                                ? "bg-primary-600 text-white"
                                : "bg-surface-200 text-surface-600"
                          }`}
                        >
                          {isCompleted ? (
                            <Icon name="check" size={16} strokeWidth={3} />
                          ) : (
                            <span className="font-mono">{index + 1}</span>
                          )}
                          {isCurrent && <span aria-hidden="true" className="halo" />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-500">
                              Stage {index + 1}
                            </p>
                            {isCurrent && <CurrentWaypointTag />}
                          </div>
                          <h3
                            className={`mt-1 text-lg font-semibold sm:text-xl ${
                              isCompleted ? "text-surface-500" : isCurrent ? "text-surface-900" : "text-surface-700"
                            }`}
                          >
                            {stage.name}
                          </h3>
                        </div>
                      </div>

                      {stage.description && <p className="mt-4 text-sm leading-6 text-surface-500">{stage.description}</p>}

                      <div className="mt-6">
                        <TaskList tasks={stage.tasks} />
                      </div>
                      <div className="mt-4">
                        <NewTaskButton stageId={stage.id} />
                      </div>
                    </div>

                    <aside className="shrink-0 lg:border-l lg:border-surface-150 lg:pl-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-surface-900">{stageProgress}%</span>
                        <span className="text-xs text-surface-500">
                          {completed}/{total} task
                        </span>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={stageProgress} size="sm" tone={isCompleted ? "success" : "primary"} />
                      </div>
                      <div className="mt-4">
                        <StageActions
                          id={stage.id}
                          name={stage.name}
                          description={stage.description}
                          canMoveUp={index > 0}
                          canMoveDown={index < goal.stages.length - 1}
                        />
                      </div>
                    </aside>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}