import Link from "next/link";
import AnalyticsBars from "@/app/components/AnalyticsBars";
import { AICommandPanel } from "@/app/components/AICommandPanel";
import { BottleneckInsight } from "@/app/components/core/BottleneckInsight";
import { FocusOrb } from "@/app/components/core/FocusOrb";
import { ActivityHeatmap } from "@/app/components/core/ActivityHeatmap";
import { getDashboardAnalytics } from "@/services/analytics.service";
import { getDashboardData } from "@/services/dashboard.service";
import { requirePageUser } from "@/lib/auth";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { StatRow } from "@/app/components/ui/StatRow";
import { Icon } from "@/app/components/ui/Icon";
import { HistoryDeleteButton } from "@/app/components/ui/HistoryDeleteButton";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatActivityTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    day: "numeric",
  }).format(value);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ goalId?: string }>;
}) {
  const user = await requirePageUser();
  const { goalId } = await searchParams;
  const [analytics, dashboard] = await Promise.all([
    getDashboardAnalytics({ days: 90, goalId }, user.id),
    getDashboardData(user.id),
  ]);
  const { summary, bottlenecks } = analytics;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow="Analitik"
          title="Data Perjalanan Anda"
          description="Pandangan jujur tentang 30 hari terakhir — konsistensi, bottleneck, dan tren nyata."
        />
        {goalId && (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-surface-500 hover:text-primary-700 transition-colors"
          >
            <Icon name="x" size={13} /> Hapus filter
          </Link>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:items-start lg:gap-5">
        {/* Main content */}
        <div className="min-w-0 space-y-5">
          <BottleneckInsight bottlenecks={bottlenecks} />

          {/* Activity Heatmap — 90 hari */}
          <section className="rounded-2xl border border-surface-150 bg-white p-5 shadow-soft">
            <div className="mb-4">
              <p className="eyebrow text-surface-400">Konsistensi</p>
              <p className="mt-0.5 text-[15px] font-bold text-surface-900">Aktivitas 90 Hari</p>
              <p className="mt-0.5 text-[12px] text-surface-500">
                Setiap kotak = satu hari. Warna makin gelap, makin lama fokus.
              </p>
            </div>
            <ActivityHeatmap trends={analytics.trends} days={90} />
          </section>

          {/* Activity trend chart */}
          <section className="rounded-2xl border border-surface-150 bg-white p-4 shadow-soft">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <p className="eyebrow text-surface-400">Visualisasi</p>
                <p className="mt-0.5 text-[15px] font-bold text-surface-900">Tren aktivitas</p>
                <p className="mt-0.5 text-[12px] text-surface-500">
                  Jam fokus dan task selesai dalam 30 hari terakhir.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-surface-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-ai-500" /> Jam fokus
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary-500" /> Task
                </span>
              </div>
            </div>
            <AnalyticsBars trends={analytics.trends} />
          </section>

          {/* Recent activity */}
          <section className="rounded-2xl border border-surface-150 bg-white p-4 shadow-soft">
            <div className="mb-3">
              <p className="eyebrow text-surface-400">Aktivitas</p>
              <p className="mt-0.5 text-[15px] font-bold text-surface-900">Terbaru</p>
            </div>
            {dashboard.recentActivity.length === 0 ? (
              <p className="text-[13px] text-surface-400">Belum ada aktivitas tercatat.</p>
            ) : (
              <ol className="divide-y divide-surface-100">
                {dashboard.recentActivity.slice(0, 6).map((activity) => (
                  <li key={activity.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        activity.kind === "session"
                          ? "bg-ai-50 text-ai-600"
                          : activity.kind === "capture"
                            ? "bg-primary-50 text-primary-600"
                            : "bg-success-50 text-success-600"
                      }`}
                    >
                      <Icon
                        name={
                          activity.kind === "session"
                            ? "clock"
                            : activity.kind === "capture"
                              ? "inbox"
                              : "check"
                        }
                        size={13}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-surface-800">
                        {activity.label}
                      </p>
                      <p className="truncate text-[11px] text-surface-400">{activity.detail}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-surface-400">
                      {formatActivityTime(activity.timestamp)}
                    </span>
                    {activity.kind !== "task" && (
                      <HistoryDeleteButton
                        path={
                          activity.kind === "session"
                            ? `/api/sessions/${activity.entityId}`
                            : `/api/captures/${activity.entityId}`
                        }
                        message={
                          activity.kind === "session"
                            ? "Hapus sesi ini?"
                            : "Hapus catatan ini?"
                        }
                        toastMessage={
                          activity.kind === "session"
                            ? "Sesi dihapus."
                            : "Catatan dihapus."
                        }
                        aria-label="Hapus dari riwayat"
                      />
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* AI panel */}
          <section className="rounded-2xl border border-ai-200/60 bg-gradient-to-br from-ai-50/40 to-primary-50/30 p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-ai-600 to-primary-600 text-white">
                <Icon name="sparkles" size={13} />
              </span>
              <div>
                <p className="eyebrow text-ai-600">Asisten</p>
                <p className="text-[14px] font-bold text-surface-900">Kendalikan dengan bahasa</p>
              </div>
            </div>
            <AICommandPanel initialContext={{ goalId }} />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="mt-5 space-y-4 lg:sticky lg:top-16 lg:mt-0">

          {/* ── Streak Hero Card — paling prominent ── */}
          <section
            className={`rounded-2xl border p-4 shadow-soft ${
              summary.currentStreak >= 7
                ? "border-warning-200 bg-gradient-to-br from-warning-50 to-warning-100/60"
                : summary.currentStreak >= 3
                  ? "border-primary-200 bg-gradient-to-br from-primary-50 to-ai-50/60"
                  : "border-surface-150 bg-white"
            }`}
          >
            <p className="eyebrow text-surface-400">Konsistensi</p>
            <div className="mt-2 flex items-end gap-3">
              <span
                className={`text-5xl font-bold tracking-tight leading-none ${
                  summary.currentStreak >= 7
                    ? "text-warning-600"
                    : summary.currentStreak >= 3
                      ? "text-primary-700"
                      : "text-surface-700"
                }`}
              >
                {summary.currentStreak}
              </span>
              <div className="pb-0.5">
                <p className="text-[13px] font-semibold text-surface-700">hari berturut-turut</p>
                <p className="text-[11px] text-surface-400">
                  Rekor terpanjang: {summary.longestStreak} hari
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => {
                  const active = i < Math.min(summary.currentStreak, 7);
                  return (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        active
                          ? summary.currentStreak >= 7
                            ? "bg-warning-500"
                            : "bg-primary-500"
                          : "bg-surface-200"
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-[11px] text-surface-400">
                {summary.activeDays}/{summary.daysInPeriod} hari aktif (30 hari)
              </span>
            </div>
          </section>

          {/* 30-day summary */}
          <section className="rounded-2xl border border-surface-150 bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="eyebrow text-surface-400">Ringkasan</p>
                <p className="mt-0.5 text-[15px] font-bold text-surface-900">30 hari terakhir</p>
                <p className="mt-0.5 text-[11px] text-surface-400">
                  {summary.completedTasks} task · {formatDuration(summary.totalMinutes)} fokus
                </p>
              </div>
              <FocusOrb
                value={summary.completionRate}
                size={52}
                stroke={5}
                tone="success"
                label={`Penyelesaian ${summary.completionRate} persen`}
              >
                <span className="text-[13px] font-bold text-surface-900">
                  {summary.completionRate}%
                </span>
                <span className="text-[8px] uppercase tracking-wider text-surface-400">
                  selesai
                </span>
              </FocusOrb>
            </div>
            <dl className="space-y-0 border-t border-surface-100 pt-3">
              <StatRow
                icon="clock"
                label="Waktu fokus"
                value={formatDuration(summary.totalMinutes)}
                hint="dalam 30 hari"
              />
              <StatRow
                icon="check"
                tone="success"
                label="Task selesai"
                value={String(summary.completedTasks)}
              />
              <StatRow
                icon="trendingUp"
                tone="primary"
                label="Konsistensi"
                value={`${summary.consistency}%`}
                hint={`${summary.activeDays}/${summary.daysInPeriod} hari aktif`}
              />
              <StatRow
                icon="gauge"
                tone="warning"
                label="Rata-rata sesi"
                value={`${summary.averageSessionMinutes} mnt`}
              />
              {summary.averageUnderstanding !== null && (
                <StatRow
                  icon="sparkles"
                  tone="ai"
                  label="Pemahaman rata-rata"
                  value={`${summary.averageUnderstanding}/5`}
                />
              )}
            </dl>
          </section>

          {/* Recent sessions */}
          <section className="rounded-2xl border border-surface-150 bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="eyebrow text-surface-400">Sesi</p>
                <p className="mt-0.5 text-[14px] font-bold text-surface-900">Terbaru</p>
              </div>
              <span className="text-[11px] text-surface-400">
                {formatDuration(dashboard.studyMinutesToday)} hari ini
              </span>
            </div>
            {dashboard.recentSessions.length === 0 ? (
              <p className="text-[13px] text-surface-400">Belum ada sesi fokus.</p>
            ) : (
              <ul className="divide-y divide-surface-100">
                {dashboard.recentSessions.slice(0, 5).map((session) => (
                  <li
                    key={session.id}
                    className="flex items-start justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/tasks/${session.task.id}`}
                        className="block truncate text-[13px] font-medium text-surface-800 hover:text-primary-700 transition-colors"
                      >
                        {session.task.name}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-surface-400">
                        {session.task.stage.goal.name} ·{" "}
                        {session.durationMinutes === null
                          ? "Aktif"
                          : formatDuration(session.durationMinutes)}
                      </p>
                    </div>
                    <HistoryDeleteButton
                      path={`/api/sessions/${session.id}`}
                      message="Hapus sesi ini dari riwayat?"
                      toastMessage="Sesi dihapus."
                      aria-label="Hapus sesi"
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
