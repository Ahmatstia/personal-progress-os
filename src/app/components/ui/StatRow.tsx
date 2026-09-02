import type { ReactNode } from "react";
import type { IconName } from "./Icon";
import { Icon } from "./Icon";

export function StatList({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <dl className={`${className}`}>{children}</dl>;
}

const iconTones: Record<string, string> = {
  neutral: "bg-surface-100 text-surface-600",
  primary: "bg-primary-100 text-primary-600",
  success: "bg-success-100 text-success-600",
  warning: "bg-warning-100 text-warning-600",
  ai: "bg-ai-100 text-ai-600",
};

export function StatRow({
  icon,
  tone = "neutral",
  label,
  value,
  hint,
  className = "",
}: {
  icon: IconName;
  tone?: keyof typeof iconTones;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 border-b border-surface-150 last:border-0 ${className}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTones[tone]}`}
      >
        <Icon name={icon} size={15} />
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <dt className="min-w-0 truncate text-sm text-surface-500">{label}</dt>
        <dd className="text-right">
          <span className="block font-semibold text-surface-900">{value}</span>
          {hint && (
            <span className="block text-xs text-surface-400">{hint}</span>
          )}
        </dd>
      </div>
    </div>
  );
}
