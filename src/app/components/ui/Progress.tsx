export function ProgressBar({
  value,
  size = "md",
  tone = "primary",
  label,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "success" | "ai" | "info" | "warning";
  showLabel?: boolean;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  const color =
    tone === "success"
      ? "bg-success-500"
      : tone === "ai"
        ? "bg-ai-500"
        : tone === "info"
          ? "bg-info-500"
          : tone === "warning"
            ? "bg-warning-500"
            : "bg-primary-500";

  return (
    <div role="progressbar" aria-valuenow={Math.round(clamped)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`w-full overflow-hidden rounded-full bg-surface-150 ${height}`}>
        <div
          className={`h-full rounded-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
