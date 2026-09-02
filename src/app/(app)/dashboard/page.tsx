import Link from "next/link";
import AnalyticsBars from "@/app/components/AnalyticsBars";
import { AICommandPanel } from "@/app/components/AICommandPanel";
import { BottleneckInsight } from "@/app/components/core/BottleneckInsight";
import { NextActionSpotlight } from "@/app/components/core/NextActionSpotlight";
import { FocusOrb } from "@/app/components/core/FocusOrb";
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
    getDashboardAnalytics({ days: 30, goalId }, user.id),
    getDashboardData(user.id),
  ]);
  const { summary, bottlenecks } = analytics;

  return (
    <div className="space-y-12">
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

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        {/* Alur utama — kisah progres */}
        <div className="min-w-0 space-y-10">
          <NextActionSpotlight nextAction={dashboard.nextAction} progress={dashboard.totalProgress} />

          <BottleneckInsight bottlenecks={bottlenecks} />

          <section className="border-t border-surface-150 pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow text-surface-400">Visualisasi</p>
                <h2 className="mt-1 text-xl font-bold text-surface-900">Tren aktivitas</h2>
                <p className="mt-1 text-sm text-surface-500">Jam fokus dan task selesai dalam 30 hari terakhir.</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-surface-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-ai-500" /> Jam fokus
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary-500" /> Task
                </span>
              </div>
            </div>
            <div className="mt-5">
              <AnalyticsBars trends={analytics.trends} />
            </div>
          </section>

          <section className="border-t border-surface-150 pt-6">
            <div>
              <p className="eyebrow text-surface-400">Aktivitas</p>
              <h2 className="mt-1 text-xl font-bold text-surface-900">Terbaru</h2>
              <p className="mt-1 text-sm text-surface-500">Jejak sesi, catatan, dan task yang baru saja terjadi.</p>
            </div>
            {dashboard.recentActivity.length === 0 ? (
              <p className="mt-5 text-sm text-surface-500">Belum ada aktivitas tercatat.</p>
            ) : (
              <ol className="mt-4 divide-y divide-surface-150">
                {dashboard.recentActivity.slice(0, 6).map((activity) => (
                  <li key={activity.id} className="flex items-center gap-3 py-3">
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
                        name={
                          activity.kind === "session"
                            ? "clock"
                            : activity.kind === "capture"
                              ? "inbox"
                              : "check"
                        }
                        size={14}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-surface-800">{activity.label}</p>
                      <p className="truncate text-xs text-surface-500">{activity.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-surface-400">
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
                            ? "Hapus sesi ini dari riwayat?"
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

          <section className="border-t border-surface-150 pt-6">
            <div>
              <p className="eyebrow text-ai-600">Asisten</p>
              <h2 className="mt-1 text-xl font-bold text-surface-900">Kendalikan dengan bahasa</h2>
              <p className="mt-1 text-sm text-surface-500">
                Minta AI melakukan sesuatu pada data Anda — mulai sesi, selesaikan task, buka goal, atau catat.
              </p>
            </div>
            <div className="mt-5">
              <AICommandPanel initialContext={{ goalId }} />
            </div>
          </section>
        </div>

        {/* Konteks — angka penting yang tetap terlihat */}
        <aside className="mt-10 space-y-8 lg:sticky lg:top-20 lg:mt-0">
          <section className="rounded-3xl border border-surface-200 bg-surface-0 p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-surface-400">Ringkasan</p>
                <h2 className="mt-1 text-lg font-bold text-surface-900">30 hari terakhir</h2>
                <p className="mt-1 max-w-[220px] text-sm text-surface-500">
                  {summary.completedTasks} task selesai, {formatDuration(summary.totalMinutes)} fokus tercatat.
                </p>
              </div>
              <FocusOrb
                value={summary.completionRate}
                size={72}
                stroke={6}
                tone="success"
                label={`Penyelesaian ${summary.completionRate} persen`}
              >
                <span className="text-lg font-bold text-surface-900">{summary.completionRate}%</span>
                <span className="mt-0.5 text-[9px] uppercase tracking-wider text-surface-400">selesai</span>
              </FocusOrb>
            </div>
            <dl className="mt-6 space-y-3 border-t border-surface-150 pt-4">
              <StatRow icon="clock" label="Waktu fokus" value={formatDuration(summary.totalMinutes)} hint="dalam 30 hari" />
              <StatRow icon="check" tone="success" label="Task selesai" value={String(summary.completedTasks)} />
              <StatRow icon="trendingUp" tone="primary" label="Konsistensi" value={`${summary.consistency}%`} hint={`${summary.activeDays}/${summary.daysInPeriod} hari aktif`} />
              <StatRow icon="gauge" tone="warning" label="Rata-rata sesi" value={`${summary.averageSessionMinutes} mnt`} />
            </dl>
          </section>

          <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
            <div>
              <p className="eyebrow text-surface-400">Ritme</p>
              <h2 className="mt-1 text-base font-semibold text-surface-900">Konsistensi</h2>
            </div>
            <dl className="mt-4 space-y-3">
              {[
                { label: "Hari aktif", value: `${summary.activeDays} / ${summary.daysInPeriod}` },
                { label: "Rekor saat ini", value: `${summary.currentStreak} hari` },
                { label: "Rekor terpanjang", value: `${summary.longestStreak} hari` },
                { label: "Rata-rata sesi", value: `${summary.averageSessionMinutes} mnt` },
                {
                  label: "Pemahaman",
                  value:
                    summary.averageUnderstanding === null
                      ? "Tidak ada data"
                      : `${summary.averageUnderstanding} / 5`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 border-b border-surface-150 pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-sm text-surface-500">{row.label}</dt>
                  <dd className="text-sm font-semibold text-surface-800">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-surface-400">Sesi</p>
                <h2 className="mt-1 text-base font-semibold text-surface-900">Terbaru</h2>
              </div>
              <span className="text-xs text-surface-400">{formatDuration(dashboard.studyMinutesToday)} hari ini</span>
            </div>
            {dashboard.recentSessions.length === 0 ? (
              <p className="mt-4 text-sm text-surface-500">Belum ada sesi fokus.</p>
            ) : (
              <ul className="mt-3 divide-y divide-surface-150">
                {dashboard.recentSessions.slice(0, 5).map((session) => (
                  <li key={session.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/tasks/${session.task.id}`}
                        className="block truncate text-sm font-medium text-surface-800 hover:text-primary-700"
                      >
                        {session.task.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-surface-500">
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