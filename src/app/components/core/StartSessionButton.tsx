"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export function StartSessionButton({
  taskId,
  taskName,
  size = "md",
  variant = "primary",
  icon = "play",
  children,
}: {
  taskId: string;
  taskName?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "ai";
  icon?: "play" | "bolt";
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function start() {
    if (loading) return;
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/tasks/${taskId}/sessions`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <Button
        variant={variant}
        size={size}
        icon={icon}
        onClick={start}
        loading={loading}
        aria-label={taskName ? `Start a focus session for ${taskName}` : undefined}
      >
        {children ?? "Start session"}
      </Button>
      {error && (
        <span className="text-xs text-danger-600">Couldn’t start a session. Try again.</span>
      )}
    </div>
  );
}
