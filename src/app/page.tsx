import Link from "next/link";
import NewGoalButton from "./components/NewGoalButton";
import AICommandPanel from "./components/AICommandPanel";
import { getDashboardData } from "@/services/dashboard.service";
import { calculateGoalProgress } from "@/services/progress.service";
import { getToday } from "@/services/today.service";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./components/LoginForm";

export const dynamic = "force-dynamic";

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white"><section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Personal Progress OS</p><h1 className="mt-4 text-3xl font-bold">Sign in to continue</h1><p className="mt-3 text-sm leading-6 text-slate-400">Your goals and progress are private to your account.</p><LoginForm /></section></main>;
  const [dashboard, today] = await Promise.all([getDashboardData(user.id), getToday(new Date(), user.id)]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Personal Progress OS
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Your progress, organized.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                A single place for goals, stages, tasks, sessions, and the next
                action that keeps you moving.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <NewGoalButton />
              <Link
                href="/today"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Today
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Analytics
              </Link>
              <Link
                href="#goals"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                View goals
              </Link>
            </div>
          </div>
        </header>

        <AICommandPanel />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Active goals
            </p>
            <p className="mt-3 text-3xl font-bold">{dashboard.activeGoalCount}</p>
            <p className="mt-2 text-sm text-slate-400">
              {dashboard.totalTaskCount} tasks across all active goals
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Today&apos;s study time
            </p>
            <p className="mt-3 text-3xl font-bold">
              {formatMinutes(dashboard.studyMinutesToday)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Based on recorded session durations
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Completed tasks
            </p>
            <p className="mt-3 text-3xl font-bold">
              {dashboard.completedTaskCount}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {dashboard.totalTaskCount === 0
                ? "No tasks yet"
                : `${Math.round(
                    (dashboard.completedTaskCount / dashboard.totalTaskCount) *
                      100,
                  )}% complete`}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Overall progress
            </p>
            <p className="mt-3 text-3xl font-bold">{dashboard.totalProgress}%</p>
            <p className="mt-2 text-sm text-slate-400">
              Average progress across active goals
            </p>
          </article>
        </section>

        {dashboard.reviewSummary && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Weekly review</p>
                <h2 className="mt-2 text-xl font-semibold">{dashboard.reviewSummary.review ? "This week" : "You haven't reviewed this week yet."}</h2>
                <p className="mt-2 text-sm text-slate-400">{dashboard.reviewSummary.metrics.learningHours.toFixed(1)}h learning · {dashboard.reviewSummary.metrics.tasksCompleted} completed tasks</p>
              </div>
              <Link href={`/goals/${dashboard.reviewSummary.goalId}/reviews`} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">{dashboard.reviewSummary.review ? "View Review" : "Complete Weekly Review"}</Link>
            </div>
            {dashboard.reviewSummary.review?.nextFocus && <p className="mt-4 text-sm text-emerald-200">Next focus: {dashboard.reviewSummary.review.nextFocus}</p>}
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Today&apos;s focus</p>
              <h2 className="mt-2 text-xl font-semibold">{today.currentSession ? `Working on ${today.currentSession.task.name}` : `${today.focusTasks.length} focus tasks selected`}</h2>
              <p className="mt-2 text-sm text-slate-400">{formatMinutes(today.stats.totalMinutes)} worked · {today.stats.completedTasks} tasks completed · {today.focusCompleted} / {today.focusTotal} focus complete</p>
            </div>
            <Link href="/today" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">Open Today</Link>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Next action
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  What should I do now?
                </h2>
              </div>
              <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                Priority task
              </div>
            </div>

            {dashboard.nextAction ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">Task</p>
                  <p className="mt-1 text-xl font-semibold">
                    {dashboard.nextAction.taskName}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">
                    Goal: {dashboard.nextAction.goalName}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Stage: {dashboard.nextAction.stageName}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Estimated: {dashboard.nextAction.estimatedHours} h
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/goals/${dashboard.nextAction.goalId}`}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                  >
                    Open goal
                  </Link>
                  <span className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300">
                    {dashboard.nextAction.priority}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-400">
                No available next action yet. Create a task to get started.
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Recent activity
            </p>
            <div className="mt-6 space-y-4">
              {dashboard.recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No sessions or task updates yet.
                </p>
              ) : (
                dashboard.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.detail}
                        </p>
                      </div>
                      <span className="text-xs text-slate-600">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section id="goals" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Active goals
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Current focus</h2>
            </div>
          </div>

          {dashboard.activeGoals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
              You don&apos;t have any active goals yet.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.activeGoals.map((goal) => {
                const progress = calculateGoalProgress(goal.stages);
                const tasks = goal.stages.flatMap((stage) => stage.tasks);
                const completedTasks = tasks.filter(
                  (task) => task.status === "COMPLETED",
                ).length;

                return (
                  <Link
                    key={goal.id}
                    href={`/goals/${goal.id}`}
                    className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {goal.type}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">
                          {goal.name}
                        </h3>
                      </div>
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                        {goal.status}
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-2 min-h-10 text-sm text-slate-400">
                      {goal.description || "No description yet."}
                    </p>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                        <span>Progress</span>
                        <span className="text-white">{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {completedTasks} / {tasks.length} tasks
                      </span>
                      <span>{goal.stages.length} stages</span>
                    </div>

                    <div className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-500">
                      Updated {formatDate(goal.updatedAt)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
