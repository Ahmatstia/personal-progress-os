import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-surface-500">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
