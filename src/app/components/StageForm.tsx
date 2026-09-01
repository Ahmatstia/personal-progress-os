"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";

type StageFormProps = {
  goalId: string;
  nextOrder: number;
};

export default function StageForm({ goalId, nextOrder }: StageFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      toast("Nama stage wajib diisi.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, name, description, order: nextOrder }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal membuat stage.");
      setName("");
      setDescription("");
      setOpen(false);
      toast("Stage ditambahkan.", "success");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal membuat stage.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" icon="plus" size="sm" onClick={() => setOpen(true)}>
        Tambah stage
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah stage baru"
        description="Stage adalah bagian bermakna dari perjalanan goal."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-surface-700">Nama stage</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. Fondasi, Pembuatan, Penyempurnaan"
              required
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-surface-700">Deskripsi</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Apa yang terjadi selama stage ini?"
              rows={3}
              className="w-full resize-none rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)} type="button">
              Batal
            </Button>
            <Button type="submit" icon="check" loading={submitting}>
              Tambah stage
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
