import { Icon } from "../ui/Icon";

// Journey Route — signature component.
// Stage = waypoint pada perjalanan: sudah dilalui (padat + tanda centang),
// sedang (bercahaya/halo), belum (outline putus-putus). Waypoint terakhir
// yang sudah dilalui ditandai bendera — representasi "tujuan".

type Waypoint = {
  id: string;
  label?: string;
  status: "COMPLETED" | "CURRENT" | "UPCOMING";
};

const nodeBox = { sm: "h-3.5 w-3.5", md: "h-5 w-5" } as const;
const dotBox = { sm: "h-1 w-1", md: "h-1.5 w-1.5" } as const;
const lineHeight = { sm: "h-[2px]", md: "h-[3px]" } as const;
const labelSize = { sm: "text-[10px]", md: "text-xs" } as const;
const iconPx = { sm: 8, md: 10 } as const;

function Node({
  status,
  size,
  isDestination,
}: {
  status: Waypoint["status"];
  size: "sm" | "md";
  isDestination: boolean;
}) {
  if (status === "COMPLETED") {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-primary-600 text-white ring-4 ring-primary-100 ${nodeBox[size]}`}
      >
        <Icon
          name={isDestination ? "flag" : "check"}
          size={iconPx[size] + (isDestination ? 1 : 0)}
          strokeWidth={3}
        />
      </span>
    );
  }
  if (status === "CURRENT") {
    return (
      <span
        className={`relative flex shrink-0 items-center justify-center rounded-full border-2 border-primary-600 bg-surface-0 shadow-pop ${nodeBox[size]}`}
      >
        <span className="halo" aria-hidden="true" />
        <span
          className={`relative rounded-full bg-primary-600 ${dotBox[size]}`}
        />
      </span>
    );
  }
  return (
    <span
      className={`shrink-0 rounded-full border-2 border-dashed border-surface-300 bg-surface-0 ${nodeBox[size]}`}
    />
  );
}

export function JourneyRoute({
  waypoints,
  size = "md",
  label = "Peta perjalanan goal",
  className = "",
}: {
  waypoints: Waypoint[];
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full items-start ${className}`}
      role="img"
      aria-label={label}
    >
      {waypoints.map((waypoint, index) => {
        const isLast = index === waypoints.length - 1;
        return (
          <div
            key={waypoint.id}
            className={`flex items-start ${isLast ? "" : "min-w-0 flex-1"}`}
          >
            <div className="flex shrink-0 flex-col items-center pt-0.5">
              <Node
                status={waypoint.status}
                size={size}
                isDestination={isLast}
              />
              {waypoint.label && (
                <span
                  className={`mt-1.5 max-w-20 truncate text-center font-medium ${labelSize[size]} ${
                    waypoint.status === "CURRENT"
                      ? "text-primary-700"
                      : waypoint.status === "COMPLETED"
                        ? "text-surface-600"
                        : "text-surface-400"
                  }`}
                >
                  {waypoint.label}
                </span>
              )}
            </div>
            {!isLast && (
              <span
                aria-hidden="true"
                className={`mx-1.5 mt-7px min-w-4 flex-1 rounded-full ${lineHeight[size]} ${
                  waypoint.status === "COMPLETED"
                    ? "bg-linear-to-r from-primary-400 to-primary-600"
                    : "border-t-2 border-dashed border-surface-300 bg-transparent"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Tag "SEKARANG" — dipakai di halaman detail goal. TIDAK diubah, agar tetap kompatibel.
export function CurrentWaypointTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white ${className}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-white/90"
        aria-hidden="true"
      />
      Sekarang
    </span>
  );
}
