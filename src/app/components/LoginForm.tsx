"use client";

import { FormEvent, useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Login gagal.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return <form onSubmit={submit} className="mt-6 space-y-4">
    <input name="email" type="email" required defaultValue="dev@example.com" placeholder="Email" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
    <input name="name" placeholder="Nama (opsional)" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400" />
    <div className="relative">
      <input name="accessCode" type={showCode ? "text" : "password"} required defaultValue="development-access-code" placeholder="Access code" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-sm text-white outline-none focus:border-emerald-400" />
      <button type="button" onClick={() => setShowCode(!showCode)} aria-label={showCode ? "Sembunyikan access code" : "Tampilkan access code"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 hover:text-white">{showCode ? <span className="text-sm">Sembunyi</span> : <span className="text-sm">Lihat</span>}</button>
    </div>
    {error && <p className="text-sm text-red-300">{error}</p>}
    <button disabled={busy} className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy ? "Signing in..." : "Sign in"}</button>
  </form>;
}
