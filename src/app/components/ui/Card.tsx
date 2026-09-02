import type { ReactNode } from "react";

const pads = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

const tones = {
  default: "border-surface-200 bg-surface-0",
  subtle: "border-surface-150 bg-surface-50",
  primary: "border-primary-200 bg-primary-50/40",
  success: "border-success-200 bg-success-50",
  warning: "border-warning-200 bg-warning-50",
  ai: "border-ai-200 bg-ai-50",
} as const;

export function Card({
  children,
  className = "",
  pad = "md",
  tone = "default",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  pad?: keyof typeof pads;
  tone?: keyof typeof tones;
  as?: "section" | "article" | "div" | "li";
}) {
  return (
    <Tag
      className={`rounded-2xl border shadow-soft ${tones[tone]} ${pads[pad]} ${className}`}
    >
      {children}
    </Tag>
  );
}