"use client";

import type { AICommandResponse } from "@/ai/command-types";

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
        <span className="rounded-full border border-yellow-500/30 px-2 py-0.5 text-xs text-yellow-400">
          Pilih task
        </span>
      </div>

      <p className="text-sm leading-relaxed text-slate-200">{response.message}</p>

      <div className="space-y-2">
        {tasks.map((task, index) => (
          <button
            key={task.id}
            onClick={() => onSelect(task.id, task.name)}
            disabled={loading}
            aria-label={`Pilih task: ${task.name}`}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-left transition hover:border-slate-600 disabled:opacity-50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">{index + 1}.</span>
                <span className="truncate text-sm text-white">{task.name}</span>
              </div>
              {task.stage && (
                <p className="mt-1 truncate pl-5 text-xs text-slate-500">
                  {task.stage.goal?.name}{task.stage.goal ? " · " : ""}{task.stage.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.priority && (
                <span className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-400">
                  {task.priority}
                </span>
              )}
              {task.status && (
                <span className="text-xs text-slate-500">{task.status}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {tasks.length === 0 && (
        <p className="text-sm text-slate-500">Tidak ada task yang tersedia untuk dipilih.</p>
      )}
    </div>
  );
}
