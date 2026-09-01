import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StageForm from "@/app/components/StageForm";
import NewTaskButton from "@/app/components/NewTaskButton";
import TaskList from "@/app/components/TaskList";
import StageActions from "@/app/components/StageActions";
import {
  calculateGoalProgress,
  calculateStageProgress,
} from "@/services/progress.service";

type GoalPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function GoalPage({ params }: GoalPageProps) {
  const { id } = await params;

  const goal = await prisma.goal.findUnique({
    where: {
      id,
    },
    include: {
      stages: {
        orderBy: {
          order: "asc",
        },
        include: {
          tasks: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!goal) {
    notFound();
  }

  const allTasks = goal.stages.flatMap((stage) => stage.tasks);
  const progress = calculateGoalProgress(goal.stages);
  const completedTasks = allTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const completedStages = goal.stages.filter((stage) => {
    if (stage.tasks.length === 0) {
      return false;
    }

    return calculateStageProgress(stage.tasks) === 100;
  }).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          Back to goals
        </Link>

        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  {goal.type}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                  {goal.status}
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {goal.name}
              </h1>

              {goal.description && (
                <p className="mt-4 leading-7 text-slate-400">
                  {goal.description}
                </p>
              )}
            </div>

            {goal.targetDate && (
              <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs text-slate-500">Target date</p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(goal.targetDate)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-800 pt-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-sm text-slate-400">Overall progress</p>
                <p className="mt-1 text-xs text-slate-600">
                  Based on completed tasks across all stages
                </p>
              </div>
              <span className="text-3xl font-bold">{progress}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Stages</p>
              <p className="mt-2 text-2xl font-semibold">{goal.stages.length}</p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Completed stages</p>
              <p className="mt-2 text-2xl font-semibold">{completedStages}</p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Tasks</p>
              <p className="mt-2 text-2xl font-semibold">
                {completedTasks}
                <span className="text-base font-normal text-slate-600">
                  {" "}
                  / {allTasks.length}
                </span>
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Completion</p>
              <p className="mt-2 text-2xl font-semibold">{progress}%</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                Journey
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Your roadmap</h2>
              <p className="mt-2 text-sm text-slate-500">
                Break the goal into stages, then tasks, then sessions.
              </p>
            </div>

            <StageForm goalId={goal.id} nextOrder={goal.stages.length} />
            <Link href={`/goals/${goal.id}/reviews`} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Review Progress</Link>
            <Link href={`/dashboard?goalId=${goal.id}`} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">Analytics</Link>
          </div>

          {goal.stages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl">
                +
              </div>
              <h3 className="mt-4 font-semibold">No stages yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Add the first stage to start shaping this goal.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {goal.stages.map((stage, index) => {
                const stageProgress = calculateStageProgress(stage.tasks);
                const completed = stage.tasks.filter(
                  (task) => task.status === "COMPLETED",
                ).length;
                const total = stage.tasks.length;
                const isCompleted = total > 0 && completed === total;

                return (
                  <article
                    key={stage.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                  >
                    <div className="flex gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          isCompleted
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {isCompleted ? "Done" : index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-600">
                              Stage {index + 1}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold">
                              {stage.name}
                            </h3>
                            {stage.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {stage.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 md:text-right">
                            <p className="text-xl font-bold">
                              {stageProgress}%
                            </p>
                            <p className="text-xs text-slate-600">
                              {completed} / {total} tasks
                            </p>
                            <StageActions id={stage.id} name={stage.name} description={stage.description} canMoveUp={index > 0} canMoveDown={index < goal.stages.length - 1} />
                          </div>
                        </div>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-500"
                            style={{
                              width: `${stageProgress}%`,
                            }}
                          />
                        </div>

                        <TaskList tasks={stage.tasks} />
                        <NewTaskButton stageId={stage.id} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
