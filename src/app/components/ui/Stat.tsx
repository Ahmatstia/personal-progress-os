import type { IconName } from "./Icon";
import { Icon } from "./Icon";
import { ProgressBar } from "./Progress";

export function Stat({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: IconName;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-surface-500">
          {label}
        </p>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-surface-900">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-surface-500">{hint}</p>}
    </div>
  );
}

export function StatWithProgress({
  label,
  value,
  progress,
  hint,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  progress: number;
  hint?: string;
  tone?: "primary" | "success" | "ai" | "info" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-surface-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-surface-900">
        {value}
      </p>
      <div className="mt-4">
        <ProgressBar value={progress} size="sm" tone={tone} />
      </div>
      {hint && <p className="mt-2 text-xs text-surface-500">{hint}</p>}
    </div>
  );
}
