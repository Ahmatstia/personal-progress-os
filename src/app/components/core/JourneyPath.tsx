"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "../ui/Icon";

type Waypoint = {
  id: string;
  label: string;
  taskLabel: string;
  status: "COMPLETED" | "CURRENT" | "UPCOMING";
};

export function JourneyPath({
  waypoints,
  label = "Peta perjalanan goal",
}: {
  waypoints: Waypoint[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const total = waypoints.length;
  const completedCount = waypoints.filter(
    (w) => w.status === "COMPLETED",
  ).length;
  const currentIndex = waypoints.findIndex((w) => w.status === "CURRENT");
  const current = currentIndex === -1 ? null : waypoints[currentIndex];
  const allDone = currentIndex === -1 && total > 0 && completedCount === total;

  return (
    <>
      <TriggerCard
        waypoints={waypoints}
        current={current}
        currentIndex={currentIndex}
        total={total}
        completedCount={completedCount}
        allDone={allDone}
        onOpen={() => setOpen(true)}
      />
      {open && (
        <JourneyModal
          waypoints={waypoints}
          label={label}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function TriggerCard({
  waypoints,
  current,
  currentIndex,
  total,
  completedCount,
  allDone,
  onOpen,
}: {
  waypoints: Waypoint[];
  current: Waypoint | null;
  currentIndex: number;
  total: number;
  completedCount: number;
  allDone: boolean;
  onOpen: () => void;
}) {
  const preview = waypoints.slice(0, 6);
  const extra = total - preview.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex w-full flex-col gap-5 overflow-hidden rounded-3xl border border-surface-200 bg-gradient-to-br from-surface-0 via-surface-0 to-primary-50/40 p-6 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-raised sm:flex-row sm:items-center sm:justify-between sm:p-7"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-100/50 blur-3xl transition-opacity group-hover:opacity-80"
      />

      <div className="relative flex items-center gap-4">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-raised">
          <span className="halo" aria-hidden="true" />
          <Icon name="compass" size={24} className="relative" />
        </span>
        <div className="min-w-0">
          <p className="eyebrow text-primary-600">Peta jalan</p>
          <p className="mt-1 truncate text-base font-bold text-surface-900 sm:text-lg">
            {allDone
              ? "Perjalanan selesai"
              : current
                ? current.label
                : "Belum dimulai"}
          </p>
          <p className="mt-0.5 text-xs text-surface-500">
            {allDone
              ? `${total} stage tuntas — sampai di tujuan`
              : currentIndex === -1
                ? `${total} stage menanti`
                : `Stage ${currentIndex + 1} dari ${total} · ${completedCount} sudah dilalui`}
          </p>
        </div>
      </div>

      <div className="relative flex items-center gap-4 sm:gap-6">
        <div className="hidden items-center sm:flex">
          {preview.map((wp, i) => (
            <span
              key={wp.id}
              style={{ zIndex: preview.length - i }}
              className={`-ml-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-surface-0 text-[10px] font-bold shadow-sm transition-transform first:ml-0 group-hover:-translate-y-0.5 ${
                wp.status === "COMPLETED"
                  ? "bg-primary-600 text-white"
                  : wp.status === "CURRENT"
                    ? "bg-surface-0 text-primary-600 ring-2 ring-primary-500"
                    : "bg-surface-100 text-surface-400"
              }`}
            >
              {wp.status === "COMPLETED" ? (
                <Icon name="check" size={12} strokeWidth={3} />
              ) : (
                i + 1
              )}
            </span>
          ))}
          {extra > 0 && (
            <span className="-ml-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-surface-0 bg-surface-200 text-[10px] font-bold text-surface-600 shadow-sm">
              +{extra}
            </span>
          )}
        </div>

        <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-primary-700">
          Lihat peta
          <Icon
            name="arrowRight"
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </button>
  );
}

function JourneyModal({
  waypoints,
  label,
  onClose,
}: {
  waypoints: Waypoint[];
  label: string;
  onClose: () => void;
}) {
  const gradId = useId();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const ROW = 168;
  const AMP = 30;
  const points = waypoints.map((wp, i) => ({
    ...wp,
    x: 50 + AMP * Math.sin(i * 1.15),
    y: i * ROW + ROW / 2,
  }));
  const height = Math.max(ROW, points.length * ROW);
  const currentIdx = points.findIndex((p) => p.status === "CURRENT");

  function jumpTo(id: string) {
    onClose();
    setTimeout(() => {
      document
        .getElementById(`stage-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 animate-in-soft bg-surface-900/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative flex h-full w-full flex-col overflow-hidden bg-surface-50 shadow-pop animate-in-soft sm:h-[85vh] sm:max-w-xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-surface-150 bg-surface-0 px-6 py-4">
          <div>
            <p className="eyebrow text-primary-600">Peta jalan</p>
            <p className="mt-0.5 text-sm font-semibold text-surface-900">
              {points.length} stage ·{" "}
              {points.filter((p) => p.status === "COMPLETED").length} dilalui
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-surface-500 transition hover:bg-surface-100 hover:text-surface-900"
            aria-label="Tutup peta perjalanan"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div
          className="relative flex-1 overflow-y-auto px-6 py-10 sm:px-10"
          onClick={() => setPinnedId(null)}
        >
          <div className="relative mx-auto max-w-sm" style={{ height }}>
            <svg
              width="100%"
              height={height}
              viewBox={`0 0 100 ${height}`}
              preserveAspectRatio="none"
              className="absolute left-0 top-0"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={`m-route-${gradId}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="var(--color-primary-400)" />
                  <stop offset="100%" stopColor="var(--color-ai-500)" />
                </linearGradient>
              </defs>
              {points.slice(0, -1).map((p, i) => {
                const next = points[i + 1];
                const my = (p.y + next.y) / 2;
                const d = `M ${p.x} ${p.y} C ${p.x} ${my}, ${next.x} ${my}, ${next.x} ${next.y}`;
                const completed = p.status === "COMPLETED";
                return (
                  <g key={p.id + next.id}>
                    <path
                      d={d}
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                      strokeWidth={completed ? 3 : 2}
                      strokeLinecap="round"
                      stroke={
                        completed
                          ? `url(#m-route-${gradId})`
                          : "var(--color-surface-300)"
                      }
                      strokeDasharray={completed ? undefined : "1 10"}
                    />
                    {i === currentIdx && (
                      <circle r="1.6" fill="var(--color-primary-600)">
                        <animateMotion
                          dur="2.6s"
                          repeatCount="indefinite"
                          path={d}
                          keyPoints="0;1;0"
                          keyTimes="0;0.5;1"
                          calcMode="linear"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {points.map((p, i) => {
              const isDestination = i === points.length - 1;
              const isTooltipVisible =
                pinnedId === p.id || (hoveredId === p.id && pinnedId === null);
              const tooltipSide =
                p.x > 55 ? "right" : p.x < 45 ? "left" : "center";

              return (
                <div
                  key={p.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${p.x}%`, top: p.y }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinnedId((prev) => (prev === p.id ? null : p.id));
                    }}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group relative block outline-none"
                  >
                    <div className="relative flex h-14 w-14 items-center justify-center transition-transform duration-200 group-hover:scale-110">
                      {p.status === "CURRENT" && (
                        <>
                          <span className="halo" aria-hidden="true" />
                          <span
                            className="waypoint-pulse absolute inset-2 rounded-full"
                            aria-hidden="true"
                          />
                        </>
                      )}
                      {p.status === "COMPLETED" ? (
                        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-ai-600 text-white shadow-raised ring-4 ring-primary-100">
                          <Icon
                            name={isDestination ? "flag" : "check"}
                            size={19}
                            strokeWidth={3}
                          />
                        </span>
                      ) : p.status === "CURRENT" ? (
                        <span className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary-600 bg-surface-0 shadow-pop">
                          <span className="h-3.5 w-3.5 rounded-full bg-primary-600" />
                        </span>
                      ) : (
                        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-surface-300 bg-surface-0 transition-colors group-hover:border-surface-400" />
                      )}
                    </div>
                  </button>

                  <p
                    className={`pointer-events-none mt-2 text-center text-[11px] font-semibold ${
                      p.status === "CURRENT"
                        ? "text-primary-700"
                        : p.status === "COMPLETED"
                          ? "text-surface-700"
                          : "text-surface-400"
                    }`}
                  >
                    {p.label}
                  </p>

                  {isTooltipVisible && (
                    <div
                      className={`journey-tooltip absolute top-1/2 z-10 w-44 -translate-y-1/2 rounded-xl border border-surface-200 bg-surface-0 p-3 text-left shadow-pop ${
                        tooltipSide === "right"
                          ? "left-full ml-4"
                          : tooltipSide === "left"
                            ? "right-full mr-4"
                            : "left-1/2 top-full mt-3 -translate-x-1/2 translate-y-0"
                      }`}
                    >
                      <p className="text-xs font-bold text-surface-900">
                        {p.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-surface-500">
                        {p.taskLabel}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          jumpTo(p.id);
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700"
                      >
                        Lompat ke stage <Icon name="chevronRight" size={12} />
                      </button>
                    </div>
                  )}

                  {p.status === "CURRENT" && !isTooltipVisible && (
                    <p className="pointer-events-none mt-0.5 text-center text-[9px] font-semibold uppercase tracking-wider text-primary-500">
                      Anda di sini
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
