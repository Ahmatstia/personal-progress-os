"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/app/components/ui/Icon";
import { useToast } from "@/app/components/ui/Toast";

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string | Date;
  endTime: string | Date;
  isAllDay: boolean;
  eventType: string;
  location?: string | null;
  task?: { id: string; title: string } | null;
  project?: { id: string; title: string } | null;
};

export function CalendarManager({ initialEvents }: { initialEvents: EventItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState("PERSONAL");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;
    setLoading(true);
    try {
      const res = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          eventType,
          location: location.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal membuat event");
      toast("Event kalender berhasil dibuat", "success");
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setIsCreating(false);
      router.refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal membuat event", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: EventItem) {
    if (!confirm(`Hapus event "${e.title}"?`)) return;
    try {
      const res = await fetch(`/api/calendar-events/${e.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Gagal menghapus event");
      toast("Event dihapus", "success");
      router.refresh();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Gagal menghapus event", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">
          Jadwal waktu terstruktur untuk alokasi fokus, deadline, dan komitmen pribadi.
        </p>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-all"
        >
          <Icon name={isCreating ? "x" : "plus"} size={16} />
          {isCreating ? "Batal" : "Event Baru"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-surface-900">Event Kalender Baru</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Judul Event</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Sesi Deep Work / Diskusi Roadmap"
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Kategori Event</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="PERSONAL">Pribadi (PERSONAL)</option>
                <option value="WORK">Pekerjaan (WORK)</option>
                <option value="BLOCKED">Fokus Terblokir (BLOCKED)</option>
                <option value="REMINDER">Pengingat (REMINDER)</option>
                <option value="TASK_DEADLINE">Batas Waktu (TASK_DEADLINE)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Waktu Mulai</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1">Waktu Selesai</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">Lokasi / Tautan (Opsional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Google Meet / Ruang Kerja"
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 mb-1">Catatan (Opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rincian agenda..."
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
              disabled={loading || !title.trim() || !startTime || !endTime}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Event"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {initialEvents.map((evt) => (
          <div
            key={evt.id}
            className="rounded-xl border border-surface-200 bg-white p-4 shadow-subtle flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon name="calendar" size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-bold text-surface-600 uppercase">
                    {evt.eventType}
                  </span>
                  <h4 className="font-bold text-surface-900">{evt.title}</h4>
                </div>
                {evt.description && <p className="mt-1 text-xs text-surface-600">{evt.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-surface-400">
                  <span>
                    🕒 {new Date(evt.startTime).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} -{" "}
                    {new Date(evt.endTime).toLocaleTimeString("id-ID", { timeStyle: "short" })}
                  </span>
                  {evt.location && <span>📍 {evt.location}</span>}
                  {evt.project && <span className="text-primary-600">📁 {evt.project.title}</span>}
                  {evt.task && <span className="text-ai-600">✓ {evt.task.title}</span>}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDelete(evt)}
              className="rounded p-1.5 text-surface-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
              title="Hapus event"
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}

        {initialEvents.length === 0 && !isCreating && (
          <div className="rounded-2xl border border-dashed border-surface-300 p-8 text-center bg-surface-50/50">
            <p className="text-sm font-semibold text-surface-700">Belum ada jadwal kalender.</p>
            <p className="mt-1 text-xs text-surface-500">Jadwalkan sesi fokus atau catat agenda penting Anda di sini.</p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              <Icon name="plus" size={14} />
              Jadwalkan Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
