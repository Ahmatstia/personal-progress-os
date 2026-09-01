"use client";

import type { AICommandResponse } from "@/ai/command-types";
import { intentToReadable } from "@/ai/command-types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";

type AIConfirmationProps = {
  response: AICommandResponse;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
};

function Preview({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) {
    const first = data[0];
    if (first && typeof first === "object" && "name" in first) {
      const r = first as Record<string, unknown>;
      return (
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-4">
          <p className="font-semibold text-surface-800">{String(r.name)}</p>
          {typeof r.status === "string" && <p className="mt-1 text-xs text-surface-500">Status: {r.status}</p>}
        </div>
      );
    }
    return null;
  }
  const obj = data as Record<string, unknown>;
  if (obj.name !== undefined) {
    return (
      <div className="rounded-xl border border-surface-200 bg-surface-0 p-4">
        <p className="font-semibold text-surface-800">{String(obj.name)}</p>
        {typeof obj.status === "string" && <p className="mt-1 text-xs text-surface-500">Status: {obj.status}</p>}
      </div>
    );
  }
  if (obj.taskName !== undefined) {
    return (
      <div className="rounded-xl border border-surface-200 bg-surface-0 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Task</p>
        <p className="mt-1 font-semibold text-surface-800">{String(obj.taskName)}</p>
      </div>
    );
  }
  return null;
}

export default function AIConfirmation({ response, onConfirm, onCancel, loading }: AIConfirmationProps) {
  const { interpretation, message, data } = response;
  return (
    <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
          <Icon name="alert" size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="warning" icon="alert">
              Perlu konfirmasi
            </Badge>
            <Badge tone="ai">{intentToReadable(interpretation.intent)}</Badge>
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed text-surface-800">{message}</p>
          {data !== undefined && data !== null && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                Ini akan mengubah
              </p>
              <Preview data={data} />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="success" icon="check" onClick={onConfirm} loading={loading}>
              Konfirmasi
            </Button>
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              Batal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
