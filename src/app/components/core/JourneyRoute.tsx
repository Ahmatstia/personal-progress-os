// Journey Route — signature component.
// Stage = waypoint pada perjalanan: sudah dilalui (padat), sedang (bercahaya),
// belum (outline). Digunakan saat user perlu tahu "di mana posisi saya".
// Informasi tetap literal: setiap waypoint membawa label yang bisa dibaca.

type Waypoint = {
  id: string;
  label?: string;
  status: "COMPLETED" | "CURRENT" | "UPCOMING";
};

const nodeSize = { sm: "h-2.5 w-2.5", md: "h-3.5 w-3.5" } as const;
const labelSize = { sm: "text-[10px]", md: "text-xs" } as const;

function nodeClass(status: Waypoint["status"], size: "sm" | "md") {
  const base = `shrink-0 rounded-full border-2 transition-colors ${nodeSize[size]}`;
  if (status === "COMPLETED") return `${base} border-primary-600 bg-primary-600`;
  if (status === "CURRENT") return `${base} relative border-primary-600 bg-surface-0`;
  return `${base} border-surface-300 bg-surface-0`;
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
      className={`flex w-full items-center ${className}`}
      role="img"
      aria-label={label}
    >
      {waypoints.map((waypoint, index) => {
        const isLast = index === waypoints.length - 1;
        return (
          <div
            key={waypoint.id}
            className={`flex items-center ${isLast ? "" : "min-w-0 flex-1"}`}
          >
            <div className="flex shrink-0 flex-col items-center">
              <span
                className={nodeClass(waypoint.status, size)}
                aria-hidden="true"
              >
                {waypoint.status === "CURRENT" && (
                  <span className="halo" />
                )}
              </span>
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
                className={`mx-1.5 min-w-4 flex-1 ${
                  waypoint.status === "COMPLETED"
                    ? "h-0.5 rounded-full bg-primary-300"
                    : "border-t-2 border-dashed border-surface-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Tag "SEKARANG" opsional — ditempel untuk world saat ini.
export function CurrentWaypointTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden="true" />
      Sekarang
    </span>
  );
}