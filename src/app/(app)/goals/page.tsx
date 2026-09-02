import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth";
import { calculateGoalProgress } from "@/services/progress.service";
import NewGoalButton from "@/app/components/NewGoalButton";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatusBadge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Icon } from "@/app/components/ui/Icon";
import { JourneyRoute } from "@/app/components/core/JourneyRoute";
import { FocusOrb } from "@/app/components/core/FocusOrb";

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

type GoalLike = {
  id: string;
  name: string;
  type: string;
  status: string;
  targetDate: Date | null;
  stages: { id: string; name: string; tasks: { status: string; name: string }[] }[];
};

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

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Goals"
        title="Perjalanan Anda"
        description="Setiap goal adalah sebuah perjalanan: stage demi stage, task demi task, hingga tiba di tujuan."
        actions={<NewGoalButton />}
      />

      {goals.length === 0 ? (
        <div className="border-t border-surface-150 pt-10">
          <EmptyState
            icon="flag"
            title="Mulai dengan goal yang bermakna"
            description="Ubah hal yang Anda pedulikan menjadi jalur yang jelas. Buat goal, pecah menjadi stage, lalu menjadi task kecil."
            action={<NewGoalButton />}
          />
        </div>
      ) : (
        <>
          <section className="border-t border-surface-150 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-surface-400">Kemajuan aktif</p>
                <h2 className="mt-1 text-2xl font-bold text-surface-900">
                  {activeGoals.length} perjalanan sedang berlangsung
                </h2>
              </div>
              <p className="text-sm text-surface-500">Klik salah satu untuk membuka peta perjalanannya.</p>
            </div>

            {activeGoals.length === 0 ? (
              <p className="mt-8 text-sm text-surface-500">
                Belum ada goals aktif saat ini. Buat satu untuk memulai.
              </p>
            ) : (
              <ul className="mt-6 divide-y divide-surface-150">
                {activeGoals.map((goal) => (
                  <JourneyRow key={goal.id} goal={goal} />
                ))}
              </ul>
            )}
          </section>

          {completedGoals.length > 0 && (
            <section className="border-t border-surface-150 pt-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow text-success-700">Selesai</p>
                  <h2 className="mt-1 text-xl font-bold text-surface-900">Tujuan tercapai</h2>
                </div>
                <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-700">
                  {completedGoals.length}
                </span>
              </div>
              <ul className="mt-5 divide-y divide-surface-150">
                {completedGoals.map((goal) => (
                  <li key={goal.id} className="py-4">
                    <Link
                      href={`/goals/${goal.id}`}
                      className="group flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-success-700">{goal.type}</p>
                        <h3 className="mt-0.5 truncate font-semibold text-surface-700 transition group-hover:text-surface-900">
                          {goal.name}
                        </h3>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-success-700">
                        <Icon name="check" size={15} /> Selesai
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function JourneyRow({ goal }: { goal: GoalLike }) {
  const progress = calculateGoalProgress(goal.stages);
  const tasks = goal.stages.flatMap((stage) => stage.tasks);
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const currentStageIndex = goal.stages.findIndex((s) => s.tasks.some((t) => t.status !== "COMPLETED"));
  const currentStage = currentStageIndex === -1 ? null : goal.stages[currentStageIndex];
  const nextTask = currentStage?.tasks.find((t) => t.status !== "COMPLETED");
  const done = progress === 100;
  const showLabels = goal.stages.length > 0 && goal.stages.length <= 6;

  return (
    <li className="py-8 first:pt-6 sm:py-10">
      <Link href={`/goals/${goal.id}`} className="block" aria-label={`Buka peta perjalanan ${goal.name}`}>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">{goal.type}</p>
              <StatusBadge status={goal.status} />
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-surface-900 transition-colors group-hover:text-primary-700 sm:text-3xl">
              {goal.name}
            </h2>
            {goal.targetDate && <p className="mt-1.5 text-sm text-surface-500">Hingga {formatDate(goal.targetDate)}</p>}
          </div>
          <FocusOrb
            value={progress}
            size={80}
            stroke={6}
            tone={done ? "success" : "primary"}
            label={`Progres ${goal.name} ${progress} persen`}
          >
            <span className="text-xl font-bold text-surface-900">{progress}%</span>
            <span className="mt-0.5 text-[9px] uppercase tracking-wider text-surface-400">selesai</span>
          </FocusOrb>
        </div>

        <div className="mt-7">
          {goal.stages.length === 0 ? (
            <p className="text-sm text-surface-500">Belum ada stage — mulailah menyusun peta perjalanan ini.</p>
          ) : (
            <JourneyRoute
              waypoints={journeyForStages(goal.stages)}
              size={showLabels ? "md" : "sm"}
              label={`Peta perjalanan ${goal.name}`}
            />
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Icon name="bolt" size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
                {done ? "Status" : currentStageIndex === -1 ? "Status" : `Stage ${currentStageIndex + 1}`}
              </p>
              <p className="truncate text-sm font-medium text-surface-800">
                {done ? "Perjalanan selesai" : currentStage?.name ?? "Belum ada stage"}
              </p>
            </div>
          </div>

          <span className="hidden h-6 w-px shrink-0 bg-surface-200 sm:block" aria-hidden="true" />

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Berikutnya</p>
            <p className="truncate text-sm font-medium text-surface-800">
              {nextTask?.name ?? (progress === 100 ? "—" : "uraikan dahulu")}
            </p>
          </div>

          <span className="ml-auto shrink-0 text-xs font-medium text-surface-500">
            {goal.stages.length} stage · {completed}/{tasks.length} task
          </span>
        </div>
      </Link>
    </li>
  );
}