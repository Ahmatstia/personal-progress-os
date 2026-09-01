import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewForm from "@/app/components/ReviewForm";
import { getGoalReviewPageData } from "@/services/review.service";
import { calculateGoalProgress } from "@/services/progress.service";
import { buildInsights } from "@/services/insight.service";
import { requireCurrentUser } from "@/lib/auth";
import { ProgressBar } from "@/app/components/ui/Progress";
import { Icon } from "@/app/components/ui/Icon";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "long", day: "numeric" }).format(value);
}

export default async function ReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser();
  const data = await getGoalReviewPageData((await params).id, user.id);
  if (!data) notFound();
  const { goal, reviews, period, review, metrics } = data;
  const previous = reviews.find((item) => item.periodEnd < period.periodStart);
  const insights = buildInsights(
    metrics,
    previous ? { learningHours: previous.learningHours, tasksCompleted: previous.tasksCompleted, understanding: previous.understanding } : null,
  );
  const progress = calculateGoalProgress(goal.stages);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-2">
        <Link
          href={`/goals/${goal.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition hover:text-primary-700"
        >
          <Icon name="arrowLeft" size={15} /> Kembali ke {goal.name}
        </Link>
      </div>

      <section className="rounded-3xl border border-surface-200 bg-surface-0 p-6 shadow-soft md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-500">Review mingguan</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 md:text-4xl">Renungkan dan mulai lagi</h1>
        <p className="mt-2 text-surface-600">
          {formatDate(period.periodStart)} – {formatDate(period.periodEnd)}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1">
            <ProgressBar value={progress} />
          </div>
          <span className="text-lg font-bold text-primary-700">{progress}%</span>
        </div>
        <p className="mt-1.5 text-xs text-surface-500">Progres goal di seluruh stage dan task</p>
      </section>

      <div className="mt-6">
        <ReviewForm
          goalId={goal.id}
          periodStart={period.periodStart.toISOString()}
          periodEnd={period.periodEnd.toISOString()}
          metrics={metrics}
          review={review ? { ...review, periodStart: review.periodStart.toISOString(), periodEnd: review.periodEnd.toISOString() } : null}
        />
      </div>

      {insights.length > 0 && (
        <section className="rounded-2xl border border-ai-200 bg-ai-50 p-5">
          <div className="flex items-center gap-2 text-ai-700">
            <Icon name="sparkles" size={16} />
            <h2 className="font-semibold">Insight</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-surface-700">
            {insights.map((insight) => (
              <li key={insight} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ai-500" />
                {insight}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-surface-900">Riwayat review</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-surface-300 p-5 text-sm text-surface-500">
            Belum ada review. Review mingguan membantu Anda memahami apa yang berjalan baik dan apa yang harus diubah.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {reviews.map((item) => (
              <div key={item.id} className="rounded-xl border border-surface-200 bg-surface-0 p-4 shadow-soft">
                <div className="flex flex-wrap justify-between gap-3">
                  <span className="text-sm font-medium text-surface-800">
                    {formatDate(item.periodStart)} – {formatDate(item.periodEnd)}
                  </span>
                  <span className="text-sm text-surface-500">
                    {item.learningHours.toFixed(1)}j · {item.tasksCompleted} task
                  </span>
                </div>
                {item.understanding !== null && (
                  <p className="mt-2 text-xs text-surface-500">Pemahaman {item.understanding.toFixed(1)} / 5</p>
                )}
                {item.nextFocus && (
                  <p className="mt-2 text-sm font-medium text-ai-700">Fokus berikutnya: {item.nextFocus}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
