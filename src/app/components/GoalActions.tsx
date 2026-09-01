"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";

export default function GoalActions({ goalId, goalName }: { goalId: string; goalName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Gagal menghapus goal.");
      toast("Goal dihapus.", "info");
      router.push("/goals");
      router.refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Gagal menghapus goal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="danger" icon="trash" size="sm" onClick={() => setOpen(true)}>
        Hapus goal
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Hapus goal "${goalName}"?`}
        description="Seluruh stage, task, sesi fokus, dan review di dalamnya akan ikut terhapus."
      >
        {error && <p className="mb-3 text-sm text-danger-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
            Batal
          </Button>
          <Button variant="danger" icon="trash" onClick={remove} loading={loading}>
            Hapus goal
          </Button>
        </div>
      </Dialog>
    </>
  );
}