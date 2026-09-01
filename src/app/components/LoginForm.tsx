"use client";

import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Gagal masuk.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  const inputClass =
    "w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-3 text-sm text-surface-900 outline-none placeholder:text-surface-400 transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-surface-700">Email</span>
        <input name="email" type="email" required defaultValue="dev@example.com" placeholder="you@example.com" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-surface-700">Nama (opsional)</span>
        <input name="name" placeholder="Siapa nama Anda?" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-surface-700">Kode akses</span>
        <div className="relative">
          <input
            name="accessCode"
            type={showCode ? "text" : "password"}
            required
            defaultValue="development-access-code"
            placeholder="Kode akses"
            className={`${inputClass} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            aria-label={showCode ? "Sembunyikan kode akses" : "Tampilkan kode akses"}
            className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-xs font-medium text-surface-500 hover:text-primary-700"
          >
            {showCode ? "Sembunyikan" : "Tampilkan"}
          </button>
        </div>
      </label>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <button
        disabled={busy}
        className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
      >
        {busy ? "Masuk…" : "Masuk"}
      </button>
    </form>
  );
}
