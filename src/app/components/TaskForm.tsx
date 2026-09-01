"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type TaskFormProps = {
  stageId: string;
};

export default function TaskForm({ stageId }: TaskFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [notes, setNotes] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Nama task wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stageId,
          name,
          description,
          type: "TASK",
          priority,
          estimatedHours: estimatedHours === "" ? 0 : Number(estimatedHours),
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat task.");
      }

      setName("");
      setDescription("");
      setPriority("MEDIUM");
      setEstimatedHours("");
      setNotes("");
      setIsOpen(false);

      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-800 px-4 py-3 text-sm text-slate-500 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white"
      >
        + Add Task
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"
    >
      <div className="mb-5">
        <h4 className="font-semibold">Add New Task</h4>

        <p className="mt-1 text-xs text-slate-500">
          Tentukan pekerjaan konkret untuk stage ini.
        </p>
      </div>

      <div className="space-y-4">
        {/* NAME */}
        <div>
          <label
            htmlFor={`task-name-${stageId}`}
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Task Name
          </label>

          <input
            id={`task-name-${stageId}`}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Pelajari Python Variables"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label
            htmlFor={`task-description-${stageId}`}
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Description
          </label>

          <textarea
            id={`task-description-${stageId}`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Apa yang harus dipelajari atau dikerjakan?"
            rows={3}
            disabled={isSubmitting}
            className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
          />
        </div>

        {/* PRIORITY + HOURS */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`task-priority-${stageId}`}
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Priority
            </label>

            <select
              id={`task-priority-${stageId}`}
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-slate-500"
            >
              <option value="LOW">Low</option>

              <option value="MEDIUM">Medium</option>

              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`task-hours-${stageId}`}
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Estimated Hours
            </label>

            <input
              id={`task-hours-${stageId}`}
              type="number"
              min="0"
              step="0.5"
              value={estimatedHours}
              onChange={(event) => setEstimatedHours(event.target.value)}
              placeholder="Contoh: 2"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
            />
          </div>
        </div>

        {/* NOTES */}
        <div>
          <label
            htmlFor={`task-notes-${stageId}`}
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Notes
          </label>

          <textarea
            id={`task-notes-${stageId}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Catatan tambahan..."
            rows={2}
            disabled={isSubmitting}
            className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-slate-500"
          />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ACTION */}
      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setError("");
          }}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-800 px-4 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}
