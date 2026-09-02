import Link from "next/link";
import { getDashboardData } from "@/services/dashboard.service";
import { calculateGoalProgress } from "@/services/progress.service";
import { getToday } from "@/services/today.service";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/app/components/LoginForm";
import { Button } from "@/app/components/ui/Button";
import { NextActionSpotlight } from "@/app/components/core/NextActionSpotlight";
import { FocusOrb } from "@/app/components/core/FocusOrb";
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
                  Personal Progress<span className="gradient-text">OS</span>
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">
                  Sistem kemajuan
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

  const [dashboard, today] = await Promise.all([
    getDashboardData(user.id),
    getToday(new Date(), user.id),
  ]);

  const goalCount = dashboard.activeGoals.length;
  const completionPct =
    dashboard.totalTaskCount === 0
      ? 0
      : Math.round(
          (dashboard.completedTaskCount / dashboard.totalTaskCount) * 100,
        );

  const firstName = user.name?.split(" ")[0] || "teman";

  return (
    <div className="space-y-6">
      {/* ── Hero header ────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-primary-600">Ringkasan</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">
            Halo,{" "}
            <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="mt-0.5 text-[13px] text-surface-500">
            Berikut status perjalanan Anda hari ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/today">
            <Button variant="primary" icon="sun" size="sm">
              Hari Ini
            </Button>
          </Link>
          <Link href="/goals">
            <Button variant="secondary" icon="flag" size="sm">
              Goals
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Bento row 1: Next action + Hari Ini card ──────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <NextActionSpotlight
          nextAction={dashboard.nextAction}
          progress={dashboard.totalProgress}
        />

        {/* Hari Ini mini card */}
        <div className="rounded-2xl border border-surface-150 bg-white p-4 shadow-soft card-interactive shine-parent">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-warning-400 to-warning-500 text-white">
              <Icon name="sun" size={12} />
            </span>
            <p className="eyebrow text-surface-500">Hari Ini</p>
          </div>
          <p className="mt-3 text-[15px] font-bold leading-snug text-surface-900">
            {today.currentSession
              ? `Mengerjakan: ${today.currentSession.task.name}`
              : today.focusTasks.length > 0
                ? `${today.focusTasks.length} task fokus menunggu`
                : "Belum ada fokus dipilih"}
          </p>
          <p className="mt-1 text-[12px] text-surface-500">
            {formatDuration(today.stats.totalMinutes)} belajar ·{" "}
            {today.stats.completedTasks} task selesai
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-surface-400">
              {today.focusCompleted}/{today.focusTotal} fokus selesai
            </span>
            <Link href="/today">
              <Button variant="ghost" size="sm" iconRight="arrowRight">
                Buka
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bento row 2: Stats grid ──────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Goals aktif */}
        <div className="bento-tile stat-bg-primary p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="eyebrow text-primary-500">Goals aktif</p>
              <p className="mt-1.5 text-2xl font-bold text-surface-900">{goalCount}</p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Icon name="flag" size={15} />
            </span>
          </div>
        </div>

        {/* Task selesai */}
        <div className="bento-tile stat-bg-success p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="eyebrow text-success-600">Task selesai</p>
              <p className="mt-1.5 text-2xl font-bold text-surface-900">
                {dashboard.completedTaskCount}
                <span className="text-sm font-normal text-surface-400">
                  /{dashboard.totalTaskCount}
                </span>
              </p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success-100 text-success-600">
              <Icon name="check" size={15} />
            </span>
          </div>
        </div>

        {/* Belajar hari ini */}
        <div className="bento-tile stat-bg-warning p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="eyebrow text-warning-600">Belajar hari ini</p>
              <p className="mt-1.5 text-2xl font-bold text-surface-900">
                {formatDuration(dashboard.studyMinutesToday)}
              </p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
              <Icon name="clock" size={15} />
            </span>
          </div>
        </div>

        {/* Progres keseluruhan — orb besar */}
        <div className="bento-tile stat-bg-ai p-4 flex items-center gap-3">
          <FocusOrb
            value={completionPct}
            size={56}
            stroke={5}
            tone={completionPct === 100 ? "success" : "primary"}
            label={`Progres keseluruhan ${completionPct} persen`}
          >
            <span className="text-sm font-bold text-surface-900">{completionPct}%</span>
          </FocusOrb>
          <div>
            <p className="eyebrow text-ai-600">Progres</p>
            <p className="mt-0.5 text-[13px] font-semibold text-surface-700">Keseluruhan</p>
          </div>
        </div>
      </div>

      {/* ── Review alert ─────────────────────────────────── */}
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

      {/* ── Goals aktif ──────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" aria-hidden />
            <p className="eyebrow text-surface-500">Goals aktif</p>
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
          <div className="space-y-2">
            {dashboard.activeGoals.map((goal) => {
              const progress = calculateGoalProgress(goal.stages);
              const tasks = goal.stages.flatMap((stage) => stage.tasks);
              const completed = tasks.filter((task) => task.status === "COMPLETED").length;
              return (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-surface-150 bg-white px-4 py-3 transition-all hover:border-primary-200 hover:shadow-[var(--shadow-card-hover)] card-interactive"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="chip bg-surface-100 text-surface-500">
                        {goal.type}
                      </span>
                      <span className="text-[11px] text-surface-400">
                        {completed}/{tasks.length} task
                      </span>
                    </div>
                    <p className="truncate text-[14px] font-semibold text-surface-800 group-hover:text-primary-700 transition-colors">
                      {goal.name}
                    </p>
                  </div>
                  <div className="flex w-36 shrink-0 items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar value={progress} size="sm" />
                    </div>
                    <span className="w-9 shrink-0 text-right text-[13px] font-bold text-primary-700">
                      {progress}%
                    </span>
                  </div>
                  <Icon
                    name="arrowRight"
                    size={14}
                    className="shrink-0 text-surface-300 group-hover:text-primary-500 transition-colors"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Aktivitas terbaru ─────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-surface-300" aria-hidden />
          <p className="eyebrow text-surface-400">Jejak</p>
        </div>
        {dashboard.recentActivity.length === 0 ? (
          <p className="text-[13px] text-surface-400 px-1">
            Belum ada aktivitas. Mulai sesi pertama untuk membangun momentum.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {dashboard.recentActivity.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 rounded-xl border border-surface-100 bg-white px-3 py-2.5 hover:border-surface-200 hover:shadow-soft transition-all"
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
                  <p className="truncate text-[13px] font-medium text-surface-800">
                    {item.label}
                  </p>
                  <p className="truncate text-[11px] text-surface-400">{item.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] text-surface-400">
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
