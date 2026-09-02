import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth";
import { calculateGoalProgress } from "@/services/progress.service";
import NewGoalButton from "@/app/components/NewGoalButton";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ProgressBar } from "@/app/components/ui/Progress";
import { StatusBadge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Icon } from "@/app/components/ui/Icon";
import { JourneyRoute } from "@/app/components/core/JourneyRoute";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(value);
}

function journeyForStages(
  stages: { id: string; name: string; tasks: { status: string }[] }[],
) {
  const firstOpen = stages.findIndex((stage) =>
    stage.tasks.some((task) => task.status !== "COMPLETED"),
  );
  return stages.map((stage, index) => ({
    id: stage.id,
    label: stage.name,
    status:
      firstOpen === -1 || index < firstOpen
        ? ("COMPLETED" as const)
        : index === firstOpen
          ? ("CURRENT" as const)
          : ("UPCOMING" as const),
  }));
}

export default async function GoalsPage() {
  const user = await requirePageUser();

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

  const [featured, ...rest] = activeGoals;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Goals"
        title="Goals Anda, terpetakan dengan jelas"
        description="Rencanakan setiap goal menjadi stage, task, dan sesi fokus — lalu pantau hingga selesai."
        actions={<NewGoalButton />}
      />

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-surface-0 shadow-soft">
          <EmptyState
            icon="flag"
            title="Mulai dengan goal yang bermakna"
            description="Ubah hal yang Anda pedulikan menjadi jalur yang jelas. Buat goal, pecah menjadi stage, lalu menjadi task kecil."
            action={<NewGoalButton />}
          />
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">
                Aktif
              </h2>
              <span className="rounded-full bg-surface-150 px-2 py-0.5 text-[11px] font-semibold text-surface-600">
                {activeGoals.length}
              </span>
            </div>

            {activeGoals.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-surface-300 bg-surface-0 p-6 text-sm text-surface-500">
                Belum ada goals aktif saat ini.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {featured && (
                  <FeaturedGoalLink goal={featured} />
                )}
                {rest.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </section>

          {completedGoals.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">
                Selesai · {completedGoals.length}
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
                    <span className="shrink-0 text-sm font-bold text-success-700">Selesai</span>
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

function GoalStats({ goal, tasks }: { goal: { stages: { id: string }[]; targetDate: Date | null }; tasks: { status: string }[] }) {
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-surface-500">
      <span className="inline-flex items-center gap-1">
        <Icon name="layers" size={14} className="text-surface-400" /> {goal.stages.length} stage
      </span>
      <span className="text-surface-300">·</span>
      <span>
        {completed}/{tasks.length} task
      </span>
      {goal.targetDate && (
        <>
          <span className="text-surface-300">·</span>
          <span>hingga {formatDate(goal.targetDate)}</span>
        </>
      )}
    </div>
  );
}

function NextTaskRegion({ stageName, taskName, done }: { stageName: string; taskName: string; done: boolean }) {
  if (done) {
    return (
      <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-success-700">
        <Icon name="check" size={15} /> Goal selesai
      </p>
    );
  }
  return (
    <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
        <Icon name="bolt" size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">{stageName}</p>
        <p className="truncate text-sm font-medium text-surface-800">{taskName}</p>
      </div>
    </div>
  );
}

type GoalLike = {
  id: string;
  name: string;
  type: string;
  status: string;
  targetDate: Date | null;
  stages: { id: string; name: string; tasks: { status: string; name: string }[] }[];
};

function CardWaypoints({ stages }: { stages: GoalLike["stages"] }) {
  if (stages.length === 0) return null;
  return (
    <JourneyRoute
      waypoints={journeyForStages(stages)}
      size="sm"
      className="my-4"
      label="Kemajuan per stage"
    />
  );
}

function FeaturedGoalLink({ goal }: { goal: GoalLike }) {
  const progress = calculateGoalProgress(goal.stages);
  const tasks = goal.stages.flatMap((stage) => stage.tasks);
  const currentStage =
    goal.stages.find((s) => s.tasks.some((t) => t.status !== "COMPLETED")) ?? goal.stages[0];
  const nextTask = currentStage?.tasks.find((t) => t.status !== "COMPLETED");
  const done = progress === 100;

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group relative overflow-hidden rounded-3xl border border-primary-200/70 bg-surface-0 p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-raised md:col-span-2 sm:p-7"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -bottom-24 h-52 w-52 rounded-full bg-primary-100/40 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">{goal.type}</p>
              <StatusBadge status={goal.status} />
            </div>
            <h3 className="mt-1.5 truncate text-xl font-bold text-surface-900 group-hover:text-primary-700 sm:text-2xl">
              {goal.name}
            </h3>
<div className="mt-3">
<div className="flex max-w-[240px] items-center gap-3">
  <div className="flex-1">
    <ProgressBar value={progress} />
  </div>
  <span className="shrink-0 text-sm font-bold text-primary-700">{progress}%</span>
</div>
</div>
          </div>
          <GoalStats goal={goal} tasks={tasks} />
        </div>

        {goal.stages.length > 0 && <CardWaypoints stages={goal.stages} />}

        <NextTaskRegion
          stageName={currentStage?.name ?? "Berikutnya"}
          taskName={nextTask?.name ?? "—"}
          done={done}
        />
      </div>
    </Link>
  );
}

function GoalCard({ goal }: { goal: GoalLike }) {
  const progress = calculateGoalProgress(goal.stages);
  const tasks = goal.stages.flatMap((stage) => stage.tasks);
  const currentStage =
    goal.stages.find((s) => s.tasks.some((t) => t.status !== "COMPLETED")) ?? goal.stages[0];
  const nextTask = currentStage?.tasks.find((t) => t.status !== "COMPLETED");

  return (
    <Link
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

      {goal.stages.length > 0 && <CardWaypoints stages={goal.stages} />}

      <GoalStats goal={goal} tasks={tasks} />

      <NextTaskRegion
        stageName={currentStage?.name ?? "Belum ada task"}
        taskName={nextTask?.name ?? "uraikan dahulu"}
        done={progress === 100}
      />
    </Link>
  );
}