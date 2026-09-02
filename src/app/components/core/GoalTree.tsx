import type { CSSProperties } from "react";

export type GoalTreeWaypoint = {
  id: string;
  label: string;
  status: "COMPLETED" | "CURRENT" | "UPCOMING";
  taskLabel?: string | null;
};

type GoalTreeProps = {
  waypoints: GoalTreeWaypoint[];
  label?: string;
};

const SLOT = 52;
const TOP = 26;
const TRUNK_X = 320;
const VIEW_W = 640;

export function GoalTree({ waypoints, label }: GoalTreeProps) {
  if (waypoints.length === 0) return null;

  const height = TOP + waypoints.length * SLOT;
  const place = waypoints.map((_, i) => {
    const leftPct = i % 2 === 0 ? 24 : 76;
    const topPx = TOP + i * SLOT;
    return { leftPct, topPx, cx: (leftPct / 100) * VIEW_W };
  });

  const branchPath = (cx: number, cy: number) => {
    const dx = cx - TRUNK_X;
    return `M ${TRUNK_X} ${cy} C ${TRUNK_X + dx * 0.45} ${cy - 6}, ${cx - dx * 0.15} ${cy + 8}, ${cx} ${cy}`;
  };

  const stroke = (status: GoalTreeWaypoint["status"]) =>
    status === "COMPLETED"
      ? "stroke-success-400"
      : status === "CURRENT"
        ? "stroke-primary-500"
        : "stroke-surface-300 route-dash";

  return (
    <div className="relative w-full" role="group" aria-label={label}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full text-surface-300"
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        fill="none"
      >
        <line
          x1={TRUNK_X}
          y1={0}
          x2={TRUNK_X}
          y2={height}
          className="stroke-current"
          strokeWidth={1.5}
          strokeDasharray="2 6"
          strokeLinecap="round"
        />
        <circle cx={TRUNK_X} cy={8} r={3} className="fill-current" />
        {place.map((p, i) => (
          <path
            key={waypoints[i].id}
            d={branchPath(p.cx, p.topPx)}
            strokeWidth={1.5}
            strokeLinecap="round"
            className={stroke(waypoints[i].status)}
          />
        ))}
      </svg>

      <ol className="relative" style={{ height }}>
        {waypoints.map((w, i) => {
          const p = place[i];
          const style: CSSProperties = { left: `${p.leftPct}%`, top: p.topPx };
          return (
            <li
              key={w.id}
              className="absolute w-fit max-w-[40vw] -translate-x-1/2 -translate-y-1/2 sm:max-w-[240px]"
              style={style}
            >
              <div className="flex min-w-0 items-center gap-2">
                <NodeMark status={w.status} index={i + 1} />
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      w.status === "COMPLETED"
                        ? "text-surface-400"
                        : w.status === "CURRENT"
                          ? "text-surface-900"
                          : "text-surface-600"
                    }`}
                  >
                    {w.label}
                  </p>
                  {w.taskLabel ? (
                    <p className="truncate text-[11px] font-medium text-surface-400">{w.taskLabel}</p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function NodeMark({ status, index }: { status: GoalTreeWaypoint["status"]; index: number }) {
  if (status === "COMPLETED") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
    );
  }
  if (status === "CURRENT") {
    return (
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white waypoint-pulse">
        <span aria-hidden="true" className="halo" />
        {index}
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-surface-300 bg-surface-0 text-[11px] font-semibold text-surface-400">
      {index}
    </span>
  );
}