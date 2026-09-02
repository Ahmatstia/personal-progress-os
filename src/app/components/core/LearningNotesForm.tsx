"use client";

import { useState, KeyboardEvent } from "react";
import { Icon } from "@/app/components/ui/Icon";

export type LearningNotesData = {
  activity: string;
  keyLearnings: string;
  confusedPoints: string;
  nextAction: string;
  concepts: string[];
  understanding: number;
};

const UNDERSTANDING_LABELS = ["😕 Bingung", "🤔 Sedikit paham", "😐 Cukup", "😊 Paham", "🤩 Sangat paham!"];
const UNDERSTANDING_COLORS = [
  "border-danger-300 bg-danger-50 text-danger-700",
  "border-warning-300 bg-warning-50 text-warning-700",
  "border-surface-300 bg-surface-50 text-surface-700",
  "border-primary-300 bg-primary-50 text-primary-700",
  "border-success-300 bg-success-50 text-success-700",
];

export function LearningNotesForm({
  taskName,
  onSubmit,
  onCancel,
  loading,
}: {
  taskName: string;
  onSubmit: (data: LearningNotesData) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [activity, setActivity] = useState("");
  const [keyLearnings, setKeyLearnings] = useState("");
  const [confusedPoints, setConfusedPoints] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [concepts, setConcepts] = useState<string[]>([]);
  const [conceptInput, setConceptInput] = useState("");
  const [understanding, setUnderstanding] = useState(3);

  function addConcept() {
    const trimmed = conceptInput.trim();
    if (!trimmed || concepts.length >= 6 || concepts.includes(trimmed)) return;
    setConcepts([...concepts, trimmed]);
    setConceptInput("");
  }

  function removeConcept(concept: string) {
    setConcepts(concepts.filter((c) => c !== concept));
  }

  function onConceptKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addConcept();
    }
    if (e.key === "Backspace" && !conceptInput && concepts.length > 0) {
      setConcepts(concepts.slice(0, -1));
    }
  }

  function handleSubmit() {
    onSubmit({ activity, keyLearnings, confusedPoints, nextAction, concepts, understanding });
  }

  const inputBase =
    "w-full resize-none rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-[13px] text-surface-900 placeholder:text-surface-400 outline-none transition-all focus:border-primary-300 focus:ring-2 focus:ring-primary-100";

  return (
    <div className="note-card-in space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-ai-500 text-white">
          <Icon name="brain" size={18} />
        </span>
        <div>
          <h3 className="text-[15px] font-bold text-surface-900">
            Apa yang Anda pelajari?
          </h3>
          <p className="mt-0.5 text-[12px] text-surface-500">
            Dari sesi: <span className="font-medium text-surface-700">{taskName}</span>
          </p>
        </div>
      </div>

      {/* ── Section 1: Aktivitas ─────────────────────── */}
      <div className="rounded-2xl border border-surface-150 bg-white p-4">
        <label className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Icon name="pen" size={12} />
          </span>
          <span className="text-[12px] font-bold uppercase tracking-wider text-surface-500">
            Aktivitas sesi
          </span>
        </label>
        <textarea
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="Apa yang Anda kerjakan dalam sesi ini?"
          rows={2}
          className={inputBase}
        />
      </div>

      {/* ── Section 2: Key Learnings ─────────────────── */}
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/50 to-ai-50/30 p-4">
        <label className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <Icon name="lightbulb" size={12} />
          </span>
          <span className="text-[12px] font-bold uppercase tracking-wider text-primary-600">
            Pelajaran utama ✨
          </span>
        </label>
        <textarea
          value={keyLearnings}
          onChange={(e) => setKeyLearnings(e.target.value)}
          placeholder="Insight atau konsep terpenting yang Anda dapatkan hari ini..."
          rows={3}
          className={inputBase}
        />

        {/* Concept chips / keyword tags */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold text-surface-500">
            Kata kunci / konsep penting <span className="text-surface-400">(maks 6)</span>
          </p>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2.5 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all min-h-[42px]">
            {concepts.map((concept) => (
              <span
                key={concept}
                className="tag-pop inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700"
              >
                {concept}
                <button
                  type="button"
                  onClick={() => removeConcept(concept)}
                  aria-label={`Hapus ${concept}`}
                  className="ml-0.5 text-primary-500 hover:text-primary-800 transition-colors"
                >
                  <Icon name="x" size={10} />
                </button>
              </span>
            ))}
            {concepts.length < 6 && (
              <input
                type="text"
                value={conceptInput}
                onChange={(e) => setConceptInput(e.target.value)}
                onKeyDown={onConceptKeyDown}
                onBlur={addConcept}
                placeholder={concepts.length === 0 ? "Ketik konsep, tekan Enter…" : "+ Tambah"}
                className="min-w-0 flex-1 bg-transparent text-[12px] text-surface-800 placeholder:text-surface-400 outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Masih bingung? ─────────────────── */}
      <div className="rounded-2xl border border-warning-100 bg-gradient-to-br from-warning-50/40 to-surface-50 p-4">
        <label className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
            <Icon name="alert" size={12} />
          </span>
          <span className="text-[12px] font-bold uppercase tracking-wider text-warning-600">
            Masih bingung?
          </span>
        </label>
        <textarea
          value={confusedPoints}
          onChange={(e) => setConfusedPoints(e.target.value)}
          placeholder="Apa yang belum dipahami? Pertanyaan yang perlu dijawab berikutnya..."
          rows={2}
          className={inputBase}
        />
      </div>

      {/* ── Section 4: Next Action ───────────────────── */}
      <div className="rounded-2xl border border-success-100 bg-gradient-to-br from-success-50/40 to-surface-50 p-4">
        <label className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-success-100 text-success-600">
            <Icon name="arrowRight" size={12} />
          </span>
          <span className="text-[12px] font-bold uppercase tracking-wider text-success-600">
            Langkah berikutnya
          </span>
        </label>
        <textarea
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="Apa yang akan Anda lakukan pertama kali di sesi berikutnya?"
          rows={2}
          className={inputBase}
        />
      </div>

      {/* ── Section 5: Understanding meter ──────────── */}
      <div className="rounded-2xl border border-surface-150 bg-white p-4">
        <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-surface-500">
          Seberapa paham Anda setelah sesi ini?
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {UNDERSTANDING_LABELS.map((label, idx) => {
            const val = idx + 1;
            const isSelected = understanding === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setUnderstanding(val)}
                aria-pressed={isSelected}
                aria-label={label}
                className={`group flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[10px] font-semibold transition-all duration-200 ${
                  isSelected
                    ? `${UNDERSTANDING_COLORS[idx]} scale-105 shadow-soft`
                    : "border-surface-150 text-surface-400 hover:border-surface-300 hover:bg-surface-50 hover:text-surface-700"
                }`}
              >
                <span className="text-lg leading-none">
                  {label.split(" ")[0]}
                </span>
                <span className="hidden text-center leading-tight sm:block">
                  {label.split(" ").slice(1).join(" ")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 text-[13px] font-semibold text-surface-700 transition-all hover:border-surface-300 hover:bg-surface-50 disabled:opacity-50"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-ai-600 to-primary-600 px-5 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-ai-700 hover:to-primary-700 hover:shadow-[var(--shadow-interactive)] disabled:opacity-50 shine-parent active:scale-[0.97]"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Icon name="check" size={15} strokeWidth={2.5} />
          )}
          Selesaikan & Simpan
        </button>
      </div>
    </div>
  );
}

/* ─── Display Card: shows saved learning notes in session history ─── */
export function LearningNoteCard({
  activity,
  keyLearnings,
  confusedPoints,
  nextAction,
  understanding,
  durationMinutes,
  startedAt,
}: {
  activity?: string | null;
  keyLearnings?: string | null;
  confusedPoints?: string | null;
  nextAction?: string | null;
  understanding?: number | null;
  durationMinutes?: number | null;
  startedAt: Date;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasNotes = !!(keyLearnings || confusedPoints || nextAction);
  const label = understanding ? UNDERSTANDING_LABELS[understanding - 1] : null;

  function formatDuration(min: number | null | undefined) {
    if (!min) return "—";
    if (min < 60) return `${min} mnt`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h} jam` : `${h}j ${m}m`;
  }

  function formatTime(d: Date) {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        hasNotes
          ? "border-primary-100 bg-gradient-to-br from-white to-primary-50/20"
          : "border-surface-150 bg-white"
      }`}
    >
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            durationMinutes
              ? "bg-ai-50 text-ai-600"
              : "bg-surface-100 text-surface-500"
          }`}
        >
          <Icon name="clock" size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-surface-800">
            {activity || "Sesi fokus"}
          </p>
          <p className="text-[11px] text-surface-400">
            {formatTime(startedAt)} · {formatDuration(durationMinutes)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {label && (
            <span className={`chip ${UNDERSTANDING_COLORS[(understanding ?? 3) - 1]} border`}>
              {label.split(" ")[0]}
            </span>
          )}
          {hasNotes && (
            <span className="chip bg-primary-50 text-primary-600 border border-primary-100">
              <Icon name="bookOpen" size={10} />
              Catatan
            </span>
          )}
          <Icon
            name={expanded ? "chevronUp" : "chevronDown"}
            size={14}
            className="text-surface-400"
          />
        </div>
      </button>

      {/* Expanded notes */}
      {expanded && hasNotes && (
        <div className="animate-in-soft border-t border-surface-100 px-4 pb-4 pt-3 space-y-3">
          {keyLearnings && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-600">
                <Icon name="lightbulb" size={11} /> Pelajaran utama
              </p>
              <p className="text-[13px] leading-relaxed text-surface-700">{keyLearnings}</p>
            </div>
          )}
          {confusedPoints && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-warning-600">
                <Icon name="alert" size={11} /> Masih bingung
              </p>
              <p className="text-[13px] leading-relaxed text-surface-700">{confusedPoints}</p>
            </div>
          )}
          {nextAction && (
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-success-600">
                <Icon name="arrowRight" size={11} /> Langkah berikutnya
              </p>
              <p className="text-[13px] leading-relaxed text-surface-700">{nextAction}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
