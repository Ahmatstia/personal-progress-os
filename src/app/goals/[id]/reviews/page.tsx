import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewForm from "@/app/components/ReviewForm";
import { getGoalReviewPageData } from "@/services/review.service";
import { calculateGoalProgress } from "@/services/progress.service";
import { buildInsights } from "@/services/insight.service";

function date(value: Date) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(value); }

export default async function ReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await getGoalReviewPageData((await params).id);
  if (!data) notFound();
  const { goal, reviews, period, review, metrics } = data;
  const previous = reviews.find((item) => item.periodEnd < period.periodStart);
  const insights = buildInsights(metrics, previous ? { learningHours: previous.learningHours, tasksCompleted: previous.tasksCompleted, understanding: previous.understanding } : null);
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8"><div className="mx-auto max-w-4xl"><Link href={`/goals/${goal.id}`} className="text-sm text-slate-500 hover:text-white">Back to {goal.name}</Link><div className="mt-8"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Weekly review</p><h1 className="mt-2 text-4xl font-semibold text-white">Review progress</h1><p className="mt-2 text-slate-400">{date(period.periodStart)} - {date(period.periodEnd)} · Goal progress {calculateGoalProgress(goal.stages)}%</p></div><div className="mt-6"><ReviewForm goalId={goal.id} periodStart={period.periodStart.toISOString()} periodEnd={period.periodEnd.toISOString()} metrics={metrics} review={review ? { ...review, periodStart: review.periodStart.toISOString(), periodEnd: review.periodEnd.toISOString() } : null} /></div>{insights.length > 0 && <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-semibold">Insights</h2><ul className="mt-3 space-y-2 text-sm text-slate-400">{insights.map((insight) => <li key={insight}>• {insight}</li>)}</ul></section>}<section className="mt-8"><h2 className="text-lg font-semibold">Review history</h2>{reviews.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-800 p-5 text-sm text-slate-500">No reviews yet. Weekly reviews help you understand what is working and what should change.</p> : <div className="mt-3 space-y-2">{reviews.map((item) => <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="flex justify-between gap-3"><span className="text-sm text-slate-300">{date(item.periodStart)} - {date(item.periodEnd)}</span><span className="text-sm text-slate-400">{item.learningHours.toFixed(1)}h · {item.tasksCompleted} tasks</span></div>{item.understanding !== null && <p className="mt-2 text-xs text-slate-500">Understanding {item.understanding.toFixed(1)} / 5</p>}{item.nextFocus && <p className="mt-2 text-sm text-emerald-300">Next focus: {item.nextFocus}</p>}</div>)}</div>}</section></div></main>;
}
