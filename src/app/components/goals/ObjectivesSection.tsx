"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/app/components/ui/Icon";
import { useToast } from "@/app/components/ui/Toast";

type ObjectiveItem = {
  id: string;
  title: string;
  description?: string | null;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: string;
  dueDate?: string | Date | null;
};

export function ObjectivesSection({
  goalId,
  initialObjectives,
}: {
  goalId: string;
  initialObjectives: ObjectiveItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("100");
  const [currentValue, setCurrentValue] = useState("0");
  const [unit, setUnit] = useState("%");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId,
          title: title.trim(),
          targetValue: Number(targetValue) || 100,
          currentValue: Number(currentValue) || 0,
          unit: unit.trim() || "%",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal membuat objective");
      toast("Objective berhasil ditambahkan", "success");
      setTitle("");
      setIsAdding(false);
      router.refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal membuat objective", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleIncrement(obj: ObjectiveItem, delta: number) {
    const nextVal = Math.max(0, obj.currentValue + delta);
    try {
      const res = await fetch(`/api/objectives/${obj.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentValue: nextVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal memperbarui nilai");
      router.refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal memperbarui nilai", "error");
    }
  }

  async function handleDelete(obj: ObjectiveItem) {
    if (!confirm(`Hapus objective "${obj.title}"?`)) return;
    try {
      const res = await fetch(`/api/objectives/${obj.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal menghapus objective");
      toast("Objective dihapus", "success");
      router.refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal menghapus objective", "error");
    }
  }

  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-subtle space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-surface-900">Key Results / Objectives</h3>
          <p className="text-xs text-surface-500">Hasil terukur yang membuktikan pencapaian goal ini.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ai-50 px-3 py-1.5 text-xs font-semibold text-ai-700 hover:bg-ai-100 transition-all"
        >
          <Icon name={isAdding ? "x" : "plus"} size={14} />
          {isAdding ? "Batal" : "Tambah Target"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="rounded-xl border border-surface-200 bg-surface-50/60 p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">Hasil Terukur</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Selesaikan 10 bab buku / Capai skor 85"
              required
              className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-xs focus:outline-none focus:border-ai-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Nilai Saat Ini</label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-xs focus:outline-none focus:border-ai-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Target</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-xs focus:outline-none focus:border-ai-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Satuan</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="%, bab, jam"
                className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-xs focus:outline-none focus:border-ai-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg px-3 py-1 text-xs font-semibold text-surface-600 hover:bg-surface-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="rounded-lg bg-ai-600 px-3.5 py-1 text-xs font-semibold text-white hover:bg-ai-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {initialObjectives.map((obj) => {
          const pct = Math.min(100, Math.round((obj.currentValue / (obj.targetValue || 1)) * 100));
          const isDone = obj.status === "COMPLETED" || pct >= 100;
          return (
            <div
              key={obj.id}
              className={`rounded-xl border p-4 shadow-subtle flex flex-col gap-2 ${
                isDone ? "bg-emerald-50/30 border-emerald-200" : "bg-white border-surface-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className={`text-sm font-bold ${isDone ? "text-emerald-900" : "text-surface-900"}`}>
                    {obj.title}
                  </h4>
                  <span className="text-xs text-surface-500">
                    {obj.currentValue} / {obj.targetValue} {obj.unit} ({pct}%)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleIncrement(obj, 1)}
                    className="rounded bg-surface-100 px-2 py-0.5 text-xs font-bold text-surface-700 hover:bg-surface-200"
                    title="+1"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleIncrement(obj, 5)}
                    className="rounded bg-surface-100 px-2 py-0.5 text-xs font-bold text-surface-700 hover:bg-surface-200"
                    title="+5"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => handleDelete(obj)}
                    className="rounded p-1 text-surface-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Hapus"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-100">
                <div
                  className={`h-full transition-all duration-300 ${isDone ? "bg-emerald-500" : "bg-ai-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}

        {initialObjectives.length === 0 && !isAdding && (
          <p className="text-xs text-surface-400 py-2">Belum ada target terukur (Objectives) untuk goal ini.</p>
        )}
      </div>
    </div>
  );
}
