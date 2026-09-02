import type { ReactNode } from "react";
import type { IconName } from "./Icon";
import { Icon } from "./Icon";

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  variant = "default",
}: {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "dashed";
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-14 text-center ${
        variant === "dashed"
          ? "rounded-2xl border-2 border-dashed border-surface-200 bg-surface-0"
          : ""
      }`}
    >
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <span aria-hidden="true" className="halo" />
        <span className="relative">
          <Icon name={icon} size={24} />
        </span>
      </div>
      <h3 className="mt-5 text-base font-semibold text-surface-900">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-surface-500">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
