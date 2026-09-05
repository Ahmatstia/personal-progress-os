"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/app/components/ui/Icon";
import { useToast } from "@/app/components/ui/Toast";

type ActivityItem = {
  id: string;
  title: string;
  category: string;
  startTime: string | Date;
  endTime: string | Date;
  durationMinutes: number;
  productivityRating?: number | null;
  energyLevel?: number | null;
  notes?: string | null;
  task?: { id: string; title: string } | null;
  project?: { id: string; title: string } | null;
  area?: { id: string; name: string; color: string } | null;
};

export function ActivityManager({ initialActivities }: { initialActivities: ActivityItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLogging, setIsLogging] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("WORK");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [productivityRating, setProductivityRating] = useState("3");
  const [energyLevel, setEnergyLevel] = useState("3");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;
    setLoading(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          productivityRating: Number(productivityRating),
          energyLevel: Number(energyLevel),
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal mencatat aktivitas");
      toast("Aktivitas berhasil dicatat", "success");
      setTitle("");
      setStartTime("");
      setEndTime("");
      setNotes("");
      setIsLogging(false);
      router.refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal mencatat aktivitas", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(act: ActivityItem) {
    if (!confirm(`Hapus catatan aktivitas "${act.title}"?`)) return;
    try {
      const res = await fetch(`/api/activities/${act.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal menghapus aktivitas");
      toast("Aktivitas dihapus", "success");
      router.refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal menghapus aktivitas", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">
          Riwayat log aktivitas harian untuk merekam waktu, energi, dan produktivitas Anda.
        </p>
        <button
          onClick={() => setIsLogging(!isLogging)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-all"
        >
          <Icon name={isLogging ? "x" : "plus"} size={16} />
          {isLogging ? "Batal" : "Catat Aktivitas"}
        </button>
      </div>

      {isLogging && (
        <form onSubmit={handleLog} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-surface-900">Catat Aktivitas Baru</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Judul Aktivitas</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Belajar Next.js / Olahraga Pagi"
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="WORK">Kerja (WORK)</option>
                <option value="LEARNING">Belajar (LEARNING)</option>
                <option value="HEALTH_FITNESS">Kesehatan & Kebugaran (HEALTH_FITNESS)</option>
                <option value="PERSONAL">Pribadi (PERSONAL)</option>
                <option value="REST">Istirahat (REST)</option>
                <option value="CHORE">Pekerjaan Rumah (CHORE)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Mulai</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Selesai</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Rating Produktivitas (1-5)</label>
              <select
                value={productivityRating}
                onChange={(e) => setProductivityRating(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="1">1 - Sangat Rendah</option>
                <option value="2">2 - Rendah</option>
                <option value="3">3 - Sedang</option>
                <option value="4">4 - Tinggi</option>
                <option value="5">5 - Sangat Produktif</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Tingkat Energi (1-5)</label>
              <select
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="1">1 - Lelah / Habis</option>
                <option value="2">2 - Lesu</option>
                <option value="3">3 - Normal</option>
                <option value="4">4 - Berenergi</option>
                <option value="5">5 - Penuh Semangat</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">Catatan / Refleksi (Opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan hasil aktivitas..."
              rows={2}
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsLogging(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-surface-600 hover:bg-surface-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !startTime || !endTime}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Aktivitas"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {initialActivities.map((act) => (
          <div
            key={act.id}
            className="rounded-xl border border-surface-200 bg-white p-4 shadow-subtle flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Icon name="clock" size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-bold text-surface-600 uppercase">
                    {act.category}
                  </span>
                  <h4 className="font-bold text-surface-900">{act.title}</h4>
                </div>
                {act.notes && <p className="mt-1 text-xs text-surface-600">{act.notes}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-surface-400">
                  <span>⏱ {act.durationMinutes} menit</span>
                  <span>
                    📅 {new Date(act.startTime).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  {act.productivityRating && <span>⭐ Produktivitas: {act.productivityRating}/5</span>}
                  {act.energyLevel && <span>⚡ Energi: {act.energyLevel}/5</span>}
                  {act.area && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: `${act.area.color}15`, color: act.area.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: act.area.color }} />
                      {act.area.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDelete(act)}
              className="rounded p-1.5 text-surface-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
              title="Hapus aktivitas"
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}

        {initialActivities.length === 0 && !isLogging && (
          <div className="rounded-2xl border border-dashed border-surface-300 p-8 text-center bg-surface-50/50">
            <p className="text-sm font-semibold text-surface-700">Belum ada riwayat aktivitas.</p>
            <p className="mt-1 text-xs text-surface-500">Mulai catat waktu yang Anda investasikan setiap hari.</p>
            <button
              onClick={() => setIsLogging(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              <Icon name="plus" size={14} />
              Catat Aktivitas Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
