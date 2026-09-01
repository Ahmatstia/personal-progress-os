"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";
import AIInput from "./ai/AIInput";
import AIResponse from "./ai/AIResponse";
import AIConfirmation from "./ai/AIConfirmation";
import AIAmbiguousSelector from "./ai/AIAmbiguousSelector";
import { useToast } from "./ui/Toast";
import {
  resolvePanelState,
  panelStateToMessage,
  EXAMPLE_COMMANDS,
  type AICommandResponse,
  type AIPanelState,
} from "@/ai/command-types";

type AICommandPanelProps = {
  compact?: boolean;
  className?: string;
  initialContext?: { taskId?: string; taskName?: string; goalId?: string; goalName?: string; stageId?: string };
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
      message: "Your session has ended. Please sign in again.",
      interpretation: { input: text, normalizedText: text, intent: "UNKNOWN", confidence: 0, confidenceLevel: "LOW", entities: [], source: "baseline" },
    };
  }
  if (response.status === 400) {
    return {
      success: false,
      code: "INVALID_INPUT",
      message: "That command isn't valid.",
      interpretation: { input: text, normalizedText: text, intent: "UNKNOWN", confidence: 0, confidenceLevel: "LOW", entities: [], source: "baseline" },
    };
  }
  if (response.status === 500) {
    return {
      success: false,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
      interpretation: { input: text, normalizedText: text, intent: "UNKNOWN", confidence: 0, confidenceLevel: "LOW", entities: [], source: "baseline" },
    };
  }
  if (json.success === false && json.error) {
    return {
      success: false,
      code: json.error.code ?? "UNKNOWN_ERROR",
      message: json.error.message ?? "Something went wrong.",
      interpretation: { input: text, normalizedText: text, intent: "UNKNOWN", confidence: 0, confidenceLevel: "LOW", entities: [], source: "baseline" },
    };
  }
  return json as AICommandResponse;
}

