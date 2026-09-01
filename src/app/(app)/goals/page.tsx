import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { calculateGoalProgress } from "@/services/progress.service";
import NewGoalButton from "@/app/components/NewGoalButton";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ProgressBar } from "@/app/components/ui/Progress";
import { StatusBadge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Icon } from "@/app/components/ui/Icon";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(value);
}

export default async function GoalsPage() {
  const user = await requireCurrentUser();

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          tasks: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  const activeGoals = goals.filter((g) => g.status !== "COMPLETED");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Goals"
        title="Your goals, mapped out"
        description="Plan each goal into stages, tasks, and focused sessions — then track them to completion."
        actions={<NewGoalButton />}
      />

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-surface-0 shadow-soft">
          <EmptyState
            icon="flag"
            title="Start with a meaningful goal"
            description="Turn something you care about into a clear path forward. Create a goal, break it into stages, then into small tasks."
            action={<NewGoalButton />}
          />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">
              Active · {activeGoals.length}
            </h2>
            {activeGoals.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-surface-300 bg-surface-0 p-6 text-sm text-surface-500">
                No active goals right now.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeGoals.map((goal) => {
                  const progress = calculateGoalProgress(goal.stages);
                  const tasks = goal.stages.flatMap((stage) => stage.tasks);
                  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
                  const currentStage =
                    goal.stages.find((s) => s.tasks.some((t) => t.status !== "COMPLETED")) ?? goal.stages[0];
                  const nextTask =
                    currentStage?.tasks.find((t) => t.status !== "COMPLETED") ?? null;
                  return (
                    <Link
                      key={goal.id}
                      href={`/goals/${goal.id}`}
                      className="group rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-raised"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">{goal.type}</p>
                            <StatusBadge status={goal.status} />
                          </div>
                          <h3 className="mt-1.5 truncate text-lg font-bold text-surface-900 group-hover:text-primary-700">
                            {goal.name}
                          </h3>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-0.5 text-sm font-bold text-primary-700">
                          {progress}%
                        </span>
                      </div>

                      <div className="mt-4">
                        <ProgressBar value={progress} size="sm" />
                      </div>

                      <div className="mt-4 flex items-center gap-1.5 text-xs text-surface-500">
                        <Icon name="layers" size={14} className="text-surface-400" />
                        <span>{goal.stages.length} stages</span>
                        <span className="text-surface-300">·</span>
                        <span>{completed}/{tasks.length} tasks</span>
                        {goal.targetDate && (
                          <>
                            <span className="text-surface-300">·</span>
                            <span>by {formatDate(goal.targetDate)}</span>
                          </>
                        )}
                      </div>

                      {nextTask ? (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                            <Icon name="bolt" size={14} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
                              {currentStage?.name ?? "Next"}
                            </p>
                            <p className="truncate text-sm font-medium text-surface-800">{nextTask.name}</p>
                          </div>
                        </div>
                      ) : progress === 100 ? (
                        <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-success-700">
                          <Icon name="check" size={15} /> Goal complete
                        </p>
                      ) : (
                        <p className="mt-4 text-sm text-surface-500">No tasks yet — break it down.</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {completedGoals.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">
                Completed · {completedGoals.length}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {completedGoals.map((goal) => (
                  <Link
                    key={goal.id}
                    href={`/goals/${goal.id}`}
                    className="flex items-center justify-between rounded-2xl border border-success-200 bg-success-50 p-4 transition hover:border-success-300"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-success-700">{goal.type}</p>
                      <h3 className="truncate font-semibold text-surface-800">{goal.name}</h3>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-success-700">Done</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
