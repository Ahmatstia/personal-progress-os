"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AIInput from "./ai/AIInput";
import AIResponse from "./ai/AIResponse";
import AIConfirmation from "./ai/AIConfirmation";
import AIAmbiguousSelector from "./ai/AIAmbiguousSelector";
import {
  resolvePanelState,
  panelStateToMessage,
  EXAMPLE_COMMANDS,
  type AICommandResponse,
  type AIPanelState,
  type AIHistoryEntry,
} from "@/ai/command-types";

type AICommandPanelProps = {
  compact?: boolean;
};

async function sendCommand(text: string, confirmed: boolean, context?: { taskId?: string; taskName?: string; goalId?: string; goalName?: string; stageId?: string }): Promise<AICommandResponse> {
  const response = await fetch("/api/ai/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, confirmed, context }),
  });

  const json = await response.json();

  if (response.status === 401) {
    return {
      success: false,
      code: "UNAUTHENTICATED",
      message: "Session kamu sudah berakhir. Silakan login kembali.",
      interpretation: {
        input: text,
        normalizedText: text,
        intent: "UNKNOWN",
        confidence: 0,
        confidenceLevel: "LOW",
        entities: [],
        source: "baseline",
      },
    };
  }

  if (response.status === 400) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "Perintah tidak valid.",
      interpretation: {
        input: text,
        normalizedText: text,
        intent: "UNKNOWN",
        confidence: 0,
        confidenceLevel: "LOW",
        entities: [],
        source: "baseline",
      },
    };
  }

  if (response.status === 500) {
    return {
      success: false,
      code: "INTERNAL_ERROR",
      message: "Terjadi kesalahan. Coba lagi.",
      interpretation: {
        input: text,
        normalizedText: text,
        intent: "UNKNOWN",
        confidence: 0,
        confidenceLevel: "LOW",
        entities: [],
        source: "baseline",
      },
    };
  }

  if (json.success === false && json.error) {
    return {
      success: false,
      code: json.error.code ?? "UNKNOWN_ERROR",
      message: json.error.message ?? "Terjadi kesalahan.",
      interpretation: {
        input: text,
        normalizedText: text,
        intent: "UNKNOWN",
        confidence: 0,
        confidenceLevel: "LOW",
        entities: [],
        source: "baseline",
      },
    };
  }

  return json as AICommandResponse;
}

