"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../ui/Icon";
import { EmptyState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";

type Task = { id: string; name: string; priority: string; status: string; stage: { name: string; goal: { name: string } } };
type Focus = { id: string; taskId: string; task: Task };

export function FocusPanel({ focus, available }: { focus: Focus[]; available: Task[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState("");

  async function request(url: string, method: string, body?: object) {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? "Couldn't update focus.");
    router.refresh();
  }

  async function add() {
    if (!selected) return;
    try {
      await request("/api/today/focus", "POST", { taskId: selected });
      setSelected("");
      toast("Added to today’s focus.", "success");
    } catch {
      toast("Couldn't add that task.", "error");
    }
  }

  async function change(id: string, direction: "up" | "down") {
    try {
      await request(`/api/today/focus/${id}`, "PATCH", { direction });
    } catch {
      toast("Couldn't reorder.", "error");
    }
  }

  async function remove(id: string) {
    try {
      await request(`/api/today/focus/${id}`, "DELETE");
      toast("Removed from focus.", "info");
    } catch {
      toast("Couldn't remove.", "error");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-400">Today’s focus</p>
          <h2 className="mt-1 text-lg font-bold text-surface-900">What matters right now</h2>
        </div>
        <span className="shrink-0 rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-surface-600">
          {focus.length} task{focus.length === 1 ? "" : "s"}
        </span>
      </div>

      {focus.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-0">
          <EmptyState
            icon="target"
            title="Choose what matters today"
            description="Add a few tasks below to keep today intentional and focused."
          />
        </div>
      ) : (
        <ol className="space-y-2">
          {focus.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-surface-0 p-3.5 shadow-soft"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/tasks/${item.task.id}`} className="block truncate font-medium text-surface-800 hover:text-primary-700">
                  {item.task.name}
                </Link>
                <p className="mt-0.5 truncate text-xs text-surface-500">
                  {item.task.stage.goal.name} · {item.task.stage.name} · {item.task.priority}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => change(item.id, "up")}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 disabled:opacity-25"
                >
                  <Icon name="chevronUp" size={16} />
                </button>
                <button
                  onClick={() => change(item.id, "down")}
                  disabled={index === focus.length - 1}
                  aria-label="Move down"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 disabled:opacity-25"
                >
                  <Icon name="chevronDown" size={16} />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.task.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-danger-50 hover:text-danger-600"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Add a task to today's focus"
          className="min-w-0 flex-1 rounded-xl border border-surface-200 bg-surface-0 px-3 py-2.5 text-sm text-surface-800 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Add a task to focus…</option>
          {available
            .filter((task) => !focus.some((item) => item.taskId === task.id))
            .map((task) => (
              <option key={task.id} value={task.id}>
                {task.name} · {task.stage.goal.name}
              </option>
            ))}
        </select>
        <button
          onClick={add}
          disabled={!selected}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-40"
        >
          <Icon name="plus" size={16} /> Add
        </button>
      </div>
    </section>
  );
}
