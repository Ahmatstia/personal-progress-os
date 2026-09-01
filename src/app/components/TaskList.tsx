"use client";

import { useState } from "react";
import TaskItem from "@/app/components/TaskItem";

type Task = {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  status: string;
  estimatedHours: number;
  actualHours: number;
  notes: string | null;
};

export default function TaskList({ tasks }: { tasks: Task[] }) {
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const filtered = tasks.filter((task) => (status === "ALL" || task.status === status) && (priority === "ALL" || task.priority === priority));

  return (
    <div className="mt-5">
      <div className="mb-3 flex flex-wrap gap-2">
        {[["ALL", "All"], ["NOT_STARTED", "Not Started"], ["IN_PROGRESS", "In Progress"], ["COMPLETED", "Completed"]].map(([value, label]) => <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-lg px-3 py-1.5 text-xs ${status === value ? "bg-white text-slate-950" : "bg-slate-800 text-slate-400"}`}>{label}</button>)}
        <span className="mx-1 hidden border-l border-slate-800 sm:block" />
        {[["ALL", "All priority"], ["HIGH", "High"], ["MEDIUM", "Medium"], ["LOW", "Low"]].map(([value, label]) => <button key={value} type="button" onClick={() => setPriority(value)} className={`rounded-lg px-3 py-1.5 text-xs ${priority === value ? "bg-emerald-200 text-emerald-950" : "bg-slate-800 text-slate-400"}`}>{label}</button>)}
      </div>
      {filtered.length === 0 ? <p className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-600">No tasks match these filters.</p> : <div className="space-y-2">{filtered.map((task) => <TaskItem key={task.id} {...task} />)}</div>}
    </div>
  );
}
