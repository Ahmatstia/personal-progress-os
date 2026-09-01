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
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium text-slate-400">
            PERSONAL PROGRESS OS
          </p>

          <h1 className="text-4xl font-bold tracking-tight">Your Progress</h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Satu tempat untuk merencanakan, menjalankan, dan memahami
            perkembangan berbagai tujuanmu.
          </p>
        </header>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Goals</h2>

            <NewGoalButton />
          </div>

          {goals.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <p className="text-slate-400">Belum ada goal.</p>
            </div>
          ) : (
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
                  <article
                    key={goal.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm"
                  >
                    <div className="mb-5 flex items-start justify-between">
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                          {goal.type}
                        </p>

                        <h3 className="text-lg font-semibold">{goal.name}</h3>
                      </div>

                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                        {goal.status}
                      </span>
                    </div>

                    <p className="mb-5 line-clamp-2 text-sm text-slate-400">
                      {goal.description}
                    </p>

                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-400">Progress</span>

                      <span className="font-semibold">{progress}%</span>
                    </div>

                    <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {completedTasks} / {tasks.length} tasks
                      </span>

                      <span>{goal.stages.length} stages</span>
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
