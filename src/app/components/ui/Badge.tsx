import type { IconName } from "./Icon";
import { Icon } from "./Icon";

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "ai";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-100 text-surface-600 border-surface-200",
  primary: "bg-primary-50 text-primary-700 border-primary-200",
  success: "bg-success-50 text-success-700 border-success-200",
  warning: "bg-warning-50 text-warning-600 border-warning-200",
  danger: "bg-danger-50 text-danger-600 border-danger-200",
  info: "bg-info-50 text-info-600 border-info-200",
  ai: "bg-ai-50 text-ai-700 border-ai-200",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  dot = false,
  className = "",
}: {
  tone?: Tone;
  icon?: IconName;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {icon && <Icon name={icon} size={13} />}
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/* Status badge — maps raw status strings to a tone + readable label */
const statusMap: Record<string, { tone: Tone; label: string }> = {
  ACTIVE: { tone: "primary", label: "Aktif" },
  PAUSED: { tone: "warning", label: "Dijeda" },
  COMPLETED: { tone: "success", label: "Selesai" },
  NOT_STARTED: { tone: "neutral", label: "Belum dimulai" },
  IN_PROGRESS: { tone: "primary", label: "Sedang dikerjakan" },
};

export function StatusBadge({ status }: { status: string }) {
  const mapped = statusMap[status] ?? {
    tone: "neutral" as Tone,
    label: status.replace(/_/g, " "),
  };
  return <Badge tone={mapped.tone} dot>{mapped.label}</Badge>;
}

const priorityMap: Record<string, { tone: Tone; label: string }> = {
  HIGH: { tone: "danger", label: "Tinggi" },
  MEDIUM: { tone: "warning", label: "Sedang" },
  LOW: { tone: "neutral", label: "Rendah" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const { tone, label } = priorityMap[priority] ?? { tone: "neutral" as Tone, label: priority };
  return <Badge tone={tone}>{label}</Badge>;
}
