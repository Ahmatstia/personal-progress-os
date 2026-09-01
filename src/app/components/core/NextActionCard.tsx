import Link from "next/link";
import { Icon } from "../ui/Icon";
import { StartSessionButton } from "./StartSessionButton";

export function NextActionCard({
  nextAction,
  className = "",
}: {
  nextAction: {
    taskId: string;
    goalId: string;
    goalName: string;
    stageName: string;
    taskName: string;
    priority?: string;
    estimatedHours?: number;
    startedAt?: Date | null;
    reason?: string;
  } | null;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-surface-0 to-surface-0 p-6 shadow-soft sm:p-7 ${className}`}
    >
      <div className="flex items-center gap-2 text-primary-600">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
          <Icon name="bolt" size={16} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">
          Next action
        </p>
      </div>

      {!nextAction ? (
        <div className="mt-5">
          <h2 className="text-xl font-semibold text-surface-900">
            Everything is clear
          </h2>
          <p className="mt-2 max-w-md text-sm text-surface-500">
            You have no outstanding next action. Create a task or complete your
            reviews to keep momentum.
          </p>
          <div className="mt-5 flex gap-2">
            <Link
              href="/today"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Icon name="sun" size={16} /> Go to Today
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
            Do this next
          </p>
          <h2 className="mt-1.5 text-xl font-bold leading-snug text-surface-900">
            {nextAction.taskName}
          </h2>
          <p className="mt-2 text-sm text-surface-500">
            {nextAction.goalName}
            <span className="mx-1.5 text-surface-300">·</span>
            {nextAction.stageName}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <StartSessionButton taskId={nextAction.taskId} taskName={nextAction.taskName} />
            <Link
              href={`/tasks/${nextAction.taskId}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-surface-200 bg-surface-0 px-4 text-sm font-semibold text-surface-700 hover:bg-surface-100"
            >
              <Icon name="arrowRight" size={16} /> Open task
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
