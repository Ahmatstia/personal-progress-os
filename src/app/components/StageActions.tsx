"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StageActions({ id, name, description, canMoveUp, canMoveDown }: { id: string; name: string; description: string | null; canMoveUp: boolean; canMoveDown: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [stageName, setStageName] = useState(name);
  const [stageDescription, setStageDescription] = useState(description ?? "");
  const [error, setError] = useState("");

  async function patch(body: object) {
    setError("");
    const response = await fetch(`/api/stages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? "Stage gagal diperbarui.");
    router.refresh();
  }

  async function run(body: object) {
    try { await patch(body); setEditing(false); } catch (value) { setError(value instanceof Error ? value.message : "Stage gagal diperbarui."); }
  }

  async function remove() {
    try {
      const response = await fetch(`/api/stages/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Stage gagal dihapus.");
      router.refresh();
    } catch (value) { setError(value instanceof Error ? value.message : "Stage gagal dihapus."); }
  }

  if (editing) return <div className="mt-3 space-y-2"><input value={stageName} onChange={(e) => setStageName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><textarea value={stageDescription} onChange={(e) => setStageDescription(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><div className="flex gap-2"><button onClick={() => run({ name: stageName, description: stageDescription })} className="rounded-lg bg-white px-3 py-1.5 text-xs text-slate-950">Save</button><button onClick={() => setEditing(false)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400">Cancel</button></div>{error && <p className="text-xs text-red-400">{error}</p>}</div>;

  return <div className="flex flex-wrap gap-1"><button disabled={!canMoveUp} onClick={() => run({ order: "up" })} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-800 disabled:opacity-30">↑</button><button disabled={!canMoveDown} onClick={() => run({ order: "down" })} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-800 disabled:opacity-30">↓</button><button onClick={() => setEditing(true)} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-800 hover:text-white">Edit</button><button onClick={() => { if (window.confirm(`Delete stage "${name}"?`)) remove(); }} className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-red-500/10 hover:text-red-400">Delete</button>{error && <p className="w-full text-xs text-red-400">{error}</p>}</div>;
}
