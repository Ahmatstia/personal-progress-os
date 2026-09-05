import Link from "next/link";
import { notFound } from "next/navigation";
import { getGoalDetail } from "@/services/goal.service";
import { getAreas } from "@/services/area.service";
import { requirePageUser } from "@/lib/auth";
import StageForm from "@/app/components/StageForm";
import GoalActionsMenu from "@/app/components/GoalActionsMenu";
import NewTaskButton from "@/app/components/NewTaskButton";
import TaskList from "@/app/components/TaskList";
import StageActions from "@/app/components/StageActions";
import {
  calculateGoalProgress,
  calculateStageProgress,
} from "@/services/progress.service";
import { StatusBadge } from "@/app/components/ui/Badge";
import { ProgressBar } from "@/app/components/ui/Progress";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { formatHours } from "@/lib/format";
import { Icon } from "@/app/components/ui/Icon";
import { CurrentWaypointTag } from "@/app/components/core/JourneyRoute";
import { JourneyPath } from "@/app/components/core/JourneyPath";
import { FocusOrb } from "@/app/components/core/FocusOrb";
import { ObjectivesSection } from "@/app/components/goals/ObjectivesSection";

export const dynamic = "force-dynamic";

type GoalPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function GoalPage({ params }: GoalPageProps) {
  const { id } = await params;
  const user = await requirePageUser();

  const [goal, areas] = await Promise.all([
    getGoalDetail(user.id, id),
    getAreas(user.id, { isActive: true }),
  ]);

  if (!goal) notFound();

  const allTasks = goal.stages.flatMap((stage) => stage.tasks);
  const progress = calculateGoalProgress(goal.stages);
  const completedTasks = allTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const completedStages = goal.stages.filter(
    (stage) =>
      stage.tasks.length > 0 && calculateStageProgress(stage.tasks) === 100,
  ).length;
  const allStagesDone = completedStages === goal.stages.length && goal.stages.length > 0;
  const totalEstimatedHours = allTasks.reduce(
    (s, t) => s + (t.estimatedHours || 0),
    0,
  );

  const currentStageIndex = goal.stages.findIndex((stage) =>
    stage.tasks.some((task) => task.status !== "COMPLETED"),
  );
  const waypoints = goal.stages.map((stage, index) => {
    const stageDone = stage.tasks.filter(
      (task) => task.status === "COMPLETED",
    ).length;
    return {
      id: stage.id,
      label: stage.name,
      taskLabel:
        stage.tasks.length === 0
          ? "belum ada task"
          : `${stageDone}/${stage.tasks.length} task`,
      status:
        currentStageIndex === -1 || index < currentStageIndex
          ? ("COMPLETED" as const)
          : index === currentStageIndex
            ? ("CURRENT" as const)
            : ("UPCOMING" as const),
    };
  });

  const now = new Date();
  const daysElapsed = Math.floor((now.getTime() - new Date(goal.createdAt).getTime()) / 86400000);
  const goalStartDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(goal.createdAt);

  return (
    <div className="space-y-14">
      {/* Goal Completion Banner — shown only when all stages done */}
      {allStagesDone && (
        <div className="relative overflow-hidden rounded-2xl border border-success-200 bg-gradient-to-br from-success-50 via-success-100/40 to-white p-5 shadow-soft">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-success-200/50 blur-2xl"
          />
          <div className="relative flex flex-wrap items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-500 text-2xl text-white shadow-[0_0_0_4px_rgba(47,162,99,0.2)]">
              🏆
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-success-600">Goal Selesai</p>
              <p className="mt-0.5 text-xl font-bold text-surface-900">
                Perjalanan {goal.title} telah sampai!
              </p>
              <p className="mt-0.5 text-[13px] text-success-700">
                {completedTasks} task · {goal.stages.length} stage · semua tuntas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header abstrak — blob ganda + dot-grid, bukan satu blur polos */}
      <header className="relative overflow-hidden pb-10 pt-2 md:pb-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-ai-200/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
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
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">
                  {goal.type}
                </p>
                {goal.area && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-surface-300" />
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: `${goal.area.color}15`,
                        color: goal.area.color,
                        border: `1px solid ${goal.area.color}35`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: goal.area.color }}
                      />
                      {goal.area.name}
                    </span>
                  </>
                )}
                <span className="h-1 w-1 rounded-full bg-surface-300" />
                <StatusBadge status={goal.status} />
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 md:text-5xl">
                {goal.title}
              </h1>
              {goal.description && (
                <p className="mt-4 max-w-2xl text-base leading-7 text-surface-600">
                  {goal.description}
                </p>
              )}

              <div className="mt-7 max-w-xl">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-medium text-surface-700">
                    Progres keseluruhan
                  </p>
                  <span className="text-lg font-bold text-primary-700">
                    {progress}%
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={progress} />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-0 px-3 py-1 text-xs font-medium text-surface-600">
                  <Icon name="check" size={12} /> {completedTasks}/
                  {allTasks.length} task
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-0 px-3 py-1 text-xs font-medium text-surface-600">
                  <Icon name="layers" size={12} /> {completedStages}/
                  {goal.stages.length} stage
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-0 px-3 py-1 text-xs font-medium text-surface-600">
                  <Icon name="clock" size={12} /> ±{" "}
                  {formatHours(totalEstimatedHours)}
                </span>
                {goal.targetDate && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-0 px-3 py-1 text-xs font-medium text-surface-600">
                    <Icon name="calendar" size={12} />{" "}
                    {formatDate(goal.targetDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Focus Orb — pilar navigasi visual yang konsisten */}
            <div className="flex justify-center lg:justify-end">
              <FocusOrb
                value={progress}
                size={180}
                stroke={12}
                tone={allStagesDone ? "success" : "primary"}
                label={`Progres keseluruhan ${goal.title}`}
              >
                <span className="text-3xl font-bold text-surface-900">
                  {progress}%
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-wider text-surface-400">
                  selesai
                </span>
              </FocusOrb>
            </div>
          </div>
        </div>
      </header>

      {/* Peta jalan — jalur melengkung, bukan garis lurus */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-surface-400">Peta jalan</p>
            <h2 className="mt-1 text-2xl font-bold text-surface-900">
              Perjalanan Anda
            </h2>
            <p className="mt-1.5 text-sm text-surface-500">
              Satu perjalanan dibagi menjadi stage — dan setiap stage menjadi
              task.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StageForm goalId={goal.id} nextOrder={goal.stages.length} />
            <GoalActionsMenu
              goalId={goal.id}
              goalName={goal.title}
              areas={areas}
              initialData={{
                name: goal.title,
                description: goal.description,
                type: goal.type,
                status: goal.status,
                targetDate: goal.targetDate,
                areaId: (goal as unknown as { areaId?: string | null }).areaId ?? goal.area?.id ?? null,
              }}
            />
          </div>
        </div>

        {goal.stages.length > 0 ? (
          <>
            <div className="mt-6">
              <JourneyPath
                waypoints={waypoints}
                label={`Peta perjalanan ${goal.title}`}
              />
            </div>
            <p className="mt-3 text-xs text-surface-500">
              {currentStageIndex === -1
                ? "Semua stage selesai — perjalanan telah sampai di tujuan."
                : `Anda berada di stage ${currentStageIndex + 1} dari ${goal.stages.length}. Stage selesai tampak tenang, stage saat ini bersinar, sisanya menunggu.`}
            </p>

            {/* Journey Stats Mini-Bar */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  label: "Dimulai",
                  value: goalStartDate,
                  icon: "🗓",
                },
                {
                  label: "Hari berjalan",
                  value: `${daysElapsed} hari`,
                  icon: "⏱",
                },
                {
                  label: "Stage selesai",
                  value: `${completedStages}/${goal.stages.length}`,
                  icon: "🎯",
                },
                {
                  label: "Task selesai",
                  value: `${completedTasks}/${allTasks.length}`,
                  icon: "✅",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-0.5 rounded-xl border border-surface-100 bg-white px-3 py-2.5 shadow-soft"
                >
                  <span className="text-base leading-none">{stat.icon}</span>
                  <span className="mt-1.5 text-[15px] font-bold text-surface-900 leading-tight">{stat.value}</span>
                  <span className="text-[11px] text-surface-400">{stat.label}</span>
                </div>
              ))}
            </div>
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

      {/* Objectives / Key Results */}
      <section>
        <ObjectivesSection goalId={goal.id} initialObjectives={goal.objectives} />
      </section>

      {/* Timeline stage — jalur vertikal + node heksagon, card radius asimetris */}
      {goal.stages.length > 0 && (
        <section>
          <p className="eyebrow text-surface-400">Rincian</p>
          <h2 className="mt-1 text-2xl font-bold text-surface-900">
            Stage demi stage
          </h2>

          <ol className="relative mt-8 space-y-6 pl-12 sm:pl-14">
            <span
              aria-hidden="true"
              className="absolute bottom-6 left-[19px] top-2 w-0.5 rounded-full bg-gradient-to-b from-primary-300 via-surface-200 to-surface-200 sm:left-[23px]"
            />

            {goal.stages.map((stage, index) => {
              const stageProgress = calculateStageProgress(stage.tasks);
              const completed = stage.tasks.filter(
                (task) => task.status === "COMPLETED",
              ).length;
              const total = stage.tasks.length;
              const isCompleted = total > 0 && completed === total;
              const isCurrent = index === currentStageIndex;

              return (
                <li key={stage.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-12 top-1 flex h-10 w-10 items-center justify-center text-sm font-bold text-white sm:-left-14"
                  >
                    {isCurrent && <span className="halo" />}
                    <span
                      className={`relative flex h-10 w-10 items-center justify-center ${
                        isCompleted
                          ? "bg-success-500"
                          : isCurrent
                            ? "bg-primary-600"
                            : "bg-surface-300"
                      }`}
                      style={{
                        clipPath:
                          "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                      }}
                    >
                      {isCompleted ? (
                        <Icon name="check" size={15} strokeWidth={3} />
                      ) : (
                        <span className="font-mono text-xs">{index + 1}</span>
                      )}
                    </span>
                  </span>

                  <div
                    className={`rounded-tl-md rounded-br-3xl rounded-tr-3xl rounded-bl-3xl border p-6 sm:p-7 ${
                      isCompleted
                        ? "border-success-200 bg-gradient-to-br from-success-50/60 to-white shadow-soft"
                        : isCurrent
                          ? "border-primary-200 bg-primary-50/50 shadow-raised"
                          : "border-surface-200 bg-surface-0 shadow-soft"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-500">
                            Stage {index + 1}
                          </p>
                          {isCurrent && <CurrentWaypointTag />}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-bold text-success-700">
                              ✓ Selesai
                            </span>
                          )}
                        </div>
                        <h3
                          className={`mt-1 text-lg font-semibold sm:text-xl ${
                            isCompleted
                              ? "text-surface-500"
                              : isCurrent
                                ? "text-surface-900"
                                : "text-surface-700"
                          }`}
                        >
                          {stage.name}
                        </h3>
                        {stage.description && (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-surface-500">
                            {stage.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <span className="block text-xl font-bold text-surface-900">
                            {stageProgress}%
                          </span>
                          <span className="block text-xs text-surface-500">
                            {completed}/{total} task
                          </span>
                        </div>
                        <FocusOrb
                          value={stageProgress}
                          size={44}
                          stroke={4}
                          tone={isCompleted ? "success" : "primary"}
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <TaskList tasks={stage.tasks} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <NewTaskButton stageId={stage.id} />
                      <StageActions
                        id={stage.id}
                        name={stage.name}
                        description={stage.description}
                        canMoveUp={index > 0}
                        canMoveDown={index < goal.stages.length - 1}
                      />
                    </div>
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
