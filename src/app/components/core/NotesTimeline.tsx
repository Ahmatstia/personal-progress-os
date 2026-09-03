"use client";

import { useState } from "react";
import { Icon } from "@/app/components/ui/Icon";
import { HistoryDeleteButton } from "@/app/components/ui/HistoryDeleteButton";

export type TimelineEntry = {
  id: string;
  kind: "capture" | "session" | "review";
  title: string;
  subtitle?: string;
  content: string;
  timestamp: string;
  tag?: string;
  entityId: string;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function NotesTimeline({ entries }: { entries: TimelineEntry[] }) {
  const [filter, setFilter] = useState<"all" | "capture" | "session" | "review">("all");

  const filtered = entries.filter((e) => {
    if (filter === "all") return true;
    return e.kind === filter;
  });

  const countByKind = {
    all: entries.length,
    capture: entries.filter((e) => e.kind === "capture").length,
    session: entries.filter((e) => e.kind === "session").length,
    review: entries.filter((e) => e.kind === "review").length,
  };

  const kindStyle: Record<TimelineEntry["kind"], { bg: string; text: string; icon: "inbox" | "clock" | "sparkles"; label: string }> = {
    capture: {
      bg: "bg-primary-50 border-primary-200",
      text: "text-primary-600",
      icon: "inbox",
      label: "Catatan Cepat",
    },
    session: {
      bg: "bg-warning-50 border-warning-200",
      text: "text-warning-600",
      icon: "clock",
      label: "Sesi & Hambatan",
    },
    review: {
      bg: "bg-ai-50 border-ai-200",
      text: "text-ai-600",
      icon: "sparkles",
      label: "Refleksi Mingguan",
    },
  };

  return (
    <section className="space-y-4">
      {/* Header & filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-surface-400">Arsip Pemikiran</p>
          <h2 className="mt-0.5 text-xl font-bold text-surface-900">Timeline Catatan & Refleksi</h2>
          <p className="mt-0.5 text-[12.5px] text-surface-500">
            Jejak pemikiran, hambatan yang dihadapi, dan pembelajaran sepanjang perjalanan.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex rounded-xl border border-surface-200 bg-surface-50 p-1 text-[12px]">
          {[
            { key: "all", label: "Semua", count: countByKind.all },
            { key: "capture", label: "Catatan", count: countByKind.capture },
            { key: "session", label: "Sesi", count: countByKind.session },
            { key: "review", label: "Review", count: countByKind.review },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                filter === tab.key
                  ? "bg-white text-surface-900 shadow-sm"
                  : "text-surface-500 hover:text-surface-800"
              }`}
            >
              {tab.label} <span className="text-[10px] text-surface-400">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-200 p-8 text-center">
          <p className="text-[13px] text-surface-400">Belum ada catatan dalam kategori ini.</p>
        </div>
      ) : (
        <div className="relative pl-6 before:absolute before:bottom-0 before:left-2.5 before:top-2 before:w-0.5 before:bg-surface-200">
          <div className="space-y-4">
            {filtered.map((item) => {
              const cfg = kindStyle[item.kind];
              return (
                <div key={item.id} className="relative group">
                  {/* Timeline dot */}
                  <span
                    className={`absolute -left-6 top-3 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border bg-white shadow-xs ${cfg.text}`}
                  >
                    <Icon name={cfg.icon} size={11} />
                  </span>

                  {/* Card */}
                  <div className="rounded-xl border border-surface-150 bg-white p-4 shadow-soft transition-all hover:border-surface-250 hover:shadow-[var(--shadow-card-hover)]">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        {item.tag && (
                          <span className="text-[11px] font-medium text-surface-400">
                            · {item.tag}
                          </span>
                        )}
                        <h3 className="text-[13.5px] font-semibold text-surface-900">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-surface-400">{formatDate(item.timestamp)}</span>
                        {item.kind === "capture" && (
                          <HistoryDeleteButton
                            path={`/api/captures/${item.entityId}`}
                            message="Hapus catatan ini?"
                            toastMessage="Catatan dihapus."
                            aria-label="Hapus catatan"
                          />
                        )}
                      </div>
                    </div>

                    {item.subtitle && (
                      <p className="text-[12px] font-medium text-surface-600 mb-1.5">{item.subtitle}</p>
                    )}

                    <p className="text-[13px] leading-relaxed text-surface-700 whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
