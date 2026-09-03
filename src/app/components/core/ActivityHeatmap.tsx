"use client";

import { useMemo } from "react";
import type { AnalyticsTrend } from "@/services/analytics.service";

type Props = {
  trends: AnalyticsTrend[];
  /** Total days shown (default 90) */
  days?: number;
};

function getIntensity(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

const intensityClass: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-surface-100 hover:bg-surface-200",
  1: "bg-primary-200 hover:bg-primary-300",
  2: "bg-primary-400 hover:bg-primary-500",
  3: "bg-primary-600 hover:bg-primary-700",
  4: "bg-ai-600 hover:bg-ai-700",
};

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function ActivityHeatmap({ trends, days = 90 }: Props) {
  // Build a date → data map
  const dataMap = useMemo(() => {
    const m = new Map<string, { minutes: number; tasks: number }>();
    for (const t of trends) {
      m.set(t.date, { minutes: t.learningMinutes, tasks: t.completedTasks });
    }
    return m;
  }, [trends]);

  // Generate cells: start from `days` ago aligned to Sunday
  const cells = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    // Pad to previous Sunday
    const padStart = new Date(start);
    padStart.setDate(padStart.getDate() - padStart.getDay());

    const result: { date: string; displayDate: Date; minutes: number; tasks: number; inRange: boolean }[] = [];
    const cursor = new Date(padStart);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      const data = dataMap.get(key) ?? { minutes: 0, tasks: 0 };
      result.push({
        date: key,
        displayDate: new Date(cursor),
        minutes: data.minutes,
        tasks: data.tasks,
        inRange: cursor >= start && cursor <= end,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [dataMap, days]);

  // Group into weeks (columns)
  const weeks = useMemo(() => {
    const w: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      w.push(cells.slice(i, i + 7));
    }
    return w;
  }, [cells]);

  // Month labels — show month name when week starts a new month
  const monthLabels = useMemo(() => {
    return weeks.map((week) => {
      const first = week.find((c) => c.inRange);
      if (!first) return null;
      const d = first.displayDate;
      // Show month only if first day of week is 1-7
      if (d.getDate() <= 7) return MONTHS_ID[d.getMonth()];
      return null;
    });
  }, [weeks]);

  const activeDays = cells.filter((c) => c.inRange && c.minutes > 0).length;

  return (
    <div>
      <div className="flex items-end gap-2 mb-3">
        <div className="flex-1 overflow-x-auto">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 pl-8">
            {weeks.map((_, wi) => (
              <div key={wi} className="w-[11px] shrink-0 text-[9px] text-surface-400 font-medium truncate">
                {monthLabels[wi] ?? ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {DAYS_ID.map((d, i) => (
                <div key={d} className={`h-[11px] text-[9px] text-surface-400 font-medium leading-[11px] ${i % 2 === 0 ? "invisible" : ""}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, ci) => {
                  const intensity = cell.inRange ? getIntensity(cell.minutes) : 0;
                  const label = cell.inRange
                    ? cell.minutes > 0
                      ? `${cell.date}: ${cell.minutes} mnt, ${cell.tasks} task`
                      : `${cell.date}: tidak ada aktivitas`
                    : "";
                  return (
                    <div
                      key={ci}
                      title={label}
                      className={`h-[11px] w-[11px] rounded-sm transition-colors ${
                        cell.inRange ? intensityClass[intensity] : "bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend + summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-surface-400">
          <span className="font-semibold text-surface-700">{activeDays}</span> hari aktif dalam {days} hari terakhir
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-surface-400">Kurang</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              className={`h-[10px] w-[10px] rounded-sm ${intensityClass[level].split(" ")[0]}`}
            />
          ))}
          <span className="text-[10px] text-surface-400">Lebih</span>
        </div>
      </div>
    </div>
  );
}
