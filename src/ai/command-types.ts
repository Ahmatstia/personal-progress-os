import type { Intent, ConfidenceLevel, Entity } from "./intents";

export type AICommandResponse = {
  success: boolean;
  code: string;
  message: string;
  interpretation: {
    input: string;
    normalizedText: string;
    intent: Intent;
    confidence: number;
    confidenceLevel: ConfidenceLevel;
    entities: Entity[];
    source: "rule" | "baseline" | "future-llm";
  };
  data?: unknown;
  requiresConfirmation?: boolean;
  confirmationToken?: string;
};

export type AIPanelState =
  | "idle"
  | "loading"
  | "success"
  | "confirmation_required"
  | "ambiguous"
  | "not_found"
  | "low_confidence"
  | "unknown"
  | "error";

export type AIHistoryEntry = {
  id: string;
  input: string;
  state: AIPanelState;
  response: AICommandResponse | null;
  timestamp: Date;
};

const CONFIRMATION_INTENTS = new Set([
  "GOAL_CREATE",
  "TASK_CREATE",
  "TASK_COMPLETE",
  "TASK_REOPEN",
  "SESSION_START",
  "SESSION_END",
  "FOCUS",
]);

export function resolvePanelState(response: AICommandResponse): AIPanelState {
  if (!response.success) {
    if (response.code === "SAFE_FALLBACK") return "low_confidence";
    if (response.code === "AMBIGUOUS_TASK") return "ambiguous";
    if (response.code === "TASK_NOT_FOUND" || response.code === "MISSING_GOAL_NAME" || response.code === "MISSING_TASK_CONTEXT") return "not_found";
    if (response.code === "NO_ACTIVE_SESSION") return "not_found";
    if (response.code === "UNSUPPORTED_INTENT") return "unknown";
    if (response.code === "CONFIRMATION_REQUIRED") return "confirmation_required";
    return "error";
  }

  if (response.requiresConfirmation || CONFIRMATION_INTENTS.has(response.interpretation.intent)) {
    if (response.code === "CONFIRMATION_REQUIRED") return "confirmation_required";
  }

  if (response.interpretation.intent === "UNKNOWN") return "unknown";
  if (response.interpretation.confidenceLevel === "LOW") return "low_confidence";

  return "success";
}

export function panelStateToMessage(state: AIPanelState): string {
  switch (state) {
    case "idle":
      return "";
    case "loading":
      return "Memproses...";
    case "success":
      return "";
    case "confirmation_required":
      return "Perintah ini membutuhkan konfirmasi.";
    case "ambiguous":
      return "Ditemukan beberapa pilihan. Pilih satu.";
    case "not_found":
      return "Data yang kamu minta tidak ditemukan.";
    case "low_confidence":
      return "Saya belum cukup yakin dengan maksudmu.";
    case "unknown":
      return "Saya belum cukup yakin dengan maksudmu.";
    case "error":
      return "Terjadi kesalahan. Coba lagi.";
  }
}

export function intentToReadable(intent: Intent): string {
  const map: Record<Intent, string> = {
    TODAY: "Lihat hari ini",
    NEXT_ACTION: "Aksi berikutnya",
    GOAL_STATUS: "Status goal",
    TASK_STATUS: "Status task",
    TASK_SEARCH: "Cari task",
    PROGRESS: "Lihat progress",
    ANALYTICS: "Lihat analytics",
    STREAK: "Lihat streak",
    TIME_SPENT: "Waktu belajar",
    COMPLETION: "Tingkat penyelesaian",
    BOTTLENECK: "Hambatan",
    REVIEW: "Review mingguan",
    REFLECTION: "Refleksi",
    GOAL_CREATE: "Buat goal baru",
    TASK_CREATE: "Buat task baru",
    TASK_COMPLETE: "Selesaikan task",
    TASK_REOPEN: "Buka kembali task",
    SESSION_START: "Mulai sesi",
    SESSION_END: "Akhiri sesi",
    FOCUS: "Fokus hari ini",
    OVERDUE: "Task overdue",
    MOTIVATION: "Motivasi",
    HELP: "Bantuan",
    UNKNOWN: "Tidak diketahui",
  };
  return map[intent] ?? intent;
}

export const EXAMPLE_COMMANDS = [
  "apa yang harus saya kerjakan hari ini?",
  "berapa progress goal saya?",
  "cari task React",
  "tampilkan task overdue",
  "mulai sesi belajar React",
  "selesaikan tugas React",
  "buat goal Belajar Go",
  "tambah task React ke fokus",
  "bantuan",
] as const;
