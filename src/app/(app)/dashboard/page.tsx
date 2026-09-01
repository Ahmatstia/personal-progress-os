import Link from "next/link";
import AnalyticsBars from "@/app/components/AnalyticsBars";
import { AICommandPanel } from "@/app/components/AICommandPanel";
import { ProgressSnapshot } from "@/app/components/core/ProgressSnapshot";
import { BottleneckInsight } from "@/app/components/core/BottleneckInsight";
import { NextActionCard } from "@/app/components/core/NextActionCard";
import { getDashboardAnalytics } from "@/services/analytics.service";
import { getDashboardData } from "@/services/dashboard.service";
import { requireCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Icon } from "@/app/components/ui/Icon";

export const dynamic = "force-dynamic";

function formatMinutes(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatActivityTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(value);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  const user = await requireCurrentUser();
  const { goalId } = await searchParams;
  const [analytics, dashboard] = await Promise.all([
    getDashboardAnalytics({ days: 30, goalId }, user.id),
    getDashboardData(user.id),
  ]);
  const { summary, bottlenecks } = analytics;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Your progress, at a glance"
        description="A calm, honest look at the last 30 days of real work."
        actions={
          goalId ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-primary-700"
            >
              <Icon name="x" size={15} /> Clear filter
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <NextActionCard nextAction={dashboard.nextAction} />
        <ProgressSnapshot
          className="h-full"
          title="Snapshot"
          items={[
            { label: "Focus", value: `${summary.totalHours}h`, icon: "clock", hint: "last 30 days" },
            { label: "Tasks done", value: String(summary.completedTasks), icon: "check" },
            { label: "Completion", value: `${summary.completionRate}%`, icon: "gauge" },
            { label: "Consistency", value: `${summary.consistency}%`, icon: "trendingUp", hint: `${summary.activeDays}/${summary.daysInPeriod} days` },
          ]}
        />
      </div>

      <AICommandPanel initialContext={{ goalId }} />

      <BottleneckInsight bottlenecks={bottlenecks} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-surface-900">Activity trend</h2>
            <span className="flex items-center gap-3 text-xs text-surface-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ai-500" /> Focus hours
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary-500" /> Tasks
              </span>
            </span>
          </div>
          <div className="mt-5">
            <AnalyticsBars trends={analytics.trends} />
          </div>
        </section>

        <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
          <h2 className="font-semibold text-surface-900">Consistency</h2>
          <dl className="mt-4 space-y-3">
            {[
              { label: "Active days", value: `${summary.activeDays} / ${summary.daysInPeriod}` },
              { label: "Current streak", value: `${summary.currentStreak} days` },
              { label: "Longest streak", value: `${summary.longestStreak} days` },
              { label: "Avg. session", value: `${summary.averageSessionMinutes} min` },
              { label: "Understanding", value: summary.averageUnderstanding === null ? "No data" : `${summary.averageUnderstanding} / 5` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 border-b border-surface-150 pb-3 last:border-0 last:pb-0">
                <dt className="text-sm text-surface-500">{row.label}</dt>
                <dd className="text-sm font-semibold text-surface-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
          <h2 className="font-semibold text-surface-900">Recent activity</h2>
          {dashboard.recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-surface-500">No activity recorded yet.</p>
          ) : (
            <ol className="mt-3 divide-y divide-surface-150">
              {dashboard.recentActivity.slice(0, 6).map((activity) => (
                <li key={activity.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      activity.kind === "session" ? "bg-ai-100 text-ai-600" : "bg-success-50 text-success-600"
                    }`}
                  >
                    <Icon name={activity.kind === "session" ? "clock" : "check"} size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-surface-800">{activity.label}</p>
                    <p className="truncate text-xs text-surface-500">{activity.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-surface-400">{formatActivityTime(activity.timestamp)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-surface-900">Recent sessions</h2>
            <span className="text-xs text-surface-400">{formatMinutes(dashboard.studyMinutesToday)} today</span>
          </div>
          {dashboard.recentSessions.length === 0 ? (
            <p className="mt-4 text-sm text-surface-500">No focus sessions yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-surface-150">
              {dashboard.recentSessions.slice(0, 5).map((session) => (
                <li key={session.id} className="py-2.5">
                  <Link href={`/tasks/${session.task.id}`} className="block text-sm font-medium text-surface-800 hover:text-primary-700">
                    {session.task.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-surface-500">
                    {session.task.stage.goal.name} ·{" "}
                    {session.durationMinutes === null ? "Active" : formatMinutes(session.durationMinutes)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
