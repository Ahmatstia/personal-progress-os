"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { useToast } from "./ui/Toast";

export default function GoalActionsMenu({
  goalId,
  goalName,
}: {
  goalId: string;
  goalName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menuOpen]);

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
      <div className="relative" ref={menuRef}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Aksi goal"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <Icon name="menu" size={15} />
          <span className="hidden sm:inline ml-1">Aksi</span>
          <Icon name="arrowRight" size={12} className={`transition-transform ${menuOpen ? "rotate-90" : ""}`} />
        </Button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-1.5 min-w-[180px] rounded-xl border border-surface-150 bg-white py-1.5 shadow-pop animate-in-soft"
          >
            <Link
              href={`/goals/${goalId}/reviews`}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-surface-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              <Icon name="sparkles" size={14} className="text-ai-500" />
              Review progres
            </Link>
            <Link
              href={`/dashboard?goalId=${goalId}`}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-surface-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              <Icon name="chart" size={14} className="text-success-600" />
              Lihat analitik
            </Link>
            <div className="my-1 h-px bg-surface-100" aria-hidden />
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-danger-600 hover:bg-danger-50 transition-colors"
            >
              <Icon name="trash" size={14} />
              Hapus goal
            </button>
          </div>
        )}
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={`Hapus goal "${goalName}"?`}
        description="Seluruh stage, task, sesi fokus, dan review di dalamnya akan ikut terhapus."
      >
        {error && <p className="mb-3 text-sm text-danger-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={loading}>
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
