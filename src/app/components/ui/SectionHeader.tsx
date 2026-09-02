import type { ReactNode } from "react";
import type { IconName } from "./Icon";
import { Icon } from "./Icon";

const iconTones: Record<string, string> = {
  primary: "bg-primary-100 text-primary-600",
  ai: "bg-ai-100 text-ai-600",
  success: "bg-success-100 text-success-600",
  warning: "bg-warning-100 text-warning-600",
  neutral: "bg-surface-100 text-surface-600",
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  icon,
  iconTone = "primary",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: IconName;
  iconTone?: keyof typeof iconTones;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTones[iconTone]}`}
          >
            <Icon name={icon} size={16} />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow text-surface-400">{eyebrow}</p>}
          <h2 className="text-base font-semibold text-surface-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-surface-500">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}