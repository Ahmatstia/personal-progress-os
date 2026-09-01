import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StageForm from "@/app/components/StageForm";
import TaskForm from "@/app/components/TaskForm";
import TaskItem from "@/app/components/TaskItem";
type GoalPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

  const completedTasks = allTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const progress =
    allTasks.length > 0
      ? Math.round((completedTasks / allTasks.length) * 100)
      : 0;

  const completedStages = goal.stages.filter((stage) => {
    if (stage.tasks.length === 0) {
      return false;
    }

    return stage.tasks.every((task) => task.status === "COMPLETED");
  }).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* BACK */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <span>←</span>
          <span>Back to Goals</span>
        </Link>

        {/* GOAL HEADER */}
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
                <p className="text-xs text-slate-500">Target Date</p>

                <p className="mt-1 text-sm font-medium">
                  {goal.targetDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* OVERALL PROGRESS */}
          <div className="mt-8 border-t border-slate-800 pt-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-sm text-slate-400">Overall Progress</p>

                <p className="mt-1 text-xs text-slate-600">
                  Berdasarkan task yang telah diselesaikan
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

          {/* STATS */}
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Stages</p>

              <p className="mt-2 text-2xl font-semibold">
                {goal.stages.length}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Completed Stages</p>

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

        {/* ROADMAP */}
        <section>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                Journey
              </p>

              <h2 className="mt-2 text-2xl font-semibold">Your Roadmap</h2>

              <p className="mt-2 text-sm text-slate-500">
                Perjalanan goal ini dibagi menjadi beberapa tahapan.
              </p>
            </div>

            {/* ADD STAGE */}
            <StageForm goalId={goal.id} nextOrder={goal.stages.length} />
          </div>

          {/* EMPTY STATE */}
          {goal.stages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl">
                +
              </div>

              <h3 className="mt-4 font-semibold">Belum ada stage</h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Goal ini belum memiliki tahapan. Tambahkan stage pertama untuk
                mulai membangun roadmap perjalananmu.
              </p>
            </div>
          ) : (
            /* STAGES */
            <div className="space-y-5">
              {goal.stages.map((stage, index) => {
                const completed = stage.tasks.filter(
                  (task) => task.status === "COMPLETED",
                ).length;

                const total = stage.tasks.length;

                const stageProgress =
                  total > 0 ? Math.round((completed / total) * 100) : 0;

                const isCompleted = total > 0 && completed === total;

                return (
                  <article
                    key={stage.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                  >
                    <div className="flex gap-4">
                      {/* STAGE NUMBER */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          isCompleted
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* STAGE HEADER */}
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
                          </div>
                        </div>

                        {/* STAGE PROGRESS */}
                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-500"
                            style={{
                              width: `${stageProgress}%`,
                            }}
                          />
                        </div>

                        {/* TASK LIST */}
                        {stage.tasks.length > 0 && (
                          <div className="mt-5 space-y-2">
                            {stage.tasks.map((task) => (
                              <TaskItem
                                key={task.id}
                                id={task.id}
                                name={task.name}
                                description={task.description}
                                priority={task.priority}
                                status={task.status}
                              />
                            ))}
                          </div>
                        )}

                        {/* NO TASK */}
                        {stage.tasks.length === 0 && (
                          <div className="mt-5 rounded-xl border border-dashed border-slate-800 p-4">
                            <p className="text-center text-xs text-slate-600">
                              Belum ada task di stage ini.
                            </p>
                          </div>
                        )}

                        <TaskForm stageId={stage.id} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* NEXT FEATURES */}
        <section className="mt-10">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
              Next
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">Add Stage</p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Pecah goal menjadi tahapan yang lebih jelas.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">Add Task</p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Tentukan pekerjaan konkret yang harus dilakukan.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">
                  Learning Session
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Catat aktivitas, pemahaman, hambatan, dan langkah berikutnya.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
