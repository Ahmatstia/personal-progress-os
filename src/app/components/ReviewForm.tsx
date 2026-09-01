"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = { id?: string; periodStart: string; periodEnd: string; understanding: number | null; wentWell: string | null; difficulties: string | null; improvements: string | null; nextFocus: string | null };
type Props = { goalId: string; periodStart: string; periodEnd: string; metrics: { learningHours: number; tasksCompleted: number; understanding: number | null }; review: Review | null };

export default function ReviewForm({ goalId, periodStart, periodEnd, metrics, review }: Props) {
  const router = useRouter();
  const [values, setValues] = useState({ wentWell: review?.wentWell ?? "", difficulties: review?.difficulties ?? "", improvements: review?.improvements ?? "", nextFocus: review?.nextFocus ?? "", understanding: review?.understanding ?? metrics.understanding ?? 3 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setSaving(true); setError("");
    try {
      const response = await fetch(review?.id ? `/api/reviews/${review.id}` : `/api/goals/${goalId}/reviews`, { method: review?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ periodStart, periodEnd, ...values }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Review gagal disimpan.");
      router.refresh();
    } catch (value) { setError(value instanceof Error ? value.message : "Review gagal disimpan."); } finally { setSaving(false); }
  }
  const field = (key: "wentWell" | "difficulties" | "improvements" | "nextFocus", placeholder: string) => <textarea value={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value })} placeholder={placeholder} rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-600" />;
  return <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Learning time</p><p className="mt-1 text-xl font-semibold">{metrics.learningHours.toFixed(1)}h</p></div><div><p className="text-xs text-slate-500">Tasks completed</p><p className="mt-1 text-xl font-semibold">{metrics.tasksCompleted}</p></div><div><p className="text-xs text-slate-500">Understanding</p><div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setValues({ ...values, understanding: value })} className={`h-8 w-8 rounded border text-xs ${values.understanding === value ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-slate-700 text-slate-400"}`}>{value}</button>)}</div></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{field("wentWell", "What went well?")}{field("difficulties", "What was difficult?")}{field("improvements", "What should improve?")}{field("nextFocus", "What should I focus on next?")}</div>{error && <p className="mt-3 text-sm text-red-400">{error}</p>}<button onClick={save} disabled={saving} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">{saving ? "Saving..." : "Save Review"}</button></section>;
}
