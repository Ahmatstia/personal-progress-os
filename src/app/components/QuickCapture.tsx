"use client";

import { useState } from "react";
import { Icon } from "./ui/Icon";
import { useToast } from "./ui/Toast";

export default function QuickCapture() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error();
      setContent("");
      toast("Tersimpan.", "success");
    } catch {
      toast("Gagal menyimpan catatan.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-soft">
      <div className="flex items-center gap-2 text-primary-600">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
          <Icon name="capture" size={16} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Catat cepat</p>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Keluarkan dari pikiran Anda… ide, task, atau catatan."
        rows={3}
        className="mt-3 w-full resize-none rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
      <p className="mt-2 text-xs text-surface-400">
        Tersimpan otomatis ke akun Anda — muncul di daftar &quot;Catatan terbaru&quot; dan aktivitas di Beranda.
      </p>
      <div className="mt-3 flex items-center justify-end">
        <button
          onClick={save}
          disabled={saving || !content.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-40"
        >
          {saving ? "Menyimpan…" : <><Icon name="check" size={16} /> Simpan</>}
        </button>
      </div>
    </section>
  );
}
