"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./ui/Icon";
import { PriorityBadge, StatusBadge } from "./ui/Badge";
import { useToast } from "./ui/Toast";

type TaskItemProps = {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  status: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string | null;
};

export default function TaskItem({
  id,
  name,
  description,
  priority,
  status,
  estimatedHours = 0,
  actualHours = 0,
  notes = null,
}: TaskItemProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [editName, setEditName] = useState(name);
  const [editDescription, setEditDescription] = useState(description ?? "");
  const [editPriority, setEditPriority] = useState(priority);
  const [editHours, setEditHours] = useState(String(estimatedHours));
  const [editNotes, setEditNotes] = useState(notes ?? "");

  const completed = status === "COMPLETED";

  async function toggleTask() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: completed ? "IN_PROGRESS" : status === "NOT_STARTED" ? "IN_PROGRESS" : "COMPLETED",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || data.error || "Gagal memperbarui task.");
      toast(completed ? "Task dibuka kembali." : "Task selesai. Bagus!", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal memperbarui task.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveEdit() {
    if (!editName.trim()) {
      toast("Nama task wajib diisi.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          priority: editPriority,
          estimatedHours: Number(editHours) || 0,
          notes: editNotes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || data.error || "Gagal menyimpan perubahan.");
      setIsEditing(false);
      toast("Task diperbarui.", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan perubahan.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteTask() {
    const confirmed = window.confirm(`Hapus task "${name}"?`);
    if (!confirmed) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghapus task.");
      toast("Task dihapus.", "info");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menghapus task.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-surface-0 p-4 shadow-soft">
        <div className="space-y-3">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nama task"
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-400"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Deskripsi"
            rows={2}
            className="w-full resize-none rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-400"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none"
            >
              <option value="LOW">Rendah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HIGH">Tinggi</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.5"
              value={editHours}
              onChange={(e) => setEditHours(e.target.value)}
              placeholder="Estimasi jam"
              className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-400"
            />
          </div>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Catatan"
            rows={2}
            className="w-full resize-none rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none focus:border-primary-400"
          />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(false)}
            disabled={isLoading}
            className="rounded-lg border border-surface-200 px-3 py-2 text-xs font-medium text-surface-600 hover:bg-surface-100"
          >
            Batal
          </button>
          <button
            onClick={saveEdit}
            disabled={isLoading}
            className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
          >
            {isLoading ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
        completed ? "border-success-200 bg-success-50/50" : "border-surface-200 bg-surface-0 shadow-soft"
      }`}
    >
      <button
        type="button"
        onClick={toggleTask}
        disabled={isLoading}
        aria-label={completed ? `Buka kembali ${name}` : `Ubah status ${name}`}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          completed
            ? "border-success-500 bg-success-500 text-white"
            : "border-surface-300 bg-surface-0 hover:border-primary-400"
        }`}
      >
        {completed && <Icon name="check" size={12} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/tasks/${id}`}
            className={`truncate text-sm font-medium transition ${
              completed ? "text-surface-400 line-through" : "text-surface-800 hover:text-primary-700"
            }`}
          >
            {name}
          </Link>
          {completed ? <StatusBadge status="COMPLETED" /> : <PriorityBadge priority={priority} />}
        </div>
        <p className="mt-0.5 truncate text-xs text-surface-500">
          {actualHours.toFixed(1)}j dipakai · {estimatedHours.toFixed(1)}j estimasi
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
        <Link
          href={`/tasks/${id}`}
          aria-label={`Buka ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-primary-600"
        >
          <Icon name="arrowRight" size={16} />
        </Link>
        <button
          onClick={() => setIsEditing(true)}
          disabled={isLoading}
          aria-label={`Edit ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-800"
        >
          <Icon name="edit" size={15} />
        </button>
        <button
          onClick={deleteTask}
          disabled={isLoading}
          aria-label={`Hapus ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-danger-50 hover:text-danger-600"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </div>
  );
}
