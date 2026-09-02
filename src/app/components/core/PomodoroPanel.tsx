"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FocusOrb } from "./FocusOrb";
import { Icon } from "@/app/components/ui/Icon";
import { LearningNotesForm, type LearningNotesData } from "./LearningNotesForm";
import { setFocusMode } from "@/app/components/focus-mode-store";

// ── Preset durations ──────────────────────────────────────
const PRESETS = [
  { label: "25 mnt", minutes: 25, icon: "🍅", tone: "primary" as const },
  { label: "45 mnt", minutes: 45, icon: "🔥", tone: "ai" as const },
  { label: "60 mnt", minutes: 60, icon: "⚡", tone: "warning" as const },
  { label: "Bebas", minutes: 0, icon: "∞", tone: "success" as const },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ── States ────────────────────────────────────────────────
type Phase = "idle" | "setup" | "running" | "paused" | "break" | "notes";

export function PomodoroPanel({
  taskId,
  taskName,
  goalName,
  stageName,
  activeSession,
}: {
  taskId: string;
  taskName: string;
  goalName?: string;
  stageName?: string;
  activeSession: { id: string; startedAt: string } | null;
}) {
  const router = useRouter();

  // Session state
  const [session, setSession] = useState(activeSession);
  const [phase, setPhase] = useState<Phase>(activeSession ? "running" : "idle");

  // Timer state
  const [elapsed, setElapsed] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState(0); // index into PRESETS
  const [customMinutes, setCustomMinutes] = useState("");
  const [targetSeconds, setTargetSeconds] = useState(0); // 0 = free mode
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Counts
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Loading / errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bellRef = useRef<AudioContext | null>(null);

  // Focus mode
  useEffect(() => {
    setFocusMode(phase === "running" || phase === "paused" || phase === "break");
  }, [phase]);
  useEffect(() => () => setFocusMode(false), []);

  // Tick
  useEffect(() => {
    if (phase !== "running" || paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (session) {
      // Sync elapsed from server startedAt
      const update = () => {
        const el = Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000));
        setElapsed(el);
        if (targetSeconds > 0) {
          const rem = Math.max(0, targetSeconds - el);
          setRemaining(rem);
          if (rem === 0 && !completed) {
            setCompleted(true);
            playBell();
            setPomodoroCount((c) => c + 1);
          }
        }
      };
      update();
      timerRef.current = setInterval(update, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, session, targetSeconds]);

  function playBell() {
    try {
      const ctx = new AudioContext();
      bellRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch {
      // Audio not available
    }
  }

  async function startSession() {
    if (!taskId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}/sessions`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Gagal memulai sesi.");
      const preset = PRESETS[selectedPreset];
      const customMin = parseInt(customMinutes, 10);
      const totalSec = preset.minutes > 0
        ? preset.minutes * 60
        : (customMin > 0 ? customMin * 60 : 0);
      setTargetSeconds(totalSec);
      setRemaining(totalSec);
      setCompleted(false);
      setSession({ id: data.data.id, startedAt: data.data.startedAt });
      setPhase("running");
      setElapsed(0);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memulai sesi.");
    } finally {
      setLoading(false);
    }
  }

  async function endSession(notesData: LearningNotesData) {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      // Map LearningNotesData to the existing API shape
      const body = {
        activity: notesData.activity || notesData.keyLearnings,
        understanding: notesData.understanding,
        obstacle: notesData.confusedPoints,
        nextAction: [
          notesData.nextAction,
          notesData.concepts.length > 0 ? `Konsep: ${notesData.concepts.join(", ")}` : "",
          notesData.keyLearnings ? `Pelajaran: ${notesData.keyLearnings}` : "",
        ].filter(Boolean).join("\n\n"),
      };
      const res = await fetch(`/api/sessions/${session.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setSession(null);
      setPhase("idle");
      setElapsed(0);
      setRemaining(0);
      setCompleted(false);
      router.refresh();
    } catch {
      setError("Gagal menyimpan sesi.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelSession() {
    if (!session) return;
    setLoading(true);
    try {
      await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      setSession(null);
      setPhase("idle");
      setElapsed(0);
      setCompleted(false);
      router.refresh();
    } catch {
      setError("Gagal membatalkan sesi.");
    } finally {
      setLoading(false);
    }
  }

  const preset = PRESETS[selectedPreset];
  const isFreeModeCustom = preset.minutes === 0;
  const progressPct = targetSeconds > 0
    ? Math.min(100, (elapsed / targetSeconds) * 100)
    : null;
  const isLow = remaining > 0 && remaining <= 60;
  const customMin = parseInt(customMinutes, 10);
  const canStart = preset.minutes > 0 || (isFreeModeCustom && (customMin > 0 || customMinutes === ""));

  // ── IDLE ─────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="space-y-4">
        {/* Mode header */}
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-ai-500 text-white">
            <Icon name="pomodoro" size={14} />
          </span>
          <div>
            <p className="text-[13px] font-bold text-surface-900">Pilih mode fokus</p>
            <p className="text-[11px] text-surface-500">Tentukan durasi atau biarkan berjalan bebas</p>
          </div>
        </div>

        {/* Preset selector */}
        <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-surface-150 bg-surface-50 p-1.5">
          {PRESETS.map((p, idx) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setSelectedPreset(idx)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-semibold transition-all duration-200 ${
                selectedPreset === idx
                  ? idx === 3
                    ? "bg-white text-success-700 border border-success-200 shadow-soft"
                    : idx === 2
                    ? "bg-white text-warning-700 border border-warning-200 shadow-soft"
                    : idx === 1
                    ? "bg-white text-ai-700 border border-ai-200 shadow-soft"
                    : "bg-white text-primary-700 border border-primary-200 shadow-soft"
                  : "text-surface-500 hover:bg-white/70 hover:text-surface-800"
              }`}
            >
              <span className="text-[18px] leading-none">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom minutes input (Free mode) */}
        {isFreeModeCustom && (
          <div className="animate-in-soft flex items-center gap-2 rounded-xl border border-surface-200 bg-white p-3">
            <Icon name="clock" size={16} className="text-surface-400" />
            <input
              type="number"
              min="1"
              max="300"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="Menit kustom (opsional)"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-surface-900 placeholder:text-surface-400 outline-none"
            />
            {customMinutes && (
              <span className="text-[11px] text-surface-400">menit</span>
            )}
          </div>
        )}

        {/* Task preview */}
        <div className="rounded-xl border border-surface-150 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Task</p>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-surface-800">{taskName}</p>
          {goalName && (
            <p className="truncate text-[11px] text-surface-500">{goalName} · {stageName}</p>
          )}
        </div>

        {error && <p className="text-[12px] text-danger-600">{error}</p>}

        {/* Start button */}
        <button
          type="button"
          onClick={startSession}
          disabled={loading || !canStart}
          className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-ai-600 px-4 py-3.5 text-[14px] font-bold text-white shadow-sm transition-all hover:from-primary-700 hover:to-ai-700 hover:shadow-[var(--shadow-interactive)] disabled:opacity-50 shine-parent active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Memulai...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Icon name="play" size={16} />
              Mulai {preset.minutes > 0 ? `Pomodoro ${preset.label}` : "Sesi Bebas"}
            </span>
          )}
        </button>
      </div>
    );
  }

  // ── NOTES FORM ────────────────────────────────────────────
  if (phase === "notes") {
    return (
      <LearningNotesForm
        taskName={taskName}
        loading={loading}
        onCancel={() => setPhase("running")}
        onSubmit={(data) => endSession(data)}
      />
    );
  }

  // ── RUNNING / PAUSED ──────────────────────────────────────
  const orbTone = completed ? "success" : isLow ? "warning" : "ai";

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              paused ? "bg-warning-400" : "bg-ai-500 animate-pulse"
            }`}
          />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${
            paused ? "text-warning-600" : "text-ai-600"
          }`}>
            {paused ? "Dijeda" : completed ? "Selesai! 🎉" : "Sesi Aktif"}
          </span>
          {pomodoroCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-bold text-warning-700">
              🍅 ×{pomodoroCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={cancelSession}
          disabled={loading}
          className="text-[11px] font-medium text-surface-400 hover:text-danger-600 transition-colors disabled:opacity-50"
        >
          Batalkan sesi
        </button>
      </div>

      {/* Orb + timer display */}
      <div className="flex flex-col items-center py-4">
        <FocusOrb
          value={progressPct ?? undefined}
          size={160}
          stroke={7}
          tone={orbTone}
          sweep={!completed && !paused}
          label="Waktu sesi fokus"
          className={completed ? "celebrate-pop" : ""}
        >
          {completed ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl">🎉</span>
              <span className="text-[11px] font-bold text-success-600">Selesai!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span
                className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${
                  isLow ? "text-warning-600 countdown-pulse" : "text-ai-700"
                }`}
              >
                {targetSeconds > 0 ? formatCountdown(remaining) : formatElapsed(elapsed)}
              </span>
              <span className="text-[10px] text-surface-400">
                {targetSeconds > 0 ? "tersisa" : "berjalan"}
              </span>
              {targetSeconds > 0 && (
                <span className="text-[10px] text-surface-500">
                  {formatElapsed(elapsed)} berlalu
                </span>
              )}
            </div>
          )}
        </FocusOrb>

        {/* Task name */}
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-surface-400">
          Sedang dikerjakan
        </p>
        <p className="mt-1 max-w-[200px] text-center text-[14px] font-semibold leading-snug text-surface-900">
          {taskName}
        </p>
        {preset.minutes > 0 && (
          <p className="mt-0.5 text-[11px] text-surface-500">
            {preset.icon} Pomodoro {preset.label}
          </p>
        )}
      </div>

      {error && <p className="text-center text-[12px] text-danger-600">{error}</p>}

      {/* Controls */}
      <div className="flex gap-2">
        {/* Pause / Resume */}
        {!completed && (
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50 shine-parent overflow-hidden"
          >
            <Icon name={paused ? "play" : "pause"} size={14} />
            {paused ? "Lanjutkan" : "Jeda"}
          </button>
        )}

        {/* Complete session → go to notes */}
        <button
          type="button"
          onClick={() => setPhase("notes")}
          disabled={loading}
          className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-ai-600 to-primary-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:from-ai-700 hover:to-primary-700 hover:shadow-[var(--shadow-interactive)] disabled:opacity-50 shine-parent active:scale-[0.98]"
        >
          <Icon name="bookOpen" size={14} />
          {completed ? "Catat & Selesai" : "Selesaikan sesi"}
        </button>
      </div>

      {/* Break suggestion after Pomodoro */}
      {completed && targetSeconds > 0 && (
        <div className="animate-in-soft break-glow rounded-2xl border border-success-200 bg-gradient-to-br from-success-50 to-success-100/50 p-4 text-center">
          <p className="text-[13px] font-bold text-success-800">
            ☕ Waktunya istirahat!
          </p>
          <p className="mt-0.5 text-[12px] text-success-700">
            Istirahatlah 5–10 menit sebelum sesi berikutnya.
          </p>
        </div>
      )}
    </div>
  );
}
