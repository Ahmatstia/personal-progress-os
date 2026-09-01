import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { getWeekPeriod, getPeriodMetrics, getPeriodReview } from "@/services/review.service";
import { calculateGoalProgress } from "@/services/progress.service";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Button } from "@/app/components/ui/Button";
import { ProgressBar } from "@/app/components/ui/Progress";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Icon } from "@/app/components/ui/Icon";

export const dynamic = "force-dynamic";

function formatRange(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export default async function ReviewPage() {
  const user = await requireCurrentUser();
  const period = getWeekPeriod(new Date());

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, status: { not: "COMPLETED" } },
    orderBy: { updatedAt: "desc" },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: { tasks: true },
      },
    },
  });

  const reviewed = new Set(
    (await prisma.review.findMany({
      where: {
        goal: { userId: user.id },
        periodStart: period.periodStart,
      },
      select: { goalId: true },
    })).map((item) => item.goalId),
  );

  const rows = await Promise.all(
    goals.map(async (goal) => {
      const metrics = await getPeriodMetrics(goal.id, period.periodStart, period.periodEnd, user.id);
      const review = await getPeriodReview(goal.id, period.periodStart, period.periodEnd, user.id);
      return { goal, metrics, review, progress: calculateGoalProgress(goal.stages) };
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Review"
        title="Pause and reflect"
        description="A calm weekly ritual: understand what works, what doesn&apos;t, and where to point your energy next."
      />

      <section className="rounded-3xl border border-ai-200 bg-gradient-to-br from-ai-50 via-surface-0 to-surface-0 p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ai-600">This week</p>
            <h2 className="mt-1.5 text-2xl font-bold text-surface-900">{formatRange(period.periodStart, period.periodEnd)}</h2>
            <p className="mt-1 text-sm text-surface-500">
              {rows.length === 0
                ? "No active goals to review yet."
                : `${reviewed.size} of ${rows.length} goals reviewed this week`}
            </p>
          </div>
          <span className="rounded-full bg-ai-100 px-3 py-1 text-xs font-semibold text-ai-700">
            {reviewed.size}/{rows.length} complete
          </span>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-surface-0 shadow-soft">
          <EmptyState
            icon="sparkles"
            title="Nothing to review yet"
            description="Once you have an active goal, you'll be able to reflect on your week here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ goal, metrics, review, progress }) => {
            const done = !!review;
            return (
              <div
                key={goal.id}
                className={`rounded-2xl border p-5 shadow-soft ${
                  done ? "border-success-200 bg-success-50/50" : "border-surface-200 bg-surface-0"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">{goal.type}</p>
                    <Link href={`/goals/${goal.id}`} className="mt-1 block truncate text-lg font-bold text-surface-900 hover:text-primary-700">
                      {goal.name}
                    </Link>
                    <div className="mt-2 flex items-center gap-2 text-xs text-surface-500">
                      <span>{metrics.learningHours.toFixed(1)}h focused</span>
                      <span className="text-surface-300">·</span>
                      <span>{metrics.tasksCompleted} tasks</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-lg font-bold text-primary-700">{progress}%</span>
                    <div className="w-28">
                      <ProgressBar value={progress} size="sm" tone={done ? "success" : "primary"} />
                    </div>
                    <Link href={`/goals/${goal.id}/reviews`}>
                      <Button size="sm" variant={done ? "secondary" : "ai"} icon={done ? "check" : "sparkles"}>
                        {done ? "Edit review" : "Write review"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
        <div className="flex items-center gap-2 text-primary-600">
          <Icon name="info" size={16} />
          <h2 className="font-semibold text-surface-900">Why review weekly?</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-surface-600">
          A review isn&apos;t a scorecard. It&apos;s a chance to see what actually moved, name what held you back, and
          choose one clear focus for the week ahead — so progress compounds instead of drifting.
        </p>
      </section>
    </div>
  );
}
