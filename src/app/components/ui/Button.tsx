import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import type { IconName } from "./Icon";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "ai";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.98] select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow",
  secondary:
    "bg-surface-100 text-surface-800 border border-surface-200 hover:bg-surface-150 hover:border-surface-300",
  ghost: "text-surface-600 hover:bg-surface-100 hover:text-surface-900",
  danger: "bg-danger-500 text-white hover:bg-danger-600",
  success: "bg-success-600 text-white hover:bg-success-700",
  ai: "bg-ai-600 text-white shadow-sm hover:bg-ai-700 hover:shadow",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10",
};

type Props = {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconRight,
      loading = false,
      disabled,
      children,
      className = "",
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...rest}
      >
        {loading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : icon ? (
          <Icon name={icon} size={size === "sm" ? 14 : 16} />
        ) : null}
        {children}
        {iconRight && !loading ? (
          <Icon name={iconRight} size={size === "sm" ? 14 : 16} />
        ) : null}
      </button>
    );
  },
);
Button.displayName = "Button";
