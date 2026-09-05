"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/app/components/ui/Icon";
import { useToast } from "@/app/components/ui/Toast";

type ProjectItem = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  targetDate?: string | Date | null;
  goal?: { id: string; title: string } | null;
  area?: { id: string; name: string; color: string } | null;
  _count?: {
    milestones: number;
    tasks: number;
  };
};

type OptionItem = { id: string; title?: string; name?: string };

export function ProjectsManager({
  initialProjects,
  goals,
  areas,
}: {
  initialProjects: ProjectItem[];
  goals: OptionItem[];
  areas: OptionItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalId, setGoalId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          goalId: goalId || null,
          areaId: areaId || null,
          priority,
          targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal membuat project");
      toast("Project berhasil dibuat", "success");
      setTitle("");
      setDescription("");
      setGoalId("");
      setAreaId("");
      setTargetDate("");
      setIsCreating(false);
      router.refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal membuat project", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">
          Proyek adalah inisiatif konkret dengan target dan tonggak capaian (Milestones).
        </p>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-all"
        >
          <Icon name={isCreating ? "x" : "plus"} size={16} />
          {isCreating ? "Batal" : "Project Baru"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-surface-900">Project Baru</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Judul Project</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rebuild Landing Page v2"
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="LOW">Rendah (LOW)</option>
                <option value="MEDIUM">Sedang (MEDIUM)</option>
                <option value="HIGH">Tinggi (HIGH)</option>
                <option value="URGENT">Mendesak (URGENT)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Hubungkan ke Goal (Opsional)</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">-- Tanpa Goal --</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title || g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Hubungkan ke Area (Opsional)</label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">-- Tanpa Area --</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Target Selesai (Opsional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">Deskripsi (Opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rincian lingkup kerja project..."
              rows={2}
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-surface-600 hover:bg-surface-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Project"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialProjects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-subtle hover:border-primary-300 hover:shadow-card transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-surface-600 uppercase">
                  {p.status}
                </span>
                <span className={`text-[11px] font-semibold ${p.priority === "URGENT" || p.priority === "HIGH" ? "text-rose-600" : "text-surface-500"}`}>
                  {p.priority}
                </span>
              </div>
              <h4 className="mt-2.5 font-bold text-surface-900 group-hover:text-primary-600 transition-colors">
                {p.title}
              </h4>
              {p.description && <p className="mt-1 text-xs text-surface-500 line-clamp-2">{p.description}</p>}
            </div>

            <div className="mt-4 pt-3 border-t border-surface-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-surface-400">
                <span>{p._count?.milestones ?? 0} Milestones</span>
                <span>{p._count?.tasks ?? 0} Tasks</span>
              </div>
              {(p.goal || p.area) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.area && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: `${p.area.color}15`, color: p.area.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.area.color }} />
                      {p.area.name}
                    </span>
                  )}
                  {p.goal && (
                    <span className="rounded-full bg-ai-50 px-2 py-0.5 text-[10px] font-medium text-ai-700">
                      🎯 {p.goal.title}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {initialProjects.length === 0 && !isCreating && (
        <div className="rounded-2xl border border-dashed border-surface-300 p-8 text-center bg-surface-50/50">
          <p className="text-sm font-semibold text-surface-700">Belum ada Project terdaftar.</p>
          <p className="mt-1 text-xs text-surface-500">Buat proyek untuk memecah tujuan besar menjadi tonggak capaian yang terukur.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            <Icon name="plus" size={14} />
            Buat Project Pertama
          </button>
        </div>
      )}
    </div>
  );
}
