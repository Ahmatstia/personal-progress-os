"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Textarea } from "../ui/Textarea";
import { useConfirm } from "../ui/Confirm";
import { FocusOrb } from "./FocusOrb";
import { setFocusMode } from "../focus-mode-store";

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
  idleCta = "Mulai sesi",
}: {
  taskId: string;
  taskName: string;
  goalName?: string;
  stageName?: string;
  activeSession: { id: string; startedAt: string } | null;
  idleCta?: string;
}) {
  const router = useRouter();
  const { askConfirm, confirmDialog } = useConfirm();
  const [session, setSession] = useState(activeSession);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [understanding, setUnderstanding] = useState(3);
  const [activity, setActivity] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [nextAction, setNextAction] = useState("");

  // Saat sesi berjalan, shell meredup — permukaan kerja yang bercahaya.
  useEffect(() => {
    setFocusMode(session !== null);
  }, [session]);
  useEffect(() => () => setFocusMode(false), []);

  useEffect(() => {
    if (!session) return;
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  async function start() {
    if (!taskId) return;
    const confirmed = await askConfirm({
      title: "Mulai sesi fokus",
      description: `Mulai sesi untuk "${taskName}"?`,
      confirmLabel: "Mulai sesi",
    });
    if (!confirmed) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${taskId}/sessions`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Gagal memulai sesi.");
      setSession({ id: result.data.id, startedAt: result.data.startedAt });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memulai sesi.");
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
      if (!response.ok) throw new Error(result.error?.message ?? "Gagal menyelesaikan sesi.");
      setSession(null);
      setEnding(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyelesaikan sesi.");
    } finally {
      setIsLoading(false);
    }
  }

  async function cancel() {
    if (!session) return;
    const confirmed = await askConfirm({
      title: "Batalkan sesi",
      description: `Batalkan sesi untuk "${taskName}"? Sesi ini akan dihapus dari riwayat dan tidak menambah waktu belajar.`,
      confirmLabel: "Batalkan sesi",
      danger: true,
    });
    if (!confirmed) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Gagal membatalkan sesi.");
      setSession(null);
      setEnding(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membatalkan sesi.");
    } finally {
      setIsLoading(false);
    }
  }

  // Idle state — a calm prompt to begin
  if (!session) {
    return (
      <>
        <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-0 p-6">
          <div className="flex items-center gap-2 text-surface-400">
            <Icon name="clock" size={16} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Sesi</span>
          </div>
          {taskId ? (
            <>
              <p className="mt-3 text-lg font-semibold text-surface-800">Siap saat Anda siap.</p>
              <p className="mt-1 text-sm text-surface-500">
                Kosongkan pikiran dan fokus pada satu hal: <span className="font-medium text-surface-700">{taskName}</span>.
              </p>
              <div className="mt-4">
                <Button icon="play" onClick={start} loading={isLoading}>
                  {idleCta}
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-surface-500">
              Belum ada task untuk sesi fokus.{" "}
              <Link href="/goals" className="font-semibold text-primary-600 hover:text-primary-700">
                Buat task lewat Goals
              </Link>
              .
            </p>
          )}
          {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}
        </div>
        {confirmDialog}
      </>
    );
  }

  // Active — focused workspace
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-ai-200 bg-surface-0 p-6 shadow-raised sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-ai-100/50 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-ai-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-ai-500" aria-hidden="true" />
              <span className="eyebrow">Mode fokus — sedang sesi</span>
            </div>
            <button
              type="button"
              onClick={cancel}
              disabled={isLoading || ending}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-400 transition hover:text-danger-600 disabled:opacity-50"
            >
              <Icon name="trash" size={14} /> Batalkan
            </button>
          </div>

          <div className="mt-8 flex flex-col items-center text-center">
            <FocusOrb size={184} stroke={8} tone="ai" sweep label="Waktu sesi fokus berjalan">
              <span className="font-mono text-3xl font-bold tabular-nums tracking-tight text-ai-700 sm:text-4xl">
                {formatElapsed(elapsed)}
              </span>
              <span className="mt-2 text-xs text-surface-400">waktu berjalan</span>
            </FocusOrb>

            <p className="eyebrow mt-8 text-surface-400">Yang sedang saya kerjakan</p>
            <h2 className="mt-1.5 max-w-md text-xl font-bold leading-snug text-surface-900 sm:text-2xl">
              {taskName}
            </h2>
            {(goalName || stageName) && (
              <p className="mt-1 text-sm text-surface-500">
                {goalName}
                {stageName ? ` · ${stageName}` : ""}
              </p>
            )}
          </div>

          {!ending ? (
            <div className="mt-8 flex flex-col items-center">
              <Button variant="ai" icon="stop" size="lg" onClick={() => setEnding(true)}>
                Selesaikan sesi
              </Button>
              {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}
            </div>
          ) : (
            <div className="animate-in-soft mt-8 rounded-2xl border border-surface-200 bg-surface-50 p-5">
              <h3 className="font-semibold text-surface-900">Bagaimana sesi ini?</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Textarea
                  label="Aktivitas"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="Apa yang Anda lakukan?"
                  rows={2}
                />
                <Textarea
                  label="Apa yang sulit?"
                  value={obstacle}
                  onChange={(e) => setObstacle(e.target.value)}
                  placeholder="Ada kendala?"
                  rows={2}
                />
                <div className="sm:col-span-2">
                  <Textarea
                    label="Aksi berikutnya"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="Apa yang harus Anda lakukan berikutnya?"
                    rows={2}
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-xs font-medium text-surface-600">Pemahaman</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUnderstanding(value)}
                      aria-pressed={understanding === value}
                      aria-label={`Pemahaman ${value} dari 5`}
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
                  Batal
                </Button>
                <Button variant="ai" icon="check" onClick={complete} loading={isLoading}>
                  Selesaikan sesi
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
      {confirmDialog}
    </>
  );
}