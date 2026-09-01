import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewGoalButton from "./components/NewGoalButton";

export default async function Home() {
  const goals = await prisma.goal.findMany({
    include: {
      stages: {
        include: {
          tasks: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium tracking-wide text-slate-400">
            PERSONAL PROGRESS OS
          </p>

          <h1 className="text-4xl font-bold tracking-tight">Your Progress</h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Satu tempat untuk merencanakan, menjalankan, dan memahami
            perkembangan berbagai tujuanmu.
          </p>
        </header>

        {/* Goals Section */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Active Goals</h2>

              <p className="mt-1 text-sm text-slate-500">
                Semua perjalanan yang sedang kamu kerjakan.
              </p>
            </div>

            <NewGoalButton />
          </div>

          {/* Empty State */}
          {goals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl">
                +
              </div>

              <h3 className="font-semibold">Belum ada goal</h3>

              <p className="mt-2 text-sm text-slate-500">
                Buat goal pertamamu untuk mulai mencatat progres.
              </p>

              <div className="mt-5">
                <NewGoalButton />
              </div>
            </div>
          ) : (
            /* Goal Cards */
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => {
                const tasks = goal.stages.flatMap((stage) => stage.tasks);

                const completedTasks = tasks.filter(
                  (task) => task.status === "COMPLETED",
                ).length;

                const progress =
                  tasks.length > 0
                    ? Math.round((completedTasks / tasks.length) * 100)
                    : 0;

                return (
                  <Link
                    key={goal.id}
                    href={`/goals/${goal.id}`}
                    className="group block"
                  >
                    <article className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:border-slate-600 group-hover:bg-slate-800">
                      {/* Card Header */}
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                            {goal.type}
                          </p>

                          <h3 className="truncate text-lg font-semibold text-white">
                            {goal.name}
                          </h3>
                        </div>

                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                          {goal.status}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="mb-5 line-clamp-2 min-h-10 text-sm text-slate-400">
                        {goal.description ||
                          "Tidak ada deskripsi untuk goal ini."}
                      </p>

                      {/* Progress Header */}
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-400">Progress</span>

                        <span className="font-semibold text-white">
                          {progress}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-white transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {completedTasks} / {tasks.length} tasks
                        </span>

                        <span>
                          {goal.stages.length}{" "}
                          {goal.stages.length === 1 ? "stage" : "stages"}
                        </span>
                      </div>

                      {/* Open Indicator */}
                      <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                        <span className="text-xs text-slate-600">
                          Updated {goal.updatedAt.toLocaleDateString("id-ID")}
                        </span>

                        <span className="text-sm text-slate-500 transition group-hover:translate-x-1 group-hover:text-white">
                          →
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer / Future Modules */}
        <section className="mt-12">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
              Coming next
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-medium text-slate-300">
                  Stages & Tasks
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Pecah goal menjadi perjalanan yang lebih terstruktur.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-300">
                  Learning Sessions
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Catat waktu belajar, pemahaman, hambatan, dan next action.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-300">
                  Progress Insights
                </h3>

                <p className="mt-1 text-xs text-slate-600">
                  Pahami perkembanganmu melalui data dan review.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