export default function AICommandPanel({ compact }: AICommandPanelProps) {
  const router = useRouter();
  const [history, setHistory] = useState<AIHistoryEntry[]>([]);
  const [panelState, setPanelState] = useState<AIPanelState>("idle");
  const [currentResponse, setCurrentResponse] = useState<AICommandResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingText, setPendingText] = useState("");
  const [pendingContext, setPendingContext] = useState<{ taskId?: string; taskName?: string; goalId?: string } | undefined>(undefined);
  const [showExamples, setShowExamples] = useState(false);

  const addHistory = useCallback((entry: AIHistoryEntry) => {
    setHistory((prev) => [...prev, entry]);
  }, []);

  async function handleCommand(text: string, confirmed = false, context?: { taskId?: string; taskName?: string; goalId?: string }) {
    setLoading(true);
    setPanelState("loading");
    setCurrentResponse(null);

    try {
      const response = await sendCommand(text, confirmed, context);
      const state = resolvePanelState(response);

      setCurrentResponse(response);
      setPanelState(state);

      addHistory({
        id: crypto.randomUUID(),
        input: text,
        state,
        response,
        timestamp: new Date(),
      });

      if (state === "success") {
        router.refresh();
      }
    } catch {
      const errorResponse: AICommandResponse = {
        success: false,
        code: "NETWORK_ERROR",
        message: "Gagal terhubung ke server. Coba lagi.",
        interpretation: {
          input: text,
          normalizedText: text,
          intent: "UNKNOWN",
          confidence: 0,
          confidenceLevel: "LOW",
          entities: [],
          source: "baseline",
        },
      };
      setCurrentResponse(errorResponse);
      setPanelState("error");
      addHistory({
        id: crypto.randomUUID(),
        input: text,
        state: "error",
        response: errorResponse,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(text: string) {
    handleCommand(text, false);
  }

  function handleConfirm() {
    if (!currentResponse) return;
    const entities = currentResponse.interpretation.entities;
    const taskEntity = entities.find((e) => e.type === "TASK");
    const goalEntity = entities.find((e) => e.type === "GOAL");

    const context: { taskName?: string; goalName?: string; taskId?: string; goalId?: string } = {};
    if (taskEntity) context.taskName = taskEntity.value;
    if (goalEntity) context.goalName = goalEntity.value;

    if (pendingContext) {
      if (pendingContext.taskId) context.taskId = pendingContext.taskId;
      if (pendingContext.taskName) context.taskName = pendingContext.taskName;
      if (pendingContext.goalId) context.goalId = pendingContext.goalId;
    }

    handleCommand(pendingText || currentResponse.interpretation.input, true, context);
  }

  function handleCancel() {
    setPanelState("idle");
    setCurrentResponse(null);
    setPendingText("");
    setPendingContext(undefined);
  }

  function handleAmbiguousSelect(taskId: string, taskName: string) {
    if (!currentResponse) return;
    const originalText = currentResponse.interpretation.input;
    const intent = currentResponse.interpretation.intent;

    setPendingText(originalText);
    setPendingContext({ taskId, taskName });

    if (["TASK_COMPLETE", "TASK_REOPEN", "SESSION_START", "FOCUS"].includes(intent)) {
      handleCommand(originalText, true, { taskId, taskName });
    } else {
      handleCommand(originalText, false, { taskId, taskName });
    }
  }

  function handleRetry() {
    if (history.length === 0) return;
    const lastEntry = history[history.length - 1];
    handleCommand(lastEntry.input, false);
  }

  function handleExampleClick(example: string) {
    setShowExamples(false);
    handleCommand(example, false);
  }

  const borderColor = panelState === "error"
    ? "border-red-500/30"
    : panelState === "success"
      ? "border-emerald-500/20"
      : "border-slate-800";

  return (
    <section className={`rounded-2xl border ${borderColor} bg-slate-900 p-5 ${compact ? "" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Command</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Tanyakan apa saja</h2>
        </div>
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-800 hover:text-white"
          aria-label="Tampilkan contoh perintah"
        >
          Contoh
        </button>
      </div>

      {showExamples && (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_COMMANDS.map((example) => (
            <button
              key={example}
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-600 hover:text-white disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <AIInput onSubmit={handleSubmit} disabled={loading} />
      </div>

      {panelState === "loading" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Memproses perintah...</span>
        </div>
      )}

      {panelState === "success" && currentResponse && (
        <div className="mt-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
          <AIResponse response={currentResponse} />
        </div>
      )}

      {panelState === "confirmation_required" && currentResponse && (
        <div className="mt-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-4">
          <AIConfirmation
            response={currentResponse}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            loading={loading}
          />
        </div>
      )}

      {panelState === "ambiguous" && currentResponse && (
        <div className="mt-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-4">
          <AIAmbiguousSelector
            response={currentResponse}
            onSelect={handleAmbiguousSelect}
            loading={loading}
          />
        </div>
      )}

      {(panelState === "not_found" || panelState === "low_confidence" || panelState === "unknown") && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-300">{panelStateToMessage(panelState)}</p>
          {currentResponse?.message && currentResponse.message !== panelStateToMessage(panelState) && (
            <p className="mt-2 text-sm text-slate-400">{currentResponse.message}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Lihat contoh perintah
            </button>
          </div>
        </div>
      )}

      {panelState === "error" && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{currentResponse?.message ?? "Terjadi kesalahan."}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRetry}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-600">Riwayat ({history.length})</p>
          <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
            {[...history].reverse().slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-xs text-slate-500">
                <span className="truncate">{entry.input}</span>
                <span className={`shrink-0 rounded-full border px-1.5 py-0.5 ${
                  entry.state === "success"
                    ? "border-emerald-500/20 text-emerald-400"
                    : entry.state === "error"
                      ? "border-red-500/20 text-red-400"
                      : "border-slate-700 text-slate-500"
                }`}>
                  {entry.state === "success" ? "OK" : entry.state === "error" ? "ERR" : entry.state === "confirmation_required" ? "CONF" : entry.state === "ambiguous" ? "?" : entry.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
