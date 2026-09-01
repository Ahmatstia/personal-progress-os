import Link from "next/link";
import { getDashboardData } from "@/services/dashboard.service";
import { calculateGoalProgress } from "@/services/progress.service";
import { getToday } from "@/services/today.service";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/app/components/LoginForm";
import { Button } from "@/app/components/ui/Button";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ProgressSnapshot } from "@/app/components/core/ProgressSnapshot";
import { NextActionCard } from "@/app/components/core/NextActionCard";
import { ProgressBar } from "@/app/components/ui/Progress";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Icon } from "@/app/components/ui/Icon";

export const dynamic = "force-dynamic";

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(value);
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
          <h1 className="mt-6 text-2xl font-bold text-surface-900">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-surface-500">
            Sign in to keep your goals, progress, and reflections private to you.
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
        eyebrow="Overview"
        title={
          <span>
            Welcome back, {user.name?.split(" ")[0] || "friend"}.
          </span>
        }
        description="Here’s what’s happening across your progress right now."
        actions={
          <>
            <Link href="/today">
              <Button variant="primary" icon="sun">Go to Today</Button>
            </Link>
            <Link href="/goals">
              <Button variant="secondary" icon="flag">All goals</Button>
            </Link>
          </>
        }
      />

      {/* Focus + next action for the day */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <NextActionCard nextAction={dashboard.nextAction} />
        <div className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
          <div className="flex items-center gap-2 text-primary-600">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <Icon name="sun" size={16} />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">Today</p>
          </div>
          <p className="mt-4 text-2xl font-bold text-surface-900">
            {today.currentSession
              ? `Working on ${today.currentSession.task.name}`
              : today.focusTasks.length > 0
                ? `${today.focusTasks.length} focus task${today.focusTasks.length > 1 ? "s" : ""}`
                : "No focus chosen yet"}
          </p>
          <p className="mt-1.5 text-sm text-surface-500">
            {formatMinutes(today.stats.totalMinutes)} studied · {today.stats.completedTasks} tasks completed
          </p>
          <div className="mt-5">
            <Link href="/today">
              <Button variant="secondary" iconRight="arrowRight" size="sm">
                Open Today
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress snapshot */}
      <ProgressSnapshot
        items={[
          { label: "Active goals", value: String(goalCount), icon: "flag", hint: "in motion" },
          { label: "Tasks complete", value: `${dashboard.completedTaskCount}/${dashboard.totalTaskCount}`, icon: "check", hint: `${completionPct}% done` },
          { label: "Studied today", value: formatMinutes(dashboard.studyMinutesToday), icon: "clock", hint: "session time" },
          { label: "Overall progress", value: `${dashboard.totalProgress}%`, icon: "gauge", hint: "across goals" },
        ]}
      />

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
                  {dashboard.reviewSummary.review ? "This week’s review is complete" : "Time for a weekly review"}
                </h2>
                <p className="mt-1 text-sm text-surface-600">
                  {dashboard.reviewSummary.metrics.learningHours.toFixed(1)}h learning ·{" "}
                  {dashboard.reviewSummary.metrics.tasksCompleted} tasks completed
                </p>
                {dashboard.reviewSummary.review?.nextFocus && (
                  <p className="mt-1.5 text-sm text-surface-700">
                    <span className="font-medium">Next focus:</span> {dashboard.reviewSummary.review.nextFocus}
                  </p>
                )}
              </div>
            </div>
            <Link href={`/goals/${dashboard.reviewSummary.goalId}/reviews`}>
              <Button variant={dashboard.reviewSummary.review ? "secondary" : "primary"} icon="arrowRight">
                {dashboard.reviewSummary.review ? "View review" : "Complete review"}
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
            <h2 className="mt-1 text-xl font-bold text-surface-900">Active goals</h2>
          </div>
          <Link href="/goals" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            View all <Icon name="arrowRight" size={15} />
          </Link>
        </div>

        {dashboard.activeGoals.length === 0 ? (
          <div className="rounded-2xl border border-surface-200 bg-surface-0 shadow-soft">
            <EmptyState
              icon="flag"
              title="No active goals yet"
              description="Turn something important into a clear path forward. Your first goal will appear here."
              action={<Link href="/goals"><Button variant="primary" icon="plus">Create a goal</Button></Link>}
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
                    <span>{completed} / {tasks.length} tasks</span>
                    <span>{goal.stages.length} stage{goal.stages.length === 1 ? "" : "s"}</span>
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
          <h2 className="text-base font-semibold text-surface-900">Recent activity</h2>
        </div>
        {dashboard.recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-surface-500">
            No sessions or task updates yet. Start your first session to build momentum.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-surface-150">
            {dashboard.recentActivity.slice(0, 6).map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    item.kind === "session" ? "bg-ai-50 text-ai-600" : "bg-success-50 text-success-600"
                  }`}
                >
                  <Icon name={item.kind === "session" ? "play" : "check"} size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-surface-800">{item.label}</p>
                  <p className="truncate text-xs text-surface-500">{item.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-surface-400">{formatDate(item.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
