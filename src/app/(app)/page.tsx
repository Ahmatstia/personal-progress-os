import Link from "next/link";
import { getDashboardData } from "@/services/dashboard.service";
import { calculateGoalProgress } from "@/services/progress.service";
import { getToday } from "@/services/today.service";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/app/components/LoginForm";
import { Button } from "@/app/components/ui/Button";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { NextActionSpotlight } from "@/app/components/core/NextActionSpotlight";
import { FocusOrb } from "@/app/components/core/FocusOrb";
import { StatRow } from "@/app/components/ui/StatRow";
import { ProgressBar } from "@/app/components/ui/Progress";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Icon } from "@/app/components/ui/Icon";
import { HistoryDeleteButton } from "@/app/components/ui/HistoryDeleteButton";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(value);
}

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 px-6 py-12">
        <section className="w-full max-w-md rounded-3xl border border-surface-200 bg-surface-0 p-8 shadow-raised">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ai-600 text-white">
              <Icon name="sparkles" size={20} />
            </span>
            <span className="text-lg font-bold tracking-tight text-surface-900">Personal Progress OS</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-surface-900">Selamat datang kembali</h1>
          <p className="mt-2 text-sm leading-relaxed text-surface-500">
            Masuk agar goals, progres, dan refleksi Anda tetap pribadi.
          </p>
          <LoginForm />
        </section>
      </div>
    );
  }

  const [dashboard, today] = await Promise.all([getDashboardData(user.id), getToday(new Date(), user.id)]);

  const goalCount = dashboard.activeGoals.length;
  const completionPct =
    dashboard.totalTaskCount === 0
      ? 0
      : Math.round((dashboard.completedTaskCount / dashboard.totalTaskCount) * 100);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Ringkasan"
        title={
          <span>
            Selamat datang kembali, {user.name?.split(" ")[0] || "teman"}.
          </span>
        }
        description="Berikut ringkasan progres Anda saat ini."
        actions={
          <>
            <Link href="/today">
              <Button variant="primary" icon="sun">Ke Hari Ini</Button>
            </Link>
            <Link href="/goals">
              <Button variant="secondary" icon="flag">Semua goals</Button>
            </Link>
          </>
        }
      />

      {/* Focus + next action for the day */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <NextActionSpotlight nextAction={dashboard.nextAction} />
        <div className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
          <div className="flex items-center gap-2 text-primary-600">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <Icon name="sun" size={16} />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">Hari Ini</p>
          </div>
          <p className="mt-4 text-2xl font-bold text-surface-900">
            {today.currentSession
              ? `Mengerjakan ${today.currentSession.task.name}`
              : today.focusTasks.length > 0
                ? `${today.focusTasks.length} task fokus`
                : "Belum ada fokus dipilih"}
          </p>
          <p className="mt-1.5 text-sm text-surface-500">
            {formatDuration(today.stats.totalMinutes)} belajar · {today.stats.completedTasks} task selesai
          </p>
          <div className="mt-5">
            <Link href="/today">
              <Button variant="secondary" iconRight="arrowRight" size="sm">
                Buka Hari Ini
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress snapshot */}
      <section
        className={`rounded-2xl border bg-surface-0 p-5 shadow-soft ${
          completionPct === 100 ? "border-success-200" : "border-surface-200"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="min-w-[160px]">
              <p className="eyebrow text-surface-400">Ringkasan</p>
              <h2 className="mt-1 text-lg font-semibold text-surface-900">
                {dashboard.completedTaskCount || dashboard.totalTaskCount === 0
                  ? "Semua task beres"
                  : "Dalam perjalanan"}
              </h2>
              <p className="mt-1 max-w-xs text-sm text-surface-500">
                {goalCount} goal aktif · {dashboard.completedTaskCount}/{dashboard.totalTaskCount} task selesai.
              </p>
            </div>
            <FocusOrb
              value={completionPct}
              size={92}
              stroke={7}
              tone={completionPct === 100 ? "success" : "primary"}
              label={`Progres keseluruhan ${completionPct} persen`}
            >
              <span className="text-xl font-bold text-surface-900">{completionPct}%</span>
              <span className="mt-0.5 text-[10px] uppercase tracking-wider text-surface-400">selesai</span>
            </FocusOrb>
          </div>
          <dl className="min-w-[220px] flex-1 grid gap-x-6">
            <StatRow icon="flag" label="Goals aktif" value={String(goalCount)} />
            <StatRow icon="check" tone="success" label="Task selesai" value={`${dashboard.completedTaskCount}/${dashboard.totalTaskCount}`} />
            <StatRow icon="clock" label="Belajar hari ini" value={formatDuration(dashboard.studyMinutesToday)} />
            <StatRow icon="gauge" tone="warning" label="Progres keseluruhan" value={`${dashboard.totalProgress}%`} />
          </dl>
        </div>
      </section>

      {/* Weekly review prompt */}
      {dashboard.reviewSummary && (
        <section
          className={`rounded-2xl border p-5 shadow-soft ${
            dashboard.reviewSummary.review
              ? "border-success-200 bg-success-50"
              : "border-primary-200 bg-primary-50"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  dashboard.reviewSummary.review ? "bg-success-100 text-success-700" : "bg-primary-100 text-primary-600"
                }`}
              >
                <Icon name="compass" size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-surface-900">
                  {dashboard.reviewSummary.review ? "Review minggu ini selesai" : "Waktunya review mingguan"}
                </h2>
                <p className="mt-1 text-sm text-surface-600">
                  {formatDuration(dashboard.reviewSummary.metrics.learningMinutes)} belajar ·{" "}
                  {dashboard.reviewSummary.metrics.tasksCompleted} task selesai
                </p>
                {dashboard.reviewSummary.review?.nextFocus && (
                  <p className="mt-1.5 text-sm text-surface-700">
                    <span className="font-medium">Fokus berikutnya:</span> {dashboard.reviewSummary.review.nextFocus}
                  </p>
                )}
              </div>
            </div>
            <Link href={`/goals/${dashboard.reviewSummary.goalId}/reviews`}>
              <Button variant={dashboard.reviewSummary.review ? "secondary" : "primary"} icon="arrowRight">
                {dashboard.reviewSummary.review ? "Lihat review" : "Lengkapi review"}
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Active goals */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">Goals</p>
            <h2 className="mt-1 text-xl font-bold text-surface-900">Goals aktif</h2>
          </div>
          <Link href="/goals" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            Lihat semua <Icon name="arrowRight" size={15} />
          </Link>
        </div>

        {dashboard.activeGoals.length === 0 ? (
          <div className="rounded-2xl border border-surface-200 bg-surface-0 shadow-soft">
            <EmptyState
              icon="flag"
              title="Belum ada goals aktif"
              description="Ubah hal penting menjadi jalur yang jelas. Goals pertama Anda akan muncul di sini."
              action={<Link href="/goals"><Button variant="primary" icon="plus">Buat goal</Button></Link>}
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.activeGoals.map((goal) => {
              const progress = calculateGoalProgress(goal.stages);
              const tasks = goal.stages.flatMap((stage) => stage.tasks);
              const completed = tasks.filter((task) => task.status === "COMPLETED").length;
              return (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className="group rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-raised"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">{goal.type}</p>
                      <h3 className="mt-1 truncate font-semibold text-surface-900 group-hover:text-primary-700">{goal.name}</h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <ProgressBar value={progress} size="sm" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-surface-500">
                    <span>{completed} / {tasks.length} task</span>
                    <span>{goal.stages.length} stage</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-surface-500">
            <Icon name="clock" size={16} />
          </span>
          <h2 className="text-base font-semibold text-surface-900">Aktivitas terbaru</h2>
        </div>
        {dashboard.recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-surface-500">
            Belum ada aktivitas. Mulai sesi pertama atau catat sesuatu untuk membangun momentum.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-surface-150">
            {dashboard.recentActivity.slice(0, 6).map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    item.kind === "session"
                      ? "bg-ai-50 text-ai-600"
                      : item.kind === "capture"
                        ? "bg-primary-50 text-primary-600"
                        : "bg-success-50 text-success-600"
                  }`}
                >
                  <Icon name={item.kind === "session" ? "play" : item.kind === "capture" ? "inbox" : "check"} size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-surface-800">{item.label}</p>
                  <p className="truncate text-xs text-surface-500">{item.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-surface-400">{formatDate(item.timestamp)}</span>
                {item.kind !== "task" && (
                  <HistoryDeleteButton
                    path={item.kind === "session" ? `/api/sessions/${item.entityId}` : `/api/captures/${item.entityId}`}
                    message={item.kind === "session" ? "Hapus sesi ini dari riwayat?" : "Hapus catatan ini?"}
                    toastMessage={item.kind === "session" ? "Sesi dihapus." : "Catatan dihapus."}
                    aria-label="Hapus dari riwayat"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
