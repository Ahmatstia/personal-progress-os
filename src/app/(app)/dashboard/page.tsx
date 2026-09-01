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
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatActivityTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "short", day: "numeric" }).format(value);
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
        title="Progres Anda, sekilas"
        description="Pandangan yang tenang dan jujur tentang 30 hari terakhir kerja nyata."
        actions={
          goalId ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-primary-700"
            >
              <Icon name="x" size={15} /> Hapus filter
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <NextActionCard nextAction={dashboard.nextAction} />
        <ProgressSnapshot
          className="h-full"
          title="Ringkasan"
          items={[
            { label: "Fokus", value: formatDuration(summary.totalMinutes), icon: "clock", hint: "30 hari terakhir" },
            { label: "Task selesai", value: String(summary.completedTasks), icon: "check" },
            { label: "Penyelesaian", value: `${summary.completionRate}%`, icon: "gauge" },
            { label: "Konsistensi", value: `${summary.consistency}%`, icon: "trendingUp", hint: `${summary.activeDays}/${summary.daysInPeriod} hari` },
          ]}
        />
      </div>

      <AICommandPanel initialContext={{ goalId }} />

      <BottleneckInsight bottlenecks={bottlenecks} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-surface-900">Tren aktivitas</h2>
            <span className="flex items-center gap-3 text-xs text-surface-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ai-500" /> Jam fokus
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary-500" /> Task
              </span>
            </span>
          </div>
          <div className="mt-5">
            <AnalyticsBars trends={analytics.trends} />
          </div>
        </section>

        <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
          <h2 className="font-semibold text-surface-900">Konsistensi</h2>
          <dl className="mt-4 space-y-3">
            {[
              { label: "Hari aktif", value: `${summary.activeDays} / ${summary.daysInPeriod}` },
              { label: "Rekor saat ini", value: `${summary.currentStreak} hari` },
              { label: "Rekor terpanjang", value: `${summary.longestStreak} hari` },
              { label: "Rata-rata sesi", value: `${summary.averageSessionMinutes} mnt` },
              { label: "Pemahaman", value: summary.averageUnderstanding === null ? "Tidak ada data" : `${summary.averageUnderstanding} / 5` },
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
          <h2 className="font-semibold text-surface-900">Aktivitas terbaru</h2>
          {dashboard.recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-surface-500">Belum ada aktivitas tercatat.</p>
          ) : (
            <ol className="mt-3 divide-y divide-surface-150">
              {dashboard.recentActivity.slice(0, 6).map((activity) => (
                <li key={activity.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      activity.kind === "session"
                        ? "bg-ai-100 text-ai-600"
                        : activity.kind === "capture"
                          ? "bg-primary-100 text-primary-600"
                          : "bg-success-50 text-success-600"
                    }`}
                  >
                    <Icon
                      name={activity.kind === "session" ? "clock" : activity.kind === "capture" ? "inbox" : "check"}
                      size={14}
                    />
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
            <h2 className="font-semibold text-surface-900">Sesi terbaru</h2>
            <span className="text-xs text-surface-400">{formatDuration(dashboard.studyMinutesToday)} hari ini</span>
          </div>
          {dashboard.recentSessions.length === 0 ? (
            <p className="mt-4 text-sm text-surface-500">Belum ada sesi fokus.</p>
          ) : (
            <ul className="mt-3 divide-y divide-surface-150">
              {dashboard.recentSessions.slice(0, 5).map((session) => (
                <li key={session.id} className="py-2.5">
                  <Link href={`/tasks/${session.task.id}`} className="block text-sm font-medium text-surface-800 hover:text-primary-700">
                    {session.task.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-surface-500">
                    {session.task.stage.goal.name} ·{" "}
                    {session.durationMinutes === null ? "Aktif" : formatDuration(session.durationMinutes)}
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
