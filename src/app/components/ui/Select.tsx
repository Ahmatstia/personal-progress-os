import { forwardRef, type SelectHTMLAttributes } from "react";

const base =
  "w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:opacity-50";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, hint, error, className = "", id, children, ...rest }, ref) => {
    const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <label className="block">
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-surface-700">{label}</span>
        )}
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={`${base} ${className}`}
          {...rest}
        >
          {children}
        </select>
        {error ? (
          <span className="mt-1.5 block text-xs text-danger-600">{error}</span>
        ) : hint ? (
          <span className="mt-1.5 block text-xs text-surface-400">{hint}</span>
        ) : null}
      </label>
    );
  },
);
Select.displayName = "Select";