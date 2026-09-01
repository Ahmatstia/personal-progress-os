"use client";

import type { AICommandResponse } from "@/ai/command-types";
import { intentToReadable } from "@/ai/command-types";

type AIConfirmationProps = {
  response: AICommandResponse;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
};

function ConfirmationDataPreview({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    const first = data[0];
    if (first && typeof first === "object" && "name" in first) {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-white">{String((first as Record<string, unknown>).name)}</p>
          {typeof (first as Record<string, unknown>).status === "string" && (
            <p className="mt-1 text-xs text-slate-500">Status: {String((first as Record<string, unknown>).status)}</p>
          )}
        </div>
      );
    }
    return null;
  }

  const obj = data as Record<string, unknown>;
  if ("name" in obj && typeof obj.name === "string") {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-white">{obj.name}</p>
        {typeof obj.status === "string" && (
          <p className="mt-1 text-xs text-slate-500">Status: {obj.status}</p>
        )}
      </div>
    );
  }

  return null;
}

export default function AIConfirmation({ response, onConfirm, onCancel, loading }: AIConfirmationProps) {
  const { interpretation, message, data } = response;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-yellow-500/30 px-2 py-0.5 text-xs text-yellow-400">
          Konfirmasi diperlukan
        </span>
        <span className="text-xs text-slate-500">{intentToReadable(interpretation.intent)}</span>
      </div>

      <p className="text-sm leading-relaxed text-slate-200">{message}</p>

      <ConfirmationDataPreview data={data} />

      <div className="flex gap-3 pt-1">
        <button
          onClick={onConfirm}
          disabled={loading}
          aria-label="Konfirmasi perintah"
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Konfirmasi"}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          aria-label="Batalkan perintah"
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
