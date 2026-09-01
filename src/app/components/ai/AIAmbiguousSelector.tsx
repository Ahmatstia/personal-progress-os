"use client";

import type { AICommandResponse } from "@/ai/command-types";
import { Badge } from "../ui/Badge";
import { PriorityBadge, StatusBadge } from "../ui/Badge";

type AIAmbiguousSelectorProps = {
  response: AICommandResponse;
  onSelect: (taskId: string, taskName: string) => void;
  loading: boolean;
};

function extractTasks(data: unknown): Array<{ id: string; name: string; status?: string; priority?: string; stage?: { name: string; goal?: { name: string } } }> {
  if (!data || !Array.isArray(data)) return [];
  return data.filter(
    (item): item is { id: string; name: string; status?: string; priority?: string; stage?: { name: string; goal?: { name: string } } } =>
      item != null && typeof item === "object" && "id" in item && "name" in item,
  );
}

export default function AIAmbiguousSelector({ response, onSelect, loading }: AIAmbiguousSelectorProps) {
  const tasks = extractTasks(response.data);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge tone="ai" icon="search">
          Saya menemukan beberapa hasil
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-surface-700">{response.message}</p>

      <div className="space-y-2" role="listbox" aria-label="Pilih task">
        {tasks.map((task, index) => (
          <button
            key={task.id}
            onClick={() => onSelect(task.id, task.name)}
            disabled={loading}
            role="option"
            aria-selected="false"
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-0 px-4 py-3 text-left shadow-soft transition hover:border-primary-300 hover:bg-primary-50/40 disabled:opacity-50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-xs font-bold text-surface-600">
                  {index + 1}
                </span>
                <span className="truncate font-medium text-surface-800">{task.name}</span>
              </div>
              {task.stage && (
                <p className="mt-1 truncate pl-8 text-xs text-surface-500">
                  {task.stage.goal?.name}
                  {task.stage.goal ? " · " : ""}
                  {task.stage.name}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {task.priority && <PriorityBadge priority={task.priority} />}
              {task.status && <StatusBadge status={task.status} />}
            </div>
          </button>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 text-sm text-surface-500">
          Tidak ada task yang cocok untuk dipilih.
        </div>
      )}
    </div>
  );
}
