"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/app/components/ui/Icon";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? "Gagal masuk.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border bg-surface-50 px-3.5 py-2.5 text-[13.5px] text-surface-900 outline-none placeholder:text-surface-400 transition-all duration-200 focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100";

  return (
    <form onSubmit={submit} className="mt-5 space-y-3.5">
      <label className="block">
        <span className="mb-1 block text-[12.5px] font-semibold text-surface-600">Email</span>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
          className={`${inputBase} border-surface-200`}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[12.5px] font-semibold text-surface-600">
          Nama <span className="font-normal text-surface-400">(opsional)</span>
        </span>
        <input
          name="name"
          placeholder="Nama Anda"
          className={`${inputBase} border-surface-200`}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[12.5px] font-semibold text-surface-600">Kode akses</span>
        <div className="relative">
          <input
            name="accessCode"
            type={showCode ? "text" : "password"}
            required
            placeholder="Kode akses"
            className={`${inputBase} border-surface-200 pr-14`}
          />
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            aria-label={showCode ? "Sembunyikan kode" : "Tampilkan kode"}
            className="absolute inset-y-0 right-0 flex w-13 items-center justify-center text-[11px] font-semibold text-surface-400 hover:text-primary-600 transition-colors"
          >
            {showCode ? (
              <Icon name="x" size={14} />
            ) : (
              <span>Lihat</span>
            )}
          </button>
        </div>
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2">
          <Icon name="x" size={13} className="shrink-0 text-danger-500" />
          <p className="text-[12.5px] text-danger-600">{error}</p>
        </div>
      )}

      <button
        disabled={busy}
        className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:from-primary-700 hover:to-ai-600 hover:shadow-[var(--shadow-interactive)] disabled:opacity-50 shine-parent active:scale-[0.98]"
      >
        {busy ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Masuk…
          </span>
        ) : (
          "Masuk"
        )}
      </button>
    </form>
  );
}
