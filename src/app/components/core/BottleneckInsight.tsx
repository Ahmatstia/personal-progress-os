import Link from "next/link";
import { Icon } from "../ui/Icon";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

type Bottleneck = {
  taskId: string;
  taskName: string;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

const severityTone: Record<Bottleneck["severity"], "warning" | "danger" | "neutral"> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

const severityLabel: Record<Bottleneck["severity"], string> = {
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
};

export function BottleneckInsight({
  bottlenecks,
  className = "",
}: {
  bottlenecks: Bottleneck[];
  className?: string;
}) {
  if (!bottlenecks || bottlenecks.length === 0) {
    return (
      <section className={`rounded-2xl border border-success-200 bg-success-50 p-5 ${className}`}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-100 text-success-700">
            <Icon name="gauge" size={18} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-success-800">
              Tidak ada hambatan terdeteksi
            </h3>
            <p className="mt-1 text-sm text-success-700">
              Pekerjaan aktif Anda berjalan normal. Teruskan.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const item = bottlenecks[0];

  return (
    <section className={`rounded-2xl border border-warning-200 bg-warning-50 p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
          <Icon name="alert" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-surface-900">
              Apa yang memperlambat Anda
            </h3>
            <Badge tone={severityTone[item.severity]}>{severityLabel[item.severity]}</Badge>
          </div>
          <p className="mt-1 text-sm font-medium text-surface-800">{item.taskName}</p>
          <p className="mt-0.5 text-sm text-surface-600">{item.reason}</p>
          <div className="mt-3">
            <Link href={`/tasks/${item.taskId}`}>
              <Button size="sm" variant="secondary" iconRight="arrowRight">
                Lihat task
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
