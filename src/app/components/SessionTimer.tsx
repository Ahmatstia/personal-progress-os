"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SessionTimerProps = {
  taskId: string;
  taskName: string;
  activeSession: { id: string; startedAt: string } | null;
};

function formatElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export default function SessionTimer({ taskId, taskName, activeSession }: SessionTimerProps) {
  const router = useRouter();
  const [session, setSession] = useState(activeSession);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [understanding, setUnderstanding] = useState(3);
  const [activity, setActivity] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [error, setError] = useState("");

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
      if (!response.ok) throw new Error(result.error?.message ?? "Session gagal dimulai.");
      setSession({ id: result.data.id, startedAt: result.data.startedAt });
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Session gagal dimulai.");
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
      if (!response.ok) throw new Error(result.error?.message ?? "Session gagal diselesaikan.");
      setSession(null);
      setEnding(false);
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Session gagal diselesaikan.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Current session</p>
        <button onClick={start} disabled={isLoading} className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200">
          {isLoading ? "Starting..." : "Start Session"}
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">Current session</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{taskName}</h2>
          <p className="mt-2 font-mono text-4xl tracking-tight text-emerald-200">{formatElapsed(elapsed)}</p>
        </div>
        <button onClick={() => setEnding(true)} disabled={isLoading} className="rounded-xl bg-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-white">
          End Session
        </button>
      </div>
      {ending && (
        <div className="mt-6 border-t border-emerald-500/20 pt-5">
          <h3 className="font-semibold text-white">How was this session?</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <textarea value={activity} onChange={(event) => setActivity(event.target.value)} placeholder="Activity" rows={3} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600" />
            <textarea value={obstacle} onChange={(event) => setObstacle(event.target.value)} placeholder="What was difficult?" rows={3} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600" />
            <textarea value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Next action" rows={3} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600" />
            <div>
              <p className="mb-2 text-sm text-slate-300">Understanding</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setUnderstanding(value)} className={`h-10 w-10 rounded-lg border text-sm ${understanding === value ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-slate-700 text-slate-400"}`}>{value}</button>)}
              </div>
              <p className="mt-4 text-xs text-slate-500">Duration: {formatElapsed(elapsed)}</p>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setEnding(false)} disabled={isLoading} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button>
            <button onClick={complete} disabled={isLoading} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">{isLoading ? "Completing..." : "Complete Session"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
