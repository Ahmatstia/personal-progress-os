"use client";

import { useState } from "react";
import { JourneyRoute } from "@/app/components/core/JourneyRoute";
import { GoalTree, type GoalTreeWaypoint } from "@/app/components/core/GoalTree";
import { Button } from "@/app/components/ui/Button";

type GoalJourneyViewProps = {
  waypoints: GoalTreeWaypoint[];
  routeLabel?: string;
  treeLabel?: string;
};

export function GoalJourneyView({
  waypoints,
  routeLabel = "Peta jalan goal",
  treeLabel = "Peta pohon goal",
}: GoalJourneyViewProps) {
  const [mode, setMode] = useState<"jalur" | "pohon">("jalur");
  const isTree = mode === "pohon";

  return (
    <div className="w-full">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={isTree ? "layers" : "tree"}
          onClick={() => setMode(isTree ? "jalur" : "pohon")}
          aria-expanded={isTree}
          aria-label={isTree ? "Tampilkan peta jalur" : "Tampilkan peta pohon"}
        >
          {isTree ? "Peta jalur" : "Lihat peta pohon"}
        </Button>
      </div>

      <div
        className={
          isTree
            ? "mt-4 rounded-2xl border border-surface-150 bg-surface-0/60 p-4 sm:p-6"
            : "mt-8"
        }
      >
        {isTree ? (
          <GoalTree waypoints={waypoints} label={treeLabel} />
        ) : (
          <JourneyRoute waypoints={waypoints} size="md" label={routeLabel} />
        )}
      </div>
    </div>
  );
}