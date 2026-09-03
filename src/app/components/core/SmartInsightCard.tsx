import { Icon } from "@/app/components/ui/Icon";
import type { IconName } from "@/app/components/ui/Icon";

export type Insight = {
  id: string;
  type: "warning" | "success" | "info" | "danger";
  icon: IconName | string;
  title: string;
  body: string;
};

const typeStyle: Record<Insight["type"], { card: string; badge: string; dot: string }> = {
  success: {
    card: "border-success-200 bg-gradient-to-br from-success-50/80 to-white",
    badge: "bg-success-100 text-success-700",
    dot: "bg-success-500",
  },
  warning: {
    card: "border-warning-200 bg-gradient-to-br from-warning-50/80 to-white",
    badge: "bg-warning-100 text-warning-700",
    dot: "bg-warning-500",
  },
  danger: {
    card: "border-danger-200 bg-gradient-to-br from-danger-50/80 to-white",
    badge: "bg-danger-100 text-danger-700",
    dot: "bg-danger-500",
  },
  info: {
    card: "border-primary-200 bg-gradient-to-br from-primary-50/80 to-white",
    badge: "bg-primary-100 text-primary-700",
    dot: "bg-primary-500",
  },
};

function isIconName(icon: string): icon is IconName {
  return !icon.match(/\p{Emoji}/u);
}

export function SmartInsightCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-1.5 w-1.5 rounded-full bg-ai-500" aria-hidden />
        <p className="eyebrow text-ai-500">Insight Harian</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {insights.map((insight) => {
          const s = typeStyle[insight.type];
          return (
            <div
              key={insight.id}
              className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-soft ${s.card}`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[14px] ${s.badge}`}
              >
                {isIconName(insight.icon) ? (
                  <Icon name={insight.icon as IconName} size={14} />
                ) : (
                  <span>{insight.icon}</span>
                )}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-surface-900 leading-snug">
                  {insight.title}
                </p>
                <p className="mt-0.5 text-[12px] text-surface-500 leading-relaxed">
                  {insight.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Build insights from analytics + today data */
export function buildInsights({
  currentStreak,
  longestStreak,
  daysSinceLastSession,
  consistency,
  studyMinutesToday,
  focusTasksCount,
  activeTasks,
  bottlenecks,
}: {
  currentStreak: number;
  longestStreak: number;
  daysSinceLastSession: number;
  consistency: number;
  studyMinutesToday: number;
  focusTasksCount: number;
  activeTasks: number;
  bottlenecks: { severity: string; taskName: string }[];
}): Insight[] {
  const insights: Insight[] = [];

  // 1. Streak milestone
  if (currentStreak >= 30) {
    insights.push({
      id: "streak-30",
      type: "success",
      icon: "🏆",
      title: `Streak 30 hari! Luar biasa!`,
      body: `Konsistensi selama sebulan penuh adalah pencapaian luar biasa. Terus!`,
    });
  } else if (currentStreak >= 7) {
    insights.push({
      id: "streak-week",
      type: "success",
      icon: "🔥",
      title: `Streak ${currentStreak} hari berturut-turut!`,
      body: `Sudah seminggu lebih tanpa putus. Jangan biarkan hari ini jadi yang pertama.`,
    });
  } else if (currentStreak >= 3) {
    insights.push({
      id: "streak-3",
      type: "info",
      icon: "⚡",
      title: `Streak ${currentStreak} hari — momentum terbentuk!`,
      body: `3 hari berturut-turut adalah awal kebiasaan. Pertahankan ritme ini.`,
    });
  }

  // 2. Idle / comeback alert
  if (daysSinceLastSession >= 7 && currentStreak === 0) {
    insights.push({
      id: "idle-week",
      type: "danger",
      icon: "clock",
      title: `${daysSinceLastSession} hari tanpa sesi fokus`,
      body: `Selamat kembali! Mulai dengan satu sesi pendek — 25 menit sudah cukup untuk restart momentum.`,
    });
  } else if (daysSinceLastSession >= 3 && currentStreak === 0) {
    insights.push({
      id: "idle-3",
      type: "warning",
      icon: "clock",
      title: `Sudah ${daysSinceLastSession} hari tanpa sesi`,
      body: `Pilih 1 task hari ini dan mulai. Pergerakan kecil lebih baik dari tidak sama sekali.`,
    });
  } else if (daysSinceLastSession >= 1 && currentStreak === 0 && activeTasks > 0) {
    insights.push({
      id: "idle-today",
      type: "info",
      icon: "sun",
      title: "Belum ada sesi hari ini",
      body: `Kamu punya ${activeTasks} task aktif. Pilih satu dan mulai sekarang.`,
    });
  }

  // 3. Near-record streak
  if (currentStreak > 0 && longestStreak > 0 && currentStreak === longestStreak - 1 && longestStreak >= 5) {
    insights.push({
      id: "near-record",
      type: "warning",
      icon: "⭐",
      title: `1 hari lagi buat rekor baru!`,
      body: `Rekor streakmu ${longestStreak} hari. Kamu sekarang di ${currentStreak} hari — besok bisa rekor baru!`,
    });
  }

  // 4. Today focus not set
  if (studyMinutesToday === 0 && focusTasksCount === 0 && activeTasks > 0) {
    insights.push({
      id: "no-focus",
      type: "info",
      icon: "target",
      title: "Fokus hari ini belum diatur",
      body: `Buka halaman Hari Ini dan pilih task yang ingin diselesaikan hari ini.`,
    });
  }

  // 5. Good consistency
  if (consistency >= 80 && currentStreak === 0) {
    insights.push({
      id: "consistency-good",
      type: "success",
      icon: "trendingUp",
      title: `Konsistensi ${consistency}% dalam 30 hari`,
      body: `Data menunjukkan kamu sangat konsisten! Bahkan tanpa streak aktif, ritme kerjamu solid.`,
    });
  }

  // 6. High-severity bottleneck alert
  const highBottleneck = bottlenecks.find((b) => b.severity === "HIGH");
  if (highBottleneck) {
    insights.push({
      id: "bottleneck",
      type: "warning",
      icon: "gauge",
      title: `Task "${highBottleneck.taskName}" perlu perhatian`,
      body: `Waktu yang dihabiskan jauh melebihi estimasi. Pertimbangkan untuk memecah task ini.`,
    });
  }

  // Return max 3 most relevant
  return insights.slice(0, 3);
}
