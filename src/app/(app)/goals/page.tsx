import { getGoalsWithStages } from "@/services/goal.service";
import { getAreas } from "@/services/area.service";
import { requirePageUser } from "@/lib/auth";
import { calculateGoalProgress } from "@/services/progress.service";
import NewGoalButton from "@/app/components/NewGoalButton";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { GoalsBoard, type GoalCard } from "@/app/components/goals/GoalsBoard";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

type GoalWithRelations = {
  id: string;
  title: string;
  name?: string;
  type: string;
  status: string;
  targetDate: Date | null;
  area?: { id: string; name: string; color: string } | null;
  stages: {
    id: string;
    name: string;
    tasks: { status: string; title: string; name?: string }[];
  }[];
};

function buildGoalCard(goal: GoalWithRelations): GoalCard {
  const progress = calculateGoalProgress(goal.stages);
  const tasks = goal.stages.flatMap((stage) => stage.tasks);
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const currentStageIndex = goal.stages.findIndex((s) =>
    s.tasks.some((t) => t.status !== "COMPLETED"),
  );
  const currentStage =
    currentStageIndex === -1 ? null : goal.stages[currentStageIndex];
  const nextTask = currentStage?.tasks.find((t) => t.status !== "COMPLETED");

  const waypoints = goal.stages.map((stage, index) => ({
    id: stage.id,
    label: stage.name,
    status:
      currentStageIndex === -1 || index < currentStageIndex
        ? ("COMPLETED" as const)
        : index === currentStageIndex
          ? ("CURRENT" as const)
          : ("UPCOMING" as const),
  }));

  return {
    id: goal.id,
    title: goal.title,
    name: goal.title,
    type: goal.type,
    status: goal.status,
    area: goal.area ?? null,
    targetDateLabel: formatDate(goal.targetDate),
    progress,
    totalTasks: tasks.length,
    completedTasks,
    totalStages: goal.stages.length,
    currentStageIndex,
    currentStageName: currentStage?.name ?? null,
    nextTaskName: nextTask?.title ?? nextTask?.name ?? null,
    waypoints,
  };
}

export default async function GoalsPage() {
  const user = await requirePageUser();

  const [goals, areas] = await Promise.all([
    getGoalsWithStages(user.id),
    getAreas(user.id, { isActive: true }),
  ]);

  const activeGoals = goals
    .filter((g) => g.status !== "COMPLETED")
    .map(buildGoalCard);
  const completedGoals = goals
    .filter((g) => g.status === "COMPLETED")
    .map(buildGoalCard);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Goals"
        title="Perjalanan Anda"
        description="Setiap goal adalah sebuah perjalanan: stage demi stage, task demi task, hingga tiba di tujuan."
        actions={<NewGoalButton areas={areas} />}
      />

      {goals.length === 0 ? (
        <div className="border-t border-surface-150 pt-10">
          <EmptyState
            icon="flag"
            title="Mulai dengan goal yang bermakna"
            description="Ubah hal yang Anda pedulikan menjadi jalur yang jelas. Buat goal, hubungkan ke area kehidupan, lalu pecah menjadi stage dan task kecil."
            action={<NewGoalButton areas={areas} />}
          />
        </div>
      ) : (
        <GoalsBoard activeGoals={activeGoals} completedGoals={completedGoals} />
      )}
    </div>
  );
}
