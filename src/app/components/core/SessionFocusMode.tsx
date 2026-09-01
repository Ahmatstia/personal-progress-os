"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function SessionFocusMode({
  taskId,
  taskName,
  goalName,
  stageName,
  activeSession,
  idleCta = "Start session",
  compact = false,
}: {
  taskId: string;
  taskName: string;
  goalName?: string;
  stageName?: string;
  activeSession: { id: string; startedAt: string } | null;
  idleCta?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [session, setSession] = useState(activeSession);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [understanding, setUnderstanding] = useState(3);
  const [activity, setActivity] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [nextAction, setNextAction] = useState("");

  useEffect(() => {
    if (!session) return;
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  async function start() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${taskId}/sessions`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Couldn't start a session.");
      setSession({ id: result.data.id, startedAt: result.data.startedAt });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start a session.");
    } finally {
      setIsLoading(false);
    }
  }

  async function complete() {
    if (!session) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${session.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity, understanding, obstacle, nextAction }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Couldn't finish the session.");
      setSession(null);
      setEnding(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't finish the session.");
    } finally {
      setIsLoading(false);
    }
  }

  // Idle state — a calm prompt to begin
  if (!session) {
    return (
      <div className={`rounded-2xl border border-dashed border-surface-300 bg-surface-0 p-6 ${compact ? "" : ""}`}>
        <div className="flex items-center gap-2 text-surface-400">
          <Icon name="clock" size={16} />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Session</span>
        </div>
        <p className="mt-3 text-lg font-semibold text-surface-800">Ready when you are.</p>
        <p className="mt-1 text-sm text-surface-500">
          Clear your head and focus on one thing: <span className="font-medium text-surface-700">{taskName}</span>.
        </p>
        <div className="mt-4">
          <Button icon="play" onClick={start} loading={isLoading}>
            {idleCta}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }

  // Active — focused workspace
  return (
    <section className="overflow-hidden rounded-2xl border border-ai-200 bg-gradient-to-br from-ai-50 via-surface-0 to-surface-0 p-6 shadow-soft">
      <div className="flex items-center gap-2 text-ai-700">
        <span className="h-2 w-2 animate-pulse rounded-full bg-ai-500" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">Focus mode — in session</span>
      </div>

      <div className="mt-5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">What am I working on?</p>
        <h2 className="mx-auto mt-1.5 max-w-md text-xl font-bold leading-snug text-surface-900">{taskName}</h2>
        {(goalName || stageName) && (
          <p className="mt-1 text-sm text-surface-500">
            {goalName}
            {stageName ? ` · ${stageName}` : ""}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center">
        <p className="font-mono text-6xl font-bold tabular-nums tracking-tight text-ai-700 sm:text-7xl">
          {formatElapsed(elapsed)}
        </p>
        <p className="mt-2 text-xs text-surface-400">elapsed time</p>
      </div>

      <div className="mt-6 flex justify-center">
        {!ending ? (
          <Button variant="ai" icon="stop" size="lg" onClick={() => setEnding(true)}>
            Finish session
          </Button>
        ) : (
          <Button variant="secondary" size="lg" onClick={() => setEnding(false)}>
            Keep going
          </Button>
        )}
      </div>

      {ending && (
        <div className="animate-in-soft mt-6 rounded-2xl border border-surface-200 bg-surface-0 p-5">
          <h3 className="font-semibold text-surface-900">How was this session?</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-surface-600">Activity</span>
              <textarea value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="What did you do?" rows={2}
                className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-ai-400 focus:ring-2 focus:ring-ai-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-surface-600">What was difficult?</span>
              <textarea value={obstacle} onChange={(e) => setObstacle(e.target.value)} placeholder="Any obstacles?" rows={2}
                className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-ai-400 focus:ring-2 focus:ring-ai-100" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-surface-600">Next action</span>
              <textarea value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="What should you do next?" rows={2}
                className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-ai-400 focus:ring-2 focus:ring-ai-100" />
            </label>
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium text-surface-600">Understanding</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUnderstanding(value)}
                  aria-pressed={understanding === value}
                  aria-label={`Understanding ${value} of 5`}
                  className={`h-10 flex-1 rounded-lg border text-sm font-semibold transition ${
                    understanding === value
                      ? "border-ai-500 bg-ai-600 text-white"
                      : "border-surface-200 bg-surface-0 text-surface-500 hover:bg-surface-50"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEnding(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="ai" icon="check" onClick={complete} loading={isLoading}>
              Complete session
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
