import Link from "next/link";
import { Icon } from "../ui/Icon";
import { StatusBadge } from "../ui/Badge";

type TaskItem = {
  id: string;
  name: string;
  status: string;
};

type StageItem = {
  id: string;
  name: string;
  tasks: TaskItem[];
  progress: number;
  isCompleted: boolean;
};

export function ProgressPath({
  stages,
  goalId,
}: {
  stages: StageItem[];
  goalId: string;
}) {
  return (
    <ol className="relative space-y-3 border-l-2 border-surface-200 pl-6">
      {stages.map((stage, index) => (
        <li key={stage.id} className="relative">
          <span
            className={`absolute -left-[31px] top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-surface-0 ${
              stage.isCompleted
                ? "border-success-500 text-success-600"
                : stage.progress > 0
                  ? "border-primary-500 text-primary-600"
                  : "border-surface-300 text-surface-300"
            }`}
            aria-hidden="true"
          >
            {stage.isCompleted ? (
              <Icon name="check" size={12} strokeWidth={3} />
            ) : (
              <span className="text-[10px] font-bold">{index + 1}</span>
            )}
          </span>

          <div className="rounded-2xl border border-surface-200 bg-surface-0 p-4 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                  Stage {index + 1}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-surface-900">
                    {stage.name}
                  </h3>
                  {stage.isCompleted && (
                    <StatusBadge status="COMPLETED" />
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-surface-700">
                {stage.progress}%
              </span>
            </div>

            {stage.tasks.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-surface-150 pt-3">
                {stage.tasks.slice(0, 4).map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tasks/${task.id}`}
                      className={`group flex items-center gap-2 text-sm transition hover:text-primary-700 ${
                        task.status === "COMPLETED"
                          ? "text-surface-400 line-through"
                          : "text-surface-600"
                      }`}
                    >
                      <Icon
                        name="check"
                        size={13}
                        className={
                          task.status === "COMPLETED"
                            ? "text-success-500"
                            : "text-surface-300 group-hover:text-primary-400"
                        }
                      />
                      <span className="truncate">{task.name}</span>
                    </Link>
                  </li>
                ))}
                {stage.tasks.length > 4 && (
                  <li className="pl-5 text-xs text-surface-400">
                    +{stage.tasks.length - 4} more tasks
                  </li>
                )}
              </ul>
            )}

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-surface-500">
                {stage.tasks.filter((t) => t.status === "COMPLETED").length} /{" "}
                {stage.tasks.length} tasks
              </span>
              <Link
                href={`/goals/${goalId}#stage-${stage.id}`}
                className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700"
              >
                Open <Icon name="arrowRight" size={13} />
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
