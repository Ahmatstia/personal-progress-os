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
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-primary-400" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
              {eyebrow}
            </p>
          </div>
        )}
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-surface-500">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