export function AICommandPanel({ className = "", initialContext }: AICommandPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [history, setHistory] = useState<{ id: string; input: string; state: AIPanelState; timestamp: Date }[]>([]);
  const [panelState, setPanelState] = useState<AIPanelState>("idle");
  const [currentResponse, setCurrentResponse] = useState<AICommandResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingText, setPendingText] = useState("");
  const [pendingContext, setPendingContext] = useState<{ taskId?: string; taskName?: string; goalId?: string } | undefined>(undefined);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-ai-input]')?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function handleCommand(text: string, confirmed = false, context?: { taskId?: string; taskName?: string; goalId?: string }) {
    setLoading(true);
    setPanelState("loading");
    setCurrentResponse(null);
    try {
      const response = await sendCommand(text, confirmed, context ?? initialContext);
      const state = resolvePanelState(response);
      setCurrentResponse(response);
      setPanelState(state);
      setHistory((prev) => [...prev, { id: crypto.randomUUID(), input: text, state, timestamp: new Date() }]);
      if (state === "success") {
        toast("Done.", "success");
        router.refresh();
      }
    } catch {
      const errorResponse: AICommandResponse = {
        success: false,
        code: "NETWORK_ERROR",
        message: "Couldn't reach the server. Please try again.",
        interpretation: { input: text, normalizedText: text, intent: "UNKNOWN", confidence: 0, confidenceLevel: "LOW", entities: [], source: "baseline" },
      };
      setCurrentResponse(errorResponse);
      setPanelState("error");
      setHistory((prev) => [...prev, { id: crypto.randomUUID(), input: text, state: "error", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!currentResponse) return;
    const entities = currentResponse.interpretation.entities;
    const task = entities.find((e) => e.type === "TASK");
    const goal = entities.find((e) => e.type === "GOAL");
    const context: { taskName?: string; goalName?: string; taskId?: string; goalId?: string } = {};
    if (task) context.taskName = task.value;
    if (goal) context.goalName = goal.value;
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
    handleCommand(history[history.length - 1].input, false);
  }

  function handleExample(example: string) {
    setShowExamples(false);
    handleCommand(example, false);
  }

  const stateTone: Record<string, string> = {
    idle: "border-surface-200",
    loading: "border-surface-200",
    success: "border-success-200 bg-success-50/40",
    confirmation_required: "border-warning-200 bg-warning-50/40",
    ambiguous: "border-warning-200 bg-warning-50/40",
    error: "border-danger-200 bg-danger-50/40",
    not_found: "border-surface-200",
    low_confidence: "border-surface-200",
    unknown: "border-surface-200",
  };

  const showResultState = !["idle", "loading"].includes(panelState);

  return (
    <section className={`space-y-3 ${className}`}>
      <div className={`rounded-2xl border bg-surface-0 p-4 shadow-soft transition-colors ${stateTone[panelState] ?? "border-surface-200"}`}>
        <AIInput onSubmit={(text) => handleCommand(text, false)} disabled={loading} />

        {panelState === "loading" && (
          <div className="mt-3 flex items-center gap-2 text-sm text-surface-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ai-500 border-t-transparent" aria-hidden="true" />
            Working on that…
          </div>
        )}

        {showExamples && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-surface-150 pt-3">
            {EXAMPLE_COMMANDS.map((example) => (
              <button
                key={example}
                onClick={() => handleExample(example)}
                disabled={loading}
                className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-surface-600 transition hover:border-ai-200 hover:bg-ai-50 hover:text-ai-700 disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {!showExamples && !showResultState && (
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => setShowExamples(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ai-600 hover:text-ai-700"
            >
              <Icon name="sparkles" size={13} /> Try an example
            </button>
            {initialContext && (
              <span className="rounded-full bg-ai-50 px-2 py-0.5 text-[11px] font-medium text-ai-600">
                Working with this page
              </span>
            )}
          </div>
        )}

        {showResultState && currentResponse && (
          <div className="animate-in-soft mt-4 border-t border-surface-150 pt-4">
            <AIPanelStateView
              state={panelState}
              response={currentResponse}
              loading={loading}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onAmbiguous={handleAmbiguousSelect}
              onRetry={handleRetry}
              onShowExamples={() => setShowExamples(true)}
            />
          </div>
        )}
      </div>

      {history.length > 0 && panelState !== "idle" && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {[...history].reverse().slice(0, 4).map((entry) => (
            <span
              key={entry.id}
              className={`inline-flex max-w-[180px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                entry.state === "success"
                  ? "border-success-200 text-success-700"
                  : entry.state === "error"
                    ? "border-danger-200 text-danger-600"
                    : "border-surface-200 text-surface-500"
              }`}
            >
              {entry.state === "success" ? (
                <Icon name="check" size={11} />
              ) : entry.state === "error" ? (
                <Icon name="alert" size={11} />
              ) : (
                <Icon name="circle" size={11} />
              )}
              <span className="truncate">{entry.input}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function AIPanelStateView({
  state,
  response,
  loading,
  onConfirm,
  onCancel,
  onAmbiguous,
  onRetry,
  onShowExamples,
}: {
  state: AIPanelState;
  response: AICommandResponse;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onAmbiguous: (taskId: string, taskName: string) => void;
  onRetry: () => void;
  onShowExamples: () => void;
}) {
  if (state === "success") return <AIResponse response={response} />;
  if (state === "confirmation_required")
    return <AIConfirmation response={response} onConfirm={onConfirm} onCancel={onCancel} loading={loading} />;
  if (state === "ambiguous")
    return <AIAmbiguousSelector response={response} onSelect={onAmbiguous} loading={loading} />;
  if (state === "error")
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2.5">
          <Icon name="alert" size={18} className="mt-0.5 text-danger-500" />
          <p className="text-sm text-surface-700">{response.message}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onRetry} loading={loading}>
            Try again
          </Button>
        </div>
      </div>
    );

  const message = panelStateToMessage(state);
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <Icon name="info" size={18} className="mt-0.5 text-surface-400" />
        <div>
          <p className="text-sm font-medium text-surface-800">{message}</p>
          {response.message && response.message !== message && (
            <p className="mt-1 text-sm text-surface-500">{response.message}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" icon="sparkles" onClick={onShowExamples}>
          Show examples
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onCancel()}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
