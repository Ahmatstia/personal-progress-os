import Link from "next/link";
import { getDashboardData } from "@/services/dashboard.service";
import { getDashboardAnalytics } from "@/services/analytics.service";
import { calculateGoalProgress } from "@/services/progress.service";
import { getToday } from "@/services/today.service";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/app/components/LoginForm";
import { Button } from "@/app/components/ui/Button";
import { NextActionSpotlight } from "@/app/components/core/NextActionSpotlight";
import { SmartInsightCard, buildInsights } from "@/app/components/core/SmartInsightCard";
import { ProgressBar } from "@/app/components/ui/Progress";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Icon } from "@/app/components/ui/Icon";
import { HistoryDeleteButton } from "@/app/components/ui/HistoryDeleteButton";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(value);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Selamat malam";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        {/* Mesh ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 30% -10%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 75% 110%, rgba(139,92,246,0.07) 0%, transparent 60%)",
            backgroundColor: "hsl(38,28%,97%)",
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 dot-grid opacity-40" />

        <section className="relative z-10 w-full max-w-sm">
          {/* Card glass */}
          <div className="rounded-2xl border border-white/80 bg-white/90 p-7 shadow-pop backdrop-blur-sm">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-ai-600 text-white shadow-sm">
                <Icon name="sparkles" size={18} />
              </span>
              <div>
                <p className="text-[15px] font-bold tracking-tight text-surface-900">
                  My<span className="gradient-text">Life</span>
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">
                  Personal Life Operating System
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-2xl font-bold tracking-tight text-surface-900">
                Selamat datang
              </h1>
              <p className="mt-1 text-[13px] text-surface-500">
                Masuk agar goals, progres, dan refleksi Anda tetap pribadi.
              </p>
            </div>

            <LoginForm />
          </div>

          <p className="mt-4 text-center text-[11px] text-surface-400">
            Personal system · Hanya untuk Anda
          </p>
        </section>
      </div>
    );
  }

  const [dashboard, today, analytics] = await Promise.all([
    getDashboardData(user.id),
    getToday(new Date(), user.id),
    getDashboardAnalytics({ days: 30 }, user.id),
  ]);

  // Days since last session
  const now = new Date();
  const lastSession = dashboard.recentSessions[0];
  const daysSinceLastSession = lastSession
    ? Math.floor((now.getTime() - new Date(lastSession.startedAt).getTime()) / 86400000)
    : 999;

  const insights = buildInsights({
    currentStreak: analytics.summary.currentStreak,
    longestStreak: analytics.summary.longestStreak,
    daysSinceLastSession,
    consistency: analytics.summary.consistency,
    studyMinutesToday: dashboard.studyMinutesToday,
    focusTasksCount: today.focusTasks.length,
    activeTasks: analytics.summary.activeTasks,
    bottlenecks: analytics.bottlenecks,
  });

  const goalCount = dashboard.activeGoals.length;
  const completionPct =
    dashboard.totalTaskCount === 0
      ? 0
      : Math.round(
          (dashboard.completedTaskCount / dashboard.totalTaskCount) * 100,
        );

  const firstName = user.name?.split(" ")[0] || "teman";
  const greeting = getGreeting();

  // Determine today's status message
  const todayStatus = today.currentSession
    ? `Sedang mengerjakan: ${today.currentSession.task.title}`
    : today.focusTasks.length > 0
      ? `${today.focusTasks.length} task terpilih untuk hari ini`
      : dashboard.nextAction
        ? `Task berikutnya: ${dashboard.nextAction.taskName}`
        : goalCount === 0
          ? "Mulai dengan membuat Goal pertama Anda untuk menentukan arah hidup dan pekerjaan."
          : "Pilih fokus hari ini untuk mulai";

  return (
    <div className="space-y-8">
      {/* ── Hero Greeting ────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-ai-50 p-6 shadow-soft">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-200/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-ai-200/20 blur-2xl"
        />
        <div className="relative">
          <p className="eyebrow text-primary-500">{greeting}</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            <span className="gradient-text">{firstName}</span> 👋
          </h1>

          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-surface-600">
            {todayStatus}
          </p>

          {/* Quick stats row */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-primary-700 shadow-sm">
              <Icon name="flag" size={12} />
              {goalCount} goal aktif
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-success-700 shadow-sm">
              <Icon name="check" size={12} />
              {dashboard.completedTaskCount}/{dashboard.totalTaskCount} task
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-warning-700 shadow-sm">
              <Icon name="clock" size={12} />
              {formatDuration(dashboard.studyMinutesToday)} hari ini
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ai-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-ai-700 shadow-sm">
              <span className="text-[11px] font-bold">{completionPct}%</span>
              keseluruhan
            </span>
          </div>

          {/* Primary CTA */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href="/today">
              <Button variant="primary" icon="sun" size="sm">
                Buka Hari Ini
              </Button>
            </Link>
            <Link href="/goals">
              <Button variant="secondary" icon="flag" size="sm">
                Lihat Goals
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Onboarding Card for New Users ─────────────────────── */}
      {goalCount === 0 && (
        <section className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50/70 via-white to-ai-50/40 p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-[11px] font-bold text-primary-700">
                Langkah Awal
              </span>
              <h2 className="text-lg font-bold text-surface-900">
                Selamat Datang di MyLife
              </h2>
              <p className="text-xs text-surface-600 max-w-lg leading-relaxed">
                MyLife membantu Anda menyelaraskan tujuan hidup, proyek kerja, fokus harian, dan refleksi mingguan dalam satu sistem yang tenang.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/goals">
                <Button variant="primary" icon="flag" size="sm">
                  Buat Goal Pertama
                </Button>
              </Link>
              <Link href="/capture">
                <Button variant="secondary" icon="inbox" size="sm">
                  Catat Ide di Inbox
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Bento Row: Next Action & Smart Insights ──────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        {/* Next Action — spans 7 cols if insights exist, else 12 */}
        <section className={insights.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" aria-hidden />
            <p className="eyebrow text-primary-500">Langkah Berikutnya</p>
          </div>
          <NextActionSpotlight
            nextAction={dashboard.nextAction}
            progress={dashboard.totalProgress}
          />
        </section>

        {/* Smart Insights — spans 5 cols */}
        {insights.length > 0 && (
          <div className="lg:col-span-5">
            <SmartInsightCard insights={insights} />
          </div>
        )}
      </div>

      {/* ── Review alert ─────────────────────────────────────── */}
      {dashboard.reviewSummary && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
            dashboard.reviewSummary.review
              ? "border-success-200 bg-success-50/60"
              : "border-primary-200 bg-primary-50/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                dashboard.reviewSummary.review
                  ? "bg-success-100 text-success-700"
                  : "bg-primary-100 text-primary-600"
              }`}
            >
              <Icon name="compass" size={15} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-surface-900">
                {dashboard.reviewSummary.review
                  ? "Review minggu ini selesai ✓"
                  : "Waktunya review mingguan"}
              </p>
              <p className="text-[12px] text-surface-500">
                {formatDuration(dashboard.reviewSummary.metrics.learningMinutes)} belajar ·{" "}
                {dashboard.reviewSummary.metrics.tasksCompleted} task selesai
              </p>
            </div>
          </div>
          <Link href={`/goals/${dashboard.reviewSummary.goalId}/reviews`}>
            <Button
              variant={dashboard.reviewSummary.review ? "secondary" : "primary"}
              size="sm"
              iconRight="arrowRight"
            >
              {dashboard.reviewSummary.review ? "Lihat" : "Lengkapi"}
            </Button>
          </Link>
        </div>
      )}

      {/* ── Goals aktif — Responsive 3-Column Grid ──────────── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-ai-500" aria-hidden />
            <p className="eyebrow text-surface-500">Perjalanan Aktif</p>
          </div>
          <Link
            href="/goals"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Lihat semua <Icon name="arrowRight" size={13} />
          </Link>
        </div>

        {dashboard.activeGoals.length === 0 ? (
          <EmptyState
            icon="flag"
            title="Belum ada goals aktif"
            description="Buat goal pertama untuk memulai perjalanan."
            action={
              <Link href="/goals">
                <Button variant="primary" icon="plus" size="sm">
                  Buat goal
                </Button>
              </Link>
            }
            variant="dashed"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {dashboard.activeGoals.map((goal) => {
              const progress = calculateGoalProgress(goal.stages);
              const tasks = goal.stages.flatMap((stage) => stage.tasks);
              const completed = tasks.filter((task) => task.status === "COMPLETED").length;
              const currentStage = goal.stages.find((s) => s.tasks.some((t) => t.status !== "COMPLETED")) ?? goal.stages[0];

              return (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-surface-150 bg-white p-4 shadow-soft transition-all hover:border-primary-300 hover:shadow-[var(--shadow-card-hover)] card-interactive"
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="chip bg-surface-100 text-surface-600 text-[10px] font-semibold">
                        {goal.type}
                      </span>
                      <span className="text-[11px] font-semibold text-surface-400">
                        {completed}/{tasks.length} task
                      </span>
                    </div>

                    {/* Goal title */}
                    <p className="text-[14px] font-bold text-surface-900 group-hover:text-primary-700 transition-colors line-clamp-2">
                      {goal.title}
                    </p>

                    {/* Active stage info */}
                    {currentStage && (
                      <p className="mt-1.5 text-[11.5px] text-surface-500 truncate">
                        Stage: <span className="font-medium text-surface-700">{currentStage.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Progress bar & bottom meta */}
                  <div className="mt-4 pt-3 border-t border-surface-100">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-surface-400">
                        Progres
                      </span>
                      <span className="text-[12px] font-bold text-primary-700">
                        {progress}%
                      </span>
                    </div>
                    <ProgressBar value={progress} size="sm" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Jejak terbaru — Responsive 3-Column Grid ──────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-surface-300" aria-hidden />
          <p className="eyebrow text-surface-400">Jejak Terakhir</p>
        </div>
        {dashboard.recentActivity.length === 0 ? (
          <p className="text-[13px] text-surface-400 px-1">
            Belum ada aktivitas. Mulai sesi pertama untuk membangun momentum.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.recentActivity.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 rounded-xl border border-surface-150 bg-white px-3.5 py-2.5 hover:border-surface-250 hover:shadow-soft transition-all"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    item.kind === "session"
                      ? "bg-ai-50 text-ai-600"
                      : item.kind === "capture"
                        ? "bg-primary-50 text-primary-600"
                        : "bg-success-50 text-success-600"
                  }`}
                >
                  <Icon
                    name={
                      item.kind === "session"
                        ? "play"
                        : item.kind === "capture"
                          ? "inbox"
                          : "check"
                    }
                    size={13}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-surface-800">
                    {item.label}
                  </p>
                  <p className="truncate text-[11px] text-surface-400">{item.detail}</p>
                </div>
                <span className="shrink-0 text-[10.5px] text-surface-400">
                  {formatDate(item.timestamp)}
                </span>
                {item.kind !== "task" && (
                  <HistoryDeleteButton
                    path={
                      item.kind === "session"
                        ? `/api/sessions/${item.entityId}`
                        : `/api/captures/${item.entityId}`
                    }
                    message={
                      item.kind === "session"
                        ? "Hapus sesi ini dari riwayat?"
                        : "Hapus catatan ini?"
                    }
                    toastMessage={
                      item.kind === "session" ? "Sesi dihapus." : "Catatan dihapus."
                    }
                    aria-label="Hapus dari riwayat"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
