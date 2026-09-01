"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TaskItemProps = {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  status: string;
  estimatedHours?: number;
  notes?: string | null;
};

export default function TaskItem({
  id,
  name,
  description,
  priority,
  status,
  estimatedHours = 0,
  notes = null,
}: TaskItemProps) {
  const router = useRouter();

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: completed ? "NOT_STARTED" : "COMPLETED",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal memperbarui task.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal memperbarui task.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveEdit() {
    if (!editName.trim()) {
      alert("Nama task wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          priority: editPriority,
          estimatedHours: Number(editHours) || 0,
          notes: editNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan perubahan.");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Gagal menyimpan perubahan.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteTask() {
    const confirmed = window.confirm(`Hapus task "${name}"?`);

    if (!confirmed) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus task.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus task.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Task Name
            </label>

            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-slate-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Description
            </label>

            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-slate-600"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Priority
              </label>

              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-400">
                Estimated Hours
              </label>

              <input
                type="number"
                min="0"
                step="0.5"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">
              Notes
            </label>

            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={isLoading}
            className="rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveEdit}
            disabled={isLoading}
            className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-950 hover:bg-slate-200"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
        completed
          ? "border-emerald-500/10 bg-emerald-500/3"
          : "border-slate-800/70 bg-slate-950"
      }`}
    >
      <button
        type="button"
        onClick={toggleTask}
        disabled={isLoading}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            completed
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-slate-700"
          }`}
        >
          {completed && <span className="text-xs font-bold">✓</span>}
        </span>

        <span className="min-w-0">
          <span
            className={`block truncate text-sm ${
              completed ? "text-slate-600 line-through" : "text-slate-300"
            }`}
          >
            {name}
          </span>

          {description && (
            <span className="mt-1 block truncate text-xs text-slate-600">
              {description}
            </span>
          )}
        </span>
      </button>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
          priority === "HIGH"
            ? "bg-red-500/10 text-red-400"
            : priority === "LOW"
              ? "bg-slate-800 text-slate-500"
              : "bg-yellow-500/10 text-yellow-400"
        }`}
      >
        {priority}
      </span>

      <button
        type="button"
        onClick={() => setIsEditing(true)}
        disabled={isLoading}
        className="rounded-lg px-2 py-1 text-xs text-slate-600 opacity-0 transition hover:bg-slate-800 hover:text-white group-hover:opacity-100"
      >
        Edit
      </button>

      <button
        type="button"
        onClick={deleteTask}
        disabled={isLoading}
        className="rounded-lg px-2 py-1 text-xs text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
      >
        Delete
      </button>
    </div>
  );
}
