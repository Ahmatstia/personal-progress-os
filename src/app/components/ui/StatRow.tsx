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

const iconConfig: Record<
  string,
  { bg: string; text: string }
> = {
  neutral: { bg: "bg-surface-100", text: "text-surface-600" },
  primary: { bg: "stat-bg-primary", text: "text-primary-600" },
  success: { bg: "stat-bg-success", text: "text-success-600" },
  warning: { bg: "stat-bg-warning", text: "text-warning-600" },
  ai: { bg: "stat-bg-ai", text: "text-ai-600" },
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
  tone?: keyof typeof iconConfig;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  const cfg = iconConfig[tone] ?? iconConfig.neutral;
  return (
    <div
      className={`flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 border-b border-surface-100 last:border-0 ${className}`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.text}`}
      >
        <Icon name={icon} size={14} />
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <dt className="min-w-0 truncate text-[13px] text-surface-500">{label}</dt>
        <dd className="text-right shrink-0">
          <span className="block text-[13px] font-semibold text-surface-900">{value}</span>
          {hint && (
            <span className="block text-[11px] text-surface-400 leading-tight">{hint}</span>
          )}
        </dd>
      </div>
    </div>
  );
}
