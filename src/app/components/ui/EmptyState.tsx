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
      className={`flex flex-col items-center justify-center px-6 py-10 text-center ${
        variant === "dashed"
          ? "rounded-2xl border-2 border-dashed border-surface-200 bg-white"
          : ""
      }`}
    >
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 float-gentle">
        <Icon name={icon} size={22} />
      </div>
      <h3 className="mt-4 text-[14px] font-semibold text-surface-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-surface-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
