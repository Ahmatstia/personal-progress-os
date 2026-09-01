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
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatRange(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat("id-ID", { month: "short", day: "numeric" });
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
        title="Berhenti dan renungkan"
        description="Ritual mingguan yang tenang: pahami apa yang berhasil, apa yang tidak, dan ke mana harus mengarahkan energi Anda berikutnya."
      />

      <section className="rounded-3xl border border-ai-200 bg-gradient-to-br from-ai-50 via-surface-0 to-surface-0 p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ai-600">Minggu ini</p>
            <h2 className="mt-1.5 text-2xl font-bold text-surface-900">{formatRange(period.periodStart, period.periodEnd)}</h2>
            <p className="mt-1 text-sm text-surface-500">
              {rows.length === 0
                ? "Belum ada goals aktif untuk direview."
                : `${reviewed.size} dari ${rows.length} goals sudah direview minggu ini`}
            </p>
          </div>
          <span className="rounded-full bg-ai-100 px-3 py-1 text-xs font-semibold text-ai-700">
            {reviewed.size}/{rows.length} selesai
          </span>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-surface-200 bg-surface-0 shadow-soft">
          <EmptyState
            icon="sparkles"
            title="Belum ada yang direview"
            description="Setelah Anda memiliki goal aktif, Anda bisa merefleksikan minggu Anda di sini."
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
                      <span>{formatDuration(metrics.learningMinutes)} fokus</span>
                      <span className="text-surface-300">·</span>
                      <span>{metrics.tasksCompleted} task selesai</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-lg font-bold text-primary-700">{progress}%</span>
                    <div className="w-28">
                      <ProgressBar value={progress} size="sm" tone={done ? "success" : "primary"} />
                    </div>
                    <Link href={`/goals/${goal.id}/reviews`}>
                      <Button size="sm" variant={done ? "secondary" : "ai"} icon={done ? "check" : "sparkles"}>
                        {done ? "Sunting review" : "Tulis review"}
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
          <h2 className="font-semibold text-surface-900">Mengapa review mingguan?</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-surface-600">
          Review bukanlah rapor. Ini adalah kesempatan untuk melihat apa yang benar-benar bergerak, menyebut apa yang
          menghambat Anda, dan memilih satu fokus yang jelas untuk minggu ke depan — sehingga progres terus bertambah,
          bukan sekadar mengalir begitu saja.
        </p>
      </section>
    </div>
  );
}
