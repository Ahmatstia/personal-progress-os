"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Task = { id: string; name: string; priority: string; status: string; stage: { name: string; goal: { name: string } } };
type Focus = { id: string; taskId: string; task: Task };

export default function TodayFocus({ focus, available }: { focus: Focus[]; available: Task[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  async function request(url: string, method: string, body?: object) {
    setError("");
    const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? "Focus gagal diperbarui.");
    router.refresh();
  }
  async function add() { if (!selected) return; try { await request("/api/today/focus", "POST", { taskId: selected }); setSelected(""); } catch (value) { setError(value instanceof Error ? value.message : "Focus gagal ditambahkan."); } }
  async function change(id: string, direction: "up" | "down") { try { await request(`/api/today/focus/${id}`, "PATCH", { direction }); } catch (value) { setError(value instanceof Error ? value.message : "Urutan focus gagal diperbarui."); } }
  async function remove(id: string) { try { await request(`/api/today/focus/${id}`, "DELETE"); } catch (value) { setError(value instanceof Error ? value.message : "Focus gagal dihapus."); } }
  return <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Today&apos;s focus</p><h2 className="mt-2 text-xl font-semibold">Intentional work</h2></div><span className="text-xs text-slate-500">{focus.length} tasks</span></div>{focus.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">No focus tasks yet.</p> : <div className="mt-5 space-y-2">{focus.map((item, index) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"><span className="text-xs text-slate-600">{index + 1}</span><div className="min-w-0 flex-1"><Link href={`/tasks/${item.task.id}`} className="block truncate text-sm text-slate-200 hover:text-white">{item.task.name}</Link><p className="mt-1 truncate text-xs text-slate-600">{item.task.stage.goal.name} · {item.task.stage.name} · {item.task.priority}</p></div><button onClick={() => change(item.id, "up")} disabled={index === 0} className="text-xs text-slate-500 disabled:opacity-20">↑</button><button onClick={() => change(item.id, "down")} disabled={index === focus.length - 1} className="text-xs text-slate-500 disabled:opacity-20">↓</button><button onClick={() => remove(item.id)} className="text-xs text-slate-600 hover:text-red-400">Remove</button></div>)}</div>}<div className="mt-5 flex flex-col gap-2 sm:flex-row"><select value={selected} onChange={(event) => setSelected(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"><option value="">Add an existing task...</option>{available.filter((task) => !focus.some((item) => item.taskId === task.id)).map((task) => <option key={task.id} value={task.id}>{task.name} · {task.stage.goal.name}</option>)}</select><button onClick={add} disabled={!selected} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">Add Focus</button></div>{error && <p className="mt-3 text-sm text-red-400">{error}</p>}</section>;
}
