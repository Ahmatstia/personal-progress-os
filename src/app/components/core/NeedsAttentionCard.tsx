import Link from "next/link";
import { Icon } from "@/app/components/ui/Icon";

export type NeedsAttentionItem = {
  id: string;
  type: "OVERDUE_TASK" | "UPCOMING_EVENT" | "URGENT_NOTIFICATION" | "ACTIVE_SESSION" | "DAILY_FOCUS" | "WEEKLY_REVIEW";
  title: string;
  subtitle: string;
  linkUrl: string;
  severity: "URGENT" | "WARNING" | "INFO";
};

export function NeedsAttentionCard({ items }: { items: NeedsAttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-success-200/60 bg-gradient-to-r from-success-50/50 to-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-100 text-success-600">
            <Icon name="check" size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-success-900">Semua Terkendali ✨</p>
            <p className="text-[11px] text-success-700">Tidak ada task terlewat atau pengingat mendesak yang butuh perhatian saat ini.</p>
          </div>
        </div>
      </div>
    );
  }

  function getSeverityColor(sev: string) {
    if (sev === "URGENT") return "bg-danger-100 text-danger-700 border-danger-200/80";
    if (sev === "WARNING") return "bg-warning-100 text-warning-800 border-warning-200/80";
    return "bg-primary-100 text-primary-700 border-primary-200/80";
  }

  function getIcon(type: string) {
    switch (type) {
      case "OVERDUE_TASK":
        return "layers";
      case "UPCOMING_EVENT":
        return "calendar";
      case "URGENT_NOTIFICATION":
        return "bell";
      case "ACTIVE_SESSION":
        return "timer";
      case "DAILY_FOCUS":
        return "target";
      case "WEEKLY_REVIEW":
        return "capture";
      default:
        return "bell";
    }
  }

  return (
    <div className="rounded-xl border border-surface-200/80 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-warning-100 text-warning-700">
            <Icon name="bell" size={12} />
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-surface-800">
            Perlu Perhatian ({items.length})
          </h2>
        </div>
        <Link
          href="/notifications"
          className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
        >
          Lihat Semua <Icon name="arrowRight" size={10} />
        </Link>
      </div>

      <div className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.id}
            href={item.linkUrl}
            className={`group flex items-center justify-between gap-3 rounded-lg border p-2.5 text-xs transition-all hover:shadow-xs ${getSeverityColor(
              item.severity
            )}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/70">
                <Icon name={getIcon(item.type)} size={13} />
              </span>
              <div className="min-w-0">
                <p className="font-semibold truncate">{item.title}</p>
                <p className="text-[10px] opacity-80 truncate">{item.subtitle}</p>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
              Buka →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
