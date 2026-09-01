"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type StageFormProps = {
  goalId: string;
  nextOrder: number;
};

export default function StageForm({ goalId, nextOrder }: StageFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Nama stage wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/stages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalId,
          name,
          description,
          order: nextOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat stage.");
      }

      setName("");
      setDescription("");
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
        className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
      >
        + Add Stage
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
    >
      <div className="mb-5">
        <h3 className="font-semibold">Add New Stage</h3>

        <p className="mt-1 text-xs text-slate-500">
          Buat tahapan baru untuk goal ini.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="stage-name"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Stage Name
          </label>

          <input
            id="stage-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Contoh: Python Fundamentals"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="stage-description"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Description
          </label>

          <textarea
            id="stage-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Apa yang ingin dicapai pada tahap ini?"
            rows={3}
            disabled={isSubmitting}
            className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-500"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

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
          {isSubmitting ? "Saving..." : "Create Stage"}
        </button>
      </div>
    </form>
  );
}
