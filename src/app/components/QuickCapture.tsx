"use client";

import { useState } from "react";

export default function QuickCapture() {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    const response = await fetch("/api/captures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
    if (response.ok) { setContent(""); setSaved(true); window.setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }
  return <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quick capture</p><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="What are you thinking?" rows={3} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600" /><div className="mt-3 flex items-center justify-between"><span className="text-xs text-emerald-300">{saved ? "Saved" : ""}</span><button onClick={save} disabled={saving || !content.trim()} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div></section>;
}
