"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { id: string; status: string; name: string; description: string | null; priority: string; estimatedHours: number; notes: string | null };

export default function TaskActions({ id, status, name, description, priority, estimatedHours, notes }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ name, description: description ?? "", priority, estimatedHours: String(estimatedHours), notes: notes ?? "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function patch(body: object) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Task gagal diperbarui.");
      setEditing(false); router.refresh();
    } catch (value) { setError(value instanceof Error ? value.message : "Task gagal diperbarui."); } finally { setLoading(false); }
  }

  if (editing) return <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="grid gap-3 sm:grid-cols-2"><input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="Task name" className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" /><select value={values.priority} onChange={(e) => setValues({ ...values, priority: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select><textarea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} placeholder="Description" className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" /><textarea value={values.notes} onChange={(e) => setValues({ ...values, notes: e.target.value })} placeholder="Notes" className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" /><input type="number" min="0" step="0.5" value={values.estimatedHours} onChange={(e) => setValues({ ...values, estimatedHours: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" /></div>{error && <p className="mt-3 text-sm text-red-400">{error}</p>}<div className="mt-4 flex justify-end gap-2"><button onClick={() => setEditing(false)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancel</button><button onClick={() => patch({ ...values, estimatedHours: Number(values.estimatedHours) })} disabled={loading} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">Save Changes</button></div></div>;

  return <div className="mt-5 flex flex-wrap items-center gap-2">{status === "COMPLETED" ? <button onClick={() => patch({ status: "IN_PROGRESS" })} disabled={loading} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">Reopen</button> : status === "NOT_STARTED" ? <button onClick={() => patch({ status: "IN_PROGRESS" })} disabled={loading} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">Start Working</button> : <button onClick={() => { if (window.confirm(`Complete task "${name}"?`)) patch({ status: "COMPLETED" }); }} disabled={loading} className="rounded-xl bg-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-950">Complete Task</button>}<button onClick={() => setEditing(true)} disabled={loading} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300">Edit Task</button>{error && <p className="w-full text-sm text-red-400">{error}</p>}</div>;
}
